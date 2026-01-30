// app/(drawer)/addProjectUsers.tsx
import { AuthContext } from "@/context/AuthContext";
import api from "@/lib/api";
import {
  ArrowLeft01Icon,
  Search01Icon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ActivityIndicator,
  FlatList,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { Dropdown } from "react-native-element-dropdown";
import Toast from "react-native-toast-message";

type DirectoryUser = {
  _id: string;
  individualName: string;
  firmName: string;
  emailList?: string[];
  role?: string;
  designation?: string;
  averageRating?: number;
  alreadyAdded?: boolean;
};

const roleOptions = [
  { label: "Vendor", value: "Vendor" },
  { label: "Consultant", value: "Consultant" },
  { label: "Client", value: "Client" },
];

const ITEM_HEIGHT = 80;

export default function AddProjectUsersPage() {
  const { projectId, projectName } = useLocalSearchParams();
  const auth = useContext(AuthContext);
  const token = auth?.token;
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";

  const [users, setUsers] = useState<DirectoryUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUsers, setSelectedUsers] = useState<
    { user: DirectoryUser; role: string }[]
  >([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  /* ------------------ DEBOUNCE SEARCH ------------------ */
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery), 250);
    return () => clearTimeout(t);
  }, [searchQuery]);

  /* ------------------ FETCH USERS ------------------ */
  const fetchUsers = useCallback(async () => {
    if (!token || !projectId) return;
    try {
      setLoading(true);
      const [allUsersRes, projectUsersRes] = await Promise.all([
        api.get("/user-directory", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        api.get(`/projects/${projectId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const projectUserIds = (
        projectUsersRes.data.project?.projectUsers || []
      ).map((u: any) => u.directoryUser._id);

      const usersWithStatus = allUsersRes.data.map((u: DirectoryUser) => ({
        ...u,
        alreadyAdded: projectUserIds.includes(u._id),
      }));

      setUsers(usersWithStatus);
    } catch (err) {
      console.error(err);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to fetch users",
        position: "bottom",
      });
    } finally {
      setLoading(false);
    }
  }, [projectId, token]);

  /* ------------------ FETCH ON FOCUS ------------------ */
  useFocusEffect(
    useCallback(() => {
      fetchUsers();
      setSelectedUsers([]);
    }, [fetchUsers]),
  );

  /* ------------------ SELECTION MAP ------------------ */
  const selectedUserMap = useMemo(() => {
    const map = new Map<string, { user: DirectoryUser; role: string }>();
    selectedUsers.forEach((u) => map.set(u.user._id, u));
    return map;
  }, [selectedUsers]);

  /* ------------------ FILTER USERS ------------------ */
  const filteredUsers = useMemo(() => {
    const q = debouncedQuery.toLowerCase();

    return users.filter((u) => {
      if (u.alreadyAdded) return false;

      const name = (u.individualName || "").toLowerCase();
      const firm = (u.firmName || "").toLowerCase();
      const email = (u.emailList?.[0] || "").toLowerCase();
      const designation = (u.designation || "").toLowerCase();

      return (
        name.includes(q) ||
        firm.includes(q) ||
        email.includes(q) ||
        designation.includes(q)
      );
    });
  }, [users, debouncedQuery]);

  /* ------------------ ACTIONS ------------------ */
  const toggleUserSelection = useCallback(
    (user: DirectoryUser) => {
      const exists = selectedUserMap.has(user._id);

      if (exists) {
        setSelectedUsers((prev) => prev.filter((u) => u.user._id !== user._id));
      } else {
        setSelectedUsers((prev) => [
          ...prev,
          { user, role: user.role || "Member" },
        ]);
      }
    },
    [selectedUserMap],
  );

  const updateUserRole = useCallback((userId: string, newRole: string) => {
    setSelectedUsers((prev) =>
      prev.map((u) => (u.user._id === userId ? { ...u, role: newRole } : u)),
    );
  }, []);

  /* ------------------ SUBMIT ------------------ */
  const handleSubmit = async () => {
    if (!selectedUsers.length) {
      return Toast.show({
        type: "error",
        text1: "Validation",
        text2: "Please select at least one user.",
        position: "bottom",
      });
    }

    try {
      const payload = {
        projectUsers: selectedUsers.map((u) => ({
          directoryUser: u.user._id,
          role: u.role,
        })),
      };

      await api.post(`/projects/${projectId}/add-users`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      Toast.show({
        type: "success",
        text1: "Success",
        text2: "Users added to project",
        position: "bottom",
      });

      router.back();
    } catch (err: any) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: err.response?.data?.message || "Something went wrong",
        position: "bottom",
      });
    }
  };

  /* ------------------ RENDER ITEM ------------------ */
  const renderItem = useCallback(
    ({ item }: { item: DirectoryUser }) => {
      const selectedUser = selectedUserMap.get(item._id);
      const isSelected = !!selectedUser;

      return (
        <TouchableOpacity
          onPress={() => toggleUserSelection(item)}
          className={`px-4 py-3 mb-3 rounded-xl flex-row items-center justify-between ${
            isDarkMode ? "bg-[#1A1A1A]" : "bg-[#F8F9FB]"
          }`}
          activeOpacity={0.7}
        >
          {/* Left Side: Info */}
          <View className="flex-1 pr-2">
            <Text
              className={`text-base font-dmBold mb-1 ${
                isDarkMode ? "text-white" : "text-black"
              }`}
              numberOfLines={1}
            >
              {item.individualName}
            </Text>
            <Text
              className={`text-sm font-poppins ${
                isDarkMode ? "text-[#919191]" : "text-[#454545]"
              }`}
              numberOfLines={1}
            >
              {item.designation || item.firmName || "N/A"}
            </Text>
          </View>

          {/* Right Side: Action (Dropdown + Checkbox) */}
          <View className="flex-row items-center gap-3">
            {isSelected && (
              <View className="w-28">
                <Dropdown
                  style={{
                    height: 32,
                    borderColor: isDarkMode ? "#333" : "#E0E5EB",
                    borderWidth: 1,
                    borderRadius: 8,
                    paddingHorizontal: 8,
                    backgroundColor: "transparent",
                  }}
                  placeholderStyle={{
                    fontSize: 12,
                    color: isDarkMode ? "#9ca3af" : "#6B7280",
                    fontFamily: "Poppins-Regular",
                  }}
                  selectedTextStyle={{
                    fontSize: 12,
                    color: isDarkMode ? "#FFF" : "#000",
                    fontFamily: "Poppins-Medium",
                  }}
                  containerStyle={{
                    borderRadius: 8,
                    borderColor: isDarkMode ? "#333" : "#E0E5EB",
                    backgroundColor: isDarkMode ? "#1A1A1A" : "#FFF",
                  }}
                  iconStyle={{ width: 20, height: 20 }}
                  activeColor={isDarkMode ? "#333" : "#E0E7FF"}
                  itemTextStyle={{
                    fontSize: 12,
                    color: isDarkMode ? "#FFF" : "#374151",
                    fontFamily: "Poppins-Regular",
                  }}
                  data={roleOptions}
                  labelField="label"
                  valueField="value"
                  placeholder="Select Role"
                  value={selectedUser?.role}
                  onChange={(roleItem) =>
                    updateUserRole(item._id, roleItem.value)
                  }
                />
              </View>
            )}

            {/* Custom Checkbox */}
            <View
              className={`w-6 h-6 rounded-md items-center justify-center border ${
                isSelected
                  ? "bg-[#5B4CCC] border-[#5B4CCC]"
                  : isDarkMode
                    ? "border-[#413E47]"
                    : "border-[#D1D5DB]"
              }`}
            >
              {isSelected && (
                <HugeiconsIcon
                  icon={Tick02Icon}
                  size={14}
                  color="white"
                  strokeWidth={3}
                />
              )}
            </View>
          </View>
        </TouchableOpacity>
      );
    },
    [selectedUserMap, toggleUserSelection, updateUserRole, isDarkMode],
  );

  /* ------------------ UI ------------------ */
  return (
    <View className="flex-1 bg-white dark:bg-black">
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />

      {/* Header */}
      <View className="pt-16 pb-3 px-5 flex-row items-center border-b border-transparent">
        <TouchableOpacity onPress={() => router.back()} className="w-10">
          <HugeiconsIcon
            icon={ArrowLeft01Icon}
            size={24}
            color={isDarkMode ? "#FFF" : "#000"}
          />
        </TouchableOpacity>
        <Text className="ml-1 text-xl font-dmBold text-black dark:text-white">
          Add to Directory
        </Text>
      </View>

      {/* Search Bar */}
      <View className="px-5 mb-4">
        <View className="flex-row items-center bg-[#F8F9FB] dark:bg-[#1A1A1A] rounded-xl px-4 py-1 border border-[#E0E5EB] dark:border-[#333]">
          <HugeiconsIcon
            icon={Search01Icon}
            size={20}
            color={isDarkMode ? "#A1A1A1" : "#6B7280"}
          />
          <TextInput
            className="flex-1 ml-3 text-black dark:text-white items-center justify-center font-poppins text-sm"
            placeholder="Search"
            // placeholderStyle={{ textAlign: "center" }}
            placeholderTextColor={isDarkMode ? "#6B7280" : "#9CA3AF"}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Content */}
      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#5B4CCC" />
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 140 }}
          initialNumToRender={12}
          maxToRenderPerBatch={10}
          windowSize={7}
          removeClippedSubviews
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View className="items-center justify-center mt-10">
              <Text className="text-[#8E8E8E] font-poppinsMedium text-base">
                No users found.
              </Text>
            </View>
          }
        />
      )}

      {/* Save Button */}
      <View className="absolute bottom-0 left-0 right-0 p-4 pb-12 bg-white dark:bg-black">
        <LinearGradient
          colors={["#5B4CCC", "#6347C2", "#8056D1"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ borderRadius: 12 }}
        >
          <TouchableOpacity
            onPress={handleSubmit}
            activeOpacity={0.8}
            className="py-4 items-center"
          >
            <Text className="text-white font-dmBold text-base">Save User</Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    </View>
  );
}
