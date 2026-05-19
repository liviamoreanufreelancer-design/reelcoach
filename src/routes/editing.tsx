import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { CinematicBg } from "@/components/CinematicBg";
import { PhoneShell } from "@/components/PhoneShell";
import bg from "@/assets/par-cat/stock/before-after.jpg";

export const Route = createFileRoute("/editing")({
  component: Editing,
});

const steps = [
  { label: "Selectăm cele mai bune cadre", delay: 700 },
  { label: "Sincronizăm scenele", delay: 1600 },
  { label: "Adăugăm transitions", delay: 2500 },
  { label: "Adăugăm filtre", delay: 3400 },
  { label: "Exportăm reel-ul", delay: 4200 },
];

function Editing() {
  const [done, setDone] = useState(0);
  const nav = useNavigate();

  useEffect(() => {
    const timers = steps.map((s, i) =>
      setTimeout(() => setDone((d) => Math.max(d, i + 1)), s.delay),
    );
    const final = setTimeout(() => nav({ to: "/edit" }), 4800);
    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(final);
    };
  }, [nav]);

  return (
    <PhoneShell>
      <CinematicBg src={bg} blur overlay={0.75} kenBurns={false} />
      <div className="relative z-10 flex flex-col h-full px-7 pt-20 pb-12">
        <div className="flex flex-col items-center mt-6">
          <div className="relative w-28 h-28 flex items-center justify-center">
            <span className="absolute inset-0 rounded-full border border-gold/30" />
            <span className="absolute inset-2 rounded-full border-t border-gold animate-spin" style={{ animationDuration: "2s" }} />
            <span className="absolute inset-6 rounded-full bg-gold/10 backdrop-blur" />
            <Loader2 className="w-7 h-7 text-gold animate-spin" style={{ animationDuration: "1.4s" }} />
          </div>
          <p className="mt-10 text-[11px] tracking-[0.45em] uppercase text-gold-gradient font-semibold">
            ReelPilot AI
          </p>
          <h1 className="font-display text-[40px] text-center text-white mt-3 leading-[1.05]">
            Edităm<br />
            <em className="italic font-editorial text-gold-gradient">reel-ul tău…</em>
          </h1>
        </div>

        <div className="mt-auto">
          <div className="glass-lux rounded-3xl p-5 space-y-1">
            {steps.map((s, i) => {
              const isDone = done > i;
              const isActive = done === i;
              return (
                <div
                  key={s.label}
                  className={`flex items-center gap-4 py-3 px-2 rounded-2xl transition-all duration-500 ${isActive ? "bg-white/5" : ""}`}
                >
                  <div
                    className={`relative w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                      isDone ? "bg-gold text-black" : isActive ? "border border-gold/60" : "border border-white/15"
                    }`}
                  >
                    {isDone ? (
                      <Check className="w-4 h-4" strokeWidth={3} />
                    ) : isActive ? (
                      <span className="w-2 h-2 rounded-full bg-gold animate-pulse" />
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-white/30" />
                    )}
                  </div>
                  <span className={`text-[14px] tracking-wide ${isDone ? "text-white" : isActive ? "text-white/90" : "text-white/40"}`}>
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
          <p className="mt-4 text-center text-[10px] tracking-[0.35em] uppercase text-white/50">
            Stitch · Transitions · Color · Export 9:16
          </p>
        </div>
      </div>
    </PhoneShell>
  );
}
