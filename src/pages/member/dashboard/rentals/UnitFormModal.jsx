import { useState } from "react";
import ModalPortal from "../../../../components/common/ModalPortal";
import Icon from "../../../../components/common/Icon";
import client, { endpoints } from "../../../../api/client";
import { useLanguage } from "../../../../context/LanguageContext";
import { useToast } from "../../../../context/ToastContext";
import {
  BOOKING_MODES,
  KIND_KEYS,
  MODE_KEYS,
  UNIT_KINDS,
  apiError,
} from "./rentalsShared";

const EMPTY_UNIT = {
  title: { ar: "", en: "" },
  description: { ar: "", en: "" },
  kind: "apartment",
  booking_mode: "nightly",
  location: "",
  capacity: "",
  bedrooms: "",
  bathrooms: "",
  area_sqm: "",
  price: "",
  min_nights: 1,
  deposit_required: false,
  deposit_type: "percent",
  deposit_value: "",
  photos: [],
  amenities: [],
  is_active: true,
};

/** Builds multipart form data: nested fields as title[ar], arrays as photos[0]... */
function toFormData(form, files) {
  const data = new FormData();
  const put = (key, value) => {
    if (value === null || value === undefined || value === "") return;
    data.append(key, typeof value === "boolean" ? (value ? "1" : "0") : value);
  };
  ["ar", "en"].forEach((l) => {
    put(`title[${l}]`, form.title[l]);
    put(`description[${l}]`, form.description[l]);
  });
  [
    "kind",
    "booking_mode",
    "location",
    "capacity",
    "bedrooms",
    "bathrooms",
    "area_sqm",
    "price",
    "min_nights",
  ].forEach((k) => put(k, form[k]));
  put("deposit_required", !!form.deposit_required);
  if (form.deposit_required) {
    put("deposit_type", form.deposit_type);
    put("deposit_value", form.deposit_value);
  }
  put("is_active", !!form.is_active);
  form.photos.forEach((url, i) => put(`photos[${i}]`, url));
  form.amenities.forEach((a, i) => put(`amenities[${i}]`, a));
  files.forEach((file) => data.append("photo_files[]", file));
  return data;
}

export default function UnitFormModal({ unit, onClose, onSaved }) {
  const { t } = useLanguage();
  const toast = useToast();
  const [form, setForm] = useState(() => ({
    ...EMPTY_UNIT,
    ...(unit || {}),
    title: { ...EMPTY_UNIT.title, ...(unit?.title || {}) },
    description: { ...EMPTY_UNIT.description, ...(unit?.description || {}) },
    photos: unit?.photos || [],
    amenities: unit?.amenities || [],
  }));
  const [amenitiesText, setAmenitiesText] = useState(
    (unit?.amenities || []).join(", "),
  );
  const [files, setFiles] = useState([]);
  const [saving, setSaving] = useState(false);
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const submit = async (e) => {
    e.preventDefault();
    const amenities = amenitiesText
      .split(/[,،\n]/)
      .map((a) => a.trim())
      .filter(Boolean);
    setSaving(true);
    try {
      const body = toFormData({ ...form, amenities }, files);
      const res = unit
        ? await client.post(endpoints.rentalUnit(unit.id), body)
        : await client.post(endpoints.rentalUnits, body);
      toast.success(t("rentalUnitSaved"));
      onSaved(res.data?.data);
    } catch (err) {
      toast.error(apiError(err, t("rentalSaveError")));
    } finally {
      setSaving(false);
    }
  };

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
              <Icon name="home" size={20} />
              {unit ? t("rentalEditUnit") : t("rentalAddUnit")}
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

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="unit-title-ar">
                {t("rentalTitleAr")}
              </label>
              <input
                id="unit-title-ar"
                className="form-input"
                maxLength={160}
                value={form.title.ar}
                onChange={(e) =>
                  set({ title: { ...form.title, ar: e.target.value } })
                }
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="unit-title-en">
                {t("rentalTitleEn")}
              </label>
              <input
                id="unit-title-en"
                className="form-input"
                maxLength={160}
                dir="ltr"
                value={form.title.en}
                onChange={(e) =>
                  set({ title: { ...form.title, en: e.target.value } })
                }
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="unit-kind">
                {t("rentalKind")}
              </label>
              <select
                id="unit-kind"
                className="form-select"
                value={form.kind}
                onChange={(e) => set({ kind: e.target.value })}
              >
                {UNIT_KINDS.map((k) => (
                  <option key={k} value={k}>
                    {t(KIND_KEYS[k])}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="unit-mode">
                {t("rentalBookingMode")}
              </label>
              <select
                id="unit-mode"
                className="form-select"
                value={form.booking_mode}
                onChange={(e) => set({ booking_mode: e.target.value })}
              >
                {BOOKING_MODES.map((m) => (
                  <option key={m} value={m}>
                    {t(MODE_KEYS[m])}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <p className="rentals-hint">
            {t(`${MODE_KEYS[form.booking_mode]}Hint`)}
          </p>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="unit-price">
                {t(`${MODE_KEYS[form.booking_mode]}Price`)}
              </label>
              <input
                id="unit-price"
                type="number"
                min="0"
                step="0.01"
                className="form-input"
                required
                value={form.price}
                onChange={(e) => set({ price: e.target.value })}
              />
            </div>
            {form.booking_mode === "nightly" && (
              <div className="form-group">
                <label className="form-label" htmlFor="unit-min-nights">
                  {t("rentalMinNights")}
                </label>
                <input
                  id="unit-min-nights"
                  type="number"
                  min="1"
                  className="form-input"
                  value={form.min_nights}
                  onChange={(e) => set({ min_nights: e.target.value })}
                />
              </div>
            )}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="unit-location">
                {t("rentalLocation")}
              </label>
              <input
                id="unit-location"
                className="form-input"
                value={form.location || ""}
                onChange={(e) => set({ location: e.target.value })}
              />
            </div>
            {form.booking_mode !== "trip" && (
              <div className="form-group">
                <label className="form-label" htmlFor="unit-capacity">
                  {t("rentalCapacity")}
                </label>
                <input
                  id="unit-capacity"
                  type="number"
                  min="1"
                  className="form-input"
                  value={form.capacity ?? ""}
                  onChange={(e) => set({ capacity: e.target.value })}
                />
              </div>
            )}
          </div>

          {form.booking_mode !== "trip" && (
            <div className="rentals-grid-3">
              {[
                ["bedrooms", "rentalBedrooms"],
                ["bathrooms", "rentalBathrooms"],
                ["area_sqm", "rentalArea"],
              ].map(([key, labelKey]) => (
                <div className="form-group" key={key}>
                  <label className="form-label" htmlFor={`unit-${key}`}>
                    {t(labelKey)}
                  </label>
                  <input
                    id={`unit-${key}`}
                    type="number"
                    min="0"
                    className="form-input"
                    value={form[key] ?? ""}
                    onChange={(e) => set({ [key]: e.target.value })}
                  />
                </div>
              ))}
            </div>
          )}

          <fieldset className="rentals-fieldset">
            <label className="rentals-check">
              <input
                type="checkbox"
                checked={!!form.deposit_required}
                onChange={(e) => set({ deposit_required: e.target.checked })}
              />
              {t("rentalDepositRequired")}
            </label>
            {form.deposit_required && (
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="unit-deposit-type">
                    {t("rentalDepositType")}
                  </label>
                  <select
                    id="unit-deposit-type"
                    className="form-select"
                    value={form.deposit_type}
                    onChange={(e) => set({ deposit_type: e.target.value })}
                  >
                    <option value="percent">{t("rentalDepositPercent")}</option>
                    <option value="fixed">{t("rentalDepositFixed")}</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="unit-deposit-value">
                    {t("rentalDepositValue")}
                  </label>
                  <input
                    id="unit-deposit-value"
                    type="number"
                    min="0"
                    max={form.deposit_type === "percent" ? 100 : undefined}
                    step="0.01"
                    className="form-input"
                    required
                    value={form.deposit_value ?? ""}
                    onChange={(e) => set({ deposit_value: e.target.value })}
                  />
                </div>
              </div>
            )}
          </fieldset>

          <div className="form-group">
            <label className="form-label" htmlFor="unit-desc-ar">
              {t("rentalDescriptionAr")}
            </label>
            <textarea
              id="unit-desc-ar"
              className="form-textarea"
              rows={3}
              maxLength={3000}
              value={form.description.ar || ""}
              onChange={(e) =>
                set({
                  description: { ...form.description, ar: e.target.value },
                })
              }
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="unit-desc-en">
              {t("rentalDescriptionEn")}
            </label>
            <textarea
              id="unit-desc-en"
              className="form-textarea"
              rows={3}
              maxLength={3000}
              dir="ltr"
              value={form.description.en || ""}
              onChange={(e) =>
                set({
                  description: { ...form.description, en: e.target.value },
                })
              }
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="unit-amenities">
              {t("rentalAmenities")}
            </label>
            <input
              id="unit-amenities"
              className="form-input"
              placeholder={t("rentalAmenitiesHint")}
              value={amenitiesText}
              onChange={(e) => setAmenitiesText(e.target.value)}
            />
          </div>

          <div className="form-group">
            <span className="form-label">{t("rentalPhotos")}</span>
            {form.photos.length > 0 && (
              <div className="rentals-photos">
                {form.photos.map((url, i) => (
                  <div key={url} className="rentals-photo">
                    <img src={url} alt="" />
                    <button
                      type="button"
                      aria-label={t("lpRemove")}
                      onClick={() =>
                        set({ photos: form.photos.filter((_, j) => j !== i) })
                      }
                    >
                      <Icon name="x" size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              multiple
              className="form-input"
              aria-label={t("rentalPhotos")}
              onChange={(e) => setFiles([...e.target.files].slice(0, 20))}
            />
          </div>

          <label className="rentals-check">
            <input
              type="checkbox"
              checked={!!form.is_active}
              onChange={(e) => set({ is_active: e.target.checked })}
            />
            {t("rentalIsActive")}
          </label>

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
