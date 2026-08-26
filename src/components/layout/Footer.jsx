import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { fetchPublicSettings } from "../../api/client";
import { useLanguage } from "../../context/LanguageContext";
import AppLogo from "../ui/AppLogo";
import Icon from "../common/Icon";

export default function Footer() {
  const { t } = useLanguage();
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    fetchPublicSettings()
      .then((data) => setSettings(data))
      .catch(() => {});
  }, []);

  const year = new Date().getFullYear();
  const siteName = settings?.site_name || t("appName");

  const [subscribed, setSubscribed] = useState(false);
  const [emailInput, setEmailInput] = useState("");

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!emailInput || !emailInput.includes("@")) return;
    setSubscribed(true);
    setEmailInput("");
  };

  return (
    <footer className="footer" role="contentinfo">
      <div className="container">
        <div className="footer-grid">
          <div>
            <Link to="/" className="footer-brand" aria-label={siteName}>
              <AppLogo height={28} />
            </Link>
            <p className="footer-desc">{t("footerDesc")}</p>
            <div className="footer-social">
              {settings?.twitter_url && (
                <a
                  href={settings.twitter_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Twitter"
                >
                  <Icon name="x-social" size={16} />
                </a>
              )}
              {settings?.instagram_url && (
                <a
                  href={settings.instagram_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                >
                  <Icon name="instagram" size={16} />
                </a>
              )}
              {settings?.linkedin_url && (
                <a
                  href={settings.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LinkedIn"
                >
                  <Icon name="linkedin" size={16} />
                </a>
              )}
              {settings?.facebook_url && (
                <a
                  href={settings.facebook_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                >
                  <Icon name="facebook" size={16} />
                </a>
              )}
            </div>
          </div>

          <div className="footer-col">
            <h2>{t("quickLinks")}</h2>
            <ul className="footer-links">
              <li>
                <Link to="/">{t("home")}</Link>
              </li>
              <li>
                <a href="/#about">{t("about")}</a>
              </li>
              <li>
                <a href="/#pricing">{t("navPricing")}</a>
              </li>
              <li>
                <Link to="/login">{t("signIn")}</Link>
              </li>
              <li>
                <Link to="/register">{t("getStarted")}</Link>
              </li>
            </ul>
          </div>

          <div className="footer-col">
            <h2>{t("security")}</h2>
            <ul className="footer-links">
              <li>
                <a href="/#features">{t("navFeatures")}</a>
              </li>
              <li>
                <a href="/#how-it-works">{t("navHowItWorks")}</a>
              </li>
              <li>
                <Link to="/privacy">{t("privacyPolicy")}</Link>
              </li>
              <li>
                <Link to="/terms">{t("termsOfService")}</Link>
              </li>
            </ul>
          </div>

          <div className="footer-col">
            <h2>{t("newsletterTitle")}</h2>
            <p
              style={{
                fontSize: "0.85rem",
                color: "var(--text-secondary)",
                marginBottom: 14,
              }}
            >
              {t("newsletterDesc")}
            </p>
            {subscribed ? (
              <div
                role="status"
                aria-live="polite"
                style={{
                  padding: "10px 14px",
                  borderRadius: "var(--radius-md)",
                  background: "var(--primary-subtle)",
                  color: "var(--primary)",
                  fontWeight: 600,
                  fontSize: "0.85rem",
                }}
              >
                ✓ {t("newsletterSuccess")}
              </div>
            ) : (
              <form
                onSubmit={handleSubscribe}
                style={{ display: "flex", gap: 6 }}
              >
                <label htmlFor="footer-newsletter-email" className="sr-only">
                  {t("newsletterTitle") || "الاشتراك بالنشرة البريدية"}
                </label>
                <input
                  id="footer-newsletter-email"
                  type="email"
                  placeholder="your@email.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="form-input"
                  style={{ fontSize: "0.84rem", padding: "8px 12px" }}
                  required
                  aria-required="true"
                />
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  style={{ flexShrink: 0 }}
                >
                  {t("subscribeBtn")}
                </button>
              </form>
            )}
          </div>
        </div>

        <div className="footer-bottom">
          {settings?.copyright_text || `© ${year} ${siteName}.`}
        </div>
      </div>
    </footer>
  );
}
