import {
  Add01Icon,
  Cancel01Icon,
  Menu02Icon,
  Search01Icon,
  Xsl01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { DrawerActions } from "@react-navigation/native";
import * as Clipboard from "expo-clipboard";
import * as FileSystem from "expo-file-system";
import * as Haptics from "expo-haptics";
import { useNavigation, useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import { Skeleton } from "moti/skeleton";
import React, { useContext, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Linking,
  Platform,
  RefreshControl,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import Toast from "react-native-toast-message";
import GlobalAvatar from "../components/GlobalAvatar";
import { AuthContext } from "../context/AuthContext";
import api from "../lib/api";

type User = {
  _id: string;
  fullName: string;
  email: string;
  username: string;
  role: string;
  employeeCode: number;
  status?: string;
  company?: string;
  contactNumbers?: string[];
  designation?: string; // Added based on UI image
  profileImage?: string; // Added based on UI image
};

const EmployeeDirectorySkeleton = ({ isDarkMode }: { isDarkMode: boolean }) => (
  <View
    className="mb-4 mx-4 rounded-xl bg-[#F0F3F7] dark:bg-[#1A1A1A] p-4 shadow-sm overflow-hidden"
    style={{ opacity: 0.6 }}
  >
    <View className="flex-row items-center mb-3">
      <Skeleton
        colorMode={isDarkMode ? "dark" : "light"}
        width={48}
        height={48}
        radius={12}
      />
      <View className="flex-1 ml-4">
        <Skeleton
          colorMode={isDarkMode ? "dark" : "light"}
          width="70%"
          height={18}
          radius={4}
        />
        <View className="mt-2">
          <Skeleton
            colorMode={isDarkMode ? "dark" : "light"}
            width="40%"
            height={14}
            radius={4}
          />
        </View>
      </View>
    </View>

    <View className="h-[1px] bg-[#E0E5EB] dark:bg-[#262626] mb-3" />

    <View className="flex-row items-center justify-between">
      <Skeleton
        colorMode={isDarkMode ? "dark" : "light"}
        width="45%"
        height={14}
        radius={4}
      />
      <Skeleton
        colorMode={isDarkMode ? "dark" : "light"}
        width="35%"
        height={14}
        radius={4}
      />
    </View>
  </View>
);

export default function CentralEmployeeDirectory() {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";
  const auth = useContext(AuthContext);
  const token = auth?.token;
  const router = useRouter();
  const navigation = useNavigation();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");

  const filterOptions = [
    { label: "All", value: "all" },
    { label: "Permanent", value: "Permanent" },
    { label: "Exit", value: "Exit" },
    { label: "Probation", value: "Probation" },
    { label: "Notice", value: "Notice" },
  ];

  const fetchUsers = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await api.get("/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(res.data.users);
      console.log(res.data.users);
    } catch (err) {
      console.error("Failed to fetch users:", err);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Unable to fetch employees",
        position: "bottom",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (users.length === 0) {
      fetchUsers();
    }
  }, [token]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchUsers();
  };

  const downloadExcelWeb = async () => {
    try {
      setDownloading(true);
      const response = await fetch(
        `${api.defaults.baseURL}/users/download?activeFilter=${activeFilter}&searchQuery=${searchQuery}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!response.ok) throw new Error("Failed to download file");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "employees.xlsx";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Excel download error:", error);
    } finally {
      setDownloading(false);
    }
  };

  const downloadExcel = async () => {
    if (Platform.OS === "web") {
      return downloadExcelWeb();
    }
    try {
      setDownloading(true);
      const url = `${api.defaults.baseURL}/users/download?activeFilter=${activeFilter}&searchQuery=${searchQuery}`;
      const fileUri = FileSystem.documentDirectory + "employees.xlsx";

      const downloadResumable = FileSystem.createDownloadResumable(
        url,
        fileUri,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      const downloadResult = await downloadResumable.downloadAsync();
      if (
        downloadResult &&
        downloadResult.uri &&
        (await Sharing.isAvailableAsync())
      ) {
        await Sharing.shareAsync(downloadResult.uri);
      } else {
        Toast.show({
          type: "success",
          text1: "Downloaded",
          text2: "Excel saved at " + (downloadResult?.uri || "unknown"),
        });
      }
    } catch (error) {
      console.error("Excel download error:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to download Excel",
      });
    } finally {
      setDownloading(false);
    }
  };

  const filteredUsers = useMemo(() => {
    let result = users;

    // Apply Status Filter
    if (activeFilter !== "all") {
      result = result.filter(
        (u) => u.status?.toLowerCase() === activeFilter.toLowerCase(),
      );
    }

    // Apply Search Query
    if (!searchQuery.trim()) return result;
    const q = searchQuery.toLowerCase();
    return result.filter((u) => {
      return (
        u.fullName?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.role?.toLowerCase().includes(q) ||
        u.designation?.toLowerCase().includes(q) ||
        u.employeeCode?.toString().includes(q)
      );
    });
  }, [searchQuery, users, activeFilter]);

  const renderEmployee = ({ item }: { item: User }) => (
    <TouchableOpacity
      activeOpacity={0.9}
      className="mb-4 mx-4 rounded-xl bg-[#F0F3F7] dark:bg-[#1A1A1A] p-4 shadow-sm overflow-hidden"
      onPress={() =>
        router.push({
          pathname: "/employeeDetail" as any,
          params: { userId: item._id },
        })
      }
    >
      <View className="flex-row items-center mb-3">
        {/* Global Avatar */}
        <GlobalAvatar
          name={item.fullName || ""}
          uri={item.profileImage}
          size={48}
          fontSize={18}
          className="mr-4"
          borderRadius={12}
        />

        {/* Name & Designation */}
        <View className="flex-1">
          <Text className="text-base font-dmBold text-black dark:text-white">
            {item.fullName}
          </Text>
          <Text className="text-[13px] font-poppins text-[#8E8E8E] dark:text-[#A1A1A1]">
            {item.designation || item.role}
          </Text>
        </View>
      </View>

      {/* Divider */}
      <View className="h-[1px] bg-[#E0E5EB] dark:bg-[#262626] mb-3" />

      {/* Contact Info Row */}
      <View className="flex-row items-center justify-between">
        <TouchableOpacity
          onPress={() => item.email && Linking.openURL(`mailto:${item.email}`)}
          onLongPress={async () => {
            if (item.email) {
              await Clipboard.setStringAsync(item.email);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              Toast.show({
                type: "success",
                text1: "Copied",
                text2: "Email copied to clipboard",
                position: "bottom",
              });
            }
          }}
          className="flex-1 mr-2"
        >
          <Text
            numberOfLines={1}
            className="text-[13px] font-poppins text-[#0073CB] dark:text-[#0073CB]"
          >
            {item.email}
          </Text>
        </TouchableOpacity>

        {item.contactNumbers && item.contactNumbers.length > 0 ? (
          <TouchableOpacity
            onPress={() => Linking.openURL(`tel:${item.contactNumbers![0]}`)}
            onLongPress={async () => {
              if (item.contactNumbers && item.contactNumbers[0]) {
                await Clipboard.setStringAsync(item.contactNumbers[0]);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                Toast.show({
                  type: "success",
                  text1: "Copied",
                  text2: "Phone number copied to clipboard",
                  position: "bottom",
                });
              }
            }}
          >
            <Text className="text-[13px] font-poppins text-[#0073CB] dark:text-[#0073CB]">
              {item.contactNumbers[0]}
            </Text>
          </TouchableOpacity>
        ) : (
          <Text className="text-[13px] font-poppins text-gray-400">N/A</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-[#FBFCFD] dark:bg-black">
      {/* 🔹 HEADER */}
      <View className="flex-row items-center justify-between px-4 py-3 pt-16">
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
            className="mr-3"
          >
            <HugeiconsIcon
              icon={Menu02Icon}
              size={24}
              color={isDarkMode ? "#FFF" : "#000"}
            />
          </TouchableOpacity>
          <Text className="text-xl font-dmBold text-black dark:text-white ml-2">
            Employee Directory
          </Text>
        </View>

        <View className="flex-row items-center gap-4">
          <TouchableOpacity
            onPress={() => {
              if (searchVisible) {
                setSearchQuery("");
              }
              setSearchVisible(!searchVisible);
            }}
          >
            <HugeiconsIcon
              icon={searchVisible ? Cancel01Icon : Search01Icon}
              size={24}
              color={isDarkMode ? "#FFF" : "#000"}
            />
          </TouchableOpacity>
          {auth?.user?.role === "admin" && (
            <TouchableOpacity onPress={downloadExcel} disabled={downloading}>
              {downloading ? (
                <ActivityIndicator
                  size="small"
                  color={isDarkMode ? "#FFF" : "#000"}
                />
              ) : (
                <View className="flex-row items-center">
                  <HugeiconsIcon
                    icon={Xsl01Icon}
                    size={24}
                    color={isDarkMode ? "#FFF" : "#000"}
                  />
                </View>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>

      {searchVisible && (
        <View className="px-4 ">
          <View className="flex-row items-center bg-[#F0F3F7] dark:bg-[#1A1A1A] rounded-2xl px-4 py-2">
            <HugeiconsIcon
              icon={Search01Icon}
              size={20}
              color={isDarkMode ? "#A1A1A1" : "#606060"}
            />
            <TextInput
              placeholder="Search employees..."
              placeholderTextColor={isDarkMode ? "#606060" : "#9CA3AF"}
              className="ml-2 flex-1 font-dm text-black dark:text-white text-base"
              autoFocus
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>
      )}

      {/* 🔹 FILTER CHIPS */}
      <View className="bg-[#FBFCFD] dark:bg-black pb-2 pt-2">
        <FlatList
          horizontal
          data={filterOptions}
          keyExtractor={(item) => item.value}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16 }}
          renderItem={({ item }) => {
            const isActive = activeFilter === item.value;
            return (
              <TouchableOpacity
                onPress={() => {
                  setActiveFilter(item.value);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                style={{
                  backgroundColor: isActive
                    ? isDarkMode
                      ? "#27215880"
                      : "#DAE0FA"
                    : "transparent",
                  borderColor: isActive
                    ? "#566FEC"
                    : isDarkMode
                      ? "#333"
                      : "#E0E5EB",
                  borderWidth: 1,
                  paddingHorizontal: 24,
                  paddingVertical: 8,
                  borderRadius: 50,
                  marginRight: 10,
                }}
              >
                <Text
                  className="font-poppins text-sm"
                  style={{
                    color: isActive ? "#566FEC" : isDarkMode ? "#fff" : "#000",
                  }}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* 🔹 EMPLOYEE LIST */}
      <View className="flex-1 pt-4">
        {loading && !refreshing ? (
          <FlatList
            data={[1, 2, 3, 4, 5, 6]}
            keyExtractor={(item) => `skeleton-${item}`}
            renderItem={() => (
              <EmployeeDirectorySkeleton isDarkMode={isDarkMode} />
            )}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <FlatList
            data={filteredUsers}
            keyExtractor={(item) => item._id}
            renderItem={renderEmployee}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={["#5B4CCC"]}
                tintColor={isDarkMode ? "#FFF" : "#5B4CCC"}
              />
            }
            contentContainerStyle={{ paddingBottom: 100 }}
            ListEmptyComponent={
              <View className="mt-20 items-center px-6">
                <Text className="text-[#8E8E8E] font-poppins text-center text-base">
                  No employees found.
                </Text>
              </View>
            }
          />
        )}
      </View>

      {/* 🔹 FAB (Purple +) - Admin Only */}
      {auth?.user?.role === "admin" && (
        <TouchableOpacity
          onPress={() => router.push("/registerUser")}
          activeOpacity={0.9}
          style={{
            shadowColor: "#5B4CCC",
            shadowOffset: { width: 0, height: 15 },
            shadowOpacity: 5,
            shadowRadius: 40,
            elevation: 90,
          }}
          className="absolute bottom-14 right-6 w-16 h-16 bg-[#5B4CCC] rounded-full items-center justify-center"
        >
          <HugeiconsIcon icon={Add01Icon} size={28} color="white" />
        </TouchableOpacity>
      )}
    </View>
  );
}
