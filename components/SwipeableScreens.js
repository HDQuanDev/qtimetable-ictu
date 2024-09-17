import React, { useState } from 'react';
import { View, SafeAreaView, StatusBar, Modal, Text, TouchableOpacity } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import ThoiKhoaBieuScreen from './../screens/ThoiKhoaBieuScreen';
import MarkScreen from './../screens/MarkScreen';
import MenuScreen from '../screens/MenuScreen';
import { useAuth } from '../AuthContext';


const Tab = createBottomTabNavigator(); // Khởi tạo Tab Navigator

// Hàm hiển thị nội dung
const TabScreenWrapper = ({ children }) => (
  <View className="flex-1 pb-16">{children}</View>
);

// Hàm hiển thị Tab Thời Khoá Biểu
const WrappedThoiKhoaBieuScreen = () => (
  <TabScreenWrapper>
    <ThoiKhoaBieuScreen />
  </TabScreenWrapper>
);

// Hàm hiển thị Tab Bảng Điểm
const WrappedMarkScreen = () => (
  <TabScreenWrapper>
    <MarkScreen />
  </TabScreenWrapper>
);

// Hàm hiển thị Tab Menu
const WrappedMenuScreen = () => (
    <TabScreenWrapper>
        <MenuScreen />
    </TabScreenWrapper>
);

// Hàm hiển thị Tab Đăng xuất
const LogoutScreen = () => (
    <TabScreenWrapper>
        <MarkScreen />
    </TabScreenWrapper>
);

// Hàm hiển thị
function SwipeableScreens() {
    const { logout } = useAuth();
    const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  return (
    <LinearGradient
      colors={['#4c669f', '#3b5998', '#192f6a']}
      className="flex-1"
    >
      <StatusBar barStyle="light-content" />
      <SafeAreaView className="flex-1">
        <NavigationContainer independent={true}>
          <Tab.Navigator
            screenOptions={({ route }) => ({
              tabBarIcon: ({ focused, color, size }) => {
                let iconName;
                if (route.name === 'ThoiKhoaBieu') {
                  iconName = focused ? 'calendar' : 'calendar-outline';
                } else if (route.name === 'Mark') {
                  iconName = focused ? 'cellular' : 'cellular-outline';
                } else if (route.name === 'Menu') {
                    iconName = focused ? 'menu' : 'menu-outline';
                }

                return (
                  <View className={`items-center justify-center ${focused ? '-top-1' : 'top-0'}`}>
                    <Ionicons name={iconName} size={size} color={color} />
                  </View>
                );
              },
              tabBarActiveTintColor: '#ffd700',
              tabBarInactiveTintColor: '#e0e0e0',
              tabBarStyle: {
                backgroundColor: '#1c1c1c',
                borderTopWidth: 0,
                height: 65,
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: 0,
                elevation: 5, 
                paddingHorizontal: 20,
              },
              headerShown: false,
              tabBarLabelStyle: {
                fontWeight: 'bold',
                fontSize: 12,
                marginBottom: 5,
              },
              tabBarItemStyle: {
                padding: 10,
              },
            })}
          >
            <Tab.Screen 
              name="ThoiKhoaBieu" 
              component={WrappedThoiKhoaBieuScreen}
              options={{ 
                tabBarLabel: 'Thời Khoá Biểu',
              }}
            />
            <Tab.Screen 
              name="Mark" 
              component={WrappedMarkScreen}
              options={{ 
                tabBarLabel: 'Bảng Điểm',
              }}
            />
            <Tab.Screen 
              name="Menu" 
              component={WrappedMenuScreen}
              options={{ 
                tabBarLabel: 'Menu',
              }}
            />
            <Tab.Screen
                name="Logout"
                component={LogoutScreen}
                options={{
                    tabBarLabel: 'Đăng xuất',
                    tabBarIcon: ({ focused, color, size }) => (
                    <View className={`items-center justify-center ${focused ? '-top-1' : 'top-0'}`}>
                        <Ionicons name={focused ? 'log-out' : 'log-out-outline'} size={size} color={color} />
                    </View>
                    ),
                    tabBarButton: (props) => (
                    <TouchableOpacity
                        {...props}
                        onPress={() => setLogoutModalVisible(true)}
                    />
                    ),
                }}
            />
          </Tab.Navigator>
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
        </NavigationContainer>
      </SafeAreaView>
    </LinearGradient>
  );
}

export default SwipeableScreens;