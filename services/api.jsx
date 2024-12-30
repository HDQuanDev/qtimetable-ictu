import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { scheduleAllNotifications } from "../components/ScheduleNotification";
import { Alert } from "react-native";
import { logError } from "../components/SaveLogs";

// Định nghĩa các khung giờ học trong ngày
const periods = {
  1: { start: "6:45", end: "7:35" },
  2: { start: "7:40", end: "8:30" },
  3: { start: "8:40", end: "9:30" },
  4: { start: "9:40", end: "10:30" },
  5: { start: "10:35", end: "11:25" },
  6: { start: "13:00", end: "13:50" },
  7: { start: "13:55", end: "14:45" },
  8: { start: "14:50", end: "15:40" },
  9: { start: "15:55", end: "16:45" },
  10: { start: "16:50", end: "17:40" },
  11: { start: "18:15", end: "19:05" },
  12: { start: "19:10", end: "20:00" },
  13: { start: "20:10", end: "21:00" },
  14: { start: "21:10", end: "22:00" },
  15: { start: "22:10", end: "23:00" },
  16: { start: "23:30", end: "00:20" },
};

// Định nghĩa các đường dẫn API
const url_api = "https://search.quanhd.net/get_tkb"; // API endpoint lấy dữ liệu thời khóa biểu và lịch thi
//const url_api = "http://172.20.203.104:5000/get_tkb"; // API endpoint lấy dữ liệu thời khóa biểu và lịch thi
const url_checkUpdate = "https://api.quanhd.net/tkb_app.json"; // API endpoint check update

// Hàm gọi API để lấy dữ liệu thời khóa biểu và lịch thi
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
        await AsyncStorage.setItem("scheduledNotifications", "false");
        await scheduleAllNotifications();
        await AsyncStorage.setItem("lastRunDate", new Date().toDateString());
        await AsyncStorage.setItem(
          "lastUpdate",
          new Date().toLocaleString("vi-VN")
        );
      } catch (error) {
        await logError(
          "ERROR",
          "api.jsx-76: Lỗi khi lưu dữ liệu vào AsyncStorage:" + error
        );
      }
      return response.data;
    }
  } catch (error) {
    await logError("ERROR", "api.jsx-823: Lỗi khi gọi API:" + error);
    const errorMessage =
      error.response?.error ||
      "Đã xảy ra lỗi khi kết nối đến máy chủ API: " + error;
    throw new Error(errorMessage);
  }
};

// Hàm gọi API để kiểm tra cập nhật ứng dụng
export const api_checkUpdate = async (app_version, type = "one") => {
  try {
    const date = new Date();
    const response = await axios.get(
      url_checkUpdate + "?date=" + date.getTime()
    );
    if (response.status === 200) {
      const data = response.data;
      if (data.app_version != app_version) {
        return data.download_url;
      } else if (data.app_version == app_version && type != "one") {
        return true;
      } else {
        return false;
      }
    }
    return false;
  } catch (error) {
    await logError("ERROR", "api.jsx-110: Lỗi khi gọi API:" + error);
    const errorMessage =
      error.response?.error || "Đã xảy ra lỗi khi kết nối đến máy chủ API";
    throw new Error(errorMessage);
  }
};
