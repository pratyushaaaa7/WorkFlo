import { BlurView } from "@react-native-community/blur";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  LayoutChangeEvent,
  StyleSheet,
  View,
  useColorScheme,
} from "react-native";
import Svg, { Defs, LinearGradient, Path, Stop } from "react-native-svg";

interface GlassNavProps {
  children: React.ReactNode;
  activeTabIndex: number;
  totalTabs: number;
  activeTabName: string;
}

const getTabColor = (tabName: string) => {
  switch (tabName) {
    case "Overview":
      return "#9333EA"; // Purple-600
    case "Projects":
      return "#EA580C"; // Orange-600
    case "Tasks":
      return "#DB2777"; // Pink-600
    case "Calendar":
      return "#2563EB"; // Blue-600
    default:
      return "#4F46E5"; // Indigo-600
  }
};

export default function GlassNav({
  children,
  activeTabIndex,
  totalTabs,
  activeTabName,
}: GlassNavProps) {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";
  const [containerWidth, setContainerWidth] = useState(0);

  const tabWidth = containerWidth > 0 ? (containerWidth - 24) / totalTabs : 0;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const activeColor = getTabColor(activeTabName);

  useEffect(() => {
    if (tabWidth > 0) {
      Animated.spring(slideAnim, {
        toValue: activeTabIndex * tabWidth,
        useNativeDriver: true,
        friction: 8,
        tension: 40,
      }).start();
    }
  }, [activeTabIndex, tabWidth]);

  const onLayout = (event: LayoutChangeEvent) => {
    setContainerWidth(event.nativeEvent.layout.width);
  };

  return (
    <View style={styles.container} onLayout={onLayout}>
      {/* LAYER 0: Background Tint */}
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: isDarkMode
              ? "rgba(25, 25, 25, 0.4)"
              : "rgba(255, 255, 255, 0.6)",
          },
        ]}
      />

      {/* LAYER 1: Mountain Glow (SVG) */}
      <View style={StyleSheet.absoluteFill}>
        {tabWidth > 0 && (
          <Animated.View
            style={{
              position: "absolute",
              bottom: 0,
              width: tabWidth * 3,
              height: 40,
              // Center the mountain on the active tab
              // Offset = slideAnim (current tab start) - tabWidth (to start from prev tab) + 12 (padding)
              transform: [
                { translateX: Animated.subtract(slideAnim, tabWidth - 12) },
              ],
              opacity: 0.6,
            }}
          >
            <Svg height="40" width={tabWidth * 3}>
              <Defs>
                <LinearGradient id="grad" x1="0%" y1="100%" x2="0%" y2="0%">
                  <Stop offset="0%" stopColor={activeColor} stopOpacity="1" />
                  <Stop offset="100%" stopColor={activeColor} stopOpacity="0" />
                </LinearGradient>
              </Defs>
              <Path
                d={`M 0,40 Q ${tabWidth * 1.5},0 ${tabWidth * 3},40 Z`}
                fill="url(#grad)"
              />
            </Svg>
          </Animated.View>
        )}
      </View>

      {/* LAYER 2: Blur (Frosting) */}
      <BlurView
        style={StyleSheet.absoluteFill}
        blurType={isDarkMode ? "dark" : "light"}
        blurAmount={20} // Adjusted for better mountain clarity
        reducedTransparencyFallbackColor="white"
      />

      {/* LAYER 3: Active Pill Indicator (Placed after blur for sharpness) */}
      <View style={StyleSheet.absoluteFill}>
        {tabWidth > 0 && (
          <Animated.View
            style={{
              position: "absolute",
              bottom: 0,
              width: tabWidth - 24, // Narrower than the tab for pill look
              height: 3,
              backgroundColor: activeColor,
              borderRadius: 3,
              transform: [{ translateX: Animated.add(slideAnim, 24) }], // 12 padding + 12 margin
            }}
          />
        )}
      </View>

      {/* LAYER 4: Content */}
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 72,
    overflow: "hidden",
  },
  content: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingTop: 8,
  },
});
