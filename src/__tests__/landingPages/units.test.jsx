import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect } from "vitest";
import LandingPageRenderer from "../../landing-pages/LandingPageRenderer";
import { buildLandingSite } from "../../landing-pages/adapter";
import { workspaceFixture } from "./fixtures";

const chalet = {
  id: 7,
  title: { ar: "شاليه البحر", en: "Sea chalet" },
  description: { en: "Two minutes from the beach." },
  kind: "chalet",
  booking_mode: "nightly",
  location: "North Coast",
  capacity: 6,
  bedrooms: 3,
  price: "1000.00",
  deposit_required: true,
  deposit_type: "percent",
  deposit_value: "30.00",
  photos: ["https://cdn.example.com/a.jpg", "javascript:alert(1)"],
  amenities: ["Pool"],
  departures: [],
};
const trip = {
  ...chalet,
  id: 8,
  title: { en: "Siwa trip" },
  kind: "trip",
  booking_mode: "trip",
  deposit_required: false,
  departures: [
    {
      id: 3,
      starts_on: "2026-12-20",
      ends_on: null,
      price: "500.00",
      seats_left: 4,
    },
  ],
};

function renderUnits(templateId, units) {
  const site = buildLandingSite({
    workspace: workspaceFixture,
    units,
    landingPage: { template_key: templateId, content: { locale: "en" } },
  });
  render(
    <MemoryRouter>
      <LandingPageRenderer site={site} fallback={<p>template failed</p>} />
    </MemoryRouter>,
  );
  return site;
}

describe("rental units on landing pages", () => {
  it("maps units with safe photos, price suffix, deposit and unit links", () => {
    const site = buildLandingSite({
      workspace: workspaceFixture,
      units: [chalet],
      landingPage: { template_key: "rentals", content: { locale: "en" } },
    });
    const [unit] = site.units;
    expect(unit.title).toBe("Sea chalet");
    expect(unit.photos).toEqual(["https://cdn.example.com/a.jpg"]);
    expect(unit.priceSuffix).toBe("night");
    expect(unit.deposit).toBe("Deposit 30%");
    expect(unit.href).toBe("/glow-clinic/units/7");
  });

  it("shows a single unit in full with a direct booking link", async () => {
    renderUnits("rentals", [chalet]);
    expect(
      await screen.findByRole("heading", { level: 3, name: "Sea chalet" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Two minutes from the beach.")).toBeInTheDocument();
    expect(screen.getByText("Pool")).toBeInTheDocument();
    const links = screen.getAllByRole("link", { name: "Book now" });
    expect(links[0]).toHaveAttribute("href", "/glow-clinic/units/7");
  });

  it("lists several units as cards and trip departures", async () => {
    renderUnits("trips", [chalet, trip]);
    expect(
      await screen.findByRole("heading", {
        level: 2,
        name: "Upcoming departures",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("link", { name: "Details & booking" }),
    ).toHaveLength(2);
  });

  it("renders the units section in the real estate template", async () => {
    renderUnits("realestate", [chalet, trip]);
    expect(
      await screen.findByRole("heading", { level: 2, name: "Available units" }),
    ).toBeInTheDocument();
  });
});
