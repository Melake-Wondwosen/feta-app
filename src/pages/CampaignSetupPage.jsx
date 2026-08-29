import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  FETA,
  FetaMark,
  FetaButton,
  Sunburst,
  SectionLabel,
  TibebBand,
} from "../brand/FetaBrand";

import {
  getActivePrizes,
  readCachedPrizes,
  FALLBACK_PRIZES,
} from "../services/prizeService";

import fetaBottle from "../assets/feta-bottle.png";
import fetaTshirt from "../assets/feta-tshirt.png";
import fetaCap from "../assets/feta-cap.png";
import fetaSixPack from "../assets/feta-sixpack.png";
import fetaKeychain from "../assets/feta-keychain.png";
import fetaOpener from "../assets/feta-opener.png";

/* Thumbnail for a prize, when we have real product artwork for it. */
function prizeImage(name) {
  if (/6\s*-?\s*pack/i.test(name)) return fetaSixPack;
  if (isBottlePrize(name)) return fetaBottle;
  if (/t[\s-]?shirt/i.test(name)) return fetaTshirt;
  if (/\bcap\b/i.test(name)) return fetaCap;
  if (/opener/i.test(name)) return fetaKeychain;
  if (/key\s*-?\s*chain|keyring/i.test(name)) return fetaOpener;
  return null;
}
import {
  BOTTLES_PER_CRATE,
  isBottlePrize,
  cratesToBottles,
  writePool,
} from "../services/bottleStock";

export default function CampaignSetupPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const outlet = location.state?.outlet;

  const [prizes, setPrizes] = useState([]);
  const [customPrize, setCustomPrize] = useState("");
  const [crates, setCrates] = useState("");

  /* The catalogue comes from the sheet, so an admin can change what
     every BA sees without shipping a new build. Cached on the phone so
     setup still works with no signal. */
  const [catalogue, setCatalogue] = useState(
    () => (readCachedPrizes() || FALLBACK_PRIZES).filter((p) => p.active !== false)
  );
  const [catalogueState, setCatalogueState] = useState("loading");

  useEffect(() => {
    let live = true;
    getActivePrizes()
      .then((list) => {
        if (!live || !list.length) return;
        setCatalogue(list);
        setCatalogueState("live");
      })
      .catch(() => live && setCatalogueState("cached"));
    return () => {
      live = false;
    };
  }, []);

  const addPrize = (prizeName, defaultQty = 1, tier = "regular", weight = 10) => {
    const existing = prizes.find((p) => p.name === prizeName);
    if (existing) return;
    setPrizes([
      ...prizes,
      {
        name: prizeName,
        qty: Number(defaultQty) || 1,
        tier: tier === "main" ? "main" : "regular",
        weight: Number(weight) || 0,
      },
    ]);
  };

  const updateQty = (index, qty) => {
    const updated = [...prizes];
    updated[index].qty = Number(qty);
    setPrizes(updated);
  };

  const toggleTier = (index) => {
    setPrizes((prev) =>
      prev.map((p, i) =>
        i === index
          ? { ...p, tier: p.tier === "main" ? "regular" : "main" }
          : p
      )
    );
  };

  const removePrize = (index) => {
    const updated = [...prizes];
    updated.splice(index, 1);
    setPrizes(updated);
  };

  const addCustomPrize = () => {
    if (!customPrize.trim()) return;
    addPrize(customPrize.trim());
    setCustomPrize("");
  };

  const startCampaign = () => {
    if (prizes.length === 0) {
      alert("Add at least one prize before starting.");
      return;
    }
    if (prizes.some((p) => isBottlePrize(p.name))) {
      const bottles = cratesToBottles(crates);
      if (bottles <= 0) {
        alert("Enter how many crates of beer you have for this outlet.");
        return;
      }
      writePool(outlet.id, bottles);
    }

    localStorage.setItem(`campaign_${outlet.id}`, JSON.stringify(prizes));
    navigate(`/spin/${outlet.id}`, { state: { outlet } });
  };

  const isSelected = (name) => prizes.some((p) => p.name === name);

  const hasBeer = prizes.some((p) => isBottlePrize(p.name));
  const bottleTotal = cratesToBottles(crates);

  return (
    <div
      className="relative h-[100dvh] max-w-md mx-auto overflow-hidden flex flex-col"
      style={{
        background: `radial-gradient(110% 60% at 50% 0%, ${FETA.red} 0%, ${FETA.redDeep} 55%, ${FETA.redDark} 100%)`,
        color: FETA.cream,
      }}
    >
      <Sunburst
        opacity={0.24}
        className="absolute pointer-events-none"
        style={{
          top: "-55%",
          left: "50%",
          width: "180%",
          height: "180%",
          transform: "translateX(-50%)",
        }}
      />
      <div className="absolute inset-x-0 top-0 z-20 pointer-events-none opacity-85">
        <TibebBand height={17} />
      </div>

      {/* Header */}
      <div className="relative z-10 pt-7 px-6 flex-none">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => navigate("/home")}
            aria-label="Back to outlets"
            className="feta-press flex-none w-10 h-10 rounded-xl flex items-center justify-center"
            style={{
              background: FETA.cream,
              color: FETA.ink,
              boxShadow: `0 0 0 2px ${FETA.gold}, 0 0 0 4px ${FETA.ink}`,
              fontSize: 18,
              fontWeight: 900,
              lineHeight: 1,
            }}
          >
            ←
          </button>
          <FetaMark className="w-10 flex-none" />
          <div className="min-w-0">
            <h1
              className="feta-display text-2xl"
              style={{ color: FETA.cream, textShadow: `3px 3px 0 ${FETA.ink}` }}
            >
              Campaign setup
            </h1>
            <p
              className="text-xs font-bold truncate mt-1"
              style={{ color: FETA.amber }}
            >
              {outlet?.name || "Unknown outlet"}
            </p>
          </div>
        </div>
      </div>

      {/* Scrolling body */}
      <div className="feta-scroll relative z-10 flex-1 overflow-y-auto px-6 pb-4 space-y-6">
        {/* Standard prizes */}
        <div>
          <SectionLabel>Trade materials</SectionLabel>
          {catalogueState === "cached" && (
            <p
              className="text-xs font-semibold mb-2.5"
              style={{ color: `${FETA.cream}AA` }}
            >
              Offline — showing the last list this phone downloaded.
            </p>
          )}
          <div className="grid grid-cols-2 gap-2.5">
            {catalogue.map((item) => {
              const prize = item.name;
              const on = isSelected(prize);
              return (
                <button
                  key={prize}
                  onClick={() => addPrize(prize, item.qty, item.tier, item.weight)}
                  className="feta-press py-3 px-2 rounded-xl font-extrabold text-xs"
                  style={{
                    background: on ? FETA.amber : FETA.cream,
                    color: FETA.ink,
                    boxShadow: `0 0 0 2px ${on ? FETA.red : FETA.gold}, 0 0 0 4px ${FETA.ink}`,
                  }}
                >
                  {prizeImage(prize) && (
                    <img
                      src={prizeImage(prize)}
                      alt=""
                      aria-hidden="true"
                      className="h-7 w-auto mx-auto mb-1 object-contain"
                    />
                  )}
                  {item.tier === "main" ? "★ " : ""}
                  {on ? `✓ ${prize}` : prize}
                </button>
              );
            })}
          </div>
        </div>

        {/* Beer stock — one number covers every bottle prize */}
        {hasBeer && (
          <div>
            <SectionLabel>Beer stock</SectionLabel>
            <div
              className="feta-lockup-flat p-4"
              style={{ background: FETA.cream, color: FETA.ink }}
            >
              <label
                className="feta-eyebrow block mb-2"
                style={{ color: FETA.redDeep }}
              >
                Crates for this outlet
              </label>
              <input
                type="number"
                min="1"
                inputMode="numeric"
                value={crates}
                onChange={(e) => setCrates(e.target.value)}
                placeholder="e.g. 5"
                className="feta-field !py-2.5"
              />
              <p
                className="text-sm font-bold mt-3"
                style={{ color: bottleTotal > 0 ? FETA.redDeep : `${FETA.ink}77` }}
              >
                {bottleTotal > 0
                  ? `${bottleTotal} bottles available (${BOTTLES_PER_CRATE} per crate)`
                  : `Each crate is ${BOTTLES_PER_CRATE} bottles.`}
              </p>
              <p
                className="text-xs font-semibold mt-2"
                style={{ color: `${FETA.ink}88` }}
              >
                One, two and three bottle wins all come out of this total. A
                prize drops off the wheel once there aren't enough left.
              </p>
            </div>
          </div>
        )}

        {/* Custom prize */}
        <div>
          <SectionLabel>Something else</SectionLabel>
          <div className="flex gap-2.5">
            <input
              value={customPrize}
              onChange={(e) => setCustomPrize(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addCustomPrize()}
              placeholder="Name the prize"
              className="feta-field flex-1 !py-3 !text-sm"
            />
            <button
              onClick={addCustomPrize}
              className="feta-press px-5 rounded-xl feta-display text-xs flex-none"
              style={{
                background: FETA.amber,
                color: FETA.ink,
                boxShadow: `0 0 0 2px ${FETA.gold}, 0 0 0 4px ${FETA.ink}`,
              }}
            >
              Add
            </button>
          </div>
        </div>

        {/* Selected */}
        <div>
          <SectionLabel>On the wheel</SectionLabel>

          {prizes.length > 0 && (
            <p
              className="text-xs font-semibold mb-2.5"
              style={{ color: `${FETA.cream}AA` }}
            >
              Tap a prize's tier to change it for this outlet only.
            </p>
          )}

          {prizes.length === 0 ? (
            <div
              className="rounded-xl py-5 px-4 text-center"
              style={{ border: `2px dashed ${FETA.amber}66` }}
            >
              <p className="text-sm font-semibold" style={{ color: `${FETA.cream}CC` }}>
                Nothing on the wheel yet. Pick a prize above to add it.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {prizes.map((prize, index) => (
                <div
                  key={index}
                  className="feta-lockup-flat p-4"
                  style={{ background: FETA.cream, color: FETA.ink }}
                >
                  <div className="flex justify-between items-center gap-3">
                    {prizeImage(prize.name) && (
                      <img
                        src={prizeImage(prize.name)}
                        alt=""
                        aria-hidden="true"
                        className="flex-none h-10 w-auto object-contain drop-shadow-[0_2px_4px_rgba(23,17,15,0.3)]"
                      />
                    )}
                    <h4 className="feta-display text-sm truncate flex items-center gap-1.5 flex-1">
                      {prize.tier === "main" && <span>★</span>}
                      {prize.name}
                    </h4>
                    <button
                      onClick={() => removePrize(index)}
                      className="feta-eyebrow flex-none px-2.5 py-1.5 rounded-md"
                      style={{ background: FETA.red, color: FETA.cream }}
                    >
                      Remove
                    </button>
                  </div>

                  {isBottlePrize(prize.name) ? (
                    <p
                      className="text-xs font-semibold mt-3"
                      style={{ color: `${FETA.ink}99` }}
                    >
                      Drawn from your beer crates below.
                    </p>
                  ) : (
                    <div className="flex items-center gap-3 mt-3">
                      <span className="feta-eyebrow" style={{ color: FETA.redDeep }}>
                        Quantity
                      </span>
                      <input
                        type="number"
                        min="1"
                        value={prize.qty}
                        onChange={(e) => updateQty(index, e.target.value)}
                        aria-label={`Quantity of ${prize.name}`}
                        className="feta-field flex-1 !py-2 text-center"
                      />
                    </div>
                  )}

                  <div className="flex items-center gap-3 mt-3">
                    <span className="feta-eyebrow" style={{ color: FETA.redDeep }}>
                      Tier
                    </span>
                    <button
                      onClick={() => toggleTier(index)}
                      aria-label={`Change tier for ${prize.name}`}
                      className="feta-eyebrow ml-auto px-3 py-2 rounded-md"
                      style={{
                        background:
                          prize.tier === "main" ? FETA.red : `${FETA.ink}1A`,
                        color: prize.tier === "main" ? FETA.cream : FETA.ink,
                      }}
                    >
                      {prize.tier === "main" ? "★ Main prize" : "Regular prize"}
                    </button>
                  </div>

                  <p
                    className="text-xs font-semibold mt-2"
                    style={{ color: `${FETA.ink}99` }}
                  >
                    {prize.tier === "main"
                      ? "Winner fills in name and phone."
                      : "Winner just sees the message, then spin again."}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Sticky action */}
      <div
        className="relative z-10 p-6 pt-4 flex-none"
        style={{
          background: `linear-gradient(to top, ${FETA.redDark} 55%, transparent 100%)`,
        }}
      >
        <FetaButton onClick={startCampaign} className="!text-base">
          Start campaign →
        </FetaButton>
      </div>
    </div>
  );
}
