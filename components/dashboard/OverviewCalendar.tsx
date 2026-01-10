import {
  ArrowDown01Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { addMonths, format, parseISO, setMonth, subMonths } from "date-fns";
import React, { useState } from "react";
import {
  Modal,
  Pressable,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { Calendar } from "react-native-calendars";

const OverviewCalendar = () => {
  const isDarkMode = useColorScheme() === "dark";
  const [selectedDate, setSelectedDate] = useState(
    format(new Date(), "yyyy-MM-dd")
  );
  const [currentVisibleMonth, setCurrentVisibleMonth] = useState(
    format(new Date(), "yyyy-MM-dd")
  );
  const [isMonthPickerVisible, setIsMonthPickerVisible] = useState(false);
  const visibleMonthDate = parseISO(currentVisibleMonth);

  // Mock task counts based on the image (and some extra for variety)
  const taskCounts: { [key: string]: number } = {
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
    // Add today or selected day tasks to ensure visibility
    [selectedDate]: 5,
  };

  const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const renderDay = ({ date, state }: any) => {
    const isSelected = date.dateString === selectedDate;
    const isCurrentMonth = state !== "disabled";
    const taskCount = taskCounts[date.dateString];

    return (
      <TouchableOpacity
        onPress={() => setSelectedDate(date.dateString)}
        activeOpacity={0.7}
        className={`flex-1 aspect-square mx-0.5 mb-1 rounded-xl items-center justify-center ${
          isCurrentMonth ? "bg-[#151515]" : "bg-transparent opacity-30"
        }`}
        style={isSelected ? { borderWidth: 0 } : {}}
      >
        <Text
          className={`text-lg font-poppinsMedium ${
            isSelected ? "text-white" : "text-white"
          }`}
          style={{ includeFontPadding: false }}
        >
          {date.day}
        </Text>

        {taskCount !== undefined && isCurrentMonth && (
          <Text className="text-[7px] text-gray-400 font-poppinsRegular mt-0.5">
            {taskCount} Tasks
          </Text>
        )}

        {isSelected && isCurrentMonth && (
          <View className="absolute bottom-1.5 w-4 h-[2px] bg-white rounded-full" />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View className="mb-10 px-4 bg-black pt-4 pb-2">
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

          <View className="flex-row items-center ml-4 gap-2">
            <TouchableOpacity
              onPress={() =>
                setCurrentVisibleMonth(
                  format(subMonths(visibleMonthDate, 1), "yyyy-MM-dd")
                )
              }
              className="bg-[#151515] p-1.5 rounded-full"
            >
              <HugeiconsIcon icon={ArrowLeft01Icon} size={14} color="#919191" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() =>
                setCurrentVisibleMonth(
                  format(addMonths(visibleMonthDate, 1), "yyyy-MM-dd")
                )
              }
              className="bg-[#151515] p-1.5 rounded-full"
            >
              <HugeiconsIcon
                icon={ArrowRight01Icon}
                size={14}
                color="#919191"
              />
            </TouchableOpacity>
          </View>
        </View>
        <TouchableOpacity>
          <Text className="text-[#3b82f6] text-sm font-poppinsMedium">
            View all
          </Text>
        </TouchableOpacity>
      </View>

      {/* Month Picker Modal */}
      <Modal
        visible={isMonthPickerVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsMonthPickerVisible(false)}
      >
        <Pressable
          className="flex-1 bg-black/80 items-center justify-center p-6"
          onPress={() => setIsMonthPickerVisible(false)}
        >
          <View className="bg-[#151515] w-full rounded-3xl p-6 border border-[#252525]">
            <Text className="text-white text-xl font-poppinsBold mb-6 text-center">
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
                      const newDate = setMonth(visibleMonthDate, index);
                      setCurrentVisibleMonth(format(newDate, "yyyy-MM-dd"));
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
              })}
            </View>
            <TouchableOpacity
              onPress={() => setIsMonthPickerVisible(false)}
              className="mt-8 bg-[#252525] py-4 rounded-2xl items-center"
            >
              <Text className="text-white font-poppinsBold">Cancel</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* Custom Weekday Header Cards */}
      <View className="flex-row justify-between mb-3">
        {weekdays.map((day) => (
          <View
            key={day}
            className="flex-1 aspect-[1.3/1] mx-0.5 bg-[#151515] rounded-lg items-center justify-center"
          >
            <Text className="text-xs text-gray-200 font-poppinsMedium">
              {day}
            </Text>
          </View>
        ))}
      </View>

      {/* Calendar Library Component */}
      <Calendar
        current={currentVisibleMonth}
        onDayPress={(day: any) => setSelectedDate(day.dateString)}
        onMonthChange={(month: any) => setCurrentVisibleMonth(month.dateString)}
        dayComponent={renderDay}
        renderHeader={() => null} // Custom header used instead
        hideArrows={true} // Swiping only
        hideDayNames={true} // ⬅️ Correct way to hide weekday headers
        enableSwipeMonths={true}
        firstDay={1} // Monday start
        theme={{
          calendarBackground: "transparent",
          textSectionTitleColor: "#b6c1cd",
          todayTextColor: "#ffffff",
          dayTextColor: "#ffffff",
          textDisabledColor: "#333333",
          dotColor: "transparent",
          selectedDotColor: "transparent",
          arrowColor: "#ffffff",
          monthTextColor: "#ffffff",
        }}
        style={{
          backgroundColor: "transparent",
        }}
      />
    </View>
  );
};

export default OverviewCalendar;
