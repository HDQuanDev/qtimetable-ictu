import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  StatusBar,
  TouchableOpacity,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useTheme } from "../components/ThemeProvider";
import { LinearGradient } from "expo-linear-gradient";

// Icon component for clock
const ClockIcon = ({ color, size }) => (
  <View
    style={{
      width: size,
      height: size,
      borderRadius: size / 2,
      borderWidth: 2,
      borderColor: color,
      justifyContent: "center",
      alignItems: "center",
    }}
  >
    <View
      style={{
        width: 1,
        height: size / 2.5,
        backgroundColor: color,
        position: "absolute",
        transform: [{ translateY: -size / 10 }],
      }}
    />
    <View
      style={{
        width: size / 3,
        height: 1,
        backgroundColor: color,
        position: "absolute",
        transform: [{ rotate: "90deg" }, { translateX: size / 8 }],
      }}
    />
  </View>
);

// Main component for class schedule screen
const ClassScheduleScreen = () => {
  const { isDarkMode } = useTheme();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentStatus, setCurrentStatus] = useState({
    type: "",
    period: null,
    nextPeriod: null,
    timeUntilNext: "",
    timeUntilBreak: "",
  });

  const periods = useMemo(
    () => ({
      1: { start: "06:45", end: "07:35" },
      2: { start: "07:40", end: "08:30" },
      3: { start: "08:40", end: "09:30" },
      4: { start: "09:40", end: "10:30" },
      5: { start: "10:35", end: "11:25" },
      6: { start: "13:00", end: "13:50" },
      7: { start: "13:55", end: "14:45" },
      8: { start: "14:50", end: "15:40" },
      9: { start: "15:55", end: "16:45" },
      10: { start: "16:50", end: "17:40" },
      11: { start: "18:15", end: "19:05" },
      12: { start: "19:10", end: "20:00" },
      13: { start: "20:10", end: "21:00" },
      14: { start: "21:10", end: "22:00" },
      15: { start: "22:10", end: "23:00" },
      16: { start: "23:30", end: "00:20" },
    }),
    []
  );

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Update current status whenever time changes
  useEffect(() => {
    updateCurrentStatus();
  }, [currentTime]);

  // Cập nhật trạng thái hiện tại
  const updateCurrentStatus = () => {
    const currentTimeString = currentTime.toTimeString().slice(0, 5);
    let found = false;

    for (const [period, time] of Object.entries(periods)) {
      if (currentTimeString >= time.start && currentTimeString < time.end) {
        const timeUntilBreak = calculateTimeUntilNext(
          currentTimeString,
          time.end
        );
        setCurrentStatus({
          type: "class",
          period: Number(period),
          nextPeriod: null,
          timeUntilNext: "",
          timeUntilBreak,
        });
        found = true;
        break;
      }
    }

    if (!found) {
      const nextPeriod = findNextPeriod(currentTimeString);
      const timeUntilNext = calculateTimeUntilNext(
        currentTimeString,
        periods[nextPeriod].start
      );
      setCurrentStatus({
        type: "break",
        period: null,
        nextPeriod,
        timeUntilNext,
        timeUntilBreak: "",
      });
    }
  };

  // Tìm tiết tiếp theo
  const findNextPeriod = (currentTimeString) => {
    let nextPeriod = 1;
    for (const [period, time] of Object.entries(periods)) {
      if (currentTimeString < time.start) {
        nextPeriod = Number(period);
        break;
      }
    }
    return nextPeriod;
  };

  // Tính thời gian đến tiết tiếp theo
  const calculateTimeUntilNext = (currentTimeString, nextTimeString) => {
    const current = new Date(`2000-01-01T${currentTimeString}:00`);
    let next = new Date(`2000-01-01T${nextTimeString}:00`);
    if (next < current) {
      next.setDate(next.getDate() + 1);
    }
    const diff = next - current;
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    return `${hours}h${minutes}m`;
  };

  // Tính thời gian nghỉ giữa các tiết
  const getBreakTime = (currentEnd, nextStart) => {
    const [currentHour, currentMinute] = currentEnd.split(":").map(Number);
    const [nextHour, nextMinute] = nextStart.split(":").map(Number);

    let diffMinutes =
      nextHour * 60 + nextMinute - (currentHour * 60 + currentMinute);
    if (diffMinutes < 0) diffMinutes += 24 * 60; // Handle overnight break

    return `${Math.floor(diffMinutes / 60)}h${diffMinutes % 60}m`;
  };

  // Lấy màu cho trạng thái
  const getStatusColor = () => {
    if (currentStatus.type === "class") {
      return isDarkMode
        ? "bg-emerald-900 border-2 border-emerald-500"
        : "bg-emerald-50 border-2 border-emerald-200";
    } else {
      return isDarkMode
        ? "bg-amber-900 border-2 border-amber-500"
        : "bg-amber-50 border-2 border-amber-200";
    }
  };

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
        {/* Fixed Header */}
        <LinearGradient
          colors={
            isDarkMode
              ? ["#1e293b", "#334155", "#475569"]
              : ["#ebf8ff", "#dbeafe", "#bfdbfe"]
          }
          className={`px-4 pt-12 flex-row justify-between items-center ${
            isDarkMode ? "dark:bg-[#1f2937]" : "bg-[#f0f9ff]"
          } rounded-b-3xl`}
        >
          <Text
            className={`text-3xl font-bold ${
              isDarkMode ? "text-blue-400" : "text-blue-500"
            } text-center mb-4`}
          >
            Thời Gian Biểu
          </Text>
          <TouchableOpacity
            className={`bg-opacity-20 p-2 rounded-full ${
              isDarkMode ? "bg-gray-700" : "bg-blue-100"
            } mb-4`}
          >
            <ClockIcon color={isDarkMode ? "#93c5fd" : "#60a5fa"} size={24} />
          </TouchableOpacity>
        </LinearGradient>

        {/* Current Status */}
        <View className={`m-4 p-4 rounded-3xl ${getStatusColor()} shadow-md`}>
          <Text
            className={`text-xl font-semibold ${
              isDarkMode ? "text-gray-100" : "text-gray-800"
            }`}
          >
            {currentStatus.type === "class"
              ? `Đang học tiết ${currentStatus.period} (Còn ${currentStatus.timeUntilBreak} đến giải lao)`
              : `Đang giải lao (Còn ${currentStatus.timeUntilNext} đến tiết ${currentStatus.nextPeriod})`}
          </Text>
          <Text
            className={`text-lg mt-2 ${
              isDarkMode ? "text-gray-100" : "text-gray-800"
            }`}
          >
            {currentTime.toLocaleTimeString()}
          </Text>
        </View>

        {/* Scrollable Content */}
        <ScrollView className="flex-grow">
          <View className="p-4 space-y-3">
            {Object.entries(periods).map(([period, time], index, array) => {
              const isCurrentPeriod =
                currentStatus.type === "class" &&
                currentStatus.period === Number(period);
              return (
                <View
                  key={period}
                  className={`rounded-3xl overflow-hidden shadow-md ${
                    isCurrentPeriod ? "border-2 border-green-600 relative" : ""
                  }
            ${
              isDarkMode
                ? "border-2 border-gray-600"
                : "border-2 border-gray-400"
            }
            `}
                >
                  {isCurrentPeriod && (
                    <View className="absolute left-0 top-0 bottom-0 w-1 bg-green-600" />
                  )}
                  <LinearGradient
                    colors={
                      isCurrentPeriod
                        ? isDarkMode
                          ? ["#2C5282", "#2B6CB0"]
                          : ["#9AE6B4", "#68D391"]
                        : isDarkMode
                        ? ["#1F2937", "#374151"]
                        : ["#E5E7EB", "#D1D5DB"]
                    }
                    className="p-4"
                  >
                    <View className="flex-row justify-between items-center">
                      <View className="flex-row items-center space-x-3">
                        <View
                          className={`w-10 h-10 rounded-full ${
                            isCurrentPeriod
                              ? isDarkMode
                                ? "bg-blue-700"
                                : "bg-green-500"
                              : isDarkMode
                              ? "bg-gray-700"
                              : "bg-gray-300"
                          } flex items-center justify-center`}
                        >
                          <Text
                            className={`font-bold text-lg ${
                              isCurrentPeriod
                                ? "text-white"
                                : isDarkMode
                                ? "text-white"
                                : "text-gray-800"
                            }`}
                          >
                            {period}
                          </Text>
                        </View>
                        <View>
                          <Text
                            className={`font-semibold text-base ${
                              isCurrentPeriod
                                ? isDarkMode
                                  ? "text-blue-200"
                                  : "text-green-800"
                                : isDarkMode
                                ? "text-white"
                                : "text-gray-800"
                            }`}
                          >
                            Tiết {period}
                          </Text>
                          <Text
                            className={`text-sm ${
                              isCurrentPeriod
                                ? isDarkMode
                                  ? "text-blue-300"
                                  : "text-green-700"
                                : isDarkMode
                                ? "text-gray-400"
                                : "text-gray-600"
                            }`}
                          >
                            {time.start} - {time.end}
                          </Text>
                        </View>
                      </View>
                      {index < array.length - 1 && (
                        <View
                          className={`px-3 py-1 rounded-full ${
                            isCurrentPeriod
                              ? isDarkMode
                                ? "bg-blue-800"
                                : "bg-green-200"
                              : isDarkMode
                              ? "bg-gray-700"
                              : "bg-gray-300"
                          }`}
                        >
                          <Text
                            className={`text-xs ${
                              isCurrentPeriod
                                ? isDarkMode
                                  ? "text-blue-200"
                                  : "text-green-800"
                                : isDarkMode
                                ? "text-gray-300"
                                : "text-gray-700"
                            }`}
                          >
                            Giải lao:{" "}
                            {getBreakTime(time.end, array[index + 1][1].start)}
                          </Text>
                        </View>
                      )}
                    </View>
                  </LinearGradient>
                </View>
              );
            })}
          </View>
        </ScrollView>
      </LinearGradient>
    </GestureHandlerRootView>
  );
};

export default ClassScheduleScreen;
