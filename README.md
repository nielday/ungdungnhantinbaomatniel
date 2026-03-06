# 🛡️ ỨNG DỤNG NHẮN TIN BẢO MẬT NIEL - MESSAGING APP
> Ứng dụng chat Real-time đề cao Quyền riêng tư tích hợp thuật toán Mã hóa Đầu cuối (E2EE) và Bảo mật đám mây (Cloud Security).

---

## 📋 MÔ TẢ DỰ ÁN
Ứng dụng nhắn tin trò chuyện hai chiều thời gian thực mang kiểu dáng Mobile-first. Đây là dự án được áp dụng chặt chẽ các biện pháp An ninh mạng như Mã hóa thuật toán phần cứng **AES, RSA**, phân rã File nhị phân (Blob Blob) và các Tiêu chuẩn **Content Security Policy (CSP)**.
Toàn bộ mã nguồn hướng tới lý thuyết **Zero-Knowledge**, không một bên thứ 3 (kể cả quản trị viên hệ thống Server Database) nào có quyền xâm phạm và đọc nội dung văn bản gốc hoặc xem hình ảnh cá nhân của người dùng Niel.

---

## 🏗️ KIẾN TRÚC HỆ THỐNG
Dự án được phân tách thành 2 máy chủ độc lập Frontend và Backend:
- **Frontend:** Next.js 14, React context, TypeScript (Host trên Vercel).
- **Backend:** Node.js, Express.js (Host trên Railway).
- **Real-time Engine:** Socket.io (Thiếp lập Websocket WSS bảo mật).
- **Database:** MongoDB Atlas (Lưu trữ Non-Relational NoSQL).
- **Cloud Storage:** Backblaze B2 Vân toán (Dành riêng cho tệp đa phương tiện đã mã hóa cứng).

---

## 📁 CẤU TRÚC THƯ MỤC CHÍNH

### Nền tảng Client (Frontend Next.js)
```text
├── app/                    # Next.js App Router (Layout, Page, i18n locales)
├── components/             # Các Component lõi giao diện chức năng Chat
│   ├── AuthContext.tsx     # Quản lý phiên đăng nhập bằng HttpOnly Cookie (không dùng localStorage)
│   ├── SocketContext.tsx   # Bảo bọc phiên Websocket Auth WSS (withCredentials)
│   ├── ChatApp.tsx         # Giao diện Trang chủ App
│   ├── ChatWindow.tsx      # Lõi nhắn tin (Nơi chứa logic thuật toán giải mã file/text E2EE)
│   ├── AuthPage.tsx        # Trang đăng ký / đăng nhập
│   └── ...
├── lib/
│   ├── encryption.ts       # (CORE) Vi điều khiển các thuật toán Băm và Sinh Khóa Mật Mã E2EE
│   └── fileUtils.ts        # Helper chuẩn hóa URL file/ảnh qua Backend Proxy (Backblaze B2)
├── next.config.js          # Chứa cấu hình bảo mật Content Security Policy (CSP) siêu cấp
└── vercel.json             # Deploy cấu hình Vercel
```

### Nền tảng Server (Backend Node.js - Tích hợp chung thư mục dự án)
```text
├── server.js             # Express Server chính yếu, khởi động Socket.io
├── middleware/ 
│   ├── auth.js           # Bộ lọc xác thực JWT (đọc từ HttpOnly Cookie hoặc Header)
│   └── rateLimiter.js    # Cảnh sát chống chặn XSS, Spam OTP Brute-force
├── models/               # Bộ điều khiển Mongoose NoSQL 
│   ├── User.js           # Chứa lược đồ Khóa Công khai (Public Key)
│   └── Message.js        # Chứa cờ isServerEncrypted
├── routes/               # Hệ thống API RESTful (Conversations, Messages, Groups, Auth)
└── config/
    └── b2.js             # Móc nối AWS S3 đến Backblaze B2 API
```

---

## 🔐 ĐIỂM SÁNG BẢO MẬT & TÍNH NĂNG CHUYÊN SÂU

### 1. 🛡️ Cơ Chế E2EE Kép (Mã hóa Đầu - Cuối Bất đối xứng / Symmetric)
- **Tạo Khóa (Key Generation):** Mỗi số điện thoại đăng ký được gắn 1 cặp `Public Key/Private Key` ngay trên thiết bị. `Private Key` được khóa ngầm thêm 1 vòng bằng Master Password của người dùng.
- **Che giấu Tin nhắn (E2EE Chat):** Máy A gửi tin nhắn cho Máy B. Máy A sẽ load `Public Key` của Máy B về, tự **Khóa Giao Diện** dòng chat đó lại thành chuỗi Hex vô hồn. Chỉ có chiếc điện thoại Cầm `Private Key` mồi giải của Máy B mới đọc được dòng chat A truyền sang.

### 2. 🛡️ Hybrid Server-Side Encryption (Mã hóa đa cấp độ Server)
- **Đa dụng UX:** Cho phép người dùng linh động Ấn Nút "Tắt E2EE" giúp Load tin nhắn siêu nhanh mượt như Messenger.
- **Bảo mật Bọc Hậu:** Dù Tắt E2EE (Tin nhắn đi vào máy chủ dưới dạng Chữ thường), API Backend vẫn lập tức đem băm chuỗi văn bản đấy bằng `Secret Key Nội bộ (AES-256)` rồi mới lưu vào Database MongoDB.
- Mất Database, hacker hoàn toàn bất lực vì Server tự dịch giải ngay lúc API GET gọi xuống Frontend.

### 3. 🖼️ Phân rã Phương Tiện Mã Hóa (Media Blob Encryption)
- Thay vì đẩy thẳng 1 Tấm Hình PNG / Đoạn ghi âm M4A lên Cloud Storage như Zalo/FB.
- Hình ảnh/File Audio sẽ bị trình duyệt chẻ vụn thành các **Blob Byte**. Tiến hành mã hóa thành 1 tệp **`.enc` rác** rồi mới đẩy lên mạng Backblaze. URL ảnh mang về cũng không một ai mở lên xem được (Kể cả cầm URL đó do rò rỉ mạng). Nó chỉ hiện hình khi Frontend của Niel kéo về và dùng Private Key cá nhân để Lắp ráp / Nhúng tĩnh trở lại bộ mã Canvas HTML.

### 4. 🪟 Khiên Content-Security-Policy (Kháng độc XSS) & Hash Bcrypt
- Lệnh cấm tự động loại bỏ mọi `iframe` nhúng lạ, cấm Load mọi file ảnh hoặc đoạn Script ngoài vòng Proxy cho phép. 
- API chặn Rate Limit, chỉ cho 1 IP đánh nhầm mật khẩu X lần / 1 tiếng. 
- Bcrypt Hash toàn bộ OTP lẫn Master Password nội bộ DB.

### 5. 🍪 Phiên Xác thực HttpOnly Cookie (Chống đánh cắp Token XSS)
- **Loại bỏ hoàn toàn `localStorage`** để lưu trữ JWT Token xác thực. Token giờ được server gắn vào **HttpOnly Cookie** — JavaScript phía client không thể đọc được (`document.cookie` trả về rỗng cho token).
- Cookie được cấu hình `Secure`, `SameSite=None` cho phép hoạt động an toàn trên kiến trúc Cross-Origin (Vercel ↔ Railway).
- Backend tự động đọc token từ cookie thông qua `cookie-parser`, frontend chỉ cần gắn `credentials: 'include'` vào mọi request.
- Khi người dùng mở ứng dụng, hệ thống tự động dọn sạch mọi token rác cũ còn sót lại trong `localStorage` từ phiên bản trước.

---

## 🚀 HƯỚNG DẪN TRIỂN KHAI NỘI BỘ (LOCAL SETUP)

### Yêu cầu cài đặt
- `node >= 18.0.0`
- MongoDB Database URI
- Backblaze B2 Application Key (Giao thức S3 AWS)

### 1. Cài đặt các Gói Thư Viện
```bash
git clone https://github.com/nielday/ungdungnhantinbaomatniel.git
cd ungdungnhantinbaomatniel

# Cài đặt toàn bộ Packges của Frontend + Backend 
npm install
```

### 2. Cài đặt Biến môi trường
Tạo file `.env` ở thư mục gốc:
```ini
# --- CHI CỤC BACKEND ---
MONGODB_URI=mongodb+srv://<user>:<password>@cluster/....
PORT=3001
JWT_SECRET=ma_bi_mat_1_cua_ban
SERVER_ENCRYPTION_KEY=ma_bam_hybrid_AES_mat_khau_chu_cua_server_2
MAX_FILE_SIZE=10485760

# --- TÍCH HỢP ĐÁM MÂY BACKBLAZE B2 ---
B2_KEY_ID=005...
B2_APPLICATION_KEY=K005...
B2_BUCKET_NAME=your_storage_bucket
B2_REGION=us-east-005
B2_ENDPOINT=https://s3.us-east-005.backblazeb2.com

# --- XÁC THỰC EMAIL SMTP BREVO ---
RESEND_API_KEY=xkeysib-...
RESEND_FROM_EMAIL=your_verify_email@domain.com

# --- CHI CỤC FRONTEND NEXT.JS ---
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

### 3. Vận Hành Tích Hợp
Bạn cần bật cả 2 đầu Server API và Client App chạy song song:
```bash
# Terminal 1: Bật Backend Server API (Node.js) trên cổng 3001
npm run start

# Terminal 2: Bật Frontend Interface (Next.js) trên cổng 3000
npm run dev
```
Mở trình duyệt: `http://localhost:3000`

---

## 📈 LỘ TRÌNH TƯƠNG LAI (ROADMAP)
- [x] Chat 1-1 E2EE & Hybrid Server-Side Encryption
- [x] Triển khai bảo mật file ảnh (Media File Content)
- [x] Socket Messaging Real-time
- [x] Cấu hình CSP + CORS Header Defense
- [x] Áp dụng `HttpOnly Cookie` quản lý thay thế Token Storage Session nhạy cảm.
- [x] Chuẩn hóa URL file/ảnh qua Backend Proxy (chống lộ URL Backblaze B2 trực tiếp).
- [ ] Tích hợp bảo mật Signal Protocol Double Ratchet (Perfect Forward Secrecy).
- [ ] E2EE Group Chat (Giải bài toán vòng chia khóa phân tán 1-Many).
- [ ] Tích hợp Audio Call / Video Call (WebRTC Peer-to-Peer Không chạm máy chủ).

---
**Nhà Lập Trình Dự Án & Kiến Trúc Sư:** Đào Đức Phong (2025 - 2026)  
**Phiên bản hiện tại:** 2.1.0 (HttpOnly Cookie & Proxy Security Hardening)  
**Khóa tài liệu Mở (License):** MIT License (Xem tệp LICENSE)
