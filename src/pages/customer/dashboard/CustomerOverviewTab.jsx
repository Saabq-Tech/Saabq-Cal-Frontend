import { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { useLanguage } from "../../../context/LanguageContext";
import client from "../../../api/client";
import Icon from "../../../components/common/Icon";
import UserAvatar from "../../../components/ui/UserAvatar";
import SEO from "../../../components/ui/SEO";
import { SkeletonRect } from "../../../components/ui/Skeleton";
import DashboardTrendChart from "../../../components/dashboard/DashboardTrendChart";
import { extractTranslatableText } from "../../../utils/text";
import { formatCurrency } from "../../../utils/currency";

const DAYS_IN_TREND = 30;

export default function CustomerOverviewTab() {
  const { user } = useAuth();
  const { t, isRTL, lang } = useLanguage();

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  const getText = useCallback(
    (val, fallback = "") => extractTranslatableText(val, lang, fallback),
    [lang],
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    client
      .get("/customers/appointments", { params: { per_page: 100 } })
      .then((res) => {
        if (!cancelled) setAppointments(res.data?.data || []);
      })
      .catch(() => {
        if (!cancelled) setAppointments([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const stats = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const todayMidnight = new Date();
    todayMidnight.setHours(0, 0, 0, 0);

    let upcomingCount = 0;
    let completedThisMonth = 0;
    let totalSpend = 0;
    let currency = "SAR";
    const workspaceIds = new Set();
    const serviceCounts = new Map();
    const trendBuckets = new Array(DAYS_IN_TREND).fill(0);

    appointments.forEach((appt) => {
      const startsAt = appt.starts_at ? new Date(appt.starts_at) : null;
      const status = appt.status;
      const price = parseFloat(appt.snapshot?.price ?? appt.service?.price);
      if (appt.snapshot?.currency) currency = appt.snapshot.currency;
      const wsId = appt.workspace?.id || appt.workspace_id;
      if (wsId) workspaceIds.add(wsId);

      if (
        startsAt &&
        startsAt >= now &&
        (status === "pending" || status === "confirmed")
      ) {
        upcomingCount += 1;
      }

      if (
        status === "completed" &&
        startsAt &&
        startsAt >= monthStart
      ) {
        completedThisMonth += 1;
      }

      if (status === "completed" && !isNaN(price)) {
        totalSpend += price;
      }

      const serviceName = getText(
        appt.snapshot?.service_name || appt.service?.name,
      );
      if (serviceName && status !== "cancelled") {
        serviceCounts.set(
          serviceName,
          (serviceCounts.get(serviceName) || 0) + 1,
        );
      }

      if (appt.created_at) {
        const created = new Date(appt.created_at);
        created.setHours(0, 0, 0, 0);
        const diffDays = Math.round((todayMidnight - created) / 86400000);
        const bucketIdx = DAYS_IN_TREND - 1 - diffDays;
        if (bucketIdx >= 0 && bucketIdx < DAYS_IN_TREND) {
          trendBuckets[bucketIdx] += 1;
        }
      }
    });

    const upcomingList = appointments
      .filter((a) => {
        const startsAt = a.starts_at ? new Date(a.starts_at) : null;
        return (
          startsAt &&
          startsAt >= new Date() &&
          (a.status === "pending" || a.status === "confirmed")
        );
      })
      .sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at))
      .slice(0, 4);

    const topServices = Array.from(serviceCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);
    const topServicesMax = topServices.length > 0 ? topServices[0][1] : 1;

    return {
      upcomingCount,
      completedThisMonth,
      workspaceCount: workspaceIds.size,
      totalSpend,
      currency,
      upcomingList,
      topServices,
      topServicesMax,
      trendBuckets,
    };
  }, [appointments, getText]);

  const formatDateShort = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    return d.toLocaleDateString(isRTL ? "ar-SA" : "en-US", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  };

  const formatTimeShort = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    return d.toLocaleTimeString(isRTL ? "ar-SA" : "en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <SkeletonRect height={140} />
        <SkeletonRect height={90} />
        <SkeletonRect height={220} />
      </div>
    );
  }

  const statCards = [
    {
      icon: "calendar",
      value: stats.upcomingCount,
      label: isRTL ? "مواعيد قادمة" : "Upcoming appointments",
      iconBg: "var(--primary-subtle)",
      iconColor: "var(--primary)",
    },
    {
      icon: "check",
      value: stats.completedThisMonth,
      label: isRTL ? "مكتملة هذا الشهر" : "Completed this month",
      iconBg: "rgba(16,185,129,.12)",
      iconColor: "#059669",
    },
    {
      icon: "map-pin",
      value: stats.workspaceCount,
      label: isRTL ? "مراكز تعاملت معها" : "Workspaces you've visited",
      iconBg: "rgba(245,158,11,.14)",
      iconColor: "#b45309",
    },
    {
      icon: "credit-card",
      value: formatCurrency(stats.totalSpend, stats.currency, isRTL, "0"),
      label: isRTL ? "إجمالي الإنفاق" : "Total spend",
      iconBg: "var(--secondary-subtle)",
      iconColor: "var(--secondary)",
    },
  ];

  return (
    <div
      className="animate-fade-in-up"
      style={{ display: "flex", flexDirection: "column", gap: 20 }}
    >
      <SEO title={t("home") || (isRTL ? "الرئيسية" : "Home")} noindex />

      {/* Welcome hero */}
      <div
        style={{
          position: "relative",
          overflow: "hidden",
          borderRadius: "var(--radius-lg)",
          background: "linear-gradient(120deg, var(--primary), var(--secondary))",
          color: "#ffffff",
          padding: "clamp(20px, 4vw, 32px) clamp(20px, 5vw, 36px)",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -60,
            insetInlineEnd: -40,
            width: 220,
            height: 220,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.08)",
          }}
        />
        <div style={{ position: "relative" }}>
          <div style={{ fontSize: "0.95rem", opacity: 0.9, marginBottom: 4 }}>
            {isRTL ? "مرحباً بعودتك،" : "Welcome back,"}
          </div>
          <h2
            style={{
              fontSize: "clamp(1.3rem, 3vw, 1.9rem)",
              fontWeight: 800,
              marginBottom: 8,
            }}
          >
            {user?.name || (isRTL ? "لوحة مواعيدك" : "Your appointments")}
          </h2>
          <p
            style={{
              fontSize: "0.95rem",
              opacity: 0.92,
              maxWidth: 460,
              lineHeight: 1.6,
            }}
          >
            {isRTL
              ? "تابع حجوزاتك القادمة وإنفاقك ومراكزك المفضلة من مكان واحد."
              : "Track your upcoming bookings, spend, and favorite workspaces in one place."}
          </p>
          <Link
            to="/workspaces"
            className="btn"
            style={{
              marginTop: 16,
              minHeight: 44,
              padding: "0 20px",
              borderRadius: "var(--radius-md)",
              border: "none",
              background: "#ffffff",
              color: "var(--primary)",
              fontWeight: 700,
              fontSize: "0.9rem",
            }}
          >
            <Icon name="plus" size={16} />
            {isRTL ? "احجز موعد جديد" : "Book new appointment"}
          </Link>
        </div>
      </div>

      {/* Stat cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: 14,
        }}
      >
        {statCards.map((c) => (
          <div
            key={c.label}
            className="card"
            style={{
              padding: 16,
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: c.iconBg,
                color: c.iconColor,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon name={c.icon} size={20} />
            </div>
            <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--heading)" }}>
              {c.value}
            </div>
            <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
              {c.label}
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0,1fr) minmax(0,1.15fr)",
          gap: 16,
          alignItems: "start",
        }}
        className="dashboard-overview-split"
      >
        {/* Upcoming appointments */}
        <div className="card" style={{ padding: 18 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 14,
            }}
          >
            <h3
              style={{
                fontSize: "1rem",
                fontWeight: 800,
                color: "var(--heading)",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Icon name="calendar" size={17} style={{ color: "var(--primary)" }} />
              {isRTL ? "المواعيد القادمة" : "Upcoming appointments"}
            </h3>
            <Link
              to="/customer/profile?tab=appointments"
              style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--primary)" }}
            >
              {isRTL ? "عرض الكل" : "View all"}
            </Link>
          </div>

          {stats.upcomingList.length === 0 ? (
            <p style={{ fontSize: "0.85rem", color: "var(--muted)" }}>
              {isRTL ? "لا توجد مواعيد قادمة حالياً." : "No upcoming appointments yet."}
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {stats.upcomingList.map((appt) => (
                <div
                  key={appt.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: 10,
                    borderRadius: "var(--radius-md)",
                    background: "var(--surface-alt)",
                  }}
                >
                  <UserAvatar
                    name={appt.workspace?.name}
                    avatarUrl={appt.workspace?.logo_url}
                    size={38}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: 700,
                        color: "var(--heading)",
                        fontSize: "0.9rem",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {getText(appt.workspace?.name)}
                    </div>
                    <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>
                      {getText(appt.snapshot?.service_name || appt.service?.name)}
                    </div>
                  </div>
                  <div style={{ textAlign: "end", flexShrink: 0 }}>
                    <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--primary)" }}>
                      {formatTimeShort(appt.starts_at)}
                    </div>
                    <div style={{ fontSize: "0.72rem", color: "var(--muted)" }}>
                      {formatDateShort(appt.starts_at)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Activity trend */}
        <div className="card" style={{ padding: 18 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 8,
            }}
          >
            <h3
              style={{
                fontSize: "1rem",
                fontWeight: 800,
                color: "var(--heading)",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Icon name="bar-chart" size={17} style={{ color: "var(--primary)" }} />
              {isRTL ? "نشاط الحجوزات" : "Booking activity"}
            </h3>
            <span
              style={{
                fontSize: "0.75rem",
                color: "var(--muted)",
                border: "1px solid var(--border)",
                borderRadius: 9999,
                padding: "3px 10px",
              }}
            >
              {isRTL ? `آخر ${DAYS_IN_TREND} يوم` : `Last ${DAYS_IN_TREND} days`}
            </span>
          </div>
          <DashboardTrendChart
            values={stats.trendBuckets}
            gradientId="customer-overview-trend"
          />
        </div>
      </div>

      {/* Top services */}
      {stats.topServices.length > 0 && (
        <div className="card" style={{ padding: 18 }}>
          <h3
            style={{
              fontSize: "1rem",
              fontWeight: 800,
              color: "var(--heading)",
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 16,
            }}
          >
            <Icon name="star" size={17} style={{ color: "var(--primary)" }} />
            {isRTL ? "خدماتك الأكثر حجزاً" : "Your most booked services"}
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {stats.topServices.map(([name, count]) => (
              <div key={name} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span
                  style={{
                    width: 110,
                    fontSize: "0.84rem",
                    color: "var(--text)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {name}
                </span>
                <div
                  style={{
                    flex: 1,
                    height: 8,
                    borderRadius: 9999,
                    background: "var(--surface-alt)",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${(count / stats.topServicesMax) * 100}%`,
                      height: "100%",
                      borderRadius: 9999,
                      background: "var(--primary)",
                    }}
                  />
                </div>
                <span
                  style={{
                    width: 28,
                    textAlign: "end",
                    fontWeight: 700,
                    color: "var(--heading)",
                    fontSize: "0.84rem",
                  }}
                >
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
