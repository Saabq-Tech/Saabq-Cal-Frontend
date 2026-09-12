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

import { usePermissions } from "../../../hooks/usePermissions";

export default function WorkspaceBookingsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();
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

  const selectedBooking = bookings.find((b) => b.id === selectedBookingId);

  return (
    <CapabilityGate capabilityCode="BOOKING">
      <div className="card workspace-bookings-card">
        <SEO title={t("bookings") || "المواعيد"} noindex />
        {selectedBookingId ? (
          <BookingDetailsPage
            bookingId={selectedBookingId}
            initialBooking={selectedBooking}
            onBack={() => setSelectedBookingId(null)}
            canEdit={canEdit}
            onReloadBookings={() => loadBookings(page)}
          />
        ) : loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <SkeletonRect height={48} />
            <SkeletonRect height={64} />
            <SkeletonRect height={64} />
          </div>
        ) : (
          <>
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
                  style={{
                    borderRadius: 20,
                  }}
                >
                  <Icon name="plus" size={14} />
                  <span>{t("bookNewAppointment") || "حجز موعد جديد"}</span>
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
          </>
        )}
      </div>
    </CapabilityGate>
  );
}
