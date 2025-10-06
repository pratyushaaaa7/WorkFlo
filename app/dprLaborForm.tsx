import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Image,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import uuid from "react-native-uuid";

interface Vendor {
  id: string;
  name: string;
  laborCount: number;
}

const LaborForm = () => {
  const router = useRouter();
  const { projectName, company, projectId, teamLeaders, teamMembers } =
    useLocalSearchParams();

  // console.log(teamLeaders, teamMembers);

  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    const loadSaved = async () => {
      try {
        const saved = await AsyncStorage.getItem("reportData");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.vendors) setVendors(parsed.vendors);
        }
      } catch (err) {
        console.log("Error loading saved vendors:", err);
      }
    };
    loadSaved();

    // Fade-in animation for screen
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const addVendor = () => {
    setVendors((prev) => [
      ...prev,
      { id: uuid.v4().toString(), name: "", laborCount: 0 },
    ]);
  };

  const updateVendor = (id: string, field: string, value: string) => {
    setVendors((prev) =>
      prev.map((v) =>
        v.id === id
          ? {
              ...v,
              [field]: field === "laborCount" ? parseInt(value || "0") : value,
            }
          : v
      )
    );
  };

  const removeVendor = (id: string) => {
    setVendors((prev) => prev.filter((v) => v.id !== id));
  };

  const totalLabor = vendors.reduce((sum, v) => sum + (v.laborCount || 0), 0);

  const saveAndNext = async () => {
    if (vendors.length === 0) {
      alert("Please add at least one vendor or press Skip.");
      return;
    }
    await AsyncStorage.setItem(
      "reportData",
      JSON.stringify({ vendors, projectName })
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
      }, // pass as string},
    });
    // console.log(JSON.stringify(vendors));
  };

  const skipAndNext = async () => {
    await AsyncStorage.setItem(
      "reportData",
      JSON.stringify({ vendors: [], projectName })
    );
    router.push({
      pathname: "/reportForm",
      params: { projectName, projectId, company, teamLeaders, teamMembers },
    });
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-gray-100"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={{ flex: 1 }}>
        {/* Header */}
        <LinearGradient colors={["#6366F1", "#8B5CF6"]}>
          <View className="pt-16 pb-6 px-4 flex-row items-center justify-between">
            <TouchableOpacity
              onPress={() => router.back()}
              className="bg-white/20 p-2 rounded-full"
            >
              <Ionicons name="arrow-back" size={22} color="#fff" />
            </TouchableOpacity>
            <Text className="text-xl font-bold text-white">Labor Report</Text>
            <View style={{ width: 32 }} />
          </View>
        </LinearGradient>

        {/* Content */}
        <View className="flex-1 px-3 py-4">
          {vendors.length === 0 ? (
            <View className="flex-1 items-center justify-center opacity-70 px-6">
              <MaterialCommunityIcons
                name="account-hard-hat"
                size={64} // smaller
                color="#6366F1"
              />
              <Text className="text-gray-500 mt-2 text-center text-sm">
                No vendors yet. Tap below to add your first one!
              </Text>
            </View>
          ) : (
            <FlatList
              data={vendors}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View className="bg-white rounded-xl shadow-sm p-3 mb-3">
                  {/* Remove button top-right */}
                  <TouchableOpacity
                    onPress={() => removeVendor(item.id)}
                    className="absolute top-2 right-2 z-10"
                  >
                    <Ionicons name="close-circle" size={20} color="#ef4444" />
                  </TouchableOpacity>

                  {/* Vendor Inputs */}
                  <TextInput
                    placeholder="Vendor Name"
                    placeholderTextColor="#9ca3af"
                    value={item.name}
                    onChangeText={(text) => updateVendor(item.id, "name", text)}
                    className="border-b border-gray-200 pb-1 mb-2 text-sm pr-6"
                  />
                  <TextInput
                    placeholder="Number of Labors"
                    placeholderTextColor="#9ca3af"
                    keyboardType="number-pad"
                    value={item.laborCount.toString()}
                    onChangeText={(text) =>
                      updateVendor(item.id, "laborCount", text)
                    }
                    className="border-b border-gray-200 pb-1 text-sm pr-6"
                  />
                </View>
              )}
            />
          )}

          {/* ✅ Add Vendor + Total Labor compact row */}
          <View className="flex-row items-center justify-between mt-3">
            <TouchableOpacity
              onPress={addVendor}
              className="bg-indigo-500 px-3 py-3 rounded-lg flex-row items-center"
            >
              <Ionicons name="add-circle" size={18} color="#fff" />
              <Text className="text-white ml-2 text-sm font-semibold">
                Add Vendor
              </Text>
            </TouchableOpacity>

            {vendors.length > 0 && (
              <View className="bg-white rounded-lg px-3 py-2 shadow-sm flex-row items-center">
                <Text className="text-sm font-semibold text-gray-700">
                  Total: <Text className="text-indigo-600">{totalLabor}</Text>
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Footer Buttons */}
        <View className="flex-row justify-between px-3 pb-4 mt-2">
          <TouchableOpacity
            onPress={skipAndNext}
            className="bg-gray-400 px-4 py-3 rounded-lg flex-1 mr-2"
          >
            <Text className="text-white text-sm font-medium text-center">
              Skip
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={saveAndNext}
            className="bg-green-500 px-4 py-3 rounded-lg flex-1 ml-2"
          >
            <Text className="text-white text-sm font-medium text-center">
              Save & Next
            </Text>
          </TouchableOpacity>
        </View>

        {/* Footer Buttons */}
        {/* <View className="flex-row justify-between px-4 pb-6">
          <TouchableOpacity
            onPress={skipAndNext}
            className="bg-gray-400 px-6 py-4 rounded-xl flex-1 mr-3"
          >
            <Text className="text-white font-semibold text-center">Skip</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={saveAndNext}
            className="bg-green-500 px-6 py-4 rounded-xl flex-1 ml-3"
          >
            <Text className="text-white font-semibold text-center">
              Save & Next
            </Text>
          </TouchableOpacity>
        </View> */}
      </View>
    </KeyboardAvoidingView>
  );
};

export default LaborForm;
