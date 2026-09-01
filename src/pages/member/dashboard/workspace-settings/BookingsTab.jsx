import { useState, useEffect } from "react";
import { useLanguage } from "../../../../context/LanguageContext";
import { useToast } from "../../../../context/ToastContext";
import client, { endpoints } from "../../../../api/client";
import UserAvatar from "../../../../components/ui/UserAvatar";
import Icon from "../../../../components/common/Icon";

export default function BookingsTab({
  bookings,
  meta,
  page: _page = 1,
  onPageChange,
  onSelectBooking,
  canEdit,
  onReloadBookings,
}) {
  const { t, isRTL, lang } = useLanguage();
  const toast = useToast();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [confirmingId, setConfirmingId] = useState(null);

  // The table degrades to a card list on a phone. Rendered from JS rather
  // than kept in the DOM twice behind CSS media queries, so there is one
  // live view at a time — jsdom's matchMedia stub always reports
  // matches:false, so tests exercise the table exactly as before.
  const [isMobileView, setIsMobileView] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(max-width: 768px)").matches,
  );
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const onChange = (e) => setIsMobileView(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // Quick-confirm a pending booking from the card list without opening the
  // detail page — same status endpoint BookingDetailsPage uses.
  const handleQuickConfirm = async (id, e) => {
    e.stopPropagation();
    if (!canEdit) return;
    try {
      setConfirmingId(id);
      await client.patch(endpoints.workspaceBookingStatus(id), {
        status: "confirmed",
      });
      toast.success(t("statusUpdatedSuccess") || "تم تحديث الحالة بنجاح");
      if (onReloadBookings) onReloadBookings();
    } catch (err) {
      toast.error(err.response?.data?.message || t("failed") || "فشلت العملية");
    } finally {
      setConfirmingId(null);
    }
  };

  const formatTranslatable = (val) => {
    if (val === null || val === undefined) return "";
    if (typeof val === "string" || typeof val === "number") return String(val);
    if (typeof val === "object") {
      const res =
        val[lang] ||
        val.ar ||
        val.en ||
        val.name ||
        val.title ||
        val.code ||
        val.symbol;
      return typeof res === "string" || typeof res === "number"
        ? String(res)
        : "";
    }
    return "";
  };

  const renderStatusBadge = (status) => {
    switch (status) {
      case "confirmed":
        return (
          <span
            className="profile-badge verified"
            style={{
              padding: "4px 12px",
              fontSize: "0.8rem",
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <Icon name="check" size={12} />
            {t("statusConfirmed") || "مؤكد"}
          </span>
        );
      case "pending":
        return (
          <span
            className="profile-badge pending"
            style={{
              padding: "4px 12px",
              fontSize: "0.8rem",
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <Icon name="custom-56f3550d" size={12} />
            {t("statusPending") || "قيد الانتظار"}
          </span>
        );
      case "cancelled":
        return (
          <span
            className="profile-badge unverified"
            style={{
              padding: "4px 12px",
              fontSize: "0.8rem",
              background: "#ef4444",
              color: "#ffffff",
              border: "1px solid #dc2626",
              fontWeight: 700,
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <Icon name="x" size={12} />
            {t("statusCancelled") || "ملغى"}
          </span>
        );
      case "completed":
        return (
          <span
            className="profile-badge verified"
            style={{
              padding: "4px 12px",
              fontSize: "0.8rem",
              background: "rgba(16, 185, 129, 0.12)",
              color: "#059669",
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <Icon name="check" size={12} />
            {t("statusCompleted") || "مكتمل"}
          </span>
        );
      case "rescheduled":
        return (
          <span
            className="profile-badge verified"
            style={{
              padding: "4px 12px",
              fontSize: "0.8rem",
              background: "rgba(59, 130, 246, 0.12)",
              color: "#2563eb",
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <Icon name="refresh-cw" size={12} />
            {t("statusRescheduled") || "معاد جدولته"}
          </span>
        );
      default:
        return (
          <span
            className="profile-badge unverified"
            style={{ padding: "4px 12px", fontSize: "0.8rem" }}
          >
            {status}
          </span>
        );
    }
  };

  const rawList = Array.isArray(bookings) ? bookings : [];

  const filteredList = rawList
    .filter((b) => {
      const matchStatus = statusFilter === "all" || b.status === statusFilter;
      const nameStr = (
        b.customer_name ||
        b.customer?.name ||
        b.snapshot?.customer_name ||
        ""
      ).toLowerCase();
      const emailStr = (
        b.customer_email ||
        b.customer?.email ||
        b.snapshot?.customer_email ||
        ""
      ).toLowerCase();
      const matchQuery =
        !searchQuery ||
        nameStr.includes(searchQuery.toLowerCase()) ||
        emailStr.includes(searchQuery.toLowerCase());
      return matchStatus && matchQuery;
    })
    .sort((a, b) => {
      const timeA =
        new Date(a.created_at || a.starts_at || 0).getTime() || a.id || 0;
      const timeB =
        new Date(b.created_at || b.starts_at || 0).getTime() || b.id || 0;
      if (timeB !== timeA) return timeB - timeA;
      return (b.id || 0) - (a.id || 0);
    });

  return (
    <div className="card-body">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 14,
          marginBottom: 20,
        }}
      >
        <div>
          <h2
            style={{
              fontSize: "1.2rem",
              fontWeight: 800,
              margin: 0,
              color: "var(--heading)",
            }}
          >
            {t("workspaceBookings") || "المواعيد والحجوزات"}
          </h2>
          <p
            style={{
              fontSize: "0.86rem",
              color: "var(--text-secondary)",
              margin: "4px 0 0",
            }}
          >
            {t("workspaceBookingsDesc") ||
              "استعراض وتحديث حالة كافة الحجوزات والجلسات المقررة للمساحة"}
          </p>
        </div>
        {!canEdit && (
          <span
            className="profile-badge unverified"
            style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
          >
            <Icon name="lock" size={12} />
            {t("readOnlyNotice") || "العرض فقط (بدون تعديل)"}
          </span>
        )}
      </div>

      {/* Search & Filter Bar */}
      <div
        className="bookings-filter-bar"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
          marginBottom: 18,
          background: "var(--surface-alt)",
          padding: 12,
          borderRadius: "var(--radius-md)",
        }}
      >
        <div style={{ position: "relative", width: 280, maxWidth: "100%" }}>
          <input
            type="text"
            className="form-input"
            placeholder={
              t("searchBookingPlaceholder") || "بحث باسم العميل أو البريد..."
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingInlineEnd: 36, fontSize: "0.86rem" }}
          />
          <span
            style={{
              position: "absolute",
              insetInlineEnd: 10,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--muted)",
              display: "flex",
              alignItems: "center",
            }}
          >
            <Icon name="search" size={14} />
          </span>
        </div>

        <div className="bookings-filter-chips no-scrollbar">
          {[
            { id: "all", label: t("filterAll") || "الكل" },
            { id: "confirmed", label: t("filterConfirmed") || "مؤكدة" },
            { id: "pending", label: t("filterPending") || "قيد الانتظار" },
            { id: "cancelled", label: t("filterCancelled") || "ملغاة" },
            { id: "completed", label: t("statusCompleted") || "مكتملة" },
          ].map((st) => (
            <button
              key={st.id}
              type="button"
              onClick={() => setStatusFilter(st.id)}
              style={{
                flexShrink: 0,
                minHeight: 36,
                border: "none",
                background:
                  statusFilter === st.id ? "var(--primary)" : "var(--surface)",
                color:
                  statusFilter === st.id ? "#ffffff" : "var(--text-secondary)",
                padding: "6px 14px",
                borderRadius: 14,
                fontWeight: 600,
                fontSize: "0.82rem",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* Bookings Table */}
      {filteredList.length === 0 ? (
        <div
          style={{
            padding: "48px 20px",
            textAlign: "center",
            background: "var(--surface-alt)",
            borderRadius: "var(--radius-lg)",
            border: "1px border-dashed var(--border)",
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              background: "var(--primary-subtle)",
              color: "var(--primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 12px",
            }}
          >
            <Icon name="calendar" size={24} />
          </div>
          <h4
            style={{
              fontSize: "1rem",
              fontWeight: 700,
              margin: "0 0 6px",
              color: "var(--heading)",
            }}
          >
            {t("noBookingsFound") || "لا توجد مواعيد أو حجوزات مسجلة حالياً"}
          </h4>
          <p style={{ fontSize: "0.85rem", color: "var(--muted)", margin: 0 }}>
            {t("noBookingsDesc") ||
              "ستظهر المواعيد الحالية والقادمة هنا فور إتمام العملاء للحجوزات."}
          </p>
        </div>
      ) : !isMobileView ? (
        <div
          className="bookings-table-wrap"
          style={{
            overflowX: "auto",
            border: "1px solid var(--border-light)",
            borderRadius: "var(--radius-md)",
          }}
        >
          <table
            className="table"
            style={{ width: "100%", borderCollapse: "collapse" }}
          >
            <thead>
              <tr
                style={{
                  background: "var(--surface-alt)",
                  borderBottom: "1px solid var(--border-light)",
                  textAlign: "start",
                }}
              >
                <th
                  style={{
                    padding: "14px 16px",
                    fontSize: "0.86rem",
                    fontWeight: 700,
                    color: "var(--heading)",
                  }}
                >
                  {t("customerHeader") || "العميل"}
                </th>
                <th
                  style={{
                    padding: "14px 16px",
                    fontSize: "0.86rem",
                    fontWeight: 700,
                    color: "var(--heading)",
                  }}
                >
                  {t("serviceHeader") || "الخدمة"}
                </th>
                <th
                  style={{
                    padding: "14px 16px",
                    fontSize: "0.86rem",
                    fontWeight: 700,
                    color: "var(--heading)",
                  }}
                >
                  {t("bookingDateHeader") || "الموعد"}
                </th>
                <th
                  style={{
                    padding: "14px 16px",
                    fontSize: "0.86rem",
                    fontWeight: 700,
                    color: "var(--heading)",
                  }}
                >
                  {t("statusHeader") || "الحالة"}
                </th>
                <th
                  style={{
                    padding: "14px 16px",
                    fontSize: "0.86rem",
                    fontWeight: 700,
                    color: "var(--heading)",
                    textAlign: "end",
                  }}
                >
                  {t("actionsHeader") || "الإجراءات"}
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredList.map((b) => {
                const customerName =
                  b.customer_name ||
                  b.customer?.name ||
                  b.snapshot?.customer_name ||
                  "عميل";
                const customerEmail =
                  b.customer_email ||
                  b.customer?.email ||
                  b.snapshot?.customer_email ||
                  "";
                const serviceTitle =
                  formatTranslatable(b.service?.name) ||
                  b.service_name ||
                  b.service?.title ||
                  b.snapshot?.service_name ||
                  "خدمة";
                const whenTime =
                  b.when ||
                  b.start_time ||
                  (b.starts_at ? new Date(b.starts_at).toLocaleString() : "-");

                return (
                  <tr
                    key={b.id}
                    style={{
                      borderBottom: "1px solid var(--border-light)",
                      cursor: "pointer",
                      transition: "background 0.15s ease",
                    }}
                    onClick={() => onSelectBooking && onSelectBooking(b.id)}
                  >
                    <td
                      data-label={t("customerHeader") || "العميل"}
                      style={{ padding: "14px 16px" }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                        }}
                      >
                        <UserAvatar
                          name={customerName}
                          avatarUrl={b.customer?.avatar_url}
                          size={36}
                        />
                        <div>
                          <div
                            style={{ fontWeight: 700, color: "var(--heading)" }}
                          >
                            {customerName}
                          </div>
                          <div
                            style={{
                              fontSize: "0.8rem",
                              color: "var(--muted)",
                            }}
                          >
                            {customerEmail}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td
                      data-label={t("serviceHeader") || "الخدمة"}
                      style={{
                        padding: "14px 16px",
                        fontWeight: 600,
                        fontSize: "0.88rem",
                      }}
                    >
                      <div>{serviceTitle}</div>
                      {b.follow_up_to_id && (
                        <span
                          style={{
                            display: "inline-block",
                            marginTop: 4,
                            padding: "2px 8px",
                            fontSize: "0.75rem",
                            background: "rgba(59, 130, 246, 0.1)",
                            color: "#2563eb",
                            borderRadius: 12,
                            fontWeight: 700,
                          }}
                        >
                          {isRTL ? "متابعة" : "Follow-up"}
                        </span>
                      )}
                    </td>
                    <td
                      data-label={t("bookingDateHeader") || "الموعد"}
                      style={{
                        padding: "14px 16px",
                        fontSize: "0.86rem",
                        color: "var(--text-secondary)",
                      }}
                    >
                      {whenTime}
                    </td>
                    <td
                      data-label={t("statusHeader") || "الحالة"}
                      style={{ padding: "14px 16px" }}
                    >
                      {renderStatusBadge(b.status)}
                    </td>
                    <td
                      data-label={t("actionsHeader") || "الإجراءات"}
                      style={{ padding: "14px 16px", textAlign: "end" }}
                    >
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onSelectBooking) onSelectBooking(b.id);
                        }}
                        style={{
                          fontSize: "0.8rem",
                          fontWeight: 700,
                          padding: "4px 12px",
                        }}
                      >
                        {t("viewDetails") || "عرض التفاصيل"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}

      {/* Bookings — mobile cards. The table above degrades to a scrolling
          grid poorly; on a phone every row instead becomes a card with the
          same status colours, plus a one-tap confirm for a pending booking
          so the common case doesn't need the detail page. */}
      {filteredList.length > 0 && isMobileView && (
        <div className="bookings-cards-wrap">
          {filteredList.map((b) => {
            const customerName =
              b.customer_name ||
              b.customer?.name ||
              b.snapshot?.customer_name ||
              "عميل";
            const customerEmail =
              b.customer_email ||
              b.customer?.email ||
              b.snapshot?.customer_email ||
              "";
            const serviceTitle =
              formatTranslatable(b.service?.name) ||
              b.service_name ||
              b.service?.title ||
              b.snapshot?.service_name ||
              "خدمة";
            const whenTime =
              b.when ||
              b.start_time ||
              (b.starts_at ? new Date(b.starts_at).toLocaleString() : "-");

            return (
              <div
                key={b.id}
                className="booking-card"
                onClick={() => onSelectBooking && onSelectBooking(b.id)}
              >
                <div className="booking-card-top">
                  <div className="booking-card-identity">
                    <UserAvatar
                      name={customerName}
                      avatarUrl={b.customer?.avatar_url}
                      size={40}
                    />
                    <div className="booking-card-identity-text">
                      <div className="booking-card-name">{customerName}</div>
                      <div className="booking-card-email">{customerEmail}</div>
                    </div>
                  </div>
                  {renderStatusBadge(b.status)}
                </div>

                <div className="booking-card-meta">
                  <div>
                    <Icon name="briefcase" size={15} />
                    <span>{serviceTitle}</span>
                  </div>
                  <div>
                    <Icon name="clock" size={15} />
                    <span>{whenTime}</span>
                  </div>
                </div>

                {canEdit && b.status === "pending" ? (
                  <div className="booking-card-actions">
                    <button
                      type="button"
                      className="btn btn-primary"
                      disabled={confirmingId === b.id}
                      onClick={(e) => handleQuickConfirm(b.id, e)}
                    >
                      {confirmingId === b.id
                        ? t("loading") || "..."
                        : t("markConfirmed") || "تأكيد"}
                    </button>
                    <button
                      type="button"
                      className="booking-card-details-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onSelectBooking) onSelectBooking(b.id);
                      }}
                    >
                      {t("viewDetails") || "التفاصيل"}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="booking-card-details-btn full"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onSelectBooking) onSelectBooking(b.id);
                    }}
                  >
                    {t("viewDetails") || "عرض التفاصيل"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Bar */}
      {meta && meta.last_page > 1 && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: 18,
            paddingTop: 14,
            borderTop: "1px solid var(--border-light)",
          }}
        >
          <span style={{ fontSize: "0.84rem", color: "var(--text-secondary)" }}>
            {isRTL
              ? `عرض الصفحة ${meta.current_page} من ${meta.last_page} (إجمالي ${meta.total} موعد)`
              : `Showing page ${meta.current_page} of ${meta.last_page} (${meta.total} total)`}
          </span>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={meta.current_page <= 1}
              onClick={() =>
                onPageChange && onPageChange(meta.current_page - 1)
              }
              style={{ fontSize: "0.82rem", fontWeight: 600 }}
            >
              {isRTL ? "السابق" : "Previous"}
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={meta.current_page >= meta.last_page}
              onClick={() =>
                onPageChange && onPageChange(meta.current_page + 1)
              }
              style={{ fontSize: "0.82rem", fontWeight: 600 }}
            >
              {isRTL ? "التالي" : "Next"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
