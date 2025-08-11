import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useEffect, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useAuth } from "../../context/AuthContext"; // adjust path as needed
import api from "../../lib/api";

import moment from "moment";

type Issue = {
  serialNo: number;
  description: string;
  issueDate: string;
  responsibility: string;
  status: boolean;
  archResponseDate: string;
  remarks: string;
  //   location: string;
};

export default function ILRForm() {
  const { isAuthenticated } = useAuth();
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const fetchToken = async () => {
      const storedToken = await AsyncStorage.getItem("token");
      setToken(storedToken);
    };
    fetchToken();
  }, []);

  const [projectName, setProjectName] = useState("");
  const [month, setMonth] = useState("");
  const [issues, setIssues] = useState<Issue[]>([
    {
      serialNo: 1,
      description: "",
      issueDate: "",
      responsibility: "",
      status: false,
      archResponseDate: "",
      remarks: "",
      //   location: "",
    },
  ]);

  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [selectedIssueIndex, setSelectedIssueIndex] = useState<number | null>(
    null
  );
  const [selectedField, setSelectedField] = useState<
    "issueDate" | "archResponseDate" | null
  >(null);

  const addIssue = () => {
    setIssues((prev) => [
      ...prev,
      {
        serialNo: prev.length + 1,
        description: "",
        issueDate: "",
        responsibility: "",
        status: false,
        archResponseDate: "",
        remarks: "",
        location: "",
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
    field: "issueDate" | "archResponseDate"
  ) => {
    setSelectedIssueIndex(index);
    setSelectedField(field);
    setDatePickerVisible(true);
  };

  //   const handleSubmit = () => {
  //     const formData = {
  //       projectName,
  //       month,
  //       issues
  //     };
  //     console.log('Form Data:', formData);
  //     // API integration will be added later!
  //   };

  const handleSubmit = async () => {
    if (!projectName || !month || issues.length === 0) {
      Alert.alert(
        "Validation Error",
        "Please fill out all fields and add at least one issue."
      );
      return;
    }

    const formData = {
      projectName,
      month,
      issues,
    };

    for (const issue of issues) {
      if (!issue.description || !issue.issueDate || !issue.responsibility) {
        Alert.alert(
          "Validation Error",
          "Please fill all required issue fields."
        );
        return;
      }
    }

    try {
      const res = await api.post("/ilrs", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      Alert.alert("Success", "ILR submitted successfully!");
      console.log("ILR Response:", res.data);
      // optionally reset form here
    } catch (err: any) {
      console.error("ILR submission error:", err);
      Alert.alert(
        "Submission Failed",
        err?.response?.data?.message || "An error occurred."
      );
    }

    setProjectName("");
    setMonth("");
    setIssues([
      {
        serialNo: 1,
        description: "",
        issueDate: "",
        responsibility: "",
        status: false,
        archResponseDate: "",
        remarks: "",
        // location: "",
      },
    ]);

    console.log("Submitting ILR:", formData);
  };

  return (
    <>
      <KeyboardAwareScrollView
        contentContainerStyle={{ paddingVertical: 24 }}
        className="px-4 bg-gray-50"
        enableOnAndroid
        extraScrollHeight={Platform.OS === "ios" ? 100 : 150}
        keyboardShouldPersistTaps="handled"
      >
        <Text className="text-2xl font-extrabold text-gray-800 mb-6 text-center">
          Issue Log Register (ILR)
        </Text>

        {/* Project Details */}
        <View className="mb-6">
          <TextInput
            placeholder="Project Name"
            value={projectName}
            onChangeText={setProjectName}
            className="border border-gray-300 rounded-xl px-4 py-3 mb-4 bg-white text-base"
            placeholderTextColor="#999"
          />
          <TextInput
            placeholder="Month (e.g., August)"
            value={month}
            onChangeText={setMonth}
            className="border border-gray-300 rounded-xl px-4 py-3 bg-white text-base"
            placeholderTextColor="#999"
          />
        </View>

        {/* Issues Section */}
        {issues.map((issue, index) => (
          <View key={index} className="bg-white rounded-2xl p-4 shadow-md mb-6">
            <Text className="font-bold text-lg text-blue-600 mb-3">
              Issue {issue.serialNo}
            </Text>

            <TextInput
              placeholder="Issue Description"
              value={issue.description}
              onChangeText={(text) => updateIssue(index, "description", text)}
              className="border border-gray-200 rounded-lg px-3 py-2 mb-3 bg-gray-50 text-base"
              placeholderTextColor="#999"
            />

            <TouchableOpacity
              onPress={() => openDatePicker(index, "issueDate")}
            >
              <TextInput
                placeholder="Issue Date (DD-MM-YYYY)"
                value={issue.issueDate}
                editable={false}
                pointerEvents="none"
                className="border border-gray-200 rounded-lg px-3 py-2 mb-3 bg-gray-50 text-base text-gray-800"
                placeholderTextColor="#999"
              />
            </TouchableOpacity>

            <TextInput
              placeholder="Responsibility"
              value={issue.responsibility}
              onChangeText={(text) =>
                updateIssue(index, "responsibility", text)
              }
              className="border border-gray-200 rounded-lg px-3 py-2 mb-3 bg-gray-50 text-base"
              placeholderTextColor="#999"
            />

            <View className="flex-row items-center mb-3">
              <Text className="text-gray-700">Status:</Text>
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
                className="border border-gray-200 rounded-lg px-3 py-2 mb-3 bg-gray-50 text-base text-gray-800"
                placeholderTextColor="#999"
              />
            </TouchableOpacity>

            <TextInput
              placeholder="Remarks"
              value={issue.remarks}
              onChangeText={(text) => updateIssue(index, "remarks", text)}
              className="border border-gray-200 rounded-lg px-3 py-2 mb-3 bg-gray-50 text-base"
              placeholderTextColor="#999"
            />

            {issues.length > 1 && (
              <Pressable onPress={() => removeIssue(index)} className="mt-2">
                <Text className="text-red-500 font-medium">Delete Issue</Text>
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

      {/* Date Picker Modal */}
      {datePickerVisible && (
        <DateTimePicker
          mode="date"
          value={new Date()}
          onChange={handleDateSelect}
        />
      )}
    </>
  );
}
