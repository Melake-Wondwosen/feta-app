import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { FETA, Screen, SectionLabel } from "../brand/FetaBrand";
import PageHeader from "../components/PageHeader";
import WinCelebration from "../components/WinCelebration";
import { getPrizes, readCachedPrizes, FALLBACK_PRIZES } from "../services/prizeService";
import { getWinMessage, fillTemplate } from "../services/settingsService";
import { bottleCost } from "../services/bottleStock";
import { playClink, playWinChime, playNoWinTone, ensureAudio } from "../services/sounds";

export default function AdminPreviewPage() {
  const { user } = useAuth();

  const [prizes, setPrizes] = useState(readCachedPrizes() || FALLBACK_PRIZES);
  const [winMessage, setWinMessage] = useState(
    "Congratulations! You've won {prize} 🎉"
  );

  /* Keyed so replaying the same prize remounts the celebration and the
     animation runs again from the start. */
  const [preview, setPreview] = useState(null);
  const [runId, setRunId] = useState(0);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    getPrizes().then(setPrizes).catch(() => {});
    getWinMessage().then(setWinMessage).catch(() => {});
  }, []);

  const play = (prizeName) => {
    ensureAudio();
    setPreview(prizeName);
    setRunId((n) => n + 1);

    if (muted) return;

    if (prizeName === null) {
      playNoWinTone();
      return;
    }
    playWinChime();
    if (bottleCost(prizeName) > 1) setTimeout(playClink, 495);
  };

  return (
    <Screen>
      <div className="flex flex-col flex-1 px-5 pt-8 pb-10">
        <PageHeader
          title="Preview"
          subtitle="Test win animations before an activation"
          to="/home"
        />

        <p
          className="text-xs font-semibold mb-4"
          style={{ color: `${FETA.cream}99` }}
        >
          Tap any prize to see exactly what a consumer sees when they win it,
          sound included. Nothing here is recorded and no stock is used.
        </p>

        <div className="flex items-center gap-3 mb-5">
          <button
            onClick={() => setMuted((m) => !m)}
            className="feta-eyebrow px-3 py-2 rounded-md"
            style={{
              background: muted ? `${FETA.cream}22` : FETA.amber,
              color: muted ? FETA.cream : FETA.ink,
            }}
          >
            {muted ? "🔇 Sound off" : "🔊 Sound on"}
          </button>
          {preview !== undefined && preview !== null && (
            <button
              onClick={() => play(preview)}
              className="feta-eyebrow px-3 py-2 rounded-md"
              style={{ background: `${FETA.cream}22`, color: FETA.cream }}
            >
              ↻ Replay
            </button>
          )}
        </div>

        <SectionLabel>Prizes</SectionLabel>
        <div className="grid grid-cols-2 gap-2.5">
          {prizes.map((p) => (
            <button
              key={p.name}
              onClick={() => play(p.name)}
              className="feta-press py-3 px-2 rounded-xl font-extrabold text-xs"
              style={{
                background: preview === p.name ? FETA.amber : FETA.cream,
                color: FETA.ink,
                boxShadow: `0 0 0 2px ${
                  preview === p.name ? FETA.red : FETA.gold
                }, 0 0 0 4px ${FETA.ink}`,
              }}
            >
              {bottleCost(p.name) > 0 ? "🍺 " : p.tier === "main" ? "★ " : ""}
              {p.name}
            </button>
          ))}

          <button
            onClick={() => play(null)}
            className="feta-press py-3 px-2 rounded-xl font-extrabold text-xs col-span-2"
            style={{
              background: preview === null && runId > 0 ? FETA.redDeep : FETA.ink,
              color: FETA.amber,
              boxShadow: `0 0 0 2px ${FETA.gold}, 0 0 0 4px ${FETA.ink}`,
            }}
          >
            No Win
          </button>
        </div>
      </div>

      {/* The overlay, rendered exactly as the spin screen does */}
      {runId > 0 && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center px-6"
          style={{
            background: `${FETA.redDark}77`,
            backdropFilter: "blur(3px)",
            WebkitBackdropFilter: "blur(3px)",
          }}
          onClick={() => setRunId(0)}
        >
          <div
            key={runId}
            className="feta-lockup w-full max-w-sm text-center py-9 px-6"
            style={{ background: `${FETA.cream}F2`, color: FETA.ink }}
          >
            {preview === null ? (
              <>
                <p className="feta-eyebrow" style={{ color: FETA.redDeep }}>
                  No prize this round
                </p>
                <h2 className="feta-display text-2xl mt-2">Better luck next time</h2>
              </>
            ) : (
              <>
                <WinCelebration prize={preview} />
                <p className="feta-eyebrow" style={{ color: FETA.redDeep }}>
                  🎉 Winner
                </p>
                <h2
                  className="feta-display text-2xl mt-2"
                  style={{ textShadow: `2px 2px 0 ${FETA.gold}` }}
                >
                  {fillTemplate(winMessage, preview)}
                </h2>
              </>
            )}

            <button
              onClick={(e) => {
                e.stopPropagation();
                setRunId(0);
              }}
              className="feta-lockup feta-press feta-display w-full mt-7"
              style={{
                height: 52,
                background: FETA.amber,
                color: FETA.ink,
                letterSpacing: "0.08em",
              }}
            >
              Close preview
            </button>
          </div>
        </div>
      )}
    </Screen>
  );
}
