import { AuthContext } from "@/context/AuthContext";
import {
  ArrowLeft02Icon,
  Delete02Icon,
  Delete03Icon,
  Edit02Icon,
  PencilEdit02Icon,
  Edit03Icon,
  StarIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import moment from "moment";
import React, { useContext, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import api from "../lib/api";

const UserDetail = () => {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";
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
        // console.log("fetchedUser", fetchedUser);
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
        { headers: { Authorization: `Bearer ${token}` } },
      );

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

  // Helper render for Info Fields
  const renderInfoField = (
    label: string,
    value: string | undefined,
    isFullWidth = false,
  ) => (
    <View className={`mb-5 ${isFullWidth ? "w-full" : "w-[48%]"}`}>
      <Text className="text-[#454545] dark:text-[#919191] text-xs font-poppins mb-1">
        {label}
      </Text>
      <Text
        className="text-black dark:text-white text-sm font-poppinsMedium"
        numberOfLines={2}
      >
        {value || "N/A"}
      </Text>
    </View>
  );

  return (
    <View className="flex-1 bg-[#FBFCFD] dark:bg-black">
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />

      {/* 🔹 CUSTOM HEADER */}
      <View className="flex-row items-center justify-between px-4 py-3 pt-16 bg-[#FBFCFD] dark:bg-black  ">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <HugeiconsIcon
              icon={ArrowLeft02Icon}
              size={24}
              color={isDarkMode ? "#fff" : "#000"}
            />
          </TouchableOpacity>
          <Text className="text-xl font-dmSemiBold text-black dark:text-white">
            Contact Details
          </Text>
        </View>
        <View className="flex-row items-center gap-3">
          <TouchableOpacity>
            <HugeiconsIcon
              icon={Delete03Icon}
              size={22}
              color={isDarkMode ? "#fff" : "#000"}
            />
          </TouchableOpacity>
          <TouchableOpacity>
            <HugeiconsIcon
              icon={PencilEdit02Icon}
              size={22}
              color={isDarkMode ? "#fff" : "#000"}
            />
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#6366F1" />
        </View>
      ) : (
        <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
          {/* 🔹 INFO CARD */}
          <View className="bg-[#F0F3F7] dark:bg-[#1A1A1A] rounded-2xl p-5 mb-4">
            <View className="flex-row flex-wrap justify-between">
              {/* Row 1 */}
              {renderInfoField(
                "Full Name",
                userData?.gender?.toLowerCase() === "male"
                  ? `Mr. ${userData?.individualName}`
                  : userData?.gender?.toLowerCase() === "female"
                    ? `Ms. ${userData?.individualName}`
                    : userData?.individualName,
              )}
              {renderInfoField("Role", userData?.role)}

              {/* Row 2 */}
              {renderInfoField("Firm", userData?.firmName)}
              {renderInfoField(
                "Designation",
                userData?.designationList?.length
                  ? userData.designationList[0]
                  : userData?.designation,
              )}

              {/* Row 3 */}
              {renderInfoField(
                "Email",
                userData?.emailList?.length
                  ? userData.emailList[0]
                  : userData?.email,
                false,
              )}
              {renderInfoField(
                "Mobile",
                userData?.mobileNumberList?.length
                  ? userData.mobileNumberList[0]
                  : "N/A",
                false,
              )}

              {/* Full Width Rows */}
              {renderInfoField(
                "Expertise",
                userData?.expertiseList?.length
                  ? userData.expertiseList.join(", ")
                  : "N/A",
                true,
              )}

              {renderInfoField(
                "Address",
                userData?.addressList?.length
                  ? userData.addressList.join(", ")
                  : "N/A",
                true,
              )}

              {renderInfoField(
                "Created By",
                userData?.createdBy?.fullName || "N/A",
                false,
              )}

              {renderInfoField(
                "Created On",
                userData?.createdAt
                  ? moment(userData.createdAt).format("DD MMM YYYY, hh:mm A")
                  : "N/A",
                false,
              )}
            </View>
          </View>

          {/* 🔹 RATINGS & REVIEWS SECTION */}
          <View className="bg-[#F6F8FA] dark:bg-[#1A1A1A] rounded-2xl p-5 mb-6">
            {/* Rating Summary */}
            <View className="flex-row items-start mb-6">
              {/* Big Score */}
              <View className="w-[30%] items-start border-r border-[#413E47] dark:border-[#413E47] pr-4">
                <Text className="text-5xl font-dmBold text-black dark:text-white">
                  {userData.averageRating
                    ? userData.averageRating.toFixed(1)
                    : "0.0"}
                </Text>
                <Text className="text-gray-500 text-xs mt-1">Out of 5</Text>
              </View>

              <View className="flex-1 pl-6 gap-y-1.5">
                {[5, 4, 3, 2, 1].map((starCount) => {
                  const count = ratings.filter(
                    (r: any) => r.stars === starCount,
                  ).length;
                  const percentage =
                    ratings.length > 0 ? (count / ratings.length) * 100 : 0;
                  return (
                    <View key={starCount} className="flex-row items-center h-4">
                      <View className="flex-row w-[65px] justify-end mr-3">
                        {[...Array(starCount)].map((_, i) => (
                          <Image
                            key={i}
                            source={
                              isDarkMode
                                ? require("../assets/images/Rating White Star.png")
                                : require("../assets/images/Rating Black Star.png")
                            }
                            style={{ width: 10, height: 10, marginLeft: 2 }}
                            resizeMode="contain"
                          />
                        ))}
                      </View>
                      <View className="flex-1 h-1.5 bg-[#D2D2D2] dark:bg-[#4E4E4E] rounded-full overflow-hidden">
                        <View
                          className="h-full bg-black dark:bg-white rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>

            <LinearGradient
              colors={["#5B4CCC", "#6347C2", "#8056D1"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ borderRadius: 16 }}
            >
              <TouchableOpacity
                onPress={() => setModalVisible(true)}
                activeOpacity={0.85}
                className="flex-row items-center justify-center py-4 rounded-2xl"
              >
                <HugeiconsIcon icon={Edit03Icon} size={18} color="white" />
                <Text className="text-white font-dmMedium  ml-3">
                  Write a review
                </Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>

          <Text className="text-lg font-dmBold text-black dark:text-white mb-3">
            Review
          </Text>

          {ratings?.length === 0 ? (
            <Text className="text-gray-400 text-sm italic mb-10">
              No reviews yet.
            </Text>
          ) : (
            ratings.map((r: any, idx: number) => (
              <View
                key={idx}
                className="bg-[#F6F8FA] dark:bg-[#1A1A1A] rounded-2xl p-4 mb-3"
              >
                <View className="flex-row justify-between items-start mb-2">
                  <View className="flex-row items-center">
                    {/* Avatar */}
                    <View className="w-10 h-10 rounded-full bg-[#007AFF] items-center justify-center mr-3">
                      <Text className="text-white font-bold text-sm">
                        {r.givenBy?.username
                          ? r.givenBy.username.substring(0, 2).toUpperCase()
                          : "UN"}
                      </Text>
                    </View>
                    <View>
                      <Text className="text-black dark:text-white font-dmSemiBold text-sm">
                        {r.givenBy?.username || "Unknown"}
                      </Text>
                      <View className="bg-[#FF4444] rounded px-1.5 py-0.5 self-start mt-0.5 flex-row items-center">
                        <Text className="text-white text-[10px] font-bold mr-0.5">
                          {r.stars}
                        </Text>
                        <HugeiconsIcon
                          icon={StarIcon}
                          size={8}
                          color="white"
                          variant="solid"
                        />
                      </View>
                    </View>
                  </View>
                  <Text className="text-gray-400 text-xs font-poppins">
                    {moment(r.createdAt).format("DD MMM YYYY")}
                  </Text>
                </View>
                {r.note && (
                  <Text className="text-gray-600 dark:text-gray-300 text-xs font-poppins leading-5 mt-1">
                    {r.note}
                  </Text>
                )}
              </View>
            ))
          )}
          <View className="h-10" />
        </ScrollView>
      )}

      {/* 🔹 ADD RATING MODAL */}
      <Modal
        transparent
        visible={modalVisible}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/40 px-4">
          <View className="bg-white dark:bg-[#1E1E1E] w-full max-w-md rounded-3xl p-6 shadow-xl">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-xl font-bold text-gray-900 dark:text-white">
                Add Rating
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <HugeiconsIcon icon={Delete02Icon} size={24} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            <View className="flex-row justify-center mb-6">
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => setNewStars(star)}
                  className="mx-1"
                >
                  <HugeiconsIcon
                    icon={StarIcon}
                    size={32}
                    color={newStars && newStars >= star ? "#FACC15" : "#E5E7EB"}
                    variant="solid"
                  />
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              placeholder="Write your feedback..."
              placeholderTextColor="#9CA3AF"
              value={newNote}
              onChangeText={setNewNote}
              multiline
              numberOfLines={4}
              className="border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-gray-700 dark:text-gray-200 mb-6 bg-gray-50 dark:bg-[#252525]"
            />

            <TouchableOpacity
              onPress={handleSubmit}
              className="w-full py-3.5 rounded-xl bg-[#5B4CCC] shadow-md items-center"
            >
              <Text className="text-white font-semibold text-base">
                Submit Review
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default UserDetail;
