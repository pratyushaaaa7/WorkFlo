import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useEffect, useState } from "react";
import {
  Platform,
  Pressable,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Keyboard,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import moment from "moment";
import { MultiSelect } from "react-native-element-dropdown";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import api from "../lib/api";
import Toast from "react-native-toast-message";
import { LinearGradient } from "expo-linear-gradient";

const CreateMinutes = () => {
  const router = useRouter();
  const { projectId, projectName } = useLocalSearchParams<{
    projectId: string;
    projectName: string;
  }>();

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <LinearGradient
        colors={["#6366F1", "#8B5CF6"]}
        className="pt-16 pb-6 px-4 flex-row items-center justify-between"
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.25,
          shadowRadius: 4,
          elevation: 6,
          zIndex: 10,
        }}
      >
        {/* Back Button + Title */}
        <TouchableOpacity
          onPress={() => router.back()}
          className="flex-row items-center"
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
          <Text className="text-xl font-semibold text-white ml-4">
            Create MOM
          </Text>
        </TouchableOpacity>
      </LinearGradient>

      {/* Scrollable Content */}
      <KeyboardAwareScrollView
        enableOnAndroid
        keyboardShouldPersistTaps="handled"
        extraScrollHeight={Platform.OS === "ios" ? 80 : 100}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 60,
        }}
      >
        <Text className="text-2xl py-4 font-extrabold text-gray-800 my-2 text-center">
          {projectName || ""} Minutes
        </Text>

        {/* Issues Section */}
        {minutes.map((minute, index) => (
          <View key={index} className="bg-white rounded-2xl p-4 shadow-sm mb-6">
            <Text className="font-bold text-lg text-blue-600 mb-4">
              Issue {minute.serialNo}
            </Text>

            <View className="gap-1">
              <TextInput
                placeholder="Issue Title"
                value={minute.description}
                className="border border-gray-200 rounded-lg px-3 mb-2 py-2 bg-gray-50 text-base"
                placeholderTextColor="#999"
              />

              <TouchableOpacity onPress={() => openDatePicker(index)}>
                <TextInput
                  placeholder="Target Date (DD-MM-YYYY)"
                  value={
                    minute.targetDate
                      ? new Date(minute.targetDate).toLocaleDateString("en-GB") // ✅ formats as DD/MM/YYYY
                      : ""
                  }
                  editable={false}
                  pointerEvents="none"
                  className="border border-gray-200 rounded-lg px-3 mb-2 py-2 bg-gray-50 text-base text-gray-800"
                  placeholderTextColor="#999"
                />
              </TouchableOpacity>

              {/* Responsibility MultiSelect */}
              <MultiSelect
                style={{
                  height: 35,
                  borderColor: "#E5E7EB",
                  borderWidth: 1,
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  backgroundColor: "#F9FAFB",
                  marginBottom: 2,
                }}
                placeholderStyle={{ fontSize: 14, color: "#888" }}
                selectedTextStyle={{
                  fontSize: 12,
                  color: "#0B0B0B",
                }}
                selectedStyle={{
                  borderRadius: 10,
                  backgroundColor: "#b9EBF1", // light aqua
                  padding: 5,
                }}
                containerStyle={{
                  borderRadius: 12,
                  overflow: "hidden",
                  backgroundColor: "#fff",
                }}
                activeColor="#E0F7FA"
                inputSearchStyle={{ fontSize: 14 }}
                search
                labelField="label"
                valueField="value"
                data={users}
                value={minute.responsibility} // ✅ bind to issue state
                placeholder="Select responsible users"
                searchPlaceholder="Search..."
                onChange={
                  (items) => updateMinute(index, "responsibility", items) // ✅ save array
                }
              />

              <TextInput
                placeholder="Issue Description"
                value={minute.remarks}
                className="border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 text-base"
                placeholderTextColor="#999"
              />
            </View>

            {minute.length > 1 && (
              <Pressable className="pt-5">
                <Text className="text-red-500 font-medium text-lg">
                  Delete Issue
                </Text>
              </Pressable>
            )}
          </View>
        ))}

        {/* Add Issue Button */}
        <Pressable
          onPress={addMinute}
          className="bg-emerald-500 py-3 rounded-2xl mb-6 items-center active:scale-95"
          android_ripple={{ color: "rgba(255,255,255,0.2)" }}
        >
          <Text className="text-white font-semibold text-lg">+ Add Issue</Text>
        </Pressable>

        {/* Submit Button */}
        <Pressable
          //   onPress={handleSubmit}
          className="bg-blue-600 py-4 rounded-2xl items-center active:scale-95"
          android_ripple={{ color: "rgba(255,255,255,0.2)" }}
        >
          <Text className="text-white font-bold text-lg">Submit ILR</Text>
        </Pressable>
      </KeyboardAwareScrollView>
    </View>
  );
};
export default CreateMinutes;
