import AsyncStorage from "@react-native-async-storage/async-storage";
// import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import moment from "moment";
import { useContext, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Keyboard,
  Platform,
  Pressable,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { MultiSelect } from "react-native-element-dropdown";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import Toast from "react-native-toast-message";
import { AuthContext } from "../context/AuthContext";
import api from "../lib/api";
import { useTempImageStore } from "../store/tempImageStore";

type Responsibility = {
  _id: string;
  name: string;
};

type Issue = {
  serialNo: number;
  description: string;
  targetDate: string;
  originalTargetDate: string;
  responsibility: Responsibility[]; // now array of objects
  remarks: string;
};

const ILRForm = () => {
  const router = useRouter();
  const { projectId, projectName } = useLocalSearchParams<{
    projectId: string;
    projectName: string;
  }>();

  const auth = useContext(AuthContext);
  const token = auth?.token;

  // const [token, setToken] = useState<string | null>(null);

  // useEffect(() => {
  //   const fetchToken = async () => {
  //     const storedToken = await AsyncStorage.getItem("token");
  //     setToken(storedToken);
  //   };
  //   fetchToken();
  // }, []);

  const [issues, setIssues] = useState<Issue[]>([
    {
      serialNo: 1,
      description: "",
      targetDate: "",
      responsibility: [],
      remarks: "",
      originalTargetDate: "", // baseline date
    },
  ]);

  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [selectedIssueIndex, setSelectedIssueIndex] = useState<number | null>(
    null,
  );

  // Add Issue
  const addIssue = () => {
    setIssues((prev) => [
      ...prev,
      {
        serialNo: prev.length + 1,
        description: "",
        targetDate: "",
        responsibility: [],
        originalTargetDate: "", // baseline date
        remarks: "",
      },
    ]);
  };

  // Remove Issue
  const removeIssue = (index: number) => {
    setIssues((prev) =>
      prev
        .filter((_, i) => i !== index)
        .map((issue, idx) => ({ ...issue, serialNo: idx + 1 })),
    );

    // Shift images in store to keep them aligned with issue indexes
    const currentImages = { ...useTempImageStore.getState().images };
    const newImages: { [key: number]: string[] } = {};

    // Build new images object
    let newIndex = 0;
    for (
      let i = 0;
      i <= Math.max(...Object.keys(currentImages).map(Number));
      i++
    ) {
      if (i === index) continue; // Skip deleted
      if (currentImages[i]) {
        newImages[newIndex] = currentImages[i];
      }
      newIndex++;
    }

    // Apply changes using clearAll and adding them back
    clearAll();
    Object.entries(newImages).forEach(([idx, uris]) => {
      uris.forEach((uri) =>
        useTempImageStore.getState().addImageToIssue(Number(idx), uri),
      );
    });
  };

  // Update Issue field
  const updateIssue = <K extends keyof Issue>(
    index: number,
    field: K,
    value: Issue[K],
  ) => {
    const updatedIssues = [...issues];
    updatedIssues[index][field] = value;
    setIssues(updatedIssues);
  };

  // Handle Date Selection
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

  const { images, addImageToIssue, removeImageFromIssue, clearAll } =
    useTempImageStore();

  const pickImage = async (index: number) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"], // ✅ string-based — works universally
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      result.assets.forEach((asset) => {
        addImageToIssue(index, asset.uri);
      });
    }
  };

  const takePhoto = async (index: number) => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      alert("Permission to access camera was denied");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      addImageToIssue(index, asset.uri);
    }
  };

  const deleteImage = (issueIndex: number, imageUri: string) => {
    removeImageFromIssue(issueIndex, imageUri);
  };

  const [saving, setSaving] = useState(false);

  // Handle Submit (send each issue separately)
  const handleSubmit = async () => {
    if (saving) return; // prevent double submit
    setSaving(true);
    // Close keyboard immediately when button is pressed
    Keyboard.dismiss();
    try {
      if (!token || !projectId) {
        Toast.show({
          type: "error",
          text1: "Authentication Error",
          text2: "User not authenticated",
          position: "bottom",
        });
        setSaving(false);
        return;
      }

      // 🔹 Validate each issue before submitting
      for (const issue of issues) {
        if (
          !issue.description.trim() ||
          !issue.targetDate ||
          !issue.responsibility.length ||
          !issue.remarks.trim()
        ) {
          Toast.show({
            type: "error",
            text1: "Validation Error",
            text2: "Please fill all required fields for every issue.",
            position: "bottom",
          });
          setSaving(false);
          return; // stop submission
        }
      }

      for (let index = 0; index < issues.length; index++) {
        const issue = issues[index];
        const formData = new FormData();
        formData.append("projectId", projectId);
        formData.append("description", issue.description);
        formData.append(
          "originalTargetDate",
          new Date(issue.originalTargetDate || issue.targetDate).toISOString(),
        );
        formData.append("targetDate", new Date(issue.targetDate).toISOString());
        formData.append("responsibility", JSON.stringify(issue.responsibility));
        formData.append("remarks", issue.remarks);

        // Add attachments from Zustand store
        const issueImages = images[index] || [];
        for (let i = 0; i < issueImages.length; i++) {
          const uri = issueImages[i];
          const fileName = uri.split("/").pop();
          const match = /\.(\w+)$/.exec(fileName || "");
          const type = match ? `image/${match[1]}` : `image`;

          formData.append("files", {
            uri,
            name: fileName || `image_${i}.jpg`,
            type: type,
          } as any);
        }

        await api.post("/ilrs", formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        });
      }

      Toast.show({
        type: "success",
        text1: "Success",
        text2: "ILRs created successfully!",
        position: "bottom",
      });

      // Clear image store
      clearAll();

      setIssues([
        {
          serialNo: 1,
          description: "",
          targetDate: "",
          originalTargetDate: "", // baseline date
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
    } finally {
      setSaving(false);
    }
  };

  const [users, setUsers] = useState<{ label: string; value: string }[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // 🔹 Fetch users assigned to this project
  useEffect(() => {
    if (!token || !projectId) return; // guard

    const fetchUsers = async () => {
      try {
        const res = await api.get(`/projects/${projectId}/users-dropdown`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const formatted = res.data.map((u: any) => ({
          label: `${u.individualName} (${u.firmName})`,
          value: u._id,
        }));

        setUsers(formatted);
      } catch (err) {
        console.error("Error fetching users:", err);
      }
    };

    fetchUsers();
  }, [projectId]);

  const STORAGE_KEY = `ilr_form_${projectId}`;
  // Add this new state
  const [dataLoaded, setDataLoaded] = useState(false);

  // Load ILR form data when projectId changes
  useEffect(() => {
    if (!projectId) return;
    const loadFormData = async () => {
      try {
        const savedData = await AsyncStorage.getItem(`ilr_form_${projectId}`);
        if (savedData) {
          const parsedData = JSON.parse(savedData);
          if (Array.isArray(parsedData)) {
            setIssues(parsedData);
          }
        }
      } catch (error) {
        console.log("Error loading ILR data:", error);
      } finally {
        setDataLoaded(true); // mark loaded
      }
    };
    loadFormData();
  }, [projectId]);

  useEffect(() => {
    if (!projectId) return; // ✅ guard
    const saveFormData = async () => {
      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(issues));
      } catch (error) {
        console.log("Error saving ILR data:", error);
      }
    };
    saveFormData();
  }, [issues]);

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <LinearGradient colors={["#6366F1", "#8B5CF6"]}>
        <View
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
              Create ILR
            </Text>
          </TouchableOpacity>
        </View>
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
          {projectName || ""} ILR
        </Text>

        {/* Issues Section */}
        {issues.map((issue, index) => (
          <View key={index} className="bg-white rounded-2xl p-4 shadow-sm mb-6">
            <Text className="font-bold text-lg text-blue-600 mb-4">
              Issue {issue.serialNo}
            </Text>

            <View className="gap-1">
              <TextInput
                placeholder="Issue Title *"
                value={issue.description}
                onChangeText={(text) => updateIssue(index, "description", text)}
                className="border border-gray-200 rounded-lg px-3 mb-2 py-2 bg-gray-50 text-base"
                placeholderTextColor="#999"
                multiline
              />

              <TouchableOpacity onPress={() => openDatePicker(index)}>
                <TextInput
                  placeholder="Target Date (DD-MM-YYYY) *"
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

              {/* Date Picker Modal */}
              {/* <DateTimePickerModal
                isVisible={datePickerVisible}
                mode="date"
                date={new Date()}
                onConfirm={(date) => {
                  setDatePickerVisible(false);
                  handleDateSelect({ type: "set" }, date);
                }}
                onCancel={() => setDatePickerVisible(false)}
              /> */}

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
                selectedTextStyle={{ fontSize: 12, color: "#0B0B0B" }}
                selectedStyle={{
                  borderRadius: 10,
                  backgroundColor: "#b9EBF1",
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
                value={(issue.responsibility || []).map((r) => r._id)} // array of IDs
                placeholder="Select responsible users *"
                searchPlaceholder="Search..."
                onChange={(selectedIds: string[]) => {
                  const selectedObjects = users
                    .filter((u) => selectedIds.includes(u.value))
                    .map((u) => ({ _id: u.value, name: u.label })); // full objects
                  updateIssue(index, "responsibility", selectedObjects);
                }}
              />
              <TextInput
                placeholder="Issue Description *"
                value={issue.remarks}
                onChangeText={(text) => updateIssue(index, "remarks", text)}
                className="border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 text-base mb-2"
                placeholderTextColor="#999"
                multiline
              />

              {/* Image Picker Buttons */}
              <View className="flex-row justify-between my-4">
                <TouchableOpacity
                  onPress={() => takePhoto(index)}
                  className="flex-1 flex-row items-center justify-center bg-indigo-100 py-3 rounded-xl mr-2"
                >
                  <Ionicons name="camera" size={20} color="#4F46E5" />
                  <Text className="ml-2 text-indigo-600 font-semibold">
                    Camera
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => pickImage(index)}
                  className="flex-1 flex-row items-center justify-center bg-indigo-100 py-3 rounded-xl"
                >
                  <Ionicons name="images" size={20} color="#4F46E5" />
                  <Text className="ml-2 text-indigo-600 font-semibold">
                    Gallery
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Image Thumbnails */}
              <View className="flex-row flex-wrap gap-3">
                {(images[index] || []).map((uri, imgIdx) => (
                  <View key={imgIdx} className="relative">
                    <Image
                      source={{ uri }}
                      style={{ width: 85, height: 85, borderRadius: 12 }}
                    />
                    <TouchableOpacity
                      onPress={() => deleteImage(index, uri)}
                      className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1 shadow-sm"
                    >
                      <Ionicons name="close" size={16} color="white" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() =>
                        router.push({
                          pathname: "/annotateImage",
                          params: {
                            imageUri: uri,
                            issueIndex: index.toString(),
                          },
                        })
                      }
                      className="absolute -bottom-1 -right-1 bg-blue-600 rounded-full p-2 shadow-md"
                    >
                      <Ionicons name="pencil" size={14} color="white" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>

            {issues.length > 1 && (
              <Pressable
                onPress={() => removeIssue(index)}
                className="pt-5 flex-row items-center"
              >
                <Ionicons name="trash-outline" size={20} color="#EF4444" />
                <Text className="text-red-500 font-medium text-lg ml-2">
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
          disabled={saving}
          android_ripple={{ color: "rgba(255,255,255,0.2)" }}
          className={`py-4 rounded-2xl items-center mb-20
    ${saving ? "bg-gray-400" : "bg-blue-700"}
  `}
          style={({ pressed }) => [
            { transform: [{ scale: pressed ? 0.97 : 1 }] },
          ]}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text className="text-white font-bold text-lg">Submit ILR</Text>
          )}
        </Pressable>
      </KeyboardAwareScrollView>

      {/* Date Picker */}
      {/* {datePickerVisible && (
        <DateTimePicker
          mode="date"
          value={new Date()}
          onChange={handleDateSelect}
        />
      )} */}

      <DateTimePickerModal
        isVisible={datePickerVisible}
        mode="date"
        date={
          selectedIssueIndex !== null && issues[selectedIssueIndex]?.targetDate
            ? new Date(issues[selectedIssueIndex].targetDate)
            : new Date()
        }
        onConfirm={(date) => {
          // Close picker FIRST
          setDatePickerVisible(false);
          setSelectedIssueIndex(null);

          // Small delay ensures modal is gone
          setTimeout(() => {
            if (moment(date).isBefore(moment(), "day")) {
              Toast.show({
                type: "error",
                text1: "Invalid Date",
                text2: "Target date cannot be in the past",
                position: "bottom",
              });
              return;
            }

            if (selectedIssueIndex !== null) {
              const formattedDate = moment(date).format("YYYY-MM-DD");
              updateIssue(selectedIssueIndex, "targetDate", formattedDate);
            }
          }, 150);
        }}
        onCancel={() => {
          setDatePickerVisible(false);
          setSelectedIssueIndex(null);
        }}
      />
    </View>
  );
};

export default ILRForm;
