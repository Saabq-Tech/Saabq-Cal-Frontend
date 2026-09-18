import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import client, { endpoints } from "../api/client";
import { useLanguage } from "../context/LanguageContext";
import SEO from "../components/ui/SEO";
import Icon from "../components/common/Icon";
import { PageSkeleton } from "../components/ui/Skeleton";

export default function PrivacyPage() {
  const { t, lang } = useLanguage();
  const [privacy, setPrivacy] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    client
      .get(endpoints.privacy)
      .then((res) => {
        setPrivacy(res.data?.data || null);
      })
      .catch(() => {
        setPrivacy(null);
      })
      .finally(() => setLoading(false));
  }, [lang]);

  const formattedDate = privacy?.updated_at
    ? new Date(privacy.updated_at).toLocaleDateString(
        lang === "ar" ? "ar-EG" : "en-US",
        {
          year: "numeric",
          month: "long",
          day: "numeric",
        },
      )
    : null;

  return (
    <div className="main-content">
      <SEO pageKey="privacy" title={privacy?.title} />

      {/* Hero / Header Section */}
      <section
        className="section-sm"
        style={{
          background: "var(--surface)",
          borderBottom: "1px solid var(--border)",
          padding: "48px 0 40px",
        }}
      >
        <div className="container" style={{ maxWidth: 960 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: "0.88rem",
              color: "var(--text-secondary)",
              marginBottom: 16,
            }}
          >
            <Link
              to="/"
              style={{ color: "var(--text-secondary)", textDecoration: "none" }}
            >
              {t("home")}
            </Link>
            <span>/</span>
            <span style={{ color: "var(--primary)", fontWeight: 600 }}>
              {t("privacyPolicy") || "سياسة الخصوصية"}
            </span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: "var(--radius-lg, 14px)",
                background: "var(--primary-subtle)",
                color: "var(--primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Icon name="shield" size={28} />
            </div>
            <div style={{ flex: 1, minWidth: 260 }}>
              <h1
                style={{
                  fontSize: "2rem",
                  fontWeight: 800,
                  margin: 0,
                  color: "var(--text-primary)",
                }}
              >
                {privacy?.title || t("privacyPolicy") || "سياسة الخصوصية"}
              </h1>
              <p
                style={{
                  margin: "8px 0 0",
                  color: "var(--text-secondary)",
                  fontSize: "1rem",
                  lineHeight: 1.6,
                }}
              >
                {t("privacyPolicySubtitle") ||
                  "نلتزم بحماية خصوصيتك وبياناتك الشخصية بأعلى معايير الأمان والتشفير."}
              </p>
            </div>
          </div>

          {formattedDate && (
            <div
              style={{
                marginTop: 20,
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontSize: "0.82rem",
                color: "var(--text-muted)",
                background: "var(--bg-card)",
                padding: "6px 12px",
                borderRadius: "var(--radius-full, 999px)",
                border: "1px solid var(--border)",
              }}
            >
              <Icon name="clock" size={14} />
              <span>
                {t("lastUpdated") || "آخر تحديث:"} {formattedDate}
              </span>
            </div>
          )}
        </div>
      </section>

      {/* Main Content Area */}
      <section className="section-sm animate-page-enter">
        <div className="container" style={{ maxWidth: 960 }}>
          {loading ? (
            <PageSkeleton />
          ) : (
            <div className="legal-page-layout">
              {/* Privacy Highlights Bar */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: 16,
                  marginBottom: 32,
                }}
              >
                <div
                  className="card"
                  style={{
                    padding: "16px 20px",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    background: "var(--bg-card)",
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: "var(--primary-subtle)",
                      color: "var(--primary)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Icon name="lock" size={20} />
                  </div>
                  <div>
                    <strong
                      style={{
                        display: "block",
                        fontSize: "0.92rem",
                        color: "var(--text-primary)",
                      }}
                    >
                      {lang === "ar" ? "تشفير البيانات" : "Data Encryption"}
                    </strong>
                    <span
                      style={{
                        fontSize: "0.78rem",
                        color: "var(--text-secondary)",
                      }}
                    >
                      {lang === "ar"
                        ? "تشفير كامل لاتصالاتك وحجوزاتك"
                        : "End-to-end encrypted sessions"}
                    </span>
                  </div>
                </div>

                <div
                  className="card"
                  style={{
                    padding: "16px 20px",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    background: "var(--bg-card)",
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: "rgba(16, 185, 129, 0.12)",
                      color: "#10b981",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Icon name="check-circle" size={20} />
                  </div>
                  <div>
                    <strong
                      style={{
                        display: "block",
                        fontSize: "0.92rem",
                        color: "var(--text-primary)",
                      }}
                    >
                      {lang === "ar" ? "تحكم كامل" : "Full Control"}
                    </strong>
                    <span
                      style={{
                        fontSize: "0.78rem",
                        color: "var(--text-secondary)",
                      }}
                    >
                      {lang === "ar"
                        ? "حق تعديل أو حذف بياناتك"
                        : "Right to manage or delete data"}
                    </span>
                  </div>
                </div>

                <div
                  className="card"
                  style={{
                    padding: "16px 20px",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    background: "var(--bg-card)",
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: "rgba(245, 158, 11, 0.12)",
                      color: "#f59e0b",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Icon name="eye-off" size={20} />
                  </div>
                  <div>
                    <strong
                      style={{
                        display: "block",
                        fontSize: "0.92rem",
                        color: "var(--text-primary)",
                      }}
                    >
                      {lang === "ar" ? "عدم بيع البيانات" : "No Data Selling"}
                    </strong>
                    <span
                      style={{
                        fontSize: "0.78rem",
                        color: "var(--text-secondary)",
                      }}
                    >
                      {lang === "ar"
                        ? "لا نشارك بياناتك مع أطراف خارجية"
                        : "We never sell your personal data"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Document Content Card */}
              <div
                className="card"
                style={{
                  padding: "36px 32px",
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-lg, 16px)",
                  boxShadow: "var(--shadow-sm)",
                  lineHeight: 1.8,
                  fontSize: "1.02rem",
                  color: "var(--text-primary)",
                }}
              >
                {privacy?.content ? (
                  <div
                    className="legal-body-content"
                    style={{ whiteSpace: "pre-line" }}
                    dangerouslySetInnerHTML={{
                      __html:
                        typeof privacy.content === "string" &&
                        privacy.content.includes("<p>")
                          ? privacy.content
                          : privacy.content.replace(/\n/g, "<br />"),
                    }}
                  />
                ) : (
                  <div className="legal-body-content">
                    <p>
                      {lang === "ar"
                        ? "خصوصيتك تهمنا في منصة تقويم سابق. توضح هذه السياسة كيفية جمع معلوماتك الشخصية واستخدامها وحمايتها عند استخدام خدماتنا وجدولة مواعيدك."
                        : "Your privacy is of utmost importance to Saabq Cal. This policy outlines how we collect, use, and protect your personal information when you use our scheduling platform."}
                    </p>
                    <h3
                      style={{
                        marginTop: 24,
                        marginBottom: 12,
                        color: "var(--text-primary)",
                      }}
                    >
                      {lang === "ar"
                        ? "١. المعلومات التي نجمعها"
                        : "1. Information We Collect"}
                    </h3>
                    <p>
                      {lang === "ar"
                        ? "نقوم بجمع المعلومات التي تقدمها لنا مباشرة مثل اسمك، بريدك الإلكتروني، رقم هاتفك، وتفاصيل الحجوزات والمواعيد التي تنشئها."
                        : "We collect information you provide directly to us such as your name, email address, phone number, and details regarding appointments you create."}
                    </p>
                    <h3
                      style={{
                        marginTop: 24,
                        marginBottom: 12,
                        color: "var(--text-primary)",
                      }}
                    >
                      {lang === "ar"
                        ? "٢. كيف نستخدم معلوماتك"
                        : "2. How We Use Your Information"}
                    </h3>
                    <p>
                      {lang === "ar"
                        ? "نستخدم معلوماتك لتقديم وتأكيد وتنسيق المواعيد، وإرسال تنبيهات ورسائل التذكير، وتحسين تجربة استخدام المنصة."
                        : "We use your information to facilitate, confirm, and coordinate appointments, send notifications and reminders, and improve the platform."}
                    </p>
                    <h3
                      style={{
                        marginTop: 24,
                        marginBottom: 12,
                        color: "var(--text-primary)",
                      }}
                    >
                      {lang === "ar"
                        ? "٣. حماية البيانات والأمان"
                        : "3. Data Security & Protection"}
                    </h3>
                    <p>
                      {lang === "ar"
                        ? "نطبق تدابير تقنية وإدارية متقدمة تشمل التشفير والمصادقة متعددة العوامل لحماية بياناتك من الوصول غير المصرح به."
                        : "We implement advanced technical and organizational measures, including encryption and two-factor authentication, to safeguard your data."}
                    </p>
                  </div>
                )}
              </div>

              {/* Bottom Support Callout */}
              <div
                style={{
                  marginTop: 32,
                  padding: "24px 28px",
                  borderRadius: "var(--radius-lg, 16px)",
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 16,
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <h4
                    style={{
                      margin: 0,
                      fontSize: "1.05rem",
                      color: "var(--text-primary)",
                    }}
                  >
                    {t("haveQuestions") || "عندك استفسارات حول سياسة الخصوصية؟"}
                  </h4>
                  <p
                    style={{
                      margin: "4px 0 0",
                      fontSize: "0.88rem",
                      color: "var(--text-secondary)",
                    }}
                  >
                    {lang === "ar"
                      ? "فريق الدعم الفني جاهز لمساعدتك والإجابة على أي تساؤل يتعلق ببياناتك."
                      : "Our support team is always available to answer any data and privacy inquiries."}
                  </p>
                </div>
                <div style={{ display: "flex", gap: 12 }}>
                  <Link to="/terms" className="btn btn-outline btn-sm">
                    {t("termsOfService") || "شروط الخدمة"}
                  </Link>
                  <a
                    href="mailto:support@saabqcal.com"
                    className="btn btn-primary btn-sm"
                  >
                    {t("contactSupport") || "تواصل مع الدعم"}
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
