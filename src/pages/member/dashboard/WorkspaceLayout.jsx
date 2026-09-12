import { useState, useEffect, useRef } from "react";
import { Fragment } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { useLanguage } from "../../../context/LanguageContext";
import GoogleNotConnectedBanner from "../../../components/common/GoogleNotConnectedBanner";
import Icon from "../../../components/common/Icon";
import client, { endpoints } from "../../../api/client";
import { checkWorkspaceCapability } from "../../../utils/capabilities";
import {
  getWorkspaceTabs,
  canViewWorkspaceTab,
  getWorkspaceSettingsSubTabs,
} from "../../../config/dashboardNav";

export default function WorkspaceLayout() {
  const { user } = useAuth();
  const { t, lang } = useLanguage();
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

  const sidebarRef = useRef(null);

  useEffect(() => {
    if (!sidebarRef.current) return;
    const activeEl = sidebarRef.current.querySelector(
      ".profile-sidebar-link.active",
    );
    if (activeEl) {
      activeEl.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
    }
  }, [location.pathname]);

  const isOwner = user?.is_owner === true;
  const userPermissions = Array.isArray(user?.permissions)
    ? user.permissions
    : [];
  const _canViewPermission = (module) =>
    isOwner ||
    userPermissions.includes(`${module}_read`) ||
    userPermissions.includes(`${module}_create`) ||
    userPermissions.includes(`${module}_update`) ||
    userPermissions.includes(`${module}_delete`) ||
    userPermissions.includes(`${module}_write`) ||
    userPermissions.includes(`${module}_manage`);
  const hasActiveSub = user?.workspace?.has_active_subscription ?? true;
  const isWorkspaceActive = user?.workspace?.status === "active";
  const _workspaceStatus = user?.workspace?.status || "pending";

  // The seven settings screens used to be a horizontal strip inside the
  // settings page; they are nested under it in this nav instead, addressed
  // by ?sub= so each one is linkable.
  const mainWorkspaceTabs = getWorkspaceTabs(t, user?.workspace, lang);

  const canViewTab = (tab) =>
    canViewWorkspaceTab(tab, isOwner, userPermissions, user);

  const availableTabs = mainWorkspaceTabs.filter(canViewTab);

  const isSettingsOpen = location.pathname === "/member/workspace/settings";
  const activeSettingsTab =
    new URLSearchParams(location.search).get("sub") || "basic";

  if (availableTabs.length === 0) {
    return (
      <div className="workspace-dashboard-shell">
        <div style={{ padding: "0 28px" }}>
          <GoogleNotConnectedBanner />
        </div>
        <div
          style={{
            padding: "80px 20px",
            textAlign: "center",
            background: "var(--surface)",
            borderRadius: "var(--radius-lg, 16px)",
            boxShadow: "var(--shadow-sm)",
            margin: "20px 28px",
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
    );
  }

  return (
    <div className="workspace-dashboard-shell animate-page-enter">
      {/* Two-column dashboard grid */}
      <div className="workspace-dashboard-grid">
        <aside ref={sidebarRef} className="workspace-dashboard-sidebar">
          <nav aria-label={t("workspaceDetails") || "إدارة مساحة العمل"}>
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
                      t("workspacePendingApprovalTitle") ||
                      t("workspaceInactiveTitle") ||
                      "مساحة العمل بانتظار موافقة الإدارة"
                    }
                  >
                    <span className="profile-sidebar-icon">
                      <Icon name={wsTab.icon} />
                    </span>
                    <span style={{ flex: 1 }}>{wsTab.label}</span>
                    <Icon name="lock" size={14} style={{ color: "#ef4444" }} />
                  </div>
                );
              }

              return (
                <Fragment key={wsTab.path}>
                  <NavLink
                    to={wsTab.path}
                    end={wsTab.end}
                    className={({ isActive }) =>
                      `profile-sidebar-link${isActive ? " active" : ""}`
                    }
                    style={{ opacity: isCapAllowed ? 1 : 0.7 }}
                  >
                    <span className="profile-sidebar-icon">
                      <Icon name={wsTab.icon} />
                    </span>
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
                        style={{
                          color: "var(--muted)",
                          marginInlineStart: 6,
                        }}
                      />
                    )}
                  </NavLink>

                  {/* Settings' seven screens, nested under it and only while
                    settings is the open section. */}
                  {wsTab.subTabs && isSettingsOpen && (
                    <div className="workspace-subnav">
                      {wsTab.subTabs.map((sub) => (
                        <Link
                          key={sub.id}
                          to={`${wsTab.path}?sub=${sub.id}`}
                          className={`workspace-subnav-item${
                            activeSettingsTab === sub.id ? " active" : ""
                          }`}
                        >
                          {sub.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </Fragment>
              );
            })}
          </nav>
        </aside>

        <div key={location.pathname} className="workspace-dashboard-content">
          {/* Settings sub-tabs on mobile: placed right under the workspace tabs, before banners and anything else */}
          {isSettingsOpen && (
            <div className="settings-subtab-strip">
              {getWorkspaceSettingsSubTabs(t).map((sub) => (
                <Link
                  key={sub.id}
                  to={`/member/workspace/settings?sub=${sub.id}`}
                  className={`settings-subtab${
                    activeSettingsTab === sub.id ? " active" : ""
                  }`}
                >
                  {sub.label}
                </Link>
              ))}
            </div>
          )}

          {/* Banners inside the content area */}
          <GoogleNotConnectedBanner />

          {!isWorkspaceActive && (
            <div className="warning-banner warning-banner-inactive">
              <div className="warning-banner-content">
                <div className="warning-banner-icon icon-amber">
                  <Icon name="clock" size={24} />
                </div>
                <div className="warning-banner-text">
                  <h4>
                    {t("workspacePendingApprovalTitle") ||
                      "مساحة العمل بانتظار موافقة الإدارة"}
                  </h4>
                  <p>
                    {t("workspacePendingApprovalDesc") ||
                      "تم إنشاء مساحة العمل الخاصة بك بنجاح وهي قيد المراجعة وبانتظار موافقة فريق الإدارة. يمكنك التواصل مع الدعم الفني للاستفسار أو طلب تفعيل مساحة العمل."}
                  </p>
                </div>
              </div>
              <Link
                to="/member/chats"
                className="btn btn-primary btn-sm warning-banner-action"
                style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
              >
                <Icon name="message-square" size={14} />
                {t("contactSupport") || "تواصل مع الدعم"}
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

          {!isWorkspaceActive ? (
            <div
              style={{
                padding: "60px 24px",
                textAlign: "center",
                background: "var(--surface)",
                borderRadius: "var(--radius-lg, 16px)",
                border: "1px solid rgba(245, 158, 11, 0.25)",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: "50%",
                  background: "rgba(245, 158, 11, 0.12)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 16px",
                  color: "#d97706",
                }}
              >
                <Icon name="clock" size={38} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "4px 14px",
                    borderRadius: 99,
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    background: "rgba(245, 158, 11, 0.12)",
                    color: "#d97706",
                    border: "1px solid rgba(245, 158, 11, 0.3)",
                  }}
                >
                  <Icon name="clock" size={13} />
                  {t("statusPendingApproval") || "بانتظار موافقة الإدارة"}
                </span>
              </div>
              <h2
                style={{
                  color: "var(--heading)",
                  fontSize: "1.45rem",
                  fontWeight: 800,
                  marginBottom: 10,
                }}
              >
                {t("workspaceLockedTitle") || "مساحة العمل قيد المراجعة"}
              </h2>
              <p
                style={{
                  color: "var(--text-secondary)",
                  maxWidth: 480,
                  margin: "0 auto 28px",
                  lineHeight: 1.65,
                  fontSize: "0.94rem",
                }}
              >
                {t("workspaceLockedDesc") ||
                  "لا يمكنك تصفح أو تعديل بيانات مساحة العمل لأن الحساب قيد المراجعة وبانتظار موافقة إدارة المنصة. يمكنك التواصل مباشرة مع فريق الدعم الفني عبر المحادثات لتسريع التفعيل، أو إدارة ملفك الشخصي."}
              </p>
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: 12,
                  flexWrap: "wrap",
                }}
              >
                <Link
                  to="/member/chats"
                  className="btn btn-primary"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "10px 22px",
                  }}
                >
                  <Icon name="message-square" size={16} />
                  {t("contactSupport") || "تواصل مع الدعم الفني"}
                </Link>
                <Link
                  to="/member/profile"
                  className="btn btn-secondary"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "10px 20px",
                  }}
                >
                  <Icon name="user" size={16} />
                  {t("profileInfo") || "الملف الشخصي"}
                </Link>
              </div>
            </div>
          ) : (
            <Outlet />
          )}
        </div>
      </div>
    </div>
  );
}
