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

  // Search, Filter & Lightbox states
  const [searchTerm, setSearchTerm] = useState("");
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [activeSpecialistRole, setActiveSpecialistRole] = useState("all");

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

  // Smooth scroll helper
  const scrollToSection = useCallback((sectionId) => {
    const el = document.getElementById(sectionId);
    if (el) {
      const yOffset = -130;
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
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
  };

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

      {/* SECTION 1: HERO & BRANDING BANNER */}
      <section
        className="workspace-public-hero-section"
        style={{
          position: "relative",
          minHeight: 340,
          paddingTop: 20,
          paddingBottom: 20,
          marginBottom: 36,
          overflow: "hidden",
          background: workspace.cover_url
            ? `url(${workspace.cover_url}) center/cover no-repeat`
            : `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor || primaryColor} 100%)`,
          display: "flex",
          alignItems: "center",
          boxShadow: "0 6px 20px rgba(0, 0, 0, 0.12)",
        }}
      >
        {/* Decorative brand-color blobs for vibrant primary & secondary glow */}
        {!workspace.cover_url && (
          <>
            <div
              style={{
                position: "absolute",
                top: "-20%",
                insetInlineEnd: "-5%",
                width: 480,
                height: 480,
                borderRadius: "50%",
                background: `radial-gradient(circle, ${secondaryColor}80 0%, transparent 70%)`,
                filter: "blur(50px)",
                pointerEvents: "none",
              }}
            />
            <div
              style={{
                position: "absolute",
                bottom: "-25%",
                insetInlineStart: "-5%",
                width: 460,
                height: 460,
                borderRadius: "50%",
                background: `radial-gradient(circle, ${primaryColor}90 0%, transparent 70%)`,
                filter: "blur(50px)",
                pointerEvents: "none",
              }}
            />
          </>
        )}

        <div
          className={`workspace-public-hero-overlay ${
            workspace.cover_url ? "has-cover" : "no-cover"
          }`}
        />

        <div
          className="container animate-fade-in-up"
          style={{
            position: "relative",
            zIndex: 3,
            width: "100%",
            paddingTop: 48,
            paddingBottom: 48,
          }}
        >
          {/* Glassmorphic Landing Hero Box */}
          <div
            className="workspace-public-hero-card"
            style={{
              padding: "24px 28px",
              borderRadius: 24,
            }}
          >
            {/* Hero Top Bar: Status Badges & Quick Action */}
            <div
              className="workspace-hero-divider"
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 16,
                paddingBottom: 22,
                marginBottom: 26,
                borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  flexWrap: "wrap",
                }}
              >
                {workspace.booking_enabled ? (
                  <span className="workspace-hero-status-active">
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: "currentColor",
                        boxShadow: "0 0 8px currentColor",
                      }}
                    />
                    {isRTL ? "الحجز مفعل أونلاين" : "Online Booking Active"}
                  </span>
                ) : (
                  <span
                    style={{
                      background: "rgba(245, 158, 11, 0.2)",
                      border: "1px solid rgba(245, 158, 11, 0.4)",
                      color: "#fbbf24",
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
                  <span className="workspace-hero-type-badge">
                    {workspace.workspace_type.name}
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={handleShare}
                className="workspace-hero-share-btn"
                title={
                  isRTL ? "مشاركة رابط مساحة العمل" : "Share Workspace Link"
                }
              >
                <Icon name="share" size={16} />
                <span>{isRTL ? "مشاركة" : "Share"}</span>
              </button>
            </div>

            {/* Main Content & Branding Body */}
            <div
              className="workspace-hero-body"
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 24,
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              {/* Logo Thumbnail Badge */}
              <div
                className="workspace-hero-logo-box"
                style={{
                  width: 95,
                  height: 95,
                  borderRadius: 20,
                  overflow: "hidden",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "2.4rem",
                  fontWeight: 800,
                  color: primaryColor,
                  flexShrink: 0,
                }}
              >
                {workspace.logo_url ? (
                  <LazyImage
                    src={workspace.logo_url}
                    alt={`${workspace.name} logo`}
                    width={91}
                    height={91}
                    objectFit="cover"
                  />
                ) : (
                  initial
                )}
              </div>

              {/* Title, Bio & Contact Chips */}
              <div style={{ flex: 1, minWidth: 260 }}>
                <div
                  className="workspace-hero-title-box"
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    gap: 10,
                    marginBottom: 6,
                  }}
                >
                  <h1
                    className="workspace-hero-title"
                    style={{
                      fontSize: "2.4rem",
                      fontWeight: 900,
                      margin: 0,
                      lineHeight: 1.15,
                      letterSpacing: "-0.02em",
                    }}
                  >
                    <bdi style={{ unicodeBidi: "isolate" }}>
                      {workspace.name}
                    </bdi>
                  </h1>

                  {workspace.slug && (
                    <span
                      style={{
                        direction: "ltr",
                        color: primaryColor,
                        fontWeight: 700,
                        fontSize: "0.84rem",
                        background: `${primaryColor}15`,
                        border: `1px solid ${primaryColor}30`,
                        padding: "3px 12px",
                        borderRadius: 999,
                      }}
                    >
                      @{workspace.slug}
                    </span>
                  )}
                </div>

                {getTranslatableText(workspace.description) ? (
                  <div
                    className="workspace-hero-html-description"
                    style={{
                      fontSize: "0.96rem",
                      lineHeight: 1.6,
                      marginTop: 6,
                      marginBottom: 14,
                      maxWidth: 750,
                    }}
                    dangerouslySetInnerHTML={{
                      __html: getTranslatableText(workspace.description),
                    }}
                  />
                ) : (
                  <p
                    style={{
                      color: "var(--text-secondary)",
                      fontSize: "0.96rem",
                      lineHeight: 1.6,
                      marginTop: 6,
                      marginBottom: 14,
                      maxWidth: 720,
                    }}
                  >
                    {getTranslatableText(workspace.booking_short_intro) ||
                      (isRTL
                        ? "مساحة عمل احترافية لحجز الخدمات والمواعيد الإلكترونية بكل سهولة."
                        : "A professional business workspace offering seamless appointment booking services.")}
                  </p>
                )}

                {/* Contact Pills & Social Media Links embedded directly in Hero */}
                <div
                  className="workspace-hero-chips-wrap"
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 10,
                    alignItems: "center",
                  }}
                >
                  {workspace.phone && (
                    <a
                      href={`tel:${workspace.phone}`}
                      className="workspace-hero-contact-chip"
                    >
                      <Icon name="phone" size={15} />
                      <span>{workspace.phone}</span>
                    </a>
                  )}
                  {workspace.email && (
                    <a
                      href={`mailto:${workspace.email}`}
                      className="workspace-hero-contact-chip"
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
                      className="workspace-hero-contact-chip"
                    >
                      <Icon name="globe" size={15} />
                      <span>
                        {workspace.website.replace(/^https?:\/\//, "")}
                      </span>
                    </a>
                  )}

                  {validSocialLinks.map((item, i) => {
                    const url = typeof item === "string" ? item : item.url;
                    const key = (
                      typeof item === "object" ? item.platform : ""
                    ).toLowerCase();
                    const cfg = PLATFORM_CONFIG[key] || PLATFORM_CONFIG.website;
                    return (
                      <a
                        key={i}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="workspace-hero-contact-chip"
                      >
                        {cfg.icon}
                        <span>{cfg.label}</span>
                      </a>
                    );
                  })}
                </div>
              </div>

              {/* Main CTA Button */}
              <div
                className="workspace-hero-cta-wrap"
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
                    borderRadius: 16,
                    padding: "14px 28px",
                    fontSize: "1.05rem",
                    fontWeight: 800,
                    boxShadow: `0 10px 30px ${primaryColor}60`,
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

            {/* Quick Metrics Bar at Bottom of Hero */}
            <div
              className="workspace-hero-metrics-bar"
              style={{
                marginTop: 20,
                paddingTop: 14,
                border: "none",
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                gap: 16,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: 14,
                    background: `${primaryColor}20`,
                    color: primaryColor,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icon name="briefcase" size={22} />
                </div>
                <div>
                  <div className="workspace-hero-metric-val">
                    {services.length}
                  </div>
                  <div className="workspace-hero-metric-lbl">
                    {isRTL ? "الخدمات المتاحة" : "Available Services"}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: 14,
                    background: `${secondaryColor}20`,
                    color: secondaryColor,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icon name="users" size={22} />
                </div>
                <div>
                  <div className="workspace-hero-metric-val">
                    {totalSpecialistsCount}
                  </div>
                  <div className="workspace-hero-metric-lbl">
                    {isRTL ? "فريق المتخصصين" : "Team Specialists"}
                  </div>
                </div>
              </div>

              {workspace.maximum_booking_days > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div
                    style={{
                      width: 46,
                      height: 46,
                      borderRadius: 14,
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
                    <div className="workspace-hero-metric-val">
                      {workspace.maximum_booking_days} {isRTL ? "يوم" : "days"}
                    </div>
                    <div className="workspace-hero-metric-lbl">
                      {isRTL ? "حجز متاح حتى" : "Max Advance Window"}
                    </div>
                  </div>
                </div>
              )}

              {workspace.timezone?.name && (
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div
                    style={{
                      width: 46,
                      height: 46,
                      borderRadius: 14,
                      background: "rgba(139, 92, 246, 0.2)",
                      color: "#c084fc",
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
                        color: "#ffffff",
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
                        fontSize: "0.84rem",
                        color: "#94a3b8",
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

        {/* Sleek bottom section glow separator */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "2px",
            background: `linear-gradient(90deg, transparent 0%, ${primaryColor}80 50%, transparent 100%)`,
          }}
        />
      </section>

      {/* CONTINUOUS LANDING PAGE SECTIONS */}
      <div className="container" style={{ paddingTop: 16, paddingBottom: 80 }}>
        {/* Section 1: Services Grid */}
        <section
          id="services"
          style={{ scrollMarginTop: 100, marginBottom: 80 }}
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

        {/* Section 3: Specialists & Team — professional bio-card presentation */}
        {specialistRoles.length > 0 && (
          <section
            id="specialists"
            style={{
              scrollMarginTop: 100,
              marginBottom: 80,
              paddingTop: 36,
              borderTop: "1px solid var(--border)",
            }}
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

            {(() => {
              const allSpecialistMembers = [];
              specialistRoles.forEach((role) => {
                if (role.members && Array.isArray(role.members)) {
                  role.members.forEach((m) => {
                    allSpecialistMembers.push({
                      ...m,
                      roleId: role.id,
                      roleName: getTranslatableText(
                        role.name_translations || role.name,
                      ),
                    });
                  });
                }
              });

              if (allSpecialistMembers.length === 0) {
                return (
                  <p
                    style={{
                      color: "var(--text-secondary)",
                      fontSize: "0.88rem",
                      fontStyle: "italic",
                    }}
                  >
                    {isRTL
                      ? "لا يوجد أعضاء متخصصين حالياً."
                      : "No specialist members currently."}
                  </p>
                );
              }

              const displayedSpecialists =
                activeSpecialistRole === "all"
                  ? allSpecialistMembers
                  : allSpecialistMembers.filter(
                      (m) => String(m.roleId) === String(activeSpecialistRole),
                    );

              return (
                <div>
                  {/* Role / Specialist Filter Pill Buttons */}
                  {specialistRoles.length > 0 && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        flexWrap: "wrap",
                        marginBottom: 24,
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => setActiveSpecialistRole("all")}
                        style={{
                          padding: "8px 20px",
                          borderRadius: 999,
                          fontWeight: 700,
                          fontSize: "0.86rem",
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                          background:
                            activeSpecialistRole === "all"
                              ? primaryColor
                              : "var(--surface)",
                          color:
                            activeSpecialistRole === "all"
                              ? "#ffffff"
                              : "var(--heading)",
                          border:
                            activeSpecialistRole === "all"
                              ? `1px solid ${primaryColor}`
                              : "1px solid var(--border)",
                          boxShadow:
                            activeSpecialistRole === "all"
                              ? `0 6px 16px ${primaryColor}35`
                              : "0 2px 8px rgba(0,0,0,0.03)",
                        }}
                      >
                        {isRTL ? "الكل" : "All"} ({allSpecialistMembers.length})
                      </button>

                      {specialistRoles.map((role) => {
                        const roleName = getTranslatableText(
                          role.name_translations || role.name,
                        );
                        const isSelected =
                          String(activeSpecialistRole) === String(role.id);
                        const count = role.members ? role.members.length : 0;
                        return (
                          <button
                            key={role.id}
                            type="button"
                            onClick={() => setActiveSpecialistRole(role.id)}
                            style={{
                              padding: "8px 20px",
                              borderRadius: 999,
                              fontWeight: 700,
                              fontSize: "0.86rem",
                              cursor: "pointer",
                              transition: "all 0.2s ease",
                              background: isSelected
                                ? primaryColor
                                : "var(--surface)",
                              color: isSelected ? "#ffffff" : "var(--heading)",
                              border: isSelected
                                ? `1px solid ${primaryColor}`
                                : "1px solid var(--border)",
                              boxShadow: isSelected
                                ? `0 6px 16px ${primaryColor}35`
                                : "0 2px 8px rgba(0,0,0,0.03)",
                            }}
                          >
                            {roleName} ({count})
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {displayedSpecialists.length > 0 ? (
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fill, minmax(220px, 1fr))",
                        gap: 22,
                      }}
                    >
                      {displayedSpecialists.map((member) => (
                    <Link
                      key={member.id}
                      to={`/workspaces/${idOrSlug}/specialist/${member.id}`}
                      className="specialist-profile-card animate-tab-card"
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        textAlign: "center",
                        padding: "26px 20px 20px",
                        borderRadius: 22,
                        textDecoration: "none",
                        color: "var(--text)",
                        background: "var(--surface)",
                        border: "1px solid var(--border)",
                        boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
                        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                        position: "relative",
                        overflow: "hidden",
                      }}
                    >
                      {/* Top Accent Gradient Line */}
                      <div
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          right: 0,
                          height: 4,
                          background: `linear-gradient(90deg, ${primaryColor}, ${secondaryColor})`,
                        }}
                      />

                      {/* Avatar Ring */}
                      <div
                        style={{
                          position: "relative",
                          marginBottom: 14,
                        }}
                      >
                        <div
                          style={{
                            width: 84,
                            height: 84,
                            borderRadius: "50%",
                            padding: 3,
                            background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                            boxShadow: `0 8px 20px ${primaryColor}22`,
                          }}
                        >
                          <div
                            style={{
                              width: "100%",
                              height: "100%",
                              borderRadius: "50%",
                              overflow: "hidden",
                              background: "var(--surface)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: 800,
                              fontSize: "1.7rem",
                              color: primaryColor,
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
                        </div>
                      </div>

                      {/* Member Info */}
                      <div
                        style={{
                          width: "100%",
                          flex: 1,
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <div
                          style={{
                            fontWeight: 800,
                            fontSize: "1.08rem",
                            color: "var(--heading)",
                            lineHeight: 1.3,
                          }}
                        >
                          {member.name}
                        </div>

                        {/* Category Specialty Pill */}
                        {member.roleName && (
                          <span
                            style={{
                              marginTop: 6,
                              fontSize: "0.76rem",
                              fontWeight: 700,
                              padding: "3px 12px",
                              borderRadius: 20,
                              background: `linear-gradient(135deg, ${primaryColor}15, ${secondaryColor}10)`,
                              color: primaryColor,
                              border: `1px solid ${primaryColor}25`,
                              display: "inline-block",
                            }}
                          >
                            {member.roleName}
                          </span>
                        )}

                        {member.title && (
                          <div
                            style={{
                              fontSize: "0.83rem",
                              color: "var(--text-secondary)",
                              marginTop: 4,
                              fontWeight: 500,
                            }}
                          >
                            {member.title}
                          </div>
                        )}
                      </div>

                      {/* View Profile Action Link Button */}
                      <div
                        style={{
                          marginTop: 18,
                          width: "100%",
                          padding: "9px 16px",
                          borderRadius: 14,
                          background: `linear-gradient(135deg, ${primaryColor}12, ${secondaryColor}08)`,
                          border: `1px solid ${primaryColor}25`,
                          color: primaryColor,
                          fontWeight: 700,
                          fontSize: "0.83rem",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 6,
                          transition: "all 0.2s ease",
                        }}
                      >
                        <span>
                          {isRTL ? "عرض الملف الشخصي" : "View Profile"}
                        </span>
                        <Icon
                          name={isRTL ? "chevron-left" : "chevron-right"}
                          size={14}
                        />
                      </div>
                    </Link>
                  ))}
                    </div>
                  ) : (
                    <p
                      style={{
                        color: "var(--text-secondary)",
                        fontSize: "0.88rem",
                        fontStyle: "italic",
                        marginTop: 14,
                      }}
                    >
                      {isRTL
                        ? "لا يوجد أعضاء متخصصين بهذا التصنيف حالياً."
                        : "No specialists found for this category."}
                    </p>
                  )}
                </div>
              );
            })()}
          </section>
        )}

        {/* Section 4: Portfolio Showcase — photo gallery with captions + lightbox */}
        {galleryItems.length > 0 && (
          <section
            id="portfolio"
            style={{
              scrollMarginTop: 100,
              marginBottom: 80,
              paddingTop: 36,
              borderTop: "1px solid var(--border)",
            }}
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

        {/* Section 5: Booking Rules & Policies — grid of dedicated policy cards */}
        <section
          id="rules"
          style={{
            scrollMarginTop: 100,
            marginBottom: 80,
            paddingTop: 36,
            borderTop: "1px solid var(--border)",
          }}
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
              <Icon name="shield" size={16} />
              <span>{isRTL ? "سياسات وشروط الحجز" : "Booking Policies"}</span>
            </div>
            <h2
              style={{
                fontSize: "1.75rem",
                fontWeight: 800,
                margin: 0,
                color: "var(--text)",
              }}
            >
              {isRTL ? "قواعد وسياسات الحجز" : "Booking Rules & Terms"}
            </h2>
            <p
              style={{
                color: "var(--text-secondary)",
                margin: "6px 0 0 0",
                fontSize: "0.95rem",
              }}
            >
              {isRTL
                ? "سياسات واضحة لضمان تجربة حجز سلسة ومضمونة لجميع العملاء."
                : "Clear workspace policies to guarantee a seamless booking experience."}
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: 20,
            }}
          >
            {/* Policy Card 1: Confirmation */}
            <div
              className="card card-hover"
              style={{
                padding: 24,
                borderRadius: 20,
                border: "1px solid var(--border)",
                display: "flex",
                flexDirection: "column",
                gap: 14,
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  background: workspace.auto_confirm_appointments
                    ? "rgba(16, 185, 129, 0.15)"
                    : "rgba(245, 158, 11, 0.15)",
                  color: workspace.auto_confirm_appointments
                    ? "#10b981"
                    : "#f59e0b",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon name="shield" size={24} />
              </div>
              <div>
                <div
                  style={{
                    fontSize: "0.84rem",
                    color: "var(--text-secondary)",
                    fontWeight: 600,
                    marginBottom: 4,
                  }}
                >
                  {isRTL ? "طريقة تأكيد الحجوزات" : "Confirmation Method"}
                </div>
                <div
                  style={{
                    fontSize: "1.1rem",
                    fontWeight: 800,
                    color: workspace.auto_confirm_appointments
                      ? "#10b981"
                      : "#f59e0b",
                  }}
                >
                  {workspace.auto_confirm_appointments
                    ? isRTL
                      ? "تأكيد فوري تلقائي"
                      : "Instant Auto Confirmation"
                    : isRTL
                      ? "مراجعة قبل التأكيد"
                      : "Manual Approval"}
                </div>
              </div>
            </div>

            {/* Policy Card 2: Minimum Notice */}
            {workspace.minimum_booking_notice_minutes > 0 && (
              <div
                className="card card-hover"
                style={{
                  padding: 24,
                  borderRadius: 20,
                  border: "1px solid var(--border)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 14,
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 14,
                    background: `${primaryColor}15`,
                    color: primaryColor,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icon name="clock" size={24} />
                </div>
                <div>
                  <div
                    style={{
                      fontSize: "0.84rem",
                      color: "var(--text-secondary)",
                      fontWeight: 600,
                      marginBottom: 4,
                    }}
                  >
                    {isRTL ? "الحد الأدنى للإشعار المسبق" : "Minimum Notice"}
                  </div>
                  <div
                    style={{
                      fontSize: "1.1rem",
                      fontWeight: 800,
                      color: "var(--text)",
                    }}
                  >
                    {workspace.minimum_booking_notice_minutes}{" "}
                    {t("durationMinutes")}
                  </div>
                </div>
              </div>
            )}

            {/* Policy Card 3: Max Advance Window */}
            {workspace.maximum_booking_days > 0 && (
              <div
                className="card card-hover"
                style={{
                  padding: 24,
                  borderRadius: 20,
                  border: "1px solid var(--border)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 14,
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 14,
                    background: `${secondaryColor}15`,
                    color: secondaryColor,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icon name="calendar" size={24} />
                </div>
                <div>
                  <div
                    style={{
                      fontSize: "0.84rem",
                      color: "var(--text-secondary)",
                      fontWeight: 600,
                      marginBottom: 4,
                    }}
                  >
                    {isRTL ? "أقصى فترة حجز مسبق" : "Max Advance Window"}
                  </div>
                  <div
                    style={{
                      fontSize: "1.1rem",
                      fontWeight: 800,
                      color: "var(--text)",
                    }}
                  >
                    {workspace.maximum_booking_days} {isRTL ? "يوماً" : "days"}
                  </div>
                </div>
              </div>
            )}

            {/* Policy Card 4: Timezone */}
            {workspace.timezone?.name && (
              <div
                className="card card-hover"
                style={{
                  padding: 24,
                  borderRadius: 20,
                  border: "1px solid var(--border)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 14,
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 14,
                    background: "rgba(139, 92, 246, 0.15)",
                    color: "#8b5cf6",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icon name="globe" size={24} />
                </div>
                <div>
                  <div
                    style={{
                      fontSize: "0.84rem",
                      color: "var(--text-secondary)",
                      fontWeight: 600,
                      marginBottom: 4,
                    }}
                  >
                    {isRTL ? "المنطقة الزمنية للحجز" : "Booking Timezone"}
                  </div>
                  <div
                    style={{
                      fontSize: "1.05rem",
                      fontWeight: 800,
                      color: "var(--text)",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {workspace.timezone.name}
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

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
                style={{
                  fontSize: "1.75rem",
                  fontWeight: 800,
                  marginBottom: 8,
                }}
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
                    style={{
                      padding: 28,
                      borderRadius: 20,
                      textAlign: "center",
                    }}
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
                    style={{
                      padding: 28,
                      borderRadius: 20,
                      textAlign: "center",
                    }}
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
                    style={{
                      padding: 28,
                      borderRadius: 20,
                      textAlign: "center",
                    }}
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
      </div>

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
                  width: 64,
                  height: 64,
                  borderRadius: "50%",
                  background: "rgba(255, 255, 255, 0.22)",
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                  border: "1px solid rgba(255, 255, 255, 0.4)",
                  marginBottom: 22,
                  boxShadow: "0 10px 24px rgba(0,0,0,0.18)",
                  color: "#ffffff",
                }}
              >
                <Icon name="sparkles" size={28} style={{ color: "#ffffff" }} />
              </div>

              <h2
                style={{
                  fontSize: "2.1rem",
                  fontWeight: 900,
                  marginBottom: 14,
                  lineHeight: 1.35,
                  color: "#ffffff",
                }}
              >
                {isRTL ? (
                  <span style={{ color: "#ffffff" }}>
                    جاهز لحجز موعدك لدى{" "}
                    <bdi
                      style={{
                        unicodeBidi: "isolate",
                        color: "#ffffff",
                        fontWeight: 900,
                      }}
                    >
                      {workspace.name}
                    </bdi>
                    ؟
                  </span>
                ) : (
                  <span style={{ color: "#ffffff" }}>
                    Ready to book your appointment at{" "}
                    <bdi
                      style={{
                        unicodeBidi: "isolate",
                        color: "#ffffff",
                        fontWeight: 900,
                      }}
                    >
                      {workspace.name}
                    </bdi>
                    ?
                  </span>
                )}
              </h2>

              <p
                style={{
                  fontSize: "1.08rem",
                  color: "rgba(255, 255, 255, 0.95)",
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
                  background: "#ffffff",
                  color: primaryColor,
                  fontWeight: 800,
                  padding: "16px 36px",
                  borderRadius: 999,
                  border: "none",
                  boxShadow: "0 12px 32px rgba(0,0,0,0.25)",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 10,
                  fontSize: "1.05rem",
                  transition: "all 0.25s ease",
                }}
              >
                <Icon
                  name="calendar"
                  size={20}
                  style={{ color: primaryColor }}
                />
                <span style={{ color: primaryColor, fontWeight: 800 }}>
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
