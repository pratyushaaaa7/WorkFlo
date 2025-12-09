import React from "react";
import { View, Text } from "react-native";
import Svg, { Circle } from "react-native-svg";

interface Props {
  percentage: number; // open percentage
  size?: number;
  strokeWidth?: number;
  label?: string; // new prop for count label
}

export default function CircleProgress({
  percentage,
  size = 60,
  strokeWidth = 8,
  label,
}: Props) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const openProgress = (percentage / 100) * circumference;

  return (
    <View style={{ width: size, height: size, justifyContent: "center", alignItems: "center" }}>
      <Svg width={size} height={size}>
        {/* Background circle (closed minutes shown as green) */}
        <Circle
          stroke="#16A34A" // green for closed/forInfo
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
        />

        {/* Open minutes (shown as red) */}
        <Circle
          stroke="#DC2626" // red for open
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference}`}
          strokeDashoffset={circumference - openProgress}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>

      {/* Center label */}
      {label && (
        <Text style={{ position: "absolute", fontSize: 12, fontWeight: "bold", color: "#111" }}>
          {label}
        </Text>
      )}
    </View>
  );
}
