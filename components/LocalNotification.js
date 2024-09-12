import React, { useEffect } from 'react';
import { Platform, Alert, Linking } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';

const BACKGROUND_FETCH_TASK = 'background-fetch-task';
const NOTIFICATION_CHANNEL_ID = 'notification-tkb';

// Định nghĩa tác vụ nền
TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
  console.log('Background fetch task running');
  // Thêm logic kiểm tra và gửi thông báo ở đây nếu cần
  return BackgroundFetch.BackgroundFetchResult.NewData;
});

// Hàm đăng ký tác vụ nền
const registerBackgroundFetchAsync = async () => {
  try {
    await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
      minimumInterval: 60, // 15 phút
      stopOnTerminate: false,
      startOnBoot: true,
    });
    console.log('Background fetch task registered');
  } catch (err) {
    console.error('Failed to register background fetch task:', err);
  }
};

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
        { text: 'Mở cài đặt', onPress: () => Linking.openSettings() },
      ]
    );
    return false;
  }
  return true;
};

// Hàm tạo kênh thông báo cho Android
const createNotificationChannel = async () => {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNEL_ID, {
      name: 'Thông Báo Lịch Học',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }
};

// Hàm khởi tạo hệ thống thông báo
export const initializeNotifications = async () => {
  const hasPermission = await requestPermissions();
  if (!hasPermission) return;

  await createNotificationChannel();
  
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });

  await registerBackgroundFetchAsync();
};

// Hàm lên lịch thông báo cục bộ
export const scheduleLocalNotification = async (title, body, triggerTime) => {
  const hasPermission = await requestPermissions();
  if (!hasPermission) return;

  try {
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: title,
        body: body,
        data: { someData: 'some data' },
      },
      trigger: {
        seconds: triggerTime,
        channelId: NOTIFICATION_CHANNEL_ID,
      },
    });
    console.log(`Đã lên lịch thông báo với ID: ${notificationId}`);
    return notificationId;
  } catch (error) {
    console.error('Lỗi khi lên lịch thông báo:', error);
  }
};

// Hàm hủy tất cả thông báo đã lên lịch
export const cancelAllClassNotifications = async () => {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('Đã hủy tất cả các thông báo đã lên lịch');
  } catch (error) {
    console.error('Lỗi khi hủy các thông báo:', error);
    throw error;
  }
};

// Hàm để lên lịch thông báo cho một môn học
export const scheduleClassNotifications = async (className, startTime, classRoom) => {
  const classDate = new Date(startTime);
  await scheduleNotificationForClass(className, classDate, 60, classRoom);
  await scheduleNotificationForClass(className, classDate, 30, classRoom);
  await scheduleNotificationForClass(className, classDate, 15, classRoom);
  await scheduleNotificationForClass(className, classDate, 0, classRoom);
};

// Hàm lên lịch thông báo cho một môn học
const scheduleNotificationForClass = async (className, classDate, minutesBefore, classRoom) => {
  const notificationTime = new Date(classDate.getTime() - minutesBefore * 60000);
  const now = new Date();
  if (notificationTime > now) {
    const secondsUntilNotification = Math.floor((notificationTime.getTime() - now.getTime()) / 1000);
    //console.log(`Lớp ${className} sẽ được thông báo trong ${secondsUntilNotification} giây nữa - ${notificationTime} - ${now}`);
    let title, body;
    if (minutesBefore === 0) {
      title = `${className} đang bắt đầu!`;
      body = `Lớp học ${className} đang bắt đầu ngay bây giờ, hãy đến lớp ${classRoom} ngay thôi!`;
    } else {
      title = `Sắp đến giờ học ${className}`;
      body = `Lớp học ${className} sẽ bắt đầu trong ${minutesBefore} phút nữa, hãy đến lớp ${classRoom} ngay thôi!`;
    }
    await scheduleLocalNotification(title, body, secondsUntilNotification);
  }
};

// Hàm để lên lịch thông báo cho một môn thi
export const scheduleExamNotifications = async (examName, examStart, examRoom, examSBD) => {
  const examDate = new Date(examStart);
  await scheduleExamNotificationForClass(examName, examDate, 60, examRoom, examSBD);
  await scheduleExamNotificationForClass(examName, examDate, 30, examRoom, examSBD);
  await scheduleExamNotificationForClass(examName, examDate, 15, examRoom, examSBD);
  await scheduleExamNotificationForClass(examName, examDate, 0, examRoom, examSBD);
};

// Hàm lên lịch thông báo cho một môn thi
const scheduleExamNotificationForClass = async (examName, examDate, minutesBefore, examRoom, examSBD) => {
  const notificationTime = new Date(examDate.getTime() - minutesBefore * 60000);
  const now = new Date();
  if (notificationTime > now) {
    const secondsUntilNotification = Math.floor((notificationTime.getTime() - now.getTime()) / 1000);
    //console.log(`Lịch thi ${examName} sẽ được thông báo trong ${secondsUntilNotification} giây nữa - ${notificationTime} - ${now}`);
    let title, body;
    if (minutesBefore === 0) {
      title = `Lịch thi môn ${examName} đang bắt đầu!`;
      body = `Môn thi ${examName} đang bắt đầu ngay bây giờ, mời bạn SBD ${examSBD} đến phòng thi ${examRoom} ngay thôi!`;
    } else {
      title = `Sắp đến giờ thi môn ${examName}`;
      body = `Môn thi ${examName} sẽ bắt đầu trong ${minutesBefore} phút nữa, mời bạn SBD ${examSBD} đến phòng thi ${examRoom} ngay thôi!`;
    }
    await scheduleLocalNotification(title, body, secondsUntilNotification);
  }
};

// Hook để lắng nghe sự kiện thông báo
export const useNotificationListener = (onNotification) => {
  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener(onNotification);
    return () => subscription.remove();
  }, [onNotification]);
};

// Hàm để kiểm tra trạng thái đăng ký tác vụ nền
export const checkBackgroundFetchStatus = async () => {
  const status = await BackgroundFetch.getStatusAsync();
  const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_FETCH_TASK);
  console.log('Background fetch status:', BackgroundFetch.BackgroundFetchStatus[status]);
  console.log('Background fetch task registered:', isRegistered);
};