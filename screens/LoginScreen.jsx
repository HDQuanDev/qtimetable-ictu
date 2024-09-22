import React, { useState, useEffect } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Animated,
  useColorScheme,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import Toast from "react-native-toast-message";
import { useAuth } from "../AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api_ictu } from "../services/api";
import { Ionicons } from "@expo/vector-icons";
import { sendImmediateNotification } from "../components/LocalNotification";
import ModalComponent from "../components/ModalComponent";
import { LinearGradient } from "expo-linear-gradient";

// Chủ đề màu sắc
const theme = {
  light: {
    background: ["#f8fafc", "#f1f5f9", "#e2e8f0"],
    text: "text-gray-800",
    inputBg: "bg-gray-200",
    inputText: "text-gray-800",
    buttonBg: "bg-blue-500",
    buttonText: "text-white",
  },
  dark: {
    background: ["#1a202c", "#2d3748", "#4a5568"],
    text: "text-gray-200",
    inputBg: "bg-gray-700",
    inputText: "text-gray-200",
    buttonBg: "bg-blue-600",
    buttonText: "text-white",
  },
};

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const { login } = useAuth();
  const fadeAnim = new Animated.Value(0);
  const colorScheme = useColorScheme();

  const currentTheme = theme[colorScheme] || theme.light;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, []);

  // Hàm xử lý đăng nhập
  const handleLogin = async () => {
    if (email && password) {
      setIsSubmitting(true);
      try {
        const data = await api_ictu(email, password);
        await AsyncStorage.setItem("username", email);
        await AsyncStorage.setItem("password", password);
        await login();
        Toast.show({
          type: "success",
          text1: "Đăng nhập thành công",
          visibilityTime: 3000,
        });
      } catch (error) {
        Toast.show({
          type: "error",
          text1: "Lỗi hệ thống",
          text2: error.message,
          visibilityTime: 3000,
        });
      } finally {
        setIsSubmitting(false);
      }
    } else {
      Toast.show({
        type: "error",
        text1: "Lỗi đăng nhập",
        text2: "Vui lòng nhập tên đăng nhập và mật khẩu",
      });
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1"
    >
      <LinearGradient colors={currentTheme.background} className="flex-1">
        <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />

        <Animated.View
          className="flex-1 justify-center items-center p-5"
          style={{ opacity: fadeAnim }}
        >
          {/* Logo */}
          <View className="mb-10">
            <Image
              source={require("../assets/adaptive-icon.png")}
              className="w-40 h-40 rounded-sm shadow-lg"
            />
          </View>

          {/* Form */}
          <View
            className={`w-full bg-opacity-20 rounded-3xl p-6 shadow-lg ${
              colorScheme === "dark" ? "bg-gray-800" : "bg-gray-300"
            }`}
          >
            <View
              className={`flex-row items-center mb-5 ${currentTheme.inputBg} rounded-full px-4 shadow`}
            >
              <Ionicons
                name="person-outline"
                size={24}
                color={colorScheme === "dark" ? "#e2e8f0" : "#4a5568"}
                className="mr-2"
              />
              <TextInput
                className={`flex-1 py-4 ${currentTheme.inputText} text-base`}
                placeholder="Tên đăng nhập"
                placeholderTextColor={
                  colorScheme === "dark" ? "#a0aec0" : "#718096"
                }
                onChangeText={setEmail}
                value={email}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            <View
              className={`flex-row items-center mb-5 ${currentTheme.inputBg} rounded-full px-4 shadow`}
            >
              <Ionicons
                name="lock-closed-outline"
                size={24}
                color={colorScheme === "dark" ? "#e2e8f0" : "#4a5568"}
                className="mr-2"
              />
              <TextInput
                className={`flex-1 py-4 ${currentTheme.inputText} text-base`}
                placeholder="Mật khẩu"
                placeholderTextColor={
                  colorScheme === "dark" ? "#a0aec0" : "#718096"
                }
                onChangeText={setPassword}
                value={password}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                className="p-2"
              >
                <Ionicons
                  name={showPassword ? "eye-outline" : "eye-off-outline"}
                  size={24}
                  color={colorScheme === "dark" ? "#e2e8f0" : "#4a5568"}
                />
              </TouchableOpacity>
            </View>

            <Text className={`text-center mb-5 ${currentTheme.text} italic`}>
              <Text className="text-red-400">*</Text> Vui lòng sử dụng tài khoản
              trên Dangkytinchi để đăng nhập
            </Text>

            <TouchableOpacity
              className={`w-full py-4 rounded-full items-center ${
                isSubmitting ? "opacity-70" : ""
              } mb-4 shadow ${currentTheme.buttonBg}`}
              onPress={handleLogin}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text
                  className={`font-bold text-lg ${currentTheme.buttonText}`}
                >
                  ĐĂNG NHẬP
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              className={`w-full py-4 rounded-full items-center shadow ${currentTheme.buttonBg}`}
              onPress={() => setModalVisible(true)}
            >
              <Text className={`font-bold text-lg ${currentTheme.buttonText}`}>
                Test Thông Báo
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        <ModalComponent
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          title="Kiểm tra thông báo"
          content={`Để đảm bảo bạn có thể nhận được thông báo từ ứng dụng, và ứng dụng có thể gửi thông báo quan trọng đến bạn ví dụ như thông báo lịch học, thông báo lịch thi, thông báo cập nhật ứng dụng,... bạn cần cấp quyền thông báo cho ứng dụng.\nNếu bạn đã cấp quyền thông báo cho ứng dụng, bạn có thể nhấn vào nút \"Gửi\" để kiểm tra thông báo ngay lập tức.`}
          closeText="Đóng"
          closeColor={colorScheme === "dark" ? "bg-gray-600" : "bg-gray-400"}
          actionText="Gửi"
          actionColor={currentTheme.buttonBg}
          onActionPress={() =>
            sendImmediateNotification(
              "Phát triển bởi Hứa Đức Quân",
              "Ứng dụng của bạn đã được cấp quyền thông báo và có thể nhận được thông báo từ ứng dụng."
            )
          }
        />
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}
