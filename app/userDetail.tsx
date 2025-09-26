import React, { useState, useContext, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Ionicons,
  MaterialIcons,
  FontAwesome5,
  Feather,
} from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import moment from "moment";
import api from "../lib/api";
import { AuthContext } from "@/context/AuthContext";

const UserDetail = () => {
  const { token } = useContext(AuthContext) || {};
  const { user } = useLocalSearchParams();
  const router = useRouter();

  // parse preloaded user from params (for instant display)
  const preloadedUser = user ? JSON.parse(user as string) : {};

  // state
  const [userData, setUserData] = useState<any>(preloadedUser);
  const [ratings, setRatings] = useState(preloadedUser?.ratings || []);
  const [loading, setLoading] = useState(false);

  // modal states
  const [modalVisible, setModalVisible] = useState(false);
  const [newStars, setNewStars] = useState<number | null>(null);
  const [newNote, setNewNote] = useState("");

  // fetch latest user details from backend using ID
  useEffect(() => {
    const fetchUser = async () => {
      if (!token || !preloadedUser?._id) return;
      setLoading(true);
      try {
        const res = await api.get(`/user-directory/${preloadedUser._id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const fetchedUser = res?.data || preloadedUser;

        setUserData(fetchedUser);
        setRatings(fetchedUser?.ratings || []);
      } catch (err) {
        console.error("Error fetching user:", err);
        setUserData(preloadedUser);
        setRatings(preloadedUser?.ratings || []);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [token, preloadedUser?._id]);

  // submit new rating/note
  const handleSubmit = async () => {
    if (!newStars && !newNote.trim()) return;

    if (!token) {
      alert("You must be logged in");
      return;
    }

    try {
      const res = await api.post(
        `/user-directory/${userData._id}/rate`,
        { stars: newStars, note: newNote.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // console.log(res?.data?.data)

      const updatedUser = res?.data?.data || [];
      if (!updatedUser) return;
      setUserData(updatedUser); // update main user data
      setRatings(updatedUser?.ratings || []);
      setNewStars(null);
      setNewNote("");
      setModalVisible(false);
    } catch (err) {
      console.error("Error submitting rating/note:", err);
      alert("Something went wrong");
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <LinearGradient colors={["#6366F1", "#8B5CF6"]}>
        <View className="pt-16 pb-6 px-4 flex-row items-center justify-between">
          <TouchableOpacity
            // onPress={() => router.push("/masterUserDirectory")}
            onPress={() => router.back()}
            className="flex-row items-center"
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
            <Text className="text-xl font-bold text-white ml-4">
              User Details
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#6366F1" />
          <Text className="mt-2 text-gray-500">Fetching User</Text>
        </View>
      ) : (
        <ScrollView className="flex-1 p-4">
          {/* User Info */}
          <View className="bg-white rounded-2xl shadow-lg p-5 mb-4">
            {/* Name + Role */}
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-xl font-bold text-gray-900">
                {userData?.individualName || "Unnamed"}
              </Text>
              <View className="bg-indigo-100 px-3 py-1 rounded-full">
                <Text className="text-indigo-700 text-xs font-semibold">
                  {userData?.role || "N/A"}
                </Text>
              </View>
            </View>

            {/* Role Description */}
            {userData?.roleDescription && (
              <Text className="text-sm text-gray-500 mb-3">
                {userData.roleDescription}
              </Text>
            )}

            {/* Info Fields */}
            <View className="gap-1">
              <Text className="text-base text-gray-700">
                <Text className="font-semibold">Designation: </Text>
                {userData?.designationList?.length
                  ? userData.designationList.join(", ")
                  : userData?.designation || "N/A"}
              </Text>

              <Text className="text-base text-gray-700">
                <Text className="font-semibold">Firm: </Text>
                {userData?.firmName || "N/A"}
              </Text>

              <Text className="text-base text-gray-700">
                <Text className="font-semibold">Expertise: </Text>
                {userData?.expertiseList?.length
                  ? userData.expertiseList.join(", ")
                  : "N/A"}
              </Text>

              <Text className="text-base text-gray-700">
                <Text className="font-semibold">Email: </Text>
                {userData?.emailList?.length
                  ? userData.emailList.join(", ")
                  : userData?.email || "N/A"}
              </Text>

              <Text className="text-base text-gray-700">
                <Text className="font-semibold">Mobile Number: </Text>
                {userData?.mobileNumberList?.length
                  ? userData.mobileNumberList.join(", ")
                  : "N/A"}
              </Text>

              <Text className="text-base text-gray-700">
                <Text className="font-semibold">Official Number: </Text>
                {userData?.officialNumberList?.length
                  ? userData.officialNumberList.join(", ")
                  : "N/A"}
              </Text>

              <Text className="text-base text-gray-700">
                <Text className="font-semibold">Address: </Text>
                {userData?.addressList?.length
                  ? userData.addressList.join(", ")
                  : "N/A"}
              </Text>
            </View>

            {/* Created At */}
            {userData?.createdAt && (
              <Text className="text-xs text-gray-400 mt-4">
                Created on{" "}
                {moment(userData.createdAt).format("DD MMM YYYY, hh:mm A")}
              </Text>
            )}
          </View>

          {/* Overall Rating */}
          <View className="bg-white rounded-2xl shadow-lg p-5 mb-4">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-lg font-bold text-gray-800">
                Overall Rating
              </Text>
              <TouchableOpacity
                onPress={() => setModalVisible(true)}
                className="bg-indigo-500 px-4 py-2 rounded-xl"
              >
                <Text className="text-white text-sm font-semibold">
                  Add Rating / Feedback
                </Text>
              </TouchableOpacity>
            </View>

            <View className="flex-row items-center">
              {userData.averageRating && userData.averageRating > 0 ? (
                <>
                  {[...Array(5)].map((_, i) => {
                    const fill = Math.min(
                      Math.max(userData.averageRating - i, 0),
                      1
                    );
                    return (
                      <View
                        key={i}
                        style={{
                          width: 20,
                          height: 20,
                          marginRight: 3,
                          overflow: "hidden",
                        }}
                      >
                        {/* Outline star */}
                        <Ionicons
                          name="star-outline"
                          size={20}
                          color="#FACC15"
                          style={{ position: "absolute" }}
                        />
                        {/* Filled star */}
                        <View
                          style={{
                            width: `${fill * 100}%`,
                            overflow: "hidden",
                          }}
                        >
                          <Ionicons name="star" size={20} color="#FACC15" />
                        </View>
                      </View>
                    );
                  })}
                  <Text className="ml-2 text-gray-700 text-base font-semibold">
                    {userData.averageRating.toFixed(1)} / 5
                  </Text>
                </>
              ) : (
                <Text className="text-gray-400 text-base italic">
                  No rating available
                </Text>
              )}
            </View>
          </View>

          {/* Activity Log */}
          <View className="bg-white rounded-2xl shadow-lg pt-2 mb-20">
            <Text className="text-xl p-4 font-bold text-gray-800 ">
              Feedback Log
            </Text>
            {ratings?.length === 0 ? (
              <Text className="text-gray-500 p-4 italic mb-5">
                No ratings or feedback yet.
              </Text>
            ) : (
              ratings.map((r: any, idx: number) => (
                <View key={idx} className=" px-5 py-4 border-t border-gray-200">
                  {r.stars && (
                    <View className="flex-row items-center mb-1">
                      {[...Array(r.stars)].map((_, i) => (
                        <MaterialIcons
                          key={i}
                          name="star"
                          size={16}
                          color="#FACC15"
                        />
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
      )}

      {/* Add Rating Modal */}
      <Modal
        transparent
        visible={modalVisible}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/40 px-4">
          <View className="bg-white w-full max-w-md rounded-3xl p-6 shadow-lg">
            {/* Header */}
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-xl font-bold text-gray-900">
                Add Rating & Feedback
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            {/* Star Rating */}
            <View className="flex-row justify-center mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => setNewStars(star)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={
                      newStars && newStars >= star ? "star" : "star-outline"
                    }
                    size={36}
                    color="#FACC15"
                    className="mx-1"
                  />
                </TouchableOpacity>
              ))}
            </View>

            {/* Note Input */}
            <TextInput
              placeholder="Write a feedback..."
              value={newNote}
              onChangeText={setNewNote}
              multiline
              numberOfLines={4}
              className="border border-gray-300 rounded-xl p-3 text-gray-700 mb-6 bg-gray-50"
              placeholderTextColor="#9CA3AF"
            />

            {/* Action Buttons */}
            <View className="flex-row justify-end gap-3">
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                className="px-4 py-2 rounded-lg bg-gray-200"
              >
                <Text className="text-gray-700 font-semibold">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSubmit}
                className="px-4 py-2 rounded-lg bg-indigo-600 shadow-md"
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
