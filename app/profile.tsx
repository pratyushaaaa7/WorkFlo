import {
  ArrowLeft01Icon,
  LogoutCircle01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { useNavigation, useRouter } from "expo-router";
import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Animated,
  Modal,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import Toast from "react-native-toast-message";
import GlobalAvatar from "../components/GlobalAvatar";
import AboutTab from "../components/employeeDetail/AboutTab";
import ProjectsTab from "../components/employeeDetail/ProjectsTab";
import { AuthContext } from "../context/AuthContext";
import api from "../lib/api";

const ProfileScreen = () => {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";
  const { token, user, logout } = useContext(AuthContext) || {};
  const router = useRouter();
  const navigation = useNavigation();

  const [userData, setUserData] = useState<any>(user || null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Profile");
  const [profileHeaderHeight, setProfileHeaderHeight] = useState(0);

  // Scroll Value for Animation
  const scrollY = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const tabs = ["Profile", "Projects"];

  const fetchUser = useCallback(async () => {
    if (!user?._id || !token) return;
    try {
      // Keep loading as true if we don't have userData yet,
      // otherwise we can just let it update in the background.
      if (!userData) setLoading(true);
      const res = await api.get(`/users/${user._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUserData(res.data);
    } catch (err) {
      console.error("Error fetching profile:", err);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to load profile details",
      });
    } finally {
      setLoading(false);
    }
  }, [user?._id, token]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchUser();
    setTimeout(() => setRefreshing(false), 1000);
  }, [fetchUser]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    if (!logout) return;
    setShowLogoutModal(false);
    await logout();
    Toast.show({
      type: "success",
      text1: "Logged Out",
      text2: "You have been signed out successfully.",
      position: "bottom",
    });
    // router.replace("/login");
  };

  // Header Animations
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

  const bodyOpacity = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [1, 0.8],
    extrapolate: "clamp",
  });

  const headerActionOpacity = scrollY.interpolate({
    inputRange: [220, 260],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  const HEADER_HEIGHT = 100;

  return (
    <View className="flex-1 bg-white dark:bg-black">
      {/* Fixed Sticky Header Bar (Absolute) */}
      <View
        style={{ height: HEADER_HEIGHT }}
        className="absolute top-0 left-0 right-0 z-20 bg-white dark:bg-black px-4 pt-14 pb-4"
      >
        <View className="flex-row items-center justify-between">
          <TouchableOpacity
            // onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())}
            onPress={() => router.back()}
            className="w-10"
          >
            <HugeiconsIcon
              icon={ArrowLeft01Icon}
              size={24}
              color={isDarkMode ? "#FFF" : "#000"}
            />
          </TouchableOpacity>

          <View className="flex-1 h-8">
            <Animated.View
              style={{
                opacity: headerTitleOpacity,
                position: "absolute",
                left: 0,
                right: 0,
              }}
            >
              <Text className="text-xl font-dmBold text-black dark:text-white text-center">
                My Profile
              </Text>
            </Animated.View>

            <Animated.View
              style={{
                opacity: headerNameOpacity,
                transform: [{ translateY: headerNameTranslateY }],
                position: "absolute",
                left: 0,
                right: 0,
              }}
              className="flex-row items-center justify-center" // Centered name in header to match title
            >
              <Text className="text-lg font-dmBold text-black dark:text-white">
                {userData?.fullName}
              </Text>
            </Animated.View>
          </View>

          <Animated.View
            style={{ opacity: headerActionOpacity }}
            className="w-10 items-end"
          >
            <TouchableOpacity onPress={handleLogout}>
              <HugeiconsIcon
                icon={LogoutCircle01Icon}
                size={24}
                color="#DF5B5B"
              />
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>

      <Animated.ScrollView
        ref={scrollViewRef}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true },
        )}
        scrollEventThrottle={16}
        stickyHeaderIndices={[1]}
        style={{ marginTop: HEADER_HEIGHT, zIndex: 1 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#4F46E5"
            colors={["#4F46E5"]}
          />
        }
      >
        {/* Child 0: Profile Header */}
        <Animated.View
          style={{ opacity: bodyOpacity }}
          className="items-center px-4 pb-8 bg-white dark:bg-black pt-4"
        >
          <View className="relative">
            <GlobalAvatar
              name={userData?.fullName || ""}
              size={120}
              fontSize={40}
              borderRadius={32}
              className="mb-4"
            />
          </View>

          <Text className="text-2xl font-dmBold text-black dark:text-white mb-1 text-center">
            {userData?.fullName}
          </Text>
          <Text className="text-base font-poppins text-[#606060] dark:text-[#919191] mb-6 text-center w-full">
            {userData?.designation}
          </Text>

          {/* Logout Button */}
          <View className="w-full px-4">
            <View className="bg-[#FED7DA] dark:bg-[#2B0104] rounded-[12px]">
              <TouchableOpacity
                onPress={handleLogout}
                className="flex-row items-center justify-center py-4"
              >
                <HugeiconsIcon
                  icon={LogoutCircle01Icon}
                  size={20}
                  color="#DF5B5B"
                />
                <Text className="text-[#DF5B5B] font-dmSemiBold text-base ml-3">
                  Logout
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>

        {/* Child 1: Tabs */}
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
                  onPress={() => setActiveTab(tab)}
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

        {/* Child 2: Content */}
        <View className="bg-white dark:bg-black flex-1">
          {activeTab === "Profile" && (
            <AboutTab userData={userData} loading={loading} />
          )}
          {activeTab === "Projects" && (
            <ProjectsTab userData={userData} loading={loading} />
          )}
          <View className="h-24" />
        </View>
      </Animated.ScrollView>

      {/* Logout Confirmation Modal */}
      <Modal
        visible={showLogoutModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setShowLogoutModal(false)}
          className="flex-1 justify-center items-center px-6"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            className="bg-white dark:bg-[#000000] w-full rounded-[24px] p-5 shadow-xl"
          >
            <View className="w-12 h-12 bg-[#FED7DA] dark:bg-[#2B0104] rounded-full items-center justify-center mb-4">
              <HugeiconsIcon
                icon={LogoutCircle01Icon}
                size={24}
                color="#DF5B5B"
              />
            </View>

            <Text className="text-xl font-dmBold text-black dark:text-white mb-2">
              Logout
            </Text>
            <Text className="text-base font-poppins text-[#606060] dark:text-[#919191] mb-6">
              Are you sure you want to logout?
            </Text>

            <View className="flex-row gap-4">
              <TouchableOpacity
                onPress={() => setShowLogoutModal(false)}
                className="flex-1 border border-black dark:border-white rounded-xl py-3 items-center"
              >
                <Text className="text-black dark:text-white font-poppins text-lg">
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={confirmLogout}
                className="flex-1 bg-[#DF5B5B] rounded-xl py-3 items-center"
              >
                <Text className="text-white font-poppins text-lg">Confirm</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

export default ProfileScreen;
