import { Helmet } from "react-helmet-async";
import { getPublicAssetUrl } from "../../utils/url";

const SITE_NAME =
  "\u0633\u0627\u0628\u0642 \u0643\u0648\u0644 \u2014 Saabq Cal";

/**
 * Reusable SEO head component.
 * @param {object}  props
 * @param {string}  props.title            - Page title
 * @param {string}  props.description      - Meta description (max ~160 chars)
 * @param {string}  [props.canonical]      - Canonical path, e.g. "/workspaces"
 * @param {string}  [props.ogType]         - Open Graph type (default "website")
 * @param {string}  [props.ogImage]        - Open Graph image URL
 * @param {string}  [props.image]          - Alias for ogImage
 * @param {boolean} [props.noindex]        - If true, adds noindex/nofollow
 * @param {object|array} [props.jsonLd]    - JSON-LD structured data object/array
 * @param {object|array} [props.structuredData] - Alias for jsonLd
 * @param {React.ReactNode} [props.children] - Extra <Helmet> children
 */
export default function SEO({
  title,
  description,
  canonical,
  ogType = "website",
  ogImage,
  image,
  noindex = false,
  jsonLd,
  structuredData,
  children,
}) {
  const origin =
    typeof window !== "undefined" && window.location.origin
      ? window.location.origin
      : import.meta.env.VITE_FRONTEND_URL || "https://www.experts.saabq.com";

  // Clean title to prevent double branding like "Title — Saabq Cal — Saabq Cal"
  let fullTitle = SITE_NAME;
  if (title && title.trim()) {
    const trimmedTitle = title.trim();
    if (
      trimmedTitle.includes("Saabq") ||
      trimmedTitle.includes("\u0633\u0627\u0628\u0642")
    ) {
      fullTitle = trimmedTitle;
    } else {
      fullTitle = `${trimmedTitle} — ${SITE_NAME}`;
    }
  }

  // Canonical URL
  const canonicalUrl = canonical
    ? canonical.startsWith("http")
      ? canonical
      : `${origin}${canonical.startsWith("/") ? "" : "/"}${canonical}`
    : typeof window !== "undefined"
      ? window.location.href
      : origin;

  // Resolve absolute image URL
  const rawImage = image || ogImage;
  let resolvedImageUrl = `${origin}${getPublicAssetUrl("/logo.png")}`;
  if (rawImage) {
    if (rawImage.startsWith("http://") || rawImage.startsWith("https://")) {
      resolvedImageUrl = rawImage;
    } else {
      resolvedImageUrl = `${origin}${rawImage.startsWith("/") ? "" : "/"}${rawImage}`;
    }
  }

  const activeJsonLd = jsonLd || structuredData;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      {description && <meta name="description" content={description} />}

      {noindex && <meta name="robots" content="noindex, nofollow" />}

      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}

      {/* Open Graph / Facebook / WhatsApp */}
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      {description && <meta property="og:description" content={description} />}
      <meta property="og:type" content={ogType} />
      {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}
      <meta property="og:image" content={resolvedImageUrl} />
      <meta property="og:image:secure_url" content={resolvedImageUrl} />
      <meta property="og:image:alt" content={fullTitle} />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      {description && <meta name="twitter:description" content={description} />}
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
