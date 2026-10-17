import { useState } from "react";
import ModalPortal from "../../../../components/common/ModalPortal";
import Icon from "../../../../components/common/Icon";
import client, { endpoints } from "../../../../api/client";
import { useLanguage } from "../../../../context/LanguageContext";
import { useToast } from "../../../../context/ToastContext";
import {
  RESERVATION_STATUSES,
  STATUS_KEYS,
  apiError,
  today,
  unitTitle,
} from "./rentalsShared";

/** Reservation entered by the workspace (phone or walk-in). Fields follow the unit's booking mode. */
export default function ReservationFormModal({ units, onClose, onSaved }) {
  const { t, lang } = useLanguage();
  const toast = useToast();
  const [form, setForm] = useState({
    rental_unit_id: units[0]?.id || "",
    customer_name: "",
    customer_phone: "",
    customer_email: "",
    check_in: "",
    check_out: "",
    departure_id: "",
    guests: "",
    quantity: 1,
    status: "confirmed",
    deposit_paid: false,
    notes: "",
  });
  const [saving, setSaving] = useState(false);
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const unit = units.find((u) => String(u.id) === String(form.rental_unit_id));
  const mode = unit?.booking_mode || "nightly";

  const submit = async (e) => {
    e.preventDefault();
    const body = { ...form, deposit_paid: form.deposit_paid ? 1 : 0 };
    if (mode === "trip") {
      delete body.check_in;
      delete body.check_out;
    } else {
      delete body.departure_id;
      delete body.quantity;
      if (mode === "date") delete body.check_out;
    }
    Object.keys(body).forEach((k) => body[k] === "" && delete body[k]);
    setSaving(true);
    try {
      await client.post(endpoints.rentalReservations, body);
      toast.success(t("rentalReservationSaved"));
      onSaved();
    } catch (err) {
      toast.error(apiError(err, t("rentalSaveError")));
    } finally {
      setSaving(false);
    }
  };

  const field = (id, labelKey, props) => (
    <div className="form-group">
      <label className="form-label" htmlFor={`res-${id}`}>
        {t(labelKey)}
      </label>
      <input
        id={`res-${id}`}
        className="form-input"
        value={form[id]}
        onChange={(e) => set({ [id]: e.target.value })}
        {...props}
      />
    </div>
  );

  return (
    <ModalPortal>
      <div className="modal-backdrop" onClick={onClose}>
        <form
          className="modal-card modal-md animate-fade-in-up rentals-modal"
          onClick={(e) => e.stopPropagation()}
          onSubmit={submit}
        >
          <div className="rentals-modal__head">
            <h3>
              <Icon name="calendar" size={20} />
              {t("rentalAddReservation")}
            </h3>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={onClose}
              aria-label={t("close")}
            >
              <Icon name="x" size={16} />
            </button>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="res-unit">
              {t("rentalUnit")}
            </label>
            <select
              id="res-unit"
              className="form-select"
              required
              value={form.rental_unit_id}
              onChange={(e) =>
                set({ rental_unit_id: e.target.value, departure_id: "" })
              }
            >
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {unitTitle(u, lang)}
                </option>
              ))}
            </select>
          </div>

          <div className="form-row">
            {field("customer_name", "rentalGuestName", {
              required: true,
              maxLength: 255,
            })}
            {field("customer_phone", "phone", { dir: "ltr", maxLength: 50 })}
          </div>

          {mode === "trip" ? (
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="res-departure">
                  {t("rentalDeparture")}
                </label>
                <select
                  id="res-departure"
                  className="form-select"
                  required
                  value={form.departure_id}
                  onChange={(e) => set({ departure_id: e.target.value })}
                >
                  <option value="">{t("rentalChooseDeparture")}</option>
                  {(unit?.departures || [])
                    .filter((d) => d.is_active && d.seats_left > 0)
                    .map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.starts_on} ({t("rentalSeatsLeft")}: {d.seats_left})
                      </option>
                    ))}
                </select>
              </div>
              {field("quantity", "rentalSeats", {
                type: "number",
                min: 1,
                required: true,
              })}
            </div>
          ) : (
            <div className="form-row">
              {field(
                "check_in",
                mode === "nightly" ? "rentalCheckIn" : "rentalDay",
                { type: "date", required: true },
              )}
              {mode === "nightly" &&
                field("check_out", "rentalCheckOut", {
                  type: "date",
                  required: true,
                  min: form.check_in || today(),
                })}
            </div>
          )}

          <div className="form-row">
            {mode !== "trip" &&
              field("guests", "rentalGuests", { type: "number", min: 1 })}
            <div className="form-group">
              <label className="form-label" htmlFor="res-status">
                {t("status")}
              </label>
              <select
                id="res-status"
                className="form-select"
                value={form.status}
                onChange={(e) => set({ status: e.target.value })}
              >
                {RESERVATION_STATUSES.filter((s) => s !== "cancelled").map(
                  (s) => (
                    <option key={s} value={s}>
                      {t(STATUS_KEYS[s])}
                    </option>
                  ),
                )}
              </select>
            </div>
          </div>

          {unit?.deposit_required && (
            <label className="rentals-check">
              <input
                type="checkbox"
                checked={form.deposit_paid}
                onChange={(e) => set({ deposit_paid: e.target.checked })}
              />
              {t("rentalDepositPaid")}
            </label>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="res-notes">
              {t("notes")}
            </label>
            <textarea
              id="res-notes"
              className="form-textarea"
              rows={2}
              maxLength={1000}
              value={form.notes}
              onChange={(e) => set({ notes: e.target.value })}
            />
          </div>

          <div className="rentals-modal__actions">
            <button
              type="button"
              className="btn btn-secondary btn-md"
              onClick={onClose}
            >
              {t("cancel")}
            </button>
            <button
              type="submit"
              className="btn btn-primary btn-md"
              disabled={saving}
            >
              {saving ? <span className="spinner spinner-sm" /> : t("save")}
            </button>
          </div>
        </form>
      </div>
    </ModalPortal>
  );
}
