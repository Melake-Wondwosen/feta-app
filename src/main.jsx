import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./index.css";
import { melaStart } from "./services/melaService";

import { AuthProvider } from "./context/AuthContext.jsx";

/* Opened from MELA: sign in with its ticket first, then show the app. */
melaStart().finally(() => {
  ReactDOM.createRoot(document.getElementById("root")).render(
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  );
});
