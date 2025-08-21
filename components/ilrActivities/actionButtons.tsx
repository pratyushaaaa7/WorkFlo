import React from "react";
import { View, TouchableOpacity, Text, Platform } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useILR } from "../../context/ILRContext";

const ActionButtons = () => {
  const {
    ilr,
    showDatePicker,
    openDatePicker,
    onDateChange,
    showRemarkInput,
    openRemarkModal,
    toggleStatus,
  } = useILR();

  return (
    <View className="flex-row justify-between mb-6">
      <TouchableOpacity
        className="flex-1 bg-blue-600 mx-1 py-3 rounded-xl shadow"
        onPress={openDatePicker}
      >
        <Text className="text-center text-white font-medium text-sm">Change Date</Text>
      </TouchableOpacity>

      {showDatePicker && (
        <DateTimePicker
          value={ilr.targetDate ? new Date(ilr.targetDate) : new Date()}
          mode="date"
          display={Platform.OS === "ios" ? "inline" : "default"}
          onChange={onDateChange}
        />
      )}

      <TouchableOpacity
        className="flex-1 bg-yellow-500 mx-1 py-3 rounded-xl shadow"
        onPress={openRemarkModal}
      >
        <Text className="text-center text-white font-medium text-sm">Edit Remark</Text>
      </TouchableOpacity>

      <TouchableOpacity
        className={`flex-1 mx-1 py-3 rounded-xl shadow ${ilr.status === "Open" ? "bg-green-600" : "bg-red-500"}`}
        onPress={toggleStatus}
      >
        <Text className="text-center text-white font-medium">{ilr.status === "Open" ? "Close" : "Reopen"}</Text>
      </TouchableOpacity>
    </View>
  );
};

export default ActionButtons;
