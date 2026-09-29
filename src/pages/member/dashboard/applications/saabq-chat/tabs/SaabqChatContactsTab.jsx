import React, { useState, useEffect } from "react";
import client, { endpoints } from "../../../../../../api/client";
import Icon from "../../../../../../components/common/Icon";
import { Link } from "react-router-dom";
import { useLanguage } from "../../../../../../context/LanguageContext";

export default function SaabqChatContactsTab() {
  const { t } = useLanguage();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setLoading(true);
    client
      .get(endpoints.workspaceSaabqChatContacts || endpoints.chatContacts, {
        params: { q: search },
      })
      .then((res) => {
        const list = res.data?.data?.contacts || res.data?.data || [];
        setContacts(Array.isArray(list) ? list : []);
      })
      .catch(() => {
        setContacts([]);
      })
      .finally(() => setLoading(false));
  }, [search]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Search & Actions Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
          background: "var(--surface)",
          padding: "16px 20px",
          borderRadius: "var(--radius-lg, 16px)",
          border: "1px solid var(--border)",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <div
          style={{
            position: "relative",
            minWidth: 280,
            flex: 1,
            maxWidth: 440,
          }}
        >
          <Icon
            name="search"
            size={16}
            style={{
              position: "absolute",
              top: "50%",
              insetInlineStart: 12,
              transform: "translateY(-50%)",
              color: "var(--muted)",
            }}
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={
              t("searchContactsPlaceholder") ||
              "البحث بالاسم، البريد أو رقم الهاتف..."
            }
            style={{
              width: "100%",
              padding: "9px 14px 9px 36px",
              borderRadius: 8,
              border: "1px solid var(--border)",
              background: "var(--surface-bg)",
              fontSize: "0.88rem",
            }}
          />
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <Link
            to="/member/workspace/customers"
            className="btn btn-secondary btn-sm"
            style={{ gap: 6 }}
          >
            <Icon name="users" size={14} />
            <span>{t("viewSaabqCustomers") || "عرض عملاء سابق"}</span>
          </Link>
        </div>
      </div>

      {/* Contacts Table */}
      <div
        style={{
          background: "var(--surface)",
          borderRadius: "var(--radius-lg, 16px)",
          border: "1px solid var(--border)",
          overflow: "hidden",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        {loading ? (
          <div
            style={{ padding: 48, textAlign: "center", color: "var(--muted)" }}
          >
            جاري تحميل جهات الاتصال...
          </div>
        ) : contacts.length === 0 ? (
          <div
            style={{ padding: 48, textAlign: "center", color: "var(--muted)" }}
          >
            لا توجد جهات اتصال تطابق معايير البحث
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                textAlign: "start",
                fontSize: "0.88rem",
              }}
            >
              <thead>
                <tr
                  style={{
                    background: "var(--surface-subtle, rgba(0,0,0,0.02))",
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  <th
                    style={{
                      padding: "12px 18px",
                      fontWeight: 700,
                      color: "var(--heading)",
                    }}
                  >
                    الاسم
                  </th>
                  <th
                    style={{
                      padding: "12px 18px",
                      fontWeight: 700,
                      color: "var(--heading)",
                    }}
                  >
                    بيانات الاتصال
                  </th>
                  <th
                    style={{
                      padding: "12px 18px",
                      fontWeight: 700,
                      color: "var(--heading)",
                    }}
                  >
                    قناة المصدر
                  </th>
                  <th
                    style={{
                      padding: "12px 18px",
                      fontWeight: 700,
                      color: "var(--heading)",
                    }}
                  >
                    مواعيد سابق
                  </th>
                  <th
                    style={{
                      padding: "12px 18px",
                      fontWeight: 700,
                      color: "var(--heading)",
                    }}
                  >
                    آخر نشاط
                  </th>
                  <th
                    style={{
                      padding: "12px 18px",
                      fontWeight: 700,
                      color: "var(--heading)",
                      textAlign: "end",
                    }}
                  >
                    إجراءات
                  </th>
                </tr>
              </thead>
              <tbody>
                {contacts.map((c) => (
                  <tr
                    key={c.id}
                    style={{
                      borderBottom:
                        "1px solid var(--border-subtle, rgba(0,0,0,0.05))",
                      transition: "background 0.15s ease",
                    }}
                  >
                    <td style={{ padding: "14px 18px" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                        }}
                      >
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: "50%",
                            background: "rgba(2, 105, 130, 0.12)",
                            color: "var(--primary)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 700,
                            fontSize: "0.95rem",
                          }}
                        >
                          {(c.name || "ع")[0]}
                        </div>
                        <div>
                          <div
                            style={{ fontWeight: 700, color: "var(--heading)" }}
                          >
                            {c.name}
                          </div>
                          <div
                            style={{
                              fontSize: "0.76rem",
                              color: "var(--muted)",
                            }}
                          >
                            {c.city || "المملكة العربية السعودية"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "14px 18px" }}>
                      <div
                        style={{ fontSize: "0.82rem", color: "var(--heading)" }}
                      >
                        {c.email || "—"}
                      </div>
                      <div
                        style={{
                          fontSize: "0.76rem",
                          color: "var(--muted)",
                          direction: "ltr",
                          textAlign: "end",
                        }}
                      >
                        {c.phone || "—"}
                      </div>
                    </td>
                    <td style={{ padding: "14px 18px" }}>
                      <span
                        style={{
                          fontSize: "0.74rem",
                          padding: "3px 8px",
                          borderRadius: 6,
                          fontWeight: 700,
                          background:
                            c.channel === "WhatsApp"
                              ? "#25D36622"
                              : c.channel === "Telegram"
                                ? "#0088cc22"
                                : "rgba(2, 105, 130, 0.12)",
                          color:
                            c.channel === "WhatsApp"
                              ? "#25D366"
                              : c.channel === "Telegram"
                                ? "#0088cc"
                                : "var(--primary)",
                        }}
                      >
                        {c.channel || "Web"}
                      </span>
                    </td>
                    <td style={{ padding: "14px 18px" }}>
                      <span
                        style={{ fontWeight: 800, color: "var(--primary)" }}
                      >
                        {c.appointments_count || 0}
                      </span>{" "}
                      مواعيد
                    </td>
                    <td
                      style={{
                        padding: "14px 18px",
                        color: "var(--text-secondary)",
                        fontSize: "0.8rem",
                      }}
                    >
                      {c.last_activity || "مؤخراً"}
                    </td>
                    <td style={{ padding: "14px 18px", textAlign: "end" }}>
                      <Link
                        to="/member/workspace/applications/saabq-chat/inbox"
                        className="btn btn-primary btn-sm"
                        style={{
                          padding: "4px 10px",
                          fontSize: "0.78rem",
                          gap: 4,
                        }}
                      >
                        <Icon name="message-square" size={13} />
                        <span>{t("conversationBtn") || "محادثة"}</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
