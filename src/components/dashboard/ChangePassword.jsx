import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useLanguage } from '../../context/LanguageContext';

export default function ChangePassword() {
  const { updatePassword, loading } = useAuth();
  const { t } = useLanguage();
  const toast = useToast();

  useEffect(() => {
    document.title = t('pageTitleChangePassword');
  }, []);

  const [formData, setFormData] = useState({
    current_password: '',
    password: '',
    password_confirmation: '',
  });
  const [errors, setErrors] = useState({});

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
      setErrors({ password_confirmation: ['Passwords do not match'] });
      return;
    }

    if (formData.password.length < 8) {
      setErrors({ password: ['Password must be at least 8 characters'] });
      return;
    }

    const result = await updatePassword({
      current_password: formData.current_password,
      password: formData.password,
      password_confirmation: formData.password_confirmation,
    });

    if (result.success) {
      toast.success(result.message || 'Password changed successfully');
      setFormData({ current_password: '', password: '', password_confirmation: '' });
    } else {
      setErrors(result.errors || {});
      toast.error(result.message || 'Failed to change password');
    }
  };

  return (
    <div className="card animate-fade-in-up">
      <div className="card-header">
        <h2 className="card-title">{t('changePassword')}</h2>
        <p className="card-subtitle">{t('changePasswordDesc')}</p>
      </div>

      <form className="card-body" onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label" htmlFor="current_password">{t('currentPassword')}</label>
          <input
            id="current_password"
            type="password"
            name="current_password"
            className={`form-input${errors.current_password ? ' is-invalid' : ''}`}
            value={formData.current_password}
            onChange={handleChange}
            required
            autoComplete="current-password"
            placeholder={t('enterCurrentPassword')}
          />
          {errors.current_password && <span className="form-error">{errors.current_password[0]}</span>}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="new_password">{t('newPassword')}</label>
          <input
            id="new_password"
            type="password"
            name="password"
            className={`form-input${errors.password ? ' is-invalid' : ''}`}
            value={formData.password}
            onChange={handleChange}
            required
            minLength={8}
            autoComplete="new-password"
            placeholder={t('atLeast8Chars')}
          />
          {errors.password && <span className="form-error">{errors.password[0]}</span>}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="confirm_password">{t('confirmNewPassword')}</label>
          <input
            id="confirm_password"
            type="password"
            name="password_confirmation"
            className={`form-input${errors.password_confirmation ? ' is-invalid' : ''}`}
            value={formData.password_confirmation}
            onChange={handleChange}
            required
            minLength={8}
            autoComplete="new-password"
            placeholder={t('repeatNewPassword')}
          />
          {errors.password_confirmation && <span className="form-error">{errors.password_confirmation[0]}</span>}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? (
              <>
                <span className="spinner spinner-sm" style={{ borderTopColor: '#fff' }} />
                {t('saving')}
              </>
            ) : (
              t('updatePasswordBtn')
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
