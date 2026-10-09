import React, { useState, useEffect } from "react";
import client, { endpoints } from "../../../../../../api/client";
import Icon from "../../../../../../components/common/Icon";

export default function SaabqChatAutomationsTab() {
  const [activeSubTab, setActiveSubTab] = useState("canned"); // canned, rules, macros
  const [canned, setCanned] = useState([]);
  const [rules, setRules] = useState([]);
  const [macros, setMacros] = useState([]);
  const [loading, setLoading] = useState(false);

  // Canned Modals
  const [showCannedModal, setShowCannedModal] = useState(false);
  const [activeCanned, setActiveCanned] = useState(null);
  const [cannedForm, setCannedForm] = useState({ short_code: "", content: "" });

  // Rule Modals
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [ruleForm, setRuleForm] = useState({
    name: "",
    event_name: "conversation_created",
    action_type: "add_label",
    action_param: "",
  });

  // Macro Modals
  const [showMacroModal, setShowMacroModal] = useState(false);
  const [macroForm, setMacroForm] = useState({
    name: "",
    action_name: "resolve_conversation",
  });

  const [submitting, setSubmitting] = useState(false);

  // Fetch all automation data
  const fetchData = () => {
    setLoading(true);
    Promise.all([
      client
        .get(endpoints.workspaceSaabqChatCannedResponses)
        .catch(() => ({ data: { data: [] } })),
      client
        .get(endpoints.workspaceSaabqChatAutomationRules)
        .catch(() => ({ data: { data: [] } })),
      client
        .get(endpoints.workspaceSaabqChatMacros)
        .catch(() => ({ data: { data: [] } })),
    ])
      .then(([cannedRes, rulesRes, macrosRes]) => {
        const cList =
          cannedRes.data?.data?.payload || cannedRes.data?.data || [];
        const rList = rulesRes.data?.data?.payload || rulesRes.data?.data || [];
        const mList =
          macrosRes.data?.data?.payload || macrosRes.data?.data || [];
        setCanned(Array.isArray(cList) ? cList : []);
        setRules(Array.isArray(rList) ? rList : []);
        setMacros(Array.isArray(mList) ? mList : []);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Save / Update Canned Response
  const handleSaveCanned = async (e) => {
    e.preventDefault();
    if (!cannedForm.short_code.trim() || !cannedForm.content.trim()) return;
    setSubmitting(true);
    try {
      if (activeCanned) {
        await client.post(
          endpoints.workspaceSaabqChatCannedResponseDetail(activeCanned.id),
          cannedForm,
        );
      } else {
        await client.post(
          endpoints.workspaceSaabqChatCannedResponses,
          cannedForm,
        );
      }
      setShowCannedModal(false);
      setCannedForm({ short_code: "", content: "" });
      setActiveCanned(null);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to save canned response");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Canned Response
  const handleDeleteCanned = async (id) => {
    if (!confirm("هل أنت متأكد من حذف الرد الجاهز؟")) return;
    try {
      await client.delete(endpoints.workspaceSaabqChatCannedResponseDetail(id));
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete canned response");
    }
  };

  // Create Automation Rule
  const handleSaveRule = async (e) => {
    e.preventDefault();
    if (!ruleForm.name.trim()) return;
    setSubmitting(true);
    try {
      const payload = {
        name: ruleForm.name,
        event_name: ruleForm.event_name,
        conditions: [
          {
            attribute_key: "status",
            filter_operator: "equal_to",
            values: ["open"],
          },
        ],
        actions: [
          {
            action_name: ruleForm.action_type,
            action_params: ruleForm.action_param ? [ruleForm.action_param] : [],
          },
        ],
        active: true,
      };
      await client.post(endpoints.workspaceSaabqChatAutomationRules, payload);
      setShowRuleModal(false);
      setRuleForm({
        name: "",
        event_name: "conversation_created",
        action_type: "add_label",
        action_param: "",
      });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create automation rule");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Automation Rule
  const handleDeleteRule = async (id) => {
    if (!confirm("هل أنت متأكد من حذف قاعدة الأتمتة؟")) return;
    try {
      await client.delete(endpoints.workspaceSaabqChatAutomationRuleDetail(id));
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete rule");
    }
  };

  // Save Macro
  const handleSaveMacro = async (e) => {
    e.preventDefault();
    if (!macroForm.name.trim()) return;
    setSubmitting(true);
    try {
      const payload = {
        name: macroForm.name,
        actions: [{ action_name: macroForm.action_name, action_params: [] }],
        visibility: "global",
      };
      await client.post(endpoints.workspaceSaabqChatMacros, payload);
      setShowMacroModal(false);
      setMacroForm({ name: "", action_name: "resolve_conversation" });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to save macro");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Macro
  const handleDeleteMacro = async (id) => {
    if (!confirm("هل أنت متأكد من حذف الماكرو؟")) return;
    try {
      await client.delete(endpoints.workspaceSaabqChatMacroDetail(id));
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete macro");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Sub-tab Navigation */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid var(--border)",
          paddingBottom: 12,
        }}
      >
        <div style={{ display: "flex", gap: 8 }}>
          {[
            {
              id: "canned",
              label: "الردود الجاهزة (Canned Responses)",
              icon: "message-square",
            },
            {
              id: "rules",
              label: "قواعد الأتمتة (Automation Rules)",
              icon: "zap",
            },
            { id: "macros", label: "إجراءات الماكرو (Macros)", icon: "play" },
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
              style={{ gap: 6 }}
            >
              <Icon name={tab.icon} size={14} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {activeSubTab === "canned" && (
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => {
              setActiveCanned(null);
              setCannedForm({ short_code: "", content: "" });
              setShowCannedModal(true);
            }}
            style={{ gap: 6 }}
          >
            <Icon name="plus" size={14} />
            <span>إضافة رد جاهز</span>
          </button>
        )}

        {activeSubTab === "rules" && (
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => setShowRuleModal(true)}
            style={{ gap: 6 }}
          >
            <Icon name="plus" size={14} />
            <span>إنشاء قاعدة أتمتة</span>
          </button>
        )}

        {activeSubTab === "macros" && (
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => setShowMacroModal(true)}
            style={{ gap: 6 }}
          >
            <Icon name="plus" size={14} />
            <span>إنشاء ماكرو جديد</span>
          </button>
        )}
      </div>

      {loading ? (
        <div
          style={{ padding: 40, textAlign: "center", color: "var(--muted)" }}
        >
          جاري التحميل...
        </div>
      ) : activeSubTab === "canned" ? (
        /* Canned Responses Table */
        <div
          style={{
            background: "var(--surface)",
            borderRadius: "var(--radius-lg, 16px)",
            border: "1px solid var(--border)",
            overflow: "hidden",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
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
                    fontSize: "0.8rem",
                    textAlign: "start",
                  }}
                >
                  الاختصار (Short Code)
                </th>
                <th
                  style={{
                    padding: "12px 18px",
                    fontSize: "0.8rem",
                    textAlign: "start",
                  }}
                >
                  نص الرد التلقائي
                </th>
                <th
                  style={{
                    padding: "12px 18px",
                    fontSize: "0.8rem",
                    textAlign: "end",
                  }}
                >
                  الإجراءات
                </th>
              </tr>
            </thead>
            <tbody>
              {canned.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    style={{
                      padding: 30,
                      textAlign: "center",
                      color: "var(--muted)",
                    }}
                  >
                    لا توجد ردود جاهزة مسجلة
                  </td>
                </tr>
              ) : (
                canned.map((c) => (
                  <tr
                    key={c.id}
                    style={{ borderBottom: "1px solid var(--border)" }}
                  >
                    <td
                      style={{
                        padding: "12px 18px",
                        fontWeight: 700,
                        color: "var(--primary)",
                      }}
                    >
                      !{c.short_code}
                    </td>
                    <td
                      style={{
                        padding: "12px 18px",
                        fontSize: "0.84rem",
                        color: "var(--heading)",
                      }}
                    >
                      {c.content}
                    </td>
                    <td style={{ padding: "12px 18px", textAlign: "end" }}>
                      <div style={{ display: "inline-flex", gap: 6 }}>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveCanned(c);
                            setCannedForm({
                              short_code: c.short_code,
                              content: c.content,
                            });
                            setShowCannedModal(true);
                          }}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: "4px 8px" }}
                        >
                          <Icon name="edit-2" size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCanned(c.id)}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: "4px 8px", color: "#dc2626" }}
                        >
                          <Icon name="trash-2" size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : activeSubTab === "rules" ? (
        /* Automation Rules List */
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: 16,
          }}
        >
          {rules.length === 0 ? (
            <div
              style={{
                padding: 30,
                textAlign: "center",
                color: "var(--muted)",
                gridColumn: "1 / -1",
              }}
            >
              لا توجد قواعد أتمتة مسجلة
            </div>
          ) : (
            rules.map((r) => (
              <div
                key={r.id}
                style={{
                  background: "var(--surface)",
                  padding: 18,
                  borderRadius: "var(--radius-lg, 16px)",
                  border: "1px solid var(--border)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: 10,
                  }}
                >
                  <h4
                    style={{ margin: 0, fontSize: "0.95rem", fontWeight: 800 }}
                  >
                    {r.name}
                  </h4>
                  <button
                    type="button"
                    onClick={() => handleDeleteRule(r.id)}
                    className="btn btn-secondary btn-sm"
                    style={{ padding: "4px 8px", color: "#dc2626" }}
                  >
                    <Icon name="trash-2" size={12} />
                  </button>
                </div>
                <div
                  style={{
                    fontSize: "0.8rem",
                    color: "var(--text-secondary)",
                    lineHeight: 1.8,
                  }}
                >
                  <div>
                    <strong>الحدث المشغل:</strong> {r.event_name}
                  </div>
                  <div>
                    <strong>الحالة:</strong> {r.active ? "مفعّل" : "معطّل"}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        /* Macros List */
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: 16,
          }}
        >
          {macros.length === 0 ? (
            <div
              style={{
                padding: 30,
                textAlign: "center",
                color: "var(--muted)",
                gridColumn: "1 / -1",
              }}
            >
              لا توجد إجراءات ماكرو مسجلة
            </div>
          ) : (
            macros.map((m) => (
              <div
                key={m.id}
                style={{
                  background: "var(--surface)",
                  padding: 18,
                  borderRadius: "var(--radius-lg, 16px)",
                  border: "1px solid var(--border)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: 10,
                  }}
                >
                  <h4
                    style={{ margin: 0, fontSize: "0.95rem", fontWeight: 800 }}
                  >
                    {m.name}
                  </h4>
                  <button
                    type="button"
                    onClick={() => handleDeleteMacro(m.id)}
                    className="btn btn-secondary btn-sm"
                    style={{ padding: "4px 8px", color: "#dc2626" }}
                  >
                    <Icon name="trash-2" size={12} />
                  </button>
                </div>
                <div style={{ fontSize: "0.78rem", color: "var(--muted)" }}>
                  نطاق الاستخدام: {m.visibility || "عام"}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Canned Modal */}
      {showCannedModal && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <h4 className="modal-title">
                {activeCanned ? "تعديل الرد الجاهز" : "إضافة رد جاهز جديد"}
              </h4>
              <button
                type="button"
                className="modal-close"
                onClick={() => setShowCannedModal(false)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveCanned} className="modal-body">
              <div className="form-group" style={{ marginBottom: 14 }}>
                <label
                  style={{
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    marginBottom: 4,
                    display: "block",
                  }}
                >
                  رمز الاختصار (Short Code) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: reschedule_notice"
                  value={cannedForm.short_code}
                  onChange={(e) =>
                    setCannedForm({ ...cannedForm, short_code: e.target.value })
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
                  نص الرد الكامل *
                </label>
                <textarea
                  required
                  rows={3}
                  value={cannedForm.content}
                  onChange={(e) =>
                    setCannedForm({ ...cannedForm, content: e.target.value })
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
                  onClick={() => setShowCannedModal(false)}
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

      {/* Rule Modal */}
      {showRuleModal && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <h4 className="modal-title">إنشاء قاعدة أتمتة جديدة</h4>
              <button
                type="button"
                className="modal-close"
                onClick={() => setShowRuleModal(false)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveRule} className="modal-body">
              <div className="form-group" style={{ marginBottom: 14 }}>
                <label
                  style={{
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    marginBottom: 4,
                    display: "block",
                  }}
                >
                  اسم القاعدة *
                </label>
                <input
                  type="text"
                  required
                  value={ruleForm.name}
                  onChange={(e) =>
                    setRuleForm({ ...ruleForm, name: e.target.value })
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
                  الحدث المشغل *
                </label>
                <select
                  value={ruleForm.event_name}
                  onChange={(e) =>
                    setRuleForm({ ...ruleForm, event_name: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: "1px solid var(--border)",
                  }}
                >
                  <option value="conversation_created">
                    عند إنشاء محادثة جديدة
                  </option>
                  <option value="message_created">عند وصول رسالة جديدة</option>
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
                  الإجراء المنفذ *
                </label>
                <select
                  value={ruleForm.action_type}
                  onChange={(e) =>
                    setRuleForm({ ...ruleForm, action_type: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: "1px solid var(--border)",
                  }}
                >
                  <option value="add_label">إضافة وسم (Add Label)</option>
                  <option value="resolve_conversation">
                    إغلاق المحادثة (Resolve)
                  </option>
                  <option value="send_message">إرسال رسالة آلية</option>
                </select>
              </div>
              {ruleForm.action_type === "add_label" && (
                <div className="form-group" style={{ marginBottom: 18 }}>
                  <label
                    style={{
                      fontSize: "0.82rem",
                      fontWeight: 700,
                      marginBottom: 4,
                      display: "block",
                    }}
                  >
                    اسم الوسم المراد إضافته
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: booking_inquiry"
                    value={ruleForm.action_param}
                    onChange={(e) =>
                      setRuleForm({ ...ruleForm, action_param: e.target.value })
                    }
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: 8,
                      border: "1px solid var(--border)",
                    }}
                  />
                </div>
              )}
              <div
                style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}
              >
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowRuleModal(false)}
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary"
                >
                  {submitting ? "جاري الإنشاء..." : "إنشاء القاعدة"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Macro Modal */}
      {showMacroModal && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <h4 className="modal-title">إنشاء ماكرو جديد</h4>
              <button
                type="button"
                className="modal-close"
                onClick={() => setShowMacroModal(false)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveMacro} className="modal-body">
              <div className="form-group" style={{ marginBottom: 14 }}>
                <label
                  style={{
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    marginBottom: 4,
                    display: "block",
                  }}
                >
                  اسم الماكرو *
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: إغلاق ووسم كمكتمل"
                  value={macroForm.name}
                  onChange={(e) =>
                    setMacroForm({ ...macroForm, name: e.target.value })
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
                  الإجراء الأساسي *
                </label>
                <select
                  value={macroForm.action_name}
                  onChange={(e) =>
                    setMacroForm({ ...macroForm, action_name: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: "1px solid var(--border)",
                  }}
                >
                  <option value="resolve_conversation">
                    إغلاق المحادثة (Resolve)
                  </option>
                  <option value="mute_conversation">
                    كتم الإشعارات للمحادثة
                  </option>
                </select>
              </div>
              <div
                style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}
              >
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowMacroModal(false)}
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary"
                >
                  {submitting ? "جاري الإنشاء..." : "إنشاء الماكرو"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
