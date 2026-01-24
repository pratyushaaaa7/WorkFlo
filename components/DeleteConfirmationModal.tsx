import { Delete03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import React from "react";
import { Text, TouchableOpacity, View, useColorScheme } from "react-native";
import Modal from "react-native-modal";

interface DeleteConfirmationModalProps {
  isVisible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  loading?: boolean;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isVisible,
  onClose,
  onConfirm,
  title = "Delete this item",
  message = "Are you sure you want to delete this element?\nThis action is final",
  loading = false,
}) => {
  const isDarkMode = useColorScheme() === "dark";

  return (
    <Modal
      isVisible={isVisible}
      onBackdropPress={onClose}
      onBackButtonPress={onClose}
      backdropOpacity={0.5}
      animationIn="zoomIn"
      animationOut="zoomOut"
      useNativeDriver
    >
      <View className="bg-white dark:bg-[#0D0D0D] rounded-[32px] p-6 ">
        {/* Trash Icon Circle */}
        <View className="w-12 h-12 rounded-full bg-[#FDE6E6] dark:bg-[#1A0A0A] items-center justify-center mb-4">
          <HugeiconsIcon
            icon={Delete03Icon}
            size={24}
            color="#DF5B5B"
            strokeWidth={1.5}
          />
        </View>

        {/* Text Content */}
        <Text className="text-black dark:text-white font-dmBold text-2xl mb-1 ">
          {title}
        </Text>
        <Text className="text-[#606060] dark:text-[#919191] font-poppins text-sm mb-6 leading-5">
          {message}
        </Text>

        {/* Action Buttons */}
        <View className="flex-row gap-3 w-full">
          <TouchableOpacity
            onPress={onClose}
            disabled={loading}
            className="flex-1 h-12 rounded-2xl border border-black dark:border-[#F5F5F5] items-center justify-center"
          >
            <Text className="text-black dark:text-white font-poppins">
              Cancel
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onConfirm}
            disabled={loading}
            className="flex-1 h-12 rounded-2xl bg-[#DF5B5B] items-center justify-center"
          >
            <Text className="text-white font-poppins">
              {loading ? "Deleting..." : "Confirm"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default DeleteConfirmationModal;
