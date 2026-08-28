import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FaUser, FaLock } from "react-icons/fa";
import { loginUser } from "../services/authSevice";
import { FETA, FetaMark, FetaButton, Screen, TibebBand } from "../brand/FetaBrand";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setError("");

    if (!username || !password) {
      setError("Enter your username and password to continue.");
      return;
    }

    try {
      setLoading(true);
      const result = await loginUser(username, password);

      if (result.success) {
        login(result.user);
        navigate("/home");
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <div className="flex-1 overflow-y-auto flex flex-col">
        <div className="m-auto w-full px-6 py-10">
          {/* Header */}
          <div className="text-center mb-7">
            <FetaMark className="w-24 mx-auto drop-shadow-[0_10px_20px_rgba(0,0,0,0.4)]" />

            <h1
              className="feta-display text-4xl mt-5"
              style={{ color: FETA.cream, textShadow: `3px 3px 0 ${FETA.ink}` }}
            >
              Sign in
            </h1>

            <p className="am text-lg mt-1" style={{ color: FETA.amber, fontWeight: 600 }}>
              ከጓደኛ ጋር
            </p>
          </div>

          {/* Card — cream panel built with the wordmark keyline */}
          <div
            className="feta-lockup p-6 pt-5"
            style={{ background: FETA.cream, color: FETA.ink }}
          >
            <div className="-mx-6 -mt-5 mb-5 overflow-hidden rounded-t-[18px]">
              <TibebBand height={20} ground={FETA.red} line={FETA.cream} />
            </div>

            {/* Username */}
            <label className="feta-eyebrow block mb-2" style={{ color: FETA.redDeep }}>
              Username
            </label>
            <div className="relative mb-4">
              <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none z-10">
                <FaUser style={{ color: FETA.red }} />
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Your username"
                autoComplete="username"
                className="feta-field pl-12"
              />
            </div>

            {/* Password */}
            <label className="feta-eyebrow block mb-2" style={{ color: FETA.redDeep }}>
              Password
            </label>
            <div className="relative mb-5">
              <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none z-10">
                <FaLock style={{ color: FETA.red }} />
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
                autoComplete="current-password"
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                className="feta-field pl-12"
              />
            </div>

            {error && (
              <div
                className="rounded-xl px-4 py-3 mb-5 text-sm font-semibold"
                style={{
                  background: `${FETA.red}18`,
                  color: FETA.redDeep,
                  boxShadow: `0 0 0 2px ${FETA.red}`,
                }}
                role="alert"
              >
                {error}
              </div>
            )}

            <FetaButton
              onClick={handleLogin}
              disabled={loading}
              variant="gold"
              className="!text-base"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-3">
                  <span
                    className="w-4 h-4 rounded-full animate-spin"
                    style={{
                      border: `3px solid ${FETA.ink}44`,
                      borderTopColor: FETA.ink,
                    }}
                  />
                  Signing in…
                </span>
              ) : (
                "Sign in"
              )}
            </FetaButton>
          </div>

          <p
            className="feta-eyebrow text-center mt-7"
            style={{ color: `${FETA.cream}80` }}
          >
            Feta Trade Activation · 21+
          </p>
        </div>
      </div>
    </Screen>
  );
}
