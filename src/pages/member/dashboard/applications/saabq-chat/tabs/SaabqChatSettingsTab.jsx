import React, { useState, useEffect } from "react";
import client, { endpoints } from "../../../../../../api/client";
import Icon from "../../../../../../components/common/Icon";
import { useLanguage } from "../../../../../../context/LanguageContext";

export default function SaabqChatSettingsTab() {
  const { t } = useLanguage();
  const [settings, setSettings] = useState(null);
  const [_loading, setLoading] = useState(false);
  const [copiedKey, setCopiedKey] = useState(null);
  const [ssoLoading, setSsoLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    client
      .get(endpoints.workspaceSaabqChatSettings || endpoints.chatSettings)
      .then((res) => {
        setSettings(res.data?.data || null);
      })
      .catch(() => {
        setSettings(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleCopy = (key, text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 3000);
  };

  const handleOpenSso = async () => {
    setSsoLoading(true);
    try {
      const res = await client.get(
        endpoints.workspaceSaabqChatSsoUrl || endpoints.chatSsoUrl,
      );
      const url = res.data?.data?.url || res.data?.data?.sso_url;
      if (url) {
        window.open(url, "_blank", "noopener,noreferrer");
      } else {
        alert(t("ssoUrlNotFound") || "لم يتم العثور على رابط SSO لحسابك.");
      }
    } catch (err) {
      alert(
        err.response?.data?.message ||
          t("chat_sso_failed") ||
          "تعذر إنشاء رابط الدخول الموحد.",
      );
    } finally {
      setSsoLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <h3
          style={{
            margin: "0 0 6px",
            fontSize: "1.15rem",
            fontWeight: 800,
            color: "var(--heading)",
          }}
        >
          إعدادات منظومة وتكامل سابق شات (Saabq Chat Engine)
        </h3>
        <p
          style={{
            margin: 0,
            fontSize: "0.85rem",
            color: "var(--text-secondary)",
          }}
        >
          مراقبة الاتصال اللحظي بمحرك المحادثات، إعدادات الدخول الموحد، وتطبيقات
          لوحة المعلومات المضمنة.
        </p>
      </div>

      {/* System Health Card */}
      <div
        style={{
          background: "var(--surface)",
          borderRadius: "var(--radius-lg, 16px)",
          border: "1px solid var(--border)",
          padding: 24,
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: "#10b981",
                boxShadow: "0 0 8px #10b981",
              }}
            />
            <h4
              style={{
                margin: 0,
                fontSize: "1rem",
                fontWeight: 800,
                color: "var(--heading)",
              }}
            >
              حالة المحرك: متصل وجاهز للعمل (Connected)
            </h4>
          </div>
          <span
            style={{
              fontSize: "0.78rem",
              fontWeight: 700,
              padding: "4px 10px",
              borderRadius: 6,
              background: "rgba(2, 105, 130, 0.12)",
              color: "var(--primary)",
            }}
          >
            Chatwoot {settings?.version || "v4.17.1"}
          </span>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 16,
          }}
        >
          <div>
            <span style={{ fontSize: "0.76rem", color: "var(--muted)" }}>
              رابط المحرك (Base URL):
            </span>
            <div
              style={{
                fontSize: "0.88rem",
                fontWeight: 600,
                color: "var(--heading)",
                direction: "ltr",
                textAlign: "start",
              }}
            >
              {settings?.chat_base_url || settings?.engine_base_url || "—"}
            </div>
          </div>
          <div>
            <span style={{ fontSize: "0.76rem", color: "var(--muted)" }}>
              رقم الحساب (Account ID):
            </span>
            <div
              style={{
                fontSize: "0.88rem",
                fontWeight: 600,
                color: "var(--heading)",
              }}
            >
              {settings?.account_id ? `#${settings.account_id}` : "—"}
            </div>
          </div>
          <div>
            <span style={{ fontSize: "0.76rem", color: "var(--muted)" }}>
              الدخول الموحد (SSO):
            </span>
            <div>
              <button
                type="button"
                onClick={handleOpenSso}
                disabled={ssoLoading}
                className="btn btn-primary btn-sm"
                style={{ fontSize: "0.76rem", padding: "4px 12px", gap: 6 }}
              >
                <Icon name="external-link" size={13} />
                <span>
                  {ssoLoading
                    ? t("preparing") || "جاري التجهيز..."
                    : t("directSsoLogin") || "تسجيل الدخول المباشر (SSO)"}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Integration URLs */}
      <div
        style={{
          background: "var(--surface)",
          borderRadius: "var(--radius-lg, 16px)",
          border: "1px solid var(--border)",
          padding: 24,
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <h4
          style={{
            margin: "0 0 16px",
            fontSize: "1rem",
            fontWeight: 800,
            color: "var(--heading)",
          }}
        >
          عناوين الربط البرمجي والويب هوك (Endpoints & Embeds)
        </h4>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 6,
              }}
            >
              <span
                style={{
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  color: "var(--heading)",
                }}
              >
                رابط استقبال أحداث الويب هوك (Webhook URL):
              </span>
              <button
                type="button"
                onClick={() =>
                  handleCopy(
                    "webhook",
                    settings?.webhook_endpoint || settings?.webhook_url || "",
                  )
                }
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--primary)",
                  cursor: "pointer",
                  fontSize: "0.76rem",
                  fontWeight: 600,
                }}
              >
                {copiedKey === "webhook"
                  ? t("copied") || "تم النسخ!"
                  : t("copyLink") || "نسخ الرابط"}
              </button>
            </div>
            <div
              style={{
                background: "var(--surface-subtle, rgba(0,0,0,0.03))",
                padding: "8px 12px",
                borderRadius: 8,
                fontSize: "0.8rem",
                fontFamily: "monospace",
                color: "var(--heading)",
                direction: "ltr",
                textAlign: "start",
                border: "1px solid var(--border-subtle, rgba(0,0,0,0.05))",
              }}
            >
              {settings?.webhook_endpoint || settings?.webhook_url || "—"}
            </div>
          </div>

          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 6,
              }}
            >
              <span
                style={{
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  color: "var(--heading)",
                }}
              >
                رابط تطبيق لوحة المعلومات المضمن (Contextual Dashboard App URL):
              </span>
              <button
                type="button"
                onClick={() =>
                  handleCopy("embed", settings?.dashboard_app_url || "")
                }
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--primary)",
                  cursor: "pointer",
                  fontSize: "0.76rem",
                  fontWeight: 600,
                }}
              >
                {copiedKey === "embed"
                  ? t("copied") || "تم النسخ!"
                  : t("copyLink") || "نسخ الرابط"}
              </button>
            </div>
            <div
              style={{
                background: "var(--surface-subtle, rgba(0,0,0,0.03))",
                padding: "8px 12px",
                borderRadius: 8,
                fontSize: "0.8rem",
                fontFamily: "monospace",
                color: "var(--heading)",
                direction: "ltr",
                textAlign: "start",
                border: "1px solid var(--border-subtle, rgba(0,0,0,0.05))",
              }}
            >
              {settings?.dashboard_app_url || "—"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
