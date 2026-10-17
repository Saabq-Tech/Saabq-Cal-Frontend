import { Component, Suspense, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { TEMPLATE_COMPONENTS } from "./registry";
import { ensureTemplateFont } from "./fonts";

/**
 * If a template fails to render, show the fallback instead of breaking the page.
 * Keyed by template id, so switching templates in the editor starts with a fresh boundary.
 */
class TemplateBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

/**
 * Renders a landing page site (see adapter.buildLandingSite).
 * Public pages: links into this app navigate without a full reload.
 * Editor preview (site.preview): links never leave the editor; section links scroll the preview.
 */
export default function LandingPageRenderer({
  site,
  fallback = null,
  loading = null,
}) {
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const Template = TEMPLATE_COMPONENTS[site?.templateId];

  useEffect(() => {
    if (site?.templateId) ensureTemplateFont(site.templateId, site.fontChoice);
  }, [site?.templateId, site?.fontChoice]);

  if (!Template) return fallback;

  const handleClick = (event) => {
    const anchor = event.target.closest?.("a[href]");
    if (!anchor || !containerRef.current?.contains(anchor)) return;
    const href = anchor.getAttribute("href") || "";

    if (href.startsWith("#")) {
      if (site.preview) {
        event.preventDefault();
        const target =
          href.length > 1
            ? containerRef.current.querySelector(
                `[id="${CSS.escape(href.slice(1))}"]`,
              )
            : null;
        target?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      return;
    }

    if (site.preview) {
      event.preventDefault();
      return;
    }

    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey
    )
      return;
    if (anchor.target === "_blank") return;
    const url = new URL(anchor.href, window.location.href);
    if (url.origin !== window.location.origin) return;

    const base = (import.meta.env.BASE_URL || "/").replace(/\/$/, "");
    const path = url.pathname.startsWith(base)
      ? url.pathname.slice(base.length) || "/"
      : url.pathname;
    event.preventDefault();
    navigate(`${path}${url.search}${url.hash}`);
  };

  return (
    <div ref={containerRef} className="landing-page-root" onClick={handleClick}>
      <TemplateBoundary key={site.templateId} fallback={fallback}>
        <Suspense fallback={loading}>
          <Template site={site} />
        </Suspense>
      </TemplateBoundary>
    </div>
  );
}
