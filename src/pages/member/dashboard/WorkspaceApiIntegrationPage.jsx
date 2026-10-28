import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { usePermissions } from "../../../hooks/usePermissions";
import { useToast } from "../../../context/ToastContext";
import { useLanguage } from "../../../context/LanguageContext";
import SEO from "../../../components/ui/SEO";
import Icon from "../../../components/common/Icon";
import ModalPortal from "../../../components/common/ModalPortal";
import PageLoader from "../../../components/ui/PageLoader";
import client, { endpoints } from "../../../api/client";
import { isApiIntegrationEnabled } from "../../../utils/capabilities";
import WorkspacePageHeader from "../../../components/dashboard/WorkspacePageHeader";

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

  // Scopes Update State
  const [isUpdatingScopes, setIsUpdatingScopes] = useState(false);

  // Playground State
  const [selectedEndpoint, setSelectedEndpoint] = useState("ping");
  const [playgroundServiceId, _setPlaygroundServiceId] = useState("");
  const [playgroundDate, setPlaygroundDate] = useState(
    new Date(Date.now() + 2 * 86400000).toISOString().split("T")[0],
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
      if (res.data?.status || res.data?.success || res.data?.data) {
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
    toast?.success?.(t("copiedToClipboard") || "اتنسخ بنجاح!");
    setTimeout(() => setCopiedField(null), 2500);
  };

  const handleRequestAccess = async (e) => {
    e.preventDefault();
    if (!requestNotes.trim() || requestNotes.trim().length < 10) {
      toast?.error?.(
        t("requestNotesRequired") ||
          "من فضلك اكتب سبب الاستخدام وموقع الويب (10 حروف على الأقل)",
      );
      return;
    }

    setIsSubmittingRequest(true);
    try {
      const res = await client.post(endpoints.apiIntegrationRequest("member"), {
        name: requestAppName,
        request_notes: requestNotes,
      });

      if (
        res.data?.status ||
        res.data?.success ||
        res.status === 200 ||
        res.status === 201
      ) {
        toast?.success?.(
          res.data?.message || t("apiRequestedSuccess") || "الطلب اتبعت بنجاح",
        );
        setShowRequestModal(false);
        loadApiIntegration();
      } else {
        toast?.error?.(res.data?.message || t("errorOccurred") || "حدث خطأ");
      }
    } catch (err) {
      const errMsg =
        err.response?.data?.message ||
        (err.response?.data?.errors
          ? Object.values(err.response.data.errors).flat().join(" - ")
          : null) ||
        t("errorOccurred") ||
        "حدث خطأ";
      toast?.error?.(errMsg);
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

      if (
        (res.data?.status || res.data?.success) &&
        res.data.data?.api_secret
      ) {
        setRevealedSecret(res.data.data.api_secret);
        setRevealPassword("");
        setShowRevealModal(false);
        toast?.success?.(
          res.data?.message ||
            t("secretRevealedSuccess") ||
            "تم إظهار المفتاح السري بنجاح",
        );
      } else {
        toast?.error?.(
          res.data?.message ||
            t("incorrectPassword") ||
            "كلمة المرور غير صحيحة",
        );
      }
    } catch (err) {
      const serverMsg = err.response?.data?.message;
      const passErr = err.response?.data?.errors?.password?.[0];
      const fallback = t("incorrectPassword") || "كلمة المرور غير صحيحة";
      const displayMsg =
        serverMsg && serverMsg !== "validation.current_password"
          ? serverMsg
          : passErr && passErr !== "validation.current_password"
            ? passErr
            : fallback;
      toast?.error?.(displayMsg);
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
      if (
        res.data?.status ||
        res.data?.success ||
        res.status === 200 ||
        res.status === 201
      ) {
        toast?.success?.(
          res.data?.message ||
            t("secretRegeneratedSuccess") ||
            "المفتاح السري اتغيّر بنجاح",
        );
        setShowRegenerateModal(false);
        if (res.data.data?.api_secret) {
          setRevealedSecret(res.data.data.api_secret);
        }
        loadApiIntegration();
      } else {
        toast?.error?.(res.data?.message || t("errorOccurred") || "حدث خطأ");
      }
    } catch (err) {
      toast?.error?.(
        err.response?.data?.message || t("errorOccurred") || "حدث خطأ",
      );
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleToggleScope = async (scopeKey) => {
    if (!isOwner && !canUpdateIntegrations) return;
    const currentScopes = Array.isArray(apiData?.allowed_scopes)
      ? apiData.allowed_scopes
      : [];
    const exists = currentScopes.includes(scopeKey);
    const nextScopes = exists
      ? currentScopes.filter((s) => s !== scopeKey)
      : [...currentScopes, scopeKey];

    if (nextScopes.length === 0) {
      toast?.error?.(
        lang === "ar"
          ? "يجب تفعيل صلاحية واحدة على الأقل"
          : "At least one endpoint scope must remain enabled",
      );
      return;
    }

    setIsUpdatingScopes(true);
    try {
      const res = await client.put(endpoints.apiIntegrationScopes("member"), {
        allowed_scopes: nextScopes,
      });
      if (res.data?.status || res.data?.success || res.data?.data) {
        setApiData(res.data.data);
        toast?.success?.(
          res.data?.message ||
            (lang === "ar"
              ? "تم تحديث صلاحيات الوصول ومجموعة Postman بنجاح"
              : "Endpoint access and Postman collection updated"),
        );
      }
    } catch (err) {
      toast?.error?.(
        err.response?.data?.message || t("errorOccurred") || "حدث خطأ",
      );
    } finally {
      setIsUpdatingScopes(false);
    }
  };

  const handleQuickPing = async () => {
    setIsPinging(true);
    setPingResult(null);
    const startTime = Date.now();
    try {
      const res = await client.post(endpoints.apiIntegrationVerify("member"));
      const duration = Date.now() - startTime;
      if (res.data?.status || res.data?.success) {
        setPingResult({
          success: true,
          latency: duration,
          data: res.data.data,
        });
        toast?.success?.(
          `${t("connectionActive") || "الاتصال نشط"} (${duration}ms)`,
        );
      } else {
        toast?.error?.(
          res.data?.message || t("connectionFailed") || "تعذر الاتصال بالخادم",
        );
      }
    } catch (err) {
      const duration = Date.now() - startTime;
      setPingResult({
        success: false,
        latency: duration,
        error: err.response?.data?.message || "Failed to connect",
      });
      toast?.error?.(t("connectionFailed") || "تعذر الاتصال بالخادم");
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
          `${endpoints.workspaceServices}/${playgroundServiceId || 1}/slots`,
          { params: { date: playgroundDate } },
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

  const handleDownloadPostman = async () => {
    let collection = apiData?.postman_collection;

    if (!collection) {
      try {
        const res = await client.get(
          endpoints.apiIntegrationCollection("member"),
        );
        if (res.data?.data) {
          collection = res.data.data;
        }
      } catch (err) {
        console.error("Failed to fetch remote Postman collection", err);
      }
    }

    if (collection && Array.isArray(collection.variable) && revealedSecret) {
      collection = {
        ...collection,
        variable: collection.variable.map((v) =>
          v.key === "api_secret" ? { ...v, value: revealedSecret } : v,
        ),
      };
    }

    const blob = new Blob([JSON.stringify(collection || {}, null, 2)], {
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
  const isSuspended = apiData?.status === "suspended";
  const isRevoked = apiData?.status === "revoked";
  const hasExistingKey = Boolean(
    apiData?.has_key || apiData?.api_key || apiData?.id,
  );
  const isNotRequested =
    !apiData ||
    apiData.status === "not_requested" ||
    (!isActive && !isPending && !isSuspended && !isRevoked && !hasExistingKey);

  if (!isApiIntegrationEnabled(user)) {
    return (
      <div
        className="workspace-dashboard-shell animate-fade-in"
        dir={lang === "ar" ? "rtl" : "ltr"}
        style={{ padding: "60px 28px", textAlign: "center" }}
      >
        <SEO pageKey="workspaceApiIntegration" />
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
            {t("apiIntegrationDisabledTitle") || "الربط البرمجي غير متاح"}
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
        <SEO pageKey="workspaceApiIntegration" />
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
      <SEO pageKey="workspaceApiIntegration" />

      <div style={{ padding: "0 4px 40px" }}>
        {/* Unified Standard Header */}
        <WorkspacePageHeader
          title={
            t("apiIntegrationTitle") || "الربط البرمجي للمطورين (REST API)"
          }
          subtitle={
            t("apiIntegrationHeaderDesc") ||
            "ربط موقعك وتطبيقاتك الخارجية بمساحة عملك مع مزامنة لحظية ومستندات برمجية شاملة."
          }
          icon="code"
          actions={
            isActive && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  flexWrap: "wrap",
                }}
              >
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleDownloadPostman}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: "0.82rem",
                    padding: "8px 16px",
                    borderRadius: "var(--radius-md, 10px)",
                  }}
                >
                  <Icon name="download" size={14} />
                  <span>{t("downloadPostman") || "نزّل كولكشن Postman"}</span>
                </button>

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
                    padding: "8px 16px",
                    borderRadius: "var(--radius-md, 10px)",
                  }}
                >
                  <Icon name="activity" size={14} />
                  <span>
                    {isPinging
                      ? t("testing") || "جارِ الفحص..."
                      : t("testConnection") || "فحص الاتصال اللحظي"}
                  </span>
                </button>
              </div>
            )
          }
        />
        {/* Tab Navigation Slider */}
        <div
          className="no-scrollbar api-tabs-slider"
          style={{
            display: "flex",
            gap: 8,
            marginBottom: 24,
            borderBottom: "1px solid var(--border)",
            paddingBottom: 12,
            overflowX: "auto",
            WebkitOverflowScrolling: "touch",
            scrollbarWidth: "none",
            flexWrap: "nowrap",
          }}
        >
          <button
            type="button"
            className={`api-tab-pill ${activeTab === "credentials" ? "active" : ""}`}
            onClick={() => setActiveTab("credentials")}
          >
            <Icon name="key" size={16} />
            <span>
              {t("apiCredentialsTab") || "بيانات الاعتماد والإعدادات"}
            </span>
          </button>

          <button
            type="button"
            className={`api-tab-pill ${activeTab === "playground" ? "active" : ""}`}
            onClick={() => setActiveTab("playground")}
          >
            <Icon name="play" size={16} />
            <span>
              {t("apiPlaygroundTab") || "منصة الاختبار والتحقق (Playground)"}
            </span>
          </button>

          <button
            type="button"
            className={`api-tab-pill ${activeTab === "docs" ? "active" : ""}`}
            onClick={() => setActiveTab("docs")}
          >
            <Icon name="file-text" size={16} />
            <span>{t("apiDocsTab") || "مستندات الـ API والأكواد"}</span>
          </button>

          <button
            type="button"
            className={`api-tab-pill ${activeTab === "sync_guide" ? "active" : ""}`}
            onClick={() => setActiveTab("sync_guide")}
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
                  ? `${t("pingSuccess") || "الاتصال يعمل بنجاح!"} (زمن الاستجابة: ${pingResult.latency}ms)`
                  : `${t("pingFailed") || "فشل الاتصال:"} ${pingResult.error}`}
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

            {isSuspended && (
              <div
                style={{
                  padding: 24,
                  backgroundColor: "rgba(245, 158, 11, 0.08)",
                  borderRadius: 16,
                  border: "1px solid rgba(245, 158, 11, 0.3)",
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
                    backgroundColor: "rgba(245, 158, 11, 0.15)",
                    color: "#d97706",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Icon name="alert-triangle" size={24} />
                </div>
                <div>
                  <h3
                    style={{
                      fontSize: "1rem",
                      fontWeight: 800,
                      color: "#b45309",
                      margin: "0 0 4px",
                    }}
                  >
                    {t("apiSuspendedTitle") ||
                      "تم تعليق مفاتيح الربط البرمجي مؤقتاً"}
                  </h3>
                  <p
                    style={{
                      fontSize: "0.85rem",
                      color: "var(--text-muted)",
                      margin: 0,
                    }}
                  >
                    {t("apiSuspendedDesc") ||
                      "تم إيقاف صلاحيات الوصول للـ API لمساحة العمل هذه من قبل الإدارة. يرجى التواصل مع الدعم الفني للاستفسار."}
                  </p>
                </div>
              </div>
            )}

            {isRevoked && (
              <div
                style={{
                  padding: 24,
                  backgroundColor: "rgba(239, 68, 68, 0.08)",
                  borderRadius: 16,
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: 16,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 12,
                      backgroundColor: "rgba(239, 68, 68, 0.15)",
                      color: "#dc2626",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Icon name="x-circle" size={24} />
                  </div>
                  <div>
                    <h3
                      style={{
                        fontSize: "1rem",
                        fontWeight: 800,
                        color: "#b91c1c",
                        margin: "0 0 4px",
                      }}
                    >
                      {t("apiRevokedTitle") || "تم إلغاء مفاتيح الربط البرمجي"}
                    </h3>
                    <p
                      style={{
                        fontSize: "0.85rem",
                        color: "var(--text-muted)",
                        margin: 0,
                      }}
                    >
                      {t("apiRevokedDesc") ||
                        "تم رفض أو إبطال مفاتيح الـ API السابقة. يمكنك تقديم طلب جديد إذا كنت بحاجة للربط مجدداً."}
                    </p>
                  </div>
                </div>
                {(isOwner ||
                  canCreateIntegrations ||
                  canUpdateIntegrations) && (
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => setShowRequestModal(true)}
                  >
                    <Icon name="refresh-cw" size={14} />
                    <span>
                      {t("requestNewKeys") || "طلب مفاتيح جديدة"}
                    </span>
                  </button>
                )}
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
                        "repeat(auto-fit, minmax(min(100%, 280px), 1fr))",
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

                {/* Admin & Member Scopes Matrix */}
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
                      alignItems: "flex-start",
                      flexWrap: "wrap",
                      gap: 12,
                      marginBottom: 18,
                    }}
                  >
                    <div>
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
                          margin: 0,
                        }}
                      >
                        {t("enabledScopesDesc") ||
                          "يتحكم مسؤول النظام في تفعيل الميزات المسموحة لكل مساحة عمل. تواصل مع الدعم لطلب صلاحيات إضافية."}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={handleDownloadPostman}
                      disabled={isUpdatingScopes}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        fontSize: "0.78rem",
                      }}
                    >
                      <Icon name="download" size={13} />
                      <span>
                        {lang === "ar"
                          ? "تحميل مجموعة Postman المحدّثة"
                          : "Download Synced Postman Collection"}
                      </span>
                    </button>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fill, minmax(min(100%, 240px), 1fr))",
                      gap: 14,
                    }}
                  >
                    {apiData?.scopes_detail?.map((scopeItem) => (
                      <div
                        key={scopeItem.scope}
                        onClick={() => {
                          if (
                            !isUpdatingScopes &&
                            (isOwner || canUpdateIntegrations)
                          ) {
                            handleToggleScope(scopeItem.scope);
                          }
                        }}
                        style={{
                          padding: 14,
                          borderRadius: 12,
                          border: `1px solid ${scopeItem.enabled ? "rgba(32, 123, 89, 0.3)" : "var(--border)"}`,
                          backgroundColor: scopeItem.enabled
                            ? "rgba(32, 123, 89, 0.04)"
                            : "var(--background)",
                          opacity: scopeItem.enabled ? 1 : 0.65,
                          cursor:
                            isOwner || canUpdateIntegrations
                              ? "pointer"
                              : "default",
                          transition: "all 0.2s ease",
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
                        "repeat(auto-fit, minmax(min(100%, 200px), 1fr))",
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
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(min(100%, 260px), 1fr))",
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
                    overflowX: "auto",
                    maxWidth: "100%",
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

              <div
                className="no-scrollbar"
                style={{
                  display: "flex",
                  gap: 6,
                  overflowX: "auto",
                  WebkitOverflowScrolling: "touch",
                  maxWidth: "100%",
                  paddingBottom: 4,
                }}
              >
                {[
                  { id: "curl", label: "cURL (Form Data)" },
                  { id: "js", label: "JavaScript (FormData)" },
                  { id: "php", label: "PHP (Guzzle Multipart)" },
                  { id: "python", label: "Python (Form Params)" },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`btn btn-sm ${codeLang === item.id ? "btn-primary" : "btn-secondary"}`}
                    onClick={() => setCodeLang(item.id)}
                    style={{
                      fontSize: "0.78rem",
                      fontWeight: 700,
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Base URL & Collection Variables Reference */}
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
                  margin: "0 0 8px",
                }}
              >
                {lang === "ar"
                  ? "عنوان الخادم الأساسي ومتغيرات مجموعة Postman (Base URL & Variables)"
                  : "Base URL & Postman Collection Variables"}
              </h3>
              <p
                style={{
                  fontSize: "0.84rem",
                  color: "var(--text-muted)",
                  margin: "0 0 16px",
                }}
              >
                {lang === "ar"
                  ? "جميع نقاط الـ API الخارجية تستخدم المتغيرات التالية داخل ملف Postman وتدعم إرسال البيانات عبر Form Data أو Query Params:"
                  : "All external API endpoints use the following variables in the Postman collection and accept Form Data or Query Parameters:"}
              </p>

              <div style={{ overflowX: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: "0.8rem",
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        borderBottom: "1px solid var(--border)",
                        textAlign: lang === "ar" ? "right" : "left",
                      }}
                    >
                      <th style={{ padding: "8px 10px" }}>Variable</th>
                      <th style={{ padding: "8px 10px" }}>Default / Example</th>
                      <th style={{ padding: "8px 10px" }}>Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      {
                        key: "{{base_url}}",
                        val: "https://admin.cal.saabq.com/api/v1",
                        desc:
                          lang === "ar"
                            ? "الرابط الأساسي لواجهة البرمجة (يتبعه /external/...)"
                            : "Base API v1 URL (prefixed to /external/...)",
                      },
                      {
                        key: "{{api_key}}",
                        val: apiData?.api_key || "sbq_live_...",
                        desc:
                          lang === "ar"
                            ? "مفتاح مساحة العمل العام المرسل في ترويسة X-Api-Key"
                            : "Public workspace API key sent in X-Api-Key header",
                      },
                      {
                        key: "{{api_secret}}",
                        val: revealedSecret || "YOUR_API_SECRET",
                        desc:
                          lang === "ar"
                            ? "المفتاح السري المرسل في ترويسة X-Api-Secret"
                            : "Secret workspace key sent in X-Api-Secret header",
                      },
                      {
                        key: "{{service_id}}",
                        val: "1",
                        desc:
                          lang === "ar"
                            ? "معرّف الخدمة النشطة للاستعلام عن المواعيد أو الحجز"
                            : "Target active service ID",
                      },
                      {
                        key: "{{staff_id}}",
                        val: "1",
                        desc:
                          lang === "ar"
                            ? "معرّف الموظف أو المختص"
                            : "Target workspace staff member ID",
                      },
                      {
                        key: "{{booking_id}}",
                        val: "1",
                        desc:
                          lang === "ar"
                            ? "معرّف الموعد لعرض التفاصيل أو التأجيل أو الإلغاء"
                            : "Target booking ID for show, reschedule, or cancel",
                      },
                      {
                        key: "{{customer_id}}",
                        val: "1",
                        desc:
                          lang === "ar"
                            ? "معرّف العميل في مساحة العمل"
                            : "Target workspace customer ID",
                      },
                      {
                        key: "{{date}}",
                        val: playgroundDate,
                        desc:
                          lang === "ar"
                            ? "تاريخ الحجز بصيغة YYYY-MM-DD (يجب أن يكون اليوم أو تاريخاً مستقبلياً)"
                            : "Target date in YYYY-MM-DD format (cannot be in the past)",
                      },
                      {
                        key: "{{start_time}}",
                        val: "10:00",
                        desc:
                          lang === "ar"
                            ? "وقت بداية الفترة بصيغة HH:mm (يجب أن يطابق فترة متاحة في جدول الخدمة)"
                            : "Slot start time in 24h HH:mm format (must match an available schedule slot)",
                      },
                    ].map((row) => (
                      <tr
                        key={row.key}
                        style={{ borderBottom: "1px solid var(--border)" }}
                      >
                        <td style={{ padding: "8px 10px" }}>
                          <code
                            style={{
                              color: "var(--primary)",
                              fontWeight: 700,
                            }}
                            dir="ltr"
                          >
                            {row.key}
                          </code>
                        </td>
                        <td style={{ padding: "8px 10px" }}>
                          <code dir="ltr">{row.val}</code>
                        </td>
                        <td
                          style={{
                            padding: "8px 10px",
                            color: "var(--text-muted)",
                          }}
                        >
                          {row.desc}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
                  {"{{base_url}}/external/ping"}
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
                className="workspace-api-code-wrap"
                style={{
                  backgroundColor: "#1e1e2e",
                  borderRadius: 12,
                  padding: 16,
                  direction: "ltr",
                  textAlign: "left",
                  overflowX: "auto",
                  maxWidth: "100%",
                }}
              >
                <pre
                  style={{
                    margin: 0,
                    fontFamily: "monospace",
                    fontSize: "0.8rem",
                    color: "#f5e0dc",
                    overflowX: "auto",
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

            {/* Doc Endpoint 2: Services & Available Slots */}
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
                  flexWrap: "wrap",
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
                  {"{{base_url}}/external/services/{{service_id}}/slots"}
                </code>
                <span
                  style={{
                    fontSize: "0.72rem",
                    padding: "2px 8px",
                    borderRadius: 10,
                    backgroundColor: "rgba(32, 123, 89, 0.12)",
                    color: "var(--primary)",
                    fontWeight: 700,
                  }}
                >
                  availability:read
                </span>
              </div>
              <p
                style={{
                  fontSize: "0.85rem",
                  color: "var(--text-muted)",
                  margin: "0 0 12px",
                }}
              >
                {t("docServicesDesc") ||
                  "جلب قائمة الخدمات النشطة والمواعيد المتاحة في تاريخ محدد."}
              </p>

              {/* Query Params Table */}
              <div style={{ overflowX: "auto", marginBottom: 14 }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: "0.78rem",
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        borderBottom: "1px solid var(--border)",
                        textAlign: lang === "ar" ? "right" : "left",
                      }}
                    >
                      <th style={{ padding: "6px 8px" }}>Query Param</th>
                      <th style={{ padding: "6px 8px" }}>Required</th>
                      <th style={{ padding: "6px 8px" }}>Validation</th>
                      <th style={{ padding: "6px 8px" }}>Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={{ padding: "6px 8px" }}>
                        <code dir="ltr">date</code>
                      </td>
                      <td style={{ padding: "6px 8px", color: "#dc2626" }}>
                        Required
                      </td>
                      <td style={{ padding: "6px 8px" }}>
                        <code dir="ltr">date_format:Y-m-d</code>
                      </td>
                      <td style={{ padding: "6px 8px" }}>
                        Target date (e.g. {playgroundDate})
                      </td>
                    </tr>
                    <tr style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={{ padding: "6px 8px" }}>
                        <code dir="ltr">staff_id</code>
                      </td>
                      <td
                        style={{
                          padding: "6px 8px",
                          color: "var(--text-muted)",
                        }}
                      >
                        Optional
                      </td>
                      <td style={{ padding: "6px 8px" }}>
                        <code dir="ltr">integer | exists:workspace_members,id</code>
                      </td>
                      <td style={{ padding: "6px 8px" }}>
                        Filter slots by staff member ID
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div
                className="workspace-api-code-wrap"
                style={{
                  backgroundColor: "#1e1e2e",
                  borderRadius: 12,
                  padding: 16,
                  direction: "ltr",
                  textAlign: "left",
                  overflowX: "auto",
                  maxWidth: "100%",
                }}
              >
                <pre
                  style={{
                    margin: 0,
                    fontFamily: "monospace",
                    fontSize: "0.8rem",
                    color: "#f5e0dc",
                    overflowX: "auto",
                  }}
                >
                  {codeLang === "curl" &&
                    `curl -G "https://admin.cal.saabq.com/api/v1/external/services/1/slots" \\
  -H "X-Api-Key: ${apiData?.api_key || "YOUR_API_KEY"}" \\
  -H "X-Api-Secret: YOUR_API_SECRET" \\
  -H "Accept: application/json" \\
  --data-urlencode "date=${playgroundDate}"`}

                  {codeLang === "js" &&
                    `const params = new URLSearchParams({ date: "${playgroundDate}" });
const response = await fetch(\`https://admin.cal.saabq.com/api/v1/external/services/1/slots?\${params}\`, {
  headers: {
    "X-Api-Key": "${apiData?.api_key || "YOUR_API_KEY"}",
    "X-Api-Secret": "YOUR_API_SECRET",
    "Accept": "application/json"
  }
});
const result = await response.json();`}

                  {codeLang === "php" &&
                    `$response = $client->get('https://admin.cal.saabq.com/api/v1/external/services/1/slots', [
    'headers' => [
        'X-Api-Key'    => '${apiData?.api_key || "YOUR_API_KEY"}',
        'X-Api-Secret' => 'YOUR_API_SECRET',
        'Accept'       => 'application/json',
    ],
    'query' => [
        'date' => '${playgroundDate}',
    ],
]);`}

                  {codeLang === "python" &&
                    `response = requests.get(
    "https://admin.cal.saabq.com/api/v1/external/services/1/slots",
    headers=headers,
    params={"date": "${playgroundDate}"}
)`}
                </pre>
              </div>
            </div>

            {/* Doc Endpoint 3: Create Booking (Form Data + Slot Validation) */}
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
                  flexWrap: "wrap",
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
                  {"{{base_url}}/external/bookings"}
                </code>
                <span
                  style={{
                    fontSize: "0.72rem",
                    padding: "2px 8px",
                    borderRadius: 10,
                    backgroundColor: "rgba(37, 99, 235, 0.12)",
                    color: "#2563eb",
                    fontWeight: 700,
                  }}
                >
                  bookings:write | Form Data
                </span>
              </div>
              <p
                style={{
                  fontSize: "0.85rem",
                  color: "var(--text-muted)",
                  margin: "0 0 12px",
                }}
              >
                {t("docCreateBookingDesc") ||
                  "إنشاء حجز جديد تلقائياً وتثبيته في قاعدة بيانات سابق مع مزامنة تقويم جوجل وإشعارات تليجرام فوراً."}
              </p>

              {/* Validation Rules Alert */}
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: 10,
                  backgroundColor: "rgba(245, 158, 11, 0.08)",
                  border: "1px solid rgba(245, 158, 11, 0.28)",
                  fontSize: "0.78rem",
                  marginBottom: 14,
                  lineHeight: 1.6,
                }}
              >
                <strong>
                  {lang === "ar"
                    ? "قواعد التحقق من التاريخ والفترات الزمنية:"
                    : "Date & Schedule Slot Validation Rules:"}
                </strong>{" "}
                {lang === "ar"
                  ? "لا يُسمح بالحجز في تاريخ أو وقت سابق، ويجب أن يطابق وقت البداية (start_time) فترة متاحة فعلياً في جدول الخدمة لتاريخ الحجز، وإلا سيُرفض الطلب بكود 422."
                  : "Bookings in the past are rejected, and start_time must match an available slot in the service's schedule for that date (returns 422 Unprocessable Entity otherwise)."}
              </div>

              {/* Form Data Parameters Table */}
              <div style={{ overflowX: "auto", marginBottom: 14 }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: "0.78rem",
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        borderBottom: "1px solid var(--border)",
                        textAlign: lang === "ar" ? "right" : "left",
                      }}
                    >
                      <th style={{ padding: "6px 8px" }}>Form Data Param</th>
                      <th style={{ padding: "6px 8px" }}>Required</th>
                      <th style={{ padding: "6px 8px" }}>Validation Rules</th>
                      <th style={{ padding: "6px 8px" }}>Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      {
                        k: "service_id",
                        req: true,
                        rule: "integer | exists:services,id",
                        desc: "Target active service ID",
                      },
                      {
                        k: "date",
                        req: true,
                        rule: "date_format:Y-m-d | after_or_equal:today",
                        desc: "Booking date (must have open schedule slots)",
                      },
                      {
                        k: "start_time",
                        req: true,
                        rule: "date_format:H:i | valid available slot",
                        desc: "Slot start time matching GET /slots (e.g. 10:00)",
                      },
                      {
                        k: "customer_name",
                        req: true,
                        rule: "string | max:255",
                        desc: "Customer full name",
                      },
                      {
                        k: "customer_email",
                        req: true,
                        rule: "email | max:255",
                        desc: "Customer email address",
                      },
                      {
                        k: "customer_phone",
                        req: false,
                        rule: "string | max:50",
                        desc: "Customer phone number",
                      },
                      {
                        k: "staff_id",
                        req: false,
                        rule: "integer | exists:workspace_members,id",
                        desc: "Assigned staff member ID",
                      },
                      {
                        k: "external_reference_id",
                        req: false,
                        rule: "string | max:255",
                        desc: "External order/booking ID for two-way sync",
                      },
                      {
                        k: "notes",
                        req: false,
                        rule: "string | max:2000",
                        desc: "Additional appointment notes",
                      },
                    ].map((param) => (
                      <tr
                        key={param.k}
                        style={{ borderBottom: "1px solid var(--border)" }}
                      >
                        <td style={{ padding: "6px 8px" }}>
                          <code dir="ltr">{param.k}</code>
                        </td>
                        <td
                          style={{
                            padding: "6px 8px",
                            color: param.req
                              ? "#dc2626"
                              : "var(--text-muted)",
                            fontWeight: param.req ? 700 : 400,
                          }}
                        >
                          {param.req ? "Required" : "Optional"}
                        </td>
                        <td style={{ padding: "6px 8px" }}>
                          <code dir="ltr">{param.rule}</code>
                        </td>
                        <td style={{ padding: "6px 8px" }}>{param.desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div
                className="workspace-api-code-wrap"
                style={{
                  backgroundColor: "#1e1e2e",
                  borderRadius: 12,
                  padding: 16,
                  direction: "ltr",
                  textAlign: "left",
                  overflowX: "auto",
                  maxWidth: "100%",
                }}
              >
                <pre
                  style={{
                    margin: 0,
                    fontFamily: "monospace",
                    fontSize: "0.8rem",
                    color: "#f5e0dc",
                    overflowX: "auto",
                  }}
                >
                  {codeLang === "curl" &&
                    `curl -X POST "https://admin.cal.saabq.com/api/v1/external/bookings" \\
  -H "X-Api-Key: ${apiData?.api_key || "YOUR_API_KEY"}" \\
  -H "X-Api-Secret: YOUR_API_SECRET" \\
  -H "Accept: application/json" \\
  -F "service_id=1" \\
  -F "date=${playgroundDate}" \\
  -F "start_time=10:00" \\
  -F "customer_name=Sarah Smith" \\
  -F "customer_email=sara@example.com" \\
  -F "customer_phone=+966551234567" \\
  -F "external_reference_id=ORDER-9842"`}

                  {codeLang === "js" &&
                    `const formData = new FormData();
formData.append("service_id", "1");
formData.append("date", "${playgroundDate}");
formData.append("start_time", "10:00");
formData.append("customer_name", "Sarah Smith");
formData.append("customer_email", "sara@example.com");
formData.append("customer_phone", "+966551234567");
formData.append("external_reference_id", "ORDER-9842");

const res = await fetch("https://admin.cal.saabq.com/api/v1/external/bookings", {
  method: "POST",
  headers: {
    "X-Api-Key": "${apiData?.api_key || "YOUR_API_KEY"}",
    "X-Api-Secret": "YOUR_API_SECRET",
    "Accept": "application/json"
  },
  body: formData
});
const booking = await res.json();`}

                  {codeLang === "php" &&
                    `$res = $client->post('https://admin.cal.saabq.com/api/v1/external/bookings', [
    'headers' => [
        'X-Api-Key'    => '${apiData?.api_key || "YOUR_API_KEY"}',
        'X-Api-Secret' => 'YOUR_API_SECRET',
        'Accept'       => 'application/json',
    ],
    'multipart' => [
        ['name' => 'service_id',     'contents' => '1'],
        ['name' => 'date',           'contents' => '${playgroundDate}'],
        ['name' => 'start_time',     'contents' => '10:00'],
        ['name' => 'customer_name',  'contents' => 'Sarah Smith'],
        ['name' => 'customer_email', 'contents' => 'sara@example.com'],
    ]
]);`}

                  {codeLang === "python" &&
                    `payload = {
    "service_id": 1,
    "date": "${playgroundDate}",
    "start_time": "10:00",
    "customer_name": "Sarah Smith",
    "customer_email": "sara@example.com",
}
res = requests.post("https://admin.cal.saabq.com/api/v1/external/bookings", headers=headers, data=payload)`}
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
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(min(100%, 260px), 1fr))",
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
        <ModalPortal>
          <div
            className="modal-backdrop"
            onClick={() => setShowRequestModal(false)}
          >
            <div
              className="modal-card modal-md animate-fade-in-up"
              onClick={(e) => e.stopPropagation()}
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
        </ModalPortal>
      )}

      {/* REVEAL SECRET MODAL */}
      {showRevealModal && (
        <ModalPortal>
          <div
            className="modal-backdrop"
            onClick={() => {
              setShowRevealModal(false);
              setRevealPassword("");
            }}
          >
            <div
              className="modal-card modal-sm animate-fade-in-up"
              onClick={(e) => e.stopPropagation()}
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
        </ModalPortal>
      )}

      {/* REGENERATE CONFIRMATION MODAL */}
      {showRegenerateModal && (
        <ModalPortal>
          <div
            className="modal-backdrop"
            onClick={() => setShowRegenerateModal(false)}
          >
            <div
              className="modal-card modal-sm animate-fade-in-up"
              onClick={(e) => e.stopPropagation()}
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
        </ModalPortal>
      )}
    </div>
  );
}
