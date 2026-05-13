"use client";

import { startOfDay, subDays, isSameDay, format } from "date-fns";

interface FeedingCalendarProps {
  feedings: { fed_at: string; flour_grams: number | null; water_grams: number | null }[];
}

export function FeedingCalendar({ feedings }: FeedingCalendarProps) {
  const today = startOfDay(new Date());
  const days = Array.from({ length: 7 }, (_, i) => subDays(today, 6 - i));

  return (
    <div style={{ display: "flex", gap: 6, width: "100%" }}>
      {days.map((day) => {
        const dayFeedings = feedings.filter((f) =>
          isSameDay(startOfDay(new Date(f.fed_at)), day)
        );
        const isToday = isSameDay(day, today);
        const hasFed = dayFeedings.length > 0;
        const dotCount = Math.min(dayFeedings.length, 3);

        return (
          <div
            key={day.toISOString()}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
            }}
          >
            {/* Day label */}
            <span
              style={{
                fontSize: 10,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                color: "var(--ink-faint)",
              }}
            >
              {format(day, "EEE")}
            </span>

            {/* Date number */}
            <span
              style={{
                fontSize: 13,
                color: "var(--ink-soft)",
              }}
            >
              {format(day, "d")}
            </span>

            {/* Cell */}
            <div
              style={{
                width: "100%",
                aspectRatio: "1",
                borderRadius: 8,
                border: isToday
                  ? "1px solid var(--border-strong)"
                  : "1px solid var(--border)",
                background: hasFed ? "var(--surface)" : "transparent",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 3,
              }}
            >
              {Array.from({ length: dotCount }, (_, i) => (
                <div
                  key={i}
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "var(--crust)",
                  }}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
