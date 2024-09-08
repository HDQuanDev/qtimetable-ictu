import NetInfo from '@react-native-community/netinfo';
import { api_checkUpdate } from '../services/api';
import { Alert, Linking } from 'react-native';

export const checkForUpdate = async (type = 'one') => {
  const appVersion = '1.1.beta';

  // Kiểm tra trạng thái kết nối mạng
  const state = await NetInfo.fetch();
  if (state.isConnected) {
      try {
          const downloadUrl = await api_checkUpdate(appVersion, type);
          if (downloadUrl && downloadUrl !== true) {
              Alert.alert(
                  'Cập nhật ứng dụng',
                  'Đã có phiên bản mới của ứng dụng. Vui lòng cập nhật để sử dụng các tính năng mới.',
                  [
                      { text: 'Hủy', style: 'cancel' },
                      { text: 'Cập nhật', onPress: () => {
                          Linking.openURL(downloadUrl);
                      } },
                  ]
              );
          }else if (downloadUrl === true) {
              Alert.alert('Thông báo', 'Bạn đang sử dụng phiên bản mới nhất của ứng dụng.');
          }
      } catch (error) {
          Alert.alert('Lỗi', error.message);
      }
  } else {
      Alert.alert('Thông báo', 'Không có kết nối internet.');
  }
};