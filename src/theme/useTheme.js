import { useEffect } from "react";
import { getSettings } from "../services/settingsService";

export const THEMES = [
  {
    key: "poster",
    name: "Poster",
    blurb: "The Feta lockup — hard keylines and offset shadows",
  },
  {
    key: "skeuo",
    name: "Brass",
    blurb: "Enamel signage on a brass frame, lit from above",
  },
  {
    key: "neu",
    name: "Soft relief",
    blurb: "Brushed silver panels raised off the red ground",
  },
  {
    key: "glass",
    name: "Smoked glass",
    blurb: "Translucent panels, the sunburst showing through",
  },
];

const STORE = "feta_theme";

export function applyTheme(key) {
  const theme = THEMES.some((t) => t.key === key) ? key : "poster";
  /* "poster" is the built-in look, so it carries no attribute. */
  if (theme === "poster") {
    document.documentElement.removeAttribute("data-theme");
  } else {
    document.documentElement.setAttribute("data-theme", theme);
  }
  localStorage.setItem(STORE, theme);
}

export function cachedTheme() {
  return localStorage.getItem(STORE) || "poster";
}

/* Applies the cached theme instantly so there's no flash, then checks
   the server for a newer one the admin may have published. */
export function useTheme() {
  useEffect(() => {
    applyTheme(cachedTheme());

    getSettings()
      .then((s) => {
        if (s?.theme) applyTheme(s.theme);
      })
      .catch(() => {
        /* offline — the cached theme stands */
      });
  }, []);
}
