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
  Clipboard,
  TextInput,
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
import Constants from "expo-constants";
import { getLogs, clearLogs } from "../components/SaveLogs";

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
  const [isUserKeyModalVisible, setUserKeyModalVisible] = useState(false);
  const [modalProps, setModalProps] = useState(null);
  const { isDarkMode, handleThemeChange } = useTheme();
  const [user, setUser] = useState(null);
  const { logout } = useAuth();
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [logs, setLogs] = useState([]);
  const [showModalLogs, setShowModalLogs] = useState(false);
  const [dataAsync, setDataAsync] = useState(null);
  const [showModalData, setShowModalData] = useState(false);
  const [showModalClearLogs, setShowModalClearLogs] = useState(false);
  const [userKey, setUserKey] = useState(null);
  const [showP2PModal, setShowP2PModal] = useState(false);
  const [newP2PKey, setNewP2PKey] = useState("");

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
    const fetchKey = async () => {
      const key = await AsyncStorage.getItem("user_encryption_key");
      if (key) {
        setUserKey(key);
      }
    };
    fetchKey();
  }, []);

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

  const handleUpdateP2PKey = async () => {
    if (newP2PKey.trim() === "") {
      Alert.alert("Lỗi", "Vui lòng nhập mã P2P mới.");
      return;
    }
    try {
      await AsyncStorage.setItem("user_encryption_key", newP2PKey.trim());
      setUserKey(newP2PKey.trim());
      Alert.alert("Thành công", "Mã P2P đã được cập nhật.");
      setShowP2PModal(false);
      setNewP2PKey("");
    } catch (error) {
      console.error("Error updating P2P key:", error);
      Alert.alert("Lỗi", "Không thể cập nhật mã P2P. Vui lòng thử lại sau.");
    }
  };

  const SettingsCard = ({ title, icon, children }) => {
    return (
      <View
        className={`mb-4 rounded-3xl shadow-md ${
          isDarkMode ? "bg-gray-800" : "bg-white"
        } ${
          isDarkMode ? "border-2 border-gray-700" : "border-2 border-gray-300"
        }`}
      >
        <View
          className={`flex-row items-center p-4 rounded-t-3xl ${
            isDarkMode ? "bg-gray-700" : "bg-gray-200"
          }`}
        >
          <Text
            className={`text-lg font-bold ${
              isDarkMode ? "text-white" : "text-gray-800"
            } flex-1 text-center`}
          >
            {title}
          </Text>
        </View>
        <View className="p-4">{children}</View>
      </View>
    );
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
                <View className="flex-1 p-4 space-y-2">
                  {/* Theme Toggle */}
                  <View className="mb-4" />
                  <SettingsCard title="Cài đặt chung">
                    <MenuButton
                      title="Trang chủ"
                      icon="home-outline"
                      color="bg-green-700"
                      isDarkMode={isDarkMode}
                      onPress={() => handleMenuOption("home")}
                      className="items-center p-4 rounded-3xl"
                    />
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
                      title="Xem Dữ Liệu Storage"
                      icon="cloud-outline"
                      color="bg-yellow-600"
                      isDarkMode={isDarkMode}
                      onPress={async () => {
                        try {
                          const keys = await AsyncStorage.getAllKeys();
                          const filteredKeys = keys.filter(
                            (key) =>
                              key !== "AppLogs" &&
                              key !== "user_encryption_key" &&
                              key !== "expoPushToken"
                          );
                          const stores = await AsyncStorage.multiGet(
                            filteredKeys
                          );
                          const data = stores.map((store) => ({
                            key: store[0],
                            value:
                              store[0] === "password" ? "*********" : store[1],
                          }));
                          setDataAsync(data);
                          setShowModalData(true);
                        } catch (error) {
                          console.error(
                            "Error fetching data from AsyncStorage:",
                            error
                          );
                        }
                      }}
                      className="w-full flex-row items-center p-4 rounded-xl"
                    />
                    <MenuButton
                      title="Mã P2P Người Dùng"
                      icon="key-outline"
                      color="bg-purple-800"
                      isDarkMode={isDarkMode}
                      onPress={() => setUserKeyModalVisible(true)}
                      className="w-full flex-row items-center p-4 rounded-xl"
                    />
                    <MenuButton
                      title="Cập nhật Mã P2P"
                      icon="key-outline"
                      color="bg-indigo-700"
                      isDarkMode={isDarkMode}
                      onPress={() => setShowP2PModal(true)}
                      className="w-full flex-row items-center p-4 rounded-xl"
                    />
                    <MenuButton
                      title="Nhật ký Console Log"
                      icon="bug-outline"
                      color="bg-red-700"
                      isDarkMode={isDarkMode}
                      onPress={async () => {
                        const logs = await getLogs();
                        setLogs(JSON.parse(logs) || []);
                        setShowModalLogs(true);
                      }}
                      className="w-full flex-row items-center p-4 rounded-xl"
                    />
                    <MenuButton
                      title="Xóa Nhật Ký Console Log"
                      icon="trash-outline"
                      color="bg-red-700"
                      isDarkMode={isDarkMode}
                      onPress={() => setShowModalClearLogs(true)}
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
                  </SettingsCard>
                  <SettingsCard title="Thông Tin Ứng Dụng">
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
                  </SettingsCard>
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
                    Phiên bản{" "}
                    <Text className="font-semibold">
                      {Constants.expoConfig.version}
                    </Text>
                  </Text>
                  <Text
                    className={`${
                      isDarkMode ? "text-gray-300" : "text-gray-600"
                    } text-sm ml-2`}
                  >
                    Build ID: <Text className="font-semibold">2024.12.30</Text>
                  </Text>
                  <Text
                    className={`${
                      isDarkMode ? "text-gray-300" : "text-gray-600"
                    } text-sm ml-2`}
                  >
                    © {new Date().getFullYear()} Made with ❤️ by Hứa Đức Quân
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
                    thiết bị của bạn và không được chia sẻ ra bên ngoài, ngoại
                    trừ Dữ Liệu Ghi Chú được mã hoá bằng mã P2P của bạn và lưu
                    trữ tại máy chủ FireStore của tôi kèm theo thông tin mã
                    Token Push Notification và tên thiết bị của bạn.
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
              visible={isUserKeyModalVisible}
              onClose={() => setUserKeyModalVisible(false)}
              title="Mã P2P Người Dùng"
              content={`Mã khóa người dùng của bạn là:\n ${userKey}`}
              closeText="Đóng"
              closeColor="bg-purple-800"
              actionText={"Sao chép"}
              actionColor="bg-blue-700"
              onActionPress={async () => {
                await Clipboard.setString(userKey);
                setUserKeyModalVisible(false);
                Alert.alert("Thông báo", "Đã sao chép mã khóa người dùng!");
              }}
            />
            <ModalComponent
              visible={showP2PModal}
              onClose={() => {
                setShowP2PModal(false);
                setNewP2PKey("");
              }}
              title="Cập nhật Mã P2P"
              content={
                <View>
                  <Text
                    className={`${
                      isDarkMode ? "text-white" : "text-black"
                    } mb-2`}
                  >
                    Nhập mã P2P mới:
                  </Text>
                  <TextInput
                    value={newP2PKey}
                    onChangeText={setNewP2PKey}
                    placeholder="Nhập mã P2P mới"
                    className={`border p-2 rounded ${
                      isDarkMode
                        ? "border-gray-600 text-white"
                        : "border-gray-300 text-black"
                    }`}
                  />
                </View>
              }
              closeText="Hủy"
              closeColor="bg-gray-500"
              actionText="Cập nhật"
              actionColor="bg-indigo-700"
              onActionPress={handleUpdateP2PKey}
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
              content={`** PHIÊN BẢN 2.7.STABLE **\n\n- Cập Nhật: URL Api ứng dụng\n\n** PHIÊN BẢN 2.6.STABLE **\n\n- Sửa Lỗi: Hệ thống lưu trữ FireStorage không hoạt động.\n- Sửa lỗi: Tác vụ chạy nền không hoạt động đúng cách trong 1 số trường hợp.\n- Sửa lỗi: Dữ liệu không tự cập nhật lại khi có thay đổi.\n- Sửa lỗi: Một số lỗi khác đã biết trước đó.\n\n** PHIÊN BẢN 2.5.STABLE **\n\n- Thêm: Giao diện AddNoteScreen.\n- Thêm: Hỗ trợ lưu trữ ghi chú mã hoá P2P.\n- Thêm: Giao diện IntroScreen\n- Thêm: Giao diện LoadingSpinner\n- Cập Nhật: Thêm các mục cài đặt mới, và sửa lại văn bản một số mục cài đặt\n- Cập Nhật: Nút sao chép trong một số mục trong Cài đặt\n- Tối Ưu: Hệ thống lưu trữ nhật ký Console Log\n- Sửa Lỗi: Giao diện người dùng, và một số lỗi đã biết\n\n© ${new Date().getFullYear()} Made with ❤️ by Hứa Đức Quân`}
              closeText={"Đóng"}
              closeColor={"bg-teal-700"}
            />

            {showModalData && (
              <ModalComponent
                visible={true}
                onClose={() => setShowModalData(false)}
                title="Dữ Liệu Storage"
                content={`${JSON.stringify(dataAsync, null, 2)}`}
                closeText="Đóng"
                closeColor="bg-yellow-600"
                actionText={"Sao chép"}
                actionColor="bg-blue-700"
                onActionPress={async () => {
                  const dataString = dataAsync
                    .map(
                      (data) =>
                        `${data.key}: ${
                          typeof data.value === "object"
                            ? JSON.stringify(data.value)
                            : data.value
                        }`
                    )
                    .join("\n");
                  await Clipboard.setString(dataString);
                  setShowModalData(false);
                  Alert.alert("Thông báo", "Đã sao chép dữ liệu!");
                }}
              />
            )}
            {showModalClearLogs && (
              <ModalComponent
                visible={true}
                onClose={() => setShowModalClearLogs(false)}
                title="Xóa Nhật Ký Console Log"
                content="Bạn có chắc chắn muốn xóa toàn bộ nhật ký Console Log không? Hành động này không thể hoàn tác!"
                closeText="Hủy"
                closeColor="bg-gray-700"
                actionText="Xóa"
                actionColor="bg-red-700"
                onActionPress={async () => {
                  await clearLogs();
                  setShowModalClearLogs(false);
                }}
              />
            )}
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
            {showModalLogs &&
              (logs.length > 0 ? (
                <ModalComponent
                  visible={true}
                  onClose={() => {
                    setLogs([]);
                    setShowModalLogs(false);
                  }}
                  title="Nhật ký Console Log"
                  content={`${JSON.stringify(logs, null, 2)}`}
                  closeText="Đóng"
                  closeColor="bg-red-700"
                  actionText={"Sao chép"}
                  actionColor="bg-blue-700"
                  onActionPress={async () => {
                    const logsString = logs
                      .map((log) =>
                        typeof log === "object" ? JSON.stringify(log) : log
                      )
                      .join("\n");
                    await Clipboard.setString(logsString);
                    setShowModalLogs(false);
                    Alert.alert("Thông báo", "Đã sao chép nhật ký!");
                  }}
                />
              ) : (
                <ModalComponent
                  visible={true}
                  onClose={() => {
                    setLogs([]);
                    setShowModalLogs(false);
                  }}
                  title="Thông báo"
                  content="Không có nhật ký lỗi nào"
                  closeText="Đóng"
                  closeColor="bg-blue-700"
                />
              ))}
          </View>
        </LinearGradient>
      </GestureHandlerRootView>
    </>
  );
};

export default MenuScreen;
