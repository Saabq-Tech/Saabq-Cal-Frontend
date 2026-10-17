import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect } from "vitest";
import LandingPageRenderer from "../../landing-pages/LandingPageRenderer";
import { buildLandingSite } from "../../landing-pages/adapter";
import { LANDING_TEMPLATES } from "../../landing-pages/catalog";
import { tl } from "../../landing-pages/labels";
import { rolesFixture, servicesFixture, workspaceFixture } from "./fixtures";

const content = {
  headline: "Healthy skin starts here",
  kicker: "Dermatology · Cairo",
  about_more: "Open since 2012.",
  whatsapp: "+201111111111",
  booking_label: "Book now",
  opening_hours: [
    { days: "Sat - Thu", time_range: "10 - 22" },
    { days: "Friday", is_closed: true },
  ],
  faqs: [{ question: "Insurance?", answer: "Yes" }],
  schedule: [
    { day: "Mon", time_range: "18:00", title: "Yoga", instructor: "Sara" },
    {
      day: "Tue",
      time_range: "19:00",
      title: "HIIT",
      instructor: "Omar",
      is_full: true,
    },
  ],
  teams: [
    {
      name: "Sales",
      description: "Plans",
      meetings: [{ title: "Demo", duration: "30 min" }],
    },
  ],
};

function renderTemplate(templateId, { locale = "ar", preview = false } = {}) {
  const site = buildLandingSite({
    workspace: workspaceFixture,
    services: servicesFixture,
    roles: rolesFixture,
    landingPage: { template_key: templateId, content: { ...content, locale } },
    preview,
  });
  render(
    <MemoryRouter>
      <LandingPageRenderer site={site} fallback={<p>template failed</p>} />
    </MemoryRouter>,
  );
  return site;
}

describe.each(LANDING_TEMPLATES.map((tpl) => tpl.id))(
  "%s template",
  (templateId) => {
    it.each(["ar", "en"])(
      "renders the workspace page in %s",
      async (locale) => {
        renderTemplate(templateId, { locale });

        expect(
          await screen.findByRole("heading", {
            level: 1,
            name: "Healthy skin starts here",
          }),
        ).toBeInTheDocument();
        expect(screen.queryByText("template failed")).not.toBeInTheDocument();
        expect(screen.getAllByText("Glow Clinic").length).toBeGreaterThan(0);
        expect(document.querySelector(".site")).toHaveAttribute(
          "dir",
          locale === "ar" ? "rtl" : "ltr",
        );

        const hrefs = screen
          .getAllByRole("link")
          .map((a) => a.getAttribute("href"));
        expect(hrefs.some((href) => href.startsWith("/glow-clinic/book"))).toBe(
          true,
        );
      },
    );

    it("never shows owner placeholders to visitors", async () => {
      renderTemplate(templateId);
      await screen.findByRole("heading", { level: 1 });

      expect(screen.queryByText(tl("ar", "heroPhoto"))).not.toBeInTheDocument();
      expect(screen.queryByText(tl("ar", "map"))).not.toBeInTheDocument();
      expect(document.querySelector(".media--empty span")).toBeNull();
    });

    it("does not leave the editor when a preview link is clicked", async () => {
      renderTemplate(templateId, { preview: true });
      await screen.findByRole("heading", { level: 1 });

      const booking = screen
        .getAllByRole("link")
        .find((a) => a.getAttribute("href").startsWith("/glow-clinic/book"));
      const event = new MouseEvent("click", {
        bubbles: true,
        cancelable: true,
      });
      booking.dispatchEvent(event);
      expect(event.defaultPrevented).toBe(true);
    });
  },
);
