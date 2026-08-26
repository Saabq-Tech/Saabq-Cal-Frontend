import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../context/ToastContext";
import { useLanguage } from "../../../context/LanguageContext";
import client, { endpoints } from "../../../api/client";
import SEO from "../../../components/ui/SEO";
import Icon from "../../../components/common/Icon";
import { SkeletonRect } from "../../../components/ui/Skeleton";

export default function WorkspacePaymentsPage() {
  useAuth();
  const { t, isRTL } = useLanguage();
  const toast = useToast();

  const [payments, setPayments] = useState([]);
  const [walletData, setWalletData] = useState(null);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [walletLoading, setWalletLoading] = useState(true);
  const [page, setPage] = useState(1);

  // Filters
  const [statusFilter, setStatusFilter] = useState("");
  const [providerFilter, _setProviderFilter] = useState("");
  const [payableTypeFilter, setPayableTypeFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Selected Payment for Modal / Verification
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null);

  const fetchWallet = useCallback(async () => {
    setWalletLoading(true);
    try {
      const res = await client.get(endpoints.workspacePaymentsWallet);
      setWalletData(res.data?.data || null);
    } catch {
      setWalletData(null);
    } finally {
      setWalletLoading(false);
    }
  }, []);

  const fetchPayments = useCallback(
    async (targetPage = 1) => {
      setLoading(true);
      try {
        const params = {
          page: targetPage,
          per_page: 10,
        };
        if (statusFilter) params.status = statusFilter;
        if (providerFilter) params.provider = providerFilter;
        if (payableTypeFilter) params.payable_type = payableTypeFilter;
        if (typeFilter) params.type = typeFilter;
        if (searchQuery.trim()) params.search = searchQuery.trim();

        const res = await client.get(endpoints.workspacePayments, { params });
        const rawData = res.data?.data;
        const list = Array.isArray(rawData)
          ? rawData
          : Array.isArray(rawData?.data)
            ? rawData.data
            : [];
        const paginationMeta = Array.isArray(rawData)
          ? res.data?.meta || null
          : rawData?.meta || res.data?.meta || null;

        setPayments(list);
        setMeta(paginationMeta);
      } catch (err) {
        toast.error(
          err.response?.data?.message ||
            (isRTL ? "فشل تحميل سجل المدفوعات" : "Failed to load payments"),
        );
        setPayments([]);
        setMeta(null);
      } finally {
        setLoading(false);
      }
    },
    [
      statusFilter,
      providerFilter,
      payableTypeFilter,
      typeFilter,
      searchQuery,
      isRTL,
      toast,
    ],
  );

  useEffect(() => {
    fetchWallet();
    fetchPayments(page);
  }, [fetchWallet, fetchPayments, page]);

  const handleVerify = async (payment) => {
    setActionLoading(true);
    try {
      const res = await client.post(
        endpoints.workspacePaymentVerify(payment.id),
      );
      toast.success(
        res.data?.message ||
          (isRTL ? "تم الاعتماد بنجاح" : "Payment verified successfully"),
      );
      setSelectedPayment(null);
      fetchWallet();
      fetchPayments(page);
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          (isRTL ? "فشل اعتماد الدفع" : "Failed to verify payment"),
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (payment) => {
    if (!rejectReason.trim()) {
      toast.error(
        isRTL ? "يرجى تقديم سبب الرفض" : "Please provide a rejection reason",
      );
      return;
    }
    setActionLoading(true);
    try {
      const res = await client.post(
        endpoints.workspacePaymentReject(payment.id),
        {
          reason: rejectReason.trim(),
        },
      );
      toast.success(
        res.data?.message || (isRTL ? "تم رفض الدفع" : "Payment rejected"),
      );
      setSelectedPayment(null);
      setRejectReason("");
      fetchWallet();
      fetchPayments(page);
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          (isRTL ? "فشل رفض الدفع" : "Failed to reject payment"),
      );
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "paid":
        return {
          label: isRTL ? "مدفوع / معتمد" : "Paid",
          color: "#166534",
          bg: "#dcfce7",
          border: "#bbf7d0",
        };
      case "verifying":
        return {
          label: isRTL ? "قيد التحقق" : "Verifying",
          color: "#0369a1",
          bg: "#e0f2fe",
          border: "#bae6fd",
        };
      case "pending":
        return {
          label: isRTL ? "قيد الانتظار" : "Pending",
          color: "#b45309",
          bg: "#fef3c7",
          border: "#fde68a",
        };
      case "failed":
      case "cancelled":
        return {
          label: isRTL ? "مرفوض / ملغى" : "Failed",
          color: "#991b1b",
          bg: "#fee2e2",
          border: "#fecaca",
        };
      case "refunded":
        return {
          label: isRTL ? "مسترجع" : "Refunded",
          color: "#475569",
          bg: "#f1f5f9",
          border: "#e2e8f0",
        };
      default:
        return {
          label: status,
          color: "#334155",
          bg: "#f1f5f9",
          border: "#cbd5e1",
        };
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString(isRTL ? "ar-SA" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="card responsive-card-container">
      <SEO
        title={isRTL ? "سجل المدفوعات والمالية" : "Payments & Finance Log"}
        noindex
      />

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
              fontSize: "1.25rem",
              fontWeight: 800,
              margin: 0,
              color: "var(--heading)",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Icon
              name="credit-card"
              size={22}
              style={{ color: "var(--primary)" }}
            />
            {isRTL
              ? "سجل المدفوعات والتحويلات المالية"
              : "Payments & Finance Log"}
          </h2>
          <p
            style={{
              fontSize: "0.86rem",
              color: "var(--text-secondary)",
              margin: "4px 0 0",
            }}
          >
            {isRTL
              ? "متابعة كافة عمليات الدفع، إيصالات التحويل البنكي، والاعتماد المالي"
              : "Monitor all payment transactions, transfer receipts, and verification statuses"}
          </p>
        </div>
      </div>

      {/* Workspace Safe / Wallet Summary Cards */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 16,
          marginBottom: 24,
        }}
      >
        {/* Net Safe Balance */}
        <div
          style={{
            flex: "1 1 220px",
            background:
              "linear-gradient(135deg, rgba(13, 104, 92, 0.12) 0%, rgba(13, 104, 92, 0.04) 100%)",
            border: "1px solid rgba(13, 104, 92, 0.25)",
            borderRadius: 16,
            padding: "18px 20px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 10,
            }}
          >
            <span
              style={{ fontSize: "0.85rem", fontWeight: 700, color: "#0d685c" }}
            >
              {t("netBalanceLabel")}
            </span>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                background: "rgba(13, 104, 92, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#0d685c",
              }}
            >
              <Icon name="credit-card" size={18} />
            </div>
          </div>
          <div
            style={{
              fontSize: "1.45rem",
              fontWeight: 900,
              color: "var(--heading)",
            }}
          >
            {walletLoading ? (
              <SkeletonRect height={28} width={120} />
            ) : (
              `${walletData?.net_balance ?? 0} ${walletData?.currency || "SAR"}`
            )}
          </div>
        </div>

        {/* Total Income (Credit) */}
        <div
          style={{
            flex: "1 1 220px",
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: 16,
            padding: "18px 20px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 10,
            }}
          >
            <span
              style={{ fontSize: "0.85rem", fontWeight: 700, color: "#166534" }}
            >
              {t("totalCreditLabel")}
            </span>
            <span
              style={{
                fontSize: "0.78rem",
                fontWeight: 800,
                color: "#166534",
                background: "#dcfce7",
                padding: "3px 8px",
                borderRadius: 12,
              }}
            >
              {t("creditBadge")}
            </span>
          </div>
          <div
            style={{ fontSize: "1.3rem", fontWeight: 800, color: "#166534" }}
          >
            {walletLoading ? (
              <SkeletonRect height={28} width={100} />
            ) : (
              `${walletData?.total_credit ?? 0} ${walletData?.currency || "SAR"}`
            )}
          </div>
        </div>

        {/* Total Expenses & Refunds (Debit) */}
        <div
          style={{
            flex: "1 1 220px",
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: 16,
            padding: "18px 20px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 10,
            }}
          >
            <span
              style={{ fontSize: "0.85rem", fontWeight: 700, color: "#991b1b" }}
            >
              {t("totalDebitLabel")}
            </span>
            <span
              style={{
                fontSize: "0.78rem",
                fontWeight: 800,
                color: "#991b1b",
                background: "#fee2e2",
                padding: "3px 8px",
                borderRadius: 12,
              }}
            >
              {t("debitBadge")}
            </span>
          </div>
          <div
            style={{ fontSize: "1.3rem", fontWeight: 800, color: "#991b1b" }}
          >
            {walletLoading ? (
              <SkeletonRect height={28} width={100} />
            ) : (
              `${walletData?.total_debit ?? 0} ${walletData?.currency || "SAR"}`
            )}
          </div>
        </div>

        {/* Pending Verification */}
        <div
          style={{
            flex: "1 1 220px",
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: 16,
            padding: "18px 20px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 10,
            }}
          >
            <span
              style={{ fontSize: "0.85rem", fontWeight: 700, color: "#b45309" }}
            >
              {t("pendingVerificationLabel")}
            </span>
            <span
              style={{
                fontSize: "0.78rem",
                fontWeight: 800,
                color: "#b45309",
                background: "#fef3c7",
                padding: "3px 8px",
                borderRadius: 12,
              }}
            >
              {walletData?.pending_count ?? 0}
            </span>
          </div>
          <div
            style={{ fontSize: "1.3rem", fontWeight: 800, color: "#b45309" }}
          >
            {walletLoading ? (
              <SkeletonRect height={28} width={100} />
            ) : (
              `${walletData?.pending_balance ?? 0} ${walletData?.currency || "SAR"}`
            )}
          </div>
        </div>
      </div>

      {/* Responsive Filters Bar */}
      <div className="responsive-filters-bar">
        <div className="responsive-filter-input">
          <input
            type="text"
            className="form-input"
            placeholder={
              isRTL
                ? "البحث بالمرجع أو الملاحظات..."
                : "Search by reference or notes..."
            }
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            style={{ width: "100%", fontSize: "0.85rem" }}
          />
        </div>

        <div className="responsive-filter-select">
          <select
            className="form-select"
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
            style={{ width: "100%", fontSize: "0.85rem" }}
          >
            <option value="">{t("allTypesLabel")}</option>
            <option value="credit">{t("creditOnlyLabel")}</option>
            <option value="debit">{t("debitOnlyLabel")}</option>
          </select>
        </div>

        <div className="responsive-filter-select">
          <select
            className="form-select"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            style={{ width: "100%", fontSize: "0.85rem" }}
          >
            <option value="">{isRTL ? "جميع الحالات" : "All Statuses"}</option>
            <option value="verifying">
              {isRTL ? "قيد التحقق" : "Verifying"}
            </option>
            <option value="pending">
              {isRTL ? "قيد الانتظار" : "Pending"}
            </option>
            <option value="paid">{isRTL ? "مدفوع ومعتمد" : "Paid"}</option>
            <option value="failed">{isRTL ? "مرفوض" : "Failed"}</option>
            <option value="refunded">{isRTL ? "مسترجع" : "Refunded"}</option>
          </select>
        </div>

        <div className="responsive-filter-select">
          <select
            className="form-select"
            value={payableTypeFilter}
            onChange={(e) => {
              setPayableTypeFilter(e.target.value);
              setPage(1);
            }}
            style={{ width: "100%", fontSize: "0.85rem" }}
          >
            <option value="">{isRTL ? "جميع الجهات" : "All Payables"}</option>
            <option value="Appointment">
              {isRTL ? "حجوزات المواعيد" : "Appointments"}
            </option>
            <option value="Subscription">
              {isRTL ? "اشتراكات الباقات" : "Subscriptions"}
            </option>
          </select>
        </div>

        {(searchQuery || statusFilter || payableTypeFilter || typeFilter) && (
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => {
              setSearchQuery("");
              setStatusFilter("");
              setPayableTypeFilter("");
              setTypeFilter("");
              setPage(1);
            }}
            style={{
              fontSize: "0.8rem",
              padding: "6px 12px",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Icon name="x" size={14} />
            {isRTL ? "إلغاء التصفية" : "Clear Filters"}
          </button>
        )}
      </div>

      {/* Payments View */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <SkeletonRect height={48} />
          <SkeletonRect height={54} />
          <SkeletonRect height={54} />
        </div>
      ) : !Array.isArray(payments) || payments.length === 0 ? (
        <div
          style={{
            padding: "48px 20px",
            textAlign: "center",
            background: "var(--surface-alt)",
            borderRadius: 12,
            border: "1px dashed var(--border-light)",
          }}
        >
          <Icon
            name="credit-card"
            size={32}
            style={{ color: "var(--muted)", margin: "0 auto 12px" }}
          />
          <h4
            style={{
              margin: "0 0 6px",
              fontSize: "1rem",
              fontWeight: 700,
              color: "var(--heading)",
            }}
          >
            {isRTL
              ? "لا توجد سجلات مدفوعات مطابقة"
              : "No matching payment records found"}
          </h4>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="table-responsive payments-desktop-table">
            <table
              className="table"
              style={{ width: "100%", fontSize: "0.88rem" }}
            >
              <thead>
                <tr>
                  <th>#</th>
                  <th>{isRTL ? "المستحق له" : "Payable"}</th>
                  <th>{t("typeFilterLabel")}</th>
                  <th>{isRTL ? "المبلغ" : "Amount"}</th>
                  <th>{isRTL ? "وسيلة الدفع" : "Method / Provider"}</th>
                  <th>{isRTL ? "الحالة" : "Status"}</th>
                  <th>{isRTL ? "التاريخ" : "Date"}</th>
                  <th style={{ textAlign: "center" }}>
                    {isRTL ? "الإجراءات" : "Actions"}
                  </th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => {
                  const badge = getStatusBadge(p.status);
                  const isSub = p.payable_type?.includes("Subscription");
                  const isCredit =
                    p.type === "credit" ||
                    (!p.type && !isSub && p.status !== "refunded");
                  return (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 700 }}>#{p.id}</td>
                      <td>
                        <span
                          style={{
                            fontWeight: 700,
                            color: "var(--heading)",
                            display: "block",
                          }}
                        >
                          {isSub
                            ? isRTL
                              ? "اشتراك مساحة العمل"
                              : "Workspace Subscription"
                            : isRTL
                              ? "حجز موعد"
                              : "Appointment Booking"}
                        </span>
                        <span
                          style={{
                            fontSize: "0.78rem",
                            color: "var(--text-secondary)",
                          }}
                        >
                          ID: {p.payable_id}
                        </span>
                      </td>
                      <td>
                        <span
                          style={{
                            padding: "4px 10px",
                            borderRadius: 14,
                            fontSize: "0.75rem",
                            fontWeight: 800,
                            color: isCredit ? "#15803d" : "#b91c1c",
                            background: isCredit ? "#dcfce7" : "#fee2e2",
                            border: `1px solid ${isCredit ? "#bbf7d0" : "#fecaca"}`,
                            display: "inline-block",
                          }}
                        >
                          {isCredit ? t("creditBadge") : t("debitBadge")}
                        </span>
                      </td>
                      <td
                        style={{
                          fontWeight: 800,
                          color: isCredit ? "var(--primary)" : "#b91c1c",
                        }}
                      >
                        {isCredit ? "+" : "-"}
                        {p.amount} {p.currency || "SAR"}
                      </td>
                      <td>
                        <span style={{ fontWeight: 600, display: "block" }}>
                          {p.method || "bank_transfer"}
                        </span>
                        <span
                          style={{ fontSize: "0.76rem", color: "var(--muted)" }}
                        >
                          {p.provider || "manual"}
                        </span>
                      </td>
                      <td>
                        <span
                          style={{
                            padding: "4px 12px",
                            borderRadius: 20,
                            fontSize: "0.78rem",
                            fontWeight: 700,
                            color: badge.color,
                            background: badge.bg,
                            border: `1px solid ${badge.border}`,
                            display: "inline-block",
                          }}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td
                        style={{
                          fontSize: "0.82rem",
                          color: "var(--text-secondary)",
                        }}
                      >
                        {formatDate(p.created_at)}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => setSelectedPayment(p)}
                          style={{ gap: 6, fontSize: "0.8rem" }}
                        >
                          <Icon name="eye" size={14} />
                          {isRTL ? "التفاصيل / الإيصال" : "View / Verify"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards View */}
          <div className="payments-mobile-cards">
            {payments.map((p) => {
              const badge = getStatusBadge(p.status);
              const isSub = p.payable_type?.includes("Subscription");
              const isCredit =
                p.type === "credit" ||
                (!p.type && !isSub && p.status !== "refunded");
              return (
                <div key={p.id} className="payment-mobile-card">
                  <div className="payment-mobile-card-header">
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                      <span
                        style={{
                          fontWeight: 800,
                          color: "var(--heading)",
                          fontSize: "0.9rem",
                        }}
                      >
                        #{p.id}
                      </span>
                      <span
                        style={{
                          fontSize: "0.78rem",
                          fontWeight: 600,
                          color: "var(--text-secondary)",
                        }}
                      >
                        {isSub
                          ? isRTL
                            ? "اشتراك"
                            : "Subscription"
                          : isRTL
                            ? "حجز موعد"
                            : "Appointment"}{" "}
                        (ID: {p.payable_id})
                      </span>
                    </div>
                    <div
                      style={{ display: "flex", gap: 6, alignItems: "center" }}
                    >
                      <span
                        style={{
                          padding: "3px 8px",
                          borderRadius: 12,
                          fontSize: "0.72rem",
                          fontWeight: 800,
                          color: isCredit ? "#15803d" : "#b91c1c",
                          background: isCredit ? "#dcfce7" : "#fee2e2",
                        }}
                      >
                        {isCredit ? t("creditBadge") : t("debitBadge")}
                      </span>
                      <span
                        style={{
                          padding: "3px 10px",
                          borderRadius: 20,
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          color: badge.color,
                          background: badge.bg,
                          border: `1px solid ${badge.border}`,
                        }}
                      >
                        {badge.label}
                      </span>
                    </div>
                  </div>

                  <div className="payment-mobile-card-body">
                    <div>
                      <span
                        style={{
                          fontSize: "0.75rem",
                          color: "var(--muted)",
                          display: "block",
                        }}
                      >
                        {isRTL ? "المبلغ" : "Amount"}
                      </span>
                      <strong
                        style={{
                          fontSize: "0.95rem",
                          color: "var(--primary)",
                          fontWeight: 800,
                        }}
                      >
                        {p.amount} {p.currency || "SAR"}
                      </strong>
                    </div>
                    <div>
                      <span
                        style={{
                          fontSize: "0.75rem",
                          color: "var(--muted)",
                          display: "block",
                        }}
                      >
                        {isRTL ? "وسيلة الدفع" : "Method"}
                      </span>
                      <span
                        style={{
                          fontSize: "0.82rem",
                          fontWeight: 600,
                          color: "var(--heading)",
                        }}
                      >
                        {p.method || "bank_transfer"}
                      </span>
                    </div>
                    <div style={{ gridColumn: "span 2" }}>
                      <span
                        style={{
                          fontSize: "0.75rem",
                          color: "var(--muted)",
                          display: "block",
                        }}
                      >
                        {isRTL ? "التاريخ" : "Date"}
                      </span>
                      <span
                        style={{
                          fontSize: "0.82rem",
                          color: "var(--text-secondary)",
                        }}
                      >
                        {formatDate(p.created_at)}
                      </span>
                    </div>
                  </div>

                  <div className="payment-mobile-card-footer">
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => setSelectedPayment(p)}
                      style={{
                        width: "100%",
                        justifyContent: "center",
                        gap: 6,
                        fontSize: "0.82rem",
                        padding: "8px",
                      }}
                    >
                      <Icon name="eye" size={14} />
                      {isRTL ? "التفاصيل / الإيصال" : "View / Verify"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Responsive Pagination */}
          {meta && meta.last_page > 1 && (
            <div className="responsive-pagination">
              <span
                style={{ fontSize: "0.84rem", color: "var(--text-secondary)" }}
              >
                {(
                  t("paginationInfo") ||
                  (isRTL
                    ? "صفحة {current} من {last} ({total} سجل)"
                    : "Page {current} of {last} ({total} records)")
                )
                  .replace("{current}", String(meta.current_page || page))
                  .replace("{last}", String(meta.last_page))
                  .replace("{total}", String(meta.total || payments.length))}
              </span>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  disabled={(meta.current_page || page) <= 1 || loading}
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  style={{ fontSize: "0.8rem", padding: "6px 14px" }}
                >
                  {t("previous") || (isRTL ? "السابق" : "Previous")}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  disabled={
                    (meta.current_page || page) >= meta.last_page || loading
                  }
                  onClick={() => setPage((prev) => prev + 1)}
                  style={{ fontSize: "0.8rem", padding: "6px 14px" }}
                >
                  {t("next") || (isRTL ? "التالي" : "Next")}
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Details & Verification Modal */}
      {selectedPayment &&
        createPortal(
          <div className="modal-backdrop">
            <div
              className="modal-card modal-md animate-fade-in-up"
              style={{ maxWidth: 640, width: "95%" }}
            >
              <div className="modal-header">
                <h3 className="modal-title">
                  {isRTL
                    ? "تفاصيل عملية الدفع وإيصال السداد"
                    : "Payment Details & Receipt Verification"}
                </h3>
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() => setSelectedPayment(null)}
                >
                  <Icon name="x" size={16} />
                </button>
              </div>

              <div className="modal-body" style={{ gap: 16 }}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                    gap: 12,
                    background: "var(--surface-alt)",
                    padding: 14,
                    borderRadius: 12,
                  }}
                >
                  <div>
                    <span
                      style={{
                        fontSize: "0.78rem",
                        color: "var(--muted)",
                        display: "block",
                      }}
                    >
                      {isRTL ? "المبلغ" : "Amount"}
                    </span>
                    <strong
                      style={{ fontSize: "1.25rem", color: "var(--primary)" }}
                    >
                      {selectedPayment.amount}{" "}
                      {selectedPayment.currency || "SAR"}
                    </strong>
                  </div>
                  <div>
                    <span
                      style={{
                        fontSize: "0.78rem",
                        color: "var(--muted)",
                        display: "block",
                      }}
                    >
                      {isRTL ? "الحالة الحالية" : "Current Status"}
                    </span>
                    <strong
                      style={{
                        color: getStatusBadge(selectedPayment.status).color,
                      }}
                    >
                      {getStatusBadge(selectedPayment.status).label}
                    </strong>
                  </div>
                </div>

                {selectedPayment.proof_notes && (
                  <div
                    style={{
                      padding: 12,
                      borderRadius: 8,
                      background: "rgba(234, 179, 8, 0.08)",
                      border: "1px solid rgba(234, 179, 8, 0.25)",
                    }}
                  >
                    <strong
                      style={{
                        fontSize: "0.82rem",
                        color: "#b45309",
                        display: "block",
                        marginBottom: 2,
                      }}
                    >
                      📝{" "}
                      {isRTL ? "ملاحظات المحوّل / الإيصال:" : "Transfer Notes:"}
                    </strong>
                    <span
                      style={{ fontSize: "0.86rem", color: "var(--heading)" }}
                    >
                      {selectedPayment.proof_notes}
                    </span>
                  </div>
                )}

                {selectedPayment.proof_file ? (
                  <div
                    style={{
                      border: "1px solid var(--border-light)",
                      borderRadius: 10,
                      overflow: "hidden",
                      background: "#0f172a",
                    }}
                  >
                    <div
                      style={{
                        padding: "8px 12px",
                        background: "rgba(255,255,255,0.05)",
                        color: "#fff",
                        fontSize: "0.8rem",
                        fontWeight: 700,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <span>
                        📷{" "}
                        {isRTL
                          ? "صورة إيصال التحويل"
                          : "Attached Receipt Proof"}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setLightboxImage(selectedPayment.proof_file)
                        }
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "#38bdf8",
                          cursor: "pointer",
                          fontWeight: 700,
                          fontSize: "0.8rem",
                        }}
                      >
                        {isRTL ? "تكبير" : "Enlarge"}
                      </button>
                    </div>
                    <div
                      style={{
                        padding: 12,
                        textAlign: "center",
                        maxHeight: 240,
                        overflow: "hidden",
                        cursor: "pointer",
                      }}
                      onClick={() =>
                        setLightboxImage(selectedPayment.proof_file)
                      }
                    >
                      <img
                        src={selectedPayment.proof_file}
                        alt="Receipt Proof"
                        style={{
                          maxWidth: "100%",
                          maxHeight: 220,
                          objectFit: "contain",
                          borderRadius: 6,
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  <div
                    style={{
                      padding: 14,
                      background: "var(--surface-alt)",
                      borderRadius: 8,
                      textAlign: "center",
                      border: "1px dashed var(--border-light)",
                    }}
                  >
                    <span
                      style={{ fontSize: "0.84rem", color: "var(--muted)" }}
                    >
                      {isRTL
                        ? "لم يتم إرفاق ملف إيصال سداد"
                        : "No receipt file attached"}
                    </span>
                  </div>
                )}

                {selectedPayment.status !== "paid" && (
                  <div
                    style={{
                      borderTop: "1px solid var(--border-light)",
                      paddingTop: 14,
                      marginTop: 4,
                    }}
                  >
                    <label
                      className="form-label"
                      style={{
                        fontSize: "0.84rem",
                        fontWeight: 700,
                        marginBottom: 6,
                        display: "block",
                      }}
                    >
                      {isRTL
                        ? "سبب الرفض (في حالة عدم الاعتماد)"
                        : "Rejection Reason (if rejecting)"}
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder={
                        isRTL
                          ? "مثال: رقم الحساب أو إيصال التحويل غير مطبق"
                          : "Reason for rejection..."
                      }
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                    />
                  </div>
                )}
              </div>

              <div
                className="modal-actions"
                style={{
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: 10,
                }}
              >
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setSelectedPayment(null)}
                  disabled={actionLoading}
                >
                  {t("close") || (isRTL ? "إغلاق" : "Close")}
                </button>

                {selectedPayment.status !== "paid" && (
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      onClick={() => handleReject(selectedPayment)}
                      disabled={actionLoading}
                    >
                      {isRTL ? "رفض الإيصال" : "Reject Payment"}
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => handleVerify(selectedPayment)}
                      disabled={actionLoading}
                    >
                      {isRTL ? "اعتماد والدفع" : "Verify & Approve"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* Lightbox Preview */}
      {lightboxImage &&
        createPortal(
          <div
            className="modal-backdrop"
            onClick={() => setLightboxImage(null)}
            style={{ background: "rgba(0,0,0,0.85)" }}
          >
            <div
              style={{
                position: "relative",
                maxWidth: "90vw",
                maxHeight: "90vh",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={lightboxImage}
                alt="Full Receipt"
                style={{
                  maxWidth: "100%",
                  maxHeight: "85vh",
                  objectFit: "contain",
                  borderRadius: 8,
                }}
              />
              <button
                onClick={() => setLightboxImage(null)}
                style={{
                  position: "absolute",
                  top: -36,
                  right: 0,
                  background: "#fff",
                  border: "none",
                  borderRadius: "50%",
                  width: 28,
                  height: 28,
                  cursor: "pointer",
                  fontWeight: 800,
                }}
              >
                ✕
              </button>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
