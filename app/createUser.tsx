import {
  Add01Icon,
  ArrowDown01Icon,
  PlusSignCircleIcon,
  ArrowLeft01Icon,
  MinusSignCircleIcon,
  Cancel01Icon,
  CheckmarkCircle02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useContext, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import { Dropdown } from "react-native-element-dropdown";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import PhoneInput from "react-native-phone-number-input";
import Toast from "react-native-toast-message";
import { AuthContext } from "../context/AuthContext"; // adjust path
import api from "../lib/api";

type DynamicInputFieldProps = {
  label: string;
  list: string[];
  setter: React.Dispatch<React.SetStateAction<string[]>>;
  updateField: (
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    list: string[],
    index: number,
    value: string,
  ) => void;
  addField: (
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    list: string[],
  ) => void;
};

const DynamicInputField: React.FC<DynamicInputFieldProps> = ({
  label,
  list,
  setter,
  updateField,
  addField,
}) => {
  const isDarkMode = useColorScheme() === "dark";

  return (
    <View className="mb-6">
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-gray-500 dark:text-gray-400 font-dmSemiBold text-sm">
          {label}{" "}
          {label.toLowerCase().includes("role") ||
          label.toLowerCase().includes("name") ||
          label.toLowerCase().includes("firm") ? (
            <Text className="text-red-500">*</Text>
          ) : (
            ""
          )}
        </Text>
        <TouchableOpacity
          onPress={() => addField(setter, list)}
          className="flex-row items-center"
        >
          <HugeiconsIcon
            icon={PlusSignCircleIcon}
            strokeWidth={2}
            size={14}
            color="#0073CB"
          />
          <Text className="text-[#0073CB] font-dmBold text-sm ml-1">Add</Text>
        </TouchableOpacity>
      </View>
      {list.map((item, index) => (
        <View key={index} className="mb-3 relative">
          {label.toLowerCase().includes("number") ? (
            <View style={{ width: "100%" }}>
              {/* @ts-ignore: PhoneInput type mismatch in current environment */}
              <PhoneInput
                defaultValue={item}
                defaultCode="IN"
                layout="second"
                onChangeFormattedText={(text) =>
                  updateField(setter, list, index, text)
                }
                renderDropdownImage={
                  <HugeiconsIcon
                    icon={ArrowDown01Icon}
                    size={14}
                    color={isDarkMode ? "#FFF" : "#000"}
                  />
                }
                containerStyle={{
                  width: "100%",
                  backgroundColor: isDarkMode ? "#262626" : "#F0F3F7",
                  borderRadius: 16,
                  height: 56,
                  elevation: 0,
                }}
                flagButtonStyle={{
                  backgroundColor: isDarkMode ? "#333" : "#FFF",
                  borderRadius: 12,
                  marginVertical: 6,
                  marginLeft: 6,
                  // width: 65,
                  height: 44,
                }}
                textContainerStyle={{
                  backgroundColor: "transparent",
                  borderRadius: 16,
                  paddingVertical: 0,
                  paddingHorizontal: 0,
                  paddingLeft: 10,
                }}
                textInputStyle={{
                  height: 56,
                  fontSize: 16,
                  color: isDarkMode ? "#FFF" : "#000",
                  fontFamily: "Poppins",
                }}
                codeTextStyle={{
                  fontSize: 16,
                  color: isDarkMode ? "#FFF" : "#000",
                  fontFamily: "Poppins",
                  // marginLeft: -15, // Adjusted for chevron presence
                }}
                placeholder={`e.g. 12345789654`}
              />
            </View>
          ) : (
            <TextInput
              placeholder={`Enter ${label.toLowerCase()}`}
              placeholderTextColor="#9CA3AF"
              value={item}
              onChangeText={(text) => updateField(setter, list, index, text)}
              className="bg-[#F0F3F7] dark:bg-[#262626] px-4 h-14 rounded-2xl shadow-none text-black dark:text-white font-poppins text-sm pr-12"
              keyboardType={
                label.toLowerCase().includes("email")
                  ? "email-address"
                  : "default"
              }
              returnKeyType="next"
            />
          )}
          {list.length > 1 && (
            <TouchableOpacity
              onPress={() => {
                const newList = [...list];
                newList.splice(index, 1);
                setter(newList);
              }}
              className="absolute right-4 top-4"
            >
              <HugeiconsIcon
                icon={MinusSignCircleIcon}
                size={16}
                color="#DF5B5B"
              />
            </TouchableOpacity>
          )}
        </View>
      ))}
    </View>
  );
};

type RoleItem = {
  label: string;
  value: string;
};

const AddUserForm: React.FC = () => {
  const router = useRouter();
  const auth = useContext(AuthContext); // ✅ get JWT from context
  const token = auth?.token;
  const isDarkMode = useColorScheme() === "dark";

  const { userData } = useLocalSearchParams();
  const parsedUser = userData
    ? JSON.parse(Array.isArray(userData) ? userData[0] : (userData as string))
    : null;

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        if (userData) {
          const parsedUser = JSON.parse(userData as string);

          // Fetch full details from backend (in case not all fields came)
          const response = await api.get(`/user-directory/${parsedUser._id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          const user = response.data;

          // 🧩 Auto-fill all fields
          setRoleValue(user.role || null);
          setFirmName(user.firmName || "");
          setIndividualName(user.individualName || "");
          setGender(user.gender || "");
          setExpertiseList(
            user.expertiseList?.length ? user.expertiseList : [""],
          );
          setDesignationList(
            user.designationList?.length ? user.designationList : [""],
          );
          setEmailList(user.emailList?.length ? user.emailList : [""]);
          setAddressList(user.addressList?.length ? user.addressList : [""]);
          setOfficialNumberList(
            user.officialNumberList?.length ? user.officialNumberList : [""],
          );
          setMobileNumberList(
            user.mobileNumberList?.length ? user.mobileNumberList : [""],
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
  const [prefix, setPrefix] = useState("Mr");
  const [honorifics] = useState([
    { label: "Mr", value: "Mr" },
    { label: "Mrs", value: "Mrs" },
    { label: "Ms", value: "Ms" },
    { label: "Dr", value: "Dr" },
    { label: "-", value: "" },
  ]);
  const [gender, setGender] = useState<"Male" | "Female" | null>(null);

  const [expertiseList, setExpertiseList] = useState<string[]>([""]);
  const [designationList, setDesignationList] = useState<string[]>([""]);
  const [emailList, setEmailList] = useState<string[]>([""]);
  const [addressList, setAddressList] = useState<string[]>([""]);
  const [officialNumberList, setOfficialNumberList] = useState<string[]>([""]);
  const [mobileNumberList, setMobileNumberList] = useState<string[]>([""]);

  const [saving, setSaving] = useState(false);

  // Helpers
  const addField = (
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    list: string[],
  ) => setter([...list, ""]);
  const updateField = (
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    list: string[],
    index: number,
    value: string,
  ) => {
    const newList = [...list];
    newList[index] = value;
    setter(newList);
  };

  // Submit handler
  const handleSubmit = async () => {
    if (saving) return; // prevent double tap
    setSaving(true);

    // 🧩 Validation checks
    if (!roleValue) {
      Toast.show({
        type: "error",
        text1: "Validation",
        text2: "Please select a role.",
        position: "bottom",
      });
      setSaving(false);
      return;
    }

    if (individualName.trim() === "") {
      Toast.show({
        type: "error",
        text1: "Validation",
        text2: "Name cannot be empty.",
        position: "bottom",
      });
      setSaving(false);
      return;
    }

    if (!gender) {
      Toast.show({
        type: "error",
        text1: "Validation",
        text2: "Please select gender.",
        position: "bottom",
      });
      setSaving(false);
      return;
    }

    try {
      // 🧱 Prepare request payload
      const payload = {
        role: roleValue,
        firmName,
        individualName,
        gender,
        expertiseList: expertiseList.filter((e) => e.trim() !== ""),
        designationList: designationList.filter((d) => d.trim() !== ""),
        emailList: emailList.filter((e) => e.trim() !== ""),
        addressList: addressList.filter((a) => a.trim() !== ""),
        officialNumberList: officialNumberList.filter((n) => n.trim() !== ""),
        mobileNumberList: mobileNumberList.filter((n) => n.trim() !== ""),
      };

      // 🟢 Update mode
      if (isEditMode && parsedUser?._id) {
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

      // ✅ Redirect to directory
      router.push("/(drawer)/centralUserDirectory" as any);
    } catch (error: any) {
      console.log("Error creating/updating user:", error.response?.data);

      const message =
        error.response?.data?.message ||
        "Something went wrong. Please try again.";

      // 🧠 Custom handling for duplicate number check
      if (
        message.includes("same mobile number") ||
        message.includes("official number")
      ) {
        const existing = error.response?.data?.existingUser;
        const details = existing
          ? `(${existing.individualName || "N/A"} - ${
              existing.firmName || "N/A"
            } | ${existing.userCode || ""})`
          : "";

        Toast.show({
          type: "error",
          text1: "Duplicate Entry Detected",
          text2: `${message} ${details}`,
          position: "bottom",
          visibilityTime: 4000,
        });
      } else {
        // 🧩 Generic error handling
        Toast.show({
          type: "error",
          text1: "Error",
          text2: message,
          position: "bottom",
        });
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <View className="flex-1 bg-[#FBFCFD] dark:bg-[#0A0A0A]">
      {/* Header */}
      <View className="pt-14 pb-4 px-4 flex-row items-center  bg-[#FBFCFD] dark:bg-[#1A1A1A]">
        <TouchableOpacity
          onPress={() => router.back()}
          className="p-2"
          activeOpacity={0.7}
        >
          <HugeiconsIcon
            icon={ArrowLeft01Icon}
            size={24}
            color={isDarkMode ? "#FFF" : "#000"}
          />
        </TouchableOpacity>
        <Text className="text-xl font-dmBold text-black dark:text-white ml-2">
          {isEditMode ? "Edit Contact" : "Create Contact"}
        </Text>
      </View>

      {/* Keyboard-aware scrollable form */}
      <KeyboardAwareScrollView
        className="px-4 py-6"
        extraScrollHeight={100}
        enableOnAndroid={true}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Role Dropdown */}
        <View className="mb-6">
          <Text className="text-gray-500 dark:text-gray-400 font-dmSemiBold text-sm mb-2">
            Role <Text className="text-red-500">*</Text>
          </Text>
          {isEditMode ? (
            <View className="bg-[#F0F3F7] dark:bg-[#262626] px-4 py-3 rounded-2xl">
              <Text className="text-black dark:text-white font-poppins">
                {roleValue}
              </Text>
            </View>
          ) : (
            <Dropdown
              style={{
                backgroundColor: isDarkMode ? "#262626" : "#F0F3F7",
                borderRadius: 16,
                paddingHorizontal: 16,
                height: 56,
              }}
              placeholderStyle={{
                color: isDarkMode ? "#454545" : "#919191",
                fontSize: 14,
                fontFamily: "Poppins",
              }}
              selectedTextStyle={{
                color: isDarkMode ? "#454545" : "#919191",
                fontSize: 14,
                fontFamily: "Poppins",
              }}
              data={roleItems}
              labelField="label"
              valueField="value"
              placeholder="Select role"
              value={roleValue}
              onChange={(item) => setRoleValue(item.value)}
              containerStyle={{
                borderRadius: 16,
                backgroundColor: isDarkMode ? "#1E1E1E" : "#FFF",
                borderWidth: 0,
                marginTop: 4,
              }}
              activeColor={isDarkMode ? "#333" : "#F3F4F6"}
            />
          )}
        </View>

        {/* Individual Name */}
        <View className="mb-6">
          <Text className="text-[black] dark:text-[#F5F5F5] font-dmSemiBold text-sm mb-2">
            Individual Name <Text className="text-red-500">*</Text>
          </Text>

          <View className="flex-row items-center bg-[#F0F3F7] dark:bg-[#1A1A1A] rounded-lg h-14 px-1">
            {/* Prefix Dropdown */}
            <Dropdown
              style={{
                width: 68,
                height: 40,
                backgroundColor: isDarkMode ? "#000" : "#111827",
                borderRadius: 8,
                paddingHorizontal: 10,
              }}
              selectedTextStyle={{
                color: isDarkMode ? "#FFF" : "#111827",
                fontSize: 14,
                fontFamily: "Poppins",
              }}
              itemTextStyle={{
                fontSize: 14,
                fontFamily: "Poppins",
              }}
              data={honorifics}
              labelField="label"
              valueField="value"
              value={prefix}
              onChange={(item) => setPrefix(item.value)}
              containerStyle={{
                borderRadius: 16,
                backgroundColor: isDarkMode ? "#1E1E1E" : "#FFFFFF",
                borderWidth: 0,
              }}
            />

            {/* Name Input */}
            <TextInput
              placeholder="e.g. John Smith"
              placeholderTextColor="#9CA3AF"
              value={individualName}
              onChangeText={setIndividualName}
              className="flex-1 h-14 text-black dark:text-white font-poppins text-sm px-2"
              returnKeyType="next"
            />
          </View>
        </View>

        {/* Gender Selection */}
        <View className="mb-6">
          <Text className="text-gray-500 dark:text-gray-400 font-dmSemiBold text-sm mb-3">
            Gender <Text className="text-red-500">*</Text>
          </Text>

          <View className="flex-row space-x-3">
            {["Male", "Female"].map((option) => (
              <TouchableOpacity
                key={option}
                activeOpacity={0.8}
                onPress={() => setGender(option as "Male" | "Female")}
                className={`flex-1 flex-row items-center justify-center h-14 rounded-2xl border-2 ${
                  gender === option
                    ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20"
                    : "border-transparent bg-[#F0F3F7] dark:bg-[#262626]"
                }`}
              >
                <View
                  className={`w-5 h-5 rounded-full border-2 mr-2 items-center justify-center ${
                    gender === option ? "border-indigo-600" : "border-gray-400"
                  }`}
                >
                  {gender === option && (
                    <View className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                  )}
                </View>
                <Text
                  className={`font-dmSemiBold ${
                    gender === option
                      ? "text-indigo-700 dark:text-indigo-400"
                      : "text-gray-700 dark:text-gray-300"
                  }`}
                >
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Firm / Company Name */}
        <View className="mb-6">
          <Text className="text-gray-500 dark:text-gray-400 font-dmSemiBold text-sm mb-2">
            Firm / Company Name <Text className="text-red-500">*</Text>
          </Text>
          <TextInput
            placeholder="e.g. Dena Consulting"
            placeholderTextColor="#9CA3AF"
            value={firmName}
            onChangeText={setFirmName}
            className="bg-[#F0F3F7] dark:bg-[#262626] px-4 h-14 rounded-2xl text-black dark:text-white font-poppins text-sm"
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
      </KeyboardAwareScrollView>

      {/* Sticky Bottom Buttons */}
      <View className="absolute bottom-0 left-0 right-0 bg-white dark:bg-[#1A1A1A] px-4 pt-4 pb-12">
        <View className="flex-row items-center gap-3">
          <TouchableOpacity
            onPress={() => router.back()}
            className="flex-1 h-14 rounded-2xl border dark:border-[#F5F5F5] border-black items-center justify-center"
            activeOpacity={0.7}
          >
            <Text className="dark:text-[#F5F5F5] text-black font-dmMedium text-lg">
              Cancel
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={saving}
            activeOpacity={0.8}
            className="flex-1 h-14 rounded-2xl overflow-hidden"
          >
            <LinearGradient
              colors={["#5B4CCC", "#6347C2", "#8056D1"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ borderRadius: 16 }}
              className="w-full h-full items-center justify-center flex-row"
            >
              {saving ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <>
                  <Text className="text-white font-dmMedium text-lg ml-2">
                    {isEditMode ? "Update" : "Save"}
                  </Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default AddUserForm;
