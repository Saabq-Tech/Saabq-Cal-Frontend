import { useRef, useState } from "react";
import { useLanguage } from "../../../../context/LanguageContext";
import Icon from "../../../../components/common/Icon";
import LazyImage from "../../../../components/ui/LazyImage";

function ColorField({
  label,
  description,
  value,
  defaultValue = "",
  onChange,
  canEdit,
  optional = false,
}) {
  const { t, isRTL } = useLanguage();
  const displayVal = value || defaultValue || "";
  const hasCustomValue = Boolean(value);

  return (
    <div
      style={{
        background: "var(--surface)",
        padding: "12px 14px",
        borderRadius: "var(--radius-md)",
        border: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <label
          style={{
            fontSize: "0.82rem",
            fontWeight: 700,
            color: "var(--heading)",
            margin: 0,
          }}
        >
          {label}
        </label>
        {optional && hasCustomValue && canEdit && (
          <button
            type="button"
            onClick={() => onChange("")}
            title={
              t("resetToDefault") ||
              (isRTL ? "إعادة تعيين للافتراضي" : "Reset to default")
            }
            style={{
              background: "transparent",
              border: "none",
              color: "var(--muted)",
              cursor: "pointer",
              fontSize: "0.74rem",
              padding: "2px 4px",
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <Icon name="rotate-ccw" size={12} />
            <span>{t("reset") || (isRTL ? "إعادة ضبط" : "Reset")}</span>
          </button>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div
          style={{
            position: "relative",
            width: 36,
            height: 36,
            borderRadius: 8,
            border: "1px solid var(--border)",
            background: displayVal || "var(--surface-alt)",
            flexShrink: 0,
            overflow: "hidden",
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          }}
        >
          <input
            type="color"
            value={
              displayVal.startsWith("#") && displayVal.length >= 7
                ? displayVal.slice(0, 7)
                : defaultValue || "#026982"
            }
            onChange={(e) => onChange(e.target.value)}
            disabled={!canEdit}
            style={{
              opacity: 0,
              width: "100%",
              height: "100%",
              cursor: canEdit ? "pointer" : "default",
            }}
          />
        </div>
        <input
          type="text"
          className="form-input"
          placeholder={defaultValue || "#------"}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          disabled={!canEdit}
          style={{
            fontFamily: "monospace",
            direction: "ltr",
            textAlign: "center",
            height: 36,
            fontSize: "0.85rem",
            flex: 1,
          }}
        />
      </div>
      {description && (
        <span
          style={{
            fontSize: "0.72rem",
            color: "var(--text-secondary)",
            lineHeight: 1.3,
          }}
        >
          {description}
        </span>
      )}
    </div>
  );
}

export default function BrandingTab({
  brandingForm,
  setBrandingForm,
  onSave,
  saving,
  canEdit,
}) {
  const { t, isRTL } = useLanguage();
  const galleryInputRef = useRef(null);
  const [previewMode, setPreviewMode] = useState("light");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(brandingForm);
  };

  const handleGalleryUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const readPromises = files.map((file) => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const url = event.target?.result;
          resolve(url ? { url, caption: "" } : null);
        };
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(file);
      });
    });

    const newItems = (await Promise.all(readPromises)).filter(Boolean);
    if (newItems.length > 0) {
      setBrandingForm((prev) => {
        const current = Array.isArray(prev.gallery_urls)
          ? prev.gallery_urls
          : [];
        return {
          ...prev,
          gallery_urls: [...current, ...newItems],
        };
      });
    }

    e.target.value = "";
  };

  const handleFileChange = (field, e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setBrandingForm((prev) => ({
          ...prev,
          [field]: event.target.result,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const getFieldValue = (urlKey, altKey) =>
    brandingForm[urlKey] || brandingForm[altKey] || "";

  return (
    <form className="card-body" onSubmit={handleSubmit} style={{ gap: 24 }}>
      {/* Header */}
      <div
        style={{
          borderBottom: "1px solid var(--border-light)",
          paddingBottom: 12,
        }}
      >
        <h3
          style={{
            fontSize: "1.1rem",
            fontWeight: 800,
            margin: "0 0 4px",
            color: "var(--heading)",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Icon
            name="custom-ecd73178"
            size={20}
            style={{ color: "var(--primary)" }}
          />
          {t("brandingAndIdentity") || "الهوية والعلامة التجارية"}
        </h3>
        <p
          style={{
            fontSize: "0.84rem",
            color: "var(--text-secondary)",
            margin: 0,
          }}
        >
          {t("brandingAndIdentityDesc") ||
            "الأسماء، والشعار والألوان التي تظهر في لوحة التحكم والبوابة والإيميلات والمستندات."}
        </p>
      </div>

      {/* 3 Upload Cards (Logo, Cover, Favicon) - 3 Columns Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 16,
        }}
      >
        {/* Logo Card */}
        <div
          style={{
            padding: 18,
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--border-light)",
            background: "var(--surface-alt)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            gap: 14,
          }}
        >
          <span
            style={{
              fontSize: "0.86rem",
              fontWeight: 800,
              color: "var(--heading)",
              display: "block",
            }}
          >
            {t("logo") || "شعار التطبيق (الفاتح)"}
          </span>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 10,
            }}
          >
            {getFieldValue("logo_url", "logo") ? (
              <img
                src={getFieldValue("logo_url", "logo")}
                alt="Logo"
                style={{
                  height: 44,
                  maxWidth: 90,
                  objectFit: "contain",
                  borderRadius: 8,
                  border: "1px solid var(--border)",
                  background: "#fff",
                  padding: 4,
                }}
              />
            ) : (
              <div
                style={{
                  width: 64,
                  height: 42,
                  borderRadius: 8,
                  border: "1px dashed var(--border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--muted)",
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  background: "var(--surface)",
                }}
              >
                {t("noneBadge") || "بدون"}
              </div>
            )}
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <label
                style={{
                  padding: "6px 14px",
                  borderRadius: "var(--radius-md)",
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  color: "var(--heading)",
                  cursor: canEdit ? "pointer" : "default",
                  transition: "all 0.15s ease",
                }}
              >
                {t("replaceBtn") || "استبدال"}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange("logo_url", e)}
                  hidden
                  disabled={!canEdit}
                />
              </label>
              {getFieldValue("logo_url", "logo") && (
                <button
                  type="button"
                  onClick={() =>
                    setBrandingForm({ ...brandingForm, logo_url: "", logo: "" })
                  }
                  style={{
                    padding: "6px 8px",
                    borderRadius: 8,
                    border: "none",
                    background: "transparent",
                    color: "#ef4444",
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                  disabled={!canEdit}
                >
                  {t("removeBtn") || "إزالة"}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Cover Image Card */}
        <div
          style={{
            padding: 18,
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--border-light)",
            background: "var(--surface-alt)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            gap: 14,
          }}
        >
          <span
            style={{
              fontSize: "0.86rem",
              fontWeight: 800,
              color: "var(--heading)",
              display: "block",
            }}
          >
            {t("coverImage") || "صورة الغلاف"}
          </span>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 10,
            }}
          >
            {getFieldValue("cover_url", "cover") ? (
              <img
                src={getFieldValue("cover_url", "cover")}
                alt="Cover"
                style={{
                  height: 44,
                  width: 80,
                  objectFit: "cover",
                  borderRadius: 8,
                  border: "1px solid var(--border)",
                  background: "#fff",
                  padding: 2,
                }}
              />
            ) : (
              <div
                style={{
                  width: 64,
                  height: 42,
                  borderRadius: 8,
                  border: "1px dashed var(--border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--muted)",
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  background: "var(--surface)",
                }}
              >
                {t("noneBadge") || "بدون"}
              </div>
            )}
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <label
                style={{
                  padding: "6px 14px",
                  borderRadius: "var(--radius-md)",
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  color: "var(--heading)",
                  cursor: canEdit ? "pointer" : "default",
                  transition: "all 0.15s ease",
                }}
              >
                {t("replaceBtn") || "استبدال"}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange("cover_url", e)}
                  hidden
                  disabled={!canEdit}
                />
              </label>
              {getFieldValue("cover_url", "cover") && (
                <button
                  type="button"
                  onClick={() =>
                    setBrandingForm({
                      ...brandingForm,
                      cover_url: "",
                      cover: "",
                    })
                  }
                  style={{
                    padding: "6px 8px",
                    borderRadius: 8,
                    border: "none",
                    background: "transparent",
                    color: "#ef4444",
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                  disabled={!canEdit}
                >
                  {t("removeBtn") || "إزالة"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Colors Section - 3 Columns Grid */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 14,
          marginTop: 8,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          <div>
            <h4
              style={{
                fontSize: "0.98rem",
                fontWeight: 800,
                color: "var(--heading)",
                margin: "0 0 4px",
              }}
            >
              {t("brandColorsSection") || "ألوان الهوية والعلامة التجارية"}
            </h4>
            <p
              style={{
                fontSize: "0.8rem",
                color: "var(--text-secondary)",
                margin: 0,
              }}
            >
              {t("brandColorsDesc") ||
                "تخصيص كامل للألوان الأساسية، ودرجات الوضع الفاتح والداكن لتعكس هويتك بدقة."}
            </p>
          </div>
        </div>

        {/* 1. Brand Palette */}
        <div style={{ marginTop: 8 }}>
          <h5
            style={{
              fontSize: "0.86rem",
              fontWeight: 800,
              color: "var(--heading)",
              marginBottom: 10,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: brandingForm.primary_color || "var(--primary)",
              }}
            />
            {t("brandPalette") || "ألوان الهوية الأساسية"}
          </h5>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 14,
            }}
          >
            <ColorField
              label={t("primaryColor") || "اللون الأساسي"}
              description={
                t("primaryColorDesc") ||
                "يُستخدم للأزرار الرئيسية، الروابط النشطة، وتفاصيل الهوية"
              }
              value={brandingForm.primary_color}
              defaultValue="#026982"
              onChange={(val) =>
                setBrandingForm({ ...brandingForm, primary_color: val })
              }
              canEdit={canEdit}
            />
            <ColorField
              label={t("secondaryColor") || "اللون الثانوي"}
              description={
                t("secondaryColorDesc") ||
                "يُستخدم للتدرجات والعناصر المكملة والبطاقات"
              }
              value={brandingForm.secondary_color}
              defaultValue="#033d4b"
              onChange={(val) =>
                setBrandingForm({ ...brandingForm, secondary_color: val })
              }
              canEdit={canEdit}
            />
            <ColorField
              label={t("hoverColor") || "لون التحويم والتفاعل"}
              description={
                t("hoverColorDesc") ||
                "يُستخدم عند التمرير على الأزرار والروابط التفاعلية"
              }
              value={brandingForm.hover_color}
              defaultValue="#034d60"
              onChange={(val) =>
                setBrandingForm({ ...brandingForm, hover_color: val })
              }
              canEdit={canEdit}
            />
            <ColorField
              label={t("accentColor") || "لون التمييز (Accent)"}
              description={
                t("accentColorDesc") ||
                "يُستخدم للنقاط البارزة والشارات والإشعارات"
              }
              value={brandingForm.accent_color}
              defaultValue="#2de2f2"
              onChange={(val) =>
                setBrandingForm({ ...brandingForm, accent_color: val })
              }
              canEdit={canEdit}
              optional
            />
          </div>
        </div>

        {/* 2. Light Mode Palette */}
        <div style={{ marginTop: 14 }}>
          <h5
            style={{
              fontSize: "0.86rem",
              fontWeight: 800,
              color: "var(--heading)",
              marginBottom: 10,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Icon name="sun" size={15} style={{ color: "#f59e0b" }} />
            {t("lightModePalette") || "ألوان الوضع الفاتح (Light Mode)"}
          </h5>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: 12,
            }}
          >
            <ColorField
              label={t("backgroundColorLight") || "لون الخلفية (فاتح)"}
              value={brandingForm.background_color_light}
              defaultValue="#f8fafc"
              onChange={(val) =>
                setBrandingForm({
                  ...brandingForm,
                  background_color_light: val,
                })
              }
              canEdit={canEdit}
              optional
            />
            <ColorField
              label={t("surfaceColorLight") || "لون البطاقات والحاويات (فاتح)"}
              value={brandingForm.surface_color_light}
              defaultValue="#ffffff"
              onChange={(val) =>
                setBrandingForm({
                  ...brandingForm,
                  surface_color_light: val,
                })
              }
              canEdit={canEdit}
              optional
            />
            <ColorField
              label={t("headingColorLight") || "لون العناوين (فاتح)"}
              value={brandingForm.heading_color_light}
              defaultValue="#022a35"
              onChange={(val) =>
                setBrandingForm({
                  ...brandingForm,
                  heading_color_light: val,
                })
              }
              canEdit={canEdit}
              optional
            />
            <ColorField
              label={t("textColorLight") || "لون النصوص (فاتح)"}
              value={brandingForm.text_color_light}
              defaultValue="#033d4b"
              onChange={(val) =>
                setBrandingForm({ ...brandingForm, text_color_light: val })
              }
              canEdit={canEdit}
              optional
            />
            <ColorField
              label={t("borderColorLight") || "لون الحدود والفواصل (فاتح)"}
              value={brandingForm.border_color_light}
              defaultValue="#c1d9dd"
              onChange={(val) =>
                setBrandingForm({
                  ...brandingForm,
                  border_color_light: val,
                })
              }
              canEdit={canEdit}
              optional
            />
          </div>
        </div>

        {/* 3. Dark Mode Palette */}
        <div style={{ marginTop: 14 }}>
          <h5
            style={{
              fontSize: "0.86rem",
              fontWeight: 800,
              color: "var(--heading)",
              marginBottom: 10,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Icon name="moon" size={15} style={{ color: "#38bdf8" }} />
            {t("darkModePalette") || "ألوان الوضع الداكن (Dark Mode)"}
          </h5>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: 12,
            }}
          >
            <ColorField
              label={t("backgroundColorDark") || "لون الخلفية (داكن)"}
              value={brandingForm.background_color_dark}
              defaultValue="#022a35"
              onChange={(val) =>
                setBrandingForm({
                  ...brandingForm,
                  background_color_dark: val,
                })
              }
              canEdit={canEdit}
              optional
            />
            <ColorField
              label={t("surfaceColorDark") || "لون البطاقات والحاويات (داكن)"}
              value={brandingForm.surface_color_dark}
              defaultValue="#033d4b"
              onChange={(val) =>
                setBrandingForm({
                  ...brandingForm,
                  surface_color_dark: val,
                })
              }
              canEdit={canEdit}
              optional
            />
            <ColorField
              label={t("headingColorDark") || "لون العناوين (داكن)"}
              value={brandingForm.heading_color_dark}
              defaultValue="#ffffff"
              onChange={(val) =>
                setBrandingForm({
                  ...brandingForm,
                  heading_color_dark: val,
                })
              }
              canEdit={canEdit}
              optional
            />
            <ColorField
              label={t("textColorDark") || "لون النصوص (داكن)"}
              value={brandingForm.text_color_dark}
              defaultValue="#e2e8f0"
              onChange={(val) =>
                setBrandingForm({ ...brandingForm, text_color_dark: val })
              }
              canEdit={canEdit}
              optional
            />
            <ColorField
              label={t("borderColorDark") || "لون الحدود والفواصل (داكن)"}
              value={brandingForm.border_color_dark}
              defaultValue="#04566b"
              onChange={(val) =>
                setBrandingForm({
                  ...brandingForm,
                  border_color_dark: val,
                })
              }
              canEdit={canEdit}
              optional
            />
          </div>
        </div>

        {/* 4. Interactive Live Preview */}
        <div
          style={{
            marginTop: 18,
            padding: 18,
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--border)",
            background:
              previewMode === "dark"
                ? brandingForm.background_color_dark || "#022a35"
                : brandingForm.background_color_light || "#f8fafc",
            transition: "all 0.3s ease",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 14,
              flexWrap: "wrap",
              gap: 10,
            }}
          >
            <span
              style={{
                fontSize: "0.85rem",
                fontWeight: 800,
                color:
                  previewMode === "dark"
                    ? brandingForm.heading_color_dark || "#ffffff"
                    : brandingForm.heading_color_light || "#022a35",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Icon name="eye" size={16} />
              {t("liveThemePreview") || "معاينة حية للمظهر والألوان"}
            </span>

            <div
              style={{
                display: "inline-flex",
                padding: 3,
                borderRadius: "var(--radius-full)",
                background:
                  previewMode === "dark"
                    ? "rgba(255,255,255,0.12)"
                    : "rgba(0,0,0,0.06)",
                border: "1px solid var(--border)",
                gap: 4,
              }}
            >
              <button
                type="button"
                onClick={() => setPreviewMode("light")}
                style={{
                  padding: "4px 12px",
                  borderRadius: "var(--radius-full)",
                  border: "none",
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  background:
                    previewMode === "light"
                      ? brandingForm.primary_color || "var(--primary)"
                      : "transparent",
                  color:
                    previewMode === "light"
                      ? "#ffffff"
                      : previewMode === "dark"
                        ? "#cbd5e1"
                        : "var(--text)",
                  transition: "all 0.2s ease",
                }}
              >
                {isRTL ? "الوضع الفاتح" : "Light Mode"}
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode("dark")}
                style={{
                  padding: "4px 12px",
                  borderRadius: "var(--radius-full)",
                  border: "none",
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  background:
                    previewMode === "dark"
                      ? brandingForm.primary_color || "var(--primary)"
                      : "transparent",
                  color:
                    previewMode === "dark"
                      ? "#ffffff"
                      : previewMode === "light"
                        ? "var(--text)"
                        : "#cbd5e1",
                  transition: "all 0.2s ease",
                }}
              >
                {isRTL ? "الوضع الداكن" : "Dark Mode"}
              </button>
            </div>
          </div>

          <div
            style={{
              padding: 16,
              borderRadius: "var(--radius-md)",
              border: `1px solid ${
                previewMode === "dark"
                  ? brandingForm.border_color_dark || "#04566b"
                  : brandingForm.border_color_light || "#c1d9dd"
              }`,
              background:
                previewMode === "dark"
                  ? brandingForm.surface_color_dark || "#033d4b"
                  : brandingForm.surface_color_light || "#ffffff",
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 8,
              }}
            >
              <h6
                style={{
                  margin: 0,
                  fontSize: "1rem",
                  fontWeight: 800,
                  color:
                    previewMode === "dark"
                      ? brandingForm.heading_color_dark || "#ffffff"
                      : brandingForm.heading_color_light || "#022a35",
                }}
              >
                {isRTL
                  ? "عيادة د. أحمد خالد — استشارة عامة"
                  : "Dr. Ahmed Clinic — General Consultation"}
              </h6>

              <span
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 800,
                  padding: "3px 10px",
                  borderRadius: "var(--radius-full)",
                  background:
                    brandingForm.accent_color ||
                    brandingForm.secondary_color ||
                    "#2de2f2",
                  color: "#ffffff",
                }}
              >
                {isRTL ? "متاح للحجز" : "Available"}
              </span>
            </div>

            <p
              style={{
                margin: 0,
                fontSize: "0.85rem",
                lineHeight: 1.6,
                color:
                  previewMode === "dark"
                    ? brandingForm.text_color_dark || "#e2e8f0"
                    : brandingForm.text_color_light || "#033d4b",
              }}
            >
              {isRTL
                ? "هذه بطاقة توضيحية تحاكي كيف ستبدو ألوان نصوصك، خلفياتك، وأزرارك لعملائك وفريقك بدقة في هذا الوضع."
                : "This sample card illustrates how your custom text, background, and button colors appear to clients and team members."}
            </p>

            <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
              <button
                type="button"
                style={{
                  padding: "8px 18px",
                  borderRadius: "var(--radius-md)",
                  border: "none",
                  background: brandingForm.primary_color || "#026982",
                  color: "#ffffff",
                  fontWeight: 700,
                  fontSize: "0.85rem",
                  cursor: "default",
                  boxShadow: `0 4px 12px ${
                    brandingForm.primary_color
                      ? `${brandingForm.primary_color}33`
                      : "rgba(0,0,0,0.1)"
                  }`,
                }}
              >
                {isRTL ? "احجز الآن" : "Book Now"}
              </button>
              <button
                type="button"
                style={{
                  padding: "8px 16px",
                  borderRadius: "var(--radius-md)",
                  border: `1px solid ${
                    previewMode === "dark"
                      ? brandingForm.border_color_dark || "#04566b"
                      : brandingForm.border_color_light || "#c1d9dd"
                  }`,
                  background: "transparent",
                  color:
                    previewMode === "dark"
                      ? brandingForm.heading_color_dark || "#ffffff"
                      : brandingForm.heading_color_light || "#022a35",
                  fontWeight: 700,
                  fontSize: "0.85rem",
                  cursor: "default",
                }}
              >
                {isRTL ? "عرض التفاصيل" : "View Details"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION: Photo Gallery Media */}
      <div
        style={{
          marginTop: 24,
          paddingTop: 20,
          borderTop: "1px solid var(--border-light)",
        }}
      >
        {/* Hidden File Input for Adding Gallery Images */}
        <input
          type="file"
          ref={galleryInputRef}
          accept="image/*"
          multiple
          style={{ display: "none" }}
          onChange={handleGalleryUpload}
        />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
            marginBottom: 18,
          }}
        >
          <h3
            style={{
              fontSize: "1.05rem",
              fontWeight: 700,
              margin: 0,
              color: "var(--heading)",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Icon name="image" size={18} style={{ color: "var(--primary)" }} />
            <span>{t("photoGalleryMedia") || "معرض الصور"}</span>
          </h3>

          <button
            type="button"
            onClick={() => galleryInputRef.current?.click()}
            disabled={!canEdit}
            className="btn btn-secondary btn-sm"
          >
            + {t("addImageToGallery") || "رفع صورة للمعرض"}
          </button>
        </div>

        {Array.isArray(brandingForm.gallery_urls) &&
        brandingForm.gallery_urls.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {brandingForm.gallery_urls.map((item, idx) => {
              const galleryItem =
                typeof item === "string" ? { url: item, caption: "" } : item;
              return (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                    background: "var(--surface-alt)",
                    padding: 16,
                    borderRadius: 14,
                    border: "1px solid var(--border)",
                  }}
                >
                  {/* Top Row: Image Thumbnail & Remove Button at the end */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      width: "100%",
                    }}
                  >
                    <div
                      style={{
                        width: 64,
                        height: 64,
                        borderRadius: 10,
                        overflow: "hidden",
                        border: "1px solid var(--border)",
                        background: "#000",
                        flexShrink: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {galleryItem.url ? (
                        <LazyImage
                          src={galleryItem.url}
                          alt={`Gallery item ${idx + 1}`}
                          width={64}
                          height={64}
                          objectFit="cover"
                        />
                      ) : (
                        <Icon
                          name="image"
                          size={24}
                          style={{ color: "#fff", opacity: 0.5 }}
                        />
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setBrandingForm({
                          ...brandingForm,
                          gallery_urls: brandingForm.gallery_urls.filter(
                            (_, i) => i !== idx,
                          ),
                        });
                      }}
                      disabled={!canEdit}
                      className="btn btn-secondary btn-sm"
                      style={{
                        color: "var(--error)",
                        width: 36,
                        height: 36,
                        borderRadius: "var(--radius-md)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: 0,
                        flexShrink: 0,
                      }}
                      title={t("deleteImage") || "حذف الصورة"}
                    >
                      <Icon name="x" size={18} />
                    </button>
                  </div>

                  {/* Caption Input Field (Higher Height) */}
                  <div style={{ width: "100%" }}>
                    <input
                      type="text"
                      className="form-input"
                      value={galleryItem.caption || ""}
                      onChange={(e) => {
                        const updated = brandingForm.gallery_urls.map(
                          (g, i) => {
                            const existing =
                              typeof g === "string"
                                ? { url: g, caption: "" }
                                : g;
                            return i === idx
                              ? { ...existing, caption: e.target.value }
                              : existing;
                          },
                        );
                        setBrandingForm({
                          ...brandingForm,
                          gallery_urls: updated,
                        });
                      }}
                      disabled={!canEdit}
                      placeholder={
                        t("photoCaptionOptional") ||
                        "وصف مختصر للصورة (اختياري)"
                      }
                      style={{
                        width: "100%",
                        height: 52,
                        padding: "12px 16px",
                        fontSize: "0.9rem",
                        borderRadius: "var(--radius-md)",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p
            style={{
              color: "var(--text-secondary)",
              fontSize: "0.88rem",
              fontStyle: "italic",
            }}
          >
            {t("noGalleryImagesYet") || "لم يتم إضافة صور في المعرض بعد."}
          </p>
        )}
      </div>

      {/* SECTION: Feature Highlights Cards (لماذا تختار خدماتنا؟ / Why Choose Our Services) */}
      <div
        style={{
          marginTop: 24,
          paddingTop: 20,
          borderTop: "1px solid var(--border-light)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
            marginBottom: 18,
          }}
        >
          <h3
            style={{
              fontSize: "1.05rem",
              fontWeight: 700,
              margin: 0,
              color: "var(--heading)",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Icon
              name="sparkles"
              size={18}
              style={{ color: "var(--primary)" }}
            />
            <span>
              {t("featureHighlightsCards") ||
                "لماذا تختار خدماتنا؟ (بطاقات المزايا)"}
            </span>
          </h3>

          <button
            type="button"
            onClick={() => {
              const current = Array.isArray(brandingForm.feature_highlights)
                ? brandingForm.feature_highlights
                : [];
              setBrandingForm({
                ...brandingForm,
                feature_highlights: [
                  ...current,
                  {
                    title: "",
                    icon: "sparkles",
                    description: "",
                    image_url: "",
                  },
                ],
              });
            }}
            disabled={!canEdit}
            className="btn btn-secondary btn-sm"
          >
            + {t("addFeatureHighlight") || "إضافة بطاقة ميزة"}
          </button>
        </div>

        {Array.isArray(brandingForm.feature_highlights) &&
        brandingForm.feature_highlights.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {brandingForm.feature_highlights.map((item, idx) => (
              <div
                key={idx}
                style={{
                  background: "var(--surface-alt)",
                  padding: 16,
                  borderRadius: 16,
                  border: "1px solid var(--border)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.85rem",
                      fontWeight: 700,
                      color: "var(--primary)",
                    }}
                  >
                    #{idx + 1} {t("featureHighlightCard") || "بطاقة ميزة"}
                  </span>

                  <button
                    type="button"
                    onClick={() => {
                      const current = Array.isArray(
                        brandingForm.feature_highlights,
                      )
                        ? brandingForm.feature_highlights
                        : [];
                      setBrandingForm({
                        ...brandingForm,
                        feature_highlights: current.filter((_, i) => i !== idx),
                      });
                    }}
                    disabled={!canEdit}
                    className="btn btn-secondary btn-sm"
                    style={{
                      color: "var(--error)",
                      padding: "4px 10px",
                    }}
                  >
                    <Icon name="x" size={16} />
                  </button>
                </div>

                {/* Image Upload for Card Header Image */}
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div
                    style={{
                      width: 80,
                      height: 50,
                      borderRadius: 8,
                      overflow: "hidden",
                      border: "1px solid var(--border)",
                      background: "var(--surface)",
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {item.image_url ? (
                      <LazyImage
                        src={item.image_url}
                        alt={`Card image ${idx + 1}`}
                        width={80}
                        height={50}
                        objectFit="cover"
                      />
                    ) : (
                      <Icon
                        name="image"
                        size={20}
                        style={{ color: "var(--muted)", opacity: 0.5 }}
                      />
                    )}
                  </div>

                  <label
                    className="btn btn-secondary btn-sm"
                    style={{
                      cursor: canEdit ? "pointer" : "default",
                      margin: 0,
                      fontSize: "0.8rem",
                    }}
                  >
                    📷 {t("uploadCardImage") || "رفع صورة للبطاقة"}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            const url = ev.target?.result;
                            if (url) {
                              const current = Array.isArray(
                                brandingForm.feature_highlights,
                              )
                                ? brandingForm.feature_highlights
                                : [];
                              const updated = current.map((f, i) =>
                                i === idx ? { ...f, image_url: url } : f,
                              );
                              setBrandingForm({
                                ...brandingForm,
                                feature_highlights: updated,
                              });
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                        e.target.value = "";
                      }}
                      hidden
                      disabled={!canEdit}
                    />
                  </label>
                </div>

                <div className="grid grid-2" style={{ gap: 14 }}>
                  <div className="form-group mb-0">
                    <label
                      className="form-label"
                      style={{ fontSize: "0.82rem" }}
                    >
                      {t("featureTitle") || "عنوان الميزة"}
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={item.title || ""}
                      onChange={(e) => {
                        const current = Array.isArray(
                          brandingForm.feature_highlights,
                        )
                          ? brandingForm.feature_highlights
                          : [];
                        const updated = current.map((f, i) =>
                          i === idx ? { ...f, title: e.target.value } : f,
                        );
                        setBrandingForm({
                          ...brandingForm,
                          feature_highlights: updated,
                        });
                      }}
                      disabled={!canEdit}
                      placeholder={
                        isRTL
                          ? "مثال: تجربة حجز متميزة"
                          : "Example: Exceptional Booking Experience"
                      }
                    />
                  </div>

                  <div className="form-group mb-0">
                    <label
                      className="form-label"
                      style={{ fontSize: "0.82rem" }}
                    >
                      {t("cardIcon") || "رمز الأيقونة"}
                    </label>
                    <select
                      className="form-select"
                      value={item.icon || "sparkles"}
                      onChange={(e) => {
                        const current = Array.isArray(
                          brandingForm.feature_highlights,
                        )
                          ? brandingForm.feature_highlights
                          : [];
                        const updated = current.map((f, i) =>
                          i === idx ? { ...f, icon: e.target.value } : f,
                        );
                        setBrandingForm({
                          ...brandingForm,
                          feature_highlights: updated,
                        });
                      }}
                      disabled={!canEdit}
                    >
                      <option value="sparkles">
                        ✨ {t("sparkles") || "تمييز وسحر"}
                      </option>
                      <option value="shield">
                        🛡️ {t("shield") || "حماية وخصوصية"}
                      </option>
                      <option value="clock">
                        ⏰ {t("clock") || "وقت وسرعة"}
                      </option>
                      <option value="users">
                        👥 {t("users") || "فريق عمل"}
                      </option>
                      <option value="star">
                        ⭐ {t("star") || "نجمة وتقييم"}
                      </option>
                      <option value="phone">
                        📞 {t("phone") || "هاتف وتواصل"}
                      </option>
                      <option value="map-pin">
                        📍 {t("mapPin") || "موقع جغرافي"}
                      </option>
                      <option value="briefcase">
                        💼 {t("briefcase") || "حقيبة عمل"}
                      </option>
                      <option value="check">
                        ✅ {t("check") || "تأكيد وصحة"}
                      </option>
                    </select>
                  </div>
                </div>

                <div className="form-group mb-0">
                  <label className="form-label" style={{ fontSize: "0.82rem" }}>
                    {t("featureDescription") || "وصف الميزة"}
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={item.description || ""}
                    onChange={(e) => {
                      const current = Array.isArray(
                        brandingForm.feature_highlights,
                      )
                        ? brandingForm.feature_highlights
                        : [];
                      const updated = current.map((f, i) =>
                        i === idx ? { ...f, description: e.target.value } : f,
                      );
                      setBrandingForm({
                        ...brandingForm,
                        feature_highlights: updated,
                      });
                    }}
                    disabled={!canEdit}
                    placeholder={
                      isRTL
                        ? "مثال: تجربة حجز مواعيد سريعة، موثوقة، ومصممة لتلبية تطلعاتك."
                        : "Example: Fast, reliable appointment booking designed for your expectations."
                    }
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p
            style={{
              color: "var(--text-secondary)",
              fontSize: "0.88rem",
              fontStyle: "italic",
            }}
          >
            {t("noFeatureHighlightsYet") || "لم يتم إضافة بطاقات مميزات بعد."}
          </p>
        )}
      </div>

      {canEdit && (
        <div
          style={{
            display: "flex",
            justifyContent: "flex-start",
            marginTop: 12,
          }}
        >
          <button
            type="submit"
            className="btn btn-primary btn-md"
            disabled={saving}
            style={{
              padding: "10px 24px",
              borderRadius: "var(--radius-md)",
              fontWeight: 700,
            }}
          >
            {saving ? (
              <>
                <span
                  className="spinner spinner-sm"
                  style={{ borderTopColor: "#fff" }}
                />
                {t("saving") || "جاري الحفظ..."}
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
