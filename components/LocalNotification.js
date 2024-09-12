import React, { useEffect } from 'react';
import { LogLevel, OneSignal } from 'react-native-onesignal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from "expo-constants";

const NOTIFICATION_IDS_KEY = 'SCHEDULED_NOTIFICATION_IDS';

// Hàm khởi tạo OneSignal
export const initializeNotifications = async () => {
  OneSignal.Debug.setLogLevel(LogLevel.Verbose);
  OneSignal.initialize("03ec2bd4-7caa-4319-909b-19962715abfe");

  // Yêu cầu quyền thông báo
  OneSignal.Notifications.requestPermission(true);

  // Đăng ký thiết bị với OneSignal (không cần thiết trong v5, nhưng giữ lại để đảm bảo tương thích)
  OneSignal.User.pushSubscription.optIn();

  OneSignal.Notifications.addEventListener('foregroundWillDisplay', event => {
    console.log("OneSignal: notification will show in foreground:", event);
    event.preventDefault();
    event.getNotification().display();
  });

  OneSignal.Notifications.addEventListener('opened', openedEvent => {
    console.log("OneSignal: notification opened:", openedEvent);
  });
};

// Hàm để đăng nhập người dùng (nếu có hệ thống đăng nhập)
export const loginUser = (externalId) => {
  OneSignal.login(externalId);
};

// Hàm để thêm email
export const addUserEmail = (email) => {
  OneSignal.User.addEmail(email);
};

// Hàm để thêm số điện thoại
export const addUserPhone = (phoneNumber) => {
  OneSignal.User.addSms(phoneNumber);
};

// Hàm để thêm tag
export const addUserTag = (key, value) => {
  OneSignal.User.addTag(key, value);
};

// Hàm lưu ID thông báo
const saveNotificationId = async (id) => {
  try {
    const existingIds = await AsyncStorage.getItem(NOTIFICATION_IDS_KEY);
    const idsArray = existingIds ? JSON.parse(existingIds) : [];
    idsArray.push(id);
    await AsyncStorage.setItem(NOTIFICATION_IDS_KEY, JSON.stringify(idsArray));
  } catch (error) {
    console.error('Error saving notification ID:', error);
  }
};

// Hàm lên lịch thông báo với OneSignal
export const scheduleLocalNotification = async (title, body, triggerTime) => {
  const currentTime = Math.floor(Date.now() / 1000);
  const sendAfter = currentTime + triggerTime;

  try {
    const notification = {
      headings: { en: title },
      contents: { en: body },
      send_after: sendAfter,
    };

    const response = await OneSignal.postNotification(notification);
    console.log('OneSignal notification scheduled:', response);
    if (response.id) {
      await saveNotificationId(response.id);
    }
    return response.id;
  } catch (error) {
    console.error('Error scheduling OneSignal notification:', error);
  }
};

// Hàm hủy tất cả thông báo đã lên lịch
export const cancelAllClassNotifications = async () => {
  try {
    const notificationIds = await AsyncStorage.getItem(NOTIFICATION_IDS_KEY);
    if (notificationIds) {
      const idsArray = JSON.parse(notificationIds);
      for (const id of idsArray) {
        await OneSignal.cancelNotification(id);
      }
      await AsyncStorage.removeItem(NOTIFICATION_IDS_KEY);
      console.log('Đã hủy tất cả các thông báo đã lên lịch');
    }
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
    const subscription = OneSignal.Notifications.addEventListener('foregroundWillDisplay', onNotification);
    return () => subscription.remove();
  }, [onNotification]);
};