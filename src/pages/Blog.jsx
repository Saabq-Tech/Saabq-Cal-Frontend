import { Link } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import SEO from "../components/ui/SEO";
import Icon from "../components/common/Icon";

/**
 * Placeholder for the blog announced in the navigation. There is no posts
 * resource in the API yet, so this page states that plainly rather than
 * showing an empty list.
 */
export default function Blog() {
  const { t, isRTL } = useLanguage();

  return (
    <main className="main-content">
      <SEO
        title={t("blogTitle")}
        description={t("blogComingSoonDesc")}
        canonical="/blog"
      />

      <section className="section-sm">
        <div className="container">
          <div className="blog-soon">
            <span className="blog-soon-icon">
              <Icon name="book-open" size={34} />
            </span>
            <h1>{t("blogComingSoon")}</h1>
            <p>{t("blogComingSoonDesc")}</p>
            <Link to="/" className="btn btn-primary">
              <Icon
                name="arrow-right"
                size={16}
                style={{ transform: isRTL ? "none" : "rotate(180deg)" }}
              />
              {t("backToHome")}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
