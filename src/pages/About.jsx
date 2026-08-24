import { useState, useEffect } from 'react';
import client, { endpoints } from '../api/client';
import { useLanguage } from '../context/LanguageContext';

export default function About() {
  const { t } = useLanguage();

  const [about, setAbout] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = t('pageTitleAbout');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    client
      .get(endpoints.about)
      .then((res) => {
        setAbout(res.data.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="main-content">
        <div className="page-loading">
          <div className="spinner spinner-lg" />
          <p>{t('loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="main-content">
      <section className="section animate-page-enter">
        <div className="container about-content">
          <h1>{t('aboutTitle')}</h1>
          {about ? (
            <div className="about-body" dangerouslySetInnerHTML={{ __html: about.body || about.content || '' }} />
          ) : (
            <div className="about-body">
              <p>{t('aboutBodyFallback1')}</p>
              <p>{t('aboutBodyFallback2')}</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
