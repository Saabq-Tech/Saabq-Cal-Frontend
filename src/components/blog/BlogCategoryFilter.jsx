import { useLanguage } from "../../context/LanguageContext";
import Icon from "../common/Icon";

export default function BlogCategoryFilter({
  categories = [],
  selectedCategory = "",
  onSelectCategory,
}) {
  const { t } = useLanguage();

  return (
    <div className="explore-categories-wrap" role="tablist">
      <button
        type="button"
        role="tab"
        aria-selected={!selectedCategory}
        className={`explore-category-chip ${!selectedCategory ? "active" : ""}`}
        onClick={() => onSelectCategory("")}
      >
        <span className="explore-category-icon">
          <Icon name="sparkles" size={15} />
        </span>
        <span>{t("allCategories")}</span>
      </button>

      {categories.map((cat) => {
        const isSelected = selectedCategory === cat.slug;
        return (
          <button
            key={cat.id || cat.slug}
            type="button"
            role="tab"
            aria-selected={isSelected}
            className={`explore-category-chip ${isSelected ? "active" : ""}`}
            onClick={() => onSelectCategory(cat.slug)}
          >
            <span className="explore-category-icon">
              <Icon name="briefcase" size={14} />
            </span>
            <span>{cat.name}</span>
            {cat.posts_count > 0 && (
              <span className="blog-chip-count">{cat.posts_count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
