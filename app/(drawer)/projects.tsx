import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ScrollView,
} from "react-native";
import DropDownPicker from "react-native-dropdown-picker";
import { AuthContext } from "../../context/AuthContext";
import api from "../../lib/api";
import { useRouter } from "expo-router";

const CompanyProjectSelectionScreen = () => {
  const auth = useContext(AuthContext);
  const token = auth?.token;
 const router = useRouter();

  // Company dropdown
  const [companyOpen, setCompanyOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [companyOptions, setCompanyOptions] = useState([
    { label: "WP", value: "WP" },
    { label: "WAL+L", value: "WAL" },
  ]);

  // Project dropdown
  const [projectOpen, setProjectOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [assignedProjects, setAssignedProjects] = useState<any[]>([]);

  useEffect(() => {
    if (!token) return;

    const fetchProjects = async () => {
      try {
        const res = await api.get("/projects", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const dropdownProjects = res.data.projects.map((project: any) => ({
          label: project.name,
          value: project._id,
        }));

        setAssignedProjects(dropdownProjects);
      } catch (err) {
        console.error("Failed to fetch projects", err.message);
      }
    };

    fetchProjects();
  }, [token]);

  const handleEnter = () => {
    if (!selectedCompany || !selectedProject) {
      Alert.alert("Validation", "Please select both company and project.");
      return;
    }

    // Alert.alert("Selected", `Company: ${selectedCompany}\nProject ID: ${selectedProject}`);
    // You can now navigate or do something with the selected values

     // 🔁 Route to dashboard screen
    router.push("/projectMain"); // or `router.replace("/dashboard")` if you don’t want to go back
  };

  return (
    <ScrollView
      className="flex-1 px-4 py-6 bg-white"
      keyboardShouldPersistTaps="handled"
    >
      <View className="mb-4" style={{ zIndex: 2000 }}>
        <Text className="text-lg font-semibold text-gray-700 mb-2">
          Select Company
        </Text>
        <DropDownPicker
          open={companyOpen}
          value={selectedCompany}
          items={companyOptions}
          setOpen={setCompanyOpen}
          setValue={setSelectedCompany}
          setItems={setCompanyOptions}
          placeholder="Choose company"
          zIndex={3000}
        />
      </View>

      <View className="mb-4" style={{ zIndex: 1000 }}>
        <Text className="text-lg font-semibold text-gray-700 mb-2">
          Select Project
        </Text>
        <DropDownPicker
          open={projectOpen}
          value={selectedProject}
          items={assignedProjects}
          setOpen={setProjectOpen}
          setValue={setSelectedProject}
          setItems={setAssignedProjects}
          placeholder="Choose project"
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
