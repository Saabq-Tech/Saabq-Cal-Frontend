export function hexToRgba(hex, alpha = 0.12) {
  if (!hex || typeof hex !== 'string') return `rgba(17, 100, 106, ${alpha})`;
  let c = hex.replace('#', '');
  if (c.length === 3) {
    c = c.split('').map((char) => char + char).join('');
  }
  const num = parseInt(c, 16);
  if (isNaN(num)) return `rgba(17, 100, 106, ${alpha})`;
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function applyWorkspaceBranding(primaryColor, secondaryColor, hoverColor) {
  const root = document.documentElement;

  if (primaryColor && /^#[0-9A-Fa-f]{3,8}$/.test(primaryColor)) {
    root.style.setProperty('--primary', primaryColor);
    root.style.setProperty('--primary-light', primaryColor);
    root.style.setProperty('--primary-subtle', hexToRgba(primaryColor, 0.14));
    localStorage.setItem('saabq_primary_color', primaryColor);
  } else {
    root.style.removeProperty('--primary');
    root.style.removeProperty('--primary-light');
    root.style.removeProperty('--primary-subtle');
    localStorage.removeItem('saabq_primary_color');
  }

  if (secondaryColor && /^#[0-9A-Fa-f]{3,8}$/.test(secondaryColor)) {
    root.style.setProperty('--secondary', secondaryColor);
    root.style.setProperty('--accent', secondaryColor);
    root.style.setProperty('--secondary-subtle', hexToRgba(secondaryColor, 0.14));
    localStorage.setItem('saabq_secondary_color', secondaryColor);
  } else {
    root.style.removeProperty('--secondary');
    root.style.removeProperty('--accent');
    root.style.removeProperty('--secondary-subtle');
    localStorage.removeItem('saabq_secondary_color');
  }

  if (hoverColor && /^#[0-9A-Fa-f]{3,8}$/.test(hoverColor)) {
    root.style.setProperty('--hover-color', hoverColor);
    root.style.setProperty('--primary-hover', hoverColor);
    root.style.setProperty('--accent-hover', hoverColor);
    root.style.setProperty('--tertiary', hoverColor);
    root.style.setProperty('--tertiary-subtle', hexToRgba(hoverColor, 0.14));
    localStorage.setItem('saabq_hover_color', hoverColor);
  } else {
    root.style.removeProperty('--hover-color');
    root.style.removeProperty('--primary-hover');
    root.style.removeProperty('--accent-hover');
    root.style.removeProperty('--tertiary');
    root.style.removeProperty('--tertiary-subtle');
    localStorage.removeItem('saabq_hover_color');
  }
}

export function initWorkspaceBranding() {
  try {
    let p = localStorage.getItem('saabq_primary_color');
    let s = localStorage.getItem('saabq_secondary_color');
    let h = localStorage.getItem('saabq_hover_color');

    if (!p || !s || !h) {
      const storedUser = localStorage.getItem('saabq_user');
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
    }
  } catch (e) {
    console.warn('Workspace branding initialization error:', e);
  }
}

// Auto-run immediately when module loads so browser refresh retains workspace colors
initWorkspaceBranding();
