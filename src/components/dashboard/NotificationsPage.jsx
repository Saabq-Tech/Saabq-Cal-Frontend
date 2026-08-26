import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../../context/LanguageContext";
import { useToast } from "../../context/ToastContext";
import { useAuth } from "../../context/AuthContext";
import client, { endpoints } from "../../api/client";
import Icon from "../common/Icon";

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
      <div className="skel-circle" />
      <div className="skel-lines">
        <div className="skel-line" style={{ width: "55%" }} />
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
      <div className={`notif-dot-icon${isUnread ? "" : " read"}`}>
        {isUnread ? (
          <Icon name="bell" size={18} />
        ) : (
          <Icon name="bell" size={18} />
        )}
      </div>

      <div className="notif-content">
        {notif.title && <div className="notif-title">{notif.title}</div>}
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
  const { userType } = useAuth();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    total: 0,
  });
  const [unreadCount, setUnreadCount] = useState(0);
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
        setUnreadCount(data.unread_count ?? 0);
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
    [toast],
  );

  useEffect(() => {
    fetchNotifications(1, false);
  }, [fetchNotifications]);

  const handleMarkRead = useCallback(
    async (id) => {
      setBusyIds((s) => new Set(s).add(id));
      try {
        await client.post(endpoints.notificationMarkRead(id));
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === id ? { ...n, read_at: new Date().toISOString() } : n,
          ),
        );
        setUnreadCount((c) => Math.max(0, c - 1));
        toast.success(t("notifMarkedRead"));
      } catch {
        toast.error(t("notifLoadFailed"));
      } finally {
        setBusyIds((s) => {
          const ns = new Set(s);
          ns.delete(id);
          return ns;
        });
      }
    },
    [t, toast],
  );

  const handleMarkAllRead = useCallback(async () => {
    try {
      await client.post(endpoints.notificationsMarkAllRead);
      setNotifications((prev) =>
        prev.map((n) => ({
          ...n,
          read_at: n.read_at ?? new Date().toISOString(),
        })),
      );
      setUnreadCount(0);
      toast.success(t("allNotifsMarkedRead"));
    } catch {
      toast.error(t("notifLoadFailed"));
    }
  }, [t, toast]);

  const handleDelete = useCallback(
    async (id) => {
      setBusyIds((s) => new Set(s).add(id));
      try {
        await client.delete(endpoints.notificationDelete(id));
        setNotifications((prev) => {
          const removed = prev.find((n) => n.id === id);
          if (removed && !removed.read_at)
            setUnreadCount((c) => Math.max(0, c - 1));
          return prev.filter((n) => n.id !== id);
        });
        toast.success(t("notifDeletedSuccess"));
      } catch {
        toast.error(t("notifLoadFailed"));
      } finally {
        setBusyIds((s) => {
          const ns = new Set(s);
          ns.delete(id);
          return ns;
        });
      }
    },
    [t, toast],
  );

  const handleClearAll = useCallback(async () => {
    setShowClearConfirm(false);
    try {
      await client.delete(endpoints.notificationsClear);
      setNotifications([]);
      setUnreadCount(0);
      setPagination({ current_page: 1, last_page: 1, total: 0 });
      toast.success(t("allNotifsCleared"));
    } catch {
      toast.error(t("notifLoadFailed"));
    }
  }, [t, toast]);

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
        <div
          className="card-header"
          style={{
            borderBottom: "1px solid var(--border-light)",
            paddingBottom: 16,
          }}
        >
          <div style={{ flex: 1 }}>
            <h2 className="card-title">{t("notificationsInboxTitle")}</h2>
            <p className="card-subtitle">{t("notificationsInboxDesc")}</p>
          </div>
          <div
            style={{
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            {canMarkAll && (
              <button
                className="btn btn-secondary btn-sm"
                onClick={handleMarkAllRead}
                style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
              >
                <Icon name="check" size={13} />
                {t("markAllRead")}
              </button>
            )}
            {canClear && (
              <button
                className="btn btn-sm"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  background: "rgba(239,68,68,0.08)",
                  color: "#ef4444",
                  border: "1px solid rgba(239,68,68,0.25)",
                }}
                onClick={() => setShowClearConfirm(true)}
              >
                <Icon name="trash" size={13} />
                {t("clearAllNotifs")}
              </button>
            )}
          </div>
        </div>

        <div className="card-body" style={{ paddingTop: 16 }}>
          {/* Filter tabs */}
          <div
            className="notif-filter-tabs"
            role="tablist"
            aria-label={t("notificationsInboxTitle")}
            style={{ marginBottom: 20 }}
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
