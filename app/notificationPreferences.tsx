import {
  Add01Icon,
  ArrowLeft01Icon,
  MinusSignIcon,
  Notification01Icon,
  NotificationOff01Icon,
  Refresh04Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import api from "../lib/api";

const CustomToggle = ({
  value,
  onValueChange,
}: {
  value: boolean;
  onValueChange: (val: boolean) => void;
}) => {
  const isDarkMode = useColorScheme() === "dark";
  const [internalValue, setInternalValue] = useState(value);

  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  const animatedValue = useRef(
    new Animated.Value(internalValue ? 1 : 0),
  ).current;
  const stretchValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(animatedValue, {
      toValue: internalValue ? 1 : 0,
      bounciness: 2,
      useNativeDriver: true,
    }).start();
  }, [internalValue]);

  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [2, 22],
  });

  const scaleX = stretchValue.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.15],
  });

  const stretchOffset = stretchValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 2],
  });

  const sideModifier = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [1, -1],
  });

  const finalTranslateX = Animated.add(
    translateX,
    Animated.multiply(stretchOffset, sideModifier),
  );

  const greenOpacity = animatedValue;

  const handlePressIn = () => {
    Animated.spring(stretchValue, {
      toValue: 1,
      bounciness: 2,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(stretchValue, {
      toValue: 0,
      bounciness: 2,
      useNativeDriver: true,
    }).start();

    const newValue = !internalValue;
    setInternalValue(newValue);

    setTimeout(() => {
      onValueChange(newValue);
    }, 500);
  };

  return (
    <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut}>
      <View
        style={{
          width: 46,
          height: 26,
          borderRadius: 13,
          backgroundColor: isDarkMode ? "#39393D" : "#D2D2D2",
          overflow: "hidden",
          justifyContent: "center",
        }}
      >
        <Animated.View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "#1AA45B", // Updated Green
            opacity: greenOpacity,
          }}
        />

        <Animated.View
          style={{
            width: 22,
            height: 22,
            borderRadius: 11,
            backgroundColor: "#FFF",
            transform: [{ translateX: finalTranslateX }, { scaleX }],
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.15,
            shadowRadius: 2.5,
            elevation: 3,
          }}
        />
      </View>
    </Pressable>
  );
};

const NotificationPreferencesScreen = () => {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";
  const { token, expoPushToken } = useAuth();

  const [loading, setLoading] = useState(true);
  const [preferences, setPreferences] = useState({
    projectAssigned: true,
    momAssigned: true,
    agendaUpdates: true,
    dprUpdates: true,
    svrSubmitted: true,
    stageUpdated: true,
    runningNotes: true,
    ilrAssigned: true,
    supportTicket: true,
    pushEnabled: true,
    readNotificationsCleanupDays: 2,
    unreadNotificationsCleanupDays: 15,
  });

  const fetchPreferences = async () => {
    try {
      setLoading(true);
      const response = await api.get("/users/notification-preferences", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.preferences) {
        setPreferences(response.data.preferences);
      }
    } catch (error) {
      console.error("Error fetching preferences:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchPreferences();
    }
  }, [token]);

  const updatePreferences = async (newPrefs: any) => {
    setPreferences(newPrefs);
    try {
      await api.patch(
        "/users/notification-preferences",
        { preferences: newPrefs },
        { headers: { Authorization: `Bearer ${token}` } },
      );
    } catch (error) {
      console.error("Error updating preferences:", error);
      // Fallback on error?
    }
  };

  const togglePreference = (key: keyof typeof preferences) => {
    const newPrefs = { ...preferences, [key]: !preferences[key] };
    updatePreferences(newPrefs);
  };

  const updateCleanupDays = (
    key: "readNotificationsCleanupDays" | "unreadNotificationsCleanupDays",
    inc: number,
  ) => {
    const min = 1;
    const max = key === "readNotificationsCleanupDays" ? 7 : 30;
    const newValue = Math.min(
      max,
      Math.max(min, (preferences[key] || 0) + inc),
    );
    const newPrefs = { ...preferences, [key]: newValue };
    updatePreferences(newPrefs);
  };

  const resetToDefault = () => {
    const defaultPrefs = {
      projectAssigned: true,
      momAssigned: true,
      agendaUpdates: true,
      dprUpdates: true,
      svrSubmitted: true,
      stageUpdated: true,
      runningNotes: true,
      ilrAssigned: true,
      supportTicket: true,
      pushEnabled: true,
      readNotificationsCleanupDays: 2,
      unreadNotificationsCleanupDays: 15,
    };
    updatePreferences(defaultPrefs);
  };

  const turnOffAll = () => {
    const offPrefs = {
      ...preferences,
      projectAssigned: false,
      momAssigned: false,
      agendaUpdates: false,
      dprUpdates: false,
      svrSubmitted: false,
      stageUpdated: false,
      runningNotes: false,
      ilrAssigned: false,
      supportTicket: false,
      pushEnabled: false,
    };
    updatePreferences(offPrefs);
  };

  const renderToggleItem = (
    label: string,
    description: string,
    value: boolean,
    onToggle: () => void,
  ) => (
    <View className="flex-row items-center justify-between p-5">
      <View className="flex-1 mr-4">
        <Text
          style={{ lineHeight: 16.8, letterSpacing: -0.028 }}
          className="text-[14px] font-dmSemiBold text-[#111827] dark:text-white mb-1"
        >
          {label}
        </Text>
        <Text
          style={{ lineHeight: 18, letterSpacing: -0.024 }}
          className="text-[12px] font-poppinsMedium text-[#4B5563] dark:text-[#919191]"
        >
          {description}
        </Text>
      </View>
      <CustomToggle value={value} onValueChange={onToggle} />
    </View>
  );

  const renderStepperItem = (
    label: string,
    description: string,
    value: number,
    onUpdate: (inc: number) => void,
    min: number = 1,
    max: number = 30,
  ) => {
    const isMin = value <= min;
    const isMax = value >= max;
    const disabledColor = isDarkMode ? "#555" : "#BDBDBD";
    const activeColor = isDarkMode ? "#fff" : "#111827";

    return (
      <View className="flex-row items-center justify-between p-5">
        <View className="flex-1 mr-4">
          <Text
            style={{ lineHeight: 16.8, letterSpacing: -0.028 }}
            className="text-[14px] font-dmSemiBold text-[#111827] dark:text-white mb-1"
          >
            {label}
          </Text>
          <Text
            style={{ lineHeight: 18, letterSpacing: -0.024 }}
            className="text-[12px] font-poppinsMedium text-[#4B5563] dark:text-[#9CA3AF]"
          >
            {description}
          </Text>
        </View>
        <View className="flex-row items-center rounded-full px-2 py-1.5 border border-[#8B8B8B] dark:border-[#8B8B8B]">
          <TouchableOpacity
            onPress={() => onUpdate(-1)}
            disabled={isMin}
            className="p-1"
          >
            <HugeiconsIcon
              icon={MinusSignIcon}
              size={18}
              color={isMin ? disabledColor : activeColor}
            />
          </TouchableOpacity>
          <Text className="mx-2 text-[12px] font-dmMedium text-[#111827] dark:text-white min-w-[30px] text-center">
            {value} Days
          </Text>
          <TouchableOpacity
            onPress={() => onUpdate(1)}
            disabled={isMax}
            className="p-1"
          >
            <HugeiconsIcon
              icon={Add01Icon}
              size={18}
              color={isMax ? disabledColor : activeColor}
            />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderActionItem = (
    label: string,
    description: string,
    buttonLabel: string,
    onPress: () => void,
    icon: any,
  ) => (
    <View className="flex-row items-center justify-between p-5">
      <View className="flex-row items-center flex-1 mr-4">
        <View className="flex-1 justify-center">
          <View className="flex-row items-center mb-1">
            <HugeiconsIcon
              icon={icon}
              size={16}
              color={isDarkMode ? "#fff" : "#111827"}
            />
            <Text
              style={{ lineHeight: 16.8, letterSpacing: -0.028 }}
              className="text-[14px] font-dmSemiBold text-[#111827] dark:text-white ml-2"
            >
              {label}
            </Text>
          </View>
          <Text
            style={{ lineHeight: 18, letterSpacing: -0.024 }}
            className="text-[12px] font-poppinsMedium text-[#4B5563] dark:text-[#919191]"
          >
            {description}
          </Text>
        </View>
      </View>
      <TouchableOpacity
        onPress={onPress}
        className="px-5 py-2 rounded-full border border-[#8B8B8B] dark:border-[#8B8B8B]"
      >
        <Text className="text-[14px] font-dmMedium text-[#111827] dark:text-white">
          {buttonLabel}
        </Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-[#FBFCFD] dark:bg-black">
        <ActivityIndicator size="large" color="#5B4CCC" />
      </View>
    );
  }

  console.log(
    "[DEBUG] Preferences State:",
    JSON.stringify(preferences, null, 2),
  );

  return (
    <View className="flex-1 bg-white dark:bg-black">
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />

      {/* Header */}
      <View className="pt-14 px-4 pb-6 flex-row items-center ">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <HugeiconsIcon
            icon={ArrowLeft01Icon}
            size={30}
            color={isDarkMode ? "#fff" : "#000"}
          />
        </TouchableOpacity>
        <Text
          style={{ lineHeight: 24, letterSpacing: -0.04 }}
          className="text-[20px] font-dmSemiBold text-[#000] dark:text-white"
        >
          Notification preferences
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 60 }}
        className="px-4"
      >
        {/* Activity Section */}
        <Text className="text-[16px] font-dmMedium text-[#454545] dark:text-[#BBBBBB] mt-4 mb-4">
          Activity assigned to me
        </Text>

        <View className="rounded-2xl overflow-hidden bg-[#F0F3F7] dark:bg-[#0D0D0D]">
          {renderToggleItem(
            "New project assigned",
            "Get notified when a project owner adds you to a project.",
            !!preferences.projectAssigned,
            () => togglePreference("projectAssigned"),
          )}
          <View className="h-[1px] bg-white dark:bg-black mx-0" />
          {renderToggleItem(
            "ILR assigned to me",
            "Notified when an issue log record is assigned to you for resolution.",
            !!preferences.ilrAssigned,
            () => togglePreference("ilrAssigned"),
          )}
          <View className="h-[1px] bg-white dark:bg-black mx-0" />
          {renderToggleItem(
            "MOM minutes assigned",
            "Notified when meeting minutes need your review or sign-off.",
            !!preferences.momAssigned,
            () => togglePreference("momAssigned"),
          )}
          <View className="h-[1px] bg-white dark:bg-black mx-0" />
          {renderToggleItem(
            "Agenda shared or updated",
            "Know when an agenda is added, updated or shared for your meeting.",
            !!preferences.agendaUpdates,
            () => togglePreference("agendaUpdates"),
          )}
          <View className="h-[1px] bg-white dark:bg-black mx-0" />
          {renderToggleItem(
            "Running notes updates",
            "Get notified when a running note is added or assigned to you.",
            !!preferences.runningNotes,
            () => togglePreference("runningNotes"),
          )}
        </View>

        {/* Reports Section */}
        <Text className="text-[16px] font-dmMedium text-[#454545] dark:text-[#BBBBBB] mt-8 mb-4">
          Reports & updates
        </Text>
        <View className="rounded-2xl overflow-hidden bg-[#F0F3F7] dark:bg-[#0D0D0D]">
          {renderToggleItem(
            "Daily progress report updates",
            "Get notified when a DPR is due, shared or submitted by your team.",
            !!preferences.dprUpdates,
            () => togglePreference("dprUpdates"),
          )}
          <View className="h-[1px] bg-white dark:bg-black mx-0" />
          {renderToggleItem(
            "Site visit report submitted",
            "Someone on your team filed a site visit report you can review.",
            !!preferences.svrSubmitted,
            () => togglePreference("svrSubmitted"),
          )}
          <View className="h-[1px] bg-white dark:bg-black mx-0" />
          {renderToggleItem(
            "Project stage updated",
            "A project you follow has moved to a new phase or milestone.",
            !!preferences.stageUpdated,
            () => togglePreference("stageUpdated"),
          )}
          <View className="h-[1px] bg-white dark:bg-black mx-0" />
          {renderToggleItem(
            "App Support",
            "Get notified when your report is received, updated, or resolved by the support team.",
            !!preferences.supportTicket,
            () => togglePreference("supportTicket"),
          )}
        </View>

        {/* System Cleanup Section */}
        <Text className="text-[16px] font-dmMedium text-[#454545] dark:text-[#BBBBBB] mt-8 mb-4">
          Notification history cleanup
        </Text>

        <View
          style={{
            borderColor: isDarkMode ? "#FFC366" : "#9E6000",
            backgroundColor: isDarkMode ? "#2B1D0699" : "#FEFCE8",
            borderStyle: "dashed",
            borderWidth: 1,
          }}
          className="mb-6 p-4 rounded-2xl"
        >
          <Text
            style={{ color: isDarkMode ? "#FFC366" : "#9E6000" }}
            className="text-[11px] font-poppins mb-1"
          >
            Note 1 → Read messages delete after 2 days by default (Max 7 days)
          </Text>
          <Text
            style={{ color: isDarkMode ? "#FFC366" : "#9E6000" }}
            className="text-[11px] font-poppins"
          >
            Note 2 → Unread messages delete after 15 days by default (Max 30
            days)
          </Text>
        </View>

        <View className="rounded-2xl overflow-hidden bg-[#F0F3F7] dark:bg-[#0D0D0D]">
          {renderStepperItem(
            "Read notifications",
            "Auto-delete after you've seen them",
            preferences.readNotificationsCleanupDays,
            (inc) => updateCleanupDays("readNotificationsCleanupDays", inc),
            1,
            7,
          )}
          <View className="h-[1px] bg-white dark:bg-black mx-0" />
          {renderStepperItem(
            "Unread notifications",
            "Auto-delete even if not opened",
            preferences.unreadNotificationsCleanupDays,
            (inc) => updateCleanupDays("unreadNotificationsCleanupDays", inc),
            1,
            30,
          )}
        </View>

        {/* Manage Preferences Section */}
        <Text className="text-[16px] font-dmMedium text-[#454545] dark:text-[#BBBBBB] mt-8 mb-4">
          Manage preferences
        </Text>
        <View className="rounded-2xl overflow-hidden bg-[#F0F3F7] dark:bg-[#0D0D0D]">
          {renderActionItem(
            "Reset to default",
            "Undo all changes and restore original settings.",
            "Reset",
            resetToDefault,
            Refresh04Icon,
          )}
          <View className="h-[1px] bg-white dark:bg-black mx-0" />
          {renderActionItem(
            "Turn off all notifications",
            "Stop all mobile push notifications at once.",
            "Turn off",
            turnOffAll,
            NotificationOff01Icon,
          )}
        </View>

        {/* <View className="mt-10">
          <TouchableOpacity
            onPress={fetchPreferences}
            activeOpacity={0.7}
            className="flex-row items-center justify-center p-4 bg-[#F0F3F7] dark:bg-[#1A1A1A] rounded-2xl"
          >
            <HugeiconsIcon
              icon={Add01Icon}
              size={20}
              color={isDarkMode ? "#fff" : "#111827"}
            />
            <Text className="ml-2 text-[16px] font-poppinsMedium text-[#111827] dark:text-white">
              Sync preferences
            </Text>
          </TouchableOpacity>
        </View> */}

        {!expoPushToken && (
          <View className="mt-6 p-5 bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-100 dark:border-amber-800 flex-row items-center">
            <HugeiconsIcon
              icon={Notification01Icon}
              size={24}
              color="#D97706"
            />
            <View className="ml-4 flex-1">
              <Text className="text-[14px] font-poppinsSemiBold text-amber-900 dark:text-amber-200 mb-1">
                Push Notifications Disabled
              </Text>
              <Text className="text-[13px] font-poppins text-amber-800 dark:text-amber-300">
                Check your system settings to enable alerts on this device.
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default NotificationPreferencesScreen;
