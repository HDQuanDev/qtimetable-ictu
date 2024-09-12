import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { Alert, Linking, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from './screens/LoginScreen';
import ThoiKhoaBieuScreen from './screens/ThoiKhoaBieuScreen';
import { AuthProvider, useAuth } from './AuthContext';
import Toast, { BaseToast, ErrorToast } from 'react-native-toast-message';
import * as Notifications from 'expo-notifications';
import { checkForUpdate } from './components/CheckUpdate';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ModalComponent from './components/ModalComponent';
import { initializeNotifications, useNotificationListener  } from './components/LocalNotification';

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
      style={{ borderLeftColor: 'pink', backgroundColor: 'gray' }}
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
    <View style={{ height: 60, width: '100%', backgroundColor: "rgba(0,0,0,0.6)", }}>
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
  const [modalProps, setModalProps] = useState(null);
  const [notification, setNotification] = useState(null);
  const [showFirstTime, setShowFirstTime] = useState(null);
  const [notificationCount, setNotificationCount] = useState(0);

  useEffect(() => {
    const setupOneSignal = async () => {
      try {
        await initializeNotifications();
        console.log("OneSignal setup completed");
      } catch (error) {
        console.error("Error setting up OneSignal:", error);
      }
    };

    setupOneSignal();
  }, []);

  useNotificationListener((notification) => {
    console.log('Received notification:', notification);
    setNotificationCount(prev => prev + 1);
  });
  
  useEffect(() => {
    const handleCheckForUpdate = async () => {
      const updateInfo = await checkForUpdate();
      setModalProps(updateInfo);
    };
    handleCheckForUpdate();

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
    const checkLastUpdateTime = async () => {
      const lastUpdateTime = await AsyncStorage.getItem('lastUpdate');
      if (lastUpdateTime) {
        const [time, date] = lastUpdateTime.split(' ');
        const [hours, minutes, seconds] = time.split(':');
        const [day, month, year] = date.split('/');
      
        const lastUpdateDate = new Date(
          parseInt(year), 
          parseInt(month) - 1, // Tháng trong JavaScript bắt đầu từ 0
          parseInt(day), 
          parseInt(hours), 
          parseInt(minutes), 
          parseInt(seconds)
        );
      
        // Lấy thời gian hiện tại
        const now = new Date();
      
        // So sánh thời gian
        const oneDayInMilliseconds = 24 * 60 * 60 * 1000;
        const timeDifference = now - lastUpdateDate;
      
        if (timeDifference > oneDayInMilliseconds) {
          setNotification(true);
        }
      }
    };
    checkLastUpdateTime();
  } ,[]);

  // Hiển thị modal chào mừng lần đầu khi cài app
  useEffect(() => {
    const checkFirstTime = async () => {
      const firstTime = await AsyncStorage.getItem('firstTime_v1.3.beta');
      if (!firstTime) {
        setShowFirstTime({
          showModal: true,
          title: 'Ứng dụng đã được cập nhật',
          content: 'Để ứng dụng sử dụng bình thường sau khi cập nhật, bạn cần cập nhật dữ liệu mới nhất từ server bằng cách nhấn vào nút reset góc trên bên phải màn hình để cập nhật dữ liệu mới nhất.',
          actionText: 'Đã hiểu',
          actionColor: 'bg-blue-600',
          onActionPress: async () => {
            await AsyncStorage.setItem('firstTime_v1.3.beta', 'false');
            setShowFirstTime(null);
          },
          closeText: 'Hủy',
          closeColor: 'bg-gray-700'
        });
      }
    };
    checkFirstTime();
  }
  ,[]);
  return (
    <AuthProvider>
      <NavigationContainer>
        <Navigation />
        {modalProps && (
        <ModalComponent
          visible={modalProps.showModal}
          onClose={() => setModalProps(null)}
          title={modalProps.title}
          content={modalProps.content}
          closeText={modalProps.closeText}
          closeColor={modalProps.closeColor}
          actionText={modalProps.actionText}
          actionColor={modalProps.actionColor}
          onActionPress={modalProps.onActionPress}
        />
      )}
      {showFirstTime && (
        <ModalComponent
          visible={showFirstTime.showModal}
          onClose={() => setShowFirstTime(null)}
          title={showFirstTime.title}
          content={showFirstTime.content}
          closeText={showFirstTime.closeText}
          closeColor={showFirstTime.closeColor}
          actionText={showFirstTime.actionText}
          actionColor={showFirstTime.actionColor}
          onActionPress={showFirstTime.onActionPress}
        />
      )}
      {notification && (
        <ModalComponent
          visible={notification}
          onClose={() => setNotification(false)}
          title="Cảnh báo!!!"
          content="Dữ liệu của bạn đã cũ hơn một ngày, vui lòng cập nhật dữ liệu mới nhất bằng cách sử dụng nút reset ở trên góc!"
          closeText="Đồng ý"
          closeColor="bg-red-600"
        />
      )}
      </NavigationContainer>
      <Toast config={toastConfig}/>
    </AuthProvider>
  );
}