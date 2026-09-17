import { Link } from "react-router-dom";
import { useLanguage } from "../../context/LanguageContext";
import Icon from "./Icon";
import { createPortal } from "react-dom";
import { useCustomerLabel } from "../../hooks/useCustomerLabel";

export function PlanLimitBanner({ type, limitInfo, onUpgradeClick }) {
  const { t, isRTL } = useLanguage();
  const { isCustom, customerPlural } = useCustomerLabel();

  if (!limitInfo || limitInfo.isUnlimited || !limitInfo.isReached) {
    return null;
  }

  const titles = {
    members:
      t("planLimitMembersReachedTitle") ||
      "تم الوصول للحد الأقصى لأعضاء الفريق",
    services:
      t("planLimitServicesReachedTitle") || "تم الوصول للحد الأقصى للخدمات",
    customers: isCustom
      ? isRTL
        ? `تم الوصول للحد الأقصى لـ ${customerPlural}`
        : `Reached maximum limit for ${customerPlural}`
      : t("planLimitCustomersReachedTitle") || "تم الوصول للحد الأقصى للعملاء",
    appointments:
      t("planLimitAppointmentsReachedTitle") ||
      "تم الوصول للحد الأقصى للحجوزات",
  };

  const descs = {
    members:
      t("planLimitMembersReachedDesc") ||
      "خطتك الحالية تتيح لك إضافة عدد محدود من الأعضاء. للترقية وإضافة المزيد من الفريق:",
    services:
      t("planLimitServicesReachedDesc") ||
      "خطتك الحالية تتيح لك إضافة عدد محدود من الخدمات. للترقية وإضافة المزيد من الخدمات:",
    customers: isCustom
      ? isRTL
        ? `خطتك الحالية تتيح لك تسجيل عدد محدود من ${customerPlural}. للترقية وتسجيل المزيد:`
        : `Your current plan allows registering a limited number of ${customerPlural.toLowerCase()}. To upgrade:`
      : t("planLimitCustomersReachedDesc") ||
        "خطتك الحالية تتيح لك تسجيل عدد محدود من العملاء. للترقية وتسجيل المزيد:",
    appointments:
      t("planLimitAppointmentsReachedDesc") ||
      "خطتك الحالية تتيح لك استقبال عدد محدد من الحجوزات. للترقية واستقبال حجوزات غير محدودة:",
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
        padding: "14px 18px",
        background: "rgba(245, 158, 11, 0.08)",
        border: "1px solid rgba(245, 158, 11, 0.3)",
        borderRadius: "var(--radius-lg, 12px)",
        marginBottom: 20,
        flexWrap: "wrap",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: "rgba(245, 158, 11, 0.15)",
            color: "#d97706",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Icon name="alert-triangle" size={18} />
        </div>
        <div>
          <strong
            style={{
              display: "block",
              fontSize: "0.92rem",
              color: "#b45309",
              marginBottom: 2,
            }}
          >
            {titles[type] ||
              t("planLimitReached") ||
              "تم الوصول للحد الأقصى للباقة"}{" "}
            ({limitInfo.used}/{limitInfo.max})
          </strong>
          <span style={{ fontSize: "0.84rem", color: "var(--text-secondary)" }}>
            {descs[type] ||
              t("planLimitReachedDesc") ||
              "قم بترقية اشتراكك للاستمتاع بحدود أعلى وميزات متقدمة."}
          </span>
        </div>
      </div>

      {onUpgradeClick ? (
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={onUpgradeClick}
          style={{ gap: 6, flexShrink: 0 }}
        >
          <Icon name="rocket" size={14} />
          {t("upgradePlan") || "ترقية الباقة"}
        </button>
      ) : (
        <Link
          to="/member/workspace/subscriptions"
          className="btn btn-primary btn-sm"
          style={{ gap: 6, flexShrink: 0 }}
        >
          <Icon name="rocket" size={14} />
          {t("upgradePlan") || "ترقية الباقة"}
        </Link>
      )}
    </div>
  );
}

export function PlanLimitModal({
  isOpen,
  onClose,
  type,
  limitInfo: _limitInfo,
}) {
  const { t, isRTL } = useLanguage();
  const { isCustom, customerPlural } = useCustomerLabel();

  if (!isOpen) return null;

  const titles = {
    members:
      t("planLimitMembersReachedTitle") ||
      "تم الوصول للحد الأقصى لأعضاء الفريق",
    services:
      t("planLimitServicesReachedTitle") || "تم الوصول للحد الأقصى للخدمات",
    customers: isCustom
      ? isRTL
        ? `تم الوصول للحد الأقصى لـ ${customerPlural}`
        : `Reached maximum limit for ${customerPlural}`
      : t("planLimitCustomersReachedTitle") || "تم الوصول للحد الأقصى للعملاء",
    appointments:
      t("planLimitAppointmentsReachedTitle") ||
      "تم الوصول للحد الأقصى للحجوزات",
  };

  const descs = {
    members:
      t("planLimitMembersModalDesc") ||
      "لقد استنفدت الحد الأقصى لأعضاء الفريق المسموح به في خطتك الحالية. يرجى الترقية لإضافة أعضاء جدد.",
    services:
      t("planLimitServicesModalDesc") ||
      "لقد استنفدت الحد الأقصى للخدمات المسموح بها في خطتك الحالية. يرجى الترقية لإضافة خدمات جديدة.",
    customers: isCustom
      ? isRTL
        ? `لقد استنفدت الحد الأقصى لـ ${customerPlural} المسموح به في خطتك الحالية. يرجى الترقية لإضافة ${customerPlural} جدد.`
        : `You have reached the maximum limit for ${customerPlural.toLowerCase()} allowed on your current plan. Please upgrade to add more.`
      : t("planLimitCustomersModalDesc") ||
        "لقد استنفدت الحد الأقصى للعملاء المسموح به في خطتك الحالية. يرجى الترقية لإضافة عملاء جدد.",
    appointments:
      t("planLimitAppointmentsModalDesc") ||
      "لقد استنفدت الحد الأقصى للحجوزات المسموح بها في خطتك الحالية. يرجى الترقية لاستقبال المزيد من الحجوزات.",
  };

  return createPortal(
    <div className="modal-backdrop">
      <div
        className="modal-card modal-sm animate-fade-in-up"
        style={{
          maxWidth: 460,
          width: "90vw",
          textAlign: "center",
          padding: "28px 24px",
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: "rgba(245, 158, 11, 0.15)",
            color: "#d97706",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px",
          }}
        >
          <Icon name="lock" size={28} />
        </div>

        <h3
          style={{
            fontSize: "1.15rem",
            fontWeight: 800,
            color: "var(--heading)",
            margin: "0 0 8px",
          }}
        >
          {titles[type] ||
            t("planLimitReached") ||
            "تم الوصول للحد الأقصى للباقة"}
        </h3>

        <p
          style={{
            fontSize: "0.88rem",
            color: "var(--text-secondary)",
            margin: "0 0 24px",
            lineHeight: 1.5,
          }}
        >
          {descs[type] ||
            t("planLimitReachedDesc") ||
            "قم بترقية باقتك لإضافة المزيد والحصول على كافة المميزات المتقدمة."}
        </p>

        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            {t("cancel") || "إلغاء"}
          </button>
          <Link
            to="/member/workspace/subscriptions"
            className="btn btn-primary"
            onClick={onClose}
            style={{ gap: 6 }}
          >
            <Icon name="rocket" size={15} />
            {t("upgradePlanNow") || "ترقية الباقة الآن"}
          </Link>
        </div>
      </div>
    </div>,
    document.body,
  );
}
