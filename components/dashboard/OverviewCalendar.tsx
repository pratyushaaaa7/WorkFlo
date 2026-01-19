import { ArrowDown01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { format, parseISO } from "date-fns";
import React, { useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import { Calendar } from "react-native-calendars";
import Animated, { FadeInDown } from "react-native-reanimated";

const OverviewCalendar = ({
  setActiveTab,
  responsibleItems = [],
}: {
  setActiveTab: (tab: string) => void;
  responsibleItems?: any[];
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [selectedDate, setSelectedDate] = useState(
    format(new Date(), "yyyy-MM-dd")
  );
  const [currentMonth, setCurrentMonth] = useState(
    format(new Date(), "yyyy-MM-dd")
  );
  const [isMonthPickerVisible, setIsMonthPickerVisible] = useState(false);

  const visibleMonthDate = parseISO(currentMonth);

  const taskCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    responsibleItems.forEach((item) => {
      if (item.targetDate) {
        try {
          // Format the targetDate to yyyy-MM-dd to match calendar keys
          const dateKey = format(new Date(item.targetDate), "yyyy-MM-dd");
          counts[dateKey] = (counts[dateKey] || 0) + 1;
        } catch (e) {
          console.warn("Invalid task date found:", item.targetDate);
        }
      }
    });
    return counts;
  }, [responsibleItems]);

  /** 🔹 Custom Day Card */
  const DayCard = ({ date, state }: any) => {
    const isSelected = date.dateString === selectedDate;
    const isDisabled = state === "disabled";
    // Look up count using the full date string (yyyy-MM-dd)
    const taskCount = taskCounts[date.dateString];

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => !isDisabled && setSelectedDate(date.dateString)}
        style={{
          aspectRatio: 1,
          opacity: isDisabled ? 0.35 : 1,
          borderColor: isSelected
            ? "transparent"
            : isDark
            ? "#2B2B2B"
            : "#E5E7EB",
          backgroundColor: isSelected
            ? "#566FEC"
            : isDark
            ? "#1A1A1A"
            : "#F3F4F6",
          // margin: 1.5,
        }}
        className="flex-1 rounded-lg border p-1 justify-between items-center"
      >
        <Text
          className={`font-DM text-[13px] mb-2 text-center ${
            isSelected
              ? "font-bold text-white"
              : isDark
              ? "font-medium text-white"
              : "font-medium text-[#111827]"
          }`}
        >
          {date.day}
        </Text>

        {taskCount && !isDisabled ? (
          <Text
            numberOfLines={1}
            className={`text-[8px] font-poppins text-center  ${
              isSelected
                ? "text-white"
                : isDark
                ? "text-[#919191]"
                : "text-[#6B7280]"
            }`}
          >
            {taskCount} {taskCount === 1 ? "Task" : "Tasks"}
          </Text>
        ) : (
          <View className="h-[10px]" />
        )}
      </TouchableOpacity>
    );
  };

  /** 🔹 Custom Day Header */
  const renderDayHeader = (day: string, index: number) => {
    return (
      <View
        key={`${day}-${index}`}
        style={{
          backgroundColor: isDark ? "#151515" : "#F3F4F6",
          borderColor: isDark ? "#252525" : "#E5E7EB",
        }}
        className="px-3 py-1.5 rounded-lg border min-w-[45px] items-center"
      >
        <Text
          style={{ color: isDark ? "#919191" : "#6B7280" }}
          className="text-xs font-poppinsMedium"
        >
          {day}
        </Text>
      </View>
    );
  };

  return (
    <View
      style={{ backgroundColor: isDark ? "#0D0D0D" : "#F8F9FA" }}
      className="pt-4 pb-6"
    >
      {/* Header */}
      <View className="flex-row items-center justify-between mb-6">
        <View className="flex-row items-center">
          <Text
            className={`text-lg font-dmBold text-gray-900 dark:text-white mr-4 ${
              isDark ? "text-white" : "text-[#111827]"
            }`}
          >
            Calendar
          </Text>

          <TouchableOpacity
            onPress={() => setIsMonthPickerVisible(true)}
            className="flex-row items-center"
          >
            <Text
              className={`text-lg font-poppinsMedium mr-1 ${
                isDark ? "text-gray-400" : "text-[#6B7280]"
              }`}
            >
              {format(visibleMonthDate, "MMM")}
            </Text>
            <HugeiconsIcon
              icon={ArrowDown01Icon}
              size={18}
              color={isDark ? "#919191" : "#6B7280"}
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => setActiveTab("Calendar")}>
          <Text className="text-[#0073CB] text-sm font-poppinsMedium">
            View all
          </Text>
        </TouchableOpacity>
      </View>

      {/* Custom Day Headers */}
      <View className="flex-row justify-around mb-3">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, index) =>
          renderDayHeader(day, index)
        )}
      </View>

      {/* Calendar */}
      <Animated.View
        key={currentMonth}
        entering={FadeInDown.duration(600).springify()}
        className="flex-1"
      >
        <Calendar
          current={currentMonth}
          onMonthChange={(m) => setCurrentMonth(m.dateString)}
          enableSwipeMonths
          hideArrows
          firstDay={1}
          dayComponent={DayCard}
          renderHeader={() => null}
          hideDayNames
          theme={{
            calendarBackground: "transparent",
            textDisabledColor: isDark ? "#444" : "#D1D5DB",
            monthTextColor: isDark ? "#fff" : "#111827",
            // @ts-ignore
            "stylesheet.calendar.header": {
              header: {
                height: 0,
                opacity: 0,
              },
            },
            // @ts-ignore
            "stylesheet.calendar.main": {
              week: {
                marginTop: 0.5,
                marginBottom: 0.5,
                flexDirection: "row",
                justifyContent: "space-around",
              },
            },
          }}
          style={{ backgroundColor: "transparent" }}
        />
      </Animated.View>

      {/* Month Picker Modal */}
      <Modal visible={isMonthPickerVisible} transparent animationType="fade">
        <Pressable
          onPress={() => setIsMonthPickerVisible(false)}
          className="flex-1 bg-black/60 items-center justify-center p-6"
        >
          <View
            className={`w-full rounded-3xl p-6 border ${
              isDark
                ? "bg-[#151515] border-[#252525]"
                : "bg-white border-[#E5E7EB]"
            }`}
          >
            <Text
              className={`text-xl font-poppinsBold mb-6 text-center ${
                isDark ? "text-white" : "text-[#111827]"
              }`}
            >
              Select Month
            </Text>

            <View className="flex-row flex-wrap justify-between gap-y-4">
              {[
                "Jan",
                "Feb",
                "Mar",
                "Apr",
                "May",
                "Jun",
                "Jul",
                "Aug",
                "Sep",
                "Oct",
                "Nov",
                "Dec",
              ].map((month, index) => {
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
                      isCurrent
                        ? "bg-[#566FEC]"
                        : isDark
                        ? "bg-[#252525]"
                        : "bg-[#F3F4F6]"
                    }`}
                  >
                    <Text
                      className={`font-poppinsBold ${
                        isCurrent
                          ? "text-white"
                          : isDark
                          ? "text-gray-400"
                          : "text-[#6B7280]"
                      }`}
                    >
                      {month}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

export default OverviewCalendar;
