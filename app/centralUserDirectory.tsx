import { Ionicons } from "@expo/vector-icons";
import {
  Add01Icon,
  Menu02Icon,
  Search01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { DrawerActions } from "@react-navigation/native";
import { useNavigation, useRouter } from "expo-router";
import React, { useContext, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import { AuthContext } from "../context/AuthContext";
import api from "../lib/api";

// Filter categories
const FILTERS = ["All", "Client", "Vendor", "Consultant"];

export default function CentralUserDirectory() {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";
  const auth = useContext(AuthContext);
  const token = auth?.token;
  const router = useRouter();
  const navigation = useNavigation();

  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("All");

  // ✅ Fetch Users
  const fetchUsers = async () => {
    try {
      if (!refreshing) setLoading(true);
      const res = await api.get(`/user-directory`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(res.data);
      console.log(res.data);
    } catch (err) {
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchUsers();
  };

  // ✅ Filtering Logic
  const filteredUsers = useMemo(() => {
    let result = users;

    // 1. Filter by Category/Role
    if (selectedFilter !== "All") {
      result = result.filter((u) => {
        const role = u.role?.toLowerCase() || "";
        const cat = u.category?.toLowerCase() || "";
        const filter = selectedFilter.toLowerCase();
        return role.includes(filter) || cat.includes(filter);
      });
    }

    // 2. Filter by Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((u) => {
        return (
          u.individualName?.toLowerCase().includes(q) ||
          u.userCode?.toString().toLowerCase().includes(q) ||
          u.firmName?.toLowerCase().includes(q) ||
          u.expertiseList?.some((e: any) => e.toLowerCase().includes(q)) ||
          u.designationList?.some((d: any) => d.toLowerCase().includes(q))
        );
      });
    }

    return result;
  }, [users, searchQuery, selectedFilter]);

  // ✅ Render One User Card
  const renderUser = ({ item }: { item: any }) => (
    <TouchableOpacity
      activeOpacity={0.9}
      className="mb-3 mx-4 rounded-2xl bg-[#F0F3F7] dark:bg-[#1A1A1A] p-4 "
      onPress={() =>
        router.push({
          pathname: "/userDetail",
          params: { user: JSON.stringify(item) },
        })
      }
    >
      {/* Row 1: ID | Name | Role */}
      <View className="flex-row items-center flex-wrap mb-1">
        <Text className="text-[#DF5B5B] font-poppinsMedium mr-3 text-sm">
          #{item.userCode || "N/A"}
        </Text>
        <Text className="text-lg font-dmSemiBold text-black dark:text-white mr-2">
          {item.individualName || "Unnamed"}
        </Text>
        <Text className="text-[#454545] dark:text-[#919191] ">•</Text>
        <Text className="text-[#454545] dark:text-[#919191] text-sm ml-2 font-poppins capitalize">
          {item.role || "User"}
        </Text>
      </View>

      {/* Row 2: Company • Designation */}
      <View className="flex-row items-center flex-wrap mb-1">
        <Text className="text-[#454545] dark:text-[#919191] font-poppins text-sm">
          {item.firmName || "No Company"}
        </Text>
        <Text className="text-[#454545] dark:text-[#919191]  mx-2">•</Text>
        <Text className="text-[#454545] dark:text-[#919191] font-poppins text-sm">
          {item.designationList && item.designationList.length > 0
            ? item.designationList[0]
            : "No Designation"}
        </Text>
      </View>

      {/* Row 3: Specialty */}
      {/* {item.expertiseList && item.expertiseList.length > 0 && (
        <Text className="text-gray-500 text-[14px] mt-0.5">
          {item.expertiseList.join(", ")}
        </Text>
      )} */}
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-[#FBFCFD] dark:bg-black">
      {/* <StatusBar barStyle="dark-content" backgroundColor={"#FBFCFD"} /> */}

      {/* 🔹 CUSTOM HEADER (White Background) */}
      <View className="flex-row items-center justify-between px-4 py-3 pt-16   ">
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
            className="mr-3"
          >
            <HugeiconsIcon
              icon={Menu02Icon}
              size={24}
              color={isDarkMode ? "#D2D2D2" : "#454545"}
            />
          </TouchableOpacity>
          <Text className="text-xl font-dmSemiBold dark:text-white text-black">
            Central Directory
          </Text>
        </View>
        <TouchableOpacity onPress={() => setSearchVisible(!searchVisible)}>
          <HugeiconsIcon
            icon={Search01Icon}
            size={24}
            color={isDarkMode ? "#D2D2D2" : "#454545"}
          />
        </TouchableOpacity>
      </View>

      {/* 🔹 SEARCH BAR (Collapsible) */}
      {searchVisible && (
        <View className="px-4 pb-2 bg-[#FBFCFD] dark:bg-black">
          <View className="flex-row items-center bg-gray-100 dark:bg-[#1A1A1A] rounded-xl px-4 py-1">
            <HugeiconsIcon
              icon={Search01Icon}
              size={24}
              color={isDarkMode ? "#606060" : "#454545"}
            />
            <TextInput
              placeholder="Search"
              placeholderTextColor="#9CA3AF"
              className="ml-2 flex-1 font-dm text-gray-900 dark:text-white text-base" // Ensure text size is readable
              autoFocus
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>
      )}

      {/* 🔹 FILTERS (Pill Shape) */}
      <View className="bg-[#FBFCFD] dark:bg-black pb-2 pt-2">
        <FlatList
          horizontal
          data={FILTERS}
          keyExtractor={(item) => item}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16 }}
          renderItem={({ item }) => {
            const isActive = selectedFilter === item;
            return (
              <TouchableOpacity
                onPress={() => setSelectedFilter(item)}
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
                  {item}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* 🔹 USER LIST */}
      <View className="flex-1 bg-[#FBFCFD] dark:bg-black pt-3">
        {loading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#6366F1" />
          </View>
        ) : (
          <FlatList
            data={filteredUsers}
            keyExtractor={(item) => item._id}
            renderItem={renderUser}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={["#6366F1"]}
              />
            }
            contentContainerStyle={{ paddingBottom: 100 }}
            ListEmptyComponent={
              <View className="mt-20 items-center px-6">
                <Text className="text-gray-400 text-center text-base">
                  No users found.
                </Text>
              </View>
            }
          />
        )}
      </View>

      {/* 🔹 FAB (Purple +) */}
      <TouchableOpacity
        onPress={() => router.push("/createUser")}
        activeOpacity={0.9}
        style={{
          position: "absolute",
          bottom: 45,
          right: 24,
          width: 56,
          height: 56,
          borderRadius: 28,
          alignItems: "center",
          justifyContent: "center",
          shadowColor: "#5B4CCC",
          shadowOffset: { width: 0, height: 15 },
          shadowOpacity: 1,
          shadowRadius: 40,
          elevation: 30,
        }}
        className="w-16 h-16 bg-[#5B4CCC] rounded-full"
      >
        <HugeiconsIcon icon={Add01Icon} size={32} color="white" />
      </TouchableOpacity>
    </View>
  );
}
