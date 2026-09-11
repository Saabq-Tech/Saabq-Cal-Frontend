import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import client, { endpoints } from "../api/client";
import { useLanguage } from "../context/LanguageContext";
import SEO from "../components/ui/SEO";
import { PageSkeleton } from "../components/ui/Skeleton";
import Icon from "../components/common/Icon";
import BlogHeroCard from "../components/blog/BlogHeroCard";
import BlogCard from "../components/blog/BlogCard";
import BlogCategoryFilter from "../components/blog/BlogCategoryFilter";
import BlogCtaBanner from "../components/blog/BlogCtaBanner";

export default function Blog() {
  const { t, language, isRTL } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();

  const selectedCategory = searchParams.get("category") || "";
  const page = parseInt(searchParams.get("page") || "1", 10);

  const [categories, setCategories] = useState([]);
  const [posts, setPosts] = useState([]);
  const [featuredPost, setFeaturedPost] = useState(null);
  const [pagination, setPagination] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch Categories once or when language changes
  useEffect(() => {
    client
      .get(endpoints.postCategories)
      .then((res) => {
        if (Array.isArray(res.data?.data)) {
          setCategories(res.data.data);
        }
      })
      .catch(() => {});
  }, [language]);

  // Fetch Posts when category, search, page, or language changes
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const params = {
      page,
      per_page: 9,
    };
    if (selectedCategory) {
      params.category = selectedCategory;
    }
    if (debouncedSearch) {
      params.search = debouncedSearch;
    }

    client
      .get(endpoints.posts, { params })
      .then((res) => {
        if (!isMounted) return;

        const data = res.data?.data;
        const meta = res.data?.meta;

        if (Array.isArray(data)) {
          // If on page 1 with no active search/category filter, pick first featured post for spotlight
          if (page === 1 && !selectedCategory && !debouncedSearch) {
            const featured = data.find((p) => p.is_featured) || data[0];
            setFeaturedPost(featured);
            // Remaining posts for the grid
            setPosts(data.filter((p) => p.id !== featured?.id));
          } else {
            setFeaturedPost(null);
            setPosts(data);
          }
          setPagination(meta || null);
        }
      })
      .catch(() => {
        if (isMounted) {
          setPosts([]);
          setFeaturedPost(null);
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [selectedCategory, debouncedSearch, page, language]);

  const handleCategorySelect = (categorySlug) => {
    const nextParams = new URLSearchParams(searchParams);
    if (categorySlug) {
      nextParams.set("category", categorySlug);
    } else {
      nextParams.delete("category");
    }
    nextParams.delete("page");
    setSearchParams(nextParams);
  };

  const handlePageChange = (newPage) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("page", String(newPage));
    setSearchParams(nextParams);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setDebouncedSearch("");
    setSearchParams({});
  };

  return (
    <main className="main-content blog-page">
      <SEO
        title={`${t("blogTitle")} — ${t("appName")}`}
        description={t("blogSubtitle")}
        canonical="/blog"
      />

      {/* Flagship Aurora Hero Header */}
      <section className="explore-hero blog-hero-aurora">
        <div className="container">
          <div className="explore-hero-inner">
            {/* Glowing Hero Badge */}
            <div className="explore-badge">
              <span className="explore-badge-icon">
                <Icon name="sparkles" size={15} />
              </span>
              <span>{t("blogTitle")}</span>
            </div>

            {/* Hero Main Heading with Brand Gradient */}
            <h1 className="explore-title">
              {isRTL ? "مدونة " : "Saabq "}
              <span className="explore-title-gradient">
                {isRTL ? "تقويم سابق" : "Blog"}
              </span>
            </h1>

            {/* Subtitle */}
            <p className="explore-subtitle">{t("blogSubtitle")}</p>

            {/* Knowledge & Value Pillars Strip */}
            <div className="explore-trust-strip">
              <div className="explore-trust-item">
                <span className="explore-trust-icon" aria-hidden="true">
                  <Icon name="book-open" size={15} />
                </span>
                <span>
                  {isRTL ? "أدلة ونصائح عملية" : "Practical Guides & Tips"}
                </span>
              </div>
              <div className="explore-trust-item">
                <span className="explore-trust-icon" aria-hidden="true">
                  <Icon name="calendar" size={15} />
                </span>
                <span>
                  {isRTL
                    ? "أسرار تنظيم الوقت والجدولة"
                    : "Time & Schedule Secrets"}
                </span>
              </div>
              <div className="explore-trust-item">
                <span className="explore-trust-icon" aria-hidden="true">
                  <Icon name="sparkles" size={15} />
                </span>
                <span>
                  {isRTL
                    ? "تحديثات وميزات مستمرة"
                    : "Continuous Updates & Releases"}
                </span>
              </div>
            </div>

            {/* Flagship Floating Search Bar */}
            <div className="explore-search-container">
              <div className="explore-search-wrapper">
                <span className="explore-search-icon-badge">
                  <Icon name="search" size={20} />
                </span>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={t("searchArticlesPlaceholder")}
                  className="explore-search-input"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm("")}
                    className="explore-search-clear"
                    aria-label="Clear search"
                  >
                    <Icon name="x-mark" size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Category Filter Chips */}
            {categories.length > 0 && (
              <BlogCategoryFilter
                categories={categories}
                selectedCategory={selectedCategory}
                onSelectCategory={handleCategorySelect}
              />
            )}
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="section-sm blog-listing-section">
        <div className="container">
          {loading ? (
            <PageSkeleton />
          ) : (
            <>
              {/* Featured Spotlight Card */}
              {featuredPost && (
                <div className="blog-spotlight-wrapper mb-10">
                  <BlogHeroCard post={featuredPost} />
                </div>
              )}

              {/* Grid of Posts */}
              {posts.length > 0 ? (
                <>
                  <div className="blog-grid">
                    {posts.map((post) => (
                      <BlogCard key={post.id || post.slug} post={post} />
                    ))}
                  </div>

                  {/* Pagination */}
                  {pagination && pagination.last_page > 1 && (
                    <nav className="blog-pagination" aria-label="Pagination">
                      <button
                        type="button"
                        disabled={pagination.current_page <= 1}
                        onClick={() =>
                          handlePageChange(pagination.current_page - 1)
                        }
                        className="btn btn-secondary blog-page-btn"
                        aria-label="Previous page"
                      >
                        <Icon
                          name="arrow-right"
                          size={14}
                          style={{
                            transform: isRTL ? "none" : "rotate(180deg)",
                          }}
                        />
                      </button>

                      <div className="blog-page-numbers">
                        {Array.from(
                          { length: pagination.last_page },
                          (_, i) => i + 1,
                        ).map((p) => (
                          <button
                            key={p}
                            type="button"
                            className={`blog-page-num ${p === pagination.current_page ? "active" : ""}`}
                            onClick={() => handlePageChange(p)}
                          >
                            {p}
                          </button>
                        ))}
                      </div>

                      <button
                        type="button"
                        disabled={
                          pagination.current_page >= pagination.last_page
                        }
                        onClick={() =>
                          handlePageChange(pagination.current_page + 1)
                        }
                        className="btn btn-secondary blog-page-btn"
                        aria-label="Next page"
                      >
                        <Icon
                          name="arrow-right"
                          size={14}
                          style={{
                            transform: isRTL ? "rotate(180deg)" : "none",
                          }}
                        />
                      </button>
                    </nav>
                  )}
                </>
              ) : !featuredPost ? (
                /* Empty State */
                <div className="blog-empty-state">
                  <div className="blog-empty-icon-glow">
                    <span className="blog-empty-icon">
                      <Icon name="book-open" size={34} />
                    </span>
                  </div>
                  <h3 className="blog-empty-title">{t("noArticlesFound")}</h3>
                  <p className="blog-empty-desc">{t("blogComingSoonDesc")}</p>
                  {(selectedCategory || debouncedSearch) && (
                    <button
                      type="button"
                      onClick={handleClearFilters}
                      className="btn btn-primary blog-empty-clear-btn"
                    >
                      <Icon name="x-mark" size={14} />
                      <span>{t("clearFilters")}</span>
                    </button>
                  )}
                </div>
              ) : null}
            </>
          )}
        </div>
      </section>

      {/* Bottom Conversion CTA Banner */}
      <section className="section-sm">
        <div className="container">
          <BlogCtaBanner />
        </div>
      </section>
    </main>
  );
}
