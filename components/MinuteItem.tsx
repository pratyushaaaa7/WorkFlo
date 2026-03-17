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
  Tick01Icon,
  CircleIcon,
  Cancel01Icon,
  Search01Icon,
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

  const inputBgColor = isDarkMode ? "#121212" : "#F6F8FA";

  return (
    <View
      ref={ref}
      collapsable={false}
      className="mb-3 overflow-hidden"
      style={{
        borderRadius: 12,
        backgroundColor: isDarkMode ? "#000" : "#fff",
        borderWidth: isActive ? 1.5 : 0,
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
        className={`flex-row justify-between items-center px-4 py-3.5 ${
            isActive ? (isDarkMode ? "bg-gray-800" : "bg-gray-100") : ""
        }`}
      >
        <Text
          numberOfLines={1}
          className={`font-poppinsMedium text-[15px] flex-1 mr-2 ${
            isDarkMode ? "text-white" : "text-gray-900"
          }`}
        >
          {item.issueSubject || `Minute ${item.serialNo}`}
        </Text>
        <HugeiconsIcon
          icon={expanded ? ArrowDown01Icon : ArrowRight01Icon}
          size={18}
          color={isDarkMode ? "#9CA3AF" : "#6B7280"}
        />
      </TouchableOpacity>

      <Collapsible collapsed={!expanded} duration={300}>
        <View className="px-4 pb-4 gap-3">
          {/* Raised By */}
          <MultiSelect
            ref={dropdownRef}
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
              fontSize: 12,
              color: isDarkMode ? "#E5E7EB" : "#111827",
              fontFamily: "Poppins-Regular"
            }}
            selectedStyle={{
              borderRadius: 8,
              backgroundColor: isDarkMode ? "#262626" : "#E0E7FF",
              paddingVertical: 4,
              paddingHorizontal: 8,
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
            search
            labelField="label"
            valueField="value"
            data={users}
            value={item.raisedBy.map((r: any) => r.value)}
            placeholder="Issue raised by *"
            searchPlaceholder="Search..."
            renderLeftIcon={() => (
              <View className="mr-2">
                <HugeiconsIcon
                  icon={Search01Icon}
                  size={18}
                  color={isDarkMode ? "#9CA3AF" : "#6B7280"}
                />
              </View>
            )}
            onChange={(selectedIds: string[]) => {
              const selectedUsers = users
                .filter((u: any) => selectedIds.includes(u.value))
                .map((u: any) => ({
                  value: u.value,
                  label: u.label,
                }));
              onUpdate("raisedBy", selectedUsers);
            }}
          />

          <TextInput
            placeholder="Subject *"
            placeholderTextColor={isDarkMode ? "#6B7280" : "#9CA3AF"}
            value={localSubject}
            onChangeText={setLocalSubject}
            onBlur={() => handleBlur("issueSubject", localSubject)}
            multiline
            className="rounded-xl px-4 py-3.5 font-poppins text-[15px]"
            style={{ backgroundColor: inputBgColor, color: isDarkMode ? "#fff" : "#111827" }}
          />
          
          <TextInput
            placeholder="Meeting Discussion"
            placeholderTextColor={isDarkMode ? "#6B7280" : "#9CA3AF"}
            value={localDescription}
            onChangeText={setLocalDescription}
            onBlur={() => handleBlur("issueDescription", localDescription)}
            multiline
            className="rounded-xl px-4 py-3.5 font-poppins text-[15px]"
            style={{ backgroundColor: inputBgColor, color: isDarkMode ? "#fff" : "#111827" }}
          />

          {/* Status Selector */}
          <View
            className="rounded-xl px-4 py-3 flex-row items-center"
            style={{ backgroundColor: inputBgColor }}
          >
            <Text
              className={`text-[14px] font-poppins mr-3 ${
                isDarkMode ? "text-gray-400" : "text-gray-500"
              }`}
            >
              Status:
            </Text>

            <View className="flex-row items-center gap-6">
              <TouchableOpacity
                onPress={() => onUpdate("status", "open")}
                activeOpacity={0.8}
                className="flex-row items-center"
              >
                <HugeiconsIcon
                  icon={item.status === "open" ? Tick01Icon : CircleIcon}
                  size={18}
                  color={
                    item.status === "open"
                      ? isDarkMode ? "#F87171" : "#EF4444"
                      : isDarkMode ? "#6B7280" : "#9CA3AF"
                  }
                  className="mr-1.5"
                />
                <Text
                  className={`text-[13px] font-poppinsMedium ${
                    item.status === "open"
                      ? isDarkMode ? "text-red-400" : "text-red-600"
                      : isDarkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Open
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => onUpdate("status", "forInfo")}
                activeOpacity={0.8}
                className="flex-row items-center"
              >
                <HugeiconsIcon
                  icon={item.status === "forInfo" ? Tick01Icon : CircleIcon}
                  size={18}
                  color={
                    item.status === "forInfo"
                      ? isDarkMode ? "#34D399" : "#10B981"
                      : isDarkMode ? "#6B7280" : "#9CA3AF"
                  }
                  className="mr-1.5"
                />
                <Text
                  className={`text-[13px] font-poppinsMedium ${
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
                placeholder="Target Date *"
                placeholderTextColor={isDarkMode ? "#6B7280" : "#9CA3AF"}
                value={
                  item.targetDate
                    ? moment(item.targetDate).format("DD-MM-YYYY")
                    : ""
                }
                editable={false}
                pointerEvents="none"
                className="rounded-xl px-4 py-3.5 font-poppins text-[15px]"
                style={{ backgroundColor: inputBgColor, color: isDarkMode ? "#fff" : "#111827" }}
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
              className={`px-4 py-3.5 rounded-xl flex-row items-center justify-center ${
                item.targetDateForInfo
                  ? isDarkMode
                    ? "bg-emerald-500/10 border border-emerald-500/30"
                    : "bg-emerald-50 border border-emerald-500/30"
                  : ""
              }`}
              style={!item.targetDateForInfo ? { backgroundColor: inputBgColor } : {}}
            >
              <Text
                className={`text-[13px] font-poppinsMedium ${
                  item.targetDateForInfo
                    ? isDarkMode ? "text-emerald-400" : "text-emerald-600"
                    : isDarkMode ? "text-gray-400" : "text-gray-500"
                }`}
              >
                {item.targetDateForInfo ? "For Info ✓" : "For Info"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Responsibility */}
          <View className="flex-row items-center gap-2">
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
                  fontSize: 12,
                  color: isDarkMode ? "#E5E7EB" : "#111827",
                  fontFamily: "Poppins-Regular"
                }}
                selectedStyle={{
                  borderRadius: 8,
                  backgroundColor: isDarkMode ? "#262626" : "#E0E7FF",
                  paddingVertical: 4,
                  paddingHorizontal: 8,
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
                search
                labelField="label"
                valueField="value"
                data={users}
                value={item.responsibility.map((r: any) => r.value)}
                placeholder="Responsible *"
                searchPlaceholder="Search..."
                renderLeftIcon={() => (
                    <View className="mr-2">
                      <HugeiconsIcon
                        icon={Search01Icon}
                        size={18}
                        color={isDarkMode ? "#9CA3AF" : "#6B7280"}
                      />
                    </View>
                  )}
                onChange={(selectedIds: string[]) => {
                  const selectedUsers = users
                    .filter((u: any) => selectedIds.includes(u.value))
                    .map((u: any) => ({
                      value: u.value,
                      label: u.label,
                    }));
                  onUpdate("responsibility", selectedUsers);
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
              className={`px-4 py-3.5 rounded-xl flex-row items-center justify-center ${
                item.responsibilityForInfo
                  ? isDarkMode
                    ? "bg-emerald-500/10 border border-emerald-500/30"
                    : "bg-emerald-50 border border-emerald-500/30"
                  : ""
              }`}
              style={!item.responsibilityForInfo ? { backgroundColor: inputBgColor } : {}}
            >
              <Text
                className={`text-[13px] font-poppinsMedium ${
                  item.responsibilityForInfo
                    ? isDarkMode ? "text-emerald-400" : "text-emerald-600"
                    : isDarkMode ? "text-gray-400" : "text-gray-500"
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
            className="rounded-xl px-4 py-3.5 font-poppins text-[15px]"
            style={{ backgroundColor: inputBgColor, color: isDarkMode ? "#fff" : "#111827" }}
          />

          {showDelete && (
             <TouchableOpacity
             onPress={onDeleteRequest}
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

export default MinuteItem;
