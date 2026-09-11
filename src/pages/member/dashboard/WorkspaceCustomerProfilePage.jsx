import { useState, useEffect, useCallback } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { useLanguage } from "../../../context/LanguageContext";
import { useToast } from "../../../context/ToastContext";
import client, { endpoints } from "../../../api/client";
import Icon from "../../../components/common/Icon";
import CreateBookingModal from "./workspace-settings/CreateBookingModal";

export default function WorkspaceCustomerProfilePage() {
  const { customerId } = useParams();
  const { user } = useAuth();
  const { t, lang, isRTL } = useLanguage();
  const toast = useToast();

  const workspace = user?.workspace;
  const isOwner = user?.is_owner === true;
  const permissions = Array.isArray(user?.permissions) ? user.permissions : [];
  const canWrite = isOwner || permissions.includes("customer_write");
  const canBook = isOwner || permissions.includes("booking_write");

  // Dynamic Workspace Customer Terminology & Icon
  const getCustomerLabel = (type = "plural") => {
    const field =
      type === "singular" ? "customer_label_singular" : "customer_label_plural";
    if (workspace && workspace[field]) {
      if (typeof workspace[field] === "object") {
        return (
          workspace[field][lang] ||
          workspace[field].ar ||
          workspace[field].en ||
          (type === "singular" ? "عميل" : "العملاء")
        );
      }
      return workspace[field];
    }
    return type === "singular"
      ? t("customerSingle") || "عميل"
      : t("navCustomers") || "العملاء";
  };

  const customerPlural = getCustomerLabel("plural");
  const customerSingular = getCustomerLabel("singular");
  const customerIcon = workspace?.customer_icon || "users";

  // State
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "timeline"; // 'timeline' | 'workspace_data' | 'financial'
  const setActiveTab = useCallback(
    (tab) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (tab === "timeline") {
            next.delete("tab");
          } else {
            next.set("tab", tab);
          }
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );
  const [timelineFilter, setTimelineFilter] = useState("all");

  // Edit State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);
  const [internalNotes, setInternalNotes] = useState("");

  // Edit Form State
  const [customerForm, setCustomerForm] = useState({
    name: "",
    email: "",
    phone: "",
    gender: "male",
    date_of_birth: "",
    customer_reference: "",
    status: "active",
    internal_notes: "",
    metadata: {},
  });
  const [savingCustomer, setSavingCustomer] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  // Fetch Customer Profile
  const fetchCustomer = useCallback(async () => {
    setLoading(true);
    try {
      const res = await client.get(endpoints.workspaceCustomerItem(customerId));
      const data = res.data?.data;
      if (data) {
        setCustomer(data);
        const pivot = data.workspace_customer || {};
        setInternalNotes(pivot.internal_notes || data.notes || "");
      }
    } catch (err) {
      console.error("Failed to load customer profile:", err);
      toast.show(
        t("customerNotFound") ||
          `${customerSingular} غير موجود أو ليس لديك صلاحية لعرضه`,
        "error",
      );
    } finally {
      setLoading(false);
    }
  }, [customerId, t, toast, customerSingular]);

  useEffect(() => {
    fetchCustomer();
  }, [fetchCustomer]);

  // Handle Save Staff Notes
  const handleSaveNotes = async () => {
    setSavingNotes(true);
    try {
      const res = await client.put(
        endpoints.workspaceCustomerItem(customerId),
        {
          internal_notes: internalNotes,
        },
      );
      toast.show(t("savedSuccessfully") || "تم حفظ الملاحظات بنجاح", "success");
      const updated = res.data?.data;
      if (updated) {
        setCustomer(updated);
        const pivot = updated.workspace_customer || {};
        setInternalNotes(pivot.internal_notes || updated.notes || "");
      } else {
        fetchCustomer();
      }
    } catch (err) {
      toast.show(
        err.response?.data?.message ||
          t("errorSavingData") ||
          "حدث خطأ أثناء حفظ الملاحظات",
        "error",
      );
    } finally {
      setSavingNotes(false);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = () => {
    if (!customer) return;
    const pivot = customer.workspace_customer || {};
    setCustomerForm({
      name: customer.name || "",
      email: customer.email || "",
      phone: customer.phone || "",
      gender: customer.gender || "male",
      date_of_birth: customer.date_of_birth || "",
      customer_reference: pivot.customer_reference || "",
      status: pivot.status || customer.status || "active",
      internal_notes: pivot.internal_notes || customer.notes || "",
      metadata: pivot.metadata || {},
    });
    setFormErrors({});
    setIsEditModalOpen(true);
  };

  // Save Full Edit
  const handleSaveCustomer = async () => {
    setSavingCustomer(true);
    setFormErrors({});
    try {
      await client.put(
        endpoints.workspaceCustomerItem(customerId),
        customerForm,
      );
      toast.show(
        t("customerUpdatedSuccess") ||
          `تم تحديث بيانات ${customerSingular} بنجاح`,
        "success",
      );
      setIsEditModalOpen(false);
      fetchCustomer();
    } catch (err) {
      if (err.response?.status === 422 && err.response?.data?.errors) {
        setFormErrors(err.response.data.errors);
      } else {
        toast.show(
          err.response?.data?.message ||
            t("errorSavingData") ||
            "حدث خطأ أثناء حفظ البيانات",
          "error",
        );
      }
    } finally {
      setSavingCustomer(false);
    }
  };

  // Quick WhatsApp Link
  const getWhatsAppUrl = (phone) => {
    if (!phone) return null;
    const cleanNumber = phone.replace(/[^0-9]/g, "");
    return `https://wa.me/${cleanNumber}`;
  };

  // Determine Workspace Type for Adaptive Custom Fields
  const wsTypeSlug = (
    workspace?.workspace_type?.slug ||
    workspace?.workspace_type?.name?.en ||
    ""
  ).toLowerCase();

  const isClinic =
    wsTypeSlug.includes("clinic") ||
    wsTypeSlug.includes("dental") ||
    wsTypeSlug.includes("medical") ||
    wsTypeSlug.includes("health");
  const isEducation =
    wsTypeSlug.includes("edu") ||
    wsTypeSlug.includes("academy") ||
    wsTypeSlug.includes("tutor") ||
    wsTypeSlug.includes("school");
  const isConsulting =
    wsTypeSlug.includes("consult") ||
    wsTypeSlug.includes("law") ||
    wsTypeSlug.includes("legal") ||
    wsTypeSlug.includes("advisory");
  const isFitness =
    wsTypeSlug.includes("gym") ||
    wsTypeSlug.includes("fitness") ||
    wsTypeSlug.includes("sport") ||
    wsTypeSlug.includes("workout");
  const isBeauty =
    wsTypeSlug.includes("beauty") ||
    wsTypeSlug.includes("salon") ||
    wsTypeSlug.includes("spa") ||
    wsTypeSlug.includes("wellness");

  if (loading) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "100px 20px",
          background: "var(--surface)",
          borderRadius: "var(--radius-lg, 16px)",
          border: "1px solid var(--border)",
          margin: "20px 0",
        }}
      >
        <div
          className="spinner"
          style={{ width: 40, height: 40, margin: "0 auto 16px" }}
        />
        <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
          {t("loading") || "جاري تحميل الملف الشخصي..."}
        </p>
      </div>
    );
  }

  if (!customer) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "80px 20px",
          background: "var(--surface)",
          borderRadius: "var(--radius-lg, 16px)",
          border: "1px solid var(--border)",
          margin: "20px 0",
        }}
      >
        <Icon
          name="alert-triangle"
          size={48}
          style={{ color: "#ef4444", marginBottom: 16 }}
        />
        <h2
          style={{
            fontSize: "1.3rem",
            fontWeight: 700,
            color: "var(--heading)",
            marginBottom: 8,
          }}
        >
          {t("customerNotFound") || `${customerSingular} غير موجود`}
        </h2>
        <Link
          to="/member/workspace/customers"
          className="btn btn-primary"
          style={{ marginTop: 12 }}
        >
          <Icon name="arrow-right" size={16} />
          <span>
            {t("backToCustomers") || `العودة لقائمة ${customerPlural}`}
          </span>
        </Link>
      </div>
    );
  }

  const pivot = customer.workspace_customer || {};
  const stats = customer.stats || {};
  const status = pivot.status || customer.status || "active";
  const isVip = status === "vip";
  const appointments = Array.isArray(customer.appointments)
    ? customer.appointments
    : [];
  const metadata = pivot.metadata || {};

  // Filtered Appointments
  const filteredAppointments = appointments.filter((apt) => {
    if (timelineFilter === "all") return true;
    if (timelineFilter === "completed") return apt.status === "completed";
    if (timelineFilter === "upcoming")
      return apt.status === "confirmed" || apt.status === "pending";
    if (timelineFilter === "cancelled") return apt.status === "cancelled";
    return true;
  });

  return (
    <div
      className="workspace-customer-profile-page animate-fade-in"
      style={{ padding: "0 4px" }}
    >
      {/* Breadcrumb Navigation */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontSize: "0.85rem",
          color: "var(--text-secondary)",
          marginBottom: 16,
        }}
      >
        <Link
          to="/member/workspace/customers"
          style={{
            color: "var(--primary)",
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontWeight: 600,
          }}
        >
          <Icon name={customerIcon} size={15} />
          <span>{customerPlural}</span>
        </Link>
        <span>/</span>
        <span style={{ color: "var(--heading)", fontWeight: 700 }}>
          {customer.name}
        </span>
      </div>

      {/* Customer Header Hero Banner */}
      <div
        className="customer-hero-card glass-card"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg, 16px)",
          padding: "24px 28px",
          marginBottom: 24,
          boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Accent Backdrop Glow */}
        <div
          style={{
            position: "absolute",
            top: 0,
            [lang === "ar" ? "right" : "left"]: 0,
            width: 180,
            height: 180,
            background: isVip
              ? "radial-gradient(circle, rgba(245, 158, 11, 0.15) 0%, rgba(245, 158, 11, 0) 70%)"
              : "radial-gradient(circle, rgba(2, 105, 130, 0.15) 0%, rgba(2, 105, 130, 0) 70%)",
            pointerEvents: "none",
          }}
        />

        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 20,
          }}
        >
          {/* Left Info: Avatar + Details */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 18,
              flexWrap: "wrap",
            }}
          >
            <div
              className="customer-avatar-large"
              style={{
                width: 72,
                height: 72,
                borderRadius: "50%",
                background: isVip
                  ? "linear-gradient(135deg, #f59e0b, #d97706)"
                  : "linear-gradient(135deg, var(--primary), var(--primary-hover, #0389A5))",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 900,
                fontSize: "1.8rem",
                boxShadow: isVip
                  ? "0 8px 24px rgba(245, 158, 11, 0.4)"
                  : "0 8px 24px rgba(2, 105, 130, 0.3)",
                flexShrink: 0,
              }}
            >
              {customer.name ? customer.name.charAt(0).toUpperCase() : "C"}
            </div>

            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  flexWrap: "wrap",
                }}
              >
                <h1
                  style={{
                    margin: 0,
                    fontSize: "1.55rem",
                    fontWeight: 800,
                    color: "var(--heading)",
                    letterSpacing: "-0.02em",
                  }}
                >
                  {customer.name}
                </h1>

                {/* Status & VIP Badges */}
                <span
                  style={{
                    padding: "3px 10px",
                    borderRadius: 12,
                    fontSize: "0.75rem",
                    fontWeight: 800,
                    background:
                      status === "active"
                        ? "rgba(16, 185, 129, 0.12)"
                        : isVip
                          ? "rgba(245, 158, 11, 0.15)"
                          : "var(--surface-alt)",
                    color:
                      status === "active"
                        ? "#10b981"
                        : isVip
                          ? "#d97706"
                          : "var(--text-secondary)",
                  }}
                >
                  {isVip ? "VIP" : status}
                </span>

                {pivot.customer_reference && (
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      padding: "3px 10px",
                      borderRadius: 8,
                      background: "var(--surface-alt)",
                      border: "1px solid var(--border)",
                      fontSize: "0.78rem",
                      fontWeight: 700,
                      color: "var(--primary)",
                    }}
                  >
                    <Icon name="tag" size={13} />
                    <span>#{pivot.customer_reference}</span>
                  </span>
                )}
              </div>

              {/* Sub-details line */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  fontSize: "0.84rem",
                  color: "var(--text-secondary)",
                  marginTop: 6,
                  flexWrap: "wrap",
                }}
              >
                {customer.gender && (
                  <span>
                    {customer.gender === "female"
                      ? t("genderFemale") || "أنثى"
                      : t("genderMale") || "ذكر"}
                  </span>
                )}
                {customer.date_of_birth && (
                  <span>
                    {t("customerDob") || "الميلاد"}: {customer.date_of_birth}
                  </span>
                )}
                {customer.created_at && (
                  <span>
                    {t("customerSince") || "منذ"}:{" "}
                    {new Date(customer.created_at).toLocaleDateString(
                      lang === "ar" ? "ar-EG" : "en-US",
                    )}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right Action Shortcuts */}
          <div
            className="customer-hero-actions"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            {customer.phone && (
              <>
                <a
                  href={`tel:${customer.phone}`}
                  className="btn btn-secondary"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: "0.82rem",
                    padding: "8px 14px",
                  }}
                >
                  <Icon
                    name="phone"
                    size={15}
                    style={{ color: "var(--primary)" }}
                  />
                  <span>{t("callPhone") || "اتصال"}</span>
                </a>

                {getWhatsAppUrl(customer.phone) && (
                  <a
                    href={getWhatsAppUrl(customer.phone)}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-secondary"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      fontSize: "0.82rem",
                      padding: "8px 14px",
                      color: "#25d366",
                    }}
                  >
                    <Icon name="message-circle" size={15} />
                    <span>{t("whatsapp") || "واتساب"}</span>
                  </a>
                )}
              </>
            )}

            {customer.email && (
              <a
                href={`mailto:${customer.email}`}
                className="btn btn-secondary"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: "0.82rem",
                  padding: "8px 14px",
                }}
              >
                <Icon name="mail" size={15} />
                <span>{t("sendEmail") || "بريد"}</span>
              </a>
            )}

            {canBook && (
              <button
                type="button"
                onClick={() => setIsBookingModalOpen(true)}
                className="btn btn-primary"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: "0.84rem",
                  padding: "8px 16px",
                  fontWeight: 700,
                }}
              >
                <Icon name="calendar" size={15} />
                <span>{t("bookAppointmentForCustomer") || "حجز موعد"}</span>
              </button>
            )}

            {canWrite && (
              <button
                type="button"
                onClick={handleOpenEdit}
                className="btn btn-secondary"
                style={{ padding: "8px 12px" }}
                title={t("editCustomerBtn") || "تعديل"}
              >
                <Icon name="edit-2" size={15} />
              </button>
            )}

            <button
              type="button"
              onClick={() => window.print()}
              className="btn btn-secondary"
              style={{ padding: "8px 12px" }}
              title={t("printProfile") || "طباعة"}
            >
              <Icon name="printer" size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div
        className="profile-kpi-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
          gap: 14,
          marginBottom: 24,
        }}
      >
        <div
          className="glass-card"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-lg, 12px)",
            padding: "16px 18px",
          }}
        >
          <div
            style={{
              fontSize: "0.78rem",
              color: "var(--text-secondary)",
              fontWeight: 600,
            }}
          >
            {t("totalBookingsCount") || "إجمالي المواعيد"}
          </div>
          <div
            style={{
              fontSize: "1.35rem",
              fontWeight: 800,
              color: "var(--heading)",
              marginTop: 4,
            }}
          >
            {stats.total_appointments ?? appointments.length}
          </div>
        </div>

        <div
          className="glass-card"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-lg, 12px)",
            padding: "16px 18px",
          }}
        >
          <div
            style={{
              fontSize: "0.78rem",
              color: "var(--text-secondary)",
              fontWeight: 600,
            }}
          >
            {t("statusCompleted") || "المكتملة"}
          </div>
          <div
            style={{
              fontSize: "1.35rem",
              fontWeight: 800,
              color: "#10b981",
              marginTop: 4,
            }}
          >
            {stats.completed_appointments ??
              appointments.filter((a) => a.status === "completed").length}
          </div>
        </div>

        <div
          className="glass-card"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-lg, 12px)",
            padding: "16px 18px",
          }}
        >
          <div
            style={{
              fontSize: "0.78rem",
              color: "var(--text-secondary)",
              fontWeight: 600,
            }}
          >
            {t("statusUpcoming") || "القادمة"}
          </div>
          <div
            style={{
              fontSize: "1.35rem",
              fontWeight: 800,
              color: "var(--primary)",
              marginTop: 4,
            }}
          >
            {stats.upcoming_appointments ??
              appointments.filter(
                (a) => a.status === "confirmed" || a.status === "pending",
              ).length}
          </div>
        </div>

        <div
          className="glass-card"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-lg, 12px)",
            padding: "16px 18px",
          }}
        >
          <div
            style={{
              fontSize: "0.78rem",
              color: "var(--text-secondary)",
              fontWeight: 600,
            }}
          >
            {t("totalSpent") || "إجمالي المدفوعات"}
          </div>
          <div
            style={{
              fontSize: "1.35rem",
              fontWeight: 800,
              color: "var(--heading)",
              marginTop: 4,
            }}
          >
            {stats.total_spent ?? 0} {workspace?.currency?.code || "EGP"}
          </div>
        </div>

        <div
          className="glass-card"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-lg, 12px)",
            padding: "16px 18px",
          }}
        >
          <div
            style={{
              fontSize: "0.78rem",
              color: "var(--text-secondary)",
              fontWeight: 600,
            }}
          >
            {t("completionRate") || "نسبة الالتزام"}
          </div>
          <div
            style={{
              fontSize: "1.35rem",
              fontWeight: 800,
              color: "#6366f1",
              marginTop: 4,
            }}
          >
            {stats.completion_rate ?? 100}%
          </div>
        </div>
      </div>

      {/* Adaptive Workspace-Type Industry Card */}
      <div
        className="industry-adaptive-card glass-card animate-slide-up"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg, 16px)",
          padding: "20px 24px",
          marginBottom: 24,
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
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "rgba(2, 105, 130, 0.1)",
                color: "var(--primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon
                name={
                  isClinic
                    ? "stethoscope"
                    : isEducation
                      ? "graduation-cap"
                      : isConsulting
                        ? "briefcase"
                        : isFitness
                          ? "activity"
                          : isBeauty
                            ? "sparkles"
                            : "tag"
                }
                size={20}
              />
            </div>
            <h3
              style={{
                margin: 0,
                fontSize: "1.1rem",
                fontWeight: 800,
                color: "var(--heading)",
              }}
            >
              {isClinic
                ? t("medicalRecordTitle") || "الملف الطبي للمريض"
                : isEducation
                  ? t("academicRecordTitle") || "الملف الأكاديمي للطالب"
                  : isConsulting
                    ? t("corporateRecordTitle") ||
                      `ملف ${customerSingular} التجاري`
                    : isFitness
                      ? t("fitnessRecordTitle") || "الملف الرياضي والصحي"
                      : isBeauty
                        ? t("beautyRecordTitle") || "ملف العناية والتجميل"
                        : t("generalRecordTitle") ||
                          `سجل ${customerSingular} والبيانات الخاصة`}
            </h3>
          </div>

          {canWrite && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleOpenEdit}
              style={{ fontSize: "0.78rem", padding: "5px 12px" }}
            >
              <Icon name="edit-2" size={13} />
              <span>{t("edit") || "تعديل"}</span>
            </button>
          )}
        </div>

        {/* Dynamic Attributes Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 14,
          }}
        >
          {/* Clinic Specific Fields */}
          {isClinic && (
            <>
              <div
                style={{
                  background: "var(--surface-alt)",
                  padding: "12px 14px",
                  borderRadius: 10,
                }}
              >
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--text-secondary)",
                    fontWeight: 600,
                  }}
                >
                  {t("bloodGroup") || "فصيلة الدم"}
                </div>
                <div
                  style={{
                    fontSize: "0.92rem",
                    fontWeight: 700,
                    color: "var(--heading)",
                    marginTop: 2,
                  }}
                >
                  {metadata.blood_group || "غير محدد"}
                </div>
              </div>

              <div
                style={{
                  background: "rgba(239, 68, 68, 0.08)",
                  padding: "12px 14px",
                  borderRadius: 10,
                  border: "1px solid rgba(239, 68, 68, 0.2)",
                }}
              >
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: "#ef4444",
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <Icon name="alert-triangle" size={14} />
                  <span>{t("allergies") || "الحساسية والمحاذير"}</span>
                </div>
                <div
                  style={{
                    fontSize: "0.92rem",
                    fontWeight: 700,
                    color: "#b91c1c",
                    marginTop: 2,
                  }}
                >
                  {metadata.allergies || "لا توجد حساسيات مسجلة"}
                </div>
              </div>

              <div
                style={{
                  background: "var(--surface-alt)",
                  padding: "12px 14px",
                  borderRadius: 10,
                }}
              >
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--text-secondary)",
                    fontWeight: 600,
                  }}
                >
                  {t("chronicConditions") || "الأمراض المزمنة"}
                </div>
                <div
                  style={{
                    fontSize: "0.92rem",
                    fontWeight: 700,
                    color: "var(--heading)",
                    marginTop: 2,
                  }}
                >
                  {metadata.chronic_conditions || "سليم — لا توجد"}
                </div>
              </div>

              <div
                style={{
                  background: "var(--surface-alt)",
                  padding: "12px 14px",
                  borderRadius: 10,
                }}
              >
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--text-secondary)",
                    fontWeight: 600,
                  }}
                >
                  {t("emergencyContact") || "طوارئ"}
                </div>
                <div
                  style={{
                    fontSize: "0.92rem",
                    fontWeight: 700,
                    color: "var(--heading)",
                    marginTop: 2,
                  }}
                >
                  {metadata.emergency_contact || "غير مسجل"}
                </div>
              </div>
            </>
          )}

          {/* Education Specific Fields */}
          {isEducation && (
            <>
              <div
                style={{
                  background: "var(--surface-alt)",
                  padding: "12px 14px",
                  borderRadius: 10,
                }}
              >
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--text-secondary)",
                    fontWeight: 600,
                  }}
                >
                  {t("studentGrade") || "المرحلة / الصف"}
                </div>
                <div
                  style={{
                    fontSize: "0.92rem",
                    fontWeight: 700,
                    color: "var(--heading)",
                    marginTop: 2,
                  }}
                >
                  {metadata.grade_level || "غير محدد"}
                </div>
              </div>

              <div
                style={{
                  background: "var(--surface-alt)",
                  padding: "12px 14px",
                  borderRadius: 10,
                }}
              >
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--text-secondary)",
                    fontWeight: 600,
                  }}
                >
                  {t("schoolUniversity") || "المدرسة / الجامعة"}
                </div>
                <div
                  style={{
                    fontSize: "0.92rem",
                    fontWeight: 700,
                    color: "var(--heading)",
                    marginTop: 2,
                  }}
                >
                  {metadata.school_name || "غير مسجل"}
                </div>
              </div>

              <div
                style={{
                  background: "var(--surface-alt)",
                  padding: "12px 14px",
                  borderRadius: 10,
                }}
              >
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--text-secondary)",
                    fontWeight: 600,
                  }}
                >
                  {t("parentContact") || "ولي الأمر"}
                </div>
                <div
                  style={{
                    fontSize: "0.92rem",
                    fontWeight: 700,
                    color: "var(--heading)",
                    marginTop: 2,
                  }}
                >
                  {metadata.parent_name
                    ? `${metadata.parent_name} (${metadata.parent_phone || ""})`
                    : "غير مسجل"}
                </div>
              </div>
            </>
          )}

          {/* Consulting Specific Fields */}
          {isConsulting && (
            <>
              <div
                style={{
                  background: "var(--surface-alt)",
                  padding: "12px 14px",
                  borderRadius: 10,
                }}
              >
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--text-secondary)",
                    fontWeight: 600,
                  }}
                >
                  {t("companyName") || "الشركة / المؤسسة"}
                </div>
                <div
                  style={{
                    fontSize: "0.92rem",
                    fontWeight: 700,
                    color: "var(--heading)",
                    marginTop: 2,
                  }}
                >
                  {metadata.company_name || "فردي"}
                </div>
              </div>

              <div
                style={{
                  background: "var(--surface-alt)",
                  padding: "12px 14px",
                  borderRadius: 10,
                }}
              >
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--text-secondary)",
                    fontWeight: 600,
                  }}
                >
                  {t("jobTitle") || "المنصب / المسمى"}
                </div>
                <div
                  style={{
                    fontSize: "0.92rem",
                    fontWeight: 700,
                    color: "var(--heading)",
                    marginTop: 2,
                  }}
                >
                  {metadata.job_title || "غير محدد"}
                </div>
              </div>

              <div
                style={{
                  background: "var(--surface-alt)",
                  padding: "12px 14px",
                  borderRadius: 10,
                }}
              >
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--text-secondary)",
                    fontWeight: 600,
                  }}
                >
                  {t("industrySector") || "مجال العمل"}
                </div>
                <div
                  style={{
                    fontSize: "0.92rem",
                    fontWeight: 700,
                    color: "var(--heading)",
                    marginTop: 2,
                  }}
                >
                  {metadata.industry || "عام"}
                </div>
              </div>
            </>
          )}

          {/* Fitness Specific Fields */}
          {isFitness && (
            <>
              <div
                style={{
                  background: "var(--surface-alt)",
                  padding: "12px 14px",
                  borderRadius: 10,
                }}
              >
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--text-secondary)",
                    fontWeight: 600,
                  }}
                >
                  {t("fitnessGoal") || "الهدف الرياضي"}
                </div>
                <div
                  style={{
                    fontSize: "0.92rem",
                    fontWeight: 700,
                    color: "var(--heading)",
                    marginTop: 2,
                  }}
                >
                  {metadata.fitness_goal || "تحسين اللياقة"}
                </div>
              </div>

              <div
                style={{
                  background: "var(--surface-alt)",
                  padding: "12px 14px",
                  borderRadius: 10,
                }}
              >
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--text-secondary)",
                    fontWeight: 600,
                  }}
                >
                  {t("currentWeight") || "الوزن الحالي"}
                </div>
                <div
                  style={{
                    fontSize: "0.92rem",
                    fontWeight: 700,
                    color: "var(--heading)",
                    marginTop: 2,
                  }}
                >
                  {metadata.current_weight
                    ? `${metadata.current_weight} ${t("kg") || "كجم"}`
                    : lang === "ar"
                      ? "غير مسجل"
                      : "Not recorded"}
                </div>
              </div>

              <div
                style={{
                  background: "var(--surface-alt)",
                  padding: "12px 14px",
                  borderRadius: 10,
                }}
              >
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--text-secondary)",
                    fontWeight: 600,
                  }}
                >
                  {t("targetWeight") || "الوزن المستهدف"}
                </div>
                <div
                  style={{
                    fontSize: "0.92rem",
                    fontWeight: 700,
                    color: "var(--heading)",
                    marginTop: 2,
                  }}
                >
                  {metadata.target_weight
                    ? `${metadata.target_weight} ${t("kg") || "كجم"}`
                    : lang === "ar"
                      ? "غير مسجل"
                      : "Not recorded"}
                </div>
              </div>
            </>
          )}

          {/* General Workspace Contact Details */}
          {!isClinic && !isEducation && !isConsulting && !isFitness && (
            <>
              <div
                style={{
                  background: "var(--surface-alt)",
                  padding: "12px 14px",
                  borderRadius: 10,
                }}
              >
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--text-secondary)",
                    fontWeight: 600,
                  }}
                >
                  {t("email") || "البريد الإلكتروني"}
                </div>
                <div
                  style={{
                    fontSize: "0.92rem",
                    fontWeight: 700,
                    color: "var(--heading)",
                    marginTop: 2,
                  }}
                >
                  {customer.email || "—"}
                </div>
              </div>

              <div
                style={{
                  background: "var(--surface-alt)",
                  padding: "12px 14px",
                  borderRadius: 10,
                }}
              >
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--text-secondary)",
                    fontWeight: 600,
                  }}
                >
                  {t("phone") || "رقم الهاتف"}
                </div>
                <div
                  style={{
                    fontSize: "0.92rem",
                    fontWeight: 700,
                    color: "var(--heading)",
                    marginTop: 2,
                  }}
                  dir="ltr"
                >
                  {customer.phone || "—"}
                </div>
              </div>

              <div
                style={{
                  background: "var(--surface-alt)",
                  padding: "12px 14px",
                  borderRadius: 10,
                }}
              >
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--text-secondary)",
                    fontWeight: 600,
                  }}
                >
                  {t("customerFileNo") || "رقم الملف"}
                </div>
                <div
                  style={{
                    fontSize: "0.92rem",
                    fontWeight: 700,
                    color: "var(--heading)",
                    marginTop: 2,
                  }}
                >
                  {pivot.customer_reference || "—"}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div
        className="profile-tabs-header no-scrollbar"
        style={{
          display: "flex",
          borderBottom: "2px solid var(--border-light, #e2e8f0)",
          gap: 20,
          marginBottom: 24,
          overflowX: "auto",
          whiteSpace: "nowrap",
          WebkitOverflowScrolling: "touch",
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab("timeline")}
          style={{
            padding: "12px 4px",
            background: "none",
            border: "none",
            borderBottom:
              activeTab === "timeline"
                ? "3px solid var(--primary)"
                : "3px solid transparent",
            color:
              activeTab === "timeline"
                ? "var(--primary)"
                : "var(--text-secondary)",
            fontWeight: activeTab === "timeline" ? 800 : 600,
            fontSize: "0.96rem",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: -2,
            transition: "all 0.15s ease",
            flexShrink: 0,
            whiteSpace: "nowrap",
          }}
        >
          <Icon name="history" size={18} />
          <span>{t("tabTimeline") || "سجل المواعيد والخط الزمني"}</span>
          <span
            style={{
              fontSize: "0.74rem",
              padding: "2px 7px",
              borderRadius: 12,
              background:
                activeTab === "timeline"
                  ? "rgba(2, 105, 130, 0.12)"
                  : "var(--surface-alt)",
              color:
                activeTab === "timeline"
                  ? "var(--primary)"
                  : "var(--text-secondary)",
              fontWeight: 700,
            }}
          >
            {appointments.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("workspace_data")}
          style={{
            padding: "12px 4px",
            background: "none",
            border: "none",
            borderBottom:
              activeTab === "workspace_data"
                ? "3px solid var(--primary)"
                : "3px solid transparent",
            color:
              activeTab === "workspace_data"
                ? "var(--primary)"
                : "var(--text-secondary)",
            fontWeight: activeTab === "workspace_data" ? 800 : 600,
            fontSize: "0.96rem",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: -2,
            transition: "all 0.15s ease",
            flexShrink: 0,
            whiteSpace: "nowrap",
          }}
        >
          <Icon name="clipboard-list" size={18} />
          <span>{t("tabWorkspaceData") || "الملاحظات والبيانات الداخلية"}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("financial")}
          style={{
            padding: "12px 4px",
            background: "none",
            border: "none",
            borderBottom:
              activeTab === "financial"
                ? "3px solid var(--primary)"
                : "3px solid transparent",
            color:
              activeTab === "financial"
                ? "var(--primary)"
                : "var(--text-secondary)",
            fontWeight: activeTab === "financial" ? 800 : 600,
            fontSize: "0.96rem",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: -2,
            transition: "all 0.15s ease",
            flexShrink: 0,
            whiteSpace: "nowrap",
          }}
        >
          <Icon name="credit-card" size={18} />
          <span>{t("tabFinancial") || "المدفوعات والفواتير"}</span>
        </button>
      </div>

      {/* Tab 1: Timeline & Appointments */}
      {activeTab === "timeline" && (
        <div className="tab-timeline-view animate-fade-in">
          {/* Timeline Filter Pills */}
          <div
            style={{
              display: "flex",
              gap: 8,
              marginBottom: 20,
              flexWrap: "wrap",
            }}
          >
            {[
              { id: "all", label: t("filterStatusAll") || "جميع المواعيد" },
              {
                id: "upcoming",
                label: t("statusUpcoming") || "المواعيد القادمة",
              },
              { id: "completed", label: t("statusCompleted") || "المكتملة" },
              { id: "cancelled", label: t("statusCancelled") || "الملغاة" },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setTimelineFilter(f.id)}
                style={{
                  padding: "6px 14px",
                  borderRadius: 20,
                  fontSize: "0.82rem",
                  fontWeight: timelineFilter === f.id ? 700 : 500,
                  border:
                    timelineFilter === f.id
                      ? "1px solid var(--primary)"
                      : "1px solid var(--border)",
                  background:
                    timelineFilter === f.id
                      ? "var(--primary)"
                      : "var(--surface)",
                  color:
                    timelineFilter === f.id
                      ? "#ffffff"
                      : "var(--text-secondary)",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          {filteredAppointments.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "60px 20px",
                background: "var(--surface)",
                borderRadius: "var(--radius-lg, 16px)",
                border: "1px dashed var(--border)",
              }}
            >
              <Icon
                name="calendar"
                size={36}
                style={{
                  color: "var(--text-muted, #94a3b8)",
                  marginBottom: 10,
                }}
              />
              <h4
                style={{
                  fontSize: "1.05rem",
                  fontWeight: 700,
                  color: "var(--heading)",
                  margin: "0 0 6px 0",
                }}
              >
                {t("noAppointmentsYet") || "لا توجد مواعيد سابقة مسجلة"}
              </h4>
              <p
                style={{
                  color: "var(--text-secondary)",
                  fontSize: "0.85rem",
                  maxWidth: 360,
                  margin: "0 auto 16px",
                }}
              >
                {t("noCustomerAppointmentsYet") ||
                  `لم يسجل هذا ${customerSingular} أي مواعيد في مساحة العمل هذه حتى الآن.`}
              </p>
              {canBook && (
                <button
                  type="button"
                  onClick={() => setIsBookingModalOpen(true)}
                  className="btn btn-primary"
                  style={{ fontSize: "0.84rem" }}
                >
                  <Icon name="plus" size={15} />
                  <span>
                    {t("bookAppointmentForCustomer") || "حجز موعد الآن"}
                  </span>
                </button>
              )}
            </div>
          ) : (
            <div
              className="interactive-timeline-tree"
              style={{
                position: "relative",
                paddingLeft: lang === "ar" ? 0 : 28,
                paddingRight: lang === "ar" ? 28 : 0,
              }}
            >
              {/* Vertical timeline line */}
              <div
                style={{
                  position: "absolute",
                  top: 10,
                  bottom: 10,
                  [lang === "ar" ? "right" : "left"]: 8,
                  width: 2,
                  background: "var(--border)",
                }}
              />

              {filteredAppointments.map((apt, index) => {
                const serviceName = apt.service?.name
                  ? typeof apt.service.name === "object"
                    ? apt.service.name[lang] ||
                      apt.service.name.ar ||
                      apt.service.name.en
                    : apt.service.name
                  : apt.service_name_snapshot ||
                    t("customService") ||
                    "خدمة استشارية";

                const specialistName =
                  apt.workspace_member?.name ||
                  t("assignedSpecialist") ||
                  "الأخصائي المعتمد";
                const isCompleted = apt.status === "completed";
                const isCancelled = apt.status === "cancelled";

                return (
                  <div
                    key={apt.id || index}
                    className="timeline-item animate-slide-up"
                    style={{
                      position: "relative",
                      marginBottom: 22,
                      animationDelay: `${index * 0.05}s`,
                    }}
                  >
                    {/* Timeline Node Dot */}
                    <div
                      style={{
                        position: "absolute",
                        top: 14,
                        [lang === "ar" ? "right" : "left"]: -28 + 4,
                        width: 16,
                        height: 16,
                        borderRadius: "50%",
                        background: isCompleted
                          ? "#10b981"
                          : isCancelled
                            ? "#ef4444"
                            : "var(--primary)",
                        border: "3px solid var(--surface)",
                        boxShadow: "0 0 0 2px var(--border)",
                        zIndex: 2,
                      }}
                    />

                    {/* Timeline Event Card */}
                    <div
                      className="glass-card"
                      style={{
                        background: "var(--surface)",
                        border: "1px solid var(--border)",
                        borderRadius: "var(--radius-lg, 14px)",
                        padding: 18,
                        boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          justifyContent: "space-between",
                          flexWrap: "wrap",
                          gap: 10,
                          marginBottom: 10,
                        }}
                      >
                        <div>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 10,
                            }}
                          >
                            <h4
                              style={{
                                margin: 0,
                                fontSize: "1.05rem",
                                fontWeight: 800,
                                color: "var(--heading)",
                              }}
                            >
                              {serviceName}
                            </h4>
                            <span
                              style={{
                                padding: "2px 8px",
                                borderRadius: 10,
                                fontSize: "0.72rem",
                                fontWeight: 700,
                                background: isCompleted
                                  ? "rgba(16, 185, 129, 0.12)"
                                  : isCancelled
                                    ? "rgba(239, 68, 68, 0.12)"
                                    : "rgba(2, 105, 130, 0.12)",
                                color: isCompleted
                                  ? "#10b981"
                                  : isCancelled
                                    ? "#ef4444"
                                    : "var(--primary)",
                              }}
                            >
                              {apt.status}
                            </span>
                          </div>

                          <div
                            style={{
                              fontSize: "0.82rem",
                              color: "var(--text-secondary)",
                              marginTop: 4,
                              display: "flex",
                              alignItems: "center",
                              gap: 12,
                            }}
                          >
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 4,
                              }}
                            >
                              <Icon
                                name="clock"
                                size={13}
                                style={{ color: "var(--primary)" }}
                              />
                              {apt.starts_at
                                ? new Date(apt.starts_at).toLocaleString(
                                    lang === "ar" ? "ar-EG" : "en-US",
                                    { dateStyle: "medium", timeStyle: "short" },
                                  )
                                : "—"}
                            </span>
                            <span>•</span>
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 4,
                              }}
                            >
                              <Icon name="user" size={13} />
                              {specialistName}
                            </span>
                          </div>
                        </div>

                        <div
                          style={{
                            fontSize: "0.92rem",
                            fontWeight: 800,
                            color: "var(--heading)",
                          }}
                        >
                          {apt.price_snapshot ?? apt.service?.price ?? 0}{" "}
                          {apt.currency_snapshot ||
                            workspace?.currency?.code ||
                            "EGP"}
                        </div>
                      </div>

                      {/* Clinical Doctor Summary / Prescription */}
                      {apt.summary && (
                        <div
                          className="clinical-summary-box"
                          style={{
                            background: "rgba(2, 105, 130, 0.05)",
                            border: "1px solid rgba(2, 105, 130, 0.15)",
                            borderRadius: 10,
                            padding: "12px 14px",
                            marginTop: 12,
                            textAlign: isRTL ? "right" : "left",
                            direction: isRTL ? "rtl" : "ltr",
                          }}
                        >
                          <div
                            style={{
                              fontWeight: 700,
                              fontSize: "0.82rem",
                              color: "var(--primary)",
                              marginBottom: 6,
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                            }}
                          >
                            <Icon name="file-text" size={15} />
                            <span>
                              {t("clinicalSummary") ||
                                "ملخص الجلسة والتشخيص الطبي"}
                            </span>
                          </div>
                          <div
                            className="prose clinical-summary-content"
                            style={{
                              margin: 0,
                              fontSize: "0.88rem",
                              color: "var(--heading)",
                              lineHeight: 1.6,
                              textAlign: isRTL ? "right" : "left",
                              direction: isRTL ? "rtl" : "ltr",
                            }}
                            dangerouslySetInnerHTML={{
                              __html:
                                typeof apt.summary === "string"
                                  ? apt.summary
                                  : "",
                            }}
                          />
                        </div>
                      )}

                      {/* Customer Question Answers */}
                      {Array.isArray(apt.answers) && apt.answers.length > 0 && (
                        <div
                          style={{
                            marginTop: 12,
                            paddingTop: 10,
                            borderTop: "1px solid var(--border-light, #f1f5f9)",
                          }}
                        >
                          <div
                            style={{
                              fontSize: "0.76rem",
                              fontWeight: 700,
                              color: "var(--text-secondary)",
                              marginBottom: 6,
                            }}
                          >
                            {t("formAnswers") || "إجابات نموذج الحجز:"}
                          </div>
                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns:
                                "repeat(auto-fit, minmax(200px, 1fr))",
                              gap: 8,
                            }}
                          >
                            {apt.answers.map((ans, aIdx) => (
                              <div
                                key={aIdx}
                                style={{
                                  fontSize: "0.78rem",
                                  background: "var(--surface-alt)",
                                  padding: "6px 10px",
                                  borderRadius: 6,
                                }}
                              >
                                <span
                                  style={{
                                    fontWeight: 600,
                                    color: "var(--text-secondary)",
                                  }}
                                >
                                  {ans.question_label ||
                                    (ans.question?.label
                                      ? typeof ans.question.label === "object"
                                        ? ans.question.label[lang] ||
                                          ans.question.label.ar ||
                                          ans.question.label.en
                                        : ans.question.label
                                      : t("question") || "سؤال")}
                                  :
                                </span>{" "}
                                <span
                                  style={{
                                    color: "var(--heading)",
                                    fontWeight: 700,
                                  }}
                                >
                                  {Array.isArray(ans.answer)
                                    ? ans.answer.join(", ")
                                    : typeof ans.answer === "object" &&
                                        ans.answer !== null
                                      ? JSON.stringify(ans.answer)
                                      : ans.answer_text || ans.answer || "—"}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Workspace Data & Internal Notes */}
      {activeTab === "workspace_data" && (
        <div className="tab-notes-view animate-fade-in">
          {/* Notes Card */}
          <div
            className="glass-card"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-lg, 16px)",
              padding: 22,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 12,
              }}
            >
              <Icon
                name="file-text"
                size={20}
                style={{ color: "var(--primary)" }}
              />
              <h3
                style={{
                  margin: 0,
                  fontSize: "1.08rem",
                  fontWeight: 800,
                  color: "var(--heading)",
                }}
              >
                {t("internalNotes") || "ملاحظات سرية لفريق العمل"}
              </h3>
            </div>
            <p
              style={{
                fontSize: "0.82rem",
                color: "var(--text-secondary)",
                marginBottom: 14,
                lineHeight: 1.5,
              }}
            >
              {t("internalNotesNotice") ||
                `هذه الملاحظات خاصة بمساحة العمل فقط ولا تظهر لـ${customerSingular} إطلاقاً.`}
            </p>

            <textarea
              className="form-input"
              rows={8}
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              placeholder={
                t("internalNotesPlaceholder") ||
                `أضف ملاحظات سرية، تفضيلات ${customerSingular}، أو تعليمات خاصة بمتابعة حالته...`
              }
              disabled={!canWrite}
              style={{
                width: "100%",
                fontSize: "0.88rem",
                lineHeight: 1.6,
                boxSizing: "border-box",
                resize: "vertical",
              }}
            />

            {canWrite && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  marginTop: 14,
                }}
              >
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleSaveNotes}
                  disabled={savingNotes}
                  style={{
                    fontSize: "0.84rem",
                    padding: "9px 20px",
                    fontWeight: 700,
                  }}
                >
                  {savingNotes
                    ? t("saving") || "جاري الحفظ..."
                    : t("saveChanges") || "حفظ التغييرات"}
                </button>
              </div>
            )}
          </div>

          {/* Contact & Workspace Metadata Details */}
          <div
            className="glass-card"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-lg, 16px)",
              padding: 22,
            }}
          >
            <h3
              style={{
                margin: "0 0 16px 0",
                fontSize: "1.08rem",
                fontWeight: 800,
                color: "var(--heading)",
              }}
            >
              {t("customerDetails") || "بيانات التواصل والإعدادات"}
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div
                className="profile-detail-row"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 8,
                  borderBottom: "1px solid var(--border-light, #f1f5f9)",
                  paddingBottom: 8,
                }}
              >
                <span
                  style={{
                    fontSize: "0.82rem",
                    color: "var(--text-secondary)",
                    fontWeight: 600,
                    flexShrink: 0,
                  }}
                >
                  {t("email") || "البريد الإلكتروني"}:
                </span>
                <span
                  style={{
                    fontSize: "0.86rem",
                    fontWeight: 700,
                    color: "var(--heading)",
                    wordBreak: "break-all",
                    textAlign: isRTL ? "left" : "right",
                  }}
                  dir="ltr"
                >
                  {customer.email || "—"}
                </span>
              </div>

              <div
                className="profile-detail-row"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 8,
                  borderBottom: "1px solid var(--border-light, #f1f5f9)",
                  paddingBottom: 8,
                }}
              >
                <span
                  style={{
                    fontSize: "0.82rem",
                    color: "var(--text-secondary)",
                    fontWeight: 600,
                    flexShrink: 0,
                  }}
                >
                  {t("phone") || "رقم الهاتف"}:
                </span>
                <span
                  style={{
                    fontSize: "0.86rem",
                    fontWeight: 700,
                    color: "var(--heading)",
                    wordBreak: "break-word",
                  }}
                  dir="ltr"
                >
                  {customer.phone || "—"}
                </span>
              </div>

              <div
                className="profile-detail-row"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 8,
                  borderBottom: "1px solid var(--border-light, #f1f5f9)",
                  paddingBottom: 8,
                }}
              >
                <span
                  style={{
                    fontSize: "0.82rem",
                    color: "var(--text-secondary)",
                    fontWeight: 600,
                    flexShrink: 0,
                  }}
                >
                  {t("customerFileNo") || "رقم الملف / المرجع"}:
                </span>
                <span
                  style={{
                    fontSize: "0.86rem",
                    fontWeight: 700,
                    color: "var(--primary)",
                    wordBreak: "break-word",
                  }}
                >
                  {pivot.customer_reference || "—"}
                </span>
              </div>

              <div
                className="profile-detail-row"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 8,
                  borderBottom: "1px solid var(--border-light, #f1f5f9)",
                  paddingBottom: 8,
                }}
              >
                <span
                  style={{
                    fontSize: "0.82rem",
                    color: "var(--text-secondary)",
                    fontWeight: 600,
                    flexShrink: 0,
                  }}
                >
                  {t("status") || `حالة ${customerSingular}`}:
                </span>
                <span
                  style={{
                    fontSize: "0.86rem",
                    fontWeight: 700,
                    color:
                      status === "active"
                        ? "#10b981"
                        : isVip
                          ? "#d97706"
                          : "var(--heading)",
                  }}
                >
                  {status}
                </span>
              </div>

              <div
                className="profile-detail-row"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 8,
                  paddingBottom: 8,
                }}
              >
                <span
                  style={{
                    fontSize: "0.82rem",
                    color: "var(--text-secondary)",
                    fontWeight: 600,
                    flexShrink: 0,
                  }}
                >
                  {t("customerDob") || "تاريخ الميلاد"}:
                </span>
                <span
                  style={{
                    fontSize: "0.86rem",
                    fontWeight: 700,
                    color: "var(--heading)",
                  }}
                >
                  {customer.date_of_birth || "—"}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Financial History */}
      {activeTab === "financial" && (
        <div className="tab-financial-view animate-fade-in">
          <div
            className="table-responsive glass-card"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-lg, 14px)",
              overflow: "hidden",
            }}
          >
            <table
              className="table"
              style={{ width: "100%", borderCollapse: "collapse" }}
            >
              <thead>
                <tr
                  style={{
                    background: "var(--surface-alt)",
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  <th
                    style={{
                      padding: "12px 16px",
                      textAlign: lang === "ar" ? "right" : "left",
                      fontSize: "0.8rem",
                      color: "var(--text-secondary)",
                    }}
                  >
                    {t("date") || "التاريخ"}
                  </th>
                  <th
                    style={{
                      padding: "12px 16px",
                      textAlign: lang === "ar" ? "right" : "left",
                      fontSize: "0.8rem",
                      color: "var(--text-secondary)",
                    }}
                  >
                    {t("service") || "الخدمة"}
                  </th>
                  <th
                    style={{
                      padding: "12px 16px",
                      textAlign: "center",
                      fontSize: "0.8rem",
                      color: "var(--text-secondary)",
                    }}
                  >
                    {t("amount") || "المبلغ"}
                  </th>
                  <th
                    style={{
                      padding: "12px 16px",
                      textAlign: "center",
                      fontSize: "0.8rem",
                      color: "var(--text-secondary)",
                    }}
                  >
                    {t("status") || "حالة الموعد"}
                  </th>
                </tr>
              </thead>
              <tbody>
                {appointments.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      style={{
                        textAlign: "center",
                        padding: "40px 16px",
                        color: "var(--text-secondary)",
                      }}
                    >
                      {t("noFinancialRecords") || "لا توجد سجلات مالية مسجلة"}
                    </td>
                  </tr>
                ) : (
                  appointments.map((apt) => (
                    <tr
                      key={apt.id}
                      style={{
                        borderBottom: "1px solid var(--border-light, #f1f5f9)",
                      }}
                    >
                      <td
                        style={{
                          padding: "12px 16px",
                          fontSize: "0.85rem",
                          color: "var(--heading)",
                        }}
                      >
                        {apt.starts_at
                          ? new Date(apt.starts_at).toLocaleDateString(
                              lang === "ar" ? "ar-EG" : "en-US",
                            )
                          : "—"}
                      </td>
                      <td
                        style={{
                          padding: "12px 16px",
                          fontSize: "0.88rem",
                          fontWeight: 600,
                          color: "var(--heading)",
                        }}
                      >
                        {apt.service?.name
                          ? typeof apt.service.name === "object"
                            ? apt.service.name[lang] || apt.service.name.ar
                            : apt.service.name
                          : apt.service_name_snapshot || "خدمة"}
                      </td>
                      <td
                        style={{
                          padding: "12px 16px",
                          textAlign: "center",
                          fontSize: "0.9rem",
                          fontWeight: 800,
                          color: "var(--heading)",
                        }}
                      >
                        {apt.price_snapshot ?? apt.service?.price ?? 0}{" "}
                        {apt.currency_snapshot ||
                          workspace?.currency?.code ||
                          "EGP"}
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "center" }}>
                        <span
                          style={{
                            padding: "2px 8px",
                            borderRadius: 10,
                            fontSize: "0.72rem",
                            fontWeight: 700,
                            background:
                              apt.status === "completed"
                                ? "rgba(16, 185, 129, 0.12)"
                                : "var(--surface-alt)",
                            color:
                              apt.status === "completed"
                                ? "#10b981"
                                : "var(--text-secondary)",
                          }}
                        >
                          {apt.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Customer Modal */}
      {isEditModalOpen && (
        <div
          className="modal-overlay animate-fade-in"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: 16,
          }}
          onClick={() => setIsEditModalOpen(false)}
        >
          <div
            className="modal-container glass-card animate-scale-in"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-lg, 16px)",
              width: "100%",
              maxWidth: 580,
              maxHeight: "90vh",
              overflowY: "auto",
              padding: 24,
              boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 20,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    background: "rgba(2, 105, 130, 0.1)",
                    color: "var(--primary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icon name="edit-2" size={20} />
                </div>
                <h3
                  style={{
                    margin: 0,
                    fontSize: "1.2rem",
                    fontWeight: 800,
                    color: "var(--heading)",
                  }}
                >
                  {(t("editPrefix") || "تعديل بيانات") + " " + customerSingular}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--text-secondary)",
                }}
              >
                <Icon name="x" size={20} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSaveCustomer();
              }}
            >
              <div
                className="form-row"
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: 14,
                  marginBottom: 14,
                }}
              >
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 700 }}>
                    {t("fullName") || "الاسم الكامل"} *
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={customerForm.name}
                    onChange={(e) =>
                      setCustomerForm({ ...customerForm, name: e.target.value })
                    }
                    required
                  />
                  {formErrors.name && (
                    <span
                      style={{
                        color: "#ef4444",
                        fontSize: "0.75rem",
                        marginTop: 4,
                        display: "block",
                      }}
                    >
                      {Array.isArray(formErrors.name)
                        ? formErrors.name[0]
                        : formErrors.name}
                    </span>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">
                    {t("customerFileNo") || "رقم الملف / المرجع"}
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={customerForm.customer_reference}
                    onChange={(e) =>
                      setCustomerForm({
                        ...customerForm,
                        customer_reference: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div
                className="form-row"
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: 14,
                  marginBottom: 14,
                }}
              >
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 700 }}>
                    {t("email") || "البريد الإلكتروني"} *
                  </label>
                  <input
                    type="email"
                    className="form-input"
                    value={customerForm.email}
                    onChange={(e) =>
                      setCustomerForm({
                        ...customerForm,
                        email: e.target.value,
                      })
                    }
                    required
                  />
                  {formErrors.email && (
                    <span
                      style={{
                        color: "#ef4444",
                        fontSize: "0.75rem",
                        marginTop: 4,
                        display: "block",
                      }}
                    >
                      {Array.isArray(formErrors.email)
                        ? formErrors.email[0]
                        : formErrors.email}
                    </span>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">
                    {t("phone") || "رقم الهاتف"}
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={customerForm.phone}
                    onChange={(e) =>
                      setCustomerForm({
                        ...customerForm,
                        phone: e.target.value,
                      })
                    }
                    dir="ltr"
                  />
                  {formErrors.phone && (
                    <span
                      style={{
                        color: "#ef4444",
                        fontSize: "0.75rem",
                        marginTop: 4,
                        display: "block",
                      }}
                    >
                      {Array.isArray(formErrors.phone)
                        ? formErrors.phone[0]
                        : formErrors.phone}
                    </span>
                  )}
                </div>
              </div>

              <div
                className="form-row"
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                  gap: 14,
                  marginBottom: 14,
                }}
              >
                <div className="form-group">
                  <label className="form-label">
                    {t("customerGender") || "الجنس"}
                  </label>
                  <select
                    className="form-select"
                    value={customerForm.gender || "male"}
                    onChange={(e) =>
                      setCustomerForm({
                        ...customerForm,
                        gender: e.target.value,
                      })
                    }
                  >
                    <option value="male">{t("genderMale") || "ذكر"}</option>
                    <option value="female">
                      {t("genderFemale") || "أنثى"}
                    </option>
                    <option value="other">{t("other") || "آخر"}</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    {t("customerDob") || "تاريخ الميلاد"}
                  </label>
                  <input
                    type="date"
                    className="form-input"
                    value={customerForm.date_of_birth}
                    onChange={(e) =>
                      setCustomerForm({
                        ...customerForm,
                        date_of_birth: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    {t("status") || "الحالة"}
                  </label>
                  <select
                    className="form-select"
                    value={customerForm.status || "active"}
                    onChange={(e) =>
                      setCustomerForm({
                        ...customerForm,
                        status: e.target.value,
                      })
                    }
                  >
                    <option value="active">
                      {t("filterStatusActive") || "نشط"}
                    </option>
                    <option value="vip">
                      {t("filterStatusVip") || `${customerSingular} مميز (VIP)`}
                    </option>
                    <option value="lead">
                      {t("filterStatusLead") || "محتمل / جديد"}
                    </option>
                    <option value="inactive">
                      {t("filterStatusInactive") || "غير نشط"}
                    </option>
                    <option value="blocked">
                      {t("filterStatusBlocked") || "محظور"}
                    </option>
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-end",
                  gap: 10,
                  marginTop: 16,
                }}
              >
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsEditModalOpen(false)}
                  disabled={savingCustomer}
                >
                  {t("cancel") || "إلغاء"}
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={savingCustomer}
                >
                  {savingCustomer
                    ? t("saving") || "جاري الحفظ..."
                    : t("saveChanges") || "حفظ التغييرات"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Booking Modal */}
      {isBookingModalOpen && customer && (
        <CreateBookingModal
          isOpen={isBookingModalOpen}
          onClose={() => setIsBookingModalOpen(false)}
          onSuccess={() => {
            setIsBookingModalOpen(false);
            fetchCustomer();
          }}
          preselectedCustomer={customer}
        />
      )}
    </div>
  );
}
