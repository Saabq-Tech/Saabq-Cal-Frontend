/**
 * Helper utility functions for handling HTML strings.
 */

/**
 * Converts an HTML string into plain text by stripping HTML tags.
 * Useful for SEO meta description tags and concise cards previews.
 *
 * @param {string} html
 * @returns {string}
 */
export function stripHtml(html) {
  if (!html || typeof html !== "string") return "";

  // Use DOMParser if available in browser context
  if (typeof window !== "undefined" && typeof DOMParser !== "undefined") {
    try {
      const doc = new DOMParser().parseFromString(html, "text/html");
      return (doc.body.textContent || doc.body.innerText || "").trim();
    } catch {
      // Fallback to regex
    }
  }

  return html.replace(/<[^>]*>?/gm, "").trim();
}

/**
 * Checks if a string contains HTML tags.
 *
 * @param {string} str
 * @returns {boolean}
 */
export function isHtml(str) {
  if (!str || typeof str !== "string") return false;
  return /<[a-z][\s\S]*>/i.test(str);
}
