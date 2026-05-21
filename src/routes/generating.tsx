import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { CinematicBg } from "@/components/CinematicBg";
import { PhoneShell } from "@/components/PhoneShell";
import bg from "@/assets/template-before-after.jpg";

export const Route = createFileRoute("/generating")({
  component: Generating,
});

const steps = [
  { label: "Hook", delay: 600 },
  { label: "Structură", delay: 1500 },
  { label: "Scene", delay: 2700 },
  { label: "Sunet", delay: 3600 },
];

function Generating() {
  const [done, setDone] = useState<number>(0);
  const nav = useNavigate();

  useEffect(() => {
    const timers = steps.map((s, i) =>
      setTimeout(() => setDone((d) => Math.max(d, i + 1)), s.delay)
    );
    const final = setTimeout(() => nav({ to: "/film" }), 4400);
    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(final);
    };
  }, [nav]);

  return (
    <PhoneShell>
      <CinematicBg src={bg} blur overlay={0.7} kenBurns={false} />

      <div className="relative z-10 flex flex-col h-full px-7 pt-20 pb-12">
        <div className="flex flex-col items-center mt-6">
          <div className="relative w-28 h-28 flex items-center justify-center">
            <span className="absolute inset-0 rounded-full border border-[#E8D5B5]/30" />
            <span className="absolute inset-2 rounded-full border-t border-[#E8D5B5] animate-spin" style={{ animationDuration: "2s" }} />
            <span className="absolute inset-6 rounded-full bg-[#E8D5B5]/10 backdrop-blur" />
            <Loader2 className="w-7 h-7 text-[#E8D5B5] animate-spin" style={{ animationDuration: "1.4s" }} />
          </div>

          <p className="mt-10 text-[11px] tracking-[0.45em] uppercase text-[#E8D5B5] font-semibold">
            ReelPilot AI
          </p>
          <h1 className="h1-lux text-[44px] text-center text-white mt-3">
            Construim<br/>
            <em className="italic font-editorial text-[#E8D5B5]">Reel-ul tău…</em>
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
                  className={`flex items-center gap-4 py-3 px-2 rounded-2xl transition-all duration-500 ${
                    isActive ? "bg-white/5" : ""
                  }`}
                >
                  <div
                    className={`relative w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                      isDone
                        ? "bg-[#E8D5B5] text-black"
                        : isActive
                          ? "border border-[#E8D5B5]/60"
                          : "border border-white/15"
                    }`}
                  >
                    {isDone ? (
                      <Check className="w-4 h-4" strokeWidth={3} />
                    ) : isActive ? (
                      <span className="w-2 h-2 rounded-full bg-[#E8D5B5] animate-pulse" />
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-white/30" />
                    )}
                  </div>
                  <span
                    className={`text-[15px] tracking-wide ${
                      isDone ? "text-white" : isActive ? "text-white/90" : "text-white/40"
                    }`}
                  >
                    {s.label}
                  </span>
                  {isActive && (
                    <span className="ml-auto text-[10px] tracking-widest uppercase text-[#E8D5B5]/80">
                      …
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-5 h-[2px] rounded-full bg-white/10 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-gold/60 via-gold to-gold/60 progress-fill" />
          </div>
          <p className="mt-3 text-center text-[11px] tracking-widest uppercase text-white/45">
            Generăm scene optimizate pentru tine
          </p>
        </div>
      </div>
    </PhoneShell>
  );
}
