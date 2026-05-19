export type TransitionId = "cut" | "fade" | "flash" | "zoom";

export interface TransitionPreset {
  id: TransitionId;
  label: string;
  durationMs: number;
}

export const TRANSITIONS: Record<TransitionId, TransitionPreset> = {
  cut:   { id: "cut",   label: "Cut sec",      durationMs: 0 },
  fade:  { id: "fade",  label: "Fade",         durationMs: 300 },
  flash: { id: "flash", label: "Flash alb",    durationMs: 80 },
  zoom:  { id: "zoom",  label: "Zoom punch",   durationMs: 250 },
};
