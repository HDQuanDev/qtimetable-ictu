import {
  scheduleClassNotifications,
  scheduleLocalNotification,
  scheduleExamNotifications,
  cancelAllClassNotifications,
  sendImmediateNotification,
} from "./LocalNotification";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { logError } from "./SaveLogs";
import moment from "moment-timezone";

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
    return scheduledNotifications === "true";
  } catch (error) {
    await logError(
      "ERROR",
      "ScheduleNotification-77: Lỗi khi kiểm tra thông báo: " + error
    );
    return false;
  }
};

export const scheduleAllNotifications = async () => {
  try {
    const isScheduled = await checkScheduleNotifications();
    if (!isScheduled) {
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
                "ScheduleNotification-119: Lỗi khi lên lịch thông báo: " + error
              );
            }
          }
        }
      }

      const noClassMessages = [
        "Ting ting! Ngày mai không có lớp nè! Hãy `setMood('siêu vui') && danceAroundTheRoom();`",
        "Ối giời ơi, ngày mai nghỉ học kìa! Đến lúc `launchConfetti() && shoutHooray();`",
        "Tin hot: Ngày mai không có lớp! Mau `prepareSnacks() && bingeWatchFavoriteSeries();`",
        "Ê psst, ngày mai nghỉ học đấy! Hãy `rollOutOfBed.late() && enjoyPajamaDay();`",
        "Tin vui: Ngày mai không có lớp! Đến lúc `activateSlothMode() && embraceLaziness();`",
        "Ting tong! Không có lớp ngày mai nha! Mau `planAdventure() || buildBlanketFort();`",
        "Tada! Ngày mai được nghỉ học! Hãy `unleashCreativity() && makeAGlorifulMess();`",
        "Ối chu choa, ngày mai không có lớp kìa! Đến lúc `orderPizza() && inviteFriendsOver();`",
        "Tin ngọt ngào: Ngày mai nghỉ học! Mau `grabFavoriteBook() && readUntilSunrise();`",
        "Ê bạn ơi, ngày mai không có lớp đâu! Hãy `packBackpack() && goOnMiniAdventure();`",
        "Tin khủng: Ngày mai được nghỉ! Đến lúc `adoptTemporaryCat() && becomeABuddyForADay();`",
        "Ting ting ting! Không có lớp ngày mai nha! Mau `createMovieMarathon() && inviteTheBestie();`",
        "Ố la la, ngày mai nghỉ học! Hãy `turnLivingRoomIntoArtStudio() && paintLikeAnArtist();`",
        "Tin vui nè: Ngày mai không có lớp! Đến lúc `visitLocalCafe() && tryEveryPastry();`",
        "Ê này, ngày mai được nghỉ đấy! Mau `inventNewRecipe() && hostMasterchefCompetition();`",
        "Tin hot hòn họt: Ngày mai không có lớp! Hãy `transformIntoSuperHero() && saveTheDay();`",
        "Ối giời, ngày mai nghỉ học kìa! Đến lúc `buildTimeMachine() && visitDinosaurs();`",
        "Tin vui nè bạn ơi: Ngày mai không có lớp! Mau `organizeFlashMob() && danceInPublic();`",
        "Ting tong! Ngày mai được nghỉ nha! Hãy `learnMagicTricks() && amazeFriends();`",
        "Ê psst, ngày mai không có lớp đâu! Đến lúc `buildRobotFriend() && teachItToLaugh();`",
        "Tin khủng: Ngày mai nghỉ học! Mau `hostPajamaParty() && stayUpAllNight();`",
        "Ố la la, ngày mai không có lớp kìa! Hãy `learnNewLanguage() && orderFoodInIt();`",
        "Tin ngọt ngào: Ngày mai được nghỉ! Đến lúc `becomeYouTuber() && goViral();`",
        "Ting ting ting! Không có lớp ngày mai nha! Mau `writeFunnyStory() && performItForFamily();`",
        "Ối chu choa, ngày mai nghỉ học! Hãy `createMusicVideo() && becomeTikTokStar();`",
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
            "ScheduleNotification-198: Lỗi khi lên lịch thông báo: " + error
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
            "ScheduleNotification-248: Lỗi khi lên lịch thông báo: " + error
          );
        }
      }

      try {
        const ghichu = await AsyncStorage.getItem("userGhiChu");
        if (ghichu) {
          const noteData = JSON.parse(ghichu);
          if (!Array.isArray(noteData)) {
            throw new TypeError("Dữ liệu ghi chú không phải là mảng");
          }
          for (const item of noteData) {
            const now = moment().tz("Asia/Ho_Chi_Minh");
            const selectedDate = moment(item.date).tz("Asia/Ho_Chi_Minh");
            const duration = moment.duration(selectedDate.diff(now));
            const remainingTime = Math.floor(duration.asSeconds());
            if (item.showNotification && remainingTime > 0) {
              await scheduleLocalNotification(
                "Nhắc nhở ghi chú: " + item.title,
                item.content,
                remainingTime
              );
            }
          }
        }
      } catch (error) {
        await logError(
          "ERROR",
          "ScheduleNotification-276: Lỗi khi lên lịch thông báo: " + error
        );
      }

      await AsyncStorage.setItem("scheduledNotifications", "true");
      await logError(
        "INFO",
        "ScheduleNotification-283: Lên lịch thông báo thành công từ dữ liệu mới"
      );
      await sendImmediateNotification(
        "Thông báo hệ thống",
        "Đã lên lịch thông báo thành công từ dữ liệu lịch học, lịch thi và ghi chú của bạn!"
      );
    }
  } catch (error) {
    await logError(
      "ERROR",
      "ScheduleNotification-293: Lỗi khi lên lịch thông báo: " + error
    );
  }
};
