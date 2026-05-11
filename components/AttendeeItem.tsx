import {
  ArrowDown01Icon,
  ArrowRight01Icon,
  MinusSignIcon,
  Search01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import React, { forwardRef, memo } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import { Dropdown } from "react-native-element-dropdown";

interface AttendeeItemProps {
  item: any;
  drag: () => void;
  isActive: boolean;
  expanded: boolean;
  onToggleExpand: (index: number) => void;
  onUpdate: (index: number, field: string | object, value?: any) => void;
  onDelete: (index: number) => void;
  users: any[];
  onSearch?: (query: string) => void;
  showDelete: boolean;
  isDarkMode: boolean;
  getIndex: () => number | undefined;
  fieldErrors?: { attendeeName?: boolean; organization?: boolean };
}

const AttendeeItem = memo(
  forwardRef<View, AttendeeItemProps>(
    (
      {
        item,
        drag,
        isActive,
        expanded,
        onToggleExpand,
        onUpdate,
        onDelete,
        users,
        onSearch,
        showDelete,
        isDarkMode,
        getIndex,
        fieldErrors,
      },
      ref,
    ) => {
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

          <View
            style={{ display: expanded ? "flex" : "none" }}
            className="px-4 py-4 gap-3"
          >
            <View>
              <Dropdown
                style={{
                  height: 52,
                  borderRadius: 16,
                  paddingHorizontal: 16,
                  backgroundColor: isDarkMode ? "#1A1A1A" : "#F0F3F7",
                }}
                placeholderStyle={{
                  fontSize: 14,
                  fontFamily: "Poppins_400Regular",
                  color: isDarkMode ? "#6B7280" : "#9CA3AF",
                }}
                selectedTextStyle={{
                  fontSize: 14,
                  fontFamily: "Poppins_400Regular",
                  color: isDarkMode ? "#FFFFFF" : "#000000",
                }}
                itemTextStyle={{
                  fontSize: 14,
                  fontFamily: "Poppins_400Regular",
                  color: isDarkMode ? "#FFFFFF" : "#000000",
                }}
                containerStyle={{
                  borderRadius: 16,
                  backgroundColor: isDarkMode ? "#1A1A1A" : "#FFFFFF",
                  borderWidth: 0,
                  marginTop: 4,
                }}
                activeColor={isDarkMode ? "#252525" : "#F3F4F6"}
                inputSearchStyle={{
                  backgroundColor: isDarkMode ? "#1A1A1A" : "#F0F3F7",
                  borderRadius: 14,
                  borderColor: "grey",
                  fontSize: 14,
                  color: isDarkMode ? "#FFFFFF" : "#000000",
                }}
                data={users}
                labelField="label"
                valueField="value"
                placeholder="  Search people"
                search
                searchPlaceholder="Search people..."
                onChangeText={onSearch} // New prop for server-side search
                renderLeftIcon={() => (
                  <View
                    style={{ justifyContent: "center", alignItems: "center" }}
                  >
                    <HugeiconsIcon
                      icon={Search01Icon}
                      size={18}
                      color={isDarkMode ? "#6B7280" : "#9CA3AF"}
                      style={{ marginRight: 12 }}
                    />
                  </View>
                )}
                renderRightIcon={() => (
                  <HugeiconsIcon
                    icon={ArrowDown01Icon}
                    size={20}
                    color="#919191"
                  />
                )}
                onChange={(val) => {
                  const user = users.find((u: any) => u.value === val.value);
                  if (user) {
                    handleUpdate({
                      attendeeName: user.attendeeName || user.label || "",
                      organization: user.organization || "",
                      designation:
                        user.source === "central_directory"
                          ? user.role
                          : user.designation || "",
                      email: user.email || "",
                      contactNumbers: user.contactNumbers || [""],
                      userId: user.value,
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
                isDarkMode
                  ? fieldErrors?.attendeeName
                    ? "bg-[#2A1A1A] text-white border border-[#DF5B5B]"
                    : "bg-[#1A1A1A] text-white"
                  : fieldErrors?.attendeeName
                    ? "bg-[#FFF5F5] text-gray-800 border border-[#DF5B5B]"
                    : "bg-[#F0F3F7] text-gray-800"
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
    },
  ),
);

export default AttendeeItem;
