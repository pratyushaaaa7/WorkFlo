import React, { memo, useState, useEffect, forwardRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { Dropdown } from "react-native-element-dropdown";
import Collapsible from "react-native-collapsible";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  ArrowDown01Icon,
  ArrowRight01Icon,
  Search01Icon,
  Delete02Icon,
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
  const [openDirectory, setOpenDirectory] = useState(false);

  // Sync local state when item changes (e.g. from props update or drag)
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

  return (
    <View
      ref={ref}
      collapsable={false}
      style={{
        borderRadius: 12,
        overflow: "hidden",
        marginBottom: 12,
        backgroundColor: isDarkMode ? "#1E1E1E" : "#fff",
        borderWidth: isActive ? 1 : 0,
        borderColor: "#5B4CCC",
        zIndex: isActive ? 999 : 1,
        elevation: isActive ? 8 : 0,
      }}
    >
      <TouchableOpacity
        activeOpacity={0.7}
        onLongPress={drag}
        delayLongPress={500}
        onPress={onToggleExpand}
        className={`flex-row justify-between items-center px-4 py-3 ${
          isDarkMode ? "bg-[#262626]" : "bg-[#F3F4F6]"
        }`}
      >
        <View className="flex-row items-center">
          <View>
            <Text
              className={`font-dmSemiBold text-[15px] ${
                isDarkMode ? "text-gray-200" : "text-gray-800"
              }`}
            >
              Attendee {item.sNo}
            </Text>
            {item.attendeeName ? (
              <Text
                className={`text-sm font-poppins mt-0.5 ${
                  isDarkMode ? "text-gray-400" : "text-gray-500"
                }`}
              >
                {item.attendeeName}
              </Text>
            ) : null}
          </View>
        </View>
        <HugeiconsIcon
          icon={expanded ? ArrowDown01Icon : ArrowRight01Icon}
          size={18}
          color={isDarkMode ? "#9CA3AF" : "#6B7280"}
        />
      </TouchableOpacity>

      <Collapsible collapsed={!expanded} duration={300}>
        <View className="px-4 py-4 gap-3">
          {openDirectory ? (
            <Dropdown
              style={{
                height: 48,
                borderColor: isDarkMode ? "#4B5563" : "#E5E7EB",
                borderWidth: 1,
                borderRadius: 12,
                paddingHorizontal: 16,
                backgroundColor: isDarkMode ? "#262626" : "#F3F4F6",
                marginBottom: 8,
              }}
              placeholderStyle={{
                fontSize: 14,
                color: isDarkMode ? "#6B7280" : "#9CA3AF",
              }}
              selectedTextStyle={{
                fontSize: 14,
                color: isDarkMode ? "#E5E7EB" : "#111827",
              }}
              activeColor={isDarkMode ? "#374151" : "#F0F9FF"}
              data={users}
              labelField="label"
              valueField="value"
              value={item.userId}
              placeholder="Search in directory..."
              search
              searchPlaceholder="Type a name..."
              onChange={(val) => {
                const user = users.find((u: any) => u.value === val.value);
                if (user) {
                  onUpdate("all", {
                    userId: user.value,
                    attendeeName: user.attendeeName || "",
                    organization: user.organization || "",
                    designation: user.designation || "",
                    email: user.email || "",
                    contactNumbers: user.contactNumbers || [""],
                  });
                }
                setOpenDirectory(false);
              }}
            />
          ) : !item.userId ? (
            <TouchableOpacity
              onPress={() => setOpenDirectory(true)}
              className={`flex-row items-center border border-dashed rounded-xl py-3 justify-center mb-2 ${
                isDarkMode
                  ? "border-[#A78BFA] bg-[#A78BFA]/10"
                  : "border-[#8B5CF6] bg-[#8B5CF6]/5"
              }`}
            >
              <HugeiconsIcon
                icon={Search01Icon}
                size={18}
                color={isDarkMode ? "#A78BFA" : "#8B5CF6"}
              />
              <Text
                className={`ml-2 font-poppinsMedium text-sm ${isDarkMode ? "text-[#A78BFA]" : "text-[#8B5CF6]"}`}
              >
                Find in Directory
              </Text>
            </TouchableOpacity>
          ) : null}

          <View className="gap-3">
            <TextInput
              placeholder="Full Name *"
              placeholderTextColor={isDarkMode ? "#6B7280" : "#9CA3AF"}
              value={localAttendeeName}
              onChangeText={setLocalAttendeeName}
              onBlur={() => handleBlur("attendeeName", localAttendeeName)}
              className={`rounded-xl px-4 py-3.5 font-poppins text-[15px] ${
                isDarkMode
                  ? "bg-[#262626] text-white"
                  : "bg-[#F3F4F6] text-gray-900"
              }`}
            />
            <TextInput
              placeholder="Organization"
              placeholderTextColor={isDarkMode ? "#6B7280" : "#9CA3AF"}
              value={localOrganization}
              onChangeText={setLocalOrganization}
              onBlur={() => handleBlur("organization", localOrganization)}
              className={`rounded-xl px-4 py-3.5 font-poppins text-[15px] ${
                isDarkMode
                  ? "bg-[#262626] text-white"
                  : "bg-[#F3F4F6] text-gray-900"
              }`}
            />
            <TextInput
              placeholder="Designation"
              placeholderTextColor={isDarkMode ? "#6B7280" : "#9CA3AF"}
              value={localDesignation}
              onChangeText={setLocalDesignation}
              onBlur={() => handleBlur("designation", localDesignation)}
              className={`rounded-xl px-4 py-3.5 font-poppins text-[15px] ${
                isDarkMode
                  ? "bg-[#262626] text-white"
                  : "bg-[#F3F4F6] text-gray-900"
              }`}
            />
            <TextInput
              placeholder="Email Address"
              placeholderTextColor={isDarkMode ? "#6B7280" : "#9CA3AF"}
              value={localEmail}
              onChangeText={setLocalEmail}
              onBlur={() => handleBlur("email", localEmail)}
              keyboardType="email-address"
              className={`rounded-xl px-4 py-3.5 font-poppins text-[15px] ${
                isDarkMode
                  ? "bg-[#262626] text-white"
                  : "bg-[#F3F4F6] text-gray-900"
              }`}
            />
            <TextInput
              placeholder="Phone Number"
              placeholderTextColor={isDarkMode ? "#6B7280" : "#9CA3AF"}
              value={localPhone}
              onChangeText={setLocalPhone}
              onBlur={() => handleBlur("phone", localPhone)}
              keyboardType="phone-pad"
              className={`rounded-xl px-4 py-3.5 font-poppins text-[15px] ${
                isDarkMode
                  ? "bg-[#262626] text-white"
                  : "bg-[#F3F4F6] text-gray-900"
              }`}
            />
          </View>

          {showDelete && (
            <View className="flex-row justify-end space-x-4 mt-2">
              <TouchableOpacity
                onPress={onDelete}
                className="flex-row items-center"
              >
                <HugeiconsIcon
                  icon={Delete02Icon}
                  size={14}
                  color="#EF4444"
                  className="mr-1"
                />
                <Text className="text-red-500 font-poppinsMedium text-sm">
                  Remove Attendee
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Collapsible>
    </View>
  );
}));

export default AttendeeItem;
