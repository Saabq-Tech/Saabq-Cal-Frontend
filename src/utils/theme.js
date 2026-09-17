export function hexToRgba(hex, alpha = 0.12) {
  if (!hex || typeof hex !== "string") return `rgba(2, 105, 130, ${alpha})`;
  let c = hex.replace("#", "");
  if (c.length === 3) {
    c = c
      .split("")
      .map((char) => char + char)
      .join("");
  }
  const num = parseInt(c, 16);
  if (isNaN(num)) return `rgba(2, 105, 130, ${alpha})`;
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function updateMetaThemeColor(color) {
  try {
    const isDark = document.documentElement.classList.contains("dark");
    let targetColor = color;
    if (
      !targetColor ||
      typeof targetColor !== "string" ||
      !/^#[0-9A-Fa-f]{3,8}$/.test(targetColor.trim())
    ) {
      targetColor = isDark ? "#022a35" : "#026982";
    } else {
      targetColor = targetColor.trim();
    }

    // Force mobile Android Chrome / WebKit to re-evaluate the status bar color
    const existingMetas = document.querySelectorAll('meta[name="theme-color"]');
    existingMetas.forEach((el) => el.remove());

    const meta = document.createElement("meta");
    meta.setAttribute("name", "theme-color");
    meta.setAttribute("content", targetColor);
    document.head.appendChild(meta);

    // Also sync msapplication-navbutton-color
    let msMeta = document.querySelector(
      'meta[name="msapplication-navbutton-color"]',
    );
    if (!msMeta) {
      msMeta = document.createElement("meta");
      msMeta.setAttribute("name", "msapplication-navbutton-color");
      document.head.appendChild(msMeta);
    }
    msMeta.setAttribute("content", targetColor);
  } catch {
    // Ignore DOM errors
  }
}

function injectWorkspaceBrandingStyle(branding) {
  if (typeof document === "undefined") return;
  let styleEl = document.getElementById("saabq-workspace-branding");
  if (!branding) {
    if (styleEl) styleEl.remove();
    return;
  }

  const isHex = (val) =>
    val && typeof val === "string" && /^#[0-9A-Fa-f]{3,8}$/.test(val.trim());

  let rootVars = [];
  let darkVars = [];

  // Brand Palette
  if (isHex(branding.primary_color)) {
    const p = branding.primary_color.trim();
    rootVars.push(`--primary: ${p};`);
    rootVars.push(`--primary-color: ${p};`);
    rootVars.push(`--primary-light: ${p};`);
    rootVars.push(`--primary-subtle: ${hexToRgba(p, 0.14)};`);
    rootVars.push(`--sb-accent: ${p};`);
    rootVars.push(`--sb-accent-subtle: ${hexToRgba(p, 0.14)};`);
    rootVars.push(`--sb-active-shadow: ${hexToRgba(p, 0.2)};`);
  }
  if (isHex(branding.secondary_color)) {
    const s = branding.secondary_color.trim();
    rootVars.push(`--secondary: ${s};`);
    rootVars.push(`--secondary-color: ${s};`);
    rootVars.push(`--accent: ${s};`);
    rootVars.push(`--secondary-subtle: ${hexToRgba(s, 0.14)};`);
  }
  if (isHex(branding.hover_color)) {
    const h = branding.hover_color.trim();
    rootVars.push(`--hover-color: ${h};`);
    rootVars.push(`--primary-hover: ${h};`);
    rootVars.push(`--accent-hover: ${h};`);
    rootVars.push(`--tertiary: ${h};`);
    rootVars.push(`--tertiary-subtle: ${hexToRgba(h, 0.14)};`);
  }
  if (isHex(branding.accent_color)) {
    const a = branding.accent_color.trim();
    rootVars.push(`--accent: ${a};`);
    rootVars.push(`--accent-hover: ${a};`);
  }

  // Light Mode Palette
  if (isHex(branding.text_color_light)) {
    const t = branding.text_color_light.trim();
    rootVars.push(`--text: ${t};`);
    rootVars.push(`--text-secondary: ${t};`);
  }
  if (isHex(branding.heading_color_light)) {
    rootVars.push(`--heading: ${branding.heading_color_light.trim()};`);
  }
  if (isHex(branding.background_color_light)) {
    const bg = branding.background_color_light.trim();
    rootVars.push(`--background: ${bg};`);
    rootVars.push(`--background-subtle: ${hexToRgba(bg, 0.95)};`);
  }
  if (isHex(branding.surface_color_light)) {
    const sf = branding.surface_color_light.trim();
    rootVars.push(`--surface: ${sf};`);
    rootVars.push(`--surface-alt: ${hexToRgba(sf, 0.95)};`);
  }
  if (isHex(branding.border_color_light)) {
    const bd = branding.border_color_light.trim();
    rootVars.push(`--border: ${bd};`);
    rootVars.push(`--border-light: ${hexToRgba(bd, 0.5)};`);
  }

  // Dark Mode Palette
  if (isHex(branding.text_color_dark)) {
    const td = branding.text_color_dark.trim();
    darkVars.push(`--text: ${td};`);
    darkVars.push(`--text-secondary: ${td};`);
  }
  if (isHex(branding.heading_color_dark)) {
    darkVars.push(`--heading: ${branding.heading_color_dark.trim()};`);
  }
  if (isHex(branding.background_color_dark)) {
    const bgd = branding.background_color_dark.trim();
    darkVars.push(`--background: ${bgd};`);
    darkVars.push(`--background-subtle: ${hexToRgba(bgd, 0.9)};`);
  }
  if (isHex(branding.surface_color_dark)) {
    const sfd = branding.surface_color_dark.trim();
    darkVars.push(`--surface: ${sfd};`);
    darkVars.push(`--surface-alt: ${hexToRgba(sfd, 0.9)};`);
  }
  if (isHex(branding.border_color_dark)) {
    const bdd = branding.border_color_dark.trim();
    darkVars.push(`--border: ${bdd};`);
    darkVars.push(`--border-light: ${hexToRgba(bdd, 0.5)};`);
  }

  if (rootVars.length === 0 && darkVars.length === 0) {
    if (styleEl) styleEl.remove();
    return;
  }

  let css = "";
  if (rootVars.length > 0) {
    css += `:root {\n  ${rootVars.join("\n  ")}\n}\n`;
  }
  if (darkVars.length > 0) {
    css += `html.dark, [data-theme="dark"] {\n  ${darkVars.join("\n  ")}\n}\n`;
  }

  if (!styleEl) {
    styleEl = document.createElement("style");
    styleEl.id = "saabq-workspace-branding";
    document.head.appendChild(styleEl);
  }
  styleEl.textContent = css;
}

export function applyWorkspaceBranding(
  primaryOrObject,
  secondaryColor,
  hoverColor,
  extended = {},
) {
  const root = document.documentElement;

  // Support passing either (primary, secondary, hover, extended) or single workspace branding object
  let branding = {};
  if (primaryOrObject && typeof primaryOrObject === "object") {
    branding = { ...primaryOrObject };
  } else {
    branding = {
      primary_color: primaryOrObject,
      secondary_color: secondaryColor,
      hover_color: hoverColor,
      ...extended,
    };
  }

  const primaryColor = branding.primary_color;
  const isHex = (val) =>
    val && typeof val === "string" && /^#[0-9A-Fa-f]{3,8}$/.test(val.trim());

  if (isHex(primaryColor)) {
    root.style.setProperty("--primary", primaryColor);
    root.style.setProperty("--primary-color", primaryColor);
    root.style.setProperty("--primary-light", primaryColor);
    root.style.setProperty("--primary-subtle", hexToRgba(primaryColor, 0.14));
    root.style.setProperty("--sb-accent", primaryColor);
    root.style.setProperty("--sb-accent-subtle", hexToRgba(primaryColor, 0.14));
    root.style.setProperty("--sb-active-shadow", hexToRgba(primaryColor, 0.2));
    localStorage.setItem("saabq_primary_color", primaryColor);
  } else {
    root.style.removeProperty("--primary");
    root.style.removeProperty("--primary-color");
    root.style.removeProperty("--primary-light");
    root.style.removeProperty("--primary-subtle");
    root.style.removeProperty("--sb-accent");
    root.style.removeProperty("--sb-accent-subtle");
    root.style.removeProperty("--sb-active-shadow");
    localStorage.removeItem("saabq_primary_color");
  }

  if (isHex(branding.secondary_color)) {
    root.style.setProperty("--secondary", branding.secondary_color);
    root.style.setProperty("--secondary-color", branding.secondary_color);
    root.style.setProperty("--accent", branding.secondary_color);
    root.style.setProperty(
      "--secondary-subtle",
      hexToRgba(branding.secondary_color, 0.14),
    );
    localStorage.setItem("saabq_secondary_color", branding.secondary_color);
  } else {
    root.style.removeProperty("--secondary");
    root.style.removeProperty("--secondary-color");
    root.style.removeProperty("--accent");
    root.style.removeProperty("--secondary-subtle");
    localStorage.removeItem("saabq_secondary_color");
  }

  if (isHex(branding.hover_color)) {
    root.style.setProperty("--hover-color", branding.hover_color);
    root.style.setProperty("--primary-hover", branding.hover_color);
    root.style.setProperty("--accent-hover", branding.hover_color);
    root.style.setProperty("--tertiary", branding.hover_color);
    root.style.setProperty(
      "--tertiary-subtle",
      hexToRgba(branding.hover_color, 0.14),
    );
    localStorage.setItem("saabq_hover_color", branding.hover_color);
  } else {
    root.style.removeProperty("--hover-color");
    root.style.removeProperty("--primary-hover");
    root.style.removeProperty("--accent-hover");
    root.style.removeProperty("--tertiary");
    root.style.removeProperty("--tertiary-subtle");
    localStorage.removeItem("saabq_hover_color");
  }

  // Inject full CSS variables (brand, light, and dark) via dynamic style element
  injectWorkspaceBrandingStyle(branding);

  // Dynamically update upper/bottom browser theme color to match bottom color
  const isDark = root.classList.contains("dark");
  const bottomColor = isDark
    ? branding.background_color_dark ||
      branding.surface_color_dark ||
      branding.secondary_color ||
      branding.primary_color ||
      "#034d60"
    : branding.secondary_color || branding.primary_color || "#033d4b";
  updateMetaThemeColor(bottomColor);
}

export function resetWorkspaceBranding() {
  injectWorkspaceBrandingStyle(null);
  const root = document.documentElement;

  root.style.removeProperty("--primary");
  root.style.removeProperty("--primary-color");
  root.style.removeProperty("--primary-light");
  root.style.removeProperty("--primary-subtle");
  root.style.removeProperty("--sb-accent");
  root.style.removeProperty("--sb-accent-subtle");
  root.style.removeProperty("--sb-active-shadow");
  root.style.removeProperty("--secondary");
  root.style.removeProperty("--secondary-color");
  root.style.removeProperty("--accent");
  root.style.removeProperty("--secondary-subtle");
  root.style.removeProperty("--hover-color");
  root.style.removeProperty("--primary-hover");
  root.style.removeProperty("--accent-hover");
  root.style.removeProperty("--tertiary");
  root.style.removeProperty("--tertiary-subtle");

  localStorage.removeItem("saabq_primary_color");
  localStorage.removeItem("saabq_secondary_color");
  localStorage.removeItem("saabq_hover_color");

  updateMetaThemeColor(null);
}

export function getSavedWorkspaceBranding() {
  try {
    const storedUser = localStorage.getItem("saabq_user");
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      if (parsed?.workspace) {
        const ws = parsed.workspace;
        return {
          primary_color: ws.primary_color || null,
          secondary_color: ws.secondary_color || null,
          hover_color: ws.hover_color || null,
          accent_color: ws.accent_color || null,
          text_color_light: ws.text_color_light || null,
          heading_color_light: ws.heading_color_light || null,
          background_color_light: ws.background_color_light || null,
          surface_color_light: ws.surface_color_light || null,
          border_color_light: ws.border_color_light || null,
          text_color_dark: ws.text_color_dark || null,
          heading_color_dark: ws.heading_color_dark || null,
          background_color_dark: ws.background_color_dark || null,
          surface_color_dark: ws.surface_color_dark || null,
          border_color_dark: ws.border_color_dark || null,
        };
      }
    }
  } catch {
    // Ignore parsing errors
  }
  return null;
}

export function isWorkspaceRoute(pathname) {
  if (!pathname) return false;
  const path = pathname.toLowerCase().trim();

  // 1. Member workspace dashboard & portal routes
  // e.g. /member, /member/workspace, /member/workspace/*, /member/profile, etc.
  // BUT NOT guest auth pages like /member/login, /member/register, etc.
  if (path === "/member" || path.startsWith("/member/")) {
    const isMemberGuestAuth =
      path === "/member/login" ||
      path.startsWith("/member/login/") ||
      path === "/member/register" ||
      path.startsWith("/member/register/") ||
      path === "/member/forgot-password" ||
      path.startsWith("/member/forgot-password/") ||
      path === "/member/reset-password" ||
      path.startsWith("/member/reset-password/") ||
      path === "/member/verify-account" ||
      path.startsWith("/member/verify-account/");
    return !isMemberGuestAuth;
  }

  // 2. Specific workspace pages (e.g. /workspaces/:idOrSlug, /workspaces/:idOrSlug/book, /workspaces/:idOrSlug/specialist/:id)
  // NOTE: /workspaces or /workspaces/ (without slug/id) is the Workspaces Explorer page, which is a PUBLIC page!
  if (path.startsWith("/workspaces/")) {
    const segments = path.split("/").filter(Boolean);
    // segments[0] is 'workspaces'. If length >= 2, there is a specific slug or ID
    if (segments.length >= 2) {
      return true;
    }
  }

  return false;
}

export function initWorkspaceBranding() {
  try {
    const currentPath =
      typeof window !== "undefined" ? window.location.pathname : "";

    if (isWorkspaceRoute(currentPath)) {
      if (
        currentPath.toLowerCase() === "/member" ||
        currentPath.toLowerCase().startsWith("/member/")
      ) {
        const saved = getSavedWorkspaceBranding();
        if (saved) {
          applyWorkspaceBranding(saved);
          return;
        }
      }
      return;
    }

    // Public pages (homepage, blog, workspaces explorer, etc.) use default system colors
    resetWorkspaceBranding();
  } catch (e) {
    console.warn("Workspace branding initialization error:", e);
  }
}

// Auto-run immediately when module loads so browser refresh retains workspace colors
initWorkspaceBranding();
