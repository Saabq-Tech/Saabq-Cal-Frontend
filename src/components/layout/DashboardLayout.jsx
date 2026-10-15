import { Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "../../styles/dashboard-shell.css";
import DashboardSidebar from "./DashboardSidebar";
import PageLoader from "../ui/PageLoader";
import GoogleNotConnectedBanner from "../common/GoogleNotConnectedBanner";

export default function DashboardLayout() {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) return <PageLoader />;

  // Members and customers share the same full-width shell: a slim sidebar and the page content.
  return (
    <div className="workspace-dashboard-shell animate-page-enter">
      <div className="workspace-dashboard-grid">
        <DashboardSidebar variant="dashboard" />

        <div key={location.pathname} className="workspace-dashboard-content">
          <GoogleNotConnectedBanner />
          <Outlet />
        </div>
      </div>
    </div>
  );
}
