import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Animated,
  ScrollView,
} from "react-native";
import { BlurView } from "expo-blur";
import { useTheme } from "./ThemeProvider";

const ModalComponent = ({
  visible,
  onClose,
  title,
  content,
  closeText,
  closeColor = "bg-gray-500 dark:bg-gray-700",
  actionText,
  actionColor = "bg-blue-500 dark:bg-blue-700",
  onActionPress,
}) => {
  const { isDarkMode } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 5,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.9);
    }
  }, [visible]);

  return (
    <Modal
      transparent={true}
      animationType="none"
      visible={visible}
      onRequestClose={onClose}
    >
      <BlurView
        intensity={100}
        tint={isDarkMode ? "dark" : "light"}
        style={{ flex: 1 }}
      >
        <Animated.View
          className="flex-1 justify-center items-center"
          style={{ opacity: fadeAnim }}
        >
          <Animated.View
            className={`${
              isDarkMode ? "bg-gray-800" : "bg-white"
            } rounded-3xl shadow-lg p-6 w-11/12 max-w-sm ${
              isDarkMode
                ? "border-2 border-gray-700"
                : "border-2 border-gray-300"
            }`}
            style={{ transform: [{ scale: scaleAnim }], maxHeight: "80%" }}
          >
            <Text
              className={`${
                isDarkMode ? "text-gray-100" : "text-gray-900"
              } text-2xl font-bold mb-4 text-center`}
            >
              {title}
            </Text>
            <ScrollView className="mb-6">
              {typeof content === 'string' ? (
                <Text
                  className={`${
                    isDarkMode ? "text-gray-300" : "text-gray-600"
                  } text-base`}
                >
                  {content}
                </Text>
              ) : (
                content
              )}
            </ScrollView>
            <View
              className={`flex-row ${
                actionText && onActionPress ? "justify-between" : "justify-end"
              }`}
            >
              {actionText && onActionPress && (
                <TouchableOpacity
                  onPress={onClose}
                  className={`py-3 px-6 rounded-lg ${closeColor}`}
                  activeOpacity={0.7}
                >
                  <Text className="text-white text-center font-semibold">
                    {closeText}
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={actionText && onActionPress ? onActionPress : onClose}
                className={`py-3 px-6 rounded-lg ${
                  actionText && onActionPress ? actionColor : closeColor
                }`}
                activeOpacity={0.7}
              >
                <Text className="text-white text-center font-semibold">
                  {actionText || closeText}
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </Animated.View>
      </BlurView>
    </Modal>
  );
};

export default ModalComponent;