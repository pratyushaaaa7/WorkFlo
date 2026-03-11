
import React, { useEffect, useState, useContext, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
  useColorScheme,
  Alert,
} from "react-native";
import { Ionicons, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import {
  ArrowLeft01Icon,
  Search01Icon,
  Calendar03Icon,
  Location01Icon,
  UserCircleIcon,
  MoreHorizontalIcon,
  Pdf01Icon,
  Xsl01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { AuthContext } from "../context/AuthContext";
import api from "../lib/api";
import { LinearGradient } from "expo-linear-gradient";
import { Pressable } from "react-native";
// import { exportMinutesToExcel } from "../utils/momExcel";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import Toast from "react-native-toast-message";
import { useScrollStore } from "@/store/meetingScrollStore";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const capitalizeFirst = (str: string) => {
  if (!str) return "";
  return str
    .split(" ") // split string into words
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()) // capitalize each word
    .join(" "); // join words back into a single string
};

const handleDownloadMinutes = async (
  meeting: any,
  projectName: any,
  accountName: any,
  company: any,
  token: any
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

  useEffect(() => {
    const fetchMeeting = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/minutes/${meetingId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMeeting(res.data);
        console.log(JSON.stringify(res.data, null, 2));
      } catch (err) {
        console.error("Failed to fetch meeting", err);
      } finally {
        setLoading(false);
      }
    };

    if (meetingId) fetchMeeting();
  }, [meetingId, token]);

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

  return (
    <View className="flex-1 bg-[#FBFCFD] dark:bg-[#000]">
      {/* Header */}
      <View className="pt-14 pb-4 px-2 flex-row items-center justify-between bg-[#FBFCFD] dark:bg-black">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-2.5 p-1">
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
              <ActivityIndicator size="small" color={isDarkMode ? "white" : "#0F172A"} />
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
                      }
                    );
                    const fileName = `Meeting_${meeting.meetingNumber}_Minutes.pdf`;
                    if (Platform.OS === "web") {
                      const url = window.URL.createObjectURL(
                        new Blob([response.data], { type: "application/pdf" })
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
                      token
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

      {/* Content */}
      <ScrollView
         className="flex-1"
         contentContainerStyle={{ paddingBottom: 120 }}
         ref={scrollRef}
         onScroll={(e) => {
           setScrollForMeeting(
             meetingId as string,
             e.nativeEvent.contentOffset.y
           );
         }}
         scrollEventThrottle={16}
      >
        {loading ? (
           <ActivityIndicator size="large" color="#6366F1" className="mt-10" />
        ) : meeting ? (
           <View>
             {/* Title */}
             <View className="px-5 pt-2 pb-5 ">
               <Text className="text-[22px] font-dmSemiBold text-[#0F172A] dark:text-white leading-tight">
                 {projectName || `Meeting #${meetingNumber}`}
               </Text>
             </View>

             {/* Details */}
             <View className="px-5 py-4 border-b border-[#F1F5F9] dark:border-[#1A1A1A]">
                <View className="flex-row gap-4 items-center">
                   <View className="w-6 items-center">
                     <HugeiconsIcon icon={Calendar03Icon} size={22} color={isDarkMode ? "#919191" : "#454545"} />
                   </View>
                   <View>
                     <Text className="text-[12px] font-poppins text-[#64748B] dark:text-[#B1B1B1] mb-0.5">Date</Text>
                     <Text className="text-[15px] font-poppinsMedium text-[#0F172A] dark:text-white">
                       {meetingDate ? new Date(Array.isArray(meetingDate) ? meetingDate[0] : meetingDate).toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' }).replace(' ', ' ').replace(' ', ' ') : ""} at {meetingTime}
                     </Text>
                   </View>
                </View>
             </View>

             <View className="px-5 py-4 border-b border-[#F1F5F9] dark:border-[#1A1A1A]">
                <View className="flex-row gap-4 items-center">
                   <View className="w-6 items-center">
                     <HugeiconsIcon icon={Location01Icon} size={22} color={isDarkMode ? "#919191" : "#454545"} />
                   </View>
                   <View>
                     <Text className="text-[12px] font-poppins text-[#64748B] dark:text-[#B1B1B1] mb-0.5">Location</Text>
                     <Text className="text-[15px] font-poppinsMedium text-[#0F172A] dark:text-white">{meetingVenue || "No venue added"}</Text>
                   </View>
                </View>
             </View>

             <View className="px-5 py-4 border-b-[8px] border-[#F8FAFC] dark:border-[#1A1A1A]">
                <View className="flex-row gap-4 items-center">
                   <View className="w-6 items-center">
                     <HugeiconsIcon icon={UserCircleIcon} size={22} color={isDarkMode ? "#919191" : "#454545"} />
                   </View>
                   <View>
                     <Text className="text-[12px] font-poppins text-[#64748B] dark:text-[#B1B1B1] mb-0.5">Created by</Text>
                     <Text className="text-[15px] font-poppinsMedium text-[#0F172A] dark:text-white">
                       {meeting.createdBy?.fullName || meeting.createdBy?.username || (typeof meeting.createdBy === "string" ? meeting.createdBy : "Unknown")}
                     </Text>
                   </View>
                </View>
             </View>

             {/* Attendees */}
             <View className="px-5 pt-6 pb-2">
                <Text className="text-[18px] font-dmSemiBold text-[#0F172A] dark:text-white mb-5">Attendees</Text>
                {meeting.attendees?.map((attendee: any, index: number) => {
                   const initials = attendee.attendeeName ? attendee.attendeeName.substring(0, 1).toUpperCase() : "?";
                   const colors = [
                     { bg: isDarkMode ? "#3F1D1D" : "#FFE5E5", text: isDarkMode ? "#FFB3B3" : "#D92D20" },
                     { bg: isDarkMode ? "#1A2E4D" : "#E5F0FF", text: isDarkMode ? "#99C2FF" : "#175CD3" },
                     { bg: isDarkMode ? "#271711" : "#FFEADD", text: isDarkMode ? "#FFAB73" : "#D95D20" },
                     { bg: isDarkMode ? "#173E2B" : "#E5FBED", text: isDarkMode ? "#8CE3B0" : "#039855" },
                   ];
                   const colorTheme = colors[index % colors.length];

                   return (
                     <View key={attendee._id || index} className="flex-row items-center justify-between mb-5">
                       <View className="flex-row items-center flex-1">
                         <View className="w-10 h-10 rounded-full items-center justify-center mr-4" style={{ backgroundColor: colorTheme.bg }}>
                           <Text className="font-dmMedium text-[16px]" style={{ color: colorTheme.text }}>{initials}</Text>
                         </View>
                         <View className="flex-1">
                           <Text className="text-[16px] font-poppinsMedium text-[#0F172A] dark:text-white mb-0.5">{attendee.attendeeName}</Text>
                           <Text className="text-[12px] font-poppins text-[#64748B] dark:text-[#919191]">{attendee.designation || 'Role'} | {attendee.organization || 'Company'}</Text>
                         </View>
                       </View>
                       <Ionicons name="chevron-forward" size={20} color={isDarkMode ? "#606060" : "#94A3B8"} />
                     </View>
                   );
                })}
             </View>

             <View className="h-[8px] bg-[#F8FAFC] dark:border-t dark:border-b dark:border-[#1A1A1A] dark:bg-black w-full" />

             {/* Minutes */}
             <View className="px-5 pt-6">
                <Text className="text-[18px] font-dmSemiBold text-[#0F172A] dark:text-white mb-4">Minutes</Text>
                {meeting.minutes?.map((minute: any) => {
                   let badgeBg = isDarkMode ? "#09225A" : "#EFF6FF";
                   let badgeText = isDarkMode ? "#88B6FF" : "#2F76E6";
                   let statusLabel = "In Progress";

                   if (minute.status === "closed") {
                     badgeBg = isDarkMode ? "#0A4230" : "#E8F9ED";
                     badgeText = "#1AA45B";
                     statusLabel = "Completed";
                   } else if (minute.status === "open") {
                     // In progress
                   } else if (minute.status === "forInfo") {
                     badgeBg = isDarkMode ? "#2F2F2F" : "#F1F5F9";
                     badgeText = isDarkMode ? "#BBBBBB" : "#475569";
                     statusLabel = "For Info";
                   }

                   return (
                     <TouchableOpacity
                       key={minute._id}
                       onPress={() => router.push({
                         pathname: "/minuteDetail",
                         params: {
                           id: minute._id,
                           meetingId: meeting._id,
                           serialNo: minute.serialNo,
                           issueSubject: minute.issueSubject,
                           description: minute.description ?? "",
                           raisedBy: JSON.stringify(minute.raisedBy),
                           responsibility: JSON.stringify(minute.responsibility),
                           responsibilityForInfo: minute.responsibilityForInfo ? "true" : "false",
                           targetDate: minute.targetDate,
                           targetDateForInfo: minute.targetDateForInfo ? "true" : "false",
                           status: minute.status,
                           remarks: minute.remarks ?? "",
                         },
                       })}
                       activeOpacity={0.7}
                       className="bg-white dark:bg-[#121212] rounded-[16px] p-4 mb-4"
                      //  style={!isDarkMode ? {
                      //     shadowColor: "#000",
                      //     shadowOffset: { width: 0, height: 2 },
                      //     shadowOpacity: 0.05,
                      //     shadowRadius: 10,
                      //     elevation: 2,
                      //  } : { borderWidth: 1, borderColor: "#262626" }}
                     >
                       <View className="flex-row items-center justify-between mb-4">
                         <View className="px-2.5 py-1.5 rounded-lg flex-row items-center" style={{ backgroundColor: badgeBg }}>
                           <View className="w-1.5 h-1.5 rounded-full mr-1.5" style={{ backgroundColor: badgeText }} />
                           <Text className="text-[11px] font-poppinsMedium" style={{ color: badgeText }}>{statusLabel}</Text>
                         </View>
                         
                         {minute.targetDate && !minute.targetDateForInfo && (
                           <View className="flex-row items-center">
                             <Ionicons name="calendar-outline" size={12} color="#EF4444" />
                             <Text className="text-[11px] font-poppinsMedium text-[#EF4444] ml-1">
                               Delay - 52
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

                       <View className="flex-row items-center justify-between mt-auto pt-4 border-t border-[#F1F5F9] dark:border-[#262626]">
                         <View className="flex-row items-center">
                           {minute.responsibility && minute.responsibility.slice(0, 3).map((r: any, idx: number) => {
                             const init = r.name ? r.name.substring(0, 1).toUpperCase() : "?";
                             const colors = [
                               { bg: isDarkMode ? "#1A2E4D" : "#E5F0FF", text: isDarkMode ? "#99C2FF" : "#175CD3" },
                               { bg: isDarkMode ? "#3F1D1D" : "#FFE5E5", text: isDarkMode ? "#FFB3B3" : "#D92D20" },
                               { bg: isDarkMode ? "#173E2B" : "#E5FBED", text: isDarkMode ? "#8CE3B0" : "#039855" },
                             ];
                             const theme = colors[idx % colors.length];
                             return (
                               <View key={idx} className={`w-7 h-7 rounded-full items-center justify-center border-[1.5px] border-white dark:border-[#121212] ${idx > 0 ? '-ml-2' : ''}`} style={{ backgroundColor: theme.bg }}>
                                 <Text className="text-[10px] font-dmMedium" style={{ color: theme.text }}>{init}</Text>
                               </View>
                             );
                           })}
                           {minute.responsibility && minute.responsibility.length > 3 && (
                             <View className="w-7 h-7 rounded-full items-center justify-center border-[1.5px] border-white dark:border-[#121212] -ml-2 bg-[#F1F5F9] dark:bg-[#000]">
                               <Text className="text-[10px] font-dmMedium text-[#64748B] dark:text-[#919191]">
                                 +{minute.responsibility.length - 3}
                               </Text>
                             </View>
                           )}
                         </View>

                         <View className="flex-row items-center bg-[#F8FAFC] dark:bg-[#1E1E1E] px-2 py-1.5 rounded-full">
                           <Ionicons name="attach" size={14} color={isDarkMode ? "#919191" : "#64748B"} style={{ transform: [{rotate: '45deg'}] }} />
                           <Text className="text-[12px] font-poppinsMedium text-[#64748B] dark:text-[#919191] ml-0.5">8</Text>
                         </View>
                       </View>
                     </TouchableOpacity>
                   );
                })}
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
          className="px-3 pt-4 bg-[#FBFCFD] dark:bg-black border-t border-[#F1F5F9] dark:border-[#1A1A1A] flex-row items-center justify-between"
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
              className="px-10 py-3 items-center justify-center"
              style={{ borderRadius: 8 }}
            >
              <Text className="text-white font-poppins text-[16px]">Edit MOM</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default MinutesDetail;
