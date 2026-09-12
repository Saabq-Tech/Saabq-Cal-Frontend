import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../context/ToastContext";
import { useLanguage } from "../../../context/LanguageContext";
import client, { endpoints } from "../../../api/client";
import SEO from "../../../components/ui/SEO";
import { SkeletonRect } from "../../../components/ui/Skeleton";
import Icon from "../../../components/common/Icon";
import RichTextEditor from "../../../components/common/RichTextEditor";

import { usePermissions } from "../../../hooks/usePermissions";

export default function WorkspaceTemplatesPage({ embedded = false }) {
  const { user } = useAuth();
  const { isRTL } = useLanguage();
  const toast = useToast();
  const {
    isOwner,
    canCreateBookings,
    canUpdateBookings,
    canDeleteBookings,
    canUpdateSettings,
  } = usePermissions();

  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [saving, setSaving] = useState(false);

  // Preview modal
  const [previewTemplate, setPreviewTemplate] = useState(null);

  // Delete modal
  const [deletingId, setDeletingId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const canCreate = isOwner || canCreateBookings || canUpdateSettings;
  const canUpdate = isOwner || canUpdateBookings || canUpdateSettings;
  const canDelete = isOwner || canDeleteBookings || canUpdateSettings;

  const workspaceTypeId =
    user?.workspace?.workspace_type_id || user?.workspace_type_id || null;

  const loadTemplates = useCallback(async () => {
    try {
      setLoading(true);
      const res = await client.get(endpoints.workspaceTemplates);
      setTemplates(res.data?.data || []);
    } catch {
      toast.error(isRTL ? "فشل تحميل قوالب الشغل" : "Failed to load templates");
    } finally {
      setLoading(false);
    }
  }, [isRTL, toast]);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const openCreateModal = () => {
    setEditingTemplate(null);
    setName("");
    setDescription("");
    setContent("");
    setIsDefault(false);
    setShowModal(true);
  };

  const openEditModal = (item) => {
    setEditingTemplate(item);
    setName(item.name || "");
    setDescription(item.description || "");
    setContent(item.content || "");
    setIsDefault(Boolean(item.is_default));
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error(isRTL ? "اسم القالب مطلوب" : "Template name is required");
      return;
    }
    if (!content.trim()) {
      toast.error(
        isRTL ? "محتوى القالب مطلوب" : "Template content is required",
      );
      return;
    }

    try {
      setSaving(true);
      const payload = {
        name: name.trim(),
        description: description.trim() || undefined,
        content: content.trim(),
        is_default: isDefault,
      };

      if (editingTemplate) {
        await client.put(
          endpoints.workspaceTemplateItem(editingTemplate.id),
          payload,
        );
        toast.success(
          isRTL ? "اتحدث القالب بنجاح" : "Template updated successfully",
        );
      } else {
        await client.post(endpoints.workspaceTemplates, payload);
        toast.success(
          isRTL ? "اتعمل القالب بنجاح" : "Template created successfully",
        );
      }

      setShowModal(false);
      loadTemplates();
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          (isRTL ? "حصلت مشكلة في حفظ القالب" : "Failed to save template"),
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      setDeleting(true);
      await client.delete(endpoints.workspaceTemplateItem(deletingId));
      toast.success(
        isRTL ? "اتحذف القالب بنجاح" : "Template deleted successfully",
      );
      setDeletingId(null);
      loadTemplates();
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          (isRTL ? "حصلت مشكلة في حذف القالب" : "Failed to delete template"),
      );
    } finally {
      setDeleting(false);
    }
  };

  const filteredTemplates = templates.filter((t) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (t.name && t.name.toLowerCase().includes(q)) ||
      (t.description && t.description.toLowerCase().includes(q))
    );
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {!embedded && (
        <SEO
          title={
            isRTL ? "قوالب التقارير والملخصات" : "Report & Summary Templates"
          }
          noindex
        />
      )}

      {/* HEADER */}
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
          <h2
            style={{
              fontSize: "1.25rem",
              fontWeight: 800,
              margin: 0,
              color: "var(--heading)",
            }}
          >
            {isRTL ? "قوالب التقارير والملخصات" : "Report & Summary Templates"}
          </h2>
          <p
            style={{
              fontSize: "0.85rem",
              color: "var(--muted)",
              margin: "4px 0 0",
            }}
          >
            {isRTL
              ? "إدارة القوالب الجاهزة عشان تستخدمها على طول وأنت بتكتب التقارير والملخصات"
              : "Manage ready-to-use templates for reports and consultation summaries"}
          </p>
        </div>

        {canCreate && (
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={openCreateModal}
            style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
          >
            <Icon name="plus" size={16} />
            {isRTL ? "+ إضافة قالب جديد" : "+ Add Template"}
          </button>
        )}
      </div>

      {/* SEARCH BAR */}
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1, maxWidth: 400 }}>
          <span
            style={{
              position: "absolute",
              top: "50%",
              transform: "translateY(-50%)",
              [isRTL ? "right" : "left"]: 12,
              color: "var(--muted)",
              display: "flex",
            }}
          >
            <Icon name="search" size={16} />
          </span>
          <input
            type="text"
            className="form-control"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={isRTL ? "دور في القوالب..." : "Search templates..."}
            style={{
              paddingInlineStart: 38,
              height: 40,
              fontSize: "0.88rem",
            }}
          />
        </div>
      </div>

      {/* CONTENT / LIST */}
      {loading ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: 16,
          }}
        >
          <SkeletonRect height={160} />
          <SkeletonRect height={160} />
          <SkeletonRect height={160} />
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div
          className="card"
          style={{
            padding: "48px 20px",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div
            style={{
              width: 54,
              height: 54,
              borderRadius: "50%",
              background: "rgba(14, 165, 233, 0.12)",
              color: "#0284c7",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon name="file-text" size={28} />
          </div>
          <h4 style={{ margin: 0, fontWeight: 700, color: "var(--heading)" }}>
            {search
              ? isRTL
                ? "مفيش قوالب مطابقة لبحثك"
                : "No templates match your search"
              : isRTL
                ? "مفيش قوالب مضافة لسه"
                : "No templates added yet"}
          </h4>
          <p
            style={{
              margin: 0,
              color: "var(--muted)",
              fontSize: "0.85rem",
              maxWidth: 420,
            }}
          >
            {isRTL
              ? "اعمل قوالب جاهزة (زي تقرير الجلسة، ملخص الاستشارة) عشان تسرّع وتسهّل شغل فريقك."
              : "Create standardized templates (such as session reports or consultation summaries) to streamline your team's workflow."}
          </p>
          {canCreate && !search && (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={openCreateModal}
              style={{ marginTop: 8 }}
            >
              {isRTL ? "اعمل أول قالب دلوقتي" : "Create First Template"}
            </button>
          )}
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: 16,
          }}
        >
          {filteredTemplates.map((item) => (
            <div
              key={item.id}
              className="card"
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                padding: 18,
                border: "1px solid var(--border-light)",
                borderRadius: "var(--radius-lg)",
                background: "var(--surface)",
                boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
              }}
            >
              <div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: 10,
                    marginBottom: 8,
                  }}
                >
                  <h4
                    style={{
                      fontSize: "1rem",
                      fontWeight: 700,
                      margin: 0,
                      color: "var(--heading)",
                    }}
                  >
                    {item.name}
                  </h4>
                  {item.is_default && (
                    <span
                      className="profile-badge verified"
                      style={{
                        fontSize: "0.72rem",
                        padding: "3px 8px",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {isRTL ? "افتراضي" : "Default"}
                    </span>
                  )}
                </div>

                {item.description && (
                  <p
                    style={{
                      fontSize: "0.83rem",
                      color: "var(--muted)",
                      margin: "0 0 12px",
                      lineHeight: 1.5,
                    }}
                  >
                    {item.description}
                  </p>
                )}
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingTop: 14,
                  borderTop: "1px solid var(--border-light)",
                  marginTop: 14,
                  gap: 8,
                  flexWrap: "wrap",
                }}
              >
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setPreviewTemplate(item)}
                  style={{
                    fontSize: "0.78rem",
                    padding: "5px 10px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                  }}
                >
                  <Icon name="eye" size={13} />
                  {isRTL ? "معاينة" : "Preview"}
                </button>

                {(canUpdate || canDelete) && (
                  <div style={{ display: "flex", gap: 6 }}>
                    {canUpdate && (
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => openEditModal(item)}
                        style={{
                          fontSize: "0.78rem",
                          padding: "5px 10px",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 5,
                        }}
                      >
                        <Icon name="edit" size={13} />
                        {isRTL ? "تعديل" : "Edit"}
                      </button>
                    )}
                    {canDelete && (
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        onClick={() => setDeletingId(item.id)}
                        style={{
                          fontSize: "0.78rem",
                          padding: "5px 10px",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 5,
                        }}
                      >
                        <Icon name="trash" size={13} />
                        {isRTL ? "حذف" : "Delete"}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {showModal &&
        createPortal(
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0, 0, 0, 0.65)",
              backdropFilter: "blur(4px)",
              WebkitBackdropFilter: "blur(4px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 999999,
              padding: 16,
            }}
            onClick={() => !saving && setShowModal(false)}
          >
            <div
              style={{
                background: "var(--surface)",
                borderRadius: "var(--radius-lg)",
                width: "100%",
                maxWidth: 780,
                maxHeight: "92vh",
                overflowY: "auto",
                boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
                display: "block",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "16px 20px",
                  borderBottom: "1px solid var(--border-light)",
                  width: "100%",
                  boxSizing: "border-box",
                }}
              >
                <h3
                  style={{
                    margin: 0,
                    fontSize: "1.1rem",
                    fontWeight: 800,
                    color: "var(--heading)",
                  }}
                >
                  {editingTemplate
                    ? isRTL
                      ? "تعديل القالب"
                      : "Edit Template"
                    : isRTL
                      ? "إضافة قالب جديد"
                      : "Add New Template"}
                </h3>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setShowModal(false)}
                  disabled={saving}
                  style={{ padding: "4px 8px" }}
                >
                  ✕
                </button>
              </div>

              <form
                onSubmit={handleSave}
                style={{
                  padding: 20,
                  display: "block",
                  width: "100%",
                  boxSizing: "border-box",
                }}
              >
                <div style={{ marginBottom: 16 }}>
                  <label
                    className="form-label"
                    style={{
                      fontWeight: 700,
                      fontSize: "0.85rem",
                      marginBottom: 6,
                    }}
                  >
                    {isRTL ? "اسم القالب *" : "Template Name *"}
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={
                      isRTL
                        ? "مثال: تقرير استشارة عام / ملخص ميعاد"
                        : "e.g. Consultation Report / Appointment Summary"
                    }
                    required
                  />
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label
                    className="form-label"
                    style={{
                      fontWeight: 700,
                      fontSize: "0.85rem",
                      marginBottom: 6,
                    }}
                  >
                    {isRTL ? "وصف مختصر" : "Short Description"}
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={
                      isRTL
                        ? "وصف لاستخدام القالب ده"
                        : "Brief description for this template"
                    }
                  />
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label
                    className="form-label"
                    style={{
                      fontWeight: 700,
                      fontSize: "0.85rem",
                      marginBottom: 6,
                    }}
                  >
                    {isRTL ? "محتوى القالب *" : "Template Content *"}
                  </label>
                  <RichTextEditor
                    value={content}
                    onChange={setContent}
                    enableKeywords={true}
                    enablePrint={true}
                    workspaceTypeId={workspaceTypeId}
                    minHeight="260px"
                    placeholder={
                      isRTL
                        ? "اكتب أو صمم شكل القالب..."
                        : "Design template content..."
                    }
                  />
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 16,
                  }}
                >
                  <input
                    type="checkbox"
                    id="template_is_default"
                    checked={isDefault}
                    onChange={(e) => setIsDefault(e.target.checked)}
                    style={{ width: 16, height: 16, cursor: "pointer" }}
                  />
                  <label
                    htmlFor="template_is_default"
                    style={{
                      fontSize: "0.88rem",
                      fontWeight: 600,
                      cursor: "pointer",
                      margin: 0,
                    }}
                  >
                    {isRTL
                      ? "تعيين كقالب افتراضي لمساحة العمل"
                      : "Set as default template for this workspace"}
                  </label>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: 10,
                    marginTop: 10,
                    paddingTop: 16,
                    borderTop: "1px solid var(--border-light)",
                  }}
                >
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setShowModal(false)}
                    disabled={saving}
                  >
                    {isRTL ? "إلغاء" : "Cancel"}
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary btn-sm"
                    disabled={saving}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    {saving && (
                      <span className="spinner-border spinner-border-sm" />
                    )}
                    {isRTL ? "حفظ القالب" : "Save Template"}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body,
        )}

      {/* PREVIEW MODAL */}
      {previewTemplate &&
        createPortal(
          <div
            className="modal-backdrop"
            onClick={() => setPreviewTemplate(null)}
          >
            <div
              className="modal-dialog card"
              onClick={(e) => e.stopPropagation()}
              style={{
                maxWidth: 720,
                width: "100%",
                maxHeight: "90vh",
                display: "block",
                padding: 0,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "16px 20px",
                  borderBottom: "1px solid var(--border-light)",
                }}
              >
                <h3
                  style={{
                    margin: 0,
                    fontSize: "1.1rem",
                    fontWeight: 800,
                    color: "var(--heading)",
                  }}
                >
                  {previewTemplate.name}
                </h3>
                <button
                  type="button"
                  className="btn btn-icon btn-ghost btn-sm"
                  onClick={() => setPreviewTemplate(null)}
                >
                  <Icon name="x" size={18} />
                </button>
              </div>

              <div
                style={{
                  padding: 24,
                  overflowY: "auto",
                  flex: 1,
                }}
              >
                <div
                  dangerouslySetInnerHTML={{ __html: previewTemplate.content }}
                  style={{
                    fontSize: "0.92rem",
                    lineHeight: 1.7,
                    color: "var(--text-main)",
                  }}
                />
              </div>

              <div
                style={{
                  padding: "12px 20px",
                  borderTop: "1px solid var(--border-light)",
                  display: "flex",
                  justifyContent: "flex-end",
                }}
              >
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setPreviewTemplate(null)}
                >
                  {isRTL ? "إغلاق" : "Close"}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* CONFIRM DELETE MODAL */}
      {Boolean(deletingId) &&
        createPortal(
          <div
            className="modal-backdrop"
            onClick={() => setDeletingId(null)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0, 0, 0, 0.6)",
              backdropFilter: "blur(4px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 9999,
              padding: 16,
            }}
          >
            <div
              className="card"
              onClick={(e) => e.stopPropagation()}
              style={{
                maxWidth: 440,
                width: "100%",
                padding: 24,
                display: "flex",
                flexDirection: "column",
                gap: 16,
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  background: "rgba(239, 68, 68, 0.12)",
                  color: "#ef4444",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon name="trash" size={24} />
              </div>
              <h3
                style={{
                  margin: 0,
                  fontSize: "1.1rem",
                  fontWeight: 800,
                  color: "var(--heading)",
                }}
              >
                {isRTL ? "تأكيد حذف القالب" : "Confirm Template Deletion"}
              </h3>
              <p
                style={{
                  margin: 0,
                  color: "var(--muted)",
                  fontSize: "0.88rem",
                  lineHeight: 1.5,
                }}
              >
                {isRTL
                  ? "متأكد إنك عايز تحذف القالب ده؟ مش هتتأثر التقارير والملخصات اللي اتعملت بيه قبل كده."
                  : "Are you sure you want to delete this template? Existing reports and summaries created using it will not be affected."}
              </p>
              <div
                style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}
              >
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setDeletingId(null)}
                  disabled={deleting}
                >
                  {isRTL ? "إلغاء" : "Cancel"}
                </button>
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  onClick={handleDelete}
                  disabled={deleting}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  {deleting && (
                    <span className="spinner-border spinner-border-sm" />
                  )}
                  {isRTL ? "تأكيد الحذف" : "Delete"}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
