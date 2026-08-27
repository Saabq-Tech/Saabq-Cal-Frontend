import { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { useLanguage } from "../../../../context/LanguageContext";
import Icon from "../../../../components/common/Icon";
import ConfirmationModal from "./ConfirmationModal";

const defaultFormState = {
  id: null,
  name: "",
  category: "",
  description: "",
  type: "equipment",
  quantity: 0,
  unit: "piece",
  unit_price: 0,
  minimum_quantity: 0,
  capacity: 1,
  location: "",
  supplier: "",
  purchase_date: "",
  expiry_date: "",
  serial_number: "",
  notes: "",
  status: "available",
};

export default function ResourcesTab({
  resources = [],
  stats = null,
  canEdit = false,
  onSaveResource,
  onDeleteResource,
}) {
  const { t, isRTL } = useLanguage();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState(defaultFormState);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: null,
    isDanger: true,
  });

  // Compute calculated metrics if stats props missing
  const calculatedStats = useMemo(() => {
    const list = Array.isArray(resources) ? resources : [];
    if (stats) return stats;
    const total_resources = list.length;
    const total_quantity = list.reduce(
      (acc, r) => acc + (parseInt(r.quantity, 10) || 0),
      0,
    );
    const total_inventory_value = list.reduce(
      (acc, r) =>
        acc + parseFloat(r.quantity || 0) * parseFloat(r.unit_price || 0),
      0,
    );
    const low_stock_count = list.filter(
      (r) =>
        (r.quantity > 0 && r.quantity <= r.minimum_quantity) || r.is_low_stock,
    ).length;
    const out_of_stock_count = list.filter(
      (r) => r.quantity <= 0 || r.is_out_of_stock,
    ).length;

    return {
      total_resources,
      total_quantity,
      total_inventory_value,
      low_stock_count,
      out_of_stock_count,
    };
  }, [resources, stats]);

  // Unique categories list for filtering dropdown
  const categories = useMemo(() => {
    const list = Array.isArray(resources) ? resources : [];
    const set = new Set();
    list.forEach((r) => {
      if (r.category) set.add(r.category);
    });
    return Array.from(set);
  }, [resources]);

  // Low stock warning alerts list
  const lowStockAlerts = useMemo(() => {
    const list = Array.isArray(resources) ? resources : [];
    return list.filter(
      (r) =>
        (r.quantity <= r.minimum_quantity && r.minimum_quantity > 0) ||
        r.quantity <= 0 ||
        r.is_low_stock ||
        r.is_out_of_stock,
    );
  }, [resources]);

  // Filtered resources list
  const filteredResources = useMemo(() => {
    const list = Array.isArray(resources) ? resources : [];
    return list.filter((r) => {
      if (selectedCategory && r.category !== selectedCategory) return false;
      if (selectedStatus && r.status !== selectedStatus) return false;
      if (
        showLowStockOnly &&
        !(r.quantity <= r.minimum_quantity || r.quantity <= 0 || r.is_low_stock)
      ) {
        return false;
      }
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const matchName = r.name?.toLowerCase().includes(q);
        const matchCat = r.category?.toLowerCase().includes(q);
        const matchSupplier = r.supplier?.toLowerCase().includes(q);
        const matchSN = r.serial_number?.toLowerCase().includes(q);
        const matchDesc = r.description?.toLowerCase().includes(q);
        return matchName || matchCat || matchSupplier || matchSN || matchDesc;
      }
      return true;
    });
  }, [
    resources,
    selectedCategory,
    selectedStatus,
    showLowStockOnly,
    searchTerm,
  ]);

  const handleOpenCreate = () => {
    setForm(defaultFormState);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (resource) => {
    setForm({
      id: resource.id,
      name: resource.name || "",
      category: resource.category || "",
      description: resource.description || "",
      type: resource.type || "equipment",
      quantity: resource.quantity ?? 0,
      unit: resource.unit || "piece",
      unit_price: resource.unit_price ?? 0,
      minimum_quantity: resource.minimum_quantity ?? 0,
      capacity: resource.capacity || 1,
      location: resource.location || "",
      supplier: resource.supplier || "",
      purchase_date: resource.purchase_date || "",
      expiry_date: resource.expiry_date || "",
      serial_number: resource.serial_number || "",
      notes: resource.notes || "",
      status: resource.status || "available",
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (onSaveResource) {
      await onSaveResource(form);
    }
    setIsModalOpen(false);
  };

  const handleOpenDelete = (id) => {
    setConfirmModal({
      isOpen: true,
      title:
        t("confirmDeleteResource") ||
        (isRTL ? "حذف المورد" : "Delete Resource"),
      message:
        t("deleteResourceWarning") ||
        (isRTL
          ? "هل أنت متأكد من حذف هذا المورد؟ لا يمكن التراجع عن هذا الإجراء."
          : "Are you sure you want to delete this resource? This action cannot be undone."),
      isDanger: true,
      onConfirm: async () => {
        if (onDeleteResource) {
          await onDeleteResource(id);
        }
      },
    });
  };

  const formatCurrency = (val) => {
    const num = parseFloat(val) || 0;
    return num.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <div className="card-body">
      {/* Top Section Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 14,
          marginBottom: 24,
        }}
      >
        <div>
          <h2
            style={{
              fontSize: "1.3rem",
              fontWeight: 800,
              margin: 0,
              color: "var(--heading)",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Icon name="package" size={22} color="var(--primary)" />
            {t("workspaceResources") ||
              (isRTL
                ? "إدارة الموارد والمخزون"
                : "Workspace Resources & Inventory")}
          </h2>
          <p
            style={{
              fontSize: "0.88rem",
              color: "var(--text-secondary)",
              margin: "4px 0 0",
            }}
          >
            {t("workspaceResourcesDesc") ||
              (isRTL
                ? "إدارة ومتابعة معدات ومستلزمات مساحة العمل، الأسعار، حدود التنبيه الأدنى للكميات، والموردين."
                : "Manage workspace assets, equipment, pricing, low-stock threshold limits, and suppliers.")}
          </p>
        </div>
        {canEdit && (
          <button className="btn btn-primary" onClick={handleOpenCreate}>
            <Icon name="plus" size={16} />
            {t("addResource") ||
              (isRTL ? "+ إضافة مورد جديد" : "+ Add New Resource")}
          </button>
        )}
      </div>

      {/* KPI Stats Overview Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div
          style={{
            background: "var(--surface)",
            padding: "16px 20px",
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--border-light)",
            display: "flex",
            alignItems: "center",
            gap: 16,
            boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: "12px",
              background: "rgba(59, 130, 246, 0.1)",
              color: "#3b82f6",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon name="layers" size={22} />
          </div>
          <div>
            <div
              style={{
                fontSize: "0.8rem",
                color: "var(--text-secondary)",
                fontWeight: 600,
              }}
            >
              {t("totalItems") ||
                (isRTL ? "إجمالي الأثاث والمعدات" : "Total Items")}
            </div>
            <div
              style={{
                fontSize: "1.35rem",
                fontWeight: 800,
                color: "var(--heading)",
              }}
            >
              {calculatedStats.total_resources}{" "}
              <span
                style={{
                  fontSize: "0.85rem",
                  color: "var(--text-muted)",
                  fontWeight: 500,
                }}
              >
                ({calculatedStats.total_quantity} {isRTL ? "قطعة" : "units"})
              </span>
            </div>
          </div>
        </div>

        <div
          style={{
            background: "var(--surface)",
            padding: "16px 20px",
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--border-light)",
            display: "flex",
            alignItems: "center",
            gap: 16,
            boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: "12px",
              background: "rgba(16, 185, 129, 0.1)",
              color: "#10b981",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon name="dollar-sign" size={22} />
          </div>
          <div>
            <div
              style={{
                fontSize: "0.8rem",
                color: "var(--text-secondary)",
                fontWeight: 600,
              }}
            >
              {t("totalValue") ||
                (isRTL ? "القيمة الإجمالية للمخزون" : "Total Inventory Value")}
            </div>
            <div
              style={{
                fontSize: "1.35rem",
                fontWeight: 800,
                color: "var(--heading)",
              }}
            >
              ${formatCurrency(calculatedStats.total_inventory_value)}
            </div>
          </div>
        </div>

        <div
          style={{
            background:
              calculatedStats.low_stock_count > 0
                ? "rgba(245, 158, 11, 0.05)"
                : "var(--surface)",
            padding: "16px 20px",
            borderRadius: "var(--radius-lg)",
            border:
              calculatedStats.low_stock_count > 0
                ? "1px solid rgba(245, 158, 11, 0.3)"
                : "1px solid var(--border-light)",
            display: "flex",
            alignItems: "center",
            gap: 16,
            boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: "12px",
              background: "rgba(245, 158, 11, 0.15)",
              color: "#f59e0b",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon name="alert-triangle" size={22} />
          </div>
          <div>
            <div
              style={{
                fontSize: "0.8rem",
                color: "var(--text-secondary)",
                fontWeight: 600,
              }}
            >
              {t("lowStockThresholdAlerts") ||
                (isRTL ? "تنبيهات انخفاض المخزون" : "Low Stock Alerts")}
            </div>
            <div
              style={{
                fontSize: "1.35rem",
                fontWeight: 800,
                color:
                  calculatedStats.low_stock_count > 0
                    ? "#b45309"
                    : "var(--heading)",
              }}
            >
              {calculatedStats.low_stock_count}{" "}
              <span style={{ fontSize: "0.8rem", fontWeight: 600 }}>
                {isRTL ? "مواد تجاوزت الحد الأدنى" : "below threshold"}
              </span>
            </div>
          </div>
        </div>

        <div
          style={{
            background:
              calculatedStats.out_of_stock_count > 0
                ? "rgba(239, 68, 68, 0.05)"
                : "var(--surface)",
            padding: "16px 20px",
            borderRadius: "var(--radius-lg)",
            border:
              calculatedStats.out_of_stock_count > 0
                ? "1px solid rgba(239, 68, 68, 0.3)"
                : "1px solid var(--border-light)",
            display: "flex",
            alignItems: "center",
            gap: 16,
            boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: "12px",
              background: "rgba(239, 68, 68, 0.15)",
              color: "#ef4444",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon name="x-circle" size={22} />
          </div>
          <div>
            <div
              style={{
                fontSize: "0.8rem",
                color: "var(--text-secondary)",
                fontWeight: 600,
              }}
            >
              {t("outOfStockOrExpired") ||
                (isRTL ? "نفاد المخزون" : "Out of Stock")}
            </div>
            <div
              style={{
                fontSize: "1.35rem",
                fontWeight: 800,
                color:
                  calculatedStats.out_of_stock_count > 0
                    ? "#dc2626"
                    : "var(--heading)",
              }}
            >
              {calculatedStats.out_of_stock_count}{" "}
              <span style={{ fontSize: "0.8rem", fontWeight: 600 }}>
                {isRTL ? "قطع منتهية/منعدمة" : "items unavailable"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Threshold Low Stock Warning Alert Banner */}
      {lowStockAlerts.length > 0 && (
        <div
          style={{
            padding: "14px 18px",
            background: "#fffbeb",
            border: "1px solid #fde68a",
            borderRadius: "var(--radius-md)",
            marginBottom: 24,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Icon name="alert-circle" size={20} color="#b45309" />
            <span
              style={{ fontSize: "0.88rem", fontWeight: 700, color: "#92400e" }}
            >
              {t("lowStockWarningBanner") ||
                (isRTL
                  ? `تنبيه: يوجد ${lowStockAlerts.length} عنصر وصل للحد الأدنى المحدد أو نفذ بالكامل من المخزون!`
                  : `Attention: ${lowStockAlerts.length} items reached or dropped below their low-stock threshold limit!`)}
            </span>
          </div>
          <button
            className={`btn btn-xs ${showLowStockOnly ? "btn-primary" : "btn-outline-warning"}`}
            style={{ fontSize: "0.78rem" }}
            onClick={() => setShowLowStockOnly(!showLowStockOnly)}
          >
            {showLowStockOnly
              ? isRTL
                ? "عرض جميع العناصر"
                : "Show All Items"
              : isRTL
                ? "استعراض المواد المنخفضة فقط"
                : "View Low Stock Only"}
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div
        style={{
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        <div style={{ flex: 1, minWidth: 220, position: "relative" }}>
          <input
            type="text"
            className="form-input"
            placeholder={
              isRTL
                ? "ابحث باسم العنصر، التصنيف، المورد، أو الرقم التسلسلي..."
                : "Search by item name, category, supplier, serial number..."
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              paddingLeft: isRTL ? 12 : 36,
              paddingRight: isRTL ? 36 : 12,
            }}
          />
          <div
            style={{
              position: "absolute",
              top: "50%",
              transform: "translateY(-50%)",
              right: isRTL ? 12 : "auto",
              left: isRTL ? "auto" : 12,
              color: "var(--text-muted)",
              pointerEvents: "none",
            }}
          >
            <Icon name="search" size={16} />
          </div>
        </div>

        {categories.length > 0 && (
          <select
            className="form-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{ width: "auto", minWidth: 160 }}
          >
            <option value="">
              {isRTL ? "جميع التصنيفات" : "All Categories"}
            </option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        )}

        <select
          className="form-select"
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          style={{ width: "auto", minWidth: 140 }}
        >
          <option value="">{isRTL ? "جميع الحالات" : "All Statuses"}</option>
          <option value="available">
            {t("statusAvailable") || (isRTL ? "متوفر" : "Available")}
          </option>
          <option value="low_stock">
            {t("statusLowStock") || (isRTL ? "مخزون منخفض" : "Low Stock")}
          </option>
          <option value="out_of_stock">
            {t("statusOutOfStock") || (isRTL ? "نفدت الكمية" : "Out of Stock")}
          </option>
          <option value="damaged">
            {t("statusDamaged") || (isRTL ? "تالف" : "Damaged")}
          </option>
          <option value="expired">
            {t("statusExpired") || (isRTL ? "منتهي الصلاحية" : "Expired")}
          </option>
          <option value="maintenance">
            {t("statusMaintenance") || (isRTL ? "تحت الصيانة" : "Maintenance")}
          </option>
        </select>
      </div>

      {/* Items Grid */}
      {filteredResources.length === 0 ? (
        <div
          style={{
            padding: "48px 20px",
            textAlign: "center",
            background: "var(--surface-alt)",
            borderRadius: "var(--radius-lg)",
            border: "1px dashed var(--border)",
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
            <Icon name="box" size={24} />
          </div>
          <h4
            style={{
              fontSize: "1rem",
              fontWeight: 700,
              margin: "0 0 6px",
              color: "var(--heading)",
            }}
          >
            {t("noResourcesFound") ||
              (isRTL ? "لا توجد موارد مضافة حالياً" : "No resources found")}
          </h4>
          <p
            style={{
              fontSize: "0.85rem",
              color: "var(--text-secondary)",
              margin: 0,
            }}
          >
            {isRTL
              ? "قم بإضافة أول مورد أو اختيار نموذج سريع للبدء"
              : "Add your first item or pick a quick preset template to get started."}
          </p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fill, minmax(min(100%, 300px), 1fr))",
            gap: 18,
          }}
        >
          {filteredResources.map((r) => {
            const qty = parseInt(r.quantity, 10) || 0;
            const minQty = parseInt(r.minimum_quantity, 10) || 0;
            const unitPrice = parseFloat(r.unit_price) || 0;
            const totalVal = qty * unitPrice;
            const isLow = (qty > 0 && qty <= minQty) || r.is_low_stock;
            const isOut = qty <= 0 || r.is_out_of_stock;

            return (
              <div
                key={r.id}
                style={{
                  padding: "18px 16px",
                  borderRadius: "var(--radius-lg)",
                  border: isOut
                    ? "1px solid rgba(239, 68, 68, 0.4)"
                    : isLow
                      ? "1px solid rgba(245, 158, 11, 0.4)"
                      : "1px solid var(--border-light)",
                  background: isOut
                    ? "rgba(239, 68, 68, 0.02)"
                    : isLow
                      ? "rgba(245, 158, 11, 0.02)"
                      : "var(--surface)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                  boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
                  position: "relative",
                }}
              >
                {/* Card Title & Category Header */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: 10,
                  }}
                >
                  <div>
                    <h3
                      style={{
                        fontSize: "1.05rem",
                        fontWeight: 800,
                        margin: "0 0 4px",
                        color: "var(--heading)",
                      }}
                    >
                      {r.name}
                    </h3>
                    {r.category && (
                      <span
                        style={{
                          fontSize: "0.72rem",
                          background: "var(--surface-alt)",
                          padding: "2px 8px",
                          borderRadius: 6,
                          fontWeight: 600,
                          color: "var(--primary)",
                        }}
                      >
                        {r.category}
                      </span>
                    )}
                  </div>

                  <span
                    style={{
                      fontSize: "0.7rem",
                      padding: "3px 8px",
                      borderRadius: 12,
                      fontWeight: 700,
                      background: isOut
                        ? "#fee2e2"
                        : isLow
                          ? "#fef3c7"
                          : r.status === "available" || r.status === "active"
                            ? "#dcfce7"
                            : "#f3f4f6",
                      color: isOut
                        ? "#991b1b"
                        : isLow
                          ? "#92400e"
                          : r.status === "available" || r.status === "active"
                            ? "#15803d"
                            : "#4b5563",
                    }}
                  >
                    {isOut
                      ? t("statusOutOfStock") ||
                        (isRTL ? "نفدت الكمية" : "Out of Stock")
                      : isLow
                        ? t("statusLowStock") ||
                          (isRTL ? "مخزون منخفض" : "Low Stock")
                        : r.status}
                  </span>
                </div>

                {r.description && (
                  <p
                    style={{
                      fontSize: "0.84rem",
                      color: "var(--text-secondary)",
                      margin: 0,
                      lineHeight: 1.4,
                    }}
                  >
                    {r.description}
                  </p>
                )}

                {/* Threshold & Stock Indicator */}
                <div
                  style={{
                    background: "var(--surface-alt)",
                    padding: "10px 12px",
                    borderRadius: "var(--radius-md)",
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "0.82rem",
                      fontWeight: 700,
                    }}
                  >
                    <span>
                      {t("quantity") || (isRTL ? "الكمية المتاحة:" : "Stock:")}{" "}
                      <span
                        style={{
                          color: isOut
                            ? "#dc2626"
                            : isLow
                              ? "#d97706"
                              : "var(--heading)",
                        }}
                      >
                        {qty} {r.unit || "piece"}
                      </span>
                    </span>
                    <span
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--text-muted)",
                        fontWeight: 500,
                      }}
                    >
                      {isRTL ? "الحد الأدنى:" : "Threshold Limit:"} {minQty}
                    </span>
                  </div>

                  {/* Visual Bar showing quantity ratio against threshold */}
                  {minQty > 0 && (
                    <div
                      style={{
                        width: "100%",
                        height: 6,
                        background: "#e2e8f0",
                        borderRadius: 3,
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${Math.min(100, Math.max(5, (qty / (minQty * 2)) * 100))}%`,
                          height: "100%",
                          background: isOut
                            ? "#ef4444"
                            : isLow
                              ? "#f59e0b"
                              : "#10b981",
                          borderRadius: 3,
                          transition: "width 0.3s ease",
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Pricing Details */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "0.82rem",
                    padding: "4px 0",
                    borderTop: "1px dashed var(--border-light)",
                    borderBottom: "1px dashed var(--border-light)",
                  }}
                >
                  <span style={{ color: "var(--text-secondary)" }}>
                    {t("unitPrice") || (isRTL ? "سعر الوحدة:" : "Unit Price:")}{" "}
                    <b>${formatCurrency(unitPrice)}</b>
                  </span>
                  <span style={{ color: "var(--heading)", fontWeight: 800 }}>
                    {t("totalValue") || (isRTL ? "الإجمالي:" : "Total:")} $
                    {formatCurrency(totalVal)}
                  </span>
                </div>

                {/* Additional Attributes Badges */}
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 6,
                    fontSize: "0.75rem",
                  }}
                >
                  {r.supplier && (
                    <span
                      style={{
                        background: "var(--surface-alt)",
                        padding: "2px 8px",
                        borderRadius: 4,
                        color: "var(--text-secondary)",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <Icon name="truck" size={12} />
                      {r.supplier}
                    </span>
                  )}
                  {r.serial_number && (
                    <span
                      style={{
                        background: "var(--surface-alt)",
                        padding: "2px 8px",
                        borderRadius: 4,
                        color: "var(--text-secondary)",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <Icon name="hash" size={12} />
                      {r.serial_number}
                    </span>
                  )}
                  {r.expiry_date && (
                    <span
                      style={{
                        background: "var(--surface-alt)",
                        padding: "2px 8px",
                        borderRadius: 4,
                        color: "var(--text-secondary)",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <Icon name="calendar" size={12} />
                      {r.expiry_date}
                    </span>
                  )}
                  {r.location && (
                    <span
                      style={{
                        background: "var(--surface-alt)",
                        padding: "2px 8px",
                        borderRadius: 4,
                        color: "var(--text-secondary)",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <Icon name="map-pin" size={12} />
                      {r.location}
                    </span>
                  )}
                </div>

                {/* Actions */}
                {canEdit && (
                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      marginTop: "auto",
                      paddingTop: 10,
                    }}
                  >
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleOpenEdit(r)}
                      style={{ flex: 1 }}
                    >
                      <Icon name="edit-2" size={14} />
                      {t("edit") || (isRTL ? "تعديل" : "Edit")}
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleOpenDelete(r.id)}
                    >
                      <Icon name="trash-2" size={14} />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Creation / Edit Modal */}
      {isModalOpen &&
        createPortal(
          <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}>
            <div
              className="modal-card animate-fade-in-up"
              style={{
                maxWidth: 640,
                width: "100%",
                maxHeight: "90vh",
                overflowY: "auto",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <div>
                  <h3 className="modal-title">
                    {form.id
                      ? t("editResource") ||
                        (isRTL ? "تعديل بيانات المورد" : "Edit Resource")
                      : t("addResource") ||
                        (isRTL ? "إضافة مورد جديد" : "Add New Resource")}
                  </h3>
                  <p className="modal-subtitle">
                    {form.id
                      ? t("editResourceSubtitle") ||
                        (isRTL
                          ? "تعديل بيانات وسعر وحدود تنبيه المورد"
                          : "Update resource details, threshold limits, and price")
                      : t("addResourceSubtitle") ||
                        (isRTL
                          ? "أدخل بيانات العنصر وسعر الكمية والحد الأدنى للتنبيه"
                          : "Enter item details, pricing, and threshold alerts")}
                  </p>
                </div>
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() => setIsModalOpen(false)}
                >
                  <Icon name="x" size={16} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="modal-body">
                {/* Basic Section */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 16,
                  }}
                >
                  <div className="form-group" style={{ gridColumn: "span 2" }}>
                    <label className="form-label">
                      {t("resourceName") ||
                        (isRTL
                          ? "اسم المورد / العنصر"
                          : "Resource / Item Name")}{" "}
                      <span
                        className="required"
                        style={{ color: "var(--error)" }}
                      >
                        *
                      </span>
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      required
                      placeholder={
                        isRTL
                          ? "مثال: جهاز ECG، صندوق سرنجات 5ml، كتاب جراحة"
                          : "e.g. ECG Machine, Syringes Box 5ml, Surgery Textbook"
                      }
                      value={form.name}
                      onChange={(e) =>
                        setForm({ ...form, name: e.target.value })
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      {t("category") || (isRTL ? "التصنيف" : "Category")}
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder={
                        isRTL
                          ? "مثال: Medical equipment, Consumables, Books"
                          : "e.g. Medical equipment, Consumables, Books"
                      }
                      value={form.category}
                      onChange={(e) =>
                        setForm({ ...form, category: e.target.value })
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      {t("type") || (isRTL ? "النوع" : "Type")}
                    </label>
                    <select
                      className="form-select"
                      value={form.type}
                      onChange={(e) =>
                        setForm({ ...form, type: e.target.value })
                      }
                    >
                      <option value="equipment">
                        {isRTL ? "معدات / أجهزة (Equipment)" : "Equipment"}
                      </option>
                      <option value="consumable">
                        {isRTL ? "مستهلكات (Consumable)" : "Consumable"}
                      </option>
                      <option value="medicine">
                        {isRTL ? "أدوية / لقاحات (Medicine)" : "Medicine"}
                      </option>
                      <option value="book">
                        {isRTL ? "كتب ومطبوعات (Book)" : "Book"}
                      </option>
                      <option value="furniture">
                        {isRTL ? "أثاث (Furniture)" : "Furniture"}
                      </option>
                      <option value="electronics">
                        {isRTL ? "إلكترونيات (Electronics)" : "Electronics"}
                      </option>
                      <option value="room">
                        {isRTL ? "قاعة / غرفة (Room)" : "Room"}
                      </option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    {t("description") || (isRTL ? "الوصف" : "Description")}
                  </label>
                  <textarea
                    className="form-textarea"
                    rows="2"
                    placeholder={
                      isRTL
                        ? "مواصفات العنصر أو تفاصيل الاستخدام..."
                        : "Item specifications or usage notes..."
                    }
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                  />
                </div>

                {/* Inventory & Threshold Section Header */}
                <div
                  style={{
                    fontSize: "0.85rem",
                    fontWeight: 800,
                    color: "var(--primary)",
                    margin: "12px 0 8px",
                    paddingBottom: 4,
                    borderBottom: "1px solid var(--border-light)",
                  }}
                >
                  📊{" "}
                  {isRTL
                    ? "الكميات والأسعار وحدود التنبيه (Inventory & Thresholds)"
                    : "Inventory & Threshold Limits"}
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr",
                    gap: 14,
                  }}
                >
                  <div className="form-group">
                    <label className="form-label">
                      {t("quantity") ||
                        (isRTL ? "الكمية الحالية" : "Current Quantity")}
                    </label>
                    <input
                      type="number"
                      className="form-input"
                      min="0"
                      value={form.quantity}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          quantity: parseInt(e.target.value, 10) || 0,
                        })
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      {t("unit") || (isRTL ? "وحدة القياس" : "Unit of Measure")}
                    </label>
                    <select
                      className="form-select"
                      value={form.unit}
                      onChange={(e) =>
                        setForm({ ...form, unit: e.target.value })
                      }
                    >
                      <option value="piece">
                        {isRTL ? "قطعة (piece)" : "piece"}
                      </option>
                      <option value="box">
                        {isRTL ? "صندوق (box)" : "box"}
                      </option>
                      <option value="pack">
                        {isRTL ? "عبوة (pack)" : "pack"}
                      </option>
                      <option value="set">{isRTL ? "طقم (set)" : "set"}</option>
                      <option value="liter">
                        {isRTL ? "لتر (liter)" : "liter"}
                      </option>
                      <option value="kg">{isRTL ? "كجم (kg)" : "kg"}</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      {t("minimumQuantity") ||
                        (isRTL ? "حد التنبيه الأدنى" : "Low Stock Threshold")}
                    </label>
                    <input
                      type="number"
                      className="form-input"
                      min="0"
                      placeholder="0"
                      value={form.minimum_quantity}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          minimum_quantity: parseInt(e.target.value, 10) || 0,
                        })
                      }
                    />
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 14,
                  }}
                >
                  <div className="form-group">
                    <label className="form-label">
                      {t("unitPrice") ||
                        (isRTL ? "سعر الوحدة ($)" : "Unit Price ($)")}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="form-input"
                      value={form.unit_price}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          unit_price: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      {t("totalValue") ||
                        (isRTL
                          ? "القيمة الإجمالية المقدرة"
                          : "Calculated Total Value")}
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      disabled
                      style={{
                        background: "var(--surface-alt)",
                        fontWeight: 800,
                      }}
                      value={`$${formatCurrency((form.quantity || 0) * (form.unit_price || 0))}`}
                    />
                  </div>
                </div>

                {/* Logistics Section Header */}
                <div
                  style={{
                    fontSize: "0.85rem",
                    fontWeight: 800,
                    color: "var(--primary)",
                    margin: "12px 0 8px",
                    paddingBottom: 4,
                    borderBottom: "1px solid var(--border-light)",
                  }}
                >
                  🚚{" "}
                  {isRTL
                    ? "بيانات المورد والموقع والتواريخ (Logistics & Supplier)"
                    : "Logistics & Supplier Details"}
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 14,
                  }}
                >
                  <div className="form-group">
                    <label className="form-label">
                      {t("supplier") ||
                        (isRTL ? "اسم المورد" : "Supplier Name")}
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder={
                        isRTL ? "اسم شركة التوريد..." : "Supplier company..."
                      }
                      value={form.supplier}
                      onChange={(e) =>
                        setForm({ ...form, supplier: e.target.value })
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      {t("serialNumber") ||
                        (isRTL ? "الرقم التسلسلي (SN)" : "Serial Number")}
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="SN-12345"
                      value={form.serial_number}
                      onChange={(e) =>
                        setForm({ ...form, serial_number: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 14,
                  }}
                >
                  <div className="form-group">
                    <label className="form-label">
                      {t("purchaseDate") ||
                        (isRTL ? "تاريخ الشراء" : "Purchase Date")}
                    </label>
                    <input
                      type="date"
                      className="form-input"
                      value={form.purchase_date}
                      onChange={(e) =>
                        setForm({ ...form, purchase_date: e.target.value })
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      {t("expiryDate") ||
                        (isRTL ? "تاريخ الانتهاء" : "Expiry Date")}
                    </label>
                    <input
                      type="date"
                      className="form-input"
                      value={form.expiry_date}
                      onChange={(e) =>
                        setForm({ ...form, expiry_date: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 14,
                  }}
                >
                  <div className="form-group">
                    <label className="form-label">
                      {t("location") ||
                        (isRTL ? "مكان التخزين / الموقع" : "Storage Location")}
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder={
                        isRTL
                          ? "الطابق الأول - مستودع A"
                          : "Floor 1 - Warehouse A"
                      }
                      value={form.location}
                      onChange={(e) =>
                        setForm({ ...form, location: e.target.value })
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      {t("status") || (isRTL ? "الحالة" : "Status")}
                    </label>
                    <select
                      className="form-select"
                      value={form.status}
                      onChange={(e) =>
                        setForm({ ...form, status: e.target.value })
                      }
                    >
                      <option value="available">
                        {t("statusAvailable") ||
                          (isRTL ? "متوفر" : "Available")}
                      </option>
                      <option value="low_stock">
                        {t("statusLowStock") ||
                          (isRTL ? "مخزون منخفض" : "Low Stock")}
                      </option>
                      <option value="out_of_stock">
                        {t("statusOutOfStock") ||
                          (isRTL ? "نفدت الكمية" : "Out of Stock")}
                      </option>
                      <option value="damaged">
                        {t("statusDamaged") || (isRTL ? "تالف" : "Damaged")}
                      </option>
                      <option value="expired">
                        {t("statusExpired") ||
                          (isRTL ? "منتهي الصلاحية" : "Expired")}
                      </option>
                      <option value="maintenance">
                        {t("statusMaintenance") ||
                          (isRTL ? "تحت الصيانة" : "Maintenance")}
                      </option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    {t("notes") ||
                      (isRTL ? "ملاحظات إضافية" : "Additional Notes")}
                  </label>
                  <textarea
                    className="form-textarea"
                    rows="2"
                    placeholder={
                      isRTL
                        ? "أي ملاحظات شحن أو ضمان أو شروط..."
                        : "Warranty, shipping, or storage notes..."
                    }
                    value={form.notes}
                    onChange={(e) =>
                      setForm({ ...form, notes: e.target.value })
                    }
                  />
                </div>

                <div
                  className="modal-actions"
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: 12,
                    marginTop: 20,
                    paddingTop: 16,
                    borderTop: "1px solid var(--border-light)",
                  }}
                >
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setIsModalOpen(false)}
                  >
                    {t("cancel") || (isRTL ? "إلغاء" : "Cancel")}
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {t("save") || (isRTL ? "حفظ" : "Save")}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body,
        )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        modalState={confirmModal}
        onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
