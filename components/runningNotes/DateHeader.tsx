// DateHeader.tsx
import React, { memo } from "react";
import { View, Text } from "react-native";

const DateHeader = ({ date }: { date: string }) => (
  <View className="bg-indigo-100 px-2 py-2 border-l border-r border-indigo-200">
    <Text className="font-semibold text-xs text-indigo-800">{date}</Text>
  </View>
);

export default memo(DateHeader);
