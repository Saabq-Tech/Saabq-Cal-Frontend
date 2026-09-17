import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import client, { endpoints } from "../api/client";
import { useLanguage } from "../context/LanguageContext";
import SEO from "../components/ui/SEO";
import Icon from "../components/common/Icon";
import { SkeletonLine, SkeletonCircle } from "../components/ui/Skeleton";

const DEFAULT_FEATURE_ICONS = [
  "calendar",
  "zap",
  "bell",
  "shield",
  "globe",
  "credit-card",
  "users",
  "bar-chart",
];

export default function FeaturesPage() {
  const { t, lang } = useLanguage();
  const [features, setFeatures] = useState([]);
  const [capabilities, setCapabilities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = t("pageTitleFeatures") || "المميزات والقدرات — تقويم سابق";
  }, [t]);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      client.get(endpoints.features).catch(() => ({ data: { data: [] } })),
      client.get(endpoints.capabilities).catch(() => ({ data: { data: [] } })),
    ])
      .then(([featuresRes, capabilitiesRes]) => {
        setFeatures(featuresRes.data?.data || []);
        setCapabilities(capabilitiesRes.data?.data || []);
      })
      .finally(() => setLoading(false));
  }, [lang]);

  return (
    <div className="main-content">
      <SEO
        title={t("pageTitleFeatures") || "المميزات والقدرات — تقويم سابق"}
        description={
          t("featuresPageSubtitle") ||
          "اكتشف جميع الأدوات والمميزات الذكية التي تمكّنك من إدارة المواعيد وتنمية أعمالك."
        }
      />

      {/* Hero Section */}
      <section
        className="section-sm"
        style={{
          background: "var(--surface)",
          borderBottom: "1px solid var(--border)",
          padding: "56px 0 48px",
          textAlign: "center",
        }}
      >
        <div className="container" style={{ maxWidth: 880 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 16px",
              borderRadius: "var(--radius-full, 999px)",
              background: "var(--primary-subtle)",
              color: "var(--primary)",
              fontSize: "0.85rem",
              fontWeight: 700,
              marginBottom: 16,
            }}
          >
            <Icon name="sparkles" size={16} />
            <span>{t("exploreAllFeatures") || "مميزات تقويم سابق"}</span>
          </div>

          <h1
            style={{
              fontSize: "2.4rem",
              fontWeight: 900,
              letterSpacing: "-0.02em",
              margin: "0 0 16px",
              color: "var(--text-primary)",
              lineHeight: 1.25,
            }}
          >
            {lang === "ar"
              ? "كل ما تحتاجه لإدارة المواعيد باحترافية وسلاسة"
              : "Everything You Need for Seamless Smart Scheduling"}
          </h1>

          <p
            style={{
              fontSize: "1.1rem",
              color: "var(--text-secondary)",
              lineHeight: 1.7,
              margin: "0 auto 28px",
              maxWidth: 720,
            }}
          >
            {t("featuresPageSubtitle") ||
              "منظومة متكاملة لجدولة المواعيد، مزامنة التقويمات، تحصيل المدفوعات، وإرسال التنبيهات التلقائية لعملائك وفريقك."}
          </p>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 14,
              flexWrap: "wrap",
            }}
          >
            <Link to="/member/register" className="btn btn-primary btn-lg">
              {t("startFreeTrial") || "ابدأ مجاناً الآن"}
            </Link>
            <Link to="/workspaces" className="btn btn-outline btn-lg">
              {t("exploreWorkspacesBtn") || "استكشف مساحات العمل"}
            </Link>
          </div>
        </div>
      </section>

      {/* Main Features Grid */}
      <section className="section animate-page-enter">
        <div className="container">
          <div className="section-header" style={{ marginBottom: 40 }}>
            <h2>
              {t("featuresTitleNew") ||
                (lang === "ar"
                  ? "المميزات الأساسية للمنصة"
                  : "Core Platform Features")}
            </h2>
            <p style={{ maxWidth: 640, margin: "8px auto 0" }}>
              {lang === "ar"
                ? "مجموعة أدوات مصممة خصيصاً لتوفير وقتك وزيادة نسبة حضور العملاء لمواعيدهم."
                : "Designed to eliminate scheduling friction and maximize attendance rates."}
            </p>
          </div>

          {loading ? (
            <div className="features-grid">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="card feature-card"
                  style={{ padding: 28 }}
                >
                  <SkeletonCircle size={44} />
                  <SkeletonLine
                    width="60%"
                    height={20}
                    style={{ marginTop: 18 }}
                  />
                  <SkeletonLine
                    width="90%"
                    height={14}
                    style={{ marginTop: 10 }}
                  />
                  <SkeletonLine
                    width="75%"
                    height={14}
                    style={{ marginTop: 6 }}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="features-grid">
              {features.length > 0
                ? features.map((feature, idx) => {
                    const fallbackIcon =
                      DEFAULT_FEATURE_ICONS[idx % DEFAULT_FEATURE_ICONS.length];
                    return (
                      <article
                        key={feature.id || idx}
                        className="card card-hover feature-card"
                        style={{
                          padding: "32px 28px",
                          display: "flex",
                          flexDirection: "column",
                          borderRadius: "var(--radius-lg, 16px)",
                          background: "var(--bg-card)",
                          border: "1px solid var(--border)",
                        }}
                      >
                        <div
                          className="card-icon"
                          style={{
                            width: 52,
                            height: 52,
                            borderRadius: "var(--radius-md, 12px)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background: "var(--primary-subtle)",
                            color: "var(--primary)",
                            marginBottom: 20,
                          }}
                        >
                          {feature.image ? (
                            <img
                              src={feature.image}
                              alt=""
                              width={32}
                              height={32}
                              loading="lazy"
                              style={{ objectFit: "contain" }}
                            />
                          ) : (
                            <Icon
                              name={feature.icon || fallbackIcon}
                              size={26}
                            />
                          )}
                        </div>

                        <h3
                          style={{
                            fontSize: "1.25rem",
                            fontWeight: 700,
                            margin: "0 0 10px",
                            color: "var(--text-primary)",
                          }}
                        >
                          {feature.title}
                        </h3>

                        <p
                          style={{
                            fontSize: "0.95rem",
                            lineHeight: 1.65,
                            color: "var(--text-secondary)",
                            margin: 0,
                            flex: 1,
                          }}
                        >
                          {feature.description}
                        </p>
                      </article>
                    );
                  })
                : /* Fallback cards if no features in DB yet */
                  [
                    {
                      icon: "calendar",
                      title:
                        lang === "ar"
                          ? "جدولة مواعيد فورية وذكية"
                          : "Instant Smart Booking",
                      desc:
                        lang === "ar"
                          ? "صفحة حجز عامة مخصصة باسم ونطاق عملك لعرض خدماتك ومواعيدك المتاحة على مدار الساعة."
                          : "Custom public booking pages showcasing real-time availability 24/7.",
                    },
                    {
                      icon: "globe",
                      title:
                        lang === "ar"
                          ? "مزامنة Google Calendar و Meet"
                          : "Google Calendar & Meet Sync",
                      desc:
                        lang === "ar"
                          ? "إنشاء روابط اجتماعات فيديو تلقائياً وإضافتها لتقويمك وتقويم العميل لحظة تأكيد الحجز."
                          : "Automatic video meeting links and real-time two-way calendar sync.",
                    },
                    {
                      icon: "bell",
                      title:
                        lang === "ar"
                          ? "تنبيهات ورسائل تذكير تلقائية"
                          : "Automated Notifications",
                      desc:
                        lang === "ar"
                          ? "رسائل تذكير عبر البريد وتيليجرام وواتساب لتقليل نسبة التخلف عن الحضور وضمان التواصل."
                          : "Email, Telegram and WhatsApp notifications to minimize no-shows.",
                    },
                    {
                      icon: "credit-card",
                      title:
                        lang === "ar"
                          ? "إدارة المدفوعات والاشتراكات"
                          : "Payments & Wallet",
                      desc:
                        lang === "ar"
                          ? "تحصيل رسوم الخدمات أونلاين، رفع إيصالات التحويل البنكي، ومتابعة الفواتير بكل دقة."
                          : "Collect online fees, verify bank transfers, and manage invoices smoothly.",
                    },
                    {
                      icon: "users",
                      title:
                        lang === "ar"
                          ? "إدارة فريق العمل والأدوار"
                          : "Team Members & Permissions",
                      desc:
                        lang === "ar"
                          ? "إضافة موظفين، وتخصيص جداول دوام لكل أخصائي، ومنح صلاحيات دقيقة حسب المهام."
                          : "Add team members, assign custom schedules, and grant role-based permissions.",
                    },
                    {
                      icon: "shield",
                      title:
                        lang === "ar"
                          ? "حماية متقدمة ومفاتيح مرور"
                          : "Security & Passkeys (WebAuthn)",
                      desc:
                        lang === "ar"
                          ? "دعم تسجيل الدخول البيومتري بالبصمة (Passkeys) والتحقق بخطوتين لحماية بيانات مساحتك."
                          : "Biometric Passkeys and 2FA to guarantee enterprise-grade security.",
                    },
                  ].map((item, i) => (
                    <article
                      key={i}
                      className="card card-hover feature-card"
                      style={{
                        padding: "32px 28px",
                        borderRadius: "var(--radius-lg, 16px)",
                        background: "var(--bg-card)",
                        border: "1px solid var(--border)",
                      }}
                    >
                      <div
                        className="card-icon"
                        style={{
                          width: 52,
                          height: 52,
                          borderRadius: 12,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: "var(--primary-subtle)",
                          color: "var(--primary)",
                          marginBottom: 20,
                        }}
                      >
                        <Icon name={item.icon} size={26} />
                      </div>
                      <h3
                        style={{
                          fontSize: "1.25rem",
                          fontWeight: 700,
                          margin: "0 0 10px",
                          color: "var(--text-primary)",
                        }}
                      >
                        {item.title}
                      </h3>
                      <p
                        style={{
                          fontSize: "0.95rem",
                          lineHeight: 1.65,
                          color: "var(--text-secondary)",
                          margin: 0,
                        }}
                      >
                        {item.desc}
                      </p>
                    </article>
                  ))}
            </div>
          )}
        </div>
      </section>

      {/* Capabilities Section */}
      {capabilities.length > 0 && (
        <section
          className="section-sm"
          style={{
            background: "var(--surface)",
            borderTop: "1px solid var(--border)",
          }}
        >
          <div className="container">
            <div className="section-header" style={{ marginBottom: 36 }}>
              <h2>{t("capabilitiesTitle") || "القدرات والتكاملات التقنية"}</h2>
              <p style={{ maxWidth: 640, margin: "8px auto 0" }}>
                {lang === "ar"
                  ? "مجموعة شاملة من القدرات المدمجة لتوسيع وظائف مساحة عملك وربطها بالأنظمة الخارجية."
                  : "Comprehensive built-in capabilities to extend your workspace functionality."}
              </p>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: 20,
              }}
            >
              {capabilities.map((cap) => (
                <div
                  key={cap.id}
                  className="card"
                  style={{
                    padding: "20px 24px",
                    background: "var(--bg-card)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-md, 12px)",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 14,
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      background: "rgba(16, 185, 129, 0.12)",
                      color: "#10b981",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      marginTop: 2,
                    }}
                  >
                    <Icon name="check" size={18} />
                  </div>
                  <div>
                    <h4
                      style={{
                        margin: "0 0 6px",
                        fontSize: "1.05rem",
                        color: "var(--text-primary)",
                      }}
                    >
                      {cap.name}
                    </h4>
                    {cap.description && (
                      <p
                        style={{
                          margin: 0,
                          fontSize: "0.88rem",
                          color: "var(--text-secondary)",
                          lineHeight: 1.5,
                        }}
                      >
                        {cap.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Call to Action Banner */}
      <section className="section-sm" style={{ paddingBottom: 64 }}>
        <div className="container">
          <div
            style={{
              padding: "48px 36px",
              borderRadius: "var(--radius-xl, 24px)",
              background: "var(--primary)",
              color: "#ffffff",
              textAlign: "center",
              boxShadow: "var(--shadow-lg)",
            }}
          >
            <h2
              style={{
                fontSize: "2rem",
                fontWeight: 800,
                margin: "0 0 12px",
                color: "#ffffff",
              }}
            >
              {lang === "ar"
                ? "جاهز لتنظيم مواعيدك ونقل عملك لمستوى أعلى؟"
                : "Ready to Transform Your Appointment Experience?"}
            </h2>
            <p
              style={{
                fontSize: "1.05rem",
                opacity: 0.9,
                maxWidth: 600,
                margin: "0 auto 28px",
                lineHeight: 1.6,
              }}
            >
              {lang === "ar"
                ? "سجل الآن مجاناً وابدأ استقبال حجوزات عملائك وتنظيم جدول فريقك في دقائق معدودة."
                : "Sign up today for free and start receiving client bookings in just a few minutes."}
            </p>
            <div
              style={{
                display: "flex",
                gap: 14,
                justifyContent: "center",
                flexWrap: "wrap",
              }}
            >
              <Link
                to="/member/register"
                className="btn btn-lg"
                style={{
                  background: "#ffffff",
                  color: "var(--primary)",
                  fontWeight: 700,
                  boxShadow: "0 4px 14px rgba(0,0,0,0.15)",
                }}
              >
                {t("startFreeTrial") || "أنشئ مساحة عملك مجاناً"}
              </Link>
              <Link
                to="/customer/register"
                className="btn btn-lg"
                style={{
                  background: "rgba(255, 255, 255, 0.15)",
                  color: "#ffffff",
                  borderColor: "rgba(255, 255, 255, 0.3)",
                  backdropFilter: "blur(4px)",
                }}
              >
                {lang === "ar" ? "تسجيل حساب عميل" : "Sign Up as Customer"}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
