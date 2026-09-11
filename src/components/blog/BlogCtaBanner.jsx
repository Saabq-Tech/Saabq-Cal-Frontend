import { Link } from "react-router-dom";
import { useLanguage } from "../../context/LanguageContext";
import Icon from "../common/Icon";

export default function BlogCtaBanner() {
  const { t, isRTL } = useLanguage();

  return (
    <div className="blog-cta-banner">
      <div className="blog-cta-glow" />
      <div className="blog-cta-content">
        <span className="blog-cta-badge">
          <Icon name="calendar" size={14} />
          <span>{t("appName")}</span>
        </span>
        <h3 className="blog-cta-title">{t("readyToStartWorkspace")}</h3>
        <p className="blog-cta-desc">{t("readyToStartWorkspaceDesc")}</p>
        <div className="blog-cta-actions">
          <Link
            to="/register?type=member"
            className="btn btn-primary blog-cta-btn"
          >
            <span>{t("createWorkspaceNow")}</span>
            <Icon
              name="arrow-right"
              size={16}
              style={{ transform: isRTL ? "none" : "rotate(180deg)" }}
            />
          </Link>
        </div>
      </div>
    </div>
  );
}
