import { useState } from "react";
import { createPortal } from "react-dom";
import { useLanguage } from "../../../../context/LanguageContext";
import Icon from "../../../../components/common/Icon";

export default function RolesTab({
  rolesList,
  availablePermissions,
  canEdit = true,
  canCreate,
  canUpdate,
  canDelete,
  onSaveRole,
  onDeleteRole,
}) {
  const allowCreate = canCreate !== undefined ? canCreate : canEdit;
  const allowUpdate = canUpdate !== undefined ? canUpdate : canEdit;
  const allowDelete = canDelete !== undefined ? canDelete : canEdit;
  const { t } = useLanguage();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [roleLangTab, setRoleLangTab] = useState("ar");
  const [roleForm, setRoleForm] = useState({
    editing_id: null,
    name: { ar: "", en: "" },
    description: { ar: "", en: "" },
    permissions: [],
    is_visible_to_customers: false,
  });

  const PERMISSION_KEYS = {
    booking_read: "permBookingRead",
    booking_create: "permBookingCreate",
    booking_update: "permBookingUpdate",
    booking_delete: "permBookingDelete",
    booking_write: "permBookingWrite",

    customer_read: "permCustomerRead",
    customer_create: "permCustomerCreate",
    customer_update: "permCustomerUpdate",
    customer_delete: "permCustomerDelete",
    customer_write: "permCustomerWrite",

    service_read: "permServiceRead",
    service_create: "permServiceCreate",
    service_update: "permServiceUpdate",
    service_delete: "permServiceDelete",
    service_write: "permServiceWrite",

    resource_read: "permResourceRead",
    resource_create: "permResourceCreate",
    resource_update: "permResourceUpdate",
    resource_delete: "permResourceDelete",
    resource_write: "permResourceWrite",

    schedule_read: "permScheduleRead",
    schedule_create: "permScheduleCreate",
    schedule_update: "permScheduleUpdate",
    schedule_delete: "permScheduleDelete",
    schedule_write: "permScheduleWrite",

    payment_read: "permPaymentRead",
    payment_create: "permPaymentCreate",
    payment_update: "permPaymentUpdate",
    payment_delete: "permPaymentDelete",
    payment_write: "permPaymentWrite",

    subscription_read: "permSubscriptionRead",
    subscription_create: "permSubscriptionCreate",
    subscription_update: "permSubscriptionUpdate",
    subscription_delete: "permSubscriptionDelete",
    subscription_write: "permSubscriptionWrite",

    booking_form_read: "permBookingFormRead",
    booking_form_create: "permBookingFormCreate",
    booking_form_update: "permBookingFormUpdate",
    booking_form_delete: "permBookingFormDelete",
    booking_form_write: "permBookingFormWrite",

    branding_read: "permBrandingRead",
    branding_update: "permBrandingUpdate",
    branding_write: "permBrandingWrite",

    settings_read: "permSettingsRead",
    settings_update: "permSettingsUpdate",
    settings_write: "permSettingsWrite",

    member_read: "permMemberRead",
    member_create: "permMemberCreate",
    member_update: "permMemberUpdate",
    member_delete: "permMemberDelete",
    member_write: "permMemberWrite",
    member_manage: "permMemberManage",

    role_read: "permRoleRead",
    role_create: "permRoleCreate",
    role_update: "permRoleUpdate",
    role_delete: "permRoleDelete",
    role_write: "permRoleWrite",

    calendar_own: "permCalendarOwn",

    chat_read: "permChatRead",
    chat_create: "permChatCreate",
    chat_update: "permChatUpdate",
    chat_delete: "permChatDelete",
    chat_write: "permChatWrite",

    integration_read: "permIntegrationRead",
    integration_create: "permIntegrationCreate",
    integration_update: "permIntegrationUpdate",
    integration_delete: "permIntegrationDelete",
    integration_manage: "permIntegrationManage",

    notification_read: "permNotificationRead",
    notification_create: "permNotificationCreate",
    notification_update: "permNotificationUpdate",
    notification_delete: "permNotificationDelete",
    notification_manage: "permNotificationManage",
  };

  const DEFAULT_CATEGORIES = [
    {
      category: t("cat_bookings") || "الحجوزات",
      permissions: [
        {
          value: "booking_read",
          label: t("permBookingRead") || "عرض الحجوزات",
        },
        {
          value: "booking_create",
          label: t("permBookingCreate") || "إنشاء الحجوزات",
        },
        {
          value: "booking_update",
          label: t("permBookingUpdate") || "تعديل الحجوزات",
        },
        {
          value: "booking_delete",
          label: t("permBookingDelete") || "حذف وإلغاء الحجوزات",
        },
      ],
    },
    {
      category: t("cat_customers") || "العملاء",
      permissions: [
        {
          value: "customer_read",
          label: t("permCustomerRead") || "عرض العملاء",
        },
        {
          value: "customer_create",
          label: t("permCustomerCreate") || "إضافة عملاء جدد",
        },
        {
          value: "customer_update",
          label: t("permCustomerUpdate") || "تعديل بيانات العملاء",
        },
        {
          value: "customer_delete",
          label: t("permCustomerDelete") || "حذف العملاء",
        },
      ],
    },
    {
      category: t("cat_services") || "الخدمات",
      permissions: [
        { value: "service_read", label: t("permServiceRead") || "عرض الخدمات" },
        {
          value: "service_create",
          label: t("permServiceCreate") || "إضافة خدمات جديدة",
        },
        {
          value: "service_update",
          label: t("permServiceUpdate") || "تعديل الخدمات",
        },
        {
          value: "service_delete",
          label: t("permServiceDelete") || "حذف الخدمات",
        },
      ],
    },
    {
      category: t("cat_resources") || "الموارد",
      permissions: [
        {
          value: "resource_read",
          label: t("permResourceRead") || "عرض الموارد والمخزون",
        },
        {
          value: "resource_create",
          label: t("permResourceCreate") || "إضافة موارد جديدة",
        },
        {
          value: "resource_update",
          label: t("permResourceUpdate") || "تعديل الموارد",
        },
        {
          value: "resource_delete",
          label: t("permResourceDelete") || "حذف الموارد",
        },
      ],
    },
    {
      category: t("cat_schedules") || "جداول العمل",
      permissions: [
        {
          value: "schedule_read",
          label: t("permScheduleRead") || "عرض جدول مواعيد العمل",
        },
        {
          value: "schedule_create",
          label: t("permScheduleCreate") || "إنشاء جداول مواعيد جديدة",
        },
        {
          value: "schedule_update",
          label: t("permScheduleUpdate") || "تعديل جدول مواعيد العمل",
        },
        {
          value: "schedule_delete",
          label: t("permScheduleDelete") || "حذف جداول مواعيد العمل",
        },
      ],
    },
    {
      category: t("cat_payments") || "الدفع والمالية",
      permissions: [
        {
          value: "payment_read",
          label: t("permPaymentRead") || "عرض سجل عمليات الدفع",
        },
        {
          value: "payment_create",
          label: t("permPaymentCreate") || "إضافة عمليات دفع جديدة",
        },
        {
          value: "payment_update",
          label: t("permPaymentUpdate") || "تعديل وتأكيد عمليات الدفع",
        },
        {
          value: "payment_delete",
          label: t("permPaymentDelete") || "حذف واسترجاع عمليات الدفع",
        },
        {
          value: "subscription_read",
          label: t("permSubscriptionRead") || "عرض تفاصيل اشتراك مساحة العمل",
        },
        {
          value: "subscription_create",
          label:
            t("permSubscriptionCreate") || "ترقية والاشتراك في باقات جديدة",
        },
        {
          value: "subscription_update",
          label:
            t("permSubscriptionUpdate") || "تعديل وتجديد اشتراك مساحة العمل",
        },
        {
          value: "subscription_delete",
          label: t("permSubscriptionDelete") || "إلغاء اشتراك مساحة العمل",
        },
      ],
    },
    {
      category: t("cat_settings") || "الإعدادات والهوية",
      permissions: [
        {
          value: "booking_form_read",
          label: t("permBookingFormRead") || "عرض نموذج الحجز والأسئلة",
        },
        {
          value: "booking_form_create",
          label:
            t("permBookingFormCreate") ||
            "إضافة حقول وأسئلة جديدة لنموذج الحجز",
        },
        {
          value: "booking_form_update",
          label: t("permBookingFormUpdate") || "تعديل نموذج الحجز والأسئلة",
        },
        {
          value: "booking_form_delete",
          label: t("permBookingFormDelete") || "حذف أسئلة وحقول نموذج الحجز",
        },
        {
          value: "branding_read",
          label: t("permBrandingRead") || "عرض الهوية البصرية وشعار المساحة",
        },
        {
          value: "branding_update",
          label:
            t("permBrandingUpdate") || "تعديل الهوية البصرية وشعار المساحة",
        },
        {
          value: "settings_read",
          label: t("permSettingsRead") || "عرض إعدادات مساحة العمل",
        },
        {
          value: "settings_update",
          label: t("permSettingsUpdate") || "تعديل إعدادات مساحة العمل",
        },
      ],
    },
    {
      category: t("cat_members") || "الأعضاء والصلاحيات",
      permissions: [
        {
          value: "member_read",
          label: t("permMemberRead") || "عرض أعضاء مساحة العمل",
        },
        {
          value: "member_create",
          label: t("permMemberCreate") || "دعوة وإضافة أعضاء جدد لمساحة العمل",
        },
        {
          value: "member_update",
          label: t("permMemberUpdate") || "تعديل بيانات وأدوار الأعضاء",
        },
        {
          value: "member_delete",
          label: t("permMemberDelete") || "حذف وإزالة أعضاء مساحة العمل",
        },
        {
          value: "role_read",
          label: t("permRoleRead") || "عرض الأدوار والصلاحيات",
        },
        {
          value: "role_create",
          label: t("permRoleCreate") || "إنشاء أدوار مخصصة جديدة",
        },
        {
          value: "role_update",
          label: t("permRoleUpdate") || "تعديل الأدوار والصلاحيات",
        },
        {
          value: "role_delete",
          label: t("permRoleDelete") || "حذف الأدوار المخصصة",
        },
        {
          value: "calendar_own",
          label: t("permCalendarOwn") || "إدارة وتقويم خاص بالعضو",
        },
      ],
    },
    {
      category: t("cat_chat") || "المحادثات",
      permissions: [
        {
          value: "chat_read",
          label: t("permChatRead") || "عرض محادثات مساحة العمل",
        },
        {
          value: "chat_create",
          label: t("permChatCreate") || "بدء محادثات جديدة وإرسال رسائل",
        },
        {
          value: "chat_update",
          label: t("permChatUpdate") || "تعديل وتحديث حالة المحادثات",
        },
        {
          value: "chat_delete",
          label: t("permChatDelete") || "حذف وأرشفة محادثات مساحة العمل",
        },
      ],
    },
    {
      category: t("cat_integrations_notifications") || "الربط والإشعارات",
      permissions: [
        {
          value: "integration_read",
          label:
            t("permIntegrationRead") || "عرض إعدادات وتفاصيل الربط والتكامل",
        },
        {
          value: "integration_create",
          label:
            t("permIntegrationCreate") || "ربط وتفعيل خدمات وتطبيقات جديدة",
        },
        {
          value: "integration_update",
          label:
            t("permIntegrationUpdate") ||
            "تعديل إعدادات الربط والتكامل ومفاتيح API",
        },
        {
          value: "integration_delete",
          label: t("permIntegrationDelete") || "فصل وإلغاء الربط والتكامل",
        },
        {
          value: "notification_read",
          label: t("permNotificationRead") || "عرض إعدادات وقوالب الإشعارات",
        },
        {
          value: "notification_create",
          label: t("permNotificationCreate") || "إنشاء قوالب وتنبيهات جديدة",
        },
        {
          value: "notification_update",
          label:
            t("permNotificationUpdate") || "تعديل قوالب وتفضيلات الإشعارات",
        },
        {
          value: "notification_delete",
          label: t("permNotificationDelete") || "حذف قوالب الإشعارات",
        },
      ],
    },
  ];

  const getPermissionLabel = (code, fallbackLabel) => {
    const key = PERMISSION_KEYS[code];
    if (key && t(key)) return t(key);
    if (fallbackLabel && typeof fallbackLabel === "string")
      return fallbackLabel;
    return code;
  };

  const getGroupedPermissions = () => {
    if (
      Array.isArray(availablePermissions) &&
      availablePermissions.length > 0
    ) {
      const firstItem = availablePermissions[0];
      if (
        firstItem &&
        typeof firstItem === "object" &&
        Array.isArray(firstItem.permissions)
      ) {
        return availablePermissions.map((group) => ({
          category:
            typeof group.category === "string"
              ? group.category
              : t(group.category) || "الصلاحيات",
          permissions: group.permissions.map((p) => {
            const val =
              typeof p === "object"
                ? p.value || (p.code ? p.code.toLowerCase() : "")
                : p;
            const fallbackLabel = typeof p === "object" ? p.label : val;
            return {
              value: val,
              label: getPermissionLabel(val, fallbackLabel),
            };
          }),
        }));
      }

      if (
        typeof firstItem === "string" ||
        (typeof firstItem === "object" && (firstItem.value || firstItem.code))
      ) {
        return [
          {
            category: t("allPermissions") || "جميع الصلاحيات",
            permissions: availablePermissions.map((p) => {
              const val =
                typeof p === "object"
                  ? p.value || (p.code ? p.code.toLowerCase() : "")
                  : p;
              const fallbackLabel = typeof p === "object" ? p.label : val;
              return {
                value: val,
                label: getPermissionLabel(val, fallbackLabel),
              };
            }),
          },
        ];
      }
    }
    return DEFAULT_CATEGORIES;
  };

  const groupedPermissions = getGroupedPermissions();
  const allPermissionValues = groupedPermissions.flatMap((g) =>
    g.permissions.map((p) => p.value),
  );
  const isAllSelected =
    allPermissionValues.length > 0 &&
    allPermissionValues.every((val) => roleForm.permissions.includes(val));

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setRoleForm((prev) => ({ ...prev, permissions: [] }));
    } else {
      setRoleForm((prev) => ({
        ...prev,
        permissions: [...allPermissionValues],
      }));
    }
  };

  const handleToggleCategory = (catPermissions) => {
    const catValues = catPermissions.map((p) => p.value);
    const allCatSelected = catValues.every((val) =>
      roleForm.permissions.includes(val),
    );
    setRoleForm((prev) => {
      if (allCatSelected) {
        return {
          ...prev,
          permissions: prev.permissions.filter(
            (val) => !catValues.includes(val),
          ),
        };
      }
      const newPerms = new Set([...prev.permissions, ...catValues]);
      return { ...prev, permissions: Array.from(newPerms) };
    });
  };

  const handleOpenCreate = () => {
    setRoleForm({
      editing_id: null,
      name: { ar: "", en: "" },
      description: { ar: "", en: "" },
      permissions: [],
      is_visible_to_customers: false,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (role) => {
    const nameTrans = role.name_translations || {};
    const descTrans = role.description_translations || {};

    setRoleForm({
      editing_id: role.id,
      name: {
        ar: nameTrans.ar || (typeof role.name === "string" ? role.name : ""),
        en: nameTrans.en || (typeof role.name === "string" ? role.name : ""),
      },
      description: {
        ar:
          descTrans.ar ||
          (typeof role.description === "string" ? role.description : ""),
        en:
          descTrans.en ||
          (typeof role.description === "string" ? role.description : ""),
      },
      permissions: Array.isArray(role.permissions) ? role.permissions : [],
      is_visible_to_customers: !!role.is_visible_to_customers,
    });
    setIsModalOpen(true);
  };

  const togglePermission = (permCode) => {
    setRoleForm((prev) => {
      const exists = prev.permissions.includes(permCode);
      return {
        ...prev,
        permissions: exists
          ? prev.permissions.filter((p) => p !== permCode)
          : [...prev.permissions, permCode],
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (onSaveRole) {
      await onSaveRole(roleForm);
    }
    setIsModalOpen(false);
  };

  const roles =
    Array.isArray(rolesList) && rolesList.length > 0 ? rolesList : [];

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
            {t("workspaceRoles") || "أدوار مساحة العمل والصلاحيات"}
          </h2>
          <p
            style={{
              fontSize: "0.86rem",
              color: "var(--text-secondary)",
              margin: "4px 0 0",
            }}
          >
            {t("workspaceRolesDesc") ||
              "إنشاء وتحديد الصلاحيات الخاصة لكل دور مخصص"}
          </p>
        </div>
        {allowCreate && (
          <button className="btn btn-primary btn-sm" onClick={handleOpenCreate}>
            + {t("addRole") || "إضافة دور جديد"}
          </button>
        )}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fill, minmax(min(100%, 240px), 1fr))",
          gap: 16,
        }}
      >
        {roles.map((r) => {
          const roleNameStr =
            typeof r.name === "object" ? r.name.ar || r.name.en : r.name;
          const roleDescStr =
            typeof r.description === "object"
              ? r.description.ar || r.description.en
              : r.description;
          const permsCount = Array.isArray(r.permissions)
            ? r.permissions.length
            : 0;

          return (
            <div
              key={r.id}
              style={{
                padding: "16px 14px",
                borderRadius: "var(--radius-lg)",
                border: "1px solid var(--border-light)",
                background: "var(--surface)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                gap: 14,
              }}
            >
              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 8,
                  }}
                >
                  <h3
                    style={{
                      fontSize: "1.05rem",
                      fontWeight: 800,
                      margin: 0,
                      color: "var(--heading)",
                    }}
                  >
                    {roleNameStr}
                  </h3>
                  {r.is_protected && (
                    <span
                      className="profile-badge verified"
                      style={{ fontSize: "0.75rem" }}
                    >
                      {t("protectedRoleBadge") || "محمي"}
                    </span>
                  )}
                </div>
                <p
                  style={{
                    fontSize: "0.85rem",
                    color: "var(--text-secondary)",
                    lineHeight: 1.5,
                    margin: 0,
                  }}
                >
                  {roleDescStr || "مفيش وصف للدور ده."}
                </p>
                <div
                  style={{
                    marginTop: 10,
                    fontSize: "0.8rem",
                    color: "var(--primary)",
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <Icon name="custom-41d6ccb9" size={14} />
                  {permsCount} {t("permissionsEnabled") || "صلاحية مفعلة"}
                </div>
              </div>

              {(allowUpdate || allowDelete) && !r.is_protected && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: 8,
                    paddingTop: 10,
                    borderTop: "1px solid var(--border-light)",
                  }}
                >
                  {allowUpdate && (
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => handleOpenEdit(r)}
                    >
                      {t("edit") || "تعديل"}
                    </button>
                  )}
                  {allowDelete && onDeleteRole && (
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      style={{ color: "#ef4444" }}
                      onClick={() => onDeleteRole(r)}
                    >
                      {t("delete") || "حذف"}
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Role Creation/Editing Modal */}
      {isModalOpen &&
        createPortal(
          <div className="modal-backdrop">
            <div className="modal-card modal-lg animate-fade-in-up">
              <div className="modal-header">
                <h3 className="modal-title">
                  {roleForm.editing_id
                    ? t("editRoleTitle") || "تعديل الدور والصلاحيات"
                    : t("addRoleTitle") || "إضافة دور مخصص جديد"}
                </h3>
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() => setIsModalOpen(false)}
                >
                  <Icon name="x" size={16} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="modal-body">
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 6,
                  }}
                >
                  <span style={{ fontSize: "0.86rem", fontWeight: 700 }}>
                    {t("roleInformation") || "بيانات الدور"}
                  </span>
                  <div
                    style={{
                      display: "inline-flex",
                      background: "var(--surface-alt)",
                      padding: 3,
                      borderRadius: 20,
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setRoleLangTab("ar")}
                      style={{
                        border: "none",
                        background:
                          roleLangTab === "ar"
                            ? "var(--primary)"
                            : "transparent",
                        color:
                          roleLangTab === "ar"
                            ? "#fff"
                            : "var(--text-secondary)",
                        padding: "3px 12px",
                        borderRadius: 16,
                        fontWeight: 700,
                        fontSize: "0.78rem",
                        cursor: "pointer",
                      }}
                    >
                      العربية
                    </button>
                    <button
                      type="button"
                      onClick={() => setRoleLangTab("en")}
                      style={{
                        border: "none",
                        background:
                          roleLangTab === "en"
                            ? "var(--primary)"
                            : "transparent",
                        color:
                          roleLangTab === "en"
                            ? "#fff"
                            : "var(--text-secondary)",
                        padding: "3px 12px",
                        borderRadius: 16,
                        fontWeight: 700,
                        fontSize: "0.78rem",
                        cursor: "pointer",
                      }}
                    >
                      English
                    </button>
                  </div>
                </div>

                {roleLangTab === "ar" ? (
                  <>
                    <div className="form-group">
                      <label className="form-label">
                        {t("roleNameAr") || "اسم الدور (بالعربية)"} *
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        value={roleForm.name.ar}
                        onChange={(e) =>
                          setRoleForm({
                            ...roleForm,
                            name: { ...roleForm.name, ar: e.target.value },
                          })
                        }
                        placeholder="مثال: مدير الحجوزات"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">
                        {t("roleDescAr") || "وصف الدور (بالعربية)"}
                      </label>
                      <textarea
                        className="form-textarea"
                        rows={2}
                        value={roleForm.description.ar}
                        onChange={(e) =>
                          setRoleForm({
                            ...roleForm,
                            description: {
                              ...roleForm.description,
                              ar: e.target.value,
                            },
                          })
                        }
                        placeholder="وصف الصلاحيات..."
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="form-group">
                      <label className="form-label">Role Name (English)</label>
                      <input
                        type="text"
                        className="form-input"
                        value={roleForm.name.en}
                        onChange={(e) =>
                          setRoleForm({
                            ...roleForm,
                            name: { ...roleForm.name, en: e.target.value },
                          })
                        }
                        placeholder="e.g. Booking Manager"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">
                        Role Description (English)
                      </label>
                      <textarea
                        className="form-textarea"
                        rows={2}
                        value={roleForm.description.en}
                        onChange={(e) =>
                          setRoleForm({
                            ...roleForm,
                            description: {
                              ...roleForm.description,
                              en: e.target.value,
                            },
                          })
                        }
                        placeholder="Role responsibilities..."
                      />
                    </div>
                  </>
                )}

                <div style={{ marginTop: 12, marginBottom: 16 }}>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      fontSize: "0.88rem",
                      cursor: "pointer",
                      fontWeight: 600,
                      color: "var(--heading)",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={roleForm.is_visible_to_customers}
                      onChange={(e) =>
                        setRoleForm({
                          ...roleForm,
                          is_visible_to_customers: e.target.checked,
                        })
                      }
                      style={{
                        width: 16,
                        height: 16,
                        accentColor: "var(--primary)",
                      }}
                    />
                    {t("isVisibleToCustomers") ||
                      "إظهار هذا الدور للعملاء (عند الحجز)"}
                  </label>
                </div>

                {/* Permissions Checklist */}
                <div style={{ marginTop: 8 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      width: "100%",
                      marginBottom: 10,
                    }}
                  >
                    <h4
                      style={{
                        fontSize: "0.92rem",
                        fontWeight: 700,
                        margin: 0,
                        color: "var(--heading)",
                      }}
                    >
                      {t("selectPermissionsTitle") ||
                        "تحديد الصلاحيات الممنوحة:"}
                    </h4>
                    <button
                      type="button"
                      onClick={handleToggleSelectAll}
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--primary)",
                        fontSize: "0.82rem",
                        fontWeight: 700,
                        cursor: "pointer",
                        padding: 0,
                        marginInlineStart: "auto",
                      }}
                    >
                      {isAllSelected
                        ? t("deselectAll") || "إلغاء تحديد الكل"
                        : t("selectAll") || "تحديد الكل"}
                    </button>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 12,
                      width: "100%",
                      boxSizing: "border-box",
                      padding: 12,
                      border: "1px solid var(--border)",
                      borderRadius: "var(--radius-md)",
                      background: "var(--surface-alt)",
                    }}
                  >
                    {groupedPermissions.map((group, idx) => {
                      const catValues = group.permissions.map((p) => p.value);
                      const allCatSelected =
                        catValues.length > 0 &&
                        catValues.every((val) =>
                          roleForm.permissions.includes(val),
                        );

                      return (
                        <div
                          key={group.category || idx}
                          style={{
                            background: "var(--surface)",
                            borderRadius: "var(--radius-sm)",
                            padding: 12,
                            border: "1px solid var(--border-light)",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justify: "space-between",
                              alignItems: "center",
                              width: "100%",
                              paddingBottom: 8,
                              marginBottom: 8,
                              borderBottom: "1px solid var(--border-light)",
                            }}
                          >
                            <span
                              style={{
                                fontSize: "0.86rem",
                                fontWeight: 800,
                                color: "var(--heading)",
                              }}
                            >
                              {group.category}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                handleToggleCategory(group.permissions)
                              }
                              style={{
                                background: "none",
                                border: "none",
                                color: "var(--primary)",
                                fontSize: "0.78rem",
                                fontWeight: 600,
                                cursor: "pointer",
                                marginInlineStart: "auto",
                              }}
                            >
                              {allCatSelected
                                ? t("deselectCategory") || "إلغاء الكل"
                                : t("selectCategory") || "تحديد الفئة"}
                            </button>
                          </div>

                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: 8,
                              width: "100%",
                            }}
                          >
                            {group.permissions.map((perm) => {
                              const isChecked = roleForm.permissions.includes(
                                perm.value,
                              );
                              return (
                                <label
                                  key={perm.value}
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                    fontSize: "0.84rem",
                                    cursor: "pointer",
                                    userSelect: "none",
                                    color: isChecked
                                      ? "var(--heading)"
                                      : "var(--text-secondary)",
                                    fontWeight: isChecked ? 600 : 400,
                                  }}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() =>
                                      togglePermission(perm.value)
                                    }
                                    style={{
                                      accentColor: "var(--primary)",
                                      cursor: "pointer",
                                      width: 16,
                                      height: 16,
                                    }}
                                  />
                                  <span>{perm.label}</span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="modal-actions">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setIsModalOpen(false)}
                  >
                    {t("cancel")}
                  </button>
                  <button type="submit" className="btn btn-primary btn-sm">
                    {roleForm.editing_id
                      ? t("saveEditsBtn") || "حفظ التعديلات"
                      : t("createRoleBtn") || "إنشاء الدور"}
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
