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
    let meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "theme-color");
      document.head.appendChild(meta);
    }
    const isDark = document.documentElement.classList.contains("dark");
    if (color && /^#[0-9A-Fa-f]{3,8}$/.test(color)) {
      meta.setAttribute("content", color);
    } else {
      meta.setAttribute("content", isDark ? "#022a35" : "#026982");
    }
  } catch {
    // Ignore DOM errors
  }
}

export function applyWorkspaceBranding(
  primaryColor,
  secondaryColor,
  hoverColor,
) {
  const root = document.documentElement;

  if (primaryColor && /^#[0-9A-Fa-f]{3,8}$/.test(primaryColor)) {
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

  if (secondaryColor && /^#[0-9A-Fa-f]{3,8}$/.test(secondaryColor)) {
    root.style.setProperty("--secondary", secondaryColor);
    root.style.setProperty("--secondary-color", secondaryColor);
    root.style.setProperty("--accent", secondaryColor);
    root.style.setProperty(
      "--secondary-subtle",
      hexToRgba(secondaryColor, 0.14),
    );
    localStorage.setItem("saabq_secondary_color", secondaryColor);
  } else {
    root.style.removeProperty("--secondary");
    root.style.removeProperty("--secondary-color");
    root.style.removeProperty("--accent");
    root.style.removeProperty("--secondary-subtle");
    localStorage.removeItem("saabq_secondary_color");
  }

  if (hoverColor && /^#[0-9A-Fa-f]{3,8}$/.test(hoverColor)) {
    root.style.setProperty("--hover-color", hoverColor);
    root.style.setProperty("--primary-hover", hoverColor);
    root.style.setProperty("--accent-hover", hoverColor);
    root.style.setProperty("--tertiary", hoverColor);
    root.style.setProperty("--tertiary-subtle", hexToRgba(hoverColor, 0.14));
    localStorage.setItem("saabq_hover_color", hoverColor);
  } else {
    root.style.removeProperty("--hover-color");
    root.style.removeProperty("--primary-hover");
    root.style.removeProperty("--accent-hover");
    root.style.removeProperty("--tertiary");
    root.style.removeProperty("--tertiary-subtle");
    localStorage.removeItem("saabq_hover_color");
  }

  // Dynamically update upper browser theme color / mobile status bar
  updateMetaThemeColor(primaryColor);
}

export function initWorkspaceBranding() {
  try {
    let p = localStorage.getItem("saabq_primary_color");
    let s = localStorage.getItem("saabq_secondary_color");
    let h = localStorage.getItem("saabq_hover_color");

    if (!p || !s || !h) {
      const storedUser = localStorage.getItem("saabq_user");
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        if (parsed?.workspace) {
          p = p || parsed.workspace.primary_color;
          s = s || parsed.workspace.secondary_color;
          h = h || parsed.workspace.hover_color;
        }
      }
    }

    if (p || s || h) {
      applyWorkspaceBranding(p, s, h);
    } else {
      updateMetaThemeColor(null);
    }
  } catch (e) {
    console.warn("Workspace branding initialization error:", e);
  }
}

// Auto-run immediately when module loads so browser refresh retains workspace colors
initWorkspaceBranding();
