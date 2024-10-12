import * as Device from "expo-device";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { logError } from "../components/SaveLogs";

const url_saveToken = "https://api.quanhd.net/qtimetable/save_token.php"; // API endpoint save token

// Hàm gửi token đến máy chủ
export const sendTokenToServer = async (token) => {
  try {
    const deviceInfo = {
      deviceName: Device.deviceName,
      deviceYearClass: Device.deviceYearClass,
      modelName: Device.modelName,
      osName: Device.osName,
      osVersion: Device.osVersion,
    };

    const response = await fetch(url_saveToken, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        token: token,
        deviceInfo: deviceInfo,
      }),
    });

    if (!response.ok) {
      throw new Error(
        "Failed to send token to server with status " +
          response.status +
          " " +
          response.statusText
      );
    }

    const result = await response.json();
    await logError(
      "SUCCESS",
      "token.jsx-41: Đã gửi token đến máy chủ: " + result.message
    );

    // Save the token locally to avoid sending it again
    await AsyncStorage.setItem("expoPushToken", token);
  } catch (error) {
    await logError(
      "ERROR",
      "token.jsx-49: Lỗi khi gửi token đến máy chủ: " + error
    );
    throw error;
  }
};
