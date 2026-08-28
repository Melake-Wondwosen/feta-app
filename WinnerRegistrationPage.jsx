import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

// Imported the assets from your Start Page
import logo from "../assets/21+Logo - Habesha - Horizontal.png";
import mandalaPattern from "../assets/Gemini_Generated_Image_hngu6uhngu6uhngu.png";

export default function WinnerRegistrationPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const { outlet, prize, outletId, spinId } = location.state || {};

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const already = localStorage.getItem(`spin_done_${spinId}`);

    if (already) {
      alert("This spin is already registered");
      navigate(`/spin/${outletId}`);
    }
  }, []);

  const API_URL =
    "https://script.google.com/macros/s/AKfycbwWZcenN_NwVuPi6WCxt8-T4UTKp9751y_Th3YwzcVunDD_1kaaXUjdnCqGso9Wu0wsyg/exec";

  const submit = async () => {
    if (!fullName || !phone) {
      alert("Name and phone required");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        action: "addWinner",
        outletId,
        outletName: outlet?.name,
        prize,
        fullName,
        phone,
        age,
        gender,
        date: new Date().toISOString()
      };

      const response = await fetch(API_URL, {
        method: "POST",
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      console.log("Apps Script Response:", result);

      if (!result.success) {
        throw new Error(result.message || "Failed to save winner");
      }
      
      const campaign = JSON.parse(
        localStorage.getItem(`campaign_${outletId}`)
      );

      const updated = campaign
        .map(item =>
          item.name === prize
            ? {
                ...item,
                qty: item.qty - 1
              }
            : item
        )
        .filter(item => item.qty > 0);

      localStorage.setItem(
        `campaign_${outletId}`,
        JSON.stringify(updated)
      );

      if (updated.length === 0) {
        alert("All prizes have been distributed!");
        navigate("/home");
        return;
      } 
      alert("Winner registered 🎉");
      navigate(`/spin/${outletId}`, {
        state: { outlet }
      });
    } catch (err) {
      console.error(err);
      alert("Failed to register winner");
    } finally {
      setLoading(false);
    }
  };

  return (
    // Mobile Frame Wrapper Container
    <div className="relative h-screen max-w-md mx-auto overflow-hidden bg-black text-white flex flex-col">
      
      {/* BACKGROUND GRAPHICS (Locked inside frame) */}
      <div className="absolute inset-0 bg-black z-0" />

      {/* Mandala Graphic Layer - Sharp at top */}
      <div
        className="absolute inset-x-0 top-0 h-[45vh] opacity-[0.12] z-0" 
        style={{
          backgroundImage: `url(${mandalaPattern})`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "top center", 
          backgroundSize: "contain",
        }}
      />

      {/* Premium Top Fading Overlay */}
      <div className="absolute inset-x-0 top-0 h-[45vh] bg-gradient-to-b from-transparent to-black z-0 pointer-events-none" />

      {/* Golden Ambient Blur Blob */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-72 h-72 bg-yellow-400/10 blur-[100px] z-0 pointer-events-none" />

      {/* FIXED BRAND HEADER */}
      <div className="relative z-10 pt-8 px-6 flex-none flex flex-col items-center">
        {/* Logo Section */}
        <div className="relative mb-3">
          <div className="absolute inset-0 bg-yellow-400/20 blur-3xl rounded-full" />
          <img
            src={logo}
            alt="Habesha Golden Wheel"
            className="relative w-40 object-contain"
          />
        </div>

        {/* Header Titles */}
        <div className="mb-2 text-center">
          <h1 className="text-2xl font-black bg-gradient-to-r from-[#B8892F] via-[#F5E38A] to-[#B8892F] bg-clip-text text-transparent uppercase tracking-wide">
            Registration
          </h1>
          <div className="w-16 h-[1px] bg-gradient-to-r from-transparent via-[#F5E38A] to-transparent mx-auto my-1.5" />
          
          {/* Displaying Winning Prize Context */}
          <p className="text-[11px] uppercase tracking-widest text-zinc-400 mt-1">
            Prize Won: <span className="text-yellow-400 font-black animate-pulse">{prize || "None"}</span>
          </p>
        </div>
      </div>

      {/* SCROLLABLE INPUT FIELD FORM HOLDER */}
      <div className="relative z-10 flex-1 overflow-y-auto px-6 py-4 space-y-4 custom-scrollbar">
        
        {/* Full Name Input */}
        <div>
          <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">
            Winner Full Name
          </label>
          <input
            placeholder="Enter full name"
            className="w-full p-3.5 text-sm rounded-xl bg-zinc-900/90 border border-yellow-500/10 text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-500/40 focus:ring-1 focus:ring-yellow-500/20"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </div>

        {/* Phone Number Input */}
        <div>
          <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">
            Phone Number
          </label>
          <input
            placeholder="Enter phone number"
            className="w-full p-3.5 text-sm rounded-xl bg-zinc-900/90 border border-yellow-500/10 text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-500/40 focus:ring-1 focus:ring-yellow-500/20"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>

        {/* Age Input */}
        <div>
          <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">
            Age
          </label>
          <input
            type="number"
            placeholder="Enter age"
            className="w-full p-3.5 text-sm rounded-xl bg-zinc-900/90 border border-yellow-500/10 text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-500/40 focus:ring-1 focus:ring-yellow-500/20"
            value={age}
            onChange={(e) => setAge(e.target.value)}
          />
        </div>

        {/* Gender Selection */}
        <div>
          <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">
            Gender
          </label>
          <select
            className="w-full p-3.5 text-sm rounded-xl bg-zinc-900/90 border border-yellow-500/10 text-white focus:outline-none focus:border-yellow-500/40 focus:ring-1 focus:ring-yellow-500/20"
            value={gender}
            onChange={(e) => setGender(e.target.value)}
          >
            <option value="" className="text-zinc-500">Select Gender</option>
            <option>Male</option>
            <option>Female</option>
          </select>
        </div>

      </div>

      {/* ANCHORED STICKY SUBMIT FOOTER */}
      <div className="relative z-10 p-6 bg-gradient-to-t from-black via-black to-transparent flex-none">
        <button
          onClick={submit}
          disabled={loading}
          className="w-full h-14 rounded-xl bg-gradient-to-r from-[#B8892F] via-[#F5E38A] to-[#B8892F] text-black font-black tracking-widest text-sm shadow-[0_4px_25px_rgba(234,179,8,0.2)] active:scale-95 disabled:opacity-40 transition-all"
        >
          {loading ? "SAVING..." : "CONFIRM WIN →"}
        </button>
      </div>

    </div>
  );
}

