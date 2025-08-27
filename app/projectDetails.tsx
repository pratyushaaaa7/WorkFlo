import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Project } from "../types/Project";

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
      <View className="bg-white pt-16 pb-4 px-6 border-b border-gray-200 shadow-md flex-row items-center">
        <TouchableOpacity
          onPress={() => router.back()}
          className="flex-row items-center"
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
          <Text className="text-xl font-semibold text-gray-900 ml-2">Back</Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="p-6">
        <Text className="text-2xl font-bold text-gray-900 mb-6">
          Project Details
        </Text>

        <View className="mb-4">
          <Text className="font-semibold text-gray-700">Company</Text>
          <Text className="text-gray-900 text-lg">
            {selectedProject.company}
          </Text>
        </View>

        <View className="mb-4">
          <Text className="font-semibold text-gray-700">Typology</Text>
          <Text className="text-gray-900 text-lg">
            {selectedProject.typology}
          </Text>
        </View>

        <View className="mb-4">
          <Text className="font-semibold text-gray-700">Project Name</Text>
          <Text className="text-gray-900 text-lg">
            {selectedProject.projectName}
          </Text>
        </View>

        <View className="mb-4">
          <Text className="font-semibold text-gray-700">Project Code</Text>
          <Text className="text-gray-900 text-lg">
            {selectedProject.projectCode}
          </Text>
        </View>

        <View className="mb-4">
          <Text className="font-semibold text-gray-700">Location</Text>
          <Text className="text-gray-900 text-lg">
            {selectedProject.location}
          </Text>
        </View>

        <View className="mb-4">
          <Text className="font-semibold text-gray-700">Area</Text>
          <Text className="text-gray-900 text-lg">
            {selectedProject.area}
          </Text>
        </View>

        <View className="mb-4">
          <Text className="font-semibold text-gray-700">Scopes</Text>
          <Text className="text-gray-900 text-lg">
            {selectedProject.scopes.join(", ")}
          </Text>
        </View>

        <View className="mb-4">
          <Text className="font-semibold text-gray-700">Start Date</Text>
          <Text className="text-gray-900 text-lg">
            {formatDate(selectedProject.startDate)}
          </Text>
        </View>

        <View className="mb-2">
          <Text className="font-semibold text-gray-700 mb-1">Team Leaders</Text>
          {selectedProject.teamLeaders.length > 0 ? (
            selectedProject.teamLeaders.map((user) => (
              <Text
                key={user._id}
                className="text-gray-800 text-base ml-4 mb-1"
              >
                - {user.fullName ?? user._id}
              </Text>
            ))
          ) : (
            <Text className="text-gray-500 italic ml-4">
              No team leaders assigned
            </Text>
          )}
        </View>

        <View className="mb-2">
          <Text className="font-semibold text-gray-700 mb-1">Team Members</Text>
          {selectedProject.teamMembers.length > 0 ? (
            selectedProject.teamMembers.map((user) => (
              <Text
                key={user._id}
                className="text-gray-800 text-base ml-4 mb-1"
              >
                - {user.fullName ?? user._id}
              </Text>
            ))
          ) : (
            <Text className="text-gray-500 italic ml-4">
              No team members assigned
            </Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default ProjectDetails;
