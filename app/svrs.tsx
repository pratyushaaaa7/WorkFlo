import { Ionicons } from "@expo/vector-icons";
import {
  ArrowLeft01Icon,
  Delete03Icon,
  Download01Icon,
  Pdf01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { BlurView } from "@react-native-community/blur";
import * as FileSystem from "expo-file-system";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import React, { useContext, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  Modal,
  Pressable,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { AuthContext } from "../context/AuthContext";
import api from "../lib/api";

type SVRItem = {
  _id: string;
  fileName: string;
  url: string;
  svrNumber?: number;
  uploadedBy?: { fullName?: string };
  caseStudyNumber?: number;
};

type FocusedSVR = SVRItem & {
  layout: { x: number; y: number; width: number; height: number };
};

const SVRs = () => {
  const router = useRouter();

  const [modalVisible, setModalVisible] = useState(false);

  // ✅ Receiving params from previous screen
  const { projectId, projectName, company, teamLeaders, teamMembers } =
    useLocalSearchParams();

  const auth = useContext(AuthContext);
  const token = auth?.token;

  const [svrs, setSvrs] = useState<SVRItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [focusedSVR, setFocusedSVR] = useState<FocusedSVR | null>(null);
  const isDownloadingRef = useRef(false);
  const isDark = useColorScheme() === "dark";
  const itemRefs = useRef<{ [key: string]: View | null }>({});

  // Fetch SVR list
  const fetchSVRs = async () => {
    try {
      const response = await api.get(`/svr?projectId=${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setSvrs(response.data || []);
    } catch (err) {
      console.error("Fetch DPRs failed:", err);
      Alert.alert("Error", "Failed to fetch SVRs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSVRs();
  }, [projectId]);

  const openTypeSelector = () => {
    setModalVisible(true);
  };

  const goAndClose = (type: any) => {
    setModalVisible(false);
    goToForm(type);
  };

  const goToForm = (type: any) => {
    router.push(
      `/svrForm?projectId=${projectId}&projectName=${projectName}&company=${company}&teamLeaders=${teamLeaders}&teamMembers=${teamMembers}&mode=${type}`,
    );
  };

  const downloadSVR = async (id: string, url: string, fileName: string) => {
    if (isDownloadingRef.current) return; // Prevent multiple downloads (ref avoids stale closure)
    isDownloadingRef.current = true;
    setDownloadingId(id);
    try {
      // Sanitize filename: remove special chars like # that break file URIs
      let safeName = fileName.replace(/[#?&=%]/g, "_");
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

  // Reusable SVR card UI
  const SVRCard = ({ item }: { item: SVRItem }) => (
    <View
      className="rounded-2xl flex-row items-center px-4 py-4"
      style={{ backgroundColor: isDark ? "#0D0D0D" : "#F6F8FA" }}
    >
      {/* PDF Icon Badge */}
      <View
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
      </View>

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
        className="pt-14 pb-6 px-5 flex-row items-center"
      >
        <TouchableOpacity
          onPress={() =>
            router.push(
              `/projectMain?projectId=${projectId}&company=${company}&projectName=${projectName}`,
            )
          }
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
      </View>

      {/* Content */}
      <View className="flex-1 px-4">
        {loading ? (
          <ActivityIndicator size="large" color="#6366F1" className="mt-10" />
        ) : svrs.length === 0 ? (
          <Text
            style={{ color: isDark ? "#9CA3AF" : "#9CA3AF" }}
            className="text-center font-medium mt-16"
          >
            No SVRs found.
          </Text>
        ) : (
          <FlatList
            data={svrs}
            keyExtractor={(item) => item._id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100 }}
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
          />
        )}
      </View>

      {/* Type Selection Modal */}
      {modalVisible && (
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
          className="absolute inset-0 bg-black/40 flex items-center justify-center px-6"
        >
          <View
            onStartShouldSetResponder={() => true}
            className="w-full bg-white rounded-3xl p-6  max-w-sm relative"
          >
            {/* Close Button */}
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              className="absolute top-4 right-4 p-1"
            >
              <Ionicons name="close" size={26} color="#555" />
            </TouchableOpacity>

            {/* Title */}
            <Text className="text-xl font-bold text-gray-800 text-center mb-6 mt-2">
              Select Report Type
            </Text>

            {/* Buttons */}
            <View className="gap-4">
              <TouchableOpacity
                onPress={() => goAndClose("svr")}
                className="flex-row items-center bg-indigo-600 py-4 px-4 rounded-2xl"
              >
                <Ionicons
                  name="document-text-outline"
                  size={24}
                  color="white"
                />
                <Text className="text-white text-lg font-semibold ml-3">
                  SVR
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => goAndClose("case-study")}
                className="flex-row items-center bg-purple-600 py-4 px-4 rounded-2xl"
              >
                <Ionicons name="book-outline" size={24} color="white" />
                <Text className="text-white text-lg font-semibold ml-3">
                  Case Study
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      )}

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

              <TouchableOpacity
                onPress={handleConfirmDelete}
                activeOpacity={0.9}
                className="mt-2 flex-row items-center justify-center self-end bg-white dark:bg-[#0D0D0D] dark:border-[#262626] border border-[#E0E5EB] px-5 py-4 rounded-2xl"
                style={{
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.15,
                  shadowRadius: 12,
                  elevation: 5,
                }}
              >
                <HugeiconsIcon icon={Delete03Icon} size={22} color="#DF5B5B" />
                <Text className="ml-3 text-[#DF5B5B] font-poppinsMedium text-base">
                  Delete
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
};

export default SVRs;
