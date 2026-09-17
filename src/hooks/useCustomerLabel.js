import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";

/**
 * Custom hook to get the configured customer label for a given workspace,
 * falling back to default "Customer" / "العميل" and "Customers" / "العملاء" translations.
 *
 * @param {Object} [passedWorkspace] Optional workspace object, defaults to current auth user's workspace
 */
export function useCustomerLabel(passedWorkspace) {
  const { t, lang, isRTL } = useLanguage();
  const { user } = useAuth();
  const workspace = passedWorkspace || user?.workspace;

  // Extract non-empty string value if set
  const getRawValue = (field) => {
    if (!workspace || !workspace[field]) return null;
    const val = workspace[field];
    if (typeof val === "object" && val !== null) {
      const localized = val[lang] || val.ar || val.en;
      if (typeof localized === "string" && localized.trim()) {
        return localized.trim();
      }
      return null;
    }
    if (typeof val === "string" && val.trim()) {
      return val.trim();
    }
    return null;
  };

  const rawSingular = getRawValue("customer_label_singular");
  const rawPlural = getRawValue("customer_label_plural");

  // Determine if the workspace explicitly set a custom customer terminology
  const isCustom = Boolean(rawSingular || rawPlural);
  const hasCustomLabel = isCustom;

  // Default values
  const defaultSingular = isRTL ? "عميل" : "Client";
  const defaultPlural = isRTL ? "العملاء" : "Clients";

  const singular =
    rawSingular || (isCustom ? rawPlural : null) || defaultSingular;
  const plural = rawPlural || (isCustom ? rawSingular : null) || defaultPlural;
  const customerIcon = workspace?.customer_icon || "users";

  // Contextual translation helper
  const tc = (key, customArTemplate, customEnTemplate) => {
    if (isCustom && customArTemplate) {
      const template = isRTL
        ? customArTemplate
        : customEnTemplate || customArTemplate;
      return template.replace(/%s/g, singular).replace(/%p/g, plural);
    }
    return t(key);
  };

  // Pre-computed contextual UI phrases
  const createBookingTitle = isCustom
    ? isRTL
      ? `حجز موعد لـ ${singular}`
      : `Book Appointment for ${singular}`
    : t("createBookingForClient") ||
      (isRTL ? "حجز موعد لعميل" : "Book Appointment for Client");

  const existingCustomerTab = isCustom
    ? isRTL
      ? `${singular} مسجل`
      : `Registered ${singular}`
    : t("existingCustomerTab") || (isRTL ? "عميل مسجل" : "Registered Client");

  const newCustomerTab = isCustom
    ? isRTL
      ? `+ ${singular} جديد (إنشاء سريع)`
      : `+ New ${singular} (Quick Create)`
    : t("newCustomerTab") ||
      (isRTL ? "+ عميل جديد (إنشاء سريع)" : "+ New Customer (Quick Create)");

  const selectCustomerPrompt = isCustom
    ? isRTL
      ? `اختر ${singular}...`
      : `Select ${singular}...`
    : t("selectCustomerPrompt") ||
      (isRTL ? "اختر العميل..." : "Select Customer...");

  const searchCustomerPrompt = isCustom
    ? isRTL
      ? `بحث باسم ${singular} أو البريد...`
      : `Search by ${singular} name or email...`
    : t("searchBookingPlaceholder") ||
      (isRTL
        ? "بحث باسم العميل أو البريد..."
        : "Search by customer name or email...");

  const customerNameLabel = isCustom
    ? isRTL
      ? `اسم ${singular}`
      : `${singular} Name`
    : t("customerName") || (isRTL ? "اسم العميل" : "Customer Name");

  const customerDetailsLabel = isCustom
    ? isRTL
      ? `بيانات ${singular}`
      : `${singular} Details`
    : t("customerDetails") || (isRTL ? "بيانات العميل" : "Customer Details");

  const addCustomerBtn = isCustom
    ? isRTL
      ? `إضافة ${singular} جديد`
      : `Add New ${singular}`
    : t("addCustomerBtn") || (isRTL ? "إضافة عميل جديد" : "Add New Customer");

  const editCustomerBtn = isCustom
    ? isRTL
      ? `تعديل بيانات ${singular}`
      : `Edit ${singular} Info`
    : t("editCustomerBtn") ||
      (isRTL ? "تعديل بيانات العميل" : "Edit Customer Info");

  const deleteCustomerBtn = isCustom
    ? isRTL
      ? `حذف ${singular}`
      : `Delete ${singular}`
    : t("deleteCustomerBtn") ||
      (isRTL ? "حذف من مساحة العمل" : "Remove from Workspace");

  const vipCustomer = isCustom
    ? isRTL
      ? `${singular} مميز (VIP)`
      : `VIP ${singular}`
    : t("filterStatusVip") || (isRTL ? "عميل مميز (VIP)" : "VIP Customer");

  const totalCustomers = isCustom
    ? isRTL
      ? `إجمالي ${plural}`
      : `Total ${plural}`
    : t("totalCustomers") || (isRTL ? "إجمالي العملاء" : "Total Customers");

  const manageCustomers = isCustom
    ? isRTL
      ? `إدارة ${plural}`
      : `Manage ${plural}`
    : t("manageCustomers") || (isRTL ? "إدارة العملاء" : "Manage Customers");

  const customersSubtitle = isCustom
    ? isRTL
      ? `عرض وإدارة سجلات وملفات ${plural} الخاصة بمساحة العمل والمتابعة الشاملة لمواعيدهم.`
      : `View and manage workspace ${plural} files, history, and complete appointment records.`
    : t("customersSubtitle") ||
      (isRTL
        ? "عرض وإدارة سجلات وملفات العملاء الخاصة بمساحة العمل والمتابعة الشاملة لمواعيدهم."
        : "View and manage workspace customer files, history, and complete appointment records.");

  const noCustomersFound = isCustom
    ? isRTL
      ? `لا يوجد ${plural}`
      : `No ${plural} found`
    : t("noCustomersFound") ||
      (isRTL ? "ملقيناش أي عملاء" : "No customers found");

  const noCustomersFoundDesc = isCustom
    ? isRTL
      ? `لم تتم إضافة أي ${plural} حتى الآن أو لا توجد نتائج مطابقة للبحث الحالي.`
      : `No ${plural} have been added yet or no results matched your current search.`
    : t("noCustomersFoundDesc") ||
      (isRTL
        ? "مفيش أي عملاء اتضافوا لحد دلوقتي أو مفيش نتائج مطابقة للبحث."
        : "No customers have been added yet or no results matched your current search.");

  const customerCreatedSuccess = isCustom
    ? isRTL
      ? `تم إضافة ${singular} بنجاح`
      : `${singular} added successfully`
    : t("customerCreatedSuccess") ||
      (isRTL ? "تم إضافة العميل بنجاح" : "Customer added successfully");

  const customerUpdatedSuccess = isCustom
    ? isRTL
      ? `تم تحديث بيانات ${singular} بنجاح`
      : `${singular} details updated successfully`
    : t("customerUpdatedSuccess") ||
      (isRTL
        ? "تم تحديث بيانات العميل بنجاح"
        : "Customer details updated successfully");

  const customerDeletedSuccess = isCustom
    ? isRTL
      ? `تم حذف ارتباط ${singular} بنجاح`
      : `${singular} unlinked successfully`
    : t("customerDeletedSuccess") ||
      (isRTL ? "تم حذف ارتباط العميل بنجاح" : "Customer unlinked successfully");

  const confirmDeleteCustomer = isCustom
    ? isRTL
      ? `هل أنت متأكد من حذف هذا ${singular} من مساحة العمل؟`
      : `Are you sure you want to remove this ${singular} from the workspace?`
    : t("confirmDeleteCustomer") ||
      (isRTL
        ? "إنت متأكد إنك عايز تحذف العميل من مساحة العمل؟"
        : "Are you sure you want to remove this customer from the workspace?");

  const confirmDeleteCustomerDesc = isCustom
    ? isRTL
      ? `سيتم فك ارتباط ${singular} بمساحة العمل الحالية ولن يظهر في قائمتك. سجلات المواعيد والمدفوعات السابقة ستبقى محفوظة لأغراض الأرشفة.`
      : `The ${singular} will be unlinked from this workspace. Previous appointment and payment records will be retained for archival purposes.`
    : t("confirmDeleteCustomerDesc") ||
      (isRTL
        ? "هيتم فك ارتباط العميل بمساحة العمل دي ومش هيظهر في قائمتك. سجلات المواعيد والمدفوعات القديمة هتفضل محفوظة للأرشفة."
        : "The customer will be unlinked from this workspace. Previous appointment and payment records will be retained for archival purposes.");

  const customerNotFound = isCustom
    ? isRTL
      ? `${singular} غير موجود أو ليس لديك صلاحية لعرضه`
      : `${singular} not found or you don't have permission to view them`
    : t("customerNotFound") ||
      (isRTL
        ? "العميل مش موجود أو معندكش صلاحية لعرضه"
        : "Customer not found or you don't have permission to view them");

  const backToCustomers = isCustom
    ? isRTL
      ? `العودة لقائمة ${plural}`
      : `Back to ${plural} List`
    : t("backToCustomers") ||
      (isRTL ? "العودة لقائمة العملاء" : "Back to Customers List");

  const customerSince = isCustom
    ? isRTL
      ? `${singular} منذ`
      : `${singular} since`
    : t("customerSince") || (isRTL ? "عميل منذ" : "Customer since");

  const noCustomerAppointmentsYet = isCustom
    ? isRTL
      ? `لم يسجل هذا ${singular} أي مواعيد في مساحة العمل هذه حتى الآن.`
      : `This ${singular} has not booked any appointments in this workspace yet.`
    : t("noCustomerAppointmentsYet") ||
      (isRTL
        ? "لم يسجل هذا العميل أي مواعيد في مساحة العمل هذه لحد دلوقتي."
        : "This client has not booked any appointments in this workspace yet.");

  const internalNotesNotice = isCustom
    ? isRTL
      ? `هذه الملاحظات خاصة بمساحة العمل فقط ولا تظهر لـ${singular} إطلاقاً.`
      : `These notes are for workspace staff only and are never visible to the ${singular}.`
    : t("internalNotesNotice") ||
      (isRTL
        ? "هذه الملاحظات خاصة بمساحة العمل فقط ولا تظهر للعميل إطلاقاً."
        : "These notes are for workspace staff only and are never visible to the client.");

  const internalNotesPlaceholder = isCustom
    ? isRTL
      ? `أضف ملاحظات خاصة أو تعليمات داخلية عن هذا ${singular}...`
      : `Add private staff notes or internal handling guidelines for this ${singular}...`
    : t("internalNotesPlaceholder") ||
      (isRTL
        ? "أضف ملاحظات خاصة أو تعليمات داخلية عن هذا العميل..."
        : "Add private staff notes or internal handling guidelines for this customer...");

  const getCustomerLabel = (type = "plural") => {
    return type === "singular" ? singular : plural;
  };

  return {
    isCustom,
    hasCustomLabel,
    singular,
    plural,
    customerSingular: singular,
    customerPlural: plural,
    customerIcon,
    getCustomerLabel,
    tc,
    // Pre-computed localized phrases
    createBookingTitle,
    existingCustomerTab,
    newCustomerTab,
    selectCustomerPrompt,
    searchCustomerPrompt,
    customerNameLabel,
    customerDetailsLabel,
    addCustomerBtn,
    editCustomerBtn,
    deleteCustomerBtn,
    vipCustomer,
    totalCustomers,
    manageCustomers,
    customersSubtitle,
    noCustomersFound,
    noCustomersFoundDesc,
    customerCreatedSuccess,
    customerUpdatedSuccess,
    customerDeletedSuccess,
    confirmDeleteCustomer,
    confirmDeleteCustomerDesc,
    customerNotFound,
    backToCustomers,
    customerSince,
    noCustomerAppointmentsYet,
    internalNotesNotice,
    internalNotesPlaceholder,
  };
}

export default useCustomerLabel;
