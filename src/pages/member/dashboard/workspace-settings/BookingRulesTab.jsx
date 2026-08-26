import { useLanguage } from "../../../../context/LanguageContext";

export default function BookingRulesTab({
  bookingRulesForm,
  setBookingRulesForm,
  onSave,
  saving,
  canEdit,
}) {
  const { t } = useLanguage();

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(bookingRulesForm);
  };

  // Convert minutes to hours for display (e.g. 120 mins -> 2 hours)
  const minNoticeHours = Math.round(
    (bookingRulesForm.minimum_booking_notice_minutes || 0) / 60,
  );

  const handleMinNoticeHoursChange = (valStr) => {
    const hours = Math.max(0, parseInt(valStr, 10) || 0);
    setBookingRulesForm({
      ...bookingRulesForm,
      minimum_booking_notice_minutes: hours * 60,
    });
  };

  return (
    <form className="card-body" onSubmit={handleSubmit} style={{ gap: 24 }}>
      {/* Top Section Label */}
      <div className="form-group" style={{ marginBottom: 4 }}>
        <label
          className="form-label"
          style={{
            fontSize: "0.92rem",
            fontWeight: 800,
            marginBottom: 8,
            color: "var(--heading)",
            display: "block",
          }}
        >
          {t("setTermsAndRules") ||
            "تعيين الشروط والقواعد المتبعة عند قيام العملاء بحجز مواعيدهم"}
        </label>
        <textarea
          className="form-textarea"
          rows={3}
          value={bookingRulesForm.booking_short_intro || ""}
          onChange={(e) =>
            setBookingRulesForm({
              ...bookingRulesForm,
              booking_short_intro: e.target.value,
            })
          }
          placeholder={
            t("bioPlaceholder") ||
            "مثال: مستشار معتمد بخبرة تزيد عن عشر سنوات في هذا المجال."
          }
          disabled={!canEdit}
          style={{
            fontSize: "0.88rem",
            borderRadius: "var(--radius-md)",
            width: "100%",
          }}
        />
      </div>

      {/* Toggles Row (Online Booking & Auto Confirm) - 2 Columns Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fill, minmax(min(100%, 240px), 1fr))",
          gap: 16,
        }}
      >
        {/* Enable Online Booking Card */}
        <div
          onClick={() => {
            if (canEdit) {
              setBookingRulesForm({
                ...bookingRulesForm,
                booking_enabled: !bookingRulesForm.booking_enabled,
              });
            }
          }}
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 14,
            padding: "18px 20px",
            borderRadius: "var(--radius-lg)",
            border: bookingRulesForm.booking_enabled
              ? "1.5px solid var(--primary)"
              : "1px solid var(--border-light)",
            background: bookingRulesForm.booking_enabled
              ? "var(--surface)"
              : "var(--surface-alt)",
            boxShadow: bookingRulesForm.booking_enabled
              ? "0 2px 10px rgba(17, 100, 106, 0.08)"
              : "none",
            cursor: canEdit ? "pointer" : "default",
            transition: "all 0.15s ease",
          }}
        >
          <input
            type="checkbox"
            checked={!!bookingRulesForm.booking_enabled}
            onChange={(e) => {
              if (canEdit) {
                setBookingRulesForm({
                  ...bookingRulesForm,
                  booking_enabled: e.target.checked,
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
              {t("enableOnlineBooking") || "تفعيل الحجز الإلكتروني"}
            </div>
            <div
              style={{
                fontSize: "0.82rem",
                color: "var(--text-secondary)",
                lineHeight: 1.4,
              }}
            >
              {t("enableOnlineBookingDesc") ||
                "السماح للعملاء بحجز المواعيد أونلاين."}
            </div>
          </div>
        </div>

        {/* Auto Confirm Appointments Card */}
        <div
          onClick={() => {
            if (canEdit) {
              setBookingRulesForm({
                ...bookingRulesForm,
                auto_confirm_appointments:
                  !bookingRulesForm.auto_confirm_appointments,
              });
            }
          }}
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 14,
            padding: "18px 20px",
            borderRadius: "var(--radius-lg)",
            border: bookingRulesForm.auto_confirm_appointments
              ? "1.5px solid var(--primary)"
              : "1px solid var(--border-light)",
            background: bookingRulesForm.auto_confirm_appointments
              ? "var(--surface)"
              : "var(--surface-alt)",
            boxShadow: bookingRulesForm.auto_confirm_appointments
              ? "0 2px 10px rgba(17, 100, 106, 0.08)"
              : "none",
            cursor: canEdit ? "pointer" : "default",
            transition: "all 0.15s ease",
          }}
        >
          <input
            type="checkbox"
            checked={!!bookingRulesForm.auto_confirm_appointments}
            onChange={(e) => {
              if (canEdit) {
                setBookingRulesForm({
                  ...bookingRulesForm,
                  auto_confirm_appointments: e.target.checked,
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
              {t("autoConfirmAppointments") || "تأكيد المواعيد تلقائياً"}
            </div>
            <div
              style={{
                fontSize: "0.82rem",
                color: "var(--text-secondary)",
                lineHeight: 1.4,
              }}
            >
              {t("autoConfirmAppointmentsDesc") ||
                "قبول الحجوزات فور إنشائها بدون مراجعة."}
            </div>
          </div>
        </div>
      </div>

      {/* 4 Numerical Rules Grid - 2 Rows of 2 Columns */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fill, minmax(min(100%, 200px), 1fr))",
          gap: 14,
        }}
      >
        <div>
          <label
            className="form-label"
            style={{
              fontSize: "0.82rem",
              fontWeight: 700,
              marginBottom: 6,
              display: "block",
            }}
          >
            {t("bufferBeforeMinutes") || "فارق زمني قبل الحجز (دقائق)"}
          </label>
          <input
            type="number"
            min="0"
            className="form-input"
            value={bookingRulesForm.default_buffer_before_minutes ?? 0}
            onChange={(e) =>
              setBookingRulesForm({
                ...bookingRulesForm,
                default_buffer_before_minutes: parseInt(e.target.value) || 0,
              })
            }
            disabled={!canEdit}
            style={{
              textAlign: "center",
              height: 42,
              width: "100%",
              borderRadius: "var(--radius-md)",
            }}
          />
        </div>

        <div>
          <label
            className="form-label"
            style={{
              fontSize: "0.82rem",
              fontWeight: 700,
              marginBottom: 6,
              display: "block",
            }}
          >
            {t("bufferAfterMinutes") || "فارق زمني بعد الحجز (دقائق)"}
          </label>
          <input
            type="number"
            min="0"
            className="form-input"
            value={bookingRulesForm.default_buffer_after_minutes ?? 0}
            onChange={(e) =>
              setBookingRulesForm({
                ...bookingRulesForm,
                default_buffer_after_minutes: parseInt(e.target.value) || 0,
              })
            }
            disabled={!canEdit}
            style={{
              textAlign: "center",
              height: 42,
              width: "100%",
              borderRadius: "var(--radius-md)",
            }}
          />
        </div>

        <div>
          <label
            className="form-label"
            style={{
              fontSize: "0.82rem",
              fontWeight: 700,
              marginBottom: 6,
              display: "block",
            }}
          >
            {t("minNoticeHoursLabel") ||
              "الحد الأدنى للإشعار المسبق (بالساعات)"}
          </label>
          <input
            type="number"
            min="0"
            className="form-input"
            value={minNoticeHours}
            onChange={(e) => handleMinNoticeHoursChange(e.target.value)}
            disabled={!canEdit}
            style={{
              textAlign: "center",
              height: 42,
              width: "100%",
              borderRadius: "var(--radius-md)",
            }}
          />
        </div>

        <div>
          <label
            className="form-label"
            style={{
              fontSize: "0.82rem",
              fontWeight: 700,
              marginBottom: 6,
              display: "block",
            }}
          >
            {t("maxAdvanceDaysLabel") || "الحد الأقصى للحجز المسبق (بالأيام)"}
          </label>
          <input
            type="number"
            min="1"
            max="365"
            className="form-input"
            value={bookingRulesForm.maximum_booking_days ?? 30}
            onChange={(e) =>
              setBookingRulesForm({
                ...bookingRulesForm,
                maximum_booking_days: parseInt(e.target.value) || 30,
              })
            }
            disabled={!canEdit}
            style={{
              textAlign: "center",
              height: 42,
              width: "100%",
              borderRadius: "var(--radius-md)",
            }}
          />
        </div>
      </div>

      {/* Primary Save Button */}
      {canEdit && (
        <div
          style={{
            display: "flex",
            justifyContent: "flex-start",
            marginTop: 8,
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
