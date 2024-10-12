import React, { useEffect } from "react";
import { View, Text, Dimensions, Animated, Easing, Platform } from "react-native";
import { useTheme } from "../components/ThemeProvider";

const { width, height } = Dimensions.get("window");
const baseSize = Math.min(width, height) * 0.2;

// Hàm helper để lấy safe area insets
const getSafeAreaInsets = () => {
  if (Platform.OS === 'ios') {
    // Giá trị ước tính cho iOS, có thể điều chỉnh nếu cần
    return { top: 44, bottom: 34, left: 0, right: 0 };
  }
  return { top: 0, bottom: 0, left: 0, right: 0 };
};

export default function LoadingSpinner() {
  const { isDarkMode } = useTheme();
  const insets = getSafeAreaInsets();
  const spinValue = new Animated.Value(0);

  useEffect(() => {
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const responsiveSize = {
    width: baseSize,
    height: baseSize,
  };

  const textStyles = {
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    textAlign: "center",
  };

  return (
    <View
      style={[
        {
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
          paddingLeft: insets.left,
          paddingRight: insets.right,
        },
        isDarkMode ? { backgroundColor: "#1F2937" } : { backgroundColor: "#F3F4F6" },
      ]}
    >
      <View style={{ alignItems: "center" }}>
        <Animated.View
          style={[
            responsiveSize,
            {
              transform: [{ rotate: spin }],
            },
          ]}
        >
          <View
            style={[
              responsiveSize,
              {
                borderRadius: baseSize / 2,
                borderWidth: baseSize * 0.1,
                borderColor: isDarkMode ? "#60A5FA" : "#3B82F6",
                borderTopColor: "transparent",
              },
            ]}
          />
        </Animated.View>
        <Text
          style={[
            textStyles,
            {
              marginTop: baseSize * 0.5,
              fontSize: baseSize * 0.25,
              fontWeight: "600",
              color: isDarkMode ? "#93C5FD" : "#2563EB",
            },
          ]}
        >
          Đang Tải
        </Text>
        <Text
          style={[
            textStyles,
            {
              marginTop: baseSize * 0.1,
              fontSize: baseSize * 0.15,
              color: isDarkMode ? "#D1D5DB" : "#4B5563",
            },
          ]}
        >
          Vui lòng chờ, hệ thống đang xử lý
        </Text>
      </View>
    </View>
  );
}