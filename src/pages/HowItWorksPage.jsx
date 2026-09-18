import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import client, { endpoints } from "../api/client";
import { useLanguage } from "../context/LanguageContext";
import SEO from "../components/ui/SEO";
import Icon from "../components/common/Icon";

export default function HowItWorksPage() {
  const { t, lang } = useLanguage();
  const [faqs, setFaqs] = useState([]);
  const [activeTab, setActiveTab] = useState("members"); // 'members' | 'customers'
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => {
    client
      .get(endpoints.faqs)
      .then((res) => {
        setFaqs(res.data?.data || []);
      })
      .catch(() => {
        setFaqs([]);
      });
  }, [lang]);

  const memberSteps = [
    {
      num: 1,
      icon: "user-plus",
      title:
        lang === "ar"
          ? "١. إنشاء مساحة العمل وحساب الفريق"
          : "1. Create Workspace & Account",
      desc:
        lang === "ar"
          ? "أنشئ حسابك كعضو أو مدير، وحدد اسم وتصنيف مساحتك وشعارها وألوانها الخاصة في أقل من دقيقة."
          : "Sign up as a team member or owner, set your workspace name, category, logo, and brand colors.",
    },
    {
      num: 2,
      icon: "calendar",
      title:
        lang === "ar"
          ? "٢. تحديد الخدمات وجداول المواعيد"
          : "2. Configure Services & Schedules",
      desc:
        lang === "ar"
          ? "أضف خدماتك ومددها وأسعارها، وحدد أوقات عملك الأسبوعية وفترات الراحة والاستثناءات والعطلات."
          : "Add your services, duration, prices, and set your weekly working hours, breaks, and holidays.",
    },
    {
      num: 3,
      icon: "link",
      title:
        lang === "ar"
          ? "٣. مشاركة رابط الحجز المباشر"
          : "3. Share Your Custom Booking Link",
      desc:
        lang === "ar"
          ? "شارك رابط صفحتك العامة مع عملائك عبر مواقع التواصل أو موقعك أو رسائل واتساب وبريدك."
          : "Share your clean custom booking link with clients on social media, website, or messages.",
    },
    {
      num: 4,
      icon: "zap",
      title:
        lang === "ar"
          ? "٤. المزامنة التلقائية والتحصيل"
          : "4. Automatic Sync & Seamless Booking",
      desc:
        lang === "ar"
          ? "يتأكد الحجز فوراً مع مزامنة Google Calendar وتوليد روابط الاجتماعات وإرسال التنبيهات للطرفين."
          : "Appointments confirm instantly with two-way calendar sync, Meet links, and automated reminders.",
    },
  ];

  const customerSteps = [
    {
      num: 1,
      icon: "search",
      title:
        lang === "ar"
          ? "١. استكشاف مساحات العمل والأخصائيين"
          : "1. Discover Workspaces & Experts",
      desc:
        lang === "ar"
          ? "تصفح مقدمي الخدمات في مختلف المجالات (عيادات، استشارات، تدريب، صالونات) واطلع على تقييماتهم."
          : "Browse verified service providers across sectors (health, consulting, coaching, salons).",
    },
    {
      num: 2,
      icon: "clock",
      title:
        lang === "ar"
          ? "٢. اختيار الخدمة والوقت المناسب"
          : "2. Choose Service & Ideal Time Slot",
      desc:
        lang === "ar"
          ? "اختر الأخصائي والخدمة المطلوبة، واستعرض المواعيد المتاحة بدقة في منطقتك الزمنية."
          : "Select your preferred specialist, required service, and pick available slots in your timezone.",
    },
    {
      num: 3,
      icon: "credit-card",
      title:
        lang === "ar"
          ? "٣. تأكيد الحجز وإدخال التفاصيل"
          : "3. Confirm Details & Payment",
      desc:
        lang === "ar"
          ? "أدخل بيانات التواصل وأجب عن أسئلة مقدم الخدمة، وأتمم الدفع بأمان وسهولة."
          : "Enter your contact info, answer custom booking questions, and complete payment smoothly.",
    },
    {
      num: 4,
      icon: "bell",
      title:
        lang === "ar"
          ? "٤. التذكير والانضمام للموعد"
          : "4. Get Reminders & Join Session",
      desc:
        lang === "ar"
          ? "استلم تأكيد فوري بالبريد وتيليجرام مع رابط الاجتماع وتذكيرات ذكية قبل بدء الموعد."
          : "Receive instant email and chat confirmation with meeting link and smart countdown reminders.",
    },
  ];

  const stepsToDisplay = activeTab === "members" ? memberSteps : customerSteps;

  return (
    <div className="main-content">
      <SEO pageKey="howItWorks" />

      {/* Header / Hero */}
      <section
        className="section-sm"
        style={{
          background: "var(--surface)",
          borderBottom: "1px solid var(--border)",
          padding: "56px 0 48px",
          textAlign: "center",
        }}
      >
        <div className="container" style={{ maxWidth: 840 }}>
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
            <Icon name="help-circle" size={16} />
            <span>{t("navHowItWorks") || "كيف يعمل تقويم سابق؟"}</span>
          </div>

          <h1
            style={{
              fontSize: "2.3rem",
              fontWeight: 900,
              letterSpacing: "-0.02em",
              margin: "0 0 14px",
              color: "var(--text-primary)",
            }}
          >
            {lang === "ar"
              ? "تجربة جدولة سلسة في ٤ خطوات بسيطة"
              : "Effortless Smart Scheduling in 4 Simple Steps"}
          </h1>

          <p
            style={{
              fontSize: "1.08rem",
              color: "var(--text-secondary)",
              lineHeight: 1.7,
              margin: "0 auto 28px",
              maxWidth: 680,
            }}
          >
            {t("howItWorksPageSubtitle") ||
              "سواء كنت صاحب عمل تسعى لأتمتة مواعيدك أو عميلاً تبحث عن حجز موعد فوري، المنصة مصممة لتجربة سريعة وخالية من التعقيد."}
          </p>

          {/* User Type Tab Selector */}
          <div
            style={{
              display: "inline-flex",
              background: "var(--bg-card)",
              padding: 4,
              borderRadius: "var(--radius-full, 999px)",
              border: "1px solid var(--border)",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <button
              type="button"
              onClick={() => setActiveTab("members")}
              style={{
                border: "none",
                background:
                  activeTab === "members" ? "var(--primary)" : "transparent",
                color:
                  activeTab === "members" ? "#ffffff" : "var(--text-secondary)",
                padding: "10px 24px",
                borderRadius: "var(--radius-full, 999px)",
                fontSize: "0.92rem",
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              {t("forBusinessesAndTeams") ||
                (lang === "ar"
                  ? "لأصحاب الأعمال والفرق"
                  : "For Businesses & Teams")}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("customers")}
              style={{
                border: "none",
                background:
                  activeTab === "customers" ? "var(--primary)" : "transparent",
                color:
                  activeTab === "customers"
                    ? "#ffffff"
                    : "var(--text-secondary)",
                padding: "10px 24px",
                borderRadius: "var(--radius-full, 999px)",
                fontSize: "0.92rem",
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              {t("forCustomersAndIndividuals") ||
                (lang === "ar"
                  ? "للعملاء والأفراد"
                  : "For Customers & Clients")}
            </button>
          </div>
        </div>
      </section>

      {/* Steps Visual Layout */}
      <section className="section animate-page-enter">
        <div className="container" style={{ maxWidth: 1040 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: 24,
            }}
          >
            {stepsToDisplay.map((step) => (
              <div
                key={step.num}
                className="card card-hover"
                style={{
                  padding: "32px 24px",
                  borderRadius: "var(--radius-lg, 16px)",
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  display: "flex",
                  flexDirection: "column",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 20,
                  }}
                >
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 12,
                      background: "var(--primary-subtle)",
                      color: "var(--primary)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Icon name={step.icon} size={24} />
                  </div>
                  <span
                    style={{
                      fontSize: "1.2rem",
                      fontWeight: 900,
                      color: "var(--primary)",
                      opacity: 0.8,
                    }}
                  >
                    0{step.num}
                  </span>
                </div>

                <h3
                  style={{
                    fontSize: "1.15rem",
                    fontWeight: 700,
                    margin: "0 0 10px",
                    color: "var(--text-primary)",
                  }}
                >
                  {step.title}
                </h3>

                <p
                  style={{
                    fontSize: "0.92rem",
                    lineHeight: 1.6,
                    color: "var(--text-secondary)",
                    margin: 0,
                    flex: 1,
                  }}
                >
                  {step.desc}
                </p>
              </div>
            ))}
          </div>

          {/* Action Button for Active Tab */}
          <div style={{ textAlign: "center", marginTop: 44 }}>
            {activeTab === "members" ? (
              <Link to="/member/register" className="btn btn-primary btn-lg">
                {t("startFreeTrial") || "أنشئ مساحة عملك وابدأ الآن"}
              </Link>
            ) : (
              <Link to="/workspaces" className="btn btn-primary btn-lg">
                {t("exploreWorkspacesBtn") || "تصفح مساحات العمل واحجز موعدك"}
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Real FAQs Section */}
      {faqs.length > 0 && (
        <section
          className="section-sm"
          style={{
            background: "var(--surface)",
            borderTop: "1px solid var(--border)",
          }}
        >
          <div className="container" style={{ maxWidth: 880 }}>
            <div className="section-header" style={{ marginBottom: 36 }}>
              <h2>{t("faqsTitle") || "الأسئلة الأكثر شيوعاً"}</h2>
              <p style={{ margin: "6px auto 0" }}>
                {lang === "ar"
                  ? "إجابات شافية لأبرز الأسئلة حول استخدام وخصائص تقويم سابق."
                  : "Answers to common questions about using Saabq Cal."}
              </p>
            </div>

            <div
              className="faqs-list"
              style={{ display: "flex", flexDirection: "column", gap: 12 }}
            >
              {faqs.map((faq, index) => {
                const isOpen = openFaq === index;
                return (
                  <div
                    key={faq.id || index}
                    className="card"
                    style={{
                      padding: "18px 24px",
                      background: "var(--bg-card)",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--radius-md, 12px)",
                      cursor: "pointer",
                    }}
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 12,
                      }}
                    >
                      <h4
                        style={{
                          margin: 0,
                          fontSize: "1.02rem",
                          fontWeight: 700,
                          color: "var(--text-primary)",
                        }}
                      >
                        {faq.question}
                      </h4>
                      <Icon
                        name="chevron-down"
                        size={18}
                        style={{
                          transform: isOpen ? "rotate(180deg)" : "none",
                          transition: "transform 0.2s ease",
                          color: "var(--text-secondary)",
                          flexShrink: 0,
                        }}
                      />
                    </div>
                    {isOpen && (
                      <p
                        style={{
                          margin: "12px 0 0",
                          fontSize: "0.94rem",
                          lineHeight: 1.7,
                          color: "var(--text-secondary)",
                          borderTop: "1px solid var(--border)",
                          paddingTop: 12,
                        }}
                      >
                        {faq.answer}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
