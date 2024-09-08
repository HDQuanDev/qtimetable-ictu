import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { View, Text, TouchableOpacity, FlatList, Modal, ScrollView, Alert, ActivityIndicator, Animated, Linking } from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../AuthContext';
import { GestureHandlerRootView, PanGestureHandler, State } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api_ictu } from '../services/api';
import { checkForUpdate } from '../components/CheckUpdate';

// Vietnamese locale configuration for the calendar
LocaleConfig.locales['vi'] = {
  monthNames: ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'],
  monthNamesShort: ['Th1', 'Th2', 'Th3', 'Th4', 'Th5', 'Th6', 'Th7', 'Th8', 'Th9', 'Th10', 'Th11', 'Th12'],
  dayNames: ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'],
  dayNamesShort: ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'],
  today: 'Hôm nay'
};
LocaleConfig.defaultLocale = 'vi';

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

  const openMenu = () => {
    setMenuVisible(true);
  };

  // Hàm đóng menu
  const closeMenu = () => {
    setMenuVisible(false);
  };

  // Hàm xử lý khi chọn các tùy chọn
  const handleMenuOption = (option) => {
    closeMenu();
    switch (option) {
      case 'about':
        Alert.alert('Thông tin ứng dụng', 'Đây là ứng dụng xem thời khóa biểu và lịch thi đpưn giản của sinh viên trường Đại học Công nghệ Thông tin - Đại học Thái Nguyên.\n- Ứng dụng được viết bằng React Native và Expo.\n- Dữ liệu được lấy từ hệ thống DangKyTinChi của trường.\n- Phát triển bởi Hứa Đức Quân.');
        break;
      case 'source':
        Linking.openURL('https://github.com/HDQuanDev/qtimetable-ictu');
        break;
      case 'contact':
        Linking.openURL('https://facebook.com/quancp72h');
        break;
      case 'update':
        checkForUpdate('all');
        break;
      default:
        break;
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      await fetchScheduleData();
      await fetchExamData();
      await fetchUserInfo();
      await fetchTimeUpdate();
      const today = new Date();
      const todayDateString = today.toISOString().split('T')[0];
      setSelectedDate(todayDateString);
      setCurrentWeekStartDate(getWeekStartDate(todayDateString));
    };
    fetchData();
  }, []);

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

  const convertDateFormat = useCallback((dateString) => {
    const [day, month, year] = dateString.split('/');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }, []);

  const getWeekStartDate = useCallback((dateString) => {
    const date = new Date(dateString);
    const dayOfWeek = date.getDay();
    const diff = date.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    return new Date(date.setDate(diff)).toISOString().split('T')[0];
  }, []);

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

  const getExamsForDate = useCallback(() => {
    if (!selectedDate) return [];

    return examData.filter((exam) => {
      const examDate = convertDateFormat(exam.ngay_thi);
      return examDate === selectedDate;
    });
  }, [selectedDate, examData, convertDateFormat]);

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

  const handleDayPress = useCallback(async (day) => {
    setSelectedDate(day.dateString);
    setCalendarExpanded(false);
    setCurrentWeekStartDate(getWeekStartDate(day.dateString));
  }, [getWeekStartDate]);

  const handleSwipe = useCallback(async (event) => {
    if (event.nativeEvent.state === State.END) {
      let newDate = new Date(selectedDate);
      if (event.nativeEvent.translationX > 50) {
        // Swipe right (previous day)
        newDate.setDate(newDate.getDate() - 1);
      } else if (event.nativeEvent.translationX < -50) {
        // Swipe left (next day)
        newDate.setDate(newDate.getDate() + 1);
      } else {
        // If the swipe wasn't significant enough, don't change the date
        return;
      }
      
      const newDateString = newDate.toISOString().split('T')[0];
      await handleDayPress({ dateString: newDateString });
      
      // Update the current week start date if necessary
      const newWeekStartDate = getWeekStartDate(newDateString);
      if (newWeekStartDate !== currentWeekStartDate) {
        setCurrentWeekStartDate(newWeekStartDate);
      }
    }
  }, [selectedDate, handleDayPress, getWeekStartDate, currentWeekStartDate]);

  const handleResetData = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api_ictu(await AsyncStorage.getItem('username'), await AsyncStorage.getItem('password'), 'reset');
      await AsyncStorage.setItem('lastUpdate', new Date().toLocaleString('vi-VN'));
      // Fetch and update the schedule data after reset
      await fetchScheduleData();
      await fetchExamData();
      await fetchUserInfo();
      await fetchTimeUpdate();
      Alert.alert('Thành công', 'Dữ liệu đã được cập nhật.');
    } catch (error) {
      console.error('Error resetting data:', error);
      Alert.alert('Lỗi', 'Không thể cập nhật dữ liệu. Vui lòng thử lại sau.');
    } finally {
      setIsLoading(false);
    }
  }, []);

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
        className="flex-row items-center mb-4"
      >
        <LinearGradient
          colors={['#f0f8ff', '#e6f3ff']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="p-4 rounded-lg shadow-md flex-1"
        >
          <View className="flex-row justify-between items-center mb-2">
          <View className="bg-green-500 px-3 py-1 rounded-full">
              <Text className="text-white font-medium text-sm">Lịch Học</Text>
            </View>
          </View>
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-lg font-bold text-gray-800 flex-1 mr-2">{item['lop_hoc_phan']}</Text>
            <View className="bg-blue-500 px-3 py-1 rounded-full">
              <Text className="text-white font-medium text-sm">{startTime} - {endTime}</Text>
            </View>
          </View>
          <View className="flex-row items-center mb-1">
            <Ionicons name="person-outline" size={16} color="#4a5568" />
            <Text className="text-gray-600 ml-2">{item['giang_vien']}</Text>
          </View>
          <View className="flex-row items-center">
            <Ionicons name="location-outline" size={16} color="#4a5568" />
            <Text className="text-gray-600 ml-2">{item['dia_diem']}</Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
    
  }, []);

  const renderExamItem = useCallback(({ item }) => {
    const [startTime, endTime] = item.ca_thi.match(/\(([^)]+)\)/)[1].split('-');

    return (
      <TouchableOpacity
        onPress={() => {
          setSelectedExam(item);
          setExamModalVisible(true);
        }}
        className="flex-row items-center mb-4"
      >
        <LinearGradient
          colors={['#fff0f0', '#ffe6e6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="p-4 rounded-lg shadow-md flex-1"
        >
          <View className="flex-row justify-between items-center mb-2">
          <View className="bg-red-500 px-3 py-1 rounded-full">
              <Text className="text-white font-medium text-sm">Lịch Thi</Text>
            </View>
          </View>
          <View className="flex-row justify-between items-start mb-2">
            <Text className="text-lg font-bold text-gray-800 flex-1 mr-2">
              {item.ten_hoc_phan} ({item.ma_hoc_phan}) - SDB: {item.so_bao_danh}
            </Text>
            <View className="bg-cyan-500 px-3 py-1 rounded-full">
              <Text className="text-white font-medium text-sm">{startTime} - {endTime}</Text>
            </View>
          </View>
          <View className="flex-row items-center mb-1">
            <Ionicons name="document-text-outline" size={16} color="#4a5568" />
            <Text className="text-gray-600 ml-2">{item.hinh_thuc_thi}</Text>
          </View>
          <View className="flex-row items-center">
            <Ionicons name="location-outline" size={16} color="#4a5568" />
            <Text className="text-gray-600 ml-2">{item.phong_thi}</Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
    

  }, []);

  const memoizedCalendar = useMemo(() => (
    <Calendar
      onDayPress={handleDayPress}
      markedDates={{
        [selectedDate]: {
          selected: true,
          disableTouchEvent: true,
          selectedColor: '#3B82F6',
        },
        ...examData.reduce((acc, exam) => {
          const examDate = convertDateFormat(exam.ngay_thi);
          acc[examDate] = {
            ...acc[examDate],
            marked: true,
            dotColor: 'red'
          };
          return acc;
        }, {})
      }}
      firstDay={1}
      className="border border-gray-200 rounded-lg mt-4"
      theme={{
        backgroundColor: 'transparent',
        calendarBackground: 'transparent',
        textSectionTitleColor: '#64748B',
        monthTextColor: '#1E293B',
        arrowColor: '#3B82F6',
        todayTextColor: '#3B82F6',
        dayTextColor: '#1E293B',
        textDisabledColor: '#94A3B8',
      }}
      dayComponent={({ date, state }) => (
        <TouchableOpacity
          onPress={() => handleDayPress(date)}
          className={`w-10 h-10 items-center justify-center ${
            state === 'disabled' ? 'opacity-30' : ''
          } ${state === 'today' ? 'bg-blue-100' : ''} ${
            selectedDate === date.dateString ? 'bg-blue-500' : ''
          }`}
        >
          <Text
            className={`text-center ${
              state === 'disabled' ? 'text-gray-400' : 'text-gray-700'
            } ${state === 'today' ? 'font-bold text-blue-500' : ''} ${
              selectedDate === date.dateString ? 'text-white' : ''
            }`}
          >
            {date.day}
          </Text>
          <View className="flex-row justify-center mt-1">
            {[...Array(Math.min(3, getNumberOfClassesForDay(date.dateString)))].map((_, i) => (
              <View
                key={`class-${i}`}
                className="w-1 h-1 bg-green-500 rounded-full mx-0.5"
              />
            ))}
            {[...Array(Math.min(3, getNumberOfExamsForDay(date.dateString)))].map((_, i) => (
              <View
                key={`exam-${i}`}
                className="w-1 h-1 bg-red-500 rounded-full mx-0.5"
              />
            ))}
          </View>
        </TouchableOpacity>
      )}
    />
  ), [selectedDate, handleDayPress, getNumberOfClassesForDay, getNumberOfExamsForDay, examData, convertDateFormat]);

  const WeekDayButton = useCallback(({ day }) => (
    <TouchableOpacity
      onPress={() => handleDayPress(day)}
      className={`p-3 rounded-full mr-2 ${
        selectedDate === day.dateString
          ? 'bg-blue-500'
          : 'bg-gray-100'
      }`}
    >
      <Text className={`font-medium ${
        selectedDate === day.dateString
          ? 'text-white'
          : 'text-gray-800'
      }`}>
        {day.dayOfWeek}
      </Text>
      <Text className={`text-center font-bold ${
        selectedDate === day.dateString
          ? 'text-white' : 'text-gray-800'
      }`}>
        {day.dayOfMonth}
      </Text>
      <View className="flex-row justify-center mt-1">
        {[...Array(Math.min(3, getNumberOfClassesForDay(day.dateString)))].map((_, i) => (
          <View
            key={`class-${i}`}
            className="w-1 h-1 bg-green-500 rounded-full mx-0.5"
          />
        ))}
        {[...Array(Math.min(3, getNumberOfExamsForDay(day.dateString)))].map((_, i) => (
          <View
            key={`exam-${i}`}
            className="w-1 h-1 bg-red-500 rounded-full mx-0.5"
          />
        ))}
      </View>
    </TouchableOpacity>
  ), [selectedDate, handleDayPress, getNumberOfClassesForDay, getNumberOfExamsForDay]);

  const UserInfo = ({ user, lastUpdateTime }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [fadeAnim] = useState(new Animated.Value(1));
  
    const userInfoSections = [
      `Tên: ${user.name}`,
      `Mã sinh viên: ${user.masinhvien}`,
      `Ngành: ${user.nganh}`,
      `Khóa: ${user.khoa}`,
      `Phát triển bởi: Hứa Đức Quân`,
    ];
  
    useEffect(() => {
      let index = 0;
      const interval = setInterval(() => {
        setCurrentIndex(index);
        index = (index + 1) % userInfoSections.length;
      }, 3000); // Thay đổi mỗi 3 giây
  
      return () => clearInterval(interval); // Dọn dẹp interval khi component unmount
    }, []);
  
    return (
      <View className="bg-white bg-opacity-20 rounded-lg p-4 mb-4">
        <Animated.View style={{ opacity: fadeAnim }}>
          <Text className="text-gray-700 text-lg font-semibold">
            {userInfoSections[currentIndex]}
          </Text>
        </Animated.View>
        <Text className="text-gray-400 text-sm mt-1">
          Cập nhật lần cuối: {lastUpdateTime || 'Chưa có thông tin'}
        </Text>
      </View>
    );
  };

  return (
    <GestureHandlerRootView className="flex-1">
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#4c669f', '#3b5998', '#192f6a']}
        className="flex-1"
      >
        <PanGestureHandler
          onHandlerStateChange={handleSwipe}
          activeOffsetX={[-20, 20]}
        >
          <View className="flex-1 p-4 pt-12">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-3xl font-bold text-white">
                Lịch học và thi - ICTU
              </Text>
              <TouchableOpacity onPress={handleResetData} disabled={isLoading}>
                <Ionicons name="refresh" size={24} color="white" />
              </TouchableOpacity>
            </View>

            <UserInfo user={user} lastUpdateTime={lastUpdateTime} />

            <View className="bg-white rounded-2xl shadow-lg p-4 mb-4">
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
                className="flex-row items-center justify-center py-2 bg-gray-100 rounded-full"
              >
                <Text className="text-gray-800 font-medium mr-2">
                  {calendarExpanded ? 'Thu gọn' : 'Xem lịch tháng'}
                </Text>
                <Ionicons
                  name={calendarExpanded ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color="#4a5568"
                />
              </TouchableOpacity>

              {calendarExpanded && memoizedCalendar}
            </View>

            <FlatList
              data={[...getScheduleForDate(), ...getExamsForDate()]}
              renderItem={({ item }) => item.ca_thi ? renderExamItem({ item }) : renderClassItem({ item })}
              keyExtractor={(item, index) => `${item.STT}-${index}`}
              ListEmptyComponent={
                <View className="bg-white p-4 rounded-lg">
                  <Text className="text-center text-gray-600 italic">
                    Không có lớp học hoặc lịch thi nào trong ngày này.
                  </Text>
                  <Text className="text-center text-orange-500 italic mt-2">
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
            <View className="bg-violet-100 rounded-lg p-6 w-11/12 max-h-5/6">
              <ScrollView>
                {selectedClass && (
                  <>
                    <Text className="text-2xl font-bold mb-4">{selectedClass['lop_hoc_phan']}</Text>
                    <Text className="text-lg mb-2"><Text className="font-semibold">Môn học:</Text> {selectedClass['lop_hoc_phan']}</Text>
                    <Text className="text-lg mb-2"><Text className="font-semibold">Giảng viên:</Text> {selectedClass['giang_vien']}</Text>
                    <Text className="text-lg mb-2"><Text className="font-semibold">Địa điểm:</Text> {selectedClass['dia_diem']}</Text>
                    <Text className="text-lg mb-2"><Text className="font-semibold">Thời gian:</Text> {selectedClass['tiet_hoc']} ({selectedClass['startTime']} - {selectedClass['endTime']})</Text>
                    <Text className="text-lg mb-2"><Text className="font-semibold">Tuần học:</Text> {selectedClass['tuan_hoc']}</Text>
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
          </View>
        </Modal>

        <Modal
          animationType="slide"
          transparent={true}
          visible={examModalVisible}
          onRequestClose={() => setExamModalVisible(false)}
        >
          <View className="flex-1 justify-center items-center bg-opacity-25 block" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
            <View className="bg-red-100 rounded-lg p-6 w-11/12 max-h-5/6">
              <ScrollView>
                {selectedExam && (
                  <>
                    <Text className="text-2xl font-bold mb-4">{selectedExam.ten_hoc_phan}</Text>
                    <Text className="text-lg mb-2"><Text className="font-semibold">Mã học phần:</Text> {selectedExam.ma_hoc_phan}</Text>
                    <Text className="text-lg mb-2"><Text className="font-semibold">Ngày thi:</Text> {selectedExam.ngay_thi}</Text>
                    <Text className="text-lg mb-2"><Text className="font-semibold">Ca thi:</Text> {selectedExam.ca_thi}</Text>
                    <Text className="text-lg mb-2"><Text className="font-semibold">Phòng thi:</Text> {selectedExam.phong_thi}</Text>
                    <Text className="text-lg mb-2"><Text className="font-semibold">Hình thức thi:</Text> {selectedExam.hinh_thuc_thi}</Text>
                    <Text className="text-lg mb-2"><Text className="font-semibold">Số báo danh:</Text> {selectedExam.so_bao_danh}</Text>
                    <Text className="text-lg mb-2"><Text className="font-semibold">Số tín chỉ:</Text> {selectedExam.so_tc}</Text>
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
          className="absolute bottom-4 left-4 bg-blue-500 rounded-full w-12 h-12 justify-center items-center shadow-lg"
        onPress={() => {
        // Mở menu
        openMenu();
      }}
    >
      <Ionicons name="menu-outline" size={24} color="white" />
    </TouchableOpacity>

 {/* Modal Menu */}
        <Modal
          transparent={true}
          animationType="fade"
          visible={isMenuVisible}
          onRequestClose={closeMenu}
        >
          <View className="flex-1 justify-center items-center" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
            <View className="bg-white rounded-lg w-3/4 overflow-hidden">
              <LinearGradient
                colors={['#f0f9ff', '#cbebff']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="p-6"
              >
                <Text className="text-lg font-bold text-center mb-4 text-gray-800">Menu</Text>

                {/* Thêm nút có hiệu ứng hover */}
                <TouchableOpacity className="mb-4 bg-blue-400 rounded-md p-3 hover:bg-blue-600" onPress={() => handleMenuOption('about')}>
                  <Text className="text-white text-center">Thông tin ứng dụng</Text>
                </TouchableOpacity>

                <TouchableOpacity className="mb-4 bg-green-400 rounded-md p-3 hover:bg-green-600" onPress={() => handleMenuOption('source')}>
                  <Text className="text-white text-center">Mã nguồn</Text>
                </TouchableOpacity>

                <TouchableOpacity className="mb-4 bg-purple-400 rounded-md p-3 hover:bg-purple-600" onPress={() => handleMenuOption('contact')}>
                  <Text className="text-white text-center">Liên hệ</Text>
                </TouchableOpacity>

                <TouchableOpacity className="mb-4 bg-yellow-400 rounded-md p-3 hover:bg-yellow-600" onPress={() => handleMenuOption('update')}>
                  <Text className="text-white text-center">Kiểm tra cập nhật</Text>
                </TouchableOpacity>

                {/* Nút đóng */}
                <TouchableOpacity onPress={closeMenu} className="mt-4 bg-red-400 rounded-md p-3 hover:bg-red-600">
                  <Text className="text-white text-center">Đóng</Text>
                </TouchableOpacity>

                {/* Đường kẻ ngang để phân chia */}
                <View className="border-t border-gray-300 my-4"></View>

                {/* Hiển thị thông tin ứng dụng */}
                <View className="flex items-center">
                  <Text className="text-sm text-gray-600 mb-1 text-center">Package ID: <Text className="font-semibold text-gray-800">com.hdquandev.thoikhoabieuapp</Text> | Version: <Text className="font-semibold text-gray-800">1.1.beta</Text></Text>
                </View>

              </LinearGradient>
            </View>
          </View>
        </Modal>
        <TouchableOpacity
          className="absolute bottom-4 right-4 bg-red-500 rounded-full w-12 h-12 justify-center items-center shadow-lg"
          onPress={() => Alert.alert(
            'Đăng xuất',
            'Bạn có chắc chắn muốn đăng xuất?',
            [
              {text: 'Hủy', style: 'cancel'},
              {text: 'Đăng xuất', onPress: logout, style: 'destructive'},
            ]
          )}
        >
          <Ionicons name="log-out-outline" size={24} color="white" />
        </TouchableOpacity>
      </LinearGradient>

      <Modal
        transparent={true}
        animationType="fade"
        visible={isLoading}
        onRequestClose={() => {}}
      >
        <View className="flex-1 justify-center items-center bg-opacity-25" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <View className="bg-gray-300 p-6 rounded-lg">
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text className="text-gray-800 mt-4 font-medium text-center">Đang tải dữ liệu, vui lòng đợi...</Text>
            <Text className="text-gray-600 mt-2 text-sm text-center">Đây có thể mất vài giây tùy thuộc vào kết nối mạng của bạn.</Text>
          </View>
        </View>
      </Modal>
    </GestureHandlerRootView>
  );
}