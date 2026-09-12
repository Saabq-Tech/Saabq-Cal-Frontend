import { useState, useEffect, useCallback } from "react";
import { useLanguage } from "../../../../context/LanguageContext";
import { useToast } from "../../../../context/ToastContext";
import client, { endpoints } from "../../../../api/client";
import UserAvatar from "../../../../components/ui/UserAvatar";
import SEO from "../../../../components/ui/SEO";
import { SkeletonRect } from "../../../../components/ui/Skeleton";
import { createPortal } from "react-dom";
import Icon from "../../../../components/common/Icon";
import { formatCurrency, getCurrencySymbol } from "../../../../utils/currency";
import { useAuth } from "../../../../context/AuthContext";
import { useCustomerLabel } from "../../../../hooks/useCustomerLabel";
import { usePermissions } from "../../../../hooks/usePermissions";
import RichTextEditor from "../../../../components/common/RichTextEditor";
import { getPublicAssetUrl } from "../../../../utils/url";

export default function BookingDetailsPage({
  bookingId,
  initialBooking,
  onBack,
  canEdit = true,
  canCreate,
  canUpdate,
  canDelete,
  onReloadBookings,
}) {
  const { t, isRTL, lang } = useLanguage();
  const { customerSingular } = useCustomerLabel();
  const toast = useToast();
  const { isOwner, canCreateBookings, canUpdateBookings, canDeleteBookings } =
    usePermissions();

  const allowCreate =
    canCreate !== undefined ? canCreate : isOwner || canCreateBookings;
  const allowUpdate =
    canUpdate !== undefined ? canUpdate : isOwner || canUpdateBookings;
  const allowDelete =
    canDelete !== undefined ? canDelete : isOwner || canDeleteBookings;

  const [booking, setBooking] = useState(initialBooking || null);
  const [loading, setLoading] = useState(!initialBooking);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [showReceiptLightbox, setShowReceiptLightbox] = useState(false);

  // Action Confirmation Modal State
  const [confirmAction, setConfirmAction] = useState(null);

  // Reschedule Modal State
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");
  const [rescheduleReason, setRescheduleReason] = useState("");
  const [rescheduling, setRescheduling] = useState(false);

  // Follow-up Modal State
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [followUpDate, setFollowUpDate] = useState("");
  const [followUpTime, setFollowUpTime] = useState("");
  const [followUpNotes, setFollowUpNotes] = useState("");
  const [followUpPaid, setFollowUpPaid] = useState(false);
  const [creatingFollowUp, setCreatingFollowUp] = useState(false);

  // Summary / Prescription State
  const { user } = useAuth();
  const [isEditingSummary, setIsEditingSummary] = useState(false);
  const [summaryDraft, setSummaryDraft] = useState(
    initialBooking?.summary || "",
  );
  const [savingSummary, setSavingSummary] = useState(false);

  const fetchDetails = useCallback(async () => {
    try {
      setLoading(true);
      const res = await client.get(endpoints.workspaceBookingItem(bookingId));
      if (res.data?.data) {
        setBooking(res.data.data);
        setSummaryDraft(res.data.data.summary || "");
      }
    } catch {
      // Keep initial booking if fetch fails
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    if (bookingId) {
      fetchDetails();
    }
  }, [bookingId, fetchDetails]);

  const formatTranslatable = (val) => {
    if (val === null || val === undefined) return "";
    if (typeof val === "string" || typeof val === "number") return String(val);
    if (typeof val === "object") {
      const res =
        val[lang] ||
        val.ar ||
        val.en ||
        val.name ||
        val.title ||
        val.code ||
        val.symbol;
      return typeof res === "string" || typeof res === "number"
        ? String(res)
        : "";
    }
    return "";
  };

  const getPaymentReceiptUrl = (b) => {
    if (!b) return null;

    // 1. Check payments list
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

    // 2. Check booking metadata
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

    // 3. Check booking answers
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

        if (isReceiptQuestion && text) {
          return text;
        }

        if (
          text.startsWith("http") ||
          text.startsWith("/") ||
          text.startsWith("data:image") ||
          text.match(/\.(jpeg|jpg|gif|png|webp|pdf)$/i)
        ) {
          return text;
        }
      }
    }

    return null;
  };

  const renderStatusBadge = (status) => {
    switch (status) {
      case "confirmed":
        return (
          <span
            className="profile-badge verified"
            style={{
              padding: "6px 16px",
              fontSize: "0.86rem",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Icon name="check" size={14} />
            {t("statusConfirmed") || "مؤكد"}
          </span>
        );
      case "pending":
        return (
          <span
            className="profile-badge pending"
            style={{
              padding: "6px 16px",
              fontSize: "0.86rem",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Icon name="custom-56f3550d" size={14} />
            {t("statusPending") || "قيد الانتظار"}
          </span>
        );
      case "cancelled":
        return (
          <span
            className="profile-badge unverified"
            style={{
              padding: "6px 16px",
              fontSize: "0.86rem",
              background: "#ef4444",
              color: "#ffffff",
              border: "1px solid #dc2626",
              fontWeight: 700,
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Icon name="x" size={14} />
            {t("statusCancelled") || "ملغى"}
          </span>
        );
      case "completed":
        return (
          <span
            className="profile-badge verified"
            style={{
              padding: "6px 16px",
              fontSize: "0.86rem",
              background: "rgba(16, 185, 129, 0.12)",
              color: "#059669",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Icon name="check" size={14} />
            {t("statusCompleted") || "مكتمل"}
          </span>
        );
      case "rescheduled":
        return (
          <span
            className="profile-badge verified"
            style={{
              padding: "6px 16px",
              fontSize: "0.86rem",
              background: "rgba(59, 130, 246, 0.12)",
              color: "#2563eb",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Icon name="refresh-cw" size={14} />
            {t("statusRescheduled") || "معاد جدولته"}
          </span>
        );
      default:
        return (
          <span
            className="profile-badge unverified"
            style={{ padding: "6px 16px", fontSize: "0.86rem" }}
          >
            {status}
          </span>
        );
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    if (booking?.status === "completed") {
      toast.error(t("cannotChangeCompletedStatus"));
      return;
    }

    try {
      setUpdatingStatus(true);
      const res = await client.patch(
        endpoints.workspaceBookingStatus(bookingId),
        { status: newStatus },
      );
      toast.success(t("statusUpdatedSuccess"));

      const updatedData = res.data?.data;
      if (updatedData) {
        setBooking(updatedData);
      } else {
        setBooking((prev) => (prev ? { ...prev, status: newStatus } : prev));
      }
      setConfirmAction(null);
      if (onReloadBookings) onReloadBookings();
    } catch (err) {
      toast.error(err.response?.data?.message || t("failed"));
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleCancelBooking = async () => {
    if (booking?.status === "completed") {
      toast.error(t("cannotCancelCompletedStatus"));
      return;
    }

    try {
      setCancelling(true);
      const res = await client.post(
        endpoints.workspaceBookingCancel(bookingId),
        {
          cancellation_reason: cancelReason || undefined,
        },
      );
      toast.success(t("bookingCancelledSuccess") || "تم إلغاء الموعد بنجاح");
      setCancelReason("");
      setConfirmAction(null);

      const updatedData = res.data?.data;
      if (updatedData) {
        setBooking(updatedData);
      } else {
        setBooking((prev) =>
          prev
            ? {
                ...prev,
                status: "cancelled",
                cancellation_reason: cancelReason,
              }
            : prev,
        );
      }
      if (onReloadBookings) onReloadBookings();
    } catch (err) {
      toast.error(err.response?.data?.message || "فشل إلغاء الموعد");
    } finally {
      setCancelling(false);
    }
  };

  const handleRescheduleBooking = async (e) => {
    e.preventDefault();
    if (!rescheduleDate || !rescheduleTime) {
      toast.error(
        isRTL
          ? "من فضلك اختار التاريخ والوقت الجديد"
          : "Please select a new date and time",
      );
      return;
    }
    setRescheduling(true);
    try {
      const startsAt = `${rescheduleDate}T${rescheduleTime}:00`;
      const res = await client.post(
        endpoints.workspaceBookingReschedule(bookingId),
        {
          starts_at: startsAt,
          reason: rescheduleReason || undefined,
        },
      );
      toast.success(
        isRTL
          ? "تم إعادة جدولة الموعد بنجاح"
          : "Booking rescheduled successfully",
      );
      setShowRescheduleModal(false);
      setRescheduleDate("");
      setRescheduleTime("");
      setRescheduleReason("");
      if (res.data?.data) {
        setBooking(res.data.data);
      } else {
        fetchDetails();
      }
      if (typeof onReloadBookings === "function") {
        onReloadBookings();
      }
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          (isRTL ? "فشل إعادة جدولة الموعد" : "Failed to reschedule booking"),
      );
    } finally {
      setRescheduling(false);
    }
  };

  const handleCreateFollowUp = async (e) => {
    e.preventDefault();
    if (!followUpDate || !followUpTime) {
      toast.error(
        isRTL
          ? "من فضلك اختار التاريخ والوقت"
          : "Please select a date and time",
      );
      return;
    }
    setCreatingFollowUp(true);
    try {
      const startsAt = `${followUpDate}T${followUpTime}:00`;
      await client.post(
        `/workspace-members/workspace/bookings/${bookingId}/follow-up`,
        {
          starts_at: startsAt,
          notes: followUpNotes || undefined,
          is_paid: followUpPaid ? 1 : 0,
        },
      );
      toast.success(
        isRTL
          ? "تم إنشاء موعد المتابعة بنجاح"
          : "Follow-up booking created successfully",
      );
      setShowFollowUpModal(false);
      setFollowUpDate("");
      setFollowUpTime("");
      setFollowUpNotes("");
      setFollowUpPaid(false);
      if (typeof onReloadBookings === "function") {
        onReloadBookings();
      }
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          (isRTL ? "فشل إنشاء المتابعة" : "Failed to create follow-up"),
      );
    } finally {
      setCreatingFollowUp(false);
    }
  };

  const handleCopySummary = () => {
    if (!booking) return;
    const customer =
      booking.customer_name ||
      booking.customer?.name ||
      booking.snapshot?.customer_name ||
      "Guest";
    const service =
      formatTranslatable(booking.service?.name) ||
      booking.service_name ||
      booking.snapshot?.service_name ||
      "Service";
    const when =
      booking.when ||
      booking.start_time ||
      (booking.starts_at ? new Date(booking.starts_at).toLocaleString() : "");
    const summary = `Appointment #${booking.id}\nCustomer: ${customer}\nService: ${service}\nTime: ${when}\nStatus: ${booking.status}`;

    navigator.clipboard.writeText(summary);
    toast.success(t("copiedToClipboard") || "تم نسخ خلاصة الموعد بنجاح!");
  };

  const handleSaveSummary = async () => {
    try {
      setSavingSummary(true);
      const res = await client.put(
        endpoints.workspaceBookingSummary(bookingId),
        {
          summary: summaryDraft,
        },
      );
      toast.success(
        isRTL ? "تم حفظ التقرير بنجاح" : "Report saved successfully",
      );
      if (res.data?.data) {
        setBooking(res.data.data);
      } else {
        setBooking((prev) => ({ ...prev, summary: summaryDraft }));
      }
      setIsEditingSummary(false);
      if (onReloadBookings) onReloadBookings();
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          (isRTL ? "حفظ التقرير منجحش" : "Failed to save report"),
      );
    } finally {
      setSavingSummary(false);
    }
  };

  const handleDeleteSummary = async () => {
    if (
      !window.confirm(
        isRTL ? "إنت متأكد إنك عايز تحذف التقرير؟" : "Delete report?",
      )
    ) {
      return;
    }
    try {
      setSavingSummary(true);
      await client.delete(endpoints.workspaceBookingSummary(bookingId));
      toast.success(
        isRTL ? "تم حذف التقرير بنجاح" : "Report deleted successfully",
      );
      setBooking((prev) => ({ ...prev, summary: null }));
      setSummaryDraft("");
      setIsEditingSummary(false);
      if (onReloadBookings) onReloadBookings();
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          (isRTL ? "حذف التقرير منجحش" : "Failed to delete report"),
      );
    } finally {
      setSavingSummary(false);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 16,
          padding: 24,
        }}
      >
        <SkeletonRect height={48} />
        <SkeletonRect height={200} />
        <SkeletonRect height={240} />
      </div>
    );
  }

  const b = booking || {};
  const currentStatus = b.status || "pending";
  const receiptUrl = getPaymentReceiptUrl(b);
  const customerName =
    b.customer_name ||
    b.customer?.name ||
    b.snapshot?.customer_name ||
    customerSingular;
  const customerEmail =
    b.customer_email || b.customer?.email || b.snapshot?.customer_email || "";
  const customerPhone =
    b.customer_phone || b.customer?.phone || b.snapshot?.customer_phone || "";
  const serviceTitle =
    formatTranslatable(b.service?.name) ||
    b.service_name ||
    b.service?.title ||
    b.snapshot?.service_name ||
    "خدمة";
  const servicePrice = b.service?.price || b.snapshot?.price || 0;
  const rawCurrency =
    b.service?.currencyRelation ||
    b.service?.currency ||
    b.snapshot?.currency ||
    b.currency ||
    user?.workspace?.currency ||
    user?.workspace?.currency_code ||
    "SAR";
  const serviceCurrency = getCurrencySymbol(rawCurrency, isRTL);
  const serviceDuration =
    b.service?.duration_minutes || b.snapshot?.duration_minutes || 30;
  const providerName =
    b.workspace_member?.name ||
    b.createdByMember?.name ||
    t("allWorkspaceMembers") ||
    "جميع أعضاء المساحة (عامة)";

  const isCompleted = currentStatus === "completed";
  const isCancelled = currentStatus === "cancelled";

  const userPermissions = Array.isArray(user?.permissions)
    ? user.permissions
    : [];
  const isAssignedProvider =
    (b.workspace_member_id && b.workspace_member_id === user?.id) ||
    (b.workspace_member?.id && b.workspace_member?.id === user?.id);
  const canEditSummary =
    isOwner ||
    canEdit ||
    userPermissions.includes("booking_create") ||
    userPermissions.includes("booking_update") ||
    userPermissions.includes("booking_write") ||
    userPermissions.includes("bookings_write") ||
    isAssignedProvider;
  const workspaceTypeId =
    user?.workspace?.workspace_type_id ||
    user?.workspace_type_id ||
    b?.workspace?.workspace_type_id ||
    null;

  const handlePrintSummary = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const ws = user?.workspace || b?.workspace || {};
    const wsName = ws.name || (isRTL ? "مساحة العمل" : "Workspace");
    const wsLogo = ws.logo_url || (ws.logo ? getPublicAssetUrl(ws.logo) : "");
    const wsPhone = ws.phone || "";
    const wsEmail = ws.email || "";
    const wsAddress = ws.address || "";
    const saabqLogo = getPublicAssetUrl("/logo.png");

    let formattedDate = b.starts_at || b.date || "";
    let formattedTime = "";
    if (b.starts_at) {
      try {
        const d = new Date(b.starts_at);
        formattedDate = d.toLocaleDateString(isRTL ? "ar-SA" : "en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        });
        formattedTime = d.toLocaleTimeString(isRTL ? "ar-SA" : "en-US", {
          hour: "2-digit",
          minute: "2-digit",
        });
      } catch {
        formattedDate = String(b.starts_at || b.date || "");
      }
    }

    const statusMap = {
      pending: isRTL ? "قيد الانتظار" : "Pending",
      confirmed: isRTL ? "مؤكد" : "Confirmed",
      completed: isRTL ? "مكتمل" : "Completed",
      cancelled: isRTL ? "ملغي" : "Cancelled",
      rescheduled: isRTL ? "معاد جدولته" : "Rescheduled",
    };
    const statusText = statusMap[currentStatus] || currentStatus;
    const reportContent = b.summary || summaryDraft || "";

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="${isRTL ? "rtl" : "ltr"}" lang="${lang}">
        <head>
          <meta charset="utf-8" />
          <title>${isRTL ? "تقرير وملخص الموعد" : "Appointment Report & Summary"} #${b.id || bookingId}</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 14mm 12mm 16mm 12mm;
            }
            *, *::before, *::after {
              box-sizing: border-box;
            }
            body {
              font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
              margin: 0;
              padding: 0;
              color: #0f172a;
              background: #ffffff;
              font-size: 13px;
              line-height: 1.6;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .print-wrapper {
              width: 100%;
              max-width: 820px;
              margin: 0 auto;
            }

            /* ── Header: Workspace Letterhead + Platform Seal ── */
            .letterhead {
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-bottom: 2px solid #0284c7;
              padding-bottom: 14px;
              margin-bottom: 18px;
              gap: 16px;
            }
            .ws-info {
              display: flex;
              align-items: center;
              gap: 12px;
            }
            .ws-logo {
              width: 56px;
              height: 56px;
              border-radius: 10px;
              object-fit: cover;
              border: 1px solid #e2e8f0;
            }
            .ws-logo-placeholder {
              width: 54px;
              height: 54px;
              border-radius: 10px;
              background: #f1f5f9;
              border: 1px solid #cbd5e1;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 22px;
              font-weight: 800;
              color: #0284c7;
            }
            .ws-title {
              font-size: 18px;
              font-weight: 800;
              color: #0f172a;
              margin: 0 0 4px 0;
            }
            .ws-contacts {
              font-size: 11px;
              color: #64748b;
              display: flex;
              gap: 10px;
              flex-wrap: wrap;
            }
            .platform-branding {
              text-align: ${isRTL ? "left" : "right"};
              display: flex;
              flex-direction: column;
              align-items: ${isRTL ? "flex-start" : "flex-end"};
              gap: 4px;
            }
            .platform-badge {
              display: inline-flex;
              align-items: center;
              gap: 6px;
              background: #f0fdf4;
              border: 1px solid #bbf7d0;
              padding: 4px 10px;
              border-radius: 6px;
              font-size: 11px;
              font-weight: 700;
              color: #166534;
            }
            .platform-logo {
              height: 18px;
              width: auto;
            }
            .platform-sub {
              font-size: 10px;
              color: #94a3b8;
            }

            /* ── Document Meta Ribbon ── */
            .doc-ribbon {
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              padding: 10px 16px;
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 16px;
            }
            .doc-heading {
              font-size: 15px;
              font-weight: 800;
              color: #0f172a;
              margin: 0;
            }
            .doc-ref {
              font-size: 12px;
              color: #0284c7;
              font-weight: 700;
              font-family: monospace;
            }
            .status-pill {
              font-size: 11px;
              font-weight: 700;
              padding: 3px 10px;
              border-radius: 12px;
              background: #e0f2fe;
              color: #0369a1;
              border: 1px solid #bae6fd;
            }

            /* ── Appointment Context Grid ── */
            .grid-table {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 12px;
              background: #ffffff;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              padding: 14px 16px;
              margin-bottom: 20px;
            }
            .grid-cell {
              display: flex;
              flex-direction: column;
              gap: 2px;
            }
            .cell-label {
              font-size: 11px;
              font-weight: 600;
              color: #64748b;
            }
            .cell-value {
              font-size: 13px;
              font-weight: 700;
              color: #1e293b;
            }

            /* ── Report Content Area ── */
            .report-box {
              background: #ffffff;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              padding: 20px;
              min-height: 240px;
              margin-bottom: 24px;
            }
            .report-box-title {
              font-size: 12px;
              font-weight: 800;
              color: #0284c7;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin: 0 0 12px 0;
              padding-bottom: 6px;
              border-bottom: 1px solid #e2e8f0;
            }
            .report-content {
              line-height: 1.8;
              font-size: 13px;
              color: #1e293b;
            }
            .report-content p { margin: 0 0 10px 0; }
            .report-content h1, .report-content h2, .report-content h3 {
              color: #0f172a;
              margin-top: 14px;
              margin-bottom: 8px;
            }
            .report-content table {
              width: 100%;
              border-collapse: collapse;
              margin: 12px 0;
            }
            .report-content th, .report-content td {
              border: 1px solid #cbd5e1;
              padding: 8px 10px;
              text-align: ${isRTL ? "right" : "left"};
            }
            .report-content th {
              background: #f1f5f9;
              font-weight: 700;
            }
            .report-content ul, .report-content ol {
              margin: 8px 0;
              padding-inline-start: 20px;
            }

            /* ── Stamp & Signoff ── */
            .signoff-section {
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
              margin-top: 36px;
              padding-top: 16px;
              page-break-inside: avoid;
            }
            .signoff-col {
              text-align: center;
              width: 220px;
            }
            .signoff-slot {
              height: 48px;
              border-bottom: 1px dashed #94a3b8;
              margin-bottom: 6px;
            }
            .signoff-title {
              font-size: 11px;
              color: #64748b;
              font-weight: 600;
            }

            /* ── Footer Branding ── */
            .letterhead-footer {
              margin-top: 24px;
              padding-top: 12px;
              border-top: 1px solid #e2e8f0;
              display: flex;
              justify-content: space-between;
              align-items: center;
              font-size: 10px;
              color: #94a3b8;
              page-break-inside: avoid;
            }
          </style>
        </head>
        <body>
          <div class="print-wrapper">
            <!-- Header: Workspace & Platform -->
            <header class="letterhead">
              <div class="ws-info">
                ${
                  wsLogo
                    ? `<img src="${wsLogo}" class="ws-logo" alt="${wsName}" onerror="this.style.display='none'" />`
                    : `<div class="ws-logo-placeholder">${wsName ? wsName.charAt(0) : "W"}</div>`
                }
                <div>
                  <h1 class="ws-title">${wsName}</h1>
                  <div class="ws-contacts">
                    ${wsPhone ? `<span>📞 ${wsPhone}</span>` : ""}
                    ${wsEmail ? `<span>✉️ ${wsEmail}</span>` : ""}
                    ${wsAddress ? `<span>📍 ${wsAddress}</span>` : ""}
                  </div>
                </div>
              </div>

              <div class="platform-branding">
                <div class="platform-badge">
                  <img src="${saabqLogo}" class="platform-logo" alt="Saabq" onerror="this.style.display='none'" />
                  <span>${isRTL ? "تقويم سابق | Saabq Cal" : "Saabq Cal Platform"}</span>
                </div>
                <div class="platform-sub">${isRTL ? "نظام إدارة المواعيد والخدمات المعتمد" : "Verified Booking & Operations System"}</div>
              </div>
            </header>

            <!-- Document Ribbon -->
            <div class="doc-ribbon">
              <div>
                <h2 class="doc-heading">${isRTL ? "تقرير الجلسة / ملخص الموعد" : "Session Report & Summary"}</h2>
                <div class="doc-ref">${isRTL ? "رقم الموعد المرجعي:" : "Booking ID:"} #${b.id || bookingId}</div>
              </div>
              <span class="status-pill">${statusText}</span>
            </div>

            <!-- Details Grid -->
            <div class="grid-table">
              <div class="grid-cell">
                <span class="cell-label">${customerSingular ? (isRTL ? `بيانات ${customerSingular}` : `${customerSingular} Details`) : isRTL ? "العميل / المستفيد" : "Customer / Client"}</span>
                <span class="cell-value">${customerName} ${customerPhone ? `(${customerPhone})` : ""}</span>
              </div>
              <div class="grid-cell">
                <span class="cell-label">${isRTL ? "الخدمة المقدمة" : "Service"}</span>
                <span class="cell-value">${serviceTitle} ${serviceDuration ? `(${serviceDuration} ${isRTL ? "دقيقة" : "min"})` : ""}</span>
              </div>
              <div class="grid-cell">
                <span class="cell-label">${isRTL ? "مقدم الخدمة / الأخصائي" : "Specialist / Provider"}</span>
                <span class="cell-value">${providerName}</span>
              </div>
              <div class="grid-cell">
                <span class="cell-label">${isRTL ? "موعد الجلسة" : "Appointment Time"}</span>
                <span class="cell-value">${formattedDate} ${formattedTime ? `— ${formattedTime}` : ""}</span>
              </div>
            </div>

            <!-- Report Body -->
            <section class="report-box">
              <div class="report-box-title">${isRTL ? "محتوى التقرير والتوصيات" : "Report Details & Recommendations"}</div>
              <div class="report-content">
                ${reportContent || `<p style="color:#94a3b8;font-style:italic;">${isRTL ? "مفيش نص متسجل للتقرير." : "No report content recorded."}</p>`}
              </div>
            </section>

            <!-- Signoff & Stamp -->
            <div class="signoff-section">
              <div class="signoff-col">
                <div class="signoff-slot"></div>
                <div class="signoff-title">${isRTL ? "توقيع واعتماد مقدم الخدمة" : "Provider Signature"}</div>
              </div>
              <div class="signoff-col">
                <div class="signoff-slot"></div>
                <div class="signoff-title">${isRTL ? "ختم المنشأة ومساحة العمل" : "Workspace Stamp"}</div>
              </div>
            </div>

            <!-- Footer -->
            <footer class="letterhead-footer">
              <span>${isRTL ? "تم إصدار وتوثيق هذا المستند إلكترونياً عبر منصة تقويم سابق (Saabq Cal)" : "Issued & verified electronically via Saabq Cal Platform"}</span>
              <span>${new Date().toLocaleDateString(isRTL ? "ar-SA" : "en-US", { year: "numeric", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
            </footer>
          </div>

          <script>
            window.onload = function() {
              window.print();
              window.close();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div
      style={{ display: "flex", flexDirection: "column", gap: 24 }}
      className="animate-fade-in"
    >
      <SEO
        title={`${t("appointmentDetails") || "تفاصيل الموعد"} #${b.id}`}
        noindex
      />

      {/* TOP HEADER & ACTION NAVIGATION BAR */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 10,
          background: "var(--surface-alt)",
          padding: "14px 16px",
          borderRadius: "var(--radius-lg)",
          border: "1px solid var(--border-light)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onBack}
            style={{
              fontSize: "0.84rem",
              fontWeight: 700,
              padding: "7px 14px",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Icon name="custom-7d909fa7" size={16} />
            {isRTL ? "العودة للمواعيد" : "Back to Bookings"}
          </button>
          <h2
            style={{
              fontSize: "1.15rem",
              fontWeight: 800,
              margin: 0,
              color: "var(--heading)",
              display: "flex",
              alignItems: "center",
              gap: 6,
              flexWrap: "wrap",
            }}
          >
            <span>{t("appointmentDetails") || "تفاصيل الموعد"}</span>
            <span style={{ color: "var(--primary)", fontFamily: "monospace" }}>
              #{b.id}
            </span>
          </h2>
          {renderStatusBadge(b.status)}
        </div>

        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={handleCopySummary}
          style={{
            fontSize: "0.82rem",
            fontWeight: 700,
            padding: "7px 14px",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <Icon name="copy" size={14} />
          {t("copySummary") || "نسخ ملخص الموعد"}
        </button>
      </div>

      {/* PRESCRIPTION & CONSULTATION SUMMARY CARD */}
      <div
        className="card-body"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border-light)",
          borderRadius: "var(--radius-lg)",
          padding: 24,
          boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
            marginBottom: isEditingSummary || b.summary ? 16 : 0,
            paddingBottom: isEditingSummary || b.summary ? 14 : 0,
            borderBottom:
              isEditingSummary || b.summary
                ? "1px solid var(--border-light)"
                : "none",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 8,
                background: "rgba(14, 165, 233, 0.12)",
                color: "#0284c7",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon name="file-text" size={20} />
            </div>
            <div>
              <h3
                style={{
                  fontSize: "1.05rem",
                  fontWeight: 800,
                  margin: 0,
                  color: "var(--heading)",
                }}
              >
                {isRTL ? "تقرير الجلسة / الملخص" : "Session Report & Summary"}
              </h3>
              <p
                style={{
                  fontSize: "0.8rem",
                  color: "var(--muted)",
                  margin: 0,
                }}
              >
                {isRTL
                  ? "ملاحظات الجلسة، التقرير، والتوصيات المتاحة للعميل"
                  : "Session notes, report, and recommendations available to the customer"}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            {b.summary && !isEditingSummary && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handlePrintSummary}
                style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
              >
                <Icon name="printer" size={14} />
                {isRTL ? "طباعة التقرير" : "Print Report"}
              </button>
            )}

            {canEditSummary && !isEditingSummary && (
              <>
                {b.summary ? (
                  <>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => {
                        setSummaryDraft(b.summary || "");
                        setIsEditingSummary(true);
                      }}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <Icon name="edit" size={14} />
                      {isRTL ? "تعديل التقرير" : "Edit Report"}
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      onClick={handleDeleteSummary}
                      disabled={savingSummary}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <Icon name="trash" size={14} />
                      {isRTL ? "حذف" : "Delete"}
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => {
                      setSummaryDraft("");
                      setIsEditingSummary(true);
                    }}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <Icon name="plus" size={14} />
                    {isRTL
                      ? "+ كتابة تقرير / ملخص للموعد"
                      : "+ Add Report / Summary"}
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Content Section */}
        {isEditingSummary ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <RichTextEditor
              value={summaryDraft}
              onChange={setSummaryDraft}
              enableTemplates={true}
              enableKeywords={true}
              enablePrint={true}
              workspaceTypeId={workspaceTypeId}
              minHeight="260px"
              placeholder={
                isRTL
                  ? "اكتب تفاصيل التقرير، ملاحظات الجلسة، التوجيهات أو التوصيات هنا..."
                  : "Type report details, session notes, guidance or recommendations here..."
              }
            />

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 10,
                alignItems: "center",
              }}
            >
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setSummaryDraft(b.summary || "");
                  setIsEditingSummary(false);
                }}
                disabled={savingSummary}
              >
                {isRTL ? "إلغاء" : "Cancel"}
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleSaveSummary}
                disabled={savingSummary}
                style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
              >
                {savingSummary && (
                  <span className="spinner-border spinner-border-sm" />
                )}
                {isRTL ? "حفظ التقرير" : "Save Report"}
              </button>
            </div>
          </div>
        ) : b.summary ? (
          <div>
            <div
              className="prose"
              dangerouslySetInnerHTML={{ __html: b.summary }}
              style={{
                minHeight: 80,
                padding: 16,
                background: "var(--surface-alt)",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-light)",
                lineHeight: 1.7,
                fontSize: "0.95rem",
              }}
            />
            {b.summary_updated_at && (
              <div
                style={{
                  marginTop: 10,
                  fontSize: "0.78rem",
                  color: "var(--muted)",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Icon name="clock" size={13} />
                <span>
                  {isRTL ? "آخر تحديث:" : "Last updated:"}{" "}
                  {new Date(b.summary_updated_at).toLocaleString(
                    lang === "ar" ? "ar-EG" : "en-US",
                  )}
                </span>
                {b.summary_updated_by && (
                  <span>
                    ({isRTL ? "بواسطة عضو معرف:" : "by member #"}
                    {b.summary_updated_by})
                  </span>
                )}
              </div>
            )}
          </div>
        ) : (
          !canEditSummary && (
            <div
              style={{
                textAlign: "center",
                padding: "20px",
                color: "var(--muted)",
                fontSize: "0.88rem",
              }}
            >
              {isRTL
                ? "مفيش روشتة أو ملخص استشارة اتسجل للميعاد ده لحد دلوقتي."
                : "No prescription or consultation summary has been recorded for this appointment yet."}
            </div>
          )
        )}
      </div>

      {/* TWO-COLUMN REORGANIZED GRID */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(min(100%, 280px), 1fr))",
          gap: 20,
        }}
      >
        {/* COLUMN 1: CUSTOMER & SERVICE INFORMATION */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* CUSTOMER CARD */}
          <div
            className="card-body"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border-light)",
              borderRadius: "var(--radius-lg)",
              padding: "16px 14px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 16,
              }}
            >
              <Icon name="user" size={18} />
              <h4
                style={{
                  margin: 0,
                  fontSize: "0.95rem",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  color: "var(--heading)",
                }}
              >
                {t("customerDetails") ||
                  (isRTL
                    ? `بيانات ${customerSingular} بالحجز`
                    : `${customerSingular} Details`)}
              </h4>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                marginBottom: 16,
                flexWrap: "wrap",
              }}
            >
              <UserAvatar
                name={customerName}
                avatarUrl={b.customer?.avatar_url}
                size={50}
              />
              <div style={{ minWidth: 0, flex: 1 }}>
                <h3
                  style={{
                    margin: 0,
                    fontWeight: 800,
                    fontSize: "1.08rem",
                    color: "var(--heading)",
                    wordBreak: "break-word",
                  }}
                >
                  {customerName}
                </h3>
                <span
                  className="profile-badge verified"
                  style={{
                    marginTop: 6,
                    padding: "3px 10px",
                    fontSize: "0.78rem",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <Icon name="check" size={12} />
                  {`${customerSingular} ${isRTL ? "مسجل ومؤكد" : "Verified"}`}
                </span>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 10,
                borderTop: "1px solid var(--border-light)",
                paddingTop: 14,
                fontSize: "0.9rem",
              }}
            >
              {customerEmail && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 6,
                  }}
                >
                  <span style={{ color: "var(--muted)", flexShrink: 0 }}>
                    البريد الإلكتروني:
                  </span>
                  <a
                    href={`mailto:${customerEmail}`}
                    style={{
                      color: "var(--primary)",
                      fontWeight: 700,
                      textDecoration: "none",
                      wordBreak: "normal",
                      overflowWrap: "break-word",
                    }}
                  >
                    {customerEmail}
                  </a>
                </div>
              )}
              {customerPhone && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span style={{ color: "var(--muted)" }}>رقم الهاتف:</span>
                  <a
                    href={`tel:${customerPhone}`}
                    style={{
                      color: "var(--heading)",
                      fontWeight: 700,
                      textDecoration: "none",
                    }}
                  >
                    {customerPhone}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* SERVICE & ADVISOR CARD */}
          <div
            className="card-body"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border-light)",
              borderRadius: "var(--radius-lg)",
              padding: 22,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 16,
              }}
            >
              <Icon name="custom-335589bf" size={18} />
              <h4
                style={{
                  margin: 0,
                  fontSize: "0.95rem",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  color: "var(--heading)",
                }}
              >
                {t("serviceDetails") || "تفاصيل الخدمة ومقدم الخدمة"}
              </h4>
            </div>

            <h3
              style={{
                margin: "0 0 8px",
                fontSize: "1.25rem",
                fontWeight: 800,
                color: "var(--heading)",
              }}
            >
              {serviceTitle}
            </h3>

            <div
              style={{
                fontSize: "0.9rem",
                color: "var(--text-secondary)",
                display: "flex",
                gap: 20,
                marginBottom: 16,
                background: "var(--surface-alt)",
                padding: "10px 14px",
                borderRadius: "var(--radius-md)",
              }}
            >
              <span>
                ⏱ {serviceDuration} {t("durationMinutes") || "دقيقة"}
              </span>
              <span style={{ fontWeight: 700, color: "var(--heading)" }}>
                {formatCurrency(
                  servicePrice,
                  b.service?.currency_detail || serviceCurrency,
                  isRTL,
                )}
              </span>
            </div>

            <div
              style={{
                borderTop: "1px solid var(--border-light)",
                paddingTop: 14,
              }}
            >
              <span
                style={{
                  fontSize: "0.82rem",
                  color: "var(--muted)",
                  fontWeight: 700,
                  display: "block",
                  marginBottom: 6,
                }}
              >
                المتخصص / مقدم الخدمة المعين:
              </span>
              <div
                style={{
                  fontWeight: 800,
                  color: "var(--heading)",
                  fontSize: "1rem",
                }}
              >
                {providerName}
              </div>
            </div>
          </div>

          {/* FORM ANSWERS CARD */}
          {Array.isArray(b.answers) && b.answers.length > 0 && (
            <div
              className="card-body"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border-light)",
                borderRadius: "var(--radius-lg)",
                padding: 22,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 16,
                }}
              >
                <Icon name="custom-81bae9b4" size={18} />
                <h4
                  style={{
                    margin: 0,
                    fontSize: "0.95rem",
                    fontWeight: 800,
                    textTransform: "uppercase",
                    color: "var(--heading)",
                  }}
                >
                  {t("bookingAnswersHeader") || "إجابات أسئلة نموذج الحجز"}
                </h4>
              </div>

              <div
                style={{ display: "flex", flexDirection: "column", gap: 12 }}
              >
                {b.answers.map((ans, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: "var(--surface-alt)",
                      padding: 14,
                      borderRadius: "var(--radius-md)",
                      border: "1px solid var(--border-light)",
                    }}
                  >
                    <strong
                      style={{
                        color: "var(--heading)",
                        display: "block",
                        fontSize: "0.88rem",
                        marginBottom: 4,
                      }}
                    >
                      {ans.question_label ||
                        ans.question?.label ||
                        `سؤال ${idx + 1}`}
                      :
                    </strong>
                    <span
                      style={{
                        color: "var(--text-secondary)",
                        fontSize: "0.9rem",
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {ans.answer_text || ans.answer || "-"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* COLUMN 2: PAYMENT, SCHEDULE & AUDIT TIMESTAMPS */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* PAYMENT & RECEIPT CARD */}
          <div
            className="card-body"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border-light)",
              borderRadius: "var(--radius-lg)",
              padding: 22,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Icon name="credit-card" size={18} />
                <h4
                  style={{
                    margin: 0,
                    fontSize: "0.95rem",
                    fontWeight: 800,
                    textTransform: "uppercase",
                    color: "var(--heading)",
                  }}
                >
                  {t("paymentAndReceiptHeader") || "حالة الدفع وإيصال السداد"}
                </h4>
              </div>
              {b.payments && b.payments.length > 0 ? (
                <span
                  className="profile-badge verified"
                  style={{
                    padding: "4px 12px",
                    fontSize: "0.78rem",
                    background: "rgba(16, 185, 129, 0.12)",
                    color: "#059669",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <Icon name="check" size={12} />
                  مسجّل بالنظام
                </span>
              ) : (
                <span
                  className="profile-badge unverified"
                  style={{
                    padding: "4px 12px",
                    fontSize: "0.78rem",
                    background: "rgba(234, 179, 8, 0.12)",
                    color: "#b45309",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <Icon name="custom-56f3550d" size={12} />
                  بانتظار التحقق من الإيصال
                </span>
              )}
            </div>

            <div
              style={{
                background: "var(--surface-alt)",
                padding: 16,
                borderRadius: "var(--radius-md)",
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  fontSize: "1.3rem",
                  fontWeight: 800,
                  color: "var(--heading)",
                }}
              >
                {formatCurrency(
                  servicePrice,
                  b.service?.currency_detail || rawCurrency,
                  isRTL,
                )}
              </div>
              <div
                style={{
                  fontSize: "0.86rem",
                  color: "var(--text-secondary)",
                  marginTop: 4,
                }}
              >
                طريقة السداد:{" "}
                {b.payments?.[0]?.method || "تحويل بنكي / إيصال سداد"}
              </div>
            </div>

            {/* RECEIPT PROOF IMAGE PREVIEW */}
            {receiptUrl ? (
              <div
                style={{
                  border: "1px solid var(--border-light)",
                  borderRadius: "var(--radius-md)",
                  overflow: "hidden",
                  background: "#0f172a",
                }}
              >
                <div
                  style={{
                    padding: "10px 14px",
                    background: "rgba(255,255,255,0.05)",
                    color: "#fff",
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span>{t("attachedReceiptImage")}</span>
                  <button
                    type="button"
                    onClick={() => setShowReceiptLightbox(true)}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "var(--primary)",
                      cursor: "pointer",
                      fontWeight: 700,
                      fontSize: "0.82rem",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    {t("enlargeImage") || t("view")}
                  </button>
                </div>
                <div
                  style={{
                    padding: 12,
                    textAlign: "center",
                    maxHeight: 260,
                    overflow: "hidden",
                    cursor: "pointer",
                  }}
                  onClick={() => setShowReceiptLightbox(true)}
                >
                  <img
                    src={
                      receiptUrl.startsWith("http") ||
                      receiptUrl.startsWith("data:")
                        ? receiptUrl
                        : receiptUrl.startsWith("/")
                          ? receiptUrl
                          : `/${receiptUrl}`
                    }
                    alt="Receipt Proof"
                    style={{
                      maxWidth: "100%",
                      maxHeight: 240,
                      objectFit: "contain",
                      borderRadius: 6,
                    }}
                  />
                </div>
              </div>
            ) : (
              <div
                style={{
                  padding: 16,
                  background: "var(--surface-alt)",
                  borderRadius: "var(--radius-md)",
                  border: "1px border-dashed var(--border)",
                  textAlign: "center",
                }}
              >
                <span style={{ fontSize: "0.86rem", color: "var(--muted)" }}>
                  لم يتم رفع صورة إيصال مع هذا الحجز (أو تم الدفع بشكل مباشر).
                </span>
              </div>
            )}
          </div>

          {/* SCHEDULE & TIMEZONE CARD */}
          <div
            className="card-body"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border-light)",
              borderRadius: "var(--radius-lg)",
              padding: 22,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 16,
              }}
            >
              <Icon name="calendar" size={18} />
              <h4
                style={{
                  margin: 0,
                  fontSize: "0.95rem",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  color: "var(--heading)",
                }}
              >
                {t("scheduleTime") || "توقيت الموعد والجلسة"}
              </h4>
            </div>

            <div
              style={{
                fontSize: "1.1rem",
                fontWeight: 800,
                color: "var(--heading)",
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <Icon name="calendar" size={20} />
              <span>
                {b.when ||
                  b.start_time ||
                  (b.starts_at ? new Date(b.starts_at).toLocaleString() : "-")}
              </span>
            </div>
            {b.timezone && (
              <div
                style={{
                  fontSize: "0.84rem",
                  color: "var(--muted)",
                  marginTop: 8,
                }}
              >
                المنطقة الزمنية المحسوبة: {b.timezone}
              </div>
            )}
          </div>

          {/* MEETING LINK OR LOCATION */}
          {(() => {
            const meetUrl =
              b.google_meet_link ||
              b.metadata?.google_meet_link ||
              b.metadata?.meet_link ||
              b.metadata?.meeting_url ||
              b.meeting_link ||
              b.google_meet_url ||
              (typeof b.location === "string" && b.location.includes("http")
                ? b.location
                : null);
            const displayLoc = meetUrl || b.location;

            if (!displayLoc) return null;

            return (
              <div
                className="card-body"
                style={{
                  background: "rgba(59, 130, 246, 0.08)",
                  border: "1px solid rgba(59, 130, 246, 0.25)",
                  borderRadius: "var(--radius-lg)",
                  padding: 18,
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
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      marginBottom: 4,
                    }}
                  >
                    <Icon name="google-meet" size={18} />
                    {meetUrl
                      ? t("googleMeetLink") ||
                        "رابط اجتماع Google Meet / الموعد:"
                      : t("locationLabel") || "المكان:"}
                  </strong>
                  <span
                    style={{
                      fontSize: "0.92rem",
                      color: "var(--heading)",
                      fontWeight: 600,
                      wordBreak: "normal",
                      overflowWrap: "break-word",
                    }}
                  >
                    {displayLoc}
                  </span>
                </div>
                {meetUrl && (
                  <a
                    href={meetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary btn-sm"
                    style={{
                      fontSize: "0.84rem",
                      padding: "8px 18px",
                      fontWeight: 700,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      borderRadius: 10,
                    }}
                  >
                    <Icon name="link" size={14} />
                    {t("joinMeeting") || "الانضمام للاجتماع"}
                  </a>
                )}
              </div>
            );
          })()}

          {/* NOTES & REASON */}
          {b.notes && (
            <div
              className="card-body"
              style={{
                background: "rgba(234, 179, 8, 0.08)",
                border: "1px solid rgba(234, 179, 8, 0.2)",
                borderRadius: "var(--radius-lg)",
                padding: 18,
              }}
            >
              <strong
                style={{
                  fontSize: "0.88rem",
                  color: "#b45309",
                  display: "block",
                  marginBottom: 4,
                }}
              >
                {isRTL
                  ? `ملاحظات ${customerSingular} / الطلبات الخاصة:`
                  : `${customerSingular} Notes / Special Requests:`}
              </strong>
              <p
                style={{ margin: 0, fontSize: "0.9rem", color: "var(--text)" }}
              >
                {b.notes}
              </p>
            </div>
          )}

          {b.cancellation_reason && (
            <div className="cancellation-reason-box">
              <strong className="cancellation-reason-title">
                <Icon
                  name="x-circle"
                  size={15}
                  style={{ marginInlineEnd: 6 }}
                />
                {t("cancellationReason") || "سبب إلغاء الموعد:"}
              </strong>
              <p className="cancellation-reason-text">
                {b.cancellation_reason}
              </p>
            </div>
          )}

          {/* AUDIT TIMESTAMPS */}
          <div
            className="card-body"
            style={{
              background: "var(--surface-alt)",
              border: "1px solid var(--border-light)",
              borderRadius: "var(--radius-lg)",
              padding: 18,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
              gap: 12,
              fontSize: "0.82rem",
              color: "var(--muted)",
            }}
          >
            <div>
              <strong style={{ color: "var(--heading)" }}>
                تاريخ إنشاء الحجز:
              </strong>{" "}
              <br />
              {b.created_at ? new Date(b.created_at).toLocaleString() : "-"}
            </div>
            {b.confirmed_at && (
              <div>
                <strong style={{ color: "var(--heading)" }}>
                  تاريخ التأكيد:
                </strong>{" "}
                <br />
                {new Date(b.confirmed_at).toLocaleString()}
              </div>
            )}
            {b.completed_at && (
              <div>
                <strong style={{ color: "var(--heading)" }}>
                  تاريخ الإكتمال:
                </strong>{" "}
                <br />
                {new Date(b.completed_at).toLocaleString()}
              </div>
            )}
            {b.cancelled_at && (
              <div>
                <strong style={{ color: "var(--heading)" }}>
                  تاريخ الإلغاء:
                </strong>{" "}
                <br />
                {new Date(b.cancelled_at).toLocaleString()}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* FULL-WIDTH ACTION TOOLBAR AT BOTTOM OF CONTAINER */}
      {canEdit && (
        <div
          className="card-body"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border-light)",
            borderRadius: "var(--radius-lg)",
            padding: 22,
            width: "100%",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 16,
            }}
          >
            <Icon name="zap" size={20} />
            <h4
              style={{
                margin: 0,
                fontSize: "1rem",
                fontWeight: 800,
                textTransform: "uppercase",
                color: "var(--heading)",
              }}
            >
              {t("takeAction") || "إجراءات وتحديث حالة الموعد"}
            </h4>
          </div>

          {isCompleted ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div
                style={{
                  background: "rgba(16, 185, 129, 0.1)",
                  border: "1px solid rgba(16, 185, 129, 0.3)",
                  borderRadius: "var(--radius-md)",
                  padding: "16px 20px",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <Icon name="check" size={22} />
                <div
                  style={{
                    fontSize: "0.92rem",
                    fontWeight: 700,
                    color: "#059669",
                  }}
                >
                  الميعاد ده اكتمل بنجاح، ومينفعش تعدل فيه أو تلغيه أو تحويل
                  للانتظار بعد الانتهاء.
                </div>
              </div>
              {allowCreate && (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
                    gap: 14,
                    width: "100%",
                  }}
                >
                  <button
                    type="button"
                    className="btn btn-sm btn-primary"
                    onClick={() => setShowFollowUpModal(true)}
                    style={{
                      fontSize: "0.92rem",
                      fontWeight: 800,
                      padding: "12px 18px",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      gap: 8,
                      width: "100%",
                    }}
                  >
                    <Icon name="plus" size={16} />
                    {isRTL ? "إنشاء موعد متابعة" : "Create Follow-up"}
                  </button>
                </div>
              )}
            </div>
          ) : isCancelled ? (
            <div
              style={{
                background: "rgba(239, 68, 68, 0.1)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                borderRadius: "var(--radius-md)",
                padding: "16px 20px",
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <Icon name="x" size={22} />
              <div
                style={{
                  fontSize: "0.92rem",
                  fontWeight: 700,
                  color: "#dc2626",
                }}
              >
                الميعاد ده ملغي دلوقتي، ومينفعش تعدل فيه.
              </div>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
                gap: 14,
                width: "100%",
              }}
            >
              {allowUpdate && currentStatus === "pending" && (
                <button
                  type="button"
                  className="btn btn-sm"
                  onClick={() =>
                    setConfirmAction({
                      targetStatus: "confirmed",
                      label: t("markConfirmed") || "تأكيد الموعد",
                      color: "#10b981",
                    })
                  }
                  disabled={updatingStatus}
                  style={{
                    background: "#10b981",
                    color: "#fff",
                    fontSize: "0.92rem",
                    fontWeight: 800,
                    padding: "12px 18px",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: 8,
                    width: "100%",
                  }}
                >
                  <Icon name="check" size={16} />
                  {t("markConfirmed") || "تأكيد الموعد"}
                </button>
              )}

              {allowUpdate && currentStatus === "confirmed" && (
                <button
                  type="button"
                  className="btn btn-sm"
                  onClick={() =>
                    setConfirmAction({
                      targetStatus: "completed",
                      label: t("markCompleted") || "تعيين كمكتمل",
                      color: "#059669",
                    })
                  }
                  disabled={updatingStatus}
                  style={{
                    background: "#059669",
                    color: "#fff",
                    fontSize: "0.92rem",
                    fontWeight: 800,
                    padding: "12px 18px",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: 8,
                    width: "100%",
                  }}
                >
                  <Icon name="check" size={16} />
                  {t("markCompleted") || "تعيين كمكتمل"}
                </button>
              )}

              {allowUpdate && (
                <button
                  type="button"
                  className="btn btn-sm btn-secondary"
                  onClick={() => {
                    setShowRescheduleModal(true);
                    const d = b.starts_at ? new Date(b.starts_at) : new Date();
                    setRescheduleDate(d.toISOString().split("T")[0]);
                    setRescheduleTime(d.toTimeString().slice(0, 5));
                    setRescheduleReason("");
                  }}
                  disabled={updatingStatus}
                  style={{
                    fontSize: "0.92rem",
                    fontWeight: 800,
                    padding: "12px 18px",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: 8,
                    width: "100%",
                  }}
                >
                  <Icon name="calendar" size={16} />
                  {isRTL ? "إعادة جدولة الموعد" : "Reschedule Booking"}
                </button>
              )}

              {allowDelete && (
                <button
                  type="button"
                  className="btn btn-sm"
                  onClick={() =>
                    setConfirmAction({
                      targetStatus: "cancelled",
                      label: t("cancelAppointment") || "إلغاء الموعد",
                      color: "#ef4444",
                      requiresReason: true,
                    })
                  }
                  disabled={updatingStatus}
                  style={{
                    background: "#ef4444",
                    color: "#fff",
                    fontSize: "0.92rem",
                    fontWeight: 800,
                    padding: "12px 18px",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: 8,
                    width: "100%",
                  }}
                >
                  <Icon name="x" size={16} />
                  {t("cancelAppointment") || "إلغاء الموعد"}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* ACTION CONFIRMATION MODAL */}
      {confirmAction &&
        createPortal(
          <div
            className="modal-backdrop"
            onClick={() => setConfirmAction(null)}
            style={{ zIndex: 999999 }}
          >
            <div
              className="modal-card animate-scale-up"
              style={{ maxWidth: 500, width: "100%", padding: 24 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 16,
                }}
              >
                <h4
                  style={{
                    margin: 0,
                    fontWeight: 800,
                    fontSize: "1.15rem",
                    color: "var(--heading)",
                  }}
                >
                  {t("confirmActionTitle") || "تأكيد الإجراء على الموعد"}
                </h4>
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() => setConfirmAction(null)}
                >
                  <Icon name="x" size={16} />
                </button>
              </div>

              <p
                style={{
                  fontSize: "0.95rem",
                  color: "var(--text-secondary)",
                  margin: "0 0 16px",
                  lineHeight: 1.6,
                }}
              >
                هل أنت تأكد من {confirmAction.label} للموعد{" "}
                <strong style={{ color: "var(--heading)" }}>#{b.id}</strong>{" "}
                {isRTL
                  ? `الخاص بـ ${customerSingular} `
                  : `for ${customerSingular} `}
                <strong style={{ color: "var(--heading)" }}>
                  {customerName}
                </strong>
                ؟
              </p>

              {confirmAction.requiresReason && (
                <div style={{ marginBottom: 18 }}>
                  <label
                    className="form-label"
                    style={{
                      fontSize: "0.84rem",
                      fontWeight: 700,
                      display: "block",
                      marginBottom: 6,
                    }}
                  >
                    {t("enterCancelReason")}:
                  </label>
                  <textarea
                    className="form-input"
                    rows={3}
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder={t("enterCancelReasonPlaceholder")}
                    style={{ width: "100%", resize: "vertical" }}
                  />
                </div>
              )}

              <div
                style={{
                  display: "flex",
                  gap: 10,
                  justifyContent: "flex-end",
                  marginTop: 16,
                }}
              >
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setConfirmAction(null)}
                  style={{ fontWeight: 700, padding: "8px 18px" }}
                >
                  {t("cancel") || "إلغاء"}
                </button>
                <button
                  type="button"
                  className="btn btn-sm"
                  onClick={() => {
                    if (confirmAction.targetStatus === "cancelled") {
                      handleCancelBooking();
                    } else {
                      handleUpdateStatus(confirmAction.targetStatus);
                    }
                  }}
                  disabled={updatingStatus || cancelling}
                  style={{
                    background: confirmAction.color,
                    color: "#fff",
                    fontWeight: 800,
                    padding: "8px 22px",
                  }}
                >
                  {updatingStatus || cancelling
                    ? t("processing") || "جاري التنفيذ..."
                    : t("confirmAction") || "تأكيد الإجراء"}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* RECEIPT LIGHTBOX POPUP */}
      {showReceiptLightbox &&
        receiptUrl &&
        createPortal(
          <div
            className="modal-backdrop"
            onClick={() => setShowReceiptLightbox(false)}
            style={{ zIndex: 999999 }}
          >
            <div
              className="modal-card animate-scale-up"
              style={{ maxWidth: 720, width: "100%", padding: 24 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 16,
                }}
              >
                <h4
                  style={{
                    margin: 0,
                    fontWeight: 800,
                    fontSize: "1.1rem",
                    color: "var(--heading)",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <Icon name="calendar" size={18} />
                  صورة إيصال تأكيد التحويل
                </h4>
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() => setShowReceiptLightbox(false)}
                >
                  <Icon name="x" size={16} />
                </button>
              </div>

              <div
                style={{
                  background: "#0f172a",
                  borderRadius: "var(--radius-md)",
                  padding: 14,
                  textAlign: "center",
                  maxHeight: "72vh",
                  overflow: "hidden",
                }}
              >
                <img
                  src={
                    receiptUrl.startsWith("http") ||
                    receiptUrl.startsWith("data:")
                      ? receiptUrl
                      : receiptUrl.startsWith("/")
                        ? receiptUrl
                        : `/${receiptUrl}`
                  }
                  alt="Payment Receipt Full"
                  style={{
                    maxWidth: "100%",
                    maxHeight: "68vh",
                    objectFit: "contain",
                    borderRadius: 6,
                  }}
                />
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginTop: 16,
                }}
              >
                <a
                  href={
                    receiptUrl.startsWith("http") ||
                    receiptUrl.startsWith("data:")
                      ? receiptUrl
                      : receiptUrl.startsWith("/")
                        ? receiptUrl
                        : `/${receiptUrl}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary btn-sm"
                  style={{
                    fontSize: "0.84rem",
                    fontWeight: 700,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <Icon name="external-link" size={14} />
                  فتح الصورة في نافذة جديدة
                </a>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => setShowReceiptLightbox(false)}
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* MEMBER RESCHEDULE MODAL */}
      {showRescheduleModal &&
        createPortal(
          <div
            className="modal-backdrop"
            onClick={() => setShowRescheduleModal(false)}
            style={{ zIndex: 999999 }}
          >
            <div
              className="modal-card animate-scale-up"
              style={{ maxWidth: 480, width: "100%", padding: 24 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 16,
                }}
              >
                <h4
                  style={{
                    margin: 0,
                    fontWeight: 800,
                    fontSize: "1.15rem",
                    color: "var(--heading)",
                  }}
                >
                  {isRTL ? "إعادة جدولة الموعد" : "Reschedule Booking"}
                </h4>
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() => setShowRescheduleModal(false)}
                >
                  <Icon name="x" size={16} />
                </button>
              </div>

              <p
                style={{
                  fontSize: "0.9rem",
                  color: "var(--text-secondary)",
                  marginBottom: 16,
                }}
              >
                {isRTL
                  ? "اختر تاريخاً ووقتاً جديدين للموعد:"
                  : "Select a new date and time for the booking:"}
              </p>

              <form onSubmit={handleRescheduleBooking}>
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
                      ? "سبب التعديل / ملاحظات (اختياري)"
                      : "Reason / Notes (Optional)"}
                  </label>
                  <textarea
                    className="form-input"
                    rows={2}
                    value={rescheduleReason}
                    onChange={(e) => setRescheduleReason(e.target.value)}
                    placeholder={
                      isRTL
                        ? "أدخل السبب إن وجد..."
                        : "Enter reason if applicable..."
                    }
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
                    onClick={() => setShowRescheduleModal(false)}
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
                        {isRTL ? "جاري التعديل..." : "Updating..."}
                      </>
                    ) : isRTL ? (
                      "تأكيد الجدولة"
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
      {/* FOLLOW-UP MODAL */}
      {showFollowUpModal &&
        createPortal(
          <div
            className="modal-backdrop"
            onClick={() => setShowFollowUpModal(false)}
            style={{ zIndex: 999999 }}
          >
            <div
              className="modal-card animate-scale-up"
              style={{ maxWidth: 480, width: "100%", padding: 24 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 16,
                }}
              >
                <h4
                  style={{
                    margin: 0,
                    fontWeight: 800,
                    fontSize: "1.15rem",
                    color: "var(--heading)",
                  }}
                >
                  {isRTL ? "إنشاء موعد متابعة" : "Create Follow-up Booking"}
                </h4>
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() => setShowFollowUpModal(false)}
                >
                  <Icon name="x" size={16} />
                </button>
              </div>

              <p
                style={{
                  fontSize: "0.9rem",
                  color: "var(--text-secondary)",
                  marginBottom: 16,
                }}
              >
                {isRTL
                  ? `اختر تاريخاً ووقتاً لإنشاء موعد متابعة لـ ${customerSingular}:`
                  : `Select a date and time to create a follow-up booking for ${customerSingular}:`}
              </p>

              <form onSubmit={handleCreateFollowUp}>
                <div className="form-group" style={{ marginBottom: 14 }}>
                  <label className="form-label">
                    {isRTL ? "التاريخ" : "Date"}
                  </label>
                  <input
                    type="date"
                    className="form-input"
                    min={new Date().toISOString().split("T")[0]}
                    value={followUpDate}
                    onChange={(e) => setFollowUpDate(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 14 }}>
                  <label className="form-label">
                    {isRTL ? "الوقت" : "Time"}
                  </label>
                  <input
                    type="time"
                    className="form-input"
                    value={followUpTime}
                    onChange={(e) => setFollowUpTime(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 14 }}>
                  <label className="form-label">
                    {isRTL ? "ملاحظات (اختياري)" : "Notes (Optional)"}
                  </label>
                  <textarea
                    className="form-input"
                    rows={2}
                    value={followUpNotes}
                    onChange={(e) => setFollowUpNotes(e.target.value)}
                    placeholder={isRTL ? "أدخل ملاحظات..." : "Enter notes..."}
                  />
                </div>

                <div
                  className="form-group"
                  style={{
                    marginBottom: 18,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <input
                    type="checkbox"
                    id="followUpPaid"
                    checked={followUpPaid}
                    onChange={(e) => setFollowUpPaid(e.target.checked)}
                    style={{ width: 16, height: 16 }}
                  />
                  <label
                    htmlFor="followUpPaid"
                    style={{
                      fontSize: "0.9rem",
                      color: "var(--heading)",
                      margin: 0,
                      cursor: "pointer",
                    }}
                  >
                    {isRTL
                      ? "يتطلب دفع مالي (إلا فسيكون مجانياً)"
                      : "Requires payment (otherwise it will be free)"}
                  </label>
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
                    onClick={() => setShowFollowUpModal(false)}
                  >
                    {isRTL ? "إلغاء" : "Cancel"}
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary btn-sm"
                    disabled={creatingFollowUp}
                  >
                    {creatingFollowUp ? (
                      <>
                        <span
                          className="spinner spinner-sm"
                          style={{ borderTopColor: "#fff" }}
                        />
                        {isRTL ? "جاري الإنشاء..." : "Creating..."}
                      </>
                    ) : isRTL ? (
                      "تأكيد الإنشاء"
                    ) : (
                      "Confirm Create"
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
