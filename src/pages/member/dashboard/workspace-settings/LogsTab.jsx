import { useLanguage } from "../../../../context/LanguageContext";

export default function LogsTab({
  logs,
  meta,
  filters,
  onFilterChange,
  onPageChange,
  loading,
}) {
  const { t, isRTL } = useLanguage();

  const handleActorTypeChange = (e) => {
    onFilterChange({ actor_type: e.target.value });
  };

  const handleActionChange = (e) => {
    onFilterChange({ action: e.target.value });
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const options = {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };
    return new Date(dateString).toLocaleDateString(
      isRTL ? "ar-EG" : "en-US",
      options,
    );
  };

  return (
    <div className="card-body">
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 14,
          marginBottom: 20,
        }}
      >
        <div>
          <h2
            style={{
              fontSize: "1.2rem",
              fontWeight: 800,
              margin: 0,
              color: "var(--heading)",
            }}
          >
            {t("auditLogs") || (isRTL ? "سجل النشاطات" : "Audit Logs")}
          </h2>
          <p
            style={{
              fontSize: "0.86rem",
              color: "var(--text-secondary)",
              margin: "4px 0 0",
            }}
          >
            {t("auditLogsDesc") ||
              (isRTL
                ? "متابعة وتتبع جميع التغييرات والإجراءات التي تمت داخل مساحة العمل."
                : "Monitor and track all changes and actions taken within the workspace.")}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div
        style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}
      >
        <div style={{ flex: "1 1 200px" }}>
          <label
            style={{
              fontSize: "0.8rem",
              color: "var(--text-secondary)",
              marginBottom: 4,
              display: "block",
            }}
          >
            {t("actorType") || (isRTL ? "نوع المستخدم" : "Actor Type")}
          </label>
          <select
            className="form-control"
            value={filters.actor_type}
            onChange={handleActorTypeChange}
          >
            <option value="">{t("all") || (isRTL ? "الكل" : "All")}</option>
            <option value="member">
              {t("member") || (isRTL ? "عضو مساحة عمل" : "Workspace Member")}
            </option>
            <option value="system">
              {t("system") || (isRTL ? "النظام" : "System")}
            </option>
          </select>
        </div>
        <div style={{ flex: "1 1 200px" }}>
          <label
            style={{
              fontSize: "0.8rem",
              color: "var(--text-secondary)",
              marginBottom: 4,
              display: "block",
            }}
          >
            {t("actionType") || (isRTL ? "نوع الإجراء" : "Action Type")}
          </label>
          <select
            className="form-control"
            value={filters.action}
            onChange={handleActionChange}
          >
            <option value="">{t("all") || (isRTL ? "الكل" : "All")}</option>
            <option value="created">
              {t("created") || (isRTL ? "إنشاء" : "Created")}
            </option>
            <option value="updated">
              {t("updated") || (isRTL ? "تحديث" : "Updated")}
            </option>
            <option value="deleted">
              {t("deleted") || (isRTL ? "حذف" : "Deleted")}
            </option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div
        style={{
          overflowX: "auto",
          border: "1px solid var(--border-light)",
          borderRadius: "var(--radius-lg)",
        }}
      >
        <table
          className="table"
          style={{
            width: "100%",
            borderCollapse: "collapse",
            textAlign: isRTL ? "right" : "left",
          }}
        >
          <thead style={{ background: "var(--surface-alt)" }}>
            <tr>
              <th
                style={{
                  padding: "12px 16px",
                  fontSize: "0.85rem",
                  color: "var(--text-secondary)",
                  fontWeight: 600,
                }}
              >
                {t("actor") || (isRTL ? "المنفذ" : "Actor")}
              </th>
              <th
                style={{
                  padding: "12px 16px",
                  fontSize: "0.85rem",
                  color: "var(--text-secondary)",
                  fontWeight: 600,
                }}
              >
                {t("action") || (isRTL ? "الإجراء" : "Action")}
              </th>
              <th
                style={{
                  padding: "12px 16px",
                  fontSize: "0.85rem",
                  color: "var(--text-secondary)",
                  fontWeight: 600,
                }}
              >
                {t("target") || (isRTL ? "الهدف" : "Target")}
              </th>
              <th
                style={{
                  padding: "12px 16px",
                  fontSize: "0.85rem",
                  color: "var(--text-secondary)",
                  fontWeight: 600,
                }}
              >
                {t("ipAddress") || (isRTL ? "عنوان IP" : "IP Address")}
              </th>
              <th
                style={{
                  padding: "12px 16px",
                  fontSize: "0.85rem",
                  color: "var(--text-secondary)",
                  fontWeight: 600,
                }}
              >
                {t("date") || (isRTL ? "التاريخ" : "Date")}
              </th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td
                  colSpan="5"
                  style={{
                    textAlign: "center",
                    padding: "32px 16px",
                    color: "var(--muted)",
                  }}
                >
                  {loading
                    ? t("loading") || "جاري التحميل..."
                    : t("noLogsFound") ||
                      (isRTL ? "لا توجد نشاطات مسجلة" : "No logs found")}
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr
                  key={log.id}
                  style={{ borderTop: "1px solid var(--border-light)" }}
                >
                  <td style={{ padding: "12px 16px", fontSize: "0.9rem" }}>
                    <div style={{ fontWeight: 600, color: "var(--heading)" }}>
                      {log.actor_name || (isRTL ? "نظام" : "System")}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>
                      {log.actor_type}
                    </div>
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: "0.9rem" }}>
                    <span
                      style={{
                        padding: "2px 8px",
                        borderRadius: 12,
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        background:
                          log.action === "created"
                            ? "#dcfce7"
                            : log.action === "deleted"
                              ? "#fee2e2"
                              : "#f3f4f6",
                        color:
                          log.action === "created"
                            ? "#15803d"
                            : log.action === "deleted"
                              ? "#b91c1c"
                              : "#4b5563",
                      }}
                    >
                      {log.action}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: "0.9rem" }}>
                    <div style={{ fontWeight: 600, color: "var(--heading)" }}>
                      {log.auditable_type.split("\\").pop()}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>
                      ID: {log.auditable_id}
                    </div>
                  </td>
                  <td
                    style={{
                      padding: "12px 16px",
                      fontSize: "0.85rem",
                      color: "var(--text-secondary)",
                    }}
                  >
                    {log.ip_address || "-"}
                  </td>
                  <td
                    style={{
                      padding: "12px 16px",
                      fontSize: "0.85rem",
                      color: "var(--text-secondary)",
                    }}
                  >
                    {formatDate(log.created_at)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {meta && meta.last_page > 1 && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: 20,
          }}
        >
          <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
            {t("showing") || (isRTL ? "عرض" : "Showing")} {meta.from}{" "}
            {t("to") || (isRTL ? "إلى" : "to")} {meta.to}{" "}
            {t("of") || (isRTL ? "من أصل" : "of")} {meta.total}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              className="btn btn-secondary btn-sm"
              disabled={meta.current_page === 1 || loading}
              onClick={() => onPageChange(meta.current_page - 1)}
            >
              {t("prevPage") || (isRTL ? "السابق" : "Prev")}
            </button>
            <button
              className="btn btn-secondary btn-sm"
              disabled={meta.current_page === meta.last_page || loading}
              onClick={() => onPageChange(meta.current_page + 1)}
            >
              {t("nextPage") || (isRTL ? "التالي" : "Next")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
