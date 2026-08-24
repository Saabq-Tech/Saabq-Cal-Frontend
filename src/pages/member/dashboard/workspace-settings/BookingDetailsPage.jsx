import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../../../../context/LanguageContext';
import { useToast } from '../../../../context/ToastContext';
import client, { endpoints } from '../../../../api/client';
import UserAvatar from '../../../../components/ui/UserAvatar';
import SEO from '../../../../components/ui/SEO';
import { SkeletonRect } from '../../../../components/ui/Skeleton';
import { createPortal } from 'react-dom';
import Icon from '../../../../components/common/Icon';
import { formatCurrency } from '../../../../utils/currency';


export default function BookingDetailsPage({ bookingId, initialBooking, onBack, canEdit, onReloadBookings }) {
  const { t, isRTL } = useLanguage();
  const toast = useToast();

  const [booking, setBooking] = useState(initialBooking || null);
  const [loading, setLoading] = useState(!initialBooking);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [showReceiptLightbox, setShowReceiptLightbox] = useState(false);
  
  // Action Confirmation Modal State
  const [confirmAction, setConfirmAction] = useState(null);

  // Reschedule Modal State
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [rescheduleReason, setRescheduleReason] = useState('');
  const [rescheduling, setRescheduling] = useState(false);

  const fetchDetails = useCallback(async () => {
    try {
      setLoading(true);
      const res = await client.get(endpoints.workspaceBookingItem(bookingId));
      if (res.data?.data) {
        setBooking(res.data.data);
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
    if (!val) return '';
    if (typeof val === 'string') return val;
    if (typeof val === 'object') {
      return isRTL ? val.ar || val.en || Object.values(val)[0] || '' : val.en || val.ar || Object.values(val)[0] || '';
    }
    return String(val);
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
        const text = String(ans.answer_text || ans.answer || '').trim();
        const label = String(ans.question_label || ans.question?.label || '').toLowerCase();
        
        const isReceiptQuestion = label.includes('إيصال') || label.includes('receipt') || label.includes('تحويل') || label.includes('دفع') || label.includes('صورة') || label.includes('proof') || label.includes('سداد');
        
        if (isReceiptQuestion && text) {
          return text;
        }
        
        if (text.startsWith('http') || text.startsWith('/') || text.startsWith('data:image') || text.match(/\.(jpeg|jpg|gif|png|webp|pdf)$/i)) {
          return text;
        }
      }
    }

    return null;
  };

  const renderStatusBadge = (status) => {
    switch (status) {
      case 'confirmed':
        return <span className="profile-badge verified" style={{ padding: '6px 16px', fontSize: '0.86rem', display: 'inline-flex', alignItems: 'center', gap: 6 }}><Icon name="check" size={14} />{t('statusConfirmed') || 'مؤكد'}</span>;
      case 'pending':
        return <span className="profile-badge unverified" style={{ padding: '6px 16px', fontSize: '0.86rem', background: 'rgba(234, 179, 8, 0.12)', color: '#b45309', display: 'inline-flex', alignItems: 'center', gap: 6 }}><Icon name="custom-56f3550d" size={14} />{t('statusPending') || 'قيد الانتظار'}</span>;
      case 'cancelled':
        return <span className="profile-badge unverified" style={{ padding: '6px 16px', fontSize: '0.86rem', background: '#ef4444', color: '#ffffff', border: '1px solid #dc2626', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6 }}><Icon name="x" size={14} />{t('statusCancelled') || 'ملغى'}</span>;
      case 'completed':
        return <span className="profile-badge verified" style={{ padding: '6px 16px', fontSize: '0.86rem', background: 'rgba(16, 185, 129, 0.12)', color: '#059669', display: 'inline-flex', alignItems: 'center', gap: 6 }}><Icon name="check" size={14} />{t('statusCompleted') || 'مكتمل'}</span>;
      case 'rescheduled':
        return <span className="profile-badge verified" style={{ padding: '6px 16px', fontSize: '0.86rem', background: 'rgba(59, 130, 246, 0.12)', color: '#2563eb', display: 'inline-flex', alignItems: 'center', gap: 6 }}><Icon name="refresh-cw" size={14} />{t('statusRescheduled') || 'معاد جدولته'}</span>;
      default:
        return <span className="profile-badge unverified" style={{ padding: '6px 16px', fontSize: '0.86rem' }}>{status}</span>;
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    if (booking?.status === 'completed') {
      toast.error(t('cannotChangeCompletedStatus'));
      return;
    }

    try {
      setUpdatingStatus(true);
      const res = await client.patch(endpoints.workspaceBookingStatus(bookingId), { status: newStatus });
      toast.success(t('statusUpdatedSuccess'));
      
      const updatedData = res.data?.data;
      if (updatedData) {
        setBooking(updatedData);
      } else {
        setBooking((prev) => prev ? { ...prev, status: newStatus } : prev);
      }
      setConfirmAction(null);
      if (onReloadBookings) onReloadBookings();
    } catch (err) {
      toast.error(err.response?.data?.message || t('failed'));
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleCancelBooking = async () => {
    if (booking?.status === 'completed') {
      toast.error(t('cannotCancelCompletedStatus'));
      return;
    }

    try {
      setCancelling(true);
      const res = await client.post(endpoints.workspaceBookingCancel(bookingId), {
        cancellation_reason: cancelReason || undefined,
      });
      toast.success(t('bookingCancelledSuccess') || 'تم إلغاء الموعد بنجاح');
      setCancelReason('');
      setConfirmAction(null);

      const updatedData = res.data?.data;
      if (updatedData) {
        setBooking(updatedData);
      } else {
        setBooking((prev) => prev ? { ...prev, status: 'cancelled', cancellation_reason: cancelReason } : prev);
      }
      if (onReloadBookings) onReloadBookings();
    } catch (err) {
      toast.error(err.response?.data?.message || 'فشل إلغاء الموعد');
    } finally {
      setCancelling(false);
    }
  };

  const handleRescheduleBooking = async (e) => {
    e.preventDefault();
    if (!rescheduleDate || !rescheduleTime) {
      toast.error(isRTL ? 'يرجى اختيار التاريخ والوقت الجديد' : 'Please select a new date and time');
      return;
    }
    setRescheduling(true);
    try {
      const startsAt = `${rescheduleDate}T${rescheduleTime}:00`;
      const res = await client.post(endpoints.workspaceBookingReschedule(bookingId), {
        starts_at: startsAt,
        reason: rescheduleReason || undefined,
      });
      toast.success(isRTL ? 'تم إعادة جدولة الموعد بنجاح' : 'Booking rescheduled successfully');
      setShowRescheduleModal(false);
      setRescheduleDate('');
      setRescheduleTime('');
      setRescheduleReason('');
      if (res.data?.data) {
        setBooking(res.data.data);
      } else {
        fetchDetails();
      }
      if (typeof onReloadBookings === 'function') {
        onReloadBookings();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || (isRTL ? 'فشل إعادة جدولة الموعد' : 'Failed to reschedule booking'));
    } finally {
      setRescheduling(false);
    }
  };

  const handleCopySummary = () => {
    if (!booking) return;
    const customer = booking.customer_name || booking.customer?.name || booking.snapshot?.customer_name || 'Guest';
    const service = formatTranslatable(booking.service?.name) || booking.service_name || booking.snapshot?.service_name || 'Service';
    const when = booking.when || booking.start_time || (booking.starts_at ? new Date(booking.starts_at).toLocaleString() : '');
    const summary = `Appointment #${booking.id}\nCustomer: ${customer}\nService: ${service}\nTime: ${when}\nStatus: ${booking.status}`;

    navigator.clipboard.writeText(summary);
    toast.success(t('copiedToClipboard') || 'تم نسخ خلاصة الموعد بنجاح!');
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 24 }}>
        <SkeletonRect height={48} />
        <SkeletonRect height={200} />
        <SkeletonRect height={240} />
      </div>
    );
  }

  const b = booking || {};
  const currentStatus = b.status || 'pending';
  const receiptUrl = getPaymentReceiptUrl(b);
  const customerName = b.customer_name || b.customer?.name || b.snapshot?.customer_name || 'عميل';
  const customerEmail = b.customer_email || b.customer?.email || b.snapshot?.customer_email || '';
  const customerPhone = b.customer_phone || b.customer?.phone || b.snapshot?.customer_phone || '';
  const serviceTitle = formatTranslatable(b.service?.name) || b.service_name || b.service?.title || b.snapshot?.service_name || 'خدمة';
  const servicePrice = b.service?.price || b.snapshot?.price || 0;
  const rawCurrency = b.service?.currency || b.snapshot?.currency || b.currency || 'SAR';
  const serviceCurrency = typeof rawCurrency === 'object' && rawCurrency !== null 
    ? (rawCurrency.symbol_native || rawCurrency.symbol || rawCurrency.code || 'SAR') 
    : (rawCurrency || 'SAR');
  const serviceDuration = b.service?.duration_minutes || b.snapshot?.duration_minutes || 30;
  const providerName = b.workspace_member?.name || b.createdByMember?.name || (t('allWorkspaceMembers') || 'جميع أعضاء المساحة (عامة)');

  const isCompleted = currentStatus === 'completed';
  const isCancelled = currentStatus === 'cancelled';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }} className="animate-fade-in">
      <SEO title={`${t('appointmentDetails') || 'تفاصيل الموعد'} #${b.id}`} noindex />

      {/* TOP HEADER & ACTION NAVIGATION BAR */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, background: 'var(--surface-alt)', padding: '14px 16px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onBack}
            style={{ fontSize: '0.84rem', fontWeight: 700, padding: '7px 14px', display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <Icon name="custom-7d909fa7" size={16} />
            {isRTL ? 'العودة للمواعيد' : 'Back to Bookings'}
          </button>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--heading)', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span>{t('appointmentDetails') || 'تفاصيل الموعد'}</span>
            <span style={{ color: 'var(--primary)', fontFamily: 'monospace' }}>#{b.id}</span>
          </h2>
          {renderStatusBadge(b.status)}
        </div>

        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={handleCopySummary}
          style={{ fontSize: '0.82rem', fontWeight: 700, padding: '7px 14px', display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <Icon name="copy" size={14} />
          {t('copySummary') || 'نسخ ملخص الموعد'}
        </button>
      </div>

      {/* TWO-COLUMN REORGANIZED GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: 20 }}>
        {/* COLUMN 1: CUSTOMER & SERVICE INFORMATION */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* CUSTOMER CARD */}
          <div className="card-body" style={{ background: 'var(--surface)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', padding: '16px 14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <Icon name="user" size={18} />
              <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--heading)' }}>
                {t('customerDetails') || 'بيانات العميل بالحجز'}
              </h4>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16, flexWrap: 'wrap' }}>
              <UserAvatar name={customerName} avatarUrl={b.customer?.avatar_url} size={50} />
              <div style={{ minWidth: 0, flex: 1 }}>
                <h3 style={{ margin: 0, fontWeight: 800, fontSize: '1.08rem', color: 'var(--heading)', wordBreak: 'break-word' }}>
                  {customerName}
                </h3>
                <span className="profile-badge verified" style={{ marginTop: 6, padding: '3px 10px', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <Icon name="check" size={12} />
                  عميل مسجل ومؤكد
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, borderTop: '1px solid var(--border-light)', paddingTop: 14, fontSize: '0.9rem' }}>
              {customerEmail && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                  <span style={{ color: 'var(--muted)', flexShrink: 0 }}>البريد الإلكتروني:</span>
                  <a href={`mailto:${customerEmail}`} style={{ color: 'var(--primary)', fontWeight: 700, textDecoration: 'none', wordBreak: 'break-all' }}>
                    {customerEmail}
                  </a>
                </div>
              )}
              {customerPhone && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--muted)' }}>رقم الهاتف:</span>
                  <a href={`tel:${customerPhone}`} style={{ color: 'var(--heading)', fontWeight: 700, textDecoration: 'none' }}>
                    {customerPhone}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* SERVICE & ADVISOR CARD */}
          <div className="card-body" style={{ background: 'var(--surface)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', padding: 22 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <Icon name="custom-335589bf" size={18} />
              <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--heading)' }}>
                {t('serviceDetails') || 'تفاصيل الخدمة ومقدم الخدمة'}
              </h4>
            </div>

            <h3 style={{ margin: '0 0 8px', fontSize: '1.25rem', fontWeight: 800, color: 'var(--heading)' }}>
              {serviceTitle}
            </h3>

            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', display: 'flex', gap: 20, marginBottom: 16, background: 'var(--surface-alt)', padding: '10px 14px', borderRadius: 'var(--radius-md)' }}>
              <span>⏱ {serviceDuration} {t('durationMinutes') || 'دقيقة'}</span>
              <span style={{ fontWeight: 700, color: 'var(--heading)' }}>{formatCurrency(servicePrice, b.service?.currency_detail || serviceCurrency, isRTL)}</span>
            </div>

            <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: 14 }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--muted)', fontWeight: 700, display: 'block', marginBottom: 6 }}>
                المستشار / مقدم الخدمة المعين:
              </span>
              <div style={{ fontWeight: 800, color: 'var(--heading)', fontSize: '1rem' }}>
                {providerName}
              </div>
            </div>
          </div>

          {/* FORM ANSWERS CARD */}
          {Array.isArray(b.answers) && b.answers.length > 0 && (
            <div className="card-body" style={{ background: 'var(--surface)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', padding: 22 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <Icon name="custom-81bae9b4" size={18} />
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--heading)' }}>
                  {t('bookingAnswersHeader') || 'إجابات أسئلة نموذج الحجز'}
                </h4>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {b.answers.map((ans, idx) => (
                  <div key={idx} style={{ background: 'var(--surface-alt)', padding: 14, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                    <strong style={{ color: 'var(--heading)', display: 'block', fontSize: '0.88rem', marginBottom: 4 }}>
                      {ans.question_label || ans.question?.label || `سؤال ${idx + 1}`}:
                    </strong>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', whiteSpace: 'pre-wrap' }}>
                      {ans.answer_text || ans.answer || '-'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* COLUMN 2: PAYMENT, SCHEDULE & AUDIT TIMESTAMPS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* PAYMENT & RECEIPT CARD */}
          <div className="card-body" style={{ background: 'var(--surface)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', padding: 22 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Icon name="credit-card" size={18} />
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--heading)' }}>
                  {t('paymentAndReceiptHeader') || 'حالة الدفع وإيصال السداد'}
                </h4>
              </div>
              {b.payments && b.payments.length > 0 ? (
                <span className="profile-badge verified" style={{ padding: '4px 12px', fontSize: '0.78rem', background: 'rgba(16, 185, 129, 0.12)', color: '#059669', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <Icon name="check" size={12} />
                  مسجّل بالنظام
                </span>
              ) : (
                <span className="profile-badge unverified" style={{ padding: '4px 12px', fontSize: '0.78rem', background: 'rgba(234, 179, 8, 0.12)', color: '#b45309', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <Icon name="custom-56f3550d" size={12} />
                  بانتظار التحقق من الإيصال
                </span>
              )}
            </div>

            <div style={{ background: 'var(--surface-alt)', padding: 16, borderRadius: 'var(--radius-md)', marginBottom: 16 }}>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--heading)' }}>
                {formatCurrency(servicePrice, b.service?.currency_detail || rawCurrency, isRTL)}
              </div>
              <div style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                طريقة السداد: {b.payments?.[0]?.method || 'تحويل بنكي / إيصال سداد'}
              </div>
            </div>

            {/* RECEIPT PROOF IMAGE PREVIEW */}
            {receiptUrl ? (
              <div style={{ border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', overflow: 'hidden', background: '#0f172a' }}>
                <div style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: '0.82rem', fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>{t('attachedReceiptImage')}</span>
                  <button
                    type="button"
                    onClick={() => setShowReceiptLightbox(true)}
                    style={{ background: 'transparent', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: 700, fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 4 }}
                  >
                    {t('enlargeImage') || t('view')}
                  </button>
                </div>
                <div style={{ padding: 12, textAlign: 'center', maxHeight: 260, overflow: 'hidden', cursor: 'pointer' }} onClick={() => setShowReceiptLightbox(true)}>
                  <img
                    src={receiptUrl.startsWith('http') || receiptUrl.startsWith('data:') ? receiptUrl : receiptUrl.startsWith('/') ? receiptUrl : `/${receiptUrl}`}
                    alt="Receipt Proof"
                    style={{ maxWidth: '100%', maxHeight: 240, objectFit: 'contain', borderRadius: 6 }}
                  />
                </div>
              </div>
            ) : (
              <div style={{ padding: 16, background: 'var(--surface-alt)', borderRadius: 'var(--radius-md)', border: '1px border-dashed var(--border)', textAlign: 'center' }}>
                <span style={{ fontSize: '0.86rem', color: 'var(--muted)' }}>
                  لم يتم رفع صورة إيصال مع هذا الحجز (أو تم الدفع بشكل مباشر).
                </span>
              </div>
            )}
          </div>

          {/* SCHEDULE & TIMEZONE CARD */}
          <div className="card-body" style={{ background: 'var(--surface)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', padding: 22 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <Icon name="calendar" size={18} />
              <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--heading)' }}>
                {t('scheduleTime') || 'توقيت الموعد والجلسة'}
              </h4>
            </div>

            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--heading)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <Icon name="calendar" size={20} />
              <span>{b.when || b.start_time || (b.starts_at ? new Date(b.starts_at).toLocaleString() : '-')}</span>
            </div>
            {b.timezone && (
              <div style={{ fontSize: '0.84rem', color: 'var(--muted)', marginTop: 8 }}>
                المنطقة الزمنية المحسوبة: {b.timezone}
              </div>
            )}
          </div>

          {/* MEETING LINK OR LOCATION */}
          {(() => {
            const meetUrl = b.google_meet_link || b.metadata?.google_meet_link || b.metadata?.meet_link || b.metadata?.meeting_url || b.meeting_link || b.google_meet_url || (typeof b.location === 'string' && b.location.includes('http') ? b.location : null);
            const displayLoc = meetUrl || b.location;

            if (!displayLoc) return null;

            return (
              <div className="card-body" style={{ background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.25)', borderRadius: 'var(--radius-lg)', padding: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <strong style={{ fontSize: '0.88rem', color: '#2563eb', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <Icon name="google-meet" size={18} />
                    {meetUrl ? (t('googleMeetLink') || 'رابط اجتماع Google Meet / الموعد:') : (t('locationLabel') || 'المكان:')}
                  </strong>
                  <span style={{ fontSize: '0.92rem', color: 'var(--heading)', fontWeight: 600, wordBreak: 'break-all' }}>
                    {displayLoc}
                  </span>
                </div>
                {meetUrl && (
                  <a
                    href={meetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary btn-sm"
                    style={{ fontSize: '0.84rem', padding: '8px 18px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: 10 }}
                  >
                    <Icon name="link" size={14} />
                    {t('joinMeeting') || 'الانضمام للاجتماع'}
                  </a>
                )}
              </div>
            );
          })()}

          {/* NOTES & REASON */}
          {b.notes && (
            <div className="card-body" style={{ background: 'rgba(234, 179, 8, 0.08)', border: '1px solid rgba(234, 179, 8, 0.2)', borderRadius: 'var(--radius-lg)', padding: 18 }}>
              <strong style={{ fontSize: '0.88rem', color: '#b45309', display: 'block', marginBottom: 4 }}>
                ملاحظات العميل / الطلبات الخاصة:
              </strong>
              <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text)' }}>{b.notes}</p>
            </div>
          )}

          {b.cancellation_reason && (
            <div className="cancellation-reason-box">
              <strong className="cancellation-reason-title">
                <Icon name="x-circle" size={15} style={{ marginInlineEnd: 6 }} />
                {t('cancellationReason') || 'سبب إلغاء الموعد:'}
              </strong>
              <p className="cancellation-reason-text">{b.cancellation_reason}</p>
            </div>
          )}

          {/* AUDIT TIMESTAMPS */}
          <div className="card-body" style={{ background: 'var(--surface-alt)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', padding: 18, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, fontSize: '0.82rem', color: 'var(--muted)' }}>
            <div>
              <strong style={{ color: 'var(--heading)' }}>تاريخ إنشاء الحجز:</strong> <br/>
              {b.created_at ? new Date(b.created_at).toLocaleString() : '-'}
            </div>
            {b.confirmed_at && (
              <div>
                <strong style={{ color: 'var(--heading)' }}>تاريخ التأكيد:</strong> <br/>
                {new Date(b.confirmed_at).toLocaleString()}
              </div>
            )}
            {b.completed_at && (
              <div>
                <strong style={{ color: 'var(--heading)' }}>تاريخ الإكتمال:</strong> <br/>
                {new Date(b.completed_at).toLocaleString()}
              </div>
            )}
            {b.cancelled_at && (
              <div>
                <strong style={{ color: 'var(--heading)' }}>تاريخ الإلغاء:</strong> <br/>
                {new Date(b.cancelled_at).toLocaleString()}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* FULL-WIDTH ACTION TOOLBAR AT BOTTOM OF CONTAINER */}
      {canEdit && (
        <div className="card-body" style={{ background: 'var(--surface)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', padding: 22, width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <Icon name="zap" size={20} />
            <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--heading)' }}>
              {t('takeAction') || 'إجراءات وتحديث حالة الموعد'}
            </h4>
          </div>

          {isCompleted ? (
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: 'var(--radius-md)', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <Icon name="check" size={22} />
              <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#059669' }}>
                هذا الموعد مكتمل بنجاح، ولا يمكن إجراء تعديلات أو إلغاء أو تحويل للانتظار بعد الانتهاء.
              </div>
            </div>
          ) : isCancelled ? (
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 'var(--radius-md)', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <Icon name="x" size={22} />
              <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#dc2626' }}>
                هذا الموعد ملغى حالياً، ولا يمكن إجراء تغييرات إضافية عليه.
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 14, width: '100%' }}>
              {currentStatus === 'pending' && (
                <button
                  type="button"
                  className="btn btn-sm"
                  onClick={() => setConfirmAction({ targetStatus: 'confirmed', label: t('markConfirmed') || 'تأكيد الموعد', color: '#10b981' })}
                  disabled={updatingStatus}
                  style={{ background: '#10b981', color: '#fff', fontSize: '0.92rem', fontWeight: 800, padding: '12px 18px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, width: '100%' }}
                >
                  <Icon name="check" size={16} />
                  {t('markConfirmed') || 'تأكيد الموعد'}
                </button>
              )}

              {currentStatus === 'confirmed' && (
                <button
                  type="button"
                  className="btn btn-sm"
                  onClick={() => setConfirmAction({ targetStatus: 'completed', label: t('markCompleted') || 'تعيين كمكتمل', color: '#059669' })}
                  disabled={updatingStatus}
                  style={{ background: '#059669', color: '#fff', fontSize: '0.92rem', fontWeight: 800, padding: '12px 18px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, width: '100%' }}
                >
                  <Icon name="check" size={16} />
                  {t('markCompleted') || 'تعيين كمكتمل'}
                </button>
              )}

              <button
                type="button"
                className="btn btn-sm btn-secondary"
                onClick={() => {
                  setShowRescheduleModal(true);
                  const d = b.starts_at ? new Date(b.starts_at) : new Date();
                  setRescheduleDate(d.toISOString().split('T')[0]);
                  setRescheduleTime(d.toTimeString().slice(0, 5));
                  setRescheduleReason('');
                }}
                disabled={updatingStatus}
                style={{ fontSize: '0.92rem', fontWeight: 800, padding: '12px 18px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, width: '100%' }}
              >
                <Icon name="calendar" size={16} />
                {isRTL ? 'إعادة جدولة الموعد' : 'Reschedule Booking'}
              </button>

              <button
                type="button"
                className="btn btn-sm"
                onClick={() => setConfirmAction({ targetStatus: 'cancelled', label: t('cancelAppointment') || 'إلغاء الموعد', color: '#ef4444', requiresReason: true })}
                disabled={updatingStatus}
                style={{ background: '#ef4444', color: '#fff', fontSize: '0.92rem', fontWeight: 800, padding: '12px 18px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, width: '100%' }}
              >
                <Icon name="x" size={16} />
                {t('cancelAppointment') || 'إلغاء الموعد'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ACTION CONFIRMATION MODAL */}
      {confirmAction && createPortal(
        <div className="modal-backdrop" onClick={() => setConfirmAction(null)} style={{ zIndex: 999999 }}>
          <div
            className="modal-card animate-scale-up"
            style={{ maxWidth: 500, width: '100%', padding: 24 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h4 style={{ margin: 0, fontWeight: 800, fontSize: '1.15rem', color: 'var(--heading)' }}>
                {t('confirmActionTitle') || 'تأكيد الإجراء على الموعد'}
              </h4>
              <button type="button" className="modal-close-btn" onClick={() => setConfirmAction(null)}>
                <Icon name="x" size={16} />
              </button>
            </div>

            <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', margin: '0 0 16px', lineHeight: 1.6 }}>
              هل أنت تأكد من {confirmAction.label} للموعد <strong style={{ color: 'var(--heading)' }}>#{b.id}</strong> الخاص بالعميل <strong style={{ color: 'var(--heading)' }}>{customerName}</strong>؟
            </p>

            {confirmAction.requiresReason && (
              <div style={{ marginBottom: 18 }}>
                <label className="form-label" style={{ fontSize: '0.84rem', fontWeight: 700, display: 'block', marginBottom: 6 }}>
                  {t('enterCancelReason')}:
                </label>
                <textarea
                  className="form-input"
                  rows={3}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder={t('enterCancelReasonPlaceholder')}
                  style={{ width: '100%', resize: 'vertical' }}
                />
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setConfirmAction(null)}
                style={{ fontWeight: 700, padding: '8px 18px' }}
              >
                {t('cancel') || 'إلغاء'}
              </button>
              <button
                type="button"
                className="btn btn-sm"
                onClick={() => {
                  if (confirmAction.targetStatus === 'cancelled') {
                    handleCancelBooking();
                  } else {
                    handleUpdateStatus(confirmAction.targetStatus);
                  }
                }}
                disabled={updatingStatus || cancelling}
                style={{ background: confirmAction.color, color: '#fff', fontWeight: 800, padding: '8px 22px' }}
              >
                {(updatingStatus || cancelling) ? (t('processing') || 'جاري التنفيذ...') : (t('confirmAction') || 'تأكيد الإجراء')}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* RECEIPT LIGHTBOX POPUP */}
      {showReceiptLightbox && receiptUrl && createPortal(
        <div className="modal-backdrop" onClick={() => setShowReceiptLightbox(false)} style={{ zIndex: 999999 }}>
          <div
            className="modal-card animate-scale-up"
            style={{ maxWidth: 720, width: '100%', padding: 24 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h4 style={{ margin: 0, fontWeight: 800, fontSize: '1.1rem', color: 'var(--heading)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Icon name="calendar" size={18} />
                صورة إيصال تأكيد التحويل
              </h4>
              <button type="button" className="modal-close-btn" onClick={() => setShowReceiptLightbox(false)}>
                <Icon name="x" size={16} />
              </button>
            </div>

            <div style={{ background: '#0f172a', borderRadius: 'var(--radius-md)', padding: 14, textAlign: 'center', maxHeight: '72vh', overflow: 'hidden' }}>
              <img
                src={receiptUrl.startsWith('http') || receiptUrl.startsWith('data:') ? receiptUrl : receiptUrl.startsWith('/') ? receiptUrl : `/${receiptUrl}`}
                alt="Payment Receipt Full"
                style={{ maxWidth: '100%', maxHeight: '68vh', objectFit: 'contain', borderRadius: 6 }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
              <a
                href={receiptUrl.startsWith('http') || receiptUrl.startsWith('data:') ? receiptUrl : receiptUrl.startsWith('/') ? receiptUrl : `/${receiptUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '0.84rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <Icon name="external-link" size={14} />
                فتح الصورة في نافذة جديدة
              </a>
              <button type="button" className="btn btn-primary btn-sm" onClick={() => setShowReceiptLightbox(false)}>
                إغلاق
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* MEMBER RESCHEDULE MODAL */}
      {showRescheduleModal && createPortal(
        <div className="modal-backdrop" onClick={() => setShowRescheduleModal(false)} style={{ zIndex: 999999 }}>
          <div className="modal-card animate-scale-up" style={{ maxWidth: 480, width: '100%', padding: 24 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h4 style={{ margin: 0, fontWeight: 800, fontSize: '1.15rem', color: 'var(--heading)' }}>
                {isRTL ? 'إعادة جدولة الموعد' : 'Reschedule Booking'}
              </h4>
              <button type="button" className="modal-close-btn" onClick={() => setShowRescheduleModal(false)}>
                <Icon name="x" size={16} />
              </button>
            </div>

            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: 16 }}>
              {isRTL ? 'اختر تاريخاً ووقتاً جديدين للموعد:' : 'Select a new date and time for the booking:'}
            </p>

            <form onSubmit={handleRescheduleBooking}>
              <div className="form-group" style={{ marginBottom: 14 }}>
                <label className="form-label">{isRTL ? 'التاريخ الجديد' : 'New Date'}</label>
                <input
                  type="date"
                  className="form-input"
                  min={new Date().toISOString().split('T')[0]}
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 14 }}>
                <label className="form-label">{isRTL ? 'الوقت الجديد' : 'New Time'}</label>
                <input
                  type="time"
                  className="form-input"
                  value={rescheduleTime}
                  onChange={(e) => setRescheduleTime(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 18 }}>
                <label className="form-label">{isRTL ? 'سبب التعديل / ملاحظات (اختياري)' : 'Reason / Notes (Optional)'}</label>
                <textarea
                  className="form-input"
                  rows={2}
                  value={rescheduleReason}
                  onChange={(e) => setRescheduleReason(e.target.value)}
                  placeholder={isRTL ? 'أدخل السبب إن وجد...' : 'Enter reason if applicable...'}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowRescheduleModal(false)}>
                  {isRTL ? 'إلغاء' : 'Cancel'}
                </button>
                <button type="submit" className="btn btn-primary btn-sm" disabled={rescheduling}>
                  {rescheduling ? (
                    <>
                      <span className="spinner spinner-sm" style={{ borderTopColor: '#fff' }} />
                      {isRTL ? 'جاري التعديل...' : 'Updating...'}
                    </>
                  ) : (
                    isRTL ? 'تأكيد الجدولة' : 'Confirm Reschedule'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
