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
import moment from "moment";

const { width } = Dimensions.get("window");

const VendorLaborReports = () => {
  const router = useRouter();
  const { projectId, vendorName, expertise } = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";
  const { token } = useContext(AuthContext) || {};

  const [searchQuery, setSearchQuery] = useState("");
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Theme Colors
  const colors = {
    background: isDarkMode ? "#000000" : "#FFFFFF",
    cardBg: isDarkMode ? "#121212" : "#F3F4F6", // Slightly different from laborReports for contrast
    innerCardBg: isDarkMode ? "#1A1A1A" : "#FFFFFF",
    textPrimary: isDarkMode ? "#FFFFFF" : "#000000",
    textSecondary: isDarkMode ? "#9BA1A6" : "#6B7280",
    accent: "#5B4CCC",
    borderColor: isDarkMode ? "#1C1C1C" : "#EBEBEB",
  };

  useEffect(() => {
    fetchVendorReports();
  }, [projectId, vendorName]);

  const fetchVendorReports = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/labor/project/${projectId}/vendor/${vendorName}/reports`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setReports(res.data || []);
    } catch (err) {
      console.error("Error fetching vendor reports:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredReports = reports.filter((r) =>
    r.vendorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.createdBy.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }} className="pt-14">
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 pb-4">
        <View className="flex-row items-center flex-1 mr-4">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <HugeiconsIcon icon={ArrowLeft01Icon} size={28} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text 
            style={{ color: colors.textPrimary }} 
            className="text-2xl font-dmBold flex-1"
            numberOfLines={1}
          >
            {vendorName}
          </Text>
        </View>
        <TouchableOpacity>
          <HugeiconsIcon icon={Search01Icon} size={28} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView 
        className="flex-1 px-4 pt-4" 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {loading ? (
          <ActivityIndicator color={colors.accent} size="large" className="mt-10" />
        ) : filteredReports.length > 0 ? (
          filteredReports.map((report, index) => {
            return (
              <View
                key={index}
                style={{
                  backgroundColor: colors.cardBg,
                  borderRadius: 24,
                  padding: 12,
                  marginBottom: 16,
                }}
              >
                {/* Top Section */}
                <View className="flex-row items-center justify-between px-2 py-3">
                  <View className="flex-row items-center flex-1">
                    <GlobalAvatar
                      name={report.vendorName}
                      size={50}
                      borderRadius={14}
                      fontSize={18}
                      className="mr-3"
                    />
                    <View className="flex-1">
                      <Text
                        style={{ color: colors.textPrimary }}
                        className="text-base font-dmSemiBold"
                      >
                        {report.vendorName}
                      </Text>
                      <Text
                        style={{ color: colors.textSecondary }}
                        className="text-xs font-poppins"
                      >
                        {report.expertise || expertise}
                      </Text>
                    </View>
                  </View>
                  
                  <View className="flex-row items-center">
                    <Text style={{ color: colors.textSecondary }} className="text-xs font-poppinsMedium">
                      Skilled - {report.skilled}
                    </Text>
                    <View style={{ width: 1, height: 16, backgroundColor: colors.borderColor, marginHorizontal: 10, opacity: 0.5 }} />
                    <Text style={{ color: colors.textSecondary }} className="text-xs font-poppinsMedium">
                      Unskilled - {report.unskilled}
                    </Text>
                  </View>
                </View>

                {/* Bottom Section */}
                <View 
                  style={{ 
                    backgroundColor: colors.innerCardBg, 
                    borderRadius: 16, 
                    paddingVertical: 14, 
                    paddingHorizontal: 16,
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}
                >
                  <Text style={{ color: colors.textSecondary }} className="text-xs font-poppins">
                    Created by - <Text style={{ color: colors.textPrimary, fontFamily: "Poppins_500Medium" }}>{report.createdBy}</Text>
                  </Text>
                  <Text style={{ color: colors.textSecondary }} className="text-xs font-poppins">
                    Created Date - <Text style={{ color: colors.textPrimary, fontFamily: "Poppins_500Medium" }}>{moment(report.createdAt).format("D MMM")}</Text>
                  </Text>
                </View>
              </View>
            );
          })
        ) : (
          <View className="items-center justify-center mt-20 opacity-50">
            <HugeiconsIcon icon={UserGroupIcon} size={60} color={colors.textSecondary} />
            <Text style={{ color: colors.textSecondary }} className="mt-4 font-poppins text-center">
              No reports found for this vendor
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default VendorLaborReports;
