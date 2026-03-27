import React, { useMemo } from "react";
import { View, Text, ScrollView, useColorScheme } from "react-native";

type StageItem = {
  start?: string;
  end?: string;
  revisionNumber?: number;
};

type Props = {
  stages: StageItem[];
  stage: string;
};

const BAR_HEIGHT = 16;
const MONTH_WIDTH = 120;
const DAYS_IN_MONTH = 30;
const DAY_WIDTH = MONTH_WIDTH / DAYS_IN_MONTH;

const GanttChart: React.FC<Props> = ({ stages, stage }) => {
  const isDarkMode = useColorScheme() === "dark";

  const validStages = useMemo(
    () => (stages || []).filter((s) => s.start && s.end),
    [stages]
  );

  const { displayMinDate, months } = useMemo(() => {
    if (!validStages.length) {
      return { displayMinDate: new Date(), months: [] };
    }

    const minDate = new Date(
      Math.min(...validStages.map((s) => new Date(s.start!).getTime()))
    );
    const maxDate = new Date(
      Math.max(...validStages.map((s) => new Date(s.end!).getTime()))
    );

    const dMin = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
    const dMax = new Date(maxDate.getFullYear(), maxDate.getMonth() + 2, 0);

    const mList: Date[] = [];
    let cursor = new Date(dMin);
    while (cursor <= dMax) {
      mList.push(new Date(cursor));
      cursor.setMonth(cursor.getMonth() + 1);
    }

    return { displayMinDate: dMin, months: mList };
  }, [validStages]);

  const daysBetween = (start: Date, end: Date) =>
    Math.max(
      Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)),
      0
    );

  const formatDate = (date: Date) => {
    const d = date.getDate();
    const m = date.toLocaleDateString("en-GB", { month: "short" });
    const y = date.getFullYear();
    return `${d} ${m}, ${y}`;
  };

  const computedStages = useMemo(
    () =>
      stages.map((item) => {
        if (!item.start || !item.end) return null;
        const start = new Date(item.start);
        const end = new Date(item.end);
        const width = Math.max(daysBetween(start, end) * DAY_WIDTH, 60);

        return {
          ...item,
          start,
          end,
          offset: daysBetween(displayMinDate, start) * DAY_WIDTH,
          width,
        };
      }),
    [stages, displayMinDate]
  );

  const today = new Date();
  const todayOffset = useMemo(() => {
    return daysBetween(displayMinDate, today) * DAY_WIDTH;
  }, [displayMinDate]);

  if (!stages?.length || !validStages.length) return null;

  return (
    <View className="p-4 pt-4">
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ position: "relative" }} className="mt-2">
          {/* Today Line Indicator */}
          <View
            style={{
              position: "absolute",
              left: 45 + todayOffset + 5, // 45 for Y-axis, 5 for visual padding
              top: 0,
              bottom: 50,
              alignItems: "center",
              zIndex: 10,
            }}
          >
            {/* Kite/Diamond at top */}
            <View
              style={{
                width: 10,
                height: 10,
                backgroundColor: "#EF4444",
                transform: [{ rotate: "45deg" }],
                marginTop: -2,
              }}
            />
            {/* Red Line */}
            <View
              style={{
                width: 1.5,
                flex: 1,
                backgroundColor: "#EF4444",
              }}
            />
          </View>

          {/* Rows */}
          {computedStages.map((item, index) => {
            if (!item) return null;
            const showInside = item.width > 120;
            return (
              <View
                key={index}
                className="flex-row items-center mb-1"
                style={{ height: 44 }}
              >
                {/* Y-axis Label */}
                <View style={{ width: 45 }}>
                  <Text
                    className={`text-[14px] font-dmSemiBold ${
                      isDarkMode ? "text-white" : "text-black"
                    }`}
                  >
                    R{item.revisionNumber ?? 0}
                  </Text>
                </View>

                {/* Track Background */}
                <View
                  className={`flex-row items-center rounded-[8px] h-[36px] ${
                    isDarkMode ? "bg-[#151515]" : "bg-[#F0F3F7]"
                  }`}
                  style={{ width: months.length * MONTH_WIDTH }}
                >
                  {/* Bar */}
                  <View
                    className="bg-[#5B4CCC] h-[34px] rounded-[8px] justify-center px-2"
                    style={{
                      marginLeft: item.offset + 5, // small buffer for visual padding within track
                      width: item.width,
                    }}
                  >
                    {showInside && (
                      <Text
                        numberOfLines={1}
                        className="text-white text-[11px] font-poppinsMedium text-center"
                      >
                        {formatDate(item.start)} | {formatDate(item.end)}
                      </Text>
                    )}
                  </View>

                  {!showInside && (
                    <Text
                      className={`ml-3 text-[11px] font-poppins ${
                        isDarkMode ? "text-white" : "text-black"
                      }`}
                    >
                      {formatDate(item.start)} | {formatDate(item.end)}
                    </Text>
                  )}
                </View>
              </View>
            );
          })}

          {/* X-axis Labels */}
          <View className="flex-row mt-4 justify-between px-10">
            <View style={{ width: 45 }} />
            {months.map((month, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && (
                  <Text
                    className={`mx-8 text-[12px] ${
                      isDarkMode ? "text-[#919191]" : "text-[#454545]"
                    }`}
                  >
                    |
                  </Text>
                )}
                <Text
                  className={`text-[12px] font-poppinsMedium ${
                    isDarkMode ? "text-[#919191]" : "text-[#454545]"
                  }`}
                >
                  {month.toLocaleDateString("en-GB", {
                    month: "short",
                    year: "numeric",
                  })}
                </Text>
              </React.Fragment>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default GanttChart;
