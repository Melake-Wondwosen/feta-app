import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useState, useEffect } from "react";
import { FaPlus, FaStore, FaFileDownload } from "react-icons/fa";
import { getOutlets } from "../services/outletService";
import { getDeviceId } from "../services/deviceId"; // ✅ moved to top
import logo from "../assets/21+Logo - Habesha - Vertical.png";

export default function HomePage() {
  const [outlets, setOutlets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const API_URL = "https://script.google.com/macros/s/AKfycbwWZcenN_NwVuPi6WCxt8-T4UTKp9751y_Th3YwzcVunDD_1kaaXUjdnCqGso9Wu0wsyg/exec";

  // ✅ Single useEffect — removed duplicate
  useEffect(() => {
    if (!user) return;

    const cached = localStorage.getItem(`outlets_${user.id}`);
    if (cached) setOutlets(JSON.parse(cached));

    loadOutlets();
  }, [user]);

  async function loadOutlets() {
    try {
      const data = await getOutlets(user.id);
      setOutlets(data);
      localStorage.setItem(`outlets_${user.id}`, JSON.stringify(data));
    } catch (error) {
      console.error("Failed to load outlets:", error);
    } finally {
      setLoading(false);
    }
  }

  const generateMyDailyPDF = async () => {
    setDownloading(true);
    try {
      const deviceId = getDeviceId();
      const today = new Date().toISOString().split("T")[0];

      alert("Generating your daily report, please wait...");

      const response = await fetch(
        `${API_URL}?action=generateMyDailyPDF&deviceId=${deviceId}&date=${today}`
      );
      const result = await response.json();

      if (!result.success) {
        alert("Error: " + result.message);
        return;
      }

      const byteChars = atob(result.pdf);
      const byteArrays = [];
      for (let i = 0; i < byteChars.length; i += 512) {
        const slice = byteChars.slice(i, i + 512);
        const bytes = new Uint8Array(slice.length);
        for (let j = 0; j < slice.length; j++) bytes[j] = slice.charCodeAt(j);
        byteArrays.push(bytes);
      }

      const pdfBlob = new Blob(byteArrays, { type: "application/pdf" });
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `my-report-${today}.pdf`;
      a.click();
      URL.revokeObjectURL(url);

    } catch (err) {
      console.error(err);
      alert("Failed: " + err.message);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="min-h-screen max-w-md mx-auto bg-gradient-to-b from-black via-[#120c00] to-black text-white px-5 py-6 flex flex-col">

      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <img src={logo} alt="Habesha Logo" className="w-16 object-contain" />
        <div className="text-right">
          <p className="text-gray-400 text-xs">Logged In As</p>
          <h2 className="font-semibold text-yellow-400">{user?.username}</h2>
        </div>
      </div>

      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Welcome Back 👋</h1>
        <p className="text-gray-400 text-sm mt-1">Ready to activate another outlet?</p>
      </div>

      {/* Section Header */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold">My Outlets</h3>
      </div>

      {/* ✅ Everything below is INSIDE this div */}
      <div className="flex-1 space-y-4">

        {loading && (
          <div className="text-center text-gray-400 py-6">Loading outlets...</div>
        )}

        {!loading && outlets.length === 0 && (
          <div className="text-center text-gray-500 py-8">No outlets assigned yet.</div>
        )}

        {outlets.map((outlet) => (
          <div
            key={outlet.id}
            onClick={() => {
              const existingCampaign = localStorage.getItem(`campaign_${outlet.id}`);
              if (existingCampaign) {
                const parsed = JSON.parse(existingCampaign);
                const hasRemainingPrizes = parsed.some(p => p.qty > 0);
                if (hasRemainingPrizes) {
                  navigate(`/spin/${outlet.id}`, { state: { outlet } });
                  return;
                }
              }
              navigate(`/campaign/${outlet.id}`, { state: { outlet } });
            }}
            className="bg-white/5 border border-yellow-500/20 rounded-2xl p-4 backdrop-blur-md cursor-pointer active:scale-[0.98] transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="bg-yellow-500/10 p-3 rounded-xl">
                <FaStore className="text-yellow-400" />
              </div>
              <div>
                <h4 className="font-semibold">{outlet.name}</h4>
                <p className="text-gray-400 text-sm">{outlet.city}</p>
              </div>
            </div>
          </div>
        ))}

        {/* Add Outlet Card */}
        <div
          onClick={() => navigate("/add-outlet")}
          className="border-2 border-dashed border-yellow-500/30 rounded-2xl p-5 text-center cursor-pointer hover:border-yellow-400 transition-all"
        >
          <FaPlus className="mx-auto text-yellow-400 text-xl mb-2" />
          <p className="font-semibold text-yellow-400">Add New Outlet</p>
          <p className="text-xs text-gray-500 mt-1">Register a new outlet</p>
        </div>

        {/* Separator */}
        <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-yellow-500/10 to-transparent my-6" />

        {/* ✅ BA Daily Report Card — now correctly INSIDE flex-1 div */}
        <div
          onClick={!downloading ? generateMyDailyPDF : undefined}
          className={`
            bg-gradient-to-r from-zinc-900 via-zinc-950 to-zinc-900
            border border-yellow-500/10
            rounded-2xl p-4
            cursor-pointer
            flex items-center justify-between
            active:scale-[0.98] transition-all
            ${downloading ? "opacity-60 cursor-not-allowed" : ""}
          `}
        >
          <div className="flex items-center gap-3">
            <div className="bg-yellow-500/10 p-3 rounded-xl">
              <FaFileDownload className={`text-yellow-400 ${downloading ? "animate-bounce" : ""}`} />
            </div>
            <div>
              <h4 className="font-semibold text-sm text-zinc-100">
                {downloading ? "Generating..." : "My Daily Report"}
              </h4>
              <p className="text-zinc-500 text-xs mt-0.5">Today's winners from your outlets only</p>
            </div>
          </div>
          <span className="text-[10px] bg-yellow-950/60 text-yellow-400 border border-yellow-500/20 px-2.5 py-1 rounded-md font-bold tracking-wide">
            PDF
          </span>
        </div>

      </div> {/* ✅ closes flex-1 space-y-4 */}

      {/* Logout Footer */}
      <div className="mt-8 pb-4">
        <button
          onClick={() => {
            logout();
            navigate("/login");
          }}
          className="w-full py-3 rounded-xl border border-red-500/30 text-red-400 font-semibold bg-red-500/5 transition-colors hover:bg-red-500/10"
        >
          Logout
        </button>
      </div>

    </div>
  );
}