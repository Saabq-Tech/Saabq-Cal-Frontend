import { useCallback, useEffect, useRef, useState } from "react";
import { useLanguage } from "../../context/LanguageContext";
import Icon from "./Icon";

const SCROLL_STEP = 260;
const SMOOTH_SCROLL_MS = 450;

/**
 * Single-row chip list that scrolls sideways, with arrows that appear only
 * when there is more to see in that direction.
 */
export default function ChipScroller({ className = "", children, ...rest }) {
  const { isRTL } = useLanguage();
  const rowRef = useRef(null);
  const [canBack, setCanBack] = useState(false);
  const [canForward, setCanForward] = useState(false);

  const updateArrows = useCallback(() => {
    const row = rowRef.current;
    if (!row) return;
    // In RTL, scrollLeft runs from 0 down to a negative value.
    const offset = Math.abs(row.scrollLeft);
    const max = row.scrollWidth - row.clientWidth;
    setCanBack(offset > 2);
    setCanForward(max - offset > 2);
  }, []);

  useEffect(() => {
    const row = rowRef.current;
    if (!row) return undefined;
    updateArrows();
    row.addEventListener("scroll", updateArrows, { passive: true });
    window.addEventListener("resize", updateArrows);
    return () => {
      row.removeEventListener("scroll", updateArrows);
      window.removeEventListener("resize", updateArrows);
    };
  }, [children, updateArrows]);

  const scroll = (direction) => {
    const sign = isRTL ? -1 : 1;
    rowRef.current?.scrollBy({
      left: direction * sign * SCROLL_STEP,
      behavior: "smooth",
    });
    // Some browsers skip scroll events for programmatic smooth scrolling.
    window.setTimeout(updateArrows, SMOOTH_SCROLL_MS);
  };

  return (
    <div className="chip-scroller">
      {canBack && (
        <button
          type="button"
          className="chip-scroller-arrow is-back"
          onClick={() => scroll(-1)}
          aria-label={isRTL ? "السابق" : "Previous"}
        >
          <Icon name={isRTL ? "chevron-right" : "chevron-left"} size={18} />
        </button>
      )}
      <div ref={rowRef} className={className} {...rest}>
        {children}
      </div>
      {canForward && (
        <button
          type="button"
          className="chip-scroller-arrow is-forward"
          onClick={() => scroll(1)}
          aria-label={isRTL ? "التالي" : "Next"}
        >
          <Icon name={isRTL ? "chevron-left" : "chevron-right"} size={18} />
        </button>
      )}
    </div>
  );
}
