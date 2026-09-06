import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import Icon from "../common/Icon";

/**
 * Fixed bottom navigation for signed-in users on mobile. It surfaces only the
 * essential dashboard destinations — no landing-page sections — and its items
 * adapt to the account type (a customer sees their bookings; a member sees
 * their workspace). Rendered once in MainLayout and hidden on desktop via CSS.
 */
export default function MobileTabBar() {
  const { isAuthenticated, userType, unreadCount = 0 } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();

  useEffect(() => {
    if (!isAuthenticated) return undefined;
    document.body.classList.add("has-mobile-tabbar");
    return () => document.body.classList.remove("has-mobile-tabbar");
  }, [isAuthenticated]);

  if (!isAuthenticated) return null;

  const prefix = userType === "member" ? "/member" : "/customer";
  const path = location.pathname;
  const tab = new URLSearchParams(location.search).get("tab");

  const items =
    userType === "member"
      ? [
          {
            id: "home",
            to: "/",
            icon: "home",
            label: t("home"),
            isActive: () => path === "/",
          },
          {
            id: "workspace",
            to: "/member/workspace",
            icon: "briefcase",
            label: t("myWorkspace"),
            isActive: () => path.startsWith("/member/workspace"),
          },
          {
            id: "account",
            to: `${prefix}/profile`,
            icon: "user",
            label: t("myAccount"),
            isActive: () =>
              path.endsWith("/profile") && tab !== "notifications",
          },
          {
            id: "notifications",
            to: `${prefix}/profile?tab=notifications`,
            icon: "bell",
            label: t("notificationsTab"),
            badge: unreadCount,
            isActive: () =>
              path.endsWith("/profile") && tab === "notifications",
          },
        ]
      : [
          {
            id: "home",
            to: "/",
            icon: "home",
            label: t("home"),
            isActive: () => path === "/",
          },
          {
            id: "appointments",
            to: `${prefix}/profile?tab=appointments`,
            icon: "calendar",
            label: t("myAppointments") || "مواعيدي",
            isActive: () =>
              path.endsWith("/profile") && tab === "appointments",
          },
          {
            id: "account",
            to: `${prefix}/profile`,
            icon: "user",
            label: t("myAccount"),
            isActive: () =>
              path.endsWith("/profile") &&
              tab !== "appointments" &&
              tab !== "notifications",
          },
          {
            id: "notifications",
            to: `${prefix}/profile?tab=notifications`,
            icon: "bell",
            label: t("notificationsTab"),
            badge: unreadCount,
            isActive: () =>
              path.endsWith("/profile") && tab === "notifications",
          },
        ];

  return (
    <nav className="mobile-tabbar" aria-label={t("myAccount")}>
      {items.map((item) => {
        const active = item.isActive();
        return (
          <Link
            key={item.id}
            to={item.to}
            className={`mobile-tabbar-item${active ? " active" : ""}`}
            aria-current={active ? "page" : undefined}
          >
            <span className="mobile-tabbar-icon">
              <Icon name={item.icon} />
              {item.badge > 0 && (
                <span className="mobile-tabbar-badge">
                  {item.badge > 99 ? "99+" : item.badge}
                </span>
              )}
            </span>
            <span className="mobile-tabbar-label">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
