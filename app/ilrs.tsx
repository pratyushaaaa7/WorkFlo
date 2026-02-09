import { useILRFilterStore } from "@/store/ilrFilterStore";
import Activity from "@/types/ILRActivity";
import { Ionicons } from "@expo/vector-icons";
import {
  Add01Icon,
  ArrowDown01Icon,
  ArrowLeft01Icon,
  Calendar03Icon,
  Cancel01Icon,
  CheckmarkCircle02Icon,
  MoreHorizontalIcon,
  Pdf01Icon,
  PrinterIcon,
  Search01Icon,
  Xsl01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { AnimatePresence, MotiView } from "moti";
import React, { useContext, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
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
import { exportILRsToExcel } from "../utils/ilrExcel";

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
  const [exportMenuVisible, setExportMenuVisible] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

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
        console.log(res.data);
      } catch (err) {
        console.error("Error fetching ILRs:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchILRs();
  }, [token, projectId]);

  const handleDownloadExcel = async () => {
    setExportMenuVisible(false);
    await exportILRsToExcel(
      ilrs as any,
      projectName as string,
      auth?.user?.fullName || auth?.user?.username || "Self",
      auth?.user?.company || "WP",
    );
  };

  const handleDownloadPDF = () => {
    setExportMenuVisible(false);
    console.log("PDF Export triggered");
  };

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
      const rawDate = item.createdAt || item.targetDate;
      let date = "Unknown Date";

      if (rawDate) {
        const d = new Date(rawDate);
        if (!isNaN(d.getTime())) {
          date = d.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          });
        }
      }

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
          bg: isDarkMode ? "bg-[#282446]" : "bg-[#D7DEF2]",
          text: "text-[#5B4CCC] dark:text-[#9486FB]",
          dot: "bg-[#5B4CCC] dark:bg-[#9486FB]",
        };
      // case "in progress":
      //   return {
      //     bg: isDarkMode ? "bg-[#121A21]" : "bg-[#E0F2FE]",
      //     text: "text-blue-600 dark:text-blue-400",
      //     dot: "bg-blue-600 dark:bg-blue-400",
      //   };
      case "closed":
        return {
          bg: isDarkMode ? "bg-[#0A4230]" : "bg-[#E8F9ED]",
          text: "text-[#1AA45B] dark:text-[#10B981]",
          dot: "bg-[#1AA45B] dark:bg-[#10B981]",
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
      const rawDate = item.updatedAt || item.targetDate;
      let dateStr = "N/A";

      if (rawDate) {
        const d = new Date(rawDate);
        if (!isNaN(d.getTime())) {
          dateStr = d.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          });
        }
      }
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
      text: !isNaN(target.getTime())
        ? target.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
        : "N/A",
      color: "text-gray-500 dark:text-gray-400",
      icon: Calendar03Icon,
    };
  };

  const renderItem = ({
    item,
    index,
    section,
  }: {
    item: ILR;
    index: number;
    section: any;
  }) => {
    const statusCfg = getStatusConfig(item.status);
    const dueInfo = getDueIndicator(item);
    const isFirst = index === 0;
    const isLast = index === section.data.length - 1;
    const isSelected = selectedIds.has(item._id);

    const toggleSelection = (id: string) => {
      const newSelected = new Set(selectedIds);
      if (newSelected.has(id)) {
        newSelected.delete(id);
      } else {
        newSelected.add(id);
      }
      setSelectedIds(newSelected);
      if (newSelected.size === 0) setSelectionMode(false);
    };

    return (
      <View
        className={`border-x bg-[#F6F8FA] dark:bg-[#1A1A1A]
          ${isSelected ? "z-10" : "border-[#F1F5F9] dark:border-zinc-800/50"}
          ${isFirst ? "rounded-t-[16px] border-t" : ""} 
          ${isLast ? "rounded-b-[16px] border-b mb-2" : isSelected ? "" : "border-b border-b-gray-200/50 dark:border-b-zinc-800/20"}`}
        style={isSelected ? { borderWidth: 1.5, borderColor: "#566FEC" } : {}}
      >
        {isFirst && (
          <View className="px-4 py-3 bg-[#F0F3F7] dark:bg-white/5 border-b border-b-gray-200/30 dark:border-b-zinc-800/20 rounded-t-[16px]">
            <Text className="text-[15px] font-dmMedium text-[#000] dark:text-[#FFF]">
              {section.title}
            </Text>
          </View>
        )}
        <TouchableOpacity
          onPress={() => {
            if (selectionMode) {
              toggleSelection(item._id);
            } else {
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
            }
          }}
          onLongPress={() => {
            if (!selectionMode) {
              setSelectionMode(true);
              const newSelected = new Set(selectedIds);
              newSelected.add(item._id);
              setSelectedIds(newSelected);
            }
          }}
          activeOpacity={0.7}
          className="p-3"
        >
          <View className="flex-row items-center mb-1.5 ">
            <View className="flex-1 mr-2">
              <Text className="text-[16px] font-dmMedium text-black dark:text-white leading-[18px]">
                {item.ilrNumber}. {item.description}
              </Text>
            </View>
            {selectionMode && (
              <HugeiconsIcon
                icon={CheckmarkCircle02Icon}
                size={20}
                color={isSelected ? "#4F46E5" : "#94A3B8"}
                variant={isSelected ? "solid" : "stroke"}
              />
            )}
          </View>
          <Text
            numberOfLines={2}
            className="text-[13px] font-poppins text-gray-500 dark:text-gray-400 mb-4 leading-[20px]"
          >
            {item.remarks || "No additional details provided for this issue."}
          </Text>

          <View className="flex-row items-center justify-between">
            <View
              className={`flex-row items-center px-2 py-1 rounded-lg ${statusCfg.bg}`}
            >
              <View
                className={`w-1.5 h-1.5 rounded-full mr-2 ${statusCfg.dot}`}
              />
              <Text
                className={`text-[12px] font-poppinsMedium ${statusCfg.text}`}
              >
                {item.status}
              </Text>
            </View>

            <View className="flex-row items-center">
              <HugeiconsIcon
                icon={dueInfo.icon}
                size={14}
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
                className={`text-[12px] font-poppinsMedium ml-1.5 ${dueInfo.color}`}
              >
                {dueInfo.text}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-[#FBFCFD] dark:bg-black">
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />

      {/* Header */}
      <View className="pt-14 px-4 pb-4 flex-row items-center justify-between">
        {selectionMode ? (
          <View className="flex-row items-center justify-between flex-1">
            <View className="flex-row items-center">
              <TouchableOpacity
                onPress={() => {
                  setSelectionMode(false);
                  setSelectedIds(new Set());
                }}
                className="mr-4"
              >
                <HugeiconsIcon
                  icon={Cancel01Icon}
                  size={24}
                  color={isDarkMode ? "#FFF" : "#2D3436"}
                />
              </TouchableOpacity>
              <Text className="text-[18px] font-dmBold text-[#2D3436] dark:text-white">
                {selectedIds.size} Selected
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                // Handle printing logic here
                console.log("Printing selected ILRs:", Array.from(selectedIds));
              }}
              className="bg-[#4F46E5] px-4 py-2 rounded-lg flex-row items-center"
            >
              <HugeiconsIcon icon={PrinterIcon} size={18} color="white" />
              <Text className="text-white font-poppinsMedium ml-2">Print</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
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
              <TouchableOpacity
                onPress={() => {
                  if (showSearch) setSearchQuery("");
                  setShowSearch(!showSearch);
                }}
              >
                <HugeiconsIcon
                  icon={showSearch ? Cancel01Icon : Search01Icon}
                  size={24}
                  color={isDarkMode ? "#FFF" : "#2D3436"}
                />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setExportMenuVisible(true)}>
                <HugeiconsIcon
                  icon={MoreHorizontalIcon}
                  size={24}
                  color={isDarkMode ? "#FFF" : "#2D3436"}
                />
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>

      {/* Export Menu (Fast Overlay) */}
      {exportMenuVisible && (
        <View
          className="absolute top-[-12] left-0 right-0 bottom-0 z-[50]"
          pointerEvents="box-none"
        >
          <Pressable
            className="absolute inset-0"
            onPress={() => setExportMenuVisible(false)}
          />
          <View className="absolute top-[100px] right-1">
            {/* Menu Container */}
            <View
              className="bg-white dark:bg-[#1A1A1A] border border-[transparent] dark:border-[#2A2A2A] rounded-2xl p-2"
              style={{
                elevation: 25,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 12 },
                shadowOpacity: 0.2,
                shadowRadius: 16,
                minWidth: 170,
              }}
            >
              {/* Triangle Pointer */}
              <View
                className="absolute rounded-md right-4 -top-1.5 w-4 h-4 bg-white dark:bg-[#1A1A1A] rotate-45 "
                style={{
                  zIndex: -1,
                }}
              />

              <TouchableOpacity
                onPress={handleDownloadPDF}
                className="flex-row items-center  p-3 rounded-xl active:bg-gray-100 dark:active:bg-[#252525]"
              >
                <HugeiconsIcon
                  icon={Pdf01Icon}
                  size={24}
                  color={isDarkMode ? "#D2D2D2" : "#454545"}
                />
                <Text className="ml-3 text-base font-dmMedium text-[#454545] dark:text-[#D2D2D2]">
                  Export PDF
                </Text>
              </TouchableOpacity>

              <View className="h-[1px] bg-gray-100 dark:bg-[#252525] mx-2" />

              <TouchableOpacity
                onPress={handleDownloadExcel}
                className="flex-row items-center p-3 rounded-xl active:bg-gray-100 dark:active:bg-[#252525]"
              >
                <HugeiconsIcon
                  icon={Xsl01Icon}
                  size={24}
                  color={isDarkMode ? "#D2D2D2" : "#454545"}
                />
                <Text className="ml-3 text-base font-dmMedium text-[#454545] dark:text-[#D2D2D2]">
                  Export Excel
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Filter Chips Bar */}
      <View className="pb-3">
        <View className="flex-row items-center gap-2 pl-4">
          {/* Date Picker Button */}
          <TouchableOpacity className="flex-row items-center bg-[#F5F5F5] dark:bg-[#1A1A1A] px-4 py-2 rounded-[8px] border border-[#F1F5F9] dark:border-zinc-800">
            <Text className="text-[14px] font-poppinsMedium text-black dark:text-white mr-2">
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
                    paddingVertical: 6,
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
              from={{ opacity: 0, translateY: -10 }}
              animate={{ opacity: 1, translateY: 0 }}
              exit={{ opacity: 0, translateY: -10 }}
              transition={{ type: "timing", duration: 250 }}
              className="mt-3"
            >
              <View className="flex-row items-center bg-[#F8FAFC] dark:bg-[#1A1A1A] px-4 py-2.5 rounded-[20px] border border-[#F1F5F9] dark:border-zinc-800 mx-4">
                <HugeiconsIcon icon={Search01Icon} size={18} color="#94A3B8" />
                <TextInput
                  placeholder="Search by subject & responsibility"
                  placeholderTextColor="#94A3B8"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  className="flex-1 ml-3 text-[14px] font-poppins text-black dark:text-white pt-0.5"
                  autoFocus
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery("")}>
                    <Ionicons
                      name="close-circle"
                      size={20}
                      color={isDarkMode ? "#6B7280" : "#94A3B8"}
                    />
                  </TouchableOpacity>
                )}
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
            renderSectionHeader={() => <View className="h-2" />}
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

export default ILRs;
