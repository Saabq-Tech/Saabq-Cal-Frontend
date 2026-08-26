import { useState, useRef, useEffect } from "react";
import { useLanguage } from "../../context/LanguageContext";
import Icon from "./Icon";

export default function RichTextEditor({
  value = "",
  onChange,
  disabled = false,
  placeholder = "",
  minHeight = 220,
}) {
  const { t, language } = useLanguage();
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

  // Sync internal state with prop value when updated externally
  useEffect(() => {
    if (value !== htmlContent) {
      setHtmlContent(value || "");
      if (editorRef.current && !isCodeView) {
        editorRef.current.innerHTML = value || "";
      }
    }
  }, [value, htmlContent, isCodeView]);

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
        border: "1px solid var(--border-light, #e2e8f0)",
        borderRadius: "var(--radius-md, 10px)",
        background: "var(--surface, #ffffff)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
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

      {/* Toolbar */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 4,
          padding: "8px 10px",
          background: "var(--background-subtle, #f8fafc)",
          borderBottom: "1px solid var(--border-light, #e2e8f0)",
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
      {showTableModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <form
            onSubmit={handleInsertTable}
            style={{
              background: "#fff",
              padding: 24,
              borderRadius: 12,
              width: 320,
              boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
            }}
          >
            <h4 style={{ margin: "0 0 16px 0", fontSize: "1.1rem" }}>
              {t("insertTable") || "إدراج جدول"}
            </h4>
            <div style={{ marginBottom: 12 }}>
              <label
                style={{
                  fontSize: "0.84rem",
                  display: "block",
                  marginBottom: 4,
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
        </div>
      )}

      {/* Insert Link Modal */}
      {showLinkModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <form
            onSubmit={handleInsertLink}
            style={{
              background: "#fff",
              padding: 24,
              borderRadius: 12,
              width: 360,
              boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
            }}
          >
            <h4 style={{ margin: "0 0 16px 0", fontSize: "1.1rem" }}>
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
        </div>
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
  color: "var(--text-main, #334155)",
};
