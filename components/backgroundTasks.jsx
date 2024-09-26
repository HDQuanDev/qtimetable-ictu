import * as BackgroundFetch from "expo-background-fetch";
import * as TaskManager from "expo-task-manager";
import { AppState } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import { logError } from "./SaveLogs";
import axios from "axios";

const BACKGROUND_FETCH_TASK = "background-fetch-task-api";
const url_api = "https://api-tkb.quanhd.net/get_tkb";
export const api_ictu = async (
  username = "",
  password = "",
  type = "login"
) => {
  try {
    const response = await axios.post(url_api, {
      username:
        type === "login" ? username : await AsyncStorage.getItem("username"),
      password:
        type === "login" ? password : await AsyncStorage.getItem("password"),
    });
    if (response.status === 200) {
      try {
        await AsyncStorage.setItem(
          "userData_ThoiKhoaBieu",
          JSON.stringify(response.data.thoikhoabieu)
        );
        await AsyncStorage.setItem(
          "userData_LichThi",
          JSON.stringify(response.data.lichthi)
        );
        await AsyncStorage.setItem(
          "userInfo",
          JSON.stringify(response.data.user_info)
        );
        await AsyncStorage.setItem(
          "userData_Diem",
          JSON.stringify(response.data.diem)
        );
        await AsyncStorage.setItem(
          "userData_DiemDetail",
          JSON.stringify(response.data.diem_detail)
        );
        await AsyncStorage.setItem(
          "lastUpdate",
          new Date().toLocaleString("vi-VN")
        );
        await AsyncStorage.setItem("lastRunDate", new Date().toDateString());
      } catch (error) {
        await logError("ERROR", "backgroundTasks.jsx - 64: api_ictu: " + error.message);
      }
      return true;
    }
  } catch (error) {
    await logError("ERROR", "backgroundTasks.jsx - 64: api_ictu: " + error.message);
  }
};

// Hàm kiểm tra xem có nên chạy tác vụ hay không
const shouldRunTask = async () => {
  const now = new Date();
  const hour = now.getHours();
  const lastRunDate = await AsyncStorage.getItem("lastRunDate");
  const today = now.toDateString();

  return (hour >= 16 && hour <= 18) && lastRunDate !== today;
};

// Định nghĩa tác vụ nền
TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
  try {
    await logError("INFO", "Bắt đầu tác vụ nền");
    
    const netState = await NetInfo.fetch();
    if (!netState.isConnected) {
      await logError("INFO", "Không có kết nối internet, bỏ qua tác vụ");
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    if (await shouldRunTask()) {
      await logError("INFO", "Điều kiện thỏa mãn, thực hiện API");
      const result = await api_ictu(null, null, "reset");
      if (result) {
        await AsyncStorage.setItem("lastRunDate", new Date().toDateString());
        await logError("INFO", "Tác vụ nền hoàn thành thành công");
        return BackgroundFetch.BackgroundFetchResult.NewData;
      }
    } else {
      await logError("INFO", "Điều kiện chưa thỏa mãn, bỏ qua tác vụ");
    }

    return BackgroundFetch.BackgroundFetchResult.NoData;
  } catch (error) {
    await logError("ERROR", `Lỗi trong tác vụ nền: ${error.message}`);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

// Hàm đăng ký tác vụ nền
export const registerBackgroundTask = async () => {
  try {
    await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
      minimumInterval: 60 * 15, // 15 phút
      stopOnTerminate: false,
      startOnBoot: true,
    });
    await logError("INFO", "Đã đăng ký tác vụ nền thành công");
  } catch (error) {
    await logError("ERROR", `Lỗi khi đăng ký tác vụ nền: ${error.message}`);
  }
};

// Hàm kiểm tra trạng thái tác vụ nền
export const checkBackgroundTaskStatus = async () => {
  const status = await BackgroundFetch.getStatusAsync();
  await logError("INFO", `Trạng thái tác vụ nền: ${BackgroundFetch.BackgroundFetchStatus[status]}`);
  return status;
};

// Hàm này nên được gọi khi ứng dụng khởi động
export const setupBackgroundTask = async () => {
  await registerBackgroundTask();
  await checkBackgroundTaskStatus();
};

// Thêm listener cho trạng thái ứng dụng
AppState.addEventListener("change", async (nextAppState) => {
  if (nextAppState === "active") {
    await logError("INFO", "Ứng dụng trở lại trạng thái active");
    if (await shouldRunTask()) {
      await api_ictu(null, null, "reset");
    }
  }
});