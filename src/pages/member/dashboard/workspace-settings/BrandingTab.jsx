import { useLanguage } from '../../../../context/LanguageContext';
import Icon from '../../../../components/common/Icon';


export default function BrandingTab({ brandingForm, setBrandingForm, onSave, saving, canEdit }) {
  const { t } = useLanguage();

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(brandingForm);
  };

  const handleFileChange = (field, e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setBrandingForm((prev) => ({
          ...prev,
          [field]: event.target.result,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const getFieldValue = (urlKey, altKey) => brandingForm[urlKey] || brandingForm[altKey] || '';

  return (
    <form className="card-body" onSubmit={handleSubmit} style={{ gap: 24 }}>
      {/* Header */}
      <div style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: 12 }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 4px', color: 'var(--heading)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon name="custom-ecd73178" size={20} style={{ color: 'var(--primary)' }} />
          {t('brandingAndIdentity') || 'الهوية والعلامة التجارية'}
        </h3>
        <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: 0 }}>
          {t('brandingAndIdentityDesc') || 'الأسماء، والشعار والألوان التي تظهر في لوحة التحكم والبوابة والإيميلات والمستندات.'}
        </p>
      </div>

      {/* 3 Upload Cards (Logo, Cover, Favicon) - 3 Columns Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        {/* Logo Card */}
        <div style={{ padding: 18, borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)', background: 'var(--surface-alt)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 14 }}>
          <span style={{ fontSize: '0.86rem', fontWeight: 800, color: 'var(--heading)', display: 'block' }}>
            {t('logo') || 'شعار التطبيق (الفاتح)'}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            {getFieldValue('logo_url', 'logo') ? (
              <img src={getFieldValue('logo_url', 'logo')} alt="Logo" style={{ height: 44, maxWidth: 90, objectFit: 'contain', borderRadius: 8, border: '1px solid var(--border)', background: '#fff', padding: 4 }} />
            ) : (
              <div style={{ width: 64, height: 42, borderRadius: 8, border: '1px dashed var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontSize: '0.78rem', fontWeight: 600, background: 'var(--surface)' }}>
                {t('noneBadge') || 'بدون'}
              </div>
            )}
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <label style={{ padding: '6px 14px', borderRadius: 'var(--radius-md)', background: 'var(--surface)', border: '1px solid var(--border)', fontSize: '0.8rem', fontWeight: 700, color: 'var(--heading)', cursor: canEdit ? 'pointer' : 'default', transition: 'all 0.15s ease' }}>
                {t('replaceBtn') || 'استبدال'}
                <input type="file" accept="image/*" onChange={(e) => handleFileChange('logo_url', e)} hidden disabled={!canEdit} />
              </label>
              {getFieldValue('logo_url', 'logo') && (
                <button type="button" onClick={() => setBrandingForm({ ...brandingForm, logo_url: '', logo: '' })} style={{ padding: '6px 8px', borderRadius: 8, border: 'none', background: 'transparent', color: '#ef4444', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }} disabled={!canEdit}>
                  {t('removeBtn') || 'إزالة'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Cover Image Card */}
        <div style={{ padding: 18, borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)', background: 'var(--surface-alt)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 14 }}>
          <span style={{ fontSize: '0.86rem', fontWeight: 800, color: 'var(--heading)', display: 'block' }}>
            {t('coverImage') || 'صورة الغلاف'}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            {getFieldValue('cover_url', 'cover') ? (
              <img src={getFieldValue('cover_url', 'cover')} alt="Cover" style={{ height: 44, width: 80, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border)', background: '#fff', padding: 2 }} />
            ) : (
              <div style={{ width: 64, height: 42, borderRadius: 8, border: '1px dashed var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontSize: '0.78rem', fontWeight: 600, background: 'var(--surface)' }}>
                {t('noneBadge') || 'بدون'}
              </div>
            )}
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <label style={{ padding: '6px 14px', borderRadius: 'var(--radius-md)', background: 'var(--surface)', border: '1px solid var(--border)', fontSize: '0.8rem', fontWeight: 700, color: 'var(--heading)', cursor: canEdit ? 'pointer' : 'default', transition: 'all 0.15s ease' }}>
                {t('replaceBtn') || 'استبدال'}
                <input type="file" accept="image/*" onChange={(e) => handleFileChange('cover_url', e)} hidden disabled={!canEdit} />
              </label>
              {getFieldValue('cover_url', 'cover') && (
                <button type="button" onClick={() => setBrandingForm({ ...brandingForm, cover_url: '', cover: '' })} style={{ padding: '6px 8px', borderRadius: 8, border: 'none', background: 'transparent', color: '#ef4444', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }} disabled={!canEdit}>
                  {t('removeBtn') || 'إزالة'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Colors Section - 3 Columns Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 8 }}>
        <h4 style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--heading)', margin: 0 }}>
          {t('brandColors') || 'ألوان العلامة التجارية'}
        </h4>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          {/* Primary Color */}
          <div>
            <label className="form-label" style={{ fontSize: '0.84rem', fontWeight: 700, marginBottom: 8, display: 'block' }}>
              {t('primaryColor') || 'اللون الأساسي'}
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ position: 'relative', width: 40, height: 40, borderRadius: 10, border: '1px solid var(--border)', background: brandingForm.primary_color || '#0a9099', flexShrink: 0, overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.06)' }}>
                <input
                  type="color"
                  value={brandingForm.primary_color || '#0a9099'}
                  onChange={(e) => setBrandingForm({ ...brandingForm, primary_color: e.target.value })}
                  disabled={!canEdit}
                  style={{ opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }}
                />
              </div>
              <input
                type="text"
                className="form-input"
                value={brandingForm.primary_color || '#0a9099'}
                onChange={(e) => setBrandingForm({ ...brandingForm, primary_color: e.target.value })}
                disabled={!canEdit}
                style={{ fontFamily: 'monospace', direction: 'ltr', textAlign: 'center', height: 40 }}
              />
            </div>
          </div>

          {/* Secondary Color */}
          <div>
            <label className="form-label" style={{ fontSize: '0.84rem', fontWeight: 700, marginBottom: 8, display: 'block' }}>
              {t('secondaryColor') || 'اللون الثانوي'}
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ position: 'relative', width: 40, height: 40, borderRadius: 10, border: '1px solid var(--border)', background: brandingForm.secondary_color || '#166992', flexShrink: 0, overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.06)' }}>
                <input
                  type="color"
                  value={brandingForm.secondary_color || '#166992'}
                  onChange={(e) => setBrandingForm({ ...brandingForm, secondary_color: e.target.value })}
                  disabled={!canEdit}
                  style={{ opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }}
                />
              </div>
              <input
                type="text"
                className="form-input"
                value={brandingForm.secondary_color || '#166992'}
                onChange={(e) => setBrandingForm({ ...brandingForm, secondary_color: e.target.value })}
                disabled={!canEdit}
                style={{ fontFamily: 'monospace', direction: 'ltr', textAlign: 'center', height: 40 }}
              />
            </div>
          </div>

          {/* Hover Color */}
          <div>
            <label className="form-label" style={{ fontSize: '0.84rem', fontWeight: 700, marginBottom: 8, display: 'block' }}>
              {t('hoverColor') || 'لون التحويم'}
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ position: 'relative', width: 40, height: 40, borderRadius: 10, border: '1px solid var(--border)', background: brandingForm.hover_color || '#44f2fe', flexShrink: 0, overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.06)' }}>
                <input
                  type="color"
                  value={brandingForm.hover_color || '#44f2fe'}
                  onChange={(e) => setBrandingForm({ ...brandingForm, hover_color: e.target.value })}
                  disabled={!canEdit}
                  style={{ opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }}
                />
              </div>
              <input
                type="text"
                className="form-input"
                value={brandingForm.hover_color || '#44f2fe'}
                onChange={(e) => setBrandingForm({ ...brandingForm, hover_color: e.target.value })}
                disabled={!canEdit}
                style={{ fontFamily: 'monospace', direction: 'ltr', textAlign: 'center', height: 40 }}
              />
            </div>
          </div>
        </div>
      </div>

      {canEdit && (
        <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: 12 }}>
          <button type="submit" className="btn btn-primary btn-md" disabled={saving} style={{ padding: '10px 24px', borderRadius: 'var(--radius-md)', fontWeight: 700 }}>
            {saving ? (
              <>
                <span className="spinner spinner-sm" style={{ borderTopColor: '#fff' }} />
                {t('saving') || 'جاري الحفظ...'}
              </>
            ) : (
              t('saveChanges') || 'حفظ التغييرات'
            )}
          </button>
        </div>
      )}
    </form>
  );
}
