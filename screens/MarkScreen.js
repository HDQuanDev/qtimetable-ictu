import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Alert, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { LinearGradient } from 'expo-linear-gradient';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';

const Tab = createMaterialTopTabNavigator();

const MarkScreen = () => {
  const [markData, setMarkData] = useState({ diem: [], diem_detail: [] });
  const [semesterSortOption, setSemesterSortOption] = useState('default');
  const [subjectSortOption, setSubjectSortOption] = useState('default');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const diemData = await AsyncStorage.getItem('userData_Diem') || '[]';
        const diemDetailData = await AsyncStorage.getItem('userData_DiemDetail') || '[]';
        if (diemData && diemDetailData) {
          setMarkData({
            diem: JSON.parse(diemData),
            diem_detail: JSON.parse(diemDetailData)
          });
        }
      } catch (error) {
        Alert.alert('Lỗi', 'Không thể tải dữ liệu bảng điểm từ bộ nhớ cục bộ...');
      }
    };
    fetchData();
  }, []);

  const GradientBackground = ({ children }) => (
    <LinearGradient
      colors={['#1f1f1f', '#121212', '#000000']}
      className="flex-1 p-4"
    >
      {children}
    </LinearGradient>
  );

  const sortSemesterMarks = (data) => {
    switch (semesterSortOption) {
      case 'yearAsc':
        return [...data].sort((a, b) => a.nam_hoc.localeCompare(b.nam_hoc));
      case 'yearDesc':
        return [...data].sort((a, b) => b.nam_hoc.localeCompare(a.nam_hoc));
      case 'gpaAsc':
        return [...data].sort((a, b) => parseFloat(a.tbc_he4_n1) - parseFloat(b.tbc_he4_n1));
      case 'gpaDesc':
        return [...data].sort((a, b) => parseFloat(b.tbc_he4_n1) - parseFloat(a.tbc_he4_n1));
      default:
        return data;
    }
  };

  const sortSubjectMarks = (data) => {
    switch (subjectSortOption) {
      case 'nameAsc':
        return [...data].sort((a, b) => a.ten_hoc_phan.localeCompare(b.ten_hoc_phan));
      case 'nameDesc':
        return [...data].sort((a, b) => b.ten_hoc_phan.localeCompare(a.ten_hoc_phan));
      case 'gradeAsc':
        return [...data].sort((a, b) => parseFloat(a.tkhp) - parseFloat(b.tkhp));
      case 'gradeDesc':
        return [...data].sort((a, b) => parseFloat(b.tkhp) - parseFloat(a.tkhp));
      default:
        return data;
    }
  };

  const SortPicker = ({ selectedValue, onValueChange, options }) => (
    <View className="bg-gray-800 rounded-xl overflow-hidden mb-4">
      <Picker
        selectedValue={selectedValue}
        onValueChange={onValueChange}
        dropdownIconColor="white"
        style={{ color: 'white' }}
      >
        {options.map((option) => (
          <Picker.Item key={option.value} label={option.label} value={option.value} />
        ))}
      </Picker>
    </View>
  );

  const SemesterMarks = () => (
    <GradientBackground>
      <SortPicker
        selectedValue={semesterSortOption}
        onValueChange={(itemValue) => setSemesterSortOption(itemValue)}
        options={[
          { label: 'Mặc định', value: 'default' },
          { label: 'Năm học (Tăng dần)', value: 'yearAsc' },
          { label: 'Năm học (Giảm dần)', value: 'yearDesc' },
          { label: 'GPA (Tăng dần)', value: 'gpaAsc' },
          { label: 'GPA (Giảm dần)', value: 'gpaDesc' },
        ]}
      />
      <ScrollView showsVerticalScrollIndicator={false}>
        {markData.diem.length === 0 ? (
          <View className="bg-gray-800 p-6 rounded-2xl shadow-md mt-3">
            <Text className="text-center text-gray-200 italic text-lg">
              Không có dữ liệu bảng điểm...
            </Text>
            <Text className="text-center text-orange-500 italic mt-3 text-base">
              Nếu bạn nghĩ rằng dữ liệu bị thiếu, vui lòng quay lại Tab Thời Khoá Biểu và thực hiện đồng bộ lại dữ liệu.
            </Text>
          </View>
        ) : (
          sortSemesterMarks(markData.diem).map((item, index) => (
            <View key={index} className="bg-gray-800 rounded-2xl shadow-md mb-4 overflow-hidden">
              <LinearGradient
                colors={['#3b82f6', '#2563eb']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="px-4 py-3"
              >
                <Text className="text-white text-lg font-bold">
                  {item.hoc_ky && item.hoc_ky.trim() !== "" ? `Học kỳ ${item.hoc_ky} - ${item.nam_hoc.replace('_', '-')}` : `${item.nam_hoc.replace('_', '-')}`}
                </Text>
              </LinearGradient>
              <View className="p-4">
                <View className="flex-row justify-between items-center mb-2">
                  <Text className="text-gray-400">Số tín chỉ</Text>
                  <Text className="text-sky-500 font-semibold">{item.so_tc_n1}</Text>
                </View>
                <View className="flex-row justify-between items-center mb-2">
                  <Text className="text-gray-400">TBC (Hệ 10)</Text>
                  <Text className="text-sky-500 font-semibold">{item.tbc_he10_n1}</Text>
                </View>
                <View className="flex-row justify-between items-center">
                  <Text className="text-gray-400">TBC (Hệ 4)</Text>
                  <Text className="text-sky-500 font-semibold">{item.tbc_he4_n1}</Text>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </GradientBackground>
  );

  const SubjectMarks = () => (
    <GradientBackground>
      <SortPicker
        selectedValue={subjectSortOption}
        onValueChange={(itemValue) => setSubjectSortOption(itemValue)}
        options={[
          { label: 'Mặc định', value: 'default' },
          { label: 'Tên môn học (A-Z)', value: 'nameAsc' },
          { label: 'Tên môn học (Z-A)', value: 'nameDesc' },
          { label: 'Điểm (Tăng dần)', value: 'gradeAsc' },
          { label: 'Điểm (Giảm dần)', value: 'gradeDesc' },
        ]}
      />
      <ScrollView showsVerticalScrollIndicator={false}>
        {markData.diem_detail.length === 0 ? (
          <View className="bg-gray-800 p-6 rounded-2xl shadow-md mt-3">
            <Text className="text-center text-gray-200 italic text-lg">Không có dữ liệu bảng điểm chi tiết...</Text>
            <Text className="text-center text-orange-500 italic mt-3 text-base">Nếu bạn nghĩ rằng dữ liệu bị thiếu, vui lòng quay lại Tab Thời Khoá Biểu và thực hiện đồng bộ lại dữ liệu.</Text>
          </View>
        ) : (
          sortSubjectMarks(markData.diem_detail).map((item, index) => (
            <View key={index} className="bg-gray-800 rounded-2xl shadow-md mb-4 overflow-hidden">
              <LinearGradient
                colors={['#10b981', '#059669']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="px-4 py-3"
              >
                <Text className="text-white text-lg font-bold">{item.ten_hoc_phan}</Text>
                <Text className="text-gray-200 text-sm">Mã học phần: {item.ma_hoc_phan}</Text>
              </LinearGradient>
              <View className="p-4">
                <View className="flex-row justify-between items-center mb-2">
                  <Text className="text-gray-400">Số tín chỉ</Text>
                  <Text className="text-emerald-500 font-semibold">{item.so_tc}</Text>
                </View>
                <View className="flex-row justify-between items-center mb-2">
                  <Text className="text-gray-400">Điểm CC</Text>
                  <Text className="text-emerald-500 font-semibold">{item.cc}</Text>
                </View>
                <View className="flex-row justify-between items-center mb-2">
                  <Text className="text-gray-400">Điểm thi</Text>
                  <Text className="text-emerald-500 font-semibold">{item.thi}</Text>
                </View>
                <View className="flex-row justify-between items-center mb-2">
                  <Text className="text-gray-400">Điểm TKHP</Text>
                  <Text className="text-emerald-500 font-semibold">{item.tkhp}</Text>
                </View>
                <View className="flex-row justify-between items-center">
                  <Text className="text-gray-400">Điểm chữ</Text>
                  <Text className="text-emerald-500 font-semibold">{item.diem_chu}</Text>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </GradientBackground>
  );

  return (
    <SafeAreaView className="flex-1 bg-[#1f1f1f]">
      <View className="flex-row items-center justify-between px-4 py-2 bg-[#1f1f1f]">
        <Text className="text-green-500 text-2xl font-bold">Bảng điểm</Text>
        <TouchableOpacity>
          <Ionicons name="refresh" size={24} color="#10b981" />
        </TouchableOpacity>
      </View>
      <Tab.Navigator
        screenOptions={{
          tabBarLabelStyle: { fontSize: 14, fontWeight: 'bold', textTransform: 'none' },
          tabBarStyle: { backgroundColor: 'rgb(31, 41, 55)', elevation: 0, shadowOpacity: 0 },
          tabBarIndicatorStyle: { 
            backgroundColor: '#10b981',
            height: 3,
            borderRadius: 3,
          },
          tabBarActiveTintColor: '#10b981',
          tabBarInactiveTintColor: '#9ca3af',
        }}
      >
        <Tab.Screen name="Học kỳ" component={SemesterMarks} />
        <Tab.Screen name="Môn học" component={SubjectMarks} />
      </Tab.Navigator>
    </SafeAreaView>
  );
};

export default MarkScreen;