/**
 * Currency utilities for formatting prices, resolving symbols, and handling multi-currency workspaces.
 */

const CURRENCY_MAP = {
  SAR: { ar: "ر.س", en: "SAR", symbol: "SR" },
  EGP: { ar: "ج.م", en: "EGP", symbol: "EGP" },
  USD: { ar: "$", en: "$", symbol: "$" },
  EUR: { ar: "€", en: "€", symbol: "€" },
  AED: { ar: "د.إ", en: "AED", symbol: "AED" },
  KWD: { ar: "د.ك", en: "KWD", symbol: "KWD" },
  QAR: { ar: "ر.ق", en: "QAR", symbol: "QAR" },
  BHD: { ar: "د.ب", en: "BHD", symbol: "BHD" },
  OMR: { ar: "ر.ع", en: "OMR", symbol: "OMR" },
  JOD: { ar: "د.أ", en: "JOD", symbol: "JOD" },
  GBP: { ar: "£", en: "£", symbol: "£" },
  TRY: { ar: "₺", en: "TRY", symbol: "₺" },
};

/**
 * Get localized currency symbol or representation.
 * @param {string|object} currency - currency code, currency object, or workspace object
 * @param {boolean} isRTL - layout direction (true for Arabic, false for English)
 * @returns {string} Currency display symbol / code
 */
export function getCurrencySymbol(currency = "SAR", isRTL = true) {
  if (!currency) {
    return isRTL ? "ر.س" : "SAR";
  }

  if (typeof currency === "object" && currency !== null) {
    const detail =
      currency.currency_detail ||
      currency.currency ||
      (currency.code ? currency : null);

    if (detail) {
      if (isRTL) {
        return (
          detail.symbol_native ||
          detail.symbol ||
          (typeof detail.name === "object" ? detail.name?.ar : detail.name) ||
          detail.code ||
          "ر.س"
        );
      }
      return (
        detail.symbol ||
        detail.symbol_native ||
        (typeof detail.name === "object" ? detail.name?.en : detail.name) ||
        detail.code ||
        "SAR"
      );
    }

    if (currency.currency_symbol) {
      return currency.currency_symbol;
    }

    if (currency.currency_code) {
      return getCurrencySymbol(currency.currency_code, isRTL);
    }
  }

  const codeStr = String(currency).trim().toUpperCase();
  if (CURRENCY_MAP[codeStr]) {
    return isRTL ? CURRENCY_MAP[codeStr].ar : CURRENCY_MAP[codeStr].en;
  }

  return String(currency);
}

/**
 * Format currency amount with currency code or object.
 * @param {number|string} amount
 * @param {string|object} currency - e.g. 'SAR', 'USD', or { code: 'SAR', symbol_native: 'ر.س', symbol: 'SR' }
 * @param {boolean} isRTL - layout direction
 * @param {string|boolean|null} freeLabel - custom label for 0 (pass false to display 0 with currency)
 * @returns {string} Formatted currency text
 */
export function formatCurrency(
  amount,
  currency = "SAR",
  isRTL = true,
  freeLabel = null,
) {
  const numericAmount = parseFloat(amount);
  if (isNaN(numericAmount)) {
    return freeLabel !== null && freeLabel !== false
      ? freeLabel
      : isRTL
        ? "مجاني"
        : "Free";
  }

  if (
    numericAmount === 0 &&
    freeLabel !== false &&
    freeLabel !== null &&
    freeLabel !== undefined
  ) {
    return freeLabel;
  }

  const symbol = getCurrencySymbol(currency, isRTL);
  const formattedNum = Number.isInteger(numericAmount)
    ? numericAmount.toLocaleString("en-US")
    : numericAmount.toLocaleString("en-US", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      });

  return isRTL ? `${formattedNum} ${symbol}` : `${symbol} ${formattedNum}`;
}

/**
 * Resolve currency object / code from workspace or user context.
 * @param {object} workspace
 * @param {string} fallback
 * @returns {string|object}
 */
export function resolveWorkspaceCurrency(workspace, fallback = "SAR") {
  if (!workspace) return fallback;
  return (
    workspace.currency ||
    workspace.currency_code ||
    workspace.currency_symbol ||
    fallback
  );
}
