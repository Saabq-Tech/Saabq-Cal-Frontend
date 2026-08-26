import { useState, useEffect } from "react";
import { useLanguage } from "../../../../context/LanguageContext";
import Icon from "../../../../components/common/Icon";

export default function BookingFormFieldsTab({
  formFieldsForm,
  setFormFieldsForm: _setFormFieldsForm,
  onSave,
  saving,
  canEdit,
}) {
  const { t } = useLanguage();

  // Standard system field statuses (required | optional | disabled)
  const [fieldStatuses, setFieldStatuses] = useState(() => {
    const fs = formFieldsForm.field_statuses || {};
    return {
      full_name: "required",
      phone:
        fs.phone ||
        (formFieldsForm.require_phone
          ? "required"
          : formFieldsForm.collect_phone
            ? "optional"
            : "required"),
      email: fs.email || "required",
      notes:
        fs.notes || (formFieldsForm.collect_notes ? "optional" : "optional"),
      consultation_subject: fs.consultation_subject || "optional",
      attendee_count: fs.attendee_count || "disabled",
      preferred_contact_method: fs.preferred_contact_method || "optional",
      upload_receipt: fs.upload_receipt || "required",
      payment_notes: fs.payment_notes || "optional",
      transaction_number: fs.transaction_number || "disabled",
      bank_name: fs.bank_name || "disabled",
      card_last4: fs.card_last4 || "disabled",
      terms_and_conditions: fs.terms_and_conditions || "required",
      privacy_policy: fs.privacy_policy || "required",
      data_consent: fs.data_consent || "required",
    };
  });

  useEffect(() => {
    if (
      formFieldsForm.field_statuses &&
      Object.keys(formFieldsForm.field_statuses).length > 0
    ) {
      const fs = formFieldsForm.field_statuses;
      setFieldStatuses((prev) => ({
        ...prev,
        ...fs,
        full_name: "required",
      }));
    }
  }, [formFieldsForm]);

  // Custom questions list state — starts empty until user clicks "+ إضافة سؤال"
  const [customQuestions, setCustomQuestions] = useState([]);

  const updateFieldStatus = (fieldKey, status) => {
    setFieldStatuses((prev) => ({ ...prev, [fieldKey]: status }));
  };

  const addCustomQuestion = () => {
    const newId =
      customQuestions.length > 0
        ? Math.max(...customQuestions.map((q) => q.id)) + 1
        : 1;
    setCustomQuestions([
      ...customQuestions,
      {
        id: newId,
        type: "text",
        label_ar: "سؤال جديد",
        label_en: "New Question",
        description_ar: "",
        description_en: "",
        status: "optional",
        is_expanded: true,
        options: [
          { value: "opt_1", label_ar: "خيار 1", label_en: "Option 1" },
          { value: "opt_2", label_ar: "خيار 2", label_en: "Option 2" },
        ],
      },
    ]);
  };

  const updateQuestion = (id, key, val) => {
    setCustomQuestions(
      customQuestions.map((q) => {
        if (q.id !== id) return q;
        const updated = { ...q, [key]: val };
        // If type changed to select or multi_select and options are empty, initialize default options
        if (
          key === "type" &&
          (val === "select" || val === "multi_select") &&
          (!q.options || q.options.length === 0)
        ) {
          updated.options = [
            { value: "opt_1", label_ar: "خيار 1", label_en: "Option 1" },
            { value: "opt_2", label_ar: "خيار 2", label_en: "Option 2" },
          ];
        }
        return updated;
      }),
    );
  };

  const deleteQuestion = (id) => {
    setCustomQuestions(customQuestions.filter((q) => q.id !== id));
  };

  const toggleExpandQuestion = (id) => {
    setCustomQuestions(
      customQuestions.map((q) =>
        q.id === id ? { ...q, is_expanded: !q.is_expanded } : q,
      ),
    );
  };

  // Question Options Helper Functions
  const addQuestionOption = (questionId) => {
    setCustomQuestions(
      customQuestions.map((q) => {
        if (q.id !== questionId) return q;
        const count = (q.options || []).length + 1;
        const newOpt = {
          value: `opt_${Date.now()}_${count}`,
          label_ar: `خيار ${count}`,
          label_en: `Option ${count}`,
        };
        return { ...q, options: [...(q.options || []), newOpt] };
      }),
    );
  };

  const updateQuestionOption = (questionId, optIndex, optKey, optVal) => {
    setCustomQuestions(
      customQuestions.map((q) => {
        if (q.id !== questionId) return q;
        const nextOpts = [...(q.options || [])];
        if (nextOpts[optIndex]) {
          nextOpts[optIndex] = { ...nextOpts[optIndex], [optKey]: optVal };
        }
        return { ...q, options: nextOpts };
      }),
    );
  };

  const deleteQuestionOption = (questionId, optIndex) => {
    setCustomQuestions(
      customQuestions.map((q) => {
        if (q.id !== questionId) return q;
        const nextOpts = (q.options || []).filter((_, idx) => idx !== optIndex);
        return { ...q, options: nextOpts };
      }),
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      field_full_name_status: fieldStatuses.full_name,
      field_phone_status: fieldStatuses.phone,
      field_email_status: fieldStatuses.email,
      field_notes_status: fieldStatuses.notes,
      field_consultation_subject_status: fieldStatuses.consultation_subject,
      field_attendee_count_status: fieldStatuses.attendee_count,
      field_preferred_contact_method_status:
        fieldStatuses.preferred_contact_method,
      field_upload_receipt_status: fieldStatuses.upload_receipt,
      field_payment_notes_status: fieldStatuses.payment_notes,
      field_transaction_number_status: fieldStatuses.transaction_number,
      field_bank_name_status: fieldStatuses.bank_name,
      field_card_last4_status: fieldStatuses.card_last4,
      field_terms_and_conditions_status: fieldStatuses.terms_and_conditions,
      field_privacy_policy_status: fieldStatuses.privacy_policy,
      field_data_consent_status: fieldStatuses.data_consent,
      custom_questions: customQuestions,
    };
    onSave(payload);
  };

  const systemGroups = [
    {
      id: "essential",
      title: t("basicInfoSection") || "المعلومات الأساسية",
      fields: [
        {
          key: "full_name",
          label: t("fullNameLabel") || "الاسم الكامل",
          isFixed: true,
        },
        { key: "phone", label: t("phoneFieldLabel") || "رقم الهاتف" },
        { key: "email", label: t("emailFieldLabel") || "البريد الإلكتروني" },
        { key: "notes", label: t("notesFieldLabel") || "ملاحظات إضافية" },
      ],
    },
    {
      id: "booking",
      title: t("bookingRulesSection") || "صفحة وقواعد الحجز",
      fields: [
        {
          key: "consultation_subject",
          label: t("consultationSubjectLabel") || "موضوع الاستشارة",
        },
        {
          key: "attendee_count",
          label: t("attendeeCountLabel") || "عدد الحضور",
        },
        {
          key: "preferred_contact_method",
          label: t("preferredContactMethodLabel") || "طريقة التواصل المفضلة",
        },
        {
          key: "upload_receipt",
          label: t("uploadReceiptLabel") || "رفع إيصال التحويل",
        },
      ],
    },
    {
      id: "payment",
      title: t("paymentReceiptsSection") || "إيصالات الدفع",
      fields: [
        {
          key: "payment_notes",
          label: t("paymentNotesLabel") || "ملاحظات الدفع",
        },
        {
          key: "transaction_number",
          label: t("transactionNumberLabel") || "رقم العملية",
        },
        { key: "bank_name", label: t("bankNameLabel") || "اسم البنك" },
        {
          key: "card_last4",
          label: t("cardLast4Label") || "آخر 4 أرقام من البطاقة",
        },
      ],
    },
    {
      id: "consents",
      title: t("termsAndConditionsLabel") || "الشروط والأحكام",
      fields: [
        {
          key: "terms_and_conditions",
          label: t("termsAndConditionsLabel") || "الشروط والأحكام",
        },
        {
          key: "privacy_policy",
          label: t("privacyPolicyLabel") || "سياسة الخصوصية",
        },
        {
          key: "data_consent",
          label:
            t("dataProcessingConsentLabel") ||
            "الموافقة على معالجة البيانات الشخصية",
        },
      ],
    },
  ];

  return (
    <form className="card-body" onSubmit={handleSubmit} style={{ gap: 24 }}>
      {/* Form Builder Top Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid var(--border-light)",
          paddingBottom: 14,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <h3
            style={{
              fontSize: "1.1rem",
              fontWeight: 800,
              margin: "0 0 4px",
              color: "var(--heading)",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Icon name="edit" size={20} style={{ color: "var(--primary)" }} />
            {t("formBuilder") || "منشئ نموذج الحجز"}
          </h3>
          <p
            style={{
              fontSize: "0.84rem",
              color: "var(--text-secondary)",
              margin: 0,
            }}
          >
            {t("formBuilderDesc") ||
              "تخصيص الحقول المطلوبة والاختيارية والمخفية في نموذج حجز العملاء، مع معاينة مباشرة."}
          </p>
        </div>

        {canEdit && (
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
        )}
      </div>

      {/* Main 2-Columns Grid Layout */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(min(100%, 280px), 1fr))",
          gap: 24,
          alignItems: "start",
        }}
      >
        {/* Left Column: Form Configurator Sections */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {systemGroups.map((grp) => (
            <div
              key={grp.id}
              style={{
                borderRadius: "var(--radius-lg)",
                border: "1px solid var(--border-light)",
                background: "#ffffff",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  padding: "12px 18px",
                  background: "var(--surface-alt)",
                  borderBottom: "1px solid var(--border-light)",
                  fontSize: "0.84rem",
                  fontWeight: 800,
                  color: "var(--heading)",
                }}
              >
                {grp.title}
              </div>

              <div style={{ display: "flex", flexDirection: "column" }}>
                {grp.fields.map((fld, idx) => {
                  const currentStatus = fieldStatuses[fld.key] || "optional";
                  return (
                    <div
                      key={fld.key}
                      style={{
                        padding: "14px 18px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        borderBottom:
                          idx < grp.fields.length - 1
                            ? "1px solid var(--border-light)"
                            : "none",
                        gap: 12,
                        flexWrap: "wrap",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <span
                          style={{
                            fontSize: "0.88rem",
                            fontWeight: 700,
                            color: "var(--heading)",
                          }}
                        >
                          {fld.label}
                        </span>
                      </div>

                      {fld.isFixed ? (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                          }}
                        >
                          <span
                            style={{
                              fontSize: "0.78rem",
                              color: "var(--muted)",
                            }}
                          >
                            {t("alwaysRequiredNotice") ||
                              "هذا الحقل إجباري دائماً"}
                          </span>
                          <span
                            style={{
                              padding: "4px 14px",
                              borderRadius: 16,
                              background: "var(--primary)",
                              color: "#ffffff",
                              fontSize: "0.78rem",
                              fontWeight: 800,
                            }}
                          >
                            {t("requiredToggle") || "إجباري"}
                          </span>
                        </div>
                      ) : (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            background: "var(--surface-alt)",
                            padding: 3,
                            borderRadius: 20,
                            border: "1px solid var(--border-light)",
                          }}
                        >
                          <button
                            type="button"
                            onClick={() =>
                              canEdit && updateFieldStatus(fld.key, "required")
                            }
                            style={{
                              padding: "4px 14px",
                              borderRadius: 16,
                              border: "none",
                              background:
                                currentStatus === "required"
                                  ? "var(--primary)"
                                  : "transparent",
                              color:
                                currentStatus === "required"
                                  ? "#ffffff"
                                  : "var(--text-secondary)",
                              fontSize: "0.78rem",
                              fontWeight:
                                currentStatus === "required" ? 800 : 500,
                              cursor: "pointer",
                              transition: "all 0.15s ease",
                            }}
                          >
                            {t("requiredToggle") || "إجباري"}
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              canEdit && updateFieldStatus(fld.key, "optional")
                            }
                            style={{
                              padding: "4px 14px",
                              borderRadius: 16,
                              border: "none",
                              background:
                                currentStatus === "optional"
                                  ? "var(--primary)"
                                  : "transparent",
                              color:
                                currentStatus === "optional"
                                  ? "#ffffff"
                                  : "var(--text-secondary)",
                              fontSize: "0.78rem",
                              fontWeight:
                                currentStatus === "optional" ? 800 : 500,
                              cursor: "pointer",
                              transition: "all 0.15s ease",
                            }}
                          >
                            {t("optionalToggle") || "اختياري"}
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              canEdit && updateFieldStatus(fld.key, "disabled")
                            }
                            style={{
                              padding: "4px 14px",
                              borderRadius: 16,
                              border: "none",
                              background:
                                currentStatus === "disabled"
                                  ? "var(--primary)"
                                  : "transparent",
                              color:
                                currentStatus === "disabled"
                                  ? "#ffffff"
                                  : "var(--text-secondary)",
                              fontSize: "0.78rem",
                              fontWeight:
                                currentStatus === "disabled" ? 800 : 500,
                              cursor: "pointer",
                              transition: "all 0.15s ease",
                            }}
                          >
                            {t("hiddenToggle") || "مخفي"}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Section 5: Custom Questions Configurator */}
          <div
            style={{
              padding: 20,
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--border-light)",
              background: "#ffffff",
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 10,
              }}
            >
              <div>
                <h4
                  style={{
                    fontSize: "0.94rem",
                    fontWeight: 800,
                    margin: "0 0 4px",
                    color: "var(--heading)",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  {t("customQuestionsTitle") || "أسئلة مخصصة"}
                  <Icon
                    name="help-circle"
                    size={16}
                    style={{ color: "var(--muted)" }}
                  />
                </h4>
                <p
                  style={{
                    fontSize: "0.8rem",
                    color: "var(--text-secondary)",
                    margin: 0,
                  }}
                >
                  {t("customQuestionsDesc") ||
                    "إضافة وإدارة أسئلة مخصصة لجمع معلومات إضافية من العملاء أثناء الحجز."}
                </p>
              </div>

              {canEdit && (
                <button
                  type="button"
                  onClick={addCustomQuestion}
                  className="btn btn-primary btn-sm"
                  style={{
                    padding: "6px 14px",
                    borderRadius: "var(--radius-md)",
                    fontWeight: 700,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <span style={{ fontSize: "1rem", fontWeight: 900 }}>+</span>
                  {t("addQuestionBtn") || "إضافة سؤال"}
                </button>
              )}
            </div>

            {/* Custom Questions Items Stack */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {customQuestions.map((q) => (
                <div
                  key={q.id}
                  style={{
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--border-light)",
                    background: "var(--surface-alt)",
                    padding: 14,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 10,
                      flexWrap: "wrap",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.88rem",
                        fontWeight: 700,
                        color: "var(--heading)",
                      }}
                    >
                      {q.label_ar || "سؤال جديد"}
                    </span>

                    <div
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                      {/* Status Pills */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          background: "#ffffff",
                          padding: 2,
                          borderRadius: 16,
                          border: "1px solid var(--border-light)",
                        }}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            updateQuestion(q.id, "status", "required")
                          }
                          style={{
                            padding: "3px 10px",
                            borderRadius: 14,
                            border: "none",
                            background:
                              q.status === "required"
                                ? "var(--primary)"
                                : "transparent",
                            color:
                              q.status === "required"
                                ? "#ffffff"
                                : "var(--text-secondary)",
                            fontSize: "0.74rem",
                            fontWeight: q.status === "required" ? 700 : 500,
                            cursor: "pointer",
                          }}
                        >
                          {t("statusRequired") || "إجباري"}
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            updateQuestion(q.id, "status", "optional")
                          }
                          style={{
                            padding: "3px 10px",
                            borderRadius: 14,
                            border: "none",
                            background:
                              q.status === "optional"
                                ? "var(--primary)"
                                : "transparent",
                            color:
                              q.status === "optional"
                                ? "#ffffff"
                                : "var(--text-secondary)",
                            fontSize: "0.74rem",
                            fontWeight: q.status === "optional" ? 700 : 500,
                            cursor: "pointer",
                          }}
                        >
                          {t("statusOptional") || "اختياري"}
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            updateQuestion(q.id, "status", "disabled")
                          }
                          style={{
                            padding: "3px 10px",
                            borderRadius: 14,
                            border: "none",
                            background:
                              q.status === "disabled"
                                ? "var(--primary)"
                                : "transparent",
                            color:
                              q.status === "disabled"
                                ? "#ffffff"
                                : "var(--text-secondary)",
                            fontSize: "0.74rem",
                            fontWeight: q.status === "disabled" ? 700 : 500,
                            cursor: "pointer",
                          }}
                        >
                          {t("statusDisabled") || "معطل"}
                        </button>
                      </div>

                      {/* Expand / Collapse Chevron Button */}
                      <button
                        type="button"
                        onClick={() => toggleExpandQuestion(q.id)}
                        title={
                          q.is_expanded
                            ? t("closeBtn") || "إغلاق"
                            : t("edit") || "تعديل"
                        }
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: "50%",
                          border: "1px solid var(--border-light)",
                          background: "#ffffff",
                          color: "var(--heading)",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          flexShrink: 0,
                          padding: 0,
                          lineHeight: 1,
                          transition: "all 0.15s ease",
                        }}
                      >
                        <Icon name="custom-4db57562" size={16} />
                      </button>

                      {/* Trash Delete Icon Button */}
                      <button
                        type="button"
                        onClick={() => deleteQuestion(q.id)}
                        title={t("deleteQuestionBtn") || "حذف السؤال"}
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: "50%",
                          border: "1px solid #fecdd3",
                          background: "#fef2f2",
                          color: "#e11d48",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          flexShrink: 0,
                          padding: 0,
                          lineHeight: 1,
                          transition: "all 0.15s ease",
                        }}
                      >
                        <Icon name="trash" size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Expanded Custom Question Details & Options Configurator */}
                  {q.is_expanded && (
                    <div
                      style={{
                        marginTop: 14,
                        paddingTop: 14,
                        borderTop: "1px solid var(--border-light)",
                        display: "flex",
                        flexDirection: "column",
                        gap: 14,
                      }}
                    >
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns:
                            "repeat(auto-fit, minmax(200px, 1fr))",
                          gap: 12,
                        }}
                      >
                        <div className="form-group">
                          <label
                            className="form-label"
                            style={{ fontSize: "0.8rem", fontWeight: 700 }}
                          >
                            {t("questionTitleArLabel") ||
                              "عنوان السؤال (بالعربية) *"}
                          </label>
                          <input
                            type="text"
                            className="form-input"
                            value={q.label_ar || ""}
                            onChange={(e) =>
                              updateQuestion(q.id, "label_ar", e.target.value)
                            }
                            placeholder={
                              t("questionTitlePlaceholder") || "عنوان السؤال..."
                            }
                            style={{ height: 36, fontSize: "0.84rem" }}
                            required
                          />
                        </div>

                        <div className="form-group">
                          <label
                            className="form-label"
                            style={{ fontSize: "0.8rem", fontWeight: 700 }}
                          >
                            Question Title (EN)
                          </label>
                          <input
                            type="text"
                            className="form-input"
                            value={q.label_en || ""}
                            onChange={(e) =>
                              updateQuestion(q.id, "label_en", e.target.value)
                            }
                            placeholder="Question label in English..."
                            style={{
                              height: 36,
                              fontSize: "0.84rem",
                              direction: "ltr",
                            }}
                          />
                        </div>
                      </div>

                      <div className="form-group">
                        <label
                          className="form-label"
                          style={{ fontSize: "0.8rem", fontWeight: 700 }}
                        >
                          {t("answerTypeLabel") || "نوع الإجابة *"}
                        </label>
                        <select
                          className="form-select"
                          value={q.type}
                          onChange={(e) =>
                            updateQuestion(q.id, "type", e.target.value)
                          }
                          style={{ height: 36, fontSize: "0.84rem" }}
                        >
                          <option value="text">
                            {t("shortTextType") || "نص قصير (Short Text)"}
                          </option>
                          <option value="textarea">
                            {t("longTextType") || "نص طويل (Long Text)"}
                          </option>
                          <option value="number">
                            {t("numberType") || "رقمي (Number)"}
                          </option>
                          <option value="select">
                            {t("singleSelectType") ||
                              "قائمة منسدلة (Single Select Dropdown)"}
                          </option>
                          <option value="multi_select">
                            {t("multiSelectType") ||
                              "خيارات متعددة (Multi Select Checkboxes)"}
                          </option>
                          <option value="boolean">
                            {t("booleanType") || "نعم / لا (Yes / No Toggle)"}
                          </option>
                        </select>
                      </div>

                      {/* Options Builder for Select or Multi Select */}
                      {(q.type === "select" || q.type === "multi_select") && (
                        <div
                          style={{
                            background: "#ffffff",
                            padding: 14,
                            borderRadius: "var(--radius-md)",
                            border: "1px solid var(--border-light)",
                            display: "flex",
                            flexDirection: "column",
                            gap: 10,
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
                                fontSize: "0.82rem",
                                fontWeight: 800,
                                color: "var(--heading)",
                              }}
                            >
                              {t("menuOptionsLabel") || "خيارات القائمة"}
                            </span>
                            <button
                              type="button"
                              onClick={() => addQuestionOption(q.id)}
                              style={{
                                border: "none",
                                background: "transparent",
                                color: "var(--primary)",
                                fontWeight: 800,
                                fontSize: "0.8rem",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: 4,
                              }}
                            >
                              <span>+</span> {t("addOptionBtn") || "إضافة خيار"}
                            </button>
                          </div>

                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: 8,
                            }}
                          >
                            {(q.options || []).map((opt, optIdx) => (
                              <div
                                key={optIdx}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 8,
                                }}
                              >
                                <input
                                  type="text"
                                  className="form-input"
                                  value={opt.label_ar || ""}
                                  onChange={(e) =>
                                    updateQuestionOption(
                                      q.id,
                                      optIdx,
                                      "label_ar",
                                      e.target.value,
                                    )
                                  }
                                  placeholder={
                                    t("optionLabelArPlaceholder") ||
                                    "عنوان الخيار بالعربية"
                                  }
                                  style={{
                                    height: 36,
                                    fontSize: "0.82rem",
                                    flex: 1,
                                    borderRadius: "var(--radius-md)",
                                  }}
                                />
                                <input
                                  type="text"
                                  className="form-input"
                                  value={opt.label_en || ""}
                                  onChange={(e) =>
                                    updateQuestionOption(
                                      q.id,
                                      optIdx,
                                      "label_en",
                                      e.target.value,
                                    )
                                  }
                                  placeholder="Option label (EN)"
                                  style={{
                                    height: 36,
                                    fontSize: "0.82rem",
                                    flex: 1,
                                    direction: "ltr",
                                    borderRadius: "var(--radius-md)",
                                  }}
                                />
                                {(q.options || []).length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      deleteQuestionOption(q.id, optIdx)
                                    }
                                    style={{
                                      border: "none",
                                      background: "transparent",
                                      color: "#ef4444",
                                      cursor: "pointer",
                                      padding: 4,
                                    }}
                                    title={t("deleteOptionBtn") || "حذف الخيار"}
                                  >
                                    <Icon name="trash" size={16} />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Live Mobile Preview Card */}
        <div
          style={{
            position: "sticky",
            top: 20,
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--border-light)",
            background: "#ffffff",
            padding: 20,
            boxShadow: "0 4px 12px rgba(0,0,0,0.04)",
          }}
        >
          <div
            style={{
              marginBottom: 14,
              borderBottom: "1px solid var(--border-light)",
              paddingBottom: 10,
            }}
          >
            <h4
              style={{
                fontSize: "0.94rem",
                fontWeight: 800,
                margin: "0 0 4px",
                color: "var(--heading)",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "#10b981",
                  display: "inline-block",
                }}
              />
              {t("livePreviewTitle") || "معاينة مباشرة"}
            </h4>
            <p
              style={{
                fontSize: "0.78rem",
                color: "var(--text-secondary)",
                margin: 0,
              }}
            >
              {t("livePreviewSubtitle") || "هكذا سيظهر النموذج لعملائك."}
            </p>
          </div>

          {/* Rendered Live Fields Mockup */}
          <div
            className="custom-scrollbar"
            style={{
              maxHeight: 600,
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: 14,
              paddingEnd: 4,
            }}
          >
            {/* Full Name */}
            {fieldStatuses.full_name !== "disabled" && (
              <div>
                <label
                  style={{
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    color: "var(--heading)",
                    display: "block",
                    marginBottom: 4,
                  }}
                >
                  {t("fullNameLabel") || "الاسم الكامل"}{" "}
                  <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <div
                  style={{
                    height: 36,
                    borderRadius: 8,
                    border: "1px solid var(--border-light)",
                    background: "var(--surface-alt)",
                    padding: "0 12px",
                  }}
                />
              </div>
            )}

            {/* Phone */}
            {fieldStatuses.phone !== "disabled" && (
              <div>
                <label
                  style={{
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    color: "var(--heading)",
                    display: "block",
                    marginBottom: 4,
                  }}
                >
                  {t("phoneFieldLabel") || "رقم الهاتف"}{" "}
                  {fieldStatuses.phone === "required" ? (
                    <span style={{ color: "#ef4444" }}>*</span>
                  ) : (
                    <span
                      style={{
                        color: "var(--muted)",
                        fontWeight: 400,
                        fontSize: "0.74rem",
                      }}
                    >
                      (اختياري)
                    </span>
                  )}
                </label>
                <div
                  style={{
                    height: 36,
                    borderRadius: 8,
                    border: "1px solid var(--border-light)",
                    background: "var(--surface-alt)",
                    padding: "0 12px",
                  }}
                />
              </div>
            )}

            {/* Email */}
            {fieldStatuses.email !== "disabled" && (
              <div>
                <label
                  style={{
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    color: "var(--heading)",
                    display: "block",
                    marginBottom: 4,
                  }}
                >
                  {t("emailFieldLabel") || "البريد الإلكتروني"}{" "}
                  {fieldStatuses.email === "required" ? (
                    <span style={{ color: "#ef4444" }}>*</span>
                  ) : (
                    <span
                      style={{
                        color: "var(--muted)",
                        fontWeight: 400,
                        fontSize: "0.74rem",
                      }}
                    >
                      {t("optionalFieldTag") || "(اختياري)"}
                    </span>
                  )}
                </label>
                <div
                  style={{
                    height: 36,
                    borderRadius: 8,
                    border: "1px solid var(--border-light)",
                    background: "var(--surface-alt)",
                    padding: "0 12px",
                  }}
                />
              </div>
            )}

            {/* Additional Notes */}
            {fieldStatuses.notes !== "disabled" && (
              <div>
                <label
                  style={{
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    color: "var(--heading)",
                    display: "block",
                    marginBottom: 4,
                  }}
                >
                  {t("notesFieldLabel") || "ملاحظات إضافية"}{" "}
                  {fieldStatuses.notes === "required" ? (
                    <span style={{ color: "#ef4444" }}>*</span>
                  ) : (
                    <span
                      style={{
                        color: "var(--muted)",
                        fontWeight: 400,
                        fontSize: "0.74rem",
                      }}
                    >
                      {t("optionalFieldTag") || "(اختياري)"}
                    </span>
                  )}
                </label>
                <div
                  style={{
                    height: 50,
                    borderRadius: 8,
                    border: "1px solid var(--border-light)",
                    background: "var(--surface-alt)",
                    padding: 8,
                  }}
                />
              </div>
            )}

            {/* Consultation Subject */}
            {fieldStatuses.consultation_subject !== "disabled" && (
              <div>
                <label
                  style={{
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    color: "var(--heading)",
                    display: "block",
                    marginBottom: 4,
                  }}
                >
                  {t("consultationSubjectLabel") || "موضوع الاستشارة"}{" "}
                  {fieldStatuses.consultation_subject === "required" ? (
                    <span style={{ color: "#ef4444" }}>*</span>
                  ) : (
                    <span
                      style={{
                        color: "var(--muted)",
                        fontWeight: 400,
                        fontSize: "0.74rem",
                      }}
                    >
                      {t("optionalFieldTag") || "(اختياري)"}
                    </span>
                  )}
                </label>
                <div
                  style={{
                    height: 36,
                    borderRadius: 8,
                    border: "1px solid var(--border-light)",
                    background: "var(--surface-alt)",
                    padding: "0 12px",
                  }}
                />
              </div>
            )}

            {/* Preferred Contact Method */}
            {fieldStatuses.preferred_contact_method !== "disabled" && (
              <div>
                <label
                  style={{
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    color: "var(--heading)",
                    display: "block",
                    marginBottom: 4,
                  }}
                >
                  {t("preferredContactMethodLabel") || "طريقة التواصل المفضلة"}{" "}
                  {fieldStatuses.preferred_contact_method === "required" ? (
                    <span style={{ color: "#ef4444" }}>*</span>
                  ) : (
                    <span
                      style={{
                        color: "var(--muted)",
                        fontWeight: 400,
                        fontSize: "0.74rem",
                      }}
                    >
                      {t("optionalFieldTag") || "(اختياري)"}
                    </span>
                  )}
                </label>
                <div
                  style={{
                    height: 36,
                    borderRadius: 8,
                    border: "1px solid var(--border-light)",
                    background: "var(--surface-alt)",
                    padding: "0 12px",
                  }}
                />
              </div>
            )}

            {/* Upload Receipt */}
            {fieldStatuses.upload_receipt !== "disabled" && (
              <div>
                <label
                  style={{
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    color: "var(--heading)",
                    display: "block",
                    marginBottom: 4,
                  }}
                >
                  {t("uploadReceiptLabel") || "رفع إيصال التحويل"}{" "}
                  {fieldStatuses.upload_receipt === "required" ? (
                    <span style={{ color: "#ef4444" }}>*</span>
                  ) : (
                    <span
                      style={{
                        color: "var(--muted)",
                        fontWeight: 400,
                        fontSize: "0.74rem",
                      }}
                    >
                      {t("optionalFieldTag") || "(اختياري)"}
                    </span>
                  )}
                </label>
                <div
                  style={{
                    padding: 12,
                    borderRadius: 8,
                    border: "1px dashed var(--border)",
                    background: "var(--surface-alt)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 4,
                  }}
                >
                  <Icon
                    name="custom-006643eb"
                    size={16}
                    style={{ color: "var(--primary)" }}
                  />
                  <span style={{ fontSize: "0.72rem", color: "var(--muted)" }}>
                    {t("uploadImagePlaceholder") || "رفع صورة"}
                  </span>
                </div>
              </div>
            )}

            {/* Terms & Conditions Checkboxes */}
            {fieldStatuses.terms_and_conditions !== "disabled" && (
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <input
                  type="checkbox"
                  checked
                  readOnly
                  style={{ accentColor: "var(--primary)" }}
                />
                <span
                  style={{
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    color: "var(--heading)",
                  }}
                >
                  {t("termsAndConditionsLabel") || "الشروط والأحكام"}{" "}
                  {fieldStatuses.terms_and_conditions === "required" && (
                    <span style={{ color: "#ef4444" }}>*</span>
                  )}
                </span>
              </div>
            )}

            {fieldStatuses.privacy_policy !== "disabled" && (
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <input
                  type="checkbox"
                  checked
                  readOnly
                  style={{ accentColor: "var(--primary)" }}
                />
                <span
                  style={{
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    color: "var(--heading)",
                  }}
                >
                  {t("privacyPolicyLabel") || "سياسة الخصوصية"}{" "}
                  {fieldStatuses.privacy_policy === "required" && (
                    <span style={{ color: "#ef4444" }}>*</span>
                  )}
                </span>
              </div>
            )}

            {fieldStatuses.data_consent !== "disabled" && (
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <input
                  type="checkbox"
                  checked
                  readOnly
                  style={{ accentColor: "var(--primary)" }}
                />
                <span
                  style={{
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    color: "var(--heading)",
                  }}
                >
                  {t("dataProcessingConsentLabel") ||
                    "الموافقة على معالجة البيانات الشخصية"}{" "}
                  {fieldStatuses.data_consent === "required" && (
                    <span style={{ color: "#ef4444" }}>*</span>
                  )}
                </span>
              </div>
            )}

            {/* Custom Questions Live Dynamic Preview */}
            {customQuestions.length > 0 && (
              <div
                style={{
                  borderTop: "1px solid var(--border-light)",
                  paddingTop: 10,
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                <span
                  style={{
                    fontSize: "0.76rem",
                    fontWeight: 800,
                    color: "var(--primary)",
                  }}
                >
                  أسئلة مخصصة
                </span>
                {customQuestions.map((q) => {
                  if (q.status === "disabled") return null;
                  return (
                    <div key={q.id}>
                      <label
                        style={{
                          fontSize: "0.78rem",
                          fontWeight: 700,
                          color: "var(--heading)",
                          display: "block",
                          marginBottom: 4,
                        }}
                      >
                        {q.label_ar || q.label_en || "سؤال جديد"}{" "}
                        {q.status === "required" ? (
                          <span style={{ color: "#ef4444" }}>*</span>
                        ) : (
                          <span
                            style={{
                              color: "var(--muted)",
                              fontWeight: 400,
                              fontSize: "0.72rem",
                            }}
                          >
                            (اختياري)
                          </span>
                        )}
                      </label>

                      {/* Dynamic Field Renderer based on q.type */}
                      {q.type === "select" ? (
                        <select
                          disabled
                          className="form-input"
                          style={{
                            width: "100%",
                            height: 34,
                            fontSize: "0.78rem",
                            background: "var(--surface-alt)",
                            borderRadius: 8,
                          }}
                        >
                          <option>
                            {t("selectOptionPlaceholder") || "--- اختر ---"}
                          </option>
                          {(q.options || []).map((opt, oIdx) => (
                            <option key={oIdx}>
                              {opt.label_ar || opt.label_en || opt.value}
                            </option>
                          ))}
                        </select>
                      ) : q.type === "multi_select" ? (
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 4,
                            padding: "2px 0",
                          }}
                        >
                          {(q.options || []).map((opt, oIdx) => (
                            <div
                              key={oIdx}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                              }}
                            >
                              <input
                                type="checkbox"
                                disabled
                                style={{ accentColor: "var(--primary)" }}
                              />
                              <span
                                style={{
                                  fontSize: "0.74rem",
                                  color: "var(--heading)",
                                }}
                              >
                                {opt.label_ar || opt.label_en || opt.value}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : q.type === "boolean" ? (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          <input
                            type="checkbox"
                            disabled
                            style={{ accentColor: "var(--primary)" }}
                          />
                          <span
                            style={{
                              fontSize: "0.74rem",
                              color: "var(--text-secondary)",
                            }}
                          >
                            نعم / لا
                          </span>
                        </div>
                      ) : q.type === "number" ? (
                        <div
                          style={{
                            height: 34,
                            borderRadius: 8,
                            border: "1px solid var(--border-light)",
                            background: "var(--surface-alt)",
                            padding: "0 10px",
                            display: "flex",
                            alignItems: "center",
                            fontSize: "0.74rem",
                            color: "var(--muted)",
                          }}
                        >
                          123...
                        </div>
                      ) : (
                        <div
                          style={{
                            height: 34,
                            borderRadius: 8,
                            border: "1px solid var(--border-light)",
                            background: "var(--surface-alt)",
                            padding: "0 10px",
                            display: "flex",
                            alignItems: "center",
                            fontSize: "0.74rem",
                            color: "var(--muted)",
                          }}
                        >
                          ---
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </form>
  );
}
