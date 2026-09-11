import { Link } from "react-router-dom";
import { useLanguage } from "../../context/LanguageContext";
import Icon from "../common/Icon";

export default function BlogCard({ post }) {
  const { t, language } = useLanguage();
  const isRTL = language === "ar";

  if (!post) return null;

  const formattedDate = post.published_at
    ? new Date(post.published_at).toLocaleDateString(
        isRTL ? "ar-EG" : "en-US",
        { year: "numeric", month: "short", day: "numeric" },
      )
    : "";

  return (
    <article className="blog-card">
      <Link
        to={`/blog/${post.slug}`}
        className="blog-card-media"
        tabIndex={-1}
        aria-hidden="true"
      >
        {post.featured_image_url ? (
          <img
            src={post.featured_image_url}
            alt={post.title || ""}
            loading="lazy"
            className="blog-card-image"
          />
        ) : (
          <div className="blog-card-image-fallback">
            <Icon name="book-open" size={36} />
          </div>
        )}

        <div className="blog-card-media-shine" />

        {post.category && (
          <span className="blog-card-badge">{post.category.name}</span>
        )}
      </Link>

      <div className="blog-card-body">
        <div className="blog-card-meta-top">
          {formattedDate && (
            <span className="blog-card-date">
              <Icon name="calendar" size={13} />
              <time dateTime={post.published_at}>{formattedDate}</time>
            </span>
          )}
          {post.read_time_minutes > 0 && (
            <span className="blog-card-readtime">
              <Icon name="clock" size={13} />
              <span>
                {post.read_time_minutes} {t("minRead")}
              </span>
            </span>
          )}
        </div>

        <h3 className="blog-card-title">
          <Link to={`/blog/${post.slug}`}>{post.title}</Link>
        </h3>

        {post.excerpt && <p className="blog-card-excerpt">{post.excerpt}</p>}

        <div className="blog-card-footer">
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
              <span className="blog-card-author-name">{post.author.name}</span>
            </div>
          ) : (
            <div className="blog-card-author">
              <div className="blog-card-author-initial">S</div>
              <span className="blog-card-author-name">
                {isRTL ? "فريق سابق" : "Saabq"}
              </span>
            </div>
          )}

          <Link to={`/blog/${post.slug}`} className="blog-card-read-link">
            <span>{t("readArticle")}</span>
            <Icon
              name="arrow-right"
              size={14}
              className="blog-card-read-icon"
              style={{ transform: isRTL ? "rotate(180deg)" : "none" }}
            />
          </Link>
        </div>
      </div>
    </article>
  );
}
