import { createContext, useContext, useEffect } from "react";

/**
 * Lets a page inside MainLayout hide the app's Navbar, Footer and mobile tab bar,
 * e.g. a published workspace landing page that brings its own header and footer.
 */
export const LayoutChromeContext = createContext(null);

export function useHideLayoutChrome(hidden) {
  const ctx = useContext(LayoutChromeContext);

  useEffect(() => {
    if (!ctx) return undefined;
    ctx.setChromeHidden(Boolean(hidden));
    return () => ctx.setChromeHidden(false);
  }, [ctx, hidden]);
}
