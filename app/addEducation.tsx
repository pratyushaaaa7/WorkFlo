import {
  ArrowLeft01Icon,
  MinusSignIcon,
  PlusSignCircleIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { useUserFormStore } from "../store/userFormStore";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";

interface Education {
  college: string;
  qualification: string;
  specialization: string;
  graduationYear: string;
}

const AddEducation = () => {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";

  const { userId } = useLocalSearchParams();
  const { education, setEducation } = useUserFormStore();
  
  const [educations, setEducations] = useState<Education[]>([
    {
      college: "",
      qualification: "",
      specialization: "",
      graduationYear: "",
    },
  ]);

  useEffect(() => {
    if (education && education.length > 0) {
      setEducations(education);
    }
  }, [education]);

  const handleAddEducation = () => {
    setEducations([
      ...educations,
      {
        college: "",
        qualification: "",
        specialization: "",
        graduationYear: "",
      },
    ]);
  };

  const handleRemoveEducation = (index: number) => {
    const newEducations = educations.filter((_, i) => i !== index);
    setEducations(newEducations);
  };

  const updateEducation = (index: number, updates: Partial<Education>) => {
    setEducations((prev) => {
      const newEducations = [...prev];
      newEducations[index] = { ...newEducations[index], ...updates };
      return newEducations;
    });
  };

  const handleSave = () => {
    // Only send entries that have at least one field filled
    const validEducations = educations.filter(
      (edu) =>
        edu.college.trim() ||
        edu.qualification.trim() ||
        edu.specialization.trim() ||
        edu.graduationYear.trim(),
    );

    // Save to store and go back
    setEducation(validEducations);
    router.back();
  };

  return (
    <View className="flex-1 bg-white dark:bg-black">
      {/* Header */}
      <View className="pt-14 px-4 pb-4 bg-white dark:bg-black ">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <HugeiconsIcon
              icon={ArrowLeft01Icon}
              size={24}
              color={isDarkMode ? "#FFF" : "#000"}
            />
          </TouchableOpacity>
          <Text className="text-xl font-dmSemiBold text-black dark:text-white">
            Education Details
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: 16,
            paddingTop: 20,
            paddingBottom: 40,
          }}
          className="bg-white dark:bg-black"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {educations.map((education, index) => (
            <View
              key={index}
              className="mb-6  border-b border-gray-200 dark:border-[#252525]"
            >
              {/* Institute Name */}
              <View className="mb-4">
                <Text className="text-sm font-poppinsMedium text-black dark:text-white mb-2">
                  College
                </Text>
                <TextInput
                  value={education.college}
                  onChangeText={(val) =>
                    updateEducation(index, { college: val })
                  }
                  placeholder="College Name"
                  multiline
                  placeholderTextColor={isDarkMode ? "#606060" : "#9CA3AF"}
                  className="bg-[#F0F3F7] dark:bg-[#1A1A1A] rounded-xl px-4 py-3 text-black dark:text-white font-poppins"
                />
              </View>

              {/* Degree/Diploma */}
              <View className="mb-4">
                <Text className="text-sm font-poppinsMedium text-black dark:text-white mb-2">
                  Qualification
                </Text>
                <TextInput
                  value={education.qualification}
                  onChangeText={(val) =>
                    updateEducation(index, { qualification: val })
                  }
                  placeholder="e.g. UX/UI Designer"
                  placeholderTextColor={isDarkMode ? "#606060" : "#9CA3AF"}
                  className="bg-[#F0F3F7] dark:bg-[#1A1A1A] rounded-xl px-4 py-3 text-black dark:text-white font-poppins"
                />
              </View>

              {/* Specialization */}
              <View className="mb-4">
                <Text className="text-sm font-poppinsMedium text-black dark:text-white mb-2">
                  Specialization
                </Text>
                <TextInput
                  value={education.specialization}
                  onChangeText={(val) =>
                    updateEducation(index, { specialization: val })
                  }
                  placeholder="e.g. Computer Science"
                  placeholderTextColor={isDarkMode ? "#606060" : "#9CA3AF"}
                  className="bg-[#F0F3F7] dark:bg-[#1A1A1A] rounded-xl px-4 py-3 text-black dark:text-white font-poppins"
                />
              </View>

              {/* Year of Completion */}
              <View className="mb-4">
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-sm font-poppinsMedium text-black dark:text-white">
                    Graduation Year
                  </Text>
                </View>
                <TextInput
                  value={education.graduationYear}
                  onChangeText={(val) => {
                    // Only allow numbers and limit to 4 digits
                    const numericValue = val.replace(/[^0-9]/g, "").slice(0, 4);
                    updateEducation(index, { graduationYear: numericValue });
                  }}
                  placeholder="e.g. 2024"
                  placeholderTextColor={isDarkMode ? "#606060" : "#9CA3AF"}
                  keyboardType="numeric"
                  maxLength={4}
                  className="bg-[#F0F3F7] dark:bg-[#1A1A1A] rounded-xl px-4 py-3 text-black dark:text-white font-poppins"
                />
              </View>
              {/*Remove button*/}
              {index > 0 && (
                <View className="items-end mb-4">
                  <TouchableOpacity
                    onPress={() => handleRemoveEducation(index)}
                    className="w-6 h-6 bg-[#DF5B5B] rounded-full items-center justify-center"
                  >
                    <HugeiconsIcon
                      icon={MinusSignIcon}
                      size={16}
                      color="#FFF"
                    />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))}

        {/* Add Button */}
          <TouchableOpacity
            onPress={handleAddEducation}
            className="flex-row items-center mb-6"
          >
            <HugeiconsIcon
              icon={PlusSignCircleIcon}
              size={14}
              color="#0073CB"
            />
            <Text className="text-[#0073CB] font-poppinsMedium text-sm">
              {" "}
              Add
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Bottom Action Buttons - Now inside KeyboardAvoidingView */}
        <View className="bg-white dark:bg-black px-4 py-4 pb-8 flex-row gap-3 ">
          <TouchableOpacity
            onPress={() => router.back()}
            className="flex-1 bg-transparent border border-gray-300 dark:border-[#333] rounded-xl py-3 items-center"
          >
            <Text className="text-black dark:text-white font-poppinsMedium text-base">
              Cancel
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSave} className="flex-1">
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
      </KeyboardAvoidingView>
    </View>
  );
};

export default AddEducation;
