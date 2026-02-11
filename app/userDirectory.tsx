import { Ionicons } from "@expo/vector-icons";
import {
  Add01Icon,
  ArrowLeft01Icon,
  Cancel01Icon,
  Delete03Icon,
  MoreHorizontalIcon,
  Pdf01Icon,
  Search01Icon,
  UserAdd01Icon,
  Xsl01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { BlurView } from "@react-native-community/blur";
import * as Clipboard from "expo-clipboard";
import * as FileSystem from "expo-file-system";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import { AnimatePresence, MotiView } from "moti";
import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Linking,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import Toast from "react-native-toast-message";
import { AuthContext } from "../context/AuthContext";
import api from "../lib/api";

// User Interface
interface IUser {
  _id: string;
  individualName: string;
  designation: string;
  role: string;
  roleDescription: string;
  firmName: string;
  email: string;
  phone: string;
  expertise?: string;
}

const UserList = () => {
  const isDarkMode = useColorScheme() === "dark";
  const router = useRouter();
  const { projectId, projectName, company } = useLocalSearchParams();
  const [users, setUsers] = useState<IUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const auth = useContext(AuthContext);
  const token = auth?.token;

  // Filter state
  const [activeFilter, setActiveFilter] = useState("  All  ");
  const filters = ["  All  ", "Client", "Vendor", "Consultant"];
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  // Export menu state
  const [exportMenuVisible, setExportMenuVisible] = useState(false);
  const [excelLoading, setExcelLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  // Delete/Focus state
  const [focusedUser, setFocusedUser] = useState<any | null>(null);
  const userRefs = useRef<{ [key: string]: View | null }>({});

  const handleDownloadExcel = async () => {
    if (!token || !projectId) {
      Toast.show({
        type: "error",
        text1: "Download Failed",
        text2: "Project or token is missing",
      });
      return;
    }

    try {
      setExcelLoading(true);
      setExportMenuVisible(false);

      const response = await api.post(
        "/user-directory/export/excel",
        { projectId, projectName, company },
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: "blob",
        },
      );

      const fileName = `${projectName || "project"}_User_Directory.xlsx`;

      if (Platform.OS === "web") {
        const url = window.URL.createObjectURL(response.data);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
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
          mimeType:
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          dialogTitle: "Download User Directory",
          UTI: "com.microsoft.excel.xlsx",
        });
      }
    } catch (err) {
      console.error("Excel download error:", err);
      Toast.show({
        type: "error",
        text1: "Download Failed",
        text2: "Unable to download user directory.",
        position: "bottom",
      });
    } finally {
      setExcelLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!token || !projectId) {
      Toast.show({
        type: "error",
        text1: "Download Failed",
        text2: "Project or token is missing",
      });
      return;
    }

    try {
      setPdfLoading(true);
      setExportMenuVisible(false);

      const response = await api.post(
        "/user-directory/export/pdf",
        { projectId, projectName, company },
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: "blob",
        },
      );

      const fileName = `${projectName || "project"}_User_Directory.pdf`;

      if (Platform.OS === "web") {
        const url = window.URL.createObjectURL(response.data);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
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
          dialogTitle: "Download User Directory PDF",
          UTI: "com.adobe.pdf",
        });
      }
    } catch (err) {
      console.error("PDF download error:", err);
      Toast.show({
        type: "error",
        text1: "Download Failed",
        text2: "Unable to download user directory PDF.",
        position: "bottom",
      });
    } finally {
      setPdfLoading(false);
    }
  };

  const fetchUsers = async (showLoader = true) => {
    if (!projectId || !token) return;

    try {
      if (showLoader) setLoading(true);
      const res = await api.get(`/projects/${projectId}/project-users`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const projectUsers = [
        ...(res.data.users.leaders || []),
        ...(res.data.users.members || []),
        ...(res.data.users.others || []),
      ];

      const formattedUsers: IUser[] = projectUsers.map((pu: any) => ({
        _id: pu._id || "",
        individualName: pu.individualName || pu.fullName || "N/A",
        designation: pu.designation || "-",
        expertise: pu.expertise || "-",
        role: pu.role || "-",
        roleDescription: pu.roleDescription || "-",
        firmName: pu.firmName || "-",
        email: pu.email || "-",
        phone: pu.phone || "-",
      }));

      setUsers(formattedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      Toast.show({
        type: "error",
        text1: "Failed to Load Users",
        text2: "Unable to load users for this project.",
        position: "bottom",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchUsers(false);
  };

  useEffect(() => {
    if (projectId && token) {
      fetchUsers();
    }
  }, [projectId, token]);

  const filteredUsers = useMemo(() => {
    let result = users;

    if (activeFilter !== "  All  ") {
      result = result.filter(
        (u) => u.role?.toLowerCase() === activeFilter.toLowerCase(),
      );
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((u) =>
        u.individualName.toLowerCase().includes(query),
      );
    }

    return result;
  }, [users, activeFilter, searchQuery]);

  const handleLongPress = (user: IUser) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const ref = userRefs.current[user._id];
    if (ref) {
      ref.measureInWindow((x, y, width, height) => {
        setFocusedUser({ ...user, layout: { x, y, width, height } });
      });
    }
  };

  const handleConfirmDelete = async () => {
    if (!focusedUser || !projectId || !token) return;

    try {
      setLoading(true);
      const userId = focusedUser._id;
      setFocusedUser(null);
      await api.delete(`/projects/${projectId}/project-users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      Toast.show({
        type: "success",
        text1: "User Removed",
        text2: "The user has been removed from the project successfully.",
        position: "bottom",
      });

      fetchUsers();
    } catch (error: any) {
      console.error("Error removing user:", error);
      Toast.show({
        type: "error",
        text1: "Remove Failed",
        text2: "Unable to remove the user from the project.",
        position: "bottom",
      });
    } finally {
      setLoading(false);
    }
  };

  const UserCard = ({
    item,
    isFocused = false,
  }: {
    item: IUser;
    isFocused?: boolean;
  }) => (
    <View
      ref={(el) => {
        if (!isFocused) userRefs.current[item._id] = el;
      }}
      className={`bg-[#F8F9FB] dark:bg-[#1A1A1A] rounded-2xl p-3  ${
        isFocused ? "" : "mb-4"
      }`}
      // style={{ elevation: isFocused ? 0 : 2 }}
    >
      <View className="flex-row justify-between items-start mb-2">
        <Text className="text-lg font-dmBold text-black dark:text-white flex-1">
          {item.individualName}{" "}
          <Text className="text-[#454545] dark:text-[#919191] text-sm">
            {" "}
            •{" "}
          </Text>{" "}
          <Text className="text-[#454545] dark:text-[#919191] text-sm font-poppins">
            {item.role}
          </Text>
        </Text>
      </View>

      <Text className="text-[#454545] dark:text-[#919191] text-sm font-poppins mb-1">
        {item.firmName}{" "}
        <Text className="text-[#454545] dark:text-[#919191]"> • </Text>{" "}
        {item.designation}
      </Text>

      <Text className="text-[#454545] dark:text-[#919191] text-sm font-poppins mb-3">
        {item.expertise}
      </Text>

      <View className="flex-row justify-between items-center border-t border-[#E0E5EB] dark:border-[#252525] pt-2">
        <TouchableOpacity
          onPress={() => item.email && Linking.openURL(`mailto:${item.email}`)}
          onLongPress={async () => {
            if (item.email) {
              await Clipboard.setStringAsync(item.email);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              Toast.show({
                type: "success",
                text1: "Copied",
                text2: "Email copied to clipboard",
                position: "bottom",
              });
            }
          }}
          className="flex-1 mr-2"
        >
          <Text
            numberOfLines={1}
            className="text-[#0073CB] text-sm font-dmMedium"
          >
            {item.email}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            if (item.phone) {
              const phoneNumber =
                Platform.OS === "android"
                  ? `tel:${item.phone}`
                  : `telprompt:${item.phone}`;
              Linking.openURL(phoneNumber);
            }
          }}
          onLongPress={async () => {
            if (item.phone) {
              await Clipboard.setStringAsync(item.phone);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              Toast.show({
                type: "success",
                text1: "Copied",
                text2: "Phone number copied to clipboard",
                position: "bottom",
              });
            }
          }}
        >
          <Text className="text-[#0073CB] text-sm font-dmMedium">
            {item.phone}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderUserCard = ({ item }: { item: IUser }) => (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() =>
        router.push({
          pathname: "/userDetail",
          params: { user: JSON.stringify(item) },
        })
      }
      onLongPress={() => handleLongPress(item)}
      delayLongPress={300}
    >
      <UserCard item={item} />
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-white dark:bg-black">
      {/* Header */}
      <View className="pt-16 pb-3 px-5 flex-row items-center justify-between">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <HugeiconsIcon
            icon={ArrowLeft01Icon}
            size={24}
            color={isDarkMode ? "#FFF" : "#000"}
          />
        </TouchableOpacity>

        <Text className="flex-1 text-xl font-dmBold text-black dark:text-white">
          User Directory
        </Text>

        <View className="flex-row items-center gap-4">
          <TouchableOpacity onPress={() => setShowSearch(!showSearch)}>
            <HugeiconsIcon
              icon={showSearch ? Cancel01Icon : Search01Icon}
              size={24}
              color={isDarkMode ? "#FFF" : "#000"}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() =>
              router.push(
                `/addProjectUser?projectId=${projectId}&projectName=${projectName}`,
              )
            }
          >
            <HugeiconsIcon
              icon={UserAdd01Icon}
              size={24}
              color={isDarkMode ? "#FFF" : "#000"}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setExportMenuVisible(true)}>
            <HugeiconsIcon
              icon={MoreHorizontalIcon}
              size={24}
              color={isDarkMode ? "#FFF" : "#000"}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* 🔹 SEARCH BAR */}
      <AnimatePresence>
        {showSearch && (
          <MotiView
            from={{ opacity: 0, translateY: -10 }}
            animate={{ opacity: 1, translateY: 0 }}
            exit={{ opacity: 0, translateY: -10 }}
            transition={{ type: "timing", duration: 250 }}
            className="px-5 pb-2"
          >
            <View className="flex-row items-center bg-[#F8F9FB] dark:bg-[#1A1A1A] rounded-xl px-3 py-2 border border-[#E0E5EB] dark:border-[#333]">
              <HugeiconsIcon
                icon={Search01Icon}
                size={18}
                color={isDarkMode ? "#A1A1A1" : "#6B7280"}
              />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search by User Name..."
                placeholderTextColor={isDarkMode ? "#6B7280" : "#9CA3AF"}
                className="flex-1 ml-2 text-black dark:text-white font-poppins text-sm"
                autoFocus
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery("")}>
                  <Ionicons
                    name="close-circle"
                    size={20}
                    color={isDarkMode ? "#6B7280" : "#9CA3AF"}
                  />
                </TouchableOpacity>
              )}
            </View>
          </MotiView>
        )}
      </AnimatePresence>

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
          <View className="absolute top-[100px] right-3">
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

      {/* Filter Chips */}
      <View className="py-4">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="flex-row"
          contentContainerStyle={{ paddingHorizontal: 20 }}
        >
          {filters.map((filter) => {
            const isActive = activeFilter === filter;
            return (
              <TouchableOpacity
                key={filter}
                onPress={() => setActiveFilter(filter)}
                className={`px-6 py-2.5 rounded-3xl mr-3 border ${
                  isActive
                    ? "bg-[#E0E7FF] border-[#5B4CCC] dark:bg-[#1A1F3D] dark:border-[#5B4CCC]"
                    : "bg-[#F8F9FB] border-[#E0E5EB] dark:bg-[#000] dark:border-[#413E47]"
                }`}
              >
                <Text
                  className={`text-sm font-dmMedium ${
                    isActive
                      ? "text-[#5B4CCC]"
                      : "text-[#454545] dark:text-[#919191]"
                  }`}
                >
                  {filter}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Main Content */}
      <View className="flex-1 px-5">
        {loading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#5B4CCC" />
          </View>
        ) : filteredUsers.length === 0 ? (
          <View className="flex-1 justify-center items-center py-10">
            <Text className="text-[#8E8E8E] text-lg font-poppins italic">
              No users found
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredUsers}
            keyExtractor={(item) => item._id}
            renderItem={renderUserCard}
            contentContainerStyle={{ paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={["#5B4CCC"]}
              />
            }
          />
        )}
      </View>

      {/* Floating Action Button */}
      <TouchableOpacity
        onPress={() =>
          router.push(
            `/addProjectUser?projectId=${projectId}&projectName=${projectName}`,
          )
        }
        activeOpacity={0.9}
        className="absolute bottom-10 right-6 w-16 h-16 rounded-full bg-[#5B4CCC] items-center justify-center"
        style={{
          shadowColor: "#5B4CCC",
          shadowOffset: { width: 0, height: 15 },
          shadowOpacity: 0.5,
          shadowRadius: 20,
          elevation: 20,
        }}
      >
        <HugeiconsIcon icon={Add01Icon} size={32} color="white" />
      </TouchableOpacity>

      {/* Focused User / Delete Modal */}
      <Modal
        visible={!!focusedUser}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setFocusedUser(null)}
      >
        <View className="flex-1">
          <Pressable style={{ flex: 1 }} onPress={() => setFocusedUser(null)}>
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

          {focusedUser && focusedUser.layout && (
            <View
              style={{
                position: "absolute",
                top: focusedUser.layout.y,
                left: focusedUser.layout.x,
                width: focusedUser.layout.width,
              }}
            >
              <UserCard item={focusedUser} isFocused={true} />

              <TouchableOpacity
                onPress={handleConfirmDelete}
                activeOpacity={0.9}
                className="mt-4 flex-row items-center justify-center self-end bg-white dark:bg-[#1A1A1A] px-4 py-4 rounded-2xl "
                style={{
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.15,
                  shadowRadius: 12,
                  elevation: 5,
                }}
              >
                <HugeiconsIcon icon={Delete03Icon} size={22} color="#DF5B5B" />
                <Text className="ml-3 text-[#DF5B5B] font-dmBold text-base">
                  Remove User
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
};

export default UserList;
