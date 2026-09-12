import { useState, useEffect, useRef } from "react";
import { useToast } from "../../../context/ToastContext";
import { useLanguage } from "../../../context/LanguageContext";
import client, { endpoints } from "../../../api/client";
import ResourcesTab from "./workspace-settings/ResourcesTab";
import SEO from "../../../components/ui/SEO";
import { TableSkeleton } from "../../../components/ui/Skeleton";

import { usePermissions } from "../../../hooks/usePermissions";

export default function WorkspaceResourcesPage() {
  const { t } = useLanguage();
  const toast = useToast();
  const {
    isOwner,
    canReadResources,
    canCreateResources,
    canUpdateResources,
    canDeleteResources,
  } = usePermissions();

  const [resources, setResources] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const canRead = isOwner || canReadResources;
  const canEdit =
    isOwner || canCreateResources || canUpdateResources || canDeleteResources;

  const loadingRef = useRef(false);
  const loadData = async () => {
    if (!canRead) {
      setLoading(false);
      return;
    }
    if (loadingRef.current) return;
    loadingRef.current = true;
    try {
      setLoading(true);
      const [resResponse, statsResponse] = await Promise.all([
        client.get(endpoints.workspaceResources),
        client.get(endpoints.workspaceResourceStats).catch(() => null),
      ]);
      setResources(resResponse.data?.data || []);
      setStats(statsResponse?.data?.data || null);
    } catch (err) {
      if (err.response?.status !== 403) {
        toast.error(t("resourcesLoadFailed") || "فشل تحميل موارد مساحة العمل");
      }
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canRead]);

  const handleSaveResource = async (resourceForm) => {
    try {
      const resourceId = resourceForm.id;
      if (resourceId) {
        await client.put(
          endpoints.workspaceResourceItem(resourceId),
          resourceForm,
        );
        toast.success(t("resourceUpdatedSuccess") || "اتحدث المورد بنجاح");
      } else {
        await client.post(endpoints.workspaceResources, resourceForm);
        toast.success(t("resourceAddedSuccess") || "اتضاف المورد بنجاح");
      }
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || "حصل خطأ في حفظ المورد");
    }
  };

  const handleDeleteResource = async (id) => {
    try {
      await client.delete(endpoints.workspaceResourceItem(id));
      toast.success(t("resourceDeletedSuccess") || "اتحذف المورد بنجاح");
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || "حصل خطأ في حذف المورد");
    }
  };

  return (
    <div className="card" style={{ padding: 24 }}>
      <SEO
        title={t("workspaceResources") || "إدارة الموارد والمخزون"}
        noindex
      />
      {loading ? (
        <TableSkeleton rows={3} />
      ) : (
        <ResourcesTab
          resources={resources}
          stats={stats}
          canEdit={canEdit}
          canCreate={canCreateResources}
          canUpdate={canUpdateResources}
          canDelete={canDeleteResources}
          onSaveResource={handleSaveResource}
          onDeleteResource={handleDeleteResource}
        />
      )}
    </div>
  );
}
