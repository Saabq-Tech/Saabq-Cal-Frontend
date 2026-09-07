import { useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import { getAccountTabs } from "../../config/dashboardNav";
import Icon from "../common/Icon";

export default function DashboardSidebar({ variant }) {
  const { userType, unreadCount = 0, unreadChatCount = 0 } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();
  const prefix = userType === "member" ? "/member" : "/customer";

  const isProfilePath = location.pathname === `${prefix}/profile`;
  const queryParams = new URLSearchParams(location.search);
  const defaultTab = "overview";
  const activeTab = isProfilePath ? queryParams.get("tab") || defaultTab : null;

  const accountTabs = getAccountTabs(t, userType);
  const isDashboard = variant === "dashboard";

  // Mouse drag-to-scroll & wheel scrolling
  const sidebarRef = useRef(null);
  const navRef = useRef(null);
  const isMouseDownRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);

  useEffect(() => {
    const container = navRef.current || sidebarRef.current;
    if (!container) return;
    const activeEl = container.querySelector(".profile-sidebar-link.active");
    if (activeEl) {
      activeEl.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
    }
  }, [activeTab, location.pathname]);

  const handleMouseDown = (e) => {
    if (!sidebarRef.current) return;
    isMouseDownRef.current = true;
    startXRef.current = e.pageX - sidebarRef.current.offsetLeft;
    scrollLeftRef.current = sidebarRef.current.scrollLeft;
  };

  const handleMouseLeave = () => {
    isMouseDownRef.current = false;
  };

  const handleMouseUp = () => {
    isMouseDownRef.current = false;
  };

  const handleMouseMove = (e) => {
    if (!isMouseDownRef.current || !sidebarRef.current) return;
    e.preventDefault();
    const x = e.pageX - sidebarRef.current.offsetLeft;
    const walk = (x - startXRef.current) * 1.5;
    sidebarRef.current.scrollLeft = scrollLeftRef.current - walk;
  };

  const handleWheel = (e) => {
    if (!sidebarRef.current) return;
    if (e.deltaY !== 0) {
      sidebarRef.current.scrollLeft += e.deltaY;
    }
  };

  return (
    <aside
      ref={sidebarRef}
      className={
        isDashboard ? "workspace-dashboard-sidebar" : "profile-sidebar"
      }
      aria-label={t("profileInfo") || "قائمة الحساب الشخصي"}
      onMouseDown={handleMouseDown}
      onMouseLeave={handleMouseLeave}
      onMouseUp={handleMouseUp}
      onMouseMove={handleMouseMove}
      onWheel={handleWheel}
    >
      {!isDashboard && (
        <div className="profile-sidebar-header">
          {t("profileInfo") || "الحساب الشخصي"}
        </div>
      )}

      {/* Account tabs */}
      <nav ref={navRef} aria-label={t("profileInfo") || "قائمة الحساب"}>
        {accountTabs.map((tabItem) => {
          const isActive = activeTab === tabItem.id;
          const badgeCount =
            tabItem.badge === "unread"
              ? unreadCount
              : tabItem.badge === "chat"
                ? unreadChatCount
                : 0;

          return (
            <Link
              key={tabItem.id}
              to={tabItem.to}
              className={`profile-sidebar-link${isActive ? " active" : ""}`}
              aria-current={isActive ? "page" : undefined}
            >
              <span className="profile-sidebar-icon">
                <Icon name={tabItem.icon} />
              </span>
              <span>{tabItem.label}</span>
              {badgeCount > 0 && (
                <span
                  className="notif-sidebar-badge"
                  style={
                    tabItem.badge === "chat"
                      ? { background: "var(--primary)", color: "#fff" }
                      : undefined
                  }
                >
                  {badgeCount > 99 ? "99+" : badgeCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
