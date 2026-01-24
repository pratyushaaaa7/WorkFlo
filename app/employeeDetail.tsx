import {
  ArrowLeft01Icon,
  Call02Icon,
  Chatting01Icon,
  Mail01Icon,
  Message01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useContext, useEffect, useState } from "react";
import {
  ActivityIndicator,
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
  const { token } = useContext(AuthContext) || {};
  const { userId } = useLocalSearchParams();
  const router = useRouter();

  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Profile");

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

  return (
    <View className="flex-1 bg-white dark:bg-black">
      {/* Header */}
      <View className="px-4 pt-16 pb-4">
        <View className="flex-row items-center justify-between mb-6">
          <TouchableOpacity onPress={() => router.back()}>
            <HugeiconsIcon
              icon={ArrowLeft01Icon}
              size={24}
              color={isDarkMode ? "#FFF" : "#000"}
            />
          </TouchableOpacity>
          <Text className="text-xl font-dmBold text-black dark:text-white">
            Profile
          </Text>
          <View className="w-6" />
        </View>

        {/* Avatar & Name */}
        <View className="items-center mb-6">
          <GlobalAvatar
            name={userData?.fullName || ""}
            size={120}
            fontSize={40}
            borderRadius={60}
            className="mb-4"
          />
          <Text className="text-2xl font-dmBold text-black dark:text-white mb-1">
            {userData?.fullName}
          </Text>
          <Text className="text-base font-poppins text-[#606060] dark:text-[#919191]">
            {userData?.role || "Employee"}
          </Text>
        </View>

        {/* Action Buttons */}
        <View className="flex-row justify-center gap-4 mb-6">
          <TouchableOpacity
            onPress={handleSMS}
            className="w-16 h-16 rounded-2xl bg-[#E9D7FE] dark:bg-[#4C1D95] items-center justify-center"
          >
            <HugeiconsIcon
              icon={Message01Icon}
              size={24}
              color={isDarkMode ? "#C4B5FD" : "#7C3AED"}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleWhatsApp}
            className="w-16 h-16 rounded-2xl bg-[#D1FAE5] dark:bg-[#064E3B] items-center justify-center"
          >
            <HugeiconsIcon
              icon={Chatting01Icon}
              size={24}
              color={isDarkMode ? "#6EE7B7" : "#059669"}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleEmail}
            className="w-16 h-16 rounded-2xl bg-[#DBEAFE] dark:bg-[#1E3A8A] items-center justify-center"
          >
            <HugeiconsIcon
              icon={Mail01Icon}
              size={24}
              color={isDarkMode ? "#93C5FD" : "#2563EB"}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleCall}
            className="w-16 h-16 rounded-2xl bg-[#CFFAFE] dark:bg-[#164E63] items-center justify-center"
          >
            <HugeiconsIcon
              icon={Call02Icon}
              size={24}
              color={isDarkMode ? "#67E8F9" : "#0891B2"}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs */}
      <View className="flex-row border-b border-[#E0E5EB] dark:border-[#252525] px-4">
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
                    : "text-gray-400 dark:text-[#606060]"
                }`}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Tab Content */}
      {activeTab === "Profile" && <AboutTab userData={userData} />}
      {activeTab === "Projects" && <ProjectsTab userData={userData} />}
      {activeTab === "Reviews" && <ReviewsTab userData={userData} />}
    </View>
  );
};

export default EmployeeDetail;
