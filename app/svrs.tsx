import { Ionicons } from "@expo/vector-icons";
import {
  ArrowLeft01Icon,
  BookOpen01Icon,
  Cancel01Icon,
  Delete03Icon,
  Download01Icon,
  Note01Icon,
  Pdf01Icon,
  Search01Icon,
  Share08Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { BlurView } from "@react-native-community/blur";
import * as FileSystem from "expo-file-system";
import * as Haptics from "expo-haptics";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import { AnimatePresence, MotiView } from "moti";
import { Skeleton } from "moti/skeleton";
import React, { useCallback, useContext, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  Modal,
  Pressable,
  RefreshControl,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import AnimatedTabIndicator from "../components/AnimatedTabIndicator";
import { AuthContext } from "../context/AuthContext";
import api from "../lib/api";

const ReportSkeleton = ({ isDark }: { isDark: boolean }) => (
  <View
    className="rounded-2xl flex-row items-center px-4 py-4 mb-3"
    style={{ backgroundColor: isDark ? "#0D0D0D" : "#F6F8FA", opacity: 0.6 }}
  >
    <View
      className="rounded-xl items-center justify-center mr-3"
      style={{ width: 44, height: 44 }}
    >
      <Skeleton
        colorMode={isDark ? "dark" : "light"}
        width={44}
        height={44}
        radius={12}
      />
    </View>
    <View className="flex-1 pr-3">
      <Skeleton
        colorMode={isDark ? "dark" : "light"}
        width="70%"
        height={16}
        radius={4}
      />
      <View className="mt-2">
        <Skeleton
          colorMode={isDark ? "dark" : "light"}
          width="40%"
          height={12}
          radius={4}
        />
      </View>
    </View>
    <Skeleton
      colorMode={isDark ? "dark" : "light"}
      width={22}
      height={22}
      radius={4}
    />
  </View>
);

type SVRItem = {
  _id: string;
  fileName: string;
  url: string;
  uploadedBy?: { fullName?: string };
  projectId?: { _id: string } | string;
  caseStudyNumber?: number;
  captions?: string[];
};

type FocusedSVR = SVRItem & {
  layout: { x: number; y: number; width: number; height: number };
};

const TABS = ["Project", "Shared"];

const SVRs = () => {
  const router = useRouter();

  const [modalVisible, setModalVisible] = useState(false);

  // ✅ Receiving params from previous screen
  const { projectId, projectName, company, teamLeaders, teamMembers, projectCode, partnerInCharge } =
    useLocalSearchParams();

  const auth = useContext(AuthContext);
  const token = auth?.token;

  const [svrs, setSvrs] = useState<SVRItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [focusedSVR, setFocusedSVR] = useState<FocusedSVR | null>(null);

  const [activeTab, setActiveTab] = useState<"Project" | "Shared">("Project");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const isDownloadingRef = useRef(false);
  const isDark = useColorScheme() === "dark";
  const insets = useSafeAreaInsets();
  const itemRefs = useRef<{ [key: string]: View | null }>({});

  // Fetch SVR list
  const fetchSVRs = useCallback(
    async (background = false, pageNum = 1) => {
      try {
        if (!background && pageNum === 1) setLoading(true);
        const response = await api.get(
          `/svr?projectId=${projectId}&page=${pageNum}&limit=15`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        const fetchedData = response.data || [];
        if (fetchedData.length < 15) {
          setHasMore(false);
        } else {
          setHasMore(true);
        }

        setSvrs((prev) =>
          pageNum === 1 ? fetchedData : [...prev, ...fetchedData],
        );
      } catch (err) {
        console.error("Fetch SVRs failed:", err);
        // Alert.alert("Error", "Failed to fetch SVRs"); // Optional: handle silently on UX
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
        setPage(1);
        fetchSVRs(true, 1);
      }
    }, [projectId, fetchSVRs]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    setPage(1);
    fetchSVRs(true, 1);
  };

  const loadMore = () => {
    if (!loading && !refreshing && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchSVRs(true, nextPage);
    }
  };

  const filteredSVRs = React.useMemo(() => {
    const filteredByTab = svrs.filter((s: any) => {
      const pId =
        typeof s.projectId === "string" ? s.projectId : s.projectId?._id;
      if (activeTab === "Shared") return pId !== String(projectId);
      return pId === String(projectId);
    });

    if (!searchQuery.trim()) return filteredByTab;
    const q = searchQuery.toLowerCase();
    return filteredByTab.filter((s: any) => {
      const matchFile = s.fileName?.toLowerCase().includes(q);
      const matchUser = s.uploadedBy?.fullName?.toLowerCase().includes(q);
      const matchCaption = s.captions?.some((c: any) =>
        c?.toLowerCase().includes(q),
      );
      return matchFile || matchUser || matchCaption;
    });
  }, [svrs, searchQuery, activeTab, projectId]);

  const openTypeSelector = () => {
    setModalVisible(true);
  };

  const goAndClose = (type: any) => {
    setModalVisible(false);
    goToForm(type);
  };

  const goToForm = (type: any) => {
    router.push(
      `/svrForm?projectId=${projectId}&projectName=${projectName}&company=${company}&teamLeaders=${teamLeaders}&teamMembers=${teamMembers}&partnerInCharge=${partnerInCharge}&mode=${type}`,
    );
  };

  const downloadSVR = async (id: string, url: string, fileName: string) => {
    if (isDownloadingRef.current) return; // Prevent multiple downloads (ref avoids stale closure)
    isDownloadingRef.current = true;
    setDownloadingId(id);

    // Timeout to reset loading state if it takes too long
    const timeoutId = setTimeout(() => {
      if (isDownloadingRef.current) {
        isDownloadingRef.current = false;
        setDownloadingId(null);
      }
    }, 10000);

    try {
      const pCode = Array.isArray(projectCode) ? projectCode[0] : projectCode;
      const prefix = (pCode && !fileName.startsWith(pCode)) ? `${pCode}_` : "";
      // Sanitize filename: remove special chars like # that break file URIs
      let safeName = (prefix + fileName).replace(/[#?&=%]/g, "_");
      // Ensure the filename ends with .pdf
      if (!safeName.toLowerCase().endsWith(".pdf")) {
        safeName = `${safeName}.pdf`;
      }
      const downloadUri = FileSystem.documentDirectory + safeName;

      const result = await FileSystem.downloadAsync(url, downloadUri);

      if (result.status !== 200) {
        Alert.alert("Error", `Download failed with status ${result.status}`);
        return;
      }

      // Verify file exists
      const fileInfo = await FileSystem.getInfoAsync(result.uri);
      if (!fileInfo.exists) {
        Alert.alert("Error", "Downloaded file not found");
        return;
      }

      // Open share sheet (Save to Files / Drive / Downloads)
      if (await Sharing.isAvailableAsync()) {
        Sharing.shareAsync(result.uri, {
          mimeType: "application/pdf",
          UTI: "com.adobe.pdf",
          dialogTitle: safeName,
        }).catch((err) => console.warn("Share dismissed:", err));
      } else {
        Alert.alert("Downloaded", "File downloaded successfully");
      }
    } catch (error) {
      console.error("Download failed:", error);
      Alert.alert("Error", "Failed to download file");
    } finally {
      clearTimeout(timeoutId);
      isDownloadingRef.current = false;
      setDownloadingId(null);
    }
  };

  // Long press handler — measures card position, shows blur modal
  const handleLongPress = (item: SVRItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const ref = itemRefs.current[item._id];
    if (ref) {
      ref.measureInWindow((x, y, width, height) => {
        setFocusedSVR({ ...item, layout: { x, y, width, height } });
      });
    }
  };

  // Confirm and execute delete
  const handleConfirmDelete = async () => {
    if (!focusedSVR) return;
    const id = focusedSVR._id;
    setFocusedSVR(null);
    setDeletingId(id);
    try {
      await api.delete(`/svr/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSvrs((prev) => prev.filter((s) => s._id !== id));
    } catch (err) {
      console.error("Delete SVR failed:", err);
      Alert.alert("Error", "Failed to delete SVR");
    } finally {
      setDeletingId(null);
    }
  };

  const handleShareSVR = async () => {
    if (!focusedSVR) return;
    const id = focusedSVR._id;
    setFocusedSVR(null);
    try {
      await api.put(
        `/svr/${id}/share`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      // Refresh list
      fetchSVRs();
    } catch (err: any) {
      console.error("Share SVR failed:", err);
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Failed to share SVR";
      Toast.show({
        type: "error",
        text1: "Share failed",
        text2: errorMessage,
        position: "bottom",
      });
    }
  };

  // Reusable SVR card UI
  const SVRCard = ({ item }: { item: SVRItem }) => (
    <View
      className="rounded-2xl flex-row items-center px-4 py-4"
      style={{ backgroundColor: isDark ? "#0D0D0D" : "#F6F8FA" }}
    >
      {/* PDF Icon Badge */}
      {/* <View
        className="rounded-xl items-center justify-center mr-3"
        style={{
          width: 44,
          height: 44,
          backgroundColor: isDark ? "#2F2F2F" : "#F0F3F7",
        }}
      >
        <HugeiconsIcon
          icon={Pdf01Icon}
          size={22}
          color={isDark ? "#F5F5F5" : "#454545"}
        />
      </View> */}

      {/* File Info */}
      <View className="flex-1 pr-3">
        <Text
          style={{ color: isDark ? "#FFF" : "#000" }}
          className="font-poppinsMedium "
          numberOfLines={1}
        >
          {item.fileName}
        </Text>
        <Text
          style={{ color: isDark ? "#6B7280" : "#9CA3AF" }}
          className="text-xs font-poppins mt-0.5"
        >
          Uploaded by : {item.uploadedBy?.fullName || "Unknown"}
        </Text>
      </View>

      {/* Download Button */}
      <TouchableOpacity
        onPress={() => downloadSVR(item._id, item.url, item.fileName)}
        disabled={downloadingId === item._id}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        {downloadingId === item._id ? (
          <ActivityIndicator size={20} color="#6366F1" />
        ) : (
          <HugeiconsIcon
            icon={Download01Icon}
            size={22}
            color={isDark ? "#BBBBBB" : "#454545"}
          />
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? "#000000" : "#FBFCFD" }}>
      {/* Header */}
      <View
        style={{ backgroundColor: isDark ? "#000000" : "#FBFCFD" }}
        className="pt-14 pb-4 px-5 flex-row items-center justify-between"
      >
        <TouchableOpacity
          onPress={() => router.back()}
          className="flex-row items-center"
          activeOpacity={0.7}
        >
          <HugeiconsIcon
            icon={ArrowLeft01Icon}
            size={24}
            color={isDark ? "#fff" : "#000"}
          />
          <Text
            style={{ color: isDark ? "#fff" : "#000" }}
            className="text-xl font-dmSemiBold ml-3"
          >
            SVR
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            if (searchVisible) setSearchQuery("");
            setSearchVisible(!searchVisible);
          }}
          activeOpacity={0.7}
        >
          <HugeiconsIcon
            icon={searchVisible ? Cancel01Icon : Search01Icon}
            size={24}
            color={isDark ? "#fff" : "#000"}
          />
        </TouchableOpacity>
      </View>

      <AnimatePresence>
        {searchVisible && (
          <MotiView
            key="search-bar-moti"
            from={{ opacity: 0, translateY: -10 }}
            animate={{ opacity: 1, translateY: 0 }}
            exit={{ opacity: 0, translateY: -10 }}
            transition={{ type: "timing", duration: 250 }}
            className="px-5 pb-4"
            style={{ backgroundColor: isDark ? "#000000" : "#FBFCFD" }}
          >
            <View className="flex-row items-center bg-[#F0F3F7] dark:bg-[#1A1A1A] rounded-2xl px-4 py-3">
              <HugeiconsIcon
                icon={Search01Icon}
                size={20}
                color={isDark ? "#A1A1A1" : "#606060"}
              />
              <TextInput
                placeholder="Search by name, uploader, or captions..."
                placeholderTextColor={isDark ? "#606060" : "#9CA3AF"}
                className="ml-2 flex-1 font-dm text-black dark:text-white text-base"
                autoFocus
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery("")}>
                  <Ionicons
                    name="close-circle"
                    size={20}
                    color={isDark ? "#6B7280" : "#9CA3AF"}
                  />
                </TouchableOpacity>
              )}
            </View>
          </MotiView>
        )}
      </AnimatePresence>

      {/* Tabs */}
      <View className="flex-row items-center pt-1 justify-between mb-4 pb-0 border-b border-[#E0E5EE] dark:border-[#63615F] relative">
        {TABS.map((tab) => {
          const isActive = activeTab === tab;
          return (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab as "Project" | "Shared")}
              className="py-2 px-2 flex-1 items-center"
            >
              <Text
                className={` font-poppinsMedium  ${isActive ? "text-[#5B4CCC] dark:text-[#5B4CCC]" : "text-[#454545] dark:text-[#BBBBBB]"}`}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          );
        })}
        <AnimatedTabIndicator tabs={TABS} activeTab={activeTab} />
      </View>

      {/* Content */}
      <View className="flex-1 px-4">
        {loading && !refreshing ? (
          <FlatList
            data={[1, 2, 3, 4, 5, 6]}
            keyExtractor={(item) => `skeleton-${item}`}
            renderItem={() => <ReportSkeleton isDark={isDark} />}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <FlatList
            data={filteredSVRs}
            keyExtractor={(item) => item._id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100, flexGrow: 1 }}
            initialNumToRender={8}
            maxToRenderPerBatch={6}
            windowSize={5}
            removeClippedSubviews={true}
            onEndReached={loadMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={
              hasMore && page > 1 ? (
                <ActivityIndicator className="my-4" color="#5B4CCC" />
              ) : (
                <View className="h-4" />
              )
            }
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={["#5B4CCC"]}
                tintColor={isDark ? "#FFF" : "#5B4CCC"}
              />
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                ref={(el) => {
                  itemRefs.current[item._id] = el;
                }}
                onPress={() => Linking.openURL(item.url)}
                onLongPress={() => handleLongPress(item)}
                delayLongPress={300}
                activeOpacity={0.9}
                className="mb-3"
                style={{ opacity: deletingId === item._id ? 0.4 : 1 }}
              >
                <SVRCard item={item} />
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <Text
                style={{ color: isDark ? "#9CA3AF" : "#9CA3AF" }}
                className="text-center font-medium mt-16"
              >
                No SVRs found.
              </Text>
            }
          />
        )}
      </View>

      {/* Type Selection Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
          className="flex-1 bg-black/30 justify-end"
        >
          <View
            onStartShouldSetResponder={() => true}
            className="bg-[#F0F3F7] dark:bg-[#1A1A1A] rounded-t-[24px] px-4 pt-4"
            style={{ paddingBottom: Math.max(insets.bottom, 48) }}
          >
            <View className="flex-row justify-between gap-3">
              <TouchableOpacity
                onPress={() => goAndClose("case-study")}
                className="flex-1 bg-[#FFF] dark:bg-[#000] rounded-[16px] py-4 items-center "
              >
                <HugeiconsIcon
                  icon={BookOpen01Icon}
                  size={24}
                  color={isDark ? "#fff" : "#000"}
                />
                <Text className="mt-1 font-poppins text-black dark:text-white text-base">
                  Case Study
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => goAndClose("svr")}
                className="flex-1 bg-[#FFF] dark:bg-[#000] rounded-[16px] py-4 items-center "
              >
                <HugeiconsIcon
                  icon={Note01Icon}
                  size={24}
                  color={isDark ? "#fff" : "#000"}
                />
                <Text className="mt-1 font-poppins text-black dark:text-white text-base">
                  SVR
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Floating + Button */}
      <TouchableOpacity
        onPress={openTypeSelector}
        style={{
          position: "absolute",
          bottom: 44,
          right: 20,
          width: 54,
          height: 54,
          borderRadius: 28,
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
        <Ionicons name="add" size={30} color="white" />
      </TouchableOpacity>

      {/* Long-press Delete Modal — same pattern as userDirectory */}
      <Modal
        visible={!!focusedSVR}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setFocusedSVR(null)}
      >
        <View style={{ flex: 1 }}>
          {/* Blurred backdrop — tap to dismiss */}
          <Pressable style={{ flex: 1 }} onPress={() => setFocusedSVR(null)}>
            <BlurView
              blurType={isDark ? "dark" : "light"}
              blurAmount={2}
              reducedTransparencyFallbackColor={isDark ? "black" : "white"}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                bottom: 0,
                right: 0,
              }}
            />
          </Pressable>

          {/* Focused card + delete button, positioned exactly over original */}
          {focusedSVR && focusedSVR.layout && (
            <View
              style={{
                position: "absolute",
                top: focusedSVR.layout.y,
                left: focusedSVR.layout.x,
                width: focusedSVR.layout.width,
              }}
            >
              <SVRCard item={focusedSVR} />

              <View className="items-end mt-2">
                <View
                  className="bg-white dark:bg-[#1A1A1A] border border-[transparent] dark:border-[#2A2A2A] rounded-2xl p-2"
                  style={{
                    elevation: 15,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.15,
                    shadowRadius: 12,
                    minWidth: 160,
                  }}
                >
                  {activeTab === "Project" && (
                    <>
                      <TouchableOpacity
                        onPress={handleShareSVR}
                        activeOpacity={0.7}
                        className="flex-row items-center p-3 rounded-xl active:bg-gray-100 dark:active:bg-[#252525]"
                      >
                        <HugeiconsIcon
                          icon={Share08Icon}
                          size={22}
                          color={isDark ? "#FFFFFF" : "#000000"}
                        />
                        <Text className="ml-3 text-black dark:text-white font-poppinsMedium text-base">
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
                    <HugeiconsIcon
                      icon={Delete03Icon}
                      size={22}
                      color="#DF5B5B"
                    />
                    <Text className="ml-3 text-[#DF5B5B] font-poppinsMedium text-base">
                      Delete
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

export default SVRs;
