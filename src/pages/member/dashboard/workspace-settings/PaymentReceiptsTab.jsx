import { useLanguage } from "../../../../context/LanguageContext";
import Icon from "../../../../components/common/Icon";

export default function PaymentReceiptsTab({
  paymentReceiptsForm,
  setPaymentReceiptsForm,
  onSave,
  saving,
  canEdit,
}) {
  const { t } = useLanguage();

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(paymentReceiptsForm);
  };

  const currentMode =
    paymentReceiptsForm.payment_receipt_mode ||
    paymentReceiptsForm.receipt_mode ||
    "required";

  const receiptOptions = [
    {
      value: "required",
      title: t("requiredToggle") || "إجباري",
      description:
        t("receiptRequiredDesc") || "لا يكتمل الحجز إلا برفع إيصال التحويل.",
    },
    {
      value: "optional",
      title: t("optionalToggle") || "اختياري",
      description:
        t("receiptOptionalDesc") ||
        "يظهر خيار رفع الإيصال، لكنه لا يمنع إتمام الحجز.",
    },
    {
      value: "disabled",
      title: t("hiddenToggle") || "مخفي",
      description:
        t("receiptDisabledDesc") ||
        "لا يطلب إيصال إطلاقاً ولا يظهر خيار الرفع.",
    },
  ];

  return (
    <form className="card-body" onSubmit={handleSubmit} style={{ gap: 20 }}>
      {/* Top Header with Inline Icon */}
      <div
        style={{
          borderBottom: "1px solid var(--border-light)",
          paddingBottom: 12,
        }}
      >
        <h3
          style={{
            fontSize: "1.1rem",
            fontWeight: 800,
            margin: 0,
            color: "var(--heading)",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Icon
            name="custom-7ee2c360"
            size={20}
            style={{ color: "var(--primary)" }}
          />
          {t("paymentReceipts") || "إيصالات الدفع"}
        </h3>
      </div>

      {/* Subheading / Field Label */}
      <div>
        <label
          className="form-label"
          style={{
            fontSize: "0.86rem",
            fontWeight: 700,
            margin: "0 0 8px",
            display: "block",
          }}
        >
          إيصال الدفع
        </label>

        {/* Selectable Radio Cards Stack */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {receiptOptions.map((opt) => {
            const isSelected = currentMode === opt.value;
            return (
              <div
                key={opt.value}
                onClick={() => {
                  if (canEdit) {
                    setPaymentReceiptsForm({
                      ...paymentReceiptsForm,
                      payment_receipt_mode: opt.value,
                      receipt_mode: opt.value,
                    });
                  }
                }}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 14,
                  padding: "18px 20px",
                  borderRadius: "var(--radius-lg)",
                  border: isSelected
                    ? "1.5px solid var(--primary)"
                    : "1px solid var(--border-light)",
                  background: isSelected
                    ? "var(--surface)"
                    : "var(--surface-alt)",
                  boxShadow: isSelected
                    ? "0 2px 10px rgba(17, 100, 106, 0.08)"
                    : "none",
                  cursor: canEdit ? "pointer" : "default",
                  transition: "all 0.15s ease",
                }}
              >
                <input
                  type="radio"
                  name="payment_receipt_mode"
                  value={opt.value}
                  checked={isSelected}
                  onChange={() => {
                    if (canEdit) {
                      setPaymentReceiptsForm({
                        ...paymentReceiptsForm,
                        payment_receipt_mode: opt.value,
                        receipt_mode: opt.value,
                      });
                    }
                  }}
                  disabled={!canEdit}
                  style={{
                    accentColor: "var(--primary)",
                    width: 18,
                    height: 18,
                    marginTop: 3,
                    cursor: "pointer",
                    flexShrink: 0,
                  }}
                />

                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: "0.92rem",
                      fontWeight: 800,
                      color: "var(--heading)",
                      marginBottom: 4,
                    }}
                  >
                    {opt.title}
                  </div>
                  <div
                    style={{
                      fontSize: "0.82rem",
                      color: "var(--text-secondary)",
                      lineHeight: 1.4,
                    }}
                  >
                    {opt.description}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Primary Save Button */}
      {canEdit && (
        <div
          style={{
            display: "flex",
            justifyContent: "flex-start",
            marginTop: 12,
          }}
        >
          <button
            type="submit"
            className="btn btn-primary btn-md"
            disabled={saving}
            style={{
              padding: "10px 24px",
              borderRadius: "var(--radius-md)",
              fontWeight: 700,
            }}
          >
            {saving ? (
              <>
                <span
                  className="spinner spinner-sm"
                  style={{ borderTopColor: "#fff" }}
                />
                {t("saving") || "جاري الحفظ..."}
              </>
            ) : (
              t("saveChanges") || "حفظ التغييرات"
            )}
          </button>
        </div>
      )}
    </form>
  );
}
