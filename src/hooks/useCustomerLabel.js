import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";

/**
 * Custom hook to get the configured customer label for a given workspace,
 * falling back to default "Customer" / "العميل" and "Customers" / "العملاء" translations.
 *
 * @param {Object} [passedWorkspace] Optional workspace object, defaults to current auth user's workspace
 * @returns {{
 *   singular: string,
 *   plural: string,
 *   customerSingular: string,
 *   customerPlural: string,
 *   customerIcon: string,
 *   getCustomerLabel: (type?: 'singular' | 'plural') => string
 * }}
 */
export function useCustomerLabel(passedWorkspace) {
  const { t, lang, isRTL } = useLanguage();
  const { user } = useAuth();
  const workspace = passedWorkspace || user?.workspace;

  const getCustomerLabel = (type = "plural") => {
    const field =
      type === "singular" ? "customer_label_singular" : "customer_label_plural";

    if (workspace && workspace[field]) {
      const val = workspace[field];
      if (typeof val === "object" && val !== null) {
        return (
          val[lang] ||
          val.ar ||
          val.en ||
          (type === "singular"
            ? isRTL
              ? "عميل"
              : "Client"
            : isRTL
              ? "العملاء"
              : "Clients")
        );
      }
      return val;
    }

    if (type === "singular") {
      return (
        t("customerSingle") || t("customer") || (isRTL ? "عميل" : "Client")
      );
    }
    return (
      t("navCustomers") || t("customers") || (isRTL ? "العملاء" : "Clients")
    );
  };

  const singular = getCustomerLabel("singular");
  const plural = getCustomerLabel("plural");
  const customerIcon = workspace?.customer_icon || "users";

  return {
    singular,
    plural,
    customerSingular: singular,
    customerPlural: plural,
    customerIcon,
    getCustomerLabel,
  };
}

export default useCustomerLabel;
