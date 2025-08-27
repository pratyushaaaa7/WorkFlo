import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Project } from "../types/Project";
import { LinearGradient } from "expo-linear-gradient";

const ProjectDetails = () => {
  const { project } = useLocalSearchParams();
  const router = useRouter();

  // Parse project back to object
  const selectedProject: Project = JSON.parse(project as string);

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <LinearGradient
        colors={["#6366F1", "#8B5CF6"]}
        className="pt-16 pb-6 px-4 flex-row items-center justify-between"
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.25,
          shadowRadius: 4,
          elevation: 6,
          zIndex: 10,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          className="flex-row items-center"
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
          <Text className="text-xl font-semibold text-white ml-4">
            Project Details
          </Text>
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView className="p-4">
        {/* Project Info Card */}
        <View className="bg-white rounded-2xl shadow-md p-5 mb-6">
          {/* Project Name + Status */}
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-xl font-semibold text-gray-900">
              {selectedProject.projectName}
            </Text>
            <Text
              style={{
                color:
                  selectedProject.status === "active"
                    ? "#15803d" // green
                    : selectedProject.status === "hold"
                    ? "#a16207" // yellow
                    : "#b91c1c", // red
              }}
              className={`text-lg font-semibold px-3 py-1 rounded-full capitalize`}
            >
              {selectedProject.status}
            </Text>
          </View>

          {/* Info grouped into pairs */}
          {[
            { label: "Company", value: selectedProject.company },
            { label: "Typology", value: selectedProject.typology },
            {
              label: "Client Name",
              value: selectedProject.clientName || "Not specified",
            },
            { label: "Project Code", value: selectedProject.projectCode },
            { label: "Location", value: selectedProject.location },
            { label: "Site Area", value: selectedProject.siteArea || "N/A" },
            {
              label: "Designed Area",
              value: selectedProject.designedArea || "N/A",
            },
            {
              label: "Start Date",
              value: selectedProject.startDate
                ? formatDate(selectedProject.startDate)
                : "N/A",
            },
            {
              label: "Team Leaders",
              value:
                selectedProject.teamLeaders.length > 0
                  ? selectedProject.teamLeaders
                      .map((u) => `• ${u.fullName ?? u._id}`)
                      .join("\n")
                  : "No team leaders",
            },
            {
              label: "Team Members",
              value:
                selectedProject.teamMembers.length > 0
                  ? selectedProject.teamMembers
                      .map((u) => `• ${u.fullName ?? u._id}`)
                      .join("\n")
                  : "No team members",
            },
          ]
            .reduce((rows, item, index, arr) => {
              if (index % 2 === 0) rows.push(arr.slice(index, index + 2));
              return rows;
            }, [] as { label: string; value: string }[][])
            .map((row, rowIndex) => (
              <View key={rowIndex} className="flex-row justify-between mb-3">
                {row.map((item, i) => (
                  <View key={i} className="flex-1 mr-2">
                    <Text className="text-gray-500 text-xs font-medium mb-1">
                      {item.label}
                    </Text>
                    <Text className="text-gray-900 text-sm whitespace-pre-line">
                      {item.value}
                    </Text>
                  </View>
                ))}
              </View>
            ))}

          {/* Scopes */}
          <View className="mt-4">
            <Text className="text-gray-500 text-xs font-medium mb-1">
              Scopes
            </Text>
            {selectedProject.scopes.length > 0 ? (
              selectedProject.scopes.map((scope, index) => (
                <Text key={index} className="text-gray-900 text-sm ml-2 mb-1">
                  • {scope}
                </Text>
              ))
            ) : (
              <Text className="text-gray-400 italic text-sm ml-2">
                No scopes defined
              </Text>
            )}
          </View>
        </View>

        {/* Placeholder for Activity Tracker */}
        <View className="bg-white rounded-2xl shadow-md p-5">
          <Text className="text-lg font-semibold text-gray-900">
            Project Activities
          </Text>
          <Text className="text-gray-500 mt-2">
            (Activity tracking component will go here...)
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

export default ProjectDetails;
