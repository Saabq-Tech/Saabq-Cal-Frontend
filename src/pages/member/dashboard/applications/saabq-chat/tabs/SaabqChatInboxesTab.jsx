import React, { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { useLanguage } from "../../../../../../context/LanguageContext";
import client, { endpoints } from "../../../../../../api/client";
import Icon from "../../../../../../components/common/Icon";

export default function SaabqChatInboxesTab() {
  const { t } = useLanguage();
  const { settings } = useOutletContext() || {};
  const [inboxes, setInboxes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    setLoading(true);
    client
      .get(endpoints.workspaceSaabqChatInboxes || endpoints.chatInboxes)
      .then((res) => {
        const list = res.data?.data?.inboxes || res.data?.data || [];
        setInboxes(Array.isArray(list) ? list : []);
      })
      .catch(() => {
        setInboxes([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleCopyScript = (token) => {
    const baseUrl = settings?.chat_base_url || "https://chat.saabq.com";
    const script = `<script>
  (function(d,t) {
    var BASE_URL="${baseUrl}";
    var g=d.createElement(t),s=d.getElementsByTagName(t)[0];
    g.src=BASE_URL+"/packs/js/sdk.js";
    g.async=true;
    s.parentNode.insertBefore(g,s);
    g.onload=function(){
      window.chatwootSDK.run({
        websiteToken: '${token}',
        baseUrl: BASE_URL
      })
    }
  })(document,"script");
</script>`;
    navigator.clipboard.writeText(script);
    setCopiedId(token);
    setTimeout(() => setCopiedId(null), 3000);
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
          {t("inboxesAndChannels")}
        </h3>
        <p
          style={{
            margin: 0,
            fontSize: "0.86rem",
            color: "var(--text-secondary)",
          }}
        >
          {t("inboxesAndChannelsDesc")}
        </p>
      </div>

      {loading ? (
        <div
          style={{ padding: 40, textAlign: "center", color: "var(--muted)" }}
        >
          {t("loadingInboxes")}
        </div>
      ) : inboxes.length === 0 ? (
        <div
          style={{
            background: "var(--surface)",
            borderRadius: "var(--radius-lg, 16px)",
            border: "1px solid var(--border)",
            padding: "48px 24px",
            textAlign: "center",
            color: "var(--muted)",
          }}
        >
          {t("noInboxesFound")}
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: 18,
          }}
        >
          {inboxes.map((inbox) => {
            const isWeb = inbox.channel_type?.includes("Web");
            const isWa = inbox.channel_type?.includes("Whatsapp");
            const isTg = inbox.channel_type?.includes("Telegram");

            return (
              <div
                key={inbox.id}
                style={{
                  background: "var(--surface)",
                  borderRadius: "var(--radius-lg, 16px)",
                  border: "1px solid var(--border)",
                  padding: 20,
                  boxShadow: "var(--shadow-sm)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      marginBottom: 12,
                    }}
                  >
                    <div
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: 10,
                        background: isWa
                          ? "#25D36622"
                          : isTg
                            ? "#0088cc22"
                            : "rgba(2, 105, 130, 0.12)",
                        color: isWa
                          ? "#25D366"
                          : isTg
                            ? "#0088cc"
                            : "var(--primary)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Icon
                        name={
                          isWa
                            ? "phone"
                            : isTg
                              ? "send"
                              : isWeb
                                ? "globe"
                                : "mail"
                        }
                        size={20}
                      />
                    </div>
                    <div>
                      <h4
                        style={{
                          margin: 0,
                          fontSize: "0.95rem",
                          fontWeight: 800,
                          color: "var(--heading)",
                        }}
                      >
                        {inbox.name}
                      </h4>
                      <span
                        style={{
                          fontSize: "0.72rem",
                          fontWeight: 700,
                          color:
                            inbox.status === "active" ? "#10b981" : "#64748b",
                        }}
                      >
                        ●{" "}
                        {inbox.status === "active"
                          ? t("connectedAndActive") || "متصل ونشط"
                          : t("configuredStatus") || "مهيأ"}
                      </span>
                    </div>
                  </div>

                  <p
                    style={{
                      fontSize: "0.82rem",
                      color: "var(--text-secondary)",
                      lineHeight: 1.6,
                      marginBottom: 14,
                    }}
                  >
                    {inbox.greeting ||
                      "استقبال وتوجيه رسائل العملاء تلقائياً لخدمة المواعيد."}
                  </p>

                  {inbox.website_token && (
                    <div
                      style={{
                        background: "var(--surface-subtle, rgba(0,0,0,0.03))",
                        padding: "10px 12px",
                        borderRadius: 8,
                        fontSize: "0.76rem",
                        fontFamily: "monospace",
                        color: "var(--heading)",
                        wordBreak: "break-all",
                        marginBottom: 14,
                        border:
                          "1px solid var(--border-subtle, rgba(0,0,0,0.05))",
                      }}
                    >
                      Token: {inbox.website_token}
                    </div>
                  )}

                  {inbox.phone_number && (
                    <div
                      style={{
                        fontSize: "0.82rem",
                        fontWeight: 600,
                        color: "var(--heading)",
                        marginBottom: 14,
                      }}
                    >
                      رقم الواتساب:{" "}
                      <span
                        style={{ direction: "ltr", display: "inline-block" }}
                      >
                        {inbox.phone_number}
                      </span>
                    </div>
                  )}

                  {inbox.bot_username && (
                    <div
                      style={{
                        fontSize: "0.82rem",
                        fontWeight: 600,
                        color: "var(--heading)",
                        marginBottom: 14,
                      }}
                    >
                      اسم البوت:{" "}
                      <span
                        style={{
                          direction: "ltr",
                          display: "inline-block",
                          color: "#0088cc",
                        }}
                      >
                        {inbox.bot_username}
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  {isWeb ? (
                    <button
                      type="button"
                      onClick={() => handleCopyScript(inbox.website_token)}
                      className="btn btn-secondary btn-sm"
                      style={{
                        width: "100%",
                        justifyContent: "center",
                        gap: 6,
                      }}
                    >
                      <Icon
                        name={
                          copiedId === inbox.website_token ? "check" : "copy"
                        }
                        size={14}
                      />
                      <span>
                        {copiedId === inbox.website_token
                          ? t("copied")
                          : t("copyEmbedCode")}
                      </span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="btn btn-secondary btn-sm"
                      style={{
                        width: "100%",
                        justifyContent: "center",
                        opacity: 0.8,
                      }}
                    >
                      <span>{t("connected")}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
