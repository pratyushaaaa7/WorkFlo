// import React, { useEffect, useState, useContext, useMemo } from "react";
// import {
//   View,
//   Text,
//   FlatList,
//   TouchableOpacity,
//   ActivityIndicator,
//   TextInput,
// } from "react-native";
// import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
// import { router, useLocalSearchParams } from "expo-router";
// import { AuthContext } from "@/context/AuthContext";
// import api from "@/lib/api";
// import { LinearGradient } from "expo-linear-gradient";

// export default function UserRoleList() {
//   const { role } = useLocalSearchParams(); // role = client/vendor/consultant
//   const auth = useContext(AuthContext);
//   const token = auth?.token;

//   const [users, setUsers] = useState<any[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [searchQuery, setSearchQuery] = useState("");

//   useEffect(() => {
//     const fetchUsers = async () => {
//       try {
//         const res = await api.get(`/user-directory`, {
//           headers: { Authorization: `Bearer ${token}` },
//         });
//         // Filter users by role from params
//         const filtered = res.data.filter(
//           (u: any) => u.role?.toLowerCase() === role?.toString().toLowerCase()
//         );
//         setUsers(filtered);
//       } catch (err) {
//         console.error("Error fetching users:", err);
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchUsers();
//   }, [role]);

//   // 🔍 Filtered list (computed using useMemo for efficiency)
//   const filteredUsers = useMemo(() => {
//     if (!searchQuery.trim()) return users;

//     const q = searchQuery.toLowerCase();

//     return users.filter((u) => {
//       return (
//         u.individualName?.toLowerCase().includes(q) ||
//         u.userCode?.toString().toLowerCase().includes(q) ||
//         u.firmName?.toLowerCase().includes(q) ||
//         u.expertiseList?.some((e: string) => e.toLowerCase().includes(q)) ||
//         u.designationList?.some((d: string) => d.toLowerCase().includes(q))
//       );
//     });
//   }, [searchQuery, users]);

//   const renderUser = ({ item }: { item: any }) => (
//     <TouchableOpacity
//       activeOpacity={0.9}
//       className="mx-3 mt-3 rounded-2xl overflow-hidden shadow-md"
//       onPress={() =>
//         router.push({
//           pathname: "/userDetail",
//           params: { user: JSON.stringify(item) },
//         })
//       }
//     >
//       {/* Gradient Background */}
//       <View
//         // colors={["#ffffff", "#F9FAFB"]}
//         // start={{ x: 0, y: 0 }}
//         // end={{ x: 1, y: 1 }}
//         className="p-4 border bg-white border-gray-100"
//       >
//         {/* Header Row */}
//         <View className="flex-row justify-between items-center">
//           <View className="flex-1 pr-3">
//             <Text className="text-base font-semibold text-gray-900">
//               <Text className="text-xs text-red-500 font-bold">
//                 #{item.userCode || ""}
//               </Text>
//               {"  "}
//               {item.gender === "Male"
//                 ? `Mr. ${item.individualName || "Unnamed"}`
//                 : item.gender === "Female"
//                 ? `Ms. ${item.individualName || "Unnamed"}`
//                 : item.individualName || "Unnamed"}
//               {"  "}
//               {/* {item.individualName || "Unnamed"} */}
//             </Text>
//           </View>

//           {/* Role + Edit */}
//           <View className="flex-row items-center">
//             <View className="bg-indigo-100 px-2.5 py-0.5 rounded-full mr-2 border border-indigo-200">
//               <Text className="text-indigo-700 text-[11px] font-semibold">
//                 {item.role}
//               </Text>
//             </View>

//             <TouchableOpacity
//               onPress={() =>
//                 router.push({
//                   pathname: "/createUser",
//                   params: { userData: JSON.stringify(item) },
//                 })
//               }
//               className="bg-sky-100 rounded-full p-1"
//               activeOpacity={0.7}
//             >
//               <Ionicons name="create-outline" size={18} color="#4F46E5" />
//             </TouchableOpacity>
//           </View>
//         </View>

//         {/* Divider */}
//         <View className="h-[1px] bg-gray-100 my-2" />

//         {/* Info Row */}
//         <View className="flex-row justify-between items-center">
//           <View className="flex-1 mr-3">
//             <View className="flex-row items-center mb-1">
//               <MaterialCommunityIcons
//                 name="briefcase-outline"
//                 size={14}
//                 color="#6B7280"
//               />
//               <Text
//                 numberOfLines={1}
//                 className="ml-1 text-[12px] text-gray-700"
//               >
//                 {item.designationList?.join(", ") || "No Designation"}
//               </Text>
//             </View>

//             <View className="flex-row items-center">
//               <Ionicons name="business-outline" size={13} color="#6B7280" />
//               <Text
//                 numberOfLines={1}
//                 className="ml-1 text-[12px] text-gray-600"
//               >
//                 {item.firmName || "N/A"}
//               </Text>
//             </View>
//           </View>

//           {/* Rating */}
//           <View className="flex-row items-center">
//             {item.averageRating && item.averageRating > 0 ? (
//               <>
//                 <Ionicons name="star" size={16} color="#FACC15" />
//                 <Text className="ml-1 text-gray-700 text-sm font-semibold">
//                   {item.averageRating.toFixed(1)}
//                 </Text>
//                 <Text className="text-gray-400 text-xs"> / 5</Text>
//               </>
//             ) : (
//               <Text className="text-gray-400 text-xs italic">No rating</Text>
//             )}
//           </View>
//         </View>
//       </View>
//     </TouchableOpacity>
//   );

//   return (
//     <View className="flex-1 bg-gray-50 ">
//       <LinearGradient colors={["#6366F1", "#8B5CF6"]}>
//         <View
//           className="pt-16  mb-6 px-4 flex-row items-center justify-between"
//           style={{
//             shadowColor: "#000",
//             shadowOffset: { width: 0, height: 3 },
//             shadowOpacity: 0.25,
//             shadowRadius: 4,
//             elevation: 6,
//             zIndex: 10,
//           }}
//         >
//           {/* Back Button + Title */}
//           <TouchableOpacity
//             onPress={() => router.push("/(drawer)/centralUserDirectory")}
//             className="flex-row items-center"
//             activeOpacity={0.7}
//           >
//             <Ionicons name="arrow-back" size={24} color="#fff" />
//             <Text className="text-xl font-semibold text-white ml-4">
//               {role} Directory
//             </Text>
//           </TouchableOpacity>
//         </View>
//       </LinearGradient>

//       <View className="px-4 mt-3">
//         <View className="flex-row items-center bg-white border border-gray-200 rounded-full px-3 py-1 shadow-sm">
//           <Ionicons name="search-outline" size={18} color="#6B7280" />
//           <TextInput
//             placeholder={`Search ${role?.toString().toLowerCase()}s...`}
//             placeholderTextColor="#9CA3AF"
//             value={searchQuery}
//             onChangeText={setSearchQuery}
//             className="ml-2 flex-1 text-gray-800 text-sm"
//           />
//           {searchQuery.length > 0 && (
//             <TouchableOpacity onPress={() => setSearchQuery("")}>
//               <Ionicons name="close-circle" size={18} color="#9CA3AF" />
//             </TouchableOpacity>
//           )}
//         </View>
//       </View>

//       {loading ? (
//         <ActivityIndicator size="large" color="#4F46E5" className="mt-10" />
//       ) : users.length === 0 ? (
//         <Text className="text-center text-gray-400 mt-10">No {role} found</Text>
//       ) : (
//         <FlatList
//           data={filteredUsers}
//           keyExtractor={(item) => item._id}
//           renderItem={renderUser}
//           showsVerticalScrollIndicator={false}
//           contentContainerStyle={{ paddingBottom: 80 }}
//         />
//       )}
//     </View>
//   );
// }

export default function CentralUserSpecificDirectory() {
  return null;
}
