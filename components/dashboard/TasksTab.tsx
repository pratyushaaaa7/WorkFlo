import {
  ArrowDown01Icon,
  ArrowUp01Icon,
  Calendar03Icon,
  Progress03Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { format, isValid, startOfDay } from "date-fns";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  LayoutAnimation,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";

const { width } = Dimensions.get("window");

interface TasksTabProps {
  loading: boolean;
  refreshing: boolean;
  onRefresh: () => void;
  responsibleItems: any[];
}

const getDateStatus = (dateString: string | null) => {
  if (!dateString || !isValid(new Date(dateString))) {
    return { color: "#454545", text: "For Info" }; // Gray-400
  }

  const date = new Date(dateString);
  const today = startOfDay(new Date());
  const targetDate = startOfDay(date);

  if (targetDate.getTime() === today.getTime()) {
    return { color: "#5B4CCC", text: "Today" }; // Purple
  } else if (targetDate < today) {
    return { color: "#DF5B5B", text: format(date, "d MMM yyyy") }; // Red
  } else {
    return { color: "#1AA45B", text: format(date, "d MMM yyyy") }; // Green
  }
};

const TaskItem = ({ task }: { task: any }) => {
  const isDarkMode = useColorScheme() === "dark";
  const dateStatus = getDateStatus(task.date);
  const router = useRouter();

  const handlePress = () => {
    switch (task.type) {
      case "MOM":
        router.push({
          pathname: "/minuteDetail",
          params: {
            minuteId: task.id,
            meetingId: task.meetingId,
            issueSubject: task.title,
            description: task.description,
            targetDate: task.date,
            status: task.status,
            remarks: task.remarks,
            responsibility: JSON.stringify(task.responsibility || []),
            raisedBy: JSON.stringify(task.raisedBy || []),
          },
        });
        break;
      case "Running Notes":
        router.push({
          pathname: "/runningNotes",
          params: {
            projectId: task.projectId,
            projectName: task.projectName,
            company: task.company,
            highlightId: task.id,
          },
        });
        break;
      case "ILR":
        router.push({
          pathname: "/ilrActivities",
          params: {
            ilrId: task.id,
            description: task.description,
            targetDate: task.date,
            remarks: task.remarks,
            status: task.status,
            ilrNumber: task.ilrNumber,
            responsibility: JSON.stringify(task.responsibility || []),
            createdBy: task.createdBy,
            createdAt: task.createdAt,
          },
        });
        break;
      default:
        console.warn("Unknown task type:", task.type);
        break;
    }
  };

  return (
    <TouchableOpacity onPress={handlePress} className=" px-4 py-1 pt-2 ">
      <View className="h-[1px] bg-gray-100 dark:bg-[#252525] mb-4" />
      <View className="flex-row items-center justify-between mb-1">
        <View className="flex-row items-start flex-1">
          <View className="mr-3 mt-1">
            <HugeiconsIcon
              icon={Progress03Icon}
              size={18}
              color={isDarkMode ? "#5B4CCC" : "#5B4CCC"}
            />
          </View>
          <View className="flex-1">
            <Text className="font-dmSemiBold text-gray-900 dark:text-white mb-1">
              {task.title}
            </Text>
            {!!task.description && (
              <Text
                className="text-sm text-[#454545] dark:text-[#919191] font-poppins mb-2"
                numberOfLines={2}
              >
                {task.description}
              </Text>
            )}

            <View className="flex-row mt-1 items-center">
              <HugeiconsIcon
                icon={Calendar03Icon}
                size={14}
                color={dateStatus.color}
              />
              <Text
                className="ml-1.5 text-xs font-poppinsMedium"
                style={{ color: dateStatus.color }}
              >
                {dateStatus.text}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const TaskGroup = ({ group }: { group: any }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isDarkMode = useColorScheme() === "dark";

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded(!isExpanded);
  };

  return (
    <View className="mb-2">
      <TouchableOpacity
        onPress={toggleExpand}
        className="flex-row items-center justify-between py-3"
      >
        <View className="flex-row items-center flex-1">
          <View className="w-1 h-6 bg-[#2563EB] rounded-full mr-3" />
          <Text
            className="text-gray-900 dark:text-white text-base font-poppinsMedium flex-1 mr-2"
            numberOfLines={1}
          >
            {group.location}
          </Text>
          <View className="bg-gray-200 dark:bg-[#252525] px-2 py-0.5 rounded-md">
            <Text className="text-gray-600 dark:text-[#919191] text-xs font-poppinsBold">
              {group.tasks.length}
            </Text>
          </View>
        </View>
        <HugeiconsIcon
          icon={isExpanded ? ArrowUp01Icon : ArrowDown01Icon}
          size={20}
          color={isDarkMode ? "#919191" : "#6B7280"}
        />
      </TouchableOpacity>

      {isExpanded && (
        <View className="pl-4">
          {group.tasks.map((task: any, idx: number) => (
            <TaskItem key={idx} task={task} />
          ))}
        </View>
      )}
    </View>
  );
};

const ProjectSection = ({ project }: { project: any }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isDarkMode = useColorScheme() === "dark";

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded(!isExpanded);
  };

  return (
    <View className="mb-2  overflow-hidden ">
      <TouchableOpacity
        onPress={toggleExpand}
        activeOpacity={0.7}
        className="flex-row items-center justify-between p-4 pt-6 border-t border-gray-100 dark:border-[#252525]"
      >
        <View className="flex-row items-center flex-1">
          <View className="w-1 h-6 bg-[#0073CB] rounded-full mr-3" />
          <Text className="text-gray-900 dark:text-white text-lg font-poppinsSemiBold mr-3">
            {project.projectName}
          </Text>
          <View className="bg-[#E0E5EB] dark:bg-[#2F2F2F] px-2.5 py-1 rounded-lg">
            <Text className="text-black dark:text-[#F5F5F5] text-[10px] font-poppinsBold">
              {project.tasks.length}{" "}
              {/* {project.tasks.length === 1 ? "Task" : "Tasks"} */}
            </Text>
          </View>
        </View>
        <HugeiconsIcon
          icon={isExpanded ? ArrowUp01Icon : ArrowDown01Icon}
          size={20}
          color={isDarkMode ? "#919191" : "#6B7280"}
        />
      </TouchableOpacity>

      {isExpanded && (
        <View className="">
          {project.tasks.map((task: any, idx: number) => (
            <TaskItem key={idx} task={task} />
          ))}
        </View>
      )}
    </View>
  );
};

const TasksTab = ({
  loading,
  refreshing,
  onRefresh,
  responsibleItems,
}: TasksTabProps) => {
  const [activeSubTab, setActiveSubTab] = useState("MOM Tasks");
  const isDarkMode = useColorScheme() === "dark";
  const subTabs = ["MOM Tasks", "Running Notes", "ILR Tasks"];
  const flatListRef = React.useRef<FlatList>(null);

  const getTransformedData = (subTab: string) => {
    // Map Sub-Tab names to Backend Types
    const typeMap: { [key: string]: string } = {
      "MOM Tasks": "MOM",
      "Running Notes": "Running Notes",
      "ILR Tasks": "ILR",
    };

    const activeType = typeMap[subTab];

    // Filter and transform
    const sourceData = responsibleItems
      .filter((item) => item.type === activeType)
      .map((item) => ({
        id: item.id,
        title: item.title,
        description:
          subTab === "Running Notes"
            ? ""
            : item.description || item.remarks || "",
        date: item.targetDate,
        location: item.projectName || "No Project",
        type: item.type,
        meetingId: item.meetingId,
        projectId: item.projectId,
        company: item.company,
        projectName: item.projectName,
        status: item.status,
        remarks: item.remarks,
        responsibility: item.responsibility,
        ilrNumber: item.ilrNumber,
        createdBy: item.createdBy,
        createdAt: item.createdAt,
        raisedBy: item.raisedBy,
      }));

    // Group by Project
    const projectGroups: { [key: string]: any } = {};

    sourceData.forEach((task) => {
      const projKey = task.location; // location holds projectName

      if (!projectGroups[projKey]) {
        projectGroups[projKey] = {
          projectName: projKey,
          tasks: [],
        };
      }

      let timeStr = "No Date";
      if (task.date) {
        const d = new Date(task.date);
        timeStr = format(d, "d MMM yyyy");
      }

      projectGroups[projKey].tasks.push({
        ...task,
        time: timeStr,
      });
    });

    // Convert map to array and sort by Project Name
    return Object.values(projectGroups).sort((a: any, b: any) =>
      a.projectName.localeCompare(b.projectName),
    );
  };

  const handleTabPress = (index: number) => {
    setActiveSubTab(subTabs[index]);
    flatListRef.current?.scrollToIndex({ index, animated: true });
  };

  const onMomentumScrollEnd = (e: any) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / width);
    if (index >= 0 && index < subTabs.length) {
      setActiveSubTab(subTabs[index]);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center py-10">
        <ActivityIndicator size="large" color="#5B4CCC" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#F6F8FA] dark:bg-[#0d0d0d]">
      {/* Sub-Tab Navigation */}
      <View className="flex-row ">
        {subTabs.map((tab, index) => {
          const isActive = activeSubTab === tab;
          return (
            <TouchableOpacity
              key={tab}
              onPress={() => handleTabPress(index)}
              className={`flex-1 items-center pt-4 pb-3 border-b ${isActive ? "border-[#5B4CCC] dark:border-[#5B4CCC]" : "border-[#E0E5EE] dark:border-[#63615F]"}`}
            >
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                className={` font-poppinsMedium ${
                  isActive
                    ? "text-[#5B4CCC] dark:text-[#5B4CCC]"
                    : "text-[#454545] dark:text-[#BBBBBB]"
                }`}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <FlatList
        ref={flatListRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        data={subTabs}
        keyExtractor={(item) => item}
        onMomentumScrollEnd={onMomentumScrollEnd}
        getItemLayout={(data: any, index: number) => ({
          length: width,
          offset: width * index,
          index,
        })}
        onScrollToIndexFailed={(info) => {
          const wait = new Promise((resolve) => setTimeout(resolve, 100));
          wait.then(() => {
            flatListRef.current?.scrollToIndex({
              index: info.index,
              animated: true,
            });
          });
        }}
        renderItem={({ item: tabName }: { item: string }) => {
          const transformedData = getTransformedData(tabName);
          return (
            <View style={{ width }}>
              <ScrollView
                className="flex-1   pb-5"
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    colors={["#5B4CCC"]}
                    tintColor="#5B4CCC"
                  />
                }
              >
                {transformedData.length > 0 ? (
                  transformedData.map((project, idx) => (
                    <ProjectSection key={idx} project={project} />
                  ))
                ) : (
                  <View className="items-center py-10">
                    <Text className="text-gray-500 font-poppins">
                      You have nothing in {tabName}
                    </Text>
                  </View>
                )}
                <View className="h-20" />
              </ScrollView>
            </View>
          );
        }}
      />
    </View>
  );
};

export default TasksTab;
