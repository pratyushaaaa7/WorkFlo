import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { MaterialCommunityIcons, Entypo, Ionicons } from "@expo/vector-icons";
import DropDownPicker from "react-native-dropdown-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Dropdown } from "react-native-element-dropdown";

const AddUserForm = () => {
  const router = useRouter();
  const [roleOpen, setRoleOpen] = useState(false);
  const [roleValue, setRoleValue] = useState(null);
  const [roleItems, setRoleItems] = useState([
    { label: "Vendor", value: "vendor" },
    { label: "Client", value: "client" },
    { label: "Contractor", value: "contractor" },
  ]);

  const [expertiseList, setExpertiseList] = useState([""]);
  const [designationList, setDesignationList] = useState([""]);
  const [emailList, setEmailList] = useState([""]);
  const [addressList, setAddressList] = useState([""]);
  const [officialNumberList, setOfficialNumberList] = useState([""]);
  const [mobileNumberList, setMobileNumberList] = useState([""]);

  const addField = (setter: any, list: any) => setter([...list, ""]);
  const updateField = (setter, list, index, value) => {
    const newList = [...list];
    newList[index] = value;
    setter(newList);
  };

  return (
    <View className="flex-1">
      <LinearGradient
        colors={["#6366F1", "#8B5CF6"]}
        className="pt-16 pb-6 px-4 flex-row items-center justify-between"
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.25,
          shadowRadius: 4,
          elevation: 6,
          zIndex: 10,
        }}
      >
        {/* Back Button */}
        <TouchableOpacity
          onPress={() => router.back()}
          className="flex-row items-center"
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
          <Text className="text-xl font-bold text-white ml-4">
            User Details
          </Text>
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView className=" bg-gray-50 px-4 py-6">
        
        <Text className="text-2xl font-bold text-gray-800 mb-6">
          Create New User
        </Text>
 {/* Role Dropdown */}
        <View className="mb-4 z-10">
          <Text className="text-gray-700 font-semibold mb-1">Role</Text>
          <Dropdown
            style={{
              backgroundColor: "white",
              borderRadius: 10,
              borderWidth: 1,
              borderColor: "#ddd",
              paddingHorizontal: 12,
              height: 40,
            }}
            placeholderStyle={{ color: "#888", fontSize: 14 }}
            selectedTextStyle={{ color: "#000", fontSize: 16 }}
            data={roleItems}
            labelField="label"
            valueField="value"
            placeholder="Select role"
            value={roleValue}
            onChange={(item) => setRoleValue(item.value)}
            showsVerticalScrollIndicator={false}
            containerStyle={{
              borderRadius: 12,
              backgroundColor: "#fff",
              elevation: 4,
            }}
            activeColor="#E0E7FF"
          />
        </View>

        {/* Individual Name */}
        <View className="mb-4">
          <Text className="text-gray-700 font-semibold mb-1">Name</Text>
          <TextInput
            placeholder="Enter full name"
            placeholderTextColor="#888"
            className="bg-white px-4 py-3 rounded-xl shadow-sm border border-gray-200"
          />
        </View>

       
        {/* Dynamic Fields Function */}
        {[
          { label: "Expertise", list: expertiseList, setter: setExpertiseList },
          {
            label: "Designation",
            list: designationList,
            setter: setDesignationList,
          },
          { label: "Email", list: emailList, setter: setEmailList },
          { label: "Address", list: addressList, setter: setAddressList },
          {
            label: "Official Number",
            list: officialNumberList,
            setter: setOfficialNumberList,
          },
          {
            label: "Mobile Number",
            list: mobileNumberList,
            setter: setMobileNumberList,
          },
        ].map((field, idx) => (
          <View className="mb-4" key={idx}>
            <Text className="text-gray-700 font-semibold mb-1">
              {field.label}
            </Text>
            {field.list.map((item, index) => (
              <View key={index} className="mb-2 relative">
                <TextInput
                  placeholder={`Enter ${field.label.toLowerCase()}`}
                  placeholderTextColor="#888"
                  value={item}
                  onChangeText={(text) =>
                    updateField(field.setter, field.list, index, text)
                  }
                  className="bg-white px-4 py-3 rounded-xl shadow-sm border border-gray-200 pr-10"
                />
                {field.list.length > 1 && (
                  <TouchableOpacity
                    onPress={() => {
                      const newList = [...field.list];
                      newList.splice(index, 1);
                      field.setter(newList);
                    }}
                    className="absolute right-3 top-3"
                  >
                    <Ionicons
                      name="remove-circle-outline"
                      size={24}
                      color="#EF4444"
                    />
                  </TouchableOpacity>
                )}
              </View>
            ))}

            <TouchableOpacity
              onPress={() => addField(field.setter, field.list)}
              className="flex-row items-center space-x-2 mt-1"
            >
              <Ionicons name="add-circle-outline" size={24} color="#4F46E5" />
              <Text className="text-indigo-600 font-semibold">
                Add {field.label}
              </Text>
            </TouchableOpacity>
          </View>
        ))}

        {/* Submit Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          className="bg-indigo-600 py-4 rounded-2xl mt-2 shadow-lg items-center flex-row justify-center space-x-2 mb-10"
        >
          <Ionicons name="checkmark-done-outline" size={24} color="white" />
          <Text className="text-white text-lg font-semibold">Create User</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};
export default AddUserForm;
