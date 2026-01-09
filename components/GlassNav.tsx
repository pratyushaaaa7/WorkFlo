import { BlurView } from "@react-native-community/blur";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  LayoutChangeEvent,
  StyleSheet,
  View,
  useColorScheme,
} from "react-native";

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
              ? "rgba(25, 25, 25, 0.5)"
              : "rgba(255, 255, 255, 0.7)",
          },
        ]}
      />

      {/* LAYER 1: The Glow (Highlight) */}
      <View style={StyleSheet.absoluteFill}>
        {tabWidth > 0 && (
          <Animated.View
            style={[
              styles.highlight,
              {
                width: tabWidth - 8,
                backgroundColor: activeColor,
                transform: [{ translateX: Animated.add(slideAnim, 16) }],
                opacity: 0.45, // Lower opacity for a softer glow
              },
            ]}
          />
        )}
      </View>

      {/* LAYER 2: Blur (Frosting everything behind it) */}
      <BlurView
        style={StyleSheet.absoluteFill}
        blurType={isDarkMode ? "dark" : "light"}
        blurAmount={30} // High blur for a very diffuse frosted look
        reducedTransparencyFallbackColor="white"
      />

      {/* LAYER 3: Content (Icons & Text - Non-blurred) */}
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 68, // slightly more height for spaciousness
    overflow: "hidden",
    borderRadius: 0, // Keep it flat as part of the header
  },
  highlight: {
    position: "absolute",
    top: 6,
    bottom: 6,
    borderRadius: 20, // More rounded for a soft pill shape
  },
  content: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
  },
});
