# 🛡️ NIEL CHAT — ỨNG DỤNG NHẮN TIN BẢO MẬT
> Ứng dụng chat Real-time đề cao Quyền riêng tư, tích hợp Mã hóa Đầu cuối (E2EE), Bảo mật đám mây và Chính sách 1 Tài khoản — 1 Thiết bị.

---

## 📋 MÔ TẢ DỰ ÁN
Ứng dụng nhắn tin trò chuyện thời gian thực mang phong cách Mobile-first, hỗ trợ đa ngôn ngữ (Tiếng Việt & Tiếng Anh). Hệ thống áp dụng các biện pháp An ninh mạng nghiêm ngặt bao gồm Mã hóa **ECDH / AES-256**, HttpOnly Cookie kết hợp Bearer Token, Rate Limiting, và Content Security Policy (CSP).

Toàn bộ kiến trúc hướng tới lý thuyết **Zero-Knowledge** — không bên thứ 3 nào (kể cả quản trị viên hệ thống) có quyền đọc nội dung văn bản gốc khi E2EE được kích hoạt.

---

## 🏗️ KIẾN TRÚC HỆ THỐNG

| Thành phần | Công nghệ | Hosting |
|---|---|---|
| **Frontend** | Next.js 14, React Context, TypeScript, Tailwind CSS | Vercel |
| **Backend** | Node.js, Express.js | Railway |
| **Real-time** | Socket.io (WebSocket WSS) | Railway |
| **Database** | MongoDB Atlas (NoSQL) | MongoDB Cloud |
| **Cloud Storage** | Backblaze B2 (Giao thức S3 AWS) | Backblaze |
| **Email Service** | Brevo API (SMTP Transactional) | Brevo |
| **i18n** | next-intl (Việt / English) | — |

---

## 📁 CẤU TRÚC THƯ MỤC

### Frontend (Next.js App Router)
```text
├── app/
│   └── [locale]/             # i18n routing (vi, en)
│       ├── layout.tsx        # Root layout + metadata SEO
│       └── page.tsx          # Trang chính
├── components/
│   ├── AuthContext.tsx        # Quản lý xác thực (HttpOnly Cookie + Bearer Token Hybrid)
│   ├── SocketContext.tsx      # WebSocket Auth + Auto join user room
│   ├── ChatApp.tsx            # Giao diện trang chủ + Real-time session kick listener
│   ├── ChatWindow.tsx         # Lõi nhắn tin (E2EE encrypt/decrypt logic)
│   ├── ChatList.tsx           # Danh sách cuộc trò chuyện (swipe actions)
│   ├── SettingsModal.tsx      # Cài đặt (Profile, Bảo mật, E2EE, Quản lý phiên, Ngôn ngữ)
│   ├── CreateGroupModal.tsx   # Tạo nhóm chat
│   ├── GroupManagementModal.tsx # Quản lý nhóm
│   ├── UserSearch.tsx         # Tìm kiếm người dùng
│   ├── AuthPage.tsx           # Đăng ký / Đăng nhập / OTP
│   └── LanguageSwitcher.tsx   # Chuyển đổi ngôn ngữ
├── lib/
│   ├── encryption.ts          # Thuật toán E2EE (ECDH Key Exchange, AES-GCM)
│   └── fileUtils.ts           # Chuẩn hóa URL file qua Backend Proxy
├── messages/
│   ├── vi.json                # Bản dịch Tiếng Việt
│   └── en.json                # Bản dịch Tiếng Anh
└── next.config.js             # CSP Headers + Security Config
```

### Backend (Node.js Express)
```text
├── server.js                  # Express + Socket.io Server chính
├── middleware/
│   └── auth.js                # JWT Auth + Session ID validation (1-Device Policy)
├── models/
│   ├── User.js                # Schema (publicKey, currentSessionToken, loginHistory, trustedDevices)
│   ├── Message.js             # Schema (isServerEncrypted, isE2EE, attachments)
│   ├── Conversation.js        # Schema (private chat)
│   └── Group.js               # Schema (group chat, admins, members)
├── routes/
│   ├── auth.js                # Đăng ký, đăng nhập, OTP, active-session, revoke-session
│   ├── messages.js            # CRUD tin nhắn, E2EE, server-side encryption
│   ├── conversations.js       # Quản lý cuộc trò chuyện 1-1
│   ├── groups.js              # CRUD nhóm chat
│   ├── users.js               # Profile, encryption keys, block/unblock
│   └── files.js               # Upload/download file qua Backblaze B2
└── config/
    └── b2.js                  # Kết nối AWS S3 → Backblaze B2
```

---

## 🔐 TÍNH NĂNG BẢO MẬT CHUYÊN SÂU

### 1. 🛡️ Mã hóa Đầu cuối E2EE (End-to-End Encryption)
- Mỗi tài khoản sở hữu 1 cặp **Public/Private Key** (ECDH P-256) được sinh ngay trên thiết bị.
- **Private Key** được mã hóa thêm bằng mật khẩu đăng nhập (AES-GCM) trước khi lưu lên server.
- Tin nhắn được khóa bằng **Public Key** người nhận — chỉ thiết bị cầm Private Key đúng mới giải mã được.
- Hỗ trợ **Sao lưu / Khôi phục** khóa bảo mật dưới dạng file `.zip` có mật khẩu bảo vệ.

### 2. 🛡️ Hybrid Server-Side Encryption
- Khi tắt E2EE, tin nhắn vẫn được Server tự động mã hóa bằng **AES-256 nội bộ** trước khi lưu vào MongoDB.
- Ngay cả khi Database bị rò rỉ, dữ liệu vẫn là chuỗi mã hóa vô nghĩa.

### 3. 🖼️ Media Blob Encryption
- Hình ảnh, file audio, tài liệu được chẻ thành **Blob Bytes** → mã hóa thành file `.enc` → đẩy lên Backblaze B2.
- URL ảnh trực tiếp không thể mở xem được, chỉ Frontend Niel Chat mới lắp ráp và giải mã hiển thị.

### 4. 📱 Chính sách 1 Tài khoản — 1 Thiết bị (Single-Device Session)
- Mỗi lần đăng nhập, hệ thống cấp **Session ID** duy nhất nhúng vào JWT.
- Toàn bộ API Request và Socket.io Connection đều kiểm tra `sessionId` khớp với `currentSessionToken` trong Database.
- **Đăng nhập thiết bị mới → Thiết bị cũ bị văng ngay lập tức** qua sự kiện Socket.io real-time kèm thông báo popup.
- UI **Quản lý phiên đăng nhập** trong Cài đặt → Bảo mật cho phép xem thông tin thiết bị hiện tại và đăng xuất từ xa.

### 5. 🔒 Xác thực Hybrid (HttpOnly Cookie + Bearer Token)
- **Desktop:** JWT được lưu trong HttpOnly Cookie — JavaScript không thể đọc (`document.cookie` trả về rỗng).
- **Mobile:** Do hạn chế cross-site cookie trên WebKit/Safari, JWT được lưu trong `localStorage` và gửi qua header `Authorization: Bearer <token>`.
- Backend tự động chấp nhận cả hai phương thức xác thực.

### 6. 🪟 Bảo vệ nhiều tầng
- **Content-Security-Policy (CSP):** Chặn XSS, iframe injection, unauthorized script execution.
- **Rate Limiting:** Giới hạn số lần thử OTP/đăng nhập sai trên mỗi IP (express-rate-limit).
- **Bcrypt Hash:** Toàn bộ OTP và mật khẩu đều được băm trước khi lưu vào Database.
- **Helmet:** HTTP Security Headers tự động.
- **CORS:** Whitelist domain nghiêm ngặt.

---

## ✨ TÍNH NĂNG CHÍNH

| Tính năng | Mô tả |
|---|---|
| 💬 **Chat 1-1** | Nhắn tin riêng tư real-time với E2EE tùy chọn |
| 👥 **Group Chat** | Tạo nhóm, thêm/xóa thành viên, phân quyền Admin |
| 🔒 **E2EE Toggle** | Bật/tắt mã hóa đầu cuối cho từng cuộc trò chuyện |
| 📸 **Gửi ảnh & File** | Upload ảnh, audio, tài liệu (mã hóa Blob trên Cloud) |
| 📷 **Camera trực tiếp** | Chụp ảnh từ Camera thiết bị và gửi ngay |
| 🎙️ **Ghi âm** | Ghi âm giọng nói và gửi trong chat |
| 🔍 **Tìm kiếm** | Tìm người dùng theo tên/SĐT, tìm tin nhắn trong cuộc trò chuyện |
| 🚫 **Chặn người dùng** | Block/Unblock với danh sách quản lý trong Cài đặt |
| 🗃️ **Lưu trữ** | Archive/Unarchive cuộc trò chuyện (swipe gesture trên mobile) |
| 🌙 **Dark Mode** | Giao diện tối/sáng |
| 🌐 **Đa ngôn ngữ** | Hỗ trợ Tiếng Việt và Tiếng Anh (next-intl) |
| 📱 **1 Thiết bị** | Chính sách 1 tài khoản — 1 thiết bị đăng nhập duy nhất |
| ⚡ **Real-time Kick** | Thông báo popup tức thì khi bị đăng nhập từ thiết bị khác |
| 🔑 **Quản lý khóa** | Tạo, sao lưu, khôi phục, nhập, xóa khóa mã hóa |
| 📧 **Email Alert** | Cảnh báo đăng nhập từ thiết bị/IP lạ qua email (Brevo) |

---

## 🚀 HƯỚNG DẪN TRIỂN KHAI (LOCAL SETUP)

### Yêu cầu
- `node >= 18.0.0`
- MongoDB Database URI
- Backblaze B2 Application Key
- Brevo API Key (gửi email OTP)

### 1. Clone & Cài đặt
```bash
git clone https://github.com/nielday/ungdungnhantinbaomatniel.git
cd ungdungnhantinbaomatniel
npm install
```

### 2. Cấu hình Biến môi trường
Tạo file `.env` ở thư mục gốc:
```ini
# --- BACKEND ---
MONGODB_URI=mongodb+srv://<user>:<password>@cluster/....
PORT=3001
JWT_SECRET=your_jwt_secret_key
SERVER_ENCRYPTION_KEY=your_aes256_server_encryption_key
MAX_FILE_SIZE=10485760

# --- BACKBLAZE B2 CLOUD STORAGE ---
B2_KEY_ID=005...
B2_APPLICATION_KEY=K005...
B2_BUCKET_NAME=your_bucket_name
B2_REGION=us-east-005
B2_ENDPOINT=https://s3.us-east-005.backblazeb2.com

# --- BREVO EMAIL API ---
BREVO_API_KEY=xkeysib-...
BREVO_FROM_EMAIL=your_sender@domain.com

# --- FRONTEND NEXT.JS ---
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
```

### 3. Chạy ứng dụng
```bash
# Terminal 1: Backend Server (Port 3001)
npm run start

# Terminal 2: Frontend Next.js (Port 3000)
npm run dev
```
Mở trình duyệt: `http://localhost:3000`

---

## 📈 LỘ TRÌNH (ROADMAP)
- [x] Chat 1-1 E2EE & Hybrid Server-Side Encryption
- [x] Triển khai mã hóa file ảnh/media (Blob Encryption)
- [x] Socket.io Real-time Messaging
- [x] CSP + CORS Header Defense
- [x] HttpOnly Cookie + Bearer Token Hybrid Authentication
- [x] Chuẩn hóa URL file qua Backend Proxy
- [x] Group Chat (Tạo nhóm, quản lý thành viên, phân quyền Admin)
- [x] Đa ngôn ngữ i18n (Tiếng Việt / Tiếng Anh)
- [x] Chính sách 1 Tài khoản — 1 Thiết bị (Single-Device Session)
- [x] Real-time Session Kick với thông báo popup Socket.io
- [x] Quản lý phiên đăng nhập trong UI Cài đặt
- [x] Block/Unblock người dùng
- [x] Sao lưu / Khôi phục khóa mã hóa E2EE
- [ ] Signal Protocol Double Ratchet (Perfect Forward Secrecy)
- [x] E2EE Group Chat (Mã hóa đầu cuối trong nhóm)
- [ ] Audio Call / Video Call (WebRTC P2P)

---

## 🛠️ TECH STACK

**Frontend:** Next.js 14 · React 18 · TypeScript · Tailwind CSS · Framer Motion · Socket.io Client · next-intl · Lucide React · React Hot Toast · Emoji Picker

**Backend:** Node.js · Express.js · Socket.io · Mongoose · JWT · Bcrypt · Helmet · CORS · Multer · UA-Parser-JS · Express Rate Limit

**Services:** MongoDB Atlas · Backblaze B2 (S3) · Brevo SMTP · Vercel · Railway

---

**Nhà phát triển:** Đào Đức Phong (2025 — 2026)  
**Phiên bản:** 3.0.0 (Single-Device Session + Real-time Kick + i18n)  
**License:** MIT License
