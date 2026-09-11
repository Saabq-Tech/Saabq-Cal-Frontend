import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../../../../context/AuthContext";
import { useLanguage } from "../../../../context/LanguageContext";
import { useCustomerLabel } from "../../../../hooks/useCustomerLabel";
import client, { endpoints } from "../../../../api/client";
import Icon from "../../../../components/common/Icon";
import UserAvatar from "../../../../components/ui/UserAvatar";

export default function BookingsCalendar({ onSelectBooking }) {
  const { user } = useAuth();
  const { t, isRTL, lang } = useLanguage();
  const { customerSingular } = useCustomerLabel();

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

  const handleToday = () => {
    setCurrentDate(new Date());
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
    t("month_1") || "يناير",
    t("month_2") || "فبراير",
    t("month_3") || "مارس",
    t("month_4") || "أبريل",
    t("month_5") || "مايو",
    t("month_6") || "يونيو",
    t("month_7") || "يوليو",
    t("month_8") || "أغسطس",
    t("month_9") || "سبتمبر",
    t("month_10") || "أكتوبر",
    t("month_11") || "نوفمبر",
    t("month_12") || "ديسمبر",
  ];

  const dayNames = [
    t("day_0") || (isRTL ? "أحد" : "Sun"),
    t("day_1") || (isRTL ? "إثنين" : "Mon"),
    t("day_2") || (isRTL ? "ثلاثاء" : "Tue"),
    t("day_3") || (isRTL ? "أربعاء" : "Wed"),
    t("day_4") || (isRTL ? "خميس" : "Thu"),
    t("day_5") || (isRTL ? "جمعة" : "Fri"),
    t("day_6") || (isRTL ? "سبت" : "Sat"),
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

  const getEventBadgeStyle = (status, isMine = true) => {
    switch (status) {
      case "cancelled":
        return {
          bg: "var(--badge-danger-bg)",
          color: "var(--badge-danger-color)",
          border: "1px solid var(--badge-danger-border)",
          dot: "#ef4444",
        };
      case "pending":
        return {
          bg: "var(--badge-warning-bg)",
          color: "var(--badge-warning-color)",
          border: "1px solid var(--badge-warning-border)",
          dot: "#f59e0b",
        };
      case "completed":
        return {
          bg: "var(--badge-teal-bg)",
          color: "var(--badge-teal-color)",
          border: "1px solid var(--badge-teal-border)",
          dot: "#14b8a6",
        };
      case "confirmed":
      default:
        if (!isMine) {
          return {
            bg: "rgba(139, 92, 246, 0.16)",
            color: "#c084fc",
            border: "1px solid rgba(139, 92, 246, 0.35)",
            dot: "#8b5cf6",
          };
        }
        return {
          bg: "rgba(3, 154, 183, 0.18)",
          color: "var(--primary)",
          border: "1px solid rgba(3, 154, 183, 0.4)",
          dot: "var(--primary)",
        };
    }
  };

  const renderStatusBadge = (status) => {
    switch (status) {
      case "confirmed":
        return (
          <span className="badge-status badge-status-success">
            {t("statusConfirmed") || "مؤكد"}
          </span>
        );
      case "pending":
        return (
          <span className="badge-status badge-status-warning">
            {t("statusPending") || "قيد الانتظار"}
          </span>
        );
      case "cancelled":
        return (
          <span className="badge-status badge-status-danger">
            {t("statusCancelled") || "ملغى"}
          </span>
        );
      case "completed":
        return (
          <span className="badge-status badge-status-teal">
            {t("statusCompleted") || "مكتمل"}
          </span>
        );
      default:
        return (
          <span className="badge-status badge-status-neutral">{status}</span>
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
      if (!day) return <div key={`blank-${idx}`} className="cal-day-blank" />;

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
          className={`cal-day-cell ${isToday ? "is-today" : ""} ${isSelected ? "is-selected" : ""}`}
        >
          <div className="cal-day-header">
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span
                className={`cal-day-number ${isToday ? "today-badge" : ""}`}
              >
                {day}
              </span>
              {isToday && (
                <span className="cal-today-chip">
                  {isRTL ? "اليوم" : "Today"}
                </span>
              )}
            </div>
            {dayBookings.length > 0 && (
              <span className="cal-day-count-badge">
                {dayBookings.length}{" "}
                {isRTL
                  ? dayBookings.length === 1
                    ? "موعد"
                    : "مواعيد"
                  : dayBookings.length === 1
                    ? "apt"
                    : "apts"}
              </span>
            )}
          </div>

          <div className="cal-events-list">
            {dayBookings.slice(0, 3).map((b) => {
              const isMine = b.workspace_member_id === user?.id;
              const style = getEventBadgeStyle(b.status, isMine);
              const time = new Date(b.starts_at).toLocaleTimeString(
                isRTL ? "ar-SA" : "en-US",
                {
                  hour: "2-digit",
                  minute: "2-digit",
                },
              );
              const clientName =
                b.customer_name_snapshot ||
                b.customer?.name ||
                customerSingular;

              return (
                <div
                  key={b.id}
                  className="cal-event-pill"
                  style={{
                    background: style.bg,
                    color: style.color,
                    border: style.border,
                  }}
                  title={`${time} - ${clientName}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onSelectBooking) onSelectBooking(b.id);
                  }}
                >
                  <span
                    className="cal-event-dot"
                    style={{ background: style.dot }}
                  />
                  <span className="cal-event-time">{time}</span>
                  <span className="cal-event-title">{clientName}</span>
                </div>
              );
            })}

            {dayBookings.length > 3 && (
              <div className="cal-more-badge">
                +{dayBookings.length - 3} {isRTL ? "مواعيد إضافية" : "more"}
              </div>
            )}
          </div>

          {/* Mobile dots indicator */}
          {dayBookings.length > 0 && (
            <div className="cal-mobile-dots">
              {dayBookings.slice(0, 4).map((b) => {
                const isMine = b.workspace_member_id === user?.id;
                const style = getEventBadgeStyle(b.status, isMine);
                return (
                  <span
                    key={b.id}
                    className="cal-mobile-dot"
                    style={{ background: style.dot }}
                  />
                );
              })}
              {dayBookings.length > 4 && (
                <span className="cal-mobile-dot-more">+</span>
              )}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="workspace-bookings-calendar">
      {/* Calendar Header Bar */}
      <div className="cal-header-bar">
        <div className="cal-title-section">
          <h2 className="cal-main-title">
            <Icon
              name="calendar"
              size={22}
              style={{ color: "var(--primary)" }}
            />
            <span>
              {t("workspaceBookings") || "قائمة المواعيد"} -{" "}
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </span>
          </h2>
          <p className="cal-subtitle">
            {t("workspaceBookingsDesc") ||
              "إدارة ومتابعة كافة المواعيد المحجوزة لمساحة العمل"}
          </p>
        </div>

        {/* Navigation Controls */}
        <div className="cal-nav-controls">
          <button
            type="button"
            className="btn btn-secondary btn-sm cal-nav-today-btn"
            onClick={handleToday}
          >
            {isRTL ? "اليوم" : "Today"}
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm cal-nav-arrow-btn"
            onClick={handlePrevMonth}
            title={isRTL ? "الشهر السابق" : "Previous Month"}
          >
            <Icon name={isRTL ? "chevron-right" : "chevron-left"} size={18} />
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm cal-nav-arrow-btn"
            onClick={handleNextMonth}
            title={isRTL ? "الشهر التالي" : "Next Month"}
          >
            <Icon name={isRTL ? "chevron-left" : "chevron-right"} size={18} />
          </button>
        </div>
      </div>

      {loading ? (
        <div
          style={{
            minHeight: 420,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            className="spinner"
            style={{
              width: 38,
              height: 38,
              border: "4px solid var(--primary-subtle)",
              borderTopColor: "var(--primary)",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
            }}
          />
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Main Grid Wrapper */}
          <div className="cal-wrapper">
            <div className="cal-grid">
              {dayNames.map((day) => (
                <div key={day} className="cal-header-cell">
                  {day}
                </div>
              ))}
              {renderCalendarDays()}
            </div>
          </div>

          {/* Selected Day Expanded Drawer */}
          {selectedDay && (
            <div
              className="cal-selected-day-drawer"
              style={{
                background: "var(--surface-alt)",
                padding: "18px 16px",
                borderRadius: "var(--radius-lg)",
                border: "1px solid var(--border)",
                boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 14,
                  flexWrap: "wrap",
                  gap: 10,
                }}
              >
                <h3
                  style={{
                    fontSize: "1.05rem",
                    fontWeight: 800,
                    margin: 0,
                    color: "var(--heading)",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <Icon
                    name="clock"
                    size={18}
                    style={{ color: "var(--primary)" }}
                  />
                  {isRTL ? "مواعيد يوم" : "Appointments for"}{" "}
                  {(() => {
                    const parts = selectedDay.split("-");
                    const d = new Date(
                      parseInt(parts[0], 10),
                      parseInt(parts[1], 10),
                      parseInt(parts[2], 10),
                    );
                    return d.toLocaleDateString(isRTL ? "ar-SA" : "en-US", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    });
                  })()}
                </h3>

                <button
                  type="button"
                  className="btn btn-secondary btn-xs"
                  onClick={() => setSelectedDay(null)}
                  style={{ borderRadius: 6 }}
                >
                  <Icon name="x" size={14} />
                  <span>{isRTL ? "إغلاق" : "Close"}</span>
                </button>
              </div>

              {bookingsByDay[selectedDay] &&
              bookingsByDay[selectedDay].length > 0 ? (
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 10 }}
                >
                  {bookingsByDay[selectedDay].map((b) => {
                    const customerName =
                      b.customer_name_snapshot ||
                      b.customer?.name ||
                      customerSingular;
                    const serviceTitle =
                      formatTranslatable(b.service?.name) ||
                      b.service_name_snapshot ||
                      b.service?.title ||
                      (isRTL ? "خدمة" : "Service");
                    const isMine = b.workspace_member_id === user?.id;
                    const style = getEventBadgeStyle(b.status, isMine);

                    return (
                      <div
                        key={b.id}
                        className="booking-list-item"
                        style={{
                          borderInlineStart: `4px solid ${style.dot}`,
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
                                    background: "rgba(59, 130, 246, 0.12)",
                                    color: "#3b82f6",
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
                            {new Date(b.starts_at).toLocaleTimeString(
                              isRTL ? "ar-SA" : "en-US",
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )}
                          </div>
                          <div>{renderStatusBadge(b.status)}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div
                  style={{
                    textAlign: "center",
                    padding: "16px 12px",
                    color: "var(--text-secondary)",
                    fontSize: "0.85rem",
                  }}
                >
                  {isRTL
                    ? "لا توجد مواعيد مسجلة في هذا اليوم"
                    : "No appointments scheduled for this day"}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Modern Status Legend Bar */}
      <div className="cal-legend-bar">
        <div className="cal-legend-item">
          <span
            className="cal-legend-indicator"
            style={{ background: "var(--primary)" }}
          />
          <span>{isRTL ? "مؤكد / رئيسي" : "Confirmed / Main"}</span>
        </div>
        <div className="cal-legend-item">
          <span
            className="cal-legend-indicator"
            style={{ background: "#f59e0b" }}
          />
          <span>{isRTL ? "قيد الانتظار" : "Pending"}</span>
        </div>
        <div className="cal-legend-item">
          <span
            className="cal-legend-indicator"
            style={{ background: "#ef4444" }}
          />
          <span>{isRTL ? "ملغى" : "Cancelled"}</span>
        </div>
        <div className="cal-legend-item">
          <span
            className="cal-legend-indicator"
            style={{ background: "#14b8a6" }}
          />
          <span>{isRTL ? "مكتمل" : "Completed"}</span>
        </div>
        {canSeeOthers && (
          <div className="cal-legend-item">
            <span
              className="cal-legend-indicator"
              style={{ background: "#8b5cf6" }}
            />
            <span>{isRTL ? "عضو آخر" : "Other Member"}</span>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }

        .workspace-bookings-calendar {
          width: 100%;
        }

        .cal-header-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 14px;
          margin-bottom: 20px;
        }

        .cal-title-section {
          flex: 1 1 0;
          min-width: 0;
        }

        .cal-main-title {
          font-size: clamp(1.1rem, 2.5vw, 1.35rem);
          font-weight: 800;
          margin: 0;
          color: var(--heading);
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .cal-subtitle {
          font-size: 0.85rem;
          color: var(--text-secondary);
          margin: 6px 0 0;
        }

        .cal-nav-controls {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }

        .cal-nav-today-btn {
          border-radius: 8px;
          padding: 6px 14px;
          font-size: 0.82rem;
          font-weight: 700;
        }

        .cal-nav-arrow-btn {
          border-radius: 8px;
          padding: 6px 12px;
        }

        .cal-wrapper {
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          border-radius: var(--radius-lg);
          border: 1px solid var(--border);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
          background: var(--surface);
        }
        .cal-wrapper::-webkit-scrollbar {
          height: 8px;
        }
        .cal-wrapper::-webkit-scrollbar-thumb {
          background-color: var(--border-light);
          border-radius: 4px;
        }

        .cal-grid {
          display: grid;
          grid-template-columns: repeat(7, minmax(0, 1fr));
          width: 100%;
          min-width: 680px;
        }

        .cal-header-cell {
          text-align: center;
          padding: 12px 6px;
          font-weight: 800;
          font-size: 0.84rem;
          color: var(--heading);
          border-inline-end: 1px solid var(--border);
          border-bottom: 1px solid var(--border);
          background: var(--surface-alt);
        }
        .cal-header-cell:nth-child(7n) {
          border-inline-end: none;
        }

        .cal-day-cell {
          min-height: 116px;
          border-inline-end: 1px solid var(--border);
          border-bottom: 1px solid var(--border);
          padding: 8px 10px;
          cursor: pointer;
          transition: background 0.15s ease, box-shadow 0.15s ease;
          background: var(--surface);
          position: relative;
          display: flex;
          flex-direction: column;
          gap: 6px;
          overflow: hidden;
        }
        .cal-grid > .cal-day-cell:nth-last-child(-n+7) {
          border-bottom: none;
        }
        .cal-grid > .cal-day-blank:nth-last-child(-n+7) {
          border-bottom: none;
        }
        .cal-day-cell:nth-child(7n) {
          border-inline-end: none;
        }

        .cal-day-cell:hover {
          background: var(--surface-alt) !important;
        }
        .cal-day-cell.is-selected {
          background: var(--surface-alt) !important;
          box-shadow: inset 0 0 0 2px var(--primary) !important;
        }

        .cal-day-cell.is-today {
          background: linear-gradient(180deg, rgba(3, 154, 183, 0.12) 0%, rgba(3, 154, 183, 0.02) 100%) !important;
          border-top: 3px solid var(--primary) !important;
        }
        .cal-day-cell.is-today:hover {
          background: linear-gradient(180deg, rgba(3, 154, 183, 0.18) 0%, rgba(3, 154, 183, 0.06) 100%) !important;
        }
        .cal-day-cell.is-today.is-selected {
          box-shadow: inset 0 0 0 2px var(--primary), 0 0 14px rgba(3, 154, 183, 0.25) !important;
        }

        .cal-today-chip {
          font-size: 0.65rem;
          font-weight: 800;
          color: var(--primary);
          background: rgba(3, 154, 183, 0.16);
          border: 1px solid rgba(3, 154, 183, 0.35);
          padding: 1px 6px;
          border-radius: 10px;
          letter-spacing: 0.2px;
          line-height: 1.4;
        }

        .cal-day-blank {
          min-height: 116px;
          border-inline-end: 1px solid var(--border);
          border-bottom: 1px solid var(--border);
          background: rgba(0, 0, 0, 0.02);
          cursor: default;
        }
        html.dark .cal-day-blank,
        [data-theme="dark"] .cal-day-blank {
          background: rgba(255, 255, 255, 0.015);
        }
        .cal-day-blank:nth-child(7n) {
          border-inline-end: none;
        }

        .cal-day-header {
          display: flex;
          justifyContent: space-between;
          align-items: center;
          margin-bottom: 4px;
        }

        .cal-day-number {
          font-weight: 700;
          color: var(--heading);
          font-size: 0.92rem;
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: all 0.15s ease;
        }
        .cal-day-number.today-badge {
          background: var(--primary) !important;
          color: #ffffff !important;
          font-weight: 800;
          box-shadow: 0 2px 8px rgba(3, 154, 183, 0.45);
        }

        .cal-day-count-badge {
          font-size: 0.7rem;
          background: var(--primary-subtle);
          color: var(--primary);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 1px 7px;
          font-weight: 700;
        }

        .cal-events-list {
          display: flex;
          flex-direction: column;
          gap: 4px;
          flex: 1;
        }

        .cal-event-pill {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.72rem;
          padding: 4px 8px;
          border-radius: 6px;
          font-weight: 700;
          transition: transform 0.1s ease, filter 0.1s ease;
          overflow: hidden;
          cursor: pointer;
          line-height: 1.3;
        }
        .cal-event-pill:hover {
          transform: translateY(-1px);
          filter: brightness(1.1);
        }
        .cal-event-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .cal-event-time {
          font-size: 0.68rem;
          opacity: 0.9;
          flex-shrink: 0;
        }
        .cal-event-title {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          flex: 1;
        }

        .cal-more-badge {
          font-size: 0.7rem;
          color: var(--primary);
          background: var(--primary-subtle);
          border-radius: 6px;
          padding: 2px 6px;
          text-align: center;
          font-weight: 700;
          margin-top: 2px;
        }

        .cal-mobile-dots {
          display: none;
        }

        /* ── Tablet & Mobile Responsiveness ── */
        @media (max-width: 768px) {
          .cal-header-bar {
            flex-direction: column;
            align-items: stretch;
            gap: 12px;
          }
          .cal-title-section {
            width: 100%;
            flex: none;
          }
          .cal-main-title {
            font-size: 1.12rem !important;
            flex-wrap: wrap;
          }
          .cal-subtitle {
            font-size: 0.8rem !important;
            line-height: 1.4;
          }
          .cal-nav-controls {
            width: 100%;
            display: flex;
            justify-content: space-between;
            gap: 6px;
          }
          .cal-nav-today-btn {
            flex: 1;
            justify-content: center;
            padding: 7px 12px;
          }
          .cal-nav-arrow-btn {
            padding: 7px 14px;
          }

          .cal-wrapper {
            overflow-x: hidden !important;
            border-radius: 12px;
          }

          .cal-grid {
            min-width: 0 !important;
            width: 100% !important;
            grid-template-columns: repeat(7, 1fr) !important;
          }

          .cal-header-cell {
            padding: 8px 1px !important;
            font-size: 0.72rem !important;
            font-weight: 800;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .cal-day-cell {
            min-height: 52px !important;
            max-height: 66px !important;
            padding: 3px 2px !important;
            gap: 1px !important;
            align-items: center;
          }

          .cal-day-blank {
            min-height: 52px !important;
            max-height: 66px !important;
          }

          .cal-day-header {
            margin-bottom: 0 !important;
            justify-content: center !important;
            width: 100%;
          }

          .cal-day-number {
            width: 22px !important;
            height: 22px !important;
            font-size: 0.78rem !important;
            margin: 0 auto;
          }

          .cal-today-chip {
            display: none !important;
          }

          .cal-day-count-badge {
            display: none !important;
          }

          .cal-events-list {
            display: none !important;
          }

          .cal-event-pill {
            display: none !important;
          }

          .cal-more-badge {
            display: none !important;
          }

          .cal-mobile-dots {
            display: flex !important;
            gap: 2px !important;
            flex-wrap: wrap;
            justify-content: center;
            align-items: center;
            margin-top: 2px;
            width: 100%;
          }

          .cal-mobile-dot {
            width: 5px !important;
            height: 5px !important;
            border-radius: 50%;
            flex-shrink: 0;
          }

          .cal-mobile-dot-more {
            font-size: 0.6rem !important;
            color: var(--text-secondary);
            font-weight: 800;
            line-height: 1;
          }

          .cal-selected-day-drawer {
            padding: 14px 10px !important;
          }

          .booking-list-item {
            padding: 10px 12px !important;
          }

          .booking-list-customer-name {
            font-size: 0.88rem !important;
          }

          .booking-list-time {
            font-size: 0.78rem !important;
          }
        }

        /* Legend Bar */
        .cal-legend-bar {
          display: flex;
          align-items: center;
          gap: 18px;
          margin-top: 14px;
          padding: 12px 18px;
          border-radius: var(--radius-md);
          background: var(--surface-alt);
          border: 1px solid var(--border);
          flex-wrap: wrap;
          font-size: 0.82rem;
          font-weight: 700;
          color: var(--text-secondary);
        }
        .cal-legend-item {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .cal-legend-indicator {
          width: 10px;
          height: 10px;
          border-radius: 3px;
          flex-shrink: 0;
        }

        /* Booking details drawer list */
        .booking-list-item {
          display: flex;
          justifyContent: space-between;
          align-items: center;
          background: var(--surface);
          padding: 12px 16px;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border);
          cursor: pointer;
          transition: all 0.15s ease;
          box-shadow: 0 1px 3px rgba(0,0,0,0.02);
        }
        .booking-list-item:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 10px rgba(0,0,0,0.05);
          background: var(--surface-alt);
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
          font-size: 0.82rem;
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
          font-size: 0.88rem;
          color: var(--heading);
          white-space: nowrap;
        }
      `}</style>
    </div>
  );
}
