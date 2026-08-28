import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import logo from "../assets/21+Logo - Habesha - Horizontal.png";
import mandalaPattern from "../assets/pattern_background.png";

const PRIZE_ICONS = {
  "bottle": "🍺", "keychain": "🔑", "key chain": "🔑",
  "t-shirt": "👕", "shirt": "👕", "cap": "🧢",
  "umbrella": "☂️", "glass": "🥂", "opener": "🔧",
  "card": "💳", "crate": "📦", "no win": "😬", "default": "🎁",
};

function getPrizeIcon(label) {
  const lower = label.toLowerCase();
  for (const [key, icon] of Object.entries(PRIZE_ICONS)) {
    if (lower.includes(key)) return icon;
  }
  return PRIZE_ICONS.default;
}
//added for the vercel deployment
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

  const canvasRef = useRef(null);
  const wheelDegRef = useRef(0);
  const containerRef = useRef(null);

  const COLORS = [
    { bg: "#1a1a1a", fg: "#d4af37" },
    { bg: "#d4af37", fg: "#1a1a1a" },
    { bg: "#111111", fg: "#f5e38a" },
    { bg: "#c9a227", fg: "#1a1a1a" },
    { bg: "#222222", fg: "#d4af37" },
    { bg: "#b8892f", fg: "#000000" },
    { bg: "#0a0a0a", fg: "#d4af37" },
    { bg: "#e8c84a", fg: "#1a1a1a" },
  ];
  const NO_WIN_COLOR = { bg: "#3a0000", fg: "#ff6b6b" };

  // ── Calculate wheel size based on screen ──
  useEffect(() => {
    const updateSize = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      // Use 88% of the smaller dimension, capped at 520px
      const size = Math.min(Math.floor(Math.min(vw, vh) * 0.88), 520);
      setWheelSize(size);
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem(`campaign_${id}`);
    if (!saved) { alert("No campaign found"); navigate("/home"); return; }
    setCampaign(JSON.parse(saved));
  }, []);

  useEffect(() => {
    if (campaign.length > 0) drawWheel(wheelDegRef.current);
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
        icon: getPrizeIcon(item.name),
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
    const ctx = canvas.getContext("2d");
    const size = canvas.width;
    const cx = size / 2, cy = size / 2, r = size / 2 - 4;
    ctx.clearRect(0, 0, size, size);

    const slices = buildSlices(campaign);
    if (slices.length === 0) return;

    // Outer gold ring
    ctx.beginPath();
    ctx.arc(cx, cy, r + 2, 0, 2 * Math.PI);
    const ringGrad = ctx.createRadialGradient(cx, cy, r - 10, cx, cy, r + 2);
    ringGrad.addColorStop(0, "#8b6914");
    ringGrad.addColorStop(0.5, "#d4af37");
    ringGrad.addColorStop(1, "#f5e38a");
    ctx.fillStyle = ringGrad;
    ctx.fill();

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r - 8, 0, 2 * Math.PI);
    ctx.clip();

    slices.forEach((sl) => {
      const toRad = (f) => (f * 360 + deg - 90) * (Math.PI / 180);
      const a0 = toRad(sl.startFrac);
      const a1 = toRad(sl.endFrac);
      const am = toRad(sl.midFrac);

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r - 8, a0, a1);
      ctx.closePath();
      ctx.fillStyle = sl.bg;
      ctx.fill();
      ctx.strokeStyle = "#d4af3755";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      const sweepRad = (sl.endFrac - sl.startFrac) * 2 * Math.PI;
      const iconR = r * 0.60;
      const iconX = cx + Math.cos(am) * iconR;
      const iconY = cy + Math.sin(am) * iconR;
      const iconSize = Math.min(size * 0.06, Math.max(size * 0.03, sweepRad * 30));

      // Icon
      ctx.save();
      ctx.translate(iconX, iconY);
      ctx.font = `${iconSize}px serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(sl.icon, 0, -iconSize * 0.7);
      ctx.restore();

      // Label
      const labelR = r * 0.58;
      ctx.save();
      ctx.translate(cx + Math.cos(am) * labelR, cy + Math.sin(am) * labelR);
      ctx.rotate(am + Math.PI / 2);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const fs = Math.min(size * 0.028, Math.max(size * 0.016,
        (labelR * sweepRad) / sl.label.length * 0.75));
      ctx.font = `bold ${fs}px Arial`;
      ctx.fillStyle = sl.fg;
      ctx.shadowColor = "#00000088";
      ctx.shadowBlur = 2;
      let txt = sl.label;
      const maxW = labelR * 0.85;
      if (ctx.measureText(txt).width > maxW) {
        while (txt.length > 2 && ctx.measureText(txt + "…").width > maxW)
          txt = txt.slice(0, -1);
        txt += "…";
      }
      ctx.fillText(txt, 0, iconSize * 0.7);
      ctx.restore();
    });

    ctx.restore();

    // Center circle
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.22, 0, 2 * Math.PI);
    const centerGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 0.22);
    centerGrad.addColorStop(0, "#2a1f00");
    centerGrad.addColorStop(0.6, "#1a1400");
    centerGrad.addColorStop(1, "#d4af37");
    ctx.fillStyle = centerGrad;
    ctx.fill();
    ctx.strokeStyle = "#d4af37";
    ctx.lineWidth = 2;
    ctx.stroke();
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
      if (t < 1) { requestAnimationFrame(animate); return; }

      wheelDegRef.current = finalDeg;
      drawWheel(finalDeg);
      const slices = buildSlices(campaign);
      const result = readPointer(slices, finalDeg);
      setSpinning(false);
      setWinner({ label: result.label, isNoWin: result.isNoWin });

      if (!result.isNoWin) {
        setTimeout(() => {
          navigate("/winner-register", {
            state: { outlet, prize: result.label, outletId: id }
          });
        }, 1200);
      }
    };
    requestAnimationFrame(animate);
  };

  // Center button size relative to wheel
  const centerSize = Math.floor(wheelSize * 0.25);
  const pointerSize = Math.floor(wheelSize * 0.052);

  return (
    // ── Remove max-w-md, use full screen ──
    <div className="relative w-screen h-screen overflow-hidden bg-black text-white flex flex-col">

      {/* ── FULL SCREEN MANDALA BACKGROUND ── */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[#0d0900]" />
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url(${mandalaPattern})`,
            backgroundRepeat: "repeat",
            backgroundSize: `${Math.max(280, window.innerWidth * 0.5)}px`,
          }}
        />
        {/* Vignette */}
        <div
          className="absolute inset-0"
          style={{
            background: "radial-gradient(ellipse at center, transparent 30%, #0d0900 100%)"
          }}
        />
      </div>

      {/* ── CONTENT ── */}
      <div className="relative z-10 flex flex-col h-full w-full">

        {/* TOP HEADER */}
        <div className="pt-4 pb-2 px-6 flex items-center justify-between flex-none">
          <div className="flex-1 text-center">
            <div className="flex items-center justify-center gap-2">
              <span className="text-xl">🏪</span>
              <h2 className="font-black text-white text-lg tracking-wide">
                {outlet?.name || "Outlet"}
              </h2>
            </div>
            {(outlet?.address || outlet?.city) && (
              <p className="text-xs text-zinc-400 mt-0.5">
                📍 {[outlet?.address, outlet?.city].filter(Boolean).join(", ")}
              </p>
            )}
          </div>
          <button
            onClick={() => navigate("/home")}
            className="w-10 h-10 rounded-full bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-400 font-bold ml-3"
          >
            ✕
          </button>
        </div>

        {/* WHEEL + CONTROLS — centered, fills remaining space */}
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-2">

          {/* Wheel container — dynamically sized */}
          <div
            className="relative flex-none"
            style={{ width: wheelSize, height: wheelSize }}
          >
            {/* Glow */}
            <div
              className="absolute rounded-full blur-3xl bg-yellow-500/15 pointer-events-none"
              style={{ inset: -20 }}
            />

            {/* Triangle pointer */}
            <div
              className="absolute left-1/2 -translate-x-1/2 z-30 pointer-events-none"
              style={{
                top: -pointerSize - 2,
                width: 0,
                height: 0,
                borderLeft: `${pointerSize}px solid transparent`,
                borderRight: `${pointerSize}px solid transparent`,
                borderBottom: `${pointerSize * 1.8}px solid #d4af37`,
                filter: "drop-shadow(0 2px 8px rgba(212,175,55,0.9))",
              }}
            />

            {/* Canvas — full dynamic size */}
            <canvas
              ref={canvasRef}
              width={wheelSize}
              height={wheelSize}
              className="relative z-10 rounded-full"
              style={{
                boxShadow: "0 0 50px rgba(212,175,55,0.35), 0 0 0 3px #d4af37",
              }}
            />

            {/* TAP TO PLAY center */}
            <div
              onClick={!spinning ? spin : undefined}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20
                         rounded-full flex flex-col items-center justify-center
                         cursor-pointer active:scale-95 transition-transform select-none"
              style={{
                width: centerSize,
                height: centerSize,
                background: "radial-gradient(circle, #f5e38a 0%, #d4af37 50%, #8b6914 100%)",
                boxShadow: "0 0 25px rgba(212,175,55,0.7), inset 0 1px 0 rgba(255,255,255,0.3)",
                border: "2.5px solid #f5e38a",
              }}
            >
              {spinning ? (
                <div
                  className="border-black/40 border-t-black rounded-full animate-spin"
                  style={{
                    width: centerSize * 0.35,
                    height: centerSize * 0.35,
                    borderWidth: 3,
                  }}
                />
              ) : (
                <span
                  className="text-black font-black text-center leading-tight"
                  style={{ fontSize: centerSize * 0.13 }}
                >
                  TAP TO{"\n"}PLAY
                </span>
              )}
            </div>
          </div>

          {/* Winner toast */}
          {winner && (
            <div className="w-full max-w-sm px-4">
              {winner.isNoWin ? (
                <div className="text-center py-3 px-5 rounded-2xl font-bold uppercase tracking-wider text-red-300 bg-red-950/80 border border-red-700"
                  style={{ fontSize: Math.max(12, wheelSize * 0.03) }}>
                  😬 No luck this time!
                </div>
              ) : (
                <div className="text-center py-3 px-5 rounded-2xl font-bold uppercase tracking-wider text-yellow-300 bg-yellow-950/80 border border-yellow-600"
                  style={{ fontSize: Math.max(12, wheelSize * 0.03) }}>
                  🎉 {winner.label}!
                </div>
              )}
            </div>
          )}

          {/* Tap to play hint */}
          {!hasSpun && !spinning && (
            <p className="text-yellow-400 font-black tracking-widest animate-pulse"
              style={{ fontSize: Math.max(14, wheelSize * 0.035) }}>
              Tap SPIN to play!
            </p>
          )}

          {/* Remaining prizes pills */}
          {campaign.length > 0 && (
            <div className="flex flex-wrap gap-2 justify-center px-4 max-w-lg">
              {campaign.map((item, i) => (
                <span key={i}
                  className="font-bold text-yellow-400 bg-yellow-950/40 border border-yellow-500/20 px-3 py-1 rounded-full"
                  style={{ fontSize: Math.max(10, wheelSize * 0.022) }}>
                  {item.name} ×{item.qty}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* SPIN BUTTON */}
        <div className="p-5 flex-none">
          <button
            onClick={spin}
            disabled={spinning}
            className="w-full rounded-2xl font-black tracking-widest text-black
                       disabled:opacity-40 transition-all active:scale-95"
            style={{
              height: Math.max(48, wheelSize * 0.1),
              fontSize: Math.max(13, wheelSize * 0.03),
              background: spinning
                ? "#555"
                : "linear-gradient(135deg, #8b6914 0%, #d4af37 40%, #f5e38a 60%, #d4af37 80%, #8b6914 100%)",
              boxShadow: spinning ? "none" : "0 4px 20px rgba(212,175,55,0.4)",
            }}
          >
            {spinning ? "SPINNING..." : "🎰  SPIN WHEEL"}
          </button>
        </div>

      </div>
    </div>
  );
}