import React, { memo, useState, useEffect, forwardRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Platform,
} from "react-native";
import { Dropdown } from "react-native-element-dropdown";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  ArrowDown01Icon,
  Search01Icon,
  Delete02Icon,
  Cancel01Icon,
  ArrowRight01Icon,
  MinusSignIcon,
} from "@hugeicons/core-free-icons";

interface AttendeeItemProps {
  item: any;
  drag: () => void;
  isActive: boolean;
  expanded: boolean;
  onToggleExpand: (index: number) => void;
  onUpdate: (index: number, field: string | object, value?: any) => void; // Updated signature
  onDelete: (index: number) => void;
  users: any[];
  onSearch?: (query: string) => void;
  showDelete: boolean;
  isDarkMode: boolean;
  getIndex: () => number | undefined;
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
  onSearch, // Added search prop
  showDelete,
  isDarkMode,
  getIndex
}, ref) => {
  const handleUpdate = (field: string | object, value?: any) => {
    const idx = getIndex();
    if (idx !== undefined) onUpdate(idx, field, value);
  };

  const cardBgColor = isDarkMode ? "#0D0D0D" : "#F6F8FA";
  const borderColor = isDarkMode ? "#262626" : "#E0E5EB";
  const inputBgColor = isDarkMode ? "#1A1A1A" : "#F0F3F7"; // Re-added for consistency with new code

  return (
    <View
      ref={ref}
      collapsable={false}
      style={{
        marginBottom: 12,
        borderRadius: 12,
        backgroundColor: cardBgColor,
        zIndex: isActive ? 999 : 1,
        elevation: isActive ? 8 : 0,
        overflow: "hidden",
      }}
    >
      <TouchableOpacity
        activeOpacity={0.7}
        onLongPress={drag}
        delayLongPress={500}
        onPress={() => {
          const idx = getIndex();
          if (idx !== undefined) onToggleExpand(idx);
        }}
        className={`flex-row justify-between items-center px-4 py-4 ${
            isActive ? (isDarkMode ? "bg-gray-800" : "bg-gray-100") : ""
        } ${expanded ? (isDarkMode ? "border-b border-[#262626]" : "border-b border-[#E0E5EB]") : ""}`}
      >
        <Text
          numberOfLines={1}
          className={`font-poppinsMedium text-[15px] flex-1 mr-2 ${
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

      <View style={{ display: expanded ? "flex" : "none" }} className="px-4 py-6 gap-4">
        <View>
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
                fontFamily: "Poppins_400Regular"
              }}
              selectedTextStyle={{
                fontSize: 14,
                color: isDarkMode ? "#E5E7EB" : "#111827",
                fontFamily: "Poppins_400Regular"
              }}
              inputSearchStyle={{
                height: 40,
                fontSize: 14,
                borderRadius: 8,
                fontFamily: "Poppins_400Regular"
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
              placeholder="Search people"
              search
              searchPlaceholder="Search people..."
              onChangeText={onSearch} // New prop for server-side search
              renderLeftIcon={() => null}
              onChange={(val) => {
                const user = users.find((u: any) => u.value === val.value);
                if (user) {
                  handleUpdate({
                    attendeeName: user.attendeeName || user.label || "",
                    organization: user.organization || "",
                    designation: user.designation || "",
                    email: user.email || "",
                    contactNumbers: user.contactNumbers || [""],
                    userId: user.value
                  });
                }
              }}
              value={item.userId}
            />
          </View>

          <TextInput
            placeholder="Name *"
            placeholderTextColor={isDarkMode ? "#6B7280" : "#9CA3AF"}
            value={item.attendeeName}
            onChangeText={(val) => handleUpdate("attendeeName", val)}
            className={`rounded-xl px-4 py-3.5 font-poppins text-[15px] ${
                isDarkMode ? "bg-[#1A1A1A]" : "bg-[#F0F3F7]"
              }`}
            style={{ color: isDarkMode ? "#fff" : "#111827" }}
          />
          <TextInput
            placeholder="Organization *"
            placeholderTextColor={isDarkMode ? "#6B7280" : "#9CA3AF"}
            value={item.organization}
            onChangeText={(val) => handleUpdate("organization", val)}
            className={`rounded-xl px-4 py-3.5 font-poppins text-[15px] ${
                isDarkMode ? "bg-[#1A1A1A]" : "bg-[#F0F3F7]"
              }`}
            style={{ color: isDarkMode ? "#fff" : "#111827" }}
          />
          <TextInput
            placeholder="Designation"
            placeholderTextColor={isDarkMode ? "#6B7280" : "#9CA3AF"}
            value={item.designation}
            onChangeText={(val) => handleUpdate("designation", val)}
            className={`rounded-xl px-4 py-3.5 font-poppins text-[15px] ${
                isDarkMode ? "bg-[#1A1A1A]" : "bg-[#F0F3F7]"
              }`}
            style={{ color: isDarkMode ? "#fff" : "#111827" }}
          />
          <TextInput
            placeholder="Email"
            placeholderTextColor={isDarkMode ? "#6B7280" : "#9CA3AF"}
            value={item.email}
            onChangeText={(val) => handleUpdate("email", val)}
            className={`rounded-xl px-4 py-3.5 font-poppins text-[15px] ${
                isDarkMode ? "bg-[#1A1A1A]" : "bg-[#F0F3F7]"
              }`}
            style={{ color: isDarkMode ? "#fff" : "#111827" }}
          />
          <TextInput
            placeholder="Phone"
            placeholderTextColor={isDarkMode ? "#6B7280" : "#9CA3AF"}
            value={item.contactNumbers ? item.contactNumbers[0] : ""}
            onChangeText={(val) => handleUpdate("phone", val)}
            className={`rounded-xl px-4 py-3.5 font-poppins text-[15px] ${
                isDarkMode ? "bg-[#1A1A1A]" : "bg-[#F0F3F7]"
              }`}
            style={{ color: isDarkMode ? "#fff" : "#111827" }}
            keyboardType="phone-pad"
          />

          {showDelete && (
            <TouchableOpacity
              onPress={() => {
                 const idx = getIndex();
                 if (idx !== undefined) onDelete(idx);
              }}
              className="flex-row items-center mt-2"
              activeOpacity={0.7}
            >
              <View className="mb-0.5 h-4 w-4 rounded-full bg-[#EF4444] items-center justify-center mr-1">
                <HugeiconsIcon
                  icon={MinusSignIcon}
                  size={10}
                  color="#FFFFFF"
                />
              </View>
              <Text className="text-red-500 font-poppinsMedium text-[13px]">
                Remove
              </Text>
            </TouchableOpacity>
          )}
        </View>
    </View>
  );
}));

export default AttendeeItem;
