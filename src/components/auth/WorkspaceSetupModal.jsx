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
        className="modal-card animate-fade-in-up"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-setup-title"
        aria-describedby="modal-setup-desc"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <h2 id="modal-setup-title" className="modal-title">
              {t("setupWorkspaceTitle", "إعداد مساحة العمل الخاصة بك")}
            </h2>
            <p id="modal-setup-desc" className="modal-subtitle">
              {t(
                "setupWorkspaceDesc",
                "يرجى إدخال اسم وتفاصيل مساحة العمل لإكمال تسجيل الدخول عبر Google.",
              )}
            </p>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label={t("close") || "إغلاق"}
          >
            <Icon name="x" size={16} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="modal-body">
          <div className="form-group">
            <label htmlFor="ws-setup-name" className="form-label">
              {t("workspaceName", "اسم مساحة العمل")} *
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
                if (setWorkspaceErrors)
                  setWorkspaceErrors({
                    ...workspaceErrors,
                    workspace_name: null,
                  });
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
              {t("workspaceSlug", "رابط مساحة العمل (Slug)")}
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
                if (setWorkspaceErrors)
                  setWorkspaceErrors({
                    ...workspaceErrors,
                    workspace_slug: null,
                  });
              }}
              aria-describedby={
                getFieldError("workspace_slug")
                  ? "ws-setup-slug-error"
                  : undefined
              }
            />
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
              {t("workspaceType", "تصنيف مساحة العمل")}
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
                if (setWorkspaceErrors)
                  setWorkspaceErrors({
                    ...workspaceErrors,
                    workspace_type_id: null,
                  });
              }}
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
              {t("phoneNumber", "رقم الهاتف")}
            </label>
            <input
              id="ws-setup-phone"
              type="tel"
              className={`form-input${getFieldError("phone") ? " is-invalid" : ""}`}
              placeholder="05XXXXXXXX"
              value={workspaceData.phone || ""}
              onChange={(e) => {
                setWorkspaceData({ ...workspaceData, phone: e.target.value });
                if (setWorkspaceErrors)
                  setWorkspaceErrors({ ...workspaceErrors, phone: null });
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
              className="btn btn-secondary btn-sm"
              onClick={onClose}
            >
              {t("cancel", "إلغاء")}
            </button>
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span
                    className="spinner spinner-sm"
                    style={{ borderTopColor: "#fff" }}
                    aria-hidden="true"
                  />
                  {t("saving", "جاري الحفظ...")}
                </>
              ) : (
                t("createWorkspaceAndContinue", "إنشاء مساحة العمل والمتابعة")
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
