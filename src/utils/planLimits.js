/**
 * Plan Limit helpers for Saabq Workspace Dashboard.
 */

export function getPlanLimit(user, type) {
  const limits =
    user?.workspace?.plan_limits || user?.workspace?.subscription?.plan || {};

  switch (type) {
    case "members":
    case "team_members":
      return (
        limits.max_members ??
        user?.workspace?.subscription?.plan?.max_members ??
        null
      );
    case "services":
      return (
        limits.max_services ??
        user?.workspace?.subscription?.plan?.max_services ??
        null
      );
    case "customers":
      return (
        limits.max_customers ??
        user?.workspace?.subscription?.plan?.max_customers ??
        null
      );
    case "appointments":
    case "bookings":
      return (
        limits.max_appointments ??
        user?.workspace?.subscription?.plan?.max_appointments ??
        null
      );
    default:
      return null;
  }
}

export function getPlanUsage(user, type, fallbackCount = null) {
  const usage = user?.workspace?.usage || {};

  if (fallbackCount !== null && fallbackCount !== undefined) {
    return Number(fallbackCount);
  }

  switch (type) {
    case "members":
    case "team_members":
      return usage.members_count ?? 0;
    case "services":
      return usage.services_count ?? 0;
    case "customers":
      return usage.customers_count ?? 0;
    case "appointments":
    case "bookings":
      return usage.appointments_count ?? 0;
    default:
      return 0;
  }
}

export function getLimitInfo(user, type, fallbackCount = null) {
  const max = getPlanLimit(user, type);
  const used = getPlanUsage(user, type, fallbackCount);
  const isUnlimited = max === null || max === undefined;
  const isReached = !isUnlimited && used >= max;
  const remaining = isUnlimited ? null : Math.max(0, max - used);

  return {
    max,
    used,
    isUnlimited,
    isReached,
    remaining,
  };
}

export function isPlanLimitReached(user, type, fallbackCount = null) {
  return getLimitInfo(user, type, fallbackCount).isReached;
}
