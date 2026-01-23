import {
  ArrowDown01Icon,
  ArrowLeft01Icon,
  MinusSignCircleIcon,
  PlusSignCircleIcon,
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
  rawPhoneValues?: React.MutableRefObject<string[]>;
};

const DynamicInputField: React.FC<DynamicInputFieldProps> = ({
  label,
  list,
  setter,
  updateField,
  addField,
  rawPhoneValues,
}) => {
  const isDarkMode = useColorScheme() === "dark";

  return (
    <View className="mb-6">
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-black dark:text-[#F5F5F5] font-dmSemiBold text-sm">
          {label}{" "}
          {label.toLowerCase().includes("role") ||
          label.toLowerCase().includes("name") ||
          label.toLowerCase().includes("firm") ? (
            <Text className="text-red-500">*</Text>
          ) : (
            ""
          )}
        </Text>
        {(label.toLowerCase().includes("mobile number") ||
          label.toLowerCase().includes("email") ||
          label.toLowerCase().includes("expertise")) && (
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
        )}
      </View>
      {list.map((item, index) => (
        <View key={index} className="mb-3 relative">
          {label.toLowerCase().includes("number") ? (
            <View style={{ width: "100%" }}>
              {/* @ts-ignore: PhoneInput type mismatch in current environment */}
              <PhoneInput
                key={`${index}-${item}`}
                defaultValue={
                  item.startsWith("+91") ? item.replace("+91", "") : item
                }
                defaultCode="IN"
                layout="second"
                onChangeText={(text) => {
                  if (rawPhoneValues) {
                    rawPhoneValues.current[index] = text;
                  }
                  if (text.trim() === "") {
                    updateField(setter, list, index, "");
                  }
                }}
                onChangeFormattedText={(text) => {
                  updateField(setter, list, index, text);
                }}
                renderDropdownImage={
                  <HugeiconsIcon
                    icon={ArrowDown01Icon}
                    size={14}
                    color={isDarkMode ? "#FFF" : "#000"}
                  />
                }
                containerStyle={{
                  width: "100%",
                  backgroundColor: isDarkMode ? "#1A1A1A" : "#F0F3F7",
                  borderRadius: 8,
                  height: 56,
                  elevation: 0,
                }}
                textInputProps={{
                  placeholderTextColor: isDarkMode ? "#919191" : "#454545",
                }}
                flagButtonStyle={{
                  backgroundColor: isDarkMode ? "#000" : "#FFF",
                  borderRadius: 6,
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
                  fontSize: label.toLowerCase().includes("number") ? 14 : 16,
                  color: isDarkMode ? "#FFF" : "#000",
                  fontFamily: "Poppins",
                }}
                codeTextStyle={{
                  fontSize: label.toLowerCase().includes("number") ? 14 : 16,
                  color: isDarkMode ? "#FFF" : "#000",
                  fontFamily: "Poppins",
                  // marginLeft: -15, // Adjusted for chevron presence
                }}
                placeholder={`e.g. 1234578965`}
              />
            </View>
          ) : (
            <TextInput
              placeholder={`Enter ${label.toLowerCase()}`}
              placeholderTextColor={isDarkMode ? "#919191" : "#454545"}
              value={item}
              onChangeText={(text) => updateField(setter, list, index, text)}
              className="bg-[#F0F3F7] dark:bg-[#1A1A1A] px-4 h-14 rounded-lg shadow-none text-black dark:text-white font-poppins text-sm pr-12"
              keyboardType={
                label.toLowerCase().includes("email")
                  ? "email-address"
                  : "default"
              }
              returnKeyType="next"
            />
          )}
          {index > 0 &&
            (label.toLowerCase().includes("mobile number") ||
              label.toLowerCase().includes("email") ||
              label.toLowerCase().includes("expertise")) && (
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
          setPrefix(user.salutation || "Mr");
          setGender(user.gender || null);
          setExpertiseList(
            user.expertiseList?.length ? user.expertiseList : [""],
          );
          setDesignationList(
            user.designationList?.length ? user.designationList : [""],
          );
          setEmailList(user.emailList?.length ? user.emailList : [""]);
          setAddressList(user.addressList?.length ? user.addressList : [""]);
          const officialNumbers = user.officialNumberList || [];
          const mobileNumbers = user.mobileNumberList || [];
          // Handle legacy single mobileNumber field
          if (
            user.mobileNumber &&
            !mobileNumbers.includes(user.mobileNumber) &&
            !officialNumbers.includes(user.mobileNumber)
          ) {
            mobileNumbers.push(user.mobileNumber);
          }

          // Merge and deduplicate
          const combinedNumbers = [...officialNumbers, ...mobileNumbers].filter(
            (n: string) => n && n.trim() !== "",
          );
          // Remove duplicates
          const uniqueNumbers = [...new Set(combinedNumbers)];

          setOfficialNumberList(uniqueNumbers.length ? uniqueNumbers : [""]);
          // 🧩 Initialize rawPhoneValues with national numbers for PhoneInput
          rawPhoneValues.current = uniqueNumbers.map((n) =>
            n.startsWith("+91") ? n.replace("+91", "") : n,
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

  const rawPhoneValues = React.useRef<string[]>([]);

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{
    role?: boolean;
    individualName?: boolean;
    firmName?: boolean;
  }>({});

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

  const resetForm = () => {
    setRoleValue(null);
    setFirmName("");
    setIndividualName("");
    setPrefix("Mr");
    setGender(null);
    setExpertiseList([""]);
    setDesignationList([""]);
    setEmailList([""]);
    setAddressList([""]);
    setOfficialNumberList([""]);
    rawPhoneValues.current = [];
  };

  // ✅ Reset form if we leave edit mode (no userData in params)
  useEffect(() => {
    if (!userData) {
      resetForm();
    }
  }, [userData]);

  // Submit handler
  const handleSubmit = async () => {
    if (saving) return; // prevent double tap

    const newErrors: any = {};
    if (!roleValue) newErrors.role = true;
    if (individualName.trim() === "") newErrors.individualName = true;
    if (firmName.trim() === "") newErrors.firmName = true;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      Toast.show({
        type: "error",
        text1: "Validation",
        text2: "Please fill all mandatory fields.",
        position: "bottom",
      });
      return;
    }

    setSaving(true);
    setErrors({});

    try {
      // 🧱 Prepare request payload
      const payload: any = {
        role: roleValue,
        firmName,
        individualName,
        salutation: prefix,
        expertiseList: expertiseList.filter((e) => e.trim() !== ""),
        designationList: designationList.filter((d) => d.trim() !== ""),
        emailList: emailList.filter((e) => e.trim() !== ""),
        addressList: addressList.filter((a) => a.trim() !== ""),
        officialNumberList: officialNumberList.filter((n) => n.trim() !== ""),
      };

      if (gender) {
        payload.gender = gender;
      }

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

      // 🟣 Redirect
      if (isEditMode) {
        router.back();
      } else {
        resetForm();
        router.replace("/centralUserDirectory" as any);
      }
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
      <View className="pt-14 pb-4 px-4 flex-row items-center  bg-[#FBFCFD] dark:bg-[#0A0A0A]">
        <TouchableOpacity
          onPress={() => {
            resetForm();
            router.back();
          }}
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
          <Text className="text-black dark:text-[#F5F5F5] font-dmSemiBold text-sm mb-2">
            Role <Text className="text-red-500">*</Text>
          </Text>
          {isEditMode ? (
            <View className="bg-[#F0F3F7] dark:bg-[#1A1A1A] px-4 py-3 rounded-lg">
              <Text className="text-black dark:text-white font-poppins">
                {roleValue}
              </Text>
            </View>
          ) : (
            <Dropdown
              placeholderStyle={{
                color: isDarkMode ? "#919191" : "#454545",
                fontSize: 14,
                fontFamily: "Poppins",
              }}
              selectedTextStyle={{
                color: isDarkMode ? "#919191" : "#454545",
                fontSize: 14,
                fontFamily: "Poppins",
              }}
              data={roleItems}
              labelField="label"
              valueField="value"
              placeholder="Select role"
              value={roleValue}
              onChange={(item) => {
                setRoleValue(item.value);
                if (errors.role)
                  setErrors((prev) => ({ ...prev, role: false }));
              }}
              containerStyle={{
                borderRadius: 16,
                backgroundColor: isDarkMode ? "#1A1A1A" : "#FFF",
                borderWidth: 0,
                marginTop: 4,
              }}
              activeColor={isDarkMode ? "#333" : "#F3F4F6"}
              itemTextStyle={{
                fontSize: 14,
                fontFamily: "Poppins",
                color: isDarkMode ? "#F5F5F5" : "#000",
              }}
              iconColor={isDarkMode ? "#F5F5F5" : "#000"}
              style={{
                backgroundColor: isDarkMode ? "#1A1A1A" : "#F0F3F7",
                borderRadius: 6,
                paddingHorizontal: 16,
                height: 56,
                borderWidth: errors.role ? 1 : 0,
                borderColor: errors.role ? "#DF5B5B" : "transparent",
              }}
            />
          )}
          {errors.role && (
            <Text className="text-[#DF5B5B] text-xs font-poppins mt-1 ml-1">
              Please select a role
            </Text>
          )}
        </View>

        {/* Individual Name */}
        <View className="mb-6">
          <Text className="text-black dark:text-[#F5F5F5] font-dmSemiBold text-sm mb-2">
            Individual Name <Text className="text-red-500">*</Text>
          </Text>

          <View
            className={`flex-row items-center bg-[#F0F3F7] dark:bg-[#1A1A1A] rounded-lg h-14 px-1 ${
              errors.individualName
                ? "border border-[#DF5B5B] bg-[#FFF5F5] dark:bg-[#2A1A1A]"
                : ""
            }`}
          >
            {/* Prefix Dropdown */}
            <Dropdown
              style={{
                width: 68,
                height: 40,
                backgroundColor: isDarkMode ? "#000" : "#FFF",
                borderRadius: 8,
                paddingHorizontal: 10,
              }}
              selectedTextStyle={{
                color: isDarkMode ? "#F5F5F5" : "#454545",
                fontSize: 14,
                fontFamily: "Poppins",
              }}
              itemTextStyle={{
                fontSize: 14,
                fontFamily: "Poppins",
                color: isDarkMode ? "#F5F5F5" : "#000",
              }}
              data={honorifics}
              labelField="label"
              valueField="value"
              value={prefix}
              onChange={(item) => setPrefix(item.value)}
              containerStyle={{
                borderRadius: 16,
                backgroundColor: isDarkMode ? "#1A1A1A" : "#FFFFFF",
                borderWidth: 0,
              }}
              activeColor={isDarkMode ? "#333" : "#F3F4F6"}
              iconColor={isDarkMode ? "#F5F5F5" : "#000"}
            />

            {/* Name Input */}
            <TextInput
              placeholder="e.g. John Smith"
              placeholderTextColor={isDarkMode ? "#919191" : "#454545"}
              value={individualName}
              onChangeText={(text) => {
                setIndividualName(text);
                if (errors.individualName)
                  setErrors((prev) => ({ ...prev, individualName: false }));
              }}
              className="flex-1 h-14 text-black dark:text-white font-poppins text-sm px-2"
              returnKeyType="next"
            />
          </View>
          {errors.individualName && (
            <Text className="text-[#DF5B5B] text-xs font-poppins mt-1 ml-1">
              Individual name is required
            </Text>
          )}
        </View>

        {/* Firm / Company Name */}
        <View className="mb-6">
          <Text className="text-black dark:text-[#F5F5F5] font-dmSemiBold text-sm mb-2">
            Firm / Company Name <Text className="text-red-500">*</Text>
          </Text>
          <TextInput
            placeholder="e.g. Dena Consulting"
            placeholderTextColor={isDarkMode ? "#919191" : "#454545"}
            value={firmName}
            onChangeText={(text) => {
              setFirmName(text);
              if (errors.firmName)
                setErrors((prev) => ({ ...prev, firmName: false }));
            }}
            className={`bg-[#F0F3F7] dark:bg-[#1A1A1A] px-4 h-14 rounded-lg text-black dark:text-white font-poppins text-sm ${
              errors.firmName
                ? "border border-[#DF5B5B] bg-[#FFF5F5] dark:bg-[#2A1A1A]"
                : ""
            }`}
            returnKeyType="next"
          />
          {errors.firmName && (
            <Text className="text-[#DF5B5B] text-xs font-poppins mt-1 ml-1">
              Firm name is required
            </Text>
          )}
        </View>

        {/* Dynamic Fields */}
        {[
          {
            label: "Mobile Number",
            list: officialNumberList,
            setter: setOfficialNumberList,
          },
          { label: "Email", list: emailList, setter: setEmailList },
          {
            label: "Designation",
            list: designationList,
            setter: setDesignationList,
          },
          { label: "Expertise", list: expertiseList, setter: setExpertiseList },
          {
            label: "Office Address",
            list: addressList,
            setter: setAddressList,
          },
        ].map((field, idx) => (
          <DynamicInputField
            key={idx}
            {...field}
            updateField={updateField}
            addField={addField}
            rawPhoneValues={rawPhoneValues}
          />
        ))}
      </KeyboardAwareScrollView>

      {/* Sticky Bottom Buttons */}
      <View className="absolute bottom-0 left-0 right-0 bg-white dark:bg-[#0D0D0D] px-4 pt-4 pb-12">
        <View className="flex-row items-center gap-3">
          <TouchableOpacity
            onPress={() => {
              resetForm();
              router.back();
            }}
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
