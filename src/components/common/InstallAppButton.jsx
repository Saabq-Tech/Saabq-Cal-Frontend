import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
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
      setIsModalOpen(false);
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

  // If no deferred prompt is available (e.g., iOS Safari), the user can still open the modal for manual instructions.

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

      {isModalOpen &&
        createPortal(
          <div
            className="modal-backdrop"
            style={{
              zIndex: 99999999,
              direction: isRtl ? "rtl" : "ltr",
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
                <Icon name="x" size={16} />
              </button>

              {/* App Icon / Graphic */}
              <div
                style={{
                  width: "72px",
                  height: "72px",
                  background: "var(--primary-subtle, rgba(13, 148, 136, 0.1))",
                  borderRadius: "20px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 20px auto",
                  color: "var(--primary, #0d9488)",
                }}
              >
                <Icon name="smartphone" size={36} />
              </div>

              {/* Title & Description */}
              <h3
                style={{
                  fontSize: "1.25rem",
                  fontWeight: 700,
                  color: "var(--text, #111827)",
                  margin: "0 0 8px 0",
                }}
              >
                {t("installAppTitle") || "Install Saabq App"}
              </h3>
              <p
                style={{
                  fontSize: "0.9rem",
                  color: "var(--text-secondary, #6b7280)",
                  margin: "0 0 24px 0",
                  lineHeight: 1.5,
                }}
              >
                {t("installAppDesc") ||
                  "Install Saabq on your home screen for quick and seamless access anytime."}
              </p>

              {/* iOS vs Non-iOS Instructions */}
              {!deferredPrompt ? (
                <div
                  style={{
                    background: "var(--surface-alt, #f9fafb)",
                    borderRadius: "16px",
                    padding: "16px",
                    textAlign: "start",
                    marginBottom: "24px",
                    border: "1px solid var(--border-subtle, #f3f4f6)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      marginBottom: "12px",
                    }}
                  >
                    <span
                      style={{
                        background: "var(--primary, #0d9488)",
                        color: "#fff",
                        width: "24px",
                        height: "24px",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "0.8rem",
                        fontWeight: 700,
                      }}
                    >
                      1
                    </span>
                    <span
                      style={{
                        fontSize: "0.85rem",
                        color: "var(--text, #374151)",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        flexWrap: "wrap",
                      }}
                    >
                      {t("iosInstallStep1") || "Tap the Share button"}
                      <Icon
                        name="share"
                        size={16}
                        style={{ display: "inline" }}
                      />
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    <span
                      style={{
                        background: "var(--primary, #0d9488)",
                        color: "#fff",
                        width: "24px",
                        height: "24px",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "0.8rem",
                        fontWeight: 700,
                      }}
                    >
                      2
                    </span>
                    <span
                      style={{
                        fontSize: "0.85rem",
                        color: "var(--text, #374151)",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        flexWrap: "wrap",
                      }}
                    >
                      {t("iosInstallStep2") || 'Select "Add to Home Screen"'}
                      <Icon
                        name="plus-square"
                        size={16}
                        style={{ display: "inline" }}
                      />
                    </span>
                  </div>
                </div>
              ) : null}

              {/* Action Buttons */}
              <div
                style={{
                  display: "flex",
                  gap: "12px",
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
                    fontSize: "0.95rem",
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
                  {deferredPrompt
                    ? t("cancel") || "Cancel"
                    : t("close") || "Close"}
                </button>

                {deferredPrompt && (
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
                )}
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
          </div>,
          document.body,
        )}
    </>
  );
}
