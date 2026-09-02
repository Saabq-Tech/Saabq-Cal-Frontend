import { Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import DashboardSidebar from "./DashboardSidebar";
import PageLoader from "../ui/PageLoader";
import GoogleNotConnectedBanner from "../common/GoogleNotConnectedBanner";

export default function DashboardLayout() {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) return <PageLoader />;

  return (
    <div className="main-content">
      <div className="container profile-page animate-page-enter">
        <GoogleNotConnectedBanner />

        {/* The name/email/badges card that used to sit here duplicated the
            identity every overview tab (Customer/MemberOverviewTab) already
            shows in its own welcome banner, one screen below. Removed. */}

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
