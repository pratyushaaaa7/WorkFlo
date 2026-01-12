import { ArrowDown01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { format, parseISO } from "date-fns";
import React, { useState } from "react";
import { Modal, Pressable, Text, TouchableOpacity, View } from "react-native";
import { Calendar } from "react-native-calendars";
import Animated, { FadeInDown } from "react-native-reanimated";

const OverviewCalendar = () => {
  const [selectedDate, setSelectedDate] = useState(
    format(new Date(), "yyyy-MM-dd")
  );
  const [currentMonth, setCurrentMonth] = useState(
    format(new Date(), "yyyy-MM-dd")
  );
  const [isMonthPickerVisible, setIsMonthPickerVisible] = useState(false);

  const visibleMonthDate = parseISO(currentMonth);

  const taskCounts: Record<string, number> = {
    "29": 2,
    "30": 7,
    "03": 4,
    "05": 5,
    "08": 9,
    "13": 3,
    "15": 1,
    "17": 8,
    "21": 1,
    "23": 6,
    "28": 10,
  };

  /** 🔹 Custom Day Card */
  const DayCard = ({ date, state }: any) => {
    const isSelected = date.dateString === selectedDate;
    const isDisabled = state === "disabled";
    const dayKey = date.day < 10 ? `0${date.day}` : `${date.day}`;
    const taskCount = taskCounts[dayKey];

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => !isDisabled && setSelectedDate(date.dateString)}
        style={{
          aspectRatio: 1,
          opacity: isDisabled ? 0.35 : 1,
          borderColor: isSelected ? "transparent" : "#2B2B2B",
          backgroundColor: isSelected ? "#566FEC" : "#1A1A1A",
          // margin: 1.5,
        }}
        className="flex-1 rounded-lg border p-1 justify-between items-center"
      >
        <Text
          className={`text-white font-DM text-[13px] mb-2 text-center ${
            isSelected ? "font-bold" : "font-medium"
          }`}
        >
          {date.day}
        </Text>

        {taskCount && !isDisabled ? (
          <Text
            numberOfLines={1}
            className={`text-[8px] font-poppins text-center w-full ${
              isSelected ? "text-white" : "text-[#919191]"
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
  const renderDayHeader = (day: string) => {
    return (
      <View className="bg-[#151515] px-3 py-1.5 rounded-lg border border-[#252525] min-w-[45px] items-center">
        <Text className="text-[#919191] text-xs font-poppinsMedium">{day}</Text>
      </View>
    );
  };

  return (
    <View className="bg-[#0D0D0D] pt-4 pb-6">
      {/* Header */}
      <View className="flex-row items-center justify-between mb-6">
        <View className="flex-row items-center">
          <Text className="text-2xl font-poppinsBold text-white mr-4">
            Calendar
          </Text>

          <TouchableOpacity
            onPress={() => setIsMonthPickerVisible(true)}
            className="flex-row items-center"
          >
            <Text className="text-gray-400 text-lg font-poppinsMedium mr-1">
              {format(visibleMonthDate, "MMM")}
            </Text>
            <HugeiconsIcon icon={ArrowDown01Icon} size={18} color="#919191" />
          </TouchableOpacity>
        </View>

        <Text className="text-[#3b82f6] text-sm font-poppinsMedium">
          View all
        </Text>
      </View>

      {/* Custom Day Headers */}
      <View className="flex-row justify-around mb-3">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(renderDayHeader)}
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
            textDisabledColor: "#444",
            monthTextColor: "#fff",
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
          className="flex-1 bg-black/80 items-center justify-center p-6"
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
              })}
            </View>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

export default OverviewCalendar;
