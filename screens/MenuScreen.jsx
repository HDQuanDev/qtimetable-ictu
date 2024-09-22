import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Linking,
  Alert,
  StatusBar,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import ModalComponent from "../components/ModalComponent";
import { checkForUpdate } from "../components/CheckUpdate";
import NetInfo from "@react-native-community/netinfo";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "../AuthContext";
import { useTheme } from "../components/ThemeProvider";

// Hàm hiển thị nút chức năng
const MenuButton = ({ title, icon, color, onPress, isDarkMode }) => (
  <TouchableOpacity
    className={`flex-row items-center px-4 py-3 rounded-3xl mt-5 ${
      isDarkMode ? "bg-gray-800" : "bg-white"
    } ${isDarkMode ? "border-2 border-gray-700" : "border-2 border-gray-300"}`}
    onPress={onPress}
  >
    <View
      className={`w-8 h-8 rounded-full items-center justify-center mr-4 ${color}`}
    >
      <Ionicons name={icon} size={24} color="white" />
    </View>
    <Text
      className={`${
        isDarkMode ? "text-white" : "text-gray-800"
      } font-medium text-base flex-1`}
    >
      {title}
    </Text>
  </TouchableOpacity>
);

const MenuScreen = () => {
  const [isAboutModalVisible, setAboutModalVisible] = useState(false);
  const [isChangelogModalVisible, setChangelogModalVisible] = useState(false);
  const [modalProps, setModalProps] = useState(null);
  const { isDarkMode, handleThemeChange } = useTheme();
  const [user, setUser] = useState(null);
  const { logout } = useAuth();
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);

  // Fetch user info from AsyncStorage
  const fetchUserInfo = async () => {
    try {
      const userInfo = await AsyncStorage.getItem("userInfo");
      if (userInfo) {
        setUser(JSON.parse(userInfo));
      }
    } catch (error) {
      Alert.alert("Lỗi", "Không thể tải thông tin người dùng...");
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      await fetchUserInfo();
    };
    fetchData();
  }, []);

  // Hàm xử lý chọn chức năng
  const handleMenuOption = async (option) => {
    switch (option) {
      case "source":
        Linking.openURL("https://github.com/HDQuanDev/qtimetable-ictu");
        break;
      case "contact":
        Linking.openURL("https://facebook.com/quancp72h");
        break;
      case "aichat":
        Linking.openURL("https://ai.quanhd.net/");
        break;
      case "update":
        const state = await NetInfo.fetch();
        if (state.isConnected && state.isInternetReachable) {
          const updateInfo = await checkForUpdate("all");
          setModalProps(updateInfo);
        } else {
          Alert.alert(
            "Lỗi",
            "Vui lòng kiểm tra kết nối mạng của bạn và thử lại..."
          );
        }
        break;
      case "home":
        Linking.openURL("https://tkb.quanhd.net/");
        break;
      default:
        break;
    }
  };

  // Hiển thị giao diện
  return (
    <>
      <GestureHandlerRootView className="flex-1">
        <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
        <LinearGradient
          colors={
            isDarkMode
              ? ["#0f172a", "#1e293b", "#334155"]
              : ["#f8fafc", "#f1f5f9", "#e2e8f0"]
          }
          className="flex-1"
        >
          {/* Fixed Header */}
          <LinearGradient
            colors={
              isDarkMode
                ? ["#1e293b", "#334155", "#475569"]
                : ["#ebf8ff", "#dbeafe", "#bfdbfe"]
            }
            className={`px-4 pt-12 flex-row justify-between items-center mb-6 ${
              isDarkMode ? "dark:bg-[#1f2937]" : "bg-[#f0f9ff]"
            } rounded-b-3xl`}
          >
            <Text
              className={`text-3xl font-bold ${
                isDarkMode ? "text-blue-400" : "text-blue-500"
              } text-center mb-4`}
            >
              Cài Đặt
            </Text>
            <TouchableOpacity
              className={`bg-opacity-20 p-2 rounded-full ${
                isDarkMode ? "bg-gray-700" : "bg-blue-100"
              } mb-4`}
            >
              <Ionicons
                name="settings"
                size={24}
                color={isDarkMode ? "#93c5fd" : "#60a5fa"}
              />
            </TouchableOpacity>
          </LinearGradient>
          <View className="flex-1 px-4 pb-2">
            {/* Scrollable Content */}

            {/* User Profile */}
            <View className="space-y-3">
              <ScrollView className="flex-grow">
                <View className="flex-row items-center p-4">
                  {/* Replace with your actual user profile image */}
                  <Image
                    source={require("../assets/adaptive-icon.png")}
                    className="w-16 h-16 rounded-sm shadow-lg mr-4"
                  />
                  <View>
                    <Text
                      className={`text-xl font-bold ${
                        isDarkMode ? "text-white" : "text-gray-800"
                      }`}
                    >
                      {user?.name || "Không xác định"}
                    </Text>
                    <Text className={`text-gray-600 dark:text-gray-400 mt-1`}>
                      {user?.masinhvien || "Không xác định"}
                    </Text>
                  </View>
                </View>
                {/* Preferences */}
                <View className="space-y-1">
                  <MenuButton
                    title="Trang chủ"
                    icon="home-outline"
                    color="bg-green-700"
                    isDarkMode={isDarkMode}
                    onPress={() => handleMenuOption("home")}
                    className="w-full flex-row items-center p-4 rounded-3xl"
                  />
                  {/* Theme Toggle */}
                  <View className="mb-4" />
                  <TouchableOpacity
                    className={`flex-row items-center px-4 py-3 rounded-3xl ${
                      isDarkMode ? "bg-gray-800" : "bg-white"
                    } ${
                      isDarkMode
                        ? "border-2 border-gray-700"
                        : "border-2 border-gray-300"
                    }`}
                    onPress={() =>
                      handleThemeChange(isDarkMode ? "light" : "dark")
                    }
                  >
                    <View
                      className={`w-8 h-8 rounded-full items-center justify-center mr-4 ${
                        isDarkMode ? "bg-gray-700" : "bg-gray-300"
                      }`}
                    >
                      <Ionicons
                        name="color-palette-outline"
                        size={24}
                        color={isDarkMode ? "white" : "black"}
                      />
                    </View>
                    <Text
                      className={`${
                        isDarkMode ? "text-white" : "text-gray-800"
                      } font-medium text-base flex-1`}
                    >
                      Chế độ hiển thị
                    </Text>
                    <TouchableOpacity
                      onPress={() =>
                        handleThemeChange(isDarkMode ? "light" : "dark")
                      } // Sử dụng hàm chuyển đổi giao diện
                    >
                      <View className="flex-row items-center">
                        <Text
                          className={`text-base font-medium ${
                            isDarkMode ? "text-white" : "text-black"
                          } mr-2`}
                        >
                          {isDarkMode ? "Tối" : "Sáng"}
                        </Text>
                        <Ionicons
                          name={isDarkMode ? "moon-outline" : "sunny-outline"}
                          size={24}
                          color={isDarkMode ? "white" : "black"}
                        />
                      </View>
                    </TouchableOpacity>
                  </TouchableOpacity>
                  <MenuButton
                    title="Thông tin ứng dụng"
                    icon="information-circle-outline"
                    color="bg-purple-800"
                    isDarkMode={isDarkMode}
                    onPress={() => setAboutModalVisible(true)}
                    className="w-full flex-row items-center p-4 rounded-3xl"
                  />
                  <MenuButton
                    title="Nhật ký thay đổi"
                    icon="git-branch-outline"
                    color="bg-teal-700"
                    isDarkMode={isDarkMode}
                    onPress={() => setChangelogModalVisible(true)}
                    className="w-full flex-row items-center p-4 rounded-xl"
                  />
                  <MenuButton
                    title="Mã nguồn"
                    icon="code-slash-outline"
                    color="bg-blue-700"
                    isDarkMode={isDarkMode}
                    onPress={() => handleMenuOption("source")}
                    className="w-full flex-row items-center p-4 rounded-xl"
                  />
                  <MenuButton
                    title="Liên hệ"
                    icon="mail-outline"
                    color="bg-red-700"
                    isDarkMode={isDarkMode}
                    onPress={() => handleMenuOption("contact")}
                    className="w-full flex-row items-center p-4 rounded-xl"
                  />
                  <MenuButton
                    title="Trò Chuyện Với QAI"
                    icon="chatbubble-ellipses-outline"
                    color="bg-cyan-700"
                    isDarkMode={isDarkMode}
                    onPress={() => handleMenuOption("aichat")}
                    className="w-full flex-row items-center p-4 rounded-xl"
                  />
                  <MenuButton
                    title="Kiểm tra cập nhật"
                    icon="cloud-download-outline"
                    color="bg-yellow-600"
                    isDarkMode={isDarkMode}
                    onPress={() => handleMenuOption("update")}
                    className="w-full flex-row items-center p-4 rounded-xl"
                  />
                  {/* Logout Button hr */}
                  <View className="mb-4" />
                  <TouchableOpacity
                    className={`flex-row items-center px-4 py-3 rounded-3xl ${
                      isDarkMode ? "bg-red-300" : "bg-red-100"
                    } border-2 border-red-700`}
                    onPress={() => setLogoutModalVisible(true)}
                  >
                    <View
                      className={`w-8 h-8 rounded-full items-center justify-center mr-4 bg-red-700`}
                    >
                      <Ionicons
                        name="log-out-outline"
                        size={24}
                        color="white"
                      />
                    </View>
                    <Text className="text-gray-800 dark:text-red-500 font-medium text-base flex-1">
                      Đăng xuất
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Info */}
                <View className="flex-row items-center justify-center mt-4 flex-wrap">
                  <Text
                    className={`${
                      isDarkMode ? "text-gray-300" : "text-gray-600"
                    } text-sm`}
                  >
                    Phiên bản <Text className="font-semibold">2.0.STABLE</Text>
                  </Text>
                  <Text
                    className={`${
                      isDarkMode ? "text-gray-300" : "text-gray-600"
                    } text-sm ml-2`}
                  >
                    Build ID: <Text className="font-semibold">2024.09.22</Text>
                  </Text>
                  <Text
                    className={`${
                      isDarkMode ? "text-gray-300" : "text-gray-600"
                    } text-sm ml-2`}
                  >
                    © 2024 Made with ❤️ by Hứa Đức Quân
                  </Text>
                </View>
                {/* Warning */}
                <View className="flex-row items-center justify-center mt-4 flex-wrap">
                  <Text
                    className={`${
                      isDarkMode ? "text-red-300" : "text-red-600"
                    } text-sm`}
                  >
                    Lưu ý:{" "}
                  </Text>
                  <Text
                    className={`${
                      isDarkMode ? "text-gray-300" : "text-gray-600"
                    } text-sm ml-2`}
                  >
                    Ứng dụng này do Hứa Đức Quân phát triển và không liên quan
                    đến trường Đại học Công Nghệ Thông Tin & Truyền Thông Thái
                    Nguyên, mọi thông tin trong ứng dụng chỉ được lưu trữ tại
                    thiết bị của bạn và không được chia sẻ ra bên ngoài ngoại
                    trừ Token để thực hiện gửi thông báo từ server.
                  </Text>
                </View>
              </ScrollView>
            </View>

            {/* Modals */}
            <ModalComponent
              visible={logoutModalVisible}
              onClose={() => setLogoutModalVisible(false)}
              title="Đăng xuất"
              content="Bạn có chắc chắn muốn đăng xuất khỏi ứng dụng không?"
              closeText="Hủy"
              closeColor="bg-gray-700"
              actionText="Đăng xuất"
              actionColor="bg-red-700"
              onActionPress={async () => {
                await logout();
                setLogoutModalVisible(false);
              }}
            />

            <ModalComponent
              visible={isAboutModalVisible}
              onClose={() => setAboutModalVisible(false)}
              title="Thông tin ứng dụng"
              content={`Đây là ứng dụng dành cho Sinh viên trường Đại học Công Nghệ Thông Tin & Truyền Thông Thái Nguyên. Ứng dụng giúp bạn xem thời khóa biểu, lịch thi, tra cứu điểm, và nhiều tính năng khác...\n\nỨng dụng được phát triển bởi Hứa Đức Quân, sinh viên năm cuối ngành Công nghệ thông tin, trường Đại học Công Nghệ Thông Tin & Truyền Thông Thái Nguyên.\n\n© 2024 Made with ❤️ by Hứa Đức Quân`}
              closeText={"Đóng"}
              closeColor={"bg-purple-800"}
            />

            <ModalComponent
              visible={isChangelogModalVisible}
              onClose={() => setChangelogModalVisible(false)}
              title="Nhật ký thay đổi"
              content={`** PHIÊN BẢN 2.0.STABLE **\n\n- Thêm, giao diện Sáng và Tối\n- Thêm, cài đặt để chuyển giữa giao diện Sáng và Tối\n- Tối ưu hoá UI/UX\n- Chỉnh sửa, Tab Menu thành Cài đặt\n- Thêm, Tab Trang Cá Nhân mới\n- Chỉnh sửa, chức năng Đăng xuất được đặt vào trong Tab Cài đặt\n- Thêm, mã QR vào Tab Trang Cá Nhân\n- Thêm, thông báo những ngày không có lịch học\n- Chỉnh sửa, thông báo cập nhật dữ liệu cũ lên 3 ngày\n- Thêm, hiện thị lịch âm trong Thời khoá biểu\n- Thêm, Tab Thời gian biểu giúp xem thông tin giờ ra vào lớp của các tiết\n- Sửa lỗi, thông báo yêu cầu cập nhật dữ liệu xuất hiện khi chưa đăng nhập\n- Tối ưu hoá, hiệu suất và trải nghiệm người dùng\n\n © 2024 Made with ❤️ by Hứa Đức Quân`}
              closeText={"Đóng"}
              closeColor={"bg-teal-700"}
            />

            {modalProps && (
              <ModalComponent
                visible={modalProps.showModal}
                onClose={() => setModalProps(null)}
                title={modalProps.title}
                content={modalProps.content}
                closeText={modalProps.closeText}
                closeColor={modalProps.closeColor}
                actionText={modalProps.actionText}
                actionColor={modalProps.actionColor}
                onActionPress={modalProps.onActionPress}
              />
            )}
          </View>
        </LinearGradient>
      </GestureHandlerRootView>
    </>
  );
};

export default MenuScreen;
