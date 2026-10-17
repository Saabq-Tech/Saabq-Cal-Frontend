/**
 * Landing page templates. Keys must match LandingPageTemplate in Saabq-Cal-Backend.
 * Display names and descriptions are translations.js keys (nameKey / descKey).
 * sections: what the template can render, in its default order.
 */

export const SECTION_IDS = [
  "about",
  "highlights",
  "services",
  "team",
  "gallery",
  "schedule",
  "teams",
  "booking",
  "faq",
  "contact",
  "units",
];

export const TEMPLATE_KEY_ALIASES = {
  clinic: "serene",
  dental: "radiant",
  medical: "atlas",
  therapy: "oasis",
  consulting: "prestige",
  beauty: "elegance",
  education: "pathway",
  creative: "canvas",
  fitness: "pulse",
  services: "direct",
  company: "synergy",
  realestate: "panorama",
  rentals: "haven",
  trips: "voyage",
};

export function normalizeTemplateId(id) {
  return TEMPLATE_KEY_ALIASES[id] || id;
}

export const LANDING_TEMPLATES = [
  {
    id: "serene",
    legacyId: "clinic",
    nameKey: "lpTemplateSerene",
    descKey: "lpTemplateSereneDesc",
    sections: [
      "about",
      "services",
      "team",
      "gallery",
      "booking",
      "faq",
      "contact",
    ],
    accentOptions: ["#0F5257", "#1D4E89", "#5B3A7A", "#7A4B1F"],
    fonts: { template: "Readex Pro", alt: "IBM Plex Sans Arabic" },
  },
  {
    id: "radiant",
    legacyId: "dental",
    nameKey: "lpTemplateRadiant",
    descKey: "lpTemplateRadiantDesc",
    sections: [
      "about",
      "highlights",
      "services",
      "team",
      "gallery",
      "booking",
      "faq",
      "contact",
    ],
    accentOptions: ["#0B5F8A", "#0F6E6E", "#3B4FA0", "#8A3B5A"],
    fonts: { template: "Rubik", alt: "IBM Plex Sans Arabic" },
  },
  {
    id: "atlas",
    legacyId: "medical",
    nameKey: "lpTemplateAtlas",
    descKey: "lpTemplateAtlasDesc",
    sections: ["about", "highlights", "teams", "faq", "gallery", "contact"],
    accentOptions: ["#17507A", "#0F5E59", "#4A3A8C", "#8A2E3B"],
    fonts: { template: "Alexandria", alt: "IBM Plex Sans Arabic" },
  },
  {
    id: "oasis",
    legacyId: "therapy",
    nameKey: "lpTemplateOasis",
    descKey: "lpTemplateOasisDesc",
    sections: ["about", "services", "team", "faq", "booking", "contact"],
    accentOptions: ["#2F4A3E", "#3E4A6B", "#5A4636", "#4B3B5C"],
    fonts: { template: "Reem Kufi", alt: "IBM Plex Sans Arabic" },
  },
  {
    id: "prestige",
    legacyId: "consulting",
    nameKey: "lpTemplatePrestige",
    descKey: "lpTemplatePrestigeDesc",
    sections: [
      "about",
      "services",
      "highlights",
      "team",
      "gallery",
      "booking",
      "contact",
    ],
    accentOptions: ["#8A5A1F", "#1B4D3E", "#7A2E2E", "#2E4A7A"],
    fonts: { template: "Amiri", alt: "Noto Naskh Arabic", serif: true },
  },
  {
    id: "elegance",
    legacyId: "beauty",
    nameKey: "lpTemplateElegance",
    descKey: "lpTemplateEleganceDesc",
    sections: ["about", "services", "gallery", "team", "booking"],
    accentOptions: ["#E9B9A8", "#D9C08A", "#B8D0C4", "#C9B6E4"],
    fonts: { template: "El Messiri", alt: "Tajawal" },
  },
  {
    id: "pathway",
    legacyId: "education",
    nameKey: "lpTemplatePathway",
    descKey: "lpTemplatePathwayDesc",
    sections: [
      "about",
      "highlights",
      "services",
      "schedule",
      "team",
      "faq",
      "contact",
    ],
    accentOptions: ["#2E3A8C", "#0F5E59", "#7A2E5A", "#1F1F1F"],
    fonts: { template: "IBM Plex Sans Arabic", alt: "Cairo" },
  },
  {
    id: "canvas",
    legacyId: "creative",
    nameKey: "lpTemplateCanvas",
    descKey: "lpTemplateCanvasDesc",
    sections: ["gallery", "about", "services", "highlights", "booking"],
    accentOptions: ["#111111", "#2B2B6B", "#6B2B2B", "#2B5B4B"],
    fonts: { template: "Readex Pro", alt: "IBM Plex Sans Arabic" },
  },
  {
    id: "pulse",
    legacyId: "fitness",
    nameKey: "lpTemplatePulse",
    descKey: "lpTemplatePulseDesc",
    sections: ["about", "schedule", "team", "services", "contact"],
    accentOptions: ["#FF6A2B", "#C8F03C", "#3CC8F0", "#F03C78"],
    fonts: { template: "Tajawal", alt: "Cairo" },
  },
  {
    id: "direct",
    legacyId: "services",
    nameKey: "lpTemplateDirect",
    descKey: "lpTemplateDirectDesc",
    sections: ["booking", "about", "services", "gallery", "contact", "faq"],
    accentOptions: ["#1D4ED8", "#0F766E", "#B45309", "#7C3AED"],
    fonts: { template: "IBM Plex Sans Arabic", alt: "Cairo" },
  },
  {
    id: "synergy",
    legacyId: "company",
    nameKey: "lpTemplateSynergy",
    descKey: "lpTemplateSynergyDesc",
    sections: ["about", "services", "teams", "team", "faq", "contact"],
    accentOptions: ["#0E6B5C", "#1D4ED8", "#7A3B8C", "#B45309"],
    fonts: { template: "Almarai", alt: "IBM Plex Sans Arabic" },
  },
  {
    id: "panorama",
    legacyId: "realestate",
    nameKey: "lpTemplatePanorama",
    descKey: "lpTemplatePanoramaDesc",
    sections: [
      "about",
      "units",
      "gallery",
      "services",
      "booking",
      "team",
      "contact",
    ],
    accentOptions: ["#23412F", "#2B3A55", "#6B3A22", "#3A3A3A"],
    fonts: { template: "Noto Naskh Arabic", alt: "Cairo", serif: true },
  },
  {
    id: "haven",
    legacyId: "rentals",
    nameKey: "lpTemplateHaven",
    descKey: "lpTemplateHavenDesc",
    sections: ["units", "about", "highlights", "gallery", "faq", "contact"],
    accentOptions: ["#0E7490", "#C2410C", "#15803D", "#7C3AED"],
    fonts: { template: "Alexandria", alt: "Cairo" },
  },
  {
    id: "voyage",
    legacyId: "trips",
    nameKey: "lpTemplateVoyage",
    descKey: "lpTemplateVoyageDesc",
    sections: ["units", "highlights", "gallery", "about", "faq", "contact"],
    accentOptions: ["#EA580C", "#0F766E", "#1D4ED8", "#BE123C"],
    fonts: { template: "Tajawal", alt: "Cairo" },
  },
];

export const getLandingTemplate = (id) => {
  const norm = normalizeTemplateId(id);
  return LANDING_TEMPLATES.find(
    (tpl) => tpl.id === norm || tpl.legacyId === id,
  );
};

/** All templates are available to all workspaces; style recommendations remain flexible. */
export const TEMPLATE_GROUPS = {
  clinic: ["serene", "radiant", "atlas", "oasis"],
  realestate: ["haven", "voyage", "panorama"],
};

/** Workspace type code (workspace_types.code) -> suggested starting template. */
const CODE_TO_TEMPLATE = {
  clinic: "serene",
  consulting: "prestige",
  beauty: "elegance",
  education: "pathway",
  teacher: "pathway",
  creative: "canvas",
  fitness: "pulse",
  services: "direct",
  company: "synergy",
  realestate: "haven",
};

/** Older payloads without a type code: built-in ids 1-7 match utils/workspaceVibe.js. */
const ID_TO_CODE = {
  1: "clinic",
  2: "consulting",
  3: "beauty",
  4: "education",
  5: "creative",
  6: "fitness",
  7: "services",
};

/** The workspace's type code, from workspace_type.code or the legacy id. */
export function workspaceTypeCode(workspace) {
  return (
    workspace?.workspace_type?.code ||
    ID_TO_CODE[Number(workspace?.workspace_type_id)] ||
    null
  );
}

export function suggestTemplate(workspace) {
  const code = workspaceTypeCode(workspace);
  const found = CODE_TO_TEMPLATE[code] || "serene";
  return normalizeTemplateId(found);
}

/** Templates recommended for the workspace: all templates are selectable. */
export function recommendedTemplates(workspace) {
  const code = workspaceTypeCode(workspace);
  if (TEMPLATE_GROUPS[code]) {
    return TEMPLATE_GROUPS[code];
  }
  return [suggestTemplate(workspace)];
}

/** All of the template's sections, switched on, in its default order. */
export function defaultSections(templateId) {
  const tpl = getLandingTemplate(templateId);
  return (tpl?.sections || []).map((id) => ({ id, enabled: true }));
}

/**
 * Saved sections filtered to what the template supports, with any section the
 * template supports but the saved list lacks appended (enabled) at the end.
 */
export function resolveSections(templateId, saved) {
  const tpl = getLandingTemplate(templateId);
  if (!tpl) return [];
  if (!Array.isArray(saved) || saved.length === 0)
    return defaultSections(templateId);
  const supported = new Set(tpl.sections);
  const kept = saved.filter((s) => supported.has(s.id));
  const missing = tpl.sections
    .filter((id) => !kept.some((s) => s.id === id))
    .map((id) => ({ id, enabled: true }));
  return [...kept, ...missing];
}
