import api from "@/lib/api";
import { Ionicons } from "@expo/vector-icons";
import {
  Add01Icon,
  Calendar03Icon,
  Cancel01Icon,
  Menu02Icon,
  Search01Icon,
  Xsl01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { DrawerActions } from "@react-navigation/native";
import * as FileSystem from "expo-file-system";
import { useFocusEffect, useNavigation, useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import moment from "moment";
import { AnimatePresence, MotiView } from "moti";
import { Skeleton } from "moti/skeleton";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  RefreshControl,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import Toast from "react-native-toast-message";
import { useAuth } from "../context/AuthContext";
// import { exportSupportToExcel } from "../utils/supportExcel";

const FILTERS = ["All", "Open", "Unpublished", "Published"];

const TicketSkeleton = ({ isDarkMode }: { isDarkMode: boolean }) => (
  <View
    className="mb-4 mx-4 rounded-xl bg-[#F0F3F7] dark:bg-[#1A1A1A] p-3 py-4 "
    style={{ opacity: 0.6 }}
  >
    <View className="flex-row justify-between items-center mb-2">
      <Skeleton
        colorMode={isDarkMode ? "dark" : "light"}
        width={140}
        height={16}
        radius={4}
      />
      <View className="flex-row gap-2">
        <Skeleton
          colorMode={isDarkMode ? "dark" : "light"}
          width={80}
          height={16}
          radius={4}
        />
        <Skeleton
          colorMode={isDarkMode ? "dark" : "light"}
          width={60}
          height={16}
          radius={4}
        />
      </View>
    </View>

    <View className="mb-2">
      <Skeleton
        colorMode={isDarkMode ? "dark" : "light"}
        width="60%"
        height={22}
        radius={6}
      />
    </View>

    <View className="mb-4">
      <Skeleton
        colorMode={isDarkMode ? "dark" : "light"}
        width="100%"
        height={14}
        radius={4}
      />
      <View className="mt-1.5">
        <Skeleton
          colorMode={isDarkMode ? "dark" : "light"}
          width="80%"
          height={14}
          radius={4}
        />
      </View>
    </View>

    <View className="flex-row justify-between items-center">
      <Skeleton
        colorMode={isDarkMode ? "dark" : "light"}
        width={120}
        height={14}
        radius={4}
      />
      <Skeleton
        colorMode={isDarkMode ? "dark" : "light"}
        width={90}
        height={14}
        radius={4}
      />
    </View>
  </View>
);

const AppSupport = () => {
  const router = useRouter();
  const navigation = useNavigation();
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";
  const { token, user } = useAuth();

  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [downloadingExcel, setDownloadingExcel] = useState(false);

  // Track if it's the first load to show global spinner
  const isFirstLoad = useRef(true);

  const fetchTickets = useCallback(
    async (silent = false) => {
      try {
        if (!silent && !refreshing) setLoading(true);
        const response = await api.get("/support", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTickets(response.data.supports || []);
        // console.log(response.data.supports);
      } catch (err) {
        console.error("❌ Error fetching tickets:", err);
        if (!silent) {
          Toast.show({
            type: "error",
            text1: "Failed to load tickets",
            text2: "Please try again later.",
            position: "bottom",
          });
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token],
  );

  // Refresh tickets when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      // Use silent refresh if not first load
      fetchTickets(!isFirstLoad.current);
      isFirstLoad.current = false;
    }, [fetchTickets]),
  );

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTickets(true);
  };

  const handleExportExcel = async () => {
    if (downloadingExcel) return;
    setDownloadingExcel(true);

    try {
      const response = await api.get("/support/export", {
        responseType: "blob",
        headers: { Authorization: "Bearer " + token },
      });

      const fileName = `SupportTickets_${moment().format("DDMMMYYYY")}.xlsx`;

      if (Platform.OS === "web") {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      } else {
        const blobToBase64 = (blob: Blob) =>
          new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () =>
              resolve(reader.result?.toString().split(",")[1] || "");
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });

        const base64data = await blobToBase64(response.data);
        const fileUri = FileSystem.cacheDirectory + fileName;

        await FileSystem.writeAsStringAsync(fileUri, base64data, {
          encoding: FileSystem.EncodingType.Base64,
        });

        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri);
        } else {
          Toast.show({
            type: "info",
            text1: "Export complete",
            text2: "Sharing is not available on this device",
          });
        }
      }
    } catch (err) {
      console.error("❌ Excel export error:", err);
      Toast.show({
        type: "error",
        text1: "Export Failed",
        text2: "Could not export support tickets to Excel.",
      });
    } finally {
      setDownloadingExcel(false);
    }
  };

  const filteredTickets = useMemo(() => {
    let result = tickets;

    // Filter by category
    if (selectedFilter === "Open") {
      result = result.filter((t) => !t.fixed);
    } else if (selectedFilter === "Unpublished") {
      result = result.filter((t) => !t.published);
    } else if (selectedFilter === "Published") {
      result = result.filter((t) => t.published);
    }

    // Filter by search query (Raised By, Ticket ID, Related Page)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((t) => {
        const raisedBy = t.raisedBy?.fullName?.toLowerCase() || "";
        const ticketId = String(t.ticketId).toLowerCase();
        const relatedPage = t.relatedPage?.toLowerCase() || "";
        return (
          raisedBy.includes(query) ||
          ticketId.includes(query) ||
          relatedPage.includes(query)
        );
      });
    }

    return result;
  }, [tickets, selectedFilter, searchQuery]);

  const renderTicket = ({ item }: { item: any }) => {
    const isAdmin = user?.role === "admin";

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() =>
          //  isAdmin &&
          router.push({
            pathname: "/ticketResponse",
            params: {
              id: item._id,
              ticketId: item.ticketId,
              type: item.type,
              description: item.description,
              imageUrl: item.imageUrl,
              relatedPage: item.relatedPage,
              raisedBy: item.raisedBy?.fullName,
              date: item.createdAt,
              fixed: item.fixed,
              published: item.published,
              remark: item.remark || "",
            },
          })
        }
        className="mb-4 mx-4 rounded-xl bg-[#F0F3F7] dark:bg-[#1A1A1A] p-3 py-4 "
      >
        {/* Top Section: Info & Badges */}
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-[#454545] dark:text-[#919191] text-sm font-dmMedium">
            {item.type || "Issue"} • Ticket #{item.ticketId}
          </Text>

          <View className="flex-row gap-2">
            {/* Published Badge */}
            <View className="flex-row items-center gap-1">
              <View
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: 9,
                  backgroundColor: item.published ? "#16A34A" : "#EF4444",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons
                  name={item.published ? "checkmark" : "close"}
                  size={10}
                  color="#FFFFFF"
                />
              </View>
              <Text className="text-[#454545] dark:text-[#919191] text-sm font-poppins">
                {item.published ? "Published" : "Unpublished"}
              </Text>
            </View>

            {/* Status Badge */}
            <View className="flex-row items-center gap-1">
              <View
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: 9,
                  backgroundColor: item.fixed ? "#16A34A" : "#EF4444",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons
                  name={item.fixed ? "checkmark" : "close"}
                  size={10}
                  color="#FFFFFF"
                />
              </View>
              <Text className="text-[#454545] dark:text-[#919191] text-sm font-poppins">
                {item.fixed ? "Closed" : "Open"}
              </Text>
            </View>
          </View>
        </View>

        {/* Middle Section: Title & Description */}
        <Text className="text-lg font-dmMedium text-black dark:text-white mb-1">
          {item.relatedPage || "N/A"}
        </Text>
        <Text
          numberOfLines={2}
          className="text-[#454545] dark:text-[#D2D2D2] text-sm font-poppins leading-5 mb-3"
        >
          {item.description || "No description provided."}
        </Text>

        {/* Bottom Section: Raised By & Date */}
        <View className="flex-row justify-between items-center ">
          <Text className="text-[#454545] dark:text-[#919191] text-sm  font-poppins">
            Raised by -{" "}
            <Text className="text-black dark:text-white">
              {item.raisedBy?.fullName || "Unknown"}
            </Text>
          </Text>

          <View className="flex-row items-center gap-2">
            <HugeiconsIcon
              icon={Calendar03Icon}
              size={14}
              color={isDarkMode ? "#A1A1A1" : "#454545"}
            />
            <Text className="text-[#454545] dark:text-[#A1A1A1] text-sm font-poppins">
              {item.createdAt
                ? moment(item.createdAt).format("DD MMM YYYY")
                : "N/A"}
            </Text>
          </View>
        </View>
        {/* Remark Section */}
        {item.remark && (
          <View className="mt-1">
            <Text
              numberOfLines={2}
              ellipsizeMode="tail"
              className="text-[#454545] dark:text-[#919191] text-sm font-poppins"
            >
              Remark by Dev -{" "}
              <Text className="text-black dark:text-white">{item.remark}</Text>
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View className="flex-1 bg-[#FBFCFD] dark:bg-black">
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />

      {/* 🔹 CUSTOM HEADER */}
      <View className="flex-row items-center justify-between px-4 pb-3 pt-16">
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
          <Text className="text-xl font-dmBold text-black dark:text-white">
            App Support
          </Text>
        </View>

        <View className="flex-row gap-4 items-center">
          <TouchableOpacity onPress={() => setShowSearch(!showSearch)}>
            <HugeiconsIcon
              icon={showSearch ? Cancel01Icon : Search01Icon}
              size={24}
              color={isDarkMode ? "#FFF" : "#000"}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleExportExcel}
            disabled={downloadingExcel}
          >
            {downloadingExcel ? (
              <ActivityIndicator
                size="small"
                color={isDarkMode ? "#FFF" : "#000"}
              />
            ) : (
              <HugeiconsIcon
                icon={Xsl01Icon}
                size={24}
                color={isDarkMode ? "#FFF" : "#000"}
              />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* 🔹 SEARCH BAR */}
      <AnimatePresence>
        {showSearch && (
          <MotiView
            from={{ opacity: 0, translateY: -10 }}
            animate={{ opacity: 1, translateY: 0 }}
            exit={{ opacity: 0, translateY: -10 }}
            transition={{ type: "timing", duration: 250 }}
            className="px-4 pb-2"
          >
            <View className="flex-row items-center bg-[#F0F3F7] dark:bg-[#1A1A1A] rounded-xl px-3 py-2 border border-[#E0E5EB] dark:border-[#333]">
              <HugeiconsIcon
                icon={Search01Icon}
                size={18}
                color={isDarkMode ? "#A1A1A1" : "#6B7280"}
              />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search by Raised By, Ticket #, or Page..."
                placeholderTextColor={isDarkMode ? "#6B7280" : "#9CA3AF"}
                className="flex-1 ml-2 text-black dark:text-white font-poppins text-sm"
                autoFocus
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery("")}>
                  <Ionicons
                    name="close-circle"
                    size={20}
                    color={isDarkMode ? "#6B7280" : "#9CA3AF"}
                  />
                </TouchableOpacity>
              )}
            </View>
          </MotiView>
        )}
      </AnimatePresence>

      {/* 🔹 FILTERS */}
      <View className="py-4">
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
                      ? "#11162F"
                      : "#DDE2FB"
                    : "transparent",
                  borderColor: isActive
                    ? "#566FEC"
                    : isDarkMode
                      ? "#413E47"
                      : "#E0E5EB",
                  borderWidth: 1,
                  paddingHorizontal: 24,
                  paddingVertical: 10,
                  borderRadius: 50,
                  marginRight: 10,
                }}
              >
                <Text
                  className="font-poppinsMedium text-sm"
                  style={{
                    color: isActive
                      ? "#566FEC"
                      : isDarkMode
                        ? "#F5F5F5"
                        : "#000",
                  }}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* 🔹 TICKETS LIST */}
      <View className="flex-1">
        {loading && !refreshing ? (
          <FlatList
            data={[1, 2, 3,4]}
            keyExtractor={(item) => `skeleton-${item}`}
            renderItem={() => <TicketSkeleton isDarkMode={isDarkMode} />}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <FlatList
            data={filteredTickets}
            keyExtractor={(item) => item._id}
            renderItem={renderTicket}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100 }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={["#5B4CCC"]}
              />
            }
            ListEmptyComponent={
              <View className="mt-20 items-center px-6">
                <Text className="text-[#8E8E8E] font-poppins text-center text-base">
                  No tickets found.
                </Text>
              </View>
            }
          />
        )}
      </View>

      {/* 🔹 FLOATING ACTION BUTTON */}
      <TouchableOpacity
        onPress={() => router.push("/appSupportForm")}
        activeOpacity={0.9}
        style={{
          position: "absolute",
          bottom: 45,
          right: 24,
          width: 50,
          height: 50,
          borderRadius: 32,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#5B4CCC",
          shadowColor: "#5B4CCC",
          shadowOffset: { width: 0, height: 15 },
          shadowOpacity: 0.5,
          shadowRadius: 20,
          elevation: 20,
        }}
      >
        <HugeiconsIcon icon={Add01Icon} size={28} color="white" />
      </TouchableOpacity>
    </View>
  );
};

export default AppSupport;
