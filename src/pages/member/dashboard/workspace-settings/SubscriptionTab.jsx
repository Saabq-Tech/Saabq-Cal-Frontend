import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useLanguage } from "../../../../context/LanguageContext";
import { useToast } from "../../../../context/ToastContext";
import Icon from "../../../../components/common/Icon";
import client, { endpoints } from "../../../../api/client";

export default function SubscriptionTab({
  subscriptionInfo,
  plans = [],
  plansLoading = false,
  plansError = null,
  canEdit,
  onUpgrade,
  onCancel,
  onPause: _onPause,
  onResume: _onResume,
}) {
  const { t } = useLanguage();
  const toast = useToast();

  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [_isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, _setCancelReason] = useState("");
  const [_cancelLoading, setCancelLoading] = useState(false);
  const [selectedUpgradePlanId, setSelectedUpgradePlanId] = useState(null);
  const [billingCycle, setBillingCycle] = useState("monthly");

  // Payment Methods state
  const [paymentMethods, setPaymentMethods] = useState([]);

  useEffect(() => {
    let isMounted = true;
    client
      .get("/v1/workspace-members/workspace/payments/methods")
      .then((res) => {
        if (isMounted && res.data?.data) {
          setPaymentMethods(Array.isArray(res.data.data) ? res.data.data : []);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  // Proof Modal state
  const [isProofModalOpen, setIsProofModalOpen] = useState(false);
  const [proofFile, setProofFile] = useState(null);
  const [proofFilePreview, setProofFilePreview] = useState("");
  const [proofNotes, setProofNotes] = useState("");
  const [submittingProof, setSubmittingProof] = useState(false);

  const planName =
    subscriptionInfo?.plan?.name || subscriptionInfo?.name || null;
  const endsAt =
    subscriptionInfo?.ends_at || subscriptionInfo?.expires_at || null;
  const statusStr =
    subscriptionInfo?.status || (subscriptionInfo ? "active" : null);

  const latestPayment =
    subscriptionInfo?.latest_payment || subscriptionInfo?.payments?.[0];
  const rejectionReason =
    latestPayment?.rejection_reason || subscriptionInfo?.rejection_reason;
  const isPaymentRejected =
    latestPayment?.status === "failed" || Boolean(rejectionReason);
  const isCancelledOrPending =
    statusStr === "cancelled" ||
    statusStr === "canceled" ||
    statusStr === "pending";
  const canUploadProof =
    Boolean(subscriptionInfo) && (isCancelledOrPending || isPaymentRejected);

  const handleConfirmUpgrade = () => {
    if (!selectedUpgradePlanId) {
      toast.error(t("selectPlanError") || "يرجى اختيار باقة للمتابعة");
      return;
    }
    if (onUpgrade)
      onUpgrade(selectedUpgradePlanId, billingCycle, proofFile, proofNotes);
    setIsUpgradeModalOpen(false);
    setProofFile(null);
    setProofFilePreview("");
    setProofNotes("");
  };

  const _handleConfirmCancel = async () => {
    if (onCancel) {
      try {
        setCancelLoading(true);
        await onCancel(cancelReason);
        setIsCancelModalOpen(false);
      } finally {
        setCancelLoading(false);
      }
    }
  };

  const handleUploadSubscriptionProof = async (e) => {
    e.preventDefault();
    setSubmittingProof(true);
    try {
      const formData = new FormData();
      if (proofFile instanceof File) {
        formData.append("proof_file", proofFile);
      } else if (typeof proofFile === "string" && proofFile.trim()) {
        formData.append("proof_file", proofFile.trim());
      } else if (proofFilePreview) {
        formData.append("proof_file", proofFilePreview);
      } else {
        toast.error(
          t("selectReceiptError") || "يرجى اختيار ملف أو إرفاق إيصال الدفع",
        );
        setSubmittingProof(false);
        return;
      }

      if (proofNotes.trim()) {
        formData.append("proof_notes", proofNotes.trim());
      }

      const res = await client.post(
        endpoints.workspaceSubscriptionProof,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );

      toast.success(
        res.data?.message ||
          t("payment_proof_submitted") ||
          "تم إرفاق إيصال السداد بنجاح",
      );
      setIsProofModalOpen(false);
      setProofFile(null);
      setProofFilePreview("");
      setProofNotes("");
      if (typeof window !== "undefined" && window.location) {
        window.location.reload();
      }
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          t("uploadProofFailed") ||
          "فشل إرفاق إيصال الدفع",
      );
    } finally {
      setSubmittingProof(false);
    }
  };

  const formatDate = (d) => {
    if (!d) return "";
    const str = String(d);
    if (str.includes("T")) return str.split("T")[0];
    return str.substring(0, 10);
  };

  const renderStatusBadge = (status) => {
    const s = String(status || "").toLowerCase();

    const badgeConfig = {
      pending: {
        label: t("statusPending") || "قيد الانتظار",
        color: "#b45309",
        bg: "#fef3c7",
        border: "#fde68a",
        dotColor: "#f59e0b",
      },
      active: {
        label: t("statusActiveBadge") || t("statusActive") || "نشط",
        color: "#166534",
        bg: "#dcfce7",
        border: "#bbf7d0",
        dotColor: "#22c55e",
      },
      trialing: {
        label: t("statusTrialing") || "فترة تجريبية",
        color: "#0369a1",
        bg: "#e0f2fe",
        border: "#bae6fd",
        dotColor: "#0284c7",
      },
      paused: {
        label: t("statusPaused") || "موقوف مؤقتاً",
        color: "#92400e",
        bg: "#fef3c7",
        border: "#fde68a",
        dotColor: "#f59e0b",
      },
      cancelled: {
        label: t("statusCancelled") || "ملغى",
        color: "#991b1b",
        bg: "#fee2e2",
        border: "#fecaca",
        dotColor: "#ef4444",
      },
      expired: {
        label: t("statusExpired") || "منتهي الصلاحية",
        color: "#475569",
        bg: "#f1f5f9",
        border: "#e2e8f0",
        dotColor: "#64748b",
      },
    };

    const config = badgeConfig[s] || {
      label: s,
      color: "#334155",
      bg: "#f1f5f9",
      border: "#cbd5e1",
      dotColor: "#94a3b8",
    };

    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "6px 16px",
          borderRadius: 20,
          fontSize: "0.82rem",
          fontWeight: 700,
          color: config.color,
          background: config.bg,
          border: `1px solid ${config.border}`,
          boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
        }}
      >
        <span
          style={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: config.dotColor,
            display: "inline-block",
          }}
        />
        {config.label}
      </span>
    );
  };

  return (
    <div className="card-body">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 14,
          marginBottom: 20,
        }}
      >
        <div>
          <h2
            style={{
              fontSize: "1.2rem",
              fontWeight: 800,
              margin: 0,
              color: "var(--heading)",
            }}
          >
            {t("workspaceSubscription") || "اشتراك مساحة العمل والخطة الحالية"}
          </h2>
          <p
            style={{
              fontSize: "0.86rem",
              color: "var(--text-secondary)",
              margin: "4px 0 0",
            }}
          >
            {t("subscriptionDesc") ||
              "متابعة حالة الاشتراك الحالي، ميعاد التجديد، وإمكانية الترقية لباقات أعلى"}
          </p>
        </div>
        {canEdit && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {statusStr !== "pending" && (
              <button
                className="btn btn-primary btn-sm"
                onClick={() => setIsUpgradeModalOpen(true)}
                style={{ gap: 6 }}
              >
                <Icon name="rocket" size={14} />
                {t("upgradePlan") || "ترقية الباقة"}
              </button>
            )}
            {canUploadProof && (
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setIsProofModalOpen(true)}
                style={{ gap: 6 }}
              >
                <Icon name="upload-cloud" size={14} />
                {t("uploadProofBtn") || "إرفاق إيصال الدفع"}
              </button>
            )}
          </div>
        )}
      </div>

      {!subscriptionInfo ? (
        <div
          style={{
            padding: "48px 20px",
            textAlign: "center",
            background: "var(--surface-alt)",
            borderRadius: "var(--radius-lg)",
            border: "1px border-dashed var(--border)",
            marginBottom: 20,
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              background: "var(--primary-subtle)",
              color: "var(--primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 12px",
            }}
          >
            <Icon name="credit-card" size={24} />
          </div>
          <h4
            style={{
              fontSize: "1rem",
              fontWeight: 700,
              margin: "0 0 6px",
              color: "var(--heading)",
            }}
          >
            {t("noSubscriptionFound") ||
              "لا يوجد اشتراك مفعّل حالياً لمساحة العمل"}
          </h4>
          <p
            style={{
              fontSize: "0.85rem",
              color: "var(--muted)",
              margin: "0 0 16px",
            }}
          >
            {t("noSubscriptionDesc") ||
              "قم باختيار وتفعيل باقتك للبدء في استخدام جميع مميزات مساحة العمل."}
          </p>
          {canEdit && (
            <button
              className="btn btn-primary btn-sm"
              onClick={() => setIsUpgradeModalOpen(true)}
            >
              + {t("choosePlan") || "اختيار باقة"}
            </button>
          )}
        </div>
      ) : (
        <div
          style={{
            padding: 20,
            background: "var(--surface-alt)",
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--border-light)",
            marginBottom: 20,
          }}
        >
          {isPaymentRejected && (
            <div
              style={{
                padding: "14px 18px",
                background: "#fef2f2",
                borderRadius: 12,
                border: "1px solid #fca5a5",
                color: "#991b1b",
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: 10,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <Icon
                    name="x-circle"
                    size={24}
                    style={{ color: "#dc2626" }}
                  />
                  <div>
                    <strong
                      style={{
                        display: "block",
                        fontSize: "0.92rem",
                        marginBottom: 2,
                      }}
                    >
                      {t("paymentRejectedTitle") || "تم رفض إيصال الدفع السابق"}
                    </strong>
                    <span style={{ fontSize: "0.84rem" }}>
                      {rejectionReason
                        ? `${t("rejectionReason") || "سبب الرفض"}: ${rejectionReason}`
                        : t("paymentRejectedDesc") ||
                          "يرجى إعادة رفع إيصال تحويل صحيح للتحقق منه وتفعيل الاشتراك."}
                    </span>
                  </div>
                </div>
                {canEdit && (
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => setIsProofModalOpen(true)}
                    style={{ gap: 6 }}
                  >
                    <Icon name="upload-cloud" size={14} />
                    {t("resendProofBtn") || "إعادة إرفاق إيصال الدفع"}
                  </button>
                )}
              </div>
            </div>
          )}

          {statusStr === "pending" && !isPaymentRejected && (
            <div
              style={{
                padding: "14px 18px",
                background: "rgba(245, 158, 11, 0.1)",
                borderRadius: 12,
                border: "1px solid rgba(245, 158, 11, 0.3)",
                color: "#b45309",
                marginBottom: 16,
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <Icon name="clock" size={24} />
              <div>
                <strong
                  style={{
                    display: "block",
                    fontSize: "0.92rem",
                    marginBottom: 2,
                  }}
                >
                  {t("pendingSubscriptionTitle") || "طلب الاشتراك قيد المراجعة"}
                </strong>
                <span style={{ fontSize: "0.84rem" }}>
                  {t("pendingSubscriptionDesc") ||
                    "تم تقديم طلب الاشتراك وهو قيد المراجعة حالياً. سيتم تفعيل المميزات فور الاعتماد."}
                </span>
              </div>
            </div>
          )}

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 10,
            }}
          >
            <div>
              <span
                style={{
                  fontSize: "0.8rem",
                  color: "var(--muted)",
                  fontWeight: 700,
                }}
              >
                {statusStr === "pending"
                  ? t("requestedPlan") || "الخطة المطلوبة"
                  : t("currentPlanActive") || "الخطة المفعلة حالياً"}
              </span>
              <h3
                style={{
                  fontSize: "1.25rem",
                  fontWeight: 800,
                  color: "var(--primary)",
                  margin: "2px 0 0",
                }}
              >
                {planName || t("basicPlan") || "الباقة الأساسية"}
              </h3>
            </div>
            {renderStatusBadge(statusStr)}
          </div>

          <div
            style={{
              marginTop: 16,
              display: "flex",
              gap: 24,
              flexWrap: "wrap",
              fontSize: "0.88rem",
              color: "var(--text-secondary)",
            }}
          >
            {endsAt && (
              <div>
                {t("nextRenewalDate") || "تاريخ التجديد القادم:"}{" "}
                <strong>{formatDate(endsAt)}</strong>
              </div>
            )}
            {subscriptionInfo.billing_cycle && (
              <div>
                {t("billingCycleLabel") || "دورة الفواتير:"}{" "}
                <strong>
                  {subscriptionInfo.billing_cycle === "yearly"
                    ? t("yearly") || "سنوي"
                    : subscriptionInfo.billing_cycle === "monthly"
                      ? t("monthly") || "شهري"
                      : subscriptionInfo.billing_cycle}
                </strong>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Upgrade Modal */}
      {isUpgradeModalOpen &&
        createPortal(
          <div className="modal-backdrop">
            <div
              className="modal-card modal-xl animate-fade-in-up"
              style={{
                maxWidth: 1060,
                width: "94vw",
                maxHeight: "90vh",
                overflowY: "auto",
              }}
            >
              <div className="modal-header">
                <h3 className="modal-title">
                  {t("upgradeModalTitle") || "ترقية باقة مساحة العمل"}
                </h3>
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() => setIsUpgradeModalOpen(false)}
                >
                  <Icon name="x" size={16} />
                </button>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: 8,
                  marginBottom: 20,
                }}
              >
                <button
                  type="button"
                  className={`btn btn-sm ${billingCycle === "monthly" ? "btn-primary" : "btn-ghost"}`}
                  onClick={() => setBillingCycle("monthly")}
                  style={{ borderRadius: 20, padding: "6px 18px" }}
                >
                  {t("filterMonthly") || "فلترة شهرية"}
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${billingCycle === "yearly" ? "btn-primary" : "btn-ghost"}`}
                  onClick={() => setBillingCycle("yearly")}
                  style={{ borderRadius: 20, padding: "6px 18px" }}
                >
                  {t("filterYearlyDiscount") || "فلترة سنوية (خصم 20%)"}
                </button>
              </div>

              {plansLoading ? (
                <div style={{ padding: 40, textAlign: "center" }}>
                  <span
                    className="spinner spinner-md"
                    style={{ margin: "0 auto 12px" }}
                  />
                  <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>
                    {t("loadingPlans") || "جاري تحميل الخطط المتاحة..."}
                  </p>
                </div>
              ) : plansError ? (
                <div
                  style={{
                    padding: 24,
                    textAlign: "center",
                    background: "rgba(239, 68, 68, 0.08)",
                    borderRadius: 12,
                    color: "#dc2626",
                    marginBottom: 20,
                  }}
                >
                  {plansError}
                </div>
              ) : plans.length === 0 ? (
                <div
                  style={{
                    padding: 32,
                    textAlign: "center",
                    color: "var(--muted)",
                    marginBottom: 20,
                  }}
                >
                  {t("noPlansAvailable") || "لا توجد باقات متوفرة حالياً"}
                </div>
              ) : (
                <div className="plan-cards-grid">
                  {plans.map((p) => {
                    const selected = selectedUpgradePlanId === p.id;
                    const rawPrice =
                      billingCycle === "yearly"
                        ? p.yearly_price || p.price_yearly || p.price * 10
                        : p.monthly_price || p.price_monthly || p.price;
                    const unitStr =
                      billingCycle === "yearly"
                        ? t("sarPerYear") || "ر.س / سنوياً"
                        : t("sarPerMonth") || "ر.س / شهرياً";

                    const formatCapStr = (cap) => {
                      if (!cap) return "";
                      if (typeof cap === "string") return cap;
                      if (typeof cap === "object") {
                        if (cap.name)
                          return typeof cap.name === "object"
                            ? cap.name.ar || cap.name.en || ""
                            : cap.name;
                        if (cap.title)
                          return typeof cap.title === "object"
                            ? cap.title.ar || cap.title.en || ""
                            : cap.title;
                        return cap.code || cap.key || "";
                      }
                      return String(cap);
                    };

                    return (
                      <div
                        key={p.id}
                        onClick={() => setSelectedUpgradePlanId(p.id)}
                        className={`plan-card-option ${selected ? "selected" : ""}`}
                      >
                        {selected && (
                          <div className="plan-card-selected-badge">
                            {t("selected") || "محدد"}
                          </div>
                        )}

                        <div className="plan-card-header">
                          <span className="plan-card-title">
                            {p.name || p.title}
                          </span>
                          <input
                            type="radio"
                            checked={selected}
                            readOnly
                            className="plan-card-radio"
                          />
                        </div>

                        <div className="plan-card-price">
                          {rawPrice}{" "}
                          <span className="plan-card-price-unit">
                            {unitStr}
                          </span>
                        </div>

                        {p.description && (
                          <p className="plan-card-desc">
                            {formatCapStr(p.description)}
                          </p>
                        )}

                        <div className="plan-card-features-wrapper">
                          <div className="plan-card-features-title">
                            {t("planCapabilitiesLabel") ||
                              "المميزات والإمكانيات:"}
                          </div>
                          <ul className="plan-card-features-list">
                            <li>
                              <Icon
                                name="check"
                                size={14}
                                className="feature-check-icon"
                              />
                              <span>
                                {p.max_members || p.max_team_members
                                  ? `${t("members") || "أعضاء الفريق"}: ${p.max_members || p.max_team_members}`
                                  : t("unlimitedTeamMembers") ||
                                    "أعضاء فريق غير محدودين"}
                              </span>
                            </li>
                            <li>
                              <Icon
                                name="check"
                                size={14}
                                className="feature-check-icon"
                              />
                              <span>
                                {p.max_services || p.max_schedules
                                  ? `${t("services") || "الخدمات والجداول"}: ${p.max_services || p.max_schedules}`
                                  : t("unlimitedServices") ||
                                    "خدمات وجداول غير محدودة"}
                              </span>
                            </li>
                            <li>
                              <Icon
                                name="check"
                                size={14}
                                className="feature-check-icon"
                              />
                              <span>
                                {p.max_appointments || p.max_bookings
                                  ? `${t("appointments") || "الحجوزات"}: ${p.max_appointments || p.max_bookings}`
                                  : t("unlimitedAppointments") ||
                                    "حجوزات عملاء غير محدودة"}
                              </span>
                            </li>
                            {p.max_customers && (
                              <li>
                                <Icon
                                  name="check"
                                  size={14}
                                  className="feature-check-icon"
                                />
                                <span>
                                  {`${t("customers") || "العملاء"}: ${p.max_customers}`}
                                </span>
                              </li>
                            )}

                            {/* Capabilities Array */}
                            {Array.isArray(p.capabilities) &&
                              p.capabilities.map((cap, idx) => {
                                const nameStr = formatCapStr(cap);
                                if (!nameStr) return null;
                                return (
                                  <li key={cap.id || cap.code || idx}>
                                    <Icon
                                      name="check"
                                      size={14}
                                      className="feature-check-icon"
                                    />
                                    <span>{nameStr}</span>
                                  </li>
                                );
                              })}

                            {/* Features Array */}
                            {Array.isArray(p.features) &&
                              p.features.map((feat, idx) => {
                                const featStr = formatCapStr(feat);
                                if (!featStr) return null;
                                return (
                                  <li key={idx}>
                                    <Icon
                                      name="check"
                                      size={14}
                                      className="feature-check-icon"
                                    />
                                    <span>{featStr}</span>
                                  </li>
                                );
                              })}
                          </ul>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Receipt File Upload for Upgrade */}
              <div
                style={{
                  borderTop: "1px solid var(--border-light)",
                  paddingTop: 16,
                  marginTop: 10,
                }}
              >
                {paymentMethods.length > 0 && (
                  <div
                    style={{
                      background: "var(--bg-secondary)",
                      padding: "12px 14px",
                      borderRadius: 12,
                      border: "1px solid var(--border-light)",
                      marginBottom: 14,
                    }}
                  >
                    <div
                      style={{
                        fontSize: "0.82rem",
                        fontWeight: 800,
                        color: "var(--heading)",
                        marginBottom: 6,
                        display: "flex",
                        itemsCenter: "center",
                        gap: 6,
                      }}
                    >
                      <Icon name="credit-card" size={16} />
                      <span>
                        {t("paymentMethods") || "وسائل السداد المتاحة"}
                      </span>
                    </div>
                    {paymentMethods.map((pm) => (
                      <div
                        key={pm.id}
                        style={{
                          fontSize: "0.78rem",
                          color: "var(--text-secondary)",
                          marginBottom: 6,
                        }}
                      >
                        <strong style={{ color: "var(--heading)" }}>
                          {pm.name}:
                        </strong>{" "}
                        {pm.description}
                        {pm.instructions && (
                          <div
                            style={{
                              margin: "4px 0 0 0",
                              padding: "6px 8px",
                              background: "var(--bg-primary)",
                              borderRadius: 6,
                              fontSize: "0.74rem",
                              fontFamily: "monospace",
                              whitespace: "pre-line",
                            }}
                          >
                            {pm.instructions}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <h4
                  style={{
                    fontSize: "0.92rem",
                    fontWeight: 800,
                    color: "var(--heading)",
                    marginBottom: 10,
                  }}
                >
                  {t("paymentProofUploadTitle") ||
                    "إرفاق إيصال تحويل الاشتراك (إجباري للاعتماد)"}
                </h4>
                <div className="form-group" style={{ marginBottom: 10 }}>
                  <label className="form-label">
                    {t("receiptFile") || "ملف الإيصال (صورة / PDF)"}
                  </label>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    className="form-input"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setProofFile(file);
                    }}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">
                    {t("notes") || "ملاحظات التحويل"}
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder={
                      t("transferNotesPlaceholder") || "رقم الحساب أو المرجع..."
                    }
                    value={proofNotes}
                    onChange={(e) => setProofNotes(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setIsUpgradeModalOpen(false)}
                >
                  {t("cancel")}
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={handleConfirmUpgrade}
                  disabled={plansLoading || plans.length === 0}
                >
                  {t("confirmUpgradeBtn") ||
                    "تأكيد ترقية الباقة وإرسال الإيصال"}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* Standalone Proof Resend Modal */}
      {isProofModalOpen &&
        createPortal(
          <div
            className="modal-backdrop"
            onClick={() => setIsProofModalOpen(false)}
          >
            <div
              className="modal-card modal-md animate-fade-in-up"
              onClick={(e) => e.stopPropagation()}
              style={{ maxWidth: 520 }}
            >
              <div className="modal-header">
                <h3 className="modal-title">
                  {t("resendProofModalTitle") ||
                    "إعادة تقديم / إرفاق إيصال الدفع"}
                </h3>
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() => setIsProofModalOpen(false)}
                >
                  <Icon name="x" size={16} />
                </button>
              </div>

              <form
                onSubmit={handleUploadSubscriptionProof}
                className="modal-body"
              >
                <div className="form-group" style={{ marginBottom: 14 }}>
                  <label className="form-label" style={{ fontWeight: 700 }}>
                    {t("receiptFile") || "ملف الإيصال (صورة / PDF)"}
                  </label>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    className="form-input"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setProofFile(file);
                        if (file.type.startsWith("image/")) {
                          setProofFilePreview(URL.createObjectURL(file));
                        }
                      }
                    }}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 14 }}>
                  <label className="form-label">
                    {t("orDirectUrl") || "أو رابط الإيصال مباشرة"}
                  </label>
                  <input
                    type="url"
                    className="form-input"
                    placeholder="https://example.com/receipt.pdf"
                    value={
                      typeof proofFile === "string"
                        ? proofFile
                        : proofFilePreview
                    }
                    onChange={(e) => {
                      setProofFile(e.target.value);
                      setProofFilePreview(e.target.value);
                    }}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 16 }}>
                  <label className="form-label">
                    {t("notes") || "ملاحظات التحويل / البنك"}
                  </label>
                  <textarea
                    className="form-input"
                    rows={2}
                    placeholder={
                      t("transferNotesPlaceholder") ||
                      "تم التحويل من حساب البنك رقم المرجع #1234"
                    }
                    value={proofNotes}
                    onChange={(e) => setProofNotes(e.target.value)}
                  />
                </div>

                <div className="modal-actions">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setIsProofModalOpen(false)}
                  >
                    {t("cancel")}
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary btn-sm"
                    disabled={submittingProof}
                  >
                    {submittingProof ? (
                      <>
                        <span
                          className="spinner spinner-sm"
                          style={{ borderTopColor: "#fff" }}
                        />
                        {t("submitting") || "جاري الإرسال..."}
                      </>
                    ) : (
                      t("confirmSubmitProof") || "تأكيد وإرسال الإيصال"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
