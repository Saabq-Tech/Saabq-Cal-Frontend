import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../../context/LanguageContext";
import { useToast } from "../../context/ToastContext";
import { useAuth } from "../../context/AuthContext";
import client, { endpoints } from "../../api/client";
import Icon from "../common/Icon";
import SEO from "../ui/SEO";

/* ---------------------------------------------------------------
   Helpers
--------------------------------------------------------------- */
function resolveActionUrl(url, userType) {
  if (!url) return null;

  // If URL contains /b/ or points to legacy /b/:id
  if (url.includes("/b/")) {
    return userType === "member"
      ? "/member/workspace/bookings"
      : "/customer/profile?tab=appointments";
  }

  try {
    if (url.startsWith("http://") || url.startsWith("https://")) {
      const parsed = new URL(url);
      if (
        parsed.pathname.startsWith("/member") ||
        parsed.pathname.startsWith("/workspace")
      ) {
        return parsed.pathname + parsed.search;
      }
      if (
        parsed.pathname.startsWith("/customer") ||
        parsed.pathname.startsWith("/profile") ||
        parsed.pathname.startsWith("/my-appointments")
      ) {
        return parsed.pathname + parsed.search;
      }
      if (parsed.pathname.startsWith("/b/")) {
        return userType === "member"
          ? "/member/workspace/bookings"
          : "/customer/profile?tab=appointments";
      }
      return url;
    }
  } catch {
    // fallback to original url
  }

  return url;
}

function relativeTime(isoString, t) {
  if (!isoString) return "";
  const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
  if (diff < 60) return t("justNow");
  if (diff < 3600) return `${Math.floor(diff / 60)} ${t("minutesAgo")}`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ${t("hoursAgo")}`;
  return `${Math.floor(diff / 86400)} ${t("daysAgo")}`;
}

/* ---------------------------------------------------------------
   Skeleton loader
--------------------------------------------------------------- */
function SkeletonItem() {
  return (
    <div className="notif-skeleton">
      <div
        className="skel-header"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          width: "100%",
        }}
      >
        <div className="skel-circle" />
        <div className="skel-line" style={{ width: "45%", height: 16 }} />
      </div>
      <div className="skel-lines" style={{ marginTop: 8, width: "100%" }}>
        <div className="skel-line" style={{ width: "95%" }} />
        <div className="skel-line" style={{ width: "80%" }} />
        <div className="skel-line" style={{ width: "35%" }} />
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------
   Clear-All confirmation modal
--------------------------------------------------------------- */
function ClearConfirmModal({ onConfirm, onCancel, t }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onCancel]);

  return createPortal(
    <div className="notif-confirm-overlay" onClick={onCancel}>
      <div
        className="notif-confirm-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="clear-notif-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              background: "rgba(239,68,68,0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Icon name="trash" size={22} />
          </div>
          <h3
            id="clear-notif-modal-title"
            style={{
              fontSize: "1rem",
              fontWeight: 700,
              color: "var(--text)",
              margin: 0,
            }}
          >
            {t("confirmClearTitle")}
          </h3>
        </div>
        <p
          style={{
            fontSize: "0.88rem",
            color: "var(--text-secondary)",
            lineHeight: 1.6,
            marginBottom: 24,
          }}
        >
          {t("confirmClearBody")}
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button className="btn btn-ghost btn-sm" onClick={onCancel}>
            {t("cancel")}
          </button>
          <button
            className="btn btn-sm"
            style={{ background: "#ef4444", color: "#fff", border: "none" }}
            onClick={onConfirm}
          >
            {t("clearAllNotifs")}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

/* ---------------------------------------------------------------
   Single notification item
--------------------------------------------------------------- */
function NotificationItem({
  notif,
  index,
  onMarkRead,
  onDelete,
  t,
  userType,
  navigate,
}) {
  const isUnread = !notif.read_at;
  const rawUrl = notif.data?.action_url;
  const resolvedUrl = resolveActionUrl(rawUrl, userType);
  const isInternal =
    resolvedUrl &&
    (resolvedUrl.startsWith("/") || !resolvedUrl.startsWith("http"));

  const handleCardClick = () => {
    if (isUnread) {
      onMarkRead(notif.id);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleCardClick();
    }
  };

  const handleActionClick = (e) => {
    e.stopPropagation();
    if (isUnread) onMarkRead(notif.id);
    if (!resolvedUrl) return;

    if (isInternal) {
      navigate(resolvedUrl);
    } else {
      window.open(resolvedUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div
      role={isUnread ? "button" : "article"}
      tabIndex={isUnread ? 0 : undefined}
      aria-label={notif.title || "إشعار"}
      className={`notification-item${isUnread ? " unread" : ""} animate-fade-in-up`}
      style={{
        animationDelay: `${index * 0.05}s`,
        cursor: isUnread ? "pointer" : "default",
      }}
      onClick={handleCardClick}
      onKeyDown={isUnread ? handleKeyDown : undefined}
    >
      <div className="notif-item-header">
        <div className={`notif-dot-icon${isUnread ? "" : " read"}`}>
          <Icon name="bell" size={18} />
        </div>
        {notif.title && <div className="notif-title">{notif.title}</div>}
      </div>

      <div className="notif-content">
        {notif.body && <div className="notif-body">{notif.body}</div>}
        <div className="notif-meta">
          <span className="notif-time">
            {relativeTime(notif.created_at, t)}
          </span>
          {isUnread && (
            <span className="notif-unread-pill">
              <Icon name="custom-217c0348" size={6} />
              {t("unreadBadge")}
            </span>
          )}
        </div>

        <div
          className="notification-item-actions"
          onClick={(e) => e.stopPropagation()}
        >
          {resolvedUrl && (
            <button
              type="button"
              className="notif-action-btn primary-action"
              title={notif.data?.action_text || t("view")}
              onClick={handleActionClick}
            >
              <Icon name="link" size={13} />
              <span>{notif.data?.action_text || t("view")}</span>
            </button>
          )}
          {isUnread && (
            <button
              type="button"
              className="notif-action-btn read-action"
              title={t("markAsRead")}
              aria-label={t("markAsRead")}
              onClick={(e) => {
                e.stopPropagation();
                onMarkRead(notif.id);
              }}
            >
              <Icon name="check" size={14} />
              <span>{t("markAsRead") || "تحديد كمقروء"}</span>
            </button>
          )}
          <button
            type="button"
            className="notif-action-btn delete-action"
            title={t("delete")}
            aria-label={t("delete")}
            onClick={(e) => {
              e.stopPropagation();
              onDelete(notif.id);
            }}
          >
            <Icon name="trash" size={13} />
            <span>{t("delete") || "حذف"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------
   Main component
--------------------------------------------------------------- */
export default function NotificationsPage() {
  const { t } = useLanguage();
  const toast = useToast();
  const {
    userType,
    unreadCount = 0,
    setUnreadCount,
    refreshUnreadCounts,
  } = useAuth();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    total: 0,
  });
  const [filter, setFilter] = useState("all");
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [busyIds, setBusyIds] = useState(new Set());

  useEffect(() => {
    document.title = t("pageTitleNotifications");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchNotifications = useCallback(
    async (page = 1, append = false) => {
      if (append) setLoadingMore(true);
      else setLoading(true);
      try {
        const res = await client.get(endpoints.notifications, {
          params: { per_page: 15, page },
        });
        const data = res.data.data;
        const meta = res.data;
        setNotifications((prev) =>
          append ? [...prev, ...data.notifications] : data.notifications,
        );
        if (
          typeof setUnreadCount === "function" &&
          typeof data.unread_count === "number"
        ) {
          setUnreadCount(data.unread_count);
        }
        setPagination({
          current_page: meta.current_page ?? 1,
          last_page: meta.last_page ?? 1,
          has_more: (meta.current_page ?? 1) < (meta.last_page ?? 1),
        });
      } catch {
        toast.error(t("failedToLoadNotifications"));
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [toast, t, setUnreadCount],
  );

  useEffect(() => {
    fetchNotifications(1, false);
  }, [fetchNotifications]);

  const handleMarkRead = useCallback(
    async (id) => {
      const target = notifications.find((n) => n.id === id);
      if (!target || target.read_at) return;

      // 1. Optimistic update: mark as read immediately in list
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === id
            ? { ...n, read_at: n.read_at || new Date().toISOString() }
            : n,
        ),
      );

      // 2. Optimistic update: immediately update bell count in navbar and global state (0ms)
      if (typeof setUnreadCount === "function") {
        setUnreadCount((c) => Math.max(0, c - 1));
      }

      setBusyIds((s) => new Set(s).add(id));
      try {
        const res = await client.post(endpoints.notificationMarkRead(id));
        if (
          typeof res.data?.data?.unread_count === "number" &&
          typeof setUnreadCount === "function"
        ) {
          setUnreadCount(res.data.data.unread_count);
        }
        toast.success(t("notifMarkedRead"));
      } catch {
        // Rollback on failure
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === id ? { ...n, read_at: target.read_at } : n,
          ),
        );
        if (typeof refreshUnreadCounts === "function") {
          refreshUnreadCounts(true);
        }
        toast.error(t("notifLoadFailed"));
      } finally {
        setBusyIds((s) => {
          const ns = new Set(s);
          ns.delete(id);
          return ns;
        });
      }
    },
    [notifications, t, toast, setUnreadCount, refreshUnreadCounts],
  );

  const handleMarkAllRead = useCallback(async () => {
    if (unreadCount === 0) return;

    const previousNotifications = notifications;
    const nowIso = new Date().toISOString();

    // 1. Optimistic update: mark all items as read in list immediately
    setNotifications((prev) =>
      prev.map((n) => ({
        ...n,
        read_at: n.read_at || nowIso,
      })),
    );

    // 2. Optimistic update: reset bell count to 0 in navbar and global state immediately (0ms)
    if (typeof setUnreadCount === "function") {
      setUnreadCount(0);
    }

    try {
      const res = await client.post(endpoints.notificationsMarkAllRead);
      if (
        typeof res.data?.data?.unread_count === "number" &&
        typeof setUnreadCount === "function"
      ) {
        setUnreadCount(res.data.data.unread_count);
      }
      toast.success(t("allNotifsMarkedRead"));
    } catch {
      // Rollback on failure
      setNotifications(previousNotifications);
      if (typeof refreshUnreadCounts === "function") {
        refreshUnreadCounts(true);
      }
      toast.error(t("notifLoadFailed"));
    }
  }, [
    unreadCount,
    notifications,
    t,
    toast,
    setUnreadCount,
    refreshUnreadCounts,
  ]);

  const handleDelete = useCallback(
    async (id) => {
      const target = notifications.find((n) => n.id === id);
      const wasUnread = target && !target.read_at;

      // Optimistic delete
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      if (wasUnread && typeof setUnreadCount === "function") {
        setUnreadCount((c) => Math.max(0, c - 1));
      }

      setBusyIds((s) => new Set(s).add(id));
      try {
        const res = await client.delete(endpoints.notificationDelete(id));
        if (
          typeof res.data?.data?.unread_count === "number" &&
          typeof setUnreadCount === "function"
        ) {
          setUnreadCount(res.data.data.unread_count);
        }
        toast.success(t("notifDeletedSuccess"));
      } catch {
        if (target) {
          setNotifications((prev) => [target, ...prev]);
        }
        if (typeof refreshUnreadCounts === "function") {
          refreshUnreadCounts(true);
        }
        toast.error(t("notifLoadFailed"));
      } finally {
        setBusyIds((s) => {
          const ns = new Set(s);
          ns.delete(id);
          return ns;
        });
      }
    },
    [notifications, t, toast, setUnreadCount, refreshUnreadCounts],
  );

  const handleClearAll = useCallback(async () => {
    setShowClearConfirm(false);
    const previousNotifications = notifications;

    setNotifications([]);
    if (typeof setUnreadCount === "function") {
      setUnreadCount(0);
    }
    setPagination({ current_page: 1, last_page: 1, total: 0 });

    try {
      const res = await client.delete(endpoints.notificationsClear);
      if (
        typeof res.data?.data?.unread_count === "number" &&
        typeof setUnreadCount === "function"
      ) {
        setUnreadCount(res.data.data.unread_count);
      }
      toast.success(t("allNotifsCleared"));
    } catch {
      setNotifications(previousNotifications);
      if (typeof refreshUnreadCounts === "function") {
        refreshUnreadCounts(true);
      }
      toast.error(t("notifLoadFailed"));
    }
  }, [notifications, t, toast, setUnreadCount, refreshUnreadCounts]);

  const handleLoadMore = () => {
    if (pagination.current_page < pagination.last_page) {
      fetchNotifications(pagination.current_page + 1, true);
    }
  };

  const filtered = notifications.filter((n) => {
    if (filter === "unread") return !n.read_at;
    if (filter === "read") return !!n.read_at;
    return true;
  });

  const readCount = notifications.filter((n) => n.read_at).length;
  const totalAll = notifications.length;
  const canMarkAll = unreadCount > 0;
  const canClear = notifications.length > 0;
  const hasMore = pagination.current_page < pagination.last_page;

  return (
    <>
      {showClearConfirm && (
        <ClearConfirmModal
          t={t}
          onConfirm={handleClearAll}
          onCancel={() => setShowClearConfirm(false)}
        />
      )}

      <div className="card animate-fade-in-up">
        <SEO pageKey="notifications" />
        <div
          className="card-header notif-header"
          style={{
            borderBottom: "1px solid var(--border-light)",
            paddingBottom: 16,
          }}
        >
          <div style={{ flex: 1 }}>
            <h2 className="card-title">{t("notificationsInboxTitle")}</h2>
            <p className="card-subtitle">{t("notificationsInboxDesc")}</p>
          </div>
          <div className="notif-header-actions">
            {canClear && (
              <button
                type="button"
                className="btn notif-header-btn notif-clear-all-btn"
                onClick={() => setShowClearConfirm(true)}
              >
                <Icon name="trash" size={13} />
                <span>{t("clearAllNotifs")}</span>
              </button>
            )}
          </div>
        </div>

        <div className="card-body" style={{ paddingTop: 16 }}>
          {/* Filter toolbar */}
          <div
            className="notif-filter-bar"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
              flexWrap: "wrap",
              marginBottom: 20,
            }}
          >
            {/* Filter tabs */}
            <div
              className="notif-filter-tabs"
              role="tablist"
              aria-label={t("notificationsInboxTitle")}
            >
              <button
                type="button"
                role="tab"
                aria-selected={filter === "all"}
                className={`notif-filter-tab${filter === "all" ? " active" : ""}`}
                onClick={() => setFilter("all")}
              >
                {t("notifFilterAll")}
                <span className="notif-filter-count">{totalAll}</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={filter === "unread"}
                className={`notif-filter-tab${filter === "unread" ? " active" : ""}`}
                onClick={() => setFilter("unread")}
              >
                {t("notifFilterUnread")}
                <span className="notif-filter-count">{unreadCount}</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={filter === "read"}
                className={`notif-filter-tab${filter === "read" ? " active" : ""}`}
                onClick={() => setFilter("read")}
              >
                {t("notifFilterRead")}
                <span className="notif-filter-count">{readCount}</span>
              </button>
            </div>

            {/* Action button in the filter toolbar */}
            <div className="notif-filter-actions">
              <button
                type="button"
                className="btn btn-secondary notif-header-btn"
                onClick={handleMarkAllRead}
                disabled={!canMarkAll}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  opacity: canMarkAll ? 1 : 0.45,
                  cursor: canMarkAll ? "pointer" : "not-allowed",
                  pointerEvents: canMarkAll ? "auto" : "none",
                }}
                title={canMarkAll ? t("markAllRead") : undefined}
              >
                <Icon name="check" size={13} />
                <span>{t("markAllRead")}</span>
              </button>
            </div>
          </div>

          {/* Content */}
          {loading ? (
            [...Array(5)].map((_, i) => <SkeletonItem key={i} />)
          ) : filtered.length === 0 ? (
            <div className="notif-empty-state">
              <div className="notif-empty-icon">
                <Icon name="bell" size={32} />
              </div>
              <p className="notif-empty-title">{t("noNotificationsYet")}</p>
              <p className="notif-empty-desc">{t("noNotificationsDesc")}</p>
            </div>
          ) : (
            <>
              {filtered.map((notif, index) => (
                <NotificationItem
                  key={notif.id}
                  index={index}
                  notif={notif}
                  onMarkRead={busyIds.has(notif.id) ? () => {} : handleMarkRead}
                  onDelete={busyIds.has(notif.id) ? () => {} : handleDelete}
                  t={t}
                  userType={userType}
                  navigate={navigate}
                />
              ))}
              {filter === "all" && hasMore && (
                <div style={{ marginTop: 20, textAlign: "center" }}>
                  <button
                    className="btn btn-secondary"
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    {loadingMore ? (
                      <>
                        <span className="spinner spinner-sm" />
                        {t("loading")}
                      </>
                    ) : (
                      <>
                        <Icon name="chevron-down" size={14} />
                        {t("loadMoreNotifs")}
                      </>
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
