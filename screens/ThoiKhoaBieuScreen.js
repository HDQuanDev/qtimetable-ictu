import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { View, Text, TouchableOpacity, FlatList, Modal, ScrollView, Alert, ActivityIndicator, Animated, Linking, useWindowDimensions  } from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../AuthContext';
import { GestureHandlerRootView, PanGestureHandler, State } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api_ictu } from '../services/api';
import { checkForUpdate } from '../components/CheckUpdate';
import ModalComponent from '../components/ModalComponent';

// Cấu hình ngôn ngữ cho lịch
LocaleConfig.locales['vi'] = {
  monthNames: ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'],
  monthNamesShort: ['Th1', 'Th2', 'Th3', 'Th4', 'Th5', 'Th6', 'Th7', 'Th8', 'Th9', 'Th10', 'Th11', 'Th12'],
  dayNames: ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'],
  dayNamesShort: ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'],
  today: 'Hôm nay'
};
LocaleConfig.defaultLocale = 'vi';

// Định nghĩa các khung giờ học trong ngày
const periods = {
  1: { start: '6:45', end: '7:35' },
  2: { start: '7:40', end: '8:30' },
  3: { start: '8:40', end: '9:30' },
  4: { start: '9:40', end: '10:30' },
  5: { start: '10:35', end: '11:25' },
  6: { start: '13:00', end: '13:50' },
  7: { start: '13:55', end: '14:45' },
  8: { start: '14:50', end: '15:40' },
  9: { start: '15:55', end: '16:45' },
  10: { start: '16:50', end: '17:40' },
  11: { start: '18:15', end: '19:05' },
  12: { start: '19:10', end: '20:00' },
  13: { start: '20:10', end: '21:00' },
  14: { start: '21:10', end: '22:00' },
  15: { start: '22:10', end: '23:00' },
  16: { start: '23:30', end: '00:20' },
};

export default function ThoiKhoaBieuScreen() {

  // Cấu hình các biến state và hook cần thiết
  const { logout } = useAuth();
  const [scheduleData, setScheduleData] = useState([]);
  const [examData, setExamData] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [calendarExpanded, setCalendarExpanded] = useState(false);
  const [currentWeekStartDate, setCurrentWeekStartDate] = useState(null);
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedExam, setSelectedExam] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [examModalVisible, setExamModalVisible] = useState(false);
  const [user, setUser] = useState({});
  const [lastUpdateTime, setLastUpdateTime] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isMenuVisible, setMenuVisible] = useState(false);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [isAboutModalVisible, setAboutModalVisible] = useState(false);
  const [isChangelogModalVisible, setChangelogModalVisible] = useState(false);
  const [modalProps, setModalProps] = useState(null);
  const [notification, setNotification] = useState(null);
  const openMenu = () => {
    setMenuVisible(true);
  };
  const closeMenu = () => {
    setMenuVisible(false);
  };

  // Hàm xử lý khi chọn các tùy chọn
  const handleMenuOption = async (option) => {
    switch (option) {
      case 'source':
        Linking.openURL('https://github.com/HDQuanDev/qtimetable-ictu');
        break;
      case 'contact':
        Linking.openURL('https://facebook.com/quancp72h');
        break;
      case 'aichat':
        Linking.openURL('https://ai.quanhd.net/');
        break;
      case 'update':
        const updateInfo = await checkForUpdate('all');
        setModalProps(updateInfo);
        break;
      default:
        break;
    }
  };

  // Hàm xử lý dữ liệu khi mở ứng dụng
  useEffect(() => {
    const fetchData = async () => {
      await fetchScheduleData();
      await fetchExamData();
      await fetchUserInfo();
      await fetchTimeUpdate();
      const today = new Date();
      today.setHours(today.getHours() + 7);
      const todayDateString = today.toISOString().split('T')[0];
      setSelectedDate(todayDateString);
      setCurrentWeekStartDate(getWeekStartDate(todayDateString));
    };
    fetchData();
  }, []);

  // Hàm xử lý lấy dữ liệu thời khóa biểu từ bộ nhớ đệm
  const fetchScheduleData = async () => {
    try {
      const data = await AsyncStorage.getItem('userData_ThoiKhoaBieu');
      if (data) {
        setScheduleData(JSON.parse(data));
      }
    } catch (error) {
      console.error('Error fetching schedule data:', error);
    }
  };

  // Hàm xử lý lấy dữ liệu lịch thi từ bộ nhớ đệm
  const fetchExamData = async () => {
    try {
      const data = await AsyncStorage.getItem('userData_LichThi');
      if (data) {
        setExamData(JSON.parse(data));
      }
    } catch (error) {
      console.error('Error fetching exam data:', error); 
    }
  };

  // Hàm xử lý lấy thông tin người dùng từ bộ nhớ đệm
  const fetchUserInfo = async () => {
    try {
      const userInfo = await AsyncStorage.getItem('userInfo');
      if (userInfo) {
        setUser(JSON.parse(userInfo));
      }
    } catch (error) {
      console.error('Error fetching user info:', error);
    }
  };

  // Hàm xử lý lấy thời gian cập nhật cuối cùng từ bộ nhớ đệm
  const fetchTimeUpdate = async () => {
    try {
      const lastUpdate = await AsyncStorage.getItem('lastUpdate');
      if (lastUpdate) {
        setLastUpdateTime(lastUpdate);
      }
    } catch (error) {
      console.error('Error fetching last update time:', error);
    }
  };

  // Hàm chuyển đổi định dạng ngày
  const convertDateFormat = useCallback((dateString) => {
    const [day, month, year] = dateString.split('/');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }, []);

  // Hàm lấy ngày bắt đầu của tuần
  const getWeekStartDate = useCallback((dateString) => {
    const date = new Date(dateString);
    date.setHours(date.getHours() + 7);
    const dayOfWeek = date.getDay();
    const diff = date.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    return new Date(date.setDate(diff)).toISOString().split('T')[0];
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
    const dayOfWeekMapping = ['CN', '2', '3', '4', '5', '6', '7'];
    const selectedDayString = dayOfWeekMapping[selectedDateObj.getDay()];
    return selectedWeek.data.filter((item) => item['thu'] === selectedDayString);
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
  const getNumberOfClassesForDay = useCallback((date) => {
    const dateObj = new Date(date);
    const week = scheduleData.find((w) => {
      const startDateObj = new Date(convertDateFormat(w.start_date));
      const endDateObj = new Date(convertDateFormat(w.end_date));
      return dateObj >= startDateObj && dateObj <= endDateObj;
    });
    if (!week) return 0;
    const dayOfWeekMapping = ['CN', '2', '3', '4', '5', '6', '7'];
    const dayString = dayOfWeekMapping[dateObj.getDay()];
    return week.data.filter((item) => item['thu'] === dayString).length;
  }, [scheduleData, convertDateFormat]);

  // Hàm lấy số lớp học cho ngày đã chọn
  const getNumberOfExamsForDay = useCallback((date) => {
    return examData.filter((exam) => convertDateFormat(exam.ngay_thi) === date).length;
  }, [examData, convertDateFormat]);
  const getWeekDays = useCallback((startDate) => {
    const days = [];
    const startDateObj = new Date(startDate);
    for (let i = 0; i < 7; i++) {
      const day = new Date(startDateObj);
      day.setDate(startDateObj.getDate() + i);
      days.push({
        dateString: day.toISOString().split('T')[0],
        dayOfWeek: day.toLocaleDateString('vi-VN', { weekday: 'short' }),
        dayOfMonth: day.getDate(),
      });
    }
    return days;
  }, []);

  // Hàm xử lý khi chọn ngày trên lịch
  const handleDayPress = useCallback(async (day) => {
    setSelectedDate(day.dateString);
    setCalendarExpanded(false);
    setCurrentWeekStartDate(getWeekStartDate(day.dateString));
  }, [getWeekStartDate]);

  // Hàm xử lý khi vuốt trên lịch
  const handleSwipe = useCallback(async (event) => {
    if (event.nativeEvent.state === State.END) {
      let newDate = new Date(selectedDate);
      if (event.nativeEvent.translationX > 50) {
        newDate.setDate(newDate.getDate() - 1);
      } else if (event.nativeEvent.translationX < -50) {
        newDate.setDate(newDate.getDate() + 1);
      } else {
        return;
      }
      const newDateString = newDate.toISOString().split('T')[0];
      await handleDayPress({ dateString: newDateString });
      const newWeekStartDate = getWeekStartDate(newDateString);
      if (newWeekStartDate !== currentWeekStartDate) {
        setCurrentWeekStartDate(newWeekStartDate);
      }
    }
  }, [selectedDate, handleDayPress, getWeekStartDate, currentWeekStartDate]);

  // Hàm xử lý khi nhấn nút reset dữ liệu
  const handleResetData = useCallback(async () => {
    setIsLoading(true);
    try {
      await api_ictu(await AsyncStorage.getItem('username'), await AsyncStorage.getItem('password'), 'reset');
      await AsyncStorage.setItem('lastUpdate', new Date().toLocaleString('vi-VN'));
      await fetchScheduleData();
      await fetchExamData();
      await fetchUserInfo();
      await fetchTimeUpdate();
      setNotification(true);
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể cập nhật dữ liệu: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Hàm render mục thời khóa biểu
  const renderClassItem = useCallback(({ item }) => {
    const [startPeriod, endPeriod] = item['tiet_hoc'].split(' --> ').map(Number);
    const startTime = periods[startPeriod].start;
    const endTime = periods[endPeriod].end;
    const selectedClass = { ...item, startTime, endTime };
    return (
      <TouchableOpacity
        onPress={() => {
          setSelectedClass(selectedClass);
          setModalVisible(true);
        }}
        className="mb-4 mx-2"
      >
        <LinearGradient
          colors={['#2c2c2c', '#1f1f1f']} // Các màu tối cho gradient
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="p-4 rounded-3xl shadow-md"
        >
          <View className="flex-row justify-between items-center mb-3">
            <View className="bg-gray-700 px-3 py-1 rounded-full"> 
              <Text className="text-white font-semibold text-xs">Lịch Học</Text>
            </View>
            <View className="bg-gray-600 px-3 py-1 rounded-full">
              <Text className="text-white font-semibold text-xs">{startTime} - {endTime}</Text>
            </View>
          </View>
          <Text className="text-xl font-bold text-white mb-3 leading-tight" numberOfLines={2} ellipsizeMode="tail">
            {item['lop_hoc_phan']}
          </Text>
          <View className="flex-row items-center mb-2">
            <Ionicons name="person-outline" size={18} color="#a0aec0" />
            <Text className="text-gray-400 ml-2 text-sm font-medium flex-1" numberOfLines={1} ellipsizeMode="tail">
              {item['giang_vien']}
            </Text>
          </View>
          <View className="flex-row items-center">
            <Ionicons name="location-outline" size={18} color="#a0aec0" />
            <Text className="text-gray-400 ml-2 text-sm font-medium flex-1" numberOfLines={1} ellipsizeMode="tail">
              {item['dia_diem']}
            </Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  }, [periods, setSelectedClass, setModalVisible]);
  
  // Hàm render mục lịch thi
  const renderExamItem = useCallback(({ item }) => {
    const [startTime, endTime] = item.ca_thi.match(/\(([^)]+)\)/)[1].split('-');
    return (
      <TouchableOpacity
        onPress={() => {
          setSelectedExam(item);
          setExamModalVisible(true);
        }}
        className="mb-4 mx-2"
      >
        <LinearGradient
          colors={['#2c2c2c', '#1f1f1f']} // Màu nền tối
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="p-4 rounded-3xl shadow-md"
        >
          <View className="flex-row justify-between items-center mb-3">
            <View className="bg-red-600 px-3 py-1 rounded-full">
              <Text className="text-white font-semibold text-xs">Lịch Thi</Text>
            </View>
            <View className="bg-cyan-600 px-3 py-1 rounded-full">
              <Text className="text-white font-semibold text-xs">{startTime} - {endTime}</Text>
            </View>
          </View>
          <Text className="text-xl font-bold text-white mb-3 leading-tight" numberOfLines={2} ellipsizeMode="tail">
            {item.ten_hoc_phan}
          </Text>
          <View className="flex-row items-center mb-2">
            <Ionicons name="code-outline" size={18} color="#a0aec0" />
            <Text className="text-gray-400 ml-2 text-sm font-medium">
              Mã HP: {item.ma_hoc_phan} | SBD: {item.so_bao_danh}
            </Text>
          </View>
          <View className="flex-row items-center mb-2">
            <Ionicons name="document-text-outline" size={18} color="#a0aec0" />
            <Text className="text-gray-400 ml-2 text-sm font-medium flex-1" numberOfLines={1} ellipsizeMode="tail">
              {item.hinh_thuc_thi}
            </Text>
          </View>
          <View className="flex-row items-center">
            <Ionicons name="location-outline" size={18} color="#a0aec0" />
            <Text className="text-gray-400 ml-2 text-sm font-medium flex-1" numberOfLines={1} ellipsizeMode="tail">
              {item.phong_thi}
            </Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  }, [setSelectedExam, setExamModalVisible]);
  
  // Hàm render mục ngày trong tuần
  const memoizedCalendar = useMemo(() => (
    <Calendar
      onDayPress={handleDayPress}
      markedDates={{
        [selectedDate]: {
          selected: true,
          disableTouchEvent: true,
          selectedColor: '#2563EB', 
          selectedTextColor: '#FFFFFF',
        },
        ...examData.reduce((acc, exam) => {
          const examDate = convertDateFormat(exam.ngay_thi);
          acc[examDate] = {
            ...acc[examDate],
            marked: true,
            dotColor: '#EF4444',
            activeOpacity: 0.8, 
          };
          return acc;
        }, {})
      }}
      firstDay={1}
      style={{ borderWidth: 1, borderColor: '#374151', borderRadius: 10, marginTop: 10, padding: 15 }}
      theme={{
        backgroundColor: '#1F2937',
        calendarBackground: '#1F2937',
        textSectionTitleColor: '#94A3B8',
        monthTextColor: '#F9FAFB',
        arrowColor: '#2563EB',
        todayTextColor: '#3B82F6',
        dayTextColor: '#F3F4F6',
        textDisabledColor: '#6B7280',
        selectedDayBackgroundColor: '#2563EB',
        selectedDayTextColor: '#FFFFFF',
        dotColor: '#EF4444',
        selectedDotColor: '#FFFFFF',
      }}
      dayComponent={({ date, state }) => (
        <TouchableOpacity
          onPress={() => handleDayPress(date)}
          style={{
            width: 40,
            height: 40,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 20,
            backgroundColor: selectedDate === date.dateString
              ? '#2563EB'
              : state === 'today' ? '#2563EB20' : 'transparent',
          }}
        >
          <Text
            style={{
              fontSize: 16,
              fontWeight: state === 'today' ? 'bold' : 'normal',
              color: selectedDate === date.dateString
                ? '#FFFFFF'
                : state === 'disabled' ? '#6B7280' : '#D1D5DB',
            }}
          >
            {date.day}
          </Text>
          <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 4 }}>
            {[...Array(Math.min(3, getNumberOfClassesForDay(date.dateString)))].map((_, i) => (
              <View
                key={`class-${i}`}
                style={{
                  width: 6,
                  height: 6,
                  backgroundColor: '#10B981',
                  borderRadius: 3,
                  marginHorizontal: 1,
                }}
              />
            ))}
            {[...Array(Math.min(3, getNumberOfExamsForDay(date.dateString)))].map((_, i) => (
              <View
                key={`exam-${i}`}
                style={{
                  width: 6,
                  height: 6,
                  backgroundColor: '#EF4444',
                  borderRadius: 3,
                  marginHorizontal: 1,
                }}
              />
            ))}
          </View>
        </TouchableOpacity>
      )}
    />
  ), [selectedDate, handleDayPress, getNumberOfClassesForDay, getNumberOfExamsForDay, examData, convertDateFormat]);
  
  // Hàm render mục ngày trong tuần
  const WeekDayButton = useCallback(({ day }) => {
    const { width } = useWindowDimensions();
    const buttonWidth = (width - 32) / 7 - 8;
    return (
      <TouchableOpacity
        onPress={() => handleDayPress(day)}
        style={{ width: buttonWidth }}
        className={`p-2 rounded-2xl mr-1 ${
          selectedDate === day.dateString
            ? 'bg-blue-600'
            : 'bg-gray-700'
        }`}
      >
        <Text 
          className={`text-xs font-medium text-center ${
            selectedDate === day.dateString
              ? 'text-white'
              : 'text-gray-300'
          }`}
          numberOfLines={1}
        >
          {day.dayOfWeek}
        </Text>
        <Text 
          className={`text-center font-bold ${
            selectedDate === day.dateString
              ? 'text-white'
              : 'text-gray-300'
          }`}
        >
          {day.dayOfMonth}
        </Text>
        <View className="flex-row justify-center mt-1">
          {[...Array(Math.min(2, getNumberOfClassesForDay(day.dateString)))].map((_, i) => (
            <View
              key={`class-${i}`}
              className="w-1 h-1 bg-green-400 rounded-full mx-0.5"
            />
          ))}
          {[...Array(Math.min(2, getNumberOfExamsForDay(day.dateString)))].map((_, i) => (
            <View
              key={`exam-${i}`}
              className="w-1 h-1 bg-red-400 rounded-full mx-0.5"
            />
          ))}
        </View>
      </TouchableOpacity>
    );
  }, [selectedDate, handleDayPress, getNumberOfClassesForDay, getNumberOfExamsForDay]);
  
  // Hàm render mục thông tin người dùng
  const UserInfo = ({ user, lastUpdateTime }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const fadeAnim = useRef(new Animated.Value(1)).current;
    const userInfoSections = [
      { label: 'Tên', value: user.name },
      { label: 'Mã sinh viên', value: user.masinhvien },
      { label: 'Ngành', value: user.nganh },
      { label: 'Khóa', value: user.khoa },
      { label: 'Phát triển bởi', value: 'Hứa Đức Quân' },
    ];
    useEffect(() => {
      const animateText = () => {
        Animated.sequence([
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
        ]).start();
      };
      const interval = setInterval(() => {
        animateText();
        setCurrentIndex((prevIndex) => (prevIndex + 1) % userInfoSections.length);
      }, 3000);
      return () => clearInterval(interval);
    }, [fadeAnim, userInfoSections.length]);
    return (
      <View className="bg-gray-800 bg-opacity-60 rounded-3xl p-4 mb-4 shadow-lg">
        <Animated.View style={{ opacity: fadeAnim }}>
          <Text className="text-gray-300 text-sm font-semibold">
            {userInfoSections[currentIndex].label}
          </Text>
          <Text className="text-gray-100 text-lg font-medium">
            {userInfoSections[currentIndex].value}
          </Text>
        </Animated.View>
        <Text className="text-gray-400 text-xs italic">
          Cập nhật dữ liệu lần cuối: {lastUpdateTime || 'Chưa có thông tin'}
        </Text>
      </View>
    );
  };
  
// Hàm render
  return (
    <GestureHandlerRootView className="flex-1">
    <StatusBar barStyle="light-content" />
    <LinearGradient
  colors={['#1f1f1f', '#121212', '#000000']}
  className="flex-1"
  >
      <PanGestureHandler
        onHandlerStateChange={handleSwipe}
        activeOffsetX={[-20, 20]}
      >
        <View className="flex-1 px-4 pt-12">
          <View className="flex-row justify-between items-center mb-6">
          <Text className="text-white text-3xl font-bold">Lịch học và thi - ICTU</Text>
          <TouchableOpacity 
          onPress={handleResetData} 
          disabled={isLoading}
          className="bg-gray-800 bg-opacity-20 p-2 rounded-full"
        >
          <Ionicons name="refresh" size={24} color="white" />
        </TouchableOpacity>
          </View>
          <UserInfo user={user} lastUpdateTime={lastUpdateTime} />
          <View className="bg-gray-800 rounded-3xl shadow-lg p-4 mb-6">
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={currentWeekStartDate ? getWeekDays(currentWeekStartDate) : []}
              renderItem={({ item: day }) => <WeekDayButton day={day} />}
              keyExtractor={(day) => day.dateString}
              className="mb-4"
            />
            <TouchableOpacity
              onPress={() => setCalendarExpanded(!calendarExpanded)}
              className="flex-row items-center justify-center py-3 bg-gray-900 rounded-full"
            >
              <Text className="text-white font-medium mr-2">
                {calendarExpanded ? 'Thu gọn' : 'Xem lịch tháng'}
              </Text>
              <Ionicons
                name={calendarExpanded ? 'chevron-up' : 'chevron-down'}
                size={20}
                color="#ffffff"
              />
            </TouchableOpacity>
            {calendarExpanded && memoizedCalendar}
          </View>
          <FlatList
            data={[...getScheduleForDate(), ...getExamsForDate()]}
            renderItem={({ item }) => item.ca_thi ? renderExamItem({ item }) : renderClassItem({ item })}
            keyExtractor={(item, index) => `${item.STT}-${index}`}
            ListEmptyComponent={
              <View className="bg-gray-800 p-6 rounded-2xl shadow-md">
                <Text className="text-center text-gray-200 italic text-lg">
                  Không có lớp học hoặc lịch thi nào trong ngày này.
                </Text>
                <Text className="text-center text-orange-500 italic mt-3 text-base">
                  Bạn có thể vuốt sang trái hoặc phải để xem lịch của các ngày khác.
                </Text>
              </View>
            }
          />
        </View>
      </PanGestureHandler>
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View className="flex-1 justify-center items-center bg-opacity-25 block" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <LinearGradient
          colors={['#2c2c2c', '#1f1f1f']} // Các màu tối cho gradient
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="p-4 rounded-3xl shadow-md"
        >
            <View className="rounded-lg p-6 w-11/12 max-h-5/6">
              <ScrollView>
                {selectedClass && (
                  <>
                    <Text className="text-gray-300 text-center text-2xl font-bold mb-4">{selectedClass['lop_hoc_phan']}</Text>
                    <Text className="text-gray-500 text-lg mb-2"><Text className="font-semibold">Môn học:</Text> {selectedClass['lop_hoc_phan']}</Text>
                    <Text className="text-gray-500 text-lg mb-2"><Text className="font-semibold">Giảng viên:</Text> {selectedClass['giang_vien']}</Text>
                    <Text className="text-gray-500 text-lg mb-2"><Text className="font-semibold">Địa điểm:</Text> {selectedClass['dia_diem']}</Text>
                    <Text className="text-gray-500 text-lg mb-2"><Text className="font-semibold">Thời gian:</Text> {selectedClass['tiet_hoc']} ({selectedClass['startTime']} - {selectedClass['endTime']})</Text>
                    <Text className="text-gray-500 text-lg mb-2"><Text className="font-semibold">Tuần học:</Text> {selectedClass['tuan_hoc']}</Text>
                  </>
                )}
              </ScrollView>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                className="bg-blue-500 py-2 px-4 rounded-full mt-4"
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
          <View className="flex-1 justify-center items-center bg-opacity-25 block" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
            <View className="bg-gray-900 rounded-lg p-6 w-11/12 max-h-5/6">
              <ScrollView>
                {selectedExam && (
                  <>
                    <Text className="text-red-500 text-center text-2xl font-bold mb-4">{selectedExam.ten_hoc_phan}</Text>
                    <Text className="text-gray-500 text-lg mb-2"><Text className="font-semibold">Mã học phần:</Text> {selectedExam.ma_hoc_phan}</Text>
                    <Text className="text-gray-500 text-lg mb-2"><Text className="font-semibold">Ngày thi:</Text> {selectedExam.ngay_thi}</Text>
                    <Text className="text-gray-500 text-lg mb-2"><Text className="font-semibold">Ca thi:</Text> {selectedExam.ca_thi}</Text>
                    <Text className="text-gray-500 text-lg mb-2"><Text className="font-semibold">Phòng thi:</Text> {selectedExam.phong_thi}</Text>
                    <Text className="text-gray-500 text-lg mb-2"><Text className="font-semibold">Hình thức thi:</Text> {selectedExam.hinh_thuc_thi}</Text>
                    <Text className="text-gray-500 text-lg mb-2"><Text className="font-semibold">Số báo danh:</Text> {selectedExam.so_bao_danh}</Text>
                    <Text className="text-gray-500 first-letter:text-lg mb-2"><Text className="font-semibold">Số tín chỉ:</Text> {selectedExam.so_tc}</Text>
                    {selectedExam.ghi_chu && (
                      <Text className="text-lg mb-2"><Text className="font-semibold">Ghi chú:</Text> {selectedExam.ghi_chu}</Text>
                    )}
                  </>
                )}
              </ScrollView>
              <TouchableOpacity
                onPress={() => setExamModalVisible(false)}
                className="bg-red-500 py-2 px-4 rounded-full mt-4"
              >
                <Text className="text-white text-center font-bold">Đóng</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
        <TouchableOpacity
        className="absolute bottom-6 left-6 bg-blue-500 rounded-full w-14 h-14 justify-center items-center shadow-lg"
        onPress={openMenu}
      >
        <Ionicons name="menu-outline" size={28} color="white" />
      </TouchableOpacity>
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
        <Modal
          transparent={true}
          animationType="fade"
          visible={isMenuVisible}
          onRequestClose={closeMenu}
        >
          <View className="flex-1 justify-center items-center" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
            <View className="rounded-xl w-3/4 overflow-hidden bg-white">
            <LinearGradient
            colors={['#2f2f2f', '#1c1c1c']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="p-6"
          >
                <Text className="text-2xl font-bold text-center mb-4 text-gray-300">Menu</Text>
                <TouchableOpacity className="mb-4 bg-gray-700 rounded-md p-3 hover:bg-gray-600" onPress={() => setAboutModalVisible(true)}>
                  <Text className="text-white text-center">Thông tin ứng dụng</Text>
                </TouchableOpacity>
                <ModalComponent
                visible={isAboutModalVisible}
                onClose={() => setAboutModalVisible(false)}
                title="Thông tin ứng dụng"
                content={`Đây là ứng dụng xem thời khóa biểu và lịch thi đơn giản của sinh viên trường Đại học Công nghệ Thông tin - Đại học Thái Nguyên.\n- Ứng dụng được viết bằng React Native và Expo.\n- Dữ liệu được lấy từ hệ thống DangKyTinChi của trường.\n ** Phát triển bởi Hứa Đức Quân. **`}
                closeText={'Đóng'}
                closeColor={'bg-gray-700'}
              />
                <TouchableOpacity className="mb-4 bg-pink-700 rounded-md p-3 hover:bg-green-500" onPress={() => setChangelogModalVisible(true)}>
                  <Text className="text-white text-center">Nhật ký thay đổi</Text>
                </TouchableOpacity>
                <ModalComponent
                visible={isChangelogModalVisible}
                onClose={() => setChangelogModalVisible(false)}
                title="Nhật ký thay đổi"
                content={`** Phiên bản 1.5.stable **\n- Thay đổi phiên bản ứng dụng từ beta sang stable.\n- Sửa lỗi ứng dụng chạy trong tác vụ nền.\n- Cải thiện khả năng thông báo của ứng dụng.\n- Cải thiện hiệu suất và tối ưu hoá mà nguồn cho phiên bản stable.\n- Cải thiện khả năng hiển thị lỗi của ứng dụng.`}
                closeText={'Đóng'}
                closeColor={'bg-pink-700'}
              />
                <TouchableOpacity className="mb-4 bg-green-700 rounded-md p-3 hover:bg-green-500" onPress={() => handleMenuOption('source')}>
                  <Text className="text-white text-center">Mã nguồn</Text>
                </TouchableOpacity>
                <TouchableOpacity className="mb-4 bg-purple-700 rounded-md p-3 hover:bg-purple-500" onPress={() => handleMenuOption('contact')}>
                  <Text className="text-white text-center">Liên hệ</Text>
                </TouchableOpacity>
                <TouchableOpacity className="mb-4 bg-sky-500 rounded-md p-3 hover:bg-purple-500" onPress={() => handleMenuOption('aichat')}>
                  <Text className="text-white text-center">Trò Chuyện Với QAI</Text>
                </TouchableOpacity>
                <TouchableOpacity className="mb-4 bg-yellow-600 rounded-md p-3 hover:bg-yellow-400" onPress={() => handleMenuOption('update')}>
                  <Text className="text-white text-center">Kiểm tra cập nhật</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={closeMenu} className="mt-4 bg-red-600 rounded-md p-3 hover:bg-red-400">
                  <Text className="text-white text-center">Đóng</Text>
                </TouchableOpacity>
                <View className="border-t border-gray-500 my-4"></View>
                <View className="flex items-center">
                  <Text className="text-sm text-gray-300 mb-1 text-center">
                    Package ID: <Text className="font-semibold text-gray-100">com.hdquandev.thoikhoabieuapp</Text> | 
                    Version: <Text className="font-semibold text-gray-100">1.5.stable</Text> | Powered by <Text className="font-semibold text-gray-100">Hứa Đức Quân</Text> | Build Day <Text className="font-semibold text-gray-100">13/09/2024</Text>
                  </Text>
                </View>
              </LinearGradient>
            </View>
          </View>
        </Modal>
            <TouchableOpacity
      className="absolute bottom-6 right-6 bg-red-500 rounded-full w-14 h-14 justify-center items-center shadow-lg"
      onPress={() => setLogoutModalVisible(true)}
    >
      <Ionicons name="log-out-outline" size={28} color="white" />
    </TouchableOpacity>
    <Modal
      transparent={true}
      animationType="fade"
      visible={logoutModalVisible}
      onRequestClose={() => setLogoutModalVisible(false)}
    >
      <View className="flex-1 justify-center items-center bg-black bg-opacity-50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
        <View className="bg-gray-900 rounded-lg p-6 w-11/12 max-w-sm">
          <Text className="text-gray-300 text-2xl font-bold mb-4 text-center">Đăng xuất?</Text>
          <Text className="text-gray-500 text-center mb-6 text-base">Bạn có chắc chắn muốn đăng xuất?</Text>
          <View className="flex-row justify-around">
            <TouchableOpacity
              onPress={() => setLogoutModalVisible(false)}
              className="bg-gray-600 py-2 px-4 rounded-md"
            >
              <Text className="text-white text-center font-semibold">Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setLogoutModalVisible(false);
                logout();
              }}
              className="bg-red-600 py-2 px-4 rounded-md"
            >
              <Text className="text-white text-center font-semibold">Đăng xuất</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
    </LinearGradient>
    <Modal
      transparent={true}
      animationType="fade"
      visible={isLoading}
      onRequestClose={() => {}}
    >
      <View className="flex-1 justify-center items-center bg-opacity-50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
        <View className="bg-gray-900 p-6 rounded-2xl shadow-3xl">
          <ActivityIndicator size="large" color="#2563EB" />
          <Text className="text-gray-300 mt-4 font-medium text-center text-2xl">
            Đang tải dữ liệu...
          </Text>
          <Text className="text-gray-500 mt-2 text-base text-center">
            Vui lòng đợi trong giây lát để hệ thống cập nhật dữ liệu mới nhất, vui lòng không tắt ứng dụng hoặc mạng trong quá trình này.
          </Text>
        </View>
      </View>
    </Modal>
  </GestureHandlerRootView>
  );
}