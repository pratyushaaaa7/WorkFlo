import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Calendar03Icon,
  Location01Icon,
  MoreHorizontalIcon,
  Pdf01Icon,
  Search01Icon,
  UserCircleIcon,
  Xsl01Icon,
  Attachment01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { Skeleton } from "moti/skeleton";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
  Modal as RNModal,
} from "react-native";
import Modal from "react-native-modal";
import { AuthContext } from "../context/AuthContext";
import api from "../lib/api";
// import { exportMinutesToExcel } from "../utils/momExcel";
import { useScrollStore } from "@/store/meetingScrollStore";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import GlobalAvatar from "../components/GlobalAvatar";

const capitalizeFirst = (str: string) => {
  if (!str) return "";
  return str
    .split(" ") // split string into words
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()) // capitalize each word
    .join(" "); // join words back into a single string
};

const getStatusBadgeStyles = (status: string | undefined, isDark: boolean) => {
  const s = (status || "").toLowerCase();
  let badgeBg = isDark ? "#5E1010" : "#FED7DA";
  let badgeText = "#DF5B5B";
  let statusLabel = "Open";

  if (s === "closed") {
    badgeBg = isDark ? "#122E25" : "#E8F9ED";
    badgeText = "#1AA45B";
    statusLabel = "Closed";
  } else if (s === "open" || s === "") {
    // defaults set above
  } else if (s === "forinfo") {
    badgeBg = isDark ? "#2F2F2F" : "#EBEFF2";
    badgeText = isDark ? "#BBBBBB" : "#454545";
    statusLabel = "For Info";
  } else if (s === "forwarded") {
    badgeBg = isDark ? "#101F40" : "#E8F0FF";
    badgeText = "#2F76E6";
    statusLabel = "Forwarded";
  }

  return { badgeBg, badgeText, statusLabel };
};

const handleDownloadMinutes = async (
  meeting: any,
  projectName: any,
  accountName: any,
  company: any,
  token: any,
) => {
  try {
    const payload = {
      meeting,
      projectName,
      accountName,
      company,
    };

    const response = await api.post("/minutes/export/minutes", payload, {
      responseType: "blob", // important for binary files
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const fileName = `Meeting_${meeting.meetingNumber}_Minutes.xlsx`;

    if (Platform.OS === "web") {
      // --- Web: download via anchor tag ---
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } else {
      // --- Mobile: convert blob → base64, write to cache, then share ---
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

      await Sharing.shareAsync(fileUri, {
        mimeType:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        dialogTitle: "Share Meeting Minutes",
        UTI: "com.microsoft.excel.xlsx",
      });
    }
  } catch (err) {
    console.error("Failed to download minutes:", err);
    alert("Failed to download minutes");
  }
};

const MinutesDetail = () => {
  const insets = useSafeAreaInsets();
  // Get local params from previous screen
  const {
    meetingId,
    meetingNumber,
    meetingDate,
    meetingTime,
    meetingVenue,
    projectName,
    company,
  } = useLocalSearchParams();
  const router = useRouter();
  const auth = useContext(AuthContext);
  const token = auth?.token;

  const [meeting, setMeeting] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showAttendeeModal, setShowAttendeeModal] = useState(false);
  const [selectedAttendee, setSelectedAttendee] = useState<any>(null);

  const fetchMeeting = useCallback(
    async (showLoader = true) => {
      if (!meetingId) return;
      try {
        if (showLoader) setLoading(true);
        const res = await api.get(`/minutes/${meetingId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMeeting(res.data);
        console.log("Meeting data:", res.data);
      } catch (err) {
        console.error("Failed to fetch meeting", err);
      } finally {
        if (showLoader) setLoading(false);
        setRefreshing(false);
      }
    },
    [meetingId, token],
  );

  useFocusEffect(
    useCallback(() => {
      fetchMeeting(true);
    }, [fetchMeeting]),
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchMeeting(false);
  }, [fetchMeeting]);

  const [isDownloading, setIsDownloading] = useState(false);
  const [exportMenuVisible, setExportMenuVisible] = useState(false);

  const [isEditAllowed, setIsEditAllowed] = useState(false);

  useEffect(() => {
    if (!meeting || !meeting.submittedAt) {
      setIsEditAllowed(false); // No submittedAt → cannot edit
      return;
    }

    const submittedAtDate = new Date(meeting.submittedAt);
    const diffMs = Date.now() - submittedAtDate.getTime();
    const THIRTY_MIN = 2 * 60 * 60 * 1000;

    setIsEditAllowed(diffMs <= THIRTY_MIN);
  }, [meeting]);

  const setScrollForMeeting = useScrollStore((s) => s.setScrollForMeeting);
  const getScrollForMeeting = useScrollStore((s) => s.getScrollForMeeting);

  // Get scroll for current meeting
  const minutesScrollY = getScrollForMeeting(meetingId as string);

  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (!meeting) return;

    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({
        y: minutesScrollY,
        animated: false,
      });
    });
  }, [meeting]);

  const isDarkMode = useColorScheme() === "dark";

  const getDueIndicator = (minute: any) => {
    if (minute.status === "closed") return null;

    if (minute.overdueDays && minute.overdueDays > 0) {
      const target = new Date(minute.targetDate);
      return {
        text: !isNaN(target.getTime())
          ? target.toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })
          : "N/A",
        color: "text-red-500",
        icon: Calendar03Icon,
      };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(minute.targetDate);
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

  return (
    <View className="flex-1 bg-[#FBFCFD] dark:bg-[#000]">
      {/* Header */}
      <View className="pt-14 pb-4 px-2 flex-row items-center justify-between bg-[#FBFCFD] dark:bg-black">
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => router.back()}
            className="mr-2.5 p-1"
          >
            <HugeiconsIcon
              icon={ArrowLeft01Icon}
              size={24}
              color={isDarkMode ? "white" : "#0F172A"}
            />
          </TouchableOpacity>
          <Text className="text-[20px] font-dmSemiBold text-[#000] dark:text-white">
            Minutes of Meeting
          </Text>
        </View>
        <View className="flex-row items-center gap-2">
          <TouchableOpacity className="p-1">
            <HugeiconsIcon
              icon={Search01Icon}
              size={24}
              color={isDarkMode ? "white" : "#0F172A"}
            />
          </TouchableOpacity>
          <TouchableOpacity
            className="p-1"
            disabled={isDownloading}
            onPress={() => setExportMenuVisible(true)}
          >
            {isDownloading ? (
              <ActivityIndicator
                size="small"
                color={isDarkMode ? "white" : "#0F172A"}
              />
            ) : (
              <HugeiconsIcon
                icon={MoreHorizontalIcon}
                size={24}
                color={isDarkMode ? "white" : "#0F172A"}
              />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Export Menu (Fast Overlay) */}
      {exportMenuVisible && (
        <View
          className="absolute top-0 left-0 right-0 bottom-0 z-[100]"
          pointerEvents="box-none"
        >
          <Pressable
            className="absolute inset-0"
            onPress={() => setExportMenuVisible(false)}
          />
          <View className="absolute top-[100px] right-2">
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
                onPress={async () => {
                  setExportMenuVisible(false);
                  if (!meeting) return;
                  setIsDownloading(true);
                  try {
                    const payload = {
                      meeting,
                      projectName,
                      accountName: auth?.user?.fullName ?? "Unknown",
                      company,
                    };
                    const response = await api.post(
                      "/minutes/export/minutes/pdf",
                      payload,
                      {
                        responseType: "blob",
                        headers: { Authorization: `Bearer ${token}` },
                      },
                    );
                    const fileName = `Meeting_${meeting.meetingNumber}_Minutes.pdf`;
                    if (Platform.OS === "web") {
                      const url = window.URL.createObjectURL(
                        new Blob([response.data], { type: "application/pdf" }),
                      );
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = fileName;
                      document.body.appendChild(a);
                      a.click();
                      a.remove();
                    } else {
                      const blobToBase64 = (blob: Blob) =>
                        new Promise<string>((resolve, reject) => {
                          const reader = new FileReader();
                          reader.onloadend = () =>
                            resolve(
                              reader.result?.toString().split(",")[1] || "",
                            );
                          reader.onerror = reject;
                          reader.readAsDataURL(blob);
                        });
                      const base64data = await blobToBase64(response.data);
                      const fileUri = FileSystem.cacheDirectory + fileName;
                      await FileSystem.writeAsStringAsync(fileUri, base64data, {
                        encoding: FileSystem.EncodingType.Base64,
                      });
                      await Sharing.shareAsync(fileUri, {
                        mimeType: "application/pdf",
                        dialogTitle: "Share Meeting Minutes (PDF)",
                        UTI: "com.adobe.pdf",
                      });
                    }
                  } catch (err) {
                    console.error("Failed to download PDF minutes:", err);
                    alert("Failed to download PDF minutes");
                  } finally {
                    setIsDownloading(false);
                  }
                }}
                className="flex-row items-center p-3 rounded-xl active:bg-gray-100 dark:active:bg-[#252525]"
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
                onPress={async () => {
                  setExportMenuVisible(false);
                  if (!meeting) return;
                  setIsDownloading(true);
                  try {
                    await handleDownloadMinutes(
                      meeting,
                      projectName,
                      auth?.user?.fullName ?? "Unknown",
                      company,
                      token,
                    );
                  } finally {
                    setIsDownloading(false);
                  }
                }}
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

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 120 }}
        ref={scrollRef}
        onScroll={(e) => {
          setScrollForMeeting(
            meetingId as string,
            e.nativeEvent.contentOffset.y,
          );
        }}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#5B4CCC"]}
            tintColor={isDarkMode ? "#ffffff" : "#5B4CCC"}
          />
        }
      >
        {loading ? (
          <View className="px-3 pt-2">
            <Skeleton colorMode={isDarkMode ? "dark" : "light"} width={160} height={28} radius={6} />
            <View className="mt-6 gap-4">
              <Skeleton colorMode={isDarkMode ? "dark" : "light"} width="60%" height={20} radius={4} />
              <Skeleton colorMode={isDarkMode ? "dark" : "light"} width="80%" height={20} radius={4} />
              <Skeleton colorMode={isDarkMode ? "dark" : "light"} width="50%" height={20} radius={4} />
            </View>
            <View className="mt-10">
              <Skeleton colorMode={isDarkMode ? "dark" : "light"} width={100} height={24} radius={6} />
              <View className="mt-4 gap-4">
                {[1, 2, 3].map((i) => (
                  <View key={i} className="flex-row items-center gap-3">
                    <Skeleton colorMode={isDarkMode ? "dark" : "light"} width={40} height={40} radius="round" />
                    <View className="gap-2">
                      <Skeleton colorMode={isDarkMode ? "dark" : "light"} width={120} height={16} radius={4} />
                      <Skeleton colorMode={isDarkMode ? "dark" : "light"} width={80} height={12} radius={4} />
                    </View>
                  </View>
                ))}
              </View>
            </View>
            <View className="mt-10">
              <Skeleton colorMode={isDarkMode ? "dark" : "light"} width={100} height={24} radius={6} />
              <View className="mt-4 gap-4">
                {[1, 2].map((i) => (
                  <View key={i} className="bg-[#F6F8FA] dark:bg-[#1A1A1A] p-4 rounded-2xl gap-3">
                    <Skeleton colorMode={isDarkMode ? "dark" : "light"} width="40%" height={16} radius={4} />
                    <Skeleton colorMode={isDarkMode ? "dark" : "light"} width="90%" height={20} radius={4} />
                    <Skeleton colorMode={isDarkMode ? "dark" : "light"} width="100%" height={14} radius={4} />
                  </View>
                ))}
              </View>
            </View>
          </View>
        ) : meeting ? (
          <View>
            {/* Title */}
            <View className="px-3 pt-2 pb-2 ">
              <Text className="text-[20px] font-dmMedium text-[#0F172A] dark:text-white leading-tight">
                {`Meeting #${meetingNumber}`}
              </Text>
            </View>

            {/* Details */}
            <View className="px-3 py-2 border-b border-[#F1F5F9] dark:border-[#1A1A1A]">
              <View className="flex-row gap-4 items-center">
                <View className="w-6 items-center">
                  <HugeiconsIcon
                    icon={Calendar03Icon}
                    size={22}
                    color={isDarkMode ? "#919191" : "#454545"}
                  />
                </View>
                <View>
                  <Text className="text-[12px] font-poppins text-[#64748B] dark:text-[#B1B1B1] ">
                    Date
                  </Text>
                  <Text className="text-[15px] font-poppinsMedium text-[#0F172A] dark:text-white">
                    {meetingDate
                      ? new Date(
                          Array.isArray(meetingDate)
                            ? meetingDate[0]
                            : meetingDate,
                        )
                          .toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                          .replace(" ", " ")
                          .replace(" ", " ")
                      : ""}{" "}
                    at {meetingTime}
                  </Text>
                </View>
              </View>
            </View>

            <View className="px-3 py-2 border-b border-[#F1F5F9] dark:border-[#1A1A1A]">
              <View className="flex-row gap-4 items-center">
                <View className="w-6 items-center">
                  <HugeiconsIcon
                    icon={Location01Icon}
                    size={22}
                    color={isDarkMode ? "#919191" : "#454545"}
                  />
                </View>
                <View>
                  <Text className="text-[12px] font-poppins text-[#64748B] dark:text-[#B1B1B1] ">
                    Location
                  </Text>
                  <Text className="text-[15px] font-poppinsMedium text-[#0F172A] dark:text-white">
                    {meetingVenue || "No venue added"}
                  </Text>
                </View>
              </View>
            </View>

            <View className="px-3 py-2 ">
              <View className="flex-row gap-4 items-center">
                <View className="w-6 items-center">
                  <HugeiconsIcon
                    icon={UserCircleIcon}
                    size={22}
                    color={isDarkMode ? "#919191" : "#454545"}
                  />
                </View>
                <View>
                  <Text className="text-[12px] font-poppins text-[#64748B] dark:text-[#B1B1B1] ">
                    Created by
                  </Text>
                  <Text className="text-[15px] font-poppinsMedium text-[#0F172A] dark:text-white">
                    {meeting.createdBy?.fullName ||
                      meeting.createdBy?.username ||
                      (typeof meeting.createdBy === "string"
                        ? meeting.createdBy
                        : "Unknown")}
                  </Text>
                </View>
              </View>
            </View>

            <View className="h-[6px] bg-[#F6F8FA]    dark:bg-[#413E47] w-full" />

            {/* Attendees */}
            <View className="px-3 pt-4 pb-2">
              <Text className="text-[18px] font-dmSemiBold text-[#0F172A] dark:text-white mb-4">
                Attendees
              </Text>
              {(Array.isArray(meeting.attendees) ? meeting.attendees : [])
                .filter((a: any) => !!a)
                .map((attendee: any, index: number) => {
                  return (
                    <TouchableOpacity
                      key={attendee._id || index}
                      onPress={() => {
                        setSelectedAttendee(attendee);
                        setShowAttendeeModal(true);
                      }}
                      className="flex-row items-center justify-between mb-4"
                    >
                      <View className="flex-row items-center flex-1">
                        <GlobalAvatar
                          name={attendee.attendeeName || "Unknown"}
                          size={40}
                          fontSize={16}
                          index={index}
                          className="mr-4"
                        />
                        <View className="flex-1">
                          <Text className="text-[16px] font-poppinsMedium text-[#0F172A] dark:text-white ">
                            {attendee.attendeeName || "Unknown"}
                          </Text>
                          <Text className="text-[12px] font-poppins text-[#64748B] dark:text-[#919191]">
                            {attendee.designation || "Role"} |{" "}
                            {attendee.organization || "Company"}
                          </Text>
                        </View>
                      </View>
                      <HugeiconsIcon
                        icon={ArrowRight01Icon}
                        size={20}
                        color={isDarkMode ? "#919191" : "#919191"}
                      />
                    </TouchableOpacity>
                  );
                })}
            </View>

            <View className="h-[6px] bg-[#F6F8FA]    dark:bg-[#413E47] w-full" />
            {/* Minutes */}
            <View className="px-3 pt-4">
              <Text className="text-[18px] font-dmSemiBold text-[#0F172A] dark:text-white mb-4">
                Minutes
              </Text>
              {(Array.isArray(meeting.minutes) ? meeting.minutes : []).map(
                (minute: any) => {
                  const { badgeBg, badgeText, statusLabel } =
                    getStatusBadgeStyles(minute.status, isDarkMode);

                  return (
                    <TouchableOpacity
                      key={minute._id}
                      onPress={() =>
                        router.push({
                          pathname: "/minuteDetail",
                          params: {
                            id: minute._id,
                            meetingId: meeting._id,
                            serialNo: minute.serialNo,
                            issueSubject: minute.issueSubject,
                            description: minute.description ?? "",
                            raisedBy: JSON.stringify(minute.raisedBy || []),
                            responsibility: JSON.stringify(
                              minute.responsibility || [],
                            ),
                            responsibilityForInfo: minute.responsibilityForInfo
                              ? "true"
                              : "false",
                            targetDate: minute.targetDate,
                            targetDateForInfo: minute.targetDateForInfo
                              ? "true"
                              : "false",
                            status: minute.status,
                            remarks: minute.remarks ?? "",
                          },
                        })
                      }
                      activeOpacity={0.7}
                      className="bg-[#F6F8FA] dark:bg-[#1A1A1A] rounded-[16px] px-3 py-3 mb-3"
                      //  style={!isDarkMode ? {
                      //     shadowColor: "#000",
                      //     shadowOffset: { width: 0, height: 2 },
                      //     shadowOpacity: 0.05,
                      //     shadowRadius: 10,
                      //     elevation: 2,
                      //  } : { borderWidth: 1, borderColor: "#262626" }}
                    >
                      <View className="flex-row items-center justify-between mb-4">
                        <View
                          className="px-2.5 py-1.5 rounded-lg flex-row items-center"
                          style={{ backgroundColor: badgeBg }}
                        >
                          <View
                            className="w-1.5 h-1.5 rounded-full mr-1.5"
                            style={{ backgroundColor: badgeText }}
                          />
                          <Text
                            className="text-[11px] font-poppinsMedium"
                            style={{ color: badgeText }}
                          >
                            {statusLabel}
                          </Text>
                        </View>

                        {minute.targetDate && !minute.targetDateForInfo && getDueIndicator(minute) && (
                          <View className="flex-row items-center">
                            <HugeiconsIcon
                              icon={getDueIndicator(minute)!.icon}
                              size={12}
                              color={
                                getDueIndicator(minute)!.color === "text-red-500"
                                  ? "#EF4444"
                                  : getDueIndicator(minute)!.color.includes("green") ||
                                      getDueIndicator(minute)!.color.includes("#1AA45B")
                                    ? "#1AA45B"
                                    : getDueIndicator(minute)!.text === "Today"
                                      ? isDarkMode
                                        ? "#9486FB"
                                        : "#5B4CCC"
                                      : isDarkMode
                                        ? "#7C95FF"
                                        : "#5B4CCC"
                              }
                            />
                            <Text
                              className={`text-[11px] font-poppinsMedium ml-1 ${getDueIndicator(minute)!.color}`}
                            >
                              {getDueIndicator(minute)!.text}
                            </Text>
                          </View>
                        )}
                      </View>

                      <Text className="text-[16px] font-dmSemiBold text-[#0F172A] dark:text-white mb-1.5 leading-tight">
                        {minute.serialNo}. {minute.issueSubject}
                      </Text>

                      {minute.description && (
                        <Text className="text-[13px] font-poppins text-[#475569] dark:text-[#919191] mb-4 leading-relaxed line-clamp-2">
                          {minute.description}
                        </Text>
                      )}
                      <View className="flex-row items-center justify-between mt-auto pt-4 border-t border-[#E0E5EB] dark:border-[#413E47]">
                        <View className="flex-row items-center">
                          {minute.responsibilityForInfo ||
                          !minute.responsibility ||
                          minute.responsibility.length === 0 ? (
                            <View className="flex-row items-center">
                              <HugeiconsIcon
                                icon={UserCircleIcon}
                                size={16}
                                color={isDarkMode ? "#919191" : "#454545"}
                              />
                              <Text
                                className={`ml-2 text-[12px] font-poppins ${
                                  isDarkMode ? "text-[#919191]" : "text-[#454545]"
                                }`}
                              >
                                For Info
                              </Text>
                            </View>
                          ) : (
                            (Array.isArray(minute.responsibility)
                              ? minute.responsibility
                              : []
                            )
                              .filter((r: any) => !!r && !!r.name)
                              .slice(0, 3)
                              .map((r: any, idx: number) => {
                                return (
                                  <GlobalAvatar
                                    key={idx}
                                    name={r.name}
                                    size={34}
                                    fontSize={10}
                                    index={idx}
                                    className={`border-[1.5px] border-white dark:border-[#121212] ${
                                      idx > 0 ? "-ml-2" : ""
                                    }`}
                                  />
                                );
                              })
                          )}
                          {Array.isArray(minute.responsibility) &&
                            minute.responsibility.length > 3 && (
                              <View className="w-7 h-7 rounded-full items-center justify-center border-[1.5px] border-white dark:border-[#121212] -ml-2 bg-[#F1F5F9] dark:bg-[#000]">
                                <Text className="text-[10px] font-dmMedium text-[#64748B] dark:text-[#919191]">
                                  +{minute.responsibility.length - 3}
                                </Text>
                              </View>
                            )}
                        </View>

                        {/* Attachment Count */}
                        <View className="flex-row items-center">
                          <HugeiconsIcon
                            icon={Attachment01Icon}
                            size={16}
                            color={isDarkMode ? "#919191" : "#454545"}
                          />
                          <Text
                            className={`ml-1 text-[12px] font-poppins ${
                              isDarkMode ? "text-[#919191]" : "text-[#454545]"
                            }`}
                          >
                            {minute.attachments?.length || 0}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                },
              )}
            </View>
          </View>
        ) : (
          <Text className="text-center mt-10 text-gray-500">
            Meeting not found
          </Text>
        )}
      </ScrollView>

      {/* Sticky Bottom Edit Button */}
      {isEditAllowed && (
        <View
          className="px-3 pt-4 bg-[#FBFCFD] dark:bg-black  flex-row items-center justify-between"
          style={{ paddingBottom: Math.max(insets.bottom, 16) }}
        >
          <Text className="text-[13px] font-poppins text-[#0F172A] dark:text-white leading-[18px]">
            You can edit for 2 hour{"\n"}after submitting
          </Text>
          <TouchableOpacity
            onPress={() => {
              const params = {
                meetingId: meeting._id,
                projectId: meeting.projectId,
                actionType: "editMOM",
              };
              router.push({
                pathname: "/createMeeting",
                params,
              });
            }}
            activeOpacity={0.8}
            className="rounded-lg overflow-hidden"
          >
            <LinearGradient
              colors={["#5B4CCC", "#6347C2", "#8056D1"]}
              locations={[0, 0.5183, 1]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0.1 }}
              style={{
                paddingHorizontal: 40,
                paddingVertical: 12,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 8,
              }}
            >
              <Text className="text-white font-poppins text-[16px]">
                Edit MOM
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
      {/* Attendee Details Modal */}
      <Modal
        isVisible={showAttendeeModal}
        onBackdropPress={() => setShowAttendeeModal(false)}
        onBackButtonPress={() => setShowAttendeeModal(false)}
        onSwipeComplete={() => setShowAttendeeModal(false)}
        swipeDirection={["down"]}
        style={{ justifyContent: "flex-end", margin: 0 }}
      >
        <View
          style={{
            backgroundColor: isDarkMode ? "#1A1A1A" : "#F0F3F7",
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingHorizontal: 20,
            paddingTop: 12,
            paddingBottom: 100,
          }}
        >
          {/* Handle Bar */}
          <View className="items-center mb-4">
            <View className="w-12 h-1 bg-gray-300 dark:bg-zinc-700 rounded-full mb-4" />
            <Text
              className={`text-[20px] font-dmBold text-center mb-4 ${isDarkMode ? "text-white" : "text-black"}`}
            >
              Attendee Details
            </Text>
            <View className={`w-full h-[1px] ${isDarkMode ? "bg-zinc-800" : "bg-gray-100"}`} />
          </View>

          {/* Details List */}
          <View className="gap-3 pt-2">
            {[
              {
                value: selectedAttendee?.attendeeName || "N/A",
              },
              {
                value: selectedAttendee?.organization || "N/A",
              },
              {
                value: selectedAttendee?.designation || "N/A",
              },
              {
                value: selectedAttendee?.email || "N/A",
              },
              {
                value:
                  selectedAttendee?.contactNumbers?.[0] ||
                  selectedAttendee?.contactNumbers ||
                  "N/A",
              },
            ].map((item, idx) => (
              <View
                key={idx}
                className={`p-4 rounded-lg ${isDarkMode ? "bg-[#252528]" : "bg-[#F0F3F7]"}`}
              >
                <Text
                  className={`text-[15px] font-poppins ${isDarkMode ? "text-white" : "text-black"}`}
                >
                  {item.value}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default MinutesDetail;
