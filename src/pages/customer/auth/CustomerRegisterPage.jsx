import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { useLanguage } from '../../../context/LanguageContext';
import AuthCardLayout from '../../../components/auth/AuthCardLayout';
import SEO from '../../../components/ui/SEO';

export default function CustomerRegisterPage() {
  const { register, loading } = useAuth();
  const { t, lang } = useLanguage();
  const toast = useToast();
  const navigate = useNavigate();

  const userType = 'customer';

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    document.title = t('pageTitleRegister');
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

    const data = {
      name: formData.name,
      email: formData.email,
      password: formData.password,
      phone: formData.phone || undefined,
    };

    const result = await register(userType, data);

    if (result.success) {
      toast.success(result.message || t('accountCreatedVerifyEmail'));
      navigate('/customer/verify-account', { state: { email: formData.email, userType } });
    } else {
      setErrors(result.errors || {});
      toast.error(result.message || t('registrationFailed'));
    }
  };

  return (
    <AuthCardLayout
      illustration="/images/register.svg"
      illustrationAlt={lang === 'ar' ? 'إنشاء حساب عميل' : 'Customer registration illustration'}
      quote={lang === 'ar' ? 'أنشئ حسابك كعميل واستمتع بتجربة حجز مواعيد مرنة وسريعة.' : 'Create your customer account for easy scheduling.'}
    >
      <SEO title={t('pageTitleRegister')} noindex />
      <h1>{t('createAccount')}</h1>
      <p>{t('joinSaabq')} ({t('customer')})</p>

      <div className="auth-toggle">
        <button type="button" className="active">
          {t('customer')}
        </button>
        <button type="button" onClick={() => navigate('/member/register')}>
          {t('teamMember')}
        </button>
      </div>

      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label" htmlFor="name">{t('fullName')}</label>
          <input
            id="name"
            type="text"
            name="name"
            className={`form-input${errors.name ? ' is-invalid' : ''}`}
            placeholder={t('namePlaceholder')}
            value={formData.name}
            onChange={handleChange}
            required
            aria-required="true"
            aria-describedby={errors.name ? 'name-error' : undefined}
            autoComplete="name"
            autoFocus
          />
          {errors.name && <span id="name-error" className="form-error" role="alert">{errors.name[0]}</span>}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="reg-email">{t('emailAddress')}</label>
          <input
            id="reg-email"
            type="email"
            name="email"
            className={`form-input${errors.email ? ' is-invalid' : ''}`}
            placeholder="you@example.com"
            value={formData.email}
            onChange={handleChange}
            required
            aria-required="true"
            aria-describedby={errors.email ? 'reg-email-error' : undefined}
            autoComplete="email"
          />
          {errors.email && <span id="reg-email-error" className="form-error" role="alert">{errors.email[0]}</span>}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="reg-password">{t('password')}</label>
          <input
            id="reg-password"
            type="password"
            name="password"
            className={`form-input${errors.password ? ' is-invalid' : ''}`}
            placeholder="••••••••"
            value={formData.password}
            onChange={handleChange}
            required
            aria-required="true"
            minLength={8}
            aria-describedby={errors.password ? 'reg-password-error' : undefined}
            autoComplete="new-password"
          />
          {errors.password && <span id="reg-password-error" className="form-error" role="alert">{errors.password[0]}</span>}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="phone">
            {t('phoneNumber')} <span style={{ color: 'var(--muted)', fontWeight: 400 }}>({t('optional')})</span>
          </label>
          <input
            id="phone"
            type="tel"
            name="phone"
            className={`form-input${errors.phone ? ' is-invalid' : ''}`}
            placeholder="+966 5XX XXX XXXX"
            value={formData.phone}
            onChange={handleChange}
            aria-describedby={errors.phone ? 'phone-error' : undefined}
            autoComplete="tel"
          />
          {errors.phone && <span id="phone-error" className="form-error" role="alert">{errors.phone[0]}</span>}
        </div>

        <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
          {loading ? (
            <>
              <span className="spinner spinner-sm" style={{ borderTopColor: '#fff' }} aria-hidden="true" />
              {t('saving')}
            </>
          ) : (
            t('createAccount')
          )}
        </button>
      </form>

      <div className="auth-footer">
        {t('alreadyHaveAccount')}{' '}
        <Link to="/customer/login">{t('signIn')}</Link>
      </div>
    </AuthCardLayout>
  );
}
