import React, { useState, useEffect } from "react";
import { useLanguage } from "../../context/LanguageContext";
import Icon from "../common/Icon";

export default function TelegramActionBuilder({ configString, onChange }) {
  const { t } = useLanguage();

  const [configObj, setConfigObj] = useState(() => {
    try {
      if (!configString) return { states: {} };
      const parsed = JSON.parse(configString);
      return parsed?.states ? parsed : { states: {} };
    } catch {
      return { states: {} };
    }
  });

  useEffect(() => {
    if (Object.keys(configObj.states).length === 0) {
      onChange("");
    } else {
      onChange(JSON.stringify(configObj, null, 2));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configObj]);

  const availableStates = [
    { value: "pending", label: t("statusPending") || "Pending" },
    { value: "confirmed", label: t("statusConfirmed") || "Confirmed" },
    { value: "completed", label: t("statusCompleted") || "Completed" },
    { value: "rescheduled", label: t("statusRescheduled") || "Rescheduled" },
    { value: "cancelled", label: t("statusCancelled") || "Cancelled" },
  ];

  const addState = (e) => {
    const stateValue = e.target.value;
    if (!stateValue) return;
    if (!configObj.states[stateValue]) {
      setConfigObj((prev) => ({
        ...prev,
        states: { ...prev.states, [stateValue]: [] },
      }));
    }
    e.target.value = "";
  };

  const removeState = (stateValue) => {
    setConfigObj((prev) => {
      const newStates = { ...prev.states };
      delete newStates[stateValue];
      return { ...prev, states: newStates };
    });
  };

  const addButton = (stateValue) => {
    setConfigObj((prev) => {
      const newStates = { ...prev.states };
      newStates[stateValue] = [
        ...(newStates[stateValue] || []),
        {
          action: "confirm",
          text: "✅ " + (t("confirm") || "تأكيد"),
          target_status: "confirmed",
        },
      ];
      return { ...prev, states: newStates };
    });
  };

  const updateButton = (stateValue, index, field, value) => {
    setConfigObj((prev) => {
      const newStates = { ...prev.states };
      newStates[stateValue] = [...newStates[stateValue]];
      newStates[stateValue][index] = {
        ...newStates[stateValue][index],
        [field]: value,
      };
      if (field === "target_status") {
        newStates[stateValue][index].action = value;
      }
      return { ...prev, states: newStates };
    });
  };

  const removeButton = (stateValue, index) => {
    setConfigObj((prev) => {
      const newStates = { ...prev.states };
      newStates[stateValue] = newStates[stateValue].filter(
        (_, i) => i !== index,
      );
      return { ...prev, states: newStates };
    });
  };

  const unusedStates = availableStates.filter(
    (s) => !configObj.states[s.value],
  );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 16,
        background: "var(--surface-alt)",
        padding: 16,
        borderRadius: "var(--radius-md)",
        border: "1px solid var(--border-light)",
      }}
    >
      {Object.entries(configObj.states).map(([stateValue, buttons]) => {
        const stateLabel =
          availableStates.find((s) => s.value === stateValue)?.label ||
          stateValue;

        return (
          <div
            key={stateValue}
            style={{
              background: "var(--surface)",
              padding: 12,
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--border-light)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 12,
                borderBottom: "1px solid var(--border-light)",
                paddingBottom: 8,
              }}
            >
              <div
                style={{
                  fontWeight: 700,
                  fontSize: "0.9rem",
                  color: "var(--heading)",
                }}
              >
                {t("whenStatusIs") || "عندما تكون حالة الحجز:"}{" "}
                <span style={{ color: "var(--primary)" }}>{stateLabel}</span>
              </div>
              <button
                type="button"
                onClick={() => removeState(stateValue)}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--danger)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <Icon name="trash" size={16} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {buttons.map((btn, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    gap: 10,
                    alignItems: "center",
                    background: "var(--surface-alt)",
                    padding: 8,
                    borderRadius: "var(--radius-sm)",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <label
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--muted)",
                        display: "block",
                        marginBottom: 4,
                      }}
                    >
                      {t("buttonText") || "نص الزر"}
                    </label>
                    <input
                      type="text"
                      className="form-input form-input-sm"
                      value={btn.text}
                      onChange={(e) =>
                        updateButton(stateValue, idx, "text", e.target.value)
                      }
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--muted)",
                        display: "block",
                        marginBottom: 4,
                      }}
                    >
                      {t("changeStatusTo") || "تغيير الحالة إلى"}
                    </label>
                    <select
                      className="form-input form-input-sm"
                      value={btn.target_status}
                      onChange={(e) =>
                        updateButton(
                          stateValue,
                          idx,
                          "target_status",
                          e.target.value,
                        )
                      }
                    >
                      {availableStates.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div style={{ paddingTop: 20 }}>
                    <button
                      type="button"
                      onClick={() => removeButton(stateValue, idx)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--muted)",
                        cursor: "pointer",
                      }}
                    >
                      <Icon name="x" size={16} />
                    </button>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addButton(stateValue)}
                className="btn btn-secondary btn-sm"
                style={{
                  alignSelf: "flex-start",
                  marginTop: 4,
                  fontSize: "0.75rem",
                }}
              >
                <Icon name="plus" size={14} /> {t("addButton") || "إضافة زر"}
              </button>
            </div>
          </div>
        );
      })}

      {unusedStates.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <select
            className="form-input form-input-sm"
            onChange={addState}
            defaultValue=""
            style={{ maxWidth: 200 }}
          >
            <option value="" disabled>
              {t("addButtonsForState") || "إضافة أزرار لحالة..."}
            </option>
            {unusedStates.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
