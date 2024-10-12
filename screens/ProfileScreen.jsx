import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import AsyncStorage from "@react-native-async-storage/async-storage";
import QRCode from "react-native-qrcode-svg";
import { useTheme } from "../components/ThemeProvider";
import { useFocusEffect } from "@react-navigation/native";

// Hàm hiển thị nút chức năng
const DataList = ({ title, icon, color, data, isDarkMode }) => (
  <TouchableOpacity
    className={`flex-row justify-between items-center px-4 py-3 rounded-xl mt-5 ${
      isDarkMode ? "bg-gray-500" : "bg-gray-300"
    } border-2 {isDarkMode ? 'border-gray-900' : 'border-gray-700'}`}
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
    <Text
      className={`${
        isDarkMode ? "text-white" : "text-gray-800"
      } font-medium text-base`}
    >
      {data}
    </Text>
  </TouchableOpacity>
);

const ProfileScreen = () => {
  const { isDarkMode } = useTheme();
  const [user, setUser] = useState(null);

  // Hàm lấy thông tin người dùng từ bộ nhớ cục bộ
  const fetchUserInfo = async () => {
    try {
      const userInfo = await AsyncStorage.getItem("userInfo");
      if (userInfo) {
        setUser(JSON.parse(userInfo));
      }
      const lastUpdate = await AsyncStorage.getItem("lastUpdate");
      if (lastUpdate) {
        setUser((prev) => ({ ...prev, updatedAt: lastUpdate }));
      }
    } catch (error) {
      console.error("Error fetching user info:", error);
    }
  };

  const fetchData = async () => {
    await fetchUserInfo();
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

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
              Trang Cá Nhân
            </Text>
            <TouchableOpacity
              className={`bg-opacity-20 p-2 rounded-full ${
                isDarkMode ? "bg-gray-700" : "bg-blue-100"
              } mb-4`}
            >
              <Ionicons
                name="person"
                size={24}
                color={isDarkMode ? "#93c5fd" : "#60a5fa"}
              />
            </TouchableOpacity>
          </LinearGradient>
          {/* Scrollable Content */}
          <View className="flex-1 px-2 pb-2">
            {/* User Profile */}
            <View className="space-y-3">
              <ScrollView className="flex-grow">
                <View className="items-center p-4">
                  {/* Replace with your actual user profile image */}
                  <View
                    className={`${
                      isDarkMode
                        ? "border-2 border-sky-500"
                        : "border-2 border-sky-300"
                    }`}
                  >
                    <QRCode
                      value={user?.masinhvien || "Không xác định"}
                      size={250}
                      color={isDarkMode ? "white" : "black"}
                      backgroundColor={isDarkMode ? "black" : "white"}
                      enableLinearGradient={true}
                    />
                  </View>
                  <View>
                    <Text
                      className={`${
                        isDarkMode ? "text-gray-400" : "text-gray-600"
                      } mt-4`}
                    >
                      {user?.masinhvien || "Không xác định"}
                    </Text>
                  </View>
                </View>
                {/* Preferences */}
                <View className="space-y-1">
                  <DataList
                    title="Họ và tên:"
                    icon="person-outline"
                    color="bg-blue-700"
                    data={user?.name || "Không xác định"}
                    isDarkMode={isDarkMode}
                  />
                  <DataList
                    title="Mã sinh viên:"
                    icon="school-outline"
                    color="bg-yellow-700"
                    data={user?.masinhvien || "Không xác định"}
                    isDarkMode={isDarkMode}
                  />
                  <DataList
                    title="Ngành học:"
                    icon="school-outline"
                    color="bg-cyan-700"
                    data={user?.nganh || "Không xác định"}
                    isDarkMode={isDarkMode}
                  />

                  <DataList
                    title="Khoá học:"
                    icon="calendar-outline"
                    color="bg-green-700"
                    data={user?.khoa || "Không xác định"}
                    isDarkMode={isDarkMode}
                  />

                  <DataList
                    title="Cập nhật dữ liệu lần cuối:"
                    icon="cloud-upload-outline"
                    color="bg-red-700"
                    data={user?.updatedAt || "Không xác định"}
                    isDarkMode={isDarkMode}
                  />
                </View>
              </ScrollView>
            </View>
          </View>
        </LinearGradient>
      </GestureHandlerRootView>
    </>
  );
};

export default ProfileScreen;
