import AsyncStorage from "@react-native-async-storage/async-storage";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db, getUserKey, encryptData, decryptData } from "./firestore";
import {
  sendImmediateNotification,
  scheduleLocalNotification,
} from "./LocalNotification";
import { scheduleAllNotifications } from "./ScheduleNotification";
import { logError } from "./SaveLogs";

const SYNC_COLLECTION_NAME = "user_data_sync";

export const SyncGhiChu = async () => {
  try {
    const userId = await AsyncStorage.getItem("username");
    if (!userId) {
      logError("INFO", "SyncGhiChu.jsx-17: Người dùng chưa đăng nhập");
      return;
    }

    const localKey = await getUserKey();
    const syncStatus = await AsyncStorage.getItem("SyncGhiChuStatus");
    const notificationsScheduled = await AsyncStorage.getItem(
      "notificationsScheduled"
    );

    // Lấy document từ Firestore
    const docRef = doc(db, SYNC_COLLECTION_NAME, userId);
    const docSnap = await getDoc(docRef);

    let dataChanged = false;

    if (docSnap.exists()) {
      // Document tồn tại, kiểm tra xem các khóa có khớp không
      const encryptedData = docSnap.data().encryptedData;
      try {
        const decryptedFirestoreData = await decryptData(
          encryptedData,
          localKey
        );
        if (syncStatus !== "true") {
          // Dữ liệu cục bộ chưa được đồng bộ, tải lên Firestore
          await syncAsyncStorageToFirestore(userId, localKey);
          await AsyncStorage.setItem("SyncGhiChuStatus", "true");
          dataChanged = true;
        } else {
          // Dữ liệu cục bộ đã được đồng bộ, so sánh với dữ liệu Firestore
          const localData = await AsyncStorage.getItem("userGhiChu");
          if (localData !== JSON.stringify(decryptedFirestoreData)) {
            // Dữ liệu khác nhau, khôi phục từ Firestore
            await AsyncStorage.setItem(
              "userGhiChu",
              JSON.stringify(decryptedFirestoreData)
            );
            dataChanged = true;
          } else {
            logError(
              "INFO",
              "SyncGhiChu.jsx-62: Dữ liệu ghi chú đã được đồng bộ trước đó"
            );
          }
        }
      } catch (error) {
        // Giải mã thất bại, các khóa không khớp
        logError(
          "ERROR",
          "SyncGhiChu.jsx-70: Lỗi khi giải mã dữ liệu từ Firestore: " + error
        );
        await sendImmediateNotification(
          "Cảnh báo đồng bộ",
          "Phát hiện mã P2P không khớp. Đồng bộ dữ liệu bị hủy để bảo vệ thông tin của bạn."
        );
        await scheduleLocalNotification(
          "Nhắc nhở cập nhật mã P2P",
          "Bạn cần cập nhật mã P2P để tiếp tục sử dụng tính năng đồng bộ dữ liệu bằng cách truy cập vào mục cài đặt -> Cập nhật mã P2P.",
          10
        );
        return;
      }
    } else {
      // Document không tồn tại, tạo mới
      await syncAsyncStorageToFirestore(userId, localKey);
      await AsyncStorage.setItem("SyncGhiChuStatus", "true");
      dataChanged = true;
    }

    if (dataChanged || notificationsScheduled !== "true") {
      await AsyncStorage.setItem("scheduledNotifications", "false");
      await scheduleAllNotifications();
      await AsyncStorage.setItem("notificationsScheduled", "true");
      await sendImmediateNotification(
        "Thông báo đồng bộ dữ liệu",
        "Dữ liệu ghi chú đã được đồng bộ thành công và lịch thông báo đã được cập nhật!"
      );
    }
  } catch (error) {
    logError("ERROR", "SyncGhiChu.jsx-92: Lỗi khi đồng bộ dữ liệu: " + error);
    throw error;
  }
};

const syncAsyncStorageToFirestore = async (userId, key) => {
  const userGhiChu = await AsyncStorage.getItem("userGhiChu");
  if (userGhiChu) {
    const encryptedData = await encryptData(JSON.parse(userGhiChu), key);
    await setDoc(doc(db, SYNC_COLLECTION_NAME, userId), { encryptedData });
  }
};
