import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Modal,
  ScrollView,
  Alert,
  ActivityIndicator,
  useWindowDimensions,
  Dimensions,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { Calendar, LocaleConfig } from "react-native-calendars";
import { Ionicons } from "@expo/vector-icons";
import {
  GestureHandlerRootView,
  PanGestureHandler,
  State,
} from "react-native-gesture-handler";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api_ictu } from "../services/api";
import ModalComponent from "../components/ModalComponent";
import NetInfo from "@react-native-community/netinfo";
import { SolarDate } from "@nghiavuive/lunar_date_vi";
import { useTheme } from "../components/ThemeProvider";

// Cấu hình ngôn ngữ cho lịch
LocaleConfig.locales["vi"] = {
  monthNames: [
    "Tháng 1",
    "Tháng 2",
    "Tháng 3",
    "Tháng 4",
    "Tháng 5",
    "Tháng 6",
    "Tháng 7",
    "Tháng 8",
    "Tháng 9",
    "Tháng 10",
    "Tháng 11",
    "Tháng 12",
  ],
  monthNamesShort: [
    "Th1",
    "Th2",
    "Th3",
    "Th4",
    "Th5",
    "Th6",
    "Th7",
    "Th8",
    "Th9",
    "Th10",
    "Th11",
    "Th12",
  ],
  dayNames: [
    "Chủ nhật",
    "Thứ hai",
    "Thứ ba",
    "Thứ tư",
    "Thứ năm",
    "Thứ sáu",
    "Thứ bảy",
  ],
  dayNamesShort: ["CN", "T2", "T3", "T4", "T5", "T6", "T7"],
  today: "Hôm nay",
};
LocaleConfig.defaultLocale = "vi";

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

export default function ThoiKhoaBieuScreen() {
  // Cấu hình các biến state và hook cần thiết
  const [scheduleData, setScheduleData] = useState([]);
  const [examData, setExamData] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [calendarExpanded, setCalendarExpanded] = useState(false);
  const [currentWeekStartDate, setCurrentWeekStartDate] = useState(null);
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedExam, setSelectedExam] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [examModalVisible, setExamModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const { isDarkMode } = useTheme();
  const navigation = useNavigation();
  const [userNotes, setUserNotes] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null);
  const [noteModalVisible, setNoteModalVisible] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [screenWidth, setScreenWidth] = useState(
    Dimensions.get("window").width
  );

  useEffect(() => {
    const updateLayout = () => {
      setScreenWidth(Dimensions.get("window").width);
    };

    Dimensions.addEventListener("change", updateLayout);
    return () => {
      Dimensions.removeEventListener("change", updateLayout);
    };
  }, []);

  const toggleDropdown = () => setIsOpen(!isOpen);

  const handleOptionSelect = (option) => {
    if (option === "note") {
      handleAddNote();
    } else if (option === "other") {
      fetchNotes();
    }
    setIsOpen(false);
  };

  const isSmallScreen = screenWidth < 360;

  //hàm xử lý thêm ghi chú
  const handleAddNote = () => {
    const parentNavigation = navigation.getParent();
    if (parentNavigation) {
      parentNavigation.navigate("AddNote");
    } else {
      console.warn("Không thể tìm thấy navigation cha");
    }
  };

  //hàm xử lý xóa ghi chú
  const handleDeleteNote = async (noteId) => {
    try {
      const userGhiChu = await AsyncStorage.getItem("userGhiChu");
      if (userGhiChu) {
        const notes = JSON.parse(userGhiChu);
        const updatedNotes = notes.filter((note) => note.id !== noteId);
        await AsyncStorage.setItem("userGhiChu", JSON.stringify(updatedNotes));
        setUserNotes(updatedNotes); // Update the state to reflect the deletion
        setNoteModalVisible(false); // Close the modal
      }
    } catch (error) {
      console.error("Error deleting note:", error);
    }
  };

  // Hàm để lấy số lượng ghi chú cho một ngày cụ thể
  const getNumberOfNotesForDay = useCallback(
    (date) => {
      return userNotes.filter((note) => note.date.split("T")[0] === date)
        .length;
    },
    [userNotes]
  );

  // Hàm lấy dữ liệu ghi chú từ bộ nhớ đệm
  const fetchNotes = async () => {
    try {
      const notesData = await AsyncStorage.getItem("userGhiChu");
      if (notesData) {
        setUserNotes(JSON.parse(notesData));
      }
    } catch (error) {
      console.error("Error fetching notes:", error);
    }
  };
  const fetchData = async () => {
    await fetchScheduleData();
    await fetchExamData();
    await fetchNotes();
  };
  // Hàm xử lý khi quay trở lại
  useFocusEffect(
    useCallback(() => {
      fetchNotes();
      fetchData();
    }, [])
  );

  // Hàm xử lý dữ liệu khi mở ứng dụng
  useEffect(() => {
    fetchData();
    const today = new Date();
    today.setHours(today.getHours() + 7);
    const todayDateString = today.toISOString().split("T")[0];
    setSelectedDate(todayDateString);
    setCurrentWeekStartDate(getWeekStartDate(todayDateString));
  }, []);

  // Hàm xử lý lấy dữ liệu thời khóa biểu từ bộ nhớ đệm
  const fetchScheduleData = async () => {
    try {
      const data = await AsyncStorage.getItem("userData_ThoiKhoaBieu");
      if (data) {
        setScheduleData(JSON.parse(data));
      }
    } catch (error) {
      console.error("Error fetching schedule data:", error);
    }
  };

  // Hàm xử lý lấy dữ liệu lịch thi từ bộ nhớ đệm
  const fetchExamData = async () => {
    try {
      const data = await AsyncStorage.getItem("userData_LichThi");
      if (data && data !== "null") {
        setExamData(JSON.parse(data));
      }
    } catch (error) {
      console.error("Error fetching exam data:", error);
    }
  };

  // Hàm chuyển đổi định dạng ngày
  const convertDateFormat = useCallback((dateString) => {
    const [day, month, year] = dateString.split("/");
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }, []);

  // Hàm lấy ngày bắt đầu của tuần
  const getWeekStartDate = useCallback((dateString) => {
    const date = new Date(dateString);
    date.setHours(date.getHours() + 7);
    const dayOfWeek = date.getDay();
    const diff = date.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    return new Date(date.setDate(diff)).toISOString().split("T")[0];
  }, []);

  // Hàm lấy thời khóa biểu cho ngày đã chọn
  const getScheduleForDate = useCallback(() => {
    if (!selectedDate) return [];
    const selectedDateObj = new Date(selectedDate);
    const selectedWeek = scheduleData.find((week) => {
      const startDateObj = new Date(convertDateFormat(week.start_date));
      const endDateObj = new Date(convertDateFormat(week.end_date));
      return selectedDateObj >= startDateObj && selectedDateObj <= endDateObj;
    });
    if (!selectedWeek) return [];
    const dayOfWeekMapping = ["CN", "2", "3", "4", "5", "6", "7"];
    const selectedDayString = dayOfWeekMapping[selectedDateObj.getDay()];
    return selectedWeek.data.filter(
      (item) => item["thu"] === selectedDayString
    );
  }, [selectedDate, scheduleData, convertDateFormat]);

  // Hàm lấy số lớp học cho ngày đã chọn
  const getExamsForDate = useCallback(() => {
    if (!selectedDate) return [];
    return examData.filter((exam) => {
      const examDate = convertDateFormat(exam.ngay_thi);
      return examDate === selectedDate;
    });
  }, [selectedDate, examData, convertDateFormat]);

  // Hàm lấy số lớp học cho ngày đã chọn
  const getNumberOfClassesForDay = useCallback(
    (date) => {
      const dateObj = new Date(date);
      const week = scheduleData.find((w) => {
        const startDateObj = new Date(convertDateFormat(w.start_date));
        const endDateObj = new Date(convertDateFormat(w.end_date));
        return dateObj >= startDateObj && dateObj <= endDateObj;
      });
      if (!week) return 0;
      const dayOfWeekMapping = ["CN", "2", "3", "4", "5", "6", "7"];
      const dayString = dayOfWeekMapping[dateObj.getDay()];
      return week.data.filter((item) => item["thu"] === dayString).length;
    },
    [scheduleData, convertDateFormat]
  );

  // Hàm lấy số lớp học cho ngày đã chọn
  const getNumberOfExamsForDay = useCallback(
    (date) => {
      return examData.filter(
        (exam) => convertDateFormat(exam.ngay_thi) === date
      ).length;
    },
    [examData, convertDateFormat]
  );
  const getWeekDays = useCallback((startDate) => {
    const days = [];
    const startDateObj = new Date(startDate);
    for (let i = 0; i < 7; i++) {
      const day = new Date(startDateObj);
      day.setDate(startDateObj.getDate() + i);
      days.push({
        dateString: day.toISOString().split("T")[0],
        dayOfWeek: day.toLocaleDateString("vi-VN", { weekday: "short" }),
        dayOfMonth: day.getDate(),
      });
    }
    return days;
  }, []);

  // Hàm xử lý khi chọn ngày trên lịch
  const handleDayPress = useCallback(
    async (day) => {
      setSelectedDate(day.dateString);
      setCalendarExpanded(false);
      setCurrentWeekStartDate(getWeekStartDate(day.dateString));
    },
    [getWeekStartDate]
  );

  // Hàm xử lý khi vuốt trên lịch
  const handleSwipe = useCallback(
    async (event) => {
      if (event.nativeEvent.state === State.END) {
        let newDate = new Date(selectedDate);
        if (event.nativeEvent.translationX > 50) {
          newDate.setDate(newDate.getDate() - 1);
        } else if (event.nativeEvent.translationX < -50) {
          newDate.setDate(newDate.getDate() + 1);
        } else {
          return;
        }
        const newDateString = newDate.toISOString().split("T")[0];
        await handleDayPress({ dateString: newDateString });
        const newWeekStartDate = getWeekStartDate(newDateString);
        if (newWeekStartDate !== currentWeekStartDate) {
          setCurrentWeekStartDate(newWeekStartDate);
        }
      }
    },
    [selectedDate, handleDayPress, getWeekStartDate, currentWeekStartDate]
  );

  // Hàm xử lý khi nhấn nút reset dữ liệu
  const handleResetData = useCallback(async () => {
    try {
      const state = await NetInfo.fetch();
      if (state.isConnected && state.isInternetReachable) {
        setIsLoading(true);
        await api_ictu(
          await AsyncStorage.getItem("username"),
          await AsyncStorage.getItem("password"),
          "reset"
        );
        await fetchData();
        await fetchNotes();
      } else {
        Alert.alert("Lỗi", "Không có kết nối mạng, không thể cập nhật!");
        return;
      }
    } catch (error) {
      Alert.alert("Lỗi", "Không thể cập nhật dữ liệu: " + error.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Hàm render mục thời khóa biểu
  const renderClassItem = useCallback(
    ({ item, isDarkMode }) => {
      const [startPeriod, endPeriod] = item["tiet_hoc"]
        .split(" --> ")
        .map(Number);
      const startTime = periods[startPeriod].start;
      const endTime = periods[endPeriod].end;
      const selectedClass = { ...item, startTime, endTime };

      return (
        <TouchableOpacity
          onPress={() => {
            setSelectedClass(selectedClass);
            setModalVisible(true);
          }}
          className="mb-4"
        >
          <LinearGradient
            colors={
              isDarkMode
                ? ["#2c3e50", "#34495e"] // Gradient tối dịu mắt (xanh đậm)
                : ["#e0ffff", "#cce0ff"] // Gradient sáng dịu mắt (xanh nhạt)
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className={`p-4 rounded-3xl shadow-md ${
              isDarkMode ? "dark:shadow-lg dark:bg-gray-800" : "bg-white"
            } ${
              isDarkMode
                ? "dark:border-2 dark:border-sky-300"
                : "border-2 border-sky-700"
            }`}
          >
            <View className="flex-row justify-between items-center mb-3">
              <View
                className={`px-3 py-1 rounded-full ${
                  isDarkMode ? "bg-gray-700 dark:bg-gray-600" : "bg-blue-400"
                }`}
              >
                <Text
                  className={`font-semibold text-xs ${
                    isDarkMode ? "text-gray-300" : "text-white"
                  }`}
                >
                  Lịch Học
                </Text>
              </View>
              <View
                className={`px-3 py-1 rounded-full ${
                  isDarkMode ? "bg-gray-600 dark:bg-gray-500" : "bg-blue-300"
                }`}
              >
                <Text
                  className={`font-semibold text-xs ${
                    isDarkMode ? "text-gray-300" : "text-white"
                  }`}
                >
                  {startTime} - {endTime}
                </Text>
              </View>
            </View>
            <Text
              className={`text-xl font-bold mb-3 leading-tight ${
                isDarkMode ? "text-gray-300" : "text-gray-800"
              }`}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {item["lop_hoc_phan"]}
            </Text>
            <View className="flex-row items-center mb-2">
              <Ionicons
                name="person-outline"
                size={18}
                color={isDarkMode ? "#a0aec0" : "#718096"}
                className="dark:text-gray-400"
              />
              <Text
                className={`ml-2 text-sm font-medium flex-1 ${
                  isDarkMode ? "text-gray-400" : "text-gray-600"
                }`}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {item["giang_vien"]}
              </Text>
            </View>
            <View className="flex-row items-center">
              <Ionicons
                name="location-outline"
                size={18}
                color={isDarkMode ? "#a0aec0" : "#718096"}
                className="dark:text-gray-400"
              />
              <Text
                className={`ml-2 text-sm font-medium flex-1 ${
                  isDarkMode ? "text-gray-400" : "text-gray-600"
                }`}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {item["dia_diem"]}
              </Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      );
    },
    [periods, setSelectedClass, setModalVisible]
  );

  // Hàm render mục lịch thi
  const renderExamItem = useCallback(
    ({ item, isDarkMode }) => {
      const [startTime, endTime] = item.ca_thi
        .match(/\(([^)]+)\)/)[1]
        .split("-");

      return (
        <TouchableOpacity
          onPress={() => {
            setSelectedExam(item);
            setExamModalVisible(true);
          }}
          className="mb-4"
        >
          <LinearGradient
            colors={
              isDarkMode
                ? ["#434343", "#000000"] // Gradient tối dịu mắt (xám đậm)
                : ["#ffdab9", "#ffe4c4"] // Gradient sáng dịu mắt (màu be)
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className={`p-4 rounded-3xl shadow-md ${
              isDarkMode ? "dark:shadow-lg dark:bg-gray-800" : "bg-white"
            } ${
              isDarkMode
                ? "dark:border-2 dark:border-yellow-800"
                : "border-2 border-yellow-700"
            }`}
          >
            <View className="flex-row justify-between items-center mb-3">
              <View
                className={`px-3 py-1 rounded-full ${
                  isDarkMode ? "bg-red-700" : "bg-red-500"
                }`}
              >
                <Text
                  className={`font-semibold text-xs ${
                    isDarkMode ? "text-gray-300" : "text-white"
                  }`}
                >
                  Lịch Thi
                </Text>
              </View>
              <View
                className={`px-3 py-1 rounded-full ${
                  isDarkMode ? "bg-yellow-500" : "bg-yellow-300"
                }`}
              >
                <Text
                  className={`font-semibold text-xs ${
                    isDarkMode ? "text-gray-900" : "text-gray-900"
                  }`}
                >
                  {startTime} - {endTime}
                </Text>
              </View>
            </View>
            <Text
              className={`text-xl font-bold mb-3 leading-tight ${
                isDarkMode ? "text-gray-300" : "text-gray-800"
              }`}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {item.ten_hoc_phan}
            </Text>
            <View className="flex-row items-center mb-2">
              <Ionicons
                name="code-outline"
                size={18}
                color={isDarkMode ? "#a0aec0" : "#718096"}
                className="dark:text-gray-400"
              />
              <Text
                className={`ml-2 text-sm font-medium ${
                  isDarkMode ? "text-gray-400" : "text-gray-600"
                }`}
              >
                Mã HP: {item.ma_hoc_phan} | SBD: {item.so_bao_danh}
              </Text>
            </View>
            <View className="flex-row items-center mb-2">
              <Ionicons
                name="document-text-outline"
                size={18}
                color={isDarkMode ? "#a0aec0" : "#718096"}
                className="dark:text-gray-400"
              />
              <Text
                className={`ml-2 text-sm font-medium flex-1 ${
                  isDarkMode ? "text-gray-400" : "text-gray-600"
                }`}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {item.hinh_thuc_thi}
              </Text>
            </View>
            <View className="flex-row items-center">
              <Ionicons
                name="location-outline"
                size={18}
                color={isDarkMode ? "#a0aec0" : "#718096"}
                className="dark:text-gray-400"
              />
              <Text
                className={`ml-2 text-sm font-medium flex-1 ${
                  isDarkMode ? "text-gray-400" : "text-gray-600"
                }`}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {item.phong_thi}
              </Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      );
    },
    [setSelectedExam, setExamModalVisible]
  );

  // Hàm render mục ngày trong tuần
  const memoizedCalendar = useMemo(
    () => (
      <ScrollView>
        <Calendar
          allowLunarDates={true}
          onDayPress={handleDayPress}
          markedDates={{
            [selectedDate]: {
              selected: true,
              disableTouchEvent: true,
              selectedColor: isDarkMode ? "#3B82F6" : "#2563EB",
              selectedTextColor: "#FFFFFF",
            },
            ...examData.reduce((acc, exam) => {
              const examDate = convertDateFormat(exam.ngay_thi);
              acc[examDate] = {
                ...acc[examDate],
                marked: true,
                dotColor: "#FDBA74",
                activeOpacity: 0.8,
              };
              return acc;
            }, {}),
            ...userNotes.reduce((acc, note) => {
              const noteDate = note.date.split("T")[0];
              acc[noteDate] = {
                ...acc[noteDate],
                marked: true,
                dotColor: "#f97316",
              };
              return acc;
            }, {}),
          }}
          firstDay={1}
          style={{
            borderWidth: 1,
            borderColor: isDarkMode ? "#6B7280" : "#E5E7EB", // Màu border dịu mắt
            borderRadius: 10,
            marginTop: 10,
            padding: 15,
          }}
          theme={{
            backgroundColor: isDarkMode ? "#1F2937" : "#FFFFFF", // Màu nền dịu mắt
            calendarBackground: isDarkMode ? "#1F2937" : "#FFFFFF",
            textSectionTitleColor: isDarkMode ? "#94A3B8" : "#4B5563", // Màu tiêu đề dịu mắt
            monthTextColor: isDarkMode ? "#F9FAFB" : "#1F2937", // Màu tháng dịu mắt
            arrowColor: isDarkMode ? "#93C5FD" : "#2563EB", // Màu mũi tên dịu mắt
            todayTextColor: isDarkMode ? "#60A5FA" : "#3B82F6", // Màu hôm nay dịu mắt
            dayTextColor: isDarkMode ? "#F3F4F6" : "#374151", // Màu ngày dịu mắt
            textDisabledColor: isDarkMode ? "#6B7280" : "#9CA3AF", // Màu ngày bị vô hiệu hóa dịu mắt
            selectedDayBackgroundColor: isDarkMode ? "#3B82F6" : "#2563EB", // Màu ngày được chọn dịu mắt
            selectedDayTextColor: "#FFFFFF",
            dotColor: "#FDBA74", // Màu chấm dịu mắt
            selectedDotColor: "#FFFFFF",
          }}
          dayComponent={({ date, state }) => {
            const dateParts = date.dateString.split("-");
            const solarDate = new Date(
              `${dateParts[0]}-${dateParts[1]}-${dateParts[2]}T00:00:00Z`
            );
            const lunar_Date = new SolarDate(new Date(solarDate));
            const lunarDate = lunar_Date.toLunarDate();

            return (
              <TouchableOpacity
                onPress={() => handleDayPress(date)}
                style={{
                  width: 40,
                  height: 40,
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 20,
                  backgroundColor:
                    selectedDate === date.dateString
                      ? isDarkMode
                        ? "#3B82F6"
                        : "#2563EB" // Màu nền ngày được chọn dịu mắt
                      : state === "today"
                      ? isDarkMode
                        ? "#3B82F620"
                        : "#2563EB20" // Màu nền hôm nay dịu mắt
                      : "transparent",
                }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: state === "today" ? "bold" : "normal",
                    color:
                      selectedDate === date.dateString
                        ? "#FFFFFF"
                        : state === "disabled"
                        ? isDarkMode
                          ? "#6B7280"
                          : "#9CA3AF" // Màu chữ ngày bị vô hiệu hóa dịu mắt
                        : isDarkMode
                        ? "#D1D5DB"
                        : "#374151", // Màu chữ ngày dịu mắt
                  }}
                >
                  {date.day}
                </Text>
                <Text
                  style={{
                    fontSize: 10,
                    color: isDarkMode ? "#9CA3AF" : "#9CA3AF",
                  }}
                >
                  {lunarDate.day}/{lunarDate.month}
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "center",
                    marginTop: 4,
                  }}
                >
                  {[
                    ...Array(
                      Math.min(3, getNumberOfClassesForDay(date.dateString))
                    ),
                  ].map((_, i) => (
                    <View
                      key={`class-${i}`}
                      style={{
                        width: 6,
                        height: 6,
                        backgroundColor: "#10B981",
                        borderRadius: 3,
                        marginHorizontal: 1,
                      }}
                    />
                  ))}
                  {[
                    ...Array(
                      Math.min(3, getNumberOfExamsForDay(date.dateString))
                    ),
                  ].map((_, i) => (
                    <View
                      key={`exam-${i}`}
                      style={{
                        width: 6,
                        height: 6,
                        backgroundColor: "#EF4444",
                        borderRadius: 3,
                        marginHorizontal: 1,
                      }}
                    />
                  ))}
                  {[
                    ...Array(
                      Math.min(3, getNumberOfNotesForDay(date.dateString))
                    ),
                  ].map((_, i) => (
                    <View
                      key={`note-${i}`}
                      style={{
                        width: 6,
                        height: 6,
                        backgroundColor: "#F59E0B",
                        borderRadius: 3,
                        marginHorizontal: 1,
                      }}
                    />
                  ))}
                </View>
              </TouchableOpacity>
            );
          }}
        />
      </ScrollView>
    ),
    [
      selectedDate,
      handleDayPress,
      getNumberOfClassesForDay,
      getNumberOfExamsForDay,
      examData,
      convertDateFormat,
      isDarkMode,
      userNotes,
    ]
  );

  // Hàm render ghi chú

  const renderNoteItem = useCallback(
    ({ item, isDarkMode }) => {
      const formatTime = (dateString) => {
        const date = new Date(dateString);
        const hours = date.getHours().toString().padStart(2, "0");
        const minutes = date.getMinutes().toString().padStart(2, "0");
        return `${hours}:${minutes}`;
      };

      const formattedTime = formatTime(item.date);

      return (
        <TouchableOpacity
          onPress={() => {
            setSelectedNote(item);
            setNoteModalVisible(true);
          }}
          className="mb-4"
        >
          <LinearGradient
            colors={
              isDarkMode ? ["#2c3e50", "#34495e"] : ["#e0f2f1", "#b2dfdb"]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className={`p-4 rounded-3xl shadow-md ${
              isDarkMode ? "dark:shadow-lg dark:bg-gray-800" : "bg-white"
            } ${
              isDarkMode
                ? "dark:border-2 dark:border-teal-300"
                : "border-2 border-teal-200"
            }`}
          >
            <View className="flex-row justify-between items-center mb-3">
              <View
                className={`px-3 py-1 rounded-full ${
                  isDarkMode ? "bg-teal-700" : "bg-teal-400"
                }`}
              >
                <Text
                  className={`font-semibold text-xs ${
                    isDarkMode ? "text-gray-200" : "text-white"
                  }`}
                >
                  Ghi chú
                </Text>
              </View>
              <View
                className={`px-3 py-1 rounded-full ${
                  isDarkMode ? "bg-gray-600" : "bg-gray-200"
                }`}
              >
                <Text
                  className={`text-sm font-medium ${
                    isDarkMode ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  {formattedTime}
                </Text>
              </View>
            </View>
            <Text
              className={`text-xl font-bold mb-2 leading-tight ${
                isDarkMode ? "text-gray-200" : "text-gray-800"
              }`}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {item.title}
            </Text>
            <Text
              className={`text-sm ${
                isDarkMode ? "text-gray-300" : "text-gray-600"
              }`}
              numberOfLines={3}
              ellipsizeMode="tail"
            >
              {item.content}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      );
    },
    [setSelectedNote, setNoteModalVisible]
  );

  // Hàm render mục ngày trong tuần
  const WeekDayButton = useCallback(
    ({ day, isDarkMode }) => {
      // Thêm isDarkMode vào props
      const { width } = useWindowDimensions();
      const buttonWidth = (width - 32) / 7 - 8;

      // Kiểm tra định dạng của chuỗi ngày tháng
      if (!day.dateString || !/^\d{4}-\d{2}-\d{2}$/.test(day.dateString)) {
        console.error("Invalid date format:", day.dateString);
        return null;
      }

      // Tạo đối tượng Date từ chuỗi ngày tháng
      const dateParts = day.dateString.split("-");
      const solarDate = new Date(
        `${dateParts[0]}-${dateParts[1]}-${dateParts[2]}T00:00:00Z`
      );

      // Kiểm tra xem đối tượng Date có hợp lệ không
      if (isNaN(solarDate.getTime())) {
        console.error("Invalid Date:", solarDate);
        return null;
      }

      // Sử dụng SolarDate và LunarDate
      const lunar_Date = new SolarDate(new Date(solarDate));
      const lunarDate = lunar_Date.toLunarDate();

      return (
        <TouchableOpacity
          onPress={() => handleDayPress(day)}
          style={{ width: buttonWidth }}
          className={`p-2 rounded-2xl mr-1 ${
            selectedDate === day.dateString
              ? isDarkMode
                ? "bg-blue-500"
                : "bg-blue-600" // Màu xanh dịu mắt hơn
              : isDarkMode
              ? "bg-gray-700"
              : "bg-gray-200" // Màu nền xám nhạt hơn cho chế độ sáng
          }`}
        >
          <Text
            className={`text-xs font-medium text-center ${
              selectedDate === day.dateString
                ? "text-white"
                : isDarkMode
                ? "text-gray-300"
                : "text-gray-600" // Màu chữ xám đậm hơn cho chế độ sáng
            }`}
            numberOfLines={1}
          >
            {day.dayOfWeek}
          </Text>
          <Text
            className={`text-center font-bold ${
              selectedDate === day.dateString
                ? "text-white"
                : isDarkMode
                ? "text-gray-300"
                : "text-gray-800" // Màu chữ xám đậm hơn cho chế độ sáng
            }`}
          >
            {day.dayOfMonth}{" "}
            <Text
              className="text-[8px] font-normal ml-1"
              style={{ position: "relative", top: -3 }}
            >
              ({lunarDate.day}/{lunarDate.month})
            </Text>
          </Text>
          <View className="flex-row justify-center mt-1">
            {[
              ...Array(Math.min(2, getNumberOfClassesForDay(day.dateString))),
            ].map((_, i) => (
              <View
                key={`class-${i}`}
                className="w-1 h-1 bg-green-500 rounded-full mx-0.5" // Màu xanh lá cây dịu mắt hơn
              />
            ))}
            {[
              ...Array(Math.min(2, getNumberOfExamsForDay(day.dateString))),
            ].map((_, i) => (
              <View
                key={`exam-${i}`}
                className="w-1 h-1 bg-red-500 rounded-full mx-0.5" // Màu đỏ dịu mắt hơn
              />
            ))}
            {[
              ...Array(Math.min(2, getNumberOfNotesForDay(day.dateString))),
            ].map((_, i) => (
              <View
                key={`note-${i}`}
                className="w-1 h-1 bg-orange-500 rounded-full mx-0.5"
              />
            ))}
          </View>
        </TouchableOpacity>
      );
    },
    [
      selectedDate,
      handleDayPress,
      getNumberOfClassesForDay,
      getNumberOfExamsForDay,
      getNumberOfNotesForDay,
    ]
  ); // Thêm isDarkMode vào dependency array

  // Hàm render
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
        <LinearGradient
          colors={
            isDarkMode
              ? ["#1e293b", "#334155", "#475569"]
              : ["#ebf8ff", "#dbeafe", "#bfdbfe"]
          }
          className={`px-4 pt-12 flex-row justify-between items-center mb-4 ${
            isDarkMode ? "dark:bg-[#1f2937]" : "bg-[#f0f9ff]"
          } rounded-b-3xl`}
        >
          <Text
            className={`text-3xl font-bold ${
              isDarkMode ? "text-blue-400" : "text-blue-500"
            } text-center mb-4`}
          >
            Thời Khoá Biểu
          </Text>
          <TouchableOpacity
            className={`bg-opacity-20 p-2 rounded-full ${
              isDarkMode ? "bg-gray-700" : "bg-blue-100"
            } mb-4`}
            onPress={handleResetData}
            disabled={isLoading}
          >
            <Ionicons
              name="refresh"
              size={24}
              color={isDarkMode ? "#93c5fd" : "#60a5fa"}
            />
          </TouchableOpacity>
        </LinearGradient>
        <PanGestureHandler
          onHandlerStateChange={handleSwipe}
          activeOffsetX={[-20, 20]}
        >
          <View className="flex-1 px-4">
            <View
              className={`rounded-3xl shadow-lg p-4 mb-6 ${
                isDarkMode ? "bg-gray-800" : "bg-white"
              }`}
            >
              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={
                  currentWeekStartDate ? getWeekDays(currentWeekStartDate) : []
                }
                renderItem={({ item: day }) => (
                  <WeekDayButton day={day} isDarkMode={isDarkMode} />
                )}
                keyExtractor={(day) => day.dateString}
                className="mb-4"
              />
              <TouchableOpacity
                onPress={() => setCalendarExpanded(!calendarExpanded)}
                className={`flex-row items-center justify-center py-3 rounded-full ${
                  isDarkMode ? "bg-gray-900" : "bg-gray-300"
                }`}
              >
                <Text
                  className={`font-medium mr-2 ${
                    isDarkMode ? "text-white" : "text-gray-800"
                  }`}
                >
                  {calendarExpanded ? "Thu gọn" : "Xem lịch tháng"}
                </Text>
                <Ionicons
                  name={calendarExpanded ? "chevron-up" : "chevron-down"}
                  size={20}
                  color={isDarkMode ? "#ffffff" : "#374151"}
                />
              </TouchableOpacity>
              {calendarExpanded && memoizedCalendar}
            </View>
            <FlatList
              data={[
                ...getScheduleForDate(),
                ...getExamsForDate(),
                ...userNotes.filter(
                  (note) => note.date.split("T")[0] === selectedDate
                ),
              ]}
              renderItem={({ item }) =>
                item.ca_thi
                  ? renderExamItem({ item, isDarkMode })
                  : item.content
                  ? renderNoteItem({ item, isDarkMode })
                  : renderClassItem({ item, isDarkMode })
              }
              keyExtractor={(item, index) => `${item.id || item.STT}-${index}`}
              ListEmptyComponent={
                <View
                  className={`p-6 rounded-3xl shadow-md ${
                    isDarkMode ? "bg-gray-900" : "bg-gray-300"
                  } ${
                    isDarkMode
                      ? "dark:border-2 dark:border-gray-700"
                      : "border-2 border-gray-500"
                  }`}
                >
                  <Text
                    className={`text-center italic text-lg ${
                      isDarkMode ? "text-gray-200" : "text-gray-800"
                    }`}
                  >
                    Không có lớp học, lịch thi hoặc ghi chú nào trong ngày này.
                  </Text>
                  <Text
                    className={`text-center italic mt-3 text-base ${
                      isDarkMode ? "text-orange-500" : "text-orange-600"
                    }`}
                  >
                    Bạn có thể vuốt sang trái hoặc phải để xem lịch của các ngày
                    khác hoặc nhấn vào dấu + để thêm ghi chú.
                  </Text>
                </View>
              }
            />
            <View className="absolute bottom-4 right-4">
              <TouchableOpacity
                onPress={toggleDropdown}
                className={`p-4 rounded-full ${
                  isDarkMode ? "bg-blue-500" : "bg-blue-600"
                }`}
              >
                <Ionicons
                  name={isOpen ? "close" : "document-text-outline"}
                  size={24}
                  color="white"
                />
              </TouchableOpacity>

              {isOpen && (
                <View
                  className={`absolute bottom-16 right-0 rounded-lg shadow-lg ${
                    isDarkMode ? "bg-gray-800" : "bg-white"
                  }`}
                  style={{
                    width: isSmallScreen ? 160 : 200,
                  }}
                >
                  <TouchableOpacity
                    onPress={() => handleOptionSelect("note")}
                    className={`flex-row items-center px-4 py-3 ${
                      isDarkMode
                        ? "border-b border-gray-700"
                        : "border-b border-gray-200"
                    }`}
                  >
                    <Ionicons
                      name="document-text-outline"
                      size={isSmallScreen ? 20 : 24}
                      color={isDarkMode ? "white" : "black"}
                    />
                    <Text
                      className={`ml-3 ${
                        isDarkMode ? "text-white" : "text-black"
                      } ${isSmallScreen ? "text-sm" : "text-base"}`}
                    >
                      Thêm ghi chú
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleOptionSelect("other")}
                    className="flex-row items-center px-4 py-3"
                  >
                    <Ionicons
                      name="reload"
                      size={isSmallScreen ? 20 : 24}
                      color={isDarkMode ? "white" : "black"}
                    />
                    <Text
                      className={`ml-3 ${
                        isDarkMode ? "text-white" : "text-black"
                      } ${isSmallScreen ? "text-sm" : "text-base"}`}
                    >
                      Tải lại dữ liệu ghi chú
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </PanGestureHandler>
        <Modal
          animationType="slide"
          transparent={true}
          visible={noteModalVisible}
          onRequestClose={() => setNoteModalVisible(false)}
        >
          <View
            className="flex-1 justify-center items-center bg-opacity-25 block"
            style={{ backgroundColor: "rgba(0, 0, 0, 0.6)" }}
          >
            <LinearGradient
              colors={
                isDarkMode ? ["#2c3e50", "#34495e"] : ["#e0f2f1", "#b2dfdb"]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className={`p-4 rounded-3xl shadow-md ${
                isDarkMode ? "dark:shadow-lg dark:bg-gray-800" : "bg-white"
              } ${
                isDarkMode
                  ? "dark:border-2 dark:border-teal-300"
                  : "border-2 border-teal-200"
              }`}
            >
              <View className="rounded-lg p-6 w-11/12 max-h-5/6">
                <ScrollView>
                  {selectedNote && (
                    <>
                      <Text
                        className={`text-center text-2xl font-bold mb-4 ${
                          isDarkMode ? "text-teal-300" : "text-teal-600"
                        }`}
                      >
                        {selectedNote.title}
                      </Text>
                      <Text
                        className={`text-lg mb-4 ${
                          isDarkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        {selectedNote.content}
                      </Text>
                      <Text
                        className={`text-sm ${
                          isDarkMode ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        Ngày: {new Date(selectedNote.date).toLocaleDateString()}{" "}
                        Giờ: {new Date(selectedNote.date).toLocaleTimeString()}
                      </Text>
                      <TouchableOpacity
                        onPress={() => handleDeleteNote(selectedNote.id)}
                        className={`py-2 px-4 rounded-full mt-4 ${
                          isDarkMode ? "bg-red-700" : "bg-red-500"
                        }`}
                      >
                        <Text className="text-white text-center font-bold">
                          Xóa
                        </Text>
                      </TouchableOpacity>
                    </>
                  )}
                </ScrollView>
                <TouchableOpacity
                  onPress={() => setNoteModalVisible(false)}
                  className={`py-2 px-4 rounded-full mt-4 ${
                    isDarkMode ? "bg-teal-700" : "bg-teal-500"
                  }`}
                >
                  <Text className="text-white text-center font-bold">Đóng</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
        </Modal>
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View
            className={`flex-1 justify-center items-center bg-opacity-25 block `}
            style={{ backgroundColor: "rgba(0, 0, 0, 0.8)" }}
          >
            <LinearGradient
              colors={
                isDarkMode ? ["#2c3e50", "#34495e"] : ["#e0ffff", "#cce0ff"]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className={`p-4 rounded-3xl shadow-md ${
                isDarkMode ? "dark:shadow-lg dark:bg-gray-800" : "bg-white"
              } ${
                isDarkMode
                  ? "dark:border-2 dark:border-sky-300"
                  : "border-2 border-sky-700"
              }`}
            >
              <View className={`rounded-lg p-6 w-11/12 max-h-5/6`}>
                <ScrollView>
                  {selectedClass && (
                    <>
                      <Text
                        className={`text-center text-2xl font-bold mb-4 ${
                          isDarkMode ? "text-gray-300" : "text-gray-800"
                        }`}
                      >
                        {selectedClass["lop_hoc_phan"]}
                      </Text>
                      <Text
                        className={`text-lg mb-2 ${
                          isDarkMode ? "text-gray-500" : "text-gray-700"
                        }`}
                      >
                        <Text className="font-semibold">Môn học:</Text>{" "}
                        <Text
                          className={`text-sky-500 ${
                            isDarkMode ? "dark:text-sky-400" : ""
                          }`}
                        >
                          {selectedClass["lop_hoc_phan"]}
                        </Text>
                      </Text>
                      <Text
                        className={`text-lg mb-2 ${
                          isDarkMode ? "text-gray-500" : "text-gray-700"
                        }`}
                      >
                        <Text className="font-semibold">Giảng viên:</Text>{" "}
                        <Text className="text-sky-500">
                          {selectedClass["giang_vien"]}
                        </Text>
                      </Text>
                      <Text
                        className={`text-lg mb-2 ${
                          isDarkMode ? "text-gray-500" : "text-gray-700"
                        }`}
                      >
                        <Text className="font-semibold">Địa điểm:</Text>{" "}
                        <Text className="text-sky-500">
                          {selectedClass["dia_diem"]}
                        </Text>
                      </Text>
                      <Text
                        className={`text-lg mb-2 ${
                          isDarkMode ? "text-gray-500" : "text-gray-700"
                        }`}
                      >
                        <Text className="font-semibold">Thời gian:</Text>{" "}
                        <Text className="text-sky-500">
                          {selectedClass["tiet_hoc"]} (
                          {selectedClass["startTime"]} -{" "}
                          {selectedClass["endTime"]})
                        </Text>
                      </Text>
                      <Text
                        className={`text-lg mb-2 ${
                          isDarkMode ? "text-gray-500" : "text-gray-700"
                        }`}
                      >
                        <Text className="font-semibold">Tuần học:</Text>{" "}
                        <Text className="text-sky-500">
                          {selectedClass["tuan_hoc"]}
                        </Text>
                      </Text>
                    </>
                  )}
                </ScrollView>
                <TouchableOpacity
                  onPress={() => setModalVisible(false)}
                  className={`py-2 px-4 rounded-full mt-4 ${
                    isDarkMode ? "bg-blue-500" : "bg-blue-600"
                  }`}
                >
                  <Text className="text-white text-center font-bold">Đóng</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
        </Modal>
        <Modal
          animationType="slide"
          transparent={true}
          visible={examModalVisible}
          onRequestClose={() => setExamModalVisible(false)}
        >
          <View
            className="flex-1 justify-center items-center bg-opacity-25 block"
            style={{ backgroundColor: "rgba(0, 0, 0, 0.8)" }}
          >
            <LinearGradient
              colors={
                isDarkMode ? ["#434343", "#000000"] : ["#ffdab9", "#ffe4c4"]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className={`p-4 rounded-3xl shadow-md ${
                isDarkMode ? "dark:shadow-lg dark:bg-gray-800" : "bg-white"
              } ${
                isDarkMode
                  ? "dark:border-2 dark:border-yellow-800"
                  : "border-2 border-yellow-700"
              }`}
            >
              <View className="rounded-lg p-6 w-11/12 max-h-5/6">
                <ScrollView>
                  {selectedExam && (
                    <>
                      <Text
                        className={`text-center text-2xl font-bold mb-4 ${
                          isDarkMode ? "text-red-400" : "text-red-600"
                        }`}
                      >
                        {selectedExam.ten_hoc_phan}
                      </Text>
                      <Text
                        className={`text-lg mb-2 ${
                          isDarkMode ? "text-gray-500" : "text-gray-700"
                        }`}
                      >
                        <Text className="font-semibold">Mã học phần:</Text>{" "}
                        <Text
                          className={`text-sky-500 ${
                            isDarkMode ? "dark:text-sky-400" : ""
                          }`}
                        >
                          {selectedExam.ma_hoc_phan}
                        </Text>
                      </Text>
                      <Text
                        className={`text-lg mb-2 ${
                          isDarkMode ? "text-gray-500" : "text-gray-700"
                        }`}
                      >
                        <Text className="font-semibold">Ngày thi:</Text>{" "}
                        <Text className="text-sky-500">
                          {selectedExam.ngay_thi}
                        </Text>
                      </Text>
                      <Text
                        className={`text-lg mb-2 ${
                          isDarkMode ? "text-gray-500" : "text-gray-700"
                        }`}
                      >
                        <Text className="font-semibold">Ca thi:</Text>{" "}
                        <Text className="text-sky-500">
                          {selectedExam.ca_thi}
                        </Text>
                      </Text>
                      <Text
                        className={`text-lg mb-2 ${
                          isDarkMode ? "text-gray-500" : "text-gray-700"
                        }`}
                      >
                        <Text className="font-semibold">Phòng thi:</Text>{" "}
                        <Text className="text-sky-500">
                          {selectedExam.phong_thi}
                        </Text>
                      </Text>
                      <Text
                        className={`text-lg mb-2 ${
                          isDarkMode ? "text-gray-500" : "text-gray-700"
                        }`}
                      >
                        <Text className="font-semibold">Hình thức thi:</Text>{" "}
                        <Text className="text-sky-500">
                          {selectedExam.hinh_thuc_thi}
                        </Text>
                      </Text>
                      <Text
                        className={`text-lg mb-2 ${
                          isDarkMode ? "text-gray-500" : "text-gray-700"
                        }`}
                      >
                        <Text className="font-semibold">Số báo danh:</Text>{" "}
                        <Text className="text-sky-500">
                          {selectedExam.so_bao_danh}
                        </Text>
                      </Text>
                      <Text
                        className={`text-lg mb-2 ${
                          isDarkMode ? "text-gray-500" : "text-gray-700"
                        }`}
                      >
                        <Text className="font-semibold">Số tín chỉ:</Text>{" "}
                        <Text className="text-sky-500">
                          {selectedExam.so_tc}
                        </Text>
                      </Text>
                      {selectedExam.ghi_chu && (
                        <Text
                          className={`text-lg mb-2 ${
                            isDarkMode ? "text-gray-500" : "text-gray-700"
                          }`}
                        >
                          <Text className="font-semibold">Ghi chú:</Text>{" "}
                          {selectedExam.ghi_chu}
                        </Text>
                      )}
                    </>
                  )}
                </ScrollView>
                <TouchableOpacity
                  onPress={() => setExamModalVisible(false)}
                  className={`py-2 px-4 rounded-full mt-4 ${
                    isDarkMode ? "bg-red-500" : "bg-red-600"
                  }`}
                >
                  <Text className="text-white text-center font-bold">Đóng</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
        </Modal>
        {notification && (
          <ModalComponent
            visible={notification}
            onClose={() => setNotification(null)}
            title="Cập nhật dữ liệu"
            content="Dữ liệu đã được cập nhật thành công."
            closeText="Đóng"
            closeColor="bg-blue-500"
          />
        )}
      </LinearGradient>
      <Modal
        transparent={true}
        animationType="fade"
        visible={isLoading}
        onRequestClose={() => {}}
      >
        <View
          className="flex-1 justify-center items-center bg-opacity-50"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.8)" }}
        >
          <View
            className={`p-6 rounded-3xl shadow-3xl ${
              isDarkMode ? "bg-gray-900" : "bg-white"
            } ${
              isDarkMode
                ? "dark:border-2 dark:border-gray-700"
                : "border-2 border-gray-500"
            }`}
          >
            <ActivityIndicator
              size="large"
              color={isDarkMode ? "#2563EB" : "#007aff"}
            />
            <Text
              className={`mt-4 font-medium text-center text-2xl ${
                isDarkMode ? "text-gray-300" : "text-gray-800"
              }`}
            >
              Đang tải dữ liệu...
            </Text>
            <Text
              className={`mt-2 text-base text-center ${
                isDarkMode ? "text-gray-500" : "text-gray-600"
              }`}
            >
              Vui lòng đợi trong giây lát để hệ thống cập nhật dữ liệu mới nhất
              quá trình này có thế mất tối đa 1 phút, vui lòng không tắt ứng
              dụng hoặc mạng trong quá trình này.
            </Text>
          </View>
        </View>
      </Modal>
    </GestureHandlerRootView>
  );
}
