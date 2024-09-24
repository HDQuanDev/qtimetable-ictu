import * as BackgroundFetch from "expo-background-fetch";
import * as TaskManager from "expo-task-manager";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import { sendImmediateNotification } from "./LocalNotification";
import { api_ictu } from "../services/api";
import { AppState } from "react-native";
import { logError } from "./SaveLogs";

const BACKGROUND_FETCH_TASK = "background-fetch-task-api";
const LAST_RUN_DATE_KEY = "lastRunDate";
const USERNAME_KEY = "username";
const PASSWORD_KEY = "password";
const LAST_UPDATE_KEY = "lastUpdate";
const TASK_LOCK_KEY = "taskLock";

const START_HOUR = 1;
const START_MINUTE = 1;
const END_HOUR = 6;
const END_MINUTE = 30;

const MAX_RETRIES = 3;
const RETRY_DELAY = 5 * 60 * 1000; // 5 minutes

const isTimeToRun = async () => {
  try {
    const now = new Date();
    const hour = now.getHours();
    const minutes = now.getMinutes();

    const isWithinTimeRange =
      hour > START_HOUR ||
      (hour === START_HOUR && minutes >= START_MINUTE) ||
      hour < END_HOUR ||
      (hour === END_HOUR && minutes <= END_MINUTE);

    if (isWithinTimeRange) {
      const today = now.toDateString();
      const lastRunDate = await AsyncStorage.getItem(LAST_RUN_DATE_KEY);

      if (lastRunDate !== today) {
        return true;
      }
    }
    return false;
  } catch (error) {
    await logError("Lỗi khi kiểm tra thời gian chạy:", error);
    return false;
  }
};

const acquireLock = async () => {
  const lockValue = await AsyncStorage.getItem(TASK_LOCK_KEY);
  if (!lockValue) {
    await AsyncStorage.setItem(TASK_LOCK_KEY, "locked");
    return true;
  }
  return false;
};

const releaseLock = async () => {
  await AsyncStorage.removeItem(TASK_LOCK_KEY);
};

const runAPITask = async (retryCount = 0) => {
  if (!(await acquireLock())) {
    return false;
  }

  try {
    const state = await NetInfo.fetch();
    if (!state.isInternetReachable) {
      throw new Error("No internet connection");
    }

    const [username, password] = await Promise.all([
      AsyncStorage.getItem(USERNAME_KEY),
      AsyncStorage.getItem(PASSWORD_KEY),
    ]);

    if (!username || !password) {
      await sendImmediateNotification(
        "Cập nhật thông tin đăng nhập",
        "Vui lòng cập nhật thông tin đăng nhập để tiếp tục đồng bộ dữ liệu"
      );
      return false;
    }

    await api_ictu(username, password, "reset");

    const currentDate = new Date();
    await AsyncStorage.setItem(
      LAST_UPDATE_KEY,
      currentDate.toLocaleString("vi-VN")
    );
    await AsyncStorage.setItem(LAST_RUN_DATE_KEY, currentDate.toDateString());
    await sendImmediateNotification(
      "Đã tự động cập nhật dữ liệu mới",
      "Hệ thống đã tự động cập nhật dữ liệu lịch học, lịch thi, điểm số mới nhất từ hệ thống ICTU"
    );
    return true;
  } catch (error) {
    await logError("Lỗi khi chạy API task", error);
    if (retryCount < MAX_RETRIES) {
      setTimeout(() => runAPITask(retryCount + 1), RETRY_DELAY);
    }
    return false;
  } finally {
    await releaseLock();
  }
};

TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
  try {
    if (await isTimeToRun()) {
      const result = await runAPITask();
      return result
        ? BackgroundFetch.BackgroundFetchResult.NewData
        : BackgroundFetch.BackgroundFetchResult.Failed;
    } else {
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }
  } catch (error) {
    await logError("Lỗi trong task chạy ngầm", error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

let isAppStateListenerRegistered = false;

export const registerBackgroundTaskApi = async () => {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(
      BACKGROUND_FETCH_TASK
    );
    if (!isRegistered) {
      await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
        minimumInterval: 60 * 15, // 15 phút
        stopOnTerminate: false,
        startOnBoot: true,
      });

      if (!isAppStateListenerRegistered) {
        AppState.addEventListener("change", handleAppStateChange);
        isAppStateListenerRegistered = true;
      }
    }
  } catch (error) {
    await logError("Lỗi khi đăng ký background task:", error);
  }
};

const handleAppStateChange = async (nextAppState) => {
  if (nextAppState === "active") {
    if (await isTimeToRun()) {
      await runAPITask();
    }
  }
};

export const unregisterBackgroundTask = async () => {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(
      BACKGROUND_FETCH_TASK
    );
    if (isRegistered) {
      await BackgroundFetch.unregisterTaskAsync(BACKGROUND_FETCH_TASK);
      if (isAppStateListenerRegistered) {
        AppState.removeEventListener("change", handleAppStateChange);
        isAppStateListenerRegistered = false;
      }
    }
  } catch (error) {
    await logError("Lỗi khi hủy background task:", error);
  }
};

export const checkAndDisplayLogs = async () => {
  try {
    const logs = await AsyncStorage.getItem(ERROR_LOGS_KEY);
    return logs ? JSON.parse(logs) : [];
  } catch (error) {
    await logError("Lỗi khi đọc logs:", error);
    return [];
  }
};

export const runAPIIfNeeded = async () => {
  if (await isTimeToRun()) {
    await runAPITask();
  }
};
