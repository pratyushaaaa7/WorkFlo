import moment from "moment";
import React from "react";
import { Text, View, useColorScheme } from "react-native";

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

  const renderInfoField = (label: string, value: string | undefined) => (
    <View className="mb-4">
      <Text className="text-[#606060] dark:text-[#919191] text-xs font-poppins mb-1">
        {label}
      </Text>
      <Text className="text-black dark:text-white text-base font-dmMedium">
        {value || "N/A"}
      </Text>
    </View>
  );

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
      <Section title="Basic Information">
        {renderInfoField("Full Name", userData?.fullName)}
        {renderInfoField("Username", userData?.username)}
        {renderInfoField("Role", userData?.role)}
        {renderInfoField("Status", userData?.status)}
        {renderInfoField("Company", userData?.company)}
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
      </Section>

      {/* Contact Information */}
      <Section title="Contact Information">
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

      {/* Personal Information */}
      <Section title="Personal Information">
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

      {/* Identity Information */}
      <Section title="Identity Information">
        {renderInfoField("Aadhar Number", userData?.aadhar)}
        {renderInfoField("PAN Number", userData?.pan)}
      </Section>

      {/* Education */}
      <Section title="Education">
        {userData?.education && userData.education.length > 0 ? (
          userData.education.map((edu: any, index: number) => (
            <View key={index} className="mb-4">
              <Text className="text-black dark:text-white font-dmBold text-base mb-1">
                {edu.qualification}
              </Text>
              <Text className="text-[#606060] dark:text-[#919191] font-poppins text-sm mb-1">
                {edu.college}
              </Text>
              <Text className="text-[#8E8E8E] dark:text-[#606060] font-poppins text-xs">
                {edu.graduationYear}
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
            <View key={index} className="mb-4">
              <Text className="text-black dark:text-white font-dmBold text-base mb-1">
                {exp.company}
              </Text>
              <Text className="text-[#606060] dark:text-[#919191] font-poppins text-sm mb-1">
                {exp.designation}
              </Text>
              <Text className="text-[#8E8E8E] dark:text-[#606060] font-poppins text-xs">
                {exp.fromDate ? moment(exp.fromDate).format("MMM YYYY") : "?"} -{" "}
                {exp.toDate ? moment(exp.toDate).format("MMM YYYY") : "Present"}
              </Text>
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
