import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  StyleSheet,
  Pressable,
} from "react-native";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { BlurView } from "expo-blur";
import { AnimatePresence, MotiView } from "moti";

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get("window");

interface ProjectInfoModalProps {
  visible: boolean;
  onClose: () => void;
  initialTab?: string;
  isDarkMode: boolean;
}

const INFO_DATA = [
  {
    key: "directory",
    title: "User Directory",
    content: "This is a comprehensive contact list of all project stakeholders including client, consultant, vendors and internal team members with their roles and contact details. It also includes the company/firm/organisation contacts details of all the agencies involved in the project. This list must be populated from the Central Directory only. If you want to add a new Stakeholder or Agency or Individual, then they should be first added into the central directory, post which they may be added to the user directory. General contacts should not be added to the User Directory. Contact should be added only when they are a confirmed appointed agency or individual."
  },
  {
    key: "ilr",
    title: "ILR (Issue Log Register)",
    content: "This is a record of all the design or client decision related issues through the life cycle of the project. They are populated periodically &/or as and when a need arises. They are to be raised to the respective consultant or client or client representative. Its progress should be highlighted at every project review. All the issues maybe printed in a pre-set format. The target date to resolve a particular issue should be fed after due consultation with the responsible agency/individual, since the delay days will be populated and red flags will be raised periodically, highlighting the delay attributions. Since the current version does not allow for consultant or client dashboards, it is imperative that these issues will be shared through pdfs or excel sheets. It is expected that the consultant or client will revert by manually feeding these sheets. It is the responsibility of the ILR creator to record their revert on the App, till the time client and consultants are not provided App access."
  },
  {
    key: "mom",
    title: "Minutes",
    content: "This is a record of all meetings held during the life cycle of the project, including their agenda and minutes, documenting the discussions, decisions taken and actions pointing to the responsible agency or individual (selected from the user directory). It is important to record agenda prior to every meeting and it is extremely important to submit the minutes within 1 hour of completion of the meeting."
  },
  {
    key: "dpr",
    title: "Reports",
    content: "This is a record of Daily Progress Reports (DPR) of the site currently listing labour strength and tagged/captioned pictures of the construction site. This report is prepared at close of business, everyday and is shared shared with the relevant stake holders on daily basis."
  },
  {
    key: "svr",
    title: "Site Visit Reports",
    content: "This is a record of reports prepared after each site inspections highlighting progress, observations, site instructions, quality issues, and recommendations. This report is to be documented and shared with relevant team members within the 1 hour of completion of the site visit."
  },
  {
    key: "projectStage",
    title: "Project Stage",
    content: "Records and Shows the current status of the project. It also records the predicted vs achieved days to finish each stage, along with its activity chart."
  },
  {
    key: "runningNotes",
    title: "Running Notes",
    content: "This is a continuous record of day-to-day project planning/reviews of the reviews done internally. It records each observation/discussions, updates, reminders and important site notes related to the project. It may be printed and shared with the relevant stake holders. Generally its referred to by the project internal team on daily basis."
  }
];

export const ProjectInfoModal = ({
  visible,
  onClose,
  initialTab,
  isDarkMode,
}: ProjectInfoModalProps) => {
  const activeContent =
    INFO_DATA.find((tab) => tab.key === initialTab) || INFO_DATA[0];

  const colors = {
    modalBg: isDarkMode ? "#1A1A1A" : "#FBFCFD",
    closeIconBg: isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)",
  };

  // Heading: White in DM, Black in LM
  const headingColor = isDarkMode ? "#FFFFFF" : "#000000";
  // Content: f5f5f5 in DM, #454545 in LM
  const contentColor = isDarkMode ? "#F5F5F5" : "#454545";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/40 justify-end items-center">
        <Pressable className="absolute inset-0" onPress={onClose} />

        <MotiView
          from={{ opacity: 0, scale: 0.9, translateY: 100 }}
          animate={{ opacity: 1, scale: 1, translateY: 0 }}
          exit={{ opacity: 0, scale: 0.9, translateY: 100 }}
          transition={{ type: "timing", duration: 300 }}
          style={{
            backgroundColor: colors.modalBg,
            width: "92%",
            height: SCREEN_HEIGHT * 0.4,
            marginBottom: 30,
            borderRadius: 36,
            elevation: 15,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.2,
            shadowRadius: 15,
          }}
          className="overflow-hidden pt-[10px]"
        >
          {/* Header */}
          <View className="flex-row justify-between items-center px-5 pt-3.5 pb-[15px]">
            <Text
              className="text-[22px] font-dmSemiBold flex-1"
              style={{ color: headingColor }}
            >
              {activeContent.title}
            </Text>
            <TouchableOpacity
              onPress={onClose}
              className="w-7 h-7 rounded-full items-center justify-center"
              style={{ backgroundColor: colors.closeIconBg }}
            >
              <HugeiconsIcon icon={Cancel01Icon} size={16} color={headingColor} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView
            className="flex-1"
            showsVerticalScrollIndicator={true}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
          >
            <Text
              className="text-[15px] font-poppins leading-6 text-justify"
              style={{ color: contentColor }}
            >
              {activeContent.content}
            </Text>
          </ScrollView>
        </MotiView>
      </View>
    </Modal>
  );
};
