import { useAuth } from "../context/AuthContext";

export function usePermissions() {
  const { user } = useAuth();

  const isOwner = Boolean(user?.is_owner);

  const hasPermission = (permission) => {
    if (!user) return false;

    // Owners have all permissions
    if (user.is_owner) return true;

    // If no permissions array is provided, return false
    if (!user.permissions || !Array.isArray(user.permissions)) return false;

    if (Array.isArray(permission)) {
      return permission.some((p) => hasPermission(p));
    }

    // Direct check
    if (user.permissions.includes(permission)) return true;

    // Legacy fallback mapping
    if (typeof permission === "string" && permission.endsWith("_write")) {
      const base = permission.replace("_write", "");
      return (
        user.permissions.includes(`${base}_create`) ||
        user.permissions.includes(`${base}_update`) ||
        user.permissions.includes(`${base}_delete`)
      );
    }
    if (typeof permission === "string" && permission.endsWith("_manage")) {
      const base = permission.replace("_manage", "");
      return (
        user.permissions.includes(`${base}_read`) ||
        user.permissions.includes(`${base}_create`) ||
        user.permissions.includes(`${base}_update`) ||
        user.permissions.includes(`${base}_delete`)
      );
    }

    return false;
  };

  const hasAllPermissions = (permissions = []) => {
    if (!user) return false;
    if (user.is_owner) return true;
    if (!user.permissions || !Array.isArray(user.permissions)) return false;
    return permissions.every((p) => hasPermission(p));
  };

  const hasAnyPermission = (permissions = []) => {
    return hasPermission(permissions);
  };

  const cannot = (permission) => !hasPermission(permission);
  const can = (permission) => hasPermission(permission);

  return {
    user,
    isOwner,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    can,
    cannot,

    // Bookings
    canReadBookings: hasPermission("booking_read"),
    canCreateBookings: hasPermission("booking_create"),
    canUpdateBookings: hasPermission("booking_update"),
    canDeleteBookings: hasPermission("booking_delete"),

    // Customers
    canReadCustomers: hasPermission("customer_read"),
    canCreateCustomers: hasPermission("customer_create"),
    canUpdateCustomers: hasPermission("customer_update"),
    canDeleteCustomers: hasPermission("customer_delete"),

    // Services
    canReadServices: hasPermission("service_read"),
    canCreateServices: hasPermission("service_create"),
    canUpdateServices: hasPermission("service_update"),
    canDeleteServices: hasPermission("service_delete"),

    // Resources
    canReadResources: hasPermission("resource_read"),
    canCreateResources: hasPermission("resource_create"),
    canUpdateResources: hasPermission("resource_update"),
    canDeleteResources: hasPermission("resource_delete"),

    // Schedules
    canReadSchedules: hasPermission("schedule_read"),
    canCreateSchedules: hasPermission("schedule_create"),
    canUpdateSchedules: hasPermission("schedule_update"),
    canDeleteSchedules: hasPermission("schedule_delete"),

    // Payments
    canReadPayments: hasPermission("payment_read"),
    canCreatePayments: hasPermission("payment_create"),
    canUpdatePayments: hasPermission("payment_update"),
    canDeletePayments: hasPermission("payment_delete"),

    // Subscriptions
    canReadSubscriptions: hasPermission("subscription_read"),
    canCreateSubscriptions: hasPermission("subscription_create"),
    canUpdateSubscriptions: hasPermission("subscription_update"),
    canDeleteSubscriptions: hasPermission("subscription_delete"),

    // Booking Forms
    canReadBookingForms: hasPermission("booking_form_read"),
    canCreateBookingForms: hasPermission("booking_form_create"),
    canUpdateBookingForms: hasPermission("booking_form_update"),
    canDeleteBookingForms: hasPermission("booking_form_delete"),

    // Branding & Settings
    canReadBranding: hasPermission("branding_read"),
    canUpdateBranding: hasPermission("branding_update"),
    canReadSettings: hasPermission("settings_read"),
    canUpdateSettings: hasPermission("settings_update"),

    // Members & Roles
    canReadMembers: hasPermission("member_read"),
    canCreateMembers: hasPermission("member_create"),
    canUpdateMembers: hasPermission("member_update"),
    canDeleteMembers: hasPermission("member_delete"),
    canManageMembers: hasPermission("member_manage"),

    canReadRoles: hasPermission("role_read"),
    canCreateRoles: hasPermission("role_create"),
    canUpdateRoles: hasPermission("role_update"),
    canDeleteRoles: hasPermission("role_delete"),

    // Calendar
    canCalendarOwn: hasPermission("calendar_own"),

    // Chat
    canReadChat: hasPermission("chat_read"),
    canCreateChat: hasPermission("chat_create"),
    canUpdateChat: hasPermission("chat_update"),
    canDeleteChat: hasPermission("chat_delete"),

    // Integrations
    canReadIntegrations: hasPermission("integration_read"),
    canCreateIntegrations: hasPermission("integration_create"),
    canUpdateIntegrations: hasPermission("integration_update"),
    canDeleteIntegrations: hasPermission("integration_delete"),

    // Notifications
    canReadNotifications: hasPermission("notification_read"),
    canCreateNotifications: hasPermission("notification_create"),
    canUpdateNotifications: hasPermission("notification_update"),
    canDeleteNotifications: hasPermission("notification_delete"),
  };
}
