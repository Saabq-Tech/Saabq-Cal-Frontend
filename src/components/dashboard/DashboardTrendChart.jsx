// Lightweight area+line sparkline for dashboard overview cards. Renders a
// smoothed path through `values` (equally spaced), no external chart lib.
export default function DashboardTrendChart({
  values = [],
  height = 200,
  gradientId,
}) {
  const width = 480;
  const max = Math.max(1, ...values);
  const points = values.map((v, i) => {
    const x = values.length > 1 ? (i / (values.length - 1)) * width : 0;
    const y = height - (v / max) * (height - 20) - 10;
    return [x, y];
  });

  const linePath = points
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x},${y}`)
    .join(" ");
  const areaPath =
    points.length > 0
      ? `${linePath} L${width},${height} L0,${height} Z`
      : "";

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      style={{ width: "100%", height }}
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--primary)" stopOpacity="0.25" />
          <stop offset="1" stopColor="var(--primary)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((f) => (
        <line
          key={f}
          x1="0"
          y1={height * f}
          x2={width}
          y2={height * f}
          stroke="var(--border-light)"
          strokeWidth="1"
        />
      ))}
      {areaPath && <path d={areaPath} fill={`url(#${gradientId})`} />}
      {linePath && (
        <path
          d={linePath}
          fill="none"
          stroke="var(--primary)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}
