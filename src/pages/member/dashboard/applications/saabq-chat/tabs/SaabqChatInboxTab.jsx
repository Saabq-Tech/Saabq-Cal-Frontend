import React, { useState, useEffect } from "react";
import client, { endpoints } from "../../../../../../api/client";
import Icon from "../../../../../../components/common/Icon";
import { Link } from "react-router-dom";
import { useLanguage } from "../../../../../../context/LanguageContext";

export default function SaabqChatInboxTab() {
  const { t } = useLanguage();
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [replyText, setReplyText] = useState("");
  const [isPrivateNote, setIsPrivateNote] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [cannedResponses, setCannedResponses] = useState([]);
  const [showCannedDropdown, setShowCannedDropdown] = useState(false);

  // Load conversations & canned responses
  useEffect(() => {
    setLoading(true);
    // Fetch conversations list
    client
      .get(endpoints.chats)
      .then((res) => {
        const list = Array.isArray(res.data?.data) ? res.data.data : [];
        setConversations(list);
        if (list.length > 0) {
          setActiveConversation(list[0]);
        }
      })
      .catch(() => {
        setConversations([]);
        setActiveConversation(null);
      })
      .finally(() => setLoading(false));

    // Fetch automations/canned
    client
      .get(endpoints.workspaceSaabqChatAutomations || endpoints.chatAutomations)
      .then((res) => {
        const canned = res.data?.data?.canned_responses || [];
        setCannedResponses(canned);
      })
      .catch(() => {
        setCannedResponses([]);
      });
  }, []);

  // Load messages when active conversation changes
  useEffect(() => {
    if (!activeConversation) return;
    client
      .get(endpoints.chatDetails(activeConversation.id))
      .then((res) => {
        const msgs = res.data?.data?.messages || [];
        setMessages(msgs);
      })
      .catch(() => {
        setMessages([]);
      });
  }, [activeConversation]);

  // Send message handler
  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!replyText.trim() || !activeConversation) return;

    const newMsg = {
      id: Date.now(),
      sender_type: isPrivateNote ? "team_note" : "agent",
      sender_name: isPrivateNote
        ? t("privateTeamNote") || "ملاحظة فريق خاصة"
        : t("customerSupport") || "خدمة العملاء",
      content: replyText.trim(),
      created_at: t("now") || "الآن",
      is_private: isPrivateNote,
    };

    setMessages((prev) => [...prev, newMsg]);
    const textToSend = replyText;
    setReplyText("");
    setSending(true);

    try {
      await client.post(endpoints.chatSendMessage, {
        conversation_id: activeConversation.id,
        content: textToSend,
        is_private: isPrivateNote,
      });
    } catch {
      // optimistic update retained
    } finally {
      setSending(false);
    }
  };

  // AI Rewrite
  const handleAiRewrite = async (tone = "friendly") => {
    if (!replyText.trim()) return;
    setAiGenerating(true);
    try {
      const res = await client.post(
        endpoints.workspaceSaabqChatCaptainAiTask ||
          endpoints.chatCaptainAiTask,
        {
          task: "rewrite",
          text: replyText,
          tone,
        },
      );
      if (res.data?.data?.output || res.data?.data?.result) {
        setReplyText(res.data.data.output || res.data.data.result);
      }
    } catch {
      // no mock rewrite fallback
    } finally {
      setAiGenerating(false);
    }
  };

  // Filter conversations
  const filteredConversations = conversations.filter((c) => {
    if (filter === "open" && c.status !== "open") return false;
    if (filter === "resolved" && c.status !== "resolved") return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const name = (c.customer_name || "").toLowerCase();
      const last = (c.last_message || "").toLowerCase();
      return name.includes(q) || last.includes(q);
    }
    return true;
  });

  return (
    <div
      className="saabq-chat-inbox-grid"
      style={{
        display: "grid",
        gridTemplateColumns: "320px 1fr 280px",
        gap: 16,
        background: "var(--surface)",
        borderRadius: "var(--radius-lg, 16px)",
        border: "1px solid var(--border)",
        minHeight: 680,
        boxShadow: "var(--shadow-sm)",
        overflow: "hidden",
      }}
    >
      {/* 1. Left Column: Conversations List & Filters */}
      <div
        style={{
          borderInlineEnd: "1px solid var(--border)",
          display: "flex",
          flexDirection: "column",
          background: "var(--surface-subtle, rgba(0,0,0,0.02))",
        }}
      >
        <div
          style={{
            padding: "14px 16px",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <div style={{ position: "relative", marginBottom: 12 }}>
            <Icon
              name="search"
              size={14}
              style={{
                position: "absolute",
                top: "50%",
                insetInlineStart: 10,
                transform: "translateY(-50%)",
                color: "var(--muted)",
              }}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("searchConversations") || "ابحث في المحادثات..."}
              style={{
                width: "100%",
                padding: "8px 12px 8px 32px",
                borderRadius: 8,
                border: "1px solid var(--border)",
                background: "var(--surface)",
                fontSize: "0.85rem",
              }}
            />
          </div>

          <div style={{ display: "flex", gap: 6 }}>
            {["all", "open", "resolved"].map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`btn btn-sm ${filter === f ? "btn-primary" : "btn-secondary"}`}
                style={{
                  fontSize: "0.78rem",
                  padding: "4px 10px",
                  borderRadius: 6,
                  flex: 1,
                  textTransform: "capitalize",
                }}
              >
                {f === "all"
                  ? t("all") || "الكل"
                  : f === "open"
                    ? t("open") || "مفتوحة"
                    : t("resolved") || "مغلقة"}
              </button>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto" }}>
          {loading ? (
            <div
              style={{
                padding: 24,
                textAlign: "center",
                color: "var(--muted)",
              }}
            >
              جاري تحميل المحادثات...
            </div>
          ) : filteredConversations.length === 0 ? (
            <div
              style={{
                padding: 32,
                textAlign: "center",
                color: "var(--muted)",
                fontSize: "0.88rem",
              }}
            >
              لا توجد محادثات تطابق البحث
            </div>
          ) : (
            filteredConversations.map((c) => {
              const isActive = activeConversation?.id === c.id;
              return (
                <div
                  key={c.id}
                  onClick={() => setActiveConversation(c)}
                  style={{
                    padding: "12px 16px",
                    borderBottom:
                      "1px solid var(--border-subtle, rgba(0,0,0,0.05))",
                    cursor: "pointer",
                    background: isActive
                      ? "rgba(2, 105, 130, 0.08)"
                      : "transparent",
                    borderInlineStart: isActive
                      ? "3px solid var(--primary)"
                      : "3px solid transparent",
                    transition: "all 0.15s ease",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 4,
                    }}
                  >
                    <span
                      style={{
                        fontWeight: 700,
                        fontSize: "0.88rem",
                        color: "var(--heading)",
                      }}
                    >
                      {c.customer_name || "عميل غير معروف"}
                    </span>
                    <span
                      style={{ fontSize: "0.72rem", color: "var(--muted)" }}
                    >
                      {c.created_at || "الآن"}
                    </span>
                  </div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "0.8rem",
                      color: "var(--text-secondary)",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {c.last_message || "لا توجد رسائل"}
                  </p>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      marginTop: 6,
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.7rem",
                        padding: "2px 6px",
                        borderRadius: 4,
                        background:
                          c.channel === "whatsapp"
                            ? "#25D36622"
                            : c.channel === "telegram"
                              ? "#0088cc22"
                              : "rgba(2, 105, 130, 0.12)",
                        color:
                          c.channel === "whatsapp"
                            ? "#25D366"
                            : c.channel === "telegram"
                              ? "#0088cc"
                              : "var(--primary)",
                        fontWeight: 600,
                      }}
                    >
                      {c.channel || "Web Widget"}
                    </span>
                    {c.unread_count > 0 && (
                      <span
                        style={{
                          marginInlineStart: "auto",
                          background: "#ef4444",
                          color: "#fff",
                          borderRadius: 99,
                          fontSize: "0.68rem",
                          fontWeight: 800,
                          padding: "1px 6px",
                        }}
                      >
                        {c.unread_count}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 2. Middle Column: Active Chat Thread & Reply Box */}
      <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
        {activeConversation ? (
          <>
            {/* Header */}
            <div
              style={{
                padding: "14px 20px",
                borderBottom: "1px solid var(--border)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <h4
                  style={{
                    margin: 0,
                    fontSize: "0.98rem",
                    fontWeight: 800,
                    color: "var(--heading)",
                  }}
                >
                  {activeConversation.customer_name}
                </h4>
                <span style={{ fontSize: "0.75rem", color: "var(--muted)" }}>
                  قناة المحادثة: {activeConversation.channel || "موقع الويب"}
                </span>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <span
                  style={{
                    padding: "4px 10px",
                    borderRadius: 99,
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    background:
                      activeConversation.status === "open"
                        ? "rgba(16, 185, 129, 0.12)"
                        : "rgba(100, 116, 139, 0.12)",
                    color:
                      activeConversation.status === "open"
                        ? "#10b981"
                        : "#64748b",
                  }}
                >
                  {activeConversation.status === "open"
                    ? t("activeConversation") || "محادثة نشطة"
                    : t("closedConversation") || "مغلقة"}
                </span>
              </div>
            </div>

            {/* Messages Body */}
            <div
              style={{
                flex: 1,
                padding: 20,
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: 12,
                background: "var(--surface-bg, rgba(0,0,0,0.01))",
              }}
            >
              {messages.map((m) => {
                const isCustomer = m.sender_type === "customer";
                const isNote = m.is_private || m.sender_type === "team_note";

                if (isNote) {
                  return (
                    <div
                      key={m.id}
                      style={{
                        background: "rgba(245, 158, 11, 0.1)",
                        border: "1px dashed rgba(245, 158, 11, 0.35)",
                        padding: "10px 14px",
                        borderRadius: 8,
                        fontSize: "0.85rem",
                        color: "#d97706",
                        margin: "4px 0",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          fontWeight: 700,
                          marginBottom: 4,
                        }}
                      >
                        <Icon name="lock" size={13} />
                        <span>
                          {t("privateTeamNote") || "ملاحظة فريق خاصة:"}
                        </span>
                        <span
                          style={{
                            marginInlineStart: "auto",
                            fontSize: "0.72rem",
                            opacity: 0.8,
                          }}
                        >
                          {m.created_at}
                        </span>
                      </div>
                      <div>{m.content}</div>
                    </div>
                  );
                }

                return (
                  <div
                    key={m.id}
                    style={{
                      alignSelf: isCustomer ? "flex-start" : "flex-end",
                      maxWidth: "75%",
                      background: isCustomer
                        ? "var(--surface)"
                        : "var(--primary)",
                      color: isCustomer ? "var(--heading)" : "#ffffff",
                      border: isCustomer ? "1px solid var(--border)" : "none",
                      padding: "10px 14px",
                      borderRadius: 12,
                      boxShadow: "var(--shadow-xs)",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "0.75rem",
                        opacity: 0.8,
                        marginBottom: 2,
                      }}
                    >
                      {m.sender_name}
                    </div>
                    <div style={{ fontSize: "0.88rem", lineHeight: 1.5 }}>
                      {m.content}
                    </div>
                    <div
                      style={{
                        fontSize: "0.68rem",
                        opacity: 0.7,
                        textAlign: "end",
                        marginTop: 4,
                      }}
                    >
                      {m.created_at}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Composer */}
            <div
              style={{
                padding: "12px 16px",
                borderTop: "1px solid var(--border)",
                background: "var(--surface)",
              }}
            >
              {/* Toolbar */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 8,
                }}
              >
                <button
                  type="button"
                  onClick={() => setIsPrivateNote(!isPrivateNote)}
                  style={{
                    fontSize: "0.76rem",
                    padding: "3px 10px",
                    borderRadius: 6,
                    border: "1px solid var(--border)",
                    background: isPrivateNote ? "#fef3c7" : "transparent",
                    color: isPrivateNote ? "#b45309" : "var(--text-secondary)",
                    fontWeight: isPrivateNote ? 700 : 500,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <Icon
                    name={isPrivateNote ? "lock" : "message-circle"}
                    size={12}
                  />
                  <span>
                    {isPrivateNote
                      ? t("privateNote") || "ملاحظة خاصة"
                      : t("directReply") || "رد مباشر"}
                  </span>
                </button>

                <div style={{ position: "relative" }}>
                  <button
                    type="button"
                    onClick={() => setShowCannedDropdown(!showCannedDropdown)}
                    style={{
                      fontSize: "0.76rem",
                      padding: "3px 10px",
                      borderRadius: 6,
                      border: "1px solid var(--border)",
                      background: "transparent",
                      color: "var(--text-secondary)",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <Icon name="zap" size={12} />
                    <span>{t("cannedResponses") || "ردود جاهزة"}</span>
                  </button>
                  {showCannedDropdown && (
                    <div
                      style={{
                        position: "absolute",
                        bottom: "100%",
                        insetInlineStart: 0,
                        marginBottom: 6,
                        background: "var(--surface)",
                        border: "1px solid var(--border)",
                        borderRadius: 8,
                        boxShadow: "var(--shadow-md)",
                        width: 240,
                        zIndex: 20,
                        padding: 6,
                      }}
                    >
                      {cannedResponses.map((cr, idx) => (
                        <div
                          key={idx}
                          onClick={() => {
                            setReplyText((prev) =>
                              prev ? prev + " " + cr.content : cr.content,
                            );
                            setShowCannedDropdown(false);
                          }}
                          style={{
                            padding: "6px 8px",
                            borderRadius: 6,
                            cursor: "pointer",
                            fontSize: "0.78rem",
                            borderBottom:
                              "1px solid var(--border-subtle, rgba(0,0,0,0.04))",
                          }}
                        >
                          <span
                            style={{ fontWeight: 700, color: "var(--primary)" }}
                          >
                            {cr.short_code}
                          </span>
                          :{" "}
                          <span style={{ color: "var(--text-secondary)" }}>
                            {cr.content.slice(0, 30)}...
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div
                  style={{ marginInlineStart: "auto", display: "flex", gap: 6 }}
                >
                  <button
                    type="button"
                    onClick={() => handleAiRewrite("friendly")}
                    disabled={aiGenerating || !replyText.trim()}
                    style={{
                      fontSize: "0.74rem",
                      padding: "3px 8px",
                      borderRadius: "var(--radius-sm, 6px)",
                      border: "1px solid rgba(2, 105, 130, 0.25)",
                      background: "rgba(2, 105, 130, 0.08)",
                      color: "var(--primary)",
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <Icon name="sparkles" size={12} />
                    <span>
                      {aiGenerating
                        ? t("improving") || "جاري التحسين..."
                        : t("friendlyTone") || "صياغة ودية"}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAiRewrite("formal")}
                    disabled={aiGenerating || !replyText.trim()}
                    style={{
                      fontSize: "0.74rem",
                      padding: "3px 8px",
                      borderRadius: "var(--radius-sm, 6px)",
                      border: "1px solid var(--border)",
                      background: "transparent",
                      color: "var(--text-secondary)",
                      cursor: "pointer",
                    }}
                  >
                    {t("formalTone") || "رسمي"}
                  </button>
                </div>
              </div>

              {/* Input Form */}
              <form
                onSubmit={handleSendMessage}
                style={{ display: "flex", gap: 8 }}
              >
                <textarea
                  rows={2}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={
                    isPrivateNote
                      ? t("writeInternalNotePlaceholder") ||
                        "اكتب ملاحظة للفريق الداخلي فقط..."
                      : t("writeClientReplyPlaceholder") ||
                        "اكتب ردك للعميل هنا..."
                  }
                  style={{
                    flex: 1,
                    resize: "none",
                    borderRadius: 8,
                    border: isPrivateNote
                      ? "1px solid #f59e0b"
                      : "1px solid var(--border)",
                    padding: "8px 12px",
                    fontSize: "0.88rem",
                    background: isPrivateNote ? "#fffbeb" : "var(--surface)",
                  }}
                />
                <button
                  type="submit"
                  disabled={sending || !replyText.trim()}
                  className="btn btn-primary"
                  style={{ padding: "0 18px", alignSelf: "stretch" }}
                >
                  <Icon name="send" size={16} />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--muted)",
            }}
          >
            اختر محادثة من القائمة للبدء
          </div>
        )}
      </div>

      {/* 3. Right Column: CRM & Contextual Booking Card */}
      <div
        style={{
          borderInlineStart: "1px solid var(--border)",
          padding: 16,
          background: "var(--surface-subtle, rgba(0,0,0,0.02))",
          overflowY: "auto",
        }}
      >
        {activeConversation ? (
          <div>
            <div
              style={{
                textAlign: "center",
                paddingBottom: 16,
                borderBottom: "1px solid var(--border)",
              }}
            >
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: "50%",
                  background: "rgba(2, 105, 130, 0.12)",
                  color: "var(--primary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 10px",
                  fontWeight: 800,
                  fontSize: "1.2rem",
                }}
              >
                {(activeConversation.customer_name || "ع")[0]}
              </div>
              <h4
                style={{
                  margin: 0,
                  fontSize: "0.95rem",
                  fontWeight: 800,
                  color: "var(--heading)",
                }}
              >
                {activeConversation.customer_name}
              </h4>
              <p
                style={{
                  margin: "4px 0 0",
                  fontSize: "0.78rem",
                  color: "var(--muted)",
                }}
              >
                {activeConversation.customer_email || "لا يوجد بريد مسجل"}
              </p>
            </div>

            <div
              style={{
                padding: "14px 0",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <h5
                style={{
                  margin: "0 0 10px",
                  fontSize: "0.82rem",
                  fontWeight: 800,
                  color: "var(--heading)",
                }}
              >
                سجل المواعيد في سابق
              </h5>
              <div
                style={{
                  background: "var(--surface)",
                  padding: "10px 12px",
                  borderRadius: 8,
                  border: "1px solid var(--border)",
                  marginBottom: 10,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "0.8rem",
                    marginBottom: 4,
                  }}
                >
                  <span style={{ color: "var(--text-secondary)" }}>
                    إجمالي الحجوزات:
                  </span>
                  <span style={{ fontWeight: 800, color: "var(--primary)" }}>
                    {activeConversation.bookings_count || 1} مواعيد
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "0.8rem",
                  }}
                >
                  <span style={{ color: "var(--text-secondary)" }}>
                    الحالة:
                  </span>
                  <span style={{ fontWeight: 700, color: "#10b981" }}>
                    مؤكد
                  </span>
                </div>
              </div>

              <Link
                to={`/member/workspace/customers`}
                className="btn btn-secondary btn-sm"
                style={{ width: "100%", justifyContent: "center", gap: 6 }}
              >
                <Icon name="user" size={13} />
                <span>
                  {t("viewFullCustomerProfile") || "عرض ملف العميل الكامل"}
                </span>
              </Link>
            </div>

            <div style={{ padding: "14px 0" }}>
              <h5
                style={{
                  margin: "0 0 8px",
                  fontSize: "0.82rem",
                  fontWeight: 800,
                  color: "var(--heading)",
                }}
              >
                {t("channelAndContactData") || "قناة الاتصال والبيانات"}
              </h5>
              <div
                style={{
                  fontSize: "0.78rem",
                  color: "var(--text-secondary)",
                  lineHeight: 1.8,
                }}
              >
                <div>
                  <strong>{t("phone") || "الهاتف"}:</strong>{" "}
                  {activeConversation.customer_phone || "+966500000000"}
                </div>
                <div>
                  <strong>{t("channel") || "القناة"}:</strong>{" "}
                  {activeConversation.channel || "Web Live Chat"}
                </div>
                <div>
                  <strong>{t("identifier") || "المعرف"}:</strong> #
                  {activeConversation.id}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div
            style={{
              textAlign: "center",
              color: "var(--muted)",
              paddingTop: 40,
              fontSize: "0.85rem",
            }}
          >
            لا يوجد عميل محدد
          </div>
        )}
      </div>
    </div>
  );
}
