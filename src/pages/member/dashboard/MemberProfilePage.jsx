import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { useLanguage } from '../../../context/LanguageContext';
import MemberSecurityPage from './MemberSecurityPage';
import MemberChangePasswordPage from './MemberChangePasswordPage';
import IntegrationsSettingsPage from './IntegrationsSettingsPage';
import NotificationsPage from '../../../components/dashboard/NotificationsPage';
import ChatsPage from '../../../components/dashboard/ChatsPage';
import SEO from '../../../components/ui/SEO';
import { ProfileSkeleton } from '../../../components/ui/Skeleton';
import Icon from '../../../components/common/Icon';


export default function MemberProfilePage() {
  const { user, updateProfile, loading } = useAuth();
  const { t } = useLanguage();
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'info';



  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});

  useEffect(() => {
    document.title = t('pageTitleProfile');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        title: user.title || '',
        bio: user.bio || '',
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setErrors({});

    const result = await updateProfile(formData);
    if (result.success) {
      toast.success(result.message || 'Profile updated successfully');
      setEditing(false);
    } else {
      setErrors(result.errors || {});
      toast.error(result.message || 'Failed to update profile');
    }
  };

  if (loading && !user) {
    return (
      <>
        <SEO title={t('pageTitleProfile')} noindex />
        <ProfileSkeleton />
      </>
    );
  }

  if (!user) return null;

  if (currentTab === 'security') {
    return (
      <>
        <SEO title={t('security')} noindex />
        <MemberSecurityPage />
      </>
    );
  }

  if (currentTab === 'integrations' || currentTab === 'applications') {
    return (
      <>
        <SEO title={t('integrations')} noindex />
        <IntegrationsSettingsPage />
      </>
    );
  }

  if (currentTab === 'notifications') {
    return (
      <>
        <SEO title={t('notifications')} noindex />
        <NotificationsPage />
      </>
    );
  }

  if (currentTab === 'chats' || currentTab === 'support' || currentTab === 'messages') {
    return (
      <>
        <SEO title={t('supportChat')} noindex />
        <ChatsPage />
      </>
    );
  }

  if (currentTab === 'password') {
    return (
      <>
        <SEO title={t('changePassword')} noindex />
        <MemberChangePasswordPage />
      </>
    );
  }

  return (
    <div className="card animate-fade-in-up">
      <SEO title={t('pageTitleProfile')} noindex />
      <div className="card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 className="card-title">{t('profileInfo')} ({t('teamMember')})</h2>
          <p className="card-subtitle">{t('updatePersonalDetails')}</p>
        </div>
        {!editing ? (
          <button className="btn btn-primary btn-sm" onClick={() => setEditing(true)}>
            <Icon name="custom-b1d51d5f" size={14} />
            {t('edit')}
          </button>
        ) : (
          <button className="btn btn-ghost btn-sm" onClick={() => { setEditing(false); setErrors({}); }}>
            {t('cancel')}
          </button>
        )}
      </div>

      {editing ? (
        <form className="card-body" onSubmit={handleSave}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="edit-name">{t('fullName')}</label>
              <input
                id="edit-name"
                type="text"
                name="name"
                className={`form-input${errors.name ? ' is-invalid' : ''}`}
                value={formData.name}
                onChange={handleChange}
                required
              />
              {errors.name && <span className="form-error">{errors.name[0]}</span>}
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="edit-email">{t('emailAddress')}</label>
              <input
                id="edit-email"
                type="email"
                name="email"
                className={`form-input${errors.email ? ' is-invalid' : ''}`}
                value={formData.email}
                onChange={handleChange}
                required
              />
              {errors.email && <span className="form-error">{errors.email[0]}</span>}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="edit-phone">{t('phoneNumber')}</label>
            <input
              id="edit-phone"
              type="tel"
              name="phone"
              className={`form-input${errors.phone ? ' is-invalid' : ''}`}
              value={formData.phone}
              onChange={handleChange}
              placeholder="+966 5XX XXX XXXX"
            />
            {errors.phone && <span className="form-error">{errors.phone[0]}</span>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="edit-title">{t('jobTitle')}</label>
            <input
              id="edit-title"
              type="text"
              name="title"
              className={`form-input${errors.title ? ' is-invalid' : ''}`}
              value={formData.title}
              onChange={handleChange}
            />
            {errors.title && <span className="form-error">{errors.title[0]}</span>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="edit-bio">{t('bio')}</label>
            <textarea
              id="edit-bio"
              name="bio"
              className={`form-textarea${errors.bio ? ' is-invalid' : ''}`}
              value={formData.bio}
              onChange={handleChange}
              rows={3}
            />
            {errors.bio && <span className="form-error">{errors.bio[0]}</span>}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
            <button type="button" className="btn btn-secondary" onClick={() => { setEditing(false); setErrors({}); }}>
              {t('cancel')}
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner spinner-sm" style={{ borderTopColor: '#fff' }} />
                  {t('saving')}
                </>
              ) : (
                t('saveChanges')
              )}
            </button>
          </div>
        </form>
      ) : (
        <div className="card-body">
          <InfoRow label={t('fullName')} value={user.name} />
          <InfoRow label={t('emailAddress')} value={user.email} />
          <InfoRow label={t('phoneNumber')} value={user.phone || '—'} />
          <InfoRow label={t('jobTitle')} value={user.title || '—'} />
          <InfoRow label={t('bio')} value={user.bio || '—'} />
          <InfoRow label={t('bookableStatus')} value={user.is_bookable ? t('yes') : t('no')} />
          <InfoRow label={t('locale')} value={user.locale || '—'} />
          <InfoRow label={t('status')} value={user.status || '—'} />
          {user.last_login_at && (
            <InfoRow
              label={t('lastLogin')}
              value={new Date(user.last_login_at).toLocaleDateString(t('lang') === 'ar' ? 'ar-SA' : 'en-US', {
                year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
              })}
            />
          )}

          {/* Workspace info */}
          {user.workspace && (
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: 12 }}>{t('workspace')}</h3>
              <InfoRow label={t('workspaceName')} value={user.workspace.name} />
              <InfoRow label={t('slug')} value={user.workspace.slug} />
            </div>
          )}

          {/* Role info */}
          {user.role && (
            <div style={{ marginTop: 8 }}>
              <InfoRow label={t('role')} value={user.role.name} />
              {user.is_owner && (
                <span className="profile-badge verified" style={{ marginTop: 4, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <Icon name="crown" size={12} />
                  {t('owner')}
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border-light)' }}>
      <span style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', fontWeight: 500 }}>{label}</span>
      <span style={{ fontSize: '0.88rem', fontWeight: 500, color: 'var(--text)', textAlign: 'right', maxWidth: '60%', wordBreak: 'break-word' }}>{value}</span>
    </div>
  );
}
