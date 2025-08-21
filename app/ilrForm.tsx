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

type Issue = {
  serialNo: number;
  description: string;
  targetDate: string;
  responsibility: string[]; // ✅ make it array for multi-select
  remarks: string;
};

export default function ILRForm() {
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
      responsibility: [],
      remarks: "",
    },
  ]);

  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [selectedIssueIndex, setSelectedIssueIndex] = useState<number | null>(
    null
  );

  // ✅ Add Issue
  const addIssue = () => {
    setIssues((prev) => [
      ...prev,
      {
        serialNo: prev.length + 1,
        description: "",
        targetDate: "",
        responsibility: [],
        remarks: "",
      },
    ]);
  };

  // ✅ Remove Issue
  const removeIssue = (index: number) => {
    setIssues((prev) =>
      prev
        .filter((_, i) => i !== index)
        .map((issue, idx) => ({ ...issue, serialNo: idx + 1 }))
    );
  };

  // ✅ Update Issue field
  const updateIssue = <K extends keyof Issue>(
    index: number,
    field: K,
    value: Issue[K]
  ) => {
    const updatedIssues = [...issues];
    updatedIssues[index][field] = value;
    setIssues(updatedIssues);
  };

  // ✅ Handle Date Selection
  const handleDateSelect = (event: any, selectedDate?: Date) => {
    if (selectedDate && selectedIssueIndex !== null) {
      const formattedDate = moment(selectedDate).format("YYYY-MM-DD"); // backend-friendly
      updateIssue(selectedIssueIndex, "targetDate", formattedDate);
    }
    setDatePickerVisible(false);
  };

  const openDatePicker = (index: number) => {
    setSelectedIssueIndex(index);
    setDatePickerVisible(true);
  };

  // ✅ Handle Submit (send each issue separately)
  const handleSubmit = async () => {
    // Close keyboard immediately when button is pressed
    Keyboard.dismiss();
    try {
      if (!token) {
        Toast.show({
          type: "error",
          text1: "Authentication Error",
          text2: "User not authenticated",
          position: "bottom",
        });
        return;
      }

      // 🔹 Validate each issue before submitting
      for (const issue of issues) {
        if (
          !issue.description.trim() ||
          !issue.targetDate ||
          !issue.responsibility.length
        ) {
          Toast.show({
            type: "error",
            text1: "Validation Error",
            text2: "Please fill all required fields for every issue.",
            position: "bottom",
          });
          return; // stop submission
        }
      }

      for (const issue of issues) {
        await api.post(
          "/ilrs",
          {
            projectId,
            description: issue.description,
            targetDate: new Date(issue.targetDate), // ensure Date object
            responsibility: issue.responsibility,
            remarks: issue.remarks,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      }

      Toast.show({
        type: "success",
        text1: "Success",
        text2: "ILRs created successfully!",
        position: "bottom",
      });

      setIssues([
        {
          serialNo: 1,
          description: "",
          targetDate: "",
          responsibility: [],
          remarks: "",
        },
      ]);

      router.back();
    } catch (error: any) {
      console.log("ILR Submit Error:", error); // log full error
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error.response?.data?.message || "Something went wrong",
        position: "bottom",
      });
    }
  };

  const [users, setUsers] = useState<{ label: string; value: string }[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // 🔹 Fetch users assigned to this project
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        if (!token || !projectId) return;
        setLoadingUsers(true);

        const res = await api.get(`/user-directory/${projectId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        // 🔹 Format for dropdown
        const formatted = res.data.map((u: any) => ({
          label: `${u.individualName} (${u.designation})`,
          value: u._id,
        }));

        setUsers(formatted);
      } catch (err) {
        console.error("Error fetching users:", err);
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Unable to fetch users for responsibility dropdown.",
          position: "bottom",
        });
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchUsers();
  }, [token, projectId]);

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
        <Text className="text-2xl py-4 font-extrabold text-gray-800 my-2 text-center">
          {projectName} ILR
        </Text>

        {/* Issues Section */}
        {issues.map((issue, index) => (
          <View key={index} className="bg-white rounded-2xl p-4 shadow-sm mb-6">
            <Text className="font-bold text-lg text-blue-600 mb-4">
              Issue {issue.serialNo}
            </Text>

            <View className="gap-1">
              <TextInput
                placeholder="Issue Description"
                value={issue.description}
                onChangeText={(text) => updateIssue(index, "description", text)}
                className="border border-gray-200 rounded-lg px-3 mb-2 py-2 bg-gray-50 text-base"
                placeholderTextColor="#999"
              />

              <TouchableOpacity onPress={() => openDatePicker(index)}>
                <TextInput
                  placeholder="Target Date (DD-MM-YYYY)"
                  value={
                    issue.targetDate
                      ? new Date(issue.targetDate).toLocaleDateString("en-GB") // ✅ formats as DD/MM/YYYY
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
                value={issue.responsibility} // ✅ bind to issue state
                placeholder="Select responsible users"
                searchPlaceholder="Search..."
                onChange={
                  (items) => updateIssue(index, "responsibility", items) // ✅ save array
                }
              />

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
          onPress={handleSubmit}
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
