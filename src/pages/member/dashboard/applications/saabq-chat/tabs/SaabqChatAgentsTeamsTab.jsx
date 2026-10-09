import React, { useState, useEffect } from "react";
import client, { endpoints } from "../../../../../../api/client";
import Icon from "../../../../../../components/common/Icon";

export default function SaabqChatAgentsTeamsTab() {
  const [activeSubTab, setActiveSubTab] = useState("agents"); // agents, teams
  const [agents, setAgents] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(false);

  // Agent Modals
  const [showAgentModal, setShowAgentModal] = useState(false);
  const [activeAgent, setActiveAgent] = useState(null);
  const [agentForm, setAgentForm] = useState({
    name: "",
    email: "",
    role: "agent",
    availability_status: "available",
  });

  // Team Modals
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [activeTeam, setActiveTeam] = useState(null);
  const [teamForm, setTeamForm] = useState({
    name: "",
    description: "",
    allow_auto_assign: true,
  });

  // Team Members Modal
  const [showTeamMembersModal, setShowTeamMembersModal] = useState(false);
  const [teamMembers, setTeamMembers] = useState([]);
  const [selectedAgentToAdd, setSelectedAgentToAdd] = useState("");

  const [submitting, setSubmitting] = useState(false);

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      client
        .get(endpoints.workspaceSaabqChatAgents)
        .catch(() => ({ data: { data: [] } })),
      client
        .get(endpoints.workspaceSaabqChatTeams)
        .catch(() => ({ data: { data: [] } })),
    ])
      .then(([agentsRes, teamsRes]) => {
        const aList =
          agentsRes.data?.data?.payload || agentsRes.data?.data || [];
        const tList = teamsRes.data?.data?.payload || teamsRes.data?.data || [];
        setAgents(Array.isArray(aList) ? aList : []);
        setTeams(Array.isArray(tList) ? tList : []);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Save Agent
  const handleSaveAgent = async (e) => {
    e.preventDefault();
    if (!agentForm.name.trim() || !agentForm.email.trim()) return;
    setSubmitting(true);
    try {
      if (activeAgent?.id) {
        await client.post(
          endpoints.workspaceSaabqChatAgentDetail(activeAgent.id),
          {
            role: agentForm.role,
            availability_status: agentForm.availability_status,
          },
        );
      } else {
        await client.post(endpoints.workspaceSaabqChatAgents, agentForm);
      }
      setShowAgentModal(false);
      setActiveAgent(null);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to save agent");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Agent
  const handleDeleteAgent = async (id) => {
    if (!confirm("هل أنت متأكد من رغبتك في إزالة هذا الوكيل؟")) return;
    try {
      await client.delete(endpoints.workspaceSaabqChatAgentDetail(id));
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete agent");
    }
  };

  // Save Team
  const handleSaveTeam = async (e) => {
    e.preventDefault();
    if (!teamForm.name.trim()) return;
    setSubmitting(true);
    try {
      if (activeTeam?.id) {
        await client.post(
          endpoints.workspaceSaabqChatTeamDetail(activeTeam.id),
          teamForm,
        );
      } else {
        await client.post(endpoints.workspaceSaabqChatTeams, teamForm);
      }
      setShowTeamModal(false);
      setActiveTeam(null);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to save team");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Team
  const handleDeleteTeam = async (id) => {
    if (!confirm("هل أنت متأكد من رغبتك في حذف هذا الفريق؟")) return;
    try {
      await client.delete(endpoints.workspaceSaabqChatTeamDetail(id));
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete team");
    }
  };

  // Open Team Members Modal
  const openTeamMembers = async (t) => {
    setActiveTeam(t);
    setShowTeamMembersModal(true);
    try {
      const res = await client.get(
        endpoints.workspaceSaabqChatTeamMembers(t.id),
      );
      const list = res.data?.data?.payload || res.data?.data || [];
      setTeamMembers(Array.isArray(list) ? list : []);
    } catch {
      setTeamMembers([]);
    }
  };

  // Add Member to Team
  const handleAddMemberToTeam = async () => {
    if (!selectedAgentToAdd || !activeTeam?.id) return;
    try {
      await client.post(
        endpoints.workspaceSaabqChatTeamMembers(activeTeam.id),
        {
          user_ids: [Number(selectedAgentToAdd)],
        },
      );
      setSelectedAgentToAdd("");
      const res = await client.get(
        endpoints.workspaceSaabqChatTeamMembers(activeTeam.id),
      );
      setTeamMembers(res.data?.data?.payload || res.data?.data || []);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to add member to team");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
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
          <button
            type="button"
            onClick={() => setActiveSubTab("agents")}
            className={
              activeSubTab === "agents"
                ? "btn btn-primary btn-sm"
                : "btn btn-secondary btn-sm"
            }
            style={{ gap: 6 }}
          >
            <Icon name="users" size={14} />
            <span>الوكلاء والموظفون ({agents.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab("teams")}
            className={
              activeSubTab === "teams"
                ? "btn btn-primary btn-sm"
                : "btn btn-secondary btn-sm"
            }
            style={{ gap: 6 }}
          >
            <Icon name="grid" size={14} />
            <span>الفرق ومجموعات التوزيع ({teams.length})</span>
          </button>
        </div>

        {activeSubTab === "agents" ? (
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => {
              setActiveAgent(null);
              setAgentForm({
                name: "",
                email: "",
                role: "agent",
                availability_status: "available",
              });
              setShowAgentModal(true);
            }}
            style={{ gap: 6 }}
          >
            <Icon name="plus" size={14} />
            <span>إضافة وكيل جديد</span>
          </button>
        ) : (
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => {
              setActiveTeam(null);
              setTeamForm({
                name: "",
                description: "",
                allow_auto_assign: true,
              });
              setShowTeamModal(true);
            }}
            style={{ gap: 6 }}
          >
            <Icon name="plus" size={14} />
            <span>إنشاء فريق جديد</span>
          </button>
        )}
      </div>

      {loading ? (
        <div
          style={{ padding: 40, textAlign: "center", color: "var(--muted)" }}
        >
          جاري التحميل...
        </div>
      ) : activeSubTab === "agents" ? (
        /* Agents Table */
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
                  الاسم
                </th>
                <th
                  style={{
                    padding: "12px 18px",
                    fontSize: "0.8rem",
                    textAlign: "start",
                  }}
                >
                  البريد الإلكتروني
                </th>
                <th
                  style={{
                    padding: "12px 18px",
                    fontSize: "0.8rem",
                    textAlign: "start",
                  }}
                >
                  الدور الصلاحي
                </th>
                <th
                  style={{
                    padding: "12px 18px",
                    fontSize: "0.8rem",
                    textAlign: "start",
                  }}
                >
                  حالة الحضور
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
              {agents.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    style={{
                      padding: 30,
                      textAlign: "center",
                      color: "var(--muted)",
                    }}
                  >
                    لا يوجد وكلاء مسجلون
                  </td>
                </tr>
              ) : (
                agents.map((a) => (
                  <tr
                    key={a.id}
                    style={{ borderBottom: "1px solid var(--border)" }}
                  >
                    <td style={{ padding: "12px 18px", fontWeight: 700 }}>
                      {a.name}
                    </td>
                    <td
                      style={{
                        padding: "12px 18px",
                        fontSize: "0.84rem",
                        color: "var(--text-secondary)",
                      }}
                    >
                      {a.email}
                    </td>
                    <td style={{ padding: "12px 18px" }}>
                      <span
                        style={{
                          fontSize: "0.72rem",
                          padding: "2px 8px",
                          borderRadius: 8,
                          background:
                            a.role === "administrator"
                              ? "#fee2e2"
                              : "rgba(2, 105, 130, 0.1)",
                          color:
                            a.role === "administrator"
                              ? "#dc2626"
                              : "var(--primary)",
                          fontWeight: 700,
                        }}
                      >
                        {a.role === "administrator"
                          ? "مدير النظام"
                          : "وكيل خدمة"}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: "12px 18px",
                        fontSize: "0.8rem",
                        color:
                          a.availability_status === "available"
                            ? "#059669"
                            : "var(--muted)",
                      }}
                    >
                      {a.availability_status || "available"}
                    </td>
                    <td style={{ padding: "12px 18px", textAlign: "end" }}>
                      <div style={{ display: "inline-flex", gap: 6 }}>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveAgent(a);
                            setAgentForm({
                              name: a.name || "",
                              email: a.email || "",
                              role: a.role || "agent",
                              availability_status:
                                a.availability_status || "available",
                            });
                            setShowAgentModal(true);
                          }}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: "4px 8px" }}
                        >
                          <Icon name="edit-2" size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteAgent(a.id)}
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
      ) : (
        /* Teams Grid */
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: 16,
          }}
        >
          {teams.length === 0 ? (
            <div
              style={{
                padding: 30,
                textAlign: "center",
                color: "var(--muted)",
                gridColumn: "1 / -1",
              }}
            >
              لا توجد فرق مسجلة
            </div>
          ) : (
            teams.map((t) => (
              <div
                key={t.id}
                style={{
                  background: "var(--surface)",
                  padding: 18,
                  borderRadius: "var(--radius-lg, 16px)",
                  border: "1px solid var(--border)",
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
                      marginBottom: 10,
                    }}
                  >
                    <h4
                      style={{ margin: 0, fontSize: "1rem", fontWeight: 800 }}
                    >
                      {t.name}
                    </h4>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        type="button"
                        onClick={() => openTeamMembers(t)}
                        className="btn btn-secondary btn-sm"
                        title="أعضاء الفريق"
                        style={{ padding: "4px 8px" }}
                      >
                        <Icon name="users" size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTeam(t);
                          setTeamForm({
                            name: t.name || "",
                            description: t.description || "",
                            allow_auto_assign: Boolean(t.allow_auto_assign),
                          });
                          setShowTeamModal(true);
                        }}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: "4px 8px" }}
                      >
                        <Icon name="edit-2" size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteTeam(t.id)}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: "4px 8px", color: "#dc2626" }}
                      >
                        <Icon name="trash-2" size={12} />
                      </button>
                    </div>
                  </div>
                  {t.description && (
                    <p
                      style={{
                        margin: "0 0 12px",
                        fontSize: "0.82rem",
                        color: "var(--text-secondary)",
                      }}
                    >
                      {t.description}
                    </p>
                  )}
                  <div style={{ fontSize: "0.78rem", color: "var(--muted)" }}>
                    التوزيع التلقائي: {t.allow_auto_assign ? "مفعّل" : "معطّل"}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Agent Modal */}
      {showAgentModal && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <h4 className="modal-title">
                {activeAgent ? "تعديل صلاحيات الوكيل" : "إضافة وكيل جديد"}
              </h4>
              <button
                type="button"
                className="modal-close"
                onClick={() => setShowAgentModal(false)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveAgent} className="modal-body">
              {!activeAgent && (
                <>
                  <div className="form-group" style={{ marginBottom: 14 }}>
                    <label
                      style={{
                        fontSize: "0.82rem",
                        fontWeight: 700,
                        marginBottom: 4,
                        display: "block",
                      }}
                    >
                      الاسم *
                    </label>
                    <input
                      type="text"
                      required
                      value={agentForm.name}
                      onChange={(e) =>
                        setAgentForm({ ...agentForm, name: e.target.value })
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
                      البريد الإلكتروني *
                    </label>
                    <input
                      type="email"
                      required
                      value={agentForm.email}
                      onChange={(e) =>
                        setAgentForm({ ...agentForm, email: e.target.value })
                      }
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        borderRadius: 8,
                        border: "1px solid var(--border)",
                      }}
                    />
                  </div>
                </>
              )}
              <div className="form-group" style={{ marginBottom: 14 }}>
                <label
                  style={{
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    marginBottom: 4,
                    display: "block",
                  }}
                >
                  الدور الصلاحي *
                </label>
                <select
                  value={agentForm.role}
                  onChange={(e) =>
                    setAgentForm({ ...agentForm, role: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: "1px solid var(--border)",
                  }}
                >
                  <option value="agent">وكيل خدمة (Agent)</option>
                  <option value="administrator">
                    مدير النظام (Administrator)
                  </option>
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
                  حالة الحضور
                </label>
                <select
                  value={agentForm.availability_status}
                  onChange={(e) =>
                    setAgentForm({
                      ...agentForm,
                      availability_status: e.target.value,
                    })
                  }
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: "1px solid var(--border)",
                  }}
                >
                  <option value="available">متاح (Available)</option>
                  <option value="busy">مشغول (Busy)</option>
                  <option value="offline">غير متصل (Offline)</option>
                </select>
              </div>
              <div
                style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}
              >
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAgentModal(false)}
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

      {/* Team Modal */}
      {showTeamModal && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <h4 className="modal-title">
                {activeTeam ? "تعديل الفريق" : "إنشاء فريق جديد"}
              </h4>
              <button
                type="button"
                className="modal-close"
                onClick={() => setShowTeamModal(false)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveTeam} className="modal-body">
              <div className="form-group" style={{ marginBottom: 14 }}>
                <label
                  style={{
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    marginBottom: 4,
                    display: "block",
                  }}
                >
                  اسم الفريق *
                </label>
                <input
                  type="text"
                  required
                  placeholder="فريق الاستشارات الفنية"
                  value={teamForm.name}
                  onChange={(e) =>
                    setTeamForm({ ...teamForm, name: e.target.value })
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
                  الوصف (اختياري)
                </label>
                <input
                  type="text"
                  value={teamForm.description}
                  onChange={(e) =>
                    setTeamForm({ ...teamForm, description: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: "1px solid var(--border)",
                  }}
                />
              </div>
              <div style={{ marginBottom: 18 }}>
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
                    checked={teamForm.allow_auto_assign}
                    onChange={(e) =>
                      setTeamForm({
                        ...teamForm,
                        allow_auto_assign: e.target.checked,
                      })
                    }
                  />
                  <span>السماح بالتوزيع التلقائي الدائري لأعضاء الفريق</span>
                </label>
              </div>
              <div
                style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}
              >
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowTeamModal(false)}
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary"
                >
                  {submitting ? "جاري الحفظ..." : "حفظ الفريق"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Team Members Modal */}
      {showTeamMembersModal && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <h4 className="modal-title">أعضاء فريق: {activeTeam?.name}</h4>
              <button
                type="button"
                className="modal-close"
                onClick={() => setShowTeamMembersModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
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
                  <option value="">-- حدد وكيلاً لإضافته للفريق --</option>
                  {agents.map((ag) => (
                    <option key={ag.id} value={ag.id}>
                      {ag.name} ({ag.email})
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleAddMemberToTeam}
                  disabled={!selectedAgentToAdd}
                  className="btn btn-primary btn-sm"
                >
                  إضافة
                </button>
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  maxHeight: 220,
                  overflowY: "auto",
                }}
              >
                {teamMembers.length === 0 ? (
                  <div
                    style={{
                      color: "var(--muted)",
                      fontSize: "0.82rem",
                      textAlign: "center",
                      padding: 20,
                    }}
                  >
                    لا يوجد أعضاء في هذا الفريق حالياً
                  </div>
                ) : (
                  teamMembers.map((m) => (
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
