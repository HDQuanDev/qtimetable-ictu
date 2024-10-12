import AsyncStorage from "@react-native-async-storage/async-storage";

const ERROR_LOGS_KEY = "AppLogs";

export const logError = async (message, error) => {
  try {
    const logs = JSON.parse(
      (await AsyncStorage.getItem(ERROR_LOGS_KEY)) || "[]"
    );
    logs.push({
      timestamp: new Date().toISOString("vi-VN"),
      message,
      error: error ? error.toString() : "undefined error",
    });
    await AsyncStorage.setItem(ERROR_LOGS_KEY, JSON.stringify(logs.slice(-50))); // Keep last 50 logs
  } catch (e) {
    return e;
  }
};

export const logInfo = async (message) => {
  try {
    const logs = JSON.parse(
      (await AsyncStorage.getItem(ERROR_LOGS_KEY)) || "[]"
    );
    logs.push({
      timestamp: new Date().toISOString("vi-VN"),
      message,
    });
    await AsyncStorage.setItem(ERROR_LOGS_KEY, JSON.stringify(logs.slice(-50))); // Keep last 50 logs
  } catch (e) {
    return e;
  }
};

export const clearLogs = async () => {
  try {
    await AsyncStorage.removeItem(ERROR_LOGS_KEY);
  } catch (e) {
    console.error("Error clearing logs:", e);
  }
};

export const getLogs = async () => {
  try {
    return await AsyncStorage.getItem(ERROR_LOGS_KEY);
  } catch (e) {
    console.error("Error getting logs:", e);
    return "[]";
  }
};
