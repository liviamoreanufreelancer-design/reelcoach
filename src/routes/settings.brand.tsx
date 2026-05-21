import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { PhoneShell } from "@/components/PhoneShell";

export const Route = createFileRoute("/settings/brand")({
  component: BrandSettings,
});

function BrandSettings() {
  return (
    <PhoneShell>
      <div className="relative z-10 flex flex-col h-full px-6 pt-4 pb-6 bg-background">
        <div className="flex items-center justify-between">
          <Link to="/catalog" className="w-10 h-10 rounded-full glass flex items-center justify-center">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <span className="text-[10px] tracking-[0.4em] uppercase text-[#E8D5B5] font-semibold">
            Setări brand
          </span>
          <span className="w-10" />
        </div>
        <div className="mt-6 flex-1 flex items-center justify-center text-center">
          <div>
            <p className="text-white/70 text-sm">Pentru a actualiza brand-ul, deschide din nou onboarding-ul.</p>
            <Link
              to="/onboarding"
              className="mt-5 inline-flex h-12 px-6 rounded-full bg-gradient-to-r from-[#F4E4C1] via-[#E8D5B5] to-[#D4AF37] text-black text-sm font-semibold items-center"
            >
              Editează brand
            </Link>
          </div>
        </div>
      </div>
    </PhoneShell>
  );
}
