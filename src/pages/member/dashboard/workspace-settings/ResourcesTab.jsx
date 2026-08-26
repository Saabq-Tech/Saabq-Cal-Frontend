import { useState } from "react";
import { createPortal } from "react-dom";
import { useLanguage } from "../../../../context/LanguageContext";
import Icon from "../../../../components/common/Icon";
import ConfirmationModal from "./ConfirmationModal";

const defaultFormState = {
  id: null,
  name: "",
  description: "",
  type: "room",
  capacity: 1,
  location: "",
  status: "active",
};

export default function ResourcesTab({
  resources,
  canEdit,
  onSaveResource,
  onDeleteResource,
}) {
  const { t, isRTL } = useLanguage();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState(defaultFormState);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: null,
    isDanger: true,
  });

  const handleOpenCreate = () => {
    setForm(defaultFormState);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (resource) => {
    setForm({
      id: resource.id,
      name: resource.name || "",
      description: resource.description || "",
      type: resource.type || "room",
      capacity: resource.capacity || 1,
      location: resource.location || "",
      status: resource.status || "active",
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (onSaveResource) {
      await onSaveResource(form);
    }
    setIsModalOpen(false);
  };

  const handleOpenDelete = (id) => {
    setConfirmModal({
      isOpen: true,
      title:
        t("confirmDeleteResource") ||
        (isRTL ? "حذف المورد" : "Delete Resource"),
      message:
        t("deleteResourceWarning") ||
        (isRTL
          ? "هل أنت متأكد من حذف هذا المورد؟ لا يمكن التراجع عن هذا الإجراء."
          : "Are you sure you want to delete this resource? This action cannot be undone."),
      isDanger: true,
      onConfirm: async () => {
        if (onDeleteResource) {
          await onDeleteResource(id);
        }
      },
    });
  };

  const resourcesList = Array.isArray(resources) ? resources : [];

  return (
    <div className="card-body">
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 14,
          marginBottom: 20,
        }}
      >
        <div>
          <h2
            style={{
              fontSize: "1.2rem",
              fontWeight: 800,
              margin: 0,
              color: "var(--heading)",
            }}
          >
            {t("workspaceResources") ||
              (isRTL ? "إدارة الموارد والقاعات" : "Workspace Resources")}
          </h2>
          <p
            style={{
              fontSize: "0.86rem",
              color: "var(--text-secondary)",
              margin: "4px 0 0",
            }}
          >
            {t("workspaceResourcesDesc") ||
              (isRTL
                ? "إضافة وإدارة قاعات الاجتماعات، المعدات، والأجهزة المتاحة في مساحة العمل."
                : "Manage meeting rooms, equipment, and assets available in the workspace.")}
          </p>
        </div>
        {canEdit && (
          <button className="btn btn-primary btn-sm" onClick={handleOpenCreate}>
            + {t("addResource") || (isRTL ? "إضافة مورد" : "Add Resource")}
          </button>
        )}
      </div>

      {/* Grid */}
      {resourcesList.length === 0 ? (
        <div
          style={{
            padding: "48px 20px",
            textAlign: "center",
            background: "var(--surface-alt)",
            borderRadius: "var(--radius-lg)",
            border: "1px dashed var(--border)",
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              background: "var(--primary-subtle)",
              color: "var(--primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 12px",
            }}
          >
            <Icon name="briefcase" size={24} />
          </div>
          <h4
            style={{
              fontSize: "1rem",
              fontWeight: 700,
              margin: "0 0 6px",
              color: "var(--heading)",
            }}
          >
            {t("noResourcesFound") ||
              (isRTL ? "لا توجد موارد مضافة حالياً" : "No resources found")}
          </h4>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fill, minmax(min(100%, 250px), 1fr))",
            gap: 18,
          }}
        >
          {resourcesList.map((r) => (
            <div
              key={r.id}
              style={{
                padding: "16px 14px",
                borderRadius: "var(--radius-lg)",
                border: "1px solid var(--border-light)",
                background: "var(--surface)",
                display: "flex",
                flexDirection: "column",
                gap: 12,
                boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
                position: "relative",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <h3
                  style={{
                    fontSize: "1.05rem",
                    fontWeight: 800,
                    margin: 0,
                    color: "var(--heading)",
                  }}
                >
                  {r.name}
                </h3>
                <span
                  style={{
                    fontSize: "0.7rem",
                    padding: "2px 8px",
                    borderRadius: 12,
                    fontWeight: 700,
                    background: r.status === "active" ? "#dcfce7" : "#f3f4f6",
                    color: r.status === "active" ? "#15803d" : "#4b5563",
                  }}
                >
                  {r.status === "active"
                    ? t("statusActive") || (isRTL ? "نشط" : "Active")
                    : t("statusInactive") || (isRTL ? "غير نشط" : "Inactive")}
                </span>
              </div>
              <p
                style={{
                  fontSize: "0.86rem",
                  color: "var(--text-secondary)",
                  margin: 0,
                }}
              >
                {r.description || (isRTL ? "لا يوجد وصف" : "No description")}
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {r.type && (
                  <span
                    style={{
                      fontSize: "0.76rem",
                      background: "var(--surface-alt)",
                      padding: "3px 9px",
                      borderRadius: 6,
                      color: "var(--text-secondary)",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <Icon name="tag" size={12} />
                    {r.type}
                  </span>
                )}
                {r.location && (
                  <span
                    style={{
                      fontSize: "0.76rem",
                      background: "var(--surface-alt)",
                      padding: "3px 9px",
                      borderRadius: 6,
                      color: "var(--text-secondary)",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <Icon name="map-pin" size={12} />
                    {r.location}
                  </span>
                )}
                {r.capacity > 1 && (
                  <span
                    style={{
                      fontSize: "0.76rem",
                      background: "var(--surface-alt)",
                      padding: "3px 9px",
                      borderRadius: 6,
                      color: "var(--text-secondary)",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <Icon name="users" size={12} />
                    {r.capacity} {t("persons") || (isRTL ? "أشخاص" : "persons")}
                  </span>
                )}
              </div>
              {canEdit && (
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    marginTop: "auto",
                    paddingTop: 12,
                    borderTop: "1px solid var(--border-light)",
                  }}
                >
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleOpenEdit(r)}
                    style={{ flex: 1 }}
                  >
                    <Icon name="edit-2" size={14} />
                    {t("edit") || (isRTL ? "تعديل" : "Edit")}
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleOpenDelete(r.id)}
                  >
                    <Icon name="trash-2" size={14} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Form Modal using React Portal */}
      {isModalOpen &&
        createPortal(
          <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}>
            <div
              className="modal-card animate-fade-in-up"
              style={{ maxWidth: 520, width: "100%" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <div>
                  <h3 className="modal-title">
                    {form.id
                      ? t("editResource") ||
                        (isRTL ? "تعديل المورد" : "Edit Resource")
                      : t("addResource") ||
                        (isRTL ? "إضافة مورد" : "Add Resource")}
                  </h3>
                  <p className="modal-subtitle">
                    {form.id
                      ? t("editResourceSubtitle") ||
                        (isRTL
                          ? "تعديل بيانات وقدرة استيعاب المورد"
                          : "Update resource details and capacity")
                      : t("addResourceSubtitle") ||
                        (isRTL
                          ? "أدخل بيانات المورد أو القاعة المتاحة للحجز"
                          : "Enter details for the new resource or room")}
                  </p>
                </div>
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() => setIsModalOpen(false)}
                >
                  <Icon name="x" size={16} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="modal-body">
                <div className="form-group">
                  <label className="form-label">
                    {t("resourceName") ||
                      (isRTL ? "اسم المورد/القاعة" : "Resource Name")}{" "}
                    <span
                      className="required"
                      style={{ color: "var(--error)" }}
                    >
                      *
                    </span>
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    placeholder={
                      isRTL ? "مثال: قاعة الاجتماعات A" : "e.g. Meeting Room A"
                    }
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">
                    {t("description") || (isRTL ? "الوصف" : "Description")}
                  </label>
                  <textarea
                    className="form-textarea"
                    rows="3"
                    placeholder={
                      isRTL
                        ? "وصف مختصر للمورد والمعدات المتاحة به..."
                        : "Brief description of resource..."
                    }
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                  />
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 16,
                  }}
                >
                  <div className="form-group">
                    <label className="form-label">
                      {t("type") || (isRTL ? "النوع" : "Type")}
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={form.type}
                      onChange={(e) =>
                        setForm({ ...form, type: e.target.value })
                      }
                      placeholder={
                        isRTL
                          ? "مثال: room أو equipment"
                          : "e.g. room, equipment"
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">
                      {t("capacity") || (isRTL ? "السعة" : "Capacity")}
                    </label>
                    <input
                      type="number"
                      className="form-input"
                      min="1"
                      value={form.capacity}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          capacity: parseInt(e.target.value, 10) || 1,
                        })
                      }
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">
                    {t("location") || (isRTL ? "الموقع" : "Location")}
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder={
                      isRTL ? "مثال: الطابق الثاني" : "e.g. 2nd Floor"
                    }
                    value={form.location}
                    onChange={(e) =>
                      setForm({ ...form, location: e.target.value })
                    }
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">
                    {t("status") || (isRTL ? "الحالة" : "Status")}
                  </label>
                  <select
                    className="form-select"
                    value={form.status}
                    onChange={(e) =>
                      setForm({ ...form, status: e.target.value })
                    }
                  >
                    <option value="active">
                      {t("active") || (isRTL ? "نشط" : "Active")}
                    </option>
                    <option value="inactive">
                      {t("inactive") || (isRTL ? "غير نشط" : "Inactive")}
                    </option>
                  </select>
                </div>
                <div
                  className="modal-actions"
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: 12,
                    marginTop: 24,
                    paddingTop: 16,
                    borderTop: "1px solid var(--border-light)",
                  }}
                >
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setIsModalOpen(false)}
                  >
                    {t("cancel") || (isRTL ? "إلغاء" : "Cancel")}
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {t("save") || (isRTL ? "حفظ" : "Save")}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body,
        )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        modalState={confirmModal}
        onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
