'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Bell, Palette, Shield, Globe, Save, Moon, Sun, Camera, Lock, Smartphone, Key, Trash2, RefreshCw } from 'lucide-react';
import { useAuth } from './AuthContext';
import PrivacyPolicyModal from './PrivacyPolicyModal';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import LanguageSwitcher from './LanguageSwitcher';
import * as encryption from '../lib/encryption';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const t = useTranslations();
  const { user, updateUser } = useAuth();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [settings, setSettings] = useState({
    notifications: true,
    darkMode: false,
    autoSave: true
  });
  const [profileData, setProfileData] = useState({
    name: user?.fullName || '',
    username: user?.phoneNumber || ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [avatar, setAvatar] = useState(user?.avatar || '');

  // E2EE Security State
  const [keyFingerprint, setKeyFingerprint] = useState<string>('');
  const [trustedDevices, setTrustedDevices] = useState<Array<{
    deviceId: string;
    deviceName: string;
    lastUsed: string;
    createdAt: string;
  }>>([]);
  const [hasEncryptionKey, setHasEncryptionKey] = useState(false);
  const [isGeneratingKey, setIsGeneratingKey] = useState(false);
  const [isLoadingDevices, setIsLoadingDevices] = useState(false);
  const [publicKeyBase64, setPublicKeyBase64] = useState<string>('');
  const [showImportKey, setShowImportKey] = useState(false);
  const [importKeyValue, setImportKeyValue] = useState('');
  const [importKeyError, setImportKeyError] = useState('');
  const [isDeletingKey, setIsDeletingKey] = useState(false);

  // Backup State
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [backupPassword, setBackupPassword] = useState('');
  const [confirmBackupPassword, setConfirmBackupPassword] = useState('');
  const [backupError, setBackupError] = useState('');
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);

  // Restore State
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [restorePassword, setRestorePassword] = useState('');
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [restoreError, setRestoreError] = useState('');
  const [isRestoring, setIsRestoring] = useState(false);

  // Password Prompt for Sensitive Actions (Server-side Encryption)
  const [showActionPasswordModal, setShowActionPasswordModal] = useState(false);
  const [actionPassword, setActionPassword] = useState('');
  const [pendingAction, setPendingAction] = useState<'generate' | 'import' | 'restore' | null>(null);
  const [tempKeyData, setTempKeyData] = useState<any>(null); // To hold data while waiting for password

  const currentDeviceId = typeof window !== 'undefined' ? encryption.getDeviceId() : '';

  // Load settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('appSettings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }

    // Load dark mode from localStorage
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode) {
      const isDark = JSON.parse(savedDarkMode);
      setSettings(prev => ({ ...prev, darkMode: isDark }));
      applyDarkMode(isDark);
    }
  }, []);

  // Update profile data when user changes
  useEffect(() => {
    setProfileData({
      name: user?.fullName || '',
      username: user?.phoneNumber || ''
    });
    // Only set avatar if it's a valid URL (starts with http)
    const avatarValue = user?.avatar || '';
    setAvatar(isValidImageUrl(avatarValue) ? avatarValue : '');
  }, [user]);

  // Load encryption keys and trusted devices when Security tab is opened
  useEffect(() => {
    if (activeTab === 'security' && user) {
      loadEncryptionData();
    }
  }, [activeTab, user]);

  const loadEncryptionData = async () => {
    if (!user) return;

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://ungdungnhantinbaomatniel-production.up.railway.app/api';
      const token = localStorage.getItem('token');

      // Load encryption keys
      const keysResponse = await fetch(`${apiUrl}/users/encryption-keys`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (keysResponse.ok) {
        const keysData = await keysResponse.json();
        if (keysData.publicKey) {
          setHasEncryptionKey(true);
          setPublicKeyBase64(keysData.publicKey);
          const fingerprint = await encryption.getKeyFingerprint(keysData.publicKey);
          setKeyFingerprint(fingerprint);
        } else {
          setHasEncryptionKey(false);
          setPublicKeyBase64('');
          setKeyFingerprint('');
        }
      }

      // Load trusted devices
      setIsLoadingDevices(true);
      const devicesResponse = await fetch(`${apiUrl}/auth/trusted-devices`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (devicesResponse.ok) {
        const devicesData = await devicesResponse.json();
        setTrustedDevices(devicesData.devices || []);
      }
    } catch (error) {
      console.error('Error loading encryption data:', error);
    } finally {
      setIsLoadingDevices(false);
    }
  };

  const handleGenerateKey = async () => {
    if (!user) return;

    const confirmGenerate = hasEncryptionKey
      ? confirm(t('encryption.warning'))
      : true;

    if (!confirmGenerate) return;

    // Prompt for password
    setPendingAction('generate');
    setShowActionPasswordModal(true);
  };

  const handleRemoveDevice = async (deviceId: string) => {
    if (!confirm(t('trustedDevices.confirmRemove'))) return;

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://ungdungnhantinbaomatniel-production.up.railway.app/api';
      const token = localStorage.getItem('token');

      const response = await fetch(`${apiUrl}/auth/trusted-devices/${deviceId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setTrustedDevices(prev => prev.filter(d => d.deviceId !== deviceId));
        alert(t('trustedDevices.deviceRemoved'));
      }
    } catch (error) {
      console.error('Error removing device:', error);
    }
  };

  const handleCopyKey = async () => {
    if (!publicKeyBase64) return;
    try {
      await navigator.clipboard.writeText(publicKeyBase64);
      alert(t('encryption.keyCopied'));
    } catch (error) {
      console.error('Error copying key:', error);
    }
  };

  const handleDeleteKey = async () => {
    if (!confirm(t('encryption.confirmDeleteKey'))) return;

    setIsDeletingKey(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://ungdungnhantinbaomatniel-production.up.railway.app/api';
      const token = localStorage.getItem('token');

      const response = await fetch(`${apiUrl}/users/encryption-keys`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setHasEncryptionKey(false);
        setPublicKeyBase64('');
        setKeyFingerprint('');
        alert(t('encryption.keyDeleted'));
      }
    } catch (error) {
      console.error('Error deleting key:', error);
    } finally {
      setIsDeletingKey(false);
    }
  };

  const validateKeyFormat = (key: string): boolean => {
    // Base64 format check: only valid base64 characters
    const base64Regex = /^[A-Za-z0-9+/=]+$/;
    if (!base64Regex.test(key)) return false;
    // Should be reasonable length for ECDH public key (typically 91 chars in Base64 for P-256)
    if (key.length < 50 || key.length > 200) return false;
    return true;
  };

  const handleImportKey = async () => {
    setImportKeyError('');

    if (!importKeyValue.trim()) {
      setImportKeyError(t('encryption.keyRequired'));
      return;
    }

    if (!validateKeyFormat(importKeyValue.trim())) {
      setImportKeyError(t('encryption.invalidKeyFormat'));
      return;
    }

    try {
      // Try to import the key to validate it's a valid ECDH key
      await encryption.importPublicKey(importKeyValue.trim());

      // If valid, prompt for login password to encrypt and save
      setTempKeyData(importKeyValue.trim());
      setPendingAction('import');
      setShowImportKey(false);
      setShowActionPasswordModal(true);
    } catch (error) {
      console.error('Error importing key:', error);
      setImportKeyError(t('encryption.invalidKeyFormat'));
    }
  };

  const handleConfirmAction = async () => {
    if (!actionPassword) return;

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://ungdungnhantinbaomatniel-production.up.railway.app/api';
      const token = localStorage.getItem('token');
      let body: any = {};
      let fingerprint = '';

      if (pendingAction === 'generate') {
        setIsGeneratingKey(true);
        // Generate new key pair
        const keyPair = await encryption.generateKeyPair();
        const publicKeyBase64 = await encryption.exportPublicKey(keyPair.publicKey);
        const privateKeyBase64 = await encryption.exportPrivateKey(keyPair.privateKey);
        fingerprint = await encryption.getKeyFingerprint(publicKeyBase64);

        // Encrypt Private Key with Login Password
        const encryptedData = await encryption.encryptStringWithPassword(privateKeyBase64, actionPassword);

        body = {
          publicKey: publicKeyBase64,
          encryptedPrivateKey: encryptedData.ciphertext,
          keySalt: JSON.stringify({ iv: encryptedData.iv, salt: encryptedData.salt })
        };

      } else if (pendingAction === 'import') {
        // TempKeyData is the RAW private key user imported
        const publicKey = await encryption.getPublicKeyFromPrivate(tempKeyData);
        fingerprint = await encryption.getKeyFingerprint(publicKey);

        // Encrypt Private Key
        const encryptedData = await encryption.encryptStringWithPassword(tempKeyData, actionPassword);

        body = {
          publicKey: publicKey,
          encryptedPrivateKey: encryptedData.ciphertext,
          keySalt: JSON.stringify({ iv: encryptedData.iv, salt: encryptedData.salt })
        };
      } else if (pendingAction === 'restore') {
        // TempKeyData contains { publicKey, privateKey (decrypted) }
        fingerprint = await encryption.getKeyFingerprint(tempKeyData.publicKey);

        // Encrypt Private Key
        const encryptedData = await encryption.encryptStringWithPassword(tempKeyData.privateKey, actionPassword);

        body = {
          publicKey: tempKeyData.publicKey,
          encryptedPrivateKey: encryptedData.ciphertext,
          keySalt: JSON.stringify({ iv: encryptedData.iv, salt: encryptedData.salt })
        };
      }

      if (Object.keys(body).length > 0) {
        const response = await fetch(`${apiUrl}/users/encryption-keys`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(body)
        });

        if (response.ok) {
          setHasEncryptionKey(true);
          setPublicKeyBase64(body.publicKey);
          setKeyFingerprint(fingerprint);

          if (pendingAction === 'generate') alert(t('encryption.keyGenerated'));
          else if (pendingAction === 'import') alert(t('encryption.keyImported'));
          else if (pendingAction === 'restore') alert(t('encryption.restoreSuccess'));

          setShowActionPasswordModal(false);
          setImportKeyValue('');
          setRestoreFile(null);
          setRestorePassword('');
        } else {
          alert('Error saving keys to server');
        }
      }

    } catch (error) {
      console.error('Error confirming action:', error);
      alert('Operation failed. Please check your password and try again.');
    } finally {
      setIsGeneratingKey(false);
      setIsRestoring(false);
      setActionPassword('');
      setPendingAction(null);
      setTempKeyData(null);
    }
  };

  const handleCreateBackup = async () => {
    if (!backupPassword) {
      setBackupError(t('encryption.passwordRequired'));
      return;
    }

    if (backupPassword !== confirmBackupPassword) {
      setBackupError(t('encryption.passwordMismatch'));
      return;
    }

    setIsCreatingBackup(true);
    setBackupError('');

    try {
      // 1. Fetch current keys (including private key)
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://ungdungnhantinbaomatniel-production.up.railway.app/api';
      const token = localStorage.getItem('token');

      const response = await fetch(`${apiUrl}/users/encryption-keys`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to fetch keys');

      const keysData = await response.json();
      const privateKeyRaw = keysData.encryptedPrivateKey;

      if (!privateKeyRaw) {
        throw new Error('No private key found');
      }

      // 2. Encrypt private key with backup password
      const encryptedBackup = await encryption.encryptStringWithPassword(privateKeyRaw, backupPassword);

      // 3. Create ZIP file
      const zip = new JSZip();

      // Add secure key file
      const keyFileContent = JSON.stringify({
        version: '1.0',
        created: new Date().toISOString(),
        fingerprint: keyFingerprint,
        encryption: {
          algorithm: 'AES-GCM',
          params: {
            iv: encryptedBackup.iv,
            salt: encryptedBackup.salt
          }
        },
        data: {
          publicKey: publicKeyBase64,
          encryptedPrivateKey: encryptedBackup.ciphertext
        }
      }, null, 2);

      zip.file('niel-messenger-key.json', keyFileContent);

      // Add Readme
      zip.file('README.txt', `NIEL MESSENGER BACKUP
=====================
Created: ${new Date().toLocaleString()}
Fingerprint: ${keyFingerprint}

This backup contains your End-to-End Encryption keys.
The file 'niel-messenger-key.json' is encrypted with your password.
DO NOT SHARE THIS FILE OR YOUR PASSWORD.

To restore:
1. Go to Settings > Security
2. Click 'Import Key'
3. Open 'niel-messenger-key.json'
4. Enter your backup password
`);

      // 4. Generate and download
      const blob = await zip.generateAsync({ type: 'blob' });
      saveAs(blob, `niel-backup-${new Date().toISOString().slice(0, 10)}.zip`);

      // Reset and close
      setShowBackupModal(false);
      setBackupPassword('');
      setConfirmBackupPassword('');
      alert(t('encryption.backupSuccess'));

    } catch (error) {
      console.error('Backup error:', error);
      setBackupError(t('encryption.backupError') + ': ' + (error as Error).message);
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const handleRestoreBackup = async () => {
    if (!restoreFile || !restorePassword) {
      setRestoreError(t('encryption.keyRequired'));
      return;
    }

    setIsRestoring(true);
    setRestoreError('');

    try {
      let keyData: any = null;

      // 1. Read File
      if (restoreFile.name.endsWith('.zip')) {
        const zip = await JSZip.loadAsync(restoreFile);
        const keyFile = zip.file('niel-messenger-key.json');
        if (!keyFile) throw new Error('Invalid backup file: key json not found');
        const content = await keyFile.async('string');
        keyData = JSON.parse(content);
      } else if (restoreFile.name.endsWith('.json')) {
        const content = await restoreFile.text();
        keyData = JSON.parse(content);
      } else {
        throw new Error(t('encryption.invalidBackupFile'));
      }

      // 2. Validate Format
      if (!keyData.data || !keyData.encryption || !keyData.data.encryptedPrivateKey) {
        throw new Error('Invalid key file format');
      }

      // 3. Decrypt Private Key
      const decryptedPrivateKey = await encryption.decryptStringWithPassword(
        keyData.data.encryptedPrivateKey,
        restorePassword,
        keyData.encryption.params.salt,
        keyData.encryption.params.iv
      );

      // 4. Verify Key works
      try {
        await encryption.importPrivateKey(decryptedPrivateKey);
      } catch (e) {
        throw new Error(t('encryption.wrongPassword'));
      }

      // 5. Encrypt with Login Password (new flow)
      setTempKeyData({
        publicKey: keyData.data.publicKey,
        privateKey: decryptedPrivateKey
      });
      setShowRestoreModal(false);
      setPendingAction('restore');
      setShowActionPasswordModal(true);

    } catch (error) {
      console.error('Restore error:', error);
      setRestoreError(t('encryption.restoreError') + ': ' + (error as Error).message);
      setIsRestoring(false);
    }
  };

  // Helper function to check if avatar is a valid image URL
  const isValidImageUrl = (url: string): boolean => {
    if (!url) return false;
    return url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:image');
  };

  // Helper function to normalize avatar URL - use presigned URL for B2
  const normalizeAvatarUrl = (url: string): string => {
    if (!url || !isValidImageUrl(url)) return '';

    // If it's a Backblaze B2 URL, use the presigned URL proxy
    if (url.includes('backblazeb2.com') || url.includes('backblaze.com')) {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://ungdungnhantinbaomatniel-production.up.railway.app/api';
      return `${apiUrl}/files/proxy?fileUrl=${encodeURIComponent(url)}`;
    }

    return url;
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      setAvatarLoading(true);
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
        // Update user in context
        if (updateUser && user) {
          updateUser({ ...user, avatar: data.avatar });
        }
      }
    } catch (error) {
      console.error('Avatar upload error:', error);
    } finally {
      setAvatarLoading(false);
    }
  };

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => {
      const newSettings = { ...prev, [key]: value };
      localStorage.setItem('appSettings', JSON.stringify(newSettings));

      // Handle dark mode
      if (key === 'darkMode') {
        localStorage.setItem('darkMode', JSON.stringify(value));
        applyDarkMode(value);
      }

      return newSettings;
    });
  };

  const applyDarkMode = (isDark: boolean) => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleDeleteStudyData = () => {
    if (confirm(t('settings.confirmDeleteStudyData'))) {
      try {
        // Xóa tất cả dữ liệu học tập (study progress)
        const keys = Object.keys(localStorage);
        const studyKeys = keys.filter(key =>
          key.startsWith('studyProgress_') ||
          key.startsWith('quizProgress_') ||
          key.startsWith('reviewProgress_') ||
          key.startsWith('practiceProgress_')
        );

        studyKeys.forEach(key => localStorage.removeItem(key));

        // Xóa chat history
        const chatKeys = keys.filter(key =>
          key.startsWith('chatHistory_') ||
          key.startsWith('conversation_')
        );

        chatKeys.forEach(key => localStorage.removeItem(key));

        // Xóa current lecture data
        localStorage.removeItem('currentLectureData');

        alert(t('settings.studyDataDeleted'));
      } catch (error) {
        console.error('Error deleting study data:', error);
        alert(t('settings.errorDeletingData'));
      }
    }
  };

  const handleDeleteAllData = () => {
    if (confirm(t('settings.confirmDeleteAllData'))) {
      try {
        // Lưu lại user data và settings trước khi xóa
        const userData = localStorage.getItem('user');
        const appSettings = localStorage.getItem('appSettings');
        const darkMode = localStorage.getItem('darkMode');

        // Xóa tất cả localStorage
        localStorage.clear();

        // Khôi phục user data và settings
        if (userData) localStorage.setItem('user', userData);
        if (appSettings) localStorage.setItem('appSettings', appSettings);
        if (darkMode) localStorage.setItem('darkMode', darkMode);

        alert(t('settings.allDataDeleted'));
      } catch (error) {
        console.error('Error deleting all data:', error);
        alert(t('settings.errorDeletingData'));
      }
    }
  };

  const handleProfileUpdate = () => {
    if (profileData.name.trim() && profileData.username.trim()) {
      // TODO: Implement profile update
      console.log('Profile update:', profileData);
      setIsEditing(false);
    }
  };

  const tabs = [
    { id: 'profile', name: t('settings.profile'), icon: User },
    { id: 'notifications', name: t('settings.notifications'), icon: Bell },
    { id: 'appearance', name: t('settings.appearance'), icon: Palette },
    { id: 'security', name: t('encryption.title'), icon: Lock },
    { id: 'privacy', name: t('settings.privacy'), icon: Shield },
    { id: 'language', name: t('settings.language'), icon: Globe }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
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
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{t('settings.title')}</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            <div className="flex h-[600px]">
              {/* Sidebar */}
              <div className="w-64 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-4">
                <nav className="space-y-2">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${activeTab === tab.id
                          ? 'bg-blue-500 text-white'
                          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                          }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="font-medium">{tab.name}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* Content */}
              <div className="flex-1 p-6 overflow-y-auto dark:bg-gray-900">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    {/* Profile Tab */}
                    {activeTab === 'profile' && (
                      <div>
                        <h3 className="text-xl font-semibold mb-4 dark:text-white">{t('settings.profileInfo')}</h3>
                        <div className="space-y-4">
                          <div className="flex items-center space-x-4">
                            {/* Clickable Avatar with Camera Overlay */}
                            <div
                              className="relative group cursor-pointer"
                              onClick={() => avatarInputRef.current?.click()}
                            >
                              <div className="w-20 h-20 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center overflow-hidden">
                                {avatar && isValidImageUrl(avatar) ? (
                                  <img
                                    src={normalizeAvatarUrl(avatar)}
                                    alt={user?.fullName}
                                    className="w-20 h-20 rounded-full object-cover"
                                    onError={(e) => {
                                      console.error('Avatar load error:', avatar);
                                      e.currentTarget.style.display = 'none';
                                    }}
                                  />
                                ) : (
                                  <User className="w-10 h-10 text-white" />
                                )}
                              </div>
                              {/* Camera Overlay */}
                              <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                {avatarLoading ? (
                                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <Camera className="w-6 h-6 text-white" />
                                )}
                              </div>
                              {/* Hidden file input */}
                              <input
                                type="file"
                                ref={avatarInputRef}
                                onChange={handleAvatarUpload}
                                accept="image/*"
                                className="hidden"
                              />
                            </div>
                            <div>
                              <p className="font-medium text-gray-800 dark:text-white">{user?.fullName}</p>
                              <p className="text-gray-500 dark:text-gray-400">{user?.email}</p>
                              <p className="text-xs text-blue-500 dark:text-blue-400 mt-1 cursor-pointer hover:underline" onClick={() => avatarInputRef.current?.click()}>
                                {t('profile.changeAvatar')}
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                {t('settings.displayName')}
                              </label>
                              <input
                                type="text"
                                value={profileData.name}
                                onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                                disabled={!isEditing}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:text-gray-500 dark:disabled:text-gray-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                {t('settings.username')}
                              </label>
                              <input
                                type="text"
                                value={profileData.username}
                                onChange={(e) => setProfileData(prev => ({ ...prev, username: e.target.value }))}
                                disabled={!isEditing}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:text-gray-500 dark:disabled:text-gray-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Email
                            </label>
                            <input
                              type="email"
                              value={user?.email || ''}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                              disabled
                            />
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('settings.emailCannotChange')}</p>
                          </div>

                          <div className="flex gap-3 pt-4">
                            {isEditing ? (
                              <>
                                <button
                                  onClick={handleProfileUpdate}
                                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
                                >
                                  <Save className="w-4 h-4" />
                                  {t('settings.saveChanges')}
                                </button>
                                <button
                                  onClick={() => {
                                    setIsEditing(false);
                                    setProfileData({
                                      name: user?.fullName || '',
                                      username: user?.phoneNumber || ''
                                    });
                                  }}
                                  className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                                >
                                  {t('common.cancel')}
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => setIsEditing(true)}
                                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
                              >
                                <User className="w-4 h-4" />
                                {t('settings.editProfile')}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Notifications Tab */}
                    {activeTab === 'notifications' && (
                      <div>
                        <h3 className="text-xl font-semibold mb-4 dark:text-white">{t('settings.notificationSettings')}</h3>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <div>
                              <p className="font-medium dark:text-white">{t('settings.emailNotifications')}</p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">{t('settings.emailNotificationsDesc')}</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={settings.notifications}
                                onChange={(e) => handleSettingChange('notifications', e.target.checked)}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Appearance Tab */}
                    {activeTab === 'appearance' && (
                      <div>
                        <h3 className="text-xl font-semibold mb-4 dark:text-white">{t('settings.appearanceCustomization')}</h3>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <div className="flex items-center space-x-3">
                              {settings.darkMode ? (
                                <Moon className="w-5 h-5 text-blue-500" />
                              ) : (
                                <Sun className="w-5 h-5 text-yellow-500" />
                              )}
                              <div>
                                <p className="font-medium dark:text-white">{t('settings.darkMode')}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  {settings.darkMode ? t('settings.darkModeActive') : t('settings.darkModeInactive')}
                                </p>
                              </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={settings.darkMode}
                                onChange={(e) => handleSettingChange('darkMode', e.target.checked)}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                          </div>

                          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <div>
                              <p className="font-medium dark:text-white">{t('settings.autoSave')}</p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">{t('settings.autoSaveDesc')}</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={settings.autoSave}
                                onChange={(e) => handleSettingChange('autoSave', e.target.checked)}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                          </div>

                          {/* Theme Preview */}
                          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <h4 className="font-medium mb-3 dark:text-white">{t('settings.themePreview')}</h4>
                            <div className={`p-4 rounded-lg border ${settings.darkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-800'}`}>
                              <div className="flex items-center space-x-3 mb-3">
                                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                                  <User className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                  <p className="font-medium">Nguyễn Thị Hằng</p>
                                  <p className={`text-sm ${settings.darkMode ? 'text-gray-400' : 'text-gray-500'}`}>hang@example.com</p>
                                </div>
                              </div>
                              <p className={`text-sm ${settings.darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                {t('settings.themePreviewDesc', { theme: settings.darkMode ? t('settings.dark') : t('settings.light') })}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Security/E2EE Tab */}
                    {activeTab === 'security' && (
                      <div>
                        <h3 className="text-xl font-semibold mb-4 dark:text-white">{t('encryption.title')}</h3>
                        <div className="space-y-4">
                          {/* Encryption Key Section */}
                          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <div className="flex items-center space-x-3 mb-3">
                              <Key className="w-5 h-5 text-blue-500" />
                              <h4 className="font-medium dark:text-white">{t('encryption.keyFingerprint')}</h4>
                            </div>

                            {hasEncryptionKey ? (
                              <div className="space-y-3">
                                <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/30 rounded-lg border border-green-200 dark:border-green-800">
                                  <div className="flex items-center space-x-2">
                                    <Lock className="w-4 h-4 text-green-600 dark:text-green-400" />
                                    <span className="text-green-700 dark:text-green-300 font-mono text-sm">
                                      {keyFingerprint || 'Loading...'}
                                    </span>
                                  </div>
                                </div>

                                {/* Key Action Buttons */}
                                <div className="flex flex-wrap gap-2">
                                  <button
                                    onClick={handleCopyKey}
                                    className="flex items-center space-x-2 px-3 py-2 bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-800/50 rounded-lg transition-colors text-sm"
                                  >
                                    <span>📋 {t('encryption.copyKey')}</span>
                                  </button>
                                  <button
                                    onClick={handleGenerateKey}
                                    disabled={isGeneratingKey}
                                    className="flex items-center space-x-2 px-3 py-2 text-orange-600 hover:bg-orange-50 dark:text-orange-400 dark:hover:bg-orange-900/30 rounded-lg transition-colors text-sm"
                                  >
                                    <RefreshCw className={`w-4 h-4 ${isGeneratingKey ? 'animate-spin' : ''}`} />
                                    <span>{t('encryption.regenerateKey')}</span>
                                  </button>
                                  <button
                                    onClick={handleDeleteKey}
                                    disabled={isDeletingKey}
                                    className="flex items-center space-x-2 px-3 py-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 rounded-lg transition-colors text-sm"
                                  >
                                    <Trash2 className={`w-4 h-4 ${isDeletingKey ? 'animate-pulse' : ''}`} />
                                    <span>{t('encryption.deleteKey')}</span>
                                  </button>
                                  <button
                                    onClick={() => setShowBackupModal(true)}
                                    className="flex items-center space-x-2 px-3 py-2 bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:hover:bg-purple-800/50 rounded-lg transition-colors text-sm"
                                  >
                                    <Save className="w-4 h-4" />
                                    <span>{t('encryption.backupKey')}</span>
                                  </button>
                                </div>

                                {/* Backup Modal (Inside True Block) */}
                                {showBackupModal && (
                                  <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
                                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-sm shadow-xl">
                                      <h3 className="text-lg font-bold mb-2 dark:text-white">{t('encryption.backupTitle')}</h3>
                                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                                        {t('encryption.backupDesc')}
                                      </p>

                                      <div className="space-y-3">
                                        <div>
                                          <label className="text-xs font-medium text-gray-700 dark:text-gray-300 block mb-1">
                                            {t('encryption.password')}
                                          </label>
                                          <input
                                            type="password"
                                            value={backupPassword}
                                            onChange={(e) => setBackupPassword(e.target.value)}
                                            className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                          />
                                        </div>

                                        <div>
                                          <label className="text-xs font-medium text-gray-700 dark:text-gray-300 block mb-1">
                                            {t('encryption.confirmPassword')}
                                          </label>
                                          <input
                                            type="password"
                                            value={confirmBackupPassword}
                                            onChange={(e) => setConfirmBackupPassword(e.target.value)}
                                            className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                          />
                                        </div>

                                        {backupError && (
                                          <p className="text-red-500 text-xs">{backupError}</p>
                                        )}

                                        <div className="flex gap-2 mt-4 pt-2">
                                          <button
                                            onClick={handleCreateBackup}
                                            disabled={isCreatingBackup}
                                            className="flex-1 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50"
                                          >
                                            {isCreatingBackup ? t('common.loading') : t('encryption.downloadBackup')}
                                          </button>
                                          <button
                                            onClick={() => { setShowBackupModal(false); setBackupPassword(''); setConfirmBackupPassword(''); }}
                                            className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                                          >
                                            {t('common.cancel')}
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="space-y-3">
                                <p className="text-gray-500 dark:text-gray-400 text-sm">
                                  {t('encryption.noKey')}
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  <button
                                    onClick={handleGenerateKey}
                                    disabled={isGeneratingKey}
                                    className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                                  >
                                    <Key className={`w-4 h-4 ${isGeneratingKey ? 'animate-spin' : ''}`} />
                                    <span>{isGeneratingKey ? t('common.loading') : t('encryption.generateKey')}</span>
                                  </button>
                                  <button
                                    onClick={() => setShowImportKey(true)}
                                    className="flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                  >
                                    <span>📥 {t('encryption.importKey')}</span>
                                  </button>
                                  <button
                                    onClick={() => setShowRestoreModal(true)}
                                    className="flex items-center space-x-2 px-4 py-2 bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300 dark:hover:bg-green-800/50 rounded-lg transition-colors"
                                  >
                                    <Save className="w-4 h-4" />
                                    <span>{t('encryption.restoreBackup')}</span>
                                  </button>
                                </div>

                                {/* Import Key Modal */}
                                {showImportKey && (
                                  <div className="mt-4 p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700">
                                    <h5 className="font-medium mb-2 dark:text-white">{t('encryption.importKey')}</h5>
                                    <textarea
                                      value={importKeyValue}
                                      onChange={(e) => setImportKeyValue(e.target.value)}
                                      placeholder={t('encryption.pasteKeyHere')}
                                      className="w-full p-2 border border-gray-300 dark:border-gray-500 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono text-xs h-24"
                                    />
                                    {importKeyError && (
                                      <p className="text-red-500 text-sm mt-1">{importKeyError}</p>
                                    )}
                                    <div className="flex gap-2 mt-2">
                                      <button
                                        onClick={handleImportKey}
                                        className="px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
                                      >
                                        {t('encryption.import')}
                                      </button>
                                      <button
                                        onClick={() => { setShowImportKey(false); setImportKeyValue(''); setImportKeyError(''); }}
                                        className="px-3 py-1 border border-gray-300 dark:border-gray-500 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 text-sm"
                                      >
                                        {t('common.cancel')}
                                      </button>
                                    </div>
                                  </div>
                                )}

                                {/* Restore Modal */}
                                {showRestoreModal && (
                                  <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
                                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-sm shadow-xl">
                                      <h3 className="text-lg font-bold mb-2 dark:text-white">{t('encryption.restoreBackup')}</h3>

                                      <div className="space-y-3">
                                        <div>
                                          <label className="text-xs font-medium text-gray-700 dark:text-gray-300 block mb-1">
                                            {t('encryption.selectBackupFile')}
                                          </label>
                                          <input
                                            type="file"
                                            accept=".zip,.json"
                                            onChange={(e) => setRestoreFile(e.target.files?.[0] || null)}
                                            className="w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                          />
                                        </div>

                                        <div>
                                          <label className="text-xs font-medium text-gray-700 dark:text-gray-300 block mb-1">
                                            {t('encryption.password')}
                                          </label>
                                          <input
                                            type="password"
                                            value={restorePassword}
                                            onChange={(e) => setRestorePassword(e.target.value)}
                                            className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                          />
                                        </div>

                                        {restoreError && (
                                          <p className="text-red-500 text-xs">{restoreError}</p>
                                        )}

                                        <div className="flex gap-2 mt-4 pt-2">
                                          <button
                                            onClick={handleRestoreBackup}
                                            disabled={isRestoring || !restoreFile || !restorePassword}
                                            className="flex-1 bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 disabled:opacity-50"
                                          >
                                            {isRestoring ? t('common.loading') : t('encryption.decryptAndRestore')}
                                          </button>
                                          <button
                                            onClick={() => { setShowRestoreModal(false); setRestoreFile(null); setRestorePassword(''); }}
                                            className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                                          >
                                            {t('common.cancel')}
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Trusted Devices Section */}
                          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <div className="flex items-center space-x-3 mb-3">
                              <Smartphone className="w-5 h-5 text-blue-500" />
                              <h4 className="font-medium dark:text-white">{t('trustedDevices.title')}</h4>
                            </div>

                            {isLoadingDevices ? (
                              <p className="text-gray-500 dark:text-gray-400 text-sm">{t('common.loading')}</p>
                            ) : trustedDevices.length > 0 ? (
                              <div className="space-y-2">
                                {trustedDevices.map((device) => (
                                  <div
                                    key={device.deviceId}
                                    className={`flex items-center justify-between p-3 rounded-lg border ${device.deviceId === currentDeviceId
                                      ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800'
                                      : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600'
                                      }`}
                                  >
                                    <div className="flex items-center space-x-3">
                                      <Smartphone className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                      <div>
                                        <p className="font-medium text-gray-800 dark:text-white text-sm">
                                          {device.deviceName}
                                          {device.deviceId === currentDeviceId && (
                                            <span className="ml-2 text-xs text-blue-500">({t('trustedDevices.currentDevice')})</span>
                                          )}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                          {t('trustedDevices.lastUsed')}: {new Date(device.lastUsed).toLocaleDateString()}
                                        </p>
                                      </div>
                                    </div>
                                    {device.deviceId !== currentDeviceId && (
                                      <button
                                        onClick={() => handleRemoveDevice(device.deviceId)}
                                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                        title={t('trustedDevices.remove')}
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-gray-500 dark:text-gray-400 text-sm">{t('trustedDevices.noDevices')}</p>
                            )}
                          </div>

                          {/* Warning */}
                          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                            <p className="text-yellow-700 dark:text-yellow-300 text-sm">
                              ⚠️ {t('encryption.warning')}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Privacy Tab */}
                    {activeTab === 'privacy' && (
                      <div>
                        <h3 className="text-xl font-semibold mb-4 dark:text-white">{t('settings.privacySecurity')}</h3>
                        <div className="space-y-4">
                          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <h4 className="font-medium mb-2 dark:text-white">{t('settings.dataPrivacy')}</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                              {t('settings.dataPrivacyDesc')}
                            </p>
                            <button
                              onClick={() => setShowPrivacyPolicy(true)}
                              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium transition-colors"
                            >
                              {t('settings.viewPrivacyPolicy')}
                            </button>
                          </div>
                          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <h4 className="font-medium mb-2 dark:text-white">{t('settings.deleteData')}</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                              {t('settings.deleteDataDesc')}
                            </p>
                            <div className="space-y-2">
                              <button
                                onClick={handleDeleteStudyData}
                                className="text-red-600 hover:text-red-700 text-sm font-medium mr-4"
                              >
                                {t('settings.deleteStudyData')}
                              </button>
                              <button
                                onClick={handleDeleteAllData}
                                className="text-red-600 hover:text-red-700 text-sm font-medium"
                              >
                                {t('settings.deleteAllData')}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Language Tab */}
                    {activeTab === 'language' && (
                      <div>
                        <h3 className="text-xl font-semibold mb-4 dark:text-white">{t('settings.language')}</h3>
                        <div className="space-y-4">
                          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                              {t('settings.languageDesc')}
                            </p>
                            <LanguageSwitcher variant="list" />
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>{t('settings.saveChanges')}</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Action Password Modal */}
      {showActionPasswordModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 shadow-2xl">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-sm border border-gray-200 dark:border-gray-700 shadow-2xl transform scale-100 transition-all">
            <h3 className="text-lg font-bold mb-2 dark:text-white">
              {pendingAction === 'generate' ? t('encryption.generateKey') :
                pendingAction === 'import' ? t('encryption.importKey') :
                  t('encryption.restoreBackup')}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              {t('encryption.enterLoginPassword')}
            </p>

            <div className="space-y-3">
              <input
                type="password"
                value={actionPassword}
                onChange={(e) => setActionPassword(e.target.value)}
                className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                placeholder={t('encryption.password')}
                autoFocus
              />

              <div className="flex gap-2 mt-4 pt-2">
                <button
                  onClick={handleConfirmAction}
                  disabled={!actionPassword}
                  className="flex-1 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 font-medium"
                >
                  {t('common.confirm')}
                </button>
                <button
                  onClick={() => {
                    setShowActionPasswordModal(false);
                    setActionPassword('');
                    setPendingAction(null);
                    setTempKeyData(null);
                    setIsGeneratingKey(false);
                    setIsRestoring(false);
                  }}
                  className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  {t('common.cancel')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Privacy Policy Modal */}
      <PrivacyPolicyModal
        isOpen={showPrivacyPolicy}
        onClose={() => setShowPrivacyPolicy(false)}
      />
    </AnimatePresence>
  );
};

export default SettingsModal;
