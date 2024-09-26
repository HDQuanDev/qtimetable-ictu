import {
  scheduleClassNotifications,
  scheduleLocalNotification,
  scheduleExamNotifications,
  cancelAllClassNotifications,
} from "./LocalNotification";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { logError } from "./SaveLogs";

// Định nghĩa các khung giờ học trong ngày
const periods = {
  1: { start: "6:45", end: "7:35" },
  2: { start: "7:40", end: "8:30" },
  3: { start: "8:40", end: "9:30" },
  4: { start: "9:40", end: "10:30" },
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
};

// Hàm chuyển đổi chuỗi ngày tháng sang đối tượng Date
const parseDate = (dateString) => {
  const [day, month, year] = dateString.split("/");
  return new Date(year, month - 1, day);
};

// Hàm lấy thời gian bắt đầu của một lớp học
const getDateTimeStart = (startDate, thu, tietHoc) => {
  const dayOfWeek = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
  const date = parseDate(startDate);
  const startDayOfWeek = date.getDay();
  const targetDayIndex = thu === "8" ? 0 : parseInt(thu) - 1;
  let daysToAdd = targetDayIndex - startDayOfWeek;
  if (daysToAdd < 0) daysToAdd += 7;
  date.setDate(date.getDate() + daysToAdd);
  const startTime = periods[tietHoc.split(" --> ")[0]].start.split(":");
  date.setHours(parseInt(startTime[0]), parseInt(startTime[1]));
  return date;
};

// Hàm thêm số 0 vào trước số nếu số đó nhỏ hơn 10
function pad(number) {
  return (number < 10 ? "0" : "") + number;
}

// hàm chuyển đổi ngày tháng sang chuỗi ngày tháng
const formatDateTime = (date) => {
  const pad = (num) => num.toString().padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}:00+07:00`;
};

const checkScheduleNotifications = async () => {
  try {
    const scheduledNotifications = await AsyncStorage.getItem(
      "scheduledNotifications"
    );
    if (scheduledNotifications) {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    await logError(
      "ERROR",
      "ScheduleNotification: Lỗi khi kiểm tra thông báo: " + error
    );
    return false;
  }
};

export const scheduleAllNotifications = async () => {
  try {
    if (await checkScheduleNotifications()) return;
    await cancelAllClassNotifications();
    const data = await AsyncStorage.getItem("userData_ThoiKhoaBieu");
    if (!data) return;
    const userData = JSON.parse(data);
    if (!Array.isArray(userData)) {
      throw new Error("Dữ liệu thời khóa biểu không phải là mảng");
    }
    const currentDate = new Date();
    const classesByDay = {};
    for (const weekData of userData) {
      for (const item of weekData.data) {
        const dateTimeStart = getDateTimeStart(
          weekData.start_date,
          item["thu"],
          item["tiet_hoc"]
        );
        if (dateTimeStart > currentDate) {
          const formattedDate = formatDateTime(dateTimeStart);
          const dateKey = formattedDate.split("T")[0];

          if (!classesByDay[dateKey]) {
            classesByDay[dateKey] = [];
          }
          classesByDay[dateKey].push(item);
          try {
            await scheduleClassNotifications(
              item["lop_hoc_phan"],
              new Date(formattedDate),
              item["dia_diem"]
            );
          } catch (error) {
            await logError(
              "ERROR",
              "ScheduleNotification-120: Lỗi khi lên lịch thông báo: " + error
            );
          }
        }
      }
    }

    const noClassMessages = [
      "Ngày mai bạn không có lớp! Time to `document.body.style.backgroundColor = 'lightgreen';`",
      "Tuyệt, ngày mai bạn không có lớp! Hãy `performHappyDance();`",
      "Nhìn này, không có lớp ngày mai! Thời gian để `getPopcorn() && watchMovies(true);`",
      "Thật may, ngày mai bạn không phải đến lớp. Hãy `makeYourselfComfy(true);`",
      "Giỏi lắm, không có lớp ngày mai! Bây giờ `let's goOutside && feelTheSun();`",
      "Ngày mai bạn không có lịch học? Đây là cơ hội để `visitFriends() || burnMidnightOil();`",
      "Tuyệt vời, không có lớp ngày mai! Hãy `breakFromRoutine(true);`",
      "Wow, không có lớp ngày mai! Hãy `celebrateWithIceCream();`",
      "Ngày mai bạn không có lớp? Thời gian để `getCozy() && read();`",
      "Không có lớp ngày mai! Bây giờ `let's goto('beach') || goto('park');`",
      "Tuyệt, không có lớp ngày mai! Hãy `collectPets() && playWithThem();`",
      "Wow, không có lớp ngày mai! Bây giờ `let's rentAMovie() && binge();`",
      "Ngày mai bạn không có lớp? Thời gian để `getCreative() && expressYourself();`",
      "Không có lớp ngày mai! Bây giờ `let's goShopping() && buySomethingNice();`",
      "Tuyệt, không có lớp ngày mai! Hãy `tryNewRecipe() && cookSomethingYummy();`",
      "Wow, không có lớp ngày mai! Hãy `getCrafty() && makeSomethingCool();`",
      "Ngày mai bạn không có lớp? Thời gian để `getLostInAGoodBook() && read();`",
      "Không có lớp ngày mai! Bây giờ `let's goForAWalk() && enjoyTheOutdoors();`",
      "Tuyệt, không có lớp ngày mai! Hãy `getArtsy() && createSomethingBeautiful();`",
      "Wow, không có lớp ngày mai! Hãy `getActive() && doSomethingFun();`",
      "Ngày mai bạn không có lớp? Thời gian để `getOrganized() && declutter();`",
      "Không có lớp ngày mai! Bây giờ `let's goForABikeRide() && feelTheWind();`",
      "Tuyệt, không có lớp ngày mai! Hãy `getInspired() && doSomethingCreative();`",
      "Wow, không có lớp ngày mai! Hãy `getMoving() && danceAround();`",
      "Ngày mai bạn không có lớp? Thời gian để `getLostInMusic() && singAlong();`",
    ];

    // Lên lịch thông báo cho 30 ngày tới
    for (let i = 1; i <= 30; i++) {
      try {
        const notificationDate = new Date(currentDate);
        notificationDate.setDate(notificationDate.getDate() + i);
        const dateKey = formatDateTime(notificationDate).split("T")[0];
        const notificationTime = new Date(notificationDate);
        notificationTime.setDate(notificationTime.getDate() - 1);
        notificationTime.setHours(20, 0, 0, 0);

        if (notificationTime > currentDate) {
          let message;
          if (classesByDay[dateKey] && classesByDay[dateKey].length > 0) {
            message = `Ngày mai bạn có ${classesByDay[dateKey].length} lịch học cần thực hiện, hãy kiểm tra ngay lịch học của mình!`;
          } else {
            // Chọn một câu thông báo vui vẻ từ artifact "no-class-notification-messages"
            const randomIndex = Math.floor(
              Math.random() * noClassMessages.length
            );
            let messageTemplate = noClassMessages[randomIndex];

            // Xử lý các ký tự đặc biệt trong thông báo
            messageTemplate = messageTemplate.replace(/</g, "&lt;");
            messageTemplate = messageTemplate.replace(/>/g, "&gt;");
            messageTemplate = messageTemplate.replace(/"/g, "&quot;");
            messageTemplate = messageTemplate.replace(/'/g, "&#39;");
            message = messageTemplate;
          }

          const secondsUntilNotification = Math.max(
            0,
            Math.floor(
              (notificationTime.getTime() - new Date().getTime()) / 1000
            )
          );
          await scheduleLocalNotification(
            "Thông báo lịch học ngày mai",
            message,
            secondsUntilNotification
          );
        }
      } catch (error) {
        await logError(
          "ERROR",
          "ScheduleNotification-199: Lỗi khi lên lịch thông báo: " + error
        );
      }
    }

    const lichthi = await AsyncStorage.getItem("userData_LichThi");
    if (lichthi) {
      try {
        const examData = JSON.parse(lichthi);
        if (!Array.isArray(examData)) {
          throw new TypeError("Dữ liệu lichthi không phải là mảng");
        }
        for (const item of examData) {
          const [day, month, year] = item.ngay_thi.split("/");
          const [startTime] = item.ca_thi.match(/\(([^)]+)\)/)[1].split("-");
          const [hours, minutes] = startTime.split(":");
          const date = new Date(year, month - 1, day, hours, minutes);
          const examStart = `${date.getFullYear()}-${pad(
            date.getMonth() + 1
          )}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(
            date.getMinutes()
          )}:00+07:00`;
          await scheduleExamNotifications(
            item.ten_hoc_phan,
            new Date(examStart),
            item.phong_thi,
            item.so_bao_danh
          );
          const notificationDate = new Date(date);
          notificationDate.setDate(notificationDate.getDate() - 1);
          notificationDate.setHours(20, 0, 0, 0);
          if (notificationDate > currentDate) {
            const message = `Ngày mai bạn có lịch thi môn ${item.ten_hoc_phan} vào lúc ${startTime} tại phòng ${item.phong_thi}. Số báo danh của bạn là ${item.so_bao_danh}. Hãy chuẩn bị thật kỹ nhé!`;
            const secondsUntilNotification = Math.max(
              0,
              Math.floor(
                (notificationDate.getTime() - new Date().getTime()) / 1000
              )
            );
            await scheduleLocalNotification(
              "Thông báo lịch thi ngày mai",
              message,
              secondsUntilNotification
            );
          }
        }
      } catch (error) {
        await logError(
          "ERROR",
          "ScheduleNotification-249: Lỗi khi lên lịch thông báo: " + error
        );
      }
    }
    await AsyncStorage.setItem("scheduledNotifications", "true");
    await logError(
      "INFO",
      "ScheduleNotification: Lên lịch thông báo thành công từ dữ liệu mới"
    );
  } catch (error) {
    await logError(
      "ERROR",
      "ScheduleNotification-256: Lỗi khi lên lịch thông báo: " + error
    );
  }
};
