import React, { useEffect, useState, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  // ScrollView,
  Alert,
  Image,
} from "react-native";
// import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
// import { AuthContext } from "../context/AuthContext";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "../context/AuthContext";
import Toast from "react-native-toast-message";
import api from "@/lib/api";

const CreateSupport = () => {
  const router = useRouter();
  const { user, token } = useAuth(); // ✅ Get user directly from context
  // console.log(user)

  // const [user, setUser] = useState("");
  const [date, setDate] = useState("");
  const [type, setType] = useState("Issue");

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
        "You need to allow access to your gallery to attach images."
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
    if (!type || !description.trim() || !relatedPage.trim()) {
      Toast.show({
        type: "error",
        text1: "Missing Information",
        text2: "Please fill all required fields before submitting.",
        position: "bottom",
      });
      return;
    }

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
        setTimeout(() => router.push("/(drawer)/appSupport"));
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
    <>
      {/* Header */}
      <LinearGradient colors={["#6366F1", "#8B5CF6"]}>
        <View className="pt-16 pb-6 px-4 flex-row items-center justify-between shadow-md">
          <TouchableOpacity
            onPress={() => router.push("/(drawer)/appSupport")}
            className="flex-row items-center"
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
            <Text className="text-xl font-semibold text-white ml-4">
              App Support
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
      <KeyboardAwareScrollView
        className="flex-1 bg-gray-50 "
        extraScrollHeight={50}
        enableOnAndroid={true}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Form Card */}
        <View className="bg-white p-3 mx-2 my-3 rounded-xl shadow-sm border border-gray-100">
          {/* Raised By & Date Row */}
          <View className="flex-row justify-between mb-4">
            {/* Raised By */}
            <View className="flex-1 mr-2">
              <Text className="text-gray-600 mb-1">Raised By</Text>
              <Text
                className="text-base font-medium text-gray-900"
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {user?.fullName || user?.username || "Unknown User"}
              </Text>
            </View>

            {/* Date */}
            <View className="items-end">
              <Text className="text-gray-600 mb-1">Date</Text>
              <Text className="text-base font-medium text-gray-900">
                {date}
              </Text>
            </View>
          </View>

          {/* Type Selector */}
          <Text className="text-gray-600 mb-2">Select Type</Text>
          <View className="flex-row justify-around mb-4">
            {typeOptions.map((t) => (
              <TouchableOpacity
                key={t}
                onPress={() => setType(t)}
                activeOpacity={0.8}
                className={`px-5 py-2 rounded-full border ${
                  type === t
                    ? "bg-indigo-600 border-indigo-600"
                    : "bg-gray-100 border-gray-300"
                }`}
              >
                <Text
                  className={`font-semibold ${
                    type === t ? "text-white" : "text-gray-700"
                  }`}
                >
                  {t}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Related Page */}
          <Text className="text-gray-600 mb-2">
            Related Page / Section <Text className="text-red-500">*</Text>
          </Text>
          <TextInput
            placeholder="e.g. Login Screen, ILR Form, Project List..."
            placeholderTextColor="#999"
            value={relatedPage}
            onChangeText={setRelatedPage}
            className="border border-gray-300 rounded-xl p-3 mb-4 bg-gray-50 text-gray-900"
          />

          {/* description */}
          <Text className="text-gray-600 mb-2">
            Describe your {type || "issue"} <Text className="text-red-500">*</Text>
          </Text>
          <TextInput
            multiline
            textAlignVertical="top"
            placeholder="Write your description here..."
            placeholderTextColor="#999"
            value={description}
            autoCorrect={true}
            spellCheck={true}
            onChangeText={setDescription}
            className="border border-gray-300 rounded-xl p-3 h-40 bg-gray-50 text-gray-900"
          />

          {/* Additional Notes */}
          {/* <Text className="text-gray-600 mb-2 mt-4">
            Additional Notes (Optional)
          </Text>
          <TextInput
            multiline
            textAlignVertical="top"
            placeholder="Any extra details that might help the team..."
            placeholderTextColor="#999"
            value={extraNotes}
            onChangeText={setExtraNotes}
            className="border border-gray-300 rounded-xl p-3 h-24 bg-gray-50 text-gray-900"
          /> */}

          {/* Optional Image Attachment */}
          <Text className="text-gray-600 mb-2 mt-4">
            Attach Image (Optional)
          </Text>

          {imageUri ? (
            <View className="mb-4 relative">
              {/* Image */}
              <Image
                source={{ uri: imageUri }}
                style={{
                  width: "100%",
                  height: 250, // good visibility
                  borderRadius: 10,
                }}
                resizeMode="contain"
              />

              {/* Delete icon on top-right */}
              <TouchableOpacity
                onPress={() => setImageUri(null)}
                style={{
                  position: "absolute",
                  top: 10,
                  right: 10,
                  // backgroundColor: "rgba(0,0,0,0.5)",
                  borderRadius: 20,
                  padding: 6,
                }}
                className="bg-red-600"
              >
                <Ionicons name="trash" size={22} color="#fff" />
              </TouchableOpacity>
            </View>
          ) : (
            // When no image is selected
            <TouchableOpacity
              onPress={pickImage} // restore your image picker here
              className="py-3 border border-dashed border-gray-400 rounded-xl items-center bg-gray-50"
            >
              <Ionicons name="image-outline" size={28} color="#6B7280" />
              <Text className="text-gray-600 mt-1">Choose Image</Text>
            </TouchableOpacity>
          )}

          {/* Submit Button */}
          <TouchableOpacity
            onPress={handleSubmit}
            className="mt-6 rounded-xl overflow-hidden"
          >
            <View className="p-4 rounded-xl bg-indigo-600 items-center">
              <Text className="text-white font-semibold text-lg">
                Submit Feedback
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </KeyboardAwareScrollView>
    </>
  );
};

export default CreateSupport;
