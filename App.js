import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { Alert, Linking, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from './screens/LoginScreen';
import ThoiKhoaBieuScreen from './screens/ThoiKhoaBieuScreen';
import { AuthProvider, useAuth } from './AuthContext';
import Toast, { BaseToast, ErrorToast } from 'react-native-toast-message';
import * as Notifications from 'expo-notifications';
import { checkForUpdate } from './components/CheckUpdate';

// Gọi hàm kiểm tra cập nhật

const Stack = createStackNavigator();

const toastConfig = {
  /*
    Overwrite 'success' type,
    by modifying the existing `BaseToast` component
  */
  success: (props) => (
    <BaseToast
      {...props}
      style={{ borderLeftColor: 'pink' }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{
        fontSize: 15,
        fontWeight: '400'
      }}
    />
  ),
  /*
    Overwrite 'error' type,
    by modifying the existing `ErrorToast` component
  */
  error: (props) => (
    <ErrorToast
      {...props}
      text1Style={{
        fontSize: 17
      }}
      text2Style={{
        fontSize: 15
      }}
    />
  ),
  /*
    Or create a completely new type - `tomatoToast`,
    building the layout from scratch.

    I can consume any custom `props` I want.
    They will be passed when calling the `show` method (see below)
  */
  tomatoToast: ({ text1, props }) => (
    <View style={{ height: 60, width: '100%', backgroundColor: 'tomato' }}>
      <Text>{text1}</Text>
      <Text>{props.uuid}</Text>
    </View>
  )
};

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
    checkForUpdate();

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
  useEffect(() => {
    // Thiết lập trình xử lý thông báo
    const notificationHandler = async () => {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
        }),
      });
    };
    notificationHandler();
    return () => {

    };
  }, []);

  return (
    <AuthProvider>
      <NavigationContainer>
        <Navigation />
      </NavigationContainer>
      <Toast config={toastConfig}/>
    </AuthProvider>
  );
}