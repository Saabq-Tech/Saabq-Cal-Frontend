import { templateFontFamily } from "../../fonts";
import { tl } from "../../labels";

/** Props for a template's outermost element: direction, language, accent and display font. */
export function rootProps(site, className) {
  return {
    className: `site ${className}`,
    dir: site.lang === "ar" ? "rtl" : "ltr",
    lang: site.lang,
    style: {
      "--accent": site.accent,
      "--display": templateFontFamily(site.templateId, site.fontChoice),
    },
  };
}

/** Enabled sections in the owner's order. */
export function orderedSections(site) {
  return site.sections.filter((s) => s.enabled).map((s) => s.id);
}

export function hasSection(site, id) {
  return site.sections.some((s) => s.id === id && s.enabled);
}

/** Nav links for the sections that are switched on. */
export function navItems(site, labels) {
  return orderedSections(site)
    .filter((id) => labels[id])
    .map((id) => ({ id, label: labels[id] }));
}

/** "days time" for each row, joined, for templates that show hours inline. */
export function hoursLine(site) {
  return site.hours
    .map((h) =>
      `${h.days} ${h.closed ? tl(site.lang, "closed") : h.time}`.trim(),
    )
    .join(" · ");
}
