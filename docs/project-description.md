# 📱 Ứng Dụng Nhắn Tin Niel - Mô Tả Dự Án

## Thông Tin Chung

| Thuộc tính | Giá trị |
|------------|---------|
| **Tên dự án** | Niel Messaging App |
| **Phiên bản** | 1.1.0 |
| **Tác giả** | Đào Đức Phong |
| **Email liên hệ** | phonghd.2005.io@gmail.com |
| **License** | MIT |

### URLs Production
| Service | URL |
|---------|-----|
| Frontend (Vercel) | https://ung-dung-nhan-tin-niel.vercel.app |
| Backend (Railway) | https://ungdungnhantinbaomatniel-production.up.railway.app |
| Repository | https://github.com/nielday/ungdungnhantinbaomatniel |

---

## 1. Tổng Quan

**Niel Messaging App** là ứng dụng nhắn tin real-time được xây dựng với kiến trúc Full-Stack hiện đại. Ứng dụng hỗ trợ:
- Chat 1-1 và chat nhóm
- Mã hóa đầu cuối (End-to-End Encryption - E2EE)
- Gửi file/ảnh/audio
- Xác thực bằng OTP qua email
- Đa ngôn ngữ (Tiếng Việt & Tiếng Anh)

---

## 2. Công Nghệ Sử Dụng

### Frontend
| Công nghệ | Phiên bản | Mục đích |
|-----------|-----------|----------|
| Next.js | 14.2.35 | React framework với App Router |
| React | 18.x | UI library |
| TypeScript | 5.x | Type-safe JavaScript |
| Tailwind CSS | 3.3.0 | Styling framework |
| Framer Motion | 10.18.0 | Animations |
| next-intl | 3.26.5 | Internationalization (i18n) |
| Socket.io-client | 4.8.1 | Real-time communication |
| Lucide React | 0.292.0 | Icons |

### Backend
| Công nghệ | Phiên bản | Mục đích |
|-----------|-----------|----------|
| Express.js | 4.18.2 | Web framework |
| Socket.io | 4.7.5 | WebSocket server |
| MongoDB | - | NoSQL database |
| Mongoose | 8.0.3 | MongoDB ODM |
| JSON Web Token | 9.0.2 | Authentication |
| bcryptjs | 2.4.3 | Password hashing |
| Multer | 1.4.5 | File upload handling |

### Cloud Services
| Service | Provider | Mục đích |
|---------|----------|----------|
| Database | MongoDB Atlas | Cloud database |
| Frontend Hosting | Vercel | Static hosting + SSR |
| Backend Hosting | Railway | Node.js server |
| File Storage | Backblaze B2 | Permanent file storage |
| Email Service | Brevo (Sendinblue) | OTP emails |

---

## 3. Kiến Trúc Hệ Thống

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
│                    (Vercel - Next.js 14)                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │  AuthPage   │  │  ChatApp    │  │  SettingsModal          │  │
│  │  - Login    │  │  - ChatList │  │  - Profile              │  │
│  │  - Register │  │  - ChatWindow│ │  - Security (E2EE)      │  │
│  │  - OTP      │  │  - Groups   │  │  - Language             │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
│                           │                                      │
│              ┌────────────┴────────────┐                        │
│              │     Socket.io Client    │                        │
│              └────────────┬────────────┘                        │
└───────────────────────────┼─────────────────────────────────────┘
                            │ WebSocket + REST API
┌───────────────────────────┼─────────────────────────────────────┐
│                           ▼                                      │
│                      BACKEND                                     │
│                 (Railway - Express.js)                          │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    server.js                             │    │
│  │  - Express app                                           │    │
│  │  - Socket.io server                                      │    │
│  │  - JWT authentication middleware                         │    │
│  └─────────────────────────────────────────────────────────┘    │
│                           │                                      │
│  ┌────────────────────────┼────────────────────────────────┐    │
│  │                     ROUTES                               │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐    │    │
│  │  │ auth.js  │ │ users.js │ │ groups.js│ │messages.js│   │    │
│  │  │ 581 LOC  │ │ 417 LOC  │ │ 489 LOC  │ │ 480 LOC  │    │    │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘    │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐                 │    │
│  │  │ files.js │ │ admin.js │ │conversations.js│           │    │
│  │  └──────────┘ └──────────┘ └──────────┘                 │    │
│  └─────────────────────────────────────────────────────────┘    │
│                           │                                      │
└───────────────────────────┼─────────────────────────────────────┘
                            │
          ┌─────────────────┼─────────────────┐
          ▼                 ▼                 ▼
    ┌──────────┐     ┌──────────┐     ┌──────────┐
    │ MongoDB  │     │ Backblaze│     │  Brevo   │
    │  Atlas   │     │    B2    │     │  Email   │
    │ Database │     │  Storage │     │ Service  │
    └──────────┘     └──────────┘     └──────────┘
```

---

## 4. Cấu Trúc Thư Mục

```
📦 ứng dụng nhắn tin niel/
├── 📂 app/                          # Next.js App Router
│   ├── 📂 [locale]/                 # Dynamic locale routing (vi/en)
│   │   ├── layout.tsx               # Root layout với providers
│   │   └── page.tsx                 # Main page component
│   ├── globals.css                  # Global styles
│   └── layout.tsx                   # Base layout
│
├── 📂 components/                   # React Components (19 files)
│   ├── AuthContext.tsx              # Authentication context provider
│   ├── AuthPage.tsx                 # Login/Register/OTP pages
│   ├── CameraCapture.tsx            # Camera capture for sending photos
│   ├── ChatApp.tsx                  # Main chat application
│   ├── ChatList.tsx                 # List of conversations
│   ├── ChatWindow.tsx               # Chat messages view (1257 LOC)
│   ├── CreateGroupModal.tsx         # Create new group modal
│   ├── EmojiPicker.tsx              # Emoji selector
│   ├── GroupManagementModal.tsx     # Group settings modal
│   ├── Header.tsx                   # App header
│   ├── LanguageSwitcher.tsx         # Language toggle (vi/en)
│   ├── LoadingProgress.tsx          # Loading animations
│   ├── LoginForm.tsx                # Login form component
│   ├── PrivacyPolicyModal.tsx       # Privacy policy display
│   ├── RegisterForm.tsx             # Registration form
│   ├── SettingsModal.tsx            # Settings panel (1600 LOC)
│   ├── SimpleEmojiPicker.tsx        # Simplified emoji picker
│   ├── SocketContext.tsx            # Socket.io context provider
│   └── UserSearch.tsx               # Search users modal
│
├── 📂 routes/                       # Backend API Routes (7 files)
│   ├── auth.js                      # Authentication (581 LOC)
│   ├── users.js                     # User management (417 LOC)
│   ├── groups.js                    # Group management (489 LOC)
│   ├── messages.js                  # Messaging (480 LOC)
│   ├── conversations.js             # Private conversations
│   ├── files.js                     # File proxy for B2
│   └── admin.js                     # Admin routes
│
├── 📂 models/                       # MongoDB Schemas (5 files)
│   ├── User.js                      # User schema
│   ├── Conversation.js              # Private chat schema
│   ├── Group.js                     # Group chat schema
│   ├── Message.js                   # Message schema
│   └── index.js                     # DB connection + exports
│
├── 📂 middleware/                   # Express Middlewares
│   └── auth.js                      # JWT authentication middleware
│
├── 📂 lib/                          # Utility Libraries
│   └── encryption.ts                # E2EE encryption functions
│
├── 📂 config/                       # Configuration
│   └── b2.js                        # Backblaze B2 configuration
│
├── 📂 messages/                     # Internationalization
│   ├── vi.json                      # Vietnamese translations
│   └── en.json                      # English translations
│
├── 📂 public/                       # Static Assets
│   └── logo.png                     # App logo
│
├── 📂 docs/                         # Documentation
│   ├── database-diagram.puml        # PlantUML database schema
│   ├── test-cases.md                # QA test cases
│   └── project-description.md       # This file
│
├── server.js                        # Express + Socket.io server
├── i18n.ts                          # i18n configuration
├── middleware.ts                    # Next.js middleware
├── package.json                     # Dependencies
├── tailwind.config.js               # Tailwind configuration
├── tsconfig.json                    # TypeScript configuration
└── README.txt                       # Quick start guide
```

---

## 5. Database Schema

### 5.1 User Collection
```javascript
{
  _id: ObjectId,
  phoneNumber: String,      // Unique, required
  email: String,            // Unique, required
  fullName: String,         // Required
  age: Number,              // 1-120
  avatar: String,           // B2 URL
  isVerified: Boolean,      // Default: false
  
  // OTP Authentication
  otpCode: String,
  otpExpires: Date,
  
  // E2EE Encryption Keys
  publicKey: String,
  encryptedPrivateKey: String,
  keySalt: String,
  keyCreatedAt: Date,
  
  // Trusted Devices
  trustedDevices: [{
    deviceId: String,
    deviceName: String,
    lastUsed: Date,
    createdAt: Date,
    isActive: Boolean
  }],
  
  createdAt: Date,
  updatedAt: Date
}
```

### 5.2 Conversation Collection (Private Chat)
```javascript
{
  _id: ObjectId,
  participants: [ObjectId],   // References to User (2 users)
  lastMessage: ObjectId,      // Reference to Message
  lastMessageAt: Date,
  isActive: Boolean,
  encryptionMode: String,     // 'none' | 'e2ee'
  createdAt: Date,
  updatedAt: Date
}
```

### 5.3 Group Collection
```javascript
{
  _id: ObjectId,
  name: String,               // Max 50 chars
  description: String,        // Max 200 chars
  avatar: String,             // B2 URL
  createdBy: ObjectId,        // Reference to User
  admins: [ObjectId],         // References to User
  members: [{
    user: ObjectId,
    joinedAt: Date,
    role: String              // 'member' | 'admin'
  }],
  lastMessage: ObjectId,
  lastMessageAt: Date,
  isActive: Boolean,
  settings: {
    allowMemberInvite: Boolean,
    allowMemberLeave: Boolean,
    maxMembers: Number        // Default: 100
  },
  createdAt: Date,
  updatedAt: Date
}
```

### 5.4 Message Collection
```javascript
{
  _id: ObjectId,
  conversationId: ObjectId,   // References Conversation or Group
  senderId: ObjectId,         // Reference to User
  content: String,
  messageType: String,        // 'text' | 'image' | 'file' | 'audio'
  attachments: [{
    fileName: String,
    fileUrl: String,          // B2 URL
    fileSize: Number,
    mimeType: String
  }],
  replyTo: ObjectId,          // Reference to Message
  isEdited: Boolean,
  editedAt: Date,
  isDeleted: Boolean,
  deletedAt: Date,
  readBy: [{
    userId: ObjectId,
    readAt: Date
  }],
  
  // E2EE Fields
  isEncrypted: Boolean,
  encryptionData: {
    iv: String,
    algorithm: String         // 'AES-256-GCM'
  },
  
  createdAt: Date,
  updatedAt: Date
}
```

---

## 6. API Endpoints

### 6.1 Authentication (`/api/auth`)
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/register` | Đăng ký tài khoản mới |
| POST | `/login` | Đăng nhập bằng số điện thoại |
| POST | `/verify-otp` | Xác thực OTP sau đăng ký |
| POST | `/verify-login` | Xác thực OTP sau đăng nhập |
| POST | `/resend-otp` | Gửi lại OTP |
| POST | `/check-device` | Kiểm tra thiết bị tin cậy |
| POST | `/verify-device` | Xác thực thiết bị mới |
| GET | `/trusted-devices` | Lấy danh sách thiết bị |
| DELETE | `/trusted-devices/:id` | Xóa thiết bị tin cậy |

### 6.2 Users (`/api/users`) - Yêu cầu Authentication
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/profile` | Lấy thông tin cá nhân |
| PUT | `/profile` | Cập nhật profile |
| POST | `/avatar` | Upload ảnh đại diện |
| GET | `/search?q=` | Tìm kiếm người dùng |
| GET | `/phone/:phoneNumber` | Tìm user theo SĐT |
| PUT | `/encryption-keys` | Lưu encryption keys |
| GET | `/encryption-keys` | Lấy encryption keys |
| DELETE | `/encryption-keys` | Xóa encryption keys |
| GET | `/:userId/public-key` | Lấy public key của user |

### 6.3 Conversations (`/api/conversations`) - Yêu cầu Authentication
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/` | Lấy danh sách conversations |
| POST | `/` | Tạo conversation mới |
| GET | `/:id` | Lấy chi tiết conversation |
| PUT | `/:id/encryption-mode` | Bật/tắt E2EE |

### 6.4 Groups (`/api/groups`) - Yêu cầu Authentication
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/` | Lấy danh sách nhóm |
| POST | `/` | Tạo nhóm mới |
| GET | `/:id` | Lấy chi tiết nhóm |
| PUT | `/:id` | Cập nhật thông tin nhóm |
| POST | `/:id/avatar` | Upload avatar nhóm |
| POST | `/:id/members` | Thêm thành viên |
| DELETE | `/:id/members/:memberId` | Xóa thành viên |
| POST | `/:id/leave` | Rời khỏi nhóm |

### 6.5 Messages (`/api/messages`) - Yêu cầu Authentication
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/:conversationId` | Lấy tin nhắn (pagination) |
| POST | `/:conversationId/text` | Gửi tin nhắn văn bản |
| POST | `/:conversationId/file` | Gửi file/ảnh/audio |
| DELETE | `/:messageId` | Xóa tin nhắn |

### 6.6 Files (`/api/files`)
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/proxy?fileUrl=` | Proxy để access B2 files |

---

## 7. Tính Năng Chi Tiết

### 7.1 Authentication
- **Đăng ký:** SĐT + Email + Họ tên + Tuổi → OTP qua email
- **Đăng nhập:** SĐT → OTP qua email
- **OTP:** 6 số, hết hạn sau 5 phút
- **JWT Token:** Hết hạn sau 7 ngày
- **Trusted Devices:** Xác thực thiết bị mới bằng OTP

### 7.2 Messaging
- **Text messages:** Hỗ trợ emoji
- **File attachments:** jpeg, jpg, png, gif, mp3, wav, mp4, pdf, doc, docx, txt (max 10MB)
- **Reply:** Trả lời tin nhắn cụ thể
- **Delete:** Xóa tin nhắn của mình (soft delete)
- **Real-time:** Socket.io với typing indicator

### 7.3 Groups
- **Tạo nhóm:** Tối đa 100 thành viên
- **Quản lý:** Chỉ creator có quyền admin
- **Avatar:** Upload ảnh nhóm
- **Leave:** Thành viên có thể rời (trừ creator)

### 7.4 End-to-End Encryption (E2EE)
- **Algorithm:** ECDH key exchange + AES-256-GCM
- **Key generation:** Client-side trong browser
- **Key storage:** Private key mã hóa bằng password, lưu trên server
- **Backup:** Export/Import keys với mật khẩu riêng
- **Trusted devices:** Xác thực OTP khi đăng nhập từ thiết bị mới

### 7.5 Internationalization
- **Ngôn ngữ:** Tiếng Việt (vi), English (en)
- **Implementation:** next-intl với dynamic routing
- **URL:** `/{locale}/...`

### 7.6 File Storage
- **Provider:** Backblaze B2 (S3-compatible)
- **Bucket:** Private (cần presigned URL)
- **Proxy:** Backend cung cấp URL tạm thời
- **Permanent:** Files không bị mất khi deploy

---

## 8. Real-time Events (Socket.io)

### Client → Server
| Event | Payload | Mô tả |
|-------|---------|-------|
| `join-user-room` | userId | Join room của user |
| `join-conversation` | conversationId | Join room chat |
| `leave-conversation` | conversationId | Leave room chat |
| `send-message` | { conversationId, message } | Gửi tin nhắn |
| `typing` | { conversationId, userId, isTyping } | Typing indicator |

### Server → Client
| Event | Payload | Mô tả |
|-------|---------|-------|
| `new-message` | Message object | Tin nhắn mới |
| `user-typing` | { userId, isTyping } | Ai đang gõ |
| `message-deleted` | { messageId, conversationId } | Tin nhắn bị xóa |
| `group-info-updated` | { conversationId, group } | Nhóm được cập nhật |
| `member-added` | data | Thêm thành viên |
| `member-removed` | data | Xóa thành viên |

---

## 9. Security

### Authentication
- JWT token với secret key
- OTP 6 số qua email (Brevo API)
- Token expiry: 7 ngày

### Data Protection
- HTTPS everywhere
- CORS configured cho specific origins
- Input validation với Mongoose schemas
- Soft delete cho messages

### E2EE Security
- ECDH P-256 key pairs
- AES-256-GCM symmetric encryption
- Password-encrypted private keys
- Device verification với OTP

### File Security
- Private B2 bucket
- Presigned URLs với expiry
- File type validation
- Size limits (5MB avatar, 10MB files)

---

## 10. Environment Variables

### Backend (Railway)
```env
# Database
MONGODB_URI=mongodb+srv://...

# Authentication
JWT_SECRET=your-secret-key

# Server
PORT=3001

# Backblaze B2
B2_KEY_ID=your-key-id
B2_APPLICATION_KEY=your-app-key
B2_BUCKET_NAME=your-bucket
B2_ENDPOINT=https://s3.us-west-004.backblazeb2.com
B2_REGION=us-west-004

# Email (Brevo)
BREVO_API_KEY=your-api-key
BREVO_FROM_EMAIL=noreply@yourdomain.com
```

### Frontend (Vercel)
```env
NEXT_PUBLIC_API_URL=https://ungdungnhantinbaomatniel-production.up.railway.app/api
```

---

## 11. Deployment

### Frontend (Vercel)
1. Connect GitHub repository
2. Configure environment variables
3. Deploy automatically on push to main

### Backend (Railway)
1. Connect GitHub repository
2. Configure environment variables
3. Deploy automatically on push to main
4. Run command: `npm start`

### Database (MongoDB Atlas)
1. Create cluster
2. Configure network access (whitelist Railway IPs or 0.0.0.0/0)
3. Create database user
4. Get connection string

---

## 12. Thống Kê Code

| Thành phần | Số file | Lines of Code (LOC) |
|------------|---------|---------------------|
| Components | 19 | ~15,000 |
| Routes | 7 | ~2,500 |
| Models | 5 | ~400 |
| Configs | 3 | ~200 |
| **Tổng cộng** | **~35** | **~18,000** |

---

## 13. Roadmap

### Đã hoàn thành ✅
- [x] Chat 1-1
- [x] Chat nhóm
- [x] Gửi file/ảnh/audio
- [x] End-to-End Encryption
- [x] Đa ngôn ngữ
- [x] Dark mode
- [x] Responsive mobile

### Đang phát triển 🚧
- [ ] Push notifications
- [ ] Voice/Video calls
- [ ] Message reactions
- [ ] Message search

### Tương lai 📋
- [ ] Mobile app (React Native/Flutter)
- [ ] Desktop app (Electron)
- [ ] Message forwarding
- [ ] Disappearing messages

---

*Tài liệu được tạo tự động dựa trên phân tích code thực tế*  
*Phiên bản: 1.0 | Ngày tạo: 2026-01-15*
