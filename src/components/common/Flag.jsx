import React from 'react';

export default function Flag({ country = 'us', className = '', style = {} }) {
  const c = country.toLowerCase();

  const defaultStyle = {
    display: 'inline-block',
    verticalAlign: 'middle',
    width: 20,
    height: 14,
    borderRadius: 2,
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
    border: '1px solid rgba(0, 0, 0, 0.1)',
    flexShrink: 0,
    ...style,
  };

  if (c === 'eg' || c === 'egypt' || c === 'ar') {
    return (
      <svg
        viewBox="0 0 640 480"
        className={className}
        style={defaultStyle}
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Egypt Flag"
      >
        <path fill="#c8102e" d="M0 0h640v160H0z" />
        <path fill="#ffffff" d="M0 160h640v160H0z" />
        <path fill="#000000" d="M0 320h640v160H0z" />
        {/* Eagle of Saladin */}
        <g fill="#c69214" stroke="#a0750c" strokeWidth="1.5" transform="translate(285, 175) scale(0.7)">
          <path d="M50 5 C45 15 35 22 25 40 C15 58 10 78 0 95 C15 90 30 85 40 75 C38 90 35 105 20 125 C35 115 50 105 50 90 C50 105 65 115 80 125 C65 105 62 90 60 75 C70 85 85 90 100 95 C90 78 85 58 75 40 C65 22 55 15 50 5 Z" />
          <path fill="#ffffff" stroke="#c69214" strokeWidth="3" d="M35 52 L65 52 L60 88 L50 98 L40 88 Z" />
          <path fill="#c69214" d="M43 60 h14 v20 h-14 z" />
        </g>
      </svg>
    );
  }

  // USA Flag default
  return (
    <svg
      viewBox="0 0 640 480"
      className={className}
      style={defaultStyle}
      xmlns="http://www.w3.org/2000/svg"
      aria-label="USA Flag"
    >
      <g fillRule="evenodd">
        <path fill="#bd3d44" d="M0 0h640v480H0z" />
        <path stroke="#fff" strokeWidth="37" d="M0 55.5h640M0 129.5h640M0 203.5h640M0 277.5h640M0 351.5h640M0 425.5h640" />
        <path fill="#192f5d" d="M0 0h296v259H0z" />
        <g fill="#fff">
          <g id="us-star">
            <polygon points="24.6,18 27.6,27.3 37.3,27.3 29.5,33 32.5,42.3 24.6,36.6 16.8,42.3 19.8,33 12,27.3 21.7,27.3" transform="scale(0.52) translate(-6,-4)" />
          </g>
          <use href="#us-star" x="25" />
          <use href="#us-star" x="50" />
          <use href="#us-star" x="75" />
          <use href="#us-star" x="100" />
          <use href="#us-star" x="125" />
          <use href="#us-star" x="150" />
          <use href="#us-star" y="24" x="12" />
          <use href="#us-star" y="24" x="37" />
          <use href="#us-star" y="24" x="62" />
          <use href="#us-star" y="24" x="87" />
          <use href="#us-star" y="24" x="112" />
          <use href="#us-star" y="24" x="137" />
          <use href="#us-star" y="48" />
          <use href="#us-star" y="48" x="25" />
          <use href="#us-star" y="48" x="50" />
          <use href="#us-star" y="48" x="75" />
          <use href="#us-star" y="48" x="100" />
          <use href="#us-star" y="48" x="125" />
          <use href="#us-star" y="48" x="150" />
          <use href="#us-star" y="72" x="12" />
          <use href="#us-star" y="72" x="37" />
          <use href="#us-star" y="72" x="62" />
          <use href="#us-star" y="72" x="87" />
          <use href="#us-star" y="72" x="112" />
          <use href="#us-star" y="72" x="137" />
          <use href="#us-star" y="96" />
          <use href="#us-star" y="96" x="25" />
          <use href="#us-star" y="96" x="50" />
          <use href="#us-star" y="96" x="75" />
          <use href="#us-star" y="96" x="100" />
          <use href="#us-star" y="96" x="125" />
          <use href="#us-star" y="96" x="150" />
        </g>
      </g>
    </svg>
  );
}
