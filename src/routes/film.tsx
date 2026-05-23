import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Camera, Smartphone, ChevronLeft, ChevronRight, ArrowRight, Check, RefreshCw, Square, Upload, AlertCircle, Sparkles, Package, Play, ListChecks } from "lucide-react";
import { PhoneShell } from "@/components/PhoneShell";
import { CinematicBg } from "@/components/CinematicBg";
import { getSelectedScenario, getSelectedIdeaId } from "@/lib/selected-idea";
import { getDifficulty, DIFFICULTIES, getMaterials } from "@/data/scenarios";
import { useCamera } from "@/hooks/useCamera";
import { useRecorder } from "@/hooks/useRecorder";
import { saveClip, listClips } from "@/lib/clip-store";
import { playCountdown, playRecordStart, playRecordStop, playSuccess, playNavForward } from "@/lib/ui-sound";
import beforeImg from "@/assets/template-before.jpg";
import afterImg from "@/assets/template-after.jpg";

export const Route = createFileRoute("/film")({
  component: Film,
});

function Film() {
  const scenario = useMemo(() => getSelectedScenario(), []);
  const scenarioId = useMemo(() => getSelectedIdeaId(), []);
  const scenes = scenario.scenes;
  const materials = useMemo(() => getMaterials(scenario), [scenario]);
  const filmingTools = scenario.tools ?? [];
  const totalDuration = useMemo(
    () => scenes.reduce((sum, s) => sum + s.duration, 0),
    [scenes],
  );
  const diff = useMemo(() => getDifficulty(scenario), [scenario]);
  const diffMeta = DIFFICULTIES[diff];
  const diffDots = diff === "easy" ? 1 : diff === "medium" ? 2 : 3;
  const diffTone =
    diff === "easy" ? "text-emerald-300/90"
    : diff === "medium" ? "text-[#E8D5B5]"
    : "text-rose-300/90";

  /** overview → materials → film */
  const totalSteps = 2;
  const [phase, setPhase] = useState<"overview" | "materials" | "film">("overview");
  const [idx, setIdx] = useState(0);
  const [t, setT] = useState(0);
  const [captured, setCaptured] = useState<Set<number>>(new Set());
  const [showGuide, setShowGuide] = useState(true);
  /** 3-2-1 countdown before recording. null = inactive. */
  const [countdown, setCountdown] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const nav = useNavigate();
  const scene = scenes[idx];

  const cam = useCamera("user");
  const rec = useRecorder();
  const tickRef = useRef<number | null>(null);
  const countdownRef = useRef<number | null>(null);

  // Initial load: which scenes already have clips?
  useEffect(() => {
    listClips(scenarioId).then((cs) =>
      setCaptured(new Set(cs.map((c) => c.sceneIdx))),
    );
  }, [scenarioId]);

  // Stop camera on unmount. We do NOT auto-start: getUserMedia must be
  // triggered by a real user gesture, otherwise the browser (especially
  // inside iframes / previews) silently blocks the request.
  useEffect(() => {
    return () => cam.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Timer driven by recorder state
  useEffect(() => {
    if (rec.state !== "recording") {
      if (tickRef.current) cancelAnimationFrame(tickRef.current);
      return;
    }
    const start = performance.now();
    setT(0);
    const tick = (now: number) => {
      const elapsed = (now - start) / 1000;
      if (elapsed >= scene.duration) {
        setT(scene.duration);
        void handleStop();
        return;
      }
      setT(elapsed);
      tickRef.current = requestAnimationFrame(tick);
    };
    tickRef.current = requestAnimationFrame(tick);
    return () => {
      if (tickRef.current) cancelAnimationFrame(tickRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rec.state, scene.duration]);

  // Pressing record starts a calm 3-2-1 countdown, THEN recording.
  // A countdown removes the "did it start? am I being filmed yet?"
  // anxiety — the pro knows exactly when to begin.
  const beginRecording = () => {
    if (cam.state !== "ready" || !cam.streamRef.current) return;
    setCountdown(null);
    playRecordStart();
    rec.start(cam.streamRef.current);
  };

  const handleStart = () => {
    if (cam.state !== "ready" || !cam.streamRef.current) return;
    setShowGuide(false);
    setCountdown(3);
  };

  const cancelCountdown = () => {
    if (countdownRef.current) clearTimeout(countdownRef.current);
    countdownRef.current = null;
    setCountdown(null);
    setShowGuide(true);
  };

  // Drive the 3-2-1 countdown.
  useEffect(() => {
    if (countdown === null) return;
    if (countdown <= 0) {
      beginRecording();
      return;
    }
    playCountdown();
    countdownRef.current = window.setTimeout(
      () => setCountdown((c) => (c === null ? null : c - 1)),
      1000,
    );
    return () => {
      if (countdownRef.current) clearTimeout(countdownRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countdown]);

  const handleStop = async () => {
    console.log("[film] handleStop: scenarioId=", scenarioId, "sceneIdx=", idx);
    const result = await rec.stop();
    console.log("[film] rec.stop result:", result ? `blob ${result.blob.size}B` : "null");
    if (result) {
      try {
        await saveClip({
          scenarioId,
          sceneIdx: idx,
          blob: result.blob,
          mimeType: result.mimeType,
          duration: t || scene.duration,
          finalUsageDuration: scene.finalUsageDuration,
          createdAt: Date.now(),
        });
        console.log("[film] saveClip OK for", scenarioId, idx);
      } catch (err) {
        console.error("[film] saveClip FAILED:", err);
      }
    }
    playRecordStop();
    setCaptured((s) => new Set(s).add(idx));
    playSuccess();
    setT(0);
    setShowGuide(true);
  };

  const handleFallbackUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await saveClip({
      scenarioId,
      sceneIdx: idx,
      blob: file,
      mimeType: file.type || "video/mp4",
      duration: scene.duration,
      finalUsageDuration: scene.finalUsageDuration,
      createdAt: Date.now(),
    });
    setCaptured((s) => new Set(s).add(idx));
    e.target.value = "";
  };

  const prev = () => {
    if (rec.state === "recording") rec.cancel();
    setT(0); setShowGuide(true);
    setIdx((p) => Math.max(0, p - 1));
  };
  const next = () => {
    if (rec.state === "recording") rec.cancel();
    playNavForward();
    setT(0); setShowGuide(true);
    if (idx === scenes.length - 1) nav({ to: "/editing" });
    else setIdx((p) => p + 1);
  };

  const isRecording = rec.state === "recording";
  const sceneCaptured = captured.has(idx);
  const allDone = scenes.every((_, i) => captured.has(i));

  // ---------- Intro: Ce vei obține ----------
  if (phase === "overview") {
    // Detect if this is a transformation template — show split before/after.
    // Heuristic: scenario id or title contains "transform". For now, always
    // show the split on the demo template. Other templates fall back to a
    // single cinematic image with Ken Burns.
    const isTransformation =
      /transform/i.test(scenario.id ?? "") || /transform/i.test(scenario.title);

    return (
      <PhoneShell>
        {/* Solid midnight base — the split image sits on top of this. */}
        <div className="absolute inset-0 bg-[#0F1419]" />

        {/* TOP — image at top 60% of the screen. The bottom 40% is clean
            midnight where the text lives. */}
        <div className="absolute top-0 left-0 right-0 h-[60%] overflow-hidden">
          {isTransformation ? (
            <>
              {/* BEFORE — fills the whole area as the base layer. */}
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${beforeImg})` }}
              />
              {/* AFTER — clipped from the right side, sweeping left to right
                  to reveal more "after" then receding back. The clip-path
                  animation makes a slow editorial slider. */}
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{
                  backgroundImage: `url(${afterImg})`,
                  animation: "ba-sweep 9s ease-in-out infinite",
                }}
              />
              {/* The vertical separator line that follows the clip edge.
                  Pure decoration — same animation curve so it stays glued. */}
              <div
                className="absolute top-0 bottom-0 w-px bg-[#E8D5B5]/40"
                style={{
                  animation: "ba-line 9s ease-in-out infinite",
                  boxShadow: "0 0 12px rgba(232,213,181,0.5)",
                }}
              />
            </>
          ) : (
            // Non-transformation templates: single image with Ken Burns.
            <div
              className="absolute inset-0 bg-cover bg-center ken-burns"
              style={{
                backgroundImage: `url(${scenario.image ?? scene.bg})`,
              }}
            />
          )}
          {/* Gradient that melts the image into the dark canvas below.
              Strong toward the bottom so the transition is invisible. */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#0F1419]" />
        </div>

        {/* HEADER — sits on top of the image. */}
        <div className="absolute top-0 left-0 right-0 px-5 pt-12 z-20">
          <div className="flex items-center justify-between">
            <button
              onClick={() => nav({ to: "/generating" })}
              className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center"
              aria-label="Înapoi"
            >
              <ChevronLeft className="w-4 h-4 text-white" />
            </button>
            <span
              className="text-[10px] tracking-[0.4em] uppercase text-[#E8D5B5] font-medium"
              style={{ textShadow: "0 1px 6px rgba(0,0,0,0.6)" }}
            >
              Pasul · 01
            </span>
            <span className="w-9" />
          </div>
        </div>

        {/* MAIN CONTENT — sits in the clean dark zone below the image,
            starting right where the gradient melts into black. Left-aligned
            for editorial readability (centered text gets lost on dark). */}
        <div className="relative z-10 h-full flex flex-col pb-6">
          <div className="flex-1 min-h-0 flex flex-col px-6 pt-[60%] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden overflow-y-auto">
            <div>
              {/* Metadata pills — orient the user immediately. */}
              <div className="flex items-center gap-1.5 mb-4">
                <span
                  className="text-[9px] tracking-[0.3em] uppercase text-white/65 px-2 py-1 rounded-full border border-white/15"
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  {scenes.length} scene
                </span>
                <span
                  className="text-[9px] tracking-[0.3em] uppercase text-white/65 px-2 py-1 rounded-full border border-white/15"
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  {totalDuration} sec
                </span>
                <span
                  className={`text-[9px] tracking-[0.3em] uppercase px-2 py-1 rounded-full border border-white/15 ${diffTone}`}
                  title={diffMeta.desc}
                >
                  {diffMeta.short}
                </span>
              </div>

              {/* Descriptive eyebrow. */}
              <p className="text-[9px] tracking-[0.4em] uppercase text-[#E8D5B5]/75 font-medium mb-2.5">
                Transformare wow
              </p>

              {/* Medium title with one word in italic gold. */}
              <h1
                className="font-editorial text-white"
                style={{ fontSize: "26px", lineHeight: 1.05, letterSpacing: "-0.025em" }}
              >
                {(() => {
                  const t = scenario.title;
                  const m = t.match(/(.*?)(transformar[a-z]*)(.*)/i);
                  if (m) {
                    return (
                      <>
                        {m[1]}
                        <em className="italic text-[#E8D5B5] font-editorial">
                          {m[2]}
                        </em>
                        {m[3]}
                      </>
                    );
                  }
                  return t;
                })()}
              </h1>

              {/* Description — primary readable content. */}
              {scenario.description && (
                <p className="text-white/65 text-[13px] mt-4 leading-relaxed">
                  {scenario.description}
                </p>
              )}
            </div>

            {/* Editorial quote — anchored at the bottom of the scroll area
                via `mt-auto`. Skipped when the goal duplicates the
                description (the template adapter sometimes copies it). */}
            {scenario.goal &&
              scenario.goal.trim() &&
              scenario.goal.trim() !== scenario.description?.trim() && (
                <div className="mt-auto pt-8 pb-2">
                  <div
                    className="h-px"
                    style={{
                      background:
                        "linear-gradient(90deg, transparent, rgba(232,213,181,0.3), transparent)",
                    }}
                  />
                  <p className="font-editorial italic text-[#E8D5B5]/75 text-[12px] leading-relaxed text-center my-3 px-2">
                    „{scenario.goal}"
                  </p>
                  <div
                    className="h-px"
                    style={{
                      background:
                        "linear-gradient(90deg, transparent, rgba(232,213,181,0.3), transparent)",
                    }}
                  />
                </div>
              )}
          </div>

          <div className="px-5 pt-3 shrink-0">
            <button
              onClick={() => setPhase("materials")}
              className="w-full h-14 rounded-full bg-gradient-to-r from-[#F4E4C1] via-[#E8D5B5] to-[#D4AF37] text-[#0F1419] font-semibold uppercase tracking-[0.15em] text-xs shadow-[0_4px_24px_rgba(244,228,193,0.4)] active:scale-[0.98] flex items-center justify-center gap-2"
            >
              Continuă <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <style>{`
          /* The "after" image is revealed via clip-path. The clip oscillates
             across the X axis to mimic a slow before/after slider. */
          @keyframes ba-sweep {
            0%, 100% { clip-path: inset(0 65% 0 0); }
            50%      { clip-path: inset(0 25% 0 0); }
          }
          /* The vertical separator follows the right edge of the clipped
             "after" image. Position values match the clip-path inset (right
             value). Subtle glow keeps it editorial, not technical. */
          @keyframes ba-line {
            0%, 100% { right: 65%; }
            50%      { right: 25%; }
          }
        `}</style>
      </PhoneShell>
    );
  }

  // ---------- Intro: De ce ai nevoie ----------
  if (phase === "materials") {
    return (
      <PhoneShell>
        <CinematicBg src={scenario.image ?? scene.bg} blur overlay={0.78} kenBurns={false} />
        <div className="relative z-10 flex flex-col h-full px-5 pt-12 pb-6">
          <div className="flex items-center justify-between px-1">
            <button
              onClick={() => setPhase("overview")}
              className="w-10 h-10 rounded-full glass flex items-center justify-center"
              aria-label="Înapoi"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-[10px] tracking-[0.4em] uppercase text-[#E8D5B5] font-semibold">
              Pasul 2 din {totalSteps}
            </span>
            <span className="w-10" />
          </div>

          <div className="mt-7 px-1">
            <span className="inline-flex items-center gap-1.5 text-[10px] tracking-[0.3em] uppercase text-[#E8D5B5]/90 font-semibold">
              <Package className="w-3 h-3" /> De ce ai nevoie
            </span>
            <h1 className="font-display text-[34px] leading-[1.05] text-white mt-3 tracking-[-0.02em]">
              Ai nevoie doar de <em className="italic font-editorial text-[#E8D5B5]">atât</em>.
            </h1>
            <p className="text-white/65 text-[13px] mt-3 leading-relaxed">
              Pregătește-le pentru filmare. Restul faci ca de obicei.
            </p>
          </div>

          <div className="mt-4 flex-1 min-h-0 overflow-y-auto -mx-1 px-1 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {filmingTools.length > 0 ? (
              <div className="grid grid-cols-1 gap-2">
                {filmingTools.map((tool) => (
                  <div key={tool} className="glass-lux rounded-xl px-4 py-3 flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-[#E8D5B5]/15 flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5 text-[#E8D5B5]" strokeWidth={3} />
                    </div>
                    <span className="text-white text-[13px]">{tool}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-white/55 text-[13px] text-center mt-8">
                Nu ai nevoie de echipament special. Doar telefonul tău.
              </p>
            )}
          </div>

          <button
            onClick={() => setPhase("film")}
            className="mt-3 w-full h-14 rounded-full bg-gradient-to-r from-[#F4E4C1] via-[#E8D5B5] to-[#D4AF37] text-[#0F1419] font-semibold uppercase tracking-[0.15em] text-xs shadow-[0_4px_24px_rgba(244,228,193,0.4)] active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <><Play className="w-4 h-4 fill-current" /> Sunt pregătit, începem</>
          </button>
        </div>
      </PhoneShell>
    );
  }

  // ---------- Intro: Pregătește filmarea (checklist + tip) ----------


  // ---------- Film: scene-by-scene ----------
  return (
    <PhoneShell>
      {/* Live camera background */}
      <video
        ref={cam.videoRef}
        playsInline
        autoPlay
        muted
        className={`absolute inset-0 w-full h-full object-cover ${cam.facing === "user" ? "scale-x-[-1]" : ""}`}
      />
      {/* Dim overlay so UI is readable */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80 pointer-events-none" />

      {/* 3-2-1 countdown — calm, full-screen, impossible to miss */}
      {countdown !== null && countdown > 0 && (
        <button
          onClick={cancelCountdown}
          className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#0F1419]/80 backdrop-blur-lg"
          aria-label="Anulează countdown"
        >
          <span className="text-[10px] tracking-[0.5em] uppercase text-[#E8D5B5]/90 font-semibold">
            Pregătește-te
          </span>
          <span
            key={countdown}
            className="text-9xl font-bold text-[#E8D5B5] animate-fade-in mt-2"
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            {countdown}
          </span>
          <span className="mt-4 text-[11px] tracking-widest uppercase text-white/55">
            Atinge ca să anulezi
          </span>
        </button>
      )}
      {showGuide && !isRecording && (
        <div className="absolute inset-0 opacity-25 pointer-events-none">
          <CinematicBg src={scene.bg} blur overlay={0.0} kenBurns={false} />
        </div>
      )}

      {/* Framing guide — rule-of-thirds + corner brackets, only while camera is live */}
      {cam.state === "ready" && (
        <div className="absolute inset-0 pointer-events-none z-[5]">
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            {/* rule of thirds */}
            <g stroke="white" strokeOpacity={isRecording ? 0.18 : 0.28} strokeWidth="0.15" vectorEffect="non-scaling-stroke">
              <line x1="33.33" y1="0" x2="33.33" y2="100" />
              <line x1="66.66" y1="0" x2="66.66" y2="100" />
              <line x1="0" y1="33.33" x2="100" y2="33.33" />
              <line x1="0" y1="66.66" x2="100" y2="66.66" />
            </g>
          </svg>
          {/* corner brackets */}
          <div className="absolute top-20 left-4 w-6 h-6 border-l-2 border-t-2 border-[#E8D5B5]/70 rounded-tl" />
          <div className="absolute top-20 right-4 w-6 h-6 border-r-2 border-t-2 border-[#E8D5B5]/70 rounded-tr" />
          <div className="absolute bottom-44 left-4 w-6 h-6 border-l-2 border-b-2 border-[#E8D5B5]/70 rounded-bl" />
          <div className="absolute bottom-44 right-4 w-6 h-6 border-r-2 border-b-2 border-[#E8D5B5]/70 rounded-br" />
          {/* persistent scene badge */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm flex items-center gap-1.5">
            {isRecording && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />}
            <span className="text-white/90 text-xs uppercase tracking-wider">
              Scena {idx + 1} din {scenes.length}
            </span>
          </div>
        </div>
      )}

      <div className="relative z-10 flex flex-col h-full px-5 pt-12 pb-6">
        {/* Top: progress + scene counter */}
        <div className="px-2">
          <div className="flex gap-1.5">
            {scenes.map((_, i) => (
              <div key={i} className="relative flex-1 h-[3px] rounded-full bg-white/10 overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    i === idx && isRecording ? "shimmer-gold" : captured.has(i) ? "bg-gradient-to-r from-[#F4E4C1] via-[#E8D5B5] to-[#D4AF37]" : i < idx ? "bg-gradient-to-r from-[#F4E4C1] via-[#E8D5B5] to-[#D4AF37]" : ""
                  }`}
                  style={{
                    width:
                      captured.has(i) ? "100%"
                      : i === idx && isRecording ? `${(t / scene.duration) * 100}%`
                      : i < idx ? "100%"
                      : "0%",
                  }}
                />
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between">
            <button
              onClick={prev}
              disabled={idx === 0}
              className="flex items-center gap-1 text-[11px] tracking-widest uppercase text-white/70 disabled:opacity-30"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Înapoi
            </button>
            <div className="flex flex-col items-center gap-1 max-w-[60%]">
              <span className="text-[11px] tracking-[0.3em] uppercase text-[#E8D5B5]/90">
                Scena {idx + 1} din {scenes.length}
              </span>
              <span className="text-[10px] text-white/55 truncate w-full text-center">
                {scenario.title}
              </span>
              <span
                className={`mt-0.5 inline-flex items-center gap-1 text-[9px] tracking-[0.3em] uppercase font-semibold ${diffTone}`}
                title={diffMeta.desc}
              >
                <span className="flex gap-[2px]">
                  {[0, 1, 2].map((i) => (
                    <span key={i} className={`w-[4px] h-[4px] rounded-full ${i < diffDots ? "bg-current" : "bg-current/25"}`} />
                  ))}
                </span>
                {diffMeta.short}
              </span>
            </div>
            <button
              onClick={cam.switchCamera}
              disabled={cam.state !== "ready" || isRecording}
              className="flex items-center gap-1 text-[11px] tracking-widest uppercase text-white/70 disabled:opacity-30"
              title="Schimbă camera"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Camera state messages */}
        {(cam.state === "idle" || cam.state === "requesting") && (
          <div className="mt-8 mx-auto glass-lux rounded-2xl px-5 py-4 max-w-[90%] text-center">
            <p className="text-white text-sm font-semibold">
              {cam.state === "requesting" ? "Se cere accesul la cameră…" : "Pornește camera ca să filmezi"}
            </p>
            <p className="text-white/60 text-xs mt-1">
              Browserul va cere permisiunea pentru cameră și microfon.
            </p>
            <button
              onClick={() => void cam.start("user")}
              disabled={cam.state === "requesting"}
              className="mt-3 inline-flex items-center gap-2 px-5 h-10 rounded-full bg-gradient-to-r from-[#F4E4C1] via-[#E8D5B5] to-[#D4AF37] text-black text-[11px] tracking-widest uppercase font-semibold shadow-[0_4px_24px_rgba(244,228,193,0.4)] active:scale-[0.98] disabled:opacity-50"
            >
              <Camera className="w-3.5 h-3.5" />
              {cam.state === "requesting" ? "Se conectează…" : "Activează camera"}
            </button>
          </div>
        )}
        {(cam.state === "denied" || cam.state === "unsupported" || cam.state === "error" || cam.state === "disconnected") && (
          <div className="mt-8 mx-auto glass-lux rounded-2xl px-5 py-4 max-w-[90%]">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-[#E8D5B5] mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-white text-sm font-semibold">
                  {cam.state === "denied" ? "Acces refuzat la cameră"
                  : cam.state === "unsupported" ? "Browserul nu suportă filmare"
                  : cam.state === "disconnected" ? "Camera a fost deconectată"
                  : "Eroare la cameră"}
                </p>
                <p className="text-white/65 text-xs mt-1">
                  {cam.state === "denied"
                    ? "Permite accesul la cameră din bara browserului, apoi reîncearcă. Sau filmează cu camera nativă și încarcă mai jos."
                    : cam.state === "disconnected"
                      ? "Apasă mai jos ca să reconectezi camera și să continui filmarea."
                      : cam.error || "Poți filma cu camera nativă a telefonului și încărca clipul mai jos."}
                </p>
                <button
                  onClick={() => void cam.start()}
                  className="mt-3 inline-flex items-center gap-2 px-4 h-9 rounded-full bg-gradient-to-r from-[#F4E4C1] via-[#E8D5B5] to-[#D4AF37] text-black text-[11px] tracking-widest uppercase font-semibold shadow-[0_4px_24px_rgba(244,228,193,0.4)] active:scale-[0.98] transition-transform"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  {cam.state === "disconnected" ? "Reconectează camera" : "Reîncearcă"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Scrollable middle: instructions + must-show */}
        <div className="flex-1 min-h-0 overflow-y-auto -mx-1 px-1 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {/* Hook + shot card — only once the camera is live and before recording */}
        {cam.state === "ready" && showGuide && !isRecording && (
          <>
            {(scene.tag || scene.section) && (
              <div
                key={`tag-${idx}`}
                className="mt-6 px-2 flex items-center gap-2 animate-fade-in"
              >
                {scene.tag && (
                  <span className={`inline-flex items-center gap-1.5 text-[10px] tracking-[0.2em] uppercase font-semibold px-2.5 py-1 rounded-full ${patternBadge(scene.patternId)}`}>
                    {scene.tag}
                  </span>
                )}
                {scene.section && (
                  <span className="text-[10px] tracking-[0.3em] uppercase text-white/45 font-semibold">
                    {scene.section}
                  </span>
                )}
              </div>
            )}
            <h2
              key={scene.hook}
              className={`font-display ${scene.tag ? "text-[32px] mt-2.5" : "text-[40px] mt-6"} leading-[1.0] text-white px-2 whitespace-pre-line animate-fade-in drop-shadow-lg`}
            >
              {scene.hook}
            </h2>

            {/* Instruction bullets - one physical action per line */}
            {scene.instructions && scene.instructions.length > 0 && (
              <div className="mt-5 glass-lux rounded-2xl px-4 py-4 animate-fade-in" style={{ animationDelay: "60ms", animationFillMode: "backwards" }}>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1 h-4 bg-[#E8D5B5] rounded-full" />
                  <p className="text-white/45 text-xs uppercase tracking-[0.3em]">Pas cu pas</p>
                </div>
                <ul className="space-y-3">
                  {scene.instructions.map((it, i) => (
                    <li key={i} className="flex items-start gap-3 text-white/80 leading-relaxed">
                      <span className="mt-0.5 w-6 h-6 rounded-full bg-[#E8D5B5]/20 flex items-center justify-center shrink-0">
                        {instructionNumber(i + 1)}
                      </span>
                      <span>{it}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Framing checklist - what must be visible */}
            {scene.mustShow && scene.mustShow.length > 0 && (
              <div className="mt-3 glass-lux rounded-2xl px-4 py-3 animate-fade-in" style={{ animationDelay: "120ms", animationFillMode: "backwards" }}>
                <p className="text-[10px] tracking-[0.35em] uppercase text-white/45 uppercase tracking-[0.3em] mb-3 flex items-center gap-1.5">
                  <ListChecks className="w-3.5 h-3.5" /> Trebuie sa se vada
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {scene.mustShow.map((m, i) => (
                    <span key={i} className="text-[12px] text-white/85 px-2.5 py-1 rounded-full bg-emerald-400/15 border border-emerald-400/30">
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            )}

          </>
        )}

        </div>{/* end scroll area */}

        {/* Bottom: timer + record + next — always visible, never scrolled */}
        <div className="shrink-0 pt-2">
          <div className="flex items-baseline justify-center gap-2">
            <span
              className={`font-display text-[48px] leading-none tracking-[-0.04em] ${isRecording ? "text-[#E8D5B5]" : "text-white"}`}
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {(scene.duration - t).toFixed(1)}
            </span>
            <span className="text-white/55 text-sm tracking-[0.35em] uppercase">sec</span>
          </div>

          {sceneCaptured && !isRecording && (
            <p className="mt-2 text-center text-[11px] tracking-widest uppercase text-emerald-300/90 flex items-center justify-center gap-1.5">
              <Check className="w-3.5 h-3.5" /> Scenă salvată
            </p>
          )}

          <button
            onClick={isRecording ? handleStop : handleStart}
            disabled={cam.state !== "ready" || countdown !== null}
            className={`mt-4 w-full h-16 rounded-full font-semibold text-base flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-40 ${
              isRecording ? "glass-lux text-white" : "bg-gradient-to-r from-[#F4E4C1] via-[#E8D5B5] to-[#D4AF37] text-[#0F1419] shadow-[0_4px_24px_rgba(244,228,193,0.4)]"
            }`}
          >
            {isRecording ? (
              <>
                <Square className="w-5 h-5 fill-current" />
                Oprește filmarea
              </>
            ) : countdown !== null ? (
              <>Se pregătește…</>
            ) : (
              <>
                <span className="relative flex items-center justify-center w-7 h-7">
                  <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-40" />
                  <span className="relative w-3.5 h-3.5 rounded-full bg-red-500" />
                </span>
                {sceneCaptured ? "Refilmează shot" : "Start Filmare"}
              </>
            )}
          </button>

          {/* Fallback upload (visible if camera not ready) */}
          {(cam.state === "denied" || cam.state === "unsupported" || cam.state === "error" || cam.state === "disconnected") && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                capture="user"
                hidden
                onChange={handleFallbackUpload}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="mt-3 w-full h-12 rounded-full text-sm font-medium flex items-center justify-center gap-2 text-white bg-white/10 border border-white/15"
              >
                <Upload className="w-4 h-4" /> Încarcă filmare nativă
              </button>
            </>
          )}

          <button
            onClick={next}
            disabled={false}
            className="mt-3 w-full h-12 rounded-full text-sm font-medium flex items-center justify-center gap-2 text-white/85 bg-white/5 border border-white/10 hover:bg-white/10 transition-all active:scale-[0.98] disabled:opacity-40"
          >
            {idx === scenes.length - 1 ? (
              <>
                <Check className="w-4 h-4" />
                Mergi la editare
              </>
            ) : (
              <>
                Următoarea scenă
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>


        </div>
      </div>
    </PhoneShell>
  );
}

function InstructionCard({
  icon, label, text, delay,
}: { icon: React.ReactNode; label: string; text: string; delay: number; }) {
  return (
    <div
      className="glass-lux rounded-2xl px-4 py-3 flex gap-3 items-start animate-fade-in"
      style={{ animationDelay: `${delay}ms`, animationFillMode: "backwards" }}
    >
      <div className="mt-0.5 w-8 h-8 rounded-full bg-[#E8D5B5]/15 text-[#E8D5B5] flex items-center justify-center shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-[10px] tracking-[0.35em] uppercase text-[#E8D5B5] font-semibold">{label}</p>
        <p className="text-white text-[13px] leading-snug mt-0.5">{text}</p>
      </div>
    </div>
  );
}


/** Pattern badge colors - matches SHOT_PATTERNS accent in shots.ts. */
function patternBadge(patternId?: string): string {
  switch (patternId) {
    case "before":     return "bg-blue-400/15 text-blue-300";
    case "process":    return "bg-purple-400/15 text-purple-300";
    case "suspense":   return "bg-amber-400/15 text-amber-300";
    case "reveal":     return "bg-[#E8D5B5]/15 text-[#E8D5B5]";
    case "reaction":   return "bg-pink-400/15 text-pink-300";
    case "confidence": return "bg-emerald-400/15 text-emerald-300";
    default:           return "bg-[#E8D5B5]/15 text-[#E8D5B5]";
  }
}

/**
 * Pick an anchor icon for an instruction line by keyword. The icon is a
 * visual anchor so the pro scans rather than reads - it never replaces
 * the text, so an imperfect guess is harmless.
 */
function instructionNumber(n: number): React.ReactNode {
  return <span className="text-[#E8D5B5] text-xs font-medium">{n}</span>;
}
