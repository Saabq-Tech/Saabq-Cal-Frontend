import { useLanguage } from "../../../../context/LanguageContext";
import { endpoints } from "../../../../api/client";
import SearchableSelect from "../../../../components/common/SearchableSelect";

export default function TimezoneTab({
  timezoneForm,
  setTimezoneForm,
  timezones = [],
  currencies = [],
  onSave,
  saving,
  canEdit,
}) {
  const { t, isRTL } = useLanguage();

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(timezoneForm, endpoints.workspaceSettingsTimezone);
  };

  const tzList =
    Array.isArray(timezones) && timezones.length > 0
      ? timezones
      : [
          {
            id: 1,
            name: "Asia/Riyadh",
            label: "Asia/Riyadh (GMT+3)",
            offset: "+03:00",
          },
          {
            id: 2,
            name: "Asia/Dubai",
            label: "Asia/Dubai (GMT+4)",
            offset: "+04:00",
          },
          {
            id: 3,
            name: "Africa/Cairo",
            label: "Africa/Cairo (GMT+2)",
            offset: "+02:00",
          },
          { id: 4, name: "UTC", label: "UTC (GMT+0)", offset: "+00:00" },
        ];

  const tzOptions = tzList.map((tz) => ({
    value: tz.name,
    label: tz.label || `${tz.name} (GMT${tz.offset || ""})`,
    id: tz.id,
    raw: tz,
  }));

  const currList =
    Array.isArray(currencies) && currencies.length > 0
      ? currencies
      : [
          {
            id: 1,
            code: "SAR",
            name: { ar: "ريال سعودي", en: "Saudi Riyal" },
            symbol_native: isRTL ? "ر.س" : "SAR",
          },
          {
            id: 2,
            code: "EGP",
            name: { ar: "جنيه مصري", en: "Egyptian Pound" },
            symbol_native: isRTL ? "ج.م" : "EGP",
          },
          {
            id: 3,
            code: "USD",
            name: { ar: "دولار أمريكي", en: "US Dollar" },
            symbol_native: "$",
          },
        ];

  const currencyOptions = currList.map((c) => {
    const cName =
      typeof c.name === "object"
        ? isRTL
          ? c.name?.ar || c.name?.en
          : c.name?.en || c.name?.ar
        : c.name;
    const sym = c.symbol_native || c.symbol || c.code;
    return {
      value: c.id,
      label: `${c.code} - ${cName} (${sym})`,
      id: c.id,
      raw: c,
    };
  });

  return (
    <form className="card-body" onSubmit={handleSubmit}>
      <h3 style={{ fontSize: "1.1rem", marginBottom: 16 }}>
        {t("workspaceTimezone") || "إعدادات التوقيت والتاريخ والعملة"}
      </h3>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">
            {t("timezone") || "المنطقة الزمنية"}
          </label>
          <SearchableSelect
            value={timezoneForm.timezone}
            options={tzOptions}
            placeholder={t("selectTimezone") || "-- اختر المنطقة الزمنية --"}
            searchPlaceholder={
              t("searchTimezones") || "بحث في المناطق الزمنية..."
            }
            disabled={!canEdit}
            onChange={(selectedVal, rawObj) => {
              const foundTz = rawObj?.raw || rawObj;
              setTimezoneForm({
                ...timezoneForm,
                timezone: selectedVal,
                timezone_id: foundTz?.id || timezoneForm.timezone_id,
              });
            }}
          />
        </div>

        <div className="form-group">
          <label className="form-label">
            {t("currency") ||
              (isRTL
                ? "العملة الافتراضية للمساحة"
                : "Workspace Default Currency")}
          </label>
          <SearchableSelect
            value={timezoneForm.currency_id}
            options={currencyOptions}
            placeholder={
              t("selectCurrency") ||
              (isRTL ? "-- اختر عملة مساحة العمل --" : "-- Select Currency --")
            }
            searchPlaceholder={
              t("searchCurrencies") ||
              (isRTL ? "بحث في العملات..." : "Search currencies...")
            }
            disabled={!canEdit}
            onChange={(selectedVal) => {
              setTimezoneForm({
                ...timezoneForm,
                currency_id: selectedVal,
              });
            }}
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">
            {t("timeFormat") || "صيغة الوقت"}
          </label>
          <select
            className="form-select"
            value={timezoneForm.time_format}
            onChange={(e) =>
              setTimezoneForm({ ...timezoneForm, time_format: e.target.value })
            }
            disabled={!canEdit}
          >
            <option value="12h">
              {t("timeFormat12") || "12 ساعة (02:30 PM)"}
            </option>
            <option value="24h">
              {t("timeFormat24") || "24 ساعة (14:30)"}
            </option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">
            {t("weekStart") || "بداية الأسبوع"}
          </label>
          <select
            className="form-select"
            value={timezoneForm.start_of_week || "sunday"}
            onChange={(e) =>
              setTimezoneForm({
                ...timezoneForm,
                start_of_week: e.target.value,
              })
            }
            disabled={!canEdit}
          >
            <option value="sunday">{t("daySunday") || "الأحد"}</option>
            <option value="monday">{t("dayMonday") || "الإثنين"}</option>
            <option value="saturday">{t("daySaturday") || "السبت"}</option>
          </select>
        </div>
      </div>

      {canEdit && (
        <div
          style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}
        >
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? (
              <>
                <span
                  className="spinner spinner-sm"
                  style={{ borderTopColor: "#fff" }}
                />
                {t("saving")}
              </>
            ) : (
              t("saveChanges")
            )}
          </button>
        </div>
      )}
    </form>
  );
}
