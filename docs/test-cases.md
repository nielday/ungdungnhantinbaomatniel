# 📋 Test Cases - Ứng dụng Nhắn tin Niel

## Thông tin dự án
- **Tên dự án**: Niel Messaging App
- **Version**: 1.1.0
- **URL Production**: https://ung-dung-nhan-tin-niel.vercel.app
- **API Server**: https://ungdungnhantinbaomatniel-production.up.railway.app

---

# Module 1: Xác thực (Authentication)

## TC-AUTH-001: Đăng ký tài khoản mới
| Thuộc tính | Chi tiết |
|------------|----------|
| **Mô tả** | Người dùng đăng ký tài khoản mới với thông tin hợp lệ |
| **API Endpoint** | POST /api/auth/register |
| **Precondition** | Số điện thoại và email chưa được sử dụng |

**Input:**
| Field | Giá trị test | Validation |
|-------|-------------|------------|
| phoneNumber | 0912345678 | Required, unique |
| email | test@example.com | Required, unique, lowercase, valid email format |
| fullName | Nguyễn Văn A | Required, trim whitespace |
| age | 25 | Required, min: 1, max: 120 |

**Expected Result:**
- Status: 201
- Response: `{ message: "Đăng ký thành công. Vui lòng kiểm tra email để lấy mã OTP.", userId, email }`
- User được lưu với `isVerified: false`
- OTP 6 số được gửi đến email
- OTP hết hạn sau 5 phút

---

## TC-AUTH-002: Đăng ký với số điện thoại đã tồn tại
| Thuộc tính | Chi tiết |
|------------|----------|
| **Mô tả** | Người dùng đăng ký với số điện thoại đã có trong hệ thống |
| **API Endpoint** | POST /api/auth/register |
| **Precondition** | Số điện thoại đã được sử dụng |

**Input:**
| Field | Giá trị test |
|-------|-------------|
| phoneNumber | (số đã tồn tại) |
| email | new@example.com |
| fullName | Test User |
| age | 20 |

**Expected Result:**
- Status: 400
- Response: `{ message: "Số điện thoại hoặc email đã được sử dụng" }`

---

## TC-AUTH-003: Đăng ký với email đã tồn tại
| Thuộc tính | Chi tiết |
|------------|----------|
| **Mô tả** | Người dùng đăng ký với email đã có trong hệ thống |
| **API Endpoint** | POST /api/auth/register |

**Expected Result:**
- Status: 400
- Response: `{ message: "Số điện thoại hoặc email đã được sử dụng" }`

---

## TC-AUTH-004: Xác thực OTP đăng ký
| Thuộc tính | Chi tiết |
|------------|----------|
| **Mô tả** | Người dùng xác thực OTP sau khi đăng ký |
| **API Endpoint** | POST /api/auth/verify-otp |
| **Precondition** | Đã đăng ký và nhận được OTP qua email |

**Input:**
| Field | Giá trị test |
|-------|-------------|
| userId | (userId từ response đăng ký) |
| otpCode | (mã 6 số từ email) |

**Expected Result:**
- Status: 200
- Response: `{ message: "Xác thực thành công", token, user }`
- User có `isVerified: true`
- JWT token có hiệu lực 7 ngày

---

## TC-AUTH-005: Xác thực OTP sai
| Thuộc tính | Chi tiết |
|------------|----------|
| **Mô tả** | Người dùng nhập sai mã OTP |
| **API Endpoint** | POST /api/auth/verify-otp |

**Input:**
| Field | Giá trị test |
|-------|-------------|
| userId | (userId hợp lệ) |
| otpCode | 000000 (mã sai) |

**Expected Result:**
- Status: 400
- Response: `{ message: "Mã OTP không đúng" }`

---

## TC-AUTH-006: Xác thực OTP hết hạn
| Thuộc tính | Chi tiết |
|------------|----------|
| **Mô tả** | Người dùng nhập OTP sau 5 phút |
| **API Endpoint** | POST /api/auth/verify-otp |
| **Precondition** | Đợi OTP hết hạn (5 phút) |

**Expected Result:**
- Status: 400
- Response: `{ message: "Mã OTP đã hết hạn" }`

---

## TC-AUTH-007: Gửi lại OTP
| Thuộc tính | Chi tiết |
|------------|----------|
| **Mô tả** | Người dùng yêu cầu gửi lại OTP |
| **API Endpoint** | POST /api/auth/resend-otp |

**Input:**
| Field | Giá trị test |
|-------|-------------|
| userId | (userId hợp lệ) |

**Expected Result:**
- Status: 200
- Response: `{ message: "Đã gửi lại mã OTP" }`
- OTP mới được gửi đến email

---

## TC-AUTH-008: Đăng nhập bằng số điện thoại
| Thuộc tính | Chi tiết |
|------------|----------|
| **Mô tả** | Người dùng đăng nhập với số điện thoại đã đăng ký |
| **API Endpoint** | POST /api/auth/login |
| **Precondition** | Tài khoản đã được xác thực |

**Input:**
| Field | Giá trị test |
|-------|-------------|
| phoneNumber | 0912345678 |

**Expected Result:**
- Status: 200
- Response: `{ message: "Vui lòng kiểm tra email để lấy mã OTP.", userId, email }`
- OTP được gửi đến email

---

## TC-AUTH-009: Đăng nhập với số điện thoại không tồn tại
| Thuộc tính | Chi tiết |
|------------|----------|
| **Mô tả** | Người dùng đăng nhập với số điện thoại chưa đăng ký |
| **API Endpoint** | POST /api/auth/login |

**Input:**
| Field | Giá trị test |
|-------|-------------|
| phoneNumber | 0999999999 |

**Expected Result:**
- Status: 404
- Response: `{ message: "Số điện thoại không tồn tại" }`

---

## TC-AUTH-010: Xác thực đăng nhập
| Thuộc tính | Chi tiết |
|------------|----------|
| **Mô tả** | Người dùng xác thực OTP để hoàn tất đăng nhập |
| **API Endpoint** | POST /api/auth/verify-login |

**Input:**
| Field | Giá trị test |
|-------|-------------|
| userId | (userId từ response đăng nhập) |
| otpCode | (mã 6 số từ email) |

**Expected Result:**
- Status: 200
- Response: `{ message: "Đăng nhập thành công", token, user }`
- Token chứa userId, hết hạn sau 7 ngày

---

# Module 2: Quản lý Thiết bị Tin cậy (Trusted Devices - E2EE)

## TC-DEVICE-001: Kiểm tra thiết bị mới
| Thuộc tính | Chi tiết |
|------------|----------|
| **Mô tả** | Hệ thống phát hiện đăng nhập từ thiết bị mới |
| **API Endpoint** | POST /api/auth/check-device |

**Input:**
| Field | Giá trị test |
|-------|-------------|
| userId | (userId hợp lệ) |
| deviceId | (UUID mới) |
| deviceName | "Chrome Windows" |

**Expected Result:**
- Status: 200
- Response: `{ isTrusted: false, requireOtp: true, message: "Thiết bị mới. Vui lòng xác nhận OTP đã gửi đến email." }`
- OTP được gửi đến email

---

## TC-DEVICE-002: Xác thực thiết bị với OTP
| Thuộc tính | Chi tiết |
|------------|----------|
| **Mô tả** | Người dùng xác thực thiết bị mới bằng OTP |
| **API Endpoint** | POST /api/auth/verify-device |

**Input:**
| Field | Giá trị test |
|-------|-------------|
| userId | (userId hợp lệ) |
| deviceId | (UUID từ bước trước) |
| deviceName | "Chrome Windows" |
| otpCode | (mã OTP từ email) |

**Expected Result:**
- Status: 200
- Response: `{ isTrusted: true, message: "Thiết bị đã được xác thực thành công", encryptedPrivateKey, keySalt, publicKey }`
- Thiết bị được thêm vào danh sách tin cậy

---

## TC-DEVICE-003: Lấy danh sách thiết bị tin cậy
| Thuộc tính | Chi tiết |
|------------|----------|
| **Mô tả** | Người dùng xem các thiết bị đã đăng nhập |
| **API Endpoint** | GET /api/auth/trusted-devices |
| **Headers** | Authorization: Bearer {token} |

**Expected Result:**
- Status: 200
- Response: `{ devices: [{ deviceId, deviceName, lastUsed, createdAt }] }`

---

## TC-DEVICE-004: Xóa thiết bị khỏi danh sách tin cậy
| Thuộc tính | Chi tiết |
|------------|----------|
| **Mô tả** | Người dùng xóa thiết bị không còn sử dụng |
| **API Endpoint** | DELETE /api/auth/trusted-devices/{deviceId} |
| **Headers** | Authorization: Bearer {token} |

**Expected Result:**
- Status: 200
- Response: `{ message: "Đã xóa thiết bị khỏi danh sách tin cậy" }`
- Thiết bị có isActive: false

---

# Module 3: Quản lý Người dùng (Users)

## TC-USER-001: Xem thông tin cá nhân
| Thuộc tính | Chi tiết |
|------------|----------|
| **Mô tả** | Người dùng xem profile của mình |
| **API Endpoint** | GET /api/users/profile |
| **Headers** | Authorization: Bearer {token} |

**Expected Result:**
- Status: 200
- Response chứa: phoneNumber, email, fullName, age, avatar, isVerified
- KHÔNG chứa: otpCode, otpExpires

---

## TC-USER-002: Cập nhật thông tin cá nhân
| Thuộc tính | Chi tiết |
|------------|----------|
| **Mô tả** | Người dùng cập nhật tên và tuổi |
| **API Endpoint** | PUT /api/users/profile |
| **Headers** | Authorization: Bearer {token} |

**Input:**
| Field | Giá trị test |
|-------|-------------|
| fullName | "Tên mới" |
| age | 30 |

**Expected Result:**
- Status: 200
- Response: `{ message: "Cập nhật thông tin thành công", user }`
- Thông tin được cập nhật trong database

**Lưu ý:** Email và Số điện thoại KHÔNG thể thay đổi

---

## TC-USER-003: Upload ảnh đại diện
| Thuộc tính | Chi tiết |
|------------|----------|
| **Mô tả** | Người dùng upload avatar mới |
| **API Endpoint** | POST /api/users/avatar |
| **Headers** | Authorization: Bearer {token}, Content-Type: multipart/form-data |

**Input:**
| Field | Giá trị test |
|-------|-------------|
| avatar | (file JPEG/PNG/GIF, max 5MB) |

**Expected Result:**
- Status: 200
- Response: `{ message: "Cập nhật ảnh đại diện thành công", avatar: (B2 URL) }`
- Ảnh cũ bị xóa khỏi B2 (nếu có)
- Ảnh mới được upload lên Backblaze B2

---

## TC-USER-004: Upload ảnh đại diện sai định dạng
| Thuộc tính | Chi tiết |
|------------|----------|
| **Mô tả** | Người dùng upload file không phải ảnh |
| **API Endpoint** | POST /api/users/avatar |

**Input:**
| Field | Giá trị test |
|-------|-------------|
| avatar | (file PDF hoặc EXE) |

**Expected Result:**
- Status: 400
- Response: `{ message: "Chỉ cho phép file ảnh (JPEG, JPG, PNG, GIF)" }`

---

## TC-USER-005: Tìm kiếm người dùng
| Thuộc tính | Chi tiết |
|------------|----------|
| **Mô tả** | Người dùng tìm kiếm người khác để nhắn tin |
| **API Endpoint** | GET /api/users/search?q={keyword} |
| **Headers** | Authorization: Bearer {token} |

**Input:**
| Query Param | Giá trị test |
|-------|-------------|
| q | "Nguyen" |

**Expected Result:**
- Status: 200
- Response: Danh sách users khớp với từ khóa (tối đa 20)
- Mỗi user có: _id, fullName, phoneNumber, avatar
- KHÔNG bao gồm user hiện tại
- Chỉ user đã verified

---

## TC-USER-006: Tìm kiếm với từ khóa quá ngắn
| Thuộc tính | Chi tiết |
|------------|----------|
| **Mô tả** | Người dùng tìm kiếm với ít hơn 2 ký tự |
| **API Endpoint** | GET /api/users/search?q=a |

**Expected Result:**
- Status: 400
- Response: `{ message: "Từ khóa tìm kiếm phải có ít nhất 2 ký tự" }`

---

## TC-USER-007: Tìm người dùng theo số điện thoại
| Thuộc tính | Chi tiết |
|------------|----------|
| **Mô tả** | Tìm user bằng số điện thoại chính xác |
| **API Endpoint** | GET /api/users/phone/{phoneNumber} |
| **Headers** | Authorization: Bearer {token} |

**Expected Result:**
- Status: 200
- Response: `{ fullName, phoneNumber, avatar }`

---

# Module 4: Quản lý Nhóm (Groups)

## TC-GROUP-001: Tạo nhóm mới
| Thuộc tính | Chi tiết |
|------------|----------|
| **Mô tả** | Người dùng tạo nhóm chat mới |
| **API Endpoint** | POST /api/groups |
| **Headers** | Authorization: Bearer {token} |

**Input:**
| Field | Giá trị test | Validation |
|-------|-------------|------------|
| name | "Nhóm Test" | Required, max 50 ký tự |
| description | "Mô tả nhóm" | Optional, max 200 ký tự |
| memberIds | ["userId1", "userId2"] | Required, max 99 người |

**Expected Result:**
- Status: 201
- Response: Group object với createdBy là user hiện tại
- User hiện tại tự động là admin
- Tất cả members được thêm với role "member"

---

## TC-GROUP-002: Tạo nhóm vượt quá giới hạn thành viên
| Thuộc tính | Chi tiết |
|------------|----------|
| **Mô tả** | Tạo nhóm với hơn 99 thành viên (100 bao gồm creator) |
| **API Endpoint** | POST /api/groups |

**Expected Result:**
- Status: 400
- Response: `{ message: "Nhóm không được quá 100 thành viên" }`

---

## TC-GROUP-003: Lấy danh sách nhóm
| Thuộc tính | Chi tiết |
|------------|----------|
| **Mô tả** | Người dùng xem các nhóm mình tham gia |
| **API Endpoint** | GET /api/groups |
| **Headers** | Authorization: Bearer {token} |

**Expected Result:**
- Status: 200
- Response: Danh sách groups, sắp xếp theo lastMessageAt giảm dần
- Mỗi group có thông tin đầy đủ của members

---

## TC-GROUP-004: Xem chi tiết nhóm
| Thuộc tính | Chi tiết |
|------------|----------|
| **Mô tả** | Người dùng xem thông tin nhóm |
| **API Endpoint** | GET /api/groups/{groupId} |
| **Headers** | Authorization: Bearer {token} |
| **Precondition** | User là thành viên của nhóm |

**Expected Result:**
- Status: 200
- Response: Group object với đầy đủ thông tin members

---

## TC-GROUP-005: Cập nhật thông tin nhóm
| Thuộc tính | Chi tiết |
|------------|----------|
| **Mô tả** | Admin cập nhật tên/mô tả nhóm |
| **API Endpoint** | PUT /api/groups/{groupId} |
| **Headers** | Authorization: Bearer {token} |
| **Precondition** | User là người tạo nhóm |

**Input:**
| Field | Giá trị test |
|-------|-------------|
| name | "Tên nhóm mới" |
| description | "Mô tả mới" |

**Expected Result:**
- Status: 200
- Response: Group object đã cập nhật
- Socket event 'group-info-updated' được emit

---

## TC-GROUP-006: Thêm thành viên vào nhóm
| Thuộc tính | Chi tiết |
|------------|----------|
| **Mô tả** | Admin thêm người mới vào nhóm |
| **API Endpoint** | POST /api/groups/{groupId}/members |
| **Headers** | Authorization: Bearer {token} |
| **Precondition** | User là người tạo nhóm |

**Input:**
| Field | Giá trị test |
|-------|-------------|
| memberId | (userId của người cần thêm) |

**Expected Result:**
- Status: 200
- Response: Group object với member mới

---

## TC-GROUP-007: Thêm thành viên đã có trong nhóm
| Thuộc tính | Chi tiết |
|------------|----------|
| **Mô tả** | Thêm người đã là thành viên |
| **API Endpoint** | POST /api/groups/{groupId}/members |

**Expected Result:**
- Status: 400
- Response: `{ message: "Người dùng đã có trong nhóm" }`

---

## TC-GROUP-008: Xóa thành viên khỏi nhóm
| Thuộc tính | Chi tiết |
|------------|----------|
| **Mô tả** | Admin xóa thành viên khỏi nhóm |
| **API Endpoint** | DELETE /api/groups/{groupId}/members/{memberId} |
| **Headers** | Authorization: Bearer {token} |
| **Precondition** | User là người tạo nhóm |

**Expected Result:**
- Status: 200
- Response: Group object không còn member đó

---

## TC-GROUP-009: Không thể xóa người tạo nhóm
| Thuộc tính | Chi tiết |
|------------|----------|
| **Mô tả** | Thử xóa người tạo nhóm |
| **API Endpoint** | DELETE /api/groups/{groupId}/members/{creatorId} |

**Expected Result:**
- Status: 400
- Response: `{ message: "Không thể xóa người tạo nhóm" }`

---

## TC-GROUP-010: Rời khỏi nhóm
| Thuộc tính | Chi tiết |
|------------|----------|
| **Mô tả** | Thành viên tự rời nhóm |
| **API Endpoint** | POST /api/groups/{groupId}/leave |
| **Headers** | Authorization: Bearer {token} |
| **Precondition** | User là thành viên nhưng KHÔNG phải creator |

**Expected Result:**
- Status: 200
- Response: `{ message: "Đã rời khỏi nhóm" }`

---

## TC-GROUP-011: Người tạo không thể rời nhóm
| Thuộc tính | Chi tiết |
|------------|----------|
| **Mô tả** | Creator cố gắng rời nhóm |
| **API Endpoint** | POST /api/groups/{groupId}/leave |

**Expected Result:**
- Status: 400
- Response: `{ message: "Người tạo nhóm không thể rời khỏi nhóm" }`

---

## TC-GROUP-012: Upload avatar nhóm
| Thuộc tính | Chi tiết |
|------------|----------|
| **Mô tả** | Admin upload ảnh đại diện cho nhóm |
| **API Endpoint** | POST /api/groups/{groupId}/avatar |
| **Headers** | Authorization: Bearer {token}, Content-Type: multipart/form-data |
| **Precondition** | User là người tạo nhóm |

**Input:**
| Field | Giá trị test |
|-------|-------------|
| avatar | (file JPEG/PNG/GIF, max 5MB) |

**Expected Result:**
- Status: 200
- Response: Group object với avatar URL mới (B2)
- Socket event 'group-info-updated' được emit

---

# Module 5: Nhắn tin (Messages)

## TC-MSG-001: Gửi tin nhắn văn bản
| Thuộc tính | Chi tiết |
|------------|----------|
| **Mô tả** | Gửi tin nhắn text trong cuộc trò chuyện |
| **API Endpoint** | POST /api/messages/{conversationId}/text |
| **Headers** | Authorization: Bearer {token} |

**Input:**
| Field | Giá trị test |
|-------|-------------|
| content | "Xin chào!" |
| replyTo | null (hoặc messageId) |
| isEncrypted | false |
| encryptionData | null |

**Expected Result:**
- Status: 201
- Response: Message object với senderId populated
- Socket event 'new-message' được emit
- lastMessage và lastMessageAt của conversation được cập nhật

---

## TC-MSG-002: Gửi tin nhắn được mã hóa E2EE
| Thuộc tính | Chi tiết |
|------------|----------|
| **Mô tả** | Gửi tin nhắn đã mã hóa |
| **API Endpoint** | POST /api/messages/{conversationId}/text |
| **Precondition** | Cả 2 user đều có encryption keys |

**Input:**
| Field | Giá trị test |
|-------|-------------|
| content | (ciphertext base64) |
| isEncrypted | true |
| encryptionData | { iv: "(IV base64)", algorithm: "AES-256-GCM" } |

**Expected Result:**
- Status: 201
- Message lưu với isEncrypted: true

---

## TC-MSG-003: Lấy tin nhắn của cuộc trò chuyện
| Thuộc tính | Chi tiết |
|------------|----------|
| **Mô tả** | Lấy danh sách tin nhắn, hỗ trợ phân trang |
| **API Endpoint** | GET /api/messages/{conversationId}?page=1&limit=50 |
| **Headers** | Authorization: Bearer {token} |
| **Precondition** | User là participant của conversation |

**Expected Result:**
- Status: 200
- Response: Danh sách messages, sắp xếp theo createdAt tăng dần
- Messages đã deleted (isDeleted: true) không được trả về
- Hỗ trợ pagination với page và limit

---

## TC-MSG-004: Lấy tin nhắn không có quyền
| Thuộc tính | Chi tiết |
|------------|----------|
| **Mô tả** | User không phải participant cố lấy tin nhắn |
| **API Endpoint** | GET /api/messages/{conversationId} |

**Expected Result:**
- Status: 404
- Response: `{ message: "Cuộc trò chuyện không tồn tại hoặc bạn không có quyền truy cập" }`

---

## TC-MSG-005: Gửi file đính kèm
| Thuộc tính | Chi tiết |
|------------|----------|
| **Mô tả** | Gửi tin nhắn có file đính kèm |
| **API Endpoint** | POST /api/messages/{conversationId}/file |
| **Headers** | Content-Type: multipart/form-data |

**Input:**
| Field | Giá trị test | Validation |
|-------|-------------|------------|
| files | (1-5 files) | Max 10MB mỗi file |
| content | "Đây là file" | Optional |
| replyTo | null | Optional |

**Định dạng hỗ trợ:** jpeg, jpg, png, gif, mp3, wav, mp4, pdf, doc, docx, txt

**Expected Result:**
- Status: 201
- Response: Message với attachments array
- messageType tự động xác định: 'image', 'audio', hoặc 'file'
- Files được upload lên Backblaze B2

---

## TC-MSG-006: Gửi file quá kích thước
| Thuộc tính | Chi tiết |
|------------|----------|
| **Mô tả** | Upload file lớn hơn 10MB |
| **API Endpoint** | POST /api/messages/{conversationId}/file |

**Expected Result:**
- Status: 400
- Response: `{ message: "Lỗi upload file" }`

---

## TC-MSG-007: Gửi ảnh từ camera
| Thuộc tính | Chi tiết |
|------------|----------|
| **Mô tả** | Chụp ảnh và gửi trực tiếp từ camera |
| **UI Component** | CameraCapture.tsx |

**Steps:**
1. Click nút Camera trong chat
2. Cho phép quyền truy cập camera
3. Chụp ảnh
4. Xác nhận gửi

**Expected Result:**
- Ảnh được gửi với messageType: 'image'
- File được upload lên B2

---

## TC-MSG-008: Xóa tin nhắn
| Thuộc tính | Chi tiết |
|------------|----------|
| **Mô tả** | Người gửi xóa tin nhắn của mình |
| **API Endpoint** | DELETE /api/messages/{messageId} |
| **Headers** | Authorization: Bearer {token} |
| **Precondition** | User là người gửi tin nhắn |

**Expected Result:**
- Status: 200
- Response: `{ message: "Tin nhắn đã được xóa thành công" }`
- Message có isDeleted: true, content: "Tin nhắn đã bị xóa"
- Attachments bị xóa khỏi B2 và cleared
- Socket event 'message-deleted' được emit

---

## TC-MSG-009: Xóa tin nhắn của người khác
| Thuộc tính | Chi tiết |
|------------|----------|
| **Mô tả** | User cố xóa tin nhắn không phải của mình |
| **API Endpoint** | DELETE /api/messages/{messageId} |

**Expected Result:**
- Status: 403
- Response: `{ message: "Bạn chỉ có thể xóa tin nhắn của chính mình" }`

---

## TC-MSG-010: Trả lời tin nhắn
| Thuộc tính | Chi tiết |
|------------|----------|
| **Mô tả** | Gửi tin nhắn reply |
| **API Endpoint** | POST /api/messages/{conversationId}/text |

**Input:**
| Field | Giá trị test |
|-------|-------------|
| content | "Tôi đồng ý" |
| replyTo | (messageId cần reply) |

**Expected Result:**
- Status: 201
- Message có replyTo populated với nội dung tin nhắn gốc

---

# Module 6: Mã hóa đầu cuối (E2EE)

## TC-E2EE-001: Tạo cặp khóa mã hóa
| Thuộc tính | Chi tiết |
|------------|----------|
| **Mô tả** | Người dùng tạo encryption keys |
| **API Endpoint** | PUT /api/users/encryption-keys |
| **Headers** | Authorization: Bearer {token} |

**Input:**
| Field | Mô tả |
|-------|-------|
| publicKey | Base64 ECDH public key |
| encryptedPrivateKey | Private key đã mã hóa bằng password |
| keySalt | JSON chứa iv và salt |
| deviceId | UUID thiết bị |
| deviceName | Tên thiết bị |

**Expected Result:**
- Status: 200
- Response: `{ message: "Đã lưu encryption keys", keyCreatedAt }`
- Device tự động được thêm vào trusted list

---

## TC-E2EE-002: Lấy khóa của bản thân
| Thuộc tính | Chi tiết |
|------------|----------|
| **Mô tả** | Lấy lại encryption keys để khôi phục |
| **API Endpoint** | GET /api/users/encryption-keys |
| **Headers** | Authorization: Bearer {token} |

**Expected Result:**
- Status: 200
- Response: `{ publicKey, encryptedPrivateKey, keySalt, keyCreatedAt }`

---

## TC-E2EE-003: Lấy khóa công khai của người khác
| Thuộc tính | Chi tiết |
|------------|----------|
| **Mô tả** | Lấy public key để mã hóa tin nhắn |
| **API Endpoint** | GET /api/users/{userId}/public-key |
| **Headers** | Authorization: Bearer {token} |

**Expected Result:**
- Status: 200
- Response: `{ userId, publicKey, keyCreatedAt }`

---

## TC-E2EE-004: Lấy khóa của user chưa có key
| Thuộc tính | Chi tiết |
|------------|----------|
| **Mô tả** | Lấy public key của user chưa setup E2EE |
| **API Endpoint** | GET /api/users/{userId}/public-key |

**Expected Result:**
- Status: 404
- Response: `{ message: "Người dùng chưa có encryption key" }`

---

## TC-E2EE-005: Xóa encryption keys
| Thuộc tính | Chi tiết |
|------------|----------|
| **Mô tả** | Người dùng xóa khóa mã hóa |
| **API Endpoint** | DELETE /api/users/encryption-keys |
| **Headers** | Authorization: Bearer {token} |

**Expected Result:**
- Status: 200
- Response: `{ message: "Đã xóa encryption keys" }`
- publicKey, encryptedPrivateKey, keySalt, keyCreatedAt = undefined

---

## TC-E2EE-006: Backup encryption keys
| Thuộc tính | Chi tiết |
|------------|----------|
| **Mô tả** | Sao lưu khóa mã hóa ra file |
| **UI Component** | SettingsModal.tsx > Security tab |

**Steps:**
1. Vào Settings > Bảo mật
2. Click "Sao lưu khóa"
3. Nhập mật khẩu đăng nhập (để giải mã key từ server)
4. Nhập mật khẩu backup (để mã hóa file backup)
5. Xác nhận mật khẩu backup

**Expected Result:**
- File ZIP được tải về chứa:
  - `niel-messenger-key.json` (encrypted private key)
  - `README.txt` (hướng dẫn)

---

## TC-E2EE-007: Restore encryption keys
| Thuộc tính | Chi tiết |
|------------|----------|
| **Mô tả** | Khôi phục khóa từ file backup |
| **UI Component** | SettingsModal.tsx > Security tab |

**Steps:**
1. Vào Settings > Bảo mật
2. Click "Nhập khóa"
3. Chọn file backup (.zip hoặc .json)
4. Nhập mật khẩu backup
5. Nhập mật khẩu đăng nhập (để mã hóa lại trước khi lưu server)

**Expected Result:**
- Khóa được khôi phục và lưu lên server
- Key fingerprint được hiển thị

---

# Module 7: Cài đặt (Settings)

## TC-SET-001: Chuyển đổi Dark Mode
| Thuộc tính | Chi tiết |
|------------|----------|
| **Mô tả** | Bật/tắt chế độ tối |
| **UI Component** | SettingsModal.tsx |

**Steps:**
1. Mở Settings
2. Toggle switch Dark Mode

**Expected Result:**
- Giao diện chuyển sang màu tối/sáng
- Setting được lưu vào localStorage

---

## TC-SET-002: Chuyển đổi ngôn ngữ
| Thuộc tính | Chi tiết |
|------------|----------|
| **Mô tả** | Đổi ngôn ngữ ứng dụng |
| **UI Component** | LanguageSwitcher.tsx |

**Options:** Tiếng Việt (vi), English (en)

**Expected Result:**
- Toàn bộ UI chuyển sang ngôn ngữ được chọn
- URL thay đổi (/{locale}/...)

---

## TC-SET-003: Xem chính sách bảo mật
| Thuộc tính | Chi tiết |
|------------|----------|
| **Mô tả** | Mở Privacy Policy |
| **UI Component** | PrivacyPolicyModal.tsx |

**Expected Result:**
- Modal hiển thị chính sách bảo mật đầy đủ

---

## TC-SET-004: Đăng xuất
| Thuộc tính | Chi tiết |
|------------|----------|
| **Mô tả** | Người dùng đăng xuất |
| **UI Component** | ChatApp.tsx |

**Expected Result:**
- Token bị xóa khỏi localStorage
- Socket.io disconnect
- Redirect về trang login

---

# Module 8: Real-time Features (Socket.io)

## TC-RT-001: Nhận tin nhắn real-time
| Thuộc tính | Chi tiết |
|------------|----------|
| **Mô tả** | Tin nhắn mới hiển thị ngay lập tức |
| **Socket Event** | 'new-message' |

**Steps:**
1. User A và User B đang trong cùng conversation
2. User A gửi tin nhắn

**Expected Result:**
- Tin nhắn hiển thị ngay trên màn hình User B
- Không cần refresh

---

## TC-RT-002: Typing indicator
| Thuộc tính | Chi tiết |
|------------|----------|
| **Mô tả** | Hiển thị khi người khác đang gõ |
| **Socket Events** | 'typing', 'user-typing' |

**Steps:**
1. User A bắt đầu gõ
2. Socket emit 'typing' với isTyping: true

**Expected Result:**
- User B thấy indicator "Đang nhập..."
- Indicator biến mất sau 2 giây không gõ

---

## TC-RT-003: Thông báo tin nhắn bị xóa
| Thuộc tính | Chi tiết |
|------------|----------|
| **Mô tả** | Real-time update khi tin nhắn bị xóa |
| **Socket Event** | 'message-deleted' |

**Steps:**
1. User A xóa tin nhắn
2. Socket emit 'message-deleted'

**Expected Result:**
- Tin nhắn trên màn hình User B hiển thị "Tin nhắn đã bị xóa"

---

## TC-RT-004: Cập nhật thông tin nhóm
| Thuộc tính | Chi tiết |
|------------|----------|
| **Mô tả** | Real-time update khi nhóm thay đổi |
| **Socket Event** | 'group-info-updated' |

**Steps:**
1. Admin thay đổi tên/avatar nhóm

**Expected Result:**
- Tất cả members thấy thay đổi ngay lập tức

---

# Module 9: Responsive & Mobile

## TC-MOB-001: Giao diện mobile
| Thuộc tính | Chi tiết |
|------------|----------|
| **Mô tả** | Kiểm tra layout trên mobile |
| **Breakpoint** | < 768px |

**Expected Result:**
- Sidebar chiếm toàn màn hình
- Bottom navigation hiển thị
- Swipe gesture để mở sidebar

---

## TC-MOB-002: Safe area inset
| Thuộc tính | Chi tiết |
|------------|----------|
| **Mô tả** | Kiểm tra trên iPhone có notch |

**Expected Result:**
- Bottom navigation có padding cho safe area
- Không bị che bởi home indicator

---

## TC-MOB-003: Touch gestures
| Thuộc tính | Chi tiết |
|------------|----------|
| **Mô tả** | Swipe phải để mở sidebar |

**Steps:**
1. Ở conversation view
2. Swipe phải từ mép trái màn hình

**Expected Result:**
- Sidebar slide in từ trái

---

# Phụ lục: Các trường hợp lỗi cần test

## Error Cases

| ID | Mô tả | Expected Status |
|----|-------|-----------------|
| ERR-001 | Request không có Authorization header | 401 |
| ERR-002 | Token hết hạn | 401 |
| ERR-003 | Token invalid | 401 |
| ERR-004 | User không tồn tại (bị xóa sau khi login) | 404 |
| ERR-005 | User chưa verified cố thực hiện action | 403 |
| ERR-006 | Request body thiếu required fields | 400 |
| ERR-007 | MongoDB connection error | 500 |
| ERR-008 | B2 upload error | 500 |
| ERR-009 | Email send error | 500 |

---

*Tài liệu được tạo dựa trên phân tích code thực tế từ:*
- `routes/auth.js` (581 dòng)
- `routes/users.js` (417 dòng)
- `routes/groups.js` (489 dòng)
- `routes/messages.js` (480 dòng)
- `components/AuthPage.tsx` (369 dòng)
- `components/ChatWindow.tsx` (1257 dòng)
- `components/SettingsModal.tsx` (1600 dòng)
- `models/*.js`

*Phiên bản: 1.0 | Ngày tạo: 2026-01-15*
