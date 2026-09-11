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
    try {
      const component = await componentImport();
      if (component && component.default) {
        return component;
      }
    } catch {
      // First attempt failed, wait 250ms and retry import once
    }

    await new Promise((resolve) => setTimeout(resolve, 250));
    const component = await componentImport();
    if (component && component.default) {
      return component;
    }
    throw new Error(
      "Module failed to load or does not contain a default export.",
    );
  });
}

export default lazyWithRetry;
