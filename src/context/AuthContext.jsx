import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import client, { endpoints } from '../api/client';
import { applyWorkspaceBranding } from '../utils/theme';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('saabq_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [userType, setUserType] = useState(
    () => localStorage.getItem('saabq_user_type') || null
  );

  const [token, setToken] = useState(
    () => localStorage.getItem('saabq_token') || null
  );

  const [loading, setLoading] = useState(false);
  const [initialFetchDone, setInitialFetchDone] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadChatCount, setUnreadChatCount] = useState(0);

  // Persist state changes to localStorage
  useEffect(() => {
    if (token) {
      localStorage.setItem('saabq_token', token);
    } else {
      localStorage.removeItem('saabq_token');
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('saabq_user', JSON.stringify(user));
      const ws = user.workspace;
      if (ws) {
        applyWorkspaceBranding(ws.primary_color, ws.secondary_color);
      }
    } else {
      localStorage.removeItem('saabq_user');
      applyWorkspaceBranding(null, null);
    }
  }, [user]);

  useEffect(() => {
    if (userType) {
      localStorage.setItem('saabq_user_type', userType);
    } else {
      localStorage.removeItem('saabq_user_type');
    }
  }, [userType]);

  const updateWorkspaceState = useCallback((workspaceData) => {
    setUser((prevUser) => {
      if (!prevUser) return prevUser;
      const updated = {
        ...prevUser,
        workspace: {
          ...prevUser.workspace,
          ...workspaceData,
        },
      };
      localStorage.setItem('saabq_user', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const isAuthenticated = !!token && !!user;

  // Standard Login
  const login = useCallback(async (type, credentials) => {
    setLoading(true);
    try {
      const response = await client.post(endpoints.login(type), credentials);
      const { token: newToken, user: userData } = response.data.data;
      setToken(newToken);
      setUser(userData);
      setUserType(type);
      return { success: true, data: response.data, message: response.data?.message };
    } catch (error) {
      const errorData = error.response?.data;
      return {
        success: false,
        message: errorData?.message || 'Login failed',
        errors: errorData?.errors || {},
      };
    } finally {
      setLoading(false);
    }
  }, []);

  // Google Login
  const googleAuth = useCallback(async (type, googleToken, extraPayload = {}) => {
    setLoading(true);
    try {
      const payload = typeof extraPayload === 'string'
        ? { token: googleToken, fcm_token: extraPayload }
        : { token: googleToken, ...extraPayload };
      const response = await client.post(endpoints.googleAuth(type), payload);
      const { token: newToken, user: userData } = response.data.data;
      setToken(newToken);
      setUser(userData);
      setUserType(type);
      return { success: true, data: response.data, message: response.data.message };
    } catch (error) {
      const errorData = error.response?.data;
      return {
        success: false,
        message: errorData?.message || 'Google authentication failed',
        errors: errorData?.errors || {},
      };
    } finally {
      setLoading(false);
    }
  }, []);

  // Registration
  const register = useCallback(async (type, data) => {
    setLoading(true);
    try {
      const response = await client.post(endpoints.register(type), data);
      return { success: true, data: response.data, message: response.data?.message };
    } catch (error) {
      const errorData = error.response?.data;
      return {
        success: false,
        message: errorData?.message || 'Registration failed',
        errors: errorData?.errors || {},
      };
    } finally {
      setLoading(false);
    }
  }, []);

  // Logout
  const logout = useCallback(async () => {
    setLoading(true);
    try {
      if (token && userType) {
        await client.post(endpoints.logout(userType));
      }
    } catch {
      // Ignore logout errors
    } finally {
      setToken(null);
      setUser(null);
      setUserType(null);
      setLoading(false);
    }
  }, [token, userType]);

  // Forgot Password
  const forgotPassword = useCallback(async (type, email) => {
    setLoading(true);
    try {
      const response = await client.post(endpoints.forgotPassword(type), { email });
      return { success: true, message: response.data.message };
    } catch (error) {
      const errorData = error.response?.data;
      return {
        success: false,
        message: errorData?.message || 'Failed to send reset email',
        errors: errorData?.errors || {},
      };
    } finally {
      setLoading(false);
    }
  }, []);

  // Reset Password
  const resetPassword = useCallback(async (type, data) => {
    setLoading(true);
    try {
      const response = await client.post(endpoints.resetPassword(type), data);
      return { success: true, message: response.data.message };
    } catch (error) {
      const errorData = error.response?.data;
      return {
        success: false,
        message: errorData?.message || 'Failed to reset password',
        errors: errorData?.errors || {},
      };
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch Profile
  const fetchProfile = useCallback(async () => {
    if (!token || !userType) return;
    setLoading(true);
    try {
      const response = await client.get(endpoints.profile(userType));
      setUser(response.data.data);
      return { success: true, data: response.data.data };
    } catch (error) {
      return { success: false, message: error.response?.data?.message };
    } finally {
      setLoading(false);
    }
  }, [token, userType]);

  // Fetch fresh profile on initial load if authenticated
  useEffect(() => {
    if (token && userType && !initialFetchDone) {
      fetchProfile();
      setInitialFetchDone(true);
    }
  }, [token, userType, initialFetchDone, fetchProfile]);

  // Centralized unread counts polling
  const isFetchingUnreadRef = useRef(false);
  const lastFetchTimeRef = useRef(0);

  const refreshUnreadCounts = useCallback((force = false) => {
    if (!token || isFetchingUnreadRef.current) return;
    if (document.hidden && !force) return;

    const now = Date.now();
    if (!force && now - lastFetchTimeRef.current < 4_000) {
      return;
    }

    isFetchingUnreadRef.current = true;
    lastFetchTimeRef.current = now;

    Promise.allSettled([
      client.get(endpoints.notificationsUnreadCount),
      client.get('/chats/unread-count'),
    ])
      .then(([notifRes, chatRes]) => {
        if (notifRes.status === 'fulfilled') {
          setUnreadCount(notifRes.value.data?.data?.unread_count ?? 0);
        }
        if (chatRes.status === 'fulfilled') {
          setUnreadChatCount(chatRes.value.data?.data?.unread_count ?? 0);
        }
      })
      .finally(() => {
        isFetchingUnreadRef.current = false;
      });
  }, [token]);

  useEffect(() => {
    if (token) {
      refreshUnreadCounts(true);
      const interval = setInterval(() => refreshUnreadCounts(false), 60_000);
      const handleFocus = () => refreshUnreadCounts(true);
      window.addEventListener('focus', handleFocus);
      return () => {
        clearInterval(interval);
        window.removeEventListener('focus', handleFocus);
      };
    } else {
      setUnreadCount(0);
      setUnreadChatCount(0);
    }
  }, [token, refreshUnreadCounts]);

  // Update Profile
  const updateProfile = useCallback(async (data) => {
    if (!userType) return;
    setLoading(true);
    try {
      const response = await client.put(endpoints.profile(userType), data);
      setUser(response.data.data);
      return { success: true, data: response.data, message: response.data.message };
    } catch (error) {
      const errorData = error.response?.data;
      return {
        success: false,
        message: errorData?.message || 'Failed to update profile',
        errors: errorData?.errors || {},
      };
    } finally {
      setLoading(false);
    }
  }, [userType]);

  // Update Password
  const updatePassword = useCallback(async (data) => {
    if (!userType) return;
    setLoading(true);
    try {
      const response = await client.put(endpoints.updatePassword(userType), data);
      return { success: true, message: response.data.message };
    } catch (error) {
      const errorData = error.response?.data;
      return {
        success: false,
        message: errorData?.message || 'Failed to update password',
        errors: errorData?.errors || {},
      };
    } finally {
      setLoading(false);
    }
  }, [userType]);

  // Delete Account
  const deleteAccount = useCallback(async (password) => {
    if (!userType) return;
    setLoading(true);
    try {
      const response = await client.delete(endpoints.profile(userType), {
        data: password ? { password } : {},
      });
      setToken(null);
      setUser(null);
      setUserType(null);
      return { success: true, message: response.data.message };
    } catch (error) {
      const errorData = error.response?.data;
      return {
        success: false,
        message: errorData?.message || 'Failed to delete account',
        errors: errorData?.errors || {},
      };
    } finally {
      setLoading(false);
    }
  }, [userType]);

  // Upload Avatar
  const uploadAvatar = useCallback(async (file) => {
    if (userType !== 'customer') return { success: false, message: 'Avatar upload is only available for customers' };
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const response = await client.post(endpoints.uploadAvatar, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setUser(response.data.data);
      return { success: true, data: response.data, message: response.data.message };
    } catch (error) {
      const errorData = error.response?.data;
      return {
        success: false,
        message: errorData?.message || 'Failed to upload avatar',
        errors: errorData?.errors || {},
      };
    } finally {
      setLoading(false);
    }
  }, [userType]);

  // --- Email Verification ---
  const sendEmailVerification = useCallback(async (email = null, overrideUserType = null) => {
    const targetType = overrideUserType || userType || 'customer';
    setLoading(true);
    try {
      const response = await client.post(endpoints.sendVerification(targetType), email ? { email } : {});
      return { success: true, message: response.data.message };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to send verification notification',
      };
    } finally {
      setLoading(false);
    }
  }, [userType]);

  const verifyEmailOTP = useCallback(async (email, otp, overrideUserType = null) => {
    const targetType = overrideUserType || userType || 'customer';
    setLoading(true);
    try {
      const response = await client.post(endpoints.verifyEmail(targetType), { email, otp });
      if (token) {
        await fetchProfile();
      }
      return { success: true, message: response.data.message };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Verification failed',
      };
    } finally {
      setLoading(false);
    }
  }, [userType, token, fetchProfile]);

  // --- 2FA Methods ---
  const enable2FA = useCallback(async () => {
    if (!userType) return;
    setLoading(true);
    try {
      const response = await client.post(endpoints.twoFactorEnable(userType));
      return { success: true, data: response.data.data, message: response.data.message };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to start 2FA setup',
      };
    } finally {
      setLoading(false);
    }
  }, [userType]);

  const verify2FA = useCallback(async (code) => {
    if (!userType) return;
    setLoading(true);
    try {
      const response = await client.post(endpoints.twoFactorVerify(userType), { code });
      await fetchProfile();
      return { success: true, message: response.data.message };
    } catch (error) {
      const errorData = error.response?.data;
      return {
        success: false,
        message: errorData?.message || 'Failed to verify 2FA code',
        errors: errorData?.errors || {},
      };
    } finally {
      setLoading(false);
    }
  }, [userType, fetchProfile]);

  const disable2FA = useCallback(async () => {
    if (!userType) return;
    setLoading(true);
    try {
      const response = await client.delete(endpoints.twoFactorDisable(userType));
      await fetchProfile();
      return { success: true, message: response.data.message };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to disable 2FA',
      };
    } finally {
      setLoading(false);
    }
  }, [userType, fetchProfile]);

  const getRecoveryCodes = useCallback(async () => {
    if (!userType) return;
    setLoading(true);
    try {
      const response = await client.get(endpoints.twoFactorRecoveryCodes(userType));
      return { success: true, recovery_codes: response.data.data.recovery_codes };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch recovery codes',
      };
    } finally {
      setLoading(false);
    }
  }, [userType]);

  // --- Passkeys Methods ---
  const fetchPasskeys = useCallback(async () => {
    if (!userType) return;
    setLoading(true);
    try {
      const response = await client.get(endpoints.passkeysList(userType));
      return { success: true, passkeys: response.data.data.passkeys };
    } catch (error) {
      return { success: false, message: error.response?.data?.message };
    } finally {
      setLoading(false);
    }
  }, [userType]);

  const registerPasskey = useCallback(async (name, credentialId, credential) => {
    if (!userType) return;
    setLoading(true);
    try {
      const response = await client.post(endpoints.passkeysRegister(userType), {
        name,
        credential_id: credentialId,
        credential,
      });
      return { success: true, data: response.data, message: response.data.message };
    } catch (error) {
      const errorData = error.response?.data;
      return {
        success: false,
        message: errorData?.message || 'Passkey registration failed',
        errors: errorData?.errors || {},
      };
    } finally {
      setLoading(false);
    }
  }, [userType]);

  const deletePasskey = useCallback(async (id) => {
    if (!userType) return;
    setLoading(true);
    try {
      const response = await client.delete(endpoints.passkeysDelete(userType, id));
      return { success: true, message: response.data.message };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Failed to delete passkey' };
    } finally {
      setLoading(false);
    }
  }, [userType]);

  const passkeyLogin = useCallback(async (type, credentialId) => {
    setLoading(true);
    try {
      const response = await client.post(endpoints.passkeysLogin(type), {
        credential_id: credentialId,
      });
      const { token: newToken, user: userData } = response.data.data;
      setToken(newToken);
      setUser(userData);
      setUserType(type);
      return { success: true, data: response.data, message: response.data.message };
    } catch (error) {
      const errorData = error.response?.data;
      return {
        success: false,
        message: errorData?.message || 'Passkey login failed',
        errors: errorData?.errors || {},
      };
    } finally {
      setLoading(false);
    }
  }, []);

  // --- Google Integration Methods ---
  const fetchGoogleIntegration = useCallback(async () => {
    if (!userType) return;
    setLoading(true);
    try {
      const response = await client.get(endpoints.googleIntegration(userType));
      return { success: true, data: response.data.data };
    } catch (error) {
      return { success: false, message: error.response?.data?.message };
    } finally {
      setLoading(false);
    }
  }, [userType]);

  const connectGoogleIntegration = useCallback(async (payload) => {
    if (!userType) return;
    setLoading(true);
    try {
      const response = await client.post(endpoints.googleIntegration(userType), payload);
      await fetchProfile();
      return { success: true, data: response.data.data, message: response.data.message };
    } catch (error) {
      const errorData = error.response?.data;
      return {
        success: false,
        message: errorData?.message || 'Google integration failed',
        errors: errorData?.errors || {},
      };
    } finally {
      setLoading(false);
    }
  }, [userType, fetchProfile]);

  const disconnectGoogleIntegration = useCallback(async () => {
    if (!userType) return;
    setLoading(true);
    try {
      const response = await client.delete(endpoints.googleIntegration(userType));
      await fetchProfile();
      return { success: true, message: response.data.message };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Failed to disconnect Google account' };
    } finally {
      setLoading(false);
    }
  }, [userType, fetchProfile]);

  // --- Webhook Integration Methods (Workspace Members) ---
  const fetchWebhookIntegration = useCallback(async () => {
    if (userType !== 'member') return;
    setLoading(true);
    try {
      const response = await client.get(endpoints.webhookIntegration('member'));
      return { success: true, data: response.data.data };
    } catch (error) {
      return { success: false, message: error.response?.data?.message };
    } finally {
      setLoading(false);
    }
  }, [userType]);

  const saveWebhookIntegration = useCallback(async (payload) => {
    if (userType !== 'member') return;
    setLoading(true);
    try {
      const response = await client.post(endpoints.webhookIntegration('member'), payload);
      return { success: true, data: response.data.data, message: response.data.message };
    } catch (error) {
      const errorData = error.response?.data;
      return {
        success: false,
        message: errorData?.message || 'Failed to save Webhook settings',
        errors: errorData?.errors || {},
      };
    } finally {
      setLoading(false);
    }
  }, [userType]);

  const deleteWebhookIntegration = useCallback(async () => {
    if (userType !== 'member') return;
    setLoading(true);
    try {
      const response = await client.delete(endpoints.webhookIntegration('member'));
      return { success: true, message: response.data.message };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Failed to delete Webhook integration' };
    } finally {
      setLoading(false);
    }
  }, [userType]);

  // --- Telegram Integration Methods (Workspace Members) ---
  const fetchTelegramIntegration = useCallback(async () => {
    if (userType !== 'member') return;
    setLoading(true);
    try {
      const response = await client.get(endpoints.telegramIntegration('member'));
      return { success: true, data: response.data.data };
    } catch (error) {
      return { success: false, message: error.response?.data?.message };
    } finally {
      setLoading(false);
    }
  }, [userType]);

  const saveTelegramIntegration = useCallback(async (payload) => {
    if (userType !== 'member') return;
    setLoading(true);
    try {
      const response = await client.post(endpoints.telegramIntegration('member'), payload);
      return { success: true, data: response.data.data, message: response.data.message };
    } catch (error) {
      const errorData = error.response?.data;
      return {
        success: false,
        message: errorData?.message || 'Failed to save Telegram settings',
        errors: errorData?.errors || {},
      };
    } finally {
      setLoading(false);
    }
  }, [userType]);

  const deleteTelegramIntegration = useCallback(async () => {
    if (userType !== 'member') return;
    setLoading(true);
    try {
      const response = await client.delete(endpoints.telegramIntegration('member'));
      return { success: true, message: response.data.message };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Failed to delete Telegram integration' };
    } finally {
      setLoading(false);
    }
  }, [userType]);

  const activateTelegramWebhook = useCallback(async () => {
    if (userType !== 'member') return;
    setLoading(true);
    try {
      const response = await client.post(endpoints.telegramActivateWebhook('member'));
      return { success: true, data: response.data.data, message: response.data.message };
    } catch (error) {
      const errorData = error.response?.data;
      return {
        success: false,
        message: errorData?.message || 'Failed to activate Telegram webhook',
      };
    } finally {
      setLoading(false);
    }
  }, [userType]);

  // --- Email Integration Methods (Workspace Members) ---
  const fetchEmailIntegration = useCallback(async () => {
    if (userType !== 'member') return;
    setLoading(true);
    try {
      const response = await client.get(endpoints.emailIntegration('member'));
      return { success: true, data: response.data.data };
    } catch (error) {
      return { success: false, message: error.response?.data?.message };
    } finally {
      setLoading(false);
    }
  }, [userType]);

  const saveEmailIntegration = useCallback(async (payload) => {
    if (userType !== 'member') return;
    setLoading(true);
    try {
      const response = await client.post(endpoints.emailIntegration('member'), payload);
      return { success: true, data: response.data.data, message: response.data.message };
    } catch (error) {
      const errorData = error.response?.data;
      return {
        success: false,
        message: errorData?.message || 'Failed to save Email settings',
        errors: errorData?.errors || {},
      };
    } finally {
      setLoading(false);
    }
  }, [userType]);

  const deleteEmailIntegration = useCallback(async () => {
    if (userType !== 'member') return;
    setLoading(true);
    try {
      const response = await client.delete(endpoints.emailIntegration('member'));
      return { success: true, message: response.data.message };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Failed to delete Email integration' };
    } finally {
      setLoading(false);
    }
  }, [userType]);

  const testEmailIntegration = useCallback(async () => {
    if (userType !== 'member') return;
    setLoading(true);
    try {
      const response = await client.post(endpoints.emailIntegrationTest('member'));
      return { success: true, data: response.data.data, message: response.data.message };
    } catch (error) {
      const errorData = error.response?.data;
      return {
        success: false,
        message: errorData?.message || 'Failed to send test email',
      };
    } finally {
      setLoading(false);
    }
  }, [userType]);


  const value = {
    user,
    userType,
    token,
    loading,
    isAuthenticated,
    unreadCount,
    unreadChatCount,
    setUnreadCount,
    setUnreadChatCount,
    refreshUnreadCounts,
    login,
    googleAuth,
    register,
    logout,
    forgotPassword,
    resetPassword,
    fetchProfile,
    updateWorkspaceState,
    updateProfile,
    updatePassword,
    deleteAccount,
    uploadAvatar,
    sendEmailVerification,
    verifyEmailOTP,
    enable2FA,
    verify2FA,
    disable2FA,
    getRecoveryCodes,
    fetchPasskeys,
    registerPasskey,
    deletePasskey,
    passkeyLogin,
    fetchGoogleIntegration,
    connectGoogleIntegration,
    disconnectGoogleIntegration,
    fetchWebhookIntegration,
    saveWebhookIntegration,
    deleteWebhookIntegration,
    fetchTelegramIntegration,
    saveTelegramIntegration,
    activateTelegramWebhook,
    deleteTelegramIntegration,
    fetchEmailIntegration,
    saveEmailIntegration,
    deleteEmailIntegration,
    testEmailIntegration,
  };


  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
