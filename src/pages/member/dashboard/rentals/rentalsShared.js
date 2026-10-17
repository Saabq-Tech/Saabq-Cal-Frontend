import { extractTranslatableText } from "../../../../utils/text";
import {
  formatCurrency,
  resolveWorkspaceCurrency,
} from "../../../../utils/currency";

export const BOOKING_MODES = ["nightly", "date", "trip"];
export const UNIT_KINDS = [
  "apartment",
  "chalet",
  "villa",
  "room",
  "camp",
  "trip",
  "property",
  "other",
];
export const RESERVATION_STATUSES = [
  "pending",
  "confirmed",
  "completed",
  "cancelled",
];

/** translations.js keys for enum values. */
export const MODE_KEYS = {
  nightly: "rentalModeNightly",
  date: "rentalModeDate",
  trip: "rentalModeTrip",
};
export const KIND_KEYS = {
  apartment: "rentalKindApartment",
  chalet: "rentalKindChalet",
  villa: "rentalKindVilla",
  room: "rentalKindRoom",
  camp: "rentalKindCamp",
  trip: "rentalKindTrip",
  property: "rentalKindProperty",
  other: "rentalKindOther",
};
export const STATUS_KEYS = {
  pending: "rentalStatusPending",
  confirmed: "rentalStatusConfirmed",
  completed: "rentalStatusCompleted",
  cancelled: "rentalStatusCancelled",
};
export const STATUS_BADGES = {
  pending: "badge-status-warning",
  confirmed: "badge-status-success",
  completed: "badge-status-teal",
  cancelled: "badge-status-neutral",
};

export function unitTitle(unit, lang) {
  return extractTranslatableText(unit?.title, lang) || `#${unit?.id ?? ""}`;
}

export function money(amount, user, lang) {
  return formatCurrency(
    amount,
    resolveWorkspaceCurrency(user?.workspace),
    lang === "ar",
    false,
  );
}

/** First validation message or the API message, for toasts. */
export function apiError(err, fallback) {
  const errors = err?.response?.data?.errors;
  if (errors) return Object.values(errors).flat()[0];
  return err?.response?.data?.message || fallback;
}

export const today = () => new Date().toISOString().slice(0, 10);
export const thisMonth = () => new Date().toISOString().slice(0, 7);
