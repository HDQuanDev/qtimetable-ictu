import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  Switch,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  Alert,
  StatusBar,
} from "react-native";
import { TouchableOpacity } from "react-native-gesture-handler";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { useTheme } from "../components/ThemeProvider";
import { Ionicons } from "@expo/vector-icons";
import ModalComponent from "../components/ModalComponent";
import AsyncStorage from "@react-native-async-storage/async-storage";
import moment from "moment-timezone";
import { scheduleLocalNotification } from "../components/LocalNotification";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { LinearGradient } from "expo-linear-gradient";

const AddNoteScreen = ({ navigation }) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [date, setDate] = useState(new Date());
  const [showNotification, setShowNotification] = useState(false);
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [modalNotificationVisible, setModalNotificationVisible] =
    useState(false);
  const [modalErrorVisible, setModalErrorVisible] = useState(false);
  const { isDarkMode } = useTheme();

  const handleDateChange = useCallback((selectedDate) => {
    setDatePickerVisibility(false);
    if (selectedDate) {
      setDate(selectedDate);
      if (selectedDate > new Date()) {
        setShowNotification(true);
      } else {
        setShowNotification(false);
        setModalNotificationVisible(true);
      }
    }
  }, []);

  const handleSave = useCallback(async () => {
    if (!title || !content) {
      setModalErrorVisible(true);
      return;
    }

    const newNote = {
      id: Date.now().toString(), // Unique ID for the note
      title,
      content,
      date: moment(date).tz("Asia/Ho_Chi_Minh").format(),
      showNotification,
      notificationId: null, // Placeholder for notification ID
    };

    try {
      const existingNotes = await AsyncStorage.getItem("userGhiChu");
      const notes = existingNotes ? JSON.parse(existingNotes) : [];

      const remainingTime = calculateRemainingTime();
      if (showNotification && remainingTime > 0) {
        const notificationId = await scheduleLocalNotification(
          "Nhắc nhở ghi chú: " + title,
          content,
          remainingTime
        );
        newNote.notificationId = notificationId;
      }

      notes.push(newNote);
      await AsyncStorage.setItem("userGhiChu", JSON.stringify(notes));
      await AsyncStorage.setItem("SyncGhiChuStatus", "false");
      navigation.goBack();
    } catch (error) {
      Alert.alert("Lỗi!!!", "Đã xảy ra lỗi khi lưu ghi chú!");
    }
  }, [title, content, date, showNotification, navigation]);

  const calculateRemainingTime = useCallback(() => {
    const now = moment().tz("Asia/Ho_Chi_Minh");
    const selectedDate = moment(date).tz("Asia/Ho_Chi_Minh");
    const duration = moment.duration(selectedDate.diff(now));
    return Math.floor(duration.asSeconds());
  }, [date]);

  const inputThemeClass = isDarkMode
    ? "bg-gray-800 text-white"
    : "bg-white text-gray-900";
  const buttonThemeClass = isDarkMode ? "bg-indigo-600" : "bg-indigo-500";

  return (
    <GestureHandlerRootView className="flex-1">
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
      <LinearGradient
        colors={
          isDarkMode
            ? ["#0f172a", "#1e293b", "#334155"]
            : ["#f8fafc", "#f1f5f9", "#e2e8f0"]
        }
        className="flex-1"
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className={`flex-1`}
        >
          <LinearGradient
            colors={
              isDarkMode
                ? ["#1e293b", "#334155", "#475569"]
                : ["#ebf8ff", "#dbeafe", "#bfdbfe"]
            }
            className={`px-4 pt-12 flex-row justify-between items-center mb-6 ${
              isDarkMode ? "dark:bg-[#1f2937]" : "bg-[#f0f9ff]"
            } rounded-b-3xl`}
          >
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              className={`bg-opacity-20 p-2 rounded-full ${
                isDarkMode ? "bg-gray-700" : "bg-blue-100"
              } mb-4`}
            >
              <Ionicons
                name="arrow-back"
                size={24}
                color={isDarkMode ? "#93c5fd" : "#60a5fa"}
              />
            </TouchableOpacity>
            <Text
              className={`text-3xl font-bold ${
                isDarkMode ? "text-blue-400" : "text-blue-500"
              } text-center mb-4`}
            >
              Thêm Ghi Chú
            </Text>
            <TouchableOpacity
              className={`bg-opacity-20 p-2 rounded-full ${
                isDarkMode ? "bg-gray-700" : "bg-blue-100"
              } mb-4`}
            >
              <Ionicons
                name="document-text"
                size={24}
                color={isDarkMode ? "#93c5fd" : "#60a5fa"}
              />
            </TouchableOpacity>
          </LinearGradient>

          <ScrollView className="flex-1 px-4 py-6">
            <TextInput
              className={`w-full px-4 py-3 mb-4 rounded-lg ${inputThemeClass}`}
              placeholder="Tiêu đề"
              placeholderTextColor={isDarkMode ? "#9CA3AF" : "#6B7280"}
              value={title}
              onChangeText={(text) => setTitle(text.slice(0, 256))}
            />
            <TextInput
              className={`w-full px-4 py-3 mb-4 rounded-lg h-32 ${inputThemeClass}`}
              placeholder="Nội dung ghi chú"
              placeholderTextColor={isDarkMode ? "#9CA3AF" : "#6B7280"}
              value={content}
              onChangeText={(text) => setContent(text.slice(0, 1024))}
              multiline
            />
            <TouchableOpacity
              className={`mb-4 py-3 px-4 rounded-lg ${buttonThemeClass}`}
              onPress={() => setDatePickerVisibility(true)}
            >
              <Text className="text-white text-center font-semibold">
                Vui lòng chọn ngày giờ và thời gian: {date.toLocaleString()}
              </Text>
            </TouchableOpacity>
            <DateTimePickerModal
              isVisible={isDatePickerVisible}
              mode="datetime"
              onConfirm={handleDateChange}
              onCancel={() => setDatePickerVisibility(false)}
              textColor={isDarkMode ? "white" : "black"}
            />
            <View className="flex-row justify-between items-center mb-6">
              <Text className={isDarkMode ? "text-white" : "text-gray-900"}>
                Bạn có muốn nhận thông báo không?
              </Text>
              <Switch
                value={showNotification}
                onValueChange={setShowNotification}
                trackColor={{ false: "#767577", true: "#81b0ff" }}
                thumbColor={showNotification ? "#f5dd4b" : "#f4f3f4"}
                disabled={date <= new Date()}
              />
            </View>
            <TouchableOpacity
              className={`py-4 px-6 rounded-lg ${buttonThemeClass}`}
              onPress={handleSave}
            >
              <Text className="text-white text-center font-semibold text-lg">
                Lưu Ghi Chú
              </Text>
            </TouchableOpacity>
            <ModalComponent
              visible={modalNotificationVisible}
              onClose={() => setModalNotificationVisible(false)}
              title="Thông báo"
              content="Bạn sẽ không nhận được thông báo khi thời gian đã chọn đã qua!"
              closeText="OK"
              closeColor="bg-indigo-600"
            />
            <ModalComponent
              visible={modalErrorVisible}
              onClose={() => setModalErrorVisible(false)}
              title="Lỗi!!!"
              content="Vui lòng điền đầy đủ thông tin trước khi lưu!"
              closeText="Đã hiểu"
              closeColor="bg-red-600"
            />
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </GestureHandlerRootView>
  );
};

export default AddNoteScreen;
