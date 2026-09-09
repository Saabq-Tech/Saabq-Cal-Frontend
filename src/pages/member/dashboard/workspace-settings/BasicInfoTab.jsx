import { useState, useEffect } from "react";
import { useLanguage } from "../../../../context/LanguageContext";
import client, { endpoints } from "../../../../api/client";
import SearchableSelect from "../../../../components/common/SearchableSelect";
import Icon from "../../../../components/common/Icon";
import RichTextEditor from "../../../../components/common/RichTextEditor";
import Flag from "../../../../components/common/Flag";

export default function BasicInfoTab({
  basicForm,
  setBasicForm,
  workspaceTypes = [],
  countries = [],
  onSave,
  saving,
  canEdit,
}) {
  const { t, lang } = useLanguage();
  const [descLang, setDescLang] = useState("ar");
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);

  // Helper to safely extract string from string or localized object
  const getLabelValue = (val) => {
    if (val === null || val === undefined) return "";
    if (typeof val === "string" || typeof val === "number") return String(val);
    if (typeof val === "object") {
      const res = val[lang] || val.ar || val.en || val.name || val.title || "";
      return typeof res === "string" || typeof res === "number"
        ? String(res)
        : "";
    }
    return "";
  };

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

      {/* Row 1: Name & Slug (50% each) */}
      <div
        className="form-row grid grid-2"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
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
              (typeof basicForm.name === "string"
                ? basicForm.name.toLowerCase().replace(/\s+/g, "-")
                : "") ||
              "ag"
            }
            onChange={(e) =>
              setBasicForm({ ...basicForm, slug: e.target.value })
            }
            placeholder={t("slugPlaceholder") || "workspace-slug"}
            disabled={!canEdit}
          />
        </div>
      </div>

      {/* Row 2: Type & Status (50% each) */}
      <div
        className="form-row grid grid-2"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 16,
          marginBottom: 16,
        }}
      >
        <div className="form-group">
          <label className="form-label">
            {t("industryCategoryLabel") || "النوع / المجال (التخصص)"}
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
            <option value="active">{t("statusActiveLabel") || "نشط"}</option>
            <option value="inactive">
              {t("statusInactiveLabel") || "غير نشط"}
            </option>
            <option value="suspended">
              {t("statusSuspendedLabel") || "معلق"}
            </option>
          </select>
        </div>
      </div>

      {/* Tagline / Short Intro */}
      <div className="form-group">
        <label className="form-label">
          {t("bookingShortIntro") || "نبذة مختصرة"}
        </label>
        <input
          type="text"
          className="form-input"
          value={getLabelValue(basicForm.booking_short_intro)}
          onChange={(e) =>
            setBasicForm({ ...basicForm, booking_short_intro: e.target.value })
          }
          disabled={!canEdit}
          placeholder={
            t("bookingShortIntroPlaceholder") ||
            "مثال: عيادة طبية متخصصة تقدم أحدث الاستشارات والرعاية الشاملة."
          }
        />
      </div>

      {/* Row 2: Bio / Description */}
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
            {t("workspaceBioLabel") || "نبذة عن مساحة العمل"}
          </label>

          {/* Language Toggle Pills */}
          <div style={{ display: "flex", gap: 6 }}>
            <button
              type="button"
              onClick={() => setDescLang("ar")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "5px 12px",
                borderRadius: 14,
                fontSize: "0.78rem",
                fontWeight: descLang === "ar" ? 700 : 500,
                border:
                  descLang === "ar"
                    ? "1.5px solid var(--primary)"
                    : "1px solid var(--border)",
                background:
                  descLang === "ar" ? "var(--primary)" : "var(--surface)",
                color: descLang === "ar" ? "#ffffff" : "var(--text-secondary)",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              <Flag
                country="eg"
                style={{ width: 18, height: 12, borderRadius: 2 }}
              />
              <span>{t("arabic") || "بالعربية"}</span>
            </button>
            <button
              type="button"
              onClick={() => setDescLang("en")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "5px 12px",
                borderRadius: 14,
                fontSize: "0.78rem",
                fontWeight: descLang === "en" ? 700 : 500,
                border:
                  descLang === "en"
                    ? "1.5px solid var(--primary)"
                    : "1px solid var(--border)",
                background:
                  descLang === "en" ? "var(--primary)" : "var(--surface)",
                color: descLang === "en" ? "#ffffff" : "var(--text-secondary)",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              <Flag
                country="us"
                style={{ width: 18, height: 12, borderRadius: 2 }}
              />
              <span>{t("english") || "بالإنجليزية"}</span>
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

      {/* Customer Terminology & Icon & Explorer Visibility Section */}
      <div
        style={{
          background: "var(--surface-alt)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg, 12px)",
          padding: 24,
          marginBottom: 24,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 6,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: "rgba(2, 105, 130, 0.12)",
              color: "var(--primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon name={basicForm.customer_icon || "users"} size={20} />
          </div>
          <div>
            <h4
              style={{
                margin: 0,
                fontSize: "1.1rem",
                fontWeight: 800,
                color: "var(--heading)",
              }}
            >
              {t("customerLabelSectionTitle") ||
                "مسمى وأيقونة العملاء في مساحة العمل"}
            </h4>
            <p
              style={{
                margin: "2px 0 0 0",
                fontSize: "0.82rem",
                color: "var(--text-secondary)",
              }}
            >
              {t("customerLabelSectionDesc") ||
                "تخصيص المسمى والأيقونة الخاصة بالعملاء لتناسب تخصص مساحة العمل (عيادة: مرضى، أكاديمية: طلاب، مكتب: موكلون)."}
            </p>
          </div>
        </div>

        {/* Available Customer Icons Picker */}
        <div style={{ marginTop: 18, marginBottom: 20 }}>
          <label
            className="form-label"
            style={{ fontWeight: 700, marginBottom: 8 }}
          >
            {t("customerIconLabel") || "أيقونة العملاء في القائمة والواجهة"}
          </label>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(95px, 1fr))",
              gap: 10,
            }}
          >
            {[
              {
                id: "users",
                label_ar: "عملاء",
                label_en: "Clients",
              },
              {
                id: "stethoscope",
                label_ar: "مرضى",
                label_en: "Patients",
              },
              {
                id: "graduation-cap",
                label_ar: "طلاب",
                label_en: "Students",
              },
              {
                id: "briefcase",
                label_ar: "موكلون",
                label_en: "Clients",
              },
              {
                id: "heart",
                label_ar: "صحة",
                label_en: "Health",
              },
              {
                id: "activity",
                label_ar: "أبطال",
                label_en: "Fitness",
              },
              {
                id: "smile",
                label_ar: "أطفال/أسنان",
                label_en: "Smile",
              },
              {
                id: "star",
                label_ar: "VIP / مميز",
                label_en: "VIP",
              },
              {
                id: "award",
                label_ar: "متدربون",
                label_en: "Trainees",
              },
              {
                id: "building",
                label_ar: "شركات",
                label_en: "Corporate",
              },
              {
                id: "user-check",
                label_ar: "مشتركون",
                label_en: "Members",
              },
              {
                id: "user",
                label_ar: "فردي",
                label_en: "Personal",
              },
            ].map((ico) => {
              const isSelected =
                (basicForm.customer_icon || "users") === ico.id;
              const icoLabel = lang === "ar" ? ico.label_ar : ico.label_en;
              return (
                <button
                  key={ico.id}
                  type="button"
                  onClick={() =>
                    canEdit &&
                    setBasicForm({ ...basicForm, customer_icon: ico.id })
                  }
                  className={`btn ${isSelected ? "btn-primary" : "btn-secondary"}`}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    padding: "10px 8px",
                    borderRadius: "var(--radius-md, 10px)",
                    border: isSelected
                      ? "2px solid var(--primary)"
                      : "1px solid var(--border)",
                    background: isSelected
                      ? "var(--primary-subtle, rgba(59, 130, 246, 0.1))"
                      : "var(--surface)",
                    color: isSelected ? "var(--primary)" : "var(--text-main)",
                    cursor: canEdit ? "pointer" : "default",
                    transition: "all 0.2s ease",
                  }}
                >
                  <Icon
                    name={ico.id}
                    size={22}
                    style={{
                      color: isSelected
                        ? "var(--primary)"
                        : "var(--text-muted)",
                    }}
                  />
                  <span
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: isSelected ? 700 : 500,
                    }}
                  >
                    {icoLabel}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Customer Terminology Labels (AR / EN) */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 16,
            marginBottom: 20,
          }}
        >
          <div className="form-group">
            <label className="form-label">
              {t("customerLabelSingularAr") || "مسمى العميل مفرد (عربي)"}
            </label>
            <input
              type="text"
              className="form-input"
              value={
                typeof basicForm.customer_label_singular === "object"
                  ? basicForm.customer_label_singular?.ar || ""
                  : basicForm.customer_label_singular || ""
              }
              onChange={(e) =>
                setBasicForm({
                  ...basicForm,
                  customer_label_singular:
                    typeof basicForm.customer_label_singular === "object"
                      ? {
                          ...basicForm.customer_label_singular,
                          ar: e.target.value,
                        }
                      : { ar: e.target.value, en: "" },
                })
              }
              placeholder={
                lang === "ar"
                  ? "مثال: مريض، طالب، موكل"
                  : "e.g. Patient, Student, Client"
              }
              disabled={!canEdit}
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              {t("customerLabelSingularEn") || "مسمى العميل مفرد (English)"}
            </label>
            <input
              type="text"
              className="form-input"
              value={
                typeof basicForm.customer_label_singular === "object"
                  ? basicForm.customer_label_singular?.en || ""
                  : ""
              }
              onChange={(e) =>
                setBasicForm({
                  ...basicForm,
                  customer_label_singular:
                    typeof basicForm.customer_label_singular === "object"
                      ? {
                          ...basicForm.customer_label_singular,
                          en: e.target.value,
                        }
                      : {
                          ar: basicForm.customer_label_singular || "",
                          en: e.target.value,
                        },
                })
              }
              placeholder="e.g. Patient, Student, Client"
              disabled={!canEdit}
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              {t("customerLabelPluralAr") || "مسمى العملاء جمع (عربي)"}
            </label>
            <input
              type="text"
              className="form-input"
              value={
                typeof basicForm.customer_label_plural === "object"
                  ? basicForm.customer_label_plural?.ar || ""
                  : basicForm.customer_label_plural || ""
              }
              onChange={(e) =>
                setBasicForm({
                  ...basicForm,
                  customer_label_plural:
                    typeof basicForm.customer_label_plural === "object"
                      ? {
                          ...basicForm.customer_label_plural,
                          ar: e.target.value,
                        }
                      : { ar: e.target.value, en: "" },
                })
              }
              placeholder={
                lang === "ar"
                  ? "مثال: مرضى، طلاب، موكلون"
                  : "e.g. Patients, Students, Clients"
              }
              disabled={!canEdit}
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              {t("customerLabelPluralEn") || "مسمى العملاء جمع (English)"}
            </label>
            <input
              type="text"
              className="form-input"
              value={
                typeof basicForm.customer_label_plural === "object"
                  ? basicForm.customer_label_plural?.en || ""
                  : ""
              }
              onChange={(e) =>
                setBasicForm({
                  ...basicForm,
                  customer_label_plural:
                    typeof basicForm.customer_label_plural === "object"
                      ? {
                          ...basicForm.customer_label_plural,
                          en: e.target.value,
                        }
                      : {
                          ar: basicForm.customer_label_plural || "",
                          en: e.target.value,
                        },
                })
              }
              placeholder="e.g. Patients, Students, Clients"
              disabled={!canEdit}
            />
          </div>
        </div>

        {/* Live Preview Box */}
        <div
          style={{
            background: "var(--surface)",
            border: "1px dashed var(--primary)",
            borderRadius: 10,
            padding: "12px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
            marginBottom: 16,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span
              style={{
                fontSize: "0.78rem",
                color: "var(--text-secondary)",
                fontWeight: 600,
              }}
            >
              {t("navigationPreview") || "معاينة زر القائمة:"}
            </span>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 14px",
                borderRadius: 8,
                background: "rgba(2, 105, 130, 0.1)",
                color: "var(--primary)",
                fontWeight: 700,
                fontSize: "0.85rem",
              }}
            >
              <Icon name={basicForm.customer_icon || "users"} size={18} />
              <span>
                {getLabelValue(basicForm.customer_label_plural) ||
                  t("navCustomers") ||
                  "العملاء"}
              </span>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                fontSize: "0.78rem",
                color: "var(--text-secondary)",
                fontWeight: 600,
              }}
            >
              {t("buttonPreview") || "معاينة زر الإضافة:"}
            </span>
            <div
              className="btn btn-primary"
              style={{
                padding: "5px 12px",
                fontSize: "0.8rem",
                borderRadius: 6,
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                pointerEvents: "none",
              }}
            >
              <Icon name="plus" size={14} />
              <span>
                {(t("addCustomerPrefix") || "إضافة") +
                  " " +
                  (getLabelValue(basicForm.customer_label_singular) ||
                    t("customerSingle") ||
                    "عميل")}
              </span>
            </div>
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

      {/* Row 3: Email & Phone (50% each) */}
      <div
        className="form-row grid grid-2"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
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
      </div>

      {/* Row 4: Country, State, City (3 equal columns) */}
      <div
        className="form-row grid grid-3"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 16,
          marginBottom: 24,
        }}
      >
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
