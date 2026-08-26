import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import client, { endpoints } from "../../api/client";
import { useLanguage } from "../../context/LanguageContext";
import SEO from "../../components/ui/SEO";
import LazyImage from "../../components/ui/LazyImage";
import {
  ProfileSkeleton,
  ServiceCardSkeleton,
} from "../../components/ui/Skeleton";
import Icon from "../../components/common/Icon";
import { formatCurrency } from "../../utils/currency";

export default function WorkspaceProfilePage() {
  const { idOrSlug } = useParams();
  const { t, isRTL } = useLanguage();

  const [workspace, setWorkspace] = useState(null);
  const [services, setServices] = useState([]);
  const [specialistRoles, setSpecialistRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [servicesLoading, setServicesLoading] = useState(true);

  // Selected service slot checker state
  const [activeServiceId, _setActiveServiceId] = useState(null);
  const [selectedDate, _setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [_slots, setSlots] = useState([]);
  const [_slotsLoading, setSlotsLoading] = useState(false);

  const getTranslatableText = (val) => {
    if (!val) return "";
    if (typeof val === "string") return val;
    if (typeof val === "object") {
      return isRTL
        ? val.ar || val.en || Object.values(val)[0] || ""
        : val.en || val.ar || Object.values(val)[0] || "";
    }
    return String(val);
  };

  // Fetch workspace detail & services
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

  // Fetch available slots for a service when date or service changes
  const fetchSlots = useCallback(
    (serviceId, date) => {
      if (!serviceId || !date) return;
      setSlotsLoading(true);
      client
        .get(endpoints.publicWorkspaceSlots(idOrSlug, serviceId), {
          params: { date },
        })
        .then((res) => {
          setSlots(res.data.data || []);
          setSlotsLoading(false);
        })
        .catch(() => {
          setSlots([]);
          setSlotsLoading(false);
        });
    },
    [idOrSlug],
  );

  useEffect(() => {
    if (activeServiceId && selectedDate) {
      fetchSlots(activeServiceId, selectedDate);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchSlots]);

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
          style={{ padding: "60px 20px", textAlign: "center" }}
        >
          <div
            className="card"
            style={{ padding: 48, maxWidth: 500, margin: "0 auto" }}
          >
            <h1 style={{ fontSize: "1.4rem", marginBottom: 12 }}>
              {t("noWorkspacesFound")}
            </h1>
            <p style={{ color: "var(--text-secondary)", marginBottom: 24 }}>
              {isRTL
                ? "عذراً، مساحة العمل غير موجودة أو تم تعطيلها."
                : "Sorry, this workspace was not found or is disabled."}
            </p>
            <Link to="/workspaces" className="btn btn-primary">
              {t("exploreWorkspaces")}
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const primaryColor = workspace.primary_color || "var(--primary)";
  const secondaryColor = workspace.secondary_color || "var(--secondary)";
  const hoverColor = workspace.hover_color || primaryColor;
  const initial = workspace.name ? workspace.name.charAt(0).toUpperCase() : "W";

  // JSON-LD for LocalBusiness
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: workspace.name,
    url: `https://cal.saabq.com/workspaces/${workspace.slug}`,
    ...(workspace.booking_short_intro && {
      description: workspace.booking_short_intro,
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

  // Breadcrumb JSON-LD
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: isRTL ? "الرئيسية" : "Home",
        item: "https://cal.saabq.com/",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: isRTL ? "مساحات العمل" : "Workspaces",
        item: "https://cal.saabq.com/workspaces",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: workspace.name,
        item: `https://cal.saabq.com/workspaces/${workspace.slug}`,
      },
    ],
  };

  return (
    <main
      className="main-content"
      style={{
        "--primary": primaryColor,
        "--primary-hover": hoverColor,
        "--secondary": secondaryColor,
      }}
    >
      <SEO
        title={workspace.name}
        description={
          workspace.booking_short_intro ||
          workspace.description ||
          (isRTL
            ? "حجز مواعيد وخدمات في مساحة العمل"
            : "Book appointments and services at this workspace")
        }
        canonical={`/workspaces/${workspace.slug}`}
        ogType="business.business"
        ogImage={workspace.logo_url || workspace.cover_url}
        jsonLd={[jsonLd, breadcrumbJsonLd]}
      />

      {/* Profile Header Banner Section */}
      <div
        className="workspace-profile-cover"
        style={{
          height: 240,
          background: workspace.cover_url
            ? `url(${workspace.cover_url}) center/cover no-repeat`
            : `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
          position: "relative",
          borderBottom: "1px solid rgba(0,0,0,0.05)",
        }}
        role="img"
        aria-label={
          isRTL ? `غلاف ${workspace.name}` : `${workspace.name} cover`
        }
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to top, var(--background) 0%, transparent 50%)",
            pointerEvents: "none",
          }}
        />
      </div>

      <div
        className="container"
        style={{
          marginTop: -80,
          position: "relative",
          zIndex: 2,
          marginBottom: 40,
        }}
      >
        <article
          className="card"
          style={{
            padding: 32,
            borderRadius: "var(--radius-2xl, 24px)",
            boxShadow: "0 12px 40px rgba(0,0,0,0.06)",
            border: "1px solid rgba(255,255,255,0.1)",
            backdropFilter: "blur(10px)",
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
                width: 110,
                height: 110,
                borderRadius: "var(--radius-2xl, 20px)",
                background: "var(--surface)",
                border: "4px solid var(--surface)",
                boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "2.8rem",
                fontWeight: 800,
                color: primaryColor,
                flexShrink: 0,
                marginTop: -16,
              }}
            >
              {workspace.logo_url ? (
                <LazyImage
                  src={workspace.logo_url}
                  alt={`${workspace.name} logo`}
                  width={96}
                  height={96}
                  objectFit="cover"
                />
              ) : (
                initial
              )}
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 260 }}>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  gap: 12,
                  marginBottom: 8,
                }}
              >
                <h1
                  style={{
                    fontSize: "1.8rem",
                    fontWeight: 800,
                    color: "var(--text)",
                    margin: 0,
                  }}
                >
                  {workspace.name}
                </h1>
                {workspace.booking_enabled ? (
                  <span
                    className="badge badge-success"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: "currentColor",
                      }}
                      aria-hidden="true"
                    />
                    {isRTL ? "الحجز مفعل" : "Booking Active"}
                  </span>
                ) : (
                  <span className="badge badge-warning">
                    {isRTL ? "الحجز موقوف" : "Booking Paused"}
                  </span>
                )}
              </div>

              {workspace.slug && (
                <div style={{ marginBottom: 12 }}>
                  <span
                    style={{
                      direction: "ltr",
                      display: "inline-block",
                      color: "var(--primary)",
                      fontWeight: 600,
                      fontSize: "0.9rem",
                      background:
                        "var(--primary-subtle, rgba(232, 141, 34, 0.08))",
                      padding: "2px 10px",
                      borderRadius: "var(--radius-sm)",
                    }}
                  >
                    @{workspace.slug}
                  </span>
                </div>
              )}

              <p
                style={{
                  color: "var(--text-secondary)",
                  fontSize: "0.98rem",
                  lineHeight: 1.6,
                  marginBottom: 16,
                }}
              >
                {workspace.booking_short_intro ||
                  workspace.description ||
                  (isRTL
                    ? "مساحة عمل متميزة تقدم خدمات حجز وجدولة المواعيد بشكل احترافي."
                    : "A premium workspace offering professional appointment scheduling services.")}
              </p>

              {/* Contact & Social Links */}
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 16,
                  fontSize: "0.88rem",
                  color: "var(--text-secondary)",
                }}
              >
                {workspace.email && (
                  <a
                    href={`mailto:${workspace.email}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      color: "inherit",
                    }}
                  >
                    <Icon name="mail" size={15} />
                    <span>{workspace.email}</span>
                  </a>
                )}
                {workspace.phone && (
                  <a
                    href={`tel:${workspace.phone}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      color: "inherit",
                    }}
                  >
                    <Icon name="phone" size={15} />
                    <span>{workspace.phone}</span>
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
                      gap: 6,
                      color: "var(--primary)",
                    }}
                  >
                    <Icon name="globe" size={15} />
                    <span>{workspace.website.replace(/^https?:\/\//, "")}</span>
                  </a>
                )}
              </div>

              {/* Rich Customer Workspace Info Section */}
              <div
                style={{
                  marginTop: 24,
                  paddingTop: 20,
                  borderTop: "1px solid var(--border)",
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: 16,
                  fontSize: "0.88rem",
                }}
              >
                {workspace.timezone?.name && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      color: "var(--text-secondary)",
                    }}
                  >
                    <Icon name="clock" size={16} />
                    <span>
                      <strong>
                        {isRTL ? "المنطقة الزمنية:" : "Timezone:"}
                      </strong>{" "}
                      {workspace.timezone.name} (
                      {workspace.timezone.offset || "UTC"})
                    </span>
                  </div>
                )}
                {workspace.country?.name && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      color: "var(--text-secondary)",
                    }}
                  >
                    <Icon name="map-pin" size={16} />
                    <span>
                      <strong>
                        {isRTL ? "الدولة / المدينة:" : "Location:"}
                      </strong>{" "}
                      {workspace.country.name}
                      {workspace.city?.name ? ` - ${workspace.city.name}` : ""}
                    </span>
                  </div>
                )}
                {workspace.minimum_booking_notice_minutes > 0 && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      color: "var(--text-secondary)",
                    }}
                  >
                    <Icon name="shield" size={16} />
                    <span>
                      <strong>
                        {isRTL ? "الإشعار المسبق للحجز:" : "Notice required:"}
                      </strong>{" "}
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
                      gap: 8,
                      color: "var(--text-secondary)",
                    }}
                  >
                    <Icon name="calendar" size={16} />
                    <span>
                      <strong>
                        {isRTL ? "الحجز متاح حتى:" : "Max advance booking:"}
                      </strong>{" "}
                      {workspace.maximum_booking_days} {isRTL ? "يوم" : "days"}
                    </span>
                  </div>
                )}
              </div>

              {/* Social Links List */}
              {(() => {
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

                const validLinks = linksList.filter((item) => {
                  const url = typeof item === "string" ? item : item?.url;
                  return Boolean(
                    url && typeof url === "string" && url.trim() !== "",
                  );
                });

                if (validLinks.length === 0) return null;

                const PLATFORM_CONFIG = {
                  website: {
                    label: isRTL ? "الموقع الإلكتروني" : "Website",
                    icon: <Icon name="globe" size={15} />,
                  },
                  x: {
                    label: "X / Twitter",
                    icon: <Icon name="x-social" size={14} />,
                  },
                  twitter: {
                    label: "Twitter",
                    icon: <Icon name="twitter" size={14} />,
                  },
                  linkedin: {
                    label: "LinkedIn",
                    icon: <Icon name="linkedin" size={14} />,
                  },
                  instagram: {
                    label: "Instagram",
                    icon: <Icon name="instagram" size={14} />,
                  },
                  facebook: {
                    label: "Facebook",
                    icon: <Icon name="facebook" size={14} />,
                  },
                  youtube: {
                    label: "YouTube",
                    icon: <Icon name="youtube" size={14} />,
                  },
                  tiktok: {
                    label: "TikTok",
                    icon: <Icon name="tiktok" size={14} />,
                  },
                  whatsapp: {
                    label: "WhatsApp",
                    icon: <Icon name="whatsapp" size={14} />,
                  },
                };

                return (
                  <div
                    style={{
                      marginTop: 20,
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 10,
                    }}
                  >
                    {validLinks.map((item, idx) => {
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
                          aria-label={`${config.label} — ${workspace.name}`}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 8,
                            borderRadius: "var(--radius-full, 9999px)",
                            padding: "6px 14px",
                            fontSize: "0.85rem",
                            fontWeight: 600,
                            textDecoration: "none",
                            transition: "all 0.2s ease",
                          }}
                        >
                          {config.icon}
                          <span>{config.label}</span>
                        </a>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          </div>
        </article>
      </div>

      {/* Offered Services Section */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div
            className="section-header"
            style={{ textStyle: "inherit", marginBottom: 24 }}
          >
            <h2 style={{ fontSize: "1.6rem", fontWeight: 800 }}>
              {t("offeredServices")}
            </h2>
            <p style={{ color: "var(--text-secondary)" }}>
              {isRTL
                ? 'انقر على زر "حجز موعد" للانتقال لصفحة حجز الموعد وتأكيد التفاصيل.'
                : 'Click "Book Appointment" to proceed to dedicated booking page.'}
            </p>
          </div>

          {servicesLoading ? (
            <ServiceCardSkeleton count={3} />
          ) : services.length === 0 ? (
            <div
              className="card"
              style={{
                padding: 40,
                textAlign: "center",
                color: "var(--text-secondary)",
              }}
            >
              <p>{t("noServicesFound")}</p>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: 24,
              }}
            >
              {services.map((srv) => (
                <article
                  key={srv.id}
                  className="card"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    justify: "space-between",
                    padding: 24,
                    borderRadius: "var(--radius-lg)",
                    transition: "transform 0.2s, box-shadow 0.2s",
                  }}
                >
                  <div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        gap: 12,
                        flexWrap: "wrap",
                        marginBottom: 12,
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 140 }}>
                        <h3
                          style={{
                            fontSize: "1.2rem",
                            fontWeight: 700,
                            margin: 0,
                            color: "var(--text)",
                          }}
                        >
                          {getTranslatableText(srv.name)}
                        </h3>
                        {srv.booking_enabled === false && (
                          <span
                            style={{
                              fontSize: "0.72rem",
                              background: "#fee2e2",
                              color: "#991b1b",
                              padding: "2px 8px",
                              borderRadius: 12,
                              fontWeight: 700,
                              marginTop: 4,
                              display: "inline-block",
                            }}
                          >
                            {isRTL
                              ? "الحجز أونلاين معطّل"
                              : "Online Booking Disabled"}
                          </span>
                        )}
                      </div>
                      <span
                        style={{
                          fontSize: "1.05rem",
                          fontWeight: 800,
                          color: primaryColor,
                          whiteSpace: "nowrap",
                          flexShrink: 0,
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
                        fontSize: "0.88rem",
                        lineHeight: 1.5,
                        marginBottom: 20,
                      }}
                    >
                      {getTranslatableText(
                        srv.short_description || srv.description,
                      ) ||
                        (isRTL
                          ? "خدمة متميزة توفرها مساحة العمل للجلسات والاستشارات."
                          : "A premium service for sessions and consultations.")}
                    </p>
                  </div>

                  {srv.booking_enabled !== false ? (
                    <Link
                      to={`/workspaces/${idOrSlug}/book?service=${srv.slug || srv.id}`}
                      className="btn btn-primary btn-md"
                      style={{
                        width: "100%",
                        justifyContent: "center",
                        gap: 8,
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
                        border: "1px solid var(--border, #d1d5db)",
                        color: "var(--text-secondary, #4b5563)",
                        fontWeight: 700,
                        fontSize: "0.86rem",
                        padding: "10px 16px",
                        borderRadius: "var(--radius-md, 8px)",
                        display: "inline-flex",
                        alignItems: "center",
                      }}
                    >
                      <Icon
                        name="calendar"
                        size={16}
                        style={{ flexShrink: 0, opacity: 0.85 }}
                      />
                      <span style={{ color: "var(--text-secondary, #4b5563)" }}>
                        {isRTL
                          ? "غير متاح للحجز أونلاين"
                          : "Not Available for Online Booking"}
                      </span>
                    </button>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Specialists Section */}
      {specialistRoles.length > 0 && (
        <section
          style={{
            padding: "40px 20px 80px",
            background: "var(--surface)",
            borderTop: "1px solid var(--border)",
          }}
        >
          <div className="container" style={{ maxWidth: 1000 }}>
            <h2
              style={{
                fontSize: "1.5rem",
                fontWeight: 800,
                marginBottom: 24,
                color: "var(--text)",
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <Icon name="users" size={24} style={{ color: primaryColor }} />
              {isRTL ? "المتخصصون" : "Specialists"}
            </h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                gap: 32,
              }}
            >
              {specialistRoles.map((role) => (
                <div key={role.id}>
                  <h3
                    style={{
                      fontSize: "1.1rem",
                      fontWeight: 700,
                      marginBottom: 16,
                      color: "var(--text)",
                      paddingBottom: 8,
                      borderBottom: "1px solid var(--border)",
                    }}
                  >
                    {getTranslatableText(role.name_translations || role.name)}
                  </h3>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 12,
                    }}
                  >
                    {role.members && role.members.length > 0 ? (
                      role.members.map((member) => (
                        <Link
                          key={member.id}
                          to={`/workspaces/${idOrSlug}/specialist/${member.id}`}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 16,
                            padding: 20,
                            background: "var(--surface)",
                            borderRadius: "var(--radius-xl, 16px)",
                            textDecoration: "none",
                            color: "var(--text)",
                            border: "1px solid var(--border)",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.02)",
                            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                            position: "relative",
                            overflow: "hidden",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = primaryColor;
                            e.currentTarget.style.transform =
                              "translateY(-4px)";
                            e.currentTarget.style.boxShadow = `0 12px 24px ${primaryColor}20`;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = "var(--border)";
                            e.currentTarget.style.transform = "none";
                            e.currentTarget.style.boxShadow =
                              "0 4px 12px rgba(0,0,0,0.02)";
                          }}
                        >
                          <div
                            style={{
                              position: "absolute",
                              top: 0,
                              left: 0,
                              width: "4px",
                              height: "100%",
                              background: primaryColor,
                              opacity: 0,
                              transition: "opacity 0.2s ease",
                            }}
                            className="hover-indicator"
                          />
                          <div
                            style={{
                              width: 48,
                              height: 48,
                              borderRadius: "50%",
                              background: primaryColor + "20",
                              color: primaryColor,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: 700,
                              fontSize: "1.2rem",
                              flexShrink: 0,
                              overflow: "hidden",
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
                              style={{ fontWeight: 700, fontSize: "1.05rem" }}
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
                          <div
                            style={{
                              marginInlineStart: "auto",
                              color: "var(--text-secondary)",
                            }}
                          >
                            <Icon
                              name={isRTL ? "chevron-left" : "chevron-right"}
                              size={20}
                            />
                          </div>
                        </Link>
                      ))
                    ) : (
                      <p
                        style={{
                          color: "var(--text-secondary)",
                          fontSize: "0.9rem",
                          fontStyle: "italic",
                        }}
                      >
                        {isRTL
                          ? "لا يوجد متخصصون متاحون حالياً."
                          : "No specialists available at the moment."}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
