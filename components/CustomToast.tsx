import {
  Alert01Icon,
  Cancel01Icon,
  UnavailableIcon,
  InformationCircleIcon,

  TickDouble02Icon
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import React from "react";
import { Text, TouchableOpacity, useColorScheme, View } from "react-native";
import Toast, { BaseToastProps } from "react-native-toast-message";

const ToastContainer = ({
  children,
  backgroundColor,
  icon,
  iconColor,
}: {
  children: React.ReactNode;
  backgroundColor: string;
  icon: any;
  iconColor: string;
}) => {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";

  return (
    <View className="px-5 w-full items-center">
      <View
        className="flex-row items-center p-4 rounded-[24px] w-full max-w-[400px]"
        style={{
          backgroundColor: backgroundColor,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.05,
          shadowRadius: 10,
          elevation: 5,
        }}
      >
        {/* White Icon Container */}
        <View className="w-12 h-12 rounded-[14px] bg-white items-center justify-center mr-4 shadow-sm shadow-black/5">
          <HugeiconsIcon icon={icon} size={24} color={iconColor} />
        </View>

        {/* Content */}
        <View className="flex-1 mr-2">
          <Text className="text-[#1A1A1A] font-poppinsSemiBold text-base leading-tight">
            {children[0]}
          </Text>
          {children[1] && (
            <Text className="text-[#666666] font-poppins text-sm mt-0.5 leading-snug">
              {children[1]}
            </Text>
          )}
        </View>

        {/* Close Button */}
        <TouchableOpacity
          onPress={() => Toast.hide()}
          className="w-8 h-8 items-center justify-center"
        >
          <HugeiconsIcon icon={Cancel01Icon} size={20} color="#999999" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export const toastConfig = {
  success: (props: BaseToastProps) => (
    <ToastContainer
      backgroundColor="#D1FADA"
      icon={TickDouble02Icon}
      iconColor="#10B981"
    >
      <>{props.text1}</>
      <>{props.text2}</>
    </ToastContainer>
  ),

  error: (props: BaseToastProps) => (
    <ToastContainer
      backgroundColor="#FFD1D1"
      icon={UnavailableIcon}
      iconColor="#EF4444"
    >
      <>{props.text1}</>
      <>{props.text2}</>
    </ToastContainer>
  ),

  info: (props: BaseToastProps) => (
    <ToastContainer
      backgroundColor="#D1E4FF"
      icon={InformationCircleIcon}
      iconColor="#3B82F6"
    >
      <>{props.text1}</>
      <>{props.text2}</>
    </ToastContainer>
  ),

  warning: (props: BaseToastProps) => (
    <ToastContainer
      backgroundColor="#FFE5D1"
      icon={Alert01Icon}
      iconColor="#F59E0B"
    >
      <>{props.text1}</>
      <>{props.text2}</>
    </ToastContainer>
  ),

  neutral: (props: BaseToastProps) => (
    <ToastContainer
      backgroundColor="#F3F4F6"
      icon={InformationCircleIcon}
      iconColor="#6B7280"
    >
      <>{props.text1}</>
      <>{props.text2}</>
    </ToastContainer>
  ),

  
};
