/**
 * Helper to resolve static public asset paths against Vite's BASE_URL
 * correctly regardless of trailing slashes in base path or leading slashes in path.
 *
 * @param {string} path - The relative asset path (e.g. '/logo.png' or '/images/login.svg')
 * @returns {string} Fully resolved asset URL
 */
export function getPublicAssetUrl(path) {
  if (!path) return "";
  if (
    path.startsWith("http://") ||
    path.startsWith("https://") ||
    path.startsWith("data:")
  ) {
    return path;
  }
  const base = import.meta.env.BASE_URL || "/";
  const cleanBase = base.endsWith("/") ? base : `${base}/`;
  const cleanPath = path.startsWith("/") ? path.slice(1) : path;
  return `${cleanBase}${cleanPath}`;
}
