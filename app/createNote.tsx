import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
// @ts-ignore
import RichEditor from "react-native-pell-rich-editor/src/RichEditor";

type ToolbarView = "main" | "style" | "weight" | "color" | "font" | "none";

const CreateNote = () => {
  const router = useRouter();
  const richText = useRef<RichEditor>(null);
  const [title, setTitle] = useState("");
  const [activeToolbar, setActiveToolbar] = useState<ToolbarView>("main");

  // Colors based on the provided image
  const textColors = [
    "#A5B4FC",
    "#F87171",
    "#60A5FA",
    "#FB923C",
    "#34D399",
    "#9CA3AF",
    "#C084FC",
    "#FDE047",
    "#A78BFA",
    "#3B82F6",
    "#2DD4BF",
    "#818CF8",
    "#F472B6",
    "#A3E635",
    "#22D3EE",
    "#000000",
    "#FFFFFF",
    "#FFFF00",
    "#008000",
    "#0000FF",
    "#800080",
  ];

  const handleStyleSelection = (command: string, arg?: string) => {
    richText.current?.sendAction(command, arg || "");
  };

  const handleColorSelection = (color: string) => {
    richText.current?.sendAction("foreColor", color);
  };

  const renderStyleToolbar = () => (
    <View className="bg-[#1A1A1A] p-4 rounded-t-3xl border-t border-gray-800">
      <View className="w-10 h-1 bg-gray-600 rounded-full mx-auto mb-4" />
      <View className="flex-row justify-around mb-6 items-center px-2">
        <TouchableOpacity
          onPress={() => handleStyleSelection("formatBlock", "H1")}
        >
          <Text className="text-white font-poppinsBold text-sm">Title</Text>
        </TouchableOpacity>
        <View className="w-[1px] h-4 bg-gray-700 mx-1" />
        <TouchableOpacity
          onPress={() => handleStyleSelection("formatBlock", "H2")}
        >
          <Text className="text-white font-poppinsBold text-sm">Heading</Text>
        </TouchableOpacity>
        <View className="w-[1px] h-4 bg-gray-700 mx-1" />
        <TouchableOpacity
          onPress={() => handleStyleSelection("formatBlock", "P")}
        >
          <Text className="text-white font-poppinsBold text-sm">Body</Text>
        </TouchableOpacity>
        <View className="w-[1px] h-4 bg-gray-700 mx-1" />
        <TouchableOpacity>
          <Text className="text-gray-500 font-poppinsMedium text-xs">
            More...
          </Text>
        </TouchableOpacity>
      </View>

      <View className="flex-row justify-between mb-6">
        <TouchableOpacity className="bg-gray-800 p-2.5 rounded-xl">
          <Ionicons name="checkbox-outline" size={20} color="white" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleStyleSelection("insertOrderedList")}
          className="bg-blue-600/20 border border-blue-600 p-2.5 rounded-xl"
        >
          <Ionicons name="list" size={20} color="#566FEC" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleStyleSelection("insertUnorderedList")}
          className="bg-gray-800 p-2.5 rounded-xl"
        >
          <Ionicons name="list-outline" size={20} color="white" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleStyleSelection("justifyLeft")}
          className="bg-gray-800 p-2.5 rounded-xl"
        >
          <Ionicons name="menu-outline" size={20} color="white" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleStyleSelection("justifyCenter")}
          className="bg-gray-800 p-2.5 rounded-xl"
        >
          <Ionicons name="reorder-two-outline" size={20} color="white" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleStyleSelection("justifyRight")}
          className="bg-gray-800 p-2.5 rounded-xl"
        >
          <Ionicons name="reorder-three-outline" size={20} color="white" />
        </TouchableOpacity>
      </View>

      <View className="flex-row justify-between items-center">
        <TouchableOpacity
          onPress={() => setActiveToolbar("font")}
          className="bg-gray-800 px-4 py-2.5 rounded-xl"
        >
          <Text className="text-white text-xs font-poppinsMedium">
            Font Style
          </Text>
        </TouchableOpacity>
        <TouchableOpacity className="bg-blue-600 px-6 py-2.5 rounded-xl">
          <Text className="text-white text-xs font-poppinsBold">Block</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveToolbar("color")}
          className="bg-gray-800 px-4 py-2.5 rounded-xl"
        >
          <Text className="text-white text-xs font-poppinsMedium">
            Text Color
          </Text>
        </TouchableOpacity>
        <TouchableOpacity className="bg-gray-800 w-10 h-10 rounded-full items-center justify-center border border-gray-700">
          <View
            className="w-6 h-6 rounded-full"
            style={{ backgroundColor: "cyan" }}
          />
        </TouchableOpacity>
        <TouchableOpacity>
          <Ionicons name="ellipsis-horizontal" size={20} color="#9BA1A6" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderColorToolbar = () => (
    <View className="bg-[#1A1A1A] p-4 rounded-t-3xl border-t border-gray-800">
      <View className="w-10 h-1 bg-gray-600 rounded-full mx-auto mb-4" />
      <View className="flex-row flex-wrap justify-between gap-y-3">
        {textColors.map((color, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => handleColorSelection(color)}
            style={{ backgroundColor: color }}
            className="w-[12%] aspect-square rounded-md border border-gray-700"
          />
        ))}
        <TouchableOpacity
          onPress={() => setActiveToolbar("style")}
          className="w-[12%] aspect-square rounded-full bg-gray-800 items-center justify-center"
        >
          <Ionicons name="chevron-down" size={20} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderFontToolbar = () => (
    <View className="bg-[#1A1A1A] p-4 rounded-t-3xl border-t border-gray-800">
      <View className="w-10 h-1 bg-gray-600 rounded-full mx-auto mb-4" />
      <View className="flex-row justify-around mb-6 px-2">
        <TouchableOpacity
          onPress={() => handleStyleSelection("bold")}
          className="items-center bg-gray-800 p-4 rounded-2xl w-[22%]"
        >
          <Text className="text-white text-xl font-poppinsBold">B</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleStyleSelection("italic")}
          className="items-center bg-gray-800 p-4 rounded-2xl w-[22%]"
        >
          <Text className="text-white text-xl font-poppinsMedium italic">
            I
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleStyleSelection("underline")}
          className="items-center bg-gray-800 p-4 rounded-2xl w-[22%]"
        >
          <Text className="text-white text-xl font-poppinsMedium underline">
            U
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleStyleSelection("strikeThrough")}
          className="items-center bg-gray-800 p-4 rounded-2xl w-[22%]"
        >
          <Text className="text-white text-xl font-poppinsMedium line-through">
            S
          </Text>
        </TouchableOpacity>
      </View>
      <View className="flex-row justify-between mb-4 px-2">
        {["System", "Serif", "Mono", "Round"].map((font) => (
          <TouchableOpacity
            key={font}
            className="bg-gray-800 px-4 py-4 rounded-2xl items-center w-[23%]"
          >
            <Text className="text-white font-poppinsBold text-lg">Aa</Text>
            <Text className="text-gray-400 text-[10px] mt-1 font-poppinsMedium">
              {font}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-black"
    >
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 pt-14 pb-4">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Ionicons name="chevron-back" size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-white text-lg font-poppinsBold">
            Untitled page
          </Text>
        </View>

        <View className="flex-row items-center gap-x-5">
          <TouchableOpacity>
            <Ionicons name="time-outline" size={24} color="#9BA1A6" />
          </TouchableOpacity>
          <TouchableOpacity>
            <Ionicons name="flag-outline" size={22} color="#9BA1A6" />
          </TouchableOpacity>
          <TouchableOpacity>
            <Ionicons name="ellipsis-horizontal" size={24} color="#9BA1A6" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
        <TextInput
          placeholder="Page Title"
          placeholderTextColor="#4B5563"
          value={title}
          onChangeText={setTitle}
          className="text-white text-3xl font-poppinsBold mt-6 mb-4"
          multiline
        />
        <View className="h-[1px] bg-gray-800 w-full mb-6" />

        <RichEditor
          ref={richText}
          placeholder={"Start typing..."}
          onChange={(text: string) => {}}
          editorStyle={{
            backgroundColor: "black",
            color: "white",
            placeholderColor: "#4B5563",
            contentCSSText:
              "font-family: sans-serif; font-size: 18px; line-height: 1.6;",
          }}
          useContainer={false}
          initialHeight={500}
        />
      </ScrollView>

      {/* Dynamic Toolbars */}
      <View>
        {activeToolbar === "style" && renderStyleToolbar()}
        {activeToolbar === "color" && renderColorToolbar()}
        {activeToolbar === "font" && renderFontToolbar()}

        {/* Main Bottom Toolbar */}
        <View className="flex-row items-center justify-between px-6 py-4 border-t border-gray-900 bg-black">
          <View className="flex-row items-center gap-x-8">
            <TouchableOpacity onPress={() => setActiveToolbar("style")}>
              <Ionicons
                name="document-text-outline"
                size={22}
                color={activeToolbar === "style" ? "white" : "#9BA1A6"}
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setActiveToolbar("font")}>
              <Text
                className={`text-xl font-poppinsBold ${
                  activeToolbar === "font" ? "text-white" : "text-[#9BA1A6]"
                }`}
              >
                Aa
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setActiveToolbar("color")}>
              <Ionicons
                name="color-palette-outline"
                size={22}
                color={activeToolbar === "color" ? "white" : "#9BA1A6"}
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={() => Keyboard.dismiss()}>
            <Ionicons name="keypad-outline" size={24} color="#9BA1A6" />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

export default CreateNote;
