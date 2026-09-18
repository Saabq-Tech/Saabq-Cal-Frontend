import { Helmet } from "react-helmet-async";
import { getPublicAssetUrl } from "../../utils/url";
import { useLanguage } from "../../context/LanguageContext";
import { getSEO, SITE_CONFIG } from "../../config/seoConfig";

const DEFAULT_SITE_NAME = SITE_CONFIG.name.ar;

/**
 * Reusable SEO head component.
 *
 * @param {object}  props
 * @param {string}  [props.pageKey]        - Key matching PAGE_SEO_CONFIG entry in seoConfig.js
 * @param {string}  [props.title]          - Override page title
 * @param {string}  [props.description]    - Override meta description
 * @param {string}  [props.keywords]       - Override meta keywords
 * @param {string}  [props.canonical]      - Override canonical path, e.g. "/workspaces"
 * @param {string}  [props.ogType]         - Open Graph type (default "website")
 * @param {string}  [props.ogImage]        - Open Graph image URL
 * @param {string}  [props.image]          - Alias for ogImage
 * @param {boolean} [props.noindex]        - If true, adds noindex/nofollow
 * @param {object|array} [props.jsonLd]    - JSON-LD structured data object/array
 * @param {object|array} [props.structuredData] - Alias for jsonLd
 * @param {React.ReactNode} [props.children] - Extra <Helmet> children
 */
export default function SEO({
  pageKey,
  title,
  description,
  keywords,
  canonical,
  ogType,
  ogImage,
  image,
  noindex,
  jsonLd,
  structuredData,
  children,
}) {
  let lang = "ar";
  try {
    const langContext = useLanguage();
    if (langContext && langContext.lang) {
      lang = langContext.lang;
    }
  } catch {
    // In case used outside LanguageProvider
    if (typeof window !== "undefined") {
      lang = localStorage.getItem("saabq_lang") || "ar";
    }
  }

  // Resolve SEO data using general config with any explicit overrides
  const resolved = getSEO(pageKey, lang, {
    title,
    description,
    keywords,
    canonical,
    ogType,
    ogImage,
    image,
    noindex,
    jsonLd,
    structuredData,
  });

  const siteName = SITE_CONFIG.name[lang] || DEFAULT_SITE_NAME;
  const origin =
    typeof window !== "undefined" && window.location.origin
      ? window.location.origin
      : import.meta.env.VITE_FRONTEND_URL || SITE_CONFIG.baseUrl;

  // Clean title to prevent double branding like "Title — Saabq Cal — Saabq Cal"
  let fullTitle = siteName;
  if (resolved.title && resolved.title.trim()) {
    const trimmedTitle = resolved.title.trim();
    if (trimmedTitle.includes("Saabq") || trimmedTitle.includes("سابق")) {
      fullTitle = trimmedTitle;
    } else {
      fullTitle = `${trimmedTitle} — ${siteName}`;
    }
  }

  // Canonical URL
  const canonicalUrl = resolved.canonical
    ? resolved.canonical.startsWith("http")
      ? resolved.canonical
      : `${origin}${resolved.canonical.startsWith("/") ? "" : "/"}${resolved.canonical}`
    : typeof window !== "undefined"
      ? window.location.href.split("?")[0].split("#")[0]
      : origin;

  // Resolve absolute image URL
  const rawImage = resolved.image || resolved.ogImage;
  let resolvedImageUrl = `${origin}${getPublicAssetUrl(SITE_CONFIG.defaultOgImage)}`;
  if (rawImage) {
    if (rawImage.startsWith("http://") || rawImage.startsWith("https://")) {
      resolvedImageUrl = rawImage;
    } else {
      resolvedImageUrl = `${origin}${rawImage.startsWith("/") ? "" : "/"}${rawImage}`;
    }
  }

  const activeJsonLd = resolved.structuredData || resolved.jsonLd;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      {resolved.description && (
        <meta name="description" content={resolved.description} />
      )}
      {resolved.keywords && (
        <meta name="keywords" content={resolved.keywords} />
      )}

      {resolved.noindex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta
          name="robots"
          content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"
        />
      )}

      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}

      {/* Open Graph / Facebook / WhatsApp */}
      <meta property="og:site_name" content={siteName} />
      <meta property="og:title" content={fullTitle} />
      {resolved.description && (
        <meta property="og:description" content={resolved.description} />
      )}
      <meta property="og:type" content={resolved.ogType || "website"} />
      {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}
      <meta property="og:image" content={resolvedImageUrl} />
      <meta property="og:image:secure_url" content={resolvedImageUrl} />
      <meta property="og:image:alt" content={fullTitle} />
      <meta property="og:locale" content={lang === "ar" ? "ar_SA" : "en_US"} />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      {SITE_CONFIG.twitterHandle && (
        <meta name="twitter:site" content={SITE_CONFIG.twitterHandle} />
      )}
      <meta name="twitter:title" content={fullTitle} />
      {resolved.description && (
        <meta name="twitter:description" content={resolved.description} />
      )}
      <meta name="twitter:image" content={resolvedImageUrl} />
      <meta name="twitter:image:alt" content={fullTitle} />

      {/* JSON-LD Structured Data */}
      {activeJsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(activeJsonLd)}
        </script>
      )}

      {children}
    </Helmet>
  );
}
