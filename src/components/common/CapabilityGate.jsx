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
      "مساحة العمل الخاصة بك لا تمتلك اشتراكاً مفاعلاً. يرجى الاشتراك في إحدى الباقات للاستفادة من جميع الميزات."
    : t("capabilityLockedDesc") ||
      "الميزة المطلوبة تتطلب ترقية باقة الاشتراك الخاصة بمساحة العمل للوصول إليها واستخدامها.";

  return (
    <div
      className="card animate-scale-up"
      style={{
        padding: 36,
        textAlign: "center",
        background:
          "linear-gradient(135deg, rgba(17, 100, 106, 0.04) 0%, rgba(17, 100, 106, 0.09) 100%)",
        border: "1px dashed var(--primary)",
        borderRadius: "var(--radius-lg, 16px)",
        margin: "24px 0",
      }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: "50%",
          background: "rgba(17, 100, 106, 0.12)",
          color: "var(--primary)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 18px",
        }}
      >
        <Icon name="lock" size={32} />
      </div>

      <h3
        style={{
          fontSize: "1.25rem",
          fontWeight: 800,
          color: "var(--heading)",
          marginBottom: 8,
        }}
      >
        {title}
      </h3>

      <p
        style={{
          fontSize: "0.9rem",
          color: "var(--muted)",
          maxWidth: 520,
          margin: "0 auto 24px",
          lineHeight: 1.6,
        }}
      >
        {description}
      </p>

      <div style={{ display: "flex", justifyContent: "center", gap: 12 }}>
        <Link
          to="/member/workspace/subscriptions"
          className="btn btn-primary btn-md"
          style={{ gap: 8 }}
        >
          <Icon name="sparkles" size={16} />
          {t("viewSubscriptionsBtn") || "عرض الباقات والاشتراكات"}
        </Link>
      </div>
    </div>
  );
}
