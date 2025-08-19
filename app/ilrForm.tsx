import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useEffect, useState } from "react";
import {
  Platform,
  Pressable,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import api from "../lib/api";
import moment from "moment";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

type Issue = {
  serialNo: number;
  description: string;
  targetDate: string;
  responsibility: string;
  status: boolean;
  archResponseDate: string;
  remarks: string;
};

export default function ILRForm() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const { projectId, projectName } = useLocalSearchParams<{
    projectId: string;
    projectName: string;
  }>();

  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const fetchToken = async () => {
      const storedToken = await AsyncStorage.getItem("token");
      setToken(storedToken);
    };
    fetchToken();
  }, []);

  const [issues, setIssues] = useState<Issue[]>([
    {
      serialNo: 1,
      description: "",
      targetDate: "",
      responsibility: "",
      status: false,
      archResponseDate: "",
      remarks: "",
    },
  ]);

  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [selectedIssueIndex, setSelectedIssueIndex] = useState<number | null>(
    null
  );
  const [selectedField, setSelectedField] = useState<
    "targetDate" | "archResponseDate" | null
  >(null);

  const addIssue = () => {
    setIssues((prev) => [
      ...prev,
      {
        serialNo: prev.length + 1,
        description: "",
        targetDate: "",
        responsibility: "",
        status: false,
        archResponseDate: "",
        remarks: "",
      },
    ]);
  };

  const removeIssue = (index: number) => {
    setIssues((prev) =>
      prev
        .filter((_, i) => i !== index)
        .map((issue, idx) => ({ ...issue, serialNo: idx + 1 }))
    );
  };

  const updateIssue = <K extends keyof Issue>(
    index: number,
    field: K,
    value: Issue[K]
  ) => {
    const updatedIssues = [...issues];
    updatedIssues[index][field] = value;
    setIssues(updatedIssues);
  };

  const handleDateSelect = (event: any, selectedDate?: Date) => {
    if (selectedDate && selectedIssueIndex !== null && selectedField) {
      const formattedDate = moment(selectedDate).format("DD-MM-YYYY");
      updateIssue(selectedIssueIndex, selectedField, formattedDate);
    }
    setDatePickerVisible(false);
  };

  const openDatePicker = (
    index: number,
    field: "targetDate" | "archResponseDate"
  ) => {
    setSelectedIssueIndex(index);
    setSelectedField(field);
    setDatePickerVisible(true);
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View
        className="pt-16 px-4 pb-6 bg-white shadow-md"
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.25,
          shadowRadius: 4,
          elevation: 6,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          className="flex-row items-center"
        >
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
          <Text className="ml-4 text-xl font-semibold text-[#1E293B]">
            Back
          </Text>
        </Pressable>
      </View>

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
        <Text className="text-2xl py-4 font-extrabold text-gray-800 my-6 text-center">
         {projectName}  ILR
        </Text>

        {/* Project (readonly) */}
        {/* <View className="mb-6">
          <TextInput
            placeholder="Project Name"
            value={projectName}
            editable={false}
            className="border border-gray-300 rounded-xl px-4 py-3 bg-gray-100 text-base text-gray-700"
            placeholderTextColor="#999"
          />
        </View> */}

        {/* Issues Section */}
        {issues.map((issue, index) => (
          <View key={index} className="bg-white rounded-2xl p-4 shadow-sm mb-6">
            <Text className="font-bold text-lg text-blue-600 mb-4">
              Issue {issue.serialNo}
            </Text>

            <View className="gap-3">
              <TextInput
                placeholder="Issue Description"
                value={issue.description}
                onChangeText={(text) => updateIssue(index, "description", text)}
                className="border border-gray-200 rounded-lg px-3 mb-2 py-2 bg-gray-50 text-base"
                placeholderTextColor="#999"
              />

              <TouchableOpacity
                onPress={() => openDatePicker(index, "targetDate")}
              >
                <TextInput
                  placeholder="Target Date (DD-MM-YYYY)"
                  value={issue.targetDate}
                  editable={false}
                  pointerEvents="none"
                  className="border border-gray-200 rounded-lg px-3 mb-2 py-2 bg-gray-50 text-base text-gray-800"
                  placeholderTextColor="#999"
                />
              </TouchableOpacity>

              <TextInput
                placeholder="Responsibility"
                value={issue.responsibility}
                onChangeText={(text) =>
                  updateIssue(index, "responsibility", text)
                }
                className="border border-gray-200 rounded-lg px-3 mb-2 py-2 bg-gray-50 text-base"
                placeholderTextColor="#999"
              />

              <View className="flex-row items-center">
                <Text className="text-gray-700 font-medium">Status:</Text>
                <Switch
                  value={issue.status}
                  onValueChange={(val) => updateIssue(index, "status", val)}
                  className="ml-4"
                />
                <Text className="ml-2 text-sm text-gray-500">
                  {issue.status ? "Closed" : "Open"}
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => openDatePicker(index, "archResponseDate")}
              >
                <TextInput
                  placeholder="Arch Response Date (DD-MM-YYYY)"
                  value={issue.archResponseDate}
                  editable={false}
                  pointerEvents="none"
                  className="border border-gray-200 rounded-lg px-3 mb-2 py-2 bg-gray-50 text-base text-gray-800"
                  placeholderTextColor="#999"
                />
              </TouchableOpacity>

              <TextInput
                placeholder="Remarks"
                value={issue.remarks}
                onChangeText={(text) => updateIssue(index, "remarks", text)}
                className="border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 text-base"
                placeholderTextColor="#999"
              />
            </View>

            {issues.length > 1 && (
              <Pressable onPress={() => removeIssue(index)} className="pt-5">
                <Text className="text-red-500 font-medium text-lg">
                  Delete Issue
                </Text>
              </Pressable>
            )}
          </View>
        ))}

        {/* Add Issue Button */}
        <Pressable
          onPress={addIssue}
          className="bg-emerald-500 py-3 rounded-2xl mb-6 items-center active:scale-95"
          android_ripple={{ color: "rgba(255,255,255,0.2)" }}
        >
          <Text className="text-white font-semibold text-lg">+ Add Issue</Text>
        </Pressable>

        {/* Submit Button */}
        <Pressable
          // onPress={handleSubmit}
          className="bg-blue-600 py-4 rounded-2xl items-center active:scale-95"
          android_ripple={{ color: "rgba(255,255,255,0.2)" }}
        >
          <Text className="text-white font-bold text-lg">Submit ILR</Text>
        </Pressable>
      </KeyboardAwareScrollView>

      {/* Date Picker */}
      {datePickerVisible && (
        <DateTimePicker
          mode="date"
          value={new Date()}
          onChange={handleDateSelect}
        />
      )}
    </View>
  );
}
