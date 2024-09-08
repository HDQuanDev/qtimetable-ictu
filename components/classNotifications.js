import { scheduleLocalNotification } from './LocalNotification';

// Hàm để lên lịch thông báo cho một môn học
export const scheduleClassNotifications = async (className, startTime, classRoom) => {
  const classDate = new Date(startTime);
  
  // Lên lịch thông báo trước 10 TIẾNG
  await scheduleNotificationForClass(className, classDate, 600, classRoom);
  
  // Lên lịch thông báo trước 15 phút
  await scheduleNotificationForClass(className, classDate, 15, classRoom);
  
  // Lên lịch thông báo trước 5 phút
  await scheduleNotificationForClass(className, classDate, 5, classRoom);
  
  // Lên lịch thông báo ngay lúc bắt đầu
  await scheduleNotificationForClass(className, classDate, 0, classRoom);
};

// Hàm hỗ trợ để lên lịch một thông báo cụ thể
const scheduleNotificationForClass = async (className, classDate, minutesBefore, classRoom) => {
  const notificationTime = new Date(classDate.getTime() - minutesBefore * 60000);
  const now = new Date();
  
  // Chỉ lên lịch thông báo nếu thời gian thông báo trong tương lai
  if (notificationTime > now) {
    const secondsUntilNotification = Math.floor((notificationTime.getTime() - now.getTime()) / 1000);
    
    let title, body;
    if (minutesBefore === 0) {
      title = `${className} đang bắt đầu!`;
      body = `Lớp học ${className} đang bắt đầu ngay bây giờ, hãy đến lớp ${classRoom} ngay thôi!`;
    } else {
      title = `Sắp đến giờ học ${className}`;
      body = `Lớp học ${className} sẽ bắt đầu trong ${minutesBefore} phút nữa, hãy đến lớp ${classRoom} ngay thôi!`;
    }
    
    await scheduleLocalNotification(title, body, secondsUntilNotification);
  }
};

// Hàm để lên lịch thông báo cho một môn thi
export const scheduleExamNotifications = async (examName, examStart, examRoom, examSBD) => {
  const examDate = new Date(examStart);
  
  await scheduleExamNotificationForClass(examName, examDate, 600, examRoom, examSBD);
  
  await scheduleExamNotificationForClass(examName, examDate, 15, examRoom, examSBD);
  
  await scheduleExamNotificationForClass(examName, examDate, 5, examRoom, examSBD);
  
  await scheduleExamNotificationForClass(examName, examDate, 0, examRoom, examSBD);
};

// Hàm hỗ trợ để lên lịch một thông báo cụ thể
const scheduleExamNotificationForClass = async (examName, examDate, minutesBefore, examRoom, examSBD) => {
  const notificationTime = new Date(examDate.getTime() - minutesBefore * 60000);
  const now = new Date();
  
  // Chỉ lên lịch thông báo nếu thời gian thông báo trong tương lai
  if (notificationTime > now) {
    const secondsUntilNotification = Math.floor((notificationTime.getTime() - now.getTime()) / 1000);
    
    let title, body;
    if (minutesBefore === 0) {
      title = `Lịch thi môn ${examName} đang bắt đầu!`;
      body = `Môn thi ${examName} đang bắt đầu ngay bây giờ, mời bạn SBD ${examSBD} đến phòng thi ${examRoom} ngay thôi!`;
    } else {
      title = `Sắp đến giờ thi môn ${examName}`;
      body = `Môn thi ${examName} sẽ bắt đầu trong ${minutesBefore} phút nữa, mời bạn SBD ${examSBD} đến phòng thi ${examRoom} ngay thôi!`;
    }
    
    await scheduleLocalNotification(title, body, secondsUntilNotification);
  }
};