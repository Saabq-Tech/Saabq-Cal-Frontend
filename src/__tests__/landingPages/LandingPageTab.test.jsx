import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";
import LandingPageTab from "../../pages/member/dashboard/workspace-settings/LandingPageTab";
import { LanguageProvider } from "../../context/LanguageContext";
import { ToastProvider } from "../../context/ToastContext";
import client, { endpoints } from "../../api/client";
import { translations } from "../../translations/translations";
import { rolesFixture, servicesFixture, workspaceFixture } from "./fixtures";

vi.mock("../../api/client", async () => {
  const actual = await vi.importActual("../../api/client");
  return {
    ...actual,
    default: {
      get: vi.fn(),
      put: vi.fn(),
      defaults: { headers: { common: {} } },
    },
  };
});

vi.mock("../../context/AuthContext", () => ({
  useAuth: () => ({
    user: {
      is_owner: true,
      permissions: [],
      workspace: {
        slug: "glow-clinic",
        has_active_subscription: true,
        active_capabilities: ["LANDING_PAGE"],
      },
    },
  }),
}));

const ar = translations.ar;

function mockApi({ isAvailable = true, landingPage = null } = {}) {
  client.get.mockImplementation((url) => {
    const data = {
      [endpoints.workspaceSettingsLandingPage]: {
        is_available: isAvailable,
        landing_page: landingPage,
      },
      [endpoints.publicWorkspaceDetail("glow-clinic")]: workspaceFixture,
      [endpoints.publicWorkspaceServices("glow-clinic")]: servicesFixture,
      [endpoints.publicWorkspaceSpecialists("glow-clinic")]: rolesFixture,
    }[url];
    return Promise.resolve({ data: { data } });
  });
}

function renderTab() {
  return render(
    <MemoryRouter>
      <LanguageProvider>
        <ToastProvider>
          <LandingPageTab />
        </ToastProvider>
      </LanguageProvider>
    </MemoryRouter>,
  );
}

describe("LandingPageTab", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem("saabq_lang", "ar");
  });

  it("starts from the template that matches the workspace type and previews it", async () => {
    mockApi();
    renderTab();

    const clinic = await screen.findByRole("radio", {
      name: new RegExp(ar.lpTemplateClinic),
    });
    expect(clinic).toHaveAttribute("aria-checked", "true");
    expect(screen.getAllByRole("radio")).toHaveLength(12);
    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "Skin care in Heliopolis",
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: ar.lpSave })).toBeDisabled();
  });

  it("saves the chosen template and publishes it", async () => {
    mockApi();
    client.put.mockImplementation((_url, payload) =>
      Promise.resolve({
        data: {
          data: { is_available: true, landing_page: { ...payload, id: 1 } },
        },
      }),
    );
    renderTab();

    fireEvent.click(
      await screen.findByRole("radio", {
        name: new RegExp(ar.lpTemplateBeauty),
      }),
    );
    fireEvent.click(
      screen.getByRole("checkbox", { name: new RegExp(ar.lpPublishToggle) }),
    );
    fireEvent.click(screen.getByRole("button", { name: ar.lpSave }));

    await waitFor(() => expect(client.put).toHaveBeenCalledTimes(1));
    const [url, payload] = client.put.mock.calls[0];
    expect(url).toBe(endpoints.workspaceSettingsLandingPage);
    expect(payload).toMatchObject({
      template_key: "beauty",
      is_published: true,
    });
    expect(payload.sections.map((s) => s.id)).toEqual([
      "about",
      "services",
      "gallery",
      "team",
      "booking",
    ]);
    expect(await screen.findByText(ar.lpPublished)).toBeInTheDocument();
  });

  it("is read-only when the plan does not include landing pages", async () => {
    mockApi({ isAvailable: false });
    renderTab();

    expect(await screen.findByText(ar.lpNotAvailable)).toBeInTheDocument();
    expect(
      screen.getByRole("radio", { name: new RegExp(ar.lpTemplateClinic) }),
    ).toBeDisabled();
    expect(screen.getByRole("button", { name: ar.lpSave })).toBeDisabled();
  });

  it("loads a saved page", async () => {
    mockApi({
      landingPage: {
        template_key: "fitness",
        is_published: true,
        sections: [{ id: "schedule", enabled: true }],
        content: { locale: "en", headline: "Train with us" },
      },
    });
    renderTab();

    expect(
      await screen.findByRole("radio", {
        name: new RegExp(ar.lpTemplateFitness),
      }),
    ).toHaveAttribute("aria-checked", "true");
    expect(
      await screen.findByRole("heading", { level: 1, name: "Train with us" }),
    ).toBeInTheDocument();
    expect(screen.getByText(ar.lpPublished)).toBeInTheDocument();
  });
});
