import React, { memo, useState, useEffect, useRef, forwardRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { MultiSelect } from "react-native-element-dropdown";
import Collapsible from "react-native-collapsible";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  ArrowDown01Icon,
  ArrowRight01Icon,
  Delete02Icon,
  Tick01Icon,
  CircleIcon,
} from "@hugeicons/core-free-icons";
import moment from "moment";

interface MinuteItemProps {
  item: any;
  drag: () => void;
  isActive: boolean;
  expanded: boolean;
  onToggleExpand: () => void;
  onUpdate: (field: string, value: any) => void;
  onDeleteRequest: () => void;
  users: any[];
  showDelete: boolean;
  isDarkMode: boolean;
  onOpenDatePicker: () => void;
}

const MinuteItem = memo(forwardRef<View, MinuteItemProps>(({ 
  item, 
  drag, 
  isActive, 
  expanded, 
  onToggleExpand, 
  onUpdate, 
  onDeleteRequest, 
  users, 
  showDelete,
  isDarkMode,
  onOpenDatePicker
}, ref) => {
  const [localSubject, setLocalSubject] = useState(item.issueSubject);
  const [localDescription, setLocalDescription] = useState(item.issueDescription);
  const [localRemarks, setLocalRemarks] = useState(item.remarks);
  const dropdownRef = useRef<any>(null);
  const responsibilityRef = useRef<any>(null);

  useEffect(() => {
    setLocalSubject(item.issueSubject);
    setLocalDescription(item.issueDescription);
    setLocalRemarks(item.remarks);
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
              Minute {item.serialNo}
            </Text>
            {item.issueSubject ? (
              <Text
                className={`text-sm font-poppins mt-0.5 ${
                  isDarkMode ? "text-gray-400" : "text-gray-500"
                }`}
              >
                {item.issueSubject}
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
          {/* Raised By */}
          <MultiSelect
            ref={dropdownRef}
            style={{
              height: 48,
              borderColor: isDarkMode ? "#4B5563" : "#E5E7EB",
              borderWidth: 1,
              borderRadius: 12,
              paddingHorizontal: 16,
              backgroundColor: isDarkMode ? "#262626" : "#F3F4F6",
            }}
            placeholderStyle={{
              fontSize: 14,
              color: isDarkMode ? "#6B7280" : "#9CA3AF",
            }}
            selectedTextStyle={{
              fontSize: 12,
              color: isDarkMode ? "#E5E7EB" : "#111827",
            }}
            selectedStyle={{
              borderRadius: 10,
              backgroundColor: isDarkMode ? "#374151" : "#E0E7FF",
              padding: 4,
            }}
            containerStyle={{
              borderRadius: 12,
              overflow: "hidden",
              backgroundColor: isDarkMode ? "#1C1C1E" : "#fff",
            }}
            activeColor={isDarkMode ? "#374151" : "#F0F9FF"}
            search
            labelField="label"
            valueField="value"
            data={users}
            value={item.raisedBy.map((r: any) => r.value)}
            placeholder="Issue raised by *"
            searchPlaceholder="Search..."
            onChange={(selectedIds: string[]) => {
              const selectedUsers = users
                .filter((u: any) => selectedIds.includes(u.value))
                .map((u: any) => ({
                  value: u.value,
                  label: u.label,
                }));
              onUpdate("raisedBy", selectedUsers);
              setTimeout(() => {
                dropdownRef.current?.close();
              }, 150);
            }}
          />

          <TextInput
            placeholder="Subject *"
            placeholderTextColor={isDarkMode ? "#6B7280" : "#9CA3AF"}
            value={localSubject}
            onChangeText={setLocalSubject}
            onBlur={() => handleBlur("issueSubject", localSubject)}
            multiline
            className={`rounded-xl px-4 py-3.5 font-poppins text-[15px] ${
              isDarkMode
                ? "bg-[#262626] text-white"
                : "bg-[#F3F4F6] text-gray-900"
            }`}
          />
          <TextInput
            placeholder="Meeting Discussion"
            placeholderTextColor={isDarkMode ? "#6B7280" : "#9CA3AF"}
            value={localDescription}
            onChangeText={setLocalDescription}
            onBlur={() => handleBlur("issueDescription", localDescription)}
            multiline
            className={`rounded-xl px-4 py-3.5 font-poppins text-[15px] ${
              isDarkMode
                ? "bg-[#262626] text-white"
                : "bg-[#F3F4F6] text-gray-900"
            }`}
          />

          {/* Status Selector */}
          <View
            className={`rounded-xl px-4 py-3 flex-row items-center border ${
              isDarkMode
                ? "bg-[#262626] border-[#4B5563]"
                : "bg-[#F9FAFB] border-[#E5E7EB]"
            }`}
          >
            <Text
              className={`text-[15px] mr-3 ${
                isDarkMode ? "text-gray-400" : "text-[#888]"
              }`}
            >
              Status:
            </Text>

            <View className="flex-row items-center justify-start gap-6">
              {/* Option 1: Open */}
              <TouchableOpacity
                onPress={() => onUpdate("status", "open")}
                activeOpacity={0.8}
                className="flex-row items-center"
              >
                <HugeiconsIcon
                  icon={item.status === "open" ? Tick01Icon : CircleIcon}
                  size={20}
                  color={
                    item.status === "open"
                      ? isDarkMode ? "#F87171" : "#EF4444"
                      : isDarkMode ? "#6B7280" : "#9CA3AF"
                  }
                  className="mr-2"
                />
                <Text
                  className={`text-[14px] font-poppinsMedium ${
                    item.status === "open"
                      ? isDarkMode ? "text-red-400" : "text-red-600"
                      : isDarkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Open
                </Text>
              </TouchableOpacity>

              {/* Option 2: For Info */}
              <TouchableOpacity
                onPress={() => onUpdate("status", "forInfo")}
                activeOpacity={0.8}
                className="flex-row items-center"
              >
                <HugeiconsIcon
                  icon={item.status === "forInfo" ? Tick01Icon : CircleIcon}
                  size={20}
                  color={
                    item.status === "forInfo"
                      ? isDarkMode ? "#34D399" : "#10B981"
                      : isDarkMode ? "#6B7280" : "#9CA3AF"
                  }
                  className="mr-2"
                />
                <Text
                  className={`text-[14px] font-poppinsMedium ${
                    item.status === "forInfo"
                      ? isDarkMode ? "text-emerald-400" : "text-emerald-600"
                      : isDarkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  For Info
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Target Date */}
          <View className="flex-row items-center gap-2">
            <TouchableOpacity
              onPress={onOpenDatePicker}
              style={{
                flex: 1,
                opacity: item.targetDateForInfo ? 0.5 : 1,
              }}
              disabled={item.targetDateForInfo}
            >
              <TextInput
                placeholder="Target Date (DD-MM-YYYY) *"
                placeholderTextColor={isDarkMode ? "#6B7280" : "#9CA3AF"}
                value={
                  item.targetDate
                    ? moment(item.targetDate).format("DD-MM-YYYY")
                    : ""
                }
                editable={false}
                pointerEvents="none"
                className={`rounded-xl px-4 py-3.5 font-poppins text-[15px] border ${
                  isDarkMode
                    ? "bg-[#262626] text-white border-[#4B5563]"
                    : "bg-[#F3F4F6] text-gray-700 border-[#E5E7EB]"
                }`}
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                if (item.targetDateForInfo) {
                  onUpdate("targetDateForInfo", false);
                } else {
                  onUpdate("targetDate", null);
                  onUpdate("targetDateForInfo", true);
                }
              }}
              className={`px-4 py-3.5 rounded-xl border flex-row items-center justify-center ${
                item.targetDateForInfo
                  ? isDarkMode
                    ? "bg-emerald-500/20 border-emerald-500/50"
                    : "bg-emerald-50 border-emerald-500"
                  : isDarkMode
                    ? "bg-[#262626] border-[#4B5563]"
                    : "bg-[#F3F4F6] border-[#E5E7EB]"
              }`}
            >
              <Text
                className={`text-[14px] font-medium ${
                  item.targetDateForInfo
                    ? isDarkMode ? "text-emerald-400" : "text-emerald-600"
                    : isDarkMode ? "text-gray-400" : "text-gray-600"
                }`}
              >
                {item.targetDateForInfo ? "For Info ✓" : "For Info"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Responsibility */}
          <View className="flex-row items-center">
            <View
              style={{
                flex: 1,
                opacity: item.responsibilityForInfo ? 0.5 : 1,
              }}
            >
              <MultiSelect
                ref={responsibilityRef}
                style={{
                  height: 48,
                  borderColor: isDarkMode ? "#4B5563" : "#E5E7EB",
                  borderWidth: 1,
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  backgroundColor: isDarkMode ? "#262626" : "#F3F4F6",
                }}
                placeholderStyle={{
                  fontSize: 14,
                  color: isDarkMode ? "#6B7280" : "#9CA3AF",
                }}
                selectedTextStyle={{
                  fontSize: 12,
                  color: isDarkMode ? "#E5E7EB" : "#111827",
                }}
                selectedStyle={{
                  borderRadius: 10,
                  backgroundColor: isDarkMode ? "#374151" : "#E0E7FF",
                  padding: 4,
                }}
                containerStyle={{
                  borderRadius: 12,
                  overflow: "hidden",
                  backgroundColor: isDarkMode ? "#1C1C1E" : "#fff",
                }}
                activeColor={isDarkMode ? "#374151" : "#F0F9FF"}
                search
                labelField="label"
                valueField="value"
                data={users}
                value={item.responsibility.map((r: any) => r.value)}
                placeholder="Select responsible users *"
                searchPlaceholder="Search..."
                onChange={(selectedIds: string[]) => {
                  const selectedUsers = users
                    .filter((u: any) => selectedIds.includes(u.value))
                    .map((u: any) => ({
                      value: u.value,
                      label: u.label,
                    }));
                  onUpdate("responsibility", selectedUsers);
                  setTimeout(() => {
                    responsibilityRef.current?.close();
                  }, 80);
                }}
                disable={item.responsibilityForInfo}
              />
            </View>

            <TouchableOpacity
              onPress={() => {
                if (item.responsibilityForInfo) {
                  onUpdate("responsibilityForInfo", false);
                } else {
                  onUpdate("responsibility", []);
                  onUpdate("responsibilityForInfo", true);
                }
              }}
              className={`ml-2 px-4 py-3.5 rounded-xl border flex-row items-center justify-center ${
                item.responsibilityForInfo
                  ? isDarkMode
                    ? "bg-emerald-500/20 border-emerald-500/50"
                    : "bg-emerald-50 border-emerald-500"
                  : isDarkMode
                    ? "bg-[#262626] border-[#4B5563]"
                    : "bg-[#F3F4F6] border-[#E5E7EB]"
              }`}
            >
              <Text
                className={`text-[14px] font-medium ${
                  item.responsibilityForInfo
                    ? isDarkMode ? "text-emerald-400" : "text-emerald-600"
                    : isDarkMode ? "text-gray-400" : "text-gray-600"
                }`}
              >
                {item.responsibilityForInfo ? "For Info ✓" : "For Info"}
              </Text>
            </TouchableOpacity>
          </View>

          <TextInput
            placeholder="Remarks (if any)"
            placeholderTextColor={isDarkMode ? "#6B7280" : "#9CA3AF"}
            value={localRemarks}
            onChangeText={setLocalRemarks}
            onBlur={() => handleBlur("remarks", localRemarks)}
            multiline
            className={`rounded-xl px-4 py-3.5 font-poppins text-[15px] ${
              isDarkMode
                ? "bg-[#262626] text-white"
                : "bg-[#F3F4F6] text-gray-900"
            }`}
          />

          {showDelete && (
            <View className="flex-row justify-end space-x-4 mt-2">
              <TouchableOpacity
                onPress={onDeleteRequest}
                className="flex-row items-center"
              >
                <HugeiconsIcon
                  icon={Delete02Icon}
                  size={14}
                  color="#EF4444"
                  className="mr-1"
                />
                <Text className="text-red-500 font-poppinsMedium text-sm">
                  Remove Minute
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Collapsible>
    </View>
  );
}));

export default MinuteItem;
