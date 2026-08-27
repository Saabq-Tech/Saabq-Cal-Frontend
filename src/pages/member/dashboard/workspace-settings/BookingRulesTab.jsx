import { useLanguage } from "../../../../context/LanguageContext";
import Icon from "../../../../components/common/Icon";

export default function BookingRulesTab({
  bookingRulesForm,
  setBookingRulesForm,
  onSave,
  saving,
  canEdit,
}) {
  const { t, isRTL } = useLanguage();

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

      {/* 4 Numerical Rules Grid - Perfectly Aligned Inputs Baseline */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 16,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <label
            className="form-label"
            style={{
              fontSize: "0.82rem",
              fontWeight: 700,
              marginBottom: 8,
              minHeight: 38,
              display: "flex",
              alignItems: "flex-end",
              color: "var(--heading)",
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

        <div style={{ display: "flex", flexDirection: "column" }}>
          <label
            className="form-label"
            style={{
              fontSize: "0.82rem",
              fontWeight: 700,
              marginBottom: 8,
              minHeight: 38,
              display: "flex",
              alignItems: "flex-end",
              color: "var(--heading)",
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

        <div style={{ display: "flex", flexDirection: "column" }}>
          <label
            className="form-label"
            style={{
              fontSize: "0.82rem",
              fontWeight: 700,
              marginBottom: 8,
              minHeight: 38,
              display: "flex",
              alignItems: "flex-end",
              color: "var(--heading)",
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

        <div style={{ display: "flex", flexDirection: "column" }}>
          <label
            className="form-label"
            style={{
              fontSize: "0.82rem",
              fontWeight: 700,
              marginBottom: 8,
              minHeight: 38,
              display: "flex",
              alignItems: "flex-end",
              color: "var(--heading)",
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

      {/* SECTION: Feature Highlights Cards */}
      <div
        style={{
          marginTop: 24,
          paddingTop: 20,
          borderTop: "1px solid var(--border-light)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 18,
          }}
        >
          <h3
            style={{
              fontSize: "1.05rem",
              fontWeight: 700,
              margin: 0,
              color: "var(--heading)",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Icon
              name="sparkles"
              size={18}
              style={{ color: "var(--primary)" }}
            />
            <span>
              {t("featureHighlightsCards") || "بطاقات مميزات مساحة العمل"}
            </span>
          </h3>

          <button
            type="button"
            onClick={() => {
              const current = Array.isArray(bookingRulesForm.feature_highlights)
                ? bookingRulesForm.feature_highlights
                : [];
              setBookingRulesForm({
                ...bookingRulesForm,
                feature_highlights: [
                  ...current,
                  {
                    title: "",
                    icon: "sparkles",
                    description: "",
                    image_url: "",
                  },
                ],
              });
            }}
            disabled={!canEdit}
            className="btn btn-secondary btn-sm"
          >
            + {t("addFeatureHighlight") || "إضافة بطاقة ميزة"}
          </button>
        </div>

        {Array.isArray(bookingRulesForm.feature_highlights) &&
        bookingRulesForm.feature_highlights.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {bookingRulesForm.feature_highlights.map((item, idx) => (
              <div
                key={idx}
                style={{
                  background: "var(--surface-alt)",
                  padding: 16,
                  borderRadius: 16,
                  border: "1px solid var(--border)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.85rem",
                      fontWeight: 700,
                      color: "var(--primary)",
                    }}
                  >
                    #{idx + 1} {t("featureHighlightCard") || "بطاقة ميزة"}
                  </span>

                  <button
                    type="button"
                    onClick={() => {
                      const current = Array.isArray(
                        bookingRulesForm.feature_highlights,
                      )
                        ? bookingRulesForm.feature_highlights
                        : [];
                      setBookingRulesForm({
                        ...bookingRulesForm,
                        feature_highlights: current.filter((_, i) => i !== idx),
                      });
                    }}
                    disabled={!canEdit}
                    className="btn btn-secondary btn-sm"
                    style={{
                      color: "var(--error)",
                      padding: "4px 10px",
                    }}
                  >
                    <Icon name="x" size={16} />
                  </button>
                </div>

                <div className="grid grid-2" style={{ gap: 14 }}>
                  <div className="form-group mb-0">
                    <label
                      className="form-label"
                      style={{ fontSize: "0.82rem" }}
                    >
                      {t("featureTitle") || "عنوان الميزة (Title)"}
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={item.title || ""}
                      onChange={(e) => {
                        const current = Array.isArray(
                          bookingRulesForm.feature_highlights,
                        )
                          ? bookingRulesForm.feature_highlights
                          : [];
                        const updated = current.map((f, i) =>
                          i === idx ? { ...f, title: e.target.value } : f,
                        );
                        setBookingRulesForm({
                          ...bookingRulesForm,
                          feature_highlights: updated,
                        });
                      }}
                      disabled={!canEdit}
                      placeholder={
                        isRTL
                          ? "مثال: أطباء ومتخصصون معتمدون"
                          : "Example: Certified doctors & specialists"
                      }
                    />
                  </div>

                  <div className="form-group mb-0">
                    <label
                      className="form-label"
                      style={{ fontSize: "0.82rem" }}
                    >
                      {t("cardIcon") || "رمز الأيقونة (Icon)"}
                    </label>
                    <select
                      className="form-select"
                      value={item.icon || "sparkles"}
                      onChange={(e) => {
                        const current = Array.isArray(
                          bookingRulesForm.feature_highlights,
                        )
                          ? bookingRulesForm.feature_highlights
                          : [];
                        const updated = current.map((f, i) =>
                          i === idx ? { ...f, icon: e.target.value } : f,
                        );
                        setBookingRulesForm({
                          ...bookingRulesForm,
                          feature_highlights: updated,
                        });
                      }}
                      disabled={!canEdit}
                    >
                      <option value="sparkles">
                        ✨ {t("sparkles") || "تمييز وسحر"}
                      </option>
                      <option value="shield">
                        🛡️ {t("shield") || "حماية وخصوصية"}
                      </option>
                      <option value="clock">
                        ⏰ {t("clock") || "وقت وسرعة"}
                      </option>
                      <option value="users">
                        👥 {t("users") || "فريق عمل"}
                      </option>
                      <option value="star">
                        ⭐ {t("star") || "نجمة وتقييم"}
                      </option>
                      <option value="phone">
                        📞 {t("phone") || "هاتف وتواصل"}
                      </option>
                      <option value="map-pin">
                        📍 {t("mapPin") || "موقع جغرافي"}
                      </option>
                      <option value="briefcase">
                        💼 {t("briefcase") || "حقيبة عمل"}
                      </option>
                      <option value="check">
                        ✅ {t("check") || "تأكيد وصحة"}
                      </option>
                    </select>
                  </div>
                </div>

                <div className="form-group mb-0">
                  <label className="form-label" style={{ fontSize: "0.82rem" }}>
                    {t("featureDescription") || "وصف الميزة (Description)"}
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={item.description || ""}
                    onChange={(e) => {
                      const current = Array.isArray(
                        bookingRulesForm.feature_highlights,
                      )
                        ? bookingRulesForm.feature_highlights
                        : [];
                      const updated = current.map((f, i) =>
                        i === idx ? { ...f, description: e.target.value } : f,
                      );
                      setBookingRulesForm({
                        ...bookingRulesForm,
                        feature_highlights: updated,
                      });
                    }}
                    disabled={!canEdit}
                    placeholder={
                      isRTL
                        ? "مثال: طاقم طبي متكامل لتقديم أعلى مستويات الرعاية."
                        : "Example: Full medical team providing top care."
                    }
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p
            style={{
              color: "var(--text-secondary)",
              fontSize: "0.88rem",
              fontStyle: "italic",
            }}
          >
            {t("noFeatureHighlightsYet") || "لم يتم إضافة بطاقات مميزات بعد."}
          </p>
        )}
      </div>

      {/* SECTION: Client Testimonials */}
      <div
        style={{
          marginTop: 24,
          paddingTop: 20,
          borderTop: "1px solid var(--border-light)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 18,
          }}
        >
          <h3
            style={{
              fontSize: "1.05rem",
              fontWeight: 700,
              margin: 0,
              color: "var(--heading)",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Icon name="star" size={18} style={{ color: "var(--primary)" }} />
            <span>
              {t("clientTestimonials") ||
                "آراء وانطباعات العملاء (Testimonials)"}
            </span>
          </h3>

          <button
            type="button"
            onClick={() => {
              const current = Array.isArray(bookingRulesForm.testimonials)
                ? bookingRulesForm.testimonials
                : [];
              setBookingRulesForm({
                ...bookingRulesForm,
                testimonials: [
                  ...current,
                  {
                    client_name: "",
                    client_role: "",
                    quote: "",
                    rating: 5,
                    avatar_url: "",
                  },
                ],
              });
            }}
            disabled={!canEdit}
            className="btn btn-secondary btn-sm"
          >
            + {t("addTestimonial") || "إضافة رأي عميل"}
          </button>
        </div>

        {Array.isArray(bookingRulesForm.testimonials) &&
        bookingRulesForm.testimonials.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {bookingRulesForm.testimonials.map((item, idx) => (
              <div
                key={idx}
                style={{
                  background: "var(--surface-alt)",
                  padding: 16,
                  borderRadius: 16,
                  border: "1px solid var(--border)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.85rem",
                      fontWeight: 700,
                      color: "var(--primary)",
                    }}
                  >
                    #{idx + 1} {t("testimonial") || "رأي عميل"}
                  </span>

                  <button
                    type="button"
                    onClick={() => {
                      const current = Array.isArray(
                        bookingRulesForm.testimonials,
                      )
                        ? bookingRulesForm.testimonials
                        : [];
                      setBookingRulesForm({
                        ...bookingRulesForm,
                        testimonials: current.filter((_, i) => i !== idx),
                      });
                    }}
                    disabled={!canEdit}
                    className="btn btn-secondary btn-sm"
                    style={{
                      color: "var(--error)",
                      padding: "4px 10px",
                    }}
                  >
                    <Icon name="x" size={16} />
                  </button>
                </div>

                <div className="grid grid-2" style={{ gap: 14 }}>
                  <div className="form-group mb-0">
                    <label
                      className="form-label"
                      style={{ fontSize: "0.82rem" }}
                    >
                      {t("clientName") || "اسم العميل (Client Name)"}
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={item.client_name || ""}
                      onChange={(e) => {
                        const current = Array.isArray(
                          bookingRulesForm.testimonials,
                        )
                          ? bookingRulesForm.testimonials
                          : [];
                        const updated = current.map((t, i) =>
                          i === idx ? { ...t, client_name: e.target.value } : t,
                        );
                        setBookingRulesForm({
                          ...bookingRulesForm,
                          testimonials: updated,
                        });
                      }}
                      disabled={!canEdit}
                      placeholder={
                        isRTL ? "مثال: د. أحمد علي" : "Example: Dr. Ahmed Ali"
                      }
                    />
                  </div>

                  <div className="form-group mb-0">
                    <label
                      className="form-label"
                      style={{ fontSize: "0.82rem" }}
                    >
                      {t("clientRole") || "الصفة / الوظيفة (Role / Company)"}
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={item.client_role || ""}
                      onChange={(e) => {
                        const current = Array.isArray(
                          bookingRulesForm.testimonials,
                        )
                          ? bookingRulesForm.testimonials
                          : [];
                        const updated = current.map((t, i) =>
                          i === idx ? { ...t, client_role: e.target.value } : t,
                        );
                        setBookingRulesForm({
                          ...bookingRulesForm,
                          testimonials: updated,
                        });
                      }}
                      disabled={!canEdit}
                      placeholder={
                        isRTL
                          ? "مثال: مدير شركة التقنية"
                          : "Example: Tech Company Director"
                      }
                    />
                  </div>
                </div>

                <div className="form-group mb-0">
                  <label className="form-label" style={{ fontSize: "0.82rem" }}>
                    {t("testimonialQuote") || "نص التقييم (Quote)"}
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={item.quote || ""}
                    onChange={(e) => {
                      const current = Array.isArray(
                        bookingRulesForm.testimonials,
                      )
                        ? bookingRulesForm.testimonials
                        : [];
                      const updated = current.map((t, i) =>
                        i === idx ? { ...t, quote: e.target.value } : t,
                      );
                      setBookingRulesForm({
                        ...bookingRulesForm,
                        testimonials: updated,
                      });
                    }}
                    disabled={!canEdit}
                    placeholder={
                      isRTL
                        ? "مثال: تجربة رائعة وفريق محترف أنصح بالتعامل معهم."
                        : "Example: Great experience and professional team."
                    }
                  />
                </div>

                <div className="form-group mb-0">
                  <label className="form-label" style={{ fontSize: "0.82rem" }}>
                    {t("rating") || "التقييم"}
                  </label>
                  <div style={{ display: "flex", gap: 4 }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => {
                          const current = Array.isArray(
                            bookingRulesForm.testimonials,
                          )
                            ? bookingRulesForm.testimonials
                            : [];
                          const updated = current.map((t, i) =>
                            i === idx ? { ...t, rating: star } : t,
                          );
                          setBookingRulesForm({
                            ...bookingRulesForm,
                            testimonials: updated,
                          });
                        }}
                        disabled={!canEdit}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: canEdit ? "pointer" : "default",
                          padding: 2,
                          color:
                            star <= (item.rating || 0)
                              ? "#f59e0b"
                              : "var(--border)",
                        }}
                        title={`${star} / 5`}
                      >
                        <Icon name="star" size={20} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p
            style={{
              color: "var(--text-secondary)",
              fontSize: "0.88rem",
              fontStyle: "italic",
            }}
          >
            {t("noClientTestimonialsYet") || "لم يتم إضافة آراء عملاء بعد."}
          </p>
        )}
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
