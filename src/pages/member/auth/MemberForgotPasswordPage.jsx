import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { useLanguage } from '../../../context/LanguageContext';
import AuthCardLayout from '../../../components/auth/AuthCardLayout';
import SEO from '../../../components/ui/SEO';
import Icon from '../../../components/common/Icon';


export default function MemberForgotPasswordPage() {
  const { forgotPassword, loading } = useAuth();
  const { t } = useLanguage();
  const toast = useToast();

  const userType = 'member';
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    document.title = t('pageTitleForgotPassword');
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    const result = await forgotPassword(userType, email);

    if (result.success) {
      setSent(true);
      toast.success(result.message || t('resetLinkSent'));
    } else {
      setErrors(result.errors || {});
      toast.error(result.message || 'Failed to send reset link');
    }
  };

  return (
    <AuthCardLayout illustration="/images/forgot-password.svg" illustrationAlt={t('pageTitleForgotPassword')}>
      <SEO title={t('pageTitleForgotPassword') + ` (${t('teamMember')})`} noindex />
      {sent ? (
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: 'var(--radius-full)', background: 'var(--primary-subtle)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', fontSize: '1.5rem' }}>
            <Icon name="custom-184f8b5c" size={32} />
          </div>
          <h1 style={{ fontSize: '1.5rem' }}>{t('checkYourEmail')}</h1>
          <p style={{ marginTop: 8 }}>
            {t('resetLinkSent')} <strong>{email}</strong>. {t('checkInbox')}
          </p>
          <Link to="/member/login" className="btn btn-primary" style={{ marginTop: 28 }}>
            {t('backToSignIn')}
          </Link>
        </div>
      ) : (
        <>
          <h1>{t('forgotPasswordTitle')}</h1>
          <p>{t('forgotPasswordSubtitle')} ({t('teamMember')})</p>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="forgot-email">{t('emailAddress')}</label>
              <input
                id="forgot-email"
                type="email"
                className={`form-input${errors.email ? ' is-invalid' : ''}`}
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                autoFocus
              />
              {errors.email && <span className="form-error">{errors.email[0]}</span>}
            </div>

            <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner spinner-sm" style={{ borderTopColor: '#fff' }} />
                  {t('loading')}
                </>
              ) : (
                t('sendResetLink')
              )}
            </button>
          </form>

          <div className="auth-footer">
            {t('rememberPassword')}{' '}
            <Link to="/member/login">{t('signIn')}</Link>
          </div>
        </>
      )}
    </AuthCardLayout>
  );
}
