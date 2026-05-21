import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { CinematicBg } from "@/components/CinematicBg";
import { PhoneShell } from "@/components/PhoneShell";
import { StatusBar } from "@/components/StatusBar";
import { light } from "@/lib/haptic";
import intro from "@/assets/salon-intro.jpg";

export const Route = createFileRoute("/")({
  component: Intro,
});

function Intro() {
  return (
    <PhoneShell>
      <CinematicBg src={intro} overlay={0.62} />
      <div className="relative z-10 flex flex-col h-full px-7 pb-10 pt-3">
        <StatusBar />

        <div className="mt-8 flex items-center gap-2 text-[11px] tracking-[0.4em] text-white/65 uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-[#E8D5B5] animate-pulse" />
          ReelPilot
        </div>

        <div className="mt-auto">
          <p className="text-xs tracking-[0.4em] uppercase mb-5 font-medium text-[#E8D5B5]">
            Scena 0 — Start
          </p>
          <h1 className="h1-lux text-[68px] text-white">
            Ce filmăm<br />
            <em className="italic font-editorial text-[#E8D5B5]">azi?</em>
          </h1>
          <p className="mt-5 text-white/72 text-lg leading-snug max-w-[18rem]">
            Hai să facem un Reel care oprește scroll-ul.
          </p>

          <Link
            to="/profession"
            onClick={() => light()}
            className="mt-10 group flex items-center justify-between gap-4 w-full rounded-full bg-white text-black pl-7 pr-2 py-2 shadow-[0_4px_24px_rgba(244,228,193,0.4)] pulse-gold active:scale-[0.98] transition"
          >
            <span className="font-medium text-base">Înainte</span>
            <span className="flex items-center justify-center w-12 h-12 rounded-full bg-black text-white group-active:bg-[#E8D5B5] group-active:text-black transition">
              <ArrowRight className="w-5 h-5" />
            </span>
          </Link>

          <p className="mt-6 text-center text-[11px] tracking-[0.35em] uppercase text-white/40">
            Pentru saloane care vor să fie văzute
          </p>
        </div>
      </div>
    </PhoneShell>
  );
}
