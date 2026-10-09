import React, { useState, useEffect, useRef, useCallback } from "react";
import client, { endpoints } from "../../../../../../api/client";
import Icon from "../../../../../../components/common/Icon";
import { Link } from "react-router-dom";
import { useLanguage } from "../../../../../../context/LanguageContext";

export default function SaabqChatInboxTab() {
  const { t } = useLanguage();
  const [filter, setFilter] = useState("open");
  const [assigneeType, setAssigneeType] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [conversations, setConversations] = useState([]);
  const [metaCounts, setMetaCounts] = useState({
    all_count: 0,
    mine_count: 0,
    unassigned_count: 0,
  });
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [replyText, setReplyText] = useState("");
  const [isPrivateNote, setIsPrivateNote] = useState(false);
  const [loading, setLoading] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [cannedResponses, setCannedResponses] = useState([]);
  const [showCannedDropdown, setShowCannedDropdown] = useState(false);
  const [showAiDropdown, setShowAiDropdown] = useState(false);
  const [agents, setAgents] = useState([]);
  const [attachmentFile, setAttachmentFile] = useState(null);
  const fileInputRef = useRef(null);

  // New Conversation Modal State
  const [showNewConvModal, setShowNewConvModal] = useState(false);
  const [inboxes, setInboxes] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [newConvInboxId, setNewConvInboxId] = useState("");
  const [newConvContactId, setNewConvContactId] = useState("");
  const [newConvMessage, setNewConvMessage] = useState("");
  const [creatingConv, setCreatingConv] = useState(false);

  // New Label Modal State
  const [newLabelInput, setNewLabelInput] = useState("");
  const [showLabelInput, setShowLabelInput] = useState(false);

  // Fetch Meta Counts
  const fetchMetaCounts = useCallback(() => {
    client
      .get(endpoints.workspaceSaabqChatConversationsMeta, {
        params: { status: filter },
      })
      .then((res) => {
        if (res.data?.data?.meta) {
          setMetaCounts(res.data.data.meta);
        }
      })
      .catch(() => {});
  }, [filter]);

  // Fetch Conversations List
  const fetchConversations = useCallback(() => {
    setLoading(true);
    client
      .get(endpoints.workspaceSaabqChatConversations, {
        params: {
          status: filter === "all" ? "all" : filter,
          assignee_type: assigneeType,
          q: searchQuery || undefined,
        },
      })
      .then((res) => {
        const payload = res.data?.data?.payload || res.data?.data || [];
        const list = Array.isArray(payload) ? payload : [];
        setConversations(list);
        if (list.length > 0) {
          setActiveConversation((prev) => prev || list[0]);
        } else {
          setActiveConversation(null);
        }
      })
      .catch(() => {
        setConversations([]);
        setActiveConversation(null);
      })
      .finally(() => setLoading(false));
  }, [filter, assigneeType, searchQuery]);

  useEffect(() => {
    fetchConversations();
    fetchMetaCounts();
  }, [fetchConversations, fetchMetaCounts]);

  // Load Canned Responses & Agents
  useEffect(() => {
    client
      .get(endpoints.workspaceSaabqChatCannedResponses)
      .then((res) => {
        const list = res.data?.data || [];
        setCannedResponses(Array.isArray(list) ? list : []);
      })
      .catch(() => setCannedResponses([]));

    client
      .get(endpoints.workspaceSaabqChatAgents)
      .then((res) => {
        const list = res.data?.data || [];
        setAgents(Array.isArray(list) ? list : []);
      })
      .catch(() => setAgents([]));
  }, []);

  // Fetch Messages for Active Conversation
  const fetchMessages = useCallback(() => {
    if (!activeConversation?.id) return;
    setMessagesLoading(true);
    client
      .get(endpoints.workspaceSaabqChatMessages(activeConversation.id))
      .then((res) => {
        const payload = res.data?.data?.payload || res.data?.data || [];
        setMessages(Array.isArray(payload) ? payload : []);
      })
      .catch(() => setMessages([]))
      .finally(() => setMessagesLoading(false));
  }, [activeConversation?.id]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Send Message (Supports Public text, Private Notes & Attachments)
  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if ((!replyText.trim() && !attachmentFile) || !activeConversation?.id)
      return;

    setSending(true);
    try {
      const formData = new FormData();
      if (replyText.trim()) {
        formData.append("content", replyText.trim());
      }
      formData.append("private", isPrivateNote ? "1" : "0");
      if (attachmentFile) {
        formData.append("attachments[]", attachmentFile);
      }

      await client.post(
        endpoints.workspaceSaabqChatMessages(activeConversation.id),
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );

      setReplyText("");
      setAttachmentFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      fetchMessages();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  // Toggle Conversation Status (open, resolved, pending, snoozed)
  const handleToggleStatus = async (newStatus) => {
    if (!activeConversation?.id) return;
    try {
      await client.post(
        endpoints.workspaceSaabqChatToggleStatus(activeConversation.id),
        { status: newStatus },
      );
      setActiveConversation((prev) => ({ ...prev, status: newStatus }));
      fetchConversations();
    } catch (err) {
      alert(
        err.response?.data?.message || "Failed to update conversation status",
      );
    }
  };

  // Toggle Priority
  const handleTogglePriority = async (newPriority) => {
    if (!activeConversation?.id) return;
    try {
      await client.post(
        endpoints.workspaceSaabqChatTogglePriority(activeConversation.id),
        { priority: newPriority },
      );
      setActiveConversation((prev) => ({ ...prev, priority: newPriority }));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update priority");
    }
  };

  // Assign Conversation
  const handleAssignAgent = async (agentId) => {
    if (!activeConversation?.id) return;
    try {
      await client.post(
        endpoints.workspaceSaabqChatAssign(activeConversation.id),
        { assignee_id: agentId ? Number(agentId) : null },
      );
      fetchConversations();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to assign conversation");
    }
  };

  // Add Label
  const handleAddLabel = async () => {
    if (!newLabelInput.trim() || !activeConversation?.id) return;
    const currentLabels = activeConversation.labels || [];
    const updated = [...currentLabels, newLabelInput.trim()];
    try {
      await client.post(
        endpoints.workspaceSaabqChatConversationLabels(activeConversation.id),
        { labels: updated },
      );
      setActiveConversation((prev) => ({ ...prev, labels: updated }));
      setNewLabelInput("");
      setShowLabelInput(false);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update labels");
    }
  };

  // Delete Message
  const handleDeleteMessage = async (msgId) => {
    if (
      !activeConversation?.id ||
      !confirm("Are you sure you want to delete this message?")
    )
      return;
    try {
      await client.delete(
        endpoints.workspaceSaabqChatMessageDelete(activeConversation.id, msgId),
      );
      setMessages((prev) => prev.filter((m) => m.id !== msgId));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete message");
    }
  };

  // Retry Failed Message
  const handleRetryMessage = async (msgId) => {
    if (!activeConversation?.id) return;
    try {
      await client.post(
        endpoints.workspaceSaabqChatMessageRetry(activeConversation.id, msgId),
      );
      fetchMessages();
    } catch (err) {
      alert(err.response?.data?.message || "Retry failed");
    }
  };

  // Captain AI Tasks
  const handleCaptainAiTask = async (taskType) => {
    setShowAiDropdown(false);
    setAiGenerating(true);
    try {
      const res = await client.post(endpoints.workspaceSaabqChatCaptainAiTask, {
        task: taskType,
        message: replyText || undefined,
        conversation_id: activeConversation?.id || undefined,
      });
      const generated =
        res.data?.data?.result ||
        res.data?.data?.content ||
        res.data?.data?.output;
      if (generated) {
        setReplyText(generated);
      }
    } catch (err) {
      alert(err.response?.data?.message || "AI task failed");
    } finally {
      setAiGenerating(false);
    }
  };

  // Open New Conversation Modal
  const openNewConversationModal = async () => {
    setShowNewConvModal(true);
    try {
      const [inboxesRes, contactsRes] = await Promise.all([
        client.get(endpoints.workspaceSaabqChatInboxes),
        client.get(endpoints.workspaceSaabqChatContacts),
      ]);
      const ibs = inboxesRes.data?.data?.payload || inboxesRes.data?.data || [];
      const cts =
        contactsRes.data?.data?.payload || contactsRes.data?.data || [];
      setInboxes(Array.isArray(ibs) ? ibs : []);
      setContacts(Array.isArray(cts) ? cts : []);
      if (ibs.length > 0) setNewConvInboxId(ibs[0].id);
      if (cts.length > 0) setNewConvContactId(cts[0].id);
    } catch {
      // ignore
    }
  };

  // Create New Conversation
  const handleCreateConversation = async (e) => {
    e.preventDefault();
    if (!newConvInboxId || !newConvContactId) return;
    setCreatingConv(true);
    try {
      const res = await client.post(endpoints.workspaceSaabqChatConversations, {
        inbox_id: Number(newConvInboxId),
        contact_id: Number(newConvContactId),
        message: newConvMessage.trim()
          ? { content: newConvMessage.trim() }
          : undefined,
      });
      setShowNewConvModal(false);
      setNewConvMessage("");
      fetchConversations();
      if (res.data?.data?.id) {
        setActiveConversation(res.data.data);
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create conversation");
    } finally {
      setCreatingConv(false);
    }
  };

  return (
    <div
      className="saabq-chat-inbox-grid"
      style={{
        display: "grid",
        gridTemplateColumns: "330px 1fr 300px",
        gap: 16,
        background: "var(--surface)",
        borderRadius: "var(--radius-lg, 16px)",
        border: "1px solid var(--border)",
        minHeight: 740,
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
        {/* Header with Search & New Conversation button */}
        <div
          style={{
            padding: "14px 16px",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <h3
              style={{
                margin: 0,
                fontSize: "1.05rem",
                fontWeight: 800,
                color: "var(--heading)",
              }}
            >
              {t("saabqChatNavInbox") || "المحادثات الموحدة"}
            </h3>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={openNewConversationModal}
              style={{ gap: 6, padding: "5px 10px", fontSize: "0.8rem" }}
            >
              <Icon name="plus" size={13} />
              <span>{t("newConversation") || "محادثة جديدة"}</span>
            </button>
          </div>

          <div style={{ position: "relative", marginBottom: 10 }}>
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
              placeholder={t("searchConversations") || "بحث في المحادثات..."}
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

          {/* Status Tabs */}
          <div
            style={{
              display: "flex",
              gap: 4,
              marginBottom: 8,
              overflowX: "auto",
            }}
          >
            {[
              { id: "open", label: t("open") || "مفتوحة" },
              { id: "resolved", label: t("resolved") || "مغلقة" },
              { id: "pending", label: t("pending") || "معلقة" },
              { id: "snoozed", label: t("snoozed") || "مؤجلة" },
              { id: "all", label: t("all") || "الكل" },
            ].map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => setFilter(st.id)}
                style={{
                  flex: 1,
                  padding: "5px 6px",
                  fontSize: "0.74rem",
                  borderRadius: 6,
                  border: "none",
                  cursor: "pointer",
                  fontWeight: filter === st.id ? 700 : 500,
                  background:
                    filter === st.id ? "var(--primary)" : "transparent",
                  color: filter === st.id ? "#fff" : "var(--text-secondary)",
                  transition: "all 0.15s ease",
                  whiteSpace: "nowrap",
                }}
              >
                {st.label}
              </button>
            ))}
          </div>

          {/* Assignee Filter Tabs */}
          <div style={{ display: "flex", gap: 6, fontSize: "0.74rem" }}>
            {[
              { id: "all", label: `الكل (${metaCounts.all_count || 0})` },
              { id: "me", label: `محادثاتي (${metaCounts.mine_count || 0})` },
              {
                id: "unassigned",
                label: `غير معينة (${metaCounts.unassigned_count || 0})`,
              },
            ].map((as) => (
              <button
                key={as.id}
                type="button"
                onClick={() => setAssigneeType(as.id)}
                style={{
                  padding: "3px 8px",
                  borderRadius: 12,
                  border:
                    assigneeType === as.id
                      ? "1px solid var(--primary)"
                      : "1px solid var(--border)",
                  background:
                    assigneeType === as.id
                      ? "rgba(2, 105, 130, 0.08)"
                      : "var(--surface)",
                  color:
                    assigneeType === as.id ? "var(--primary)" : "var(--muted)",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {as.label}
              </button>
            ))}
          </div>
        </div>

        {/* Conversations Stream */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {loading ? (
            <div
              style={{
                padding: 40,
                textAlign: "center",
                color: "var(--muted)",
                fontSize: "0.86rem",
              }}
            >
              {t("loading") || "جاري التحميل..."}
            </div>
          ) : conversations.length === 0 ? (
            <div
              style={{
                padding: 40,
                textAlign: "center",
                color: "var(--muted)",
                fontSize: "0.86rem",
              }}
            >
              {t("noConversationsFound") || "لا توجد محادثات مطابقة"}
            </div>
          ) : (
            conversations.map((c) => {
              const isSelected = activeConversation?.id === c.id;
              const customerName =
                c.meta?.sender?.name || c.contact?.name || `عميل #${c.id}`;
              const lastMessage =
                c.messages?.[0]?.content ||
                c.last_non_activity_message?.content ||
                "محادثة جديدة";
              const priority = c.priority || "none";

              return (
                <div
                  key={c.id}
                  onClick={() => setActiveConversation(c)}
                  style={{
                    padding: "12px 16px",
                    borderBottom: "1px solid var(--border)",
                    cursor: "pointer",
                    background: isSelected ? "var(--surface)" : "transparent",
                    borderInlineStart: isSelected
                      ? "3px solid var(--primary)"
                      : "3px solid transparent",
                    transition: "all 0.15s ease",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
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
                      {customerName}
                    </span>
                    <span
                      style={{
                        fontSize: "0.68rem",
                        padding: "2px 6px",
                        borderRadius: 4,
                        fontWeight: 700,
                        textTransform: "uppercase",
                        background:
                          priority === "urgent"
                            ? "#fee2e2"
                            : priority === "high"
                              ? "#ffedd5"
                              : "var(--surface-bg)",
                        color:
                          priority === "urgent"
                            ? "#dc2626"
                            : priority === "high"
                              ? "#ea580c"
                              : "var(--muted)",
                      }}
                    >
                      {priority !== "none" ? priority : `#${c.id}`}
                    </span>
                  </div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "0.8rem",
                      color: "var(--text-secondary)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {lastMessage}
                  </p>
                  <div
                    style={{
                      display: "flex",
                      gap: 6,
                      marginTop: 6,
                      alignItems: "center",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.7rem",
                        padding: "1px 6px",
                        borderRadius: 8,
                        background:
                          c.status === "open"
                            ? "rgba(16, 185, 129, 0.15)"
                            : "rgba(107, 114, 128, 0.15)",
                        color: c.status === "open" ? "#059669" : "#4b5563",
                        fontWeight: 600,
                      }}
                    >
                      {c.status}
                    </span>
                    {c.inbox?.name && (
                      <span
                        style={{ fontSize: "0.7rem", color: "var(--muted)" }}
                      >
                        • {c.inbox.name}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 2. Middle Column: Active Chat Conversation */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          background: "var(--surface)",
        }}
      >
        {activeConversation ? (
          <>
            {/* Conversation Header & Action Controls */}
            <div
              style={{
                padding: "12px 18px",
                borderBottom: "1px solid var(--border)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 10,
              }}
            >
              <div>
                <h4
                  style={{
                    margin: 0,
                    fontSize: "0.95rem",
                    fontWeight: 800,
                    color: "var(--heading)",
                  }}
                >
                  {activeConversation.meta?.sender?.name ||
                    activeConversation.contact?.name ||
                    `محادثة #${activeConversation.id}`}
                </h4>
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    alignItems: "center",
                    marginTop: 3,
                  }}
                >
                  <span style={{ fontSize: "0.74rem", color: "var(--muted)" }}>
                    المعرف: #{activeConversation.id}
                  </span>
                  <span style={{ fontSize: "0.74rem", color: "var(--muted)" }}>
                    •
                  </span>
                  <span
                    style={{
                      fontSize: "0.74rem",
                      color: "var(--primary)",
                      fontWeight: 600,
                    }}
                  >
                    {activeConversation.inbox?.name || "قناة المحادثة"}
                  </span>
                </div>
              </div>

              {/* Status / Priority / Assignee Tooling */}
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {/* Priority Selector */}
                <select
                  value={activeConversation.priority || "none"}
                  onChange={(e) => handleTogglePriority(e.target.value)}
                  style={{
                    padding: "4px 8px",
                    borderRadius: 6,
                    border: "1px solid var(--border)",
                    fontSize: "0.76rem",
                    background: "var(--surface-bg)",
                    color: "var(--heading)",
                    cursor: "pointer",
                  }}
                >
                  <option value="none">الأولوية: عادية</option>
                  <option value="low">منخفضة</option>
                  <option value="medium">متوسطة</option>
                  <option value="high">عالية</option>
                  <option value="urgent">عاجلة</option>
                </select>

                {/* Status Toggles */}
                {activeConversation.status === "open" ? (
                  <button
                    type="button"
                    onClick={() => handleToggleStatus("resolved")}
                    className="btn btn-secondary btn-sm"
                    style={{
                      gap: 4,
                      padding: "5px 10px",
                      fontSize: "0.78rem",
                      color: "#059669",
                    }}
                  >
                    <Icon name="check-circle" size={13} />
                    <span>إغلاق المحادثة</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleToggleStatus("open")}
                    className="btn btn-primary btn-sm"
                    style={{ gap: 4, padding: "5px 10px", fontSize: "0.78rem" }}
                  >
                    <Icon name="refresh-cw" size={13} />
                    <span>إعادة فتح</span>
                  </button>
                )}

                {/* Assignee Dropdown */}
                <select
                  value={activeConversation.meta?.assignee?.id || ""}
                  onChange={(e) => handleAssignAgent(e.target.value)}
                  style={{
                    padding: "4px 8px",
                    borderRadius: 6,
                    border: "1px solid var(--border)",
                    fontSize: "0.76rem",
                    background: "var(--surface-bg)",
                    color: "var(--heading)",
                    cursor: "pointer",
                  }}
                >
                  <option value="">غير معين</option>
                  {agents.map((ag) => (
                    <option key={ag.id} value={ag.id}>
                      {ag.name || ag.email}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Labels Tags Strip */}
            <div
              style={{
                padding: "6px 18px",
                background: "var(--surface-subtle, rgba(0,0,0,0.015))",
                borderBottom: "1px solid var(--border)",
                display: "flex",
                alignItems: "center",
                gap: 6,
                flexWrap: "wrap",
              }}
            >
              <span
                style={{
                  fontSize: "0.72rem",
                  color: "var(--muted)",
                  fontWeight: 600,
                }}
              >
                الوسوم:
              </span>
              {(activeConversation.labels || []).map((lb, idx) => (
                <span
                  key={idx}
                  style={{
                    padding: "2px 8px",
                    borderRadius: 10,
                    background: "rgba(2, 105, 130, 0.1)",
                    color: "var(--primary)",
                    fontSize: "0.72rem",
                    fontWeight: 600,
                  }}
                >
                  #{lb}
                </span>
              ))}

              {showLabelInput ? (
                <div style={{ display: "inline-flex", gap: 4 }}>
                  <input
                    type="text"
                    value={newLabelInput}
                    onChange={(e) => setNewLabelInput(e.target.value)}
                    placeholder="وسم جديد..."
                    style={{
                      padding: "2px 6px",
                      borderRadius: 4,
                      border: "1px solid var(--border)",
                      fontSize: "0.72rem",
                      width: 90,
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddLabel();
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddLabel}
                    className="btn btn-primary btn-sm"
                    style={{ padding: "1px 6px", fontSize: "0.68rem" }}
                  >
                    حفظ
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowLabelInput(false)}
                    style={{
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      color: "var(--muted)",
                    }}
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowLabelInput(true)}
                  style={{
                    background: "transparent",
                    border: "1px dashed var(--border)",
                    borderRadius: 10,
                    padding: "1px 8px",
                    fontSize: "0.72rem",
                    color: "var(--muted)",
                    cursor: "pointer",
                  }}
                >
                  + إضافة وسم
                </button>
              )}
            </div>

            {/* Messages Stream */}
            <div
              style={{
                flex: 1,
                padding: "16px 20px",
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              {messagesLoading ? (
                <div
                  style={{
                    padding: 40,
                    textAlign: "center",
                    color: "var(--muted)",
                    fontSize: "0.86rem",
                  }}
                >
                  جاري تحميل الرسائل...
                </div>
              ) : messages.length === 0 ? (
                <div
                  style={{
                    padding: 40,
                    textAlign: "center",
                    color: "var(--muted)",
                    fontSize: "0.86rem",
                  }}
                >
                  لا توجد رسائل سابقة في هذه المحادثة
                </div>
              ) : (
                messages.map((m) => {
                  const isPrivate = Boolean(m.private);
                  const isAgent =
                    m.message_type === 1 || m.sender_type === "User";
                  const senderName =
                    m.sender?.name || (isAgent ? "فريق العمل" : "العميل");

                  return (
                    <div
                      key={m.id}
                      style={{
                        alignSelf: isPrivate
                          ? "center"
                          : isAgent
                            ? "flex-end"
                            : "flex-start",
                        maxWidth: isPrivate ? "90%" : "75%",
                        width: isPrivate ? "100%" : "auto",
                        background: isPrivate
                          ? "rgba(245, 158, 11, 0.1)"
                          : isAgent
                            ? "var(--primary)"
                            : "var(--surface-bg)",
                        color: isPrivate
                          ? "#92400e"
                          : isAgent
                            ? "#ffffff"
                            : "var(--heading)",
                        borderRadius: 12,
                        border: isPrivate
                          ? "1px solid rgba(245, 158, 11, 0.3)"
                          : "1px solid var(--border)",
                        padding: "10px 14px",
                        boxShadow: "var(--shadow-sm)",
                        position: "relative",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: 4,
                          fontSize: "0.7rem",
                          opacity: 0.85,
                          gap: 12,
                        }}
                      >
                        <span style={{ fontWeight: 700 }}>
                          {isPrivate ? "🔒 ملاحظة خاصة داخلية" : senderName}
                        </span>
                        <div
                          style={{
                            display: "flex",
                            gap: 6,
                            alignItems: "center",
                          }}
                        >
                          <span>
                            {new Date(
                              m.created_at * 1000 || m.created_at,
                            ).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          <button
                            type="button"
                            title="حذف الرسالة"
                            onClick={() => handleDeleteMessage(m.id)}
                            style={{
                              background: "transparent",
                              border: "none",
                              cursor: "pointer",
                              color: "inherit",
                              padding: 0,
                              opacity: 0.6,
                            }}
                          >
                            <Icon name="trash-2" size={11} />
                          </button>
                          {m.status === "failed" && (
                            <button
                              type="button"
                              title="إعادة المحاولة"
                              onClick={() => handleRetryMessage(m.id)}
                              style={{
                                background: "transparent",
                                border: "none",
                                cursor: "pointer",
                                color: "#ef4444",
                                padding: 0,
                              }}
                            >
                              <Icon name="refresh-cw" size={11} />
                            </button>
                          )}
                        </div>
                      </div>

                      <div
                        style={{
                          fontSize: "0.88rem",
                          lineHeight: 1.6,
                          whiteSpace: "pre-wrap",
                        }}
                      >
                        {m.content}
                      </div>

                      {/* Attachments if any */}
                      {Array.isArray(m.attachments) &&
                        m.attachments.length > 0 && (
                          <div
                            style={{
                              marginTop: 8,
                              display: "flex",
                              gap: 6,
                              flexWrap: "wrap",
                            }}
                          >
                            {m.attachments.map((att, attIdx) => (
                              <a
                                key={attIdx}
                                href={att.data_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 4,
                                  padding: "4px 8px",
                                  borderRadius: 6,
                                  background: "rgba(0,0,0,0.06)",
                                  color: "inherit",
                                  fontSize: "0.75rem",
                                  textDecoration: "none",
                                }}
                              >
                                <Icon name="paperclip" size={12} />
                                <span>مرفق</span>
                              </a>
                            ))}
                          </div>
                        )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Message Composer */}
            <div
              style={{
                padding: "12px 18px",
                borderTop: "1px solid var(--border)",
                background: "var(--surface)",
              }}
            >
              {/* Composer Toolbar */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 8,
                }}
              >
                {/* Mode toggle (Public reply vs Private note) */}
                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    type="button"
                    onClick={() => setIsPrivateNote(false)}
                    style={{
                      padding: "4px 10px",
                      borderRadius: 6,
                      fontSize: "0.76rem",
                      fontWeight: !isPrivateNote ? 700 : 500,
                      border: !isPrivateNote
                        ? "1px solid var(--primary)"
                        : "1px solid var(--border)",
                      background: !isPrivateNote
                        ? "rgba(2, 105, 130, 0.08)"
                        : "transparent",
                      color: !isPrivateNote ? "var(--primary)" : "var(--muted)",
                      cursor: "pointer",
                    }}
                  >
                    رد للعميل
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPrivateNote(true)}
                    style={{
                      padding: "4px 10px",
                      borderRadius: 6,
                      fontSize: "0.76rem",
                      fontWeight: isPrivateNote ? 700 : 500,
                      border: isPrivateNote
                        ? "1px solid #d97706"
                        : "1px solid var(--border)",
                      background: isPrivateNote
                        ? "rgba(245, 158, 11, 0.1)"
                        : "transparent",
                      color: isPrivateNote ? "#d97706" : "var(--muted)",
                      cursor: "pointer",
                    }}
                  >
                    🔒 ملاحظة خاصة
                  </button>
                </div>

                {/* Helper actions: Captain AI, Canned Responses, Attachments */}
                <div
                  style={{
                    display: "flex",
                    gap: 6,
                    alignItems: "center",
                    position: "relative",
                  }}
                >
                  {/* Captain AI Assistant */}
                  <button
                    type="button"
                    disabled={aiGenerating}
                    onClick={() => setShowAiDropdown((prev) => !prev)}
                    className="btn btn-secondary btn-sm"
                    style={{ gap: 4, padding: "4px 8px", fontSize: "0.76rem" }}
                  >
                    <Icon name="sparkles" size={12} />
                    <span>
                      {aiGenerating ? "الذكاء الاصطناعي يفكر..." : "كابتن AI"}
                    </span>
                  </button>

                  {/* AI Dropdown Menu */}
                  {showAiDropdown && (
                    <div
                      style={{
                        position: "absolute",
                        bottom: "100%",
                        insetInlineEnd: 80,
                        background: "var(--surface)",
                        border: "1px solid var(--border)",
                        borderRadius: 8,
                        boxShadow: "var(--shadow-lg)",
                        padding: 6,
                        zIndex: 50,
                        width: 190,
                        display: "flex",
                        flexDirection: "column",
                        gap: 4,
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => handleCaptainAiTask("reply_suggestion")}
                        className="dropdown-item"
                        style={{
                          padding: "6px 10px",
                          fontSize: "0.78rem",
                          textAlign: "start",
                          border: "none",
                          background: "transparent",
                          cursor: "pointer",
                        }}
                      >
                        💡 اقتراح رد ذكي
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCaptainAiTask("summarize")}
                        className="dropdown-item"
                        style={{
                          padding: "6px 10px",
                          fontSize: "0.78rem",
                          textAlign: "start",
                          border: "none",
                          background: "transparent",
                          cursor: "pointer",
                        }}
                      >
                        📝 تلخيص المحادثة
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCaptainAiTask("rephrase")}
                        className="dropdown-item"
                        style={{
                          padding: "6px 10px",
                          fontSize: "0.78rem",
                          textAlign: "start",
                          border: "none",
                          background: "transparent",
                          cursor: "pointer",
                        }}
                      >
                        ✨ إعادة صياغة النص
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCaptainAiTask("make_friendly")}
                        className="dropdown-item"
                        style={{
                          padding: "6px 10px",
                          fontSize: "0.78rem",
                          textAlign: "start",
                          border: "none",
                          background: "transparent",
                          cursor: "pointer",
                        }}
                      >
                        😊 جعله ودوداً
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          handleCaptainAiTask("fix_spelling_grammar")
                        }
                        className="dropdown-item"
                        style={{
                          padding: "6px 10px",
                          fontSize: "0.78rem",
                          textAlign: "start",
                          border: "none",
                          background: "transparent",
                          cursor: "pointer",
                        }}
                      >
                        🔍 تصحيح الإملاء والقواعد
                      </button>
                    </div>
                  )}

                  {/* Canned Responses Shortcut */}
                  <button
                    type="button"
                    onClick={() => setShowCannedDropdown((prev) => !prev)}
                    className="btn btn-secondary btn-sm"
                    style={{ gap: 4, padding: "4px 8px", fontSize: "0.76rem" }}
                  >
                    <Icon name="message-circle" size={12} />
                    <span>رد جاهز</span>
                  </button>

                  {/* Canned dropdown */}
                  {showCannedDropdown && (
                    <div
                      style={{
                        position: "absolute",
                        bottom: "100%",
                        insetInlineEnd: 0,
                        background: "var(--surface)",
                        border: "1px solid var(--border)",
                        borderRadius: 8,
                        boxShadow: "var(--shadow-lg)",
                        padding: 6,
                        zIndex: 50,
                        width: 240,
                        maxHeight: 200,
                        overflowY: "auto",
                      }}
                    >
                      {cannedResponses.length === 0 ? (
                        <div
                          style={{
                            padding: 10,
                            fontSize: "0.75rem",
                            color: "var(--muted)",
                            textAlign: "center",
                          }}
                        >
                          لا توجد ردود جاهزة مسجلة
                        </div>
                      ) : (
                        cannedResponses.map((cr) => (
                          <div
                            key={cr.id}
                            onClick={() => {
                              setReplyText((prev) =>
                                prev ? prev + " " + cr.content : cr.content,
                              );
                              setShowCannedDropdown(false);
                            }}
                            style={{
                              padding: "6px 8px",
                              fontSize: "0.76rem",
                              borderRadius: 4,
                              cursor: "pointer",
                              borderBottom: "1px solid var(--border)",
                            }}
                          >
                            <span
                              style={{
                                fontWeight: 700,
                                color: "var(--primary)",
                              }}
                            >
                              !{cr.short_code}
                            </span>
                            <div
                              style={{
                                color: "var(--text-secondary)",
                                fontSize: "0.72rem",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {cr.content}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* Attachment Button */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="btn btn-secondary btn-sm"
                    style={{ padding: "4px 8px" }}
                    title="إرفاق ملف"
                  >
                    <Icon name="paperclip" size={13} />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    style={{ display: "none" }}
                    onChange={(e) =>
                      setAttachmentFile(e.target.files?.[0] || null)
                    }
                  />
                </div>
              </div>

              {/* Attachment Preview Chip */}
              {attachmentFile && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "4px 10px",
                    borderRadius: 6,
                    background: "rgba(2, 105, 130, 0.08)",
                    color: "var(--primary)",
                    fontSize: "0.76rem",
                    marginBottom: 8,
                    width: "fit-content",
                  }}
                >
                  <Icon name="paperclip" size={12} />
                  <span>{attachmentFile.name}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setAttachmentFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    style={{
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      color: "inherit",
                      padding: 0,
                    }}
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Composer Input Form */}
              <form
                onSubmit={handleSendMessage}
                style={{ display: "flex", gap: 10 }}
              >
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={
                    isPrivateNote
                      ? "اكتب ملاحظة خاصة للفريق (لن يراها العميل)..."
                      : "اكتب ردك للعميل هنا..."
                  }
                  rows={2}
                  style={{
                    flex: 1,
                    padding: "10px 14px",
                    borderRadius: 8,
                    border: isPrivateNote
                      ? "1px solid #d97706"
                      : "1px solid var(--border)",
                    background: isPrivateNote
                      ? "rgba(245, 158, 11, 0.03)"
                      : "var(--surface)",
                    fontSize: "0.88rem",
                    resize: "none",
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                />
                <button
                  type="submit"
                  disabled={sending || (!replyText.trim() && !attachmentFile)}
                  className="btn btn-primary"
                  style={{
                    padding: "0 18px",
                    borderRadius: 8,
                    background: isPrivateNote ? "#d97706" : "var(--primary)",
                  }}
                >
                  {sending ? (
                    <span className="spinner-sm" />
                  ) : (
                    <Icon name="send" size={16} />
                  )}
                </button>
              </form>
            </div>
          </>
        ) : (
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--muted)",
              gap: 12,
            }}
          >
            <Icon name="message-square" size={36} />
            <span>اختر محادثة من القائمة للبدء أو أنشئ محادثة جديدة</span>
          </div>
        )}
      </div>

      {/* 3. Right Column: CRM Context & Customer Summary */}
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
                {
                  (activeConversation.meta?.sender?.name ||
                    activeConversation.contact?.name ||
                    "ع")[0]
                }
              </div>
              <h4
                style={{
                  margin: 0,
                  fontSize: "0.95rem",
                  fontWeight: 800,
                  color: "var(--heading)",
                }}
              >
                {activeConversation.meta?.sender?.name ||
                  activeConversation.contact?.name ||
                  "العميل"}
              </h4>
              <p
                style={{
                  margin: "4px 0 0",
                  fontSize: "0.78rem",
                  color: "var(--muted)",
                }}
              >
                {activeConversation.meta?.sender?.email ||
                  activeConversation.contact?.email ||
                  "لا يوجد بريد مسجل"}
              </p>
            </div>

            {/* Custom Attributes Viewer */}
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
                السمات والبيانات المخصصة
              </h5>
              {activeConversation.custom_attributes &&
              Object.keys(activeConversation.custom_attributes).length > 0 ? (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                    fontSize: "0.78rem",
                  }}
                >
                  {Object.entries(activeConversation.custom_attributes).map(
                    ([k, v]) => (
                      <div
                        key={k}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <span style={{ color: "var(--muted)" }}>{k}:</span>
                        <span style={{ fontWeight: 600 }}>{String(v)}</span>
                      </div>
                    ),
                  )}
                </div>
              ) : (
                <p
                  style={{
                    margin: 0,
                    fontSize: "0.76rem",
                    color: "var(--muted)",
                  }}
                >
                  لا توجد سمات إضافية مسجلة
                </p>
              )}
            </div>

            {/* Link to Full CRM Details */}
            <div style={{ padding: "14px 0" }}>
              <Link
                to="/member/workspace/applications/saabq-chat/contacts"
                className="btn btn-secondary btn-sm"
                style={{ width: "100%", justifyContent: "center", gap: 6 }}
              >
                <Icon name="users" size={13} />
                <span>إدارة جهات الاتصال في CRM</span>
              </Link>
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

      {/* New Conversation Modal */}
      {showNewConvModal && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <h4 className="modal-title">بدء محادثة جديدة</h4>
              <button
                type="button"
                className="modal-close"
                onClick={() => setShowNewConvModal(false)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateConversation} className="modal-body">
              <div className="form-group" style={{ marginBottom: 14 }}>
                <label
                  style={{
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    marginBottom: 4,
                    display: "block",
                  }}
                >
                  قناة الاستقبال (Inbox)
                </label>
                <select
                  value={newConvInboxId}
                  onChange={(e) => setNewConvInboxId(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: "1px solid var(--border)",
                  }}
                >
                  {inboxes.map((ib) => (
                    <option key={ib.id} value={ib.id}>
                      {ib.name} ({ib.channel_type})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 14 }}>
                <label
                  style={{
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    marginBottom: 4,
                    display: "block",
                  }}
                >
                  العميل المستهدف (Contact)
                </label>
                <select
                  value={newConvContactId}
                  onChange={(e) => setNewConvContactId(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: "1px solid var(--border)",
                  }}
                >
                  {contacts.map((ct) => (
                    <option key={ct.id} value={ct.id}>
                      {ct.name} {ct.email ? `(${ct.email})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 18 }}>
                <label
                  style={{
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    marginBottom: 4,
                    display: "block",
                  }}
                >
                  الرسالة الافتتاحية (اختياري)
                </label>
                <textarea
                  value={newConvMessage}
                  onChange={(e) => setNewConvMessage(e.target.value)}
                  placeholder="مرحباً، نود التواصل معك بشأن..."
                  rows={3}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: "1px solid var(--border)",
                  }}
                />
              </div>

              <div
                style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}
              >
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowNewConvModal(false)}
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={creatingConv}
                  className="btn btn-primary"
                >
                  {creatingConv ? "جاري الإنشاء..." : "بدء المحادثة"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
