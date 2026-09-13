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
      !/^#[0-9A-Fa-f]{3,8}$/.test(targetColor)
    ) {
      // Prioritize secondary/bar color (matching mobile tab bar), then primary
      const s = localStorage.getItem("saabq_secondary_color");
      const p = localStorage.getItem("saabq_primary_color");
      if (s && /^#[0-9A-Fa-f]{3,8}$/.test(s)) {
        targetColor = s;
      } else if (p && /^#[0-9A-Fa-f]{3,8}$/.test(p)) {
        targetColor = p;
      } else {
        const storedUser = localStorage.getItem("saabq_user");
        if (storedUser) {
          try {
            const parsed = JSON.parse(storedUser);
            if (parsed?.workspace) {
              targetColor =
                parsed.workspace.secondary_color ||
                parsed.workspace.primary_color ||
                null;
            }
          } catch {}
        }
      }
    }

    if (!targetColor || !/^#[0-9A-Fa-f]{3,8}$/.test(targetColor)) {
      targetColor = isDark ? "#022a35" : "#026982";
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

export function applyWorkspaceBranding(
  primaryColor,
  secondaryColor,
  hoverColor,
) {
  const root = document.documentElement;

  // Harmonize workspace color tokens so bars and actions don't clash
  const validPrimary =
    primaryColor && /^#[0-9A-Fa-f]{3,8}$/.test(primaryColor)
      ? primaryColor
      : null;
  const validSecondary =
    secondaryColor && /^#[0-9A-Fa-f]{3,8}$/.test(secondaryColor)
      ? secondaryColor
      : null;

  const effectivePrimary = validPrimary || validSecondary;
  const effectiveSecondary = validSecondary || validPrimary;

  if (effectivePrimary) {
    root.style.setProperty("--primary", effectivePrimary);
    root.style.setProperty("--primary-color", effectivePrimary);
    root.style.setProperty("--primary-light", effectivePrimary);
    root.style.setProperty(
      "--primary-subtle",
      hexToRgba(effectivePrimary, 0.14),
    );
    root.style.setProperty("--sb-accent", effectivePrimary);
    root.style.setProperty(
      "--sb-accent-subtle",
      hexToRgba(effectivePrimary, 0.14),
    );
    root.style.setProperty(
      "--sb-active-shadow",
      hexToRgba(effectivePrimary, 0.2),
    );
    localStorage.setItem("saabq_primary_color", effectivePrimary);
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

  if (effectiveSecondary) {
    root.style.setProperty("--secondary", effectiveSecondary);
    root.style.setProperty("--secondary-color", effectiveSecondary);
    root.style.setProperty("--accent", effectiveSecondary);
    root.style.setProperty(
      "--secondary-subtle",
      hexToRgba(effectiveSecondary, 0.14),
    );
    localStorage.setItem("saabq_secondary_color", effectiveSecondary);
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

  // Dynamically update upper browser theme color / mobile status bar to match workspace bar frame
  updateMetaThemeColor(effectiveSecondary || effectivePrimary);

  if (arguments.length > 3 && arguments[3]) {
    applyWorkspaceVibeTheme(arguments[3]);
  }
}

export function applyWorkspaceVibeTheme(vibeKey) {
  try {
    if (vibeKey && typeof vibeKey === "string") {
      document.documentElement.setAttribute("data-workspace-vibe", vibeKey);
      localStorage.setItem("saabq_workspace_vibe", vibeKey);
    } else {
      document.documentElement.removeAttribute("data-workspace-vibe");
      localStorage.removeItem("saabq_workspace_vibe");
    }
  } catch {}
}

export function initWorkspaceBranding() {
  try {
    let p = localStorage.getItem("saabq_primary_color");
    let s = localStorage.getItem("saabq_secondary_color");
    let h = localStorage.getItem("saabq_hover_color");
    let v = localStorage.getItem("saabq_workspace_vibe");

    if (!p || !s || !h || !v) {
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

    if (v) {
      applyWorkspaceVibeTheme(v);
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
