import { useState, useEffect } from "react";
import { fetchPublicSettings } from "../../api/client";
import { useLanguage } from "../../context/LanguageContext";
import { getPublicAssetUrl } from "../../utils/url";

const DEFAULT_LOGO = getPublicAssetUrl("/logo.png");

export default function AppLogo({
  height = 36,
  showText = true,
  className = "",
}) {
  const { t } = useLanguage();
  const [logoUrl, setLogoUrl] = useState(DEFAULT_LOGO);
  const [imgError, setImgError] = useState(false);
  const [siteName, setSiteName] = useState(t("appName"));

  useEffect(() => {
    fetchPublicSettings()
      .then((data) => {
        if (data?.site_name) {
          setSiteName(data.site_name);
        }
        if (data?.logo) {
          setLogoUrl(getPublicAssetUrl(data.logo));
        }
        const rawFavicon = data?.favicon || data?.logo;
        const faviconUrl = rawFavicon
          ? getPublicAssetUrl(rawFavicon)
          : DEFAULT_LOGO;
        const faviconEl = document.getElementById("app-favicon");
        if (faviconEl) {
          faviconEl.setAttribute("href", faviconUrl);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div
      className={`app-logo-wrapper ${className}`}
      style={{ display: "inline-flex", alignItems: "center", gap: 10 }}
    >
      {!imgError ? (
        <img
          src={logoUrl}
          alt={siteName}
          height={height}
          loading="eager"
          style={{ height: height, width: "auto", objectFit: "contain" }}
          onError={() => {
            if (logoUrl !== DEFAULT_LOGO) {
              setLogoUrl(DEFAULT_LOGO);
            } else {
              setImgError(true);
            }
          }}
        />
      ) : (
        <svg width={height} height={height} viewBox="0 0 32 32" fill="none">
          <rect width="32" height="32" rx="8" fill="var(--primary)" />
          <path
            d="M8 16c0-4.418 3.582-8 8-8s8 3.582 8 8-3.582 8-8 8"
            stroke="#fff"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <circle cx="16" cy="16" r="3" fill="#fff" />
        </svg>
      )}
      {showText && <span className="app-logo-text">{siteName}</span>}
    </div>
  );
}
