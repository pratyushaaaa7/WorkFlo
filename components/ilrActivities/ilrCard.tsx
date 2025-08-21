import React from "react";
import { View, Text } from "react-native";
import { useILR } from "../../context/ILRContext";

const ILRCard = () => {
  const { ilr } = useILR();

  return (
    <View className="bg-white rounded-2xl p-4 shadow mb-6">
      <View className="flex-row justify-between items-start">
        <Text className="font-semibold text-lg text-gray-900 flex-1">
          {ilr.description}
        </Text>
        <View className={`px-3 py-1 rounded-full ${ilr.status === "Open" ? "bg-blue-500" : "bg-green-500"}`}>
          <Text className="text-white text-xs font-medium">{ilr.status}</Text>
        </View>
      </View>

      <Text className="text-gray-600 text-sm mt-3">
        🎯 Target Date: <Text className="font-medium">{new Date(ilr.targetDate).toLocaleDateString()}</Text>
      </Text>

      <Text className="text-gray-600 text-sm mt-1">
        👥 Responsibility:{" "}
        <Text className="font-medium">{ilr.responsibility?.map((u: any) => `${u.individualName} (${u.designation})`).join(", ")}</Text>
      </Text>

      <Text className="text-gray-600 text-sm mt-1">
        📝 Remarks: <Text className={ilr.remarks ? "font-medium" : "italic text-gray-400"}>{ilr.remarks || "No remarks"}</Text>
      </Text>
    </View>
  );
};

export default ILRCard;
