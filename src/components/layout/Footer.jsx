import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { fetchPublicSettings, subscribeToNewsletter } from "../../api/client";
import { useLanguage } from "../../context/LanguageContext";
import AppLogo from "../ui/AppLogo";
import Icon from "../common/Icon";

export default function Footer() {
  const { t, language } = useLanguage();
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
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleSubscribe = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    const cleanEmail = emailInput.trim();
    if (!cleanEmail || !cleanEmail.includes("@")) return;

    setLoading(true);
    try {
      const res = await subscribeToNewsletter(cleanEmail, language || "ar");
      setSubscribed(true);
      setSuccessMessage(res?.message || t("newsletterSuccess"));
      setEmailInput("");
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.errors?.email?.[0] ||
        t("newsletterError");
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <footer className="footer" role="contentinfo">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-col-brand">
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
                <Link to="/blog">{t("navBlog")}</Link>
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
                <Link to="/features">{t("navFeatures")}</Link>
              </li>
              <li>
                <Link to="/how-it-works">{t("navHowItWorks")}</Link>
              </li>
              <li>
                <Link to="/privacy">{t("privacyPolicy")}</Link>
              </li>
              <li>
                <Link to="/terms">{t("termsOfService")}</Link>
              </li>
            </ul>
          </div>

          <div className="footer-col footer-col-newsletter">
            <h2>{t("newsletterTitle")}</h2>
            <p className="footer-note">{t("newsletterDesc")}</p>

            {subscribed ? (
              <div
                className="newsletter-success"
                role="status"
                aria-live="polite"
              >
                <span className="newsletter-success-check">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </span>
                <span>{successMessage || t("newsletterSuccess")}</span>
              </div>
            ) : (
              <form
                onSubmit={handleSubscribe}
                className="newsletter-form"
                noValidate
              >
                <label htmlFor="footer-newsletter-email" className="sr-only">
                  {t("newsletterTitle")}
                </label>
                <div className="newsletter-input-group">
                  <span className="newsletter-input-icon" aria-hidden="true">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="2" y="4" width="20" height="16" rx="2" />
                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                    </svg>
                  </span>
                  <input
                    id="footer-newsletter-email"
                    type="email"
                    placeholder="your@email.com"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className="newsletter-email-input"
                    required
                    disabled={loading}
                    aria-required="true"
                  />
                  <button
                    type="submit"
                    className="newsletter-submit-btn"
                    disabled={loading}
                    aria-label={
                      loading ? t("subscribingBtn") : t("subscribeBtn")
                    }
                  >
                    {loading ? (
                      <span className="newsletter-spinner" aria-hidden="true" />
                    ) : (
                      <svg
                        className="newsletter-btn-arrow"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <line x1="22" y1="2" x2="11" y2="13" />
                        <polygon points="22 2 15 22 11 13 2 9 22 2" />
                      </svg>
                    )}
                  </button>
                </div>
                {errorMessage && (
                  <p className="newsletter-error" role="alert">
                    {errorMessage}
                  </p>
                )}
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
