import { useState, useEffect } from "react";
import { useToast } from "../../../context/ToastContext";
import { useLanguage } from "../../../context/LanguageContext";
import client, { endpoints } from "../../../api/client";
import SubscriptionTab from "./workspace-settings/SubscriptionTab";
import SEO from "../../../components/ui/SEO";
import { SkeletonRect } from "../../../components/ui/Skeleton";

import { usePermissions } from "../../../hooks/usePermissions";

export default function WorkspaceSubscriptionsPage() {
  const { t } = useLanguage();
  const toast = useToast();
  const {
    isOwner,
    canReadSubscriptions: _canReadSubscriptions,
    canCreateSubscriptions,
    canUpdateSubscriptions,
    canDeleteSubscriptions,
  } = usePermissions();

  const [subscriptionInfo, setSubscriptionInfo] = useState(null);
  const [plans, setPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [plansError, setPlansError] = useState(null);
  const [loading, setLoading] = useState(true);

  const canEdit =
    isOwner ||
    canCreateSubscriptions ||
    canUpdateSubscriptions ||
    canDeleteSubscriptions;

  const loadData = async () => {
    try {
      setLoading(true);
      setPlansLoading(true);
      setPlansError(null);

      const [subRes, plansRes] = await Promise.all([
        client.get(endpoints.workspaceSubscription).catch(() => null),
        client.get(endpoints.plans).catch((err) => {
          setPlansError(
            err.response?.data?.message ||
              t("plansLoadFailed") ||
              "فشل تحميل الباقات",
          );
          return null;
        }),
      ]);

      setSubscriptionInfo(subRes?.data?.data || null);
      setPlans(plansRes?.data?.data || []);
    } catch (err) {
      console.warn("Subscription fetch warning:", err);
    } finally {
      setLoading(false);
      setPlansLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUpgrade = async (planId, billingCycle, proofFile, proofNotes) => {
    try {
      const formData = new FormData();
      formData.append("plan_id", planId);
      if (billingCycle) formData.append("billing_cycle", billingCycle);
      if (proofFile instanceof File) {
        formData.append("proof_file", proofFile);
      } else if (typeof proofFile === "string" && proofFile.trim()) {
        formData.append("proof_file", proofFile.trim());
      }
      if (proofNotes && proofNotes.trim()) {
        formData.append("proof_notes", proofNotes.trim());
      }

      const res = await client.post(endpoints.workspaceSubscription, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success(
        res.data?.message ||
          t("upgradeSuccess") ||
          "اتحدثت باقة الاشتراك بنجاح",
      );
      loadData();
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          t("upgradeFailed") ||
          "حصل خطأ في ترقية الباقة",
      );
    }
  };

  const handleCancel = async (reason) => {
    try {
      const res = await client.put(endpoints.workspaceSubscriptionCancel, {
        reason,
      });
      toast.success(
        res.data?.message ||
          t("cancelSubscriptionSuccess") ||
          "اتلغى الاشتراك بنجاح",
      );
      loadData();
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          t("cancelSubscriptionFailed") ||
          "حصل خطأ في إلغاء الاشتراك",
      );
    }
  };

  const handlePause = async (reason) => {
    try {
      const res = await client.post(endpoints.workspaceSubscriptionPause, {
        reason,
      });
      toast.success(
        res.data?.message ||
          t("pauseSubscriptionSuccess") ||
          "اتوقف الاشتراك مؤقتاً بنجاح",
      );
      loadData();
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          t("pauseSubscriptionFailed") ||
          "حصل خطأ في إيقاف الاشتراك",
      );
    }
  };

  const handleResume = async () => {
    try {
      const res = await client.post(endpoints.workspaceSubscriptionResume);
      toast.success(
        res.data?.message ||
          t("resumeSubscriptionSuccess") ||
          "اتشغل الاشتراك تاني بنجاح",
      );
      loadData();
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          t("resumeSubscriptionFailed") ||
          "حصل خطأ في استئناف الاشتراك",
      );
    }
  };

  return (
    <div className="card" style={{ padding: 24 }}>
      <SEO title={t("subscription") || "الاشتراكات"} noindex />
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
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
          canCreate={canCreateSubscriptions}
          canUpdate={canUpdateSubscriptions}
          canDelete={canDeleteSubscriptions}
          onUpgrade={handleUpgrade}
          onCancel={handleCancel}
          onPause={handlePause}
          onResume={handleResume}
        />
      )}
    </div>
  );
}
