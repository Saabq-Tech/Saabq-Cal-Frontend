import { useState, useRef, useEffect } from "react";

/**
 * Lazy-loaded image using IntersectionObserver.
 * Prevents CLS with explicit width/height and shows a placeholder until visible.
 *
 * @param {object}  props
 * @param {string}  props.src       - Image source URL
 * @param {string}  props.alt       - Image alt text (required for a11y)
 * @param {number}  [props.width]   - Explicit width to prevent layout shift
 * @param {number}  [props.height]  - Explicit height to prevent layout shift
 * @param {string}  [props.className]
 * @param {object}  [props.style]
 * @param {string}  [props.fallbackSrc] - Fallback image on error
 * @param {string}  [props.objectFit]   - CSS object-fit value (default "cover")
 */
export default function LazyImage({
  src,
  alt,
  width,
  height,
  className = "",
  style = {},
  fallbackSrc,
  objectFit = "cover",
  ...rest
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    const el = imgRef.current;
    if (!el) return;

    // If IntersectionObserver is not available, load immediately
    if (!("IntersectionObserver" in window)) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(el);
        }
      },
      { rootMargin: "200px 0px", threshold: 0.01 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const handleError = () => {
    if (fallbackSrc && !hasError) {
      setHasError(true);
    }
  };

  const resolvedSrc = hasError && fallbackSrc ? fallbackSrc : src;

  const placeholderStyle = {
    width: width || "100%",
    height: height || "auto",
    backgroundColor: "var(--surface-alt, #f1f5f9)",
    borderRadius: "inherit",
    ...style,
  };

  return (
    <div
      ref={imgRef}
      style={{ display: "inline-block", lineHeight: 0, ...placeholderStyle }}
      className={className}
    >
      {isVisible && resolvedSrc ? (
        <img
          src={resolvedSrc}
          alt={alt}
          width={width}
          height={height}
          loading="lazy"
          onError={handleError}
          style={{
            width: width || "100%",
            height: height || "100%",
            objectFit,
            display: "block",
            ...style,
          }}
          {...rest}
        />
      ) : (
        <div
          className="skeleton-pulse"
          style={{
            width: "100%",
            height: "100%",
            minHeight: height || 40,
            borderRadius: "inherit",
          }}
          aria-hidden="true"
        />
      )}
    </div>
  );
}
