import React, { createContext, useState, useEffect, useContext } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { cancelAllClassNotifications } from "./components/LocalNotification";
import { Alert } from "react-native";
import { logError } from "./components/SaveLogs";

const AuthContext = createContext(); // Khởi tạo Context

// Provider cho Context
export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    checkLoginStatus();
  }, []);

  // Hàm kiểm tra trạng thái đăng nhập
  const checkLoginStatus = async () => {
    try {
      const value = await AsyncStorage.getItem("isLoggedIn");
      if (value === "true") {
        setIsLoggedIn(true);
      }
    } catch (error) {
      Alert.alert(
        "Lỗi",
        "Không thể kiểm tra trạng thái đăng nhập: " + error.message
      );
      await logError("Lỗi khi kiểm tra trạng thái đăng nhập:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Hàm đăng nhập
  const login = async () => {
    try {
      await AsyncStorage.setItem("isLoggedIn", "true");
      setIsLoggedIn(true);
      await logError("Đăng nhập thành công");
    } catch (error) {
      Alert.alert("Lỗi", "Không thể đăng nhập: " + error.message);
      await logError("Lỗi khi đăng nhập:", error);
    }
  };

  // Hàm đăng xuất
  const logout = async () => {
    try {
      await AsyncStorage.removeItem("isLoggedIn");
      await AsyncStorage.removeItem("lastUpdate");
      await AsyncStorage.removeItem("lastRunDate");
      await AsyncStorage.removeItem("username");
      await AsyncStorage.removeItem("password");
      await AsyncStorage.removeItem("taskLock");
      await AsyncStorage.removeItem("userData_ThoiKhoaBieu");
      await AsyncStorage.removeItem("userData_LichThi");
      await AsyncStorage.removeItem("userInfo");
      await AsyncStorage.removeItem("userData_Diem");
      await AsyncStorage.removeItem("userData_DiemDetail");
      await cancelAllClassNotifications();
      setIsLoggedIn(false);
    } catch (error) {
      Alert.alert("Lỗi", "Không thể đăng xuất: " + error.message);
      await logError("Lỗi khi đăng xuất:", error);
    }
  };
  return (
    <AuthContext.Provider value={{ isLoggedIn, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
