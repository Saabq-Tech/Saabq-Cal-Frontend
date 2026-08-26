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

const FEATURE_ICONS = [
  <Icon key="calendar" name="calendar" size={24} />,
  <Icon key="zap" name="zap" size={24} />,
  <Icon key="bell" name="bell" size={24} />,
  <Icon key="bar-chart" name="bar-chart" size={24} />,
  <Icon key="shield" name="shield" size={24} />,
  <Icon key="globe" name="globe" size={24} />,
];

export default function Home() {
  const { t, lang } = useLanguage();
  const { isAuthenticated } = useAuth();

  const [banners, setBanners] = useState([]);
  const [features, setFeatures] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [about, setAbout] = useState(null);
  const [plans, setPlans] = useState([]);
  const [activeBanner, setActiveBanner] = useState(0);
  const [openFaq, setOpenFaq] = useState(null);
  const [loading, setLoading] = useState(true);

  const formatTranslatable = (val) => {
    if (!val) return "";
    if (typeof val === "string") return val;
    if (typeof val === "object") {
      return lang === "ar"
        ? val.ar || val.en || Object.values(val)[0] || ""
        : val.en || val.ar || Object.values(val)[0] || "";
    }
    return String(val);
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([
      client.get(endpoints.banners).catch(() => ({ data: { data: [] } })),
      client.get(endpoints.features).catch(() => ({ data: { data: [] } })),
      client.get(endpoints.faqs).catch(() => ({ data: { data: [] } })),
      client.get(endpoints.about).catch(() => ({ data: { data: null } })),
      client.get(endpoints.plans).catch(() => ({ data: { data: [] } })),
    ]).then(([bannersRes, featuresRes, faqsRes, aboutRes, plansRes]) => {
      setBanners(bannersRes.data.data || []);
      setFeatures(featuresRes.data.data || []);
      setFaqs(faqsRes.data.data || []);
      setAbout(aboutRes.data.data || null);
      setPlans(plansRes.data.data || []);
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

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Saabq Cal",
    url: "https://cal.saabq.com",
    description:
      lang === "ar"
        ? "منصة سابق كول لجدولة وإدارة المواعيد الذكية"
        : "Saabq Cal — Smart scheduling and appointment management platform",
    potentialAction: {
      "@type": "SearchAction",
      target: "https://cal.saabq.com/workspaces?search={search_term_string}",
      "query-input": "required name=search_term_string",
    },
  };

  const combinedJsonLd = faqJsonLd ? [websiteJsonLd, faqJsonLd] : websiteJsonLd;

  return (
    <main className="main-content">
      <SEO
        title={t("pageTitleHome")}
        description={
          lang === "ar"
            ? "منصة سابق كول لجدولة وإدارة المواعيد الذكية — احجز، أدِر، وأتمت مواعيد مساحة عملك بسهولة."
            : "Saabq Cal — Smart scheduling and appointment management platform. Book, manage, and automate your workspace appointments."
        }
        canonical="/"
        jsonLd={combinedJsonLd}
      />

      {/* Hero Section */}
      <section id="home" className="hero">
        <div className="container">
          <div className="hero-content animate-fade-in-up">
            <div className="hero-badge">
              <Icon name="custom-d3d330f2" size={14} />
              {t("heroBadge")}
            </div>
            <h1>
              {t("heroTitlePrefix")}
              <span>{t("heroTitleSpan")}</span>
            </h1>
            <p>{t("heroDescription")}</p>

            <div className="hero-actions" style={{ marginBottom: 40 }}>
              {!isAuthenticated && (
                <Link to="/register" className="btn btn-primary btn-lg">
                  {t("getStartedFree")}
                  <Icon
                    name="arrow-right"
                    size={16}
                    style={{
                      transform: lang === "ar" ? "rotate(180deg)" : "none",
                    }}
                  />
                </Link>
              )}
              <Link
                to="/workspaces"
                className="btn btn-accent btn-lg"
                style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
              >
                <Icon name="monitor" size={18} />
                {t("exploreWorkspaces")}
              </Link>
            </div>
          </div>
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
                        <LazyImage
                          src={imageUrl}
                          alt={banner.title || "Promotional banner"}
                          width={1200}
                          height={400}
                          style={{
                            width: "100%",
                            height: "auto",
                            objectFit: "cover",
                            borderRadius: "inherit",
                          }}
                        />
                      )}
                      <div className="banner-slide-content">
                        {banner.title && <h3>{banner.title}</h3>}
                        {subtitleText && <p>{subtitleText}</p>}
                        {banner.button_text && (
                          <a
                            href={banner.link || "#"}
                            className="btn btn-accent btn-sm"
                            style={{ width: "fit-content", marginTop: 12 }}
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

      {/* Social Proof & Trust Strip */}
      <section
        className="social-proof-strip"
        aria-label={lang === "ar" ? "إحصائيات الثقة" : "Trust statistics"}
      >
        <div className="container">
          <div className="social-proof-content">
            <div className="social-proof-badge">
              <span className="stat-number">5,000+</span>
              <span className="stat-label">{t("socialProofStats")}</span>
            </div>
            <div className="social-proof-logos">
              <div className="trust-item">
                <Icon
                  name="custom-d3d330f2"
                  size={20}
                  style={{ color: "var(--primary)" }}
                />
                <span>Google Meet Sync</span>
              </div>
              <div className="trust-item">
                <Icon
                  name="shield"
                  size={20}
                  style={{ color: "var(--secondary)" }}
                />
                <span>SSL 256-bit Encrypted</span>
              </div>
              <div className="trust-item">
                <Icon
                  name="clock"
                  size={20}
                  style={{ color: "var(--accent)" }}
                />
                <span>99.9% System Uptime</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="section-sm">
        <div className="container about-content">
          <div className="section-header">
            <h2>{about?.title || t("aboutTitle")}</h2>
            <div
              style={{
                width: 44,
                height: 4,
                background: "var(--primary)",
                margin: "12px auto 0",
                borderRadius: "var(--radius-full)",
              }}
            />
          </div>
          {loading ? (
            <div
              style={{
                maxWidth: 840,
                margin: "0 auto",
                display: "flex",
                flexDirection: "column",
                gap: 10,
                alignItems: "center",
              }}
            >
              <SkeletonLine width="80%" height={16} />
              <SkeletonLine width="60%" height={16} />
              <SkeletonLine width="70%" height={16} />
            </div>
          ) : (
            about && (
              <article
                className="about-body"
                style={{
                  maxWidth: 840,
                  margin: "0 auto",
                  textAlign: "center",
                  color: "var(--text-secondary)",
                  fontSize: "1.05rem",
                  lineHeight: 1.8,
                }}
                dangerouslySetInnerHTML={{
                  __html: about.body || about.content || "",
                }}
              />
            )
          )}
        </div>
      </section>

      {/* Decorative Section Separator */}
      <div className="container">
        <div className="section-separator" />
      </div>

      {/* Features Section */}
      <section
        id="features"
        className="section-sm"
        style={{ background: "var(--surface)" }}
      >
        <div className="container">
          <div className="section-header">
            <h2>{t("whyChooseUs")}</h2>
            <p>{t("whyChooseUsDesc")}</p>
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
                const isFlagship = i === 1;
                return (
                  <article
                    key={feature.id || i}
                    className={`card card-hover feature-card ${isFlagship ? "flagship-card" : ""}`}
                  >
                    {isFlagship && (
                      <span className="flagship-badge">
                        ★ {t("flagshipBadge")}
                      </span>
                    )}
                    <div className="card-icon">
                      {feature.icon_url ? (
                        <img
                          src={feature.icon_url}
                          alt=""
                          width={28}
                          height={28}
                          loading="lazy"
                        />
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
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="section-sm">
        <div className="container">
          <div className="section-header">
            <h2>{t("howItWorksTitle")}</h2>
            <div
              style={{
                width: 44,
                height: 4,
                background: "var(--primary)",
                margin: "12px auto 0",
                borderRadius: "var(--radius-full)",
              }}
            />
          </div>

          <div className="how-it-works-grid">
            <div className="step-card">
              <span className="step-number">1</span>
              <div className="step-icon">
                <Icon name="calendar" size={24} />
              </div>
              <h3>{t("step1Title")}</h3>
              <p>{t("step1Desc")}</p>
            </div>

            <div className="step-card">
              <span className="step-number">2</span>
              <div className="step-icon">
                <Icon name="credit-card" size={24} />
              </div>
              <h3>{t("step2Title")}</h3>
              <p>{t("step2Desc")}</p>
            </div>

            <div className="step-card">
              <span className="step-number">3</span>
              <div className="step-icon">
                <Icon name="video" size={24} />
              </div>
              <h3>{t("step3Title")}</h3>
              <p>{t("step3Desc")}</p>
            </div>

            <div className="step-card">
              <span className="step-number">4</span>
              <div className="step-icon">
                <Icon name="bell" size={24} />
              </div>
              <h3>{t("step4Title")}</h3>
              <p>{t("step4Desc")}</p>
            </div>
          </div>
        </div>
      </section>

      {/* What's Included Section */}
      <section className="section-sm" style={{ background: "var(--surface)" }}>
        <div className="container">
          <div className="why-choose-layout">
            <div className="why-choose-grid">
              <div className="why-badge-card">
                <div className="why-badge-icon">
                  <Icon name="video" size={24} />
                </div>
                <h4>{t("whyBadge1")}</h4>
              </div>

              <div className="why-badge-card">
                <div className="why-badge-icon">
                  <Icon name="shield" size={24} />
                </div>
                <h4>{t("whyBadge2")}</h4>
              </div>

              <div className="why-badge-card">
                <div className="why-badge-icon">
                  <Icon name="bell" size={24} />
                </div>
                <h4>{t("whyBadge3")}</h4>
              </div>

              <div className="why-badge-card">
                <div className="why-badge-icon">
                  <Icon name="monitor" size={24} />
                </div>
                <h4>{t("whyBadge4")}</h4>
              </div>
            </div>

            <div className="why-choose-content">
              <h2>{t("whatsIncludedTitle")}</h2>
              <p className="subtitle">{t("whatsIncludedSubtitle")}</p>

              <div className="why-choose-checklist">
                <div className="checklist-item">
                  <span className="checklist-icon">
                    <Icon name="check" size={12} />
                  </span>
                  <span>{t("whyCheck1")}</span>
                </div>
                <div className="checklist-item">
                  <span className="checklist-icon">
                    <Icon name="check" size={12} />
                  </span>
                  <span>{t("whyCheck2")}</span>
                </div>
                <div className="checklist-item">
                  <span className="checklist-icon">
                    <Icon name="check" size={12} />
                  </span>
                  <span>{t("whyCheck3")}</span>
                </div>
                <div className="checklist-item">
                  <span className="checklist-icon">
                    <Icon name="check" size={12} />
                  </span>
                  <span>{t("whyCheck4")}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="section-sm">
        <div className="container">
          <div className="section-header">
            <h2>{t("pricingTitle")}</h2>
            <p>{t("pricingSubtitle")}</p>
          </div>
          <div className="pricing-grid">
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
                  <SkeletonLine
                    width="50%"
                    height={32}
                    style={{ marginTop: 20 }}
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
            ) : plans.length > 0 ? (
              plans.map((plan, index) => {
                const planNameStr = formatTranslatable(plan.name);
                const isPopular =
                  index === 1 ||
                  planNameStr.toLowerCase().includes("pro") ||
                  (plan.type?.value || plan.type) === "FLAT";
                const planDesc = formatTranslatable(plan.description);
                const currencySymbol =
                  plan.currency_detail?.symbol_native ||
                  plan.currency_detail?.symbol ||
                  formatTranslatable(plan.currency_detail?.name) ||
                  plan.currency ||
                  (lang === "ar" ? "ر.س" : "SAR");

                return (
                  <article
                    key={plan.id}
                    className={`pricing-card ${isPopular ? "popular" : ""}`}
                  >
                    {isPopular && (
                      <span className="popular-badge">
                        {t("popularTag") || "الأكثر طلباً"}
                      </span>
                    )}
                    <h3>{planNameStr}</h3>
                    {planDesc && <p className="plan-desc">{planDesc}</p>}
                    <div className="plan-price">
                      <span className="amount">
                        {Number(plan.price) === 0 ? 0 : plan.price}
                      </span>
                      <span className="currency">{currencySymbol}</span>
                      <span className="period">
                        {plan.billing_interval === "yearly"
                          ? t("yearly") ||
                            (lang === "ar" ? "/ سنوياً" : "/ year")
                          : t("monthly") ||
                            (lang === "ar" ? "/ شهرياً" : "/ month")}
                      </span>
                    </div>
                    <ul className="plan-features">
                      <li>
                        ✓{" "}
                        {plan.max_members
                          ? `${t("members") || (lang === "ar" ? "أعضاء الفريق" : "Workspace Members")}: ${plan.max_members}`
                          : t("unlimitedTeamMembers") ||
                            (lang === "ar"
                              ? "أعضاء فريق غير محدودين"
                              : "Unlimited Team Members")}
                      </li>
                      <li>
                        ✓{" "}
                        {plan.max_services
                          ? `${t("services") || (lang === "ar" ? "الخدمات" : "Offered Services")}: ${plan.max_services}`
                          : t("unlimitedServices") ||
                            (lang === "ar"
                              ? "خدمات وجداول غير محدودة"
                              : "Unlimited Services & Schedules")}
                      </li>
                      <li>
                        ✓{" "}
                        {plan.max_appointments
                          ? `${t("appointments") || (lang === "ar" ? "الحجوزات" : "Bookings")}: ${plan.max_appointments}`
                          : t("unlimitedAppointments") ||
                            (lang === "ar"
                              ? "حجوزات عملاء غير محدودة"
                              : "Unlimited Bookings")}
                      </li>
                      {plan.max_customers && (
                        <li>
                          ✓{" "}
                          {t("customers") ||
                            (lang === "ar" ? "العملاء" : "Customers")}
                          : {plan.max_customers}
                        </li>
                      )}
                      {plan.capabilities &&
                        plan.capabilities.map((cap) => (
                          <li key={cap.id || cap.code}>
                            ✓ {formatTranslatable(cap.name) || cap.code}
                          </li>
                        ))}
                    </ul>
                    <Link
                      to="/register"
                      className={`btn ${isPopular ? "btn-primary" : "btn-secondary"} btn-block`}
                    >
                      {Number(plan.price) === 0
                        ? t("getStartedFree") ||
                          (lang === "ar" ? "ابدأ مجاناً" : "Get Started Free")
                        : t("getStarted") ||
                          (lang === "ar" ? "ابدأ الآن" : "Get Started")}
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
      </section>

      {/* FAQs Section */}
      <section className="section-sm" style={{ background: "var(--surface)" }}>
        <div className="container">
          <div className="section-header">
            <h2>{t("faqsTitle")}</h2>
            <p>{t("faqsDesc")}</p>
          </div>
          {loading ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 12,
                maxWidth: 800,
                margin: "0 auto",
              }}
            >
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
                    {faq.question}
                    <Icon name="chevron-down" />
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

      {/* CTA Section */}
      <section className="section-sm">
        <div className="container" style={{ textAlign: "center" }}>
          <h2 style={{ fontSize: "2rem", marginBottom: 12 }}>
            {t("readyToStart")}
          </h2>
          <p
            style={{
              color: "var(--text-secondary)",
              fontSize: "1.1rem",
              maxWidth: 500,
              margin: "0 auto 28px",
            }}
          >
            {t("readyToStartDesc")}
          </p>
          <div className="hero-actions">
            {!isAuthenticated && (
              <Link to="/register" className="btn btn-primary btn-lg">
                {t("createFreeAccount")}
              </Link>
            )}
            <Link
              to="/workspaces"
              className="btn btn-accent btn-lg"
              style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
            >
              <Icon name="monitor" size={18} />
              {t("exploreWorkspaces")}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
