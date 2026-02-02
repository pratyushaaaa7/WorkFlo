import {
  ArrowLeft01Icon,
  Calendar03Icon,
  MinusSignIcon,
  PlusSignCircleIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import Toast from "react-native-toast-message";

interface WorkExperience {
  company: string;
  designation: string;
  fromDate: Date | null;
  toDate: Date | null;
  jobDescription: string;
  showFromPicker: boolean;
  showToPicker: boolean;
}

const AddWorkExperience = () => {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";

  const { userId, existingExperience } = useLocalSearchParams();
  const [experiences, setExperiences] = useState<WorkExperience[]>([
    {
      company: "",
      designation: "",
      fromDate: null,
      toDate: null,
      jobDescription: "",
      showFromPicker: false,
      showToPicker: false,
    },
  ]);

  useEffect(() => {
    if (existingExperience) {
      try {
        const parsed = JSON.parse(existingExperience as string);
        if (parsed && parsed.length > 0) {
          setExperiences(
            parsed.map((exp: any) => ({
              ...exp,
              fromDate: exp.fromDate ? new Date(exp.fromDate) : null,
              toDate: exp.toDate ? new Date(exp.toDate) : null,
              showFromPicker: false,
              showToPicker: false,
            })),
          );
        }
      } catch (e) {
        console.error("Failed to parse existing experience:", e);
      }
    }
  }, [existingExperience]);

  const handleAddExperience = () => {
    setExperiences([
      ...experiences,
      {
        company: "",
        designation: "",
        fromDate: null,
        toDate: null,
        jobDescription: "",
        showFromPicker: false,
        showToPicker: false,
      },
    ]);
  };

  const handleRemoveExperience = (index: number) => {
    const newExperiences = experiences.filter((_, i) => i !== index);
    setExperiences(newExperiences);
  };

  const updateExperience = (
    index: number,
    field: keyof WorkExperience,
    value: any,
  ) => {
    const newExperiences = [...experiences];
    newExperiences[index] = { ...newExperiences[index], [field]: value };
    setExperiences(newExperiences);
  };

  const handleSave = () => {
    // Validate at least one entry has required fields
    const hasValidEntry = experiences.some(
      (exp) => exp.company.trim() && exp.designation.trim(),
    );

    if (!hasValidEntry) {
      Toast.show({
        type: "error",
        text1: "Validation Error",
        text2: "Please fill in at least one complete work experience",
        position: "bottom",
      });
      return;
    }

    // Navigate back with data
    router.push({
      pathname: "/registerUser",
      params: {
        userId: userId as string,
        experienceData: JSON.stringify(experiences),
      },
    });
  };

  return (
    <View className="flex-1 bg-white dark:bg-black">
      {/* Header */}
      <View className="pt-14 px-4 pb-4 bg-white dark:bg-black">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <HugeiconsIcon
              icon={ArrowLeft01Icon}
              size={24}
              color={isDarkMode ? "#FFF" : "#000"}
            />
          </TouchableOpacity>
          <Text className="text-xl font-dmSemiBold text-black dark:text-white">
            Work Experience
          </Text>
        </View>
      </View>

      <KeyboardAwareScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 16,
          paddingTop: 20,
          paddingBottom: 100,
        }}
        className="bg-white dark:bg-black"
        enableOnAndroid
        extraScrollHeight={Platform.OS === "ios" ? 20 : 30}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {experiences.map((experience, index) => (
          <View
            key={index}
            className="mb-6  border-b border-gray-200 dark:border-[#252525]"
          >
            {/* Company Name */}
            <View className="mb-4">
              <Text className="text-sm font-poppinsMedium text-black dark:text-white mb-2">
                Company Name
              </Text>
              <TextInput
                value={experience.company}
                onChangeText={(val) => updateExperience(index, "company", val)}
                placeholder="Company Name"
                placeholderTextColor={isDarkMode ? "#606060" : "#9CA3AF"}
                className="bg-[#F0F3F7] dark:bg-[#1A1A1A] rounded-xl px-4 py-3 text-black dark:text-white font-poppins"
              />
            </View>

            {/* Job Title */}
            <View className="mb-4">
              <Text className="text-sm font-poppinsMedium text-black dark:text-white mb-2">
                Job Title
              </Text>
              <TextInput
                value={experience.designation}
                onChangeText={(val) =>
                  updateExperience(index, "designation", val)
                }
                placeholder="e.g. UX/UI Designer"
                placeholderTextColor={isDarkMode ? "#606060" : "#9CA3AF"}
                className="bg-[#F0F3F7] dark:bg-[#1A1A1A] rounded-xl px-4 py-3 text-black dark:text-white font-poppins"
              />
            </View>

            {/* From Date */}
            <View className="mb-4">
              <Text className="text-sm font-poppinsMedium text-black dark:text-white mb-2">
                Form Date
              </Text>
              <TouchableOpacity
                onPress={() => updateExperience(index, "showFromPicker", true)}
                className="bg-[#F0F3F7] dark:bg-[#1A1A1A] rounded-xl px-4 py-3 flex-row items-center justify-between"
              >
                <Text
                  className={`font-poppins ${
                    experience.fromDate
                      ? "text-black dark:text-white"
                      : "text-[#9CA3AF] dark:text-[#606060]"
                  }`}
                >
                  {experience.fromDate
                    ? experience.fromDate.toDateString()
                    : "Select Date"}
                </Text>
                <HugeiconsIcon
                  icon={Calendar03Icon}
                  size={20}
                  color={isDarkMode ? "#606060" : "#9CA3AF"}
                />
              </TouchableOpacity>
              {experience.showFromPicker && (
                <DateTimePicker
                  value={experience.fromDate || new Date()}
                  mode="date"
                  display="default"
                  onChange={(event, date) => {
                    updateExperience(index, "showFromPicker", false);
                    if (event.type === "set" && date) {
                      updateExperience(index, "fromDate", date);
                    }
                  }}
                />
              )}
            </View>

            {/* To Date */}
            <View className="mb-4">
              <Text className="text-sm font-poppinsMedium text-black dark:text-white mb-2">
                To Date
              </Text>
              <TouchableOpacity
                onPress={() => updateExperience(index, "showToPicker", true)}
                className="bg-[#F0F3F7] dark:bg-[#1A1A1A] rounded-xl px-4 py-3 flex-row items-center justify-between"
              >
                <Text
                  className={`font-poppins ${
                    experience.toDate
                      ? "text-black dark:text-white"
                      : "text-[#9CA3AF] dark:text-[#606060]"
                  }`}
                >
                  {experience.toDate
                    ? experience.toDate.toDateString()
                    : "Select Date"}
                </Text>
                <HugeiconsIcon
                  icon={Calendar03Icon}
                  size={20}
                  color={isDarkMode ? "#606060" : "#9CA3AF"}
                />
              </TouchableOpacity>
              {experience.showToPicker && (
                <DateTimePicker
                  value={experience.toDate || new Date()}
                  mode="date"
                  display="default"
                  onChange={(event, date) => {
                    updateExperience(index, "showToPicker", false);
                    if (event.type === "set" && date) {
                      updateExperience(index, "toDate", date);
                    }
                  }}
                />
              )}
            </View>

            {/* Job Description */}
            <View className="mb-4">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-sm font-poppinsMedium text-black dark:text-white">
                  Job Description
                </Text>
              </View>
              <TextInput
                value={experience.jobDescription}
                onChangeText={(val) =>
                  updateExperience(index, "jobDescription", val)
                }
                placeholder="Add a brief description"
                placeholderTextColor={isDarkMode ? "#606060" : "#9CA3AF"}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                className="bg-[#F0F3F7] dark:bg-[#1A1A1A] rounded-xl px-4 py-3 text-black dark:text-white font-poppins"
                style={{ minHeight: 120 }}
              />
            </View>

            {/*Remove button*/}
            {index > 0 && (
              <View className="items-end mb-4">
                <TouchableOpacity
                  onPress={() => handleRemoveExperience(index)}
                  className="w-6 h-6 bg-[#DF5B5B] rounded-full items-center justify-center"
                >
                  <HugeiconsIcon icon={MinusSignIcon} size={16} color="#FFF" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        ))}

        {/* Add Button */}
        <TouchableOpacity
          onPress={handleAddExperience}
          className="flex-row items-center mb-6"
        >
          <HugeiconsIcon icon={PlusSignCircleIcon} size={14} color="#0073CB" />
          <Text className="text-[#0073CB] font-poppinsMedium text-sm">
            {" "}
            Add
          </Text>
        </TouchableOpacity>
      </KeyboardAwareScrollView>

      {/* Bottom Action Buttons */}
      <View className="absolute bottom-0 left-0 right-0 bg-white dark:bg-black  px-4 py-4 pb-12 flex-row gap-3">
        <TouchableOpacity
          onPress={() => router.back()}
          className="flex-1 bg-transparent border border-gray-300 dark:border-[#333] rounded-xl py-3 items-center"
        >
          <Text className="text-black dark:text-white font-poppinsMedium text-base">
            Cancel
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleSave} className="flex-1 rounded-xl">
          <LinearGradient
            colors={["#5B4CCC", "#6347C2", "#8056D1"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            locations={[0, 0.5183, 1]}
            style={{
              borderRadius: 12,
              paddingVertical: 12,
              alignItems: "center",
            }}
          >
            <Text className="text-white font-poppinsMedium text-base">
              Save
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default AddWorkExperience;
