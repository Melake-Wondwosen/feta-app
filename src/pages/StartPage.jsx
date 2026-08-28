import { useNavigate } from "react-router-dom";
import {
  FETA,
  FetaLockup,
  FetaButton,
  Screen,
  TibebBand,
  TibebField,
} from "../brand/FetaBrand";

export default function StartPage() {
  const navigate = useNavigate();

  return (
    <Screen>
      <TibebField
        opacity={0.16}
        className="absolute inset-x-0 pointer-events-none"
        style={{ top: "12%", height: "42%" }}
      />

      <div className="relative flex flex-col flex-1 px-6 pt-10 pb-8">
        {/* Hero: the full artwork is the thesis — three friends, one bump. */}
        <div className="flex-1 flex flex-col items-center justify-center">
          <FetaLockup
            className="w-64 max-w-full drop-shadow-[0_14px_30px_rgba(0,0,0,0.45)]"
            alt="Feta — three friends bumping fists over the Feta wordmark"
          />

          <p
            className="am mt-5 text-3xl"
            style={{
              color: FETA.cream,
              fontWeight: 700,
              textShadow: `3px 3px 0 ${FETA.ink}`,
            }}
          >
            ከጓደኛ ጋር
          </p>

          <div className="w-40 my-5">
            <TibebBand height={18} tiles={9} ground={FETA.amber} line={FETA.redDeep} />
          </div>

          <h1
            className="feta-display text-5xl text-center"
            style={{
              color: FETA.cream,
              textShadow: `4px 4px 0 ${FETA.ink}, 8px 8px 0 ${FETA.gold}`,
            }}
          >
            Feta
            <br />
            Wheel
          </h1>

          <p
            className="mt-6 text-sm text-center max-w-[250px] leading-relaxed"
            style={{ color: FETA.amber, fontWeight: 600 }}
          >
            Set up an outlet, spin for a prize, register the winner on the spot.
          </p>
        </div>

        <FetaButton onClick={() => navigate("/login")}>Start →</FetaButton>

        <p
          className="feta-eyebrow text-center mt-5"
          style={{ color: `${FETA.cream}88` }}
        >
          Trade Marketing · 21+
        </p>
      </div>
    </Screen>
  );
}
