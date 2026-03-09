import { Ionicons } from "@expo/vector-icons";
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useContext, useEffect, useState } from "react";
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
import uuid from "react-native-uuid";
import { AuthContext } from "../context/AuthContext";
import api from "../lib/api";

interface Vendor {
  id: string;
  name: string;
  expertise: string;
  skillLabor: number;
  unskillLabor: number;
  // keep laborCount for backward compat with downstream
  laborCount: number;
}

// ── Defined OUTSIDE the component so React never treats it as a new type on re-render.
// If defined inside, every keystroke (setState) creates a new component → unmount/remount → keyboard closes.
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
      paddingHorizontal: 8,
      paddingVertical: 2,
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
          fontSize: 15,
          fontFamily: "Poppins_400Regular",
          color: isDark ? "#555" : "#9CA3AF",
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
          fontSize: 15,
          fontFamily: "Poppins_400Regular",
        }}
      />
    )}
  </View>
);

const LaborForm = () => {
  const router = useRouter();
  const { projectName, company, projectId, teamLeaders, teamMembers } =
    useLocalSearchParams();

  const isDark = useColorScheme() === "dark";
  const insets = useSafeAreaInsets();
  const defaultVendor = (): Vendor => ({
    id: uuid.v4().toString(),
    name: "",
    expertise: "",
    skillLabor: 0,
    unskillLabor: 0,
    laborCount: 0,
  });

  const [vendors, setVendors] = useState<Vendor[]>([defaultVendor()]);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const isInitialLoadDone = React.useRef(false);

  const storageKey = `reportData_${projectId}`;

  const auth = useContext(AuthContext);
  const token = auth?.token;

  const [projectVendors, setProjectVendors] = useState<
    { label: string; value: string }[]
  >([]);
  const [rawProjectVendors, setRawProjectVendors] = useState<any[]>([]);

  useEffect(() => {
    const fetchProjectVendors = async () => {
      if (!projectId || !token) return;
      try {
        const res = await api.get(`/projects/${projectId}/project-vendors`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        // console.log("Raw project vendors response:", JSON.stringify(res.data));

        // Robustly find the vendors array
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
        // console.log("Mapped project vendors:", mapped);
      } catch (err) {
        console.error("Error fetching project vendors:", err);
      }
    };
    fetchProjectVendors();
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

  useEffect(() => {
    const loadSaved = async () => {
      // 🧱 Reset state immediately when projectId changes to prevent data bleeding
      isInitialLoadDone.current = false;
      setVendors([defaultVendor()]);

      try {
        const saved = await AsyncStorage.getItem(storageKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.vendors && parsed.vendors.length > 0) {
            setVendors(parsed.vendors);
          }
        }
      } catch (err) {
        console.log("Error loading saved vendors:", err);
      } finally {
        isInitialLoadDone.current = true;
      }
    };
    loadSaved();

    // Fade-in animation for screen
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [projectId]);

  // Auto-save whenever vendors change
  useEffect(() => {
    const autoSave = async () => {
      if (isInitialLoadDone.current && vendors.length > 0) {
        try {
          await AsyncStorage.setItem(
            storageKey,
            JSON.stringify({ vendors, projectName }),
          );
        } catch (err) {
          console.error("Auto-save failed:", err);
        }
      }
    };
    autoSave();
  }, [vendors, projectId]);

  const addVendor = () => {
    setVendors((prev) => [
      ...prev,
      {
        id: uuid.v4().toString(),
        name: "",
        expertise: "",
        skillLabor: 0,
        unskillLabor: 0,
        laborCount: 0,
      },
    ]);
  };

  const updateVendor = (id: string, field: string, value: string) => {
    setVendors((prev) =>
      prev.map((v) => {
        if (v.id !== id) return v;
        const isNumeric = ["skillLabor", "unskillLabor", "laborCount"].includes(
          field,
        );
        const updated = {
          ...v,
          [field]: isNumeric ? parseInt(value || "0") : value,
        };
        // keep laborCount in sync
        updated.laborCount =
          (updated.skillLabor || 0) + (updated.unskillLabor || 0);
        return updated;
      }),
    );
  };

  const removeVendor = (id: string) => {
    setVendors((prev) => prev.filter((v) => v.id !== id));
  };

  const totalSkilled = vendors.reduce((sum, v) => sum + (v.skillLabor || 0), 0);
  const totalUnskilled = vendors.reduce(
    (sum, v) => sum + (v.unskillLabor || 0),
    0,
  );
  const totalLabor = totalSkilled + totalUnskilled;

  const saveAndNext = async () => {
    if (vendors.length === 0) {
      alert("Please add at least one vendor or press Skip.");
      return;
    }
    await AsyncStorage.setItem(
      storageKey,
      JSON.stringify({ vendors, projectName }),
    );
    router.push({
      pathname: "/reportForm",
      params: {
        projectName,
        projectId,
        company,
        teamLeaders,
        teamMembers,
        vendors: JSON.stringify(vendors),
        totalLabor: totalLabor.toString(),
      },
    });
  };

  const skipAndNext = async () => {
    await AsyncStorage.setItem(
      storageKey,
      JSON.stringify({ vendors: [], projectName }),
    );
    router.push({
      pathname: "/reportForm",
      params: { projectName, projectId, company, teamLeaders, teamMembers },
    });
  };

  // (FieldRow is defined at module level — see above)

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
          // paddingTop: Math.max(insets.top, 16),
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
            Labor Report
          </Text>
        </TouchableOpacity>

        {/* Labor Statistics Row */}
        <View
          className="my-4 mt-6"
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            // marginTop: 12,
            // paddingLeft: 38, // Align with title text
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

          <Text
            style={{ color: isDark ? "#E5E7EB" : "#111" }}
            className="text-sm font-poppinsMedium"
          >
            Total : <Text className="font-poppinsMedium">{totalLabor}</Text>
          </Text>
        </View>
      </View>

      {/* Vendor List */}
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <FlatList
          data={vendors}
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
          renderItem={({ item, index }) => (
            <View
              style={{
                backgroundColor: isDark ? "#0D0D0D" : "#F6F8FA",
                borderRadius: 16,
                marginBottom: 12,
                overflow: "hidden",
              }}
            >
              {/* Card header — vendor label + remove */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingHorizontal: 16,
                  paddingTop: 14,
                  paddingBottom: 10,
                  borderBottomWidth: 1,
                  borderBottomColor: isDark ? "#1C1C1C" : "#EBEBEB",
                }}
              >
                <Text
                  style={{ color: isDark ? "#BBBBBB" : "#454545" }}
                  className="font-poppinsMedium text-[14px]"
                >
                  Vendor {index + 1}
                </Text>
                {vendors.length > 1 && (
                  <TouchableOpacity
                    onPress={() => removeVendor(item.id)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons
                      name="close-circle"
                      size={20}
                      color={isDark ? "#555" : "#D1D5DB"}
                    />
                  </TouchableOpacity>
                )}
              </View>

              {/* Fields */}
              <View style={{ padding: 12, gap: 10 }}>
                {/* Vendor name */}
                <FieldRow
                  placeholder="Select vendor"
                  value={item.name}
                  onChangeText={(t) => {
                    updateVendor(item.id, "name", t);
                    // Find vendor in rawProjectVendors to auto-fill expertise
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

                {/* Expertise */}
                <FieldRow
                  placeholder="Enter expertise"
                  value={item.expertise}
                  onChangeText={(t) => updateVendor(item.id, "expertise", t)}
                  isDark={isDark}
                />

                {/* Skilled + Unskilled side by side */}
                <View style={{ flexDirection: "row", gap: 10 }}>
                  <FieldRow
                    placeholder="Skilled labor"
                    value={item.skillLabor.toString()}
                    onChangeText={(t) => updateVendor(item.id, "skillLabor", t)}
                    keyboardType="number-pad"
                    isDark={isDark}
                  />
                  <FieldRow
                    placeholder="Unskilled labor"
                    value={item.unskillLabor.toString()}
                    onChangeText={(t) =>
                      updateVendor(item.id, "unskillLabor", t)
                    }
                    keyboardType="number-pad"
                    isDark={isDark}
                  />
                </View>
              </View>
            </View>
          )}
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

      {/* Footer — Skip + Next */}
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
          onPress={skipAndNext}
          activeOpacity={0.8}
          style={{
            flex: 1,
            borderWidth: 1.5,
            borderColor: isDark ? "#FFF" : "#000",
            borderRadius: 14,
            paddingVertical: 14,
            alignItems: "center",
            backgroundColor: "transparent",
            marginBottom: 4, // Align with Next button's shadow space
          }}
        >
          <Text
            style={{ color: isDark ? "#FFF" : "#111" }}
            className="font-poppins text-lg"
          >
            Skip
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={saveAndNext}
          activeOpacity={0.8}
          style={{
            flex: 1,
            borderRadius: 14,
            // shadowColor: "#5B4CCC",
            // shadowOffset: { width: 0, height: 4 },
            // shadowOpacity: 0.3,
            // shadowRadius: 8,
            // elevation: 8,
            // marginBottom: 4,
          }}
        >
          <LinearGradient
            colors={["#5B4CCC", "#6347C2", "#8056D1"]}
            locations={[0, 0.5183, 1]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={{
              paddingVertical: 14,
              alignItems: "center",
              width: "100%",
              borderRadius: 14, // Apply radius here instead
            }}
          >
            <Text className="text-white font-poppins text-lg">Next</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

export default LaborForm;
