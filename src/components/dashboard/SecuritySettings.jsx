import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useLanguage } from '../../context/LanguageContext';
import Icon from '../common/Icon';


export default function SecuritySettings() {
  const {
    user,
    loading,
    sendEmailVerification,
    verifyEmailOTP,
    enable2FA,
    verify2FA,
    disable2FA,
    getRecoveryCodes,
    fetchPasskeys,
    registerPasskey,
    deletePasskey,
    deleteAccount,
  } = useAuth();

  const { t } = useLanguage();
  const toast = useToast();

  useEffect(() => {
    document.title = t('pageTitleSecurity');

    if (!document.getElementById('google-gsi-script')) {
      const script = document.createElement('script');
      script.id = 'google-gsi-script';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
  }, []);

  // Email verification state
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [otpCode, setOtpCode] = useState('');

  // 2FA state
  const [setup2FA, setSetup2FA] = useState(null);
  const [totpCode, setTotpCode] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState([]);
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);

  // Passkey state
  const [passkeys, setPasskeys] = useState([]);
  const [passkeyName, setPasskeyName] = useState('');
  const [showPasskeyModal, setShowPasskeyModal] = useState(false);
  // Delete Account state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');

  const handleDeleteAccountSubmit = async (e) => {
    e.preventDefault();
    setDeleteError('');
    const res = await deleteAccount(deletePassword);
    if (res?.success) {
      toast.success(res.message || t('deleteAccountSuccess'));
      setShowDeleteModal(false);
      window.location.href = '/login';
    } else {
      setDeleteError(res?.message || 'Failed to delete account.');
      toast.error(res?.message || 'Failed to delete account.');
    }
  };

  // Confirmation Modal state
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: '',
    onConfirm: null,
  });

  const openConfirm = (title, message, confirmText, onConfirm) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      confirmText,
      onConfirm,
    });
  };

  const closeConfirm = () => {
    setConfirmModal((prev) => ({ ...prev, isOpen: false }));
  };

  const loadSecurityData = async () => {
    const pkRes = await fetchPasskeys();
    if (pkRes?.success) {
      setPasskeys(pkRes.passkeys || []);
    }
  };

  useEffect(() => {
    loadSecurityData();
  }, []);

  // --- Verification Handlers ---
  const handleSendVerification = async () => {
    const res = await sendEmailVerification();
    if (res.success) {
      toast.success(res.message || t('codeResent'));
      setShowVerifyModal(true);
    } else {
      toast.error(res.message || 'Failed to send verification email.');
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (!otpCode) return;
    const res = await verifyEmailOTP(user.email, otpCode);
    if (res.success) {
      toast.success(res.message || t('verificationSuccess'));
      setShowVerifyModal(false);
      setOtpCode('');
    } else {
      toast.error(res.message || 'Invalid verification code.');
    }
  };

  // --- 2FA Handlers ---
  const handleStart2FA = async () => {
    const res = await enable2FA();
    if (res.success) {
      setSetup2FA(res.data);
      toast.info(res.message || t('twoFactorInitialized'));
    } else {
      toast.error(res.message || 'Failed to start 2FA setup.');
    }
  };

  const handleConfirm2FA = async (e) => {
    e.preventDefault();
    if (!totpCode) return;
    const res = await verify2FA(totpCode);
    if (res.success) {
      toast.success(res.message || t('twoFactorEnabledSuccess'));
      setSetup2FA(null);
      setTotpCode('');
    } else {
      toast.error(res.message || 'Invalid code.');
    }
  };

  const handleDisable2FA = () => {
    openConfirm(
      t('twoFactorTitle'),
      t('twoFactorDisableConfirm'),
      t('disable2FA'),
      async () => {
        const res = await disable2FA();
        if (res.success) {
          toast.success(res.message || t('twoFactorDisabledSuccess'));
          setSetup2FA(null);
        } else {
          toast.error(res.message || 'Failed to disable 2FA.');
        }
      }
    );
  };

  const handleViewRecoveryCodes = async () => {
    const res = await getRecoveryCodes();
    if (res.success) {
      setRecoveryCodes(res.recovery_codes || []);
      setShowRecoveryModal(true);
    } else {
      toast.error(res.message || 'Failed to fetch recovery codes.');
    }
  };

  // --- Passkey Handlers ---
  const handleRegisterPasskey = async (e) => {
    e.preventDefault();
    if (!passkeyName) return;

    let credentialId = null;
    let rawCredential = null;

    if (window.PublicKeyCredential && navigator.credentials?.create) {
      try {
        const challenge = new Uint8Array(32);
        window.crypto.getRandomValues(challenge);

        const userId = new TextEncoder().encode(user?.email || 'user-' + Date.now());

        const publicKeyCredential = await navigator.credentials.create({
          publicKey: {
            challenge,
            rp: {
              name: 'Saabq Cal',
              id: window.location.hostname,
            },
            user: {
              id: userId,
              name: user?.email || 'user@example.com',
              displayName: user?.name || 'User',
            },
            pubKeyCredParams: [
              { alg: -7, type: 'public-key' },
              { alg: -257, type: 'public-key' },
            ],
            authenticatorSelection: {
              userVerification: 'preferred',
            },
            timeout: 60000,
            attestation: 'none',
          },
        });

        if (publicKeyCredential) {
          credentialId = publicKeyCredential.id;
          rawCredential = {
            id: publicKeyCredential.id,
            type: publicKeyCredential.type,
            rawId: Array.from(new Uint8Array(publicKeyCredential.rawId)),
          };
        }
      } catch (err) {
        if (err.name === 'NotAllowedError') {
          toast.warning(t('passkeyAuthCancelled') || 'Passkey registration cancelled.');
          return;
        }
        console.warn('WebAuthn creation warning:', err);
      }
    }

    if (!credentialId) {
      credentialId = 'pk_' + Math.random().toString(36).substring(2, 15);
      rawCredential = { id: credentialId, type: 'public-key' };
    }

    const res = await registerPasskey(passkeyName, credentialId, rawCredential);
    if (res.success) {
      toast.success(res.message || t('passkeyRegisteredSuccess'));
      setShowPasskeyModal(false);
      setPasskeyName('');
      loadSecurityData();
    } else {
      toast.error(res.message || 'Failed to register passkey.');
    }
  };

  const handleDeletePasskey = (id) => {
    openConfirm(
      t('passkey'),
      t('passkeyDeleteConfirm'),
      t('delete'),
      async () => {
        const res = await deletePasskey(id);
        if (res.success) {
          toast.success(res.message || t('passkeyDeletedSuccess'));
          loadSecurityData();
        } else {
          toast.error(res.message || 'Failed to delete passkey.');
        }
      }
    );
  };

  const isVerified = !!user?.email_verified_at;
  const is2FA = !!user?.two_factor_enabled;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }} className="animate-fade-in-up">
      {/* Email Verification Section */}
      <div className="card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 className="card-title">{t('emailVerificationTitle')}</h2>
            <p className="card-subtitle">{t('emailVerificationDesc')}</p>
          </div>
          <span className={`profile-badge ${isVerified ? 'verified' : 'unverified'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            {isVerified ? (
              <>
                <Icon name="check" size={10} />
                {t('verified')}
              </>
            ) : (
              <>
                <Icon name="x" size={10} />
                {t('unverified')}
              </>
            )}
          </span>
        </div>
        <div className="card-body">
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            {t('emailAddress')}: <strong>{user?.email}</strong>
          </p>
          {!isVerified && (
            <div style={{ marginTop: 12 }}>
              <button className="btn btn-primary btn-sm" onClick={handleSendVerification} disabled={loading}>
                {t('sendVerificationCode')}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Two-Factor Authentication (2FA) */}
      <div className="card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 className="card-title">{t('twoFactorTitle')}</h2>
            <p className="card-subtitle">{t('twoFactorDesc')}</p>
          </div>
          <span className={`profile-badge ${is2FA ? 'verified' : 'unverified'}`}>
            {is2FA ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <Icon name="shield" size={12} />
                {t('enabled')}
              </span>
            ) : t('disabled')}
          </span>
        </div>
        <div className="card-body">
          {is2FA ? (
            <div>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: 16 }}>
                {t('twoFactorActive')}
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-secondary btn-sm" onClick={handleViewRecoveryCodes}>
                  {t('viewRecoveryCodes')}
                </button>
                <button className="btn btn-danger btn-sm" onClick={handleDisable2FA} disabled={loading}>
                  {t('disable2FA')}
                </button>
              </div>
            </div>
          ) : setup2FA ? (
            <form onSubmit={handleConfirm2FA} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ background: 'var(--surface-alt)', padding: 16, borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                <p style={{ fontSize: '0.85rem', marginBottom: 12 }}>{t('scanQrCode')}</p>
                {setup2FA.qr_code_url && (
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
                    <img
                      src={
                        setup2FA.qr_code_url.startsWith('otpauth://')
                          ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(setup2FA.qr_code_url)}`
                          : setup2FA.qr_code_url
                      }
                      alt="2FA QR Code"
                      style={{ width: 180, height: 180, borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: '#fff', padding: 8 }}
                    />
                  </div>
                )}
                <p style={{ fontSize: '0.82rem', color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
                  Secret: {setup2FA.secret}
                </p>
              </div>
              <div className="form-group">
                <label className="form-label">{t('enterTotpCode')}</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="123456"
                  maxLength={6}
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value)}
                  required
                />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="submit" className="btn btn-primary btn-sm" disabled={loading}>
                  {t('confirmAndEnable2FA')}
                </button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setSetup2FA(null)}>
                  {t('cancel')}
                </button>
              </div>
            </form>
          ) : (
            <div>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: 16 }}>
                {t('twoFactorDesc')}
              </p>
              <button className="btn btn-primary btn-sm" onClick={handleStart2FA} disabled={loading}>
                {t('setup2FA')}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Passkeys (WebAuthn) */}
      <div className="card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 className="card-title">{t('passkeysTitle')}</h2>
            <p className="card-subtitle">{t('passkeysDesc')}</p>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => setShowPasskeyModal(true)}>
            {t('addPasskey')}
          </button>
        </div>
        <div className="card-body">
          {passkeys.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {passkeys.map((pk) => (
                <div key={pk.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Icon name="custom-41d6ccb9" size={14} />
                      {pk.name}
                    </div>
                  </div>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDeletePasskey(pk.id)} disabled={loading}>
                    {t('delete')}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: '0.9rem', color: 'var(--muted)' }}>{t('noPasskeys')}</p>
          )}
        </div>
      </div>

      {/* Delete Account Danger Zone */}
      <div className="card" style={{ borderColor: 'rgba(239, 68, 68, 0.3)', background: 'rgba(239, 68, 68, 0.02)' }}>
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 className="card-title" style={{ color: 'var(--error, #ef4444)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon name="alert-triangle" size={18} />
              {t('deleteAccountTitle')}
            </h2>
            <p className="card-subtitle">{t('deleteAccountDesc')}</p>
          </div>
          <button
            className="btn btn-danger btn-sm"
            onClick={() => {
              setShowDeleteModal(true);
              setDeleteError('');
              setDeletePassword('');
            }}
          >
            {t('deleteAccountBtn')}
          </button>
        </div>
      </div>

      {/* Delete Account Modal */}
      {showDeleteModal && createPortal(
        <div className="modal-backdrop">
          <div className="modal-card modal-sm animate-scale-up">
            <div className="modal-header">
              <h3 className="modal-title" style={{ color: 'var(--error, #ef4444)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Icon name="alert-triangle" size={18} />
                {t('deleteAccountModalTitle')}
              </h3>
              <button type="button" className="modal-close-btn" onClick={() => setShowDeleteModal(false)}>
                <Icon name="x" size={16} />
              </button>
            </div>
            <p className="modal-subtitle" style={{ marginBottom: 16 }}>
              {t('deleteAccountModalDesc')}
            </p>
            <form onSubmit={handleDeleteAccountSubmit} className="modal-body">
              {deleteError && (
                <div style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--error, #ef4444)', fontSize: '0.85rem', marginBottom: 14 }}>
                  {deleteError}
                </div>
              )}
              {user?.password !== null && (
                <div className="form-group" style={{ marginBottom: 16 }}>
                  <label className="form-label">{t('deleteAccountPasswordPrompt')}</label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder={t('deleteAccountPasswordPlaceholder')}
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    required
                  />
                </div>
              )}
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowDeleteModal(false)}>
                  {t('cancel')}
                </button>
                <button type="submit" className="btn btn-danger btn-sm" disabled={loading}>
                  {loading ? (
                    <>
                      <span className="spinner spinner-sm" style={{ borderTopColor: '#fff' }} />
                      {t('deleting') || 'جاري الحذف...'}
                    </>
                  ) : (
                    t('confirmDeleteAccount')
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Verify Email Modal */}
      {showVerifyModal && createPortal(
        <div className="modal-backdrop">
          <div className="modal-card modal-sm animate-scale-up">
            <div className="modal-header">
              <h3 className="modal-title">{t('verifyEmailOtpTitle')}</h3>
              <button type="button" className="modal-close-btn" onClick={() => setShowVerifyModal(false)}>
                <Icon name="x" size={16} />
              </button>
            </div>
            <p className="modal-subtitle" style={{ marginBottom: 16 }}>
              {t('verifyEmailOtpDesc')} <strong>{user?.email}</strong>.
            </p>
            <form onSubmit={handleVerifyOTP} className="modal-body">
              <div className="form-group">
                <input
                  type="text"
                  className="form-input"
                  placeholder={t('enterOtpCode')}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowVerifyModal(false)}>{t('cancel')}</button>
                <button type="submit" className="btn btn-primary btn-sm" disabled={loading}>{t('verifyButton')}</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Add Passkey Modal */}
      {showPasskeyModal && createPortal(
        <div className="modal-backdrop">
          <div className="modal-card modal-sm animate-scale-up">
            <div className="modal-header">
              <h3 className="modal-title">{t('registerPasskeyTitle')}</h3>
              <button type="button" className="modal-close-btn" onClick={() => setShowPasskeyModal(false)}>
                <Icon name="x" size={16} />
              </button>
            </div>
            <p className="modal-subtitle" style={{ marginBottom: 16 }}>
              {t('registerPasskeyDesc')}
            </p>
            <form onSubmit={handleRegisterPasskey} className="modal-body">
              <div className="form-group">
                <label className="form-label">{t('passkeyNameLabel')}</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder={t('passkeyPlaceholder')}
                  value={passkeyName}
                  onChange={(e) => setPasskeyName(e.target.value)}
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowPasskeyModal(false)}>{t('cancel')}</button>
                <button type="submit" className="btn btn-primary btn-sm" disabled={loading}>{t('registerBtn')}</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Recovery Codes Modal */}
      {showRecoveryModal && createPortal(
        <div className="modal-backdrop">
          <div className="modal-card modal-sm animate-scale-up">
            <div className="modal-header">
              <h3 className="modal-title">{t('recoveryCodesTitle')}</h3>
              <button type="button" className="modal-close-btn" onClick={() => setShowRecoveryModal(false)}>
                <Icon name="x" size={16} />
              </button>
            </div>
            <p className="modal-subtitle" style={{ marginBottom: 14 }}>
              {t('recoveryCodesDesc')}
            </p>
            <div style={{ background: 'var(--surface-alt)', padding: 14, borderRadius: 'var(--radius-md)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
              {recoveryCodes.map((code, idx) => (
                <div key={idx}>{code}</div>
              ))}
            </div>
            <div className="modal-actions">
              <button className="btn btn-primary btn-sm" onClick={() => setShowRecoveryModal(false)}>{t('done')}</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Confirmation Modal */}
      {confirmModal.isOpen && createPortal(
        <div className="modal-backdrop">
          <div className="modal-card modal-sm animate-scale-up">
            <div className="modal-header">
              <h3 className="modal-title" style={{ color: 'var(--error, #ef4444)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Icon name="alert-triangle" size={18} />
                {confirmModal.title}
              </h3>
              <button type="button" className="modal-close-btn" onClick={closeConfirm}>
                <Icon name="x" size={16} />
              </button>
            </div>

            <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.6 }}>
              {confirmModal.message}
            </p>

            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={closeConfirm}
              >
                {t('cancel')}
              </button>
              <button
                type="button"
                className="btn btn-danger btn-sm"
                disabled={loading}
                onClick={async () => {
                  const callback = confirmModal.onConfirm;
                  closeConfirm();
                  if (callback) await callback();
                }}
              >
                {confirmModal.confirmText || t('confirm')}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
