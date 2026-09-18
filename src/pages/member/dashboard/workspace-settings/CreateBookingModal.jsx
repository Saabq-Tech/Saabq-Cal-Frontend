import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "../../../../context/AuthContext";
import { usePermissions } from "../../../../hooks/usePermissions";
import { useLanguage } from "../../../../context/LanguageContext";
import { useToast } from "../../../../context/ToastContext";
import client, { endpoints } from "../../../../api/client";
import Icon from "../../../../components/common/Icon";
import SearchableSelect from "../../../../components/common/SearchableSelect";
import { useCustomerLabel } from "../../../../hooks/useCustomerLabel";
import { getLimitInfo } from "../../../../utils/planLimits";
import { PlanLimitBanner } from "../../../../components/common/PlanLimitAlert";
import { getCurrencySymbol } from "../../../../utils/currency";
export default function CreateBookingModal({ isOpen, onClose, onSuccess }) {
  const { isOwner, canCreateBookings } = usePermissions();
  const { t, lang } = useLanguage();
  const toast = useToast();
  const { user } = useAuth();
  const limitInfo = getLimitInfo(user, "appointments");

  const {
    isCustom,
    customerSingular: custSingular,
    createBookingTitle,
    existingCustomerTab,
    newCustomerTab,
    selectCustomerPrompt,
    searchCustomerPrompt,
    customerNameLabel,
  } = useCustomerLabel();

  const [customerMode, setCustomerMode] = useState("existing"); // 'existing' or 'new'

  // Data sources
  const [services, setServices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [members, setMembers] = useState([]);
  const [loadingData, setLoadingData] = useState(false);

  // Form State
  const [serviceId, setServiceId] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [workspaceMemberId, setWorkspaceMemberId] = useState("");
  const [selectedDate, setSelectedDate] = useState(
    () => new Date().toISOString().split("T")[0],
  );
  const [startsAt, setStartsAt] = useState("");
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [manualTimeMode, setManualTimeMode] = useState(false);
  const [status, setStatus] = useState("confirmed");
  const [notes, setNotes] = useState("");
  const [bypassRules, setBypassRules] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  const formatTranslatable = (val) => {
    if (val === null || val === undefined) return "";
    if (typeof val === "string" || typeof val === "number") return String(val);
    if (typeof val === "object") {
      const res =
        val[lang] ||
        val.ar ||
        val.en ||
        val.name ||
        val.title ||
        val.code ||
        val.symbol;
      return typeof res === "string" || typeof res === "number"
        ? String(res)
        : "";
    }
    return "";
  };

  const renderFieldError = (fieldName) => {
    if (!fieldErrors || !fieldErrors[fieldName]) return null;
    const msgs = Array.isArray(fieldErrors[fieldName])
      ? fieldErrors[fieldName]
      : [fieldErrors[fieldName]];
    const text = msgs
      .map((m) => {
        if (m === "api.field_required")
          return t("fieldRequired") || "هذا الحقل مطلوب";
        return t(m) || m;
      })
      .join(" ");
    return (
      <span
        style={{
          color: "#ef4444",
          fontSize: "0.78rem",
          fontWeight: 600,
          marginTop: 4,
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
        }}
      >
        <Icon name="alert-triangle" size={13} />
        <span>{text}</span>
      </span>
    );
  };

  useEffect(() => {
    if (!isOpen) return;

    const todayStr = new Date().toISOString().split("T")[0];
    setSelectedDate(todayStr);
    setSelectedSlot("");
    setSlots([]);
    setManualTimeMode(false);
    setStartsAt("");
    setErrorMessage(null);
    setFieldErrors({});
    setServiceId("");
    setCustomerId("");
    setCustomerName("");
    setCustomerEmail("");
    setCustomerPhone("");
    setWorkspaceMemberId("");
    setStatus("confirmed");
    setNotes("");
    setBypassRules(false);

    const fetchData = async () => {
      setLoadingData(true);
      try {
        const [servicesRes, customersRes, membersRes] =
          await Promise.allSettled([
            client.get(endpoints.workspaceServices),
            client.get(endpoints.workspaceCustomers, {
              params: { per_page: 1000 },
            }),
            client.get(endpoints.workspaceMembers),
          ]);

        if (servicesRes.status === "fulfilled") {
          const list = servicesRes.value.data?.data || [];
          setServices(list);
          if (list.length > 0) {
            setServiceId(list[0].id);
          }
        }
        if (customersRes.status === "fulfilled") {
          setCustomers(customersRes.value.data?.data || []);
        }
        if (membersRes.status === "fulfilled") {
          setMembers(membersRes.value.data?.data || []);
        }
      } catch (err) {
        console.error("Failed to fetch booking metadata options:", err);
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, [isOpen]);

  // Fetch available slots whenever service, date, or assigned member changes
  useEffect(() => {
    if (!isOpen || !serviceId || !selectedDate) {
      setSlots([]);
      return;
    }

    let isMounted = true;
    const fetchSlots = async () => {
      setLoadingSlots(true);
      try {
        const params = { date: selectedDate };
        if (workspaceMemberId) {
          params.workspace_member_id = Number(workspaceMemberId);
        }
        const res = await client.get(
          endpoints.workspaceServiceSlots(serviceId),
          { params },
        );
        if (isMounted) {
          const slotList = res.data?.data || [];
          setSlots(slotList);
          if (selectedSlot && !manualTimeMode) {
            const match = slotList.find(
              (s) =>
                s.start_time === selectedSlot &&
                (s.is_available || bypassRules),
            );
            if (!match) {
              setSelectedSlot("");
              setStartsAt("");
            }
          }
        }
      } catch (err) {
        if (isMounted) {
          console.error("Failed to load service slots:", err);
          setSlots([]);
        }
      } finally {
        if (isMounted) {
          setLoadingSlots(false);
        }
      }
    };

    fetchSlots();

    return () => {
      isMounted = false;
    };
  }, [
    isOpen,
    serviceId,
    selectedDate,
    workspaceMemberId,
    bypassRules,
    manualTimeMode,
    selectedSlot,
  ]);

  const handleSlotSelect = (slot) => {
    setSelectedSlot(slot.start_time);
    setStartsAt(`${selectedDate} ${slot.start_time}:00`);
    if (fieldErrors.starts_at) {
      setFieldErrors((prev) => ({ ...prev, starts_at: null }));
    }
  };

  if (!isOpen || (!isOwner && !canCreateBookings)) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!serviceId) {
      setErrorMessage(t("selectServicePrompt") || "من فضلك اختار الخدمة");
      return;
    }

    if (!startsAt) {
      setErrorMessage(t("selectTimePrompt") || "يرجى اختيار وقت الموعد");
      return;
    }

    if (customerMode === "existing" && !customerId) {
      setErrorMessage(
        isCustom
          ? lang === "ar"
            ? `يرجى اختيار ${custSingular}`
            : `Please select ${custSingular}`
          : t("selectCustomerPrompt") || "يرجى اختيار العميل",
      );
      return;
    }

    if (customerMode === "new" && !customerName.trim()) {
      setErrorMessage(
        isCustom
          ? lang === "ar"
            ? `يرجى إدخال اسم ${custSingular} والبريد الإلكتروني`
            : `Please enter ${custSingular} name and email`
          : t("enterCustomerDetails") ||
              "من فضلك اكتب اسم العميل والبريد الإلكتروني",
      );
      return;
    }

    const payload = {
      service_id: Number(serviceId),
      starts_at: startsAt.replace("T", " "),
      status: status,
      notes: notes || null,
      workspace_member_id: workspaceMemberId ? Number(workspaceMemberId) : null,
      bypass_booking_rules: bypassRules,
      source: "admin_manual",
    };

    if (customerMode === "existing") {
      payload.customer_id = Number(customerId);
    } else {
      payload.customer_name = customerName.trim();
      payload.customer_email = customerEmail.trim() || null;
      payload.customer_phone = customerPhone.trim() || null;
    }

    try {
      setSubmitting(true);
      await client.post(endpoints.workspaceBookings, payload);

      toast.success(
        isCustom
          ? lang === "ar"
            ? `تم حجز الموعد لـ ${custSingular} بنجاح!`
            : `Appointment booked for ${custSingular} successfully!`
          : t("bookingCreatedSuccess") || "تم حجز الموعد للعميل بنجاح!",
      );
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error("Create booking failed:", err);
      const errorsObj = err.response?.data?.errors;
      if (errorsObj) {
        setFieldErrors(errorsObj);
        const msgs = Object.values(errorsObj)
          .flat()
          .map((m) => {
            if (m === "api.field_required")
              return t("fieldRequired") || "هذا الحقل مطلوب";
            return t(m) || m;
          });
        setErrorMessage(msgs.join(" "));
      } else {
        const rawMsg = err.response?.data?.message;
        const msg =
          rawMsg === "api.field_required"
            ? t("fieldRequired") || "هذا الحقل مطلوب"
            : t(rawMsg) ||
              rawMsg ||
              t("bookingCreateError") ||
              "فشل إضافة الحجز";
        setErrorMessage(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-card modal-md animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
            paddingBottom: 12,
            borderBottom: "1px solid var(--border-light)",
          }}
        >
          <div>
            <h3
              style={{
                margin: 0,
                fontSize: "1.15rem",
                fontWeight: 800,
                color: "var(--heading)",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Icon name="calendar" size={20} />
              <span>{createBookingTitle}</span>
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              border: "none",
              background: "transparent",
              color: "var(--muted)",
              cursor: "pointer",
              padding: 6,
              borderRadius: 8,
            }}
          >
            <Icon name="x" size={20} />
          </button>
        </div>

        <PlanLimitBanner type="appointments" limitInfo={limitInfo} />

        {/* Error Banner */}
        {errorMessage && (
          <div
            style={{
              padding: "12px 16px",
              background: "rgba(239, 68, 68, 0.12)",
              color: "#dc2626",
              borderRadius: "var(--radius-md)",
              fontSize: "0.86rem",
              fontWeight: 600,
              marginBottom: 18,
              border: "1px solid rgba(239, 68, 68, 0.2)",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Icon name="alert-triangle" size={16} />
            <span>{errorMessage}</span>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: 16 }}
        >
          {/* Service Selection */}
          <div className="form-group">
            <label
              className="form-label"
              style={{ fontWeight: 700, fontSize: "0.86rem", marginBottom: 6 }}
            >
              {t("serviceHeader") || "الخدمة"}{" "}
              <span style={{ color: "red" }}>*</span>
            </label>
            <select
              className="form-input"
              value={serviceId}
              onChange={(e) => setServiceId(e.target.value)}
              required
              disabled={loadingData}
            >
              <option value="">
                {t("selectServicePrompt") || "اختر الخدمة..."}
              </option>
              {services.map((s) => {
                const sTitle = formatTranslatable(s.name || s.title);
                const currSym = getCurrencySymbol(
                  s.currency_detail ||
                    s.currency ||
                    user?.workspace?.currency ||
                    "EGP",
                  lang === "ar",
                );
                return (
                  <option key={s.id} value={s.id}>
                    {sTitle} ({s.duration_minutes || s.duration || 30}{" "}
                    {t("mins") || (lang === "ar" ? "دقيقة" : "mins")} -{" "}
                    {s.price || 0} {currSym})
                  </option>
                );
              })}
            </select>
          </div>

          {/* Customer Selection Mode */}
          <div className="form-group">
            <label
              className="form-label"
              style={{ fontWeight: 700, fontSize: "0.86rem", marginBottom: 6 }}
            >
              {isCustom ? custSingular : t("customerHeader") || custSingular}{" "}
              <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(min(100%, 140px), 1fr))",
                gap: 8,
                padding: 4,
                background: "var(--surface-alt)",
                borderRadius: "var(--radius-md)",
                marginBottom: 10,
              }}
            >
              <button
                type="button"
                onClick={() => setCustomerMode("existing")}
                style={{
                  padding: "8px 12px",
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  background:
                    customerMode === "existing"
                      ? "var(--primary)"
                      : "var(--surface)",
                  color:
                    customerMode === "existing"
                      ? "#ffffff"
                      : "var(--text-secondary)",
                  border:
                    customerMode === "existing"
                      ? "1px solid var(--primary)"
                      : "1px solid var(--border-light)",
                  borderRadius: "var(--radius-md)",
                  boxShadow:
                    customerMode === "existing"
                      ? "0 2px 8px rgba(17, 100, 106, 0.25)"
                      : "none",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                <Icon name="user" size={14} />
                <span>{existingCustomerTab}</span>
              </button>
              <button
                type="button"
                onClick={() => setCustomerMode("new")}
                style={{
                  padding: "8px 12px",
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  background:
                    customerMode === "new"
                      ? "var(--primary)"
                      : "var(--surface)",
                  color:
                    customerMode === "new"
                      ? "#ffffff"
                      : "var(--text-secondary)",
                  border:
                    customerMode === "new"
                      ? "1px solid var(--primary)"
                      : "1px solid var(--border-light)",
                  borderRadius: "var(--radius-md)",
                  boxShadow:
                    customerMode === "new"
                      ? "0 2px 8px rgba(17, 100, 106, 0.25)"
                      : "none",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                <Icon name="plus" size={14} />
                <span>{newCustomerTab}</span>
              </button>
            </div>

            {customerMode === "existing" ? (
              <div>
                <SearchableSelect
                  value={customerId}
                  onChange={(val) => setCustomerId(val)}
                  options={customers.map((c) => {
                    const cName = formatTranslatable(c.name);
                    const cEmail = formatTranslatable(c.email);
                    return {
                      value: c.id,
                      label: `${cName}${cEmail ? ` (${cEmail})` : ""}`,
                    };
                  })}
                  placeholder={selectCustomerPrompt}
                  searchPlaceholder={searchCustomerPrompt}
                  disabled={loadingData}
                  error={Boolean(fieldErrors.customer_id)}
                />
                {renderFieldError("customer_id")}
              </div>
            ) : (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 10 }}
              >
                <div>
                  <label
                    className="form-label"
                    style={{
                      fontWeight: 700,
                      fontSize: "0.82rem",
                      marginBottom: 4,
                      display: "block",
                    }}
                  >
                    {customerNameLabel}{" "}
                    <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder={customerNameLabel}
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    required={customerMode === "new"}
                    style={{
                      border: fieldErrors.customer_name
                        ? "1px solid #ef4444"
                        : undefined,
                    }}
                  />
                  {renderFieldError("customer_name")}
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fit, minmax(min(100%, 200px), 1fr))",
                    gap: 10,
                  }}
                >
                  <div>
                    <label
                      className="form-label"
                      style={{
                        fontWeight: 700,
                        fontSize: "0.82rem",
                        marginBottom: 4,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <span>{t("email") || "البريد الإلكتروني"}</span>
                      <span
                        style={{
                          color: "var(--text-muted)",
                          fontSize: "0.74rem",
                          fontWeight: 500,
                        }}
                      >
                        ({t("emailOptional") || "اختياري"})
                      </span>
                    </label>
                    <input
                      type="email"
                      className="form-input"
                      placeholder={
                        t("emailOptional") || "البريد الإلكتروني (اختياري)"
                      }
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      style={{
                        border: fieldErrors.customer_email
                          ? "1px solid #ef4444"
                          : undefined,
                      }}
                    />
                    {!customerEmail && (
                      <span
                        style={{
                          fontSize: "0.74rem",
                          color: "var(--text-secondary)",
                          marginTop: 4,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <Icon name="info" size={12} />
                        <span>
                          {t("manualTempBookingNotice") ||
                            "حجز يدوي لعميل مؤقت بدون إرسال بريد أو مزامنة تقويم"}
                        </span>
                      </span>
                    )}
                    {renderFieldError("customer_email")}
                  </div>
                  <div>
                    <label
                      className="form-label"
                      style={{
                        fontWeight: 700,
                        fontSize: "0.82rem",
                        marginBottom: 4,
                        display: "block",
                      }}
                    >
                      {t("phone") || "رقم الجوال"}
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder={t("phone") || "رقم الجوال"}
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      style={{
                        border: fieldErrors.customer_phone
                          ? "1px solid #ef4444"
                          : undefined,
                      }}
                    />
                    {renderFieldError("customer_phone")}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Member & Date Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(min(100%, 220px), 1fr))",
              gap: 12,
            }}
          >
            <div className="form-group">
              <label
                className="form-label"
                style={{
                  fontWeight: 700,
                  fontSize: "0.86rem",
                  marginBottom: 6,
                }}
              >
                {t("member") || "الموظف / مقدم الخدمة"}
              </label>
              <select
                className="form-input"
                value={workspaceMemberId}
                onChange={(e) => setWorkspaceMemberId(e.target.value)}
                disabled={loadingData}
              >
                <option value="">
                  {t("selectStaffPrompt") || "اختر الموظف..."}
                </option>
                {members.map((m) => {
                  const mName = formatTranslatable(m.name || m.user?.name);
                  const rName =
                    formatTranslatable(m.role?.name || m.role?.title) ||
                    t("member") ||
                    "عضو";
                  return (
                    <option key={m.id} value={m.id}>
                      {mName} ({rName})
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="form-group">
              <label
                className="form-label"
                style={{
                  fontWeight: 700,
                  fontSize: "0.86rem",
                  marginBottom: 6,
                }}
              >
                {t("bookingDateHeader") || "تاريخ الحجز"}{" "}
                <span style={{ color: "red" }}>*</span>
              </label>
              <input
                type="date"
                className="form-input"
                value={selectedDate}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setSelectedSlot("");
                  if (!manualTimeMode) {
                    setStartsAt("");
                  }
                }}
                required
              />
            </div>
          </div>

          {/* Service Available Slots Picker */}
          <div
            className="form-group"
            style={{
              padding: 12,
              background: "var(--surface-alt)",
              borderRadius: "var(--radius-md)",
              border: fieldErrors.starts_at
                ? "1px solid #ef4444"
                : "1px solid var(--border-light)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 10,
              }}
            >
              <label
                style={{
                  fontWeight: 700,
                  fontSize: "0.86rem",
                  color: "var(--heading)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Icon name="clock" size={15} />
                <span>
                  {t("availableTimeSlots") || "الأوقات المتاحة للخدمة"}
                </span>
                <span style={{ color: "red" }}>*</span>
              </label>
              <button
                type="button"
                onClick={() => setManualTimeMode(!manualTimeMode)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--primary)",
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  textDecoration: "underline",
                }}
              >
                {manualTimeMode
                  ? t("availableSlotsMode") || "عرض الأوقات المتاحة"
                  : t("manualTimeEntry") || "تحديد وقت يدوي"}
              </button>
            </div>

            {manualTimeMode ? (
              <div>
                <input
                  type="datetime-local"
                  className="form-input"
                  value={startsAt}
                  onChange={(e) => setStartsAt(e.target.value)}
                  required
                />
              </div>
            ) : !serviceId ? (
              <div
                style={{
                  padding: 12,
                  textAlign: "center",
                  fontSize: "0.82rem",
                  color: "var(--text-muted)",
                }}
              >
                {t("selectServiceFirst") ||
                  "يرجى اختيار الخدمة أولاً لعرض الأوقات المتاحة"}
              </div>
            ) : loadingSlots ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  padding: "16px 8px",
                  fontSize: "0.82rem",
                  color: "var(--text-secondary)",
                }}
              >
                <Icon name="loader" size={16} className="animate-spin" />
                <span>
                  {t("loadingSlots") || "جاري جلب الأوقات المتاحة..."}
                </span>
              </div>
            ) : slots.length === 0 ? (
              <div
                style={{
                  padding: 12,
                  textAlign: "center",
                  fontSize: "0.82rem",
                  color: "var(--text-secondary)",
                  background: "var(--surface)",
                  borderRadius: "var(--radius-sm, 6px)",
                }}
              >
                {t("noSlotsAvailableOnDate") ||
                  "لا توجد أوقات متاحة في هذا اليوم"}
              </div>
            ) : (
              <div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))",
                    gap: 8,
                    maxHeight: 160,
                    overflowY: "auto",
                    padding: 2,
                  }}
                >
                  {slots.map((s) => {
                    const isSelected = selectedSlot === s.start_time;
                    const isAvail = s.is_available || bypassRules;
                    return (
                      <button
                        key={s.start_time}
                        type="button"
                        disabled={!isAvail}
                        onClick={() => handleSlotSelect(s)}
                        style={{
                          padding: "7px 4px",
                          borderRadius: "var(--radius-sm, 6px)",
                          border: isSelected
                            ? "2px solid var(--primary)"
                            : "1px solid var(--border-light)",
                          background: isSelected
                            ? "var(--primary)"
                            : isAvail
                              ? "var(--surface)"
                              : "rgba(0, 0, 0, 0.04)",
                          color: isSelected
                            ? "#ffffff"
                            : isAvail
                              ? "var(--heading)"
                              : "var(--text-muted)",
                          fontSize: "0.8rem",
                          fontWeight: isSelected ? 800 : 600,
                          cursor: isAvail ? "pointer" : "not-allowed",
                          opacity: isAvail ? 1 : 0.4,
                          textDecoration: isAvail ? "none" : "line-through",
                          transition: "all 0.15s ease",
                        }}
                      >
                        {s.start_time}
                      </button>
                    );
                  })}
                </div>
                {startsAt && selectedSlot && (
                  <div
                    style={{
                      marginTop: 8,
                      fontSize: "0.78rem",
                      fontWeight: 700,
                      color: "var(--primary)",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <Icon name="check" size={13} />
                    <span>{startsAt}</span>
                  </div>
                )}
              </div>
            )}
            {renderFieldError("starts_at")}
          </div>

          {/* Status & Bypass Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(min(100%, 200px), 1fr))",
              gap: 12,
              alignItems: "center",
            }}
          >
            <div className="form-group">
              <label
                className="form-label"
                style={{
                  fontWeight: 700,
                  fontSize: "0.86rem",
                  marginBottom: 6,
                }}
              >
                {t("statusHeader") || "حالة الحجز"}
              </label>
              <select
                className="form-input"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="confirmed">
                  {t("statusConfirmed") || "مؤكد"}
                </option>
                <option value="pending">
                  {t("statusPending") || "قيد الانتظار"}
                </option>
                <option value="completed">
                  {t("statusCompleted") || "مكتمل"}
                </option>
                <option value="cancelled">
                  {t("statusCancelled") || "ملغى"}
                </option>
                <option value="rejected">
                  {t("statusRejected") || "مرفوض"}
                </option>
                <option value="no_show">
                  {t("statusNoShow") || "لم يحضر"}
                </option>
                <option value="rescheduled">
                  {t("statusRescheduled") || "معاد جدولته"}
                </option>
                <option value="expired">
                  {t("statusExpired") || "منتهي الصلاحية"}
                </option>
              </select>
            </div>

            <div className="form-group">
              <label
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  cursor: "pointer",
                  fontSize: "0.84rem",
                  fontWeight: 700,
                  color: "var(--heading)",
                }}
              >
                <input
                  type="checkbox"
                  checked={bypassRules}
                  onChange={(e) => setBypassRules(e.target.checked)}
                  style={{
                    width: 16,
                    height: 16,
                    accentColor: "var(--primary)",
                  }}
                />
                <Icon name="zap" size={14} />
                <span>{t("bypassRulesLabel") || "تجاوز قواعد المساحة"}</span>
              </label>
            </div>
          </div>

          {/* Notes */}
          <div className="form-group">
            <label
              className="form-label"
              style={{ fontWeight: 700, fontSize: "0.86rem", marginBottom: 6 }}
            >
              {t("notes") || "ملاحظات جانبية"}
            </label>
            <textarea
              className="form-input"
              rows={2}
              placeholder={
                t("bookingNotesPlaceholder") ||
                "ملاحظات الحجز المباشر بالسنترال أو الفرع..."
              }
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* Action Buttons */}
          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={submitting}
              style={{ fontWeight: 700 }}
            >
              {t("cancel") || "إلغاء"}
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
              style={{
                fontWeight: 800,
                padding: "8px 24px",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Icon name="plus" size={14} />
              <span>
                {submitting
                  ? t("saving") || "جاري الحفظ..."
                  : t("createBookingForClient") || "حجز الموعد"}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
