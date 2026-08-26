import { lazy } from "react";

/**
 * Enhanced React.lazy wrapper that automatically reloads the window
 * when a dynamic import fails due to a fresh app deployment (stale asset hash / 404).
 *
 * @param {Function} componentImport - Dynamic import function, e.g. () => import('./MyPage')
 * @returns {React.LazyExoticComponent}
 */
export function lazyWithRetry(componentImport) {
  return lazy(async () => {
    const pageHasBeenReloaded = sessionStorage.getItem(
      "chunk_reload_attempted",
    );

    try {
      const component = await componentImport();
      // Reset the reload flag upon successful dynamic import
      sessionStorage.removeItem("chunk_reload_attempted");
      return component;
    } catch (error) {
      const isDynamicImportError =
        error &&
        (error.name === "TypeError" || error.message) &&
        (/failed to fetch dynamically imported module/i.test(
          error.message || "",
        ) ||
          /importing a module script failed/i.test(error.message || "") ||
          /loading chunk/i.test(error.message || "") ||
          /failed to load resource/i.test(error.message || ""));

      if (isDynamicImportError && !pageHasBeenReloaded) {
        sessionStorage.setItem("chunk_reload_attempted", "true");
        window.location.reload();
        // Return a pending promise so React doesn't crash before reload occurs
        return new Promise(() => {});
      }

      throw error;
    }
  });
}

export default lazyWithRetry;
