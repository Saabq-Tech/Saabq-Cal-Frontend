import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../context/ToastContext";
import { useLanguage } from "../../../context/LanguageContext";
import client, { endpoints } from "../../../api/client";
import ServicesTab from "./workspace-settings/ServicesTab";
import SEO from "../../../components/ui/SEO";
import { ServiceCardSkeleton } from "../../../components/ui/Skeleton";
import CapabilityGate from "../../../components/common/CapabilityGate";
import { checkWorkspaceCapability } from "../../../utils/capabilities";

export default function WorkspaceServicesPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const toast = useToast();

  const [services, setServices] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  const isOwner = user?.is_owner === true;
  const userPermissions = Array.isArray(user?.permissions)
    ? user.permissions
    : [];
  const canRead =
    isOwner ||
    userPermissions.includes("service_read") ||
    userPermissions.includes("services_read");
  const canEdit =
    isOwner ||
    userPermissions.includes("service_write") ||
    userPermissions.includes("services_write");

  const isCapAllowed = checkWorkspaceCapability(user, "BOOKING");

  const loadingRef = useRef(false);
  const loadServices = async () => {
    if (!isCapAllowed || !canRead) {
      setLoading(false);
      return;
    }
    if (loadingRef.current) return;
    loadingRef.current = true;
    try {
      setLoading(true);
      const [srvRes, memRes] = await Promise.all([
        client.get(endpoints.workspaceServices),
        client
          .get(endpoints.workspaceMembers)
          .catch(() => ({ data: { data: [] } })),
      ]);
      setServices(srvRes.data?.data || []);
      setMembers(memRes.data?.data || []);
    } catch (err) {
      if (err.response?.status !== 403) {
        toast.error(t("servicesLoadFailed") || "فشل تحميل خدمات مساحة العمل");
      }
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  };

  useEffect(() => {
    loadServices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCapAllowed, canRead]);

  const handleSaveService = async (serviceForm) => {
    try {
      const serviceId = serviceForm.id || serviceForm.editing_id;
      if (serviceId) {
        await client.put(
          endpoints.workspaceServiceItem(serviceId),
          serviceForm,
        );
        toast.success(t("serviceUpdatedSuccess") || "تم تحديث الخدمة بنجاح");
      } else {
        await client.post(endpoints.workspaceServices, serviceForm);
        toast.success(t("serviceAddedSuccess") || "تم إضافة الخدمة بنجاح");
      }
      loadServices();
    } catch (err) {
      toast.error(err.response?.data?.message || "حدث خطأ في حفظ الخدمة");
    }
  };

  return (
    <CapabilityGate capabilityCode="BOOKING">
      <div className="card" style={{ padding: 24 }}>
        <SEO title={t("services") || "الخدمات"} noindex />
        {loading ? (
          <ServiceCardSkeleton count={3} />
        ) : (
          <ServicesTab
            services={services}
            members={members}
            canEdit={canEdit}
            onSaveService={handleSaveService}
          />
        )}
      </div>
    </CapabilityGate>
  );
}
