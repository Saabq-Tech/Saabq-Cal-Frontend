import { useState, useEffect } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { useLanguage } from "../../../context/LanguageContext";
import UserAvatar from "../../../components/ui/UserAvatar";
import GoogleNotConnectedBanner from "../../../components/common/GoogleNotConnectedBanner";
import Icon from "../../../components/common/Icon";
import client, { endpoints } from "../../../api/client";
import { checkWorkspaceCapability } from "../../../utils/capabilities";

export default function WorkspaceLayout() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();

  const [pendingBookingsCount, setPendingBookingsCount] = useState(0);

  useEffect(() => {
    if (user?.workspace?.id) {
      client
        .get(endpoints.workspaceBookings, {
          params: { status: "pending", per_page: 1 },
        })
        .then((res) => {
          const total =
            res.data?.meta?.total ??
            (Array.isArray(res.data?.data) ? res.data.data.length : 0);
          setPendingBookingsCount(total);
        })
        .catch(() => setPendingBookingsCount(0));
    } else {
      setPendingBookingsCount(0);
    }
  }, [user?.workspace?.id, location.pathname]);

  const isOwner = user?.is_owner === true;
  const userPermissions = Array.isArray(user?.permissions)
    ? user.permissions
    : [];
  const _canViewPermission = (module) =>
    isOwner ||
    userPermissions.includes(`${module}_read`) ||
    userPermissions.includes(`${module}_write`);
  const hasActiveSub = user?.workspace?.has_active_subscription ?? true;
  const subStatus =
    user?.workspace?.subscription?.status ||
    (hasActiveSub ? "active" : "inactive");
  const isWorkspaceActive = user?.workspace?.status === "active";
  const _workspaceStatus = user?.workspace?.status || "pending";

  const wsName = user?.workspace?.name || "مساحة العمل";
  const wsEmail = user?.email || "";
  const wsLogo = user?.workspace?.logo_url || null;

  const mainWorkspaceTabs = [
    {
      id: "settings",
      path: "/member/workspace/settings",
      label: t("workspaceSettings") || "الإعدادات العامة",
      icon: "monitor",
      permissions: ["settings_read", "settings_write"],
      capability: null,
    },
    {
      id: "schedules",
      path: "/member/workspace/schedules",
      label: t("navSchedules") || "جداول العمل",
      icon: "clock",
      permissions: ["schedule_read", "schedule_write"],
      capability: "PER_MEMBER_CALENDAR",
    },
    {
      id: "services",
      path: "/member/workspace/services",
      label: t("navServices") || "الخدمات",
      icon: "custom-bc148024",
      permissions: ["service_read", "service_write"],
      capability: "BOOKING",
    },
    {
      id: "members",
      path: "/member/workspace/members",
      label: t("navMembers") || "فريق العمل",
      icon: "custom-cdbb0862",
      permissions: ["member_read", "member_write"],
      capability: "TEAM_MEMBERS",
    },
    {
      id: "roles",
      path: "/member/workspace/roles",
      label: t("workspaceRoles") || "الأدوار والصلاحيات",
      icon: "shield",
      permissions: ["role_read", "role_write"],
      capability: "TEAM_MEMBERS",
    },
    {
      id: "bookings",
      path: "/member/workspace/bookings",
      label: t("navBookings") || "سجل الحجوزات",
      icon: "calendar",
      permissions: ["booking_read", "booking_write"],
      capability: "BOOKING",
    },
    {
      id: "subscriptions",
      path: "/member/workspace/subscriptions",
      label: t("navSubscriptions") || "الباقات والاشتراكات",
      icon: "credit-card",
      permissions: ["subscription_read", "subscription_write"],
      capability: "SUBSCRIPTION",
    },
    {
      id: "resources",
      path: "/member/workspace/resources",
      label: t("workspaceResources") || "الموارد والقاعات",
      icon: "briefcase",
      permissions: ["resource_read", "resource_write"],
      capability: null,
    },
    {
      id: "logs",
      path: "/member/workspace/logs",
      label: t("auditLogs") || "سجل النشاطات",
      icon: "clipboard-list",
      permissions: ["settings_read"],
      capability: null,
    },
    {
      id: "payments",
      path: "/member/workspace/payments",
      label: t("paymentsAndFinance") || "المدفوعات والمالية",
      icon: "credit-card",
      permissions: [
        "payment_read",
        "payment_write",
        "booking_read",
        "booking_write",
      ],
      capability: null,
    },
  ];

  const canViewTab = (tab) => {
    if (isOwner) return true;
    return tab.permissions.some((perm) => userPermissions.includes(perm));
  };

  const availableTabs = mainWorkspaceTabs.filter(canViewTab);

  if (availableTabs.length === 0) {
    return (
      <div className="main-content">
        <div className="container profile-page animate-page-enter">
          <GoogleNotConnectedBanner />
          <div
            style={{
              padding: "80px 20px",
              textAlign: "center",
              background: "var(--surface)",
              borderRadius: "var(--radius-lg, 16px)",
              boxShadow: "var(--shadow-sm)",
              marginTop: 20,
            }}
          >
            <Icon
              name="shield"
              size={64}
              style={{ color: "var(--border-strong)", marginBottom: 16 }}
            />
            <h2
              style={{
                color: "var(--heading)",
                fontSize: "1.5rem",
                marginBottom: 8,
              }}
            >
              {t("noPermissionsTitle") || "صلاحيات محدودة"}
            </h2>
            <p
              style={{
                color: "var(--text-secondary)",
                maxWidth: 400,
                margin: "0 auto 24px",
                lineHeight: 1.6,
              }}
            >
              {t("noPermissionsDesc") ||
                "ليس لديك أي صلاحيات لعرض أو إدارة إعدادات مساحة العمل. يرجى التواصل مع مالك مساحة العمل لمنحك الصلاحيات اللازمة."}
            </p>
            <Link
              to="/member/profile"
              className="btn btn-primary"
              style={{ padding: "10px 24px" }}
            >
              <Icon name="arrow-right" size={16} />
              {t("backToProfile") || "العودة للحساب الشخصي"}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="main-content">
      <div className="container profile-page animate-page-enter">
        <GoogleNotConnectedBanner />

        {!isWorkspaceActive && (
          <div className="warning-banner warning-banner-inactive">
            <div className="warning-banner-content">
              <div className="warning-banner-icon icon-red">
                <Icon name="alert-triangle" size={24} />
              </div>
              <div className="warning-banner-text">
                <h4>
                  {t("workspaceInactiveTitle") || "مساحة العمل غير مفعّلة!"}
                </h4>
                <p>
                  {t("workspaceInactiveDesc") ||
                    "مساحة العمل الخاصة بك بانتظار موافقة الإدارة أو غير مفعّلة حالياً. تم تقييد الوصول لصفحات وبيانات مساحة العمل."}
                </p>
              </div>
            </div>
            <Link
              to="/member/profile"
              className="btn btn-secondary btn-sm warning-banner-action"
            >
              <Icon name="user" size={14} />
              {t("profileInfo") || "الملف الشخصي"}
            </Link>
          </div>
        )}

        {isWorkspaceActive && !hasActiveSub && (
          <div className="warning-banner warning-banner-inactive">
            <div className="warning-banner-content">
              <div className="warning-banner-icon icon-red">
                <Icon name="alert-triangle" size={20} />
              </div>
              <div className="warning-banner-text">
                <p style={{ margin: 0, fontWeight: 600 }}>
                  {t("noActiveSubscriptionBanner") ||
                    "تنبيه: مساحة العمل لا تمتلك اشتراكاً نشطاً. تم تقييد الميزات المتقدمة لحين تفعيل اشتراكك."}
                </p>
              </div>
            </div>
            <Link
              to="/member/workspace/subscriptions"
              className="btn btn-danger btn-sm warning-banner-action"
            >
              {t("subscribeNow") || "اشترك الآن"}
            </Link>
          </div>
        )}

        <div className="profile-header">
          <div className="profile-avatar">
            <UserAvatar name={wsName} avatarUrl={wsLogo} size={72} />
          </div>

          <div className="profile-info">
            <h1>{wsName}</h1>
            <p>{wsEmail}</p>
            <div
              style={{
                display: "flex",
                gap: 6,
                flexWrap: "wrap",
                marginTop: 4,
              }}
            >
              {!isWorkspaceActive ? (
                <span
                  className="profile-badge inactive"
                  style={{
                    background: "#ef4444",
                    color: "#fff",
                    fontWeight: 800,
                    border: "1px solid #dc2626",
                  }}
                >
                  <span
                    className="badge-dot inactive"
                    style={{ background: "#fff" }}
                  />
                  {t("workspaceInactiveBadge") ||
                    "غير مفعّلة (بانتظار موافقة الإدارة)"}
                </span>
              ) : subStatus === "pending" ? (
                <span className="profile-badge pending">
                  <span className="badge-dot pending" />
                  {t("statusPending") || "طلب اشتراك قيد الانتظار"}
                </span>
              ) : hasActiveSub ? (
                <span className="profile-badge active">
                  <span className="badge-dot active" />
                  {t("activeWorkspace") || "مساحة نشطة"}
                </span>
              ) : (
                <span className="profile-badge inactive">
                  <span className="badge-dot inactive" />
                  {t("inactiveSubscription") || "اشتراك غير نشط"}
                </span>
              )}
              <span
                className="profile-badge member"
                style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
              >
                <Icon name="custom-b8c34186" size={12} />
                {t("workspace") || "مساحة العمل"}
              </span>
              {isOwner && (
                <span
                  className="profile-badge verified"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <Icon name="crown" size={12} />
                  {t("owner")}
                </span>
              )}
            </div>
          </div>

          <div className="profile-header-action">
            <Link
              to="/member/profile"
              className="btn btn-primary btn-sm"
              style={{ gap: 6 }}
            >
              <Icon name="user" size={14} />
              {t("profileInfo") || "الحساب الشخصي"}
            </Link>
          </div>
        </div>

        <div className="profile-grid">
          <aside className="profile-sidebar">
            <div className="profile-sidebar-header">
              {t("workspaceDetails") || "إدارة مساحة العمل"}
            </div>

            {availableTabs.map((wsTab) => {
              const isCapAllowed =
                isWorkspaceActive &&
                checkWorkspaceCapability(user, wsTab.capability);

              if (!isWorkspaceActive) {
                return (
                  <div
                    key={wsTab.path}
                    className="profile-sidebar-link"
                    style={{
                      opacity: 0.5,
                      cursor: "not-allowed",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "10px 14px",
                    }}
                    title={
                      t("workspaceInactiveTitle") || "مساحة العمل غير مفعّلة"
                    }
                  >
                    <Icon name={wsTab.icon} />
                    <span style={{ flex: 1 }}>{wsTab.label}</span>
                    <Icon name="lock" size={14} style={{ color: "#ef4444" }} />
                  </div>
                );
              }

              return (
                <NavLink
                  key={wsTab.path}
                  to={wsTab.path}
                  className={({ isActive }) =>
                    `profile-sidebar-link${isActive ? " active" : ""}`
                  }
                  style={{ opacity: isCapAllowed ? 1 : 0.7 }}
                >
                  <Icon name={wsTab.icon} />
                  <span style={{ flex: 1 }}>{wsTab.label}</span>
                  {wsTab.id === "bookings" && pendingBookingsCount > 0 && (
                    <span
                      style={{
                        marginInlineStart: "auto",
                        padding: "2px 8px",
                        borderRadius: 10,
                        fontSize: "0.75rem",
                        fontWeight: 800,
                        background: "#f59e0b",
                        color: "#ffffff",
                        boxShadow: "0 2px 6px rgba(245, 158, 11, 0.3)",
                      }}
                    >
                      {pendingBookingsCount}
                    </span>
                  )}
                  {!isCapAllowed && (
                    <Icon
                      name="lock"
                      size={14}
                      style={{ color: "var(--muted)", marginInlineStart: 6 }}
                    />
                  )}
                </NavLink>
              );
            })}
          </aside>

          <main
            key={location.pathname}
            className="dashboard-content animate-fade-in-up"
            style={{ flex: 1, minWidth: 0 }}
          >
            {!isWorkspaceActive ? (
              <div
                style={{
                  padding: "60px 20px",
                  textAlign: "center",
                  background: "var(--surface)",
                  borderRadius: "var(--radius-lg, 16px)",
                  border: "1px solid rgba(239, 68, 68, 0.2)",
                  boxShadow: "var(--shadow-sm)",
                }}
              >
                <Icon
                  name="lock"
                  size={56}
                  style={{ color: "#ef4444", marginBottom: 16 }}
                />
                <h2
                  style={{
                    color: "var(--heading)",
                    fontSize: "1.4rem",
                    fontWeight: 800,
                    marginBottom: 8,
                  }}
                >
                  {t("workspaceLockedTitle") || "صفحات مساحة العمل مقفلة"}
                </h2>
                <p
                  style={{
                    color: "var(--text-secondary)",
                    maxWidth: 460,
                    margin: "0 auto 24px",
                    lineHeight: 1.6,
                    fontSize: "0.92rem",
                  }}
                >
                  {t("workspaceLockedDesc") ||
                    "لا يمكنك تصفح أو تعديل بيانات مساحة العمل لأن الحساب غير مفعّل بعد أو بانتظار موافقة أدمن المنصة. يمكنك الاستمرار في تعديل ملفك الشخصي واستعراض الدعم الفني."}
                </p>
                <div
                  style={{ display: "flex", justifyContent: "center", gap: 12 }}
                >
                  <Link to="/member/profile" className="btn btn-primary">
                    <Icon name="user" size={16} />
                    {t("profileInfo") || "الملف الشخصي"}
                  </Link>
                </div>
              </div>
            ) : (
              <Outlet />
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
