// api.js
import axios from 'axios';
import { scheduleClassNotifications } from '../components/classNotifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

const parseDate = (dateString) => {
    const [day, month, year] = dateString.split('/');
    return new Date(year, month - 1, day);
};

const getDateTimeStart = (startDate, thu, tietHoc) => {
    const dayOfWeek = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    const dayIndex = parseInt(thu) % 7;

    const date = parseDate(startDate);
    date.setDate(date.getDate() + dayIndex - 1);

    const startTime = periods[tietHoc.split(' --> ')[0]].start.split(':');
    date.setHours(parseInt(startTime[0]), parseInt(startTime[1]));

    return date;
};

const formatDateTime = (date) => {
    const pad = (num) => num.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:00+07:00`;
};

const url_api = 'https://search.quanhd.net/get_tkb';

export const api_login = async (username, password) => {
    try {
        const response = await axios.post(url_api, {
            username: username,
            password: password,
        });

        if (response.status === 200) {
            const data = response.data;
            const currentDate = new Date(); // Lấy ngày hiện tại

            for (const weekData of data) {
                for (const item of weekData.data) {
                    const dateTimeStart = getDateTimeStart(
                        weekData.start_date,
                        item['Thứ'],
                        item['Tiết học']
                    );

                    if (dateTimeStart > currentDate) {
                        const formattedDate = formatDateTime(dateTimeStart);
                        await scheduleClassNotifications(
                            item['Lớp học phần'],
                            new Date(formattedDate),
                            item['Địa điểm']
                        );
                    }
                }
            }
            return data;
        }
    } catch (error) {
        const errorMessage = error.response?.error || 'Đã xảy ra lỗi khi kết nối đến máy chủ API';
        throw new Error(errorMessage);
    }
};

export const api_reset_data = async () => {
    try {
        const response = await axios.post(url_api, {
            username: await AsyncStorage.getItem('username'),
            password: await AsyncStorage.getItem('password'),
        });

        if (response.status === 200) {
            const data = response.data;
            const currentDate = new Date(); // Lấy ngày hiện tại

            for (const weekData of data) {
                for (const item of weekData.data) {
                    const dateTimeStart = getDateTimeStart(
                        weekData.start_date,
                        item['Thứ'],
                        item['Tiết học']
                    );

                    if (dateTimeStart > currentDate) {
                        const formattedDate = formatDateTime(dateTimeStart);
                        await scheduleClassNotifications(
                            item['Lớp học phần'],
                            new Date(formattedDate),
                            item['Địa điểm']
                        );
                    }
                }
            }
            return data;
        }

    }catch (error) {
        const errorMessage = error.response?.error || 'Đã xảy ra lỗi khi kết nối đến máy chủ API';
        throw new Error(errorMessage);
    }
}

