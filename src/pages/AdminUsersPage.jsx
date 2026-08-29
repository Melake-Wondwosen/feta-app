import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { FETA, FetaButton, Screen, SectionLabel } from "../brand/FetaBrand";
import PageHeader from "../components/PageHeader";
import { getUsers, saveUsers } from "../services/userService";

const ROLES = [
  { value: "", label: "Brand ambassador" },
  { value: "manager", label: "Regional manager" },
  { value: "admin", label: "Admin" },
];

export default function AdminUsersPage() {
  const { user } = useAuth();

  const [password, setPassword] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [users, setUsers] = useState([]);
  const [reveal, setReveal] = useState({});

  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const unlock = async () => {
    setError("");
    if (!password.trim()) {
      setError("Enter your password.");
      return;
    }
    try {
      setBusy(true);
      const list = await getUsers(user?.username, password.trim());
      setUsers(list);
      setUnlocked(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const update = (i, patch) => {
    setUsers((prev) => prev.map((u, idx) => (idx === i ? { ...u, ...patch } : u)));
    setDirty(true);
  };

  const addUser = () => {
    setUsers((prev) => [
      ...prev,
      {
        id: "",
        username: "",
        password: "",
        name: "",
        role: "",
        region: "",
        canPublish: false,
      },
    ]);
    setDirty(true);
  };

  const publish = async () => {
    setError("");
    setNotice("");

    const cleaned = users
      .map((u) => ({ ...u, username: String(u.username || "").trim() }))
      .filter((u) => u.username);

    if (!cleaned.length) {
      setError("Keep at least one account.");
      return;
    }

    const names = cleaned.map((u) => u.username.toLowerCase());
    const dupe = names.find((n, i) => names.indexOf(n) !== i);
    if (dupe) {
      setError(`Two accounts share the username "${dupe}".`);
      return;
    }

    const blank = cleaned.find((u) => !String(u.password || "").trim());
    if (blank) {
      setError(`${blank.username} needs a password.`);
      return;
    }

    try {
      setBusy(true);
      await saveUsers(cleaned, user?.username, password.trim());
      setUsers(cleaned);
      setDirty(false);
      setNotice("Saved. Changes apply the next time each person signs in.");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <div className="flex flex-col flex-1 px-5 pt-8 pb-10">
        <PageHeader
          title="Users"
          subtitle={unlocked ? `${users.length} accounts` : "Locked"}
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

        {!unlocked ? (
          <>
            <SectionLabel>Confirm it's you</SectionLabel>
            <p
              className="text-xs font-semibold mb-3"
              style={{ color: `${FETA.cream}99` }}
            >
              This screen shows every account's password, so it asks for yours
              first.
            </p>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && unlock()}
              placeholder={`Password for ${user?.username || "you"}`}
              autoComplete="current-password"
              className="feta-field mb-4"
            />
            <FetaButton onClick={unlock} disabled={busy} className="!text-base">
              {busy ? "Checking…" : "Unlock"}
            </FetaButton>
          </>
        ) : (
          <>
            <SectionLabel>Accounts</SectionLabel>
            <div className="space-y-3">
              {users.map((u, i) => (
                <div
                  key={i}
                  className="feta-lockup-flat p-4"
                  style={{ background: FETA.cream, color: FETA.ink }}
                >
                  <input
                    value={u.name}
                    onChange={(e) => update(i, { name: e.target.value })}
                    placeholder="Full name"
                    aria-label="Full name"
                    className="feta-field !py-2 !text-sm mb-2"
                  />

                  <div className="flex gap-2 mb-2">
                    <input
                      value={u.username}
                      onChange={(e) => update(i, { username: e.target.value })}
                      placeholder="Username"
                      aria-label="Username"
                      className="feta-field !py-2 !text-sm flex-1"
                    />
                    <div className="flex-1 flex gap-1">
                      <input
                        type={reveal[i] ? "text" : "password"}
                        value={u.password}
                        onChange={(e) => update(i, { password: e.target.value })}
                        placeholder="Password"
                        aria-label="Password"
                        className="feta-field !py-2 !text-sm flex-1"
                      />
                      <button
                        onClick={() =>
                          setReveal((r) => ({ ...r, [i]: !r[i] }))
                        }
                        aria-label={reveal[i] ? "Hide password" : "Show password"}
                        className="feta-eyebrow px-2 rounded-md flex-none"
                        style={{ background: `${FETA.ink}12`, color: FETA.ink }}
                      >
                        {reveal[i] ? "Hide" : "Show"}
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <select
                      value={u.role}
                      onChange={(e) => update(i, { role: e.target.value })}
                      aria-label="Role"
                      className="feta-field !py-2 !text-sm flex-1"
                    >
                      {ROLES.map((r) => (
                        <option key={r.value} value={r.value}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                    <input
                      value={u.region}
                      onChange={(e) => update(i, { region: e.target.value })}
                      placeholder="Division"
                      aria-label="Division"
                      className="feta-field !py-2 !text-sm flex-1"
                    />
                  </div>

                  <div className="flex items-center gap-3 mt-3">
                    <button
                      onClick={() => update(i, { canPublish: !u.canPublish })}
                      className="feta-eyebrow px-3 py-2 rounded-md"
                      style={{
                        background: u.canPublish ? FETA.red : `${FETA.ink}12`,
                        color: u.canPublish ? FETA.cream : FETA.ink,
                      }}
                    >
                      {u.canPublish ? "★ Can publish" : "Can't publish"}
                    </button>

                    <button
                      onClick={() => {
                        setUsers(users.filter((_, idx) => idx !== i));
                        setDirty(true);
                      }}
                      className="feta-eyebrow px-3 py-2 rounded-md ml-auto"
                      style={{ background: FETA.red, color: FETA.cream }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={addUser}
              className="feta-press feta-display w-full mt-3 py-3 rounded-xl text-xs"
              style={{
                background: FETA.amber,
                color: FETA.ink,
                boxShadow: `0 0 0 2px ${FETA.gold}, 0 0 0 4px ${FETA.ink}`,
              }}
            >
              + Add an account
            </button>

            <div className="mt-8">
              <SectionLabel>Save</SectionLabel>
              <FetaButton onClick={publish} disabled={busy} className="!text-base">
                {busy ? "Saving…" : dirty ? "Save changes" : "Saved"}
              </FetaButton>
            </div>
          </>
        )}
      </div>
    </Screen>
  );
}
