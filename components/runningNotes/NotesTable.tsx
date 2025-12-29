// // MemoizedNote.tsx
// import React, { memo } from "react";
// import { View, Text, TouchableOpacity } from "react-native";
// import { Swipeable } from "react-native-gesture-handler";

// const getNoteBgColor = (status: string) => {
//   switch (status) {
//     case "Open":
//       return "#FEE2E2";
//     case "In Progress":
//       return "#FEF3C7";
//     case "Closed":
//       return "#D1FAE5";
//     default:
//       return "#FFFFFF";
//   }
// };

// const MemoizedNote = ({ note, users, onPress, swipeableRef, onSwipeableWillOpen }) => (
//   <Swipeable
//     ref={(ref) => {
//       if (ref) swipeableRef.current.set(note.id, ref);
//     }}
//     overshootRight
//     rightThreshold={120}
//     onSwipeableWillOpen={() => onSwipeableWillOpen(note)}
//   >
//     <TouchableOpacity activeOpacity={0.8} onPress={() => onPress(note)}>
//       <View className="flex-row border-l border-slate-400 bg-white">
//         {/* Note */}
//         <View
//           className="border-r border-b border-gray-300 px-2 py-1"
//           style={{ flex: 3, backgroundColor: getNoteBgColor(note.status) }}
//         >
//           <Text className="text-sm text-black">{note.text}</Text>
//         </View>

//         {/* Responsible */}
//         <View className="border-r border-b border-gray-300 px-1 py-1" style={{ flex: 1 }}>
//           <Text className="text-xs" numberOfLines={2}>
//             {users.find((u) => u.value === note.responsible)?.label || "N/A"}
//           </Text>
//         </View>

//         {/* Target Date */}
//         <View className="border-r border-b border-gray-300 px-1 py-1" style={{ flex: 1 }}>
//           <Text className="text-xs">{note.targetDate ? note.targetDate.toDateString() : "N/A"}</Text>
//         </View>
//       </View>
//     </TouchableOpacity>
//   </Swipeable>
// );

// export default memo(MemoizedNote);
