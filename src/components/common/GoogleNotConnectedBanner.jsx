import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import Icon from './Icon';


export default function GoogleNotConnectedBanner() {
  const { user, userType } = useAuth();
  const { t } = useLanguage();

  // Only display for logged-in Workspace Members whose Google account is not connected
  if (userType !== 'member' || !user || user.is_google_connected === true) {
    return null;
  }

  return (
    <div
      className="google-not-connected-banner animate-fade-in-down"
      style={{
        background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.15) 0%, rgba(245, 158, 11, 0.1) 100%)',
        border: '1px solid rgba(245, 158, 11, 0.35)',
        borderRadius: '12px',
        padding: '14px 18px',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        flexWrap: 'wrap',
        boxShadow: '0 4px 12px rgba(245, 158, 11, 0.08)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: '280px' }}>
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            backgroundColor: 'rgba(245, 158, 11, 0.18)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            color: '#D97706',
          }}
        >
          <Icon name="alert-triangle" size={22} />
        </div>

        <div>
          <h4
            style={{
              margin: 0,
              fontSize: '0.95rem',
              fontWeight: 700,
              color: 'var(--text-color, #1f2937)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            {t('googleNotConnectedBannerTitle') || 'تنبيه هام: حساب Google غير مرتبط'}
          </h4>
          <p
            style={{
              margin: '3px 0 0 0',
              fontSize: '0.85rem',
              color: 'var(--text-muted, #4b5563)',
              lineHeight: 1.45,
            }}
          >
            {t('googleNotConnectedBannerDesc') || 'حساب Google الخاص بك غير مرتبط حالياً. لن تتم مزامنة المواعيد أو إنشاء روابط Google Meet تلقائياً حتى تقوم بربط حسابك.'}
          </p>
        </div>
      </div>

      <Link
        to="/member/profile?tab=integrations"
        className="btn btn-warning btn-sm"
        style={{
          backgroundColor: '#F59E0B',
          borderColor: '#D97706',
          color: '#ffffff',
          fontWeight: 600,
          borderRadius: '8px',
          padding: '8px 16px',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          whiteSpace: 'nowrap',
          textDecoration: 'none',
          boxShadow: '0 2px 8px rgba(245, 158, 11, 0.3)',
          transition: 'all 0.2s ease',
        }}
      >
        <Icon name="custom-2963ac22" size={16} />
        {t('connectGoogleNow') || 'ربط حساب Google الآن'}
      </Link>
    </div>
  );
}
