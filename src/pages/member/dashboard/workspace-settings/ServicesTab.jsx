import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useLanguage } from "../../../../context/LanguageContext";
import { useAuth } from "../../../../context/AuthContext";
import UserAvatar from "../../../../components/ui/UserAvatar";
import Icon from "../../../../components/common/Icon";
import client, { endpoints } from "../../../../api/client";
import ConfirmationModal from "./ConfirmationModal";

const defaultFormState = {
  id: null,
  slug: "",
  name_ar: "",
  name_en: "",
  short_description_ar: "",
  short_description_en: "",
  description_ar: "",
  description_en: "",
  duration_minutes: 30,
  price: 0,
  currency: "SAR",
  buffer_before_minutes: 0,
  buffer_after_minutes: 0,
  capacity: 1,
  booking_mode: "instant",
  requires_meeting: false,
  location: "",
  status: "active",
  is_featured: false,
  booking_enabled: true,
  show_member_profile: false,
  minimum_booking_notice_minutes: 0,
  maximum_booking_days: 30,
  workspace_member_id: "",
  schedule_id: "",
};

export default function ServicesTab({
  services = [],
  members = [],
  schedules = [],
  canEdit,
  onSaveService,
  onDeleteService,
}) {
  const { t, isRTL } = useLanguage();
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState(defaultFormState);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    isDanger: true,
    confirmText: "",
    cancelText: "",
    onConfirm: null,
  });

  const isOwner = user?.is_owner === true;

  const canDeleteService = (s) => {
    if (!canEdit || !s) return false;
    if (isOwner) return true;
    if (
      s.workspace_member_id &&
      Number(s.workspace_member_id) === Number(user?.id)
    ) {
      return true;
    }
    return false;
  };

  const handleDeleteClick = (s) => {
    const serviceName =
      (typeof s.name === "object"
        ? isRTL
          ? s.name?.ar || s.name?.en
          : s.name?.en || s.name?.ar
        : s.name) || (isRTL ? "هذه الخدمة" : "this service");

    setConfirmModal({
      isOpen: true,
      isDanger: true,
      title: t("deleteService") || (isRTL ? "حذف الخدمة" : "Delete Service"),
      message:
        t("confirmDeleteService") ||
        (isRTL
          ? `هل أنت تأكد من رغبتك في حذف "${serviceName}"؟ لا يمكن التراجع عن هذا الإجراء.`
          : `Are you sure you want to delete "${serviceName}"? This action cannot be undone.`),
      confirmText: t("delete") || (isRTL ? "حذف" : "Delete"),
      cancelText: t("cancel") || (isRTL ? "إلغاء" : "Cancel"),
      onConfirm: () => {
        if (onDeleteService) {
          onDeleteService(s.id);
        }
      },
    });
  };
  const [availableCurrencies, setAvailableCurrencies] = useState(() => [
    {
      id: 1,
      code: "SAR",
      name: isRTL ? "ريال سعودي" : "Saudi Riyal",
      symbol_native: isRTL ? "ر.س" : "SAR",
    },
    {
      id: 2,
      code: "EGP",
      name: isRTL ? "جنيه مصري" : "Egyptian Pound",
      symbol_native: isRTL ? "ج.م" : "EGP",
    },
  ]);

  useEffect(() => {
    let isMounted = true;
    client
      .get(endpoints.currencies)
      .then((res) => {
        if (isMounted && res.data?.data && Array.isArray(res.data.data)) {
          setAvailableCurrencies(res.data.data);
        }
      })
      .catch((err) => console.error("Failed to fetch currencies:", err));
    return () => {
      isMounted = false;
    };
  }, []);

  const getCustomerBookingUrl = (service) => {
    const workspaceSlug =
      user?.workspace?.slug || user?.workspace_slug || "default";
    const serviceSlug =
      typeof service === "object" ? service.slug || service.id : service;
    return `${window.location.origin}/workspaces/${workspaceSlug}/book?service=${serviceSlug}`;
  };

  const handleOpenCreate = () => {
    setForm(defaultFormState);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (service) => {
    const getFieldVal = (field, lang) => {
      const val = service[field];
      if (typeof val === "object" && val !== null) {
        return val[lang] || "";
      }
      if (typeof val === "string") {
        if (lang === "ar") return val;
        return service[`${field}_en`] || "";
      }
      return "";
    };

    const nameAr = getFieldVal("name", "ar");
    const nameEn = getFieldVal("name", "en");
    const shortDescAr = getFieldVal("short_description", "ar");
    const shortDescEn = getFieldVal("short_description", "en");
    const descAr = getFieldVal("description", "ar");
    const descEn = getFieldVal("description", "en");

    const currencyCode =
      (typeof service.currency === "object" && service.currency?.code) ||
      (typeof service.currency_detail === "object" &&
        service.currency_detail?.code) ||
      (typeof service.currency === "string" && service.currency) ||
      service.currency_code ||
      (availableCurrencies && availableCurrencies.length > 0
        ? availableCurrencies[0].code
        : "SAR");

    const matchedCurr = availableCurrencies?.find(
      (c) =>
        c.code === currencyCode ||
        c.id === service.currency_id ||
        c.id === service.currency?.id,
    );

    setForm({
      id: service.id,
      slug: service.slug || "",
      schedule_id: service.schedule_id || service.schedule?.id || "",
      name_ar: nameAr,
      name_en: nameEn,
      short_description_ar: shortDescAr,
      short_description_en: shortDescEn,
      description_ar: descAr,
      description_en: descEn,
      duration_minutes: service.duration_minutes ?? service.duration ?? 30,
      price: service.price ?? 0,
      currency: matchedCurr?.code || currencyCode,
      currency_id:
        matchedCurr?.id || service.currency_id || service.currency?.id || 1,
      buffer_before_minutes: service.buffer_before_minutes ?? 0,
      buffer_after_minutes: service.buffer_after_minutes ?? 0,
      capacity: service.capacity ?? 1,
      booking_mode: service.booking_mode || "instant",
      requires_meeting: service.requires_meeting ?? false,
      location: service.location || "",
      status: service.status || "active",
      is_featured: service.is_featured ?? false,
      booking_enabled: service.booking_enabled ?? true,
      show_member_profile: service.show_member_profile ?? false,
      minimum_booking_notice_minutes:
        service.minimum_booking_notice_minutes ?? 0,
      maximum_booking_days: service.maximum_booking_days ?? 30,
      workspace_member_id:
        service.workspace_member_id || service.workspace_member?.id || "",
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (onSaveService) {
      const {
        name_ar,
        name_en,
        short_description_ar,
        short_description_en,
        description_ar,
        description_en,
        id,
        ...rest
      } = form;

      const selectedCurr = availableCurrencies.find(
        (c) => c.code === form.currency,
      );

      const payload = {
        ...rest,
        capacity:
          form.capacity !== "" &&
          form.capacity !== null &&
          form.capacity !== undefined
            ? parseInt(form.capacity, 10)
            : 1,
        duration_minutes:
          form.duration_minutes !== "" && form.duration_minutes !== null
            ? parseInt(form.duration_minutes, 10)
            : 30,
        price:
          form.price !== "" && form.price !== null ? parseFloat(form.price) : 0,
        buffer_before_minutes: form.buffer_before_minutes
          ? parseInt(form.buffer_before_minutes, 10)
          : 0,
        buffer_after_minutes: form.buffer_after_minutes
          ? parseInt(form.buffer_after_minutes, 10)
          : 0,
        minimum_booking_notice_minutes: form.minimum_booking_notice_minutes
          ? parseInt(form.minimum_booking_notice_minutes, 10)
          : 0,
        maximum_booking_days: form.maximum_booking_days
          ? parseInt(form.maximum_booking_days, 10)
          : 30,
        currency_id: selectedCurr?.id || form.currency_id || null,
        slug: form.slug ? form.slug.trim() : undefined,
        schedule_id: form.schedule_id ? parseInt(form.schedule_id, 10) : null,
        workspace_member_id: form.workspace_member_id
          ? parseInt(form.workspace_member_id, 10)
          : null,
        show_member_profile: Boolean(form.show_member_profile),
        name: {
          ar: name_ar || name_en || "",
          en: name_en || name_ar || "",
        },
        short_description: {
          ar: short_description_ar || "",
          en: short_description_en || "",
        },
        description: {
          ar: description_ar || "",
          en: description_en || "",
        },
      };

      if (id) {
        payload.id = id;
      }

      await onSaveService(payload);
    }
    setIsModalOpen(false);
  };

  const servicesList = Array.isArray(services) ? services : [];

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
            {t("workspaceServices") ||
              (isRTL ? "إدارة خدمات المساحة" : "Workspace Services Management")}
          </h2>
          <p
            style={{
              fontSize: "0.86rem",
              color: "var(--text-secondary)",
              margin: "4px 0 0",
            }}
          >
            {t("workspaceServicesDesc") ||
              (isRTL
                ? "إضافة وتحديث جميع بيانات وقواعد وإعدادات الخدمات المتاحة للحجز."
                : "Manage customer services, pricing, and durations")}
          </p>
        </div>
        {canEdit ? (
          <button className="btn btn-primary btn-sm" onClick={handleOpenCreate}>
            +{" "}
            {t("addService") ||
              (isRTL ? "إضافة خدمة جديدة" : "Add New Service")}
          </button>
        ) : (
          <span
            className="profile-badge unverified"
            style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
          >
            <Icon name="lock" size={12} />
            {t("readOnlyNotice") ||
              (isRTL ? "العرض فقط (بدون تعديل)" : "Read-only mode")}
          </span>
        )}
      </div>

      {/* Services Grid */}
      {servicesList.length === 0 ? (
        <div
          style={{
            padding: "48px 20px",
            textAlign: "center",
            background: "var(--surface-alt)",
            borderRadius: "var(--radius-lg)",
            border: "1px border-dashed var(--border)",
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              background: "var(--primary-subtle)",
              color: "var(--primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 12px",
            }}
          >
            <Icon name="custom-bc148024" size={24} />
          </div>
          <h4
            style={{
              fontSize: "1rem",
              fontWeight: 700,
              margin: "0 0 6px",
              color: "var(--heading)",
            }}
          >
            {t("noServicesFound") ||
              (isRTL
                ? "لا توجد خدمات مضافة حالياً في مساحة العمل"
                : "No services found in this workspace")}
          </h4>
          <p
            style={{
              fontSize: "0.85rem",
              color: "var(--muted)",
              margin: "0 0 16px",
            }}
          >
            {t("noServicesDesc") ||
              (isRTL
                ? "قم بإضافة خدماتك الأولى لتتيح للعملاء اختيارها وحجز المواعيد."
                : "Add your first service to allow customers to select and book appointments.")}
          </p>
          {canEdit && (
            <button
              className="btn btn-primary btn-sm"
              onClick={handleOpenCreate}
            >
              +{" "}
              {t("addFirstService") ||
                (isRTL ? "إضافة أول خدمة" : "Add First Service")}
            </button>
          )}
        </div>
      ) : (
        <div className="services-grid">
          {servicesList.map((s) => {
            const _isEnabled = s.booking_enabled ?? true;
            const isFeatured = s.is_featured ?? false;
            const duration = s.duration_minutes || s.duration || 30;
            const price = s.price ?? 0;
            const rawCurr = s.currency;
            const currencySymbol =
              typeof rawCurr === "object" && rawCurr !== null
                ? rawCurr.symbol_native ||
                  rawCurr.symbol ||
                  rawCurr.code ||
                  "SAR"
                : rawCurr || "SAR";

            const nameDisplay =
              typeof s.name === "object"
                ? isRTL
                  ? s.name?.ar || s.name?.en
                  : s.name?.en || s.name?.ar
                : s.name || s.title;
            const shortDescDisplay =
              typeof s.short_description === "object"
                ? isRTL
                  ? s.short_description?.ar || s.short_description?.en
                  : s.short_description?.en || s.short_description?.ar
                : s.short_description;
            const descDisplay =
              typeof s.description === "object"
                ? isRTL
                  ? s.description?.ar || s.description?.en
                  : s.description?.en || s.description?.ar
                : s.description;

            return (
              <div
                key={s.id}
                style={{
                  padding: "16px 14px",
                  borderRadius: "var(--radius-lg)",
                  border: isFeatured
                    ? "1.5px solid var(--primary)"
                    : "1px solid var(--border-light)",
                  background: "var(--surface)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  gap: 14,
                  boxShadow: isFeatured
                    ? "0 4px 14px rgba(17, 100, 106, 0.08)"
                    : "0 2px 10px rgba(0,0,0,0.02)",
                  position: "relative",
                  width: "100%",
                  maxWidth: "100%",
                  boxSizing: "border-box",
                  overflow: "hidden",
                }}
                className="hover-card"
              >
                <div
                  style={{
                    width: "100%",
                    minWidth: 0,
                    boxSizing: "border-box",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      flexWrap: "wrap",
                      gap: 8,
                      marginBottom: 10,
                      width: "100%",
                      boxSizing: "border-box",
                    }}
                  >
                    <div
                      style={{
                        flex: "1 1 100%",
                        minWidth: 0,
                        width: "100%",
                        boxSizing: "border-box",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          flexWrap: "wrap",
                        }}
                      >
                        <h3
                          style={{
                            fontSize: "1.05rem",
                            fontWeight: 800,
                            margin: 0,
                            color: "var(--heading)",
                          }}
                        >
                          {nameDisplay}
                        </h3>
                        {isFeatured && (
                          <span
                            style={{
                              fontSize: "0.7rem",
                              background: "#fef3c7",
                              color: "#b45309",
                              padding: "2px 8px",
                              borderRadius: 12,
                              fontWeight: 700,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                            }}
                          >
                            <Icon name="star" size={12} />
                            {t("featured") || (isRTL ? "مميزة" : "Featured")}
                          </span>
                        )}
                        <span
                          style={{
                            fontSize: "0.7rem",
                            padding: "2px 8px",
                            borderRadius: 12,
                            fontWeight: 700,
                            background:
                              s.status === "active"
                                ? "#dcfce7"
                                : s.status === "draft"
                                  ? "#fef3c7"
                                  : "#f3f4f6",
                            color:
                              s.status === "active"
                                ? "#15803d"
                                : s.status === "draft"
                                  ? "#b45309"
                                  : "#4b5563",
                          }}
                        >
                          {s.status === "active"
                            ? t("statusActive") || (isRTL ? "نشطة" : "Active")
                            : s.status === "draft"
                              ? t("statusDraft") || (isRTL ? "مسودة" : "Draft")
                              : t("statusArchived") ||
                                (isRTL ? "مؤرشفة" : "Archived")}
                        </span>
                        <span
                          style={{
                            fontSize: "0.7rem",
                            padding: "2px 8px",
                            borderRadius: 12,
                            fontWeight: 700,
                            background: s.booking_enabled
                              ? "#ccfbf1"
                              : "#fee2e2",
                            color: s.booking_enabled ? "#0f766e" : "#991b1b",
                          }}
                        >
                          {s.booking_enabled
                            ? t("bookingActive") ||
                              (isRTL
                                ? "الحجز أونلاين مفعّل"
                                : "Online Booking Active")
                            : t("bookingDisabled") ||
                              (isRTL
                                ? "الحجز أونلاين معطّل"
                                : "Online Booking Disabled")}
                        </span>
                      </div>
                      {shortDescDisplay && (
                        <p
                          style={{
                            fontSize: "0.8rem",
                            color: "var(--primary)",
                            margin: "4px 0 0",
                            fontWeight: 600,
                          }}
                        >
                          {shortDescDisplay}
                        </p>
                      )}
                    </div>

                    <span
                      className="profile-badge verified"
                      style={{
                        fontSize: "0.78rem",
                        padding: "3px 10px",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        flexShrink: 0,
                      }}
                    >
                      <Icon name="clock" size={12} />
                      {duration} {t("minUnit") || (isRTL ? "دقيقة" : "min")}
                    </span>
                  </div>

                  <p
                    style={{
                      fontSize: "0.86rem",
                      color: "var(--text-secondary)",
                      lineHeight: 1.6,
                      margin: "0 0 10px",
                    }}
                  >
                    {descDisplay ||
                      t("noServiceDescription") ||
                      (isRTL
                        ? "لا يوجد وصف تفصيلي مضاف لهذه الخدمة."
                        : "No detailed description provided for this service.")}
                  </p>

                  {/* Metadata Chips */}
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 8,
                      marginTop: 10,
                    }}
                  >
                    {s.location && (
                      <span
                        style={{
                          fontSize: "0.76rem",
                          background: "var(--surface-alt)",
                          padding: "3px 9px",
                          borderRadius: 6,
                          color: "var(--text-secondary)",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <Icon name="map-pin" size={12} />
                        {s.location}
                      </span>
                    )}
                    {s.capacity > 1 && (
                      <span
                        style={{
                          fontSize: "0.76rem",
                          background: "var(--surface-alt)",
                          padding: "3px 9px",
                          borderRadius: 6,
                          color: "var(--text-secondary)",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <Icon name="custom-0c2e06fd" size={12} />
                        {s.capacity}{" "}
                        {t("persons") || (isRTL ? "أشخاص" : "persons")}
                      </span>
                    )}
                    {s.schedule && (
                      <span
                        style={{
                          fontSize: "0.76rem",
                          background: "#f0fdf4",
                          color: "#166534",
                          padding: "3px 9px",
                          borderRadius: 6,
                          fontWeight: 600,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <Icon name="calendar" size={12} />
                        {s.schedule.name}
                      </span>
                    )}
                    {s.booking_mode === "confirmation" && (
                      <span
                        style={{
                          fontSize: "0.76rem",
                          background: "#eff6ff",
                          color: "#1d4ed8",
                          padding: "3px 9px",
                          borderRadius: 6,
                          fontWeight: 600,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <Icon name="copy" size={12} />
                        {t("requiresApproval") ||
                          (isRTL ? "تأكيد يدوي" : "Manual Approval")}
                      </span>
                    )}
                  </div>

                  {/* Service Provider Info Badge */}
                  {(() => {
                    const provider = s.workspace_member;
                    const providerName =
                      provider?.name ||
                      (user?.name
                        ? `${user.name}`
                        : t("workspaceOwner") ||
                          (isRTL ? "مالك مساحة العمل" : "Workspace Owner"));
                    const providerTitle = provider?.title || user?.title || "";
                    const providerAvatar =
                      provider?.avatar_url || user?.avatar_url;
                    const _providerInitial = providerName
                      ? providerName.charAt(0).toUpperCase()
                      : "P";

                    return (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          marginTop: 12,
                          padding: "8px 12px",
                          background: "var(--surface-alt)",
                          borderRadius: "var(--radius-md)",
                          border: "1px solid var(--border-light)",
                          width: "100%",
                          boxSizing: "border-box",
                        }}
                      >
                        <UserAvatar
                          name={providerName}
                          avatarUrl={providerAvatar}
                          size={28}
                        />
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            flex: 1,
                            minWidth: 0,
                            overflow: "hidden",
                          }}
                        >
                          <span
                            style={{
                              fontSize: "0.68rem",
                              color: "var(--muted)",
                              fontWeight: 600,
                              lineHeight: 1.1,
                            }}
                          >
                            {t("serviceProvider") ||
                              (isRTL ? "مقدم الخدمة:" : "Service Provider:")}
                          </span>
                          <span
                            style={{
                              fontSize: "0.82rem",
                              fontWeight: 700,
                              color: "var(--heading)",
                              lineHeight: 1.3,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {providerName}{" "}
                            {providerTitle && (
                              <span
                                style={{
                                  fontWeight: 500,
                                  color: "var(--muted)",
                                  fontSize: "0.76rem",
                                }}
                              >
                                ({providerTitle})
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                <div
                  style={{
                    paddingTop: 12,
                    borderTop: "1px solid var(--border-light)",
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
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 800,
                        color: "var(--primary)",
                        fontSize: "1.1rem",
                      }}
                    >
                      {price > 0
                        ? `${price} ${currencySymbol}`
                        : t("freeService") || (isRTL ? "مجاناً" : "Free")}
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      width: "100%",
                    }}
                  >
                    {s.booking_enabled ? (
                      <a
                        href={getCustomerBookingUrl(s)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-secondary btn-sm"
                        style={{
                          flex: "1 1 0px",
                          minWidth: 0,
                          justifyContent: "center",
                          fontSize: "0.78rem",
                          fontWeight: 600,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          padding: "7px 8px",
                          textDecoration: "none",
                          borderRadius: "var(--radius-md)",
                          whiteSpace: "nowrap",
                        }}
                        title={
                          t("openCustomerBookingPage") ||
                          "فتح صفحة الحجز للعميل"
                        }
                      >
                        <Icon name="external-link" size={13} />
                        {t("customerBookingPage") || "صفحة الحجز"}
                      </a>
                    ) : (
                      <span
                        className="btn btn-ghost btn-sm"
                        style={{
                          flex: "1 1 0px",
                          minWidth: 0,
                          justifyContent: "center",
                          fontSize: "0.78rem",
                          fontWeight: 600,
                          opacity: 0.65,
                          cursor: "not-allowed",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          padding: "7px 8px",
                          background: "var(--surface-alt)",
                          border: "1px solid var(--border-light)",
                          color: "var(--muted)",
                          borderRadius: "var(--radius-md)",
                          whiteSpace: "nowrap",
                        }}
                        title={
                          t("bookingDisabledNotice") ||
                          "الحجز أونلاين معطّل لهذه الخدمة"
                        }
                      >
                        <Icon name="external-link" size={13} />
                        {t("bookingDisabled") || "الحجز معطّل"}
                      </span>
                    )}

                    {canEdit && (
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={() => handleOpenEdit(s)}
                        style={{
                          flex: "1 1 0px",
                          minWidth: 0,
                          justifyContent: "center",
                          fontWeight: 700,
                          fontSize: "0.78rem",
                          padding: "7px 8px",
                          borderRadius: "var(--radius-md)",
                          whiteSpace: "nowrap",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <Icon name="edit" size={13} />
                        {t("editService") || "تعديل الخدمة"}
                      </button>
                    )}

                    {canDeleteService(s) && (
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDeleteClick(s)}
                        style={{
                          flex: "1 1 0px",
                          minWidth: 0,
                          justifyContent: "center",
                          fontWeight: 700,
                          fontSize: "0.78rem",
                          padding: "7px 8px",
                          borderRadius: "var(--radius-md)",
                          whiteSpace: "nowrap",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                        title={
                          t("deleteService") ||
                          (isRTL ? "حذف الخدمة" : "Delete Service")
                        }
                      >
                        <Icon name="trash-2" size={13} />
                        {t("delete") || (isRTL ? "حذف" : "Delete")}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Comprehensive Multilingual Service Modal */}
      {isModalOpen &&
        createPortal(
          <div className="modal-backdrop">
            <div className="modal-card modal-lg animate-fade-in-up">
              <div
                className="modal-header"
                style={{
                  borderBottom: "1px solid var(--border-light)",
                  paddingBottom: 14,
                }}
              >
                <h3
                  className="modal-title"
                  style={{ fontSize: "1.1rem", fontWeight: 800 }}
                >
                  {form.id
                    ? t("editServiceTitle") || "تعديل بيانات الخدمة"
                    : t("addServiceTitle") || "إضافة خدمة جديدة"}
                </h3>
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() => setIsModalOpen(false)}
                >
                  <Icon name="x" size={16} />
                </button>
              </div>

              <form
                onSubmit={handleSubmit}
                className="modal-body"
                style={{
                  overflowY: "auto",
                  padding: 20,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "stretch",
                  width: "100%",
                  gap: 20,
                }}
              >
                {/* Section 1: Basic Info (Multilingual AR & EN) */}
                <div
                  style={{
                    background: "var(--surface-alt)",
                    padding: 14,
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--border-light)",
                    width: "100%",
                    boxSizing: "border-box",
                  }}
                >
                  <h4
                    style={{
                      fontSize: "0.88rem",
                      fontWeight: 800,
                      margin: "0 0 14px",
                      color: "var(--primary)",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <Icon
                      name="custom-4e988051"
                      size={16}
                      style={{ color: "var(--primary)" }}
                    />
                    {t("basicServiceInfo") || "البيانات الأساسية للخدمة"}
                  </h4>

                  {/* Service Name Inputs */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(min(100%, 240px), 1fr))",
                      gap: 12,
                      marginBottom: 12,
                      width: "100%",
                    }}
                  >
                    <div className="form-group">
                      <label
                        className="form-label"
                        style={{ fontSize: "0.82rem", fontWeight: 700 }}
                      >
                        {t("serviceNameAr") || "اسم الخدمة (بالعربية)"}
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
                        value={form.name_ar}
                        onChange={(e) =>
                          setForm({ ...form, name_ar: e.target.value })
                        }
                        placeholder={
                          t("serviceNamePlaceholder") ||
                          "مثال: استشارة استراتيجية 45 دقيقة"
                        }
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label
                        className="form-label"
                        style={{ fontSize: "0.82rem", fontWeight: 700 }}
                      >
                        {t("serviceNameEn") || "Service Name (English)"}
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        value={form.name_en}
                        onChange={(e) =>
                          setForm({ ...form, name_en: e.target.value })
                        }
                        placeholder="e.g. 45-min Strategy Consultation"
                      />
                    </div>
                  </div>

                  {/* Service Slug Input */}
                  <div className="form-group" style={{ marginBottom: 14 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 8,
                        marginBottom: 6,
                        flexWrap: "wrap",
                      }}
                    >
                      <label
                        className="form-label"
                        style={{
                          fontSize: "0.82rem",
                          fontWeight: 700,
                          margin: 0,
                        }}
                      >
                        {t("serviceSlugLabel") ||
                          (isRTL
                            ? "رابط الخدمة المخصص (Slug)"
                            : "Service Custom Slug")}
                      </label>
                      <span
                        style={{
                          fontSize: "0.74rem",
                          color: "var(--muted)",
                          fontWeight: 500,
                        }}
                      >
                        {isRTL
                          ? "(أحرف إنجليزية وأرقام وواصلات)"
                          : "(Lowercase letters, numbers & dashes)"}
                      </span>
                    </div>

                    <div style={{ position: "relative", width: "100%" }}>
                      <input
                        type="text"
                        dir="ltr"
                        className="form-input"
                        value={form.slug || ""}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            slug: e.target.value
                              .toLowerCase()
                              .replace(/[^a-z0-9-_]/g, "-"),
                          })
                        }
                        placeholder="e.g. follow-up-visit"
                        style={{
                          width: "100%",
                          fontSize: "0.88rem",
                          fontFamily: "monospace",
                          paddingLeft: 36,
                          boxSizing: "border-box",
                        }}
                      />
                      <div
                        style={{
                          position: "absolute",
                          left: 12,
                          top: "50%",
                          transform: "translateY(-50%)",
                          color: "var(--primary)",
                          display: "flex",
                          alignItems: "center",
                          pointerEvents: "none",
                        }}
                      >
                        <Icon name="link" size={15} />
                      </div>
                    </div>
                  </div>

                  {/* Service Provider Selection Dropdown */}
                  <div className="form-group" style={{ marginBottom: 12 }}>
                    <label
                      className="form-label"
                      style={{ fontSize: "0.82rem", fontWeight: 700 }}
                    >
                      {t("serviceProviderField") ||
                        "مقدم الخدمة (المتخصص / العضو)"}
                    </label>
                    <select
                      className="form-select"
                      value={form.workspace_member_id}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          workspace_member_id: e.target.value,
                        })
                      }
                      style={{ width: "100%" }}
                    >
                      <option value="">
                        {t("allWorkspaceMembers") ||
                          "جميع أعضاء مساحة العمل (عامة)"}
                      </option>
                      {Array.isArray(members) &&
                        members.map((m) => {
                          const memberName =
                            typeof m.name === "object" && m.name !== null
                              ? isRTL
                                ? m.name.ar || m.name.en || ""
                                : m.name.en || m.name.ar || ""
                              : m.name || "";
                          return (
                            <option key={m.id} value={m.id}>
                              {memberName} {m.title ? `(${m.title})` : ""}{" "}
                              {m.is_owner ? `— ${t("owner") || "مالك"}` : ""}
                            </option>
                          );
                        })}
                    </select>
                  </div>

                  {/* Service Schedule Selection Dropdown */}
                  <div className="form-group" style={{ marginBottom: 12 }}>
                    <label
                      className="form-label"
                      style={{ fontSize: "0.82rem", fontWeight: 700 }}
                    >
                      {t("serviceScheduleField") ||
                        (isRTL
                          ? "جدول المواعيد المخصص للخدمة"
                          : "Service Schedule")}
                    </label>
                    <select
                      className="form-select"
                      value={form.schedule_id || ""}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          schedule_id: e.target.value,
                        })
                      }
                      style={{ width: "100%" }}
                    >
                      <option value="">
                        {t("defaultWorkspaceSchedule") ||
                          (isRTL
                            ? "الجدول الافتراضي لمساحة العمل"
                            : "Default Workspace Schedule")}
                      </option>
                      {Array.isArray(schedules) &&
                        schedules.map((sch) => {
                          const scheduleName =
                            typeof sch.name === "object" && sch.name !== null
                              ? isRTL
                                ? sch.name.ar || sch.name.en || ""
                                : sch.name.en || sch.name.ar || ""
                              : sch.name || "";
                          return (
                            <option key={sch.id} value={sch.id}>
                              {scheduleName}{" "}
                              {sch.is_default
                                ? `— (${t("defaultScheduleTag") || (isRTL ? "افتراضي" : "Default")})`
                                : ""}
                            </option>
                          );
                        })}
                    </select>
                  </div>

                  {/* Short Description Inputs */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(min(100%, 240px), 1fr))",
                      gap: 12,
                      marginBottom: 12,
                      width: "100%",
                    }}
                  >
                    <div className="form-group">
                      <label
                        className="form-label"
                        style={{ fontSize: "0.82rem", fontWeight: 700 }}
                      >
                        {t("shortDescAr") || "نبذة قصيرة (بالعربية)"}
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        value={form.short_description_ar}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            short_description_ar: e.target.value,
                          })
                        }
                        placeholder={
                          t("shortDescPlaceholder") ||
                          "ملخص من جملة واحدة يظهر في البطاقات والمقترحات"
                        }
                      />
                    </div>

                    <div className="form-group">
                      <label
                        className="form-label"
                        style={{ fontSize: "0.82rem", fontWeight: 700 }}
                      >
                        {t("shortDescEn") || "Short Description (English)"}
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        value={form.short_description_en}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            short_description_en: e.target.value,
                          })
                        }
                        placeholder="One-line summary shown in cards"
                      />
                    </div>
                  </div>

                  {/* Full Description Inputs */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(min(100%, 240px), 1fr))",
                      gap: 12,
                      width: "100%",
                    }}
                  >
                    <div className="form-group">
                      <label
                        className="form-label"
                        style={{ fontSize: "0.82rem", fontWeight: 700 }}
                      >
                        {t("descriptionAr") || "الوصف التفصيلي (بالعربية)"}
                      </label>
                      <textarea
                        className="form-textarea"
                        value={form.description_ar}
                        onChange={(e) =>
                          setForm({ ...form, description_ar: e.target.value })
                        }
                        rows={3}
                        placeholder={
                          t("fullDescPlaceholder") ||
                          "شرح كامل عن تفاصيل وما سيتلقاه العميل خلال هذه الخدمة..."
                        }
                      />
                    </div>

                    <div className="form-group">
                      <label
                        className="form-label"
                        style={{ fontSize: "0.82rem", fontWeight: 700 }}
                      >
                        {t("descriptionEn") || "Detailed Description (English)"}
                      </label>
                      <textarea
                        className="form-textarea"
                        value={form.description_en}
                        onChange={(e) =>
                          setForm({ ...form, description_en: e.target.value })
                        }
                        rows={3}
                        placeholder="Full description of service details..."
                      />
                    </div>
                  </div>
                </div>

                {/* Section 2: Pricing, Duration & Capacity */}
                <div
                  style={{
                    background: "var(--surface-alt)",
                    padding: 14,
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--border-light)",
                    width: "100%",
                    boxSizing: "border-box",
                  }}
                >
                  <h4
                    style={{
                      fontSize: "0.88rem",
                      fontWeight: 800,
                      margin: "0 0 12px",
                      color: "var(--primary)",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <Icon
                      name="credit-card"
                      size={16}
                      style={{ color: "var(--primary)" }}
                    />
                    {t("pricingAndCapacity") || "المدة والتسعير والسعة"}
                  </h4>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(130px, 1fr))",
                      gap: 12,
                    }}
                  >
                    <div className="form-group">
                      <label
                        className="form-label"
                        style={{ fontSize: "0.82rem", fontWeight: 700 }}
                      >
                        {t("durationMinutesLabel") || "المدة (دقائق)"}
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
                        type="number"
                        min="1"
                        className="form-input"
                        value={form.duration_minutes ?? ""}
                        onChange={(e) =>
                          setForm({ ...form, duration_minutes: e.target.value })
                        }
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label
                        className="form-label"
                        style={{ fontSize: "0.82rem", fontWeight: 700 }}
                      >
                        {t("priceLabel") || "السعر"}
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
                        type="number"
                        min="0"
                        step="0.01"
                        className="form-input"
                        value={form.price ?? ""}
                        onChange={(e) =>
                          setForm({ ...form, price: e.target.value })
                        }
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label
                        className="form-label"
                        style={{ fontSize: "0.82rem", fontWeight: 700 }}
                      >
                        {t("currencyLabel") || "العملة"}
                      </label>
                      <select
                        className="form-input"
                        value={form.currency || "SAR"}
                        onChange={(e) => {
                          const selectedCode = e.target.value;
                          const selectedCurr = availableCurrencies.find(
                            (c) => c.code === selectedCode,
                          );
                          setForm({
                            ...form,
                            currency: selectedCode,
                            currency_id: selectedCurr?.id || form.currency_id,
                          });
                        }}
                      >
                        {availableCurrencies.map((c) => {
                          const nameStr =
                            typeof c.name === "object"
                              ? c.name[isRTL ? "ar" : "en"] ||
                                c.name.ar ||
                                c.name.en ||
                                c.code
                              : c.name || c.code;
                          const symbolStr =
                            c.symbol_native || c.symbol || c.code;
                          return (
                            <option key={c.id || c.code} value={c.code}>
                              {c.code} - {nameStr} ({symbolStr})
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    <div className="form-group">
                      <label
                        className="form-label"
                        style={{ fontSize: "0.82rem", fontWeight: 700 }}
                      >
                        {t("capacityLabel") || "السعة (عدد الحضور)"}
                      </label>
                      <input
                        type="number"
                        min="1"
                        className="form-input"
                        value={form.capacity ?? ""}
                        onChange={(e) =>
                          setForm({ ...form, capacity: e.target.value })
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* Section 3: Location & Booking Mode */}
                <div
                  style={{
                    background: "var(--surface-alt)",
                    padding: 14,
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--border-light)",
                    width: "100%",
                    boxSizing: "border-box",
                  }}
                >
                  <h4
                    style={{
                      fontSize: "0.88rem",
                      fontWeight: 800,
                      margin: "0 0 12px",
                      color: "var(--primary)",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <Icon
                      name="map-pin"
                      size={16}
                      style={{ color: "var(--primary)" }}
                    />
                    {t("locationAndMode") || "مكان ورابط نمط الحجز"}
                  </h4>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(200px, 1fr))",
                      gap: 12,
                      marginBottom: 12,
                    }}
                  >
                    <div className="form-group">
                      <label
                        className="form-label"
                        style={{ fontSize: "0.82rem", fontWeight: 700 }}
                      >
                        {t("bookingModeLabel") || "نمط الحجز"}
                      </label>
                      <select
                        className="form-input"
                        value={form.booking_mode}
                        onChange={(e) =>
                          setForm({ ...form, booking_mode: e.target.value })
                        }
                      >
                        <option value="instant">
                          {t("instantBooking") || "حجز فوري مباشر"}
                        </option>
                        <option value="confirmation">
                          {t("confirmationBooking") || "يتطلب موافقة المتخصص"}
                        </option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label
                        className="form-label"
                        style={{ fontSize: "0.82rem", fontWeight: 700 }}
                      >
                        {t("locationLabel") || "الموقع / رابط الاجتماع"}
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        value={form.location}
                        onChange={(e) =>
                          setForm({ ...form, location: e.target.value })
                        }
                        placeholder={
                          t("locationPlaceholder") || "Google Meet, Zoom..."
                        }
                      />
                    </div>
                  </div>

                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 12,
                      cursor: "pointer",
                      fontSize: "0.84rem",
                      fontWeight: 700,
                      padding: "12px 14px",
                      marginTop: 4,
                      background: form.requires_meeting
                        ? "rgba(14, 165, 233, 0.06)"
                        : "var(--surface)",
                      border: form.requires_meeting
                        ? "1.5px solid rgba(14, 165, 233, 0.3)"
                        : "1px solid var(--border-light)",
                      borderRadius: "var(--radius-md)",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        color: form.requires_meeting
                          ? "var(--heading)"
                          : "var(--text-secondary)",
                      }}
                    >
                      <Icon
                        name="video"
                        size={16}
                        style={{
                          color: form.requires_meeting
                            ? "var(--primary)"
                            : "var(--muted)",
                          flexShrink: 0,
                        }}
                      />
                      {t("requiresMeetingLabel") ||
                        "يتطلب إنشاء رابط اجتماع أونلاين تلقائياً (Video Meeting)"}
                    </span>
                    <span
                      dir="ltr"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: form.requires_meeting
                          ? "flex-end"
                          : "flex-start",
                        width: 40,
                        height: 22,
                        minWidth: 40,
                        borderRadius: 99,
                        background: form.requires_meeting
                          ? "var(--primary)"
                          : "#cbd5e1",
                        padding: 2,
                        boxSizing: "border-box",
                        transition: "background 0.25s ease",
                        flexShrink: 0,
                        direction: "ltr",
                      }}
                    >
                      <input
                        type="checkbox"
                        className="toggle-checkbox"
                        checked={form.requires_meeting}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            requires_meeting: e.target.checked,
                          })
                        }
                        style={{ display: "none" }}
                      />
                      <span
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: "50%",
                          background: "#ffffff",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.25)",
                          flexShrink: 0,
                        }}
                      />
                    </span>
                  </label>
                </div>

                {/* Section 4: Buffer & Notice Rules */}
                <div
                  style={{
                    background: "var(--surface-alt)",
                    padding: 14,
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--border-light)",
                  }}
                >
                  <h4
                    style={{
                      fontSize: "0.88rem",
                      fontWeight: 800,
                      margin: "0 0 12px",
                      color: "var(--primary)",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <Icon
                      name="clock"
                      size={16}
                      style={{ color: "var(--primary)" }}
                    />
                    {t("buffersAndNotices") ||
                      "الفواصل والمهلة الزمنية الخاصة بالخدمة"}
                  </h4>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(2, 1fr)",
                      gap: 12,
                    }}
                  >
                    <div className="form-group">
                      <label
                        className="form-label"
                        style={{
                          fontSize: "0.8rem",
                          fontWeight: 700,
                          marginBottom: 2,
                        }}
                      >
                        {t("bufferBeforeLabel") || "فاصل قبل الحجز (دقائق)"}
                      </label>
                      <span
                        style={{
                          display: "block",
                          fontSize: "0.74rem",
                          color: "var(--text-secondary)",
                          marginBottom: 6,
                          lineHeight: 1.35,
                        }}
                      >
                        {t("bufferBeforeDesc")}
                      </span>
                      <input
                        type="number"
                        min="0"
                        className="form-input"
                        value={form.buffer_before_minutes ?? ""}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            buffer_before_minutes: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="form-group">
                      <label
                        className="form-label"
                        style={{
                          fontSize: "0.8rem",
                          fontWeight: 700,
                          marginBottom: 2,
                        }}
                      >
                        {t("bufferAfterLabel") || "فاصل بعد الحجز (دقائق)"}
                      </label>
                      <span
                        style={{
                          display: "block",
                          fontSize: "0.74rem",
                          color: "var(--text-secondary)",
                          marginBottom: 6,
                          lineHeight: 1.35,
                        }}
                      >
                        {t("bufferAfterDesc")}
                      </span>
                      <input
                        type="number"
                        min="0"
                        className="form-input"
                        value={form.buffer_after_minutes ?? ""}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            buffer_after_minutes: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="form-group">
                      <label
                        className="form-label"
                        style={{
                          fontSize: "0.8rem",
                          fontWeight: 700,
                          marginBottom: 2,
                        }}
                      >
                        {t("minNoticeLabel") || "أقل مهلة للإشعار (دقائق)"}
                      </label>
                      <span
                        style={{
                          display: "block",
                          fontSize: "0.74rem",
                          color: "var(--text-secondary)",
                          marginBottom: 6,
                          lineHeight: 1.35,
                        }}
                      >
                        {t("minNoticeDesc")}
                      </span>
                      <input
                        type="number"
                        min="0"
                        className="form-input"
                        value={form.minimum_booking_notice_minutes ?? ""}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            minimum_booking_notice_minutes: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="form-group">
                      <label
                        className="form-label"
                        style={{
                          fontSize: "0.8rem",
                          fontWeight: 700,
                          marginBottom: 2,
                        }}
                      >
                        {t("maxDaysLabel") || "أقصى مدى للحجز (أيام)"}
                      </label>
                      <span
                        style={{
                          display: "block",
                          fontSize: "0.74rem",
                          color: "var(--text-secondary)",
                          marginBottom: 6,
                          lineHeight: 1.35,
                        }}
                      >
                        {t("maxDaysDesc")}
                      </span>
                      <input
                        type="number"
                        min="1"
                        max="365"
                        className="form-input"
                        value={form.maximum_booking_days ?? ""}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            maximum_booking_days: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* Section 5: Status & Badges */}
                <div
                  style={{
                    background: "var(--surface-alt)",
                    padding: 14,
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--border-light)",
                  }}
                >
                  <h4
                    style={{
                      fontSize: "0.88rem",
                      fontWeight: 800,
                      margin: "0 0 12px",
                      color: "var(--primary)",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <Icon
                      name="custom-70641804"
                      size={16}
                      style={{ color: "var(--primary)" }}
                    />
                    {t("statusAndBadges") || "حالة الخدمة والتفعيل"}
                  </h4>

                  {/* Status Dropdown */}
                  <div className="form-group" style={{ marginBottom: 14 }}>
                    <label
                      className="form-label"
                      style={{ fontSize: "0.82rem", fontWeight: 700 }}
                    >
                      {t("statusLabel") || "حالة الخدمة"}
                    </label>
                    <select
                      className="form-input"
                      value={form.status}
                      onChange={(e) =>
                        setForm({ ...form, status: e.target.value })
                      }
                      style={{ width: "100%" }}
                    >
                      <option value="active">
                        {t("statusActive") || "نشطة (Active)"}
                      </option>
                      <option value="draft">
                        {t("statusDraft") || "مسودة (Draft)"}
                      </option>
                      <option value="archived">
                        {t("statusArchived") || "مؤرشفة (Archived)"}
                      </option>
                    </select>
                  </div>

                  {/* Toggle Cards Row */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(240px, 1fr))",
                      gap: 12,
                    }}
                  >
                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 12,
                        cursor: "pointer",
                        fontSize: "0.84rem",
                        fontWeight: 700,
                        padding: "12px 14px",
                        boxSizing: "border-box",
                        background: form.booking_enabled
                          ? "rgba(16, 185, 129, 0.06)"
                          : "var(--surface)",
                        border: form.booking_enabled
                          ? "1.5px solid rgba(16, 185, 129, 0.3)"
                          : "1px solid var(--border-light)",
                        borderRadius: "var(--radius-md)",
                        transition: "all 0.2s ease",
                      }}
                    >
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          color: form.booking_enabled
                            ? "var(--heading)"
                            : "var(--text-secondary)",
                        }}
                      >
                        <Icon
                          name="globe"
                          size={16}
                          style={{
                            color: form.booking_enabled
                              ? "#10b981"
                              : "var(--muted)",
                            flexShrink: 0,
                          }}
                        />
                        {t("enableBookingToggle") ||
                          "تفعيل إمكانية الحجز أونلاين"}
                      </span>
                      <span
                        dir="ltr"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: form.booking_enabled
                            ? "flex-end"
                            : "flex-start",
                          width: 40,
                          height: 22,
                          minWidth: 40,
                          borderRadius: 99,
                          background: form.booking_enabled
                            ? "#10b981"
                            : "#cbd5e1",
                          padding: 2,
                          boxSizing: "border-box",
                          transition: "background 0.25s ease",
                          flexShrink: 0,
                          direction: "ltr",
                        }}
                      >
                        <input
                          type="checkbox"
                          className="toggle-checkbox"
                          checked={form.booking_enabled}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              booking_enabled: e.target.checked,
                            })
                          }
                          style={{ display: "none" }}
                        />
                        <span
                          style={{
                            width: 18,
                            height: 18,
                            borderRadius: "50%",
                            background: "#ffffff",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.25)",
                            flexShrink: 0,
                          }}
                        />
                      </span>
                    </label>

                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 12,
                        cursor: "pointer",
                        fontSize: "0.84rem",
                        fontWeight: 700,
                        padding: "12px 14px",
                        boxSizing: "border-box",
                        background: form.is_featured
                          ? "rgba(180, 83, 9, 0.05)"
                          : "var(--surface)",
                        border: form.is_featured
                          ? "1.5px solid rgba(180, 83, 9, 0.25)"
                          : "1px solid var(--border-light)",
                        borderRadius: "var(--radius-md)",
                        transition: "all 0.2s ease",
                      }}
                    >
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          color: form.is_featured
                            ? "var(--heading)"
                            : "var(--text-secondary)",
                        }}
                      >
                        <Icon
                          name="custom-5768860f"
                          size={16}
                          style={{
                            color: form.is_featured
                              ? "#b45309"
                              : "var(--muted)",
                            flexShrink: 0,
                          }}
                        />
                        {t("featureServiceToggle") || "تميز الخدمة (Featured)"}
                      </span>
                      <span
                        dir="ltr"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: form.is_featured
                            ? "flex-end"
                            : "flex-start",
                          width: 40,
                          height: 22,
                          minWidth: 40,
                          borderRadius: 99,
                          background: form.is_featured ? "#b45309" : "#cbd5e1",
                          padding: 2,
                          boxSizing: "border-box",
                        }}
                      >
                        <input
                          type="checkbox"
                          className="toggle-checkbox"
                          checked={form.is_featured}
                          onChange={(e) =>
                            setForm({ ...form, is_featured: e.target.checked })
                          }
                          style={{ display: "none" }}
                        />
                        <span
                          style={{
                            width: 18,
                            height: 18,
                            borderRadius: "50%",
                            background: "#ffffff",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.25)",
                            flexShrink: 0,
                          }}
                        />
                      </span>
                    </label>
                  </div>

                  {/* Show Member Profile Instead of Company Page Option */}
                  <label
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 6,
                      cursor: "pointer",
                      padding: "14px 16px",
                      marginTop: 12,
                      boxSizing: "border-box",
                      background: form.show_member_profile
                        ? "rgba(14, 165, 233, 0.06)"
                        : "var(--surface)",
                      border: form.show_member_profile
                        ? "1.5px solid rgba(14, 165, 233, 0.3)"
                        : "1px solid var(--border-light)",
                      borderRadius: "var(--radius-md)",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 12,
                        width: "100%",
                      }}
                    >
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          fontWeight: 700,
                          fontSize: "0.86rem",
                          color: form.show_member_profile
                            ? "var(--heading)"
                            : "var(--text-secondary)",
                        }}
                      >
                        <Icon
                          name="user"
                          size={16}
                          style={{
                            color: form.show_member_profile
                              ? "var(--primary)"
                              : "var(--muted)",
                            flexShrink: 0,
                          }}
                        />
                        {t("showMemberProfileLabel") ||
                          (isRTL
                            ? "اعرض صفحة الموظف الشخصية بدل صفحة الشركة عند حجز هذه الخدمة"
                            : "Show employee personal page instead of company page when booking this service")}
                      </span>
                      <span
                        dir="ltr"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: form.show_member_profile
                            ? "flex-end"
                            : "flex-start",
                          width: 40,
                          height: 22,
                          minWidth: 40,
                          borderRadius: 99,
                          background: form.show_member_profile
                            ? "var(--primary)"
                            : "#cbd5e1",
                          padding: 2,
                          boxSizing: "border-box",
                          transition: "background 0.25s ease",
                          flexShrink: 0,
                          direction: "ltr",
                        }}
                      >
                        <input
                          type="checkbox"
                          className="toggle-checkbox"
                          checked={form.show_member_profile}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              show_member_profile: e.target.checked,
                            })
                          }
                          style={{ display: "none" }}
                        />
                        <span
                          style={{
                            width: 18,
                            height: 18,
                            borderRadius: "50%",
                            background: "#ffffff",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.25)",
                            flexShrink: 0,
                          }}
                        />
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: "0.78rem",
                        color: "var(--muted)",
                        lineHeight: 1.45,
                        marginInlineStart: 24,
                      }}
                    >
                      {t("showMemberProfileDesc") ||
                        (isRTL
                          ? "إذا كان معطّلاً، لن يظهر زر «الملف الشخصي» إطلاقًا في صفحة الحجز — ولن يعود إلى صفحة الشركة."
                          : "If disabled, the 'Profile' button will not appear at all on the booking page — and will not return to the company page.")}
                    </span>
                  </label>
                </div>

                {/* Modal Action Buttons */}
                <div
                  className="modal-actions"
                  style={{
                    borderTop: "1px solid var(--border-light)",
                    paddingTop: 14,
                    marginTop: 4,
                  }}
                >
                  {form.id && canDeleteService(form) && (
                    <button
                      type="button"
                      className="btn btn-danger btn-md"
                      style={{
                        marginRight: isRTL ? 0 : "auto",
                        marginLeft: isRTL ? "auto" : 0,
                      }}
                      onClick={() => {
                        setIsModalOpen(false);
                        handleDeleteClick(form);
                      }}
                    >
                      <Icon name="trash-2" size={14} />
                      {t("deleteService") ||
                        (isRTL ? "حذف الخدمة" : "Delete Service")}
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn btn-secondary btn-md"
                    onClick={() => setIsModalOpen(false)}
                  >
                    {t("cancel") || "إلغاء"}
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary btn-md"
                    style={{ padding: "10px 24px", fontWeight: 700 }}
                  >
                    {form.id
                      ? t("updateServiceBtn") || "حفظ التعديلات"
                      : t("saveServiceBtn") || "إنشاء الخدمة"}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body,
        )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        modalState={confirmModal}
        onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
