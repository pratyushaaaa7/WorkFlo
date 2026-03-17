import React, { memo, useState, useEffect, forwardRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Platform,
} from "react-native";
import { Dropdown } from "react-native-element-dropdown";
import Collapsible from "react-native-collapsible";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  ArrowDown01Icon,
  Search01Icon,
  Delete02Icon,
  Cancel01Icon,
  ArrowRight01Icon,
} from "@hugeicons/core-free-icons";

interface AttendeeItemProps {
  item: any;
  drag: () => void;
  isActive: boolean;
  expanded: boolean;
  onToggleExpand: () => void;
  onUpdate: (field: string, value: any) => void;
  onDelete: () => void;
  users: any[];
  showDelete: boolean;
  isDarkMode: boolean;
}

const AttendeeItem = memo(forwardRef<View, AttendeeItemProps>(({ 
  item, 
  drag, 
  isActive, 
  expanded, 
  onToggleExpand, 
  onUpdate, 
  onDelete, 
  users, 
  showDelete,
  isDarkMode 
}, ref) => {
  const [localAttendeeName, setLocalAttendeeName] = useState(item.attendeeName);
  const [localOrganization, setLocalOrganization] = useState(item.organization);
  const [localDesignation, setLocalDesignation] = useState(item.designation);
  const [localEmail, setLocalEmail] = useState(item.email);
  const [localPhone, setLocalPhone] = useState(item.contactNumbers?.[0] || "");

  // Sync local state when item changes
  useEffect(() => {
    setLocalAttendeeName(item.attendeeName);
    setLocalOrganization(item.organization);
    setLocalDesignation(item.designation);
    setLocalEmail(item.email);
    setLocalPhone(item.contactNumbers?.[0] || "");
  }, [item]);

  const handleBlur = (field: string, value: any) => {
    onUpdate(field, value);
  };

  const inputBgColor = isDarkMode ? "#121212" : "#F1F5F9";

  return (
    <View
      ref={ref}
      collapsable={false}
      className="mb-3 overflow-hidden"
      style={{
        borderRadius: 12,
        backgroundColor: isDarkMode ? "#0D0D0D" : "#F6F8FA",
        zIndex: isActive ? 999 : 1,
        elevation: isActive ? 8 : 0,
      }}
    >
      <TouchableOpacity
        activeOpacity={0.7}
        onLongPress={drag}
        delayLongPress={500}
        onPress={onToggleExpand}
        className={`flex-row justify-between items-center px-4 py-3.5 ${
          isActive ? (isDarkMode ? "bg-gray-800" : "bg-gray-100") : ""
        }`}
      >
        <Text
          className={`font-poppinsMedium text-[15px] ${
            isDarkMode ? "text-white" : "text-gray-900"
          }`}
        >
          {item.attendeeName || `Attendee ${item.sNo}`}
        </Text>
        <HugeiconsIcon
          icon={expanded ? ArrowDown01Icon : ArrowRight01Icon}
          size={18}
          color={isDarkMode ? "#9CA3AF" : "#6B7280"}
        />
      </TouchableOpacity>

      <Collapsible collapsed={!expanded} duration={300}>
        <View className="px-4 pb-4 gap-3">
          {/* Search People / Find in Directory */}
          <Dropdown
            style={{
              height: 48,
              backgroundColor: inputBgColor,
              borderRadius: 12,
              paddingHorizontal: 16,
            }}
            placeholderStyle={{
              fontSize: 14,
              color: isDarkMode ? "#6B7280" : "#9CA3AF",
              fontFamily: "Poppins-Regular"
            }}
            selectedTextStyle={{
              fontSize: 14,
              color: isDarkMode ? "#E5E7EB" : "#111827",
              fontFamily: "Poppins-Regular"
            }}
            inputSearchStyle={{
              height: 40,
              fontSize: 14,
              borderRadius: 8,
              fontFamily: "Poppins-Regular"
            }}
            containerStyle={{
              borderRadius: 12,
              backgroundColor: isDarkMode ? "#1C1C1E" : "#fff",
              borderWidth: 0,
              elevation: 5,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
            }}
            activeColor={isDarkMode ? "#374151" : "#F0F9FF"}
            data={users}
            labelField="label"
            valueField="value"
            value={item.userId}
            placeholder="Search people"
            search
            searchPlaceholder="Search people..."
            renderLeftIcon={() => (
              <View className="mr-2">
                <HugeiconsIcon
                  icon={Search01Icon}
                  size={18}
                  color={isDarkMode ? "#9CA3AF" : "#6B7280"}
                />
              </View>
            )}
            onChange={(val) => {
              const user = users.find((u: any) => u.value === val.value);
              if (user) {
                onUpdate("all", {
                  userId: user.value,
                  attendeeName: user.attendeeName || user.label || "",
                  organization: user.organization || "",
                  designation: user.designation || "",
                  email: user.email || "",
                  contactNumbers: user.contactNumbers || [""],
                });
              }
            }}
          />

          <View className="gap-3">
            <TextInput
              placeholder="Name"
              placeholderTextColor={isDarkMode ? "#6B7280" : "#9CA3AF"}
              value={localAttendeeName}
              onChangeText={setLocalAttendeeName}
              onBlur={() => handleBlur("attendeeName", localAttendeeName)}
              className="rounded-xl px-4 py-3.5 font-poppins text-[15px]"
              style={{ backgroundColor: inputBgColor, color: isDarkMode ? "#fff" : "#111827" }}
            />
            <TextInput
              placeholder="WALL"
              placeholderTextColor={isDarkMode ? "#6B7280" : "#9CA3AF"}
              value={localOrganization}
              onChangeText={setLocalOrganization}
              onBlur={() => handleBlur("organization", localOrganization)}
              className="rounded-xl px-4 py-3.5 font-poppins text-[15px]"
              style={{ backgroundColor: inputBgColor, color: isDarkMode ? "#fff" : "#111827" }}
            />
            <TextInput
              placeholder="UX/UI Designer"
              placeholderTextColor={isDarkMode ? "#6B7280" : "#9CA3AF"}
              value={localDesignation}
              onChangeText={setLocalDesignation}
              onBlur={() => handleBlur("designation", localDesignation)}
              className="rounded-xl px-4 py-3.5 font-poppins text-[15px]"
              style={{ backgroundColor: inputBgColor, color: isDarkMode ? "#fff" : "#111827" }}
            />
            <TextInput
              placeholder="Email Address"
              placeholderTextColor={isDarkMode ? "#6B7280" : "#9CA3AF"}
              value={localEmail}
              onChangeText={setLocalEmail}
              onBlur={() => handleBlur("email", localEmail)}
              keyboardType="email-address"
              className="rounded-xl px-4 py-3.5 font-poppins text-[15px]"
              style={{ backgroundColor: inputBgColor, color: isDarkMode ? "#fff" : "#111827" }}
            />
            <TextInput
              placeholder="Phone Number"
              placeholderTextColor={isDarkMode ? "#6B7280" : "#9CA3AF"}
              value={localPhone}
              onChangeText={setLocalPhone}
              onBlur={() => handleBlur("phone", localPhone)}
              keyboardType="phone-pad"
              className="rounded-xl px-4 py-3.5 font-poppins text-[15px]"
              style={{ backgroundColor: inputBgColor, color: isDarkMode ? "#fff" : "#111827" }}
            />
          </View>

          {showDelete && (
            <TouchableOpacity
              onPress={onDelete}
              className="flex-row items-center self-end mt-1"
              activeOpacity={0.7}
            >
              <HugeiconsIcon
                icon={Cancel01Icon}
                size={16}
                color="#EF4444"
                className="mr-1.5"
              />
              <Text className="text-red-500 font-poppinsMedium text-[13px]">
                Remove
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </Collapsible>
    </View>
  );
}));

export default AttendeeItem;
