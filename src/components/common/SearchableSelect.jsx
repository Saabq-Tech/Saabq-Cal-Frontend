import React, { useState, useRef, useEffect } from "react";
import Icon from "./Icon";

export default function SearchableSelect({
  value,
  onChange,
  options = [],
  placeholder = "",
  searchPlaceholder = "",
  disabled = false,
  error = false,
  className = "",
  style = {},
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

  // Normalize options to [{ value, label, raw }]
  const normalizedOptions = options.map((opt) => {
    if (typeof opt === "object" && opt !== null) {
      const val = opt.value ?? opt.id ?? opt.name;
      const lbl = opt.label ?? opt.name ?? String(val);
      return {
        value: val,
        label: lbl,
        raw: opt,
      };
    }
    return { value: opt, label: String(opt), raw: opt };
  });

  const selectedOption = normalizedOptions.find(
    (opt) => String(opt.value) === String(value),
  );

  const filteredOptions = normalizedOptions.filter((opt) => {
    if (!search.trim()) return true;
    const query = search.toLowerCase();
    const matchLabel = opt.label?.toString().toLowerCase().includes(query);
    const matchVal = opt.value?.toString().toLowerCase().includes(query);
    return matchLabel || matchVal;
  });

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus search input on open
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
    if (!isOpen) {
      setSearch("");
    }
  }, [isOpen]);

  const handleSelect = (opt) => {
    onChange(opt.value, opt.raw);
    setIsOpen(false);
  };

  return (
    <div
      ref={containerRef}
      style={{ position: "relative", width: "100%", ...style }}
      className={`searchable-select-container ${className}`}
    >
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className="form-select"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          textAlign: "inherit",
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.65 : 1,
          background: "var(--surface, #fff)",
          paddingRight: "16px",
          paddingLeft: "16px",
          minHeight: "46px",
          border: error ? "1.5px solid var(--error, #dc2626)" : undefined,
          borderRadius: "var(--radius-md, 12px)",
        }}
      >
        <span
          style={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            fontWeight: selectedOption ? 600 : 400,
            color: selectedOption
              ? "var(--heading, #1e293b)"
              : "var(--muted, #94a3b8)",
          }}
        >
          {selectedOption ? selectedOption.label : placeholder || "اختر..."}
        </span>
        <Icon
          name="chevron-down"
          size={16}
          style={{
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s ease",
            flexShrink: 0,
            marginInlineStart: 8,
            color: "var(--muted, #64748b)",
          }}
        />
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            zIndex: 9999,
            background: "var(--surface, #ffffff)",
            border: "1px solid var(--border, #e2e8f0)",
            borderRadius: "10px",
            boxShadow:
              "0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.05)",
            overflow: "hidden",
          }}
        >
          {/* Search Box */}
          <div
            style={{
              padding: "8px",
              borderBottom: "1px solid var(--border-light, #f1f5f9)",
              background: "var(--surface-alt, #f8fafc)",
            }}
          >
            <div
              style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
              }}
            >
              <Icon
                name="search"
                size={15}
                style={{
                  position: "absolute",
                  marginInlineStart: 10,
                  color: "var(--muted, #94a3b8)",
                  pointerEvents: "none",
                }}
              />
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={searchPlaceholder || "بحث..."}
                style={{
                  width: "100%",
                  paddingTop: "8px",
                  paddingBottom: "8px",
                  paddingInlineStart: "32px",
                  paddingInlineEnd: "28px",
                  borderRadius: "6px",
                  border: "1px solid var(--border, #cbd5e1)",
                  fontSize: "0.84rem",
                  outline: "none",
                  background: "#fff",
                  color: "var(--text, #334155)",
                }}
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  style={{
                    position: "absolute",
                    marginInlineEnd: 8,
                    right: 0,
                    insetInlineEnd: 8,
                    border: "none",
                    background: "none",
                    cursor: "pointer",
                    color: "var(--muted, #94a3b8)",
                    padding: 2,
                    display: "flex",
                  }}
                >
                  <Icon name="x" size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Options List */}
          <div
            style={{ maxHeight: "220px", overflowY: "auto", padding: "4px 0" }}
          >
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => {
                const isSelected = String(opt.value) === String(value);
                return (
                  <div
                    key={String(opt.value)}
                    onClick={() => handleSelect(opt)}
                    style={{
                      padding: "9px 14px",
                      fontSize: "0.86rem",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      background: isSelected
                        ? "var(--primary-subtle, #f0fdf4)"
                        : "transparent",
                      color: isSelected
                        ? "var(--primary, #11646a)"
                        : "var(--heading, #1e293b)",
                      fontWeight: isSelected ? 700 : 400,
                      transition: "background 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected)
                        e.currentTarget.style.background =
                          "var(--surface-hover, #f1f5f9)";
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected)
                        e.currentTarget.style.background = "transparent";
                    }}
                  >
                    <span>{opt.label}</span>
                    {isSelected && (
                      <Icon
                        name="check"
                        size={16}
                        style={{
                          color: "var(--primary, #11646a)",
                          flexShrink: 0,
                        }}
                      />
                    )}
                  </div>
                );
              })
            ) : (
              <div
                style={{
                  padding: "12px 14px",
                  fontSize: "0.84rem",
                  color: "var(--muted, #94a3b8)",
                  textAlign: "center",
                }}
              >
                لا توجد نتائج متطابقة
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
