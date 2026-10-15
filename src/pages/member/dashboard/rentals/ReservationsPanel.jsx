import { useCallback, useEffect, useState } from "react";
import Icon from "../../../../components/common/Icon";
import client, { endpoints } from "../../../../api/client";
import { useAuth } from "../../../../context/AuthContext";
import { useLanguage } from "../../../../context/LanguageContext";
import { useToast } from "../../../../context/ToastContext";
import ReservationFormModal from "./ReservationFormModal";
import useRentalUnits from "./useRentalUnits";
import {
  RESERVATION_STATUSES,
  STATUS_BADGES,
  STATUS_KEYS,
  apiError,
  money,
  unitTitle,
} from "./rentalsShared";

/** Status moves offered from each status. */
const NEXT = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["completed", "cancelled"],
  completed: [],
  cancelled: ["pending"],
};
const ACTION_KEYS = {
  confirmed: "rentalActionConfirm",
  completed: "rentalActionComplete",
  cancelled: "rentalActionCancel",
  pending: "rentalActionReopen",
};

export default function ReservationsPanel() {
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const toast = useToast();
  const { units } = useRentalUnits();
  const [filters, setFilters] = useState({ rental_unit_id: "", status: "" });
  const [page, setPage] = useState(1);
  const [list, setList] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, sort: "desc" };
      Object.entries(filters).forEach(([k, v]) => v && (params[k] = v));
      const res = await client.get(endpoints.rentalReservations, { params });
      setList(res.data?.data || []);
      setMeta(res.data?.meta || null);
    } catch (err) {
      toast.error(apiError(err, t("rentalLoadError")));
    } finally {
      setLoading(false);
    }
  }, [filters, page, t, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const update = async (reservation, body) => {
    if (body.status === "cancelled") {
      const reason = window.prompt(t("rentalCancelReasonPrompt"));
      if (reason === null) return;
      if (reason.trim()) body.cancellation_reason = reason.trim();
    }
    setBusyId(reservation.id);
    try {
      const res = await client.put(
        endpoints.rentalReservation(reservation.id),
        body,
      );
      const next = res.data?.data;
      setList((items) => items.map((r) => (r.id === next?.id ? next : r)));
    } catch (err) {
      toast.error(apiError(err, t("rentalSaveError")));
    } finally {
      setBusyId(null);
    }
  };

  const setFilter = (patch) => {
    setFilters((f) => ({ ...f, ...patch }));
    setPage(1);
  };

  return (
    <section className="rentals-panel">
      <div className="rentals-toolbar">
        <div className="rentals-filters">
          <select
            className="form-select"
            aria-label={t("rentalUnit")}
            value={filters.rental_unit_id}
            onChange={(e) => setFilter({ rental_unit_id: e.target.value })}
          >
            <option value="">{t("rentalAllUnits")}</option>
            {units.map((u) => (
              <option key={u.id} value={u.id}>
                {unitTitle(u, lang)}
              </option>
            ))}
          </select>
          <select
            className="form-select"
            aria-label={t("status")}
            value={filters.status}
            onChange={(e) => setFilter({ status: e.target.value })}
          >
            <option value="">{t("rentalAllStatuses")}</option>
            {RESERVATION_STATUSES.map((s) => (
              <option key={s} value={s}>
                {t(STATUS_KEYS[s])}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          className="btn btn-primary btn-md"
          disabled={units.length === 0}
          onClick={() => setCreating(true)}
        >
          <Icon name="plus" size={16} />
          {t("rentalAddReservation")}
        </button>
      </div>

      {loading ? (
        <div className="rentals-empty">
          <span className="spinner" />
        </div>
      ) : list.length === 0 ? (
        <div className="rentals-empty">
          <Icon name="calendar" size={36} />
          <p>{t("rentalNoReservations")}</p>
        </div>
      ) : (
        <div className="rentals-table-wrap">
          <table className="rentals-table">
            <thead>
              <tr>
                <th>{t("rentalGuest")}</th>
                <th>{t("rentalUnit")}</th>
                <th>{t("rentalDates")}</th>
                <th>{t("rentalTotal")}</th>
                <th>{t("rentalDeposit")}</th>
                <th>{t("status")}</th>
                <th aria-label={t("actions")} />
              </tr>
            </thead>
            <tbody>
              {list.map((r) => (
                <tr key={r.id}>
                  <td>
                    <strong>{r.customer_name}</strong>
                    {r.customer_phone && (
                      <div className="rentals-muted" dir="ltr">
                        {r.customer_phone}
                      </div>
                    )}
                    {r.source === "online" && (
                      <span className="rentals-chip rentals-chip--soft">
                        {t("rentalSourcePublic")}
                      </span>
                    )}
                  </td>
                  <td>
                    {unitTitle(
                      { id: r.rental_unit_id, title: r.unit_title },
                      lang,
                    )}
                  </td>
                  <td>
                    {r.check_in}
                    {r.check_out ? ` → ${r.check_out}` : ""}
                    <div className="rentals-muted">
                      {r.booking_mode === "trip"
                        ? `${t("rentalSeats")}: ${r.quantity}`
                        : r.nights
                          ? `${t("rentalNights")}: ${r.nights}`
                          : ""}
                    </div>
                  </td>
                  <td>{money(r.total_price, user, lang)}</td>
                  <td>
                    {Number(r.deposit_amount) > 0 ? (
                      <label className="rentals-check">
                        <input
                          type="checkbox"
                          checked={!!r.deposit_paid}
                          disabled={busyId === r.id}
                          onChange={(e) =>
                            update(r, { deposit_paid: e.target.checked })
                          }
                        />
                        {money(r.deposit_amount, user, lang)}
                      </label>
                    ) : (
                      <span className="rentals-muted">—</span>
                    )}
                  </td>
                  <td>
                    <span className={`badge ${STATUS_BADGES[r.status] || ""}`}>
                      {t(STATUS_KEYS[r.status])}
                    </span>
                  </td>
                  <td className="rentals-row-actions">
                    {(NEXT[r.status] || []).map((s) => (
                      <button
                        key={s}
                        type="button"
                        className={`btn btn-sm ${s === "cancelled" ? "btn-ghost rentals-danger" : "btn-secondary"}`}
                        disabled={busyId === r.id}
                        onClick={() => update(r, { status: s })}
                      >
                        {t(ACTION_KEYS[s])}
                      </button>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {meta?.last_page > 1 && (
        <div className="rentals-pager">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            {t("previous")}
          </button>
          <span>
            {meta.current_page} / {meta.last_page}
          </span>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            disabled={page >= meta.last_page}
            onClick={() => setPage((p) => p + 1)}
          >
            {t("next")}
          </button>
        </div>
      )}

      {creating && (
        <ReservationFormModal
          units={units.filter((u) => u.is_active)}
          onClose={() => setCreating(false)}
          onSaved={() => {
            setCreating(false);
            load();
          }}
        />
      )}
    </section>
  );
}
