import api from "@/lib/api";
import { ArrowLeft01Icon, Calendar03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import moment from "moment";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import Toast from "react-native-toast-message";
import { useAuth } from "../context/AuthContext";

const CustomToggle = ({
  value,
  onValueChange,
}: {
  value: boolean;
  onValueChange: (val: boolean) => void;
}) => {
  const animatedValue = useRef(new Animated.Value(value ? 1 : 0)).current;
  const stretchValue = useRef(new Animated.Value(0)).current;
  const isDarkMode = useColorScheme() === "dark";

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: value ? 1 : 0,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [value]);

  const backgroundColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [isDarkMode ? "#333" : "#D1D5DB", "#16A34A"],
  });

  const thumbWidth = stretchValue.interpolate({
    inputRange: [0, 1],
    outputRange: [22, 30],
  });

  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [3, 48 - 22 - 3],
  });

  const stretchOffset = stretchValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -8],
  });

  // Calculate final translation: base position + (if checked, move left when stretching)
  const finalTranslateX = Animated.add(
    translateX,
    Animated.multiply(animatedValue, stretchOffset),
  );

  const handlePressIn = () => {
    Animated.timing(stretchValue, {
      toValue: 1,
      duration: 150,
      useNativeDriver: false,
    }).start();
  };

  const handlePressOut = () => {
    Animated.timing(stretchValue, {
      toValue: 0,
      duration: 150,
      useNativeDriver: false,
    }).start();
    onValueChange(!value);
  };

  return (
    <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut}>
      <Animated.View
        style={{
          width: 48,
          height: 28,
          borderRadius: 14,
          backgroundColor,
          justifyContent: "center",
        }}
      >
        <Animated.View
          style={{
            width: thumbWidth,
            height: 22,
            borderRadius: 11,
            backgroundColor: "#FFF",
            transform: [{ translateX: finalTranslateX }],
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.2,
            shadowRadius: 1.5,
            elevation: 3,
          }}
        />
      </Animated.View>
    </Pressable>
  );
};

export default function TicketDetails() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";
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

  const parseBool = (v: any) =>
    Array.isArray(v)
      ? String(v[0]) === "true"
      : v === true || String(v) === "true";

  const [isFixed, setIsFixed] = useState<boolean>(parseBool(fixed));
  const [isPublished, setIsPublished] = useState<boolean>(parseBool(published));
  const [remark, setRemark] = useState<string>((initialRemark as string) || "");
  const [loading, setLoading] = useState(false);

  const handleUpdate = async () => {
    try {
      setLoading(true);
      const res = await api.patch(
        `/support/${id}`,
        { fixed: isFixed, published: isPublished, remark },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (res.status === 200) {
        Toast.show({
          type: "success",
          text1: "Ticket updated successfully!",
          position: "bottom",
        });
        router.back();
      }
    } catch (err) {
      console.error(err);
      Toast.show({
        type: "error",
        text1: "Failed to update ticket",
        text2: "Please try again later.",
        position: "bottom",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-[#FBFCFD] dark:bg-black">
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />

      {/* 🔹 HEADER */}
      <View className="flex-row items-center px-4 py-3 pt-14 bg-[#FBFCFD] dark:bg-black">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <HugeiconsIcon
            icon={ArrowLeft01Icon}
            size={24}
            color={isDarkMode ? "#FFF" : "#000"}
          />
        </TouchableOpacity>
        <Text className="text-xl font-dmBold text-black dark:text-white">
          Ticket Details
        </Text>
      </View>

      <KeyboardAwareScrollView
        enableOnAndroid
        extraScrollHeight={Platform.OS === "ios" ? 40 : 60}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 20,
        }}
      >
        {/* Ticket Info Section */}
        <View className="mt-4">
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-[#454545] dark:text-[#919191] text-sm font-dmMedium">
              {type || "Issue"} • Ticket #{ticketId}
            </Text>
            <View className="flex-row items-center gap-2">
              <HugeiconsIcon
                icon={Calendar03Icon}
                size={14}
                color={isDarkMode ? "#A1A1A1" : "#454545"}
              />
              <Text className="text-[#454545] dark:text-[#A1A1A1] text-sm font-poppins">
                {date ? moment(date as string).format("DD MMM YYYY") : "N/A"}
              </Text>
            </View>
          </View>

          <Text className="text-2xl font-dmBold text-black dark:text-white mb-2">
            {relatedPage || "Project Space"}
          </Text>

          <Text className="text-[#454545] dark:text-[#D2D2D2] text-base font-poppins leading-6 mb-4">
            {description || "No description provided."}
          </Text>

          <Text className="text-[#454545] dark:text-[#919191] text-sm font-poppins mb-6">
            Raised by -{" "}
            <Text className="text-black dark:text-white">
              {raisedBy || "Unknown"}
            </Text>
          </Text>
        </View>

        {/* Status Section */}
        <View className="bg-[#F0F3F7] dark:bg-[#1A1A1A] rounded-2xl p-5 mb-5">
          <Text className="text-lg font-dmBold text-black dark:text-white mb-4">
            Status
          </Text>

          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-base font-dmMedium text-black dark:text-white">
              Fixed
            </Text>
            <CustomToggle value={isFixed} onValueChange={setIsFixed} />
          </View>

          <View className="flex-row justify-between items-center">
            <Text className="text-base font-dmMedium text-black dark:text-white">
              Published
            </Text>
            <CustomToggle value={isPublished} onValueChange={setIsPublished} />
          </View>
        </View>

        {/* Remarks Section */}
        <View className="bg-[#F0F3F7] dark:bg-[#1A1A1A] rounded-2xl p-5 mb-5">
          <Text className="text-lg font-dmBold text-black dark:text-white mb-4">
            Remarks by Developer
          </Text>
          <View className="bg-white dark:bg-[#1A1A1A] rounded-xl p-3 border border-[#E0E5EB] dark:border-[#333]">
            <TextInput
              value={remark}
              onChangeText={setRemark}
              placeholder="Add remarks..."
              placeholderTextColor={isDarkMode ? "#606060" : "#9CA3AF"}
              multiline
              textAlignVertical="top"
              className="text-black dark:text-white text-sm font-poppins min-h-[100px]"
            />
          </View>
        </View>

        {/* Images Section */}
        <View className="bg-[#F0F3F7] dark:bg-[#1A1A1A] rounded-2xl p-5 mb-6">
          <Text className="text-lg font-dmBold text-black dark:text-white mb-4">
            Images
          </Text>
          {imageUrl ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row gap-3">
                {/* Handling multiple images if comma separated, otherwise single */}
                {(imageUrl as string).split(",").map((url, index) => (
                  <Image
                    key={index}
                    source={{ uri: url.trim() }}
                    className="w-24 h-24 rounded-xl"
                  />
                ))}
              </View>
            </ScrollView>
          ) : (
            <Text className="text-[#8E8E8E] font-poppins italic text-sm">
              No images attached
            </Text>
          )}
        </View>
      </KeyboardAwareScrollView>

      {/* Sticky Save Button at the Bottom */}
      <View className="px-5 pb-8 pt-2 bg-[#FBFCFD] dark:bg-black">
        <TouchableOpacity
          onPress={handleUpdate}
          disabled={loading}
          activeOpacity={0.9}
          className="bg-[#5B4CCC] py-4 rounded-2xl items-center justify-center shadow-lg"
          style={{
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
            <Text className="text-white text-lg font-dmBold">Save Changes</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
