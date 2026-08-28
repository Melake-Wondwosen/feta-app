import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FETA,
  FetaMark,
  FetaButton,
  Screen,
  SectionLabel,
} from "../brand/FetaBrand";
import {
  getPrizes,
  savePrizes,
  readCachedPrizes,
  readCacheTime,
  FALLBACK_PRIZES,
} from "../services/prizeService";

const ADMIN_KEY_STORE = "feta_admin_key";

export default function AdminPrizesPage() {
  const navigate = useNavigate();

  const [prizes, setPrizes] = useState([]);
  const [newName, setNewName] = useState("");
  const [adminKey, setAdminKey] = useState(
    () => sessionStorage.getItem(ADMIN_KEY_STORE) || ""
  );

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [dirty, setDirty] = useState(false);

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

    setPrizes((prev) => [...prev, { name, qty: 5, active: true }]);
    setNewName("");
    setError("");
    setDirty(true);
  };

  const save = async () => {
    setError("");
    setNotice("");

    if (!adminKey.trim()) {
      setError("Enter the admin key to save.");
      return;
    }

    if (!navigator.onLine) {
      setError("You're offline. Saving needs a connection so BAs can receive the list.");
      return;
    }

    try {
      setSaving(true);
      await savePrizes(prizes, adminKey.trim());
      sessionStorage.setItem(ADMIN_KEY_STORE, adminKey.trim());
      setDirty(false);
      setNotice(
        "Saved. BAs will see this list the next time they open a campaign setup screen."
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const activeCount = prizes.filter((p) => p.active).length;
  const cachedAt = readCacheTime();

  return (
    <Screen>
      <div className="flex flex-col flex-1 px-5 pt-8 pb-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <FetaMark className="w-12 flex-none" />
          <div className="min-w-0">
            <h1
              className="feta-display text-2xl"
              style={{ color: FETA.cream, textShadow: `3px 3px 0 ${FETA.ink}` }}
            >
              Wheel prizes
            </h1>
            <p className="text-xs font-bold mt-1" style={{ color: FETA.amber }}>
              {activeCount} on the wheel · {prizes.length} in the list
            </p>
          </div>
        </div>

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
                  className="feta-eyebrow ml-auto px-3 py-2 rounded-md"
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

        {/* Save */}
        <div className="mt-8">
          <SectionLabel>Publish</SectionLabel>

          <label className="feta-eyebrow block mb-2" style={{ color: FETA.amber }}>
            Admin key
          </label>
          <input
            type="password"
            value={adminKey}
            onChange={(e) => setAdminKey(e.target.value)}
            placeholder="Required to save"
            autoComplete="off"
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
