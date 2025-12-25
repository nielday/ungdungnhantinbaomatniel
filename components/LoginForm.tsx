'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Phone, LogIn } from 'lucide-react';
import { useAuth } from './AuthContext';
import { useTranslations } from 'next-intl';

interface LoginFormProps {
  onSwitchToRegister: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSwitchToRegister }) => {
  const t = useTranslations()
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState('');
  const { login, loading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!phoneNumber) {
      setError(t('auth.pleaseFillAllFields'));
      return;
    }

    try {
      await login(phoneNumber);
    } catch (err: any) {
      // Kiểm tra nếu là lỗi số điện thoại không tồn tại
      const errorMessage = err?.message || err?.toString() || '';
      if (errorMessage.includes('không tồn tại') || errorMessage.includes('not found')) {
        setError('Số điện thoại này chưa được đăng ký. Vui lòng đăng ký tài khoản mới để sử dụng dịch vụ của chúng tôi.');
      } else {
        setError(t('auth.invalidCredentials'));
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="w-full max-w-md"
    >
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <LogIn className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">{t('auth.welcome')}</h2>
          <p className="text-gray-600">{t('auth.loginToContinue')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm"
            >
              <p className="font-medium">{error}</p>
              {error.includes('chưa được đăng ký') && (
                <p className="mt-2 text-xs">
                  💡 Bạn có thể đăng ký tài khoản mới bằng cách nhấn vào link "Đăng ký ngay" bên dưới.
                </p>
              )}
            </motion.div>
          )}

          {/* Info box - Hướng dẫn cho người dùng mới */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-blue-50 border border-blue-200 rounded-lg p-4"
          >
            <div className="flex items-start gap-3">
              <div className="text-blue-600 text-xl">ℹ️</div>
              <div className="flex-1 text-sm text-blue-800">
                <p className="font-medium mb-1">Chào mừng đến với Ứng dụng Nhắn tin!</p>
                <p className="text-blue-700">
                  Nếu bạn chưa có tài khoản, vui lòng <button 
                    type="button"
                    onClick={onSwitchToRegister}
                    className="underline font-medium hover:text-blue-900"
                  >đăng ký ngay</button> để bắt đầu sử dụng dịch vụ nhắn tin bảo mật của chúng tôi.
                </p>
              </div>
            </div>
          </motion.div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Số điện thoại
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="Nhập số điện thoại"
                required
              />
            </div>
          </div>

          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                {t('common.loading')}
              </>
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                {t('auth.login')}
              </>
            )}
          </motion.button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            {t('auth.noAccount')}{' '}
            <button
              onClick={onSwitchToRegister}
              className="text-blue-600 hover:text-blue-700 font-medium hover:underline"
            >
              {t('auth.signUp')}
            </button>
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default LoginForm;
