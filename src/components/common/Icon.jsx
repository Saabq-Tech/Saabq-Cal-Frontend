import React from "react";

const ICON_NAME_MAP = {
  "calendar-alt": "calendar",
  "calendar-days": "calendar",
  "credit-card-alt": "credit-card",
  "bell-ring": "bell",
  "video-camera": "video",
  "shield-check": "shield",
  "shield-alt": "shield",
  cog: "settings",
  cogs: "settings",
  gear: "settings",
  "user-alt": "user",
  "users-alt": "users",
  envelope: "mail",
  comment: "message-circle",
  comments: "message-circle",
  "comment-alt": "message-square",
  "x-mark": "x",
  close: "x",
  "rotate-left": "rotate-ccw",
  undo: "rotate-ccw",
};

function normalizeIconName(name) {
  if (!name || typeof name !== "string") return "sparkles";

  let clean = name.trim().toLowerCase();

  // Strip FontAwesome prefixes: 'fa fa-calendar-alt' -> 'calendar-alt', 'fa-video' -> 'video'
  clean = clean
    .replace(/^fa[srldb]?\s+fa-/, "")
    .replace(/^fa\s+/, "")
    .replace(/^fa-/, "")
    .trim();

  return ICON_NAME_MAP[clean] || clean;
}

/**
 * Reusable Icon component rendering SVG symbols from in-memory DOM sprite.
 */
export default function Icon({
  name,
  size = 20,
  width,
  height,
  color,
  className = "",
  style = {},
  ...props
}) {
  const iconWidth = width || size;
  const iconHeight = height || size;
  const iconStyle = {
    ...(color ? { color } : {}),
    ...style,
  };

  const cleanName = normalizeIconName(name);
  const symbolId = `#icon-${cleanName}`;

  return (
    <svg
      width={iconWidth}
      height={iconHeight}
      className={`inline-icon ${className}`.trim()}
      style={iconStyle}
      aria-hidden="true"
      {...props}
    >
      <use href={symbolId} xlinkHref={symbolId} />
    </svg>
  );
}
