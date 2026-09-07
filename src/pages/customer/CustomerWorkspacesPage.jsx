import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Link } from "react-router-dom";
import client, { endpoints } from "../../api/client";
import { useLanguage } from "../../context/LanguageContext";
import SEO from "../../components/ui/SEO";
import LazyImage from "../../components/ui/LazyImage";
import { WorkspaceCardSkeleton } from "../../components/ui/Skeleton";
import Icon from "../../components/common/Icon";

function getCategoryIcon(typeName, isAll = false, size = 16) {
  if (isAll) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3z" />
        <path d="M5 3v4M3 5h4M19 17v4M17 19h4" />
      </svg>
    );
  }

  const name = (typeof typeName === "string" ? typeName : "").toLowerCase();

  // Medical / Clinics
  if (
    name.includes("عياد") ||
    name.includes("طب") ||
    name.includes("medic") ||
    name.includes("clinic")
  ) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
      </svg>
    );
  }

  // Legal / Consulting
  if (
    name.includes("قانون") ||
    name.includes("إدار") ||
    name.includes("legal") ||
    name.includes("consult")
  ) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
        <path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
        <path d="M7 21h10" />
        <path d="M12 3v18" />
        <path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2" />
      </svg>
    );
  }

  // Salons / Beauty
  if (
    name.includes("صالون") ||
    name.includes("تجميل") ||
    name.includes("عناية") ||
    name.includes("beauty") ||
    name.includes("salon")
  ) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="6" cy="6" r="3" />
        <circle cx="6" cy="18" r="3" />
        <line x1="20" y1="4" x2="8.12" y2="15.88" />
        <line x1="14.47" y1="14.48" x2="20" y2="20" />
        <line x1="8.12" y1="8.12" x2="12" y2="12" />
      </svg>
    );
  }

  // Education / Training
  if (
    name.includes("تعليم") ||
    name.includes("تدريب") ||
    name.includes("تطوير") ||
    name.includes("edu") ||
    name.includes("train")
  ) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
        <path d="M6 12v5c3 3 9 3 12 0v-5" />
      </svg>
    );
  }

  // Photography / Studio
  if (
    name.includes("استوديو") ||
    name.includes("تصوير") ||
    name.includes("studio") ||
    name.includes("photo")
  ) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
        <circle cx="12" cy="13" r="4" />
      </svg>
    );
  }

  // Fitness / Gym / Sports
  if (
    name.includes("رياض") ||
    name.includes("لياق") ||
    name.includes("fit") ||
    name.includes("gym")
  ) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="m6.5 6.5 11 11" />
        <path d="m21 21-1-1a2 2 0 0 0-2.83 0l-1.17 1.17a2 2 0 0 1-2.83 0L3.17 13.17a2 2 0 0 1 0-2.83L4.34 9.17a2 2 0 0 0 0-2.83L3 5" />
        <path d="m19 19 1.17-1.17a2 2 0 0 0 0-2.83L10.17 5a2 2 0 0 0-2.83 0L6.17 6.17a2 2 0 0 1-2.83 0L2 5" />
        <path d="m14 10 4-4" />
      </svg>
    );
  }

  // Services / Maintenance
  if (
    name.includes("خدمات") ||
    name.includes("صيانة") ||
    name.includes("service") ||
    name.includes("maint")
  ) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
      </svg>
    );
  }

  // Fallback Tag icon
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z" />
      <line x1="7" y1="7" x2="7.01" y2="7" />
    </svg>
  );
}

export default function WorkspacesPage() {
  const { t, isRTL } = useLanguage();

  const [workspaces, setWorkspaces] = useState([]);
  const [types, setTypes] = useState([]);
  const [selectedType, setSelectedType] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const debounceTimerRef = useRef(null);

  const handleSearchChange = useCallback((value) => {
    setSearchQuery(value);
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedSearch(value);
      setPage(1);
    }, 400);
  }, []);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, []);

  // Fetch workspace categories/types
  useEffect(() => {
    client
      .get(endpoints.workspaceTypes)
      .then((res) => setTypes(res.data.data || []))
      .catch(() => {});
  }, []);

  // Fetch public workspaces list
  useEffect(() => {
    setLoading(true);
    const params = {
      page,
      per_page: 12,
    };
    if (debouncedSearch.trim()) {
      params.search = debouncedSearch.trim();
      params.name = debouncedSearch.trim();
    }
    if (selectedType && selectedType !== "all") {
      params.workspace_type_id = selectedType;
    }

    client
      .get(endpoints.publicWorkspaces, { params })
      .then((res) => {
        setWorkspaces(res.data.data || []);
        if (res.data.meta) {
          setPagination(res.data.meta);
        } else {
          setPagination(null);
        }
        setLoading(false);
      })
      .catch(() => {
        setWorkspaces([]);
        setLoading(false);
      });
  }, [page, debouncedSearch, selectedType]);

  const selectedTypeName = useMemo(() => {
    if (selectedType === "all") return null;
    const found = types.find((t) => String(t.id) === String(selectedType));
    if (!found) return null;
    return typeof found.name === "object" && found.name !== null
      ? isRTL
        ? found.name.ar || found.name.en
        : found.name.en || found.name.ar
      : found.name || found.title;
  }, [selectedType, types, isRTL]);

  // JSON-LD ItemList
  const jsonLd =
    workspaces.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: isRTL ? "مساحات العمل المتاحة" : "Available Workspaces",
          numberOfItems: pagination?.total || workspaces.length,
          itemListElement: workspaces.map((ws, i) => ({
            "@type": "ListItem",
            position: i + 1,
            item: {
              "@type": "LocalBusiness",
              name: ws.name,
              url: `https://cal.saabq.com/${ws.slug}`,
              ...(ws.description && { description: ws.description }),
              ...(ws.logo_url && { image: ws.logo_url }),
            },
          })),
        }
      : undefined;

  return (
    <main className="main-content">
      <SEO
        title={isRTL ? "استكشاف مساحات العمل" : "Explore Workspaces"}
        description={
          isRTL
            ? "تصفح واستكشف مساحات العمل المتاحة لحجز المواعيد والخدمات على منصة تقويم سابق."
            : "Browse and explore available workspaces for booking appointments and services on Saabq Cal."
        }
        canonical="/workspaces"
        jsonLd={jsonLd}
      />

      {/* Flagship Aurora Hero Header */}
      <section className="explore-hero">
        <div className="container">
          <div className="explore-hero-inner">
            {/* Glowing Hero Badge */}
            <div className="explore-badge">
              <span className="explore-badge-icon">
                <Icon name="sparkles" size={15} />
              </span>
              <span>{t("exploreWorkspaces")}</span>
            </div>

            {/* Hero Main Heading with Brand Gradient */}
            <h1 className="explore-title">
              {isRTL ? "استكشاف " : "Explore "}
              <span className="explore-title-gradient">
                {isRTL ? "مساحات العمل" : "Workspaces"}
              </span>
            </h1>

            {/* Subtitle */}
            <p className="explore-subtitle">{t("exploreWorkspacesSubtitle")}</p>

            {/* Trust & Feature Pillars Strip */}
            <div className="explore-trust-strip">
              <div className="explore-trust-item">
                <span className="explore-trust-icon" aria-hidden="true">
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect width="16" height="20" x="4" y="2" rx="2" ry="2" />
                    <path d="M9 22v-4h6v4" />
                    <path d="M8 6h.01" />
                    <path d="M16 6h.01" />
                    <path d="M12 6h.01" />
                    <path d="M12 10h.01" />
                    <path d="M12 14h.01" />
                    <path d="M16 10h.01" />
                    <path d="M16 14h.01" />
                    <path d="M8 10h.01" />
                    <path d="M8 14h.01" />
                  </svg>
                </span>
                <span>
                  {isRTL
                    ? "مساحات عمل معتمدة وموثوقة"
                    : "Verified & Trusted Workspaces"}
                </span>
              </div>
              <div className="explore-trust-item">
                <span className="explore-trust-icon" aria-hidden="true">
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                  </svg>
                </span>
                <span>
                  {isRTL
                    ? "حجز فوري ومؤكد 100%"
                    : "100% Instant Guaranteed Booking"}
                </span>
              </div>
              <div className="explore-trust-item">
                <span className="explore-trust-icon" aria-hidden="true">
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <polyline points="9 12 11 14 15 10" />
                  </svg>
                </span>
                <span>
                  {isRTL
                    ? "خدمات متخصصة ومواعيد دقيقة"
                    : "Specialized Services & Punctual Slots"}
                </span>
              </div>
            </div>

            {/* Flagship Floating Search Box */}
            <div className="explore-search-container">
              <div className="explore-search-wrapper">
                <div className="explore-search-icon-badge" aria-hidden="true">
                  <Icon name="search" size={20} />
                </div>

                <input
                  type="search"
                  className="explore-search-input"
                  placeholder={t("searchWorkspacesPlaceholder")}
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      setDebouncedSearch(searchQuery.trim());
                      setPage(1);
                    }
                  }}
                  aria-label={
                    isRTL ? "البحث في مساحات العمل" : "Search workspaces"
                  }
                />

                {searchQuery && (
                  <button
                    type="button"
                    className="explore-search-clear"
                    onClick={() => {
                      setSearchQuery("");
                      setDebouncedSearch("");
                      setPage(1);
                    }}
                    aria-label={isRTL ? "مسح البحث" : "Clear search"}
                  >
                    ✕
                  </button>
                )}

                <button
                  type="button"
                  className="explore-search-btn"
                  onClick={() => {
                    setDebouncedSearch(searchQuery.trim());
                    setPage(1);
                  }}
                  aria-label={isRTL ? "بحث" : "Search"}
                >
                  <Icon name="search" size={16} />
                  <span>{isRTL ? "بحث" : "Search"}</span>
                </button>
              </div>
            </div>

            {/* Category Filter Pills & Mobile Select */}
            {types.length > 0 && (
              <div className="explore-categories-section">
                {/* Mobile Quick Dropdown */}
                <div
                  className="mobile-category-select-wrapper"
                  style={{ marginBottom: 14 }}
                >
                  <select
                    className="form-select mobile-category-select"
                    value={selectedType}
                    onChange={(e) => {
                      setSelectedType(e.target.value);
                      setPage(1);
                    }}
                    aria-label={
                      isRTL ? "تصفية حسب التصنيف" : "Filter by category"
                    }
                    style={{
                      width: "100%",
                      padding: "11px 16px",
                      borderRadius: "var(--radius-lg, 14px)",
                      background: "var(--surface)",
                      border: "1.5px solid var(--border)",
                      color: "var(--heading)",
                      fontSize: "0.92rem",
                      fontWeight: 700,
                      boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
                      cursor: "pointer",
                    }}
                  >
                    <option value="all">
                      {t("allCategories") ||
                        (isRTL ? "جميع التصنيفات" : "All Categories")}
                    </option>
                    {types.map((type) => {
                      const typeName =
                        typeof type.name === "object" && type.name !== null
                          ? isRTL
                            ? type.name?.ar || type.name?.en
                            : type.name?.en || type.name?.ar
                          : type.name || type.title;
                      return (
                        <option key={type.id} value={String(type.id)}>
                          {typeName}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Desktop Category Filter Pills */}
                <div
                  className="explore-categories-wrap desktop-category-pills"
                  role="tablist"
                  aria-label={
                    isRTL ? "تصفية حسب التصنيف" : "Filter by category"
                  }
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={selectedType === "all"}
                    className={`explore-category-chip ${selectedType === "all" ? "active" : ""}`}
                    onClick={() => {
                      setSelectedType("all");
                      setPage(1);
                    }}
                  >
                    <span className="explore-category-icon">
                      {getCategoryIcon(null, true, 16)}
                    </span>
                    <span>
                      {t("allCategories") ||
                        (isRTL ? "جميع التصنيفات" : "All Categories")}
                    </span>
                  </button>

                  {types.map((type) => {
                    const isAct = selectedType === String(type.id);
                    const typeName =
                      typeof type.name === "object" && type.name !== null
                        ? isRTL
                          ? type.name?.ar || type.name?.en
                          : type.name?.en || type.name?.ar
                        : type.name || type.title;
                    const icon = getCategoryIcon(typeName, false, 16);

                    return (
                      <button
                        key={type.id}
                        type="button"
                        role="tab"
                        aria-selected={isAct}
                        className={`explore-category-chip ${isAct ? "active" : ""}`}
                        onClick={() => {
                          setSelectedType(String(type.id));
                          setPage(1);
                        }}
                      >
                        <span className="explore-category-icon">{icon}</span>
                        <span>{typeName}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Workspaces Grid Section */}
      <section
        className="section"
        style={{ paddingTop: 0 }}
        aria-label={isRTL ? "قائمة مساحات العمل" : "Workspaces list"}
      >
        <div className="container">
          {/* Results Count & Filter Bar */}
          {!loading && workspaces.length > 0 && (
            <div className="explore-results-bar">
              <div className="explore-count-badge">
                <span>
                  {isRTL ? "مساحات العمل المتاحة" : "Available Workspaces"}
                </span>
                <span className="explore-count-pill">
                  {pagination?.total ?? workspaces.length}
                </span>
              </div>

              {(selectedType !== "all" || debouncedSearch.trim()) && (
                <div className="explore-active-filters">
                  {selectedTypeName && (
                    <span className="explore-filter-tag">
                      <span>
                        {getCategoryIcon(selectedTypeName, false, 13)}
                      </span>
                      <span>{selectedTypeName}</span>
                      <button
                        type="button"
                        className="explore-filter-clear-btn"
                        onClick={() => {
                          setSelectedType("all");
                          setPage(1);
                        }}
                        aria-label={
                          isRTL
                            ? "إزالة فلتر التصنيف"
                            : "Remove category filter"
                        }
                      >
                        ✕
                      </button>
                    </span>
                  )}

                  {debouncedSearch.trim() && (
                    <span className="explore-filter-tag">
                      <Icon name="search" size={13} />
                      <span>"{debouncedSearch.trim()}"</span>
                      <button
                        type="button"
                        className="explore-filter-clear-btn"
                        onClick={() => {
                          setSearchQuery("");
                          setDebouncedSearch("");
                          setPage(1);
                        }}
                        aria-label={isRTL ? "إزالة البحث" : "Remove search"}
                      >
                        ✕
                      </button>
                    </span>
                  )}

                  <button
                    type="button"
                    className="explore-reset-all-btn"
                    onClick={() => {
                      setSelectedType("all");
                      setSearchQuery("");
                      setDebouncedSearch("");
                      setPage(1);
                    }}
                  >
                    {isRTL ? "إعادة تعيين الكل" : "Reset All"}
                  </button>
                </div>
              )}
            </div>
          )}

          {loading ? (
            <WorkspaceCardSkeleton count={6} />
          ) : workspaces.length === 0 ? (
            <div className="explore-empty-state">
              <div className="explore-empty-icon-box">
                <Icon name="search" size={36} />
              </div>
              <h3
                style={{
                  fontSize: "1.3rem",
                  fontWeight: 800,
                  marginBottom: 10,
                  color: "var(--heading)",
                }}
              >
                {t("noWorkspacesFound")}
              </h3>
              <p
                style={{
                  color: "var(--text-secondary)",
                  fontSize: "0.95rem",
                  lineHeight: 1.6,
                  marginBottom: 24,
                }}
              >
                {isRTL
                  ? "لم نتمكن من العثور على أي مساحة تطابق معايير بحثك. جرّب كلمات أخرى أو قم بإلغاء تصنيف الفلترة."
                  : "We couldn't find any workspace matching your criteria. Try different search terms or reset the filters."}
              </p>
              <button
                type="button"
                className="btn btn-primary btn-md"
                style={{
                  borderRadius: "var(--radius-full)",
                  padding: "10px 26px",
                  fontWeight: 700,
                }}
                onClick={() => {
                  setSelectedType("all");
                  setSearchQuery("");
                  setDebouncedSearch("");
                  setPage(1);
                }}
              >
                <span>
                  {isRTL ? "عرض جميع مساحات العمل" : "Show All Workspaces"}
                </span>
              </button>
            </div>
          ) : (
            <>
              <div
                className="workspaces-grid"
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fill, minmax(min(100%, 320px), 1fr))",
                  gap: 28,
                }}
              >
                {workspaces.map((ws) => {
                  const initial = ws.name
                    ? ws.name.charAt(0).toUpperCase()
                    : "W";
                  const primaryBg = ws.primary_color || "var(--primary)";

                  const wsType = types.find(
                    (t) => String(t.id) === String(ws.workspace_type_id),
                  );
                  const typeLabel = wsType
                    ? typeof wsType.name === "object" && wsType.name !== null
                      ? isRTL
                        ? wsType.name.ar || wsType.name.en
                        : wsType.name.en || wsType.name.ar
                      : wsType.name || wsType.title
                    : null;
                  const typeIcon = typeLabel
                    ? getCategoryIcon(typeLabel, false, 13)
                    : null;

                  return (
                    <article key={ws.id} className="workspace-card-modern">
                      {/* Top Cover Banner */}
                      <div
                        className="workspace-card-banner"
                        style={{
                          background: ws.cover_url
                            ? undefined
                            : ws.secondary_color
                              ? `linear-gradient(135deg, ${primaryBg} 0%, ${ws.secondary_color} 100%)`
                              : primaryBg,
                        }}
                      >
                        {ws.cover_url && (
                          <img
                            src={ws.cover_url}
                            alt={`${ws.name} cover`}
                            className="workspace-card-banner-img"
                            loading="lazy"
                          />
                        )}
                        <div className="workspace-card-banner-overlay" />

                        {/* Category Badge on Cover */}
                        {typeLabel && (
                          <div className="workspace-category-badge">
                            <span
                              className="workspace-category-badge-icon"
                              aria-hidden="true"
                            >
                              {typeIcon}
                            </span>
                            <span>{typeLabel}</span>
                          </div>
                        )}

                        {/* Status Badge on Cover */}
                        <div
                          className={`workspace-status-badge ${ws.booking_enabled ? "available" : "unavailable"}`}
                        >
                          <span className="pulse-dot" aria-hidden="true" />
                          <span>
                            {ws.booking_enabled
                              ? isRTL
                                ? "متاح للحجز"
                                : "Available"
                              : isRTL
                                ? "غير متاح"
                                : "Unavailable"}
                          </span>
                        </div>
                      </div>

                      {/* Overlapping Avatar Ring */}
                      <div className="workspace-avatar-ring">
                        {ws.logo_url ? (
                          <LazyImage
                            src={ws.logo_url}
                            alt={`${ws.name} logo`}
                            width={74}
                            height={74}
                            objectFit="cover"
                            style={{
                              borderRadius: "50%",
                              width: "100%",
                              height: "100%",
                            }}
                          />
                        ) : (
                          <span
                            style={{
                              fontSize: "1.8rem",
                              fontWeight: 800,
                              color: primaryBg,
                            }}
                          >
                            {initial}
                          </span>
                        )}
                      </div>

                      {/* Card Content Body */}
                      <div className="workspace-card-body">
                        <h3 className="workspace-card-title">
                          <span>{ws.name}</span>
                          <span
                            className="workspace-verified-icon"
                            title={isRTL ? "مساحة موثقة" : "Verified"}
                          >
                            <svg
                              width="18"
                              height="18"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                            >
                              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                            </svg>
                          </span>
                        </h3>

                        {ws.slug && (
                          <div>
                            <span className="workspace-card-slug">
                              @{ws.slug}
                            </span>
                          </div>
                        )}

                        <p className="workspace-card-desc">
                          {ws.booking_short_intro ||
                            (typeof ws.description === "object" &&
                            ws.description !== null
                              ? isRTL
                                ? ws.description.ar || ws.description.en
                                : ws.description.en || ws.description.ar
                              : ws.description) ||
                            (isRTL
                              ? "مساحة عمل متميزة لحجز وتأكيد المواعيد وإدارة الخدمات بأعلى جودة."
                              : "A premium workspace for booking and managing appointments.")}
                        </p>

                        {/* Meta chips (Location & Phone) */}
                        {(ws.address || ws.phone) && (
                          <div className="workspace-card-meta">
                            {ws.address && (
                              <div
                                className="workspace-meta-chip"
                                title={ws.address}
                              >
                                <Icon name="map-pin" size={13} />
                                <span>{ws.address}</span>
                              </div>
                            )}
                            {ws.phone && (
                              <div
                                className="workspace-meta-chip"
                                style={{ direction: "ltr" }}
                              >
                                <Icon name="phone" size={13} />
                                <span>{ws.phone}</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Action Link CTA */}
                        <div style={{ marginTop: "auto" }}>
                          <Link
                            to={`/${ws.slug}`}
                            className="workspace-card-cta"
                            style={{
                              background: ws.primary_color
                                ? `linear-gradient(135deg, ${ws.primary_color} 0%, ${ws.secondary_color || ws.primary_color} 100%)`
                                : undefined,
                            }}
                          >
                            <span>{t("viewWorkspaceProfile")}</span>
                            <span className="cta-arrow">
                              <Icon
                                name="arrow-right"
                                size={16}
                                style={{
                                  transform: isRTL ? "rotate(180deg)" : "none",
                                }}
                              />
                            </span>
                          </Link>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>

              {/* Modern Pagination */}
              {pagination && pagination.last_page > 1 && (
                <nav
                  aria-label={isRTL ? "التنقل بين الصفحات" : "Pagination"}
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: 12,
                    marginTop: 48,
                  }}
                >
                  <button
                    className="btn btn-secondary btn-sm"
                    disabled={page <= 1}
                    onClick={() => {
                      setPage((p) => p - 1);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    style={{
                      borderRadius: "var(--radius-full)",
                      padding: "8px 18px",
                      fontWeight: 700,
                    }}
                    aria-label={isRTL ? "الصفحة السابقة" : "Previous page"}
                  >
                    {isRTL ? "السابق" : "Previous"}
                  </button>
                  <span
                    style={{
                      fontSize: "0.92rem",
                      color: "var(--text-secondary)",
                      fontWeight: 700,
                      padding: "4px 12px",
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--radius-full)",
                    }}
                  >
                    {isRTL
                      ? `صفحة ${pagination.current_page} من ${pagination.last_page}`
                      : `Page ${pagination.current_page} of ${pagination.last_page}`}
                  </span>
                  <button
                    className="btn btn-secondary btn-sm"
                    disabled={page >= pagination.last_page}
                    onClick={() => {
                      setPage((p) => p + 1);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    style={{
                      borderRadius: "var(--radius-full)",
                      padding: "8px 18px",
                      fontWeight: 700,
                    }}
                    aria-label={isRTL ? "الصفحة التالية" : "Next page"}
                  >
                    {isRTL ? "التالي" : "Next"}
                  </button>
                </nav>
              )}
            </>
          )}
        </div>
      </section>
    </main>
  );
}
