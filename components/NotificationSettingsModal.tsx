import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Switch,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import Modal from "react-native-modal";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";

interface NotificationSettingsModalProps {
  isVisible: boolean;
  onClose: () => void;
}

const NotificationSettingsModal: React.FC<NotificationSettingsModalProps> = ({
  isVisible,
  onClose,
}) => {
  const { token, expoPushToken } = useAuth();
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState({
    momAssigned: true,
    dprSubmitted: true,
    svrSubmitted: true,
    stageUpdated: true,
    projectAssigned: true,
    runningNotesAssigned: true,
    ilrAssigned: true,
  });

  const fetchPreferences = async () => {
    try {
      setLoading(true);
      const response = await api.get("/users/notification-preferences", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data?.preferences) {
        setPreferences(response.data.preferences);
      }
    } catch (error) {
      console.error("Error fetching notification preferences:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isVisible && token) {
      fetchPreferences();
    }
  }, [isVisible, token]);

  const togglePreference = async (key: keyof typeof preferences) => {
    const newPreferences = { ...preferences, [key]: !preferences[key] };
    setPreferences(newPreferences);
    
    try {
      setSaving(true);
      await api.patch(
        "/users/notification-preferences",
        { 
          preferences: newPreferences,
          pushToken: expoPushToken // Preserve the token
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (error) {
      console.error("Error updating notification preferences:", error);
      // Revert on error
      setPreferences(preferences);
    } finally {
      setSaving(false);
    }
  };

  const resetToDefault = async () => {
    const defaultPrefs = {
      momAssigned: true,
      dprSubmitted: true,
      svrSubmitted: true,
      stageUpdated: true,
      projectAssigned: true,
      runningNotesAssigned: true,
      ilrAssigned: true,
    };
    setPreferences(defaultPrefs);
    try {
      setSaving(true);
      await api.patch(
        "/users/notification-preferences",
        { preferences: defaultPrefs },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (error) {
      console.error("Error resetting notification preferences:", error);
    } finally {
      setSaving(false);
    }
  };

  const renderSettingItem = (label: string, value: boolean, onToggle: () => void) => (
    <View className="flex-row items-center justify-between py-[10px] ">
      <Text className="text-[14px] font-dmMedium text-black dark:text-white">
        {label}
      </Text>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: "#D1D5DB", true: "#34C759" }}
        thumbColor="#FFFFFF"
        ios_backgroundColor="#D1D5DB"
      />
    </View>
  );

  return (
    <Modal
      isVisible={isVisible}
      onBackdropPress={onClose}
      onBackButtonPress={onClose}
      style={{ margin: 0, justifyContent: "flex-end" }}
      backdropOpacity={0.5}
      useNativeDriver
    >
      <View className="bg-[#FBFCFD] dark:bg-[#1A1A1A] rounded-t-[32px] px-6 pb-8 max-h-[90%]">
        {/* Handle */}
        <View className="items-center py-3">
          <View className="w-12 h-[2px] bg-[#000] dark:bg-[#A6A6A6] rounded-full" />
        </View>

        {/* Header */}
        <View className="flex-row items-center py-4 justify-between pb-4 border-b border-[#E0E5EB] dark:border-[#413E47]">
          <View className="flex-1 items-center">
             <Text className="text-[18px] font-dmSemiBold text-black dark:text-white">
               Customize Notification
             </Text>
          </View>
          <TouchableOpacity 
            onPress={onClose}
            className="bg-[#EEEEEE] dark:bg-[#000000] p-[5px]  rounded-full absolute right-0"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={16} color={isDarkMode ? "#fff" : "#000"} />
          </TouchableOpacity>
        </View>

        {/* <Text className="text-[14px] font-dmMedium text-[#454545] dark:text-[#919191] mb-2">
          On mobile, notify me about...
        </Text> */}

        <ScrollView showsVerticalScrollIndicator={false} className="pb-12">
          {loading ? (
            <ActivityIndicator className="py-14" />
          ) : (
            <View className="py-4">
              {renderSettingItem("Project assigned to me", preferences.projectAssigned, () => togglePreference("projectAssigned"))}
              {renderSettingItem("MOM assigned to me", preferences.momAssigned, () => togglePreference("momAssigned"))}
              {renderSettingItem("DPR submissions", preferences.dprSubmitted, () => togglePreference("dprSubmitted"))}
              {renderSettingItem("SVR submissions", preferences.svrSubmitted, () => togglePreference("svrSubmitted"))}
              {renderSettingItem("Stage updates", preferences.stageUpdated, () => togglePreference("stageUpdated"))}
              {renderSettingItem("Notes assigned to me", preferences.runningNotesAssigned, () => togglePreference("runningNotesAssigned"))}
              {renderSettingItem("ILR assigned to me", preferences.ilrAssigned, () => togglePreference("ilrAssigned"))}
            </View>
          )}
          
          <TouchableOpacity onPress={resetToDefault} className="py-4 border-t border-[#E0E5EB] dark:border-[#413E47]">
            <Text className="text-[16px] font-dmMedium text-[#DF5B5B]">
              Reset to default
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
};

export default NotificationSettingsModal;
