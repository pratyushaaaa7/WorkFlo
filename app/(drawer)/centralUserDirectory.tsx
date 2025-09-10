import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { MaterialCommunityIcons, Entypo, Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

const Card = ({
  title,
  icon,
  bgColor,
  borderColor,
}: {
  title: string;
  icon: any;
  bgColor: string;
  borderColor: string;
}) => (
  <TouchableOpacity activeOpacity={0.8} className="mb-4">
    <View
      className={`flex-row items-center justify-between px-5 py-4 rounded-2xl`}
      style={{
        backgroundColor: bgColor,
        borderColor: borderColor,
        borderWidth: 1.5,
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
        elevation: 3,
      }}
    >
      <View className="flex-row items-center space-x-4">
        <MaterialCommunityIcons name={icon} size={28} color="#FFF" />
        <Text className="text-white text-lg font-semibold">{title}</Text>
      </View>
      <Entypo name="chevron-right" size={26} color="white" />
    </View>
  </TouchableOpacity>
);

export default function CentralUserDirectory() {
  return (
    <View className="flex-1 px-5 py-10 bg-white">
      {/* Cards */}
      <Card
        title="Client"
        icon="account-group-outline"
        bgColor="#4F8EF7" // soft Asana-style blue
        borderColor="#376ED7"
      />
      <Card
        title="Vendor"
        icon="storefront-outline"
        bgColor="#22B07D" // modern teal
        borderColor="#1D8A63"
      />
      <Card
        title="Contractor"
        icon="hammer-wrench"
        bgColor="#8B5CF6" // nice violet
        borderColor="#6D28D9"
      />

      {/* Floating + Button */}
      <TouchableOpacity
        onPress={() => router.push("/createUser")}
        style={{
          position: "absolute",
          bottom: 36,
          right: 20,
          width: 60,
          height: 60,
          borderRadius: 30,
          backgroundColor: "#4F46E5", // Indigo like Trello/Asana
          alignItems: "center",
          justifyContent: "center",
          shadowColor: "#000",
          shadowOpacity: 0.25,
          shadowRadius: 5,
          shadowOffset: { width: 0, height: 3 },
          elevation: 6,
        }}
      >
        <Ionicons name="add" size={30} color="white" />
      </TouchableOpacity>
    </View>
  );
}

// import React from "react";
// import { View, Text, TouchableOpacity } from "react-native";
// import { MaterialCommunityIcons, Entypo, Ionicons } from "@expo/vector-icons";
// import { router } from "expo-router";

// export default function CentralUserDirectory() {
//   const tabs = [
//     {
//       title: "Client",
//       icon: "account-group-outline",
//       color: "bg-sky-100",
//       border: "border-sky-300",
//       textColor: "text-sky-700",
//       description: "View and manage clients",
//     },
//     {
//       title: "Vendor",
//       icon: "storefront-outline",
//       color: "bg-teal-100",
//       border: "border-teal-300",
//       textColor: "text-teal-700",
//       description: "All registered vendors",
//     },
//     {
//       title: "Contractor",
//       icon: "hammer-wrench",
//       color: "bg-violet-100",
//       border: "border-violet-300",
//       textColor: "text-violet-700",
//       description: "Your contractors directory",
//     },
//   ];

//   return (
//     <View className="flex-1 px-4 py-10 bg-gray-50">
//       {tabs.map((tab, idx) => (
//         <TouchableOpacity key={idx} activeOpacity={0.7} className="mb-4">
//           <View
//             className={`flex-row items-center justify-between px-5 py-4 rounded-2xl shadow-sm border ${tab.border} ${tab.color}`}
//           >
//             <View className="flex-row items-center space-x-4">
//               <View className={`p-2 rounded-full ${tab.color} ${tab.border}`}>
//                 <MaterialCommunityIcons
//                   name={tab.icon as any}
//                   size={28}
//                   color={"#1f2937"} // slate-800
//                 />
//               </View>
//               <View>
//                 <Text className={`text-lg font-semibold ${tab.textColor}`}>
//                   {tab.title}
//                 </Text>
//                 <Text className="text-sm text-gray-500">{tab.description}</Text>
//               </View>
//             </View>
//             <Entypo name="chevron-right" size={24} color="#6b7280" />
//           </View>
//         </TouchableOpacity>
//       ))}

//       {/* Floating + Button */}
//       <TouchableOpacity
//         className="bg-indigo-600"
//         onPress={() => router.push("/createUser")}
//         style={{
//           position: "absolute",
//           bottom: 36,
//           right: 20,
//           width: 56,
//           height: 56,
//           borderRadius: 28,
//           alignItems: "center",
//           justifyContent: "center",
//           elevation: 8,
//           shadowColor: "#000",
//           shadowOffset: { width: 0, height: 3 },
//           shadowOpacity: 0.25,
//           shadowRadius: 3,
//         }}
//       >
//         <Ionicons name="add" size={28} color="white" />
//       </TouchableOpacity>
//     </View>
//   );
// }
