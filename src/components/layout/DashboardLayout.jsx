import { Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import DashboardSidebar from "./DashboardSidebar";
import PageLoader from "../ui/PageLoader";
import GoogleNotConnectedBanner from "../common/GoogleNotConnectedBanner";

export default function DashboardLayout() {
  const { user, userType } = useAuth();
  const location = useLocation();

  if (!user) return <PageLoader />;

  // Member: full-width dashboard shell (matches workspace layout)
  if (userType === "member") {
    return (
      <div className="workspace-dashboard-shell animate-page-enter">
        <div className="workspace-dashboard-grid">
          <DashboardSidebar variant="dashboard" />

          <div
            key={location.pathname}
            className="workspace-dashboard-content animate-fade-in-up"
          >
            <GoogleNotConnectedBanner />
            <Outlet />
          </div>
        </div>
      </div>
    );
  }

  // Customer: original constrained-width profile layout
  return (
    <div className="main-content">
      <div className="container profile-page animate-page-enter">
        <GoogleNotConnectedBanner />

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
