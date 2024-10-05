import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Platform,
  Linking,
  Dimensions,
  useWindowDimensions,
} from "react-native";
import { useTheme } from "../components/ThemeProvider";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

const IntroScreen = ({ onIntroComplete }) => {
  const { isDarkMode } = useTheme();
  const [currentPage, setCurrentPage] = useState(0);
  const [notificationPermission, setNotificationPermission] = useState(false);
  const [batteryOptimizationChecked, setBatteryOptimizationChecked] =
    useState(false);
  const navigation = useNavigation();
  const scrollViewRef = useRef(null);
  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = useWindowDimensions();
  const totalPages = 7;

  useEffect(() => {
    checkNotificationPermission();
    checkIntroCompleted();
    checkBatteryOptimization();
  }, []);

  const checkIntroCompleted = async () => {
    try {
      const value = await AsyncStorage.getItem("@intro_complete");
      if (value !== null) {
        onIntroComplete();
      }
    } catch (error) {
      console.error("Error checking intro completion:", error);
    }
  };

  const checkNotificationPermission = async () => {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    setNotificationPermission(existingStatus === "granted");
  };

  const requestNotificationPermission = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    setNotificationPermission(status === "granted");
  };

  const checkBatteryOptimization = async () => {
    try {
      const value = await AsyncStorage.getItem("@battery_optimization_checked");
      setBatteryOptimizationChecked(value === "true");
    } catch (error) {
      console.error("Error checking battery optimization:", error);
    }
  };

  const openAppSettings = async () => {
    await AsyncStorage.setItem("@battery_optimization_checked", "true");
    setBatteryOptimizationChecked(true);
    Linking.openSettings();
  };

  const introPages = [
    {
      title: "Chào mừng đến với Ứng dụng của tôi",
      content:
        "Ứng dụng thông minh giúp bạn tối ưu hóa lịch học, quản lý điểm số và nâng cao hiệu suất học tập tại ICTU.",
      icon: "home-outline",
      colors: isDarkMode ? ["#1F2937", "#374151"] : ["#4F46E5", "#7C3AED"],
    },
    {
      title: "Lịch học thông minh",
      content:
        "Xem và quản lý thời khóa biểu như lịch học, lịch thi một cách trực quan, dễ dàng!",
      icon: "calendar-outline",
      colors: isDarkMode ? ["#065F46", "#047857"] : ["#10B981", "#059669"],
    },
    {
      title: "Theo dõi điểm số",
      content:
        "Tra cứu điểm số, kết quả học tập của bạn một cách nhanh - gọn - lẹ - đơn giản nhất!",
      icon: "stats-chart-outline",
      colors: isDarkMode ? ["#92400E", "#B45309"] : ["#F59E0B", "#D97706"],
    },
    {
      title: "Nhắc nhở tự động",
      content:
        "Tự động thông báo các môn học, môn thi trước 1 ngày, 1 tiếng, 30 phút, 15 phút và khi bắt đầu vào!",
      icon: "alarm-outline",
      colors: isDarkMode ? ["#991B1B", "#B91C1C"] : ["#EF4444", "#DC2626"],
    },
    {
      title: "Nhiều hơn thế nữa",
      content:
        "Nhiều tính năng hấp dẫn khác như xem thời khóa biểu theo tuần, xem lịch thi theo ngày, xem điểm theo học kỳ, môn học...",
      icon: "ellipsis-horizontal-outline",
      colors: isDarkMode ? ["#5B21B6", "#6D28D9"] : ["#8B5CF6", "#7C3AED"],
    },
    {
      title: "Thông báo",
      content:
        "Vui lòng cho phép ứng dụng gửi thông báo để nhận thông báo về lịch học, lịch thi, cập nhật ứng dụng...",
      icon: "notifications-outline",
      permission: notificationPermission,
      requestPermission: requestNotificationPermission,
      colors: isDarkMode ? ["#1E40AF", "#1D4ED8"] : ["#3B82F6", "#2563EB"],
    },
    {
      title: "Cài đặt chạy ngầm",
      content:
        Platform.OS === "android"
          ? "Để ứng dụng hoạt động tốt nhất, vui lòng truy cập cài đặt ứng dụng và tắt tối ưu hóa pin cho ứng dụng để đảm bảo ứng dụng hoạt động ổn định."
          : "Để ứng dụng hoạt động tốt nhất, vui lòng cho phép làm mới ứng dụng trong nền từ cài đặt ứng dụng.",
      icon: "settings-outline",
      action: openAppSettings,
      actionText: batteryOptimizationChecked
        ? "Đã mở cài đặt"
        : "Mở cài đặt ứng dụng",
      colors: isDarkMode ? ["#4338CA", "#4F46E5"] : ["#6366F1", "#4F46E5"],
    },
  ];

  const renderPage = (page, index) => (
    <LinearGradient
      key={index}
      colors={page.colors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      className="flex-1 items-center justify-center px-6"
      style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT }}
    >
      <View className="items-center justify-center w-full max-w-md">
        <View
          className={`rounded-full p-6 mb-8 ${
            isDarkMode ? "bg-gray-800" : "bg-white"
          } bg-opacity-20`}
        >
          <Ionicons
            name={page.icon}
            size={80}
            color={isDarkMode ? "white" : "black"}
          />
        </View>
        <Text
          className={`text-3xl md:text-4xl font-bold mb-6 text-center ${
            isDarkMode ? "text-white" : "text-gray-900"
          }`}
        >
          {page.title}
        </Text>
        <Text
          className={`text-center mb-8 text-lg md:text-xl ${
            isDarkMode ? "text-gray-300" : "text-gray-700"
          }`}
        >
          {page.content}
        </Text>
        {page.permission !== undefined && (
          <TouchableOpacity
            onPress={page.requestPermission}
            className={`px-8 py-4 rounded-full ${
              isDarkMode ? "bg-gray-800" : "bg-white"
            } ${page.permission ? "opacity-75" : ""}`}
            disabled={page.permission}
          >
            <Text
              className={`font-bold text-xl ${
                page.permission
                  ? isDarkMode
                    ? "text-green-400"
                    : "text-green-600"
                  : isDarkMode
                  ? "text-blue-400"
                  : "text-blue-600"
              }`}
            >
              {page.permission ? "Đã cho phép" : "Cho phép"}
            </Text>
          </TouchableOpacity>
        )}
        {page.action && (
          <TouchableOpacity
            onPress={page.action}
            className={`px-8 py-4 rounded-full mt-4 ${
              isDarkMode ? "bg-gray-800" : "bg-white"
            } ${batteryOptimizationChecked ? "opacity-75" : ""}`}
            disabled={batteryOptimizationChecked}
          >
            <Text
              className={`font-bold text-xl ${
                batteryOptimizationChecked
                  ? isDarkMode
                    ? "text-green-400"
                    : "text-green-600"
                  : isDarkMode
                  ? "text-blue-400"
                  : "text-blue-600"
              }`}
            >
              {page.actionText}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </LinearGradient>
  );

  const handleScroll = (event) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const page = Math.round(offsetX / SCREEN_WIDTH);
    if (page !== currentPage) {
      setCurrentPage(page);
    }
  };

  const nextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
      scrollViewRef.current?.scrollTo({
        x: (currentPage + 1) * SCREEN_WIDTH,
        animated: true,
      });
    } else {
      if (batteryOptimizationChecked) {
        completeIntro();
      } else {
        alert(
          "Vui lòng mở cài đặt ứng dụng và tắt tối ưu hóa pin trước khi tiếp tục."
        );
      }
    }
  };

  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
      scrollViewRef.current?.scrollTo({
        x: (currentPage - 1) * SCREEN_WIDTH,
        animated: true,
      });
    }
  };

  const completeIntro = async () => {
    try {
      await AsyncStorage.setItem("@intro_completed", "true");
      onIntroComplete();
    } catch (error) {
      console.error("Error saving intro completion:", error);
    }
  };

  return (
    <SafeAreaView className="flex-1">
      <StatusBar style={isDarkMode ? "light" : "dark"} />
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        contentContainerStyle={{ width: SCREEN_WIDTH * totalPages }}
      >
        {introPages.map(renderPage)}
      </ScrollView>

      <View className="absolute bottom-0 left-0 right-0 flex-row justify-between items-center px-6 py-8">
        <TouchableOpacity
          onPress={prevPage}
          disabled={currentPage === 0}
          className={`p-3 rounded-full ${
            currentPage === 0 ? "opacity-50" : ""
          } ${isDarkMode ? "bg-gray-800" : "bg-white"}`}
        >
          <Ionicons
            name="chevron-back"
            size={28}
            color={isDarkMode ? "white" : introPages[currentPage].colors[0]}
          />
        </TouchableOpacity>

        <View className="flex-row space-x-3">
          {[...Array(totalPages)].map((_, index) => (
            <View
              key={index}
              className={`w-3 h-3 rounded-full ${
                index === currentPage
                  ? isDarkMode
                    ? "bg-white"
                    : "bg-gray-900"
                  : isDarkMode
                  ? "bg-gray-600"
                  : "bg-gray-300"
              }`}
            />
          ))}
        </View>

        <TouchableOpacity
          onPress={nextPage}
          className={`p-3 rounded-full ${
            isDarkMode ? "bg-gray-800" : "bg-white"
          }`}
        >
          {currentPage === totalPages - 1 ? (
            <Text
              className={`font-bold text-xl px-4 py-2 ${
                isDarkMode ? "text-white" : "text-gray-900"
              }`}
            >
              Bắt đầu
            </Text>
          ) : (
            <Ionicons
              name="chevron-forward"
              size={28}
              color={isDarkMode ? "white" : introPages[currentPage].colors[0]}
            />
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default IntroScreen;
