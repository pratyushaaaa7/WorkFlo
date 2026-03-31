import React, { useEffect, useRef, useState } from "react";
import { Animated, LayoutChangeEvent, View } from "react-native";

interface AnimatedTabIndicatorProps {
  /** Array of tab names (used to calculate length and index) */
  tabs: string[];
  /** The currently active tab name */
  activeTab: string;
  /** Optional Animated.Value tracking the ScrollView's contentOffset.x for 1-to-1 swiping animation */
  scrollX?: Animated.Value;
}

/**
 * AnimatedTabIndicator
 * 
 * Renders a sliding purple underline that smoothly transitions between active tabs.
 * It is designed to be placed inside a `relative` View container that wraps the tab buttons.
 * The parent container should have the base static bottom borders.
 * 
 * Example:
 * ```tsx
 * <View className="flex-row items-center pt-1 justify-between pb-0 border-b border-[#E0E5EE] dark:border-[#63615F] relative">
 *   {TABS.map(...) => ...}
 *   <AnimatedTabIndicator tabs={TABS} activeTab={activeTab} />
 * </View>
 * ```
 */
export default function AnimatedTabIndicator({
  tabs,
  activeTab,
  scrollX,
}: AnimatedTabIndicatorProps) {
  const [containerWidth, setContainerWidth] = useState(0);
  const slideAnim = useRef(new Animated.Value(0)).current;

  const totalTabs = tabs.length;
  // Fallback to 0 if the activeTab is somehow not found
  const activeTabIndex = Math.max(0, tabs.indexOf(activeTab));
  const tabWidth = containerWidth > 0 ? containerWidth / totalTabs : 0;

  useEffect(() => {
    if (tabWidth > 0) {
      Animated.spring(slideAnim, {
        toValue: activeTabIndex * tabWidth,
        useNativeDriver: true,
        friction: 8,
        tension: 50,
      }).start();
    }
  }, [activeTabIndex, tabWidth, slideAnim]);

  const onLayout = (event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    // Only update if there's a significant width change to avoid micro re-renders
    if (width > 0 && Math.abs(width - containerWidth) > 1) {
      setContainerWidth(width);
      // Ensure the initial render jumps instantly to the active tab without springing from 0
      slideAnim.setValue(activeTabIndex * (width / totalTabs));
    }
  };

  // If scrollX is provided, map scroll offset to tab index translation
  // Scroll views are usually multi-page, each page the width of `containerWidth`
  // We offset it by `tabWidth` for each page.
  const animatedTranslateX = scrollX
    ? Animated.multiply(scrollX, 1 / totalTabs)
    : slideAnim;

  return (
    <View
      onLayout={onLayout}
      style={{
        position: "absolute",
        bottom: -1, // Sits exactly on top of the parent's `border-b` if adjusting for typical 1px border. Or adjust to 0 if it looks off.
        left: 0,
        right: 0,
        height: 2, // Thickness of the active indicator
      }}
      pointerEvents="none"
    >
      {tabWidth > 0 && (
        <Animated.View
          style={{
            position: "absolute",
            bottom: 0,
            width: tabWidth,
            height: 2,
            backgroundColor: "#5B4CCC", // The purple line
            transform: [{ translateX: animatedTranslateX }],
          }}
        />
      )}
    </View>
  );
}
