import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Turnstile } from "@marsidev/react-turnstile";
import Icon from "../../components/common/Icon";
import client, { endpoints } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import { useToast } from "../../context/ToastContext";
import { extractTranslatableText } from "../../utils/text";
import { formatCurrency } from "../../utils/currency";
import {
  KIND_KEYS,
  MODE_KEYS,
  apiError,
  today,
} from "../member/dashboard/rentals/rentalsShared";
import "./CustomerRentalUnitPage.css";

const DAY = 86400000;
const nightsBetween = (a, b) =>
  a && b ? Math.round((new Date(b) - new Date(a)) / DAY) : 0;

/** True when [from, to) overlaps a booked range; a date-mode booking holds its single day. */
function clashes(booked, from, to) {
  return booked.some((r) => {
    const bookedEnd = r.check_out || r.check_in;
    const end = to || from;
    if (!r.check_out || !to) return from <= bookedEnd && r.check_in <= end;
    return from < bookedEnd && r.check_in < end;
  });
}

/** Public page of one rental unit: photos, details and a reservation request by booking mode. */
export default function CustomerRentalUnitPage() {
  const { idOrSlug, unitId } = useParams();
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const toast = useToast();
  const [workspace, setWorkspace] = useState(null);
  const [unit, setUnit] = useState(null);
  const [booked, setBooked] = useState([]);
  const [loading, setLoading] = useState(true);
  const [photo, setPhoto] = useState(0);
  const [form, setForm] = useState({
    customer_name: user?.name || "",
    customer_phone: user?.phone || "",
    customer_email: user?.email || "",
    check_in: "",
    check_out: "",
    departure_id: "",
    guests: "",
    quantity: 1,
    notes: "",
  });
  const [token, setToken] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(null);
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  useEffect(() => {
    setLoading(true);
    Promise.all([
      client.get(endpoints.publicWorkspaceDetail(idOrSlug)),
      client.get(endpoints.publicWorkspaceUnit(idOrSlug, unitId)),
    ])
      .then(([wsRes, unitRes]) => {
        setWorkspace(wsRes.data?.data || null);
        const u = unitRes.data?.data || null;
        setUnit(u);
        if (u && u.booking_mode !== "trip") {
          client
            .get(endpoints.publicWorkspaceUnitAvailability(idOrSlug, unitId))
            .then((r) => setBooked(r.data?.data?.booked || []))
            .catch(() => setBooked([]));
        }
      })
      .catch(() => setUnit(null))
      .finally(() => setLoading(false));
  }, [idOrSlug, unitId]);

  const currency = workspace?.currency || workspace?.currency_code;
  const money = (v) => formatCurrency(v, currency, lang === "ar", t("free"));
  const mode = unit?.booking_mode;
  const departure = unit?.departures?.find(
    (d) => String(d.id) === String(form.departure_id),
  );

  const quote = useMemo(() => {
    if (!unit) return null;
    let total = 0;
    if (mode === "nightly") {
      const n = nightsBetween(form.check_in, form.check_out);
      if (n <= 0) return null;
      total = n * Number(unit.price);
    } else if (mode === "date") {
      if (!form.check_in) return null;
      total = Number(unit.price);
    } else {
      if (!departure) return null;
      total = Number(departure.price) * Number(form.quantity || 1);
    }
    let deposit = 0;
    if (unit.deposit_required) {
      deposit =
        unit.deposit_type === "percent"
          ? (total * Number(unit.deposit_value)) / 100
          : Math.min(total, Number(unit.deposit_value));
    }
    return { total, deposit };
  }, [unit, mode, form.check_in, form.check_out, form.quantity, departure]);

  const problem = useMemo(() => {
    if (!unit) return "";
    if (mode === "nightly" && form.check_in && form.check_out) {
      const n = nightsBetween(form.check_in, form.check_out);
      if (n <= 0) return t("rentalErrCheckout");
      if (n < (unit.min_nights || 1))
        return `${t("rentalMinNights")}: ${unit.min_nights}`;
      if (clashes(booked, form.check_in, form.check_out))
        return t("rentalErrTaken");
    }
    if (mode === "date" && form.check_in && clashes(booked, form.check_in))
      return t("rentalErrTaken");
    if (mode === "trip" && departure && form.quantity > departure.seats_left)
      return t("rentalErrSeats");
    return "";
  }, [unit, mode, form, booked, departure, t]);

  const submit = async (e) => {
    e.preventDefault();
    if (problem) return toast.error(problem);
    if (!token) return toast.error(t("rentalVerifyCaptcha"));
    const body = {
      customer_name: form.customer_name,
      customer_phone: form.customer_phone,
      customer_email: form.customer_email,
      notes: form.notes,
      "cf-turnstile-response": token,
    };
    if (mode === "trip") {
      body.departure_id = form.departure_id;
      body.quantity = form.quantity;
    } else {
      body.check_in = form.check_in;
      if (mode === "nightly") body.check_out = form.check_out;
      body.guests = form.guests;
    }
    Object.keys(body).forEach((k) => body[k] === "" && delete body[k]);
    setSending(true);
    try {
      const res = await client.post(
        endpoints.publicWorkspaceUnitReserve(idOrSlug, unitId),
        body,
      );
      setDone(res.data?.data || {});
    } catch (err) {
      toast.error(apiError(err, t("rentalSaveError")));
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="main-content rup-center">
        <span className="spinner" />
      </div>
    );
  }
  if (!unit) {
    return (
      <div className="main-content rup-center">
        <p>{t("rentalUnitNotFound")}</p>
        <Link to={`/${idOrSlug}`} className="btn btn-secondary btn-md">
          {t("rentalBackToWorkspace")}
        </Link>
      </div>
    );
  }

  const title = extractTranslatableText(unit.title, lang);
  const description = extractTranslatableText(unit.description, lang);
  const photos = unit.photos || [];
  const facts = [
    unit.bedrooms && `${unit.bedrooms} ${t("rentalBedrooms")}`,
    unit.bathrooms && `${unit.bathrooms} ${t("rentalBathrooms")}`,
    unit.area_sqm && `${unit.area_sqm} ${t("rentalArea")}`,
    unit.capacity && `${unit.capacity} ${t("rentalGuests")}`,
  ].filter(Boolean);
  const departures = (unit.departures || []).filter((d) => d.seats_left > 0);

  return (
    <div className="main-content rup">
      <div className="container rup-wrap">
        <Link to={`/${idOrSlug}`} className="rup-back">
          <Icon name="chevron-right" size={16} />
          {workspace?.name || t("rentalBackToWorkspace")}
        </Link>

        <div className="rup-grid">
          <div>
            <div className="rup-photo">
              {photos[photo] ? (
                <img src={photos[photo]} alt={title} />
              ) : (
                <Icon name="home" size={48} />
              )}
            </div>
            {photos.length > 1 && (
              <div className="rup-thumbs">
                {photos.map((src, i) => (
                  <button
                    key={src}
                    type="button"
                    className={i === photo ? "is-active" : ""}
                    onClick={() => setPhoto(i)}
                    aria-label={`${t("rentalPhotos")} ${i + 1}`}
                  >
                    <img src={src} alt="" loading="lazy" />
                  </button>
                ))}
              </div>
            )}

            <h1 className="rup-title">{title}</h1>
            <p className="rup-muted">
              {t(KIND_KEYS[unit.kind] || "rentalKindOther")}
              {unit.location ? ` · ${unit.location}` : ""}
            </p>
            {facts.length > 0 && (
              <ul className="rup-chips">
                {facts.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            )}
            {description && <p className="rup-desc">{description}</p>}
            {unit.amenities?.length > 0 && (
              <>
                <h2 className="rup-h2">{t("rentalAmenities")}</h2>
                <ul className="rup-chips rup-chips--soft">
                  {unit.amenities.map((a) => (
                    <li key={a}>{a}</li>
                  ))}
                </ul>
              </>
            )}
            {mode !== "trip" && booked.length > 0 && (
              <>
                <h2 className="rup-h2">{t("rentalBookedDates")}</h2>
                <ul className="rup-booked">
                  {booked.slice(0, 12).map((r) => (
                    <li key={`${r.check_in}-${r.check_out}`}>
                      {r.check_in}
                      {r.check_out ? ` → ${r.check_out}` : ""}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>

          <aside className="rup-card">
            <p className="rup-price">
              {money(unit.price)}
              <small> / {t(`${MODE_KEYS[mode]}Unit`)}</small>
            </p>
            {unit.deposit_required && (
              <p className="rup-muted">
                {t("rentalDepositRequired")}:{" "}
                {unit.deposit_type === "percent"
                  ? `${Number(unit.deposit_value)}%`
                  : money(unit.deposit_value)}
              </p>
            )}

            {done ? (
              <div className="rup-done">
                <Icon name="check-circle" size={40} />
                <h3>{t("rentalRequestSent")}</h3>
                <p>{t("rentalRequestSentText")}</p>
                {Number(done.deposit_amount) > 0 && (
                  <p>
                    {t("rentalDeposit")}:{" "}
                    <strong>{money(done.deposit_amount)}</strong>
                  </p>
                )}
              </div>
            ) : (
              <form onSubmit={submit} className="rup-form">
                {mode === "trip" ? (
                  departures.length === 0 ? (
                    <p className="rup-muted">{t("rentalNoDepartures")}</p>
                  ) : (
                    <>
                      <div className="form-group">
                        <label className="form-label" htmlFor="rup-dep">
                          {t("rentalDeparture")}
                        </label>
                        <select
                          id="rup-dep"
                          className="form-select"
                          required
                          value={form.departure_id}
                          onChange={(e) =>
                            set({ departure_id: e.target.value })
                          }
                        >
                          <option value="">{t("rentalChooseDeparture")}</option>
                          {departures.map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.starts_on}
                              {d.ends_on ? ` → ${d.ends_on}` : ""} ·{" "}
                              {money(d.price)} · {d.seats_left}{" "}
                              {t("rentalSeatsLeft")}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label" htmlFor="rup-qty">
                          {t("rentalSeats")}
                        </label>
                        <input
                          id="rup-qty"
                          type="number"
                          min="1"
                          max={departure?.seats_left || 50}
                          required
                          className="form-input"
                          value={form.quantity}
                          onChange={(e) => set({ quantity: e.target.value })}
                        />
                      </div>
                    </>
                  )
                ) : (
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label" htmlFor="rup-in">
                        {mode === "nightly"
                          ? t("rentalCheckIn")
                          : t("rentalDay")}
                      </label>
                      <input
                        id="rup-in"
                        type="date"
                        min={today()}
                        required
                        className="form-input"
                        value={form.check_in}
                        onChange={(e) => set({ check_in: e.target.value })}
                      />
                    </div>
                    {mode === "nightly" && (
                      <div className="form-group">
                        <label className="form-label" htmlFor="rup-out">
                          {t("rentalCheckOut")}
                        </label>
                        <input
                          id="rup-out"
                          type="date"
                          min={form.check_in || today()}
                          required
                          className="form-input"
                          value={form.check_out}
                          onChange={(e) => set({ check_out: e.target.value })}
                        />
                      </div>
                    )}
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label" htmlFor="rup-name">
                    {t("rentalGuestName")}
                  </label>
                  <input
                    id="rup-name"
                    className="form-input"
                    required
                    maxLength={255}
                    value={form.customer_name}
                    onChange={(e) => set({ customer_name: e.target.value })}
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label" htmlFor="rup-phone">
                      {t("phone")}
                    </label>
                    <input
                      id="rup-phone"
                      className="form-input"
                      dir="ltr"
                      required
                      maxLength={50}
                      value={form.customer_phone}
                      onChange={(e) => set({ customer_phone: e.target.value })}
                    />
                  </div>
                  {mode !== "trip" && (
                    <div className="form-group">
                      <label className="form-label" htmlFor="rup-guests">
                        {t("rentalGuests")}
                      </label>
                      <input
                        id="rup-guests"
                        type="number"
                        min="1"
                        max={unit.capacity || undefined}
                        className="form-input"
                        value={form.guests}
                        onChange={(e) => set({ guests: e.target.value })}
                      />
                    </div>
                  )}
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="rup-notes">
                    {t("notes")}
                  </label>
                  <textarea
                    id="rup-notes"
                    className="form-textarea"
                    rows={2}
                    maxLength={1000}
                    value={form.notes}
                    onChange={(e) => set({ notes: e.target.value })}
                  />
                </div>

                {problem && <p className="rup-problem">{problem}</p>}
                {quote && !problem && (
                  <div className="rup-quote">
                    <div>
                      <span>{t("rentalTotal")}</span>
                      <strong>{money(quote.total)}</strong>
                    </div>
                    {quote.deposit > 0 && (
                      <div>
                        <span>{t("rentalDepositDue")}</span>
                        <strong>{money(quote.deposit)}</strong>
                      </div>
                    )}
                  </div>
                )}

                <Turnstile
                  siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY}
                  onSuccess={setToken}
                  onError={() => setToken("")}
                  onExpire={() => setToken("")}
                  options={{
                    theme: "auto",
                    size: "flexible",
                    action: "rental-reservation",
                  }}
                />

                <button
                  type="submit"
                  className="btn btn-primary btn-lg rup-submit"
                  disabled={sending || !!problem}
                >
                  {sending ? (
                    <span className="spinner spinner-sm" />
                  ) : (
                    t("rentalSendRequest")
                  )}
                </button>
                <p className="rup-muted rup-note">{t("rentalRequestNote")}</p>
              </form>
            )}

            <Link to={`/${idOrSlug}/book`} className="rup-call">
              <Icon name="calendar" size={16} />
              {t("rentalBookCallInstead")}
            </Link>
          </aside>
        </div>
      </div>
    </div>
  );
}
