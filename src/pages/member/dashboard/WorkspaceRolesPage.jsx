import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { useLanguage } from '../../../context/LanguageContext';
import client, { endpoints } from '../../../api/client';
import RolesTab from './workspace-settings/RolesTab';
import SEO from '../../../components/ui/SEO';
import { SkeletonRect } from '../../../components/ui/Skeleton';
import CapabilityGate from '../../../components/common/CapabilityGate';
import { checkWorkspaceCapability } from '../../../utils/capabilities';

export default function WorkspaceRolesPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const toast = useToast();

  const [rolesList, setRolesList] = useState([]);
  const [availablePermissions, setAvailablePermissions] = useState([]);
  const [loading, setLoading] = useState(true);

  const isOwner = user?.is_owner === true;
  const userPermissions = Array.isArray(user?.permissions) ? user.permissions : [];
  const canRead = isOwner || userPermissions.includes('role_read') || userPermissions.includes('roles_read');
  const canEdit = isOwner || userPermissions.includes('role_write') || userPermissions.includes('roles_write');

  const isCapAllowed = checkWorkspaceCapability(user, 'TEAM_MEMBERS');

  const loadingRef = useRef(false);
  const loadData = async () => {
    if (!isCapAllowed || !canRead) {
      setLoading(false);
      return;
    }
    if (loadingRef.current) return;
    loadingRef.current = true;
    try {
      setLoading(true);
      const [rolesRes, permRes] = await Promise.all([
        client.get(endpoints.workspaceRoles),
        client.get(`${endpoints.workspaceRoles}/permissions`).catch(() => ({ data: { data: [] } })),
      ]);
      setRolesList(rolesRes.data?.data || []);
      setAvailablePermissions(permRes.data?.data || []);
    } catch (err) {
      if (err.response?.status !== 403) {
        toast.error(t('rolesLoadFailed') || 'فشل تحميل أدوار وصلاحيات مساحة العمل');
      }
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  };

  useEffect(() => {
    loadData();
  }, [isCapAllowed, canRead]);

  const handleSaveRole = async (roleForm) => {
    try {
      const payload = {
        name: roleForm.name,
        description: roleForm.description,
        permissions: roleForm.permissions,
      };
      if (roleForm.editing_id) {
        await client.put(`${endpoints.workspaceRoles}/${roleForm.editing_id}`, payload);
        toast.success(t('roleUpdatedSuccess') || 'تم تحديث الدور بنجاح');
      } else {
        await client.post(endpoints.workspaceRoles, payload);
        toast.success(t('roleCreatedSuccess') || 'تم إنشاء الدور المخصص بنجاح');
      }
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'فشل حفظ الدور');
    }
  };

  const handleDeleteRole = async (role) => {
    if (role.is_system) {
      toast.error(t('cannotDeleteProtectedRole') || 'لا يمكن حذف دور محمي');
      return;
    }
    try {
      await client.delete(`${endpoints.workspaceRoles}/${role.id}`);
      toast.success(t('roleDeletedSuccess') || 'تم حذف الدور بنجاح');
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'فشل حذف الدور');
    }
  };

  return (
    <CapabilityGate capabilityCode="TEAM_MEMBERS">
      <div className="card" style={{ padding: 24 }}>
        <SEO title={t('roles') || 'أدوار مساحة العمل'} noindex />
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <SkeletonRect height={48} />
            <SkeletonRect height={64} />
            <SkeletonRect height={64} />
          </div>
        ) : (
          <RolesTab
            rolesList={rolesList}
            availablePermissions={availablePermissions}
            canEdit={canEdit}
            onSaveRole={handleSaveRole}
            onDeleteRole={handleDeleteRole}
          />
        )}
      </div>
    </CapabilityGate>
  );
}
