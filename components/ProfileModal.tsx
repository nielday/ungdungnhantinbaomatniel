'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, User, Phone, Mail, Camera, Save } from 'lucide-react';

interface User {
  id: string;
  phoneNumber: string;
  email: string;
  fullName: string;
  age: number;
  avatar?: string;
}

interface ProfileModalProps {
  user: User | null;
  onClose: () => void;
  onUpdateProfile: () => void;
  onUserUpdate?: (updatedUser: User) => void;
}

export default function ProfileModal({ user, onClose, onUpdateProfile, onUserUpdate }: ProfileModalProps) {
  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    age: user?.age || 0
  });
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'https://ungdungnhantinbaomatniel-production.up.railway.app/api'}/users/avatar`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        }
      );

      if (response.ok) {
        const data = await response.json();
        setAvatar(data.avatar);
        onUpdateProfile();
      } else {
        setError('Không thể cập nhật ảnh đại diện');
      }
    } catch (error) {
      setError('Lỗi khi tải lên ảnh');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      console.log('ProfileModal - Saving profile:', formData);
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('token');
      console.log('ProfileModal - Token:', token ? 'Present' : 'Missing');
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'https://ungdungnhantinbaomatniel-production.up.railway.app/api'}/users/profile`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(formData)
        }
      );

      console.log('ProfileModal - Response status:', response.status);
      
      if (response.ok) {
        const responseData = await response.json();
        console.log('ProfileModal - Response data from API:', responseData);
        
        // Extract user from response
        const updatedUser = responseData.user || responseData;
        console.log('ProfileModal - Extracted user:', updatedUser);
        console.log('ProfileModal - Updated user keys:', Object.keys(updatedUser));
        
        // Validate updatedUser structure
        if (!updatedUser.id && !updatedUser._id) {
          console.error('ProfileModal - Missing id/_id in updatedUser');
          setError('Dữ liệu người dùng không hợp lệ');
          return;
        }
        
        // Update user state in AuthContext first
        if (onUserUpdate) {
          const userId = updatedUser._id || updatedUser.id;
          console.log('ProfileModal - Calling onUserUpdate with:', {
            id: userId,
            phoneNumber: updatedUser.phoneNumber,
            email: updatedUser.email,
            fullName: updatedUser.fullName,
            age: updatedUser.age,
            avatar: updatedUser.avatar
          });
          
          try {
            onUserUpdate({
              id: userId,
              phoneNumber: updatedUser.phoneNumber,
              email: updatedUser.email,
              fullName: updatedUser.fullName,
              age: updatedUser.age,
              avatar: updatedUser.avatar
            });
            console.log('ProfileModal - onUserUpdate called successfully');
          } catch (error) {
            console.error('ProfileModal - Error in onUserUpdate:', error);
            setError('Lỗi khi cập nhật thông tin người dùng');
            return;
          }
        }
        
        // Then update conversations and close modal
        console.log('ProfileModal - Setting timeout for onUpdateProfile and onClose');
        setTimeout(() => {
          console.log('ProfileModal - Executing timeout callback');
          try {
            onUpdateProfile();
            console.log('ProfileModal - onUpdateProfile called successfully');
          } catch (error) {
            console.error('ProfileModal - Error in onUpdateProfile:', error);
          }
          
          try {
            onClose();
            console.log('ProfileModal - onClose called successfully');
          } catch (error) {
            console.error('ProfileModal - Error in onClose:', error);
          }
        }, 100);
      } else {
        const errorData = await response.json();
        console.error('ProfileModal - Error response:', errorData);
        setError('Không thể cập nhật thông tin');
      }
    } catch (error) {
      console.error('ProfileModal - Save error:', error);
      setError('Lỗi khi cập nhật thông tin');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4"
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-800">Thông tin cá nhân</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Avatar Section */}
          <div className="text-center mb-6">
            <div className="relative inline-block">
              <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                {avatar ? (
                  <img 
                    src={avatar} 
                    alt={user?.fullName}
                    className="w-24 h-24 rounded-full object-cover"
                  />
                ) : (
                  <User className="w-12 h-12 text-white" />
                )}
              </div>
              <label className="absolute bottom-0 right-0 bg-blue-500 text-white p-2 rounded-full cursor-pointer hover:bg-blue-600 transition-colors">
                <Camera className="w-4 h-4" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </label>
            </div>
            <p className="text-sm text-gray-500">Nhấn để thay đổi ảnh đại diện</p>
          </div>

          {/* Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Họ và tên
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nhập họ và tên"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tuổi
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nhập tuổi"
                  min="1"
                  max="120"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Số điện thoại
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="tel"
                  value={user?.phoneNumber || ''}
                  disabled
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-500"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Số điện thoại không thể thay đổi</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-500"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Email không thể thay đổi</p>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-3 mt-6">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Hủy
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex-1 px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Lưu</span>
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
