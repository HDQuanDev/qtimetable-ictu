// backgroundTasks.js
import * as BackgroundFetch from "expo-background-fetch";
import * as TaskManager from "expo-task-manager";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import { sendImmediateNotification } from "./LocalNotification";
import { api_ictu } from "../services/api";
import { AppState } from "react-native";
import { logError, logInfo } from "./SaveLogs";

const BACKGROUND_FETCH_TASK = "background-fetch-task-api";
const LAST_RUN_DATE_KEY = "lastRunDate";
const USERNAME_KEY = "username";
const PASSWORD_KEY = "password";
const LAST_UPDATE_KEY = "lastUpdate";
const TASK_LOCK_KEY = "taskLock";

const TIME_WINDOW = {
  start: { hour: 1, minute: 1 },
  end: { hour: 6, minute: 30 },
};

const MAX_RETRIES = 3;
const RETRY_DELAY = 5 * 60 * 1000; // 5 minutes
const MINIMUM_INTERVAL = 15 * 60; // 15 minutes in seconds

const isTimeToRun = async () => {
  try {
    const now = new Date();
    const { start, end } = TIME_WINDOW;

    const isWithinTimeRange =
      (now.getHours() > start.hour ||
        (now.getHours() === start.hour && now.getMinutes() >= start.minute)) &&
      (now.getHours() < end.hour ||
        (now.getHours() === end.hour && now.getMinutes() <= end.minute));

    if (isWithinTimeRange) {
      const today = now.toDateString();
      const lastRunDate = await AsyncStorage.getItem(LAST_RUN_DATE_KEY);
      const shouldRun = lastRunDate !== today;
      await logInfo(
        `isTimeToRun: ${shouldRun}, lastRunDate: ${lastRunDate}, current: ${today}`
      );
      return shouldRun;
    }
    await logInfo(
      `isTimeToRun: false, current time: ${now.toLocaleTimeString()}`
    );
    return false;
  } catch (error) {
    await logError(
      "ERROR",
      `backgroundTasks.js: Error checking run time: ${error}`
    );
    return false;
  }
};

const withLock = async (operation) => {
  if (await AsyncStorage.getItem(TASK_LOCK_KEY)) {
    return false;
  }

  await AsyncStorage.setItem(TASK_LOCK_KEY, "locked");
  try {
    return await operation();
  } finally {
    await AsyncStorage.removeItem(TASK_LOCK_KEY);
  }
};

const runAPITask = async (retryCount = 0) => {
  return withLock(async () => {
    try {
      await logInfo(`Starting API task, retry count: ${retryCount}`);
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
        await logInfo("API task failed: Missing credentials");
        return false;
      }

      await api_ictu(username, password, "reset");

      await sendImmediateNotification(
        "Đã tự động cập nhật dữ liệu mới",
        "Hệ thống đã tự động cập nhật dữ liệu lịch học, lịch thi, điểm số mới nhất từ hệ thống ICTU"
      );
      await logInfo("API task completed successfully");
      return true;
    } catch (error) {
      await logError("ERROR", `backgroundTasks.js: API task error: ${error}`);
      if (retryCount < MAX_RETRIES) {
        await logInfo(
          `Scheduling retry #${retryCount + 1} in ${RETRY_DELAY / 1000} seconds`
        );
        setTimeout(() => runAPITask(retryCount + 1), RETRY_DELAY);
      }
      return false;
    }
  });
};

TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
  try {
    await logInfo("Background fetch task started");
    if (await isTimeToRun()) {
      const result = await runAPITask();
      await logInfo(
        `Background fetch task completed with result: ${
          result ? "NewData" : "Failed"
        }`
      );
      return result
        ? BackgroundFetch.BackgroundFetchResult.NewData
        : BackgroundFetch.BackgroundFetchResult.Failed;
    }
    await logInfo("Background fetch task completed: No data (not time to run)");
    return BackgroundFetch.BackgroundFetchResult.NoData;
  } catch (error) {
    await logError(
      "ERROR",
      `backgroundTasks.js: Background fetch task error: ${error}`
    );
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

const handleAppStateChange = async (nextAppState) => {
  if (nextAppState === "active" && (await isTimeToRun())) {
    await runAPITask();
  }
};

export const registerBackgroundTaskApi = async () => {
  try {
    if (!(await TaskManager.isTaskRegisteredAsync(BACKGROUND_FETCH_TASK))) {
      await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
        minimumInterval: MINIMUM_INTERVAL,
        stopOnTerminate: false,
        startOnBoot: true,
      });
      AppState.addEventListener("change", handleAppStateChange);
      await logInfo("Background task registered successfully");
    } else {
      await logInfo("Background task already registered");
    }
  } catch (error) {
    await logError(
      "ERROR",
      `backgroundTasks.js: Error registering background task: ${error}`
    );
  }
};

export const unregisterBackgroundTask = async () => {
  try {
    if (await TaskManager.isTaskRegisteredAsync(BACKGROUND_FETCH_TASK)) {
      await BackgroundFetch.unregisterTaskAsync(BACKGROUND_FETCH_TASK);
      AppState.removeEventListener("change", handleAppStateChange);
      await logInfo("Background task unregistered successfully");
    } else {
      await logInfo("No background task to unregister");
    }
  } catch (error) {
    await logError(
      "ERROR",
      `backgroundTasks.js: Error unregistering background task: ${error}`
    );
  }
};

export const checkLastRunAndStatus = async () => {
  try {
    const lastRunDate = await AsyncStorage.getItem(LAST_RUN_DATE_KEY);
    const lastUpdateTime = await AsyncStorage.getItem(LAST_UPDATE_KEY);
    const isRegistered = await TaskManager.isTaskRegisteredAsync(
      BACKGROUND_FETCH_TASK
    );

    await logInfo(
      `Task status: ${
        isRegistered ? "Registered" : "Not registered"
      }, Last run: ${lastRunDate}, Last update: ${lastUpdateTime}`
    );

    return {
      isRegistered,
      lastRunDate,
      lastUpdateTime,
    };
  } catch (error) {
    await logError(
      "ERROR",
      `backgroundTasks.js: Error checking task status: ${error}`
    );
    return null;
  }
};

export const scheduleTaskCheck = () => {
  setInterval(async () => {
    const status = await checkLastRunAndStatus();
    if (status && !status.isRegistered) {
      await logError(
        "WARNING",
        "Background task is not registered. Attempting to re-register."
      );
      await registerBackgroundTaskApi();
    }
  }, 24 * 60 * 60 * 1000); // Kiểm tra mỗi 24 giờ
};

export const runAPIIfNeeded = async () => {
  if (await isTimeToRun()) {
    await runAPITask();
  }
};
