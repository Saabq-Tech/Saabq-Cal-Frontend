import React, { useState, useEffect } from "react";
import client, { endpoints } from "../../../../../../api/client";
import Icon from "../../../../../../components/common/Icon";

export default function SaabqChatSlaTab() {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [activePolicy, setActivePolicy] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    first_response_time_threshold: 900, // 15 mins
    resolution_time_threshold: 86400, // 24 hours
    only_during_business_hours: true,
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchPolicies = () => {
    setLoading(true);
    client
      .get(endpoints.workspaceSaabqChatSlaPolicies)
      .then((res) => {
        const list = res.data?.data?.payload || res.data?.data || [];
        setPolicies(Array.isArray(list) ? list : []);
      })
      .catch(() => setPolicies([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPolicies();
  }, []);

  const handleSavePolicy = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    setSubmitting(true);
    try {
      if (activePolicy?.id) {
        await client.post(
          endpoints.workspaceSaabqChatSlaPolicyDetail(activePolicy.id),
          formData,
        );
      } else {
        await client.post(endpoints.workspaceSaabqChatSlaPolicies, formData);
      }
      setShowModal(false);
      setActivePolicy(null);
      fetchPolicies();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to save SLA policy");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePolicy = async (id) => {
    if (!confirm("هل أنت متأكد من رغبتك في حذف سياسة SLA هذه؟")) return;
    try {
      await client.delete(endpoints.workspaceSaabqChatSlaPolicyDetail(id));
      fetchPolicies();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete SLA policy");
    }
  };

  const openCreate = () => {
    setActivePolicy(null);
    setFormData({
      name: "",
      description: "",
      first_response_time_threshold: 900,
      resolution_time_threshold: 86400,
      only_during_business_hours: true,
    });
    setShowModal(true);
  };

  const openEdit = (p) => {
    setActivePolicy(p);
    setFormData({
      name: p.name || "",
      description: p.description || "",
      first_response_time_threshold: p.first_response_time_threshold || 900,
      resolution_time_threshold: p.resolution_time_threshold || 86400,
      only_during_business_hours: Boolean(p.only_during_business_hours),
    });
    setShowModal(true);
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
            اتفاقيات مستوى الخدمة (SLA Policies)
          </h3>
          <p
            style={{
              margin: 0,
              fontSize: "0.86rem",
              color: "var(--text-secondary)",
            }}
          >
            تحديد معايير سرعة الاستجابة الأولى وحل استفسارات العملاء في المواعيد
            المحددة
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={openCreate}
          style={{ gap: 6 }}
        >
          <Icon name="plus" size={15} />
          <span>إنشاء سياسة SLA</span>
        </button>
      </div>

      {loading ? (
        <div
          style={{ padding: 40, textAlign: "center", color: "var(--muted)" }}
        >
          جاري التحميل...
        </div>
      ) : policies.length === 0 ? (
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
          لا توجد سياسات SLA مسجلة حالياً
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: 18,
          }}
        >
          {policies.map((p) => {
            const firstRespMin = Math.round(
              (p.first_response_time_threshold || 0) / 60,
            );
            const resolHours = Math.round(
              (p.resolution_time_threshold || 0) / 3600,
            );

            return (
              <div
                key={p.id}
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
                        }}
                      >
                        {p.name}
                      </h4>
                      <span
                        style={{
                          fontSize: "0.72rem",
                          padding: "2px 8px",
                          borderRadius: 12,
                          background: p.only_during_business_hours
                            ? "rgba(16, 185, 129, 0.1)"
                            : "rgba(107, 114, 128, 0.1)",
                          color: p.only_during_business_hours
                            ? "#059669"
                            : "var(--muted)",
                          fontWeight: 700,
                        }}
                      >
                        {p.only_during_business_hours
                          ? "أوقات العمل فقط"
                          : "24/7 طوال الوقت"}
                      </span>
                    </div>

                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        type="button"
                        onClick={() => openEdit(p)}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: "4px 8px" }}
                      >
                        <Icon name="edit-2" size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeletePolicy(p.id)}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: "4px 8px", color: "#dc2626" }}
                      >
                        <Icon name="trash-2" size={13} />
                      </button>
                    </div>
                  </div>

                  {p.description && (
                    <p
                      style={{
                        margin: "0 0 14px",
                        fontSize: "0.82rem",
                        color: "var(--text-secondary)",
                      }}
                    >
                      {p.description}
                    </p>
                  )}

                  <div
                    style={{
                      background: "var(--surface-subtle, rgba(0,0,0,0.02))",
                      padding: 12,
                      borderRadius: 8,
                      border: "1px solid var(--border)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: "0.8rem",
                        marginBottom: 6,
                      }}
                    >
                      <span style={{ color: "var(--muted)" }}>
                        زمن أول استجابة:
                      </span>
                      <span
                        style={{ fontWeight: 700, color: "var(--primary)" }}
                      >
                        {firstRespMin} دقيقة
                      </span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: "0.8rem",
                      }}
                    >
                      <span style={{ color: "var(--muted)" }}>
                        زمن الإغلاق المستهدف:
                      </span>
                      <span
                        style={{ fontWeight: 700, color: "var(--heading)" }}
                      >
                        {resolHours} ساعة
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <h4 className="modal-title">
                {activePolicy ? "تعديل سياسة SLA" : "إنشاء سياسة SLA جديدة"}
              </h4>
              <button
                type="button"
                className="modal-close"
                onClick={() => setShowModal(false)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSavePolicy} className="modal-body">
              <div className="form-group" style={{ marginBottom: 14 }}>
                <label
                  style={{
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    marginBottom: 4,
                    display: "block",
                  }}
                >
                  اسم السياسة *
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: سياسة الدعم القياسي"
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
                  الوصف (اختياري)
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
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
                  حد أول استجابة (بالثواني - 900 ثانية = 15 دقيقة)
                </label>
                <input
                  type="number"
                  min="60"
                  value={formData.first_response_time_threshold}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      first_response_time_threshold: Number(e.target.value),
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
                  حد حل المحادثة (بالثواني - 86400 ثانية = 24 ساعة)
                </label>
                <input
                  type="number"
                  min="3600"
                  value={formData.resolution_time_threshold}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      resolution_time_threshold: Number(e.target.value),
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
                    checked={formData.only_during_business_hours}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        only_during_business_hours: e.target.checked,
                      })
                    }
                  />
                  <span>احتساب المهلة ضمن ساعات العمل المحددة فقط</span>
                </label>
              </div>

              <div
                style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}
              >
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary"
                >
                  {submitting ? "جاري الحفظ..." : "حفظ السياسة"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
