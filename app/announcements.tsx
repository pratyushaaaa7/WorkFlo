import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  useColorScheme,
  Dimensions,
  ActivityIndicator,
  Modal,
  RefreshControl,
  StatusBar,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useNavigation, useRouter } from "expo-router";
import {
  Menu02Icon,
  Add01Icon,
  Cancel01Icon,
  Delete02Icon,
  Megaphone01Icon,
  GiftIcon,
  CheckmarkCircle02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { LinearGradient } from "expo-linear-gradient";
import Toast from "react-native-toast-message";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

import { useAuth } from "../context/AuthContext";
import api from "../lib/api";
import GlobalAvatar from "../components/GlobalAvatar";
import DeleteConfirmationModal from "../components/DeleteConfirmationModal";

dayjs.extend(relativeTime);

const { width } = Dimensions.get("window");

// Announcement presets
const GRADIENT_PRESETS: Record<string, string[]> = {
  indigo: ["#6366F1", "#8B5CF6"],
  sunset: ["#FF5E62", "#FF9966"],
  emerald: ["#10B981", "#059669"],
  ruby: ["#EF4444", "#991B1B"],
  ocean: ["#0ea5e9", "#2563eb"],
};

const Announcements = () => {
  const router = useRouter();
  const navigation = useNavigation();
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";
  const { token, user } = useAuth();

  const [adminAnnouncements, setAdminAnnouncements] = useState<any[]>([]);
  const [celebrations, setCelebrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Post Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedPreset, setSelectedPreset] = useState("indigo");
  const [posting, setPosting] = useState(false);

  // Delete States
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Theme Colors
  const colors = {
    background: isDarkMode ? "#000000" : "#FFFFFF",
    cardBg: isDarkMode ? "#0D0D0D" : "#F8F9FB",
    textPrimary: isDarkMode ? "#FFFFFF" : "#000000",
    textSecondary: isDarkMode ? "#9BA1A6" : "#6B7280",
    accent: "#5B4CCC",
    borderColor: isDarkMode ? "#1C1C1C" : "#EBEBEB",
    inputBg: isDarkMode ? "#121212" : "#F3F4F6",
  };

  const fetchAnnouncements = async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      const res = await api.get("/announcements", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAdminAnnouncements(res.data.adminAnnouncements || []);
      setCelebrations(res.data.celebrations || []);
    } catch (err) {
      console.error("Error fetching announcements:", err);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to load announcements",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchAnnouncements();
    }
  }, [token]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAnnouncements(true);
  }, [token]);

  const handleCreateAnnouncement = async () => {
    if (!title.trim() || !content.trim()) {
      Toast.show({
        type: "error",
        text1: "Missing Fields",
        text2: "Please enter both a title and content",
      });
      return;
    }

    try {
      setPosting(true);
      const res = await api.post(
        "/announcements",
        {
          title: title.trim(),
          content: content.trim(),
          image: selectedPreset, // Saving gradient preset key in the image field
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      Toast.show({
        type: "success",
        text1: "Success",
        text2: "Announcement posted successfully",
      });

      // Reset Form and close modal
      setTitle("");
      setContent("");
      setSelectedPreset("indigo");
      setIsModalOpen(false);

      // Refresh list
      fetchAnnouncements(true);
    } catch (err: any) {
      console.error("Error creating announcement:", err);
      Toast.show({
        type: "error",
        text1: "Failed to post",
        text2: err.response?.data?.message || "Internal server error",
      });
    } finally {
      setPosting(false);
    }
  };

  const handleDeleteAnnouncement = async () => {
    if (!deletingId) return;

    try {
      setDeleting(true);
      await api.delete(`/announcements/${deletingId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      Toast.show({
        type: "success",
        text1: "Success",
        text2: "Announcement deleted successfully",
      });

      setIsDeleteModalOpen(false);
      setDeletingId(null);
      fetchAnnouncements(true);
    } catch (err: any) {
      console.error("Error deleting announcement:", err);
      Toast.show({
        type: "error",
        text1: "Failed to delete",
        text2: err.response?.data?.message || "Could not complete request",
      });
    } finally {
      setDeleting(false);
    }
  };

  const openDeleteConfirm = (id: string) => {
    setDeletingId(id);
    setIsDeleteModalOpen(true);
  };

  const renderCelebrationCard = (item: any) => {
    const isBirthday = item.type === "birthday";
    const gradient = isBirthday 
      ? ["#FA709A", "#FEE140"] // Soft pinky-yellow birthday gradient
      : ["#F6D365", "#FDA085"]; // Amber gold work anniversary gradient

    return (
      <LinearGradient
        key={item._id}
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.celebrationCard}
        className="mr-4 p-5 rounded-[24px] justify-between relative overflow-hidden"
      >
        {/* Glowing visual overlay for today */}
        {item.isToday && (
          <View style={styles.todayTag} className="absolute top-4 right-4 bg-white/30 px-3 py-1 rounded-full border border-white/40">
            <Text className="text-white text-[10px] font-poppinsMedium uppercase tracking-wider">Today</Text>
          </View>
        )}

        <View className="flex-row items-center">
          <GlobalAvatar
            name={item.user.fullName}
            uri={item.user.profileImage}
            size={56}
            borderRadius={18}
            fontSize={18}
            style={{ borderWidth: 3, borderColor: "rgba(255,255,255,0.6)" }}
          />
          <View className="ml-3.5 flex-1">
            <Text className="text-white font-poppinsMedium text-[11px] uppercase tracking-widest opacity-90">
              {isBirthday ? "🎉 Birthday" : "🎖️ Anniversary"}
            </Text>
            <Text className="text-white font-dmBold text-lg leading-tight" numberOfLines={1}>
              {item.user.fullName}
            </Text>
            <Text className="text-white/80 font-poppins text-xs" numberOfLines={1}>
              {item.user.designation || "Team Member"}
            </Text>
          </View>
        </View>

        <View className="mt-4">
          <Text className="text-white font-dmBold text-base mb-1" numberOfLines={1}>
            {item.title}
          </Text>
          <Text className="text-white/95 font-poppins text-[13px] leading-[18px]" numberOfLines={2}>
            {item.content}
          </Text>
        </View>

        <View className="flex-row justify-between items-center mt-3 pt-3 border-t border-white/20">
          <Text className="text-white/85 font-poppinsMedium text-xs">
            {isBirthday ? "🎂 Happy Birthday!" : `🎖️ Completed ${item.years} ${item.years === 1 ? 'Year' : 'Years'}!`}
          </Text>
          <Text className="text-white/90 font-poppinsSemiBold text-xs bg-white/20 px-2.5 py-0.5 rounded-full">
            {dayjs(item.date).format("MMM DD")}
          </Text>
        </View>
      </LinearGradient>
    );
  };

  const renderAnnouncementCard = (item: any) => {
    const isGradient = !!GRADIENT_PRESETS[item.image];
    const cardColors = GRADIENT_PRESETS[item.image] || ["#F8F9FB", "#F8F9FB"];
    const textThemeColor = isGradient ? "#FFFFFF" : colors.textPrimary;
    const textSecondaryThemeColor = isGradient ? "rgba(255,255,255,0.75)" : colors.textSecondary;
    const borderStyle = isGradient ? {} : { borderWidth: 1, borderColor: colors.borderColor };

    const CardContainer = isGradient ? LinearGradient : View;
    const extraProps = isGradient 
      ? { colors: cardColors, start: { x: 0, y: 0 }, end: { x: 1, y: 1 } }
      : { style: { backgroundColor: colors.cardBg } };

    return (
      <CardContainer
        key={item._id}
        {...extraProps}
        style={[styles.announcementCard, borderStyle]}
        className="mb-4 p-5 rounded-[24px]"
      >
        {/* Header (Author + Actions) */}
        <View className="flex-row justify-between items-center mb-4">
          <View className="flex-row items-center">
            <GlobalAvatar
              name={item.author?.fullName || "Admin"}
              uri={item.author?.profileImage}
              size={42}
              borderRadius={14}
              fontSize={14}
              style={isGradient ? { borderWidth: 1.5, borderColor: "rgba(255,255,255,0.5)" } : {}}
            />
            <View className="ml-3">
              <Text style={{ color: textThemeColor }} className="font-dmSemiBold text-sm leading-tight">
                {item.author?.fullName || "System Admin"}
              </Text>
              <Text style={{ color: textSecondaryThemeColor }} className="font-poppins text-xs">
                {item.author?.designation || "Administrator"} • {dayjs(item.createdAt).fromNow()}
              </Text>
            </View>
          </View>

          {/* Delete Action for Admin */}
          {user?.role === "admin" && (
            <TouchableOpacity 
              onPress={() => openDeleteConfirm(item._id)}
              className="p-2 rounded-full bg-white/10"
              style={!isGradient ? { backgroundColor: isDarkMode ? "#1A1A1A" : "#ECECEC" } : {}}
            >
              <HugeiconsIcon
                icon={Delete02Icon}
                size={18}
                color={isGradient ? "#FFFFFF" : "#EF4444"}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Content */}
        <View className="flex-1">
          <Text style={{ color: textThemeColor }} className="font-dmBold text-lg mb-2">
            {item.title}
          </Text>
          <Text style={{ color: textThemeColor }} className="font-poppins text-[14px] leading-relaxed opacity-95">
            {item.content}
          </Text>
        </View>
      </CardContainer>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }} className="pt-14">
      <StatusBar
        barStyle={isDarkMode ? "light-content" : "dark-content"}
        translucent
        backgroundColor="transparent"
      />

      {/* Header */}
      <View className="flex-row items-center justify-between px-6 pb-4 border-b border-gray-100 dark:border-gray-900">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => (navigation as any).openDrawer()} className="mr-3">
            <HugeiconsIcon icon={Menu02Icon} size={28} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={{ color: colors.textPrimary }} className="text-2xl font-dmBold">
            Announcements
          </Text>
        </View>

        {/* Add Announcement (Admin Only) */}
        {user?.role === "admin" && (
          <TouchableOpacity
            onPress={() => setIsModalOpen(true)}
            style={{ backgroundColor: colors.accent }}
            className="flex-row items-center px-4 py-2 rounded-full"
          >
            <HugeiconsIcon icon={Add01Icon} size={18} color="white" />
            <Text className="text-white font-poppinsMedium text-xs ml-1.5">Post</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator color={colors.accent} size="large" />
          <Text style={{ color: colors.textSecondary }} className="font-poppins text-sm mt-3">
            Loading announcements...
          </Text>
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.accent]} />
          }
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {/* Celebrations Section */}
          {celebrations.length > 0 && (
            <View className="pt-5">
              <View className="px-6 flex-row justify-between items-center mb-3">
                <View>
                  <Text style={{ color: colors.textPrimary }} className="text-lg font-dmBold">
                    Celebrations This Month 🎉
                  </Text>
                  <Text style={{ color: colors.textSecondary }} className="text-[11px] font-poppins">
                    Birthdays & work milestones for our team
                  </Text>
                </View>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 8 }}
              >
                {celebrations.map((item) => renderCelebrationCard(item))}
              </ScrollView>
            </View>
          )}

          {/* General Announcements Feed */}
          <View className="px-6 pt-5">
            <Text style={{ color: colors.textPrimary }} className="text-lg font-dmBold mb-4">
              General Feed 📣
            </Text>

            {adminAnnouncements.length > 0 ? (
              adminAnnouncements.map((item) => renderAnnouncementCard(item))
            ) : (
              <View style={{ backgroundColor: colors.cardBg }} className="items-center justify-center py-12 px-6 rounded-3xl mt-2">
                <HugeiconsIcon icon={Megaphone01Icon} size={48} color={colors.textSecondary} />
                <Text style={{ color: colors.textPrimary }} className="font-dmSemiBold text-base mt-4">
                  No announcements yet
                </Text>
                <Text style={{ color: colors.textSecondary }} className="font-poppins text-xs text-center mt-1.5 max-w-[200px]">
                  When the administrator posts updates, they will appear here.
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      )}

      {/* CREATE ANNOUNCEMENT MODAL (Admin Only) */}
      <Modal
        visible={isModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsModalOpen(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          <View className="flex-1 bg-black/60 justify-end">
            <View 
              style={{ backgroundColor: isDarkMode ? "#0A0A0A" : "#FFFFFF" }}
              className="rounded-t-[32px] p-6 max-h-[90%] border-t border-white/10"
            >
              {/* Modal Header */}
              <View className="flex-row justify-between items-center mb-6">
                <Text style={{ color: colors.textPrimary }} className="text-xl font-dmBold">
                  Post New Announcement
                </Text>
                <TouchableOpacity 
                  onPress={() => setIsModalOpen(false)}
                  className="p-2 rounded-full"
                  style={{ backgroundColor: colors.inputBg }}
                >
                  <HugeiconsIcon icon={Cancel01Icon} size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} className="mb-4">
                {/* Announcement Title */}
                <Text style={{ color: colors.textSecondary }} className="font-poppinsMedium text-xs uppercase mb-2">
                  Title
                </Text>
                <TextInput
                  placeholder="Enter a catchy title..."
                  placeholderTextColor={colors.textSecondary}
                  value={title}
                  onChangeText={setTitle}
                  style={{ color: colors.textPrimary, backgroundColor: colors.inputBg }}
                  className="px-4 py-3.5 rounded-2xl font-poppins text-sm mb-4 border border-transparent focus:border-indigo-500"
                />

                {/* Announcement Content */}
                <Text style={{ color: colors.textSecondary }} className="font-poppinsMedium text-xs uppercase mb-2">
                  Content
                </Text>
                <TextInput
                  placeholder="What would you like to announce to the team?..."
                  placeholderTextColor={colors.textSecondary}
                  value={content}
                  onChangeText={setContent}
                  multiline={true}
                  numberOfLines={5}
                  textAlignVertical="top"
                  style={{ color: colors.textPrimary, backgroundColor: colors.inputBg, height: 120 }}
                  className="px-4 py-3.5 rounded-2xl font-poppins text-sm mb-4 border border-transparent focus:border-indigo-500"
                />

                {/* Banner Gradient Presets */}
                <Text style={{ color: colors.textSecondary }} className="font-poppinsMedium text-xs uppercase mb-2.5">
                  Card Style Preset
                </Text>
                <View className="flex-row items-center mb-6">
                  {/* Clean Glassmorphic preset option */}
                  <TouchableOpacity
                    onPress={() => setSelectedPreset("glass")}
                    style={[
                      styles.presetCircle,
                      { borderWidth: 2, borderColor: selectedPreset === "glass" ? colors.accent : colors.borderColor },
                      { backgroundColor: colors.inputBg }
                    ]}
                    className="mr-3 justify-center items-center"
                  >
                    <Text style={{ color: colors.textSecondary }} className="font-poppinsMedium text-[10px]">Standard</Text>
                  </TouchableOpacity>

                  {/* Gradient Options */}
                  {Object.keys(GRADIENT_PRESETS).map((key) => {
                    const active = selectedPreset === key;
                    return (
                      <TouchableOpacity
                        key={key}
                        onPress={() => setSelectedPreset(key)}
                        className="mr-3"
                      >
                        <LinearGradient
                          colors={GRADIENT_PRESETS[key]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={[
                            styles.presetCircle,
                            active ? { borderWidth: 2.5, borderColor: colors.textPrimary } : {}
                          ]}
                          className="justify-center items-center"
                        >
                          {active && (
                            <HugeiconsIcon icon={CheckmarkCircle02Icon} size={18} color="white" />
                          )}
                        </LinearGradient>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Card Preview */}
                <Text style={{ color: colors.textSecondary }} className="font-poppinsMedium text-xs uppercase mb-2.5">
                  Live Preview
                </Text>
                <View className="mb-4">
                  {selectedPreset === "glass" ? (
                    <View 
                      style={{ backgroundColor: colors.cardBg, borderWidth: 1, borderColor: colors.borderColor }}
                      className="p-5 rounded-[24px]"
                    >
                      <Text style={{ color: colors.textPrimary }} className="font-dmBold text-base mb-1">
                        {title || "Your Announcement Title"}
                      </Text>
                      <Text style={{ color: colors.textSecondary }} className="font-poppins text-xs">
                        {content || "Your announcement content will be displayed here..."}
                      </Text>
                    </View>
                  ) : (
                    <LinearGradient
                      colors={GRADIENT_PRESETS[selectedPreset] || GRADIENT_PRESETS.indigo}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      className="p-5 rounded-[24px]"
                    >
                      <Text className="text-white font-dmBold text-base mb-1">
                        {title || "Your Announcement Title"}
                      </Text>
                      <Text className="text-white/80 font-poppins text-xs">
                        {content || "Your announcement content will be displayed here..."}
                      </Text>
                    </LinearGradient>
                  )}
                </View>
              </ScrollView>

              {/* Submit Buttons */}
              <View className="flex-row gap-3">
                <TouchableOpacity
                  onPress={() => setIsModalOpen(false)}
                  style={{ backgroundColor: colors.inputBg }}
                  className="flex-1 py-4 rounded-2xl items-center justify-center"
                  disabled={posting}
                >
                  <Text style={{ color: colors.textPrimary }} className="font-poppinsSemiBold text-sm">
                    Cancel
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleCreateAnnouncement}
                  style={{ backgroundColor: colors.accent }}
                  className="flex-1 py-4 rounded-2xl items-center justify-center"
                  disabled={posting}
                >
                  {posting ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text className="text-white font-poppinsSemiBold text-sm">
                      Post Announcement
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isVisible={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteAnnouncement}
        loading={deleting}
        title="Delete Announcement"
        message="Are you sure you want to delete this announcement? This action is permanent and cannot be undone."
      />
    </View>
  );
};

const styles = StyleSheet.create({
  celebrationCard: {
    width: width * 0.78,
    height: 190,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  announcementCard: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  presetCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  todayTag: {
    backdropFilter: "blur(4px)",
  },
});

export default Announcements;
