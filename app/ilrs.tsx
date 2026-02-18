import { useILRFilterStore } from "@/store/ilrFilterStore";
import Activity from "@/types/ILRActivity";
import { Ionicons } from "@expo/vector-icons";
import {
  Add01Icon,
  ArrowDown01Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Calendar03Icon,
  Cancel01Icon,
  MoreHorizontalIcon,
  Pdf01Icon,
  Search01Icon,
  Tick02Icon,
  Xsl01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { AnimatePresence, MotiView } from "moti";
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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
import { Calendar } from "react-native-calendars";
import Modal from "react-native-modal";
import { AuthContext } from "../context/AuthContext";
import api from "../lib/api";
// import { exportILRsToExcel } from "../utils/ilrExcel";

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
  const [refreshing, setRefreshing] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [exportMenuVisible, setExportMenuVisible] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Date Filter Modal State
  const [dateFilterVisible, setDateFilterVisible] = useState(false);
  const [tempStartDate, setTempStartDate] = useState<string | null>(null);
  const [tempEndDate, setTempEndDate] = useState<string | null>(null);
  const [currentCalendarDate, setCurrentCalendarDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [modalView, setModalView] = useState<"MENU" | "CALENDAR">("MENU");
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [selectionType, setSelectionType] = useState<"single" | "range">(
    "range",
  );

  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const years = Array.from({ length: 21 }, (_, i) =>
    (new Date().getFullYear() - 10 + i).toString(),
  );

  // Track if it's the first load to show global spinner
  const isFirstLoad = useRef(true);

  // Reset first load if project changes
  useEffect(() => {
    isFirstLoad.current = true;
  }, [projectId]);

  const {
    filter,
    searchQuery,
    startDate,
    endDate,
    setFilter,
    setSearchQuery,
    setStartDate,
    setEndDate,
    reset,
  } = useILRFilterStore();

  const onDayPress = (day: any) => {
    const dateString = day.dateString;

    if (selectionType === "single") {
      setTempStartDate(dateString);
      setTempEndDate(dateString);
      // Immediately apply for single selection
      const selectedDate = new Date(dateString);
      setStartDate(selectedDate);
      setEndDate(selectedDate);
      setDateFilterVisible(false);
      return;
    }

    if (!tempStartDate || (tempStartDate && tempEndDate)) {
      setTempStartDate(dateString);
      setTempEndDate(null);
    } else {
      if (dateString < tempStartDate) {
        setTempStartDate(dateString);
        setTempEndDate(null);
      } else {
        setTempEndDate(dateString);
      }
    }
  };

  const applyDateFilter = () => {
    setStartDate(tempStartDate ? new Date(tempStartDate) : null);
    setEndDate(tempEndDate ? new Date(tempEndDate) : null);
    setDateFilterVisible(false);
  };

  const openDateFilterModal = () => {
    setTempStartDate(startDate ? startDate.toISOString().split("T")[0] : null);
    setTempEndDate(endDate ? endDate.toISOString().split("T")[0] : null);
    setCurrentCalendarDate(
      (startDate || new Date()).toISOString().split("T")[0],
    );
    setModalView("MENU");
    setDateFilterVisible(true);
  };

  const handlePresetSelect = (preset: string) => {
    setActivePreset(preset);
    const today = new Date();
    let start: Date;
    let end: Date = today;

    switch (preset) {
      case "Today":
        start = today;
        break;
      case "Yesterday":
        start = new Date(today);
        start.setDate(today.getDate() - 1);
        end = start;
        break;
      case "Last 7 Days":
        start = new Date(today);
        start.setDate(today.getDate() - 7);
        break;
      case "Last 30 Days":
        start = new Date(today);
        start.setDate(today.getDate() - 30);
        break;
      default:
        return;
    }

    setTempStartDate(start.toISOString().split("T")[0]);
    setTempEndDate(end.toISOString().split("T")[0]);

    // Apply immediately and close
    setStartDate(start);
    setEndDate(end);
    setDateFilterVisible(false);
  };

  const markedDates = useMemo(() => {
    const marks: any = {};
    if (tempStartDate) {
      marks[tempStartDate] = {
        startingDay: true,
        endingDay: selectionType === "single" ? true : !tempEndDate,
        color: "#5B4CCC",
        textColor: "white",
      };
    }
    if (tempEndDate && selectionType === "range") {
      marks[tempEndDate] = {
        endingDay: true,
        color: "#5B4CCC",
        textColor: "white",
      };

      // Fill range
      let start = new Date(tempStartDate!);
      let end = new Date(tempEndDate);
      let curr = new Date(start);
      curr.setDate(curr.getDate() + 1);

      while (curr < end) {
        const dStr = curr.toISOString().split("T")[0];
        marks[dStr] = {
          color: isDarkMode ? "#5B4CCC44" : "#E0E7FF",
          textColor: isDarkMode ? "white" : "#4338CA",
        };
        curr.setDate(curr.getDate() + 1);
      }
    }
    return marks;
  }, [tempStartDate, tempEndDate, isDarkMode, selectionType]);

  const fetchILRs = useCallback(
    async (background = false) => {
      if (!token || !projectId) return;
      try {
        if (!background) setLoading(true);
        const res = await api.get(`/ilrs/${projectId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setIlrs(res.data);
        // console.log(res.data);
      } catch (err) {
        console.error("Error fetching ILRs:", err);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token, projectId],
  );

  // Refresh ILRs when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (projectId) {
        // Use silent refresh if not first load
        fetchILRs(!isFirstLoad.current);
        isFirstLoad.current = false;
      }
    }, [fetchILRs, projectId]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    // Silent fetch because RefreshControl handles the spinner
    await fetchILRs(true);
  };

  const handleDownloadExcel = async () => {
    setExportMenuVisible(false);
    const dataToExport = selectionMode
      ? ilrs.filter((i) => selectedIds.has(i._id))
      : ilrs;

    if (dataToExport.length === 0) {
      alert("No ILRs selected to export");
      return;
    }

    // await exportILRsToExcel(
    //   dataToExport as any,
    //   projectName as string,
    //   auth?.user?.fullName || auth?.user?.username || "Self",
    //   auth?.user?.company || "WP",
    // );
  };

  const handleDownloadPDF = () => {
    setExportMenuVisible(false);
    const dataToExport = selectionMode
      ? ilrs.filter((i) => selectedIds.has(i._id))
      : ilrs;

    if (dataToExport.length === 0) {
      alert("No ILRs selected to export");
      return;
    }
    console.log("PDF Export triggered for:", dataToExport.length, "items");
  };

  const sections = useMemo(() => {
    const filtered = ilrs.filter((ilr) => {
      if (filter !== "  All  " && ilr.status !== filter) return false;

      const created = new Date(ilr.createdAt || ilr.targetDate);
      const updated = new Date(
        ilr.updatedAt || ilr.createdAt || ilr.targetDate,
      );

      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        if (created < start && updated < start) return false;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (created > end && updated > end) return false;
      }

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
    const sectionKeys: string[] = [];

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

      if (!groups[date]) {
        groups[date] = [];
        sectionKeys.push(date);
      }
      groups[date].push(item);
    });

    return sectionKeys.map((date) => ({
      key: date,
      title: date,
      data: groups[date],
    }));
  }, [ilrs, filter, searchQuery, startDate, endDate]);

  const getStatusConfig = (status: string) => {
    const s = status?.toLowerCase();
    switch (s) {
      case "open":
        return {
          bg: isDarkMode ? "bg-[#5E1010]" : "bg-[#FDE6E6]",
          text: "text-[#DF5B5B] dark:text-[#F29999]",
          dot: "bg-[#DF5B5B] dark:bg-[#F29999]",
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
    if (item.status === "Closed") return null;

    if (item.overdueDays && item.overdueDays > 0) {
      return {
        text: `Overdue - ${item.overdueDays}`,
        color: "text-red-500",
        icon: Calendar03Icon,
      };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(item.targetDate);
    target.setHours(0, 0, 0, 0);

    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return {
        text: "Today",
        color: "text-[#5B4CCC] dark:text-[#9486FB]",
        icon: Calendar03Icon,
      };
    }

    if (diffDays > 0) {
      return {
        text: !isNaN(target.getTime())
          ? target.toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })
          : "N/A",
        color: "text-[#1AA45B] dark:text-[#1AA45B]",
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
      <View className={`${isLast ? "mb-2" : ""}`}>
        {isFirst && (
          <View className="px-4 py-3 bg-[#F6F8FA] dark:bg-[#1A1A1A] border-b border-b-gray-200/30 dark:border-b-zinc-800/20 rounded-t-[16px]">
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
          className={`p-3 
            ${
              isSelected
                ? "bg-[#EEF2FF] dark:bg-[#1B1F3B]"
                : "bg-[#F0F3F7] dark:bg-[#0D0D0D]"
            }
            ${
              isLast
                ? "rounded-b-[16px]"
                : "border-b border-[#E0E5EB] dark:border-[#413E47]"
            }
          `}
        >
          <View className="flex-row items-center mb-1.5 ">
            <View className="flex-1 mr-2">
              <Text className="text-[16px] font-dmMedium text-black dark:text-white leading-[18px]">
                {item.ilrNumber}. {item.description}
              </Text>
            </View>
            {selectionMode && (
              <View
                className={`w-5 h-5 rounded-md items-center justify-center border
                  ${
                    isSelected
                      ? "bg-[#4F46E5] border-[#4F46E5]"
                      : "border-gray-300 dark:border-zinc-700"
                  }`}
              >
                {isSelected && (
                  <HugeiconsIcon icon={Tick02Icon} size={12} color="white" />
                )}
              </View>
            )}
          </View>
          <Text
            numberOfLines={2}
            className="text-[13px] font-poppins text-gray-500 dark:text-gray-400 mb-4 leading-[20px]"
          >
            {item.description || "No Description added"}
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

            {dueInfo && (
              <View className="flex-row items-center">
                <HugeiconsIcon
                  icon={dueInfo.icon}
                  size={14}
                  color={
                    dueInfo.color === "text-red-500"
                      ? "#EF4444"
                      : dueInfo.color.includes("green") ||
                          dueInfo.color.includes("#1AA45B")
                        ? "#1AA45B"
                        : dueInfo.text === "Today"
                          ? isDarkMode
                            ? "#9486FB"
                            : "#5B4CCC"
                          : isDarkMode
                            ? "#7C95FF"
                            : "#5B4CCC"
                  }
                />
                <Text
                  className={`text-[12px] pt-1 font-poppins ml-1.5 ${dueInfo.color}`}
                >
                  {dueInfo.text}
                </Text>
              </View>
            )}
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
            <TouchableOpacity onPress={() => setExportMenuVisible(true)}>
              <HugeiconsIcon
                icon={MoreHorizontalIcon}
                size={24}
                color={isDarkMode ? "#FFF" : "#2D3436"}
              />
            </TouchableOpacity>
          </View>
        ) : (
          <View
            key="standard-header"
            className="flex-row items-center justify-between flex-1"
          >
            <View className="flex-row items-center">
              <TouchableOpacity onPress={() => router.back()} className="mr-4">
                <HugeiconsIcon
                  icon={ArrowLeft01Icon}
                  size={24}
                  color={isDarkMode ? "#FFF" : "#2D3436"}
                />
              </TouchableOpacity>
              <Text className="text-[20px] font-dmBold text-[#2D3436] dark:text-white">
                ILR
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
          </View>
        )}
      </View>

      {/* Export Menu (Fast Overlay) */}
      {exportMenuVisible && (
        <View
          key="export-menu-overlay"
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
          <View
            className={`flex-row items-center px-4 py-2 rounded-[8px] border ${
              startDate || endDate
                ? "bg-[#EEF2FF] border-[#566FEC]"
                : "bg-[#F5F5F5] dark:bg-[#1A1A1A] border-[#F1F5F9] dark:border-zinc-800"
            }`}
          >
            <TouchableOpacity
              onPress={openDateFilterModal}
              className="flex-row items-center"
            >
              <Text
                className={`text-[14px] font-poppinsMedium mr-2 ${
                  startDate || endDate
                    ? "text-[#566FEC]"
                    : "text-black dark:text-white"
                }`}
              >
                {(() => {
                  if (!startDate && !endDate) return "Date";
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);

                  const yesterday = new Date(today);
                  yesterday.setDate(today.getDate() - 1);

                  const start = startDate ? new Date(startDate) : null;
                  const end = endDate ? new Date(endDate) : null;

                  if (start) start.setHours(0, 0, 0, 0);
                  if (end) end.setHours(0, 0, 0, 0);

                  const isSingle = start?.getTime() === end?.getTime();

                  if (isSingle) {
                    if (start?.getTime() === today.getTime()) return "Today";
                    if (start?.getTime() === yesterday.getTime())
                      return "Yesterday";
                  }

                  const formatS = start
                    ? start.toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                      })
                    : "...";
                  const formatE = end
                    ? end.toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                      })
                    : "...";

                  return isSingle ? formatS : `${formatS} - ${formatE}`;
                })()}
              </Text>
              <HugeiconsIcon
                icon={ArrowDown01Icon}
                size={16}
                color={
                  startDate || endDate
                    ? "#566FEC"
                    : isDarkMode
                      ? "#94A3B8"
                      : "#64748B"
                }
              />
            </TouchableOpacity>
            {(startDate || endDate) && (
              <TouchableOpacity
                onPress={() => {
                  setStartDate(null);
                  setEndDate(null);
                }}
                className="ml-2 pl-2 border-l border-[#566FEC]/30"
              >
                <Ionicons name="close-circle" size={18} color="#566FEC" />
              </TouchableOpacity>
            )}
          </View>

          {/* Status Pills */}
          <FlatList
            horizontal
            className="flex-1"
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 10, paddingRight: 16 }}
            data={["All", "Open", "Closed"]}
            keyExtractor={(item) => `pill-${item}`}
            renderItem={({ item: f }: { item: string }) => {
              const displayFilter = f === "All" ? "  All  " : f;
              const isActive = filter === displayFilter;
              return (
                <TouchableOpacity
                  onPress={() => setFilter(displayFilter as any)}
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
                          : "#64748B",
                    }}
                  >
                    {displayFilter}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />
        </View>

        <AnimatePresence>
          {showSearch && (
            <MotiView
              key="search-bar-moti"
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
            refreshing={refreshing}
            onRefresh={onRefresh}
            sections={sections}
            keyExtractor={(item, index) => `${item._id || "item"}-${index}`}
            renderItem={renderItem}
            renderSectionHeader={({ section: { title } }) => (
              <View key={`header-${title}`} className="h-2" />
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
      <Modal
        isVisible={dateFilterVisible}
        onBackdropPress={() => setDateFilterVisible(false)}
        onBackButtonPress={() => setDateFilterVisible(false)}
        backdropOpacity={0.5}
        animationIn="slideInUp"
        animationOut="slideOutDown"
        style={{ margin: 0, justifyContent: "flex-end" }}
      >
        <View className="bg-white dark:bg-[#1A1A1A] rounded-t-[32px] p-6 pb-14">
          <View className="items-center mb-2">
            <View className="w-12 h-1 bg-gray-200 dark:bg-zinc-800 rounded-full" />
          </View>

          <View className="pb-4 border-b border-gray-100 dark:border-zinc-800 mb-2">
            <Text className="text-[20px] font-dmSemiBold text-black dark:text-white text-center">
              {selectionType === "single" ? "Select Date" : "Date Range"}
            </Text>
          </View>

          {modalView === "MENU" ? (
            <View>
              {/* Custom Options */}
              <TouchableOpacity
                onPress={() => {
                  setSelectionType("single");
                  setModalView("CALENDAR");
                }}
                className="flex-row items-center justify-between py-4 border-b border-gray-100 dark:border-zinc-800"
              >
                <View className="flex-row items-center">
                  <View className="w-10 h-10 items-center justify-center mr-4">
                    <HugeiconsIcon
                      icon={Calendar03Icon}
                      size={24}
                      color={isDarkMode ? "#D2D2D2" : "#454545"}
                    />
                  </View>
                  <View>
                    <Text className="text-[16px] font-poppins text-black dark:text-white">
                      Review Date
                    </Text>
                    <Text className="text-[12px] font-poppins text-[#454545] dark:text-[#919191]">
                      Define a time period relative to today
                    </Text>
                  </View>
                </View>
                <HugeiconsIcon
                  icon={ArrowRight01Icon}
                  size={18}
                  color="#94A3B8"
                />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setSelectionType("range");
                  setModalView("CALENDAR");
                }}
                className="flex-row items-center justify-between py-4 border-b border-gray-100 dark:border-zinc-800"
              >
                <View className="flex-row items-center">
                  <View className="w-10 h-10 items-center justify-center mr-4">
                    <HugeiconsIcon
                      icon={Calendar03Icon}
                      size={24}
                      color={isDarkMode ? "#D2D2D2" : "#454545"}
                    />
                  </View>
                  <View>
                    <Text className="text-[16px] font-poppins text-black dark:text-white">
                      Custom date range
                    </Text>
                    <Text className="text-[12px] font-poppins text-[#454545] dark:text-[#919191]">
                      Define a time period relative to today
                    </Text>
                  </View>
                </View>
                <HugeiconsIcon
                  icon={ArrowRight01Icon}
                  size={18}
                  color="#94A3B8"
                />
              </TouchableOpacity>

              {/* Presets */}
              {["Today", "Yesterday", "Last 7 Days", "Last 30 Days"].map(
                (preset, index) => {
                  const isLast = index === 3;
                  return (
                    <TouchableOpacity
                      key={preset}
                      onPress={() => handlePresetSelect(preset)}
                      className={`flex-row items-center py-4 ${!isLast ? "border-b border-gray-100 dark:border-zinc-800" : ""}`}
                    >
                      <View className="mr-4">
                        <View
                          className={`w-6 h-6 rounded-full border-2 items-center justify-center ${activePreset === preset ? "border-[#5B4CCC]" : "border-gray-200 dark:border-zinc-700"}`}
                        >
                          {activePreset === preset && (
                            <View className="w-3 h-3 rounded-full bg-[#5B4CCC]" />
                          )}
                        </View>
                      </View>
                      <Text className="text-[16px] font-poppins text-black dark:text-white">
                        {preset}
                      </Text>
                    </TouchableOpacity>
                  );
                },
              )}

              <TouchableOpacity
                onPress={() => {
                  applyDateFilter();
                  setDateFilterVisible(false);
                }}
                className="w-full py-4 mt-6 rounded-[20px] bg-gray-100 dark:bg-zinc-800 items-center justify-center "
              >
                <Text className="text-[18px] font-poppins text-black dark:text-white">
                  Close
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              <View className="min-h-[350px]">
                <Calendar
                  key={`${selectionType}-${currentCalendarDate}`}
                  current={currentCalendarDate}
                  markingType={"period"}
                  markedDates={markedDates}
                  onDayPress={onDayPress}
                  onMonthChange={(month) => {
                    setCurrentCalendarDate(month.dateString);
                  }}
                  renderHeader={(date) => {
                    // Safety check for date formatting
                    let month = "";
                    let year = "";
                    try {
                      month = date.toString("MMM");
                      year = date.toString("yyyy");
                    } catch (e) {
                      const d = new Date(date.getTime ? date.getTime() : date);
                      month = d.toLocaleDateString("en-US", { month: "short" });
                      year = d.getFullYear().toString();
                    }
                    return (
                      <View className="flex-row items-center gap-2">
                        <TouchableOpacity
                          onPress={() => setShowMonthPicker(!showMonthPicker)}
                          className="flex-row items-center bg-white dark:bg-[#262626] border border-gray-200 dark:border-zinc-800 px-3 py-1.5 rounded-xl"
                        >
                          <Text className="text-[15px] font-poppinsMedium text-black dark:text-white mr-1.5">
                            {month}
                          </Text>
                          <HugeiconsIcon
                            icon={ArrowDown01Icon}
                            size={14}
                            color={isDarkMode ? "#94A3B8" : "#64748B"}
                          />
                        </TouchableOpacity>
                        <View className="flex-row items-center bg-white dark:bg-[#262626] border border-gray-200 dark:border-zinc-800 px-3 py-1.5 rounded-xl">
                          <Text className="text-[15px] font-poppinsMedium text-black dark:text-white">
                            {year}
                          </Text>
                        </View>
                      </View>
                    );
                  }}
                  renderArrow={(direction) => (
                    <HugeiconsIcon
                      icon={
                        direction === "left"
                          ? ArrowLeft01Icon
                          : ArrowRight01Icon
                      }
                      size={20}
                      color={isDarkMode ? "#FFF" : "#000"}
                    />
                  )}
                  theme={{
                    backgroundColor: "transparent",
                    calendarBackground: "transparent",
                    textSectionTitleColor: "#94A3B8",
                    selectedDayBackgroundColor: "#5B4CCC",
                    selectedDayTextColor: "#ffffff",
                    todayTextColor: "#5B4CCC",
                    dayTextColor: isDarkMode ? "#E2E8F0" : "#2D3748",
                    textDisabledColor: isDarkMode ? "#4A5568" : "#CBD5E0",
                    monthTextColor: isDarkMode ? "#E2E8F0" : "#2D3748",
                    arrowColor: isDarkMode ? "#FFF" : "#000",
                    textDayFontFamily: "Poppins_400Regular",
                    textMonthFontFamily: "DM-Sans-Bold",
                    textDayHeaderFontFamily: "Poppins_400Regular",
                    textDayFontSize: 16,
                    textMonthFontSize: 18,
                    textDayHeaderFontSize: 14,
                  }}
                />
              </View>

              {/* Month Picker Overlay */}
              {showMonthPicker && (
                <View className="absolute top-[80px] left-0 right-0 bg-white dark:bg-[#1A1A1A] border border-gray-100 dark:border-zinc-800 rounded-2xl p-4 shadow-xl z-50">
                  <View className="flex-row flex-wrap justify-between">
                    {months.map((m, index) => {
                      const d = new Date(currentCalendarDate);
                      const isSelected = index === d.getMonth();
                      return (
                        <TouchableOpacity
                          key={m}
                          onPress={() => {
                            const newDate = new Date(currentCalendarDate);
                            newDate.setMonth(index);
                            setCurrentCalendarDate(
                              newDate.toISOString().split("T")[0],
                            );
                            setShowMonthPicker(false);
                          }}
                          className={`w-[30%] py-3 mb-2 rounded-xl items-center ${isSelected ? "bg-[#5B4CCC]" : "bg-gray-50 dark:bg-zinc-800"}`}
                        >
                          <Text
                            className={`text-[14px] font-poppinsMedium ${isSelected ? "text-white" : "text-black dark:text-white"}`}
                          >
                            {m}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}

              <View className="flex-row gap-4 mt-6">
                <TouchableOpacity
                  onPress={() => setModalView("MENU")}
                  className={`py-4 items-center justify-center rounded-[20px] bg-gray-100 dark:bg-zinc-800 ${selectionType === "single" ? "w-full" : "flex-1"}`}
                >
                  <Text className="text-[18px] font-poppins text-black dark:text-white">
                    Back
                  </Text>
                </TouchableOpacity>
                {selectionType === "range" && (
                  <TouchableOpacity
                    onPress={() => {
                      applyDateFilter();
                      setDateFilterVisible(false);
                    }}
                    className="flex-1 rounded-[20px] overflow-hidden"
                  >
                    <LinearGradient
                      colors={["#5B4CCC", "#6347C2", "#8056D1"]}
                      locations={[0, 0.5183, 1]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0.1 }}
                      className="w-full py-4 items-center justify-center"
                    >
                      <Text className="text-[18px] font-poppins text-white">
                        Apply
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
};

export default ILRs;
