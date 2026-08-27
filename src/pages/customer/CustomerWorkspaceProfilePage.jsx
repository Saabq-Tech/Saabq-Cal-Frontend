import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import client, { endpoints } from "../../api/client";
import { useLanguage } from "../../context/LanguageContext";
import { useToast } from "../../context/ToastContext";
import SEO from "../../components/ui/SEO";
import LazyImage from "../../components/ui/LazyImage";
import {
  ProfileSkeleton,
  ServiceCardSkeleton,
} from "../../components/ui/Skeleton";
import Icon from "../../components/common/Icon";
import { formatCurrency } from "../../utils/currency";
import { stripHtml } from "../../utils/htmlUtils";

export default function WorkspaceProfilePage() {
  const { idOrSlug } = useParams();
  const { t, isRTL } = useLanguage();
  const toast = useToast();

  const [workspace, setWorkspace] = useState(null);
  const [services, setServices] = useState([]);
  const [specialistRoles, setSpecialistRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [servicesLoading, setServicesLoading] = useState(true);

  // Search, FAQ & Scroll Navigation states
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [activeSection, setActiveSection] = useState("services");
  const [lightboxIndex, setLightboxIndex] = useState(null);

  const getTranslatableText = useCallback(
    (val) => {
      if (!val) return "";
      if (typeof val === "string") return val;
      if (typeof val === "object") {
        const text = isRTL
          ? val.ar ||
            val.ar_EG ||
            val.en ||
            Object.values(val).find(
              (v) => typeof v === "string" && v.trim() !== "",
            ) ||
            ""
          : val.en ||
            val.ar ||
            val.ar_EG ||
            Object.values(val).find(
              (v) => typeof v === "string" && v.trim() !== "",
            ) ||
            "";
        if (typeof text === "string") return text;
        if (text && typeof text === "object") return getTranslatableText(text);
      }
      return String(val);
    },
    [isRTL],
  );

  // Fetch workspace detail, services & specialists
  useEffect(() => {
    if (!idOrSlug) return;
    setLoading(true);
    setServicesLoading(true);
    Promise.all([
      client.get(endpoints.publicWorkspaceDetail(idOrSlug)),
      client
        .get(endpoints.publicWorkspaceServices(idOrSlug))
        .catch(() => ({ data: { data: [] } })),
      client
        .get(endpoints.publicWorkspaceSpecialists(idOrSlug))
        .catch(() => ({ data: { data: [] } })),
    ])
      .then(([wsRes, srvRes, specRes]) => {
        setWorkspace(wsRes.data?.data || null);
        setServices(srvRes.data?.data || []);
        setSpecialistRoles(specRes.data?.data || []);
      })
      .catch(() => {
        setWorkspace(null);
        setServices([]);
        setSpecialistRoles([]);
      })
      .finally(() => {
        setLoading(false);
        setServicesLoading(false);
      });
  }, [idOrSlug]);

  // Apply workspace custom colors to CSS variables dynamically
  useEffect(() => {
    if (workspace) {
      if (workspace.primary_color) {
        document.documentElement.style.setProperty(
          "--primary",
          workspace.primary_color,
        );
        document.documentElement.style.setProperty(
          "--primary-hover",
          workspace.hover_color || workspace.primary_color,
        );
      }
      if (workspace.secondary_color) {
        document.documentElement.style.setProperty(
          "--secondary",
          workspace.secondary_color,
        );
      }
      return () => {
        document.documentElement.style.removeProperty("--primary");
        document.documentElement.style.removeProperty("--primary-hover");
        document.documentElement.style.removeProperty("--secondary");
      };
    }
  }, [workspace]);

  // Update active section on scroll
  useEffect(() => {
    const handleScroll = () => {
      const sections = [
        "services",
        "specialists",
        "portfolio",
        "testimonials",
        "about",
        "location",
        "faq",
      ];
      const scrollPosition = window.scrollY + 200;

      for (const sectionId of sections) {
        const el = document.getElementById(sectionId);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(sectionId);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Smooth scroll helper
  const scrollToSection = useCallback((sectionId) => {
    const el = document.getElementById(sectionId);
    if (el) {
      const yOffset = -130;
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
      setActiveSection(sectionId);
    }
  }, []);

  // Copy Workspace URL to clipboard
  const handleShare = useCallback(() => {
    const url = window.location.href;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(() => {
        toast.success(
          isRTL
            ? "تم نسخ رابط مساحة العمل بنجاح!"
            : "Workspace link copied to clipboard!",
        );
      });
    } else {
      toast.info(url);
    }
  }, [toast, isRTL]);

  // Filtered Services based on search term
  const filteredServices = useMemo(() => {
    if (!searchTerm.trim()) return services;
    const term = searchTerm.toLowerCase();
    return services.filter((srv) => {
      const name = getTranslatableText(srv.name).toLowerCase();
      const desc = getTranslatableText(
        srv.short_description || srv.description,
      ).toLowerCase();
      return name.includes(term) || desc.includes(term);
    });
  }, [services, searchTerm, getTranslatableText]);

  // Calculate total specialists count
  const totalSpecialistsCount = useMemo(() => {
    return specialistRoles.reduce(
      (acc, role) => acc + (role.members?.length || 0),
      0,
    );
  }, [specialistRoles]);

  // Normalize gallery items — accepts legacy plain-string entries or { url, caption } objects
  const galleryItems = useMemo(() => {
    const raw = Array.isArray(workspace?.gallery_urls)
      ? workspace.gallery_urls
      : [];
    return raw
      .map((item) =>
        typeof item === "string" ? { url: item, caption: "" } : item,
      )
      .filter((item) => item && item.url);
  }, [workspace]);

  // Real, attributed client testimonials only — never fabricated
  const testimonials = useMemo(() => {
    const raw = Array.isArray(workspace?.testimonials)
      ? workspace.testimonials
      : [];
    return raw.filter((item) => item && item.client_name && item.quote);
  }, [workspace]);

  const averageRating = useMemo(() => {
    const rated = testimonials.filter((t) => t.rating > 0);
    if (rated.length === 0) return null;
    return rated.reduce((acc, t) => acc + t.rating, 0) / rated.length;
  }, [testimonials]);

  if (loading) {
    return (
      <main className="main-content">
        <ProfileSkeleton />
      </main>
    );
  }

  if (!workspace) {
    return (
      <main className="main-content">
        <div
          className="container"
          style={{ padding: "80px 20px", textAlign: "center" }}
        >
          <div
            className="card"
            style={{
              padding: 48,
              maxWidth: 520,
              margin: "0 auto",
              borderRadius: 24,
            }}
          >
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: "50%",
                background: "rgba(239, 68, 68, 0.1)",
                color: "#ef4444",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 20,
              }}
            >
              <Icon name="x" size={36} />
            </div>
            <h1 style={{ fontSize: "1.5rem", marginBottom: 12 }}>
              {t("noWorkspacesFound") ||
                (isRTL ? "مساحة العمل غير موجودة" : "Workspace Not Found")}
            </h1>
            <p style={{ color: "var(--text-secondary)", marginBottom: 24 }}>
              {isRTL
                ? "عذراً، مساحة العمل المطلوب عرضها غير متاحة أو تم تعطيلها مؤقتاً."
                : "Sorry, the requested workspace is not available or has been temporarily disabled."}
            </p>
            <Link to="/workspaces" className="btn btn-primary btn-lg">
              <Icon name="globe" size={18} />
              <span>
                {t("exploreWorkspaces") ||
                  (isRTL ? "استكشاف مساحات العمل" : "Explore Workspaces")}
              </span>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const primaryColor = workspace.primary_color || "var(--primary, #0a9099)";
  const secondaryColor =
    workspace.secondary_color || "var(--secondary, #3b82f6)";
  const initial = workspace.name ? workspace.name.charAt(0).toUpperCase() : "W";

  // Formatted social links array
  const rawLinks = workspace.social_links;
  let linksList = [];
  if (Array.isArray(rawLinks)) {
    linksList = rawLinks;
  } else if (rawLinks && typeof rawLinks === "object") {
    linksList = Object.entries(rawLinks).map(([k, v]) => {
      if (v && typeof v === "object") {
        return {
          platform: v.platform || k,
          url: v.url || v.link || String(v),
        };
      }
      return { platform: k, url: v };
    });
  }
  const validSocialLinks = linksList.filter((item) => {
    const url = typeof item === "string" ? item : item?.url;
    return Boolean(url && typeof url === "string" && url.trim() !== "");
  });

  const PLATFORM_CONFIG = {
    website: {
      label: isRTL ? "الموقع" : "Website",
      icon: <Icon name="globe" size={15} />,
    },
    x: { label: "X", icon: <Icon name="x-social" size={14} /> },
    twitter: { label: "Twitter", icon: <Icon name="twitter" size={14} /> },
    linkedin: { label: "LinkedIn", icon: <Icon name="linkedin" size={14} /> },
    instagram: {
      label: "Instagram",
      icon: <Icon name="instagram" size={14} />,
    },
    facebook: { label: "Facebook", icon: <Icon name="facebook" size={14} /> },
    youtube: { label: "YouTube", icon: <Icon name="youtube" size={14} /> },
    tiktok: { label: "TikTok", icon: <Icon name="tiktok" size={14} /> },
    whatsapp: { label: "WhatsApp", icon: <Icon name="whatsapp" size={14} /> },
  };

  // In-page navigation pills — only include sections that actually have content
  const navSections = [
    { id: "services", label: isRTL ? "الخدمات" : "Services" },
    ...(specialistRoles.length > 0
      ? [{ id: "specialists", label: isRTL ? "الفريق" : "Team" }]
      : []),
    ...(galleryItems.length > 0
      ? [{ id: "portfolio", label: isRTL ? "معرض الأعمال" : "Portfolio" }]
      : []),
    ...(testimonials.length > 0
      ? [{ id: "testimonials", label: isRTL ? "آراء العملاء" : "Reviews" }]
      : []),
    { id: "faq", label: isRTL ? "الأسئلة الشائعة" : "FAQ" },
  ];

  // Structured Data (JSON-LD)
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: getTranslatableText(workspace.name),
    url: `https://cal.saabq.com/workspaces/${workspace.slug}`,
    ...(workspace.booking_short_intro && {
      description: getTranslatableText(workspace.booking_short_intro),
    }),
    ...(workspace.logo_url && { image: workspace.logo_url }),
    ...(workspace.email && { email: workspace.email }),
    ...(workspace.phone && { telephone: workspace.phone }),
    ...(workspace.website && { sameAs: [workspace.website] }),
    ...(workspace.address && {
      address: {
        "@type": "PostalAddress",
        streetAddress: workspace.address,
        ...(workspace.country?.name && {
          addressCountry: workspace.country.name,
        }),
        ...(workspace.city?.name && { addressLocality: workspace.city.name }),
      },
    }),
    ...(testimonials.length > 0 &&
      averageRating && {
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: averageRating.toFixed(1),
          reviewCount: testimonials.length,
        },
        review: testimonials.slice(0, 5).map((item) => ({
          "@type": "Review",
          author: { "@type": "Person", name: item.client_name },
          reviewBody: item.quote,
          ...(item.rating && {
            reviewRating: {
              "@type": "Rating",
              ratingValue: item.rating,
              bestRating: 5,
            },
          }),
        })),
      }),
  };

  const faqItems = [
    {
      q: isRTL ? "كيف يتم تأكيد حجز الموعد؟" : "How is my booking confirmed?",
      a: workspace.auto_confirm_appointments
        ? isRTL
          ? "يتم تأكيد الحجز فورياً وتلقائياً فور إرسال الطلب، وسوف تصلك تفاصيل الموعد مباشرة."
          : "Bookings are automatically and instantly confirmed upon submission, and full details will be sent to you immediately."
        : isRTL
          ? "يتم مراجعة الطلب من فريق مساحة العمل وتأكيده خلال وقت قصير مع إرسال إشعار التأكيد."
          : "Your request will be reviewed by the workspace team and confirmed shortly with a confirmation notification.",
    },
    {
      q: isRTL
        ? "ما هو أقصى حد متاح للحجز المسبق؟"
        : "How far in advance can I book?",
      a: workspace.maximum_booking_days
        ? isRTL
          ? `يمكنك حجز المواعيد مقدماً حتى ${workspace.maximum_booking_days} يوماً من اليوم.`
          : `You can book appointments up to ${workspace.maximum_booking_days} days in advance.`
        : isRTL
          ? "الحجز متاح للأيام القادمة حسب جدول التوفر المعروض."
          : "Booking is available according to the published schedule.",
    },
    {
      q: isRTL
        ? "هل يمكنني تعديل أو إلغاء موعدي لاحقاً؟"
        : "Can I reschedule or cancel my appointment?",
      a: isRTL
        ? "نعم، يمكنك إدارة مواعيدك وتعديلها أو إلغائها عبر لوحة تحكم حسابك أو من خلال رابط الموعد المرسل إليك."
        : "Yes, you can manage, reschedule, or cancel your appointment via your customer dashboard or the unique link provided.",
    },
    {
      q: isRTL
        ? "هل يتطلب الحجز إنشاء حساب؟"
        : "Do I need an account to complete booking?",
      a: isRTL
        ? "يمكنك الحجز بسهولة كزائر أو تسجيل الدخول لمتابعة كافة حجوزاتك وإدارتها من مكان واحد."
        : "You can easily complete booking as a guest or sign in to track and manage all your appointments in one place.",
    },
  ];

  return (
    <main
      className="main-content"
      style={{ background: "var(--background)", minHeight: "100vh" }}
    >
      <SEO
        title={getTranslatableText(workspace.name)}
        description={stripHtml(
          getTranslatableText(workspace.booking_short_intro) ||
            getTranslatableText(workspace.description) ||
            (isRTL
              ? `احجز أفضل الخدمات والمواعيد لدى ${getTranslatableText(workspace.name)}`
              : `Book top services and appointments at ${getTranslatableText(workspace.name)}`),
        )}
        canonical={`/workspaces/${workspace.slug}`}
        ogType="business.business"
        ogImage={workspace.logo_url || workspace.cover_url}
        jsonLd={[jsonLd]}
      />

      {/* Hero Cover Banner — bold gradient mesh built from the workspace's own brand colors */}
      <div
        className="workspace-landing-hero"
        style={{
          position: "relative",
          minHeight: 420,
          overflow: "hidden",
          background: workspace.cover_url
            ? `url(${workspace.cover_url}) center/cover no-repeat`
            : `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
          display: "flex",
          alignItems: "flex-end",
        }}
      >
        {/* Decorative brand-color blobs for a bolder, more vibrant first impression */}
        <div
          style={{
            position: "absolute",
            top: "-25%",
            insetInlineEnd: "-10%",
            width: 420,
            height: 420,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${secondaryColor}80 0%, transparent 70%)`,
            filter: "blur(50px)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-30%",
            insetInlineStart: "-8%",
            width: 380,
            height: 380,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${primaryColor}90 0%, transparent 70%)`,
            filter: "blur(50px)",
            pointerEvents: "none",
          }}
        />

        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to top, rgba(10, 12, 20, 0.92) 0%, rgba(10, 12, 20, 0.45) 55%, rgba(10, 12, 20, 0.15) 100%)",
            pointerEvents: "none",
          }}
        />

        <div
          className="container animate-fade-in-up"
          style={{
            position: "relative",
            zIndex: 2,
            paddingBottom: 32,
            paddingTop: 32,
            width: "100%",
          }}
        >
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
            }}
          >
            {/* Status Pills */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                flexWrap: "wrap",
              }}
            >
              {workspace.booking_enabled ? (
                <span
                  style={{
                    background: "rgba(16, 185, 129, 0.25)",
                    border: "1px solid rgba(16, 185, 129, 0.5)",
                    color: "#34d399",
                    backdropFilter: "blur(8px)",
                    fontSize: "0.84rem",
                    fontWeight: 700,
                    padding: "6px 16px",
                    borderRadius: 999,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: "#34d399",
                      boxShadow: "0 0 10px #34d399",
                    }}
                  />
                  {isRTL ? "الحجز مفعل أونلاين" : "Online Booking Active"}
                </span>
              ) : (
                <span
                  style={{
                    background: "rgba(245, 158, 11, 0.25)",
                    border: "1px solid rgba(245, 158, 11, 0.5)",
                    color: "#fbbf24",
                    backdropFilter: "blur(8px)",
                    fontSize: "0.84rem",
                    fontWeight: 700,
                    padding: "6px 16px",
                    borderRadius: 999,
                  }}
                >
                  {isRTL ? "الحجز موقوف مؤقتاً" : "Booking Paused"}
                </span>
              )}

              {workspace.workspace_type?.name && (
                <span
                  style={{
                    background: "rgba(255, 255, 255, 0.18)",
                    border: "1px solid rgba(255, 255, 255, 0.3)",
                    color: "#fff",
                    backdropFilter: "blur(8px)",
                    fontSize: "0.84rem",
                    fontWeight: 600,
                    padding: "6px 16px",
                    borderRadius: 999,
                  }}
                >
                  {workspace.workspace_type.name}
                </span>
              )}

              {averageRating && (
                <span
                  style={{
                    background: "rgba(245, 158, 11, 0.22)",
                    border: "1px solid rgba(245, 158, 11, 0.45)",
                    color: "#fcd34d",
                    backdropFilter: "blur(8px)",
                    fontSize: "0.84rem",
                    fontWeight: 700,
                    padding: "6px 16px",
                    borderRadius: 999,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <Icon name="star" size={14} />
                  {averageRating.toFixed(1)} · {testimonials.length}{" "}
                  {isRTL ? "تقييم" : "reviews"}
                </span>
              )}
            </div>

            {/* Quick Actions */}
            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                onClick={handleShare}
                style={{
                  background: "rgba(255, 255, 255, 0.2)",
                  border: "1px solid rgba(255, 255, 255, 0.35)",
                  color: "#fff",
                  padding: "8px 18px",
                  borderRadius: 999,
                  cursor: "pointer",
                  fontSize: "0.88rem",
                  fontWeight: 700,
                  backdropFilter: "blur(8px)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  transition: "all 0.2s ease",
                }}
                title={
                  isRTL ? "مشاركة رابط مساحة العمل" : "Share Workspace Link"
                }
              >
                <Icon name="share" size={16} />
                <span>{isRTL ? "مشاركة" : "Share"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Workspace Header Profile Card */}
      <div
        className="container"
        style={{
          marginTop: -60,
          position: "relative",
          zIndex: 3,
          marginBottom: 0,
        }}
      >
        <div
          className="card animate-fade-in-up"
          style={{
            padding: 32,
            borderRadius: 24,
            boxShadow: "0 20px 40px rgba(0, 0, 0, 0.1)",
            border: "1px solid var(--border)",
            background: "var(--surface)",
            borderTop: `4px solid ${primaryColor}`,
          }}
        >
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 28,
              alignItems: "flex-start",
            }}
          >
            {/* Logo */}
            <div
              style={{
                width: 120,
                height: 120,
                borderRadius: 24,
                background: "var(--surface)",
                border: "4px solid var(--surface)",
                boxShadow: `0 12px 32px ${primaryColor}25`,
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "3rem",
                fontWeight: 800,
                color: primaryColor,
                flexShrink: 0,
                marginTop: -30,
              }}
            >
              {workspace.logo_url ? (
                <LazyImage
                  src={workspace.logo_url}
                  alt={`${workspace.name} logo`}
                  width={112}
                  height={112}
                  objectFit="cover"
                />
              ) : (
                initial
              )}
            </div>

            {/* Title & Short Bio */}
            <div style={{ flex: 1, minWidth: 280 }}>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  gap: 12,
                  marginBottom: 6,
                }}
              >
                <h1
                  style={{
                    fontSize: "2.3rem",
                    fontWeight: 900,
                    color: "var(--text)",
                    margin: 0,
                    lineHeight: 1.15,
                    letterSpacing: "-0.02em",
                  }}
                >
                  <bdi style={{ unicodeBidi: "isolate" }}>{workspace.name}</bdi>
                </h1>

                {workspace.slug && (
                  <span
                    style={{
                      direction: "ltr",
                      color: primaryColor,
                      fontWeight: 700,
                      fontSize: "0.85rem",
                      background: `${primaryColor}15`,
                      padding: "4px 12px",
                      borderRadius: 999,
                    }}
                  >
                    @{workspace.slug}
                  </span>
                )}
              </div>

              {/* Tagline / Intro */}
              <p
                style={{
                  color: "var(--text-secondary)",
                  fontSize: "1.08rem",
                  lineHeight: 1.6,
                  marginTop: 8,
                  marginBottom: 16,
                  maxWidth: 780,
                }}
              >
                {getTranslatableText(workspace.booking_short_intro) ||
                  stripHtml(getTranslatableText(workspace.description)) ||
                  (isRTL
                    ? "مساحة عمل احترافية لحجز الخدمات والمواعيد الإلكترونية بكل سهولة."
                    : "A professional business workspace offering seamless appointment booking services.")}
              </p>

              {/* Quick Contact Chips */}
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 12,
                  alignItems: "center",
                  fontSize: "0.9rem",
                }}
              >
                {workspace.phone && (
                  <a
                    href={`tel:${workspace.phone}`}
                    className="btn btn-secondary btn-sm"
                    style={{
                      borderRadius: 999,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <Icon name="phone" size={15} />
                    <span>{workspace.phone}</span>
                  </a>
                )}
                {workspace.email && (
                  <a
                    href={`mailto:${workspace.email}`}
                    className="btn btn-secondary btn-sm"
                    style={{
                      borderRadius: 999,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <Icon name="mail" size={15} />
                    <span>{workspace.email}</span>
                  </a>
                )}
                {workspace.website && (
                  <a
                    href={workspace.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary btn-sm"
                    style={{
                      borderRadius: 999,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      color: primaryColor,
                    }}
                  >
                    <Icon name="globe" size={15} />
                    <span>{workspace.website.replace(/^https?:\/\//, "")}</span>
                  </a>
                )}
              </div>
            </div>

            {/* Main CTA Button */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 10,
                minWidth: 200,
                width: "100%",
                maxWidth: 240,
              }}
            >
              <button
                type="button"
                onClick={() => scrollToSection("services")}
                className="btn btn-primary btn-lg"
                style={{
                  width: "100%",
                  justifyContent: "center",
                  borderRadius: 14,
                  fontWeight: 800,
                  boxShadow: `0 8px 24px ${primaryColor}40`,
                }}
              >
                <Icon name="calendar" size={20} />
                <span>
                  {t("bookAppointment") ||
                    (isRTL ? "حجز موعد الآن" : "Book Now")}
                </span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Strip */}
          <div
            style={{
              marginTop: 28,
              paddingTop: 24,
              borderTop: "1px solid var(--border)",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 20,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: `${primaryColor}15`,
                  color: primaryColor,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon name="briefcase" size={22} />
              </div>
              <div>
                <div style={{ fontSize: "1.2rem", fontWeight: 800 }}>
                  {services.length}
                </div>
                <div
                  style={{
                    fontSize: "0.82rem",
                    color: "var(--text-secondary)",
                  }}
                >
                  {isRTL ? "الخدمات المتاحة" : "Available Services"}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: `${secondaryColor}15`,
                  color: secondaryColor,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon name="users" size={22} />
              </div>
              <div>
                <div style={{ fontSize: "1.2rem", fontWeight: 800 }}>
                  {totalSpecialistsCount}
                </div>
                <div
                  style={{
                    fontSize: "0.82rem",
                    color: "var(--text-secondary)",
                  }}
                >
                  {isRTL ? "فريق المتخصصين" : "Team Specialists"}
                </div>
              </div>
            </div>

            {workspace.maximum_booking_days > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: "rgba(16, 185, 129, 0.15)",
                    color: "#10b981",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icon name="clock" size={22} />
                </div>
                <div>
                  <div style={{ fontSize: "1.2rem", fontWeight: 800 }}>
                    {workspace.maximum_booking_days} {isRTL ? "يوم" : "days"}
                  </div>
                  <div
                    style={{
                      fontSize: "0.82rem",
                      color: "var(--text-secondary)",
                    }}
                  >
                    {isRTL ? "حجز متاح حتى" : "Max Advance Window"}
                  </div>
                </div>
              </div>
            )}

            {workspace.timezone?.name && (
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: "rgba(139, 92, 246, 0.15)",
                    color: "#8b5cf6",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icon name="globe" size={22} />
                </div>
                <div>
                  <div
                    style={{
                      fontSize: "0.95rem",
                      fontWeight: 800,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      maxWidth: 160,
                    }}
                  >
                    {workspace.timezone.name}
                  </div>
                  <div
                    style={{
                      fontSize: "0.82rem",
                      color: "var(--text-secondary)",
                    }}
                  >
                    {isRTL ? "المنطقة الزمنية" : "Workspace Timezone"}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sticky In-Page Section Navigation */}
      <div
        style={{
          position: "sticky",
          top: "var(--navbar-height, 72px)",
          zIndex: 8,
          background: "var(--surface)",
          borderBottom: "1px solid var(--border)",
          boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
          marginTop: 24,
          marginBottom: 24,
        }}
      >
        <div
          className="container"
          style={{
            display: "flex",
            gap: 6,
            overflowX: "auto",
            padding: "8px 0",
          }}
        >
          {navSections.map((section) => {
            const isActive = activeSection === section.id;
            return (
              <button
                key={section.id}
                type="button"
                onClick={() => scrollToSection(section.id)}
                style={{
                  whiteSpace: "nowrap",
                  padding: "10px 18px",
                  borderRadius: 999,
                  border: "none",
                  background: isActive ? `${primaryColor}18` : "transparent",
                  color: isActive ? primaryColor : "var(--text-secondary)",
                  fontWeight: 700,
                  fontSize: "0.9rem",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                {section.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* CONTINUOUS LANDING PAGE SECTIONS */}
      <div className="container">
        {/* Section 1: Services Grid */}
        <section
          id="services"
          style={{ scrollMarginTop: 140, marginBottom: 70 }}
        >
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
              marginBottom: 28,
            }}
          >
            <div>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  color: primaryColor,
                  fontSize: "0.88rem",
                  fontWeight: 700,
                  marginBottom: 6,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                <Icon name="briefcase" size={16} />
                <span>{isRTL ? "قائمة الخدمات" : "Service List"}</span>
              </div>
              <h2
                style={{
                  fontSize: "1.75rem",
                  fontWeight: 800,
                  margin: 0,
                  color: "var(--text)",
                }}
              >
                {t("offeredServices") ||
                  (isRTL ? "الخدمات والأسعار المتاحة" : "Services & Pricing")}
              </h2>
              <p
                style={{
                  color: "var(--text-secondary)",
                  margin: "6px 0 0 0",
                  fontSize: "0.95rem",
                }}
              >
                {isRTL
                  ? "اختر الخدمة المناسبة واضغط على 'حجز موعد' لمتابعة اختيار وقت الجلسة."
                  : "Select a service and click 'Book Appointment' to pick your preferred time slot."}
              </p>
            </div>

            {services.length > 3 && (
              <div style={{ position: "relative", minWidth: 260 }}>
                <input
                  type="text"
                  className="form-input"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={
                    isRTL ? "بحث في الخدمات..." : "Search services..."
                  }
                  style={{
                    borderRadius: 999,
                    paddingInlineStart: 40,
                    height: 44,
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    top: "50%",
                    transform: "translateY(-50%)",
                    [isRTL ? "right" : "left"]: 14,
                    color: "var(--text-secondary)",
                    pointerEvents: "none",
                  }}
                >
                  <Icon name="search" size={18} />
                </div>
              </div>
            )}
          </div>

          {servicesLoading ? (
            <ServiceCardSkeleton count={3} />
          ) : filteredServices.length === 0 ? (
            <div
              className="card"
              style={{
                padding: 48,
                textAlign: "center",
                color: "var(--text-secondary)",
                borderRadius: 20,
              }}
            >
              <Icon
                name="briefcase"
                size={48}
                style={{ opacity: 0.4, marginBottom: 12 }}
              />
              <p style={{ fontSize: "1.1rem", fontWeight: 600 }}>
                {searchTerm
                  ? isRTL
                    ? "لا توجد نتائج مطابقة للبحث."
                    : "No services matching your search."
                  : t("noServicesFound")}
              </p>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                gap: 24,
              }}
            >
              {filteredServices.map((srv) => (
                <article
                  key={srv.id}
                  className="card card-hover"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    padding: 24,
                    borderRadius: 20,
                    border: "1px solid var(--border)",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
                    transition: "all 0.25s ease",
                    position: "relative",
                  }}
                >
                  <div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        gap: 12,
                        marginBottom: 12,
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <h3
                          style={{
                            fontSize: "1.25rem",
                            fontWeight: 800,
                            margin: 0,
                            color: "var(--text)",
                          }}
                        >
                          {getTranslatableText(srv.name)}
                        </h3>

                        {srv.duration_minutes > 0 && (
                          <span
                            style={{
                              fontSize: "0.84rem",
                              color: "var(--text-secondary)",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 6,
                              marginTop: 6,
                              fontWeight: 600,
                            }}
                          >
                            <Icon name="clock" size={14} />
                            <span>
                              {srv.duration_minutes} {t("durationMinutes")}
                            </span>
                          </span>
                        )}
                      </div>

                      <span
                        style={{
                          fontSize: "1.2rem",
                          fontWeight: 800,
                          color: primaryColor,
                          background: `${primaryColor}14`,
                          padding: "6px 14px",
                          borderRadius: 12,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {formatCurrency(
                          srv.price,
                          srv.currency_detail || srv.currency,
                          isRTL,
                          t("freeService"),
                        )}
                      </span>
                    </div>

                    <p
                      style={{
                        color: "var(--text-secondary)",
                        fontSize: "0.92rem",
                        lineHeight: 1.6,
                        marginBottom: 24,
                      }}
                    >
                      {getTranslatableText(
                        srv.short_description || srv.description,
                      ) ||
                        (isRTL
                          ? "خدمة متميزة للحجز الفردي والاستشارات الاحترافية."
                          : "A premium session service designed for professional consultation.")}
                    </p>
                  </div>

                  {srv.booking_enabled !== false ? (
                    <Link
                      to={`/workspaces/${idOrSlug}/book?service=${srv.slug || srv.id}`}
                      className="btn btn-primary btn-md"
                      style={{
                        width: "100%",
                        justifyContent: "center",
                        borderRadius: 12,
                        fontWeight: 700,
                        gap: 8,
                        boxShadow: `0 4px 14px ${primaryColor}30`,
                      }}
                    >
                      <Icon name="calendar" size={18} />
                      <span>
                        {t("bookAppointment") ||
                          (isRTL ? "حجز موعد" : "Book Appointment")}
                      </span>
                    </Link>
                  ) : (
                    <button
                      type="button"
                      disabled
                      style={{
                        width: "100%",
                        justifyContent: "center",
                        gap: 8,
                        cursor: "not-allowed",
                        background: "var(--surface-alt, #f3f4f6)",
                        border: "1px solid var(--border)",
                        color: "var(--text-secondary)",
                        fontWeight: 700,
                        fontSize: "0.86rem",
                        padding: "10px 16px",
                        borderRadius: 12,
                        display: "inline-flex",
                        alignItems: "center",
                      }}
                    >
                      <Icon
                        name="calendar"
                        size={16}
                        style={{ opacity: 0.7 }}
                      />
                      <span>
                        {isRTL
                          ? "غير متاح للحجز أونلاين"
                          : "Not Available Online"}
                      </span>
                    </button>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Section 2: Specialists & Team — professional bio-card presentation */}
        {specialistRoles.length > 0 && (
          <section
            id="specialists"
            style={{ scrollMarginTop: 140, marginBottom: 70 }}
          >
            <div style={{ marginBottom: 28 }}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  color: primaryColor,
                  fontSize: "0.88rem",
                  fontWeight: 700,
                  marginBottom: 6,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                <Icon name="users" size={16} />
                <span>{isRTL ? "خبراء الفريق" : "Our Team"}</span>
              </div>
              <h2
                style={{
                  fontSize: "1.75rem",
                  fontWeight: 800,
                  margin: 0,
                  color: "var(--text)",
                }}
              >
                {isRTL
                  ? "فريق المتخصصين والخبراء"
                  : "Specialists & Team Members"}
              </h2>
              <p
                style={{
                  color: "var(--text-secondary)",
                  margin: "6px 0 0 0",
                  fontSize: "0.95rem",
                }}
              >
                {isRTL
                  ? "تصفح أفراد طاقم العمل المتخصصين ويمكنك اختيار المتخصص المفضل عند الحجز."
                  : "Explore our experienced team members and choose your specialist during booking."}
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
              {specialistRoles.map((role) => (
                <div key={role.id}>
                  <h3
                    style={{
                      fontSize: "1.15rem",
                      fontWeight: 700,
                      marginBottom: 16,
                      color: "var(--text)",
                      paddingBottom: 8,
                      borderBottom: "2px solid var(--border)",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <Icon
                      name="tag"
                      size={16}
                      style={{ color: primaryColor }}
                    />
                    <span>
                      {getTranslatableText(role.name_translations || role.name)}
                    </span>
                  </h3>

                  {role.members && role.members.length > 0 ? (
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fill, minmax(200px, 1fr))",
                        gap: 20,
                      }}
                    >
                      {role.members.map((member) => (
                        <Link
                          key={member.id}
                          to={`/workspaces/${idOrSlug}/specialist/${member.id}`}
                          className="card card-hover animate-tab-card"
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            textAlign: "center",
                            gap: 10,
                            padding: "28px 20px",
                            borderRadius: 20,
                            textDecoration: "none",
                            color: "var(--text)",
                            border: "1px solid var(--border)",
                            transition: "all 0.2s ease",
                          }}
                        >
                          <div
                            style={{
                              width: 78,
                              height: 78,
                              borderRadius: "50%",
                              background: `linear-gradient(135deg, ${primaryColor}25, ${secondaryColor}25)`,
                              color: primaryColor,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: 800,
                              fontSize: "1.6rem",
                              flexShrink: 0,
                              overflow: "hidden",
                              border: `2px solid ${primaryColor}30`,
                            }}
                          >
                            {member.avatar_url ? (
                              <LazyImage
                                src={member.avatar_url}
                                alt={member.name}
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "cover",
                                }}
                              />
                            ) : (
                              member.name.charAt(0).toUpperCase()
                            )}
                          </div>

                          <div>
                            <div
                              style={{ fontWeight: 800, fontSize: "1.05rem" }}
                            >
                              {member.name}
                            </div>
                            {member.title && (
                              <div
                                style={{
                                  fontSize: "0.85rem",
                                  color: "var(--text-secondary)",
                                  marginTop: 2,
                                }}
                              >
                                {member.title}
                              </div>
                            )}
                          </div>

                          <span
                            style={{
                              marginTop: 4,
                              color: primaryColor,
                              fontWeight: 700,
                              fontSize: "0.82rem",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                            }}
                          >
                            {isRTL ? "عرض الملف الشخصي" : "View Profile"}
                            <Icon
                              name={isRTL ? "chevron-left" : "chevron-right"}
                              size={14}
                            />
                          </span>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <p
                      style={{
                        color: "var(--text-secondary)",
                        fontSize: "0.88rem",
                        fontStyle: "italic",
                      }}
                    >
                      {isRTL
                        ? "لا يوجد أعضاء بهذا التخصص حالياً."
                        : "No members for this role currently."}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Section 3: About Workspace & Booking Rules */}
        <section id="about" style={{ scrollMarginTop: 140, marginBottom: 70 }}>
          <div style={{ marginBottom: 28 }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                color: primaryColor,
                fontSize: "0.88rem",
                fontWeight: 700,
                marginBottom: 6,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              <Icon name="info" size={16} />
              <span>{isRTL ? "معلومات العمل" : "Workspace Info"}</span>
            </div>
            <h2
              style={{
                fontSize: "1.75rem",
                fontWeight: 800,
                margin: 0,
                color: "var(--text)",
              }}
            >
              {isRTL
                ? "عن مساحة العمل وشروط الحجز"
                : "About & Booking Policies"}
            </h2>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: 28,
            }}
          >
            {/* Workspace Description Card */}
            <div
              className="card"
              style={{ padding: 28, borderRadius: 20, flex: 1 }}
            >
              <h3
                style={{
                  fontSize: "1.3rem",
                  fontWeight: 800,
                  marginBottom: 16,
                  color: "var(--text)",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <Icon
                  name="briefcase"
                  size={22}
                  style={{ color: primaryColor }}
                />
                <span>
                  {isRTL
                    ? "نبذة تفصيلية عن مساحة العمل"
                    : "About Our Workspace"}
                </span>
              </h3>

              {getTranslatableText(workspace.description) ? (
                <div
                  className="workspace-html-description"
                  style={{
                    color: "var(--text-secondary)",
                    lineHeight: 1.7,
                    fontSize: "0.96rem",
                  }}
                  dangerouslySetInnerHTML={{
                    __html: getTranslatableText(workspace.description),
                  }}
                />
              ) : (
                <p
                  style={{
                    color: "var(--text-secondary)",
                    lineHeight: 1.7,
                    fontSize: "0.96rem",
                  }}
                >
                  {getTranslatableText(workspace.booking_short_intro) ||
                    (isRTL
                      ? "مساحة عمل متخصصة تقدم خدمات جليلة ومواعيد مرنة للعملاء."
                      : "A specialized workspace delivering top quality scheduling services.")}
                </p>
              )}
            </div>

            {/* Policies & Booking Rules Card */}
            <div
              className="card"
              style={{ padding: 28, borderRadius: 20, flex: 1 }}
            >
              <h3
                style={{
                  fontSize: "1.3rem",
                  fontWeight: 800,
                  marginBottom: 16,
                  color: "var(--text)",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <Icon name="shield" size={22} style={{ color: primaryColor }} />
                <span>
                  {isRTL ? "قواعد وسياسات الحجز" : "Booking Rules & Policies"}
                </span>
              </h3>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 16,
                  fontSize: "0.92rem",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 16px",
                    background: "var(--background-subtle, #f8fafc)",
                    borderRadius: 12,
                  }}
                >
                  <span style={{ fontWeight: 600 }}>
                    {isRTL ? "طريقة تأكيد الحجوزات:" : "Confirmation Policy:"}
                  </span>
                  <span
                    style={{
                      fontWeight: 700,
                      color: workspace.auto_confirm_appointments
                        ? "#10b981"
                        : "#f59e0b",
                    }}
                  >
                    {workspace.auto_confirm_appointments
                      ? isRTL
                        ? "تأكيد فوري تلقائي"
                        : "Auto Confirmation"
                      : isRTL
                        ? "مراجعة قبل التأكيد"
                        : "Manual Confirmation"}
                  </span>
                </div>

                {workspace.minimum_booking_notice_minutes > 0 && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "12px 16px",
                      background: "var(--background-subtle, #f8fafc)",
                      borderRadius: 12,
                    }}
                  >
                    <span style={{ fontWeight: 600 }}>
                      {isRTL
                        ? "الحد الأدنى للإشعار المسبق:"
                        : "Minimum Notice:"}
                    </span>
                    <span style={{ fontWeight: 700 }}>
                      {workspace.minimum_booking_notice_minutes}{" "}
                      {t("durationMinutes")}
                    </span>
                  </div>
                )}

                {workspace.maximum_booking_days > 0 && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "12px 16px",
                      background: "var(--background-subtle, #f8fafc)",
                      borderRadius: 12,
                    }}
                  >
                    <span style={{ fontWeight: 600 }}>
                      {isRTL ? "أقصى فترة حجز مسبق:" : "Max Advance Window:"}
                    </span>
                    <span style={{ fontWeight: 700 }}>
                      {workspace.maximum_booking_days}{" "}
                      {isRTL ? "يوماً" : "days"}
                    </span>
                  </div>
                )}

                {workspace.timezone?.name && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "12px 16px",
                      background: "var(--background-subtle, #f8fafc)",
                      borderRadius: 12,
                    }}
                  >
                    <span style={{ fontWeight: 600 }}>
                      {isRTL ? "المنطقة الزمنية للحجز:" : "Booking Timezone:"}
                    </span>
                    <span style={{ fontWeight: 700 }}>
                      {workspace.timezone.name}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Portfolio Showcase — upgraded photo gallery with captions + lightbox */}
        {galleryItems.length > 0 && (
          <section
            id="portfolio"
            style={{ scrollMarginTop: 140, marginBottom: 70 }}
          >
            <div style={{ marginBottom: 24 }}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  color: primaryColor,
                  fontSize: "0.88rem",
                  fontWeight: 700,
                  marginBottom: 6,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                <Icon name="image" size={16} />
                <span>{isRTL ? "معرض الأعمال" : "Portfolio Showcase"}</span>
              </div>
              <h2
                style={{
                  fontSize: "1.75rem",
                  fontWeight: 800,
                  margin: 0,
                  color: "var(--text)",
                }}
              >
                {isRTL ? "لمحة من أعمالنا ومساحتنا" : "A Look Inside Our Work"}
              </h2>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: 20,
              }}
            >
              {galleryItems.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setLightboxIndex(idx)}
                  className="card animate-tab-card"
                  style={{
                    padding: 0,
                    borderRadius: 20,
                    overflow: "hidden",
                    height: idx % 5 === 0 ? 320 : 220,
                    border: "1px solid var(--border)",
                    boxShadow: "0 4px 14px rgba(0,0,0,0.06)",
                    position: "relative",
                    cursor: "pointer",
                    display: "block",
                    width: "100%",
                  }}
                >
                  <LazyImage
                    src={item.url}
                    alt={item.caption || `Portfolio image ${idx + 1}`}
                    width="100%"
                    height="100%"
                    objectFit="cover"
                  />
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background:
                        "linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 45%)",
                      display: "flex",
                      alignItems: "flex-end",
                      padding: 16,
                      opacity: item.caption ? 1 : 0,
                      transition: "opacity 0.2s ease",
                    }}
                  >
                    {item.caption && (
                      <span
                        style={{
                          color: "#fff",
                          fontWeight: 700,
                          fontSize: "0.92rem",
                          textAlign: isRTL ? "right" : "left",
                        }}
                      >
                        {item.caption}
                      </span>
                    )}
                  </div>
                  <div
                    style={{
                      position: "absolute",
                      top: 12,
                      [isRTL ? "left" : "right"]: 12,
                      width: 34,
                      height: 34,
                      borderRadius: "50%",
                      background: "rgba(0,0,0,0.4)",
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Icon name="search" size={16} />
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Testimonials & Reviews — only rendered when real, attributed client reviews exist */}
        {testimonials.length > 0 && (
          <section
            id="testimonials"
            style={{ scrollMarginTop: 140, marginBottom: 70 }}
          >
            <div
              style={{
                textAlign: "center",
                maxWidth: 640,
                margin: "0 auto 36px",
              }}
            >
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  color: primaryColor,
                  fontSize: "0.88rem",
                  fontWeight: 700,
                  marginBottom: 6,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  justifyContent: "center",
                }}
              >
                <Icon name="quote" size={16} />
                <span>{isRTL ? "آراء العملاء" : "Testimonials"}</span>
              </div>
              <h2
                style={{
                  fontSize: "1.75rem",
                  fontWeight: 800,
                  margin: 0,
                  color: "var(--text)",
                }}
              >
                {isRTL ? "ماذا يقول عملاؤنا عنا" : "What Our Clients Say"}
              </h2>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                gap: 24,
              }}
            >
              {testimonials.map((item, idx) => (
                <div
                  key={idx}
                  className="card card-hover"
                  style={{
                    padding: 28,
                    borderRadius: 20,
                    border: "1px solid var(--border)",
                    position: "relative",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <Icon
                    name="quote"
                    size={30}
                    style={{
                      color: `${primaryColor}25`,
                      position: "absolute",
                      top: 20,
                      [isRTL ? "left" : "right"]: 20,
                    }}
                  />

                  {item.rating > 0 && (
                    <div style={{ display: "flex", gap: 2, marginBottom: 14 }}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Icon
                          key={star}
                          name="star"
                          size={16}
                          style={{
                            color:
                              star <= item.rating ? "#f59e0b" : "var(--border)",
                          }}
                        />
                      ))}
                    </div>
                  )}

                  <p
                    style={{
                      fontSize: "1rem",
                      lineHeight: 1.7,
                      color: "var(--text)",
                      fontStyle: "italic",
                      marginBottom: 22,
                      flex: 1,
                    }}
                  >
                    &ldquo;{item.quote}&rdquo;
                  </p>

                  <div
                    style={{ display: "flex", alignItems: "center", gap: 12 }}
                  >
                    <div
                      style={{
                        width: 46,
                        height: 46,
                        borderRadius: "50%",
                        background: `${primaryColor}18`,
                        color: primaryColor,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 800,
                        overflow: "hidden",
                        flexShrink: 0,
                      }}
                    >
                      {item.avatar_url ? (
                        <LazyImage
                          src={item.avatar_url}
                          alt={item.client_name}
                          width={46}
                          height={46}
                          objectFit="cover"
                        />
                      ) : (
                        item.client_name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: "0.98rem" }}>
                        {item.client_name}
                      </div>
                      {item.client_role && (
                        <div
                          style={{
                            fontSize: "0.82rem",
                            color: "var(--text-secondary)",
                          }}
                        >
                          {item.client_role}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Section 4: Contact & Location */}
        <section
          id="location"
          style={{ scrollMarginTop: 140, marginBottom: 70 }}
        >
          <div style={{ marginBottom: 28 }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                color: primaryColor,
                fontSize: "0.88rem",
                fontWeight: 700,
                marginBottom: 6,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              <Icon name="map-pin" size={16} />
              <span>
                {isRTL ? "وسائل التواصل والوصول" : "Contact & Location"}
              </span>
            </div>
            <h2
              style={{
                fontSize: "1.75rem",
                fontWeight: 800,
                margin: 0,
                color: "var(--text)",
              }}
            >
              {isRTL ? "التواصل والموقع الجغرافي" : "Get In Touch & Location"}
            </h2>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: 28,
            }}
          >
            {/* Contact Info Card */}
            <div className="card" style={{ padding: 28, borderRadius: 20 }}>
              <h3
                style={{
                  fontSize: "1.3rem",
                  fontWeight: 800,
                  marginBottom: 20,
                  color: "var(--text)",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <Icon name="phone" size={22} style={{ color: primaryColor }} />
                <span>{isRTL ? "معلومات التواصل" : "Contact Details"}</span>
              </h3>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 16,
                }}
              >
                {workspace.phone && (
                  <a
                    href={`tel:${workspace.phone}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      color: "var(--text)",
                      textDecoration: "none",
                      padding: "12px 16px",
                      background: "var(--background-subtle, #f8fafc)",
                      borderRadius: 14,
                    }}
                  >
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        background: `${primaryColor}20`,
                        color: primaryColor,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Icon name="phone" size={18} />
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: "0.8rem",
                          color: "var(--text-secondary)",
                        }}
                      >
                        {isRTL ? "رقم الهاتف" : "Phone Number"}
                      </div>
                      <div style={{ fontWeight: 700, fontSize: "1rem" }}>
                        {workspace.phone}
                      </div>
                    </div>
                  </a>
                )}

                {workspace.email && (
                  <a
                    href={`mailto:${workspace.email}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      color: "var(--text)",
                      textDecoration: "none",
                      padding: "12px 16px",
                      background: "var(--background-subtle, #f8fafc)",
                      borderRadius: 14,
                    }}
                  >
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        background: `${primaryColor}20`,
                        color: primaryColor,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Icon name="mail" size={18} />
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: "0.8rem",
                          color: "var(--text-secondary)",
                        }}
                      >
                        {isRTL ? "البريد الإلكتروني" : "Email Address"}
                      </div>
                      <div style={{ fontWeight: 700, fontSize: "1rem" }}>
                        {workspace.email}
                      </div>
                    </div>
                  </a>
                )}

                {workspace.website && (
                  <a
                    href={workspace.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      color: "var(--text)",
                      textDecoration: "none",
                      padding: "12px 16px",
                      background: "var(--background-subtle, #f8fafc)",
                      borderRadius: 14,
                    }}
                  >
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        background: `${primaryColor}20`,
                        color: primaryColor,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Icon name="globe" size={18} />
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: "0.8rem",
                          color: "var(--text-secondary)",
                        }}
                      >
                        {isRTL ? "الموقع الإلكتروني الرسمي" : "Website"}
                      </div>
                      <div style={{ fontWeight: 700, fontSize: "1rem" }}>
                        {workspace.website.replace(/^https?:\/\//, "")}
                      </div>
                    </div>
                  </a>
                )}
              </div>

              {/* Social Media Badges */}
              {validSocialLinks.length > 0 && (
                <div style={{ marginTop: 24 }}>
                  <div
                    style={{
                      fontSize: "0.88rem",
                      fontWeight: 700,
                      color: "var(--text-secondary)",
                      marginBottom: 12,
                    }}
                  >
                    {isRTL
                      ? "منصات التواصل الاجتماعي"
                      : "Social Media Platforms"}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 10,
                    }}
                  >
                    {validSocialLinks.map((item, idx) => {
                      const platformKey = (
                        typeof item === "object" && item.platform
                          ? item.platform
                          : "website"
                      ).toLowerCase();
                      const url = typeof item === "string" ? item : item.url;
                      const href = url.startsWith("http")
                        ? url
                        : `https://${url}`;
                      const config = PLATFORM_CONFIG[platformKey] || {
                        label: platformKey.toUpperCase(),
                        icon: <Icon name="globe" size={15} />,
                      };

                      return (
                        <a
                          key={idx}
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-secondary btn-sm"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 8,
                            borderRadius: 999,
                            padding: "8px 16px",
                            fontSize: "0.88rem",
                            fontWeight: 600,
                          }}
                        >
                          {config.icon}
                          <span>{config.label}</span>
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Location Card */}
            <div className="card" style={{ padding: 28, borderRadius: 20 }}>
              <h3
                style={{
                  fontSize: "1.3rem",
                  fontWeight: 800,
                  marginBottom: 20,
                  color: "var(--text)",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <Icon
                  name="map-pin"
                  size={22}
                  style={{ color: primaryColor }}
                />
                <span>{isRTL ? "الموقع والعنوان" : "Location & Address"}</span>
              </h3>

              <div
                style={{ display: "flex", flexDirection: "column", gap: 16 }}
              >
                {workspace.country?.name && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    <Icon name="globe" size={18} style={{ opacity: 0.6 }} />
                    <span style={{ fontSize: "0.98rem" }}>
                      <strong>{isRTL ? "الدولة:" : "Country:"}</strong>{" "}
                      {workspace.country.name}
                    </span>
                  </div>
                )}

                {workspace.city?.name && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    <Icon name="map-pin" size={18} style={{ opacity: 0.6 }} />
                    <span style={{ fontSize: "0.98rem" }}>
                      <strong>{isRTL ? "المدينة:" : "City:"}</strong>{" "}
                      {workspace.city.name}
                    </span>
                  </div>
                )}

                {workspace.address && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 12,
                    }}
                  >
                    <Icon
                      name="map-pin"
                      size={18}
                      style={{ opacity: 0.6, marginTop: 3 }}
                    />
                    <span style={{ fontSize: "0.98rem", lineHeight: 1.5 }}>
                      <strong>{isRTL ? "العنوان:" : "Address:"}</strong>{" "}
                      {workspace.address}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Highlights / Value Features Section */}
      <section
        style={{
          padding: "60px 0",
          background: "var(--surface)",
          borderTop: "1px solid var(--border)",
          borderBottom: "1px solid var(--border)",
          marginBottom: 60,
        }}
      >
        <div className="container">
          <div
            style={{
              textAlign: "center",
              maxWidth: 600,
              margin: "0 auto 40px",
            }}
          >
            <h2
              style={{ fontSize: "1.75rem", fontWeight: 800, marginBottom: 8 }}
            >
              {isRTL ? "لماذا تختار خدماتنا؟" : "Why Choose Our Workspace?"}
            </h2>
            <p style={{ color: "var(--text-secondary)", margin: 0 }}>
              {isRTL
                ? "تجربة حجز مواعيد سريعة، موثوقة، ومصممة لتلبية تطلعاتك."
                : "A smooth, reliable, and modern appointment booking experience."}
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: 24,
            }}
          >
            {Array.isArray(workspace.feature_highlights) &&
            workspace.feature_highlights.length > 0 ? (
              workspace.feature_highlights.map((feat, idx) => (
                <div
                  key={idx}
                  className="card card-hover animate-tab-card"
                  style={{
                    padding: 24,
                    borderRadius: 20,
                    textAlign: "center",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    position: "relative",
                    overflow: "hidden",
                    borderTop: `3px solid ${primaryColor}`,
                  }}
                >
                  {feat.image_url && (
                    <div
                      style={{
                        width: "100%",
                        height: 140,
                        borderRadius: 14,
                        overflow: "hidden",
                        marginBottom: 16,
                      }}
                    >
                      <LazyImage
                        src={feat.image_url}
                        alt={feat.title || "Feature highlight"}
                        width="100%"
                        height="100%"
                        objectFit="cover"
                      />
                    </div>
                  )}

                  <div
                    style={{
                      width: 54,
                      height: 54,
                      borderRadius: 16,
                      background: `${primaryColor}15`,
                      color: primaryColor,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: 14,
                    }}
                  >
                    <Icon name={feat.icon || "sparkles"} size={26} />
                  </div>

                  <h3
                    style={{
                      fontSize: "1.15rem",
                      fontWeight: 800,
                      marginBottom: 8,
                      color: "var(--text)",
                    }}
                  >
                    {feat.title}
                  </h3>

                  {feat.description && (
                    <p
                      style={{
                        fontSize: "0.9rem",
                        color: "var(--text-secondary)",
                        margin: 0,
                        lineHeight: 1.6,
                      }}
                    >
                      {feat.description}
                    </p>
                  )}
                </div>
              ))
            ) : (
              <>
                <div
                  className="card"
                  style={{ padding: 28, borderRadius: 20, textAlign: "center" }}
                >
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 16,
                      background: `${primaryColor}15`,
                      color: primaryColor,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: 16,
                    }}
                  >
                    <Icon name="check" size={28} />
                  </div>
                  <h3
                    style={{
                      fontSize: "1.15rem",
                      fontWeight: 800,
                      marginBottom: 8,
                    }}
                  >
                    {isRTL ? "حجز فوري ومؤكد" : "Instant Booking"}
                  </h3>
                  <p
                    style={{
                      fontSize: "0.9rem",
                      color: "var(--text-secondary)",
                      margin: 0,
                      lineHeight: 1.5,
                    }}
                  >
                    {isRTL
                      ? "تأكيد المواعيد بضغطة زر دون انتظار طويل."
                      : "Instant slot confirmation with immediate notification."}
                  </p>
                </div>

                <div
                  className="card"
                  style={{ padding: 28, borderRadius: 20, textAlign: "center" }}
                >
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 16,
                      background: `${secondaryColor}15`,
                      color: secondaryColor,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: 16,
                    }}
                  >
                    <Icon name="users" size={28} />
                  </div>
                  <h3
                    style={{
                      fontSize: "1.15rem",
                      fontWeight: 800,
                      marginBottom: 8,
                    }}
                  >
                    {isRTL ? "خبراء ومتخصصون" : "Top Professionals"}
                  </h3>
                  <p
                    style={{
                      fontSize: "0.9rem",
                      color: "var(--text-secondary)",
                      margin: 0,
                      lineHeight: 1.5,
                    }}
                  >
                    {isRTL
                      ? "فريق عمل مؤهل لتقديم أفضل الخدمات والنتائج."
                      : "Highly trained team dedicated to delivering excellence."}
                  </p>
                </div>

                <div
                  className="card"
                  style={{ padding: 28, borderRadius: 20, textAlign: "center" }}
                >
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 16,
                      background: "rgba(16, 185, 129, 0.15)",
                      color: "#10b981",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: 16,
                    }}
                  >
                    <Icon name="clock" size={28} />
                  </div>
                  <h3
                    style={{
                      fontSize: "1.15rem",
                      fontWeight: 800,
                      marginBottom: 8,
                    }}
                  >
                    {isRTL ? "مرونة في المواعيد" : "Flexible Hours"}
                  </h3>
                  <p
                    style={{
                      fontSize: "0.9rem",
                      color: "var(--text-secondary)",
                      margin: 0,
                      lineHeight: 1.5,
                    }}
                  >
                    {isRTL
                      ? "جدولة تناسب وقتك وإعادة جدولة بأي وقت."
                      : "Convenient time slots tailored to suit your busy schedule."}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Customer FAQs Section */}
      <section id="faq" style={{ scrollMarginTop: 140, paddingBottom: 60 }}>
        <div className="container" style={{ maxWidth: 840 }}>
          <div style={{ textAlign: "center", marginBottom: 36 }}>
            <h2
              style={{ fontSize: "1.75rem", fontWeight: 800, marginBottom: 8 }}
            >
              {isRTL ? "الأسئلة الشائعة" : "Frequently Asked Questions"}
            </h2>
            <p style={{ color: "var(--text-secondary)", margin: 0 }}>
              {isRTL
                ? "إليك إجابات حول أبرز الاستفسارات الخاصة بالحجز والمواعيد."
                : "Find answers to common questions about booking and appointments."}
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {faqItems.map((item, index) => {
              const isOpen = expandedFaq === index;
              return (
                <div
                  key={index}
                  className="card"
                  style={{
                    borderRadius: 18,
                    overflow: "hidden",
                    border: "1px solid var(--border)",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setExpandedFaq(isOpen ? null : index)}
                    style={{
                      width: "100%",
                      padding: "20px 24px",
                      background: "none",
                      border: "none",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 12,
                      cursor: "pointer",
                      textAlign: isRTL ? "right" : "left",
                      fontWeight: 700,
                      fontSize: "1.02rem",
                      color: "var(--text)",
                    }}
                  >
                    <span>{item.q}</span>
                    <Icon
                      name={isOpen ? "chevron-up" : "chevron-down"}
                      size={18}
                      style={{
                        color: primaryColor,
                        flexShrink: 0,
                        transition: "transform 0.2s ease",
                      }}
                    />
                  </button>

                  {isOpen && (
                    <div
                      style={{
                        padding: "0 24px 22px",
                        color: "var(--text-secondary)",
                        fontSize: "0.95rem",
                        lineHeight: 1.65,
                      }}
                    >
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Bottom Conversion CTA Banner Card */}
      <section style={{ padding: "0 0 80px 0" }}>
        <div className="container">
          <div
            style={{
              background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
              borderRadius: 28,
              padding: "54px 32px",
              color: "#fff",
              textAlign: "center",
              position: "relative",
              overflow: "hidden",
              boxShadow: `0 20px 50px ${primaryColor}35`,
              border: "1px solid rgba(255, 255, 255, 0.15)",
            }}
          >
            {/* Background Glow Decorations */}
            <div
              style={{
                position: "absolute",
                top: "-40%",
                right: "-20%",
                width: 320,
                height: 320,
                borderRadius: "50%",
                background: "rgba(255, 255, 255, 0.12)",
                filter: "blur(60px)",
                pointerEvents: "none",
              }}
            />
            <div
              style={{
                position: "absolute",
                bottom: "-40%",
                left: "-20%",
                width: 320,
                height: 320,
                borderRadius: "50%",
                background: "rgba(0, 0, 0, 0.15)",
                filter: "blur(60px)",
                pointerEvents: "none",
              }}
            />

            <div
              style={{
                position: "relative",
                zIndex: 2,
                maxWidth: 700,
                margin: "0 auto",
              }}
            >
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 56,
                  height: 56,
                  borderRadius: 16,
                  background: "rgba(255, 255, 255, 0.2)",
                  backdropFilter: "blur(8px)",
                  marginBottom: 20,
                  boxShadow: "0 8px 20px rgba(0,0,0,0.1)",
                }}
              >
                <Icon name="calendar" size={26} color="#fff" />
              </div>

              <h2
                style={{
                  fontSize: "1.95rem",
                  fontWeight: 800,
                  marginBottom: 14,
                  lineHeight: 1.4,
                }}
              >
                {isRTL ? (
                  <span>
                    جاهز لحجز موعدك لدى{" "}
                    <bdi style={{ unicodeBidi: "isolate" }}>
                      {workspace.name}
                    </bdi>
                    ؟
                  </span>
                ) : (
                  <span>
                    Ready to book your appointment at{" "}
                    <bdi style={{ unicodeBidi: "isolate" }}>
                      {workspace.name}
                    </bdi>
                    ?
                  </span>
                )}
              </h2>

              <p
                style={{
                  fontSize: "1.05rem",
                  opacity: 0.92,
                  maxWidth: 580,
                  margin: "0 auto 32px",
                  lineHeight: 1.6,
                }}
              >
                {isRTL
                  ? "اختر الخدمة والوقت المناسبين لك وأكمل حجزك بسهولة في خطوات معدودة."
                  : "Choose your preferred service and time slot to complete your booking in minutes."}
              </p>

              <button
                type="button"
                onClick={() => scrollToSection("services")}
                className="btn btn-lg"
                style={{
                  background: "#fff",
                  color: primaryColor,
                  fontWeight: 800,
                  padding: "16px 36px",
                  borderRadius: 999,
                  border: "none",
                  boxShadow: "0 10px 28px rgba(0,0,0,0.2)",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 10,
                  fontSize: "1.02rem",
                  transition: "all 0.25s ease",
                }}
              >
                <Icon name="calendar" size={20} />
                <span>
                  {isRTL ? "استعراض الخدمات والحجز" : "Browse Services & Book"}
                </span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Portfolio Lightbox Overlay */}
      {lightboxIndex !== null && galleryItems[lightboxIndex] && (
        <div
          className="modal-backdrop"
          onClick={() => setLightboxIndex(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(10, 10, 15, 0.9)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
          }}
        >
          <button
            type="button"
            onClick={() => setLightboxIndex(null)}
            style={{
              position: "absolute",
              top: 20,
              [isRTL ? "left" : "right"]: 20,
              width: 44,
              height: 44,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.15)",
              border: "1px solid rgba(255,255,255,0.3)",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
            title={isRTL ? "إغلاق" : "Close"}
          >
            <Icon name="x" size={20} />
          </button>

          {galleryItems.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex(
                  (lightboxIndex - 1 + galleryItems.length) %
                    galleryItems.length,
                );
              }}
              style={{
                position: "absolute",
                [isRTL ? "right" : "left"]: 20,
                top: "50%",
                transform: "translateY(-50%)",
                width: 48,
                height: 48,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.15)",
                border: "1px solid rgba(255,255,255,0.3)",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
              title={isRTL ? "السابق" : "Previous"}
            >
              <Icon name={isRTL ? "chevron-right" : "chevron-left"} size={22} />
            </button>
          )}

          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: "min(900px, 90vw)",
              maxHeight: "85vh",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 16,
            }}
          >
            <img
              src={galleryItems[lightboxIndex].url}
              alt={galleryItems[lightboxIndex].caption || "Portfolio image"}
              style={{
                maxWidth: "100%",
                maxHeight: "72vh",
                borderRadius: 16,
                boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
                objectFit: "contain",
              }}
            />
            {galleryItems[lightboxIndex].caption && (
              <p
                style={{
                  color: "#fff",
                  fontSize: "1rem",
                  fontWeight: 600,
                  textAlign: "center",
                  margin: 0,
                }}
              >
                {galleryItems[lightboxIndex].caption}
              </p>
            )}
          </div>

          {galleryItems.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex((lightboxIndex + 1) % galleryItems.length);
              }}
              style={{
                position: "absolute",
                [isRTL ? "left" : "right"]: 20,
                top: "50%",
                transform: "translateY(-50%)",
                width: 48,
                height: 48,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.15)",
                border: "1px solid rgba(255,255,255,0.3)",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
              title={isRTL ? "التالي" : "Next"}
            >
              <Icon name={isRTL ? "chevron-left" : "chevron-right"} size={22} />
            </button>
          )}
        </div>
      )}
    </main>
  );
}
