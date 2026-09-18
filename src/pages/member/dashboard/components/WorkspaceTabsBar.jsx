import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../../../context/AuthContext";
import { useLanguage } from "../../../../context/LanguageContext";
import {
  getWorkspaceTabs,
  canViewWorkspaceTab,
  getWorkspaceSettingsSubTabs,
} from "../../../../config/dashboardNav";
import { checkWorkspaceCapability } from "../../../../utils/capabilities";

export default function WorkspaceTabsBar() {
  const { user } = useAuth();
  const { t, lang, isRTL } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();

  const workspace = user?.workspace;
  const workspaceId = workspace?.id || "default";
  const userId = user?.id || "guest";
  const isOwner = user?.is_owner === true;
  const userPermissions = Array.isArray(user?.permissions)
    ? user.permissions
    : [];
  const isWorkspaceActive = workspace?.status === "active";

  // Build dictionary of all accessible tabs and sub-tabs for this member
  const tabsDict = useMemo(() => {
    const dict = {};

    // Main workspace tabs
    const mainTabs = getWorkspaceTabs(t, workspace, lang);
    mainTabs.forEach((tab) => {
      const isAllowed =
        canViewWorkspaceTab(tab, isOwner, userPermissions, user) &&
        (!tab.capability || (isWorkspaceActive && checkWorkspaceCapability(user, tab.capability)));

      if (isAllowed) {
        dict[tab.id] = {
          id: tab.id,
          label: tab.label,
          path: tab.path,
          icon: tab.icon || "layers",
        };
      }
    });

    // Settings sub-tabs
    const settingsAllowed =
      canViewWorkspaceTab(
        { id: "settings", permissions: ["settings_read", "settings_update", "settings_write"] },
        isOwner,
        userPermissions,
        user
      );

    if (settingsAllowed) {
      const subTabs = getWorkspaceSettingsSubTabs(t);
      const subIcons = {
        basic: "info",
        branding: "image",
        timezone: "clock",
        social: "share",
        form_fields: "clipboard-list",
        payment: "credit-card",
        notifications: "bell",
        templates: "copy",
      };

      subTabs.forEach((sub) => {
        const key = `settings_${sub.id}`;
        dict[key] = {
          id: key,
          label: sub.label,
          path: `/member/workspace/settings?sub=${sub.id}`,
          icon: subIcons[sub.id] || "settings",
        };
      });
    }

    return dict;
  }, [t, workspace, lang, user, isOwner, userPermissions, isWorkspaceActive]);

  // Determine current active tab key based on location
  const getCurrentTabKey = useCallback(() => {
    const pathname = location.pathname;
    if (pathname === "/member/workspace" || pathname === "/member/workspace/") {
      return "home";
    }
    if (pathname.startsWith("/member/workspace/settings")) {
      const params = new URLSearchParams(location.search);
      const sub = params.get("sub") || "basic";
      return `settings_${sub}`;
    }
    const parts = pathname.split("/");
    // e.g. /member/workspace/bookings -> bookings
    if (parts.length >= 4 && parts[2] === "workspace") {
      return parts[3];
    }
    return "home";
  }, [location.pathname, location.search]);

  const currentKey = getCurrentTabKey();

  // Storage keys
  const tabsStorageKey = `saabq_member_ws_${workspaceId}_${userId}_tabs`;
  const favsStorageKey = `saabq_member_ws_${workspaceId}_${userId}_favorites`;

  // State: opened tabs & favorites
  const [openedTabs, setOpenedTabs] = useState(() => {
    try {
      const saved = localStorage.getItem(tabsStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // ignore JSON error
    }
    return [];
  });

  const [favorites, setFavorites] = useState(() => {
    try {
      const saved = localStorage.getItem(favsStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch {
      // ignore JSON error
    }
    return [];
  });

  const [favoritesOpen, setFavoritesOpen] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const sliderRef = useRef(null);
  const favoritesMenuRef = useRef(null);
  const actionsMenuRef = useRef(null);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftStartRef = useRef(0);
  const didDragMoveRef = useRef(false);

  // Close menus on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (favoritesMenuRef.current && !favoritesMenuRef.current.contains(e.target)) {
        setFavoritesOpen(false);
      }
      if (actionsMenuRef.current && !actionsMenuRef.current.contains(e.target)) {
        setActionsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Save tabs to localStorage
  const saveTabs = useCallback(
    (tabs) => {
      try {
        localStorage.setItem(tabsStorageKey, JSON.stringify(tabs));
      } catch {}
    },
    [tabsStorageKey]
  );

  // Save favorites to localStorage
  const saveFavorites = useCallback(
    (favs) => {
      try {
        localStorage.setItem(favsStorageKey, JSON.stringify(favs));
      } catch {}
    },
    [favsStorageKey]
  );

  // Synchronize openedTabs with current route & permissions
  useEffect(() => {
    const activeMeta = tabsDict[currentKey] || {
      id: currentKey,
      label: currentKey,
      path: location.pathname + location.search,
      icon: "layers",
    };

    setOpenedTabs((prev) => {
      // Filter out tabs the member no longer has access to, keeping home
      const validTabs = prev.filter((t) => t.id === "home" || tabsDict[t.id]);
      const exists = validTabs.some((t) => t.id === activeMeta.id);
      let updated;
      if (!exists) {
        updated = [...validTabs, activeMeta];
      } else {
        // Update label or path if changed (e.g. language toggle)
        updated = validTabs.map((t) => (t.id === activeMeta.id ? { ...t, ...activeMeta } : t));
      }
      saveTabs(updated);
      return updated;
    });
  }, [currentKey, tabsDict, location.pathname, location.search, saveTabs]);

  // Update overflow scroll indicator
  const updateScroll = useCallback(() => {
    const el = sliderRef.current;
    if (!el) return;
    const scrollLeft = Math.abs(el.scrollLeft);
    const maxScroll = el.scrollWidth - el.clientWidth;
    setCanScrollLeft(scrollLeft > 4);
    setCanScrollRight(scrollLeft < maxScroll - 4);
  }, []);

  // Scroll active tab into view
  const scrollToActive = useCallback(() => {
    const el = sliderRef.current;
    if (!el) return;
    const activeEl = el.querySelector(".tab-bar-item-active");
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
    setTimeout(updateScroll, 200);
  }, [updateScroll]);

  useEffect(() => {
    scrollToActive();
  }, [currentKey, scrollToActive]);

  useEffect(() => {
    updateScroll();
    window.addEventListener("resize", updateScroll);
    return () => window.removeEventListener("resize", updateScroll);
  }, [updateScroll, openedTabs.length]);

  // Navigation action
  const handleOpenTab = (item) => {
    if (didDragMoveRef.current) return;
    navigate(item.path);
  };

  // Close single tab
  const handleCloseTab = (id, e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    const index = openedTabs.findIndex((t) => t.id === id);
    if (index === -1) return;

    const remaining = openedTabs.filter((t) => t.id !== id);

    if (remaining.length === 0) {
      const homeMeta = tabsDict["home"] || {
        id: "home",
        label: t("home") || "الرئيسية",
        path: "/member/workspace",
        icon: "home",
      };
      setOpenedTabs([homeMeta]);
      saveTabs([homeMeta]);
      navigate(homeMeta.path);
      return;
    }

    setOpenedTabs(remaining);
    saveTabs(remaining);

    // If currently on the closed tab, switch to adjacent
    if (id === currentKey) {
      const nextIndex = Math.min(index, remaining.length - 1);
      navigate(remaining[nextIndex].path);
    }
  };

  // Close other tabs
  const handleCloseOtherTabs = () => {
    const activeMeta = tabsDict[currentKey] || openedTabs.find((t) => t.id === currentKey);
    const updated = activeMeta ? [activeMeta] : [];
    setOpenedTabs(updated);
    saveTabs(updated);
    setActionsOpen(false);
  };

  // Clear all tabs (reset to Home)
  const handleClearAllTabs = () => {
    const homeMeta = tabsDict["home"] || {
      id: "home",
      label: t("home") || "الرئيسية",
      path: "/member/workspace",
      icon: "home",
    };
    setOpenedTabs([homeMeta]);
    saveTabs([homeMeta]);
    setActionsOpen(false);
    navigate(homeMeta.path);
  };

  // Favorite toggle
  const isFavorite = (id) => favorites.some((f) => f.id === id);

  const handleToggleFavorite = (item, e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setFavorites((prev) => {
      const exists = prev.some((f) => f.id === item.id);
      let updated;
      if (exists) {
        updated = prev.filter((f) => f.id !== item.id);
      } else {
        updated = [
          ...prev,
          {
            id: item.id,
            label: item.label,
            path: item.path,
            icon: item.icon,
          },
        ];
      }
      saveFavorites(updated);
      return updated;
    });
  };

  // Drag-to-scroll handlers
  const onMouseDown = (e) => {
    const el = sliderRef.current;
    if (!el) return;
    isDraggingRef.current = true;
    didDragMoveRef.current = false;
    startXRef.current = e.pageX - el.offsetLeft;
    scrollLeftStartRef.current = el.scrollLeft;
  };

  const onMouseMove = (e) => {
    if (!isDraggingRef.current) return;
    const el = sliderRef.current;
    if (!el) return;
    const x = e.pageX - el.offsetLeft;
    const walk = (x - startXRef.current) * 1.4;
    if (Math.abs(walk) > 4) {
      didDragMoveRef.current = true;
    }
    el.scrollLeft = scrollLeftStartRef.current - walk;
    updateScroll();
  };

  const onMouseUpOrLeave = () => {
    isDraggingRef.current = false;
    setTimeout(() => {
      didDragMoveRef.current = false;
    }, 50);
  };

  const onWheel = (e) => {
    const el = sliderRef.current;
    if (!el) return;
    const delta = e.deltaY || e.deltaX;
    el.scrollLeft += delta;
    updateScroll();
  };

  const scrollByArrow = (direction) => {
    const el = sliderRef.current;
    if (!el) return;
    const distance = 220;
    const scrollAmount =
      direction === "left"
        ? isRTL ? distance : -distance
        : isRTL ? -distance : distance;

    el.scrollBy({ left: scrollAmount, behavior: "smooth" });
    setTimeout(updateScroll, 250);
  };

  return (
    <div className="member-workspace-tabs-bar" aria-label={t("favoritePages") || "شريط التبويبات والمفضلة"}>
      {/* 1. Favorites Dropdown Button */}
      <div className="tabs-bar-favorites-wrapper" ref={favoritesMenuRef}>
        <button
          type="button"
          className={`tabs-bar-fav-btn ${favorites.length > 0 ? "has-favorites" : ""}`}
          onClick={() => setFavoritesOpen((prev) => !prev)}
          title={t("favorites") || "المفضلة"}
          aria-expanded={favoritesOpen}
        >
          <svg
            className={`fav-star-icon ${favorites.length > 0 ? "filled" : ""}`}
            viewBox="0 0 24 24"
            width="15"
            height="15"
            stroke="currentColor"
            strokeWidth="2"
            fill={favorites.length > 0 ? "currentColor" : "none"}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
            />
          </svg>
          <span className="fav-btn-label">{t("favorites") || "المفضلة"}</span>
          {favorites.length > 0 && (
            <span className="fav-count-badge">{favorites.length}</span>
          )}
          <svg
            className={`fav-chevron-icon ${favoritesOpen ? "rotate" : ""}`}
            viewBox="0 0 24 24"
            width="12"
            height="12"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {/* Favorites Dropdown Menu */}
        {favoritesOpen && (
          <div className="tabs-bar-dropdown-menu favorites-dropdown">
            <div className="dropdown-menu-header">
              <div className="dropdown-header-title">
                <svg
                  viewBox="0 0 24 24"
                  width="15"
                  height="15"
                  className="dropdown-title-star"
                  fill="currentColor"
                >
                  <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                </svg>
                <span>{t("favoritePages") || "الصفحات المفضلة"}</span>
              </div>
              <span className="dropdown-header-badge">
                {favorites.length} {t("starred") || "مثبتة"}
              </span>
            </div>

            <div className="dropdown-items-list">
              {favorites.length > 0 ? (
                favorites.map((fav) => (
                  <div
                    key={fav.id}
                    className="dropdown-fav-item"
                    onClick={() => {
                      navigate(fav.path);
                      setFavoritesOpen(false);
                    }}
                  >
                    <span className="fav-item-label">{fav.label}</span>
                    <button
                      type="button"
                      className="fav-item-remove-btn"
                      onClick={(e) => handleToggleFavorite(fav, e)}
                      title={t("removeFromFavorites") || "إزالة من المفضلة"}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        width="13"
                        height="13"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                ))
              ) : (
                <div className="dropdown-empty-state">
                  <svg
                    viewBox="0 0 24 24"
                    width="26"
                    height="26"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    className="empty-star-icon"
                  >
                    <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                  </svg>
                  <p>{t("noFavoritesYet") || "لم تقم بإضافة أي صفحات للمفضلة بعد. انقر على أيقونة النجمة لتثبيت الصفحات هنا!"}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="tabs-bar-divider" />

      {/* 2. Scroll Left/Prev Button */}
      {canScrollLeft && (
        <button
          type="button"
          className="tabs-bar-scroll-arrow arrow-prev"
          onClick={() => scrollByArrow("left")}
          aria-label="Scroll left"
        >
          <svg
            viewBox="0 0 24 24"
            width="13"
            height="13"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            style={{ transform: isRTL ? "rotate(180deg)" : "none" }}
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
      )}

      {/* 3. Opened Tabs Horizontal Scroll List */}
      <div
        className="tabs-bar-slider-track"
        ref={sliderRef}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUpOrLeave}
        onMouseLeave={onMouseUpOrLeave}
        onWheel={onWheel}
      >
        {openedTabs.map((item) => {
          const isActive = currentKey === item.id;
          const isStarred = isFavorite(item.id);

          return (
            <div
              key={item.id}
              className={`tabs-bar-item ${isActive ? "tab-bar-item-active" : ""}`}
              onClick={() => handleOpenTab(item)}
              title={item.label}
            >
              <span className="tab-item-title">{item.label}</span>

              {/* Star / Favorite Button */}
              <button
                type="button"
                className={`tab-star-btn ${isStarred ? "starred" : ""}`}
                onClick={(e) => handleToggleFavorite(item, e)}
                title={
                  isStarred
                    ? t("removeFromFavorites") || "إزالة من المفضلة"
                    : t("addToFavorites") || "إضافة للمفضلة"
                }
              >
                <svg
                  viewBox="0 0 24 24"
                  width="13"
                  height="13"
                  fill={isStarred ? "currentColor" : "none"}
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                  />
                </svg>
              </button>

              {/* Close Tab Button */}
              <button
                type="button"
                className="tab-close-btn"
                onClick={(e) => handleCloseTab(item.id, e)}
                title={t("closeTab") || "إغلاق التبويب"}
              >
                <svg
                  viewBox="0 0 24 24"
                  width="11"
                  height="11"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          );
        })}
      </div>

      {/* 4. Scroll Right/Next Button */}
      {canScrollRight && (
        <button
          type="button"
          className="tabs-bar-scroll-arrow arrow-next"
          onClick={() => scrollByArrow("right")}
          aria-label="Scroll right"
        >
          <svg
            viewBox="0 0 24 24"
            width="13"
            height="13"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            style={{ transform: isRTL ? "rotate(180deg)" : "none" }}
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      )}

      <div className="tabs-bar-divider" />

      {/* 5. Quick Actions Dropdown (Close Others / Clear All) */}
      <div className="tabs-bar-actions-wrapper" ref={actionsMenuRef}>
        <button
          type="button"
          className="tabs-bar-actions-btn"
          onClick={() => setActionsOpen((prev) => !prev)}
          title={t("closeOtherTabs") || "خيارات التبويبات"}
          aria-expanded={actionsOpen}
        >
          <svg
            viewBox="0 0 24 24"
            width="15"
            height="15"
            fill="currentColor"
          >
            <circle cx="12" cy="5" r="1.75" />
            <circle cx="12" cy="12" r="1.75" />
            <circle cx="12" cy="19" r="1.75" />
          </svg>
        </button>

        {actionsOpen && (
          <div className="tabs-bar-dropdown-menu actions-dropdown">
            <button
              type="button"
              className="actions-menu-item"
              onClick={handleCloseOtherTabs}
            >
              <svg
                viewBox="0 0 24 24"
                width="14"
                height="14"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
              </svg>
              <span>{t("closeOtherTabs") || "إغلاق التبويبات الأخرى"}</span>
            </button>

            <button
              type="button"
              className="actions-menu-item danger"
              onClick={handleClearAllTabs}
            >
              <svg
                viewBox="0 0 24 24"
                width="14"
                height="14"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
              <span>{t("clearAllTabs") || "إغلاق الكل"}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
