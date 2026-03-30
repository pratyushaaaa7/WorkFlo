import {
  Add01Icon,
  ArrowLeft01Icon,
  Calendar03Icon,
  CheckmarkCircle02Icon,
  DashedLineCircleIcon,
  Delete03Icon,
  Location01Icon,
  Search01Icon,
  Share08Icon,
  Tick01Icon,
  UserCircleIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { BlurView } from "@react-native-community/blur";
import { format, isValid } from "date-fns";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { Skeleton } from "moti/skeleton";
import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Animated,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import Toast from "react-native-toast-message";
import { AuthContext } from "../context/AuthContext";
import api from "../lib/api";

const Minutes = () => {
  const { projectId, projectName, company } = useLocalSearchParams();
  const router = useRouter();
  const authContext = useContext(AuthContext);
  const token = authContext?.token;

  const [meetings, setMeetings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [focusedMeeting, setFocusedMeeting] = useState<any | null>(null);
  const meetingRefs = useRef<{ [key: string]: View | null }>({});

  const [activeTab, setActiveTab] = useState<"Project" | "Shared">("Project");

  const isFirstLoad = useRef(true);

  useEffect(() => {
    isFirstLoad.current = true;
  }, [projectId]);

  const fetchMeetings = useCallback(
    async (background = false) => {
      try {
        if (!background) setLoading(true);
        const res = await api.get(`/minutes/project/${projectId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMeetings(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("Failed to fetch meetings", err);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [projectId, token],
  );

  useFocusEffect(
    useCallback(() => {
      if (projectId) {
        fetchMeetings(!isFirstLoad.current);
        isFirstLoad.current = false;
      }
    }, [fetchMeetings, projectId]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchMeetings(true);
  };

  const handleLongPress = (meeting: any) => {
    const ref = meetingRefs.current[meeting._id];
    if (ref) {
      ref.measureInWindow((x, y, width, height) => {
        setFocusedMeeting({ ...meeting, layout: { x, y, width, height } });
      });
    }
  };

  const handleConfirmDelete = async () => {
    if (!focusedMeeting || !token) return;

    try {
      const meetingId = focusedMeeting._id;
      setFocusedMeeting(null);
      await api.delete(`/minutes/${meetingId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // remove from UI
      setMeetings((prev) => prev.filter((m) => m._id !== meetingId));
      // ✅ SHOW TOAST
      Toast.show({
        type: "success",
        text1: "Meeting deleted",
        text2: "The meeting was removed successfully",
        position: "bottom",
        visibilityTime: 2000,
      });
    } catch (err: any) {
      setFocusedMeeting(null);
      console.error("Delete failed", err);
      if (err.response?.status === 418) {
        // Not authorized
        Toast.show({
          type: "error",
          text1: "Not Authorized",
          text2: "Please contact Team leader or admin ",
          position: "bottom",
        });
      } else {
        // Generic error
        Toast.show({
          type: "error",
          text1: "Delete failed",
          text2: "Please try again",
          position: "bottom",
        });
      }
    }
  };

  const handleShare = async () => {
    if (!focusedMeeting || !token) return;

    try {
      const meetingId = focusedMeeting._id;
      setFocusedMeeting(null);
      await api.put(
        `/minutes/${meetingId}/share`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );

      // ✅ SHOW TOAST
      Toast.show({
        type: "success",
        text1: "Shared",
        text2: "The meeting was shared to its associated project",
        position: "bottom",
        visibilityTime: 2000,
      });

      // Refetch to reflect sharing
      fetchMeetings(true);
    } catch (err: any) {
      setFocusedMeeting(null);
      console.error("Share failed", err);
      const errorMessage = err.response?.data?.message || err.response?.data?.error || "Please try again later.";
      Toast.show({
        type: "error",
        text1: "Share failed",
        text2: errorMessage,
        position: "bottom",
      });
    }
  };

  const isDarkMode = useColorScheme() === "dark";

  const filteredMeetings = meetings.filter((m) => {
    const mProj = String(m.projectId?._id || m.projectId);
    if (activeTab === "Shared") return mProj !== String(projectId);
    return mProj === String(projectId);
  });

  const MeetingCard = ({
    meeting,
    isFocused = false,
  }: {
    meeting: any;
    isFocused?: boolean;
  }) => {
    const total = meeting.totalMinutes || 0;
    const open = meeting.openCount || 0;
    const progress = total > 0 ? ((total - open) / total) * 100 : 0;
    const progressText = total > 0 ? `${total - open}/${total}` : "0/0";

    const dateStr = isValid(new Date(meeting.meetingDate))
      ? format(new Date(meeting.meetingDate), "dd MMM yyyy")
      : "No Date";

    return (
      <View
        ref={(el) => {
          if (!isFocused) meetingRefs.current[meeting._id] = el;
        }}
        className={`bg-[#F6F8FA] dark:bg-[#1A1A1A] rounded-[16px] p-3 ${isFocused ? "" : "mb-4"}`}
      >
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center gap-2">
            {meeting.meetingStage === "mom_submitted" && (
              <View className="bg-[#E8F9ED] dark:bg-[#0A4230] px-3 py-1.5 rounded-full flex-row items-center">
                <HugeiconsIcon
                  icon={CheckmarkCircle02Icon}
                  size={14}
                  color="#1AA45B"
                />
                <Text className="text-[#1AA45B] text-[12px] font-poppinsMedium ml-1.5">
                  Published
                </Text>
              </View>
            )}
            {meeting.agendaSubmitted && (
              <View className="bg-[#E8F0FF] dark:bg-[#09225A] px-3 py-1.5 rounded-full flex-row items-center">
                <HugeiconsIcon
                  icon={Tick01Icon}
                  size={14}
                  color={isDarkMode ? "#88B6FF" : "#2F76E6"}
                />
                <Text className="text-[#2F76E6] dark:text-[#88B6FF] text-[12px] font-poppinsMedium ml-1.5">
                  Agenda
                </Text>
              </View>
            )}
            <View className="flex-1" />
            {meeting.meetingStage === "draft" && (
              <View className="bg-[#EBEFF2] dark:bg-[#2F2F2F] px-3  py-1.5 rounded-full flex-row items-center">
                <HugeiconsIcon
                  icon={DashedLineCircleIcon}
                  size={14}
                  color={isDarkMode ? "#BBBBBB" : "#454545"}
                />
                <Text className="text-[#454545] dark:text-[#BBBBBB] text-[12px] font-poppinsMedium ml-1.5">
                  Draft
                </Text>
              </View>
            )}
          </View>
        </View>

        <Text className="text-[19px] font-dmMedium text-[#0F172A] dark:text-white mb-2 leading-tight">
          #{meeting.meetingNumber}
        </Text>

        {meeting.meetingStage === "mom_submitted" && (
          <View className="mb-4">
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-[13px] font-poppinsMedium text-[#454545] dark:text-[#919191]">
                Progress
              </Text>
              <View className="flex-row items-center">
                <Text className="text-[13px] font-poppinsMedium text-[#454545] dark:text-[#919191] mr-1.5">
                  {Math.round(progress)}%
                </Text>
                <Text className="text-[13px] font-poppinsMedium text-[#2F76E6]">
                  ({progressText})
                </Text>
              </View>
            </View>
            <View className="h-2 bg-[#E0E5EB] dark:bg-[#2F2F2F] rounded-full overflow-hidden">
              <View
                className="h-full bg-[#1AA45B] rounded-full"
                style={{ width: `${progress}%` }}
              />
            </View>
          </View>
        )}

        <View className="gap-1">
          <View className="flex-row items-center">
            <HugeiconsIcon
              icon={Calendar03Icon}
              size={18}
              color={isDarkMode ? "#919191" : "#454545"}
            />
            <Text className="ml-2 text-[14px] font-poppins text-[#454545] dark:text-[#919191]">
              {dateStr} at {meeting.meetingTime}
            </Text>
          </View>
          <View className="flex-row items-center">
            <HugeiconsIcon
              icon={Location01Icon}
              size={18}
              color={isDarkMode ? "#919191" : "#454545"}
            />
            <Text className="ml-2 text-[14px] font-poppins text-[#454545] dark:text-[#919191]">
              {meeting.meetingVenue || "No venue added"}
            </Text>
          </View>
          <View className="flex-row items-center">
            <HugeiconsIcon
              icon={UserCircleIcon}
              size={18}
              color={isDarkMode ? "#919191" : "#454545"}
            />
            <Text className="ml-2 text-[14px] font-poppins text-[#454545] dark:text-[#919191]">
              Created by {meeting.createdBy || "Admin"}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderMeetingCard = ({ item }: { item: any }) => (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() =>
        item.meetingStage !== "mom_submitted"
          ? router.push(
              `/createMeeting?meetingId=${item._id}&projectName=${projectName}&company=${company}&projectId=${projectId}`,
            )
          : router.push(
              `/meetingDetail?meetingId=${item._id}&meetingNumber=${item.meetingNumber}&meetingDate=${item.meetingDate}&meetingTime=${item.meetingTime}&meetingVenue=${item.meetingVenue}&projectName=${projectName}&company=${company}`,
            )
      }
      onLongPress={() => handleLongPress(item)}
      delayLongPress={300}
    >
      <MeetingCard meeting={item} />
    </TouchableOpacity>
  );

  const MeetingSkeletonCard = () => {
    return (
      <View
        className="bg-[#F6F8FA] dark:bg-[#1A1A1A] rounded-[16px] p-4 mb-4"
        style={{ opacity: 0.6 }}
      >
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center gap-2">
            <Skeleton colorMode={isDarkMode ? "dark" : "light"} width={70} height={20} radius="round" />
            <Skeleton colorMode={isDarkMode ? "dark" : "light"} width={100} height={20} radius="round" />
          </View>
        </View>

        <Skeleton
          colorMode={isDarkMode ? "dark" : "light"}
          width="70%"
          height={24}
          radius={6}
        />
        <View className="mt-4">
          <Skeleton
            colorMode={isDarkMode ? "dark" : "light"}
            width="100%"
            height={16}
            radius={4}
          />
          <View className="mt-2 text-center items-center justify-center">
             <Skeleton
              colorMode={isDarkMode ? "dark" : "light"}
              width="100%"
              height={16}
              radius={4}
            />
          </View>
          <View className="mt-2">
            <Skeleton
              colorMode={isDarkMode ? "dark" : "light"}
              width="50%"
              height={16}
              radius={4}
            />
          </View>
        </View>

        <View className="gap-3 mt-4">
          <Skeleton colorMode={isDarkMode ? "dark" : "light"} width="60%" height={14} radius={4} />
          <Skeleton colorMode={isDarkMode ? "dark" : "light"} width="80%" height={14} radius={4} />
          <Skeleton colorMode={isDarkMode ? "dark" : "light"} width="40%" height={14} radius={4} />
        </View>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-[#FBFCFD] dark:bg-[#000]">
      <View className="pt-14 pb-4 px-4 flex-row items-center justify-between bg-[#FBFCFD] dark:bg-black ">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-4 p-1">
            <HugeiconsIcon
              icon={ArrowLeft01Icon}
              size={24}
              color={isDarkMode ? "white" : "#0F172A"}
            />
          </TouchableOpacity>
          <Text className="text-[20px] font-dmSemiBold text-[#000] dark:text-white">
            Meetings
          </Text>
        </View>
        <View className="flex-row items-center gap-4">
          <TouchableOpacity className="p-1">
            <HugeiconsIcon
              icon={Search01Icon}
              size={24}
              color={isDarkMode ? "white" : "#0F172A"}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs */}
      <View className="flex-row items-center pt-1 justify-between pb-0">
        {(["Project", "Shared"]).map((tab) => {
          const isActive = activeTab === tab;
          return (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab as "Project" | "Shared")}
              className={`py-2 px-2 border-b flex-1 items-center ${isActive ? "border-[#5B4CCC] dark:border-[#5B4CCC]" : "border-[#E0E5EE] dark:border-[#63615F]"}`}
            >
              <Text
                className={` font-poppinsMedium  ${isActive ? "text-[#5B4CCC] dark:text-[#5B4CCC]" : "text-[#454545] dark:text-[#BBBBBB]"}`}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView
        className="flex-1 px-4 pt-2"
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#6366F1"]}
            tintColor="#6366F1"
          />
        }
      >
        {loading ? (
          <View className="mt-2">
            {[1, 2, 3].map((key) => (
              <MeetingSkeletonCard key={key} />
            ))}
          </View>
        ) : filteredMeetings.length === 0 ? (
          <View className="mt-20 items-center">
            <Text className="text-[#64748B] dark:text-[#94A3B8] text-lg font-poppinsMedium text-center">
              No meetings found for this project
            </Text>
          </View>
        ) : (
          (Array.isArray(filteredMeetings) ? filteredMeetings : []).map((meeting) => (
            <React.Fragment key={meeting._id}>
              {renderMeetingCard({ item: meeting })}
            </React.Fragment>
          ))
        )}
      </ScrollView>

      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() =>
          router.push(
            `/createMeeting?projectId=${projectId}&projectName=${projectName}`,
          )
        }
        style={styles.fab}
        className="absolute bottom-10 right-6 w-16 h-16 bg-[#5B4CCC] rounded-full items-center justify-center z-50"
      >
        <HugeiconsIcon icon={Add01Icon} size={32} color="white" />
      </TouchableOpacity>

      {/* Focused Meeting / Delete Modal */}
      <Modal
        visible={!!focusedMeeting}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setFocusedMeeting(null)}
      >
        <View className="flex-1">
          <Pressable
            style={{ flex: 1 }}
            onPress={() => setFocusedMeeting(null)}
          >
            <BlurView
              blurType={isDarkMode ? "dark" : "light"}
              blurAmount={2}
              reducedTransparencyFallbackColor={isDarkMode ? "black" : "white"}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                bottom: 0,
                right: 0,
              }}
            />
          </Pressable>

          {focusedMeeting && focusedMeeting.layout && (
            <View
              style={{
                position: "absolute",
                top: focusedMeeting.layout.y,
                left: focusedMeeting.layout.x,
                width: focusedMeeting.layout.width,
              }}
            >
              <MeetingCard meeting={focusedMeeting} isFocused={true} />

              <View className="items-end mt-4">
                <View
                  className="bg-white dark:bg-[#1A1A1A] border border-[transparent] dark:border-[#2A2A2A] rounded-2xl p-2"
                  style={{
                    elevation: 15,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.15,
                    shadowRadius: 12,
                    minWidth: 180,
                  }}
                >
                  {activeTab === "Project" && (
                    <>
                      <TouchableOpacity
                        onPress={handleShare}
                        activeOpacity={0.7}
                        className="flex-row items-center p-3 rounded-xl active:bg-gray-100 dark:active:bg-[#252525]"
                      >
                        <HugeiconsIcon icon={Share08Icon} size={22} color={isDarkMode ? "#FFFFFF" : "#000000"} />
                        <Text className="ml-3 text-black dark:text-white font-dmBold text-base">
                          Share
                        </Text>
                      </TouchableOpacity>
                      <View className="h-[1px] bg-gray-100 dark:bg-[#252525] mx-2 my-1" />
                    </>
                  )}

                  <TouchableOpacity
                    onPress={handleConfirmDelete}
                    activeOpacity={0.7}
                    className="flex-row items-center p-3 rounded-xl active:bg-gray-100 dark:active:bg-[#252525]"
                  >
                    <HugeiconsIcon icon={Delete03Icon} size={22} color="#DF5B5B" />
                    <Text className="ml-3 text-[#DF5B5B] font-dmBold text-base">
                      Delete Meeting
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  fab: {
    shadowColor: "#5B4CCC",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 25,
  },
});

export default Minutes;
