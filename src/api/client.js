import axios from "axios";

const API_BASE =
  (import.meta.env.VITE_API_BASE_URL || "https://admin.cal.saabq.com") +
  "/api/v1";

const client = axios.create({
  baseURL: API_BASE,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

// Request interceptor — attach Bearer token & locale headers
client.interceptors.request.use((config) => {
  const token = localStorage.getItem("saabq_token");
  const lang = localStorage.getItem("saabq_lang") || "ar";

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  config.headers["X-Locale"] = lang;
  config.headers["Accept-Language"] = lang;
  config.params = { locale: lang, ...config.params };

  return config;
});

// Response interceptor — handle 401
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("saabq_token");
      localStorage.removeItem("saabq_user");
      localStorage.removeItem("saabq_user_type");
      if (
        !window.location.pathname.includes("/login") &&
        !window.location.pathname.includes("/register")
      ) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

// API endpoint helpers based on user type
export const getAuthPrefix = (userType) => {
  return userType === "member" ? "/workspace-members" : "/customers";
};

export const endpoints = {
  // Public Content
  banners: "/banners",
  features: "/features",
  faqs: "/faqs",
  about: "/about",
  settings: "/settings",
  plans: "/plans",
  workspaceTypes: "/workspace-types",
  timezones: "/locations/timezones",
  currencies: "/locations/currencies",
  countries: "/locations/countries",
  statesByCountry: (countryId) => `/locations/countries/${countryId}/states`,
  citiesByState: (stateId) => `/locations/states/${stateId}/cities`,

  // Public Workspace Exploration & Profiles
  publicWorkspaces: "/customers/workspaces",
  publicWorkspaceDetail: (idOrSlug) => `/customers/workspaces/${idOrSlug}`,
  publicWorkspaceServices: (idOrSlug) =>
    `/customers/workspaces/${idOrSlug}/services`,
  publicWorkspaceSlots: (idOrSlug, serviceId) =>
    `/customers/workspaces/${idOrSlug}/services/${serviceId}/slots`,

  // Auth (parameterized by user type)
  login: (type) => `${getAuthPrefix(type)}/auth/login`,
  register: (type) => `${getAuthPrefix(type)}/auth/register`,
  googleAuth: (type) => `${getAuthPrefix(type)}/auth/google`,
  logout: (type) => `${getAuthPrefix(type)}/auth/logout`,
  forgotPassword: (type) => `${getAuthPrefix(type)}/auth/forgot-password`,
  resetPassword: (type) => `${getAuthPrefix(type)}/auth/reset-password`,

  // Email Verification
  sendVerification: (type) => `${getAuthPrefix(type)}/auth/verify-email/send`,
  verifyEmail: (type) => `${getAuthPrefix(type)}/auth/verify-email/verify`,

  // Profile & Password
  profile: (type) => `${getAuthPrefix(type)}/profile`,
  updatePassword: (type) => `${getAuthPrefix(type)}/password`,
  uploadAvatar: "/customers/profile/avatar",

  // Integrations
  googleIntegration: (type) => `${getAuthPrefix(type)}/integrations/google`,
  webhookIntegration: (type) => `${getAuthPrefix(type)}/integrations/webhook`,
  telegramIntegration: (type) => `${getAuthPrefix(type)}/integrations/telegram`,
  telegramActivateWebhook: (type) =>
    `${getAuthPrefix(type)}/integrations/telegram/activate-webhook`,
  emailIntegration: (type) => `${getAuthPrefix(type)}/integrations/email`,
  emailIntegrationTest: (type) =>
    `${getAuthPrefix(type)}/integrations/email/test`,

  // 2FA
  twoFactorEnable: (type) => `${getAuthPrefix(type)}/2fa/enable`,
  twoFactorVerify: (type) => `${getAuthPrefix(type)}/2fa/verify`,
  twoFactorDisable: (type) => `${getAuthPrefix(type)}/2fa/disable`,
  twoFactorRecoveryCodes: (type) => `${getAuthPrefix(type)}/2fa/recovery-codes`,

  // Passkeys
  passkeysList: (type) => `${getAuthPrefix(type)}/passkeys`,
  passkeysRegisterOptions: (type) =>
    `${getAuthPrefix(type)}/passkeys/register-options`,
  passkeysRegister: (type) => `${getAuthPrefix(type)}/passkeys/register`,
  passkeysDelete: (type, id) => `${getAuthPrefix(type)}/passkeys/${id}`,
  passkeysLoginOptions: (type) =>
    `${getAuthPrefix(type)}/auth/passkeys/login-options`,
  passkeysLogin: (type) => `${getAuthPrefix(type)}/auth/passkeys/login`,

  // Workspace Settings (Member only)
  workspaceSettings: "/workspace-members/workspace/settings",
  workspaceSettingsBasic: "/workspace-members/workspace/settings/basic-info",
  workspaceSettingsBranding: "/workspace-members/workspace/settings/branding",
  workspaceSettingsTimezone:
    "/workspace-members/workspace/settings/timezone-and-format",
  workspaceSettingsSocial: "/workspace-members/workspace/settings/social-links",
  workspaceSettingsBookingRules:
    "/workspace-members/workspace/settings/booking-rules",
  workspaceSettingsBookingForm:
    "/workspace-members/workspace/settings/booking-form-fields",
  workspaceSettingsPayment:
    "/workspace-members/workspace/settings/payment-receipts",
  workspaceSettingsNotifications:
    "/workspace-members/workspace/settings/notification-templates",

  // Workspace Management Endpoints (Member only)
  workspaceServices: "/workspace-members/workspace/services",
  workspaceServiceItem: (id) => `/workspace-members/workspace/services/${id}`,
  workspaceSchedules: "/workspace-members/workspace/schedules",
  workspaceScheduleItem: (id) => `/workspace-members/workspace/schedules/${id}`,
  workspaceMembers: "/workspace-members/workspace/members",
  workspaceMemberItem: (id) => `/workspace-members/workspace/members/${id}`,
  workspaceRoles: "/workspace-members/workspace/roles",
  workspaceRoleItem: (id) => `/workspace-members/workspace/roles/${id}`,
  workspaceRolesPermissions: "/workspace-members/workspace/roles/permissions",
  workspaceResources: "/workspace-members/workspace/resources",
  workspaceResourceItem: (id) => `/workspace-members/workspace/resources/${id}`,
  workspaceLogs: "/workspace-members/workspace/logs",
  workspaceCustomers: "/workspace-members/workspace/customers",
  workspaceBookings: "/workspace-members/workspace/bookings",
  workspaceCalendarBookings: "/workspace-members/workspace/bookings/calendar",
  workspaceBookingItem: (id) => `/workspace-members/workspace/bookings/${id}`,
  workspaceBookingStatus: (id) =>
    `/workspace-members/workspace/bookings/${id}/status`,
  workspaceBookingCancel: (id) =>
    `/workspace-members/workspace/bookings/${id}/cancel`,
  workspaceBookingReschedule: (id) =>
    `/workspace-members/workspace/bookings/${id}/reschedule`,
  workspaceSubscription: "/workspace-members/workspace/subscription",
  workspaceSubscriptionCancel:
    "/workspace-members/workspace/subscription/cancel",
  workspaceSubscriptionPause: "/workspace-members/workspace/subscription/pause",
  workspaceSubscriptionResume:
    "/workspace-members/workspace/subscription/resume",
  workspaceSubscriptionProof:
    "/workspace-members/workspace/subscription/payment-proof",

  // Workspace Payments (Member only)
  workspacePayments: "/workspace-members/workspace/payments",
  workspacePaymentsWallet: "/workspace-members/workspace/payments/wallet",
  workspacePaymentDetail: (id) => `/workspace-members/workspace/payments/${id}`,
  workspacePaymentVerify: (id) =>
    `/workspace-members/workspace/payments/${id}/verify`,
  workspacePaymentReject: (id) =>
    `/workspace-members/workspace/payments/${id}/reject`,

  // Customer Payments
  customerPayments: "/customers/payments",
  customerPaymentDetail: (id) => `/customers/payments/${id}`,
  customerPaymentProof: (id) => `/customers/payments/${id}/proof`,

  // Notifications (shared — works for both customer & member tokens)
  notifications: "/notifications",
  notificationsUnreadCount: "/notifications/unread-count",
  notificationsMarkAllRead: "/notifications/mark-all-read",
  notificationMarkRead: (id) => `/notifications/${id}/mark-read`,
  notificationDelete: (id) => `/notifications/${id}`,
  notificationsClear: "/notifications",

  // Support Chat (shared — works for both customer & member tokens)
  chats: "/chats",
  chatDetails: (id) => `/chats/${id}`,
  chatSendMessage: "/chats/messages",
};

// Cached singleton for public site settings to prevent duplicate network calls
let settingsCacheMap = {};

export function fetchPublicSettings(force = false) {
  const lang = localStorage.getItem("saabq_lang") || "ar";
  if (!force && settingsCacheMap[lang]) {
    return settingsCacheMap[lang];
  }

  const promise = client
    .get(endpoints.settings)
    .then((res) => res.data?.data)
    .catch((err) => {
      delete settingsCacheMap[lang];
      throw err;
    });

  settingsCacheMap[lang] = promise;
  return promise;
}

export default client;
