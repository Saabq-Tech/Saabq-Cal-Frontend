import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useLanguage } from "../../context/LanguageContext";
import { useToast } from "../../context/ToastContext";
import client, { endpoints } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { getPublicAssetUrl } from "../../utils/url";

export default function RichTextEditor({
  value = "",
  onChange,
  disabled = false,
  placeholder = "",
  minHeight = 220,
  enableTemplates = false,
  enableKeywords = false,
  enablePrint = false,
  _workspaceTypeId = null,
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
  const colorPickerRef = useRef(null);

  const [isCodeView, setIsCodeView] = useState(false);
  const [htmlContent, setHtmlContent] = useState(value || "");
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [activeColor, setActiveColor] = useState("inherit");
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);
  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    underline: false,
    strikeThrough: false,
    justifyRight: false,
    justifyCenter: false,
    justifyLeft: false,
    insertUnorderedList: false,
    insertOrderedList: false,
  });

  const [showTableModal, setShowTableModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [tableRows, setTableRows] = useState(3);
  const [tableCols, setTableCols] = useState(3);

  // Close color picker on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        colorPickerRef.current &&
        !colorPickerRef.current.contains(event.target)
      ) {
        setShowColorPicker(false);
      }
    }
    if (showColorPicker) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showColorPicker]);

  const updateActiveFormats = useCallback(() => {
    if (disabled || isCodeView) return;
    try {
      setActiveFormats({
        bold: document.queryCommandState("bold"),
        italic: document.queryCommandState("italic"),
        underline: document.queryCommandState("underline"),
        strikeThrough: document.queryCommandState("strikeThrough"),
        justifyRight: document.queryCommandState("justifyRight"),
        justifyCenter: document.queryCommandState("justifyCenter"),
        justifyLeft: document.queryCommandState("justifyLeft"),
        insertUnorderedList: document.queryCommandState("insertUnorderedList"),
        insertOrderedList: document.queryCommandState("insertOrderedList"),
      });
    } catch {
      // ignore in environments without DOM selection
    }
  }, [disabled, isCodeView]);

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
    updateActiveFormats();
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
    { label: isRTL ? "تلقائي" : "Default", value: "inherit" },
    { label: isRTL ? "الأساسي" : "Primary", value: "#0a9099" },
    { label: isRTL ? "داكن" : "Dark", value: "#0f172a" },
    { label: isRTL ? "رمادي" : "Gray", value: "#64748b" },
    { label: isRTL ? "أحمر" : "Red", value: "#ef4444" },
    { label: isRTL ? "برتقالي" : "Amber", value: "#f59e0b" },
    { label: isRTL ? "أخضر" : "Green", value: "#10b981" },
    { label: isRTL ? "أزرق" : "Blue", value: "#3b82f6" },
    { label: isRTL ? "بنفسجي" : "Purple", value: "#8b5cf6" },
    { label: isRTL ? "وردي" : "Pink", value: "#ec4899" },
  ];

  return (
    <div
      className="rich-text-editor-container"
      style={{
        opacity: disabled ? 0.7 : 1,
        pointerEvents: disabled ? "none" : "auto",
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

      {/* Modern Responsive Toolbar */}
      <div
        className={`rte-toolbar ${isMobileExpanded ? "rte-toolbar-expanded" : ""}`}
      >
        {/* Group 1: Format Block Dropdown */}
        <div className="rte-group">
          <select
            className="rte-select"
            onChange={handleFormatBlock}
            disabled={isCodeView}
            aria-label={
              t("formatBlock") || (isRTL ? "تنسيق الفقرة" : "Paragraph Format")
            }
          >
            <option value="P">
              {t("paragraph") || (isRTL ? "فقرة عادية" : "Paragraph")}
            </option>
            <option value="H1">
              {t("heading1") || (isRTL ? "عنوان رئيسي (H1)" : "Heading 1")}
            </option>
            <option value="H2">
              {t("heading2") || (isRTL ? "عنوان فرعي (H2)" : "Heading 2")}
            </option>
            <option value="H3">
              {t("heading3") || (isRTL ? "عنوان صغير (H3)" : "Heading 3")}
            </option>
            <option value="BLOCKQUOTE">
              {t("quote") || (isRTL ? "اقتباس (Quote)" : "Quote")}
            </option>
          </select>
        </div>

        {/* Group 2: Inline Text Formatting */}
        <div className="rte-group">
          <button
            type="button"
            className={`rte-btn ${activeFormats.bold ? "active" : ""}`}
            title={t("bold") || (isRTL ? "عريض (Bold)" : "Bold")}
            onClick={() => executeCommand("bold")}
            disabled={isCodeView}
          >
            <BoldIcon />
          </button>

          <button
            type="button"
            className={`rte-btn ${activeFormats.italic ? "active" : ""}`}
            title={t("italic") || (isRTL ? "مائل (Italic)" : "Italic")}
            onClick={() => executeCommand("italic")}
            disabled={isCodeView}
          >
            <ItalicIcon />
          </button>

          <button
            type="button"
            className={`rte-btn ${activeFormats.underline ? "active" : ""}`}
            title={
              t("underline") || (isRTL ? "تسطير (Underline)" : "Underline")
            }
            onClick={() => executeCommand("underline")}
            disabled={isCodeView}
          >
            <UnderlineIcon />
          </button>

          <button
            type="button"
            className={`rte-btn ${activeFormats.strikeThrough ? "active" : ""}`}
            title={
              t("strikethrough") ||
              (isRTL ? "يتوسطه خط (Strike)" : "Strikethrough")
            }
            onClick={() => executeCommand("strikeThrough")}
            disabled={isCodeView}
          >
            <StrikethroughIcon />
          </button>

          {/* Text Color Picker Popover */}
          <div className="rte-color-picker-wrap" ref={colorPickerRef}>
            <button
              type="button"
              className={`rte-btn ${showColorPicker ? "active" : ""}`}
              title={t("textColor") || (isRTL ? "لون النص" : "Text Color")}
              onClick={() => setShowColorPicker(!showColorPicker)}
              disabled={isCodeView}
            >
              <TextColorIcon currentColor={activeColor} />
            </button>
            {showColorPicker && (
              <div className="rte-color-popover">
                <div className="rte-color-grid">
                  {colors.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      className="rte-color-dot"
                      onClick={() => {
                        executeCommand("foreColor", c.value);
                        setActiveColor(c.value);
                        setShowColorPicker(false);
                      }}
                      style={{
                        background:
                          c.value === "inherit" ? "transparent" : c.value,
                        border:
                          c.value === "inherit"
                            ? "1.5px dashed var(--text-muted, #94a3b8)"
                            : "1.5px solid rgba(0,0,0,0.1)",
                      }}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Group 3: Text Alignment */}
        <div className="rte-group">
          <button
            type="button"
            className={`rte-btn ${activeFormats.justifyRight ? "active" : ""}`}
            title={t("alignRight") || (isRTL ? "محاذاة لليمين" : "Align Right")}
            onClick={() => executeCommand("justifyRight")}
            disabled={isCodeView}
          >
            <AlignRightIcon />
          </button>

          <button
            type="button"
            className={`rte-btn ${activeFormats.justifyCenter ? "active" : ""}`}
            title={
              t("alignCenter") || (isRTL ? "محاذاة للوسط" : "Align Center")
            }
            onClick={() => executeCommand("justifyCenter")}
            disabled={isCodeView}
          >
            <AlignCenterIcon />
          </button>

          <button
            type="button"
            className={`rte-btn ${activeFormats.justifyLeft ? "active" : ""}`}
            title={t("alignLeft") || (isRTL ? "محاذاة لليسار" : "Align Left")}
            onClick={() => executeCommand("justifyLeft")}
            disabled={isCodeView}
          >
            <AlignLeftIcon />
          </button>
        </div>

        {/* Group 4: Lists & Dividers */}
        <div className="rte-group">
          <button
            type="button"
            className={`rte-btn ${activeFormats.insertUnorderedList ? "active" : ""}`}
            title={t("bulletList") || (isRTL ? "قائمة نقطية" : "Bullet List")}
            onClick={() => executeCommand("insertUnorderedList")}
            disabled={isCodeView}
          >
            <BulletListIcon />
          </button>

          <button
            type="button"
            className={`rte-btn ${activeFormats.insertOrderedList ? "active" : ""}`}
            title={t("numberList") || (isRTL ? "قائمة رقمية" : "Numbered List")}
            onClick={() => executeCommand("insertOrderedList")}
            disabled={isCodeView}
          >
            <NumberListIcon />
          </button>

          <button
            type="button"
            className="rte-btn"
            title={
              t("horizontalRule") || (isRTL ? "فاصل أفقي" : "Horizontal Rule")
            }
            onClick={() => executeCommand("insertHorizontalRule")}
            disabled={isCodeView}
          >
            <DividerIcon />
          </button>

          <button
            type="button"
            className="rte-btn"
            title={
              t("clearFormat") || (isRTL ? "مسح التنسيق" : "Clear Formatting")
            }
            onClick={() => executeCommand("removeFormat")}
            disabled={isCodeView}
          >
            <ClearFormatIcon />
          </button>
        </div>

        {/* Group 5: Inserts (Media, Link, Table) */}
        <div className="rte-group">
          <button
            type="button"
            className="rte-btn"
            title={
              t("uploadImage") ||
              (isRTL ? "إدراج صورة من الجهاز" : "Upload Image")
            }
            onClick={() => fileInputRef.current?.click()}
            disabled={isCodeView}
          >
            <ImageIcon />
          </button>

          <button
            type="button"
            className="rte-btn"
            title={
              t("imageUrl") ||
              (isRTL ? "إدراج صورة عبر رابط" : "Insert Image by URL")
            }
            onClick={handleInsertImageUrl}
            disabled={isCodeView}
          >
            <ImageLinkIcon />
          </button>

          <button
            type="button"
            className="rte-btn"
            title={t("insertTable") || (isRTL ? "إدراج جدول" : "Insert Table")}
            onClick={() => setShowTableModal(true)}
            disabled={isCodeView}
          >
            <TableIcon />
          </button>

          <button
            type="button"
            className="rte-btn"
            title={t("insertLink") || (isRTL ? "إدراج رابط" : "Insert Link")}
            onClick={() => setShowLinkModal(true)}
            disabled={isCodeView}
          >
            <LinkIcon />
          </button>
        </div>

        {/* Group 6: Special Action Pills (Templates & Keywords) */}
        {(enableTemplates || enableKeywords) && (
          <div className="rte-group-pills">
            {enableTemplates && (
              <button
                type="button"
                className="rte-badge-teal"
                title={isRTL ? "اختيار قالب جاهز" : "Select Template"}
                onClick={() => setShowTemplatesModal(true)}
                disabled={isCodeView}
              >
                <TemplateIcon />
                <span>{isRTL ? "قوالب جاهزة" : "Templates"}</span>
              </button>
            )}

            {enableKeywords && (
              <button
                type="button"
                className="rte-badge-blue"
                title={isRTL ? "إدراج كلمات مفتاحية" : "Insert Keywords"}
                onClick={() => setShowKeywordsModal(true)}
                disabled={isCodeView}
              >
                <TagIcon />
                <span>{isRTL ? "كلمات مفتاحية" : "Keywords"}</span>
              </button>
            )}
          </div>
        )}

        <div className="rte-toolbar-spacer" />

        {/* Group 7: Utility & Responsive Toggle */}
        <div className="rte-group rte-group-end">
          {enablePrint && (
            <button
              type="button"
              className="rte-btn"
              title={isRTL ? "طباعة المحتوى مع الترويسة" : "Print Content"}
              onClick={handlePrint}
              disabled={isCodeView}
            >
              <PrinterIcon />
            </button>
          )}

          <button
            type="button"
            className={`rte-badge-code ${isCodeView ? "active" : ""}`}
            title={
              isCodeView
                ? t("visualView") || (isRTL ? "العرض المرئي" : "Visual View")
                : t("codeView") || (isRTL ? "عرض كود HTML" : "HTML Code")
            }
            onClick={() => {
              if (isCodeView && editorRef.current) {
                editorRef.current.innerHTML = htmlContent;
              }
              setIsCodeView(!isCodeView);
            }}
          >
            <CodeIcon />
            <span>{isCodeView ? (isRTL ? "مرئي" : "Visual") : "HTML"}</span>
          </button>

          {/* Mobile Expand/Collapse Toggle */}
          <button
            type="button"
            className="rte-btn rte-mobile-toggle"
            title={
              isMobileExpanded
                ? isRTL
                  ? "تصغير شريط الأدوات"
                  : "Collapse Toolbar"
                : isRTL
                  ? "عرض جميع الأدوات"
                  : "Show All Tools"
            }
            onClick={() => setIsMobileExpanded(!isMobileExpanded)}
          >
            <ExpandIcon isExpanded={isMobileExpanded} />
          </button>
        </div>
      </div>

      {/* Editor Main Content Area */}
      {isCodeView ? (
        <textarea
          className="rte-code-textarea"
          value={htmlContent}
          onChange={handleCodeChange}
          style={{ minHeight }}
          placeholder={placeholder || "<h1>Title</h1><p>Content...</p>"}
        />
      ) : (
        <div
          ref={editorRef}
          className="rte-content-area"
          contentEditable={!disabled}
          onInput={handleInput}
          onBlur={handleInput}
          onKeyUp={updateActiveFormats}
          onMouseUp={updateActiveFormats}
          data-placeholder={placeholder}
          style={{ minHeight }}
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
                        ? "مفيش قوالب محفوظة لسه"
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

// Beautiful, crisp vector icons for rich text editor
function BoldIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
      <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
    </svg>
  );
}

function ItalicIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="19" y1="4" x2="10" y2="4" />
      <line x1="14" y1="20" x2="5" y2="20" />
      <line x1="15" y1="4" x2="9" y2="20" />
    </svg>
  );
}

function UnderlineIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 3v7a6 6 0 0 0 12 0V3" />
      <line x1="4" y1="21" x2="20" y2="21" />
    </svg>
  );
}

function StrikethroughIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 4H9a3 3 0 0 0-2.83 4" />
      <path d="M14 12a4 4 0 0 1 0 8H6" />
      <line x1="4" y1="12" x2="20" y2="12" />
    </svg>
  );
}

function TextColorIcon({ currentColor }) {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m4 19 7-14 7 14" />
      <path d="M6.5 14h11" />
      <rect
        x="3"
        y="20"
        width="18"
        height="3"
        rx="1.5"
        fill={
          currentColor === "inherit" ? "var(--primary, #0a9099)" : currentColor
        }
        stroke="none"
      />
    </svg>
  );
}

function AlignRightIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="21" y1="6" x2="3" y2="6" />
      <line x1="21" y1="12" x2="9" y2="12" />
      <line x1="21" y1="18" x2="5" y2="18" />
    </svg>
  );
}

function AlignCenterIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="10" x2="6" y2="10" />
      <line x1="21" y1="6" x2="3" y2="6" />
      <line x1="21" y1="14" x2="3" y2="14" />
      <line x1="18" y1="18" x2="6" y2="18" />
    </svg>
  );
}

function AlignLeftIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="21" y1="6" x2="3" y2="6" />
      <line x1="15" y1="12" x2="3" y2="12" />
      <line x1="19" y1="18" x2="3" y2="18" />
    </svg>
  );
}

function BulletListIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="9" y1="6" x2="20" y2="6" />
      <line x1="9" y1="12" x2="20" y2="12" />
      <line x1="9" y1="18" x2="20" y2="18" />
      <circle cx="4" cy="6" r="1.5" fill="currentColor" />
      <circle cx="4" cy="12" r="1.5" fill="currentColor" />
      <circle cx="4" cy="18" r="1.5" fill="currentColor" />
    </svg>
  );
}

function NumberListIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="10" y1="6" x2="21" y2="6" />
      <line x1="10" y1="12" x2="21" y2="12" />
      <line x1="10" y1="18" x2="21" y2="18" />
      <path d="M4 6h1v4" />
      <path d="M4 10h2" />
      <path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1" />
    </svg>
  );
}

function DividerIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="3" y1="12" x2="21" y2="12" strokeWidth="2.5" />
      <line x1="3" y1="6" x2="21" y2="6" strokeDasharray="2 3" opacity="0.6" />
      <line
        x1="3"
        y1="18"
        x2="21"
        y2="18"
        strokeDasharray="2 3"
        opacity="0.6"
      />
    </svg>
  );
}

function ClearFormatIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21" />
      <path d="M22 21H7" />
      <path d="m5 11 9 9" />
    </svg>
  );
}

function ImageIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  );
}

function ImageLinkIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="14" height="14" x="2" y="2" rx="2" />
      <circle cx="6.5" cy="6.5" r="1" fill="currentColor" />
      <path d="M12 15l2 2 4-4" />
      <path d="M10 17H6" />
      <path d="M14 11h2" />
    </svg>
  );
}

function TableIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="18" height="18" x="3" y="3" rx="2" />
      <path d="M3 9h18" />
      <path d="M3 15h18" />
      <path d="M9 3v18" />
      <path d="M15 3v18" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

function TemplateIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="18" height="18" x="3" y="3" rx="2" />
      <path d="M3 9h18" />
      <path d="M9 21V9" />
    </svg>
  );
}

function TagIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z" />
      <circle cx="7" cy="7" r=".8" fill="currentColor" />
    </svg>
  );
}

function PrinterIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="6 9 6 2 18 2 18 9" />
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <rect width="12" height="8" x="6" y="14" />
    </svg>
  );
}

function CodeIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  );
}

function ExpandIcon({ isExpanded }) {
  if (isExpanded) {
    return (
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="18 15 12 9 6 15" />
      </svg>
    );
  }
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}
