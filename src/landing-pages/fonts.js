import { getLandingTemplate } from "./catalog";

const WEIGHTS = {
  "IBM Plex Sans Arabic": "400;500;600;700",
  "Readex Pro": "300;400;500;600",
  Amiri: "400;700",
  "El Messiri": "500;600",
  Tajawal: "400;500;700;800",
  Almarai: "400;700;800",
  "Noto Naskh Arabic": "600;700",
  Cairo: "400;600;700",
  Rubik: "400;500;700",
  Alexandria: "400;500;600;700",
  "Reem Kufi": "500;600",
};

/** CSS font-family value for the template's chosen font. */
export function templateFontFamily(templateId, fontChoice = "template") {
  const tpl = getLandingTemplate(templateId);
  if (!tpl) return "sans-serif";
  const family = tpl.fonts[fontChoice] || tpl.fonts.template;
  return `'${family}', ${tpl.fonts.serif ? "serif" : "sans-serif"}`;
}

/** Loads the Google font a template needs, once per family. */
export function ensureTemplateFont(templateId, fontChoice = "template") {
  if (typeof document === "undefined") return;
  const tpl = getLandingTemplate(templateId);
  if (!tpl) return;
  const family = tpl.fonts[fontChoice] || tpl.fonts.template;
  const id = `lp-font-${family.replace(/\s+/g, "-").toLowerCase()}`;
  if (document.getElementById(id)) return;
  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family).replace(/%20/g, "+")}:wght@${WEIGHTS[family] || "400;700"}&display=swap`;
  document.head.appendChild(link);
}
