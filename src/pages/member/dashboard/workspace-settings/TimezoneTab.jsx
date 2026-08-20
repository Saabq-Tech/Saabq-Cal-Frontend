import { useLanguage } from '../../../../context/LanguageContext';
import { endpoints } from '../../../../api/client';
import SearchableSelect from '../../../../components/common/SearchableSelect';

export default function TimezoneTab({ timezoneForm, setTimezoneForm, timezones = [], onSave, saving, canEdit }) {
  const { t } = useLanguage();

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(timezoneForm, endpoints.workspaceSettingsTimezone);
  };

  const tzList = Array.isArray(timezones) && timezones.length > 0 ? timezones : [
    { id: 1, name: 'Asia/Riyadh', label: 'Asia/Riyadh (GMT+3)', offset: '+03:00' },
    { id: 2, name: 'Asia/Dubai', label: 'Asia/Dubai (GMT+4)', offset: '+04:00' },
    { id: 3, name: 'Africa/Cairo', label: 'Africa/Cairo (GMT+2)', offset: '+02:00' },
    { id: 4, name: 'UTC', label: 'UTC (GMT+0)', offset: '+00:00' },
  ];

  const tzOptions = tzList.map((tz) => ({
    value: tz.name,
    label: tz.label || `${tz.name} (GMT${tz.offset || ''})`,
    id: tz.id,
    raw: tz,
  }));

  return (
    <form className="card-body" onSubmit={handleSubmit}>
      <h3 style={{ fontSize: '1.1rem', marginBottom: 16 }}>{t('workspaceTimezone') || 'إعدادات التوقيت والتاريخ'}</h3>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">{t('timezone') || 'المنطقة الزمنية'}</label>
          <SearchableSelect
            value={timezoneForm.timezone}
            options={tzOptions}
            placeholder={t('selectTimezone') || '-- اختر المنطقة الزمنية --'}
            searchPlaceholder={t('searchTimezones') || 'بحث في المناطق الزمنية...'}
            disabled={!canEdit}
            onChange={(selectedVal, rawObj) => {
              const foundTz = rawObj?.raw || rawObj;
              setTimezoneForm({
                ...timezoneForm,
                timezone: selectedVal,
                timezone_id: foundTz?.id || timezoneForm.timezone_id,
              });
            }}
          />
        </div>

        <div className="form-group">
          <label className="form-label">{t('timeFormat') || 'صيغة الوقت'}</label>
          <select
            className="form-select"
            value={timezoneForm.time_format}
            onChange={(e) => setTimezoneForm({ ...timezoneForm, time_format: e.target.value })}
            disabled={!canEdit}
          >
            <option value="12h">{t('timeFormat12') || '12 ساعة (02:30 PM)'}</option>
            <option value="24h">{t('timeFormat24') || '24 ساعة (14:30)'}</option>
          </select>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">{t('weekStart') || 'بداية الأسبوع'}</label>
          <select
            className="form-select"
            value={timezoneForm.start_of_week || 'sunday'}
            onChange={(e) => setTimezoneForm({ ...timezoneForm, start_of_week: e.target.value })}
            disabled={!canEdit}
          >
            <option value="sunday">{t('daySunday') || 'الأحد'}</option>
            <option value="monday">{t('dayMonday') || 'الإثنين'}</option>
            <option value="saturday">{t('daySaturday') || 'السبت'}</option>
          </select>
        </div>
      </div>

      {canEdit && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? (
              <>
                <span className="spinner spinner-sm" style={{ borderTopColor: '#fff' }} />
                {t('saving')}
              </>
            ) : (
              t('saveChanges')
            )}
          </button>
        </div>
      )}
    </form>
  );
}
