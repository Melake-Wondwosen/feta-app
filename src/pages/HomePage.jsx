import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useState, useEffect } from "react";
import { FaPlus, FaStore, FaSlidersH } from "react-icons/fa";
import { getOutlets } from "../services/outletService";
import { isAdmin } from "../components/AdminRoute";
import { pingPresence } from "../services/statsService";
import {
  FETA,
  FetaMark,
  Screen,
  SectionLabel,
  TibebBand,
} from "../brand/FetaBrand";

export default function HomePage() {
  const [outlets, setOutlets] = useState([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const { user, logout } = useAuth();

  useEffect(() => {
    if (!user) return;

    const cached = localStorage.getItem(`outlets_${user.id}`);
    if (cached) setOutlets(JSON.parse(cached));

    loadOutlets();
  }, [user]);

  /* Presence heartbeat — drives the "live BAs" figure on the regional
     manager dashboard. Fire-and-forget, never blocks the UI. */
  useEffect(() => {
    if (!user?.id) return;
    pingPresence(user.id);
    const timer = setInterval(() => pingPresence(user.id), 5 * 60 * 1000);
    return () => clearInterval(timer);
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

  const openOutlet = (outlet) => {
    const existingCampaign = localStorage.getItem(`campaign_${outlet.id}`);
    if (existingCampaign) {
      const parsed = JSON.parse(existingCampaign);
      const hasRemainingPrizes = parsed.some((p) => p.qty > 0);
      if (hasRemainingPrizes) {
        navigate(`/spin/${outlet.id}`, { state: { outlet } });
        return;
      }
    }
    navigate(`/campaign/${outlet.id}`, { state: { outlet } });
  };

  return (
    <Screen>
      <div className="flex flex-col flex-1 px-5 pt-8 pb-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-7">
          <FetaMark className="w-14 drop-shadow-[0_6px_14px_rgba(0,0,0,0.4)]" />
          <div className="text-right">
            <p className="feta-eyebrow" style={{ color: `${FETA.cream}99` }}>
              Signed in as
            </p>
            <h2
              className="feta-display text-lg mt-1"
              style={{ color: FETA.amber }}
            >
              {user?.username}
            </h2>
          </div>
        </div>

        {/* Greeting */}
        <div className="mb-8">
          <h1
            className="feta-display text-4xl"
            style={{ color: FETA.cream, textShadow: `3px 3px 0 ${FETA.ink}` }}
          >
            Welcome
            <br />
            back
          </h1>
          <p className="am text-lg mt-2" style={{ color: FETA.amber, fontWeight: 600 }}>
            ከጓደኛ ጋር
          </p>
        </div>

        <SectionLabel>My outlets</SectionLabel>

        <div className="space-y-4">
          {loading && (
            <p
              className="text-center py-6 text-sm font-semibold"
              style={{ color: `${FETA.cream}99` }}
            >
              Loading outlets…
            </p>
          )}

          {!loading && outlets.length === 0 && (
            <div
              className="feta-lockup-flat text-center py-7 px-5"
              style={{ background: `${FETA.redDark}CC` }}
            >
              <p className="feta-display text-base" style={{ color: FETA.cream }}>
                No outlets yet
              </p>
              <p className="text-sm mt-2" style={{ color: FETA.amber }}>
                Add your first outlet to start a campaign.
              </p>
            </div>
          )}

          {outlets.map((outlet) => (
            <button
              key={outlet.id}
              onClick={() => openOutlet(outlet)}
              className="feta-lockup-sm feta-press w-full text-left p-4 flex items-center gap-4"
              style={{ background: FETA.cream, color: FETA.ink }}
            >
              <span
                className="w-11 h-11 rounded-xl flex items-center justify-center flex-none"
                style={{ background: FETA.red, color: FETA.cream }}
              >
                <FaStore />
              </span>
              <span className="min-w-0">
                <span
                  className="feta-display text-base block truncate"
                  style={{ color: FETA.ink }}
                >
                  {outlet.name}
                </span>
                <span
                  className="text-sm font-semibold block truncate"
                  style={{ color: FETA.redDeep }}
                >
                  {outlet.city}
                </span>
              </span>
            </button>
          ))}

          {/* Add outlet — field work, not an admin task */}
          {!isAdmin(user) && (
          <button
            onClick={() => navigate("/add-outlet")}
            className="feta-press w-full rounded-2xl p-5 text-center"
            style={{
              background: "transparent",
              border: `3px dashed ${FETA.amber}`,
              color: FETA.amber,
            }}
          >
            <FaPlus className="mx-auto text-xl mb-2" />
            <span className="feta-display text-base block">Add an outlet</span>
            <span className="text-xs font-semibold block mt-1 opacity-80">
              Register a new shop or bar
            </span>
          </button>
          )}

          <div className="py-2 opacity-40">
            <TibebBand height={16} />
          </div>

          {isAdmin(user) && (
          <button
            onClick={() => navigate("/admin")}
            className="feta-lockup-sm feta-press w-full p-4 flex items-center justify-between gap-3"
            style={{ background: FETA.amber, color: FETA.ink }}
          >
            <span className="flex items-center gap-4 text-left">
              <span
                className="w-11 h-11 rounded-xl flex items-center justify-center flex-none"
                style={{ background: FETA.ink, color: FETA.amber }}
              >
                <FaSlidersH />
              </span>
              <span>
                <span className="feta-display text-sm block">Admin panel</span>
                <span className="text-xs font-semibold block mt-0.5" style={{ color: FETA.redDeep }}>
                  Prizes, cities, users and analytics
                </span>
              </span>
            </span>
            <span
              className="feta-eyebrow px-2.5 py-1.5 rounded-md flex-none"
              style={{ background: FETA.ink, color: FETA.amber }}
            >
              Admin
            </span>
          </button>
        )}
        </div>

        {/* Sign out */}
        <button
          onClick={() => {
            logout();
            navigate("/login");
          }}
          className="feta-press w-full mt-8 py-3.5 rounded-xl feta-display text-sm"
          style={{
            background: "transparent",
            border: `2px solid ${FETA.cream}55`,
            color: `${FETA.cream}CC`,
          }}
        >
          Sign out
        </button>
      </div>
    </Screen>
  );
}
