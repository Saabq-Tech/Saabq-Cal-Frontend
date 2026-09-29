import React, { useState } from "react";
import client, { endpoints } from "../../../../../../api/client";
import Icon from "../../../../../../components/common/Icon";
import { useLanguage } from "../../../../../../context/LanguageContext";

export default function SaabqChatCaptainAiTab() {
  const { t } = useLanguage();
  const [activeTask, setActiveTask] = useState("rewrite");
  const [inputText, setInputText] = useState("");
  const [tone, setTone] = useState("friendly");
  const [aiResult, setAiResult] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRunTask = async (e) => {
    e?.preventDefault();
    if (!inputText.trim()) return;

    setLoading(true);
    setAiResult("");

    try {
      const res = await client.post(
        endpoints.workspaceSaabqChatCaptainAiTask ||
          endpoints.chatCaptainAiTask,
        {
          task: activeTask,
          text: inputText,
          tone: tone,
        },
      );
      setAiResult(res.data?.data?.output || res.data?.data?.result || "");
    } catch (err) {
      setAiResult(
        err.response?.data?.message ||
          "تعذر تنفيذ مهمة الذكاء الاصطناعي. يرجى التأكد من تفعيل التكامل.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Intro Header */}
      <div
        style={{
          background:
            "linear-gradient(135deg, rgba(2, 105, 130, 0.08), rgba(3, 196, 225, 0.06))",
          padding: 24,
          borderRadius: "var(--radius-lg, 16px)",
          border: "1px solid rgba(2, 105, 130, 0.18)",
          display: "flex",
          alignItems: "center",
          gap: 16,
        }}
      >
        <div
          style={{
            width: 50,
            height: 50,
            borderRadius: "var(--radius-lg, 14px)",
            background:
              "linear-gradient(135deg, var(--primary), var(--primary-hover, #034d60))",
            color: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 14px rgba(2, 105, 130, 0.25)",
          }}
        >
          <Icon name="sparkles" size={26} />
        </div>
        <div>
          <h3
            style={{
              margin: "0 0 4px",
              fontSize: "1.15rem",
              fontWeight: 800,
              color: "var(--heading)",
            }}
          >
            استوديو كابتن الذكاء الاصطناعي (Captain AI Copilot)
          </h3>
          <p
            style={{
              margin: 0,
              fontSize: "0.85rem",
              color: "var(--text-secondary)",
              lineHeight: 1.5,
            }}
          >
            مساعد الذكاء الاصطناعي المتطور لإعادة صياغة الرسائل، تلخيص المحادثات
            الطويلة، وتوليد اقتراحات الردود الذكية فورياً.
          </p>
        </div>
      </div>

      {/* Task Selector Tabs */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {[
          {
            id: "rewrite",
            label:
              t("captainAiRewriteTask") ||
              "إعادة الصياغة وتعديل النبرة (Rewrite)",
            icon: "edit-3",
          },
          {
            id: "summarize",
            label: t("captainAiSummarizeTask") || "تلخيص المحادثة (Summarize)",
            icon: "file-text",
          },
          {
            id: "reply_suggestion",
            label:
              t("captainAiReplyTask") ||
              "توليد رد ذكي مقترح (Reply Suggestion)",
            icon: "zap",
          },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              setActiveTask(tab.id);
              setAiResult("");
            }}
            className={`btn ${activeTask === tab.id ? "btn-primary" : "btn-secondary"}`}
            style={{ gap: 8, fontSize: "0.86rem", padding: "10px 16px" }}
          >
            <Icon name={tab.icon} size={15} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Interactive Form & Result */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 20,
          background: "var(--surface)",
          padding: 24,
          borderRadius: "var(--radius-lg, 16px)",
          border: "1px solid var(--border)",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        {/* Input Side */}
        <form
          onSubmit={handleRunTask}
          style={{ display: "flex", flexDirection: "column", gap: 16 }}
        >
          <h4
            style={{
              margin: 0,
              fontSize: "0.95rem",
              fontWeight: 800,
              color: "var(--heading)",
            }}
          >
            {t("originalContextText") || "النص الأصلي / سياق المحادثة:"}
          </h4>

          {activeTask === "rewrite" && (
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  marginBottom: 6,
                }}
              >
                {t("requiredToneLabel") || "نبرة الصياغة المطلوبة:"}
              </label>
              <div style={{ display: "flex", gap: 8 }}>
                {[
                  {
                    id: "friendly",
                    label: t("friendlyToneLabel") || "ودية ولطيفة (Friendly)",
                  },
                  {
                    id: "formal",
                    label: t("formalToneLabel") || "رسمية ومهنية (Formal)",
                  },
                  {
                    id: "concise",
                    label: t("conciseToneLabel") || "مختصرة ومباشرة (Concise)",
                  },
                ].map((toneItem) => (
                  <button
                    key={toneItem.id}
                    type="button"
                    onClick={() => setTone(toneItem.id)}
                    style={{
                      padding: "6px 12px",
                      borderRadius: "var(--radius-sm, 6px)",
                      fontSize: "0.78rem",
                      cursor: "pointer",
                      border:
                        tone === toneItem.id
                          ? "2px solid var(--primary)"
                          : "1px solid var(--border)",
                      background:
                        tone === toneItem.id
                          ? "rgba(2, 105, 130, 0.1)"
                          : "var(--surface)",
                      color:
                        tone === toneItem.id
                          ? "var(--primary)"
                          : "var(--text-secondary)",
                      fontWeight: tone === toneItem.id ? 700 : 500,
                    }}
                  >
                    {toneItem.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <textarea
            rows={8}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              activeTask === "rewrite"
                ? t("captainRewritePlaceholder") ||
                  "اكتب النص أو المسودة المراد إعادة صياغتها..."
                : activeTask === "summarize"
                  ? t("captainSummarizePlaceholder") ||
                    "الصق نص المحادثة أو النقاط الرئيسية لتوليد ملخص تنفيذي..."
                  : t("captainReplyPlaceholder") ||
                    "اكتب رسالة العميل الأخيرة لاقتراح رد مناسب عليها..."
            }
            style={{
              width: "100%",
              padding: 14,
              borderRadius: "var(--radius-md, 10px)",
              border: "1px solid var(--border)",
              background: "var(--surface)",
              color: "var(--text)",
              fontSize: "0.88rem",
              lineHeight: 1.6,
              resize: "vertical",
            }}
          />

          <button
            type="submit"
            disabled={loading || !inputText.trim()}
            className="btn btn-primary"
            style={{
              alignSelf: "flex-start",
              gap: 8,
              boxShadow: "0 4px 14px rgba(2, 105, 130, 0.25)",
            }}
          >
            <Icon name="sparkles" size={16} />
            <span>
              {loading
                ? t("aiProcessing") ||
                  "جاري المعالجة بواسطة الذكاء الاصطناعي..."
                : t("generateResult") || "توليد النتيجة"}
            </span>
          </button>
        </form>

        {/* Output Side */}
        <div
          style={{
            background: "var(--surface-subtle, rgba(0,0,0,0.02))",
            borderRadius: 12,
            border: "1px solid var(--border)",
            padding: 20,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <h4
              style={{
                margin: 0,
                fontSize: "0.95rem",
                fontWeight: 800,
                color: "var(--heading)",
              }}
            >
              {t("generatedOutputHeader") || "النتيجة المولدة (Output):"}
            </h4>
            {aiResult && (
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(aiResult)}
                className="btn btn-secondary btn-sm"
                style={{ padding: "3px 8px", fontSize: "0.74rem", gap: 4 }}
              >
                <Icon name="copy" size={12} />
                <span>{t("copyResult") || "نسخ النتيجة"}</span>
              </button>
            )}
          </div>

          <div
            style={{
              flex: 1,
              whiteSpace: "pre-wrap",
              fontSize: "0.9rem",
              lineHeight: 1.7,
              color: aiResult ? "var(--heading)" : "var(--muted)",
              padding: 12,
              borderRadius: 8,
              background: "var(--surface)",
              border: "1px solid var(--border-subtle, rgba(0,0,0,0.05))",
            }}
          >
            {aiResult ||
              "ستظهر نتيجة كابتن الذكاء الاصطناعي هنا بعد الضغط على زر توليد النتيجة."}
          </div>
        </div>
      </div>
    </div>
  );
}
