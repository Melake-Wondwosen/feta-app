import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { FETA, FetaMark, Sunburst, TibebBand } from "../brand/FetaBrand";

/* Fit a label into at most two lines within the available width. */
function wrapLabel(ctx, text, maxWidth) {
  if (ctx.measureText(text).width <= maxWidth) return [text];

  const words = text.split(" ");
  if (words.length > 1) {
    for (let i = words.length - 1; i > 0; i--) {
      const a = words.slice(0, i).join(" ");
      const b = words.slice(i).join(" ");
      if (
        ctx.measureText(a).width <= maxWidth &&
        ctx.measureText(b).width <= maxWidth
      ) {
        return [a, b];
      }
    }
  }

  let t = text;
  while (t.length > 2 && ctx.measureText(t + "…").width > maxWidth) {
    t = t.slice(0, -1);
  }
  return [t + "…"];
}

export default function SpinWheelPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const outlet = location.state?.outlet;

  const [campaign, setCampaign] = useState([]);
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState(null);
  const [hasSpun, setHasSpun] = useState(false);
  const [wheelSize, setWheelSize] = useState(300);
  const [drawError, setDrawError] = useState("");

  const canvasRef = useRef(null);
  const wheelDegRef = useRef(0);

  /* Segments cycle through the four brand inks so no two neighbours
     ever share a colour: cream, red, gold, ink, amber, deep red. */
  const COLORS = [
    { bg: FETA.cream, fg: FETA.ink },
    { bg: FETA.red, fg: FETA.cream },
    { bg: FETA.gold, fg: FETA.ink },
    { bg: FETA.ink, fg: FETA.amber },
    { bg: FETA.amber, fg: FETA.ink },
    { bg: FETA.redDeep, fg: FETA.cream },
  ];
  const NO_WIN_COLOR = { bg: FETA.redDark, fg: "#E9A9AE" };

  useEffect(() => {
    const updateSize = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const size = Math.min(Math.floor(Math.min(vw, vh) * 0.86), 500);
      setWheelSize(size);
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem(`campaign_${id}`);
    if (!saved) {
      alert("No campaign set up for this outlet yet.");
      navigate("/home");
      return;
    }
    setCampaign(JSON.parse(saved));
  }, []);

  /* Draw synchronously after layout, and again on the next frame. The
     second pass covers the case where the canvas has only just been
     attached, or the viewport settled after a mobile browser chrome
     resize, so the wheel can't be left blank. */
  useLayoutEffect(() => {
    const draw = () => {
      try {
        drawWheel(wheelDegRef.current);
        setDrawError("");
      } catch (err) {
        console.error("Wheel draw failed:", err);
        setDrawError(err.message || String(err));
      }
    };
    draw();
    const frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [campaign, wheelSize]);

  function buildSlices(items) {
    const all = [
      ...items.map((x, i) => ({ ...x, colorIdx: i, isNoWin: false })),
      { name: "No Win", qty: 2, colorIdx: -1, isNoWin: true },
    ];
    const total = all.reduce((s, x) => s + x.qty, 0);
    const slices = [];
    let acc = 0;
    all.forEach((item) => {
      const frac = item.qty / total;
      slices.push({
        label: item.name,
        qty: item.qty,
        startFrac: acc,
        endFrac: acc + frac,
        midFrac: acc + frac / 2,
        isNoWin: item.isNoWin,
        ...(item.isNoWin ? NO_WIN_COLOR : COLORS[item.colorIdx % COLORS.length]),
      });
      acc += frac;
    });
    return slices;
  }

  function readPointer(slices, deg) {
    const normalized = ((-deg % 360) + 360) % 360;
    const frac = normalized / 360;
    for (const sl of slices) {
      if (frac >= sl.startFrac && frac < sl.endFrac) return sl;
    }
    return slices[slices.length - 1];
  }

  function drawWheel(deg) {
    const canvas = canvasRef.current;
    if (!canvas) return;

    /* Size the backing store here rather than through React attributes.
       Setting width/height on a canvas wipes it, so letting React own
       those attributes means a re-render can blank the wheel after we've
       drawn. Doing it here also lets us scale for the device pixel
       ratio, which keeps the labels sharp on phone screens. */
    const size = wheelSize;
    const dpr = window.devicePixelRatio || 1;
    const backing = Math.round(size * dpr);

    if (canvas.width !== backing || canvas.height !== backing) {
      canvas.width = backing;
      canvas.height = backing;
    }
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;

    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const cx = size / 2,
      cy = size / 2,
      r = size / 2 - 4;
    ctx.clearRect(0, 0, size, size);

    const slices = campaign.length > 0 ? buildSlices(campaign) : [];

    const rimWidth = Math.max(10, size * 0.045);
    const innerR = r - rimWidth;

    /* Rim built exactly like the wordmark: ink keyline, gold ring,
       cream band. The wheel is cut from the same material as the logo. */
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, 2 * Math.PI);
    ctx.fillStyle = FETA.ink;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(cx, cy, r - 3, 0, 2 * Math.PI);
    ctx.fillStyle = FETA.gold;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(cx, cy, r - 6, 0, 2 * Math.PI);
    ctx.fillStyle = FETA.cream;
    ctx.fill();

    /* Tick marks on the rim — the dashed row from the tibeb weave. */
    const ticks = 48;
    ctx.save();
    ctx.strokeStyle = FETA.red;
    ctx.lineWidth = Math.max(2, size * 0.008);
    ctx.lineCap = "butt";
    for (let i = 0; i < ticks; i++) {
      const a = (i / ticks) * 2 * Math.PI + deg * (Math.PI / 180);
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * (innerR + 2), cy + Math.sin(a) * (innerR + 2));
      ctx.lineTo(cx + Math.cos(a) * (r - 7), cy + Math.sin(a) * (r - 7));
      ctx.stroke();
    }
    ctx.restore();

    /* Segments */
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, innerR, 0, 2 * Math.PI);
    ctx.clip();

    if (slices.length === 0) {
      ctx.fillStyle = FETA.cream;
      ctx.fill();
      ctx.fillStyle = FETA.redDeep;
      ctx.font = `800 ${size * 0.038}px Archivo, system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("NO PRIZES LOADED", cx, cy - innerR * 0.55);
    }

    slices.forEach((sl) => {
      const toRad = (f) => (f * 360 + deg - 90) * (Math.PI / 180);
      const a0 = toRad(sl.startFrac);
      const a1 = toRad(sl.endFrac);
      const am = toRad(sl.midFrac);

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, innerR, a0, a1);
      ctx.closePath();
      ctx.fillStyle = sl.bg;
      ctx.fill();
      ctx.strokeStyle = FETA.gold;
      ctx.lineWidth = 2;
      ctx.stroke();

      /* Labels run along the radius, reading outward from the hub.
         On the left half they'd land upside down, so they get flipped
         and anchored from the other end. */
      const sweepRad = (sl.endFrac - sl.startFrac) * 2 * Math.PI;
      const hubR = r * 0.26;
      const inset = size * 0.035;
      const trackStart = hubR + inset * 0.6;
      const trackEnd = innerR - inset;
      const trackLen = trackEnd - trackStart;
      if (trackLen < 20) return;

      const midR = (trackStart + trackEnd) / 2;
      const fs = Math.max(
        size * 0.026,
        Math.min(size * 0.042, sweepRad * midR * 0.44)
      );

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(am);

      const flipped = Math.cos(am) < 0;
      if (flipped) ctx.rotate(Math.PI);

      ctx.textAlign = flipped ? "left" : "right";
      ctx.textBaseline = "middle";
      ctx.font = `800 ${fs}px Archivo, system-ui, sans-serif`;
      ctx.fillStyle = sl.fg;

      const anchor = flipped ? -trackEnd : trackEnd;
      const lines = wrapLabel(ctx, sl.label.toUpperCase(), trackLen);

      if (lines.length === 1) {
        ctx.fillText(lines[0], anchor, 0);
      } else {
        ctx.fillText(lines[0], anchor, -fs * 0.56);
        ctx.fillText(lines[1], anchor, fs * 0.56);
      }

      ctx.restore();
    });

    ctx.restore();

    /* Hub — red disc, gold ring, ink keyline. The logo sits on top of
       this as a real image element, not canvas text. */
    const hubR = r * 0.26;
    ctx.beginPath();
    ctx.arc(cx, cy, hubR + 5, 0, 2 * Math.PI);
    ctx.fillStyle = FETA.ink;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx, cy, hubR + 2, 0, 2 * Math.PI);
    ctx.fillStyle = FETA.gold;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx, cy, hubR, 0, 2 * Math.PI);
    ctx.fillStyle = FETA.red;
    ctx.fill();
  }

  const spin = () => {
    if (spinning || campaign.length === 0) return;
    setSpinning(true);
    setWinner(null);
    setHasSpun(true);

    const extraDeg = 360 * 6 + Math.random() * 360 * 3;
    const finalDeg = wheelDegRef.current + extraDeg;
    const startDeg = wheelDegRef.current;
    const startTime = performance.now();
    const duration = 4500;
    const easeOut = (t) => 1 - Math.pow(1 - t, 4.5);

    const animate = (now) => {
      const t = Math.min((now - startTime) / duration, 1);
      const current = startDeg + (finalDeg - startDeg) * easeOut(t);
      wheelDegRef.current = current;
      drawWheel(current);
      if (t < 1) {
        requestAnimationFrame(animate);
        return;
      }

      wheelDegRef.current = finalDeg;
      drawWheel(finalDeg);
      const slices = buildSlices(campaign);
      const result = readPointer(slices, finalDeg);
      setSpinning(false);
      setWinner({ label: result.label, isNoWin: result.isNoWin });

      if (!result.isNoWin) {
        setTimeout(() => {
          navigate("/winner-register", {
            state: { outlet, prize: result.label, outletId: id },
          });
        }, 1200);
      }
    };
    requestAnimationFrame(animate);
  };

  const centerSize = Math.floor(wheelSize * 0.255);
  const pointerSize = Math.floor(wheelSize * 0.05);

  return (
    <div
      className="relative w-screen h-screen overflow-hidden flex flex-col"
      style={{
        background: `radial-gradient(90% 60% at 50% 42%, ${FETA.red} 0%, ${FETA.redDeep} 55%, ${FETA.redDark} 100%)`,
        color: FETA.cream,
      }}
    >
      {/* Sunburst backdrop — the rays from the master artwork */}
      <Sunburst
        rays={72}
        opacity={0.35}
        className="absolute pointer-events-none"
        style={{
          top: "50%",
          left: "50%",
          width: "170vmax",
          height: "170vmax",
          transform: "translate(-50%, -50%)",
        }}
      />

      <div className="absolute inset-x-0 top-0 z-20 pointer-events-none opacity-80">
        <TibebBand height={17} />
      </div>

      <div className="relative z-10 flex flex-col h-full w-full">
        {/* Header */}
        <div className="pt-5 pb-2 px-5 flex items-center gap-3 flex-none">
          <FetaMark className="w-11 flex-none" />
          <div className="flex-1 min-w-0 text-center">
            <h2
              className="feta-display text-base truncate"
              style={{ color: FETA.cream, textShadow: `2px 2px 0 ${FETA.ink}` }}
            >
              {outlet?.name || "Outlet"}
            </h2>
            {(outlet?.address || outlet?.city) && (
              <p
                className="text-xs font-semibold mt-0.5 truncate"
                style={{ color: FETA.amber }}
              >
                {[outlet?.address, outlet?.city].filter(Boolean).join(", ")}
              </p>
            )}
          </div>
          <button
            onClick={() => navigate("/home")}
            aria-label="Close and go back to outlets"
            className="w-10 h-10 rounded-full flex items-center justify-center flex-none feta-press"
            style={{
              background: FETA.cream,
              color: FETA.ink,
              boxShadow: `0 0 0 2px ${FETA.ink}`,
              fontWeight: 900,
            }}
          >
            ✕
          </button>
        </div>

        {/* Wheel */}
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-3">
          <div className="relative flex-none" style={{ width: wheelSize, height: wheelSize }}>
            {/* Pointer — cream chevron with an ink keyline */}
            <div
              className="absolute left-1/2 -translate-x-1/2 z-30 pointer-events-none"
              style={{
                top: -pointerSize - 4,
                width: 0,
                height: 0,
                borderLeft: `${pointerSize}px solid transparent`,
                borderRight: `${pointerSize}px solid transparent`,
                borderTop: `${pointerSize * 1.7}px solid ${FETA.ink}`,
                filter: `drop-shadow(0 3px 0 ${FETA.gold})`,
              }}
            />
            <div
              className="absolute left-1/2 -translate-x-1/2 z-30 pointer-events-none"
              style={{
                top: -pointerSize,
                width: 0,
                height: 0,
                borderLeft: `${pointerSize * 0.68}px solid transparent`,
                borderRight: `${pointerSize * 0.68}px solid transparent`,
                borderTop: `${pointerSize * 1.15}px solid ${FETA.cream}`,
              }}
            />

            <canvas
              ref={canvasRef}
              className="relative z-10 rounded-full"
              style={{
                width: wheelSize,
                height: wheelSize,
                display: "block",
                boxShadow: `0 18px 45px rgba(0,0,0,0.45)`,
              }}
            />

            {/* Hub button */}
            <button
              onClick={spin}
              disabled={spinning}
              aria-label="Spin the wheel"
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20
                         rounded-full flex flex-col items-center justify-center
                         active:scale-95 transition-transform select-none disabled:cursor-not-allowed"
              style={{
                width: centerSize,
                height: centerSize,
                background: FETA.red,
                boxShadow: `0 0 0 3px ${FETA.gold}, 0 0 0 6px ${FETA.ink}`,
                border: 0,
              }}
            >
              {spinning ? (
                <span
                  className="rounded-full animate-spin"
                  style={{
                    width: centerSize * 0.34,
                    height: centerSize * 0.34,
                    border: `3px solid ${FETA.cream}44`,
                    borderTopColor: FETA.cream,
                  }}
                />
              ) : (
                <FetaMark
                  alt=""
                  className="pointer-events-none select-none"
                  style={{ width: centerSize * 0.62 }}
                />
              )}
            </button>
          </div>

          {/* Diagnostics — visible rather than silent */}
          {drawError && (
            <div
              className="w-full max-w-sm px-4"
              role="alert"
              style={{ fontSize: 12 }}
            >
              <div
                className="feta-lockup-flat px-4 py-3 font-semibold"
                style={{ background: FETA.ink, color: FETA.amber }}
              >
                Wheel couldn't draw: {drawError}
              </div>
            </div>
          )}

          {!drawError && campaign.length === 0 && (
            <div className="w-full max-w-sm px-4 text-center">
              <p className="feta-display text-sm" style={{ color: FETA.cream }}>
                No prizes loaded
              </p>
              <button
                onClick={() => navigate(`/campaign/${id}`, { state: { outlet } })}
                className="feta-eyebrow mt-2 underline"
                style={{ color: FETA.amber }}
              >
                Set up the campaign
              </button>
            </div>
          )}

          {/* Result */}
          {winner && (
            <div className="w-full max-w-sm px-4">
              <div
                className="feta-lockup-flat text-center py-3 px-5 feta-display"
                style={{
                  background: winner.isNoWin ? FETA.ink : FETA.cream,
                  color: winner.isNoWin ? FETA.amber : FETA.ink,
                  fontSize: Math.max(14, wheelSize * 0.035),
                }}
              >
                {winner.isNoWin ? "No prize this round" : `🎉 ${winner.label}`}
              </div>
            </div>
          )}

          {!hasSpun && !spinning && (
            <p
              className="feta-display feta-pulse"
              style={{ color: FETA.cream, fontSize: Math.max(14, wheelSize * 0.038) }}
            >
              Tap ፈታ to spin
            </p>
          )}

          {/* Remaining stock */}
          {campaign.length > 0 && (
            <div className="flex flex-wrap gap-2 justify-center px-4 max-w-lg">
              {campaign.map((item, i) => (
                <span
                  key={i}
                  className="px-3 py-1 rounded-full font-bold"
                  style={{
                    background: FETA.cream,
                    color: FETA.ink,
                    boxShadow: `0 0 0 2px ${FETA.ink}`,
                    fontSize: Math.max(10, wheelSize * 0.024),
                  }}
                >
                  {item.name} ×{item.qty}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Spin button */}
        <div className="p-5 flex-none">
          <button
            onClick={spin}
            disabled={spinning}
            className="feta-lockup feta-press feta-display w-full disabled:opacity-45"
            style={{
              height: Math.max(52, wheelSize * 0.11),
              fontSize: Math.max(15, wheelSize * 0.036),
              background: spinning ? FETA.silver : FETA.amber,
              color: FETA.ink,
              letterSpacing: "0.08em",
            }}
          >
            {spinning ? "Spinning…" : "Spin the wheel"}
          </button>
        </div>
      </div>
    </div>
  );
}
