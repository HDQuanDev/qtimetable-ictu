import React, { useEffect } from "react";
import {
  View,
  Text,
  SafeAreaView,
  StatusBar,
  Pressable,
  TouchableOpacity,
} from "react-native";
import { NavigationContainer, useNavigation } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useTheme } from "../components/ThemeProvider";
import ThoiKhoaBieuScreen from "./ThoiKhoaBieuScreen";
import MarkScreen from "./MarkScreen";
import MenuScreen from "./MenuScreen";
import ProfileScreen from "./ProfileScreen";
import ClassScheduleScreen from "./ClassScheduleScreen";

const Tab = createBottomTabNavigator(); // Khởi tạo Tab Navigator

const TabScreenWrapper = ({ children }) => {
  const { isDarkMode } = useTheme(); // Lấy isDarkMode từ context theme

  return (
    <View
      className={`flex-1 ${isDarkMode ? "bg-[#334155]" : "bg-[#e2e8f0]"} pb-20`}
    >
      {children}
    </View>
  );
};

// Hàm hiển thị Tab Thời Khoá Biểu
const WrappedThoiKhoaBieuScreen = () => (
  <TabScreenWrapper>
    <ThoiKhoaBieuScreen />
  </TabScreenWrapper>
);

// Hàm hiển thị Tab Bảng Điểm
const WrappedMarkScreen = () => (
  <TabScreenWrapper>
    <MarkScreen />
  </TabScreenWrapper>
);

// Hàm hiển thị Tab Cài Đặt
const WrappedMenuScreen = () => (
  <TabScreenWrapper>
    <MenuScreen />
  </TabScreenWrapper>
);

// Hàm hiển thị Tab Trang Cá Nhân
const WrappedProfileScreen = () => (
  <TabScreenWrapper>
    <ProfileScreen />
  </TabScreenWrapper>
);

// Hàm hiển thị Tab Thời Gian Biểu
const WrappedClassScheduleScreen = () => (
  <TabScreenWrapper>
    <ClassScheduleScreen />
  </TabScreenWrapper>
);

// Hàm hiển thị thanh điều hướng
const CustomTabBar = ({ state, descriptors, navigation }) => {
  const { isDarkMode } = useTheme();
  const focusedTab = useSharedValue(state.index);
  const TAB_WIDTH = 70;
  const SELECTED_TAB_WIDTH = 140;

  useEffect(() => {
    focusedTab.value = state.index;
  }, [state.index]);

  return (
    <BlurView
      tint={isDarkMode ? "dark" : "light"}
      intensity={100}
      className="absolute bottom-0 left-0 right-0 h-20 flex-row items-center justify-around rounded-t-[35px] overflow-hidden"
      style={{
        backgroundColor: isDarkMode
          ? "rgba(15, 15, 20, 0.9)" // Màu nền tối với độ mờ
          : "rgba(245, 245, 245, 0.9)", // Màu nền sáng với độ mờ
        shadowColor: isDarkMode ? "#000" : "#ddd",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
      }}
    >
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label = options.tabBarLabel || options.title || route.name;
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        let iconName;
        if (route.name === "ThoiKhoaBieu") {
          iconName = "calendar";
        } else if (route.name === "Mark") {
          iconName = "stats-chart";
        } else if (route.name === "Settings") {
          iconName = "settings";
        } else if (route.name === "Profile") {
          iconName = "person";
        } else if (route.name === "ThoiGianHoc") {
          iconName = "time";
        }

        const animatedStyles = useAnimatedStyle(() => {
          const isSelected = focusedTab.value === index;

          return {
            width: withTiming(isSelected ? SELECTED_TAB_WIDTH : TAB_WIDTH, {
              duration: 300,
            }),
            backgroundColor: withTiming(
              isSelected
                ? isDarkMode
                  ? "rgba(99, 179, 237, 0.5)" // Màu xanh nhẹ khi được chọn trong chế độ tối
                  : "rgba(66, 153, 225, 0.3)" // Màu xanh nhẹ khi được chọn trong chế độ sáng
                : "transparent",
              { duration: 300 }
            ),
            borderRadius: withTiming(isSelected ? 25 : 10, { duration: 300 }),
            paddingHorizontal: withTiming(isSelected ? 15 : 0, {
              duration: 300,
            }),
          };
        });

        return (
          <Pressable
            key={index}
            onPress={onPress}
            className="items-center justify-center"
            style={{ paddingBottom: 8 }}
          >
            <Animated.View
              className="flex-row items-center justify-center h-16"
              style={animatedStyles}
            >
              <Ionicons
                name={iconName}
                size={24}
                style={{ marginRight: isFocused ? 6 : 0 }}
                color={
                  isFocused
                    ? isDarkMode
                      ? "#63B3ED" // Màu xanh khi tab được chọn ở chế độ tối
                      : "#3182CE" // Màu xanh khi tab được chọn ở chế độ sáng
                    : isDarkMode
                    ? "#718096" // Màu xám nhạt cho icon khi không được chọn (chế độ tối)
                    : "#A0AEC0" // Màu xám đậm cho icon khi không được chọn (chế độ sáng)
                }
              />
              {isFocused && (
                <Text
                  className={`text-xs font-medium ${
                    isDarkMode ? "text-blue-300" : "text-blue-600"
                  }`}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  style={{ maxWidth: 100 }} // Đảm bảo chữ không vượt quá chiều rộng tab
                >
                  {label}
                </Text>
              )}
            </Animated.View>
          </Pressable>
        );
      })}
    </BlurView>
  );
};

// Hàm hiển thị các Tab
function SwipeableScreens() {
  const { isDarkMode } = useTheme();
  const navigation = useNavigation();
  return (
    <SafeAreaView className="flex-1">
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
      <Tab.Navigator
        tabBar={(props) => <CustomTabBar {...props} />}
        screenOptions={{
          headerShown: false,
        }}
        initialRouteName="ThoiKhoaBieu"
      >
        <Tab.Screen
          name="Mark"
          component={WrappedMarkScreen}
          options={{
            tabBarLabel: "Bảng Điểm",
          }}
        />
        <Tab.Screen
          name="ThoiGianHoc"
          component={WrappedClassScheduleScreen}
          options={{
            tabBarLabel: "Thời Gian Biểu",
          }}
        />
        <Tab.Screen
          name="ThoiKhoaBieu"
          component={WrappedThoiKhoaBieuScreen}
          options={{
            tabBarLabel: "Thời Khoá Biểu",
          }}
        />
        <Tab.Screen
          name="Profile"
          component={WrappedProfileScreen}
          options={{
            tabBarLabel: "Trang Cá Nhân",
          }}
        />
        <Tab.Screen
          name="Settings"
          component={WrappedMenuScreen}
          options={{
            tabBarLabel: "Cài Đặt",
          }}
        />
      </Tab.Navigator>
    </SafeAreaView>
  );
}

export default SwipeableScreens;
