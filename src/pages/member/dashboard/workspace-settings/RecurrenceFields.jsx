import { useLanguage } from "../../../../context/LanguageContext";

/** Sunday-first, matching the backend weekday numbers (0 = Sunday ... 6 = Saturday). */
const WEEKDAY_KEYS = [
  "recurrenceSun",
  "recurrenceMon",
  "recurrenceTue",
  "recurrenceWed",
  "recurrenceThu",
  "recurrenceFri",
  "recurrenceSat",
];

/**
 * "Repeat weekly" options for a booking: week days, and how long the series runs
 * (one month, several months, until a date, or open ended).
 */
export default function RecurrenceFields({ value, onChange, startDate }) {
  const { t } = useLanguage();
  const set = (patch) => onChange({ ...value, ...patch });

  const toggleDay = (day) =>
    set({
      weekdays: value.weekdays.includes(day)
        ? value.weekdays.filter((d) => d !== day)
        : [...value.weekdays, day],
    });

  const enable = (enabled) => {
    // Start with the weekday of the chosen date so the first session is included.
    const startDay = startDate
      ? new Date(`${startDate}T00:00:00`).getDay()
      : null;
    set({
      enabled,
      weekdays:
        enabled && value.weekdays.length === 0 && startDay !== null
          ? [startDay]
          : value.weekdays,
    });
  };

  return (
    <div className="recurrence-fields">
      <label className="recurrence-toggle">
        <input
          type="checkbox"
          checked={value.enabled}
          onChange={(e) => enable(e.target.checked)}
        />
        <span>
          <strong>{t("recurrenceRepeatWeekly")}</strong>
          <small>{t("recurrenceRepeatHint")}</small>
        </span>
      </label>

      {value.enabled && (
        <div className="recurrence-body">
          <div className="form-group">
            <span className="form-label">{t("recurrenceDays")}</span>
            <div
              className="recurrence-days"
              role="group"
              aria-label={t("recurrenceDays")}
            >
              {WEEKDAY_KEYS.map((key, day) => (
                <button
                  key={key}
                  type="button"
                  aria-pressed={value.weekdays.includes(day)}
                  className={value.weekdays.includes(day) ? "is-on" : undefined}
                  onClick={() => toggleDay(day)}
                >
                  {t(key)}
                </button>
              ))}
            </div>
          </div>

          <div className="recurrence-period">
            <div className="form-group">
              <label className="form-label" htmlFor="recurrence-period">
                {t("recurrencePeriod")}
              </label>
              <select
                id="recurrence-period"
                className="form-input"
                value={value.period}
                onChange={(e) => set({ period: e.target.value })}
              >
                <option value="month">{t("recurrenceOneMonth")}</option>
                <option value="months">{t("recurrenceSeveralMonths")}</option>
                <option value="until">{t("recurrenceUntilDate")}</option>
                <option value="open">{t("recurrenceOpenEnded")}</option>
              </select>
            </div>

            {value.period === "months" && (
              <div className="form-group">
                <label className="form-label" htmlFor="recurrence-months">
                  {t("recurrenceMonthsCount")}
                </label>
                <input
                  id="recurrence-months"
                  type="number"
                  min={2}
                  max={12}
                  className="form-input"
                  value={value.months}
                  onChange={(e) => set({ months: e.target.value })}
                />
              </div>
            )}

            {value.period === "until" && (
              <div className="form-group">
                <label className="form-label" htmlFor="recurrence-ends-on">
                  {t("recurrenceEndsOn")}
                </label>
                <input
                  id="recurrence-ends-on"
                  type="date"
                  className="form-input"
                  min={startDate || undefined}
                  value={value.ends_on}
                  onChange={(e) => set({ ends_on: e.target.value })}
                />
              </div>
            )}
          </div>

          {value.period === "open" && (
            <p className="recurrence-hint">{t("recurrenceOpenHint")}</p>
          )}
        </div>
      )}
    </div>
  );
}
