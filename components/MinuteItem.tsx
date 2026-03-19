import React, { memo, useState, useEffect, useRef, forwardRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Platform,
  Animated,
} from "react-native";
import { MultiSelect } from "react-native-element-dropdown";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  ArrowDown01Icon,
  ArrowRight01Icon,
  CircleIcon,
  Cancel01Icon,
  MinusSignIcon,
  Upload01Icon,
} from "@hugeicons/core-free-icons";
import moment from "moment";

interface MinuteItemProps {
  item: any;
  drag: () => void;
  isActive: boolean;
  expanded: boolean;
  onToggleExpand: (index: number) => void;
  onUpdate: (index: number, field: string | object, value?: any) => void;
  onDeleteRequest: (index: number) => void;
  users: any[];
  showDelete: boolean;
  isDarkMode: boolean;
  onOpenDatePicker: (index: number) => void;
  onPickImage: (index: number) => void;
  onDeleteImage: (index: number, uri: string) => void;
  getIndex: () => number | undefined;
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
  onOpenDatePicker,
  onPickImage,
  onDeleteImage,
  getIndex
}, ref) => {
  const [localSubject, setLocalSubject] = useState(item.issueSubject);
  const [localDescription, setLocalDescription] = useState(item.issueDescription);
  const [localRemarks, setLocalRemarks] = useState(item.remarks);
  const dropdownRef = useRef<any>(null);
  const responsibilityRef = useRef<any>(null);

  useEffect(() => {
    if (item.issueSubject !== localSubject) setLocalSubject(item.issueSubject);
    if (item.issueDescription !== localDescription) setLocalDescription(item.issueDescription);
    if (item.remarks !== localRemarks) setLocalRemarks(item.remarks);
  }, [item.issueSubject, item.issueDescription, item.remarks]);

  const handleBlur = (field: string, value: any) => {
    const idx = getIndex();
    if (idx !== undefined) onUpdate(idx, field, value);
  };
  
  const handleUpdate = (field: string | object, value?: any) => {
    const idx = getIndex();
    if (idx !== undefined) onUpdate(idx, field, value);
  };

  const inputBgColor = isDarkMode ? "#1A1A1A" : "#F0F3F7";
  const cardBgColor = isDarkMode ? "#0D0D0D" : "#F6F8FA";
  const borderColor = isDarkMode ? "#262626" : "#E0E5EB";

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
        className={`flex-row justify-between items-center px-4 py-3.5 ${
            isActive ? (isDarkMode ? "bg-gray-800" : "bg-gray-100") : ""
        } ${expanded ? (isDarkMode ? "border-b border-[#262626]" : "border-b border-[#E0E5EB]") : ""}`}
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

      {expanded && (
        <View className="px-4 py-4 gap-3">
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
              fontFamily: "Poppins_400Regular"
            }}
            selectedTextStyle={{
              fontSize: 12,
              color: isDarkMode ? "#E5E7EB" : "#111827",
              fontFamily: "Poppins_400Regular"
            }}
            selectedStyle={{
              display: 'none'
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
            search
            labelField="label"
            valueField="value"
            data={users}
            value={(item.raisedBy || []).map((r: any) => r.value)}
            placeholder="Issue raised by *"
            searchPlaceholder="Search..."
            renderLeftIcon={() => null}
            onChange={(selectedIds: string[]) => {
              const selectedUsers = users
                .filter((u: any) => selectedIds.includes(u.value))
                .map((u: any) => ({
                  value: u.value,
                  label: u.label,
                }));
              handleUpdate("raisedBy", selectedUsers);
              setTimeout(() => {
                dropdownRef.current?.close();
              }, 80);
            }}
          />

          {/* Raised By Chips */}
          {(item.raisedBy || []).length > 0 && (
            <View className="flex-row flex-wrap gap-2">
              {(item.raisedBy || []).map((r: any) => (
                <TouchableOpacity
                  key={r.value}
                  onPress={() => {
                    const filtered = (item.raisedBy || []).filter((u: any) => u.value !== r.value);
                    handleUpdate("raisedBy", filtered);
                  }}
                  className={`flex-row items-center px-4 py-2 rounded-lg border ${
                    isDarkMode ? "bg-[#1A1A1A] border-[#413E47]" : "bg-white border-[#E0E5EB]"
                  }`}
                >
                  <Text className={`text-sm font-poppins mr-2 ${isDarkMode ? "text-gray-200" : "text-gray-900"}`}>
                    {r.label}
                  </Text>
                  <HugeiconsIcon icon={Cancel01Icon} size={14} color={isDarkMode ? "#FFF" : "#000"} />
                </TouchableOpacity>
              ))}
            </View>
          )}

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

          {/* Status Selector - Match Radio UI */}
          <View
            className="rounded-xl px-4 py-3 flex-row items-center"
            style={{ backgroundColor: inputBgColor }}
          >
            <Text
              className={`text-[14px] font-poppins mr-4 ${
                isDarkMode ? "text-gray-400" : "text-gray-500"
              }`}
            >
              Status :
            </Text>

            <View className="flex-row items-center gap-6">
              <TouchableOpacity
                onPress={() => {
                  if (item.status !== "open") handleUpdate("status", "open");
                }}
                activeOpacity={0.8}
                className="flex-row items-center"
              >
                <View
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: 9,
                    borderWidth: 2,
                    borderColor: '#EF4444',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 6
                  }}
                >
                  {item.status === "open" && (
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444' }} />
                  )}
                </View>
                <Text
                  className={`text-[15px] font-poppins ${
                    item.status === "open" ? "text-red-500" : (isDarkMode ? "text-gray-400" : "text-gray-600")
                  }`}
                >
                  Open
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  if (item.status !== "forInfo") handleUpdate("status", "forInfo");
                }}
                activeOpacity={0.8}
                className="flex-row items-center"
              >
                <View
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: 9,
                    borderWidth: 2,
                    borderColor: '#10B981',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 6
                  }}
                >
                  {item.status === "forInfo" && (
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981' }} />
                  )}
                </View>
                <Text
                  className={`text-[15px] font-poppins ${
                    item.status === "forInfo" ? "text-emerald-500" : (isDarkMode ? "text-gray-400" : "text-gray-600")
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
              onPress={() => {
                const idx = getIndex();
                if (idx !== undefined) onOpenDatePicker(idx);
              }}
              activeOpacity={0.7}
              style={{
                flex: 1,
                opacity: item.targetDateForInfo ? 0.5 : 1,
                backgroundColor: inputBgColor,
                borderRadius: 12,
                height: 48,
                justifyContent: "center",
                paddingHorizontal: 16,
               
                borderColor: isDarkMode ? "#333" : "#E0E5EB",
              }}
              disabled={item.targetDateForInfo}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontFamily: "Poppins_400Regular",
                  color: item.targetDate 
                    ? (isDarkMode ? "#fff" : "#111827") 
                    : (isDarkMode ? "#6B7280" : "#9CA3AF")
                }}
              >
                {item.targetDate
                  ? moment(item.targetDate).format("DD-MM-YYYY")
                  : "Target Date *"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                const newVal = !item.targetDateForInfo;
                if (newVal) {
                  handleUpdate({ targetDate: null, targetDateForInfo: true });
                } else {
                  handleUpdate("targetDateForInfo", false);
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
                For Info
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
                  fontFamily: "Poppins_400Regular"
                }}
                selectedTextStyle={{
                  fontSize: 12,
                  color: isDarkMode ? "#E5E7EB" : "#111827",
                  fontFamily: "Poppins_400Regular"
                }}
                selectedStyle={{
                  display: 'none'
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
                search
                labelField="label"
                valueField="value"
                data={users}
                value={(item.responsibility || []).map((r: any) => r.value)}
                placeholder="Responsible *"
                searchPlaceholder="Search..."
                renderLeftIcon={() => null}
                onChange={(selectedIds: string[]) => {
                  const selectedUsers = users
                    .filter((u: any) => selectedIds.includes(u.value))
                    .map((u: any) => ({
                      value: u.value,
                      label: u.label,
                    }));
                  handleUpdate("responsibility", selectedUsers);
                  setTimeout(() => {
                    responsibilityRef.current?.close();
                  }, 80);
                }}
                disable={item.responsibilityForInfo}
              />
            </View>

            <TouchableOpacity
              onPress={() => {
                const newVal = !item.responsibilityForInfo;
                if (newVal) {
                    handleUpdate({ responsibility: [], responsibilityForInfo: true });
                } else {
                    handleUpdate("responsibilityForInfo", false);
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
                For Info
              </Text>
            </TouchableOpacity>
          </View>

          {/* Responsibility Chips */}
          {(item.responsibility || []).length > 0 && !item.responsibilityForInfo && (
            <View className="flex-row flex-wrap gap-2">
              {(item.responsibility || []).map((r: any) => (
                <TouchableOpacity
                  key={r.value}
                  onPress={() => {
                    const filtered = (item.responsibility || []).filter((u: any) => u.value !== r.value);
                    handleUpdate("responsibility", filtered);
                  }}
                  className={`flex-row items-center px-4 py-2 rounded-lg border ${
                    isDarkMode ? "bg-[#1A1A1A] border-[#413E47]" : "bg-white border-[#E0E5EB]"
                  }`}
                >
                  <Text className={`text-sm font-poppins mr-2 ${isDarkMode ? "text-gray-200" : "text-gray-900"}`}>
                    {r.label}
                  </Text>
                  <HugeiconsIcon icon={Cancel01Icon} size={14} color={isDarkMode ? "#FFF" : "#000"} />
                </TouchableOpacity>
              ))}
            </View>
          )}

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

          {/* Upload Image Section */}
          <View className="mt-2 rounded-2xl p-4 gap-3" style={{ backgroundColor: inputBgColor }}>
            <View
              className={`rounded-2xl p-5 items-center justify-center ${isDarkMode ? "bg-[#0D0D0D]" : "bg-white"}`}
              style={{ minHeight: 120, borderStyle: 'dashed', borderWidth: 1, borderColor: isDarkMode ? "#333" : "#D1D5DB" }}
            >
              <TouchableOpacity
                onPress={() => {
                  const idx = getIndex();
                  if (idx !== undefined) onPickImage(idx);
                }}
                className="bg-black rounded-xl px-8 py-2.5 flex-row items-center mb-2"
                activeOpacity={0.8}
              >
                <HugeiconsIcon icon={Upload01Icon} size={18} color="white" />
                <Text className="text-white font-poppinsMedium ml-2.5">Upload</Text>
              </TouchableOpacity>
              <Text className={`text-[13px] font-poppins ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                Choose Image
              </Text>
            </View>

            {/* Image Previews */}
            {(item.images || []).length > 0 && (
              <View className="flex-row flex-wrap gap-3 mt-1">
                {(item.images || []).map((uri: string, idx: number) => (
                  <View key={idx} className="relative">
                    <Image
                      source={{ uri }}
                      style={{ width: 70, height: 70, borderRadius: 12 }}
                    />
                    <TouchableOpacity
                      onPress={() => {
                        const idx = getIndex();
                        if (idx !== undefined) onDeleteImage(idx, uri);
                      }}
                      className="absolute -top-1.5 -right-1.5 bg-black/60 rounded-full p-1"
                    >
                      <HugeiconsIcon icon={Cancel01Icon} size={12} color="white" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>

          <View className="flex-row justify-between items-center mt-2 px-1">
            {item.fromForwardedId ? (
              <View className="flex-row items-center">
                <View className="w-5 h-5 rounded-full bg-blue-500 items-center justify-center mr-1.5">
                  <HugeiconsIcon icon={ArrowRight01Icon} size={10} color="white" />
                </View>
                <Text className="text-blue-500 font-poppinsSemiBold text-[13px]">
                  From Forwarded
                </Text>
              </View>
            ) : <View />}

            {showDelete && (
              <TouchableOpacity
                onPress={() => {
                  const idx = getIndex();
                  if (idx !== undefined) onDeleteRequest(idx);
                }}
                className="flex-row items-center"
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
      )}
    </View>
  );
}));

export default MinuteItem;
