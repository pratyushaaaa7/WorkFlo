import { LogoutCircle01Icon, Menu02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { DrawerActions } from "@react-navigation/native";
import { useNavigation, useRouter } from "expo-router";
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

  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Profile");
  const [profileHeaderHeight, setProfileHeaderHeight] = useState(0);

  // Scroll Value for Animation
  const scrollY = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<any>(null);

  const tabs = ["Profile", "Projects"];

  const fetchUser = useCallback(async () => {
    if (!user?._id || !token) return;
    try {
      setLoading(true);
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

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const handleLogout = async () => {
    if (!logout) return;
    await logout();
    Toast.show({
      type: "success",
      text1: "Logged Out",
      text2: "You have been signed out successfully.",
      position: "bottom",
    });
    router.replace("/login");
  };

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

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white dark:bg-black">
        <ActivityIndicator size="large" color="#5B4CCC" />
        <Text className="mt-4 text-[#8E8E8E] font-poppins">
          Loading your profile...
        </Text>
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
        className="absolute top-0 left-0 right-0 z-20 bg-white dark:bg-black px-4 pt-14 pb-4"
      >
        <View className="flex-row items-center justify-between">
          <TouchableOpacity
            onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())}
            className="w-10"
          >
            <HugeiconsIcon
              icon={Menu02Icon}
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
              <Text className="text-xl font-dmBold text-black dark:text-white">
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
              className="flex-row items-center justify-between"
            >
              <Text className="text-lg font-dmBold text-black dark:text-white mr-3">
                {userData?.fullName}
              </Text>
              <TouchableOpacity onPress={handleLogout}>
                <HugeiconsIcon
                  icon={LogoutCircle01Icon}
                  size={24}
                  color="#DF5B5B"
                />
              </TouchableOpacity>
            </Animated.View>
          </View>

          <Animated.View
            style={{ opacity: headerTitleOpacity }}
            className="flex-row items-center justify-end"
          >
            <View className="flex-row gap-2">
              {/* <TouchableOpacity>
                <HugeiconsIcon
                  icon={Share04Icon}
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
              </TouchableOpacity> */}
              {/* <TouchableOpacity>
                <HugeiconsIcon
                  icon={LogoutCircle01Icon}
                  size={24}
                  color="#DF5B5B"
                />
              </TouchableOpacity> */}
            </View>
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
        style={{ marginTop: HEADER_HEIGHT }}
        showsVerticalScrollIndicator={false}
        onScrollEndDrag={handleSnap}
        onMomentumScrollEnd={handleSnap}
      >
        {/* Child 0: Profile Header */}
        <View
          onLayout={(e) => setProfileHeaderHeight(e.nativeEvent.layout.height)}
          className="items-center px-4 pb-6 bg-white dark:bg-black pt-4"
        >
          <View className="relative">
            <GlobalAvatar
              name={userData?.fullName || ""}
              size={120}
              fontSize={40}
              borderRadius={32}
              className="mb-4"
            />
            {/* <TouchableOpacity className="absolute bottom-6 right-0 bg-[#5B4CCC] p-2 rounded-full border-4 border-white dark:border-black">
              <HugeiconsIcon icon={Camera01Icon} size={16} color="white" />
            </TouchableOpacity> */}
          </View>

          <Text className="text-2xl font-dmBold text-black dark:text-white mb-1 text-center">
            {userData?.fullName}
          </Text>
          <Text className="text-base font-poppins text-[#606060] dark:text-[#919191] mb-6">
            {userData?.designation}
          </Text>

          {/* Logout Button instead of contact icons */}
          <View className="w-full px-4">
            <View className="bg-[#FED7DA] dark:bg-[#2B0104] rounded-full">
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
        </View>

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
          {activeTab === "Profile" && <AboutTab userData={userData} />}
          {activeTab === "Projects" && <ProjectsTab userData={userData} />}
          <View className="h-24" />
        </View>
      </Animated.ScrollView>
    </View>
  );
};

export default ProfileScreen;
