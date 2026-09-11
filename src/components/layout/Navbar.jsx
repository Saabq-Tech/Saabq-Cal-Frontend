import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import AppLogo from "../ui/AppLogo";
import UserAvatar from "../ui/UserAvatar";
import client, { endpoints } from "../../api/client";
import Icon from "../common/Icon";
import Flag from "../common/Flag";
import InstallAppButton from "../common/InstallAppButton";
import {
  getAccountTabs,
  getWorkspaceTabs,
  canViewWorkspaceTab,
} from "../../config/dashboardNav";
import { checkWorkspaceCapability } from "../../utils/capabilities";
import { updateMetaThemeColor } from "../../utils/theme";

export default function Navbar() {
  const {
    isAuthenticated,
    user,
    userType,
    logout,
    unreadCount = 0,
    unreadChatCount = 0,
  } = useAuth();
  const { lang, toggleLanguage, t } = useLanguage();
  const location = useLocation();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [wsDropdownOpen, setWsDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [drawerAccountOpen, setDrawerAccountOpen] = useState(false);
  const [drawerWorkspaceOpen, setDrawerWorkspaceOpen] = useState(false);

  const closeMobileDrawer = useCallback(() => {
    if (isClosing) return;
    setIsClosing(true);
    setTimeout(() => {
      setMobileOpen(false);
      setIsClosing(false);
    }, 210);
  }, [isClosing]);
  const [dark, setDark] = useState(() => {
    const stored = localStorage.getItem("saabq_theme");
    return stored
      ? stored === "dark"
      : window.matchMedia("(prefers-color-scheme: dark)").matches;
  });
  const dropdownRef = useRef(null);
  const wsDropdownRef = useRef(null);
  const profileDropdownRef = useRef(null);
  const navigate = useNavigate();

  const [activeSection, setActiveSection] = useState("home");

  const [pendingBookingsCount, setPendingBookingsCount] = useState(0);

  useEffect(() => {
    if (isAuthenticated && userType === "member" && user?.workspace?.id) {
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
  }, [isAuthenticated, userType, user?.workspace?.id, location.pathname]);

  const isOwner = user?.is_owner === true;
  const userPermissions = Array.isArray(user?.permissions)
    ? user.permissions
    : [];

  // Track active section on home page scroll
  useEffect(() => {
    if (location.pathname !== "/") {
      setActiveSection("");
      return;
    }

    const sections = [
      "home",
      "sectors",
      "about",
      "features",
      "how-it-works",
      "pricing",
    ];
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollPos = window.scrollY + 160;
          let current = "home";

          sections.forEach((id) => {
            const el = document.getElementById(id);
            if (el) {
              const top = el.offsetTop;
              if (scrollPos >= top) {
                current = id;
              }
            }
          });
          setActiveSection(current);
          ticking = false;
        });
        ticking = true;
      }
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [location.pathname]);

  // Scroll to hash section if navigated from another page
  useEffect(() => {
    if (location.pathname === "/" && location.hash) {
      const id = location.hash.replace("#", "");
      const el = document.getElementById(id);
      if (el) {
        setTimeout(() => {
          const offsetTop = el.offsetTop - 80;
          window.scrollTo({ top: offsetTop, behavior: "smooth" });
        }, 120);
      }
    }
  }, [location.pathname, location.hash]);

  const handleSectionClick = (sectionId, e) => {
    closeMobileDrawer();
    if (location.pathname === "/") {
      e.preventDefault();
      if (sectionId === "home") {
        window.scrollTo({ top: 0, behavior: "smooth" });
        window.history.pushState(null, "", "/");
        setActiveSection("home");
      } else {
        const el = document.getElementById(sectionId);
        if (el) {
          const offsetTop = el.offsetTop - 80;
          window.scrollTo({ top: offsetTop, behavior: "smooth" });
          window.history.pushState(null, "", `/#${sectionId}`);
          setActiveSection(sectionId);
        }
      }
    }
  };

  // Apply dark mode class and attribute
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    document.documentElement.setAttribute(
      "data-theme",
      dark ? "dark" : "light",
    );
    localStorage.setItem("saabq_theme", dark ? "dark" : "light");
    updateMetaThemeColor(localStorage.getItem("saabq_primary_color"));
  }, [dark]);

  // Lock scroll when mobile drawer is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
      if (wsDropdownRef.current && !wsDropdownRef.current.contains(e.target)) {
        setWsDropdownOpen(false);
      }
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(e.target)
      ) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close dropdowns & mobile drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        if (mobileOpen) closeMobileDrawer();
        setProfileDropdownOpen(false);
        setWsDropdownOpen(false);
        setDropdownOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileOpen, closeMobileDrawer]);

  const handleLogout = async () => {
    setDropdownOpen(false);
    setWsDropdownOpen(false);
    setProfileDropdownOpen(false);
    closeMobileDrawer();
    await logout();
    navigate("/login");
  };

  const userTypeLabel = userType === "member" ? t("teamMember") : t("customer");
  const profilePrefix = userType === "member" ? "/member" : "/customer";

  // Drawer accordions ("حسابي" / "مساحتي") mirror the dashboard sidebars, built
  // from the shared nav config so they stay in sync with the real menus.
  const isWorkspaceActive = user?.workspace?.status === "active";
  const drawerAccountTabs = getAccountTabs(t, userType);
  const drawerWorkspaceTabs = getWorkspaceTabs(t, user?.workspace, lang).filter(
    (tab) => canViewWorkspaceTab(tab, isOwner, userPermissions),
  );

  return (
    <>
      <nav
        className="navbar"
        aria-label={t("mainNavigation") || "Main navigation"}
      >
        <div className="container navbar-inner">
          <Link
            to="/"
            className="navbar-brand"
            onClick={(e) => handleSectionClick("home", e)}
          >
            <AppLogo height={32} />
          </Link>

          {/* Desktop Navigation */}
          <ul className="navbar-nav desktop-nav">
            <li>
              <a
                href="/#home"
                className={
                  location.pathname === "/" &&
                  (isAuthenticated ||
                    !activeSection ||
                    activeSection === "home" ||
                    activeSection === "about")
                    ? "active"
                    : ""
                }
                onClick={(e) => handleSectionClick("home", e)}
              >
                {t("home")}
              </a>
            </li>

            {!isAuthenticated && (
              <>
                <li>
                  <a
                    href="/#sectors"
                    className={
                      location.pathname === "/" && activeSection === "sectors"
                        ? "active"
                        : ""
                    }
                    onClick={(e) => handleSectionClick("sectors", e)}
                  >
                    {t("navSectors")}
                  </a>
                </li>

                <li>
                  <a
                    href="/#features"
                    className={
                      location.pathname === "/" && activeSection === "features"
                        ? "active"
                        : ""
                    }
                    onClick={(e) => handleSectionClick("features", e)}
                  >
                    {t("navFeatures")}
                  </a>
                </li>

                <li>
                  <a
                    href="/#how-it-works"
                    className={
                      location.pathname === "/" &&
                      activeSection === "how-it-works"
                        ? "active"
                        : ""
                    }
                    onClick={(e) => handleSectionClick("how-it-works", e)}
                  >
                    {t("navHowItWorks")}
                  </a>
                </li>

                <li>
                  <a
                    href="/#pricing"
                    className={
                      location.pathname === "/" && activeSection === "pricing"
                        ? "active"
                        : ""
                    }
                    onClick={(e) => handleSectionClick("pricing", e)}
                  >
                    {t("navPricingShort")}
                  </a>
                </li>

                {/* <li>
                  <Link
                    to="/blog"
                    className={location.pathname === "/blog" ? "active" : ""}
                  >
                    {t("navBlog")}
                  </Link>
                </li> */}
              </>
            )}

            <li>
              <Link
                to="/workspaces"
                className={location.pathname === "/workspaces" ? "active" : ""}
              >
                {t("workspaces", "مساحات العمل")}
              </Link>
            </li>

            {isAuthenticated && (
              <li
                className="navbar-dropdown-container"
                ref={profileDropdownRef}
              >
                <button
                  className={`navbar-dropdown-trigger${location.pathname.includes("/profile") ? " active" : ""}`}
                  onClick={() => {
                    if (!profileDropdownOpen)
                      navigate(`${profilePrefix}/profile`);
                    setProfileDropdownOpen(!profileDropdownOpen);
                    setWsDropdownOpen(false);
                  }}
                  aria-expanded={profileDropdownOpen}
                  aria-haspopup="true"
                  aria-label={t("myAccount")}
                >
                  <span>{t("myAccount")}</span>
                  <Icon
                    name="chevron-down"
                    size={14}
                    style={{
                      transition: "transform 0.2s",
                      transform: profileDropdownOpen
                        ? "rotate(180deg)"
                        : "none",
                    }}
                  />
                </button>
                {profileDropdownOpen && (
                  <div className="navbar-dropdown-menu" role="menu">
                    {drawerAccountTabs.map((tab) => (
                      <Link
                        key={tab.id}
                        to={tab.to}
                        role="menuitem"
                        onClick={() => setProfileDropdownOpen(false)}
                      >
                        <Icon name={tab.icon} size={16} />
                        <span>{tab.label}</span>
                        {tab.badge === "unread" && unreadCount > 0 && (
                          <span
                            className="drawer-badge"
                            style={{ marginInlineStart: "auto" }}
                          >
                            {unreadCount > 99 ? "99+" : unreadCount}
                          </span>
                        )}
                        {tab.badge === "chat" && unreadChatCount > 0 && (
                          <span
                            className="drawer-badge"
                            style={{
                              marginInlineStart: "auto",
                              background: "var(--accent)",
                            }}
                          >
                            {unreadChatCount > 99 ? "99+" : unreadChatCount}
                          </span>
                        )}
                      </Link>
                    ))}
                  </div>
                )}
              </li>
            )}

            {isAuthenticated && userType === "member" && (
              <li className="navbar-dropdown-container" ref={wsDropdownRef}>
                <button
                  className={`navbar-dropdown-trigger${location.pathname.includes("/member/workspace") ? " active" : ""}`}
                  onClick={() => {
                    if (!wsDropdownOpen) navigate("/member/workspace");
                    setWsDropdownOpen(!wsDropdownOpen);
                    setProfileDropdownOpen(false);
                  }}
                  aria-expanded={wsDropdownOpen}
                  aria-haspopup="true"
                  aria-label={t("myWorkspace")}
                >
                  <span>{t("myWorkspace")}</span>
                  {pendingBookingsCount > 0 && (
                    <span
                      style={{
                        padding: "2px 7px",
                        borderRadius: 10,
                        fontSize: "0.72rem",
                        fontWeight: 800,
                        background: "#f59e0b",
                        color: "#ffffff",
                        lineHeight: 1,
                        marginInlineStart: 4,
                      }}
                    >
                      {pendingBookingsCount}
                    </span>
                  )}
                  <Icon
                    name="chevron-down"
                    size={14}
                    style={{
                      transition: "transform 0.2s",
                      transform: wsDropdownOpen ? "rotate(180deg)" : "none",
                    }}
                  />
                </button>
                {wsDropdownOpen && (
                  <div className="navbar-dropdown-menu" role="menu">
                    {drawerWorkspaceTabs.map((tab) => {
                      const isCapAllowed =
                        isWorkspaceActive &&
                        checkWorkspaceCapability(user, tab.capability);

                      return (
                        <Link
                          key={tab.id}
                          to={tab.path}
                          role="menuitem"
                          onClick={() => setWsDropdownOpen(false)}
                          style={{
                            opacity: isCapAllowed ? 1 : 0.6,
                          }}
                        >
                          <Icon name={tab.icon} size={16} />
                          <span style={{ flex: 1 }}>{tab.label}</span>
                          {tab.id === "bookings" &&
                            pendingBookingsCount > 0 && (
                              <span
                                style={{
                                  padding: "2px 7px",
                                  borderRadius: 10,
                                  fontSize: "0.72rem",
                                  fontWeight: 800,
                                  background: "#f59e0b",
                                  color: "#ffffff",
                                  lineHeight: 1,
                                  marginInlineStart: 6,
                                }}
                              >
                                {pendingBookingsCount}
                              </span>
                            )}
                          {!isCapAllowed && (
                            <Icon
                              name="lock"
                              size={13}
                              style={{
                                color: "var(--muted)",
                                marginInlineStart: 6,
                              }}
                            />
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </li>
            )}
          </ul>

          <div className="navbar-actions">
            <button
              className="language-toggle-btn"
              onClick={toggleLanguage}
              aria-label="Toggle language"
              title={lang === "ar" ? "Switch to English" : "التحويل للعربية"}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 14px",
                borderRadius: "var(--radius-full)",
                border: "1px solid var(--border)",
                background: "var(--surface)",
                color: "var(--text)",
                cursor: "pointer",
                fontWeight: 700,
                fontSize: "0.82rem",
                transition: "all 0.2s ease",
              }}
            >
              <Flag
                country={lang === "ar" ? "us" : "eg"}
                style={{ width: 18, height: 13 }}
              />
              <span>{lang === "ar" ? "English" : "العربية"}</span>
            </button>

            {/* Dark Mode Toggle */}
            <button
              className="theme-toggle"
              onClick={() => setDark(!dark)}
              aria-label={t("toggleTheme")}
              title={dark ? t("lightMode") : t("darkMode")}
            >
              {dark ? (
                <Icon name="custom-88c16400" />
              ) : (
                <Icon name="custom-ee7b7794" />
              )}
            </button>

            {/* Notification Bell — visible when authenticated */}
            {isAuthenticated && (
              <button
                id="navbar-notification-bell"
                className={`navbar-bell${unreadCount > 0 ? " has-unread" : ""}`}
                aria-label={t("notificationsTab")}
                title={t("notificationsTab")}
                onClick={() => {
                  navigate(`${profilePrefix}/profile?tab=notifications`);
                }}
              >
                {unreadCount > 0 && (
                  <span className="bell-ring-pulse" aria-hidden="true" />
                )}

                <Icon name="bell" className="bell-icon" />

                {unreadCount > 0 && (
                  <span className="navbar-notif-badge">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </button>
            )}

            {/* Support Chat Icon — visible when authenticated */}
            {isAuthenticated && (
              <button
                id="navbar-chat-bell"
                className={`navbar-bell${unreadChatCount > 0 ? " has-unread" : ""}`}
                aria-label={t("chatsTab")}
                title={t("chatsTab")}
                onClick={() => {
                  navigate(`${profilePrefix}/profile?tab=chats`);
                }}
              >
                {unreadChatCount > 0 && (
                  <span className="bell-ring-pulse" aria-hidden="true" />
                )}

                <Icon name="message-square" className="bell-icon" />

                {unreadChatCount > 0 && (
                  <span className="navbar-notif-badge">
                    {unreadChatCount > 99 ? "99+" : unreadChatCount}
                  </span>
                )}
              </button>
            )}

            {isAuthenticated ? (
              <div className="user-dropdown desktop-only" ref={dropdownRef}>
                <button
                  className="navbar-user"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  aria-label={user?.name || "User menu"}
                >
                  <UserAvatar
                    name={
                      user?.name ||
                      `${user?.first_name || ""} ${user?.last_name || ""}`.trim()
                    }
                    avatarUrl={user?.avatar_url || user?.avatar}
                    size={28}
                  />
                  <span className="navbar-user-name">
                    {user?.name ||
                      `${user?.first_name || ""} ${user?.last_name || ""}`.trim()}
                  </span>
                  <Icon
                    name="chevron-down"
                    size={14}
                    style={{
                      transition: "transform 0.2s",
                      transform: dropdownOpen ? "rotate(180deg)" : "none",
                    }}
                  />
                </button>

                {dropdownOpen && (
                  <div className="user-dropdown-menu">
                    <div
                      style={{
                        padding: "8px 14px",
                        fontSize: "0.78rem",
                        color: "var(--muted)",
                      }}
                    >
                      {t("signedInAs")}{" "}
                      <strong style={{ color: "var(--primary)" }}>
                        {userTypeLabel}
                      </strong>
                    </div>
                    <div className="dropdown-divider" />
                    {drawerAccountTabs.map((tab) => (
                      <Link
                        key={tab.id}
                        to={tab.to}
                        onClick={() => setDropdownOpen(false)}
                      >
                        <Icon name={tab.icon} size={16} />
                        <span>{tab.label}</span>
                        {tab.badge === "unread" && unreadCount > 0 && (
                          <span
                            className="drawer-badge"
                            style={{ marginInlineStart: "auto" }}
                          >
                            {unreadCount > 99 ? "99+" : unreadCount}
                          </span>
                        )}
                        {tab.badge === "chat" && unreadChatCount > 0 && (
                          <span
                            className="drawer-badge"
                            style={{
                              marginInlineStart: "auto",
                              background: "var(--accent)",
                            }}
                          >
                            {unreadChatCount > 99 ? "99+" : unreadChatCount}
                          </span>
                        )}
                      </Link>
                    ))}
                    <div className="dropdown-divider" />
                    <button onClick={handleLogout} className="dropdown-danger">
                      <Icon name="custom-0467348d" size={16} />
                      {t("signOut")}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="desktop-only" style={{ display: "flex", gap: 8 }}>
                <Link to="/login" className="btn btn-ghost btn-sm">
                  {t("signIn")}
                </Link>
                <Link to="/register" className="btn btn-primary btn-sm">
                  {t("getStarted")}
                </Link>
              </div>
            )}

            {/* Mobile Hamburger Button */}
            <button
              className="navbar-toggle"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={t("toggleMenu") || "فتح القائمة الرئيسية"}
              aria-expanded={mobileOpen}
              aria-controls="mobile-drawer-dialog"
            >
              <Icon name="custom-4d0dde3d" />
            </button>
          </div>
        </div>
      </nav>

      {/* Modern Mobile Slide-Over Navigation Drawer */}
      {mobileOpen && (
        <div
          className={`mobile-drawer-backdrop${isClosing ? " closing" : ""}`}
          onClick={closeMobileDrawer}
        >
          <div
            id="mobile-drawer-dialog"
            role="dialog"
            aria-modal="true"
            aria-label={t("mainNavigation") || "القائمة الرئيسية"}
            className="mobile-drawer"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="mobile-drawer-header">
              <AppLogo height={28} />
              <button
                className="mobile-drawer-close"
                onClick={closeMobileDrawer}
                aria-label={t("close") || "إغلاق القائمة"}
              >
                <Icon name="x" />
              </button>
            </div>

            {/* User Profile Card inside Drawer (If Authenticated) */}
            {isAuthenticated && user && (
              <div className="mobile-drawer-user-card">
                <UserAvatar
                  name={user.name}
                  avatarUrl={user.avatar_url}
                  size={44}
                />
                <div className="user-details">
                  <span className="user-name">{user.name}</span>
                  <span className="user-email">{user.email}</span>
                  <span className="user-role-badge">{userTypeLabel}</span>
                </div>
              </div>
            )}

            {/* Drawer Navigation Links */}
            <div className="mobile-drawer-content">
              <nav className="mobile-drawer-nav">
                <a
                  href="/#home"
                  className={`mobile-drawer-link${
                    location.pathname === "/" &&
                    (isAuthenticated ||
                      !activeSection ||
                      activeSection === "home")
                      ? " active"
                      : ""
                  }`}
                  onClick={(e) => handleSectionClick("home", e)}
                >
                  <Icon name="custom-5992beed" />
                  <span>{t("home")}</span>
                </a>

                <Link
                  to="/workspaces"
                  className={`mobile-drawer-link${location.pathname === "/workspaces" ? " active" : ""}`}
                >
                  <Icon name="monitor" />
                  <span>{t("workspaces", "مساحات العمل")}</span>
                </Link>

                {!isAuthenticated && (
                  <>
                    <a
                      href="/#sectors"
                      className={`mobile-drawer-link${location.pathname === "/" && activeSection === "sectors" ? " active" : ""}`}
                      onClick={(e) => handleSectionClick("sectors", e)}
                    >
                      <Icon name="briefcase" />
                      <span>{t("navSectors")}</span>
                    </a>

                    <a
                      href="/#about"
                      className={`mobile-drawer-link${location.pathname === "/" && activeSection === "about" ? " active" : ""}`}
                      onClick={(e) => handleSectionClick("about", e)}
                    >
                      <Icon name="custom-34f286e2" />
                      <span>{t("about")}</span>
                    </a>

                    <a
                      href="/#features"
                      className={`mobile-drawer-link${location.pathname === "/" && activeSection === "features" ? " active" : ""}`}
                      onClick={(e) => handleSectionClick("features", e)}
                    >
                      <Icon name="custom-5768860f" />
                      <span>{t("navFeatures")}</span>
                    </a>

                    <a
                      href="/#how-it-works"
                      className={`mobile-drawer-link${location.pathname === "/" && activeSection === "how-it-works" ? " active" : ""}`}
                      onClick={(e) => handleSectionClick("how-it-works", e)}
                    >
                      <Icon name="custom-bd500d73" />
                      <span>{t("navHowItWorks")}</span>
                    </a>

                    <a
                      href="/#pricing"
                      className={`mobile-drawer-link${location.pathname === "/" && activeSection === "pricing" ? " active" : ""}`}
                      onClick={(e) => handleSectionClick("pricing", e)}
                    >
                      <Icon name="credit-card" />
                      <span>{t("navPricing")}</span>
                    </a>

                    <Link
                      to="/blog"
                      className={`mobile-drawer-link${location.pathname === "/blog" ? " active" : ""}`}
                    >
                      <Icon name="book-open" />
                      <span>{t("navBlog")}</span>
                    </Link>
                  </>
                )}

                {isAuthenticated && (
                  <>
                    {/* حسابي — navigates to the profile and reveals its pages */}
                    <button
                      type="button"
                      className={`mobile-drawer-link drawer-accordion-head${
                        location.pathname.includes("/profile") ? " active" : ""
                      }${drawerAccountOpen ? " open" : ""}`}
                      aria-expanded={drawerAccountOpen}
                      onClick={() => {
                        if (!drawerAccountOpen)
                          navigate(`${profilePrefix}/profile`);
                        setDrawerAccountOpen((v) => !v);
                      }}
                    >
                      <Icon name="user" />
                      <span>{t("myAccount")}</span>
                      <Icon
                        name="chevron-down"
                        size={16}
                        className="drawer-accordion-chevron"
                      />
                    </button>
                    {drawerAccountOpen && (
                      <div className="drawer-subnav">
                        {drawerAccountTabs.map((tab) => (
                          <Link
                            key={tab.id}
                            to={tab.to}
                            className="mobile-drawer-link drawer-sublink"
                            onClick={closeMobileDrawer}
                          >
                            <Icon name={tab.icon} />
                            <span>{tab.label}</span>
                            {tab.badge === "unread" && unreadCount > 0 && (
                              <span className="drawer-badge">
                                {unreadCount > 99 ? "99+" : unreadCount}
                              </span>
                            )}
                            {tab.badge === "chat" && unreadChatCount > 0 && (
                              <span className="drawer-badge primary">
                                {unreadChatCount > 99 ? "99+" : unreadChatCount}
                              </span>
                            )}
                          </Link>
                        ))}
                      </div>
                    )}

                    {/* مساحتي — navigates to the workspace and reveals its pages */}
                    {userType === "member" && (
                      <>
                        <button
                          type="button"
                          className={`mobile-drawer-link drawer-accordion-head${
                            location.pathname.startsWith("/member/workspace")
                              ? " active"
                              : ""
                          }${drawerWorkspaceOpen ? " open" : ""}`}
                          aria-expanded={drawerWorkspaceOpen}
                          onClick={() => {
                            if (!drawerWorkspaceOpen)
                              navigate("/member/workspace");
                            setDrawerWorkspaceOpen((v) => !v);
                          }}
                        >
                          <Icon name="briefcase" />
                          <span>{t("myWorkspace")}</span>
                          <Icon
                            name="chevron-down"
                            size={16}
                            className="drawer-accordion-chevron"
                          />
                        </button>
                        {drawerWorkspaceOpen && (
                          <div className="drawer-subnav">
                            {drawerWorkspaceTabs.map((tab) => {
                              const enabled =
                                isWorkspaceActive &&
                                checkWorkspaceCapability(user, tab.capability);
                              if (!enabled) {
                                return (
                                  <span
                                    key={tab.id}
                                    className="mobile-drawer-link drawer-sublink drawer-sublink-disabled"
                                    aria-disabled="true"
                                  >
                                    <Icon name={tab.icon} />
                                    <span>{tab.label}</span>
                                    <Icon name="lock" size={13} />
                                  </span>
                                );
                              }
                              return (
                                <NavLink
                                  key={tab.id}
                                  to={tab.path}
                                  end={tab.end}
                                  className={({ isActive }) =>
                                    `mobile-drawer-link drawer-sublink${
                                      isActive ? " active" : ""
                                    }`
                                  }
                                  onClick={closeMobileDrawer}
                                >
                                  <Icon name={tab.icon} />
                                  <span style={{ flex: 1 }}>{tab.label}</span>
                                  {tab.id === "bookings" &&
                                    pendingBookingsCount > 0 && (
                                      <span
                                        style={{
                                          marginInlineStart: "auto",
                                          padding: "2px 7px",
                                          borderRadius: 10,
                                          fontSize: "0.72rem",
                                          fontWeight: 800,
                                          background: "#f59e0b",
                                          color: "#ffffff",
                                          lineHeight: 1,
                                        }}
                                      >
                                        {pendingBookingsCount}
                                      </span>
                                    )}
                                </NavLink>
                              );
                            })}
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}
              </nav>
            </div>

            {/* Drawer Footer: Controls & Actions */}
            <div className="mobile-drawer-footer">
              <InstallAppButton
                style={{
                  width: "100%",
                  marginBottom: 12,
                  justifyContent: "center",
                }}
              />

              <div className="drawer-controls">
                <button
                  className="drawer-control-btn"
                  onClick={toggleLanguage}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <Flag
                    country={lang === "ar" ? "us" : "eg"}
                    style={{ width: 18, height: 13 }}
                  />
                  <span>{lang === "ar" ? "English" : "التحويل للعربية"}</span>
                </button>

                <button
                  className="drawer-control-btn"
                  onClick={() => setDark(!dark)}
                >
                  {dark ? (
                    <>
                      <Icon name="custom-45090ebb" size={18} />
                      <span>{t("lightMode")}</span>
                    </>
                  ) : (
                    <>
                      <Icon name="custom-c5344787" size={18} />
                      <span>{t("darkMode")}</span>
                    </>
                  )}
                </button>
              </div>

              {isAuthenticated ? (
                <button className="mobile-drawer-logout" onClick={handleLogout}>
                  <Icon name="custom-0467348d" size={18} />
                  <span>{t("signOut")}</span>
                </button>
              ) : (
                <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                  <Link
                    to="/login"
                    className="btn btn-secondary"
                    style={{ flex: 1 }}
                    onClick={closeMobileDrawer}
                  >
                    {t("signIn")}
                  </Link>
                  <Link
                    to="/register"
                    className="btn btn-primary"
                    style={{ flex: 1 }}
                    onClick={closeMobileDrawer}
                  >
                    {t("getStarted")}
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
