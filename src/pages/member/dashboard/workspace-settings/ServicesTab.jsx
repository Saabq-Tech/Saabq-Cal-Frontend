import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '../../../../context/LanguageContext';
import { useToast } from '../../../../context/ToastContext';
import { useAuth } from '../../../../context/AuthContext';
import UserAvatar from '../../../../components/ui/UserAvatar';
import Icon from '../../../../components/common/Icon';
import client, { endpoints } from '../../../../api/client';


const defaultFormState = {
  id: null,
  name_ar: '',
  name_en: '',
  short_description_ar: '',
  short_description_en: '',
  description_ar: '',
  description_en: '',
  duration_minutes: 30,
  price: 0,
  currency: 'SAR',
  buffer_before_minutes: 0,
  buffer_after_minutes: 0,
  capacity: 1,
  booking_mode: 'instant',
  requires_meeting: false,
  location: '',
  status: 'active',
  is_featured: false,
  booking_enabled: true,
  minimum_booking_notice_minutes: 0,
  maximum_booking_days: 30,
  workspace_member_id: '',
};

export default function ServicesTab({ services, members = [], canEdit, onSaveService }) {
  const { t, isRTL } = useLanguage();
  const { user } = useAuth();
  const toast = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState(defaultFormState);
  const [availableCurrencies, setAvailableCurrencies] = useState(() => [
    { id: 1, code: 'SAR', name: isRTL ? 'ريال سعودي' : 'Saudi Riyal', symbol_native: isRTL ? 'ر.س' : 'SAR' },
    { id: 2, code: 'EGP', name: isRTL ? 'جنيه مصري' : 'Egyptian Pound', symbol_native: isRTL ? 'ج.م' : 'EGP' },
  ]);

  useEffect(() => {
    let isMounted = true;
    client.get(endpoints.currencies)
      .then((res) => {
        if (isMounted && res.data?.data && Array.isArray(res.data.data)) {
          setAvailableCurrencies(res.data.data);
        }
      })
      .catch((err) => console.error('Failed to fetch currencies:', err));
    return () => { isMounted = false; };
  }, []);

  const getCustomerBookingUrl = (service) => {
    const workspaceSlug = user?.workspace?.slug || user?.workspace_slug || 'default';
    const serviceSlug = typeof service === 'object' ? (service.slug || service.id) : service;
    return `${window.location.origin}/workspaces/${workspaceSlug}/book?service=${serviceSlug}`;
  };

  const handleCopyBookingLink = (e, service) => {
    e.preventDefault();
    e.stopPropagation();
    const url = getCustomerBookingUrl(service);
    navigator.clipboard.writeText(url);
    toast.success(t('bookingLinkCopied') || 'تم نسخ رابط حجز الخدمة بنجاح!');
  };

  const handleOpenCreate = () => {
    setForm(defaultFormState);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (service) => {
    const getFieldVal = (field, lang) => {
      const val = service[field];
      if (typeof val === 'object' && val !== null) {
        return val[lang] || '';
      }
      if (typeof val === 'string') {
        if (lang === 'ar') return val;
        return service[`${field}_en`] || '';
      }
      return '';
    };

    const nameAr = getFieldVal('name', 'ar');
    const nameEn = getFieldVal('name', 'en');
    const shortDescAr = getFieldVal('short_description', 'ar');
    const shortDescEn = getFieldVal('short_description', 'en');
    const descAr = getFieldVal('description', 'ar');
    const descEn = getFieldVal('description', 'en');

    const currencyCode =
      (typeof service.currency === 'object' && service.currency?.code) ||
      (typeof service.currency_detail === 'object' && service.currency_detail?.code) ||
      (typeof service.currency === 'string' && service.currency) ||
      service.currency_code ||
      (availableCurrencies && availableCurrencies.length > 0 ? availableCurrencies[0].code : 'SAR');

    const matchedCurr = availableCurrencies?.find((c) => c.code === currencyCode || c.id === service.currency_id || c.id === service.currency?.id);

    setForm({
      id: service.id,
      name_ar: nameAr,
      name_en: nameEn,
      short_description_ar: shortDescAr,
      short_description_en: shortDescEn,
      description_ar: descAr,
      description_en: descEn,
      duration_minutes: service.duration_minutes ?? service.duration ?? 30,
      price: service.price ?? 0,
      currency: matchedCurr?.code || currencyCode,
      currency_id: matchedCurr?.id || service.currency_id || service.currency?.id || 1,
      buffer_before_minutes: service.buffer_before_minutes ?? 0,
      buffer_after_minutes: service.buffer_after_minutes ?? 0,
      capacity: service.capacity ?? 1,
      booking_mode: service.booking_mode || 'instant',
      requires_meeting: service.requires_meeting ?? false,
      location: service.location || '',
      status: service.status || 'active',
      is_featured: service.is_featured ?? false,
      booking_enabled: service.booking_enabled ?? true,
      minimum_booking_notice_minutes: service.minimum_booking_notice_minutes ?? 0,
      maximum_booking_days: service.maximum_booking_days ?? 30,
      workspace_member_id: service.workspace_member_id || service.workspace_member?.id || '',
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

      const selectedCurr = availableCurrencies.find((c) => c.code === form.currency);

      const payload = {
        ...rest,
        capacity: form.capacity !== '' && form.capacity !== null && form.capacity !== undefined ? parseInt(form.capacity, 10) : 1,
        duration_minutes: form.duration_minutes !== '' && form.duration_minutes !== null ? parseInt(form.duration_minutes, 10) : 30,
        price: form.price !== '' && form.price !== null ? parseFloat(form.price) : 0,
        buffer_before_minutes: form.buffer_before_minutes ? parseInt(form.buffer_before_minutes, 10) : 0,
        buffer_after_minutes: form.buffer_after_minutes ? parseInt(form.buffer_after_minutes, 10) : 0,
        minimum_booking_notice_minutes: form.minimum_booking_notice_minutes ? parseInt(form.minimum_booking_notice_minutes, 10) : 0,
        maximum_booking_days: form.maximum_booking_days ? parseInt(form.maximum_booking_days, 10) : 30,
        currency_id: selectedCurr?.id || form.currency_id || null,
        workspace_member_id: form.workspace_member_id ? parseInt(form.workspace_member_id, 10) : null,
        name: {
          ar: name_ar || name_en || '',
          en: name_en || name_ar || '',
        },
        short_description: {
          ar: short_description_ar || '',
          en: short_description_en || '',
        },
        description: {
          ar: description_ar || '',
          en: description_en || '',
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14, marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--heading)' }}>
            {t('workspaceServices') || (isRTL ? 'إدارة خدمات المساحة' : 'Workspace Services Management')}
          </h2>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
            {t('workspaceServicesDesc') || (isRTL ? 'إضافة وتحديث جميع بيانات وقواعد وإعدادات الخدمات المتاحة للحجز.' : 'Manage customer services, pricing, and durations')}
          </p>
        </div>
        {canEdit ? (
          <button className="btn btn-primary btn-sm" onClick={handleOpenCreate}>
            + {t('addService') || (isRTL ? 'إضافة خدمة جديدة' : 'Add New Service')}
          </button>
        ) : (
          <span className="profile-badge unverified" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <Icon name="lock" size={12} />
            {t('readOnlyNotice') || (isRTL ? 'العرض فقط (بدون تعديل)' : 'Read-only mode')}
          </span>
        )}
      </div>

      {/* Services Grid */}
      {servicesList.length === 0 ? (
        <div style={{ padding: '48px 20px', textAlign: 'center', background: 'var(--surface-alt)', borderRadius: 'var(--radius-lg)', border: '1px border-dashed var(--border)' }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--primary-subtle)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
            <Icon name="custom-bc148024" size={24} />
          </div>
          <h4 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 6px', color: 'var(--heading)' }}>
            {t('noServicesFound') || (isRTL ? 'لا توجد خدمات مضافة حالياً في مساحة العمل' : 'No services found in this workspace')}
          </h4>
          <p style={{ fontSize: '0.85rem', color: 'var(--muted)', margin: '0 0 16px' }}>
            {t('noServicesDesc') || (isRTL ? 'قم بإضافة خدماتك الأولى لتتيح للعملاء اختيارها وحجز المواعيد.' : 'Add your first service to allow customers to select and book appointments.')}
          </p>
          {canEdit && (
            <button className="btn btn-primary btn-sm" onClick={handleOpenCreate}>
              + {t('addFirstService') || (isRTL ? 'إضافة أول خدمة' : 'Add First Service')}
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 250px), 1fr))', gap: 18 }}>
          {servicesList.map((s) => {
            const _isEnabled = s.booking_enabled ?? true;
            const isFeatured = s.is_featured ?? false;
            const duration = s.duration_minutes || s.duration || 30;
            const price = s.price ?? 0;
            const currency = s.currency || 'SAR';

            const nameDisplay = typeof s.name === 'object' ? (isRTL ? s.name?.ar || s.name?.en : s.name?.en || s.name?.ar) : (s.name || s.title);
            const shortDescDisplay = typeof s.short_description === 'object' ? (isRTL ? s.short_description?.ar || s.short_description?.en : s.short_description?.en || s.short_description?.ar) : s.short_description;
            const descDisplay = typeof s.description === 'object' ? (isRTL ? s.description?.ar || s.description?.en : s.description?.en || s.description?.ar) : s.description;

            return (
              <div
                key={s.id}
                style={{
                  padding: '16px 14px',
                  borderRadius: 'var(--radius-lg)',
                  border: isFeatured ? '1.5px solid var(--primary)' : '1px solid var(--border-light)',
                  background: 'var(--surface)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: 14,
                  boxShadow: isFeatured ? '0 4px 14px rgba(17, 100, 106, 0.08)' : '0 2px 10px rgba(0,0,0,0.02)',
                  position: 'relative',
                }}
                className="hover-card"
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 10 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: 'var(--heading)' }}>{nameDisplay}</h3>
                        {isFeatured && (
                          <span style={{ fontSize: '0.7rem', background: '#fef3c7', color: '#b45309', padding: '2px 8px', borderRadius: 12, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <Icon name="custom-5768860f" size={12} />
                            {t('featured') || (isRTL ? 'مميزة' : 'Featured')}
                          </span>
                        )}

                        {/* 1. Service Status Badge (active / draft / archived) */}
                        <span
                          style={{
                            fontSize: '0.7rem',
                            padding: '2px 8px',
                            borderRadius: 12,
                            fontWeight: 700,
                            background: s.status === 'active' ? '#dcfce7' : (s.status === 'draft' ? '#fef3c7' : '#f3f4f6'),
                            color: s.status === 'active' ? '#15803d' : (s.status === 'draft' ? '#b45309' : '#4b5563'),
                          }}
                        >
                          {s.status === 'active' ? (t('statusActive') || (isRTL ? 'نشطة' : 'Active')) : (s.status === 'draft' ? (t('statusDraft') || (isRTL ? 'مسودة' : 'Draft')) : (t('statusArchived') || (isRTL ? 'مؤرشفة' : 'Archived')))}
                        </span>

                        {/* 2. Online Booking Status Badge (enabled / disabled) */}
                        <span
                          style={{
                            fontSize: '0.7rem',
                            padding: '2px 8px',
                            borderRadius: 12,
                            fontWeight: 700,
                            background: s.booking_enabled ? '#ccfbf1' : '#fee2e2',
                            color: s.booking_enabled ? '#0f766e' : '#991b1b',
                          }}
                        >
                          {s.booking_enabled ? (t('bookingActive') || (isRTL ? 'الحجز أونلاين مفعّل' : 'Online Booking Active')) : (t('bookingDisabled') || (isRTL ? 'الحجز أونلاين معطّل' : 'Online Booking Disabled'))}
                        </span>
                      </div>
                      {shortDescDisplay && (
                        <p style={{ fontSize: '0.8rem', color: 'var(--primary)', margin: '4px 0 0', fontWeight: 600 }}>
                          {shortDescDisplay}
                        </p>
                      )}
                    </div>

                    <span className="profile-badge verified" style={{ fontSize: '0.78rem', padding: '3px 10px', display: 'inline-flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                      <Icon name="custom-56f3550d" size={12} />
                      {duration} {t('minUnit') || (isRTL ? 'دقيقة' : 'min')}
                    </span>
                  </div>

                  <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0 0 10px' }}>
                    {descDisplay || t('noServiceDescription') || (isRTL ? 'لا يوجد وصف تفصيلي مضاف لهذه الخدمة.' : 'No detailed description provided for this service.')}
                  </p>

                  {/* Metadata Chips */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
                    {s.location && (
                      <span style={{ fontSize: '0.76rem', background: 'var(--surface-alt)', padding: '3px 9px', borderRadius: 6, color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <Icon name="map-pin" size={12} />
                        {s.location}
                      </span>
                    )}
                    {s.capacity > 1 && (
                      <span style={{ fontSize: '0.76rem', background: 'var(--surface-alt)', padding: '3px 9px', borderRadius: 6, color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <Icon name="custom-0c2e06fd" size={12} />
                        {s.capacity} {t('persons') || (isRTL ? 'أشخاص' : 'persons')}
                      </span>
                    )}
                    {s.booking_mode === 'confirmation' && (
                      <span style={{ fontSize: '0.76rem', background: '#eff6ff', color: '#1d4ed8', padding: '3px 9px', borderRadius: 6, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <Icon name="copy" size={12} />
                        {t('requiresApproval') || (isRTL ? 'تأكيد يدوي' : 'Manual Approval')}
                      </span>
                    )}
                  </div>

                  {/* Service Provider Info Badge */}
                  {(() => {
                    const provider = s.workspace_member;
                    const providerName = provider?.name || (user?.name ? `${user.name}` : (t('workspaceOwner') || (isRTL ? 'مالك مساحة العمل' : 'Workspace Owner')));
                    const providerTitle = provider?.title || user?.title || '';
                    const providerAvatar = provider?.avatar_url || user?.avatar_url;
                    const _providerInitial = providerName ? providerName.charAt(0).toUpperCase() : 'P';

                    return (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, padding: '6px 10px', background: 'var(--surface-alt)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                        <UserAvatar name={providerName} avatarUrl={providerAvatar} size={24} />
                        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                          <span style={{ fontSize: '0.68rem', color: 'var(--muted)', fontWeight: 600, lineHeight: 1.1 }}>
                            {t('serviceProvider') || (isRTL ? 'مقدم الخدمة:' : 'Service Provider:')}
                          </span>
                          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--heading)', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {providerName} {providerTitle && <span style={{ fontWeight: 500, color: 'var(--muted)', fontSize: '0.76rem' }}>({providerTitle})</span>}
                          </span>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTop: '1px solid var(--border-light)', flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '1.1rem' }}>
                    {price > 0 ? `${price} ${currency?.symbol || currency}` : (t('freeService') || (isRTL ? 'مجاناً' : 'Free'))}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    {s.booking_enabled ? (
                      <a
                        href={getCustomerBookingUrl(s)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-secondary btn-sm"
                        style={{
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          padding: '5px 10px',
                          textDecoration: 'none',
                          borderRadius: 'var(--radius-md)',
                        }}
                        title={t('openCustomerBookingPage') || 'فتح صفحة الحجز للعميل'}
                      >
                        <Icon name="external-link" size={13} />
                        {t('customerBookingPage') || 'صفحة الحجز'}
                      </a>
                    ) : (
                      <span
                        className="btn btn-ghost btn-sm"
                        style={{
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          opacity: 0.65,
                          cursor: 'not-allowed',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          padding: '5px 10px',
                          background: 'var(--surface-alt)',
                          border: '1px solid var(--border-light)',
                          color: 'var(--muted)',
                        }}
                        title={t('bookingDisabledNotice') || 'الحجز أونلاين معطّل لهذه الخدمة'}
                      >
                        <Icon name="external-link" size={13} />
                        {t('bookingDisabled') || 'الحجز معطّل'}
                      </span>
                    )}

                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={(e) => handleCopyBookingLink(e, s)}
                      style={{
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '5px 8px',
                        color: 'var(--text-secondary)',
                      }}
                      title={t('copyBookingLink') || 'نسخ رابط الحجز المباشر'}
                    >
                      <Icon name="copy" size={13} />
                    </button>

                    {canEdit && (
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => handleOpenEdit(s)}
                        style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '0.78rem', padding: '5px 8px' }}
                      >
                        {t('editService') || 'تعديل الخدمة'}
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
      {isModalOpen && createPortal(
        <div className="modal-backdrop">
          <div className="modal-card animate-fade-in-up" style={{ maxWidth: 720, width: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header" style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: 14 }}>
              <h3 className="modal-title" style={{ fontSize: '1.1rem', fontWeight: 800 }}>
                {form.id ? (t('editServiceTitle') || 'تعديل بيانات الخدمة') : (t('addServiceTitle') || 'إضافة خدمة جديدة')}
              </h3>
              <button type="button" className="modal-close-btn" onClick={() => setIsModalOpen(false)}>
                <Icon name="x" size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="modal-body" style={{ overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Section 1: Basic Info (Multilingual AR & EN) */}
              <div style={{ background: 'var(--surface-alt)', padding: 14, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                <h4 style={{ fontSize: '0.88rem', fontWeight: 800, margin: '0 0 14px', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Icon name="custom-4e988051" size={16} style={{ color: 'var(--primary)' }} />
                  {t('basicServiceInfo') || 'البيانات الأساسية للخدمة'}
                </h4>
                
                {/* Service Name Inputs */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12, marginBottom: 12 }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 700 }}>
                      {t('serviceNameAr') || 'اسم الخدمة (بالعربية)'}
                      <span style={{ color: '#ef4444', marginInlineStart: 4, fontWeight: 700 }}>*</span>
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={form.name_ar}
                      onChange={(e) => setForm({ ...form, name_ar: e.target.value })}
                      placeholder={t('serviceNamePlaceholder') || 'مثال: استشارة استراتيجية 45 دقيقة'}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 700 }}>
                      {t('serviceNameEn') || 'Service Name (English)'}
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={form.name_en}
                      onChange={(e) => setForm({ ...form, name_en: e.target.value })}
                      placeholder="e.g. 45-min Strategy Consultation"
                    />
                  </div>
                </div>

                {/* Service Provider Selection Dropdown */}
                <div className="form-group" style={{ marginBottom: 12 }}>
                  <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 700 }}>
                    {t('serviceProviderField') || 'مقدم الخدمة (المستشار / العضو)'}
                  </label>
                  <select
                    className="form-select"
                    value={form.workspace_member_id}
                    onChange={(e) => setForm({ ...form, workspace_member_id: e.target.value })}
                    style={{ width: '100%' }}
                  >
                    <option value="">{t('allWorkspaceMembers') || 'جميع أعضاء مساحة العمل (عامة)'}</option>
                    {Array.isArray(members) && members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} {m.title ? `(${m.title})` : ''} {m.is_owner ? `— ${t('owner') || 'مالك'}` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Short Description Inputs */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12, marginBottom: 12 }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 700 }}>
                      {t('shortDescAr') || 'نبذة قصيرة (بالعربية)'}
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={form.short_description_ar}
                      onChange={(e) => setForm({ ...form, short_description_ar: e.target.value })}
                      placeholder={t('shortDescPlaceholder') || 'ملخص من جملة واحدة يظهر في البطاقات والمقترحات'}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 700 }}>
                      {t('shortDescEn') || 'Short Description (English)'}
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={form.short_description_en}
                      onChange={(e) => setForm({ ...form, short_description_en: e.target.value })}
                      placeholder="One-line summary shown in cards"
                    />
                  </div>
                </div>

                {/* Full Description Inputs */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 700 }}>
                      {t('descriptionAr') || 'الوصف التفصيلي (بالعربية)'}
                    </label>
                    <textarea
                      className="form-textarea"
                      value={form.description_ar}
                      onChange={(e) => setForm({ ...form, description_ar: e.target.value })}
                      rows={3}
                      placeholder={t('fullDescPlaceholder') || 'شرح كامل عن تفاصيل وما سيتلقاه العميل خلال هذه الخدمة...'}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 700 }}>
                      {t('descriptionEn') || 'Detailed Description (English)'}
                    </label>
                    <textarea
                      className="form-textarea"
                      value={form.description_en}
                      onChange={(e) => setForm({ ...form, description_en: e.target.value })}
                      rows={3}
                      placeholder="Full description of service details..."
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Pricing, Duration & Capacity */}
              <div style={{ background: 'var(--surface-alt)', padding: 14, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                <h4 style={{ fontSize: '0.88rem', fontWeight: 800, margin: '0 0 12px', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Icon name="credit-card" size={16} style={{ color: 'var(--primary)' }} />
                  {t('pricingAndCapacity') || 'المدة والتسعير والسعة'}
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 700 }}>
                      {t('durationMinutesLabel') || 'المدة (دقائق)'}
                      <span style={{ color: '#ef4444', marginInlineStart: 4, fontWeight: 700 }}>*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      className="form-input"
                      value={form.duration_minutes ?? ''}
                      onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 700 }}>
                      {t('priceLabel') || 'السعر'}
                      <span style={{ color: '#ef4444', marginInlineStart: 4, fontWeight: 700 }}>*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="form-input"
                      value={form.price ?? ''}
                      onChange={(e) => setForm({ ...form, price: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 700 }}>
                      {t('currencyLabel') || 'العملة'}
                    </label>
                    <select
                      className="form-input"
                      value={form.currency || 'SAR'}
                      onChange={(e) => {
                        const selectedCode = e.target.value;
                        const selectedCurr = availableCurrencies.find((c) => c.code === selectedCode);
                        setForm({
                          ...form,
                          currency: selectedCode,
                          currency_id: selectedCurr?.id || form.currency_id,
                        });
                      }}
                    >
                      {availableCurrencies.map((c) => {
                        const nameStr = typeof c.name === 'object' ? (c.name[isRTL ? 'ar' : 'en'] || c.name.ar || c.name.en || c.code) : (c.name || c.code);
                        const symbolStr = c.symbol_native || c.symbol || c.code;
                        return (
                          <option key={c.id || c.code} value={c.code}>
                            {c.code} - {nameStr} ({symbolStr})
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 700 }}>
                      {t('capacityLabel') || 'السعة (عدد الحضور)'}
                    </label>
                    <input
                      type="number"
                      min="1"
                      className="form-input"
                      value={form.capacity ?? ''}
                      onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Location & Booking Mode */}
              <div style={{ background: 'var(--surface-alt)', padding: 14, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                <h4 style={{ fontSize: '0.88rem', fontWeight: 800, margin: '0 0 12px', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Icon name="map-pin" size={16} style={{ color: 'var(--primary)' }} />
                  {t('locationAndMode') || 'مكان ورابط نمط الحجز'}
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 12 }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 700 }}>
                      {t('bookingModeLabel') || 'نمط الحجز'}
                    </label>
                    <select
                      className="form-input"
                      value={form.booking_mode}
                      onChange={(e) => setForm({ ...form, booking_mode: e.target.value })}
                    >
                      <option value="instant">{t('instantBooking') || 'حجز فوري مباشر'}</option>
                      <option value="confirmation">{t('confirmationBooking') || 'يتطلب موافقة المستشار'}</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 700 }}>
                      {t('locationLabel') || 'الموقع / رابط الاجتماع'}
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={form.location}
                      onChange={(e) => setForm({ ...form, location: e.target.value })}
                      placeholder={t('locationPlaceholder') || 'Google Meet, Zoom...'}
                    />
                  </div>
                </div>

                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: '0.84rem', fontWeight: 700, color: 'var(--heading)' }}>
                  <input
                    type="checkbox"
                    checked={form.requires_meeting}
                    onChange={(e) => setForm({ ...form, requires_meeting: e.target.checked })}
                    style={{ accentColor: 'var(--primary)', width: 17, height: 17 }}
                  />
                  <Icon name="video" size={16} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                  <span>{t('requiresMeetingLabel') || 'يتطلب إنشاء رابط اجتماع أونلاين تلقائياً (Video Meeting)'}</span>
                </label>
              </div>

              {/* Section 4: Buffer & Notice Rules */}
              <div style={{ background: 'var(--surface-alt)', padding: 14, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                <h4 style={{ fontSize: '0.88rem', fontWeight: 800, margin: '0 0 12px', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Icon name="clock" size={16} style={{ color: 'var(--primary)' }} />
                  {t('buffersAndNotices') || 'الفواصل والمهلة الزمنية الخاصة بالخدمة'}
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: 2 }}>
                      {t('bufferBeforeLabel') || 'فاصل قبل الحجز (دقائق)'}
                    </label>
                    <span style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-secondary)', marginBottom: 6, lineHeight: 1.35 }}>
                      {t('bufferBeforeDesc')}
                    </span>
                    <input
                      type="number"
                      min="0"
                      className="form-input"
                      value={form.buffer_before_minutes ?? ''}
                      onChange={(e) => setForm({ ...form, buffer_before_minutes: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: 2 }}>
                      {t('bufferAfterLabel') || 'فاصل بعد الحجز (دقائق)'}
                    </label>
                    <span style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-secondary)', marginBottom: 6, lineHeight: 1.35 }}>
                      {t('bufferAfterDesc')}
                    </span>
                    <input
                      type="number"
                      min="0"
                      className="form-input"
                      value={form.buffer_after_minutes ?? ''}
                      onChange={(e) => setForm({ ...form, buffer_after_minutes: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: 2 }}>
                      {t('minNoticeLabel') || 'أقل مهلة للإشعار (دقائق)'}
                    </label>
                    <span style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-secondary)', marginBottom: 6, lineHeight: 1.35 }}>
                      {t('minNoticeDesc')}
                    </span>
                    <input
                      type="number"
                      min="0"
                      className="form-input"
                      value={form.minimum_booking_notice_minutes ?? ''}
                      onChange={(e) => setForm({ ...form, minimum_booking_notice_minutes: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: 2 }}>
                      {t('maxDaysLabel') || 'أقصى مدى للحجز (أيام)'}
                    </label>
                    <span style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-secondary)', marginBottom: 6, lineHeight: 1.35 }}>
                      {t('maxDaysDesc')}
                    </span>
                    <input
                      type="number"
                      min="1"
                      max="365"
                      className="form-input"
                      value={form.maximum_booking_days ?? ''}
                      onChange={(e) => setForm({ ...form, maximum_booking_days: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Section 5: Status & Badges */}
              <div style={{ background: 'var(--surface-alt)', padding: 14, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                <h4 style={{ fontSize: '0.88rem', fontWeight: 800, margin: '0 0 12px', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Icon name="custom-70641804" size={16} style={{ color: 'var(--primary)' }} />
                  {t('statusAndBadges') || 'حالة الخدمة والتفعيل'}
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, alignItems: 'center' }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 700 }}>
                      {t('statusLabel') || 'حالة الخدمة'}
                    </label>
                    <select
                      className="form-input"
                      value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value })}
                    >
                      <option value="active">{t('statusActive') || 'نشطة (Active)'}</option>
                      <option value="draft">{t('statusDraft') || 'مسودة (Draft)'}</option>
                      <option value="archived">{t('statusArchived') || 'مؤرشفة (Archived)'}</option>
                    </select>
                  </div>

                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.84rem', fontWeight: 700, paddingTop: 18 }}>
                    <input
                      type="checkbox"
                      checked={form.booking_enabled}
                      onChange={(e) => setForm({ ...form, booking_enabled: e.target.checked })}
                      style={{ accentColor: 'var(--primary)', width: 17, height: 17 }}
                    />
                    <span>{t('enableBookingToggle') || 'تفعيل إمكانية الحجز أونلاين'}</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.84rem', fontWeight: 700, paddingTop: 18 }}>
                    <input
                      type="checkbox"
                      checked={form.is_featured}
                      onChange={(e) => setForm({ ...form, is_featured: e.target.checked })}
                      style={{ accentColor: 'var(--primary)', width: 17, height: 17 }}
                    />
                    <Icon name="custom-5768860f" size={14} style={{ color: '#b45309' }} />
                    <span>{t('featureServiceToggle') || 'تميز الخدمة (Featured)'}</span>
                  </label>
                </div>
              </div>

              {/* Modal Action Buttons */}
              <div className="modal-actions" style={{ borderTop: '1px solid var(--border-light)', paddingTop: 14, marginTop: 4 }}>
                <button type="button" className="btn btn-secondary btn-md" onClick={() => setIsModalOpen(false)}>
                  {t('cancel') || 'إلغاء'}
                </button>
                <button type="submit" className="btn btn-primary btn-md" style={{ padding: '10px 24px', fontWeight: 700 }}>
                  {form.id ? (t('updateServiceBtn') || 'حفظ التعديلات') : (t('saveServiceBtn') || 'إنشاء الخدمة')}
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
