import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { useLanguage } from '../../../context/LanguageContext';
import AuthCardLayout from '../../../components/auth/AuthCardLayout';
import SEO from '../../../components/ui/SEO';
import client, { endpoints } from '../../../api/client';

export default function MemberRegisterPage() {
  const { register, loading } = useAuth();
  const { t, lang } = useLanguage();
  const toast = useToast();
  const navigate = useNavigate();

  const userType = 'member';

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    workspace_name: '',
    workspace_type_id: '',
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [workspaceTypes, setWorkspaceTypes] = useState([]);

  useEffect(() => {
    client.get(endpoints.workspaceTypes).then((res) => {
      if (res.data?.data) {
        setWorkspaceTypes(res.data.data);
      }
    }).catch(() => {});
  }, []);

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
      workspace_name: formData.workspace_name,
      workspace_type_id: formData.workspace_type_id || undefined,
    };

    const result = await register(userType, data);

    if (result.success) {
      toast.success(result.message || t('accountCreatedVerifyEmail'));
      navigate('/member/verify-account', { state: { email: formData.email, userType } });
    } else {
      setErrors(result.errors || {});
      toast.error(result.message || t('registrationFailed'));
    }
  };

  return (
    <AuthCardLayout
      illustration="/images/register.svg"
      illustrationAlt={lang === 'ar' ? 'إنشاء حساب عضو فريق' : 'Member registration illustration'}
      quote={lang === 'ar' ? 'أنشئ حساب عضو فريق وابدأ في بناء وإدارة مساحة العمل الخاصة بك.' : 'Create your workspace member account to get started.'}
    >
      <SEO title={t('pageTitleRegister') + ` (${t('teamMember')})`} noindex />
      <h1>{t('createAccount')}</h1>
      <p>{t('joinSaabq')} ({t('teamMember')})</p>

      <div className="auth-toggle">
        <button type="button" onClick={() => navigate('/customer/register')}>
          {t('customer')}
        </button>
        <button type="button" className="active">
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
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <input
              id="reg-password"
              type={showPassword ? 'text' : 'password'}
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

        <div className="form-group animate-fade-in-up">
          <label className="form-label" htmlFor="workspace_name">{t('workspaceName')}</label>
          <input
            id="workspace_name"
            type="text"
            name="workspace_name"
            className={`form-input${errors.workspace_name ? ' is-invalid' : ''}`}
            placeholder={t('workspaceNamePlaceholder')}
            value={formData.workspace_name}
            onChange={handleChange}
            required
            aria-required="true"
            aria-describedby={errors.workspace_name ? 'workspace_name-error' : undefined}
          />
          {errors.workspace_name && <span id="workspace_name-error" className="form-error" role="alert">{errors.workspace_name[0]}</span>}
        </div>

        <div className="form-group animate-fade-in-up">
          <label className="form-label" htmlFor="workspace_type_id">{t('workspaceType') || 'تصنيف مساحة العمل'}</label>
          <select
            id="workspace_type_id"
            name="workspace_type_id"
            className="form-input"
            value={formData.workspace_type_id}
            onChange={handleChange}
          >
            <option value="">-- {t('selectWorkspaceType') || 'اختر نوع مساحة العمل'} --</option>
            {workspaceTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </select>
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
        <Link to="/member/login">{t('signIn')}</Link>
      </div>
    </AuthCardLayout>
  );
}
