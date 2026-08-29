import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FETA, Screen, SectionLabel } from "../brand/FetaBrand";
import PageHeader from "../components/PageHeader";

const SECTIONS = [
  {
    to: "/admin/prizes",
    icon: "🎁",
    title: "Wheel prizes",
    blurb: "What's on the wheel, stock levels and prize tiers",
  },
  {
    to: "/admin/cities",
    icon: "📍",
    title: "Cities",
    blurb: "The list BAs pick from when adding an outlet",
  },
  {
    to: "/admin/users",
    icon: "👥",
    title: "Users",
    blurb: "Usernames, passwords, roles and divisions",
  },
  {
    to: "/admin/analytics",
    icon: "📊",
    title: "National analytics",
    blurb: "Reach and prizes across every division",
  },
];

export default function AdminHubPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <Screen>
      <div className="flex flex-col flex-1 px-5 pt-8 pb-10">
        <PageHeader
          title="Admin"
          subtitle={user?.name || user?.username}
        />

        <SectionLabel>Manage</SectionLabel>

        <div className="space-y-3">
          {SECTIONS.map((s) => (
            <button
              key={s.to}
              onClick={() => navigate(s.to)}
              className="feta-lockup-sm feta-press w-full p-4 flex items-center gap-4 text-left"
              style={{ background: FETA.cream, color: FETA.ink }}
            >
              <span
                className="w-11 h-11 rounded-xl flex items-center justify-center flex-none"
                style={{ background: FETA.amber, fontSize: 20 }}
              >
                {s.icon}
              </span>
              <span className="min-w-0 flex-1">
                <span className="feta-display text-sm block">{s.title}</span>
                <span
                  className="text-xs font-semibold block mt-0.5"
                  style={{ color: `${FETA.ink}99` }}
                >
                  {s.blurb}
                </span>
              </span>
              <span
                className="feta-display flex-none"
                style={{ color: `${FETA.ink}55`, fontSize: 18 }}
              >
                →
              </span>
            </button>
          ))}
        </div>
      </div>
    </Screen>
  );
}
