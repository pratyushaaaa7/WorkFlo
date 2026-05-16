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
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { 
  ArrowLeft01Icon, 
  Search01Icon, 
  UserGroupIcon 
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { AuthContext } from "../context/AuthContext";
import api from "../lib/api";
import GlobalAvatar from "../components/GlobalAvatar";

const { width } = Dimensions.get("window");

const LaborReports = () => {
  const router = useRouter();
  const { projectId, projectName } = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";
  const { token } = useContext(AuthContext) || {};

  const [activeTab, setActiveTab] = useState("Vendor");
  const [searchQuery, setSearchQuery] = useState("");
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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


  const filteredVendors = vendors.filter((v) =>
    v.individualName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.firmName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.expertise.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderVendorTab = () => (
    <ScrollView 
      className="flex-1 px-4 pt-4" 
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      {loading ? (
        <ActivityIndicator color={colors.accent} size="large" className="mt-10" />
      ) : filteredVendors.length > 0 ? (
        filteredVendors.map((vendor, index) => {
          return (
            <TouchableOpacity
              key={index}
              activeOpacity={0.7}
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
          <HugeiconsIcon icon={UserGroupIcon} size={60} color={colors.textSecondary} />
          <Text style={{ color: colors.textSecondary }} className="mt-4 font-poppins text-center">
            No vendors found for this project
          </Text>
        </View>
      )}
    </ScrollView>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }} className="pt-14">
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 pb-4">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <HugeiconsIcon icon={ArrowLeft01Icon} size={28} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={{ color: colors.textPrimary }} className="text-2xl font-dmBold">
            Labor Report
          </Text>
        </View>
        <TouchableOpacity>
          <HugeiconsIcon icon={Search01Icon} size={28} color={colors.textPrimary} />
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
                fontFamily: activeTab === tab ? "Poppins_600SemiBold" : "Poppins_400Regular",
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
      {activeTab === "Day" && (
        <View className="flex-1 items-center justify-center">
          <Text style={{ color: colors.textSecondary }} className="font-poppins">
            Day analytics coming soon...
          </Text>
        </View>
      )}
      {activeTab === "Graph" && (
        <View className="flex-1 items-center justify-center">
          <Text style={{ color: colors.textSecondary }} className="font-poppins">
            Graph analytics coming soon...
          </Text>
        </View>
      )}
    </View>
  );
};

export default LaborReports;
