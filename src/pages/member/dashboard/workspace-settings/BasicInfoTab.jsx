import { useState, useEffect } from 'react';
import { useLanguage } from '../../../../context/LanguageContext';
import client, { endpoints } from '../../../../api/client';
import SearchableSelect from '../../../../components/common/SearchableSelect';
import Icon from '../../../../components/common/Icon';


export default function BasicInfoTab({ basicForm, setBasicForm, workspaceTypes = [], countries = [], onSave, saving, canEdit }) {
  const { t } = useLanguage();
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);

  // Fetch states when country_id changes
  useEffect(() => {
    if (!basicForm.country_id) {
      setStates([]);
      return;
    }
    let isMounted = true;
    setLoadingStates(true);
    client.get(endpoints.statesByCountry(basicForm.country_id))
      .then((res) => {
        if (isMounted && res.data?.data && Array.isArray(res.data.data)) {
          setStates(res.data.data);
        }
      })
      .catch(() => {
        if (isMounted) setStates([]);
      })
      .finally(() => {
        if (isMounted) setLoadingStates(false);
      });
    return () => { isMounted = false; };
  }, [basicForm.country_id]);

  // Fetch cities when state_id changes
  useEffect(() => {
    if (!basicForm.state_id) {
      setCities([]);
      return;
    }
    let isMounted = true;
    setLoadingCities(true);
    client.get(endpoints.citiesByState(basicForm.state_id))
      .then((res) => {
        if (isMounted && res.data?.data && Array.isArray(res.data.data)) {
          setCities(res.data.data);
        }
      })
      .catch(() => {
        if (isMounted) setCities([]);
      })
      .finally(() => {
        if (isMounted) setLoadingCities(false);
      });
    return () => { isMounted = false; };
  }, [basicForm.state_id]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(basicForm);
  };

  const typeOptions = workspaceTypes.map((wt) => ({ value: wt.id, label: wt.name }));
  const countryOptions = countries.map((c) => ({ value: c.id, label: c.name }));
  const stateOptions = states.map((s) => ({ value: s.id, label: s.name }));
  const cityOptions = cities.map((ci) => ({ value: ci.id, label: ci.name }));

  return (
    <form className="card-body" onSubmit={handleSubmit}>
      {/* Header with Circle Icon Badge & Subtitle */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid var(--border-light)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--primary-subtle)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="custom-34f286e2" size={18} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--heading)' }}>
              {t('workspaceBasicInfo') || 'المعلومات الأساسية'}
            </h3>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem', margin: 0 }}>
            {t('workspaceBasicInfoDesc') || 'تعديل تفاصيل مساحة العمل الأساسية، بيانات التواصل، والموقع الجغرافي.'}
          </p>
        </div>
      </div>
      
      {/* Row 1: Name, Slug (with Badge), Status */}
      <div className="form-row" style={{ gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div className="form-group">
          <label className="form-label">{t('workspaceName') || 'اسم مساحة العمل'} *</label>
          <input
            type="text"
            className="form-input"
            value={basicForm.name || ''}
            onChange={(e) => setBasicForm({ ...basicForm, name: e.target.value })}
            required
            disabled={!canEdit}
          />
        </div>

        <div className="form-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <label className="form-label" style={{ marginBottom: 0 }}>{t('workspaceSlugLabel') || 'الرابط المختصر (Slug)'} *</label>
            <span style={{ fontSize: '0.72rem', background: '#e6f7ef', color: '#107c41', padding: '2px 8px', borderRadius: 12, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
              <Icon name="check" size={10} />
              {t('slugAvailable') || 'متاح'}
            </span>
          </div>
          <input
            type="text"
            className="form-input"
            value={basicForm.slug || basicForm.name?.toLowerCase().replace(/\s+/g, '-') || 'ag'}
            onChange={(e) => setBasicForm({ ...basicForm, slug: e.target.value })}
            placeholder={t('slugPlaceholder') || 'workspace-slug'}
            disabled={!canEdit}
          />
        </div>

        <div className="form-group">
          <label className="form-label">{t('workspaceStatusLabel') || 'حالة مساحة العمل'}</label>
          <select
            className="form-select"
            value={basicForm.status || 'active'}
            onChange={(e) => setBasicForm({ ...basicForm, status: e.target.value })}
            disabled={!canEdit}
          >
            <option value="active">{t('statusActiveLabel') || 'نشط (Active)'}</option>
            <option value="inactive">{t('statusInactiveLabel') || 'غير نشط (Inactive)'}</option>
            <option value="suspended">{t('statusSuspendedLabel') || 'معلق (Suspended)'}</option>
          </select>
        </div>
      </div>

      {/* Row 2: Bio / Description */}
      <div className="form-group" style={{ marginBottom: 16 }}>
        <label className="form-label">{t('workspaceBioLabel') || t('bio') || 'نبذة عن مساحة العمل'}</label>
        <textarea
          className="form-textarea"
          value={basicForm.bio || ''}
          onChange={(e) => setBasicForm({ ...basicForm, bio: e.target.value })}
          rows={3}
          placeholder={t('workspaceBioPlaceholder') || 'اكتب نبذة مختصرة عن نشاط مساحة العمل...'}
          disabled={!canEdit}
        />
      </div>

      {/* Row 3: Email, Phone, Website */}
      <div className="form-row" style={{ gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div className="form-group">
          <label className="form-label">{t('emailAddressLabel') || t('emailAddress') || 'البريد الإلكتروني'}</label>
          <input
            type="email"
            className="form-input"
            value={basicForm.email || ''}
            onChange={(e) => setBasicForm({ ...basicForm, email: e.target.value })}
            disabled={!canEdit}
          />
        </div>

        <div className="form-group">
          <label className="form-label">{t('phoneNumberLabel') || t('phoneNumber') || 'رقم الهاتف'}</label>
          <input
            type="tel"
            className="form-input"
            value={basicForm.phone || ''}
            onChange={(e) => setBasicForm({ ...basicForm, phone: e.target.value })}
            placeholder="+966 5XX XXX XXXX"
            disabled={!canEdit}
          />
        </div>

        <div className="form-group">
          <label className="form-label">{t('websiteUrlLabel') || 'الموقع الإلكتروني'}</label>
          <input
            type="url"
            className="form-input"
            value={basicForm.website_url || ''}
            onChange={(e) => setBasicForm({ ...basicForm, website_url: e.target.value })}
            placeholder="https://example.com"
            disabled={!canEdit}
          />
        </div>
      </div>

      {/* Row 4: Type, Country, State, City */}
      <div className="form-row" style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 16, marginBottom: 24 }}>
        <div className="form-group">
          <label className="form-label">{t('industryCategoryLabel') || 'النوع / المجال'}</label>
          <SearchableSelect
            value={basicForm.workspace_type_id}
            options={typeOptions}
            placeholder={t('selectWorkspaceType') || '-- اختر النوع / المجال --'}
            searchPlaceholder={t('searchWorkspaceType') || 'بحث في المجالات...'}
            disabled={!canEdit}
            onChange={(selectedVal) => setBasicForm({ ...basicForm, workspace_type_id: selectedVal ? Number(selectedVal) : '' })}
          />
        </div>

        <div className="form-group">
          <label className="form-label">{t('countryLabel') || 'الدولة'}</label>
          <SearchableSelect
            value={basicForm.country_id}
            options={countryOptions}
            placeholder={t('selectCountry') || '-- اختر الدولة --'}
            searchPlaceholder={t('searchCountries') || 'بحث في الدول...'}
            disabled={!canEdit}
            onChange={(selectedVal) => setBasicForm({ ...basicForm, country_id: selectedVal ? Number(selectedVal) : '', state_id: '', city_id: '' })}
          />
        </div>

        <div className="form-group">
          <label className="form-label">{t('stateProvinceLabel') || 'المنطقة / المحافظة'}</label>
          <SearchableSelect
            value={basicForm.state_id}
            options={stateOptions}
            placeholder={loadingStates ? (t('loading') || 'جاري التحميل...') : (t('selectState') || '-- اختر المنطقة / المحافظة --')}
            searchPlaceholder={t('searchStates') || 'بحث في المناطق...'}
            disabled={!canEdit || !basicForm.country_id || loadingStates}
            onChange={(selectedVal) => setBasicForm({ ...basicForm, state_id: selectedVal ? Number(selectedVal) : '', city_id: '' })}
          />
        </div>

        <div className="form-group">
          <label className="form-label">{t('cityLabel') || 'المدينة'}</label>
          <SearchableSelect
            value={basicForm.city_id}
            options={cityOptions}
            placeholder={loadingCities ? (t('loading') || 'جاري التحميل...') : (t('selectCity') || '-- اختر المدينة --')}
            searchPlaceholder={t('searchCities') || 'بحث في المدن...'}
            disabled={!canEdit || !basicForm.state_id || loadingCities}
            onChange={(selectedVal) => setBasicForm({ ...basicForm, city_id: selectedVal ? Number(selectedVal) : '' })}
          />
        </div>
      </div>

      {canEdit && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, paddingTop: 16, borderTop: '1px solid var(--border-light)' }}>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? (
              <>
                <span className="spinner spinner-sm" style={{ borderTopColor: '#fff' }} />
                {t('saving')}
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
