import { useILRFilterStore } from "@/store/ilrFilterStore";
import Activity from "@/types/ILRActivity";
import {
  ArrowDown01Icon,
  ArrowLeft01Icon,
  Calendar03Icon,
  MoreHorizontalIcon,
  Search01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { AnimatePresence, MotiView } from "moti";
import React, { useContext, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  SectionList,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import { AuthContext } from "../context/AuthContext";
import api from "../lib/api";

type ILR = {
  _id: string;
  ilrNumber: number;
  description: string;
  targetDate: string;
  remarks: string;
  activities?: Activity[];
  responsibility?: {
    _id: string;
    individualName: string;
    designation: string;
    firmName: string;
    name: string;
  }[];
  status: "Open" | "Closed" | "In Progress";
  createdBy?: { _id: string; username: string; fullName: string };
  createdAt: string;
  updatedAt: string;
  delayDays?: number;
  overdueDays?: number;
};

const ILRs = () => {
  const router = useRouter();
  const { projectId, projectName } = useLocalSearchParams();
  const auth = useContext(AuthContext);
  const token = auth?.token;
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";

  const [ilrs, setIlrs] = useState<ILR[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  const {
    filter,
    searchQuery,
    startDate,
    endDate,
    setFilter,
    setSearchQuery,
    reset,
  } = useILRFilterStore();

  useEffect(() => {
    const fetchILRs = async () => {
      if (!token || !projectId) return;
      try {
        setLoading(true);
        const res = await api.get(`/ilrs/${projectId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setIlrs(res.data);
      } catch (err) {
        console.error("Error fetching ILRs:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchILRs();
  }, [token, projectId]);

  const sections = useMemo(() => {
    const filtered = ilrs.filter((ilr) => {
      if (filter !== "  All  " && ilr.status !== filter) return false;

      const target = new Date(ilr.targetDate);
      if (startDate && target < new Date(startDate)) return false;
      if (endDate && target > new Date(endDate)) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const descMatch = ilr.description?.toLowerCase().includes(q);
        const numMatch = String(ilr.ilrNumber).includes(q);
        const responsibilityMatch = (ilr.responsibility || []).some((r) =>
          (r.name || r.individualName || "").toLowerCase().includes(q),
        );
        if (!descMatch && !numMatch && !responsibilityMatch) return false;
      }
      return true;
    });

    const sorted = [...filtered].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    const groups: { [key: string]: ILR[] } = {};
    sorted.forEach((item) => {
      const date = new Date(item.createdAt).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
      if (!groups[date]) groups[date] = [];
      groups[date].push(item);
    });

    return Object.keys(groups).map((date) => ({
      title: date,
      data: groups[date],
    }));
  }, [ilrs, filter, searchQuery, startDate, endDate]);

  const getStatusConfig = (status: string) => {
    const s = status?.toLowerCase();
    switch (s) {
      case "open":
        return {
          bg: isDarkMode ? "bg-[#25254A]" : "bg-[#E0E7FF]",
          text: "text-[#4F46E5] dark:text-[#A5B4FC]",
          dot: "bg-[#4F46E5] dark:bg-[#A5B4FC]",
        };
      case "in progress":
        return {
          bg: isDarkMode ? "bg-[#121A21]" : "bg-[#E0F2FE]",
          text: "text-blue-600 dark:text-blue-400",
          dot: "bg-blue-600 dark:bg-blue-400",
        };
      case "closed":
        return {
          bg: isDarkMode ? "bg-[#11221A]" : "bg-[#DCFCE7]",
          text: "text-green-600 dark:text-green-400",
          dot: "bg-green-600 dark:bg-green-400",
        };
      default:
        return {
          bg: "bg-gray-100 dark:bg-gray-800",
          text: "text-gray-600 dark:text-gray-400",
          dot: "bg-gray-600 dark:bg-gray-400",
        };
    }
  };

  const getDueIndicator = (item: ILR) => {
    if (item.status === "Closed") {
      const dateStr = new Date(item.updatedAt).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
      return {
        text: dateStr,
        color: "text-green-600 dark:text-green-400",
        icon: Calendar03Icon,
      };
    }

    if (item.overdueDays && item.overdueDays > 0) {
      return {
        text: `Delay - ${item.overdueDays}`,
        color: "text-red-500",
        icon: Calendar03Icon,
      };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(item.targetDate);
    target.setHours(0, 0, 0, 0);

    if (today.getTime() === target.getTime()) {
      return {
        text: "Today",
        color: "text-[#4F46E5] dark:text-[#A5B4FC]",
        icon: Calendar03Icon,
      };
    }

    return {
      text: target.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
      color: "text-gray-500 dark:text-gray-400",
      icon: Calendar03Icon,
    };
  };

  const renderItem = ({ item }: { item: ILR }) => {
    const statusCfg = getStatusConfig(item.status);
    const dueInfo = getDueIndicator(item);

    return (
      <TouchableOpacity
        onPress={() => {
          router.push({
            pathname: "/ilrActivities",
            params: {
              ilrId: item._id,
              projectName,
              description: item.description,
              targetDate: item.targetDate,
              remarks: item.remarks,
              responsibility: JSON.stringify(item.responsibility || []),
              status: item.status,
              createdBy: item.createdBy?.fullName || "System",
              createdAt: item.createdAt,
              ilrNumber: item.ilrNumber,
            },
          });
        }}
        activeOpacity={0.7}
        className="bg-[#F8FAFC] dark:bg-[#1A1A1A] rounded-[24px] p-5 mb-4 border border-[#F1F5F9] dark:border-zinc-800/50 shadow-sm"
      >
        <Text className="text-[17px] font-dmBold text-black dark:text-white mb-1.5 leading-[22px]">
          {item.ilrNumber}. {item.description}
        </Text>
        <Text
          numberOfLines={2}
          className="text-[14px] font-poppins text-gray-500 dark:text-gray-400 mb-4 leading-[20px]"
        >
          {item.remarks || "No additional details provided for this issue."}
        </Text>

        <View className="flex-row items-center justify-between">
          <View
            className={`flex-row items-center px-3 py-1.5 rounded-full ${statusCfg.bg}`}
          >
            <View
              className={`w-1.5 h-1.5 rounded-full mr-2 ${statusCfg.dot}`}
            />
            <Text
              className={`text-[12px] font-poppinsSemiBold ${statusCfg.text}`}
            >
              {item.status}
            </Text>
          </View>

          <View className="flex-row items-center">
            <HugeiconsIcon
              icon={dueInfo.icon}
              size={16}
              color={
                dueInfo.color === "text-red-500"
                  ? "#EF4444"
                  : dueInfo.color.includes("green")
                    ? "#10B981"
                    : isDarkMode
                      ? "#7C95FF"
                      : "#5B4CCC"
              }
            />
            <Text
              className={`text-[13px] font-poppinsMedium ml-1.5 ${dueInfo.color}`}
            >
              {dueInfo.text}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View className="flex-1 bg-white dark:bg-black">
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />

      {/* Header */}
      <View className="pt-14 px-4 pb-4 flex-row items-center justify-between">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <HugeiconsIcon
              icon={ArrowLeft01Icon}
              size={24}
              color={isDarkMode ? "#FFF" : "#2D3436"}
            />
          </TouchableOpacity>
          <Text className="text-[20px] font-dmBold text-[#2D3436] dark:text-white">
            ILRs
          </Text>
        </View>

        <View className="flex-row items-center gap-4">
          <TouchableOpacity onPress={() => setShowSearch(!showSearch)}>
            <HugeiconsIcon
              icon={Search01Icon}
              size={24}
              color={isDarkMode ? "#FFF" : "#2D3436"}
            />
          </TouchableOpacity>
          <TouchableOpacity>
            <HugeiconsIcon
              icon={MoreHorizontalIcon}
              size={24}
              color={isDarkMode ? "#FFF" : "#2D3436"}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Filter Chips Bar */}
      <View className="pb-3">
        <View className="flex-row items-center gap-2 pl-4">
          {/* Date Picker Button */}
          <TouchableOpacity className="flex-row items-center bg-[#F8FAFC] dark:bg-[#1A1A1A] px-4 py-3 rounded-[20px] border border-[#F1F5F9] dark:border-zinc-800">
            <Text className="text-[14px] font-poppinsMedium text-gray-700 dark:text-gray-300 mr-2">
              Date
            </Text>
            <HugeiconsIcon
              icon={ArrowDown01Icon}
              size={16}
              color={isDarkMode ? "#94A3B8" : "#64748B"}
            />
          </TouchableOpacity>

          {/* Status Pills */}
          <FlatList
            horizontal
            className="flex-1"
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 10, paddingRight: 16 }}
            data={["  All  ", "Open", "Closed"]}
            keyExtractor={(item: string) => item}
            renderItem={({ item: f }: { item: string }) => {
              const isActive = filter === f;
              return (
                <TouchableOpacity
                  onPress={() => setFilter(f as any)}
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
                  }}
                >
                  <Text
                    className="font-poppins text-[14px]"
                    style={{
                      color: isActive
                        ? "#566FEC"
                        : isDarkMode
                          ? "#fff"
                          : "#000",
                    }}
                  >
                    {f}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />
        </View>

        <AnimatePresence>
          {showSearch && (
            <MotiView
              from={{ opacity: 0, scaleY: 0.8 }}
              animate={{ opacity: 1, scaleY: 1 }}
              exit={{ opacity: 0, scaleY: 0.8 }}
              className="mt-3 origin-top"
            >
              <View className="flex-row items-center bg-[#F8FAFC] dark:bg-[#1A1A1A] px-4 py-2.5 rounded-[20px] border border-[#F1F5F9] dark:border-zinc-800 mx-4">
                <HugeiconsIcon icon={Search01Icon} size={18} color="#94A3B8" />
                <TextInput
                  placeholder="Search issues, responsibility..."
                  placeholderTextColor="#94A3B8"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  className="flex-1 ml-3 text-[14px] font-poppins text-black dark:text-white pt-0.5"
                />
              </View>
            </MotiView>
          )}
        </AnimatePresence>
      </View>

      {/* Main List content */}
      <View className="flex-1 px-4">
        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#5B4CCC" />
          </View>
        ) : (
          <SectionList
            sections={sections}
            keyExtractor={(item) => item._id}
            renderItem={renderItem}
            renderSectionHeader={({ section: { title } }) => (
              <View className="bg-white dark:bg-black pt-4 pb-4">
                <Text className="text-[17px] font-dmBold text-black dark:text-white">
                  {title}
                </Text>
              </View>
            )}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100 }}
            ListEmptyComponent={() => (
              <View className="flex-1 items-center justify-center pt-20">
                <Text className="text-gray-500 font-poppinsMedium text-[15px]">
                  No issues found matching your filters
                </Text>
              </View>
            )}
          />
        )}
      </View>

      {/* Floating Action Button */}
      <TouchableOpacity
        onPress={() =>
          router.push(
            `/ilrForm?projectId=${projectId}&projectName=${projectName}`,
          )
        }
        activeOpacity={0.8}
        className="absolute bottom-10 right-6 w-16 h-16 bg-[#5B4CCC] rounded-full items-center justify-center shadow-lg"
        style={{
          shadowColor: "#5B4CCC",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.3,
          shadowRadius: 10,
          elevation: 10,
        }}
      >
        <Text className="text-white text-[32px] leading-[40px] font-dmBold">
          +
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default ILRs;
