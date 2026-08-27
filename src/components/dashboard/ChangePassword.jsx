import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { useLanguage } from "../../context/LanguageContext";
import Icon from "../common/Icon";

export default function ChangePassword() {
  const { updatePassword, loading } = useAuth();
  const { t } = useLanguage();
  const toast = useToast();

  useEffect(() => {
    document.title = t("pageTitleChangePassword");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [formData, setFormData] = useState({
    current_password: "",
    password: "",
    password_confirmation: "",
  });
  const [errors, setErrors] = useState({});
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    if (formData.password !== formData.password_confirmation) {
      setErrors({ password_confirmation: ["Passwords do not match"] });
      return;
    }

    if (formData.password.length < 8) {
      setErrors({ password: ["Password must be at least 8 characters"] });
      return;
    }

    const result = await updatePassword({
      current_password: formData.current_password,
      password: formData.password,
      password_confirmation: formData.password_confirmation,
    });

    if (result.success) {
      toast.success(result.message || "Password changed successfully");
      setFormData({
        current_password: "",
        password: "",
        password_confirmation: "",
      });
    } else {
      setErrors(result.errors || {});
      toast.error(result.message || "Failed to change password");
    }
  };

  return (
    <div className="card animate-fade-in-up">
      <div className="card-header">
        <h2 className="card-title">{t("changePassword")}</h2>
        <p className="card-subtitle">{t("changePasswordDesc")}</p>
      </div>

      <form className="card-body" onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label" htmlFor="current_password">
            {t("currentPassword")}
          </label>
          <div
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
            }}
          >
            <input
              id="current_password"
              type={showCurrentPassword ? "text" : "password"}
              name="current_password"
              className={`form-input${errors.current_password ? " is-invalid" : ""}`}
              value={formData.current_password}
              onChange={handleChange}
              required
              autoComplete="current-password"
              placeholder={t("enterCurrentPassword")}
              style={{ paddingInlineEnd: 44 }}
            />
            <button
              type="button"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              aria-label={
                showCurrentPassword
                  ? t("hidePassword") || "إخفاء كلمة المرور"
                  : t("showPassword") || "إظهار كلمة المرور"
              }
              title={
                showCurrentPassword
                  ? t("hidePassword") || "إخفاء كلمة المرور"
                  : t("showPassword") || "إظهار كلمة المرور"
              }
              style={{
                position: "absolute",
                top: "50%",
                transform: "translateY(-50%)",
                insetInlineEnd: 10,
                background: "none",
                border: "none",
                color: "var(--text-secondary, #64748b)",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 6,
                borderRadius: 6,
                transition: "color 0.2s",
              }}
            >
              <Icon name={showCurrentPassword ? "eye-off" : "eye"} size={18} />
            </button>
          </div>
          {errors.current_password && (
            <span className="form-error">{errors.current_password[0]}</span>
          )}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="new_password">
            {t("newPassword")}
          </label>
          <div
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
            }}
          >
            <input
              id="new_password"
              type={showNewPassword ? "text" : "password"}
              name="password"
              className={`form-input${errors.password ? " is-invalid" : ""}`}
              value={formData.password}
              onChange={handleChange}
              required
              minLength={8}
              autoComplete="new-password"
              placeholder={t("atLeast8Chars")}
              style={{ paddingInlineEnd: 44 }}
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              aria-label={
                showNewPassword
                  ? t("hidePassword") || "إخفاء كلمة المرور"
                  : t("showPassword") || "إظهار كلمة المرور"
              }
              title={
                showNewPassword
                  ? t("hidePassword") || "إخفاء كلمة المرور"
                  : t("showPassword") || "إظهار كلمة المرور"
              }
              style={{
                position: "absolute",
                top: "50%",
                transform: "translateY(-50%)",
                insetInlineEnd: 10,
                background: "none",
                border: "none",
                color: "var(--text-secondary, #64748b)",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 6,
                borderRadius: 6,
                transition: "color 0.2s",
              }}
            >
              <Icon name={showNewPassword ? "eye-off" : "eye"} size={18} />
            </button>
          </div>
          {errors.password && (
            <span className="form-error">{errors.password[0]}</span>
          )}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="confirm_password">
            {t("confirmNewPassword")}
          </label>
          <div
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
            }}
          >
            <input
              id="confirm_password"
              type={showConfirmPassword ? "text" : "password"}
              name="password_confirmation"
              className={`form-input${errors.password_confirmation ? " is-invalid" : ""}`}
              value={formData.password_confirmation}
              onChange={handleChange}
              required
              minLength={8}
              autoComplete="new-password"
              placeholder={t("repeatNewPassword")}
              style={{ paddingInlineEnd: 44 }}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              aria-label={
                showConfirmPassword
                  ? t("hidePassword") || "إخفاء كلمة المرور"
                  : t("showPassword") || "إظهار كلمة المرور"
              }
              title={
                showConfirmPassword
                  ? t("hidePassword") || "إخفاء كلمة المرور"
                  : t("showPassword") || "إظهار كلمة المرور"
              }
              style={{
                position: "absolute",
                top: "50%",
                transform: "translateY(-50%)",
                insetInlineEnd: 10,
                background: "none",
                border: "none",
                color: "var(--text-secondary, #64748b)",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 6,
                borderRadius: 6,
                transition: "color 0.2s",
              }}
            >
              <Icon name={showConfirmPassword ? "eye-off" : "eye"} size={18} />
            </button>
          </div>
          {errors.password_confirmation && (
            <span className="form-error">
              {errors.password_confirmation[0]}
            </span>
          )}
        </div>

        <div
          style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}
        >
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? (
              <>
                <span
                  className="spinner spinner-sm"
                  style={{ borderTopColor: "#fff" }}
                />
                {t("saving")}
              </>
            ) : (
              t("updatePasswordBtn")
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
