# 🔧 CẤU HÌNH OTP CHO DỰ ÁN NHẮN TIN NIEL

## 📋 Environment Variables cần thiết

Tạo file `.env` trong thư mục gốc của dự án với nội dung sau:

```env
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-here

# Email Configuration (Gmail)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Server
PORT=3001
NODE_ENV=development
```

## 📧 Cấu hình Gmail SMTP

### Bước 1: Bật 2-Factor Authentication
1. Vào Google Account Settings
2. Security → 2-Step Verification
3. Bật 2-Step Verification

### Bước 2: Tạo App Password
1. Vào Google Account Settings
2. Security → 2-Step Verification → App passwords
3. Chọn "Mail" và "Other (Custom name)"
4. Nhập tên: "Messaging App Niel"
5. Copy password được tạo (16 ký tự)

### Bước 3: Cập nhật .env
```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-16-character-app-password
```

## 🚀 Cách chạy dự án

### Backend (Railway/Server)
```bash
# Cài đặt dependencies
npm install

# Chạy server
npm run server
```

### Frontend (Vercel/Local)
```bash
# Cài đặt dependencies
npm install

# Chạy development
npm run dev
```

## 🔍 Kiểm tra OTP hoạt động

1. **Đăng ký tài khoản mới**
   - Nhập thông tin đăng ký
   - Kiểm tra email nhận OTP
   - Nhập OTP để xác thực

2. **Đăng nhập**
   - Nhập số điện thoại
   - Kiểm tra email nhận OTP
   - Nhập OTP để đăng nhập

## 🛠️ Troubleshooting

### Lỗi gửi email
- Kiểm tra EMAIL_USER và EMAIL_PASS
- Đảm bảo App Password đúng
- Kiểm tra 2FA đã bật

### Lỗi OTP không hợp lệ
- Kiểm tra thời gian hết hạn (5 phút)
- Đảm bảo nhập đúng 6 số
- Thử gửi lại OTP

### Lỗi kết nối database
- Kiểm tra MONGODB_URI
- Đảm bảo network có thể truy cập MongoDB Atlas
