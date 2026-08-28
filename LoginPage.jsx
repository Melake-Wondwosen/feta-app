import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FaUser, FaLock } from "react-icons/fa";
import logo from "../assets/21+Logo - Habesha - Vertical.png";
import { loginUser } from "../services/authSevice";

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
      setError("Please enter username and password.");
      return;
    }

    try {
      setLoading(true);

      // Temporary Login
     const result =
  await loginUser(
    username,
    password
  );

    if (result.success) {

      login(result.user);

      navigate("/home");

    } else {

      setError(result.message);
    }
    } catch (err) {
      setError("Unable to login. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen max-w-md mx-auto bg-gradient-to-b from-black via-[#120c00] to-black flex flex-col justify-center px-6 relative overflow-hidden">

      {/* Background Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(234,179,8,0.08),transparent_60%)]" />

      {/* Gold Blobs */}
      <div className="absolute w-72 h-72 bg-yellow-500/10 blur-3xl rounded-full top-[-100px] left-[-100px]" />
      <div className="absolute w-72 h-72 bg-yellow-600/10 blur-3xl rounded-full bottom-[-120px] right-[-120px]" />

      {/* Header */}
      <div className="text-center mb-8 z-10">

        <img
          src={logo}
          alt="Habesha Logo"
          className="w-32 mx-auto mb-5 object-contain"
        />

        <div className="w-20 h-[2px] bg-yellow-500 mx-auto mb-5 rounded-full" />

        <h1 className="text-white text-3xl font-bold">
          Welcome Back
        </h1>

        <p className="text-gray-400 mt-2 text-sm">
          Sign in to continue your activation
        </p>

      </div>

      {/* Login Card */}
      <div className="bg-white/5 backdrop-blur-md border border-yellow-500/20 rounded-3xl p-6 shadow-xl z-10">

        {/* Username */}
        <div className="mb-4">

          <label className="text-gray-400 text-xs mb-2 block">
            Username
          </label>

          <div className="relative">
            <FaUser className="absolute left-4 top-1/2 -translate-y-1/2 text-yellow-500" />

            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              className="
                w-full
                bg-black/30
                border border-yellow-500/20
                rounded-xl
                py-3
                pl-12
                pr-4
                text-white
                placeholder-gray-500
                focus:outline-none
                focus:border-yellow-400
                focus:ring-2
                focus:ring-yellow-500/30
                transition-all
              "
            />
          </div>
        </div>

        {/* Password */}
        <div className="mb-4">

          <label className="text-gray-400 text-xs mb-2 block">
            Password
          </label>

          <div className="relative">
            <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-yellow-500" />

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="
                w-full
                bg-black/30
                border border-yellow-500/20
                rounded-xl
                py-3
                pl-12
                pr-4
                text-white
                placeholder-gray-500
                focus:outline-none
                focus:border-yellow-400
                focus:ring-2
                focus:ring-yellow-500/30
                transition-all
              "
            />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2 mb-4">
            <p className="text-red-400 text-xs">
              {error}
            </p>
          </div>
        )}

        {/* Login Button */}
        <button
          onClick={handleLogin}
          disabled={loading}
          className="
            w-full
            py-3
            rounded-xl
            font-bold
            text-black
            bg-gradient-to-r
            from-yellow-600
            via-yellow-400
            to-yellow-500
            shadow-[0_0_25px_rgba(234,179,8,0.35)]
            hover:scale-[1.01]
            active:scale-95
            transition-all
            duration-300
            disabled:opacity-60
          "
        >
          {loading ? (
            <div className="flex items-center justify-center gap-2">

              <div
                className="
                  w-4
                  h-4
                  border-2
                  border-black
                  border-t-transparent
                  rounded-full
                  animate-spin
                "
              />

              Signing In...
            </div>
          ) : (
            "LOGIN"
          )}
        </button>

      </div>

      {/* Footer */}
      <div className="text-center mt-8 z-10">
        <p className="text-gray-600 text-xs">
          Habesha Trade Activation Platform
        </p>
      </div>

    </div>
  );
}