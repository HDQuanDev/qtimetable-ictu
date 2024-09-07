import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, Image, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Toast from 'react-native-toast-message';
import { useAuth } from '../AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api_login } from '../services/api';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false); // Trạng thái gửi dữ liệu
  const { login } = useAuth();

  const handleLogin = async () => {
    if (email && password) {
      setIsSubmitting(true); // Vô hiệu hóa nút và hiển thị thông báo chờ

      try {
        // Gửi yêu cầu đến API
          const data = await api_login(email, password);
          await AsyncStorage.setItem('userData', JSON.stringify(data));
          await AsyncStorage.setItem('username', email);
          await AsyncStorage.setItem('password', password);
          await AsyncStorage.setItem('userInfo', JSON.stringify(data[0].user_info));
          await AsyncStorage.setItem('lastUpdate', new Date().toLocaleString('vi-VN'));
          await login(); // Cập nhật trạng thái đăng nhập
          Toast.show({
            type: 'success',
            text1: 'Đăng nhập thành công',
            visibilityTime: 3000,
          });
      } catch (error) {
        // Xử lý lỗi khi gửi yêu cầu
        Toast.show({
          type: 'error',
          text1: 'Lỗi hệ thống',
          text2: 'Đã xảy ra lỗi khi kết nối đến máy chủ msg: ' + error.message,
          visibilityTime: 3000,
        });
      } finally {
        setIsSubmitting(false); // Kích hoạt lại nút
      }
    } else {
      Toast.show({
        type: 'error',
        text1: 'Lỗi đăng nhập',
        text2: 'Vui lòng nhập email và mật khẩu',
        visibilityTime: 3000,
      });
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center', padding: 16 }}>
      <StatusBar style="auto" />
      <Image
        source={require('../assets/adaptive-icon.png')}
        style={{ width: 256, height: 256, marginBottom: 20, borderRadius: 64 }}
      />
      <View style={{ width: '100%', marginBottom: 20 }}>
        <TextInput
          style={{ width: '100%', backgroundColor: '#f3f3f3', borderRadius: 8, padding: 12, marginBottom: 10 }}
          placeholder="Email"
          placeholderTextColor="#9CA3AF"
          onChangeText={setEmail}
          value={email}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          style={{ width: '100%', backgroundColor: '#f3f3f3', borderRadius: 8, padding: 12 }}
          placeholder="Mật khẩu"
          placeholderTextColor="#9CA3AF"
          onChangeText={setPassword}
          value={password}
          secureTextEntry
        />
      </View>
      <TouchableOpacity
        style={{ width: '100%', backgroundColor: '#007BFF', borderRadius: 8, padding: 12, alignItems: 'center' }}
        onPress={handleLogin}
        disabled={isSubmitting} // Vô hiệu hóa nút khi đang gửi dữ liệu
      >
        {isSubmitting ? (
          <ActivityIndicator size="small" color="#ffffff" /> // Hiển thị spinner khi đang gửi dữ liệu
        ) : (
          <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>ĐĂNG NHẬP</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}
