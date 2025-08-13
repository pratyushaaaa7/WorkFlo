import React, { useState, useEffect, useContext } from "react";
import { View, Text, TouchableOpacity, Alert, ScrollView } from "react-native";
import { Dropdown } from "react-native-element-dropdown";
import { AuthContext } from "../../context/AuthContext";
import api from "../../lib/api";
import { useRouter } from "expo-router";

const CompanyProjectSelectionScreen = () => {
  const auth = useContext(AuthContext);
  const token = auth?.token;
  const router = useRouter();

  const [selectedCompany, setSelectedCompany] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);

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
        }));

        setAssignedProjects(dropdownProjects);
        setSelectedProject(null);
      } catch (err) {
        console.error("Failed to fetch projects", err.message);
        setAssignedProjects([]);
        setSelectedProject(null);
      }
    };

    fetchProjects();
  }, [token, selectedCompany]);

  const handleEnter = () => {
    if (!selectedCompany || !selectedProject) {
      Alert.alert("Validation", "Please select both company and project.");
      return;
    }

    router.push({
      pathname: "/projectMain",
      params: {
        projectId: selectedProject,
        company: selectedCompany,
      },
    });
  };

  return (
    <ScrollView
      className="flex-1 px-4 py-6 bg-white"
      keyboardShouldPersistTaps="handled"
    >
      <View className="mb-4">
        <Text className="text-lg font-semibold text-gray-700 mb-2">
          Select Company
        </Text>
        <Dropdown
          data={companyOptions}
          labelField="label"
          valueField="value"
          placeholder="Choose company"
          value={selectedCompany}
          onChange={(item) => {
            setSelectedCompany(item.value);
          }}
          style={{
            height: 45,
            borderColor: "#000", // Aqua border to match theme
            borderWidth: 1,
            borderRadius: 8,
            paddingHorizontal: 10,
            backgroundColor: "#fff",
          }}
          placeholderStyle={{
            fontSize: 14,
            color: "#888",
          }}
          selectedTextStyle={{
            fontSize: 14,
            color: "#0B0B0B", // Rich black for readability
          }}
          containerStyle={{
            borderRadius: 12,
            overflow: "hidden",
            backgroundColor: "#fff", // Soft aqua dropdown background
          }}
          activeColor="#E0F7FA" // Medium aqua for active highlight
        />
      </View>

      <View className="mb-4">
        <Text className="text-lg font-semibold text-gray-700 mb-2">
          Select Project
        </Text>
        <Dropdown
          data={assignedProjects}
          labelField="label"
          valueField="value"
          placeholder="Choose project"
          value={selectedProject}
          onChange={(item) => {
            setSelectedProject(item.value);
          }}
          style={{
            height: 45,
            borderColor: "#000", // Aqua border to match theme
            borderWidth: 1,
            borderRadius: 8,
            paddingHorizontal: 10,
            backgroundColor: "#fff",
          }}
          placeholderStyle={{
            fontSize: 14,
            color: "#888",
          }}
          selectedTextStyle={{
            fontSize: 14,
            color: "#0B0B0B", // Rich black for readability
          }}
          containerStyle={{
            borderRadius: 12,
            overflow: "hidden",
            backgroundColor: "#fff", // Soft aqua dropdown background
          }}
          activeColor="#E0F7FA" // Medium aqua for active highlight
        />
      </View>

      <TouchableOpacity
        className="bg-blue-600 mt-6 py-3 rounded-lg items-center"
        onPress={handleEnter}
      >
        <Text className="text-white font-bold text-base">Enter</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default CompanyProjectSelectionScreen;
