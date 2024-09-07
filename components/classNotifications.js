import { scheduleLocalNotification, cancelAllClassNotifications } from './LocalNotification';

// Hàm để lên lịch thông báo cho một môn học
export const scheduleClassNotifications = async (className, startTime, classRoom) => {
  const classDate = new Date(startTime);
  
  // Lên lịch thông báo trước 30 phút
  await scheduleNotificationForClass(className, classDate, 30, classRoom);
  
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

  // Cập nhật hàm scheduleAllClassNotifications để bao gồm việc hủy các thông báo cũ
  export const scheduleAllClassNotifications = async (classes) => {
    // Hủy tất cả các thông báo hiện có trước khi lên lịch mới
    await cancelAllClassNotifications();
  
    for (const classInfo of classes) {
      await scheduleClassNotifications(classInfo.className, classInfo.startTime);
    }
  };