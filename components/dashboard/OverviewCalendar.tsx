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

  /** Task counts (mapped by day of month) */
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
          flex: 1,
          aspectRatio: 0.8,
          margin: 4,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: isSelected ? "#3b82f6" : "#252525",
          backgroundColor: isSelected ? "#3b82f6" : "transparent",
          opacity: isDisabled ? 0.35 : 1,
          padding: 8,
          justifyContent: "space-between",
        }}
      >
        <Text
          style={{
            color: "white",
            fontSize: 18,
            fontFamily: "Poppins-SemiBold",
            textAlign: "center",
          }}
        >
          {date.day}
        </Text>

        {taskCount && !isDisabled ? (
          <Text
            style={{
              fontSize: 10,
              color: isSelected ? "white" : "#919191",
              fontFamily: "Poppins-Medium",
              textAlign: "center",
            }}
          >
            {taskCount} {taskCount === 1 ? "Task" : "Tasks"}
          </Text>
        ) : (
          <View style={{ height: 12 }} />
        )}
      </TouchableOpacity>
    );
  };

  /** 🔹 Custom Day Header */
  const renderDayHeader = (day: string) => {
    return (
      <View
        style={{
          backgroundColor: "#151515",
          paddingVertical: 6,
          paddingHorizontal: 12,
          borderRadius: 8,
          borderWidth: 1,
          borderColor: "#252525",
          minWidth: 45,
          alignItems: "center",
        }}
      >
        <Text
          style={{
            color: "#919191",
            fontSize: 12,
            fontFamily: "Poppins-Medium",
          }}
        >
          {day}
        </Text>
      </View>
    );
  };

  return (
    <View className=" bg-[#0D0D0D] pt-4 pb-6">
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
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-around",
          marginBottom: 12,
        }}
      >
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(renderDayHeader)}
      </View>

      {/* Calendar */}
      <Animated.View
        key={currentMonth}
        entering={FadeInDown.duration(600).springify()}
        style={{ flex: 1 }}
      >
        <Calendar
          current={currentMonth}
          onMonthChange={(m) => setCurrentMonth(m.dateString)}
          enableSwipeMonths
          hideArrows
          firstDay={1}
          dayComponent={DayCard}
          renderHeader={() => null} // Hide default Month/Arrow header
          hideDayNames={true} // Hide default day names to use our custom boxed ones
          theme={{
            calendarBackground: "transparent",
            textSectionTitleColor: "#e5e7eb",
            textDayHeaderFontFamily: "Poppins-Medium",
            textDayHeaderFontSize: 12, // Still set it just in case, but it's hidden
            textDisabledColor: "#444",
            monthTextColor: "#fff",
            // @ts-ignore
            "stylesheet.calendar.header": {
              header: {
                height: 0,
                opacity: 0,
                marginTop: 0,
                marginBottom: 0,
              },
            },
          }}
          style={{ backgroundColor: "transparent" }}
        />
      </Animated.View>

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
