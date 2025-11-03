import React, { useState, useEffect, useContext } from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Dropdown } from "react-native-element-dropdown";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import api from "../lib/api";
import { AuthContext } from "../context/AuthContext"; // adjust path
import Toast from "react-native-toast-message";

type DynamicInputFieldProps = {
  label: string;
  list: string[];
  setter: React.Dispatch<React.SetStateAction<string[]>>;
  updateField: (
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    list: string[],
    index: number,
    value: string
  ) => void;
  addField: (
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    list: string[]
  ) => void;
};

const DynamicInputField: React.FC<DynamicInputFieldProps> = ({
  label,
  list,
  setter,
  updateField,
  addField,
}) => (
  <View className="mb-4">
    <Text className="text-gray-700 font-semibold mb-1">{label}</Text>
    {list.map((item, index) => (
      <View key={index} className="mb-2 relative">
        <TextInput
          placeholder={`Enter ${label.toLowerCase()}`}
          placeholderTextColor="#888"
          value={item}
          onChangeText={(text) => updateField(setter, list, index, text)}
          className="bg-white px-4 py-3 rounded-xl shadow-sm border border-gray-200 pr-10"
          // autoCapitalize="none"
          keyboardType={
            label.toLowerCase().includes("email")
              ? "email-address"
              : label.toLowerCase().includes("number")
              ? "phone-pad"
              : "default"
          }
          returnKeyType="next"
        />
        {list.length > 1 && (
          <TouchableOpacity
            onPress={() => {
              const newList = [...list];
              newList.splice(index, 1);
              setter(newList);
            }}
            className="absolute right-3 top-3"
          >
            <Ionicons name="close-circle-outline" size={22} color="#EF4444" />
          </TouchableOpacity>
        )}
      </View>
    ))}
    <TouchableOpacity
      onPress={() => addField(setter, list)}
      className="flex-row items-center space-x-2 mt-1"
    >
      <Ionicons name="add-circle-outline" size={22} color="#4F46E5" />
      <Text className="text-indigo-600 font-semibold">Add {label}</Text>
    </TouchableOpacity>
  </View>
);

type RoleItem = {
  label: string;
  value: string;
};

const AddUserForm: React.FC = () => {
  const router = useRouter();
  const auth = useContext(AuthContext); // ✅ get JWT from context
  const token = auth?.token;

  const { userData } = useLocalSearchParams();
  const parsedUser = userData
    ? JSON.parse(Array.isArray(userData) ? userData[0] : userData)
    : null;

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        if (userData) {
          const parsedUser = JSON.parse(userData);

          // Fetch full details from backend (in case not all fields came)
          const response = await api.get(`/user-directory/${parsedUser._id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          const user = response.data;

          // 🧩 Auto-fill all fields
          setRoleValue(user.role || null);
          setFirmName(user.firmName || "");
          setIndividualName(user.individualName || "");
          setExpertiseList(
            user.expertiseList?.length ? user.expertiseList : [""]
          );
          setDesignationList(
            user.designationList?.length ? user.designationList : [""]
          );
          setEmailList(user.emailList?.length ? user.emailList : [""]);
          setAddressList(user.addressList?.length ? user.addressList : [""]);
          setOfficialNumberList(
            user.officialNumberList?.length ? user.officialNumberList : [""]
          );
          setMobileNumberList(
            user.mobileNumberList?.length ? user.mobileNumberList : [""]
          );
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    };

    fetchUserDetails();
  }, [userData]);

  const isEditMode = !!userData;

  // Role dropdown
  const [roleValue, setRoleValue] = useState<string | null>(null);
  const [roleItems] = useState<RoleItem[]>([
    { label: "Vendor", value: "Vendor" },
    { label: "Client", value: "Client" },
    { label: "Consultant", value: "Consultant" },
  ]);

  // User fields
  const [firmName, setFirmName] = useState("");
  const [individualName, setIndividualName] = useState("");

  const [expertiseList, setExpertiseList] = useState<string[]>([""]);
  const [designationList, setDesignationList] = useState<string[]>([""]);
  const [emailList, setEmailList] = useState<string[]>([""]);
  const [addressList, setAddressList] = useState<string[]>([""]);
  const [officialNumberList, setOfficialNumberList] = useState<string[]>([""]);
  const [mobileNumberList, setMobileNumberList] = useState<string[]>([""]);

  // Helpers
  const addField = (
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    list: string[]
  ) => setter([...list, ""]);
  const updateField = (
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    list: string[],
    index: number,
    value: string
  ) => {
    const newList = [...list];
    newList[index] = value;
    setter(newList);
  };

  // Submit handler
  const handleSubmit = async () => {
    if (!roleValue) {
      return Toast.show({
        type: "error",
        text1: "Validation",
        text2: "Please select a role.",
        position: "bottom",
      });
    }

    if (individualName.trim() === "") {
      return Toast.show({
        type: "error",
        text1: "Validation",
        text2: "Name cannot be empty.",
        position: "bottom",
      });
    }
    try {
      const payload = {
        role: roleValue,
        firmName,
        individualName,
        expertiseList: expertiseList.filter((e) => e.trim() !== ""),
        designationList: designationList.filter((d) => d.trim() !== ""),
        emailList: emailList.filter((e) => e.trim() !== ""),
        addressList: addressList.filter((a) => a.trim() !== ""),
        officialNumberList: officialNumberList.filter((n) => n.trim() !== ""),
        mobileNumberList: mobileNumberList.filter((n) => n.trim() !== ""),
      };

      if (isEditMode && parsedUser?._id) {
        // 🟢 Update user if editing
        await api.put(`/user-directory/${parsedUser._id}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });

        Toast.show({
          type: "success",
          text1: "User updated successfully!",
          position: "bottom",
        });
      } else {
        // 🟣 Create new user
        await api.post(`/user-directory/add`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });

        Toast.show({
          type: "success",
          text1: "User created successfully!",
          position: "bottom",
        });
      }

      // Navigate to central user directory
      router.push("/(drawer)/centralUserDirectory");
    } catch (error: any) {
      console.log(error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error.response?.data?.message || "Something went wrong.",
        position: "bottom",
      });
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <LinearGradient colors={["#6366F1", "#8B5CF6"]}>
        <View
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
          <TouchableOpacity
            onPress={() => router.push("/(drawer)/centralUserDirectory")}
            className="flex-row items-center"
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
            <Text className="text-xl font-bold text-white ml-4">
              {isEditMode ? "Edit User" : "Create User"}
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Keyboard-aware scrollable form */}
      <KeyboardAwareScrollView
        className="px-4 py-6"
        extraScrollHeight={100}
        enableOnAndroid={true}
        keyboardShouldPersistTaps="handled"
      >
        {/* Role Dropdown */}
        <View className="mb-4 z-10">
          <Text className="text-gray-700 font-semibold mb-1">
            Role <Text className="text-red-500">*</Text>
          </Text>
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
          <Text className="text-gray-700 font-semibold mb-1">
            Individual Name <Text className="text-red-500">*</Text>
          </Text>
          <TextInput
            placeholder="Enter individual’s full name"
            placeholderTextColor="#888"
            value={individualName}
            onChangeText={setIndividualName}
            className="bg-white px-4 py-3 rounded-xl shadow-sm border border-gray-200"
            returnKeyType="next"
          />
        </View>
        {/* Firm / Company Name */}
        <View className="mb-4">
          <Text className="text-gray-700 font-semibold mb-1">
            Firm / Company Name <Text className="text-red-500">*</Text>
          </Text>
          <TextInput
            placeholder="Enter firm or company name"
            placeholderTextColor="#888"
            value={firmName}
            onChangeText={setFirmName}
            className="bg-white px-4 py-3 rounded-xl shadow-sm border border-gray-200"
            returnKeyType="next"
          />
        </View>

        {/* Dynamic Fields */}
        {[
          { label: "Expertise", list: expertiseList, setter: setExpertiseList },
          {
            label: "Designation",
            list: designationList,
            setter: setDesignationList,
          },
          { label: "Email", list: emailList, setter: setEmailList },
          {
            label: "Office Address",
            list: addressList,
            setter: setAddressList,
          },
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
          <DynamicInputField
            key={idx}
            {...field}
            updateField={updateField}
            addField={addField}
          />
        ))}

        {/* Submit Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleSubmit}
          className="bg-indigo-600 py-4 rounded-2xl mt-2 shadow-lg items-center flex-row justify-center space-x-2 mb-20"
        >
          <Ionicons name="checkmark-done-outline" size={24} color="white" />
          <Text className="text-white text-lg font-semibold">
            {" "}
            {isEditMode ? "Update User" : "Create User"}
          </Text>
        </TouchableOpacity>
      </KeyboardAwareScrollView>
    </View>
  );
};

export default AddUserForm;
