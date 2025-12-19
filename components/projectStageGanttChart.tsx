import React, { useMemo } from "react";
import { View, Text, ScrollView } from "react-native";

type StageItem = {
  start?: string;
  end?: string;
  revisionNumber?: number;
   daysDifference?: number; // ✅ new field
};

type Props = {
  stages: StageItem[];
  stage: string;
};

const BAR_HEIGHT = 24;

// 📉 Timeline scale
const MONTH_WIDTH = 90; // 1/4th month width
const DAYS_IN_MONTH = 30;
const DAY_WIDTH = MONTH_WIDTH / DAYS_IN_MONTH;

const MIN_TEXT_WIDTH = 90;

// 🎨 Single bar color
const BAR_COLOR = "#4F46E5";

const daysBetween = (start: Date, end: Date) =>
  Math.max(
    Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)),
    1
  );

const formatDate = (date: Date) => {
  const d = date.getDate().toString().padStart(2, "0");
  const m = (date.getMonth() + 1).toString().padStart(2, "0");
  const y = date.getFullYear();
  return `${d}-${m}-${y}`;
};

// Month helpers
const startOfMonth = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), 1);

const addMonths = (date: Date, count: number) =>
  new Date(date.getFullYear(), date.getMonth() + count, 1);

const formatMonth = (date: Date) =>
  date.toLocaleString("en-IN", { month: "short", year: "numeric" });

const GanttChart: React.FC<Props> = ({ stages, stage }) => {
  if (!stages?.length) return null;

  const validStages = stages.filter((s) => s.start && s.end);
  if (!validStages.length) return null;

  const minDate = new Date(
    Math.min(...validStages.map((s) => new Date(s.start!).getTime()))
  );
  const maxDate = new Date(
    Math.max(...validStages.map((s) => new Date(s.end!).getTime()))
  );

  // Months
  const months: Date[] = [];
  let cursor = startOfMonth(minDate);
  while (cursor <= maxDate) {
    months.push(new Date(cursor));
    cursor = addMonths(cursor, 1);
  }

  const totalDays = daysBetween(minDate, maxDate);

  // Today indicator
  const today = new Date();
  const todayOffset =
    today >= minDate && today <= maxDate
      ? daysBetween(minDate, today) * DAY_WIDTH
      : null;

  // Pre-calc bars
  const computedStages = useMemo(
    () =>
      validStages.map((item) => {
        const start = new Date(item.start!);
        const end = new Date(item.end!);

        return {
          ...item,
          start,
          end,
          offset: daysBetween(minDate, start) * DAY_WIDTH,
          width: daysBetween(start, end) * DAY_WIDTH,
        };
      }),
    [validStages]
  );

  return (
    <View className="bg-white mx-4 my-4 p-4 rounded-2xl shadow-md">
      <Text className="font-semibold text-gray-800 mb-3">
        {stage} - Timeline
      </Text>

      <ScrollView horizontal showsHorizontalScrollIndicator>
        <View>
          {/* Weekly grid lines */}
          {Array.from({ length: Math.ceil(totalDays / 7) }).map((_, i) => (
            <View
              key={i}
              style={{
                position: "absolute",
                left: 50 + i * 7 * DAY_WIDTH,
                top: 0,
                bottom: 40,
                width: 1,
                backgroundColor: "#E5E7EB",
              }}
            />
          ))}

          {/* Today line */}
          {todayOffset !== null && (
            <View
              style={{
                position: "absolute",
                left: 50 + todayOffset,
                top: 0,
                bottom: 40,
                width: 2,
                backgroundColor: "#EF4444",
              }}
            />
          )}

          {/* Bars */}
          {computedStages.map((item, index) => {
            const showInsideText = item.width >= MIN_TEXT_WIDTH;

            return (
              <View
                key={index}
                className="flex-row items-center"
                style={{ height: BAR_HEIGHT + 14, marginTop: 8 }}
              >
                {/* Y-axis */}
                <View style={{ width: 50, alignItems: "center" }}>
                  <Text className="text-sm text-gray-700">
                    R{item.revisionNumber ?? 0}
                  </Text>
                </View>

                {/* Bar */}
                <View style={{ marginLeft: item.offset }}>
                  {!showInsideText && (
                    <Text className="text-[10px] text-gray-600 mb-1">
                      {formatDate(item.start)} - {formatDate(item.end)}
                    </Text>
                  )}

                  <View
                    style={{
                      width: item.width,
                      height: BAR_HEIGHT,
                      backgroundColor: BAR_COLOR,
                      borderRadius: 6,
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    {showInsideText && (
                      <Text
                        numberOfLines={1}
                        ellipsizeMode="tail"
                        className="text-white text-[10px]"
                      >
                        {formatDate(item.start)} - {formatDate(item.end)}
                      </Text>
                    )}

                    
                  </View>
                </View>
              </View>
            );
          })}

          {/* X-axis Months */}
          <View className="flex-row mt-4">
            <View style={{ width: 50 }} />
            {months.map((month, idx) => (
              <View
                key={idx}
                style={{
                  width: MONTH_WIDTH,
                  alignItems: "center",
                  borderRightWidth: 1,
                  borderColor: "#E5E7EB",
                  paddingVertical: 6,
                }}
              >
                <Text className="text-xs text-gray-600 font-medium">
                  {formatMonth(month)}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default GanttChart;
