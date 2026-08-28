import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

// Imported the assets from your Start Page
import logo from "../assets/21+Logo - Habesha - Horizontal.png";
import mandalaPattern from "../assets/Gemini_Generated_Image_hngu6uhngu6uhngu.png";

const STANDARD_PRIZES = [
  "Keychain",
  "1 Bottle",
  "2 Bottles",
  "T-Shirt",
  "Cap",
  "Bottle Opener",
  "Umbrella",
  "Glass",
];

export default function CampaignSetupPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const outlet = location.state?.outlet;

  const [prizes, setPrizes] = useState([]);
  const [customPrize, setCustomPrize] = useState("");

  const addPrize = (prizeName) => {
    const existing = prizes.find((p) => p.name === prizeName);
    if (existing) return;

    setPrizes([
      ...prizes,
      {
        name: prizeName,
        qty: 1,
      },
    ]);
  };

  const updateQty = (index, qty) => {
    const updated = [...prizes];
    updated[index].qty = Number(qty);
    setPrizes(updated);
  };

  const removePrize = (index) => {
    const updated = [...prizes];
    updated.splice(index, 1);
    setPrizes(updated);
  };

  const addCustomPrize = () => {
    if (!customPrize.trim()) return;
    addPrize(customPrize);
    setCustomPrize("");
  };

  const startCampaign = () => {
    if (prizes.length === 0) {
      alert("Add at least one prize");
      return;
    }

    localStorage.setItem(`campaign_${outlet.id}`, JSON.stringify(prizes));

    navigate(`/spin/${outlet.id}`, {
      state: { outlet },
    });
  };

  return (
    // FIX 1: Rigid mobile view setup matching your Start Page layout
    <div className="relative h-screen max-w-md mx-auto overflow-hidden bg-black text-white flex flex-col">
      
      {/* BACKGROUND ELEMENTS - Swapped from fixed to absolute to lock them inside the max-w-md frame */}
      <div className="absolute inset-0 bg-black z-0" />

      {/* Mandala Background - True aspect ratio, sharp at the top, perfectly contained */}
      <div
        className="absolute inset-x-0 top-0 h-[45vh] opacity-[0.12] z-0" 
        style={{
          backgroundImage: `url(${mandalaPattern})`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "top center", 
          backgroundSize: "contain",
        }}
      />

      {/* Premium Top Gradient Overlay */}
      <div className="absolute inset-x-0 top-0 h-[45vh] bg-gradient-to-b from-transparent to-black z-0 pointer-events-none" />

      {/* Gold Ambient Glow behind Logo */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-72 h-72 bg-yellow-400/10 blur-[100px] z-0 pointer-events-none" />

      {/* HEADER CONTENT CONTAINER */}
      <div className="relative z-10 pt-8 px-6 flex-none">
        {/* Logo Section */}
        <div className="flex justify-center mb-4">
          <div className="relative">
            <div className="absolute inset-0 bg-yellow-400/20 blur-3xl rounded-full" />
            <img
              src={logo}
              alt="Habesha Golden Wheel"
              className="relative w-40 object-contain"
            />
          </div>
        </div>

        {/* Page Title */}
        <div className="mb-4 text-center">
          <h1 className="text-2xl font-black bg-gradient-to-r from-[#B8892F] via-[#F5E38A] to-[#B8892F] bg-clip-text text-transparent uppercase tracking-wide">
            Campaign Setup
          </h1>
          <div className="w-16 h-[1px] bg-gradient-to-r from-transparent via-[#F5E38A] to-transparent mx-auto my-1.5" />
          <p className="text-[10px] uppercase tracking-widest text-zinc-400">
            Outlet: <span className="text-yellow-400 font-bold">{outlet?.name || "Unknown"}</span>
          </p>
        </div>
      </div>

      {/* FIX 2: INDEPENDENT SCROLLING CONTAINER FOR FORM CONTENT */}
      {/* This holds all inputs, standard buttons, and added submissions safely inside viewport bounds */}
      <div className="relative z-10 flex-1 overflow-y-auto px-6 pb-4 space-y-5 custom-scrollbar">
        
        {/* Standard Trade Materials */}
        <div>
          <h3 className="text-yellow-400 font-bold uppercase tracking-wider text-[11px] mb-2.5">
            Standard Trade Materials
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {STANDARD_PRIZES.map((prize) => (
              <button
                key={prize}
                onClick={() => addPrize(prize)}
                className="bg-gradient-to-r from-[#B8892F] to-[#F5E38A] text-black py-2.5 px-2 rounded-xl font-extrabold text-xs transition-transform active:scale-95"
              >
                {prize}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Prize Input */}
        <div>
          <h3 className="text-yellow-400 font-bold uppercase tracking-wider text-[11px] mb-2.5">
            Custom Prize
          </h3>
          <div className="flex gap-2">
            <input
              value={customPrize}
              onChange={(e) => setCustomPrize(e.target.value)}
              placeholder="Enter custom prize"
              className="flex-1 p-3 text-sm rounded-xl bg-zinc-900/90 border border-yellow-500/20 text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-500/50"
            />
            <button
              onClick={addCustomPrize}
              className="bg-[#F5E38A] text-black px-4 text-xs font-bold rounded-xl transition-transform active:scale-95"
            >
              Add
            </button>
          </div>
        </div>

        {/* Selected Prizes List */}
        <div>
          <h3 className="text-yellow-400 font-bold uppercase tracking-wider text-[11px] mb-2.5">
            Selected Prizes
          </h3>
          <div className="space-y-2.5">
            {prizes.length === 0 && (
              <p className="text-zinc-500 text-xs italic text-center py-2">
                No prizes selected yet.
              </p>
            )}

            {prizes.map((prize, index) => (
              <div
                key={index}
                className="bg-zinc-900/80 backdrop-blur-sm p-3.5 rounded-xl border border-zinc-800 flex flex-col"
              >
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-sm text-zinc-200">{prize.name}</h4>
                  <button
                    onClick={() => removePrize(index)}
                    className="text-red-400 text-[11px] font-semibold hover:text-red-300"
                  >
                    Remove
                  </button>
                </div>

                <input
                  type="number"
                  min="1"
                  value={prize.qty}
                  onChange={(e) => updateQty(index, e.target.value)}
                  className="mt-2.5 w-full p-1.5 text-sm rounded bg-black border border-zinc-700 focus:border-yellow-500/40 text-white text-center font-bold"
                />
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* FIX 3: ACTION BUTTON STICKY FOOTER */}
      {/* Anchored at the bottom of the viewport so the user can hit start without hunting for it */}
      <div className="relative z-10 p-6 bg-gradient-to-t from-black via-black to-transparent flex-none">
        <button
          onClick={startCampaign}
          className="w-full h-14 rounded-xl bg-gradient-to-r from-[#B8892F] via-[#F5E38A] to-[#B8892F] text-black font-black tracking-widest text-sm shadow-[0_4px_25px_rgba(234,179,8,0.2)] active:scale-95 transition-all"
        >
          START CAMPAIGN →
        </button>
      </div>

    </div>
  );
}