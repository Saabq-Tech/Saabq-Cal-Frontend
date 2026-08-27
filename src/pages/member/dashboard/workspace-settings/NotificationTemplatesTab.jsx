import { useState, useRef } from "react";
import { useLanguage } from "../../../../context/LanguageContext";
import Icon from "../../../../components/common/Icon";

export default function NotificationTemplatesTab({
  templates,
  selectedTemplateKey,
  selectTemplateItem,
  templateLang,
  setTemplateLang,
  notificationForm,
  setNotificationForm,
  onSave,
  saving,
  canEdit,
  getInterpolatedText: _getInterpolatedText,
}) {
  const { t, isRTL } = useLanguage();

  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTabInput, setActiveTabInput] = useState("body"); // 'subject' or 'body'

  const bodyRef = useRef(null);

  if (!Array.isArray(templates) || templates.length === 0) {
    return (
      <div className="card-body" style={{ padding: 40, textAlign: "center" }}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            background: "var(--surface-alt)",
            color: "var(--muted)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px",
          }}
        >
          <Icon name="mail" size={32} />
        </div>
        <h3
          style={{
            fontSize: "1.1rem",
            fontWeight: 800,
            margin: "0 0 6px",
            color: "var(--heading)",
          }}
        >
          {t("noNotificationTemplates") || "لا يوجد قوالب إشعارات متاحة"}
        </h3>
        <p
          style={{
            fontSize: "0.88rem",
            color: "var(--text-secondary)",
            margin: 0,
            maxWidth: 460,
            marginLeft: "auto",
            marginRight: "auto",
          }}
        >
          لم يتم العثور على أية قوالب إشعارات للمساحة في النظام حالياً.
        </p>
      </div>
    );
  }

  const categories = [
    {
      id: "all",
      label: t("filterAllCategory") || "الكل",
      count: templates.length,
    },
    {
      id: "bookings",
      label: t("filterBookingsCategory") || "الحجوزات",
      count: templates.filter((t) => t.category === "bookings").length,
    },
    {
      id: "account",
      label: t("filterAccountCategory") || "الحساب",
      count: templates.filter((t) => t.category === "account").length,
    },
    {
      id: "payments",
      label: t("filterPaymentsCategory") || "المدفوعات",
      count: templates.filter((t) => t.category === "payments").length,
    },
    {
      id: "session",
      label: t("filterSessionsCategory") || "الجلسات",
      count: templates.filter((t) => t.category === "session").length,
    },
  ];

  const filteredTemplates = templates.filter((tmpl) => {
    const matchCategory =
      activeCategory === "all" || tmpl.category === activeCategory;
    const nameStr = (
      tmpl.subject_ar ||
      tmpl.subject_en ||
      tmpl.key ||
      ""
    ).toLowerCase();
    const matchSearch =
      !searchQuery ||
      nameStr.includes(searchQuery.toLowerCase()) ||
      tmpl.key.includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  const currentTemplate =
    templates.find((tmpl) => (tmpl.key || tmpl.id) === selectedTemplateKey) ||
    templates[0];

  const handleFormSubmit = (e) => {
    e.preventDefault();
    onSave(selectedTemplateKey, notificationForm);
  };

  const handleInsertPlaceholder = (placeholderKey) => {
    const placeholderText = `{{${placeholderKey}}}`;
    const field =
      activeTabInput === "subject"
        ? templateLang === "ar"
          ? "subject_ar"
          : "subject_en"
        : templateLang === "ar"
          ? "body_ar"
          : "body_en";
    setNotificationForm({
      ...notificationForm,
      [field]: (notificationForm[field] || "") + " " + placeholderText,
    });
  };

  const sampleInterpolation = (text) => {
    if (!text) return "";
    return text
      .replace(/\{\{customerName\}\}/g, t("mockCustomer1") || "أحمد علي")
      .replace(
        /\{\{businessName\}\}/g,
        t("mockCompanyName") || "شركة سابق التقنية",
      )
      .replace(/\{\{bookingLink\}\}/g, "https://cal.saabq.com/b/x9a2")
      .replace(
        /\{\{when\}\}/g,
        t("mockSampleDate") || "الخميس 25 أغسطس 2026 الساعة 04:00 مساءً",
      )
      .replace(/\{\{meetLink\}\}/g, "https://meet.google.com/abc-defg-hij")
      .replace(/\{\{amount\}\}/g, t("mockAmountSar") || "250 ر.س")
      .replace(
        /\{\{cancelledBy\}\}/g,
        t("mockCancelledByCustomer") || "من قِبل العميل",
      )
      .replace(
        /\{\{rejectedReason\}\}/g,
        t("mockCancellationReason") || "لعدم توفر المستشار في الموعد المطلوب",
      );
  };

  const getCategoryBadgeColor = (cat) => {
    switch (cat) {
      case "bookings":
        return { bg: "rgba(17, 100, 106, 0.12)", color: "var(--primary)" };
      case "account":
        return { bg: "rgba(59, 130, 246, 0.12)", color: "#2563eb" };
      case "payments":
        return { bg: "rgba(16, 185, 129, 0.12)", color: "#059669" };
      case "session":
        return { bg: "rgba(245, 158, 11, 0.12)", color: "#d97706" };
      default:
        return { bg: "var(--surface-alt)", color: "var(--text-secondary)" };
    }
  };

  return (
    <div className="card-body">
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 14,
          marginBottom: 20,
        }}
      >
        <div>
          <h2
            style={{
              fontSize: "1.2rem",
              fontWeight: 800,
              margin: 0,
              color: "var(--heading)",
            }}
          >
            {t("notificationTemplates") || "إدارة قوالب الإشعارات والرسائل"}
          </h2>
          <p
            style={{
              fontSize: "0.86rem",
              color: "var(--text-secondary)",
              margin: "4px 0 0",
            }}
          >
            تخصيص جميع إشعارات الحجوزات والمدفوعات والحساب والجلسات لكل عملائك
          </p>
        </div>

        {/* Language Switcher */}
        <div
          style={{
            display: "flex",
            background: "var(--surface-alt)",
            padding: 3,
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border-light)",
          }}
        >
          <button
            type="button"
            className={`btn btn-sm ${templateLang === "ar" ? "btn-primary" : "btn-ghost"}`}
            onClick={() => setTemplateLang("ar")}
            style={{
              borderRadius: "var(--radius-sm)",
              padding: "5px 16px",
              fontSize: "0.82rem",
              fontWeight: 700,
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <svg width="18" height="12" viewBox="0 0 24 16" style={{ borderRadius: 2, flexShrink: 0 }}>
              <rect width="24" height="16" fill="#007A3D" rx="2" />
              <path d="M4 8.5L20 8.5M6 5.5H18" stroke="#FFFFFF" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            <span>{isRTL ? "العربية" : "Arabic"}</span>
          </button>
          <button
            type="button"
            className={`btn btn-sm ${templateLang === "en" ? "btn-primary" : "btn-ghost"}`}
            onClick={() => setTemplateLang("en")}
            style={{
              borderRadius: "var(--radius-sm)",
              padding: "5px 16px",
              fontSize: "0.82rem",
              fontWeight: 700,
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <svg width="18" height="12" viewBox="0 0 24 16" style={{ borderRadius: 2, flexShrink: 0 }}>
              <rect width="24" height="16" fill="#00247D" rx="2" />
              <path d="M0 0L24 16M24 0L0 16" stroke="#FFFFFF" strokeWidth="2.2" />
              <path d="M0 0L24 16M24 0L0 16" stroke="#CF142B" strokeWidth="1.2" />
              <path d="M12 0V16M0 8H24" stroke="#FFFFFF" strokeWidth="4.2" />
              <path d="M12 0V16M0 8H24" stroke="#CF142B" strokeWidth="2.2" />
            </svg>
            <span>English</span>
          </button>
        </div>
      </div>

      {/* Read-Only Notice Banner when editing is disabled */}
      {!canEdit && (
        <div
          style={{
            background: "#fef2f2",
            border: "1px solid #fecaca",
            color: "#991b1b",
            padding: "12px 16px",
            borderRadius: "var(--radius-md)",
            fontSize: "0.86rem",
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 20,
          }}
        >
          <Icon name="info" size={18} style={{ flexShrink: 0 }} />
          <span>
            {t("templateEditingDisabledNotice") ||
              "تعديل قوالب الإشعارات معطل لمساحة العمل. تم تفعيل وضع العرض والقراءة فقط للمعاينة دون إمكانية التعديل."}
          </span>
        </div>
      )}

      {/* Grid Layout: Sidebar + Editor */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(min(100%, 280px), 1fr))",
          gap: 24,
          alignItems: "start",
        }}
      >
        {/* Sidebar */}
        <div
          style={{
            background: "var(--surface)",
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--border)",
            padding: 16,
          }}
        >
          {/* Search Box */}
          <div style={{ position: "relative", marginBottom: 14 }}>
            <input
              type="text"
              className="form-input"
              placeholder={
                t("searchTemplatesPlaceholder") || "بحث في القوالب..."
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ fontSize: "0.84rem", paddingInlineEnd: 32 }}
            />
            <span
              style={{
                position: "absolute",
                insetInlineEnd: 10,
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--muted)",
                display: "flex",
              }}
            >
              <Icon name="search" size={14} />
            </span>
          </div>

          {/* Category Filter Pills */}
          <div
            style={{
              display: "flex",
              gap: 6,
              flexWrap: "wrap",
              marginBottom: 14,
              paddingBottom: 12,
              borderBottom: "1px solid var(--border-light)",
            }}
          >
            {categories.map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  style={{
                    padding: "4px 10px",
                    borderRadius: 14,
                    fontSize: "0.76rem",
                    fontWeight: isActive ? 700 : 500,
                    border: isActive
                      ? "1px solid var(--primary)"
                      : "1px solid var(--border-light)",
                    background: isActive
                      ? "var(--primary)"
                      : "var(--surface-alt)",
                    color: isActive ? "#ffffff" : "var(--text-secondary)",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  {cat.label} ({cat.count})
                </button>
              );
            })}
          </div>

          {/* Template Items List */}
          <div
            className="no-scrollbar"
            style={{
              maxHeight: 520,
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: 6,
            }}
          >
            {filteredTemplates.length === 0 ? (
              <div
                style={{
                  padding: 20,
                  textAlign: "center",
                  color: "var(--muted)",
                  fontSize: "0.85rem",
                }}
              >
                {t("noMatchingTemplates") || "لا يوجد قوالب تطابق البحث"}
              </div>
            ) : (
              filteredTemplates.map((tmpl) => {
                const key = tmpl.key || tmpl.id;
                const isSelected = key === selectedTemplateKey;
                const _catBadge = getCategoryBadgeColor(tmpl.category);

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => selectTemplateItem(tmpl)}
                    style={{
                      display: "block",
                      width: "100%",
                      textAlign: "right",
                      padding: "10px 14px",
                      borderRadius: "var(--radius-md)",
                      border: isSelected
                        ? "1.5px solid var(--primary)"
                        : "1px solid var(--border-light)",
                      background: isSelected
                        ? "var(--primary-subtle)"
                        : "transparent",
                      color: isSelected ? "var(--primary)" : "var(--heading)",
                      fontWeight: isSelected ? 700 : 500,
                      fontSize: "0.88rem",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {templateLang === "ar"
                      ? tmpl.subject_ar || tmpl.key
                      : tmpl.subject_en || tmpl.key}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Selected Template Form & Live Preview */}
        <form
          onSubmit={handleFormSubmit}
          style={{ display: "flex", flexDirection: "column", gap: 18 }}
        >
          {/* Template Header Toolbar */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: "var(--surface-alt)",
              padding: "12px 16px",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border-light)",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span
                style={{
                  fontSize: "0.92rem",
                  fontWeight: 800,
                  color: "var(--heading)",
                }}
              >
                {templateLang === "ar"
                  ? currentTemplate?.subject_ar
                  : currentTemplate?.subject_en}
              </span>
              <span
                style={{
                  fontSize: "0.75rem",
                  padding: "2px 8px",
                  borderRadius: 10,
                  background: getCategoryBadgeColor(currentTemplate?.category)
                    .bg,
                  color: getCategoryBadgeColor(currentTemplate?.category).color,
                  fontWeight: 700,
                }}
              >
                {currentTemplate?.category || "عام"}
              </span>
            </div>

            <label
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                cursor: "pointer",
                fontWeight: 700,
                fontSize: "0.86rem",
                color: "var(--heading)",
              }}
            >
              <input
                type="checkbox"
                checked={notificationForm.is_active}
                onChange={(e) =>
                  setNotificationForm({
                    ...notificationForm,
                    is_active: e.target.checked,
                  })
                }
                disabled={!canEdit}
                style={{ accentColor: "var(--primary)", width: 18, height: 18 }}
              />
              <span>
                {t("autoSendTemplateLabel") ||
                  "تفعيل وإرسال هذا القالب تلقائياً"}
              </span>
            </label>
          </div>

          {/* Editable Fields (Subject, Body, Placeholders) — Only shown when editing is enabled */}
          {canEdit && (
            <>
              {/* Subject Field */}
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700 }}>
                  {t("subject") || "عنوان الرسالة / الموضوع"} (
                  {templateLang === "ar"
                    ? t("inArabicTag") || "بالعربية"
                    : t("inEnglishTag") || "English"}
                  )
                  <span
                    style={{
                      color: "#ef4444",
                      marginInlineStart: 4,
                      fontWeight: 700,
                    }}
                  >
                    *
                  </span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={
                    templateLang === "ar"
                      ? notificationForm.subject_ar
                      : notificationForm.subject_en
                  }
                  onFocus={() => setActiveTabInput("subject")}
                  onChange={(e) =>
                    setNotificationForm({
                      ...notificationForm,
                      [templateLang === "ar" ? "subject_ar" : "subject_en"]:
                        e.target.value,
                    })
                  }
                  style={{ fontWeight: 600 }}
                  required
                />
              </div>

              {/* Body Field */}
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700 }}>
                  {t("body") || "نص ومحتوى الرسالة"} (
                  {templateLang === "ar"
                    ? t("inArabicTag") || "بالعربية"
                    : t("inEnglishTag") || "English"}
                  )
                  <span
                    style={{
                      color: "#ef4444",
                      marginInlineStart: 4,
                      fontWeight: 700,
                    }}
                  >
                    *
                  </span>
                </label>
                <textarea
                  ref={bodyRef}
                  className="form-textarea"
                  rows={6}
                  value={
                    templateLang === "ar"
                      ? notificationForm.body_ar
                      : notificationForm.body_en
                  }
                  onFocus={() => setActiveTabInput("body")}
                  onChange={(e) =>
                    setNotificationForm({
                      ...notificationForm,
                      [templateLang === "ar" ? "body_ar" : "body_en"]:
                        e.target.value,
                    })
                  }
                  style={{ lineHeight: 1.6 }}
                  required
                />
              </div>

              {/* Interactive Placeholders Selector */}
              {currentTemplate?.placeholders &&
                currentTemplate.placeholders.length > 0 && (
                  <div
                    style={{
                      background: "var(--surface-alt)",
                      padding: 14,
                      borderRadius: "var(--radius-md)",
                      border: "1px solid var(--border-light)",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "0.82rem",
                        fontWeight: 700,
                        color: "var(--heading)",
                        marginBottom: 8,
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <Icon name="custom-c82a9fb0" size={14} />
                      {t("clickVariableToInsert") ||
                        "انقر على أي متغير لإدراجه مباشرة في النص:"}
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {currentTemplate.placeholders.map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => handleInsertPlaceholder(p)}
                          title={t("clickToInsert") || "انقر للإدراج"}
                          style={{
                            padding: "4px 10px",
                            borderRadius: 6,
                            background: "var(--surface)",
                            border: "1px solid var(--primary-subtle)",
                            color: "var(--primary)",
                            fontSize: "0.78rem",
                            fontFamily: "monospace",
                            fontWeight: 700,
                            cursor: "pointer",
                            transition: "all 0.15s ease",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          <span>+</span>
                          <span>{`{{${p}}}`}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
            </>
          )}

          {/* Interactive Live Email Preview Card */}
          <div
            style={{
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--border)",
              overflow: "hidden",
              background: "var(--surface)",
              boxShadow: "0 4px 16px rgba(0,0,0,0.03)",
            }}
          >
            {/* Live Preview Bar Header */}
            <div
              style={{
                padding: "10px 16px",
                background: "var(--surface-alt)",
                borderBottom: "1px solid var(--border-light)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  color: "var(--heading)",
                }}
              >
                <Icon name="eye" size={15} />
                {t("liveEmailPreviewTitle") ||
                  "معاينة حية لشكل إيميل الرسالة المرسلة"}
              </div>
              <span
                className="profile-badge verified"
                style={{ fontSize: "0.74rem", padding: "2px 8px" }}
              >
                {t("autoUpdatedBadge") || "مُحدثة تلقائياً"}
              </span>
            </div>

            {/* Simulated Email Body */}
            <div style={{ padding: 20 }}>
              <div
                style={{
                  borderBottom: "1px solid var(--border-light)",
                  paddingBottom: 12,
                  marginBottom: 14,
                }}
              >
                <div
                  style={{
                    fontSize: "0.78rem",
                    color: "var(--muted)",
                    marginBottom: 2,
                  }}
                >
                  {t("fromSenderLabel") || "من:"}{" "}
                  <strong>
                    {t("systemNotificationSender") ||
                      "سابق كول (إشعارات الخدمة)"}
                  </strong>
                </div>
                <div
                  style={{
                    fontSize: "0.98rem",
                    fontWeight: 800,
                    color: "var(--heading)",
                  }}
                >
                  {sampleInterpolation(
                    templateLang === "ar"
                      ? notificationForm.subject_ar
                      : notificationForm.subject_en,
                  ) ||
                    t("templateSubjectPlaceholder") ||
                    "عنوان الرسالة..."}
                </div>
              </div>

              <div
                style={{
                  fontSize: "0.9rem",
                  color: "var(--text)",
                  lineHeight: 1.7,
                  whiteSpace: "pre-wrap",
                }}
              >
                {sampleInterpolation(
                  templateLang === "ar"
                    ? notificationForm.body_ar
                    : notificationForm.body_en,
                ) ||
                  t("templateBodyPlaceholder") ||
                  "محتوى الرسالة..."}
              </div>
            </div>
          </div>

          {canEdit && (
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginTop: 10,
              }}
            >
              <button
                type="submit"
                className="btn btn-primary btn-md"
                disabled={saving}
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
                  t("saveChanges") || "حفظ تغييرات القالب"
                )}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
