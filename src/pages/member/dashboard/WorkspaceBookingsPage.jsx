import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { useLanguage } from '../../../context/LanguageContext';
import client, { endpoints } from '../../../api/client';
import BookingsTab from './workspace-settings/BookingsTab';
import BookingsCalendar from './workspace-settings/BookingsCalendar';
import BookingDetailsPage from './workspace-settings/BookingDetailsPage';
import CreateBookingModal from './workspace-settings/CreateBookingModal';
import SEO from '../../../components/ui/SEO';
import { SkeletonRect } from '../../../components/ui/Skeleton';
import CapabilityGate from '../../../components/common/CapabilityGate';
import { checkWorkspaceCapability } from '../../../utils/capabilities';
import Icon from '../../../components/common/Icon';

export default function WorkspaceBookingsPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const toast = useToast();

  const [bookings, setBookings] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selectedBookingId, setSelectedBookingId] = useState(null);
  const [viewMode, setViewMode] = useState('calendar'); // 'list' or 'calendar'
  const [showCreateModal, setShowCreateModal] = useState(false);

  const isOwner = user?.is_owner === true;
  const userPermissions = Array.isArray(user?.permissions) ? user.permissions : [];
  const canRead = isOwner || userPermissions.includes('booking_read') || userPermissions.includes('bookings_read');
  const canEdit = isOwner || userPermissions.includes('booking_write') || userPermissions.includes('bookings_write');

  const isCapAllowed = checkWorkspaceCapability(user, 'BOOKING');

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
        toast.error(t('bookingsLoadFailed') || 'فشل تحميل مواعيد مساحة العمل');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings(page);
  }, [page, isCapAllowed, canRead]);

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  const selectedBooking = bookings.find((b) => b.id === selectedBookingId);

  return (
    <CapabilityGate capabilityCode="BOOKING">
      <div className="card" style={{ padding: 24 }}>
        <SEO title={t('bookings') || 'المواعيد'} noindex />
        {selectedBookingId ? (
          <BookingDetailsPage
            bookingId={selectedBookingId}
            initialBooking={selectedBooking}
            onBack={() => setSelectedBookingId(null)}
            canEdit={canEdit}
            onReloadBookings={() => loadBookings(page)}
          />
        ) : loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <SkeletonRect height={48} />
            <SkeletonRect height={64} />
            <SkeletonRect height={64} />
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  className={`btn btn-sm ${viewMode === 'calendar' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setViewMode('calendar')}
                  style={{ padding: '6px 14px', borderRadius: 20 }}
                >
                  {t('calendarView') || 'عرض التقويم'}
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${viewMode === 'list' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setViewMode('list')}
                  style={{ padding: '6px 14px', borderRadius: 20 }}
                >
                  {t('listView') || 'عرض القائمة'}
                </button>
              </div>

              {canEdit && (
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => setShowCreateModal(true)}
                  style={{ padding: '8px 18px', fontWeight: 800, fontSize: '0.86rem', borderRadius: 20, display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <Icon name="plus" size={14} />
                  <span>{t('bookNewAppointment') || 'حجز موعد جديد'}</span>
                </button>
              )}
            </div>

            {viewMode === 'list' ? (
              <BookingsTab
                bookings={bookings}
                meta={meta}
                page={page}
                onPageChange={handlePageChange}
                onSelectBooking={(id) => setSelectedBookingId(id)}
                canEdit={canEdit}
                onReloadBookings={() => loadBookings(page)}
              />
            ) : (
              <BookingsCalendar
                onSelectBooking={(id) => setSelectedBookingId(id)}
              />
            )}

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
