import { useEffect } from "react";
import { createPortal } from "react-dom";
import { useLanguage } from "../../context/LanguageContext";
import Icon from "../common/Icon";

export default function WorkspaceSetupModal({
  show,
  onClose,
  onSubmit,
  workspaceData,
  setWorkspaceData,
  workspaceErrors,
  setWorkspaceErrors,
  workspaceTypes,
  loading,
}) {
  const { t } = useLanguage();

  // Close modal on Escape key
  useEffect(() => {
    if (!show) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [show, onClose]);

  if (!show) return null;

  const getFieldError = (field) => {
    if (!workspaceErrors || !workspaceErrors[field]) return null;
    const err = workspaceErrors[field];
    return Array.isArray(err) ? err[0] : err;
  };

  return createPortal(
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-card workspace-setup-modal animate-fade-in-up"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-setup-title"
        aria-describedby="modal-setup-desc"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="workspace-setup-header">
          <div className="workspace-setup-icon-badge" aria-hidden="true">
            <Icon name="calendar" size={24} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 id="modal-setup-title" className="modal-title">
              {t("setupWorkspaceTitle", "إعداد مساحة العمل الخاصة بك")}
            </h2>
            <p id="modal-setup-desc" className="modal-subtitle">
              {t(
                "setupWorkspaceDesc",
                "يرجى كتابة اسم وتفاصيل مساحة العمل لإكمال تسجيل الدخول بحساب Google.",
              )}
            </p>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label={t("close") || "إغلاق"}
          >
            <Icon name="x" size={18} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="modal-body">
          <div className="form-group">
            <label htmlFor="ws-setup-name" className="form-label">
              <span>{t("workspaceName", "اسم مساحة العمل")}</span>
              <span className="badge-required">* {t("required", "مطلوب")}</span>
            </label>
            <input
              id="ws-setup-name"
              type="text"
              className={`form-input${getFieldError("workspace_name") ? " is-invalid" : ""}`}
              placeholder={t(
                "workspaceNamePlaceholder",
                "مثال: شركة سابق التقنية",
              )}
              value={workspaceData.workspace_name || ""}
              onChange={(e) => {
                setWorkspaceData({
                  ...workspaceData,
                  workspace_name: e.target.value,
                });
                if (setWorkspaceErrors) {
                  setWorkspaceErrors({
                    ...workspaceErrors,
                    workspace_name: null,
                  });
                }
              }}
              required
              aria-required="true"
              aria-describedby={
                getFieldError("workspace_name")
                  ? "ws-setup-name-error"
                  : undefined
              }
              autoFocus
            />
            {getFieldError("workspace_name") && (
              <span
                id="ws-setup-name-error"
                className="form-error"
                role="alert"
              >
                {getFieldError("workspace_name")}
              </span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="ws-setup-slug" className="form-label">
              <span>{t("workspaceSlug", "رابط مساحة العمل (Slug)")}</span>
              <span className="badge-optional">
                ({t("optional", "اختياري")})
              </span>
            </label>
            <input
              id="ws-setup-slug"
              type="text"
              className={`form-input${getFieldError("workspace_slug") ? " is-invalid" : ""}`}
              placeholder={t("workspaceSlugPlaceholder", "مثال: saabq-tech")}
              value={workspaceData.workspace_slug || ""}
              onChange={(e) => {
                setWorkspaceData({
                  ...workspaceData,
                  workspace_slug: e.target.value,
                });
                if (setWorkspaceErrors) {
                  setWorkspaceErrors({
                    ...workspaceErrors,
                    workspace_slug: null,
                  });
                }
              }}
              aria-describedby={
                getFieldError("workspace_slug")
                  ? "ws-setup-slug-error"
                  : undefined
              }
            />
            <div className="slug-preview-box">
              <Icon name="link" size={14} />
              <span>cal.saabq.com/</span>
              <code>
                {workspaceData.workspace_slug
                  ? workspaceData.workspace_slug
                      .toLowerCase()
                      .replace(/[^a-z0-9-_]/g, "")
                  : "your-workspace"}
              </code>
            </div>
            {getFieldError("workspace_slug") && (
              <span
                id="ws-setup-slug-error"
                className="form-error"
                role="alert"
              >
                {getFieldError("workspace_slug")}
              </span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="ws-setup-type" className="form-label">
              <span>{t("workspaceType", "تصنيف مساحة العمل")}</span>
              <span className="badge-required">* {t("required", "مطلوب")}</span>
            </label>
            <select
              id="ws-setup-type"
              className={`form-select${getFieldError("workspace_type_id") ? " is-invalid" : ""}`}
              value={workspaceData.workspace_type_id || ""}
              onChange={(e) => {
                setWorkspaceData({
                  ...workspaceData,
                  workspace_type_id: e.target.value,
                });
                if (setWorkspaceErrors) {
                  setWorkspaceErrors({
                    ...workspaceErrors,
                    workspace_type_id: null,
                  });
                }
              }}
              required
              aria-required="true"
              aria-describedby={
                getFieldError("workspace_type_id")
                  ? "ws-setup-type-error"
                  : undefined
              }
            >
              <option value="">
                -- {t("selectWorkspaceType", "اختر نوع مساحة العمل")} --
              </option>
              {workspaceTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
            {getFieldError("workspace_type_id") && (
              <span
                id="ws-setup-type-error"
                className="form-error"
                role="alert"
              >
                {getFieldError("workspace_type_id")}
              </span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="ws-setup-phone" className="form-label">
              <span>{t("phoneNumber", "رقم التليفون")}</span>
              <span className="badge-optional">
                ({t("optional", "اختياري")})
              </span>
            </label>
            <input
              id="ws-setup-phone"
              type="tel"
              className={`form-input${getFieldError("phone") ? " is-invalid" : ""}`}
              placeholder="01XXXXXXXXX"
              value={workspaceData.phone || ""}
              onChange={(e) => {
                setWorkspaceData({ ...workspaceData, phone: e.target.value });
                if (setWorkspaceErrors) {
                  setWorkspaceErrors({ ...workspaceErrors, phone: null });
                }
              }}
              aria-describedby={
                getFieldError("phone") ? "ws-setup-phone-error" : undefined
              }
            />
            {getFieldError("phone") && (
              <span
                id="ws-setup-phone-error"
                className="form-error"
                role="alert"
              >
                {getFieldError("phone")}
              </span>
            )}
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              {t("cancel", "إلغاء")}
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ minWidth: 160 }}
            >
              {loading ? (
                <>
                  <span
                    className="spinner spinner-sm"
                    style={{ borderTopColor: "#fff" }}
                    aria-hidden="true"
                  />
                  <span>{t("saving", "جاري الحفظ...")}</span>
                </>
              ) : (
                <span>
                  {t(
                    "createWorkspaceAndContinue",
                    "إنشاء مساحة العمل والمتابعة",
                  )}
                </span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
