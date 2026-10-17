/**
 * Builds the data a landing page template renders ("site") from:
 *  - the public workspace payload, services and specialists (GET /customers/workspaces/...),
 *  - the saved landing page (template_key, content, sections).
 * Workspace data is always read live, so the page never repeats what the owner already
 * set in Saabq Cal; the landing page only stores what exists nowhere else.
 */
import { extractTranslatableText } from "../utils/text";
import { stripHtml } from "../utils/htmlUtils";
import { formatCurrency } from "../utils/currency";
import {
  getLandingTemplate,
  resolveSections,
  suggestTemplate,
} from "./catalog";
import { tl } from "./labels";

const clean = (value) => (typeof value === "string" ? value.trim() : "");

/** Only http(s), same-origin paths and uploaded data images reach <img src>. */
export function safeImage(url) {
  const value = clean(url);
  if (/^https?:\/\//i.test(value) || /^\/(?!\/)/.test(value)) return value;
  if (/^data:image\/(png|jpe?g|webp|gif);base64,/i.test(value)) return value;
  return undefined;
}

function safeColor(color, fallback) {
  const value = clean(color);
  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value) ? value : fallback;
}

/** Booking page of a workspace inside this app, honoring the Vite base path. */
export function bookingPath(slug) {
  const base = import.meta.env.BASE_URL || "/";
  const cleanBase = base.endsWith("/") ? base : `${base}/`;
  return `${cleanBase}${encodeURIComponent(slug)}/book`;
}

/** Public page of one rental unit, honoring the Vite base path. */
export function unitPath(slug, unitId) {
  const base = import.meta.env.BASE_URL || "/";
  const cleanBase = base.endsWith("/") ? base : `${base}/`;
  return `${cleanBase}${encodeURIComponent(slug)}/units/${encodeURIComponent(unitId)}`;
}

const MODE_SUFFIX = { nightly: "perNight", date: "perDay", trip: "perSeat" };

/** Public rental units (GET /customers/workspaces/{slug}/units) -> template cards. */
function unitItems(units, workspace, slug, lang) {
  const currency = workspace.currency || workspace.currency_code;
  const price = (value) =>
    formatCurrency(value, currency, lang === "ar", tl(lang, "free"));
  return (Array.isArray(units) ? units : [])
    .map((u) => {
      const photos = (Array.isArray(u.photos) ? u.photos : [])
        .map(safeImage)
        .filter(Boolean);
      const facts = [
        u.bedrooms ? `${u.bedrooms} ${tl(lang, "unitBedrooms")}` : "",
        u.bathrooms ? `${u.bathrooms} ${tl(lang, "unitBathrooms")}` : "",
        u.area_sqm ? `${u.area_sqm} ${tl(lang, "unitSqm")}` : "",
        u.capacity ? `${u.capacity} ${tl(lang, "unitGuests")}` : "",
      ].filter(Boolean);
      const departures = (Array.isArray(u.departures) ? u.departures : []).map(
        (d) => ({
          id: d.id,
          startsOn: d.starts_on,
          endsOn: d.ends_on,
          price: price(d.price),
          seatsLeft: d.seats_left,
        }),
      );
      let deposit = "";
      if (u.deposit_required) {
        deposit =
          u.deposit_type === "percent"
            ? `${tl(lang, "unitDeposit")} ${Number(u.deposit_value)}%`
            : `${tl(lang, "unitDeposit")} ${price(u.deposit_value)}`;
      }
      return {
        id: `u${u.id}`,
        unitId: u.id,
        title: clean(extractTranslatableText(u.title, lang)),
        desc: stripHtml(extractTranslatableText(u.description, lang)),
        kind: u.kind,
        mode: u.booking_mode,
        location: clean(u.location),
        facts,
        amenities: (Array.isArray(u.amenities) ? u.amenities : []).map(clean),
        price: price(u.price),
        priceSuffix: tl(lang, MODE_SUFFIX[u.booking_mode] || "perNight"),
        deposit,
        photo: photos[0],
        photos,
        departures,
        href: slug ? unitPath(slug, u.id) : "#units",
      };
    })
    .filter((u) => u.title);
}

function serviceDescription(service, lang) {
  const text = stripHtml(
    extractTranslatableText(service.short_description, lang) ||
      extractTranslatableText(service.description, lang),
  );
  const duration = service.duration_minutes
    ? `${service.duration_minutes} ${tl(lang, "minutes")}`
    : "";
  return [duration, text].filter(Boolean).join(" · ");
}

function servicePrice(service, workspace, lang) {
  if (
    service.price === null ||
    service.price === undefined ||
    service.price === ""
  )
    return "";
  const currency =
    service.currency_detail ||
    service.currency ||
    workspace.currency ||
    workspace.currency_code;
  return formatCurrency(
    service.price,
    currency,
    lang === "ar",
    tl(lang, "free"),
  );
}

/** Specialists visible to customers, each once (the endpoint already filters roles and status). */
function specialists(roles) {
  const seen = new Map();
  for (const role of Array.isArray(roles) ? roles : []) {
    for (const member of role.members || []) {
      if (!seen.has(member.id)) seen.set(member.id, member);
    }
  }
  return [...seen.values()];
}

function galleryItems(workspace) {
  return (Array.isArray(workspace.gallery_urls) ? workspace.gallery_urls : [])
    .map((item, i) => {
      const url = typeof item === "string" ? item : item?.url;
      const image = safeImage(url);
      if (!image) return null;
      const caption = typeof item === "string" ? "" : clean(item?.caption);
      return { id: `g${i}`, caption, image };
    })
    .filter(Boolean);
}

function highlightItems(workspace, lang) {
  return (
    Array.isArray(workspace.feature_highlights)
      ? workspace.feature_highlights
      : []
  )
    .map((h, i) => ({
      id: `h${i}`,
      title: clean(extractTranslatableText(h?.title, lang)),
      desc: clean(extractTranslatableText(h?.description, lang)),
    }))
    .filter((h) => h.title);
}

/** Landing-page-only content (backend shape) -> template fields. */
export function contentToSiteFields(content = {}) {
  const c = content || {};
  return {
    lang: c.locale === "en" ? "en" : "ar",
    fontChoice: c.font_choice === "alt" ? "alt" : "template",
    kicker: c.kicker || "",
    headline: c.headline || "",
    aboutMore: c.about_more || "",
    landmark: c.landmark || "",
    whatsapp: c.whatsapp || "",
    bookingLabel: c.booking_label || "",
    hours: (c.opening_hours || []).map((r, i) => ({
      id: `o${i}`,
      days: r.days || "",
      time: r.time_range || "",
      closed: !!r.is_closed,
    })),
    faqs: (c.faqs || []).map((r, i) => ({
      id: `f${i}`,
      q: r.question || "",
      a: r.answer || "",
    })),
    schedule: (c.schedule || []).map((r, i) => ({
      id: `c${i}`,
      day: r.day || "",
      time: r.time_range || "",
      title: r.title || "",
      by: r.instructor || "",
      full: !!r.is_full,
    })),
    teams: (c.teams || []).map((r, i) => ({
      id: `t${i}`,
      name: r.name || "",
      desc: r.description || "",
      meetings: (r.meetings || []).map((m) => ({
        title: m.title || "",
        duration: m.duration || "",
      })),
    })),
  };
}

/** Editor state -> request payload for PUT /workspace/settings/landing-page. */
export function landingPagePayload(page) {
  const c = page.content || {};
  const text = (v) => (typeof v === "string" ? v.trim() : "");
  return {
    template_key: page.template_key,
    is_published: !!page.is_published,
    sections: (page.sections || []).map((s) => ({
      id: s.id,
      enabled: !!s.enabled,
    })),
    content: {
      locale: c.locale === "en" ? "en" : "ar",
      font_choice: c.font_choice === "alt" ? "alt" : "template",
      kicker: text(c.kicker),
      headline: text(c.headline),
      about_more: text(c.about_more),
      landmark: text(c.landmark),
      whatsapp: text(c.whatsapp),
      booking_label: text(c.booking_label),
      opening_hours: (c.opening_hours || [])
        .filter((r) => text(r.days))
        .map((r) => ({
          days: text(r.days),
          time_range: text(r.time_range),
          is_closed: !!r.is_closed,
        })),
      faqs: (c.faqs || [])
        .filter((r) => text(r.question) && text(r.answer))
        .map((r) => ({ question: text(r.question), answer: text(r.answer) })),
      schedule: (c.schedule || [])
        .filter((r) => text(r.day) && text(r.title))
        .map((r) => ({
          day: text(r.day),
          time_range: text(r.time_range),
          title: text(r.title),
          instructor: text(r.instructor),
          is_full: !!r.is_full,
        })),
      teams: (c.teams || [])
        .filter((r) => text(r.name))
        .map((r) => ({
          name: text(r.name),
          description: text(r.description),
          meetings: (r.meetings || [])
            .filter((m) => text(m.title))
            .map((m) => ({ title: text(m.title), duration: text(m.duration) })),
        })),
    },
  };
}

/** Starting point for a workspace that has not saved a landing page yet. */
export function initialLandingPage(workspace) {
  const lang = workspace?.locale === "en" ? "en" : "ar";
  const typeName = clean(
    extractTranslatableText(workspace?.workspace_type?.name, lang),
  );
  const templateId = suggestTemplate(workspace);
  return {
    template_key: templateId,
    is_published: false,
    sections: resolveSections(templateId, null),
    content: {
      locale: lang,
      font_choice: "template",
      kicker: [typeName, clean(workspace?.address)].filter(Boolean).join(" · "),
      headline: clean(workspace?.booking_short_intro) || clean(workspace?.name),
      about_more: "",
      landmark: "",
      whatsapp: "",
      booking_label: tl(lang, "bookDefault"),
      opening_hours: [],
      faqs: [],
      schedule: [],
      teams: [],
    },
  };
}

/**
 * Everything a template needs to render.
 * preview: true inside the dashboard editor (shows placeholders for missing images).
 */
export function buildLandingSite({
  workspace,
  services = [],
  roles = [],
  units = [],
  landingPage,
  preview = false,
}) {
  const templateId = landingPage?.template_key;
  const tpl = getLandingTemplate(templateId);
  const fields = contentToSiteFields(landingPage?.content);
  const lang = fields.lang;
  const slug = workspace?.slug || "";
  const bookingUrl = slug ? bookingPath(slug) : "#booking";
  const withParam = (key, value) =>
    bookingUrl.startsWith("#")
      ? bookingUrl
      : `${bookingUrl}?${key}=${encodeURIComponent(value)}`;

  const name = clean(workspace?.name);
  const description = stripHtml(
    extractTranslatableText(workspace?.description, lang),
  );
  const intro = clean(workspace?.booking_short_intro);

  return {
    templateId,
    preview,
    lang,
    fontChoice: fields.fontChoice,
    name,
    slug,
    kicker: fields.kicker,
    headline: fields.headline || intro || name,
    // When the headline already uses the booking intro, the intro line is not repeated.
    intro: fields.headline && fields.headline !== intro ? intro : "",
    about: description,
    aboutMore: fields.aboutMore,
    logo: safeImage(workspace?.logo_url),
    heroImage: safeImage(workspace?.cover_url),
    accent: safeColor(
      workspace?.primary_color,
      tpl?.accentOptions[0] || "#026982",
    ),
    highlights: highlightItems(workspace || {}, lang),
    services: (Array.isArray(services) ? services : [])
      .filter(
        (s) => s && s.status !== "inactive" && s.booking_enabled !== false,
      )
      .map((s) => ({
        id: `s${s.id}`,
        title: clean(extractTranslatableText(s.name, lang)),
        desc: serviceDescription(s, lang),
        price: servicePrice(s, workspace || {}, lang),
        href: withParam("service", s.slug || s.id),
      }))
      .filter((s) => s.title),
    team: specialists(roles).map((m) => ({
      id: `m${m.id}`,
      name: clean(m.name),
      role: clean(m.title),
      bio: clean(m.bio),
      photo: safeImage(m.avatar_url),
      href: withParam("member", m.id),
    })),
    gallery: galleryItems(workspace || {}),
    units: unitItems(units, workspace || {}, slug, lang),
    schedule: fields.schedule,
    teams: fields.teams,
    hours: fields.hours,
    faqs: fields.faqs,
    address: clean(workspace?.address),
    landmark: fields.landmark,
    phone: clean(workspace?.phone),
    whatsapp: fields.whatsapp,
    email: clean(workspace?.email),
    bookingLabel: fields.bookingLabel || tl(lang, "bookDefault"),
    bookingUrl,
    sections: resolveSections(templateId, landingPage?.sections),
  };
}
