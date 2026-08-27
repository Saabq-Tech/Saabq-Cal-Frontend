import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../context/ToastContext";
import { useLanguage } from "../../../context/LanguageContext";
import client, { endpoints } from "../../../api/client";
import LogsTab from "./workspace-settings/LogsTab";
import SEO from "../../../components/ui/SEO";
import { TableSkeleton } from "../../../components/ui/Skeleton";

export default function WorkspaceLogsPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const toast = useToast();

  const [logs, setLogs] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    page: 1,
    actor_type: "",
    action: "",
  });

  const isOwner = user?.is_owner === true;
  const userPermissions = Array.isArray(user?.permissions)
    ? user.permissions
    : [];
  const canRead = isOwner || userPermissions.includes("settings_read");

  const loadingRef = useRef(false);

  const loadLogs = async (currentFilters) => {
    if (!canRead) {
      setLoading(false);
      return;
    }
    if (loadingRef.current) return;
    loadingRef.current = true;
    try {
      setLoading(true);
      const res = await client.get(endpoints.workspaceLogs, {
        params: {
          page: currentFilters.page,
          actor_type: currentFilters.actor_type || undefined,
          action: currentFilters.action || undefined,
        },
      });
      setLogs(res.data?.data || []);
      setMeta(res.data?.meta || null);
    } catch (err) {
      if (err.response?.status !== 403) {
        toast.error(t("logsLoadFailed") || "فشل تحميل سجل النشاطات");
      }
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  };

  useEffect(() => {
    loadLogs(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canRead, filters]);

  const handleFilterChange = (newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  return (
    <div className="card" style={{ padding: 24 }}>
      <SEO title={t("auditLogs") || "سجل النشاطات"} noindex />
      {loading && logs.length === 0 ? (
        <TableSkeleton rows={4} />
      ) : (
        <LogsTab
          logs={logs}
          meta={meta}
          filters={filters}
          onFilterChange={handleFilterChange}
          onPageChange={handlePageChange}
          loading={loading}
        />
      )}
    </div>
  );
}
