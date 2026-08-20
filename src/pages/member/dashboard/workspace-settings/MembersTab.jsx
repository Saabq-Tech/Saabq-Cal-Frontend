import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '../../../../context/LanguageContext';
import UserAvatar from '../../../../components/ui/UserAvatar';
import Icon from '../../../../components/common/Icon';


export default function MembersTab({ membersList, rolesList, canEdit, onSaveMember, onDeleteMember }) {
  const { t } = useLanguage();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({ editing_id: null, name: '', email: '', phone: '', role_id: '', status: 'active' });

  const handleOpenInvite = () => {
    setForm({ editing_id: null, name: '', email: '', phone: '', role_id: '', status: 'active' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (member) => {
    setForm({
      editing_id: member.id,
      name: member.name || '',
      email: member.email || '',
      phone: member.phone || '',
      role_id: member.role_id || member.role?.id || '',
      status: member.status || 'active',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (onSaveMember) {
      await onSaveMember(form);
    }
    setIsModalOpen(false);
  };

  const list = (Array.isArray(membersList) && membersList.length > 0) ? membersList : [];

  return (
    <div className="card-body">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14, marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--heading)' }}>
            {t('workspaceMembers') || 'أعضاء مساحة العمل'}
          </h2>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
            {t('workspaceMembersDesc') || 'إدارة فريق العمل، الأدوار، والصلاحيات الممنوحة لكل عضو'}
          </p>
        </div>
        {canEdit ? (
          <button className="btn btn-primary btn-sm" onClick={handleOpenInvite}>
            + {t('inviteMember') || 'دعوة عضو جديد'}
          </button>
        ) : (
          <span className="profile-badge unverified" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <Icon name="lock" size={12} />
            {t('readOnlyNotice') || 'العرض فقط (بدون تعديل)'}
          </span>
        )}
      </div>

      <div style={{ overflowX: 'auto', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)' }}>
        <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--surface-alt)', borderBottom: '1px solid var(--border-light)', textAlign: 'start' }}>
              <th style={{ padding: '14px 16px', fontSize: '0.86rem', fontWeight: 700, color: 'var(--heading)' }}>{t('memberHeader') || 'العضو'}</th>
              <th style={{ padding: '14px 16px', fontSize: '0.86rem', fontWeight: 700, color: 'var(--heading)' }}>{t('roleHeader') || 'الدور'}</th>
              <th style={{ padding: '14px 16px', fontSize: '0.86rem', fontWeight: 700, color: 'var(--heading)' }}>{t('statusHeader') || 'الحالة'}</th>
              {canEdit && <th style={{ padding: '14px 16px', fontSize: '0.86rem', fontWeight: 700, color: 'var(--heading)', textAlign: 'end' }}>{t('actionsHeader') || 'الإجراءات'}</th>}
            </tr>
          </thead>
          <tbody>
            {list.map((m) => (
              <tr key={m.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                <td style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <UserAvatar name={m.name} avatarUrl={m.avatar_url} size={40} />
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--heading)' }}>{m.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{m.email}</div>
                  </div>
                </td>
                <td style={{ padding: '14px 16px', fontWeight: 600, fontSize: '0.88rem' }}>
                  {m.role ? (typeof m.role.name === 'object' ? (m.role.name[t('lang')] || m.role.name.ar || m.role.name.en) : m.role.name) : (t('memberRole') || 'عضو')}
                  {m.is_owner && (
                    <span className="profile-badge owner" style={{ marginInlineStart: 6, display: 'inline-flex', alignItems: 'center', gap: 4, background: 'var(--primary-subtle)', color: 'var(--primary)', fontWeight: 700 }}>
                      <Icon name="crown" size={12} />
                      {t('workspaceOwnerBadge') || 'مالك مساحة العمل'}
                    </span>
                  )}
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <span className={`profile-badge ${m.status === 'active' ? 'verified' : 'unverified'}`}>
                    {m.status === 'active' ? (t('statusActiveBadge') || 'نشط') : (t('statusInactiveBadge') || 'غير نشط')}
                  </span>
                </td>
                {canEdit && (
                  <td style={{ padding: '14px 16px', textAlign: 'end' }}>
                    {!m.is_owner && (
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => handleOpenEdit(m)}>
                          {t('edit') || 'تعديل'}
                        </button>
                        {onDeleteMember && (
                          <button type="button" className="btn btn-ghost btn-sm" style={{ color: '#ef4444' }} onClick={() => onDeleteMember(m)}>
                            {t('delete') || 'حذف'}
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Invite/Edit Member Modal */}
      {isModalOpen && createPortal(
        <div className="modal-backdrop">
          <div className="modal-card modal-sm animate-fade-in-up">
            <div className="modal-header">
              <h3 className="modal-title">
                {form.editing_id ? (t('editMemberModalTitle') || 'تعديل بيانات العضو والدور') : (t('inviteModalTitle') || 'دعوة عضو جديد إلى مساحة العمل')}
              </h3>
              <button type="button" className="modal-close-btn" onClick={() => setIsModalOpen(false)}>
                <Icon name="x" size={16} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="modal-body">
              <div className="form-group">
                <label className="form-label">{t('fullNameLabel') || 'الاسم الكامل *'}</label>
                <input type="text" className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">{t('emailAddressLabel') || 'البريد الإلكتروني *'}</label>
                <input type="email" className="form-input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">{t('optionalPhoneLabel') || 'رقم الهاتف (اختياري)'}</label>
                <input type="text" className="form-input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">{t('assignedRoleLabel') || 'الدور المسند في مساحة العمل'}</label>
                <select className="form-select" value={form.role_id} onChange={(e) => setForm({ ...form, role_id: e.target.value })}>
                  <option value="">{t('selectRoleOption') || '-- اختر الدور --'}</option>
                  {rolesList.map((r) => (
                    <option key={r.id} value={r.id}>{typeof r.name === 'object' ? (r.name[t('lang')] || r.name.ar || r.name.en) : r.name}</option>
                  ))}
                </select>
              </div>
              {form.editing_id && (
                <div className="form-group">
                  <label className="form-label">{t('memberStatusLabel') || 'حالة العضو'}</label>
                  <select className="form-select" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                    <option value="active">● {t('statusActiveBadge') || 'نشط'} (Active)</option>
                    <option value="inactive">{t('statusInactiveBadge') || 'غير نشط'} (Inactive)</option>
                  </select>
                </div>
              )}
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setIsModalOpen(false)}>{t('cancel')}</button>
                <button type="submit" className="btn btn-primary btn-sm">{form.editing_id ? (t('saveEditsBtn') || 'حفظ التعديلات') : (t('sendInviteBtn') || 'إرسال الدعوة')}</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
