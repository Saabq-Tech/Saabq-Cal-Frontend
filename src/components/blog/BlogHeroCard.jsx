import { Link } from "react-router-dom";
import { useLanguage } from "../../context/LanguageContext";
import Icon from "../common/Icon";

export default function BlogHeroCard({ post }) {
  const { t, language } = useLanguage();
  const isRTL = language === "ar";

  if (!post) return null;

  const formattedDate = post.published_at
    ? new Date(post.published_at).toLocaleDateString(
        isRTL ? "ar-EG" : "en-US",
        { year: "numeric", month: "long", day: "numeric" },
      )
    : "";

  return (
    <article className="blog-hero-card">
      <Link
        to={`/blog/${post.slug}`}
        className="blog-hero-media"
        tabIndex={-1}
        aria-hidden="true"
      >
        {post.featured_image_url ? (
          <img
            src={post.featured_image_url}
            alt={post.title || ""}
            className="blog-hero-image"
          />
        ) : (
          <div className="blog-hero-image-fallback">
            <Icon name="book-open" size={48} />
          </div>
        )}
        <div className="blog-hero-media-overlay" />
        {post.category && (
          <span className="blog-hero-overlay-category">
            {post.category.name}
          </span>
        )}
      </Link>

      <div className="blog-hero-content">
        <div className="blog-hero-tags">
          <span className="blog-hero-spotlight-badge">
            <Icon name="sparkles" size={13} className="spotlight-sparkle" />
            <span>{t("featuredArticle")}</span>
          </span>
        </div>

        <h2 className="blog-hero-title">
          <Link to={`/blog/${post.slug}`}>{post.title}</Link>
        </h2>

        {post.excerpt && <p className="blog-hero-excerpt">{post.excerpt}</p>}

        <div className="blog-hero-meta">
          {post.author ? (
            <div className="blog-card-author">
              {post.author.avatar ? (
                <img
                  src={post.author.avatar}
                  alt={post.author.name}
                  className="blog-card-author-avatar"
                />
              ) : (
                <div className="blog-card-author-initial">
                  {post.author.name?.charAt(0) || "S"}
                </div>
              )}
              <div className="blog-card-author-info">
                <span className="blog-card-author-name">
                  {post.author.name}
                </span>
                <span className="blog-card-author-sub">{t("appName")}</span>
              </div>
            </div>
          ) : (
            <div className="blog-card-author">
              <div className="blog-card-author-initial">S</div>
              <div className="blog-card-author-info">
                <span className="blog-card-author-name">
                  {isRTL ? "فريق تقويم سابق" : "Saabq Team"}
                </span>
                <span className="blog-card-author-sub">{t("appName")}</span>
              </div>
            </div>
          )}

          <div className="blog-hero-meta-stats">
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
          </div>
        </div>

        <div className="blog-hero-action">
          <Link
            to={`/blog/${post.slug}`}
            className="btn btn-primary blog-hero-btn"
          >
            <span>{t("readArticle")}</span>
            <Icon
              name="arrow-right"
              size={16}
              style={{ transform: isRTL ? "rotate(180deg)" : "none" }}
            />
          </Link>
        </div>
      </div>
    </article>
  );
}
