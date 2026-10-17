/** Recurring weekly booking state used by RecurrenceFields and CreateBookingModal. */
export const DEFAULT_RECURRENCE = {
  enabled: false,
  weekdays: [],
  period: "month",
  months: 2,
  ends_on: "",
};

/** Payload fields for POST /workspace/booking-series from the recurrence state. */
export function recurrencePayload(recurrence) {
  return {
    weekdays: [...recurrence.weekdays].sort((a, b) => a - b),
    period: recurrence.period,
    months: recurrence.period === "months" ? Number(recurrence.months) : null,
    ends_on: recurrence.period === "until" ? recurrence.ends_on : null,
  };
}
