import React, { memo } from "react";
import { Modal, View, Text, TouchableOpacity } from "react-native";

type Props = {
  visible: boolean;
  onCancel: () => void;
  onDelete: () => void;
};

const DeleteNoteModalComponent = ({ visible, onCancel, onDelete }: Props) => {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 bg-black/40 justify-center items-center px-6">
        <View className="bg-white rounded-2xl w-full p-4">
          <Text className="text-base font-semibold text-gray-900 mb-2">
            Delete Note
          </Text>

          <Text className="text-sm text-gray-600 mb-4">
            Are you sure you want to delete this note? This action cannot be
            undone.
          </Text>

          <View className="flex-row justify-end gap-3">
            <TouchableOpacity
              className="px-4 py-2 rounded-lg bg-slate-100"
              onPress={onCancel}
            >
              <Text className="text-slate-700 text-sm">Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="px-4 py-2 rounded-lg bg-red-600"
              onPress={onDelete}
            >
              <Text className="text-white text-sm font-semibold">Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// Memoized component with display name
const DeleteNoteModal = memo(DeleteNoteModalComponent);
DeleteNoteModal.displayName = "DeleteNoteModal";

export default DeleteNoteModal;
