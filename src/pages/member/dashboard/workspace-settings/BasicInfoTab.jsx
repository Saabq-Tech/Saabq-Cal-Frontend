import { useState, useEffect } from "react";
import { useLanguage } from "../../../../context/LanguageContext";
import client, { endpoints } from "../../../../api/client";
import SearchableSelect from "../../../../components/common/SearchableSelect";
import Icon from "../../../../components/common/Icon";
import RichTextEditor from "../../../../components/common/RichTextEditor";

export default function BasicInfoTab({
  basicForm,
  setBasicForm,
  workspaceTypes = [],
  countries = [],
  onSave,
  saving,
  canEdit,
}) {
  const { t } = useLanguage();
  const [descLang, setDescLang] = useState("ar");
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);

  // Fetch states when country_id changes
  useEffect(() => {
    if (!basicForm.country_id) {
      setStates([]);
      return;
    }
    let isMounted = true;
    setLoadingStates(true);
    client
      .get(endpoints.statesByCountry(basicForm.country_id))
      .then((res) => {
        if (isMounted && res.data?.data && Array.isArray(res.data.data)) {
          setStates(res.data.data);
        }
      })
      .catch(() => {
        if (isMounted) setStates([]);
      })
      .finally(() => {
        if (isMounted) setLoadingStates(false);
      });
    return () => {
      isMounted = false;
    };
  }, [basicForm.country_id]);

  // Fetch cities when state_id changes
  useEffect(() => {
    if (!basicForm.state_id) {
      setCities([]);
      return;
    }
    let isMounted = true;
    setLoadingCities(true);
    client
      .get(endpoints.citiesByState(basicForm.state_id))
      .then((res) => {
        if (isMounted && res.data?.data && Array.isArray(res.data.data)) {
          setCities(res.data.data);
        }
      })
      .catch(() => {
        if (isMounted) setCities([]);
      })
      .finally(() => {
        if (isMounted) setLoadingCities(false);
      });
    return () => {
      isMounted = false;
    };
  }, [basicForm.state_id]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(basicForm);
  };

  const typeOptions = workspaceTypes.map((wt) => ({
    value: wt.id,
    label: wt.name,
  }));
  const countryOptions = countries.map((c) => ({ value: c.id, label: c.name }));
  const stateOptions = states.map((s) => ({ value: s.id, label: s.name }));
  const cityOptions = cities.map((ci) => ({ value: ci.id, label: ci.name }));

  return (
    <form className="card-body" onSubmit={handleSubmit}>
      {/* Header with Circle Icon Badge & Subtitle */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: 24,
          paddingBottom: 16,
          borderBottom: "1px solid var(--border-light)",
        }}
      >
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 4,
            }}
          >
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: "50%",
                background: "var(--primary-subtle)",
                color: "var(--primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon name="custom-34f286e2" size={18} />
            </div>
            <h3
              style={{
                fontSize: "1.2rem",
                fontWeight: 800,
                margin: 0,
                color: "var(--heading)",
              }}
            >
              {t("workspaceBasicInfo") || "المعلومات الأساسية"}
            </h3>
          </div>
          <p
            style={{
              color: "var(--text-secondary)",
              fontSize: "0.86rem",
              margin: 0,
            }}
          >
            {t("workspaceBasicInfoDesc") ||
              "تعديل تفاصيل مساحة العمل الأساسية، بيانات التواصل، والموقع الجغرافي."}
          </p>
        </div>
      </div>

      {/* Row 1: Name, Slug (with Badge), Status */}
      <div
        className="form-row"
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fill, minmax(min(100%, 200px), 1fr))",
          gap: 16,
          marginBottom: 16,
        }}
      >
        <div className="form-group">
          <label className="form-label">
            {t("workspaceName") || "اسم مساحة العمل"} *
          </label>
          <input
            type="text"
            className="form-input"
            value={basicForm.name || ""}
            onChange={(e) =>
              setBasicForm({ ...basicForm, name: e.target.value })
            }
            required
            disabled={!canEdit}
          />
        </div>

        <div className="form-group">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 6,
            }}
          >
            <label className="form-label" style={{ marginBottom: 0 }}>
              {t("workspaceSlugLabel") || "الرابط المختصر (Slug)"} *
            </label>
            <span
              style={{
                fontSize: "0.72rem",
                background: "#e6f7ef",
                color: "#107c41",
                padding: "2px 8px",
                borderRadius: 12,
                fontWeight: 700,
                display: "inline-flex",
                alignItems: "center",
                gap: 3,
              }}
            >
              <Icon name="check" size={10} />
              {t("slugAvailable") || "متاح"}
            </span>
          </div>
          <input
            type="text"
            className="form-input"
            value={
              basicForm.slug ||
              basicForm.name?.toLowerCase().replace(/\s+/g, "-") ||
              "ag"
            }
            onChange={(e) =>
              setBasicForm({ ...basicForm, slug: e.target.value })
            }
            placeholder={t("slugPlaceholder") || "workspace-slug"}
            disabled={!canEdit}
          />
        </div>

        <div className="form-group">
          <label className="form-label">
            {t("workspaceStatusLabel") || "حالة مساحة العمل"}
          </label>
          <select
            className="form-select"
            value={basicForm.status || "active"}
            onChange={(e) =>
              setBasicForm({ ...basicForm, status: e.target.value })
            }
            disabled={!canEdit}
          >
            <option value="active">
              {t("statusActiveLabel") || "نشط (Active)"}
            </option>
            <option value="inactive">
              {t("statusInactiveLabel") || "غير نشط (Inactive)"}
            </option>
            <option value="suspended">
              {t("statusSuspendedLabel") || "معلق (Suspended)"}
            </option>
          </select>
        </div>
      </div>

      {/* Row 2: Bio / Description (Rich Text HTML Translatable Editor) */}
      <div className="form-group" style={{ marginBottom: 24 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 8,
          }}
        >
          <label
            className="form-label"
            style={{ marginBottom: 0, fontWeight: 700 }}
          >
            {t("workspaceBioLabel") || "نبذة عن مساحة العمل (وصف HTML غني)"}
          </label>

          {/* Language Toggle Pills */}
          <div style={{ display: "flex", gap: 6 }}>
            <button
              type="button"
              onClick={() => setDescLang("ar")}
              style={{
                padding: "4px 10px",
                borderRadius: 14,
                fontSize: "0.76rem",
                fontWeight: descLang === "ar" ? 700 : 500,
                border:
                  descLang === "ar"
                    ? "1px solid var(--primary)"
                    : "1px solid var(--border-light)",
                background:
                  descLang === "ar" ? "var(--primary)" : "transparent",
                color: descLang === "ar" ? "#fff" : "var(--text-secondary)",
                cursor: "pointer",
              }}
            >
              🇸🇦 {t("arabic") || "بالعربية"}
            </button>
            <button
              type="button"
              onClick={() => setDescLang("en")}
              style={{
                padding: "4px 10px",
                borderRadius: 14,
                fontSize: "0.76rem",
                fontWeight: descLang === "en" ? 700 : 500,
                border:
                  descLang === "en"
                    ? "1px solid var(--primary)"
                    : "1px solid var(--border-light)",
                background:
                  descLang === "en" ? "var(--primary)" : "transparent",
                color: descLang === "en" ? "#fff" : "var(--text-secondary)",
                cursor: "pointer",
              }}
            >
              🇬🇧 {t("english") || "بالإنجليزية"}
            </button>
          </div>
        </div>

        {descLang === "ar" ? (
          <RichTextEditor
            key="desc-ar"
            value={
              typeof basicForm.description === "object"
                ? basicForm.description?.ar || ""
                : basicForm.description || ""
            }
            onChange={(val) =>
              setBasicForm({
                ...basicForm,
                description:
                  typeof basicForm.description === "object"
                    ? { ...basicForm.description, ar: val }
                    : { ar: val, en: "" },
              })
            }
            disabled={!canEdit}
            minHeight={220}
            placeholder={t("placeholderDescAr")}
          />
        ) : (
          <RichTextEditor
            key="desc-en"
            value={
              typeof basicForm.description === "object"
                ? basicForm.description?.en || ""
                : ""
            }
            onChange={(val) =>
              setBasicForm({
                ...basicForm,
                description:
                  typeof basicForm.description === "object"
                    ? { ...basicForm.description, en: val }
                    : { ar: basicForm.description || "", en: val },
              })
            }
            disabled={!canEdit}
            minHeight={220}
            placeholder={t("placeholderDescEn")}
          />
        )}
      </div>

      {/* Customer Terminology & Explorer Visibility Section */}
      <div
        style={{
          background: "var(--background-subtle, #f8fafc)",
          border: "1px solid var(--border-light, #e2e8f0)",
          borderRadius: "var(--radius-lg, 12px)",
          padding: 20,
          marginBottom: 24,
        }}
      >
        <h4
          style={{ margin: "0 0 4px 0", fontSize: "1.05rem", fontWeight: 800 }}
        >
          {t("customerLabelSectionTitle") ||
            "مسمى العملاء والظهور في الاستكشاف"}
        </h4>
        <p
          style={{
            margin: "0 0 16px 0",
            fontSize: "0.84rem",
            color: "var(--text-secondary)",
          }}
        >
          {t("customerLabelSectionDesc") ||
            "تخصيص المسمى الخـاص بالعملاء في هذه مساحة العمل (مثلاً: مرضى، طلاب، عملاء) وإعدادات الظهور في البحث العام."}
        </p>

        <div
          className="form-row"
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(min(100%, 220px), 1fr))",
            gap: 16,
            marginBottom: 16,
          }}
        >
          <div className="form-group">
            <label className="form-label">
              {t("customerLabelSingularLabel") || "مسمى العميل (مفرد)"}
            </label>
            <input
              type="text"
              className="form-input"
              value={basicForm.customer_label_singular || ""}
              onChange={(e) =>
                setBasicForm({
                  ...basicForm,
                  customer_label_singular: e.target.value,
                })
              }
              placeholder={
                t("customerLabelSingularPlaceholder") ||
                "مثال: مريض، طالب، عميل"
              }
              disabled={!canEdit}
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              {t("customerLabelPluralLabel") || "مسمى العملاء (جمع)"}
            </label>
            <input
              type="text"
              className="form-input"
              value={basicForm.customer_label_plural || ""}
              onChange={(e) =>
                setBasicForm({
                  ...basicForm,
                  customer_label_plural: e.target.value,
                })
              }
              placeholder={
                t("customerLabelPluralPlaceholder") || "مثال: مرضى، طلاب، عملاء"
              }
              disabled={!canEdit}
            />
          </div>
        </div>

        {/* Explorer Visibility Toggle Switch */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: 14,
            borderTop: "1px solid var(--border-light, #e2e8f0)",
          }}
        >
          <div>
            <div
              style={{ fontWeight: 700, fontSize: "0.9rem", marginBottom: 2 }}
            >
              {t("showInExplorerLabel") ||
                "إظهار مساحة العمل في صفحة الاستكشاف والبحث العام"}
            </div>
            <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
              {t("showInExplorerHelp") ||
                "عند تعطيل هذا الخيار، لن تظهر مساحة العمل وخدماتها في البحث العام، ولكن يمكن الوصول إليها عبر الرابط المباشر."}
            </div>
          </div>
          <label
            style={{
              position: "relative",
              display: "inline-block",
              width: 44,
              height: 24,
              cursor: canEdit ? "pointer" : "not-allowed",
              flexShrink: 0,
            }}
          >
            <input
              type="checkbox"
              checked={basicForm.is_visible_in_explorer !== false}
              onChange={(e) =>
                setBasicForm({
                  ...basicForm,
                  is_visible_in_explorer: e.target.checked,
                })
              }
              disabled={!canEdit}
              style={{ opacity: 0, width: 0, height: 0 }}
            />
            <span
              style={{
                position: "absolute",
                inset: 0,
                backgroundColor:
                  basicForm.is_visible_in_explorer !== false
                    ? "var(--primary, #0a9099)"
                    : "#cbd5e1",
                borderRadius: 24,
                transition: "0.3s",
              }}
            >
              <span
                style={{
                  position: "absolute",
                  content: '""',
                  height: 18,
                  width: 18,
                  left: basicForm.is_visible_in_explorer !== false ? 22 : 3,
                  bottom: 3,
                  backgroundColor: "#fff",
                  borderRadius: "50%",
                  transition: "0.3s",
                }}
              />
            </span>
          </label>
        </div>
      </div>

      {/* Row 3: Email, Phone, Website */}
      <div
        className="form-row"
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fill, minmax(min(100%, 200px), 1fr))",
          gap: 16,
          marginBottom: 16,
        }}
      >
        <div className="form-group">
          <label className="form-label">
            {t("emailAddressLabel") || t("emailAddress") || "البريد الإلكتروني"}
          </label>
          <input
            type="email"
            className="form-input"
            value={basicForm.email || ""}
            onChange={(e) =>
              setBasicForm({ ...basicForm, email: e.target.value })
            }
            disabled={!canEdit}
          />
        </div>

        <div className="form-group">
          <label className="form-label">
            {t("phoneNumberLabel") || t("phoneNumber") || "رقم الهاتف"}
          </label>
          <input
            type="tel"
            className="form-input"
            value={basicForm.phone || ""}
            onChange={(e) =>
              setBasicForm({ ...basicForm, phone: e.target.value })
            }
            placeholder="+966 5XX XXX XXXX"
            disabled={!canEdit}
          />
        </div>

        <div className="form-group">
          <label className="form-label">
            {t("websiteUrlLabel") || "الموقع الإلكتروني"}
          </label>
          <input
            type="url"
            className="form-input"
            value={basicForm.website || ""}
            onChange={(e) =>
              setBasicForm({ ...basicForm, website: e.target.value })
            }
            placeholder="https://example.com"
            disabled={!canEdit}
          />
        </div>
      </div>

      {/* Row 4: Type, Country, State, City */}
      <div
        className="form-row"
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fill, minmax(min(100%, 200px), 1fr))",
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div className="form-group">
          <label className="form-label">
            {t("industryCategoryLabel") || "النوع / المجال"}
          </label>
          <SearchableSelect
            value={basicForm.workspace_type_id}
            options={typeOptions}
            placeholder={
              t("selectWorkspaceType") || "-- اختر النوع / المجال --"
            }
            searchPlaceholder={t("searchWorkspaceType") || "بحث في المجالات..."}
            disabled={!canEdit}
            onChange={(selectedVal) =>
              setBasicForm({
                ...basicForm,
                workspace_type_id: selectedVal ? Number(selectedVal) : "",
              })
            }
          />
        </div>

        <div className="form-group">
          <label className="form-label">{t("countryLabel") || "الدولة"}</label>
          <SearchableSelect
            value={basicForm.country_id}
            options={countryOptions}
            placeholder={t("selectCountry") || "-- اختر الدولة --"}
            searchPlaceholder={t("searchCountries") || "بحث في الدول..."}
            disabled={!canEdit}
            onChange={(selectedVal) =>
              setBasicForm({
                ...basicForm,
                country_id: selectedVal ? Number(selectedVal) : "",
                state_id: "",
                city_id: "",
              })
            }
          />
        </div>

        <div className="form-group">
          <label className="form-label">
            {t("stateProvinceLabel") || "المنطقة / المحافظة"}
          </label>
          <SearchableSelect
            value={basicForm.state_id}
            options={stateOptions}
            placeholder={
              loadingStates
                ? t("loading") || "جاري التحميل..."
                : t("selectState") || "-- اختر المنطقة / المحافظة --"
            }
            searchPlaceholder={t("searchStates") || "بحث في المناطق..."}
            disabled={!canEdit || !basicForm.country_id || loadingStates}
            onChange={(selectedVal) =>
              setBasicForm({
                ...basicForm,
                state_id: selectedVal ? Number(selectedVal) : "",
                city_id: "",
              })
            }
          />
        </div>

        <div className="form-group">
          <label className="form-label">{t("cityLabel") || "المدينة"}</label>
          <SearchableSelect
            value={basicForm.city_id}
            options={cityOptions}
            placeholder={
              loadingCities
                ? t("loading") || "جاري التحميل..."
                : t("selectCity") || "-- اختر المدينة --"
            }
            searchPlaceholder={t("searchCities") || "بحث في المدن..."}
            disabled={!canEdit || !basicForm.state_id || loadingCities}
            onChange={(selectedVal) =>
              setBasicForm({
                ...basicForm,
                city_id: selectedVal ? Number(selectedVal) : "",
              })
            }
          />
        </div>
      </div>

      {canEdit && (
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 12,
            paddingTop: 16,
            borderTop: "1px solid var(--border-light)",
          }}
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
              t("saveChanges") || "حفظ التغييرات"
            )}
          </button>
        </div>
      )}
    </form>
  );
}
