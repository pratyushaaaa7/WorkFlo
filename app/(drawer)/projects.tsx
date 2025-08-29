import React, { useState, useEffect, useContext } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { Dropdown } from "react-native-element-dropdown";
import { AuthContext } from "../../context/AuthContext";
import api from "../../lib/api";
import { useRouter } from "expo-router";
import Toast from "react-native-toast-message";
import { LinearGradient } from "expo-linear-gradient";

const CompanyProjectSelectionScreen = () => {
  const auth = useContext(AuthContext);
  const token = auth?.token;
  const router = useRouter();

  const [selectedCompany, setSelectedCompany] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [projectName, setProjectName] = useState("");

  const [companyOptions, setCompanyOptions] = useState([
    { label: "WP", value: "WP" },
    { label: "WAL+L", value: "WAL" },
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

    console.log("Navigating to project with:", {
      projectId: selectedProject,
      company: selectedCompany,
      projectName,
    });
    router.push({
      pathname: "/projectMain",
      params: {
        projectId: selectedProject,
        company: selectedCompany,
        projectName,
      },
    });
  };

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
            Select Company
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
            Select Project
          </Text>
          <Dropdown
            data={assignedProjects}
            labelField="label"
            valueField="value"
            placeholder="Choose project"
            value={selectedProject}
            onChange={(item) => setSelectedProject(item.value)}
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

        {/* Enter Button */}
        <TouchableOpacity
          className="bg-indigo-600 mt-6 py-3 rounded-xl items-center shadow-lg active:scale-95"
          onPress={handleEnter}
        >
          <Text className="text-white font-bold text-base">Enter</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

export default CompanyProjectSelectionScreen;
