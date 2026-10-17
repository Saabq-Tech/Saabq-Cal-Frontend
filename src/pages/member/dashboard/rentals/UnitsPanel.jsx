import { useState } from "react";
import Icon from "../../../../components/common/Icon";
import client, { endpoints } from "../../../../api/client";
import { useAuth } from "../../../../context/AuthContext";
import { useLanguage } from "../../../../context/LanguageContext";
import { useToast } from "../../../../context/ToastContext";
import UnitFormModal from "./UnitFormModal";
import DeparturesModal from "./DeparturesModal";
import useRentalUnits from "./useRentalUnits";
import {
  KIND_KEYS,
  MODE_KEYS,
  apiError,
  money,
  unitTitle,
} from "./rentalsShared";

export default function UnitsPanel({ onUnitsChanged }) {
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const toast = useToast();
  const { units, loading, reload } = useRentalUnits();
  const [editing, setEditing] = useState(null); // null | "new" | unit
  const [departuresFor, setDeparturesFor] = useState(null);

  const changed = () => {
    reload();
    onUnitsChanged?.();
  };

  const remove = async (unit) => {
    if (!window.confirm(t("rentalDeleteUnitConfirm"))) return;
    try {
      await client.delete(endpoints.rentalUnit(unit.id));
      toast.success(t("rentalDeleted"));
      changed();
    } catch (err) {
      toast.error(apiError(err, t("rentalSaveError")));
    }
  };

  return (
    <section className="rentals-panel">
      <div className="rentals-toolbar">
        <p className="rentals-hint">{t("rentalUnitsHint")}</p>
        <button
          type="button"
          className="btn btn-primary btn-md"
          onClick={() => setEditing("new")}
        >
          <Icon name="plus" size={16} />
          {t("rentalAddUnit")}
        </button>
      </div>

      {loading ? (
        <div className="rentals-empty">
          <span className="spinner" />
        </div>
      ) : units.length === 0 ? (
        <div className="rentals-empty">
          <Icon name="home" size={36} />
          <p>{t("rentalNoUnits")}</p>
        </div>
      ) : (
        <div className="rentals-units">
          {units.map((unit) => (
            <article
              key={unit.id}
              className={`rentals-unit ${unit.is_active ? "" : "is-inactive"}`}
            >
              <div className="rentals-unit__media">
                {unit.photos?.[0] ? (
                  <img src={unit.photos[0]} alt="" loading="lazy" />
                ) : (
                  <Icon name="home" size={32} />
                )}
                <span className="rentals-chip">
                  {t(MODE_KEYS[unit.booking_mode])}
                </span>
              </div>
              <div className="rentals-unit__body">
                <h3>{unitTitle(unit, lang)}</h3>
                <p className="rentals-muted">
                  {t(KIND_KEYS[unit.kind] || "rentalKindOther")}
                  {unit.location ? ` · ${unit.location}` : ""}
                </p>
                <p className="rentals-price">
                  {money(unit.price, user, lang)}
                  <small> / {t(`${MODE_KEYS[unit.booking_mode]}Unit`)}</small>
                </p>
                {unit.deposit_required && (
                  <p className="rentals-muted">
                    {t("rentalDeposit")}:{" "}
                    {unit.deposit_type === "percent"
                      ? `${Number(unit.deposit_value)}%`
                      : money(unit.deposit_value, user, lang)}
                  </p>
                )}
                {unit.booking_mode === "trip" && (
                  <p className="rentals-muted">
                    {t("rentalDeparturesCount")}: {unit.departures?.length || 0}
                  </p>
                )}
                {!unit.is_active && (
                  <span className="badge badge-status-neutral">
                    {t("rentalInactive")}
                  </span>
                )}
              </div>
              <div className="rentals-unit__actions">
                {unit.booking_mode === "trip" && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setDeparturesFor(unit)}
                  >
                    <Icon name="calendar" size={14} />
                    {t("rentalDepartures")}
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setEditing(unit)}
                >
                  <Icon name="edit" size={14} />
                  {t("edit")}
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm rentals-danger"
                  onClick={() => remove(unit)}
                  aria-label={t("delete")}
                >
                  <Icon name="trash" size={14} />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {editing && (
        <UnitFormModal
          unit={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            changed();
          }}
        />
      )}
      {departuresFor && (
        <DeparturesModal
          unit={departuresFor}
          onClose={() => {
            setDeparturesFor(null);
            changed();
          }}
        />
      )}
    </section>
  );
}
