import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../context/ToastContext";
import { useLanguage } from "../../../context/LanguageContext";
import client, { endpoints } from "../../../api/client";
import RolesTab from "./workspace-settings/RolesTab";
import SEO from "../../../components/ui/SEO";
import { SkeletonRect } from "../../../components/ui/Skeleton";
import CapabilityGate from "../../../components/common/CapabilityGate";
import { checkWorkspaceCapability } from "../../../utils/capabilities";

import { usePermissions } from "../../../hooks/usePermissions";

export default function WorkspaceRolesPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const toast = useToast();
  const {
    isOwner,
    canReadRoles,
    canCreateRoles,
    canUpdateRoles,
    canDeleteRoles,
  } = usePermissions();

  const [rolesList, setRolesList] = useState([]);
  const [availablePermissions, setAvailablePermissions] = useState([]);
  const [loading, setLoading] = useState(true);

  const canRead = isOwner || canReadRoles;
  const canEdit = isOwner || canCreateRoles || canUpdateRoles || canDeleteRoles;

  const isCapAllowed = checkWorkspaceCapability(user, "TEAM_MEMBERS");

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
        client
          .get(`${endpoints.workspaceRoles}/permissions`)
          .catch(() => ({ data: { data: [] } })),
      ]);
      setRolesList(rolesRes.data?.data || []);
      setAvailablePermissions(permRes.data?.data || []);
    } catch (err) {
      if (err.response?.status !== 403) {
        toast.error(
          t("rolesLoadFailed") || "فشل تحميل أدوار وصلاحيات مساحة العمل",
        );
      }
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCapAllowed, canRead]);

  const handleSaveRole = async (roleForm) => {
    try {
      const payload = {
        name: roleForm.name,
        description: roleForm.description,
        permissions: roleForm.permissions,
        is_visible_to_customers: roleForm.is_visible_to_customers,
      };
      if (roleForm.editing_id) {
        await client.put(
          `${endpoints.workspaceRoles}/${roleForm.editing_id}`,
          payload,
        );
        toast.success(t("roleUpdatedSuccess") || "اتحدث الدور بنجاح");
      } else {
        await client.post(endpoints.workspaceRoles, payload);
        toast.success(t("roleCreatedSuccess") || "اتعمل الدور المخصص بنجاح");
      }
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || "حصل خطأ في حفظ الدور");
    }
  };

  const handleDeleteRole = async (role) => {
    if (role.is_system) {
      toast.error(t("cannotDeleteProtectedRole") || "مينفعش تحذف دور محمي");
      return;
    }
    try {
      await client.delete(`${endpoints.workspaceRoles}/${role.id}`);
      toast.success(t("roleDeletedSuccess") || "اتحذف الدور بنجاح");
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || "حصل خطأ في حذف الدور");
    }
  };

  return (
    <CapabilityGate capabilityCode="TEAM_MEMBERS">
      <div className="card" style={{ padding: 24 }}>
        <SEO title={t("roles") || "أدوار مساحة العمل"} noindex />
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <SkeletonRect height={48} />
            <SkeletonRect height={64} />
            <SkeletonRect height={64} />
          </div>
        ) : (
          <RolesTab
            rolesList={rolesList}
            availablePermissions={availablePermissions}
            canEdit={canEdit}
            canCreate={canCreateRoles}
            canUpdate={canUpdateRoles}
            canDelete={canDeleteRoles}
            onSaveRole={handleSaveRole}
            onDeleteRole={handleDeleteRole}
          />
        )}
      </div>
    </CapabilityGate>
  );
}
