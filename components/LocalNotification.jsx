import { useEffect } from "react";
import { Platform, Alert, Linking, AppState } from "react-native";
import * as Notifications from "expo-notifications";
import * as BackgroundFetch from "expo-background-fetch";
import * as TaskManager from "expo-task-manager";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { sendTokenToServer } from "../services/token";
import Constants from "expo-constants";
import NetInfo from "@react-native-community/netinfo";
import { logError } from "./SaveLogs";

const BACKGROUND_FETCH_TASK = "background-fetch-task";
const NOTIFICATION_CHANNEL_ID = "notification-tkb";
const BACKGROUND_CHECK_INTERVAL = 15 * 60; // 15 phút

// Đăng ký task background fetch
TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
  await checkAndReregisterBackgroundTask();
  return BackgroundFetch.BackgroundFetchResult.NewData;
});

// Hàm đăng ký task background fetch
const registerBackgroundFetchAsync = async () => {
  try {
    await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
      minimumInterval: BACKGROUND_CHECK_INTERVAL,
      stopOnTerminate: false,
      startOnBoot: true,
    });
  } catch (err) {
    await logError(
      "ERROR",
      "LocalNotification.jsx-33: Lỗi khi đăng ký task background fetch:" + err
    );
  }
};

// Hàm kiểm tra và đăng ký lại task background fetch
const checkAndReregisterBackgroundTask = async () => {
  const status = await BackgroundFetch.getStatusAsync();
  const isRegistered = await TaskManager.isTaskRegisteredAsync(
    BACKGROUND_FETCH_TASK
  );
  if (
    status !== BackgroundFetch.BackgroundFetchStatus.Available ||
    !isRegistered
  ) {
    await registerBackgroundFetchAsync();
  }
};

// Hàm kiểm tra quyền thông báo và yêu cầu quyền nếu chưa được cấp
const requestPermissions = async () => {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== "granted") {
    Alert.alert(
      "Quyền thông báo chưa được cấp!",
      "Ứng dụng cần quyền thông báo để gửi cập nhật quan trọng. Vui lòng bật quyền thông báo trong cài đặt của bạn.",
      [
        { text: "Hủy", style: "cancel" },
        { text: "Mở cài đặt", onPress: () => Linking.openSettings() },
      ]
    );
    return false;
  }
  return true;
};

// Hàm tạo channel thông báo
const createNotificationChannel = async () => {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNEL_ID, {
      name: "Thông Báo Lịch Học",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }
};

// Hàm khởi tạo thông báo
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
  startPeriodicBackgroundCheck();
  const state = await NetInfo.fetch();
  if (state.isConnected && state.isInternetReachable) {
    try {
      const storedToken = await AsyncStorage.getItem("expoPushToken");
      const tokenObject = await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig.extra.eas.projectId,
      });
      const token = tokenObject.data;
      if (token !== storedToken) {
        await sendTokenToServer(token);
      }
    } catch (error) {
      await logError(
        "ERROR",
        "LocalNotification.jsx-114: Lỗi khi lấy token:" + error
      );
    }
  }
};

// Hàm lên lịch thông báo cho sự kiện trong nền
const startPeriodicBackgroundCheck = () => {
  setInterval(checkAndReregisterBackgroundTask, BACKGROUND_CHECK_INTERVAL);
  AppState.addEventListener("change", async (nextAppState) => {
    if (nextAppState === "active") {
      await checkAndReregisterBackgroundTask();
    }
  });
};

// Hàm lên lịch thông báo
export const scheduleLocalNotification = async (title, body, triggerTime) => {
  const hasPermission = await requestPermissions();
  if (!hasPermission) return;
  try {
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: { someData: "some data" },
        sound: true,
        priority: Notifications.AndroidNotificationPriority.MAX,
      },
      trigger: triggerTime ? { seconds: triggerTime } : null,
    });
    return notificationId;
  } catch (error) {
    await logError(
      "ERROR",
      "LocalNotification.jsx-149: Lỗi khi lên lịch thông báo:" + error
    );
  }
};

// Hàm gửi thông báo ngay lập tức
export const sendImmediateNotification = (title, body) =>
  scheduleLocalNotification(title, body, null);

// Hàm hủy thông báo
export const cancelAllClassNotifications = async () => {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    await logError(
      "ERROR",
      "LocalNotification.jsx-165: Lỗi khi hủy thông báo:" + error
    );
    throw error;
  }
};

// Hàm lên lịch thông báo cho sự kiện
const scheduleNotificationForEvent = async (
  eventName,
  eventDate,
  minutesBefore,
  eventRoom,
  eventType = "class",
  eventSBD = ""
) => {
  const notificationTime = new Date(
    eventDate.getTime() - minutesBefore * 60000
  );
  const now = new Date();

  if (notificationTime > now) {
    // Tính thời gian từ khi gửi thông báo đến khi sự kiện bắt đầu
    const secondsUntilEvent = Math.floor(
      (eventDate.getTime() - notificationTime.getTime()) / 1000
    );

    // Tính thời gian từ hiện tại đến khi gửi thông báo
    const secondsUntilNotification = Math.floor(
      (notificationTime.getTime() - now.getTime()) / 1000
    );

    let title, body;
    if (minutesBefore === 0) {
      title = `${eventName} đang bắt đầu!`;
      body =
        eventType === "class"
          ? `Lớp học ${eventName} đang bắt đầu ngay bây giờ, hãy đến lớp ${eventRoom} ngay thôi!`
          : `Môn thi ${eventName} đang bắt đầu ngay bây giờ, mời bạn SBD ${eventSBD} đến phòng thi ${eventRoom} ngay thôi!`;
    } else {
      title = `Sắp đến giờ ${
        eventType === "class" ? "học" : "thi"
      } ${eventName}`;
      body =
        eventType === "class"
          ? `Lớp học ${eventName} sẽ bắt đầu trong ${
              secondsUntilEvent / 60
            } phút nữa, hãy đến lớp ${eventRoom} ngay thôi!`
          : `Môn thi ${eventName} sẽ bắt đầu trong ${
              secondsUntilEvent / 60
            } phút nữa, mời bạn SBD ${eventSBD} đến phòng thi ${eventRoom} ngay thôi!`;
    }
    await scheduleLocalNotification(title, body, secondsUntilNotification);
  }
};

// Hàm lên lịch thông báo cho lớp học
export const scheduleClassNotifications = async (
  className,
  startTime,
  classRoom
) => {
  const classDate = new Date(startTime);
  await Promise.all(
    [60, 30, 15, 0].map((minutes) =>
      scheduleNotificationForEvent(className, classDate, minutes, classRoom)
    )
  );
};

// Hàm lên lịch thông báo cho kỳ thi
export const scheduleExamNotifications = async (
  examName,
  examStart,
  examRoom,
  examSBD
) => {
  const examDate = new Date(examStart);
  await Promise.all(
    [60, 30, 15, 0].map((minutes) =>
      scheduleNotificationForEvent(
        examName,
        examDate,
        minutes,
        examRoom,
        "exam",
        examSBD
      )
    )
  );
};

// Hàm lắng nghe sự kiện thông báo
export const useNotificationListener = (onNotification) => {
  useEffect(() => {
    const subscription =
      Notifications.addNotificationReceivedListener(onNotification);
    return () => subscription.remove();
  }, [onNotification]);

  useEffect(() => {
    checkAndReregisterBackgroundTask();
  }, []);
};

// Hàm kiểm tra trạng thái background fetch
export const checkBackgroundFetchStatus = async () => {
  const status = await BackgroundFetch.getStatusAsync();
  const isRegistered = await TaskManager.isTaskRegisteredAsync(
    BACKGROUND_FETCH_TASK
  );
};
