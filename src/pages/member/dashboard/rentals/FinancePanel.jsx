import { useCallback, useEffect, useState } from "react";
import Icon from "../../../../components/common/Icon";
import client, { endpoints } from "../../../../api/client";
import { useAuth } from "../../../../context/AuthContext";
import { useLanguage } from "../../../../context/LanguageContext";
import { useToast } from "../../../../context/ToastContext";
import useRentalUnits from "./useRentalUnits";
import { apiError, money, thisMonth, today, unitTitle } from "./rentalsShared";

const EMPTY_TX = {
  type: "expense",
  amount: "",
  occurred_on: today(),
  rental_unit_id: "",
  category: "",
  notes: "",
};

/** Monthly income, expenses, net and occupancy per unit, plus manual entries. */
export default function FinancePanel() {
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const toast = useToast();
  const { units } = useRentalUnits();
  const [month, setMonth] = useState(thisMonth());
  const [summary, setSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tx, setTx] = useState(EMPTY_TX);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, list] = await Promise.all([
        client.get(endpoints.rentalFinanceSummary, { params: { month } }),
        client.get(endpoints.rentalTransactions, {
          params: { month, per_page: 100 },
        }),
      ]);
      setSummary(s.data?.data || null);
      setTransactions(list.data?.data || []);
    } catch (err) {
      toast.error(apiError(err, t("rentalLoadError")));
    } finally {
      setLoading(false);
    }
  }, [month, t, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const addTx = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const body = Object.fromEntries(
        Object.entries(tx).filter(([, v]) => v !== ""),
      );
      await client.post(endpoints.rentalTransactions, body);
      setTx({ ...EMPTY_TX, occurred_on: tx.occurred_on, type: tx.type });
      load();
    } catch (err) {
      toast.error(apiError(err, t("rentalSaveError")));
    } finally {
      setSaving(false);
    }
  };

  const removeTx = async (row) => {
    if (!window.confirm(t("rentalDeleteEntryConfirm"))) return;
    try {
      await client.delete(endpoints.rentalTransaction(row.id));
      load();
    } catch (err) {
      toast.error(apiError(err, t("rentalSaveError")));
    }
  };

  const totals = summary?.totals || {};
  const cards = [
    { key: "revenue", label: "rentalRevenue", icon: "calendar" },
    { key: "other_income", label: "rentalOtherIncome", icon: "plus" },
    { key: "expenses", label: "rentalExpenses", icon: "credit-card" },
    { key: "net", label: "rentalNet", icon: "check-circle" },
  ];

  return (
    <section className="rentals-panel">
      <div className="rentals-toolbar">
        <div className="form-group rentals-month">
          <label className="form-label" htmlFor="fin-month">
            {t("rentalMonth")}
          </label>
          <input
            id="fin-month"
            type="month"
            className="form-input"
            value={month}
            onChange={(e) => e.target.value && setMonth(e.target.value)}
          />
        </div>
      </div>

      <div className="rentals-cards">
        {cards.map((c) => (
          <div
            key={c.key}
            className={`rentals-card ${c.key === "net" && Number(totals.net) < 0 ? "is-negative" : ""}`}
          >
            <Icon name={c.icon} size={18} />
            <span>{t(c.label)}</span>
            <strong>
              {loading ? "…" : money(totals[c.key] || 0, user, lang)}
            </strong>
          </div>
        ))}
      </div>

      <h3 className="rentals-subtitle">{t("rentalPerUnit")}</h3>
      {summary?.units?.length ? (
        <div className="rentals-table-wrap">
          <table className="rentals-table">
            <thead>
              <tr>
                <th>{t("rentalUnit")}</th>
                <th>{t("rentalReservationsCount")}</th>
                <th>{t("rentalRevenue")}</th>
                <th>{t("rentalOtherIncome")}</th>
                <th>{t("rentalExpenses")}</th>
                <th>{t("rentalNet")}</th>
                <th>{t("rentalOccupancy")}</th>
              </tr>
            </thead>
            <tbody>
              {summary.units.map((row) => (
                <tr key={row.unit_id ?? "general"}>
                  <td>
                    {row.unit_id
                      ? unitTitle({ id: row.unit_id, title: row.title }, lang)
                      : t("rentalGeneral")}
                  </td>
                  <td>{row.reservations}</td>
                  <td>{money(row.revenue, user, lang)}</td>
                  <td>{money(row.other_income, user, lang)}</td>
                  <td>{money(row.expenses, user, lang)}</td>
                  <td className={row.net < 0 ? "rentals-danger" : ""}>
                    <strong>{money(row.net, user, lang)}</strong>
                  </td>
                  <td>
                    {row.occupancy === null ? (
                      <span className="rentals-muted">—</span>
                    ) : (
                      <div className="rentals-occupancy">
                        <span style={{ width: `${row.occupancy}%` }} />
                        <em>{row.occupancy}%</em>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        !loading && <p className="rentals-muted">{t("rentalNoUnits")}</p>
      )}

      <h3 className="rentals-subtitle">{t("rentalEntries")}</h3>
      <form className="rentals-inline-form" onSubmit={addTx}>
        <div className="form-group">
          <label className="form-label" htmlFor="tx-type">
            {t("rentalEntryType")}
          </label>
          <select
            id="tx-type"
            className="form-select"
            value={tx.type}
            onChange={(e) => setTx({ ...tx, type: e.target.value })}
          >
            <option value="expense">{t("rentalExpense")}</option>
            <option value="income">{t("rentalIncome")}</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="tx-amount">
            {t("rentalAmount")}
          </label>
          <input
            id="tx-amount"
            type="number"
            min="0.01"
            step="0.01"
            required
            className="form-input"
            value={tx.amount}
            onChange={(e) => setTx({ ...tx, amount: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="tx-date">
            {t("rentalDate")}
          </label>
          <input
            id="tx-date"
            type="date"
            required
            className="form-input"
            value={tx.occurred_on}
            onChange={(e) => setTx({ ...tx, occurred_on: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="tx-unit">
            {t("rentalUnit")}
          </label>
          <select
            id="tx-unit"
            className="form-select"
            value={tx.rental_unit_id}
            onChange={(e) => setTx({ ...tx, rental_unit_id: e.target.value })}
          >
            <option value="">{t("rentalGeneral")}</option>
            {units.map((u) => (
              <option key={u.id} value={u.id}>
                {unitTitle(u, lang)}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="tx-category">
            {t("rentalCategory")}
          </label>
          <input
            id="tx-category"
            className="form-input"
            maxLength={60}
            placeholder={t("rentalCategoryHint")}
            value={tx.category}
            onChange={(e) => setTx({ ...tx, category: e.target.value })}
          />
        </div>
        <button
          type="submit"
          className="btn btn-primary btn-md"
          disabled={saving}
        >
          <Icon name="plus" size={16} />
          {t("rentalAddEntry")}
        </button>
      </form>

      {transactions.length > 0 && (
        <ul className="rentals-list">
          {transactions.map((row) => (
            <li key={row.id}>
              <span
                className={`badge ${row.type === "income" ? "badge-status-success" : "badge-status-warning"}`}
              >
                {t(row.type === "income" ? "rentalIncome" : "rentalExpense")}
              </span>
              <strong>{money(row.amount, user, lang)}</strong>
              <span className="rentals-muted">
                {row.occurred_on}
                {row.category ? ` · ${row.category}` : ""}
                {` · ${
                  row.rental_unit_id
                    ? unitTitle(
                        { id: row.rental_unit_id, title: row.unit_title },
                        lang,
                      )
                    : t("rentalGeneral")
                }`}
              </span>
              <button
                type="button"
                className="btn btn-ghost btn-sm rentals-danger"
                aria-label={t("delete")}
                onClick={() => removeTx(row)}
              >
                <Icon name="trash" size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
