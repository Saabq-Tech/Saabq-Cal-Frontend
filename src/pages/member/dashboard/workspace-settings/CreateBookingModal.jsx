import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '../../../../context/LanguageContext';
import { useToast } from '../../../../context/ToastContext';
import client, { endpoints } from '../../../../api/client';
import Icon from '../../../../components/common/Icon';
import SearchableSelect from '../../../../components/common/SearchableSelect';

export default function CreateBookingModal({ isOpen, onClose, onSuccess }) {
  const { t, isRTL } = useLanguage();
  const toast = useToast();

  const [customerMode, setCustomerMode] = useState('existing'); // 'existing' or 'new'

  // Data sources
  const [services, setServices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [members, setMembers] = useState([]);
  const [loadingData, setLoadingData] = useState(false);

  // Form State
  const [serviceId, setServiceId] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [workspaceMemberId, setWorkspaceMemberId] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [status, setStatus] = useState('confirmed');
  const [notes, setNotes] = useState('');
  const [bypassRules, setBypassRules] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  const formatTranslatable = (val) => {
    if (!val) return '';
    if (typeof val === 'string') return val;
    if (typeof val === 'object') {
      return isRTL ? val.ar || val.en || Object.values(val)[0] || '' : val.en || val.ar || Object.values(val)[0] || '';
    }
    return String(val);
  };

  const renderFieldError = (fieldName) => {
    if (!fieldErrors || !fieldErrors[fieldName]) return null;
    const msgs = Array.isArray(fieldErrors[fieldName]) ? fieldErrors[fieldName] : [fieldErrors[fieldName]];
    const text = msgs
      .map((m) => {
        if (m === 'api.field_required') return t('fieldRequired') || 'هذا الحقل مطلوب';
        return t(m) || m;
      })
      .join(' ');
    return (
      <span style={{ color: '#ef4444', fontSize: '0.78rem', fontWeight: 600, marginTop: 4, display: 'block' }}>
        ⚠️ {text}
      </span>
    );
  };

  const getDefaultDateTime = () => {
    const d = new Date();
    d.setHours(d.getHours() + 1);
    d.setMinutes(0);
    d.setSeconds(0);
    const tzOffset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
  };

  useEffect(() => {
    if (!isOpen) return;

    setStartsAt(getDefaultDateTime());
    setErrorMessage(null);
    setFieldErrors({});
    setServiceId('');
    setCustomerId('');
    setCustomerName('');
    setCustomerEmail('');
    setCustomerPhone('');
    setWorkspaceMemberId('');
    setStatus('confirmed');
    setNotes('');
    setBypassRules(false);

    const fetchData = async () => {
      setLoadingData(true);
      try {
        const [servicesRes, customersRes, membersRes] = await Promise.allSettled([
          client.get(endpoints.workspaceServices),
          client.get(endpoints.workspaceCustomers, { params: { per_page: 1000 } }),
          client.get(endpoints.workspaceMembers),
        ]);

        if (servicesRes.status === 'fulfilled') {
          const list = servicesRes.value.data?.data || [];
          setServices(list);
          if (list.length > 0) {
            setServiceId(list[0].id);
          }
        }
        if (customersRes.status === 'fulfilled') {
          setCustomers(customersRes.value.data?.data || []);
        }
        if (membersRes.status === 'fulfilled') {
          setMembers(membersRes.value.data?.data || []);
        }
      } catch (err) {
        console.error('Failed to fetch booking metadata options:', err);
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!serviceId) {
      setErrorMessage(t('selectServicePrompt') || 'يرجى اختيار الخدمة');
      return;
    }

    if (!startsAt) {
      setErrorMessage(t('selectDatePrompt') || 'يرجى تحديد موعد الحجز');
      return;
    }

    if (customerMode === 'existing' && !customerId) {
      setErrorMessage(t('selectCustomerPrompt') || 'يرجى اختيار العميل');
      return;
    }

    if (customerMode === 'new' && (!customerName || !customerEmail)) {
      setErrorMessage(t('enterCustomerDetails') || 'يرجى إدخال اسم العميل والبريد الإلكتروني');
      return;
    }

    const payload = {
      service_id: Number(serviceId),
      starts_at: startsAt.replace('T', ' '),
      status: status,
      notes: notes || null,
      workspace_member_id: workspaceMemberId ? Number(workspaceMemberId) : null,
      bypass_booking_rules: bypassRules,
      source: 'admin_manual',
    };

    if (customerMode === 'existing') {
      payload.customer_id = Number(customerId);
    } else {
      payload.customer_name = customerName;
      payload.customer_email = customerEmail;
      payload.customer_phone = customerPhone || null;
    }

    try {
      setSubmitting(true);
      await client.post(endpoints.workspaceBookings, payload);

      toast.success(t('bookingCreatedSuccess') || 'تم حجز الموعد بنجاح!');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('Create booking failed:', err);
      const errorsObj = err.response?.data?.errors;
      if (errorsObj) {
        setFieldErrors(errorsObj);
        const msgs = Object.values(errorsObj)
          .flat()
          .map((m) => {
            if (m === 'api.field_required') return t('fieldRequired') || 'هذا الحقل مطلوب';
            return t(m) || m;
          });
        setErrorMessage(msgs.join(' '));
      } else {
        const rawMsg = err.response?.data?.message;
        const msg = rawMsg === 'api.field_required' ? (t('fieldRequired') || 'هذا الحقل مطلوب') : (t(rawMsg) || rawMsg || t('bookingCreateError') || 'فشل إضافة الحجز');
        setErrorMessage(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999999,
        background: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: 620,
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: 24,
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-xl)',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingBottom: 12, borderBottom: '1px solid var(--border-light)' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--heading)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon name="calendar" size={20} />
              <span>{t('createBookingForClient') || 'حجز موعد جديد لعميل'}</span>
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              border: 'none',
              background: 'transparent',
              color: 'var(--muted)',
              cursor: 'pointer',
              padding: 6,
              borderRadius: 8,
            }}
          >
            <Icon name="x" size={20} />
          </button>
        </div>

        {/* Error Banner */}
        {errorMessage && (
          <div style={{ padding: '12px 16px', background: 'rgba(239, 68, 68, 0.12)', color: '#dc2626', borderRadius: 'var(--radius-md)', fontSize: '0.86rem', fontWeight: 600, marginBottom: 18, border: '1px solid rgba(239, 68, 68, 0.2)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon name="alert-triangle" size={16} />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Service Selection */}
          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 700, fontSize: '0.86rem', marginBottom: 6 }}>
              {t('serviceHeader') || 'الخدمة'} <span style={{ color: 'red' }}>*</span>
            </label>
            <select
              className="form-input"
              value={serviceId}
              onChange={(e) => setServiceId(e.target.value)}
              required
              disabled={loadingData}
            >
              <option value="">{t('selectServicePrompt') || 'اختر الخدمة...'}</option>
              {services.map((s) => {
                const sTitle = formatTranslatable(s.name || s.title);
                return (
                  <option key={s.id} value={s.id}>
                    {sTitle} ({s.duration_minutes || s.duration || 30} {t('mins') || 'دقيقة'} - {s.price || 0} {formatTranslatable(s.currency) || 'SAR'})
                  </option>
                );
              })}
            </select>
          </div>

          {/* Customer Selection Mode */}
          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 700, fontSize: '0.86rem', marginBottom: 6 }}>
              {t('customerHeader') || 'العميل'} <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, padding: 4, background: 'var(--surface-alt)', borderRadius: 'var(--radius-md)', marginBottom: 10 }}>
              <button
                type="button"
                onClick={() => setCustomerMode('existing')}
                style={{
                  padding: '8px 12px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  background: customerMode === 'existing' ? 'var(--primary)' : 'var(--surface)',
                  color: customerMode === 'existing' ? '#ffffff' : 'var(--text-secondary)',
                  border: customerMode === 'existing' ? '1px solid var(--primary)' : '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: customerMode === 'existing' ? '0 2px 8px rgba(17, 100, 106, 0.25)' : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <Icon name="user" size={14} />
                <span>{t('existingCustomerTab') || 'عميل مسجل'}</span>
              </button>
              <button
                type="button"
                onClick={() => setCustomerMode('new')}
                style={{
                  padding: '8px 12px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  background: customerMode === 'new' ? 'var(--primary)' : 'var(--surface)',
                  color: customerMode === 'new' ? '#ffffff' : 'var(--text-secondary)',
                  border: customerMode === 'new' ? '1px solid var(--primary)' : '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: customerMode === 'new' ? '0 2px 8px rgba(17, 100, 106, 0.25)' : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <Icon name="plus" size={14} />
                <span>{t('newCustomerTab') || 'عميل جديد (إنشاء سريع)'}</span>
              </button>
            </div>

            {customerMode === 'existing' ? (
              <div>
                <SearchableSelect
                  value={customerId}
                  onChange={(val) => setCustomerId(val)}
                  options={customers.map((c) => {
                    const cName = formatTranslatable(c.name);
                    const cEmail = formatTranslatable(c.email);
                    return {
                      value: c.id,
                      label: `${cName}${cEmail ? ` (${cEmail})` : ''}`,
                    };
                  })}
                  placeholder={t('selectCustomerPrompt') || 'اختر العميل...'}
                  searchPlaceholder={t('searchCustomerPrompt') || 'بحث باسم العميل أو البريد...'}
                  disabled={loadingData}
                  error={Boolean(fieldErrors.customer_id)}
                />
                {renderFieldError('customer_id')}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div>
                  <label className="form-label" style={{ fontWeight: 700, fontSize: '0.82rem', marginBottom: 4, display: 'block' }}>
                    {t('customerName') || 'اسم العميل'} <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder={t('customerName') || 'اسم العميل'}
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    required={customerMode === 'new'}
                    style={{ border: fieldErrors.customer_name ? '1px solid #ef4444' : undefined }}
                  />
                  {renderFieldError('customer_name')}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label className="form-label" style={{ fontWeight: 700, fontSize: '0.82rem', marginBottom: 4, display: 'block' }}>
                      {t('email') || 'البريد الإلكتروني'} <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="email"
                      className="form-input"
                      placeholder={t('email') || 'البريد الإلكتروني'}
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      required={customerMode === 'new'}
                      style={{ border: fieldErrors.customer_email ? '1px solid #ef4444' : undefined }}
                    />
                    {renderFieldError('customer_email')}
                  </div>
                  <div>
                    <label className="form-label" style={{ fontWeight: 700, fontSize: '0.82rem', marginBottom: 4, display: 'block' }}>
                      {t('phone') || 'رقم الجوال'}
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder={t('phone') || 'رقم الجوال'}
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      style={{ border: fieldErrors.customer_phone ? '1px solid #ef4444' : undefined }}
                    />
                    {renderFieldError('customer_phone')}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Member & Datetime Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 700, fontSize: '0.86rem', marginBottom: 6 }}>
                {t('member') || 'الموظف / مقدم الخدمة'}
              </label>
              <select
                className="form-input"
                value={workspaceMemberId}
                onChange={(e) => setWorkspaceMemberId(e.target.value)}
                disabled={loadingData}
              >
                <option value="">{t('selectStaffPrompt') || 'اختر الموظف...'}</option>
                {members.map((m) => {
                  const mName = formatTranslatable(m.name || m.user?.name);
                  const rName = formatTranslatable(m.role?.name || m.role?.title) || (t('member') || 'عضو');
                  return (
                    <option key={m.id} value={m.id}>
                      {mName} ({rName})
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 700, fontSize: '0.86rem', marginBottom: 6 }}>
                {t('bookingDateHeader') || 'تاريخ ووقت الحجز'} <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                type="datetime-local"
                className="form-input"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Status & Bypass Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, alignItems: 'center' }}>
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 700, fontSize: '0.86rem', marginBottom: 6 }}>
                {t('statusHeader') || 'حالة الحجز'}
              </label>
              <select
                className="form-input"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="confirmed">{t('statusConfirmed') || 'مؤكد'}</option>
                <option value="pending">{t('statusPending') || 'قيد الانتظار'}</option>
                <option value="completed">{t('statusCompleted') || 'مكتمل'}</option>
              </select>
            </div>

            <div className="form-group" style={{ paddingTop: 18 }}>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.84rem', fontWeight: 700, color: 'var(--heading)' }}>
                <input
                  type="checkbox"
                  checked={bypassRules}
                  onChange={(e) => setBypassRules(e.target.checked)}
                  style={{ width: 16, height: 16, accentColor: 'var(--primary)' }}
                />
                <Icon name="zap" size={14} />
                <span>{t('bypassRulesLabel') || 'تجاوز قواعد المساحة'}</span>
              </label>
            </div>
          </div>

          {/* Notes */}
          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 700, fontSize: '0.86rem', marginBottom: 6 }}>
              {t('notes') || 'ملاحظات جانبية'}
            </label>
            <textarea
              className="form-input"
              rows={2}
              placeholder={t('bookingNotesPlaceholder') || 'ملاحظات الحجز المباشر بالسنترال أو الفرع...'}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12, paddingTop: 16, borderTop: '1px solid var(--border-light)' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={submitting}
              style={{ fontWeight: 700 }}
            >
              {t('cancel') || 'إلغاء'}
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
              style={{ fontWeight: 800, padding: '8px 24px', display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <Icon name="plus" size={14} />
              <span>{submitting ? (t('saving') || 'جاري الحفظ...') : (t('createBookingForClient') || 'حجز الموعد')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
