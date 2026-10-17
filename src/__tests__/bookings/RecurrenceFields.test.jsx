import { useState } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import RecurrenceFields from "../../pages/member/dashboard/workspace-settings/RecurrenceFields";
import {
  DEFAULT_RECURRENCE,
  recurrencePayload,
} from "../../pages/member/dashboard/workspace-settings/recurrence";
import { LanguageProvider } from "../../context/LanguageContext";
import { translations } from "../../translations/translations";

const ar = translations.ar;
let latest;

function Harness({ startDate = "2026-10-17" }) {
  const [value, setValue] = useState(DEFAULT_RECURRENCE);
  latest = value;
  return (
    <RecurrenceFields value={value} onChange={setValue} startDate={startDate} />
  );
}

function renderFields(props) {
  return render(
    <LanguageProvider>
      <Harness {...props} />
    </LanguageProvider>,
  );
}

describe("RecurrenceFields", () => {
  beforeEach(() => localStorage.setItem("saabq_lang", "ar"));

  it("starts with the weekday of the chosen date when enabled", () => {
    renderFields();
    expect(screen.queryByText(ar.recurrenceDays)).not.toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("checkbox", {
        name: new RegExp(ar.recurrenceRepeatWeekly),
      }),
    );

    // 17 Oct 2026 is a Saturday (6).
    expect(latest.weekdays).toEqual([6]);
    expect(
      screen.getByRole("button", { name: ar.recurrenceSat }),
    ).toHaveAttribute("aria-pressed", "true");
  });

  it("toggles days and shows the fields of each period", () => {
    renderFields();
    fireEvent.click(
      screen.getByRole("checkbox", {
        name: new RegExp(ar.recurrenceRepeatWeekly),
      }),
    );
    fireEvent.click(screen.getByRole("button", { name: ar.recurrenceTue }));
    expect(latest.weekdays).toEqual([6, 2]);

    const period = screen.getByLabelText(ar.recurrencePeriod);
    fireEvent.change(period, { target: { value: "months" } });
    expect(screen.getByLabelText(ar.recurrenceMonthsCount)).toBeInTheDocument();

    fireEvent.change(period, { target: { value: "until" } });
    fireEvent.change(screen.getByLabelText(ar.recurrenceEndsOn), {
      target: { value: "2026-12-31" },
    });
    expect(latest.ends_on).toBe("2026-12-31");

    fireEvent.change(period, { target: { value: "open" } });
    expect(screen.getByText(ar.recurrenceOpenHint)).toBeInTheDocument();
  });
});

describe("recurrencePayload", () => {
  it("sends only the fields of the chosen period", () => {
    expect(
      recurrencePayload({
        ...DEFAULT_RECURRENCE,
        weekdays: [6, 2],
        period: "months",
        months: "3",
        ends_on: "2026-12-31",
      }),
    ).toEqual({
      weekdays: [2, 6],
      period: "months",
      months: 3,
      ends_on: null,
    });
    expect(
      recurrencePayload({
        ...DEFAULT_RECURRENCE,
        weekdays: [1],
        period: "until",
        ends_on: "2026-12-31",
      }),
    ).toEqual({
      weekdays: [1],
      period: "until",
      months: null,
      ends_on: "2026-12-31",
    });
  });
});
