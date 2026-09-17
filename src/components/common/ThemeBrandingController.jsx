import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  isWorkspaceRoute,
  applyWorkspaceBranding,
  resetWorkspaceBranding,
} from "../../utils/theme";

/**
 * ThemeBrandingController
 *
 * Ensures that:
 * 1. Public pages (Home, Blog, Workspaces Explorer, Terms, Privacy, Customer Portal, etc.)
 *    always reflect the default Saabq system branding colors.
 * 2. Workspace member dashboard pages (/member/workspace/*, /member/...)
 *    apply the logged-in member's custom workspace branding colors.
 * 3. Specific public workspace profile/booking pages (/workspaces/:idOrSlug)
 *    apply that specific workspace's branding colors via their page-level loaders.
 */
export default function ThemeBrandingController() {
  const { pathname } = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    if (isWorkspaceRoute(pathname)) {
      if (
        pathname.toLowerCase() === "/member" ||
        pathname.toLowerCase().startsWith("/member/")
      ) {
        const ws = user?.workspace;
        if (ws) {
          applyWorkspaceBranding(ws);
        }
      }
      // If it's /workspaces/:idOrSlug, that specific page component handles fetching and applying its colors
    } else {
      // Public pages (homepage, blog, workspaces explorer, etc.) use default system branding
      resetWorkspaceBranding();
    }
  }, [pathname, user?.workspace]);

  return null;
}
