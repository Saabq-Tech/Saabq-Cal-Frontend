import { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import client, { endpoints } from "../../api/client";
import { useLanguage } from "../../context/LanguageContext";
import SEO from "../../components/ui/SEO";
import LazyImage from "../../components/ui/LazyImage";
import { WorkspaceCardSkeleton } from "../../components/ui/Skeleton";
import Icon from "../../components/common/Icon";

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
              url: `https://cal.saabq.com/workspaces/${ws.slug}`,
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
            ? "تصفح واستكشف مساحات العمل المتاحة لحجز المواعيد والخدمات على منصة سابق كول."
            : "Browse and explore available workspaces for booking appointments and services on Saabq Cal."
        }
        canonical="/workspaces"
        jsonLd={jsonLd}
      />

      {/* Page Hero Header */}
      <section
        className="hero"
        style={{
          position: "relative",
          padding: "60px 0 80px",
          marginBottom: 48,
          background:
            "linear-gradient(135deg, var(--surface) 0%, var(--surface-alt) 100%)",
          overflow: "hidden",
        }}
      >
        {/* Soft Mesh Gradients */}
        <div
          style={{
            position: "absolute",
            top: "-50%",
            left: "-10%",
            width: "60%",
            height: "150%",
            background:
              "radial-gradient(ellipse at center, rgba(10, 144, 153, 0.1) 0%, transparent 70%)",
            transform: "rotate(-15deg)",
            zIndex: 0,
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-30%",
            right: "-10%",
            width: "50%",
            height: "100%",
            background:
              "radial-gradient(ellipse at center, rgba(234, 88, 12, 0.08) 0%, transparent 70%)",
            zIndex: 0,
            pointerEvents: "none",
          }}
        />

        <div className="container" style={{ position: "relative", zIndex: 1 }}>
          <div
            className="hero-content"
            style={{ maxWidth: 760, margin: "0 auto", textAlign: "center" }}
          >
            <div
              className="hero-badge"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 16px",
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 30,
                fontSize: "0.85rem",
                fontWeight: 600,
                color: "var(--primary)",
                marginBottom: 24,
                boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
              }}
            >
              <Icon name="custom-d3d330f2" size={14} />
              {t("exploreWorkspaces")}
            </div>

            <h1
              style={{
                fontSize: "clamp(2.5rem, 5vw, 3.5rem)",
                fontWeight: 800,
                letterSpacing: "-0.02em",
                lineHeight: 1.1,
                marginBottom: 24,
                color: "var(--heading)",
              }}
            >
              {isRTL ? "استكشاف " : "Explore "}
              <span
                style={{
                  background:
                    "linear-gradient(135deg, var(--primary) 0%, var(--secondary, #3b82f6) 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                {isRTL ? "مساحات العمل" : "Workspaces"}
              </span>
            </h1>

            <p
              style={{
                color: "var(--text-secondary)",
                fontSize: "1.15rem",
                lineHeight: 1.6,
                marginBottom: 40,
                maxWidth: 600,
                margin: "0 auto 40px",
              }}
            >
              {t("exploreWorkspacesSubtitle")}
            </p>

            {/* Search Input Box */}
            <div className="workspace-search-box">
              <input
                type="search"
                className="workspace-search-input"
                placeholder={t("searchWorkspacesPlaceholder")}
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                aria-label={
                  isRTL ? "البحث في مساحات العمل" : "Search workspaces"
                }
              />
              <div className="workspace-search-icon" aria-hidden="true">
                <Icon name="search" size={22} />
              </div>

              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setDebouncedSearch("");
                    setPage(1);
                  }}
                  aria-label={isRTL ? "مسح البحث" : "Clear search"}
                  style={{
                    position: "absolute",
                    top: "50%",
                    transform: "translateY(-50%)",
                    insetInlineEnd: 16,
                    background: "var(--surface-alt)",
                    border: "none",
                    borderRadius: "50%",
                    width: 28,
                    height: 28,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--text-secondary)",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  ✕
                </button>
              )}
            </div>

            {/* Category Filter — Mobile Dropdown Select & Desktop Pills */}
            {types.length > 0 && (
              <>
                {/* Mobile Dropdown Select */}
                <div
                  className="mobile-category-select-wrapper"
                  style={{
                    marginTop: 16,
                    width: "100%",
                  }}
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
                      padding: "10px 16px",
                      borderRadius: "var(--radius-lg, 12px)",
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                      color: "var(--heading)",
                      fontSize: "0.92rem",
                      fontWeight: 700,
                      boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
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
                  className="workspace-types-filter desktop-category-pills"
                  role="tablist"
                  aria-label={
                    isRTL ? "تصفية حسب التصنيف" : "Filter by category"
                  }
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 8,
                    padding: "4px 0 12px",
                    justifyContent: "center",
                    maxWidth: 840,
                    margin: "0 auto",
                  }}
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={selectedType === "all"}
                    className={`btn ${selectedType === "all" ? "btn-primary" : "btn-ghost"}`}
                    onClick={() => {
                      setSelectedType("all");
                      setPage(1);
                    }}
                    style={{
                      borderRadius: "var(--radius-full, 9999px)",
                      padding: "8px 20px",
                      fontSize: "0.9rem",
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {t("allCategories") || "الكل"}
                  </button>
                  {types.map((type) => {
                    const isAct = selectedType === String(type.id);
                    return (
                      <button
                        key={type.id}
                        type="button"
                        role="tab"
                        aria-selected={isAct}
                        className={`btn ${isAct ? "btn-primary" : "btn-ghost"}`}
                        onClick={() => {
                          setSelectedType(String(type.id));
                          setPage(1);
                        }}
                        style={{
                          borderRadius: "var(--radius-full, 9999px)",
                          padding: "8px 20px",
                          fontSize: "0.9rem",
                          fontWeight: 600,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {typeof type.name === "object" && type.name !== null
                          ? isRTL
                            ? type.name?.ar || type.name?.en
                            : type.name?.en || type.name?.ar
                          : type.name || type.title}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Workspaces Grid */}
      <section
        className="section"
        aria-label={isRTL ? "قائمة مساحات العمل" : "Workspaces list"}
      >
        <div className="container">
          {loading ? (
            <WorkspaceCardSkeleton count={6} />
          ) : workspaces.length === 0 ? (
            <div
              className="card"
              style={{
                padding: 48,
                textAlign: "center",
                maxWidth: 500,
                margin: "40px auto",
              }}
            >
              <Icon
                name="monitor"
                size={48}
                style={{ color: "var(--muted)", margin: "0 auto 16px" }}
              />
              <h3 style={{ fontSize: "1.2rem", marginBottom: 8 }}>
                {t("noWorkspacesFound")}
              </h3>
              <p
                style={{ color: "var(--text-secondary)", fontSize: "0.92rem" }}
              >
                {isRTL
                  ? "جرّب البحث عن كلمات أخرى أو تغيير تصنيف الفلترة."
                  : "Try different search terms or change category filter."}
              </p>
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

                  return (
                    <article
                      key={ws.id}
                      className="card card-hover"
                      style={{
                        padding: 0,
                        borderRadius: "var(--radius-2xl, 20px)",
                        border: "1px solid var(--border)",
                        background: "var(--surface)",
                        boxShadow: "0 10px 30px rgba(0,0,0,0.04)",
                        display: "flex",
                        flexDirection: "column",
                        position: "relative",
                        transition:
                          "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                        overflow: "hidden",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-6px)";
                        e.currentTarget.style.boxShadow =
                          "0 20px 40px rgba(0,0,0,0.08)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "none";
                        e.currentTarget.style.boxShadow =
                          "0 10px 30px rgba(0,0,0,0.04)";
                      }}
                    >
                      {/* Top Cover Banner */}
                      <div
                        style={{
                          height: 140,
                          background: ws.cover_url
                            ? `url(${ws.cover_url}) center/cover no-repeat`
                            : `linear-gradient(135deg, rgba(13,79,78,0.12) 0%, rgba(232,141,34,0.12) 100%)`,
                          position: "relative",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "flex-end",
                          paddingBottom: 20,
                        }}
                      >
                        {/* Gradient Overlay for seamless transition */}
                        <div
                          style={{
                            position: "absolute",
                            inset: 0,
                            background:
                              "linear-gradient(to top, var(--surface) 0%, transparent 60%)",
                            pointerEvents: "none",
                          }}
                        />

                        {/* Status Badge */}
                        <div
                          style={{
                            position: "absolute",
                            top: 16,
                            insetInlineEnd: 16,
                            zIndex: 2,
                          }}
                        >
                          {ws.booking_enabled ? (
                            <span
                              style={{
                                background: "rgba(255, 255, 255, 0.9)",
                                backdropFilter: "blur(4px)",
                                color: "#059669",
                                fontWeight: 700,
                                fontSize: "0.75rem",
                                padding: "6px 12px",
                                borderRadius: "var(--radius-full, 9999px)",
                                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 6,
                              }}
                            >
                              <span
                                style={{
                                  width: 8,
                                  height: 8,
                                  borderRadius: "50%",
                                  background: "#10B981",
                                  boxShadow:
                                    "0 0 0 2px rgba(16, 185, 129, 0.2)",
                                }}
                                aria-hidden="true"
                              />
                              {isRTL ? "متاح للحجز" : "Available"}
                            </span>
                          ) : (
                            <span
                              style={{
                                background: "rgba(255, 255, 255, 0.9)",
                                backdropFilter: "blur(4px)",
                                color: "#D97706",
                                fontWeight: 700,
                                fontSize: "0.75rem",
                                padding: "6px 12px",
                                borderRadius: "var(--radius-full, 9999px)",
                                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                              }}
                            >
                              {isRTL ? "غير متاح" : "Unavailable"}
                            </span>
                          )}
                        </div>

                        {/* Profile Icon */}
                        <div
                          style={{
                            width: 72,
                            height: 72,
                            borderRadius: "50%",
                            background: "var(--surface)",
                            border: "4px solid var(--surface)",
                            boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                            overflow: "hidden",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "1.8rem",
                            fontWeight: 800,
                            color: primaryBg,
                            zIndex: 2,
                            transform: "translateY(50%)",
                            position: "absolute",
                            bottom: 0,
                          }}
                        >
                          {ws.logo_url ? (
                            <LazyImage
                              src={ws.logo_url}
                              alt={`${ws.name} logo`}
                              width={72}
                              height={72}
                              objectFit="cover"
                              style={{ borderRadius: "50%" }}
                            />
                          ) : (
                            initial
                          )}
                        </div>
                      </div>

                      {/* Card Content Body */}
                      <div
                        style={{
                          padding: "48px 24px 24px",
                          flex: 1,
                          display: "flex",
                          flexDirection: "column",
                          textAlign: "center",
                        }}
                      >
                        <h3
                          style={{
                            fontSize: "1.2rem",
                            fontWeight: 800,
                            color: "var(--heading)",
                            marginBottom: 4,
                            lineHeight: 1.3,
                          }}
                        >
                          {ws.name}
                        </h3>

                        {ws.slug && (
                          <div style={{ marginBottom: 10 }}>
                            <span
                              style={{
                                direction: "ltr",
                                display: "inline-block",
                                color: "var(--primary)",
                                fontWeight: 600,
                                fontSize: "0.84rem",
                              }}
                            >
                              @{ws.slug}
                            </span>
                          </div>
                        )}

                        <p
                          style={{
                            color: "var(--text-secondary)",
                            fontSize: "0.88rem",
                            lineHeight: 1.55,
                            marginBottom: 16,
                            flex: 1,
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {ws.booking_short_intro ||
                            ws.description ||
                            (isRTL
                              ? "مساحة عمل متميزة لحجز وتأكيد المواعيد وإدارة الخدمات."
                              : "A premium workspace for booking and managing appointments.")}
                        </p>

                        {/* Meta info */}
                        {(ws.address || ws.phone) && (
                          <div
                            style={{
                              fontSize: "0.82rem",
                              color: "var(--text-secondary)",
                              display: "flex",
                              flexDirection: "column",
                              gap: 6,
                              padding: "10px 12px",
                              background: "var(--surface-alt)",
                              borderRadius: "var(--radius-md, 8px)",
                              marginBottom: 18,
                            }}
                          >
                            {ws.address && (
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 6,
                                }}
                              >
                                <Icon name="map-pin" size={14} />
                                <span
                                  style={{
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {ws.address}
                                </span>
                              </div>
                            )}
                            {ws.phone && (
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 6,
                                }}
                              >
                                <Icon name="phone" size={14} />
                                <span
                                  style={{
                                    direction: "ltr",
                                    unicodeBidi: "plaintext",
                                  }}
                                >
                                  {ws.phone}
                                </span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Action Link */}
                        <Link
                          to={`/workspaces/${ws.slug}`}
                          className="btn btn-md"
                          style={{
                            width: "100%",
                            justifyContent: "center",
                            gap: 8,
                            fontWeight: 700,
                            borderRadius: "var(--radius-lg, 12px)",
                            background: ws.primary_color || "var(--primary)",
                            borderColor: ws.primary_color || "var(--primary)",
                            color: "#ffffff",
                            padding: "12px",
                            transition: "all 0.2s ease",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.filter = "brightness(1.1)";
                            e.currentTarget.style.transform =
                              "translateY(-2px)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.filter = "none";
                            e.currentTarget.style.transform = "none";
                          }}
                        >
                          <span>{t("viewWorkspaceProfile")}</span>
                          <Icon
                            name="arrow-right"
                            size={16}
                            style={{
                              transform: isRTL ? "rotate(180deg)" : "none",
                            }}
                          />
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>

              {/* Pagination */}
              {pagination && pagination.last_page > 1 && (
                <nav
                  aria-label={isRTL ? "التنقل بين الصفحات" : "Pagination"}
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: 12,
                    marginTop: 44,
                  }}
                >
                  <button
                    className="btn btn-secondary btn-sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                    aria-label={isRTL ? "الصفحة السابقة" : "Previous page"}
                  >
                    {isRTL ? "السابق" : "Previous"}
                  </button>
                  <span
                    style={{
                      fontSize: "0.9rem",
                      color: "var(--text-secondary)",
                      fontWeight: 600,
                    }}
                  >
                    {isRTL
                      ? `صفحة ${pagination.current_page} من ${pagination.last_page}`
                      : `Page ${pagination.current_page} of ${pagination.last_page}`}
                  </span>
                  <button
                    className="btn btn-secondary btn-sm"
                    disabled={page >= pagination.last_page}
                    onClick={() => setPage((p) => p + 1)}
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
