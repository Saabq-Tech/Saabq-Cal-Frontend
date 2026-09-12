import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import Icon from "./Icon";

export default function GoogleNotConnectedBanner() {
  const { user, userType } = useAuth();
  const { t } = useLanguage();

  // Only display for logged-in Workspace Members whose Google account is not connected
  if (userType !== "member" || !user || user.is_google_connected === true) {
    return null;
  }

  return (
    <div className="warning-banner warning-banner-amber google-not-connected-banner animate-fade-in-down">
      <div className="warning-banner-content">
        <div className="warning-banner-icon icon-amber">
          <Icon name="alert-triangle" size={22} />
        </div>

        <div className="warning-banner-text">
          <h4>
            {t("googleNotConnectedBannerTitle") ||
              "تنبيه: حساب Google مش مربوط"}
          </h4>
          <p>
            {t("googleNotConnectedBannerDesc") ||
              "حساب Google بتاعك مش مربوط دلوقتي. مش هتتم مزامنة المواعيد أو إنشاء لينكات Google Meet تلقائياً لحد ما تربط حسابك."}
          </p>
        </div>
      </div>

      <Link
        to="/member/integrations"
        className="btn btn-warning btn-sm warning-banner-action"
        style={{
          backgroundColor: "#F59E0B",
          borderColor: "#D97706",
          color: "#ffffff",
          boxShadow: "0 2px 8px rgba(245, 158, 11, 0.3)",
        }}
      >
        <Icon name="custom-2963ac22" size={16} />
        {t("connectGoogleNow") || "اربط حساب Google دلوقتي"}
      </Link>
    </div>
  );
}
