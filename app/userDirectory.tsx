import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  Add01Icon,
  ArrowLeft01Icon,
  MoreHorizontalIcon,
  Search01Icon,
  UserAdd01Icon,
  Xsl01Icon,
  Pdf01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import * as FileSystem from "expo-file-system";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import React, { useContext, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
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
  const auth = useContext(AuthContext);
  const token = auth?.token;

  // Filter state
  const [activeFilter, setActiveFilter] = useState("All");
  const filters = ["All", "Client", "Vendor", "Consultant"];

  // Export menu state
  const [exportMenuVisible, setExportMenuVisible] = useState(false);
  const [excelLoading, setExcelLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  // Delete modal state
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<IUser | null>(null);

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

  const fetchUsers = async () => {
    if (!projectId || !token) return;

    try {
      setLoading(true);
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
    }
  };

  useEffect(() => {
    if (projectId && token) {
      fetchUsers();
    }
  }, [projectId, token]);

  const filteredUsers = useMemo(() => {
    if (activeFilter === "All") return users;
    return users.filter(
      (u) => u.role?.toLowerCase() === activeFilter.toLowerCase(),
    );
  }, [users, activeFilter]);

  const handleDeletePress = (user: IUser) => {
    setSelectedUser(user);
    setDeleteModalVisible(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedUser || !projectId || !token) return;

    try {
      setLoading(true);
      await api.delete(
        `/projects/${projectId}/project-users/${selectedUser._id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      Toast.show({
        type: "success",
        text1: "User Removed",
        text2: "The user has been removed from the project successfully.",
        position: "bottom",
      });

      setDeleteModalVisible(false);
      setSelectedUser(null);
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

  const renderUserCard = ({ item }: { item: IUser }) => (
    <View
      className="bg-[#F8F9FB] dark:bg-[#1A1A1A] rounded-2xl p-5 mb-4 shadow-sm"
      style={{ elevation: 2 }}
    >
      <View className="flex-row justify-between items-start mb-2">
        <Text className="text-lg font-dmBold text-black dark:text-white flex-1">
          {item.individualName} <Text className="text-[#8E8E8E]"> • </Text>{" "}
          <Text className="text-[#8E8E8E] font-dmMedium">{item.role}</Text>
        </Text>
        {/* Delete option could be in more menu, for now keeping handle for admin if needed */}
        {/* {auth?.user?.role === "admin" && (
          <TouchableOpacity onPress={() => handleDeletePress(item)}>
            <HugeiconsIcon
              icon={MoreVerticalIcon}
              size={20}
              color={isDarkMode ? "#919191" : "#454545"}
            />
          </TouchableOpacity>
        )} */}
      </View>

      <Text className="text-[#454545] dark:text-[#919191] text-sm font-poppins mb-1">
        {item.firmName} <Text className="text-[#8E8E8E]"> • </Text>{" "}
        {item.roleDescription}
      </Text>

      <Text className="text-[#454545] dark:text-[#919191] text-sm font-poppins mb-6">
        {item.designation}
      </Text>

      <View className="flex-row justify-between items-center border-t border-[#E0E5EB] dark:border-[#252525] pt-4">
        <TouchableOpacity
          onPress={() => item.email && Linking.openURL(`mailto:${item.email}`)}
          className="flex-1 mr-2"
        >
          <Text
            numberOfLines={1}
            className="text-[#3B82F6] text-sm font-dmMedium"
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
        >
          <Text className="text-[#3B82F6] text-sm font-dmMedium">
            {item.phone}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-white dark:bg-black">
      {/* Header */}
      <View className="pt-14 pb-4 px-5 flex-row items-center justify-between">
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
          <TouchableOpacity>
            <HugeiconsIcon
              icon={Search01Icon}
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

      {/* Export Menu Modal */}
      <Modal
        transparent={true}
        visible={exportMenuVisible}
        animationType="fade"
        onRequestClose={() => setExportMenuVisible(false)}
      >
        <Pressable
          className="flex-1"
          onPress={() => setExportMenuVisible(false)}
        >
          <View className="absolute top-[50px] right-3">
            {/* Menu Container */}
            <View
              className="bg-white dark:bg-[#1A1A1A] rounded-2xl p-2 w-[190px] shadow"
              style={{
                elevation: 15,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.1,
                shadowRadius: 20,
              }}
            >
              {/* Triangle Pointer (Merged) */}
              <View
                className="absolute right-4 -top-1.5 w-4 h-4 bg-white dark:bg-[#1A1A1A] rounded rotate-45"
                style={{
                  zIndex: -1,
                }}
              />

              <TouchableOpacity
                onPress={handleDownloadPDF}
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
        </Pressable>
      </Modal>

      {/* Filter Chips */}
      <View className="px-5 py-4">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="flex-row"
        >
          {filters.map((filter) => {
            const isActive = activeFilter === filter;
            return (
              <TouchableOpacity
                key={filter}
                onPress={() => setActiveFilter(filter)}
                className={`px-6 py-2.5 rounded-2xl mr-3 border ${
                  isActive
                    ? "bg-[#E0E7FF] border-[#5B4CCC] dark:bg-[#1A1F3D] dark:border-[#5B4CCC]"
                    : "bg-[#F8F9FB] border-[#E0E5EB] dark:bg-[#121212] dark:border-[#252525]"
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
        className="absolute bottom-10 right-6 w-16 h-16 rounded-full bg-[#5B4CCC] items-center justify-center shadow-lg"
        style={{ elevation: 8 }}
      >
        <HugeiconsIcon icon={Add01Icon} size={32} color="white" />
      </TouchableOpacity>

      {/* Delete Confirmation Modal */}
      <Modal
        transparent={true}
        visible={deleteModalVisible}
        animationType="fade"
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View
          className="flex-1 justify-center items-center px-6"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <View className="bg-white dark:bg-[#1A1A1A] rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <Text className="text-xl font-dmBold mb-3 text-black dark:text-white">
              Remove User
            </Text>
            <Text className="mb-6 text-[#454545] dark:text-[#919191] font-poppins">
              Are you sure you want to remove{" "}
              <Text className="font-dmBold text-black dark:text-white">
                {selectedUser?.individualName}
              </Text>{" "}
              from this project?
            </Text>

            <View className="flex-row justify-end gap-4">
              <TouchableOpacity
                onPress={() => setDeleteModalVisible(false)}
                className="px-6 py-2.5 rounded-xl bg-gray-100 dark:bg-[#252525]"
              >
                <Text className="text-gray-700 dark:text-[#919191] font-dmBold">
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleConfirmDelete}
                className="px-6 py-2.5 rounded-xl bg-red-600"
              >
                <Text className="text-white font-dmBold">Remove</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default UserList;
