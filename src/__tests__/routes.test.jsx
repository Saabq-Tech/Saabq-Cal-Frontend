import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { LanguageProvider } from "../context/LanguageContext";

// Components to test
import Home from "../pages/Home";
import Blog from "../pages/Blog";
import BlogPostDetailPage from "../pages/BlogPostDetailPage";
import CustomerWorkspacesPage from "../pages/customer/CustomerWorkspacesPage";
import MemberLoginPage from "../pages/member/auth/MemberLoginPage";
import CustomerLoginPage from "../pages/customer/auth/CustomerLoginPage";
import MemberOverviewTab from "../pages/member/dashboard/MemberOverviewTab";
import WorkspaceCustomersPage from "../pages/member/dashboard/WorkspaceCustomersPage";
import WorkspaceCustomerProfilePage from "../pages/member/dashboard/WorkspaceCustomerProfilePage";
import WorkspaceBookingsPage from "../pages/member/dashboard/WorkspaceBookingsPage";
import WorkspaceBookingDetailPage from "../pages/member/dashboard/WorkspaceBookingDetailPage";
import WorkspaceServicesPage from "../pages/member/dashboard/WorkspaceServicesPage";
import WorkspaceSchedulesPage from "../pages/member/dashboard/WorkspaceSchedulesPage";
import WorkspaceSettingsPage from "../pages/member/dashboard/WorkspaceSettingsPage";
import WorkspaceMembersPage from "../pages/member/dashboard/WorkspaceMembersPage";
import WorkspaceRolesPage from "../pages/member/dashboard/WorkspaceRolesPage";
import WorkspacePaymentsPage from "../pages/member/dashboard/WorkspacePaymentsPage";
import WorkspaceSubscriptionsPage from "../pages/member/dashboard/WorkspaceSubscriptionsPage";
import WorkspaceLogsPage from "../pages/member/dashboard/WorkspaceLogsPage";

vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({
    user: {
      id: 1,
      name: "Owner User",
      email: "owner@example.com",
      is_owner: true,
      permissions: ["*"],
      workspace: {
        id: 1,
        name: "Test Workspace",
        slug: "test-workspace",
        currency: { code: "SAR", symbol: "ر.س" },
        customer_label_singular: { ar: "عميل", en: "Client" },
        customer_label_plural: { ar: "العملاء", en: "Clients" },
        customer_icon: "users",
      },
    },
    isAuthenticated: true,
    userType: "member",
  }),
}));

vi.mock("../context/ToastContext", () => ({
  useToast: () => ({
    show: vi.fn(),
  }),
}));

vi.mock("../api/client", () => ({
  default: {
    defaults: {
      headers: {
        common: {},
      },
    },
    get: vi.fn().mockResolvedValue({
      data: {
        data: [],
        meta: { total: 0, current_page: 1, last_page: 1 },
      },
    }),
    post: vi.fn().mockResolvedValue({ data: { success: true } }),
    put: vi.fn().mockResolvedValue({ data: { success: true } }),
    delete: vi.fn().mockResolvedValue({ data: { success: true } }),
  },
  endpoints: {
    settings: "/settings",
    plans: "/plans",
    features: "/features",
    banners: "/banners",
    faqs: "/faqs",
    about: "/about",
    posts: "/posts",
    postDetail: (slug) => `/posts/${slug}`,
    postCategories: "/posts/categories",
    publicWorkspaces: "/customers/workspaces",
    workspaceCustomers: "/workspace-members/workspace/customers",
    workspaceCustomerItem: (id) =>
      `/workspace-members/workspace/customers/${id}`,
    workspaceBookings: "/workspace-members/workspace/bookings",
    workspaceServices: "/workspace-members/workspace/services",
    workspaceSchedules: "/workspace-members/workspace/schedules",
    workspaceMembers: "/workspace-members/workspace/members",
    workspaceRoles: "/workspace-members/workspace/roles",
    workspacePayments: "/workspace-members/workspace/payments",
    workspaceSubscriptions: "/workspace-members/workspace/subscriptions",
    workspaceLogs: "/workspace-members/workspace/logs",
    workspaceSettings: "/workspace-members/workspace/settings",
  },
  fetchPublicSettings: vi.fn().mockResolvedValue({ site_name: "Saabq Cal" }),
  getAuthPrefix: (type) =>
    type === "member" ? "/workspace-members" : "/customers",
}));

function renderWithProviders(ui) {
  return render(
    <MemoryRouter>
      <LanguageProvider>{ui}</LanguageProvider>
    </MemoryRouter>,
  );
}

describe("All Primary Application Routes Visual & Render Integrity", () => {
  it("renders Home page without crash", () => {
    const { container } = renderWithProviders(<Home />);
    expect(container).toBeTruthy();
  });

  it("renders Blog page without crash", () => {
    const { container } = renderWithProviders(<Blog />);
    expect(container).toBeTruthy();
  });

  it("renders Blog Post Detail page without crash", () => {
    const { container } = renderWithProviders(<BlogPostDetailPage />);
    expect(container).toBeTruthy();
  });

  it("renders Workspaces Explorer page without crash", () => {
    const { container } = renderWithProviders(<CustomerWorkspacesPage />);
    expect(container).toBeTruthy();
  });

  it("renders Member Login page without crash", () => {
    const { container } = renderWithProviders(<MemberLoginPage />);
    expect(container).toBeTruthy();
  });

  it("renders Customer Login page without crash", () => {
    const { container } = renderWithProviders(<CustomerLoginPage />);
    expect(container).toBeTruthy();
  });

  it("renders Member Dashboard Overview tab without crash", () => {
    const { container } = renderWithProviders(<MemberOverviewTab />);
    expect(container).toBeTruthy();
  });

  it("renders Workspace Customers page without crash", () => {
    const { container } = renderWithProviders(<WorkspaceCustomersPage />);
    expect(container).toBeTruthy();
  });

  it("renders Workspace Customer Profile page without crash", () => {
    const { container } = renderWithProviders(<WorkspaceCustomerProfilePage />);
    expect(container).toBeTruthy();
  });

  it("renders Workspace Bookings page without crash", () => {
    const { container } = renderWithProviders(<WorkspaceBookingsPage />);
    expect(container).toBeTruthy();
  });

  it("renders Workspace Services page without crash", () => {
    const { container } = renderWithProviders(<WorkspaceServicesPage />);
    expect(container).toBeTruthy();
  });

  it("renders Workspace Schedules page without crash", () => {
    const { container } = renderWithProviders(<WorkspaceSchedulesPage />);
    expect(container).toBeTruthy();
  });

  it("renders Workspace Settings page without crash", () => {
    const { container } = renderWithProviders(<WorkspaceSettingsPage />);
    expect(container).toBeTruthy();
  });

  it("renders Workspace Members page without crash", () => {
    const { container } = renderWithProviders(<WorkspaceMembersPage />);
    expect(container).toBeTruthy();
  });

  it("renders Workspace Roles page without crash", () => {
    const { container } = renderWithProviders(<WorkspaceRolesPage />);
    expect(container).toBeTruthy();
  });

  it("renders Workspace Payments page without crash", () => {
    const { container } = renderWithProviders(<WorkspacePaymentsPage />);
    expect(container).toBeTruthy();
  });

  it("renders Workspace Subscriptions page without crash", () => {
    const { container } = renderWithProviders(<WorkspaceSubscriptionsPage />);
    expect(container).toBeTruthy();
  });

  it("renders Workspace Logs/Reports page without crash", () => {
    const { container } = renderWithProviders(<WorkspaceLogsPage />);
    expect(container).toBeTruthy();
  });

  it("renders Workspace Booking Detail page without crash", () => {
    const { container } = renderWithProviders(<WorkspaceBookingDetailPage />);
    expect(container).toBeTruthy();
  });
});
