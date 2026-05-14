import {
  ArrowLeft01Icon,
  Briefcase05Icon,
  Calendar03Icon,
  Cancel01Icon,
  CheckUnread04Icon,
  Delete02Icon,
  File02Icon,
  KeyframesMultipleIcon,
  Note03Icon,
  ProfileIcon,
  Search01Icon,
  Settings01Icon,
  Tick02Icon,
  TickDouble02Icon
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import * as Haptics from "expo-haptics";

import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  RefreshControl,
  StatusBar,
  Text,
  TouchableOpacity,
  useColorScheme,
  View
} from "react-native";
import DeleteConfirmationModal from "../components/DeleteConfirmationModal";
import { useAuth } from "../context/AuthContext";
import api from "../lib/api";

dayjs.extend(relativeTime);

// Type definition for item
interface NotificationItem {
  _id: string;
  type: string;
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
  navigation?: {
    screen?: string;
    params?: any;
  };
}

const NotificationsScreen = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // Selection Mode State
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const router = useRouter();
  const { token } = useAuth();
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";

  const fetchNotifications = async (isReset = false) => {
    try {
      if (isReset) {
        setLoading(true);
        setHasMore(true);
        setCursor(null);
      } else if (loadingMore || !hasMore) {
        return;
      } else {
        setLoadingMore(true);
      }

      const currentCursor = isReset ? "" : cursor || "";
      const response = await api.get(
        `/notifications?limit=20&cursor=${currentCursor}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      const { notifications: newItems, nextCursor } = response.data;
      console.log("[DEBUG] Notifications Fetched:", {
        count: newItems?.length,
        isNewItemsArray: Array.isArray(newItems),
      });

      setNotifications((prev) => (isReset ? (newItems || []) : [...(prev || []), ...(newItems || [])]));
      setCursor(nextCursor);
      setHasMore(!!nextCursor);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (token) fetchNotifications(true);
  }, [token]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchNotifications(true);
  }, [token]);

  const handleLoadMore = () => {
    if (!loading && !loadingMore && hasMore) {
      fetchNotifications(false);
    }
  };

  const updateBadgeCount = async () => {
    if (Platform.OS === "web") return;
    try {
      const presented = await Notifications.getPresentedNotificationsAsync();
      await Notifications.setBadgeCountAsync(presented.length);
    } catch (error) {
      console.error("Failed to update badge count:", error);
    }
  };

  const dismissMatchingNotification = async (item: NotificationItem) => {
    if (Platform.OS === "web") return;
    try {
      const presented = await Notifications.getPresentedNotificationsAsync();
      const match = presented.find(
        (n) =>
          n.request.content.title === item.title &&
          n.request.content.body === item.message,
      );
      if (match) {
        await Notifications.dismissNotificationAsync(match.request.identifier);
        await updateBadgeCount();
      }
    } catch (error) {
      console.error("Error dismissing notification:", error);
    }
  };

  const handlePress = async (item: NotificationItem) => {
    if (selectionMode) {
      toggleSelection(item._id);
      return;
    }

    if (!item.isRead) {
      try {
        await api.patch(
          `/notifications/${item._id}/read`,
          {},
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        setNotifications((prev) =>
          (prev || []).map((n) => (n._id === item._id ? { ...n, isRead: true } : n)),
        );
        dismissMatchingNotification(item);
      } catch (error) {
        console.error("Error marking as read:", error);
      }
    }

    if (item.navigation?.screen) {
      router.push({
        pathname: `/${item.navigation.screen}` as any,
        params: item.navigation?.params,
      });
    }
  };

  const onLongPress = (item: NotificationItem) => {
    if (!selectionMode) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setSelectionMode(true);
      toggleSelection(item._id);
    }
  };

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(new Set(newSelected));
    if (newSelected.size > 0) {
      Haptics.selectionAsync();
    }
    if (newSelected.size === 0) setSelectionMode(false);
  };

  const handleBatchDelete = () => {
    setIsDeleteModalVisible(true);
  };

  const confirmBatchDelete = async () => {
    try {
      setDeleteLoading(true);
      const idsArray = Array.from(selectedIds);
      const deletedNotifications = notifications.filter((n) =>
        selectedIds.has(n._id),
      );
      await api.delete("/notifications", {
        data: { ids: idsArray },
        headers: { Authorization: `Bearer ${token}` },
      });

      // Dismiss from system tray
      for (const n of deletedNotifications) {
        await dismissMatchingNotification(n);
      }

      setNotifications((prev) => (prev || []).filter((n) => !selectedIds.has(n._id)));
      setSelectionMode(false);
      setSelectedIds(new Set());
      setIsDeleteModalVisible(false);
    } catch (error) {
      console.error("Error deleting:", error);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleBatchMarkStatus = async (markAsRead: boolean) => {
    try {
      const idsArray = Array.from(selectedIds);
      const endpoint = markAsRead ? "read" : "unread";

      await Promise.all(
        (idsArray || [])?.map((id) =>
          api.patch(
            `/notifications/${id}/${endpoint}`,
            {},
            {
              headers: { Authorization: `Bearer ${token}` },
            },
          ),
        ),
      );

      if (markAsRead) {
        const markedItems = notifications.filter((n) => selectedIds.has(n._id));
        for (const n of markedItems) {
          await dismissMatchingNotification(n);
        }
      }

      setNotifications((prev) =>
        (prev || []).map((n) =>
          selectedIds.has(n._id) ? { ...n, isRead: markAsRead } : n,
        ),
      );
      setSelectionMode(false);
      setSelectedIds(new Set());
    } catch (error) {
      console.error(
        `Error marking as ${markAsRead ? "read" : "unread"}:`,
        error,
      );
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "MOM_ASSIGNED":
        return Calendar03Icon;
      case "DPR_SUBMITTED":
      case "SVR_SUBMITTED":
        return File02Icon;
      case "STAGE_UPDATED":
        return KeyframesMultipleIcon;
      case "PROJECT_ASSIGNED":
        return Briefcase05Icon;
      case "NOTES_ASSIGNED":
        return Note03Icon;
      case "ILR_ASSIGNED":
      case "ILR_PUBLISHED":
        return ProfileIcon;
      case "GLOBAL_WELCOME":
        return ProfileIcon;
      case "SUPPORT_TICKET_RAISED":
      case "SUPPORT_TICKET_CLOSED":
        return Note03Icon;
      case "AGENDA_SUBMITTED":
        return Calendar03Icon;
      default:
        return Note03Icon;
    }
  };

  const renderItem = ({ item }: { item: NotificationItem }) => {
    const IconComponent = getIcon(item.type);
    const isSelected = selectedIds.has(item._id);
    const isUnread = !item.isRead;

    const cardBgClass = isSelected
      ? "bg-[#D7DEF2] dark:bg-[#11162F]"
      : isUnread
        ? "bg-[#F1F1F1] dark:bg-[#121212]"
        : "bg-[#FBFCFD] dark:bg-[#000000]";

    const iconBgClass = isSelected
      ? "bg-[#566FEC] border-transparent"
      : isUnread
        ? "bg-[#E6E6E6] dark:bg-[#1A1A1A] border-transparent"
        : "bg-[#F0F3F7] dark:bg-[#1A1A1A] border-[#E0E5EB] dark:border-transparent";

    const iconColor = isSelected || isDarkMode
      ? "#FFFFFF"
      : "#454545";

    return (
      <TouchableOpacity
        className={`flex-row p-4 py-5 items-start mb-3 ${cardBgClass}`}
        onPress={() => handlePress(item)}
        onLongPress={() => onLongPress(item)}
        delayLongPress={200}
        activeOpacity={0.7}
      >
        <View
          className={`w-11 h-11 rounded-[8px] border justify-center items-center mr-3.5 ${iconBgClass}`}
        >
          {isSelected ? (
            <HugeiconsIcon icon={Tick02Icon} size={24} color="white" />
          ) : (
            <HugeiconsIcon
              icon={IconComponent}
              size={24}
              color={iconColor}
            />
          )}
        </View>

        <View className="flex-1 ">
          <View className="flex-row items-start mb-0.5">
            <Text
              className="text-[16px] font-poppinsMedium text-black dark:text-white flex-1"
              numberOfLines={1}
            >
              {item.title}
            </Text>
            {isUnread && (
              <View className="w-2 h-2 rounded-full bg-[#DF5B5B] ml-1.5 mt-1.5" />
            )}
          </View>
          <Text
            className="text-[14px] font-poppins text-[#454545] dark:text-[#BBBBBB] leading-[20px] mb-1"
            numberOfLines={2}
          >
            {item.message}
          </Text>
          <Text className="text-[12px] font-poppins text-[#454545] dark:text-[#919191]">
            {dayjs(item.createdAt).fromNow()}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View className="flex-1 bg-[#FBFCFD] dark:bg-black">
      <StatusBar
        barStyle={isDarkMode ? "light-content" : "dark-content"}
        translucent
        backgroundColor="transparent"
      />

      <View className="pt-14 px-4 pb-4 flex-row items-center justify-between">
        {selectionMode ? (
          <View className="flex-row items-center justify-between flex-1">
            <View className="flex-row items-center">
              <TouchableOpacity
                onPress={() => {
                  setSelectionMode(false);
                  setSelectedIds(new Set());
                }}
                className="mr-4"
              >
                <HugeiconsIcon
                  icon={Cancel01Icon}
                  size={24}
                  color={isDarkMode ? "#fff" : "#2D3436"}
                />
              </TouchableOpacity>
              <Text className="text-[20px] font-dmSemiBold text-[#000] dark:text-white">
                {selectedIds.size} Selected
              </Text>
            </View>

            <View className="flex-row items-center gap-4">
              <TouchableOpacity onPress={() => handleBatchMarkStatus(true)}>
                <HugeiconsIcon
                  icon={TickDouble02Icon}
                  size={24}
                  color={isDarkMode ? "#fff" : "#454545"}
                />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleBatchMarkStatus(false)}>
                <HugeiconsIcon
                  icon={CheckUnread04Icon}
                  size={24}
                  color={isDarkMode ? "#fff" : "#454545"}
                />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleBatchDelete}>
                <HugeiconsIcon icon={Delete02Icon} size={24} color="#FF4D4D" />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View className="flex-row items-center justify-between flex-1">
            <View className="flex-row items-center">
              <TouchableOpacity onPress={() => router.back()} className="mr-4">
                <HugeiconsIcon
                  icon={ArrowLeft01Icon}
                  size={24}
                  color={isDarkMode ? "#fff" : "#2D3436"}
                />
              </TouchableOpacity>
              <Text className="text-[20px] font-dmSemiBold text-[#000] dark:text-white">
                Notifications
              </Text>
            </View>

            <View className="flex-row items-center gap-2">
              <TouchableOpacity className="p-1">
                <HugeiconsIcon
                  icon={Search01Icon}
                  size={24}
                  color={isDarkMode ? "#D2D2D2" : "#454545"}
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() =>
                  api
                    .patch(
                      "/notifications/read-all",
                      {},
                      { headers: { Authorization: `Bearer ${token}` } },
                    )
                    .then(() => {
                      if (Platform.OS !== "web") {
                        Notifications.dismissAllNotificationsAsync();
                        Notifications.setBadgeCountAsync(0);
                      }
                      fetchNotifications(true);
                    })
                }
                className="p-1"
              >
                <HugeiconsIcon
                  icon={TickDouble02Icon}
                  size={24}
                  color={isDarkMode ? "#D2D2D2" : "#454545"}
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push("/notificationPreferences")}
                className="p-1"
              >
                <HugeiconsIcon
                  icon={Settings01Icon}
                  size={24}
                  color={isDarkMode ? "#D2D2D2" : "#454545"}
                />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      <FlatList
        data={Array.isArray(notifications) ? notifications : []}
        keyExtractor={(item) => (item?._id ? item._id : Math.random().toString())}
        renderItem={renderItem}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          !loading && (
            <View className="flex-1 items-center mt-24">
              <Text className="text-[#9CA3AF] font-poppins">
                No notifications yet
              </Text>
            </View>
          )
        }
        ListFooterComponent={
          loadingMore ? <ActivityIndicator className="p-5" /> : null
        }
        contentContainerStyle={{ paddingHorizontal: 0, paddingBottom: 30 }}
      />

      <DeleteConfirmationModal
        isVisible={isDeleteModalVisible}
        onClose={() => setIsDeleteModalVisible(false)}
        onConfirm={confirmBatchDelete}
        loading={deleteLoading}
        title="Delete Notifications"
        message={`Are you sure you want to delete ${selectedIds.size} notification(s)?\nThis action is final`}
      />
    </View>
  );
};

export default NotificationsScreen;
