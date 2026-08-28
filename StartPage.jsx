import { useNavigate } from "react-router-dom";

import logo from "../assets/21+Logo - Habesha - Horizontal.png";
import mandalaPattern from "../assets/Gemini_Generated_Image_hngu6uhngu6uhngu.png";

export default function StartPage() {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen max-w-md mx-auto overflow-hidden bg-black text-white">

      {/* Background Glow */}
      <div className="absolute inset-0 bg-black" />

      {/* Mandala Background */}
      <div
        className="absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage: `url(${mandalaPattern})`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
          backgroundSize: "95%",
        }}
      />

      {/* Gold Ambient Glow */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-72 h-72 bg-yellow-400/10 blur-[120px]" />

      {/* Main Content */}
      <div className="relative z-10 flex flex-col min-h-screen px-8 py-10">

        {/* Logo Section */}
        <div className="flex justify-center mt-8">
          <div className="relative">
            <div className="absolute inset-0 bg-yellow-400/20 blur-3xl rounded-full" />

            <img
              src={logo}
              alt="Habesha Golden Wheel"
              className="relative w-56 object-contain"
            />
          </div>
        </div>

        {/* Center Content */}
        <div className="flex-1 flex flex-col items-center justify-center text-center">

          {/* Small Premium Label */}
          <div className="mb-6">
            <span className="px-4 py-1 text-xs tracking-[0.3em] uppercase rounded-full border border-yellow-500/30 text-yellow-300">
              Spin & Win
            </span>
          </div>

          {/* Main Title */}
          <div className="space-y-2">

            <h1 className="text-5xl font-black tracking-tight bg-gradient-to-r from-[#B8892F] via-[#F5E38A] to-[#B8892F] bg-clip-text text-transparent">
              GOLDEN  WHEEL
            </h1>

            {/* <h1 className="text-5xl font-black tracking-tight bg-gradient-to-r from-[#B8892F] via-[#F5E38A] to-[#B8892F] bg-clip-text text-transparent">
             
            </h1> */}

          </div>

          {/* Divider */}
          <div className="w-28 h-[2px] bg-gradient-to-r from-transparent via-[#F5E38A] to-transparent my-6" />

          {/* Subtitle */}
          <p className="text-zinc-400 text-sm tracking-wide max-w-[260px] leading-relaxed">
            Trade_Marketing
          </p>

        </div>

        {/* Start Button */}
        <div className="pb-6">

          <button
            onClick={() => navigate("/login")}
            className="
              w-full
              h-16
              rounded-2xl
              bg-gradient-to-r
              from-[#B8892F]
              via-[#F5E38A]
              to-[#B8892F]
              text-black
              font-extrabold
              tracking-[0.2em]
              text-lg
              shadow-[0_10px_40px_rgba(234,179,8,0.25)]
              active:scale-95
              transition-all
              duration-200
            "
          >
            START→
          </button>

        </div>

      </div>
    </div>
  );
}