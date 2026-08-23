import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';

function ErrorIllustration({ code, iconType }) {
  const type = iconType || code || '404';

  if (type === '403') {
    return (
      <div className="error-illustration-wrapper">
        <div className="error-glow-circle error-glow-warning"></div>
        <svg className="error-svg-icon" viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="80" cy="80" r="70" fill="var(--surface-alt)" stroke="var(--border)" strokeWidth="2" />
          <path d="M80 30L125 50V90C125 117.6 105.8 143.2 80 150C54.2 143.2 35 117.6 35 90V50L80 30Z" fill="url(#warning-grad)" opacity="0.15" />
          <path d="M80 34L120 52V88C120 112.8 102.8 135.8 80 142C57.2 135.8 40 112.8 40 88V52L80 34Z" stroke="var(--warning)" strokeWidth="4" strokeLinejoin="round" />
          <rect x="62" y="76" width="36" height="34" rx="6" fill="var(--warning)" />
          <path d="M68 76V66C68 59.3726 73.3726 54 80 54C86.6274 54 92 59.3726 92 66V76" stroke="var(--warning)" strokeWidth="4" strokeLinecap="round" />
          <circle cx="80" cy="91" r="3.5" fill="var(--background)" />
          <path d="M80 94.5V99.5" stroke="var(--background)" strokeWidth="3" strokeLinecap="round" />
          <defs>
            <linearGradient id="warning-grad" x1="35" y1="30" x2="125" y2="150" gradientUnits="userSpaceOnUse">
              <stop stopColor="var(--warning)" />
              <stop offset="1" stopColor="var(--primary)" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    );
  }

  if (type === '500') {
    return (
      <div className="error-illustration-wrapper">
        <div className="error-glow-circle error-glow-danger"></div>
        <svg className="error-svg-icon" viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="25" y="30" width="110" height="32" rx="8" fill="var(--surface-alt)" stroke="var(--border)" strokeWidth="2" />
          <rect x="25" y="68" width="110" height="32" rx="8" fill="var(--surface-alt)" stroke="var(--border)" strokeWidth="2" />
          <rect x="25" y="106" width="110" height="32" rx="8" fill="var(--surface-alt)" stroke="var(--border)" strokeWidth="2" />
          
          <circle cx="40" cy="46" r="4" fill="var(--error)" />
          <circle cx="52" cy="46" r="4" fill="var(--warning)" />
          <circle cx="40" cy="84" r="4" fill="var(--error)" />
          <circle cx="52" cy="84" r="4" fill="var(--primary)" />
          <circle cx="40" cy="122" r="4" fill="var(--error)" />
          <circle cx="52" cy="122" r="4" fill="var(--muted)" />

          <line x1="75" y1="46" x2="115" y2="46" stroke="var(--border)" strokeWidth="3" strokeLinecap="round" />
          <line x1="75" y1="84" x2="115" y2="84" stroke="var(--border)" strokeWidth="3" strokeLinecap="round" />
          <line x1="75" y1="122" x2="115" y2="122" stroke="var(--border)" strokeWidth="3" strokeLinecap="round" />

          {/* Lightning bolt / Alert indicator */}
          <circle cx="118" cy="118" r="22" fill="var(--error)" />
          <path d="M119 106L109 119H118L116 129L127 116H118L119 106Z" fill="#FFFFFF" />
        </svg>
      </div>
    );
  }

  if (type === '503') {
    return (
      <div className="error-illustration-wrapper">
        <div className="error-glow-circle error-glow-info"></div>
        <svg className="error-svg-icon" viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="80" cy="80" r="65" fill="var(--surface-alt)" stroke="var(--border)" strokeWidth="2" />
          
          {/* Gear 1 */}
          <path d="M72 44C72 39.5817 75.5817 36 80 36C84.4183 36 88 39.5817 88 44V48.1633C94.2098 49.7719 99.8037 53.0039 104.225 57.4251C108.646 61.8463 111.878 67.4402 113.487 73.65H117.65C122.068 73.65 125.65 77.2317 125.65 81.65C125.65 86.0683 122.068 89.65 117.65 89.65H113.487C111.878 95.8598 108.646 101.454 104.225 105.875C99.8037 110.296 94.2098 113.528 88 115.137V119.3C88 123.718 84.4183 127.3 80 127.3C75.5817 127.3 72 123.718 72 119.3V115.137C65.7902 113.528 60.1963 110.296 55.7751 105.875C51.3539 101.454 48.1219 95.8598 46.5133 89.65H42.35C37.9317 89.65 34.35 86.0683 34.35 81.65C34.35 77.2317 37.9317 73.65 42.35 73.65H46.5133C48.1219 67.4402 51.3539 61.8463 55.7751 57.4251C60.1963 53.0039 65.7902 49.7719 72 48.1633V44Z" stroke="var(--primary)" strokeWidth="4" fill="none" />
          <circle cx="80" cy="81.65" r="18" fill="var(--primary-subtle)" stroke="var(--primary)" strokeWidth="4" />

          {/* Wrench */}
          <path d="M102 45L120 63L110 73L92 55L102 45Z" fill="var(--secondary)" />
          <path d="M52 115L95 72" stroke="var(--secondary)" strokeWidth="6" strokeLinecap="round" />
        </svg>
      </div>
    );
  }

  // Default 404
  return (
    <div className="error-illustration-wrapper">
      <div className="error-glow-circle error-glow-primary"></div>
      <div className="error-code-watermark">{code || '404'}</div>
      <svg className="error-svg-icon" viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="80" cy="80" r="68" fill="var(--surface-alt)" stroke="var(--border)" strokeWidth="2" />
        {/* Calendar element with missing piece */}
        <rect x="40" y="42" width="80" height="76" rx="10" fill="var(--background)" stroke="var(--primary)" strokeWidth="3" />
        <rect x="40" y="42" width="80" height="22" fill="var(--primary)" />
        <circle cx="58" cy="34" r="4" fill="var(--secondary)" />
        <circle cx="102" cy="34" r="4" fill="var(--secondary)" />
        <line x1="58" y1="30" x2="58" y2="42" stroke="var(--secondary)" strokeWidth="3" strokeLinecap="round" />
        <line x1="102" y1="30" x2="102" y2="42" stroke="var(--secondary)" strokeWidth="3" strokeLinecap="round" />
        
        {/* Magnifying glass or broken search */}
        <circle cx="80" cy="82" r="14" stroke="var(--primary-hover)" strokeWidth="3" strokeDasharray="6 3" />
        <line x1="90" y1="92" x2="105" y2="107" stroke="var(--primary-hover)" strokeWidth="4" strokeLinecap="round" />
        <path d="M74 76L86 88" stroke="var(--error)" strokeWidth="3" strokeLinecap="round" />
        <path d="M86 76L74 88" stroke="var(--error)" strokeWidth="3" strokeLinecap="round" />
      </svg>
    </div>
  );
}

export default function ErrorPage({
  code = '404',
  titleKey = 'error404Title',
  badgeKey = 'error404Badge',
  descKey = 'error404Desc',
  pageTitleKey = 'pageTitleNotFound',
  iconType,
  showDetails,
  onRetry,
}) {
  const { t } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = t(pageTitleKey, `${code} - ${t(titleKey)}`);
  }, [t, pageTitleKey, code, titleKey]);

  return (
    <div className="main-content">
      <section className="section error-page-section animate-page-enter">
        <div className="container">
          <div className="error-card">
            <ErrorIllustration code={code} iconType={iconType} />

            <div className="error-badge">
              <span className="error-badge-dot"></span>
              {t(badgeKey, `${code} Error`)}
            </div>

            <h1 className="error-title">{t(titleKey)}</h1>
            <p className="error-description">{t(descKey)}</p>

            {showDetails && (
              <div className="error-details-container">
                <details className="error-details-disclosure">
                  <summary className="error-details-summary">
                    <svg className="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    {t('errorDetails', 'تفاصيل الخطأ التقني')}
                  </summary>
                  <pre className="error-details-code">{showDetails}</pre>
                </details>
              </div>
            )}

            <div className="error-actions">
              <Link to="/" className="btn btn-primary btn-lg error-action-btn">
                <svg className="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                {t('backToHome', 'العودة للرئيسية')}
              </Link>

              {onRetry ? (
                <button type="button" onClick={onRetry} className="btn btn-secondary btn-lg error-action-btn">
                  <svg className="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {t('tryAgain', 'إعادة المحاولة')}
                </button>
              ) : (
                <button type="button" onClick={() => navigate(-1)} className="btn btn-outline btn-lg error-action-btn">
                  <svg className="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  {t('goBack', 'الرجوع للخلف')}
                </button>
              )}

              <Link to="/workspaces" className="btn btn-ghost btn-lg error-action-btn">
                <svg className="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {t('exploreWorkspaces', 'استكشاف مساحات العمل')}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
