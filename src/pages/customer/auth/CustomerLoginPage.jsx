import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { useLanguage } from '../../../context/LanguageContext';
import AuthCardLayout from '../../../components/auth/AuthCardLayout';
import SEO from '../../../components/ui/SEO';
import Icon from '../../../components/common/Icon';


export default function CustomerLoginPage() {
  const { login, googleAuth, passkeyLogin, loading } = useAuth();
  const { t, lang } = useLanguage();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const userType = 'customer';

  const [formData, setFormData] = useState({
    email: location.state?.email || '',
    password: '',
    code: '',
  });
  const [errors, setErrors] = useState({});
  const [show2FA, setShow2FA] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const defaultRedirect = '/customer/profile';
  const from = location.state?.from
    ? (typeof location.state.from === 'string'
        ? location.state.from
        : (location.state.from.pathname + (location.state.from.search || '') + (location.state.from.hash || '')))
    : defaultRedirect;

  useEffect(() => {
    document.title = t('pageTitleLogin');

    if (!document.getElementById('google-gsi-script')) {
      const script = document.createElement('script');
      script.id = 'google-gsi-script';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

    const credentials = {
      email: formData.email,
      password: formData.password,
    };

    if (show2FA && formData.code) {
      credentials.code = formData.code;
    }

    const result = await login(userType, credentials);

    if (result.success) {
      toast.success(result.message || t('loginSuccess'));
      navigate(from, { replace: true });
    } else {
      const errorMsg = (result.message || '') + ' ' + JSON.stringify(result.errors || {});
      const isUnverified =
        errorMsg.toLowerCase().includes('verified') ||
        errorMsg.includes(t('activateLabel')) ||
        errorMsg.includes('تأكيد') ||
        errorMsg.includes('تفعيل');

      if (isUnverified) {
        toast.warning(t('emailNotVerifiedNotice'));
        navigate('/customer/verify-account', { state: { email: formData.email, userType } });
      } else if (result.errors?.code) {
        setShow2FA(true);
        toast.warning(t('twoFactorCodeRequired'));
      } else {
        setErrors(result.errors || {});
        toast.error(result.message || t('invalidCredentials'));
      }
    }
  };

  const handleGoogleLogin = async () => {
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    if (window.google?.accounts?.oauth2) {
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: googleClientId,
        scope: 'email profile openid',
        callback: async (tokenResponse) => {
          if (tokenResponse && tokenResponse.access_token) {
            const res = await googleAuth(userType, tokenResponse.access_token);
            if (res.success) {
              toast.success(res.message || t('googleAuthSuccess'));
              navigate(from, { replace: true });
            } else {
              toast.error(res.message || 'Google authentication failed.');
            }
          } else if (tokenResponse.error && tokenResponse.error !== 'popup_closed') {
            toast.error(t('googleAuthFailed'));
          }
        },
        error_callback: (err) => {
          if (err?.type !== 'popup_closed') {
            toast.error(t('googleAuthFailed'));
          }
        },
      });
      tokenClient.requestAccessToken();
    } else {
      toast.info(t('googleSdkLoading'));
    }
  };

  const handlePasskeyLogin = async () => {
    if (window.PublicKeyCredential && navigator.credentials?.get) {
      try {
        const credential = await navigator.credentials.get({
          publicKey: {
            challenge: new Uint8Array(32),
            timeout: 60000,
            userVerification: 'preferred',
          },
        });
        if (credential) {
          const result = await passkeyLogin(userType, credential.id);
          if (result.success) {
            toast.success(result.message || t('passkeyAuthSuccess'));
            navigate(from, { replace: true });
            return;
          } else {
            toast.error(result.message || 'Passkey authentication failed.');
            return;
          }
        }
      } catch (err) {
        if (err.name !== 'NotAllowedError') {
          toast.error('Passkey authentication error: ' + err.message);
          return;
        }
      }
    }
    toast.warning(t('passkeyAuthCancelled'));
  };

  return (
    <AuthCardLayout
      illustration="/images/login.svg"
      illustrationAlt={lang === 'ar' ? 'تسجيل دخول العميل' : 'Customer login illustration'}
      quote={lang === 'ar' ? 'سجل دخولك كعميل لحجز وإدارة مواعيدك وسهولة التواصل.' : 'Sign in as a customer to manage your bookings effortlessly.'}
    >
      <SEO title={t('pageTitleLogin')} noindex />
      <h1>{t('welcomeBack')}</h1>
      <p>{t('signInToContinue')} ({t('customer')})</p>

      {/* Switch to member portal */}
      <div className="auth-toggle">
        <button type="button" className="active">
          {t('customer')}
        </button>
        <button type="button" onClick={() => navigate('/member/login')}>
          {t('teamMember')}
        </button>
      </div>

      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label" htmlFor="login-email">{t('emailAddress')}</label>
          <input
            id="login-email"
            type="email"
            name="email"
            className={`form-input${errors.email ? ' is-invalid' : ''}`}
            placeholder="you@example.com"
            value={formData.email}
            onChange={handleChange}
            required
            aria-required="true"
            aria-describedby={errors.email ? 'login-email-error' : undefined}
            autoComplete="email"
            autoFocus
          />
          {errors.email && <span id="login-email-error" className="form-error" role="alert">{errors.email[0]}</span>}
        </div>

        <div className="form-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label className="form-label" htmlFor="login-password">{t('password')}</label>
            <Link to="/customer/forgot-password" className="auth-forgot-link">
              {t('forgotPassword')}
            </Link>
          </div>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              name="password"
              className={`form-input${errors.password ? ' is-invalid' : ''}`}
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              required
              aria-required="true"
              aria-describedby={errors.password ? 'login-password-error' : undefined}
              autoComplete="current-password"
              style={{ paddingInlineEnd: 44 }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? t('hidePassword') || 'إخفاء كلمة المرور' : t('showPassword') || 'إظهار كلمة المرور'}
              title={showPassword ? t('hidePassword') || 'إخفاء كلمة المرور' : t('showPassword') || 'إظهار كلمة المرور'}
              style={{
                position: 'absolute',
                top: '50%',
                transform: 'translateY(-50%)',
                insetInlineEnd: 10,
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary, #64748b)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 6,
                borderRadius: 6,
                transition: 'color 0.2s',
              }}
            >
              <Icon name={showPassword ? 'eye-off' : 'eye'} size={18} />
            </button>
          </div>
          {errors.password && <span id="login-password-error" className="form-error" role="alert">{errors.password[0]}</span>}
        </div>

        {show2FA && (
          <div className="form-group animate-fade-in-up">
            <label className="form-label" htmlFor="login-2fa">{t('twoFactorCode')}</label>
            <input
              id="login-2fa"
              type="text"
              name="code"
              className={`form-input${errors.code ? ' is-invalid' : ''}`}
              placeholder="123456"
              value={formData.code}
              onChange={handleChange}
              maxLength={6}
              aria-describedby={errors.code ? 'login-2fa-error' : undefined}
              autoFocus
              style={{ textAlign: 'center', letterSpacing: 4, fontSize: '1.1rem', fontWeight: 600 }}
            />
            {errors.code && <span id="login-2fa-error" className="form-error" role="alert">{errors.code[0]}</span>}
          </div>
        )}

        <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
          {loading ? (
            <>
              <span className="spinner spinner-sm" style={{ borderTopColor: '#fff' }} aria-hidden="true" />
              {t('authenticating')}
            </>
          ) : (
            t('signIn')
          )}
        </button>

        <div className="auth-divider">
          {t('orContinueWith', 'أو المتابعة باستخدام')}
        </div>

        <div className="auth-social-grid">
          <button
            type="button"
            className="auth-social-btn"
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            <Icon name="google" size={18} />
            Google
          </button>

          <button
            type="button"
            className="auth-social-btn"
            onClick={handlePasskeyLogin}
            disabled={loading}
            style={{ gap: 6 }}
          >
            <Icon name="custom-41d6ccb9" size={16} />
            {t('passkey', 'مفتاح المرور')}
          </button>
        </div>
      </form>

      <div className="auth-footer">
        {t('dontHaveAccount', 'ليس لديك حساب؟')}{' '}
        <Link to="/customer/register">{t('signUp', 'إنشاء حساب')}</Link>
      </div>
    </AuthCardLayout>
  );
}
