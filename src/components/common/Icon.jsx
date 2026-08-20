import React from 'react';

/**
 * Reusable Icon component rendering SVG symbols from in-memory DOM sprite.
 */
export default function Icon({
  name,
  size = 20,
  width,
  height,
  color,
  className = '',
  style = {},
  ...props
}) {
  const iconWidth = width || size;
  const iconHeight = height || size;
  const iconStyle = {
    ...(color ? { color } : {}),
    ...style,
  };

  const symbolId = `#icon-${name}`;

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
