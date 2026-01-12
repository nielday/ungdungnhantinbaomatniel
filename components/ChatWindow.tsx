'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useSocket } from './SocketContext';
import { useTranslations } from 'next-intl';
import SimpleEmojiPicker from './SimpleEmojiPicker';
import CameraCapture from './CameraCapture';
import * as encryption from '../lib/encryption';

// Helper function to normalize file URLs (used by AudioPlayer)
const normalizeFileUrlHelper = (fileUrl: string): string => {
  if (!fileUrl) return '';

  // If it's a Backblaze B2 URL, use the presigned URL proxy
  if (fileUrl.includes('backblazeb2.com') || fileUrl.includes('backblaze.com')) {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://ungdungnhantinbaomatniel-production.up.railway.app/api';
    return `${apiUrl}/files/proxy?fileUrl=${encodeURIComponent(fileUrl)}`;
  }

  if (fileUrl.startsWith('http')) {
    if (fileUrl.includes('railway.app/uploads/')) {
      const uploadsPath = fileUrl.split('/uploads/')[1];
      return `/uploads/${uploadsPath}`;
    }
    return fileUrl;
  }

  return fileUrl.startsWith('/') ? fileUrl : `/${fileUrl}`;
};

// Audio Player Component
const AudioPlayer = ({ fileUrl, fileName }: { fileUrl: string; fileName: string }) => {
  const [duration, setDuration] = useState<number>(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const normalizedUrl = normalizeFileUrlHelper(fileUrl);

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
      setIsLoaded(true);
      console.log('Audio duration loaded:', audioRef.current.duration);
    }
  };

  const handleError = () => {
    console.error('Audio load error for:', fileName, 'URL:', normalizedUrl);
    setIsLoaded(false);
  };

  return (
    <div className="flex items-center space-x-2 p-2 bg-gray-100 rounded">
      <audio
        ref={audioRef}
        controls
        className="flex-1"
        preload="metadata"
        onLoadedMetadata={handleLoadedMetadata}
        onError={handleError}
      >
        <source
          src={normalizedUrl}
          type="audio/mpeg"
        />
        <source
          src={normalizedUrl}
          type="audio/wav"
        />
        <source
          src={normalizedUrl}
          type="audio/ogg"
        />
        Your browser does not support audio.
      </audio>
      {isLoaded && (
        <div className="text-xs text-gray-500">
          {Math.floor(duration / 60)}:{(duration % 60).toFixed(0).padStart(2, '0')}
        </div>
      )}
    </div>
  );
};

// Encrypted Message Content Component
interface EncryptedMessageProps {
  message: {
    _id: string;
    content: string;
    isEncrypted?: boolean;
    encryptionData?: { iv: string; algorithm: string };
    senderId: { _id: string; fullName: string };
  };
  decryptedMessages: Record<string, string>;
  decryptMessageContent: (message: any) => Promise<string>;
}

const EncryptedMessageContent: React.FC<EncryptedMessageProps> = ({
  message,
  decryptedMessages,
  decryptMessageContent
}) => {
  const [displayContent, setDisplayContent] = React.useState<string>(
    message.isEncrypted ? '🔒 Đang giải mã...' : message.content
  );

  React.useEffect(() => {
    if (message.isEncrypted) {
      // Check cache first
      if (decryptedMessages[message._id]) {
        setDisplayContent(decryptedMessages[message._id]);
      } else {
        // Decrypt the message
        decryptMessageContent(message).then(setDisplayContent);
      }
    } else {
      setDisplayContent(message.content);
    }
  }, [message, decryptedMessages, decryptMessageContent]);

  return <span>{displayContent}</span>;
};
import {
  Send,
  Paperclip,
  Smile,
  Phone,
  Video,
  MoreVertical,
  Image,
  File,
  Mic,
  X,
  Download,
  Play,
  Pause,
  ArrowLeft,
  Users,
  Trash2,
  Camera,
  Lock,
  Unlock
} from 'lucide-react';

interface Message {
  _id: string;
  senderId: {
    _id: string;
    fullName: string;
    avatar?: string;
  };
  content: string;
  messageType: 'text' | 'image' | 'file' | 'audio';
  attachments?: {
    fileName: string;
    fileUrl: string;
    fileSize: number;
    mimeType: string;
  }[];
  replyTo?: Message;
  isEdited: boolean;
  editedAt?: string;
  isDeleted: boolean;
  readBy: {
    userId: string;
    readAt: string;
  }[];
  createdAt: string;
  // E2EE fields
  isEncrypted?: boolean;
  encryptionData?: {
    iv: string;
    algorithm: string;
  };
}

interface Conversation {
  _id: string;
  type: 'private' | 'group';
  participants?: any[]; // Made optional to handle undefined cases
  name?: string; // Changed from groupName
  avatar?: string; // Changed from groupAvatar
  lastMessage?: any;
  lastMessageAt?: string;
  createdBy: any;
  encryptionMode?: 'none' | 'e2ee'; // E2EE support
}

interface ChatWindowProps {
  conversation: Conversation;
  currentUser: any;
  onUpdateConversations: () => void;
  onShowGroupManagement?: () => void;
}

export default function ChatWindow({ conversation, currentUser, onUpdateConversations, onShowGroupManagement }: ChatWindowProps) {
  const t = useTranslations();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showFilePicker, setShowFilePicker] = useState(false);
  const [showCameraCapture, setShowCameraCapture] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [showMessageMenu, setShowMessageMenu] = useState<string | null>(null);
  const [encryptionMode, setEncryptionMode] = useState<'none' | 'e2ee'>(conversation.encryptionMode || 'none');
  const [isTogglingEncryption, setIsTogglingEncryption] = useState(false);
  const [decryptedMessages, setDecryptedMessages] = useState<Record<string, string>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { socket } = useSocket();

  useEffect(() => {
    fetchMessages();
  }, [conversation._id]);

  // Close message menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showMessageMenu && !(event.target as Element).closest('.message-menu')) {
        setShowMessageMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMessageMenu]);

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Clear typing indicator when conversation changes
  useEffect(() => {
    clearTypingIndicator();
    setIsTyping(false);
  }, [conversation._id]);

  // Socket.io event listeners
  useEffect(() => {
    if (!socket) return;

    // Join conversation room
    socket.emit('join-conversation', conversation._id);

    // Listen for new messages
    const handleNewMessage = (message: Message) => {
      setMessages(prev => [...prev, message]);
      onUpdateConversations();
    };

    // Listen for typing indicators
    const handleTyping = (data: { userId: string; isTyping: boolean }) => {
      if (data.userId !== currentUser?.id) {
        setIsTyping(data.isTyping);
      }
    };

    socket.on('new-message', handleNewMessage);
    socket.on('user-typing', handleTyping);

    const handleMessageDeleted = (data: any) => {
      console.log('Message deleted event:', data);
      setMessages(prev => prev.map(msg =>
        msg._id === data.messageId
          ? { ...msg, isDeleted: true, content: t('chat.messageDeleted'), attachments: [] }
          : msg
      ));
    };

    socket.on('message-deleted', handleMessageDeleted);

    return () => {
      socket.emit('leave-conversation', conversation._id);
      socket.off('new-message', handleNewMessage);
      socket.off('user-typing', handleTyping);
      socket.off('message-deleted', handleMessageDeleted);

      // Clear typing indicator when leaving conversation
      clearTypingIndicator();
    };
  }, [socket, conversation._id, currentUser?.id, onUpdateConversations]);

  const fetchMessages = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `https://ungdungnhantinbaomatniel-production.up.railway.app/api/messages/${conversation._id}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleEncryption = async () => {
    setIsTogglingEncryption(true);
    try {
      const token = localStorage.getItem('token');
      const newMode = encryptionMode === 'e2ee' ? 'none' : 'e2ee';

      const response = await fetch(
        `https://ungdungnhantinbaomatniel-production.up.railway.app/api/conversations/${conversation._id}/encryption-mode`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ encryptionMode: newMode })
        }
      );

      if (response.ok) {
        setEncryptionMode(newMode);
        onUpdateConversations();
      }
    } catch (error) {
      console.error('Error toggling encryption:', error);
    } finally {
      setIsTogglingEncryption(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Decrypt an encrypted message
  const decryptMessageContent = async (message: Message): Promise<string> => {
    // Return cached decrypted content if available
    if (decryptedMessages[message._id]) {
      return decryptedMessages[message._id];
    }

    if (!message.isEncrypted || !message.encryptionData?.iv) {
      return message.content;
    }

    try {
      const token = localStorage.getItem('token');

      // Get sender's public key
      const senderKeyResponse = await fetch(
        `https://ungdungnhantinbaomatniel-production.up.railway.app/api/users/${message.senderId._id}/public-key`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (!senderKeyResponse.ok) {
        return `🔒 ${t('encryption.decryptFailed')}`;
      }

      const senderKeyData = await senderKeyResponse.json();

      // Get my private key
      const myKeysResponse = await fetch(
        `https://ungdungnhantinbaomatniel-production.up.railway.app/api/users/encryption-keys`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (!myKeysResponse.ok) {
        return `🔒 ${t('encryption.decryptFailed')}`;
      }

      const myKeysData = await myKeysResponse.json();

      if (!senderKeyData.publicKey || !myKeysData.encryptedPrivateKey) {
        return `🔒 ${t('encryption.decryptFailed')}`;
      }

      // Import keys and derive shared secret
      const senderPublicKey = await encryption.importPublicKey(senderKeyData.publicKey);
      const myPrivateKey = await encryption.importPrivateKey(myKeysData.encryptedPrivateKey);
      const sharedKey = await encryption.deriveSharedKey(myPrivateKey, senderPublicKey);

      // Decrypt the message
      const decrypted = await encryption.decryptMessage(
        message.content,
        message.encryptionData.iv,
        sharedKey
      );

      // Cache the decrypted content
      setDecryptedMessages(prev => ({ ...prev, [message._id]: decrypted }));

      return decrypted;
    } catch (error) {
      console.error('Decryption error:', error);
      return `🔒 ${t('encryption.decryptFailed')}`;
    }
  };

  const sendMessage = async (content: string, messageType: 'text' = 'text', attachments?: any[]) => {
    if (!content.trim() && !attachments?.length) return;

    try {
      const token = localStorage.getItem('token');
      let messageContent = content;
      let encryptionData = null;

      // If E2EE is enabled, encrypt the message
      if (encryptionMode === 'e2ee' && messageType === 'text') {
        try {
          // Get recipient's public key
          const otherUser = conversation.participants?.find(p => p._id !== currentUser?.id);
          if (otherUser?._id) {
            const keyResponse = await fetch(
              `https://ungdungnhantinbaomatniel-production.up.railway.app/api/users/${otherUser._id}/public-key`,
              { headers: { 'Authorization': `Bearer ${token}` } }
            );

            if (keyResponse.ok) {
              const keyData = await keyResponse.json();
              if (keyData.publicKey) {
                // Get my private key
                const myKeysResponse = await fetch(
                  `https://ungdungnhantinbaomatniel-production.up.railway.app/api/users/encryption-keys`,
                  { headers: { 'Authorization': `Bearer ${token}` } }
                );

                if (myKeysResponse.ok) {
                  const myKeysData = await myKeysResponse.json();
                  if (myKeysData.encryptedPrivateKey) {
                    // Import keys and derive shared secret
                    const recipientPublicKey = await encryption.importPublicKey(keyData.publicKey);
                    const myPrivateKey = await encryption.importPrivateKey(myKeysData.encryptedPrivateKey);
                    const sharedKey = await encryption.deriveSharedKey(myPrivateKey, recipientPublicKey);

                    // Encrypt the message
                    const encrypted = await encryption.encryptMessage(content, sharedKey);
                    messageContent = encrypted.ciphertext;
                    encryptionData = { iv: encrypted.iv, algorithm: 'AES-256-GCM' };
                  }
                }
              }
            }
          }
        } catch (encError) {
          console.error('Encryption error, sending plaintext:', encError);
          // Fall back to plaintext if encryption fails
        }
      }

      const response = await fetch(
        `https://ungdungnhantinbaomatniel-production.up.railway.app/api/messages/${conversation._id}/${messageType}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            content: messageContent,
            replyTo: replyingTo?._id,
            isEncrypted: encryptionData !== null,
            encryptionData: encryptionData
          })
        }
      );

      if (response.ok) {
        const newMsg = await response.json();
        // Don't add message here - Socket.io will handle it
        setNewMessage('');
        setReplyingTo(null);
        onUpdateConversations();
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(newMessage);
  };

  // Clear typing indicator
  const clearTypingIndicator = () => {
    if (socket && currentUser?.id) {
      socket.emit('typing', {
        conversationId: conversation._id,
        userId: currentUser.id,
        isTyping: false
      });
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  };

  // Handle typing indicator with debounce
  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);

    if (socket) {
      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      if (e.target.value.trim()) {
        socket.emit('typing', {
          conversationId: conversation._id,
          userId: currentUser?.id,
          isTyping: true
        });

        // Set timeout to stop typing indicator after 2 seconds of no typing
        typingTimeoutRef.current = setTimeout(() => {
          clearTypingIndicator();
        }, 2000);
      } else {
        clearTypingIndicator();
      }
    }
  };

  // Handle input blur - clear typing when user leaves input
  const handleInputBlur = () => {
    clearTypingIndicator();
  };

  const handleFileUpload = async (files: FileList) => {
    const formData = new FormData();
    Array.from(files).forEach(file => {
      formData.append('files', file);
    });

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `https://ungdungnhantinbaomatniel-production.up.railway.app/api/messages/${conversation._id}/file`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        }
      );

      if (response.ok) {
        const newMsg = await response.json();
        // Don't add message here - Socket.io will handle it
        onUpdateConversations();
      }
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  const handleAudioUpload = async (files: FileList) => {
    const formData = new FormData();
    Array.from(files).forEach(file => {
      formData.append('files', file);
    });

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `https://ungdungnhantinbaomatniel-production.up.railway.app/api/messages/${conversation._id}/file`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        }
      );

      if (response.ok) {
        const newMsg = await response.json();
        // Don't add message here - Socket.io will handle it
        onUpdateConversations();
      }
    } catch (error) {
      console.error('Error uploading audio:', error);
    }
  };

  // Handle camera capture
  const handleCameraCapture = async (imageBlob: Blob) => {
    try {
      console.log('Handling camera capture, blob size:', imageBlob.size, 'type:', imageBlob.type);

      const formData = new FormData();
      formData.append('files', imageBlob, 'camera-capture.jpg');
      console.log('FormData created with file');

      const token = localStorage.getItem('token');
      console.log('Token available:', !!token);

      const response = await fetch(
        `https://ungdungnhantinbaomatniel-production.up.railway.app/api/messages/${conversation._id}/file`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        }
      );

      console.log('Upload response status:', response.status);

      if (response.ok) {
        const newMsg = await response.json();
        console.log('Camera capture uploaded successfully:', newMsg);
        // Don't add message here - Socket.io will handle it
        onUpdateConversations();
        setShowCameraCapture(false);
      } else {
        const errorData = await response.json();
        console.error('Upload failed:', errorData);
        alert(t('chat.sendImageError') + ': ' + (errorData.message || t('common.error')));
      }
    } catch (error) {
      console.error('Error uploading camera capture:', error);
      alert(t('chat.sendImageFailed') + ': ' + error);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `https://ungdungnhantinbaomatniel-production.up.railway.app/api/messages/${messageId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        const result = await response.json();
        console.log('Message deleted:', result);

        // Update local state
        setMessages(prev => prev.map(msg =>
          msg._id === messageId
            ? { ...msg, isDeleted: true, content: t('chat.messageDeleted'), attachments: [] }
            : msg
        ));

        setShowMessageMenu(null);
      } else {
        const error = await response.json();
        alert(error.message || t('chat.deleteFailed'));
      }
    } catch (error) {
      console.error('Error deleting message:', error);
      alert(t('chat.deleteError'));
    }
  };

  // Helper function to normalize file URLs - use Vercel proxy for uploads
  const normalizeFileUrl = (fileUrl: string): string => {
    if (!fileUrl) return '';

    // If it's a Backblaze B2 URL, use the presigned URL proxy
    if (fileUrl.includes('backblazeb2.com') || fileUrl.includes('backblaze.com')) {
      // Use the files proxy endpoint to get presigned URL
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://ungdungnhantinbaomatniel-production.up.railway.app/api';
      return `${apiUrl}/files/proxy?fileUrl=${encodeURIComponent(fileUrl)}`;
    }

    // If already a full HTTP URL, check if it's Railway and convert to relative
    if (fileUrl.startsWith('http')) {
      if (fileUrl.includes('railway.app/uploads/')) {
        // Convert Railway URL to relative path for Vercel proxy
        const uploadsPath = fileUrl.split('/uploads/')[1];
        return `/uploads/${uploadsPath}`;
      }
      // Keep other full URLs as-is
      return fileUrl;
    }

    // If relative path, ensure it starts with /
    return fileUrl.startsWith('/') ? fileUrl : `/${fileUrl}`;
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getOtherParticipant = () => {
    if (conversation.type === 'group') {
      return { fullName: conversation.name, avatar: conversation.avatar };
    }
    return conversation.participants?.find(p => p._id !== currentUser?.id) || { fullName: 'Unknown User', avatar: null };
  };

  const otherParticipant = getOtherParticipant();

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('chat.loadingMessages')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header - Hidden on mobile as it's handled in ChatApp */}
      {!isMobile && (
        <div className="p-4 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                {otherParticipant?.avatar ? (
                  <img
                    src={otherParticipant.avatar}
                    alt={otherParticipant.fullName}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                    <span className="text-white font-medium">
                      {otherParticipant?.fullName?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </div>
                )}
              </div>
              <div>
                <h3 className="font-medium text-gray-800">
                  {otherParticipant?.fullName}
                </h3>
                <p className="text-sm text-gray-500">
                  {conversation.type === 'group'
                    ? `${conversation.participants?.length || 0} ${t('chat.members')}`
                    : t('chat.online')
                  }
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {/* Encryption Toggle Button */}
              <button
                onClick={handleToggleEncryption}
                disabled={isTogglingEncryption}
                className={`p-2 rounded-lg transition-colors flex items-center space-x-1 ${encryptionMode === 'e2ee'
                  ? 'bg-green-100 hover:bg-green-200 text-green-600'
                  : 'hover:bg-gray-100 text-gray-500'
                  }`}
                title={encryptionMode === 'e2ee' ? t('encryption.e2eeOn') : t('encryption.e2eeOff')}
              >
                {encryptionMode === 'e2ee' ? (
                  <Lock className={`w-5 h-5 ${isTogglingEncryption ? 'animate-pulse' : ''}`} />
                ) : (
                  <Unlock className={`w-5 h-5 ${isTogglingEncryption ? 'animate-pulse' : ''}`} />
                )}
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Phone className="w-5 h-5 text-gray-600" />
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Video className="w-5 h-5 text-gray-600" />
              </button>
              {conversation.type === 'group' && onShowGroupManagement && (
                <button
                  onClick={onShowGroupManagement}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title={t('group.manageGroup')}
                >
                  <Users className="w-5 h-5 text-gray-600" />
                </button>
              )}
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <MoreVertical className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p>{t('chat.noMessages')}</p>
            <p className="text-sm">{t('chat.startConversation')}</p>
          </div>
        ) : (
          messages.map((message) => (
            <motion.div
              key={message._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${message.senderId._id === currentUser?.id ? 'justify-end' : 'justify-start'} items-end space-x-2`}
            >
              {/* Avatar for other users */}
              {message.senderId._id !== currentUser?.id && (
                <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                  {message.senderId.avatar ? (
                    <img
                      src={message.senderId.avatar}
                      alt={message.senderId.fullName}
                      className="w-8 h-8 rounded-full object-cover"
                      onError={(e) => {
                        console.error('Avatar load error:', message.senderId.avatar);
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <span className="text-white text-xs font-medium">
                      {message.senderId.fullName?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  )}
                </div>
              )}

              <div className={`max-w-xs lg:max-w-md ${message.senderId._id === currentUser?.id ? 'order-2' : 'order-1'}`}>
                {message.senderId._id !== currentUser?.id && (
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-xs font-medium text-gray-600">
                      {message.senderId.fullName}
                    </span>
                    <span className="text-xs text-gray-400">
                      {formatTime(message.createdAt)}
                    </span>
                  </div>
                )}

                <div className={`rounded-lg p-3 ${message.senderId._id === currentUser?.id
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-800 border border-gray-200'
                  }`}>
                  {message.replyTo && (
                    <div className="mb-2 p-2 bg-gray-100 rounded text-xs border-l-2 border-blue-500">
                      <p className="font-medium">{message.replyTo.senderId.fullName}</p>
                      <p className="text-gray-600 truncate">{message.replyTo.content}</p>
                    </div>
                  )}

                  {message.messageType === 'text' && (
                    <div className={`text-sm ${message.isDeleted ? 'italic text-gray-500' : ''}`}>
                      {message.isEncrypted && (
                        <Lock className="w-3 h-3 inline-block mr-1 text-green-500" />
                      )}
                      <EncryptedMessageContent
                        message={message}
                        decryptedMessages={decryptedMessages}
                        decryptMessageContent={decryptMessageContent}
                      />
                    </div>
                  )}

                  {message.messageType === 'image' && message.attachments && (
                    <div className="space-y-2">
                      <p className="text-sm">{message.content}</p>
                      {message.attachments.map((attachment, index) => {
                        const imageUrl = normalizeFileUrl(attachment.fileUrl);

                        return (
                          <div key={index} className="relative">
                            <img
                              src={imageUrl}
                              alt={attachment.fileName}
                              className="max-w-full h-auto rounded"
                              loading="lazy"
                              onError={(e) => {
                                console.error('Image load error:', attachment.fileUrl, 'Normalized:', imageUrl);
                                // Fallback to Railway URL if Vercel proxy fails
                                if (!imageUrl.startsWith('http')) {
                                  e.currentTarget.src = `https://ungdungnhantinbaomatniel-production.up.railway.app${imageUrl}`;
                                } else {
                                  e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJMMTMuMDkgOC4yNkwyMCA5TDEzLjA5IDE1Ljc0TDEyIDIyTDEwLjkxIDE1Ljc0TDQgOUwxMC45MSA4LjI2TDEyIDJaIiBmaWxsPSIjOTk5Ii8+Cjwvc3ZnPgo=';
                                }
                              }}
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {message.messageType === 'file' && message.attachments && (
                    <div className="space-y-2">
                      <p className="text-sm">{message.content}</p>
                      {message.attachments.map((attachment, index) => {
                        const fileUrl = normalizeFileUrl(attachment.fileUrl);
                        return (
                          <div key={index} className="flex items-center space-x-2 p-2 bg-gray-100 rounded">
                            <File className="w-4 h-4" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium truncate">{attachment.fileName}</p>
                              <p className="text-xs text-gray-500">{formatFileSize(attachment.fileSize)}</p>
                            </div>
                            <a
                              href={fileUrl}
                              download={attachment.fileName}
                              className="p-1 hover:bg-gray-200 rounded"
                            >
                              <Download className="w-4 h-4" />
                            </a>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {message.messageType === 'audio' && message.attachments && (
                    <div className="space-y-2">
                      <p className="text-sm">{message.content}</p>
                      {message.attachments.map((attachment, index) => (
                        <AudioPlayer
                          key={index}
                          fileUrl={attachment.fileUrl}
                          fileName={attachment.fileName}
                        />
                      ))}
                    </div>
                  )}

                  {message.isEdited && (
                    <p className="text-xs opacity-70 mt-1">{t('chat.edited')}</p>
                  )}
                </div>

                {message.senderId._id === currentUser?.id && (
                  <div className="flex justify-end items-center space-x-2 mt-1">
                    <span className="text-xs text-gray-400">
                      {formatTime(message.createdAt)}
                    </span>
                    <div className="relative">
                      <button
                        onClick={() => setShowMessageMenu(showMessageMenu === message._id ? null : message._id)}
                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                      >
                        <MoreVertical className="w-4 h-4 text-gray-400" />
                      </button>

                      {showMessageMenu === message._id && (
                        <div className="message-menu absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[120px]">
                          {!message.isDeleted && (
                            <button
                              onClick={() => {
                                if (confirm(t('chat.deleteConfirm'))) {
                                  handleDeleteMessage(message._id);
                                }
                              }}
                              className="w-full px-3 py-2 text-left text-red-600 hover:bg-red-50 flex items-center space-x-2"
                            >
                              <Trash2 className="w-4 h-4" />
                              <span>{t('chat.deleteMessage')}</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Avatar for current user */}
              {message.senderId._id === currentUser?.id && (
                <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                  {currentUser?.avatar ? (
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.fullName}
                      className="w-8 h-8 rounded-full object-cover"
                      onError={(e) => {
                        console.error('Current user avatar load error:', currentUser.avatar);
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <span className="text-white text-xs font-medium">
                      {currentUser?.fullName?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  )}
                </div>
              )}
            </motion.div>
          ))
        )}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="max-w-xs lg:max-w-md">
              <div className="bg-white text-gray-800 border border-gray-200 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-sm text-gray-500">{t('chat.typing')}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Reply Preview */}
      {replyingTo && (
        <div className="p-3 bg-gray-100 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-1 h-8 bg-blue-500 rounded"></div>
              <div>
                <p className="text-xs font-medium text-gray-600">Trả lời {replyingTo.senderId.fullName}</p>
                <p className="text-xs text-gray-500 truncate">{replyingTo.content}</p>
              </div>
            </div>
            <button
              onClick={() => setReplyingTo(null)}
              className="p-1 hover:bg-gray-200 rounded"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>
      )}

      {/* Input */}
      <div className={`${isMobile ? 'p-3' : 'p-4'} bg-white border-t border-gray-200`}>
        <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setShowFilePicker(!showFilePicker)}
            className={`${isMobile ? 'p-1.5' : 'p-2'} hover:bg-gray-100 rounded-lg transition-colors`}
          >
            <Paperclip className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-gray-600`} />
          </button>

          <div className="flex-1 relative">
            <input
              type="text"
              value={newMessage}
              onChange={handleTyping}
              onBlur={handleInputBlur}
              placeholder={t('chat.typePlaceholder')}
              className={`w-full ${isMobile ? 'px-3 py-2 text-sm' : 'px-4 py-2'} border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            />
            {showFilePicker && (
              <div className={`absolute bottom-full left-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg ${isMobile ? 'p-2' : 'p-2'}`}>
                <div className={`flex ${isMobile ? 'flex-col space-y-1' : 'space-x-2'}`}>
                  <button
                    type="button"
                    onClick={() => setShowCameraCapture(true)}
                    className={`flex items-center ${isMobile ? 'space-x-2 px-2 py-1.5' : 'space-x-2 px-3 py-2'} hover:bg-gray-100 rounded`}
                  >
                    <Camera className="w-4 h-4" />
                    <span className={`${isMobile ? 'text-xs' : 'text-sm'}`}>Camera</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className={`flex items-center ${isMobile ? 'space-x-2 px-2 py-1.5' : 'space-x-2 px-3 py-2'} hover:bg-gray-100 rounded`}
                  >
                    <Image className="w-4 h-4" />
                    <span className={`${isMobile ? 'text-xs' : 'text-sm'}`}>{t('chatList.image')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className={`flex items-center ${isMobile ? 'space-x-2 px-2 py-1.5' : 'space-x-2 px-3 py-2'} hover:bg-gray-100 rounded`}
                  >
                    <File className="w-4 h-4" />
                    <span className={`${isMobile ? 'text-xs' : 'text-sm'}`}>File</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => audioInputRef.current?.click()}
                    className={`flex items-center ${isMobile ? 'space-x-2 px-2 py-1.5' : 'space-x-2 px-3 py-2'} hover:bg-gray-100 rounded`}
                  >
                    <Mic className="w-4 h-4" />
                    <span className={`${isMobile ? 'text-xs' : 'text-sm'}`}>Audio</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className={`${isMobile ? 'p-1.5' : 'p-2'} hover:bg-gray-100 rounded-lg transition-colors`}
          >
            <Smile className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-gray-600`} />
          </button>

          <button
            type="submit"
            disabled={!newMessage.trim()}
            className={`${isMobile ? 'p-1.5' : 'p-2'} bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
          >
            <Send className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} />
          </button>
        </form>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,.pdf,.doc,.docx,.txt"
          onChange={(e) => {
            if (e.target.files) {
              handleFileUpload(e.target.files);
              setShowFilePicker(false);
            }
          }}
          className="hidden"
        />

        <input
          ref={audioInputRef}
          type="file"
          accept="audio/*"
          onChange={(e) => {
            if (e.target.files) {
              handleAudioUpload(e.target.files);
            }
          }}
          className="hidden"
        />
      </div>

      {/* Emoji Picker */}
      <SimpleEmojiPicker
        isOpen={showEmojiPicker}
        onClose={() => setShowEmojiPicker(false)}
        onEmojiClick={(emoji) => {
          setNewMessage(prev => prev + emoji);
          setShowEmojiPicker(false);
        }}
      />

      {/* Camera Capture */}
      <CameraCapture
        isOpen={showCameraCapture}
        onClose={() => setShowCameraCapture(false)}
        onCapture={handleCameraCapture}
        onError={(error) => {
          console.error('Camera error:', error);
          alert(error);
        }}
      />
    </div>
  );
}
