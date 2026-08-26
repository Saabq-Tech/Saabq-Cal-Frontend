import { useAuth } from "../context/AuthContext";

export function usePermissions() {
  const { user } = useAuth();

  const hasPermission = (permission) => {
    if (!user) return false;

    // Owners have all permissions
    if (user.is_owner) return true;

    // If no permissions array is provided, return false
    if (!user.permissions || !Array.isArray(user.permissions)) return false;

    // Check if the permission exists in the array
    return user.permissions.includes(permission);
  };

  return { hasPermission };
}
