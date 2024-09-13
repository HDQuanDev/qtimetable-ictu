import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { cancelAllClassNotifications } from './components/LocalNotification';
import { Alert } from 'react-native';

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
      const value = await AsyncStorage.getItem('isLoggedIn');
      if (value === 'true') {
        setIsLoggedIn(true);
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể kiểm tra trạng thái đăng nhập: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Hàm đăng nhập
  const login = async () => {
    try {
      await AsyncStorage.setItem('isLoggedIn', 'true');
      setIsLoggedIn(true);
    } catch (error) {
      console.error('Error logging in:', error);
    }
  };

  // Hàm đăng xuất
  const logout = async () => {
    try {
      await AsyncStorage.clear();
      await cancelAllClassNotifications();
      setIsLoggedIn(false);
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể đăng xuất: ' + error.message);
    }
  };
  return (
    <AuthContext.Provider value={{ isLoggedIn, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);