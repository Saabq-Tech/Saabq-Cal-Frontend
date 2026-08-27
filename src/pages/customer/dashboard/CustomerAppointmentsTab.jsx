import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useNavigate, Link } from "react-router-dom";
import { useLanguage } from "../../../context/LanguageContext";
import { useToast } from "../../../context/ToastContext";
import client, { endpoints } from "../../../api/client";
import Icon from "../../../components/common/Icon";
import SEO from "../../../components/ui/SEO";
import { SkeletonRect } from "../../../components/ui/Skeleton";
import UserAvatar from "../../../components/ui/UserAvatar";

export default function CustomerAppointmentsTab() {
  const { t, isRTL, lang } = useLanguage();
  const toast = useToast();
  const navigate = useNavigate();

  const [appointments, setAppointments] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  // Filters
  const [timeframe, setTimeframe] = useState("all");
  const [statusFilter, setStatusFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Selected Appointment for details modal
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [startingChatId, setStartingChatId] = useState(null);
  const [lightboxImage, setLightboxImage] = useState(null);

  // Cancellation modal state
  const [cancelModalAppt, setCancelModalAppt] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);

  // Reschedule modal state
  const [rescheduleModalAppt, setRescheduleModalAppt] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");
  const [rescheduleReason, setRescheduleReason] = useState("");
  const [rescheduling, setRescheduling] = useState(false);

  // Payment proof reupload modal state
  const [proofModalAppt, setProofModalAppt] = useState(null);
  const [proofFile, setProofFile] = useState(null);
  const [proofFilePreview, setProofFilePreview] = useState("");
  const [proofNotes, setProofNotes] = useState("");
  const [uploadingProof, setUploadingProof] = useState(false);

  const fetchAppointments = useCallback(
    async (targetPage = 1) => {
      setLoading(true);
      try {
        const params = {
          page: targetPage,
          per_page: 10,
        };
        if (timeframe !== "all") params.timeframe = timeframe;
        if (statusFilter) params.status = statusFilter;
        if (searchQuery.trim()) params.search = searchQuery.trim();

        const res = await client.get("/customers/appointments", { params });
        setAppointments(res.data?.data || []);
        setMeta(res.data?.meta || null);
      } catch (err) {
        toast.error(
          err.response?.data?.message ||
            (isRTL ? "فشل تحميل المواعيد" : "Failed to load appointments"),
        );
      } finally {
        setLoading(false);
      }
    },
    [timeframe, statusFilter, searchQuery, isRTL, toast],
  );

  useEffect(() => {
    fetchAppointments(page);
  }, [fetchAppointments, page]);

  const handleOpenDetails = async (appt) => {
    setSelectedAppointment(appt);
    setLoadingDetails(true);
    try {
      const res = await client.get(`/customers/appointments/${appt.id}`);
      if (res.data?.data) {
        setSelectedAppointment(res.data.data);
      }
    } catch {
      // Fallback to existing payload if endpoint fails
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleStartChatWithWorkspace = async (appt, e) => {
    if (e) e.stopPropagation();
    setStartingChatId(appt.id);
    try {
      // 1. Target workspace member who provided the service
      let recipientType = "member";
      let recipientId =
        appt.workspace_member_id ||
        appt.workspace_member?.id ||
        appt.service?.workspace_member_id;

      // 2. If not found, target workspace owner
      if (!recipientId && appt.workspace) {
        recipientId = appt.workspace.owner_id || appt.workspace.owner?.id;
      }

      // 3. Fallback to workspace recipient type (ChatController resolves to workspace owner)
      if (!recipientId && appt.workspace_id) {
        recipientType = "workspace";
        recipientId = appt.workspace_id;
      }

      const payload = {
        recipient_type: recipientType,
        recipient_id: recipientId,
        context_type: "appointment",
        context_id: appt.id,
      };

      const res = await client.post(endpoints.chats, payload);
      const conversation = res.data?.data;

      toast.success(
        isRTL ? "تم فتح المحادثة بنجاح" : "Chat started successfully",
      );
      navigate("/customer/profile?tab=chats", {
        state: {
          conversationId: conversation?.id,
          conversation: conversation,
        },
      });
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          (isRTL ? "فشل بدء المحادثة" : "Failed to start chat"),
      );
    } finally {
      setStartingChatId(null);
    }
  };

  const handleCancelAppointment = async (e) => {
    e.preventDefault();
    if (!cancelModalAppt) return;
    setCancelling(true);
    try {
      await client.post(
        `/customers/appointments/${cancelModalAppt.id}/cancel`,
        {
          cancellation_reason: cancelReason || undefined,
        },
      );
      toast.success(
        isRTL ? "تم إلغاء الموعد بنجاح" : "Appointment cancelled successfully",
      );
      setCancelModalAppt(null);
      setCancelReason("");
      if (selectedAppointment?.id === cancelModalAppt.id) {
        setSelectedAppointment(null);
      }
      fetchAppointments(page);
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          (isRTL ? "فشل إلغاء الموعد" : "Failed to cancel appointment"),
      );
    } finally {
      setCancelling(false);
    }
  };

  const handleRescheduleAppointment = async (e) => {
    e.preventDefault();
    if (!rescheduleModalAppt || !rescheduleDate || !rescheduleTime) {
      toast.error(
        isRTL
          ? "يرجى اختيار التاريخ والوقت الجديد"
          : "Please select a new date and time",
      );
      return;
    }
    setRescheduling(true);
    try {
      const startsAt = `${rescheduleDate}T${rescheduleTime}:00`;
      await client.post(
        `/customers/appointments/${rescheduleModalAppt.id}/reschedule`,
        {
          starts_at: startsAt,
          reason: rescheduleReason || undefined,
        },
      );
      toast.success(
        isRTL
          ? "تم إعادة جدولة الموعد بنجاح"
          : "Appointment rescheduled successfully",
      );
      setRescheduleModalAppt(null);
      setRescheduleDate("");
      setRescheduleTime("");
      setRescheduleReason("");
      if (selectedAppointment?.id === rescheduleModalAppt.id) {
        setSelectedAppointment(null);
      }
      fetchAppointments(page);
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          (isRTL
            ? "فشل إعادة جدولة الموعد"
            : "Failed to reschedule appointment"),
      );
    } finally {
      setRescheduling(false);
    }
  };

  const getMeetingUrl = (appt) => {
    if (!appt) return null;
    return (
      appt.google_meet_link ||
      appt.metadata?.google_meet_link ||
      appt.metadata?.meet_link ||
      appt.metadata?.meeting_url ||
      appt.meeting_link ||
      appt.google_meet_url ||
      (typeof appt.location === "string" && appt.location.includes("http")
        ? appt.location
        : null)
    );
  };

  const handleUploadPaymentProof = async (e) => {
    e.preventDefault();
    if (!proofModalAppt) return;

    const paymentId =
      proofModalAppt.payments?.[0]?.id ||
      proofModalAppt.payment?.id ||
      proofModalAppt.latest_payment?.id;
    if (!paymentId) {
      toast.error(
        isRTL
          ? "لم يتم العثور على سجل دفع لهذا الموعد"
          : "No payment record found for this appointment",
      );
      return;
    }

    setUploadingProof(true);
    try {
      const formData = new FormData();
      if (proofFile instanceof File) {
        formData.append("proof_file", proofFile);
      } else if (typeof proofFile === "string" && proofFile.trim()) {
        formData.append("proof_file", proofFile.trim());
      } else if (proofFilePreview) {
        formData.append("proof_file", proofFilePreview);
      } else {
        toast.error(
          isRTL
            ? "يرجى اختيار صورة إيصال السداد"
            : "Please select a receipt proof file",
        );
        setUploadingProof(false);
        return;
      }

      if (proofNotes.trim()) {
        formData.append("proof_notes", proofNotes.trim());
      }

      const res = await client.post(
        endpoints.customerPaymentProof(paymentId),
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );

      toast.success(
        res.data?.message ||
          (isRTL
            ? "تم إعادة إرفاق إيصال السداد بنجاح"
            : "Payment proof uploaded successfully"),
      );
      setProofModalAppt(null);
      setProofFile(null);
      setProofFilePreview("");
      setProofNotes("");

      if (selectedAppointment) {
        handleOpenDetails(selectedAppointment);
      }
      fetchAppointments(page);
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          (isRTL ? "فشل إرفاق إيصال السداد" : "Failed to upload payment proof"),
      );
    } finally {
      setUploadingProof(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "confirmed":
        return { label: isRTL ? "مؤكد" : "Confirmed", className: "verified" };
      case "pending":
        return {
          label: isRTL ? "قيد الانتظار" : "Pending",
          className: "pending",
        };
      case "completed":
        return { label: isRTL ? "مكتمل" : "Completed", className: "member" };
      case "cancelled":
        return {
          label: isRTL ? "ملغى" : "Cancelled",
          className: "unverified",
          style: {
            background: "#ef4444",
            color: "#ffffff",
            borderColor: "#dc2626",
            fontWeight: 700,
          },
        };
      default:
        return { label: status, className: "member" };
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return "—";
    const date = new Date(isoString);
    return date.toLocaleDateString(lang === "ar" ? "ar-SA" : "en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (isoString, timeFormat, timeZone) => {
    if (!isoString) return "—";
    const date = new Date(isoString);
    const options = {
      hour: "2-digit",
      minute: "2-digit",
      hour12: timeFormat !== "24h",
    };
    if (timeZone) {
      try {
        options.timeZone = timeZone;
      } catch {}
    }
    return date.toLocaleTimeString(lang === "ar" ? "ar-EG" : "en-US", options);
  };

  const formatFullTimestamp = (isoString, timeFormat, timeZone) => {
    if (!isoString) return "—";
    const date = new Date(isoString);
    const options = {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: timeFormat !== "24h",
    };
    if (timeZone) {
      try {
        options.timeZone = timeZone;
      } catch (e) {
        console.log(e);
      }
    }
    return date.toLocaleString(lang === "ar" ? "ar-EG" : "en-US", options);
  };

  const getPaymentReceiptUrl = (b) => {
    if (!b) return null;
    if (Array.isArray(b.payments)) {
      for (const p of b.payments) {
        if (p.payment_proof) return p.payment_proof;
        if (p.metadata?.payment_proof) return p.metadata.payment_proof;
        if (p.receipt_url) return p.receipt_url;
        if (p.proof_url) return p.proof_url;
        if (p.proof_image) return p.proof_image;
        if (p.receipt_file) return p.receipt_file;
        if (p.receipt) return p.receipt;
        if (p.metadata) {
          const meta = p.metadata;
          if (meta.receipt_url) return meta.receipt_url;
          if (meta.proof_url) return meta.proof_url;
          if (meta.proof_image) return meta.proof_image;
          if (meta.receipt_file) return meta.receipt_file;
          if (meta.receipt_path) return meta.receipt_path;
          if (meta.receipt) return meta.receipt;
          if (meta.file_url) return meta.file_url;
          if (meta.image_url) return meta.image_url;
          if (meta.upload_receipt) return meta.upload_receipt;
        }
      }
    }
    if (b.metadata) {
      const meta = b.metadata;
      if (meta.payment_proof) return meta.payment_proof;
      if (meta.receipt_url) return meta.receipt_url;
      if (meta.proof_url) return meta.proof_url;
      if (meta.proof_image) return meta.proof_image;
      if (meta.receipt_file) return meta.receipt_file;
      if (meta.receipt_path) return meta.receipt_path;
      if (meta.receipt) return meta.receipt;
      if (meta.file_url) return meta.file_url;
      if (meta.image_url) return meta.image_url;
      if (meta.upload_receipt) return meta.upload_receipt;
      if (meta.payment_receipt) return meta.payment_receipt;
    }
    if (Array.isArray(b.answers)) {
      for (const ans of b.answers) {
        const text = String(ans.answer_text || ans.answer || "").trim();
        const label = String(
          ans.question_label || ans.question?.label || "",
        ).toLowerCase();
        const isReceiptQuestion =
          label.includes("إيصال") ||
          label.includes("receipt") ||
          label.includes("تحويل") ||
          label.includes("دفع") ||
          label.includes("صورة") ||
          label.includes("proof") ||
          label.includes("سداد");
        if (isReceiptQuestion && text) return text;
        if (
          text.startsWith("http") ||
          text.startsWith("/") ||
          text.startsWith("data:image") ||
          text.match(/\.(jpeg|jpg|gif|png|webp|pdf)$/i)
        )
          return text;
      }
    }
    return null;
  };

  const handleCopySummary = (b) => {
    if (!b) return;
    const service = b.snapshot?.service_name || b.service?.name || "Service";
    const workspaceName = b.workspace?.name || "Workspace";
    const when = `${formatDate(b.starts_at)} ${formatTime(b.starts_at)}`;
    const summary = `Appointment #${b.id}\nWorkspace: ${workspaceName}\nService: ${service}\nTime: ${when}\nStatus: ${b.status}`;

    navigator.clipboard.writeText(summary);
    toast.success(
      isRTL ? "تم نسخ ملخص الموعد بنجاح!" : "Summary copied to clipboard!",
    );
  };

  return (
    <div className="card animate-fade-in-up">
      <SEO title={t("myAppointments") || "مواعيدي"} noindex />

      {/* Header */}
      <div
        className="card-header"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <h2
            className="card-title"
            style={{ display: "flex", alignItems: "center", gap: 8 }}
          >
            <Icon
              name="calendar"
              size={20}
              style={{ color: "var(--primary)" }}
            />
            {t("myAppointments") || "مواعيدي"}
          </h2>
          <p className="card-subtitle">
            {t("myAppointmentsDesc") ||
              "استعراض وتتبع مواعيدك والتواصل المباشر مع مساحات العمل."}
          </p>
        </div>

        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => fetchAppointments(page)}
          style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
        >
          <Icon name="rotate-cw" size={14} />
          {isRTL ? "تحديث" : "Refresh"}
        </button>
      </div>

      {/* Filter Toolbar */}
      <div
        className="card-body"
        style={{
          borderBottom: "1px solid var(--border-light)",
          paddingBottom: 16,
        }}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 12,
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Timeframe Pills */}
          <div
            style={{
              display: "flex",
              gap: 6,
              background: "var(--surface-alt)",
              padding: 4,
              borderRadius: 10,
            }}
          >
            {[
              { key: "all", label: isRTL ? "الكل" : "All" },
              { key: "upcoming", label: isRTL ? "القادمة" : "Upcoming" },
              { key: "past", label: isRTL ? "السابقة" : "Past" },
            ].map((tf) => (
              <button
                key={tf.key}
                type="button"
                className={`btn btn-sm ${timeframe === tf.key ? "btn-primary" : "btn-ghost"}`}
                onClick={() => {
                  setTimeframe(tf.key);
                  setPage(1);
                }}
                style={{
                  borderRadius: 8,
                  padding: "6px 14px",
                  fontSize: "0.85rem",
                }}
              >
                {tf.label}
              </button>
            ))}
          </div>

          {/* Status & Search */}
          <div
            style={{
              display: "flex",
              gap: 10,
              flex: 1,
              maxWidth: 450,
              minWidth: 260,
            }}
          >
            <select
              className="form-select"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              style={{ width: 140, padding: "6px 10px", fontSize: "0.85rem" }}
            >
              <option value="">
                {isRTL ? "جميع الحالات" : "All Statuses"}
              </option>
              <option value="confirmed">{isRTL ? "مؤكد" : "Confirmed"}</option>
              <option value="pending">
                {isRTL ? "قيد الانتظار" : "Pending"}
              </option>
              <option value="completed">{isRTL ? "مكتمل" : "Completed"}</option>
              <option value="cancelled">{isRTL ? "ملغى" : "Cancelled"}</option>
            </select>

            <div style={{ position: "relative", flex: 1 }}>
              <input
                type="text"
                className="form-input"
                placeholder={
                  isRTL
                    ? "بحث باسم الخدمة أو مساحة العمل..."
                    : "Search service or workspace..."
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  paddingLeft: isRTL ? 12 : 34,
                  paddingRight: isRTL ? 34 : 12,
                  height: 38,
                  fontSize: "0.85rem",
                }}
              />
              <span
                style={{
                  position: "absolute",
                  [isRTL ? "right" : "left"]: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  opacity: 0.5,
                }}
              >
                <Icon name="search" size={14} />
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Appointments List */}
      <div className="card-body">
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <SkeletonRect height={80} />
            <SkeletonRect height={80} />
            <SkeletonRect height={80} />
          </div>
        ) : appointments.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "40px 20px",
              color: "var(--text-secondary)",
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                background: "var(--primary-subtle)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
                color: "var(--primary)",
                border: "1px solid rgba(17, 100, 106, 0.2)",
              }}
            >
              <Icon name="calendar" size={28} />
            </div>
            <h3
              style={{
                fontSize: "1.05rem",
                fontWeight: 700,
                color: "var(--heading)",
                marginBottom: 6,
              }}
            >
              {t("noCustomerAppointments") || "لا توجد لديك مواعيد حالياً"}
            </h3>
            <p
              style={{
                fontSize: "0.88rem",
                maxWidth: 420,
                margin: "0 auto 20px",
              }}
            >
              {t("noCustomerAppointmentsDesc") ||
                "استكشف مساحات العمل المتاحة واحجز موعدك بسهولة."}
            </p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => navigate("/workspaces")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 20px",
              }}
            >
              <Icon name="search" size={16} />
              {isRTL ? "استكشاف مساحات العمل" : "Explore Workspaces"}
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {appointments.map((appt) => {
              const badge = getStatusBadge(appt.status);
              const isStarting = startingChatId === appt.id;
              const wsSlugOrId =
                appt.workspace?.slug || appt.workspace?.id || appt.workspace_id;

              return (
                <div
                  key={appt.id}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    padding: 16,
                    borderRadius: 14,
                    border: "1px solid var(--border-light)",
                    background: "var(--surface)",
                    transition: "all 0.2s ease",
                    gap: 12,
                  }}
                  className="hover-card-elevate"
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      flexWrap: "wrap",
                      gap: 10,
                    }}
                  >
                    {/* Workspace & Service Title */}
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 12 }}
                    >
                      {wsSlugOrId ? (
                        <Link
                          to={`/workspaces/${wsSlugOrId}`}
                          title={
                            appt.workspace?.name ||
                            (isRTL ? "عرض مساحة العمل" : "View Workspace")
                          }
                          style={{
                            textDecoration: "none",
                            color: "inherit",
                            display: "flex",
                            alignItems: "center",
                          }}
                        >
                          <UserAvatar
                            name={
                              appt.workspace?.name ||
                              appt.snapshot?.service_name ||
                              "WS"
                            }
                            avatarUrl={appt.workspace?.logo_url}
                            size={46}
                          />
                        </Link>
                      ) : (
                        <UserAvatar
                          name={
                            appt.workspace?.name ||
                            appt.snapshot?.service_name ||
                            "WS"
                          }
                          avatarUrl={appt.workspace?.logo_url}
                          size={46}
                        />
                      )}
                      <div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          <h4
                            style={{
                              margin: 0,
                              fontSize: "0.98rem",
                              fontWeight: 700,
                              color: "var(--heading)",
                            }}
                          >
                            {appt.snapshot?.service_name ||
                              appt.service?.name ||
                              (isRTL ? "خدمة حجز" : "Booking Service")}
                          </h4>
                          {appt.follow_up_to_id && (
                            <span
                              style={{
                                padding: "2px 6px",
                                fontSize: "0.7rem",
                                background: "rgba(59, 130, 246, 0.1)",
                                color: "#2563eb",
                                borderRadius: 10,
                                fontWeight: 700,
                              }}
                            >
                              {isRTL ? "متابعة" : "Follow-up"}
                            </span>
                          )}
                        </div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            marginTop: 3,
                            fontSize: "0.85rem",
                            color: "var(--text-secondary)",
                          }}
                        >
                          <Icon name="briefcase" size={12} />
                          {wsSlugOrId ? (
                            <Link
                              to={`/workspaces/${wsSlugOrId}`}
                              style={{
                                fontWeight: 600,
                                color: "var(--primary)",
                                textDecoration: "none",
                              }}
                              className="hover-underline"
                            >
                              {appt.workspace?.name ||
                                (isRTL ? "مساحة العمل" : "Workspace")}
                            </Link>
                          ) : (
                            <span style={{ fontWeight: 600 }}>
                              {appt.workspace?.name ||
                                (isRTL ? "مساحة العمل" : "Workspace")}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <span
                      className={`profile-badge ${badge.className}`}
                      style={badge.style}
                    >
                      {badge.label}
                    </span>
                  </div>

                  <hr
                    style={{
                      border: "none",
                      borderTop: "1px solid var(--border-light)",
                      margin: "2px 0",
                    }}
                  />

                  {/* Appointment Details Row */}
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 16,
                      fontSize: "0.85rem",
                      color: "var(--text-secondary)",
                    }}
                  >
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 6 }}
                    >
                      <Icon
                        name="calendar"
                        size={14}
                        style={{ color: "var(--primary)" }}
                      />
                      <span>{formatDate(appt.starts_at)}</span>
                    </div>

                    <div
                      style={{ display: "flex", alignItems: "center", gap: 6 }}
                    >
                      <Icon
                        name="clock"
                        size={14}
                        style={{ color: "var(--primary)" }}
                      />
                      <span>
                        {formatTime(
                          appt.starts_at,
                          appt.time_format,
                          appt.timezone,
                        )}{" "}
                        -{" "}
                        {formatTime(
                          appt.ends_at,
                          appt.time_format,
                          appt.timezone,
                        )}
                      </span>
                    </div>

                    {appt.snapshot?.price !== undefined && (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          fontWeight: 600,
                          color: "var(--heading)",
                        }}
                      >
                        <Icon
                          name="dollar-sign"
                          size={14}
                          style={{ color: "var(--primary)" }}
                        />
                        <span>
                          {appt.snapshot.price}{" "}
                          {appt.snapshot.currency || "SAR"}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "flex-end",
                      alignItems: "center",
                      gap: 8,
                      marginTop: 4,
                      flexWrap: "wrap",
                    }}
                  >
                    {/* Chat with Workspace Button */}
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      disabled={isStarting}
                      onClick={(e) => handleStartChatWithWorkspace(appt, e)}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "7px 14px",
                        borderRadius: 8,
                      }}
                    >
                      {isStarting ? (
                        <span
                          className="spinner spinner-sm"
                          style={{ borderTopColor: "#fff" }}
                        />
                      ) : (
                        <Icon name="message-square" size={14} />
                      )}
                      <span>
                        {t("chatWithWorkspace") || "مراسلة مساحة العمل"}
                      </span>
                    </button>

                    {/* View Details Button */}
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleOpenDetails(appt)}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "7px 14px",
                        borderRadius: 8,
                      }}
                    >
                      <Icon name="eye" size={14} />
                      <span>{isRTL ? "التفاصيل الكاملة" : "Full Details"}</span>
                    </button>

                    {/* Reschedule Button if active */}
                    {(appt.status === "pending" ||
                      appt.status === "confirmed") && (
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => {
                          setRescheduleModalAppt(appt);
                          const d = appt.starts_at
                            ? new Date(appt.starts_at)
                            : new Date();
                          setRescheduleDate(d.toISOString().split("T")[0]);
                          setRescheduleTime(d.toTimeString().slice(0, 5));
                          setRescheduleReason("");
                        }}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "7px 14px",
                          borderRadius: 8,
                        }}
                      >
                        <Icon name="calendar" size={14} />
                        <span>{isRTL ? "إعادة جدولة" : "Reschedule"}</span>
                      </button>
                    )}

                    {/* Cancel Button if active */}
                    {(appt.status === "pending" ||
                      appt.status === "confirmed") && (
                      <button
                        type="button"
                        className="btn btn-danger-subtle btn-sm"
                        onClick={() => {
                          setCancelModalAppt(appt);
                          setCancelReason("");
                        }}
                      >
                        {isRTL ? "إلغاء الموعد" : "Cancel"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Controls */}
        {meta && meta.last_page > 1 && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: 8,
              marginTop: 20,
            }}
          >
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
            >
              {isRTL ? "السابق" : "Previous"}
            </button>
            <span
              style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}
            >
              {page} / {meta.last_page}
            </span>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={page >= meta.last_page}
              onClick={() => setPage((p) => Math.min(p + 1, meta.last_page))}
            >
              {isRTL ? "التالي" : "Next"}
            </button>
          </div>
        )}
      </div>

      {/* Lightbox Overlay for Image Attachments */}
      {lightboxImage &&
        createPortal(
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 1000000,
              background: "rgba(0, 0, 0, 0.85)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 20,
              backdropFilter: "blur(8px)",
            }}
            onClick={() => setLightboxImage(null)}
          >
            <div
              style={{
                position: "relative",
                maxWidth: "90vw",
                maxHeight: "90vh",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setLightboxImage(null)}
                style={{
                  position: "absolute",
                  top: -14,
                  right: -14,
                  background: "#ef4444",
                  color: "#fff",
                  border: "none",
                  borderRadius: "50%",
                  width: 32,
                  height: 32,
                  cursor: "pointer",
                  fontWeight: 800,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                }}
              >
                ✕
              </button>
              <img
                src={lightboxImage}
                alt="Attachment Proof"
                style={{
                  maxWidth: "100%",
                  maxHeight: "85vh",
                  borderRadius: 12,
                  objectFit: "contain",
                }}
              />
            </div>
          </div>,
          document.body,
        )}

      {/* Full Appointment Details Modal */}
      {selectedAppointment &&
        createPortal(
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: "100vw",
              height: "100vh",
              zIndex: 999999,
              background: "rgba(0, 0, 0, 0.65)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 16,
              backdropFilter: "blur(6px)",
            }}
            onClick={() => setSelectedAppointment(null)}
          >
            <div
              style={{
                background: "var(--surface)",
                borderRadius: 18,
                width: "100%",
                maxWidth: 720,
                maxHeight: "92vh",
                overflowY: "auto",
                border: "1px solid var(--border-light)",
                boxShadow: "0 25px 50px rgba(0,0,0,0.3)",
                padding: 24,
              }}
              onClick={(e) => e.stopPropagation()}
              className="animate-fade-in-up"
            >
              {/* Modal Header */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 16,
                  paddingBottom: 14,
                  borderBottom: "1px solid var(--border-light)",
                }}
              >
                <div>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 10 }}
                  >
                    <h3
                      style={{
                        margin: 0,
                        fontSize: "1.2rem",
                        fontWeight: 800,
                        color: "var(--heading)",
                      }}
                    >
                      {t("appointmentDetails") || "تفاصيل الموعد الحجز"} #
                      {selectedAppointment.id}
                    </h3>
                    <span
                      className={`profile-badge ${getStatusBadge(selectedAppointment.status).className}`}
                      style={getStatusBadge(selectedAppointment.status).style}
                    >
                      {getStatusBadge(selectedAppointment.status).label}
                    </span>
                  </div>
                  <p
                    style={{
                      margin: "3px 0 0",
                      fontSize: "0.82rem",
                      color: "var(--text-secondary)",
                    }}
                  >
                    {selectedAppointment.created_at
                      ? `${isRTL ? "تم إنشاء الحجز بتاريخ:" : "Booked on:"} ${formatFullTimestamp(selectedAppointment.created_at)}`
                      : ""}
                  </p>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleCopySummary(selectedAppointment)}
                    title={isRTL ? "نسخ ملخص الموعد" : "Copy Summary"}
                    style={{
                      padding: "6px 12px",
                      fontSize: "0.8rem",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <Icon name="copy" size={13} />
                    <span>{isRTL ? "نسخ الملخص" : "Copy"}</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => setSelectedAppointment(null)}
                    style={{ padding: 6 }}
                  >
                    <Icon name="x" size={18} />
                  </button>
                </div>
              </div>

              {loadingDetails ? (
                <div style={{ padding: "20px 0" }}>
                  <SkeletonRect height={160} radius="12px" />
                </div>
              ) : (
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 18 }}
                >
                  {/* Meeting Link Banner if available */}
                  {getMeetingUrl(selectedAppointment) && (
                    <div
                      style={{
                        padding: "14px 18px",
                        borderRadius: 12,
                        background: "rgba(59, 130, 246, 0.08)",
                        border: "1px solid rgba(59, 130, 246, 0.25)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: 12,
                      }}
                    >
                      <div>
                        <strong
                          style={{
                            fontSize: "0.88rem",
                            color: "#2563eb",
                            display: "block",
                            marginBottom: 2,
                          }}
                        >
                          🌐{" "}
                          {isRTL
                            ? "رابط الموعد / الاجتماع عبر الإنترنت:"
                            : "Online Meeting Link:"}
                        </strong>
                        <span
                          style={{
                            fontSize: "0.85rem",
                            color: "var(--heading)",
                            wordBreak: "normal",
                            overflowWrap: "break-word",
                          }}
                        >
                          {getMeetingUrl(selectedAppointment)}
                        </span>
                      </div>
                      {(getMeetingUrl(selectedAppointment).startsWith(
                        "http://",
                      ) ||
                        getMeetingUrl(selectedAppointment).startsWith(
                          "https://",
                        )) && (
                        <a
                          href={getMeetingUrl(selectedAppointment)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-primary btn-sm"
                          style={{
                            fontSize: "0.84rem",
                            padding: "8px 16px",
                            fontWeight: 700,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          <Icon name="link" size={14} />
                          {isRTL ? "الانضمام للاجتماع" : "Join Meeting"}
                        </a>
                      )}
                    </div>
                  )}

                  {/* Workspace Details Card */}
                  {(() => {
                    const modalWsSlugOrId =
                      selectedAppointment.workspace?.slug ||
                      selectedAppointment.workspace?.id ||
                      selectedAppointment.workspace_id;
                    return (
                      <div
                        style={{
                          padding: 16,
                          borderRadius: 14,
                          border: "1px solid var(--border-light)",
                          background: "var(--surface-alt)",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            marginBottom: 12,
                          }}
                        >
                          <Icon
                            name="briefcase"
                            size={16}
                            style={{ color: "var(--primary)" }}
                          />
                          <h4
                            style={{
                              margin: 0,
                              fontSize: "0.9rem",
                              fontWeight: 800,
                              textTransform: "uppercase",
                              color: "var(--heading)",
                            }}
                          >
                            {isRTL ? "معلومات مساحة العمل" : "Workspace Info"}
                          </h4>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 14,
                          }}
                        >
                          {modalWsSlugOrId ? (
                            <Link
                              to={`/workspaces/${modalWsSlugOrId}`}
                              title={selectedAppointment.workspace?.name}
                              style={{
                                textDecoration: "none",
                                color: "inherit",
                                display: "flex",
                                alignItems: "center",
                              }}
                            >
                              <UserAvatar
                                name={
                                  selectedAppointment.workspace?.name || "WS"
                                }
                                avatarUrl={
                                  selectedAppointment.workspace?.logo_url
                                }
                                size={52}
                              />
                            </Link>
                          ) : (
                            <UserAvatar
                              name={selectedAppointment.workspace?.name || "WS"}
                              avatarUrl={
                                selectedAppointment.workspace?.logo_url
                              }
                              size={52}
                            />
                          )}
                          <div style={{ flex: 1 }}>
                            <h5
                              style={{
                                margin: 0,
                                fontSize: "1.05rem",
                                fontWeight: 800,
                                color: "var(--heading)",
                              }}
                            >
                              {modalWsSlugOrId ? (
                                <Link
                                  to={`/workspaces/${modalWsSlugOrId}`}
                                  style={{
                                    color: "var(--primary)",
                                    textDecoration: "none",
                                  }}
                                  className="hover-underline"
                                >
                                  {selectedAppointment.workspace?.name || "—"}
                                </Link>
                              ) : (
                                selectedAppointment.workspace?.name || "—"
                              )}
                            </h5>
                            {selectedAppointment.workspace?.description && (
                              <p
                                style={{
                                  margin: "3px 0 6px",
                                  fontSize: "0.84rem",
                                  color: "var(--text-secondary)",
                                }}
                              >
                                {selectedAppointment.workspace.description}
                              </p>
                            )}
                            <div
                              style={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: 12,
                                fontSize: "0.82rem",
                                color: "var(--text-secondary)",
                              }}
                            >
                              {selectedAppointment.workspace?.phone && (
                                <span>
                                  📞 {selectedAppointment.workspace.phone}
                                </span>
                              )}
                              {selectedAppointment.workspace?.email && (
                                <span>
                                  ✉️ {selectedAppointment.workspace.email}
                                </span>
                              )}
                              {selectedAppointment.workspace?.address && (
                                <span>
                                  📍 {selectedAppointment.workspace.address}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Grid: Service Details & Date / Time */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(280px, 1fr))",
                      gap: 14,
                    }}
                  >
                    {/* Service Card */}
                    <div
                      style={{
                        padding: 14,
                        borderRadius: 12,
                        border: "1px solid var(--border-light)",
                        background: "var(--surface)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          marginBottom: 10,
                        }}
                      >
                        <Icon
                          name="tag"
                          size={15}
                          style={{ color: "var(--primary)" }}
                        />
                        <span
                          style={{
                            fontSize: "0.82rem",
                            fontWeight: 700,
                            color: "var(--text-secondary)",
                            textTransform: "uppercase",
                          }}
                        >
                          {isRTL ? "تفاصيل الخدمة" : "Service Info"}
                        </span>
                      </div>
                      <span
                        style={{
                          fontSize: "1.05rem",
                          fontWeight: 800,
                          color: "var(--heading)",
                          display: "block",
                          marginBottom: 6,
                        }}
                      >
                        {selectedAppointment.snapshot?.service_name ||
                          selectedAppointment.service?.name ||
                          "—"}
                      </span>
                      <div
                        style={{
                          fontSize: "0.86rem",
                          color: "var(--text-secondary)",
                          display: "flex",
                          gap: 14,
                          background: "var(--surface-alt)",
                          padding: "8px 12px",
                          borderRadius: 8,
                        }}
                      >
                        <span>
                          ⏱{" "}
                          {selectedAppointment.snapshot?.duration_minutes ||
                            selectedAppointment.service?.duration_minutes ||
                            30}{" "}
                          {isRTL ? "دقيقة" : "mins"}
                        </span>
                        <span
                          style={{ fontWeight: 700, color: "var(--heading)" }}
                        >
                          {selectedAppointment.snapshot?.price ||
                            selectedAppointment.service?.price ||
                            0}{" "}
                          {selectedAppointment.snapshot?.currency || "SAR"}
                        </span>
                      </div>
                    </div>

                    {/* Date & Time Card */}
                    <div
                      style={{
                        padding: 14,
                        borderRadius: 12,
                        border: "1px solid var(--border-light)",
                        background: "var(--surface)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          marginBottom: 10,
                        }}
                      >
                        <Icon
                          name="calendar"
                          size={15}
                          style={{ color: "var(--primary)" }}
                        />
                        <span
                          style={{
                            fontSize: "0.82rem",
                            fontWeight: 700,
                            color: "var(--text-secondary)",
                            textTransform: "uppercase",
                          }}
                        >
                          {isRTL
                            ? "تاريخ ووقت الموعد"
                            : "Scheduled Date & Time"}
                        </span>
                      </div>
                      <span
                        style={{
                          fontSize: "1.02rem",
                          fontWeight: 800,
                          color: "var(--heading)",
                          display: "block",
                          marginBottom: 4,
                        }}
                      >
                        {formatDate(selectedAppointment.starts_at)}
                      </span>
                      <span
                        style={{
                          fontSize: "0.88rem",
                          color: "var(--primary)",
                          fontWeight: 700,
                          display: "block",
                        }}
                      >
                        {formatTime(
                          selectedAppointment.starts_at,
                          selectedAppointment.time_format,
                          selectedAppointment.timezone,
                        )}{" "}
                        -{" "}
                        {formatTime(
                          selectedAppointment.ends_at,
                          selectedAppointment.time_format,
                          selectedAppointment.timezone,
                        )}
                      </span>
                      {selectedAppointment.timezone && (
                        <span
                          style={{
                            fontSize: "0.78rem",
                            color: "var(--text-secondary)",
                            display: "block",
                            marginTop: 4,
                          }}
                        >
                          {isRTL
                            ? "المنطقة الزمنية المحسوبة:"
                            : "Calculated Timezone:"}{" "}
                          {selectedAppointment.timezone}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Assigned Member / Provider if available */}
                  {selectedAppointment.workspace_member && (
                    <div
                      style={{
                        padding: 14,
                        borderRadius: 12,
                        border: "1px solid var(--border-light)",
                        background: "var(--surface)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          marginBottom: 8,
                        }}
                      >
                        <Icon
                          name="user-check"
                          size={15}
                          style={{ color: "var(--primary)" }}
                        />
                        <span
                          style={{
                            fontSize: "0.82rem",
                            fontWeight: 700,
                            color: "var(--text-secondary)",
                            textTransform: "uppercase",
                          }}
                        >
                          {isRTL
                            ? "مقدم الخدمة المعين"
                            : "Assigned Staff / Provider"}
                        </span>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                        }}
                      >
                        <UserAvatar
                          name={selectedAppointment.workspace_member.name}
                          avatarUrl={
                            selectedAppointment.workspace_member.avatar_url
                          }
                          size={38}
                        />
                        <div>
                          <span
                            style={{
                              fontWeight: 800,
                              color: "var(--heading)",
                              fontSize: "0.95rem",
                              display: "block",
                            }}
                          >
                            {selectedAppointment.workspace_member.name}
                          </span>
                          {selectedAppointment.workspace_member.title && (
                            <span
                              style={{
                                fontSize: "0.8rem",
                                color: "var(--text-secondary)",
                              }}
                            >
                              {selectedAppointment.workspace_member.title}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Customer Information Card */}
                  <div
                    style={{
                      padding: 14,
                      borderRadius: 12,
                      border: "1px solid var(--border-light)",
                      background: "var(--surface-alt)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        marginBottom: 10,
                      }}
                    >
                      <Icon
                        name="user"
                        size={15}
                        style={{ color: "var(--primary)" }}
                      />
                      <h4
                        style={{
                          margin: 0,
                          fontSize: "0.85rem",
                          fontWeight: 800,
                          textTransform: "uppercase",
                          color: "var(--text-secondary)",
                        }}
                      >
                        {isRTL
                          ? "بيانات الحجز المسجلة"
                          : "Customer Booking Info"}
                      </h4>
                    </div>
                    <DetailRow
                      label={isRTL ? "الاسم" : "Name"}
                      value={selectedAppointment.snapshot?.customer_name || "—"}
                    />
                    <DetailRow
                      label={isRTL ? "البريد الإلكتروني" : "Email"}
                      value={
                        selectedAppointment.snapshot?.customer_email || "—"
                      }
                    />
                    <DetailRow
                      label={isRTL ? "رقم الهاتف" : "Phone"}
                      value={
                        selectedAppointment.snapshot?.customer_phone || "—"
                      }
                    />
                  </div>

                  {/* Customer Notes & Special Requests */}
                  {selectedAppointment.notes && (
                    <div
                      style={{
                        padding: 14,
                        borderRadius: 12,
                        background: "rgba(234, 179, 8, 0.08)",
                        border: "1px solid rgba(234, 179, 8, 0.25)",
                      }}
                    >
                      <strong
                        style={{
                          fontSize: "0.85rem",
                          color: "#b45309",
                          display: "block",
                          marginBottom: 4,
                        }}
                      >
                        📝{" "}
                        {isRTL
                          ? "ملاحظات العميل / الطلبات الخاصة:"
                          : "Customer Notes & Special Requests:"}
                      </strong>
                      <p
                        style={{
                          margin: 0,
                          fontSize: "0.9rem",
                          color: "var(--text)",
                          whiteSpace: "pre-wrap",
                        }}
                      >
                        {selectedAppointment.notes}
                      </p>
                    </div>
                  )}

                  {/* Booking Question Answers */}
                  {Array.isArray(selectedAppointment.answers) &&
                    selectedAppointment.answers.length > 0 && (
                      <div
                        style={{
                          padding: 14,
                          borderRadius: 12,
                          border: "1px solid var(--border-light)",
                          background: "var(--surface)",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            marginBottom: 10,
                          }}
                        >
                          <Icon
                            name="help-circle"
                            size={15}
                            style={{ color: "var(--primary)" }}
                          />
                          <h4
                            style={{
                              margin: 0,
                              fontSize: "0.85rem",
                              fontWeight: 800,
                              textTransform: "uppercase",
                              color: "var(--text-secondary)",
                            }}
                          >
                            {isRTL
                              ? "إجابات أسئلة نموذج الحجز"
                              : "Booking Question Answers"}
                          </h4>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 10,
                          }}
                        >
                          {selectedAppointment.answers.map((ans, idx) => (
                            <div
                              key={idx}
                              style={{
                                background: "var(--surface-alt)",
                                padding: "10px 14px",
                                borderRadius: 8,
                                border: "1px solid var(--border-light)",
                              }}
                            >
                              <strong
                                style={{
                                  color: "var(--heading)",
                                  display: "block",
                                  fontSize: "0.85rem",
                                  marginBottom: 3,
                                }}
                              >
                                {ans.question_label || `سؤال ${idx + 1}`}:
                              </strong>
                              <span
                                style={{
                                  color: "var(--text-secondary)",
                                  fontSize: "0.88rem",
                                  whiteSpace: "pre-wrap",
                                }}
                              >
                                {ans.answer || "-"}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* Payment Information & Attached Receipt Image */}
                  <div
                    style={{
                      padding: 16,
                      borderRadius: 14,
                      border: "1px solid var(--border-light)",
                      background: "var(--surface)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 12,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <Icon
                          name="credit-card"
                          size={16}
                          style={{ color: "var(--primary)" }}
                        />
                        <h4
                          style={{
                            margin: 0,
                            fontSize: "0.88rem",
                            fontWeight: 800,
                            textTransform: "uppercase",
                            color: "var(--heading)",
                          }}
                        >
                          {isRTL
                            ? "حالة الدفع وإيصال السداد"
                            : "Payment & Receipt Information"}
                        </h4>
                      </div>
                      {selectedAppointment.payments &&
                      selectedAppointment.payments.length > 0 ? (
                        <span
                          className="profile-badge verified"
                          style={{ padding: "4px 10px", fontSize: "0.78rem" }}
                        >
                          {isRTL ? "مسجّل بالنظام" : "Recorded"}
                        </span>
                      ) : (
                        <span
                          className="profile-badge unverified"
                          style={{ padding: "4px 10px", fontSize: "0.78rem" }}
                        >
                          {isRTL ? "تحويل / سداد مباشر" : "Direct Payment"}
                        </span>
                      )}
                    </div>

                    <div
                      style={{
                        background: "var(--surface-alt)",
                        padding: 12,
                        borderRadius: 10,
                        marginBottom: 12,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <span
                          style={{
                            fontSize: "0.78rem",
                            color: "var(--text-secondary)",
                            display: "block",
                          }}
                        >
                          {isRTL ? "المبلغ الإجمالي" : "Total Amount"}
                        </span>
                        <strong
                          style={{
                            fontSize: "1.2rem",
                            color: "var(--heading)",
                          }}
                        >
                          {selectedAppointment.snapshot?.price ||
                            selectedAppointment.service?.price ||
                            0}{" "}
                          {selectedAppointment.snapshot?.currency || "SAR"}
                        </strong>
                      </div>
                      <div
                        style={{
                          textAlign: isRTL ? "left" : "right",
                          fontSize: "0.84rem",
                          color: "var(--text-secondary)",
                        }}
                      >
                        <span>{isRTL ? "طريقة السداد:" : "Method:"} </span>
                        <strong>
                          {selectedAppointment.payments?.[0]?.method ||
                            (isRTL ? "تحويل بنكي / إيصال" : "Bank Transfer")}
                        </strong>
                      </div>
                    </div>

                    {/* Attached Payment Receipt Image */}
                    {getPaymentReceiptUrl(selectedAppointment) ? (
                      <div
                        style={{
                          border: "1px solid var(--border-light)",
                          borderRadius: 10,
                          overflow: "hidden",
                          background: "#0f172a",
                        }}
                      >
                        <div
                          style={{
                            padding: "8px 12px",
                            background: "rgba(255,255,255,0.05)",
                            color: "#fff",
                            fontSize: "0.8rem",
                            fontWeight: 700,
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <span>
                            📷{" "}
                            {isRTL
                              ? "صورة إيصال السداد المرفقة"
                              : "Attached Payment Receipt"}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setLightboxImage(
                                getPaymentReceiptUrl(selectedAppointment),
                              )
                            }
                            style={{
                              background: "transparent",
                              border: "none",
                              color: "#38bdf8",
                              cursor: "pointer",
                              fontWeight: 700,
                              fontSize: "0.8rem",
                            }}
                          >
                            {isRTL ? "تكبير الصورة" : "Enlarge"}
                          </button>
                        </div>
                        <div
                          style={{
                            padding: 12,
                            textAlign: "center",
                            maxHeight: 220,
                            overflow: "hidden",
                            cursor: "pointer",
                          }}
                          onClick={() =>
                            setLightboxImage(
                              getPaymentReceiptUrl(selectedAppointment),
                            )
                          }
                        >
                          <img
                            src={getPaymentReceiptUrl(selectedAppointment)}
                            alt="Receipt Proof"
                            style={{
                              maxWidth: "100%",
                              maxHeight: 200,
                              objectFit: "contain",
                              borderRadius: 6,
                            }}
                          />
                        </div>
                      </div>
                    ) : (
                      <div
                        style={{
                          padding: 12,
                          background: "var(--surface-alt)",
                          borderRadius: 8,
                          border: "1px dashed var(--border-light)",
                          textAlign: "center",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "0.82rem",
                            color: "var(--text-secondary)",
                          }}
                        >
                          {isRTL
                            ? "لم يتم إرفاق صورة إيصال سداد مع هذا الموعد"
                            : "No receipt image attached with this booking"}
                        </span>
                      </div>
                    )}

                    <div
                      style={{
                        marginTop: 12,
                        display: "flex",
                        justifyContent: "flex-end",
                      }}
                    >
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => {
                          setProofModalAppt(selectedAppointment);
                          setProofFilePreview(
                            getPaymentReceiptUrl(selectedAppointment) || "",
                          );
                        }}
                        style={{ gap: 6, fontSize: "0.82rem" }}
                      >
                        <Icon name="upload-cloud" size={14} />
                        {isRTL
                          ? "إعادة إرفاق / رفع إيصال الدفع"
                          : "Reupload Payment Proof"}
                      </button>
                    </div>
                  </div>

                  {/* Cancellation Reason if cancelled */}
                  {selectedAppointment.cancellation_reason && (
                    <div className="cancellation-reason-box">
                      <span className="cancellation-reason-title">
                        <Icon
                          name="x-circle"
                          size={15}
                          style={{ marginInlineEnd: 6 }}
                        />
                        {isRTL ? "سبب إلغاء الموعد:" : "Cancellation Reason:"}
                      </span>
                      <span className="cancellation-reason-text">
                        {selectedAppointment.cancellation_reason}
                      </span>
                    </div>
                  )}

                  {/* Timestamps & Audit Log */}
                  <div
                    style={{
                      padding: 14,
                      borderRadius: 12,
                      background: "var(--surface-alt)",
                      border: "1px solid var(--border-light)",
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(180px, 1fr))",
                      gap: 10,
                      fontSize: "0.8rem",
                      color: "var(--text-secondary)",
                    }}
                  >
                    <div>
                      <strong
                        style={{ color: "var(--heading)", display: "block" }}
                      >
                        {isRTL ? "تاريخ إنشاء الموعد:" : "Created At:"}
                      </strong>
                      {formatFullTimestamp(selectedAppointment.created_at)}
                    </div>
                    {selectedAppointment.confirmed_at && (
                      <div>
                        <strong
                          style={{ color: "var(--heading)", display: "block" }}
                        >
                          {isRTL ? "تاريخ التأكيد:" : "Confirmed At:"}
                        </strong>
                        {formatFullTimestamp(selectedAppointment.confirmed_at)}
                      </div>
                    )}
                    {selectedAppointment.completed_at && (
                      <div>
                        <strong
                          style={{ color: "var(--heading)", display: "block" }}
                        >
                          {isRTL ? "تاريخ الإكمال:" : "Completed At:"}
                        </strong>
                        {formatFullTimestamp(selectedAppointment.completed_at)}
                      </div>
                    )}
                    {selectedAppointment.cancelled_at && (
                      <div>
                        <strong
                          style={{ color: "var(--heading)", display: "block" }}
                        >
                          {isRTL ? "تاريخ الإلغاء:" : "Cancelled At:"}
                        </strong>
                        {formatFullTimestamp(selectedAppointment.cancelled_at)}
                      </div>
                    )}
                  </div>

                  {/* Modal Footer Actions */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginTop: 6,
                      paddingTop: 16,
                      borderTop: "1px solid var(--border-light)",
                      flexWrap: "wrap",
                      gap: 10,
                    }}
                  >
                    <button
                      type="button"
                      className="btn btn-primary"
                      disabled={startingChatId === selectedAppointment.id}
                      onClick={() =>
                        handleStartChatWithWorkspace(selectedAppointment)
                      }
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "10px 20px",
                        borderRadius: 10,
                      }}
                    >
                      {startingChatId === selectedAppointment.id ? (
                        <span
                          className="spinner spinner-sm"
                          style={{ borderTopColor: "#fff" }}
                        />
                      ) : (
                        <Icon name="message-square" size={16} />
                      )}
                      <span>
                        {t("chatWithWorkspace") || "مراسلة مساحة العمل"}
                      </span>
                    </button>

                    <div style={{ display: "flex", gap: 8 }}>
                      {(selectedAppointment.status === "pending" ||
                        selectedAppointment.status === "confirmed") && (
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => {
                            const appt = selectedAppointment;
                            setRescheduleModalAppt(appt);
                            const d = appt.starts_at
                              ? new Date(appt.starts_at)
                              : new Date();
                            setRescheduleDate(d.toISOString().split("T")[0]);
                            setRescheduleTime(d.toTimeString().slice(0, 5));
                            setRescheduleReason("");
                          }}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          <Icon name="calendar" size={16} />
                          <span>{isRTL ? "إعادة جدولة" : "Reschedule"}</span>
                        </button>
                      )}
                      {(selectedAppointment.status === "pending" ||
                        selectedAppointment.status === "confirmed") && (
                        <button
                          type="button"
                          className="btn btn-danger-subtle"
                          onClick={() => {
                            setCancelModalAppt(selectedAppointment);
                            setCancelReason("");
                          }}
                        >
                          {isRTL ? "إلغاء الموعد" : "Cancel Appointment"}
                        </button>
                      )}
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => setSelectedAppointment(null)}
                      >
                        {isRTL ? "إغلاق" : "Close"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>,
          document.body,
        )}

      {/* Cancellation Confirmation Modal */}
      {cancelModalAppt &&
        createPortal(
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: "100vw",
              height: "100vh",
              zIndex: 999999,
              background: "rgba(0, 0, 0, 0.65)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 16,
              backdropFilter: "blur(6px)",
            }}
            onClick={() => setCancelModalAppt(null)}
          >
            <div
              style={{
                background: "var(--surface)",
                borderRadius: 16,
                width: "100%",
                maxWidth: 440,
                padding: 24,
                border: "1px solid var(--border-light)",
                boxShadow: "0 20px 40px rgba(0,0,0,0.25)",
              }}
              onClick={(e) => e.stopPropagation()}
              className="animate-fade-in-up"
            >
              <h3
                style={{
                  margin: "0 0 8px",
                  fontSize: "1.05rem",
                  fontWeight: 700,
                  color: "var(--heading)",
                }}
              >
                {isRTL
                  ? "تأكيد إلغاء الموعد"
                  : "Confirm Appointment Cancellation"}
              </h3>
              <p
                style={{
                  fontSize: "0.88rem",
                  color: "var(--text-secondary)",
                  marginBottom: 16,
                }}
              >
                {isRTL
                  ? "هل أنت تأكد من رغبتك في إلغاء هذا الموعد؟"
                  : "Are you sure you want to cancel this appointment?"}
              </p>

              <form onSubmit={handleCancelAppointment}>
                <div className="form-group" style={{ marginBottom: 16 }}>
                  <label className="form-label">
                    {isRTL ? "سبب الإلغاء (اختياري)" : "Reason (Optional)"}
                  </label>
                  <textarea
                    className="form-input"
                    rows={3}
                    placeholder={
                      isRTL
                        ? "اكتب سبب الإلغاء..."
                        : "Write reason for cancellation..."
                    }
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                  />
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: 8,
                  }}
                >
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setCancelModalAppt(null)}
                  >
                    {isRTL ? "التراجع" : "Keep Appointment"}
                  </button>
                  <button
                    type="submit"
                    className="btn btn-ghost"
                    disabled={cancelling}
                    style={{ background: "#ef4444", color: "#fff" }}
                  >
                    {cancelling ? (
                      <span
                        className="spinner spinner-sm"
                        style={{ borderTopColor: "#fff" }}
                      />
                    ) : isRTL ? (
                      "تأكيد الإلغاء"
                    ) : (
                      "Confirm Cancel"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body,
        )}

      {/* Payment Proof Reupload Modal */}
      {proofModalAppt &&
        createPortal(
          <div
            className="modal-backdrop"
            onClick={() => setProofModalAppt(null)}
          >
            <div
              className="modal-card modal-md animate-fade-in-up"
              onClick={(e) => e.stopPropagation()}
              style={{ maxWidth: 520 }}
            >
              <div className="modal-header">
                <h3 className="modal-title">
                  {isRTL
                    ? "إعادة إرفاق / رفع إيصال الدفع"
                    : "Reupload / Submit Payment Proof"}
                </h3>
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() => setProofModalAppt(null)}
                >
                  <Icon name="x" size={16} />
                </button>
              </div>

              <form onSubmit={handleUploadPaymentProof} className="modal-body">
                <div className="form-group" style={{ marginBottom: 14 }}>
                  <label className="form-label" style={{ fontWeight: 700 }}>
                    {isRTL
                      ? "ملف إيصال السداد (صورة / PDF)"
                      : "Receipt File (Image / PDF)"}
                  </label>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    className="form-input"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setProofFile(file);
                        if (file.type.startsWith("image/")) {
                          setProofFilePreview(URL.createObjectURL(file));
                        } else {
                          setProofFilePreview("");
                        }
                      }
                    }}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 14 }}>
                  <label className="form-label">
                    {isRTL ? "أو رابط الإيصال مباشرة" : "Or Direct Receipt URL"}
                  </label>
                  <input
                    type="url"
                    className="form-input"
                    placeholder="https://example.com/receipt.pdf"
                    value={
                      typeof proofFile === "string"
                        ? proofFile
                        : proofFilePreview
                    }
                    onChange={(e) => {
                      setProofFile(e.target.value);
                      setProofFilePreview(e.target.value);
                    }}
                  />
                </div>

                {proofFilePreview && proofFilePreview.startsWith("http") && (
                  <div
                    style={{
                      padding: 10,
                      borderRadius: 8,
                      background: "var(--surface-alt)",
                      marginBottom: 14,
                      textAlign: "center",
                    }}
                  >
                    <img
                      src={proofFilePreview}
                      alt="Receipt Preview"
                      style={{
                        maxWidth: "100%",
                        maxHeight: 150,
                        borderRadius: 6,
                        objectFit: "contain",
                      }}
                    />
                  </div>
                )}

                <div className="form-group" style={{ marginBottom: 16 }}>
                  <label className="form-label">
                    {isRTL
                      ? "ملاحظات التحويل / البنك (اختياري)"
                      : "Notes / Reference (Optional)"}
                  </label>
                  <textarea
                    className="form-input"
                    rows={2}
                    placeholder={
                      isRTL
                        ? "مثال: تم التحويل من حساب البنك الأهلي رقم المرجع #1234"
                        : "e.g. Sent from National Bank ref #1234"
                    }
                    value={proofNotes}
                    onChange={(e) => setProofNotes(e.target.value)}
                  />
                </div>

                <div className="modal-actions">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setProofModalAppt(null)}
                  >
                    {isRTL ? "إلغاء" : "Cancel"}
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary btn-sm"
                    disabled={uploadingProof}
                  >
                    {uploadingProof ? (
                      <>
                        <span
                          className="spinner spinner-sm"
                          style={{ borderTopColor: "#fff" }}
                        />
                        {isRTL ? "جاري الرفع..." : "Uploading..."}
                      </>
                    ) : isRTL ? (
                      "تأكيد وحفظ الإيصال"
                    ) : (
                      "Submit Receipt"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body,
        )}

      {/* Reschedule Modal */}
      {rescheduleModalAppt &&
        createPortal(
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: "100vw",
              height: "100vh",
              zIndex: 999999,
              background: "rgba(0, 0, 0, 0.65)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 16,
              backdropFilter: "blur(6px)",
            }}
            onClick={() => setRescheduleModalAppt(null)}
          >
            <div
              style={{
                background: "var(--surface)",
                borderRadius: 16,
                width: "100%",
                maxWidth: 480,
                padding: 24,
                border: "1px solid var(--border-light)",
                boxShadow: "0 20px 40px rgba(0,0,0,0.25)",
              }}
              onClick={(e) => e.stopPropagation()}
              className="animate-fade-in-up"
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 16,
                }}
              >
                <h3
                  style={{
                    margin: 0,
                    fontSize: "1.05rem",
                    fontWeight: 700,
                    color: "var(--heading)",
                  }}
                >
                  {isRTL ? "إعادة جدولة الموعد" : "Reschedule Appointment"}
                </h3>
                <button
                  type="button"
                  className="btn btn-icon btn-sm"
                  onClick={() => setRescheduleModalAppt(null)}
                >
                  <Icon name="x" size={16} />
                </button>
              </div>

              <p
                style={{
                  fontSize: "0.85rem",
                  color: "var(--text-secondary)",
                  marginBottom: 16,
                }}
              >
                {isRTL
                  ? "حدد اليوم والوقت الجديدين للموعد:"
                  : "Choose a new date and time for the appointment:"}
              </p>

              <form onSubmit={handleRescheduleAppointment}>
                <div className="form-group" style={{ marginBottom: 14 }}>
                  <label className="form-label">
                    {isRTL ? "التاريخ الجديد" : "New Date"}
                  </label>
                  <input
                    type="date"
                    className="form-input"
                    min={new Date().toISOString().split("T")[0]}
                    value={rescheduleDate}
                    onChange={(e) => setRescheduleDate(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 14 }}>
                  <label className="form-label">
                    {isRTL ? "الوقت الجديد" : "New Time"}
                  </label>
                  <input
                    type="time"
                    className="form-input"
                    value={rescheduleTime}
                    onChange={(e) => setRescheduleTime(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 18 }}>
                  <label className="form-label">
                    {isRTL
                      ? "سبب إعادة الجدولة (اختياري)"
                      : "Reason (Optional)"}
                  </label>
                  <textarea
                    className="form-input"
                    rows={2}
                    placeholder={
                      isRTL
                        ? "اكتب سبب التعديل..."
                        : "Reason for rescheduling..."
                    }
                    value={rescheduleReason}
                    onChange={(e) => setRescheduleReason(e.target.value)}
                  />
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: 8,
                  }}
                >
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setRescheduleModalAppt(null)}
                  >
                    {isRTL ? "إلغاء" : "Cancel"}
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary btn-sm"
                    disabled={rescheduling}
                  >
                    {rescheduling ? (
                      <>
                        <span
                          className="spinner spinner-sm"
                          style={{ borderTopColor: "#fff" }}
                        />
                        {isRTL ? "جاري الجدولة..." : "Rescheduling..."}
                      </>
                    ) : isRTL ? (
                      "تأكيد إعادة الجدولة"
                    ) : (
                      "Confirm Reschedule"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "6px 0",
        fontSize: "0.85rem",
      }}
    >
      <span style={{ color: "var(--text-secondary)", fontWeight: 500 }}>
        {label}
      </span>
      <span
        style={{ fontWeight: 600, color: "var(--text)", textAlign: "right" }}
      >
        {value || "—"}
      </span>
    </div>
  );
}
