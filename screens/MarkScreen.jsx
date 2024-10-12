import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Alert,
  TouchableOpacity,
  StatusBar,
  Animated,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { LinearGradient } from "expo-linear-gradient";
import { Picker } from "@react-native-picker/picker";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../components/ThemeProvider";
import { useFocusEffect } from "@react-navigation/native";

const Tab = createMaterialTopTabNavigator(); // Khởi tạo Tab Navigator

const MarkScreen = () => {
  const [markData, setMarkData] = useState({ diem: [], diem_detail: [] });
  const [semesterSortOption, setSemesterSortOption] = useState("default");
  const [subjectSortOption, setSubjectSortOption] = useState("default");
  const { isDarkMode } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const rotateAnim = new Animated.Value(0);

  // Hàm tải dữ liệu điểm từ local storage
  const fetchData = async () => {
    setRefreshing(true);
    try {
      const diemData = (await AsyncStorage.getItem("userData_Diem")) || "[]";
      const diemDetailData =
        (await AsyncStorage.getItem("userData_DiemDetail")) || "[]";
      if (diemData && diemDetailData) {
        setMarkData({
          diem: JSON.parse(diemData),
          diem_detail: JSON.parse(diemDetailData),
        });
      }
    } catch (error) {
      Alert.alert("Error", "Unable to load grade data from local storage...");
    } finally {
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  // Hàm xử lý làm mới dữ liệu
  const handleRefresh = () => {
    if (!refreshing) {
      setRefreshing(true);
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }).start(() => {
        rotateAnim.setValue(0);
      });
      fetchData();
    }
  };

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  // Hàm sắp xếp dữ liệu điểm
  const sortSemesterMarks = (data) => {
    switch (semesterSortOption) {
      case "yearAsc":
        return [...data].sort((a, b) => a.nam_hoc.localeCompare(b.nam_hoc));
      case "yearDesc":
        return [...data].sort((a, b) => b.nam_hoc.localeCompare(a.nam_hoc));
      case "gpaAsc":
        return [...data].sort(
          (a, b) => parseFloat(a.tbc_he4_n1) - parseFloat(b.tbc_he4_n1)
        );
      case "gpaDesc":
        return [...data].sort(
          (a, b) => parseFloat(b.tbc_he4_n1) - parseFloat(a.tbc_he4_n1)
        );
      default:
        return data;
    }
  };

  // Hàm sắp xếp dữ liệu điểm chi tiết
  const sortSubjectMarks = (data) => {
    switch (subjectSortOption) {
      case "nameAsc":
        return [...data].sort((a, b) =>
          a.ten_hoc_phan.localeCompare(b.ten_hoc_phan)
        );
      case "nameDesc":
        return [...data].sort((a, b) =>
          b.ten_hoc_phan.localeCompare(a.ten_hoc_phan)
        );
      case "gradeAsc":
        return [...data].sort(
          (a, b) => parseFloat(a.tkhp) - parseFloat(b.tkhp)
        );
      case "gradeDesc":
        return [...data].sort(
          (a, b) => parseFloat(b.tkhp) - parseFloat(a.tkhp)
        );
      default:
        return data;
    }
  };

  const sortedSemesterMarks = useMemo(
    () => sortSemesterMarks(markData.diem),
    [markData.diem, semesterSortOption]
  ); // Sắp xếp dữ liệu điểm theo học kỳ
  const sortedSubjectMarks = useMemo(
    () => sortSubjectMarks(markData.diem_detail),
    [markData.diem_detail, subjectSortOption]
  ); // Sắp xếp dữ liệu điểm theo môn học

  // Component Picker sắp xếp
  const SortPicker = ({
    selectedValue,
    onValueChange,
    options,
    isDarkMode,
  }) => (
    <View
      className={`rounded-xl overflow-hidden mb-4 ${
        isDarkMode ? "bg-gray-800" : "bg-white"
      }`}
    >
      <Picker
        selectedValue={selectedValue}
        onValueChange={onValueChange}
        dropdownIconColor={isDarkMode ? "white" : "black"}
        style={{ color: isDarkMode ? "white" : "black" }}
      >
        {options.map((option) => (
          <Picker.Item
            key={option.value}
            label={option.label}
            value={option.value}
          />
        ))}
      </Picker>
    </View>
  );

  // Component thẻ điểm
  const GradeCard = ({ title, subtitle, data, isDarkMode }) => (
    <View
      className={`rounded-3xl shadow-lg mb-4 overflow-hidden ${
        isDarkMode ? "bg-gray-800" : "bg-white"
      } ${
        isDarkMode ? "border-2 border-[#3730A3]" : "border-2 border-[#3B82F6]"
      }`}
    >
      <LinearGradient
        colors={isDarkMode ? ["#4F46E5", "#3730A3"] : ["#60A5FA", "#3B82F6"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        className="px-4 py-3"
      >
        <Text className="text-lg font-bold text-white">{title}</Text>
        {subtitle && <Text className="text-sm text-gray-200">{subtitle}</Text>}
      </LinearGradient>
      <View className="p-4">
        {Object.entries(data).map(([key, value]) => (
          <View
            key={key}
            className="flex-row justify-between items-center mb-2"
          >
            <Text
              className={`${isDarkMode ? "text-gray-300" : "text-gray-600"}`}
            >
              {key}
            </Text>
            <Text
              className={`font-semibold ${
                isDarkMode ? "text-blue-300" : "text-blue-600"
              }`}
            >
              {value}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );

  // Component thẻ điểm học kỳ
  const renderGradeCard = ({ item }) => (
    <GradeCard
      title={
        item.hoc_ky
          ? `Học kỳ ${item.hoc_ky} - ${item.nam_hoc.replace("_", "-")}`
          : `${item.nam_hoc.replace("_", "-")}`
      }
      data={{
        "Số tín chỉ": item.so_tc_n1,
        "TBC (Hệ 10)": item.tbc_he10_n1,
        "TBC (Hệ 4)": item.tbc_he4_n1,
      }}
      isDarkMode={isDarkMode}
    />
  );

  // Component thẻ điểm môn học
  const renderSubjectCard = ({ item }) => (
    <GradeCard
      title={item.ten_hoc_phan}
      subtitle={`Mã học phần: ${item.ma_hoc_phan}`}
      data={{
        "Số tín chỉ": item.so_tc,
        "Điểm CC": item.cc,
        "Điểm thi": item.thi,
        "Điểm TKHP": item.tkhp,
        "Điểm chữ": item.diem_chu,
      }}
      isDarkMode={isDarkMode}
    />
  );

  // Component
  const SemesterMarks = ({ isDarkMode }) => (
    <View className="flex-1">
      <View className="px-4">
        <SortPicker
          selectedValue={semesterSortOption}
          onValueChange={(itemValue) => setSemesterSortOption(itemValue)}
          options={[
            { label: "Mặc định", value: "default" },
            { label: "Năm học (Tăng dần)", value: "yearAsc" },
            { label: "Năm học (Giảm dần)", value: "yearDesc" },
            { label: "GPA (Tăng dần)", value: "gpaAsc" },
            { label: "GPA (Giảm dần)", value: "gpaDesc" },
          ]}
          isDarkMode={isDarkMode}
        />
      </View>
      <FlatList
        data={sortedSemesterMarks}
        renderItem={renderGradeCard}
        keyExtractor={(item, index) => index.toString()}
        contentContainerStyle={{ paddingHorizontal: 16 }}
      />
    </View>
  );

  // Component
  const SubjectMarks = ({ isDarkMode }) => (
    <View className="flex-1">
      <View className="px-4">
        <SortPicker
          selectedValue={subjectSortOption}
          onValueChange={(itemValue) => setSubjectSortOption(itemValue)}
          options={[
            { label: "Mặc định", value: "default" },
            { label: "Tên học phần (A-Z)", value: "nameAsc" },
            { label: "Tên học phần (Z-A)", value: "nameDesc" },
            { label: "Điểm TKHP (Tăng dần)", value: "gradeAsc" },
            { label: "Điểm TKHP (Giảm dần)", value: "gradeDesc" },
          ]}
          isDarkMode={isDarkMode}
        />
      </View>
      <FlatList
        data={sortedSubjectMarks}
        renderItem={renderSubjectCard}
        keyExtractor={(item, index) => index.toString()}
        contentContainerStyle={{ paddingHorizontal: 16 }}
      />
    </View>
  );

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
          className={`px-4 pt-12 flex-row justify-between items-center mb-6 ${
            isDarkMode ? "dark:bg-[#1f2937]" : "bg-[#f0f9ff]"
          } rounded-b-3xl`}
        >
          <Text
            className={`text-3xl font-bold ${
              isDarkMode ? "text-blue-400" : "text-blue-500"
            } text-center mb-4`}
          >
            Bảng Điểm
          </Text>
          <TouchableOpacity
            onPress={handleRefresh}
            disabled={refreshing}
            className={`bg-opacity-20 p-2 rounded-full ${
              isDarkMode ? "bg-gray-700" : "bg-blue-100"
            } mb-4`}
          >
            <Animated.View style={{ transform: [{ rotate: spin }] }}>
              <Ionicons
                name="refresh"
                size={24}
                color={isDarkMode ? "#93c5fd" : "#60a5fa"}
              />
            </Animated.View>
          </TouchableOpacity>
        </LinearGradient>
        <Tab.Navigator
          screenOptions={{
            tabBarLabelStyle: {
              fontSize: 16,
              fontWeight: "bold",
              textTransform: "none",
            },
            tabBarStyle: {
              backgroundColor: "transparent",
              elevation: 0,
              shadowOpacity: 0,
              borderRadius: 24,
              marginHorizontal: 16,
              marginBottom: 16,
              backgroundColor: isDarkMode ? "#1f2937" : "#ebf8ff",
            },
            tabBarIndicatorStyle: {
              backgroundColor: isDarkMode ? "#22c55e" : "#16a34a",
              height: 4,
              borderRadius: 3,
            },
            tabBarActiveTintColor: isDarkMode ? "#22c55e" : "#16a34a",
            tabBarInactiveTintColor: isDarkMode ? "#6b7280" : "#9ca3af",
          }}
          sceneContainerStyle={{
            backgroundColor: "transparent",
          }}
        >
          <Tab.Screen name="Theo Học Kỳ">
            {(props) => <SemesterMarks {...props} isDarkMode={isDarkMode} />}
          </Tab.Screen>
          <Tab.Screen name="Theo Môn Học">
            {(props) => <SubjectMarks {...props} isDarkMode={isDarkMode} />}
          </Tab.Screen>
        </Tab.Navigator>
      </LinearGradient>
    </GestureHandlerRootView>
  );
};

export default MarkScreen;
