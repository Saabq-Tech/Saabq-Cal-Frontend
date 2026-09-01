/**
 * The about-section artwork. Inline SVG rather than an exported image so it
 * stays sharp at any size, weighs nothing extra, and takes its colours from
 * the active theme through the design tokens.
 */
export default function AboutIllustration() {
  return (
    <svg
      className="about-art"
      viewBox="0 0 420 330"
      role="presentation"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* soft background disc */}
      <circle cx="222" cy="150" r="132" fill="var(--primary-subtle)" />
      <path
        d="M42 300 Q150 250 300 288"
        fill="none"
        stroke="var(--border)"
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* dot grid */}
      <g fill="var(--border)">
        {[0, 1, 2, 3].map((row) =>
          [0, 1, 2, 3].map((col) => (
            <circle
              key={`${row}-${col}`}
              cx={370 + col * 13}
              cy={28 + row * 13}
              r="2.5"
            />
          )),
        )}
      </g>

      {/* calendar body */}
      <rect
        x="120"
        y="70"
        width="176"
        height="168"
        rx="14"
        fill="var(--surface)"
        stroke="var(--border)"
        strokeWidth="2"
      />

      {/* spiral binding */}
      <g stroke="var(--secondary)" strokeWidth="5" strokeLinecap="round">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <path key={i} d={`M${146 + i * 26} 56 v26`} fill="none" />
        ))}
      </g>

      {/* date grid, with one day picked */}
      <g>
        {[0, 1, 2, 3].map((row) =>
          [0, 1, 2, 3, 4].map((col) => {
            const picked = row === 2 && col === 2;
            return (
              <rect
                key={`${row}-${col}`}
                x={137 + col * 30}
                y={103 + row * 30}
                width="22"
                height="22"
                rx="6"
                fill={picked ? "var(--primary)" : "var(--surface-alt)"}
              />
            );
          }),
        )}
        <path
          d="M203 175 l4 4 7-8"
          fill="none"
          stroke="var(--primary-foreground)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>

      {/* clock, overlapping the calendar's lower corner */}
      <circle
        cx="118"
        cy="222"
        r="46"
        fill="var(--surface)"
        stroke="var(--secondary)"
        strokeWidth="7"
      />
      <path
        d="M118 194 v28 h20"
        fill="none"
        stroke="var(--secondary)"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* chat bubble */}
      <g>
        <rect
          x="66"
          y="26"
          width="72"
          height="50"
          rx="14"
          fill="var(--secondary)"
        />
        <path d="M86 76 l0 16 16-16 z" fill="var(--secondary)" />
        <g fill="var(--primary-foreground)">
          <circle cx="88" cy="51" r="4.5" />
          <circle cx="102" cy="51" r="4.5" />
          <circle cx="116" cy="51" r="4.5" />
        </g>
      </g>

      {/* contact card */}
      <g>
        <rect
          x="300"
          y="72"
          width="104"
          height="56"
          rx="12"
          fill="var(--surface)"
          stroke="var(--border)"
          strokeWidth="2"
        />
        <circle cx="322" cy="100" r="11" fill="var(--surface-alt)" />
        <path d="M316 105 a6 6 0 0 1 12 0" fill="var(--muted)" />
        <circle cx="322" cy="95" r="4" fill="var(--muted)" />
        <rect
          x="340"
          y="88"
          width="52"
          height="6"
          rx="3"
          fill="var(--surface-alt)"
        />
        <rect
          x="340"
          y="100"
          width="40"
          height="6"
          rx="3"
          fill="var(--surface-alt)"
        />
        <rect
          x="340"
          y="112"
          width="46"
          height="6"
          rx="3"
          fill="var(--surface-alt)"
        />
      </g>

      {/* confirmation badge */}
      <circle
        cx="332"
        cy="196"
        r="24"
        fill="var(--surface)"
        stroke="var(--primary)"
        strokeWidth="2.5"
      />
      <path
        d="M322 196 l7 7 14-14"
        fill="none"
        stroke="var(--primary)"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* plant */}
      <g>
        <path
          d="M292 262 h44 l-6 40 h-32 z"
          fill="var(--surface-alt)"
          stroke="var(--border)"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path
          d="M314 262 c0-22 -12-32 -22-36 c2 20 10 30 22 36 z"
          fill="var(--secondary)"
        />
        <path
          d="M314 262 c0-26 12-36 24-40 c-2 22 -12 34 -24 40 z"
          fill="var(--primary)"
        />
      </g>
    </svg>
  );
}
