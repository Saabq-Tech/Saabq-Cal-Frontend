/**
 * Safely extracts a string from any input (string, number, localized object {ar, en}, or nested object).
 * Prevents React Minified Error #31 when rendering localized objects as React children.
 */
export function extractTranslatableText(
  val,
  currentLang = "ar",
  fallback = "",
) {
  if (val === null || val === undefined) return fallback;

  if (
    typeof val === "string" ||
    typeof val === "number" ||
    typeof val === "boolean"
  ) {
    return String(val);
  }

  if (typeof val === "object") {
    let extracted = val[currentLang];
    if (extracted === undefined || extracted === null) {
      extracted = val.ar || val.en || val.name || val.title || val.label;
    }

    if (
      extracted !== undefined &&
      extracted !== null &&
      typeof extracted !== "object"
    ) {
      return String(extracted);
    }

    if (typeof extracted === "object" && extracted !== null) {
      return extractTranslatableText(extracted, currentLang, fallback);
    }
  }

  return fallback;
}

export const getTransText = extractTranslatableText;
