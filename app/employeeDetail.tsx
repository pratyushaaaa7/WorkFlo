import React, { useEffect, useState, useContext } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import api from "../lib/api";
import { AuthContext } from "../context/AuthContext";
import { useLocalSearchParams, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

const UserDetails = () => {
  const auth = useContext(AuthContext);
  const token = auth?.token;
  const router = useRouter();
  const { userId } = useLocalSearchParams();

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get(`/users/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(res.data);
      } catch (err) {
        console.error(
          "Error fetching user:",
          err.response?.data || err.message
        );
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [userId]);

  // Reusable Section card
  const Section = ({ icon, title, children }: any) => (
    <View className="bg-white p-5 rounded-2xl shadow-md mb-5">
      <View className="flex-row items-center mb-3">
        <Ionicons name={icon} size={22} color="#6366F1" />
        <Text className="ml-2 text-lg font-semibold text-gray-800">
          {title}
        </Text>
      </View>
      {children}
    </View>
  );

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
        }}
      >
        <TouchableOpacity
          onPress={() => router.push("/centralEmployeeDirectory")}
          className="flex-row items-center"
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
          <Text className="text-xl font-bold text-white ml-3">
            Employee Information
          </Text>
        </TouchableOpacity>
      </LinearGradient>

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#6366F1" />
        </View>
      ) : !user ? (
        <Text style={{ textAlign: "center", marginTop: 50 }}>
          User not found
        </Text>
      ) : (
        <ScrollView className="flex-1 px-4 py-4">
          {/* Profile Card */}
          <LinearGradient
            colors={["#EEF2FF", "#E0E7FF"]}
            className="rounded-2xl p-6 mb-6 shadow-md"
          >
            <Text className="text-2xl font-bold text-gray-900">
              {user.fullName}
            </Text>
            <Text className="text-gray-700 text-base mt-1">
              {user.designation} • {user.level}
            </Text>
            <Text className="text-gray-500 mt-1 text-sm">
              Employee Code: {user.employeeCode}
            </Text>
          </LinearGradient>

          {/* Contact Info */}
          <Section icon="call-outline" title="Contact">
            <View className="space-y-2">
              <Text className="text-gray-700">
                <Text className="font-medium">Official: </Text>
                {user.email}
              </Text>
              <Text className="text-gray-700">
                <Text className="font-medium">Personal: </Text>
                {user.personalEmail}
              </Text>
              <Text className="text-gray-700">
                <Text className="font-medium">Phone: </Text>
                {user.contactNumbers?.join(", ")}
              </Text>
              <Text className="text-gray-700 ">
                <Text className="font-medium">Phone: </Text>{" "}
                {user.emergencyContact}
              </Text>
            </View>
          </Section>

          {/* Personal Info */}
          <Section icon="person-circle-outline" title="Personal Info">
            <View className="space-y-2">
              <Text className="text-gray-700">
                <Text className="font-medium">Gender: </Text>
                {user.gender}
              </Text>
              <Text className="text-gray-700">
                <Text className="font-medium">Father: </Text>
                {user.fatherName}
              </Text>
              <Text className="text-gray-700">
                <Text className="font-medium">Mother: </Text>
                {user.motherName}
              </Text>
              <Text className="text-gray-700">
                <Text className="font-medium">Marital: </Text>
                {user.maritalStatus}
              </Text>
              {user.maritalStatus === "married" && (
                <Text className="text-gray-700">
                  <Text className="font-medium">Spouse: </Text>
                  {user.spouseName}
                </Text>
              )}
              <Text className="text-gray-700">
                <Text className="font-medium">Address: </Text>
                {user.homeAddress}
              </Text>
            </View>
          </Section>

          {/* Education */}
          <Section icon="school-outline" title="Education">
            {user.education?.length > 0 ? (
              user.education.map((edu: any, i: number) => (
                <View
                  key={i}
                  className="bg-gray-50 p-3 rounded-xl mb-3 border border-gray-100"
                >
                  <Text className="text-gray-900 font-medium">
                    {edu.qualification}
                  </Text>
                  <Text className="text-gray-600">{edu.college}</Text>
                  <Text className="text-gray-500 text-sm mt-1">
                    {edu.graduationDate
                      ? new Date(edu.graduationDate).toLocaleDateString()
                      : "N/A"}
                  </Text>
                </View>
              ))
            ) : (
              <Text className="text-gray-500">No education records</Text>
            )}
          </Section>

          {/* Experience */}
          <Section icon="briefcase-outline" title="Experience">
            {user.experience?.length > 0 ? (
              user.experience.map((exp: any, i: number) => (
                <View
                  key={i}
                  className="bg-gray-50 p-3 rounded-xl mb-3 border border-gray-100"
                >
                  <Text className="text-gray-900 font-medium">
                    {exp.company}
                  </Text>
                  <Text className="text-gray-600">{exp.designation}</Text>
                  <Text className="text-gray-500 text-sm mt-1">
                    {exp.fromDate
                      ? new Date(exp.fromDate).toLocaleDateString()
                      : "?"}{" "}
                    -{" "}
                    {exp.toDate
                      ? new Date(exp.toDate).toLocaleDateString()
                      : "Present"}
                  </Text>
                </View>
              ))
            ) : (
              <Text className="text-gray-500">No past experience</Text>
            )}
          </Section>

          {/* Additional Info */}
          <Section icon="information-circle-outline" title="Additional Info">
            {user.additionalInfo?.length > 0 ? (
              user.additionalInfo.map((info: string, i: number) => (
                <View
                  key={i}
                  className="bg-gray-50 p-3 rounded-xl mb-3 border border-gray-100"
                >
                  <Text className="text-gray-700">{info}</Text>
                </View>
              ))
            ) : (
              <Text className="text-gray-500">No additional info</Text>
            )}
          </Section>
        </ScrollView>
      )}
    </View>
  );
};

export default UserDetails;
