import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Camera, Smartphone, ChevronLeft, ChevronRight, ArrowRight, Check, RefreshCw, Square, Upload, AlertCircle, Sparkles, Package, Play, ListChecks, Lightbulb } from "lucide-react";
import { PhoneShell } from "@/components/PhoneShell";
import { CinematicBg } from "@/components/CinematicBg";
import { getSelectedScenario, getSelectedIdeaId } from "@/lib/selected-idea";
import { getDifficulty, DIFFICULTIES, getMaterials } from "@/data/scenarios";
import { useCamera } from "@/hooks/useCamera";
import { useRecorder } from "@/hooks/useRecorder";
import { saveClip, listClips } from "@/lib/clip-store";

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
    : diff === "medium" ? "text-gold"
    : "text-rose-300/90";

  /** overview → materials → (prep) → film */
  const hasPrep = !!scenario.prep;
  const totalSteps = hasPrep ? 4 : 3;
  const [phase, setPhase] = useState<"overview" | "materials" | "prep" | "film">("overview");
  const [idx, setIdx] = useState(0);
  const [t, setT] = useState(0);
  const [captured, setCaptured] = useState<Set<number>>(new Set());
  const [showGuide, setShowGuide] = useState(true);
  /** 3-2-1 countdown before recording. null = inactive. */
  const [countdown, setCountdown] = useState<number | null>(null);
  const [showWhy, setShowWhy] = useState(false);
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
    setShowGuide(true); setShowWhy(false);
  };

  // Drive the 3-2-1 countdown.
  useEffect(() => {
    if (countdown === null) return;
    if (countdown <= 0) {
      beginRecording();
      return;
    }
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
    const result = await rec.stop();
    if (!result) return;
    await saveClip({
      scenarioId,
      sceneIdx: idx,
      blob: result.blob,
      mimeType: result.mimeType,
      duration: t || scene.duration,
      createdAt: Date.now(),
    });
    setCaptured((s) => new Set(s).add(idx));
    // Auto-advance: short pause so the user sees the saved confirmation,
    // then move to the next scene or to the editor when finished.
    setTimeout(() => {
      setT(0);
      setShowGuide(true); setShowWhy(false);
      if (idx >= scenes.length - 1) {
        nav({ to: "/editing" });
      } else {
        setIdx((p) => p + 1);
      }
    }, 900);
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
      createdAt: Date.now(),
    });
    setCaptured((s) => new Set(s).add(idx));
    e.target.value = "";
  };

  const prev = () => {
    if (rec.state === "recording") rec.cancel();
    setT(0); setShowGuide(true); setShowWhy(false);
    setIdx((p) => Math.max(0, p - 1));
  };
  const next = () => {
    if (rec.state === "recording") rec.cancel();
    setT(0); setShowGuide(true); setShowWhy(false);
    if (idx === scenes.length - 1) nav({ to: "/editing" });
    else setIdx((p) => p + 1);
  };

  const isRecording = rec.state === "recording";
  const sceneCaptured = captured.has(idx);
  const allDone = scenes.every((_, i) => captured.has(i));

  // ---------- Intro: Ce vei obține ----------
  if (phase === "overview") {
    return (
      <PhoneShell>
        <CinematicBg src={scenario.image ?? scene.bg} blur overlay={0.75} kenBurns={false} />
        <div className="relative z-10 flex flex-col h-full px-5 pt-12 pb-6">
          <div className="flex items-center justify-between px-1">
            <button
              onClick={() => nav({ to: "/generating" })}
              className="w-10 h-10 rounded-full glass flex items-center justify-center"
              aria-label="Înapoi"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-[10px] tracking-[0.4em] uppercase text-gold-gradient font-semibold">
              Pasul 1 din {totalSteps}
            </span>
            <span className="w-10" />
          </div>

          <div className="mt-7 px-1">
            <span className="inline-flex items-center gap-1.5 text-[10px] tracking-[0.3em] uppercase text-gold/90 font-semibold">
              <Sparkles className="w-3 h-3" /> Ce vei obține
            </span>
            <h1 className="font-display text-[34px] leading-[1.05] text-white mt-3 tracking-[-0.02em]">
              {scenario.title}
            </h1>
            <p className="text-white/70 text-[14px] italic mt-2 leading-snug">
              „{scenario.hook}"
            </p>
            {scenario.description && (
              <p className="text-white/65 text-[13px] mt-3 leading-relaxed">
                {scenario.description}
              </p>
            )}
            {scenario.goal && (
              <div className="mt-4 rounded-2xl border border-gold/25 bg-gold/[0.06] px-4 py-3">
                <p className="text-[9px] tracking-[0.4em] uppercase text-gold/90 font-semibold">Goal</p>
                <p className="text-white/90 text-[13px] italic leading-snug mt-1">„{scenario.goal}"</p>
              </div>
            )}
          </div>

          <div className="mt-5 flex items-center gap-2 px-1">
            <span className="text-[10px] tracking-[0.25em] uppercase text-white/55 px-2.5 py-1 rounded-full bg-white/[0.04] border border-gold/20" style={{ fontVariantNumeric: "tabular-nums" }}>
              {scenes.length} scene
            </span>
            <span className="text-[10px] tracking-[0.25em] uppercase text-white/55 px-2.5 py-1 rounded-full bg-white/[0.04] border border-gold/20" style={{ fontVariantNumeric: "tabular-nums" }}>
              ~{totalDuration}s total
            </span>
            <span className={`text-[10px] tracking-[0.25em] uppercase px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/15 font-semibold ${diffTone}`} title={diffMeta.desc}>
              <span className="inline-flex gap-[2px] mr-1.5 align-middle">
                {[0, 1, 2].map((i) => (
                  <span key={i} className={`w-[4px] h-[4px] rounded-full inline-block ${i < diffDots ? "bg-current" : "bg-current/25"}`} />
                ))}
              </span>
              {diffMeta.short}
            </span>
          </div>

          <div className="mt-6 flex-1 overflow-y-auto -mx-1 px-1 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <p className="text-[10px] tracking-[0.35em] uppercase text-white/45 font-semibold mb-3 px-1">
              Scenele pe care le vei filma
            </p>
            <div className="space-y-2.5">
              {scenes.map((sc, i) => (
                <div key={i} className="glass-lux rounded-2xl px-4 py-3 flex gap-3 items-start">
                  <div className="mt-0.5 w-8 h-8 rounded-full bg-gold/15 text-gold-gradient flex items-center justify-center shrink-0 text-[12px] font-bold" style={{ fontVariantNumeric: "tabular-nums" }}>
                    {i + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="text-white text-[13px] font-semibold leading-snug whitespace-pre-line">
                        {sc.hook.replace(/\n/g, " ")}
                      </p>
                      <span className="text-[10px] tracking-widest text-gold/80 shrink-0" style={{ fontVariantNumeric: "tabular-nums" }}>
                        {sc.duration}s
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => setPhase("materials")}
            className="mt-2 w-full h-14 rounded-full bg-gold-gradient text-black text-[13px] tracking-widest uppercase font-semibold shadow-gold active:scale-[0.98] flex items-center justify-center gap-2"
          >
            Continuă <ArrowRight className="w-4 h-4" />
          </button>
        </div>
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
            <span className="text-[10px] tracking-[0.4em] uppercase text-gold-gradient font-semibold">
              Pasul 2 din {totalSteps}
            </span>
            <span className="w-10" />
          </div>

          <div className="mt-7 px-1">
            <span className="inline-flex items-center gap-1.5 text-[10px] tracking-[0.3em] uppercase text-gold/90 font-semibold">
              <Package className="w-3 h-3" /> De ce ai nevoie
            </span>
            <h1 className="font-display text-[34px] leading-[1.05] text-white mt-3 tracking-[-0.02em]">
              Pregătește totul <em className="italic font-editorial text-gold-gradient">înainte</em> să filmezi.
            </h1>
            <p className="text-white/65 text-[13px] mt-3 leading-relaxed">
              Așază-le la îndemână ca să nu pierzi ritmul între scene.
            </p>
          </div>

          <div className="mt-6 flex-1 overflow-y-auto -mx-1 px-1 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {materials.length > 0 && (
              <>
                <p className="text-[10px] tracking-[0.35em] uppercase text-white/45 font-semibold mb-3 px-1">
                  Materiale profesionale
                </p>
                <div className="grid grid-cols-1 gap-2 mb-5">
                  {materials.map((m) => (
                    <div key={m} className="glass-lux rounded-xl px-4 py-2.5 flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-gold-gradient shrink-0" />
                      <span className="text-white text-[13px]">{m}</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {filmingTools.length > 0 && (
              <>
                <p className="text-[10px] tracking-[0.35em] uppercase text-white/45 font-semibold mb-3 px-1 flex items-center gap-1.5">
                  <Smartphone className="w-3 h-3" /> Pentru filmare
                </p>
                <div className="grid grid-cols-1 gap-2">
                  {filmingTools.map((tool) => (
                    <div key={tool} className="glass-lux rounded-xl px-4 py-2.5 flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-white/40 shrink-0" />
                      <span className="text-white/85 text-[13px]">{tool}</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {materials.length === 0 && filmingTools.length === 0 && (
              <p className="text-white/55 text-[13px] text-center mt-8">
                Nu ai nevoie de echipament special. Doar telefonul tău.
              </p>
            )}
          </div>

          <button
            onClick={() => setPhase(hasPrep ? "prep" : "film")}
            className="mt-2 w-full h-14 rounded-full bg-gold-gradient text-black text-[13px] tracking-widest uppercase font-semibold shadow-gold active:scale-[0.98] flex items-center justify-center gap-2"
          >
            {hasPrep ? <>Continuă <ArrowRight className="w-4 h-4" /></> : <><Play className="w-4 h-4 fill-current" /> Sunt pregătit, începem</>}
          </button>
        </div>
      </PhoneShell>
    );
  }

  // ---------- Intro: Pregătește filmarea (checklist + tip) ----------
  if (phase === "prep" && scenario.prep) {
    const prep = scenario.prep;
    return (
      <PhoneShell>
        <CinematicBg src={scenario.image ?? scene.bg} blur overlay={0.8} kenBurns={false} />
        <div className="relative z-10 flex flex-col h-full px-5 pt-12 pb-6">
          <div className="flex items-center justify-between px-1">
            <button
              onClick={() => setPhase("materials")}
              className="w-10 h-10 rounded-full glass flex items-center justify-center"
              aria-label="Înapoi"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-[10px] tracking-[0.4em] uppercase text-gold-gradient font-semibold">
              Pasul 3 din {totalSteps}
            </span>
            <span className="w-10" />
          </div>

          <div className="mt-7 px-1">
            <span className="inline-flex items-center gap-1.5 text-[10px] tracking-[0.3em] uppercase text-gold/90 font-semibold">
              <ListChecks className="w-3 h-3" /> Pregătește filmarea
            </span>
            <h1 className="font-display text-[34px] leading-[1.05] text-white mt-3 tracking-[-0.02em]">
              {prep.title ?? "Pregătește filmarea"}
            </h1>
            <p className="text-white/65 text-[13px] mt-3 leading-relaxed">
              Verifică tot înainte să apeși record — filmarea curge mai departe singură.
            </p>
          </div>

          <div className="mt-6 flex-1 overflow-y-auto -mx-1 px-1 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="grid grid-cols-1 gap-2">
              {prep.checklist.map((item, i) => (
                <div key={i} className="glass-lux rounded-xl px-4 py-3 flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full border border-gold/40 flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5 text-gold" strokeWidth={3} />
                  </div>
                  <span className="text-white text-[13px]">{item}</span>
                </div>
              ))}
            </div>

            {prep.tip && (
              <div className="mt-5 rounded-2xl border border-gold/25 bg-gradient-to-br from-gold/[0.08] to-transparent px-4 py-4">
                <div className="flex items-center gap-2">
                  <Lightbulb className="w-3.5 h-3.5 text-gold" />
                  <p className="text-[9px] tracking-[0.4em] uppercase text-gold/90 font-semibold">Tip de pro</p>
                </div>
                <p className="text-white/90 text-[13px] leading-snug mt-2 italic">„{prep.tip}"</p>
              </div>
            )}
          </div>

          <button
            onClick={() => setPhase("film")}
            className="mt-2 w-full h-14 rounded-full bg-gold-gradient text-black text-[13px] tracking-widest uppercase font-semibold shadow-gold active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4 fill-current" /> Sunt gata
          </button>
        </div>
      </PhoneShell>
    );
  }


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
      <div className="absolute inset-0 bg-black/45 pointer-events-none" />

      {/* 3-2-1 countdown — calm, full-screen, impossible to miss */}
      {countdown !== null && countdown > 0 && (
        <button
          onClick={cancelCountdown}
          className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/55 backdrop-blur-[2px]"
          aria-label="Anulează countdown"
        >
          <span className="text-[10px] tracking-[0.5em] uppercase text-gold/90 font-semibold">
            Pregătește-te
          </span>
          <span
            key={countdown}
            className="font-display text-[150px] leading-none text-gold-gradient animate-fade-in mt-2"
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
          <div className="absolute top-20 left-4 w-6 h-6 border-l-2 border-t-2 border-gold/70 rounded-tl" />
          <div className="absolute top-20 right-4 w-6 h-6 border-r-2 border-t-2 border-gold/70 rounded-tr" />
          <div className="absolute bottom-44 left-4 w-6 h-6 border-l-2 border-b-2 border-gold/70 rounded-bl" />
          <div className="absolute bottom-44 right-4 w-6 h-6 border-r-2 border-b-2 border-gold/70 rounded-br" />
          {/* persistent scene badge */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 px-3 h-6 rounded-full bg-black/55 backdrop-blur-md border border-gold/30 flex items-center gap-1.5">
            {isRecording && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />}
            <span className="text-[9px] tracking-[0.3em] uppercase text-gold/95 font-semibold">
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
                    i === idx && isRecording ? "shimmer-gold" : captured.has(i) ? "bg-gold-gradient" : i < idx ? "bg-gold-gradient" : ""
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
              <span className="text-[11px] tracking-[0.3em] uppercase text-gold/90">
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
              className="mt-3 inline-flex items-center gap-2 px-5 h-10 rounded-full bg-gold-gradient text-black text-[11px] tracking-widest uppercase font-semibold shadow-gold active:scale-[0.98] disabled:opacity-50"
            >
              <Camera className="w-3.5 h-3.5" />
              {cam.state === "requesting" ? "Se conectează…" : "Activează camera"}
            </button>
          </div>
        )}
        {(cam.state === "denied" || cam.state === "unsupported" || cam.state === "error" || cam.state === "disconnected") && (
          <div className="mt-8 mx-auto glass-lux rounded-2xl px-5 py-4 max-w-[90%]">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-gold mt-0.5 shrink-0" />
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
                  className="mt-3 inline-flex items-center gap-2 px-4 h-9 rounded-full bg-gold-gradient text-black text-[11px] tracking-widest uppercase font-semibold shadow-gold active:scale-[0.98] transition-transform"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  {cam.state === "disconnected" ? "Reconectează camera" : "Reîncearcă"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Hook + shot card (only before recording) */}
        {showGuide && !isRecording && (
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
                <p className="text-[10px] tracking-[0.35em] uppercase text-gold-gradient font-semibold mb-3">
                  Pas cu pas
                </p>
                <ul className="space-y-3">
                  {scene.instructions.map((it, i) => (
                    <li key={i} className="flex items-start gap-3 text-white text-[14px] leading-snug">
                      <span className="mt-0.5 w-6 h-6 rounded-full bg-gold/15 text-gold flex items-center justify-center shrink-0">
                        {instructionIcon(it)}
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
                <p className="text-[10px] tracking-[0.35em] uppercase text-emerald-300/80 font-semibold mb-2 flex items-center gap-1.5">
                  <ListChecks className="w-3.5 h-3.5" /> Trebuie sa se vada
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {scene.mustShow.map((m, i) => (
                    <span key={i} className="text-[12px] text-white/85 px-2.5 py-1 rounded-full bg-white/[0.05] border border-white/10">
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* "Why it matters" - optional context, collapsed by default */}
            {scene.what && (
              <button
                onClick={() => setShowWhy((v) => !v)}
                className="mt-3 w-full glass-lux rounded-2xl px-4 py-3 text-left animate-fade-in"
                style={{ animationDelay: "160ms", animationFillMode: "backwards" }}
              >
                <p className="text-[11px] text-white/55 flex items-center gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5 text-gold/70" />
                  De ce conteaza
                  <ChevronRight className={`w-3.5 h-3.5 ml-auto transition-transform ${showWhy ? "rotate-90" : ""}`} />
                </p>
                {showWhy && (
                  <p className="text-white/70 text-[13px] leading-relaxed mt-2">
                    {scene.what}
                  </p>
                )}
              </button>
            )}
          </>
        )}

        {/* Bottom: timer + record + next */}
        <div className="mt-auto">
          <div className="flex items-baseline justify-center gap-2">
            <span
              className={`font-display text-[64px] leading-none tracking-[-0.04em] ${isRecording ? "text-gold-gradient" : "text-white"}`}
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
              isRecording ? "glass-lux text-white" : "bg-gold-gradient text-black shadow-gold"
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
            disabled={!sceneCaptured && idx === scenes.length - 1 ? !allDone : false}
            className="mt-3 w-full h-12 rounded-full text-sm font-medium flex items-center justify-center gap-2 text-white/85 bg-white/5 border border-white/10 hover:bg-white/10 transition-all active:scale-[0.98] disabled:opacity-40"
          >
            {idx === scenes.length - 1 ? (
              <>
                <Check className="w-4 h-4" />
                Mergi la editare
              </>
            ) : (
              <>
                {sceneCaptured ? "Următoarea scenă" : "Sari peste"}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <p className="mt-3 text-[10px] text-white/45 text-center">
            Clipurile se salvează pe telefonul tău. Nu închide tab-ul până nu termini editarea.
          </p>
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
      <div className="mt-0.5 w-8 h-8 rounded-full bg-gold/15 text-gold flex items-center justify-center shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-[10px] tracking-[0.35em] uppercase text-gold-gradient font-semibold">{label}</p>
        <p className="text-white text-[13px] leading-snug mt-0.5">{text}</p>
      </div>
    </div>
  );
}


/** Pattern badge colors - matches SHOT_PATTERNS accent in shots.ts. */
function patternBadge(patternId?: string): string {
  switch (patternId) {
    case "before":     return "bg-sky-400/15 text-sky-300";
    case "process":    return "bg-violet-400/15 text-violet-300";
    case "suspense":   return "bg-amber-400/15 text-amber-300";
    case "reveal":     return "bg-gold/15 text-gold";
    case "reaction":   return "bg-rose-400/15 text-rose-300";
    case "confidence": return "bg-emerald-400/15 text-emerald-300";
    default:           return "bg-gold/15 text-gold";
  }
}

/**
 * Pick an anchor icon for an instruction line by keyword. The icon is a
 * visual anchor so the pro scans rather than reads - it never replaces
 * the text, so an imperfect guess is harmless.
 */
function instructionIcon(text: string): React.ReactNode {
  const t = text.toLowerCase();
  if (/telefon|sprijin|camer|filmare/.test(t)) return <Smartphone className="w-3.5 h-3.5" />;
  if (/lumin|geam|fereastr/.test(t))           return <Sparkles className="w-3.5 h-3.5" />;
  if (/incadr|vad[ăa]|vada|verific|cadru/.test(t)) return <ListChecks className="w-3.5 h-3.5" />;
  if (/cere|client|zamb|zâmb|atinga|atingă|intoarc|întoarc/.test(t)) return <Play className="w-3.5 h-3.5" />;
  return <ChevronRight className="w-3.5 h-3.5" />;
}
