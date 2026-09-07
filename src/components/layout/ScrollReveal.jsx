import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const REVEAL_SELECTORS = [
  "section:not(.no-reveal)",
  ".section:not(.no-reveal)",
  ".section-sm:not(.no-reveal)",
  ".hero-lp:not(.no-reveal)",
  ".card:not(.no-reveal):not(.modal-card):not(.dropdown-card)",
  ".sector-card",
  ".feature-card",
  ".pricing-card",
  ".step-card",
  ".why-badge-card",
  ".about-panel",
  ".channels-panel",
  ".final-cta",
  ".trust-strip-card",
  ".blog-card",
  ".workspace-card",
  ".booking-card",
  ".specialist-profile-card",
  ".appointment-card",
  ".plan-card",
  ".service-card",
  ".workspace-public-section",
  ".workspace-public-hero-card",
  ".reveal-on-scroll",
  "[data-reveal]",
].join(", ");

/**
 * ScrollReveal component
 * Smoothly reveals elements on scroll across all frontend pages with crisp, elegant motion.
 */
export default function ScrollReveal() {
  const { pathname } = useLocation();

  useEffect(() => {
    // If user prefers reduced motion or IntersectionObserver is not available, mark everything visible
    if (
      typeof window === "undefined" ||
      !("IntersectionObserver" in window) ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      document.querySelectorAll(REVEAL_SELECTORS).forEach((el) => {
        el.classList.add("is-revealed");
      });
      return;
    }

    const observedElements = new WeakSet();

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-revealed");
            observer.unobserve(entry.target);
          }
        });
      },
      {
        root: null,
        rootMargin: "0px 0px -25px 0px",
        threshold: 0.05,
      },
    );

    const scanAndObserve = () => {
      const elements = document.querySelectorAll(REVEAL_SELECTORS);
      const windowHeight =
        window.innerHeight || document.documentElement.clientHeight;

      elements.forEach((el) => {
        // Skip elements inside modals, dropdowns, toasts, or mobile drawers
        if (
          el.closest(".modal") ||
          el.closest(".modal-overlay") ||
          el.closest(".notif-confirm-overlay") ||
          el.closest(".navbar") ||
          el.closest(".mobile-drawer") ||
          el.closest(".toast-container") ||
          el.classList.contains("no-reveal")
        ) {
          el.classList.add("is-revealed");
          return;
        }

        if (!observedElements.has(el)) {
          // If element is already in the upper viewport on initial load, reveal immediately
          const rect = el.getBoundingClientRect();
          if (rect.top < windowHeight * 0.92 && rect.bottom > 0) {
            el.classList.add("is-revealed");
          } else {
            observer.observe(el);
          }
          observedElements.add(el);
        }
      });
    };

    // Initial scan on route change
    scanAndObserve();

    // Re-scan after short timeout to catch dynamically rendered items (API loads)
    const timeoutId = setTimeout(scanAndObserve, 250);
    const timeoutId2 = setTimeout(scanAndObserve, 800);

    // Watch for DOM mutations (new components, tab switches, cards loaded via API)
    const mutationObserver = new MutationObserver(() => {
      scanAndObserve();
    });

    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      clearTimeout(timeoutId);
      clearTimeout(timeoutId2);
      observer.disconnect();
      mutationObserver.disconnect();
    };
  }, [pathname]);

  return null;
}
