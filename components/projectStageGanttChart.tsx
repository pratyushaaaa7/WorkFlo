import React from "react";
import { View, Text, ScrollView } from "react-native";

type StageItem = {
  start?: string;
  end?: string;
  revisionNumber?: number;
};

type Props = {
  stages: StageItem[];
  stage: string;
};

const DAY_WIDTH = 30; // width per day in pixels
const BAR_HEIGHT = 24;

const daysBetween = (start: Date, end: Date) =>
  Math.max(
    Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)),
    1
  );

// Format date to dd-mm-yyyy
const formatDate = (date: Date) => {
  const d = date.getDate().toString().padStart(2, "0");
  const m = (date.getMonth() + 1).toString().padStart(2, "0");
  const y = date.getFullYear();
  return `${d}-${m}-${y}`;
};

const GanttChart: React.FC<Props> = ({ stages, stage }) => {
  if (stages.length === 0) return null;

  // Filter only stages with valid dates
  const validStages = stages.filter((s) => s.start && s.end);
  if (!validStages.length) return null;

  // Find overall min/max dates for X-axis
  const minDate = new Date(
    Math.min(...validStages.map((s) => new Date(s.start!).getTime()))
  );
  const maxDate = new Date(
    Math.max(...validStages.map((s) => new Date(s.end!).getTime()))
  );

  const totalDays = daysBetween(minDate, maxDate);

  // Generate X-axis labels (dates)
  const xLabels = Array.from({ length: totalDays }, (_, i) => {
    const date = new Date(minDate);
    date.setDate(date.getDate() + i);
    return formatDate(date);
  });

  return (
    <View className="bg-white mx-4 my-4 p-4 rounded-2xl shadow-md">
      {/* Fixed title - removed duplicate Text wrapper */}
      <Text className="font-semibold text-gray-800 mb-3">
        {stage ?? ""} {"-"} Timeline
      </Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={true}>
        <View>
          {/* Revisions */}
          {validStages.map((item, index) => {
            const start = new Date(item.start!);
            const end = new Date(item.end!);

            const offset = daysBetween(minDate, start) * DAY_WIDTH;
            const width = daysBetween(start, end) * DAY_WIDTH;

            return (
              <View
                key={index}
                className="flex-row items-center"
                style={{ height: BAR_HEIGHT, marginTop: 8 }}
              >
                {/* Y-axis: Revision label */}
                <View style={{ width: 50, alignItems: "center" }}>
                  <Text className="text-sm text-gray-700">
                    R{item.revisionNumber ?? 0}
                  </Text>
                </View>

                {/* Bar container */}
                <View
                  style={{
                    flexDirection: "row",
                    position: "relative",
                    height: BAR_HEIGHT,
                  }}
                >
                  {/* Empty offset */}
                  {offset > 0 && <View style={{ width: offset }} />}
                  {/* Actual duration bar */}
                  <View
                    style={{
                      width,
                      height: BAR_HEIGHT,
                      backgroundColor: "#4F46E5",
                      borderRadius: 6,
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Text className="text-white text-xs">
                      {formatDate(start)} - {formatDate(end)}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}

          {/* X-axis labels below the chart */}
          <View className="flex-row mt-2">
            <View style={{ width: 50 }} />
            {xLabels?.map((label, idx) => (
              <View
                key={idx}
                style={{
                  width: DAY_WIDTH,
                  alignItems: "center",
                  borderRightWidth: 0.5,
                  borderColor: "#ccc",
                  paddingTop: 4,
                }}
              >
                <Text style={{ fontSize: 10, color: "#6B7280" }}>{label}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default GanttChart;
