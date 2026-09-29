import React, { useState, useEffect } from "react";
import { useLanguage } from "../../../../../../context/LanguageContext";
import client, { endpoints } from "../../../../../../api/client";

export default function SaabqChatSlaTab() {
  const { t } = useLanguage();
  const [slaData, setSlaData] = useState(null);
  const [_loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    client
      .get(endpoints.workspaceSaabqChatSla || endpoints.chatSla)
      .then((res) => {
        setSlaData(res.data?.data || null);
      })
      .catch(() => {
        setSlaData(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const policies = Array.isArray(slaData?.policies) ? slaData.policies : [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Top Metrics Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
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
              fontSize: "0.82rem",
              color: "var(--text-secondary)",
              marginBottom: 6,
            }}
          >
            نسبة الالتزام بالاتفاقية (Compliance)
          </div>
          <div
            style={{ fontSize: "1.8rem", fontWeight: 800, color: "#10b981" }}
          >
            {slaData?.compliance_rate != null
              ? `${slaData.compliance_rate}%`
              : slaData?.overall_compliance || "—"}
          </div>
          <div
            style={{ fontSize: "0.72rem", color: "var(--muted)", marginTop: 4 }}
          >
            ضمن المعيار المستهدف (&gt; 95%)
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
              fontSize: "0.82rem",
              color: "var(--text-secondary)",
              marginBottom: 6,
            }}
          >
            المحادثات المتجاوزة للوقت
          </div>
          <div
            style={{ fontSize: "1.8rem", fontWeight: 800, color: "#f59e0b" }}
          >
            {slaData?.breached_count ?? 0}
          </div>
          <div
            style={{ fontSize: "0.72rem", color: "var(--muted)", marginTop: 4 }}
          >
            تم حلها خلال 24 ساعة الماضية
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
              fontSize: "0.82rem",
              color: "var(--text-secondary)",
              marginBottom: 6,
            }}
          >
            سياسات الخدمة النشطة
          </div>
          <div
            style={{
              fontSize: "1.8rem",
              fontWeight: 800,
              color: "var(--primary)",
            }}
          >
            {policies.length}
          </div>
          <div
            style={{ fontSize: "0.72rem", color: "var(--muted)", marginTop: 4 }}
          >
            مطبقة على كافة قنوات المحادثة
          </div>
        </div>
      </div>

      {/* Policies List */}
      <div
        style={{
          background: "var(--surface)",
          borderRadius: "var(--radius-lg, 16px)",
          border: "1px solid var(--border)",
          padding: 24,
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <h3
          style={{
            margin: "0 0 6px",
            fontSize: "1.05rem",
            fontWeight: 800,
            color: "var(--heading)",
          }}
        >
          سياسات ومستويات الخدمة (SLA Policies)
        </h3>
        <p
          style={{
            margin: "0 0 20px",
            fontSize: "0.84rem",
            color: "var(--text-secondary)",
          }}
        >
          تحديد الحدود القصوى لزمن الرد الأول وزمن إغلاق وحل المحادثات حسب
          الأولوية.
        </p>

        {policies.length === 0 ? (
          <div
            style={{
              padding: "32px 16px",
              textAlign: "center",
              color: "var(--muted)",
              fontSize: "0.88rem",
            }}
          >
            {t("noSlaFound") ||
              "لم يتم تكوين سياسات مستوى الخدمة (SLA) بعد في حساب سابق شات."}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {policies.map((p) => (
              <div
                key={p.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "16px 20px",
                  borderRadius: 12,
                  border: "1px solid var(--border)",
                  background: "var(--surface-subtle, rgba(0,0,0,0.01))",
                  flexWrap: "wrap",
                  gap: 16,
                }}
              >
                <div>
                  <h4
                    style={{
                      margin: "0 0 4px",
                      fontSize: "0.95rem",
                      fontWeight: 700,
                      color: "var(--heading)",
                    }}
                  >
                    {p.name}
                  </h4>
                  <div
                    style={{
                      display: "flex",
                      gap: 16,
                      fontSize: "0.8rem",
                      color: "var(--text-secondary)",
                      marginTop: 6,
                    }}
                  >
                    <span>
                      <strong>{t("firstResponse") || "الرد الأول"}:</strong>{" "}
                      {t("within") || "خلال"}{" "}
                      {p.first_response_time_minutes ||
                        p.threshold_first_response ||
                        "—"}{" "}
                      {t("minuteUnit") || "دقيقة"}
                    </span>
                    <span>
                      <strong>
                        {t("resolutionAndClose") || "الحل والإغلاق"}:
                      </strong>{" "}
                      {t("within") || "خلال"}{" "}
                      {p.resolution_time_minutes ||
                        p.threshold_resolution ||
                        "—"}{" "}
                      {t("minuteUnit") || "دقيقة"}
                    </span>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{ textAlign: "end" }}>
                    <div style={{ fontSize: "0.74rem", color: "var(--muted)" }}>
                      {t("complianceRate") || "نسبة الالتزام"}
                    </div>
                    <div
                      style={{
                        fontSize: "1.1rem",
                        fontWeight: 800,
                        color: "#10b981",
                      }}
                    >
                      {p.compliance != null ? `${p.compliance}%` : "100%"}
                    </div>
                  </div>
                  <span
                    style={{
                      padding: "4px 12px",
                      borderRadius: 99,
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      background: "rgba(16, 185, 129, 0.12)",
                      color: "#10b981",
                    }}
                  >
                    مفعلة
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
