import { Link } from "react-router-dom";
import { useLanguage } from "../../context/LanguageContext";
import AppLogo from "../ui/AppLogo";
import { getPublicAssetUrl } from "../../utils/url";
import Flag from "../common/Flag";
import Icon from "../common/Icon";

export default function AuthCardLayout({
  children,
  illustration = "/images/login.svg",
  illustrationAlt = "Saabq Cal Scheduling",
  quote,
  quoteAuthor,
}) {
  const { lang, toggleLanguage, t } = useLanguage();

  return (
    <main className="auth-page">
      <div className="auth-panel-left">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <Link
            to="/"
            className="auth-home-link"
            title={lang === "ar" ? "الرئيسية" : "Home"}
            aria-label={lang === "ar" ? "الرئيسية" : "Home"}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 36,
              height: 36,
              borderRadius: "9999px",
              background: "var(--surface-subtle, #f1f5f9)",
              color: "var(--text-main, #0f172a)",
              border: "1px solid var(--border-color, #e2e8f0)",
              transition: "all 0.2s ease",
              textDecoration: "none",
            }}
          >
            <Icon name="home" size={18} />
          </Link>

          <button
            className="auth-lang-toggle"
            onClick={toggleLanguage}
            type="button"
            aria-label={lang === "ar" ? "Switch to English" : "التحويل للعربية"}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 14px",
              fontSize: "0.82rem",
              fontWeight: 700,
              borderRadius: "9999px",
              border: "1px solid var(--border, #e2e8f0)",
              background: "var(--surface-alt, #f8fafc)",
              color: "var(--text, #0f172a)",
              cursor: "pointer",
              whiteSpace: "nowrap",
              height: 36,
              boxSizing: "border-box",
            }}
          >
            <Flag
              country={lang === "ar" ? "us" : "eg"}
              style={{ width: 18, height: 13 }}
            />
            <span>{lang === "ar" ? "English" : "العربية"}</span>
          </button>
        </div>

        <div className="auth-form-wrapper animate-fade-in-up">{children}</div>
      </div>

      <div className="auth-panel-right">
        <Link to="/" className="auth-brand">
          <AppLogo height={36} />
        </Link>

        <div className="auth-illustration">
          <img
            src={getPublicAssetUrl(illustration)}
            alt={illustrationAlt}
            width={320}
            height={320}
            loading="lazy"
          />
        </div>

        <div className="auth-quote">
          <blockquote>
            "
            {quote ||
              (lang === "ar"
                ? "إدارة المواعيد أصبحت أسهل وأكثر احترافية مع تقويم سابق."
                : "Scheduling made simple and professional with Saabq Cal.")}
            "
          </blockquote>
          <cite>— {quoteAuthor || t("appName")}</cite>
        </div>
      </div>
    </main>
  );
}
