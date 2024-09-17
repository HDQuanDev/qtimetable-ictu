import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from './screens/LoginScreen';
import SwipeableScreens from './components/SwipeableScreens';
import { AuthProvider, useAuth } from './AuthContext';
import Toast, { BaseToast, ErrorToast } from 'react-native-toast-message';
import { checkForUpdate } from './components/CheckUpdate';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ModalComponent from './components/ModalComponent';
import { initializeNotifications, useNotificationListener  } from './components/LocalNotification';


const Stack = createStackNavigator(); // Khởi tạo Stack Navigator

// Định nghĩa cấu hình cho Toast
const toastConfig = {
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
  tomatoToast: ({ text1, props }) => (
    <View style={{ height: 60, width: '100%', backgroundColor: "rgba(0,0,0,0.6)", }}>
      <Text>{text1}</Text>
      <Text>{props.uuid}</Text>
    </View>
  )
};

// Hàm hiển thị thanh điều hướng
function Navigation() {
  const { isLoggedIn, isLoading } = useAuth();
  if (isLoading) {
    return null;
  }
  return (
    <Stack.Navigator>
      {isLoggedIn ? (
        <Stack.Screen 
          name="MainContent" 
          component={SwipeableScreens}
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

// Hàm chính của ứng dụng
export default function App() {
  const [modalProps, setModalProps] = useState(null);
  const [notification, setNotification] = useState(null);
  const [showFirstTime, setShowFirstTime] = useState(null);

  // Kiểm tra cập nhật ứng dụng
  useEffect(() => {
    const handleCheckForUpdate = async () => {
      const updateInfo = await checkForUpdate();
      setModalProps(updateInfo);
    };
    handleCheckForUpdate();
  }, []);

  // Khởi tạo thông báo
  useEffect(() => {
    const setupNotification = async () => {
      try {
        await initializeNotifications();
      } catch (error) {
        Alert.alert('Lỗi', 'Không thể khởi tạo thông báo: ' + error.message);
      }
    };
    setupNotification();
  }, []);

  // Lắng nghe thông báo
  useNotificationListener((notification) => {
    console.log('Received notification:', notification);
  });

  // Kiểm tra thời gian cập nhật cuối cùng
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
        const now = new Date();
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
      const firstTime = await AsyncStorage.getItem('firstTime_v1.6.stable');
      if (!firstTime) {
        setShowFirstTime({
          showModal: true,
          title: 'Ứng dụng đã được cập nhật',
          content: 'Để ứng dụng sử dụng bình thường sau khi cập nhật, bạn cần cập nhật dữ liệu mới nhất từ server bằng cách nhấn vào nút reset góc trên bên phải màn hình để cập nhật dữ liệu mới nhất.',
          actionText: 'Đã hiểu',
          actionColor: 'bg-blue-600',
          onActionPress: async () => {
            await AsyncStorage.setItem('firstTime_v1.6.stable', 'false');
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
      <Navigation />
      </NavigationContainer>
      <Toast config={toastConfig}/>
    </AuthProvider>
  );
}