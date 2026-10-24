/**
 * Helpers shared by the home pricing cards and the plan comparison page.
 */

const LIMIT_KEYS = [
  "max_members",
  "max_services",
  "max_appointments",
  "max_customers",
];

// Capabilities that don't belong to the general-business pricing story.
const HIDDEN_CAPABILITIES = ["RENTALS"];

export const planPrice = (plan) => Number(plan?.price) || 0;

export const sortPlansByPrice = (plans = []) =>
  [...plans].sort((a, b) => planPrice(a) - planPrice(b));

/** Top-priced plan with no limits at all: shown as "starting from" + contact. */
export const isStartingFromPlan = (plan, sortedPlans) =>
  sortedPlans.length > 2 &&
  plan === sortedPlans[sortedPlans.length - 1] &&
  LIMIT_KEYS.every((key) => !plan[key]);

/** The second-cheapest paid plan is the one we highlight as most popular. */
export const getPopularPlanId = (sortedPlans) => {
  const paid = sortedPlans.filter((p) => planPrice(p) > 0);
  return paid.length >= 3 ? paid[1].id : null;
};

export const visibleCapabilities = (plan) =>
  (plan?.capabilities || []).filter(
    (cap) => !HIDDEN_CAPABILITIES.includes(cap.code),
  );

export const formatPlanPrice = (plan) => planPrice(plan).toLocaleString("en-US");

export const planCurrencyLabel = (plan, lang) => {
  const detail = plan?.currency_detail;
  if (lang === "ar") return detail?.symbol_native || plan?.currency || "";
  return detail?.code || plan?.currency || "";
};
