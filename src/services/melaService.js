import { API_URL } from "../config";
import { clearPerUserData } from "../context/AuthContext.jsx";

/* MELA opens this app as  <app url>#mela=<ticket>. Before the app starts the
   ticket is swapped for the user, stored the same way the login page stores
   it, and the address is cleaned. The app then opens on the person's home. */
export async function melaStart() {
  const m = window.location.hash.match(/[#&]mela=([^&]+)/);
  if (!m) return;
  window.history.replaceState(null, "", window.location.pathname + window.location.search);
  const tell = (msg) => {
    try {
      if (window.parent !== window) window.parent.postMessage(msg, "*");
    } catch {
      /* not in MELA */
    }
  };
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify({ action: "melaSession", ticket: decodeURIComponent(m[1]) }),
    });
    const data = JSON.parse(await res.text());
    if (!data.success || !data.user) throw new Error(data.message || "MELA sign-in failed.");
    let previous = null;
    try {
      previous = JSON.parse(localStorage.getItem("user"));
    } catch {
      previous = null;
    }
    if (previous && String(previous.id) !== String(data.user.id)) clearPerUserData();
    localStorage.setItem("user", JSON.stringify(data.user));
    const role = String(data.user.role || "").trim().toLowerCase();
    window.history.replaceState(null, "", role === "manager" ? "/manager" : "/home");
    tell({ mela: "signed-in" });
  } catch (err) {
    tell({ mela: "error", message: err.message || "MELA sign-in failed." });
  }
}
