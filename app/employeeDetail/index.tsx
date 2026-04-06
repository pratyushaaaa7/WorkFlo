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
import * as ImagePicker from "expo-image-picker";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { Skeleton } from "moti/skeleton";
import React, { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Linking,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import AnimatedTabIndicator from "../../components/AnimatedTabIndicator";
import GlobalAvatar from "../../components/GlobalAvatar";
import AboutTab from "../../components/employeeDetail/AboutTab";
import ProjectsTab from "../../components/employeeDetail/ProjectsTab";
import ReviewsTab from "../../components/employeeDetail/ReviewsTab";
import { useAuth } from "../../context/AuthContext";
import api from "../../lib/api";

const EmployeeDetail = () => {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";
  const { token, user, updateUser } = useAuth();
  const { userId, refresh } = useLocalSearchParams();
  const router = useRouter();

  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [imageUpdating, setImageUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState(
    userId === user?._id ? "Reviews" : "Profile",
  );
  const [profileHeaderHeight, setProfileHeaderHeight] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const isFirstLoad = useRef(true);

  // Scroll Value for Animation
  const scrollY = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<any>(null);

  const tabs = ["Profile", "Projects", "Reviews"].filter(
    (tab) => !(tab === "Reviews" && userId === user?._id),
  );

  const fetchUser = useCallback(
    async (isManualRefresh = false) => {
      if (!userId || !token) return;
      try {
        if (!isManualRefresh && isFirstLoad.current) setLoading(true);
        const res = await api.get(`/users/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUserData(res.data);
        // console.log(res.data);
        isFirstLoad.current = false;
      } catch (err) {
        console.error("Error fetching user:", err);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [userId, token],
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchUser(true);
  }, [fetchUser]);

  useFocusEffect(
    useCallback(() => {
      isFirstLoad.current = true;
      fetchUser();
    }, [fetchUser]),
  );

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

  const handleImagePick = async () => {
    if (imageUpdating) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0].uri) {
        setImageUpdating(true);
        const selectedImage = result.assets[0];

        // Create form data
        const formData = new FormData();
        formData.append("profileImage", {
          uri: selectedImage.uri,
          name: "profile.jpg",
          type: "image/jpeg",
        } as any);

        const response = await api.post(`/users/${userId}/image`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.data.profileImage) {
          const newUrl = response.data.profileImage;
          setUserData((prev: any) => ({ ...prev, profileImage: newUrl }));

          // If updating own profile, update global auth state
          if (user?._id === userId) {
            await updateUser({ profileImage: newUrl });
          }
        }
      }
    } catch (error) {
      console.error("Error picking/uploading image:", error);
    } finally {
      setImageUpdating(false);
    }
  };

  // Removed early activity indicator return

  if (!userData && !loading) {
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

          <View className="flex-row items-center justify-end">
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
                  onPress={handleImagePick}
                  disabled={imageUpdating}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  {imageUpdating ? (
                    <ActivityIndicator
                      size="small"
                      color={isDarkMode ? "#FFF" : "#000"}
                    />
                  ) : (
                    <HugeiconsIcon
                      icon={Camera01Icon}
                      size={24}
                      color={isDarkMode ? "#FFF" : "#000"}
                    />
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() =>
                    router.push({
                      pathname: "/registerUser",
                      params: { userId: userData._id },
                    })
                  }
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
          </View>
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
        style={{ marginTop: HEADER_HEIGHT, zIndex: 1 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#4F46E5"
            colors={["#4F46E5"]} // Android
          />
        }
      >
        {/* Child 0: Profile Info (Avatar, Name, Buttons) */}
        <View className="items-center px-4 pb-2 bg-white dark:bg-black pt-4">
          {loading && !userData ? (
            <Skeleton
              colorMode={isDarkMode ? "dark" : "light"}
              width={120}
              height={120}
              radius={32}
            />
          ) : (
            <GlobalAvatar
              name={userData?.fullName || ""}
              uri={userData?.profileImage}
              size={120}
              fontSize={40}
              borderRadius={32}
              className="mb-4"
            />
          )}

          <View className="mb-1 mt-4 items-center justify-center">
            {loading && !userData ? (
              <Skeleton
                colorMode={isDarkMode ? "dark" : "light"}
                width={200}
                height={32}
                radius={8}
              />
            ) : (
              <Text className="text-2xl font-dmBold text-black dark:text-white text-center">
                {userData?.fullName}
              </Text>
            )}
          </View>

          <View className="mb-6 items-center justify-center">
            {loading && !userData ? (
              <Skeleton
                colorMode={isDarkMode ? "dark" : "light"}
                width={160}
                height={20}
                radius={6}
              />
            ) : (
              <Text className="text-base font-poppins text-[#606060] dark:text-[#919191] text-center">
                {userData?.designation}
              </Text>
            )}
          </View>

          {/* Action Buttons */}
          {(loading || userData?.contactNumbers?.[0] || userData?.email) && (
            <View className="flex-row pb-6 justify-center w-full">
              {loading && !userData ? (
                <Skeleton
                  colorMode={isDarkMode ? "dark" : "light"}
                  radius={16}
                  height={64}
                  width={250}
                />
              ) : (
                <View className="flex-row gap-4 justify-center items-center w-full">
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
              )}
            </View>
          )}
        </View>

        {/* Child 1: Tabs - Sticky Header */}
        <View
          collapsable={false}
          className="bg-white dark:bg-black pt-2 pb-0 z-50 elevation-5"
          style={{ zIndex: 50 }}
        >
          <View className="flex-row border-b border-[#E0E5EB] dark:border-[#252525] relative">
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
            <AnimatedTabIndicator tabs={tabs} activeTab={activeTab} />
          </View>
        </View>

        {/* Child 2: Tab Content */}
        <View className="bg-white dark:bg-black flex-1">
          {activeTab === "Profile" && (
            <AboutTab userData={userData} loading={loading} />
          )}
          {activeTab === "Projects" && (
            <ProjectsTab userData={userData} loading={loading} />
          )}
          {activeTab === "Reviews" && (
            <ReviewsTab
              userData={userData}
              onRefresh={fetchUser}
              loading={loading}
            />
          )}
          <View className="h-24" />
        </View>
      </Animated.ScrollView>
    </View>
  );
};

export default EmployeeDetail;
