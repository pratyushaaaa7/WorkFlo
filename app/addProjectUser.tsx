// app/(drawer)/addProjectUsers.tsx
import React, {
  useEffect,
  useState,
  useContext,
  useMemo,
  useCallback,
} from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Pressable,
  TextInput,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Checkbox } from "react-native-paper";
import { Dropdown } from "react-native-element-dropdown";
import { AuthContext } from "@/context/AuthContext";
import api from "@/lib/api";
import Toast from "react-native-toast-message";
import { Ionicons } from "@expo/vector-icons";

type DirectoryUser = {
  _id: string;
  individualName: string;
  firmName: string;
  emailList?: string[];
  role?: string;
  averageRating?: number;
  alreadyAdded?: boolean;
};

const roleOptions = [
  { label: "Vendor", value: "Vendor" },
  { label: "Consultant", value: "Consultant" },
  { label: "Client", value: "Client" },
];

const ITEM_HEIGHT = 92;

export default function AddProjectUsersPage() {
  const { projectId } = useLocalSearchParams();
  const auth = useContext(AuthContext);
  const token = auth?.token;
  const router = useRouter();

  const [users, setUsers] = useState<DirectoryUser[]>([]);
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
  useEffect(() => {
    const fetchUsers = async () => {
      try {
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
      } catch {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Failed to fetch users",
          position: "bottom",
        });
      }
    };

    fetchUsers();
  }, []);

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

      return name.includes(q) || firm.includes(q) || email.includes(q);
    });
  }, [users, debouncedQuery]);

  /* ------------------ ACTIONS ------------------ */
  const toggleUserSelection = useCallback(
    (user: DirectoryUser) => {
      const exists = selectedUserMap.has(user._id);

      if (exists) {
        setSelectedUsers((prev) =>
          prev.filter((u) => u.user._id !== user._id)
        );
      } else {
        setSelectedUsers((prev) => [
          ...prev,
          { user, role: user.role || "Member" },
        ]);
      }
    },
    [selectedUserMap]
  );

  const updateUserRole = useCallback((userId: string, newRole: string) => {
    setSelectedUsers((prev) =>
      prev.map((u) =>
        u.user._id === userId ? { ...u, role: newRole } : u
      )
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
          className="bg-white px-4 py-3 mb-3 rounded-2xl"
          activeOpacity={0.9}
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-1 pr-3">
              <Text className="font-semibold text-gray-900 text-base" numberOfLines={1}>
                {item.individualName || item.firmName}
                {item.individualName && item.firmName && (
                  <Text className="text-gray-500 font-normal text-sm">
                    {" "}• {item.firmName}
                  </Text>
                )}
              </Text>

              <View className="flex-row items-center mt-1">
                {item.averageRating && item.averageRating > 0 ? (
                  <>
                    {[...Array(5)].map((_, i) => {
                      const filled = Math.floor(item.averageRating!);
                      const half = item.averageRating! - filled >= 0.5;

                      return (
                        <Ionicons
                          key={i}
                          size={16}
                          color="#FACC15"
                          name={
                            i < filled
                              ? "star"
                              : i === filled && half
                              ? "star-half"
                              : "star-outline"
                          }
                        />
                      );
                    })}
                    <Text className="ml-2 text-gray-700 text-sm font-semibold">
                      {item.averageRating.toFixed(1)} / 5
                    </Text>
                  </>
                ) : (
                  <Text className="text-gray-400 text-sm italic">
                    No rating available
                  </Text>
                )}
              </View>
            </View>

            {isSelected && (
              <View className="w-32 mr-3">
                <Dropdown
                  style={{
                    height: 36,
                    borderColor: "#E2E8F0",
                    borderWidth: 1,
                    borderRadius: 8,
                    paddingHorizontal: 6,
                  }}
                  placeholderStyle={{ fontSize: 12, color: "#9CA3AF" }}
                  selectedTextStyle={{ fontSize: 12, color: "#111827" }}
                  containerStyle={{ borderRadius: 8, borderColor: "#E2E8F0" }}
                  activeColor="#E0E7FF"
                  itemTextStyle={{ fontSize: 12, color: "#374151" }}
                  data={roleOptions}
                  labelField="label"
                  valueField="value"
                  placeholder="Role"
                  value={selectedUser?.role}
                  onChange={(roleItem) =>
                    updateUserRole(item._id, roleItem.value)
                  }
                />
              </View>
            )}

            <Checkbox
              status={isSelected ? "checked" : "unchecked"}
              onPress={() => toggleUserSelection(item)}
              color="#4F46E5"
            />
          </View>
        </TouchableOpacity>
      );
    },
    [selectedUserMap, toggleUserSelection, updateUserRole]
  );

  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: ITEM_HEIGHT,
      offset: ITEM_HEIGHT * index,
      index,
    }),
    []
  );

  /* ------------------ UI ------------------ */
  return (
    <View className="flex-1 bg-gray-50">
      <View className="pt-16 px-4 pb-4 bg-white shadow-sm">
        <Pressable onPress={() => router.back()} className="flex-row items-center">
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
          <Text className="ml-4 text-xl font-semibold text-[#1E293B]">
            Add contact to directory
          </Text>
        </Pressable>
      </View>

      <View className="flex-row items-center bg-white mx-4 my-3 px-3 py-2 rounded-xl shadow-lg">
        <Ionicons name="search" size={18} color="#6B7280" />
        <TextInput
          className="flex-1 ml-2 text-gray-800"
          placeholder="Search users..."
          placeholderTextColor="#777"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }}
        initialNumToRender={12}
        maxToRenderPerBatch={10}
        windowSize={7}
        removeClippedSubviews
        getItemLayout={getItemLayout}
        renderItem={renderItem}
      />

      <View className="absolute bottom-0 left-0 right-0 p-2 bg-white shadow-lg">
        <TouchableOpacity
          onPress={handleSubmit}
          className="bg-indigo-600 py-4 mb-12 rounded-2xl"
        >
          <Text className="text-white text-center font-bold text-lg">
            Save Users
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
