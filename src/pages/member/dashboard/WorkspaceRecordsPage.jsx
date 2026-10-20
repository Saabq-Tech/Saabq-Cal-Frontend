import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import client, { endpoints } from "../../../api/client";
import Icon from "../../../components/common/Icon";
import { useAuth } from "../../../context/AuthContext";
import { useLanguage } from "../../../context/LanguageContext";
import { getRecordTypes, getRecordTitle } from "./components/recordTypes";
import "./components/CustomerRecordTab.css";

/** Latest record entries across all customers, each linking to its file. */
export default function WorkspaceRecordsPage() {
  const { user } = useAuth();
  const { t, lang } = useLanguage();
  const workspace = user?.workspace;
  const types = useMemo(() => getRecordTypes(workspace), [workspace]);
  const typeById = useMemo(
    () => Object.fromEntries(types.map((ty) => [ty.id, ty])),
    [types],
  );
  const label = (obj) => obj?.[lang] || obj?.ar || "";

  const [type, setType] = useState("");
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    client
      .get(endpoints.workspaceRecentRecords, {
        params: { type: type || undefined, per_page: 50 },
      })
      .then((res) => setRecords(res.data?.data || []))
      .catch(() => setRecords([]))
      .finally(() => setLoading(false));
  }, [type]);

  return (
    <div className="cr-tab animate-fade-in">
      <div className="cr-header">
        <h3>{getRecordTitle(workspace, lang)}</h3>
      </div>

      <div className="cr-filters">
        <button
          type="button"
          className={`cr-filter${type === "" ? " active" : ""}`}
          onClick={() => setType("")}
        >
          {t("all") || "الكل"}
        </button>
        {types.map((ty) => (
          <button
            key={ty.id}
            type="button"
            className={`cr-filter${type === ty.id ? " active" : ""}`}
            onClick={() => setType(ty.id)}
          >
            {label(ty.label)}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="cr-empty">{t("loading") || "جاري التحميل..."}</p>
      ) : records.length === 0 ? (
        <p className="cr-empty">
          {t("recordEmptyWorkspace") ||
            "لا توجد إدخالات بعد. افتح ملف أي عميل وأضف أول إدخال من تبويب السجل."}
        </p>
      ) : (
        <ol className="cr-timeline">
          {records.map((record) => {
            const ty = typeById[record.type] || typeById.note;
            return (
              <li key={record.id} className="cr-entry" style={{ "--cr-color": ty?.color }}>
                <span className="cr-entry-dot">
                  <Icon name={ty?.icon || "file-text"} size={14} />
                </span>
                <Link
                  to={`/member/workspace/customers/${record.customer?.id}?tab=record`}
                  className="cr-entry-card"
                  style={{ textDecoration: "none" }}
                >
                  <div className="cr-entry-head">
                    <strong style={{ color: "var(--heading)" }}>{record.customer?.name}</strong>
                    <span className="cr-entry-type">{label(ty?.label) || record.type}</span>
                    {record.title && <span>{record.title}</span>}
                    <span className="cr-entry-meta">
                      {record.record_date}
                      {record.author && ` · ${record.author.name}`}
                      {record.attachments?.length > 0 && ` · 📎 ${record.attachments.length}`}
                    </span>
                  </div>
                  {record.body && <p className="cr-entry-body">{record.body}</p>}
                </Link>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
