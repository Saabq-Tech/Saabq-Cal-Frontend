import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useLanguage } from "../../context/LanguageContext";
import { useToast } from "../../context/ToastContext";
import client, { endpoints } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { getPublicAssetUrl } from "../../utils/url";
import Icon from "./Icon";

export default function RichTextEditor({
  value = "",
  onChange,
  disabled = false,
  placeholder = "",
  minHeight = 220,
  enableTemplates = false,
  enableKeywords = false,
  enablePrint = false,
  templates: propTemplates = null,
  keywords: propKeywords = null,
  onSelectTemplate,
}) {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const toast = useToast();
  const isRTL = language === "ar";

  const editorRef = useRef(null);
  const fileInputRef = useRef(null);

  const [isCodeView, setIsCodeView] = useState(false);
  const [htmlContent, setHtmlContent] = useState(value || "");
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showTableModal, setShowTableModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [tableRows, setTableRows] = useState(3);
  const [tableCols, setTableCols] = useState(3);

  // Templates & Keywords Modals & State
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [templates, setTemplates] = useState(propTemplates || []);
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  const [showKeywordsModal, setShowKeywordsModal] = useState(false);
  const [keywords, setKeywords] = useState(propKeywords || []);
  const [loadingKeywords, setLoadingKeywords] = useState(false);
  const [keywordSearch, setKeywordSearch] = useState("");
  const [keywordOptions, setKeywordOptions] = useState({}); // { [kwId]: { title: true, description: true, image: true } }

  // New Keyword Creation on the fly
  const [showNewKeywordForm, setShowNewKeywordForm] = useState(false);
  const [newKwTitle, setNewKwTitle] = useState("");
  const [newKwDescription, setNewKwDescription] = useState("");
  const [newKwImage, setNewKwImage] = useState(null);
  const [creatingKeyword, setCreatingKeyword] = useState(false);

  // Sync internal state with prop value when updated externally
  useEffect(() => {
    if (value !== htmlContent) {
      setHtmlContent(value || "");
      if (editorRef.current && !isCodeView) {
        editorRef.current.innerHTML = value || "";
      }
    }
  }, [value, htmlContent, isCodeView]);

  const loadTemplates = useCallback(async () => {
    if (!enableTemplates || propTemplates) return;
    try {
      setLoadingTemplates(true);
      const res = await client.get(endpoints.workspaceTemplates);
      setTemplates(res.data?.data || []);
    } catch {
      // ignore
    } finally {
      setLoadingTemplates(false);
    }
  }, [enableTemplates, propTemplates]);

  const loadKeywords = useCallback(async () => {
    if (!enableKeywords || propKeywords) return;
    try {
      setLoadingKeywords(true);
      const res = await client.get(endpoints.workspaceKeywords);
      const list = res.data?.data || [];
      setKeywords(list);

      const initialOpts = {};
      list.forEach((kw) => {
        initialOpts[kw.id] = { title: true, description: true, image: true };
      });
      setKeywordOptions(initialOpts);
    } catch {
      // ignore
    } finally {
      setLoadingKeywords(false);
    }
  }, [enableKeywords, propKeywords]);

  useEffect(() => {
    if (enableTemplates) loadTemplates();
    if (enableKeywords) loadKeywords();
  }, [enableTemplates, enableKeywords, loadTemplates, loadKeywords]);

  const handleApplyTemplate = (tmpl) => {
    if (!tmpl?.content) return;
    if (
      htmlContent &&
      htmlContent.trim() !== "" &&
      !window.confirm(
        isRTL
          ? "هل ترغب في استبدال المحتوى الحالي بالقالب المحدد؟"
          : "Replace current content with the selected template?",
      )
    ) {
      return;
    }
    setHtmlContent(tmpl.content);
    if (editorRef.current) {
      editorRef.current.innerHTML = tmpl.content;
    }
    if (onChange) onChange(tmpl.content);
    if (onSelectTemplate) onSelectTemplate(tmpl);
    setShowTemplatesModal(false);
    toast.success(
      isRTL ? "تم تطبيق القالب بنجاح" : "Template applied successfully",
    );
  };

  const handleInsertKeyword = (kw) => {
    const opts = keywordOptions[kw.id] || {
      title: true,
      description: true,
      image: true,
    };
    const includeDesc = opts.description && kw.description;
    const includeImg = opts.image && kw.image_url;

    let snippet = "";
    if (includeImg && includeDesc) {
      snippet = `<div style="display: flex; gap: 10px; align-items: center; margin: 8px 0; padding: 8px 12px; background: #f0fdfa; border-inline-start: 4px solid #0d9488; border-radius: 6px;"><img src="${kw.image_url}" style="width: 44px; height: 44px; object-fit: cover; border-radius: 6px; flex-shrink: 0;" /><div><strong style="color: #0f766e;">${kw.title}</strong><p style="margin: 2px 0 0; font-size: 0.88em; color: #475569;">${kw.description}</p></div></div><p><br></p>`;
    } else if (includeImg && !includeDesc) {
      snippet = `<div style="display: flex; gap: 10px; align-items: center; margin: 6px 0;"><img src="${kw.image_url}" style="width: 40px; height: 40px; object-fit: cover; border-radius: 6px;" /><strong style="color: #0f766e;">${kw.title}</strong></div><p><br></p>`;
    } else if (includeDesc) {
      snippet = `<div style="margin: 6px 0; padding: 6px 12px; background: #f8fafc; border-inline-start: 3px solid #0d9488; border-radius: 4px;"><strong style="color: #0f766e;">${kw.title}</strong>: <span>${kw.description}</span></div><p><br></p>`;
    } else {
      snippet = `<strong>${kw.title}</strong>&nbsp;`;
    }

    executeCommand("insertHTML", snippet);
    setShowKeywordsModal(false);
  };

  const handleCreateKeywordOnTheFly = async (e) => {
    e.preventDefault();
    if (!newKwTitle.trim()) return;

    try {
      setCreatingKeyword(true);
      const formData = new FormData();
      formData.append("title", newKwTitle.trim());
      if (newKwDescription.trim())
        formData.append("description", newKwDescription.trim());
      if (newKwImage) formData.append("image", newKwImage);

      const res = await client.post(endpoints.workspaceKeywords, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const createdKw = res.data?.data;
      if (createdKw) {
        setKeywords((prev) => [createdKw, ...prev]);
        setKeywordOptions((prev) => ({
          ...prev,
          [createdKw.id]: { title: true, description: true, image: true },
        }));
        toast.success(
          isRTL
            ? "تم إضافة الكلمة المفتاحية بنجاح"
            : "Keyword created successfully",
        );
        setShowNewKeywordForm(false);
        setNewKwTitle("");
        setNewKwDescription("");
        setNewKwImage(null);
      }
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          (isRTL ? "فشل إنشاء الكلمة المفتاحية" : "Failed to create keyword"),
      );
    } finally {
      setCreatingKeyword(false);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const ws = user?.workspace || {};
    const wsName = ws.name || "";
    const wsLogo = ws.logo_url || (ws.logo ? getPublicAssetUrl(ws.logo) : "");
    const wsPhone = ws.phone || "";
    const wsEmail = ws.email || "";
    const wsAddress = ws.address || "";
    const saabqLogo = getPublicAssetUrl("/logo.png");

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="${isRTL ? "rtl" : "ltr"}" lang="${language}">
        <head>
          <meta charset="utf-8" />
          <title>${isRTL ? "تقرير ومستند" : "Document & Report"}</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 14mm 12mm 16mm 12mm;
            }
            *, *::before, *::after {
              box-sizing: border-box;
            }
            body {
              font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
              margin: 0;
              padding: 0;
              color: #0f172a;
              background: #ffffff;
              font-size: 13px;
              line-height: 1.6;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .print-wrapper {
              width: 100%;
              max-width: 820px;
              margin: 0 auto;
            }
            .letterhead {
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-bottom: 2px solid #0284c7;
              padding-bottom: 14px;
              margin-bottom: 18px;
              gap: 16px;
            }
            .ws-info {
              display: flex;
              align-items: center;
              gap: 12px;
            }
            .ws-logo {
              width: 54px;
              height: 54px;
              border-radius: 10px;
              object-fit: cover;
              border: 1px solid #e2e8f0;
            }
            .ws-title {
              font-size: 18px;
              font-weight: 800;
              color: #0f172a;
              margin: 0 0 4px 0;
            }
            .ws-contacts {
              font-size: 11px;
              color: #64748b;
              display: flex;
              gap: 10px;
              flex-wrap: wrap;
            }
            .platform-branding {
              text-align: ${isRTL ? "left" : "right"};
              display: flex;
              flex-direction: column;
              align-items: ${isRTL ? "flex-start" : "flex-end"};
              gap: 4px;
            }
            .platform-badge {
              display: inline-flex;
              align-items: center;
              gap: 6px;
              background: #f0fdf4;
              border: 1px solid #bbf7d0;
              padding: 4px 10px;
              border-radius: 6px;
              font-size: 11px;
              font-weight: 700;
              color: #166534;
            }
            .platform-logo {
              height: 18px;
              width: auto;
            }
            .platform-sub {
              font-size: 10px;
              color: #94a3b8;
            }
            .report-box {
              background: #ffffff;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              padding: 20px;
              min-height: 240px;
              margin-bottom: 24px;
            }
            .report-content {
              line-height: 1.8;
              font-size: 13px;
              color: #1e293b;
            }
            .report-content p { margin: 0 0 10px 0; }
            .report-content h1, .report-content h2, .report-content h3 {
              color: #0f172a;
              margin-top: 14px;
              margin-bottom: 8px;
            }
            .report-content table {
              width: 100%;
              border-collapse: collapse;
              margin: 12px 0;
            }
            .report-content th, .report-content td {
              border: 1px solid #cbd5e1;
              padding: 8px 10px;
              text-align: ${isRTL ? "right" : "left"};
            }
            .report-content th {
              background: #f1f5f9;
              font-weight: 700;
            }
            .signoff-section {
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
              margin-top: 36px;
              padding-top: 16px;
              page-break-inside: avoid;
            }
            .signoff-col {
              text-align: center;
              width: 220px;
            }
            .signoff-slot {
              height: 48px;
              border-bottom: 1px dashed #94a3b8;
              margin-bottom: 6px;
            }
            .signoff-title {
              font-size: 11px;
              color: #64748b;
              font-weight: 600;
            }
            .letterhead-footer {
              margin-top: 24px;
              padding-top: 12px;
              border-top: 1px solid #e2e8f0;
              display: flex;
              justify-content: space-between;
              align-items: center;
              font-size: 10px;
              color: #94a3b8;
              page-break-inside: avoid;
            }
          </style>
        </head>
        <body>
          <div class="print-wrapper">
            ${
              wsName
                ? `
              <header class="letterhead">
                <div class="ws-info">
                  ${wsLogo ? `<img src="${wsLogo}" class="ws-logo" alt="${wsName}" onerror="this.style.display='none'" />` : ""}
                  <div>
                    <h1 class="ws-title">${wsName}</h1>
                    <div class="ws-contacts">
                      ${wsPhone ? `<span>📞 ${wsPhone}</span>` : ""}
                      ${wsEmail ? `<span>✉️ ${wsEmail}</span>` : ""}
                      ${wsAddress ? `<span>📍 ${wsAddress}</span>` : ""}
                    </div>
                  </div>
                </div>

                <div class="platform-branding">
                  <div class="platform-badge">
                    <img src="${saabqLogo}" class="platform-logo" alt="Saabq" onerror="this.style.display='none'" />
                    <span>${isRTL ? "تقويم سابق | Saabq Cal" : "Saabq Cal Platform"}</span>
                  </div>
                  <div class="platform-sub">${isRTL ? "نظام إدارة المواعيد والخدمات المعتمد" : "Verified Booking & Operations System"}</div>
                </div>
              </header>
            `
                : ""
            }

            <section class="report-box">
              <div class="report-content">
                ${htmlContent || `<p style="color:#94a3b8;font-style:italic;">${isRTL ? "مستند فارغ" : "Empty document"}</p>`}
              </div>
            </section>

            <div class="signoff-section">
              <div class="signoff-col">
                <div class="signoff-slot"></div>
                <div class="signoff-title">${isRTL ? "التوقيع والاعتماد" : "Signature"}</div>
              </div>
              <div class="signoff-col">
                <div class="signoff-slot"></div>
                <div class="signoff-title">${isRTL ? "الختم الرسمي" : "Official Stamp"}</div>
              </div>
            </div>

            <footer class="letterhead-footer">
              <span>${isRTL ? "تم إصدار وتوثيق هذا المستند إلكترونياً عبر منصة تقويم سابق (Saabq Cal)" : "Issued & verified electronically via Saabq Cal Platform"}</span>
              <span>${new Date().toLocaleDateString(isRTL ? "ar-SA" : "en-US", { year: "numeric", month: "numeric", day: "numeric" })}</span>
            </footer>
          </div>

          <script>
            window.onload = function() {
              window.print();
              window.close();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleInput = () => {
    if (editorRef.current) {
      const newHtml = editorRef.current.innerHTML;
      setHtmlContent(newHtml);
      if (onChange) onChange(newHtml);
    }
  };

  const handleCodeChange = (e) => {
    const newHtml = e.target.value;
    setHtmlContent(newHtml);
    if (onChange) onChange(newHtml);
  };

  const executeCommand = (command, value = null) => {
    if (disabled || isCodeView) return;
    document.execCommand(command, false, value);
    handleInput();
  };

  const handleFormatBlock = (e) => {
    executeCommand("formatBlock", e.target.value);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Url = event.target?.result;
      if (base64Url) {
        executeCommand("insertImage", base64Url);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleInsertImageUrl = () => {
    const url = prompt(
      isRTL ? "أدخل رابط الصورة (URL):" : "Enter Image URL:",
      "https://",
    );
    if (url && url !== "https://") {
      executeCommand("insertImage", url);
    }
  };

  const handleInsertLink = (e) => {
    e.preventDefault();
    if (!linkUrl) return;

    let formattedUrl = linkUrl;
    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = "https://" + formattedUrl;
    }

    executeCommand("createLink", formattedUrl);
    setLinkUrl("");
    setShowLinkModal(false);
  };

  const handleInsertTable = (e) => {
    e.preventDefault();
    const rows = Math.max(1, Math.min(20, Number(tableRows) || 3));
    const cols = Math.max(1, Math.min(10, Number(tableCols) || 3));

    let tableHtml = `<table style="width: 100%; border-collapse: collapse; margin: 12px 0; border: 1px solid var(--border-light, #e2e8f0);"><thead><tr>`;
    for (let c = 1; c <= cols; c++) {
      tableHtml += `<th style="border: 1px solid #cbd5e1; padding: 8px 12px; background: #f8fafc; font-weight: 700; text-align: ${
        isRTL ? "right" : "left"
      };">Header ${c}</th>`;
    }
    tableHtml += `</tr></thead><tbody>`;

    for (let r = 1; r <= rows; r++) {
      tableHtml += `<tr>`;
      for (let c = 1; c <= cols; c++) {
        tableHtml += `<td style="border: 1px solid #cbd5e1; padding: 8px 12px; text-align: ${
          isRTL ? "right" : "left"
        };">Cell ${r}-${c}</td>`;
      }
      tableHtml += `</tr>`;
    }
    tableHtml += `</tbody></table><p><br></p>`;

    executeCommand("insertHTML", tableHtml);
    setShowTableModal(false);
  };

  const colors = [
    { label: "Default", value: "inherit" },
    { label: "Primary", value: "var(--primary, #0a9099)" },
    { label: "Dark", value: "#1e293b" },
    { label: "Red", value: "#ef4444" },
    { label: "Blue", value: "#3b82f6" },
    { label: "Green", value: "#10b981" },
    { label: "Amber", value: "#f59e0b" },
    { label: "Purple", value: "#8b5cf6" },
  ];

  return (
    <div
      className="rich-text-editor-container"
      style={{
        border: "1.5px solid var(--border, #cbd5e1)",
        borderRadius: "var(--radius-md, 12px)",
        background: "var(--surface, #ffffff)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        opacity: disabled ? 0.7 : 1,
        pointerEvents: disabled ? "none" : "auto",
        marginBottom: "22px",
      }}
    >
      {/* Hidden File Input for Image Upload */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        style={{ display: "none" }}
        onChange={handleImageUpload}
      />

      {/* Toolbar */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 4,
          padding: "8px 10px",
          background: "var(--surface-alt)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        {/* Format Block Dropdown */}
        <select
          className="form-select"
          onChange={handleFormatBlock}
          disabled={isCodeView}
          style={{
            width: "auto",
            height: 32,
            padding: "2px 8px",
            fontSize: "0.8rem",
            borderRadius: 6,
          }}
        >
          <option value="P">
            {t("paragraph") || "فقرة عادية (Paragraph)"}
          </option>
          <option value="H1">{t("heading1") || "عنوان كبير (H1)"}</option>
          <option value="H2">{t("heading2") || "عنوان متوسط (H2)"}</option>
          <option value="H3">{t("heading3") || "عنوان فرعي (H3)"}</option>
          <option value="BLOCKQUOTE">{t("quote") || "اقتباس (Quote)"}</option>
        </select>

        <div
          style={{
            height: 20,
            width: 1,
            background: "var(--border-light, #cbd5e1)",
            margin: "0 4px",
          }}
        />

        {/* Text Formatting Buttons */}
        <button
          type="button"
          className="btn-toolbar"
          title={t("bold") || "عريض (Bold)"}
          onClick={() => executeCommand("bold")}
          disabled={isCodeView}
          style={btnStyle}
        >
          <strong>B</strong>
        </button>

        <button
          type="button"
          className="btn-toolbar"
          title={t("italic") || "مائل (Italic)"}
          onClick={() => executeCommand("italic")}
          disabled={isCodeView}
          style={btnStyle}
        >
          <em>I</em>
        </button>

        <button
          type="button"
          className="btn-toolbar"
          title={t("underline") || "تحته خط (Underline)"}
          onClick={() => executeCommand("underline")}
          disabled={isCodeView}
          style={btnStyle}
        >
          <u>U</u>
        </button>

        <button
          type="button"
          className="btn-toolbar"
          title={t("strikethrough") || "يتوسطه خط (Strike)"}
          onClick={() => executeCommand("strikeThrough")}
          disabled={isCodeView}
          style={btnStyle}
        >
          <s>S</s>
        </button>

        {/* Text Color Dropdown */}
        <div style={{ position: "relative" }}>
          <button
            type="button"
            className="btn-toolbar"
            title={t("textColor") || "لون النص (Text Color)"}
            onClick={() => setShowColorPicker(!showColorPicker)}
            disabled={isCodeView}
            style={btnStyle}
          >
            <span style={{ fontWeight: 800, color: "var(--primary, #0a9099)" }}>
              A
            </span>
          </button>
          {showColorPicker && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                left: isRTL ? "auto" : 0,
                right: isRTL ? 0 : "auto",
                zIndex: 20,
                background: "#fff",
                border: "1px solid #cbd5e1",
                borderRadius: 8,
                padding: 6,
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: 6,
                boxShadow: "0 8px 20px rgba(0,0,0,0.12)",
              }}
            >
              {colors.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => {
                    executeCommand("foreColor", c.value);
                    setShowColorPicker(false);
                  }}
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    background: c.value === "inherit" ? "#fff" : c.value,
                    border: "1px solid #cbd5e1",
                    cursor: "pointer",
                  }}
                  title={c.label}
                />
              ))}
            </div>
          )}
        </div>

        <div
          style={{
            height: 20,
            width: 1,
            background: "var(--border-light, #cbd5e1)",
            margin: "0 4px",
          }}
        />

        {/* Alignment */}
        <button
          type="button"
          className="btn-toolbar"
          title={t("alignRight") || "محاذاة لليمين"}
          onClick={() => executeCommand("justifyRight")}
          disabled={isCodeView}
          style={btnStyle}
        >
          <Icon name="align-right" size={14} />
        </button>

        <button
          type="button"
          className="btn-toolbar"
          title={t("alignCenter") || "محاذاة للوسط"}
          onClick={() => executeCommand("justifyCenter")}
          disabled={isCodeView}
          style={btnStyle}
        >
          <Icon name="align-center" size={14} />
        </button>

        <button
          type="button"
          className="btn-toolbar"
          title={t("alignLeft") || "محاذاة لليسار"}
          onClick={() => executeCommand("justifyLeft")}
          disabled={isCodeView}
          style={btnStyle}
        >
          <Icon name="align-left" size={14} />
        </button>

        <div
          style={{
            height: 20,
            width: 1,
            background: "var(--border-light, #cbd5e1)",
            margin: "0 4px",
          }}
        />

        {/* Lists */}
        <button
          type="button"
          className="btn-toolbar"
          title={t("bulletList") || "قائمة نقطية"}
          onClick={() => executeCommand("insertUnorderedList")}
          disabled={isCodeView}
          style={btnStyle}
        >
          • List
        </button>

        <button
          type="button"
          className="btn-toolbar"
          title={t("numberList") || "قائمة رقمية"}
          onClick={() => executeCommand("insertOrderedList")}
          disabled={isCodeView}
          style={btnStyle}
        >
          1. List
        </button>

        <div
          style={{
            height: 20,
            width: 1,
            background: "var(--border-light, #cbd5e1)",
            margin: "0 4px",
          }}
        />

        {/* Rich Elements */}
        <button
          type="button"
          className="btn-toolbar"
          title={t("uploadImage") || "إدراج صورة من الجهاز"}
          onClick={() => fileInputRef.current?.click()}
          disabled={isCodeView}
          style={btnStyle}
        >
          <Icon name="image" size={14} />
        </button>

        <button
          type="button"
          className="btn-toolbar"
          title={t("imageUrl") || "إدراج صورة عبر رابط"}
          onClick={handleInsertImageUrl}
          disabled={isCodeView}
          style={btnStyle}
        >
          <Icon name="link" size={14} />
        </button>

        <button
          type="button"
          className="btn-toolbar"
          title={t("insertTable") || "إدراج جدول"}
          onClick={() => setShowTableModal(true)}
          disabled={isCodeView}
          style={btnStyle}
        >
          <Icon name="table" size={14} />
        </button>

        <button
          type="button"
          className="btn-toolbar"
          title={t("insertLink") || "إدراج رابط"}
          onClick={() => setShowLinkModal(true)}
          disabled={isCodeView}
          style={btnStyle}
        >
          🔗
        </button>

        <button
          type="button"
          className="btn-toolbar"
          title={t("horizontalRule") || "خط فاصل أفقي"}
          onClick={() => executeCommand("insertHorizontalRule")}
          disabled={isCodeView}
          style={btnStyle}
        >
          ―
        </button>

        <button
          type="button"
          className="btn-toolbar"
          title={t("clearFormat") || "مسح التنسيق"}
          onClick={() => executeCommand("removeFormat")}
          disabled={isCodeView}
          style={btnStyle}
        >
          🧹
        </button>

        {enableTemplates && (
          <button
            type="button"
            className="btn-toolbar"
            title={isRTL ? "اختيار قالب جاهز" : "Select Template"}
            onClick={() => setShowTemplatesModal(true)}
            disabled={isCodeView}
            style={{
              ...btnStyle,
              background: "rgba(13, 148, 136, 0.12)",
              color: "#0f766e",
              fontWeight: 700,
              fontSize: "0.76rem",
              padding: "4px 9px",
              borderRadius: 6,
              border: "1px solid rgba(13, 148, 136, 0.3)",
              gap: 4,
            }}
          >
            <span>📄</span>
            <span>{isRTL ? "قوالب جاهزة" : "Templates"}</span>
          </button>
        )}

        {enableKeywords && (
          <button
            type="button"
            className="btn-toolbar"
            title={isRTL ? "إدراج كلمات مفتاحية" : "Insert Keywords"}
            onClick={() => setShowKeywordsModal(true)}
            disabled={isCodeView}
            style={{
              ...btnStyle,
              background: "rgba(59, 130, 246, 0.12)",
              color: "#2563eb",
              fontWeight: 700,
              fontSize: "0.76rem",
              padding: "4px 9px",
              borderRadius: 6,
              border: "1px solid rgba(59, 130, 246, 0.3)",
              gap: 4,
            }}
          >
            <span>🏷️</span>
            <span>{isRTL ? "كلمات مفتاحية" : "Keywords"}</span>
          </button>
        )}

        {enablePrint && (
          <button
            type="button"
            className="btn-toolbar"
            title={isRTL ? "طباعة المحتوى" : "Print Content"}
            onClick={handlePrint}
            style={{
              ...btnStyle,
              padding: "4px 8px",
              fontSize: "0.82rem",
            }}
          >
            🖨️
          </button>
        )}

        <div style={{ flex: 1 }} />

        {/* HTML Code View Toggle */}
        <button
          type="button"
          className="btn-toolbar"
          title={
            isCodeView
              ? t("visualView") || "العرض المرئي"
              : t("codeView") || "عرض كود HTML"
          }
          onClick={() => {
            if (isCodeView && editorRef.current) {
              editorRef.current.innerHTML = htmlContent;
            }
            setIsCodeView(!isCodeView);
          }}
          style={{
            ...btnStyle,
            background: isCodeView ? "var(--primary, #0a9099)" : "transparent",
            color: isCodeView ? "#fff" : "inherit",
            fontWeight: 700,
            fontSize: "0.76rem",
            padding: "4px 8px",
          }}
        >
          &lt;/&gt; {isCodeView ? t("visual") || "مرئي" : "HTML"}
        </button>
      </div>

      {/* Editor Main Content Area */}
      {isCodeView ? (
        <textarea
          className="form-textarea"
          value={htmlContent}
          onChange={handleCodeChange}
          style={{
            minHeight,
            fontFamily: "monospace",
            fontSize: "0.86rem",
            border: "none",
            borderRadius: 0,
            padding: 12,
            background: "#0f172a",
            color: "#38bdf8",
            width: "100%",
            boxSizing: "border-box",
            resize: "vertical",
          }}
          placeholder={placeholder || "<h1>Title</h1><p>Content...</p>"}
        />
      ) : (
        <div
          ref={editorRef}
          contentEditable={!disabled}
          onInput={handleInput}
          onBlur={handleInput}
          data-placeholder={placeholder}
          style={{
            minHeight,
            padding: 16,
            outline: "none",
            overflowY: "auto",
            lineHeight: 1.7,
            color: "var(--heading, #0f172a)",
          }}
          dangerouslySetInnerHTML={{ __html: value || "" }}
        />
      )}

      {/* Insert Table Modal */}
      {showTableModal &&
        createPortal(
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(15, 23, 42, 0.7)",
              backdropFilter: "blur(4px)",
              zIndex: 9999999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 16,
            }}
          >
            <form
              onSubmit={handleInsertTable}
              style={{
                background: "var(--surface)",
                color: "var(--heading)",
                border: "1px solid var(--border)",
                padding: 24,
                borderRadius: 12,
                width: 320,
                boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
              }}
            >
              <h4
                style={{
                  margin: "0 0 16px 0",
                  fontSize: "1.1rem",
                  color: "var(--heading)",
                }}
              >
                {t("insertTable") || "إدراج جدول"}
              </h4>
              <div style={{ marginBottom: 12 }}>
                <label
                  style={{
                    fontSize: "0.84rem",
                    display: "block",
                    marginBottom: 4,
                    color: "var(--text-secondary)",
                  }}
                >
                  {t("rows") || "عدد الصفوف"}:
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  className="form-input"
                  value={tableRows}
                  onChange={(e) => setTableRows(e.target.value)}
                  required
                />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label
                  style={{
                    fontSize: "0.84rem",
                    display: "block",
                    marginBottom: 4,
                    color: "var(--text-secondary)",
                  }}
                >
                  {t("cols") || "عدد الأعمدة"}:
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  className="form-input"
                  value={tableCols}
                  onChange={(e) => setTableCols(e.target.value)}
                  required
                />
              </div>
              <div
                style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}
              >
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowTableModal(false)}
                >
                  {t("cancel") || "إلغاء"}
                </button>
                <button type="submit" className="btn btn-primary">
                  {t("insert") || "إدراج"}
                </button>
              </div>
            </form>
          </div>,
          document.body,
        )}

      {/* Insert Link Modal */}
      {showLinkModal &&
        createPortal(
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(15, 23, 42, 0.7)",
              backdropFilter: "blur(4px)",
              zIndex: 9999999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 16,
            }}
          >
            <form
              onSubmit={handleInsertLink}
              style={{
                background: "var(--surface)",
                color: "var(--heading)",
                border: "1px solid var(--border)",
                padding: 24,
                borderRadius: 12,
                width: 360,
                boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
              }}
            >
              <h4
                style={{
                  margin: "0 0 16px 0",
                  fontSize: "1.1rem",
                  color: "var(--heading)",
                }}
              >
                {t("insertLink") || "إدراج رابط"}
              </h4>
              <div style={{ marginBottom: 20 }}>
                <label
                  style={{
                    fontSize: "0.84rem",
                    display: "block",
                    marginBottom: 4,
                  }}
                >
                  {t("url") || "الرابط (URL)"}:
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://example.com"
                  required
                />
              </div>
              <div
                style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}
              >
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowLinkModal(false)}
                >
                  {t("cancel") || "إلغاء"}
                </button>
                <button type="submit" className="btn btn-primary">
                  {t("insert") || "إدراج"}
                </button>
              </div>
            </form>
          </div>,
          document.body,
        )}

      {/* Templates Modal */}
      {showTemplatesModal &&
        createPortal(
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(15, 23, 42, 0.7)",
              backdropFilter: "blur(4px)",
              zIndex: 9999999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 16,
            }}
          >
            <div
              style={{
                background: "var(--surface)",
                color: "var(--heading)",
                border: "1px solid var(--border)",
                padding: 24,
                borderRadius: 16,
                width: "100%",
                maxWidth: 580,
                maxHeight: "85vh",
                display: "flex",
                flexDirection: "column",
                boxShadow: "0 20px 40px rgba(0,0,0,0.25)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 16,
                  paddingBottom: 12,
                  borderBottom: "1px solid var(--border-light)",
                }}
              >
                <h4 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800 }}>
                  {isRTL ? "📄 اختيار قالب جاهز" : "📄 Choose a Template"}
                </h4>
                <button
                  type="button"
                  onClick={() => setShowTemplatesModal(false)}
                  style={{
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--text-secondary)",
                    fontSize: "1.1rem",
                  }}
                >
                  ✕
                </button>
              </div>

              <p
                style={{
                  margin: "0 0 16px 0",
                  fontSize: "0.84rem",
                  color: "var(--text-secondary)",
                }}
              >
                {isRTL
                  ? "اختر قالباً لبدء كتابة التقرير أو الملخص، أو يمكنك البدء بمستند فارغ."
                  : "Select a template to start drafting, or choose to start with a blank document."}
              </p>

              <div
                style={{
                  overflowY: "auto",
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                  flex: 1,
                  paddingRight: 4,
                  marginBottom: 16,
                }}
              >
                {loadingTemplates ? (
                  <p
                    style={{
                      textAlign: "center",
                      padding: 20,
                      color: "var(--text-secondary)",
                    }}
                  >
                    {isRTL ? "جاري تحميل القوالب..." : "Loading templates..."}
                  </p>
                ) : templates.length === 0 ? (
                  <div
                    style={{
                      textAlign: "center",
                      padding: 24,
                      color: "var(--text-secondary)",
                    }}
                  >
                    <p style={{ margin: 0, fontWeight: 700 }}>
                      {isRTL
                        ? "لا توجد قوالب محفوظة بعد"
                        : "No templates saved yet"}
                    </p>
                  </div>
                ) : (
                  templates.map((tmpl) => (
                    <div
                      key={tmpl.id}
                      style={{
                        border: "1.5px solid var(--border-light)",
                        borderRadius: 12,
                        padding: 14,
                        background: "var(--surface-alt)",
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
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
                              fontWeight: 800,
                              fontSize: "0.95rem",
                              color: "var(--heading)",
                            }}
                          >
                            {tmpl.name}
                          </span>
                          {tmpl.is_default && (
                            <span
                              style={{
                                padding: "2px 8px",
                                borderRadius: 20,
                                fontSize: "0.72rem",
                                fontWeight: 800,
                                background: "rgba(13, 148, 136, 0.15)",
                                color: "#0f766e",
                              }}
                            >
                              {isRTL ? "افتراضي" : "Default"}
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={() => handleApplyTemplate(tmpl)}
                          style={{
                            padding: "5px 14px",
                            fontSize: "0.82rem",
                            borderRadius: 8,
                          }}
                        >
                          {isRTL ? "تطبيق القالب" : "Apply"}
                        </button>
                      </div>

                      {tmpl.description && (
                        <p
                          style={{
                            margin: 0,
                            fontSize: "0.82rem",
                            color: "var(--text-secondary)",
                          }}
                        >
                          {tmpl.description}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 10,
                  paddingTop: 12,
                  borderTop: "1px solid var(--border-light)",
                }}
              >
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    if (
                      window.confirm(
                        isRTL
                          ? "هل تريد بدء مستند فارغ ومسح المحتوى الحالي؟"
                          : "Start blank and clear current content?",
                      )
                    ) {
                      setHtmlContent("");
                      if (editorRef.current) editorRef.current.innerHTML = "";
                      if (onChange) onChange("");
                      setShowTemplatesModal(false);
                    }
                  }}
                  style={{ fontSize: "0.84rem" }}
                >
                  {isRTL ? "بدء مستند فارغ" : "Start Blank"}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowTemplatesModal(false)}
                  style={{ fontSize: "0.84rem" }}
                >
                  {t("cancel") || "إلغاء"}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* Keywords Modal */}
      {showKeywordsModal &&
        createPortal(
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(15, 23, 42, 0.7)",
              backdropFilter: "blur(4px)",
              zIndex: 9999999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 16,
            }}
          >
            <div
              style={{
                background: "var(--surface)",
                color: "var(--heading)",
                border: "1px solid var(--border)",
                padding: 24,
                borderRadius: 16,
                width: "100%",
                maxWidth: 620,
                maxHeight: "85vh",
                display: "flex",
                flexDirection: "column",
                boxShadow: "0 20px 40px rgba(0,0,0,0.25)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 14,
                  paddingBottom: 10,
                  borderBottom: "1px solid var(--border-light)",
                }}
              >
                <h4
                  style={{
                    margin: 0,
                    fontSize: "1.1rem",
                    fontWeight: 800,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <span>🏷️</span>
                  <span>
                    {isRTL
                      ? "الكلمات المفتاحية والمصطلحات"
                      : "Workspace Keywords"}
                  </span>
                </h4>
                <button
                  type="button"
                  onClick={() => setShowKeywordsModal(false)}
                  style={{
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--text-secondary)",
                    fontSize: "1.1rem",
                  }}
                >
                  ✕
                </button>
              </div>

              {/* Top Toolbar: Search & Add Button */}
              <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder={
                    isRTL ? "بحث في الكلمات المفتاحية..." : "Search keywords..."
                  }
                  value={keywordSearch}
                  onChange={(e) => setKeywordSearch(e.target.value)}
                  style={{ flex: 1, fontSize: "0.85rem", height: 38 }}
                />
                <button
                  type="button"
                  className={`btn ${showNewKeywordForm ? "btn-secondary" : "btn-primary"}`}
                  onClick={() => setShowNewKeywordForm(!showNewKeywordForm)}
                  style={{
                    padding: "6px 14px",
                    fontSize: "0.82rem",
                    borderRadius: 8,
                    whiteSpace: "nowrap",
                  }}
                >
                  {showNewKeywordForm
                    ? isRTL
                      ? "إلغاء الإضافة"
                      : "Cancel"
                    : isRTL
                      ? "+ إضافة كلمة جديدة"
                      : "+ Add Keyword"}
                </button>
              </div>

              {/* Quick Add Form */}
              {showNewKeywordForm && (
                <form
                  onSubmit={handleCreateKeywordOnTheFly}
                  style={{
                    background: "var(--surface-alt)",
                    border: "1px solid var(--border-light)",
                    borderRadius: 12,
                    padding: 14,
                    marginBottom: 14,
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                  }}
                >
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: "0.86rem",
                      color: "var(--heading)",
                    }}
                  >
                    {isRTL
                      ? "إضافة مصطلح / كلمة مفتاحية جديدة لنوع مساحة العمل"
                      : "Add new keyword for this workspace type"}
                  </div>
                  <input
                    type="text"
                    className="form-input"
                    placeholder={
                      isRTL
                        ? "عنوان الكلمة المفتاحية (مثل: Paracetamol 500mg)"
                        : "Keyword Title"
                    }
                    value={newKwTitle}
                    onChange={(e) => setNewKwTitle(e.target.value)}
                    required
                    style={{ fontSize: "0.84rem" }}
                  />
                  <textarea
                    className="form-textarea"
                    rows={2}
                    placeholder={
                      isRTL
                        ? "الوصف والجرعة أو التعليمات (اختياري)..."
                        : "Description / instructions (optional)..."
                    }
                    value={newKwDescription}
                    onChange={(e) => setNewKwDescription(e.target.value)}
                    style={{ fontSize: "0.84rem" }}
                  />
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 10,
                    }}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        setNewKwImage(e.target.files?.[0] || null)
                      }
                      style={{ fontSize: "0.78rem" }}
                    />
                    <button
                      type="submit"
                      className="btn btn-primary btn-sm"
                      disabled={creatingKeyword || !newKwTitle.trim()}
                      style={{ padding: "6px 16px", borderRadius: 8 }}
                    >
                      {creatingKeyword
                        ? isRTL
                          ? "جاري الحفظ..."
                          : "Saving..."
                        : isRTL
                          ? "حفظ الكلمة"
                          : "Save Keyword"}
                    </button>
                  </div>
                </form>
              )}

              {/* Keywords List with customizable insertion options */}
              <div
                style={{
                  overflowY: "auto",
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  flex: 1,
                  paddingRight: 4,
                }}
              >
                {loadingKeywords ? (
                  <p
                    style={{
                      textAlign: "center",
                      padding: 20,
                      color: "var(--text-secondary)",
                    }}
                  >
                    {isRTL
                      ? "جاري تحميل الكلمات المفتاحية..."
                      : "Loading keywords..."}
                  </p>
                ) : keywords.filter((kw) => {
                    if (!keywordSearch.trim()) return true;
                    const q = keywordSearch.toLowerCase();
                    return (
                      (kw.title && kw.title.toLowerCase().includes(q)) ||
                      (kw.description &&
                        kw.description.toLowerCase().includes(q))
                    );
                  }).length === 0 ? (
                  <div
                    style={{
                      textAlign: "center",
                      padding: 24,
                      color: "var(--text-secondary)",
                    }}
                  >
                    <p style={{ margin: 0, fontWeight: 700 }}>
                      {isRTL
                        ? "لم يتم العثور على كلمات مطابقة"
                        : "No matching keywords found"}
                    </p>
                    <p style={{ margin: "4px 0 0", fontSize: "0.8rem" }}>
                      {isRTL
                        ? "يمكنك إضافة كلمة مفتاحية جديدة باستخدام الزر أعلاه."
                        : "You can add a new keyword using the button above."}
                    </p>
                  </div>
                ) : (
                  keywords
                    .filter((kw) => {
                      if (!keywordSearch.trim()) return true;
                      const q = keywordSearch.toLowerCase();
                      return (
                        (kw.title && kw.title.toLowerCase().includes(q)) ||
                        (kw.description &&
                          kw.description.toLowerCase().includes(q))
                      );
                    })
                    .map((kw) => {
                      const opts = keywordOptions[kw.id] || {
                        title: true,
                        description: true,
                        image: true,
                      };
                      return (
                        <div
                          key={kw.id}
                          style={{
                            border: "1px solid var(--border-light)",
                            borderRadius: 12,
                            padding: 12,
                            background: "var(--surface-alt)",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: 12,
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 10,
                              flex: 1,
                              minWidth: 0,
                            }}
                          >
                            {kw.image_url && (
                              <img
                                src={kw.image_url}
                                alt={kw.title}
                                style={{
                                  width: 44,
                                  height: 44,
                                  borderRadius: 8,
                                  objectFit: "cover",
                                  border: "1px solid var(--border-light)",
                                  flexShrink: 0,
                                }}
                              />
                            )}
                            <div style={{ minWidth: 0 }}>
                              <div
                                style={{
                                  fontWeight: 800,
                                  fontSize: "0.92rem",
                                  color: "var(--heading)",
                                }}
                              >
                                {kw.title}
                              </div>
                              {kw.description && (
                                <div
                                  style={{
                                    fontSize: "0.8rem",
                                    color: "var(--text-secondary)",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                    maxWidth: "340px",
                                  }}
                                >
                                  {kw.description}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Customization checkboxes: Title, Description, Image */}
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 10,
                              flexShrink: 0,
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                gap: 8,
                                fontSize: "0.76rem",
                                color: "var(--text-secondary)",
                              }}
                            >
                              <label
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 3,
                                  cursor: "pointer",
                                }}
                              >
                                <input
                                  type="checkbox"
                                  checked={opts.title !== false}
                                  onChange={(e) =>
                                    setKeywordOptions((prev) => ({
                                      ...prev,
                                      [kw.id]: {
                                        ...(prev[kw.id] || {}),
                                        title: e.target.checked,
                                      },
                                    }))
                                  }
                                />
                                <span>{isRTL ? "العنوان" : "Title"}</span>
                              </label>

                              {kw.description && (
                                <label
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 3,
                                    cursor: "pointer",
                                  }}
                                >
                                  <input
                                    type="checkbox"
                                    checked={opts.description !== false}
                                    onChange={(e) =>
                                      setKeywordOptions((prev) => ({
                                        ...prev,
                                        [kw.id]: {
                                          ...(prev[kw.id] || {}),
                                          description: e.target.checked,
                                        },
                                      }))
                                    }
                                  />
                                  <span>{isRTL ? "الوصف" : "Desc"}</span>
                                </label>
                              )}

                              {kw.image_url && (
                                <label
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 3,
                                    cursor: "pointer",
                                  }}
                                >
                                  <input
                                    type="checkbox"
                                    checked={opts.image !== false}
                                    onChange={(e) =>
                                      setKeywordOptions((prev) => ({
                                        ...prev,
                                        [kw.id]: {
                                          ...(prev[kw.id] || {}),
                                          image: e.target.checked,
                                        },
                                      }))
                                    }
                                  />
                                  <span>{isRTL ? "الصورة" : "Image"}</span>
                                </label>
                              )}
                            </div>

                            <button
                              type="button"
                              className="btn btn-primary btn-sm"
                              onClick={() => handleInsertKeyword(kw)}
                              style={{
                                padding: "6px 14px",
                                borderRadius: 8,
                                fontSize: "0.8rem",
                                fontWeight: 800,
                              }}
                            >
                              {isRTL ? "إدراج" : "Insert"}
                            </button>
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}

const btnStyle = {
  background: "transparent",
  border: "1px solid transparent",
  borderRadius: 4,
  padding: "4px 6px",
  cursor: "pointer",
  fontSize: "0.84rem",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  color: "var(--heading)",
};
