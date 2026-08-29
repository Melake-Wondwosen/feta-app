import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { FETA, FetaButton, Screen, SectionLabel } from "../brand/FetaBrand";
import PageHeader from "../components/PageHeader";
import { getSettings, saveSettings } from "../services/settingsService";
import { THEMES, applyTheme, cachedTheme } from "../theme/useTheme";

export default function AdminThemePage() {
  const { user } = useAuth();

  const [selected, setSelected] = useState(cachedTheme());
  const [published, setPublished] = useState(cachedTheme());
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    getSettings()
      .then((s) => {
        const t = s?.theme || "poster";
        setSelected(t);
        setPublished(t);
        applyTheme(t);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  /* Preview immediately on tap — the whole app re-skins live, so the
     choice can be judged against real screens rather than a swatch. */
  const preview = (key) => {
    setSelected(key);
    applyTheme(key);
    setNotice("");
  };

  const publish = async () => {
    setError("");
    setNotice("");

    if (!password.trim()) {
      setError("Enter your password to publish.");
      return;
    }

    try {
      setSaving(true);
      await saveSettings({ theme: selected }, user?.username, password.trim());
      setPublished(selected);
      setPassword("");
      setNotice("Published. Everyone gets this look next time they open the app.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const revert = () => {
    setSelected(published);
    applyTheme(published);
    setNotice("");
  };

  const dirty = selected !== published;

  return (
    <Screen>
      <div className="flex flex-col flex-1 px-5 pt-8 pb-10">
        <PageHeader
          title="Appearance"
          subtitle={`Live: ${
            THEMES.find((t) => t.key === published)?.name || "Poster"
          }`}
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
            Loading…
          </p>
        ) : (
          <>
            <SectionLabel>Choose a look</SectionLabel>
            <p
              className="text-xs font-semibold mb-3"
              style={{ color: `${FETA.cream}99` }}
            >
              Tap to preview it here first. Nothing changes for anyone else
              until you publish.
            </p>

            <div className="space-y-3">
              {THEMES.map((t) => {
                const on = selected === t.key;
                return (
                  <button
                    key={t.key}
                    onClick={() => preview(t.key)}
                    className="feta-lockup-sm feta-press w-full p-4 flex items-center gap-4 text-left"
                    style={{
                      background: on ? FETA.amber : FETA.cream,
                      color: FETA.ink,
                    }}
                  >
                    <span
                      className="w-11 h-11 rounded-xl flex items-center justify-center flex-none feta-display"
                      style={{
                        background: FETA.ink,
                        color: FETA.amber,
                        fontSize: 17,
                      }}
                    >
                      {on ? "✓" : t.name.charAt(0)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="feta-display text-sm block">
                        {t.name}
                        {t.key === published && " · live"}
                      </span>
                      <span
                        className="text-xs font-semibold block mt-0.5"
                        style={{ color: FETA.redDeep }}
                      >
                        {t.blurb}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>

            {dirty && (
              <button
                onClick={revert}
                className="feta-eyebrow w-full mt-3 py-2"
                style={{ color: `${FETA.cream}AA` }}
              >
                Undo preview
              </button>
            )}

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
              <FetaButton
                onClick={publish}
                disabled={saving || !dirty}
                className="!text-base"
              >
                {saving
                  ? "Publishing…"
                  : dirty
                  ? "Publish this look"
                  : "Already live"}
              </FetaButton>
            </div>
          </>
        )}
      </div>
    </Screen>
  );
}
