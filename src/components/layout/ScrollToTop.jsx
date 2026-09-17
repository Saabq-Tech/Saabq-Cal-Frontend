import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { updateMetaThemeColor } from "../../utils/theme";

/**
 * ScrollToTop component
 * Automatically scrolls the window to the top on route/pathname changes,
 * and ensures mobile status bar / browser theme-color stays synchronized.
 */
export default function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (!hash) {
      window.scrollTo(0, 0);
    }
    // Re-assert active workspace theme color on route transitions
    updateMetaThemeColor();
  }, [pathname, hash]);

  return null;
}
