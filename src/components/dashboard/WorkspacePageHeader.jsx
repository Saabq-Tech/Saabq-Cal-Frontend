import Icon from "../common/Icon";

/**
 * Unified, premium header component for all Workspace Dashboard pages.
 *
 * Provides a standardized visual hierarchy:
 * 1. Top Section: Icon badge + Title + Subtitle + Limit Badge (Start) & Action Buttons (End)
 * 2. KPI Stats Grid (Optional): Balanced stat cards with pastel icon badges
 * 3. Children / Toolbar Slot (Optional): Search inputs, filter dropdowns, view toggles
 */
export default function WorkspacePageHeader({
  title,
  subtitle,
  icon = "briefcase",
  iconGradient,
  limitBadge,
  actions,
  stats = [],
  children,
  className = "",
  style = {},
}) {
  return (
    <div
      className={`workspace-page-header-wrapper ${className}`}
      style={{
        marginBottom: 24,
        display: "flex",
        flexDirection: "column",
        gap: 20,
        ...style,
      }}
    >
      {/* ── Top Bar: Title & Actions ── */}
      <div
        className="workspace-page-header-top"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        {/* Title + Icon Block */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            minWidth: 0,
          }}
        >
          {icon && (
            <div
              className="workspace-header-icon-box"
              style={{
                width: 50,
                height: 50,
                minWidth: 50,
                borderRadius: "var(--radius-lg, 14px)",
                background:
                  iconGradient ||
                  "linear-gradient(135deg, var(--primary), var(--primary-hover, #0389A5))",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 8px 20px -4px rgba(2, 105, 130, 0.35)",
              }}
            >
              <Icon name={icon} size={26} />
            </div>
          )}

          <div style={{ minWidth: 0 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                flexWrap: "wrap",
              }}
            >
              <h1
                style={{
                  margin: 0,
                  fontSize: "1.55rem",
                  fontWeight: 800,
                  color: "var(--heading)",
                  letterSpacing: "-0.02em",
                  lineHeight: 1.25,
                }}
              >
                {title}
              </h1>

              {limitBadge &&
                limitBadge.max !== null &&
                limitBadge.max !== undefined && (
                  <span
                    style={{
                      fontSize: "0.82rem",
                      fontWeight: 700,
                      padding: "3px 10px",
                      borderRadius: 20,
                      background: limitBadge.isReached
                        ? "rgba(239, 68, 68, 0.12)"
                        : "var(--primary-subtle)",
                      color: limitBadge.isReached
                        ? "#ef4444"
                        : "var(--primary)",
                      border: limitBadge.isReached
                        ? "1px solid rgba(239, 68, 68, 0.25)"
                        : "1px solid var(--primary-light)",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <span>{limitBadge.used}</span>
                    <span style={{ opacity: 0.6 }}>/</span>
                    <span>{limitBadge.max}</span>
                  </span>
                )}
            </div>

            {subtitle && (
              <p
                style={{
                  margin: "4px 0 0 0",
                  fontSize: "0.88rem",
                  color: "var(--text-secondary)",
                  lineHeight: 1.45,
                }}
              >
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Actions Slot (Buttons / Toggles) */}
        {actions && (
          <div
            className="workspace-header-actions"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            {actions}
          </div>
        )}
      </div>

      {/* ── KPI Stats Cards Grid (If Provided) ── */}
      {Array.isArray(stats) && stats.length > 0 && (
        <div className="workspace-header-stats-grid">
          {stats.map((stat, index) => {
            if (!stat) return null;
            const defaultBg = "rgba(2, 105, 130, 0.1)";
            const defaultColor = "var(--primary)";

            return (
              <div
                key={stat.id || index}
                className="workspace-header-stat-card"
                onClick={stat.onClick}
                style={{
                  cursor: stat.onClick ? "pointer" : "default",
                  ...stat.cardStyle,
                }}
              >
                {/* Metric Info */}
                <div className="workspace-header-stat-info">
                  <span className="workspace-header-stat-label">
                    {stat.label}
                  </span>

                  <div className="workspace-header-stat-value-row">
                    <span
                      className="workspace-header-stat-value"
                      style={{
                        color: stat.valueColor || "var(--heading)",
                      }}
                    >
                      {stat.value !== undefined && stat.value !== null
                        ? stat.value
                        : 0}
                    </span>

                    {stat.suffix && (
                      <span
                        style={{
                          fontSize: "0.82rem",
                          fontWeight: 600,
                          color: stat.suffixColor || "var(--text-secondary)",
                        }}
                      >
                        {stat.suffix}
                      </span>
                    )}

                    {stat.badge && (
                      <span
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          padding: "2px 8px",
                          borderRadius: 12,
                          background: stat.badgeBg || "var(--primary-subtle)",
                          color: stat.badgeColor || "var(--primary)",
                        }}
                      >
                        {stat.badge}
                      </span>
                    )}
                  </div>
                </div>

                {/* Icon Badge */}
                {stat.icon && (
                  <div
                    className="workspace-header-stat-icon-wrap"
                    style={{
                      background: stat.iconBg || defaultBg,
                      color: stat.iconColor || defaultColor,
                    }}
                  >
                    <Icon name={stat.icon} size={24} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Toolbar / Filter Slot (If Provided) ── */}
      {children}
    </div>
  );
}
