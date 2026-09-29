import React, { useState, useEffect } from "react";
import client, { endpoints } from "../../../../../../api/client";
import Icon from "../../../../../../components/common/Icon";
import { useLanguage } from "../../../../../../context/LanguageContext";

export default function SaabqChatAutomationsTab() {
  const { t } = useLanguage();
  const [canned, setCanned] = useState([]);
  const [rules, setRules] = useState([]);
  const [_loading, setLoading] = useState(false);
  const [newShortcut, setNewShortcut] = useState("");
  const [newContent, setNewContent] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    setLoading(true);
    client
      .get(endpoints.workspaceSaabqChatAutomations || endpoints.chatAutomations)
      .then((res) => {
        const data = res.data?.data || {};
        setCanned(data.canned_responses || []);
        setRules(data.automation_rules || []);
      })
      .catch(() => {
        setCanned([]);
        setRules([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleAddCanned = (e) => {
    e.preventDefault();
    if (!newShortcut.trim() || !newContent.trim()) return;
    const item = {
      short_code: newShortcut.startsWith("/") ? newShortcut : `/${newShortcut}`,
      content: newContent.trim(),
    };
    setCanned((prev) => [...prev, item]);
    setNewShortcut("");
    setNewContent("");
    setShowAddModal(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Canned Responses Section */}
      <div
        style={{
          background: "var(--surface)",
          borderRadius: "var(--radius-lg, 16px)",
          border: "1px solid var(--border)",
          padding: 24,
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 18,
          }}
        >
          <div>
            <h3
              style={{
                margin: "0 0 4px",
                fontSize: "1.05rem",
                fontWeight: 800,
                color: "var(--heading)",
              }}
            >
              الردود الجاهزة السريعة (Canned Responses)
            </h3>
            <p
              style={{
                margin: 0,
                fontSize: "0.82rem",
                color: "var(--text-secondary)",
              }}
            >
              اكتب الاختصار في شريط المحادثة (مثل /booking) لإدراج الرد فوراً.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary btn-sm"
            style={{ gap: 6 }}
          >
            <Icon name="plus" size={14} />
            <span>{t("addCannedResponse") || "إضافة رد سريع"}</span>
          </button>
        </div>

        {showAddModal && (
          <form
            onSubmit={handleAddCanned}
            style={{
              background: "var(--surface-subtle, rgba(0,0,0,0.02))",
              padding: 16,
              borderRadius: 10,
              border: "1px solid var(--border)",
              marginBottom: 18,
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "180px 1fr",
                gap: 12,
              }}
            >
              <input
                type="text"
                placeholder={t("shortcutPlaceholder") || "/اختصار"}
                value={newShortcut}
                onChange={(e) => setNewShortcut(e.target.value)}
                style={{
                  padding: "8px 12px",
                  borderRadius: 6,
                  border: "1px solid var(--border)",
                  background: "var(--surface)",
                  fontSize: "0.88rem",
                }}
              />
              <input
                type="text"
                placeholder={
                  t("fullResponsePlaceholder") || "نص الرد الكامل..."
                }
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                style={{
                  padding: "8px 12px",
                  borderRadius: 6,
                  border: "1px solid var(--border)",
                  background: "var(--surface)",
                  fontSize: "0.88rem",
                }}
              />
            </div>
            <div
              style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}
            >
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="btn btn-secondary btn-sm"
              >
                إلغاء
              </button>
              <button type="submit" className="btn btn-primary btn-sm">
                حفظ
              </button>
            </div>
          </form>
        )}

        {canned.length === 0 ? (
          <div
            style={{
              padding: "32px 16px",
              textAlign: "center",
              color: "var(--muted)",
              fontSize: "0.88rem",
            }}
          >
            لا توجد ردود جاهزة مضافة حالياً.
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 14,
            }}
          >
            {canned.map((c, idx) => (
              <div
                key={idx}
                style={{
                  padding: "14px 16px",
                  borderRadius: 10,
                  border: "1px solid var(--border)",
                  background: "var(--surface-subtle, rgba(0,0,0,0.01))",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 6,
                  }}
                >
                  <span
                    style={{
                      fontWeight: 800,
                      color: "var(--primary)",
                      fontSize: "0.88rem",
                      direction: "ltr",
                    }}
                  >
                    {c.short_code}
                  </span>
                  <span style={{ fontSize: "0.72rem", color: "var(--muted)" }}>
                    جاهز
                  </span>
                </div>
                <p
                  style={{
                    margin: 0,
                    fontSize: "0.84rem",
                    color: "var(--heading)",
                    lineHeight: 1.5,
                  }}
                >
                  {c.content}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Automation Rules Section */}
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
          قواعد الأتمتة والتوجيه الذكي (Automation Rules)
        </h3>
        <p
          style={{
            margin: "0 0 16px",
            fontSize: "0.82rem",
            color: "var(--text-secondary)",
          }}
        >
          تطبيق إجراءات تلقائية على المحادثات بناءً على محتوى الرسائل أو قنوات
          الاتصال.
        </p>

        {rules.length === 0 ? (
          <div
            style={{
              padding: "32px 16px",
              textAlign: "center",
              color: "var(--muted)",
              fontSize: "0.88rem",
            }}
          >
            لا توجد قواعد أتمتة مضافة حالياً.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {rules.map((r, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "14px 18px",
                  borderRadius: 10,
                  border: "1px solid var(--border)",
                  background: "var(--surface-subtle, rgba(0,0,0,0.01))",
                  flexWrap: "wrap",
                  gap: 12,
                }}
              >
                <div>
                  <h4
                    style={{
                      margin: "0 0 4px",
                      fontSize: "0.9rem",
                      fontWeight: 700,
                      color: "var(--heading)",
                    }}
                  >
                    {r.name}
                  </h4>
                  <div
                    style={{
                      display: "flex",
                      gap: 12,
                      fontSize: "0.76rem",
                      color: "var(--muted)",
                    }}
                  >
                    <span>
                      <strong>{t("conditionLabel") || "الشرط:"}</strong>{" "}
                      {r.trigger}
                    </span>
                    <span>
                      <strong>{t("actionLabel") || "الإجراء:"}</strong>{" "}
                      {r.action}
                    </span>
                  </div>
                </div>
                <div>
                  <span
                    style={{
                      padding: "3px 10px",
                      borderRadius: 99,
                      fontSize: "0.74rem",
                      fontWeight: 700,
                      background: "rgba(16, 185, 129, 0.12)",
                      color: "#10b981",
                    }}
                  >
                    {t("activeStatus") || "نشط"}
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
