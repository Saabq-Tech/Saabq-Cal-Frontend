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
import { getWorkspaceVibe } from "../../../utils/workspaceVibe";
import Icon from "../../../components/common/Icon";
import WorkspacePageHeader from "../../../components/dashboard/WorkspacePageHeader";

import { usePermissions } from "../../../hooks/usePermissions";

export default function WorkspaceBookingsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, lang } = useLanguage();
  const vibe = getWorkspaceVibe(user?.workspace, lang);
  const toast = useToast();
  const {
    isOwner,
    canReadBookings,
    canCreateBookings,
    canUpdateBookings,
    canDeleteBookings,
  } = usePermissions();

  const [bookings, setBookings] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selectedBookingId, setSelectedBookingId] = useState(null);
  const [viewMode, setViewMode] = useState("calendar"); // 'list' or 'calendar'
  const [showCreateModal, setShowCreateModal] = useState(false);

  const canRead = isOwner || canReadBookings;
  const canEdit =
    isOwner || canCreateBookings || canUpdateBookings || canDeleteBookings;

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
<<<<<<< HEAD
      <div className="workspace-bookings-container animate-fade-in">
=======
      <div
        className={`card workspace-bookings-card vibe-${vibe.key}`}
        data-workspace-vibe={vibe.key}
      >
>>>>>>> f96c99cda1f7f257552f1b9a380cc71cd7df9828
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
<<<<<<< HEAD
            <WorkspacePageHeader
              title={t("navBookings") || "إدارة المواعيد والحجوزات"}
              subtitle={
                t("bookingsSubtitle") ||
                "متابعة وإدارة جميع حجوزات المواعيد، وتأكيدها أو إلغائها والتحكم في التقويم."
              }
              icon="calendar"
              actions={
                <div
=======
            <div className="workspace-bookings-top-toolbar">
              <div className="bookings-view-toggle">
                <button
                  type="button"
                  className={`btn btn-sm ${viewMode === "calendar" ? "btn-primary" : "btn-secondary"}`}
                  onClick={() => setViewMode("calendar")}
                  style={{ borderRadius: 20 }}
                >
                  {t("calendarView") || "عرض التقويم"}
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${viewMode === "list" ? "btn-primary" : "btn-secondary"}`}
                  onClick={() => setViewMode("list")}
                  style={{ borderRadius: 20 }}
                >
                  {t("listView") || "عرض القائمة"}
                </button>
              </div>

              {canCreateBookings && (
                <button
                  type="button"
                  className="btn btn-primary btn-sm new-booking-trigger-btn"
                  onClick={() => setShowCreateModal(true)}
>>>>>>> f96c99cda1f7f257552f1b9a380cc71cd7df9828
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    flexWrap: "wrap",
                  }}
                >
<<<<<<< HEAD
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
=======
                  <Icon name="plus" size={14} />
                  <span>
                    {vibe.bookAction ||
                      t("bookNewAppointment") ||
                      "حجز موعد جديد"}
                  </span>
                </button>
              )}
            </div>

            {viewMode === "list" ? (
              <BookingsTab
                bookings={bookings}
                meta={meta}
                page={page}
                onPageChange={handlePageChange}
                onSelectBooking={(id) =>
                  navigate(`/member/workspace/bookings/${id}`)
                }
                canEdit={canEdit}
                canCreate={canCreateBookings}
                canUpdate={canUpdateBookings}
                canDelete={canDeleteBookings}
                onReloadBookings={() => loadBookings(page)}
              />
            ) : (
              <BookingsCalendar
                onSelectBooking={(id) =>
                  navigate(`/member/workspace/bookings/${id}`)
                }
              />
            )}

            {canCreateBookings && (
              <CreateBookingModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSuccess={() => loadBookings(page)}
              />
            )}
>>>>>>> f96c99cda1f7f257552f1b9a380cc71cd7df9828
          </>
        )}
      </div>
    </CapabilityGate>
  );
}
