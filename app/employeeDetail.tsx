import {
  ArrowLeft01Icon,
  BubbleChatIcon,
  Call02Icon,
  Camera01Icon,
  Mail01Icon,
  PencilEdit02Icon,
  Share04Icon,
  WhatsappIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useContext, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Linking,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import GlobalAvatar from "../components/GlobalAvatar";
import AboutTab from "../components/employeeDetail/AboutTab";
import ProjectsTab from "../components/employeeDetail/ProjectsTab";
import ReviewsTab from "../components/employeeDetail/ReviewsTab";
import { AuthContext } from "../context/AuthContext";
import api from "../lib/api";

const EmployeeDetail = () => {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";
  const { token, user } = useContext(AuthContext) || {};
  const { userId } = useLocalSearchParams();
  const router = useRouter();

  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Profile");
  const [profileHeaderHeight, setProfileHeaderHeight] = useState(0);

  // Scroll Value for Animation
  const scrollY = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<any>(null);

  const handleSnap = (e: any) => {
    const y = e.nativeEvent.contentOffset.y;
    if (y > 0 && y < profileHeaderHeight) {
      if (y < profileHeaderHeight / 2) {
        scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      } else {
        scrollViewRef.current?.scrollTo({
          y: profileHeaderHeight,
          animated: true,
        });
      }
    }
  };

  const tabs = ["Profile", "Projects", "Reviews"];

  useEffect(() => {
    const fetchUser = async () => {
      if (!userId || !token) return;
      try {
        setLoading(true);
        const res = await api.get(`/users/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUserData(res.data);
      } catch (err) {
        console.error("Error fetching user:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [userId, token]);

  const handleSMS = () => {
    if (userData?.contactNumbers?.[0]) {
      Linking.openURL(`sms:${userData.contactNumbers[0]}`);
    }
  };

  const handleWhatsApp = () => {
    if (userData?.contactNumbers?.[0]) {
      Linking.openURL(`whatsapp://send?phone=${userData.contactNumbers[0]}`);
    }
  };

  const handleEmail = () => {
    if (userData?.email) {
      Linking.openURL(`mailto:${userData.email}`);
    }
  };

  const handleCall = () => {
    if (userData?.contactNumbers?.[0]) {
      Linking.openURL(`tel:${userData.contactNumbers[0]}`);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white dark:bg-black">
        <ActivityIndicator size="large" color="#5B4CCC" />
        <Text className="mt-4 text-[#8E8E8E] font-poppins">
          Loading employee details...
        </Text>
      </View>
    );
  }

  if (!userData) {
    return (
      <View className="flex-1 justify-center items-center bg-white dark:bg-black">
        <Text className="text-[#8E8E8E] font-poppins">Employee not found</Text>
      </View>
    );
  }

  // Header Animations
  const headerTitleOpacity = scrollY.interpolate({
    inputRange: [0, 40],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  const headerNameOpacity = scrollY.interpolate({
    inputRange: [60, 100],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  const headerNameTranslateY = scrollY.interpolate({
    inputRange: [60, 100],
    outputRange: [10, 0],
    extrapolate: "clamp",
  });

  const HEADER_HEIGHT = 100;

  return (
    <View className="flex-1 bg-white dark:bg-black">
      {/* Fixed Sticky Header Bar (Absolute) */}
      <View
        style={{ height: HEADER_HEIGHT }}
        className="absolute top-0 left-0 right-0 z-20 bg-white dark:bg-black px-4 pt-12 pb-4 border-b border-transparent"
      >
        <View className="flex-row items-center justify-between">
          <TouchableOpacity onPress={() => router.back()} className="w-10">
            <HugeiconsIcon
              icon={ArrowLeft01Icon}
              size={24}
              color={isDarkMode ? "#FFF" : "#000"}
            />
          </TouchableOpacity>

          {/* Center Title Area */}
          <View className="flex-1  h-8">
            {/* Original 'Profile' Title */}
            <Animated.View
              style={{
                opacity: headerTitleOpacity,
                position: "absolute",
                left: 0,
                right: 0,
              }}
            >
              <View className="flex-row items-center">
                <View>
                  <Text className="text-xl font-dmBold text-black dark:text-white">
                    Profile
                  </Text>
                </View>
              </View>
            </Animated.View>

            {/* New 'Employee Name' Title */}
            <Animated.View
              style={{
                opacity: headerNameOpacity,
                transform: [{ translateY: headerNameTranslateY }],
                position: "absolute",
                left: 0,
                right: 0,
                alignItems: "center",
              }}
            >
              <Text className="text-lg font-dmBold text-black dark:text-white">
                {userData?.fullName}
              </Text>
            </Animated.View>
          </View>

          <Animated.View
            style={{ opacity: headerTitleOpacity }}
            className="flex-row items-center justify-end"
          >
            {user?.role === "admin" ? (
              <View className="flex-row gap-2">
                <TouchableOpacity>
                  <HugeiconsIcon
                    icon={Share04Icon}
                    size={24}
                    color={isDarkMode ? "#FFF" : "#000"}
                  />
                </TouchableOpacity>
                <TouchableOpacity>
                  <HugeiconsIcon
                    icon={Camera01Icon}
                    size={24}
                    color={isDarkMode ? "#FFF" : "#000"}
                  />
                </TouchableOpacity>
                <TouchableOpacity>
                  <HugeiconsIcon
                    icon={PencilEdit02Icon}
                    size={24}
                    color={isDarkMode ? "#FFF" : "#000"}
                  />
                </TouchableOpacity>
              </View>
            ) : (
              <View className="w-10" />
            )}
          </Animated.View>
        </View>
      </View>

      {/* Main Content ScrollView */}
      <Animated.ScrollView
        ref={scrollViewRef}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true },
        )}
        scrollEventThrottle={16}
        stickyHeaderIndices={[1]} // Index 1 is the Tabs View
        style={{ marginTop: HEADER_HEIGHT }}
        showsVerticalScrollIndicator={false}
        onScrollEndDrag={handleSnap}
        onMomentumScrollEnd={handleSnap}
      >
        {/* Child 0: Profile Info (Avatar, Name, Buttons) - Scrolls Away */}
        <View
          onLayout={(e) => setProfileHeaderHeight(e.nativeEvent.layout.height)}
          className="items-center px-4 pb-6 bg-white dark:bg-black pt-4"
        >
          <GlobalAvatar
            name={userData?.fullName || ""}
            size={120}
            fontSize={40}
            borderRadius={32}
            className="mb-4"
          />
          <Text className="text-2xl font-dmBold text-black dark:text-white mb-1 text-center">
            {userData?.fullName}
          </Text>
          <Text className="text-base font-poppins text-[#606060] dark:text-[#919191] mb-6">
            {userData?.designation}
          </Text>

          {/* Action Buttons */}
          <View className="flex-row justify-center gap-4">
            {userData?.contactNumbers?.[0] && (
              <>
                <TouchableOpacity
                  onPress={handleSMS}
                  className="w-16 h-16 rounded-2xl bg-[#E5D4EB] items-center justify-center"
                >
                  <HugeiconsIcon
                    icon={BubbleChatIcon}
                    size={24}
                    color={"#7122A8"}
                    stroke={2}
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleWhatsApp}
                  className="w-16 h-16 rounded-2xl bg-[#E3F8EB] items-center justify-center"
                >
                  <HugeiconsIcon
                    icon={WhatsappIcon}
                    size={24}
                    color={"#17825A"}
                    stroke={2}
                  />
                </TouchableOpacity>
              </>
            )}

            {userData?.email && (
              <TouchableOpacity
                onPress={handleEmail}
                className="w-16 h-16 rounded-2xl bg-[#E0F7FE] items-center justify-center"
              >
                <HugeiconsIcon
                  icon={Mail01Icon}
                  size={24}
                  color={"#0A8CAD"}
                  stroke={2}
                />
              </TouchableOpacity>
            )}

            {userData?.contactNumbers?.[0] && (
              <TouchableOpacity
                onPress={handleCall}
                className="w-16 h-16 rounded-2xl bg-[#E0ECFE] items-center justify-center"
              >
                <HugeiconsIcon
                  icon={Call02Icon}
                  size={24}
                  color={"#0073CB"}
                  stroke={2}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Child 1: Tabs - Sticky Header */}
        <View className="bg-white dark:bg-black pt-2 pb-0 z-10">
          <View className="flex-row border-b border-[#E0E5EB] dark:border-[#252525]">
            {tabs.map((tab) => {
              const isActive = activeTab === tab;
              return (
                <TouchableOpacity
                  key={tab}
                  onPress={() => setActiveTab(tab)}
                  className="flex-1 items-center pb-3"
                  style={
                    isActive
                      ? { borderBottomWidth: 2, borderBottomColor: "#5B4CCC" }
                      : {}
                  }
                >
                  <Text
                    className={`text-sm font-poppinsMedium ${
                      isActive
                        ? "text-[#5B4CCC] dark:text-[#5B4CCC]"
                        : "text-[#454545] dark:text-[#BBBBBB]"
                    }`}
                  >
                    {tab}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Child 2: Tab Content */}
        <View className="bg-white dark:bg-black flex-1">
          {activeTab === "Profile" && <AboutTab userData={userData} />}
          {activeTab === "Projects" && <ProjectsTab userData={userData} />}
          {activeTab === "Reviews" && <ReviewsTab userData={userData} />}
          <View className="h-24" />
        </View>
      </Animated.ScrollView>
    </View>
  );
};

export default EmployeeDetail;
