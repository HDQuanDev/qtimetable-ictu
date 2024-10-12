import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Platform,
  Linking,
  useWindowDimensions,
  Alert,
  Clipboard,
} from "react-native";
import { useTheme } from "../components/ThemeProvider";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { getUserKey } from "../components/firestore";

const IntroScreen = ({ onIntroComplete }) => {
  const { isDarkMode } = useTheme();
  const [currentPage, setCurrentPage] = useState(0);
  const [notificationPermission, setNotificationPermission] = useState(false);
  const [batteryOptimizationChecked, setBatteryOptimizationChecked] =
    useState(false);
  const [userKey, setUserKey] = useState("");
  const [keyCopiedisCopied, setKeyCopiedisCopied] = useState(false);
  const navigation = useNavigation();
  const scrollViewRef = useRef(null);
  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = useWindowDimensions();
  const totalPages = 8;

  useEffect(() => {
    checkNotificationPermission();
    checkIntroCompleted();
    checkBatteryOptimization();
    fetchUserKey();
  }, []);

  const fetchUserKey = async () => {
    try {
      const key = await getUserKey();
      setUserKey(key);
    } catch (error) {
      console.error("Error fetching user key:", error);
    }
  };

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

  const copyToClipboard = () => {
    Clipboard.setString(userKey);
    setKeyCopiedisCopied(true);
    Alert.alert("Thành công", "Đã sao chép khoá P2P vào bộ nhớ tạm");
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
    {
      title: "Khoá P2P của bạn",
      content: "Đây là khoá P2P của bạn. Vui lòng sao chép và lưu trữ nó an toàn để khôi phục dữ liệu sau này.",
      icon: "key-outline",
      colors: isDarkMode ? ["#4C1D95", "#5B21B6"] : ["#8B5CF6", "#7C3AED"],
    },
  ];

  const renderPage = (page, index) => (
    <LinearGradient
      key={index}
      colors={page.colors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        flex: 1,
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
      }}
    >
      <View style={{ maxWidth: 400, width: "100%", alignItems: "center" }}>
        <View
          style={{
            backgroundColor: isDarkMode
              ? "rgba(31, 41, 55, 0.8)"
              : "rgba(255, 255, 255, 0.8)",
            borderRadius: 50,
            padding: 20,
            marginBottom: 30,
          }}
        >
          <Ionicons
            name={page.icon}
            size={60}
            color={isDarkMode ? "white" : "black"}
          />
        </View>
        <Text
          style={{
            fontSize: 28,
            fontWeight: "bold",
            marginBottom: 20,
            textAlign: "center",
            color: isDarkMode ? "white" : "black",
          }}
        >
          {page.title}
        </Text>
        <Text
          style={{
            fontSize: 16,
            textAlign: "center",
            marginBottom: 30,
            color: isDarkMode
              ? "rgba(255, 255, 255, 0.8)"
              : "rgba(0, 0, 0, 0.8)",
          }}
        >
          {page.content}
        </Text>
        {renderPageActions(page, index)}
      </View>
    </LinearGradient>
  );

  const renderPageActions = (page, index) => {
    if (page.permission !== undefined) {
      return (
        <TouchableOpacity
          onPress={page.requestPermission}
          style={{
            backgroundColor: isDarkMode ? "rgba(31, 41, 55, 0.8)" : "white",
            paddingHorizontal: 20,
            paddingVertical: 10,
            borderRadius: 25,
            opacity: page.permission ? 0.75 : 1,
          }}
          disabled={page.permission}
        >
          <Text
            style={{
              fontWeight: "bold",
              fontSize: 18,
              color: page.permission
                ? isDarkMode
                  ? "#34D399"
                  : "#059669"
                : isDarkMode
                ? "#60A5FA"
                : "#2563EB",
            }}
          >
            {page.permission ? "Đã cho phép" : "Cho phép"}
          </Text>
        </TouchableOpacity>
      );
    }

    if (page.action) {
      return (
        <TouchableOpacity
          onPress={page.action}
          style={{
            backgroundColor: isDarkMode ? "rgba(31, 41, 55, 0.8)" : "white",
            paddingHorizontal: 20,
            paddingVertical: 10,
            borderRadius: 25,
            opacity: batteryOptimizationChecked ? 0.75 : 1,
          }}
          disabled={batteryOptimizationChecked}
        >
          <Text
            style={{
              fontWeight: "bold",
              fontSize: 18,
              color: batteryOptimizationChecked
                ? isDarkMode
                  ? "#34D399"
                  : "#059669"
                : isDarkMode
                ? "#60A5FA"
                : "#2563EB",
            }}
          >
            {page.actionText}
          </Text>
        </TouchableOpacity>
      );
    }

    if (index === totalPages - 1) {
      return (
        <View style={{ alignItems: "center" }}>
          <Text
            style={{
              fontSize: 18,
              fontWeight: "bold",
              marginBottom: 10,
              color: isDarkMode ? "white" : "black",
            }}
          >
            Khoá P2P của bạn:
          </Text>
          <View
            style={{
              backgroundColor: isDarkMode
                ? "rgba(31, 41, 55, 0.8)"
                : "rgba(243, 244, 246, 0.8)",
              padding: 15,
              borderRadius: 10,
              marginBottom: 20,
            }}
          >
            <Text
              style={{
                fontSize: 16,
                textAlign: "center",
                color: isDarkMode
                  ? "rgba(255, 255, 255, 0.8)"
                  : "rgba(0, 0, 0, 0.8)",
              }}
              selectable={true}
            >
              {userKey || "Đang tải..."}
            </Text>
          </View>
          <TouchableOpacity
            onPress={copyToClipboard}
            style={{
              backgroundColor: isDarkMode ? "#4F46E5" : "#4338CA",
              paddingHorizontal: 20,
              paddingVertical: 10,
              borderRadius: 25,
              opacity: keyCopiedisCopied ? 0.75 : 1,
            }}
            disabled={keyCopiedisCopied}
          >
            <Text style={{ fontWeight: "bold", fontSize: 18, color: "white" }}>
              {keyCopiedisCopied ? "Đã sao chép" : "Sao chép khoá"}
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    return null;
  };

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
      if (batteryOptimizationChecked && keyCopiedisCopied) {
        completeIntro();
      } else if (!batteryOptimizationChecked) {
        Alert.alert(
          "Cài đặt chưa hoàn tất",
          "Vui lòng mở cài đặt ứng dụng và tắt tối ưu hóa pin trước khi tiếp tục."
        );
      } else if (!keyCopiedisCopied) {
        Alert.alert(
          "Chưa sao chép khoá P2P",
          "Vui lòng sao chép khoá P2P trước khi tiếp tục."
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

  const renderNavigationDots = () => (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {[...Array(totalPages)].map((_, index) => (
        <View
          key={index}
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            marginHorizontal: 4,
            backgroundColor:
              index === currentPage
                ? isDarkMode
                  ? "white"
                  : "black"
                : isDarkMode
                ? "rgba(156, 163, 175, 0.5)"
                : "rgba(107, 114, 128, 0.5)",
          }}
        />
      ))}
    </View>
  );

  const renderNavigationButtons = () => (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingBottom: 20,
      }}
    >
      <TouchableOpacity
        onPress={prevPage}
        disabled={currentPage === 0}
        style={{
          opacity: currentPage === 0 ? 0.5 : 1,
          padding: 10,
        }}
      >
        <Ionicons
          name="chevron-back"
          size={28}
          color={isDarkMode ? "white" : introPages[currentPage].colors[0]}
        />
      </TouchableOpacity>

      {renderNavigationDots()}

      <TouchableOpacity
        onPress={nextPage}
        style={{
          padding: 10,
        }}
      >
        {currentPage === totalPages - 1 ? (
          <Text
            style={{
              fontWeight: "bold",
              fontSize: 18,
              color: isDarkMode ? "white" : "black",
            }}
          >
            {keyCopiedisCopied ? "Hoàn tất" : "Sao chép"}
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
  );

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: isDarkMode ? "#111827" : "#F3F4F6" }}
    >
      <StatusBar style={isDarkMode ? "light" : "dark"} />
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}
        decelerationRate="fast"
        style={{ flex: 1 }}
        contentContainerStyle={{ width: SCREEN_WIDTH * totalPages }}
      >
        {introPages.map(renderPage)}
      </ScrollView>
      {renderNavigationButtons()}
    </SafeAreaView>
  );
};

export default IntroScreen;
