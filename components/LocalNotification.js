// notificationHelper.js
import { Platform, Alert, Linking } from 'react-native';
import * as Notifications from 'expo-notifications';

// Hàm yêu cầu quyền thông báo
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
    await Notifications.setNotificationChannelAsync('notification-tkb', {
      name: 'Thông Báo Lịch Học',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  return true;
};

// Hàm lên lịch thông báo cục bộ
export const scheduleLocalNotification = async (title, body, triggerTime) => {
  const hasPermission = await requestPermissions();
  if (!hasPermission) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: title || "Thông báo cục bộ!",
      body: body || "Nội dung thông báo.",
      data: { someData: 'some data' },
    },
    trigger: {
      seconds: triggerTime || 5,
      channelId: 'notification-tkb',
    },
  });
  
};

// Hàm gửi thông báo ngay lập tức
export const sendImmediateNotification = async (title, body) => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;
  
    await Notifications.scheduleNotificationAsync({
      content: {
        title: title || "Thông báo ngay lập tức!",
        body: body || "Nội dung thông báo.",
        data: { someData: 'some data' },
      },
      trigger: null
    });
  };

export const cancelAllClassNotifications = async () => {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('Đã hủy tất cả các thông báo đã lên lịch');
    } catch (error) {
      console.error('Lỗi khi hủy các thông báo:', error);
    }
  };
  
