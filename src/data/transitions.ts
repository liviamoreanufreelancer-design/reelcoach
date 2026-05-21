export type TransitionId =
  | "cut"
  | "fade"
  | "flash"
  | "zoom"
  | "glitch"
  | "blur"
  | "slide"
  | "spin";

export interface TransitionPreset {
  id: TransitionId;
  label: string;
  desc: string;
  durationMs: number;
}

export const TRANSITIONS: Record<TransitionId, TransitionPreset> = {
  cut:    { id: "cut",    label: "Cut sec",      desc: "Fără tranziție.",                    durationMs: 0 },
  fade:   { id: "fade",   label: "Fade",         desc: "Cross-fade clasic.",                 durationMs: 300 },
  flash:  { id: "flash",  label: "Flash",        desc: "Flash alb la mijloc.",               durationMs: 200 },
  zoom:   { id: "zoom",   label: "Zoom",         desc: "Punch-out cu scale.",                durationMs: 300 },
  glitch: { id: "glitch", label: "Glitch",       desc: "Distorsiune RGB + scanlines.",       durationMs: 280 },
  blur:   { id: "blur",   label: "Blur",         desc: "Defocus → focus, dreamy.",           durationMs: 380 },
  slide:  { id: "slide",  label: "Slide",        desc: "Clipul nou intră lateral.",          durationMs: 340 },
  spin:   { id: "spin",   label: "Spin",         desc: "Rotație rapidă între clipuri.",      durationMs: 380 },
};

export const TRANSITION_LIST: TransitionPreset[] = [
  TRANSITIONS.fade,
  TRANSITIONS.flash,
  TRANSITIONS.zoom,
  TRANSITIONS.glitch,
  TRANSITIONS.blur,
  TRANSITIONS.slide,
  TRANSITIONS.spin,
  TRANSITIONS.cut,
];
