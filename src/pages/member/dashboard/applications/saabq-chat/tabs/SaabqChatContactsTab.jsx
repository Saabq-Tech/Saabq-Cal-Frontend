import React, { useState, useEffect, useCallback } from "react";
import client, { endpoints } from "../../../../../../api/client";
import Icon from "../../../../../../components/common/Icon";
import { Link } from "react-router-dom";
import { useLanguage } from "../../../../../../context/LanguageContext";

export default function SaabqChatContactsTab() {
  const { t } = useLanguage();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const page = 1;

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [activeContact, setActiveContact] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone_number: "",
    identifier: "",
  });
  const [mergeeId, setMergeeId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchContacts = useCallback(() => {
    setLoading(true);
    client
      .get(endpoints.workspaceSaabqChatContacts, {
        params: { q: search || undefined, page },
      })
      .then((res) => {
        const payload = res.data?.data?.payload || res.data?.data || [];
        setContacts(Array.isArray(payload) ? payload : []);
      })
      .catch(() => {
        setContacts([]);
      })
      .finally(() => setLoading(false));
  }, [search, page]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  // Create Contact Handler
  const handleCreateContact = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    setSubmitting(true);
    try {
      await client.post(endpoints.workspaceSaabqChatContacts, formData);
      setShowCreateModal(false);
      setFormData({ name: "", email: "", phone_number: "", identifier: "" });
      fetchContacts();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create contact");
    } finally {
      setSubmitting(false);
    }
  };

  // Edit Contact Handler
  const handleUpdateContact = async (e) => {
    e.preventDefault();
    if (!activeContact?.id) return;
    setSubmitting(true);
    try {
      await client.post(
        endpoints.workspaceSaabqChatContactDetail(activeContact.id),
        formData,
      );
      setShowEditModal(false);
      fetchContacts();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update contact");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Contact Handler
  const handleDeleteContact = async (id) => {
    if (!confirm("هل أنت متأكد من رغبتك في حذف جهة الاتصال هذه نهائياً؟"))
      return;
    try {
      await client.delete(endpoints.workspaceSaabqChatContactDetail(id));
      fetchContacts();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete contact");
    }
  };

  // Merge Contacts Handler
  const handleMergeContacts = async (e) => {
    e.preventDefault();
    if (!activeContact?.id || !mergeeId) return;
    setSubmitting(true);
    try {
      await client.post(endpoints.workspaceSaabqChatContactMerge, {
        base_contact_id: activeContact.id,
        mergee_contact_id: Number(mergeeId),
      });
      setShowMergeModal(false);
      setMergeeId("");
      fetchContacts();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to merge contacts");
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (c) => {
    setActiveContact(c);
    setFormData({
      name: c.name || "",
      email: c.email || "",
      phone_number: c.phone_number || "",
      identifier: c.identifier || "",
    });
    setShowEditModal(true);
  };

  const openMerge = (c) => {
    setActiveContact(c);
    setMergeeId("");
    setShowMergeModal(true);
  };

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
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              setFormData({
                name: "",
                email: "",
                phone_number: "",
                identifier: "",
              });
              setShowCreateModal(true);
            }}
            style={{ gap: 6 }}
          >
            <Icon name="plus" size={15} />
            <span>إضافة جهة اتصال</span>
          </button>
          <Link
            to="/member/workspace/customers"
            className="btn btn-secondary"
            style={{ gap: 6 }}
          >
            <Icon name="users" size={15} />
            <span>عملاء سابق Cal</span>
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
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            textAlign: "start",
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
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  color: "var(--text-secondary)",
                }}
              >
                الاسم
              </th>
              <th
                style={{
                  padding: "12px 18px",
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  color: "var(--text-secondary)",
                }}
              >
                البريد الإلكتروني
              </th>
              <th
                style={{
                  padding: "12px 18px",
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  color: "var(--text-secondary)",
                }}
              >
                رقم الهاتف
              </th>
              <th
                style={{
                  padding: "12px 18px",
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  color: "var(--text-secondary)",
                }}
              >
                المعرف
              </th>
              <th
                style={{
                  padding: "12px 18px",
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  color: "var(--text-secondary)",
                  textAlign: "end",
                }}
              >
                الإجراءات
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={5}
                  style={{
                    padding: 40,
                    textAlign: "center",
                    color: "var(--muted)",
                  }}
                >
                  جاري تحميل جهات الاتصال...
                </td>
              </tr>
            ) : contacts.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  style={{
                    padding: 40,
                    textAlign: "center",
                    color: "var(--muted)",
                  }}
                >
                  لا توجد جهات اتصال مسجلة
                </td>
              </tr>
            ) : (
              contacts.map((c) => (
                <tr
                  key={c.id}
                  style={{ borderBottom: "1px solid var(--border)" }}
                >
                  <td style={{ padding: "12px 18px" }}>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 10 }}
                    >
                      <div
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: "50%",
                          background: "rgba(2, 105, 130, 0.1)",
                          color: "var(--primary)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 700,
                          fontSize: "0.88rem",
                        }}
                      >
                        {(c.name || "ع")[0]}
                      </div>
                      <span
                        style={{
                          fontWeight: 600,
                          fontSize: "0.88rem",
                          color: "var(--heading)",
                        }}
                      >
                        {c.name || "بدون اسم"}
                      </span>
                    </div>
                  </td>
                  <td
                    style={{
                      padding: "12px 18px",
                      fontSize: "0.84rem",
                      color: "var(--text-secondary)",
                    }}
                  >
                    {c.email || "—"}
                  </td>
                  <td
                    style={{
                      padding: "12px 18px",
                      fontSize: "0.84rem",
                      color: "var(--text-secondary)",
                    }}
                  >
                    {c.phone_number || "—"}
                  </td>
                  <td
                    style={{
                      padding: "12px 18px",
                      fontSize: "0.82rem",
                      color: "var(--muted)",
                    }}
                  >
                    {c.identifier || `#${c.id}`}
                  </td>
                  <td style={{ padding: "12px 18px", textAlign: "end" }}>
                    <div style={{ display: "inline-flex", gap: 6 }}>
                      <button
                        type="button"
                        onClick={() => openEdit(c)}
                        className="btn btn-secondary btn-sm"
                        title="تعديل"
                        style={{ padding: "5px 8px" }}
                      >
                        <Icon name="edit-2" size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => openMerge(c)}
                        className="btn btn-secondary btn-sm"
                        title="دمج جهات اتصال مكررة"
                        style={{ padding: "5px 8px" }}
                      >
                        <Icon name="git-merge" size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteContact(c.id)}
                        className="btn btn-secondary btn-sm"
                        title="حذف"
                        style={{ padding: "5px 8px", color: "#dc2626" }}
                      >
                        <Icon name="trash-2" size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create Contact Modal */}
      {showCreateModal && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <h4 className="modal-title">إضافة جهة اتصال جديدة</h4>
              <button
                type="button"
                className="modal-close"
                onClick={() => setShowCreateModal(false)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateContact} className="modal-body">
              <div className="form-group" style={{ marginBottom: 14 }}>
                <label
                  style={{
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    marginBottom: 4,
                    display: "block",
                  }}
                >
                  الاسم الكامل *
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
                  البريد الإلكتروني
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
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
                  رقم الهاتف (دولي)
                </label>
                <input
                  type="text"
                  placeholder="+966500000000"
                  value={formData.phone_number}
                  onChange={(e) =>
                    setFormData({ ...formData, phone_number: e.target.value })
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
                  المعرف الفريد (Identifier)
                </label>
                <input
                  type="text"
                  placeholder="CUST-1002"
                  value={formData.identifier}
                  onChange={(e) =>
                    setFormData({ ...formData, identifier: e.target.value })
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
                  onClick={() => setShowCreateModal(false)}
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary"
                >
                  {submitting ? "جاري الحفظ..." : "حفظ جهة الاتصال"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Contact Modal */}
      {showEditModal && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <h4 className="modal-title">تعديل بيانات جهة الاتصال</h4>
              <button
                type="button"
                className="modal-close"
                onClick={() => setShowEditModal(false)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleUpdateContact} className="modal-body">
              <div className="form-group" style={{ marginBottom: 14 }}>
                <label
                  style={{
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    marginBottom: 4,
                    display: "block",
                  }}
                >
                  الاسم الكامل *
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
                  البريد الإلكتروني
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
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
                  رقم الهاتف
                </label>
                <input
                  type="text"
                  value={formData.phone_number}
                  onChange={(e) =>
                    setFormData({ ...formData, phone_number: e.target.value })
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
                  onClick={() => setShowEditModal(false)}
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary"
                >
                  {submitting ? "جاري التحديث..." : "حفظ التغييرات"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Merge Contacts Modal */}
      {showMergeModal && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <h4 className="modal-title">دمج جهات اتصال مكررة</h4>
              <button
                type="button"
                className="modal-close"
                onClick={() => setShowMergeModal(false)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleMergeContacts} className="modal-body">
              <p
                style={{
                  fontSize: "0.82rem",
                  color: "var(--muted)",
                  margin: "0 0 14px",
                  lineHeight: 1.6,
                }}
              >
                سيتم الاحتفاظ بالسجل الأساسي ({activeContact?.name}) ونقل كافة
                المحادثات والوسوم إليه، وحذف جهة الاتصال المكررة نهائياً.
              </p>
              <div className="form-group" style={{ marginBottom: 18 }}>
                <label
                  style={{
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    marginBottom: 4,
                    display: "block",
                  }}
                >
                  اختر جهة الاتصال المراد دمجها وحذفها:
                </label>
                <select
                  required
                  value={mergeeId}
                  onChange={(e) => setMergeeId(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: "1px solid var(--border)",
                  }}
                >
                  <option value="">-- حدد جهة الاتصال المكررة --</option>
                  {contacts
                    .filter((c) => c.id !== activeContact?.id)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.email || c.phone_number || `#${c.id}`})
                      </option>
                    ))}
                </select>
              </div>
              <div
                style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}
              >
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowMergeModal(false)}
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={submitting || !mergeeId}
                  className="btn btn-primary"
                >
                  {submitting ? "جاري الدمج..." : "تأكيد الدمج"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
