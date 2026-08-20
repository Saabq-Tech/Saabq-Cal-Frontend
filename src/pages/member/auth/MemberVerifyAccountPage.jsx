import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { useLanguage } from '../../../context/LanguageContext';
import AuthCardLayout from '../../../components/auth/AuthCardLayout';
import SEO from '../../../components/ui/SEO';
import Icon from '../../../components/common/Icon';


export default function MemberVerifyAccountPage() {
  const { verifyEmailOTP, sendEmailVerification, loading } = useAuth();
  const { t } = useLanguage();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const userType = 'member';
  const emailFromState = location.state?.email || '';

  const [email, setEmail] = useState(emailFromState);
  const [otp, setOtp] = useState('');
  const [resending, setResending] = useState(false);

  useEffect(() => {
    document.title = t('pageTitleVerifyAccount');
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!otp || otp.length < 4) {
      toast.error(t('enterValidOtpCode'));
      return;
    }

    const result = await verifyEmailOTP(email, otp, userType);
    if (result.success) {
      toast.success(result.message || t('verificationSuccess'));
      navigate('/member/login', { replace: true, state: { email, userType } });
    } else {
      toast.error(result.message || 'Invalid verification code.');
    }
  };

  const handleResend = async () => {
    setResending(true);
    const result = await sendEmailVerification(email, userType);
    setResending(false);

    if (result.success) {
      toast.success(result.message || t('codeResent'));
    } else {
      toast.error(result.message || 'Failed to resend verification code.');
    }
  };

  return (
    <AuthCardLayout illustration="/images/otp.svg" illustrationAlt={t('pageTitleVerifyAccount')}>
      <SEO title={t('pageTitleVerifyAccount') + ` (${t('teamMember')})`} noindex />
      <div style={{ width: 64, height: 64, borderRadius: 'var(--radius-full)', background: 'var(--primary-subtle)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
        <Icon name="mail" size={28} />
      </div>

      <h1 style={{ textAlign: 'center' }}>{t('verifyAccountTitle')}</h1>
      <p style={{ textAlign: 'center', marginBottom: 24 }}>
        {t('verifyAccountDesc')} <strong style={{ color: 'var(--primary)' }}>{email || 'your email'}</strong>
      </p>

      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label" htmlFor="verify-email">{t('emailAddress')}</label>
          <input
            id="verify-email"
            type="email"
            className="form-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="verify-otp">{t('enterOtpCode')}</label>
          <input
            id="verify-otp"
            type="text"
            className="form-input"
            placeholder="123456"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            required
            autoFocus
            autoComplete="one-time-code"
            inputMode="numeric"
            maxLength={6}
            style={{ textAlign: 'center', fontSize: '1.25rem', letterSpacing: 4, fontWeight: 700 }}
          />
        </div>

        <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
          {loading ? (
            <>
              <span className="spinner spinner-sm" style={{ borderTopColor: '#fff' }} />
              {t('loading')}
            </>
          ) : (
            t('verifyButton')
          )}
        </button>
      </form>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, fontSize: '0.88rem' }}>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={handleResend}
          disabled={resending}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          {resending ? t('loading') : (
            <>
              <Icon name="refresh-cw" size={14} />
              {t('resendCode')}
            </>
          )}
        </button>

        <Link to="/member/login" style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>
          {t('backToSignIn')}
        </Link>
      </div>
    </AuthCardLayout>
  );
}
