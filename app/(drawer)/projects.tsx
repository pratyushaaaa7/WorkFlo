import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { Dropdown } from "react-native-element-dropdown";
import { AuthContext } from "../../context/AuthContext";
import api from "../../lib/api";
import { useRouter } from "expo-router";
import Toast from "react-native-toast-message";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  withRepeat,
  withTiming,
  useAnimatedStyle,
  interpolateColor,
} from "react-native-reanimated";

const CompanyProjectSelectionScreen = () => {
  const auth = useContext(AuthContext);
  const token = auth?.token;
  const router = useRouter();

  const [selectedCompany, setSelectedCompany] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  // const [projectName, setProjectName] = useState("");

  const [loading, setLoading] = useState(false);

  const [companyOptions, setCompanyOptions] = useState([
    { label: "WP", value: "WP" },
    { label: "WAL+L", value: "WAL" },
    { label: "WCorp", value: "WCorp" },
  ]);

  const [assignedProjects, setAssignedProjects] = useState<any[]>([]);

  // Fetch projects filtered by selectedCompany from backend
  useEffect(() => {
    if (!token || !selectedCompany) {
      setAssignedProjects([]);
      setSelectedProject(null);
      return;
    }

    const fetchProjects = async () => {
      try {
        setLoading(true); // start spinner
        const res = await api.get("/projects", {
          headers: { Authorization: `Bearer ${token}` },
          params: { company: selectedCompany },
        });

        const dropdownProjects = res.data.projects.map((project: any) => ({
          label: project.projectName,
          value: project._id,
          projectName: project.projectName,
        }));

        // console.log("Fetched projects:", dropdownProjects);

        setAssignedProjects(dropdownProjects);
        setSelectedProject(null);
      } catch (err) {
        if (err instanceof Error) {
          console.error("Failed to fetch projects", err.message);
        } else {
          console.error("Failed to fetch projects", err);
        }
        setAssignedProjects([]);
        setSelectedProject(null);
      } finally {
        setLoading(false); // stop spinner
      }
    };

    fetchProjects();
  }, [token, selectedCompany]);

  const handleEnter = () => {
    if (!selectedCompany || !selectedProject) {
      Toast.show({
        type: "error",
        // text1: "Validation Error",
        text1: "Please select both company and project.",
        position: "bottom",
      });
      return;
    }

    // Find project name from assignedProjects array
    const selected = assignedProjects.find(
      (p: any) => p.value === selectedProject
    );

    const projectName = selected ? selected.projectName : "";

    // console.log("Navigating to project with:", {
    //   projectId: selectedProject,
    //   company: selectedCompany,
    //   projectName,
    // });

    router.push(
      `/projectMain?projectId=${selectedProject}&company=${selectedCompany}&projectName=${projectName}`
    );
  };

  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(withTiming(1, { duration: 4000 }), -1, true);
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return { opacity: progress.value };
  });

  const reverseAnimatedStyle = useAnimatedStyle(() => {
    return { opacity: 1 - progress.value };
  });

  return (
    <View className="flex-1 bg-gray-50">
      {/* Gradient Header */}
      <View
        // colors={["#6366F1", "#8B5CF6"]}
        className=" pt-4 justify-center items-center "
      >
        <Text className="text-xl font-bold">Select Project</Text>
        <Text className=" mt-1 text-sm">
          Choose company and project to continue
        </Text>
      </View>

      {/* Form Section */}
      <ScrollView
        className="flex-1 px-5 py-6"
        keyboardShouldPersistTaps="handled"
      >
        {/* Company Dropdown */}
        <View className="mb-5 bg-white rounded-xl shadow-md p-4">
          <Text className="text-base font-semibold text-gray-700 mb-2">
            Select Company <Text className="text-red-500">*</Text>
          </Text>
          <Dropdown
            data={companyOptions}
            labelField="label"
            valueField="value"
            placeholder="Choose company"
            value={selectedCompany}
            onChange={(item) => setSelectedCompany(item.value)}
            style={{
              height: 48,
              borderRadius: 10,
              paddingHorizontal: 10,
              backgroundColor: "#F9FAFB",
            }}
            placeholderStyle={{
              fontSize: 14,
              color: "#9CA3AF",
            }}
            selectedTextStyle={{
              fontSize: 14,
              color: "#111827",
            }}
            containerStyle={{
              borderRadius: 12,
              backgroundColor: "#fff",
              elevation: 4,
            }}
            activeColor="#E0E7FF"
          />
        </View>

        {/* Project Dropdown */}
        <View className="mb-5 bg-white rounded-xl shadow-md p-4">
          <Text className="text-base font-semibold text-gray-700 mb-2">
            Select Project <Text className="text-red-500">*</Text>
          </Text>
          <Dropdown
            data={assignedProjects}
            labelField="label"
            valueField="value"
            placeholder={loading ? "Loading projects..." : "Choose project"}
            value={selectedProject}
            onChange={(item) => setSelectedProject(item.value)}
            search
            searchPlaceholder="Search..."
            inputSearchStyle={{
              fontSize: 14,
              color: "#111827",
              borderRadius: 8,
              paddingHorizontal: 8,
            }}
            style={{
              height: 48,
              borderRadius: 10,
              paddingHorizontal: 10,
              backgroundColor: "#F9FAFB",
            }}
            placeholderStyle={{
              fontSize: 14,
              color: "#9CA3AF",
            }}
            selectedTextStyle={{
              fontSize: 14,
              color: "#111827",
            }}
            containerStyle={{
              borderRadius: 12,
              backgroundColor: "#fff",
              elevation: 4,
            }}
            activeColor="#E0E7FF"
            renderRightIcon={() =>
              loading ? (
                <ActivityIndicator size="small" color="#6366F1" />
              ) : (
                <Ionicons name="chevron-down" size={18} color="#6B7280" /> // gray-500
              )
            }
          />
        </View>

        {/* Enter Button */}
        <TouchableOpacity
          className="bg-indigo-600 mt-6 py-3 rounded-xl items-center shadow-lg active:scale-95"
          onPress={handleEnter}
        >
          <Text className="text-white font-bold text-base">Enter</Text>
        </TouchableOpacity>

        {/* Dashboard Section */}
        {/* <TouchableOpacity
          className="mt-8 shadow-lg rounded-3xl border border-indigo-700 overflow-hidden"
          activeOpacity={0.8}
          style={{ borderColor: "#4338ca", height: 100 }}
          onPress={() => router.push("/myDashboard")}
        > */}
        {/* BACK GRADIENT (Purple → Indigo) */}
        {/* <Animated.View
            style={[{ ...StyleSheet.absoluteFillObject }, reverseAnimatedStyle]}
          >
            <LinearGradient
              colors={["#6366F1", "#8B5CF6"]}
              start={[0, 0]}
              end={[1, 1]}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View> */}

        {/* FRONT GRADIENT (Indigo → Purple) */}
        {/* <Animated.View
            style={[{ ...StyleSheet.absoluteFillObject }, animatedStyle]}
          >
            <LinearGradient
              colors={["#8B5CF6", "#6366F1"]}
              start={[0, 0]}
              end={[1, 1]}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View> */}

        {/* CONTENT */}
        {/* <View className="flex-row items-center gap-4 p-6">
            <MaterialCommunityIcons
              name="view-dashboard-outline"
              size={32}
              color="#fff"
            />
            <View>
              <Text className="text-xl font-bold text-white">My DASHBOARD</Text>
              <Text className="text-sm text-white mt-1 opacity-90">
                Log of all the tasks you are responsible for
              </Text>
            </View>
          </View>
        </TouchableOpacity> */}
      </ScrollView>
    </View>
  );
};

export default CompanyProjectSelectionScreen;
