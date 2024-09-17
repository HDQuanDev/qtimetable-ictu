import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Linking, Alert, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import ModalComponent from './../components/ModalComponent';
import { checkForUpdate } from '../components/CheckUpdate';
import NetInfo from '@react-native-community/netinfo';

// Hàm hiển thị nút chức năng
const MenuButton = ({ title, icon, color, onPress, size }) => (
    <TouchableOpacity 
      className={`justify-center items-center rounded-2xl p-3 mb-4 ${color}`}
      style={{ width: size, aspectRatio: 1 }}
      onPress={onPress}
    >
      <Ionicons name={icon} size={24} color="white" />
      <Text className="text-white mt-2 font-semibold text-center text-sm">{title}</Text>
    </TouchableOpacity>
);

const MenuScreen = ({ navigation }) => {
  const [isAboutModalVisible, setAboutModalVisible] = useState(false);
  const [isChangelogModalVisible, setChangelogModalVisible] = useState(false);
  const [modalProps, setModalProps] = useState(null);
  const { width } = useWindowDimensions();
  const [buttonSize, setButtonSize] = useState(width * 0.44);

  useEffect(() => {
    const calculateButtonSize = () => {
      const size = width < 768 ? width * 0.44 : width * 0.3;
      setButtonSize(size);
    };

    calculateButtonSize();
  }, [width]);

  // Hàm xử lý chọn chức năng
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
        const state = await NetInfo.fetch();
        if (state.isConnected && state.isInternetReachable){
          const updateInfo = await checkForUpdate('all');
          setModalProps(updateInfo);
        } else {
          Alert.alert('Lỗi', 'Vui lòng kiểm tra kết nối mạng của bạn và thử lại...')
        }
        break;
      default:
        break;
    }
  };

  // Hiển thị giao diện
  return (
    <LinearGradient
      colors={['#1f1f1f', '#121212', '#000000']}
      className="flex-1"
    >
      <ScrollView className="flex-grow p-5">
        <View className="flex-row justify-between items-center mb-6 pt-6">
          <Text className="text-4xl font-bold text-green-400">Menu</Text>
        </View>
        <View className="flex-row flex-wrap justify-between">
          <MenuButton
            title="Thông tin ứng dụng"
            icon="information-circle-outline"
            color="bg-purple-800"
            onPress={() => setAboutModalVisible(true)}
            size={buttonSize}
          />
          <MenuButton
            title="Nhật ký thay đổi"
            icon="git-branch-outline"
            color="bg-teal-700"
            onPress={() => setChangelogModalVisible(true)}
            size={buttonSize}
          />
          <MenuButton
            title="Mã nguồn"
            icon="code-slash-outline"
            color="bg-blue-700"
            onPress={() => handleMenuOption('source')}
            size={buttonSize}
          />
          <MenuButton
            title="Liên hệ"
            icon="mail-outline"
            color="bg-red-700"
            onPress={() => handleMenuOption('contact')}
            size={buttonSize}
          />
          <MenuButton
            title="Trò Chuyện Với QAI"
            icon="chatbubble-ellipses-outline"
            color="bg-cyan-700"
            onPress={() => handleMenuOption('aichat')}
            size={buttonSize}
          />
          <MenuButton
            title="Kiểm tra cập nhật"
            icon="cloud-download-outline"
            color="bg-yellow-600"
            onPress={() => handleMenuOption('update')}
            size={buttonSize}
          />
            <View className="mt-4 bg-gray-800 rounded-lg p-4">
            <Text className="text-white font-bold text-lg mb-2">Thông tin thêm</Text>
            <View className="mt-2">
                <Text className="text-white opacity-70 text-sm mb-3">Đây là 1 dự án mã nguồn mở được phát triển bởi Hứa Đức Quân. Ứng dụng được phát triển dựa trên nhu cầu học tập và sử dụng của sinh viên trường Đại học Công Nghệ Thông Tin và Truyền Thông - Đại học Thái Nguyên.</Text>
                <Text className="text-white opacity-70 text-sm mb-1 text-center">
                Package ID: <Text className="font-bold text-white">com.hdquandev.thoikhoabieuapp</Text>
                </Text>
                <Text className="text-white opacity-70 text-sm mb-1 text-center">
                Version: <Text className="font-bold text-white">1.6.stable</Text>
                </Text>
                <Text className="text-white opacity-70 text-sm mb-1 text-center">
                Powered by <Text className="font-bold text-white" onPress={() => Linking.openURL('https://m.me/quancp72h')}>Hứa Đức Quân</Text>
                </Text>
                <Text className="text-white opacity-70 text-sm mb-1 text-center">
                Build Day: <Text className="font-bold text-white">18/09/2024</Text>
                </Text>
            </View>
            </View>
        </View>
        <ModalComponent
          visible={isAboutModalVisible}
          onClose={() => setAboutModalVisible(false)}
          title="Thông tin ứng dụng"
          content={`Đây là ứng dụng dành cho Sinh viên trường Trường đại học Công Nghệ Thông Tin và Truyền Thông - Đại học Thái Nguyên\n- Chức năng chính:\n    + Xem thời khoá biểu, lịch thi.\n    + Tra cứu điểm học.\n * Ứng dụng được phát triển và chia sẽ mã nguồn bởi: Hứa Đức Quân`}
          closeText={'Đóng'}
          closeColor={'bg-purple-800'}
        />

        <ModalComponent
          visible={isChangelogModalVisible}
          onClose={() => setChangelogModalVisible(false)}
          title="Nhật ký thay đổi"
          content={`** PHIÊN BẢN 1.6.STABLE **\n- Cập nhật và tối ưu hoá lại giao diện.\n- Thêm chức năng tra cứu Điểm.\n- Sửa lỗi ứng dụng hiển thị các thông báo lỗi khi thiết bị có kết nối mạng nhưng không có mạng.\n- Cải thiện kiểm tra kết nối mạng ở 1 số trường hợp cần sử dụng mạng.\n- Cải thiện hiệu suất và tối ưu hoá trải nghiệm người dùng.`}
          closeText={'Đóng'}
          closeColor={'bg-teal-700'}
        />

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
      </ScrollView>
    </LinearGradient>
  );
};

export default MenuScreen;