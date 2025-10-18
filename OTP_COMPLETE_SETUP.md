# 🔐 HƯỚNG DẪN CẤU HÌNH OTP HOÀN CHỈNH

## ✅ Đã hoàn thành

### 1. Backend Configuration
- ✅ Kích hoạt OTP trong `routes/auth.js`
- ✅ Cập nhật register flow để yêu cầu OTP
- ✅ Cập nhật login flow để yêu cầu OTP
- ✅ Cấu hình Nodemailer với Gmail SMTP
- ✅ Tạo các API endpoints: `/verify-otp`, `/resend-otp`, `/verify-login`

### 2. Frontend Configuration
- ✅ Cập nhật `AuthContext.tsx` để xử lý OTP flow
- ✅ Cập nhật `AuthPage.tsx` để hiển thị OTP form
- ✅ Sửa lỗi TypeScript interfaces
- ✅ Tích hợp OTP verification vào UI

### 3. Files đã tạo
- ✅ `env-setup.md` - Hướng dẫn cấu hình environment
- ✅ `test-otp.js` - Script test OTP functionality
- ✅ `OTP_COMPLETE_SETUP.md` - File này

## 🚀 CÁCH SỬ DỤNG

### Bước 1: Cấu hình Environment Variables

Tạo file `.env` trong thư mục gốc:

```env
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-here

# Email Configuration (Gmail)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-16-character-app-password

# Server
PORT=3001
NODE_ENV=development
```

### Bước 2: Cấu hình Gmail

1. **Bật 2-Factor Authentication**
   - Vào Google Account Settings
   - Security → 2-Step Verification
   - Bật 2-Step Verification

2. **Tạo App Password**
   - Vào Google Account Settings
   - Security → 2-Step Verification → App passwords
   - Chọn "Mail" và "Other (Custom name)"
   - Nhập tên: "Messaging App Niel"
   - Copy password được tạo (16 ký tự)

3. **Cập nhật .env**
   ```env
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-16-character-app-password
   ```

### Bước 3: Test OTP Configuration

```bash
# Chạy test script
node test-otp.js
```

### Bước 4: Chạy dự án

```bash
# Backend
npm run server

# Frontend (terminal khác)
npm run dev
```

## 🔄 OTP Flow

### Đăng ký mới:
1. User nhập thông tin → Submit
2. Backend tạo user với `isVerified: false`
3. Backend gửi OTP qua email
4. Frontend chuyển đến màn hình OTP
5. User nhập OTP → Verify
6. Backend xác thực OTP → Set `isVerified: true`
7. User được đăng nhập tự động

### Đăng nhập:
1. User nhập số điện thoại → Submit
2. Backend gửi OTP qua email
3. Frontend chuyển đến màn hình OTP
4. User nhập OTP → Verify
5. User được đăng nhập

## 🛠️ API Endpoints

### Authentication
- `POST /api/auth/register` - Đăng ký (yêu cầu OTP)
- `POST /api/auth/login` - Đăng nhập (yêu cầu OTP)
- `POST /api/auth/verify-otp` - Xác thực OTP đăng ký
- `POST /api/auth/verify-login` - Xác thực OTP đăng nhập
- `POST /api/auth/resend-otp` - Gửi lại OTP

## 🔍 Troubleshooting

### Lỗi gửi email
- ✅ Kiểm tra EMAIL_USER và EMAIL_PASS
- ✅ Đảm bảo App Password đúng (16 ký tự)
- ✅ Kiểm tra 2FA đã bật
- ✅ Thử chạy `node test-otp.js`

### Lỗi OTP không hợp lệ
- ✅ Kiểm tra thời gian hết hạn (5 phút)
- ✅ Đảm bảo nhập đúng 6 số
- ✅ Thử gửi lại OTP

### Lỗi kết nối database
- ✅ Kiểm tra MONGODB_URI
- ✅ Đảm bảo network có thể truy cập MongoDB Atlas

## 📱 UI/UX Features

- ✅ Responsive design cho mobile
- ✅ Loading states khi gửi OTP
- ✅ Error handling và validation
- ✅ Resend OTP functionality
- ✅ Auto-redirect sau khi verify thành công

## 🎯 Next Steps

1. **Test thoroughly** - Thử đăng ký và đăng nhập
2. **Monitor logs** - Kiểm tra console logs
3. **Check emails** - Đảm bảo nhận được OTP emails
4. **Deploy** - Deploy lên production với environment variables

## 📞 Support

Nếu gặp vấn đề:
1. Kiểm tra console logs
2. Chạy `node test-otp.js`
3. Kiểm tra environment variables
4. Test với email khác

---

**🎉 OTP Configuration hoàn tất! Dự án đã sẵn sàng với tính năng xác thực OTP qua email.**
