import React from "react";
import { Text, View, useColorScheme } from "react-native";

export const AVATAR_COLORS = [
  {
    bg: "bg-[#E0E7FF] dark:bg-[#2D3494]",
    text: "text-[#4338CA] dark:text-[#C7D2FE]",
  },
  {
    bg: "bg-[#D1FAE5] dark:bg-[#064E3B]",
    text: "text-[#059669] dark:text-[#6EE7B7]",
  },
  {
    bg: "bg-[#FFEDD5] dark:bg-[#7C2D12]",
    text: "text-[#D97706] dark:text-[#FED7AA]",
  },
  {
    bg: "bg-[#FCE7F3] dark:bg-[#831843]",
    text: "text-[#DB2777] dark:text-[#F9A8D4]",
  },
  {
    bg: "bg-[#CFFAFE] dark:bg-[#164E63]",
    text: "text-[#0891B2] dark:text-[#67E8F9]",
  },
  {
    bg: "bg-[#FEF3C7] dark:bg-[#78350F]",
    text: "text-[#D97706] dark:text-[#FDE68A]",
  },
  {
    bg: "bg-[#EDE9FE] dark:bg-[#4C1D95]",
    text: "text-[#7C3AED] dark:text-[#C4B5FD]",
  },
  {
    bg: "bg-[#FFE4E6] dark:bg-[#881337]",
    text: "text-[#E11D48] dark:text-[#FDA4AF]",
  },
];

export const getAvatarColor = (name: string, index?: number) => {
  const hash =
    name?.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) ||
    index ||
    0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
};

export const getInitials = (name: string) => {
  if (!name) return "??";
  // Remove special characters and trim
  const cleanName = name.replace(/[^a-zA-Z0-9\s]/g, "").trim();
  const parts = cleanName.split(/\s+/).filter((p) => p.length > 0);

  if (parts.length >= 2) {
    // If 2 or more words, take initials of the first two words
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  if (parts.length === 1) {
    return parts[0][0].toUpperCase();
  }
  return "??";
};

interface GlobalAvatarProps {
  name: string;
  size?: number;
  fontSize?: number;
  className?: string; // Additional classes for positioning (like margins)
  index?: number; // Optional index to help with color selection if multiple avatars
  borderRadius?: number;
}

const GlobalAvatar: React.FC<GlobalAvatarProps> = ({
  name,
  size = 40,
  fontSize = 14,
  className = "",
  index,
  borderRadius,
}) => {
  const isDarkMode = useColorScheme() === "dark";
  const initials = getInitials(name);
  const color = getAvatarColor(name, index);

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: borderRadius !== undefined ? borderRadius : size / 2,
      }}
      className={`${color.bg} items-center justify-center ${className}`}
    >
      <Text style={{ fontSize }} className={`font-dmBold ${color.text}`}>
        {initials}
      </Text>
    </View>
  );
};

export default GlobalAvatar;
