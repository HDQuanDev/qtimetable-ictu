import "react-native-gesture-handler";
import React, { useEffect, useState } from "react";
import { Alert } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import LoginScreen from "./screens/LoginScreen";
import IntroScreen from "./screens/IntroScreen";
import SwipeableScreens from "./screens/SwipeableScreens";
import AddNoteScreen from "./screens/AddNoteScreen";
import { AuthProvider, useAuth } from "./AuthContext";
import Toast, { BaseToast, ErrorToast } from "react-native-toast-message";
import { checkForUpdate } from "./components/CheckUpdate";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ModalComponent from "./components/ModalComponent";
import { scheduleAllNotifications } from "./components/ScheduleNotification";
import {
  initializeNotifications,
  useNotificationListener,
} from "./components/LocalNotification";
import {
  registerBackgroundTaskApi,
  scheduleTaskCheck,
  runAPIIfNeeded,
  checkLastRunAndStatus,
} from "./components/backgroundTasks";
import { ThemeProvider } from "./components/ThemeProvider";
import { logError } from "./components/SaveLogs";
import { SyncGhiChu } from "./components/SyncGhiChu";
import LoadingSpinner from "./screens/LoadingSpinner";

const Stack = createStackNavigator();

// Định nghĩa cấu hình cho Toast
const toastConfig = {
  success: (props) => (
    <BaseToast
      {...props}
      style={{ borderLeftColor: "pink", backgroundColor: "gray" }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{
        fontSize: 15,
        fontWeight: "400",
      }}
    />
  ),
  error: (props) => (
    <ErrorToast
      {...props}
      text1Style={{
        fontSize: 17,
      }}
      text2Style={{
        fontSize: 15,
      }}
    />
  ),
  tomatoToast: ({ text1, props }) => (
    <View
      style={{ height: 60, width: "100%", backgroundColor: "rgba(0,0,0,0.6)" }}
    >
      <Text>{text1}</Text>
      <Text>{props.uuid}</Text>
    </View>
  ),
};

// Hàm hiển thị thanh điều hướng
function Navigation() {
  const { isLoggedIn, isLoading } = useAuth();
  const [introCompleted, setIntroCompleted] = useState(null);

  useEffect(() => {
    const fetchIntroStatus = async () => {
      try {
        const intro = await AsyncStorage.getItem("@intro_completed");
        setIntroCompleted(intro === "true");
      } catch (error) {
        console.error("Error fetching intro status:", error);
      }
    };
    fetchIntroStatus();
  }, []);

  const handleIntroComplete = async () => {
    try {
      await AsyncStorage.setItem("@intro_completed", "true");
      setIntroCompleted(true);
    } catch (error) {
      console.error("Error saving intro status:", error);
    }
  };

  if (isLoading || introCompleted === null) {
    return <LoadingSpinner />;
  }

  return (
    <Stack.Navigator>
      {!introCompleted ? (
        <Stack.Screen name="Intro" options={{ headerShown: false }}>
          {(props) => (
            <IntroScreen {...props} onIntroComplete={handleIntroComplete} />
          )}
        </Stack.Screen>
      ) : !isLoggedIn ? (
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
      ) : (
        <>
          <Stack.Screen
            name="MainContent"
            component={SwipeableScreens}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="AddNote"
            component={AddNoteScreen}
            options={{ headerShown: false }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

function AppContent() {
  const { isLoggedIn, isLoading } = useAuth();
  const [modalProps, setModalProps] = useState(null);
  const [notification, setNotification] = useState(null);
  const [showFirstTime, setShowFirstTime] = useState(null);
  const [showNotification, setShowNotification] = useState(null);

  // Kiểm tra cập nhật ứng dụng
  useEffect(() => {
    const handleCheckForUpdate = async () => {
      const updateInfo = await checkForUpdate();
      setModalProps(updateInfo);
    };
    const setupNotification = async () => {
      try {
        await initializeNotifications();
      } catch (error) {
        Alert.alert("Lỗi", "Không thể khởi tạo thông báo: " + error.message);
        await logError("Lỗi khi khởi tạo thông báo:", error);
      }
    };
    handleCheckForUpdate();
    setupNotification();
  }, []);

  // Hàm khởi tạo các task nền
  async function initializeBackgroundTasks() {
    await registerBackgroundTaskApi();
    scheduleTaskCheck();
    await checkLastRunAndStatus();
  }

  // Kiểm tra cập nhật dữ liệu
  useEffect(() => {
    const initialize = async () => {
      if (isLoggedIn) {
        const syncData = async () => {
          await SyncGhiChu();
        };
        const checkAllNotifications = async () => {
          await scheduleAllNotifications();
        };
        const registerBackgroundTask = async () => {
          await initializeBackgroundTasks();
        };
        await registerBackgroundTask();
        await checkAllNotifications();
        await syncData();
      }
    };
    initialize();
  }, [isLoggedIn]);

  // Lắng nghe thông báo
  useNotificationListener((notification) => {
    setShowNotification(notification);
  });

  // Kiểm tra thời gian cập nhật cuối cùng
  useEffect(() => {
    const checkLastUpdateTime = async () => {
      const lastUpdateTime = await AsyncStorage.getItem("lastUpdate");
      if (lastUpdateTime) {
        const [time, date] = lastUpdateTime.split(" ");
        const [hours, minutes, seconds] = time.split(":");
        const [day, month, year] = date.split("/");
        const lastUpdateDate = new Date(
          parseInt(year),
          parseInt(month) - 1,
          parseInt(day),
          parseInt(hours),
          parseInt(minutes),
          parseInt(seconds)
        );
        const now = new Date();
        const oneDayInMilliseconds = 72 * 60 * 60 * 1000;
        const timeDifference = now - lastUpdateDate;
        if (timeDifference > oneDayInMilliseconds) {
          setNotification(true);
        }
      }
    };
    checkLastUpdateTime();
  }, []);

  // Hiển thị modal chào mừng lần đầu khi cài app
  useEffect(() => {
    const checkFirstTime = async () => {
      if (!isLoggedIn) return;
      const firstTime = await AsyncStorage.getItem("firstTime_v2.7.stable");
      if (!firstTime) {
        setShowFirstTime({
          showModal: true,
          title: "Ứng dụng đã được cập nhật",
          content:
            "Chào mừng bạn đến với phiên bản V2.7 của ứng dụng, ở phiên bản này, chúng tôi đã cải thiện giao diện và tối ưu hóa hiệu suất ứng dụng và thêm 1 số tính năng mới. Để ứng dụng hoạt động tốt nhất, vui lòng cập nhật dữ liệu mới nhất bằng cách sử dụng nút reset ở trên góc!",
          actionText: "Đã hiểu",
          actionColor: "bg-blue-600",
          onActionPress: async () => {
            await AsyncStorage.setItem("firstTime_v2.7.stable", "false");
            setShowFirstTime(null);
          },
          closeText: "Hủy",
          closeColor: "bg-gray-700",
        });
      }
    };
    checkFirstTime();
  }, [isLoggedIn]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <>
      <NavigationContainer>
        {modalProps && (
          <ModalComponent
            visible={modalProps.showModal}
            onClose={() => setModalProps(null)}
            title={modalProps.title}
            content={modalProps.content}
            closeText={modalProps.closeText}
            closeColor={modalProps.closeColor}
            actionText={modalProps.actionText}
            actionColor={modalProps.actionColor}
            onActionPress={modalProps.onActionPress}
          />
        )}
        {showFirstTime && (
          <ModalComponent
            visible={showFirstTime.showModal}
            onClose={() => setShowFirstTime(null)}
            title={showFirstTime.title}
            content={showFirstTime.content}
            closeText={showFirstTime.closeText}
            closeColor={showFirstTime.closeColor}
            actionText={showFirstTime.actionText}
            actionColor={showFirstTime.actionColor}
            onActionPress={showFirstTime.onActionPress}
          />
        )}
        {notification && (
          <ModalComponent
            visible={notification}
            onClose={() => setNotification(false)}
            title="Cảnh báo!!!"
            content="Dữ liệu của bạn đã cũ hơn ba ngày, vui lòng cập nhật dữ liệu mới nhất bằng cách sử dụng nút reset ở trên góc!"
            closeText="Đồng ý"
            closeColor="bg-red-600"
          />
        )}
        {showNotification && (
          <ModalComponent
            visible={showNotification}
            onClose={() => setShowNotification(false)}
            title={showNotification.request.content.title}
            content={showNotification.request.content.body}
            closeText="Đóng"
            closeColor="bg-gray-700"
          />
        )}
        <Navigation />
      </NavigationContainer>
      <Toast config={toastConfig} />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </AuthProvider>
  );
}
