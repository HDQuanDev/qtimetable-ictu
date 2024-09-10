import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, Image, ActivityIndicator, Alert, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Toast from 'react-native-toast-message';
import { useAuth } from '../AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api_ictu } from '../services/api';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { sendImmediateNotification } from '../components/LocalNotification';
import ModalComponent from '../components/ModalComponent';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    if (email && password) {
      setIsSubmitting(true);
      try {
        const data = await api_ictu(email, password);
        await AsyncStorage.setItem('username', email);
        await AsyncStorage.setItem('password', password);
        await login();
        Toast.show({
          type: 'success',
          text1: 'Đăng nhập thành công',
          visibilityTime: 3000,
        });
      } catch (error) {
        Toast.show({
        type: 'tomatoToast',
          type: 'error',
          text1: 'Lỗi hệ thống',
          text2: error.message,
          visibilityTime: 3000,
          style: {
            backgroundColor: 'red',
          },
        });
      } finally {
        setIsSubmitting(false);
      }
    } else {
      Toast.show({
        type: 'tomatoToast',
        type: 'error',
        text1: 'Lỗi đăng nhập',
        text2: 'Vui lòng nhập tên đăng nhập và mật khẩu',
        style: {
          backgroundColor: 'red',
        },
      });
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <LinearGradient
        colors={['#1f1f1f', '#121212', '#000000']}
        style={styles.gradient}
      >
        <StatusBar style="light" />
        <View style={styles.logoContainer}>
          <Image
            source={require('../assets/adaptive-icon.png')}

            style={styles.logo}
          />
        </View>
        <View style={styles.formContainer}>
          <View style={styles.inputContainer}>
            <Ionicons name="person-outline" size={24} color="#000000" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Tên đăng nhập"
              placeholderTextColor="#1f1f1f"
              onChangeText={setEmail}
              value={email}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={24} color="#000000" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Mật khẩu"
              placeholderTextColor="#1f1f1f"
              onChangeText={setPassword}
              value={password}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
              <Ionicons name={showPassword ? "eye-outline" : "eye-off-outline"} size={24} color="#000000" />
            </TouchableOpacity>
          </View>
          <Text style={styles.infoText}>
            <Text style={styles.asterisk}>*</Text> Vui lòng sử dụng tài khoản trên Dangkytinchi để đăng nhập
          </Text>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={handleLogin}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#000000" />
            ) : (
              <Text style={styles.loginButtonText}>ĐĂNG NHẬP</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.loginButton}
            className="mt-3"
            onPress={() => setModalVisible(true)}
          >
            <Text style={styles.loginButtonText}>Test Thông Báo</Text>
          </TouchableOpacity>
          {/* Modal thông báo ngay lập tức */}
          {modalVisible && (
          <ModalComponent
            visible={modalVisible}
            onClose={() => setModalVisible(false)}
            title="Kiểm tra thông báo"
            content={"Để đảm bảo bạn có thể nhận được thông báo từ ứng dụng, và ứng dụng có thể gửi thông báo quan trọng đến bạn ví dụ như thông báo lịch học, thông báo lịch thi, thông báo cập nhật ứng dụng,... bạn cần cấp quyền thông báo cho ứng dụng.\nNếu bạn đã cấp quyền thông báo cho ứng dụng, bạn có thể nhấn vào nút \"Gửi\" để kiểm tra thông báo ngay lập tức."}
            closeText={'Đóng'}
            closeColor={'bg-gray-700'}
            actionText={'Gửi'}
            actionColor={'bg-blue-600'}
            onActionPress={() => sendImmediateNotification('Phát triển bởi Hứa Đức Quân', 'Ứng dụng của bạn đã được cấp quyền thông báo và có thể nhận được thông báo từ ứng dụng.')}
          />
        )}
        </View>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 50,
  },
  logo: {
    width: 256,
    height: 256,
    borderRadius: 60,
  },
  formContainer: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderRadius: 25,
    marginBottom: 15,
    paddingHorizontal: 15,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: '#000',
    paddingVertical: 15,
    fontSize: 16,
  },
  eyeIcon: {
    padding: 10,
  },
  infoText: {
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    marginBottom: 20,
    fontSize: 14,
  },
  asterisk: {
    color: '#ff6b6b',
  },
  loginButton: {
    backgroundColor: '#ff6b6b',
    borderRadius: 25,
    paddingVertical: 15,
    alignItems: 'center',
  },
  loginButtonText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 18,
    fontWeight: 'bold',
  },
});