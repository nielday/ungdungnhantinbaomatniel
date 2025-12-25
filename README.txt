ỨNG DỤNG NHẮN TIN NIEL - MESSAGING APP
==========================================

📋 MÔ TẢ DỰ ÁN
--------------
Ứng dụng nhắn tin real-time được xây dựng với Next.js, Express.js, MongoDB và Socket.io.
Hỗ trợ đăng ký/đăng nhập bằng số điện thoại, chat real-time, tìm kiếm người dùng.

🏗️ KIẾN TRÚC HỆ THỐNG
--------------------
- Frontend: Next.js 14 (Vercel)
- Backend: Express.js + Socket.io (Railway)
- Database: MongoDB Atlas
- Real-time: Socket.io
- Authentication: JWT

📁 CẤU TRÚC THƯ MỤC
------------------
├── app/                    # Next.js App Router
│   ├── [locale]/          # Internationalization
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React Components
│   ├── AuthContext.tsx    # Authentication context
│   ├── SocketContext.tsx  # Socket.io context
│   ├── ChatApp.tsx        # Main chat application
│   ├── ChatWindow.tsx     # Chat interface
│   ├── ChatList.tsx       # Conversation list
│   ├── UserSearch.tsx     # User search
│   ├── AuthPage.tsx       # Login/Register page
│   └── ...
├── routes/                # Backend API routes
│   ├── auth.js           # Authentication routes
│   ├── conversations.js  # Chat conversations
│   ├── messages.js       # Message handling
│   └── users.js          # User management
├── models/                # Database models
│   ├── User.js           # User schema
│   ├── Conversation.js   # Chat schema
│   └── Message.js        # Message schema
├── server.js             # Express server
├── vercel.json           # Vercel configuration
└── package.json          # Dependencies

🔧 CÔNG NGHỆ SỬ DỤNG
-------------------
Frontend:
- Next.js 14 (React framework)
- TypeScript
- Tailwind CSS
- Framer Motion (animations)
- Next-intl (internationalization)
- Socket.io-client (real-time)

Backend:
- Express.js
- Socket.io
- MongoDB + Mongoose
- JWT authentication
- Nodemailer (email)
- CORS

Database:
- MongoDB Atlas (cloud database)
- Mongoose ODM

🚀 DEPLOYMENT
------------
Frontend: Vercel
- URL: https://ung-dung-nhan-tin-niel.vercel.app
- Auto-deploy từ GitHub
- Environment: Production

Backend: Railway
- URL: https://ungdungnhantinbaomatniel-production.up.railway.app
- Auto-deploy từ GitHub
- Environment variables: MongoDB, JWT, Email

📱 TÍNH NĂNG CHÍNH
-----------------
1. Authentication:
   - Đăng ký bằng số điện thoại + email
   - Đăng nhập bằng số điện thoại
   - JWT token authentication
   - Không cần OTP (đã bỏ)

2. Real-time Chat:
   - Socket.io real-time messaging
   - Chat 1-1 và nhóm
   - Typing indicators
   - Message status

3. User Management:
   - Tìm kiếm người dùng
   - Profile management
   - Avatar upload
   - Settings

4. Internationalization:
   - Tiếng Việt (vi)
   - Tiếng Anh (en)
   - Language switcher

🔐 BẢO MẬT
---------
- JWT token authentication
- CORS configuration
- Input validation
- Secure password handling
- Environment variables

📊 DATABASE SCHEMA
-----------------
User:
- phoneNumber (unique)
- email (unique)
- fullName
- age
- avatar
- isVerified
- timestamps

Conversation:
- type (private/group)
- participants
- lastMessage
- timestamps

Message:
- conversationId
- senderId
- content
- type (text/image)
- timestamps

🌐 API ENDPOINTS
---------------
Authentication:
- POST /api/auth/register
- POST /api/auth/login

Users:
- GET /api/users/profile
- PUT /api/users/profile
- POST /api/users/avatar
- GET /api/users/search

Conversations:
- GET /api/conversations
- POST /api/conversations
- GET /api/conversations/:id

Messages:
- GET /api/messages/:conversationId
- POST /api/messages

🔧 ENVIRONMENT VARIABLES
-----------------------
Backend (Railway):
- MONGODB_URI=mongodb+srv://...
- JWT_SECRET=your-secret-key
- PORT=3001
- B2_KEY_ID=your-b2-key-id
- B2_APPLICATION_KEY=your-b2-application-key
- B2_BUCKET_NAME=your-bucket-name
- B2_ENDPOINT=https://s3.us-west-004.backblazeb2.com
- B2_REGION=us-west-004
- BREVO_API_KEY=your-brevo-api-key
- BREVO_FROM_EMAIL=your-email@domain.com

Frontend (Vercel):
- NEXT_PUBLIC_API_URL=/api

📦 DEPENDENCIES
--------------
Frontend:
- next@14.2.31
- react@18
- typescript@5
- tailwindcss@3.3.0
- framer-motion@10.18.0
- next-intl@3.26.5
- socket.io-client@4.7.5
- lucide-react@0.292.0

Backend:
- express@4.18.2
- socket.io@4.7.5
- mongoose@8.0.3
- jsonwebtoken@9.0.2
- bcryptjs@2.4.3
- nodemailer@6.9.7
- cors@2.8.5
- @aws-sdk/client-s3@latest (for Backblaze B2)
- @aws-sdk/s3-request-presigner@latest

🚀 CÁCH CHẠY LOCAL
-----------------
1. Clone repository:
   git clone https://github.com/nielday/ungdungnhantinbaomatniel.git

2. Install dependencies:
   npm install

3. Tạo .env.local:
   MONGODB_URI=your-mongodb-uri
   JWT_SECRET=your-jwt-secret
   NEXT_PUBLIC_API_URL=http://localhost:3001/api

4. Chạy backend:
   npm run server

5. Chạy frontend:
   npm run dev

6. Truy cập: http://localhost:3000

📈 PERFORMANCE
--------------
- Next.js SSR/SSG
- MongoDB indexing
- Socket.io optimization
- Backblaze B2 CDN (permanent file storage)
- Image optimization
- Code splitting

💾 FILE STORAGE
--------------
- Backblaze B2 Cloud Storage
- Permanent storage (không mất file khi deploy)
- $0.005/GB/month (rất rẻ)
- Free bandwidth (3x storage)
- S3-compatible API
- Sẵn sàng cho E2EE encryption
- Xem docs/B2_SETUP.md để setup

🔍 DEBUGGING
-----------
- Console logs trong development
- Error boundaries
- Socket connection status
- API response logging

📝 CHANGELOG
-----------
v1.0.0:
- Initial release
- Basic chat functionality
- User authentication
- Real-time messaging

v1.1.0:
- Removed OTP authentication
- Direct login/register
- Improved UI/UX
- Socket.io integration

🎯 ROADMAP
---------
- [ ] Group chat
- [ ] File sharing
- [ ] Voice messages
- [ ] Push notifications
- [ ] Mobile app
- [ ] Video calls

📞 SUPPORT
----------
- GitHub Issues: https://github.com/nielday/ungdungnhantinbaomatniel/issues
- Email: phonghd.2005.io@gmail.com

📄 LICENSE
---------
MIT License - Xem file LICENSE để biết thêm chi tiết.

==========================================
Tạo bởi: Đào Đức Phong
Ngày: 2024
Phiên bản: 1.1.0
==========================================
.