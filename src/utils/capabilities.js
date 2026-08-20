/**
 * Evaluates whether the workspace member can access a given module or feature based on subscription status and plan capabilities.
 * @param {object} user - The authenticated user object from AuthContext
 * @param {string} capabilityCode - The capability code required (e.g. 'BOOKING', 'TEAM_MEMBERS', 'PER_MEMBER_CALENDAR', 'BOOKING_FORM_CONFIG', 'CUSTOM_TEMPLATES', 'WEBHOOKS')
 * @returns {boolean}
 */
export function checkWorkspaceCapability(user, capabilityCode) {
  if (!user || !user.workspace) return false;

  // General settings & subscriptions management pages are always accessible for every workspace
  if (!capabilityCode || capabilityCode === 'SETTINGS' || capabilityCode === 'SUBSCRIPTION' || capabilityCode === 'subscriptions') {
    return true;
  }

  // Check active subscription status (defaults to true if not defined)
  const hasActiveSub = user.workspace.has_active_subscription ?? true;
  if (!hasActiveSub) {
    return false;
  }

  const activeCaps = Array.isArray(user.workspace.active_capabilities)
    ? user.workspace.active_capabilities
    : [];

  return activeCaps.includes(capabilityCode);
}
