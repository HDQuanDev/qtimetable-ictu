import React from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';

const ModalComponent = ({ 
  visible, 
  onClose, 
  title, 
  content, 
  closeText, 
  closeColor, 
  actionText, 
  actionColor, 
  onActionPress 
}) => {
  return (
    <Modal
      transparent={true}
      animationType="fade"
      visible={visible}
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-center items-center bg-black bg-opacity-60" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
        <View className="bg-gray-900 rounded-lg p-6 w-11/12 max-w-sm">
          <Text className="text-gray-300 text-2xl font-bold mb-4 text-center">{title}</Text>
          <Text className="text-gray-500 mb-6 text-base">
            {content.split('\n').map((line, index) => (
              <React.Fragment key={index}>
                {line}
                {'\n'}
              </React.Fragment>
            ))}
          </Text>
          <View className={`flex-row ${actionText && onActionPress ? 'justify-between' : 'justify-end'}`}>
            {actionText && onActionPress && (
              <TouchableOpacity
                onPress={onClose}
                className={`py-2 px-4 rounded-md ${closeColor}`}
              >
                <Text className="text-white text-center font-semibold">{closeText}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={actionText && onActionPress ? onActionPress : onClose}
              className={`py-2 px-4 rounded-md ${actionText && onActionPress ? actionColor : closeColor}`}
            >
              <Text className="text-white text-center font-semibold">{actionText || closeText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default ModalComponent;