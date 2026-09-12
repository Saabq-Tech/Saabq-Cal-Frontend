import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { usePermissions } from "../../../hooks/usePermissions";
import { useToast } from "../../../context/ToastContext";
import { useLanguage } from "../../../context/LanguageContext";
import SEO from "../../../components/ui/SEO";
import Icon from "../../../components/common/Icon";
import PageLoader from "../../../components/ui/PageLoader";
import client, { endpoints } from "../../../api/client";
import { isApiIntegrationEnabled } from "../../../utils/capabilities";

export default function WorkspaceApiIntegrationPage() {
  const { user } = useAuth();
  const {
    isOwner,
    canReadIntegrations,
    canCreateIntegrations,
    canUpdateIntegrations,
  } = usePermissions();
  const { t, lang } = useLanguage();
  const toast = useToast();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("credentials"); // credentials | playground | docs | sync_guide
  const [loading, setLoading] = useState(true);
  const [apiData, setApiData] = useState(null);

  // Request Access Modal State
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestAppName, setRequestAppName] = useState(
    "Main Website Integration",
  );
  const [requestNotes, setRequestNotes] = useState("");
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);

  // Reveal Secret Modal State
  const [showRevealModal, setShowRevealModal] = useState(false);
  const [revealPassword, setRevealPassword] = useState("");
  const [revealedSecret, setRevealedSecret] = useState(null);
  const [isRevealingSecret, setIsRevealingSecret] = useState(false);
  const [copiedField, setCopiedField] = useState(null);

  // Regenerate Confirmation Modal State
  const [showRegenerateModal, setShowRegenerateModal] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  // Playground State
  const [selectedEndpoint, setSelectedEndpoint] = useState("ping");
  const [playgroundServiceId, _setPlaygroundServiceId] = useState("");
  const [playgroundDate, setPlaygroundDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [playgroundPayload, setPlaygroundPayload] = useState("");
  const [isTestingPlayground, setIsTestingPlayground] = useState(false);
  const [playgroundResponse, setPlaygroundResponse] = useState(null);
  const [playgroundLatency, setPlaygroundLatency] = useState(null);

  // Docs Active Code Language
  const [codeLang, setCodeLang] = useState("curl"); // curl | js | php | python

  // Quick Ping State
  const [isPinging, setIsPinging] = useState(false);
  const [pingResult, setPingResult] = useState(null);

  useEffect(() => {
    document.title = `${t("apiIntegrationTitle") || "REST API Integration"} - Saabq`;
    loadApiIntegration();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadApiIntegration = async () => {
    if (!isApiIntegrationEnabled(user) || (!isOwner && !canReadIntegrations)) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await client.get(endpoints.apiIntegration("member"));
      if (res.data?.success) {
        setApiData(res.data.data);
      }
    } catch (err) {
      console.error("Failed to load API integration details", err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text, fieldName) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    toast?.show?.(t("copiedToClipboard") || "اتنسخ بنجاح!", "success");
    setTimeout(() => setCopiedField(null), 2500);
  };

  const handleRequestAccess = async (e) => {
    e.preventDefault();
    if (!requestNotes.trim() || requestNotes.trim().length < 10) {
      toast?.show?.(
        t("requestNotesRequired") ||
          "من فضلك اكتب سبب الاستخدام وموقع الويب (10 حروف على الأقل)",
        "error",
      );
      return;
    }

    setIsSubmittingRequest(true);
    try {
      const res = await client.post(endpoints.apiIntegrationRequest("member"), {
        name: requestAppName,
        request_notes: requestNotes,
      });

      if (res.data?.success) {
        toast?.show?.(
          res.data.message || t("apiRequestedSuccess") || "الطلب اتبعت بنجاح",
          "success",
        );
        setShowRequestModal(false);
        loadApiIntegration();
      }
    } catch (err) {
      toast?.show?.(
        err.response?.data?.message || t("errorOccurred") || "حدث خطأ",
        "error",
      );
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  const handleRevealSecret = async (e) => {
    e.preventDefault();
    if (!revealPassword) return;

    setIsRevealingSecret(true);
    try {
      const res = await client.post(endpoints.apiIntegrationReveal("member"), {
        password: revealPassword,
      });

      if (res.data?.success && res.data.data?.api_secret) {
        setRevealedSecret(res.data.data.api_secret);
        setRevealPassword("");
      }
    } catch (err) {
      toast?.show?.(
        err.response?.data?.message ||
          t("incorrectPassword") ||
          "كلمة المرور غير صحيحة",
        "error",
      );
    } finally {
      setIsRevealingSecret(false);
    }
  };

  const handleRegenerateSecret = async () => {
    setIsRegenerating(true);
    try {
      const res = await client.post(
        endpoints.apiIntegrationRegenerate("member"),
      );
      if (res.data?.success) {
        toast?.show?.(
          res.data.message ||
            t("secretRegeneratedSuccess") ||
            "المفتاح السري اتغيّر بنجاح",
          "success",
        );
        setShowRegenerateModal(false);
        if (res.data.data?.api_secret) {
          setRevealedSecret(res.data.data.api_secret);
          setShowRevealModal(true);
        }
        loadApiIntegration();
      }
    } catch (err) {
      toast?.show?.(
        err.response?.data?.message || t("errorOccurred") || "حدث خطأ",
        "error",
      );
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleQuickPing = async () => {
    setIsPinging(true);
    setPingResult(null);
    const startTime = Date.now();
    try {
      const res = await client.post(endpoints.apiIntegrationVerify("member"));
      const duration = Date.now() - startTime;
      if (res.data?.success) {
        setPingResult({
          success: true,
          latency: duration,
          data: res.data.data,
        });
        toast?.show?.(
          `${t("connectionActive") || "الاتصال نشط"} (${duration}ms)`,
          "success",
        );
      }
    } catch (err) {
      const duration = Date.now() - startTime;
      setPingResult({
        success: false,
        latency: duration,
        error: err.response?.data?.message || "Failed to connect",
      });
      toast?.show?.(t("connectionFailed") || "الاتصال بالسيرفر منجحش", "error");
    } finally {
      setIsPinging(false);
    }
  };

  const handlePlaygroundSend = async () => {
    setIsTestingPlayground(true);
    setPlaygroundResponse(null);
    const startTime = Date.now();

    try {
      let res;
      if (selectedEndpoint === "ping") {
        res = await client.post(endpoints.apiIntegrationVerify("member"));
      } else if (selectedEndpoint === "services") {
        res = await client.get(endpoints.workspaceServices);
      } else if (selectedEndpoint === "slots") {
        res = await client.get(
          `${endpoints.workspaceServices}/${playgroundServiceId || 1}`,
        );
      } else if (selectedEndpoint === "bookings") {
        res = await client.get(endpoints.workspaceBookings, {
          params: { per_page: 5 },
        });
      } else if (selectedEndpoint === "create_booking") {
        const payload = playgroundPayload
          ? JSON.parse(playgroundPayload)
          : {
              service_id: 1,
              customer_name: "John Doe",
              customer_email: "john@example.com",
              starts_at: `${playgroundDate} 10:00:00`,
              notes: "Test booking via API Playground",
            };
        res = await client.post(endpoints.workspaceBookings, payload);
      }

      const duration = Date.now() - startTime;
      setPlaygroundLatency(duration);
      setPlaygroundResponse({
        status: res.status,
        statusText: res.statusText || "OK",
        data: res.data,
      });
    } catch (err) {
      const duration = Date.now() - startTime;
      setPlaygroundLatency(duration);
      setPlaygroundResponse({
        status: err.response?.status || 500,
        statusText: err.response?.statusText || "Error",
        data: err.response?.data || { message: err.message },
      });
    } finally {
      setIsTestingPlayground(false);
    }
  };

  const handleDownloadPostman = () => {
    const postmanJson = {
      info: {
        name: `${user?.workspace?.name || "Saabq"} REST API Collection`,
        schema:
          "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
      },
      variable: [
        {
          key: "base_url",
          value: "https://admin.cal.saabq.com/api/v1/external",
        },
        { key: "api_key", value: apiData?.api_key || "YOUR_API_KEY" },
        { key: "api_secret", value: "YOUR_API_SECRET" },
      ],
      item: [
        {
          name: "1. Ping & Verify",
          request: {
            method: "GET",
            header: [
              { key: "X-Api-Key", value: "{{api_key}}" },
              { key: "X-Api-Secret", value: "{{api_secret}}" },
              { key: "Accept", value: "application/json" },
            ],
            url: { raw: "{{base_url}}/ping" },
          },
        },
        {
          name: "2. List Services",
          request: {
            method: "GET",
            header: [
              { key: "X-Api-Key", value: "{{api_key}}" },
              { key: "X-Api-Secret", value: "{{api_secret}}" },
              { key: "Accept", value: "application/json" },
            ],
            url: { raw: "{{base_url}}/services" },
          },
        },
        {
          name: "3. Check Available Slots",
          request: {
            method: "GET",
            header: [
              { key: "X-Api-Key", value: "{{api_key}}" },
              { key: "X-Api-Secret", value: "{{api_secret}}" },
              { key: "Accept", value: "application/json" },
            ],
            url: {
              raw: "{{base_url}}/services/1/slots?date=2026-09-15",
            },
          },
        },
        {
          name: "4. Create Booking",
          request: {
            method: "POST",
            header: [
              { key: "X-Api-Key", value: "{{api_key}}" },
              { key: "X-Api-Secret", value: "{{api_secret}}" },
              { key: "Accept", value: "application/json" },
              { key: "Content-Type", value: "application/json" },
            ],
            body: {
              mode: "raw",
              raw: JSON.stringify(
                {
                  service_id: 1,
                  customer_name: "Customer Name",
                  customer_email: "client@example.com",
                  customer_phone: "+966500000000",
                  starts_at: "2026-09-15 10:00:00",
                  notes: "Booking created via REST API",
                },
                null,
                2,
              ),
            },
            url: { raw: "{{base_url}}/bookings" },
          },
        },
      ],
    };

    const blob = new Blob([JSON.stringify(postmanJson, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `saabq-api-${user?.workspace?.slug || "workspace"}.postman_collection.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast?.show?.(
      t("postmanDownloaded") || "ملف Postman نزل بنجاح!",
      "success",
    );
  };

  const isPending = apiData?.status === "pending_approval";
  const isActive = apiData?.status === "active";
  const isNotRequested =
    !apiData || apiData.status === "not_requested" || !apiData.has_key;

  if (!isApiIntegrationEnabled(user)) {
    return (
      <div
        className="workspace-dashboard-shell animate-fade-in"
        dir={lang === "ar" ? "rtl" : "ltr"}
        style={{ padding: "60px 28px", textAlign: "center" }}
      >
        <SEO
          title={`${t("apiIntegrationTitle") || "REST API Integration"} - Saabq`}
          noindex
        />
        <div style={{ maxWidth: 520, margin: "0 auto" }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              backgroundColor: "rgba(239, 68, 68, 0.1)",
              color: "#ef4444",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
            }}
          >
            <Icon name="lock" size={32} />
          </div>
          <h2 style={{ fontSize: "1.3rem", fontWeight: 800, marginBottom: 8 }}>
            {t("apiIntegrationDisabledTitle") || "الربط البرمجي مش متاح"}
          </h2>
          <p
            style={{
              fontSize: "0.9rem",
              color: "var(--text-muted)",
              lineHeight: 1.6,
              marginBottom: 24,
            }}
          >
            {t("apiIntegrationDisabledDesc") ||
              "ميزة الربط البرمجي الخارجي متعطلة لمساحة العمل دي من إدارة المنصة أو باقتك الحالية."}
          </p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => navigate("/member/workspace")}
            style={{ borderRadius: 12, padding: "10px 24px", fontWeight: 700 }}
          >
            {t("backToDashboard") || "ارجع للوحة التحكم"}
          </button>
        </div>
      </div>
    );
  }

  if (!isOwner && !canReadIntegrations) {
    return (
      <div
        className="workspace-dashboard-shell animate-fade-in"
        dir={lang === "ar" ? "rtl" : "ltr"}
        style={{ padding: "60px 28px", textAlign: "center" }}
      >
        <SEO
          title={`${t("apiIntegrationTitle") || "REST API Integration"} - Saabq`}
          noindex
        />
        <div style={{ maxWidth: 520, margin: "0 auto" }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              backgroundColor: "rgba(239, 68, 68, 0.1)",
              color: "#ef4444",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
            }}
          >
            <Icon name="lock" size={32} />
          </div>
          <h2 style={{ fontSize: "1.3rem", fontWeight: 800, marginBottom: 8 }}>
            {lang === "ar"
              ? "غير مصرح لك بالوصول للربط البرمجي"
              : "Access Denied"}
          </h2>
          <p
            style={{
              fontSize: "0.9rem",
              color: "var(--text-muted)",
              lineHeight: 1.6,
              marginBottom: 24,
            }}
          >
            {lang === "ar"
              ? "ليس لديك صلاحية قراءة أو إدارة واجهات الـ REST API في مساحة العمل هذه."
              : "You do not have the required permissions to view or manage REST API integrations in this workspace."}
          </p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => navigate("/member/workspace")}
            style={{ borderRadius: 12, padding: "10px 24px", fontWeight: 700 }}
          >
            {t("backToDashboard") || "ارجع للوحة التحكم"}
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div
        className="workspace-dashboard-shell animate-fade-in"
        style={{
          padding: "60px 28px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: 300,
        }}
      >
        <PageLoader />
      </div>
    );
  }

  return (
    <div
      className="workspace-dashboard-shell animate-fade-in"
      dir={lang === "ar" ? "rtl" : "ltr"}
    >
      <SEO
        title={`${t("apiIntegrationTitle") || "REST API Integration"} - Saabq`}
        description="Connect your business website and apps to your Saabq workspace via secure REST API."
      />

      <div style={{ padding: "0 28px 40px" }}>
        {/* Header Title Bar */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 16,
            marginBottom: 24,
            paddingBottom: 20,
            borderBottom: "1px solid var(--border)",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 12,
                  backgroundColor: "rgba(32, 123, 89, 0.12)",
                  color: "var(--primary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon name="code" size={24} />
              </div>
              <div>
                <h1 style={{ fontSize: "1.4rem", fontWeight: 800, margin: 0 }}>
                  {t("apiIntegrationTitle") ||
                    "الربط البرمجي للمطورين (REST API)"}
                </h1>
                <p
                  style={{
                    fontSize: "0.85rem",
                    color: "var(--text-muted)",
                    margin: "4px 0 0",
                  }}
                >
                  {t("apiIntegrationHeaderDesc") ||
                    "ربط موقعك وتطبيقاتك الخارجية بمساحة عملك مع مزامنة لحظية ومستندات برمجية شاملة."}
                </p>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {isActive && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleDownloadPostman}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: "0.82rem",
                }}
              >
                <Icon name="download" size={14} />
                <span>{t("downloadPostman") || "نزّل كولكشن Postman"}</span>
              </button>
            )}

            {isActive && (
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleQuickPing}
                disabled={isPinging}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: "0.82rem",
                }}
              >
                <Icon name="activity" size={14} />
                <span>
                  {isPinging
                    ? t("testing") || "جارِ الفحص..."
                    : t("testConnection") || "فحص الاتصال اللحظي"}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div
          className="no-scrollbar"
          style={{
            display: "flex",
            gap: 8,
            marginBottom: 24,
            borderBottom: "1px solid var(--border)",
            paddingBottom: 10,
            overflowX: "auto",
            WebkitOverflowScrolling: "touch",
            scrollbarWidth: "none",
            flexWrap: "nowrap",
          }}
        >
          <button
            type="button"
            className={`btn ${activeTab === "credentials" ? "btn-primary" : "btn-ghost"}`}
            onClick={() => setActiveTab("credentials")}
            style={{
              fontSize: "0.85rem",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexShrink: 0,
              whiteSpace: "nowrap",
            }}
          >
            <Icon name="key" size={16} />
            <span>
              {t("apiCredentialsTab") || "بيانات الاعتماد والإعدادات"}
            </span>
          </button>

          <button
            type="button"
            className={`btn ${activeTab === "playground" ? "btn-primary" : "btn-ghost"}`}
            onClick={() => setActiveTab("playground")}
            style={{
              fontSize: "0.85rem",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexShrink: 0,
              whiteSpace: "nowrap",
            }}
          >
            <Icon name="play" size={16} />
            <span>
              {t("apiPlaygroundTab") || "منصة الاختبار والتحقق (Playground)"}
            </span>
          </button>

          <button
            type="button"
            className={`btn ${activeTab === "docs" ? "btn-primary" : "btn-ghost"}`}
            onClick={() => setActiveTab("docs")}
            style={{
              fontSize: "0.85rem",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexShrink: 0,
              whiteSpace: "nowrap",
            }}
          >
            <Icon name="file-text" size={16} />
            <span>{t("apiDocsTab") || "مستندات الـ API والأكواد"}</span>
          </button>

          <button
            type="button"
            className={`btn ${activeTab === "sync_guide" ? "btn-primary" : "btn-ghost"}`}
            onClick={() => setActiveTab("sync_guide")}
            style={{
              fontSize: "0.85rem",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexShrink: 0,
              whiteSpace: "nowrap",
            }}
          >
            <Icon name="refresh-cw" size={16} />
            <span>{t("apiSyncGuideTab") || "دليل المزامنة التلقائية"}</span>
          </button>
        </div>

        {/* Quick Ping Banner Result if any */}
        {pingResult && (
          <div
            style={{
              padding: "12px 18px",
              borderRadius: 12,
              marginBottom: 20,
              backgroundColor: pingResult.success
                ? "rgba(16, 185, 129, 0.1)"
                : "rgba(239, 68, 68, 0.1)",
              border: `1px solid ${pingResult.success ? "rgba(16, 185, 129, 0.3)" : "rgba(239, 68, 68, 0.3)"}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: "0.85rem",
              fontWeight: 600,
              color: pingResult.success ? "#059669" : "#dc2626",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Icon
                name={pingResult.success ? "check-circle" : "alert-triangle"}
                size={18}
              />
              <span>
                {pingResult.success
                  ? `${t("pingSuccess") || "الاتصال شغال بنجاح!"} (زمن الاستجابة: ${pingResult.latency}ms)`
                  : `${t("pingFailed") || "الاتصال منجحش:"} ${pingResult.error}`}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setPingResult(null)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "inherit",
                fontWeight: 700,
              }}
            >
              ✕
            </button>
          </div>
        )}

        {/* TAB 1: CREDENTIALS & SETTINGS */}
        {activeTab === "credentials" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {/* Status Hero / Cards */}
            {isNotRequested && (
              <div
                style={{
                  padding: 40,
                  textAlign: "center",
                  backgroundColor: "var(--surface)",
                  borderRadius: 16,
                  border: "1px dashed var(--border)",
                  boxShadow: "var(--shadow-sm)",
                }}
              >
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: "50%",
                    backgroundColor: "rgba(32, 123, 89, 0.12)",
                    color: "var(--primary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 16px",
                  }}
                >
                  <Icon name="code" size={30} />
                </div>
                <h2
                  style={{
                    fontSize: "1.2rem",
                    fontWeight: 800,
                    margin: "0 0 8px",
                  }}
                >
                  {t("unlockApiAccess") ||
                    "تفعيل الربط البرمجي لمساحة عملك (REST API)"}
                </h2>
                <p
                  style={{
                    fontSize: "0.9rem",
                    color: "var(--text-muted)",
                    maxWidth: 520,
                    margin: "0 auto 24px",
                  }}
                >
                  {t("unlockApiDesc") ||
                    "الربط البرمجي بيتيحلك تستقبل الحجوزات من موقعك الخاص، وتستعلم عن الخدمات والمواعيد المتاحة، مع مزامنة لحظية 100% مع لوحة تحكم سابق."}
                </p>
                {(isOwner ||
                  canCreateIntegrations ||
                  canUpdateIntegrations) && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => setShowRequestModal(true)}
                    style={{
                      fontSize: "0.9rem",
                      fontWeight: 700,
                      padding: "12px 28px",
                    }}
                  >
                    <Icon name="send" size={16} />
                    <span>
                      {t("requestApiAccessBtn") || "طلب تفعيل مفاتيح الـ API"}
                    </span>
                  </button>
                )}
              </div>
            )}

            {isPending && (
              <div
                style={{
                  padding: 24,
                  backgroundColor: "rgba(59, 130, 246, 0.08)",
                  borderRadius: 16,
                  border: "1px solid rgba(59, 130, 246, 0.3)",
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    backgroundColor: "rgba(59, 130, 246, 0.15)",
                    color: "#2563eb",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Icon name="clock" size={24} />
                </div>
                <div>
                  <h3
                    style={{
                      fontSize: "1rem",
                      fontWeight: 800,
                      color: "#1d4ed8",
                      margin: "0 0 4px",
                    }}
                  >
                    {t("apiPendingReview") ||
                      "طلبك تحت المراجعة والاعتماد من إدارة سابق"}
                  </h3>
                  <p
                    style={{
                      fontSize: "0.85rem",
                      color: "var(--text-muted)",
                      margin: 0,
                    }}
                  >
                    {t("apiPendingReviewDesc") ||
                      "طلب الوصول للـ API وصل بنجاح. المسؤول هيفعل المفتاح ويحدد الصلاحيات المتاحة على طول."}
                  </p>
                </div>
              </div>
            )}

            {isActive && (
              <>
                {/* Active Credentials Box */}
                <div
                  style={{
                    backgroundColor: "var(--surface)",
                    borderRadius: 16,
                    padding: 24,
                    border: "1px solid var(--border)",
                    boxShadow: "var(--shadow-sm)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 20,
                      flexWrap: "wrap",
                      gap: 10,
                    }}
                  >
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 10 }}
                    >
                      <span
                        style={{
                          display: "inline-block",
                          width: 10,
                          height: 10,
                          borderRadius: "50%",
                          backgroundColor: "#10b981",
                          boxShadow: "0 0 0 3px rgba(16, 185, 129, 0.2)",
                        }}
                      />
                      <h3
                        style={{ fontSize: "1rem", fontWeight: 800, margin: 0 }}
                      >
                        {t("activeCredentialsTitle") ||
                          "بيانات الاعتماد النشطة (Active Credentials)"}
                      </h3>
                    </div>

                    <span
                      style={{
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        backgroundColor: "rgba(16, 185, 129, 0.12)",
                        color: "#059669",
                        padding: "4px 10px",
                        borderRadius: 20,
                      }}
                    >
                      {t("statusActive") || "نشط ومعتمد"}
                    </span>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(320px, 1fr))",
                      gap: 20,
                    }}
                  >
                    {/* API Key */}
                    <div>
                      <label
                        style={{
                          fontSize: "0.8rem",
                          fontWeight: 700,
                          color: "var(--text-muted)",
                          display: "block",
                          marginBottom: 6,
                        }}
                      >
                        {t("apiKeyLabel") || "مفتاح API العام (X-Api-Key)"}
                      </label>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          backgroundColor: "var(--background)",
                          borderRadius: 10,
                          border: "1px solid var(--border)",
                          padding: "8px 12px",
                          gap: 8,
                        }}
                      >
                        <code
                          style={{
                            fontFamily: "monospace",
                            fontSize: "0.82rem",
                            flex: 1,
                            overflowX: "auto",
                            direction: "ltr",
                            textAlign: "left",
                          }}
                        >
                          {apiData?.api_key}
                        </code>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() =>
                            copyToClipboard(apiData?.api_key, "api_key")
                          }
                          style={{ fontSize: "0.75rem", padding: "4px 10px" }}
                        >
                          <Icon
                            name={copiedField === "api_key" ? "check" : "copy"}
                            size={13}
                          />
                          <span>
                            {copiedField === "api_key"
                              ? t("copied") || "تم النسخ"
                              : t("copy") || "نسخ"}
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* Secret Key */}
                    <div>
                      <label
                        style={{
                          fontSize: "0.8rem",
                          fontWeight: 700,
                          color: "var(--text-muted)",
                          display: "block",
                          marginBottom: 6,
                        }}
                      >
                        {t("secretKeyLabel") || "المفتاح السري (X-Api-Secret)"}
                      </label>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          backgroundColor: "var(--background)",
                          borderRadius: 10,
                          border: "1px solid var(--border)",
                          padding: "8px 12px",
                          gap: 8,
                        }}
                      >
                        <code
                          style={{
                            fontFamily: "monospace",
                            fontSize: "0.82rem",
                            flex: 1,
                            direction: "ltr",
                            textAlign: "left",
                            color: "var(--text-muted)",
                          }}
                        >
                          {revealedSecret ||
                            apiData?.masked_secret ||
                            "sbq_sec_••••••••••••••••"}
                        </code>

                        {revealedSecret ? (
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() =>
                              copyToClipboard(revealedSecret, "api_secret")
                            }
                            style={{ fontSize: "0.75rem", padding: "4px 10px" }}
                          >
                            <Icon
                              name={
                                copiedField === "api_secret" ? "check" : "copy"
                              }
                              size={13}
                            />
                            <span>
                              {copiedField === "api_secret"
                                ? t("copied") || "تم النسخ"
                                : t("copy") || "نسخ"}
                            </span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => setShowRevealModal(true)}
                            style={{ fontSize: "0.75rem", padding: "4px 10px" }}
                          >
                            <Icon name="eye" size={13} />
                            <span>{t("revealSecret") || "إظهار المفتاح"}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      marginTop: 20,
                      paddingTop: 16,
                      borderTop: "1px solid var(--border)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: 12,
                    }}
                  >
                    <div
                      style={{
                        fontSize: "0.8rem",
                        color: "var(--text-muted)",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <Icon name="info" size={14} />
                      <span>
                        {t("securityWarning") ||
                          "احفظ المفتاح السري في بيئة خادمك (.env) ولا تشاركه أبداً في الأكواد العامة."}
                      </span>
                    </div>

                    {(isOwner || canUpdateIntegrations) && (
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => setShowRegenerateModal(true)}
                        style={{
                          color: "#d97706",
                          fontSize: "0.8rem",
                          fontWeight: 700,
                        }}
                      >
                        <Icon name="refresh-cw" size={13} />
                        <span>
                          {t("regenerateSecretBtn") ||
                            "تدوير المفتاح السري (Rotate)"}
                        </span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Admin Granted Scopes Matrix */}
                <div
                  style={{
                    backgroundColor: "var(--surface)",
                    borderRadius: 16,
                    padding: 24,
                    border: "1px solid var(--border)",
                    boxShadow: "var(--shadow-sm)",
                  }}
                >
                  <h3
                    style={{
                      fontSize: "1rem",
                      fontWeight: 800,
                      margin: "0 0 6px",
                    }}
                  >
                    {t("enabledScopesTitle") ||
                      "الميزات والصلاحيات المسموحة عبر الـ API"}
                  </h3>
                  <p
                    style={{
                      fontSize: "0.82rem",
                      color: "var(--text-muted)",
                      margin: "0 0 18px",
                    }}
                  >
                    {t("enabledScopesDesc") ||
                      "يتحكم مسؤول النظام في تفعيل الميزات المسموحة لكل مساحة عمل. تواصل مع الدعم لطلب صلاحيات إضافية."}
                  </p>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fill, minmax(280px, 1fr))",
                      gap: 14,
                    }}
                  >
                    {apiData?.scopes_detail?.map((scopeItem) => (
                      <div
                        key={scopeItem.scope}
                        style={{
                          padding: 14,
                          borderRadius: 12,
                          border: `1px solid ${scopeItem.enabled ? "rgba(32, 123, 89, 0.3)" : "var(--border)"}`,
                          backgroundColor: scopeItem.enabled
                            ? "rgba(32, 123, 89, 0.04)"
                            : "var(--background)",
                          opacity: scopeItem.enabled ? 1 : 0.65,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: 4,
                          }}
                        >
                          <span
                            style={{ fontSize: "0.85rem", fontWeight: 700 }}
                          >
                            {scopeItem.name}
                          </span>
                          <span
                            style={{
                              fontSize: "0.7rem",
                              fontWeight: 700,
                              borderRadius: 12,
                              padding: "2px 8px",
                              backgroundColor: scopeItem.enabled
                                ? "rgba(16, 185, 129, 0.15)"
                                : "rgba(156, 163, 175, 0.15)",
                              color: scopeItem.enabled ? "#059669" : "#6b7280",
                            }}
                          >
                            {scopeItem.enabled
                              ? t("enabled") || "مفعّل"
                              : t("disabled") || "معطّل"}
                          </span>
                        </div>
                        <p
                          style={{
                            fontSize: "0.78rem",
                            color: "var(--text-muted)",
                            margin: "0 0 6px",
                          }}
                        >
                          {scopeItem.description}
                        </p>
                        <code
                          style={{
                            fontSize: "0.72rem",
                            color: "var(--primary)",
                            fontFamily: "monospace",
                          }}
                        >
                          {scopeItem.scope}
                        </code>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Technical Specifications Card */}
                <div
                  style={{
                    backgroundColor: "var(--surface)",
                    borderRadius: 16,
                    padding: 24,
                    border: "1px solid var(--border)",
                    boxShadow: "var(--shadow-sm)",
                  }}
                >
                  <h3
                    style={{
                      fontSize: "1rem",
                      fontWeight: 800,
                      margin: "0 0 16px",
                    }}
                  >
                    {t("techSpecsTitle") ||
                      "المواصفات والحدود التقنية (Technical Specs)"}
                  </h3>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(220px, 1fr))",
                      gap: 16,
                    }}
                  >
                    <div
                      style={{
                        padding: 14,
                        backgroundColor: "var(--background)",
                        borderRadius: 10,
                      }}
                    >
                      <span
                        style={{
                          fontSize: "0.75rem",
                          color: "var(--text-muted)",
                          display: "block",
                        }}
                      >
                        {t("baseApiUrl") || "عنوان الخادم الأساسي (Base URL)"}
                      </span>
                      <code
                        style={{
                          fontSize: "0.8rem",
                          fontWeight: 700,
                          color: "var(--primary)",
                        }}
                        dir="ltr"
                      >
                        https://admin.cal.saabq.com/api/v1/external
                      </code>
                    </div>

                    <div
                      style={{
                        padding: 14,
                        backgroundColor: "var(--background)",
                        borderRadius: 10,
                      }}
                    >
                      <span
                        style={{
                          fontSize: "0.75rem",
                          color: "var(--text-muted)",
                          display: "block",
                        }}
                      >
                        {t("rateLimitLabel") ||
                          "معدل الطلبات المسموح (Rate Limit)"}
                      </span>
                      <strong style={{ fontSize: "0.95rem" }}>
                        {apiData?.rate_limit_per_minute || 120}{" "}
                        {t("requestsPerMinute") || "طلب / دقيقة"}
                      </strong>
                    </div>

                    <div
                      style={{
                        padding: 14,
                        backgroundColor: "var(--background)",
                        borderRadius: 10,
                      }}
                    >
                      <span
                        style={{
                          fontSize: "0.75rem",
                          color: "var(--text-muted)",
                          display: "block",
                        }}
                      >
                        {t("dataFormat") || "صيغة البيانات (Data Format)"}
                      </span>
                      <strong style={{ fontSize: "0.95rem" }}>
                        JSON (UTF-8)
                      </strong>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* TAB 2: PLAYGROUND */}
        {activeTab === "playground" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div
              style={{
                backgroundColor: "var(--surface)",
                borderRadius: 16,
                padding: 24,
                border: "1px solid var(--border)",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              <div style={{ marginBottom: 20 }}>
                <h3
                  style={{
                    fontSize: "1.1rem",
                    fontWeight: 800,
                    margin: "0 0 6px",
                  }}
                >
                  {t("playgroundTitle") ||
                    "منصة فحص واستكشاف الـ API التفاعلية"}
                </h3>
                <p
                  style={{
                    fontSize: "0.85rem",
                    color: "var(--text-muted)",
                    margin: 0,
                  }}
                >
                  {t("playgroundDesc") ||
                    "جرّب إرسال طلبات حية وافحص سرعة الاستجابة وصيغة البيانات العائدة بدون كتابة سطر كود واحد."}
                </p>
              </div>

              {/* Endpoint Selector */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                  gap: 16,
                  marginBottom: 20,
                }}
              >
                <div>
                  <label
                    style={{
                      fontSize: "0.8rem",
                      fontWeight: 700,
                      display: "block",
                      marginBottom: 6,
                    }}
                  >
                    {t("chooseEndpoint") || "اختر النقطة البرمجية (Endpoint)"}
                  </label>
                  <select
                    className="form-control"
                    value={selectedEndpoint}
                    onChange={(e) => setSelectedEndpoint(e.target.value)}
                    style={{ fontSize: "0.85rem" }}
                  >
                    <option value="ping">{t("optPing") || "GET /ping"}</option>
                    <option value="services">
                      {t("optServices") || "GET /services"}
                    </option>
                    <option value="slots">
                      {t("optSlots") || "GET /services/{id}/slots"}
                    </option>
                    <option value="bookings">
                      {t("optBookings") || "GET /bookings"}
                    </option>
                    <option value="create_booking">
                      {t("optCreateBooking") || "POST /bookings"}
                    </option>
                  </select>
                </div>

                {selectedEndpoint === "slots" && (
                  <div>
                    <label
                      style={{
                        fontSize: "0.8rem",
                        fontWeight: 700,
                        display: "block",
                        marginBottom: 6,
                      }}
                    >
                      {t("targetDate") || "تاريخ اليوم المطلوب"}
                    </label>
                    <input
                      type="date"
                      className="form-control"
                      value={playgroundDate}
                      onChange={(e) => setPlaygroundDate(e.target.value)}
                      style={{ fontSize: "0.85rem" }}
                    />
                  </div>
                )}
              </div>

              {/* Payload for POST */}
              {selectedEndpoint === "create_booking" && (
                <div style={{ marginBottom: 20 }}>
                  <label
                    style={{
                      fontSize: "0.8rem",
                      fontWeight: 700,
                      display: "block",
                      marginBottom: 6,
                    }}
                  >
                    {t("jsonPayload") || "بيانات الحجز المرسلة (JSON Payload)"}
                  </label>
                  <textarea
                    className="form-control"
                    rows={6}
                    value={playgroundPayload}
                    onChange={(e) => setPlaygroundPayload(e.target.value)}
                    placeholder={JSON.stringify(
                      {
                        service_id: 1,
                        customer_name: "Ahmed Ali",
                        customer_email: "ahmed@example.com",
                        customer_phone: "+966500000000",
                        starts_at: `${playgroundDate} 11:00:00`,
                        notes: "Test booking via API Playground",
                      },
                      null,
                      2,
                    )}
                    style={{
                      fontFamily: "monospace",
                      fontSize: "0.8rem",
                      direction: "ltr",
                    }}
                  />
                </div>
              )}

              <button
                type="button"
                className="btn btn-primary"
                onClick={handlePlaygroundSend}
                disabled={isTestingPlayground}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: "0.85rem",
                  fontWeight: 700,
                }}
              >
                <Icon name="send" size={15} />
                <span>
                  {isTestingPlayground
                    ? t("sending") || "جارِ الإرسال..."
                    : t("sendTestRequest") || "إرسال الطلب البرمجي"}
                </span>
              </button>
            </div>

            {/* Response Console */}
            {playgroundResponse && (
              <div
                style={{
                  backgroundColor: "#1e1e2e",
                  borderRadius: 16,
                  padding: 20,
                  color: "#cdd6f4",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 14,
                    borderBottom: "1px solid rgba(255,255,255,0.1)",
                    paddingBottom: 10,
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 12 }}
                  >
                    <span
                      style={{
                        padding: "3px 8px",
                        borderRadius: 6,
                        fontSize: "0.75rem",
                        fontWeight: 800,
                        backgroundColor:
                          playgroundResponse.status < 300
                            ? "rgba(16, 185, 129, 0.25)"
                            : "rgba(239, 68, 68, 0.25)",
                        color:
                          playgroundResponse.status < 300
                            ? "#34d399"
                            : "#f87171",
                      }}
                    >
                      {playgroundResponse.status}{" "}
                      {playgroundResponse.statusText}
                    </span>
                    <span style={{ fontSize: "0.75rem", color: "#a6adc8" }}>
                      {t("responseTime") || "زمن الاستجابة"}:{" "}
                      {playgroundLatency}ms
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      copyToClipboard(
                        JSON.stringify(playgroundResponse.data, null, 2),
                        "playground_json",
                      )
                    }
                    style={{
                      background: "rgba(255,255,255,0.1)",
                      border: "none",
                      color: "#cdd6f4",
                      padding: "4px 10px",
                      borderRadius: 6,
                      fontSize: "0.75rem",
                      cursor: "pointer",
                    }}
                  >
                    {copiedField === "playground_json"
                      ? t("copiedJson") || "✓ Copied"
                      : t("copyJson") || "Copy JSON"}
                  </button>
                </div>

                <pre
                  style={{
                    margin: 0,
                    fontSize: "0.8rem",
                    fontFamily: "monospace",
                    maxHeight: 380,
                    overflowY: "auto",
                    direction: "ltr",
                    textAlign: "left",
                    color: "#a6e3a1",
                  }}
                >
                  {JSON.stringify(playgroundResponse.data, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: DOCUMENTATION */}
        {activeTab === "docs" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {/* Lang switcher toolbar */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 12,
                backgroundColor: "var(--surface)",
                padding: "14px 20px",
                borderRadius: 12,
                border: "1px solid var(--border)",
              }}
            >
              <div style={{ fontSize: "0.85rem", fontWeight: 700 }}>
                {t("selectCodeLang") || "لغة أمثلة الأكواد البرمجية:"}
              </div>

              <div style={{ display: "flex", gap: 6 }}>
                {[
                  { id: "curl", label: "cURL" },
                  { id: "js", label: "JavaScript (Fetch)" },
                  { id: "php", label: "PHP (Guzzle)" },
                  { id: "python", label: "Python (Requests)" },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`btn btn-sm ${codeLang === item.id ? "btn-primary" : "btn-secondary"}`}
                    onClick={() => setCodeLang(item.id)}
                    style={{ fontSize: "0.78rem", fontWeight: 700 }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Doc Endpoint 1: Ping */}
            <div
              style={{
                backgroundColor: "var(--surface)",
                borderRadius: 16,
                padding: 24,
                border: "1px solid var(--border)",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 8,
                }}
              >
                <span
                  style={{
                    backgroundColor: "#059669",
                    color: "#fff",
                    padding: "3px 8px",
                    borderRadius: 6,
                    fontSize: "0.75rem",
                    fontWeight: 800,
                  }}
                >
                  GET
                </span>
                <code
                  style={{ fontSize: "0.95rem", fontWeight: 800 }}
                  dir="ltr"
                >
                  /api/v1/external/ping
                </code>
              </div>
              <p
                style={{
                  fontSize: "0.85rem",
                  color: "var(--text-muted)",
                  margin: "0 0 16px",
                }}
              >
                {t("docPingDesc") ||
                  "فحص الاتصال والتأكد من صحة مفاتيح الـ API والصلاحيات الممنوحة لمساحة العمل."}
              </p>

              {/* Code Snippet */}
              <div
                style={{
                  backgroundColor: "#1e1e2e",
                  borderRadius: 12,
                  padding: 16,
                  direction: "ltr",
                  textAlign: "left",
                }}
              >
                <pre
                  style={{
                    margin: 0,
                    fontFamily: "monospace",
                    fontSize: "0.8rem",
                    color: "#f5e0dc",
                  }}
                >
                  {codeLang === "curl" &&
                    `curl -X GET "https://admin.cal.saabq.com/api/v1/external/ping" \\
  -H "X-Api-Key: ${apiData?.api_key || "YOUR_API_KEY"}" \\
  -H "X-Api-Secret: YOUR_API_SECRET" \\
  -H "Accept: application/json"`}

                  {codeLang === "js" &&
                    `const response = await fetch("https://admin.cal.saabq.com/api/v1/external/ping", {
  headers: {
    "X-Api-Key": "${apiData?.api_key || "YOUR_API_KEY"}",
    "X-Api-Secret": "YOUR_API_SECRET",
    "Accept": "application/json"
  }
});
const data = await response.json();
console.log(data);`}

                  {codeLang === "php" &&
                    `$client = new \\GuzzleHttp\\Client();
$response = $client->get('https://admin.cal.saabq.com/api/v1/external/ping', [
    'headers' => [
        'X-Api-Key'    => '${apiData?.api_key || "YOUR_API_KEY"}',
        'X-Api-Secret' => 'YOUR_API_SECRET',
        'Accept'       => 'application/json',
    ]
]);
$data = json_decode($response->getBody(), true);`}

                  {codeLang === "python" &&
                    `import requests

url = "https://admin.cal.saabq.com/api/v1/external/ping"
headers = {
    "X-Api-Key": "${apiData?.api_key || "YOUR_API_KEY"}",
    "X-Api-Secret": "YOUR_API_SECRET",
    "Accept": "application/json"
}
response = requests.get(url, headers=headers)
print(response.json())`}
                </pre>
              </div>
            </div>

            {/* Doc Endpoint 2: Services */}
            <div
              style={{
                backgroundColor: "var(--surface)",
                borderRadius: 16,
                padding: 24,
                border: "1px solid var(--border)",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 8,
                }}
              >
                <span
                  style={{
                    backgroundColor: "#059669",
                    color: "#fff",
                    padding: "3px 8px",
                    borderRadius: 6,
                    fontSize: "0.75rem",
                    fontWeight: 800,
                  }}
                >
                  GET
                </span>
                <code
                  style={{ fontSize: "0.95rem", fontWeight: 800 }}
                  dir="ltr"
                >
                  /api/v1/external/services
                </code>
              </div>
              <p
                style={{
                  fontSize: "0.85rem",
                  color: "var(--text-muted)",
                  margin: "0 0 16px",
                }}
              >
                {t("docServicesDesc") ||
                  "جلب قائمة الخدمات النشطة مع المدد والأسعار المعتمدة في مساحة العمل."}
              </p>

              <div
                style={{
                  backgroundColor: "#1e1e2e",
                  borderRadius: 12,
                  padding: 16,
                  direction: "ltr",
                  textAlign: "left",
                }}
              >
                <pre
                  style={{
                    margin: 0,
                    fontFamily: "monospace",
                    fontSize: "0.8rem",
                    color: "#f5e0dc",
                  }}
                >
                  {codeLang === "curl" &&
                    `curl -X GET "https://admin.cal.saabq.com/api/v1/external/services" \\
  -H "X-Api-Key: ${apiData?.api_key || "YOUR_API_KEY"}" \\
  -H "X-Api-Secret: YOUR_API_SECRET" \\
  -H "Accept: application/json"`}

                  {codeLang === "js" &&
                    `const response = await fetch("https://admin.cal.saabq.com/api/v1/external/services", {
  headers: {
    "X-Api-Key": "${apiData?.api_key || "YOUR_API_KEY"}",
    "X-Api-Secret": "YOUR_API_SECRET",
    "Accept": "application/json"
  }
});
const services = await response.json();`}

                  {codeLang === "php" &&
                    `$response = $client->get('https://admin.cal.saabq.com/api/v1/external/services', [
    'headers' => [
        'X-Api-Key'    => '${apiData?.api_key || "YOUR_API_KEY"}',
        'X-Api-Secret' => 'YOUR_API_SECRET',
        'Accept'       => 'application/json',
    ]
]);`}

                  {codeLang === "python" &&
                    `response = requests.get("https://admin.cal.saabq.com/api/v1/external/services", headers=headers)`}
                </pre>
              </div>
            </div>

            {/* Doc Endpoint 3: Create Booking */}
            <div
              style={{
                backgroundColor: "var(--surface)",
                borderRadius: 16,
                padding: 24,
                border: "1px solid var(--border)",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 8,
                }}
              >
                <span
                  style={{
                    backgroundColor: "#2563eb",
                    color: "#fff",
                    padding: "3px 8px",
                    borderRadius: 6,
                    fontSize: "0.75rem",
                    fontWeight: 800,
                  }}
                >
                  POST
                </span>
                <code
                  style={{ fontSize: "0.95rem", fontWeight: 800 }}
                  dir="ltr"
                >
                  /api/v1/external/bookings
                </code>
              </div>
              <p
                style={{
                  fontSize: "0.85rem",
                  color: "var(--text-muted)",
                  margin: "0 0 16px",
                }}
              >
                {t("docCreateBookingDesc") ||
                  "إنشاء حجز جديد تلقائياً وتثبيته في قاعدة بيانات سابق مع مزامنة تقويم جوجل وإشعارات تليجرام فوراً."}
              </p>

              <div
                style={{
                  backgroundColor: "#1e1e2e",
                  borderRadius: 12,
                  padding: 16,
                  direction: "ltr",
                  textAlign: "left",
                }}
              >
                <pre
                  style={{
                    margin: 0,
                    fontFamily: "monospace",
                    fontSize: "0.8rem",
                    color: "#f5e0dc",
                  }}
                >
                  {codeLang === "curl" &&
                    `curl -X POST "https://admin.cal.saabq.com/api/v1/external/bookings" \\
  -H "X-Api-Key: ${apiData?.api_key || "YOUR_API_KEY"}" \\
  -H "X-Api-Secret: YOUR_API_SECRET" \\
  -H "Content-Type: application/json" \\
  -H "Accept: application/json" \\
  -d '{
    "service_id": 1,
    "customer_name": "Sarah Smith",
    "customer_email": "sara@example.com",
    "customer_phone": "+966551234567",
    "starts_at": "2026-09-15 11:30:00",
    "notes": "Direct booking from website",
    "external_reference_id": "ORDER-9842"
  }'`}

                  {codeLang === "js" &&
                    `const res = await fetch("https://admin.cal.saabq.com/api/v1/external/bookings", {
  method: "POST",
  headers: {
    "X-Api-Key": "${apiData?.api_key || "YOUR_API_KEY"}",
    "X-Api-Secret": "YOUR_API_SECRET",
    "Content-Type": "application/json",
    "Accept": "application/json"
  },
  body: JSON.stringify({
    service_id: 1,
    customer_name: "Sarah Smith",
    customer_email: "sara@example.com",
    customer_phone: "+966551234567",
    starts_at: "2026-09-15 11:30:00",
    external_reference_id: "ORDER-9842"
  })
});
const booking = await res.json();`}

                  {codeLang === "php" &&
                    `$res = $client->post('https://admin.cal.saabq.com/api/v1/external/bookings', [
    'headers' => [
        'X-Api-Key'    => '${apiData?.api_key || "YOUR_API_KEY"}',
        'X-Api-Secret' => 'YOUR_API_SECRET',
        'Accept'       => 'application/json',
    ],
    'json' => [
        'service_id'     => 1,
        'customer_name'  => 'Sarah Smith',
        'customer_email' => 'sara@example.com',
        'starts_at'      => '2026-09-15 11:30:00',
    ]
]);`}

                  {codeLang === "python" &&
                    `payload = {
    "service_id": 1,
    "customer_name": "Sarah Smith",
    "customer_email": "sara@example.com",
    "starts_at": "2026-09-15 11:30:00"
}
res = requests.post("https://admin.cal.saabq.com/api/v1/external/bookings", headers=headers, json=payload)`}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: SYNC GUIDE */}
        {activeTab === "sync_guide" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div
              style={{
                backgroundColor: "var(--surface)",
                borderRadius: 16,
                padding: 28,
                border: "1px solid var(--border)",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              <h3
                style={{
                  fontSize: "1.1rem",
                  fontWeight: 800,
                  margin: "0 0 10px",
                }}
              >
                {t("syncGuideTitle") ||
                  "دليل المزامنة التلقائية اللحظية (Two-Way Sync)"}
              </h3>
              <p
                style={{
                  fontSize: "0.88rem",
                  color: "var(--text-muted)",
                  lineHeight: 1.7,
                  margin: "0 0 24px",
                }}
              >
                {t("syncGuideDesc") ||
                  "يضمن نظام سابق مزامنة كاملة ثنائية الاتجاه. عند إنشاء حجز من موقعك الخارجي، يظهر الموعد فوراً في جدول مساحة العمل، ويتم تحديث تقويم Google وحساب تليجرام تلقائياً."}
              </p>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                  gap: 16,
                }}
              >
                <div
                  style={{
                    padding: 20,
                    backgroundColor: "var(--background)",
                    borderRadius: 12,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      marginBottom: 8,
                      color: "var(--primary)",
                    }}
                  >
                    <Icon name="arrow-right" size={18} />
                    <h4
                      style={{
                        margin: 0,
                        fontSize: "0.95rem",
                        fontWeight: 700,
                      }}
                    >
                      من موقعك إلى سابق (Inbound)
                    </h4>
                  </div>
                  <p
                    style={{
                      fontSize: "0.82rem",
                      color: "var(--text-muted)",
                      margin: 0,
                    }}
                  >
                    استخدم <code dir="ltr">POST /api/v1/external/bookings</code>{" "}
                    لإرسال الموعد. يتم التحقق من عدم التعارض ثم تثبيته فوراً.
                  </p>
                </div>

                <div
                  style={{
                    padding: 20,
                    backgroundColor: "var(--background)",
                    borderRadius: 12,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      marginBottom: 8,
                      color: "#2563eb",
                    }}
                  >
                    <Icon name="arrow-left" size={18} />
                    <h4
                      style={{
                        margin: 0,
                        fontSize: "0.95rem",
                        fontWeight: 700,
                      }}
                    >
                      من سابق إلى موقعك (Outbound Webhooks)
                    </h4>
                  </div>
                  <p
                    style={{
                      fontSize: "0.82rem",
                      color: "var(--text-muted)",
                      margin: 0,
                    }}
                  >
                    عند قيام الموظف بتأكيد، إلغاء، أو إعادة جدولة الموعد، يرسل
                    سابق إشعار Webhook تلقائي لرابط موقعك.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* REQUEST ACCESS MODAL */}
      {showRequestModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: 20,
          }}
        >
          <div
            style={{
              backgroundColor: "var(--surface)",
              borderRadius: 16,
              padding: 28,
              width: "100%",
              maxWidth: 480,
              boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
            }}
          >
            <h3
              style={{ fontSize: "1.1rem", fontWeight: 800, margin: "0 0 8px" }}
            >
              {t("requestApiModalTitle") ||
                "طلب تفعيل مفتاح الربط البرمجي (API)"}
            </h3>
            <p
              style={{
                fontSize: "0.82rem",
                color: "var(--text-muted)",
                margin: "0 0 20px",
              }}
            >
              {t("requestApiModalDesc") ||
                "سيتم إرسال طلبك لمسؤول النظام للمراجعة وتحديد الصلاحيات المسموحة لمساحة عملك."}
            </p>

            <form
              onSubmit={handleRequestAccess}
              style={{ display: "flex", flexDirection: "column", gap: 16 }}
            >
              <div>
                <label
                  style={{
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    display: "block",
                    marginBottom: 6,
                  }}
                >
                  {t("appNameLabel") || "اسم التطبيق أو الموقع"}
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={requestAppName}
                  onChange={(e) => setRequestAppName(e.target.value)}
                  placeholder={t("appNamePlaceholder") || "e.g. My Website"}
                  style={{ fontSize: "0.85rem" }}
                  required
                />
              </div>

              <div>
                <label
                  style={{
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    display: "block",
                    marginBottom: 6,
                  }}
                >
                  {t("useCaseNotes") || "طبيعة الاستخدام ورابط موقعك"}
                </label>
                <textarea
                  className="form-control"
                  rows={4}
                  value={requestNotes}
                  onChange={(e) => setRequestNotes(e.target.value)}
                  placeholder={
                    t("useCaseNotesPlaceholder") ||
                    "e.g. Integrate bookings with our store..."
                  }
                  style={{ fontSize: "0.85rem" }}
                  required
                />
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 10,
                  marginTop: 8,
                }}
              >
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowRequestModal(false)}
                  style={{ fontSize: "0.85rem" }}
                >
                  {t("cancel") || "إلغاء"}
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmittingRequest}
                  style={{ fontSize: "0.85rem", fontWeight: 700 }}
                >
                  {isSubmittingRequest
                    ? t("submitting") || "جارِ الإرسال..."
                    : t("submitRequest") || "إرسال الطلب"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REVEAL SECRET MODAL */}
      {showRevealModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: 20,
          }}
        >
          <div
            style={{
              backgroundColor: "var(--surface)",
              borderRadius: 16,
              padding: 28,
              width: "100%",
              maxWidth: 440,
              boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
            }}
          >
            <h3
              style={{ fontSize: "1.1rem", fontWeight: 800, margin: "0 0 8px" }}
            >
              {t("confirmPasswordTitle") ||
                "تأكيد كلمة المرور لعرض المفتاح السري"}
            </h3>
            <p
              style={{
                fontSize: "0.82rem",
                color: "var(--text-muted)",
                margin: "0 0 20px",
              }}
            >
              {t("confirmPasswordDesc") ||
                "لأسباب أمنية، يرجى كتابة كلمة مرور حسابك لإظهار المفتاح السري."}
            </p>

            <form
              onSubmit={handleRevealSecret}
              style={{ display: "flex", flexDirection: "column", gap: 16 }}
            >
              <div>
                <input
                  type="password"
                  className="form-control"
                  value={revealPassword}
                  onChange={(e) => setRevealPassword(e.target.value)}
                  placeholder={t("passwordPlaceholder") || "••••••••"}
                  style={{ fontSize: "0.9rem" }}
                  autoFocus
                  required
                />
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 10,
                  marginTop: 8,
                }}
              >
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowRevealModal(false);
                    setRevealPassword("");
                  }}
                  style={{ fontSize: "0.85rem" }}
                >
                  {t("cancel") || "إلغاء"}
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isRevealingSecret}
                  style={{ fontSize: "0.85rem", fontWeight: 700 }}
                >
                  {isRevealingSecret
                    ? t("verifying") || "جارِ التحقق..."
                    : t("confirmAndReveal") || "تأكيد وإظهار"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REGENERATE CONFIRMATION MODAL */}
      {showRegenerateModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: 20,
          }}
        >
          <div
            style={{
              backgroundColor: "var(--surface)",
              borderRadius: 16,
              padding: 28,
              width: "100%",
              maxWidth: 440,
              boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                backgroundColor: "rgba(245, 158, 11, 0.15)",
                color: "#d97706",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16,
              }}
            >
              <Icon name="alert-triangle" size={24} />
            </div>

            <h3
              style={{ fontSize: "1.1rem", fontWeight: 800, margin: "0 0 8px" }}
            >
              {t("confirmRegenerateTitle") ||
                "هل أنت متأكد من رغبتك في تدوير المفتاح السري؟"}
            </h3>
            <p
              style={{
                fontSize: "0.82rem",
                color: "var(--text-muted)",
                margin: "0 0 20px",
                lineHeight: 1.6,
              }}
            >
              {t("confirmRegenerateDesc") ||
                "سيتوقف المفتاح السري الحالي عن العمل فوراً، وسيتعين عليك تحديثه في متغيرات بيئة موقعك الخارجي (.env)."}
            </p>

            <div
              style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}
            >
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowRegenerateModal(false)}
                style={{ fontSize: "0.85rem" }}
              >
                {t("cancel") || "إلغاء"}
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleRegenerateSecret}
                disabled={isRegenerating}
                style={{
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  backgroundColor: "#d97706",
                  borderColor: "#d97706",
                }}
              >
                {isRegenerating
                  ? t("rotating") || "جارِ التدوير..."
                  : t("confirmRegenerate") || "نعم، قم بالتدوير الآن"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
