import React, { useState, useContext } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons, Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import moment from "moment";
import api from "../lib/api";
import { AuthContext } from "@/context/AuthContext";

const UserDetail = () => {
  const auth = useContext(AuthContext);
  const token = auth?.token;
  const { user } = useLocalSearchParams();
  const router = useRouter();
  const userData = user ? JSON.parse(user as string) : {};

  // ⭐ Mock data for ratings (replace with API data)
  const [ratings, setRatings] = useState(userData.ratings || []);

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [newStars, setNewStars] = useState<number | null>(null);
  const [newNote, setNewNote] = useState("");

  // Calculate average stars
  const averageStars =
    ratings.length > 0
      ? (
          ratings.reduce((sum: any, r: any) => sum + (r.stars || 0), 0) /
          ratings.filter((r: any) => r.stars).length
        ).toFixed(1)
      : "N/A";

  const handleSubmit = () => {
    if (!newStars && !newNote.trim()) return;

    const newEntry = {
      stars: newStars,
      note: newNote.trim(),
      givenBy: { username: "You" }, // replace with logged-in user
      createdAt: new Date(),
    };

    setRatings((prev: any) => [newEntry, ...prev]);
    setNewStars(null);
    setNewNote("");
    setModalVisible(false);

    // TODO: send API request here (POST /:userId/rate)
  };

  // const handleSubmit = async() => {
  //   if (!newStars && !newNote.trim() ) return;
    
  // }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <LinearGradient
        colors={["#6366F1", "#8B5CF6"]}
        className="pt-16 pb-6 px-4 flex-row items-center justify-between"
      >
        <TouchableOpacity
          onPress={() => router.push("/masterUserDirectory")}
          className="flex-row items-center"
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
          <Text className="text-xl font-bold text-white ml-4">
            User Details
          </Text>
        </TouchableOpacity>
      </LinearGradient>

      {/* Body */}
      <ScrollView className="flex-1 p-4">
        <View className="bg-white rounded-2xl shadow-lg p-6 mb-4">
          {/* Name + Role */}
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-xl font-bold text-gray-900">
              {userData.individualName || "Unnamed"}
            </Text>
            <View className="bg-indigo-100 px-3 py-1 rounded-full">
              <Text className="text-indigo-700 text-xs font-semibold">
                {userData.role}
              </Text>
            </View>
          </View>

          {/* Firm + Designation */}
          <Text className="text-base text-gray-700 mb-2">
            {userData.designation} @ {userData.firmName}
          </Text>

          {/* Contact Info */}
          {userData.phone && (
            <View className="flex-row items-center mb-2">
              <Ionicons name="call-outline" size={16} color="#6B7280" />
              <Text className="ml-2 text-gray-700">{userData.phone}</Text>
            </View>
          )}

          {userData.email && (
            <View className="flex-row items-center mb-2">
              <Ionicons name="mail-outline" size={16} color="#6B7280" />
              <Text className="ml-2 text-gray-700">{userData.email}</Text>
            </View>
          )}

          {/* Created Date */}
          {userData.createdAt && (
            <Text className="text-xs text-gray-400">
              Added {moment(userData.createdAt).fromNow()}
            </Text>
          )}
        </View>

        {/* ⭐ Average Rating */}
        <View className="bg-white rounded-2xl shadow-lg p-6 mb-4">
          <Text className="text-lg font-bold text-gray-800 mb-2">
            Overall Rating
          </Text>
          <View className="flex-row items-center">
            <Ionicons name="star" size={20} color="#FACC15" />
            <Text className="ml-2 text-gray-700 text-lg font-semibold">
              {averageStars} / 5
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => setModalVisible(true)}
            className="mt-3 bg-indigo-500 px-4 py-2 rounded-xl"
          >
            <Text className="text-white text-center font-semibold">
              Add Rating / Note
            </Text>
          </TouchableOpacity>
        </View>

        {/* 📜 Activity Log */}
        <View className="bg-white rounded-2xl shadow-lg p-6 mb-20">
          <Text className="text-lg font-bold text-gray-800 mb-3">
            Activity Log
          </Text>
          {ratings.length === 0 ? (
            <Text className="text-gray-500 italic">
              No ratings or notes yet.
            </Text>
          ) : (
            ratings.map((r: any, idx: any) => (
              <View key={idx} className="mb-4 border-b border-gray-200 pb-2">
                {r.stars && (
                  <View className="flex-row items-center mb-1">
                    {[...Array(r.stars)].map((_, i) => (
                      <Ionicons key={i} name="star" size={16} color="#FACC15" />
                    ))}
                  </View>
                )}
                {r.note && <Text className="text-gray-700">{r.note}</Text>}
                <Text className="text-xs text-gray-400 mt-1">
                  by {r.givenBy?.username || "Unknown"} •{" "}
                  {moment(r.createdAt).fromNow()}
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* ⭐ Modal */}
      <Modal
        transparent
        visible={modalVisible}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center px-6">
          <View className="bg-white w-full rounded-2xl p-6">
            <Text className="text-lg font-bold mb-4">Add Rating / Note</Text>

            {/* Stars */}
            <View className="flex-row mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => setNewStars(star)}
                  className="mr-2"
                >
                  <Ionicons
                    name={
                      newStars && newStars >= star ? "star" : "star-outline"
                    }
                    size={28}
                    color="#FACC15"
                  />
                </TouchableOpacity>
              ))}
            </View>

            {/* Note Input */}
            <TextInput
              placeholder="Write a note..."
              value={newNote}
              onChangeText={setNewNote}
              className="border border-gray-300 rounded-lg p-2 mb-4"
              multiline
            />

            {/* Buttons */}
            <View className="flex-row justify-end">
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                className="px-4 py-2 mr-2"
              >
                <Text className="text-gray-500">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSubmit}
                className="bg-indigo-500 px-4 py-2 rounded-lg"
              >
                <Text className="text-white font-semibold">Submit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default UserDetail;
