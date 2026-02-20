import {
  ArrowDown01Icon,
  ArrowLeft01Icon,
  MinusSignCircleIcon,
  PlusSignCircleIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
// import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import moment from "moment";
import { useContext, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Keyboard,
  LayoutAnimation,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
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

  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";

  const auth = useContext(AuthContext);
  const token = auth?.token;

  const [collapsedIndices, setCollapsedIndices] = useState<number[]>([]);

  const toggleCollapse = (index: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setCollapsedIndices((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index],
    );
  };

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

      // Clear image store and draft storage
      clearAll();
      await AsyncStorage.removeItem(`ilr_form_${projectId}`);
      await AsyncStorage.removeItem(`ilr_images_${projectId}`);

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

  // Add this new state
  const [dataLoaded, setDataLoaded] = useState(false);

  // Load ILR form data and images when projectId changes
  useEffect(() => {
    if (!projectId) return;
    const loadDraft = async () => {
      try {
        // Load issues
        const savedIssues = await AsyncStorage.getItem(`ilr_form_${projectId}`);
        if (savedIssues) {
          const parsed = JSON.parse(savedIssues);
          if (Array.isArray(parsed)) {
            setIssues(parsed);
          }
        }

        // Load images into Zustand store
        const savedImages = await AsyncStorage.getItem(
          `ilr_images_${projectId}`,
        );
        if (savedImages) {
          const parsedImages = JSON.parse(savedImages);
          // Only populate if store is currently empty for this project to avoid overwrites
          Object.entries(parsedImages).forEach(([idx, uris]) => {
            const index = Number(idx);
            const currentUris =
              useTempImageStore.getState().images[index] || [];
            (uris as string[]).forEach((uri) => {
              if (!currentUris.includes(uri)) {
                useTempImageStore.getState().addImageToIssue(index, uri);
              }
            });
          });
        }
      } catch (error) {
        console.log("Error loading draft data:", error);
      } finally {
        setDataLoaded(true);
      }
    };
    loadDraft();
  }, [projectId]);

  // Save issues and images whenever they change
  useEffect(() => {
    if (!projectId || !dataLoaded) return;
    const saveDraft = async () => {
      try {
        await AsyncStorage.setItem(
          `ilr_form_${projectId}`,
          JSON.stringify(issues),
        );
        await AsyncStorage.setItem(
          `ilr_images_${projectId}`,
          JSON.stringify(images),
        );
      } catch (error) {
        console.log("Error saving draft data:", error);
      }
    };
    saveDraft();
  }, [issues, images, projectId, dataLoaded]);

  return (
    <View className={`flex-1 ${isDarkMode ? "bg-black" : "bg-white"}`}>
      {/* Header */}
      <View
        className={`pt-16 pb-4 px-4 flex-row items-center ${isDarkMode ? "bg-black" : "bg-white"}`}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          className="p-2"
          activeOpacity={0.7}
        >
          <HugeiconsIcon
            icon={ArrowLeft01Icon}
            size={24}
            color={isDarkMode ? "#FFF" : "#000"}
          />
        </TouchableOpacity>
        <Text
          className={`text-[20px] font-dmSemiBold ml-2 ${isDarkMode ? "text-white" : "text-black"}`}
        >
          Create ILR
        </Text>
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
        {/* Issues Section */}
        {issues.map((issue, index) => {
          const isCollapsed = collapsedIndices.includes(index);
          return (
            <View
              key={index}
              className={`rounded-3xl mb-6 ${isDarkMode ? "bg-[#1A1A1A]" : "bg-white"}`}
              style={{
                borderWidth: 1,
                borderColor: isDarkMode ? "#333" : "#E5E7EB",
                overflow: "hidden",
              }}
            >
              {/* Issue Header/Title */}
              <TouchableOpacity
                onPress={() => toggleCollapse(index)}
                activeOpacity={0.8}
                className={`flex-row items-center justify-between px-5 py-5 ${
                  !isCollapsed
                    ? isDarkMode
                      ? "border-b border-[#333]"
                      : "border-b border-gray-100"
                    : ""
                }`}
              >
                <Text
                  className={`font-semibold text-lg ${isDarkMode ? "text-white" : "text-gray-700"}`}
                >
                  Issue {issue.serialNo}
                </Text>
                <HugeiconsIcon
                  icon={isCollapsed ? ArrowDown01Icon : ArrowDown01Icon} // design shows chevron-down for both, wait, image shows down arrow
                  size={20}
                  color={isDarkMode ? "#9CA3AF" : "#9CA3AF"}
                  style={{
                    transform: [{ rotate: isCollapsed ? "0deg" : "180deg" }],
                  }}
                />
              </TouchableOpacity>

              {!isCollapsed && (
                <View
                  className={`p-4 gap-3 ${isDarkMode ? "bg-[#111]" : "bg-white"}`}
                >
                  <TextInput
                    placeholder="e.g. Describe the title"
                    value={issue.description}
                    onChangeText={(text) =>
                      updateIssue(index, "description", text)
                    }
                    className={`rounded-2xl px-4 py-4 text-base ${
                      isDarkMode
                        ? "bg-black text-white"
                        : "bg-gray-100 text-gray-800"
                    }`}
                    placeholderTextColor={isDarkMode ? "#4B5563" : "#6B7280"}
                  />

                  {/* Assignee MultiSelect */}
                  <MultiSelect
                    style={{
                      height: 56,
                      backgroundColor: isDarkMode ? "black" : "#F3F4F6",
                      borderRadius: 16,
                      paddingHorizontal: 16,
                    }}
                    placeholderStyle={{
                      fontSize: 16,
                      color: isDarkMode ? "#4B5563" : "#6B7280",
                    }}
                    selectedTextStyle={{
                      fontSize: 14,
                      color: isDarkMode ? "white" : "#1F2937",
                    }}
                    selectedStyle={{
                      borderRadius: 12,
                      backgroundColor: isDarkMode ? "#333" : "#E5E7EB",
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                    }}
                    containerStyle={{
                      borderRadius: 16,
                      marginTop: 8,
                      backgroundColor: isDarkMode ? "#1A1A1A" : "white",
                      borderColor: isDarkMode ? "#333" : "#E5E7EB",
                    }}
                    itemTextStyle={{ color: isDarkMode ? "white" : "black" }}
                    activeColor={isDarkMode ? "#333" : "#F3F4F6"}
                    inputSearchStyle={{ fontSize: 16 }}
                    search
                    labelField="label"
                    valueField="value"
                    data={users}
                    value={(issue.responsibility || []).map((r) => r._id)}
                    placeholder="Assignee"
                    searchPlaceholder="Search..."
                    onChange={(selectedIds: string[]) => {
                      const selectedObjects = users
                        .filter((u) => selectedIds.includes(u.value))
                        .map((u) => ({ _id: u.value, name: u.label }));
                      updateIssue(index, "responsibility", selectedObjects);
                    }}
                    renderRightIcon={() => (
                      <HugeiconsIcon
                        icon={ArrowDown01Icon}
                        size={20}
                        color="#9CA3AF"
                      />
                    )}
                  />

                  <TouchableOpacity onPress={() => openDatePicker(index)}>
                    <View
                      className={`flex-row items-center justify-between rounded-2xl px-4 py-4 ${
                        isDarkMode ? "bg-black" : "bg-gray-100"
                      }`}
                    >
                      <Text
                        className={`text-base ${
                          issue.targetDate
                            ? isDarkMode
                              ? "text-white"
                              : "text-gray-800"
                            : isDarkMode
                              ? "#4B5563"
                              : "text-gray-500"
                        }`}
                        style={{
                          color:
                            !issue.targetDate && isDarkMode
                              ? "#4B5563"
                              : undefined,
                        }}
                      >
                        {issue.targetDate
                          ? moment(issue.targetDate).format("DD-MM-YYYY")
                          : "DD-MM-YYYY"}
                      </Text>
                      <Ionicons
                        name="calendar-outline"
                        size={20}
                        color="#9CA3AF"
                      />
                    </View>
                  </TouchableOpacity>

                  <TextInput
                    placeholder="e.g. Describe the issue"
                    value={issue.remarks}
                    onChangeText={(text) => updateIssue(index, "remarks", text)}
                    className={`rounded-2xl px-4 py-4 text-base ${
                      isDarkMode
                        ? "bg-black text-white"
                        : "bg-gray-100 text-gray-800"
                    }`}
                    placeholderTextColor={isDarkMode ? "#4B5563" : "#6B7280"}
                    multiline
                    numberOfLines={4}
                    style={{ textAlignVertical: "top", minHeight: 120 }}
                  />

                  {/* Image Picker Section */}
                  <View className="mt-4">
                    <View
                      className={`rounded-2xl p-8 items-center justify-center border-dashed border-2 ${
                        isDarkMode
                          ? "bg-black border-[#333]"
                          : "bg-gray-100 border-gray-200"
                      }`}
                      style={{ minHeight: 160 }}
                    >
                      <TouchableOpacity
                        onPress={() => pickImage(index)}
                        className={`rounded-xl px-6 py-3 flex-row items-center mb-2 ${
                          isDarkMode ? "bg-[#1A1A1A]" : "bg-black"
                        }`}
                        activeOpacity={0.8}
                      >
                        <Ionicons
                          name="arrow-up-outline"
                          size={20}
                          color="white"
                        />
                        <Text className="text-white font-semibold ml-2">
                          Upload
                        </Text>
                      </TouchableOpacity>
                      <Text className="text-gray-500 font-medium">
                        Choose Image
                      </Text>
                    </View>

                    {/* Camera Option */}
                    <TouchableOpacity
                      onPress={() => takePhoto(index)}
                      className={`absolute top-2 right-2 p-2 rounded-full shadow-sm ${
                        isDarkMode ? "bg-[#1A1A1A]" : "bg-white"
                      }`}
                    >
                      <Ionicons
                        name="camera"
                        size={20}
                        color={isDarkMode ? "#9CA3AF" : "#6B7280"}
                      />
                    </TouchableOpacity>

                    {/* Image Thumbnails */}
                    {(images[index] || []).length > 0 && (
                      <View className="flex-row flex-wrap gap-3 mt-4">
                        {images[index].map((uri, imgIdx) => (
                          <View key={imgIdx} className="relative">
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
                              activeOpacity={0.8}
                            >
                              <Image
                                source={{ uri }}
                                style={{
                                  width: 80,
                                  height: 80,
                                  borderRadius: 16,
                                }}
                              />
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={() => deleteImage(index, uri)}
                              className={`absolute -top-2 -right-2 rounded-full p-1 shadow-md border ${
                                isDarkMode
                                  ? "bg-[#1A1A1A] border-[#333]"
                                  : "bg-white border-gray-100"
                              }`}
                              style={{ zIndex: 10 }}
                            >
                              <Ionicons
                                name="close"
                                size={14}
                                color="#EF4444"
                              />
                            </TouchableOpacity>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>

                  {/* Remove Issue Button */}
                  {issues.length > 1 && (
                    <TouchableOpacity
                      onPress={() => removeIssue(index)}
                      className="mt-6 flex-row items-center justify-end"
                    >
                      <HugeiconsIcon
                        icon={MinusSignCircleIcon}
                        size={24}
                        color="#EF4444"
                      />
                      <Text
                        className={`font-dmSemiBold text-base ml-2 ${
                          isDarkMode ? "text-white" : "text-black"
                        }`}
                      >
                        Remove
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          );
        })}

        {/* Add Issue Button */}
        <TouchableOpacity
          onPress={addIssue}
          className={`py-4 rounded-2xl mb-4 flex-row items-center justify-center ${
            isDarkMode ? "bg-[#1A1A1A]" : "bg-gray-100"
          }`}
          activeOpacity={0.7}
        >
          <HugeiconsIcon
            icon={PlusSignCircleIcon}
            size={22}
            color={isDarkMode ? "white" : "black"}
          />
          <Text
            className={`font-dmSemiBold text-base ml-2 ${isDarkMode ? "text-white" : "text-black"}`}
          >
            Add Issue
          </Text>
        </TouchableOpacity>

        {/* Submit Button */}
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={saving}
          className={`py-4 rounded-2xl items-center mb-10 ${
            saving ? "bg-gray-400" : ""
          }`}
          style={{
            backgroundColor: saving
              ? "#9CA3AF"
              : isDarkMode
                ? "#7C3AED" // Purple for dark mode
                : "#6366F1", // Indigo for light mode
          }}
          activeOpacity={0.8}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text className="text-white font-dmSemiBold text-lg">Submit</Text>
          )}
        </TouchableOpacity>
      </KeyboardAwareScrollView>

      {/* Date Picker */}
      <DateTimePickerModal
        isVisible={datePickerVisible}
        mode="date"
        date={
          selectedIssueIndex !== null && issues[selectedIssueIndex]?.targetDate
            ? new Date(issues[selectedIssueIndex].targetDate)
            : new Date()
        }
        onConfirm={(date) => {
          setDatePickerVisible(false);
          setSelectedIssueIndex(null);

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
        isDarkModeEnabled={isDarkMode}
      />
    </View>
  );
};

export default ILRForm;
