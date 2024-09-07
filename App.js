import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { Alert, Linking, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from './screens/LoginScreen';
import ThoiKhoaBieuScreen from './screens/ThoiKhoaBieuScreen';
import { AuthProvider, useAuth } from './AuthContext';
import Toast from 'react-native-toast-message';
import * as Notifications from 'expo-notifications';

const Stack = createStackNavigator();

function Navigation() {
  const { isLoggedIn, isLoading } = useAuth();

  if (isLoading) {
    // Có thể hiển thị màn hình splash hoặc loading ở đây
    return null;
  }

  return (
    <Stack.Navigator>
      {isLoggedIn ? (
        <Stack.Screen 
          name="ThoiKhoaBieu" 
          component={ThoiKhoaBieuScreen} 
          options={{ headerShown: false }} 
        />
      ) : (
        <Stack.Screen 
          name="Login" 
          component={LoginScreen} 
          options={{ headerShown: false }} 
        />
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  useEffect(() => {

    const requestPermissions = async () => {
      let { status } = await Notifications.getPermissionsAsync();
    
      if (status !== 'granted') {
        const { status: newStatus } = await Notifications.requestPermissionsAsync();
        status = newStatus;
      }
    
      if (status !== 'granted') {
        Alert.alert(
          'Quyền thông báo chưa được cấp!',
          'Ứng dụng cần quyền thông báo để gửi cập nhật quan trọng. Vui lòng bật quyền thông báo trong cài đặt của bạn.',
          [
            { text: 'Hủy', style: 'cancel' },
            { text: 'Mở cài đặt', onPress: () => {
              if (Platform.OS === 'ios') {
                Linking.openSettings();
              } else if (Platform.OS === 'android') {
                Linking.openSettings();
              }
            } },
          ]
        );
        return false;
      }
    
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('test-channel', {
          name: 'Test Channel',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }
      return true;
    };

    const checkPermissions = async () => {
      await requestPermissions();
    };

    checkPermissions();
  }, []);

  return (
    <AuthProvider>
      <NavigationContainer>
        <Navigation />
      </NavigationContainer>
      <Toast />
    </AuthProvider>
  );
}