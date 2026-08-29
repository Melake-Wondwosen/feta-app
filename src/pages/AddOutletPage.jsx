import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getDeviceId } from "../services/deviceId";
import { getCities, FALLBACK_CITIES } from "../services/cityService";
import { API_URL } from "../config";
import {
  FETA,
  FetaMark,
  FetaButton,
  Screen,
  SectionLabel,
} from "../brand/FetaBrand";

export default function AddOutletPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");

  const [lat, setLat] = useState(null);
  const [lng, setLng] = useState(null);

  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState("");

  const [loading, setLoading] = useState(false);

  const [cities, setCities] = useState(FALLBACK_CITIES);

  useEffect(() => {
    getCities().then(setCities);
  }, []);

  const getLocation = () => {
    if (!navigator.geolocation) {
      alert("This device can't share a GPS location.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
      },
      () => alert("Couldn't read the location. Turn on GPS and try again.")
    );
  };

  const isOnline = () => navigator.onLine;

  const saveOffline = (payload) => {
    const queue = JSON.parse(localStorage.getItem("offline_outlets")) || [];
    queue.push(payload);
    localStorage.setItem("offline_outlets", JSON.stringify(queue));
  };

  const compressImage = (file, maxWidth = 800, quality = 0.7) =>
    new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target.result;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const scale = Math.min(1, maxWidth / img.width);
          canvas.width = img.width * scale;
          canvas.height = img.height * scale;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL("image/jpeg", quality));
        };
      };
    });

  const handleSubmit = async () => {
    if (!name.trim()) {
      alert("Give the outlet a name.");
      return;
    }
    if (!address.trim()) {
      alert("Enter the address.");
      return;
    }
    if (!city) {
      alert("Pick a city.");
      return;
    }
    if (lat === null || lng === null) {
      alert("Capture the GPS location before saving.");
      return;
    }
    if (!photo) {
      alert("Take a photo of the outlet.");
      return;
    }

    setLoading(true);

    try {
      let photoBase64 = "";
      if (photo) {
        photoBase64 = await compressImage(photo, 800, 0.7);
      }

      const payload = {
        action: "addOutlet",
        baId: user.id,
        deviceId: getDeviceId(),
        name,
        address,
        city,
        latitude: lat ?? "",
        longitude: lng ?? "",
        photo: photoBase64,
      };

      if (!isOnline()) {
        saveOffline(payload);
        alert("Saved on this phone. It'll upload once you're back online.");
        navigate("/home");
        return;
      }

      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      const result = JSON.parse(text);

      if (result.status === "success") {
        alert("Outlet saved.");
        navigate("/home");
      } else {
        alert("The server rejected it: " + result.message);
      }
    } catch (err) {
      console.error("Submit error:", err);
      alert("Couldn't save the outlet: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const syncOffline = async () => {
      const queue = JSON.parse(localStorage.getItem("offline_outlets")) || [];
      if (!navigator.onLine) return;
      if (queue.length === 0) return;

      for (const item of queue) {
        try {
          await fetch(API_URL, {
            method: "POST",
            mode: "no-cors",
            body: JSON.stringify(item),
          });
        } catch (err) {
          console.error("offline sync failed", err);
          return;
        }
      }
      localStorage.removeItem("offline_outlets");
    };

    window.addEventListener("online", syncOffline);
    syncOffline();
    return () => window.removeEventListener("online", syncOffline);
  }, []);

  return (
    <Screen>
      <div className="flex flex-col flex-1 px-6 pt-8 pb-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-7">
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
          <h1
            className="feta-display text-3xl"
            style={{ color: FETA.cream, textShadow: `3px 3px 0 ${FETA.ink}` }}
          >
            Add outlet
          </h1>
        </div>

        {/* Photo */}
        <SectionLabel>Outlet photo *</SectionLabel>
        <label
          htmlFor="outlet-photo"
          className="feta-lockup flex flex-col items-center justify-center w-full h-56 overflow-hidden cursor-pointer mb-3"
          style={{ background: FETA.cream, color: FETA.ink }}
        >
          {preview ? (
            <img
              src={preview}
              alt="The outlet you photographed"
              className="w-full h-full object-cover"
            />
          ) : (
            <>
              <span className="text-5xl mb-3">📸</span>
              <span className="feta-display text-sm">Take a photo</span>
              <span className="text-xs font-semibold mt-1.5" style={{ color: FETA.redDeep }}>
                Tap to open the camera
              </span>
            </>
          )}
        </label>

        <input
          id="outlet-photo"
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files[0];
            if (!file) return;
            setPhoto(file);
            setPreview(URL.createObjectURL(file));
          }}
        />

        {preview && (
          <button
            type="button"
            onClick={() => document.getElementById("outlet-photo").click()}
            className="feta-press w-full mb-5 py-3 rounded-xl feta-display text-xs"
            style={{
              background: "transparent",
              border: `2px solid ${FETA.amber}`,
              color: FETA.amber,
            }}
          >
            Retake photo
          </button>
        )}

        {/* Details */}
        <div className="mt-4">
          <SectionLabel>Details</SectionLabel>
        </div>

        <div className="space-y-3">
          <input
            placeholder="Outlet name *"
            className="feta-field"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <input
            placeholder="Address *"
            className="feta-field"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />

          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            aria-label="City"
            className="feta-field"
          >
            <option value="">Select a city *</option>
            {cities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* GPS */}
        <button
          onClick={getLocation}
          className="feta-lockup-sm feta-press w-full mt-4 py-3.5 feta-display text-xs"
          style={{ background: FETA.amber, color: FETA.ink }}
        >
          📍 Capture GPS location *
        </button>

        {lat && (
          <div
            className="mt-3 px-4 py-3 rounded-xl text-xs font-bold"
            style={{
              background: `${FETA.ink}AA`,
              color: FETA.amber,
              boxShadow: `0 0 0 2px ${FETA.gold}`,
            }}
          >
            Location saved · {Number(lat).toFixed(5)}, {Number(lng).toFixed(5)}
          </div>
        )}

        {/* Actions */}
        <div className="mt-auto pt-8">
          <FetaButton onClick={handleSubmit} disabled={loading} className="!text-base">
            {loading ? "Saving…" : "Save outlet"}
          </FetaButton>

          <button
            onClick={() => navigate("/home")}
            className="w-full mt-4 py-2 feta-eyebrow"
            style={{ color: `${FETA.cream}AA` }}
          >
            Cancel
          </button>
        </div>
      </div>
    </Screen>
  );
}
