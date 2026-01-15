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
    <View className="px-3 w-full items-center">
      <View
        className="flex-row items-center p-4 rounded-2xl w-full max-w-[400px]"
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
        <View className="w-12 h-12 rounded-xl bg-white items-center justify-center mr-2 ">
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
          <HugeiconsIcon icon={Cancel01Icon} size={20} color="#7F7F7F" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export const toastConfig = {
  success: (props: BaseToastProps) => (
    <ToastContainer
      backgroundColor="#BFF2D0"
      icon={TickDouble02Icon}
      iconColor="#5BDF9E"
    >
      <>{props.text1}</>
      <>{props.text2}</>
    </ToastContainer>
  ),

  error: (props: BaseToastProps) => (
    <ToastContainer
      backgroundColor="#FBBFBF"
      icon={UnavailableIcon}
      iconColor="#DF5B5B"
    >
      <>{props.text1}</>
      <>{props.text2}</>
    </ToastContainer>
  ),

  info: (props: BaseToastProps) => (
    <ToastContainer
      backgroundColor="#B8D4FF"
      icon={InformationCircleIcon}
      iconColor="#335EB3"
    >
      <>{props.text1}</>
      <>{props.text2}</>
    </ToastContainer>
  ),

  warning: (props: BaseToastProps) => (
    <ToastContainer
      backgroundColor="#FFD1B8"
      icon={Alert01Icon}
      iconColor="#FF8A47"
    >
      <>{props.text1}</>
      <>{props.text2}</>
    </ToastContainer>
  ),

  neutral: (props: BaseToastProps) => (
    <ToastContainer
      backgroundColor="#E5E5E5"
      icon={InformationCircleIcon}
      iconColor="#7F7F7F"
    >
      <>{props.text1}</>
      <>{props.text2}</>
    </ToastContainer>
  ),


};
