import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  useColorScheme,
  Dimensions,
  ActivityIndicator,
  Modal,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import Toast from "react-native-toast-message";
import { Ionicons } from "@expo/vector-icons";
import {
  ArrowLeft01Icon,
  Search01Icon,
  UserGroupIcon,
  NoteIcon,
  InformationCircleIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { AuthContext } from "../context/AuthContext";
import api from "../lib/api";
import GlobalAvatar from "../components/GlobalAvatar";
import LaborAnalyticsChart from "../components/LaborAnalyticsChart";
import moment from "moment";

const getInitials = (name: string) => {
  if (!name) return "";
  const parts = name.trim().split(" ");
  if (parts.length > 1) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return parts[0].substring(0, 2).toUpperCase();
};

const { width } = Dimensions.get("window");

const LaborReports = () => {
  const router = useRouter();
  const {
    projectId,
    projectName,
    company,
    teamLeaders,
    teamMembers,
    partnerInCharge,
  } = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";
  const { token } = useContext(AuthContext) || {};

  const [activeTab, setActiveTab] = useState("Vendor");
  const [searchQuery, setSearchQuery] = useState("");
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [formSelectModalVisible, setFormSelectModalVisible] = useState(false);

  // Day tab states
  const [dayStats, setDayStats] = useState<any[]>([]);
  const [dayStatsLoading, setDayStatsLoading] = useState(false);
  const [expandedDays, setExpandedDays] = useState<{ [key: string]: boolean }>({});

  // Theme Colors
  const colors = {
    background: isDarkMode ? "#000000" : "#FFFFFF",
    cardBg: isDarkMode ? "#0D0D0D" : "#F8F9FB",
    textPrimary: isDarkMode ? "#FFFFFF" : "#000000",
    textSecondary: isDarkMode ? "#9BA1A6" : "#6B7280",
    accent: "#5B4CCC",
    borderColor: isDarkMode ? "#1C1C1C" : "#EBEBEB",
    searchBg: isDarkMode ? "#1A1A1A" : "#F3F4F6",
  };

  useEffect(() => {
    fetchVendors();
  }, [projectId]);

  useEffect(() => {
    if (activeTab === "Day") {
      fetchDayStats();
    }
  }, [projectId, activeTab]);

  const fetchDayStats = async () => {
    try {
      setDayStatsLoading(true);
      const res = await api.get(`/labor/project/${projectId}/daily-stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDayStats(res.data || []);
    } catch (err) {
      console.error("Error fetching day stats:", err);
    } finally {
      setDayStatsLoading(false);
    }
  };

  const toggleDayExpanded = (dayId: string) => {
    setExpandedDays((prev) => ({
      ...prev,
      [dayId]: !prev[dayId],
    }));
  };

  const renderDayTab = () => {
    if (dayStatsLoading) {
      return (
        <View className="flex-1 items-center justify-center py-20">
          <ActivityIndicator color={colors.accent} size="large" />
        </View>
      );
    }

    if (dayStats.length === 0) {
      return (
        <View className="items-center justify-center mt-20 opacity-50">
          <HugeiconsIcon
            icon={NoteIcon}
            size={60}
            color={colors.textSecondary}
          />
          <Text
            style={{ color: colors.textSecondary }}
            className="mt-4 font-poppins text-center"
          >
            No daily labor reports found
          </Text>
        </View>
      );
    }

    return (
      <ScrollView
        className="flex-1 px-4 pt-4"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 80 }}
      >
        {dayStats.map((day) => {
          const isExpanded = !!expandedDays[day._id];
          const formattedDate = moment(day.date).format("D MMM, YYYY");

          return (
            <View key={day._id} className="mb-4">
              {/* Day Header Row */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => toggleDayExpanded(day._id)}
                style={{
                  backgroundColor: colors.cardBg,
                  borderRadius: 20,
                  paddingVertical: 14,
                  paddingHorizontal: 16,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  borderWidth: 1,
                  borderColor: isExpanded ? colors.borderColor : "transparent",
                }}
              >
                <View className="flex-row items-center flex-1">
                  {/* Chevron Icon */}
                  <View style={{ marginRight: 8 }}>
                    <Ionicons
                      name={isExpanded ? "chevron-down" : "chevron-forward"}
                      size={20}
                      color={colors.textPrimary}
                    />
                  </View>

                  {/* Date Pill */}
                  <View
                    style={{
                      backgroundColor: isDarkMode ? "#1A1A1A" : "#FFFFFF",
                      borderRadius: 10,
                      paddingVertical: 6,
                      paddingHorizontal: 12,
                      marginRight: 12,
                      borderWidth: isDarkMode ? 0 : 1,
                      borderColor: colors.borderColor,
                    }}
                  >
                    <Text
                      style={{ color: colors.textPrimary }}
                      className="text-sm font-poppinsMedium"
                    >
                      {formattedDate}
                    </Text>
                  </View>

                  {/* Vendor Count */}
                  <Text
                    style={{ color: colors.textSecondary }}
                    className="text-sm font-poppins"
                  >
                    {day.vendorCount} {day.vendorCount === 1 ? "vendor" : "vendor"}
                  </Text>
                </View>

                {/* Right side: Skilled / Unskilled */}
                <View className="items-end">
                  <Text
                    style={{ color: colors.textSecondary }}
                    className="text-xs font-poppinsMedium"
                  >
                    S - {day.totalSkilled}  |  Us - {day.totalUnskilled}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Day Expanded Cards */}
              {isExpanded && day.vendors && (
                <View style={{ marginTop: 10, paddingHorizontal: 4 }}>
                  {day.vendors.map((vendor: any, idx: number) => {
                    const initials = getInitials(vendor.name);
                    return (
                      <View
                        key={idx}
                        style={{
                          backgroundColor: colors.cardBg,
                          borderRadius: 24,
                          padding: 16,
                          marginBottom: 12,
                          borderWidth: 1,
                          borderColor: colors.borderColor,
                        }}
                      >
                        {/* Main Vendor Row */}
                        <View className="flex-row items-center justify-between">
                          <View className="flex-row items-center flex-1 mr-2">
                            {/* Visual avatar with peach styling */}
                            <View
                              style={{
                                width: 44,
                                height: 44,
                                borderRadius: 14,
                                backgroundColor: isDarkMode ? "#2D1D16" : "#FFEBE3",
                                alignItems: "center",
                                justifyContent: "center",
                                marginRight: 12,
                              }}
                            >
                              <Text
                                style={{
                                  color: isDarkMode ? "#FFA07A" : "#E05D2B",
                                  fontSize: 15,
                                  fontFamily: "Poppins_600SemiBold",
                                }}
                              >
                                {initials}
                              </Text>
                            </View>

                            <View className="flex-1">
                              <Text
                                style={{ color: colors.textPrimary }}
                                className="text-base font-dmSemiBold"
                                numberOfLines={1}
                              >
                                {vendor.name}
                              </Text>
                              <Text
                                style={{ color: colors.textSecondary }}
                                className="text-xs font-poppins"
                                numberOfLines={1}
                              >
                                {vendor.expertise || "Electrical"}
                              </Text>
                            </View>
                          </View>

                          <View className="items-end">
                            <Text
                              style={{ color: colors.textSecondary }}
                              className="text-xs font-poppinsMedium"
                            >
                              Skilled - {vendor.skilled}  |  Unskilled - {vendor.unskilled}
                            </Text>
                          </View>
                        </View>

                        {/* Bottom Row inside card */}
                        <View
                          style={{
                            backgroundColor: isDarkMode ? "#000000" : "#FFFFFF",
                            borderRadius: 16,
                            paddingVertical: 12,
                            paddingHorizontal: 16,
                            flexDirection: "row",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginTop: 12,
                          }}
                        >
                          <Text
                            style={{ color: colors.textSecondary }}
                            className="text-xs font-poppins"
                          >
                            Created by -{" "}
                            <Text
                              style={{
                                color: colors.textPrimary,
                                fontFamily: "Poppins_500Medium",
                              }}
                            >
                              {day.createdBy}
                            </Text>
                          </Text>
                          <Text
                            style={{ color: colors.textSecondary }}
                            className="text-xs font-poppins"
                          >
                            Created Date -{" "}
                            <Text
                              style={{
                                color: colors.textPrimary,
                                fontFamily: "Poppins_500Medium",
                              }}
                            >
                              {moment(day.date).format("D MMM")}
                            </Text>
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    );
  };

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/labor/project/${projectId}/vendors`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setVendors(res.data.vendors || []);
    } catch (err) {
      console.error("Error fetching vendors:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredVendors = vendors.filter(
    (v) =>
      v.individualName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.firmName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.expertise.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const renderVendorTab = () => (
    <ScrollView
      className="flex-1 px-4 pt-4"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      {loading ? (
        <ActivityIndicator
          color={colors.accent}
          size="large"
          className="mt-10"
        />
      ) : filteredVendors.length > 0 ? (
        filteredVendors.map((vendor, index) => {
          return (
            <TouchableOpacity
              key={index}
              activeOpacity={0.7}
              onPress={() =>
                router.push({
                  pathname: "/vendorLaborReports",
                  params: {
                    projectId,
                    vendorName: vendor.individualName,
                    expertise: vendor.expertise,
                  },
                })
              }
              style={{
                backgroundColor: colors.cardBg,
                borderRadius: 20,
                padding: 16,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 12,
              }}
            >
              <View className="flex-row items-center flex-1">
                <GlobalAvatar
                  name={vendor.individualName}
                  uri={vendor.profileImage}
                  size={54}
                  borderRadius={16}
                  fontSize={18}
                  className="mr-3"
                />
                <View className="flex-1">
                  <Text
                    style={{ color: colors.textPrimary }}
                    className="text-base font-dmSemiBold"
                  >
                    {vendor.individualName}
                  </Text>
                  <Text
                    style={{ color: colors.textSecondary }}
                    className="text-sm font-poppins"
                  >
                    {vendor.expertise}
                  </Text>
                </View>
              </View>
              <View className="items-end">
                <Text
                  style={{ color: colors.textPrimary }}
                  className="text-sm font-poppinsMedium opacity-80"
                >
                  Total Report - {vendor.reportCount || 0}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })
      ) : (
        <View className="items-center justify-center mt-20 opacity-50">
          <HugeiconsIcon
            icon={UserGroupIcon}
            size={60}
            color={colors.textSecondary}
          />
          <Text
            style={{ color: colors.textSecondary }}
            className="mt-4 font-poppins text-center"
          >
            No vendors found for this project
          </Text>
        </View>
      )}
    </ScrollView>
  );

  return (
    <View
      style={{ flex: 1, backgroundColor: colors.background }}
      className="pt-14"
    >
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 pb-4">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <HugeiconsIcon
              icon={ArrowLeft01Icon}
              size={28}
              color={colors.textPrimary}
            />
          </TouchableOpacity>
          <Text
            style={{ color: colors.textPrimary }}
            className="text-2xl font-dmBold"
          >
            Labor Report
          </Text>
        </View>
        <TouchableOpacity>
          <HugeiconsIcon
            icon={Search01Icon}
            size={28}
            color={colors.textPrimary}
          />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View className="flex-row border-b border-gray-100 dark:border-gray-800">
        {["Vendor", "Day", "Graph"].map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={{
              flex: 1,
              paddingVertical: 12,
              alignItems: "center",
              borderBottomWidth: activeTab === tab ? 2 : 0,
              borderBottomColor: colors.accent,
            }}
          >
            <Text
              style={{
                color: activeTab === tab ? colors.accent : colors.textSecondary,
                fontFamily:
                  activeTab === tab
                    ? "Poppins_600SemiBold"
                    : "Poppins_400Regular",
              }}
              className="text-base"
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Search Input (Optional, shown when search is active or just always there) */}
      {/* <View className="px-6 py-3">
        <View 
            style={{ backgroundColor: colors.searchBg }}
            className="flex-row items-center px-4 py-2 rounded-xl"
        >
          <HugeiconsIcon icon={Search01Icon} size={20} color={colors.textSecondary} />
          <TextInput
            placeholder="Search vendors..."
            placeholderTextColor={colors.textSecondary}
            className="flex-1 ml-2 font-poppins"
            style={{ color: colors.textPrimary, paddingVertical: 8 }}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View> */}

      {/* Content */}
      {activeTab === "Vendor" && renderVendorTab()}
      {activeTab === "Day" && renderDayTab()}
      {activeTab === "Graph" && (
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <LaborAnalyticsChart />

          <View className="px-6 py-4">
            <Text
              style={{ color: colors.textPrimary }}
              className="text-lg font-dmBold mb-4"
            >
              Insights
            </Text>
            <View
              style={{
                backgroundColor: colors.cardBg,
                padding: 16,
                borderRadius: 16,
              }}
            >
              <Text
                style={{ color: colors.textSecondary }}
                className="font-poppins text-sm leading-relaxed"
              >
                Total labor actual count is slightly higher than projected for
                this week. Saturday saw the peak attendance.
              </Text>
            </View>
          </View>
        </ScrollView>
      )}

      {/* Floating + Button */}
      {activeTab !== "Graph" && (
        <TouchableOpacity
          onPress={() => setFormSelectModalVisible(true)}
          style={{
            position: "absolute",
            bottom: 30,
            right: 20,
            width: 54,
            height: 54,
            borderRadius: 28,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.accent,
            shadowColor: colors.accent,
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.4,
            shadowRadius: 12,
            elevation: 10,
          }}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={30} color="white" />
        </TouchableOpacity>
      )}

      {/* Form Selection Modal */}
      <Modal
        visible={formSelectModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setFormSelectModalVisible(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setFormSelectModalVisible(false)}
          style={{
            flex: 1,
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            justifyContent: "flex-end",
          }}
        >
          
          <TouchableOpacity
            activeOpacity={1}
            style={{
              backgroundColor: isDarkMode ? "#1A1A1A" : "#FFFFFF",
              borderTopLeftRadius: 30,
              borderTopRightRadius: 30,
              paddingHorizontal: 16,
              paddingTop: 32,
              paddingBottom: 52,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: -10 },
              shadowOpacity: 0.1,
              shadowRadius: 15,
              elevation: 20,
            }}
          >
            {/* Test Info Banner */}
            <View
              style={{
                backgroundColor: isDarkMode ? "#1A1104" : "#FFF9E8CC",
                borderWidth: 1.5,
                borderColor: isDarkMode ? "#7A5E35" : "#E8D3B9",
                borderStyle: "dashed",
                borderRadius: 16,
                paddingVertical: 14,
                paddingHorizontal: 16,
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 24,
              }}
            >
              <View style={{ marginRight: 12 }}>
                <HugeiconsIcon
                  icon={InformationCircleIcon}
                  size={16}
                  color={isDarkMode ? "#FFC366" : "#9E6000"}
                />
              </View>
              <Text
                style={{
                  flex: 1,
                  fontFamily: "Poppins_400Regular",
                  fontSize: 12,
                  lineHeight: 18,
                  letterSpacing: -0.2,
                  color: isDarkMode ? "#FFC366" : "#9E6000",
                }}
              >
                We're testing two form layouts. Try both — use whichever feels easier.
              </Text>
            </View>

            {/* Form Options Side-by-Side */}
            <View style={{ flexDirection: "row", gap: 9 }}>
              {/* Form 1 */}
              <TouchableOpacity
                onPress={() => {
                  setFormSelectModalVisible(false);
                  Toast.show({
                    type: "info",
                    text1: "Coming Soon",
                    text2: "Vendor Form 1 will be available in the next update!",
                    position: "bottom",
                  });
                }}
                activeOpacity={0.7}
                style={{
                  flex: 1,
                  backgroundColor: isDarkMode ? "#000000" : "#F5F5F5",
                  borderRadius: 16,
                  paddingVertical: 16,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <View style={{ marginBottom: 12 }}>
                  <HugeiconsIcon
                    icon={NoteIcon}
                    size={24}
                    color={isDarkMode ? "#FFFFFF" : "#1A1A1A"}
                  />
                </View>
                <Text
                  style={{
                    fontFamily: "Poppins_400Regular",
                    fontSize: 14,
                    lineHeight: 14,
                    letterSpacing: 0,
                    color: isDarkMode ? "#FFFFFF" : "#1A1A1A",
                  }}
                >
                  Vendor Form 1
                </Text>
              </TouchableOpacity>

              {/* Form 2 */}
              <TouchableOpacity
                onPress={() => {
                  setFormSelectModalVisible(false);
                  router.push({
                    pathname: "/dprLaborForm",
                    params: {
                      projectId,
                      projectName,
                      company,
                      teamLeaders,
                      teamMembers,
                      partnerInCharge,
                    },
                  });
                }}
                activeOpacity={0.7}
                style={{
                  flex: 1,
                  backgroundColor: isDarkMode ? "#000000" : "#F5F5F5",
                  borderRadius: 16,
                  paddingVertical: 16,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <View style={{ marginBottom: 12 }}>
                  <HugeiconsIcon
                    icon={NoteIcon}
                    size={24}
                    color={isDarkMode ? "#FFFFFF" : "#1A1A1A"}
                  />
                </View>
                <Text
                  style={{
                    fontFamily: "Poppins_400Regular",
                    fontSize: 14,
                    lineHeight: 14,
                    letterSpacing: 0,
                    color: isDarkMode ? "#FFFFFF" : "#1A1A1A",
                  }}
                >
                  Vendor Form 2
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

export default LaborReports;
