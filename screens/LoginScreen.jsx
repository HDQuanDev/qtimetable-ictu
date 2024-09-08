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

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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
        
      });
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <LinearGradient
        colors={['#4c669f', '#3b5998', '#192f6a']}
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
            <Ionicons name="person-outline" size={24} color="#fff" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Tên đăng nhập"
              placeholderTextColor="#b3b3b3"
              onChangeText={setEmail}
              value={email}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={24} color="#fff" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Mật khẩu"
              placeholderTextColor="#b3b3b3"
              onChangeText={setPassword}
              value={password}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
              <Ionicons name={showPassword ? "eye-outline" : "eye-off-outline"} size={24} color="#fff" />
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
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.loginButtonText}>ĐĂNG NHẬP</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.loginButton}
            className="mt-3"
            onPress={() => Alert.alert(
              'Test thông báo',
              'Đảm bảo ứng dụng được cấp quyền thông báo để có thể nhận các thông báo liên quan đến lịch học.',
              [
                {text: 'Hủy', style: 'cancel'},
                {text: 'Kiểm Tra', onPress: () => { sendImmediateNotification('Test Thông Báo', 'Nêu bạn nhận được thông báo này, hệ thống thông báo đã hoạt động chính xác!') }, style: 'default'},
              ]
            )}>
            <Text style={styles.loginButtonText}>Test Thông Báo</Text>
          </TouchableOpacity>
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
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 25,
    marginBottom: 15,
    paddingHorizontal: 15,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: '#fff',
    paddingVertical: 15,
    fontSize: 16,
  },
  eyeIcon: {
    padding: 10,
  },
  infoText: {
    color: '#fff',
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
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});