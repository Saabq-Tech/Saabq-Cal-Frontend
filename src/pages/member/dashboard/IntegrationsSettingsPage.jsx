import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { useLanguage } from '../../../context/LanguageContext';
import SEO from '../../../components/ui/SEO';
import Icon from '../../../components/common/Icon';
import client, { endpoints } from '../../../api/client';
import PermissionCheck from '../../../components/PermissionCheck';
import TelegramActionBuilder from '../../../components/dashboard/TelegramActionBuilder';

// Helper function to safely render strings or localized objects
function getLocalizedText(textObj, currentLang = 'ar') {
  if (!textObj) return '';
  if (typeof textObj === 'string') return textObj;
  if (typeof textObj === 'object') {
    return textObj[currentLang] || textObj.ar || textObj.en || Object.values(textObj)[0] || '';
  }
  return String(textObj);
}

// Custom iOS-style Toggle Switch Component

function ToggleSwitch({ checked, onChange, disabled = false }) {
  return (
    <label style={{ position: 'relative', display: 'inline-block', width: 44, height: 24, cursor: disabled ? 'not-allowed' : 'pointer', flexShrink: 0, opacity: disabled ? 0.6 : 1 }}>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        style={{ opacity: 0, width: 0, height: 0 }}
      />
      <span
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: checked ? 'var(--primary)' : 'var(--border)',
          borderRadius: 24,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: checked ? '0 2px 8px rgba(32, 123, 89, 0.3)' : 'none',
        }}
      >
        <span
          style={{
            position: 'absolute',
            height: 18,
            width: 18,
            left: checked ? 22 : 3,
            bottom: 3,
            backgroundColor: '#ffffff',
            borderRadius: '50%',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: '0 2px 4px rgba(0,0,0,0.18)',
          }}
        />
      </span>
    </label>
  );
}

export default function IntegrationsSettingsPage() {
  const {
    loading,
    fetchGoogleIntegration,
    connectGoogleIntegration,
    disconnectGoogleIntegration,
    fetchWebhookIntegration,
    saveWebhookIntegration,
    deleteWebhookIntegration,
    fetchTelegramIntegration,
    saveTelegramIntegration,
    deleteTelegramIntegration,
    fetchEmailIntegration,
    saveEmailIntegration,
    deleteEmailIntegration,
    testEmailIntegration,
  } = useAuth();


  const { t } = useLanguage();
  const toast = useToast();

  const defaultTelegramActionConfig = {
    states: {
      pending: [
        { action: 'confirm', text: '✅ ' + (t('confirm') || 'تأكيد'), target_status: 'confirmed' },
        { action: 'reject', text: '❌ ' + (t('reject') || 'رفض'), target_status: 'cancelled' }
      ]
    }
  };



  useEffect(() => {
    document.title = t('applicationsTitle') || 'Applications & Integrations';

    if (!document.getElementById('google-gsi-script')) {
      const script = document.createElement('script');
      script.id = 'google-gsi-script';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Active Category Filter Tab
  const [activeTab, setActiveTab] = useState('all');

  // Active Modal Integration State
  const [activeModalId, setActiveModalId] = useState(null);

  // Google Integration state
  const [googleIntegration, setGoogleIntegration] = useState(null);

  // Settings & Configuration States
  const [calendarSync, setCalendarSync] = useState(true);
  const [calendarId, setCalendarId] = useState('primary');
  const [autoMeet, setAutoMeet] = useState(true);
  const [sheetsSync, setSheetsSync] = useState(true);
  const [sheetLanguage, setSheetLanguage] = useState('ar');
  const [spreadsheetId, setSpreadsheetId] = useState('');
  const [showSheetId, setShowSheetId] = useState(false);

  const [webhookUrl, setWebhookUrl] = useState('');
  const [isWebhookConfigured, setIsWebhookConfigured] = useState(false);
  const [webhookEvents, setWebhookEvents] = useState({
    booking_created: true,
    booking_confirmed: true,
    booking_cancelled: false,
  });

  // Telegram Integration State
  const [telegramIntegration, setTelegramIntegration] = useState(null);
  const [telegramBotType, setTelegramBotType] = useState('default');
  const [telegramBotToken, setTelegramBotToken] = useState('');
  const [telegramChatId, setTelegramChatId] = useState('');
  const [telegramChats, setTelegramChats] = useState([]);
  const [telegramEnableActionButtons, setTelegramEnableActionButtons] = useState(true);
  const [telegramActionButtonsConfig, setTelegramActionButtonsConfig] = useState('');
  const [telegramIsActive, setTelegramIsActive] = useState(true);
  const [services, setServices] = useState([]);
  const [showChatId, setShowChatId] = useState(false);

  // Email Integration State
  const [emailIntegration, setEmailIntegration] = useState(null);
  const [mailDriver, setMailDriver] = useState('resend'); // 'smtp' or 'resend'
  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState(587);
  const [smtpUsername, setSmtpUsername] = useState('');
  const [smtpPassword, setSmtpPassword] = useState('');
  const [resendApiKey, setResendApiKey] = useState('');
  const [fromAddress, setFromAddress] = useState('');
  const [fromName, setFromName] = useState('');
  const [showSmtpPassword, setShowSmtpPassword] = useState(false);
  const [showResendKey, setShowResendKey] = useState(false);
  const [emailIsActive, setEmailIsActive] = useState(true);



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
    const gRes = await fetchGoogleIntegration();
    if (gRes?.success && gRes.data) {
      setGoogleIntegration(gRes.data);
      setCalendarSync(!!gRes.data.calendar_sync_enabled);
      setAutoMeet(!!gRes.data.auto_create_meet_links);
      setSheetsSync(!!gRes.data.sheets_sync_enabled);
      if (gRes.data.spreadsheet_id) setSpreadsheetId(gRes.data.spreadsheet_id);
      if (gRes.data.calendar_id) setCalendarId(gRes.data.calendar_id);
    } else {
      setGoogleIntegration(null);
      setCalendarSync(false);
      setAutoMeet(false);
      setSheetsSync(false);
    }

    const wRes = await fetchWebhookIntegration();
    if (wRes?.success && wRes.data) {
      setWebhookUrl(wRes.data.url || '');
      setIsWebhookConfigured(!!wRes.data.is_configured);
      const events = wRes.data.events || [];
      setWebhookEvents({
        booking_created: events.includes('booking.created'),
        booking_confirmed: events.includes('booking.confirmed'),
        booking_cancelled: events.includes('booking.cancelled'),
      });
    } else {
      setWebhookUrl('');
      setIsWebhookConfigured(false);
    }

    const tRes = await fetchTelegramIntegration();
    if (tRes?.success && tRes.data) {
      setTelegramIntegration(tRes.data);
      setTelegramBotType(tRes.data.bot_type || 'default');
      setTelegramChatId(tRes.data.chat_id || '');
      setTelegramChats(tRes.data.chats && tRes.data.chats.length > 0 ? tRes.data.chats : [{
        id: 1,
        title: t('defaultChatTitle') || 'شات افتراضي',
        chat_id: tRes.data.chat_id || '',
        service_ids: [],
      }]);
      setTelegramEnableActionButtons(tRes.data.enable_action_buttons !== false);
      setTelegramActionButtonsConfig(tRes.data.action_buttons_config ? JSON.stringify(tRes.data.action_buttons_config, null, 2) : JSON.stringify(defaultTelegramActionConfig, null, 2));
      setTelegramIsActive(!!tRes.data.is_active);
    } else {
      setTelegramIntegration(null);
      setTelegramBotType('default');
      setTelegramChatId('');
      setTelegramChats([{
        id: 1,
        title: t('defaultChatTitle') || 'شات افتراضي',
        chat_id: '',
        service_ids: [],
      }]);
      setTelegramEnableActionButtons(true);
      setTelegramActionButtonsConfig(JSON.stringify(defaultTelegramActionConfig, null, 2));
      setTelegramIsActive(true);
    }

    const eRes = await fetchEmailIntegration();
    if (eRes?.success && eRes.data) {
      setEmailIntegration(eRes.data);
      setMailDriver(eRes.data.mail_driver || 'resend');
      setSmtpHost(eRes.data.smtp_host || '');
      setSmtpPort(eRes.data.smtp_port || 587);
      setSmtpUsername(eRes.data.smtp_username || '');
      setFromAddress(eRes.data.from_address || '');
      setFromName(eRes.data.from_name || '');
      setEmailIsActive(!!eRes.data.is_active);
    } else {
      setEmailIntegration(null);
      setMailDriver('resend');
      setSmtpHost('');
      setSmtpPort(587);
      setSmtpUsername('');
      setSmtpPassword('');
      setResendApiKey('');
      setFromAddress('');
      setFromName('');
      setEmailIsActive(true);
    }

    try {
      const sRes = await client.get(endpoints.workspaceServices);
      if (sRes?.data?.data) {
        setServices(sRes.data.data);
      }
    } catch {
      // ignore
    }
  };


  useEffect(() => {
    loadSecurityData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Google Integration Handlers ---
  const handleStartGoogleOAuth = () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '333771442482-0ip5t2oeentnfm6rjac75fj40891iuam.apps.googleusercontent.com';

    const handleConnectResponse = async (payload) => {
      const res = await connectGoogleIntegration(payload);
      if (res.success) {
        if (res.data?.requires_confirmation) {
          openConfirm(
            t('googleIntegrationTitle') || 'ربط حساب جوجل',
            res.message || res.data?.message,
            t('confirm') || 'تأكيد',
            async () => {
              const retryPayload = {
                ...payload,
                confirm_replace: true,
              };
              
              // Remove one-time code and use the exchanged tokens instead
              if (retryPayload.code) {
                delete retryPayload.code;
              }
              retryPayload.token = res.data.token;
              retryPayload.refresh_token = res.data.refresh_token;
              if (res.data.expires_in) retryPayload.expires_in = res.data.expires_in;

              const retryRes = await connectGoogleIntegration(retryPayload);
              if (retryRes.success) {
                toast.success(retryRes.message || t('googleConnectedSuccess'));
                loadSecurityData();
              } else {
                toast.error(retryRes.message || 'Failed to connect Google account.');
              }
            }
          );
        } else {
          toast.success(res.message || t('googleConnectedSuccess'));
          loadSecurityData();
        }
      } else {
        const confirmMsg = res.errors?.confirm_replace?.[0] || res.message;
        if (confirmMsg) {
          toast.error(confirmMsg);
        } else {
          toast.error(res.message || 'Failed to connect Google account.');
        }
      }
    };

    if (window.google?.accounts?.oauth2?.initCodeClient) {
      const codeClient = window.google.accounts.oauth2.initCodeClient({
        client_id: clientId,
        scope: 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile openid',
        ux_mode: 'popup',
        callback: async (response) => {
          if (response.error && response.error !== 'popup_closed') {
            toast.error(t('googleAuthFailed'));
            return;
          }
          if (response.code) {
            await handleConnectResponse({
              code: response.code,
              calendar_sync_enabled: true,
              auto_create_meet_links: true,
              sheets_sync_enabled: true,
              spreadsheet_id: spreadsheetId || undefined,
              calendar_id: calendarId || undefined,
            });
          }
        },
      });
      codeClient.requestCode();
    } else if (window.google?.accounts?.oauth2?.initTokenClient) {
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile openid',
        callback: async (response) => {
          if (response.error && response.error !== 'popup_closed') {
            toast.error(t('googleAuthFailed'));
            return;
          }
          if (response.access_token) {
            await handleConnectResponse({
              token: response.access_token,
              calendar_sync_enabled: true,
              auto_create_meet_links: true,
              sheets_sync_enabled: true,
              spreadsheet_id: spreadsheetId || undefined,
              calendar_id: calendarId || undefined,
            });
          }
        },
      });
      tokenClient.requestAccessToken();
    } else {
      toast.error(t('googleSdkLoading'));
    }
  };

  const handleDisconnectGoogle = () => {
    openConfirm(
      t('googleIntegrationTitle') || 'حساب جوجل المترابط',
      t('googleDisconnectConfirm') || 'هل أنت تأكد من رغبتك في إلغاء ربط حساب جوجل المترابط؟',
      t('disconnect') || 'إلغاء الربط',
      async () => {
        const res = await disconnectGoogleIntegration();
        if (res.success) {
          toast.success(res.message || t('googleDisconnectedSuccess'));
          setGoogleIntegration(null);
          setCalendarSync(false);
          setAutoMeet(false);
          setSheetsSync(false);
        } else {
          toast.error(res.message || 'Failed to disconnect Google account.');
        }
      }
    );
  };

  const handleSaveCalendarSettings = async () => {
    if (!googleIntegration) {
      toast.error(t('connectGoogleFirst') || 'الرجاء ربط حساب Google Workspace أولاً');
      return;
    }
    const res = await connectGoogleIntegration({
      calendar_sync_enabled: calendarSync,
      calendar_id: calendarId || 'primary',
    });
    if (res.success) {
      toast.success(t('calendarSettingsSaved') || 'تم حفظ إعدادات التقويم بنجاح');
      await loadSecurityData();
      setActiveModalId(null);
    } else {
      toast.error(res.message || 'Failed to save calendar settings');
    }
  };

  const handleSaveMeetSettings = async () => {
    if (!googleIntegration) {
      toast.error(t('connectGoogleFirst') || 'الرجاء ربط حساب Google Workspace أولاً');
      return;
    }
    const res = await connectGoogleIntegration({
      auto_create_meet_links: autoMeet,
    });
    if (res.success) {
      toast.success(t('updatedSuccess') || 'تم التحديث بنجاح');
      await loadSecurityData();
      setActiveModalId(null);
    } else {
      toast.error(res.message || 'Failed to save Google Meet settings');
    }
  };

  const handleSaveSheetsSettings = async () => {
    if (!googleIntegration) {
      toast.error(t('connectGoogleFirst') || 'الرجاء ربط حساب Google Workspace أولاً');
      return;
    }
    const res = await connectGoogleIntegration({
      sheets_sync_enabled: sheetsSync,
      spreadsheet_id: spreadsheetId || undefined,
      sheet_language: sheetLanguage || 'ar',
    });
    if (res.success) {
      toast.success(t('sheetsSettingsSaved') || 'تم حفظ إعدادات Google Sheets');
      await loadSecurityData();
      setActiveModalId(null);
    } else {
      toast.error(res.message || 'Failed to save Google Sheets settings');
    }
  };

  const handleSaveWebhookSettings = async () => {
    if (!webhookUrl) {
      toast.error(t('enterWebhookUrl') || 'يرجى إدخال رابط Webhook أولاً');
      return;
    }
    const selectedEvents = [];
    if (webhookEvents.booking_created) selectedEvents.push('booking.created');
    if (webhookEvents.booking_confirmed) selectedEvents.push('booking.confirmed');
    if (webhookEvents.booking_cancelled) selectedEvents.push('booking.cancelled');

    const res = await saveWebhookIntegration({
      url: webhookUrl,
      events: selectedEvents,
      is_active: true,
    });

    if (res?.success) {
      toast.success(res.message || t('webhookSettingsSaved') || 'تم حفظ رابط الـ Webhook والأحداث بنجاح');
      await loadSecurityData();
      setActiveModalId(null);
    } else {
      toast.error(res?.message || 'Failed to save Webhook settings');
    }
  };

  const handleDeleteWebhookSettings = () => {
    openConfirm(
      t('webhooksTitle') || 'Webhooks API',
      t('webhookDisconnectConfirm') || 'هل أنت تأكد من رغبتك في إلغاء رابط الـ Webhook؟',
      t('disconnect') || 'إلغاء الربط',
      async () => {
        const res = await deleteWebhookIntegration();
        if (res?.success) {
          toast.success(res.message || t('webhookDisconnectedSuccess') || 'تم إلغاء رابط الـ Webhook بنجاح');
          setWebhookUrl('');
          await loadSecurityData();
          setActiveModalId(null);
        } else {
          toast.error(res?.message || 'Failed to disconnect Webhook.');
        }
      }
    );
  };

  const handleSaveTelegramSettings = async () => {
    if (telegramBotType === 'custom' && !telegramBotToken && !telegramIntegration?.has_bot_token) {
      toast.error(t('botTokenLabel') || 'يرجى إدخال Token الخاص بالبوت');
      return;
    }

    let parsedConfig = null;
    if (telegramActionButtonsConfig.trim()) {
      try {
        parsedConfig = JSON.parse(telegramActionButtonsConfig);
      } catch {
        toast.error(t('invalidJsonConfig') || 'تنسيق JSON غير صالح لإعدادات الأزرار');
        return;
      }
    }

    const payload = {
      bot_type: telegramBotType,
      bot_token: telegramBotType === 'custom' ? (telegramBotToken || undefined) : undefined,
      chat_id: telegramChatId || undefined,
      chats: telegramChats,
      enable_action_buttons: telegramEnableActionButtons,
      action_buttons_config: parsedConfig,
      is_active: telegramIsActive,
    };

    const res = await saveTelegramIntegration(payload);
    if (res?.success) {
      toast.success(res.message || t('telegramSettingsSaved') || 'تم حفظ إعدادات Telegram بنجاح');
      await loadSecurityData();
      setActiveModalId(null);
    } else {
      toast.error(res?.message || 'Failed to save Telegram settings.');
    }
  };

  const handleDeleteTelegramSettings = () => {
    openConfirm(
      t('telegramTitle') || 'إعدادات Telegram',
      t('telegramDisconnectConfirm') || 'هل أنت تأكد من رغبتك في إلغاء ربط Telegram؟',
      t('disconnect') || 'إلغاء الربط',
      async () => {
        const res = await deleteTelegramIntegration();
        if (res?.success) {
          toast.success(res.message || t('telegramDisconnectedSuccess') || 'تم إلغاء ربط Telegram بنجاح');
          await loadSecurityData();
          setActiveModalId(null);
        } else {
          toast.error(res?.message || 'Failed to disconnect Telegram.');
        }
      }
    );
  };

  const handleSaveEmailSettings = async () => {
    if (mailDriver === 'smtp' && !smtpHost) {
      toast.error(t('enterSmtpHost'));
      return;
    }
    if (mailDriver === 'resend' && !resendApiKey && !emailIntegration?.has_resend_api_key) {
      toast.error(t('enterResendKey'));
      return;
    }
    if (!fromAddress) {
      toast.error(t('enterFromAddress'));
      return;
    }

    const payload = {
      mail_driver: mailDriver,
      smtp_host: smtpHost || undefined,
      smtp_port: smtpPort ? parseInt(smtpPort, 10) : 587,
      smtp_username: smtpUsername || undefined,
      smtp_password: smtpPassword || undefined,
      resend_api_key: resendApiKey || undefined,
      from_address: fromAddress,
      from_name: fromName || undefined,
      is_active: emailIsActive,
    };

    const res = await saveEmailIntegration(payload);
    if (res?.success) {
      toast.success(res.message || t('emailSettingsSaved') || 'تم حفظ إعدادات البريد الإلكتروني بنجاح');
      await loadSecurityData();
      setActiveModalId(null);
    } else {
      toast.error(res?.message || 'Failed to save Email settings.');
    }
  };

  const handleTestEmail = async () => {
    const res = await testEmailIntegration();
    if (res?.success) {
      toast.success(res.message || t('testEmailSuccess') || 'تم إرسال البريد الإلكتروني التجريبي بنجاح!');
    } else {
      toast.error(res?.message || 'Failed to send test email.');
    }
  };

  const handleDeleteEmailSettings = () => {
    openConfirm(
      t('emailSettingsTitle') || 'إعدادات البريد الإلكتروني',
      t('emailDisconnectConfirm') || 'هل أنت تأكد من رغبتك في إلغاء ربط البريد الإلكتروني؟',
      t('disconnect') || 'إلغاء الربط',
      async () => {
        const res = await deleteEmailIntegration();
        if (res?.success) {
          toast.success(res.message || t('emailDisconnectedSuccess') || 'تم إلغاء ربط البريد الإلكتروني بنجاح');
          await loadSecurityData();
          setActiveModalId(null);
        } else {
          toast.error(res?.message || 'Failed to disconnect Email integration.');
        }
      }
    );
  };

  const integrationsList = [
    {
      id: 'google_workspace',
      title: 'Google Workspace',
      category: 'google',
      icon: (
        <Icon name="google" size={28} />
      ),
      description: t('googleWorkspaceDesc') || 'ربط حساب جوجل الرئيسي لمزامنة التقويم وإنشاء روابط اجتماعات Google Meet تلقائياً.',
      isConnected: !!googleIntegration,
      subtitle: googleIntegration ? `${t('connectedAs') || 'مرتبط كـ:'} ${googleIntegration.google_email}` : (t('statusNotConnected') || 'غير مرتبط'),
    },
    {
      id: 'google_calendar',
      title: 'Google Calendar',
      category: 'google',
      icon: (
        <Icon name="google-calendar" size={28} />
      ),
      description: t('googleCalendarDesc') || 'مزامنة كافة الحجوزات والمواعيد المستلمة تلقائياً مع تقويم جوجل المفضل لديك.',
      isConnected: !!googleIntegration && calendarSync,
      subtitle: calendarSync ? (t('syncEnabled') || 'المزامنة مفعّلة') : (t('statusDisabled') || 'معطّلة'),
    },
    {
      id: 'google_meet',
      title: 'Google Meet',
      category: 'google',
      icon: (
        <Icon name="google-meet" size={28} />
      ),
      description: t('googleMeetDesc') || 'توليد روابط اجتماعات افتراضية فورية لكل موعد يتم تأكيده مع العملاء.',
      isConnected: !!googleIntegration && autoMeet,
      subtitle: autoMeet ? (t('autoCreateEnabled') || 'الإنشاء التلقائي مفعّل') : (t('statusDisabled') || 'معطّل'),
    },
    {
      id: 'google_sheets',
      title: 'Google Sheets',
      category: 'google',
      icon: (
        <Icon name="google-sheets" size={28} />
      ),
      description: t('googleSheetsDesc') || 'تصدير وتحديث بيانات المواعيد الجديدة فوراً في جدول بيانات Google Sheets.',
      isConnected: !!googleIntegration && sheetsSync,
      subtitle: sheetsSync ? (t('syncEnabled') || 'المزامنة التلقائية مفعّلة') : (t('statusDisabled') || 'معطّلة'),
    },
    {
      id: 'telegram',
      title: t('telegramTitle') || 'إعدادات Telegram',
      category: 'automation',
      icon: (
        <Icon name="telegram" size={28} />
      ),
      description: t('telegramDesc') || 'إشعار فوري مع صورة الإيصال لكل حجز جديد، وأزرار تأكيد/رفض مباشرة.',
      isConnected: !!(telegramIntegration && telegramIntegration.is_connected),
      subtitle: telegramIntegration && telegramIntegration.is_connected
        ? (t('statusConnected') || 'متصل')
        : (t('statusNotConnected') || 'غير متصل'),
    },
    {
      id: 'webhooks',
      title: 'Webhooks API',
      category: 'automation',
      icon: (
        <Icon name="webhooks" size={26} />
      ),
      description: t('webhooksDesc') || 'إرسال تنبيهات برمجية فورية HTTP POST لنظامك الخاص عند إضافة أو تعديل الحجوزات.',
      isConnected: isWebhookConfigured,
      subtitle: isWebhookConfigured ? (t('webhookConfigured') || 'الرابط مفعّل ومضبوط') : (t('statusNotConnected') || 'غير متصل'),
    },
    {
      id: 'notifications',
      title: t('emailSettingsTitle') || 'إعدادات البريد الإلكتروني',
      category: 'notifications',
      icon: (
        <Icon name="mail" size={26} />
      ),
      description: t('notificationsDesc') || 'إعدادات البريد الإلكتروني (SMTP / Resend) لإرسال إشعارات الحجوزات والتنبيهات المباشرة فور حجز أي موعد جديد.',
      isConnected: !!(emailIntegration && emailIntegration.is_connected),
      subtitle: emailIntegration && emailIntegration.is_connected
        ? `${emailIntegration.mail_driver === 'resend' ? 'Resend' : 'SMTP'}: ${emailIntegration.from_address || ''}`
        : (t('defaultSystemMail') || 'مفعّلة افتراضياً بالنظام'),
    },
  ];



  const filteredIntegrations = integrationsList.filter((item) => {
    if (activeTab === 'all') return true;
    return item.category === activeTab;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }} className="animate-fade-in-up">
      <SEO title={t('applicationsTitle') || 'Applications & Integrations'} noindex />
      {/* Header & App Directory Banner */}
      <div className="card" style={{ background: 'var(--surface-gradient, var(--bg-card))' }}>
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h2 className="card-title" style={{ fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon name="custom-1ebf3dba" size={20} />
              {t('appDirectoryTitle') || 'دليل التطبيقات والتكاملات'}
            </h2>
            <p className="card-subtitle" style={{ fontSize: '0.88rem', marginTop: 4 }}>
              {t('appDirectoryDesc') || 'ربط وإدارة الخدمات الخارجية مثل تقويم جوجل، التنبيهات، والـ Webhooks بضغطة زر'}
            </p>
          </div>

          <span className="profile-badge verified" style={{ fontSize: '0.82rem', padding: '6px 14px', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <Icon name="zap" size={12} />
            {integrationsList.filter((i) => i.isConnected).length} {t('connectedServicesCount') || 'خدمات متصلة'}
          </span>
        </div>

        {/* Filter Tabs */}
        <div style={{ padding: '0 24px 20px', display: 'flex', gap: 8, overflowX: 'auto' }}>
          {[
            { id: 'all', label: t('allApplications') || 'كافة التطبيقات' },
            { id: 'google', label: t('googleServicesTab') || 'خدمات Google' },
            { id: 'automation', label: t('automationAndWebhooksTab') || 'الأتمتة والـ Webhooks' },
            { id: 'notifications', label: t('notificationsTab') || 'الإشعارات' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`btn btn-sm ${activeTab === tab.id ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setActiveTab(tab.id)}
              style={{
                borderRadius: 20,
                fontSize: '0.82rem',
                padding: '6px 16px',
                marginTop: 10,
                fontWeight: activeTab === tab.id ? 700 : 500,
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Applications */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 260px), 1fr))', gap: 20 }}>
        {filteredIntegrations.map((item) => (
          <div
            key={item.id}
            className="card hover-card"
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              padding: 20,
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border)',
              background: 'var(--bg-card)',
              boxShadow: '0 4px 14px rgba(0,0,0,0.03)',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1 }}>
                  <div style={{ width: 46, height: 46, minWidth: 46, borderRadius: 12, background: 'var(--surface-alt)', border: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {item.icon}
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <h3 style={{ fontSize: '1.02rem', fontWeight: 800, margin: 0, color: 'var(--heading)', wordBreak: 'break-word' }}>{item.title}</h3>
                    <span
                      style={{
                        fontSize: '0.78rem',
                        color: item.isConnected ? 'var(--primary)' : 'var(--muted)',
                        fontWeight: 600,
                        display: 'block',
                        wordBreak: 'break-all',
                        lineHeight: 1.3,
                        marginTop: 2,
                      }}
                      title={typeof item.subtitle === 'string' ? item.subtitle : ''}
                    >
                      {item.subtitle}
                    </span>
                  </div>
                </div>

                <span className={`profile-badge ${item.isConnected ? 'verified' : 'unverified'}`} style={{ fontSize: '0.75rem', padding: '3px 10px', whiteSpace: 'nowrap', flexShrink: 0 }}>
                  {item.isConnected ? (t('statusConnected') || 'متصل') : (t('statusNotConnected') || 'غير متصل')}
                </span>
              </div>

              <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 18 }}>
                {item.description}
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 12, borderTop: '1px solid var(--border-light)' }}>
              <PermissionCheck permission="integration_manage">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setActiveModalId(item.id)}
                  style={{ fontSize: '0.82rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <Icon name="settings" size={14} />
                  {t('configureSettings') || 'ضبط الإعدادات'}
                </button>
              </PermissionCheck>
            </div>
          </div>
        ))}
      </div>

      {/* --- MODAL 1: Google Workspace Main Connection --- */}
      {activeModalId === 'google_workspace' && createPortal(
        <div className="modal-backdrop">
          <div className="modal-card animate-scale-up">
            <div className="modal-header">
              <h3 className="modal-title">{t('googleIntegrationTitle') || 'Google Workspace Integration'}</h3>
              <button type="button" className="modal-close-btn" onClick={() => setActiveModalId(null)}>
                <Icon name="x" size={16} />
              </button>
            </div>

            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 16 }}>
              {t('googleWorkspaceDesc')}
            </p>

            {googleIntegration ? (
              <div style={{ background: 'var(--surface-alt)', padding: 16, borderRadius: 'var(--radius-md)', marginBottom: 20, border: '1px solid var(--border-light)' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--muted)', fontWeight: 600 }}>{t('connectedAccountLabel') || 'الحساب المرتبط حالياً'}</div>
                <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--primary)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Icon name="mail" size={16} />
                  {googleIntegration.google_email}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                  {t('connectionDate') || 'تاريخ الربط:'} {new Date(googleIntegration.created_at || Date.now()).toLocaleDateString(t('lang') === 'ar' ? 'ar-SA' : 'en-US')}
                </div>
              </div>
            ) : (
              <div style={{ background: 'rgba(234, 179, 8, 0.1)', padding: 14, borderRadius: 'var(--radius-md)', marginBottom: 20, border: '1px solid rgba(234, 179, 8, 0.3)' }}>
                <span style={{ fontSize: '0.86rem', color: '#b45309', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Icon name="alert-triangle" size={16} />
                  {t('noGoogleConnectedNotice') || 'لم يتم ربط أي حساب جوجل حتى الآن. اضغط على الزر أدناه للربط الآمن.'}
                </span>
              </div>
            )}

            <div className="modal-actions">
              {googleIntegration ? (
                <button type="button" className="btn btn-danger btn-sm" onClick={handleDisconnectGoogle} disabled={loading}>
                  {t('disconnectGoogleBtn') || 'إلغاء ربط حساب Google'}
                </button>
              ) : (
                <button type="button" className="btn btn-primary btn-sm" onClick={handleStartGoogleOAuth} disabled={loading} style={{ gap: 6 }}>
                  <Icon name="globe" size={14} />
                  {t('connectGoogleNow') || 'ربط حساب Google الآن'}
                </button>
              )}
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setActiveModalId(null)}>{t('cancel')}</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* --- MODAL 2: Google Calendar Settings --- */}
      {activeModalId === 'google_calendar' && createPortal(
        <div className="modal-backdrop">
          <div className="modal-card animate-scale-up">
            <div className="modal-header">
              <h3 className="modal-title">{t('googleCalendarSettingsTitle') || (t('lang') === 'en' ? 'Google Calendar Settings' : 'إعدادات Google Calendar')}</h3>
              <button type="button" className="modal-close-btn" onClick={() => setActiveModalId(null)}>
                <Icon name="x" size={16} />
              </button>
            </div>

            {!googleIntegration && (
              <div style={{ background: 'rgba(239, 68, 68, 0.08)', padding: 14, borderRadius: 'var(--radius-md)', marginBottom: 16, border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                <span style={{ fontSize: '0.86rem', color: 'var(--error, #ef4444)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Icon name="alert-triangle" size={16} />
                  {t('connectGoogleFirst')}
                </span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border-light)' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>{t('enableCalendarSync')}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{t('calendarSyncDescSub')}</div>
              </div>
              <ToggleSwitch checked={calendarSync} onChange={(e) => setCalendarSync(e.target.checked)} />
            </div>

            <div style={{ marginTop: 16, marginBottom: 20 }}>
              <label className="form-label" style={{ fontWeight: 700 }}>{t('calendarIdLabel')}</label>
              <input
                type="text"
                className="form-input"
                value={calendarId}
                onChange={(e) => setCalendarId(e.target.value)}
                placeholder="primary or your-email@gmail.com"
              />
              <span style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: 4, display: 'block' }}>
                {t('calendarIdHelpText')}
              </span>
            </div>

            <div className="modal-actions">
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setActiveModalId(null)}>{t('cancel')}</button>
              {googleIntegration ? (
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={handleSaveCalendarSettings}
                  disabled={loading}
                >
                  {t('saveSettings')}
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    setActiveModalId(null);
                    handleStartGoogleOAuth();
                  }}
                >
                  {t('connectGoogle')}
                </button>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* --- MODAL 3: Google Meet Settings --- */}
      {activeModalId === 'google_meet' && createPortal(
        <div className="modal-backdrop">
          <div className="modal-card animate-scale-up">
            <div className="modal-header">
              <h3 className="modal-title">{t('googleMeetSettingsTitle') || (t('lang') === 'en' ? 'Google Meet Settings' : 'إعدادات Google Meet')}</h3>
              <button type="button" className="modal-close-btn" onClick={() => setActiveModalId(null)}>
                <Icon name="x" size={16} />
              </button>
            </div>

            {!googleIntegration && (
              <div style={{ background: 'rgba(239, 68, 68, 0.08)', padding: 14, borderRadius: 'var(--radius-md)', marginBottom: 16, border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                <span style={{ fontSize: '0.86rem', color: 'var(--error, #ef4444)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Icon name="alert-triangle" size={16} />
                  {t('connectGoogleFirst') || 'الرجاء ربط حساب Google Workspace أولاً'}
                </span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>{t('autoCreateMeetLinksLabel') || 'إنشاء رابط اجتماع Google Meet تلقائياً'}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: 2 }}>
                  {t('autoCreateMeetLinksSub') || 'سيتم توليد رابط مباشر وإرفاقه بالرسائل التأكيدية للعميل.'}
                </div>
              </div>
              <ToggleSwitch checked={autoMeet} onChange={(e) => setAutoMeet(e.target.checked)} />
            </div>

            <div className="modal-actions">
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setActiveModalId(null)}>{t('cancel')}</button>
              {googleIntegration ? (
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={handleSaveMeetSettings}
                  disabled={loading}
                >
                  {t('saveChanges') || 'حفظ التغييرات'}
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    setActiveModalId(null);
                    handleStartGoogleOAuth();
                  }}
                >
                  {t('connectGoogle') || 'ربط حساب جوجل'}
                </button>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* --- MODAL 4: Google Sheets Integration Settings --- */}
      {activeModalId === 'google_sheets' && createPortal(
        <div className="modal-backdrop">
          <div className="modal-card animate-scale-up">
            <div className="modal-header">
              <h3 className="modal-title">{t('googleSheetsSettingsTitle') || (t('lang') === 'en' ? 'Google Sheets Export Settings' : 'إعدادات تصدير Google Sheets')}</h3>
              <button type="button" className="modal-close-btn" onClick={() => setActiveModalId(null)}>
                <Icon name="x" size={16} />
              </button>
            </div>

            {!googleIntegration && (
              <div style={{ background: 'rgba(239, 68, 68, 0.08)', padding: 14, borderRadius: 'var(--radius-md)', marginBottom: 16, border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                <span style={{ fontSize: '0.86rem', color: 'var(--error, #ef4444)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Icon name="alert-triangle" size={16} />
                  {t('connectGoogleFirst') || 'الرجاء ربط حساب Google Workspace أولاً'}
                </span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border-light)', marginBottom: 14 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>{t('sheetsExportSyncLabel') || 'تفعيل التصدير والمزامنة التلقائية'}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{t('sheetsExportSyncSub') || 'إضافة كل حجز جديد كصف بالجدول'}</div>
              </div>
              <ToggleSwitch checked={sheetsSync} onChange={(e) => setSheetsSync(e.target.checked)} />
            </div>

            <div className="form-group" style={{ marginBottom: 14 }}>
              <label className="form-label" style={{ fontWeight: 700 }}>{t('sheetHeaderLangLabel') || 'لغة العناوين بالجدول'}</label>
              <select className="form-select" value={sheetLanguage} onChange={(e) => setSheetLanguage(e.target.value)}>
                <option value="ar">{t('sheetLangArOption') || 'العربية (اسم العميل، الموعد، الخدمة)'}</option>
                <option value="en">{t('sheetLangEnOption') || 'English (Customer Name, Date, Service)'}</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 20 }}>
              <label className="form-label" style={{ fontWeight: 700 }}>{t('spreadsheetIdLabel') || 'معرّف ملف Google Sheet الخاص بك (مستند مخصص)'}</label>
              <input
                type={showSheetId ? 'text' : 'password'}
                className="form-input"
                placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                value={spreadsheetId}
                onChange={(e) => setSpreadsheetId(e.target.value)}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
                  {t('autoSpreadsheetNotice') || 'اتركه فارغاً ليقوم النظام بإنشاء جدول تلقائي.'}
                </span>
                <button
                  type="button"
                  onClick={() => setShowSheetId(!showSheetId)}
                  style={{ border: 0, background: 'transparent', color: 'var(--primary)', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 600 }}
                >
                  {showSheetId ? (t('hide') || 'إخفاء') : (t('showId') || 'إظهر المعرف')}
                </button>
              </div>
            </div>

            <div className="modal-actions">
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setActiveModalId(null)}>{t('cancel')}</button>
              {googleIntegration ? (
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={handleSaveSheetsSettings}
                  disabled={loading}
                >
                  {t('saveSettings') || 'حفظ الضبط'}
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    setActiveModalId(null);
                    handleStartGoogleOAuth();
                  }}
                >
                  {t('connectGoogle') || 'ربط حساب جوجل'}
                </button>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* --- MODAL: Telegram Configuration --- */}
      {activeModalId === 'telegram' && createPortal(
        <div className="modal-backdrop">
          <div
            className="modal-card animate-scale-up"
            style={{
              maxWidth: 780,
              width: '95%',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              padding: 0,
            }}
          >
            <div
              className="modal-header"
              style={{
                padding: '20px 24px 16px',
                borderBottom: '1px solid var(--border)',
                flexShrink: 0,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '1.2rem', fontWeight: 800 }}>
                <Icon name="telegram" size={26} />
                {t('telegramModalTitle') || 'إعدادات Telegram'}
              </h3>
              <button type="button" className="modal-close-btn" onClick={() => setActiveModalId(null)}>
                <Icon name="x" size={16} />
              </button>
            </div>

            <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* Question: Which Bot to Use */}
              <div>
                <label style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 12, display: 'block', color: 'var(--text)' }}>
                  {t('telegramBotQuestion') || 'أي بوت تليجرام يُستخدم لإشعارات هذه المساحة؟'}
                </label>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>

                  {/* Custom Bot Option */}
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 12,
                      padding: 14,
                      borderRadius: 'var(--radius-md)',
                      border: telegramBotType === 'custom' ? '2px solid var(--primary)' : '1px solid var(--border)',
                      backgroundColor: telegramBotType === 'custom' ? 'rgba(32, 123, 89, 0.04)' : 'var(--surface-alt)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <input
                      type="radio"
                      name="telegram_bot_type"
                      checked={telegramBotType === 'custom'}
                      onChange={() => setTelegramBotType('custom')}
                      style={{ accentColor: 'var(--primary)', marginTop: 3, width: 18, height: 18 }}
                    />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text)' }}>
                        {t('telegramCustomBot') || 'بوت خاص بمساحتي'}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: 2 }}>
                        {t('telegramCustomBotDesc') || 'أنشئ بوتًا خاصًا بك عبر BotFather وأدخل الـ Token الخاص به.'}
                      </div>
                    </div>
                  </label>

                  {/* Default Bot Option */}
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 12,
                      padding: 14,
                      borderRadius: 'var(--radius-md)',
                      border: telegramBotType === 'default' ? '2px solid var(--primary)' : '1px solid var(--border)',
                      backgroundColor: telegramBotType === 'default' ? 'rgba(32, 123, 89, 0.04)' : 'var(--surface-alt)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <input
                      type="radio"
                      name="telegram_bot_type"
                      checked={telegramBotType === 'default'}
                      onChange={() => setTelegramBotType('default')}
                      style={{ accentColor: 'var(--primary)', marginTop: 3, width: 18, height: 18 }}
                    />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text)' }}>
                        {t('telegramDefaultBot') || 'استخدام بوت Saabq Cal الافتراضي'}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: 2 }}>
                        {t('telegramDefaultBotDesc') || 'لا حاجة لإنشاء بوت خاص — تحتاج فقط إلى Chat ID الخاص بك.'}
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Notice Box for Default Bot */}
              {telegramBotType === 'default' && (
                <div style={{ background: 'rgba(32, 123, 89, 0.06)', border: '1px solid rgba(32, 123, 89, 0.2)', padding: 16, borderRadius: 'var(--radius-md)' }}>
                  <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 12 }}>
                    {t('telegramDefaultBotNotice') || 'سُترسل إشعارات حجوزات هذه المساحة عبر بوت Saabq Cal الافتراضي. اضغط الزر أدناه لفتح البوت واختيار الخدمة التي تريد ربط هذه المحادثة بإشعاراتها — يتم الربط تلقائيًا من غير أي نسخ أو لصق.'}
                  </p>
                  <a
                    href="https://t.me/Saabq_cal_Bot"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary btn-sm"
                    style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}
                  >
                    <Icon name="telegram" size={16} />
                    {t('openBotAndConnect') || 'فتح البوت وربط محادثة تلقائيًا'}
                  </a>
                  <div style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: 8 }}>
                    {t('orFindChatManually') || 'أو، إن أردت العثور على فتح المحادثة يدويًا:'}{' '}
                    <a href="https://t.me/Saabq_cal_Bot" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', fontWeight: 600 }}>
                      t.me/Saabq_cal_Bot ↗
                    </a>
                  </div>
                </div>
              )}

              {/* Bot Token Input (Custom Bot) */}
              {telegramBotType === 'custom' && (
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 700 }}>
                    {t('botTokenLabel') || 'Bot Token *'}
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder={t('botTokenPlaceholder') || 'أدخل الـ Token الخاص بالبوت هنا'}
                    value={telegramBotToken}
                    onChange={(e) => setTelegramBotToken(e.target.value)}
                  />
                </div>
              )}

              {/* Chat Configuration Card */}
              {telegramChats.map((chat, idx) => (
                <div
                  key={chat.id || idx}
                  style={{
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    padding: 16,
                    backgroundColor: 'var(--bg-card)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>
                      {chat.title || t('defaultChatTitle') || `شات ${idx + 1}`}
                    </div>
                    {telegramChats.length > 1 && (
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => {
                          const updated = telegramChats.filter((_, i) => i !== idx);
                          setTelegramChats(updated);
                          if (updated.length > 0 && idx === 0) {
                            setTelegramChatId(updated[0].chat_id || '');
                          } else if (updated.length === 0) {
                            setTelegramChatId('');
                          }
                        }}
                        style={{
                          color: '#ef4444',
                          background: 'rgba(239, 68, 68, 0.08)',
                          border: 0,
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          padding: '4px 10px',
                          borderRadius: 'var(--radius-sm)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          cursor: 'pointer',
                        }}
                      >
                        <Icon name="trash" size={14} />
                        {t('deleteChat') || 'حذف الشات'}
                      </button>
                    )}
                  </div>


                  <div className="form-group" style={{ marginBottom: 12 }}>
                    <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                      {t('chatIdLabel') || 'Chat ID'}
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showChatId ? 'text' : 'password'}
                        className="form-input"
                        placeholder="123456789"
                        value={telegramChatId}
                        onChange={(e) => {
                          setTelegramChatId(e.target.value);
                          const updated = [...telegramChats];
                          updated[idx] = { ...updated[idx], chat_id: e.target.value };
                          setTelegramChats(updated);
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowChatId(!showChatId)}
                        style={{
                          position: 'absolute',
                          left: t('lang') === 'en' ? 'auto' : '10px',
                          right: t('lang') === 'en' ? '10px' : 'auto',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          border: 0,
                          background: 'transparent',
                          color: 'var(--primary)',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        {showChatId ? (t('hide') || 'إخفاء') : (t('showId') || 'إظهار')}
                      </button>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: 6, lineHeight: 1.5 }}>
                      {t('chatIdHelpText') || 'افتح بوت Saabq Cal وأرسل له أي رسالة — سيرد عليك البوت مباشرة برقم الـ Chat ID الخاص بك لتنسخه هنا.'}
                    </div>
                  </div>

                  {/* Services Checklist */}
                  <div style={{ marginTop: 14 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.86rem', marginBottom: 2 }}>
                      {t('servicesToNotify') || 'الخدمات التي تصل إشعاراتها إلى هذا الشات'}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--muted)', marginBottom: 8 }}>
                      {t('servicesToNotifyNotice') || 'أدخل واحفظ الـ Chat ID أولاً قبل تحديد الخدمات.'}
                    </div>

                    <div style={{ display: 'flex', gap: 12, marginBottom: 10, fontSize: '0.8rem' }}>
                      <button
                        type="button"
                        onClick={() => {
                          const allIds = services.map((s) => s.id);
                          const updated = [...telegramChats];
                          updated[idx] = { ...updated[idx], service_ids: allIds };
                          setTelegramChats(updated);
                        }}
                        style={{ border: 0, background: 'transparent', color: 'var(--primary)', cursor: 'pointer', fontWeight: 600 }}
                      >
                        {t('selectAll') || 'تحديد الكل'}
                      </button>
                      <span style={{ color: 'var(--border)' }}>|</span>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = [...telegramChats];
                          updated[idx] = { ...updated[idx], service_ids: [] };
                          setTelegramChats(updated);
                        }}
                        style={{ border: 0, background: 'transparent', color: 'var(--muted)', cursor: 'pointer', fontWeight: 600 }}
                      >
                        {t('deselectAll') || 'إلغاء تحديد الكل'}
                      </button>
                    </div>

                    {services && services.length > 0 ? (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10, background: 'var(--surface-alt)', padding: 12, borderRadius: 'var(--radius-sm)' }}>

                        {services.map((srv) => {
                          const isChecked = (chat.service_ids || []).includes(srv.id);
                          return (
                            <label key={srv.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.86rem', cursor: 'pointer' }}>
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  const currentServices = chat.service_ids || [];
                                  const nextServices = e.target.checked
                                    ? [...currentServices, srv.id]
                                    : currentServices.filter((id) => id !== srv.id);
                                  const updated = [...telegramChats];
                                  updated[idx] = { ...updated[idx], service_ids: nextServices };
                                  setTelegramChats(updated);
                                }}
                                style={{ accentColor: 'var(--primary)', width: 16, height: 16 }}
                              />
                              <span>{getLocalizedText(srv.title || srv.name, t('lang'))}</span>

                            </label>
                          );
                        })}
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.8rem', color: 'var(--muted)', fontStyle: 'italic' }}>
                        {t('noServicesFound') || 'لا توجد خدمات متاحة حالياً'}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Add New Chat Button */}
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setTelegramChats([
                    ...telegramChats,
                    {
                      id: telegramChats.length + 1,
                      title: `${t('defaultChatTitle') || 'شات'} ${telegramChats.length + 1}`,
                      chat_id: '',
                      service_ids: [],
                    },
                  ]);
                }}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                {t('addNewChat') || '+ إضافة شات جديد'}
              </button>

              {/* Action Buttons Switch */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface-alt)', padding: 14, borderRadius: 'var(--radius-md)' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                    {t('enableActionButtons') || 'تفعيل أزرار التأكيد/الرفض'}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: 2 }}>
                    {t('enableActionButtonsDesc') || 'ليصل استقبال ضغطات زري «تأكيد» و«رفض» مباشرة من تليجرام.'}
                  </div>
                </div>
                <ToggleSwitch
                  checked={telegramEnableActionButtons}
                  onChange={(e) => setTelegramEnableActionButtons(e.target.checked)}
                />
              </div>

              {telegramEnableActionButtons && (
                <div className="form-group" style={{ marginTop: 16 }}>
                  <label className="form-label" style={{ fontWeight: 700, display: 'flex', justifyContent: 'space-between' }}>
                    {t('actionButtonsConfig') || 'إعدادات الأزرار المخصصة (JSON)'}
                    <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--muted)' }}>{t('optional') || 'اختياري'}</span>
                  </label>
                  <TelegramActionBuilder 
                    configString={telegramActionButtonsConfig}
                    onChange={(val) => setTelegramActionButtonsConfig(val)}
                  />
                </div>
              )}
            </div>

            <div
              className="modal-actions"
              style={{
                padding: '16px 24px',
                borderTop: '1px solid var(--border)',
                marginTop: 0,
                flexShrink: 0,
                background: 'var(--bg-card)',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 10,
              }}
            >

              {telegramIntegration && telegramIntegration.is_connected && (
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  onClick={handleDeleteTelegramSettings}
                  disabled={loading}
                >
                  {t('disconnectTelegram') || 'إلغاء ربط Telegram'}
                </button>
              )}
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setActiveModalId(null)}>{t('cancel')}</button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleSaveTelegramSettings}
                disabled={loading}
              >
                {t('saveTelegramBtn') || 'حفظ'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* --- MODAL 5: Webhooks Configuration --- */}
      {activeModalId === 'webhooks' && createPortal(

        <div className="modal-backdrop">
          <div className="modal-card animate-scale-up">
            <div className="modal-header">
              <h3 className="modal-title">{t('webhooksModalTitle') || 'الربط البرمجي (Webhooks) والتنبيهات'}</h3>
              <button type="button" className="modal-close-btn" onClick={() => setActiveModalId(null)}>
                <Icon name="x" size={16} />
              </button>
            </div>

            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="form-label" style={{ fontWeight: 700 }}>{t('webhookUrlLabel') || 'رابط الـ Webhook *'}</label>
              <input
                type="url"
                className="form-input"
                placeholder={t('webhookUrlPlaceholder') || 'https://api.yourdomain.com/webhooks/saabq'}
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
              />
            </div>

            <label className="form-label" style={{ fontWeight: 700, marginBottom: 8, display: 'block' }}>{t('triggerEventsLabel') || 'الأحداث المطلوبة للتنبيه:'}</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, background: 'var(--surface-alt)', padding: 14, borderRadius: 'var(--radius-md)', marginBottom: 20 }}>
              {[
                { id: 'booking_created', label: `${t('bookingCreatedEvent') || 'إنشاء حجز جديد'} (booking.created)` },
                { id: 'booking_confirmed', label: `${t('bookingConfirmedEvent') || 'تأكيد موعد الحجز'} (booking.confirmed)` },
                { id: 'booking_cancelled', label: `${t('bookingCancelledEvent') || 'إلغاء حجز الموعد'} (booking.cancelled)` },
              ].map((evt) => (
                <label key={evt.id} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.88rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={webhookEvents[evt.id]}
                    onChange={(e) => setWebhookEvents({ ...webhookEvents, [evt.id]: e.target.checked })}
                    style={{ accentColor: 'var(--primary)', width: 16, height: 16 }}
                  />
                  <span>{evt.label}</span>
                </label>
              ))}
            </div>

            <div className="modal-actions">
              {isWebhookConfigured && (
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  onClick={handleDeleteWebhookSettings}
                  disabled={loading}
                >
                  {t('disconnectWebhook') || 'إلغاء Webhook'}
                </button>
              )}
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setActiveModalId(null)}>{t('cancel')}</button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleSaveWebhookSettings}
                disabled={loading}
              >
                {t('saveWebhookBtn') || 'حفظ الـ Webhook'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* --- MODAL 6: Email Integration Settings --- */}
      {activeModalId === 'notifications' && createPortal(
        <div className="modal-backdrop">
          <div
            className="modal-card animate-scale-up"
            style={{
              maxWidth: 640,
              width: '95%',
              display: 'flex',
              flexDirection: 'column',
              padding: 0,
              borderRadius: 'var(--radius-lg, 16px)',
              overflow: 'hidden',
            }}
          >
            {/* Header with Driver Radio Toggle matching Image 1 & 2 */}
            <div
              style={{
                padding: '24px 28px 16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <h3 className="modal-title" style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                ✉️ {t('emailSettingsTitle') || 'إعدادات البريد الإلكتروني'}
              </h3>

              {/* Radio Driver Selector */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600 }}>
                  <input
                    type="radio"
                    name="mail_driver"
                    value="smtp"
                    checked={mailDriver === 'smtp'}
                    onChange={() => setMailDriver('smtp')}
                    style={{ accentColor: '#0d685c', width: 16, height: 16 }}
                  />
                  SMTP
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600 }}>
                  <input
                    type="radio"
                    name="mail_driver"
                    value="resend"
                    checked={mailDriver === 'resend'}
                    onChange={() => setMailDriver('resend')}
                    style={{ accentColor: '#0d685c', width: 16, height: 16 }}
                  />
                  Resend
                </label>
              </div>
            </div>

            <div style={{ padding: '0 28px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>

              {/* RESEND DRIVER FIELDS (Matching Image 1) */}
              {mailDriver === 'resend' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text)', textAlign: 'right', display: 'block', marginBottom: 6 }}>
                      Resend API Key
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showResendKey ? 'text' : 'password'}
                        className="form-input"
                        placeholder="re_123456789_..."
                        value={resendApiKey}
                        onChange={(e) => setResendApiKey(e.target.value)}
                        style={{ paddingLeft: t('lang') === 'en' ? 70 : 12, paddingRight: t('lang') === 'en' ? 12 : 70 }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowResendKey(!showResendKey)}
                        style={{
                          position: 'absolute',
                          left: t('lang') === 'en' ? 'auto' : 12,
                          right: t('lang') === 'en' ? 12 : 'auto',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          border: 0,
                          background: 'transparent',
                          color: '#0d685c',
                          fontSize: '0.82rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        {showResendKey ? (t('hide') || 'إخفاء') : (t('change') || 'تغيير')}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* SMTP DRIVER FIELDS (Matching Image 2) */}
              {mailDriver === 'smtp' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {/* Grid 2 Columns */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                    <div className="form-group">
                      <label className="form-label" style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text)', display: 'block', marginBottom: 6 }}>
                        SMTP Host
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="smtp.gmail.com"
                        value={smtpHost}
                        onChange={(e) => setSmtpHost(e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label" style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text)', display: 'block', marginBottom: 6 }}>
                        Port
                      </label>
                      <input
                        type="number"
                        className="form-input"
                        placeholder="587"
                        value={smtpPort}
                        onChange={(e) => setSmtpPort(e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label" style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text)', display: 'block', marginBottom: 6 }}>
                        Username
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="your-email@gmail.com"
                        value={smtpUsername}
                        onChange={(e) => setSmtpUsername(e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label" style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text)', display: 'block', marginBottom: 6 }}>
                        Password
                      </label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type={showSmtpPassword ? 'text' : 'password'}
                          className="form-input"
                          placeholder={emailIntegration?.has_smtp_password ? '••••••••' : '••••••••'}
                          value={smtpPassword}
                          onChange={(e) => setSmtpPassword(e.target.value)}
                          style={{ paddingLeft: t('lang') === 'en' ? 65 : 12, paddingRight: t('lang') === 'en' ? 12 : 65 }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowSmtpPassword(!showSmtpPassword)}
                          style={{
                            position: 'absolute',
                            left: t('lang') === 'en' ? 'auto' : 12,
                            right: t('lang') === 'en' ? 12 : 'auto',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            border: 0,
                            background: 'transparent',
                            color: '#0d685c',
                            fontSize: '0.82rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          {showSmtpPassword ? (t('hide') || 'إخفاء') : (t('show') || 'إظهار')}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* COMMON FROM ADDRESS FIELD (Image 1 & Image 2) */}
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text)', display: 'block', marginBottom: 6 }}>
                  {t('fromAddressLabel')}
                </label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="you@yourdomain.com"
                  value={fromAddress}
                  onChange={(e) => setFromAddress(e.target.value)}
                />
              </div>

              {/* OPTIONAL FROM SENDER NAME FIELD */}
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text)', display: 'block', marginBottom: 6 }}>
                  {t('fromSenderNameLabel') || 'اسم المرسل (Sender Name)'}
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="My Business Name"
                  value={fromName}
                  onChange={(e) => setFromName(e.target.value)}
                />
              </div>

            </div>

            {/* Modal Actions Footer matching design */}
            <div
              className="modal-actions"
              style={{
                padding: '16px 28px 24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'var(--bg-card)',
                marginTop: 0,
              }}
            >
              <div style={{ display: 'flex', gap: 8 }}>
                {emailIntegration && emailIntegration.is_connected && (
                  <>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={handleTestEmail}
                      disabled={loading}
                    >
                      {t('testEmailBtn') || 'تجربة الإرسال'}
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      onClick={handleDeleteEmailSettings}
                      disabled={loading}
                    >
                      {t('disconnect') || 'إلغاء الربط'}
                    </button>
                  </>
                )}
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setActiveModalId(null)}>
                  {t('cancel')}
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={handleSaveEmailSettings}
                  disabled={loading}
                  style={{
                    backgroundColor: '#0d685c',
                    borderColor: '#0d685c',
                    color: '#ffffff',
                    padding: '8px 24px',
                    borderRadius: 20,
                    fontWeight: 700,
                  }}
                >
                  {t('save') || 'حفظ'}
                </button>
              </div>
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

            <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', marginBottom: 20, lineHeight: 1.6 }}>
              {confirmModal.message}
            </p>

            <div className="modal-actions">
              <button type="button" className="btn btn-secondary btn-sm" onClick={closeConfirm}>
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
