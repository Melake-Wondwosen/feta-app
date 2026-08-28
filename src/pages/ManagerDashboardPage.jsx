import { useEffect, useMemo, useState } from "react";
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
import { buildPresets, weeksOfMonth, describeRange } from "../services/dateRanges";

const REFRESH_MS = 60000;

function useCountUp(target, duration = 800) {
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
    const ease = (t) => 1 - Math.pow(1 - t, 3);

    const step = (now) => {
      const t = Math.min((now - start) / duration, 1);
      setValue(Math.round(target * ease(t)));
      if (t < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);

  return value;
}

function Chip({ active, children, onClick }) {
  return (
    <button
      onClick={onClick}
      className="feta-eyebrow px-3 py-2 rounded-lg flex-none whitespace-nowrap"
      style={{
        background: active ? FETA.amber : `${FETA.cream}1A`,
        color: active ? FETA.ink : FETA.cream,
        boxShadow: active
          ? `0 0 0 2px ${FETA.gold}, 0 0 0 4px ${FETA.ink}`
          : `0 0 0 1.5px ${FETA.cream}44`,
      }}
    >
      {children}
    </button>
  );
}

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
        style={{ fontSize: 60, lineHeight: 0.9, textShadow: `3px 3px 0 ${FETA.gold}` }}
      >
        {shown.toLocaleString()}
      </p>
      {sub && (
        <p className="text-xs font-bold mt-3" style={{ color: `${FETA.ink}99` }}>
          {sub}
        </p>
      )}
      <div className="w-24 mx-auto mt-4">
        <TibebBand height={13} tiles={7} ground={FETA.amber} line={FETA.redDeep} />
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

  const presets = useMemo(() => buildPresets(), []);
  const weeks = useMemo(() => weeksOfMonth(), []);

  const [range, setRange] = useState(presets[0]); // Today
  const [custom, setCustom] = useState({ from: "", to: "" });
  const [showCustom, setShowCustom] = useState(false);

  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState(null);

  useEffect(() => {
    let live = true;

    const load = () => {
      getManagerStats(user?.region, range.from, range.to)
        .then((s) => {
          if (!live) return;
          setStats(s);
          setUpdatedAt(new Date());
          setError("");
        })
        .catch((err) => live && setError(err.message))
        .finally(() => live && setLoading(false));
    };

    setLoading(true);
    load();
    const timer = setInterval(load, REFRESH_MS);
    return () => {
      live = false;
      clearInterval(timer);
    };
  }, [user, range]);

  const applyCustom = () => {
    if (!custom.from && !custom.to) return;
    const from = custom.from || custom.to;
    const to = custom.to || custom.from;
    setRange({
      key: "custom",
      label: "Custom",
      from: from <= to ? from : to,
      to: from <= to ? to : from,
    });
    setShowCustom(false);
  };

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
        <div className="flex items-center gap-3 mb-5">
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

        {/* Period picker */}
        <div className="mb-5">
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
            {presets.map((p) => (
              <Chip
                key={p.key}
                active={range.key === p.key}
                onClick={() => setRange(p)}
              >
                {p.label}
              </Chip>
            ))}
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
            {weeks.map((w) => (
              <Chip
                key={w.key}
                active={range.key === w.key}
                onClick={() => setRange(w)}
              >
                {w.label}
              </Chip>
            ))}
            <Chip
              active={range.key === "custom"}
              onClick={() => setShowCustom((v) => !v)}
            >
              Pick dates
            </Chip>
          </div>

          {showCustom && (
            <div
              className="feta-lockup-flat p-4 mt-2"
              style={{ background: FETA.cream, color: FETA.ink }}
            >
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="feta-eyebrow block mb-1.5" style={{ color: FETA.redDeep }}>
                    From
                  </label>
                  <input
                    type="date"
                    value={custom.from}
                    onChange={(e) => setCustom({ ...custom, from: e.target.value })}
                    className="feta-field !py-2 !text-sm"
                  />
                </div>
                <div className="flex-1">
                  <label className="feta-eyebrow block mb-1.5" style={{ color: FETA.redDeep }}>
                    To
                  </label>
                  <input
                    type="date"
                    value={custom.to}
                    onChange={(e) => setCustom({ ...custom, to: e.target.value })}
                    className="feta-field !py-2 !text-sm"
                  />
                </div>
              </div>
              <button
                onClick={applyCustom}
                className="feta-press w-full mt-3 py-2.5 rounded-xl feta-display text-xs"
                style={{
                  background: FETA.amber,
                  color: FETA.ink,
                  boxShadow: `0 0 0 2px ${FETA.gold}, 0 0 0 4px ${FETA.ink}`,
                }}
              >
                Show these dates
              </button>
            </div>
          )}

          <p
            className="text-xs font-bold mt-2 text-center"
            style={{ color: FETA.amber }}
          >
            Showing {describeRange(range.from, range.to)}
            {loading && stats ? " · updating…" : ""}
          </p>
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
            {/* Live BAs — always "right now", never filtered by date */}
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
                  style={{ background: stats.liveBAs > 0 ? FETA.amber : FETA.silver }}
                />
              </span>

              <div className="flex-1 min-w-0">
                <p className="feta-eyebrow" style={{ color: FETA.amber }}>
                  Live right now
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

            <HeadlineStat
              label="People reached"
              value={stats.peopleReached}
              sub={`${conversion}% won something · ${(
                stats.peopleReachedAllTime || 0
              ).toLocaleString()} all time`}
            />

            <div className="mt-5">
              <SectionLabel>Prizes handed out</SectionLabel>
              <div className="grid grid-cols-2 gap-3">
                <StatCard
                  label="Main prizes"
                  value={stats.mainPrizeWins}
                  sub={`${(stats.mainPrizeWinsAllTime || 0).toLocaleString()} all time`}
                  accent={FETA.red}
                  star
                />
                <StatCard
                  label="Regular prizes"
                  value={stats.regularPrizeWins}
                  sub={`${(stats.regularPrizeWinsAllTime || 0).toLocaleString()} all time`}
                  accent={FETA.redDeep}
                />
              </div>
            </div>

            <div className="mt-5">
              <SectionLabel>Coverage</SectionLabel>
              <div className="grid grid-cols-2 gap-3">
                <StatCard
                  label="Outlets activated"
                  value={stats.outlets}
                  sub={`${(stats.outletsAllTime || 0).toLocaleString()} all time`}
                />
                <StatCard label="BAs in division" value={stats.totalBAs} />
              </div>
            </div>

            {/* Who did what in the selected period */}
            {stats.baBreakdown?.length > 0 && (
              <div className="mt-5">
                <SectionLabel>By brand ambassador</SectionLabel>
                <div
                  className="feta-lockup-flat overflow-hidden"
                  style={{ background: FETA.cream, color: FETA.ink }}
                >
                  {stats.baBreakdown.map((b, i) => (
                    <div
                      key={b.id || i}
                      className="flex items-center gap-3 px-4 py-3"
                      style={{
                        borderTop: i === 0 ? "none" : `1.5px solid ${FETA.ink}12`,
                      }}
                    >
                      <span
                        className="feta-display flex-none w-6 text-center"
                        style={{ color: `${FETA.ink}55`, fontSize: 13 }}
                      >
                        {i + 1}
                      </span>
                      <span className="font-bold text-sm flex-1 truncate">
                        {b.name}
                      </span>
                      <span
                        className="feta-eyebrow flex-none"
                        style={{ color: FETA.redDeep }}
                      >
                        {b.reached} reached · {b.wins} won
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {stats.peopleReached === 0 && (
              <p
                className="text-xs font-semibold text-center mt-5"
                style={{ color: `${FETA.cream}99` }}
              >
                No activity recorded in this period.
              </p>
            )}

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
