import { useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import Icon from "../common/Icon";

export default function DashboardSidebar() {
  const { userType, unreadCount = 0, unreadChatCount = 0 } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();
  const prefix = userType === "member" ? "/member" : "/customer";

  const isProfilePath = location.pathname === `${prefix}/profile`;
  const queryParams = new URLSearchParams(location.search);
  const defaultTab = userType === "member" ? "info" : "overview";
  const activeTab = isProfilePath ? queryParams.get("tab") || defaultTab : null;

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
      className="profile-sidebar"
      aria-label={t("profileInfo") || "قائمة الحساب الشخصي"}
      onMouseDown={handleMouseDown}
      onMouseLeave={handleMouseLeave}
      onMouseUp={handleMouseUp}
      onMouseMove={handleMouseMove}
      onWheel={handleWheel}
    >
      <div className="profile-sidebar-header">
        {t("profileInfo") || "الحساب الشخصي"}
      </div>

      <nav ref={navRef} aria-label={t("profileInfo") || "قائمة الحساب"}>
        {/* Overview. For a member the stats page now lives in the workspace
            (its index route), so this account menu only carries it for a
            customer, whose overview is their own account summary. */}
        {userType === "customer" && (
          <Link
            to={`${prefix}/profile?tab=overview`}
            className={`profile-sidebar-link${activeTab === "overview" ? " active" : ""}`}
            aria-current={activeTab === "overview" ? "page" : undefined}
          >
            <span className="profile-sidebar-icon">
              <Icon name="home" />
            </span>
            <span>{t("home")}</span>
          </Link>
        )}

        {/* 1. Profile Info */}
        <Link
          to={`${prefix}/profile?tab=info`}
          className={`profile-sidebar-link${activeTab === "info" ? " active" : ""}`}
          aria-current={activeTab === "info" ? "page" : undefined}
        >
          <span className="profile-sidebar-icon">
            <Icon name="custom-7e599ac1" />
          </span>
          {t("profileInfo")}
        </Link>

        {/* Customer Appointments */}
        {userType === "customer" && (
          <Link
            to={`${prefix}/profile?tab=appointments`}
            className={`profile-sidebar-link${activeTab === "appointments" ? " active" : ""}`}
            aria-current={activeTab === "appointments" ? "page" : undefined}
          >
            <span className="profile-sidebar-icon">
              <Icon name="calendar" />
            </span>
            <span>{t("myAppointments") || "مواعيدي"}</span>
          </Link>
        )}

        {/* 2. Change Password */}
        <Link
          to={`${prefix}/profile?tab=password`}
          className={`profile-sidebar-link${activeTab === "password" ? " active" : ""}`}
          aria-current={activeTab === "password" ? "page" : undefined}
        >
          <span className="profile-sidebar-icon">
            <Icon name="lock" />
          </span>
          {t("changePassword")}
        </Link>

        {/* 3. Security & 2FA */}
        <Link
          to={`${prefix}/profile?tab=security`}
          className={`profile-sidebar-link${activeTab === "security" ? " active" : ""}`}
          aria-current={activeTab === "security" ? "page" : undefined}
        >
          <span className="profile-sidebar-icon">
            <Icon name="shield" />
          </span>
          {t("securityTitle")}
        </Link>

        {/* 4. Applications & Integrations (Members only) */}
        {userType === "member" && (
          <Link
            to={`${prefix}/profile?tab=integrations`}
            className={`profile-sidebar-link${activeTab === "integrations" ? " active" : ""}`}
            aria-current={activeTab === "integrations" ? "page" : undefined}
          >
            <span className="profile-sidebar-icon">
              <Icon name="custom-f362b7da" />
            </span>
            {t("applicationsTitle") || "التطبيقات"}
          </Link>
        )}

        {/* 5. Notifications tab */}
        <Link
          to={`${prefix}/profile?tab=notifications`}
          className={`profile-sidebar-link${activeTab === "notifications" ? " active" : ""}`}
          aria-current={activeTab === "notifications" ? "page" : undefined}
        >
          <span className="profile-sidebar-icon">
            <Icon name="bell" />
          </span>
          <span>{t("notificationsTab")}</span>
          {unreadCount > 0 && (
            <span className="notif-sidebar-badge">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Link>

        {/* 6. Support Chat tab */}
        <Link
          to={`${prefix}/profile?tab=chats`}
          className={`profile-sidebar-link${activeTab === "chats" ? " active" : ""}`}
          aria-current={activeTab === "chats" ? "page" : undefined}
        >
          <span className="profile-sidebar-icon">
            <Icon name="message-square" />
          </span>
          <span>{t("chatsTab")}</span>
          {unreadChatCount > 0 && (
            <span
              className="notif-sidebar-badge"
              style={{ background: "var(--primary)", color: "#fff" }}
            >
              {unreadChatCount > 99 ? "99+" : unreadChatCount}
            </span>
          )}
        </Link>
      </nav>
    </aside>
  );
}
