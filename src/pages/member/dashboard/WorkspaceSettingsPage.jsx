import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../context/ToastContext";
import { useLanguage } from "../../../context/LanguageContext";
import client, { endpoints } from "../../../api/client";
import { applyWorkspaceBranding } from "../../../utils/theme";
import SEO from "../../../components/ui/SEO";

import CapabilityGate from "../../../components/common/CapabilityGate";

// Sub-tabs
import ProfileTab from "./workspace-settings/ProfileTab";
import BasicInfoTab from "./workspace-settings/BasicInfoTab";
import BrandingTab from "./workspace-settings/BrandingTab";
import TimezoneTab from "./workspace-settings/TimezoneTab";
import SocialLinksTab from "./workspace-settings/SocialLinksTab";
import BookingRulesTab from "./workspace-settings/BookingRulesTab";
import BookingFormFieldsTab from "./workspace-settings/BookingFormFieldsTab";
import PaymentReceiptsTab from "./workspace-settings/PaymentReceiptsTab";
import NotificationTemplatesTab from "./workspace-settings/NotificationTemplatesTab";
import Icon from "../../../components/common/Icon";

export default function WorkspaceSettingsPage() {
  const { user, fetchProfile, updateWorkspaceState } = useAuth();
  const { t } = useLanguage();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const subSettingsTab = searchParams.get("sub") || "profile";

  const setSubSettingsTab = (subId) => {
    setSearchParams({ sub: subId }, { replace: true });
  };

  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Mouse Drag to Scroll State & Ref
  const scrollRef = useRef(null);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftState, setScrollLeftState] = useState(0);
  const [dragged, setDragged] = useState(false);

  const handleMouseDown = (e) => {
    if (!scrollRef.current) return;
    setIsMouseDown(true);
    setDragged(false);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeftState(scrollRef.current.scrollLeft);
  };

  const handleMouseLeave = () => {
    setIsMouseDown(false);
  };

  const handleMouseUp = () => {
    setIsMouseDown(false);
  };

  const handleMouseMove = (e) => {
    if (!isMouseDown || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    if (Math.abs(walk) > 5) {
      setDragged(true);
    }
    scrollRef.current.scrollLeft = scrollLeftState - walk;
  };

  const scrollByAmount = (amount) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: amount, behavior: "smooth" });
    }
  };

  // Permissions
  const isOwner = user?.is_owner === true;
  const userPermissions = Array.isArray(user?.permissions)
    ? user.permissions
    : [];
  const canEdit = isOwner || userPermissions.includes("settings_write");

  // Forms
  const [profileForm, setProfileForm] = useState({
    name: "",
    slug: "",
    workspace_type_id: "",
    booking_short_intro: "",
    description: { ar: "", en: "" },
    logo_url: "",
    cover_url: "",
    primary_color: "#0a9099",
    secondary_color: "#166992",
    hover_color: "#44f2fe",
    email: "",
    phone: "",
    website: "",
    country_id: "",
    state_id: "",
    city_id: "",
    address: "",
    social_links: [],
    gallery_urls: [],
    feature_highlights: [],
  });
  const [basicForm, setBasicForm] = useState({
    name: "",
    email: "",
    phone: "",
    description: "",
    customer_label_singular: "",
    customer_label_plural: "",
    is_visible_in_explorer: true,
    slug: "",
    status: "active",
    workspace_type_id: "",
    country_id: "",
    state_id: "",
    city_id: "",
    website: "",
  });
  const [brandingForm, setBrandingForm] = useState({
    logo_url: "",
    cover_url: "",
    primary_color: "#0a9099",
    secondary_color: "#166992",
    hover_color: "#44f2fe",
  });
  const [timezoneForm, setTimezoneForm] = useState({
    timezone: "Asia/Riyadh",
    date_format: "Y-m-d",
    time_format: "12h",
    start_of_week: "sunday",
  });
  const [socialForm, setSocialForm] = useState({
    website: "",
    facebook_url: "",
    twitter_url: "",
    instagram_url: "",
    linkedin_url: "",
    youtube_url: "",
  });
  const [bookingRulesForm, setBookingRulesForm] = useState({
    min_advance_notice_hours: 2,
    max_advance_booking_days: 30,
    default_slot_duration: 30,
    buffer_before_minutes: 0,
    buffer_after_minutes: 0,
  });
  const [formFieldsForm, setFormFieldsForm] = useState({
    collect_phone: true,
    collect_notes: true,
    require_phone: false,
  });
  const [paymentReceiptsForm, setPaymentReceiptsForm] = useState({
    receipt_mode: "required",
    tax_number: "",
    company_address: "",
    receipt_footer_note: "",
  });

  // Options Lists from API
  const [timezones, setTimezones] = useState([]);
  const [workspaceTypes, setWorkspaceTypes] = useState([]);
  const [countries, setCountries] = useState([]);

  // Notifications State (Pure Dynamic API Data — No Fallback Array)
  const [notificationTemplates, setNotificationTemplates] = useState([]);
  const [selectedTemplateKey, setSelectedTemplateKey] = useState("");
  const [templateLang, setTemplateLang] = useState("ar");
  const [notificationForm, setNotificationForm] = useState({
    is_active: true,
    subject_ar: "",
    subject_en: "",
    body_ar: "",
    body_en: "",
  });

  const selectTemplateItem = (tmpl) => {
    const key = tmpl.key || tmpl.id;
    setSelectedTemplateKey(key);
    setNotificationForm({
      is_active: tmpl.is_active !== false,
      subject_ar: tmpl.subject_ar || "",
      subject_en: tmpl.subject_en || "",
      body_ar: tmpl.body_ar || "",
      body_en: tmpl.body_en || "",
    });
  };

  const loadingRef = useRef(false);

  useEffect(() => {
    document.title = `${t("settings") || "الإعدادات العامة"} | ${t("appName") || "سابق كول"}`;
    const loadSettings = async () => {
      if (loadingRef.current) return;
      loadingRef.current = true;
      setLoading(true);
      try {
        const [settingsRes, tmplRes, tzRes, typesRes, countriesRes] =
          await Promise.all([
            client.get(endpoints.workspaceSettings),
            client
              .get(endpoints.workspaceSettingsNotifications)
              .catch(() => null),
            client.get(endpoints.timezones).catch(() => null),
            client.get(endpoints.workspaceTypes).catch(() => null),
            client.get(endpoints.countries).catch(() => null),
          ]);

        if (tzRes?.data?.data && Array.isArray(tzRes.data.data)) {
          setTimezones(tzRes.data.data);
        }
        if (typesRes?.data?.data && Array.isArray(typesRes.data.data)) {
          setWorkspaceTypes(typesRes.data.data);
        }
        if (countriesRes?.data?.data && Array.isArray(countriesRes.data.data)) {
          setCountries(countriesRes.data.data);
        }

        const data = settingsRes.data?.data;
        if (data) {
          setSettings(data);
          applyWorkspaceBranding(
            data.primary_color,
            data.secondary_color,
            data.hover_color,
          );
          setProfileForm({
            name: data.name || "",
            slug: data.slug || "",
            workspace_type_id:
              data.workspace_type_id || data.workspace_type?.id || "",
            booking_short_intro: data.booking_short_intro || "",
            description:
              typeof data.description === "object"
                ? {
                    ar: data.description?.ar || "",
                    en: data.description?.en || "",
                  }
                : { ar: data.description || "", en: "" },
            logo_url: data.logo_url || data.logo || "",
            cover_url: data.cover_url || data.cover || "",
            primary_color: data.primary_color || "#0a9099",
            secondary_color: data.secondary_color || "#166992",
            hover_color: data.hover_color || "#44f2fe",
            email: data.email || "",
            phone: data.phone || "",
            website: data.website || "",
            country_id: data.country_id || data.country?.id || "",
            state_id: data.state_id || data.state?.id || "",
            city_id: data.city_id || data.city?.id || "",
            address: data.address || "",
            social_links: Array.isArray(data.social_links)
              ? data.social_links
              : [],
            gallery_urls: Array.isArray(data.gallery_urls)
              ? data.gallery_urls
              : [],
            feature_highlights: Array.isArray(data.feature_highlights)
              ? data.feature_highlights
              : [],
          });
          setBasicForm({
            name: data.name || "",
            email: data.email || "",
            phone: data.phone || "",
            description:
              typeof data.description === "object"
                ? {
                    ar: data.description?.ar || "",
                    en: data.description?.en || "",
                  }
                : { ar: data.description || "", en: "" },
            customer_label_singular: data.customer_label_singular || "",
            customer_label_plural: data.customer_label_plural || "",
            is_visible_in_explorer: data.is_visible_in_explorer !== false,
            slug: data.slug || "",
            status: data.status || "active",
            workspace_type_id:
              data.workspace_type_id || data.workspace_type?.id || "",
            country_id: data.country_id || data.country?.id || "",
            state_id: data.state_id || data.state?.id || "",
            city_id: data.city_id || data.city?.id || "",
            website: data.website || "",
          });
          setBrandingForm({
            logo_url: data.logo_url || data.logo || "",
            cover_url: data.cover_url || data.cover || "",
            primary_color: data.primary_color || "#0a9099",
            secondary_color: data.secondary_color || "#166992",
            hover_color: data.hover_color || "#44f2fe",
          });
          const timeFmt =
            data.time_format === "24h" || data.time_format === "H:i"
              ? "24h"
              : "12h";
          const startWeek =
            data.start_of_week ||
            (data.week_start === 1
              ? "monday"
              : data.week_start === 6
                ? "saturday"
                : "sunday");
          const tzStr =
            typeof data.timezone === "object"
              ? data.timezone?.name || "Asia/Riyadh"
              : data.timezone || "Asia/Riyadh";
          setTimezoneForm({
            timezone: tzStr,
            date_format: data.date_format || "Y-m-d",
            time_format: timeFmt,
            start_of_week: startWeek,
          });
          setSocialForm({
            social_links: Array.isArray(data.social_links)
              ? data.social_links
              : [],
            website: data.website || "",
            facebook_url: data.facebook_url || "",
            twitter_url: data.twitter_url || "",
            instagram_url: data.instagram_url || "",
            linkedin_url: data.linkedin_url || "",
            youtube_url: data.youtube_url || "",
          });
          setBookingRulesForm({
            booking_short_intro: data.booking_short_intro || "",
            booking_enabled: data.booking_enabled !== false,
            auto_confirm_appointments: !!data.auto_confirm_appointments,
            default_buffer_before_minutes:
              data.default_buffer_before_minutes ?? 0,
            default_buffer_after_minutes:
              data.default_buffer_after_minutes ?? 0,
            minimum_booking_notice_minutes:
              data.minimum_booking_notice_minutes ?? 0,
            maximum_booking_days: data.maximum_booking_days ?? 30,
          });
          setFormFieldsForm({
            field_statuses: data.field_statuses || {},
            collect_phone: !!data.collect_phone,
            collect_notes: !!data.collect_notes,
            require_phone: !!data.require_phone,
          });
          setPaymentReceiptsForm({
            payment_receipt_mode:
              data.payment_receipt_mode || data.receipt_mode || "required",
            receipt_mode:
              data.payment_receipt_mode || data.receipt_mode || "required",
          });
          if (updateWorkspaceState) {
            updateWorkspaceState(data);
          }
        }

        if (
          tmplRes?.data?.data &&
          Array.isArray(tmplRes.data.data) &&
          tmplRes.data.data.length > 0
        ) {
          setNotificationTemplates(tmplRes.data.data);
          const first = tmplRes.data.data[0];
          if (first) {
            setSelectedTemplateKey(first.key);
            setNotificationForm({
              is_active: first.is_active !== false,
              subject_ar: first.subject_ar || "",
              subject_en: first.subject_en || "",
              body_ar: first.body_ar || "",
              body_en: first.body_en || "",
            });
          }
        }
      } catch (err) {
        console.warn("Workspace settings fetch error:", err);
      } finally {
        setLoading(false);
        loadingRef.current = false;
      }
    };
    loadSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSaveSection = async (
    data,
    targetEndpoint = endpoints.workspaceSettings,
  ) => {
    if (!canEdit) {
      toast.error(
        t("unauthorizedSettingsEdit") ||
          "لا تملك صلاحية تعديل إعدادات مساحة العمل",
      );
      return;
    }
    setSaving(true);
    try {
      const res = await client.put(targetEndpoint, data);
      if (res.data?.data) {
        setSettings(res.data.data);
        if (updateWorkspaceState) {
          updateWorkspaceState(res.data.data);
        }
      }
      toast.success(
        res.data?.message ||
          t("settingsUpdatedSuccess") ||
          "تم حفظ الإعدادات بنجاح",
      );
      if (fetchProfile) {
        await fetchProfile();
      }
      if (data.primary_color || data.secondary_color || data.hover_color) {
        applyWorkspaceBranding(
          data.primary_color || settings?.primary_color,
          data.secondary_color || settings?.secondary_color,
          data.hover_color || settings?.hover_color,
        );
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "فشل حفظ الإعدادات");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotificationTemplate = async (key, formData) => {
    if (!canEdit || settings?.allow_template_editing === false) {
      toast.error(
        t("templateEditingDisabledNotice") ||
          "تعديل قوالب الإشعارات معطل لمساحة العمل من قبل الأدمن",
      );
      return;
    }
    setSaving(true);
    try {
      const res = await client.put(
        `${endpoints.workspaceSettingsNotifications}/${key}`,
        formData,
      );
      const updated = res.data.data;
      if (updated) {
        setNotificationTemplates((prev) =>
          prev.map((t) => ((t.key || t.id) === key ? { ...t, ...updated } : t)),
        );
      }
      toast.success(
        res.data?.message ||
          t("settingsUpdatedSuccess") ||
          "تم تحديث قالب الإشعار بنجاح",
      );
    } catch (err) {
      toast.error(err.response?.data?.message || "فشل تحديث قالب الإشعار");
    } finally {
      setSaving(false);
    }
  };

  const settingsSubTabs = [
    {
      id: "profile",
      label: t("workspaceProfileSettings") || "الملف التعريفي والصفحة العامة",
      icon: <Icon name="user" size={15} />,
    },
    {
      id: "basic",
      label: t("workspaceBasicInfo") || "المعلومات الأساسية",
      icon: <Icon name="custom-34f286e2" size={15} />,
    },
    {
      id: "branding",
      label: t("workspaceBranding") || "الهوية والعلامة التجارية",
      icon: <Icon name="custom-ecd73178" size={15} />,
    },
    {
      id: "timezone",
      label: t("workspaceTimezone") || "المنطقة الزمنية وتنسيق الوقت",
      icon: <Icon name="clock" size={15} />,
    },
    {
      id: "social",
      label: t("workspaceSocialLinks") || "وسائل التواصل الاجتماعي والرابط",
      icon: <Icon name="link" size={15} />,
    },
    {
      id: "booking_rules",
      label: t("workspaceBookingRules") || "صفحة وقواعد الحجز",
      icon: <Icon name="custom-3f7c7395" size={15} />,
    },
    {
      id: "form_fields",
      label: t("workspaceFormFields") || "منشئ نموذج الحجز",
      icon: <Icon name="edit" size={15} />,
    },
    {
      id: "payment",
      label: t("workspacePaymentReceipts") || "إيصالات الدفع",
      icon: <Icon name="credit-card" size={15} />,
    },
    {
      id: "notifications",
      label: t("workspaceNotificationTemplates") || "قوالب الإشعارات",
      icon: <Icon name="mail" size={15} />,
    },
  ];

  return (
    <div>
      <SEO title={t("settings")} noindex />
      {/* Draggable & Arrow-Controlled Horizontal Pill Sub-Tabs Navigation */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 16,
          position: "relative",
        }}
      >
        {/* Scroll Right / Back Arrow Button */}
        <button
          type="button"
          onClick={() => scrollByAmount(180)}
          title={t("scrollRightTooltip") || "التمرير لليمين"}
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            border: "1px solid var(--border)",
            background: "var(--surface)",
            color: "var(--text-secondary)",
            display: "flex",
            alignItems: "center",
            justify: "center",
            cursor: "pointer",
            flexShrink: 0,
            transition: "all 0.2s ease",
            boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
          }}
        >
          <Icon name="chevron-right" size={16} />
        </button>

        {/* Scrollable Container with Drag to Scroll & Hidden Scrollbar */}
        <div
          ref={scrollRef}
          className="no-scrollbar"
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseLeave}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
          style={{
            display: "flex",
            gap: 8,
            overflowX: "auto",
            paddingBottom: 4,
            paddingTop: 4,
            userSelect: "none",
            cursor: isMouseDown ? "grabbing" : "grab",
            flex: 1,
          }}
        >
          {settingsSubTabs.map((sub) => {
            const isSubActive = subSettingsTab === sub.id;
            return (
              <button
                key={sub.id}
                type="button"
                onClick={() => {
                  if (!dragged) {
                    setSubSettingsTab(sub.id);
                  }
                }}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "8px 16px",
                  borderRadius: 20,
                  border: isSubActive
                    ? "1px solid var(--primary)"
                    : "1px solid var(--border)",
                  background: isSubActive ? "var(--primary)" : "var(--surface)",
                  color: isSubActive ? "#ffffff" : "var(--text-secondary)",
                  fontWeight: isSubActive ? 700 : 500,
                  fontSize: "0.84rem",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  transition: "all 0.2s ease",
                  boxShadow: isSubActive
                    ? "0 2px 8px rgba(17,100,106,0.22)"
                    : "none",
                  flexShrink: 0,
                }}
              >
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    color: "currentColor",
                  }}
                >
                  {sub.icon}
                </span>
                <span>{sub.label}</span>
              </button>
            );
          })}
        </div>

        {/* Scroll Left / Forward Arrow Button */}
        <button
          type="button"
          onClick={() => scrollByAmount(-180)}
          title={t("scrollLeftTooltip") || "التمرير لليسار"}
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            border: "1px solid var(--border)",
            background: "var(--surface)",
            color: "var(--text-secondary)",
            display: "flex",
            alignItems: "center",
            justify: "center",
            cursor: "pointer",
            flexShrink: 0,
            transition: "all 0.2s ease",
            boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
          }}
        >
          <Icon name="chevron-left" size={16} />
        </button>
      </div>

      {/* Main Settings Card with Dynamic Smooth Tab Transition Animation */}
      <div
        key={subSettingsTab}
        className="card animate-tab-card"
        style={{ padding: 24 }}
      >
        {loading ? (
          <div style={{ padding: 40, textAlign: "center" }}>
            <span
              className="spinner spinner-md"
              style={{ margin: "0 auto 12px" }}
            />
            <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>
              {t("loading")}
            </p>
          </div>
        ) : (
          <>
            {subSettingsTab === "profile" && (
              <ProfileTab
                profileForm={profileForm}
                setProfileForm={setProfileForm}
                workspaceTypes={workspaceTypes}
                countries={countries}
                onSave={(data) =>
                  handleSaveSection(data, endpoints.workspaceSettingsProfile)
                }
                saving={saving}
                canEdit={canEdit}
              />
            )}
            {subSettingsTab === "basic" && (
              <BasicInfoTab
                basicForm={basicForm}
                setBasicForm={setBasicForm}
                workspaceTypes={workspaceTypes}
                countries={countries}
                onSave={(data) =>
                  handleSaveSection(data, endpoints.workspaceSettingsBasic)
                }
                saving={saving}
                canEdit={canEdit}
              />
            )}
            {subSettingsTab === "branding" && (
              <BrandingTab
                brandingForm={brandingForm}
                setBrandingForm={setBrandingForm}
                onSave={(data) =>
                  handleSaveSection(data, endpoints.workspaceSettingsBranding)
                }
                saving={saving}
                canEdit={canEdit}
              />
            )}
            {subSettingsTab === "timezone" && (
              <TimezoneTab
                timezoneForm={timezoneForm}
                setTimezoneForm={setTimezoneForm}
                timezones={timezones}
                onSave={handleSaveSection}
                saving={saving}
                canEdit={canEdit}
              />
            )}
            {subSettingsTab === "social" && (
              <SocialLinksTab
                socialForm={socialForm}
                setSocialForm={setSocialForm}
                onSave={(data) =>
                  handleSaveSection(data, endpoints.workspaceSettingsSocial)
                }
                saving={saving}
                canEdit={canEdit}
              />
            )}
            {subSettingsTab === "booking_rules" && (
              <BookingRulesTab
                bookingRulesForm={bookingRulesForm}
                setBookingRulesForm={setBookingRulesForm}
                onSave={(data) =>
                  handleSaveSection(
                    data,
                    endpoints.workspaceSettingsBookingRules,
                  )
                }
                saving={saving}
                canEdit={canEdit}
              />
            )}
            {subSettingsTab === "form_fields" && (
              <BookingFormFieldsTab
                formFieldsForm={formFieldsForm}
                setFormFieldsForm={setFormFieldsForm}
                onSave={(data) =>
                  handleSaveSection(
                    data,
                    endpoints.workspaceSettingsBookingForm,
                  )
                }
                saving={saving}
                canEdit={canEdit}
              />
            )}
            {subSettingsTab === "payment" && (
              <PaymentReceiptsTab
                paymentReceiptsForm={paymentReceiptsForm}
                setPaymentReceiptsForm={setPaymentReceiptsForm}
                onSave={(data) =>
                  handleSaveSection(data, endpoints.workspaceSettingsPayment)
                }
                saving={saving}
                canEdit={canEdit}
              />
            )}
            {subSettingsTab === "notifications" && (
              <CapabilityGate capabilityCode="CUSTOM_TEMPLATES">
                <NotificationTemplatesTab
                  templates={notificationTemplates}
                  selectedTemplateKey={selectedTemplateKey}
                  selectTemplateItem={selectTemplateItem}
                  templateLang={templateLang}
                  setTemplateLang={setTemplateLang}
                  notificationForm={notificationForm}
                  setNotificationForm={setNotificationForm}
                  onSave={handleSaveNotificationTemplate}
                  saving={saving}
                  canEdit={
                    canEdit && settings?.allow_template_editing !== false
                  }
                  allowTemplateEditing={
                    settings?.allow_template_editing !== false
                  }
                  getInterpolatedText={(txt) => txt || ""}
                />
              </CapabilityGate>
            )}
          </>
        )}
      </div>
    </div>
  );
}
