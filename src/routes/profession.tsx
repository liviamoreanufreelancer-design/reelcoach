import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ChevronLeft, ArrowRight } from "lucide-react";
import { CinematicBg } from "@/components/CinematicBg";
import { PhoneShell } from "@/components/PhoneShell";
import { StatusBar } from "@/components/StatusBar";
import { ProfessionIcon } from "@/components/icons/ProfessionIcon";
import { PROFESSIONS, type Profession } from "@/data/scenarios";
import { setProfession } from "@/lib/profession";
import { isOnboardingDone } from "@/lib/brand-store";
import { light, success } from "@/lib/haptic";
import intro from "@/assets/salon-intro.jpg";

export const Route = createFileRoute("/profession")({
  component: ProfessionPicker,
});

function ProfessionPicker() {
  const nav = useNavigate();

  const pick = (p: Profession) => {
    success();
    setProfession(p);
    nav({ to: isOnboardingDone() ? "/templates" : "/onboarding" });
  };

  return (
    <PhoneShell>
      <CinematicBg src={intro} blur overlay={0.82} kenBurns={false} />

      <div className="relative z-10 flex flex-col h-full px-5 pt-3 pb-7">
        <div className="px-2"><StatusBar /></div>

        <div className="mt-5 flex items-center justify-between px-1">
          <button
            onClick={() => { light(); nav({ to: "/" }); }}
            className="w-10 h-10 rounded-full glass flex items-center justify-center"
            aria-label="Înapoi"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-[10px] tracking-[0.4em] uppercase text-[#E8D5B5] font-semibold">
            Pasul 01 / 02
          </span>
          <span className="w-10" />
        </div>

        <div className="mt-7 px-1">
          <h1 className="h1-lux text-[46px] text-white">
            Cu ce<br />
            <em className="italic font-editorial text-[#E8D5B5]">lucrezi?</em>
          </h1>
          <p className="mt-3 text-white/65 text-[14px] leading-relaxed max-w-[20rem]">
            Alege meseria ta. Toate ideile vor fi personalizate pe ce faci tu.
          </p>
        </div>

        <div className="mt-7 flex-1 overflow-y-auto -mx-1 px-1 stagger-lux pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {PROFESSIONS.map((p, i) => (
            <button
              key={p.id}
              onClick={() => pick(p.id)}
              className="group w-full text-left glass-lux rounded-2xl p-4 mb-2.5 flex items-center gap-4"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <span className="w-12 h-12 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-[#E8D5B5] shrink-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                <ProfessionIcon id={p.id} className="w-6 h-6" />
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] tracking-[0.35em] uppercase text-[#E8D5B5] font-semibold">
                  {p.tag}
                </div>
                <div className="font-editorial text-[24px] leading-tight text-white mt-0.5 tracking-[-0.02em]">
                  {p.label}
                </div>
                <div className="text-white/55 text-[12px] mt-0.5 truncate">
                  {p.desc}
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-[#E8D5B5]/80 shrink-0 group-active:translate-x-0.5 transition-transform" />
            </button>
          ))}
        </div>

        <p className="text-center text-[10px] tracking-[0.4em] uppercase text-white/40">
          Poți schimba mai târziu
        </p>
      </div>
    </PhoneShell>
  );
}
