import { Edit03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { LinearGradient } from "expo-linear-gradient";
import moment from "moment";
import { Skeleton } from "moti/skeleton";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import { KeyboardStickyView } from "react-native-keyboard-controller";
import ReactNativeModal from "react-native-modal";
import Toast from "react-native-toast-message";
import VeryBlackStar from "../../assets/images/Revised Black Star.png";
import GlobalAvatar from "../../components/GlobalAvatar";
import { AuthContext } from "../../context/AuthContext";
import api from "../../lib/api";

interface ReviewsTabProps {
  userData: any;
  onRefresh?: () => void;
  loading: boolean;
}

const ReviewsTab: React.FC<ReviewsTabProps> = ({
  userData,
  onRefresh,
  loading,
}) => {
  const isDarkMode = useColorScheme() === "dark";
  const [modalVisible, setModalVisible] = useState(false);
  const [newStars, setNewStars] = useState<number | null>(null);
  const [newNote, setNewNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { token, user } = React.useContext(AuthContext) || {};
  const isAdmin = user?.role === "admin";

  // Ratings for calculation
  const reviews = userData?.ratings || [];
  const averageRating = userData?.averageRating || 0;

  const handleSubmit = async () => {
    if (!newStars || !newNote.trim()) {
      Toast.show({
        type: "info",
        position: "bottom",
        text1: "Rating required",
        text2: "Please provide both stars and review text.",
      });
      return;
    }

    if (!token) {
      Toast.show({
        type: "error",
        position: "bottom",
        text1: "Error",
        text2: "You must be logged in to give a review.",
      });
      return;
    }

    setSubmitting(true);
    try {
      await api.post(
        `/users/${userData._id}/rate`,
        { stars: newStars, note: newNote.trim() },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      Toast.show({
        type: "success",
        position: "bottom",
        text1: "Review Submitted",
        text2: "Thank you for your feedback!",
      });

      setNewStars(null);
      setNewNote("");
      setModalVisible(false);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error("Error submitting rating:", err);
      Toast.show({
        type: "error",
        position: "bottom",
        text1: "Error",
        text2: "Something went wrong. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View className="px-5 pt-4">
      {!isAdmin ? (
        /* USER VIEW: Eyes + Write Review */
        <View className="py-10">
          <Skeleton
            colorMode={isDarkMode ? "dark" : "light"}
            show={loading && !userData}
            width="100%"
            height={200}
            radius={24}
          >
            <View>
              <View className="items-center justify-center mb-10">
                <Image
                  source={require("../../assets/images/reviewEyes.png")}
                  style={{ width: 80, height: 60 }}
                  resizeMode="contain"
                />
                <Text className="text-lg font-dmMedium text-black dark:text-white mt-4">
                  You won't see the reviews
                </Text>
              </View>

              <View className="px-4">
                <TouchableOpacity
                  onPress={() => {
                    if (!modalVisible) setModalVisible(true);
                  }}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={["#5B4CCC", "#6347C2", "#8056D1"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                      borderRadius: 16,
                      paddingVertical: 16,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <HugeiconsIcon icon={Edit03Icon} size={20} color="white" />
                    <Text className="text-white font-dmBold text-base ml-3">
                      Write a review
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </Skeleton>
        </View>
      ) : (
        /* ADMIN VIEW: Matching UserDetail UI Structure */
        <View>
          {/* Rating Summary Section */}
          <View className="bg-[#F0F3F7] dark:bg-[#1A1A1A] rounded-2xl p-5 mb-4">
            <Skeleton
              colorMode={isDarkMode ? "dark" : "light"}
              show={loading && !userData}
              width="100%"
              height={140}
              radius={24}
            >
              <View>
                <View className="flex-row items-start mb-5">
                  <View className="w-[30%] items-start border-r border-[#E0E5EB] dark:border-[#413E47] pr-4">
                    <Text className="text-4xl font-dmBold text-black dark:text-white">
                      {averageRating ? averageRating.toFixed(1) : "N/A"}
                    </Text>
                    <Text className="text-gray-500 text-xs mt-1">Out of 5</Text>
                  </View>

                  <View className="flex-1 pl-6">
                    {[5, 4, 3, 2, 1].map((starCount) => {
                      const count = reviews.filter(
                        (r: any) => r.stars === starCount,
                      ).length;
                      const percentage =
                        reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                      return (
                        <View
                          key={starCount}
                          className="flex-row items-center h-4 mb-1"
                        >
                          <View className="flex-row w-[65px] justify-end mr-3">
                            {[...Array(starCount)].map((_, i) => (
                              <Image
                                key={i}
                                source={
                                  isDarkMode
                                    ? require("../../assets/images/Rating White Star.png")
                                    : require("../../assets/images/Rating Black Star.png")
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

                <TouchableOpacity
                  onPress={() => {
                    if (!modalVisible) setModalVisible(true);
                  }}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={["#5B4CCC", "#6347C2", "#8056D1"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                      borderRadius: 16,
                      paddingVertical: 16,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <HugeiconsIcon icon={Edit03Icon} size={18} color="white" />
                    <Text className="text-white font-dmMedium ml-3">
                      Write a review
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </Skeleton>
          </View>

          {reviews && reviews.length > 0 && (
            <Text className="text-lg font-dmSemiBold text-black dark:text-white mb-3">
              Review
            </Text>
          )}

          {loading && reviews.length === 0
            ? [1, 2].map((i) => (
                <View key={i} className="mb-3">
                  <Skeleton
                    colorMode={isDarkMode ? "dark" : "light"}
                    width="100%"
                    height={100}
                    radius={16}
                  />
                </View>
              ))
            : reviews &&
              reviews.length > 0 &&
              reviews
                .sort((a: any, b: any) =>
                  moment(b.createdAt).diff(moment(a.createdAt)),
                )
                .map((r: any, idx: number) => (
                  <View
                    key={idx}
                    className="bg-[#F0F3F7] dark:bg-[#1A1A1A] rounded-2xl p-4 mb-3"
                  >
                    <View className="flex-row items-start">
                      <GlobalAvatar
                        name={r.givenBy?.fullName || "Unknown"}
                        size={44}
                        fontSize={16}
                        borderRadius={22}
                        className="mr-3 mt-1"
                      />

                      <View className="flex-1">
                        <View className="flex-row justify-between items-start">
                          <Text className="text-black dark:text-white font-dmSemiBold text-base flex-1 mr-2">
                            {r.givenBy?.fullName || "Unknown"}
                          </Text>
                          <Text className="text-[#6D6D6D] dark:text-[#919191] text-sm font-dmMedium">
                            {moment(r.createdAt).format("DD MMM YYYY")}
                          </Text>
                        </View>

                        <View className="flex-row mt-1 mb-2">
                          {[...Array(r.stars || 0)].map((_, i) => (
                            <Image
                              key={i}
                              source={
                                isDarkMode
                                  ? require("../../assets/images/Rating White Star.png")
                                  : require("../../assets/images/Rating Black Star.png")
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
        </View>
      )}

      <View className="h-20" />

      {/* 🔹 ADD RATING MODAL */}
      <ReactNativeModal
        isVisible={modalVisible}
        onBackdropPress={() => {
          require("react-native").Keyboard.dismiss();
          setModalVisible(false);
        }}
        onSwipeComplete={() => {
          require("react-native").Keyboard.dismiss();
          setModalVisible(false);
        }}
        swipeDirection={["down"]}
        style={{ margin: 0, justifyContent: "flex-end" }}
        backdropOpacity={0.4}
        animationIn="slideInUp"
        animationOut="slideOutDown"
        backdropTransitionOutTiming={0}
        propagateSwipe
        avoidKeyboard={false}
      >
        <KeyboardStickyView offset={{ closed: 0, opened: 0 }}>
          <View className="bg-[#FBFCFD] dark:bg-[#1A1A1A] w-full rounded-t-[32px] px-6 pt-4 pb-10 shadow-xl">
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
                    className={`w-[18%] aspect-square border-[#E0E5EB] dark:border-[#413E47] rounded-2xl border items-center justify-center`}
                  >
                    <Image
                      source={
                        newStars && newStars >= star
                          ? isDarkMode
                            ? require("../../assets/images/Rating White Star.png")
                            : VeryBlackStar
                          : isDarkMode
                            ? require("../../assets/images/Rating White Star.png")
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
              <View className="border border-[#E5E7EB] dark:border-[#333] rounded-2xl px-3 py-2">
                <TextInput
                  placeholder="Provide a detailed review..."
                  placeholderTextColor={isDarkMode ? "#919191" : "#454545"}
                  value={newNote}
                  onChangeText={setNewNote}
                  multiline
                  maxLength={200}
                  className="text-black dark:text-white text-sm font-poppins h-20"
                  style={{ textAlignVertical: "top" }}
                />
                <Text className="text-right text-xs text-gray-400 font-poppins mt-1">
                  {newNote.length}/200
                </Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View className="flex-row justify-between gap-4">
              <TouchableOpacity
                onPress={() => {
                  require("react-native").Keyboard.dismiss();
                  setModalVisible(false);
                }}
                className="flex-1 py-4 rounded-2xl border border-[#E5E7EB] dark:border-[#333] items-center"
              >
                <Text className="text-[#454545] dark:text-[#919191] font-dmMedium text-base">
                  Cancel
                </Text>
              </TouchableOpacity>

              {newStars && newNote.trim() ? (
                <View className="flex-1">
                  <TouchableOpacity
                    onPress={handleSubmit}
                    disabled={submitting}
                    activeOpacity={0.85}
                  >
                    <LinearGradient
                      colors={["#5B4CCC", "#6347C2", "#8056D1"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={{
                        borderRadius: 16,
                        paddingVertical: 16,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {submitting ? (
                        <ActivityIndicator color="white" size="small" />
                      ) : (
                        <Text className="text-white font-dmMedium text-base">
                          Submit
                        </Text>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              ) : (
                <View className="flex-1 py-4 rounded-2xl bg-[#C4C4C4] dark:bg-[#333] items-center">
                  <Text className="text-white/60 font-dmMedium text-base">
                    Submit
                  </Text>
                </View>
              )}
            </View>
          </View>
        </KeyboardStickyView>
      </ReactNativeModal>
    </View>
  );
};

export default ReviewsTab;
