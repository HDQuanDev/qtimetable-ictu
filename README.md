# QTimeTable ICTU 📅

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/HDQuanDev/qtimetable-ictu)
[![React Native](https://img.shields.io/badge/React%20Native-0.74.5-61DAFB.svg)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-51.0.39-000020.svg)](https://expo.dev/)
[![License](https://img.shields.io/badge/license-Open%20Source-green.svg)](https://github.com/HDQuanDev/qtimetable-ictu)

## 📖 Giới thiệu

QTimeTable là dự án mã nguồn mở được phát triển bởi sinh viên ICTU, với mục tiêu hỗ trợ cộng đồng sinh viên quản lý thời gian học tập hiệu quả khi mà nhà trường chưa có ứng dụng chính thức cho việc này.

🌐 **Website:** [https://tkb.quanhd.net/](https://tkb.quanhd.net/)

## ✨ Tính năng chính

- 📅 **Xem thời khóa biểu**: Hiển thị lịch học theo tuần/tháng
- 🔔 **Thông báo lịch học**: Nhắc nhở lịch học theo thời gian thực
- 📱 **Giao diện thân thiện**: Thiết kế Material Design 3
- 🌙 **Lịch âm**: Hỗ trợ hiển thị ngày âm lịch
- 📲 **QR Code**: Tạo và quét mã QR
- 🔄 **Đồng bộ dữ liệu**: Lưu trữ và đồng bộ thông tin
- 📤 **Chia sẻ lịch học**: Xuất và chia sẻ thời khóa biểu

## 🛠️ Công nghệ sử dụng

- **Framework:** React Native với Expo
- **UI Library:** React Native Paper, NativeWind (Tailwind CSS)
- **Navigation:** React Navigation 6
- **State Management:** AsyncStorage
- **Backend:** Firebase
- **Icons:** Expo Vector Icons
- **Calendar:** React Native Calendars

## 📋 Yêu cầu hệ thống

- Node.js >= 16.x
- npm hoặc yarn
- Expo CLI
- Android Studio (cho Android)
- Xcode (cho iOS)

## 🚀 Cài đặt và chạy dự án

### 1. Clone repository

```bash
git clone https://github.com/HDQuanDev/qtimetable-ictu.git
cd qtimetable-ictu
```

### 2. Cài đặt dependencies

```bash
npm install
# hoặc
yarn install
```

### 3. Chạy ứng dụng

#### Chạy trên Expo Go
```bash
npm start
# hoặc
yarn start
```

#### Chạy trên Android
```bash
npm run android
# hoặc
yarn android
```

#### Chạy trên iOS
```bash
npm run ios
# hoặc
yarn ios
```

#### Chạy trên Web
```bash
npm run web
# hoặc
yarn web
```

## 📁 Cấu trúc dự án

```
qtimetable-ictu/
├── src/
│   ├── components/     # Các component tái sử dụng
│   ├── screens/        # Các màn hình chính
│   ├── navigation/     # Cấu hình navigation
│   ├── services/       # API và Firebase services
│   ├── utils/          # Các utility functions
│   └── constants/      # Constants và configs
├── assets/             # Hình ảnh, fonts, icons
├── expo/              # Expo configuration
├── package.json
└── README.md
```

## 🎯 Hướng dẫn sử dụng

1. **Đăng nhập/Đăng ký:** Tạo tài khoản hoặc đăng nhập bằng tài khoản có sẵn
2. **Thêm lịch học:** Nhập thông tin môn học, thời gian, địa điểm
3. **Xem thời khóa biểu:** Kiểm tra lịch học theo ngày/tuần/tháng
4. **Thiết lập thông báo:** Bật thông báo để nhận nhắc nhở
5. **Chia sẻ lịch:** Xuất hoặc chia sẻ thời khóa biểu với bạn bè

## 🤝 Đóng góp

Chúng tôi hoan nghênh mọi đóng góp từ cộng đồng! 

### Cách đóng góp:
1. Fork repository này
2. Tạo branch mới cho feature/bugfix
3. Commit những thay đổi của bạn
4. Push lên branch
5. Tạo Pull Request

### Quy tắc đóng góp:
- Code phải tuân thủ coding convention
- Viết comment và documentation rõ ràng
- Test kỹ trước khi submit PR
- Mô tả chi tiết trong commit message

## 🐛 Báo lỗi

Nếu bạn gặp lỗi hoặc có đề xuất, vui lòng tạo [Issue](https://github.com/HDQuanDev/qtimetable-ictu/issues) với thông tin chi tiết:

- Mô tả lỗi
- Các bước tái hiện
- Screenshots (nếu có)
- Thông tin thiết bị và phiên bản app

## 📝 Changelog

### Version 1.0.0
- ✅ Phiên bản đầu tiên
- ✅ Tính năng xem thời khóa biểu cơ bản
- ✅ Thông báo lịch học
- ✅ Giao diện Material Design
- ✅ Hỗ trợ lịch âm

## 👥 Đội ngũ phát triển

- **Hứa Đức Quân** - [@HDQuanDev](https://github.com/HDQuanDev) - Lead Developer

## 📞 Liên hệ

- 📧 Email: [contact@quanhd.net](mailto:hdquandev@quanhd.net)
- 🌐 Website: [https://tkb.quanhd.net/](https://tkb.quanhd.net/)
- 💬 GitHub Issues: [Tạo issue mới](https://github.com/HDQuanDev/qtimetable-ictu/issues)

## ⭐ Ủng hộ dự án

Nếu bạn thấy dự án hữu ích, hãy cho chúng tôi một ⭐ star trên GitHub!

## 📄 License

Dự án này được phát hành dưới giấy phép mã nguồn mở. Xem file LICENSE để biết thêm chi tiết.

---

<div align="center">
  <p>Made with ❤️ by ICTU Students</p>
  <p>© 2024 QTimeTable ICTU. All rights reserved.</p>
</div>
