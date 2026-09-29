import React, { useState, useEffect } from "react";
import client, { endpoints } from "../../../../../../api/client";
import { useLanguage } from "../../../../../../context/LanguageContext";

export default function SaabqChatReportsTab() {
  const { t } = useLanguage();
  const [reports, setReports] = useState(null);
  const [_loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    client
      .get(endpoints.workspaceSaabqChatReports || endpoints.chatReports)
      .then((res) => {
        setReports(res.data?.data || null);
      })
      .catch(() => {
        setReports(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const totalConversations = reports?.total_conversations ?? 0;
  const channelBreakdown = Array.isArray(reports?.channel_breakdown)
    ? reports.channel_breakdown
    : [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <h3
          style={{
            margin: "0 0 6px",
            fontSize: "1.15rem",
            fontWeight: 800,
            color: "var(--heading)",
          }}
        >
          التقارير ومؤشرات الأداء المباشرة (Omnichannel Analytics)
        </h3>
        <p
          style={{
            margin: 0,
            fontSize: "0.85rem",
            color: "var(--text-secondary)",
          }}
        >
          إحصائيات تفصيلية لحجم المحادثات، سرعة استجابة الفريق، ومعدلات رضا
          العملاء (CSAT).
        </p>
      </div>

      {/* KPI Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 16,
        }}
      >
        <div
          style={{
            background: "var(--surface)",
            padding: 20,
            borderRadius: "var(--radius-lg, 16px)",
            border: "1px solid var(--border)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <div
            style={{
              fontSize: "0.8rem",
              color: "var(--text-secondary)",
              marginBottom: 6,
            }}
          >
            إجمالي المحادثات
          </div>
          <div
            style={{
              fontSize: "1.8rem",
              fontWeight: 800,
              color: "var(--heading)",
            }}
          >
            {totalConversations}
          </div>
          <div
            style={{ fontSize: "0.72rem", color: "var(--muted)", marginTop: 4 }}
          >
            خلال آخر 30 يوماً
          </div>
        </div>

        <div
          style={{
            background: "var(--surface)",
            padding: 20,
            borderRadius: "var(--radius-lg, 16px)",
            border: "1px solid var(--border)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <div
            style={{
              fontSize: "0.8rem",
              color: "var(--text-secondary)",
              marginBottom: 6,
            }}
          >
            متوسط زمن الرد الأول
          </div>
          <div
            style={{
              fontSize: "1.8rem",
              fontWeight: 800,
              color: "var(--primary)",
            }}
          >
            {reports?.avg_first_response_time_minutes != null
              ? `${reports.avg_first_response_time_minutes} ${t("minutesShort") || "د"}`
              : "—"}
          </div>
          <div
            style={{ fontSize: "0.72rem", color: "var(--muted)", marginTop: 4 }}
          >
            {t("teamResponseSpeed") || "سرعة استجابة الفريق"}
          </div>
        </div>

        <div
          style={{
            background: "var(--surface)",
            padding: 20,
            borderRadius: "var(--radius-lg, 16px)",
            border: "1px solid var(--border)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <div
            style={{
              fontSize: "0.8rem",
              color: "var(--text-secondary)",
              marginBottom: 6,
            }}
          >
            {t("resolutionRate") || "نسبة الحل والإغلاق"}
          </div>
          <div
            style={{ fontSize: "1.8rem", fontWeight: 800, color: "#10b981" }}
          >
            {reports?.resolution_rate != null
              ? `${reports.resolution_rate}%`
              : "—"}
          </div>
          <div
            style={{ fontSize: "0.72rem", color: "var(--muted)", marginTop: 4 }}
          >
            {reports?.resolved_conversations != null
              ? `${reports.resolved_conversations} ` +
                (t("resolvedConversationsCount") || "محادثة تم حلها")
              : t("basedOnCompletedTickets") || "بناءً على التذاكر المكتملة"}
          </div>
        </div>

        <div
          style={{
            background: "var(--surface)",
            padding: 20,
            borderRadius: "var(--radius-lg, 16px)",
            border: "1px solid var(--border)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <div
            style={{
              fontSize: "0.8rem",
              color: "var(--text-secondary)",
              marginBottom: 6,
            }}
          >
            تقييم رضا العملاء (CSAT)
          </div>
          <div
            style={{ fontSize: "1.8rem", fontWeight: 800, color: "#f59e0b" }}
          >
            {reports?.csat_score != null ? `⭐ ${reports.csat_score}` : "—"}
          </div>
          <div
            style={{ fontSize: "0.72rem", color: "var(--muted)", marginTop: 4 }}
          >
            معدل التقييم العام
          </div>
        </div>
      </div>

      {/* Channel Breakdown Card */}
      <div
        style={{
          background: "var(--surface)",
          borderRadius: "var(--radius-lg, 16px)",
          border: "1px solid var(--border)",
          padding: 24,
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <h4
          style={{
            margin: "0 0 16px",
            fontSize: "1rem",
            fontWeight: 800,
            color: "var(--heading)",
          }}
        >
          توزيع المحادثات حسب القناة (Channel Distribution)
        </h4>

        {channelBreakdown.length === 0 ? (
          <div
            style={{
              padding: "32px 16px",
              textAlign: "center",
              color: "var(--muted)",
              fontSize: "0.88rem",
            }}
          >
            لا توجد بيانات توزيع قنوات مسجلة حالياً.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {channelBreakdown.map((ch, idx) => (
              <div key={idx}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "0.86rem",
                    marginBottom: 6,
                  }}
                >
                  <span style={{ fontWeight: 600, color: "var(--heading)" }}>
                    {ch.channel}
                  </span>
                  <span style={{ fontWeight: 800, color: "var(--primary)" }}>
                    {ch.count} محادثة ({ch.percentage}%)
                  </span>
                </div>
                <div
                  style={{
                    height: 8,
                    borderRadius: 99,
                    background: "var(--surface-subtle, rgba(0,0,0,0.06))",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${ch.percentage}%`,
                      background:
                        "linear-gradient(90deg, var(--primary), var(--primary-light, #03c4e1))",
                      borderRadius: 99,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
