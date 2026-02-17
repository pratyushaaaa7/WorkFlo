import { AuthContext } from "@/context/AuthContext";
import {
  ArrowLeft01Icon,
  Delete03Icon,
  Edit03Icon,
  PencilEdit02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import moment from "moment";
import React, { useCallback, useContext, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import { KeyboardStickyView } from "react-native-keyboard-controller";
import ReactNativeModal from "react-native-modal";
import Toast from "react-native-toast-message";
import VeryBlackStar from "../assets/images/Revised Black Star.png";
import DeleteConfirmationModal from "../components/DeleteConfirmationModal";
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

  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // fetch latest user details from backend using ID
  useFocusEffect(
    useCallback(() => {
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
    }, [token, preloadedUser?._id]),
  );

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

  // 🗑️ Delete User
  const handleDelete = async () => {
    if (!token || deleting) return;
    setDeleting(true);
    try {
      await api.delete(`/user-directory/${userData._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      Toast.show({
        type: "success",
        text1: "Success",
        text2: "User deleted successfully",
        position: "bottom",
      });

      setDeleteModalVisible(false);
      // Redirect with refresh signal
      router.replace({
        pathname: "/centralUserDirectory" as any,
        params: { refresh: Date.now().toString() },
      });
    } catch (err) {
      console.error("Error deleting user:", err);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to delete user",
      });
    } finally {
      setDeleting(false);
    }
  };

  // Helper render for Info Fields
  const renderInfoField = (
    label: string,
    value: string | undefined,
    isFullWidth = false,
    copyable = false,
  ) => (
    <View className={`mb-5 ${isFullWidth ? "w-full" : "w-[48%]"}`}>
      <Text className="text-[#454545] dark:text-[#919191] text-xs font-poppins mb-1">
        {label}
      </Text>
      {copyable && value ? (
        <TouchableOpacity
          activeOpacity={0.7}
          onLongPress={async () => {
            await Clipboard.setStringAsync(value);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            Toast.show({
              type: "success",
              text1: "Copied",
              text2: `${label} copied to clipboard`,
              position: "bottom",
            });
          }}
        >
          <Text
            className="text-black dark:text-white text-sm font-poppinsMedium"
            numberOfLines={3}
          >
            {value}
          </Text>
        </TouchableOpacity>
      ) : (
        <Text
          className="text-black dark:text-white text-sm font-poppinsMedium"
          numberOfLines={3}
        >
          {value || "N/A"}
        </Text>
      )}
    </View>
  );

  return (
    <View className="flex-1 bg-[#FBFCFD] dark:bg-black">
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />

      {/* 🔹 CUSTOM HEADER */}
      <View className="flex-row items-center justify-between px-4 py-6 pt-16 bg-[#FBFCFD] dark:bg-black  ">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <HugeiconsIcon
              icon={ArrowLeft01Icon}
              size={24}
              color={isDarkMode ? "#D2D2D2" : "#454545"}
            />
          </TouchableOpacity>
          <Text className="text-xl font-dmSemiBold text-black dark:text-white">
            Contact Details
          </Text>
        </View>
        <View className="flex-row items-center pr-3 gap-5">
          <TouchableOpacity onPress={() => setDeleteModalVisible(true)}>
            <HugeiconsIcon
              icon={Delete03Icon}
              size={24}
              strokeWidth={1.5}
              color={isDarkMode ? "#D2D2D2" : "#454545"}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: "/createUser" as any,
                params: { userData: JSON.stringify(userData) },
              })
            }
          >
            <HugeiconsIcon
              icon={PencilEdit02Icon}
              size={24}
              strokeWidth={1.5}
              color={isDarkMode ? "#D2D2D2" : "#454545"}
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
              <View className="flex-row justify-between w-full">
                {renderInfoField(
                  "Full Name",
                  userData?.salutation
                    ? `${userData.salutation} ${userData.individualName}`
                    : userData?.gender?.toLowerCase() === "male"
                      ? `Mr. ${userData?.individualName}`
                      : userData?.gender?.toLowerCase() === "female"
                        ? `Ms. ${userData?.individualName}`
                        : userData?.individualName,
                )}
                {renderInfoField("Role", userData?.role)}
              </View>
              <View className="h-[1px] bg-gray-200 dark:bg-[#413E47] w-full mb-3" />

              {/* Row 2 */}
              <View className="flex-row justify-between w-full">
                {renderInfoField("Firm", userData?.firmName)}
                {renderInfoField(
                  "Designation",
                  userData?.designationList?.length
                    ? userData.designationList[0]
                    : userData?.designation,
                )}
              </View>
              <View className="h-[1px] bg-gray-200 dark:bg-[#413E47] w-full mb-3" />

              {/* Row 3 */}
              <View className="flex-row justify-between w-full">
                {renderInfoField(
                  "Email",
                  userData?.emailList?.length
                    ? userData.emailList[0]
                    : userData?.email,
                  false,
                  true,
                )}
                {renderInfoField(
                  "Mobile",
                  (() => {
                    const numbers = [
                      ...(userData?.officialNumberList || []),
                      ...(userData?.mobileNumberList || []),
                      userData?.mobileNumber,
                    ].filter((n) => n && n.trim() !== "");
                    const uniqueNumbers = [...new Set(numbers)];
                    return uniqueNumbers.length > 0
                      ? uniqueNumbers.join(", ")
                      : "N/A";
                  })(),
                  false,
                  true,
                )}
              </View>
              <View className="h-[1px] bg-gray-200 dark:bg-[#413E47] w-full mb-3" />

              {/* Full Width Rows */}
              {renderInfoField(
                "Expertise",
                userData?.expertiseList?.length
                  ? userData.expertiseList.join(", ")
                  : "N/A",
                true,
              )}
              <View className="h-[1px] bg-gray-200 dark:bg-[#413E47] w-full mb-3" />

              {renderInfoField(
                "Address",
                userData?.addressList?.length
                  ? userData.addressList.join(", ")
                  : "N/A",
                true,
              )}
              <View className="h-[1px] bg-gray-200 dark:bg-[#413E47] w-full mb-3" />

              <View className="flex-row justify-between w-full">
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

              {userData?.projects && userData.projects.length > 0 && (
                <>
                  <View className="h-[1px] bg-gray-200 dark:bg-[#413E47] w-full mb-3" />
                  <View className="w-full">
                    <Text className="text-[#454545] dark:text-[#919191] text-xs font-poppins mb-2">
                      Associated Projects
                    </Text>
                    {userData.projects.map((proj: any, index: number) => (
                      <View
                        key={index}
                        className="flex-row items-start mb-1 px-1"
                      >
                        <Text className="text-black dark:text-white mr-2">
                          •
                        </Text>
                        <Text className="text-black dark:text-white text-sm font-poppinsMedium flex-1">
                          {proj.projectName ||
                            proj.projectCode ||
                            "Unnamed Project"}
                        </Text>
                      </View>
                    ))}
                  </View>
                </>
              )}
            </View>
          </View>

          {/* 🔹 RATINGS SECTION (Only if reviews exist) */}
          {ratings && ratings.length > 0 && (
            <View className="bg-[#F0F3F7] dark:bg-[#1A1A1A] rounded-2xl p-5 mb-6">
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
                      <View
                        key={starCount}
                        className="flex-row items-center h-4"
                      >
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
                  <Text className="text-white font-dmMedium ml-3">
                    Write a review
                  </Text>
                </TouchableOpacity>
              </LinearGradient>
            </View>
          )}

          {ratings && ratings.length > 0 && (
            <Text className="text-lg font-dmSemiBold text-black dark:text-white mb-3">
              Review
            </Text>
          )}

          {ratings &&
            ratings.length > 0 &&
            ratings.map((r: any, idx: number) => (
              <View
                key={idx}
                className="bg-[#F0F3F7] dark:bg-[#1A1A1A] rounded-2xl p-4 mb-3"
              >
                <View className="flex-row items-start">
                  {/* Left Column: Avatar */}
                  <View className="w-11 h-11 rounded-full bg-[#0073CB] items-center justify-center mr-3 mt-1">
                    <Text className="text-white font-poppinsMedium text-base">
                      {r.givenBy?.fullName
                        ? r.givenBy.fullName
                            .trim()
                            .split(/\s+/)
                            .slice(0, 2)
                            .map((name: string) => name[0])
                            .join("")
                            .toUpperCase()
                        : "UN"}
                    </Text>
                  </View>

                  {/* Right Column: Content */}
                  <View className="flex-1">
                    <View className="flex-row justify-between items-start">
                      <Text className="text-black dark:text-white font-dmSemiBold text-base flex-1 mr-2">
                        {r.givenBy?.fullName || "Unknown"}
                      </Text>
                      <Text className="text-[#6D6D6D] dark:text-[#919191] text-sm font-dmMedium">
                        {moment(r.createdAt).format("DD MMM YYYY")}
                      </Text>
                    </View>

                    {/* Stars Rating - Only show given stars */}
                    <View className="flex-row mt-1 mb-2">
                      {[...Array(r.stars || 0)].map((_, i) => (
                        <Image
                          key={i}
                          source={
                            isDarkMode
                              ? require("../assets/images/Rating White Star.png")
                              : require("../assets/images/Rating Black Star.png")
                          }
                          style={{ width: 12, height: 12, marginRight: 2 }}
                          resizeMode="contain"
                        />
                      ))}
                    </View>

                    {r.note && (
                      <Text className="text-[#1C1C1C] dark:text-[#D2D2D2] text-sm font-poppins leading-5">
                        {r.note}
                      </Text>
                    )}
                  </View>
                </View>
              </View>
            ))}
          <View className="h-24" />
        </ScrollView>
      )}

      {/* 🔹 FIXED FOOTER BUTTON (Only if NO reviews exist) */}
      {!loading && (!ratings || ratings.length === 0) && (
        <View className="absolute bottom-12 left-4 right-4">
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
              <Text className="text-white font-dmMedium ml-3">
                Write a review
              </Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      )}

      {/* 🔹 ADD RATING MODAL */}
      <ReactNativeModal
        isVisible={modalVisible}
        onBackdropPress={() => setModalVisible(false)}
        onSwipeComplete={() => setModalVisible(false)}
        swipeDirection={["down"]}
        style={{ margin: 0, justifyContent: "flex-end" }}
        backdropOpacity={0.4}
        animationIn="slideInUp"
        animationOut="slideOutDown"
        // useNativeDriver
        // useNativeDriverForBackdrop
        // swipeThreshold={50}
        // backdropTransitionOutTiming={0}
        propagateSwipe
        avoidKeyboard={false}
      >
        <KeyboardStickyView offset={{ closed: 0, opened: 0 }}>
          <View className="bg-[#FBFCFD] dark:bg-[#1A1A1A] w-full rounded-t-[32px] px-6 pt-4 pb-10 shadow-xl">
            {/* Top Indicator */}
            <View className="items-center mb-4">
              <View className="w-16 h-1 bg-black dark:bg-gray-700 rounded-full" />
            </View>

            <Text className="text-xl font-dmSemiBold text-center text-black dark:text-white mb-3">
              Write a review
            </Text>

            <View className="h-[1px] bg-[#E0E5EB] dark:bg-[#413E47] w-full mb-5" />

            {/* Star Rating Section */}
            <View className="mb-6">
              <Text className="text-base font-dmSemiBold text-black dark:text-white mb-3">
                Your Rating
              </Text>
              <View className="flex-row justify-between">
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => setNewStars(star)}
                    className={`w-[18%] aspect-square border-[#E0E5EB] dark:border-[#413E47] rounded-2xl border items-center justify-center ${
                      newStars && newStars >= star
                      // ? "border-[#5B4CCC] bg-[#F5F4FF] dark:bg-[#2B2B2B]"
                      // : "border-[#E0E5EB] dark:border-[#2B2B2B]"
                    }`}
                  >
                    <Image
                      source={
                        newStars && newStars >= star
                          ? isDarkMode
                            ? require("../assets/images/Rating White Star.png")
                            : VeryBlackStar
                          : isDarkMode
                            ? require("../assets/images/Rating White Star.png")
                            : VeryBlackStar
                      }
                      style={{
                        width: 26,
                        height: 26,
                        opacity: newStars && newStars >= star ? 1 : 0.2,
                      }}
                      resizeMode="contain"
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Review Input Section */}
            <View className="mb-8">
              <Text className="text-base font-dmSemiBold text-black dark:text-white mb-3">
                Your Review
              </Text>
              <View className="border border-[#E5E7EB] dark:border-[#333] rounded-2xl">
                <TextInput
                  placeholder="Provide a detailed review..."
                  placeholderTextColor="#454545"
                  value={newNote}
                  onChangeText={setNewNote}
                  multiline
                  maxLength={200}
                  numberOfLines={4}
                  className="text-gray-700 dark:text-gray-200 text-sm font-poppins h-20 textAlignVertical-top"
                  style={{ textAlignVertical: "top" }}
                />
                <Text className="text-right text-xs text-gray-400 font-poppins mr-3 ">
                  {newNote.length}/200
                </Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View className="flex-row justify-between gap-4">
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                className="flex-1 py-4 rounded-2xl border border-[#E5E7EB] dark:border-[#333] items-center"
              >
                <Text className="text-[#454545] dark:text-[#919191] font-dmMedium text-base">
                  Cancel
                </Text>
              </TouchableOpacity>

              {newStars && newStars > 0 && newNote.trim().length > 0 ? (
                <View className="flex-1">
                  <LinearGradient
                    colors={["#5B4CCC", "#6347C2", "#8056D1"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{ borderRadius: 16 }}
                  >
                    <TouchableOpacity
                      onPress={handleSubmit}
                      className="py-4 items-center"
                    >
                      <Text className="text-white font-dmMedium text-base">
                        Submit
                      </Text>
                    </TouchableOpacity>
                  </LinearGradient>
                </View>
              ) : (
                <TouchableOpacity
                  disabled
                  className="flex-1 py-4 rounded-2xl bg-[#C4C4C4] dark:bg-[#333] items-center"
                >
                  <Text className="text-white/60 font-dmMedium text-base">
                    Submit
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </KeyboardStickyView>
      </ReactNativeModal>

      {/* 🔹 DELETE CONFIRMATION MODAL */}
      <DeleteConfirmationModal
        isVisible={deleteModalVisible}
        onClose={() => setDeleteModalVisible(false)}
        onConfirm={handleDelete}
        loading={deleting}
      />
    </View>
  );
};

export default UserDetail;
