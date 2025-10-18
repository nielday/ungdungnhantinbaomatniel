'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, User, Phone, Mail, Camera, Save, Shield, CheckCircle } from 'lucide-react';

interface User {
  id: string;
  phoneNumber: string;
  email: string;
  fullName: string;
  age: number;
  avatar?: string;
  isVerified?: boolean;
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
  const [verifying, setVerifying] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');

  // Update avatar when user changes
  useEffect(() => {
    console.log('ProfileModal - User changed, updating avatar:', user?.avatar);
    setAvatar(user?.avatar || '');
  }, [user?.avatar]);

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

  const handleSendVerificationOTP = async () => {
    setVerifying(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Không tìm thấy token xác thực');
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'https://ungdungnhantinbaomatniel-production.up.railway.app/api'}/users/send-verification-otp`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Gửi OTP thất bại');
      }

      setOtpSent(true);
    } catch (err: any) {
      console.error('Error sending verification OTP:', err);
      setError(err.message || 'Gửi OTP thất bại');
    } finally {
      setVerifying(false);
    }
  };

  const handleVerifyAccount = async () => {
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Không tìm thấy token xác thực');
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'https://ungdungnhantinbaomatniel-production.up.railway.app/api'}/users/verify-account`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            otpCode: otpCode
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Xác thực thất bại');
      }

      const updatedUser = await response.json();
      console.log('Account verified successfully:', updatedUser);
      
      if (onUserUpdate) {
        onUserUpdate(updatedUser.user || updatedUser);
      }
      
      setOtpSent(false);
      setOtpCode('');
    } catch (err: any) {
      console.error('Error verifying account:', err);
      setError(err.message || 'Xác thực thất bại');
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

            {/* Account Verification Status */}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Shield className="w-5 h-5 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">Trạng thái tài khoản</span>
                </div>
                {user?.isVerified ? (
                  <div className="flex items-center space-x-1 text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">Đã xác thực</span>
                  </div>
                ) : (
                  <span className="text-sm text-orange-600 font-medium">Chưa xác thực</span>
                )}
              </div>

              {!user?.isVerified && (
                <div className="space-y-3">
                  {!otpSent ? (
                    <button
                      onClick={handleSendVerificationOTP}
                      disabled={verifying}
                      className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                    >
                      {verifying ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Đang gửi...</span>
                        </>
                      ) : (
                        <>
                          <Shield className="w-4 h-4" />
                          <span>Gửi mã xác thực</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="space-y-3">
                      <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                        <p>Mã OTP đã được gửi đến email <strong>{user?.email}</strong></p>
                        <p className="text-xs text-gray-500 mt-1">Vui lòng kiểm tra hộp thư và nhập mã xác thực</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Mã xác thực (OTP)
                        </label>
                        <input
                          type="text"
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Nhập mã OTP 6 chữ số"
                          maxLength={6}
                        />
                      </div>
                      
                      <div className="flex space-x-2">
                        <button
                          onClick={handleVerifyAccount}
                          disabled={loading || !otpCode.trim()}
                          className="flex-1 bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                        >
                          {loading ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              <span>Đang xác thực...</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4" />
                              <span>Xác thực</span>
                            </>
                          )}
                        </button>
                        
                        <button
                          onClick={() => {
                            setOtpSent(false);
                            setOtpCode('');
                          }}
                          className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          Hủy
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
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
