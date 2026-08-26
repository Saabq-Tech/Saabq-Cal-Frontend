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
  const [isInstalled, setIsInstalled] = useState(false);
  const { t, lang } = useLanguage();

  useEffect(() => {
    // Check if the app is already installed/running in standalone mode
    const isStandalone =
      window.matchMedia &&
      window.matchMedia("(display-mode: standalone)").matches;
    const isIOSStandalone =
      window.navigator && window.navigator.standalone === true;

    if (isStandalone || isIOSStandalone) {
      setIsInstalled(true);
      return;
    }

    const handleBeforeInstallPrompt = (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
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

  // Do not show if the app is already installed
  if (isInstalled) {
    return null;
  }

  // If no deferred prompt is available (e.g., iOS Safari), do not show the button at all.
  if (!deferredPrompt) {
    return null;
  }

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
            zIndex: 99999,
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
            direction: isRtl ? "rtl" : "ltr",
            animation: "fadeIn 0.2s ease-out",
          }}
          onClick={() => setIsModalOpen(false)}
        >
          <div
            style={{
              background: "var(--surface, #ffffff)",
              borderRadius: "24px",
              padding: "32px",
              maxWidth: "400px",
              width: "100%",
              boxShadow:
                "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
              textAlign: "center",
              border: "1px solid var(--border, #e5e7eb)",
              animation: "slideUp 0.3s ease-out",
              position: "relative",
              overflow: "hidden",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top right close button */}
            <button
              onClick={() => setIsModalOpen(false)}
              style={{
                position: "absolute",
                top: "16px",
                right: isRtl ? "auto" : "16px",
                left: isRtl ? "16px" : "auto",
                background: "var(--surface-alt, #f3f4f6)",
                border: "none",
                color: "var(--text, #374151)",
                cursor: "pointer",
                padding: "8px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "var(--border, #e5e7eb)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background =
                  "var(--surface-alt, #f3f4f6)")
              }
            >
              <Icon name="x" size={18} />
            </button>

            <div
              style={{
                marginBottom: "24px",
                display: "flex",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  width: "80px",
                  height: "80px",
                  borderRadius: "24px",
                  background:
                    "linear-gradient(135deg, var(--primary, #0d9488) 0%, #0f766e 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#ffffff",
                  boxShadow: "0 10px 15px -3px rgba(13, 148, 136, 0.3)",
                }}
              >
                <Icon name="download" size={40} />
              </div>
            </div>

            <h3
              style={{
                margin: "0 0 12px 0",
                fontSize: "1.5rem",
                fontWeight: 800,
                color: "var(--text, #1f2937)",
                lineHeight: 1.2,
              }}
            >
              {t("installAppTitle") || "Install Saabq Cal App"}
            </h3>

            <p
              style={{
                margin: "0 0 32px 0",
                color: "var(--muted, #6b7280)",
                fontSize: "0.95rem",
                lineHeight: 1.6,
              }}
            >
              {t("installAppDesc") ||
                "Install our application on your device for a faster, full-screen experience and quick access from your home screen."}
            </p>

            <div
              style={{
                display: "flex",
                gap: "12px",
                flexDirection: "row",
                justifyContent: "center",
              }}
            >
              <button
                style={{
                  flex: 1,
                  padding: "12px 20px",
                  borderRadius: "12px",
                  border: "1px solid var(--border, #e5e7eb)",
                  background: "transparent",
                  color: "var(--text, #374151)",
                  fontSize: "1rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background =
                    "var(--surface-alt, #f3f4f6)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
                onClick={() => setIsModalOpen(false)}
              >
                {t("cancel") || "Cancel"}
              </button>

              <button
                style={{
                  flex: 1,
                  padding: "12px 20px",
                  borderRadius: "12px",
                  border: "none",
                  background: "var(--primary, #0d9488)",
                  color: "#ffffff",
                  fontSize: "1rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  gap: "8px",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.2s",
                  boxShadow: "0 4px 6px -1px rgba(13, 148, 136, 0.2)",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.transform = "translateY(-1px)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.transform = "translateY(0)")
                }
                onClick={handleInstallClick}
              >
                <span>{t("installApp") || "Install App"}</span>
              </button>
            </div>
          </div>

          <style>{`
            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            @keyframes slideUp {
              from { opacity: 0; transform: translateY(20px); }
              to { opacity: 1; transform: translateY(0); }
            }
          `}</style>
        </div>
      )}
    </>
  );
}
