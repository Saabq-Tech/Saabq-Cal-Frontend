import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { useLanguage } from '../../../context/LanguageContext';
import client, { endpoints } from '../../../api/client';
import SubscriptionTab from './workspace-settings/SubscriptionTab';
import SEO from '../../../components/ui/SEO';
import { SkeletonRect } from '../../../components/ui/Skeleton';

export default function WorkspaceSubscriptionsPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const toast = useToast();

  const [subscriptionInfo, setSubscriptionInfo] = useState(null);
  const [plans, setPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [plansError, setPlansError] = useState(null);
  const [loading, setLoading] = useState(true);

  const isOwner = user?.is_owner === true;
  const userPermissions = Array.isArray(user?.permissions) ? user.permissions : [];
  const canEdit = isOwner || userPermissions.includes('settings_write');

  const loadData = async () => {
    try {
      setLoading(true);
      setPlansLoading(true);
      setPlansError(null);

      const [subRes, plansRes] = await Promise.all([
        client.get(endpoints.workspaceSubscription).catch(() => null),
        client.get(endpoints.plans).catch((err) => {
          setPlansError(err.response?.data?.message || t('plansLoadFailed') || 'فشل تحميل الخطط');
          return null;
        }),
      ]);

      setSubscriptionInfo(subRes?.data?.data || null);
      setPlans(plansRes?.data?.data || []);
    } catch (err) {
      console.warn('Subscription fetch warning:', err);
    } finally {
      setLoading(false);
      setPlansLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpgrade = async (planId, billingCycle) => {
    try {
      const res = await client.post(endpoints.workspaceSubscription, {
        plan_id: planId,
        billing_cycle: billingCycle,
      });
      toast.success(res.data?.message || t('upgradeSuccess') || 'تم ترقية الاشتراك بنجاح');
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || t('upgradeFailed') || 'فشلت عملية ترقية الاشتراك');
    }
  };

  const handleRenew = async (durationMonths) => {
    try {
      const res = await client.post(endpoints.workspaceSubscriptionRenew, {
        duration_months: durationMonths,
      });
      toast.success(res.data?.message || t('renewSuccess') || 'تم تجديد الاشتراك بنجاح');
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || t('renewFailed') || 'فشلت عملية تجديد الاشتراك');
    }
  };

  const handleCancel = async (reason) => {
    try {
      const res = await client.put(endpoints.workspaceSubscriptionCancel, { reason });
      toast.success(res.data?.message || t('cancelSubscriptionSuccess') || 'تم إلغاء الاشتراك بنجاح');
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || t('cancelSubscriptionFailed') || 'فشل إلغاء الاشتراك');
    }
  };

  const handlePause = async (reason) => {
    try {
      const res = await client.post(endpoints.workspaceSubscriptionPause, { reason });
      toast.success(res.data?.message || t('pauseSubscriptionSuccess') || 'تم إيقاف الاشتراك مؤقتاً بنجاح');
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || t('pauseSubscriptionFailed') || 'فشل إيقاف الاشتراك');
    }
  };

  const handleResume = async () => {
    try {
      const res = await client.post(endpoints.workspaceSubscriptionResume);
      toast.success(res.data?.message || t('resumeSubscriptionSuccess') || 'تم استئناف الاشتراك بنجاح');
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || t('resumeSubscriptionFailed') || 'فشل استئناف الاشتراك');
    }
  };

  return (
    <div className="card" style={{ padding: 24 }}>
      <SEO title={t('subscription') || 'الاشتراكات'} noindex />
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <SkeletonRect height={48} />
          <SkeletonRect height={64} />
          <SkeletonRect height={64} />
        </div>
      ) : (
        <SubscriptionTab
          subscriptionInfo={subscriptionInfo}
          plans={plans}
          plansLoading={plansLoading}
          plansError={plansError}
          canEdit={canEdit}
          onUpgrade={handleUpgrade}
          onRenew={handleRenew}
          onCancel={handleCancel}
          onPause={handlePause}
          onResume={handleResume}
        />
      )}
    </div>
  );
}
