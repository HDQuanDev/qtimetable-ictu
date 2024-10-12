import React, { createContext, useState, useEffect, useContext } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { cancelAllClassNotifications } from "./components/LocalNotification";
import { Alert } from "react-native";
import { logError } from "./components/SaveLogs";
import { unregisterBackgroundTask } from "./components/backgroundTasks";

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
      const keysToKeep = [
        "@battery_optimization_checked",
        "@intro_completed",
        "AppLogs",
        "expoPushToken",
        "user_encryption_key",
        "firstTime_v2.5.stable",
      ];

      const allKeys = await AsyncStorage.getAllKeys();
      const keysToRemove = allKeys.filter((key) => !keysToKeep.includes(key));

      await AsyncStorage.multiRemove(keysToRemove);
      await cancelAllClassNotifications();
      await unregisterBackgroundTask();
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
