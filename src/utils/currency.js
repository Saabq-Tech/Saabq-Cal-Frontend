/**
 * Format currency amount with currency code or object.
 * @param {number|string} amount
 * @param {string|object} currency - e.g. 'SAR' or { code: 'SAR', symbol_native: 'ر.س', symbol: 'SR' }
 * @param {boolean} isRTL - layout direction
 * @param {string} freeLabel - optional custom label for zero amount
 * @returns {string} Formatted currency text
 */
export function formatCurrency(
  amount,
  currency = "SAR",
  isRTL = true,
  freeLabel = null,
) {
  const numericAmount = parseFloat(amount);
  if (isNaN(numericAmount) || numericAmount === 0) {
    return freeLabel || (isRTL ? "مجاني" : "Free");
  }

  let symbol = "";

  if (typeof currency === "object" && currency !== null) {
    const detail = currency.currency_detail || currency;
    const nameStr =
      typeof detail.name === "object"
        ? isRTL
          ? detail.name?.ar || detail.name?.en
          : detail.name?.en || detail.name?.ar
        : detail.name;
    symbol =
      (isRTL
        ? detail.symbol_native || detail.symbol
        : detail.symbol || detail.symbol_native) ||
      nameStr ||
      detail.code ||
      "";
  } else if (typeof currency === "string") {
    if (currency === "SAR") {
      symbol = isRTL ? "ر.س" : "SAR";
    } else if (currency === "EGP") {
      symbol = isRTL ? "ج.م" : "EGP";
    } else if (currency === "USD") {
      symbol = "$";
    } else if (currency === "EUR") {
      symbol = "€";
    } else {
      symbol = currency;
    }
  }

  return isRTL ? `${numericAmount} ${symbol}` : `${symbol} ${numericAmount}`;
}
