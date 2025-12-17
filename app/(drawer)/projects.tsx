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
          label: `${project.fileNumber} • ${project.projectName}`,
          value: project._id,

          // keep raw data for later use
          projectName: project.projectName,
          status: project.status,
          fileNumber: project.fileNumber,
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
        <View className="mb-4 bg-white p-3 rounded-xl shadow">
          <Text className="text-sm font-semibold text-gray-600 mb-2">
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
              height: 50,
              borderRadius: 14,
              paddingHorizontal: 16,
             backgroundColor: "#F9FAFB",
              // borderWidth: 1,
              borderColor: "#E5E7EB",
              justifyContent: "center",
            }}
            placeholderStyle={{ fontSize: 14, color: "#9CA3AF" }}
            selectedTextStyle={{
              fontSize: 14,
              color: "#111827",
              fontWeight: "500",
            }}
            containerStyle={{ borderRadius: 14, backgroundColor: "#fff" }}
            activeColor="#EEF2FF"
            renderRightIcon={() => (
              <Ionicons name="chevron-down" size={20} color="#6B7280" />
            )}
          />
        </View>

        {/* Project Dropdown */}
        <View className="mb-4  bg-white p-4 rounded-xl shadow">
          <Text className="text-sm font-semibold text-gray-600 mb-2">
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
            //  searchBy={["projectName", "fileNumber"]} // no need
            searchPlaceholder="Search project..."
            inputSearchStyle={{
              fontSize: 14,
              color: "#111827",
              borderRadius: 8,
              paddingHorizontal: 12,
            }}
            style={{
              height: 50,
              borderRadius: 14,
              paddingHorizontal: 16,
              backgroundColor: "#F9FAFB",
              // borderWidth: 1,
              borderColor: "#E5E7EB",
              justifyContent: "center",
              shadowColor: "#000",
              // shadowOffset: { width: 0, height: 2 },
              // shadowOpacity: 0.05,
              // shadowRadius: 4,
              // elevation: 2,
            }}
            placeholderStyle={{ fontSize: 14, color: "#9CA3AF" }}
            selectedTextStyle={{
              fontSize: 14,
              color: "#111827",
              fontWeight: "500",
            }}
            containerStyle={{ borderRadius: 14, backgroundColor: "#fff" }}
            activeColor="#EEF2FF"
            renderRightIcon={() =>
              loading ? (
                <ActivityIndicator size="small" color="#6366F1" />
              ) : (
                <Ionicons name="chevron-down" size={20} color="#6B7280" />
              )
            }
            renderItem={(item) => (
              <View
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderBottomWidth: 1,
                  borderBottomColor: "#F3F4F6",
                }}
              >
                <Text
                  style={{ fontSize: 14, fontWeight: "600", color: "#111827" }}
                >
                  {item.projectName}
                </Text>

                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginTop: 6,
                  }}
                >
                  <Text style={{ fontSize: 12, color: "#6B7280" }}>
                    #{item.fileNumber || "—"}
                  </Text>

                  <View
                    style={{
                      paddingHorizontal: 8,
                      paddingVertical: 2,
                      borderRadius: 999,
                      backgroundColor:
                        item.status === "active"
                          ? "#DCFCE7"
                          : item.status === "BD"
                          ? "#FEF9C3"
                          : item.status === "inactive"
                          ? "#E5E7EB"
                          : "#FEE2E2",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: "700",
                        color:
                          item.status === "active"
                            ? "#166534"
                            : item.status === "BD"
                            ? "#854D0E"
                            : item.status === "inactive"
                            ? "#374151"
                            : "#991B1B",
                      }}
                    >
                      {item.status.toUpperCase()}
                    </Text>
                  </View>
                </View>
              </View>
            )}
          />
        </View>

        <TouchableOpacity
          className="bg-indigo-600 mt-6 py-3 rounded-xl items-center shadow-lg active:scale-95"
          onPress={handleEnter}
        >
          <Text className="text-white font-bold text-base">Enter</Text>
        </TouchableOpacity>

        {/* <TouchableOpacity
          className="mt-8 shadow-lg rounded-3xl border border-indigo-700 overflow-hidden"
          activeOpacity={0.8}
          style={{ borderColor: "#4338ca", height: 100 }}
          onPress={() => router.push("/myDashboard")}
        >
          
          <Animated.View
            style={[{ ...StyleSheet.absoluteFillObject }, reverseAnimatedStyle]}
          >
            <LinearGradient
              colors={["#6366F1", "#8B5CF6"]}
              start={[0, 0]}
              end={[1, 1]}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>

        
          <Animated.View
            style={[{ ...StyleSheet.absoluteFillObject }, animatedStyle]}
          >
            <LinearGradient
              colors={["#8B5CF6", "#6366F1"]}
              start={[0, 0]}
              end={[1, 1]}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>

          
          <View className="flex-row items-center gap-4 p-6">
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
