import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { submitIssueReport } from "../api/client";
import SEO from "../components/ui/SEO";
import Icon from "../components/common/Icon";

const CATEGORIES = [
  { id: "bug", icon: "alert-circle", labelKey: "reportCategoryBug" },
  {
    id: "feature_request",
    icon: "sparkles",
    labelKey: "reportCategoryFeatureRequest",
  },
  { id: "ui_issue", icon: "eye", labelKey: "reportCategoryUiIssue" },
  {
    id: "performance",
    icon: "activity",
    labelKey: "reportCategoryPerformance",
  },
  { id: "account", icon: "user", labelKey: "reportCategoryAccount" },
  { id: "billing", icon: "credit-card", labelKey: "reportCategoryBilling" },
  { id: "other", icon: "help-circle", labelKey: "reportCategoryOther" },
];

export default function ReportIssuePage() {
  const { t, lang } = useLanguage();
  const isRTL = lang === "ar";
  const { user } = useAuth();
  const { addToast } = useToast();

  const fileInputRef = useRef(null);

  // Form State
  const [category, setCategory] = useState("bug");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [attachments, setAttachments] = useState([]); // { file, previewUrl, name, size }
  const [dragActive, setDragActive] = useState(false);

  // Submission State
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [submittedData, setSubmittedData] = useState(null); // When success, store response data
  const [copiedTicket, setCopiedTicket] = useState(false);

  // Sync user details if user loads asynchronously
  useEffect(() => {
    if (user) {
      if (!name && user.name) setName(user.name);
      if (!email && user.email) setEmail(user.email);
      if (!phone && user.phone) setPhone(user.phone);
    }
  }, [user, name, email, phone]);

  // Clean up object URLs on unmount or file removal
  useEffect(() => {
    return () => {
      attachments.forEach((att) => {
        if (att.previewUrl) URL.revokeObjectURL(att.previewUrl);
      });
    };
  }, [attachments]);

  // Handle files selection
  const handleFiles = (files) => {
    setErrorMessage("");
    const fileList = Array.from(files);
    const validImages = [];

    for (const file of fileList) {
      if (!file.type.startsWith("image/")) {
        addToast?.(t("reportIssueInvalidImageError"), "error");
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        addToast?.(t("reportIssueImageSizeError"), "error");
        continue;
      }
      validImages.push({
        file,
        previewUrl: URL.createObjectURL(file),
        name: file.name,
        size: (file.size / 1024).toFixed(1) + " KB",
      });
    }

    if (attachments.length + validImages.length > 5) {
      addToast?.(t("reportIssueMaxAttachmentsError"), "error");
      const remainingSlots = 5 - attachments.length;
      if (remainingSlots > 0) {
        setAttachments((prev) => [
          ...prev,
          ...validImages.slice(0, remainingSlots),
        ]);
      }
      return;
    }

    setAttachments((prev) => [...prev, ...validImages]);
  };

  const handleRemoveAttachment = (indexToRemove) => {
    setAttachments((prev) => {
      const item = prev[indexToRemove];
      if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((_, idx) => idx !== indexToRemove);
    });
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setFieldErrors({});

    // Basic client validation
    const errors = {};
    if (!title.trim())
      errors.title = isRTL ? "يرجى كتابة عنوان المشكلة" : "Title is required";
    if (!description.trim())
      errors.description = isRTL
        ? "يرجى توضيح تفاصيل المشكلة"
        : "Description is required";
    if (!user) {
      if (!name.trim())
        errors.name = isRTL
          ? "الاسم مطلوب للزوار"
          : "Name is required for guests";
      if (!email.trim())
        errors.email = isRTL
          ? "البريد الإلكتروني مطلوب للزوار"
          : "Email is required for guests";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("category", category);
      formData.append("title", title.trim());
      formData.append("description", description.trim());

      if (name.trim()) formData.append("name", name.trim());
      if (email.trim()) formData.append("email", email.trim());
      if (phone.trim()) formData.append("phone", phone.trim());

      attachments.forEach((att) => {
        formData.append("attachments[]", att.file);
      });

      const response = await submitIssueReport(formData);
      const reportData = response?.data || {};

      setSubmittedData(reportData);
      addToast?.(t("reportIssueSuccessTitle"), "success");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      const serverMsg =
        err?.response?.data?.message ||
        (isRTL
          ? "حدث خطأ أثناء إرسال البلاغ. يرجى المحاولة مرة أخرى."
          : "An error occurred while submitting the report. Please try again.");
      const serverErrors = err?.response?.data?.errors || {};

      setErrorMessage(serverMsg);
      setFieldErrors(serverErrors);
      addToast?.(serverMsg, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyTicketId = () => {
    if (!submittedData?.uuid) return;
    navigator.clipboard.writeText(submittedData.uuid).then(() => {
      setCopiedTicket(true);
      setTimeout(() => setCopiedTicket(false), 2500);
    });
  };

  const handleResetForm = () => {
    setSubmittedData(null);
    setTitle("");
    setDescription("");
    setCategory("bug");
    setAttachments([]);
    setErrorMessage("");
    setFieldErrors({});
    if (!user) {
      setName("");
      setEmail("");
      setPhone("");
    }
  };

  return (
    <div className="main-content report-issue-page">
      <SEO
        title={t("pageTitleReportIssue")}
        description={t("reportIssueDesc")}
        canonical="/report-issue"
      />

      {/* Header / Hero */}
      <section
        style={{
          background: "var(--surface)",
          borderBottom: "1px solid var(--border)",
          padding: "48px 0 36px",
        }}
      >
        <div className="container" style={{ maxWidth: 880 }}>
          {/* Breadcrumbs */}
          <nav
            aria-label="Breadcrumb"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: "0.85rem",
              color: "var(--text-secondary)",
              marginBottom: 16,
            }}
          >
            <Link
              to="/"
              style={{ color: "var(--text-secondary)", textDecoration: "none" }}
            >
              {t("home")}
            </Link>
            <span style={{ opacity: 0.5 }}>/</span>
            <span style={{ color: "var(--primary)", fontWeight: 600 }}>
              {t("reportIssue")}
            </span>
          </nav>

          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: "14px",
                background: "rgba(239, 68, 68, 0.12)",
                color: "#ef4444",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Icon name="alert-triangle" size={26} />
            </div>
            <div>
              <h1
                style={{
                  fontSize: "1.75rem",
                  fontWeight: 700,
                  color: "var(--text)",
                  margin: 0,
                  lineHeight: 1.3,
                }}
              >
                {t("reportIssue")}
              </h1>
              <p
                style={{
                  fontSize: "0.95rem",
                  color: "var(--text-secondary)",
                  marginTop: 6,
                  marginBottom: 0,
                  lineHeight: 1.6,
                }}
              >
                {t("reportIssueDesc")}
              </p>
            </div>
          </div>

          {user && (
            <div
              style={{
                marginTop: 20,
                padding: "10px 16px",
                borderRadius: "10px",
                background: "rgba(16, 185, 129, 0.08)",
                border: "1px solid rgba(16, 185, 129, 0.2)",
                fontSize: "0.88rem",
                color: "var(--text)",
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <Icon name="check-circle" size={18} color="#10b981" />
              <span>
                {t("reportIssueLoggedInNotice")}{" "}
                <strong>{user.name || user.email}</strong>{" "}
                {t("reportIssueLoggedInNoticeSuffix")}
              </span>
            </div>
          )}
        </div>
      </section>

      {/* Main Content Area */}
      <section style={{ padding: "40px 0 80px" }}>
        <div className="container" style={{ maxWidth: 880 }}>
          {/* SUCCESS SCREEN */}
          {submittedData ? (
            <div
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "16px",
                padding: "48px 32px",
                textAlign: "center",
                boxShadow: "0 10px 30px -10px rgba(0,0,0,0.06)",
              }}
            >
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: "50%",
                  background: "rgba(16, 185, 129, 0.12)",
                  color: "#10b981",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 20,
                }}
              >
                <Icon name="check" size={36} />
              </div>

              <h2
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 700,
                  color: "var(--text)",
                  marginBottom: 12,
                }}
              >
                {t("reportIssueSuccessTitle")}
              </h2>

              <p
                style={{
                  fontSize: "0.95rem",
                  color: "var(--text-secondary)",
                  maxWidth: 540,
                  margin: "0 auto 32px",
                  lineHeight: 1.6,
                }}
              >
                {t("reportIssueSuccessDesc")}
              </p>

              {/* Ticket ID Box */}
              <div
                style={{
                  display: "inline-block",
                  background: "var(--bg)",
                  border: "1px solid var(--border)",
                  borderRadius: "12px",
                  padding: "16px 24px",
                  marginBottom: 36,
                  maxWidth: 500,
                  width: "100%",
                }}
              >
                <div
                  style={{
                    fontSize: "0.8rem",
                    color: "var(--text-secondary)",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    marginBottom: 8,
                    fontWeight: 600,
                  }}
                >
                  {t("reportIssueTicketId")}
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 12,
                  }}
                >
                  <code
                    style={{
                      fontSize: "1rem",
                      fontWeight: 700,
                      color: "var(--primary)",
                      letterSpacing: "1px",
                      wordBreak: "break-all",
                    }}
                  >
                    {submittedData.uuid}
                  </code>
                  <button
                    type="button"
                    onClick={handleCopyTicketId}
                    style={{
                      background: copiedTicket
                        ? "rgba(16, 185, 129, 0.12)"
                        : "var(--surface)",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                      padding: "6px 12px",
                      fontSize: "0.82rem",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      color: copiedTicket ? "#10b981" : "var(--text)",
                      transition: "all 0.2s ease",
                      flexShrink: 0,
                    }}
                  >
                    <Icon name={copiedTicket ? "check" : "copy"} size={14} />
                    <span>
                      {copiedTicket
                        ? t("reportIssueCopied")
                        : t("reportIssueCopyTicket")}
                    </span>
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div
                style={{
                  display: "flex",
                  gap: 12,
                  justifyContent: "center",
                  flexWrap: "wrap",
                }}
              >
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="btn btn-primary"
                  style={{ minWidth: 160 }}
                >
                  <Icon name="plus-circle" size={16} />
                  <span>{t("reportIssueSubmitAnother")}</span>
                </button>
                <Link
                  to="/"
                  className="btn btn-secondary"
                  style={{ minWidth: 160 }}
                >
                  <Icon name="home" size={16} />
                  <span>{t("reportIssueBackHome")}</span>
                </Link>
              </div>
            </div>
          ) : (
            /* SUBMISSION FORM */
            <form
              onSubmit={handleSubmit}
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "16px",
                padding: "32px",
                boxShadow: "0 10px 30px -10px rgba(0,0,0,0.04)",
              }}
            >
              {errorMessage && (
                <div
                  style={{
                    padding: "14px 18px",
                    borderRadius: "10px",
                    background: "rgba(239, 68, 68, 0.08)",
                    border: "1px solid rgba(239, 68, 68, 0.25)",
                    color: "#ef4444",
                    marginBottom: 24,
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    fontSize: "0.92rem",
                  }}
                  role="alert"
                >
                  <Icon name="alert-circle" size={18} />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* 1. Category Selection */}
              <div style={{ marginBottom: 28 }}>
                <label
                  style={{
                    display: "block",
                    fontWeight: 600,
                    fontSize: "0.92rem",
                    color: "var(--text)",
                    marginBottom: 10,
                  }}
                >
                  {t("reportIssueCategory")}{" "}
                  <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fill, minmax(180px, 1fr))",
                    gap: 10,
                  }}
                >
                  {CATEGORIES.map((cat) => {
                    const isSelected = category === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setCategory(cat.id)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          padding: "12px 14px",
                          borderRadius: "10px",
                          border: `1.5px solid ${isSelected ? "var(--primary)" : "var(--border)"}`,
                          background: isSelected
                            ? "rgba(var(--primary-rgb, 14, 165, 233), 0.08)"
                            : "var(--bg)",
                          color: isSelected ? "var(--primary)" : "var(--text)",
                          cursor: "pointer",
                          textAlign: isRTL ? "right" : "left",
                          transition: "all 0.15s ease",
                          fontWeight: isSelected ? 600 : 400,
                          fontSize: "0.85rem",
                        }}
                      >
                        <div
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: "8px",
                            background: isSelected
                              ? "var(--primary)"
                              : "rgba(100, 116, 139, 0.12)",
                            color: isSelected
                              ? "#fff"
                              : "var(--text-secondary)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          <Icon name={cat.icon} size={15} />
                        </div>
                        <span style={{ lineHeight: 1.3 }}>
                          {t(cat.labelKey)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Issue Title */}
              <div style={{ marginBottom: 20 }}>
                <label
                  htmlFor="issue-title"
                  style={{
                    display: "block",
                    fontWeight: 600,
                    fontSize: "0.92rem",
                    color: "var(--text)",
                    marginBottom: 8,
                  }}
                >
                  {t("reportIssueTitle")}{" "}
                  <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  id="issue-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={t("reportIssueTitlePlaceholder")}
                  maxLength={255}
                  required
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    borderRadius: "10px",
                    border: `1px solid ${fieldErrors.title ? "#ef4444" : "var(--border)"}`,
                    background: "var(--bg)",
                    color: "var(--text)",
                    fontSize: "0.95rem",
                    outline: "none",
                  }}
                />
                {fieldErrors.title && (
                  <span
                    style={{
                      color: "#ef4444",
                      fontSize: "0.82rem",
                      marginTop: 4,
                      display: "block",
                    }}
                  >
                    {Array.isArray(fieldErrors.title)
                      ? fieldErrors.title[0]
                      : fieldErrors.title}
                  </span>
                )}
              </div>

              {/* 3. Issue Description */}
              <div style={{ marginBottom: 24 }}>
                <label
                  htmlFor="issue-description"
                  style={{
                    display: "block",
                    fontWeight: 600,
                    fontSize: "0.92rem",
                    color: "var(--text)",
                    marginBottom: 8,
                  }}
                >
                  {t("reportIssueDescription")}{" "}
                  <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <textarea
                  id="issue-description"
                  rows={6}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t("reportIssueDescriptionPlaceholder")}
                  maxLength={5000}
                  required
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    borderRadius: "10px",
                    border: `1px solid ${fieldErrors.description ? "#ef4444" : "var(--border)"}`,
                    background: "var(--bg)",
                    color: "var(--text)",
                    fontSize: "0.95rem",
                    lineHeight: 1.6,
                    outline: "none",
                    resize: "vertical",
                  }}
                />
                {fieldErrors.description && (
                  <span
                    style={{
                      color: "#ef4444",
                      fontSize: "0.82rem",
                      marginTop: 4,
                      display: "block",
                    }}
                  >
                    {Array.isArray(fieldErrors.description)
                      ? fieldErrors.description[0]
                      : fieldErrors.description}
                  </span>
                )}
              </div>

              {/* 4. Reporter Contact Information */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                  gap: 16,
                  marginBottom: 24,
                  padding: "20px",
                  borderRadius: "12px",
                  background: "var(--bg)",
                  border: "1px solid var(--border)",
                }}
              >
                <div>
                  <label
                    htmlFor="reporter-name"
                    style={{
                      display: "block",
                      fontWeight: 600,
                      fontSize: "0.88rem",
                      color: "var(--text)",
                      marginBottom: 6,
                    }}
                  >
                    {t("reportIssueName")}{" "}
                    {!user && <span style={{ color: "#ef4444" }}>*</span>}
                  </label>
                  <input
                    id="reporter-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t("reportIssueNamePlaceholder")}
                    required={!user}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      border: `1px solid ${fieldErrors.name ? "#ef4444" : "var(--border)"}`,
                      background: "var(--surface)",
                      color: "var(--text)",
                      fontSize: "0.9rem",
                      outline: "none",
                    }}
                  />
                  {fieldErrors.name && (
                    <span
                      style={{
                        color: "#ef4444",
                        fontSize: "0.8rem",
                        marginTop: 4,
                        display: "block",
                      }}
                    >
                      {Array.isArray(fieldErrors.name)
                        ? fieldErrors.name[0]
                        : fieldErrors.name}
                    </span>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="reporter-email"
                    style={{
                      display: "block",
                      fontWeight: 600,
                      fontSize: "0.88rem",
                      color: "var(--text)",
                      marginBottom: 6,
                    }}
                  >
                    {t("reportIssueEmail")}{" "}
                    {!user && <span style={{ color: "#ef4444" }}>*</span>}
                  </label>
                  <input
                    id="reporter-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t("reportIssueEmailPlaceholder")}
                    required={!user}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      border: `1px solid ${fieldErrors.email ? "#ef4444" : "var(--border)"}`,
                      background: "var(--surface)",
                      color: "var(--text)",
                      fontSize: "0.9rem",
                      outline: "none",
                    }}
                  />
                  {fieldErrors.email && (
                    <span
                      style={{
                        color: "#ef4444",
                        fontSize: "0.8rem",
                        marginTop: 4,
                        display: "block",
                      }}
                    >
                      {Array.isArray(fieldErrors.email)
                        ? fieldErrors.email[0]
                        : fieldErrors.email}
                    </span>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="reporter-phone"
                    style={{
                      display: "block",
                      fontWeight: 600,
                      fontSize: "0.88rem",
                      color: "var(--text)",
                      marginBottom: 6,
                    }}
                  >
                    {t("reportIssuePhone")}
                  </label>
                  <input
                    id="reporter-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={t("reportIssuePhonePlaceholder")}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      border: `1px solid ${fieldErrors.phone ? "#ef4444" : "var(--border)"}`,
                      background: "var(--surface)",
                      color: "var(--text)",
                      fontSize: "0.9rem",
                      outline: "none",
                    }}
                  />
                </div>
              </div>

              {/* 5. Image Attachments */}
              <div style={{ marginBottom: 32 }}>
                <label
                  style={{
                    display: "block",
                    fontWeight: 600,
                    fontSize: "0.92rem",
                    color: "var(--text)",
                    marginBottom: 4,
                  }}
                >
                  {t("reportIssueAttachments")}
                </label>
                <p
                  style={{
                    fontSize: "0.85rem",
                    color: "var(--text-secondary)",
                    marginTop: 0,
                    marginBottom: 12,
                  }}
                >
                  {t("reportIssueAttachmentsHint")}
                </p>

                {/* Dropzone */}
                {attachments.length < 5 && (
                  <div
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      border: `2px dashed ${dragActive ? "var(--primary)" : "var(--border)"}`,
                      borderRadius: "12px",
                      padding: "24px 16px",
                      textAlign: "center",
                      background: dragActive
                        ? "rgba(var(--primary-rgb, 14, 165, 233), 0.05)"
                        : "var(--bg)",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      marginBottom: attachments.length > 0 ? 16 : 0,
                    }}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          handleFiles(e.target.files);
                        }
                      }}
                      style={{ display: "none" }}
                    />
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: "50%",
                        background: "var(--surface)",
                        border: "1px solid var(--border)",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "var(--primary)",
                        marginBottom: 10,
                      }}
                    >
                      <Icon name="upload-cloud" size={22} />
                    </div>
                    <div
                      style={{
                        fontSize: "0.92rem",
                        fontWeight: 600,
                        color: "var(--text)",
                      }}
                    >
                      {t("reportIssueDragDrop")}
                    </div>
                    <div
                      style={{
                        fontSize: "0.8rem",
                        color: "var(--text-secondary)",
                        marginTop: 4,
                      }}
                    >
                      PNG, JPG, JPEG, WEBP (Max 5MB)
                    </div>
                  </div>
                )}

                {/* Attachments preview list */}
                {attachments.length > 0 && (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fill, minmax(140px, 1fr))",
                      gap: 12,
                    }}
                  >
                    {attachments.map((att, index) => (
                      <div
                        key={index}
                        style={{
                          position: "relative",
                          borderRadius: "10px",
                          overflow: "hidden",
                          border: "1px solid var(--border)",
                          background: "var(--bg)",
                        }}
                      >
                        <img
                          src={att.previewUrl}
                          alt={att.name}
                          style={{
                            width: "100%",
                            height: 100,
                            objectFit: "cover",
                            display: "block",
                          }}
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveAttachment(index);
                          }}
                          style={{
                            position: "absolute",
                            top: 6,
                            right: isRTL ? "auto" : 6,
                            left: isRTL ? 6 : "auto",
                            width: 24,
                            height: 24,
                            borderRadius: "50%",
                            background: "rgba(0,0,0,0.65)",
                            color: "#fff",
                            border: "none",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            transition: "background 0.2s",
                          }}
                          aria-label="Remove image"
                        >
                          <Icon name="x" size={14} />
                        </button>
                        <div
                          style={{
                            padding: "6px 8px",
                            fontSize: "0.75rem",
                            color: "var(--text-secondary)",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {att.name}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary"
                  style={{
                    minWidth: 180,
                    padding: "12px 28px",
                    fontSize: "0.95rem",
                    fontWeight: 600,
                  }}
                >
                  {submitting ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm"
                        role="status"
                        aria-hidden="true"
                      />
                      <span>{t("reportIssueSubmitting")}</span>
                    </>
                  ) : (
                    <>
                      <Icon name="send" size={16} />
                      <span>{t("reportIssueSubmitBtn")}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
