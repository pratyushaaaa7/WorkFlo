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
import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Animated,
  Linking,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import GlobalAvatar from "../../components/GlobalAvatar";
import AboutTab from "../../components/employeeDetail/AboutTab";
import ProjectsTab from "../../components/employeeDetail/ProjectsTab";
import ReviewsTab from "../../components/employeeDetail/ReviewsTab";
import { AuthContext } from "../../context/AuthContext";
import api from "../../lib/api";

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

  const tabs = ["Profile", "Projects", "Reviews"];

  const fetchUser = useCallback(async () => {
    if (!userId || !token) return;
    try {
      setLoading(true);
      const res = await api.get(`/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUserData(res.data);
      console.log(res.data);
    } catch (err) {
      console.error("Error fetching user:", err);
    } finally {
      setLoading(false);
    }
  }, [userId, token]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

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
    inputRange: [0, 60],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  const headerNameOpacity = scrollY.interpolate({
    inputRange: [140, 180],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  const headerNameTranslateY = scrollY.interpolate({
    inputRange: [140, 180],
    outputRange: [10, 0],
    extrapolate: "clamp",
  });

  const headerActionOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  const bodyOpacity = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [1, 0.8],
    extrapolate: "clamp",
  });

  const HEADER_HEIGHT = 105; // Slightly increased for better breathability

  return (
    <View className="flex-1 bg-white dark:bg-black">
      {/* Fixed Sticky Header Bar (Absolute) */}
      <View
        pointerEvents="box-none" // 👈 ALLOW TOUCHES TO PASS THROUGH TO TABS BELOW
        style={{
          height: HEADER_HEIGHT,
          zIndex: 20,
        }}
        className="absolute top-0 left-0 right-0 px-4 pt-14"
      >
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: isDarkMode ? "#000" : "#FFF",
            height: HEADER_HEIGHT,
          }}
          pointerEvents="none"
        />

        <View
          className="flex-row items-center justify-between"
          pointerEvents="box-none"
        >
          <View
            className="flex-row items-center flex-1"
            pointerEvents="box-none"
          >
            <TouchableOpacity
              onPress={() => router.back()}
              className="items-center justify-center -ml-2 p-2"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <HugeiconsIcon
                icon={ArrowLeft01Icon}
                size={24}
                color={isDarkMode ? "#FFF" : "#000"}
              />
            </TouchableOpacity>

            {/* Left-aligned Title Area */}
            <View className="ml-3 justify-center flex-1" pointerEvents="none">
              <Animated.View
                style={{
                  opacity: headerTitleOpacity,
                  position: "absolute",
                  left: 0,
                }}
              >
                <Text className="text-xl font-dmBold text-black dark:text-white">
                  Profile
                </Text>
              </Animated.View>

              <Animated.View
                style={{
                  opacity: headerNameOpacity,
                  transform: [{ translateY: headerNameTranslateY }],
                  position: "absolute",
                  left: 0,
                }}
              >
                <Text className="text-lg font-dmBold text-black dark:text-white">
                  {userData?.fullName}
                </Text>
              </Animated.View>
            </View>
          </View>

          <Animated.View
            style={{ opacity: headerActionOpacity }}
            className="flex-row items-center justify-end"
          >
            {user?.role === "admin" ? (
              <View className="flex-row gap-4">
                <TouchableOpacity
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <HugeiconsIcon
                    icon={Share04Icon}
                    size={24}
                    color={isDarkMode ? "#FFF" : "#000"}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <HugeiconsIcon
                    icon={Camera01Icon}
                    size={24}
                    color={isDarkMode ? "#FFF" : "#000"}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
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
        stickyHeaderIndices={[1]}
        style={{ marginTop: HEADER_HEIGHT, zIndex: 1 }} // 👈 EXPLICIT LOWER Z-INDEX
        showsVerticalScrollIndicator={false}
      >
        {/* Child 0: Profile Info (Avatar, Name, Buttons) */}
        <Animated.View
          style={{ opacity: bodyOpacity }}
          className="items-center px-4 pb-8 bg-white dark:bg-black pt-4"
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
          <View className="flex-row pb-6 justify-center gap-4">
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
        </Animated.View>

        {/* Child 1: Tabs - Sticky Header */}
        <View
          collapsable={false}
          className="bg-white dark:bg-black pt-2 pb-0 z-50 elevation-5"
          style={{ zIndex: 50 }}
        >
          <View className="flex-row border-b border-[#E0E5EB] dark:border-[#252525]">
            {tabs.map((tab) => {
              const isActive = activeTab === tab;
              return (
                <TouchableOpacity
                  key={tab}
                  onPress={() => {
                    setActiveTab(tab);
                    // If we're stuck, staying at the stuck position is fine
                    // Otherwise this ensures we don't jump around
                  }}
                  className="flex-1 items-center pb-3 pt-1"
                  activeOpacity={0.7}
                  style={
                    isActive
                      ? { borderBottomWidth: 2, borderBottomColor: "#5B4CCC" }
                      : {}
                  }
                >
                  <Text
                    className={`text-sm font-poppinsMedium ${
                      isActive
                        ? "text-[#5B4CCC]"
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
          {activeTab === "Reviews" && (
            <ReviewsTab userData={userData} onRefresh={fetchUser} />
          )}
          <View className="h-24" />
        </View>
      </Animated.ScrollView>
    </View>
  );
};

export default EmployeeDetail;
