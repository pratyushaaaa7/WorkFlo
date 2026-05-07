import { Ionicons } from "@expo/vector-icons";
import {
  ArrowLeft01Icon,
  Cancel01Icon,
  Delete03Icon,
  Download01Icon,
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
import Toast from "react-native-toast-message";
import api from "../lib/api";

const ReportSkeleton = ({ isDark }: { isDark: boolean }) => (
  <View
    className="rounded-2xl flex-row items-center px-4 py-4 mb-3"
    style={{ backgroundColor: isDark ? "#0D0D0D" : "#F6F8FA", opacity: 0.6 }}
  >
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
// import * as DocumentPicker from "expo-document-picker";
import AnimatedTabIndicator from "../components/AnimatedTabIndicator";
import { AuthContext } from "../context/AuthContext";

type DprItem = {
  _id: string;
  fileName: string;
  url: string;
  projectId?: { _id: string } | string;
  uploadedBy?: {
    fullName: string;
  };
  captions?: string[];
  // add other fields if needed
};

type FocusedDPR = DprItem & {
  layout: { x: number; y: number; width: number; height: number };
};

const DPRs = () => {
  const router = useRouter();
  const { projectId, projectName, company, teamLeaders, teamMembers, projectCode, partnerInCharge } =
    useLocalSearchParams();
  const auth = useContext(AuthContext);
  const token = auth?.token;

  // const [uploading, setUploading] = useState(false);
  const [dprs, setDprs] = useState<DprItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<{
    fileName: string;
    uploadedBy: string;
    downloadedBytes: number;
    totalBytes: number;
  } | null>(null);
  const [focusedDPR, setFocusedDPR] = useState<FocusedDPR | null>(null);

  const [activeTab, setActiveTab] = useState<"Project" | "Shared">("Project");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const isDownloadingRef = useRef(false);
  const isDark = useColorScheme() === "dark";
  const itemRefs = useRef<{ [key: string]: View | null }>({});

  // ✅ Fetch DPRs for this project
  const fetchDPRs = useCallback(
    async (background = false, pageNum = 1) => {
      try {
        if (!background && pageNum === 1) setLoading(true);
        const response = await api.get(
          `/dpr?projectId=${projectId}&page=${pageNum}&limit=15`,
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
        setDprs((prev) =>
          pageNum === 1 ? fetchedData : [...prev, ...fetchedData],
        );
      } catch (err) {
        console.error("Fetch DPRs failed:", err);
        // Alert.alert("Error", "Failed to fetch DPRs");
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
        fetchDPRs(true, 1);
      }
    }, [projectId, fetchDPRs]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    setPage(1);
    fetchDPRs(true, 1);
  };

  const loadMore = () => {
    if (!loading && !refreshing && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchDPRs(true, nextPage);
    }
  };

  // const handleDeleteDPR = async (dprId: string) => {
  //   Alert.alert("Delete DPR", "Are you sure you want to delete this DPR?", [
  //     { text: "Cancel", style: "cancel" },
  //     {
  //       text: "Delete",
  //       style: "destructive",
  //       onPress: async () => {
  //         try {
  //           await api.delete(`/dpr/${dprId}`, {
  //             headers: {
  //               Authorization: `Bearer ${token}`,
  //             },
  //           });

  //           Alert.alert("Success", "DPR deleted successfully");

  //           // Refresh list
  //           fetchDPRs();
  //         } catch (error) {
  //           console.error("Delete DPR failed:", error);
  //           Alert.alert("Error", "Failed to delete DPR");
  //         }
  //       },
  //     },
  //   ]);
  // };

  // ✅ Upload a new DPR
  // const handleUploadDPR = async () => {
  //   try {
  //     const result = await DocumentPicker.getDocumentAsync({
  //       type: "application/pdf",
  //     });

  //     if (result.canceled) return;
  //     const file = result.assets[0];

  //     setUploading(true);

  //     const formData = new FormData();
  //     formData.append("file", {
  //       uri: file.uri,
  //       name: file.name,
  //       type: "application/pdf",
  //     });
  //     formData.append("projectId", projectId);

  //     const response = await api.post("/dpr", formData, {
  //       headers: {
  //         "Content-Type": "multipart/form-data",
  //         Authorization: `Bearer ${token}`,
  //       },
  //     });

  //     if (response.data.success) {
  //       Alert.alert("Success", "DPR uploaded successfully");
  //       fetchDPRs(); // refresh list
  //     } else {
  //       Alert.alert("Error", "Upload failed");
  //     }
  //   } catch (err) {
  //     console.error("Upload failed:", err);
  //     Alert.alert("Error", "Failed to upload DPR");
  //   } finally {
  //     setUploading(false);
  //   }
  // };

  // ✅ Open PDF in browser

  const downloadDPR = async (id: string, url: string, fileName: string, uploadedBy?: string) => {
    if (isDownloadingRef.current) return;
    isDownloadingRef.current = true;
    setDownloadingId(id);
    setDownloadProgress({
      fileName,
      uploadedBy: uploadedBy || "Unknown",
      downloadedBytes: 0,
      totalBytes: 0,
    });

    try {
      const pCode = Array.isArray(projectCode) ? projectCode[0] : projectCode;
      const prefix = (pCode && !fileName.startsWith(pCode)) ? `${pCode}_` : "";
      let safeName = (prefix + fileName).replace(/[#?&=%]/g, "_");
      if (!safeName.toLowerCase().endsWith(".pdf")) {
        safeName = `${safeName}.pdf`;
      }
      const downloadUri = FileSystem.documentDirectory + safeName;

      const downloadResumable = FileSystem.createDownloadResumable(
        url,
        downloadUri,
        {},
        (downloadProgressEvent) => {
          const { totalBytesWritten, totalBytesExpectedToWrite } = downloadProgressEvent;
          setDownloadProgress((prev) =>
            prev
              ? { ...prev, downloadedBytes: totalBytesWritten, totalBytes: totalBytesExpectedToWrite }
              : prev,
          );
        },
      );

      const result = await downloadResumable.downloadAsync();
      if (!result || result.status !== 200) {
        Alert.alert("Error", `Download failed with status ${result?.status}`);
        return;
      }

      const fileInfo = await FileSystem.getInfoAsync(result.uri);
      if (!fileInfo.exists) {
        Alert.alert("Error", "Downloaded file not found");
        return;
      }

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
      isDownloadingRef.current = false;
      setDownloadingId(null);
      setDownloadProgress(null);
    }
  };

  const filteredDPRs = React.useMemo(() => {
    const filteredByTab = dprs.filter((d: any) => {
      const pId =
        typeof d.projectId === "string" ? d.projectId : d.projectId?._id;
      if (activeTab === "Shared") return pId !== projectId;
      return pId === projectId;
    });

    if (!searchQuery.trim()) return filteredByTab;
    const q = searchQuery.toLowerCase();
    return filteredByTab.filter((d: any) => {
      const matchFile = d.fileName?.toLowerCase().includes(q);
      const matchUser = d.uploadedBy?.fullName?.toLowerCase().includes(q);
      const matchCaption = d.captions?.some((c: any) =>
        c?.toLowerCase().includes(q),
      );
      return matchFile || matchUser || matchCaption;
    });
  }, [dprs, searchQuery, activeTab, projectId]);

  // Long press handler — measures card position, shows blur modal
  const handleLongPress = (item: DprItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const ref = itemRefs.current[item._id];
    if (ref) {
      ref.measureInWindow((x, y, width, height) => {
        setFocusedDPR({ ...item, layout: { x, y, width, height } });
      });
    }
  };

  // Confirm and execute delete
  const handleConfirmDelete = async () => {
    if (!focusedDPR) return;
    const id = focusedDPR._id;
    setFocusedDPR(null);
    setDeletingId(id);
    try {
      await api.delete(`/dpr/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDprs((prev) => prev.filter((d) => d._id !== id));
    } catch (err) {
      console.error("Delete DPR failed:", err);
      Alert.alert("Error", "Failed to delete DPR");
    } finally {
      setDeletingId(null);
    }
  };

  const handleShareDPR = async () => {
    if (!focusedDPR) return;
    const id = focusedDPR._id;
    setFocusedDPR(null);
    try {
      await api.put(
        `/dpr/${id}/share`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      // Refresh list to update status
      fetchDPRs();
    } catch (err: any) {
      console.error("Share DPR failed:", err);
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Failed to share DPR";
      Toast.show({
        type: "error",
        text1: "Share failed",
        text2: errorMessage,
        position: "bottom",
      });
    }
  };

  // Reusable DPR card UI
  const DPRCard = ({ item }: { item: DprItem }) => {
    const isThis = downloadingId === item._id;
    return (
      <View
        className="rounded-2xl px-4 py-4"
        style={{ backgroundColor: isDark ? "#0D0D0D" : "#F6F8FA" }}
      >
        {/* Top row: name + uploader + download icon */}
        <View className="flex-row items-center">
          {/* File Info */}
          <View className="flex-1 pr-3">
            <Text
              style={{ color: isDark ? "#FFF" : "#000" }}
              className="font-poppinsMedium"
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
            onPress={() => downloadDPR(item._id, item.url, item.fileName, item.uploadedBy?.fullName)}
            disabled={!!downloadingId}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <HugeiconsIcon
              icon={Download01Icon}
              size={22}
              color={isThis ? "#5B4CCC" : isDark ? "#BBBBBB" : "#454545"}
            />
          </TouchableOpacity>
        </View>

        {/* Inline progress — only for the card being downloaded */}
        {isThis && (
          <>
            {/* Progress bar */}
            <View
              style={{
                height: 3,
                backgroundColor: isDark ? "#2A2A2A" : "#E5E7EB",
                borderRadius: 2,
                marginTop: 12,
                marginBottom: 6,
                overflow: "hidden",
              }}
            >
              <View
                style={{
                  height: 3,
                  width:
                    downloadProgress && downloadProgress.totalBytes > 0
                      ? `${Math.min((downloadProgress.downloadedBytes / downloadProgress.totalBytes) * 100, 100)}%`
                      : "5%",
                  backgroundColor: "#5B4CCC",
                  borderRadius: 2,
                }}
              />
            </View>

            {/* Status row */}
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                <ActivityIndicator size={11} color="#5B4CCC" />
                <Text
                  style={{
                    color: isDark ? "#9CA3AF" : "#6B7280",
                    fontFamily: "Poppins-Regular",
                    fontSize: 11,
                  }}
                >
                  Downloading...
                </Text>
              </View>
              <Text
                style={{
                  color: isDark ? "#9CA3AF" : "#6B7280",
                  fontFamily: "Poppins-Regular",
                  fontSize: 11,
                }}
              >
                {downloadProgress
                  ? `${(downloadProgress.downloadedBytes / 1048576).toFixed(1)} MB of ${downloadProgress.totalBytes > 0 ? (downloadProgress.totalBytes / 1048576).toFixed(1) : "--"} MB`
                  : ""}
              </Text>
            </View>
          </>
        )}
      </View>
    );
  };

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
            DPR
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
      <View className="flex-row items-center pt-1 mb-4 justify-between pb-0 border-b border-[#E0E5EE] dark:border-[#63615F] relative">
        {["Project", "Shared"].map((tab) => {
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
        <AnimatedTabIndicator
          tabs={["Project", "Shared"]}
          activeTab={activeTab}
        />
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
            data={filteredDPRs}
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
                <DPRCard item={item} />
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <Text
                style={{ color: isDark ? "#9CA3AF" : "#9CA3AF" }}
                className="text-center font-medium mt-16"
              >
                No DPRs found.
              </Text>
            }
          />
        )}

        {/* Upload Button */}
        {/* <TouchableOpacity
          onPress={handleUploadDPR}
          disabled={uploading}
          className="bg-indigo-600 px-6 py-3 rounded-full mt-6 items-center"
        >
          {uploading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white font-semibold">Upload DPR (PDF)</Text>
          )}
        </TouchableOpacity> */}
      </View>

      {/* Floating + Button */}
      <TouchableOpacity
        onPress={() =>
          router.push(
            `/dprLaborForm?projectId=${projectId}&projectName=${projectName}&company=${company}&teamLeaders=${teamLeaders}&teamMembers=${teamMembers}&partnerInCharge=${partnerInCharge}`,
          )
        }
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
        visible={!!focusedDPR}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setFocusedDPR(null)}
      >
        <View style={{ flex: 1 }}>
          {/* Blurred backdrop — tap to dismiss */}
          <Pressable style={{ flex: 1 }} onPress={() => setFocusedDPR(null)}>
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
          {focusedDPR && focusedDPR.layout && (
            <View
              style={{
                position: "absolute",
                top: focusedDPR.layout.y,
                left: focusedDPR.layout.x,
                width: focusedDPR.layout.width,
              }}
            >
              <DPRCard item={focusedDPR} />

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
                        onPress={handleShareDPR}
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

export default DPRs;
