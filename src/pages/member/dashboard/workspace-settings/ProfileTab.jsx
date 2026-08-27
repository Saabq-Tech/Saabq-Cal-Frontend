import { useState, useEffect } from "react";
import { useLanguage } from "../../../../context/LanguageContext";
import client, { endpoints } from "../../../../api/client";
import SearchableSelect from "../../../../components/common/SearchableSelect";
import Icon from "../../../../components/common/Icon";
import RichTextEditor from "../../../../components/common/RichTextEditor";
import LazyImage from "../../../../components/ui/LazyImage";

export default function ProfileTab({
  profileForm,
  setProfileForm,
  workspaceTypes = [],
  countries = [],
  onSave,
  saving,
  canEdit,
}) {
  const { t, isRTL } = useLanguage();
  const [descLang, setDescLang] = useState("ar");
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);

  // Fetch states when country_id changes
  useEffect(() => {
    if (!profileForm.country_id) {
      setStates([]);
      return;
    }
    let isMounted = true;
    setLoadingStates(true);
    client
      .get(endpoints.statesByCountry(profileForm.country_id))
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
  }, [profileForm.country_id]);

  // Fetch cities when state_id changes
  useEffect(() => {
    if (!profileForm.state_id) {
      setCities([]);
      return;
    }
    let isMounted = true;
    setLoadingCities(true);
    client
      .get(endpoints.citiesByState(profileForm.state_id))
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
  }, [profileForm.state_id]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(profileForm);
  };

  const typeOptions = workspaceTypes.map((wt) => ({
    value: wt.id,
    label: wt.name,
  }));
  const countryOptions = countries.map((c) => ({ value: c.id, label: c.name }));
  const stateOptions = states.map((s) => ({ value: s.id, label: s.name }));
  const cityOptions = cities.map((ci) => ({ value: ci.id, label: ci.name }));

  const PLATFORMS = [
    { value: "website", label: isRTL ? "موقع إلكتروني" : "Website" },
    { value: "facebook", label: "Facebook" },
    { value: "instagram", label: "Instagram" },
    { value: "twitter", label: "Twitter / X" },
    { value: "linkedin", label: "LinkedIn" },
    { value: "youtube", label: "YouTube" },
    { value: "tiktok", label: "TikTok" },
    { value: "whatsapp", label: "WhatsApp" },
  ];

  const handleAddSocialLink = () => {
    const current = Array.isArray(profileForm.social_links)
      ? profileForm.social_links
      : [];
    setProfileForm({
      ...profileForm,
      social_links: [...current, { platform: "website", url: "" }],
    });
  };

  const handleRemoveSocialLink = (index) => {
    const current = Array.isArray(profileForm.social_links)
      ? profileForm.social_links
      : [];
    setProfileForm({
      ...profileForm,
      social_links: current.filter((_, i) => i !== index),
    });
  };

  const handleSocialLinkChange = (index, field, value) => {
    const current = Array.isArray(profileForm.social_links)
      ? profileForm.social_links
      : [];
    const updated = current.map((item, i) =>
      i === index ? { ...item, [field]: value } : item,
    );
    setProfileForm({ ...profileForm, social_links: updated });
  };

  // Normalize legacy plain-string gallery entries into { url, caption } objects
  const galleryItems = (
    Array.isArray(profileForm.gallery_urls) ? profileForm.gallery_urls : []
  ).map((item) =>
    typeof item === "string" ? { url: item, caption: "" } : item,
  );

  const handleAddTestimonial = () => {
    const current = Array.isArray(profileForm.testimonials)
      ? profileForm.testimonials
      : [];
    setProfileForm({
      ...profileForm,
      testimonials: [
        ...current,
        {
          client_name: "",
          client_role: "",
          quote: "",
          rating: 5,
          avatar_url: "",
        },
      ],
    });
  };

  const handleRemoveTestimonial = (index) => {
    const current = Array.isArray(profileForm.testimonials)
      ? profileForm.testimonials
      : [];
    setProfileForm({
      ...profileForm,
      testimonials: current.filter((_, i) => i !== index),
    });
  };

  const handleTestimonialChange = (index, field, value) => {
    const current = Array.isArray(profileForm.testimonials)
      ? profileForm.testimonials
      : [];
    const updated = current.map((item, i) =>
      i === index ? { ...item, [field]: value } : item,
    );
    setProfileForm({ ...profileForm, testimonials: updated });
  };

  return (
    <form className="card-body" onSubmit={handleSubmit}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: 28,
          paddingBottom: 16,
          borderBottom: "1px solid var(--border-light)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              background: "rgba(10, 144, 153, 0.12)",
              color: "var(--primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon name="user" size={24} />
          </div>
          <div>
            <h2
              style={{
                fontSize: "1.25rem",
                fontWeight: 800,
                color: "var(--text)",
                margin: 0,
              }}
            >
              {isRTL
                ? "الملف التعريفي والصفحة العامة"
                : "Profile & Public Page Settings"}
            </h2>
            <p
              style={{
                fontSize: "0.85rem",
                color: "var(--text-secondary)",
                margin: "4px 0 0 0",
              }}
            >
              {isRTL
                ? "إدارة بيانات الهوية، الهوية البصرية، النبذة التعريفية، ومعلومات التواصل التي تظهر للعملاء في صفحة مساحة العمل."
                : "Manage workspace identity, cover banner, description, and contact info displayed on your landing page."}
            </p>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving || !canEdit}
          className="btn btn-primary btn-md"
          style={{
            fontWeight: 700,
            borderRadius: 12,
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          {saving ? (
            <span className="spinner spinner-sm" />
          ) : (
            <Icon name="check" size={18} />
          )}
          <span>{t("saveChanges") || "حفظ التغييرات"}</span>
        </button>
      </div>

      {/* SECTION 1: Identity & Branding Media */}
      <div style={{ marginBottom: 32 }}>
        <h3
          style={{
            fontSize: "1.05rem",
            fontWeight: 700,
            marginBottom: 18,
            color: "var(--text)",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Icon name="sparkles" size={18} style={{ color: "var(--primary)" }} />
          <span>
            {isRTL
              ? "1. الهوية البصرية والصور الشخصية"
              : "1. Identity & Visual Media"}
          </span>
        </h3>

        <div className="grid grid-2" style={{ gap: 20, marginBottom: 20 }}>
          {/* Workspace Name */}
          <div className="form-group">
            <label className="form-label required">
              {t("workspaceName") || "اسم مساحة العمل"}
            </label>
            <input
              type="text"
              className="form-input"
              value={profileForm.name || ""}
              onChange={(e) =>
                setProfileForm({ ...profileForm, name: e.target.value })
              }
              required
              disabled={!canEdit}
              placeholder={
                t("workspaceNamePlaceholder") ||
                (isRTL
                  ? "مثال: عيادة القاهرة الشاملة"
                  : "e.g. Cairo Wellness Clinic")
              }
            />
          </div>

          {/* Slug */}
          <div className="form-group">
            <label className="form-label required">
              {t("workspaceSlug") || "الرابط المختصر (Slug)"}
            </label>
            <div style={{ position: "relative" }}>
              <input
                type="text"
                className="form-input"
                value={profileForm.slug || ""}
                onChange={(e) =>
                  setProfileForm({
                    ...profileForm,
                    slug: e.target.value.toLowerCase().replace(/\s+/g, "-"),
                  })
                }
                required
                disabled={!canEdit}
                dir="ltr"
                style={{ textAlign: "left", paddingInlineStart: 12 }}
                placeholder="cairo-wellness-clinic"
              />
            </div>
            <span
              style={{
                fontSize: "0.78rem",
                color: "var(--text-secondary)",
                marginTop: 4,
                display: "block",
              }}
            >
              https://cal.saabq.com/workspaces/{profileForm.slug || "slug"}
            </span>
          </div>
        </div>

        <div className="grid grid-2" style={{ gap: 20, marginBottom: 20 }}>
          {/* Workspace Type */}
          <div className="form-group">
            <label className="form-label">
              {t("workspaceType") || "مجال مساحة العمل / التخصص"}
            </label>
            <SearchableSelect
              options={typeOptions}
              value={profileForm.workspace_type_id}
              onChange={(val) =>
                setProfileForm({ ...profileForm, workspace_type_id: val })
              }
              placeholder={
                isRTL ? "اختر مجال مساحة العمل..." : "Select workspace type..."
              }
              disabled={!canEdit}
            />
          </div>

          {/* Tagline / Short Intro */}
          <div className="form-group">
            <label className="form-label">
              {t("bookingShortIntro") || "نبذة مختصرة (Tagline)"}
            </label>
            <input
              type="text"
              className="form-input"
              value={profileForm.booking_short_intro || ""}
              onChange={(e) =>
                setProfileForm({
                  ...profileForm,
                  booking_short_intro: e.target.value,
                })
              }
              disabled={!canEdit}
              placeholder={
                isRTL
                  ? "مثال: عيادة طبية متخصصة تقدم أحدث الاستشارات والرعاية الشاملة."
                  : "A specialized medical clinic delivering holistic consultations."
              }
            />
          </div>
        </div>

        {/* Media URLs: Logo & Cover Banner */}
        <div className="grid grid-2" style={{ gap: 24, marginTop: 24 }}>
          {/* Logo Card & Preview */}
          <div
            className="card"
            style={{
              padding: 20,
              borderRadius: 16,
              border: "1px solid var(--border)",
              background: "var(--surface-alt, #f8fafc)",
            }}
          >
            <label
              className="form-label"
              style={{ fontWeight: 700, marginBottom: 10 }}
            >
              {t("workspaceLogoUrl") || "رابط صورة الشعار (Logo URL)"}
            </label>
            <input
              type="url"
              className="form-input"
              value={profileForm.logo_url || ""}
              onChange={(e) =>
                setProfileForm({ ...profileForm, logo_url: e.target.value })
              }
              disabled={!canEdit}
              dir="ltr"
              placeholder="https://domain.com/logo.png"
              style={{ marginBottom: 14 }}
            />

            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 16,
                  border: "2px solid var(--border)",
                  background: "var(--surface)",
                  overflow: "hidden",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {profileForm.logo_url ? (
                  <LazyImage
                    src={profileForm.logo_url}
                    alt="Logo preview"
                    width={64}
                    height={64}
                    objectFit="cover"
                  />
                ) : (
                  <Icon
                    name="image"
                    size={28}
                    style={{ color: "var(--text-secondary)", opacity: 0.5 }}
                  />
                )}
              </div>
              <span
                style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}
              >
                {isRTL
                  ? "معاينة الشعار: يظهر أعلى بطاقة مساحة العمل."
                  : "Logo preview: Appears in your workspace header."}
              </span>
            </div>
          </div>

          {/* Cover Banner Card & Preview */}
          <div
            className="card"
            style={{
              padding: 20,
              borderRadius: 16,
              border: "1px solid var(--border)",
              background: "var(--surface-alt, #f8fafc)",
            }}
          >
            <label
              className="form-label"
              style={{ fontWeight: 700, marginBottom: 10 }}
            >
              {t("workspaceCoverUrl") ||
                "رابط صورة الغلاف العلوي (Cover Banner URL)"}
            </label>
            <input
              type="url"
              className="form-input"
              value={profileForm.cover_url || ""}
              onChange={(e) =>
                setProfileForm({ ...profileForm, cover_url: e.target.value })
              }
              disabled={!canEdit}
              dir="ltr"
              placeholder="https://domain.com/cover.jpg"
              style={{ marginBottom: 14 }}
            />

            <div
              style={{
                height: 64,
                borderRadius: 12,
                border: "2px solid var(--border)",
                background: profileForm.cover_url
                  ? `url(${profileForm.cover_url}) center/cover no-repeat`
                  : `linear-gradient(135deg, ${profileForm.primary_color || "#0a9099"}, ${profileForm.secondary_color || "#166992"})`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontSize: "0.85rem",
                fontWeight: 700,
                textShadow: "0 2px 4px rgba(0,0,0,0.5)",
              }}
            >
              {profileForm.cover_url
                ? isRTL
                  ? "معاينة غلاف البانر العلوي"
                  : "Cover Banner Preview"
                : isRTL
                  ? "نمط الغلاف الافتراضي"
                  : "Default Gradient Cover"}
            </div>
          </div>
        </div>

        {/* Theme Colors */}
        <div style={{ marginTop: 24 }}>
          <label className="form-label" style={{ fontWeight: 700 }}>
            {isRTL ? "ألوان الهوية البصرية (Theme Colors)" : "Theme Colors"}
          </label>
          <div className="grid grid-3" style={{ gap: 16, marginTop: 10 }}>
            <div className="form-group">
              <label className="form-label" style={{ fontSize: "0.84rem" }}>
                {t("primaryColor") || "اللون الرئيسي (Primary Color)"}
              </label>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <input
                  type="color"
                  value={profileForm.primary_color || "#0a9099"}
                  onChange={(e) =>
                    setProfileForm({
                      ...profileForm,
                      primary_color: e.target.value,
                    })
                  }
                  disabled={!canEdit}
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 10,
                    border: "none",
                    cursor: "pointer",
                  }}
                />
                <input
                  type="text"
                  className="form-input"
                  value={profileForm.primary_color || "#0a9099"}
                  onChange={(e) =>
                    setProfileForm({
                      ...profileForm,
                      primary_color: e.target.value,
                    })
                  }
                  disabled={!canEdit}
                  dir="ltr"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontSize: "0.84rem" }}>
                {t("secondaryColor") || "اللون الثانوي (Secondary Color)"}
              </label>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <input
                  type="color"
                  value={profileForm.secondary_color || "#166992"}
                  onChange={(e) =>
                    setProfileForm({
                      ...profileForm,
                      secondary_color: e.target.value,
                    })
                  }
                  disabled={!canEdit}
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 10,
                    border: "none",
                    cursor: "pointer",
                  }}
                />
                <input
                  type="text"
                  className="form-input"
                  value={profileForm.secondary_color || "#166992"}
                  onChange={(e) =>
                    setProfileForm({
                      ...profileForm,
                      secondary_color: e.target.value,
                    })
                  }
                  disabled={!canEdit}
                  dir="ltr"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontSize: "0.84rem" }}>
                {t("hoverColor") || "لون التمرير (Hover Color)"}
              </label>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <input
                  type="color"
                  value={profileForm.hover_color || "#44f2fe"}
                  onChange={(e) =>
                    setProfileForm({
                      ...profileForm,
                      hover_color: e.target.value,
                    })
                  }
                  disabled={!canEdit}
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 10,
                    border: "none",
                    cursor: "pointer",
                  }}
                />
                <input
                  type="text"
                  className="form-input"
                  value={profileForm.hover_color || "#44f2fe"}
                  onChange={(e) =>
                    setProfileForm({
                      ...profileForm,
                      hover_color: e.target.value,
                    })
                  }
                  disabled={!canEdit}
                  dir="ltr"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: Full HTML Description */}
      <div style={{ marginBottom: 32 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 16,
          }}
        >
          <h3
            style={{
              fontSize: "1.05rem",
              fontWeight: 700,
              margin: 0,
              color: "var(--text)",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Icon
              name="briefcase"
              size={18}
              style={{ color: "var(--primary)" }}
            />
            <span>
              {isRTL
                ? "2. الوصف التفصيلي (عن مساحة العمل)"
                : "2. Full Workspace Description"}
            </span>
          </h3>

          <div className="btn-group">
            <button
              type="button"
              onClick={() => setDescLang("ar")}
              className={`btn btn-xs ${descLang === "ar" ? "btn-primary" : "btn-secondary"}`}
            >
              العربية (AR)
            </button>
            <button
              type="button"
              onClick={() => setDescLang("en")}
              className={`btn btn-xs ${descLang === "en" ? "btn-primary" : "btn-secondary"}`}
            >
              English (EN)
            </button>
          </div>
        </div>

        {descLang === "ar" ? (
          <RichTextEditor
            value={profileForm.description?.ar || ""}
            onChange={(content) =>
              setProfileForm({
                ...profileForm,
                description: {
                  ...(profileForm.description || {}),
                  ar: content,
                },
              })
            }
            placeholder={
              t("workspaceDescriptionPlaceholder") ||
              (isRTL
                ? "اكتب وصفاً شاملاً ومؤثراً عن خدمات مساحة العمل..."
                : "Write a comprehensive overview of your workspace services...")
            }
          />
        ) : (
          <RichTextEditor
            value={profileForm.description?.en || ""}
            onChange={(content) =>
              setProfileForm({
                ...profileForm,
                description: {
                  ...(profileForm.description || {}),
                  en: content,
                },
              })
            }
            placeholder="Write a comprehensive overview of your workspace services..."
          />
        )}
      </div>

      {/* SECTION 3: Contact Details */}
      <div style={{ marginBottom: 32 }}>
        <h3
          style={{
            fontSize: "1.05rem",
            fontWeight: 700,
            marginBottom: 18,
            color: "var(--text)",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Icon name="phone" size={18} style={{ color: "var(--primary)" }} />
          <span>{isRTL ? "3. معلومات التواصل" : "3. Contact Details"}</span>
        </h3>

        <div className="grid grid-3" style={{ gap: 20 }}>
          <div className="form-group">
            <label className="form-label">
              {t("email") || "البريد الإلكتروني"}
            </label>
            <input
              type="email"
              className="form-input"
              value={profileForm.email || ""}
              onChange={(e) =>
                setProfileForm({ ...profileForm, email: e.target.value })
              }
              disabled={!canEdit}
              dir="ltr"
              placeholder="hello@company.com"
            />
          </div>

          <div className="form-group">
            <label className="form-label">{t("phone") || "رقم الهاتف"}</label>
            <input
              type="text"
              className="form-input"
              value={profileForm.phone || ""}
              onChange={(e) =>
                setProfileForm({ ...profileForm, phone: e.target.value })
              }
              disabled={!canEdit}
              dir="ltr"
              placeholder="+20 123 456 789"
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              {t("website") || "الموقع الإلكتروني"}
            </label>
            <input
              type="url"
              className="form-input"
              value={profileForm.website || ""}
              onChange={(e) =>
                setProfileForm({ ...profileForm, website: e.target.value })
              }
              disabled={!canEdit}
              dir="ltr"
              placeholder="https://company.com"
            />
          </div>
        </div>
      </div>

      {/* SECTION 4: Geographic Address & Location */}
      <div style={{ marginBottom: 32 }}>
        <h3
          style={{
            fontSize: "1.05rem",
            fontWeight: 700,
            marginBottom: 18,
            color: "var(--text)",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Icon name="map-pin" size={18} style={{ color: "var(--primary)" }} />
          <span>
            {isRTL ? "4. الموقع الجغرافي والعنوان" : "4. Geographic Location"}
          </span>
        </h3>

        <div className="grid grid-3" style={{ gap: 20, marginBottom: 16 }}>
          <div className="form-group">
            <label className="form-label">{t("country") || "الدولة"}</label>
            <SearchableSelect
              options={countryOptions}
              value={profileForm.country_id}
              onChange={(val) =>
                setProfileForm({
                  ...profileForm,
                  country_id: val,
                  state_id: "",
                  city_id: "",
                })
              }
              placeholder={isRTL ? "اختر الدولة..." : "Select country..."}
              disabled={!canEdit}
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              {t("state") || "المنطقة / المحافظة"}
            </label>
            <SearchableSelect
              options={stateOptions}
              value={profileForm.state_id}
              onChange={(val) =>
                setProfileForm({ ...profileForm, state_id: val, city_id: "" })
              }
              placeholder={
                loadingStates
                  ? isRTL
                    ? "جاري التحميل..."
                    : "Loading..."
                  : isRTL
                    ? "اختر المنطقة..."
                    : "Select state..."
              }
              disabled={!canEdit || !profileForm.country_id || loadingStates}
            />
          </div>

          <div className="form-group">
            <label className="form-label">{t("city") || "المدينة"}</label>
            <SearchableSelect
              options={cityOptions}
              value={profileForm.city_id}
              onChange={(val) =>
                setProfileForm({ ...profileForm, city_id: val })
              }
              placeholder={
                loadingCities
                  ? isRTL
                    ? "جاري التحميل..."
                    : "Loading..."
                  : isRTL
                    ? "اختر المدينة..."
                    : "Select city..."
              }
              disabled={!canEdit || !profileForm.state_id || loadingCities}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">
            {t("address") || "العنوان بالتفصيل"}
          </label>
          <input
            type="text"
            className="form-input"
            value={profileForm.address || ""}
            onChange={(e) =>
              setProfileForm({ ...profileForm, address: e.target.value })
            }
            disabled={!canEdit}
            placeholder={
              isRTL
                ? "مثال: شارع التسعين الشمالي، التجمع الخامس، القاهرة"
                : "e.g. 90th North St, Fifth Settlement, Cairo"
            }
          />
        </div>
      </div>

      {/* SECTION 5: Social Media Links */}
      <div style={{ marginBottom: 32 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 18,
          }}
        >
          <h3
            style={{
              fontSize: "1.05rem",
              fontWeight: 700,
              margin: 0,
              color: "var(--text)",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Icon name="globe" size={18} style={{ color: "var(--primary)" }} />
            <span>
              {isRTL ? "5. منصات التواصل الاجتماعي" : "5. Social Media Links"}
            </span>
          </h3>

          <button
            type="button"
            onClick={handleAddSocialLink}
            disabled={!canEdit}
            className="btn btn-secondary btn-sm"
            style={{ borderRadius: 999, fontWeight: 700 }}
          >
            + {isRTL ? "إضافة رابط تواصل" : "Add Link"}
          </button>
        </div>

        {Array.isArray(profileForm.social_links) &&
        profileForm.social_links.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {profileForm.social_links.map((linkItem, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  background: "var(--surface-alt, #f8fafc)",
                  padding: 14,
                  borderRadius: 14,
                  border: "1px solid var(--border)",
                }}
              >
                <div style={{ minWidth: 160 }}>
                  <select
                    className="form-select"
                    value={linkItem.platform || "website"}
                    onChange={(e) =>
                      handleSocialLinkChange(idx, "platform", e.target.value)
                    }
                    disabled={!canEdit}
                  >
                    {PLATFORMS.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ flex: 1 }}>
                  <input
                    type="url"
                    className="form-input"
                    value={linkItem.url || ""}
                    onChange={(e) =>
                      handleSocialLinkChange(idx, "url", e.target.value)
                    }
                    disabled={!canEdit}
                    dir="ltr"
                    placeholder="https://..."
                  />
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveSocialLink(idx)}
                  disabled={!canEdit}
                  className="btn btn-secondary btn-sm"
                  style={{
                    color: "#ef4444",
                    borderRadius: 10,
                    padding: "8px 12px",
                  }}
                  title={isRTL ? "حذف الرابط" : "Delete Link"}
                >
                  <Icon name="x" size={16} />
                </button>
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
            {isRTL
              ? "لم يتم إضافة روابط تواصل اجتماعياً بعد."
              : "No social media links added yet."}
          </p>
        )}
      </div>

      {/* SECTION 6: Photo Gallery Media */}
      <div style={{ marginBottom: 32 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 18,
          }}
        >
          <h3
            style={{
              fontSize: "1.05rem",
              fontWeight: 700,
              margin: 0,
              color: "var(--text)",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Icon name="image" size={18} style={{ color: "var(--primary)" }} />
            <span>
              {isRTL
                ? "6. معرض الصور (Workspace Gallery)"
                : "6. Photo Gallery Media"}
            </span>
          </h3>

          <button
            type="button"
            onClick={() => {
              setProfileForm({
                ...profileForm,
                gallery_urls: [...galleryItems, { url: "", caption: "" }],
              });
            }}
            disabled={!canEdit}
            className="btn btn-secondary btn-sm"
            style={{ borderRadius: 999, fontWeight: 700 }}
          >
            + {isRTL ? "إضافة صورة للمعرض" : "Add Image"}
          </button>
        </div>

        {galleryItems.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {galleryItems.map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  background: "var(--surface-alt, #f8fafc)",
                  padding: 14,
                  borderRadius: 14,
                  border: "1px solid var(--border)",
                }}
              >
                <div
                  style={{
                    width: 50,
                    height: 50,
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
                  {item.url ? (
                    <LazyImage
                      src={item.url}
                      alt={`Gallery item ${idx + 1}`}
                      width={50}
                      height={50}
                      objectFit="cover"
                    />
                  ) : (
                    <Icon
                      name="image"
                      size={20}
                      style={{ color: "#fff", opacity: 0.5 }}
                    />
                  )}
                </div>

                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                  }}
                >
                  <input
                    type="url"
                    className="form-input"
                    value={item.url || ""}
                    onChange={(e) => {
                      const updated = galleryItems.map((g, i) =>
                        i === idx ? { ...g, url: e.target.value } : g,
                      );
                      setProfileForm({ ...profileForm, gallery_urls: updated });
                    }}
                    disabled={!canEdit}
                    dir="ltr"
                    placeholder="https://images.unsplash.com/photo-..."
                  />
                  <input
                    type="text"
                    className="form-input"
                    value={item.caption || ""}
                    onChange={(e) => {
                      const updated = galleryItems.map((g, i) =>
                        i === idx ? { ...g, caption: e.target.value } : g,
                      );
                      setProfileForm({ ...profileForm, gallery_urls: updated });
                    }}
                    disabled={!canEdit}
                    placeholder={
                      isRTL
                        ? "وصف مختصر للصورة (اختياري)"
                        : "Photo caption (optional)"
                    }
                  />
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setProfileForm({
                      ...profileForm,
                      gallery_urls: galleryItems.filter((_, i) => i !== idx),
                    });
                  }}
                  disabled={!canEdit}
                  className="btn btn-secondary btn-sm"
                  style={{
                    color: "#ef4444",
                    borderRadius: 10,
                    padding: "8px 12px",
                  }}
                  title={isRTL ? "حذف الصورة" : "Delete Image"}
                >
                  <Icon name="x" size={16} />
                </button>
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
            {isRTL
              ? "لم يتم إضافة صور في المعرض بعد."
              : "No gallery images added yet."}
          </p>
        )}
      </div>

      {/* SECTION 7: Feature Highlights Cards */}
      <div style={{ marginBottom: 32 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 18,
          }}
        >
          <h3
            style={{
              fontSize: "1.05rem",
              fontWeight: 700,
              margin: 0,
              color: "var(--text)",
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
              {isRTL
                ? "7. مميزات وتطلعات مساحة العمل (لماذا تختار خدماتنا؟)"
                : "7. Feature Highlights (Why Choose Us)"}
            </span>
          </h3>

          <button
            type="button"
            onClick={() => {
              const current = Array.isArray(profileForm.feature_highlights)
                ? profileForm.feature_highlights
                : [];
              setProfileForm({
                ...profileForm,
                feature_highlights: [
                  ...current,
                  {
                    title: "",
                    description: "",
                    icon: "sparkles",
                    image_url: "",
                  },
                ],
              });
            }}
            disabled={!canEdit}
            className="btn btn-secondary btn-sm"
            style={{ borderRadius: 999, fontWeight: 700 }}
          >
            + {isRTL ? "إضافة كارت ميزة جديد" : "Add Feature Highlight"}
          </button>
        </div>

        {Array.isArray(profileForm.feature_highlights) &&
        profileForm.feature_highlights.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {profileForm.feature_highlights.map((item, idx) => (
              <div
                key={idx}
                style={{
                  background: "var(--surface-alt, #f8fafc)",
                  padding: 18,
                  borderRadius: 16,
                  border: "1px solid var(--border)",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 14,
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.88rem",
                      fontWeight: 700,
                      color: "var(--primary)",
                    }}
                  >
                    #{idx + 1} {isRTL ? "ميزة رقم" : "Feature Card"}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const current = Array.isArray(
                        profileForm.feature_highlights,
                      )
                        ? profileForm.feature_highlights
                        : [];
                      setProfileForm({
                        ...profileForm,
                        feature_highlights: current.filter((_, i) => i !== idx),
                      });
                    }}
                    disabled={!canEdit}
                    className="btn btn-secondary btn-sm"
                    style={{
                      color: "#ef4444",
                      borderRadius: 10,
                      padding: "4px 10px",
                    }}
                  >
                    <Icon name="x" size={16} />
                  </button>
                </div>

                <div
                  className="grid grid-2"
                  style={{ gap: 14, marginBottom: 14 }}
                >
                  <div className="form-group" style={{ margin: 0 }}>
                    <label
                      className="form-label"
                      style={{ fontSize: "0.82rem" }}
                    >
                      {isRTL ? "عنوان الميزة (Title)" : "Feature Title"}
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={item.title || ""}
                      onChange={(e) => {
                        const current = Array.isArray(
                          profileForm.feature_highlights,
                        )
                          ? profileForm.feature_highlights
                          : [];
                        const updated = current.map((f, i) =>
                          i === idx ? { ...f, title: e.target.value } : f,
                        );
                        setProfileForm({
                          ...profileForm,
                          feature_highlights: updated,
                        });
                      }}
                      disabled={!canEdit}
                      placeholder={
                        isRTL
                          ? "مثال: أطباء ومتخصصون معتمدون"
                          : "e.g. Certified Specialists"
                      }
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label
                      className="form-label"
                      style={{ fontSize: "0.82rem" }}
                    >
                      {isRTL ? "رمز الأيقونة (Icon)" : "Card Icon"}
                    </label>
                    <select
                      className="form-select"
                      value={item.icon || "sparkles"}
                      onChange={(e) => {
                        const current = Array.isArray(
                          profileForm.feature_highlights,
                        )
                          ? profileForm.feature_highlights
                          : [];
                        const updated = current.map((f, i) =>
                          i === idx ? { ...f, icon: e.target.value } : f,
                        );
                        setProfileForm({
                          ...profileForm,
                          feature_highlights: updated,
                        });
                      }}
                      disabled={!canEdit}
                    >
                      <option value="sparkles">
                        ✨ {isRTL ? "تمييز وسحر" : "Sparkles"}
                      </option>
                      <option value="shield">
                        🛡️ {isRTL ? "حماية وخصوصية" : "Shield"}
                      </option>
                      <option value="clock">
                        ⏰ {isRTL ? "وقت وسرعة" : "Clock"}
                      </option>
                      <option value="users">
                        👥 {isRTL ? "فريق عمل" : "Users"}
                      </option>
                      <option value="star">
                        ⭐ {isRTL ? "نجمة وتقييم" : "Star"}
                      </option>
                      <option value="phone">
                        📞 {isRTL ? "هاتف وتواصل" : "Phone"}
                      </option>
                      <option value="map-pin">
                        📍 {isRTL ? "موقع جغرافي" : "Map Pin"}
                      </option>
                      <option value="briefcase">
                        💼 {isRTL ? "حقيبة عمل" : "Briefcase"}
                      </option>
                      <option value="check">
                        ✅ {isRTL ? "تأكيد وصحة" : "Check"}
                      </option>
                    </select>
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 14 }}>
                  <label className="form-label" style={{ fontSize: "0.82rem" }}>
                    {isRTL ? "وصف الميزة (Description)" : "Feature Description"}
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={item.description || ""}
                    onChange={(e) => {
                      const current = Array.isArray(
                        profileForm.feature_highlights,
                      )
                        ? profileForm.feature_highlights
                        : [];
                      const updated = current.map((f, i) =>
                        i === idx ? { ...f, description: e.target.value } : f,
                      );
                      setProfileForm({
                        ...profileForm,
                        feature_highlights: updated,
                      });
                    }}
                    disabled={!canEdit}
                    placeholder={
                      isRTL
                        ? "مثال: طاقم طبي متكامل لتقديم أعلى مستويات الرعاية."
                        : "e.g. Expert staff providing world class care."
                    }
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: "0.82rem" }}>
                    {isRTL
                      ? "رابط صورة الميزة (اختياري)"
                      : "Feature Image URL (Optional)"}
                  </label>
                  <input
                    type="url"
                    className="form-input"
                    value={item.image_url || ""}
                    onChange={(e) => {
                      const current = Array.isArray(
                        profileForm.feature_highlights,
                      )
                        ? profileForm.feature_highlights
                        : [];
                      const updated = current.map((f, i) =>
                        i === idx ? { ...f, image_url: e.target.value } : f,
                      );
                      setProfileForm({
                        ...profileForm,
                        feature_highlights: updated,
                      });
                    }}
                    disabled={!canEdit}
                    dir="ltr"
                    placeholder="https://images.unsplash.com/photo-..."
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
            {isRTL
              ? "لم يتم إضافة مميزات مخصصة بعد (سيتم إظهار المميزات الافتراضية)."
              : "No custom feature highlights added yet (default features will be shown)."}
          </p>
        )}
      </div>

      {/* SECTION 8: Client Testimonials & Reviews */}
      <div style={{ marginBottom: 32 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 18,
          }}
        >
          <h3
            style={{
              fontSize: "1.05rem",
              fontWeight: 700,
              margin: 0,
              color: "var(--text)",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Icon name="quote" size={18} style={{ color: "var(--primary)" }} />
            <span>
              {isRTL
                ? "8. آراء وتقييمات العملاء (Testimonials)"
                : "8. Client Testimonials & Reviews"}
            </span>
          </h3>

          <button
            type="button"
            onClick={handleAddTestimonial}
            disabled={!canEdit}
            className="btn btn-secondary btn-sm"
            style={{ borderRadius: 999, fontWeight: 700 }}
          >
            + {isRTL ? "إضافة رأي عميل" : "Add Testimonial"}
          </button>
        </div>

        <p
          style={{
            color: "var(--text-secondary)",
            fontSize: "0.85rem",
            marginTop: -10,
            marginBottom: 16,
          }}
        >
          {isRTL
            ? "تظهر هذه الآراء في صفحتك العامة فقط عند إضافتها هنا — لن يتم عرض أي تقييمات وهمية."
            : "These reviews only appear on your public page once added here — no placeholder reviews are ever shown."}
        </p>

        {Array.isArray(profileForm.testimonials) &&
        profileForm.testimonials.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {profileForm.testimonials.map((item, idx) => (
              <div
                key={idx}
                style={{
                  background: "var(--surface-alt, #f8fafc)",
                  padding: 18,
                  borderRadius: 16,
                  border: "1px solid var(--border)",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 14,
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.88rem",
                      fontWeight: 700,
                      color: "var(--primary)",
                    }}
                  >
                    #{idx + 1} {isRTL ? "رأي عميل" : "Testimonial"}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTestimonial(idx)}
                    disabled={!canEdit}
                    className="btn btn-secondary btn-sm"
                    style={{
                      color: "#ef4444",
                      borderRadius: 10,
                      padding: "4px 10px",
                    }}
                  >
                    <Icon name="x" size={16} />
                  </button>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    marginBottom: 14,
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: "50%",
                      overflow: "hidden",
                      border: "1px solid var(--border)",
                      background: "var(--surface)",
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {item.avatar_url ? (
                      <LazyImage
                        src={item.avatar_url}
                        alt={item.client_name || "Client avatar"}
                        width={44}
                        height={44}
                        objectFit="cover"
                      />
                    ) : (
                      <Icon
                        name="user"
                        size={18}
                        style={{ color: "var(--text-secondary)", opacity: 0.5 }}
                      />
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <input
                      type="url"
                      className="form-input"
                      value={item.avatar_url || ""}
                      onChange={(e) =>
                        handleTestimonialChange(
                          idx,
                          "avatar_url",
                          e.target.value,
                        )
                      }
                      disabled={!canEdit}
                      dir="ltr"
                      placeholder={
                        isRTL
                          ? "رابط صورة العميل (اختياري)"
                          : "Client avatar URL (optional)"
                      }
                    />
                  </div>
                </div>

                <div
                  className="grid grid-2"
                  style={{ gap: 14, marginBottom: 14 }}
                >
                  <div className="form-group" style={{ margin: 0 }}>
                    <label
                      className="form-label"
                      style={{ fontSize: "0.82rem" }}
                    >
                      {isRTL ? "اسم العميل" : "Client Name"}
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={item.client_name || ""}
                      onChange={(e) =>
                        handleTestimonialChange(
                          idx,
                          "client_name",
                          e.target.value,
                        )
                      }
                      disabled={!canEdit}
                      placeholder={
                        isRTL ? "مثال: أحمد يوسف" : "e.g. Sarah Mitchell"
                      }
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label
                      className="form-label"
                      style={{ fontSize: "0.82rem" }}
                    >
                      {isRTL
                        ? "صفة العميل (اختياري)"
                        : "Client Role (Optional)"}
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={item.client_role || ""}
                      onChange={(e) =>
                        handleTestimonialChange(
                          idx,
                          "client_role",
                          e.target.value,
                        )
                      }
                      disabled={!canEdit}
                      placeholder={
                        isRTL ? "مثال: عميل منذ 2024" : "e.g. Client since 2024"
                      }
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 14 }}>
                  <label className="form-label" style={{ fontSize: "0.82rem" }}>
                    {isRTL ? "نص رأي العميل" : "Testimonial Quote"}
                  </label>
                  <textarea
                    className="form-textarea"
                    rows={2}
                    value={item.quote || ""}
                    onChange={(e) =>
                      handleTestimonialChange(idx, "quote", e.target.value)
                    }
                    disabled={!canEdit}
                    placeholder={
                      isRTL
                        ? "مثال: تجربة رائعة وفريق محترف، أنصح بالتعامل معهم."
                        : "e.g. Great experience and a professional team, highly recommend."
                    }
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: "0.82rem" }}>
                    {isRTL ? "التقييم" : "Rating"}
                  </label>
                  <div style={{ display: "flex", gap: 4 }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() =>
                          handleTestimonialChange(idx, "rating", star)
                        }
                        disabled={!canEdit}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: canEdit ? "pointer" : "default",
                          padding: 2,
                          color:
                            star <= (item.rating || 0)
                              ? "#f59e0b"
                              : "var(--border)",
                        }}
                        title={`${star} / 5`}
                      >
                        <Icon name="star" size={20} />
                      </button>
                    ))}
                  </div>
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
            {isRTL
              ? "لم يتم إضافة آراء عملاء بعد."
              : "No client testimonials added yet."}
          </p>
        )}
      </div>

      {/* Footer Actions */}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          paddingTop: 20,
          borderTop: "1px solid var(--border-light)",
        }}
      >
        <button
          type="submit"
          disabled={saving || !canEdit}
          className="btn btn-primary btn-lg"
          style={{
            fontWeight: 800,
            borderRadius: 14,
            minWidth: 200,
            justifyContent: "center",
          }}
        >
          {saving ? (
            <span className="spinner spinner-md" />
          ) : (
            <Icon name="check" size={20} />
          )}
          <span>{t("saveChanges") || "حفظ التغييرات"}</span>
        </button>
      </div>
    </form>
  );
}
