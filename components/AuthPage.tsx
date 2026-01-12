'use client';

import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { User, Mail, Phone, Eye, EyeOff, ArrowLeft } from 'lucide-react';

export default function AuthPage() {
  const t = useTranslations();
  const [step, setStep] = useState<'login' | 'register' | 'verify'>('login');
  const [formData, setFormData] = useState({
    phoneNumber: '',
    email: '',
    fullName: '',
    age: '',
    otpCode: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string>('');

  const { login, verifyLogin, register, verifyRegister, resendOtp } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await login(formData.phoneNumber);
      if (result.success) {
        // Store userId for OTP verification
        setUserId(result.userId);
        setStep('verify');
      }
    } catch (err: any) {
      setError(err.message || t('auth.loginFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await register(
        formData.phoneNumber,
        formData.email,
        formData.fullName,
        parseInt(formData.age)
      );
      if (result.success) {
        // Store userId for OTP verification
        setUserId(result.userId);
        setStep('verify');
      }
    } catch (err: any) {
      setError(err.message || t('auth.registerFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (step === 'verify') {
        // Determine if this is login or register verification
        const isLoginVerification = !formData.email; // If no email, it's login
        if (isLoginVerification) {
          await verifyLogin(userId, formData.otpCode);
        } else {
          await verifyRegister(userId, formData.otpCode);
        }
      }
    } catch (err: any) {
      setError(err.message || t('auth.verifyFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError('');
    setIsLoading(true);

    try {
      await resendOtp(userId);
      setError('');
    } catch (err: any) {
      setError(err.message || t('auth.resendFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const resetForm = () => {
    setFormData({
      phoneNumber: '',
      email: '',
      fullName: '',
      age: '',
      otpCode: ''
    });
    setError('');
    setUserId('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
      >
        <div className="p-8">
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <User className="w-8 h-8 text-white" />
            </motion.div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              {step === 'login' && t('auth.login')}
              {step === 'register' && t('auth.register')}
              {step === 'verify' && t('auth.verifyOtp')}
            </h1>
            <p className="text-gray-600">
              {step === 'login' && t('auth.loginSubtitle')}
              {step === 'register' && t('auth.registerSubtitle')}
              {step === 'verify' && t('auth.verifySubtitle')}
            </p>
          </div>

          {step === 'verify' && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={() => {
                setStep(formData.email ? 'register' : 'login');
                resetForm();
              }}
              className="mb-4 flex items-center text-blue-600 hover:text-blue-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('common.back')}
            </motion.button>
          )}

          <form onSubmit={step === 'login' ? handleLogin : step === 'register' ? handleRegister : handleVerify} className="space-y-6">
            {step === 'login' && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('auth.phoneNumber')}
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder={t('auth.phonePlaceholder')}
                    required
                  />
                </div>
              </motion.div>
            )}

            {step === 'register' && (
              <>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('auth.phoneNumber')}
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="tel"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder={t('auth.phonePlaceholder')}
                      required
                    />
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('auth.email')}
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder={t('auth.emailPlaceholder')}
                      required
                    />
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('auth.fullName')}
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder={t('auth.fullNamePlaceholder')}
                      required
                    />
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('auth.age')}
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="number"
                      name="age"
                      value={formData.age}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder={t('auth.agePlaceholder')}
                      min="1"
                      max="120"
                      required
                    />
                  </div>
                </motion.div>
              </>
            )}

            {step === 'verify' && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('auth.otpCode')}
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    name="otpCode"
                    value={formData.otpCode}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder={t('auth.otpPlaceholder')}
                    maxLength={6}
                    required
                  />
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  {t('auth.otpSent')}
                </p>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={isLoading}
                  className="text-blue-600 hover:text-blue-700 text-sm mt-2 disabled:opacity-50"
                >
                  {t('auth.resendOtp')}
                </button>
              </motion.div>
            )}

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm"
              >
                {error}
              </motion.div>
            )}

            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 focus:ring-4 focus:ring-blue-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? t('auth.processing') :
                step === 'login' ? t('auth.login') :
                  step === 'register' ? t('auth.register') : t('auth.verify')}
            </motion.button>
          </form>

          {step !== 'verify' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-6 text-center"
            >
              <button
                onClick={() => {
                  setStep(step === 'login' ? 'register' : 'login');
                  resetForm();
                }}
                className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                {step === 'login' ? t('auth.noAccount') : t('auth.hasAccount')}
              </button>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}