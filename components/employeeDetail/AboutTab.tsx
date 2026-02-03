import {
  ArrowDown01Icon,
  ArrowRight01Icon,
  ArrowUp01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import moment from "moment";
import React, { useState } from "react";
import { Text, TouchableOpacity, View, useColorScheme } from "react-native";
import GlobalAvatar from "../GlobalAvatar";

interface AboutTabProps {
  userData: any;
}

const toProperCase = (name: any) => {
  if (!name) return "";
  return name
    .toLowerCase()
    .split(" ")
    .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const AboutTab: React.FC<AboutTabProps> = ({ userData }) => {
  const isDarkMode = useColorScheme() === "dark";
  const router = useRouter();
  const [isAboutExpanded, setIsAboutExpanded] = useState(false);

  const renderInfoField = (
    label: string,
    value: string | number | undefined,
  ) => (
    <View className="mb-4">
      <Text className="text-[#606060] dark:text-[#919191] text-xs font-poppins mb-1">
        {label}
      </Text>
      <Text className="text-black dark:text-white text-base font-dmMedium">
        {value || "N/A"}
      </Text>
    </View>
  );

  const renderUserRefField = (label: string, user: any) => {
    if (!user) return null;

    const isObject = typeof user === "object" && user !== null;
    const displayName = isObject ? user.fullName : user;
    const displayDesignation = isObject ? user.designation : "N/A";
    const profileImage = isObject ? user.profileImage : null;

    return (
      <View className="mb-4">
        <Text className="text-[#606060] dark:text-[#919191] text-xs font-poppins mb-2">
          {label}
        </Text>
        <TouchableOpacity
          onPress={() => {
            if (isObject && user._id) {
              router.push({
                pathname: "/employeeDetail",
                params: { userId: user._id },
              });
            }
          }}
          activeOpacity={0.7}
          className="bg-[#F0F3F7] dark:bg-[#1A1A1A] rounded-2xl p-3 flex-row items-center"
        >
          <GlobalAvatar
            name={displayName || "User"}
            fontSize={18}
            // uri={profileImage}
            size={48}
            borderRadius={12}
            className="mr-3"
          />

          <View className="flex-1">
            <Text className="text-black dark:text-white text-base font-dmBold">
              {displayName || "N/A"}
            </Text>
            <Text className="text-[#606060] dark:text-[#919191] text-xs font-poppins font-light">
              {displayDesignation}
            </Text>
          </View>

          <HugeiconsIcon
            icon={ArrowRight01Icon}
            size={20}
            color={isDarkMode ? "#919191" : "#606060"}
          />
        </TouchableOpacity>
      </View>
    );
  };

  const Section = ({
    title,
    children,
  }: {
    title: string;
    children: React.ReactNode;
  }) => (
    <View className="mb-8">
      <Text className="text-xl font-dmBold text-black dark:text-white mb-4">
        {title}
      </Text>
      {children}
    </View>
  );

  return (
    <View className="px-5 pt-4">
      {/* Basic Information */}
      <Section title="About">
        {renderInfoField("Full Name", userData?.fullName)}
        {renderInfoField("Username", userData?.username)}
        {userData?.about && (
          <View className="mb-4">
            <Text className="text-[#606060] dark:text-[#919191] text-xs font-poppins mb-1">
              About
            </Text>
            <TouchableOpacity
              onPress={() => setIsAboutExpanded(!isAboutExpanded)}
              activeOpacity={0.7}
              className="relative"
            >
              <View className="flex-row items-start">
                <Text
                  numberOfLines={isAboutExpanded ? undefined : 2}
                  className="flex-1 text-black dark:text-white text-base font-dmMedium leading-6 mr-2"
                >
                  {userData.about}
                </Text>
                <View className="pt-1">
                  <HugeiconsIcon
                    icon={isAboutExpanded ? ArrowUp01Icon : ArrowDown01Icon}
                    size={18}
                    color={isDarkMode ? "#919191" : "#606060"}
                  />
                </View>
              </View>
              {!isAboutExpanded && (
                <LinearGradient
                  colors={[
                    "transparent",
                    isDarkMode ? "rgba(0,0,0,0.7)" : "rgba(255,255,255,0.7)",
                  ]}
                  className="absolute bottom-0 left-0 right-0 h-10"
                  pointerEvents="none"
                />
              )}
            </TouchableOpacity>
          </View>
        )}
        {renderInfoField("Role", userData?.role)}

        {renderInfoField("Status", userData?.status)}
        {renderInfoField("Company", userData?.company)}
        {renderInfoField(
          "Total Experience",
          userData?.totalExperience
            ? `${userData.totalExperience} Years`
            : undefined,
        )}
        {renderInfoField(
          "Employee Code",
          userData?.employeeCode
            ? `W${userData.employeeCode.toString().padStart(3, "0")}`
            : undefined,
        )}
        {renderInfoField(
          "Joining Date",
          userData?.joiningDate
            ? moment(userData.joiningDate).format("DD MMM YYYY")
            : undefined,
        )}
        {userData?.createdBy && (
          <View className="mb-4">
            <Text className="text-[#606060] dark:text-[#919191] text-xs font-poppins mb-1">
              Created By
            </Text>
            <Text className="text-black dark:text-white text-base font-dmMedium">
              {userData.createdBy.fullName} ({userData.createdBy.role})
            </Text>
          </View>
        )}
        {renderInfoField(
          "Created At",
          userData?.createdAt
            ? moment(userData.createdAt).format("DD MMM YYYY, hh:mm A")
            : undefined,
        )}

        {renderUserRefField("Reporting to", userData?.reportingTo)}
        {renderUserRefField(
          "Secondary Reporting to",
          userData?.secondaryReportingTo,
        )}
      </Section>

      {/* Personal Information */}
      <Section title="Personal Details">
        {renderInfoField("Gender", userData?.gender)}
        {renderInfoField(
          "Birth Date",
          userData?.birthDate
            ? moment(userData.birthDate).format("DD MMM YYYY")
            : undefined,
        )}
        {renderInfoField("Father's Name", toProperCase(userData?.fatherName))}
        {renderInfoField("Mother's Name", toProperCase(userData?.motherName))}
        {renderInfoField("Marital Status", userData?.maritalStatus)}
        {userData?.maritalStatus === "Married" &&
          renderInfoField("Spouse Name", toProperCase(userData?.spouseName))}
        {renderInfoField("Home Address", toProperCase(userData?.homeAddress))}
        {renderInfoField("Blood Group", userData?.bloodGroup)}
      </Section>

      {/* Contact Information */}
      <Section title="Contact Details">
        {renderInfoField("Official Email", userData?.email)}
        {renderInfoField("Personal Email", userData?.personalEmail)}
        {userData?.contactNumbers && userData.contactNumbers.length > 0 && (
          <View className="mb-4">
            <Text className="text-[#606060] dark:text-[#919191] text-xs font-poppins mb-1">
              Phone Numbers
            </Text>
            {userData.contactNumbers.map((number: string, index: number) => (
              <Text
                key={index}
                className="text-black dark:text-white text-base font-dmMedium mb-1"
              >
                {number}
              </Text>
            ))}
          </View>
        )}
        {renderInfoField("Emergency Contact", userData?.emergencyContact)}
      </Section>

      {/* Identity Information */}
      <Section title="Identity Information">
        {renderInfoField("Aadhar Number", userData?.aadhar)}
        {renderInfoField("PAN Number", userData?.pan)}
      </Section>

      {/* Key Strengths */}
      {userData?.keyStrength && userData.keyStrength.length > 0 && (
        <Section title="Key Strengths">
          <View className="flex-row flex-wrap gap-2">
            {userData.keyStrength.map((skill: string, index: number) => (
              <View
                key={index}
                className="bg-[#F0F3F7] dark:bg-[#1A1A1A] px-3 py-1.5 rounded-lg"
              >
                <Text className="text-black dark:text-white font-poppins text-xs">
                  {skill}
                </Text>
              </View>
            ))}
          </View>
        </Section>
      )}

      {/* Languages */}
      {userData?.languages && userData.languages.length > 0 && (
        <Section title="Languages">
          <View className="flex-row flex-wrap gap-2 mb-4">
            {userData.languages.map((lang: string, index: number) => (
              <View
                key={index}
                className="bg-[#F0F3F7] dark:bg-[#1A1A1A] px-3 py-1.5 rounded-lg"
              >
                <Text className="text-black dark:text-white font-poppins text-xs">
                  {lang}
                </Text>
              </View>
            ))}
          </View>
        </Section>
      )}

      {/* Education */}
      <Section title="Education">
        {userData?.education && userData.education.length > 0 ? (
          userData.education.map((edu: any, index: number) => (
            <View key={index} className="mb-6">
              <Text className="text-[#606060] dark:text-[#919191] font-dmSemiBold text-base mb-1">
                {edu.qualification}{" "}
                <Text className="text-[#8E8E8E] dark:text-[#606060] font-dmMedium text-xs">
                  ({edu.graduationYear})
                </Text>
              </Text>
              {edu.specialization && (
                <Text className="text-black dark:text-white font-poppins text-sm mb-1">
                  {edu.specialization}
                </Text>
              )}
              <Text className="text-black dark:text-white font-poppins text-sm mb-1">
                {edu.college}
              </Text>
            </View>
          ))
        ) : (
          <Text className="text-[#606060] dark:text-[#919191] font-poppins">
            No education records
          </Text>
        )}
      </Section>

      {/* Experience */}
      <Section title="Work Experience">
        {userData?.experience && userData.experience.length > 0 ? (
          userData.experience.map((exp: any, index: number) => (
            <View key={index} className="mb-6">
              <Text className="text-[#606060] dark:text-[#919191] font-dmSemiBold text-sm mb-1">
                {exp.company} (
                {exp.fromDate ? moment(exp.fromDate).format("MMM YYYY") : "?"} -{" "}
                {exp.toDate ? moment(exp.toDate).format("MMM YYYY") : "Present"}
                )
              </Text>
              <Text className="text-black dark:text-white font-poppins text-sm mb-1">
                {exp.designation}
              </Text>
              {exp.jobDescription && (
                <Text className="text-black dark:text-white font-poppins text-sm leading-5">
                  {exp.jobDescription}
                </Text>
              )}
            </View>
          ))
        ) : (
          <Text className="text-[#606060] dark:text-[#919191] font-poppins">
            No past experience
          </Text>
        )}
      </Section>

      {/* Additional Information */}
      {userData?.additionalInfo && userData.additionalInfo.length > 0 && (
        <Section title="Additional Information">
          {userData.additionalInfo.map((info: string, index: number) => (
            <View key={index} className="mb-3">
              <Text className="text-black dark:text-white font-poppins text-sm">
                {info}
              </Text>
            </View>
          ))}
        </Section>
      )}

      <View className="h-20" />
    </View>
  );
};

export default AboutTab;
