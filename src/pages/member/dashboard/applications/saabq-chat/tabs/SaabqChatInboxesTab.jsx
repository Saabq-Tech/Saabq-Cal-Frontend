import React, { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { useLanguage } from "../../../../../../context/LanguageContext";
import client, { endpoints } from "../../../../../../api/client";
import Icon from "../../../../../../components/common/Icon";

export default function SaabqChatInboxesTab() {
  const { t } = useLanguage();
  const { settings } = useOutletContext() || {};
  const [inboxes, setInboxes] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [activeInbox, setActiveInbox] = useState(null);
  const [inboxMembers, setInboxMembers] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    channel_type: "web_widget",
    greeting_enabled: true,
    greeting_message: "مرحباً بك! كيف يمكننا مساعدتك اليوم؟",
    enable_auto_assignment: true,
    website_url: "https://saabq.com",
    widget_color: "#1F93FF",
  });
  const [selectedAgentToAdd, setSelectedAgentToAdd] = useState("");

  const fetchInboxes = () => {
    setLoading(true);
    client
      .get(endpoints.workspaceSaabqChatInboxes)
      .then((res) => {
        const list = res.data?.data?.payload || res.data?.data || [];
        setInboxes(Array.isArray(list) ? list : []);
      })
      .catch(() => {
        setInboxes([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchInboxes();
    client
      .get(endpoints.workspaceSaabqChatAgents)
      .then((res) => {
        const list = res.data?.data || [];
        setAgents(Array.isArray(list) ? list : []);
      })
      .catch(() => setAgents([]));
  }, []);

  // Create Inbox Handler
  const handleCreateInbox = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    setSubmitting(true);
    try {
      const payload = {
        name: formData.name,
        channel_type: formData.channel_type,
        greeting_enabled: formData.greeting_enabled,
        greeting_message: formData.greeting_message,
        enable_auto_assignment: formData.enable_auto_assignment,
        channel_config: {
          website_url: formData.website_url,
          widget_color: formData.widget_color,
        },
      };
      await client.post(endpoints.workspaceSaabqChatInboxes, payload);
      setShowCreateModal(false);
      fetchInboxes();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create inbox");
    } finally {
      setSubmitting(false);
    }
  };

  // Edit Inbox Handler
  const handleUpdateInbox = async (e) => {
    e.preventDefault();
    if (!activeInbox?.id) return;
    setSubmitting(true);
    try {
      await client.post(
        endpoints.workspaceSaabqChatInboxDetail(activeInbox.id),
        {
          name: formData.name,
          greeting_enabled: formData.greeting_enabled,
          greeting_message: formData.greeting_message,
          enable_auto_assignment: formData.enable_auto_assignment,
        },
      );
      setShowEditModal(false);
      fetchInboxes();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update inbox");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Inbox
  const handleDeleteInbox = async (id) => {
    if (!confirm("هل أنت متأكد من رغبتك في حذف قناة الاستقبال هذه؟")) return;
    try {
      await client.delete(endpoints.workspaceSaabqChatInboxDetail(id));
      fetchInboxes();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete inbox");
    }
  };

  // Open Members Modal
  const openMembersModal = async (ib) => {
    setActiveInbox(ib);
    setShowMembersModal(true);
    try {
      const res = await client.get(
        endpoints.workspaceSaabqChatInboxMembers(ib.id),
      );
      const list = res.data?.data?.payload || res.data?.data || [];
      setInboxMembers(Array.isArray(list) ? list : []);
    } catch {
      setInboxMembers([]);
    }
  };

  // Add Member to Inbox
  const handleAddMemberToInbox = async () => {
    if (!selectedAgentToAdd || !activeInbox?.id) return;
    try {
      await client.post(
        endpoints.workspaceSaabqChatInboxMembers(activeInbox.id),
        {
          user_ids: [Number(selectedAgentToAdd)],
        },
      );
      setSelectedAgentToAdd("");
      const res = await client.get(
        endpoints.workspaceSaabqChatInboxMembers(activeInbox.id),
      );
      setInboxMembers(res.data?.data?.payload || res.data?.data || []);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to add member to inbox");
    }
  };

  const handleCopyScript = (token) => {
    const baseUrl = settings?.chat_base_url || "https://chat.saabq.com";
    const script = `<script>
  (function(d,t) {
    var BASE_URL="${baseUrl}";
    var g=d.createElement(t),s=d.getElementsByTagName(t)[0];
    g.src=BASE_URL+"/packs/js/sdk.js";
    g.async=true;
    s.parentNode.insertBefore(g,s);
    g.onload=function(){
      window.chatwootSDK.run({
        websiteToken: '${token}',
        baseUrl: BASE_URL
      })
    }
  })(document,"script");
</script>`;
    navigator.clipboard.writeText(script);
    setCopiedId(token);
    setTimeout(() => setCopiedId(null), 3000);
  };

  const openEdit = (ib) => {
    setActiveInbox(ib);
    setFormData({
      name: ib.name || "",
      greeting_enabled: Boolean(ib.greeting_enabled),
      greeting_message: ib.greeting_message || "",
      enable_auto_assignment: Boolean(ib.enable_auto_assignment),
      channel_type: ib.channel_type || "web_widget",
      website_url: ib.website_url || "",
      widget_color: ib.widget_color || "#1F93FF",
    });
    setShowEditModal(true);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <h3
            style={{
              margin: "0 0 4px",
              fontSize: "1.15rem",
              fontWeight: 800,
              color: "var(--heading)",
            }}
          >
            {t("inboxesAndChannels") || "قنوات الاستقبال والمحادثات"}
          </h3>
          <p
            style={{
              margin: 0,
              fontSize: "0.86rem",
              color: "var(--text-secondary)",
            }}
          >
            إدارة قنوات التواصل الموحدة (موقع الويب، واتساب، تليجرام، البريد
            الإلكتروني، وغيرها)
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            setFormData({
              name: "",
              channel_type: "web_widget",
              greeting_enabled: true,
              greeting_message: "مرحباً بك! كيف يمكننا مساعدتك اليوم؟",
              enable_auto_assignment: true,
              website_url: "https://saabq.com",
              widget_color: "#1F93FF",
            });
            setShowCreateModal(true);
          }}
          style={{ gap: 6 }}
        >
          <Icon name="plus" size={15} />
          <span>إنشاء قناة جديدة</span>
        </button>
      </div>

      {loading ? (
        <div
          style={{ padding: 40, textAlign: "center", color: "var(--muted)" }}
        >
          {t("loadingInboxes") || "جاري تحميل القنوات..."}
        </div>
      ) : inboxes.length === 0 ? (
        <div
          style={{
            background: "var(--surface)",
            borderRadius: "var(--radius-lg, 16px)",
            border: "1px solid var(--border)",
            padding: "48px 24px",
            textAlign: "center",
            color: "var(--muted)",
          }}
        >
          لا توجد قنوات استقبال مسجلة حالياً
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: 18,
          }}
        >
          {inboxes.map((ib) => {
            const token = ib.website_token || ib.token;
            return (
              <div
                key={ib.id}
                style={{
                  background: "var(--surface)",
                  borderRadius: "var(--radius-lg, 16px)",
                  border: "1px solid var(--border)",
                  padding: 20,
                  boxShadow: "var(--shadow-sm)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: 12,
                    }}
                  >
                    <div>
                      <h4
                        style={{
                          margin: "0 0 4px",
                          fontSize: "1.05rem",
                          fontWeight: 800,
                          color: "var(--heading)",
                        }}
                      >
                        {ib.name}
                      </h4>
                      <span
                        style={{
                          fontSize: "0.72rem",
                          padding: "2px 8px",
                          borderRadius: 12,
                          background: "rgba(2, 105, 130, 0.08)",
                          color: "var(--primary)",
                          fontWeight: 700,
                          textTransform: "uppercase",
                        }}
                      >
                        {ib.channel_type || "web_widget"}
                      </span>
                    </div>

                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        type="button"
                        onClick={() => openMembersModal(ib)}
                        className="btn btn-secondary btn-sm"
                        title="إدارة أعضاء القناة"
                        style={{ padding: "4px 8px" }}
                      >
                        <Icon name="users" size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => openEdit(ib)}
                        className="btn btn-secondary btn-sm"
                        title="تعديل القناة"
                        style={{ padding: "4px 8px" }}
                      >
                        <Icon name="edit-2" size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteInbox(ib.id)}
                        className="btn btn-secondary btn-sm"
                        title="حذف القناة"
                        style={{ padding: "4px 8px", color: "#dc2626" }}
                      >
                        <Icon name="trash-2" size={13} />
                      </button>
                    </div>
                  </div>

                  <div
                    style={{
                      fontSize: "0.82rem",
                      color: "var(--text-secondary)",
                      lineHeight: 1.8,
                    }}
                  >
                    <div>
                      <strong>الرد التلقائي:</strong>{" "}
                      {ib.greeting_enabled ? "مفعّل" : "معطّل"}
                    </div>
                    <div>
                      <strong>التوزيع التلقائي:</strong>{" "}
                      {ib.enable_auto_assignment ? "مفعّل" : "معطّل"}
                    </div>
                    {ib.timezone && (
                      <div>
                        <strong>المنطقة الزمنية:</strong> {ib.timezone}
                      </div>
                    )}
                  </div>
                </div>

                {token && (
                  <div
                    style={{
                      marginTop: 18,
                      paddingTop: 14,
                      borderTop: "1px solid var(--border)",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => handleCopyScript(token)}
                      className="btn btn-secondary btn-sm"
                      style={{
                        width: "100%",
                        justifyContent: "center",
                        gap: 6,
                      }}
                    >
                      <Icon
                        name={copiedId === token ? "check" : "code"}
                        size={13}
                      />
                      <span>
                        {copiedId === token
                          ? "تم نسخ كود التضمين!"
                          : "نسخ كود الودجت للموقع"}
                      </span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create Inbox Modal */}
      {showCreateModal && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <h4 className="modal-title">إنشاء قناة استقبال جديدة</h4>
              <button
                type="button"
                className="modal-close"
                onClick={() => setShowCreateModal(false)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateInbox} className="modal-body">
              <div className="form-group" style={{ marginBottom: 14 }}>
                <label
                  style={{
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    marginBottom: 4,
                    display: "block",
                  }}
                >
                  اسم القناة *
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: خدمة العملاء والمبيعات"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
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
                  نوع القناة *
                </label>
                <select
                  value={formData.channel_type}
                  onChange={(e) =>
                    setFormData({ ...formData, channel_type: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: "1px solid var(--border)",
                  }}
                >
                  <option value="web_widget">
                    ودجت المحادثة الحية (Web Widget)
                  </option>
                  <option value="api">قناة برمجية (API Channel)</option>
                  <option value="email">البريد الإلكتروني (Email)</option>
                  <option value="whatsapp">واتساب للأعمال (WhatsApp)</option>
                  <option value="telegram">تليجرام (Telegram)</option>
                  <option value="line">لاين (LINE)</option>
                  <option value="sms">الرسائل النصية (SMS)</option>
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
                  رسالة الترحيب التلقائية
                </label>
                <input
                  type="text"
                  value={formData.greeting_message}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      greeting_message: e.target.value,
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

              <div style={{ display: "flex", gap: 14, marginBottom: 18 }}>
                <label
                  style={{
                    fontSize: "0.82rem",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={formData.greeting_enabled}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        greeting_enabled: e.target.checked,
                      })
                    }
                  />
                  <span>تفعيل الترحيب</span>
                </label>
                <label
                  style={{
                    fontSize: "0.82rem",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={formData.enable_auto_assignment}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        enable_auto_assignment: e.target.checked,
                      })
                    }
                  />
                  <span>توزيع تلقائي بين الوكلاء</span>
                </label>
              </div>

              <div
                style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}
              >
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowCreateModal(false)}
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary"
                >
                  {submitting ? "جاري الإنشاء..." : "إنشاء القناة"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Inbox Modal */}
      {showEditModal && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <h4 className="modal-title">تعديل قناة الاستقبال</h4>
              <button
                type="button"
                className="modal-close"
                onClick={() => setShowEditModal(false)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleUpdateInbox} className="modal-body">
              <div className="form-group" style={{ marginBottom: 14 }}>
                <label
                  style={{
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    marginBottom: 4,
                    display: "block",
                  }}
                >
                  اسم القناة
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
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
                  رسالة الترحيب
                </label>
                <input
                  type="text"
                  value={formData.greeting_message}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      greeting_message: e.target.value,
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

              <div style={{ display: "flex", gap: 14, marginBottom: 18 }}>
                <label
                  style={{
                    fontSize: "0.82rem",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={formData.greeting_enabled}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        greeting_enabled: e.target.checked,
                      })
                    }
                  />
                  <span>تفعيل الترحيب</span>
                </label>
                <label
                  style={{
                    fontSize: "0.82rem",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={formData.enable_auto_assignment}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        enable_auto_assignment: e.target.checked,
                      })
                    }
                  />
                  <span>توزيع تلقائي</span>
                </label>
              </div>

              <div
                style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}
              >
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowEditModal(false)}
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary"
                >
                  {submitting ? "جاري الحفظ..." : "حفظ التغييرات"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inbox Members Modal */}
      {showMembersModal && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <h4 className="modal-title">أعضاء قناة: {activeInbox?.name}</h4>
              <button
                type="button"
                className="modal-close"
                onClick={() => setShowMembersModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              {/* Add member select */}
              <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                <select
                  value={selectedAgentToAdd}
                  onChange={(e) => setSelectedAgentToAdd(e.target.value)}
                  style={{
                    flex: 1,
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: "1px solid var(--border)",
                    fontSize: "0.82rem",
                  }}
                >
                  <option value="">-- حدد وكيلاً لإضافته للقناة --</option>
                  {agents.map((ag) => (
                    <option key={ag.id} value={ag.id}>
                      {ag.name} ({ag.email})
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleAddMemberToInbox}
                  disabled={!selectedAgentToAdd}
                  className="btn btn-primary btn-sm"
                >
                  إضافة
                </button>
              </div>

              {/* Members List */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  maxHeight: 220,
                  overflowY: "auto",
                }}
              >
                {inboxMembers.length === 0 ? (
                  <div
                    style={{
                      color: "var(--muted)",
                      fontSize: "0.82rem",
                      textAlign: "center",
                      padding: 20,
                    }}
                  >
                    لا يوجد أعضاء مخصصون لهذه القناة حالياً
                  </div>
                ) : (
                  inboxMembers.map((m) => (
                    <div
                      key={m.id}
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
                      <span style={{ fontSize: "0.84rem", fontWeight: 600 }}>
                        {m.name || m.email}
                      </span>
                      <span
                        style={{ fontSize: "0.72rem", color: "var(--muted)" }}
                      >
                        {m.role}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
