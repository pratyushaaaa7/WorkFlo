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
      return "#5B4CCC";
    case "Projects":
      return "#FF8A47";
    case "Tasks":
      return "#E841B8";
    case "Calendar":
      return "#335EB3";
    default:
      return "#4F46E5";
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

  // 🔥 MOUNTAIN CONFIG — ONLY horizontal width increased
  const mountainWidth = tabWidth * 6; // ⬅️ increased from 4.2 to 6
  const mountainHeight = 38; // ⬅️ keep height same

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
      {/* Background tint */}
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: isDarkMode
              ? "rgba(25,25,25,0.4)"
              : "rgba(255,255,255,0.6)",
          },
        ]}
      />

      {/* Mountain glow */}
      <View style={StyleSheet.absoluteFill}>
        {tabWidth > 0 && (
          <Animated.View
            style={{
              position: "absolute",
              bottom: 0,
              width: mountainWidth,
              height: mountainHeight,
              opacity: 0.2,
              transform: [
                {
                  translateX: Animated.add(
                    slideAnim,
                    -(mountainWidth / 2) + tabWidth / 2 + 12
                  ),
                },
              ],
            }}
          >
            <Svg width={mountainWidth} height={mountainHeight}>
              <Defs>
                <LinearGradient id="grad" x1="0%" y1="100%" x2="0%" y2="0%">
                  <Stop offset="0%" stopColor={activeColor} stopOpacity="1" />
                  <Stop offset="100%" stopColor={activeColor} stopOpacity="0" />
                </LinearGradient>
              </Defs>

              <Path
                d={`M 0,${mountainHeight}
      C ${mountainWidth * 0.35},${mountainHeight}
        ${mountainWidth * 0.45},${-mountainHeight * 0.75}
        ${mountainWidth / 2},${-mountainHeight}
      C ${mountainWidth * 0.55},${-mountainHeight * 0.75}
        ${mountainWidth * 0.65},${mountainHeight}
        ${mountainWidth},${mountainHeight}
      Z`}
                fill="url(#grad)"
              />
            </Svg>
          </Animated.View>
        )}
      </View>

      {/* Blur */}
      <BlurView
        style={StyleSheet.absoluteFill}
        blurType={isDarkMode ? "dark" : "light"}
        blurAmount={15}
        reducedTransparencyFallbackColor="white"
      />

      {/* Active pill */}
      <View style={StyleSheet.absoluteFill}>
        {tabWidth > 0 && (
          <Animated.View
            style={{
              position: "absolute",
              bottom: 0,
              width: tabWidth - 24,
              height: 3,
              backgroundColor: activeColor,
              borderRadius: 3,
              transform: [{ translateX: Animated.add(slideAnim, 24) }],
            }}
          />
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 60,
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
