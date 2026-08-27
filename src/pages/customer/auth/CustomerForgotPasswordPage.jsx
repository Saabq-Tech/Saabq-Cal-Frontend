import { useState, useEffect } from "react";
import {
  Link,
  useNavigate,
  useLocation,
  useSearchParams,
} from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../context/ToastContext";
import { useLanguage } from "../../../context/LanguageContext";
import AuthCardLayout from "../../../components/auth/AuthCardLayout";
import SEO from "../../../components/ui/SEO";
import Icon from "../../../components/common/Icon";

export default function CustomerForgotPasswordPage() {
  const { forgotPassword, resetPassword, loading } = useAuth();
  const { t } = useLanguage();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const userType = "customer";
  const emailFromParams =
    searchParams.get("email") || location.state?.email || "";
  const otpFromParams =
    searchParams.get("otp") ||
    searchParams.get("code") ||
    searchParams.get("token") ||
    "";

  const [email, setEmail] = useState(emailFromParams);
  const [sent, setSent] = useState(Boolean(emailFromParams));
  const [otp, setOtp] = useState(otpFromParams);
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [errors, setErrors] = useState({});
  const [resending, setResending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    document.title = sent
      ? t("resetPasswordTitle")
      : t("pageTitleForgotPassword");
  }, [sent, t]);

  const handleSendCode = async (e) => {
    e.preventDefault();
    setErrors({});

    const result = await forgotPassword(userType, email);

    if (result.success) {
      setSent(true);
      toast.success(result.message || t("resetLinkSent"));
    } else {
      setErrors(result.errors || {});
      toast.error(result.message || t("failedToSendResetCode"));
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setErrors({});

    if (!otp || otp.length < 4) {
      toast.error(t("enterValidOtpCode"));
      return;
    }

    if (password !== passwordConfirmation) {
      const msg = t("passwordsDoNotMatch");
      setErrors({ password_confirmation: [msg] });
      toast.error(msg);
      return;
    }

    const result = await resetPassword(userType, {
      email,
      otp,
      password,
      password_confirmation: passwordConfirmation,
    });

    if (result.success) {
      toast.success(result.message || t("passwordResetSuccess"));
      navigate("/customer/login", { replace: true, state: { email } });
    } else {
      setErrors(result.errors || {});
      toast.error(result.message || "Failed to reset password");
    }
  };

  const handleResend = async () => {
    setResending(true);
    const result = await forgotPassword(userType, email);
    setResending(false);

    if (result.success) {
      toast.success(result.message || t("codeResent"));
    } else {
      toast.error(result.message || t("failedToSendResetCode"));
    }
  };

  return (
    <AuthCardLayout
      illustration="/images/forgot-password.svg"
      illustrationAlt={t("pageTitleForgotPassword")}
    >
      <SEO
        title={sent ? t("resetPasswordTitle") : t("pageTitleForgotPassword")}
        noindex
      />
      {sent ? (
        <>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "var(--radius-full)",
              background: "var(--primary-subtle)",
              color: "var(--primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
            }}
          >
            <Icon name="key" size={28} />
          </div>

          <h1 style={{ textAlign: "center" }}>{t("resetPasswordTitle")}</h1>
          <p style={{ textAlign: "center", marginBottom: 24 }}>
            {t("resetPasswordSubtitle")}{" "}
            <strong style={{ color: "var(--primary)" }}>{email}</strong>
          </p>

          <form className="auth-form" onSubmit={handleResetPassword}>
            <div className="form-group">
              <label className="form-label" htmlFor="reset-otp">
                {t("enterOtpCode")}
              </label>
              <input
                id="reset-otp"
                type="text"
                className={`form-input${errors.otp || errors.code ? " is-invalid" : ""}`}
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
                autoFocus
                autoComplete="one-time-code"
                inputMode="numeric"
                maxLength={6}
                style={{
                  textAlign: "center",
                  fontSize: "1.25rem",
                  letterSpacing: 4,
                  fontWeight: 700,
                }}
              />
              {(errors.otp || errors.code) && (
                <span className="form-error">
                  {(errors.otp || errors.code)[0]}
                </span>
              )}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reset-password">
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
                  id="reset-password"
                  type={showPassword ? "text" : "password"}
                  className={`form-input${errors.password ? " is-invalid" : ""}`}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  style={{ paddingInlineEnd: 44 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={
                    showPassword
                      ? t("hidePassword") || "إخفاء كلمة المرور"
                      : t("showPassword") || "إظهار كلمة المرور"
                  }
                  title={
                    showPassword
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
                  <Icon name={showPassword ? "eye-off" : "eye"} size={18} />
                </button>
              </div>
              {errors.password && (
                <span className="form-error">{errors.password[0]}</span>
              )}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reset-password-confirm">
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
                  id="reset-password-confirm"
                  type={showConfirmPassword ? "text" : "password"}
                  className={`form-input${errors.password_confirmation ? " is-invalid" : ""}`}
                  placeholder="••••••••"
                  value={passwordConfirmation}
                  onChange={(e) => setPasswordConfirmation(e.target.value)}
                  required
                  minLength={8}
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
                  <Icon
                    name={showConfirmPassword ? "eye-off" : "eye"}
                    size={18}
                  />
                </button>
              </div>
              {errors.password_confirmation && (
                <span className="form-error">
                  {errors.password_confirmation[0]}
                </span>
              )}
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block btn-lg"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span
                    className="spinner spinner-sm"
                    style={{ borderTopColor: "#fff" }}
                  />
                  {t("loading")}
                </>
              ) : (
                t("resetPasswordButton")
              )}
            </button>
          </form>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: 24,
              fontSize: "0.88rem",
            }}
          >
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={handleResend}
              disabled={resending}
              style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
            >
              {resending ? (
                t("loading")
              ) : (
                <>
                  <Icon name="refresh-cw" size={14} />
                  {t("resendCode")}
                </>
              )}
            </button>

            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setSent(false)}
              style={{ color: "var(--text-secondary)" }}
            >
              {t("changeEmail")}
            </button>
          </div>

          <div className="auth-footer" style={{ marginTop: 20 }}>
            <Link to="/customer/login">{t("backToSignIn")}</Link>
          </div>
        </>
      ) : (
        <>
          <h1>{t("forgotPasswordTitle")}</h1>
          <p>
            {t("forgotPasswordSubtitle")} ({t("customer")})
          </p>

          <form className="auth-form" onSubmit={handleSendCode}>
            <div className="form-group">
              <label className="form-label" htmlFor="forgot-email">
                {t("emailAddress")}
              </label>
              <input
                id="forgot-email"
                type="email"
                className={`form-input${errors.email ? " is-invalid" : ""}`}
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                autoFocus
              />
              {errors.email && (
                <span className="form-error">{errors.email[0]}</span>
              )}
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block btn-lg"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span
                    className="spinner spinner-sm"
                    style={{ borderTopColor: "#fff" }}
                  />
                  {t("loading")}
                </>
              ) : (
                t("sendResetCode")
              )}
            </button>
          </form>

          <div className="auth-footer">
            {t("rememberPassword")}{" "}
            <Link to="/customer/login">{t("signIn")}</Link>
          </div>
        </>
      )}
    </AuthCardLayout>
  );
}
