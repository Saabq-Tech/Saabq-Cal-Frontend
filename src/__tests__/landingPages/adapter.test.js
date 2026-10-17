import { describe, it, expect } from "vitest";
import {
  buildLandingSite,
  contentToSiteFields,
  initialLandingPage,
  landingPagePayload,
  safeImage,
} from "../../landing-pages/adapter";
import {
  LANDING_TEMPLATES,
  recommendedTemplates,
  resolveSections,
  suggestTemplate,
} from "../../landing-pages/catalog";
import { LABEL_KEYS, tl } from "../../landing-pages/labels";
import { TEMPLATE_COMPONENTS } from "../../landing-pages/registry";
import { rolesFixture, servicesFixture, workspaceFixture } from "./fixtures";

const landingPage = {
  template_key: "clinic",
  sections: [
    { id: "faq", enabled: true },
    { id: "about", enabled: false },
    { id: "pricing", enabled: true },
  ],
  content: {
    locale: "en",
    headline: "Healthy skin starts here",
    whatsapp: "+201111111111",
    opening_hours: [
      { days: "Sat - Thu", time_range: "10 - 22", is_closed: false },
    ],
    faqs: [{ question: "Insurance?", answer: "Yes" }],
  },
};

describe("landing page adapter", () => {
  const site = buildLandingSite({
    workspace: workspaceFixture,
    services: servicesFixture,
    roles: rolesFixture,
    landingPage,
  });

  it("reads workspace data live and uses the page language", () => {
    expect(site.lang).toBe("en");
    expect(site.name).toBe("Glow Clinic");
    expect(site.about).toBe("We care");
    expect(site.accent).toBe("#123456");
    expect(site.headline).toBe("Healthy skin starts here");
    expect(site.intro).toBe("Skin care in Heliopolis");
  });

  it("only lets safe images through", () => {
    expect(site.logo).toBe("https://cdn.example.com/logo.png");
    expect(site.heroImage).toBeUndefined();
    expect(site.gallery).toEqual([
      { id: "g0", caption: "Room", image: "https://cdn.example.com/1.jpg" },
    ]);
    expect(safeImage("data:image/png;base64,AAAA")).toBe(
      "data:image/png;base64,AAAA",
    );
    expect(safeImage("//evil.example.com/x.png")).toBeUndefined();
  });

  it("lists bookable services and unique specialists with booking links", () => {
    expect(site.services).toHaveLength(1);
    expect(site.services[0]).toMatchObject({
      title: "Facial",
      href: "/glow-clinic/book?service=facial",
    });
    expect(site.services[0].desc).toContain("45");
    expect(site.team).toEqual([
      expect.objectContaining({
        id: "m9",
        name: "Dr. Sara",
        role: "Dermatologist",
        href: "/glow-clinic/book?member=9",
      }),
    ]);
    expect(site.bookingUrl).toBe("/glow-clinic/book");
  });

  it("drops unknown sections and appends missing template sections", () => {
    expect(site.sections.map((s) => s.id)).toEqual([
      "faq",
      "about",
      "services",
      "team",
      "gallery",
      "booking",
      "contact",
    ]);
    expect(site.sections.find((s) => s.id === "about").enabled).toBe(false);
  });

  it("maps landing content to template fields", () => {
    expect(site.hours).toEqual([
      { id: "o0", days: "Sat - Thu", time: "10 - 22", closed: false },
    ]);
    expect(site.faqs).toEqual([{ id: "f0", q: "Insurance?", a: "Yes" }]);
    expect(site.whatsapp).toBe("+201111111111");
    expect(contentToSiteFields(null).lang).toBe("ar");
  });

  it("falls back to the booking intro when there is no headline", () => {
    const noHeadline = buildLandingSite({
      workspace: workspaceFixture,
      landingPage: { template_key: "clinic", content: {} },
    });
    expect(noHeadline.headline).toBe("Skin care in Heliopolis");
    expect(noHeadline.intro).toBe("");
    expect(noHeadline.bookingLabel).toBe(tl("ar", "bookDefault"));
  });

  it("builds a request payload with only filled rows and known keys", () => {
    const payload = landingPagePayload({
      template_key: "company",
      is_published: 1,
      sections: [{ id: "about", enabled: 1, extra: true }],
      content: {
        locale: "fr",
        headline: "  Hi  ",
        script: "<script>",
        opening_hours: [{ days: "" }, { days: "Sun", time_range: "9-5" }],
        faqs: [{ question: "Q", answer: "" }],
        teams: [
          {
            name: "Sales",
            meetingsText: "Demo | 30",
            meetings: [{ title: "Demo", duration: "30" }, { title: " " }],
          },
        ],
      },
    });
    expect(payload.is_published).toBe(true);
    expect(payload.sections).toEqual([{ id: "about", enabled: true }]);
    expect(payload.content.locale).toBe("ar");
    expect(payload.content.headline).toBe("Hi");
    expect(payload.content).not.toHaveProperty("script");
    expect(payload.content.opening_hours).toEqual([
      { days: "Sun", time_range: "9-5", is_closed: false },
    ]);
    expect(payload.content.faqs).toEqual([]);
    expect(payload.content.teams).toEqual([
      {
        name: "Sales",
        description: "",
        meetings: [{ title: "Demo", duration: "30" }],
      },
    ]);
  });

  it("starts new pages from the workspace type", () => {
    const page = initialLandingPage(workspaceFixture);
    expect(page.template_key).toBe("clinic");
    expect(page.is_published).toBe(false);
    expect(page.content.kicker).toBe("عيادة · Heliopolis, Cairo");
    expect(page.content.headline).toBe("Skin care in Heliopolis");
    expect(suggestTemplate({ workspace_type_id: 6 })).toBe("fitness");
    expect(suggestTemplate({ workspace_type: { code: "teacher" } })).toBe(
      "education",
    );
    expect(suggestTemplate({ workspace_type: { code: "realestate" } })).toBe(
      "rentals",
    );
    expect(suggestTemplate(null)).toBe("clinic");
    expect(
      recommendedTemplates({ workspace_type: { code: "clinic" } }),
    ).toEqual(["clinic", "dental", "medical", "therapy"]);
    expect(
      recommendedTemplates({ workspace_type: { code: "company" } }),
    ).toEqual(["company"]);
    expect(
      recommendedTemplates({ workspace_type: { code: "realestate" } }),
    ).toEqual(["rentals", "trips", "realestate"]);
  });
});

describe("landing page catalog", () => {
  it("matches the backend LandingPageTemplate enum and the registry", () => {
    const backendKeys = [
      "clinic",
      "dental",
      "medical",
      "therapy",
      "consulting",
      "beauty",
      "education",
      "creative",
      "fitness",
      "services",
      "company",
      "realestate",
      "rentals",
      "trips",
    ];
    expect(LANDING_TEMPLATES.map((tpl) => tpl.id)).toEqual(backendKeys);
    expect(Object.keys(TEMPLATE_COMPONENTS)).toEqual(backendKeys);
  });

  it("uses the template defaults when nothing is saved", () => {
    expect(resolveSections("creative", null)).toEqual([
      { id: "gallery", enabled: true },
      { id: "about", enabled: true },
      { id: "services", enabled: true },
      { id: "highlights", enabled: true },
      { id: "booking", enabled: true },
    ]);
    expect(resolveSections("unknown", null)).toEqual([]);
  });

  it("has Arabic and English for every template label", () => {
    for (const key of LABEL_KEYS) {
      expect(tl("ar", key)).toBeTruthy();
      expect(tl("en", key)).toBeTruthy();
    }
  });
});
