import { Helmet } from 'react-helmet-async';

const SITE_NAME = 'Saabq Cal';
const DEFAULT_OG_IMAGE = `${import.meta.env.BASE_URL}logo.png`.replace(/\/+/g, '/');
const BASE_URL = 'https://cal.saabq.com';

/**
 * Reusable SEO head component.
 * @param {object}  props
 * @param {string}  props.title       - Page title (appended with " — Saabq Cal")
 * @param {string}  props.description - Meta description (max ~160 chars)
 * @param {string}  [props.canonical] - Canonical path, e.g. "/workspaces"
 * @param {string}  [props.ogType]    - Open Graph type (default "website")
 * @param {string}  [props.ogImage]   - Open Graph image URL
 * @param {boolean} [props.noindex]   - If true, adds noindex/nofollow
 * @param {object}  [props.jsonLd]    - JSON-LD structured data object
 * @param {React.ReactNode} [props.children] - Extra <Helmet> children
 */
export default function SEO({
  title,
  description,
  canonical,
  ogType = 'website',
  ogImage,
  noindex = false,
  jsonLd,
  children,
}) {
  const fullTitle = title ? `${title} — ${SITE_NAME}` : SITE_NAME;
  const canonicalUrl = canonical ? `${BASE_URL}${canonical}` : undefined;
  const ogImageUrl = ogImage || `${BASE_URL}${DEFAULT_OG_IMAGE}`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      {description && <meta name="description" content={description} />}

      {noindex && <meta name="robots" content="noindex, nofollow" />}

      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      {description && <meta property="og:description" content={description} />}
      <meta property="og:type" content={ogType} />
      <meta property="og:site_name" content={SITE_NAME} />
      {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}
      <meta property="og:image" content={ogImageUrl} />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      {description && <meta name="twitter:description" content={description} />}
      <meta name="twitter:image" content={ogImageUrl} />

      {/* JSON-LD Structured Data */}
      {jsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      )}

      {children}
    </Helmet>
  );
}
