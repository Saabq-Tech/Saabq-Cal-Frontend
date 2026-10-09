import React, { useState, useEffect, useCallback } from "react";
import { Outlet } from "react-router-dom";
import { useLanguage } from "../../../../../context/LanguageContext";
import Icon from "../../../../../components/common/Icon";
import client, { endpoints } from "../../../../../api/client";
import WorkspacePageHeader from "../../../../../components/dashboard/WorkspacePageHeader";

export default function SaabqChatAppLayout() {
  const { t } = useLanguage();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState("");
  const [ssoUrl, setSsoUrl] = useState("");
  const [ssoLoading, setSsoLoading] = useState(false);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    setConnectError("");
    try {
      const res = await client.get(
        endpoints.workspaceSaabqChatSettings || endpoints.chatSettings,
      );
      const data = res.data?.data || null;
      setSettings(data);
    } catch {
      setSettings(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const isIntegrated = Boolean(settings?.is_integrated);

  // Fetch SSO link only if integrated
  useEffect(() => {
    if (!isIntegrated) {
      setSsoUrl("");
      return;
    }
    client
      .get(endpoints.workspaceSaabqChatSsoUrl || endpoints.chatSsoUrl)
      .then((res) => {
        const url = res.data?.data?.url || res.data?.data?.sso_url;
        if (url) setSsoUrl(url);
      })
      .catch(() => {
        setSsoUrl("");
      });
  }, [isIntegrated]);

  const handleLaunchSso = async () => {
    if (ssoUrl) {
      window.open(ssoUrl, "_blank", "noopener,noreferrer");
      return;
    }
    setSsoLoading(true);
    try {
      const res = await client.get(
        endpoints.workspaceSaabqChatSsoUrl || endpoints.chatSsoUrl,
      );
      const url = res.data?.data?.url || res.data?.data?.sso_url;
      if (url) {
        setSsoUrl(url);
        window.open(url, "_blank", "noopener,noreferrer");
      }
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        t("chat_sso_failed") ||
        "تعذر فتح لوحة سابق شات حالياً.";
      alert(msg);
    } finally {
      setSsoLoading(false);
    }
  };

  const handleConnectIntegration = async () => {
    setConnecting(true);
    setConnectError("");
    try {
      await client.post(
        endpoints.workspaceSaabqChatConnect ||
          "/workspace-members/workspace/applications/saabq-chat/connect",
      );
      await fetchSettings();
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        t("saabqChatConnectError") ||
        "تعذر ربط مساحة العمل بتطبيق سابق شات. يرجى التحقق من إعدادات الخادم والتوكنات.";
      setConnectError(msg);
    } finally {
      setConnecting(false);
    }
  };

  const getTranslatedErrorMessage = (msg) => {
    if (!msg) return "";
    const lower = String(msg).toLowerCase();
    if (
      lower.includes("platform is not configured") ||
      lower.includes("platform api tokens") ||
      lower.includes("chat_platform_not_configured") ||
      lower.includes("غير مهيأة")
    ) {
      return (
        t("chat_platform_not_configured") ||
        "منصة سابق شات غير مهيأة بعد على الخادم. يرجى التأكد من ضبط مفاتيح الربط البرمجي (API Tokens) في ملف البيئة الخاص بالنظام."
      );
    }
    if (
      lower.includes("failed to provision") ||
      lower.includes("chat_provision_failed") ||
      lower.includes("فشل في ربط")
    ) {
      return (
        t("chat_provision_failed") ||
        "فشل في ربط وتأسيس تكامل سابق شات لمساحة العمل هذه."
      );
    }
    if (
      lower.includes("workspace not found") ||
      lower.includes("لم يتم العثور على مساحة")
    ) {
      return t("workspaceNotFound") || "تعذر العثور على مساحة العمل المطلوبة.";
    }
    return msg;
  };

  const translatedError = getTranslatedErrorMessage(connectError);

  return (
    <div className="workspace-page-container animate-page-enter">
      {/* Top Application Header (Shown ONLY when integrated) */}
      {isIntegrated && (
        <WorkspacePageHeader
          title={t("saabqChatAppTitle") || "سابق شات"}
          subtitle={
            t("saabqChatAppDesc") ||
            "تطبيق المحادثات الموحد وإدارة تجربة العملاء والذكاء الاصطناعي"
          }
          icon="message-circle"
          actions={
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span
                className="profile-badge verified"
                style={{
                  fontSize: "0.82rem",
                  padding: "6px 14px",
                  borderRadius: "var(--radius-full, 9999px)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: "var(--success, #16a34a)",
                  }}
                />
                <span>
                  {t("connected")} #{settings?.account_id}
                </span>
              </span>

              <button
                type="button"
                onClick={handleLaunchSso}
                disabled={ssoLoading}
                className="btn btn-primary"
                style={{
                  gap: 8,
                  padding: "9px 18px",
                  fontSize: "0.88rem",
                  fontWeight: 700,
                  borderRadius: "var(--radius-md, 10px)",
                  boxShadow: "0 4px 14px rgba(2, 105, 130, 0.25)",
                }}
                title={t("saabqChatStandaloneDesc")}
              >
                <Icon name="external-link" size={15} />
                <span>
                  {ssoLoading ? t("redirecting") : t("saabqChatOpenStandalone")}
                </span>
              </button>
            </div>
          }
        />
      )}

      {loading ? (
        <div
          style={{
            background: "var(--surface)",
            borderRadius: "var(--radius-lg, 16px)",
            border: "1px solid var(--border)",
            padding: 60,
            textAlign: "center",
            color: "var(--muted)",
          }}
        >
          <div
            className="animate-spin"
            style={{
              width: 36,
              height: 36,
              margin: "0 auto 16px",
              border: "3px solid var(--border-light, #edf2f3)",
              borderTopColor: "var(--primary)",
              borderRadius: "50%",
            }}
          />
          <p
            style={{
              margin: 0,
              fontSize: "0.95rem",
              color: "var(--text-secondary)",
            }}
          >
            {t("checkingSaabqChatIntegration")}
          </p>
        </div>
      ) : !isIntegrated ? (
        /* Integration Gate: Matching CapabilityGate standard structure & platform teal palette */
        <div
          className="capability-gate-container animate-fade-in-up"
          style={{
            padding: "20px 24px",
            textAlign: "center",
            background: "transparent",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            margin: "80px auto 32px",
            maxWidth: 900,
            width: "100%",
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              width: 76,
              height: 76,
              borderRadius: "50%",
              background:
                "linear-gradient(135deg, rgba(2, 105, 130, 0.12), rgba(3, 196, 225, 0.12))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--primary)",
              marginBottom: 20,
              border: "1px solid rgba(2, 105, 130, 0.2)",
            }}
          >
            <Icon name="message-square" size={36} />
          </div>

          <span
            className="profile-badge verified"
            style={{
              fontSize: "0.82rem",
              padding: "6px 16px",
              marginBottom: 16,
              borderRadius: "var(--radius-full, 9999px)",
              background: "rgba(245, 158, 11, 0.12)",
              color: "#d97706",
              border: "1px solid rgba(245, 158, 11, 0.25)",
              fontWeight: 700,
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Icon name="sparkles" size={14} />
            <span>{t("notConnected") || "تكامل غير مفعل"}</span>
          </span>

          <h2
            style={{
              fontSize: "1.45rem",
              fontWeight: 800,
              color: "var(--heading)",
              marginBottom: 12,
              maxWidth: 560,
            }}
          >
            {t("saabqChatNotIntegratedTitle") || "تكامل سابق شات غير مفعل"}
          </h2>

          <p
            style={{
              fontSize: "0.95rem",
              color: "var(--text-secondary)",
              maxWidth: 580,
              lineHeight: 1.7,
              margin: "0 auto 28px",
            }}
          >
            {t("saabqChatNotIntegratedDesc") ||
              "لم يتم ربط مساحة العمل هذه بمنصة سابق شات حتى الآن. لا يمكن عرض أي محادثات أو بيانات أو تنفيذ عمليات حتى يتم تفعيل التكامل بنجاح."}
          </p>

          {translatedError && (
            <div
              style={{
                maxWidth: 580,
                width: "100%",
                padding: "12px 16px",
                marginBottom: 20,
                borderRadius: "var(--radius-md, 10px)",
                background: "var(--badge-danger-bg, #fee2e2)",
                border: "1px solid var(--badge-danger-border, #fecaca)",
                color: "var(--badge-danger-color, #b91c1c)",
                fontSize: "0.88rem",
                display: "flex",
                alignItems: "center",
                gap: 10,
                textAlign: "start",
                lineHeight: 1.5,
              }}
            >
              <Icon name="alert-triangle" size={16} style={{ flexShrink: 0 }} />
              <span style={{ fontWeight: 600 }}>{translatedError}</span>
            </div>
          )}

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            <button
              type="button"
              onClick={handleConnectIntegration}
              disabled={connecting}
              className="btn btn-primary"
              style={{
                padding: "12px 28px",
                fontSize: "0.98rem",
                fontWeight: 700,
                borderRadius: "var(--radius-md, 12px)",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                boxShadow: "0 4px 14px rgba(2, 105, 130, 0.25)",
              }}
            >
              {connecting ? (
                <>
                  <span
                    className="animate-spin"
                    style={{
                      width: 16,
                      height: 16,
                      border: "2px solid #ffffff",
                      borderTopColor: "transparent",
                      borderRadius: "50%",
                    }}
                  />
                  <span>
                    {t("connectingAndActivating") || "جاري التفعيل والربط..."}
                  </span>
                </>
              ) : (
                <>
                  <Icon name="zap" size={18} />
                  <span>
                    {t("activateSaabqChatNow") || "تفعيل وربط سابق شات الآن"}
                  </span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={fetchSettings}
              disabled={connecting}
              className="btn btn-secondary"
              style={{
                padding: "12px 24px",
                fontSize: "0.95rem",
                fontWeight: 600,
                borderRadius: "var(--radius-md, 12px)",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Icon name="refresh-cw" size={16} />
              <span>{t("recheck") || "إعادة التحقق"}</span>
            </button>
          </div>
        </div>
      ) : (
        /* Valid Integration State: Render View Content */
        <div className="saabq-chat-content-view">
          <Outlet context={{ settings, refetchSettings: fetchSettings }} />
        </div>
      )}
    </div>
  );
}
