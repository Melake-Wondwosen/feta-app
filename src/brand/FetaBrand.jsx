import { useId } from "react";
import fetaMark from "../assets/feta-mark.png";
import fetaLockup from "../assets/feta-logo-lockup.png";
import fetaPattern from "../assets/feta-pattern-white.png";

export const FETA = {
  red: "#B4222C",
  redDeep: "#7C1319",
  redDark: "#480A0E",
  gold: "#B78B32",
  goldLit: "#D8AB4C",
  amber: "#FBB15C",
  cream: "#FFF4E4",
  ink: "#17110F",
  silver: "#9A9A9A",
};

/* ------------------------------------------------------------------
   Sunburst — the gold rays radiating from the fist bump in the
   master artwork. Ambient background on every screen.
   ------------------------------------------------------------------ */
export function Sunburst({
  rays = 56,
  color = FETA.gold,
  opacity = 0.5,
  spin = false,
  className = "",
  style,
}) {
  const lines = Array.from({ length: rays }, (_, i) => {
    const a = ((i * 360) / rays) * (Math.PI / 180);
    return (
      <line
        key={i}
        x1="50"
        y1="50"
        x2={50 + Math.cos(a) * 80}
        y2={50 + Math.sin(a) * 80}
        stroke={color}
        strokeWidth="0.4"
      />
    );
  });

  /* Positioning (top/left/width/height/translate) lives on this outer
     element and never changes. The rotation animation lives on the inner
     svg, which fills the wrapper exactly and carries no other transform —
     so the animation can't clobber the positioning translate the way it
     would if both were on the same element. */
  return (
    <div className={className} style={style}>
      <svg
        viewBox="0 0 100 100"
        aria-hidden="true"
        className={`w-full h-full ${spin ? "feta-rays-turn" : ""}`}
        style={{ opacity }}
      >
        {lines}
      </svg>
    </div>
  );
}

/* ------------------------------------------------------------------
   Tibeb band — traced from the Feta pattern sheet. The band is a
   solid cream field with the chevron and triangle motif cut into it
   in red, which is how the weave is actually drawn in the artwork.

   ground — the band fill (cream in the source)
   line   — the cut-out linework (red in the source)
   ------------------------------------------------------------------ */
export function TibebBand({
  height = 22,
  ground = FETA.cream,
  line = FETA.red,
  opacity = 1,
  flip = false,
  tiles = 0,
  className = "",
}) {
  const id = useId().replace(/:/g, "");
  const s = height / 43;

  /* With `tiles` set, the band scales so exactly that many whole motifs
     span the full width — nothing is clipped mid-repeat at the edges.
     Without it, the motif keeps its natural pixel size and simply
     repeats, which is what the wide full-bleed trims want. */
  const fitted = tiles > 0;

  return (
    <svg
      width="100%"
      height={height}
      aria-hidden="true"
      className={className}
      viewBox={fitted ? `0 0 ${44 * tiles} 43` : undefined}
      preserveAspectRatio={fitted ? "none" : undefined}
      style={{
        opacity,
        display: "block",
        transform: flip ? "scaleY(-1)" : undefined,
      }}
    >
      <defs>
        <pattern
          id={`tb-${id}`}
          width={fitted ? 44 : 44 * s}
          height={fitted ? 43 : height}
          patternUnits="userSpaceOnUse"
        >
          <g transform={fitted ? undefined : `scale(${s})`}>
            <rect width="44" height="43" fill={ground} />
            <g
              fill="none"
              stroke={line}
              strokeWidth="2.6"
              strokeLinejoin="miter"
              strokeMiterlimit="10"
            >
              <path d="M-22 21 L0 1 L22 21 L44 1 L66 21" />
              <path d="M-22 26.5 L0 6.5 L22 26.5 L44 6.5 L66 26.5" />
              <path d="M11 4.5 L33 4.5 L22 17 Z" />
              <path d="M-12 41 L0 25 L12 41 Z" />
              <path d="M32 41 L44 25 L56 41 Z" />
            </g>
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#tb-${id})`} />
    </svg>
  );
}

/* The dashed row that separates the woven bands in the pattern sheet. */
export function TibebDashes({
  height = 10,
  color = FETA.cream,
  opacity = 1,
  className = "",
}) {
  const id = useId().replace(/:/g, "");
  const s = height / 12;

  return (
    <svg
      width="100%"
      height={height}
      aria-hidden="true"
      className={className}
      style={{ opacity, display: "block" }}
    >
      <defs>
        <pattern
          id={`td-${id}`}
          width={7 * s}
          height={height}
          patternUnits="userSpaceOnUse"
        >
          <rect
            transform={`scale(${s})`}
            x="0"
            y="1"
            width="3.4"
            height="10"
            fill={color}
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#td-${id})`} />
    </svg>
  );
}

/* ------------------------------------------------------------------
   Tibeb field — the pattern sheet itself, used as a large background
   texture. This is the supplied artwork, not a redraw.
   ------------------------------------------------------------------ */
export function TibebField({ opacity = 0.14, className = "", style }) {
  return (
    <div
      aria-hidden="true"
      className={className}
      style={{
        backgroundImage: `url(${fetaPattern})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        opacity,
        ...style,
      }}
    />
  );
}

/* The full artwork: three friends, fist bump, wordmark. Hero use only. */
export function FetaLockup({ className = "", alt = "Feta", style }) {
  return <img src={fetaLockup} alt={alt} className={className} style={style} />;
}

/* The wordmark on its own. Everything smaller than the hero uses this. */
export function FetaMark({ className = "", alt = "Feta", style }) {
  return <img src={fetaMark} alt={alt} className={className} style={style} />;
}

/* ------------------------------------------------------------------
   Screen — the shared shell. Deep red ground, ambient rays, woven
   trim top and bottom. Every page is a panel cut from the same cloth.
   ------------------------------------------------------------------ */
export function Screen({ children, rays = true, trim = true, fullWidth = false }) {
  return (
    <div
      className={`feta-screen relative min-h-screen ${fullWidth ? "" : "max-w-md"} mx-auto overflow-hidden flex flex-col`}
      style={{
        background: `radial-gradient(120% 80% at 50% 0%, ${FETA.red} 0%, ${FETA.redDeep} 55%, ${FETA.redDark} 100%)`,
      }}
    >
      {rays && (
        <Sunburst
          spin
          opacity={0.26}
          className="absolute pointer-events-none"
          style={{
            top: "-40%",
            left: "50%",
            width: "190%",
            /* Sized against the viewport, not the container. A percentage
               height here feeds back into the container's own auto height
               and stretches the page far past its content. */
            height: "190vh",
            maxHeight: "190vh",
            transform: "translateX(-50%)",
            transformOrigin: "center",
          }}
        />
      )}

      {trim && (
        <div className="absolute inset-x-0 top-0 z-20 pointer-events-none">
          <TibebBand height={17} />
        </div>
      )}

      <div className="relative z-10 flex flex-col flex-1">{children}</div>

      {trim && (
        <div className="absolute inset-x-0 bottom-0 z-20 pointer-events-none">
          <TibebBand height={17} flip />
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------
   Buttons. Primary is cream on red — a label stuck to the poster.
   ------------------------------------------------------------------ */
export function FetaButton({
  children,
  variant = "primary",
  className = "",
  style,
  ...rest
}) {
  const skins = {
    primary: { background: FETA.cream, color: FETA.ink },
    gold: { background: FETA.amber, color: FETA.ink },
    ink: { background: FETA.ink, color: FETA.amber },
  };

  return (
    <button
      {...rest}
      className={`feta-lockup feta-press feta-display w-full text-lg py-4 px-5 disabled:opacity-45 disabled:pointer-events-none ${className}`}
      style={{ ...skins[variant], letterSpacing: "0.06em", ...style }}
    >
      {children}
    </button>
  );
}

/* Small caps eyebrow with a rule, used to head every section. */
export function SectionLabel({ children, tone = FETA.amber }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <span className="feta-eyebrow" style={{ color: tone }}>
        {children}
      </span>
      <span className="flex-1 h-px" style={{ background: `${tone}55` }} />
    </div>
  );
}
