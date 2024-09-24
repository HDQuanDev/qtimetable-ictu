import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  Alert,
} from "react";
import { Appearance } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { logError } from "./SaveLogs";

const ThemeContext = createContext(); // Khởi tạo Context

// Provider cho Context
export const ThemeProvider = ({ children }) => {
  const systemColorScheme = Appearance.getColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(systemColorScheme === "dark");
  const [themePreference, setThemePreference] = useState("system");

  // Hàm tải cài đặt chủ đề
  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem("themePreference");
      if (savedTheme) {
        setThemePreference(savedTheme);
        updateColorScheme(savedTheme);
      }
    } catch (error) {
      logError("Lỗi khi tải cài đặt chủ đề:", error);
      Alert.alert("Lỗi khi tải cài đặt chủ đề:", error.message);
    }
  };

  // Hàm cập nhật chủ đề màu
  const updateColorScheme = (theme) => {
    if (theme === "dark") {
      setIsDarkMode(true);
    } else if (theme === "light") {
      setIsDarkMode(false);
    } else {
      setIsDarkMode(systemColorScheme === "dark");
    }
  };

  // Hàm xử lý thay đổi chủ đề
  const handleThemeChange = async (theme) => {
    await AsyncStorage.setItem("themePreference", theme);
    setThemePreference(theme);
    updateColorScheme(theme);
  };

  useEffect(() => {
    loadThemePreference();
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      if (themePreference === "system") {
        setIsDarkMode(colorScheme === "dark");
      }
    });
    return () => subscription.remove();
  }, [themePreference]);

  return (
    <ThemeContext.Provider
      value={{ isDarkMode, themePreference, handleThemeChange }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
