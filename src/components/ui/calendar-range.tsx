"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export type CalendarRangeProps = {
  selectedStart: Date | null;
  selectedEnd: Date | null;
  onChange: (start: Date | null, end: Date | null) => void;
  /** The current visible month (year+month). Controlled by parent for consistency */
  currentMonth: Date;
  onMonthChange: (next: Date) => void;
  /** Past dates before this date will be disabled */
  minDate?: Date;
  /** Optional year range for the year picker */
  yearRange?: { start: number; end: number };
  /** Compact style variant */
  size?: "sm" | "md";
  className?: string;
};

// Utility helpers local to the component
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const isSameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const isBeforeDay = (a: Date, b: Date) => startOfDay(a).getTime() < startOfDay(b).getTime();
const isAfterDay = (a: Date, b: Date) => startOfDay(a).getTime() > startOfDay(b).getTime();

function formatLabel(start: Date | null, end: Date | null) {
  if (start && end) {
    const f = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" });
    return `${f.format(start)} – ${f.format(end)}`;
  }
  if (start) {
    return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(start);
  }
  return "No date selected";
}

function formatFullLabel(start: Date | null, end: Date | null) {
  const f = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" });
  if (start && end) return `${f.format(start)} – ${f.format(end)}`;
  if (start) return f.format(start);
  return "No date selected";
}

export function CalendarRange({
  selectedStart,
  selectedEnd,
  onChange,
  currentMonth,
  onMonthChange,
  minDate,
  yearRange,
  size = "sm",
  className,
}: CalendarRangeProps) {
  const visibleMonth = useMemo(() => new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1), [currentMonth]);
  const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const weekdays = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

  type ViewMode = "date" | "month" | "year";
  const [view, setView] = useState<ViewMode>("date");
  const [yearPageStart, setYearPageStart] = useState(() => visibleMonth.getFullYear() - 6);

  useEffect(() => {
    // Keep the year grid centered around the visible year when month changes
    setYearPageStart(visibleMonth.getFullYear() - 6);
  }, [visibleMonth]);

  const cellBase = size === "sm" ? "w-8 h-8 text-sm" : "w-9 h-9 text-base";
  const headerText = "text-sm font-medium text-[hsl(258_46%_25%)]";
  const subText = "text-[10px] text-[hsl(258_22%_50%)]";

  const disablePrevMonth = !!minDate && visibleMonth.getFullYear() === minDate.getFullYear() && visibleMonth.getMonth() === minDate.getMonth();

  const handleDayClick = (dateObj: Date) => {
    if (minDate && isBeforeDay(dateObj, minDate)) return;
    if (!selectedStart || (selectedStart && selectedEnd)) {
      onChange(dateObj, null);
    } else if (selectedStart && !selectedEnd) {
      // If clicking the exact same date as the current start, ignore (no-op)
      if (isSameDay(dateObj, selectedStart)) {
        return;
      }
      if (!isBeforeDay(dateObj, selectedStart)) {
        onChange(selectedStart, dateObj);
      } else {
        // restart if clicked before start
        onChange(dateObj, null);
      }
    }
  };

  const changeMonth = (delta: number) => {
    onMonthChange(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + delta, 1));
  };

  const changeYear = (delta: number) => {
    onMonthChange(new Date(visibleMonth.getFullYear() + delta, visibleMonth.getMonth(), 1));
  };

  // Grid cells
  const firstDay = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1).getDay();
  const daysInMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 0).getDate();
  const cells: React.ReactNode[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(<div key={`blank-${i}`} />);
  for (let day = 1; day <= daysInMonth; day++) {
    const dateObj = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), day);
    const disabled = !!minDate && isBeforeDay(dateObj, minDate);
    const isStart = !!selectedStart && isSameDay(dateObj, selectedStart);
    const isEnd = !!selectedEnd && isSameDay(dateObj, selectedEnd);
    const inRange = !!selectedStart && !!selectedEnd && !isStart && !isEnd && !isBeforeDay(dateObj, selectedStart) && !isAfterDay(dateObj, selectedEnd);
    const base = `flex items-center justify-center rounded cursor-pointer select-none ${cellBase}`;
    const colorDisabled = "text-gray-300 cursor-not-allowed";
    const colorNormal = "text-[hsl(258_46%_25%)] hover:bg-purple-50";
    const colorSelected = "bg-purple-600 text-white hover:bg-purple-700";
    const colorInRange = "bg-purple-100 text-purple-800";
    cells.push(
      <button
        key={`d-${day}`}
        disabled={disabled}
        onClick={() => handleDayClick(dateObj)}
        className={[base, disabled ? colorDisabled : (isStart || isEnd) ? colorSelected : inRange ? colorInRange : colorNormal].join(" ")}
      >
        {day}
      </button>
    );
  }

  return (
    <div className={["bg-white border border-gray-200 rounded-md p-3 w-[280px]", className ?? ""].join(" ")}> 
      {/* Header with grid navigation and view toggle */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1">
          {view !== "date" && (
            <button
              className="p-1 rounded hover:bg-gray-100"
              onClick={() => setView((v) => (v === "year" ? "month" : "date"))}
              aria-label="Back"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back</span>
            </button>
          )}
          <button
            className="px-2 py-1 rounded hover:bg-gray-100 text-sm font-medium text-[hsl(258_46%_25%)]"
            onClick={() => setView((v) => (v === "date" ? "month" : v === "month" ? "year" : "date"))}
            aria-label="Change view"
          >
            {view === "date" && (
              <span>{monthNames[visibleMonth.getMonth()]} {visibleMonth.getFullYear()}</span>
            )}
            {view === "month" && (
              <span>{visibleMonth.getFullYear()}</span>
            )}
            {view === "year" && (
              <span>{yearPageStart} – {yearPageStart + 11}</span>
            )}
          </button>
        </div>
        <div className="flex items-center gap-1">
          <button
            className="p-1 rounded hover:bg-gray-100 disabled:opacity-50"
            onClick={() => {
              if (view === "date") changeMonth(-1);
              else if (view === "month") changeYear(-1);
              else if (view === "year") setYearPageStart((s) => s - 12);
            }}
            disabled={view === "date" && disablePrevMonth}
            aria-label="Previous"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            className="p-1 rounded hover:bg-gray-100"
            onClick={() => {
              if (view === "date") changeMonth(1);
              else if (view === "month") changeYear(1);
              else if (view === "year") setYearPageStart((s) => s + 12);
            }}
            aria-label="Next"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Weekdays (date view only) */}
      {view === "date" && (
        <div className={`grid grid-cols-7 gap-1 ${subText} mb-1`}>
          {weekdays.map((d) => (
            <div className="text-center" key={d}>{d}</div>
          ))}
        </div>
      )}

  {/* Grids with basic transitions */}
      <div className="transition-all duration-150 ease-out">
        {view === "date" && (
          <div className="grid grid-cols-7 gap-1">
            {cells}
          </div>
        )}
        {view === "month" && (
          <div className="grid grid-cols-3 gap-2">
            {monthNames.map((m, idx) => {
              const y = visibleMonth.getFullYear();
              const candidate = new Date(y, idx, 1);
              const isDisabled = !!minDate && (y < minDate.getFullYear() || (y === minDate.getFullYear() && idx < minDate.getMonth()));
              return (
                <button
                  key={m}
                  disabled={isDisabled}
                  onClick={() => {
                    onMonthChange(new Date(y, idx, 1));
                    setView("date");
                  }}
                  className={[
                    "px-2 py-2 rounded border text-sm",
                    isDisabled ? "text-gray-300 border-gray-200 cursor-not-allowed" : "text-[hsl(258_46%_25%)] border-gray-200 hover:bg-purple-50"
                  ].join(" ")}
                >
                  {m.slice(0, 3)}
                </button>
              );
            })}
          </div>
        )}
        {view === "year" && (
          <div className="max-h-[180px] overflow-y-auto pr-1">
            <div className="grid grid-cols-3 gap-2">
              {Array.from({ length: 12 }, (_, i) => yearPageStart + i).map((y) => {
                const isDisabled = !!minDate && y < minDate.getFullYear();
                return (
                  <button
                    key={y}
                    disabled={isDisabled}
                    onClick={() => {
                      onMonthChange(new Date(y, visibleMonth.getMonth(), 1));
                      setView("month");
                    }}
                    className={[
                      "px-2 py-2 rounded border text-sm",
                      isDisabled ? "text-gray-300 border-gray-200 cursor-not-allowed" : "text-[hsl(258_46%_25%)] border-gray-200 hover:bg-purple-50"
                    ].join(" ")}
                  >
                    {y}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

  {/* Footer quick selects */}
      <div className="flex items-center justify-between mt-3 pt-2 border-t">
        <div className="text-xs text-[hsl(258_22%_50%)] flex-1 pr-2 leading-snug whitespace-normal break-words" title={formatFullLabel(selectedStart, selectedEnd)}>
          {formatFullLabel(selectedStart, selectedEnd)}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const today = minDate ? new Date(minDate) : startOfDay(new Date());
              onChange(today, null);
              onMonthChange(new Date(today.getFullYear(), today.getMonth(), 1));
              setView("date");
            }}
            className="text-[hsl(258_46%_25%)] hover:bg-purple-50 px-2 py-1 text-xs"
          >
            Today
          </Button>
        </div>
      </div>
    </div>
  );
}

export default CalendarRange;
