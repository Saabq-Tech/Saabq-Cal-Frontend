import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import client, { endpoints } from '../../api/client';
import { useLanguage } from '../../context/LanguageContext';
import SEO from '../../components/ui/SEO';
import LazyImage from '../../components/ui/LazyImage';
import { ProfileSkeleton, ServiceCardSkeleton } from '../../components/ui/Skeleton';
import Icon from '../../components/common/Icon';
import { formatCurrency } from '../../utils/currency';


export default function WorkspaceProfilePage() {
  const { idOrSlug } = useParams();
  const { t, isRTL } = useLanguage();

  const [workspace, setWorkspace] = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [servicesLoading, setServicesLoading] = useState(true);

  // Selected service slot checker state
  const [_activeServiceId, _setActiveServiceId] = useState(null);
  const [_selectedDate, _setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [_slots, _setSlots] = useState([]);
  const [_slotsLoading, _setSlotsLoading] = useState(false);

  const getTranslatableText = (val) => {
    if (!val) return '';
    if (typeof val === 'string') return val;
    if (typeof val === 'object') {
      return isRTL ? (val.ar || val.en || Object.values(val)[0] || '') : (val.en || val.ar || Object.values(val)[0] || '');
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
      client.get(endpoints.publicWorkspaceServices(idOrSlug)).catch(() => ({ data: { data: [] } })),
    ])
      .then(([wsRes, srvRes]) => {
        setWorkspace(wsRes.data?.data || null);
        setServices(srvRes.data?.data || []);
      })
      .catch(() => {
        setWorkspace(null);
        setServices([]);
      })
      .finally(() => {
        setLoading(false);
        setServicesLoading(false);
      });
  }, [idOrSlug]);

  // Fetch available slots for a service when date or service changes
  const fetchSlots = useCallback((serviceId, date) => {
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
  }, [idOrSlug]);

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
        <div className="container" style={{ padding: '60px 20px', textAlign: 'center' }}>
          <div className="card" style={{ padding: 48, maxWidth: 500, margin: '0 auto' }}>
            <h1 style={{ fontSize: '1.4rem', marginBottom: 12 }}>{t('noWorkspacesFound')}</h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
              {isRTL ? 'عذراً، مساحة العمل غير موجودة أو تم تعطيلها.' : 'Sorry, this workspace was not found or is disabled.'}
            </p>
            <Link to="/workspaces" className="btn btn-primary">
              {t('exploreWorkspaces')}
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const primaryColor = workspace.primary_color || 'var(--primary)';
  const secondaryColor = workspace.secondary_color || 'var(--secondary)';
  const hoverColor = workspace.hover_color || primaryColor;
  const initial = workspace.name ? workspace.name.charAt(0).toUpperCase() : 'W';

  // JSON-LD for LocalBusiness
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: workspace.name,
    url: `https://cal.saabq.com/workspaces/${workspace.slug}`,
    ...(workspace.booking_short_intro && { description: workspace.booking_short_intro }),
    ...(workspace.logo_url && { image: workspace.logo_url }),
    ...(workspace.email && { email: workspace.email }),
    ...(workspace.phone && { telephone: workspace.phone }),
    ...(workspace.website && { sameAs: [workspace.website] }),
    ...(workspace.address && {
      address: {
        '@type': 'PostalAddress',
        streetAddress: workspace.address,
        ...(workspace.country?.name && { addressCountry: workspace.country.name }),
        ...(workspace.city?.name && { addressLocality: workspace.city.name }),
      },
    }),
  };

  // Breadcrumb JSON-LD
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: isRTL ? 'الرئيسية' : 'Home', item: 'https://cal.saabq.com/' },
      { '@type': 'ListItem', position: 2, name: isRTL ? 'مساحات العمل' : 'Workspaces', item: 'https://cal.saabq.com/workspaces' },
      { '@type': 'ListItem', position: 3, name: workspace.name, item: `https://cal.saabq.com/workspaces/${workspace.slug}` },
    ],
  };

  return (
    <main
      className="main-content"
      style={{
        '--primary': primaryColor,
        '--primary-hover': hoverColor,
        '--secondary': secondaryColor,
      }}
    >
      <SEO
        title={workspace.name}
        description={workspace.booking_short_intro || workspace.description || (isRTL ? 'حجز مواعيد وخدمات في مساحة العمل' : 'Book appointments and services at this workspace')}
        canonical={`/workspaces/${workspace.slug}`}
        ogType="business.business"
        ogImage={workspace.logo_url || workspace.cover_url}
        jsonLd={[jsonLd, breadcrumbJsonLd]}
      />

      {/* Profile Header Banner Section */}
      <div
        className="workspace-profile-cover"
        style={{
          height: 180,
          background: workspace.cover_url
            ? `url(${workspace.cover_url}) center/cover no-repeat`
            : `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
          position: 'relative',
        }}
        role="img"
        aria-label={isRTL ? `غلاف ${workspace.name}` : `${workspace.name} cover`}
      />

      <div className="container" style={{ marginTop: -50, position: 'relative', zIndex: 2, marginBottom: 40 }}>
        <article className="card" style={{ padding: 28 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'flex-start' }}>
            {/* Logo */}
            <div
              style={{
                width: 96,
                height: 96,
                borderRadius: 'var(--radius-xl, 16px)',
                background: 'var(--surface)',
                border: '4px solid var(--background)',
                boxShadow: 'var(--shadow-md)',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2.4rem',
                fontWeight: 800,
                color: primaryColor,
                flexShrink: 0,
              }}
            >
              {workspace.logo_url ? (
                <LazyImage src={workspace.logo_url} alt={`${workspace.name} logo`} width={96} height={96} objectFit="cover" />
              ) : (
                initial
              )}
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 260 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text)', margin: 0 }}>
                  {workspace.name}
                </h1>
                {workspace.booking_enabled ? (
                  <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} aria-hidden="true" />
                    {isRTL ? 'الحجز مفعل' : 'Booking Active'}
                  </span>
                ) : (
                  <span className="badge badge-warning">{isRTL ? 'الحجز موقوف' : 'Booking Paused'}</span>
                )}
              </div>

              {workspace.slug && (
                <div style={{ marginBottom: 12 }}>
                  <span
                    style={{
                      direction: 'ltr',
                      display: 'inline-block',
                      color: 'var(--primary)',
                      fontWeight: 600,
                      fontSize: '0.9rem',
                      background: 'var(--primary-subtle, rgba(232, 141, 34, 0.08))',
                      padding: '2px 10px',
                      borderRadius: 'var(--radius-sm)',
                    }}
                  >
                    @{workspace.slug}
                  </span>
                </div>
              )}

              <p style={{ color: 'var(--text-secondary)', fontSize: '0.98rem', lineHeight: 1.6, marginBottom: 16 }}>
                {workspace.booking_short_intro || workspace.description || (isRTL ? 'مساحة عمل متميزة تقدم خدمات حجز وجدولة المواعيد بشكل احترافي.' : 'A premium workspace offering professional appointment scheduling services.')}
              </p>

              {/* Contact & Social Links */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                {workspace.email && (
                  <a href={`mailto:${workspace.email}`} style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'inherit' }}>
                    <Icon name="mail" size={15} />
                    <span>{workspace.email}</span>
                  </a>
                )}
                {workspace.phone && (
                  <a href={`tel:${workspace.phone}`} style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'inherit' }}>
                    <Icon name="phone" size={15} />
                    <span>{workspace.phone}</span>
                  </a>
                )}
                {workspace.website && (
                  <a href={workspace.website} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--primary)' }}>
                    <Icon name="globe" size={15} />
                    <span>{workspace.website.replace(/^https?:\/\//, '')}</span>
                  </a>
                )}
              </div>
              
              {/* Rich Customer Workspace Info Section */}
              <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--border)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, fontSize: '0.88rem' }}>
                {workspace.timezone?.name && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)' }}>
                    <Icon name="clock" size={16} />
                    <span><strong>{isRTL ? 'المنطقة الزمنية:' : 'Timezone:'}</strong> {workspace.timezone.name} ({workspace.timezone.offset || 'UTC'})</span>
                  </div>
                )}
                {workspace.country?.name && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)' }}>
                    <Icon name="map-pin" size={16} />
                    <span><strong>{isRTL ? 'الدولة / المدينة:' : 'Location:'}</strong> {workspace.country.name}{workspace.city?.name ? ` - ${workspace.city.name}` : ''}</span>
                  </div>
                )}
                {workspace.minimum_booking_notice_minutes > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)' }}>
                    <Icon name="shield" size={16} />
                    <span><strong>{isRTL ? 'الإشعار المسبق للحجز:' : 'Notice required:'}</strong> {workspace.minimum_booking_notice_minutes} {t('durationMinutes')}</span>
                  </div>
                )}
                {workspace.maximum_booking_days > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)' }}>
                    <Icon name="calendar" size={16} />
                    <span><strong>{isRTL ? 'الحجز متاح حتى:' : 'Max advance booking:'}</strong> {workspace.maximum_booking_days} {isRTL ? 'يوم' : 'days'}</span>
                  </div>
                )}
              </div>

              {/* Social Links List */}
              {(() => {
                const rawLinks = workspace.social_links;
                let linksList = [];
                if (Array.isArray(rawLinks)) {
                  linksList = rawLinks;
                } else if (rawLinks && typeof rawLinks === 'object') {
                  linksList = Object.entries(rawLinks).map(([k, v]) => {
                    if (v && typeof v === 'object') {
                      return { platform: v.platform || k, url: v.url || v.link || String(v) };
                    }
                    return { platform: k, url: v };
                  });
                }

                const validLinks = linksList.filter((item) => {
                  const url = typeof item === 'string' ? item : item?.url;
                  return Boolean(url && typeof url === 'string' && url.trim() !== '');
                });

                if (validLinks.length === 0) return null;

                const PLATFORM_CONFIG = {
                  website: {
                    label: isRTL ? 'الموقع الإلكتروني' : 'Website',
                    icon: <Icon name="globe" size={15} />,
                  },
                  x: {
                    label: 'X / Twitter',
                    icon: <Icon name="x-social" size={14} />,
                  },
                  twitter: {
                    label: 'Twitter',
                    icon: <Icon name="twitter" size={14} />,
                  },
                  linkedin: {
                    label: 'LinkedIn',
                    icon: <Icon name="linkedin" size={14} />,
                  },
                  instagram: {
                    label: 'Instagram',
                    icon: <Icon name="instagram" size={14} />,
                  },
                  facebook: {
                    label: 'Facebook',
                    icon: <Icon name="facebook" size={14} />,
                  },
                  youtube: {
                    label: 'YouTube',
                    icon: <Icon name="youtube" size={14} />,
                  },
                  tiktok: {
                    label: 'TikTok',
                    icon: <Icon name="tiktok" size={14} />,
                  },
                  whatsapp: {
                    label: 'WhatsApp',
                    icon: <Icon name="whatsapp" size={14} />,
                  },
                };

                return (
                  <div style={{ marginTop: 20, display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                    {validLinks.map((item, idx) => {
                      const platformKey = (typeof item === 'object' && item.platform ? item.platform : 'website').toLowerCase();
                      const url = typeof item === 'string' ? item : item.url;
                      const href = url.startsWith('http') ? url : `https://${url}`;
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
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 8,
                            borderRadius: 'var(--radius-full, 9999px)',
                            padding: '6px 14px',
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            textDecoration: 'none',
                            transition: 'all 0.2s ease',
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
          <div className="section-header" style={{ textStyle: 'inherit', marginBottom: 24 }}>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800 }}>{t('offeredServices')}</h2>
            <p style={{ color: 'var(--text-secondary)' }}>
              {isRTL ? 'انقر على زر "حجز موعد" للانتقال لصفحة حجز الموعد وتأكيد التفاصيل.' : 'Click "Book Appointment" to proceed to dedicated booking page.'}
            </p>
          </div>

          {servicesLoading ? (
            <ServiceCardSkeleton count={3} />
          ) : services.length === 0 ? (
            <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>
              <p>{t('noServicesFound')}</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24 }}>
              {services.map((srv) => (
                <article
                  key={srv.id}
                  className="card"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justify: 'space-between',
                    padding: 24,
                    borderRadius: 'var(--radius-lg)',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
                      <div style={{ flex: 1, minWidth: 140 }}>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: 'var(--text)' }}>
                          {getTranslatableText(srv.name)}
                        </h3>
                        {srv.booking_enabled === false && (
                          <span style={{ fontSize: '0.72rem', background: '#fee2e2', color: '#991b1b', padding: '2px 8px', borderRadius: 12, fontWeight: 700, marginTop: 4, display: 'inline-block' }}>
                            {isRTL ? 'الحجز أونلاين معطّل' : 'Online Booking Disabled'}
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: '1.05rem', fontWeight: 800, color: primaryColor, whiteSpace: 'nowrap', flexShrink: 0 }}>
                        {formatCurrency(srv.price, srv.currency_detail || srv.currency, isRTL, t('freeService'))}
                      </span>
                    </div>

                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.5, marginBottom: 20 }}>
                      {getTranslatableText(srv.short_description || srv.description) || (isRTL ? 'خدمة متميزة توفرها مساحة العمل للجلسات والاستشارات.' : 'A premium service for sessions and consultations.')}
                    </p>
                  </div>

                  {srv.booking_enabled !== false ? (
                    <Link
                      to={`/workspaces/${idOrSlug}/book?service=${srv.slug || srv.id}`}
                      className="btn btn-primary btn-md"
                      style={{ width: '100%', justifyContent: 'center', gap: 8 }}
                    >
                      <Icon name="calendar" size={18} />
                      <span>{t('bookAppointment') || (isRTL ? 'حجز موعد' : 'Book Appointment')}</span>
                    </Link>
                  ) : (
                    <button
                      type="button"
                      disabled
                      style={{
                        width: '100%',
                        justifyContent: 'center',
                        gap: 8,
                        cursor: 'not-allowed',
                        background: 'var(--surface-alt, #f3f4f6)',
                        border: '1px solid var(--border, #d1d5db)',
                        color: 'var(--text-secondary, #4b5563)',
                        fontWeight: 700,
                        fontSize: '0.86rem',
                        padding: '10px 16px',
                        borderRadius: 'var(--radius-md, 8px)',
                        display: 'inline-flex',
                        alignItems: 'center',
                      }}
                    >
                      <Icon name="calendar" size={16} style={{ flexShrink: 0, opacity: 0.85 }} />
                      <span style={{ color: 'var(--text-secondary, #4b5563)' }}>{isRTL ? 'غير متاح للحجز أونلاين' : 'Not Available for Online Booking'}</span>
                    </button>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
