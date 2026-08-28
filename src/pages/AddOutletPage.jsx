import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getDeviceId } from "../services/deviceId";

// inside handleSubmit, in the payload object:

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

const API_URL =
"https://script.google.com/macros/s/AKfycbwWZcenN_NwVuPi6WCxt8-T4UTKp9751y_Th3YwzcVunDD_1kaaXUjdnCqGso9Wu0wsyg/exec";

const cities = [
"Addis Ababa",
"Dire Dawa",
"Bahir Dar",
"Hawassa",
"Mekelle",
"Gondar",
"Jimma",
"Adama",
"Dessie",
"Jijiga",
"Shashamane",
"Hosaena",
"Arba Minch",
"Harar"
];

const fileToBase64 = (file) =>
new Promise((resolve, reject) => {
const reader = new FileReader();


  reader.readAsDataURL(file);

  reader.onload = () => resolve(reader.result);

  reader.onerror = reject;
});


const getLocation = () => {
if (!navigator.geolocation) {
alert("GPS not supported");
return;
}


navigator.geolocation.getCurrentPosition(
  (pos) => {
    setLat(pos.coords.latitude);
    setLng(pos.coords.longitude);
  },
  () => alert("Unable to get location")
);


};

const isOnline = () => navigator.onLine;

const saveOffline = (payload) => {
const queue =
JSON.parse(
localStorage.getItem("offline_outlets")
) || [];


queue.push(payload);

localStorage.setItem(
  "offline_outlets",
  JSON.stringify(queue)
);


};


// Add this helper above your component
const compressImage = (file, maxWidth = 800, quality = 0.7) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target.result;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const scale = Math.min(1, maxWidth / img.width);
        canvas.width  = img.width  * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
    };
  });
};


const handleSubmit = async () => {
  if (!name.trim()) { alert("Outlet Name is required"); return; }
  if (!city)        { alert("Please select a city");    return; }

  setLoading(true);

  try {
    let photoBase64 = "";
    if (photo) {
      photoBase64 = await compressImage(photo, 800, 0.7); // ✅ compressed
      console.log("Photo size (chars):", photoBase64.length);
    }

    const payload = {
  action:    "addOutlet",
  baId:      user.id,
  deviceId:  getDeviceId(),   // ✅ new field
  name,
  address,
  city,
  latitude:  lat  ?? "",
  longitude: lng  ?? "",
  photo:     photoBase64,
};

    if (!isOnline()) {
      saveOffline(payload);
      alert("Saved offline. Will sync when online.");
      navigate("/home");
      return;
    }

    console.log("Sending payload, photo length:", photoBase64.length);

    // ✅ text/plain avoids preflight; Apps Script reads e.postData.contents
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify(payload),
    });

    const text = await res.text();
    console.log("Response:", text);

    const result = JSON.parse(text);

    if (result.status === "success") {
      alert("Outlet saved successfully!");
      navigate("/home");
    } else {
      alert("Server error: " + result.message);
    }

  } catch (err) {
    console.error("Submit error:", err);
    alert("Error: " + err.message);
  } finally {
    setLoading(false);
  }
};

useEffect(() => {


const syncOffline = async () => {

  const queue =
    JSON.parse(
      localStorage.getItem("offline_outlets")
    ) || [];

  if (!navigator.onLine) return;

  if (queue.length === 0) return;

  for (const item of queue) {
    try {

      await fetch(API_URL, {
        method: "POST",
        mode: "no-cors",
        body: JSON.stringify(item)
      });

    } catch (err) {
      console.error(
        "offline sync failed",
        err
      );
      return;
    }
  }

  localStorage.removeItem(
    "offline_outlets"
  );
};

window.addEventListener(
  "online",
  syncOffline
);

syncOffline();

return () => {
  window.removeEventListener(
    "online",
    syncOffline
  );
};


}, []);

return ( <div className="min-h-screen max-w-md mx-auto bg-black text-white px-5 py-6">

  <h1 className="text-2xl font-bold text-yellow-400 mb-6">
    Add Outlet
  </h1>

  {/* PHOTO SECTION */}

  <div className="mb-5">

    <label className="block text-sm text-gray-300 mb-2">
      Outlet Photo
    </label>

    <label
      htmlFor="outlet-photo"
      className="
        flex
        flex-col
        items-center
        justify-center
        w-full
        h-60
        rounded-2xl
        border-2
        border-dashed
        border-yellow-500/50
        bg-white/5
        overflow-hidden
        cursor-pointer
        hover:border-yellow-400
        transition
      "
    >
      {preview ? (
        <img
          src={preview}
          alt="Outlet Preview"
          className="w-full h-full object-cover"
        />
      ) : (
        <>
          <div className="text-6xl mb-3">
            📸
          </div>

          <p className="text-yellow-400 font-semibold">
            Take Outlet Photo
          </p>

          <p className="text-xs text-gray-400 mt-2">
            Tap to open camera
          </p>
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

        const file =
          e.target.files[0];

        if (!file) return;

        setPhoto(file);

        setPreview(
          URL.createObjectURL(file)
        );
      }}
    />
  </div>

  {preview && (
    <button
      type="button"
      onClick={() =>
        document
          .getElementById(
            "outlet-photo"
          )
          .click()
      }
      className="
        w-full
        mb-5
        p-3
        rounded-xl
        bg-yellow-500
        text-black
        font-semibold
      "
    >
      Change Photo
    </button>
  )}

  {/* OUTLET NAME */}

  <input
    placeholder="Outlet Name *"
    className="
      w-full
      p-3
      mb-3
      bg-white/5
      rounded-xl
    "
    value={name}
    onChange={(e) =>
      setName(e.target.value)
    }
  />

  {/* ADDRESS */}

  <input
    placeholder="Address"
    className="
      w-full
      p-3
      mb-3
      bg-white/5
      rounded-xl
    "
    value={address}
    onChange={(e) =>
      setAddress(e.target.value)
    }
  />

  {/* CITY */}

  <select
    value={city}
    onChange={(e) =>
      setCity(e.target.value)
    }
    className="
      w-full
      p-3
      mb-3
      bg-white/5
      rounded-xl
      text-white
    "
  >
    <option value="">
      Select City *
    </option>

    {cities.map((c) => (
      <option key={c} value={c}>
        {c}
      </option>
    ))}
  </select>

  {/* GPS */}

  <button
    onClick={getLocation}
    className="
      w-full
      p-3
      mb-3
      bg-yellow-500
      text-black
      rounded-xl
      font-semibold
    "
  >
    📍 Capture GPS Location
  </button>

  {lat && (
    <div className="
      bg-white/5
      p-3
      rounded-xl
      mb-4
      text-xs
      text-gray-300
    ">
      <p>Latitude: {lat}</p>
      <p>Longitude: {lng}</p>
    </div>
  )}

  {/* SAVE */}

  <button
    onClick={handleSubmit}
    disabled={loading}
    className="
      w-full
      p-3
      rounded-xl
      bg-gradient-to-r
      from-yellow-500
      to-yellow-300
      text-black
      font-bold
    "
  >
    {loading
      ? "Saving..."
      : "Save Outlet"}
  </button>

  <button
    onClick={() =>
      navigate("/home")
    }
    className="
      w-full
      mt-3
      text-gray-400
    "
  >
    Cancel
  </button>

</div>

);
}
