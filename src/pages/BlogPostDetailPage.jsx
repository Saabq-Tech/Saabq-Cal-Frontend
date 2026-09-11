import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import client, { endpoints } from "../api/client";
import { useLanguage } from "../context/LanguageContext";
import SEO from "../components/ui/SEO";
import { PageSkeleton } from "../components/ui/Skeleton";
import Icon from "../components/common/Icon";
import BlogReadingProgress from "../components/blog/BlogReadingProgress";
import BlogShareBar from "../components/blog/BlogShareBar";
import BlogCard from "../components/blog/BlogCard";
import BlogCtaBanner from "../components/blog/BlogCtaBanner";

export default function BlogPostDetailPage() {
  const { slug } = useParams();
  const { t, language, isRTL } = useLanguage();

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(false);

    client
      .get(endpoints.postDetail(slug))
      .then((res) => {
        if (isMounted) {
          setPost(res.data.data);
        }
      })
      .catch(() => {
        if (isMounted) {
          setError(true);
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
  }, [slug, language]);

  if (loading) {
    return (
      <main className="main-content">
        <div className="container section-sm">
          <PageSkeleton />
        </div>
      </main>
    );
  }

  if (error || !post) {
    return (
      <main className="main-content">
        <section className="section-sm">
          <div className="container">
            <div className="blog-empty-state">
              <span className="blog-empty-icon">
                <Icon name="book-open" size={36} />
              </span>
              <h2>{t("noArticlesFound")}</h2>
              <Link to="/blog" className="btn btn-primary mt-4">
                <Icon
                  name="arrow-right"
                  size={16}
                  style={{ transform: isRTL ? "none" : "rotate(180deg)" }}
                />
                <span>{t("backToBlog")}</span>
              </Link>
            </div>
          </div>
        </section>
      </main>
    );
  }

  const formattedDate = post.published_at
    ? new Date(post.published_at).toLocaleDateString(
        language === "ar" ? "ar-EG" : "en-US",
        { year: "numeric", month: "long", day: "numeric" },
      )
    : "";

  // Schema.org BlogPosting structured data
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    image: post.featured_image_url || undefined,
    datePublished: post.published_at,
    author: post.author
      ? {
          "@type": "Person",
          name: post.author.name,
        }
      : undefined,
  };

  return (
    <main className="main-content blog-detail-page">
      <BlogReadingProgress />

      <SEO
        title={`${post.seo_title || post.title} — ${t("appName")}`}
        description={post.seo_description || post.excerpt || ""}
        canonical={`/blog/${post.slug}`}
        image={post.featured_image_url}
        structuredData={structuredData}
      />

      {/* Breadcrumb Bar */}
      <nav className="blog-breadcrumbs-wrapper" aria-label="Breadcrumb">
        <div className="container">
          <ol className="blog-breadcrumbs">
            <li>
              <Link to="/">{t("home")}</Link>
            </li>
            <li className="separator">/</li>
            <li>
              <Link to="/blog">{t("blogTitle")}</Link>
            </li>
            {post.category && (
              <>
                <li className="separator">/</li>
                <li>
                  <Link to={`/blog?category=${post.category.slug}`}>
                    {post.category.name}
                  </Link>
                </li>
              </>
            )}
            <li className="separator">/</li>
            <li className="current" aria-current="page">
              {post.title}
            </li>
          </ol>
        </div>
      </nav>

      {/* Article Header */}
      <header className="blog-detail-header">
        <div className="container blog-detail-container">
          <div className="blog-detail-meta-top">
            {post.category && (
              <span className="blog-card-badge">{post.category.name}</span>
            )}
            {formattedDate && (
              <span className="blog-card-date">
                <Icon name="calendar" size={14} />
                <time dateTime={post.published_at}>{formattedDate}</time>
              </span>
            )}
            {post.read_time_minutes > 0 && (
              <span className="blog-card-readtime">
                <Icon name="clock" size={14} />
                <span>
                  {post.read_time_minutes} {t("minRead")}
                </span>
              </span>
            )}
            {post.views_count > 0 && (
              <span className="blog-card-views">
                <Icon name="eye" size={14} />
                <span>
                  {post.views_count} {t("viewsCount")}
                </span>
              </span>
            )}
          </div>

          <h1 className="blog-detail-title">{post.title}</h1>

          {post.excerpt && <p className="blog-detail-lead">{post.excerpt}</p>}

          {post.author && (
            <div className="blog-detail-author-row">
              {post.author.avatar ? (
                <img
                  src={post.author.avatar}
                  alt={post.author.name}
                  className="blog-detail-author-avatar"
                />
              ) : (
                <div className="blog-card-author-initial">
                  {post.author.name?.charAt(0) || "S"}
                </div>
              )}
              <div className="blog-detail-author-info">
                <span className="blog-detail-author-label">
                  {t("authorBy")}
                </span>
                <span className="blog-detail-author-name">
                  {post.author.name}
                </span>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Featured Hero Banner */}
      {post.featured_image_url && (
        <div className="container blog-detail-container mb-8">
          <div className="blog-detail-featured-media">
            <img
              src={post.featured_image_url}
              alt={post.title}
              className="blog-detail-featured-image"
            />
          </div>
        </div>
      )}

      {/* Article Content & Side Share */}
      <section className="blog-detail-body-section">
        <div className="container blog-detail-container blog-detail-layout">
          {/* Floating Share Bar (Desktop) */}
          <aside className="blog-detail-share-col">
            <BlogShareBar title={post.title} />
          </aside>

          {/* Article Main Body */}
          <div className="blog-detail-content-col">
            <div
              className="blog-rich-content"
              dangerouslySetInnerHTML={{ __html: post.body || "" }}
            />

            {/* Bottom Mobile Share Bar */}
            <div className="blog-detail-bottom-share">
              <BlogShareBar title={post.title} />
            </div>

            {/* Author Bio Box */}
            {post.author && (
              <div className="blog-author-box">
                {post.author.avatar ? (
                  <img
                    src={post.author.avatar}
                    alt={post.author.name}
                    className="blog-author-box-avatar"
                  />
                ) : (
                  <div className="blog-author-box-initial">
                    {post.author.name?.charAt(0) || "S"}
                  </div>
                )}
                <div className="blog-author-box-body">
                  <h4 className="blog-author-box-name">{post.author.name}</h4>
                  <p className="blog-author-box-desc">
                    {t("appName")} — {t("appSubtitle")}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Related Posts */}
      {post.related_posts && post.related_posts.length > 0 && (
        <section className="section-sm blog-related-section">
          <div className="container">
            <div className="section-header-compact">
              <h2>{t("relatedArticles")}</h2>
            </div>
            <div className="blog-grid blog-grid-related">
              {post.related_posts.map((item) => (
                <BlogCard key={item.id || item.slug} post={item} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Bottom CTA Banner */}
      <section className="section-sm">
        <div className="container">
          <BlogCtaBanner />
        </div>
      </section>
    </main>
  );
}
