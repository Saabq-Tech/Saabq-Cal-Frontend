import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import "./index.css";
import App from "./App.jsx";

// Handle Vite preload errors (e.g. stale asset hash chunk 404 after new deployment)
window.addEventListener("vite:preloadError", (event) => {
  event.preventDefault();
  const hasReloaded = sessionStorage.getItem("vite_preload_reloaded");
  if (!hasReloaded) {
    sessionStorage.setItem("vite_preload_reloaded", "true");
    window.location.reload();
  }
});

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </StrictMode>,
);
