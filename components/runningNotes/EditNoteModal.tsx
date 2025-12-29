// import React, { useEffect, useState, memo } from "react";
// import {
//   Modal,
//   View,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   ActivityIndicator,
// } from "react-native";
// import { Ionicons } from "@expo/vector-icons";
// import DateTimePicker from "@react-native-community/datetimepicker";
// import { Dropdown } from "react-native-element-dropdown";

// type Note = {
//   id: string;
//   text: string;
//   status: "Open" | "In Progress" | "Closed";
//   responsible: string | null;
//   targetDate: Date | null;
//   createdAt: Date;
// };

// const statusOptions = [
//   {
//     value: "Open",
//     label: "Open",
//     color: "#EF4444",
//     bg: "bg-red-500",
//     border: "border-red-500",
//   },
//   {
//     value: "In Progress",
//     label: "In Progress",
//     color: "#F59E0B",
//     bg: "bg-amber-500",
//     border: "#F59E0B",
//   },
//   {
//     value: "Closed",
//     label: "Closed",
//     color: "#22C55E",
//     bg: "bg-green-500",
//     border: "border-green-500",
//   },
// ];

// type Props = {
//   visible: boolean;
//   note: Note | null;
//   users: { label: string; value: string }[];
//   isSaving?: boolean;
//   onClose: () => void;
//   onSave: (note: Note) => void;
// };

// /* ============================
//    COMPONENT
// ============================ */

// const EditNoteModalComponent = ({
//   visible,
//   note,
//   users,
//   isSaving,
//   onClose,
//   onSave,
// }: Props) => {
//   const [localNote, setLocalNote] = useState<Note | null>(note);
//   const [showDatePicker, setShowDatePicker] = useState(false);

//   // Sync note when modal opens
//   useEffect(() => {
//     setLocalNote(note);
//   }, [note]);

//   if (!localNote) return null;

//   const isDisabled = !localNote.text.trim();

//   return (
//     <Modal visible={visible} transparent animationType="fade">
//       <View className="flex-1 bg-black/40 justify-center items-center px-4">
//         <View className="bg-white rounded-3xl w-full p-5 shadow-2xl">
//           {/* HEADER */}
//           <Text className="text-lg font-semibold text-gray-900 mb-4">
//             Edit Note
//           </Text>

//           {/* NOTE */}
//           <Text className="text-xs font-semibold text-gray-500 mb-1">
//             NOTE
//           </Text>

//           <TextInput
//             value={localNote.text}
//             multiline
//             textAlignVertical="top"
//             placeholder="Edit note..."
//             placeholderTextColor="#9CA3AF"
//             onChangeText={(text) =>
//               setLocalNote((prev) => prev && { ...prev, text })
//             }
//             className="border border-gray-200 rounded-2xl p-3 mb-4 text-sm bg-slate-50"
//           />

//           {/* STATUS */}
//           <Text className="text-xs font-semibold text-gray-500 mb-2">
//             STATUS
//           </Text>

//           <View className="flex-row flex-wrap gap-2 mb-4">
//             {statusOptions.map((s) => {
//               const active = localNote.status === s.value;

//               return (
//                 <TouchableOpacity
//                   key={s.value}
//                   onPress={() =>
//                     setLocalNote((prev) =>
//                       prev
//                         ? {
//                             ...prev,
//                             status: s.value as Note["status"],
//                           }
//                         : prev
//                     )
//                   }
//                   className={`flex-row items-center gap-2 px-3 py-3 rounded-full border ${
//                     active
//                       ? `${s.bg} ${s.border}`
//                       : "border-gray-300 bg-white"
//                   }`}
//                 >
//                   <View
//                     className="w-2.5 h-2.5 rounded-full"
//                     style={{
//                       backgroundColor: active ? "#fff" : s.color,
//                     }}
//                   />
//                   <Text
//                     className={`text-xs font-medium ${
//                       active ? "text-white" : "text-gray-700"
//                     }`}
//                   >
//                     {s.label}
//                   </Text>
//                 </TouchableOpacity>
//               );
//             })}
//           </View>

//           {/* RESPONSIBLE */}
//           <Text className="text-xs font-semibold text-gray-500 mb-2">
//             RESPONSIBLE
//           </Text>

//           <View className="mb-3">
//             <Dropdown
//               style={{
//                 borderWidth: 1,
//                 borderColor: "#E5E7EB",
//                 borderRadius: 14,
//                 height: 38,
//                 paddingHorizontal: 12,
//                 backgroundColor: "#F8FAFC",
//               }}
//               placeholder="Select responsible"
//               placeholderStyle={{ fontSize: 13, color: "#9CA3AF" }}
//               selectedTextStyle={{ fontSize: 13, color: "#111827" }}
//               data={users}
//               labelField="label"
//               valueField="value"
//               value={localNote.responsible}
//               onChange={(item) =>
//                 setLocalNote((prev) =>
//                   prev ? { ...prev, responsible: item.value } : prev
//                 )
//               }
//             />
//           </View>

//           {/* TARGET DATE */}
//           <Text className="text-xs font-semibold text-gray-500 mb-2">
//             TARGET DATE
//           </Text>

//           <TouchableOpacity
//             className="flex-row items-center gap-2 border border-gray-200 rounded-2xl px-3 py-2.5 mb-4 bg-slate-50"
//             onPress={() => setShowDatePicker(true)}
//           >
//             <Ionicons name="calendar-outline" size={16} color="#6B7280" />
//             <Text className="text-sm text-gray-700">
//               {localNote.targetDate
//                 ? localNote.targetDate.toDateString()
//                 : "Select target date"}
//             </Text>
//           </TouchableOpacity>

//           {showDatePicker && (
//             <DateTimePicker
//               value={localNote.targetDate || new Date()}
//               mode="date"
//               display="default"
//               onChange={(_, date) => {
//                 setShowDatePicker(false);
//                 if (date) {
//                   setLocalNote((prev) =>
//                     prev ? { ...prev, targetDate: date } : prev
//                   );
//                 }
//               }}
//             />
//           )}

//           {/* ACTIONS */}
//           <View className="flex-row justify-end gap-3 mt-2">
//             <TouchableOpacity
//               className="px-4 py-2 rounded-xl bg-slate-100"
//               onPress={onClose}
//             >
//               <Text className="text-slate-700 font-medium">Cancel</Text>
//             </TouchableOpacity>

//             <TouchableOpacity
//               disabled={isDisabled || isSaving}
//               onPress={() => onSave(localNote)}
//               className="px-5 py-2 rounded-xl"
//               style={{
//                 backgroundColor:
//                   isDisabled || isSaving ? "#A5B4FC" : "#4F46E5",
//               }}
//             >
//               {isSaving ? (
//                 <ActivityIndicator size="small" color="#fff" />
//               ) : (
//                 <Text className="text-white font-semibold">
//                   Save Changes
//                 </Text>
//               )}
//             </TouchableOpacity>
//           </View>
//         </View>
//       </View>
//     </Modal>
//   );
// };

// /* ============================
//    MEMO + DISPLAY NAME
// ============================ */

// const EditNoteModal = memo(EditNoteModalComponent);
// EditNoteModal.displayName = "EditNoteModal";

// export default EditNoteModal;
