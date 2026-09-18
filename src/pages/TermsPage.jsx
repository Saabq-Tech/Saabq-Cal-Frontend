import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import client, { endpoints } from "../api/client";
import { useLanguage } from "../context/LanguageContext";
import SEO from "../components/ui/SEO";
import Icon from "../components/common/Icon";
import { PageSkeleton } from "../components/ui/Skeleton";

export default function TermsPage() {
  const { t, lang } = useLanguage();
  const [terms, setTerms] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    client
      .get(endpoints.terms)
      .then((res) => {
        setTerms(res.data?.data || null);
      })
      .catch(() => {
        setTerms(null);
      })
      .finally(() => setLoading(false));
  }, [lang]);

  const formattedDate = terms?.updated_at
    ? new Date(terms.updated_at).toLocaleDateString(
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
      <SEO pageKey="terms" title={terms?.title} />

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
              {t("termsOfService") || "شروط الخدمة"}
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
              <Icon name="file-text" size={28} />
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
                {terms?.title || t("termsOfService") || "شروط الخدمة"}
              </h1>
              <p
                style={{
                  margin: "8px 0 0",
                  color: "var(--text-secondary)",
                  fontSize: "1rem",
                  lineHeight: 1.6,
                }}
              >
                {t("termsOfServiceSubtitle") ||
                  "الشروط والأحكام التي تحكم استخدامك لمنصة تقويم سابق والخدمات المقدمة من خلالها."}
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
              {/* Terms Highlights Bar */}
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
                      {lang === "ar" ? "الاستخدام العادل" : "Fair Usage"}
                    </strong>
                    <span
                      style={{
                        fontSize: "0.78rem",
                        color: "var(--text-secondary)",
                      }}
                    >
                      {lang === "ar"
                        ? "التزام بالمعايير وسياسات الحجز"
                        : "Compliance with booking standards"}
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
                    <Icon name="shield" size={20} />
                  </div>
                  <div>
                    <strong
                      style={{
                        display: "block",
                        fontSize: "0.92rem",
                        color: "var(--text-primary)",
                      }}
                    >
                      {lang === "ar" ? "أمان الحساب" : "Account Security"}
                    </strong>
                    <span
                      style={{
                        fontSize: "0.78rem",
                        color: "var(--text-secondary)",
                      }}
                    >
                      {lang === "ar"
                        ? "مسؤولية الحفاظ على سرية بياناتك"
                        : "Responsibility for credentials"}
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
                      background: "rgba(99, 102, 241, 0.12)",
                      color: "#6366f1",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Icon name="calendar" size={20} />
                  </div>
                  <div>
                    <strong
                      style={{
                        display: "block",
                        fontSize: "0.92rem",
                        color: "var(--text-primary)",
                      }}
                    >
                      {lang === "ar"
                        ? "مرونة الإلغاء والتعديل"
                        : "Booking Policies"}
                    </strong>
                    <span
                      style={{
                        fontSize: "0.78rem",
                        color: "var(--text-secondary)",
                      }}
                    >
                      {lang === "ar"
                        ? "وفقاً لقواعد كل مساحة عمل"
                        : "Subject to workspace custom rules"}
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
                {terms?.content ? (
                  <div
                    className="legal-body-content"
                    style={{ whiteSpace: "pre-line" }}
                    dangerouslySetInnerHTML={{
                      __html:
                        typeof terms.content === "string" &&
                        terms.content.includes("<p>")
                          ? terms.content
                          : terms.content.replace(/\n/g, "<br />"),
                    }}
                  />
                ) : (
                  <div className="legal-body-content">
                    <p>
                      {lang === "ar"
                        ? "مرحباً بكم في تقويم سابق. باستخدامك للمنصة أو إنشاء حساب كعميل أو كعضو فريق، فإنك توافق على الالتزام بالشروط والأحكام التالية."
                        : "Welcome to Saabq Cal. By accessing or using our platform, creating a customer or team member account, you agree to comply with and be bound by the following terms and conditions."}
                    </p>
                    <h3
                      style={{
                        marginTop: 24,
                        marginBottom: 12,
                        color: "var(--text-primary)",
                      }}
                    >
                      {lang === "ar"
                        ? "١. قبول الشروط"
                        : "1. Acceptance of Terms"}
                    </h3>
                    <p>
                      {lang === "ar"
                        ? "يشكل استخدامك لخدمات تقويم سابق اتفاقية ملزمة قانونياً بينك وبين المنصة. إذا كنت لا توافق على هذه الشروط، يرجى عدم استخدام المنصة."
                        : "Your use of Saabq Cal services constitutes a legally binding agreement. If you do not agree with any of these terms, please do not use the service."}
                    </p>
                    <h3
                      style={{
                        marginTop: 24,
                        marginBottom: 12,
                        color: "var(--text-primary)",
                      }}
                    >
                      {lang === "ar"
                        ? "٢. الحسابات والمسؤوليات"
                        : "2. User Accounts & Responsibilities"}
                    </h3>
                    <p>
                      {lang === "ar"
                        ? "أنت مسؤول عن الحفاظ على سرية معلومات حسابك وكلمة المرور، وعن جميع الأنشطة والعمليات التي تتم من خلال حسابك."
                        : "You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account."}
                    </p>
                    <h3
                      style={{
                        marginTop: 24,
                        marginBottom: 12,
                        color: "var(--text-primary)",
                      }}
                    >
                      {lang === "ar"
                        ? "٣. سياسة الحجوزات والمدفوعات"
                        : "3. Bookings & Payments"}
                    </h3>
                    <p>
                      {lang === "ar"
                        ? "تخضع مواعيد الحجز وشروط الإلغاء أو الاسترداد للقواعد المحددة من قبل كل مساحة عمل ومقدم خدمة على حدة."
                        : "Appointment schedules, cancellation policies, and refunds are governed by the specific rules configured by each workspace provider."}
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
                    {t("haveQuestions") || "عندك استفسارات حول شروط الخدمة؟"}
                  </h4>
                  <p
                    style={{
                      margin: "4px 0 0",
                      fontSize: "0.88rem",
                      color: "var(--text-secondary)",
                    }}
                  >
                    {lang === "ar"
                      ? "فريق الدعم الفني والقانوني متاح لمساعدتك في أي استفسار."
                      : "Our customer support team is available to assist you with any questions."}
                  </p>
                </div>
                <div style={{ display: "flex", gap: 12 }}>
                  <Link to="/privacy" className="btn btn-outline btn-sm">
                    {t("privacyPolicy") || "سياسة الخصوصية"}
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
