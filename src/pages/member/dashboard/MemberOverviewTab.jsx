import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "../../../context/AuthContext";
import { useLanguage } from "../../../context/LanguageContext";
import client, { endpoints } from "../../../api/client";
import Icon from "../../../components/common/Icon";
import UserAvatar from "../../../components/ui/UserAvatar";
import SEO from "../../../components/ui/SEO";
import { SkeletonRect } from "../../../components/ui/Skeleton";
import DashboardTrendChart from "../../../components/dashboard/DashboardTrendChart";
import { extractTranslatableText } from "../../../utils/text";
import { formatCurrency } from "../../../utils/currency";
import { checkWorkspaceCapability } from "../../../utils/capabilities";

const DAYS_IN_TREND = 30;

export default function MemberOverviewTab() {
  const { user } = useAuth();
  const { t, isRTL, lang } = useLanguage();

  const isOwner = user?.is_owner === true;
  const userPermissions = Array.isArray(user?.permissions)
    ? user.permissions
    : [];
  const canReadBookings =
    isOwner ||
    userPermissions.includes("booking_read") ||
    userPermissions.includes("bookings_read");
  const canReadCustomers =
    isOwner ||
    userPermissions.includes("customer_read") ||
    userPermissions.includes("customers_read");
  const isBookingCapable = checkWorkspaceCapability(user, "BOOKING");

  const [bookings, setBookings] = useState([]);
  const [customerTotal, setCustomerTotal] = useState(null);
  const [loading, setLoading] = useState(true);

  const getText = useCallback(
    (val, fallback = "") => extractTranslatableText(val, lang, fallback),
    [lang],
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const requests = [
      isBookingCapable && canReadBookings
        ? client
            .get(endpoints.workspaceBookings, { params: { per_page: 100 } })
            .then((res) => res.data?.data || [])
            .catch(() => [])
        : Promise.resolve([]),
      canReadCustomers
        ? client
            .get(endpoints.workspaceCustomers, { params: { per_page: 1 } })
            .then((res) => res.data?.meta?.total ?? null)
            .catch(() => null)
        : Promise.resolve(null),
    ];

    Promise.all(requests).then(([bookingsData, total]) => {
      if (cancelled) return;
      setBookings(bookingsData);
      setCustomerTotal(total);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isBookingCapable, canReadBookings, canReadCustomers]);

  const stats = useMemo(() => {
    const now = new Date();
    const todayStr = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, "0"),
      String(now.getDate()).padStart(2, "0"),
    ].join("-");
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const todayMidnight = new Date();
    todayMidnight.setHours(0, 0, 0, 0);

    let todayCount = 0;
    let completedTodayCount = 0;
    let monthRevenue = 0;
    let currency = "SAR";
    const serviceCounts = new Map();
    const trendBuckets = new Array(DAYS_IN_TREND).fill(0);

    bookings.forEach((b) => {
      const startsAt = b.starts_at ? new Date(b.starts_at) : null;
      const dateStr = b.starts_at ? b.starts_at.slice(0, 10) : null;
      const price = parseFloat(b.snapshot?.price ?? b.service?.price);
      if (b.snapshot?.currency) currency = b.snapshot.currency;

      if (dateStr === todayStr) {
        todayCount += 1;
        if (b.status === "completed") completedTodayCount += 1;
      }

      if (
        startsAt &&
        startsAt >= monthStart &&
        (b.status === "completed" || b.status === "confirmed") &&
        !isNaN(price)
      ) {
        monthRevenue += price;
      }

      const serviceName = getText(
        b.service?.name || b.snapshot?.service_name,
      );
      if (serviceName && b.status !== "cancelled") {
        serviceCounts.set(
          serviceName,
          (serviceCounts.get(serviceName) || 0) + 1,
        );
      }

      if (b.created_at) {
        const created = new Date(b.created_at);
        created.setHours(0, 0, 0, 0);
        const diffDays = Math.round((todayMidnight - created) / 86400000);
        const bucketIdx = DAYS_IN_TREND - 1 - diffDays;
        if (bucketIdx >= 0 && bucketIdx < DAYS_IN_TREND) {
          trendBuckets[bucketIdx] += 1;
        }
      }
    });

    const todayList = bookings
      .filter((b) => b.starts_at && b.starts_at.slice(0, 10) === todayStr)
      .sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at))
      .slice(0, 6);

    const topServices = Array.from(serviceCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);
    const topServicesMax = topServices.length > 0 ? topServices[0][1] : 1;

    return {
      todayCount,
      completedTodayCount,
      monthRevenue,
      currency,
      todayList,
      topServices,
      topServicesMax,
      trendBuckets,
    };
  }, [bookings, getText]);

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

  const workspaceName = user?.workspace?.name || t("appName");

  const statCards = [
    customerTotal !== null && {
      icon: "users",
      value: customerTotal,
      label: isRTL ? "إجمالي العملاء" : "Total customers",
      iconBg: "var(--primary-subtle)",
      iconColor: "var(--primary)",
    },
    {
      icon: "calendar",
      value: stats.todayCount,
      label: isRTL ? "مواعيد اليوم" : "Today's appointments",
      iconBg: "var(--secondary-subtle)",
      iconColor: "var(--secondary)",
    },
    {
      icon: "check",
      value: stats.completedTodayCount,
      label: isRTL ? "مكتملة اليوم" : "Completed today",
      iconBg: "rgba(245,158,11,.14)",
      iconColor: "#b45309",
    },
    {
      icon: "credit-card",
      value: formatCurrency(stats.monthRevenue, stats.currency, isRTL, "0"),
      label: isRTL ? "إيرادات هذا الشهر" : "Revenue this month",
      iconBg: "rgba(16,185,129,.12)",
      iconColor: "#059669",
    },
  ].filter(Boolean);

  return (
    <div
      className="animate-fade-in-up"
      style={{ display: "flex", flexDirection: "column", gap: 20 }}
    >
      <SEO title={t("home") || (isRTL ? "الرئيسية" : "Home")} noindex />

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
            {isRTL ? "مرحباً بك في" : "Welcome to"}
          </div>
          <h2
            style={{
              fontSize: "clamp(1.3rem, 3vw, 1.9rem)",
              fontWeight: 800,
              marginBottom: 8,
            }}
          >
            {isRTL ? `إدارة ${workspaceName}` : `${workspaceName} management`}
          </h2>
          <p style={{ fontSize: "0.95rem", opacity: 0.92, maxWidth: 460, lineHeight: 1.6 }}>
            {isRTL
              ? "تحكّم في كل تفاصيل مركزك بسهولة — المواعيد، الفريق، والمدفوعات."
              : "Manage every detail of your workspace — bookings, team, and payments."}
          </p>
        </div>
      </div>

      {!isBookingCapable ? (
        <div className="card" style={{ padding: 20, textAlign: "center", color: "var(--muted)" }}>
          {isRTL
            ? "فعّل باقة تحتوي على ميزة الحجوزات لعرض ملخص الأداء هنا."
            : "Activate a plan with the bookings capability to see performance stats here."}
        </div>
      ) : (
        <>
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
                style={{ padding: 16, display: "flex", flexDirection: "column", gap: 8 }}
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
            className="dashboard-overview-split"
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0,1fr) minmax(0,1.15fr)",
              gap: 16,
              alignItems: "start",
            }}
          >
            <div className="card" style={{ padding: 18 }}>
              <h3
                style={{
                  fontSize: "1rem",
                  fontWeight: 800,
                  color: "var(--heading)",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 14,
                }}
              >
                <Icon name="calendar" size={17} style={{ color: "var(--primary)" }} />
                {isRTL ? "مواعيد اليوم" : "Today's appointments"}
              </h3>

              {stats.todayList.length === 0 ? (
                <p style={{ fontSize: "0.85rem", color: "var(--muted)" }}>
                  {isRTL ? "لا توجد مواعيد اليوم." : "No appointments today."}
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {stats.todayList.map((b) => {
                    const customerName =
                      b.customer_name ||
                      b.customer?.name ||
                      b.snapshot?.customer_name ||
                      (isRTL ? "عميل" : "Customer");
                    return (
                      <div
                        key={b.id}
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
                          name={customerName}
                          avatarUrl={b.customer?.avatar_url}
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
                            {customerName}
                          </div>
                          <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>
                            {getText(b.service?.name || b.snapshot?.service_name)}
                          </div>
                        </div>
                        <div
                          style={{
                            fontSize: "0.8rem",
                            fontWeight: 700,
                            color: "var(--primary)",
                            flexShrink: 0,
                          }}
                        >
                          {formatTimeShort(b.starts_at)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

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
                  {isRTL ? "ملخص الإيرادات" : "Revenue summary"}
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
                gradientId="member-overview-trend"
              />
            </div>
          </div>

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
                {isRTL ? "الخدمات الأكثر طلباً" : "Most requested services"}
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
        </>
      )}
    </div>
  );
}
