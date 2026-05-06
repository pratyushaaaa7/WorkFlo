import api from "@/lib/api";
import { ArrowLeft01Icon, Cancel01Icon, Upload01Icon } from "@hugeicons/core-free-icons";
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
import { KeyboardAwareScrollView, KeyboardStickyView } from "react-native-keyboard-controller";
import { Image as ExpoImage } from "expo-image";
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
  const [images, setImages] = useState<string[]>([]);

  const typeOptions = ["Issue", "Suggestion", "Feedback"];

  // Validation errors state
  const [fieldErrors, setFieldErrors] = useState<{
    relatedPage?: boolean;
    description?: boolean;
  }>({});

  useEffect(() => {
    const today = new Date().toLocaleDateString("en-GB");
    setDate(today);
  }, []);

  const pickImage = async () => {
    if (images.length >= 3) {
      Alert.alert("Limit Reached", "You can only upload up to 3 images.");
      return;
    }
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsMultipleSelection: true,
        selectionLimit: 3 - images.length,
        quality: 0.5,
      });

      if (!result.canceled) {
        const newUris = result.assets.map(asset => asset.uri);
        setImages(prev => [...prev, ...newUris].slice(0, 3));
      }
    } catch (error) {
      console.error("Image Picker Error:", error);
      Alert.alert("Error", "Could not open image library");
    }
  };

  const handleSubmit = async () => {
    if (loading) return; // Prevent multiple clicks

    if (!type || !description.trim() || !relatedPage.trim()) {
      const errors: typeof fieldErrors = {};
      if (!relatedPage.trim()) errors.relatedPage = true;
      if (!description.trim()) errors.description = true;
      setFieldErrors(errors);

      const missingFields: string[] = [];
      if (errors.relatedPage) missingFields.push('Related Page');
      if (errors.description) missingFields.push('Description');

      Toast.show({
        type: "error",
        text1: "Please fill required fields",
        text2: missingFields.join(', '),
        position: "bottom",
        visibilityTime: 4000,
      });
      return;
    }
    setFieldErrors({});
    setLoading(true);

    const resetForm = () => {
      setType("Issue");
      setRelatedPage("");
      setDescription("");
      setImages([]);
      setFieldErrors({});
    };
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

    if (images.length > 0) {
      images.forEach((uri, index) => {
        const filename = uri.split("/").pop() || `upload_${index}.jpg`;
        const match = /\.(\w+)$/.exec(filename);
        const fileType = match ? `image/${match[1]}` : "image/jpeg";

        formData.append("file", {
          uri: uri,
          name: filename,
          type: fileType,
        } as any);
      });
    }

    try {
      // console.log("🚀 Sending Support Ticket:", {
      //   url: "/support",
      //   method: "POST",
      //   headers: { Authorization: `Bearer ${token}` },
      //   formDataEntries: Array.from((formData as any).entries())
      // });

      const response = await api.post("/support", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data", // Ensure content type is set
        },
      });
      // console.log("✅ Server Response:", response.data);

      // const result = await response.json();

      if (response.data.success) {
        Toast.show({
          type: "success",
          text1: "Response submitted!",
          text2: "Thank you for your input.",
          position: "bottom",
        });
        resetForm();
        setTimeout(() => router.push("/appSupport"), 1500);
      } else {
        Toast.show({
          type: "error",
          text1: "Submission failed",
          text2: response.data.message || "Try again later.",
          position: "bottom",
        });
      }
    } catch (error: any) {
      console.error("❌ Support Ticket Error:", error);
      if (error.response) {
        console.error("🔹 Error Response Data:", error.response.data);
        console.error("🔹 Error Response Status:", error.response.status);
      } else if (error.request) {
        console.error("🔹 Error Request Details:", error.request);
      } else {
        console.error("🔹 Error Message:", error.message);
      }
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
        bottomOffset={60}
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
                  className={`px-6 py-2 rounded-full border ${type === t
                    ? "bg-[#DDE2FB] dark:bg-[#11162F] border-[#5B4CCC]"
                    : "bg-[#F3F4F6] dark:bg-[#262626] border-[#E5E7EB] dark:border-[#333]"
                    }`}
                >
                  <Text
                    className={`text-sm font-dmMedium ${type === t
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
              onChangeText={(val) => {
                setRelatedPage(val);
                if (fieldErrors.relatedPage && val.trim()) setFieldErrors(prev => ({ ...prev, relatedPage: false }));
              }}
              className={`rounded-xl px-4 py-3 font-poppins text-sm mb-5 ${isDarkMode
                ? fieldErrors.relatedPage
                  ? "bg-[#2A1A1A] text-white border border-[#DF5B5B]"
                  : "bg-[#1A1A1A] text-white border border-[#333]"
                : fieldErrors.relatedPage
                  ? "bg-[#FFF5F5] text-black border border-[#DF5B5B]"
                  : "bg-white text-black border border-[#E0E5EB]"
                }`}
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
              onChangeText={(val) => {
                setDescription(val);
                if (fieldErrors.description && val.trim()) setFieldErrors(prev => ({ ...prev, description: false }));
              }}
              className={`rounded-xl px-4 py-3 font-poppins text-sm min-h-[120px] ${isDarkMode
                ? fieldErrors.description
                  ? "bg-[#2A1A1A] text-white border border-[#DF5B5B]"
                  : "bg-[#1A1A1A] text-white border border-[#333]"
                : fieldErrors.description
                  ? "bg-[#FFF5F5] text-black border border-[#DF5B5B]"
                  : "bg-white text-black border border-[#E0E5EB]"
                }`}
            />
          </View>

          {/* 🔹 IMAGES CARD */}
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
                onPress={pickImage}
                disabled={images.length >= 3}
                className={`rounded-xl px-8 py-3 flex-row items-center mb-3 ${
                  isDarkMode ? "bg-black" : "bg-black"
                } ${images.length >= 3 ? 'opacity-50' : ''}`}
                activeOpacity={0.8}
              >
                <HugeiconsIcon
                  icon={Upload01Icon}
                  size={18}
                  color="white"
                />
                <Text className="text-white font-poppins ml-3">
                  Upload
                </Text>
              </TouchableOpacity>
              <Text
                className={`font-poppins text-base ${
                  isDarkMode ? "text-[#919191]" : "text-[#454545]"
                }`}
              >
                {images.length >= 3 ? "Limit Reached" : "You can add upto 3 images"}
              </Text>
            </View>

            {/* Image Thumbnails */}
            {images.length > 0 && (
              <View className="flex-row py-1 flex-wrap gap-2">
                {images.map((uri, idx) => (
                  <View key={idx} className="relative">
                    <ExpoImage
                      source={{ uri }}
                      style={{
                        width: 85,
                        height: 85,
                        borderRadius: 20,
                      }}
                      contentFit="cover"
                    />
                    <TouchableOpacity
                      onPress={() => setImages(prev => prev.filter((_, i) => i !== idx))}
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
        </View>
      </KeyboardAwareScrollView>

      {/* 🔹 STICKY SUBMIT BUTTON */}
      <KeyboardStickyView offset={{ closed: 0, opened: 0 }}>
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
              style={{
                paddingVertical: 16,
                borderRadius: 12,
                alignItems: "center",
                justifyContent: "center",
                shadowColor: "#5B4CCC",
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.3,
                shadowRadius: 15,
                elevation: 8,
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
      </KeyboardStickyView>
    </View>
  );
};

export default CreateSupport;
