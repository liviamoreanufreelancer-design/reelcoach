import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronLeft, Wand2, Heart, Sparkles, Clock, Camera } from "lucide-react";
import { CinematicBg } from "@/components/CinematicBg";
import { PhoneShell } from "@/components/PhoneShell";
import {
  CATEGORIES,
  SUBCATEGORIES,
  REEL_TEMPLATES,
  getSubcategoriesForCategory,
  getTemplatesForSubcategory,
} from "@/data/catalog";
import {
  totalRecordingSeconds,
  totalFinalSeconds,
  shotCount,
  type Category,
} from "@/data/shots";
import { getProfessionId } from "@/lib/profession";
import { setSelectedIdeaId } from "@/lib/selected-idea";
import { playSelect } from "@/lib/ui-sound";

export const Route = createFileRoute("/catalog")({
  component: Catalog,
});

/**
 * Browse the catalog: Category → Subcategory → ReelTemplate.
 *
 * Design rules:
 *   - Single vertical scroll screen. A pro with the phone in one hand
 *     scans and taps; no carousel layers to navigate.
 *   - Subcategories with zero templates are HIDDEN (we never promise
 *     content we don't ship — see UX spec, "minimal UI, no padding").
 *   - Tapping a template skips the legacy "ideas" picker entirely: the
 *     template IS the idea. Goes straight to /generating, which in turn
 *     leads to filming.
 */
function Catalog() {
  const nav = useNavigate();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const p = getProfessionId();
    if (!p) {
      nav({ to: "/profession" });
      return;
    }
    setReady(true);
  }, [nav]);

  if (!ready) return <PhoneShell><div /></PhoneShell>;

  // Hide empty subcategories. A pro should never tap into nothing.
  const visibleCategories = CATEGORIES
    .map((c) => ({
      cat: c,
      subs: getSubcategoriesForCategory(c.id)
        .map((sc) => ({ sub: sc, templates: getTemplatesForSubcategory(sc.id) }))
        .filter((s) => s.templates.length > 0),
    }))
    .filter((c) => c.subs.length > 0);

  const pick = (templateId: string) => {
    playSelect();
    setSelectedIdeaId(templateId);
    nav({ to: "/generating" });
  };

  // Use the first template's cover as a calm backdrop. Falls back to a
  // neutral dark if the catalog is somehow empty.
  const backdrop = REEL_TEMPLATES[0]?.cover;

  return (
    <PhoneShell>
      {backdrop && <CinematicBg src={backdrop} blur overlay={0.85} kenBurns={false} />}
      <div className="relative z-10 flex flex-col h-full px-5 pt-12 pb-6">
        {/* Header */}
        <div className="flex items-center justify-between px-1 shrink-0">
          <button
            onClick={() => nav({ to: "/" })}
            className="w-10 h-10 rounded-full glass flex items-center justify-center"
            aria-label="Înapoi"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-[10px] tracking-[0.4em] uppercase text-[#E8D5B5] font-semibold">
            Alege un reel
          </span>
          <span className="w-10" />
        </div>

        <div className="mt-6 px-1 shrink-0">
          <h1 className="font-display text-[32px] leading-[1.05] text-white tracking-[-0.02em]">
            Ce filmăm <em className="italic font-editorial text-[#E8D5B5]">azi</em>?
          </h1>
          <p className="text-white/65 text-[13px] mt-2 leading-snug">
            Alege un format. Restul te ghidează appul.
          </p>
        </div>

        {/* Scroll area: category → subcategory → templates */}
        <div className="mt-5 flex-1 min-h-0 overflow-y-auto -mx-1 px-1 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {visibleCategories.length === 0 ? (
            <p className="text-white/55 text-[13px] text-center mt-12">
              Catalogul e gol momentan.
            </p>
          ) : (
            <div className="space-y-7">
              {visibleCategories.map(({ cat, subs }) => (
                <section key={cat.id}>
                  <CategoryHeader cat={cat} />
                  <div className="mt-3 space-y-5">
                    {subs.map(({ sub, templates }) => (
                      <div key={sub.id}>
                        <p className="text-[10px] tracking-[0.35em] uppercase text-white/45 font-semibold mb-2.5 px-1">
                          {sub.label}
                        </p>
                        <div className="space-y-2.5">
                          {templates.map((t) => {
                            const recSec = totalRecordingSeconds(t);
                            const finalSec = totalFinalSeconds(t);
                            const shots = shotCount(t);
                            return (
                              <button
                                key={t.id}
                                onClick={() => pick(t.id)}
                                className="w-full glass-lux rounded-2xl p-3 flex gap-3 items-stretch text-left active:scale-[0.99] transition"
                              >
                                <div
                                  className="w-20 h-28 rounded-xl bg-cover bg-center shrink-0 border border-white/10"
                                  style={{ backgroundImage: `url(${t.cover})` }}
                                  aria-hidden
                                />
                                <div className="min-w-0 flex-1 flex flex-col">
                                  <h3 className="text-white font-semibold text-[14px] leading-snug">
                                    {t.title}
                                  </h3>
                                  <p className="text-white/65 text-[12px] leading-snug mt-1 line-clamp-2">
                                    {t.promise}
                                  </p>
                                  <div className="mt-auto pt-2 flex items-center gap-2 flex-wrap">
                                    <Pill icon={<Camera className="w-3 h-3" />}>
                                      {shots} cadre
                                    </Pill>
                                    <Pill icon={<Clock className="w-3 h-3" />}>
                                      {recSec}s filmare
                                    </Pill>
                                    <Pill icon={<Sparkles className="w-3 h-3" />}>
                                      ~{finalSec}s reel
                                    </Pill>
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      </div>
    </PhoneShell>
  );
}

/** Category title row with its icon. */
function CategoryHeader({ cat }: { cat: Category }) {
  const Icon = ICONS[cat.icon] ?? Sparkles;
  return (
    <div className="flex items-center gap-2.5 px-1">
      <span className="w-8 h-8 rounded-full bg-[#E8D5B5]/15 text-[#E8D5B5] flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4" />
      </span>
      <div className="min-w-0">
        <h2 className="text-white text-[16px] font-semibold leading-tight">{cat.label}</h2>
        <p className="text-white/55 text-[11px] leading-snug">{cat.blurb}</p>
      </div>
    </div>
  );
}

function Pill({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] tracking-wide text-white/70 px-2 py-0.5 rounded-full bg-white/[0.05] border border-white/10">
      {icon}
      {children}
    </span>
  );
}

/**
 * Small icon map. Keeps category icon names in data (shots.ts) as plain
 * strings so the data file has no React dependency.
 */
const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Wand2,
  Heart,
  Sparkles,
};

// Silence unused-warning for SUBCATEGORIES (kept imported for future
// expansion when subcategory metadata is rendered standalone).
void SUBCATEGORIES;
