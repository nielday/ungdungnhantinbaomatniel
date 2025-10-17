'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Trash2, 
  AlertTriangle, 
  Shield, 
  Database,
  Users,
  MessageCircle,
  FileText,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface AdminStats {
  users: number;
  conversations: number;
  messages: number;
  files: number;
}

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteStatus, setDeleteStatus] = useState<string>('');
  const [showConfirm, setShowConfirm] = useState(false);

  const ADMIN_PASSWORD = 'Phong8ngon';

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      fetchStats();
    } else {
      alert('Sai mật khẩu!');
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleDeleteAll = async () => {
    setIsDeleting(true);
    setDeleteStatus('Đang xóa dữ liệu...');
    
    try {
      const response = await fetch('/api/admin/delete-all', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setDeleteStatus('✅ Đã xóa toàn bộ dữ liệu thành công!');
        setStats({ users: 0, conversations: 0, messages: 0, files: 0 });
      } else {
        setDeleteStatus('❌ Lỗi khi xóa dữ liệu!');
      }
    } catch (error) {
      setDeleteStatus('❌ Lỗi kết nối!');
    } finally {
      setIsDeleting(false);
      setShowConfirm(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md"
        >
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Admin Panel</h1>
            <p className="text-gray-600">Nhập mật khẩu để tiếp tục</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mật khẩu Admin
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Nhập mật khẩu..."
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              Đăng nhập
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl p-6 mb-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <Shield className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Admin Panel</h1>
                <p className="text-gray-600">Quản lý dữ liệu hệ thống</p>
              </div>
            </div>
            <button
              onClick={() => setIsAuthenticated(false)}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Đăng xuất
            </button>
          </div>
        </motion.div>

        {/* Stats */}
        {stats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6"
          >
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Người dùng</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.users}</p>
                </div>
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Cuộc trò chuyện</p>
                  <p className="text-2xl font-bold text-green-600">{stats.conversations}</p>
                </div>
                <MessageCircle className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Tin nhắn</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.messages}</p>
                </div>
                <FileText className="w-8 h-8 text-purple-600" />
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Files</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.files}</p>
                </div>
                <Database className="w-8 h-8 text-orange-600" />
              </div>
            </div>
          </motion.div>
        )}

        {/* Danger Zone */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl p-6"
        >
          <div className="flex items-center space-x-3 mb-6">
            <AlertTriangle className="w-6 h-6 text-red-600" />
            <h2 className="text-xl font-bold text-red-600">Vùng nguy hiểm</h2>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-start space-x-4">
              <Trash2 className="w-8 h-8 text-red-600 mt-1" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-red-800 mb-2">
                  Xóa toàn bộ dữ liệu
                </h3>
                <p className="text-red-700 mb-4">
                  Hành động này sẽ xóa vĩnh viễn tất cả dữ liệu trong database bao gồm:
                </p>
                <ul className="list-disc list-inside text-red-700 space-y-1 mb-6">
                  <li>Tất cả người dùng</li>
                  <li>Tất cả cuộc trò chuyện</li>
                  <li>Tất cả tin nhắn</li>
                  <li>Tất cả files và hình ảnh</li>
                </ul>
                <p className="text-red-800 font-semibold mb-4">
                  ⚠️ Hành động này không thể hoàn tác!
                </p>
                
                {!showConfirm ? (
                  <button
                    onClick={() => setShowConfirm(true)}
                    className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors font-medium"
                  >
                    Xóa toàn bộ dữ liệu
                  </button>
                ) : (
                  <div className="space-y-4">
                    <p className="text-red-800 font-semibold">
                      Bạn có chắc chắn muốn xóa toàn bộ dữ liệu?
                    </p>
                    <div className="flex space-x-4">
                      <button
                        onClick={handleDeleteAll}
                        disabled={isDeleting}
                        className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50"
                      >
                        {isDeleting ? 'Đang xóa...' : 'Xác nhận xóa'}
                      </button>
                      <button
                        onClick={() => setShowConfirm(false)}
                        className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors font-medium"
                      >
                        Hủy
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {deleteStatus && (
            <div className={`mt-4 p-4 rounded-lg ${
              deleteStatus.includes('✅') 
                ? 'bg-green-100 text-green-800 border border-green-200' 
                : 'bg-red-100 text-red-800 border border-red-200'
            }`}>
              {deleteStatus}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
