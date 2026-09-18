import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import { checkWorkspaceCapability } from "../../utils/capabilities";
import Icon from "./Icon";

/**
 * CapabilityGate wraps workspace feature content and displays an interactive Upgrade/Subscription lock card if restricted.
 */
export default function CapabilityGate({ capabilityCode, children }) {
  const { user } = useAuth();
  const { t } = useLanguage();

  const isAllowed = checkWorkspaceCapability(user, capabilityCode);
  const hasActiveSub = user?.workspace?.has_active_subscription ?? true;

  if (isAllowed) {
    return children;
  }

  const title = !hasActiveSub
    ? t("noSubscriptionTitle") || "لا يوجد اشتراك نشط لمساحة العمل"
    : t("capabilityLockedTitle") || "هذه الميزة غير متاحة في باقتك الحالية";

  const description = !hasActiveSub
    ? t("noSubscriptionDesc") ||
      "مساحة العمل الخاصة بك ليس لديها اشتراك نشط. يرجى الاشتراك في إحدى الباقات للاستفادة من كافة المميزات."
    : t("capabilityLockedDesc") ||
      "الميزة المطلوبة تتطلب ترقية باقة الاشتراك الخاصة بمساحة العمل للوصول إليها واستخدامها.";

  return (
    <div
      className="capability-gate-container animate-fade-in-up"
      style={{
        padding: "20px 24px",
        textAlign: "center",
        background: "transparent",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        margin: "80px auto 32px",
        maxWidth: 900,
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          width: 76,
          height: 76,
          borderRadius: "50%",
          background:
            "linear-gradient(135deg, rgba(2, 105, 130, 0.12), rgba(3, 154, 183, 0.12))",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--primary)",
          marginBottom: 20,
          border: "1px solid rgba(2, 105, 130, 0.2)",
        }}
      >
        <Icon name="lock" size={36} />
      </div>

      <span
        className="profile-badge verified"
        style={{
          fontSize: "0.82rem",
          padding: "6px 16px",
          marginBottom: 16,
          borderRadius: "var(--radius-full, 9999px)",
          background: "rgba(245, 158, 11, 0.12)",
          color: "#d97706",
          border: "1px solid rgba(245, 158, 11, 0.25)",
          fontWeight: 700,
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <Icon name="sparkles" size={14} />
        <span>
          {t("proEnterpriseExclusive") || "ميزة حصرية للباقات المدفوعة"}
        </span>
      </span>

      <h2
        style={{
          fontSize: "1.45rem",
          fontWeight: 800,
          color: "var(--heading)",
          marginBottom: 12,
          maxWidth: 560,
        }}
      >
        {title}
      </h2>

      <p
        style={{
          fontSize: "0.95rem",
          color: "var(--text-secondary)",
          maxWidth: 580,
          lineHeight: 1.7,
          margin: "0 auto 28px",
        }}
      >
        {description}
      </p>

      <Link
        to="/member/workspace/subscriptions"
        className="btn btn-primary"
        style={{
          padding: "12px 28px",
          fontSize: "0.98rem",
          fontWeight: 700,
          borderRadius: "var(--radius-md, 12px)",
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          boxShadow: "0 4px 14px rgba(2, 105, 130, 0.3)",
        }}
      >
        <Icon name="zap" size={18} />
        <span>{t("viewSubscriptionsBtn") || "عرض الباقات والاشتراكات"}</span>
      </Link>
    </div>
  );
}
