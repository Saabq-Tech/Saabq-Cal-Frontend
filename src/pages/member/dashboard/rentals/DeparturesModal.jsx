import { useState } from "react";
import ModalPortal from "../../../../components/common/ModalPortal";
import Icon from "../../../../components/common/Icon";
import client, { endpoints } from "../../../../api/client";
import { useLanguage } from "../../../../context/LanguageContext";
import { useToast } from "../../../../context/ToastContext";
import { apiError, today, unitTitle } from "./rentalsShared";

const EMPTY = { starts_on: "", ends_on: "", seats: "", price: "" };

/** Trip departures of one unit: list, add and delete. */
export default function DeparturesModal({ unit, onClose }) {
  const { t, lang } = useLanguage();
  const toast = useToast();
  const [departures, setDepartures] = useState(unit.departures || []);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const add = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const body = Object.fromEntries(
        Object.entries(form).filter(([, v]) => v !== ""),
      );
      const res = await client.post(
        endpoints.rentalUnitDepartures(unit.id),
        body,
      );
      setDepartures(res.data?.data?.departures || []);
      setForm(EMPTY);
    } catch (err) {
      toast.error(apiError(err, t("rentalSaveError")));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (dep) => {
    if (!window.confirm(t("rentalDeleteDepartureConfirm"))) return;
    try {
      await client.delete(endpoints.rentalUnitDeparture(unit.id, dep.id));
      setDepartures((list) => list.filter((d) => d.id !== dep.id));
    } catch (err) {
      toast.error(apiError(err, t("rentalSaveError")));
    }
  };

  return (
    <ModalPortal>
      <div className="modal-backdrop" onClick={onClose}>
        <div
          className="modal-card modal-md animate-fade-in-up rentals-modal"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="rentals-modal__head">
            <h3>
              <Icon name="calendar" size={20} />
              {t("rentalDepartures")} — {unitTitle(unit, lang)}
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

          {departures.length === 0 ? (
            <p className="rentals-muted">{t("rentalNoDepartures")}</p>
          ) : (
            <ul className="rentals-list">
              {departures.map((d) => (
                <li key={d.id}>
                  <span>
                    <strong>{d.starts_on}</strong>
                    {d.ends_on ? ` → ${d.ends_on}` : ""}
                  </span>
                  <span className="rentals-muted">
                    {t("rentalSeatsLeft")}: {d.seats_left} / {d.seats}
                  </span>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm rentals-danger"
                    aria-label={t("delete")}
                    onClick={() => remove(d)}
                  >
                    <Icon name="trash" size={14} />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <form className="rentals-inline-form" onSubmit={add}>
            <div className="form-group">
              <label className="form-label" htmlFor="dep-start">
                {t("rentalDepartureDate")}
              </label>
              <input
                id="dep-start"
                type="date"
                min={today()}
                required
                className="form-input"
                value={form.starts_on}
                onChange={(e) =>
                  setForm({ ...form, starts_on: e.target.value })
                }
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="dep-end">
                {t("rentalReturnDate")}
              </label>
              <input
                id="dep-end"
                type="date"
                min={form.starts_on || today()}
                className="form-input"
                value={form.ends_on}
                onChange={(e) => setForm({ ...form, ends_on: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="dep-seats">
                {t("rentalSeats")}
              </label>
              <input
                id="dep-seats"
                type="number"
                min="1"
                required
                className="form-input"
                value={form.seats}
                onChange={(e) => setForm({ ...form, seats: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="dep-price">
                {t("rentalSeatPriceOverride")}
              </label>
              <input
                id="dep-price"
                type="number"
                min="0"
                step="0.01"
                className="form-input"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary btn-md"
              disabled={saving}
            >
              <Icon name="plus" size={16} />
              {t("rentalAddDeparture")}
            </button>
          </form>
        </div>
      </div>
    </ModalPortal>
  );
}
