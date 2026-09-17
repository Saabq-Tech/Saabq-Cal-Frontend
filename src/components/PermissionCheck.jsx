import React from "react";
import { usePermissions } from "../hooks/usePermissions";

export default function PermissionCheck({
  permission,
  anyOf,
  allOf,
  children,
  fallback = null,
}) {
  const { hasPermission, hasAllPermissions } = usePermissions();

  let allowed = true;

  if (permission) {
    allowed = hasPermission(permission);
  } else if (anyOf && Array.isArray(anyOf)) {
    allowed = hasPermission(anyOf);
  } else if (allOf && Array.isArray(allOf)) {
    allowed = hasAllPermissions(allOf);
  }

  if (!allowed) {
    return fallback;
  }

  return <>{children}</>;
}
