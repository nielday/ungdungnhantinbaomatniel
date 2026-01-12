'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
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
  const t = useTranslations();
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
        setError(t('profile.uploadAvatarFailed'));
      }
    } catch (error) {
      setError(t('profile.uploadAvatarError'));
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

        const updatedUser = responseData.user || responseData;
        console.log('ProfileModal - Extracted user:', updatedUser);
        console.log('ProfileModal - Updated user keys:', Object.keys(updatedUser));

        if (!updatedUser.id && !updatedUser._id) {
          console.error('ProfileModal - Missing id/_id in updatedUser');
          setError(t('profile.invalidUserData'));
          return;
        }

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
            setError(t('profile.userUpdateError'));
            return;
          }
        }

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
        setError(t('profile.updateFailed'));
      }
    } catch (error) {
      console.error('ProfileModal - Save error:', error);
      setError(t('profile.updateError'));
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
        setError(t('common.error'));
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
        throw new Error(errorData.message || t('auth.resendFailed'));
      }

      setOtpSent(true);
    } catch (err: any) {
      console.error('Error sending verification OTP:', err);
      setError(err.message || t('auth.resendFailed'));
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
        setError(t('common.error'));
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
        throw new Error(errorData.message || t('auth.verifyFailed'));
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
      setError(err.message || t('auth.verifyFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-lg shadow-2xl w-full max-w-sm mx-4 max-h-[90vh] overflow-y-auto"
      >
        <div className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">{t('profile.title')}</h2>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-gray-600" />
            </button>
          </div>

          {/* Avatar Section */}
          <div className="text-center mb-4">
            <div className="relative inline-block">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-2">
                {avatar ? (
                  <img
                    src={avatar}
                    alt={user?.fullName}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <User className="w-8 h-8 text-white" />
                )}
              </div>
              <label className="absolute bottom-0 right-0 bg-blue-500 text-white p-1.5 rounded-full cursor-pointer hover:bg-blue-600 transition-colors">
                <Camera className="w-3 h-3" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </label>
            </div>
            <p className="text-xs text-gray-500">{t('profile.changeAvatar')}</p>
          </div>

          {/* Form */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                {t('profile.fullName')}
              </label>
              <div className="relative">
                <User className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={t('profile.fullNamePlaceholder')}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                {t('profile.age')}
              </label>
              <div className="relative">
                <User className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleInputChange}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={t('profile.agePlaceholder')}
                  min="1"
                  max="120"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                {t('profile.phoneNumber')}
              </label>
              <div className="relative">
                <Phone className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="tel"
                  value={user?.phoneNumber || ''}
                  disabled
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-100 text-gray-500"
                />
              </div>
              <p className="text-xs text-gray-500 mt-0.5">{t('profile.phoneNumberCannotChange')}</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                {t('profile.email')}
              </label>
              <div className="relative">
                <Mail className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-100 text-gray-500"
                />
              </div>
              <p className="text-xs text-gray-500 mt-0.5">{t('profile.emailCannotChange')}</p>
            </div>

            {/* Account Verification Status */}
            <div className="border-t pt-3 mt-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-1.5">
                  <Shield className="w-4 h-4 text-gray-600" />
                  <span className="text-xs font-medium text-gray-700">{t('auth.accountStatus')}</span>
                </div>
                {user?.isVerified ? (
                  <div className="flex items-center space-x-1 text-green-600">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span className="text-xs font-medium">{t('auth.verified')}</span>
                  </div>
                ) : (
                  <span className="text-xs text-orange-600 font-medium">{t('auth.notVerified')}</span>
                )}
              </div>

              {!user?.isVerified && (
                <div className="space-y-2">
                  {!otpSent ? (
                    <button
                      onClick={handleSendVerificationOTP}
                      disabled={verifying}
                      className="w-full bg-blue-500 text-white py-1.5 px-3 text-xs rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-1.5"
                    >
                      {verifying ? (
                        <>
                          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>{t('auth.sendingOtp')}</span>
                        </>
                      ) : (
                        <>
                          <Shield className="w-3 h-3" />
                          <span>{t('auth.sendVerificationCode')}</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <div className="text-xs text-gray-600 bg-blue-50 p-2 rounded-lg">
                        <p>{t('auth.otpSentToEmail')} <strong>{user?.email}</strong></p>
                        <p className="text-xs text-gray-500 mt-0.5">{t('auth.checkEmailForOtp')}</p>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          {t('auth.verificationCode')}
                        </label>
                        <input
                          type="text"
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder={t('auth.otpPlaceholder')}
                          maxLength={6}
                        />
                      </div>

                      <div className="flex space-x-2">
                        <button
                          onClick={handleVerifyAccount}
                          disabled={loading || !otpCode.trim()}
                          className="flex-1 bg-green-500 text-white py-1.5 px-3 text-xs rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-1.5"
                        >
                          {loading ? (
                            <>
                              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              <span>{t('auth.verifying')}</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-3 h-3" />
                              <span>{t('auth.verify')}</span>
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => {
                            setOtpSent(false);
                            setOtpCode('');
                          }}
                          className="px-3 py-1.5 text-xs text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          {t('common.cancel')}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-lg text-xs mt-3">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-2 mt-4">
            <button
              onClick={onClose}
              className="flex-1 px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex-1 px-3 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-1.5"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white"></div>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>{t('common.save')}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
