import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../context/ToastContext";
import { useLanguage } from "../../../context/LanguageContext";
import { usePermissions } from "../../../hooks/usePermissions";
import client, { endpoints } from "../../../api/client";
import { applyWorkspaceBranding } from "../../../utils/theme";
import SEO from "../../../components/ui/SEO";
import { TabSettingsSkeleton } from "../../../components/ui/Skeleton";

import CapabilityGate from "../../../components/common/CapabilityGate";

// Sub-tabs
import BasicInfoTab from "./workspace-settings/BasicInfoTab";
import BrandingTab from "./workspace-settings/BrandingTab";
import TimezoneTab from "./workspace-settings/TimezoneTab";
import SocialLinksTab from "./workspace-settings/SocialLinksTab";
import BookingFormFieldsTab from "./workspace-settings/BookingFormFieldsTab";
import PaymentReceiptsTab from "./workspace-settings/PaymentReceiptsTab";
import NotificationTemplatesTab from "./workspace-settings/NotificationTemplatesTab";
import WorkspaceTemplatesPage from "./WorkspaceTemplatesPage";

export default function WorkspaceSettingsPage() {
  const { fetchProfile, updateWorkspaceState } = useAuth();
  const { t } = useLanguage();
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const {
    isOwner,
    canUpdateSettings,
    canUpdateBranding,
    canUpdateBookingForms,
    canUpdatePayments,
    canUpdateNotifications,
  } = usePermissions();

  const subSettingsTab = searchParams.get("sub") || "basic";

  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const canEditBasic = isOwner || canUpdateSettings;
  const canEditBranding = isOwner || canUpdateBranding || canUpdateSettings;
  const canEditTimezone = isOwner || canUpdateSettings;
  const canEditSocial = isOwner || canUpdateSettings;
  const canEditFormFields =
    isOwner || canUpdateBookingForms || canUpdateSettings;
  const canEditPayment = isOwner || canUpdatePayments || canUpdateSettings;
  const canEditNotifications =
    isOwner || canUpdateNotifications || canUpdateSettings;
  const canEdit =
    isOwner ||
    canUpdateSettings ||
    canUpdateBranding ||
    canUpdateBookingForms ||
    canUpdatePayments ||
    canUpdateNotifications;

  // Forms
  const [basicForm, setBasicForm] = useState({
    name: "",
    email: "",
    phone: "",
    description: { ar: "", en: "" },
    customer_label_singular: { ar: "", en: "" },
    customer_label_plural: { ar: "", en: "" },
    customer_icon: "users",
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
  const [currencies, setCurrencies] = useState([]);
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
    document.title = `${t("settings") || "الإعدادات العامة"} | ${t("appName") || "تقويم سابق"}`;
    const loadSettings = async () => {
      if (loadingRef.current) return;
      loadingRef.current = true;
      setLoading(true);
      try {
        const [settingsRes, tmplRes, tzRes, currRes, typesRes, countriesRes] =
          await Promise.all([
            client.get(endpoints.workspaceSettings),
            client
              .get(endpoints.workspaceSettingsNotifications)
              .catch(() => null),
            client.get(endpoints.timezones).catch(() => null),
            client.get(endpoints.currencies).catch(() => null),
            client.get(endpoints.workspaceTypes).catch(() => null),
            client.get(endpoints.countries).catch(() => null),
          ]);

        if (tzRes?.data?.data && Array.isArray(tzRes.data.data)) {
          setTimezones(tzRes.data.data);
        }
        if (currRes?.data?.data && Array.isArray(currRes.data.data)) {
          setCurrencies(currRes.data.data);
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
          setBasicForm({
            name:
              typeof data.name === "object" && data.name !== null
                ? data.name?.ar || data.name?.en || ""
                : data.name || "",
            email: data.email || "",
            phone: data.phone || "",
            description:
              typeof data.description === "object" && data.description !== null
                ? {
                    ar: data.description?.ar || "",
                    en: data.description?.en || "",
                  }
                : { ar: data.description || "", en: "" },
            booking_short_intro:
              typeof data.booking_short_intro === "object" &&
              data.booking_short_intro !== null
                ? data.booking_short_intro?.ar ||
                  data.booking_short_intro?.en ||
                  ""
                : data.booking_short_intro || "",
            customer_label_singular:
              typeof data.customer_label_singular === "object" &&
              data.customer_label_singular !== null
                ? {
                    ar: data.customer_label_singular?.ar || "",
                    en: data.customer_label_singular?.en || "",
                  }
                : { ar: data.customer_label_singular || "", en: "" },
            customer_label_plural:
              typeof data.customer_label_plural === "object" &&
              data.customer_label_plural !== null
                ? {
                    ar: data.customer_label_plural?.ar || "",
                    en: data.customer_label_plural?.en || "",
                  }
                : { ar: data.customer_label_plural || "", en: "" },
            customer_icon: data.customer_icon || "users",
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
            gallery_urls: Array.isArray(data.gallery_urls)
              ? data.gallery_urls
              : [],
            feature_highlights: Array.isArray(data.feature_highlights)
              ? data.feature_highlights
              : [],
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
            timezone_id: data.timezone_id || data.timezone?.id || "",
            currency_id: data.currency_id || data.currency?.id || "",
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
          });
          setFormFieldsForm({
            field_statuses: data.field_statuses || {},
            booking_questions: data.booking_questions || [],
            custom_questions:
              data.booking_questions || data.custom_questions || [],
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
          "معندكش صلاحية تعديل إعدادات مساحة العمل",
      );
      return;
    }
    setSaving(true);
    try {
      const res = await client.put(targetEndpoint, data);
      if (res.data?.data) {
        const updatedData = res.data.data;
        setSettings(updatedData);
        setBasicForm((prev) => ({
          ...prev,
          name:
            typeof updatedData.name === "object" && updatedData.name !== null
              ? updatedData.name?.ar || updatedData.name?.en || ""
              : updatedData.name || prev.name,
          email: updatedData.email ?? prev.email,
          phone: updatedData.phone ?? prev.phone,
          description:
            typeof updatedData.description === "object" &&
            updatedData.description !== null
              ? {
                  ar: updatedData.description?.ar || "",
                  en: updatedData.description?.en || "",
                }
              : prev.description,
          customer_label_singular:
            typeof updatedData.customer_label_singular === "object" &&
            updatedData.customer_label_singular !== null
              ? {
                  ar: updatedData.customer_label_singular?.ar || "",
                  en: updatedData.customer_label_singular?.en || "",
                }
              : typeof updatedData.customer_label_singular === "string"
                ? {
                    ar: updatedData.customer_label_singular,
                    en: prev.customer_label_singular?.en || "",
                  }
                : prev.customer_label_singular,
          customer_label_plural:
            typeof updatedData.customer_label_plural === "object" &&
            updatedData.customer_label_plural !== null
              ? {
                  ar: updatedData.customer_label_plural?.ar || "",
                  en: updatedData.customer_label_plural?.en || "",
                }
              : typeof updatedData.customer_label_plural === "string"
                ? {
                    ar: updatedData.customer_label_plural,
                    en: prev.customer_label_plural?.en || "",
                  }
                : prev.customer_label_plural,
          customer_icon:
            updatedData.customer_icon || prev.customer_icon || "users",
          is_visible_in_explorer: updatedData.is_visible_in_explorer !== false,
          slug: updatedData.slug || prev.slug,
          status: updatedData.status || prev.status,
          workspace_type_id:
            updatedData.workspace_type_id ||
            updatedData.workspace_type?.id ||
            prev.workspace_type_id,
          country_id:
            updatedData.country_id ||
            updatedData.country?.id ||
            prev.country_id,
          state_id:
            updatedData.state_id || updatedData.state?.id || prev.state_id,
          city_id: updatedData.city_id || updatedData.city?.id || prev.city_id,
          website: updatedData.website ?? prev.website,
        }));
        setBrandingForm((prev) => ({
          ...prev,
          logo_url: updatedData.logo_url || updatedData.logo || prev.logo_url,
          cover_url:
            updatedData.cover_url || updatedData.cover || prev.cover_url,
          gallery_urls: Array.isArray(updatedData.gallery_urls)
            ? updatedData.gallery_urls
            : prev.gallery_urls,
          feature_highlights: Array.isArray(updatedData.feature_highlights)
            ? updatedData.feature_highlights
            : prev.feature_highlights,
        }));
        if (updatedData.booking_questions) {
          setFormFieldsForm((prev) => ({
            ...prev,
            field_statuses: updatedData.field_statuses || prev.field_statuses,
            booking_questions: updatedData.booking_questions,
            custom_questions: updatedData.booking_questions,
          }));
        }
        if (updateWorkspaceState) {
          updateWorkspaceState(updatedData);
        }
      }
      toast.success(
        res.data?.message ||
          t("settingsUpdatedSuccess") ||
          "اتحفظت الإعدادات بنجاح",
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
      toast.error(err.response?.data?.message || "حصل خطأ في حفظ الإعدادات");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotificationTemplate = async (key, formData) => {
    if (!canEdit || settings?.allow_template_editing === false) {
      toast.error(
        t("templateEditingDisabledNotice") ||
          "تعديل قوالب الإشعارات موقوف لمساحة العمل دي من الأدمن",
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
          "اتحدث قالب الإشعار بنجاح",
      );
    } catch (err) {
      toast.error(
        err.response?.data?.message || "حصل خطأ في تحديث قالب الإشعار",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <SEO title={t("settings")} noindex />

      {/* Main Settings Card with Dynamic Smooth Tab Transition Animation */}
      {subSettingsTab === "templates" ? (
        <div key={subSettingsTab} className="animate-tab-card">
          <WorkspaceTemplatesPage embedded />
        </div>
      ) : (
        <div
          key={subSettingsTab}
          className="card animate-tab-card"
          style={{ padding: 24 }}
        >
          {loading ? (
            <TabSettingsSkeleton />
          ) : (
            <>
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
                  canEdit={canEditBasic}
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
                  canEdit={canEditBranding}
                />
              )}
              {subSettingsTab === "timezone" && (
                <TimezoneTab
                  timezoneForm={timezoneForm}
                  setTimezoneForm={setTimezoneForm}
                  timezones={timezones}
                  currencies={currencies}
                  onSave={handleSaveSection}
                  saving={saving}
                  canEdit={canEditTimezone}
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
                  canEdit={canEditSocial}
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
                  canEdit={canEditFormFields}
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
                  canEdit={canEditPayment}
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
                      canEditNotifications &&
                      settings?.allow_template_editing !== false
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
      )}
    </div>
  );
}
