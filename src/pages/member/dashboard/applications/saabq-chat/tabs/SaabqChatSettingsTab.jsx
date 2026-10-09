import React, { useState, useEffect } from "react";
import client, { endpoints } from "../../../../../../api/client";
import Icon from "../../../../../../components/common/Icon";

export default function SaabqChatSettingsTab() {
  const [activeSubTab, setActiveSubTab] = useState("overview"); // overview, labels_attrs, webhooks, bots_apps, campaigns, audit
  const [ssoLoading, setSsoLoading] = useState(false);

  // Labels & Custom Attributes State
  const [labels, setLabels] = useState([]);
  const [customAttrs, setCustomAttrs] = useState([]);
  const [showLabelModal, setShowLabelModal] = useState(false);
  const [labelForm, setLabelForm] = useState({ title: "", color: "#FF5733" });

  const [showAttrModal, setShowAttrModal] = useState(false);
  const [attrForm, setAttrForm] = useState({
    attribute_display_name: "",
    attribute_key: "",
    attribute_display_type: "text",
    attribute_model: 0,
  });

  // Webhooks State
  const [webhooks, setWebhooks] = useState([]);
  const [showWebhookModal, setShowWebhookModal] = useState(false);
  const [webhookForm, setWebhookForm] = useState({
    url: "",
    subscriptions: ["conversation_created", "message_created"],
  });

  // Agent Bots & Dashboard Apps
  const [agentBots, setAgentBots] = useState([]);
  const [dashboardApps, setDashboardApps] = useState([]);
  const [showBotModal, setShowBotModal] = useState(false);
  const [botForm, setBotForm] = useState({
    name: "",
    outgoing_url: "",
    description: "",
  });

  const [showAppModal, setShowAppModal] = useState(false);
  const [appForm, setAppForm] = useState({
    title: "",
    url: "https://admin.cal.saabq.com/embed/chat-dashboard-app",
  });

  // Campaigns State
  const [campaigns, setCampaigns] = useState([]);
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [campaignForm, setCampaignForm] = useState({
    title: "",
    message: "",
    inbox_id: 1,
    enabled: true,
  });

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState([]);

  const [submitting, setSubmitting] = useState(false);

  // Lazy-load sub-tab data
  useEffect(() => {
    if (activeSubTab === "labels_attrs") {
      Promise.all([
        client
          .get(endpoints.workspaceSaabqChatLabels)
          .catch(() => ({ data: { data: [] } })),
        client
          .get(endpoints.workspaceSaabqChatCustomAttributes)
          .catch(() => ({ data: { data: [] } })),
      ]).then(([lRes, aRes]) => {
        setLabels(lRes.data?.data?.payload || lRes.data?.data || []);
        setCustomAttrs(aRes.data?.data?.payload || aRes.data?.data || []);
      });
    } else if (activeSubTab === "webhooks") {
      client
        .get(endpoints.workspaceSaabqChatWebhooks)
        .then((res) =>
          setWebhooks(res.data?.data?.payload || res.data?.data || []),
        )
        .catch(() => setWebhooks([]));
    } else if (activeSubTab === "bots_apps") {
      Promise.all([
        client
          .get(endpoints.workspaceSaabqChatAgentBots)
          .catch(() => ({ data: { data: [] } })),
        client
          .get(endpoints.workspaceSaabqChatDashboardApps)
          .catch(() => ({ data: { data: [] } })),
      ]).then(([bRes, dRes]) => {
        setAgentBots(bRes.data?.data?.payload || bRes.data?.data || []);
        setDashboardApps(dRes.data?.data?.payload || dRes.data?.data || []);
      });
    } else if (activeSubTab === "campaigns") {
      client
        .get(endpoints.workspaceSaabqChatCampaigns)
        .then((res) =>
          setCampaigns(res.data?.data?.payload || res.data?.data || []),
        )
        .catch(() => setCampaigns([]));
    } else if (activeSubTab === "audit") {
      client
        .get(endpoints.workspaceSaabqChatAuditLogs)
        .then((res) =>
          setAuditLogs(res.data?.data?.audit_logs || res.data?.data || []),
        )
        .catch(() => setAuditLogs([]));
    }
  }, [activeSubTab]);

  // SSO Link
  const handleOpenSso = async () => {
    setSsoLoading(true);
    try {
      const res = await client.get(endpoints.workspaceSaabqChatSsoUrl);
      const url = res.data?.data?.url || res.data?.data?.sso_url;
      if (url) {
        window.open(url, "_blank", "noopener,noreferrer");
      } else {
        alert("لم يتم العثور على رابط SSO لحسابك.");
      }
    } catch (err) {
      alert(err.response?.data?.message || "تعذر إنشاء رابط الدخول الموحد.");
    } finally {
      setSsoLoading(false);
    }
  };

  // Create Label
  const handleCreateLabel = async (e) => {
    e.preventDefault();
    if (!labelForm.title.trim()) return;
    setSubmitting(true);
    try {
      await client.post(endpoints.workspaceSaabqChatLabels, labelForm);
      setShowLabelModal(false);
      setLabelForm({ title: "", color: "#FF5733" });
      const res = await client.get(endpoints.workspaceSaabqChatLabels);
      setLabels(res.data?.data?.payload || res.data?.data || []);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create label");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Label
  const handleDeleteLabel = async (id) => {
    if (!confirm("هل أنت متأكد من حذف الوسم؟")) return;
    try {
      await client.delete(endpoints.workspaceSaabqChatLabelDetail(id));
      setLabels((prev) => prev.filter((l) => l.id !== id));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete label");
    }
  };

  // Create Custom Attribute
  const handleCreateAttr = async (e) => {
    e.preventDefault();
    if (!attrForm.attribute_key.trim()) return;
    setSubmitting(true);
    try {
      await client.post(endpoints.workspaceSaabqChatCustomAttributes, attrForm);
      setShowAttrModal(false);
      setAttrForm({
        attribute_display_name: "",
        attribute_key: "",
        attribute_display_type: "text",
        attribute_model: 0,
      });
      const res = await client.get(
        endpoints.workspaceSaabqChatCustomAttributes,
      );
      setCustomAttrs(res.data?.data?.payload || res.data?.data || []);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create custom attribute");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Custom Attribute
  const handleDeleteAttr = async (id) => {
    if (!confirm("هل أنت متأكد من حذف السمة المخصصة؟")) return;
    try {
      await client.delete(
        endpoints.workspaceSaabqChatCustomAttributeDetail(id),
      );
      setCustomAttrs((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete attribute");
    }
  };

  // Create Webhook
  const handleCreateWebhook = async (e) => {
    e.preventDefault();
    if (!webhookForm.url.trim()) return;
    setSubmitting(true);
    try {
      await client.post(endpoints.workspaceSaabqChatWebhooks, webhookForm);
      setShowWebhookModal(false);
      setWebhookForm({
        url: "",
        subscriptions: ["conversation_created", "message_created"],
      });
      const res = await client.get(endpoints.workspaceSaabqChatWebhooks);
      setWebhooks(res.data?.data?.payload || res.data?.data || []);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create webhook");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Webhook
  const handleDeleteWebhook = async (id) => {
    if (!confirm("هل أنت متأكد من حذف رابط الويب هوك؟")) return;
    try {
      await client.delete(endpoints.workspaceSaabqChatWebhookDetail(id));
      setWebhooks((prev) => prev.filter((w) => w.id !== id));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete webhook");
    }
  };

  // Create Agent Bot
  const handleCreateBot = async (e) => {
    e.preventDefault();
    if (!botForm.name.trim()) return;
    setSubmitting(true);
    try {
      await client.post(endpoints.workspaceSaabqChatAgentBots, botForm);
      setShowBotModal(false);
      setBotForm({ name: "", outgoing_url: "", description: "" });
      const res = await client.get(endpoints.workspaceSaabqChatAgentBots);
      setAgentBots(res.data?.data?.payload || res.data?.data || []);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create bot");
    } finally {
      setSubmitting(false);
    }
  };

  // Create Dashboard App
  const handleCreateApp = async (e) => {
    e.preventDefault();
    if (!appForm.title.trim() || !appForm.url.trim()) return;
    setSubmitting(true);
    try {
      await client.post(endpoints.workspaceSaabqChatDashboardApps, {
        title: appForm.title,
        content: [{ url: appForm.url, type: "frame" }],
      });
      setShowAppModal(false);
      setAppForm({
        title: "",
        url: "https://admin.cal.saabq.com/embed/chat-dashboard-app",
      });
      const res = await client.get(endpoints.workspaceSaabqChatDashboardApps);
      setDashboardApps(res.data?.data?.payload || res.data?.data || []);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create dashboard app");
    } finally {
      setSubmitting(false);
    }
  };

  // Create Campaign
  const handleCreateCampaign = async (e) => {
    e.preventDefault();
    if (!campaignForm.title.trim() || !campaignForm.message.trim()) return;
    setSubmitting(true);
    try {
      await client.post(endpoints.workspaceSaabqChatCampaigns, campaignForm);
      setShowCampaignModal(false);
      setCampaignForm({
        title: "",
        message: "",
        inbox_id: 1,
        enabled: true,
      });
      const res = await client.get(endpoints.workspaceSaabqChatCampaigns);
      setCampaigns(res.data?.data?.payload || res.data?.data || []);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create campaign");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Settings Navigation Tabs */}
      <div
        style={{
          display: "flex",
          gap: 8,
          borderBottom: "1px solid var(--border)",
          paddingBottom: 12,
          overflowX: "auto",
        }}
      >
        {[
          { id: "overview", label: "نظرة عامة والربط", icon: "activity" },
          { id: "labels_attrs", label: "الوسوم والسمات", icon: "tag" },
          { id: "webhooks", label: "الويب هوك (Webhooks)", icon: "link" },
          { id: "bots_apps", label: "البوتات والتطبيقات المضمنة", icon: "cpu" },
          { id: "campaigns", label: "الحملات الترويجية", icon: "send" },
          { id: "audit", label: "سجل التدقيق (Audit Logs)", icon: "shield" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveSubTab(tab.id)}
            className={
              activeSubTab === tab.id
                ? "btn btn-primary btn-sm"
                : "btn btn-secondary btn-sm"
            }
            style={{ gap: 6, whiteSpace: "nowrap" }}
          >
            <Icon name={tab.icon} size={14} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {activeSubTab === "overview" && (
        /* Overview & SSO Section */
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
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
                marginBottom: 16,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: "#10b981",
                    boxShadow: "0 0 8px #10b981",
                  }}
                />
                <h4 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 800 }}>
                  حالة تكامل المحادثات: متصل ونشط
                </h4>
              </div>
              <button
                type="button"
                onClick={handleOpenSso}
                disabled={ssoLoading}
                className="btn btn-primary btn-sm"
                style={{ gap: 6 }}
              >
                <Icon name="external-link" size={14} />
                <span>
                  {ssoLoading ? "جاري التجهيز..." : "فتح منصة شات مباشرة (SSO)"}
                </span>
              </button>
            </div>
            <p
              style={{
                fontSize: "0.84rem",
                color: "var(--text-secondary)",
                margin: 0,
                lineHeight: 1.6,
              }}
            >
              تم ربط حسابك في مساحة العمل بمنظومة سابق شات بنجاح. يمكنك إدارة
              الرسائل وجهات الاتصال وقنوات الاستقبال مباشرة من داخل Cal.
            </p>
          </div>
        </div>
      )}

      {activeSubTab === "labels_attrs" && (
        /* Labels & Custom Attributes */
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}
        >
          {/* Labels Card */}
          <div
            style={{
              background: "var(--surface)",
              borderRadius: "var(--radius-lg, 16px)",
              border: "1px solid var(--border)",
              padding: 20,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 14,
              }}
            >
              <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 800 }}>
                وسوم المحادثات والعملاء (Labels)
              </h4>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => setShowLabelModal(true)}
                style={{ gap: 4 }}
              >
                <Icon name="plus" size={13} />
                <span>إضافة وسم</span>
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {labels.length === 0 ? (
                <div
                  style={{
                    color: "var(--muted)",
                    fontSize: "0.82rem",
                    textAlign: "center",
                    padding: 20,
                  }}
                >
                  لا توجد وسوم مسجلة
                </div>
              ) : (
                labels.map((l) => (
                  <div
                    key={l.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "8px 12px",
                      background: "var(--surface-subtle, rgba(0,0,0,0.02))",
                      borderRadius: 8,
                      border: "1px solid var(--border)",
                    }}
                  >
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                      <div
                        style={{
                          width: 12,
                          height: 12,
                          borderRadius: "50%",
                          background: l.color || "#FF5733",
                        }}
                      />
                      <span style={{ fontWeight: 600, fontSize: "0.84rem" }}>
                        {l.title}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteLabel(l.id)}
                      style={{
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        color: "#dc2626",
                      }}
                    >
                      <Icon name="trash-2" size={12} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Custom Attributes Card */}
          <div
            style={{
              background: "var(--surface)",
              borderRadius: "var(--radius-lg, 16px)",
              border: "1px solid var(--border)",
              padding: 20,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 14,
              }}
            >
              <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 800 }}>
                السمات المخصصة (Custom Attributes)
              </h4>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => setShowAttrModal(true)}
                style={{ gap: 4 }}
              >
                <Icon name="plus" size={13} />
                <span>إضافة سمة</span>
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {customAttrs.length === 0 ? (
                <div
                  style={{
                    color: "var(--muted)",
                    fontSize: "0.82rem",
                    textAlign: "center",
                    padding: 20,
                  }}
                >
                  لا توجد سمات مخصصة مسجلة
                </div>
              ) : (
                customAttrs.map((a) => (
                  <div
                    key={a.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "8px 12px",
                      background: "var(--surface-subtle, rgba(0,0,0,0.02))",
                      borderRadius: 8,
                      border: "1px solid var(--border)",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: "0.84rem" }}>
                        {a.attribute_display_name || a.attribute_key}
                      </div>
                      <div
                        style={{ fontSize: "0.72rem", color: "var(--muted)" }}
                      >
                        مفتاح: {a.attribute_key} | نوع:{" "}
                        {a.attribute_display_type}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteAttr(a.id)}
                      style={{
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        color: "#dc2626",
                      }}
                    >
                      <Icon name="trash-2" size={12} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {activeSubTab === "webhooks" && (
        /* Webhooks Section */
        <div
          style={{
            background: "var(--surface)",
            borderRadius: "var(--radius-lg, 16px)",
            border: "1px solid var(--border)",
            padding: 20,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 14,
            }}
          >
            <h4 style={{ margin: 0, fontSize: "1rem", fontWeight: 800 }}>
              عناوين الويب هوك (Outgoing Webhooks)
            </h4>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => setShowWebhookModal(true)}
              style={{ gap: 4 }}
            >
              <Icon name="plus" size={13} />
              <span>إضافة ويب هوك</span>
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {webhooks.length === 0 ? (
              <div
                style={{
                  color: "var(--muted)",
                  fontSize: "0.82rem",
                  textAlign: "center",
                  padding: 20,
                }}
              >
                لا توجد روابط ويب هوك مسجلة
              </div>
            ) : (
              webhooks.map((w) => (
                <div
                  key={w.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "12px 16px",
                    background: "var(--surface-subtle, rgba(0,0,0,0.02))",
                    borderRadius: 8,
                    border: "1px solid var(--border)",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: "0.86rem",
                        wordBreak: "break-all",
                      }}
                    >
                      {w.url}
                    </div>
                    <div
                      style={{
                        fontSize: "0.72rem",
                        color: "var(--muted)",
                        marginTop: 2,
                      }}
                    >
                      الاشتراكات:{" "}
                      {Array.isArray(w.subscriptions)
                        ? w.subscriptions.join(", ")
                        : "الكل"}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteWebhook(w.id)}
                    style={{
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      color: "#dc2626",
                    }}
                  >
                    <Icon name="trash-2" size={13} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeSubTab === "bots_apps" && (
        /* Bots & Dashboard Apps */
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}
        >
          {/* Bots */}
          <div
            style={{
              background: "var(--surface)",
              borderRadius: "var(--radius-lg, 16px)",
              border: "1px solid var(--border)",
              padding: 20,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 14,
              }}
            >
              <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 800 }}>
                بوتات المحادثة التلقائية (Agent Bots)
              </h4>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => setShowBotModal(true)}
                style={{ gap: 4 }}
              >
                <Icon name="plus" size={13} />
                <span>إضافة بوت</span>
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {agentBots.length === 0 ? (
                <div
                  style={{
                    color: "var(--muted)",
                    fontSize: "0.82rem",
                    textAlign: "center",
                    padding: 20,
                  }}
                >
                  لا توجد بوتات مسجلة
                </div>
              ) : (
                agentBots.map((b) => (
                  <div
                    key={b.id}
                    style={{
                      padding: "10px 14px",
                      background: "var(--surface-subtle, rgba(0,0,0,0.02))",
                      borderRadius: 8,
                      border: "1px solid var(--border)",
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: "0.86rem" }}>
                      {b.name}
                    </div>
                    <div
                      style={{
                        fontSize: "0.74rem",
                        color: "var(--muted)",
                        marginTop: 2,
                      }}
                    >
                      {b.outgoing_url || "لا يوجد رابط صادر"}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Dashboard Apps */}
          <div
            style={{
              background: "var(--surface)",
              borderRadius: "var(--radius-lg, 16px)",
              border: "1px solid var(--border)",
              padding: 20,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 14,
              }}
            >
              <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 800 }}>
                التطبيقات المضمنة (Dashboard Apps)
              </h4>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => setShowAppModal(true)}
                style={{ gap: 4 }}
              >
                <Icon name="plus" size={13} />
                <span>إضافة تطبيق</span>
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {dashboardApps.length === 0 ? (
                <div
                  style={{
                    color: "var(--muted)",
                    fontSize: "0.82rem",
                    textAlign: "center",
                    padding: 20,
                  }}
                >
                  لا توجد تطبيقات مضمنة مسجلة
                </div>
              ) : (
                dashboardApps.map((d) => (
                  <div
                    key={d.id}
                    style={{
                      padding: "10px 14px",
                      background: "var(--surface-subtle, rgba(0,0,0,0.02))",
                      borderRadius: 8,
                      border: "1px solid var(--border)",
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: "0.86rem" }}>
                      {d.title}
                    </div>
                    <div
                      style={{
                        fontSize: "0.74rem",
                        color: "var(--muted)",
                        marginTop: 2,
                      }}
                    >
                      {d.content?.[0]?.url || "Iframe Widget"}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {activeSubTab === "campaigns" && (
        /* Campaigns */
        <div
          style={{
            background: "var(--surface)",
            borderRadius: "var(--radius-lg, 16px)",
            border: "1px solid var(--border)",
            padding: 20,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 14,
            }}
          >
            <h4 style={{ margin: 0, fontSize: "1rem", fontWeight: 800 }}>
              حملات التواصل التلقائية (Campaigns)
            </h4>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => setShowCampaignModal(true)}
              style={{ gap: 4 }}
            >
              <Icon name="plus" size={13} />
              <span>إنشاء حملة</span>
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {campaigns.length === 0 ? (
              <div
                style={{
                  color: "var(--muted)",
                  fontSize: "0.82rem",
                  textAlign: "center",
                  padding: 20,
                }}
              >
                لا توجد حملات مسجلة
              </div>
            ) : (
              campaigns.map((c) => (
                <div
                  key={c.id}
                  style={{
                    padding: "12px 16px",
                    background: "var(--surface-subtle, rgba(0,0,0,0.02))",
                    borderRadius: 8,
                    border: "1px solid var(--border)",
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: "0.88rem" }}>
                    {c.title}
                  </div>
                  <p
                    style={{
                      margin: "4px 0 0",
                      fontSize: "0.82rem",
                      color: "var(--text-secondary)",
                    }}
                  >
                    {c.message}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeSubTab === "audit" && (
        /* Audit Logs */
        <div
          style={{
            background: "var(--surface)",
            borderRadius: "var(--radius-lg, 16px)",
            border: "1px solid var(--border)",
            padding: 20,
          }}
        >
          <h4 style={{ margin: "0 0 14px", fontSize: "1rem", fontWeight: 800 }}>
            سجل العمليات والتدقيق الأمني (Audit Logs)
          </h4>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {auditLogs.length === 0 ? (
              <div
                style={{
                  color: "var(--muted)",
                  fontSize: "0.82rem",
                  textAlign: "center",
                  padding: 20,
                }}
              >
                لا توجد سجلات تدقيق مسجلة
              </div>
            ) : (
              auditLogs.map((log) => (
                <div
                  key={log.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px 14px",
                    background: "var(--surface-subtle, rgba(0,0,0,0.02))",
                    borderRadius: 8,
                    border: "1px solid var(--border)",
                    fontSize: "0.82rem",
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 700 }}>{log.action}</span>
                    <span
                      style={{ color: "var(--muted)", marginInlineStart: 8 }}
                    >
                      بواسطة: {log.user?.name || "المستخدم"}
                    </span>
                  </div>
                  <span style={{ color: "var(--muted)", fontSize: "0.74rem" }}>
                    {new Date(log.created_at * 1000).toLocaleString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Label Modal */}
      {showLabelModal && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <h4 className="modal-title">إضافة وسم جديد</h4>
              <button
                type="button"
                className="modal-close"
                onClick={() => setShowLabelModal(false)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateLabel} className="modal-body">
              <div className="form-group" style={{ marginBottom: 14 }}>
                <label
                  style={{
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    marginBottom: 4,
                    display: "block",
                  }}
                >
                  عنوان الوسم *
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: vip_customer"
                  value={labelForm.title}
                  onChange={(e) =>
                    setLabelForm({ ...labelForm, title: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: "1px solid var(--border)",
                  }}
                />
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
                  لون الوسم
                </label>
                <input
                  type="color"
                  value={labelForm.color}
                  onChange={(e) =>
                    setLabelForm({ ...labelForm, color: e.target.value })
                  }
                  style={{
                    width: 60,
                    height: 36,
                    padding: 2,
                    borderRadius: 6,
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
                  onClick={() => setShowLabelModal(false)}
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary"
                >
                  {submitting ? "جاري الحفظ..." : "حفظ"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Attribute Modal */}
      {showAttrModal && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <h4 className="modal-title">إضافة سمة مخصصة</h4>
              <button
                type="button"
                className="modal-close"
                onClick={() => setShowAttrModal(false)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateAttr} className="modal-body">
              <div className="form-group" style={{ marginBottom: 14 }}>
                <label
                  style={{
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    marginBottom: 4,
                    display: "block",
                  }}
                >
                  الاسم المعروض *
                </label>
                <input
                  type="text"
                  required
                  placeholder="رقم طلب الحجز"
                  value={attrForm.attribute_display_name}
                  onChange={(e) =>
                    setAttrForm({
                      ...attrForm,
                      attribute_display_name: e.target.value,
                    })
                  }
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: "1px solid var(--border)",
                  }}
                />
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
                  المفتاح البرمجي (Key) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="booking_order_id"
                  value={attrForm.attribute_key}
                  onChange={(e) =>
                    setAttrForm({ ...attrForm, attribute_key: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: "1px solid var(--border)",
                  }}
                />
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
                  النموذج المرتبط
                </label>
                <select
                  value={attrForm.attribute_model}
                  onChange={(e) =>
                    setAttrForm({
                      ...attrForm,
                      attribute_model: Number(e.target.value),
                    })
                  }
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: "1px solid var(--border)",
                  }}
                >
                  <option value={0}>المحادثات (Conversation Attribute)</option>
                  <option value={1}>جهات الاتصال (Contact Attribute)</option>
                </select>
              </div>
              <div
                style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}
              >
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAttrModal(false)}
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary"
                >
                  {submitting ? "جاري الحفظ..." : "حفظ"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Webhook Modal */}
      {showWebhookModal && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <h4 className="modal-title">إضافة رابط ويب هوك</h4>
              <button
                type="button"
                className="modal-close"
                onClick={() => setShowWebhookModal(false)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateWebhook} className="modal-body">
              <div className="form-group" style={{ marginBottom: 18 }}>
                <label
                  style={{
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    marginBottom: 4,
                    display: "block",
                  }}
                >
                  الرابط المستهدف (URL) *
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://example.com/api/chat-webhook"
                  value={webhookForm.url}
                  onChange={(e) =>
                    setWebhookForm({ ...webhookForm, url: e.target.value })
                  }
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
                  onClick={() => setShowWebhookModal(false)}
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary"
                >
                  {submitting ? "جاري الإضافة..." : "إضافة الويب هوك"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bot Modal */}
      {showBotModal && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <h4 className="modal-title">إضافة بوت محادثة جديد</h4>
              <button
                type="button"
                className="modal-close"
                onClick={() => setShowBotModal(false)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateBot} className="modal-body">
              <div className="form-group" style={{ marginBottom: 14 }}>
                <label
                  style={{
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    marginBottom: 4,
                    display: "block",
                  }}
                >
                  اسم البوت *
                </label>
                <input
                  type="text"
                  required
                  placeholder="بوت الرد الآلي والمواعيد"
                  value={botForm.name}
                  onChange={(e) =>
                    setBotForm({ ...botForm, name: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: "1px solid var(--border)",
                  }}
                />
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
                  رابط الويب هوك الصادر للبوت
                </label>
                <input
                  type="url"
                  placeholder="https://bot.saabq.com/webhook"
                  value={botForm.outgoing_url}
                  onChange={(e) =>
                    setBotForm({ ...botForm, outgoing_url: e.target.value })
                  }
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
                  onClick={() => setShowBotModal(false)}
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary"
                >
                  {submitting ? "جاري الحفظ..." : "حفظ البوت"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dashboard App Modal */}
      {showAppModal && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <h4 className="modal-title">إضافة تطبيق مضمن في المحادثة</h4>
              <button
                type="button"
                className="modal-close"
                onClick={() => setShowAppModal(false)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateApp} className="modal-body">
              <div className="form-group" style={{ marginBottom: 14 }}>
                <label
                  style={{
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    marginBottom: 4,
                    display: "block",
                  }}
                >
                  عنوان التطبيق *
                </label>
                <input
                  type="text"
                  required
                  placeholder="سياق حجز العميل في Cal"
                  value={appForm.title}
                  onChange={(e) =>
                    setAppForm({ ...appForm, title: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: "1px solid var(--border)",
                  }}
                />
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
                  رابط التضمين (URL) *
                </label>
                <input
                  type="url"
                  required
                  value={appForm.url}
                  onChange={(e) =>
                    setAppForm({ ...appForm, url: e.target.value })
                  }
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
                  onClick={() => setShowAppModal(false)}
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary"
                >
                  {submitting ? "جاري الحفظ..." : "حفظ التطبيق"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Campaign Modal */}
      {showCampaignModal && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <h4 className="modal-title">إنشاء حملة تواصل جديدة</h4>
              <button
                type="button"
                className="modal-close"
                onClick={() => setShowCampaignModal(false)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateCampaign} className="modal-body">
              <div className="form-group" style={{ marginBottom: 14 }}>
                <label
                  style={{
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    marginBottom: 4,
                    display: "block",
                  }}
                >
                  عنوان الحملة *
                </label>
                <input
                  type="text"
                  required
                  placeholder="عرض العودة للمدارس"
                  value={campaignForm.title}
                  onChange={(e) =>
                    setCampaignForm({ ...campaignForm, title: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: "1px solid var(--border)",
                  }}
                />
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
                  رسالة الحملة *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="مرحبًا بك، استمتع بخصم 20% على خدماتنا..."
                  value={campaignForm.message}
                  onChange={(e) =>
                    setCampaignForm({
                      ...campaignForm,
                      message: e.target.value,
                    })
                  }
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
                  onClick={() => setShowCampaignModal(false)}
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary"
                >
                  {submitting ? "جاري الإنشاء..." : "حفظ الحملة"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
