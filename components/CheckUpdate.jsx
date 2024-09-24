import NetInfo from "@react-native-community/netinfo";
import { api_checkUpdate } from "../services/api";
import { Linking } from "react-native";
import Constants from "expo-constants";

// Hàm kiểm tra cập nhật ứng dụng
export const checkForUpdate = async (type = "one") => {
  const appVersion = Constants.expoConfig.version;
  const state = await NetInfo.fetch();
  if (state.isConnected && state.isInternetReachable) {
    try {
      const downloadUrl = await api_checkUpdate(appVersion, type);
      if (downloadUrl && downloadUrl !== true) {
        return {
          showModal: true,
          title: "Cập nhật ứng dụng",
          content:
            "Đã có phiên bản mới của ứng dụng. Vui lòng cập nhật để giúp cải thiện hiệu suất tổng thể của ứng dụng, và sử dụng các tính năng mới nhất, giúp ứng dụng hoạt động ổn định hơn.",
          actionText: "Cập nhật",
          actionColor: "bg-blue-600",
          onActionPress: () => Linking.openURL(downloadUrl),
          closeText: "Hủy",
          closeColor: "bg-gray-700",
        };
      } else if (downloadUrl === true) {
        return {
          showModal: true,
          title: "Thông báo",
          content: "Bạn đang sử dụng phiên bản mới nhất của ứng dụng.",
          actionText: null,
          actionColor: null,
          onActionPress: null,
          closeText: "Đóng",
          closeColor: "bg-gray-700",
        };
      }
    } catch (error) {
      return {
        showModal: true,
        title: "Lỗi",
        content: error.message,
        actionText: null,
        actionColor: null,
        onActionPress: null,
        closeText: "Đóng",
        closeColor: "bg-gray-700",
      };
    }
  } else {
    return {
      showModal: false,
      title: "Thông báo",
      content: "Không có kết nối internet.",
      actionText: null,
      actionColor: null,
      onActionPress: null,
      closeText: "Đóng",
      closeColor: "bg-gray-700",
    };
  }
};
