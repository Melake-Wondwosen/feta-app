import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FETA,
  FetaMark,
  FetaButton,
  Screen,
  SectionLabel,
} from "../brand/FetaBrand";
import { useAuth } from "../context/AuthContext";
import PageHeader from "../components/PageHeader";
import { getSettings, saveSettings } from "../services/settingsService";
import {
  getPrizes,
  savePrizes,
  readCachedPrizes,
  readCacheTime,
  FALLBACK_PRIZES,
} from "../services/prizeService";

export default function AdminPrizesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [prizes, setPrizes] = useState([]);
  const [newName, setNewName] = useState("");
  const [password, setPassword] = useState("");
  const [noWinWeight, setNoWinWeight] = useState(2);


  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    getSettings()
      .then((cfg) => {
        const w = Number(cfg?.noWinWeight);
        if (isFinite(w) && w >= 0) setNoWinWeight(w);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    let live = true;

    const cached = readCachedPrizes();
    if (cached) setPrizes(cached);

    getPrizes()
      .then((list) => {
        if (!live) return;
        setPrizes(list.length ? list : FALLBACK_PRIZES);
        setDirty(false);
      })
      .catch((err) => {
        if (!live) return;
        setError(
          `Couldn't load the current list: ${err.message} Showing the last copy saved on this phone.`
        );
        if (!cached) setPrizes(FALLBACK_PRIZES);
      })
      .finally(() => live && setLoading(false));

    return () => {
      live = false;
    };
  }, []);

  const update = (i, patch) => {
    setPrizes((prev) => prev.map((p, n) => (n === i ? { ...p, ...patch } : p)));
    setDirty(true);
    setNotice("");
  };

  const remove = (i) => {
    setPrizes((prev) => prev.filter((_, n) => n !== i));
    setDirty(true);
    setNotice("");
  };

  const move = (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= prizes.length) return;
    setPrizes((prev) => {
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
    setDirty(true);
  };

  const add = () => {
    const name = newName.trim();
    if (!name) return;

    if (prizes.some((p) => p.name.toLowerCase() === name.toLowerCase())) {
      setError(`"${name}" is already on the list.`);
      return;
    }

    setPrizes((prev) => [...prev, { name, qty: 5, active: true, tier: "regular", weight: 10 }]);
    setNewName("");
    setError("");
    setDirty(true);
  };

  const save = async () => {
    setError("");
    setNotice("");

    if (!password.trim()) {
      setError("Enter your password to publish.");
      return;
    }

    if (!navigator.onLine) {
      setError("You're offline. Saving needs a connection so BAs can receive the list.");
      return;
    }

    try {
      setSaving(true);
      await savePrizes(prizes, user?.username, password.trim());
      await saveSettings(
        { noWinWeight: String(Number(noWinWeight) || 0) },
        user?.username,
        password.trim()
      );
      setDirty(false);
      setPassword("");
      setNotice(
        "Published. BAs will see the new list next time they open a campaign setup screen."
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const activeCount = prizes.filter((p) => p.active).length;

  /* Live odds so the weights mean something concrete. Only active
     prizes compete, and the wheel's built-in "No Win" slice is counted
     too, so these match what a consumer actually experiences. */
  const NO_WIN_WEIGHT = Number(noWinWeight) || 0;
  const totalWeight =
    prizes
      .filter((p) => p.active)
      .reduce((sum, p) => sum + (Number(p.weight) || 0), 0) + NO_WIN_WEIGHT;

  const oddsFor = (p) => {
    if (!p.active) return "hidden";
    const w = Number(p.weight) || 0;
    if (w <= 0) return "never";
    const pct = (w / totalWeight) * 100;
    return pct < 1 ? `${pct.toFixed(1)}%` : `${Math.round(pct)}%`;
  };
  const cachedAt = readCacheTime();

  return (
    <Screen>
      <div className="flex flex-col flex-1 px-5 pt-8 pb-8">
        <PageHeader
          title="Wheel prizes"
          subtitle={`${activeCount} on the wheel · ${prizes.length} in the list`}
          to="/home"
        />

        {loading && (
          <p
            className="text-center py-4 text-sm font-semibold"
            style={{ color: `${FETA.cream}AA` }}
          >
            Loading the current list…
          </p>
        )}

        {error && (
          <div
            role="alert"
            className="feta-lockup-flat px-4 py-3 mb-4 text-sm font-semibold"
            style={{ background: FETA.ink, color: FETA.amber }}
          >
            {error}
          </div>
        )}

        {notice && (
          <div
            role="status"
            className="feta-lockup-flat px-4 py-3 mb-4 text-sm font-semibold"
            style={{ background: FETA.cream, color: FETA.redDeep }}
          >
            {notice}
          </div>
        )}

        {/* The list */}
        <SectionLabel>The list</SectionLabel>

        <div className="space-y-3">
          {prizes.map((p, i) => (
            <div
              key={i}
              className="feta-lockup-flat p-4"
              style={{
                background: p.active ? FETA.cream : `${FETA.cream}88`,
                color: FETA.ink,
              }}
            >
              <div className="flex items-center gap-2">
                <input
                  value={p.name}
                  onChange={(e) => update(i, { name: e.target.value })}
                  aria-label={`Prize ${i + 1} name`}
                  className="feta-field flex-1 !py-2 !text-sm"
                />
                <button
                  onClick={() => move(i, -1)}
                  aria-label={`Move ${p.name} up`}
                  disabled={i === 0}
                  className="w-9 h-9 rounded-lg flex-none font-bold disabled:opacity-30"
                  style={{ background: FETA.ink, color: FETA.amber }}
                >
                  ↑
                </button>
                <button
                  onClick={() => move(i, 1)}
                  aria-label={`Move ${p.name} down`}
                  disabled={i === prizes.length - 1}
                  className="w-9 h-9 rounded-lg flex-none font-bold disabled:opacity-30"
                  style={{ background: FETA.ink, color: FETA.amber }}
                >
                  ↓
                </button>
              </div>

              <div className="flex items-center gap-3 mt-3">
                <span className="feta-eyebrow" style={{ color: FETA.redDeep }}>
                  Default stock
                </span>
                <input
                  type="number"
                  min="0"
                  value={p.qty}
                  onChange={(e) => update(i, { qty: e.target.value })}
                  aria-label={`Default stock for ${p.name}`}
                  className="feta-field w-20 !py-2 text-center"
                />

                <button
                  onClick={() => update(i, { active: !p.active })}
                  className="feta-eyebrow px-3 py-2 rounded-md"
                  style={{
                    background: p.active ? FETA.amber : FETA.silver,
                    color: FETA.ink,
                  }}
                >
                  {p.active ? "On the wheel" : "Hidden"}
                </button>

                <button
                  onClick={() => remove(i)}
                  className="feta-eyebrow px-3 py-2 rounded-md"
                  style={{ background: FETA.red, color: FETA.cream }}
                >
                  Delete
                </button>
              </div>

              <div className="flex items-center gap-3 mt-3">
                <span className="feta-eyebrow" style={{ color: FETA.redDeep }}>
                  Chance
                </span>
                <input
                  type="number"
                  min="0"
                  value={p.weight}
                  onChange={(e) => update(i, { weight: e.target.value })}
                  aria-label={`Chance weight for ${p.name}`}
                  className="feta-field w-20 !py-2 text-center"
                />
                <span
                  className="text-xs font-bold"
                  style={{ color: FETA.redDeep }}
                >
                  {oddsFor(p)}
                </span>
              </div>

              <div className="flex items-center gap-3 mt-3">
                <span className="feta-eyebrow" style={{ color: FETA.redDeep }}>
                  Prize tier
                </span>
                <button
                  onClick={() =>
                    update(i, { tier: p.tier === "main" ? "regular" : "main" })
                  }
                  className="feta-eyebrow px-3 py-2 rounded-md ml-auto"
                  style={{
                    background: p.tier === "main" ? FETA.red : `${FETA.ink}22`,
                    color: p.tier === "main" ? FETA.cream : FETA.ink,
                  }}
                >
                  {p.tier === "main" ? "★ Main prize" : "Regular prize"}
                </button>
              </div>
              {p.tier === "main" && (
                <p
                  className="text-xs font-semibold mt-2"
                  style={{ color: FETA.redDeep }}
                >
                  Winners of this prize go through full name + phone registration.
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Add */}
        <div className="mt-6">
          <SectionLabel>Add a prize</SectionLabel>
          <div className="flex gap-2.5">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && add()}
              placeholder="Name the prize"
              className="feta-field flex-1 !py-3 !text-sm"
            />
            <button
              onClick={add}
              className="feta-press px-5 rounded-xl feta-display text-xs flex-none"
              style={{
                background: FETA.amber,
                color: FETA.ink,
                boxShadow: `0 0 0 2px ${FETA.gold}, 0 0 0 4px ${FETA.ink}`,
              }}
            >
              Add
            </button>
          </div>
        </div>

        {/* No Win */}
        <div className="mt-8">
          <SectionLabel>Chance of winning nothing</SectionLabel>
          <div
            className="feta-lockup-flat p-4"
            style={{ background: FETA.cream, color: FETA.ink }}
          >
            <div className="flex items-center gap-3">
              <span className="feta-eyebrow" style={{ color: FETA.redDeep }}>
                No Win
              </span>
              <input
                type="number"
                min="0"
                value={noWinWeight}
                onChange={(e) => {
                  setNoWinWeight(e.target.value);
                  setDirty(true);
                }}
                aria-label="Chance weight for winning nothing"
                className="feta-field w-20 !py-2 text-center"
              />
              <span className="text-xs font-bold" style={{ color: FETA.redDeep }}>
                {totalWeight > 0
                  ? `${Math.round((NO_WIN_WEIGHT / totalWeight) * 100)}%`
                  : "—"}
              </span>
            </div>
            <p
              className="text-xs font-semibold mt-2"
              style={{ color: `${FETA.ink}88` }}
            >
              Set to 0 and every spin wins something.
            </p>
          </div>
        </div>

        {/* Save */}
        <div className="mt-8">
          <SectionLabel>Publish</SectionLabel>

          <label className="feta-eyebrow block mb-2" style={{ color: FETA.amber }}>
            Your password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={`Confirm as ${user?.username || "you"}`}
            autoComplete="current-password"
            className="feta-field mb-4"
          />

          <FetaButton onClick={save} disabled={saving} className="!text-base">
            {saving ? "Saving…" : dirty ? "Save and publish" : "Published"}
          </FetaButton>

          {cachedAt && (
            <p
              className="text-xs font-semibold text-center mt-3"
              style={{ color: `${FETA.cream}99` }}
            >
              Last synced {new Date(cachedAt).toLocaleString()}
            </p>
          )}

          <button
            onClick={() => navigate("/home")}
            className="w-full mt-4 py-2 feta-eyebrow"
            style={{ color: `${FETA.cream}AA` }}
          >
            Back to outlets
          </button>
        </div>
      </div>
    </Screen>
  );
}
