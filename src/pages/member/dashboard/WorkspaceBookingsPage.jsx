import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { useLanguage } from "../../../context/LanguageContext";
import { useToast } from "../../../context/ToastContext";
import client, { endpoints } from "../../../api/client";
import BookingsTab from "./workspace-settings/BookingsTab";
import BookingsCalendar from "./workspace-settings/BookingsCalendar";
import BookingDetailsPage from "./workspace-settings/BookingDetailsPage";
import CreateBookingModal from "./workspace-settings/CreateBookingModal";
import SEO from "../../../components/ui/SEO";
import { SkeletonRect } from "../../../components/ui/Skeleton";
import CapabilityGate from "../../../components/common/CapabilityGate";
import { checkWorkspaceCapability } from "../../../utils/capabilities";
import Icon from "../../../components/common/Icon";
import WorkspacePageHeader from "../../../components/dashboard/WorkspacePageHeader";

export default function WorkspaceBookingsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();
  const toast = useToast();

  const [bookings, setBookings] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selectedBookingId, setSelectedBookingId] = useState(null);
  const [viewMode, setViewMode] = useState("calendar"); // 'list' or 'calendar'
  const [showCreateModal, setShowCreateModal] = useState(false);

  const isOwner = user?.is_owner === true;
  const userPermissions = Array.isArray(user?.permissions)
    ? user.permissions
    : [];
  const canRead =
    isOwner ||
    userPermissions.includes("booking_read") ||
    userPermissions.includes("bookings_read");
  const canEdit =
    isOwner ||
    userPermissions.includes("booking_write") ||
    userPermissions.includes("bookings_write");

  const isCapAllowed = checkWorkspaceCapability(user, "BOOKING");

  const loadBookings = async (targetPage = page) => {
    if (!isCapAllowed || !canRead) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await client.get(endpoints.workspaceBookings, {
        params: { page: targetPage, per_page: 15 },
      });
      setBookings(res.data?.data || []);
      setMeta(res.data?.meta || null);
    } catch (err) {
      if (err.response?.status !== 403) {
        toast.error(t("bookingsLoadFailed") || "فشل تحميل مواعيد مساحة العمل");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, isCapAllowed, canRead]);

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  const confirmedCount = bookings.filter(
    (b) => (b.status || "").toLowerCase() === "confirmed",
  ).length;
  const pendingCount = bookings.filter(
    (b) => (b.status || "").toLowerCase() === "pending",
  ).length;
  const totalCount = meta?.total !== undefined ? meta.total : bookings.length;
  const selectedBooking =
    bookings.find((b) => b.id === selectedBookingId) || null;

  return (
    <CapabilityGate capabilityCode="BOOKING">
      <div className="workspace-bookings-container animate-fade-in">
        <SEO title={t("bookings") || "المواعيد"} noindex />

        {selectedBookingId ? (
          <div className="workspace-page-container">
            <BookingDetailsPage
              bookingId={selectedBookingId}
              initialBooking={selectedBooking}
              onBack={() => setSelectedBookingId(null)}
              canEdit={canEdit}
              onReloadBookings={() => loadBookings(page)}
            />
          </div>
        ) : (
          <>
            <WorkspacePageHeader
              title={t("navBookings") || "إدارة المواعيد والحجوزات"}
              subtitle={
                t("bookingsSubtitle") ||
                "متابعة وإدارة جميع حجوزات المواعيد، وتأكيدها أو إلغائها والتحكم في التقويم."
              }
              icon="calendar"
              actions={
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    flexWrap: "wrap",
                  }}
                >
                  <div
                    className="bookings-view-toggle"
                    style={{
                      display: "inline-flex",
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                      padding: 3,
                      borderRadius: 12,
                    }}
                  >
                    <button
                      type="button"
                      className={`btn btn-sm ${viewMode === "calendar" ? "btn-primary" : "btn-secondary"}`}
                      onClick={() => setViewMode("calendar")}
                      style={{
                        borderRadius: 9,
                        padding: "6px 14px",
                        fontSize: "0.82rem",
                        fontWeight: 700,
                      }}
                    >
                      <Icon name="calendar" size={14} />
                      <span>{t("calendarView") || "عرض التقويم"}</span>
                    </button>
                    <button
                      type="button"
                      className={`btn btn-sm ${viewMode === "list" ? "btn-primary" : "btn-secondary"}`}
                      onClick={() => setViewMode("list")}
                      style={{
                        borderRadius: 9,
                        padding: "6px 14px",
                        fontSize: "0.82rem",
                        fontWeight: 700,
                      }}
                    >
                      <Icon name="list" size={14} />
                      <span>{t("listView") || "عرض القائمة"}</span>
                    </button>
                  </div>

                  {canEdit && (
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => setShowCreateModal(true)}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "9px 18px",
                        fontWeight: 700,
                        borderRadius: "var(--radius-md, 10px)",
                        boxShadow: "0 4px 14px rgba(2, 105, 130, 0.25)",
                      }}
                    >
                      <Icon name="plus" size={16} />
                      <span>{t("bookNewAppointment") || "حجز موعد جديد"}</span>
                    </button>
                  )}
                </div>
              }
              stats={[
                {
                  id: "total_bookings",
                  label: t("totalBookingsCount") || "إجمالي المواعيد",
                  value: totalCount,
                  icon: "calendar",
                  iconBg: "rgba(2, 105, 130, 0.12)",
                  iconColor: "var(--primary)",
                },
                {
                  id: "confirmed_bookings",
                  label: t("confirmedAppointments") || "المواعيد المؤكدة",
                  value: confirmedCount,
                  valueColor: "#10b981",
                  icon: "check-circle",
                  iconBg: "rgba(16, 185, 129, 0.12)",
                  iconColor: "#10b981",
                },
                {
                  id: "pending_bookings",
                  label: t("pendingAppointments") || "قيد الانتظار والتأكيد",
                  value: pendingCount,
                  valueColor: "#f59e0b",
                  icon: "clock",
                  iconBg: "rgba(245, 158, 11, 0.12)",
                  iconColor: "#f59e0b",
                },
              ]}
            />

            <div className="workspace-page-container">
              {loading ? (
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 12 }}
                >
                  <SkeletonRect height={48} />
                  <SkeletonRect height={64} />
                  <SkeletonRect height={64} />
                </div>
              ) : viewMode === "list" ? (
                <BookingsTab
                  bookings={bookings}
                  meta={meta}
                  page={page}
                  onPageChange={handlePageChange}
                  onSelectBooking={(id) =>
                    navigate(`/member/workspace/bookings/${id}`)
                  }
                  canEdit={canEdit}
                  onReloadBookings={() => loadBookings(page)}
                />
              ) : (
                <BookingsCalendar
                  onSelectBooking={(id) =>
                    navigate(`/member/workspace/bookings/${id}`)
                  }
                />
              )}
            </div>

            <CreateBookingModal
              isOpen={showCreateModal}
              onClose={() => setShowCreateModal(false)}
              onSuccess={() => loadBookings(page)}
            />
          </>
        )}
      </div>
    </CapabilityGate>
  );
}
