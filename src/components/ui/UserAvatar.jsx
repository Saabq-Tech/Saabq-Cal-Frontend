import { useState } from 'react';

export function getInitials(name) {
  if (!name || typeof name !== 'string') return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) {
    const chars = Array.from(parts[0]);
    if (chars.length >= 2) {
      return (chars[0] + chars[1]).toUpperCase();
    }
    return (chars[0] || '?').toUpperCase();
  }
  const firstChar = Array.from(parts[0])[0] || '';
  const lastChar = Array.from(parts[parts.length - 1])[0] || '';
  return (firstChar + lastChar).toUpperCase();
}

export default function UserAvatar({ name, avatarUrl, size = 36, className = '' }) {
  const [imgFailed, setImgFailed] = useState(false);
  const initials = getInitials(name);

  const isFallbackAvatar =
    !avatarUrl ||
    imgFailed ||
    typeof avatarUrl !== 'string' ||
    !avatarUrl.trim();

  if (isFallbackAvatar) {
    return (
      <div
        role="img"
        aria-label={name ? `صورة ${name}` : 'الصورة الشخصية'}
        className={`user-avatar-initials ${className}`}
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          background: 'var(--primary)',
          color: '#ffffff',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 700,
          fontSize: Math.max(11, Math.round(size * 0.36)),
          userSelect: 'none',
          flexShrink: 0,
          lineHeight: 1,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }}
      >
        {initials}
      </div>
    );
  }

  return (
    <img
      src={avatarUrl}
      alt={name || 'User'}
      onError={() => setImgFailed(true)}
      className={`user-avatar-img ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        objectFit: 'cover',
        flexShrink: 0,
      }}
    />
  );
}
