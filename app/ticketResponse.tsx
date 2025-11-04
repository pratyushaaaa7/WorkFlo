import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  Switch,
  TextInput,
  TouchableOpacity,
  ScrollView,
  // Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../context/AuthContext";
import api from "@/lib/api";
import Toast from "react-native-toast-message";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

export default function TicketDetails() {
  const router = useRouter();
  const { token } = useAuth();
  const {
    id,
    ticketId,
    type,
    description,
    imageUrl,
    relatedPage,
    raisedBy,
    date,
    fixed,
    published,
    remark: initialRemark,
  } = useLocalSearchParams();

  console.log(raisedBy)

  const parseBool = (v: any) =>
    Array.isArray(v)
      ? String(v[0]) === "true"
      : v === true || String(v) === "true";

  const [isFixed, setIsFixed] = useState<boolean>(parseBool(fixed));
  const [isPublished, setIsPublished] = useState<boolean>(parseBool(published));
  const [remark, setRemark] = useState<string>(initialRemark || "");

  const handleUpdate = async () => {
    try {
      const res = await api.patch(
        `/support/${id}`,
        { fixed: isFixed, published: isPublished, remark },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.status === 200) {
        Toast.show({
          type: "success",
          text1: "Ticket updated successfully!",
          position: "bottom",
        });
        setTimeout(() => router.push("/(drawer)/appSupport"));
      }
    } catch (err) {
      console.error(err);
      Toast.show({
        type: "error",
        text1: "Failed to update ticket",
        text2: "Please try again later.",
        position: "bottom",
      });
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <LinearGradient colors={["#6366F1", "#8B5CF6"]}>
        <View className="pt-16 pb-6 px-4 flex-row items-center justify-between">
          <TouchableOpacity
            onPress={() => router.push("/(drawer)/appSupport")}
            activeOpacity={0.7}
            className="flex-row items-center"
          >
            <Ionicons name="arrow-back" size={22} color="#fff" />
            <Text className="text-xl font-semibold text-white ml-3">
              Ticket Details
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Body */}

      <KeyboardAwareScrollView
        enableOnAndroid
        extraScrollHeight={Platform.OS === "ios" ? 40 : 60}
        keyboardOpeningTime={0}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 14,
          paddingVertical: 10,
          paddingBottom: 60,
        }}
      >
        {/* Ticket Summary */}
        <View className="bg-white rounded-3xl shadow-sm p-5 mt-2 border border-gray-100">
          <View className="flex-row justify-between items-center mb-1">
            <Text className="text-lg font-bold text-indigo-600">
              Ticket #{ticketId}
            </Text>
            <View className="px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100">
              <Text className="text-indigo-600 text-xs font-medium">
                {type || "Support Ticket"}
              </Text>
            </View>
          </View>

          {relatedPage ? (
            <Text className="text-gray-700 font-semibold leading-5 mt-2">
              {relatedPage}
            </Text>
          ) : null}

          {description ? (
            <Text className="text-gray-700 leading-5 mt-2">{description}</Text>
          ) : null}

          <View className="mt-3 flex-row justify-between items-center">
            <Text className="text-sm text-gray-500">{date}</Text>
            <View className="flex-row items-center">
              <Ionicons
                name="person-circle-outline"
                size={16}
                color="#6b7280"
              />
              <Text className="ml-1 text-sm text-gray-500">
                Raised by{" "}
                <Text className="font-semibold text-gray-800">{raisedBy}</Text>
              </Text>
            </View>
          </View>
        </View>

        {/* Status Toggles */}
        <View className="bg-white rounded-3xl shadow-sm p-5 mt-3 border border-gray-100">
          <Text className="text-lg font-semibold text-gray-800 mb-2">
            Status
          </Text>

          <View className="flex-row justify-between items-center mb-3">
            <View className="flex-row items-center">
              <Ionicons
                name={isFixed ? "checkmark-circle" : "close-circle"}
                size={18}
                color={isFixed ? "#16a34a" : "#dc2626"}
              />
              <Text className="ml-2 text-base text-gray-700 font-medium">
                Fixed
              </Text>
            </View>
            <Switch
              value={isFixed}
              onValueChange={setIsFixed}
              trackColor={{ false: "#E5E7EB", true: "#A7F3D0" }}
              thumbColor={isFixed ? "#10B981" : "#f4f3f4"}
            />
          </View>

          <View className="flex-row justify-between items-center">
            <View className="flex-row items-center">
              <Ionicons
                name={isPublished ? "checkmark-circle" : "close-circle"}
                size={18}
                color={isPublished ? "#6366F1" : "#dc2626"}
              />
              <Text className="ml-2 text-base text-gray-700 font-medium">
                Published
              </Text>
            </View>
            <Switch
              value={isPublished}
              onValueChange={setIsPublished}
              trackColor={{ false: "#E5E7EB", true: "#C7D2FE" }}
              thumbColor={isPublished ? "#6366F1" : "#f4f3f4"}
            />
          </View>
        </View>

        {/* Remarks */}
        <View className="bg-white rounded-3xl shadow-sm p-5 mt-3 border border-gray-100">
          <Text className="text-lg font-semibold text-gray-800 mb-2">
            Remarks by Developer
          </Text>
          <TextInput
            value={remark}
            onChangeText={setRemark}
            placeholder="Add developer notes or update details..."
            multiline
            textAlignVertical="top"
            placeholderTextColor="#9ca3af"
            className="bg-gray-50 text-gray-900 rounded-2xl p-4 min-h-[120px] border border-gray-100"
          />
        </View>

        {/* Save Button */}
        <TouchableOpacity
          className="mt-4"
          activeOpacity={0.9}
          onPress={handleUpdate}
        >
          <View className="p-3 rounded-2xl shadow-md bg-indigo-600">
            <Text className="text-white text-center text-lg font-semibold tracking-wide">
              Save Changes
            </Text>
          </View>
        </TouchableOpacity>

        {/* Image Section */}
        <View className="rounded-3xl overflow-hidden shadow-sm bg-white border border-gray-100 mt-4 mb-10">
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={{
                width: "100%",
                height: 280,
                borderRadius: 16,
              }}
              resizeMode="contain"
            />
          ) : (
            <View className="w-full h-64 bg-gray-100 items-center justify-center">
              <Ionicons name="image-outline" size={48} color="#9ca3af" />
              <Text className="text-gray-500 mt-2 text-sm">
                No Image Available
              </Text>
            </View>
          )}
        </View>
      </KeyboardAwareScrollView>
    </View>
  );
}
