import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '../../../../context/LanguageContext';
import { useToast } from '../../../../context/ToastContext';
import Icon from '../../../../components/common/Icon';


export default function SubscriptionTab({ subscriptionInfo, plans = [], plansLoading = false, plansError = null, canEdit, onUpgrade, onRenew, onCancel, onPause, onResume }) {
  const { t } = useLanguage();
  const toast = useToast();

  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);
  const [selectedUpgradePlanId, setSelectedUpgradePlanId] = useState(null);
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [renewDurationMonths, setRenewDurationMonths] = useState(12);

  const planName = subscriptionInfo?.plan?.name || subscriptionInfo?.name || null;
  const endsAt = subscriptionInfo?.ends_at || subscriptionInfo?.expires_at || null;
  const statusStr = subscriptionInfo?.status || (subscriptionInfo ? 'active' : null);

  const handleConfirmUpgrade = () => {
    if (!selectedUpgradePlanId) {
      toast.error(t('selectPlanError') || 'يرجى اختيار باقة للمتابعة');
      return;
    }
    if (onUpgrade) onUpgrade(selectedUpgradePlanId, billingCycle);
    setIsUpgradeModalOpen(false);
  };

  const handleConfirmRenew = () => {
    if (onRenew) onRenew(renewDurationMonths);
    setIsRenewModalOpen(false);
  };

  const handleConfirmCancel = async () => {
    if (onCancel) {
      try {
        setCancelLoading(true);
        await onCancel(cancelReason);
        setIsCancelModalOpen(false);
      } finally {
        setCancelLoading(false);
      }
    }
  };

  const formatDate = (d) => {
    if (!d) return '';
    const str = String(d);
    if (str.includes('T')) return str.split('T')[0];
    return str.substring(0, 10);
  };

  const renderStatusBadge = (status) => {
    const s = String(status || '').toLowerCase();

    const badgeConfig = {
      pending: {
        label: t('statusPending') || 'قيد الانتظار',
        color: '#b45309',
        bg: '#fef3c7',
        border: '#fde68a',
        dotColor: '#f59e0b',
      },
      active: {
        label: t('statusActiveBadge') || t('statusActive') || 'نشط',
        color: '#166534',
        bg: '#dcfce7',
        border: '#bbf7d0',
        dotColor: '#22c55e',
      },
      trialing: {
        label: t('statusTrialing') || 'فترة تجريبية',
        color: '#0369a1',
        bg: '#e0f2fe',
        border: '#bae6fd',
        dotColor: '#0284c7',
      },
      paused: {
        label: t('statusPaused') || 'موقوف مؤقتاً',
        color: '#92400e',
        bg: '#fef3c7',
        border: '#fde68a',
        dotColor: '#f59e0b',
      },
      cancelled: {
        label: t('statusCancelled') || 'ملغى',
        color: '#991b1b',
        bg: '#fee2e2',
        border: '#fecaca',
        dotColor: '#ef4444',
      },
      expired: {
        label: t('statusExpired') || 'منتهي الصلاحية',
        color: '#475569',
        bg: '#f1f5f9',
        border: '#e2e8f0',
        dotColor: '#64748b',
      },
    };

    const config = badgeConfig[s] || {
      label: s,
      color: '#334155',
      bg: '#f1f5f9',
      border: '#cbd5e1',
      dotColor: '#94a3b8',
    };

    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 16px',
          borderRadius: 20,
          fontSize: '0.82rem',
          fontWeight: 700,
          color: config.color,
          background: config.bg,
          border: `1px solid ${config.border}`,
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
        }}
      >
        <span
          style={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            background: config.dotColor,
            display: 'inline-block',
          }}
        />
        {config.label}
      </span>
    );
  };

  return (
    <div className="card-body">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14, marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--heading)' }}>
            {t('workspaceSubscription') || 'اشتراك مساحة العمل والخطة الحالية'}
          </h2>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
            {t('subscriptionDesc') || 'متابعة حالة الاشتراك الحالي، ميعاد التجديد، وإمكانية الترقية لباقات أعلى'}
          </p>
        </div>
        {canEdit && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {statusStr !== 'pending' && (
              <>
                {statusStr !== 'active' && statusStr !== 'trialing' && (
                  <button className="btn btn-secondary btn-sm" onClick={() => setIsRenewModalOpen(true)}>
                    {t('renewSubscription') || 'تجديد الاشتراك'}
                  </button>
                )}
                <button className="btn btn-primary btn-sm" onClick={() => setIsUpgradeModalOpen(true)} style={{ gap: 6 }}>
                  <Icon name="rocket" size={14} />
                  {t('upgradePlan') || 'ترقية الباقة'}
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {!subscriptionInfo ? (
        <div style={{ padding: '48px 20px', textAlign: 'center', background: 'var(--surface-alt)', borderRadius: 'var(--radius-lg)', border: '1px border-dashed var(--border)', marginBottom: 20 }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--primary-subtle)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
            <Icon name="credit-card" size={24} />
          </div>
          <h4 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 6px', color: 'var(--heading)' }}>
            {t('noSubscriptionFound') || 'لا يوجد اشتراك مفعّل حالياً لمساحة العمل'}
          </h4>
          <p style={{ fontSize: '0.85rem', color: 'var(--muted)', margin: '0 0 16px' }}>
            {t('noSubscriptionDesc') || 'قم باختيار وتفعيل باقتك للبدء في استخدام جميع مميزات مساحة العمل.'}
          </p>
          {canEdit && (
            <button className="btn btn-primary btn-sm" onClick={() => setIsUpgradeModalOpen(true)}>
              + {t('choosePlan') || 'اختيار باقة'}
            </button>
          )}
        </div>
      ) : (
        <div style={{ padding: 20, background: 'var(--surface-alt)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)', marginBottom: 20 }}>
          {statusStr === 'pending' && (
            <div style={{ padding: '14px 18px', background: 'rgba(245, 158, 11, 0.1)', borderRadius: 12, border: '1px solid rgba(245, 158, 11, 0.3)', color: '#b45309', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
              <Icon name="clock" size={24} />
              <div>
                <strong style={{ display: 'block', fontSize: '0.92rem', marginBottom: 2 }}>
                  {t('pendingSubscriptionTitle') || 'طلب الاشتراك قيد المراجعة'}
                </strong>
                <span style={{ fontSize: '0.84rem' }}>
                  {t('pendingSubscriptionDesc') || 'تم تقديم طلب الاشتراك الخاص بمساحة العمل وهو قيد المراجعة حالياً من قبل الإدارة. سيتم تفعيل المميزات فور الاعتماد.'}
                </span>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--muted)', fontWeight: 700 }}>
                {statusStr === 'pending' ? (t('requestedPlan') || 'الخطة المطلوبة') : (t('currentPlanActive') || 'الخطة المفعلة حالياً')}
              </span>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)', margin: '2px 0 0' }}>{planName || (t('basicPlan') || 'الباقة الأساسية')}</h3>
            </div>
            {renderStatusBadge(statusStr)}
          </div>

          <div style={{ marginTop: 16, display: 'flex', gap: 24, flexWrap: 'wrap', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
            {endsAt && <div>{t('nextRenewalDate') || 'تاريخ التجديد القادم:'} <strong>{formatDate(endsAt)}</strong></div>}
            {subscriptionInfo.billing_cycle && <div>{t('billingCycleLabel') || 'دورة الفواتير:'} <strong>{subscriptionInfo.billing_cycle === 'yearly' ? (t('yearly') || 'سنوي') : subscriptionInfo.billing_cycle === 'monthly' ? (t('monthly') || 'شهري') : subscriptionInfo.billing_cycle}</strong></div>}
          </div>
        </div>
      )}

      {/* Upgrade Modal */}
      {isUpgradeModalOpen && createPortal(
        <div className="modal-backdrop">
          <div className="modal-card modal-xl animate-fade-in-up" style={{ maxWidth: 1060, width: '94vw', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h3 className="modal-title">{t('upgradeModalTitle') || 'ترقية باقة مساحة العمل'}</h3>
              <button type="button" className="modal-close-btn" onClick={() => setIsUpgradeModalOpen(false)}>
                <Icon name="x" size={16} />
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 20 }}>
              <button
                type="button"
                className={`btn btn-sm ${billingCycle === 'monthly' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setBillingCycle('monthly')}
                style={{ borderRadius: 20, padding: '6px 18px' }}
              >
                {t('filterMonthly') || 'فلترة شهرية'}
              </button>
              <button
                type="button"
                className={`btn btn-sm ${billingCycle === 'yearly' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setBillingCycle('yearly')}
                style={{ borderRadius: 20, padding: '6px 18px' }}
              >
                {t('filterYearlyDiscount') || 'فلترة سنوية (خصم 20%)'}
              </button>
            </div>

            {plansLoading ? (
              <div style={{ padding: 40, textAlign: 'center' }}>
                <span className="spinner spinner-md" style={{ margin: '0 auto 12px' }} />
                <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>{t('loadingPlans') || 'جاري تحميل الخطط المتاحة...'}</p>
              </div>
            ) : plansError ? (
              <div style={{ padding: 24, textAlign: 'center', background: 'rgba(239, 68, 68, 0.08)', borderRadius: 12, color: '#dc2626', marginBottom: 20 }}>
                {plansError}
              </div>
            ) : plans.length === 0 ? (
              <div style={{ padding: 32, textAlign: 'center', color: 'var(--muted)', marginBottom: 20 }}>
                {t('noPlansAvailable') || 'لا توجد بااقات متوفرة حالياً'}
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 16, marginBottom: 20 }}>
                {plans.map((p) => {
                  const selected = selectedUpgradePlanId === p.id;
                  const rawPrice = billingCycle === 'yearly' ? (p.yearly_price || p.price_yearly || p.price * 10) : (p.monthly_price || p.price_monthly || p.price);
                  const unitStr = billingCycle === 'yearly' ? (t('sarPerYear') || 'ر.س / سنوياً') : (t('sarPerMonth') || 'ر.س / شهرياً');

                  const capsList = Array.isArray(p.capabilities)
                    ? p.capabilities.map((c) => (typeof c.name === 'object' ? (c.name.ar || c.name.en || '') : (c.name || c.title || ''))).filter(Boolean)
                    : [];

                  const rawFeatures = Array.isArray(p.features)
                    ? p.features.map((f) => (typeof f === 'string' ? f : (f.title || f.name || ''))).filter(Boolean)
                    : (p.description ? [p.description] : []);

                  const limits = [];
                  if (p.max_members) limits.push(`${p.max_members} ${t('membersLimit') || 'أعضاء'}`);
                  if (p.max_services) limits.push(`${p.max_services} ${t('servicesLimit') || 'خدمات'}`);
                  if (p.max_appointments) limits.push(`${p.max_appointments} ${t('appointmentsLimit') || 'حجوزات'}`);
                  if (p.max_customers) limits.push(`${p.max_customers} ${t('customersLimit') || 'عملاء'}`);

                  const capabilities = [...new Set([...capsList, ...rawFeatures])];

                  return (
                    <div
                      key={p.id}
                      onClick={() => setSelectedUpgradePlanId(p.id)}
                      style={{
                        padding: 20,
                        borderRadius: 16,
                        border: selected ? '2px solid var(--primary)' : '1px solid var(--border-light)',
                        background: selected ? 'linear-gradient(180deg, rgba(17, 100, 106, 0.06) 0%, rgba(17, 100, 106, 0.02) 100%)' : 'var(--surface-alt)',
                        boxShadow: selected ? '0 8px 24px rgba(17, 100, 106, 0.15)' : 'none',
                        cursor: 'pointer',
                        transition: 'all 0.25s ease',
                        display: 'flex',
                        flexDirection: 'column',
                        position: 'relative',
                      }}
                    >
                      {selected && (
                        <div
                          style={{
                            position: 'absolute',
                            top: -10,
                            right: 16,
                            background: 'var(--primary)',
                            color: '#ffffff',
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            padding: '2px 10px',
                            borderRadius: 10,
                            boxShadow: '0 2px 8px rgba(17, 100, 106, 0.3)',
                          }}
                        >
                          {t('selected') || 'محدد'}
                        </div>
                      )}

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <span style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--heading)' }}>{p.name || p.title}</span>
                        <input type="radio" checked={selected} readOnly style={{ accentColor: 'var(--primary)', width: 18, height: 18 }} />
                      </div>

                      <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--primary)', marginBottom: 14 }}>
                        {rawPrice} <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{unitStr}</span>
                      </div>

                      {limits.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                          {limits.map((lbl, i) => (
                            <span
                              key={i}
                              style={{
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                color: 'var(--primary)',
                                background: 'rgba(17, 100, 106, 0.08)',
                                padding: '4px 10px',
                                borderRadius: 20,
                              }}
                            >
                              {lbl}
                            </span>
                          ))}
                        </div>
                      )}

                      <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: 12, marginTop: 'auto' }}>
                        <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--heading)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Icon name="sparkles" size={14} style={{ color: 'var(--primary)' }} />
                          {t('planCapabilitiesLabel') || 'الإمكانيات والمميزات المتاحة:'}
                        </div>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.83rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {capabilities.length > 0 ? (
                            capabilities.map((item, idx) => (
                              <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, lineHeight: 1.45 }}>
                                <span
                                  style={{
                                    width: 18,
                                    height: 18,
                                    borderRadius: '50%',
                                    background: 'rgba(17, 100, 106, 0.12)',
                                    color: 'var(--primary)',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                    marginTop: 2,
                                  }}
                                >
                                  <Icon name="check" size={11} />
                                </span>
                                <span>{item}</span>
                              </li>
                            ))
                          ) : (
                            <li style={{ color: 'var(--muted)', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span
                                style={{
                                  width: 18,
                                  height: 18,
                                  borderRadius: '50%',
                                  background: 'rgba(17, 100, 106, 0.12)',
                                  color: 'var(--primary)',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0,
                                }}
                              >
                                <Icon name="check" size={11} />
                              </span>
                              <span>{t('basicPlanCapabilities') || 'تتضمن المميزات والخدمات الأساسية'}</span>
                            </li>
                          )}
                        </ul>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="modal-actions">
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setIsUpgradeModalOpen(false)}>{t('cancel')}</button>
              <button type="button" className="btn btn-primary btn-sm" onClick={handleConfirmUpgrade} disabled={plansLoading || plans.length === 0}>
                {t('confirmUpgradeBtn') || 'تأكيد ترقية الباقة'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Renew Modal */}
      {isRenewModalOpen && createPortal(
        <div className="modal-backdrop">
          <div className="modal-card modal-sm animate-fade-in-up">
            <div className="modal-header">
              <h3 className="modal-title">{t('renewModalTitle') || 'تجديد اشتراك مساحة العمل'}</h3>
              <button type="button" className="modal-close-btn" onClick={() => setIsRenewModalOpen(false)}>
                <Icon name="x" size={16} />
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">{t('renewDurationLabel') || 'مدة التجديد المطلوبة'}</label>
                <select className="form-select" value={renewDurationMonths} onChange={(e) => setRenewDurationMonths(Number(e.target.value))}>
                  <option value={1}>{t('oneMonth') || 'شهر واحد (1 Month)'}</option>
                  <option value={3}>{t('threeMonths') || '3 أشهر (3 Months)'}</option>
                  <option value={6}>{t('sixMonths') || '6 أشهر (6 Months)'}</option>
                  <option value={12}>{t('twelveMonths') || 'سنة كاملة (12 Months - أفضل قيمة)'}</option>
                </select>
              </div>
            </div>

            <div className="modal-actions">
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setIsRenewModalOpen(false)}>{t('cancel')}</button>
              <button type="button" className="btn btn-primary btn-sm" onClick={handleConfirmRenew}>
                {t('confirmRenewBtn') || 'تأكيد التجديد الآن'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
