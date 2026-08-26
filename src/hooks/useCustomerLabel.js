import { useLanguage } from "../context/LanguageContext";

/**
 * Custom hook to get the configured customer label for a given workspace,
 * falling back to default "Customer" / "العميل" and "Customers" / "العملاء" translations.
 *
 * @param {Object} workspace
 * @returns {{ singular: string, plural: string }}
 */
export function useCustomerLabel(workspace) {
  const { t, language } = useLanguage();
  const isRTL = language === "ar";

  const defaultSingular = isRTL
    ? t("customer") || "العميل"
    : t("customer") || "Customer";
  const defaultPlural = isRTL
    ? t("customers") || "العملاء"
    : t("customers") || "Customers";

  if (!workspace) {
    return {
      singular: defaultSingular,
      plural: defaultPlural,
    };
  }

  const singular = workspace.customer_label_singular || defaultSingular;
  const plural = workspace.customer_label_plural || defaultPlural;

  return {
    singular,
    plural,
  };
}

export default useCustomerLabel;
