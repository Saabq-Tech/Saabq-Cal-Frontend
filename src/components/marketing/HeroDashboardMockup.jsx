import { useMemo } from "react";
import { useLanguage } from "../../context/LanguageContext";
import Icon from "../common/Icon";

/**
 * The workspace dashboard as it appears to an owner, rendered in DOM and CSS
 * rather than shipped as a screenshot: it stays sharp at any size, follows the
 * active theme, flips with the writing direction, and reads in both languages.
 *
 * The calendar and the agenda are driven by the real current date. The sample
 * workspace, the client names, and the four figures are illustrative content
 * belonging to this mock-up only — they come from translations.js and are not
 * claims about the platform.
 */
// One agenda slot. Tall enough that a 3-line appointment card sits inside a
// single slot, so cards never overlap each other or spill past the agenda.
const ROW_HEIGHT = 50;

export default function HeroDashboardMockup() {
  const { t, lang, isRTL } = useLanguage();

  const nav = [
    { icon: "home", key: "home", active: true },
    { icon: "calendar", key: "navBookings" },
    { icon: "clock", key: "navSchedules" },
    { icon: "users", key: "customers" },
    { icon: "briefcase", key: "navServices" },
    { icon: "user-check", key: "navTeam" },
    { icon: "bar-chart", key: "navReports" },
    { icon: "settings", key: "navSettings" },
  ];

  const stats = [
    { key: "mockStatToday", value: "24" },
    { key: "mockStatWeek", value: "128" },
    { key: "mockStatCustomers", value: "532" },
    { key: "mockStatRevenue", value: "24,850", unit: "mockCurrency" },
  ];

  const events = [
    {
      key: "mockClient1",
      service: "mockSvcConsult",
      time: "09:00 - 09:45",
      row: 0,
      tone: "a",
    },
    {
      key: "mockClient2",
      service: "mockSvcFollowup",
      time: "10:00 - 11:15",
      row: 1,
      tone: "b",
    },
    {
      key: "mockClient3",
      service: "mockSvcDental",
      time: "12:00 - 13:45",
      row: 3,
      tone: "c",
    },
    {
      key: "mockClient4",
      service: "mockSvcMeeting",
      time: "02:00 - 03:00",
      row: 4,
      tone: "d",
    },
  ];

  const upcoming = [
    { key: "mockClient5", time: "09:30" },
    { key: "mockClient6", time: "11:00" },
    { key: "mockClient7", time: "01:30" },
  ];

  const hours = ["09:00", "10:00", "11:00", "12:00", "01:00", "02:00"];

  const locale = lang === "ar" ? "ar-EG" : "en-GB";

  const { monthLabel, todayLabel, weekdays, cells } = useMemo(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const first = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const lead = first.getDay();

    const grid = [];
    for (let i = 0; i < lead; i++) grid.push(null);
    for (let d = 1; d <= daysInMonth; d++) grid.push(d);
    while (grid.length % 7 !== 0) grid.push(null);

    const dayNames = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(2024, 8, 1 + i); // a Sunday-first reference week
      return d.toLocaleDateString(locale, { weekday: "narrow" });
    });

    return {
      monthLabel: today.toLocaleDateString(locale, {
        month: "long",
        year: "numeric",
      }),
      todayLabel: today.toLocaleDateString(locale, {
        weekday: "long",
        day: "numeric",
        month: "long",
      }),
      weekdays: dayNames,
      cells: grid.map((d) => ({ day: d, isToday: d === today.getDate() })),
    };
  }, [locale]);

  return (
    <div className="hero-mockup" aria-hidden="true">
      <div className="hero-mockup-window">
        <aside className="hero-mockup-sidebar">
          <div className="hero-mockup-identity">
            <span className="hero-mockup-avatar">
              <Icon name="user" size={14} />
            </span>
            <span className="hero-mockup-identity-text">
              <strong>{t("mockWorkspaceName")}</strong>
              <em>{t("mockWorkspaceOwner")}</em>
            </span>
            <Icon name="chevron-down" size={12} />
          </div>

          <nav className="hero-mockup-nav">
            {nav.map((item) => (
              <span
                key={item.key}
                className={`hero-mockup-navitem${item.active ? " active" : ""}`}
              >
                <Icon name={item.icon} size={13} />
                <em>{t(item.key)}</em>
              </span>
            ))}
          </nav>
        </aside>

        <div className="hero-mockup-main">
          <div className="hero-mockup-topbar">
            <Icon name="search" size={13} />
            <Icon name="bell" size={13} />
            <Icon name="settings" size={13} />
          </div>

          <div className="hero-mockup-stats">
            {stats.map((stat) => (
              <div className="hero-mockup-stat" key={stat.key}>
                <span className="hero-mockup-stat-label">{t(stat.key)}</span>
                <span className="hero-mockup-stat-value">
                  {stat.value}
                  {stat.unit && <i>{t(stat.unit)}</i>}
                </span>
              </div>
            ))}
          </div>

          <div className="hero-mockup-body">
            <div className="hero-mockup-agenda">
              <span className="hero-mockup-agenda-head">{todayLabel}</span>
              <div className="hero-mockup-rows">
                {hours.map((hour) => (
                  <div className="hero-mockup-row" key={hour}>
                    <span className="hero-mockup-time">{hour}</span>
                    <span className="hero-mockup-line" />
                  </div>
                ))}
                {events.map((event) => (
                  <span
                    key={event.key}
                    className={`hero-mockup-event tone-${event.tone}`}
                    style={{ top: `${event.row * ROW_HEIGHT + 4}px` }}
                  >
                    <strong>{t(event.key)}</strong>
                    <i>{event.time}</i>
                    <i>{t(event.service)}</i>
                  </span>
                ))}
              </div>
            </div>

            <div className="hero-mockup-side">
              <div className="hero-mockup-cal">
                <div className="hero-mockup-calhead">
                  <Icon
                    name={isRTL ? "chevron-right" : "chevron-left"}
                    size={11}
                  />
                  <span>{monthLabel}</span>
                  <Icon
                    name={isRTL ? "chevron-left" : "chevron-right"}
                    size={11}
                  />
                </div>
                <div className="hero-mockup-calgrid">
                  {weekdays.map((d, i) => (
                    <span className="hero-mockup-weekday" key={`wd-${i}`}>
                      {d}
                    </span>
                  ))}
                  {cells.map((cell, i) => (
                    <span
                      key={`d-${i}`}
                      className={`hero-mockup-day${cell.isToday ? " today" : ""}`}
                    >
                      {cell.day || ""}
                    </span>
                  ))}
                </div>
              </div>

              <div className="hero-mockup-upcoming">
                <span className="hero-mockup-upcoming-head">
                  {t("mockUpcoming")}
                </span>
                {upcoming.map((item) => (
                  <span className="hero-mockup-upcoming-row" key={item.key}>
                    <em>{t(item.key)}</em>
                    <i>{item.time}</i>
                  </span>
                ))}
                <span className="hero-mockup-upcoming-link">
                  {t("mockViewAll")}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <span className="hero-mockup-glow" />
    </div>
  );
}
