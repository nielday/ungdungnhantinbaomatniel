'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Shield, Lock, Eye, Database, Users, FileText, MessageCircle } from 'lucide-react';

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({ isOpen, onClose }) => {
  const sections = [
    {
      id: 'overview',
      title: 'Tổng quan',
      icon: Shield,
      content: [
        'Chính sách bảo mật này mô tả cách ứng dụng nhắn tin Niel Chat thu thập, sử dụng và bảo vệ thông tin cá nhân của bạn.',
        'Chúng tôi cam kết bảo vệ quyền riêng tư và thông tin cá nhân của người dùng theo các tiêu chuẩn bảo mật cao nhất.',
        'Việc sử dụng Niel Chat đồng nghĩa với việc bạn đồng ý với chính sách bảo mật này.'
      ]
    },
    {
      id: 'data-collection',
      title: 'Thu thập thông tin',
      icon: Database,
      content: [
        'Thông tin tài khoản: Số điện thoại, email, họ tên, tuổi khi đăng ký',
        'Tin nhắn: Nội dung tin nhắn được mã hóa đầu cuối (E2EE)',
        'Ảnh đại diện: Avatar bạn tải lên để hiển thị trên hồ sơ',
        'Thông tin kỹ thuật: Thiết bị, phiên bản ứng dụng, địa chỉ IP',
        'Khóa mã hóa: Cặp khóa công khai/riêng tư để mã hóa tin nhắn'
      ]
    },
    {
      id: 'encryption',
      title: 'Mã hóa đầu cuối (E2EE)',
      icon: Lock,
      content: [
        'Tất cả tin nhắn được mã hóa bằng thuật toán RSA và AES',
        'Chỉ bạn và người nhận mới có thể đọc nội dung tin nhắn',
        'Ngay cả Niel Chat cũng không thể giải mã tin nhắn của bạn',
        'Khóa riêng tư chỉ lưu trên thiết bị của bạn, không gửi lên server',
        'Hỗ trợ sao lưu khóa mã hóa có bảo vệ bằng mật khẩu'
      ]
    },
    {
      id: 'data-protection',
      title: 'Bảo vệ dữ liệu',
      icon: Shield,
      content: [
        'Số điện thoại và email không thể thay đổi sau khi đăng ký để đảm bảo danh tính',
        'Mã hóa SSL/TLS cho tất cả dữ liệu truyền tải',
        'Xác thực OTP qua email khi đăng ký',
        'Quản lý thiết bị đáng tin cậy cho mã hóa',
        'Tuân thủ các tiêu chuẩn bảo mật quốc tế'
      ]
    },
    {
      id: 'data-usage',
      title: 'Sử dụng thông tin',
      icon: MessageCircle,
      content: [
        'Gửi và nhận tin nhắn giữa người dùng',
        'Hiển thị thông tin hồ sơ cho người liên hệ',
        'Thông báo khi có tin nhắn mới (nếu được cho phép)',
        'Hỗ trợ kỹ thuật và giải quyết vấn đề',
        'Cải thiện trải nghiệm người dùng'
      ]
    },
    {
      id: 'data-sharing',
      title: 'Chia sẻ thông tin',
      icon: Users,
      content: [
        'Không bán, cho thuê hoặc chia sẻ thông tin cá nhân với bên thứ ba',
        'Tin nhắn được mã hóa nên không ai có thể đọc ngoại trừ người gửi và nhận',
        'Chỉ chia sẻ khi có yêu cầu pháp lý hợp lệ',
        'Thông tin hồ sơ công khai chỉ hiển thị cho người liên hệ'
      ]
    },
    {
      id: 'user-rights',
      title: 'Quyền của người dùng',
      icon: Eye,
      content: [
        'Quyền truy cập: Xem thông tin cá nhân đã lưu trữ',
        'Quyền chỉnh sửa: Cập nhật tên hiển thị và tuổi',
        'Quyền xóa: Xóa lịch sử tin nhắn hoặc toàn bộ tài khoản',
        'Quyền sao lưu: Sao lưu khóa mã hóa để khôi phục trên thiết bị khác',
        'Quyền bảo mật: Quản lý thiết bị đáng tin cậy'
      ]
    },
    {
      id: 'retention',
      title: 'Lưu trữ dữ liệu',
      icon: Database,
      content: [
        'Thông tin tài khoản: Lưu trữ cho đến khi bạn xóa tài khoản',
        'Tin nhắn mã hóa: Lưu trữ trên server dưới dạng đã mã hóa',
        'Khóa mã hóa: Lưu trên thiết bị của bạn, server chỉ lưu khóa công khai',
        'Logs hệ thống: Lưu trữ tối đa 30 ngày'
      ]
    },
    {
      id: 'security',
      title: 'Bảo mật tài khoản',
      icon: Lock,
      content: [
        'Xác thực bằng số điện thoại và mã OTP',
        'Mỗi phiên đăng nhập có token riêng biệt',
        'Tự động đăng xuất sau thời gian không hoạt động',
        'Thông báo khi có đăng nhập từ thiết bị mới',
        'Có thể xóa thiết bị đáng tin cậy bất cứ lúc nào'
      ]
    },
    {
      id: 'changes',
      title: 'Thay đổi chính sách',
      icon: FileText,
      content: [
        'Thông báo trước khi có thay đổi lớn',
        'Cập nhật ngày hiệu lực trong chính sách',
        'Tiếp tục sử dụng đồng nghĩa với việc chấp nhận thay đổi',
        'Lưu trữ phiên bản cũ để tham khảo'
      ]
    },
    {
      id: 'contact',
      title: 'Liên hệ',
      icon: Users,
      content: [
        'Email: support@nielchat.com',
        'GitHub: github.com/nielday/ungdungnhantinbaomatniel',
        'Thời gian phản hồi: 24-48 giờ',
        'Phản hồi về bảo mật: security@nielchat.com'
      ]
    }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Chính sách bảo mật</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Cập nhật lần cuối: 13/01/2026</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              <div className="space-y-8">
                {/* Introduction */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <p className="text-blue-800 dark:text-blue-200 text-sm">
                    <strong>🔐 Niel Chat - Ứng dụng nhắn tin bảo mật:</strong> Tin nhắn của bạn được mã hóa đầu cuối (E2EE).
                    Chỉ bạn và người nhận mới có thể đọc nội dung tin nhắn. Ngay cả chúng tôi cũng không thể giải mã.
                  </p>
                </div>

                {/* Sections */}
                {sections.map((section, index) => {
                  const Icon = section.icon;
                  return (
                    <motion.div
                      key={section.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-6"
                    >
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                          <Icon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                          {section.title}
                        </h3>
                      </div>
                      <ul className="space-y-2">
                        {section.content.map((item, itemIndex) => (
                          <li key={itemIndex} className="flex items-start space-x-2">
                            <span className="text-blue-500 mt-1">•</span>
                            <span className="text-gray-700 dark:text-gray-300 text-sm">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  );
                })}

                {/* Footer */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Phiên bản: 2.0 | Ngày hiệu lực: 13/01/2026
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        © 2026 Niel Chat. Tất cả quyền được bảo lưu.
                      </p>
                    </div>
                    <button
                      onClick={onClose}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                    >
                      Đã hiểu
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default PrivacyPolicyModal;
