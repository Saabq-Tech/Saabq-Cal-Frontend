import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import client, { endpoints } from "../api/client";
import { useLanguage } from "../context/LanguageContext";
import SEO from "../components/ui/SEO";
import Icon from "../components/common/Icon";
import { SkeletonLine } from "../components/ui/Skeleton";
import {
  sortPlansByPrice,
  getPopularPlanId,
  isStartingFromPlan,
  formatPlanPrice,
  planCurrencyLabel,
  planPrice,
  visibleCapabilities,
} from "../utils/plans";

// Capability codes grouped the way the comparison table reads, cheapest first.
const CAPABILITY_GROUPS = [
  {
    titleKey: "planGroupEssentials",
    codes: ["BOOKING", "SCHEDULES", "SERVICES", "CUSTOMERS", "LANDING_PAGE"],
  },
  {
    titleKey: "planGroupOperations",
    codes: [
      "TEAM_MEMBERS",
      "CUSTOM_TEMPLATES",
      "PAYMENTS",
      "REPORTS",
      "BOOKING_FORM_CONFIG",
    ],
  },
  {
    titleKey: "planGroupGrowth",
    codes: [
      "PER_MEMBER_CALENDAR",
      "ROLES_PERMISSIONS",
      "INTEGRATIONS",
      "CUSTOM_BRANDING",
      "RESOURCES",
    ],
  },
  {
    titleKey: "planGroupAdvanced",
    codes: ["LOGS", "WEBHOOKS", "REST_API"],
  },
];

const LIMIT_ROWS = [
  { key: "max_members", labelKey: "planAccountsLabel" },
  { key: "max_services", labelKey: "planServicesLabel" },
  { key: "max_appointments", labelKey: "planBookingsLabel" },
  { key: "max_customers", labelKey: "customers" },
];

export default function PricingPage() {
  const { t, lang } = useLanguage();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    client
      .get(endpoints.plans)
      .then((res) => setPlans(res.data?.data || []))
      .catch(() => setPlans([]))
      .finally(() => setLoading(false));
  }, [lang]);

  const sortedPlans = useMemo(() => sortPlansByPrice(plans), [plans]);
  const popularPlanId = getPopularPlanId(sortedPlans);

  const capabilityNames = useMemo(() => {
    const names = {};
    sortedPlans.forEach((plan) =>
      visibleCapabilities(plan).forEach((cap) => {
        names[cap.code] = cap.name;
      }),
    );
    return names;
  }, [sortedPlans]);

  const hasCapability = (plan, code) =>
    visibleCapabilities(plan).some((cap) => cap.code === code);

  const cellClass = (plan) =>
    plan.id === popularPlanId ? "compare-cell is-popular" : "compare-cell";

  return (
    <div className="main-content">
      <SEO
        title={t("planCompareTitle")}
        description={t("planCompareSubtitle")}
      />
      <section className="section-sm">
        <div className="container pricing-container">
          <div className="section-header">
            <h1>{t("planCompareTitle")}</h1>
            <p>{t("planCompareSubtitle")}</p>
          </div>

          {loading ? (
            <div className="card" style={{ padding: 24 }}>
              <SkeletonLine width="60%" height={18} />
              <SkeletonLine width="90%" height={14} style={{ marginTop: 16 }} />
              <SkeletonLine width="80%" height={14} style={{ marginTop: 12 }} />
            </div>
          ) : sortedPlans.length === 0 ? (
            <p className="pricing-compare-empty">{t("noPlansAvailable")}</p>
          ) : (
            <div className="compare-table-wrap">
              <table className="compare-table">
                <thead>
                  <tr>
                    <th className="compare-feature-col">{t("planFeature")}</th>
                    {sortedPlans.map((plan) => (
                      <th key={plan.id} className={cellClass(plan)}>
                        {plan.id === popularPlanId && (
                          <span className="compare-popular">
                            {t("popularTag")}
                          </span>
                        )}
                        <span className="compare-plan-name">{plan.name}</span>
                        <span className="compare-plan-price">
                          {isStartingFromPlan(plan, sortedPlans) &&
                            `${t("planStartingFrom")} `}
                          {formatPlanPrice(plan)}{" "}
                          {planCurrencyLabel(plan, lang)}
                          {planPrice(plan) > 0 && ` ${t("planPerMonth")}`}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="compare-group-row">
                    <td colSpan={sortedPlans.length + 1}>
                      {t("planGroupLimits")}
                    </td>
                  </tr>
                  {LIMIT_ROWS.map((row) => (
                    <tr key={row.key}>
                      <td className="compare-feature-col">{t(row.labelKey)}</td>
                      {sortedPlans.map((plan) => (
                        <td key={plan.id} className={cellClass(plan)}>
                          {plan[row.key]
                            ? Number(plan[row.key]).toLocaleString("en-US")
                            : t("planUnlimited")}
                        </td>
                      ))}
                    </tr>
                  ))}

                  {CAPABILITY_GROUPS.map((group) => {
                    const codes = group.codes.filter(
                      (code) => capabilityNames[code],
                    );
                    if (codes.length === 0) return null;
                    return [
                      <tr key={group.titleKey} className="compare-group-row">
                        <td colSpan={sortedPlans.length + 1}>
                          {t(group.titleKey)}
                        </td>
                      </tr>,
                      ...codes.map((code) => (
                        <tr key={code}>
                          <td className="compare-feature-col">
                            {capabilityNames[code]}
                          </td>
                          {sortedPlans.map((plan) => (
                            <td key={plan.id} className={cellClass(plan)}>
                              {hasCapability(plan, code) ? (
                                <span
                                  className="compare-yes"
                                  aria-label={t("planIncluded")}
                                >
                                  <Icon name="check" size={16} />
                                </span>
                              ) : (
                                <span
                                  className="compare-no"
                                  aria-label={t("planNotIncluded")}
                                >
                                  —
                                </span>
                              )}
                            </td>
                          ))}
                        </tr>
                      )),
                    ];
                  })}

                  <tr className="compare-cta-row">
                    <td className="compare-feature-col" />
                    {sortedPlans.map((plan) => (
                      <td key={plan.id} className={cellClass(plan)}>
                        <Link
                          to="/register"
                          className={`btn btn-sm ${
                            plan.id === popularPlanId
                              ? "btn-primary"
                              : "btn-secondary"
                          }`}
                        >
                          {planPrice(plan) > 0
                            ? t("getStarted")
                            : t("planStartFree")}
                        </Link>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          <p className="pricing-compare-note">{t("planCompareNote")}</p>
        </div>
      </section>
    </div>
  );
}
