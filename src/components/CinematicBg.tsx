import { useEffect, useState } from "react";

type Props = {
  src: string;
  blur?: boolean;
  overlay?: number; // 0..1
  kenBurns?: boolean;
  spotLight?: boolean;
};

export function CinematicBg({
  src,
  blur = false,
  overlay = 0.55,
  kenBurns = true,
  spotLight = true,
}: Props) {
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    const img = new Image();
    img.onload = () => setLoaded(true);
    img.src = src;
  }, [src]);

  return (
    <div className={`absolute inset-0 overflow-hidden vignette grain ${spotLight ? "spot-light" : ""}`}>
      <div
        className={`absolute inset-0 bg-cover bg-center transition-opacity duration-700 ${
          kenBurns ? "ken-burns" : ""
        } ${loaded ? "opacity-100" : "opacity-0"}`}
        style={{
          backgroundImage: `url(${src})`,
          filter: blur ? "blur(28px) saturate(120%)" : "none",
          transform: blur ? "scale(1.15)" : undefined,
        }}
      />
      {/* Warm cinematic gradient (not pure black) */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(180deg,
            rgba(8,5,3,${overlay * 0.78}) 0%,
            rgba(15,10,6,${overlay * 0.30}) 38%,
            rgba(8,5,3,${overlay * 0.92}) 100%)`,
        }}
      />
    </div>
  );
}
