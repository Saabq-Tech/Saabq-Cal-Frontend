import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { useLanguage } from "../../../context/LanguageContext";
import { useToast } from "../../../context/ToastContext";
import { usePermissions } from "../../../hooks/usePermissions";
import client, { endpoints } from "../../../api/client";
import Icon from "../../../components/common/Icon";
import ModalPortal from "../../../components/common/ModalPortal";
import CreateBookingModal from "./workspace-settings/CreateBookingModal";

export default function WorkspaceCustomersPage() {
  const { user } = useAuth();
  const { t, lang } = useLanguage();
  const toast = useToast();
  const navigate = useNavigate();
  const {
    isOwner: _isOwner,
    canCreateCustomers,
    canUpdateCustomers,
    canDeleteCustomers,
    canCreateBookings,
  } = usePermissions();

  const workspace = user?.workspace;

  // Dynamic Workspace Customer Terminology & Icon
  const getCustomerLabel = (type = "plural") => {
    const field =
      type === "singular" ? "customer_label_singular" : "customer_label_plural";
    if (workspace && workspace[field]) {
      if (typeof workspace[field] === "object") {
        return (
          workspace[field][lang] ||
          workspace[field].ar ||
          workspace[field].en ||
          (type === "singular" ? "عميل" : "العملاء")
        );
      }
      return workspace[field];
    }
    return type === "singular"
      ? t("customerSingle") || "عميل"
      : t("navCustomers") || "العملاء";
  };

  const customerPlural = getCustomerLabel("plural");
  const customerSingular = getCustomerLabel("singular");
  const customerIcon = workspace?.customer_icon || "users";

  // State
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("latest");
  const [viewMode, setViewMode] = useState("table"); // 'table' | 'cards'
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    total: 0,
  });

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // Form State for Add / Edit
  const [customerForm, setCustomerForm] = useState({
    name: "",
    email: "",
    phone: "",
    gender: "male",
    date_of_birth: "",
    customer_reference: "",
    status: "active",
    internal_notes: "",
    metadata: {},
  });
  const [savingCustomer, setSavingCustomer] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  // Fetch Customers
  const fetchCustomers = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const res = await client.get(endpoints.workspaceCustomers, {
          params: {
            page,
            search: search.trim() || undefined,
            status: statusFilter !== "all" ? statusFilter : undefined,
            sort_by: sortBy,
            per_page: 15,
          },
        });

        const data = res.data?.data || [];
        setCustomers(Array.isArray(data) ? data : []);
        setPagination({
          current_page:
            res.data?.meta?.current_page || res.data?.current_page || 1,
          last_page: res.data?.meta?.last_page || res.data?.last_page || 1,
          total:
            res.data?.meta?.total || (Array.isArray(data) ? data.length : 0),
        });
      } catch (err) {
        console.error("Failed to fetch customers:", err);
        toast.show(
          t("errorLoadingData") ||
            `حدث خطأ أثناء تحميل قائمة ${customerPlural}`,
          "error",
        );
      } finally {
        setLoading(false);
      }
    },
    [search, statusFilter, sortBy, t, toast, customerPlural],
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCustomers(1);
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchCustomers]);

  // Handle Open Add Modal
  const handleOpenAdd = () => {
    setCustomerForm({
      name: "",
      email: "",
      phone: "",
      gender: "male",
      date_of_birth: "",
      customer_reference: "",
      status: "active",
      internal_notes: "",
      metadata: {},
    });
    setFormErrors({});
    setIsAddModalOpen(true);
  };

  // Handle Open Edit Modal
  const handleOpenEdit = (cust, e) => {
    if (e) e.stopPropagation();
    setSelectedCustomer(cust);
    const pivot = cust.workspace_customer || {};
    setCustomerForm({
      name: cust.name || "",
      email: cust.email || "",
      phone: cust.phone || "",
      gender: cust.gender || "male",
      date_of_birth: cust.date_of_birth || "",
      customer_reference: pivot.customer_reference || "",
      status: pivot.status || cust.status || "active",
      internal_notes: pivot.internal_notes || cust.notes || "",
      metadata: pivot.metadata || {},
    });
    setFormErrors({});
    setIsEditModalOpen(true);
  };

  // Handle Save (Add or Update)
  const handleSaveCustomer = async (isEdit = false) => {
    setSavingCustomer(true);
    setFormErrors({});
    try {
      if (isEdit && selectedCustomer) {
        await client.put(
          endpoints.workspaceCustomerItem(selectedCustomer.id),
          customerForm,
        );
        toast.show(
          t("customerUpdatedSuccess") ||
            `تم تحديث بيانات ${customerSingular} بنجاح`,
          "success",
        );
        setIsEditModalOpen(false);
      } else {
        await client.post(endpoints.workspaceCustomers, customerForm);
        toast.show(
          t("customerCreatedSuccess") || `تم إضافة ${customerSingular} بنجاح`,
          "success",
        );
        setIsAddModalOpen(false);
      }
      fetchCustomers(pagination.current_page);
    } catch (err) {
      if (err.response?.status === 422 && err.response?.data?.errors) {
        setFormErrors(err.response.data.errors);
      } else {
        toast.show(
          err.response?.data?.message ||
            t("errorSavingData") ||
            "حدث خطأ أثناء حفظ البيانات",
          "error",
        );
      }
    } finally {
      setSavingCustomer(false);
    }
  };

  // Handle Delete / Unlink
  const handleDeleteCustomer = async () => {
    if (!selectedCustomer) return;
    try {
      await client.delete(endpoints.workspaceCustomerItem(selectedCustomer.id));
      toast.show(
        t("customerDeletedSuccess") || `تم فك ارتباط ${customerSingular} بنجاح`,
        "success",
      );
      setIsDeleteModalOpen(false);
      fetchCustomers(pagination.current_page);
    } catch (err) {
      toast.show(
        err.response?.data?.message ||
          t("errorDeletingData") ||
          "حدث خطأ أثناء الحذف",
        "error",
      );
    }
  };

  // Quick Book Trigger
  const handleQuickBook = (cust, e) => {
    if (e) e.stopPropagation();
    setSelectedCustomer(cust);
    setIsBookingModalOpen(true);
  };

  // Quick WhatsApp Link
  const getWhatsAppUrl = (phone) => {
    if (!phone) return null;
    const cleanNumber = phone.replace(/[^0-9]/g, "");
    return `https://wa.me/${cleanNumber}`;
  };

  // Stats calculation
  const totalCount = pagination.total || customers.length;
  const activeCount = customers.filter(
    (c) =>
      (c.workspace_customer?.status || c.status) === "active" ||
      (c.workspace_customer?.status || c.status) === "vip",
  ).length;
  const vipCount = customers.filter(
    (c) => (c.workspace_customer?.status || c.status) === "vip",
  ).length;
  const totalBookingsSum = customers.reduce(
    (acc, c) =>
      acc +
      (c.appointments_count || c.workspace_customer?.total_appointments || 0),
    0,
  );

  return (
    <div
      className="workspace-customers-page animate-fade-in"
      style={{ padding: "0 4px" }}
    >
      {/* Header Section */}
      <div
        className="page-header"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: "var(--radius-lg, 14px)",
              background:
                "linear-gradient(135deg, var(--primary), var(--primary-hover, #0389A5))",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 8px 20px -4px rgba(2, 105, 130, 0.35)",
            }}
          >
            <Icon name={customerIcon} size={28} />
          </div>
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: "1.6rem",
                fontWeight: 800,
                color: "var(--heading)",
                letterSpacing: "-0.02em",
              }}
            >
              {(t("managePrefix") || "إدارة") + " " + customerPlural}
            </h1>
            <p
              style={{
                margin: "4px 0 0 0",
                fontSize: "0.88rem",
                color: "var(--text-secondary)",
              }}
            >
              {t("customersSubtitle") ||
                `عرض وإدارة سجلات وملفات ${customerPlural} الخاصة بمساحة العمل والمتابعة الشاملة لمواعيدهم.`}
            </p>
          </div>
        </div>

        {canCreateCustomers && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleOpenAdd}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 20px",
              fontWeight: 700,
              borderRadius: "var(--radius-md, 10px)",
              boxShadow: "0 4px 14px rgba(2, 105, 130, 0.25)",
            }}
          >
            <Icon name="user-plus" size={18} />
            <span>
              {(t("addPrefix") || "إضافة") +
                " " +
                customerSingular +
                " " +
                (t("newSuffix") || "جديد")}
            </span>
          </button>
        )}
      </div>

      {/* KPI Stats Summary Cards */}
      <div
        className="kpi-stats-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 16,
          marginBottom: 24,
        }}
      >
        {/* Stat 1: Total */}
        <div
          className="dashboard-stat-card glass-card"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-lg, 14px)",
            padding: "18px 20px",
            display: "flex",
            alignItems: "center",
            gap: 16,
            transition: "transform 0.2s ease, box-shadow 0.2s ease",
          }}
        >
          <div
            style={{
              width: 46,
              height: 46,
              borderRadius: 12,
              background: "rgba(2, 105, 130, 0.12)",
              color: "var(--primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon name={customerIcon} size={24} />
          </div>
          <div>
            <div
              style={{
                fontSize: "0.82rem",
                color: "var(--text-secondary)",
                fontWeight: 600,
              }}
            >
              {(t("totalPrefix") || "إجمالي") + " " + customerPlural}
            </div>
            <div
              style={{
                fontSize: "1.45rem",
                fontWeight: 800,
                color: "var(--heading)",
                marginTop: 2,
              }}
            >
              {totalCount}
            </div>
          </div>
        </div>

        {/* Stat 2: Active / VIP */}
        <div
          className="dashboard-stat-card glass-card"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-lg, 14px)",
            padding: "18px 20px",
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          <div
            style={{
              width: 46,
              height: 46,
              borderRadius: 12,
              background: "rgba(16, 185, 129, 0.12)",
              color: "#10b981",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon name="star" size={24} />
          </div>
          <div>
            <div
              style={{
                fontSize: "0.82rem",
                color: "var(--text-secondary)",
                fontWeight: 600,
              }}
            >
              {customerPlural +
                " " +
                (t("activeAndVipSuffix") || "النشطون والمميزون")}
            </div>
            <div
              style={{
                fontSize: "1.45rem",
                fontWeight: 800,
                color: "#10b981",
                marginTop: 2,
              }}
            >
              {activeCount}{" "}
              {vipCount > 0 && (
                <span
                  style={{
                    fontSize: "0.85rem",
                    color: "#f59e0b",
                    fontWeight: 600,
                  }}
                >
                  ({vipCount} VIP)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Stat 3: Total Bookings */}
        <div
          className="dashboard-stat-card glass-card"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-lg, 14px)",
            padding: "18px 20px",
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          <div
            style={{
              width: 46,
              height: 46,
              borderRadius: 12,
              background: "rgba(99, 102, 241, 0.12)",
              color: "#6366f1",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon name="calendar" size={24} />
          </div>
          <div>
            <div
              style={{
                fontSize: "0.82rem",
                color: "var(--text-secondary)",
                fontWeight: 600,
              }}
            >
              {t("totalBookingsCount") || "إجمالي المواعيد"}
            </div>
            <div
              style={{
                fontSize: "1.45rem",
                fontWeight: 800,
                color: "var(--heading)",
                marginTop: 2,
              }}
            >
              {totalBookingsSum}
            </div>
          </div>
        </div>
      </div>

      {/* Search, Filter & Controls Toolbar */}
      <div
        className="customers-toolbar glass-card"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg, 14px)",
          padding: "16px 20px",
          marginBottom: 20,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 14,
        }}
      >
        {/* Search Bar */}
        <div
          style={{
            position: "relative",
            flex: "1 1 280px",
            maxWidth: 420,
          }}
        >
          <Icon
            name="search"
            size={18}
            style={{
              position: "absolute",
              top: "50%",
              transform: "translateY(-50%)",
              [lang === "ar" ? "right" : "left"]: 12,
              color: "var(--text-secondary)",
              pointerEvents: "none",
            }}
          />
          <input
            type="text"
            className="form-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={
              t("searchCustomersPlaceholder") ||
              `بحث بالاسم، الهاتف، البريد، أو رقم الملف...`
            }
            style={{
              paddingInlineStart: 38,
              height: 42,
              borderRadius: "var(--radius-md, 10px)",
              fontSize: "0.88rem",
            }}
          />
        </div>

        {/* Filters & View Modes */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          {/* Status Dropdown */}
          <select
            className="form-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              height: 42,
              minWidth: 140,
              borderRadius: 8,
              fontSize: "0.86rem",
            }}
          >
            <option value="all">
              {t("filterStatusAll") || "جميع الحالات"}
            </option>
            <option value="active">{t("filterStatusActive") || "نشط"}</option>
            <option value="vip">
              {t("filterStatusVip") || `${customerSingular} مميز (VIP)`}
            </option>
            <option value="lead">
              {t("filterStatusLead") || "محتمل / جديد"}
            </option>
            <option value="inactive">
              {t("filterStatusInactive") || "غير نشط"}
            </option>
            <option value="blocked">
              {t("filterStatusBlocked") || "محظور"}
            </option>
          </select>

          {/* Sort Dropdown */}
          <select
            className="form-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              height: 42,
              minWidth: 140,
              borderRadius: 8,
              fontSize: "0.86rem",
            }}
          >
            <option value="latest">
              {t("sortByNewest") || "الأحدث انضماماً"}
            </option>
            <option value="name">{t("sortByName") || "الاسم أبجدياً"}</option>
            <option value="appointments_count">
              {t("sortByMostBookings") || "الأكثر حجوزات"}
            </option>
            <option value="oldest">{t("sortByOldest") || "الأقدم"}</option>
          </select>

          {/* View Mode Toggle */}
          <div
            style={{
              display: "flex",
              border: "1px solid var(--border)",
              borderRadius: 8,
              overflow: "hidden",
              background: "var(--surface-alt)",
            }}
          >
            <button
              type="button"
              onClick={() => setViewMode("table")}
              title="Table View"
              style={{
                padding: "8px 12px",
                border: "none",
                background:
                  viewMode === "table" ? "var(--primary)" : "transparent",
                color:
                  viewMode === "table" ? "#ffffff" : "var(--text-secondary)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
              }}
            >
              <Icon name="clipboard-list" size={18} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("cards")}
              title="Cards View"
              style={{
                padding: "8px 12px",
                border: "none",
                background:
                  viewMode === "cards" ? "var(--primary)" : "transparent",
                color:
                  viewMode === "cards" ? "#ffffff" : "var(--text-secondary)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
              }}
            >
              <Icon name="home" size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Customers Content (Table or Cards) */}
      {loading ? (
        <div
          style={{
            textAlign: "center",
            padding: "80px 20px",
            background: "var(--surface)",
            borderRadius: "var(--radius-lg, 16px)",
            border: "1px solid var(--border)",
          }}
        >
          <div
            className="spinner"
            style={{ width: 36, height: 36, margin: "0 auto 16px" }}
          />
          <p style={{ color: "var(--text-secondary)", fontSize: "0.92rem" }}>
            {t("loading") || "جاري تحميل البيانات..."}
          </p>
        </div>
      ) : customers.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "80px 20px",
            background: "var(--surface)",
            borderRadius: "var(--radius-lg, 16px)",
            border: "1px dashed var(--border)",
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: "rgba(2, 105, 130, 0.08)",
              color: "var(--primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
            }}
          >
            <Icon name={customerIcon} size={32} />
          </div>
          <h3
            style={{
              fontSize: "1.2rem",
              fontWeight: 700,
              color: "var(--heading)",
              marginBottom: 6,
            }}
          >
            {t("noCustomersFound") || `لم يتم العثور على أي ${customerPlural}`}
          </h3>
          <p
            style={{
              color: "var(--text-secondary)",
              maxWidth: 420,
              margin: "0 auto 24px",
              fontSize: "0.88rem",
            }}
          >
            {t("noCustomersFoundDesc") ||
              `لم تتم إضافة أي ${customerPlural} حتى الآن أو مفيش نتائج مطابقة للبحث الحالي.`}
          </p>
          {canCreateCustomers && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleOpenAdd}
            >
              <Icon name="user-plus" size={16} />
              <span>
                {(t("addPrefix") || "إضافة") +
                  " " +
                  customerSingular +
                  " " +
                  (t("newSuffix") || "جديد")}
              </span>
            </button>
          )}
        </div>
      ) : viewMode === "table" ? (
        /* Table View */
        <div
          className="table-responsive glass-card"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-lg, 14px)",
            overflow: "hidden",
            boxShadow: "0 4px 16px rgba(0,0,0,0.03)",
          }}
        >
          <table
            className="table"
            style={{ width: "100%", borderCollapse: "collapse" }}
          >
            <thead>
              <tr
                style={{
                  background: "var(--surface-alt)",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                <th
                  style={{
                    padding: "14px 18px",
                    textAlign: lang === "ar" ? "right" : "left",
                    fontSize: "0.82rem",
                    color: "var(--text-secondary)",
                    fontWeight: 700,
                  }}
                >
                  {customerSingular}
                </th>
                <th
                  style={{
                    padding: "14px 18px",
                    textAlign: lang === "ar" ? "right" : "left",
                    fontSize: "0.82rem",
                    color: "var(--text-secondary)",
                    fontWeight: 700,
                  }}
                >
                  {t("customerFileNo") || "رقم الملف / المرجع"}
                </th>
                <th
                  style={{
                    padding: "14px 18px",
                    textAlign: lang === "ar" ? "right" : "left",
                    fontSize: "0.82rem",
                    color: "var(--text-secondary)",
                    fontWeight: 700,
                  }}
                >
                  {t("contactInfo") || "معلومات التواصل"}
                </th>
                <th
                  style={{
                    padding: "14px 18px",
                    textAlign: "center",
                    fontSize: "0.82rem",
                    color: "var(--text-secondary)",
                    fontWeight: 700,
                  }}
                >
                  {t("totalBookingsCount") || "المواعيد"}
                </th>
                <th
                  style={{
                    padding: "14px 18px",
                    textAlign: "center",
                    fontSize: "0.82rem",
                    color: "var(--text-secondary)",
                    fontWeight: 700,
                  }}
                >
                  {t("status") || "الحالة"}
                </th>
                <th
                  style={{
                    padding: "14px 18px",
                    textAlign: "center",
                    fontSize: "0.82rem",
                    color: "var(--text-secondary)",
                    fontWeight: 700,
                  }}
                >
                  {t("actions") || "الإجراءات"}
                </th>
              </tr>
            </thead>
            <tbody>
              {customers.map((cust) => {
                const pivot = cust.workspace_customer || {};
                const status = pivot.status || cust.status || "active";
                const isVip = status === "vip";
                const isBlocked = status === "blocked";
                const bookingsCount =
                  cust.appointments_count ?? pivot.total_appointments ?? 0;

                return (
                  <tr
                    key={cust.id}
                    onClick={() =>
                      navigate(`/member/workspace/customers/${cust.id}`)
                    }
                    style={{
                      borderBottom: "1px solid var(--border-light, #f1f5f9)",
                      cursor: "pointer",
                      transition: "background 0.15s ease",
                    }}
                    className="customer-table-row"
                  >
                    {/* Customer Info & Avatar */}
                    <td style={{ padding: "14px 18px" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                        }}
                      >
                        <div
                          style={{
                            width: 42,
                            height: 42,
                            borderRadius: "50%",
                            background: isVip
                              ? "linear-gradient(135deg, #f59e0b, #d97706)"
                              : "linear-gradient(135deg, var(--primary), var(--primary-hover, #0389A5))",
                            color: "#ffffff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 700,
                            fontSize: "1rem",
                            flexShrink: 0,
                            boxShadow: isVip
                              ? "0 0 12px rgba(245, 158, 11, 0.4)"
                              : "none",
                          }}
                        >
                          {cust.name ? cust.name.charAt(0).toUpperCase() : "C"}
                        </div>
                        <div>
                          <div
                            style={{
                              fontWeight: 700,
                              fontSize: "0.94rem",
                              color: "var(--heading)",
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                            }}
                          >
                            <span>{cust.name}</span>
                            {isVip && (
                              <span
                                style={{
                                  fontSize: "0.68rem",
                                  padding: "2px 6px",
                                  borderRadius: 12,
                                  background: "var(--badge-warning-bg)",
                                  color: "var(--badge-warning-color)",
                                  border:
                                    "1px solid var(--badge-warning-border)",
                                  fontWeight: 800,
                                }}
                              >
                                VIP
                              </span>
                            )}
                          </div>
                          <div
                            style={{
                              fontSize: "0.78rem",
                              color: "var(--text-secondary)",
                              marginTop: 2,
                            }}
                          >
                            {cust.gender === "female"
                              ? t("genderFemale") || "أنثى"
                              : t("genderMale") || "ذكر"}
                            {cust.date_of_birth && ` • ${cust.date_of_birth}`}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* File / Reference Number */}
                    <td style={{ padding: "14px 18px" }}>
                      {pivot.customer_reference ? (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            padding: "3px 8px",
                            borderRadius: 6,
                            background: "var(--surface-alt)",
                            border: "1px solid var(--border)",
                            fontWeight: 700,
                            fontSize: "0.82rem",
                            color: "var(--heading)",
                          }}
                        >
                          <Icon name="tag" size={12} />
                          {pivot.customer_reference}
                        </span>
                      ) : (
                        <span
                          style={{
                            color: "var(--text-muted, #94a3b8)",
                            fontSize: "0.8rem",
                          }}
                        >
                          —
                        </span>
                      )}
                    </td>

                    {/* Contact Info & Direct Shortcuts */}
                    <td
                      style={{ padding: "14px 18px" }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 4,
                        }}
                      >
                        {cust.phone && (
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                            }}
                          >
                            <a
                              href={`tel:${cust.phone}`}
                              style={{
                                color: "var(--heading)",
                                fontSize: "0.85rem",
                                textDecoration: "none",
                                fontWeight: 600,
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 4,
                              }}
                            >
                              <Icon
                                name="phone"
                                size={13}
                                style={{ color: "var(--primary)" }}
                              />
                              <span dir="ltr">{cust.phone}</span>
                            </a>
                            {getWhatsAppUrl(cust.phone) && (
                              <a
                                href={getWhatsAppUrl(cust.phone)}
                                target="_blank"
                                rel="noreferrer"
                                title="WhatsApp"
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  width: 22,
                                  height: 22,
                                  borderRadius: "50%",
                                  background: "#25d366",
                                  color: "#ffffff",
                                }}
                              >
                                <Icon name="message-circle" size={13} />
                              </a>
                            )}
                          </div>
                        )}
                        {cust.email && (
                          <a
                            href={`mailto:${cust.email}`}
                            style={{
                              color: "var(--text-secondary)",
                              fontSize: "0.8rem",
                              textDecoration: "none",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                            }}
                          >
                            <Icon name="mail" size={13} />
                            <span>{cust.email}</span>
                          </a>
                        )}
                      </div>
                    </td>

                    {/* Bookings Count */}
                    <td style={{ padding: "14px 18px", textAlign: "center" }}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          minWidth: 28,
                          height: 28,
                          padding: "0 8px",
                          borderRadius: 14,
                          background:
                            bookingsCount > 0
                              ? "rgba(2, 105, 130, 0.1)"
                              : "var(--surface-alt)",
                          color:
                            bookingsCount > 0
                              ? "var(--primary)"
                              : "var(--text-secondary)",
                          fontWeight: 700,
                          fontSize: "0.85rem",
                        }}
                      >
                        {bookingsCount}
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td style={{ padding: "14px 18px", textAlign: "center" }}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 5,
                          padding: "4px 10px",
                          borderRadius: 12,
                          fontSize: "0.76rem",
                          fontWeight: 700,
                          background:
                            status === "active"
                              ? "rgba(16, 185, 129, 0.12)"
                              : isVip
                                ? "rgba(245, 158, 11, 0.12)"
                                : isBlocked
                                  ? "rgba(239, 68, 68, 0.12)"
                                  : "var(--surface-alt)",
                          color:
                            status === "active"
                              ? "#10b981"
                              : isVip
                                ? "#d97706"
                                : isBlocked
                                  ? "#ef4444"
                                  : "var(--text-secondary)",
                        }}
                      >
                        <span
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            background: "currentColor",
                          }}
                        />
                        {status === "active"
                          ? t("filterStatusActive") || "نشط"
                          : isVip
                            ? "VIP"
                            : status === "lead"
                              ? t("filterStatusLead") || "محتمل"
                              : isBlocked
                                ? t("filterStatusBlocked") || "محظور"
                                : t("filterStatusInactive") || "غير نشط"}
                      </span>
                    </td>

                    {/* Action Buttons */}
                    <td
                      style={{ padding: "14px 18px", textAlign: "center" }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        {canCreateBookings && (
                          <button
                            type="button"
                            onClick={(e) => handleQuickBook(cust, e)}
                            className="btn btn-secondary"
                            title={
                              t("bookAppointmentForCustomer") || "حجز موعد"
                            }
                            style={{
                              padding: "6px 10px",
                              fontSize: "0.78rem",
                              borderRadius: 6,
                            }}
                          >
                            <Icon name="calendar" size={14} />
                          </button>
                        )}
                        <Link
                          to={`/member/workspace/customers/${cust.id}`}
                          className="btn btn-secondary"
                          title={t("viewCustomerProfile") || "عرض الملف"}
                          style={{
                            padding: "6px 10px",
                            fontSize: "0.78rem",
                            borderRadius: 6,
                          }}
                        >
                          <Icon name="eye" size={14} />
                        </Link>
                        {canUpdateCustomers && (
                          <button
                            type="button"
                            onClick={(e) => handleOpenEdit(cust, e)}
                            className="btn btn-secondary"
                            title={t("editCustomerBtn") || "تعديل"}
                            style={{
                              padding: "6px 10px",
                              fontSize: "0.78rem",
                              borderRadius: 6,
                            }}
                          >
                            <Icon name="edit-2" size={14} />
                          </button>
                        )}
                        {canDeleteCustomers && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCustomer(cust);
                              setIsDeleteModalOpen(true);
                            }}
                            className="btn btn-secondary"
                            title={t("deleteCustomerBtn") || "حذف"}
                            style={{
                              padding: "6px 10px",
                              fontSize: "0.78rem",
                              borderRadius: 6,
                              color: "#ef4444",
                            }}
                          >
                            <Icon name="trash-2" size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* Grid Card View */
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 16,
          }}
        >
          {customers.map((cust) => {
            const pivot = cust.workspace_customer || {};
            const status = pivot.status || cust.status || "active";
            const isVip = status === "vip";
            const bookingsCount =
              cust.appointments_count ?? pivot.total_appointments ?? 0;

            return (
              <div
                key={cust.id}
                onClick={() =>
                  navigate(`/member/workspace/customers/${cust.id}`)
                }
                className="customer-card glass-card"
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-lg, 14px)",
                  padding: 20,
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  position: "relative",
                  transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                }}
              >
                <div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      marginBottom: 14,
                    }}
                  >
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 12 }}
                    >
                      <div
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: "50%",
                          background: isVip
                            ? "linear-gradient(135deg, #f59e0b, #d97706)"
                            : "linear-gradient(135deg, var(--primary), var(--primary-hover, #0389A5))",
                          color: "#ffffff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 800,
                          fontSize: "1.1rem",
                        }}
                      >
                        {cust.name ? cust.name.charAt(0).toUpperCase() : "C"}
                      </div>
                      <div>
                        <div
                          style={{
                            fontWeight: 800,
                            fontSize: "1rem",
                            color: "var(--heading)",
                          }}
                        >
                          {cust.name}
                        </div>
                        {pivot.customer_reference && (
                          <div
                            style={{
                              fontSize: "0.76rem",
                              color: "var(--primary)",
                              fontWeight: 700,
                              marginTop: 2,
                            }}
                          >
                            #{pivot.customer_reference}
                          </div>
                        )}
                      </div>
                    </div>

                    <span
                      style={{
                        padding: "3px 8px",
                        borderRadius: 10,
                        fontSize: "0.72rem",
                        fontWeight: 700,
                        background: isVip
                          ? "var(--badge-warning-bg)"
                          : "var(--primary-subtle)",
                        color: isVip
                          ? "var(--badge-warning-color)"
                          : "var(--primary)",
                        border: isVip
                          ? "1px solid var(--badge-warning-border)"
                          : "none",
                      }}
                    >
                      {isVip ? "VIP" : status}
                    </span>
                  </div>

                  {/* Contact Snippets */}
                  <div
                    style={{
                      fontSize: "0.82rem",
                      color: "var(--text-secondary)",
                      display: "flex",
                      flexDirection: "column",
                      gap: 6,
                      marginBottom: 16,
                    }}
                  >
                    {cust.phone && (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <Icon
                          name="phone"
                          size={14}
                          style={{ color: "var(--primary)" }}
                        />
                        <span dir="ltr">{cust.phone}</span>
                      </div>
                    )}
                    {cust.email && (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <Icon
                          name="mail"
                          size={14}
                          style={{ color: "var(--text-secondary)" }}
                        />
                        <span
                          style={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {cust.email}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Metrics & Actions */}
                <div
                  style={{
                    paddingTop: 12,
                    borderTop: "1px solid var(--border-light, #f1f5f9)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <span
                    style={{
                      fontSize: "0.8rem",
                      color: "var(--text-secondary)",
                    }}
                  >
                    <strong>{bookingsCount}</strong>{" "}
                    {t("navBookings") || "مواعيد"}
                  </span>
                  <div style={{ display: "flex", gap: 6 }}>
                    {canCreateBookings && (
                      <button
                        type="button"
                        onClick={(e) => handleQuickBook(cust, e)}
                        className="btn btn-secondary"
                        style={{ padding: "5px 10px", fontSize: "0.76rem" }}
                      >
                        <Icon name="calendar" size={13} />
                      </button>
                    )}
                    <Link
                      to={`/member/workspace/customers/${cust.id}`}
                      className="btn btn-primary"
                      style={{ padding: "5px 12px", fontSize: "0.76rem" }}
                    >
                      {t("viewCustomerProfile") || "الملف"}
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {pagination.last_page > 1 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            marginTop: 24,
          }}
        >
          <button
            type="button"
            className="btn btn-secondary"
            disabled={pagination.current_page <= 1}
            onClick={() => fetchCustomers(pagination.current_page - 1)}
            style={{ padding: "6px 14px", fontSize: "0.85rem" }}
          >
            {t("previous") || "السابق"}
          </button>
          <span
            style={{
              fontSize: "0.85rem",
              color: "var(--text-secondary)",
              fontWeight: 600,
            }}
          >
            {pagination.current_page} / {pagination.last_page}
          </span>
          <button
            type="button"
            className="btn btn-secondary"
            disabled={pagination.current_page >= pagination.last_page}
            onClick={() => fetchCustomers(pagination.current_page + 1)}
            style={{ padding: "6px 14px", fontSize: "0.85rem" }}
          >
            {t("next") || "التالي"}
          </button>
        </div>
      )}

      {/* Add / Edit Customer Modal */}
      {(isAddModalOpen || isEditModalOpen) && (
        <ModalPortal>
          <div
            className="modal-overlay animate-fade-in"
            onClick={() => {
              setIsAddModalOpen(false);
              setIsEditModalOpen(false);
            }}
          >
            <div
              className="modal-container glass-card animate-scale-in"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-lg, 16px)",
                width: "100%",
                maxWidth: 580,
                maxHeight: "90vh",
                overflowY: "auto",
                padding: 24,
                boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 20,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      background: "rgba(2, 105, 130, 0.1)",
                      color: "var(--primary)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Icon
                      name={isEditModalOpen ? "edit-2" : "user-plus"}
                      size={20}
                    />
                  </div>
                  <h3
                    style={{
                      margin: 0,
                      fontSize: "1.2rem",
                      fontWeight: 800,
                      color: "var(--heading)",
                    }}
                  >
                    {isEditModalOpen
                      ? `${t("editPrefix") || "تعديل بيانات"} ${customerSingular}`
                      : `${t("addPrefix") || "إضافة"} ${customerSingular} ${t("newSuffix") || "جديد"}`}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setIsEditModalOpen(false);
                  }}
                  style={{
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--text-secondary)",
                    padding: 4,
                  }}
                >
                  <Icon name="x" size={20} />
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSaveCustomer(isEditModalOpen);
                }}
              >
                {/* Row 1: Name & Reference */}
                <div
                  className="form-row"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 14,
                    marginBottom: 14,
                  }}
                >
                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 700 }}>
                      {t("fullName") || "الاسم الكامل"} *
                    </label>
                    <input
                      type="text"
                      className={`form-input ${formErrors.name ? "input-error" : ""}`}
                      value={customerForm.name}
                      onChange={(e) =>
                        setCustomerForm({
                          ...customerForm,
                          name: e.target.value,
                        })
                      }
                      placeholder={
                        lang === "ar"
                          ? "مثال: د. أحمد خالد"
                          : "e.g. Dr. Ahmed Khaled"
                      }
                      required
                    />
                    {formErrors.name && (
                      <div className="form-error-msg">{formErrors.name[0]}</div>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      {t("customerFileNo") || "رقم الملف / المرجع"}
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={customerForm.customer_reference}
                      onChange={(e) =>
                        setCustomerForm({
                          ...customerForm,
                          customer_reference: e.target.value,
                        })
                      }
                      placeholder={
                        lang === "ar"
                          ? "مثال: #MED-4091 أو #STU-102"
                          : "e.g. #MED-4091 or #STU-102"
                      }
                    />
                  </div>
                </div>

                {/* Row 2: Email & Phone */}
                <div
                  className="form-row"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 14,
                    marginBottom: 14,
                  }}
                >
                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 700 }}>
                      {t("email") || "البريد الإلكتروني"} *
                    </label>
                    <input
                      type="email"
                      className={`form-input ${formErrors.email ? "input-error" : ""}`}
                      value={customerForm.email}
                      onChange={(e) =>
                        setCustomerForm({
                          ...customerForm,
                          email: e.target.value,
                        })
                      }
                      placeholder="name@example.com"
                      required
                    />
                    {formErrors.email && (
                      <div className="form-error-msg">
                        {formErrors.email[0]}
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      {t("phone") || "رقم الهاتف"}
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={customerForm.phone}
                      onChange={(e) =>
                        setCustomerForm({
                          ...customerForm,
                          phone: e.target.value,
                        })
                      }
                      placeholder="+20 10 1234 5678"
                      dir="ltr"
                    />
                  </div>
                </div>

                {/* Row 3: Gender, Date of Birth & Status */}
                <div
                  className="form-row"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr",
                    gap: 14,
                    marginBottom: 14,
                  }}
                >
                  <div className="form-group">
                    <label className="form-label">
                      {t("customerGender") || "الجنس"}
                    </label>
                    <select
                      className="form-select"
                      value={customerForm.gender || "male"}
                      onChange={(e) =>
                        setCustomerForm({
                          ...customerForm,
                          gender: e.target.value,
                        })
                      }
                    >
                      <option value="male">{t("genderMale") || "ذكر"}</option>
                      <option value="female">
                        {t("genderFemale") || "أنثى"}
                      </option>
                      <option value="other">{t("other") || "آخر"}</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      {t("customerDob") || "تاريخ الميلاد"}
                    </label>
                    <input
                      type="date"
                      className="form-input"
                      value={customerForm.date_of_birth}
                      onChange={(e) =>
                        setCustomerForm({
                          ...customerForm,
                          date_of_birth: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      {t("status") || "الحالة"}
                    </label>
                    <select
                      className="form-select"
                      value={customerForm.status || "active"}
                      onChange={(e) =>
                        setCustomerForm({
                          ...customerForm,
                          status: e.target.value,
                        })
                      }
                    >
                      <option value="active">
                        {t("filterStatusActive") || "نشط"}
                      </option>
                      <option value="vip">
                        {t("filterStatusVip") ||
                          `${customerSingular} مميز (VIP)`}
                      </option>
                      <option value="lead">
                        {t("filterStatusLead") || "محتمل / جديد"}
                      </option>
                      <option value="inactive">
                        {t("filterStatusInactive") || "غير نشط"}
                      </option>
                      <option value="blocked">
                        {t("filterStatusBlocked") || "محظور"}
                      </option>
                    </select>
                  </div>
                </div>

                {/* Row 4: Internal Staff Notes */}
                <div className="form-group" style={{ marginBottom: 20 }}>
                  <label className="form-label">
                    {t("internalNotes") || "ملاحظات سرية لفريق العمل"}
                  </label>
                  <textarea
                    className="form-input"
                    rows={3}
                    value={customerForm.internal_notes}
                    onChange={(e) =>
                      setCustomerForm({
                        ...customerForm,
                        internal_notes: e.target.value,
                      })
                    }
                    placeholder={
                      t("internalNotesPlaceholder") ||
                      `أضف ملاحظات خاصة أو تعليمات داخلية عن هذا ${customerSingular}...`
                    }
                  />
                </div>

                {/* Action Buttons */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-end",
                    gap: 10,
                  }}
                >
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setIsAddModalOpen(false);
                      setIsEditModalOpen(false);
                    }}
                    disabled={savingCustomer}
                  >
                    {t("cancel") || "إلغاء"}
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={savingCustomer}
                  >
                    {savingCustomer
                      ? t("saving") || "جاري الحفظ..."
                      : t("saveChanges") || "حفظ البيانات"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* Delete / Unlink Confirmation Modal */}
      {isDeleteModalOpen && selectedCustomer && (
        <ModalPortal>
          <div
            className="modal-overlay animate-fade-in"
            onClick={() => setIsDeleteModalOpen(false)}
          >
            <div
              className="modal-container glass-card animate-scale-in"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-lg, 16px)",
                width: "100%",
                maxWidth: 440,
                padding: 24,
                textAlign: "center",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: "50%",
                  background: "rgba(239, 68, 68, 0.12)",
                  color: "#ef4444",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 16px",
                }}
              >
                <Icon name="trash-2" size={24} />
              </div>
              <h3
                style={{
                  fontSize: "1.15rem",
                  fontWeight: 800,
                  color: "var(--heading)",
                  marginBottom: 8,
                }}
              >
                {t("confirmDeleteCustomer") ||
                  `هل أنت متأكد من حذف هذا ${customerSingular} من مساحة العمل؟`}
              </h3>
              <p
                style={{
                  fontSize: "0.85rem",
                  color: "var(--text-secondary)",
                  lineHeight: 1.5,
                  marginBottom: 20,
                }}
              >
                {t("confirmDeleteCustomerDesc") ||
                  `سيتم فك ارتباط ${customerSingular} بمساحة العمل الحالية ولن يظهر في قائمتك. سجلات المواعيد والمدفوعات السابقة ستبقى محفوظة لأغراض الأرشفة.`}
              </p>
              <div
                style={{ display: "flex", gap: 10, justifyContent: "center" }}
              >
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsDeleteModalOpen(false)}
                >
                  {t("cancel") || "إلغاء"}
                </button>
                <button
                  type="button"
                  className="btn"
                  style={{
                    background: "#ef4444",
                    color: "#ffffff",
                    border: "none",
                    fontWeight: 700,
                  }}
                  onClick={handleDeleteCustomer}
                >
                  {t("deleteCustomerBtn") || "تأكيد الحذف"}
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* Quick Booking Modal Trigger */}
      {isBookingModalOpen && selectedCustomer && (
        <CreateBookingModal
          isOpen={isBookingModalOpen}
          onClose={() => {
            setIsBookingModalOpen(false);
            setSelectedCustomer(null);
          }}
          onSuccess={() => {
            setIsBookingModalOpen(false);
            setSelectedCustomer(null);
            fetchCustomers(pagination.current_page);
          }}
          preselectedCustomer={selectedCustomer}
        />
      )}
    </div>
  );
}
