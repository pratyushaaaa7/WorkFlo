import { Ionicons } from "@expo/vector-icons";
import { Calendar02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { LinearGradient } from "expo-linear-gradient";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import { Dropdown, MultiSelect } from "react-native-element-dropdown";
import DateTimePicker from "@react-native-community/datetimepicker";
import { statusOptions } from "../../utils/runningNotes";

const AddNoteCard = ({ users, onAdd }: any) => {
  const isDarkMode = useColorScheme() === "dark";
  const [noteText, setNoteText] = useState("");
  const [status, setStatus] = useState("Open");
  const [responsible, setResponsible] = useState<string[]>([]);
  const [targetDate, setTargetDate] = useState<Date | null>(null);
  const [showAddDatePicker, setShowAddDatePicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const multiSelectRef: any = useRef(null);

  const isAddDisabled = !noteText.trim() || isSubmitting;

  const handleAdd = async () => {
    if (isAddDisabled) return;
    setIsSubmitting(true);
    await onAdd({ noteText, status, responsible, targetDate });
    setNoteText("");
    setStatus("Open");
    setResponsible([]);
    setTargetDate(null);
    setIsSubmitting(false);
  };

  return (
    <View
      className="p-3"
      style={{ backgroundColor: isDarkMode ? "#000" : "#FBFCFD" }}
    >
      <Text
        className="font-poppinsMedium mb-2 text-sm"
        style={{ color: isDarkMode ? "#fff" : "#000" }}
      >
        Add New Note
      </Text>

      {/* Note Text Input */}
      <TextInput
        placeholder="Enter note..."
        placeholderTextColor={isDarkMode ? "#666" : "#64748B"}
        value={noteText}
        multiline
        onChangeText={setNoteText}
        style={{
          backgroundColor: isDarkMode ? "#0D0D0D" : "#F0F3F7",

          borderRadius: 12,
          padding: 8,
          color: isDarkMode ? "#fff" : "#000",
          minHeight: 30,
          maxHeight: 120,
          textAlignVertical: "top",
          marginBottom: 10,
          fontFamily: "Poppins_400Regular",
        }}
      />

      {/* Status + Target Date Row */}
      <View className="flex-row gap-2 mb-2">
        <Dropdown
          style={{
            flex: 1,
            backgroundColor: isDarkMode ? "#0D0D0D" : "#F0F3F7",
            // borderWidth: 1,
            // borderColor: isDarkMode ? "#5B4CCC" : "transparent",
            borderRadius: 12,
            height: 40,
            paddingHorizontal: 10,
          }}
          placeholderStyle={{
            fontSize: 13,
            color: isDarkMode ? "#666" : "#64748B",
            fontFamily: "Poppins_400Regular",
          }}
          selectedTextStyle={{
            fontSize: 13,
            color: isDarkMode ? "#fff" : "#000",
            fontFamily: "Poppins_400Regular",
          }}
          containerStyle={{
            borderRadius: 12,
            backgroundColor: isDarkMode ? "#000" : "#fff",
            borderColor: isDarkMode ? "#1A1A1A" : "#E2E8F0",
            marginTop: 4,
            paddingVertical: 0,
          }}
          itemContainerStyle={{
            paddingVertical: 2,
            borderRadius: 8,
          }}
          itemTextStyle={{
            color: isDarkMode ? "#fff" : "#000",
            fontFamily: "Poppins_400Regular",
            fontSize: 14,
          }}
          activeColor={isDarkMode ? "#1A1A1A" : "#F0F3F7"}
          data={statusOptions}
          labelField="label"
          valueField="value"
          placeholder="Status"
          value={status}
          onChange={(item) => setStatus(item.value)}
          renderRightIcon={() => (
            <Ionicons
              name="chevron-down"
              size={16}
              color={isDarkMode ? "#999" : "#64748B"}
            />
          )}
        />

        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: isDarkMode ? "#0D0D0D" : "#F0F3F7",
            borderWidth: 1,
            borderColor: "transparent",
            borderRadius: 12,
            height: 40,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 10,
          }}
          onPress={() => setShowAddDatePicker(true)}
        >
          <View
            style={{
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Text
              className="font-poppins"
              style={{
                fontSize: 13,
                color: targetDate
                  ? isDarkMode
                    ? "#fff"
                    : "#000"
                  : isDarkMode
                    ? "#666"
                    : "#64748B",
              }}
            >
              {targetDate ? targetDate.toLocaleDateString() : "Due date"}
            </Text>
            <HugeiconsIcon
              icon={Calendar02Icon}
              size={16}
              color={isDarkMode ? "#919191" : "#919191"}
            />
          </View>
        </TouchableOpacity>
      </View>

      {/* Modal Date Picker */}
      {showAddDatePicker && (
        <DateTimePicker
          value={targetDate || new Date()}
          mode="date"
          display="default"
          onChange={(event, date) => {
            if (event.type === "set" && date) {
              setTargetDate(date);
              setShowAddDatePicker(false);
            } else {
              setShowAddDatePicker(false);
            }
          }}
        />
      )}

      {/* Responsible + Add Button Row */}
      <View className="flex-row items-center gap-2">
        <MultiSelect
          ref={multiSelectRef}
          style={{
            flex: 1,
            backgroundColor: isDarkMode ? "#0D0D0D" : "#F0F3F7",
            borderRadius: 12,
            height: 40,
            paddingHorizontal: 12,
            justifyContent: "center",
          }}
          placeholderStyle={{
            fontSize: 13,
            color: isDarkMode ? "#BBBBBB" : "#454545",
            fontFamily: "Poppins_400Regular",
          }}
          selectedTextStyle={{
            fontSize: 13,
            color: isDarkMode ? "#fff" : "#000",
            fontFamily: "Poppins_400Regular",
          }}
          containerStyle={{
            borderRadius: 12,
            backgroundColor: isDarkMode ? "#0D0D0D" : "#F6F8FA",
            borderColor: isDarkMode ? "#1A1A1A" : "#E2E8F0",
            marginTop: 4,
            paddingVertical: 0,
          }}
          itemContainerStyle={{
            paddingVertical: 2,
            borderRadius: 8,
          }}
          itemTextStyle={{
            color: isDarkMode ? "#fff" : "#000",
            fontFamily: "Poppins_400Regular",
            fontSize: 14,
          }}
          activeColor={isDarkMode ? "#1A1A1A" : "#F0F3F7"}
          data={users}
          labelField="label"
          valueField="value"
          placeholder="Assignee"
          value={responsible}
          onChange={(item) => {
            setResponsible(item);
            multiSelectRef.current?.close();
          }}
          search
          searchPlaceholder="Search"
          inputSearchStyle={{
            backgroundColor: isDarkMode ? "#000" : "#F0F3F7",
            color: isDarkMode ? "#fff" : "#000",
            borderColor: isDarkMode ? "#2B2B2B" : "#E0E5EB",
            borderRadius: 8,
            height: 48,
            fontSize: 13,
            fontFamily: "Poppins_400Regular",
          }}
          renderSelectedItem={() => <View />} // Hide internal selection safely
        />

        <TouchableOpacity onPress={handleAdd} disabled={isAddDisabled}>
          <LinearGradient
            colors={
              isAddDisabled
                ? isDarkMode
                  ? ["#2F2F2F", "#2F2F2F", "#2F2F2F"]
                  : ["#EFEFEF", "#EFEFEF", "#EFEFEF"]
                : ["#5B4CCC", "#6347C2", "#8056D1"]
            }
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={{
              height: 40,
              width: 76,
              borderRadius: 12,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text
                className={`font-poppins text-[16px] ${
                  isAddDisabled
                    ? isDarkMode
                      ? "text-[#919191]"
                      : "text-[#777777]"
                    : "text-white"
                }`}
              >
                Add
              </Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Manual Selection Chips (Mapped Below) */}
      {responsible.length > 0 && (
        <View className="flex-row flex-wrap mt-1">
          {responsible.map((userId) => {
            const user = users.find((u: any) => u.value === userId);
            if (!user) return null;
            return (
              <TouchableOpacity
                key={userId}
                onPress={() =>
                  setResponsible((prev) => prev.filter((id) => id !== userId))
                }
              >
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "center",
                    alignItems: "center",
                    borderRadius: 10,
                    backgroundColor: isDarkMode ? "#000" : "#fff",
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    marginTop: 8,
                    marginRight: 8,
                    borderWidth: 1,
                    borderColor: isDarkMode ? "#2B2B2B" : "#E0E5EB",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      color: isDarkMode ? "#fff" : "#000",
                      fontFamily: "Poppins_400Regular",
                      marginRight: 6,
                    }}
                  >
                    {user.label}
                  </Text>
                  <Ionicons
                    name="close"
                    size={14}
                    color={isDarkMode ? "#fff" : "#000"}
                  />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
};

export default React.memo(AddNoteCard);
