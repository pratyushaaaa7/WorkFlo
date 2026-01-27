import api from "@/lib/api";
import { Ionicons } from "@expo/vector-icons";
import {
  Add01Icon,
  Calendar03Icon,
  Menu02Icon,
  Search01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { DrawerActions } from "@react-navigation/native";
import { useNavigation, useRouter } from "expo-router";
import moment from "moment";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import Toast from "react-native-toast-message";
import { useAuth } from "../context/AuthContext";

const FILTERS = ["All", "Open", "Unpublished", "Published"];

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

  const fetchTickets = async () => {
    try {
      if (!refreshing) setLoading(true);
      const response = await api.get("/support", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTickets(response.data.supports || []);
      // console.log(response.data.supports);
    } catch (err) {
      console.error("❌ Error fetching tickets:", err);
      Toast.show({
        type: "error",
        text1: "Failed to load tickets",
        text2: "Please try again later.",
        position: "bottom",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTickets();
  };

  const filteredTickets = useMemo(() => {
    if (selectedFilter === "All") return tickets;
    if (selectedFilter === "Open") return tickets.filter((t) => !t.fixed);
    if (selectedFilter === "UnPublished")
      return tickets.filter((t) => !t.published);
    if (selectedFilter === "Published")
      return tickets.filter((t) => t.published);
    return tickets;
  }, [tickets, selectedFilter]);

  const renderTicket = ({ item }: { item: any }) => {
    const isAdmin = user?.role === "admin";

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() =>
          isAdmin &&
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
        className="mb-4 mx-4 rounded-xl bg-[#F0F3F7] dark:bg-[#1A1A1A] p-3 py-4 shadow-sm"
      >
        {/* Top Section: Info & Badges */}
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-[#454545] dark:text-[#919191] text-sm font-dmMedium">
            {item.type || "Issue"} • Ticket #{item.ticketId}
          </Text>

          <View className="flex-row gap-2">
            {/* Published Badge */}
            <View className="flex-row items-center gap-1">
              <Ionicons
                name={item.published ? "checkmark-circle" : "close-circle"}
                size={16}
                color={item.published ? "#16A34A" : "#EF4444"}
              />
              <Text className="text-[#454545] dark:text-[#919191] text-sm font-poppins">
                {item.published ? "Published" : "Unpublished"}
              </Text>
            </View>

            {/* Status Badge */}
            <View className="flex-row items-center gap-1">
              <Ionicons
                name={item.fixed ? "checkmark-circle" : "close-circle"}
                size={16}
                color={item.fixed ? "#16A34A" : "#EF4444"}
              />
              <Text className="text-[#454545] dark:text-[#919191] text-sm font-poppins">
                {item.fixed ? "Close" : "Open"}
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
            <Text className="text-[#454545] dark:text-[#919191] text-sm  font-poppins">
              Remark by Dev -{" "}
              <Text className="text-black dark:text-white">
                {item.remark}
              </Text>
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
      <View className="flex-row items-center justify-between px-4 py-3 pt-14">
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

        <TouchableOpacity>
          <HugeiconsIcon
            icon={Search01Icon}
            size={24}
            color={isDarkMode ? "#FFF" : "#000"}
          />
        </TouchableOpacity>
      </View>

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
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#5B4CCC" />
            <Text className="mt-4 text-[#8E8E8E] font-poppins">
              Loading tickets...
            </Text>
          </View>
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
