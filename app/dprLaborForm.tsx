import { Ionicons } from "@expo/vector-icons";
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import React, { useContext, useEffect, useState, useMemo } from "react";
import {
  Animated,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { Dropdown } from "react-native-element-dropdown";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import uuid from "react-native-uuid";
import DateTimePicker from "@react-native-community/datetimepicker";
import moment from "moment";
import { AuthContext } from "../context/AuthContext";
import api from "../lib/api";

interface Vendor {
  id: string;
  name: string;
  expertise: string;
  date?: string;
  skillLabor: number;
  unskillLabor: number;
  staffLabor: number;
  // keep laborCount for backward compat with downstream
  laborCount: number;
}

const FieldRow = ({
  placeholder,
  value,
  onChangeText,
  keyboardType = "default",
  isDark,
  isDropdown = false,
  dropdownData = [],
}: {
  placeholder: string;
  value: string;
  onChangeText: (t: string) => void;
  keyboardType?: "default" | "number-pad";
  isDark: boolean;
  isDropdown?: boolean;
  dropdownData?: { label: string; value: string }[];
}) => (
  <View
    style={{
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      borderRadius: 10,
      paddingHorizontal: 12,
      backgroundColor: isDark ? "#1A1A1A" : "#F0F3F7",
      minHeight: 45,
    }}
  >
    {isDropdown ? (
      <Dropdown
        style={{
          flex: 1,
          height: 40,
        }}
        placeholderStyle={{
          fontSize: 12,
          fontFamily: "Poppins_400Regular",
          color: isDark ? "#555" : "#9CA3AF",
          lineHeight: 12,
          letterSpacing: -0.18,
        }}
        selectedTextStyle={{
          fontSize: 15,
          fontFamily: "Poppins_400Regular",
          color: isDark ? "#FFF" : "#111",
        }}
        itemTextStyle={{
          fontSize: 14,
          fontFamily: "Poppins_400Regular",
          color: isDark ? "#FFF" : "#000",
        }}
        containerStyle={{
          borderRadius: 12,
          backgroundColor: isDark ? "#1A1A1A" : "#FFFFFF",
          borderWidth: 0,
          elevation: 5,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.2,
          shadowRadius: 4,
        }}
        activeColor={isDark ? "#252525" : "#F3F4F6"}
        data={dropdownData}
        labelField="label"
        valueField="value"
        placeholder={placeholder}
        value={value}
        onChange={(item) => onChangeText(item.value)}
        renderRightIcon={() => (
          <Ionicons
            name="chevron-down"
            size={18}
            color={isDark ? "#555" : "#9CA3AF"}
          />
        )}
      />
    ) : (
      <TextInput
        placeholder={placeholder}
        placeholderTextColor={isDark ? "#555" : "#9CA3AF"}
        value={value === "0" ? "" : value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        style={{
          flex: 1,
          color: isDark ? "#FFF" : "#111",
          fontFamily: "Poppins_400Regular",
          fontSize: value ? 15 : 12,
          lineHeight: value ? undefined : 12,
          letterSpacing: value ? undefined : -0.18,
        }}
      />
    )}
  </View>
);

const LaborForm = () => {
  const router = useRouter();
  const { projectName, company, projectId, teamLeaders, teamMembers, partnerInCharge } =
    useLocalSearchParams();

  const isDark = useColorScheme() === "dark";
  const insets = useSafeAreaInsets();
  
  const defaultVendor = (): Vendor => ({
    id: uuid.v4().toString(),
    name: "",
    expertise: "",
    date: moment().format("YYYY-MM-DD"),
    skillLabor: 0,
    unskillLabor: 0,
    staffLabor: 0,
    laborCount: 0,
  });

  const [projectedVendors, setProjectedVendors] = useState<Vendor[]>([]);
  const [actualVendors, setActualVendors] = useState<Vendor[]>([defaultVendor()]);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const isInitialLoadDone = React.useRef(false);

  // States for new UI features
  const [activeTab, setActiveTab] = useState<"Projected" | "Actual">("Projected");
  const [collapsedVendors, setCollapsedVendors] = useState<string[]>([]);
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [selectedVendorIdForDate, setSelectedVendorIdForDate] = useState<string | null>(null);

  const pIdStr = Array.isArray(projectId) ? projectId[0] : (projectId as string);
  const storageKey = `reportData_${pIdStr || "default"}`;

  const auth = useContext(AuthContext);
  const token = auth?.token;

  const [projectVendors, setProjectVendors] = useState<
    { label: string; value: string }[]
  >([]);
  const [rawProjectVendors, setRawProjectVendors] = useState<any[]>([]);

  const fetchProjectVendors = React.useCallback(async () => {
    if (!projectId || !token) return;
    try {
      const res = await api.get(`/labor/project/${projectId}/vendors`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      let vendorsArr = [];
      if (Array.isArray(res.data.vendors)) {
        vendorsArr = res.data.vendors;
      } else if (Array.isArray(res.data.projectVendors)) {
        vendorsArr = res.data.projectVendors;
      } else if (Array.isArray(res.data)) {
        vendorsArr = res.data;
      }
      setRawProjectVendors(vendorsArr);

      const mapped = vendorsArr.map((v: any) => ({
        label: v.individualName || v.name || "Unknown",
        value: v.individualName || v.name || "",
      }));
      setProjectVendors(mapped);
    } catch (err) {
      console.error("Error fetching project vendors:", err);
    }
  }, [projectId, token]);

  useEffect(() => {
    const showSubscription = Keyboard.addListener("keyboardDidShow", () => {
      setIsKeyboardVisible(true);
    });
    const hideSubscription = Keyboard.addListener("keyboardDidHide", () => {
      setIsKeyboardVisible(false);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      fetchProjectVendors();
      const loadSaved = async () => {
        isInitialLoadDone.current = false;
        try {
          const saved = await AsyncStorage.getItem(storageKey);
          if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed.actualVendors) {
              const formattedActual = parsed.actualVendors.map((v: any) => ({
                ...v,
                date: v.date || moment().format("YYYY-MM-DD"),
                staffLabor: v.staffLabor || 0,
              }));
              setActualVendors(formattedActual);
            } else if (parsed.vendors && parsed.vendors.length > 0) {
              const formattedActual = parsed.vendors.map((v: any) => ({
                ...v,
                date: v.date || moment().format("YYYY-MM-DD"),
                staffLabor: v.staffLabor || 0,
              }));
              setActualVendors(formattedActual);
            } else {
              setActualVendors([defaultVendor()]);
            }

            if (parsed.projectedVendors) {
              const formattedProjected = parsed.projectedVendors.map((v: any) => ({
                ...v,
                date: v.date || moment().format("YYYY-MM-DD"),
                staffLabor: v.staffLabor || 0,
              }));
              setProjectedVendors(formattedProjected);
            } else {
              setProjectedVendors([]);
            }
          } else {
            setProjectedVendors([]);
            setActualVendors([defaultVendor()]);
          }
        } catch (err) {
          console.log("Error loading saved vendors:", err);
          setProjectedVendors([]);
          setActualVendors([defaultVendor()]);
        } finally {
          isInitialLoadDone.current = true;
        }
      };
      
      loadSaved();

      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();
      
    }, [projectId, storageKey, fetchProjectVendors])
  );

  useEffect(() => {
    const autoSave = async () => {
      if (isInitialLoadDone.current) {
        try {
          await AsyncStorage.setItem(
            storageKey,
            JSON.stringify({ projectedVendors, actualVendors, projectName }),
          );
        } catch (err) {
          console.error("Auto-save failed:", err);
        }
      }
    };
    autoSave();
  }, [projectedVendors, actualVendors, projectId]);

  const addVendor = () => {
    if (activeTab === "Projected") {
      setProjectedVendors((prev) => [...prev, defaultVendor()]);
    } else {
      setActualVendors((prev) => [...prev, defaultVendor()]);
    }
  };

  const updateVendor = (id: string, field: string, value: string) => {
    const updateFn = (prev: Vendor[]) =>
      prev.map((v) => {
        if (v.id !== id) return v;
        const isNumeric = ["skillLabor", "unskillLabor", "staffLabor", "laborCount"].includes(
          field,
        );
        const updated = {
          ...v,
          [field]: isNumeric ? parseInt(value || "0") : value,
        };
        // keep laborCount in sync
        updated.laborCount =
          (updated.skillLabor || 0) + (updated.unskillLabor || 0) + (updated.staffLabor || 0);
        return updated;
      });

    if (activeTab === "Projected") {
      setProjectedVendors(updateFn);
    } else {
      setActualVendors(updateFn);
    }
  };

  const removeVendor = (id: string) => {
    if (activeTab === "Projected") {
      setProjectedVendors((prev) => prev.filter((v) => v.id !== id));
    } else {
      setActualVendors((prev) => prev.filter((v) => v.id !== id));
    }
  };

  const toggleCollapse = (id: string) => {
    setCollapsedVendors((prev) =>
      prev.includes(id) ? prev.filter((vId) => vId !== id) : [...prev, id]
    );
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setDatePickerVisible(false);
    if (selectedDate && selectedVendorIdForDate) {
      const formattedDate = moment(selectedDate).format("YYYY-MM-DD");
      updateVendor(selectedVendorIdForDate, "date", formattedDate);
    }
    setSelectedVendorIdForDate(null);
  };

  const defaultExpertises = [
    "Civil Work",
    "Electrical",
    "Plumbing",
    "Masonry",
    "Carpentry",
    "Painting",
    "Site Supervision"
  ];

  const expertiseOptions = useMemo(() => {
    const list = new Set<string>();
    rawProjectVendors.forEach((v) => {
      if (v.expertise) {
        if (Array.isArray(v.expertise)) {
          v.expertise.forEach((e: string) => {
            if (e && e !== "-") list.add(e);
          });
        } else if (typeof v.expertise === "string" && v.expertise !== "-") {
          list.add(v.expertise);
        }
      }
    });
    defaultExpertises.forEach((e) => list.add(e));
    return Array.from(list).map((exp) => ({ label: exp, value: exp }));
  }, [rawProjectVendors]);

  const currentVendorsList = activeTab === "Projected" ? projectedVendors : actualVendors;
  const totalSkilled = currentVendorsList.reduce((sum, v) => sum + (v.skillLabor || 0), 0);
  const totalUnskilled = currentVendorsList.reduce(
    (sum, v) => sum + (v.unskillLabor || 0),
    0,
  );
  const totalStaff = currentVendorsList.reduce((sum, v) => sum + (v.staffLabor || 0), 0);
  const totalLabor = totalSkilled + totalUnskilled + totalStaff;

  const saveAndNext = async () => {
    const invalidActualVendor = actualVendors.find((v) => !v.name || v.name.trim() === "");
    if (actualVendors.length === 0 || invalidActualVendor) {
      Toast.show({
        type: "error",
        text1: "Validation",
        text2: "Please select a vendor for all actual entries",
        position: "bottom",
      });
      return;
    }

    const invalidProjectedVendor = projectedVendors.find((v) => !v.name || v.name.trim() === "");
    if (invalidProjectedVendor) {
      Toast.show({
        type: "error",
        text1: "Validation",
        text2: "Please select a vendor for all projected entries",
        position: "bottom",
      });
      return;
    }

    await AsyncStorage.setItem(
      storageKey,
      JSON.stringify({ projectedVendors, actualVendors, projectName }),
    );

    const actualSkilled = actualVendors.reduce((sum, v) => sum + (v.skillLabor || 0), 0);
    const actualUnskilled = actualVendors.reduce((sum, v) => sum + (v.unskillLabor || 0), 0);
    const actualStaff = actualVendors.reduce((sum, v) => sum + (v.staffLabor || 0), 0);
    const actualTotalLabor = actualSkilled + actualUnskilled + actualStaff;

    router.push({
      pathname: "/reportForm",
      params: {
        projectName,
        projectId,
        company,
        teamLeaders,
        teamMembers,
        partnerInCharge,
        vendors: JSON.stringify(actualVendors),
        projectedVendors: JSON.stringify(projectedVendors),
        totalLabor: actualTotalLabor.toString(),
      },
    });
  };

  const isFormInvalid =
    actualVendors.length === 0 ||
    actualVendors.some((v) => !v.name || v.name.trim() === "") ||
    projectedVendors.some((v) => !v.name || v.name.trim() === "");

  return (
    <KeyboardAvoidingView
      style={{
        flex: 1,
        backgroundColor: isDark ? "#000" : "#FBFCFD",
      }}
      behavior={Platform.OS === "ios" ? "padding" : "padding"}
    >
      {/* Header */}
      <View
        style={{
          backgroundColor: isDark ? "#000" : "#FBFCFD",
          paddingBottom: 6,
          paddingHorizontal: 20,
        }}
        className="pt-14"
      >
        <TouchableOpacity
          onPress={() => router.back()}
          className="flex-row items-center"
          activeOpacity={0.7}
        >
          <HugeiconsIcon
            icon={ArrowLeft01Icon}
            size={24}
            color={isDark ? "#fff" : "#000"}
          />
          <Text
            style={{ color: isDark ? "#fff" : "#000" }}
            className="text-xl font-dmSemiBold ml-3"
          >
            Create Labor Report
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View
        style={{
          flexDirection: "row",
          borderBottomWidth: 1,
          borderBottomColor: isDark ? "#111" : "#F0F3F7",
        }}
      >
        {["Projected", "Actual"].map((tab) => {
          const isActive = activeTab === tab;
          return (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab as "Projected" | "Actual")}
              style={{
                flex: 1,
                paddingVertical: 12,
                alignItems: "center",
                borderBottomWidth: isActive ? 2 : 0,
                borderBottomColor: "#5B4CCC",
              }}
              activeOpacity={0.8}
            >
              <Text
                style={{
                  color: isActive ? "#5B4CCC" : (isDark ? "#555" : "#9CA3AF"),
                  fontFamily: isActive ? "Poppins_600SemiBold" : "Poppins_400Regular",
                  fontSize: 16,
                }}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Labor Statistics Row */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 20,
          paddingVertical: 12,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Text
            style={{ color: isDark ? "#E5E7EB" : "#111" }}
            className="text-sm font-poppinsMedium"
          >
            Skilled :{" "}
            <Text className="font-poppinsMedium">{totalSkilled}</Text>
          </Text>

          <View
            style={{
              width: 1,
              height: 14,
              backgroundColor: isDark ? "#413E47" : "#E0E5EB",
              marginHorizontal: 12,
            }}
          />

          <Text
            style={{ color: isDark ? "#E5E7EB" : "#111" }}
            className="text-sm font-poppinsMedium"
          >
            Unskilled :{" "}
            <Text className="font-poppinsMedium">{totalUnskilled}</Text>
          </Text>
        </View>

        <View
          style={{
            backgroundColor: isDark ? "#121212" : "#F0F3F7",
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 8,
          }}
        >
          <Text
            style={{ color: isDark ? "#E5E7EB" : "#111" }}
            className="text-xs font-poppinsMedium"
          >
            Total : <Text className="font-poppinsMedium">{totalLabor}</Text>
          </Text>
        </View>
      </View>

      {/* Vendor List */}
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <FlatList
          data={activeTab === "Projected" ? projectedVendors : actualVendors}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            paddingHorizontal: 12,
            paddingBottom: 16,
          }}
          showsVerticalScrollIndicator={false}
          automaticallyAdjustKeyboardInsets={false}
          ListEmptyComponent={
            <View className="items-center justify-center mt-20 opacity-60 px-6">
              <Text
                style={{ color: isDark ? "#555" : "#9CA3AF" }}
                className="text-center font-poppins text-sm"
              >
                No vendors yet. Tap below to add your first one!
              </Text>
            </View>
          }
          renderItem={({ item, index }) => {
            const isCollapsed = collapsedVendors.includes(item.id);
            return (
              <View
                style={{
                  backgroundColor: isDark ? "#000000" : "#FFFFFF",
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: isDark ? "#1C1C1C" : "#EBEBEB",
                  marginBottom: 12,
                  overflow: "hidden",
                }}
              >
                {/* Card header — vendor label + remove + collapse */}
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingHorizontal: 16,
                    paddingTop: 14,
                    paddingBottom: 10,
                    borderBottomWidth: isCollapsed ? 0 : 1,
                    borderBottomColor: isDark ? "#1C1C1C" : "#EBEBEB",
                  }}
                >
                  <Text
                    style={{ color: isDark ? "#BBBBBB" : "#454545" }}
                    className="font-poppinsMedium text-[14px]"
                  >
                    Vendor {item.name ? `: ${item.name}` : ""}
                  </Text>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                    <TouchableOpacity
                      onPress={() => removeVendor(item.id)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={18}
                        color={isDark ? "#888" : "#888"}
                      />
                    </TouchableOpacity>
                    <View
                      style={{
                        width: 1,
                        height: 14,
                        backgroundColor: isDark ? "#1C1C1C" : "#EBEBEB",
                      }}
                    />
                    <TouchableOpacity
                      onPress={() => toggleCollapse(item.id)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={isCollapsed ? "chevron-down" : "chevron-up"}
                        size={18}
                        color={isDark ? "#888" : "#888"}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Fields */}
                {!isCollapsed && (
                  <View style={{ padding: 12, gap: 10 }}>
                    {/* Date Picker Trigger */}
                    <TouchableOpacity
                      onPress={() => {
                        setSelectedVendorIdForDate(item.id);
                        setDatePickerVisible(true);
                      }}
                      activeOpacity={0.7}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        borderRadius: 10,
                        paddingHorizontal: 12,
                        backgroundColor: isDark ? "#1A1A1A" : "#F0F3F7",
                        height: 45,
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: "Poppins_400Regular",
                          fontSize: item.date ? 15 : 12,
                          color: item.date 
                            ? (isDark ? "#FFF" : "#111") 
                            : (isDark ? "#555" : "#9CA3AF"),
                          lineHeight: item.date ? undefined : 12,
                          letterSpacing: item.date ? undefined : -0.18,
                        }}
                      >
                        {item.date ? moment(item.date).format("DD-MM-YYYY") : "Select date"}
                      </Text>
                      <Ionicons
                        name="calendar-outline"
                        size={18}
                        color={isDark ? "#555" : "#9CA3AF"}
                      />
                    </TouchableOpacity>

                    {/* Vendor name */}
                    <FieldRow
                      placeholder="Select vendor"
                      value={item.name}
                      onChangeText={(t) => {
                        updateVendor(item.id, "name", t);
                        const found = rawProjectVendors.find(
                          (v) => (v.individualName || v.name) === t,
                        );
                        if (found && found.expertise) {
                          let expertiseValue = "";
                          if (Array.isArray(found.expertise)) {
                            expertiseValue = found.expertise
                              .filter((e: string) => e && e !== "-")
                              .join(", ");
                          } else if (
                            typeof found.expertise === "string" &&
                            found.expertise !== "-"
                          ) {
                            expertiseValue = found.expertise;
                          }

                          if (expertiseValue) {
                            updateVendor(item.id, "expertise", expertiseValue);
                          }
                        }
                      }}
                      isDark={isDark}
                      isDropdown={true}
                      dropdownData={projectVendors}
                    />

                    {/* Expertise dropdown */}
                    <FieldRow
                      placeholder="Select expertise"
                      value={item.expertise}
                      onChangeText={(t) => updateVendor(item.id, "expertise", t)}
                      isDark={isDark}
                      isDropdown={true}
                      dropdownData={expertiseOptions}
                    />

                    {/* Skilled + Unskilled + Staff side by side */}
                    <View style={{ flexDirection: "row", gap: 8 }}>
                      <FieldRow
                        placeholder="e.g. 5 Skilled"
                        value={item.skillLabor ? item.skillLabor.toString() : ""}
                        onChangeText={(t) => updateVendor(item.id, "skillLabor", t)}
                        keyboardType="number-pad"
                        isDark={isDark}
                      />
                      <FieldRow
                        placeholder="e.g. 5 Unskilled"
                        value={item.unskillLabor ? item.unskillLabor.toString() : ""}
                        onChangeText={(t) =>
                          updateVendor(item.id, "unskillLabor", t)
                        }
                        keyboardType="number-pad"
                        isDark={isDark}
                      />
                      <FieldRow
                        placeholder="e.g. 5 Staff"
                        value={item.staffLabor ? item.staffLabor.toString() : ""}
                        onChangeText={(t) =>
                          updateVendor(item.id, "staffLabor", t)
                        }
                        keyboardType="number-pad"
                        isDark={isDark}
                      />
                    </View>
                  </View>
                )}
              </View>
            );
          }}
          ListFooterComponent={
            <View style={{ marginTop: 12 }}>
              {/* Add Vendor button */}
              <TouchableOpacity
                onPress={addVendor}
                activeOpacity={0.8}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 14,
                  paddingVertical: 15,
                  backgroundColor: isDark ? "#1A1A1A" : "#F0F3F7",
                }}
              >
                <Ionicons
                  name="add-circle-outline"
                  size={20}
                  color={isDark ? "#FFF" : "#000"}
                />
                <Text
                  style={{ color: isDark ? "#FFF" : "#000" }}
                  className="ml-2 font-dmSemiBold text-sm"
                >
                  Add Vendor
                </Text>
              </TouchableOpacity>
            </View>
          }
        />
      </Animated.View>

      {/* Footer — Cancel + Create */}
      <View
        style={{
          flexDirection: "row",
          paddingHorizontal: 16,
          paddingBottom: isKeyboardVisible ? 0 : Math.max(insets.bottom, 16),
          paddingTop: 12,
          gap: 12,
          backgroundColor: isDark ? "#000" : "#FBFCFD",
          borderTopWidth: 1,
          borderTopColor: isDark ? "#111" : "#F0F3F7",
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.8}
          style={{
            flex: 1,
            borderWidth: 1.5,
            borderColor: isDark ? "#454545" : "#EBEBEB",
            borderRadius: 14,
            paddingVertical: 14,
            alignItems: "center",
            backgroundColor: "transparent",
          }}
        >
          <Text
            style={{ color: isDark ? "#FFF" : "#454545" }}
            className="font-poppins text-lg"
          >
            Cancel
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={saveAndNext}
          disabled={isFormInvalid}
          activeOpacity={0.8}
          style={{
            flex: 1,
            borderRadius: 14,
            overflow: "hidden",
          }}
        >
          <LinearGradient
            colors={
              isFormInvalid
                ? (isDark ? ["#1A1A1A", "#1A1A1A"] : ["#E5E7EB", "#E5E7EB"])
                : ["#5B4CCC", "#6347C2", "#8056D1"]
            }
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={{
              paddingVertical: 14,
              alignItems: "center",
              width: "100%",
            }}
          >
            <Text
              style={{
                color: isFormInvalid
                  ? (isDark ? "#555" : "#9CA3AF")
                  : "#FFFFFF",
              }}
              className="font-poppins text-lg"
            >
              Create
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* DateTimePicker Modals */}
      {datePickerVisible && (
        <DateTimePicker
          value={
            selectedVendorIdForDate !== null
              ? new Date((activeTab === "Projected" ? projectedVendors : actualVendors).find((v) => v.id === selectedVendorIdForDate)?.date || new Date())
              : new Date()
          }
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}
    </KeyboardAvoidingView>
  );
};

export default LaborForm;
