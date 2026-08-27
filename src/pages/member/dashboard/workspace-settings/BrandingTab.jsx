import { useRef } from "react";
import { useLanguage } from "../../../../context/LanguageContext";
import Icon from "../../../../components/common/Icon";
import LazyImage from "../../../../components/ui/LazyImage";

export default function BrandingTab({
  brandingForm,
  setBrandingForm,
  onSave,
  saving,
  canEdit,
}) {
  const { t } = useLanguage();
  const galleryInputRef = useRef(null);

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
        <h4
          style={{
            fontSize: "0.92rem",
            fontWeight: 800,
            color: "var(--heading)",
            margin: 0,
          }}
        >
          {t("brandColors") || "ألوان العلامة التجارية"}
        </h4>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 16,
          }}
        >
          {/* Primary Color */}
          <div>
            <label
              className="form-label"
              style={{
                fontSize: "0.84rem",
                fontWeight: 700,
                marginBottom: 8,
                display: "block",
              }}
            >
              {t("primaryColor") || "اللون الأساسي"}
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  position: "relative",
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  border: "1px solid var(--border)",
                  background: brandingForm.primary_color || "#0a9099",
                  flexShrink: 0,
                  overflow: "hidden",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.06)",
                }}
              >
                <input
                  type="color"
                  value={brandingForm.primary_color || "#0a9099"}
                  onChange={(e) =>
                    setBrandingForm({
                      ...brandingForm,
                      primary_color: e.target.value,
                    })
                  }
                  disabled={!canEdit}
                  style={{
                    opacity: 0,
                    width: "100%",
                    height: "100%",
                    cursor: "pointer",
                  }}
                />
              </div>
              <input
                type="text"
                className="form-input"
                value={brandingForm.primary_color || "#0a9099"}
                onChange={(e) =>
                  setBrandingForm({
                    ...brandingForm,
                    primary_color: e.target.value,
                  })
                }
                disabled={!canEdit}
                style={{
                  fontFamily: "monospace",
                  direction: "ltr",
                  textAlign: "center",
                  height: 40,
                }}
              />
            </div>
          </div>

          {/* Secondary Color */}
          <div>
            <label
              className="form-label"
              style={{
                fontSize: "0.84rem",
                fontWeight: 700,
                marginBottom: 8,
                display: "block",
              }}
            >
              {t("secondaryColor") || "اللون الثانوي"}
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  position: "relative",
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  border: "1px solid var(--border)",
                  background: brandingForm.secondary_color || "#166992",
                  flexShrink: 0,
                  overflow: "hidden",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.06)",
                }}
              >
                <input
                  type="color"
                  value={brandingForm.secondary_color || "#166992"}
                  onChange={(e) =>
                    setBrandingForm({
                      ...brandingForm,
                      secondary_color: e.target.value,
                    })
                  }
                  disabled={!canEdit}
                  style={{
                    opacity: 0,
                    width: "100%",
                    height: "100%",
                    cursor: "pointer",
                  }}
                />
              </div>
              <input
                type="text"
                className="form-input"
                value={brandingForm.secondary_color || "#166992"}
                onChange={(e) =>
                  setBrandingForm({
                    ...brandingForm,
                    secondary_color: e.target.value,
                  })
                }
                disabled={!canEdit}
                style={{
                  fontFamily: "monospace",
                  direction: "ltr",
                  textAlign: "center",
                  height: 40,
                }}
              />
            </div>
          </div>

          {/* Hover Color */}
          <div>
            <label
              className="form-label"
              style={{
                fontSize: "0.84rem",
                fontWeight: 700,
                marginBottom: 8,
                display: "block",
              }}
            >
              {t("hoverColor") || "لون التحويم"}
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  position: "relative",
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  border: "1px solid var(--border)",
                  background: brandingForm.hover_color || "#44f2fe",
                  flexShrink: 0,
                  overflow: "hidden",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.06)",
                }}
              >
                <input
                  type="color"
                  value={brandingForm.hover_color || "#44f2fe"}
                  onChange={(e) =>
                    setBrandingForm({
                      ...brandingForm,
                      hover_color: e.target.value,
                    })
                  }
                  disabled={!canEdit}
                  style={{
                    opacity: 0,
                    width: "100%",
                    height: "100%",
                    cursor: "pointer",
                  }}
                />
              </div>
              <input
                type="text"
                className="form-input"
                value={brandingForm.hover_color || "#44f2fe"}
                onChange={(e) =>
                  setBrandingForm({
                    ...brandingForm,
                    hover_color: e.target.value,
                  })
                }
                disabled={!canEdit}
                style={{
                  fontFamily: "monospace",
                  direction: "ltr",
                  textAlign: "center",
                  height: 40,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* SECTION: Photo Gallery Media */}
      <div style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid var(--border-light)" }}>
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
            <span>
              {t("photoGalleryMedia") || "معرض الصور"}
            </span>
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
              {t("featureHighlightsCards") || "لماذا تختار خدماتنا؟ (بطاقات المزايا)"}
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
                  { title: "", icon: "sparkles", description: "", image_url: "" },
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
                      const current = Array.isArray(brandingForm.feature_highlights)
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
                              const current = Array.isArray(brandingForm.feature_highlights)
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
                    <label className="form-label" style={{ fontSize: "0.82rem" }}>
                      {t("featureTitle") || "عنوان الميزة"}
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={item.title || ""}
                      onChange={(e) => {
                        const current = Array.isArray(brandingForm.feature_highlights)
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
                        isRTL ? "مثال: تجربة حجز متميزة" : "Example: Exceptional Booking Experience"
                      }
                    />
                  </div>

                  <div className="form-group mb-0">
                    <label className="form-label" style={{ fontSize: "0.82rem" }}>
                      {t("cardIcon") || "رمز الأيقونة"}
                    </label>
                    <select
                      className="form-select"
                      value={item.icon || "sparkles"}
                      onChange={(e) => {
                        const current = Array.isArray(brandingForm.feature_highlights)
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
                      <option value="sparkles">✨ {t("sparkles") || "تمييز وسحر"}</option>
                      <option value="shield">🛡️ {t("shield") || "حماية وخصوصية"}</option>
                      <option value="clock">⏰ {t("clock") || "وقت وسرعة"}</option>
                      <option value="users">👥 {t("users") || "فريق عمل"}</option>
                      <option value="star">⭐ {t("star") || "نجمة وتقييم"}</option>
                      <option value="phone">📞 {t("phone") || "هاتف وتواصل"}</option>
                      <option value="map-pin">📍 {t("mapPin") || "موقع جغرافي"}</option>
                      <option value="briefcase">💼 {t("briefcase") || "حقيبة عمل"}</option>
                      <option value="check">✅ {t("check") || "تأكيد وصحة"}</option>
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
                      const current = Array.isArray(brandingForm.feature_highlights)
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
