import React, { useCallback, useEffect, useState } from "react";
import "./DateField.css";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

const IcoCalendar = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

function startOfLocalDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

function parseIsoLocal(iso: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

type Props = {
  value: string;
  onChange: (isoYyyyMmDd: string) => void;
  /** Inclusive max calendar day (YYYY-MM-DD), e.g. today for DOB fields */
  maxIsoDate?: string;
  label?: string;
  labelClassName?: string;
  labelStyle?: React.CSSProperties;
  inputClassName?: string;
  inputStyle?: React.CSSProperties;
  containerClassName?: string;
};

export const SoulProfileDateField: React.FC<Props> = ({
  value,
  onChange,
  maxIsoDate,
  label,
  labelClassName = "form-label",
  labelStyle,
  inputClassName = "",
  inputStyle,
  containerClassName = "mb-3",
}) => {
  const maxParsed = maxIsoDate ? parseIsoLocal(maxIsoDate) : null;
  const maxDayTs = maxParsed ? startOfLocalDay(maxParsed) : null;
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pickerMonth, setPickerMonth] = useState(() => new Date().getMonth());
  const [pickerYear, setPickerYear] = useState(() => new Date().getFullYear());
  const [pickerSelected, setPickerSelected] = useState<Date | null>(null);

  const openPicker = () => {
    if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [y, m, d] = value.split("-").map(Number);
      const dt = new Date(y, (m || 1) - 1, d || 1);
      setPickerSelected(dt);
      setPickerMonth(dt.getMonth());
      setPickerYear(dt.getFullYear());
    } else {
      const today = new Date();
      setPickerSelected(today);
      setPickerMonth(today.getMonth());
      setPickerYear(today.getFullYear());
    }
    setShowDatePicker(true);
  };

  const confirmDate = useCallback(() => {
    if (!pickerSelected) return;
    if (
      maxDayTs != null &&
      startOfLocalDay(pickerSelected) > maxDayTs
    ) {
      return;
    }
    const y = pickerSelected.getFullYear();
    const m = String(pickerSelected.getMonth() + 1).padStart(2, "0");
    const d = String(pickerSelected.getDate()).padStart(2, "0");
    onChange(`${y}-${m}-${d}`);
    setShowDatePicker(false);
  }, [pickerSelected, onChange, maxDayTs]);

  useEffect(() => {
    if (!showDatePicker) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setShowDatePicker(false);
      }
      if (
        e.key === "Enter" &&
        pickerSelected &&
        (maxDayTs == null ||
          startOfLocalDay(pickerSelected) <= maxDayTs)
      ) {
        e.preventDefault();
        confirmDate();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [showDatePicker, pickerSelected, confirmDate, maxDayTs]);

  return (
    <>
      <div className={containerClassName}>
        {label != null && (
          <label className={labelClassName} style={labelStyle}>
            {label}
          </label>
        )}
        <div className="spd-dob-wrap">
          <span className="spd-dob-ico" onClick={openPicker}>
            <IcoCalendar />
          </span>
          <input
            type="text"
            readOnly
            className={inputClassName}
            style={{ ...inputStyle, paddingLeft: 44 }}
            placeholder="dd-mm-yyyy"
            value={value ? value.split("-").reverse().join("-") : ""}
            onClick={openPicker}
          />
        </div>
      </div>

      {showDatePicker && (
        <div
          className="spd-datepicker-backdrop"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowDatePicker(false);
          }}
        >
          <div className="spd-datepicker">
            <div className="spd-datepicker-header">
              <div className="spd-datepicker-title">Select date</div>
              <div className="spd-datepicker-value">
                <span>
                  {pickerSelected
                    ? pickerSelected.toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })
                    : "—"}
                </span>
              </div>
            </div>

            <div className="spd-datepicker-body">
              <div className="spd-datepicker-month-row">
                <button
                  type="button"
                  className="spd-datepicker-arrow-btn"
                  onClick={() => {
                    const prevMonth = pickerMonth - 1;
                    if (prevMonth < 0) {
                      setPickerMonth(11);
                      setPickerYear(pickerYear - 1);
                    } else {
                      setPickerMonth(prevMonth);
                    }
                  }}
                >
                  {"<"}
                </button>
                <div className="spd-datepicker-month-row-center">
                  <div className="spd-datepicker-select-wrap">
                    <select
                      className="spd-datepicker-select"
                      value={pickerMonth}
                      onChange={(e) => setPickerMonth(Number(e.target.value))}
                    >
                      {MONTHS.map((m, idx) => (
                        <option key={m} value={idx}>
                          {m}
                        </option>
                      ))}
                    </select>
                    <span className="spd-datepicker-pencil">
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M12 20h9" />
                        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L8 18l-4 1 1-4 11.5-11.5z" />
                      </svg>
                    </span>
                  </div>
                  <div className="spd-datepicker-select-wrap">
                    <select
                      className="spd-datepicker-select"
                      value={pickerYear}
                      onChange={(e) => setPickerYear(Number(e.target.value))}
                    >
                      {Array.from({ length: 121 }).map((_, i) => {
                        const year = new Date().getFullYear() - 100 + i;
                        return (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        );
                      })}
                    </select>
                    <span className="spd-datepicker-pencil">
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M12 20h9" />
                        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L8 18l-4 1 1-4 11.5-11.5z" />
                      </svg>
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  className="spd-datepicker-arrow-btn"
                  onClick={() => {
                    const nextMonth = pickerMonth + 1;
                    if (nextMonth > 11) {
                      setPickerMonth(0);
                      setPickerYear(pickerYear + 1);
                    } else {
                      setPickerMonth(nextMonth);
                    }
                  }}
                >
                  {">"}
                </button>
              </div>

              <div className="spd-datepicker-grid">
                {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                  <div key={`wd-${i}`} className="spd-datepicker-weekday">
                    {d}
                  </div>
                ))}
                {(() => {
                  const firstDay = new Date(
                    pickerYear,
                    pickerMonth,
                    1,
                  ).getDay();
                  const daysInMonth = new Date(
                    pickerYear,
                    pickerMonth + 1,
                    0,
                  ).getDate();
                  const cells: React.ReactNode[] = [];
                  for (let i = 0; i < firstDay; i++) {
                    cells.push(
                      <button
                        key={`e-${i}`}
                        type="button"
                        className="spd-datepicker-day spd-outside"
                        disabled
                      />,
                    );
                  }
                  for (let day = 1; day <= daysInMonth; day++) {
                    const current = new Date(pickerYear, pickerMonth, day);
                    const isSelected =
                      pickerSelected != null &&
                      current.toDateString() === pickerSelected.toDateString();
                    const isDisabled =
                      maxDayTs != null &&
                      startOfLocalDay(current) > maxDayTs;
                    cells.push(
                      <button
                        key={day}
                        type="button"
                        className={
                          "spd-datepicker-day" +
                          (isSelected ? " spd-selected" : "") +
                          (isDisabled ? " spd-disabled" : "")
                        }
                        disabled={isDisabled}
                        onClick={() => {
                          if (!isDisabled) setPickerSelected(current);
                        }}
                      >
                        {day}
                      </button>,
                    );
                  }
                  return cells;
                })()}
              </div>
            </div>

            <div className="spd-datepicker-footer">
              <button
                type="button"
                className="spd-datepicker-btn spd-cancel"
                onClick={() => setShowDatePicker(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={
                  "spd-datepicker-btn spd-ok" +
                  (pickerSelected &&
                  (maxDayTs == null ||
                    startOfLocalDay(pickerSelected) <= maxDayTs)
                    ? " spd-enabled"
                    : "")
                }
                disabled={
                  !pickerSelected ||
                  (maxDayTs != null &&
                    startOfLocalDay(pickerSelected) > maxDayTs)
                }
                onClick={confirmDate}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
