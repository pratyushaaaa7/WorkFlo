import {
  ArrowDown01Icon,
  ArrowRight01Icon,
  ArrowUp01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import moment from "moment";
import { Skeleton } from "moti/skeleton";
import React, { useState } from "react";
import { Text, TouchableOpacity, View, useColorScheme } from "react-native";
import Toast from "react-native-toast-message";
import GlobalAvatar from "../GlobalAvatar";

interface AboutTabProps {
  userData: any;
  loading: boolean;
}

const toProperCase = (name: any) => {
  if (!name) return "";
  return name
    .toLowerCase()
    .split(" ")
    .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const InfoField = ({
  label,
  value,
  isDarkMode,
  loading,
  copyable = false,
}: {
  label: string;
  value: string | number | undefined;
  isDarkMode: boolean;
  loading: boolean;
  copyable?: boolean;
}) => (
  <View className="mb-2">
    <Text className="text-[#606060] dark:text-[#919191] text-xs font-poppins mb-1">
      {label}
    </Text>
    <Skeleton
      colorMode={isDarkMode ? "dark" : "light"}
      show={loading && !value}
      width={label === "About" ? "100%" : 150}
      height={20}
      radius={4}
    >
      {copyable && value ? (
        <TouchableOpacity
          activeOpacity={0.7}
          onLongPress={async () => {
            await Clipboard.setStringAsync(String(value));
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            Toast.show({
              type: "success",
              text1: "Copied",
              text2: `${label} copied to clipboard`,
              position: "bottom",
            });
          }}
        >
          <Text className="text-black dark:text-white text-base font-dmMedium">
            {value}
          </Text>
        </TouchableOpacity>
      ) : (
        <Text className="text-black dark:text-white text-base font-dmMedium">
          {value || "N/A"}
        </Text>
      )}
    </Skeleton>
  </View>
);

const UserRefField = ({
  label,
  user,
  isDarkMode,
  loading,
  router,
}: {
  label: string;
  user: any;
  isDarkMode: boolean;
  loading: boolean;
  router: any;
}) => {
  if (!user && !loading) return null;

  const isObject = typeof user === "object" && user !== null;
  const displayName = isObject ? user.fullName : user;
  const displayDesignation = isObject ? user.designation : "N/A";

  return (
    <View className="mb-2">
      <Text className="text-[#606060] dark:text-[#919191] text-xs font-poppins mb-1">
        {label}
      </Text>
      <Skeleton
        colorMode={isDarkMode ? "dark" : "light"}
        show={loading && !user}
        width="100%"
        height={70}
        radius={16}
      >
        <TouchableOpacity
          onPress={() => {
            if (isObject && user._id) {
              router.replace({
                pathname: "/employeeDetail" as any,
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
      </Skeleton>
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
  <View className="mb-4">
    <Text className="text-xl font-dmBold text-black dark:text-white mb-2">
      {title}
    </Text>
    {children}
  </View>
);

const AboutTab: React.FC<AboutTabProps> = ({ userData, loading }) => {
  const isDarkMode = useColorScheme() === "dark";
  const router = useRouter();
  const [isAboutExpanded, setIsAboutExpanded] = useState(false);

  return (
    <View className="px-5 pt-4">
      {/* Basic Information */}
      <Section title="About">
        <InfoField
          label="Full Name"
          value={userData?.fullName}
          isDarkMode={isDarkMode}
          loading={loading}
        />
        <InfoField
          label="Username"
          value={userData?.username}
          isDarkMode={isDarkMode}
          loading={loading}
        />
        {userData?.about && (
          <View className="mb-2">
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
        <InfoField
          label="Role"
          value={userData?.role}
          isDarkMode={isDarkMode}
          loading={loading}
        />
        <InfoField
          label="Status"
          value={userData?.status}
          isDarkMode={isDarkMode}
          loading={loading}
        />
        <InfoField
          label="Company"
          value={userData?.company}
          isDarkMode={isDarkMode}
          loading={loading}
        />
        <InfoField
          label="Total Experience"
          value={
            userData?.totalExperience
              ? `${userData.totalExperience} Years`
              : undefined
          }
          isDarkMode={isDarkMode}
          loading={loading}
        />
        <InfoField
          label="Employee Code"
          value={
            userData?.employeeCode
              ? `W${userData.employeeCode.toString().padStart(3, "0")}`
              : undefined
          }
          isDarkMode={isDarkMode}
          loading={loading}
        />
        <InfoField
          label="Joining Date"
          value={
            userData?.joiningDate
              ? moment(userData.joiningDate).format("DD MMM YYYY")
              : undefined
          }
          isDarkMode={isDarkMode}
          loading={loading}
        />
        {userData?.createdBy && (
          <View className="mb-2">
            <Text className="text-[#606060] dark:text-[#919191] text-xs font-poppins mb-1">
              Created By
            </Text>
            <Text className="text-black dark:text-white text-base font-dmMedium">
              {userData.createdBy.fullName} ({userData.createdBy.role})
            </Text>
          </View>
        )}
        <InfoField
          label="Created At"
          value={
            userData?.createdAt
              ? moment(userData.createdAt).format("DD MMM YYYY, hh:mm A")
              : undefined
          }
          isDarkMode={isDarkMode}
          loading={loading}
        />

        <UserRefField
          label="Reporting to"
          user={userData?.reportingTo}
          isDarkMode={isDarkMode}
          loading={loading}
          router={router}
        />
        <UserRefField
          label="Secondary Reporting to"
          user={userData?.secondaryReportingTo}
          isDarkMode={isDarkMode}
          loading={loading}
          router={router}
        />
      </Section>

      {/* Direct Reports */}
      {userData?.directReports && userData.directReports.length > 0 && (
        <Section title="Direct Reports">
          <View className="gap-y-2 mb-2">
            {userData.directReports.map((report: any) => (
              <TouchableOpacity
                key={report._id}
                onPress={() => {
                  if (report._id) {
                    router.replace({
                      pathname: "/employeeDetail" as any,
                      params: { userId: report._id },
                    });
                  }
                }}
                activeOpacity={0.7}
                className="bg-[#F0F3F7] dark:bg-[#1A1A1A] mb-3 rounded-2xl p-3 flex-row items-center"
              >
                <GlobalAvatar
                  name={report.fullName || "User"}
                  fontSize={18}
                  size={48}
                  borderRadius={12}
                  className="mr-3"
                />

                <View className="flex-1">
                  <Text className="text-black dark:text-white text-base font-dmBold">
                    {report.fullName || "N/A"}
                  </Text>
                  <Text className="text-[#606060] dark:text-[#919191] text-xs font-poppins font-light">
                    {report.designation || "N/A"}
                  </Text>
                </View>

                <HugeiconsIcon
                  icon={ArrowRight01Icon}
                  size={20}
                  color={isDarkMode ? "#919191" : "#606060"}
                />
              </TouchableOpacity>
            ))}
          </View>
        </Section>
      )}

      {/* Personal Information */}
      <Section title="Personal Details">
        <InfoField
          label="Gender"
          value={userData?.gender}
          isDarkMode={isDarkMode}
          loading={loading}
        />
        <InfoField
          label="Birth Date"
          value={
            userData?.birthDate
              ? moment(userData.birthDate).format("DD MMM YYYY")
              : undefined
          }
          isDarkMode={isDarkMode}
          loading={loading}
        />
        <InfoField
          label="Father's Name"
          value={toProperCase(userData?.fatherName)}
          isDarkMode={isDarkMode}
          loading={loading}
        />
        <InfoField
          label="Mother's Name"
          value={toProperCase(userData?.motherName)}
          isDarkMode={isDarkMode}
          loading={loading}
        />
        <InfoField
          label="Marital Status"
          value={userData?.maritalStatus}
          isDarkMode={isDarkMode}
          loading={loading}
        />
        {userData?.maritalStatus === "Married" && (
          <InfoField
            label="Spouse Name"
            value={toProperCase(userData?.spouseName)}
            isDarkMode={isDarkMode}
            loading={loading}
          />
        )}
        <InfoField
          label="Home Address"
          value={toProperCase(userData?.homeAddress)}
          isDarkMode={isDarkMode}
          loading={loading}
        />
        <InfoField
          label="Blood Group"
          value={userData?.bloodGroup}
          isDarkMode={isDarkMode}
          loading={loading}
        />
      </Section>

      {/* Contact Information */}
      <Section title="Contact Details">
        <InfoField
          label="Official Email"
          value={userData?.email}
          copyable
          isDarkMode={isDarkMode}
          loading={loading}
        />
        <InfoField
          label="Personal Email"
          value={userData?.personalEmail}
          copyable
          isDarkMode={isDarkMode}
          loading={loading}
        />
        {userData?.contactNumbers && userData.contactNumbers.length > 0 && (
          <View className="mb-2">
            <Text className="text-[#606060] dark:text-[#919191] text-xs font-poppins mb-1">
              Phone Numbers
            </Text>
            {userData.contactNumbers.map((number: string, index: number) => (
              <TouchableOpacity
                key={index}
                activeOpacity={0.7}
                onLongPress={async () => {
                  await Clipboard.setStringAsync(number);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  Toast.show({
                    type: "success",
                    text1: "Copied",
                    text2: "Phone number copied to clipboard",
                    position: "bottom",
                  });
                }}
              >
                <Text className="text-black dark:text-white text-base font-dmMedium mb-1">
                  {number}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        <InfoField
          label="Emergency Contact"
          value={userData?.emergencyContact}
          copyable
          isDarkMode={isDarkMode}
          loading={loading}
        />
      </Section>

      {/* Identity Information */}
      <Section title="Identity Information">
        <InfoField
          label="Aadhar Number"
          value={userData?.aadhar}
          isDarkMode={isDarkMode}
          loading={loading}
        />
        <InfoField
          label="PAN Number"
          value={userData?.pan}
          isDarkMode={isDarkMode}
          loading={loading}
        />
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
          <View className="flex-row flex-wrap gap-2 mb-2">
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
            <View key={index} className="mb-3">
              <Text className="text-[#606060] dark:text-[#919191] font-dmSemiBold text-base mb-1">
                {edu.qualification}{" "}
                <Text className="text-[#8E8E8E] dark:text-[#606060] font-dmSemiBold text-xs">
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
            <View key={index} className="mb-3">
              <Text className="text-[#606060] dark:text-[#919191] font-dmSemiBold text-sm mb-1">
                {exp.company}{" "}
                <Text className="text-[#8E8E8E] dark:text-[#606060] font-dmSemiBold text-xs">
                  (
                  {exp.fromDate ? moment(exp.fromDate).format("MMM YYYY") : "?"}{" "}
                  -{" "}
                  {exp.toDate
                    ? moment(exp.toDate).format("MMM YYYY")
                    : "Present"}
                  )
                </Text>
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
            <View key={index} className="mb-2">
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
