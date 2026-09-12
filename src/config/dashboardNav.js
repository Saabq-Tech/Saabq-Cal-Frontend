/**
 * Single source of truth for the dashboard navigation menus so the sidebars
 * (DashboardSidebar for the account, WorkspaceLayout for the workspace) and the
 * mobile drawer in the Navbar all show the same items with the same gating.
 *
 * Each builder takes the `t` translator so labels stay localized, and returns
 * plain descriptors ({ id, to, icon, label, ... }) that each surface renders in
 * its own markup.
 */

import { isApiIntegrationEnabled } from "../utils/capabilities";

/** The seven settings screens, nested under the workspace "settings" tab. */
export function getWorkspaceSettingsSubTabs(t) {
  return [
    { id: "basic", label: t("workspaceBasicInfo") || "المعلومات الأساسية" },
    {
      id: "branding",
      label: t("workspaceBranding") || "الهوية والعلامة التجارية",
    },
    {
      id: "timezone",
      label: t("workspaceTimezone") || "المنطقة الزمنية وتنسيق الوقت",
    },
    {
      id: "social",
      label: t("workspaceSocialLinks") || "وسائل التواصل الاجتماعي والرابط",
    },
    {
      id: "form_fields",
      label: t("workspaceFormFields") || "منشئ نموذج الحجز",
    },
    { id: "payment", label: t("workspacePaymentReceipts") || "إيصالات الدفع" },
    {
      id: "notifications",
      label: t("workspaceNotificationTemplates") || "قوالب الإشعارات",
    },
    {
      id: "templates",
      label: t("prescriptionTemplates") || "قوالب التقارير والملخصات",
    },
  ];
}

/** All workspace management tabs (before permission/capability gating). */
export function getWorkspaceTabs(t, workspace = null, lang = "ar") {
  const getCustomerLabel = () => {
    if (workspace?.customer_label_plural) {
      if (typeof workspace.customer_label_plural === "object") {
        return (
          workspace.customer_label_plural[lang] ||
          workspace.customer_label_plural.ar ||
          workspace.customer_label_plural.en ||
          t("navCustomers") ||
          "العملاء"
        );
      }
      return workspace.customer_label_plural;
    }
    return t("navCustomers") || "العملاء";
  };

  const customerIcon = workspace?.customer_icon || "users";

  return [
    {
      id: "home",
      path: "/member/workspace",
      end: true,
      label: t("home") || "الرئيسية",
      icon: "home",
      permissions: [],
      capability: null,
      alwaysVisible: true,
    },
    {
      id: "bookings",
      path: "/member/workspace/bookings",
      label: t("navBookings") || "الحجوزات",
      icon: "calendar",
      permissions: [
        "booking_read",
        "booking_create",
        "booking_update",
        "booking_delete",
        "booking_write",
      ],
      capability: "BOOKING",
    },
    {
      id: "schedules",
      path: "/member/workspace/schedules",
      label: t("navSchedules") || "الجداول",
      icon: "clock",
      permissions: [
        "schedule_read",
        "schedule_create",
        "schedule_update",
        "schedule_delete",
        "schedule_write",
      ],
      capability: "PER_MEMBER_CALENDAR",
    },
    {
      id: "customers",
      path: "/member/workspace/customers",
      label: getCustomerLabel(),
      icon: customerIcon,
      permissions: [
        "customer_read",
        "customer_create",
        "customer_update",
        "customer_delete",
        "customer_write",
      ],
      capability: null,
    },
    {
      id: "services",
      path: "/member/workspace/services",
      label: t("navServices") || "الخدمات",
      icon: "briefcase",
      permissions: [
        "service_read",
        "service_create",
        "service_update",
        "service_delete",
        "service_write",
      ],
      capability: "BOOKING",
    },
    {
      id: "members",
      path: "/member/workspace/members",
      label: t("navMembers") || "الفريق",
      icon: "users",
      permissions: [
        "member_read",
        "member_create",
        "member_update",
        "member_delete",
        "member_write",
        "member_manage",
      ],
      capability: "TEAM_MEMBERS",
    },
    {
      id: "logs",
      path: "/member/workspace/logs",
      label: t("reports") || "التقارير",
      icon: "bar-chart",
      permissions: [
        "settings_read",
        "settings_update",
        "settings_write",
        "booking_read",
        "booking_create",
        "booking_update",
        "booking_delete",
        "booking_write",
      ],
      capability: null,
    },
    {
      id: "settings",
      path: "/member/workspace/settings",
      label: t("workspaceSettings") || "الإعدادات",
      icon: "settings",
      permissions: ["settings_read", "settings_update", "settings_write"],
      capability: null,
      subTabs: getWorkspaceSettingsSubTabs(t),
    },
    {
      id: "roles",
      path: "/member/workspace/roles",
      label: t("workspaceRoles") || "الأدوار والصلاحيات",
      icon: "shield",
      permissions: [
        "role_read",
        "role_create",
        "role_update",
        "role_delete",
        "role_write",
      ],
      capability: "TEAM_MEMBERS",
    },
    {
      id: "subscriptions",
      path: "/member/workspace/subscriptions",
      label: t("navSubscriptions") || "الباقات والاشتراكات",
      icon: "credit-card",
      permissions: [
        "subscription_read",
        "subscription_create",
        "subscription_update",
        "subscription_delete",
        "subscription_write",
      ],
      capability: "SUBSCRIPTION",
    },
    {
      id: "resources",
      path: "/member/workspace/resources",
      label: t("workspaceResources") || "الموارد والمخزون",
      icon: "briefcase",
      permissions: [
        "resource_read",
        "resource_create",
        "resource_update",
        "resource_delete",
        "resource_write",
      ],
      capability: null,
    },
    {
      id: "payments",
      path: "/member/workspace/payments",
      label: t("paymentsAndFinance") || "المدفوعات والمالية",
      icon: "credit-card",
      permissions: [
        "payment_read",
        "payment_create",
        "payment_update",
        "payment_delete",
        "payment_write",
        "booking_read",
        "booking_create",
        "booking_update",
        "booking_delete",
        "booking_write",
      ],
      capability: null,
    },
    {
      id: "api_integration",
      path: "/member/workspace/api-integration",
      label: t("apiIntegrationTitle") || "الربط البرمجي (API)",
      icon: "code",
      permissions: [
        "integration_read",
        "integration_create",
        "integration_update",
        "integration_delete",
        "integration_manage",
        "settings_read",
        "settings_update",
        "settings_write",
      ],
      capability: "REST_API",
    },
  ];
}

/** Permission gate for a workspace tab — mirrors WorkspaceLayout.canViewTab. */
export function canViewWorkspaceTab(
  tab,
  isOwner,
  userPermissions,
  user = null,
) {
  if (tab.id === "api_integration") {
    if (!user || !isApiIntegrationEnabled(user)) return false;
  }
  if (tab.alwaysVisible) return true;
  if (isOwner) return true;
  return tab.permissions.some((perm) => userPermissions.includes(perm));
}

/** Account (profile) tabs — mirrors DashboardSidebar, gated by userType. */
export function getAccountTabs(t, userType) {
  const prefix = userType === "member" ? "/member" : "/customer";
  return [
    {
      id: "overview",
      to: `${prefix}/profile?tab=overview`,
      icon: "home",
      label: t("overview") || "نظرة عامة",
      show: userType === "customer",
    },
    {
      id: "info",
      to: `${prefix}/profile?tab=info`,
      icon: "custom-7e599ac1",
      label: t("profileInfo"),
      show: true,
    },
    {
      id: "appointments",
      to: `${prefix}/profile?tab=appointments`,
      icon: "calendar",
      label: t("myAppointments") || "مواعيدي",
      show: userType === "customer",
    },
    {
      id: "password",
      to: `${prefix}/profile?tab=password`,
      icon: "lock",
      label: t("changePassword"),
      show: true,
    },
    {
      id: "security",
      to: `${prefix}/profile?tab=security`,
      icon: "shield",
      label: t("securityTitle"),
      show: true,
    },
    {
      id: "integrations",
      to: `${prefix}/integrations`,
      icon: "custom-f362b7da",
      label: t("applicationsTitle") || "التطبيقات",
      show: userType === "member",
    },
    {
      id: "notifications",
      to:
        userType === "member"
          ? `${prefix}/notifications`
          : `${prefix}/profile?tab=notifications`,
      icon: "bell",
      label: t("notificationsTab"),
      show: true,
      badge: "unread",
    },
    {
      id: "chats",
      to:
        userType === "member"
          ? `${prefix}/chats`
          : `${prefix}/profile?tab=chats`,
      icon: "message-square",
      label: t("chatsTab"),
      show: true,
      badge: "chat",
    },
  ].filter((tab) => tab.show);
}
