import {
  ArrowDown01Icon,
  ArrowLeft01Icon,
  Calendar03Icon,
  Cancel01Icon,
  Delete03Icon,
  MinusSignCircleIcon,
  PlusSignCircleIcon,
  Upload01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
// import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
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
import Modal from "react-native-modal";
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
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [issueIndexToDelete, setIssueIndexToDelete] = useState<number | null>(
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
    <View className={`flex-1 ${isDarkMode ? "bg-black" : "bg-[#FBFCFD]"}`}>
      {/* Header */}
      <View
        className={`pt-14 pb-4 px-2 flex-row items-center ${isDarkMode ? "bg-black" : "bg-[#FBFCFD]"}`}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          className="p-2"
          activeOpacity={0.7}
        >
          <HugeiconsIcon
            icon={ArrowLeft01Icon}
            size={24}
            color={isDarkMode ? "#D2D2D2" : "#454545"}
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
              className={`rounded-xl mb-3 ${isDarkMode ? "bg-[#1A1A1A]" : "bg-white"}`}
              style={{
                borderWidth: 1,
                borderColor: isDarkMode ? "#262626" : "#E0E5EB",
                overflow: "hidden",
              }}
            >
              {/* Issue Header/Title */}
              <TouchableOpacity
                onPress={() => toggleCollapse(index)}
                activeOpacity={0.8}
                className={`flex-row items-center justify-between px-4 py-3 ${
                  !isCollapsed
                    ? isDarkMode
                      ? "border-b border-[#262626]"
                      : "border-b border-[#E0E5EB]"
                    : ""
                }`}
              >
                <Text
                  className={`font-poppinsMedium  ${isDarkMode ? "text-[#919191]" : "text-[#454545]"}`}
                >
                  Issue {issue.serialNo}
                </Text>
                <HugeiconsIcon
                  icon={isCollapsed ? ArrowDown01Icon : ArrowDown01Icon} // design shows chevron-down for both, wait, image shows down arrow
                  size={20}
                  color={isDarkMode ? "#454545" : "#919191"}
                  style={{
                    transform: [{ rotate: isCollapsed ? "0deg" : "180deg" }],
                  }}
                />
              </TouchableOpacity>

              {!isCollapsed && (
                <View
                  className={`py-4 px-3 gap-2 ${isDarkMode ? "bg-[#1A1A1A]" : "bg-white"}`}
                >
                  <TextInput
                    placeholder="e.g. Describe the title"
                    value={issue.description}
                    onChangeText={(text) =>
                      updateIssue(index, "description", text)
                    }
                    className={`rounded-xl px-4 py-4 font-poppins text-base ${
                      isDarkMode
                        ? "bg-black text-white"
                        : "bg-[#F0F3F7] text-gray-800"
                    }`}
                    placeholderTextColor={isDarkMode ? "#919191" : "#454545"}
                  />

                  {/* Assignee MultiSelect */}
                  <MultiSelect
                    style={{
                      minHeight: 48,
                      backgroundColor:isDarkMode ? "#000000" : "#F0F3F7",
                      borderRadius: 11,
                      paddingHorizontal: 16,
                    }}
                    placeholderStyle={{
                      fontSize: 14,
                      fontFamily: "Poppins_400Regular",
                      color: isDarkMode ? "#919191" : "#454545",
                    }}
                    selectedTextStyle={{
                      fontSize: 14,
                      fontFamily: "Poppins_400Regular",
                      color: isDarkMode ? "#FFFFFF" : "#000000",
                    }}
                    selectedStyle={{
                      borderRadius: 10,
                      backgroundColor: isDarkMode ? "#2D3748" : "#E2E8F0",
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      marginRight: 4,
                      marginTop: 4,
                      borderWidth: 0,
                    }}
                    containerStyle={{
                      borderRadius: 16,
                      backgroundColor: isDarkMode ? "#000000" : "#FFFFFF",
                      borderWidth: 0,
                    }}
                    itemTextStyle={{
                      fontSize: 14,
                      fontFamily: "Poppins_400Regular",
                      color: isDarkMode ? "#FFFFFF" : "#000000",
                    }}
                    activeColor={isDarkMode ? "#252525" : "#F3F4F6"}
                    inputSearchStyle={{
                      backgroundColor: isDarkMode ? "#1A1A1A" : "#F0F3F7",
                      borderRadius: 14,
                      borderColor: "grey",
                      fontSize: 14,
                      color: isDarkMode ? "#FFFFFF" : "#000000",
                    }}
                    searchPlaceholderTextColor={
                      isDarkMode ? "#919191" : "#454545"
                    }
                    search
                    labelField="label"
                    valueField="value"
                    data={users}
                    value={(issue.responsibility || []).map((r) => r._id)}
                    placeholder="Assignee"
                    searchPlaceholder="Search users..."
                    visibleSelectedItem={false}
                    onChange={(selectedIds: string[]) => {
                      const selectedObjects = users
                        .filter((u) => selectedIds.includes(u.value))
                        .map((u) => ({ _id: u.value, name: u.label }));
                      updateIssue(index, "responsibility", selectedObjects);
                    }}
                    renderRightIcon={() => (
                      <HugeiconsIcon
                        icon={ArrowDown01Icon}
                        size={18}
                        color={isDarkMode ? "#454545" : "#919191"}
                      />
                    )}
                  />

                  {/* Selected Assignees Chips */}
                  {(issue.responsibility || []).length > 0 && (
                    <View className="flex-row flex-wrap gap-2">
                      {(issue.responsibility || []).map((res: any) => (
                        <TouchableOpacity
                          key={res._id}
                          onPress={() => {
                            const newResponsibility = (
                              issue.responsibility || []
                            ).filter((r: any) => r._id !== res._id);
                            updateIssue(
                              index,
                              "responsibility",
                              newResponsibility,
                            );
                          }}
                          className={`flex-row items-center px-4 py-2 rounded-lg border ${
                            isDarkMode
                              ? "bg-[#1A1A1A] border-[#413E47]"
                              : "bg-white border-[#E0E5EB]"
                          }`}
                        >
                          <Text
                            className={`mr-2 font-poppins text-sm ${
                              isDarkMode ? "text-white" : "text-black"
                            }`}
                          >
                            {res.name}
                          </Text>
                          <HugeiconsIcon
                            icon={Cancel01Icon}
                            size={14}
                            strokeWidth={2}
                            color={isDarkMode ? "#FFF" : "#000"}
                          />
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}

                  <TouchableOpacity onPress={() => openDatePicker(index)}>
                    <View
                      className={`flex-row items-center justify-between rounded-xl px-4 py-4 ${
                        isDarkMode ? "bg-black" : "bg-[#F0F3F7]"
                      }`}
                    >
                      <Text
                        className={`text-base font-poppins ${
                          issue.targetDate
                            ? isDarkMode
                              ? "text-white"
                              : "text-gray-800"
                            : isDarkMode
                              ? "text-[#919191]"
                              : "text-[#454545]"
                        }`}
                      >
                        {issue.targetDate
                          ? moment(issue.targetDate).format("DD-MM-YYYY")
                          : "DD-MM-YYYY"}
                      </Text>
                      <HugeiconsIcon
                        icon={Calendar03Icon}
                        size={20}
                        color="#9CA3AF"
                      />
                    </View>
                  </TouchableOpacity>

                  <TextInput
                    placeholder="e.g. Describe the issue"
                    value={issue.remarks}
                    onChangeText={(text) => updateIssue(index, "remarks", text)}
                    className={`rounded-xl px-4 py-4 text-base font-poppins ${
                      isDarkMode
                        ? "bg-black text-white"
                        : "bg-[#F0F3F7] text-gray-800"
                    }`}
                    placeholderTextColor={isDarkMode ? "#919191" : "#454545"}
                    multiline
                    numberOfLines={4}
                    style={{ textAlignVertical: "top", minHeight: 90 }}
                  />

                  {/* Image Picker Section */}
                  <View
                    className={`rounded-2xl p-4 gap-3 ${
                      isDarkMode ? "bg-black" : "bg-[#F0F3F7]"
                    }`}
                  >
                    <Text
                      className={`font-poppinsMedium text-base ${
                        isDarkMode ? "text-white" : "text-gray-800"
                      }`}
                    >
                      Images
                    </Text>

                    <View
                      className={`rounded-2xl p-5 items-center justify-center ${
                        isDarkMode ? "bg-[#1A1A1A]" : "bg-white"
                      }`}
                      style={{ minHeight: 100 }}
                    >
                      <TouchableOpacity
                        onPress={() => pickImage(index)}
                        className={`rounded-xl px-8 py-3 flex-row items-center mb-3 ${
                          isDarkMode ? "bg-black" : "bg-black"
                        }`}
                        activeOpacity={0.8}
                      >
                        <HugeiconsIcon
                          icon={Upload01Icon}
                          size={18}
                          color="white"
                        />
                        <Text className="text-white font-poppins text-sm ml-2">
                          Upload
                        </Text>
                      </TouchableOpacity>
                      <Text
                        className={`font-poppins text-base ${
                          isDarkMode ? "text-[#919191]" : "text-[#454545]"
                        }`}
                      >
                        Choose Image
                      </Text>
                    </View>

                    {/* Image Thumbnails */}
                    {(images[index] || []).length > 0 && (
                      <View className="flex-row py-1 flex-wrap gap-2">
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
                                  width: 85,
                                  height: 85,
                                  borderRadius: 20,
                                }}
                              />
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={() => deleteImage(index, uri)}
                              className="absolute top-2 right-2 rounded-full p-1 bg-white/50"
                              style={{ zIndex: 10 }}
                            >
                              <HugeiconsIcon
                                icon={Cancel01Icon}
                                size={12}
                                color="black"
                                strokeWidth={3}
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
                      onPress={() => {
                        setIssueIndexToDelete(index);
                        setDeleteModalVisible(true);
                      }}
                      className="mt-2 flex-row items-center justify-end"
                    >
                      <HugeiconsIcon
                        icon={MinusSignCircleIcon}
                        size={18}
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
          className={`py-4 rounded-lg mb-4 mt-4 flex-row items-center justify-center ${
            isDarkMode ? "bg-[#1A1A1A]" : "bg-[#F0F3F7]"
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
          className="mb-10 "
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={
              saving
                ? ["#9CA3AF", "#9CA3AF"]
                : ["#5B4CCC", "#6347C2", "#8056D1"]
            }
            locations={saving ? [0, 1] : [0, 0.5183, 1]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            className="py-4 rounded-xl items-center"
            style={{borderRadius:11}}

          >

            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text className="text-white font-poppins text-lg">Submit</Text>
            )}
          </LinearGradient>
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
          if (selectedIssueIndex !== null) {
            updateIssue(selectedIssueIndex, "targetDate", "");
          }
          setDatePickerVisible(false);
          setSelectedIssueIndex(null);
        }}
        isDarkModeEnabled={isDarkMode}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isVisible={deleteModalVisible}
        onBackdropPress={() => setDeleteModalVisible(false)}
        onBackButtonPress={() => setDeleteModalVisible(false)}
        backdropOpacity={0.8}
        animationIn="fadeIn"
        animationOut="fadeOut"
        useNativeDriver
      >
        <View className="bg-white dark:bg-black w-full p-5 dark:border dark:border-[#262626] rounded-[24px]">
          <View className="bg-[#FDE6E6] dark:bg-[#5E1010]  self-start p-3 rounded-full mb-4">
            <HugeiconsIcon icon={Delete03Icon} size={24} color="#DF5B5B" />
          </View>

          <Text className="text-black dark:text-white font-dmSemiBold text-xl mb-2">
            Remove this item
          </Text>
          <Text className="text-[#454545] dark:text-[#919191] font-poppins text-[14px] mb-6">
            Are you sure you want to remove this element?
          </Text>

          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={() => setDeleteModalVisible(false)}
              className="flex-1 border border-gray-200 dark:border-white/20 py-4 rounded-xl items-center"
              activeOpacity={0.7}
            >
              <Text className="text-black dark:text-white font-poppins text-lg">
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                if (issueIndexToDelete !== null) {
                  removeIssue(issueIndexToDelete);
                }
                setDeleteModalVisible(false);
                setIssueIndexToDelete(null);
              }}
              className="flex-1 bg-[#DF5B5B] py-4 rounded-xl items-center"
              activeOpacity={0.7}
            >
              <Text className="text-white font-poppins text-[16px]">
                Confirm
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default ILRForm;
