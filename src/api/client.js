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
  capabilities: "/capabilities",
  faqs: "/faqs",
  about: "/about",
  terms: "/terms",
  privacy: "/privacy",
  issueReports: "/issue-reports",
  settings: "/settings",
  newsletterSubscribe: "/newsletter/subscribe",
  newsletterUnsubscribe: "/newsletter/unsubscribe",
  posts: "/posts",
  postDetail: (slug) => `/posts/${slug}`,
  postCategories: "/posts/categories",
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
  publicWorkspaceSpecialists: (idOrSlug) =>
    `/customers/workspaces/${idOrSlug}/specialists`,
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
  uploadAvatar: (type) => `${getAuthPrefix(type)}/profile/avatar`,

  // Integrations
  googleIntegration: (type) => `${getAuthPrefix(type)}/integrations/google`,
  googleSheetsTest: (type) =>
    `${getAuthPrefix(type)}/integrations/google/sheets/test`,
  googleSheetsCreate: (type) =>
    `${getAuthPrefix(type)}/integrations/google/sheets/create`,
  webhookIntegration: (type) => `${getAuthPrefix(type)}/integrations/webhook`,
  telegramIntegration: (type) => `${getAuthPrefix(type)}/integrations/telegram`,
  telegramActivateWebhook: (type) =>
    `${getAuthPrefix(type)}/integrations/telegram/activate-webhook`,
  emailIntegration: (type) => `${getAuthPrefix(type)}/integrations/email`,
  emailIntegrationTest: (type) =>
    `${getAuthPrefix(type)}/integrations/email/test`,
  apiIntegration: (type) => `${getAuthPrefix(type)}/integrations/api`,
  apiIntegrationRequest: (type) =>
    `${getAuthPrefix(type)}/integrations/api/request`,
  apiIntegrationReveal: (type) =>
    `${getAuthPrefix(type)}/integrations/api/reveal-secret`,
  apiIntegrationRegenerate: (type) =>
    `${getAuthPrefix(type)}/integrations/api/regenerate`,
  apiIntegrationVerify: (type) =>
    `${getAuthPrefix(type)}/integrations/api/verify`,

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
  workspaceSettingsProfile: "/workspace-members/workspace/settings/profile",
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
  workspaceServiceSlots: (id) =>
    `/workspace-members/workspace/services/${id}/slots`,
  workspaceSchedules: "/workspace-members/workspace/schedules",
  workspaceScheduleItem: (id) => `/workspace-members/workspace/schedules/${id}`,
  workspaceScheduleCopySlots: (id) =>
    `/workspace-members/workspace/schedules/${id}/copy-slots`,
  workspaceMembers: "/workspace-members/workspace/members",
  workspaceMemberItem: (id) => `/workspace-members/workspace/members/${id}`,
  workspaceRoles: "/workspace-members/workspace/roles",
  workspaceRoleItem: (id) => `/workspace-members/workspace/roles/${id}`,
  workspaceRolesPermissions: "/workspace-members/workspace/roles/permissions",
  workspaceResources: "/workspace-members/workspace/resources",
  workspaceResourceStats: "/workspace-members/workspace/resources/stats",
  workspaceResourceItem: (id) => `/workspace-members/workspace/resources/${id}`,
  workspaceLogs: "/workspace-members/workspace/logs",
  workspaceCustomers: "/workspace-members/workspace/customers",
  workspaceCustomerItem: (id) => `/workspace-members/workspace/customers/${id}`,
  workspaceBookings: "/workspace-members/workspace/bookings",
  workspaceCalendarBookings: "/workspace-members/workspace/bookings/calendar",
  workspaceBookingItem: (id) => `/workspace-members/workspace/bookings/${id}`,
  workspaceBookingStatus: (id) =>
    `/workspace-members/workspace/bookings/${id}/status`,
  workspaceBookingCancel: (id) =>
    `/workspace-members/workspace/bookings/${id}/cancel`,
  workspaceBookingReschedule: (id) =>
    `/workspace-members/workspace/bookings/${id}/reschedule`,
  workspaceBookingSummary: (id) =>
    `/workspace-members/workspace/bookings/${id}/summary`,
  workspaceTemplates: "/workspace-members/workspace/templates",
  workspaceTemplateItem: (id) => `/workspace-members/workspace/templates/${id}`,
  workspaceKeywords: "/workspace-members/workspace/keywords",
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
  chatSsoUrl: "/chats/sso-url",
  chatContacts: "/chats/contacts",
  chatInboxes: "/chats/inboxes",
  chatAutomations: "/chats/automations",
  chatSla: "/chats/sla",
  chatCaptainAiTask: "/chats/captain-ai/task",
  chatReports: "/chats/reports",
  chatPortals: "/chats/portals",
  chatSettings: "/chats/settings",

  // Workspace Member Applications: Saabq-Chat (Full Interactive Omnichannel Suite)
  workspaceSaabqChatAuthorizeUrl:
    "/workspace-members/workspace/applications/saabq-chat/authorize-url",
  workspaceSaabqChatConnect:
    "/workspace-members/workspace/applications/saabq-chat/connect",
  workspaceSaabqChatDisconnect:
    "/workspace-members/workspace/applications/saabq-chat/disconnect",
  workspaceSaabqChatSsoUrl:
    "/workspace-members/workspace/applications/saabq-chat/sso-url",
  workspaceSaabqChatSettings:
    "/workspace-members/workspace/applications/saabq-chat/settings",

  // Inboxes
  workspaceSaabqChatInboxes:
    "/workspace-members/workspace/applications/saabq-chat/inboxes",
  workspaceSaabqChatInboxDetail: (id) =>
    `/workspace-members/workspace/applications/saabq-chat/inboxes/${id}`,
  workspaceSaabqChatInboxMembers: (id) =>
    `/workspace-members/workspace/applications/saabq-chat/inboxes/${id}/members`,
  workspaceSaabqChatInboxAgentBot: (id) =>
    `/workspace-members/workspace/applications/saabq-chat/inboxes/${id}/agent-bot`,

  // Conversations
  workspaceSaabqChatConversations:
    "/workspace-members/workspace/applications/saabq-chat/conversations",
  workspaceSaabqChatConversationsMeta:
    "/workspace-members/workspace/applications/saabq-chat/conversations/meta",
  workspaceSaabqChatConversationsFilter:
    "/workspace-members/workspace/applications/saabq-chat/conversations/filter",
  workspaceSaabqChatConversationDetail: (id) =>
    `/workspace-members/workspace/applications/saabq-chat/conversations/${id}`,
  workspaceSaabqChatToggleStatus: (id) =>
    `/workspace-members/workspace/applications/saabq-chat/conversations/${id}/toggle-status`,
  workspaceSaabqChatTogglePriority: (id) =>
    `/workspace-members/workspace/applications/saabq-chat/conversations/${id}/toggle-priority`,
  workspaceSaabqChatToggleTyping: (id) =>
    `/workspace-members/workspace/applications/saabq-chat/conversations/${id}/toggle-typing`,
  workspaceSaabqChatConversationLabels: (id) =>
    `/workspace-members/workspace/applications/saabq-chat/conversations/${id}/labels`,
  workspaceSaabqChatConversationCustomAttributes: (id) =>
    `/workspace-members/workspace/applications/saabq-chat/conversations/${id}/custom-attributes`,
  workspaceSaabqChatDestroyCustomAttributes: (id) =>
    `/workspace-members/workspace/applications/saabq-chat/conversations/${id}/destroy-custom-attributes`,
  workspaceSaabqChatAssign: (id) =>
    `/workspace-members/workspace/applications/saabq-chat/conversations/${id}/assignments`,
  workspaceSaabqChatMute: (id) =>
    `/workspace-members/workspace/applications/saabq-chat/conversations/${id}/mute`,
  workspaceSaabqChatUnmute: (id) =>
    `/workspace-members/workspace/applications/saabq-chat/conversations/${id}/unmute`,
  workspaceSaabqChatReportingEvents: (id) =>
    `/workspace-members/workspace/applications/saabq-chat/conversations/${id}/reporting-events`,

  // Messages
  workspaceSaabqChatMessages: (conversationId) =>
    `/workspace-members/workspace/applications/saabq-chat/conversations/${conversationId}/messages`,
  workspaceSaabqChatMessageDelete: (conversationId, messageId) =>
    `/workspace-members/workspace/applications/saabq-chat/conversations/${conversationId}/messages/${messageId}`,
  workspaceSaabqChatMessageRetry: (conversationId, messageId) =>
    `/workspace-members/workspace/applications/saabq-chat/conversations/${conversationId}/messages/${messageId}/retry`,

  // Contacts
  workspaceSaabqChatContacts:
    "/workspace-members/workspace/applications/saabq-chat/contacts",
  workspaceSaabqChatContactSearch:
    "/workspace-members/workspace/applications/saabq-chat/contacts/search",
  workspaceSaabqChatContactFilter:
    "/workspace-members/workspace/applications/saabq-chat/contacts/filter",
  workspaceSaabqChatContactDetail: (id) =>
    `/workspace-members/workspace/applications/saabq-chat/contacts/${id}`,
  workspaceSaabqChatContactConversations: (id) =>
    `/workspace-members/workspace/applications/saabq-chat/contacts/${id}/conversations`,
  workspaceSaabqChatContactInboxes: (id) =>
    `/workspace-members/workspace/applications/saabq-chat/contacts/${id}/contact-inboxes`,
  workspaceSaabqChatContactableInboxes: (id) =>
    `/workspace-members/workspace/applications/saabq-chat/contacts/${id}/contactable-inboxes`,
  workspaceSaabqChatContactLabels: (id) =>
    `/workspace-members/workspace/applications/saabq-chat/contacts/${id}/labels`,
  workspaceSaabqChatContactMerge:
    "/workspace-members/workspace/applications/saabq-chat/contacts/merge",

  // Agents & Teams
  workspaceSaabqChatAgents:
    "/workspace-members/workspace/applications/saabq-chat/agents",
  workspaceSaabqChatAgentDetail: (id) =>
    `/workspace-members/workspace/applications/saabq-chat/agents/${id}`,
  workspaceSaabqChatTeams:
    "/workspace-members/workspace/applications/saabq-chat/teams",
  workspaceSaabqChatTeamDetail: (id) =>
    `/workspace-members/workspace/applications/saabq-chat/teams/${id}`,
  workspaceSaabqChatTeamMembers: (id) =>
    `/workspace-members/workspace/applications/saabq-chat/teams/${id}/members`,

  // Canned Responses
  workspaceSaabqChatCannedResponses:
    "/workspace-members/workspace/applications/saabq-chat/canned-responses",
  workspaceSaabqChatCannedResponseDetail: (id) =>
    `/workspace-members/workspace/applications/saabq-chat/canned-responses/${id}`,

  // Automation Rules & Macros
  workspaceSaabqChatAutomationRules:
    "/workspace-members/workspace/applications/saabq-chat/automation-rules",
  workspaceSaabqChatAutomationRuleDetail: (id) =>
    `/workspace-members/workspace/applications/saabq-chat/automation-rules/${id}`,
  workspaceSaabqChatMacros:
    "/workspace-members/workspace/applications/saabq-chat/macros",
  workspaceSaabqChatMacroDetail: (id) =>
    `/workspace-members/workspace/applications/saabq-chat/macros/${id}`,
  workspaceSaabqChatMacroExecute: (id) =>
    `/workspace-members/workspace/applications/saabq-chat/macros/${id}/execute`,

  // SLA Policies
  workspaceSaabqChatSlaPolicies:
    "/workspace-members/workspace/applications/saabq-chat/sla-policies",
  workspaceSaabqChatSlaPolicyDetail: (id) =>
    `/workspace-members/workspace/applications/saabq-chat/sla-policies/${id}`,

  // Help Center (Portals, Categories, Articles)
  workspaceSaabqChatPortals:
    "/workspace-members/workspace/applications/saabq-chat/portals",
  workspaceSaabqChatPortalDetail: (id) =>
    `/workspace-members/workspace/applications/saabq-chat/portals/${id}`,
  workspaceSaabqChatPortalCategories: (portalId) =>
    `/workspace-members/workspace/applications/saabq-chat/portals/${portalId}/categories`,
  workspaceSaabqChatPortalCategoryDetail: (portalId, categoryId) =>
    `/workspace-members/workspace/applications/saabq-chat/portals/${portalId}/categories/${categoryId}`,
  workspaceSaabqChatPortalArticles: (portalId) =>
    `/workspace-members/workspace/applications/saabq-chat/portals/${portalId}/articles`,
  workspaceSaabqChatPortalArticleDetail: (portalId, articleId) =>
    `/workspace-members/workspace/applications/saabq-chat/portals/${portalId}/articles/${articleId}`,

  // Labels & Custom Attributes
  workspaceSaabqChatLabels:
    "/workspace-members/workspace/applications/saabq-chat/labels",
  workspaceSaabqChatLabelDetail: (id) =>
    `/workspace-members/workspace/applications/saabq-chat/labels/${id}`,
  workspaceSaabqChatCustomAttributes:
    "/workspace-members/workspace/applications/saabq-chat/custom-attributes",
  workspaceSaabqChatCustomAttributeDetail: (id) =>
    `/workspace-members/workspace/applications/saabq-chat/custom-attributes/${id}`,

  // Webhooks & Agent Bots
  workspaceSaabqChatWebhooks:
    "/workspace-members/workspace/applications/saabq-chat/webhooks",
  workspaceSaabqChatWebhookDetail: (id) =>
    `/workspace-members/workspace/applications/saabq-chat/webhooks/${id}`,
  workspaceSaabqChatAgentBots:
    "/workspace-members/workspace/applications/saabq-chat/agent-bots",
  workspaceSaabqChatAgentBotDetail: (id) =>
    `/workspace-members/workspace/applications/saabq-chat/agent-bots/${id}`,

  // Campaigns & Custom Filters
  workspaceSaabqChatCampaigns:
    "/workspace-members/workspace/applications/saabq-chat/campaigns",
  workspaceSaabqChatCampaignDetail: (id) =>
    `/workspace-members/workspace/applications/saabq-chat/campaigns/${id}`,
  workspaceSaabqChatCustomFilters:
    "/workspace-members/workspace/applications/saabq-chat/custom-filters",
  workspaceSaabqChatCustomFilterDetail: (id) =>
    `/workspace-members/workspace/applications/saabq-chat/custom-filters/${id}`,

  // Reports & CSAT Analytics
  workspaceSaabqChatReportsSummary:
    "/workspace-members/workspace/applications/saabq-chat/reports/summary",
  workspaceSaabqChatReportsDistribution:
    "/workspace-members/workspace/applications/saabq-chat/reports/first-response-distribution",
  workspaceSaabqChatReportsTraffic:
    "/workspace-members/workspace/applications/saabq-chat/reports/conversation-traffic",
  workspaceSaabqChatReportsCsatMetrics:
    "/workspace-members/workspace/applications/saabq-chat/reports/csat/metrics",
  workspaceSaabqChatReportsCsatResponses:
    "/workspace-members/workspace/applications/saabq-chat/reports/csat/responses",

  // Captain AI
  workspaceSaabqChatCaptainAiTask:
    "/workspace-members/workspace/applications/saabq-chat/captain-ai/task",

  // Audit Logs & Dashboard Apps
  workspaceSaabqChatAuditLogs:
    "/workspace-members/workspace/applications/saabq-chat/audit-logs",
  workspaceSaabqChatDashboardApps:
    "/workspace-members/workspace/applications/saabq-chat/dashboard-apps",
  workspaceSaabqChatDashboardAppDetail: (id) =>
    `/workspace-members/workspace/applications/saabq-chat/dashboard-apps/${id}`,
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

export async function subscribeToNewsletter(email, locale = "ar") {
  const res = await client.post(endpoints.newsletterSubscribe, {
    email,
    locale,
    source: "website",
  });
  return res.data;
}

export async function submitIssueReport(formData) {
  const res = await client.post(endpoints.issueReports, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data;
}

export default client;
