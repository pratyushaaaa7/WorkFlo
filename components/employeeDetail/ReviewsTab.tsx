import { Edit03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { LinearGradient } from "expo-linear-gradient";
import moment from "moment";
import React, { useState } from "react";
import {
  Image,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";

interface ReviewsTabProps {
  userData: any;
}

const ReviewsTab: React.FC<ReviewsTabProps> = ({ userData }) => {
  const isDarkMode = useColorScheme() === "dark";
  const [modalVisible, setModalVisible] = useState(false);
  const [newStars, setNewStars] = useState<number | null>(null);
  const [newNote, setNewNote] = useState("");

  // Placeholder for reviews - you'll connect this to your backend
  const reviews = userData?.reviews || [];
  const averageRating = userData?.averageRating || 0;

  return (
    <View className="px-5 pt-4">
      {reviews.length > 0 ? (
        <>
          {/* Rating Summary */}
          <View className="bg-[#F0F3F7] dark:bg-[#1A1A1A] rounded-2xl p-5 mb-4">
            <View className="flex-row items-start">
              <View className="w-[30%] items-start border-r border-[#E0E5EB] dark:border-[#413E47] pr-4">
                <Text className="text-5xl font-dmBold text-black dark:text-white">
                  {averageRating ? averageRating.toFixed(1) : "0.0"}
                </Text>
                <Text className="text-gray-500 text-xs mt-1">Out of 5</Text>
              </View>
              <View className="flex-1 pl-6">
                <Text className="text-sm font-poppinsMedium text-[#606060] dark:text-[#919191] mb-2">
                  {reviews.length} {reviews.length === 1 ? "Review" : "Reviews"}
                </Text>
              </View>
            </View>
          </View>

          {/* Reviews List */}
          {reviews.map((review: any, idx: number) => (
            <View
              key={idx}
              className="bg-[#F0F3F7] dark:bg-[#1A1A1A] rounded-2xl p-4 mb-3"
            >
              <View className="flex-row items-start">
                <View className="w-11 h-11 rounded-full bg-[#0073CB] items-center justify-center mr-3 mt-1">
                  <Text className="text-white font-poppinsMedium text-base">
                    {review.givenBy?.fullName
                      ? review.givenBy.fullName
                          .trim()
                          .split(/\s+/)
                          .slice(0, 2)
                          .map((name: string) => name[0])
                          .join("")
                          .toUpperCase()
                      : "UN"}
                  </Text>
                </View>

                <View className="flex-1">
                  <View className="flex-row justify-between items-start">
                    <Text className="text-black dark:text-white font-dmSemiBold text-base flex-1 mr-2">
                      {review.givenBy?.fullName || "Unknown"}
                    </Text>
                    <Text className="text-[#6D6D6D] dark:text-[#919191] text-sm font-dmMedium">
                      {moment(review.createdAt).format("DD MMM YYYY")}
                    </Text>
                  </View>

                  <View className="flex-row mt-1 mb-2">
                    {[...Array(review.stars || 0)].map((_, i) => (
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

                  {review.note && (
                    <Text className="text-[#1C1C1C] dark:text-[#D2D2D2] text-sm font-poppins leading-5">
                      {review.note}
                    </Text>
                  )}
                </View>
              </View>
            </View>
          ))}
        </>
      ) : (
        <View className="flex-1 items-center justify-center pt-20">
          {/* <LinearGradient
            colors={["#5B4CCC", "#6347C2", "#8056D1"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: 16 }}
          > */}
          <View className="bg-[#F0F3F7] dark:bg-[#1A1A1A] rounded-2xl ">
            <TouchableOpacity
              onPress={() => setModalVisible(true)}
              activeOpacity={0.85}
              className="flex-row items-center justify-center py-4 px-6 rounded-2xl"
            >
              <HugeiconsIcon
                icon={Edit03Icon}
                size={18}
                color={isDarkMode ? "#FFF" : "#000"}
              />
              <Text className="text-black dark:text-white font-dmMedium ml-3">
                Write a review
              </Text>
            </TouchableOpacity>
            {/* </LinearGradient> */}
          </View>
        </View>
      )}
      <View className="h-20" />
    </View>
  );
};

export default ReviewsTab;
