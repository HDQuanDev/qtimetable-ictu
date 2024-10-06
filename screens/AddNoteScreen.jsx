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
} from "react-native";
import { TouchableOpacity } from "react-native-gesture-handler";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { useTheme } from "../components/ThemeProvider";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import ModalComponent from "../components/ModalComponent";
import AsyncStorage from "@react-native-async-storage/async-storage";
import moment from "moment-timezone";
import { scheduleLocalNotification } from "../components/LocalNotification";

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
  const insets = useSafeAreaInsets();

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
        const notificationId = await scheduleLocalNotification(title, content, remainingTime);
        newNote.notificationId = notificationId;
      }

      notes.push(newNote);
      await AsyncStorage.setItem("userGhiChu", JSON.stringify(notes));
      console.log("Saving note:", newNote);

      navigation.goBack();
    } catch (error) {
      console.error("Error saving note:", error);
    }
  }, [title, content, date, showNotification, navigation]);

  const calculateRemainingTime = useCallback(() => {
    const now = moment().tz("Asia/Ho_Chi_Minh");
    const selectedDate = moment(date).tz("Asia/Ho_Chi_Minh");
    const duration = moment.duration(selectedDate.diff(now));
    return Math.floor(duration.asSeconds());
  }, [date]);

  const themeClass = isDarkMode
    ? "bg-gray-900 text-white"
    : "bg-gray-100 text-gray-900";
  const inputThemeClass = isDarkMode
    ? "bg-gray-800 text-white"
    : "bg-white text-gray-900";
  const buttonThemeClass = isDarkMode ? "bg-indigo-600" : "bg-indigo-500";

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className={`flex-1 ${themeClass}`}
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      <ScrollView className="flex-1 px-4 py-6">
        <View className="flex-row items-center mb-6">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="mr-4"
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color={isDarkMode ? "white" : "black"}
            />
          </TouchableOpacity>
          <Text
            className={`text-2xl font-bold ${
              isDarkMode ? "text-white" : "text-gray-900"
            }`}
          >
            Thêm Ghi Chú Mới
          </Text>
        </View>
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
        <Text className="text-center mt-4">
          Thời gian còn lại: {calculateRemainingTime()} giây
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default AddNoteScreen;