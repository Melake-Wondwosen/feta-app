import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { FETA, FetaButton, Screen, SectionLabel } from "../brand/FetaBrand";
import PageHeader from "../components/PageHeader";
import { getCities, saveCities } from "../services/cityService";

export default function AdminCitiesPage() {
  const { user } = useAuth();

  const [cities, setCities] = useState([]);
  const [newCity, setNewCity] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    getCities()
      .then(setCities)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const add = () => {
    const name = newCity.trim();
    if (!name) return;
    if (cities.some((c) => c.toLowerCase() === name.toLowerCase())) {
      setError(`${name} is already on the list.`);
      return;
    }
    setCities([...cities, name]);
    setNewCity("");
    setDirty(true);
    setError("");
  };

  const publish = async () => {
    setError("");
    setNotice("");

    const cleaned = cities.map((c) => c.trim()).filter(Boolean);
    if (!cleaned.length) {
      setError("Keep at least one city — BAs can't add an outlet without one.");
      return;
    }
    if (!password.trim()) {
      setError("Enter your password to publish.");
      return;
    }

    try {
      setSaving(true);
      await saveCities(cleaned, user?.username, password.trim());
      setCities(cleaned);
      setDirty(false);
      setPassword("");
      setNotice("Published. BAs will see this list next time they add an outlet.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <div className="flex flex-col flex-1 px-5 pt-8 pb-10">
        <PageHeader
          title="Cities"
          subtitle={`${cities.length} in the list`}
          to="/home"
        />

        {notice && (
          <div
            className="feta-lockup-flat px-4 py-3 mb-4 text-sm font-semibold"
            style={{ background: FETA.amber, color: FETA.ink }}
          >
            {notice}
          </div>
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

        {loading ? (
          <p
            className="text-center py-10 text-sm font-semibold"
            style={{ color: `${FETA.cream}AA` }}
          >
            Loading cities…
          </p>
        ) : (
          <>
            <SectionLabel>The list</SectionLabel>
            <div className="space-y-2">
              {cities.map((c, i) => (
                <div
                  key={i}
                  className="feta-lockup-flat flex items-center gap-2 px-3 py-2"
                  style={{ background: FETA.cream }}
                >
                  <input
                    value={c}
                    onChange={(e) => {
                      const next = [...cities];
                      next[i] = e.target.value;
                      setCities(next);
                      setDirty(true);
                    }}
                    aria-label={`City ${i + 1}`}
                    className="feta-field !py-2 !text-sm flex-1"
                  />
                  <button
                    onClick={() => {
                      setCities(cities.filter((_, idx) => idx !== i));
                      setDirty(true);
                    }}
                    aria-label={`Remove ${c}`}
                    className="feta-eyebrow px-3 py-2 rounded-md flex-none"
                    style={{ background: FETA.red, color: FETA.cream }}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2 mt-3">
              <input
                value={newCity}
                onChange={(e) => setNewCity(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && add()}
                placeholder="Add a city"
                className="feta-field flex-1"
              />
              <button
                onClick={add}
                className="feta-press feta-display px-5 rounded-xl flex-none text-xs"
                style={{
                  background: FETA.amber,
                  color: FETA.ink,
                  boxShadow: `0 0 0 2px ${FETA.gold}, 0 0 0 4px ${FETA.ink}`,
                }}
              >
                Add
              </button>
            </div>

            <div className="mt-8">
              <SectionLabel>Publish</SectionLabel>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={`Confirm as ${user?.username || "you"}`}
                autoComplete="current-password"
                className="feta-field mb-4"
              />
              <FetaButton onClick={publish} disabled={saving} className="!text-base">
                {saving ? "Publishing…" : dirty ? "Publish changes" : "Published"}
              </FetaButton>
            </div>
          </>
        )}
      </div>
    </Screen>
  );
}
