import { useState, useEffect, useCallback } from "react";
import { useLanguage } from "../../context/LanguageContext";

/**
 * GoToTopButton — Floating button that scrolls the page to the top.
 * Appears after the user scrolls past a threshold and hides near the top.
 */
export default function GoToTopButton() {
  const { t } = useLanguage();
  const [visible, setVisible] = useState(false);

  const handleScroll = useCallback(() => {
    setVisible(window.scrollY > 400);
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <button
      id="go-to-top-btn"
      className={`go-to-top-btn${visible ? " go-to-top-btn--visible" : ""}`}
      onClick={scrollToTop}
      aria-label={t("backToTop")}
      title={t("backToTop")}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M10 4L4 10M10 4L16 10M10 4V16"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
