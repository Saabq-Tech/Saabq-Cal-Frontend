import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import "./index.css";
import App from "./App.jsx";

// Clear legacy chunk reload flags on startup
try {
  sessionStorage.removeItem("chunk_reload_attempted");
  sessionStorage.removeItem("chunk_error_auto_reload");
  sessionStorage.removeItem("vite_preload_reloaded");
} catch {
  // ignore
}

// Unregister any active service worker during development to prevent Workbox log spam & stale caching
if (import.meta.env.DEV && "serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      registration.unregister();
    }
  });
}

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
