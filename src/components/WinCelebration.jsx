import { FETA, FetaMark } from "../brand/FetaBrand";
import fetaBottle from "../assets/feta-bottle.png";
import fetaTshirt from "../assets/feta-tshirt.png";
import fetaCap from "../assets/feta-cap.png";
import fetaSixPack from "../assets/feta-sixpack.png";
import fetaKeychain from "../assets/feta-keychain.png";
import fetaOpener from "../assets/feta-opener.png";
import { bottleCost } from "../services/bottleStock";

/* The celebration shown when a prize is won. Lives here rather than
   inside the spin screen so the admin preview renders the identical
   thing — a preview that drifts from production is worse than none. */
/* Prizes we have real product artwork for. Matched loosely so "T-Shirt",
   "Tshirt" and "T Shirt" all land on the same image. */
const MERCH = [
  /* The 6-pack is a single object, so it gets the solo treatment rather
     than six bottles trying to clink. */
  { test: /6\s*-?\s*pack/i, src: fetaSixPack, height: 185 },
  { test: /t[\s-]?shirt/i, src: fetaTshirt, height: 190 },
  { test: /\bcap\b/i, src: fetaCap, height: 150 },
  /* Same physical product, two faces: the logo side for the keychain,
     the opener cutout for the bottle opener. */
  { test: /bottle\s*opener|opener/i, src: fetaKeychain, height: 175 },
  { test: /key\s*-?\s*chain|keyring/i, src: fetaOpener, height: 165 },
];

export default function WinCelebration({ prize }) {
  const bottles = bottleCost(prize);
  const merch = MERCH.find((m) => m.test.test(String(prize || "")));

  /* Merch artwork wins over the bottle animation — a 6-pack costs six
     from the pool but shouldn't render as six separate bottles. */
  if (merch || bottles <= 0) {

    if (merch) {
      return (
        <div
          className="relative flex items-center justify-center -mt-20 mb-3"
          style={{ height: 175 }}
        >
          <span
            aria-hidden="true"
            className="feta-bottle-glow absolute left-1/2 top-1/2 rounded-full pointer-events-none"
            style={{
              width: 240,
              height: 240,
              marginLeft: -120,
              marginTop: -120,
              background: `radial-gradient(circle, ${FETA.amber}DD 0%, ${FETA.gold}66 42%, transparent 70%)`,
            }}
          />
          <img
            src={merch.src}
            alt=""
            aria-hidden="true"
            className="feta-bottle-solo relative w-auto drop-shadow-[0_10px_18px_rgba(23,17,15,0.5)]"
            style={{ height: merch.height }}
          />
        </div>
      );
    }

    return <FetaMark className="w-12 mx-auto mb-3" />;
  }

  const classes =
    bottles === 1
      ? ["feta-bottle-solo"]
      : bottles === 2
      ? ["feta-cheers-left", "feta-cheers-right"]
      : ["feta-cheers-left", "feta-cheers-centre", "feta-cheers-right"];

  return (
    <div
      className="relative flex items-end justify-center -mt-24 mb-3"
      style={{ height: 190 }}
    >
      <span
        aria-hidden="true"
        className="feta-bottle-glow absolute left-1/2 top-1/2 rounded-full pointer-events-none"
        style={{
          width: 240,
          height: 240,
          marginLeft: -120,
          marginTop: -120,
          background: `radial-gradient(circle, ${FETA.amber}DD 0%, ${FETA.gold}66 42%, transparent 70%)`,
        }}
      />

      {classes.map((c, i) => (
        <img
          key={i}
          src={fetaBottle}
          alt=""
          aria-hidden="true"
          className={`${c} relative w-auto drop-shadow-[0_10px_18px_rgba(23,17,15,0.5)]`}
          style={{
            height: bottles === 1 ? 180 : 168,
            marginLeft: i === 0 ? 0 : bottles === 3 ? -22 : -14,
            zIndex: c === "feta-cheers-centre" ? 1 : 2,
          }}
        />
      ))}

      {bottles > 1 && (
        <span
          aria-hidden="true"
          className="feta-clink-spark absolute left-1/2 rounded-full pointer-events-none"
          style={{
            top: 14,
            width: 90,
            height: 90,
            marginLeft: -45,
            zIndex: 3,
            background: `radial-gradient(circle, ${FETA.amber}DD 0%, ${FETA.gold}88 40%, transparent 68%)`,
          }}
        />
      )}
    </div>
  );
}
