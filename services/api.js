import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {scheduleLocalNotification, cancelAllClassNotifications, scheduleClassNotifications, scheduleExamNotifications} from '../components/LocalNotification';
import { Alert } from 'react-native';

// Định nghĩa các khung giờ học trong ngày
const periods = {
    1: { start: '6:45', end: '7:35' },
    2: { start: '7:40', end: '8:30' },
    3: { start: '8:40', end: '9:30' },
    4: { start: '9:40', end: '10:30' },
    5: { start: '10:35', end: '11:25' },
    6: { start: '13:00', end: '13:50' },
    7: { start: '13:55', end: '14:45' },
    8: { start: '14:50', end: '15:40' },
    9: { start: '15:55', end: '16:45' },
    10: { start: '16:50', end: '17:40' },
    11: { start: '18:15', end: '19:05' },
    12: { start: '19:10', end: '20:00' },
    13: { start: '20:10', end: '21:00' },
    14: { start: '21:10', end: '22:00' },
    15: { start: '22:10', end: '23:00' },
    16: { start: '23:30', end: '00:20' },
};

// Hàm chuyển đổi chuỗi ngày tháng sang đối tượng Date
const parseDate = (dateString) => {
    const [day, month, year] = dateString.split('/');
    return new Date(year, month - 1, day);
};

// Hàm lấy thời gian bắt đầu của một lớp học
const getDateTimeStart = (startDate, thu, tietHoc) => {
    const dayOfWeek = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    const date = parseDate(startDate);
    const startDayOfWeek = date.getDay();
    const targetDayIndex = thu === '8' ? 0 : parseInt(thu) - 1;
    let daysToAdd = targetDayIndex - startDayOfWeek;
    if (daysToAdd < 0) daysToAdd += 7;
    date.setDate(date.getDate() + daysToAdd);
    const startTime = periods[tietHoc.split(' --> ')[0]].start.split(':');
    date.setHours(parseInt(startTime[0]), parseInt(startTime[1]));
    return date;
};

// Hàm thêm số 0 vào trước số nếu số đó nhỏ hơn 10
function pad(number) { 
    return (number < 10 ? '0' : '') + number;
}

// hàm chuyển đổi ngày tháng sang chuỗi ngày tháng
const formatDateTime = (date) => {
    const pad = (num) => num.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:00+07:00`;
};

// Định nghĩa các đường dẫn API
const url_api = 'https://search.quanhd.net/get_tkb'; // API endpoint lấy dữ liệu thời khóa biểu và lịch thi
//const url_api = 'http://172.20.203.235:5000/get_tkb'; // API endpoint lấy dữ liệu thời khóa biểu và lịch thi
const url_checkUpdate = 'https://api.quanhd.net/tkb_app.json'; // API endpoint check update

// Hàm gọi API để lấy dữ liệu thời khóa biểu và lịch thi
export const api_ictu = async (username = '', password = '', type = 'login') => {
    try {
        const response = await axios.post(url_api, {
            username: type === "login" ? username : await AsyncStorage.getItem('username'),
            password: type === "login" ? password : await AsyncStorage.getItem('password'),
        });
        if (response.status === 200) {
            await cancelAllClassNotifications();
            const data = response.data.thoikhoabieu;
            if (!Array.isArray(data)) {
                throw new TypeError('Dữ liệu thoikhoabieu không phải là mảng');
            }
            const currentDate = new Date();
            const classesByDay = {};
            for (const weekData of data) {
                for (const item of weekData.data) {
                    const dateTimeStart = getDateTimeStart(
                        weekData.start_date,
                        item['thu'],
                        item['tiet_hoc']
                    );
                    if (dateTimeStart > currentDate) {
                        const formattedDate = formatDateTime(dateTimeStart);
                        const dateKey = formattedDate.split('T')[0];

                        if (!classesByDay[dateKey]) {
                            classesByDay[dateKey] = [];
                        }
                        classesByDay[dateKey].push(item);
                        await scheduleClassNotifications(
                            item['lop_hoc_phan'],
                            new Date(formattedDate),
                            item['dia_diem']
                        );
                    }
                }
            }
            for (const [dateKey, classes] of Object.entries(classesByDay)) {
                try {
                    const notificationDate = new Date(dateKey);
                    notificationDate.setDate(notificationDate.getDate() - 1);
                    notificationDate.setHours(20, 0, 0, 0);
                    if (notificationDate > currentDate) {
                        const message = `Ngày mai bạn có ${classes.length} lịch học cần thực hiện, hãy kiểm tra ngay lịch học của mình!`;
                        const secondsUntilNotification = Math.max(0, Math.floor((notificationDate.getTime() - new Date().getTime()) / 1000));
                        await scheduleLocalNotification(
                            'Thông báo lịch học ngày mai',
                            message,
                            secondsUntilNotification
                        );
                    }
                } catch (error) {
                    Alert.alert('Lỗi', 'Không thể lên lịch thông báo: ' + error.message);
                }
            }
            if (response.data.lichthi) {
                const examData = response.data.lichthi;
                if (!Array.isArray(examData)) {
                    throw new TypeError('Dữ liệu lichthi không phải là mảng');
                }
                for (const item of examData) {
                    const [day, month, year] = item.ngay_thi.split('/');
                    const [startTime] = item.ca_thi.match(/\(([^)]+)\)/)[1].split('-');
                    const [hours, minutes] = startTime.split(':');
                    const date = new Date(year, month - 1, day, hours, minutes);
                    const examStart = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:00+07:00`;
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
                        const secondsUntilNotification = Math.max(0, Math.floor((notificationDate.getTime() - new Date().getTime()) / 1000));
                        await scheduleLocalNotification(
                            'Thông báo lịch thi ngày mai',
                            message,
                            secondsUntilNotification
                        );
                    }
                }
            }
            await AsyncStorage.setItem('userData_ThoiKhoaBieu', JSON.stringify(response.data.thoikhoabieu));
            await AsyncStorage.setItem('userData_LichThi', JSON.stringify(response.data.lichthi));
            await AsyncStorage.setItem('userInfo', JSON.stringify(response.data.user_info));
            await AsyncStorage.setItem('userData_Diem', JSON.stringify(response.data.diem));
            await AsyncStorage.setItem('userData_DiemDetail', JSON.stringify(response.data.diem_detail));
            await AsyncStorage.setItem('lastUpdate', new Date().toLocaleString('vi-VN'));
            return response.data;
        }
    } catch (error) {
        console.log(error);
        const errorMessage = error.response?.error || 'Đã xảy ra lỗi khi kết nối đến máy chủ API: ' + error;
        throw new Error(errorMessage);
    }
};

// Hàm gọi API để kiểm tra cập nhật ứng dụng
export const api_checkUpdate = async (app_version, type='one') => {
    try {
        const date = new Date();
        const response = await axios.get(url_checkUpdate + '?date=' + date.getTime());
        if (response.status === 200) {
            const data = response.data;
            if (data.app_version != app_version) {
                return data.download_url;
            }else if (data.app_version == app_version && type != 'one') {
                return true;
            }else{
                return false;
            }
        }
        return false;
    } catch (error) {
        Alert.alert('Lỗi', 'Không thể kiểm tra cập nhật ứng dụng: ' + error.message);
        const errorMessage = error.response?.error || 'Đã xảy ra lỗi khi kết nối đến máy chủ API';
        throw new Error(errorMessage);
    }
};