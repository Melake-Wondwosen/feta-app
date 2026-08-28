import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  FETA,
  FetaMark,
  Screen,
  SectionLabel,
  TibebBand,
} from "../brand/FetaBrand";
import { getManagerStats } from "../services/statsService";

const REFRESH_MS = 60000;

function useCountUp(target, duration = 900) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (typeof target !== "number" || isNaN(target)) return;
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setValue(target);
      return;
    }

    let frame;
    const start = performance.now();
    const from = 0;
    const ease = (t) => 1 - Math.pow(1 - t, 3);

    const step = (now) => {
      const t = Math.min((now - start) / duration, 1);
      setValue(Math.round(from + (target - from) * ease(t)));
      if (t < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);

  return value;
}

/* The hero figure — the number that matters most, given the full
   wordmark treatment so it reads as the headline of the screen. */
function HeadlineStat({ label, value, sub }) {
  const shown = useCountUp(value);
  return (
    <div
      className="feta-lockup px-6 py-7 text-center"
      style={{ background: FETA.cream, color: FETA.ink }}
    >
      <p className="feta-eyebrow" style={{ color: FETA.redDeep }}>
        {label}
      </p>
      <p
        className="feta-display mt-2"
        style={{
          fontSize: 60,
          lineHeight: 0.9,
          textShadow: `3px 3px 0 ${FETA.gold}`,
        }}
      >
        {shown.toLocaleString()}
      </p>
      {sub && (
        <p className="text-xs font-bold mt-3" style={{ color: `${FETA.ink}99` }}>
          {sub}
        </p>
      )}
      <div className="w-24 mx-auto mt-4">
        <TibebBand height={13} ground={FETA.amber} line={FETA.redDeep} />
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, accent, star }) {
  const shown = useCountUp(value);
  return (
    <div
      className="feta-lockup-flat px-4 py-5"
      style={{ background: FETA.cream, color: FETA.ink }}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="feta-eyebrow" style={{ color: FETA.redDeep }}>
          {label}
        </p>
        {star && <span style={{ color: accent, fontSize: 13 }}>★</span>}
      </div>
      <p
        className="feta-display mt-2"
        style={{ fontSize: 34, lineHeight: 1, color: accent || FETA.ink }}
      >
        {shown.toLocaleString()}
      </p>
      {sub && (
        <p className="text-xs font-semibold mt-1.5" style={{ color: `${FETA.ink}88` }}>
          {sub}
        </p>
      )}
    </div>
  );
}

export default function ManagerDashboardPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState(null);

  useEffect(() => {
    let live = true;

    const load = () => {
      getManagerStats(user?.region)
        .then((s) => {
          if (!live) return;
          setStats(s);
          setUpdatedAt(new Date());
          setError("");
        })
        .catch((err) => live && setError(err.message))
        .finally(() => live && setLoading(false));
    };

    load();
    const timer = setInterval(load, REFRESH_MS);
    return () => {
      live = false;
      clearInterval(timer);
    };
  }, [user]);

  const totalWins =
    (stats?.mainPrizeWins || 0) + (stats?.regularPrizeWins || 0);
  const conversion =
    stats?.peopleReached > 0
      ? Math.round((totalWins / stats.peopleReached) * 100)
      : 0;

  return (
    <Screen>
      <div className="flex flex-col flex-1 px-5 pt-8 pb-10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <FetaMark className="w-12 flex-none" />
          <div className="min-w-0 flex-1">
            <h1
              className="feta-display text-2xl"
              style={{ color: FETA.cream, textShadow: `3px 3px 0 ${FETA.ink}` }}
            >
              {stats?.region || "Region"}
            </h1>
            <p className="text-xs font-bold mt-1 truncate" style={{ color: FETA.amber }}>
              {user?.name || user?.username} · Trade marketing
            </p>
          </div>
        </div>

        {loading && !stats && (
          <p
            className="text-center py-10 text-sm font-semibold"
            style={{ color: `${FETA.cream}AA` }}
          >
            Pulling the latest figures…
          </p>
        )}

        {error && (
          <div
            role="alert"
            className="feta-lockup-flat px-4 py-3 mb-5 text-sm font-semibold"
            style={{ background: FETA.ink, color: FETA.amber }}
          >
            {error}
          </div>
        )}

        {stats && (
          <>
            {/* Live BAs — the pulse of the division right now */}
            <div
              className="feta-lockup px-5 py-4 mb-5 flex items-center gap-4"
              style={{ background: FETA.ink, color: FETA.cream }}
            >
              <span className="relative flex h-3 w-3 flex-none">
                {stats.liveBAs > 0 && (
                  <span
                    className="absolute inline-flex h-full w-full rounded-full animate-ping"
                    style={{ background: FETA.amber, opacity: 0.75 }}
                  />
                )}
                <span
                  className="relative inline-flex rounded-full h-3 w-3"
                  style={{
                    background: stats.liveBAs > 0 ? FETA.amber : FETA.silver,
                  }}
                />
              </span>

              <div className="flex-1 min-w-0">
                <p className="feta-eyebrow" style={{ color: FETA.amber }}>
                  Live now
                </p>
                <p className="feta-display text-xl mt-0.5">
                  {stats.liveBAs} of {stats.totalBAs} BAs
                </p>
              </div>

              {stats.liveBAList?.length > 0 && (
                <p
                  className="text-[11px] font-semibold text-right flex-none max-w-[38%] truncate"
                  style={{ color: `${FETA.cream}99` }}
                >
                  {stats.liveBAList.map((b) => b.name).join(", ")}
                </p>
              )}
            </div>

            {/* Reach — the headline number */}
            <HeadlineStat
              label="People reached"
              value={stats.peopleReached}
              sub={`${stats.reachedToday.toLocaleString()} today · ${conversion}% won something`}
            />

            {/* Prize split */}
            <div className="mt-5">
              <SectionLabel>Prizes handed out</SectionLabel>
              <div className="grid grid-cols-2 gap-3">
                <StatCard
                  label="Main prizes"
                  value={stats.mainPrizeWins}
                  sub={`${stats.mainPrizeWinsToday} today`}
                  accent={FETA.red}
                  star
                />
                <StatCard
                  label="Regular prizes"
                  value={stats.regularPrizeWins}
                  sub={`${stats.regularPrizeWinsToday} today`}
                  accent={FETA.redDeep}
                />
              </div>
            </div>

            {/* Coverage */}
            <div className="mt-5">
              <SectionLabel>Coverage</SectionLabel>
              <div className="grid grid-cols-2 gap-3">
                <StatCard label="Outlets activated" value={stats.outlets} />
                <StatCard label="BAs in division" value={stats.totalBAs} />
              </div>
            </div>

            {updatedAt && (
              <p
                className="text-xs font-semibold text-center mt-6"
                style={{ color: `${FETA.cream}80` }}
              >
                Updated {updatedAt.toLocaleTimeString()} · refreshes every minute
              </p>
            )}
          </>
        )}

        <button
          onClick={() => {
            logout();
            navigate("/login");
          }}
          className="w-full mt-8 py-2 feta-eyebrow"
          style={{ color: `${FETA.cream}AA` }}
        >
          Sign out
        </button>
      </div>
    </Screen>
  );
}
