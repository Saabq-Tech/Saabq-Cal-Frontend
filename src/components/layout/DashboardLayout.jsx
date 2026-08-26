import { Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import DashboardSidebar from "./DashboardSidebar";
import UserAvatar from "../ui/UserAvatar";
import PageLoader from "../ui/PageLoader";
import GoogleNotConnectedBanner from "../common/GoogleNotConnectedBanner";
import Icon from "../common/Icon";

export default function DashboardLayout() {
  const { user, userType } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();

  if (!user) return <PageLoader />;

  const isVerified = !!user.email_verified_at;
  const has2FA = !!user.two_factor_enabled;
  const userTypeLabel = userType === "member" ? t("teamMember") : t("customer");

  return (
    <div className="main-content">
      <div className="container profile-page animate-page-enter">
        <GoogleNotConnectedBanner />

        {/* Unified Dashboard Profile Header */}
        <div className="profile-header">
          <div className="profile-avatar">
            <UserAvatar
              name={user.name}
              avatarUrl={user.avatar_url}
              size={72}
            />
          </div>

          <div className="profile-info">
            <h1>{user.name}</h1>
            <p>{user.email}</p>
            <div
              style={{
                display: "flex",
                gap: 6,
                flexWrap: "wrap",
                marginTop: 4,
              }}
            >
              <span
                className={`profile-badge ${isVerified ? "verified" : "unverified"}`}
                style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
              >
                {isVerified ? (
                  <>
                    <Icon name="check" size={10} />
                    {t("verified")}
                  </>
                ) : (
                  <>
                    <Icon name="x" size={10} />
                    {t("unverified")}
                  </>
                )}
              </span>
              <span className="profile-badge member">{userTypeLabel}</span>
              {has2FA && (
                <span
                  className="profile-badge verified"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <Icon name="shield" size={12} />
                  {t("twoFactorTitle")}
                </span>
              )}
              {userType === "member" && user.is_owner && (
                <span
                  className="profile-badge verified"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <Icon name="crown" size={12} />
                  {t("owner")}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Dashboard Grid Shell */}
        <div className="profile-grid">
          <DashboardSidebar />

          <div
            key={location.pathname}
            className="dashboard-content animate-fade-in-up"
            style={{ flex: 1, minWidth: 0 }}
          >
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
