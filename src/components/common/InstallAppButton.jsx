import React, { useState, useEffect } from "react";
import Icon from "./Icon";
import { useLanguage } from "../../context/LanguageContext";

export default function InstallAppButton({
  className = "",
  style = {},
  ...props
}) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { t, lang } = useLanguage();

  useEffect(() => {
    // Check if the app is already installed/running in standalone mode
    if (
      window.matchMedia &&
      window.matchMedia("(display-mode: standalone)").matches
    ) {
      return;
    }

    const handleBeforeInstallPrompt = (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e);
      // Update UI to notify the user they can install the PWA
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      // Hide the app-provided install promotion
      setIsInstallable(false);
      setIsInstalled(true);
      setIsModalOpen(false);
      // Clear the deferredPrompt
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      return;
    }
    // Show the install prompt
    deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    // We no longer need the prompt
    setDeferredPrompt(null);

    if (outcome === "accepted") {
      setIsModalOpen(false);
    }
  };

  // if (isInstalled) {
  //   return null;
  // }

  const isRtl = lang === "ar";

  return (
    <>
      <button
        className={`btn btn-primary btn-sm ${className}`}
        onClick={() => setIsModalOpen(true)}
        aria-label={t("installApp") || "Install App"}
        title={t("installApp") || "Install App"}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          ...style,
        }}
        {...props}
      >
        <Icon name="download" size={16} />
        <span>{t("installApp") || "Install App"}</span>
      </button>

      {isModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
            direction: isRtl ? "rtl" : "ltr",
          }}
          onClick={() => setIsModalOpen(false)}
        >
          <div
            style={{
              background: "var(--surface)",
              borderRadius: "var(--radius-lg)",
              padding: 24,
              maxWidth: 400,
              width: "100%",
              boxShadow: "var(--shadow-xl)",
              textAlign: "center",
              border: "1px solid var(--border)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 20,
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: "1.25rem",
                  fontWeight: 700,
                  color: "var(--text)",
                }}
              >
                {t("installAppTitle") || "Install Saabq Cal App"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--muted)",
                  cursor: "pointer",
                  padding: 4,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon name="x" size={20} />
              </button>
            </div>

            <div
              style={{
                marginBottom: 24,
                display: "flex",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 16,
                  background: "var(--border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--primary)",
                }}
              >
                <Icon name="smartphone" size={32} />
              </div>
            </div>

            <p
              style={{
                marginBottom: 24,
                color: "var(--text)",
                fontSize: "0.95rem",
                lineHeight: 1.6,
              }}
            >
              {t("installAppDesc") ||
                "Install our application on your device for a faster, full-screen experience and quick access from your home screen."}
            </p>

            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button
                className="btn btn-secondary"
                style={{ flex: 1 }}
                onClick={() => setIsModalOpen(false)}
              >
                {t("cancel") || "Cancel"}
              </button>
              {deferredPrompt ? (
                <button
                  className="btn btn-primary"
                  style={{
                    flex: 1,
                    display: "flex",
                    gap: 6,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  onClick={handleInstallClick}
                >
                  <Icon name="download" size={16} />
                  <span>{t("installApp") || "Install App"}</span>
                </button>
              ) : (
                <div
                  style={{
                    flex: 1.5,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--text)",
                    fontSize: "0.85rem",
                    textAlign: "center",
                    lineHeight: 1.4,
                    background: "var(--surface-alt)",
                    padding: "8px",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--border)",
                  }}
                >
                  {t("installManualInstruction") ||
                    "Tap your browser's menu or Share icon, then select 'Add to Home Screen'."}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
