import { BlurView } from "@react-native-community/blur";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  LayoutChangeEvent,
  StyleSheet,
  View,
  useColorScheme,
} from "react-native";
import Svg, {
  Defs,
  Path,
  Stop,
  LinearGradient as SvgLinearGradient,
} from "react-native-svg";

interface GlassNavProps {
  children: React.ReactNode;
  activeTabIndex: number;
  totalTabs: number;
  activeTabName: string;
}

const getTabColor = (tabName: string) => {
  switch (tabName) {
    case "Overview":
      return "#566FEC";
    case "Projects":
      return "#FF8A47";
    case "Tasks":
      return "#E841B8";
    case "Calendar":
      return "#335EB3";
    default:
      return "#FFC366";
  }
};

export default function GlassNav({
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

  // MOUNTAIN CONFIG
  const mountainWidth = tabWidth * 10;
  const mountainHeight = 38;
  const center = mountainWidth / 2;
  const baseOffset = tabWidth * 3.2;

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
    const { width } = event.nativeEvent.layout;
    if (width > 0 && width !== containerWidth) {
      setContainerWidth(width);
    }
  };

  return (
    <View
      style={styles.container}
      onLayout={onLayout}
      pointerEvents="none" // ⬅️ Critical: purely visual, ignore all touches
    >
      {/* 1. Background tint (lowest layer) */}
      <View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: isDarkMode
              ? "rgba(25,25,25,0.4)"
              : "rgba(255,255,255,0.6)",
            zIndex: -5,
          },
        ]}
      />

      {/* 2. Mountain glow */}
      <View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { zIndex: -4 }]}
      >
        {tabWidth > 0 && (
          <Animated.View
            style={{
              position: "absolute",
              bottom: 0,
              width: mountainWidth,
              height: mountainHeight,
              opacity: 0.3,
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
                <SvgLinearGradient id="grad" x1="0%" y1="100%" x2="0%" y2="0%">
                  <Stop offset="0%" stopColor={activeColor} stopOpacity="1" />
                  <Stop offset="100%" stopColor={activeColor} stopOpacity="0" />
                </SvgLinearGradient>
              </Defs>
              <Path
                d={`M 0,${mountainHeight}
      L ${center - baseOffset},${mountainHeight}
      C ${center - tabWidth * 1.2},${mountainHeight}
        ${center - tabWidth * 0.4},${-5}
        ${center},${-5}
      C ${center + tabWidth * 0.4},${-5}
        ${center + tabWidth * 1.2},${mountainHeight}
        ${center + baseOffset},${mountainHeight}
      L ${mountainWidth},${mountainHeight}
      Z`}
                fill="url(#grad)"
              />
            </Svg>
          </Animated.View>
        )}
      </View>

      {/* 3. Blur */}
      <BlurView
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { zIndex: -3 }]}
        blurType={isDarkMode ? "dark" : "light"}
        blurAmount={15}
        reducedTransparencyFallbackColor="white"
      />

      {/* 4. Active pill */}
      <View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { zIndex: -2 }]}
      >
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

      {/* 5. Mixing Gradient (Feathered Edge) */}
      <LinearGradient
        pointerEvents="none"
        colors={[
          isDarkMode ? "rgba(0,0,0,1)" : "rgba(255,255,255,1)",
          isDarkMode ? "rgba(0,0,0,0.7)" : "rgba(255,255,255,0.7)",
          isDarkMode ? "rgba(0,0,0,0.3)" : "rgba(255,255,255,0.3)",
          "transparent",
        ]}
        locations={[0, 0.3, 0.6, 1]}
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 65,
          zIndex: -1,
        }}
      />
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
