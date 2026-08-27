/**
 * Shared Skeleton Loading Primitives & Page-Specific Composers
 *
 * Usage:
 *   <SkeletonLine />
 *   <SkeletonRect width={120} height={80} />
 *   <SkeletonCircle size={48} />
 *   <WorkspaceCardSkeleton />   — grid of workspace cards
 *   <ServiceCardSkeleton />     — service listing
 *   <ProfileSkeleton />         — profile header + form
 *   <BookingFormSkeleton />     — booking wizard form
 *   <PageSkeleton />            — full page fallback for Suspense
 */

/* ─── Primitives ──────────────────────────────────── */

export function SkeletonLine({
  width = "100%",
  height = 14,
  style,
  className = "",
}) {
  return (
    <div
      aria-hidden="true"
      className={`skeleton-pulse ${className}`}
      style={{ width, height, borderRadius: 6, ...style }}
    />
  );
}

export function SkeletonRect({
  width = "100%",
  height = 100,
  radius = "var(--radius-md, 8px)",
  style,
  className = "",
}) {
  return (
    <div
      aria-hidden="true"
      className={`skeleton-pulse ${className}`}
      style={{ width, height, borderRadius: radius, ...style }}
    />
  );
}

export function SkeletonCircle({ size = 48, style, className = "" }) {
  return (
    <div
      aria-hidden="true"
      className={`skeleton-pulse ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        flexShrink: 0,
        ...style,
      }}
    />
  );
}

/* ─── Card Skeleton ───────────────────────────────── */

function CardSkeleton({ style }) {
  return (
    <div
      className="card"
      style={{
        padding: 0,
        borderRadius: "var(--radius-xl, 16px)",
        overflow: "hidden",
        ...style,
      }}
    >
      <SkeletonRect height={110} radius="0" />
      <div
        style={{
          padding: "16px 20px 20px",
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        <SkeletonLine width="60%" height={18} />
        <SkeletonLine width="40%" height={12} />
        <SkeletonLine width="90%" height={12} />
        <SkeletonLine width="80%" height={12} />
        <SkeletonRect height={38} style={{ marginTop: 8 }} />
      </div>
    </div>
  );
}

/* ─── Page-Specific Composers ─────────────────────── */

export function WorkspaceCardSkeleton({ count = 6 }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 320px), 1fr))",
        gap: 28,
        width: "100%",
        maxWidth: "100%",
      }}
    >
      {Array.from({ length: count }, (_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

export function ServiceCardSkeleton({ count = 3 }) {
  return (
    <div className="services-grid">
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className="card"
          style={{ padding: 24, maxWidth: "100%", boxSizing: "border-box" }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 12,
            }}
          >
            <SkeletonLine width="50%" height={20} />
            <SkeletonLine width="20%" height={20} />
          </div>
          <SkeletonLine width="90%" height={12} />
          <SkeletonLine width="70%" height={12} style={{ marginTop: 6 }} />
          <SkeletonRect height={40} style={{ marginTop: 16 }} />
        </div>
      ))}
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div>
      {/* Cover */}
      <SkeletonRect height={180} radius="0" />
      {/* Profile card */}
      <div
        className="container"
        style={{
          marginTop: -50,
          position: "relative",
          zIndex: 2,
          marginBottom: 40,
        }}
      >
        <div className="card" style={{ padding: 28 }}>
          <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
            <SkeletonRect
              width={96}
              height={96}
              radius="var(--radius-xl, 16px)"
            />
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              <SkeletonLine width="40%" height={24} />
              <SkeletonLine width="20%" height={14} />
              <SkeletonLine width="80%" height={14} />
              <SkeletonLine width="60%" height={14} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function BookingFormSkeleton() {
  return (
    <div className="container" style={{ marginTop: -30 }}>
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 28 }}>
        <div className="card" style={{ padding: 28 }}>
          {/* Progress bar */}
          <div
            style={{
              display: "flex",
              gap: 20,
              marginBottom: 28,
              paddingBottom: 20,
              borderBottom: "1px solid var(--border)",
            }}
          >
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                style={{ display: "flex", alignItems: "center", gap: 10 }}
              >
                <SkeletonCircle size={32} />
                <SkeletonLine width={60} height={14} />
              </div>
            ))}
          </div>
          {/* Service cards */}
          <SkeletonLine width="30%" height={18} style={{ marginBottom: 16 }} />
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
              gap: 14,
            }}
          >
            {[1, 2, 3].map((i) => (
              <SkeletonRect key={i} height={80} />
            ))}
          </div>
        </div>
        {/* Sidebar */}
        <div className="card" style={{ padding: 24 }}>
          <SkeletonLine width="50%" height={18} style={{ marginBottom: 16 }} />
          <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
            <SkeletonRect width={48} height={48} radius="var(--radius-md)" />
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}
            >
              <SkeletonLine width="60%" height={14} />
              <SkeletonLine width="40%" height={12} />
            </div>
          </div>
          <SkeletonRect height={120} />
        </div>
      </div>
    </div>
  );
}

export function HomeSkeleton() {
  return (
    <div className="main-content">
      {/* Hero */}
      <section style={{ padding: "80px 0 60px", textAlign: "center" }}>
        <div
          className="container"
          style={{
            maxWidth: 700,
            margin: "0 auto",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 16,
          }}
        >
          <SkeletonLine width={140} height={24} />
          <SkeletonLine width="80%" height={36} />
          <SkeletonLine width="60%" height={16} />
          <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
            <SkeletonRect width={160} height={44} radius="var(--radius-full)" />
            <SkeletonRect width={160} height={44} radius="var(--radius-full)" />
          </div>
        </div>
      </section>
      {/* Features */}
      <section style={{ padding: "40px 0" }}>
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <SkeletonLine
              width="30%"
              height={24}
              style={{ margin: "0 auto 12px" }}
            />
            <SkeletonLine
              width="50%"
              height={14}
              style={{ margin: "0 auto" }}
            />
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fill, minmax(min(100%, 280px), 1fr))",
              gap: 24,
              width: "100%",
              maxWidth: "100%",
            }}
          >
            {[1, 2, 3].map((i) => (
              <div key={i} className="card" style={{ padding: 24 }}>
                <SkeletonCircle size={40} />
                <SkeletonLine
                  width="50%"
                  height={18}
                  style={{ marginTop: 16 }}
                />
                <SkeletonLine
                  width="80%"
                  height={12}
                  style={{ marginTop: 8 }}
                />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div
      className="main-content"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "60vh",
      }}
    >
      <div
        style={{
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 16,
        }}
      >
        <SkeletonCircle size={48} />
        <SkeletonLine width={180} height={16} />
        <SkeletonLine width={120} height={12} />
      </div>
    </div>
  );
}

export function TabSettingsSkeleton() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 16,
        width: "100%",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 8,
        }}
      >
        <SkeletonLine width="35%" height={24} />
        <SkeletonRect width={120} height={36} radius="var(--radius-md)" />
      </div>
      <SkeletonRect height={52} radius="var(--radius-md)" />
      <SkeletonRect height={52} radius="var(--radius-md)" />
      <SkeletonRect height={52} radius="var(--radius-md)" />
      <SkeletonRect height={52} radius="var(--radius-md)" />
    </div>
  );
}

export function TableSkeleton({ rows = 4 }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
        width: "100%",
      }}
    >
      <SkeletonRect height={44} radius="var(--radius-md)" />
      {Array.from({ length: rows }, (_, i) => (
        <SkeletonRect key={i} height={56} radius="var(--radius-md)" />
      ))}
    </div>
  );
}

export function ChatSidebarSkeleton() {
  return (
    <div
      style={{ display: "flex", flexDirection: "column", gap: 12, padding: 12 }}
    >
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <SkeletonCircle size={42} />
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              gap: 6,
            }}
          >
            <SkeletonLine width="60%" height={14} />
            <SkeletonLine width="80%" height={10} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ChatFeedSkeleton() {
  return (
    <div
      style={{ display: "flex", flexDirection: "column", gap: 14, padding: 16 }}
    >
      <div style={{ alignSelf: "flex-start", width: "60%" }}>
        <SkeletonRect height={48} radius="16px" />
      </div>
      <div style={{ alignSelf: "flex-end", width: "50%" }}>
        <SkeletonRect height={40} radius="16px" />
      </div>
      <div style={{ alignSelf: "flex-start", width: "70%" }}>
        <SkeletonRect height={56} radius="16px" />
      </div>
    </div>
  );
}
