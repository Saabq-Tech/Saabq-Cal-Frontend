import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import AppLogo from '../ui/AppLogo';
import { getPublicAssetUrl } from '../../utils/url';
import Flag from '../common/Flag';

export default function AuthCardLayout({ children, illustration = '/images/login.svg', illustrationAlt = 'Saabq Cal Scheduling', quote, quoteAuthor }) {
  const { lang, toggleLanguage, t } = useLanguage();

  return (
    <main className="auth-page">
      <div className="auth-panel-left">
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
          <button
            className="theme-toggle"
            onClick={toggleLanguage}
            aria-label={lang === 'ar' ? 'Switch to English' : 'التحويل للعربية'}
            style={{ width: 'auto', padding: '6px 14px', fontSize: '0.85rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 8, borderRadius: 'var(--radius-full, 9999px)', cursor: 'pointer' }}
          >
            <Flag country={lang === 'ar' ? 'us' : 'eg'} style={{ width: 18, height: 13 }} />
            <span>{lang === 'ar' ? 'English' : 'العربية'}</span>
          </button>
        </div>

        <div className="auth-form-wrapper animate-fade-in-up">
          {children}
        </div>
      </div>

      <div className="auth-panel-right">
        <Link to="/" className="auth-brand">
          <AppLogo height={36} />
        </Link>

        <div className="auth-illustration">
          <img
            src={getPublicAssetUrl(illustration)}
            alt={illustrationAlt}
            width={320}
            height={320}
            loading="lazy"
          />
        </div>

        <div className="auth-quote">
          <blockquote>
            "{quote || (lang === 'ar' ? 'إدارة المواعيد أصبحت أسهل وأكثر احترافية مع سابق كول.' : 'Scheduling made simple and professional with Saabq Cal.')}"
          </blockquote>
          <cite>— {quoteAuthor || t('appName')}</cite>
        </div>
      </div>
    </main>
  );
}
