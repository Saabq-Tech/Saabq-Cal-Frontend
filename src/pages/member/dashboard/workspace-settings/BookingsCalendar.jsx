import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../../../../context/AuthContext";
import { useLanguage } from "../../../../context/LanguageContext";
import client, { endpoints } from "../../../../api/client";
import Icon from "../../../../components/common/Icon";
import UserAvatar from "../../../../components/ui/UserAvatar";

export default function BookingsCalendar({ onSelectBooking }) {
  const { user } = useAuth();
  const { t, isRTL, lang } = useLanguage();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarBookings, setCalendarBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(null);

  const isOwner = user?.is_owner === true;
  const userPermissions = Array.isArray(user?.permissions)
    ? user.permissions
    : [];
  const canSeeOthers = isOwner || userPermissions.includes("bookings_read");

  const loadCalendarBookings = async (date) => {
    try {
      setLoading(true);
      const year = date.getFullYear();
      const month = date.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);

      // Pad dates slightly to include overlapping timezones
      const dateFrom = new Date(firstDay);
      dateFrom.setDate(dateFrom.getDate() - 7);
      const dateTo = new Date(lastDay);
      dateTo.setDate(dateTo.getDate() + 7);

      const res = await client.get(endpoints.workspaceCalendarBookings, {
        params: {
          date_from: dateFrom.toISOString(),
          date_to: dateTo.toISOString(),
        },
      });
      setCalendarBookings(res.data?.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCalendarBookings(currentDate);
  }, [currentDate]);

  const handlePrevMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1),
    );
  };

  const handleNextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1),
    );
  };

  // Generate calendar grid
  const daysInMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0,
  ).getDate();
  const firstDayOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1,
  ).getDay();

  const monthNames = [
    t("month_1") || "January",
    t("month_2") || "February",
    t("month_3") || "March",
    t("month_4") || "April",
    t("month_5") || "May",
    t("month_6") || "June",
    t("month_7") || "July",
    t("month_8") || "August",
    t("month_9") || "September",
    t("month_10") || "October",
    t("month_11") || "November",
    t("month_12") || "December",
  ];

  const dayNames = [
    t("day_0") || "Sun",
    t("day_1") || "Mon",
    t("day_2") || "Tue",
    t("day_3") || "Wed",
    t("day_4") || "Thu",
    t("day_5") || "Fri",
    t("day_6") || "Sat",
  ];

  // Map bookings to days
  const bookingsByDay = useMemo(() => {
    const map = {};
    calendarBookings.forEach((b) => {
      if (!b.starts_at) return;
      const d = new Date(b.starts_at);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!map[key]) map[key] = [];
      map[key].push(b);
    });
    return map;
  }, [calendarBookings]);

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

  const getStatusColor = (status, isMine = true) => {
    switch (status) {
      case "cancelled":
        return "#ef4444"; // Red
      case "pending":
        return "#f59e0b"; // Warning Yellow/Orange
      case "completed":
        return "var(--primary)"; // Main Color
      case "confirmed":
      default:
        return isMine ? "var(--primary)" : "#8b5cf6";
    }
  };

  const renderStatusBadge = (status) => {
    switch (status) {
      case "confirmed":
        return (
          <span
            style={{
              background: "var(--primary)",
              color: "#ffffff",
              padding: "2px 8px",
              borderRadius: "12px",
              fontSize: "0.75rem",
              fontWeight: 700,
            }}
          >
            {t("statusConfirmed") || "Confirmed"}
          </span>
        );
      case "pending":
        return (
          <span
            style={{
              background: "#f59e0b",
              color: "#ffffff",
              padding: "2px 8px",
              borderRadius: "12px",
              fontSize: "0.75rem",
              fontWeight: 700,
            }}
          >
            {t("statusPending") || "Pending"}
          </span>
        );
      case "cancelled":
        return (
          <span
            style={{
              background: "#ef4444",
              color: "#ffffff",
              padding: "2px 8px",
              borderRadius: "12px",
              fontSize: "0.75rem",
              fontWeight: 700,
            }}
          >
            {t("statusCancelled") || "Cancelled"}
          </span>
        );
      case "completed":
        return (
          <span
            style={{
              background: "var(--primary)",
              color: "#ffffff",
              padding: "2px 8px",
              borderRadius: "12px",
              fontSize: "0.75rem",
              fontWeight: 700,
            }}
          >
            {t("statusCompleted") || "Completed"}
          </span>
        );
      default:
        return (
          <span
            style={{
              color: "var(--text-secondary)",
              fontSize: "0.75rem",
              fontWeight: 600,
            }}
          >
            {status}
          </span>
        );
    }
  };

  const renderCalendarDays = () => {
    const blanks = Array(firstDayOfMonth).fill(null);
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const totalSlots = [...blanks, ...days];

    // Ensure the total slots are a multiple of 7 by adding blanks at the end if necessary
    const remaining = totalSlots.length % 7;
    const endBlanks = remaining > 0 ? Array(7 - remaining).fill(null) : [];
    const fullGrid = [...totalSlots, ...endBlanks];

    return fullGrid.map((day, idx) => {
      if (!day)
        return <div key={`blank-${idx}`} className="calendar-day-blank" />;

      const key = `${currentDate.getFullYear()}-${currentDate.getMonth()}-${day}`;
      const dayBookings = bookingsByDay[key] || [];
      const isSelected = selectedDay === key;
      const isToday =
        new Date().toDateString() ===
        new Date(
          currentDate.getFullYear(),
          currentDate.getMonth(),
          day,
        ).toDateString();

      return (
        <div
          key={day}
          onClick={() => setSelectedDay(isSelected ? null : key)}
          className={`calendar-day-cell ${isToday ? "is-today" : ""} ${isSelected ? "is-selected" : ""}`}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 10,
              alignItems: "center",
            }}
          >
            <span
              style={{
                fontWeight: isToday ? 800 : 600,
                color: isToday ? "var(--primary)" : "var(--heading)",
                fontSize: isToday ? "1rem" : "0.9rem",
                width: 24,
                height: 24,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "50%",
                background: isToday ? "var(--primary-subtle)" : "transparent",
              }}
            >
              {day}
            </span>
            {dayBookings.length > 0 && (
              <span
                style={{
                  fontSize: "0.7rem",
                  background: "var(--primary)",
                  color: "#fff",
                  borderRadius: "12px",
                  padding: "2px 8px",
                  fontWeight: 700,
                }}
              >
                {dayBookings.length}
              </span>
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {dayBookings.slice(0, 3).map((b) => {
              const isMine = b.workspace_member_id === user.id;
              const bgColor = getStatusColor(b.status, isMine);
              const time = new Date(b.starts_at).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <div
                  key={b.id}
                  className="calendar-event"
                  style={{ background: bgColor }}
                  title={`${time} - ${b.customer_name_snapshot || b.customer?.name}`}
                >
                  <span>{time}</span>
                  <span className="calendar-event-name">
                    {" "}
                    - {b.customer_name_snapshot || b.customer?.name}
                  </span>
                </div>
              );
            })}
            {dayBookings.length > 3 && (
              <div
                style={{
                  fontSize: "0.75rem",
                  color: "var(--text-secondary)",
                  textAlign: "center",
                  fontWeight: 700,
                  marginTop: 4,
                }}
              >
                +{dayBookings.length - 3} {isRTL ? "المزيد" : "more"}
              </div>
            )}
          </div>
          {/* Mobile dots - visible only on small screens */}
          {dayBookings.length > 0 && (
            <div className="calendar-mobile-dots">
              {dayBookings.slice(0, 5).map((b) => {
                const isMine = b.workspace_member_id === user.id;
                return (
                  <span
                    key={b.id}
                    className="calendar-mobile-dot"
                    style={{ background: getStatusColor(b.status, isMine) }}
                  />
                );
              })}
              {dayBookings.length > 5 && (
                <span
                  className="calendar-mobile-dot"
                  style={{ background: "var(--text-secondary)" }}
                />
              )}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="card-body">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 14,
          marginBottom: 24,
        }}
      >
        <div style={{ flex: "1 1 0", minWidth: 0 }}>
          <h2
            style={{
              fontSize: "clamp(1rem, 2.5vw, 1.25rem)",
              fontWeight: 800,
              margin: 0,
              color: "var(--heading)",
            }}
          >
            {t("workspaceBookings") || "المواعيد والحجوزات"} -{" "}
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <p
            style={{
              fontSize: "0.86rem",
              color: "var(--text-secondary)",
              margin: "6px 0 0",
            }}
          >
            {t("workspaceBookingsDesc") ||
              "استعراض وتحديث حالة كافة الحجوزات والجلسات المقررة للمساحة"}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handlePrevMonth}
            style={{ borderRadius: "8px", padding: "6px 12px" }}
          >
            <Icon name={isRTL ? "chevron-right" : "chevron-left"} size={18} />
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleNextMonth}
            style={{ borderRadius: "8px", padding: "6px 12px" }}
          >
            <Icon name={isRTL ? "chevron-left" : "chevron-right"} size={18} />
          </button>
        </div>
      </div>

      {loading ? (
        <div
          style={{
            minHeight: 400,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            className="spinner"
            style={{
              width: 36,
              height: 36,
              border: "4px solid var(--primary-subtle)",
              borderTopColor: "var(--primary)",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
            }}
          />
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div className="calendar-wrapper">
            <div className="calendar-grid">
              {dayNames.map((day) => (
                <div key={day} className="calendar-header-cell">
                  {day}
                </div>
              ))}
              {renderCalendarDays()}
            </div>
          </div>

          {selectedDay && bookingsByDay[selectedDay] && (
            <div
              style={{
                background: "var(--surface-alt)",
                padding: 20,
                borderRadius: "var(--radius-lg)",
                border: "1px solid var(--border-light)",
              }}
            >
              <h3
                style={{
                  fontSize: "1.15rem",
                  fontWeight: 800,
                  marginTop: 0,
                  marginBottom: 16,
                  color: "var(--heading)",
                }}
              >
                {isRTL ? "مواعيد يوم" : "Appointments for"}{" "}
                {(() => {
                  const parts = selectedDay.split("-");
                  const d = new Date(
                    parseInt(parts[0]),
                    parseInt(parts[1]),
                    parseInt(parts[2]),
                  );
                  return d.toLocaleDateString(isRTL ? "ar" : "en", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  });
                })()}
              </h3>
              <div
                style={{ display: "flex", flexDirection: "column", gap: 12 }}
              >
                {bookingsByDay[selectedDay].map((b) => {
                  const customerName =
                    b.customer_name_snapshot || b.customer?.name || "عميل";
                  const serviceTitle =
                    formatTranslatable(b.service?.name) ||
                    b.service_name_snapshot ||
                    b.service?.title ||
                    "خدمة";
                  const isMine = b.workspace_member_id === user.id;

                  return (
                    <div
                      key={b.id}
                      className="booking-list-item"
                      style={{
                        borderInlineStart: `4px solid ${getStatusColor(b.status, isMine)}`,
                      }}
                      onClick={() => onSelectBooking && onSelectBooking(b.id)}
                    >
                      <div className="booking-list-item-main">
                        <UserAvatar
                          name={customerName}
                          avatarUrl={b.customer?.avatar_url}
                          size={40}
                        />
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div className="booking-list-customer-name">
                            {customerName}
                          </div>
                          <div className="booking-list-service-title">
                            {serviceTitle}
                            {b.follow_up_to_id && (
                              <span
                                style={{
                                  display: "inline-block",
                                  marginInlineStart: 8,
                                  padding: "2px 6px",
                                  fontSize: "0.7rem",
                                  background: "rgba(59, 130, 246, 0.1)",
                                  color: "#2563eb",
                                  borderRadius: 10,
                                  fontWeight: 700,
                                }}
                              >
                                {isRTL ? "متابعة" : "Follow-up"}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="booking-list-item-meta">
                        <div className="booking-list-time">
                          {new Date(b.starts_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                        <div style={{ marginTop: 2 }}>
                          {renderStatusBadge(b.status)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      <div
        style={{
          display: "flex",
          gap: 20,
          marginTop: 24,
          fontSize: "0.85rem",
          color: "var(--text-secondary)",
          fontWeight: 600,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              width: 14,
              height: 14,
              borderRadius: 3,
              background: "var(--primary)",
            }}
          ></span>
          {isRTL ? "مكتمل / رئيسي" : "Completed / Main"}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              width: 14,
              height: 14,
              borderRadius: 3,
              background: "#f59e0b",
            }}
          ></span>
          {isRTL ? "قيد الانتظار" : "Pending"}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              width: 14,
              height: 14,
              borderRadius: 3,
              background: "#ef4444",
            }}
          ></span>
          {isRTL ? "ملغى" : "Cancelled"}
        </div>
        {canSeeOthers && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                width: 14,
                height: 14,
                borderRadius: 3,
                background: "#8b5cf6",
              }}
            ></span>
            {isRTL ? "عضو آخر" : "Other Member"}
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
        .calendar-wrapper {
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          border-radius: var(--radius-md);
          border: 1px solid var(--border-light);
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02);
          background: var(--surface);
        }
        .calendar-wrapper::-webkit-scrollbar {
          height: 8px;
        }
        .calendar-wrapper::-webkit-scrollbar-thumb {
          background-color: var(--border-dark);
          border-radius: 4px;
        }
        .calendar-grid {
          display: grid;
          grid-template-columns: repeat(7, minmax(0, 1fr));
          width: 100%;
          min-width: 0;
        }
        .calendar-header-cell {
          text-align: center;
          padding: 12px 4px;
          font-weight: 700;
          font-size: 0.82rem;
          color: var(--text-secondary);
          border-inline-end: 1px solid var(--border-light);
          border-bottom: 1px solid var(--border-light);
          background: var(--surface-alt);
        }
        .calendar-header-cell:nth-child(7n) {
          border-inline-end: none;
        }
        .calendar-day-cell {
          min-height: 100px;
          border-inline-end: 1px solid var(--border-light);
          border-bottom: 1px solid var(--border-light);
          padding: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
          background: var(--surface);
          position: relative;
          overflow: hidden;
        }
        .calendar-grid > .calendar-day-cell:nth-last-child(-n+7) {
          border-bottom: none;
        }
        .calendar-grid > .calendar-day-blank:nth-last-child(-n+7) {
          border-bottom: none;
        }
        .calendar-day-cell:nth-child(7n) {
          border-inline-end: none;
        }
        .calendar-day-cell:hover {
          background: var(--surface-alt) !important;
        }
        .calendar-day-cell.is-today {
          background: var(--surface);
        }
        .calendar-day-cell.is-selected {
          background: var(--primary-subtle) !important;
          box-shadow: inset 0 0 0 2px var(--primary);
        }
        .calendar-day-blank {
          min-height: 100px;
          border-inline-end: 1px solid var(--border-light);
          border-bottom: 1px solid var(--border-light);
          background: rgba(0,0,0,0.02);
        }
        .calendar-day-blank:nth-child(7n) {
          border-inline-end: none;
        }
        .calendar-event {
          font-size: 0.72rem;
          color: #fff;
          padding: 4px 6px;
          border-radius: 6px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          margin-bottom: 4px;
          font-weight: 600;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
          transition: transform 0.1s ease, box-shadow 0.1s ease;
        }
        .calendar-event:hover {
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        /* ── Tablet (≤ 1024px) ── */
        @media (max-width: 1024px) {
          .calendar-day-cell,
          .calendar-day-blank {
            min-height: 80px;
            padding: 5px 4px;
          }
          .calendar-event {
            font-size: 0.68rem;
            padding: 3px 5px;
          }
        }

        /* ── Mobile (≤ 640px): compact grid, hide event names, show only dots ── */
        @media (max-width: 640px) {
          .calendar-header-cell {
            padding: 8px 2px;
            font-size: 0.7rem;
          }
          .calendar-day-cell,
          .calendar-day-blank {
            min-height: 48px;
            padding: 4px 2px;
          }
          .calendar-day-cell > div:first-child {
            margin-bottom: 4px !important;
          }
          .calendar-day-cell > div:first-child > span:first-child {
            font-size: 0.78rem !important;
            width: 20px !important;
            height: 20px !important;
          }
          .calendar-event {
            font-size: 0 !important;
            padding: 0 !important;
            margin-bottom: 0 !important;
            height: 0 !important;
            opacity: 0 !important;
            overflow: hidden !important;
          }
          .calendar-event-name {
            display: none !important;
          }
          .calendar-mobile-dots {
            display: flex !important;
          }
          .booking-list-item {
            flex-wrap: wrap !important;
            gap: 10px !important;
            padding: 12px !important;
          }
          .booking-list-item-main {
            flex: 1 1 100% !important;
            margin-bottom: 2px !important;
          }
          .booking-list-item-meta {
            flex: 1 1 100% !important;
            flex-direction: row !important;
            justify-content: space-between !important;
            align-items: center !important;
            border-top: 1px dashed var(--border-light) !important;
            padding-top: 8px !important;
          }
        }

        /* mobile dots - hidden on desktop */
        .calendar-mobile-dots {
          display: none;
          gap: 3px;
          flex-wrap: wrap;
          justify-content: center;
        }
        .calendar-mobile-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .booking-list-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: var(--surface);
          padding: 14px 16px;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border-light);
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 1px 3px rgba(0,0,0,0.02);
        }
        .booking-list-item-main {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;
          min-width: 0;
        }
        .booking-list-customer-name {
          font-weight: 800;
          font-size: 0.95rem;
          color: var(--heading);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .booking-list-service-title {
          font-size: 0.84rem;
          color: var(--text-secondary);
          margin-top: 2px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .booking-list-item-meta {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 4px;
        }
        .booking-list-time {
          font-weight: 800;
          font-size: 0.9rem;
          color: var(--heading);
          white-space: nowrap;
        }
        .booking-list-item:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 6px rgba(0,0,0,0.05);
          border-color: var(--border-dark);
        }
      `}</style>
    </div>
  );
}
