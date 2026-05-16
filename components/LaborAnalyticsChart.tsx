import React, { useState } from "react";
import { View, Text, useColorScheme, Dimensions } from "react-native";
import { LineChart } from "react-native-gifted-charts";
import { Dropdown } from "react-native-element-dropdown";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");

const LaborAnalyticsChart = () => {
  const isDarkMode = useColorScheme() === "dark";
  const [filter, setFilter] = useState("Weekly");

  const filterOptions = [
    { label: "Daily", value: "Daily" },
    { label: "Weekly", value: "Weekly" },
    { label: "Monthly", value: "Monthly" },
  ];

  // Mock data to match the image
  const projectedData = [
    { value: 12, label: "Mon" },
    { value: 20, label: "Tue" },
    { value: 15, label: "Wed" },
    { value: 22, label: "Thu" },
    { value: 21, label: "Fri" },
    { value: 28, label: "Sat" },
    { value: 35, label: "Sun" },
    { value: 20 },
  ];

  const actualData = [
    { value: 52, label: "Mon" },
    { value: 25, label: "Tue" },
    { value: 55, label: "Wed" },
    { value: 38, label: "Thu" },
    { value: 65, label: "Fri" },
    { value: 32, label: "Sat" },
    { value: 58, label: "Sun" },
    { value: 45 },
  ];

  const colors = {
    projected: "#7C73FF",
    actual: "#FF9191",
    textPrimary: isDarkMode ? "#FFFFFF" : "#000000",
    textSecondary: isDarkMode ? "#9BA1A6" : "#6B7280",
    cardBg: isDarkMode ? "#121212" : "#FFFFFF",
    gridLine: isDarkMode ? "#2A2A2A" : "#EBEBEB",
  };

  return (
    <View
      style={{
        backgroundColor: colors.cardBg,
        margin: 16,
        padding: 20,
        borderRadius: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.05,
        shadowRadius: 20,
        elevation: 5,
      }}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 30,
        }}
      >
        <Text
          style={{
            fontSize: 20,
            fontFamily: "DMSans_700Bold",
            color: colors.textPrimary,
          }}
        >
          Actual vs Projected
        </Text>
        <Dropdown
          style={{
            width: 100,
            height: 36,
            backgroundColor: isDarkMode ? "#1A1A1A" : "#F3F4F6",
            borderRadius: 10,
            paddingHorizontal: 12,
          }}
          placeholderStyle={{
            fontSize: 14,
            color: colors.textSecondary,
            fontFamily: "Poppins_400Regular",
          }}
          selectedTextStyle={{
            fontSize: 14,
            color: colors.textPrimary,
            fontFamily: "Poppins_500Medium",
          }}
          data={filterOptions}
          labelField="label"
          valueField="value"
          value={filter}
          onChange={(item) => setFilter(item.value)}
        />
      </View>

      {/* Chart */}
      <View style={{ marginLeft: -20 }}>
        <LineChart
          data={projectedData}
          data2={actualData}
          height={200}
          width={width - 80}
          initialSpacing={20}
          spacing={50}
          noOfSections={5}
          maxValue={100}
          stepValue={20}
          yAxisThickness={0}
          xAxisThickness={0}
          yAxisTextStyle={{ color: colors.textSecondary, fontSize: 12 }}
          xAxisLabelTextStyle={{
            color: colors.textSecondary,
            fontSize: 12,
            marginTop: 10,
          }}
          rulesType="dashed"
          rulesColor={colors.gridLine}
          dashGap={5}
          dashWidth={5}
          
          // Projected Line Styling (Blue/Purple)
          color={colors.projected}
          thickness={2}
          curved
          hideDataPoints={false}
          dataPointsColor={colors.projected}
          dataPointsRadius={4}
          showValuesAsDataPointsText={false}
          areaChart
          startFillColor={colors.projected}
          endFillColor="transparent"
          startOpacity={0.4}
          endOpacity={0}

          // Actual Line Styling (Red/Pink)
          color2={colors.actual}
          thickness2={2}
          curved2
          hideDataPoints2={false}
          dataPointsColor2={colors.actual}
          dataPointsRadius2={4}
          areaChart2
          startFillColor2={colors.actual}
          endFillColor2="transparent"
          startOpacity2={0.4}
          endOpacity2={0}

          // Tooltip / Pointer config
          pointerConfig={{
            pointerStripColor: colors.gridLine,
            pointerStripWidth: 2,
            pointerColor: colors.projected,
            radius: 6,
            pointerLabelComponent: (items: any) => {
              return (
                <View
                  style={{
                    backgroundColor: isDarkMode ? "#1A1A1A" : "#FFFFFF",
                    padding: 12,
                    borderRadius: 12,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.1,
                    shadowRadius: 8,
                    elevation: 5,
                    borderWidth: 1,
                    borderColor: colors.gridLine,
                  }}
                >
                  <Text style={{ color: colors.textSecondary, fontSize: 10, marginBottom: 4 }}>
                    2 May, 2026
                  </Text>
                  <View style={{ flexDirection: "row", gap: 12 }}>
                    <View>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                        <View style={{ width: 3, height: 12, backgroundColor: colors.projected, borderRadius: 2 }} />
                        <Text style={{ color: colors.textSecondary, fontSize: 10 }}>Projected</Text>
                      </View>
                      <Text style={{ color: colors.textPrimary, fontSize: 16, fontFamily: "DMSans_700Bold" }}>
                        {items[0].value}
                      </Text>
                    </View>
                    <View>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                        <View style={{ width: 3, height: 12, backgroundColor: colors.actual, borderRadius: 2 }} />
                        <Text style={{ color: colors.textSecondary, fontSize: 10 }}>Actual</Text>
                      </View>
                      <Text style={{ color: colors.textPrimary, fontSize: 16, fontFamily: "DMSans_700Bold" }}>
                        {items[1].value}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            },
          }}
        />
      </View>

      {/* Legend */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "center",
          gap: 20,
          marginTop: 40,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View
            style={{
              width: 16,
              height: 16,
              borderRadius: 4,
              backgroundColor: colors.projected,
              opacity: 0.6,
            }}
          />
          <Text
            style={{
              fontSize: 14,
              fontFamily: "Poppins_400Regular",
              color: colors.projected,
            }}
          >
            Projected
          </Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View
            style={{
              width: 16,
              height: 16,
              borderRadius: 4,
              backgroundColor: colors.actual,
              opacity: 0.6,
            }}
          />
          <Text
            style={{
              fontSize: 14,
              fontFamily: "Poppins_400Regular",
              color: colors.actual,
            }}
          >
            Actual
          </Text>
        </View>
      </View>
    </View>
  );
};

export default LaborAnalyticsChart;
