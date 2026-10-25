import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import client, { endpoints } from "../api/client";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import SEO from "../components/ui/SEO";
import LazyImage from "../components/ui/LazyImage";
import {
  SkeletonLine,
  SkeletonRect,
  SkeletonCircle,
} from "../components/ui/Skeleton";
import Icon from "../components/common/Icon";
import HeroDashboardMockup from "../components/marketing/HeroDashboardMockup";
import AboutIllustration from "../components/marketing/AboutIllustration";
import {
  sortPlansByPrice,
  getPopularPlanId,
  isStartingFromPlan,
  formatPlanPrice,
  planCurrencyLabel,
  planPrice,
} from "../utils/plans";

// The eight sectors shown in the "built for any activity" grid. There is no /sectors endpoint, so this list lives here and is
// translated through translations.js; the shape mirrors what an API resource
// would return so swapping the source later stays a local change.
const SECTORS = [
  {
    icon: "activity",
    titleKey: "sectorClinicsTitle",
    descKey: "sectorClinicsDesc",
  },
  {
    icon: "user-check",
    titleKey: "sectorConsultantsTitle",
    descKey: "sectorConsultantsDesc",
  },
  {
    icon: "briefcase",
    titleKey: "sectorCompaniesTitle",
    descKey: "sectorCompaniesDesc",
  },
  {
    icon: "scissors",
    titleKey: "sectorSalonsTitle",
    descKey: "sectorSalonsDesc",
  },
  {
    icon: "award",
    titleKey: "sectorFitnessTitle",
    descKey: "sectorFitnessDesc",
  },
  {
    icon: "book-open",
    titleKey: "sectorTrainingTitle",
    descKey: "sectorTrainingDesc",
  },
  {
    icon: "tool",
    titleKey: "sectorServicesTitle",
    descKey: "sectorServicesDesc",
  },
  { icon: "users", titleKey: "sectorTeamsTitle", descKey: "sectorTeamsDesc" },
];

const CHANNELS = [
  { icon: "whatsapp", labelKey: "channelWhatsapp", tone: "whatsapp" },
  { icon: "facebook", labelKey: "channelMessenger", tone: "messenger" },
  { icon: "instagram", labelKey: "channelInstagram", tone: "instagram" },
  { icon: "message-square", labelKey: "channelSms", tone: "sms" },
  { icon: "telegram", labelKey: "channelTelegram", tone: "more" },
  { icon: "message-circle", labelKey: "channelWebChat", tone: "more" },
];

const HOW_IT_WORKS_STEPS = [
  { icon: "user-plus", titleKey: "step1Title", descKey: "step1Desc" },
  { icon: "settings", titleKey: "step2Title", descKey: "step2Desc" },
  { icon: "share-2", titleKey: "step3Title", descKey: "step3Desc" },
  { icon: "bar-chart", titleKey: "step4Title", descKey: "step4Desc" },
];

const HERO_TRUST = ["heroTrustSetup", "heroTrustDevices", "heroTrustNoCard"];

const WHY_CHOOSE = [
  { key: "whyChoosePoint1", icon: "globe" },
  { key: "whyChoosePoint2", icon: "layers" },
  { key: "whyChoosePoint3", icon: "award" },
  { key: "whyChoosePoint4", icon: "clock" },
];

const FEATURE_ICONS = [
  <Icon key="calendar" name="calendar" size={24} />,
  <Icon key="zap" name="zap" size={24} />,
  <Icon key="bell" name="bell" size={24} />,
  <Icon key="bar-chart" name="bar-chart" size={24} />,
  <Icon key="shield" name="shield" size={24} />,
  <Icon key="globe" name="globe" size={24} />,
];

export default function Home() {
  const { t, lang, isRTL } = useLanguage();
  const { isAuthenticated } = useAuth();

  const [banners, setBanners] = useState([]);
  const [features, setFeatures] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [about, setAbout] = useState(null);
  const [plans, setPlans] = useState([]);
  const [supportEmail, setSupportEmail] = useState("");
  const [activeBanner, setActiveBanner] = useState(0);
  const [openFaq, setOpenFaq] = useState(null);
  const [loading, setLoading] = useState(true);
  const [touchStartX, setTouchStartX] = useState(null);
  const [touchEndX, setTouchEndX] = useState(null);

  const formatTranslatable = (val) => {
    if (val === null || val === undefined) return "";
    if (typeof val === "string" || typeof val === "number") return String(val);
    if (typeof val === "object") {
      const res =
        val[isRTL ? "ar" : "en"] ||
        val.ar ||
        val.en ||
        val.name ||
        val.title ||
        val.code ||
        val.symbol;
      return typeof res === "string" || typeof res === "number"
        ? String(res)
        : "";
    }
    return "";
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([
      client.get(endpoints.banners).catch(() => ({ data: { data: [] } })),
      client.get(endpoints.features).catch(() => ({ data: { data: [] } })),
      client.get(endpoints.faqs).catch(() => ({ data: { data: [] } })),
      client.get(endpoints.about).catch(() => ({ data: { data: null } })),
      client.get(endpoints.plans).catch(() => ({ data: { data: [] } })),
      client.get(endpoints.settings).catch(() => ({ data: { data: null } })),
    ]).then(([bannersRes, featuresRes, faqsRes, aboutRes, plansRes, settingsRes]) => {
      setBanners(bannersRes.data.data || []);
      setFeatures(featuresRes.data.data || []);
      setFaqs(faqsRes.data.data || []);
      setAbout(aboutRes.data.data || null);
      setPlans(plansRes.data.data || []);
      setSupportEmail(settingsRes.data.data?.site_email || "");
      setLoading(false);
    });
  }, [lang]);

  // Auto-rotate banners
  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
      setActiveBanner((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [banners.length]);

  const sortedPlans = useMemo(() => sortPlansByPrice(plans), [plans]);
  const popularPlanId = getPopularPlanId(sortedPlans);

  // Build FAQ JSON-LD structured data
  const faqJsonLd = useMemo(() => {
    if (faqs.length === 0) return null;
    return {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: faq.answer,
        },
      })),
    };
  }, [faqs]);

  const aboutBody = about?.body || about?.content || "";

  return (
    <div className="main-content">
      <SEO pageKey="home" jsonLd={faqJsonLd ? [faqJsonLd] : undefined} />

      {/* Hero Section */}
      <section id="home" className="hero-lp">
        <div className="container hero-lp-grid">
          <div className="hero-lp-copy animate-fade-in-up">
            <div className="hero-badge">
              <Icon name="custom-d3d330f2" size={14} />
              {t("heroBadgeNew")}
            </div>
            <h1 className="hero-lp-title">
              {t("heroTitleLine1")}{" "}
              <span className="hero-lp-highlight">
                {t("heroTitleHighlight")}
              </span>{" "}
              {t("heroTitleLine2")}
            </h1>
            <p className="hero-lp-desc">{t("heroDescriptionNew")}</p>

            <div className="hero-lp-actions">
              {!isAuthenticated && (
                <Link to="/register" className="btn btn-primary btn-lg">
                  {t("getStartedFree")}
                  <Icon
                    name="arrow-right"
                    size={16}
                    style={{
                      transform: isRTL ? "rotate(180deg)" : "none",
                    }}
                  />
                </Link>
              )}
              <Link to="/workspaces" className="btn btn-outline btn-lg">
                <Icon name="monitor" size={17} />
                {t("exploreWorkspaces")}
              </Link>
            </div>

            <ul className="hero-lp-trust">
              {HERO_TRUST.map((key) => (
                <li key={key}>
                  <Icon name="check-circle" size={16} />
                  <span>{t(key)}</span>
                </li>
              ))}
            </ul>
          </div>

          <HeroDashboardMockup />
        </div>
      </section>

      {/* Banners Slider Section */}
      {loading ? (
        <section className="section-sm" style={{ paddingBottom: 0 }}>
          <div className="container">
            <SkeletonRect height={280} radius="var(--radius-lg, 12px)" />
          </div>
        </section>
      ) : (
        banners.length > 0 && (
          <section className="section-sm" style={{ paddingBottom: 0 }}>
            <div className="container">
              <div
                className="banner-slider"
                role="region"
                aria-label={
                  lang === "ar" ? "شريط الإعلانات" : "Banner slideshow"
                }
                onTouchStart={(e) => {
                  setTouchEndX(null);
                  setTouchStartX(e.targetTouches[0].clientX);
                }}
                onTouchMove={(e) => {
                  setTouchEndX(e.targetTouches[0].clientX);
                }}
                onTouchEnd={() => {
                  if (touchStartX === null || touchEndX === null) return;
                  const distance = touchStartX - touchEndX;
                  const isSwipe = Math.abs(distance) > 40;
                  if (isSwipe && banners.length > 1) {
                    if (distance > 0) {
                      // swipe left
                      setActiveBanner((prev) =>
                        isRTL
                          ? (prev - 1 + banners.length) % banners.length
                          : (prev + 1) % banners.length,
                      );
                    } else {
                      // swipe right
                      setActiveBanner((prev) =>
                        isRTL
                          ? (prev + 1) % banners.length
                          : (prev - 1 + banners.length) % banners.length,
                      );
                    }
                  }
                  setTouchStartX(null);
                  setTouchEndX(null);
                }}
              >
                {banners.map((banner, i) => {
                  const imageUrl = banner.image || banner.image_url;
                  const subtitleText = banner.subtitle || banner.description;
                  return (
                    <div
                      key={banner.id || i}
                      className={`banner-slide${i === activeBanner ? " active" : ""}`}
                    >
                      {imageUrl && (
                        <div className="banner-slide-image">
                          <LazyImage
                            src={imageUrl}
                            alt={banner.title || "Promotional banner"}
                            width={1200}
                            height={400}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                              borderRadius: "inherit",
                            }}
                          />
                        </div>
                      )}
                      <div className="banner-slide-content">
                        {banner.title && <h3>{banner.title}</h3>}
                        {subtitleText && <p>{subtitleText}</p>}
                        {banner.button_text && (
                          <a
                            href={banner.link || "#"}
                            className="banner-slide-btn"
                          >
                            {banner.button_text}
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              {banners.length > 1 && (
                <div
                  className="banner-dots"
                  role="tablist"
                  aria-label={
                    lang === "ar" ? "التنقل بين الإعلانات" : "Banner navigation"
                  }
                >
                  {banners.map((_, i) => (
                    <button
                      key={i}
                      className={`banner-dot${i === activeBanner ? " active" : ""}`}
                      onClick={() => setActiveBanner(i)}
                      aria-label={`${lang === "ar" ? "الإعلان" : "Banner"} ${i + 1}`}
                      role="tab"
                      aria-selected={i === activeBanner}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>
        )
      )}

      {/* Sectors */}
      <section id="sectors" className="section-sm is-compact">
        <div className="container">
          <div className="section-header">
            <h2>{t("sectorsTitle")}</h2>
            <p>{t("trustStripTitle")}</p>
          </div>
          <div className="sectors-grid">
            {SECTORS.map((sector) => (
              <article
                key={sector.titleKey}
                className="card card-hover sector-card"
              >
                <div className="card-icon">
                  <Icon name={sector.icon} size={24} />
                </div>
                <h3>{t(sector.titleKey)}</h3>
                <p>{t(sector.descKey)}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        id="features"
        className="section-sm is-compact"
        style={{ background: "var(--surface)" }}
      >
        <div className="container">
          <div className="section-header">
            <h2>{t("featuresTitleNew")}</h2>
          </div>
          {loading ? (
            <div className="features-grid">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="card feature-card"
                  style={{ padding: 24 }}
                >
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
          ) : (
            <div className="features-grid">
              {features.map((feature, i) => {
                return (
                  <article
                    key={feature.id || i}
                    className="card card-hover feature-card"
                  >
                    <div className="card-icon">
                      {feature.image || feature.icon_url ? (
                        <img
                          src={feature.image || feature.icon_url}
                          alt=""
                          width={28}
                          height={28}
                          loading="lazy"
                        />
                      ) : feature.icon ? (
                        <Icon name={feature.icon} size={28} />
                      ) : (
                        FEATURE_ICONS[i % FEATURE_ICONS.length]
                      )}
                    </div>
                    <h3>{feature.title}</h3>
                    <p>{feature.description}</p>
                  </article>
                );
              })}
            </div>
          )}
          <div id="how-it-works" className="steps-strip">
            <h3 className="steps-strip-title">{t("howItWorksTitle")}</h3>
            <ol className="steps-strip-list">
              {HOW_IT_WORKS_STEPS.map((step) => (
                <li key={step.titleKey}>
                  <span className="steps-strip-icon">
                    <Icon name={step.icon} size={18} />
                  </span>
                  <span>
                    <strong>{t(step.titleKey)}</strong>
                    <small>{t(step.descKey)}</small>
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="section-sm">
        <div className="container">
          <div className="about-panel is-compact">
            <div className="about-copy">
              <span className="about-eyebrow">{t("aboutEyebrow")}</span>
              <h2>{about?.title || t("aboutTitle")}</h2>

              {loading ? (
                <div className="about-skeleton">
                  <SkeletonLine width="95%" height={14} />
                  <SkeletonLine width="88%" height={14} />
                  <SkeletonLine width="70%" height={14} />
                </div>
              ) : aboutBody ? (
                /* The editorial copy is admin-managed; the surrounding
                   layout is not. Falls back to the shipped text when the
                   endpoint has nothing yet. */
                <div
                  className="about-body"
                  dangerouslySetInnerHTML={{ __html: aboutBody }}
                />
              ) : (
                <div className="about-body">
                  <p>{t("aboutParagraph1")}</p>
                  <p>{t("aboutParagraph2")}</p>
                </div>
              )}

            </div>

            <div className="about-art-wrap">
              <AboutIllustration />
            </div>
          </div>
        </div>
      </section>

      {/* Saabq Chat: one inbox for every messaging channel */}
      <section className="section-sm">
        <div className="container">
          <div className="channels-panel">
            <div className="channels-copy">
              <span className="channels-badge">{t("channelsBadge")}</span>
              <h2>{t("channelsTitle")}</h2>
              <p>{t("channelsDesc")}</p>
              <p className="channels-footer">{t("channelsFooter")}</p>
              <a
                href="https://saabqchat.com"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline channels-cta"
              >
                {t("channelsCta")}
                <Icon name="external-link" size={15} />
              </a>
            </div>
            <ul className="channels-list">
              {CHANNELS.map((channel) => (
                <li key={channel.labelKey}>
                  <span className={`channel-bubble tone-${channel.tone}`}>
                    <Icon name={channel.icon} size={22} />
                  </span>
                  <span className="channel-label">{t(channel.labelKey)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="section-sm">
        <div className="container pricing-container">
          <div className="section-header">
            <h2>{t("pricingTitleNew")}</h2>
            <p>{t("pricingSubtitleNew")}</p>
            <ul className="why-chips" aria-label={t("whyChooseTitle")}>
              {WHY_CHOOSE.map((point) => (
                <li key={point.key}>
                  <Icon name={point.icon} size={15} />
                  {t(point.key)}
                </li>
              ))}
            </ul>
          </div>
          <div className="pricing-layout is-full">
            <div
              className={`pricing-grid ${
                plans.length > 0 ? `plans-count-${plans.length}` : ""
              }`}
            >
              {loading ? (
                [1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="card pricing-card"
                    style={{ padding: 24 }}
                  >
                    <SkeletonLine width="40%" height={24} />
                    <SkeletonLine
                      width="70%"
                      height={14}
                      style={{ marginTop: 12 }}
                    />
                    <div
                      style={{
                        marginTop: 24,
                        display: "flex",
                        flexDirection: "column",
                        gap: 10,
                      }}
                    >
                      <SkeletonLine width="85%" height={14} />
                      <SkeletonLine width="90%" height={14} />
                      <SkeletonLine width="75%" height={14} />
                    </div>
                  </div>
                ))
              ) : sortedPlans.length > 0 ? (
                sortedPlans.map((plan) => {
                  const isPopular = plan.id === popularPlanId;
                  const startingFrom = isStartingFromPlan(plan, sortedPlans);
                  const limitLine = (value, label, unlimitedLabel) =>
                    value
                      ? `${label}: ${Number(value).toLocaleString("en-US")}`
                      : unlimitedLabel;

                  return (
                    <article
                      key={plan.id}
                      className={`pricing-card ${isPopular ? "popular" : ""}`}
                    >
                      {isPopular && (
                        <span className="popular-badge">{t("popularTag")}</span>
                      )}
                      <h3>{formatTranslatable(plan.name)}</h3>
                      <div className="plan-price">
                        {startingFrom && (
                          <span className="period">{t("planStartingFrom")}</span>
                        )}
                        <span className="amount">{formatPlanPrice(plan)}</span>
                        <span className="currency">
                          {planCurrencyLabel(plan, lang)}
                        </span>
                        {planPrice(plan) > 0 && (
                          <span className="period">{t("planPerMonth")}</span>
                        )}
                      </div>
                      <ul className="plan-features">
                        <li>
                          {limitLine(
                            plan.max_members,
                            t("planAccountsLabel"),
                            t("planUnlimitedAccounts"),
                          )}
                        </li>
                        <li>
                          {limitLine(
                            plan.max_services,
                            t("planServicesLabel"),
                            t("unlimitedServices"),
                          )}
                        </li>
                        <li>
                          {limitLine(
                            plan.max_appointments,
                            t("planBookingsLabel"),
                            t("unlimitedAppointments"),
                          )}
                        </li>
                        <li>
                          {limitLine(
                            plan.max_customers,
                            t("customers"),
                            t("planUnlimitedCustomers"),
                          )}
                        </li>
                      </ul>
                      <Link
                        to="/register"
                        className={`btn ${isPopular ? "btn-primary" : "btn-secondary"} btn-block`}
                      >
                        {planPrice(plan) > 0
                          ? t("getStarted")
                          : t("planStartFree")}
                      </Link>
                    </article>
                  );
                })
              ) : (
                <div
                  style={{
                    gridColumn: "1 / -1",
                    textAlign: "center",
                    padding: 40,
                    color: "var(--muted)",
                  }}
                >
                  {t("noPlansAvailable") || "لا توجد باقات متاحة حالياً"}
                </div>
              )}
            </div>
          </div>
          {sortedPlans.length > 0 && (
            <div className="pricing-compare-link">
              <Link to="/pricing">{t("planCompareAll")}</Link>
            </div>
          )}
        </div>
      </section>

      {/* FAQs Section */}
      <section className="section-sm" style={{ background: "var(--surface)" }}>
        <div className="container faq-layout">
          <div className="faq-intro">
            <h2>{t("faqsTitle")}</h2>
            <p>{t("faqsDesc")}</p>
            {supportEmail && (
              <a href={`mailto:${supportEmail}`} className="btn btn-outline">
                <Icon name="mail" size={16} />
                {t("faqContactUs")}
              </a>
            )}
          </div>
          {loading ? (
            <div className="faq-list">
              {[1, 2, 3].map((i) => (
                <SkeletonRect key={i} height={52} />
              ))}
            </div>
          ) : (
            <div className="faq-list">
              {faqs.map((faq, i) => (
                <div
                  key={faq.id || i}
                  className={`faq-item${openFaq === i ? " open" : ""}`}
                >
                  <button
                    className="faq-question"
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    aria-expanded={openFaq === i}
                    aria-controls={`faq-answer-${i}`}
                  >
                    <span>{faq.question}</span>
                    <Icon name={openFaq === i ? "x" : "plus"} size={16} />
                  </button>
                  {openFaq === i && (
                    <div
                      className="faq-answer"
                      id={`faq-answer-${i}`}
                      role="region"
                    >
                      {faq.answer}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Closing CTA band */}
      <section className="section-sm">
        <div className="container">
          <div className="final-cta">
            <div className="final-cta-copy">
              <h2>{t("finalCtaTitle")}</h2>
              <p>{t("finalCtaDesc")}</p>
              <div className="final-cta-actions">
                {!isAuthenticated && (
                  <Link to="/register" className="btn btn-lg final-cta-btn">
                    {t("getStartedFree")}
                    <Icon
                      name="arrow-right"
                      size={16}
                      style={{ transform: isRTL ? "rotate(180deg)" : "none" }}
                    />
                  </Link>
                )}
                <Link to="/workspaces" className="btn btn-lg final-cta-ghost">
                  <Icon name="monitor" size={17} />
                  {t("exploreWorkspaces")}
                </Link>
              </div>
              <p className="final-cta-note">
                <Icon name="check-circle" size={14} />
                {t("finalCtaNote")}
              </p>
            </div>
            <div className="final-cta-art" aria-hidden="true">
              <span className="final-cta-phone">
                <span className="final-cta-phone-notch" />
                <span className="final-cta-phone-bar" />
                <span className="final-cta-phone-bar short" />
                <span className="final-cta-phone-bar" />
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
