import api from "@/lib/api";
import { ArrowLeft01Icon, Upload01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import Toast from "react-native-toast-message";
import { useAuth } from "../context/AuthContext";

const CreateSupport = () => {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";
  const { user, token } = useAuth(); // ✅ Get user directly from context
  // console.log(user)

  // const [user, setUser] = useState("");
  const [date, setDate] = useState("");
  const [type, setType] = useState("Issue");
  const [loading, setLoading] = useState(false); // ✅ ADD THIS

  const [relatedPage, setRelatedPage] = useState("");
  const [description, setDescription] = useState("");
  // const [extraNotes, setExtraNotes] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);

  const typeOptions = ["Issue", "Suggestion", "Feedback"];

  useEffect(() => {
    const today = new Date().toLocaleDateString("en-GB");
    setDate(today);
  }, []);

  const pickImage = async () => {
    // Ask for permissions
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert(
        "Permission Required",
        "You need to allow access to your gallery to attach images.",
      );
      return;
    }

    // Open Image Picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"], // ✅ string-based — works universally
      // allowsEditing: true,
      quality: 0.5,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (loading) return; // Prevent multiple clicks

    if (!type || !description.trim() || !relatedPage.trim()) {
      Toast.show({
        type: "error",
        text1: "Missing Information",
        text2: "Please fill all required fields before submitting.",
        position: "bottom",
      });
      return;
    }
    setLoading(true); //  START LOADER
    // const formData = {
    //   raisedBy: user,
    //   date,
    //   type,
    //   relatedPage,
    //   description,
    //   // extraNotes,
    // };

    const formData = new FormData();
    formData.append("type", type);
    formData.append("relatedPage", relatedPage);
    formData.append("description", description);
    formData.append("date", date);

    if (imageUri) {
      const filename = imageUri.split("/").pop();
      const match = /\.(\w+)$/.exec(filename);
      const fileType = match ? `image/${match[1]}` : `image`;

      formData.append("file", {
        uri: imageUri,
        name: filename,
        type: fileType,
      });
    }

    try {
      const response = await api.post("/support", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data", // ✅ Important fix
        },
      });

      // const result = await response.json();

      if (response.data.success) {
        Toast.show({
          type: "success",
          text1: "Response submitted!",
          text2: "Thank you for your input.",
          position: "bottom",
        });
        setTimeout(() => router.push("/appSupport"));
      } else {
        Toast.show({
          type: "error",
          text1: "Submission failed",
          text2: response.data.message || "Try again later.",
          position: "bottom",
        });
      }
    } catch (error) {
      console.error(error);
      Toast.show({
        type: "error",
        text1: "Network error",
        text2: "Could not reach the server.",
        position: "bottom",
      });
    } finally {
      setLoading(false); //  STOP LOADER
    }

    // console.log("App Support Submitted:", formData);

    // Toast.show({
    //   type: "success",
    //   text1: "Response Submitted",
    //   text2: "Your response has been submitted successfully.",
    //   position: "bottom",
    // });

    // setTimeout(() => router.back(), 1500);
  };

  return (
    <View className="flex-1 bg-white dark:bg-black">
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />

      {/* 🔹 HEADER */}
      <View className="flex-row items-center px-4 pb-6 pt-16 bg-white dark:bg-black">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <HugeiconsIcon
            icon={ArrowLeft01Icon}
            size={24}
            color={isDarkMode ? "#FFF" : "#000"}
          />
        </TouchableOpacity>
        <Text className="text-xl font-dmSemiBold text-black dark:text-white">
          Raise Ticket
        </Text>
      </View>

      <KeyboardAwareScrollView
        enableOnAndroid
        extraScrollHeight={60}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <View className="px-4 pt-4">
          {/* 🔹 MAIN CARD */}
          <View className="bg-[#F0F3F7] dark:bg-[#0D0D0D] rounded-[16px] p-5 mb-5 shadow-sm">
            {/* Raised By & Date Row */}
            <View className="flex-row justify-between items-center pb-4 border-b border-[#E0E5EB] dark:border-[#413E47] mb-4">
              <View>
                <Text className="text-[#6B7280] dark:text-[#919191] text-sm font-dmMedium mb-1">
                  Raised By
                </Text>
                <Text className="text-black dark:text-white text-base font-dmSemiBold">
                  {user?.fullName || "User Name"}
                </Text>
              </View>
              <View className="items-end">
                <Text className="text-[#6B7280] dark:text-[#919191] text-sm font-dmMedium mb-1">
                  Date
                </Text>
                <Text className="text-black dark:text-white text-base font-dmSemiBold">
                  {date}
                </Text>
              </View>
            </View>

            {/* Select Type */}
            <Text className="text-[#6B7280] dark:text-[#919191]  text-sm font-dmMedium mb-3">
              Select Type
            </Text>
            <View className="flex-row gap-2 mb-6 pb-4 border-b border-[#E0E5EB] dark:border-[#413E47]">
              {typeOptions.map((t) => (
                <TouchableOpacity
                  key={t}
                  onPress={() => setType(t)}
                  className={`px-6 py-3 rounded-full border ${
                    type === t
                      ? "bg-[#DDE2FB] dark:bg-[#11162F] border-[#5B4CCC]"
                      : "bg-[#F3F4F6] dark:bg-[#262626] border-[#E5E7EB] dark:border-[#333]"
                  }`}
                >
                  <Text
                    className={`text-sm font-dmMedium ${
                      type === t
                        ? "text-[#5B4CCC]"
                        : "text-black dark:text-white"
                    }`}
                  >
                    {t}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Related Page Section */}
            <Text className="text-[#6B7280] dark:text-[#919191] text-sm font-dmMedium mb-2">
              Related page/Section*
            </Text>
            <TextInput
              placeholder="e.g. ILR Page"
              placeholderTextColor={isDarkMode ? "#919191" : "#919191"}
              value={relatedPage}
              onChangeText={setRelatedPage}
              className="bg-white dark:bg-[#1A1A1A] border border-[#E0E5EB] dark:border-[#333] rounded-xl px-4 py-3 text-black dark:text-white font-poppins text-sm mb-5"
            />

            {/* Describe Issue */}
            <Text className="text-[#6B7280] dark:text-[#919191] text-sm font-dmMedium mb-2">
              Describe your Issue*
            </Text>
            <TextInput
              multiline
              textAlignVertical="top"
              placeholder="Description here..."
              placeholderTextColor={isDarkMode ? "#919191" : "#919191"}
              value={description}
              onChangeText={setDescription}
              className="bg-white dark:bg-[#1A1A1A] border border-[#E0E5EB] dark:border-[#333] rounded-xl px-4 py-3 text-black dark:text-white font-poppins text-sm min-h-[120px]"
            />
          </View>

          {/* 🔹 IMAGES CARD */}
          <View className="bg-[#F0F3F7] dark:bg-[#0D0D0D] rounded-[24px] p-5 mb-8">
            <Text className="text-black dark:text-white text-lg font-dmSemiBold mb-4">
              Images
            </Text>

            <View className="bg-white dark:bg-[#1A1A1A] rounded-3xl p-6 items-center border border-[#E0E5EB] dark:border-[#333]">
              {imageUri ? (
                <View className="w-full relative">
                  <Image
                    source={{ uri: imageUri }}
                    className="w-full h-[200px] rounded-2xl"
                    resizeMode="cover"
                  />
                  <TouchableOpacity
                    onPress={() => setImageUri(null)}
                    className="absolute -top-3 -right-3 bg-red-500 w-8 h-8 rounded-full items-center justify-center shadow-lg"
                  >
                    <Text className="text-white font-bold">×</Text>
                  </TouchableOpacity>
                  <Text className="text-center mt-3 text-gray-400 text-xs">
                    Tap to change image
                  </Text>
                </View>
              ) : (
                <>
                  <TouchableOpacity
                    onPress={pickImage}
                    className="bg-[#0D0D0D] dark:bg-[#0D0D0D] flex-row items-center px-6 py-3 rounded-xl mb-3 shadow-md"
                  >
                    <HugeiconsIcon
                      icon={Upload01Icon}
                      size={18}
                      color="white"
                    />
                    <Text className="text-white font-dmMedium ml-2">
                      Upload
                    </Text>
                  </TouchableOpacity>
                  <Text className="text-[#6B7280] dark:text-[#D2D2D2] font-poppins text-sm">
                    Choose Image
                  </Text>
                </>
              )}
            </View>
          </View>
        </View>
      </KeyboardAwareScrollView>

      {/* 🔹 STICKY SUBMIT BUTTON */}
      <View className="px-5 pb-10 pt-2 bg-white dark:bg-black">
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={["#5B4CCC", "#6347C2", "#8056D1"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="py-4 rounded-2xl items-center justify-center shadow-lg"
            style={{
              shadowColor: "#5B4CCC",
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.3,
              shadowRadius: 15,
              elevation: 8,
              borderRadius: 12,
            }}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white text-lg font-poppinsMedium">
                Submit
              </Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default CreateSupport;
