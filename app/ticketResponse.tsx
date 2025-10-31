import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  Switch,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../context/AuthContext";
import api from "@/lib/api";

export default function TicketDetails() {
  const router = useRouter();
  const { token } = useAuth();
const {
  id,
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

//   console.log(id);

const parseBool = (v: any) =>
  Array.isArray(v) ? String(v[0]) === "true" : v === true || String(v) === "true";

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
        Alert.alert("✅ Success", "Ticket updated successfully!");
        router.push("/(drawer)/appSupport");
      }
    } catch (err) {
      Alert.alert("❌ Error", "Failed to update ticket");
      console.error(err);
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <LinearGradient
        colors={["#6366F1", "#8B5CF6"]}
        className="pb-24 rounded-b-3xl"
      >
        <View className="pt-16 pb-6 px-4 flex-row items-center justify-between">
          <TouchableOpacity
            onPress={() => router.push("/(drawer)/appSupport")}
            activeOpacity={0.7}
            className="bg-white/20 p-2 rounded-full"
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text className="text-xl font-semibold text-white">
            Ticket Details
          </Text>
          <View style={{ width: 32 }} />
        </View>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          padding: 20,

          paddingBottom: 100,
        }}
      >
        {/* Info Card */}
        <View className="bg-white p-5 rounded-3xl shadow-sm mb-6">
          <Text className="text-xl font-bold text-gray-900 mb-1">{type}</Text>
          <Text className="text-sm text-indigo-600 mb-2">{relatedPage}</Text>
          <Text className="text-gray-700 leading-5">{description}</Text>

          <View className="mt-4 border-t border-gray-100 pt-3">
            <Text className="text-sm text-gray-500">
              Raised by:{" "}
              <Text className="font-semibold text-gray-800">{raisedBy}</Text>
            </Text>
            <Text className="text-xs text-gray-400 mt-1">{date}</Text>
          </View>
        </View>

        {/* Status Toggles */}
        <View className="bg-white p-5 rounded-3xl shadow-sm mb-6">
          <Text className="text-lg font-semibold text-gray-800 mb-4">
            Status
          </Text>

          <View className="flex-row justify-between items-center mb-4">
            <Text className="font-medium text-gray-700">Fixed</Text>
            <Switch
              value={isFixed}
              onValueChange={setIsFixed}
              trackColor={{ false: "#E5E7EB", true: "#A7F3D0" }}
              thumbColor={isFixed ? "#10B981" : "#f4f3f4"}
            />
          </View>

          <View className="flex-row justify-between items-center">
            <Text className="font-medium text-gray-700">Published</Text>
            <Switch
              value={isPublished}
              onValueChange={setIsPublished}
              trackColor={{ false: "#E5E7EB", true: "#C7D2FE" }}
              thumbColor={isPublished ? "#6366F1" : "#f4f3f4"}
            />
          </View>
        </View>

        {/* Remarks */}
        <View className="bg-white p-5 rounded-3xl shadow-sm mb-6">
          <Text className="text-lg font-semibold text-gray-800 mb-3">
            Remarks
          </Text>
          <TextInput
            value={remark}
            onChangeText={setRemark}
            placeholder="Add any notes or updates..."
            multiline
            textAlignVertical="top"
            placeholderTextColor={"#888"}
            className="text-gray-900 bg-gray-50 rounded-2xl p-4 min-h-[120px] border border-gray-100"
          />
        </View>

        {/* Save Button */}
        <TouchableOpacity activeOpacity={0.8} onPress={handleUpdate}>
          <View className="p-4 rounded-2xl shadow-md bg-indigo-600">
            <Text className="text-white text-center text-lg font-semibold tracking-wide">
              Save Changes
            </Text>
          </View>
        </TouchableOpacity>

        {/* Image */}
        <View className="rounded-3xl overflow-hidden shadow-lg py-2 bg-white mb-6">
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={{ width: "100%", height: 400, borderRadius: 10 }}
              resizeMode="contain"
            />
          ) : (
            <View className="w-full h-64 bg-gray-200 items-center justify-center">
              <Ionicons name="image-outline" size={50} color="#a3a3a3" />
              <Text className="text-gray-500 mt-2">No Image Available</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
