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
  clips, captions, preset, transition, filter,
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
  useEffect(() => {
    const v = videoRef.current; if (!v || !url) return;
    try { v.load(); } catch { /* ignore */ }
    if (playing) v.play().catch(() => { /* autoplay blocked */ });
  }, [url, playing]);

  // Pause when toggled off.
  useEffect(() => {
    const v = videoRef.current; if (!v) return;
    if (!playing) v.pause();
  }, [playing]);



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
    <div className="relative w-full h-full bg-black overflow-hidden group">
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
          onEnded={handleEnded}
          className="absolute inset-0 w-full h-full object-cover"
          style={filter ? { filter: filter.cssFilter } : undefined}
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
