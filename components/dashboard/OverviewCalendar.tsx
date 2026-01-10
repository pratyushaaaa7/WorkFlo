import {
  ArrowDown01Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { addMonths, format, parseISO, subMonths } from "date-fns";
import React, { useState } from "react";
import {
  Modal,
  Pressable,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Calendar } from "react-native-calendars";

const OverviewCalendar = () => {
  const [selectedDate, setSelectedDate] = useState(
    format(new Date(), "yyyy-MM-dd")
  );
  const [currentMonth, setCurrentMonth] = useState(
    format(new Date(), "yyyy-MM-dd")
  );
  const [isMonthPickerVisible, setIsMonthPickerVisible] = useState(false);

  const visibleMonthDate = parseISO(currentMonth);

  /** Task counts */
  const taskCounts: Record<string, number> = {
    "2026-01-29": 2,
    "2026-01-30": 7,
    "2026-01-03": 4,
    "2026-01-05": 5,
    "2026-01-08": 9,
    "2026-01-13": 3,
    "2026-01-15": 1,
    "2026-01-17": 8,
    "2026-01-21": 1,
    "2026-01-23": 6,
    "2026-01-28": 10,
  };

  /** 🔹 Custom Day Card */
  const DayCard = ({ date, state }: any) => {
    const isSelected = date.dateString === selectedDate;
    const isDisabled = state === "disabled";
    const taskCount = taskCounts[date.dateString];

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => !isDisabled && setSelectedDate(date.dateString)}
        style={{
          flex: 1,
          aspectRatio: 1,
          margin: 4,
          borderRadius: 12,
          backgroundColor: isSelected ? "#3b82f6" : "#1a1a1a",
          opacity: isDisabled ? 0.35 : 1,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Text
          style={{
            color: "white",
            fontSize: 16,
            fontFamily: "Poppins-Medium",
          }}
        >
          {date.day}
        </Text>

        {taskCount && !isDisabled && (
          <Text
            style={{
              marginTop: 2,
              fontSize: 10,
              color: "#cbd5f5",
              fontFamily: "Poppins-Regular",
            }}
          >
            {taskCount} Tasks
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View className=" bg-[#0D0D0D] pt-4 pb-6">
      {/* Header */}
      <View className="flex-row items-center justify-between mb-6">
        <View className="flex-row items-center">
          <Text className="text-2xl font-poppinsBold text-white mr-3">
            Calendar
          </Text>

          <TouchableOpacity
            onPress={() => setIsMonthPickerVisible(true)}
            className="flex-row items-center bg-[#151515] px-2 py-1 rounded-lg"
          >
            <Text className="text-gray-400 font-poppinsMedium mr-1">
              {format(visibleMonthDate, "MMM")}
            </Text>
            <HugeiconsIcon icon={ArrowDown01Icon} size={14} color="#919191" />
          </TouchableOpacity>

          <View className="flex-row ml-4 gap-2">
            <TouchableOpacity
              onPress={() =>
                setCurrentMonth(
                  format(subMonths(visibleMonthDate, 1), "yyyy-MM-dd")
                )
              }
              className="bg-[#151515] p-1.5 rounded-full"
            >
              <HugeiconsIcon icon={ArrowLeft01Icon} size={14} color="#919191" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() =>
                setCurrentMonth(
                  format(addMonths(visibleMonthDate, 1), "yyyy-MM-dd")
                )
              }
              className="bg-[#151515] p-1.5 rounded-full"
            >
              <HugeiconsIcon icon={ArrowRight01Icon} size={14} color="#919191" />
            </TouchableOpacity>
          </View>
        </View>

        <Text className="text-[#3b82f6] text-sm font-poppinsMedium">
          View all
        </Text>
      </View>

      {/* Calendar */}
      <Calendar
        current={currentMonth}
        onMonthChange={(m) => setCurrentMonth(m.dateString)}
        enableSwipeMonths
        hideArrows
        firstDay={1}
        dayComponent={DayCard}
        theme={{
          calendarBackground: "transparent",
          textSectionTitleColor: "#e5e7eb",
          textDayHeaderFontFamily: "Poppins-Medium",
          textDayHeaderFontSize: 12,
          textDisabledColor: "#444",
          monthTextColor: "#fff",
        }}
        style={{ backgroundColor: "transparent" }}
      />

      {/* Month Picker Modal (unchanged logic) */}
      <Modal visible={isMonthPickerVisible} transparent animationType="fade">
        <Pressable
          className="flex-1 bg-black/80 items-center justify-center p-6"
          onPress={() => setIsMonthPickerVisible(false)}
        >
          <View className="bg-[#151515] w-full rounded-3xl p-6 border border-[#252525]">
            <Text className="text-white text-xl font-poppinsBold mb-6 text-center">
              Select Month
            </Text>

            <View className="flex-row flex-wrap justify-between gap-y-4">
              {["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].map(
                (month, index) => {
                  const isCurrent = visibleMonthDate.getMonth() === index;
                  return (
                    <TouchableOpacity
                      key={month}
                      onPress={() => {
                        const d = new Date(visibleMonthDate);
                        d.setMonth(index);
                        setCurrentMonth(format(d, "yyyy-MM-dd"));
                        setIsMonthPickerVisible(false);
                      }}
                      className={`w-[30%] aspect-square rounded-2xl items-center justify-center ${
                        isCurrent ? "bg-[#3b82f6]" : "bg-[#252525]"
                      }`}
                    >
                      <Text
                        className={`font-poppinsBold ${
                          isCurrent ? "text-white" : "text-gray-400"
                        }`}
                      >
                        {month}
                      </Text>
                    </TouchableOpacity>
                  );
                }
              )}
            </View>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

export default OverviewCalendar;
