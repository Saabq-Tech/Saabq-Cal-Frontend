import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";
import WorkspaceSubscriptionsPage from "../../pages/member/dashboard/WorkspaceSubscriptionsPage";
import { LanguageProvider } from "../../context/LanguageContext";
import { ToastProvider } from "../../context/ToastContext";
import client from "../../api/client";

vi.mock("../../api/client", async () => {
  const actual = await vi.importActual("../../api/client");
  return {
    ...actual,
    default: {
      get: vi.fn(),
      post: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
      put: vi.fn(),
      defaults: {
        headers: {
          common: {},
        },
      },
    },
  };
});

vi.mock("../../context/AuthContext", () => ({
  useAuth: () => ({
    user: { is_owner: true, permissions: ["settings_write"] },
  }),
  AuthProvider: ({ children }) => <div>{children}</div>,
}));

const renderComponent = () => {
  return render(
    <MemoryRouter>
      <LanguageProvider>
        <ToastProvider>
          <WorkspaceSubscriptionsPage />
        </ToastProvider>
      </LanguageProvider>
    </MemoryRouter>,
  );
};

describe("WorkspaceSubscriptionsPage Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders active subscription status and plan details", async () => {
    client.get.mockImplementation((url) => {
      if (url.includes("/subscription")) {
        return Promise.resolve({
          data: {
            data: {
              id: 1,
              status: "active",
              starts_at: "2026-01-01",
              ends_at: "2026-12-31",
              plan: {
                id: 2,
                name: "الخطة الاحترافية",
                price: 299,
                features: ["خدمات غير محدودة"],
              },
            },
          },
        });
      }
      return Promise.resolve({ data: { data: [] } });
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/الخطة الاحترافية/i)).toBeInTheDocument();
      expect(screen.getByText(/نشط/i)).toBeInTheDocument();
    });

    expect(client.get).toHaveBeenCalledWith(
      "/workspace-members/workspace/subscription",
    );
  });

  it("renders available plans inside upgrade modal on upgrade click", async () => {
    client.get.mockImplementation((url) => {
      if (url.includes("/subscription")) {
        return Promise.resolve({
          data: {
            data: {
              id: 1,
              status: "active",
              plan: { id: 1, name: "الخطة الأساسية", price: 99 },
            },
          },
        });
      }
      if (url.includes("/plans")) {
        return Promise.resolve({
          data: {
            data: [
              { id: 1, name: "الخطة الأساسية", price: 99 },
              { id: 2, name: "الخطة الاحترافية", price: 299 },
            ],
          },
        });
      }
      return Promise.resolve({ data: { data: [] } });
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/ترقية الباقة/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/ترقية الباقة/i));

    await waitFor(() => {
      expect(screen.getByText(/ترقية باقة مساحة العمل/i)).toBeInTheDocument();
    });
  });
});
