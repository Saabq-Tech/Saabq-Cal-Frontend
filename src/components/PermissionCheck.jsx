import React from "react";
import { usePermissions } from "../hooks/usePermissions";

export default function PermissionCheck({
  permission,
  children,
  fallback = null,
}) {
  const { hasPermission } = usePermissions();

  if (!hasPermission(permission)) {
    return fallback;
  }

  return <>{children}</>;
}
