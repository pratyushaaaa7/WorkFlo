import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Dropdown } from "react-native-element-dropdown";
// import DateTimePicker from "@react-native-community/datetimepicker";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { statusOptions } from "../../utils/runningNotes";

const AddNoteCard = ({ users, onAdd }: any) => {
  const [noteText, setNoteText] = useState("");
  const [status, setStatus] = useState("Open");
  const [responsible, setResponsible] = useState<string | null>(null);
  const [targetDate, setTargetDate] = useState<Date | null>(null);
  const [showAddDatePicker, setShowAddDatePicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isAddDisabled = !noteText.trim() || isSubmitting;

  const handleAdd = async () => {
    if (isAddDisabled) return;
    setIsSubmitting(true);
    await onAdd({ noteText, status, responsible, targetDate });
    setNoteText("");
    setStatus("Open");
    setResponsible(null);
    setTargetDate(null);
    setIsSubmitting(false);
  };

  return (
    <View className="p-2">
      <View className="bg-white px-2 py-2 rounded-2xl shadow-md">
        <Text className="font-semibold px-1 mb-1 text-base">Add New Note</Text>

        {/* Note Text Input */}
        <TextInput
          placeholder="Enter note..."
          placeholderTextColor="#888"
          value={noteText}
          multiline
          onChangeText={setNoteText}
          className="border border-gray-200 rounded-xl p-2 mb-1 text-sm"
        />

        {/* Status + Target Date Row */}
        <View className="flex-row justify-between mb-1 gap-2">
          <Dropdown
            style={{
              flex: 1,
              borderWidth: 1,
              borderColor: "#E5E7EB",
              borderRadius: 12,
              height: 34,
              paddingHorizontal: 10,
            }}
            placeholderStyle={{ fontSize: 14, color: "#888" }}
            selectedTextStyle={{ fontSize: 13, color: "#111827" }}
            containerStyle={{ borderRadius: 14, backgroundColor: "#fff" }}
            activeColor="#EEF2FF"
            data={statusOptions}
            labelField="label"
            valueField="value"
            placeholder="Select status"
            value={status}
            onChange={(item) => setStatus(item.value)}
          />

          <TouchableOpacity
            className="border border-gray-200 rounded-xl flex-1 justify-center px-3"
            style={{ height: 34 }}
            onPress={() => setShowAddDatePicker(true)}
          >
            <Text className="text-sm">
              {targetDate ? targetDate.toDateString() : "Select target date"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Modal Date Picker */}
        <DateTimePickerModal
          isVisible={showAddDatePicker}
          mode="date"
          onConfirm={(date) => {
            setTargetDate(date);
            setShowAddDatePicker(false);
          }}
          onCancel={() => setShowAddDatePicker(false)}
        />

        {/* Responsible + Add Button Row */}
        <View className="flex-row items-center gap-2">
          <View style={{ flex: 1 }}>
            <Dropdown
              style={{
                borderWidth: 1,
                borderColor: "#E5E7EB",
                borderRadius: 12,
                height: 34,
                paddingHorizontal: 10,
              }}
              placeholderStyle={{ fontSize: 13, color: "#888" }}
              selectedTextStyle={{ fontSize: 13, color: "#111827" }}
              containerStyle={{
                borderRadius: 14,
                backgroundColor: "#fff",
                marginBottom: 0,
              }}
              activeColor="#EEF2FF"
              data={users}
              labelField="label"
              valueField="value"
              placeholder="Responsible"
              value={responsible}
              onChange={(item) => setResponsible(item.value)}
            />
          </View>

          <TouchableOpacity
            className="rounded-lg items-center justify-center"
            style={{
              height: 34,
              width: 90,
              backgroundColor: isAddDisabled ? "#A5B4FC" : "#4F46E5",
            }}
            onPress={handleAdd}
            disabled={isAddDisabled}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text
                className="font-semibold text-xs"
                style={{
                  color: isAddDisabled ? "#E0E7FF" : "#FFFFFF",
                }}
              >
                Add
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default React.memo(AddNoteCard);
