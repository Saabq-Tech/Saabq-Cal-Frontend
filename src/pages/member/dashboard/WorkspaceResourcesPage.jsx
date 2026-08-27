import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../context/ToastContext";
import { useLanguage } from "../../../context/LanguageContext";
import client, { endpoints } from "../../../api/client";
import ResourcesTab from "./workspace-settings/ResourcesTab";
import SEO from "../../../components/ui/SEO";
import { TableSkeleton } from "../../../components/ui/Skeleton";

export default function WorkspaceResourcesPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const toast = useToast();

  const [resources, setResources] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const isOwner = user?.is_owner === true;
  const userPermissions = Array.isArray(user?.permissions)
    ? user.permissions
    : [];
  const canRead = isOwner || userPermissions.includes("resource_read");
  const canEdit = isOwner || userPermissions.includes("resource_write");

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
        toast.success(t("resourceUpdatedSuccess") || "تم تحديث المورد بنجاح");
      } else {
        await client.post(endpoints.workspaceResources, resourceForm);
        toast.success(t("resourceAddedSuccess") || "تم إضافة المورد بنجاح");
      }
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || "حدث خطأ في حفظ المورد");
    }
  };

  const handleDeleteResource = async (id) => {
    try {
      await client.delete(endpoints.workspaceResourceItem(id));
      toast.success(t("resourceDeletedSuccess") || "تم حذف المورد بنجاح");
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || "حدث خطأ في حذف المورد");
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
          onSaveResource={handleSaveResource}
          onDeleteResource={handleDeleteResource}
        />
      )}
    </div>
  );
}
