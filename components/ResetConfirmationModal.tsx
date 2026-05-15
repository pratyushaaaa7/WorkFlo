import { Refresh04Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import React from "react";
import { Text, TouchableOpacity, View, useColorScheme } from "react-native";
import Modal from "react-native-modal";

interface ResetConfirmationModalProps {
  isVisible: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const ResetConfirmationModal: React.FC<ResetConfirmationModalProps> = ({
  isVisible,
  onClose,
  onConfirm,
}) => {
  const isDarkMode = useColorScheme() === "dark";

  return (
    <Modal
      isVisible={isVisible}
      onBackdropPress={onClose}
      onBackButtonPress={onClose}
      backdropOpacity={0.4}
      animationIn="fadeIn"
      animationOut="fadeOut"
      useNativeDriver
    >
      <View className="bg-white dark:bg-[#000000] rounded-[16px] p-4">
        <View className="flex-row items-center mb-4">
          <HugeiconsIcon
            icon={Refresh04Icon}
            size={24}
            color={isDarkMode ? "#FFFFFF" : "#000000"}
          />
          <Text 
            className="ml-3 text-black dark:text-white font-dmSemiBold text-[18px]"
          
          >
            Reset to default
          </Text>
        </View>

        <Text 
          className="text-[#454545] dark:text-[#BBBBBB] font-poppinsMedium text-[12px] mb-8 leading-[18px]"
         
        >
          This will restore all tabs, layout, and preferences to their original default settings.
        </Text>

        <View className="flex-row gap-3">
          <TouchableOpacity
            onPress={onClose}
            className="flex-1 h-[46px] rounded-[12px] border border-[#D2D2D2] dark:border-[#454545] items-center justify-center"
          >
            <Text 
              className="text-black dark:text-white font-poppinsMedium text-[16px]"
            
            >
              Cancel
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onConfirm}
            className="flex-1 h-[46px] rounded-[12px] bg-[#FF5F5F] items-center justify-center"
          >
            <Text 
              className="text-white font-poppinsMedium text-[16px]"
         
            >
              Confirm
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default ResetConfirmationModal;
