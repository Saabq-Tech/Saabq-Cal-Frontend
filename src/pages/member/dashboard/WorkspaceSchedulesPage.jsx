import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { useLanguage } from '../../../context/LanguageContext';
import client, { endpoints } from '../../../api/client';
import SchedulesTab from './workspace-settings/SchedulesTab';
import SEO from '../../../components/ui/SEO';
import { SkeletonRect } from '../../../components/ui/Skeleton';
import CapabilityGate from '../../../components/common/CapabilityGate';
import { checkWorkspaceCapability } from '../../../utils/capabilities';

export default function WorkspaceSchedulesPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const toast = useToast();

  const [schedules, setSchedules] = useState([]);
  const [startOfWeek, setStartOfWeek] = useState('sunday');
  const [loading, setLoading] = useState(true);

  const isOwner = user?.is_owner === true;
  const userPermissions = Array.isArray(user?.permissions) ? user.permissions : [];
  const canRead = isOwner || userPermissions.includes('schedule_read') || userPermissions.includes('schedules_read');
  const canEdit = isOwner || userPermissions.includes('schedule_write') || userPermissions.includes('schedules_write');

  const isCapAllowed = checkWorkspaceCapability(user, 'PER_MEMBER_CALENDAR');

  const loadingRef = useRef(false);
  const loadSchedules = async () => {
    if (!isCapAllowed || !canRead) {
      setLoading(false);
      return;
    }
    if (loadingRef.current) return;
    loadingRef.current = true;
    try {
      setLoading(true);
      const [resSchedules, resSettings] = await Promise.all([
        client.get(endpoints.workspaceSchedules),
        client.get(endpoints.workspaceSettings).catch(() => null),
      ]);
      setSchedules(resSchedules.data?.data || []);
      if (resSettings?.data?.data?.start_of_week) {
        setStartOfWeek(resSettings.data.data.start_of_week);
      }
    } catch (err) {
      if (err.response?.status !== 403) {
        toast.error(t('schedulesLoadFailed') || 'فشل تحميل الجداول والتوفر');
      }
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  };

  useEffect(() => {
    loadSchedules();
  }, [isCapAllowed, canRead]);

  return (
    <CapabilityGate capabilityCode="PER_MEMBER_CALENDAR">
      <div className="card" style={{ padding: 24 }}>
        <SEO title={t('schedules') || 'الجداول الزمنية'} noindex />
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <SkeletonRect height={48} />
            <SkeletonRect height={64} />
            <SkeletonRect height={64} />
          </div>
        ) : (
          <SchedulesTab schedules={schedules} startOfWeek={startOfWeek} canEdit={canEdit} onRefresh={loadSchedules} />
        )}
      </div>
    </CapabilityGate>
  );
}
