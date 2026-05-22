import { useEffect, useMemo, useRef, useState } from "react";
import { Play, Pause, ChevronLeft, ChevronRight } from "lucide-react";
import type { CaptionState } from "@/hooks/useEditor";
import type { TextPreset } from "@/data/text-presets";
import type { TransitionId } from "@/data/transitions";
import type { FilterPreset } from "@/data/filters";
import type { StoredClip } from "@/lib/clip-store";

interface Props {
  clips: StoredClip[];
  captions: CaptionState[];
  preset: TextPreset;
  transition: TransitionId;
  /** Per-clip premium effect ids matching the clips array. */
  effectIds?: (string | undefined)[];
  /** Master switch for all premium effects. */
  effectsEnabled?: boolean;
  /** Same colour filter the export will use, so the preview matches. */
  filter?: FilterPreset;
  handle?: string;
  logoUrl?: string | null;
  /** Controlled scene index (e.g. when user taps a scene in the list). */
  activeIdx?: number;
  onSceneChange?: (idx: number) => void;
}

/**
 * DOM-based live preview that mirrors what the final ffmpeg render will look
 * like. No re-encode — instant feedback while the user types.
 */
export function LivePreview({
  clips, captions, preset, transition, filter, effectIds, effectsEnabled = true,
  handle, logoUrl,
  activeIdx, onSceneChange,
}: Props) {
  const [idx, setIdx] = useState(activeIdx ?? 0);
  const [playing, setPlaying] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Sync external scene selection.
  useEffect(() => {
    if (activeIdx !== undefined && activeIdx !== idx) setIdx(activeIdx);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIdx]);

  const clip = clips[idx];
  const url = useMemo(() => (clip ? URL.createObjectURL(clip.blob) : null), [clip]);
  useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);

  // Auto-advance / loop.
  const handleEnded = () => {
    const next = (idx + 1) % Math.max(1, clips.length);
    setIdx(next);
    onSceneChange?.(next);
  };

  // Force the <video> to (re)load and play whenever the source URL changes.
  // Without an explicit load() the element can stay black on first render
  // (the src attribute is set after the element is created and `autoPlay`
  // doesn't always re-trigger on source swaps inside an SPA).
  //
  // iOS Safari blocks autoplay until the user has interacted with the page.
  // To handle that gracefully we retry once after a short delay (sometimes
  // the second attempt lands AFTER the page-level gesture has propagated),
  // and we also surface a "tap to play" affordance below via a click handler
  // on the wrapper.
  useEffect(() => {
    const v = videoRef.current; if (!v || !url) return;
    try { v.load(); } catch { /* ignore */ }
    if (!playing) return;
    const tryPlay = () => v.play().catch(() => { /* will retry on user tap */ });
    tryPlay();
    // Retry once after a short delay — first attempt often happens before
    // the DOM has fully settled after the URL change, second one tends to
    // succeed when autoplay policy allows it.
    const t = window.setTimeout(tryPlay, 120);
    return () => window.clearTimeout(t);
  }, [url, playing]);

  // Pause when toggled off.
  useEffect(() => {
    const v = videoRef.current; if (!v) return;
    if (!playing) v.pause();
  }, [playing]);

  // Any tap inside the preview area also resumes playback. This covers the
  // case where iOS blocked the initial autoplay — the first interaction
  // with our UI is enough to unlock subsequent play() calls.
  const handleWrapperTap = () => {
    const v = videoRef.current;
    if (v && v.paused && playing) {
      v.play().catch(() => { /* still blocked, nothing more we can do */ });
    }
  };



  const cap = captions[idx];
  const captionText = cap?.text?.trim();

  // Build CSS that mirrors the TextPreset (canvas-equivalent rendering).
  const captionStyle: React.CSSProperties = useMemo(() => {
    // Canvas is 1080w; preview is ~250w. Scale font down accordingly.
    const scale = 250 / 1080;
    const s: React.CSSProperties = {
      fontFamily: preset.font,
      fontWeight: preset.weight,
      fontStyle: preset.italic ? "italic" : "normal",
      fontSize: `${preset.size * scale}px`,
      lineHeight: 1.1,
      color: preset.color,
      letterSpacing: preset.letterSpacing ? `${preset.letterSpacing * scale}px` : undefined,
      textTransform: preset.uppercase ? "uppercase" : "none",
      textAlign: "center",
      maxWidth: `${(preset.maxWidth ?? 880) * scale}px`,
      whiteSpace: "pre-wrap",
      wordBreak: "break-word",
      pointerEvents: "none",
    };
    if (preset.bg) {
      s.background = preset.bg;
      s.padding = `${(preset.paddingY ?? 16) * scale}px ${(preset.paddingX ?? 28) * scale}px`;
      s.borderRadius = `${(preset.radius ?? 16) * scale}px`;
    }
    if (preset.shadow) {
      s.textShadow = "0 2px 6px rgba(0,0,0,0.55)";
    }
    if (preset.outline) {
      const w = preset.outline.width * scale;
      const c = preset.outline.color;
      s.WebkitTextStroke = `${w}px ${c}`;
      // -webkit-text-stroke renders the stroke through the fill, so paint the
      // fill on top using paint-order (supported in modern browsers).
      (s as React.CSSProperties & { paintOrder?: string }).paintOrder = "stroke fill";
    }
    return s;
  }, [preset]);

  const positionClass =
    cap?.position === "top"    ? "items-start pt-8"   :
    cap?.position === "center" ? "items-center"        :
                                 "items-end pb-12";

  // Per-scene transition: re-mounts on idx change so the animation re-fires.
  // Durations match the canvas renderer (transitions.ts).
  const sceneAnimClass =
    transition === "fade"   ? "animate-[fadeIn_300ms_ease-out]"   :
    transition === "zoom"   ? "animate-[zoomIn_300ms_ease-out]"   :
    transition === "flash"  ? "animate-[fadeIn_120ms_ease-out]"   :
    transition === "glitch" ? "animate-[glitchIn_280ms_ease-out]" :
    transition === "blur"   ? "animate-[blurIn_380ms_ease-out]"   :
    transition === "slide"  ? "animate-[slideIn_340ms_cubic-bezier(0.22,1,0.36,1)]" :
    transition === "spin"   ? "animate-[spinIn_380ms_cubic-bezier(0.22,1,0.36,1)]"  :
                              "";
  // Flash transition uses an overlay sibling — see render below.
  const showFlash = transition === "flash";

  if (!clip || !url) {
    return (
      <div className="w-full h-full flex items-center justify-center text-white/40 text-[10px] tracking-widest uppercase">
        Fără clip
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-black overflow-hidden group" onPointerDown={handleWrapperTap}>
      <div
        key={`scene-${idx}`}
        className={`absolute inset-0 ${sceneAnimClass}`}
      >
        <video
          ref={videoRef}
          src={url}
          autoPlay={playing}
          muted
          playsInline
          {...{ "webkit-playsinline": "true", "x5-playsinline": "true" } as Record<string, string>}
          controls={false}
          disablePictureInPicture
          disableRemotePlayback
          controlsList="nodownload nofullscreen noremoteplayback noplaybackrate"
          onEnded={handleEnded}
          onClick={(e) => e.preventDefault()}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
          style={filter ? { filter: filter.cssFilter, WebkitTouchCallout: "none" } : { WebkitTouchCallout: "none" }}
        />
        {/* Vignette + tint, matching the canvas renderer. Pointer-events
            off so the side controls still work. */}
        {filter?.tint && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: filter.tint.color, opacity: filter.tint.alpha }}
          />
        )}
        {filter?.vignette && filter.vignette > 0 && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,${filter.vignette}) 100%)`,
            }}
          />
        )}
        {/* Highlight boost — "screen" blend mode brightens highlights
            (hair gloss, skin shine) without affecting shadows. */}
        {filter?.highlightBoost && filter.highlightBoost > 0 && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: "rgba(255, 250, 240, 1)",
              opacity: filter.highlightBoost,
              mixBlendMode: "screen",
            }}
          />
        )}
        {/* Premium per-shot effect (sparkle / leak / bokeh / dust).
            Matches the canvas export 1:1 in look and timing. */}
        {effectsEnabled && effectIds && (
          <PremiumEffect kind={effectIds[idx]} />
        )}
      </div>
      {/* White flash overlay — fires per scene change. */}
      {showFlash && (
        <div
          key={`flash-${idx}`}
          className="absolute inset-0 bg-white pointer-events-none animate-[flashOverlay_180ms_ease-out]"
        />
      )}


      {/* Caption overlay */}
      {captionText && (
        <div className={`absolute inset-0 flex justify-center px-3 ${positionClass}`}>
          <span
            key={`c-${idx}-${captionText}`}
            style={captionStyle}
            className="animate-[fadeIn_280ms_ease-out]"
          >
            {captionText}
          </span>
        </div>
      )}

      {/* Watermark */}
      {(handle || logoUrl) && (
        <div className="absolute bottom-2 right-2 flex items-center gap-1 opacity-85">
          {handle && (
            <span
              className="text-white text-[10px] font-semibold drop-shadow"
              style={{ textShadow: "0 1px 4px rgba(0,0,0,0.7)" }}
            >
              {handle.startsWith("@") ? handle : `@${handle}`}
            </span>
          )}
          {logoUrl && <img src={logoUrl} alt="" className="w-4 h-4 object-contain" />}
        </div>
      )}

      {/* Scene dots */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 flex gap-1">
        {clips.map((_, i) => (
          <button
            key={i}
            onClick={() => { setIdx(i); onSceneChange?.(i); }}
            className={`h-[3px] rounded-full transition-all ${i === idx ? "w-5 bg-[#E8D5B5]" : "w-2 bg-white/35"}`}
            aria-label={`Scena ${i + 1}`}
          />
        ))}
      </div>

      {/* Side controls */}
      <button
        onClick={() => { const n = (idx - 1 + clips.length) % clips.length; setIdx(n); onSceneChange?.(n); }}
        className="absolute left-1 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 text-white/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
        aria-label="Anterior"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      <button
        onClick={() => { const n = (idx + 1) % clips.length; setIdx(n); onSceneChange?.(n); }}
        className="absolute right-1 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 text-white/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
        aria-label="Următor"
      >
        <ChevronRight className="w-4 h-4" />
      </button>

      {/* Bottom controls */}
      <div className="absolute bottom-2 left-2 flex gap-1">
        <button
          onClick={() => setPlaying((p) => !p)}
          className="w-7 h-7 rounded-full bg-black/40 text-white flex items-center justify-center"
          aria-label={playing ? "Pauză" : "Play"}
        >
          {playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
        </button>

      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
 * PREMIUM EFFECT OVERLAY — preview-side
 *
 * Matches drawPremiumEffect in browser-renderer.ts (gold palette,
 * timing, density). DOM/CSS-based — performant, smooth, no canvas
 * overhead in the preview.
 * ════════════════════════════════════════════════════════════════════ */
function PremiumEffect({ kind }: { kind?: string }) {
  if (!kind || kind === "none") return null;
  switch (kind) {
    case "sparkle":  return <SparkleEffect />;
    case "leak":     return <LightLeakEffect />;
    case "bokeh":    return <BokehEffect />;
    case "dust":     return <GoldDustEffect />;
    default:         return null;
  }
}

function SparkleEffect() {
  // 5 staggered sparkles — visible without overwhelming. Sized to feel
  // like accents on the highlights, not a full overlay.
  const positions = [
    { top: "22%", left: "28%", size: 22, delay: 0 },
    { top: "38%", left: "62%", size: 17, delay: 220 },
    { top: "55%", left: "34%", size: 24, delay: 440 },
    { top: "30%", left: "70%", size: 18, delay: 660 },
    { top: "62%", left: "60%", size: 20, delay: 880 },
  ];
  return (
    <div className="absolute inset-0 pointer-events-none">
      {positions.map((p, i) => (
        <svg
          key={i}
          width={p.size}
          height={p.size}
          viewBox="0 0 24 24"
          style={{
            position: "absolute",
            top: p.top,
            left: p.left,
            animation: "rdp-sparkle 1.1s ease-in-out infinite",
            animationDelay: `${p.delay}ms`,
            filter: "drop-shadow(0 0 5px rgba(244,228,193,0.7)) drop-shadow(0 0 10px rgba(244,228,193,0.25))",
          }}
        >
          <path
            d="M12 0 L13.5 10.5 L24 12 L13.5 13.5 L12 24 L10.5 13.5 L0 12 L10.5 10.5 Z"
            fill="rgba(244,228,193,0.95)"
          />
        </svg>
      ))}
      <style>{`
        @keyframes rdp-sparkle {
          0%, 100% { opacity: 0; transform: scale(0.4); }
          40%, 60% { opacity: 0.85; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}

function LightLeakEffect() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <div
        style={{
          position: "absolute",
          top: "18%",
          left: "-15%",
          width: "45%",
          height: "55%",
          background: "radial-gradient(ellipse, rgba(244,220,170,0.55) 0%, rgba(232,180,110,0.25) 40%, transparent 70%)",
          animation: "rdp-leak 4s ease-in-out infinite",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: "55%",
          left: "60%",
          width: "50%",
          height: "55%",
          background: "radial-gradient(ellipse, rgba(255,200,140,0.5) 0%, rgba(232,150,90,0.22) 50%, transparent 75%)",
          animation: "rdp-leak 4s ease-in-out infinite",
          animationDelay: "2s",
        }}
      />
      <style>{`
        @keyframes rdp-leak {
          0%, 100% { opacity: 0; transform: translateX(-10px); }
          25%, 75% { opacity: 1; transform: translateX(10px); }
        }
      `}</style>
    </div>
  );
}

function BokehEffect() {
  const circles = [
    { top: "8%",  left: "5%",  size: "26%", delay: 0 },
    { top: "60%", left: "75%", size: "32%", delay: 800 },
    { top: "18%", left: "82%", size: "18%", delay: 1600 },
    { top: "78%", left: "15%", size: "22%", delay: 2400 },
  ];
  return (
    <div className="absolute inset-0 pointer-events-none">
      {circles.map((c, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            top: c.top,
            left: c.left,
            width: c.size,
            aspectRatio: "1",
            background: "radial-gradient(circle, rgba(244,228,193,0.55) 0%, rgba(232,180,120,0.22) 55%, transparent 80%)",
            borderRadius: "50%",
            animation: "rdp-bokeh 3s ease-in-out infinite",
            animationDelay: `${c.delay}ms`,
          }}
        />
      ))}
      <style>{`
        @keyframes rdp-bokeh {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50%      { opacity: 0.65; transform: scale(1.06); }
        }
      `}</style>
    </div>
  );
}

function GoldDustEffect() {
  // 9 particles falling slowly. Positions stable per index.
  const particles = Array.from({ length: 9 }, (_, i) => ({
    left: `${5 + ((i * 11.3) % 90)}%`,
    size: 1.5 + (i % 2) * 0.5,
    delay: i * 380,
    color: i % 2 === 0 ? "#F4E4C1" : "#E8D5B5",
  }));
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map((p, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            top: "-2%",
            left: p.left,
            width: `${p.size}px`,
            height: `${p.size}px`,
            borderRadius: "50%",
            background: p.color,
            animation: "rdp-dust 3.5s linear infinite",
            animationDelay: `${p.delay}ms`,
          }}
        />
      ))}
      <style>{`
        @keyframes rdp-dust {
          0%   { transform: translateY(0); opacity: 0; }
          15%  { opacity: 0.7; }
          85%  { opacity: 0.7; }
          100% { transform: translateY(110%); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
