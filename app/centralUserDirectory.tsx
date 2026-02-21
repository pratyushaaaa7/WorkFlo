import {
  Add01Icon,
  Cancel01Icon,
  Menu02Icon,
  Search01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { DrawerActions } from "@react-navigation/native";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { Skeleton } from "moti/skeleton";
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

const getDisplayName = (user: any) => {
  if (user.salutation) {
    return `${user.salutation} ${user.individualName}`;
  }

  // fallback for old data
  if (user.gender === "Male") return `Mr ${user.individualName}`;
  if (user.gender === "Female") return `Ms ${user.individualName}`;

  return user.individualName;
};

const UserDirectorySkeleton = ({ isDarkMode }: { isDarkMode: boolean }) => (
  <View
    className="mb-3 mx-4 rounded-2xl bg-[#F0F3F7] dark:bg-[#1A1A1A] p-4"
    style={{ opacity: 0.6 }}
  >
    <View className="flex-row items-center flex-wrap mb-2">
      <Skeleton
        colorMode={isDarkMode ? "dark" : "light"}
        width={60}
        height={16}
        radius={4}
      />
      <View className="ml-3">
        <Skeleton
          colorMode={isDarkMode ? "dark" : "light"}
          width={140}
          height={20}
          radius={4}
        />
      </View>
      <View className="ml-3">
        <Skeleton
          colorMode={isDarkMode ? "dark" : "light"}
          width={80}
          height={16}
          radius={4}
        />
      </View>
    </View>

    <View className="flex-row items-center flex-wrap">
      <Skeleton
        colorMode={isDarkMode ? "dark" : "light"}
        width={100}
        height={14}
        radius={4}
      />
      <View className="mx-2">
       
      </View>
      <Skeleton
        colorMode={isDarkMode ? "dark" : "light"}
        width={120}
        height={14}
        radius={4}
      />
    </View>
  </View>
);

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
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 30;

  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("All");
  const { refresh } = useLocalSearchParams<{ refresh: string }>();

  // ✅ Fetch Users (Paginated)
  const fetchUsers = async (pageNum: number = 1, append: boolean = false) => {
    try {
      if (!append) setLoading(true);
      else setLoadingMore(true);

      const res = await api.get(`/user-directory`, {
        params: {
          page: pageNum,
          limit: ITEMS_PER_PAGE,
        },
        headers: { Authorization: `Bearer ${token}` },
      });

      // 🧩 Backend now returns { users: [], total: 100, ... }
      const newUsers = res.data.users || [];
      const total = res.data.total || 0;

      if (append) {
        setUsers((prev) => {
          // 🛡️ Prevent duplicates using _id
          const existingIds = new Set(prev.map((u: any) => u._id));
          const uniqueNewUsers = newUsers.filter(
            (u: any) => !existingIds.has(u._id),
          );
          return [...prev, ...uniqueNewUsers];
        });
      } else {
        setUsers(newUsers);
      }

      // ✅ Determine if there are more pages based on total count
      setHasMore(pageNum * ITEMS_PER_PAGE < total);
    } catch (err) {
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  const lastRefresh = React.useRef<string | null>(null);
  useEffect(() => {
    if (token) {
      // Refresh if:
      // 1. List is empty
      // 2. We have a NEW refresh signal that we haven't handled yet
      if (users.length === 0 || (refresh && refresh !== lastRefresh.current)) {
        fetchUsers(1, false);
        if (refresh) lastRefresh.current = refresh;
      }
    }
  }, [token, refresh]);

  const onRefresh = () => {
    setRefreshing(true);
    setPage(1);
    setHasMore(true);
    fetchUsers(1, false);
  };

  const loadMore = () => {
    if (!loadingMore && hasMore && !loading) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchUsers(nextPage, true);
    }
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
          {getDisplayName(item) || "Unnamed"}
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
              size={20}
              color={isDarkMode ? "#606060" : "#454545"}
            />
            <TextInput
              placeholder="Search"
              placeholderTextColor="#9CA3AF"
              className="ml-2 flex-1 font-dm text-gray-900 dark:text-white text-base"
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
          keyExtractor={(item, index) => item + index}
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
          <FlatList
            data={[1, 2, 3, 4, 5, 6]}
            keyExtractor={(item) => `skeleton-${item}`}
            renderItem={() => <UserDirectorySkeleton isDarkMode={isDarkMode} />}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <FlatList
            data={filteredUsers}
            keyExtractor={(item, index) =>
              item._id?.toString() || index.toString()
            }
            renderItem={renderUser}
            showsVerticalScrollIndicator={false}
            onEndReached={loadMore}
            onEndReachedThreshold={0.5}
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
            ListFooterComponent={
              loadingMore ? (
                <View className="py-4 items-center">
                  <ActivityIndicator size="small" color="#6366F1" />
                  <Text className="text-gray-400 text-sm mt-2">
                    Loading more...
                  </Text>
                </View>
              ) : null
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
