'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useSocket } from './SocketContext';
import { useTranslations } from 'next-intl';
import SimpleEmojiPicker from './SimpleEmojiPicker';
import CameraCapture from './CameraCapture';
import * as encryption from '../lib/encryption';

import { normalizeFileUrlHelper } from '../lib/fileUtils';

// Audio Player Component
const AudioPlayer = React.memo(({ fileUrl, fileName }: { fileUrl: string; fileName: string }) => {
  const [duration, setDuration] = useState<number>(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const currentUrl = React.useMemo(() => {
    if (!fileUrl) return '';
    if (fileUrl.startsWith('blob:')) return fileUrl;
    return normalizeFileUrlHelper(fileUrl);
  }, [fileUrl]);

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
      setIsLoaded(true);
      // Removed console.log for clean code
    }
  };

  const handleError = () => {
    console.error('Audio load error for:', fileName, 'URL:', currentUrl);
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
          src={currentUrl}
          type="audio/mpeg"
        />
        <source
          src={currentUrl}
          type="audio/wav"
        />
        <source
          src={currentUrl}
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
});

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
  decryptVersion?: number;
}

const EncryptedMessageContent: React.FC<EncryptedMessageProps> = ({
  message,
  decryptedMessages,
  decryptMessageContent,
  decryptVersion = 0
}) => {
  const [displayContent, setDisplayContent] = React.useState<string>(
    message.isEncrypted ? '🔒 Đang giải mã...' : message.content
  );
  const decryptingRef = React.useRef<boolean>(false);

  React.useEffect(() => {
    if (message.isEncrypted) {
      // Check cache first
      if (decryptedMessages[message._id]) {
        setDisplayContent(decryptedMessages[message._id]);
        decryptingRef.current = false;
        return;
      }

      // Prevent duplicate calls
      if (decryptingRef.current) return;

      decryptingRef.current = true;
      decryptMessageContent(message).then(result => {
        decryptingRef.current = false;
        setDisplayContent(result);
      });
    } else {
      setDisplayContent(message.content);
    }
  }, [message._id, decryptedMessages[message._id], decryptVersion]);

  return <span>{displayContent}</span>;
};

// Encrypted File Content Component
interface EncryptedFileProps {
  message: Message;
  attachment: { fileName: string; fileUrl: string; fileSize: number; mimeType: string };
  decryptedFiles: Record<string, string>;
  decryptFileContent: (message: Message, fileUrl: string, mimeType: string) => Promise<string | null>;
  renderComponent: (url: string, isLoading: boolean, hasError: boolean) => React.ReactNode;
  decryptVersion?: number;
}

const EncryptedFileContent: React.FC<EncryptedFileProps> = ({
  message,
  attachment,
  decryptedFiles,
  decryptFileContent,
  renderComponent,
  decryptVersion = 0
}) => {
  const [fileUrl, setFileUrl] = React.useState<string>('');
  const [isLoading, setIsLoading] = React.useState<boolean>(message.isEncrypted || false);
  const [hasError, setHasError] = React.useState<boolean>(false);
  const decryptingRef = React.useRef<boolean>(false);
  const lastCacheKeyRef = React.useRef<string>('');

  // Always check top level cache first directly without useEffect
  const cacheKey = `${message._id}_${attachment.fileUrl}`;
  const cachedUrl = decryptedFiles[cacheKey];

  React.useEffect(() => {
    let isMounted = true;

    if (message.isEncrypted) {
      // Check cache first
      if (cachedUrl) {
        if (fileUrl !== cachedUrl) {
          setFileUrl(cachedUrl);
          setHasError(false);
        }
        setIsLoading(false);
        return;
      }

      // Prevent duplicate decrypt calls
      if (decryptingRef.current && lastCacheKeyRef.current === cacheKey) {
        return;
      }

      decryptingRef.current = true;
      lastCacheKeyRef.current = cacheKey;
      setIsLoading(true);
      setHasError(false); // Reset error on retry

      decryptFileContent(message, attachment.fileUrl, attachment.mimeType)
        .then(url => {
          if (!isMounted) return;
          decryptingRef.current = false;
          if (url) {
            setFileUrl(url);
            setHasError(false);
          } else {
            setHasError(true);
          }
          setIsLoading(false);
        })
        .catch(err => {
          if (!isMounted) return;
          decryptingRef.current = false;
          console.error('Lỗi hiển thị file giải mã:', err);
          setHasError(true);
          setIsLoading(false);
        });
    } else {
      const normalized = normalizeFileUrlHelper(attachment.fileUrl);
      setFileUrl(normalized);
      setIsLoading(false);
    }

    return () => { isMounted = false; };
  }, [message._id, attachment.fileUrl, decryptedFiles[`${message._id}_${attachment.fileUrl}`], decryptVersion]);

  return <>{renderComponent(fileUrl, isLoading, hasError)}</>;
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
  const [decryptedFiles, setDecryptedFiles] = useState<Record<string, string>>({}); // Add state for decrypted files
  const [decryptVersion, setDecryptVersion] = useState(0);

  // E2EE Password Key store
  const [unlockedPrivateKey, setUnlockedPrivateKey] = useState<string | null>(null);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [decryptPassword, setDecryptPassword] = useState('');
  const [decryptError, setDecryptError] = useState('');

  // Reset encryption mode when conversation changes
  React.useEffect(() => {
    setEncryptionMode(conversation.encryptionMode || 'none');
  }, [conversation._id, conversation.encryptionMode]);

  // Tự động ẩn/hiện form nhập mật khẩu theo chế độ mã hóa
  React.useEffect(() => {
    if (encryptionMode === 'e2ee' && !unlockedPrivateKey) {
      setShowPasswordPrompt(true);
    } else {
      setShowPasswordPrompt(false);
    }
  }, [encryptionMode, unlockedPrivateKey]);

  // Hàm mở khóa Private Key bằng Password
  const handleUnlockKeys = async () => {
    if (!decryptPassword) return;
    setDecryptError('');
    try {
      const myKeysResponse = await fetch(
        `https://ungdungnhantinbaomatniel-production.up.railway.app/api/users/encryption-keys`,
        { credentials: 'include' }
      );
      if (!myKeysResponse.ok) {
        setDecryptError('Không thể tải khóa mã hóa từ server.');
        return;
      }
      const myKeysData = await myKeysResponse.json();
      if (!myKeysData.encryptedPrivateKey) {
        setDecryptError('Không tìm thấy khóa mã hóa. Vui lòng tạo khóa mới trong Cài đặt > Bảo mật.');
        return;
      }

      let rawPrivateKey = '';
      if (myKeysData.keySalt) {
        try {
          const params = JSON.parse(myKeysData.keySalt);
          rawPrivateKey = await encryption.decryptStringWithPassword(
            myKeysData.encryptedPrivateKey,
            decryptPassword,
            params.salt,
            params.iv
          );
        } catch (e) {
          setDecryptError('Mật khẩu không đúng. Vui lòng thử lại.');
          return;
        }
      } else {
        // Old format: key is raw, not encrypted with password
        rawPrivateKey = myKeysData.encryptedPrivateKey;
      }

      // Validate key by trying to import it
      await encryption.importPrivateKey(rawPrivateKey);

      // Success! Store the unlocked key
      setUnlockedPrivateKey(rawPrivateKey);
      setShowPasswordPrompt(false);
      setDecryptPassword('');
      setDecryptError('');

      // Clear cached decrypted content and re-fetch messages to force re-decrypt
      setDecryptedMessages({});
      setDecryptedFiles({});
      setDecryptVersion(v => v + 1);

      // Force re-fetch messages to trigger re-decryption with the new key
      setTimeout(() => {
        fetchMessages();
      }, 100);
    } catch (error) {
      console.error('Unlock key error:', error);
      setDecryptError('Mật khẩu không đúng hoặc khóa bị hỏng.');
    }
  };

  // Helper: get real private key for encryption operations
  const getRealPrivateKey = async (): Promise<string | null> => {
    if (unlockedPrivateKey) return unlockedPrivateKey;

    const myKeysResponse = await fetch(
      `https://ungdungnhantinbaomatniel-production.up.railway.app/api/users/encryption-keys`,
      { credentials: 'include' }
    );
    if (!myKeysResponse.ok) return null;
    const myKeysData = await myKeysResponse.json();
    if (!myKeysData.encryptedPrivateKey) return null;

    if (!myKeysData.keySalt) {
      // Old format: raw key
      return myKeysData.encryptedPrivateKey;
    }

    // New format: need password
    setShowPasswordPrompt(true);
    return null;
  };

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
      const response = await fetch(
        `https://ungdungnhantinbaomatniel-production.up.railway.app/api/messages/${conversation._id}`,
        {
          credentials: 'include'
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
      const newMode = encryptionMode === 'e2ee' ? 'none' : 'e2ee';

      // If enabling encryption, check if other user has a key
      if (newMode === 'e2ee' && conversation.type === 'private') {
        const otherUser = conversation.participants?.find(p => p._id !== currentUser?.id);
        if (otherUser?._id) {
          const keyResponse = await fetch(
            `https://ungdungnhantinbaomatniel-production.up.railway.app/api/users/${otherUser._id}/public-key`,
            { credentials: 'include' }
          );

          if (keyResponse.ok) {
            const keyData = await keyResponse.json();
            if (!keyData.publicKey) {
              alert(t('encryption.recipientNoKeyDesc'));
              setIsTogglingEncryption(false);
              return;
            }
          }
        }
      }

      const response = await fetch(
        `https://ungdungnhantinbaomatniel-production.up.railway.app/api/conversations/${conversation._id}/encryption-mode`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
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
      console.log('🔓 Decrypting message:', message._id, 'hasUnlockedKey:', !!unlockedPrivateKey);

      // Determine which public key to use for ECDH
      // If I am the sender: I need the RECIPIENT's public key (same as when encrypting)
      // If I am the recipient: I need the SENDER's public key
      const amISender = message.senderId._id === currentUser?.id;

      let otherUserPublicKey: string;

      if (amISender) {
        // I sent this message - need to get recipient's public key
        const otherUser = conversation.participants?.find(p => p._id !== currentUser?.id);
        if (!otherUser?._id) {
          return `🔒 ${t('encryption.decryptFailed')}`;
        }

        const recipientKeyResponse = await fetch(
          `https://ungdungnhantinbaomatniel-production.up.railway.app/api/users/${otherUser._id}/public-key`,
          { credentials: 'include' }
        );

        if (!recipientKeyResponse.ok) {
          return `🔒 ${t('encryption.decryptFailed')}`;
        }

        const recipientKeyData = await recipientKeyResponse.json();
        otherUserPublicKey = recipientKeyData.publicKey;
      } else {
        // I received this message - need sender's public key
        const senderKeyResponse = await fetch(
          `https://ungdungnhantinbaomatniel-production.up.railway.app/api/users/${message.senderId._id}/public-key`,
          { credentials: 'include' }
        );

        if (!senderKeyResponse.ok) {
          return `🔒 ${t('encryption.decryptFailed')}`;
        }

        const senderKeyData = await senderKeyResponse.json();
        otherUserPublicKey = senderKeyData.publicKey;
      }

      // Get my private key
      const myKeysResponse = await fetch(
        `https://ungdungnhantinbaomatniel-production.up.railway.app/api/users/encryption-keys`,
        { credentials: 'include' }
      );

      if (!myKeysResponse.ok) {
        return `🔒 ${t('encryption.decryptFailed')}`;
      }

      const myKeysData = await myKeysResponse.json();

      if (!otherUserPublicKey || !myKeysData.encryptedPrivateKey) {
        return `🔒 ${t('encryption.decryptFailed')}`;
      }

      // 1. Get real Private Key 
      let realPrivateKeyToImport = unlockedPrivateKey;

      if (!realPrivateKeyToImport) {
        // If we haven't unlocked it yet, check if it's the old raw format
        if (!myKeysData.keySalt) {
          realPrivateKeyToImport = myKeysData.encryptedPrivateKey; // It's actually raw
        } else {
          // It is properly encrypted, we need password (don't auto-popup anymore to prevent looping/annoying prompt)
          return `🔒 Yêu cầu mật khẩu giải mã...`; // Trả về thông báo ảo đợi User nhập pass
        }
      }

      if (!realPrivateKeyToImport) {
        return `🔒 Xin nhập mật khẩu giải mã (Bên dưới màn hình)`;
      }

      // Import keys and derive shared secret
      const otherPublicKey = await encryption.importPublicKey(otherUserPublicKey);
      const myPrivateKey = await encryption.importPrivateKey(realPrivateKeyToImport);
      const sharedKey = await encryption.deriveSharedKey(myPrivateKey, otherPublicKey);

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

  // Decrypt File Content function
  const decryptFileContent = async (message: Message, fileUrl: string, mimeType: string): Promise<string | null> => {
    // Return cached URL if available
    const cacheKey = `${message._id}_${fileUrl}`;
    if (decryptedFiles[cacheKey]) {
      return decryptedFiles[cacheKey];
    }

    if (!message.isEncrypted || !message.encryptionData?.iv) {
      return normalizeFileUrlHelper(fileUrl);
    }

    try {
      console.log('🖼️ Decrypting file:', message._id, 'hasUnlockedKey:', !!unlockedPrivateKey);

      // ===== STEP 1: Check key FIRST before fetching file =====
      const amISender = message.senderId._id === currentUser?.id;
      let otherUserPublicKey: string;

      if (amISender) {
        const otherUser = conversation.participants?.find(p => p._id !== currentUser?.id);
        if (!otherUser?._id) {
          console.error('File decrypt: no other user found');
          return null;
        }
        const recipientKeyResponse = await fetch(
          `https://ungdungnhantinbaomatniel-production.up.railway.app/api/users/${otherUser._id}/public-key`,
          { credentials: 'include' }
        );
        if (!recipientKeyResponse.ok) {
          console.error('File decrypt: failed to get recipient public key');
          return null;
        }
        otherUserPublicKey = (await recipientKeyResponse.json()).publicKey;
      } else {
        const senderKeyResponse = await fetch(
          `https://ungdungnhantinbaomatniel-production.up.railway.app/api/users/${message.senderId._id}/public-key`,
          { credentials: 'include' }
        );
        if (!senderKeyResponse.ok) {
          console.error('File decrypt: failed to get sender public key');
          return null;
        }
        otherUserPublicKey = (await senderKeyResponse.json()).publicKey;
      }

      // Check my private key
      let realPrivateKeyToImport = unlockedPrivateKey;

      if (!realPrivateKeyToImport) {
        const myKeysResponse = await fetch(
          `https://ungdungnhantinbaomatniel-production.up.railway.app/api/users/encryption-keys`,
          { credentials: 'include' }
        );
        if (!myKeysResponse.ok) {
          console.error('File decrypt: failed to get my encryption keys');
          return null;
        }
        const myKeysData = await myKeysResponse.json();

        if (!myKeysData.encryptedPrivateKey) {
          console.error('File decrypt: no encrypted private key');
          return null;
        }

        if (!myKeysData.keySalt) {
          realPrivateKeyToImport = myKeysData.encryptedPrivateKey;
        } else {
          // Don't auto-popup password prompt for files either
          return null;
        }
      }

      if (!realPrivateKeyToImport || !otherUserPublicKey) {
        console.error('File decrypt: missing keys');
        return null;
      }

      // ===== STEP 2: Derive shared key =====
      const otherPublicKey = await encryption.importPublicKey(otherUserPublicKey);
      const myPrivateKey = await encryption.importPrivateKey(realPrivateKeyToImport);
      const sharedKey = await encryption.deriveSharedKey(myPrivateKey, otherPublicKey);

      // ===== STEP 3: NOW fetch the encrypted file =====
      const normalizedUrl = normalizeFileUrlHelper(fileUrl);
      const fileResponse = await fetch(normalizedUrl);
      if (!fileResponse.ok) {
        console.error('File decrypt: failed to fetch file, status:', fileResponse.status);
        throw new Error(`Failed to fetch encrypted file: ${fileResponse.status}`);
      }
      const encryptedBuffer = await fileResponse.arrayBuffer();

      // ===== STEP 4: Decrypt =====
      const decryptedBuffer = await encryption.decryptFile(
        encryptedBuffer,
        message.encryptionData.iv,
        sharedKey
      );

      // ===== STEP 5: Create Object URL =====
      let determinedMimeType = mimeType;
      if (message.encryptionData && (message.encryptionData as any).originalType) {
        determinedMimeType = (message.encryptionData as any).originalType;
      }

      const blob = new Blob([decryptedBuffer], { type: determinedMimeType || 'application/octet-stream' });
      const objectUrl = URL.createObjectURL(blob);

      // ===== STEP 6: Cache =====
      setDecryptedFiles(prev => ({ ...prev, [cacheKey]: objectUrl }));

      return objectUrl;
    } catch (error) {
      console.error('File decryption error:', error);
      return null;
    }
  };

  const sendMessage = async (content: string, messageType: 'text' = 'text', attachments?: any[]) => {
    if (!content.trim() && !attachments?.length) return;

    try {
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
              { credentials: 'include' }
            );

            if (keyResponse.ok) {
              const keyData = await keyResponse.json();
              if (keyData.publicKey) {
                // Get my private key
                const myKeysResponse = await fetch(
                  `https://ungdungnhantinbaomatniel-production.up.railway.app/api/users/encryption-keys`,
                  { credentials: 'include' }
                );

                if (myKeysResponse.ok) {
                  const myKeysData = await myKeysResponse.json();
                  if (myKeysData.encryptedPrivateKey) {

                    // 1. Get real Private Key 
                    let realPrivateKeyToImport = unlockedPrivateKey;

                    if (!realPrivateKeyToImport) {
                      // If we haven't unlocked it yet, check if it's the old raw format
                      if (!myKeysData.keySalt) {
                        realPrivateKeyToImport = myKeysData.encryptedPrivateKey; // It's actually raw
                      } else {
                        setShowPasswordPrompt(true);
                        return; // Stop sending msg until unlocked
                      }
                    }

                    if (!realPrivateKeyToImport) return;

                    // Import keys and derive shared secret
                    const recipientPublicKey = await encryption.importPublicKey(keyData.publicKey);
                    const myPrivateKey = await encryption.importPrivateKey(realPrivateKeyToImport);
                    const sharedKey = await encryption.deriveSharedKey(myPrivateKey, recipientPublicKey);

                    // Encrypt the message
                    const encrypted = await encryption.encryptMessage(content, sharedKey);
                    messageContent = encrypted.ciphertext;
                    encryptionData = { iv: encrypted.iv, algorithm: 'AES-256-GCM' };
                  } else {
                    alert(t('encryption.noKey'));
                    return;
                  }
                } else {
                  alert(t('encryption.noKey'));
                  return;
                }
              } else {
                alert(t('encryption.otherNoKey'));
                return;
              }
            } else {
              alert(t('encryption.otherNoKey'));
              return;
            }
          }
        } catch (encError) {
          console.error('Encryption error:', encError);
          alert(t('encryption.decryptFailed') + ': ' + encError);
          return;
        }
      }

      const response = await fetch(
        `https://ungdungnhantinbaomatniel-production.up.railway.app/api/messages/${conversation._id}/${messageType}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
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
    try {
      const formData = new FormData();

      let encryptionData = null;
      let sharedKeyStr = null;

      // Determine if we should encrypt
      if (encryptionMode === 'e2ee') {
        const otherUser = conversation.participants?.find(p => p._id !== currentUser?.id);
        if (otherUser?._id) {
          const keyResponse = await fetch(
            `https://ungdungnhantinbaomatniel-production.up.railway.app/api/users/${otherUser._id}/public-key`,
            { credentials: 'include' }
          );

          if (keyResponse.ok) {
            const keyData = await keyResponse.json();
            if (keyData.publicKey) {
              const myKeysResponse = await fetch(
                `https://ungdungnhantinbaomatniel-production.up.railway.app/api/users/encryption-keys`,
                { credentials: 'include' }
              );

              if (myKeysResponse.ok) {
                const myKeysData = await myKeysResponse.json();
                if (myKeysData.encryptedPrivateKey) {
                  // Get real private key (may need password unlock)
                  const realKey = await getRealPrivateKey();
                  if (!realKey) return; // Will show password prompt

                  const recipientPublicKey = await encryption.importPublicKey(keyData.publicKey);
                  const myPrivateKey = await encryption.importPrivateKey(realKey);
                  const sharedKey = await encryption.deriveSharedKey(myPrivateKey, recipientPublicKey);

                  // Chạy mã hóa từng file
                  for (let i = 0; i < files.length; i++) {
                    const file = files[i];
                    const arrayBuffer = await file.arrayBuffer();
                    const { encryptedData, iv } = await encryption.encryptFile(arrayBuffer, sharedKey);

                    // Generate a blob out of the encrypted ArrayBuffer
                    const encryptedBlob = new Blob([encryptedData], { type: 'application/octet-stream' });
                    formData.append('files', encryptedBlob, `encrypted_${file.name}`);

                    // Keep track of IV - since API only supports one encryptionData object currently per message 
                    // we assume 1 file = 1 message for now in the simplest approach.
                    if (!encryptionData) {
                      encryptionData = { iv, algorithm: 'AES-256-GCM', originalName: file.name, originalType: file.type };
                    }
                  }
                } else {
                  alert(t('encryption.noKey'));
                  return;
                }
              }
            } else {
              alert(t('encryption.otherNoKey'));
              return;
            }
          }
        }
      }

      // If not encrypted or failed getting keys, fallback to standard upload or block
      if (!encryptionData) {
        Array.from(files).forEach(file => {
          formData.append('files', file);
        });
      } else {
        formData.append('isEncrypted', 'true');
        formData.append('encryptionData', JSON.stringify(encryptionData));
      }

      const response = await fetch(
        `https://ungdungnhantinbaomatniel-production.up.railway.app/api/messages/${conversation._id}/file`,
        {
          method: 'POST',
          credentials: 'include',
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
    try {
      const formData = new FormData();

      let encryptionData = null;

      if (encryptionMode === 'e2ee') {
        const otherUser = conversation.participants?.find((p: any) => p._id !== currentUser?.id);
        if (otherUser?._id) {
          const keyResponse = await fetch(
            `https://ungdungnhantinbaomatniel-production.up.railway.app/api/users/${otherUser._id}/public-key`,
            { credentials: 'include' }
          );

          if (keyResponse.ok) {
            const keyData = await keyResponse.json();
            if (keyData.publicKey) {
              const myKeysResponse = await fetch(
                `https://ungdungnhantinbaomatniel-production.up.railway.app/api/users/encryption-keys`,
                { credentials: 'include' }
              );

              if (myKeysResponse.ok) {
                const myKeysData = await myKeysResponse.json();
                if (myKeysData.encryptedPrivateKey) {
                  const realKey = await getRealPrivateKey();
                  if (!realKey) return;

                  const recipientPublicKey = await encryption.importPublicKey(keyData.publicKey);
                  const myPrivateKey = await encryption.importPrivateKey(realKey);
                  const sharedKey = await encryption.deriveSharedKey(myPrivateKey, recipientPublicKey);

                  for (let i = 0; i < files.length; i++) {
                    const file = files[i];
                    const arrayBuffer = await file.arrayBuffer();
                    const { encryptedData, iv } = await encryption.encryptFile(arrayBuffer, sharedKey);

                    const encryptedBlob = new Blob([encryptedData], { type: 'application/octet-stream' });
                    formData.append('files', encryptedBlob, `encrypted_${file.name}`);

                    if (!encryptionData) {
                      encryptionData = { iv, algorithm: 'AES-256-GCM', originalName: file.name, originalType: file.type };
                    }
                  }
                } else {
                  alert(t('encryption.noKey'));
                  return;
                }
              }
            } else {
              alert(t('encryption.otherNoKey'));
              return;
            }
          }
        }
      }

      if (!encryptionData) {
        Array.from(files).forEach(file => {
          formData.append('files', file);
        });
      } else {
        formData.append('isEncrypted', 'true');
        formData.append('encryptionData', JSON.stringify(encryptionData));
      }

      const response = await fetch(
        `https://ungdungnhantinbaomatniel-production.up.railway.app/api/messages/${conversation._id}/file`,
        {
          method: 'POST',
          credentials: 'include',
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
      const formData = new FormData();

      let encryptionData = null;

      if (encryptionMode === 'e2ee') {
        const otherUser = conversation.participants?.find((p: any) => p._id !== currentUser?.id);
        if (otherUser?._id) {
          const keyResponse = await fetch(
            `https://ungdungnhantinbaomatniel-production.up.railway.app/api/users/${otherUser._id}/public-key`,
            { credentials: 'include' }
          );

          if (keyResponse.ok) {
            const keyData = await keyResponse.json();
            if (keyData.publicKey) {
              const myKeysResponse = await fetch(
                `https://ungdungnhantinbaomatniel-production.up.railway.app/api/users/encryption-keys`,
                { credentials: 'include' }
              );

              if (myKeysResponse.ok) {
                const myKeysData = await myKeysResponse.json();
                if (myKeysData.encryptedPrivateKey) {
                  const realKey = await getRealPrivateKey();
                  if (!realKey) return;

                  const recipientPublicKey = await encryption.importPublicKey(keyData.publicKey);
                  const myPrivateKey = await encryption.importPrivateKey(realKey);
                  const sharedKey = await encryption.deriveSharedKey(myPrivateKey, recipientPublicKey);

                  const arrayBuffer = await imageBlob.arrayBuffer();
                  const { encryptedData, iv } = await encryption.encryptFile(arrayBuffer, sharedKey);

                  const encryptedBlob = new Blob([encryptedData], { type: 'application/octet-stream' });
                  formData.append('files', encryptedBlob, 'encrypted_camera-capture.jpg');

                  encryptionData = { iv, algorithm: 'AES-256-GCM', originalName: 'camera-capture.jpg', originalType: imageBlob.type };
                } else {
                  alert(t('encryption.noKey'));
                  return;
                }
              }
            } else {
              alert(t('encryption.otherNoKey'));
              return;
            }
          }
        }
      }

      if (!encryptionData) {
        formData.append('files', imageBlob, 'camera-capture.jpg');
      } else {
        formData.append('isEncrypted', 'true');
        formData.append('encryptionData', JSON.stringify(encryptionData));
      }

      const response = await fetch(
        `https://ungdungnhantinbaomatniel-production.up.railway.app/api/messages/${conversation._id}/file`,
        {
          method: 'POST',
          credentials: 'include',
          body: formData
        }
      );

      if (response.ok) {
        const newMsg = await response.json();
        // Don't add message here - Socket.io will handle it
        onUpdateConversations();
        setShowCameraCapture(false);
      } else {
        const errorData = await response.json();
        alert(t('chat.sendImageError') + ': ' + (errorData.message || t('common.error')));
      }
    } catch (error) {
      console.error('Error uploading camera capture:', error);
      alert(t('chat.sendImageFailed') + ': ' + error);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      const response = await fetch(
        `https://ungdungnhantinbaomatniel-production.up.railway.app/api/messages/${messageId}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include'
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
    <div className="flex flex-col h-full overflow-hidden relative">
      {/* Header - Always show for access to E2EE toggle */}
      <div className="p-3 lg:p-4 border-b border-gray-200 bg-white z-10 sticky top-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 lg:space-x-3">
            {/* Nút Quay lại (Chỉ hiện trên Mobile) */}
            {isMobile && (
              <button
                onClick={() => window.location.reload()}
                className="p-1.5 -ml-1 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Quay lại danh sách"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}

            <div className="w-9 h-9 lg:w-10 lg:h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
              {otherParticipant?.avatar ? (
                <img
                  src={normalizeFileUrlHelper(otherParticipant.avatar)}
                  alt={otherParticipant.fullName}
                  className="w-full h-full object-cover"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              ) : (
                <span className="text-white font-medium text-sm lg:text-base">
                  {otherParticipant?.fullName?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <h3 className="font-medium text-gray-800 text-sm lg:text-base truncate">
                {otherParticipant?.fullName}
              </h3>
              <p className="text-xs text-gray-500 truncate">
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
                      src={normalizeFileUrlHelper(message.senderId.avatar)}
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
                        decryptVersion={decryptVersion}
                      />
                    </div>
                  )}

                  {message.messageType === 'image' && message.attachments && (
                    <div className="space-y-2">
                      <p className="text-sm">{message.content}</p>
                      {message.attachments.map((attachment, index) => (
                        <EncryptedFileContent
                          key={index}
                          message={message}
                          attachment={attachment}
                          decryptedFiles={decryptedFiles}
                          decryptFileContent={decryptFileContent}
                          decryptVersion={decryptVersion}
                          renderComponent={(url, isLoading, hasError) => {
                            if (isLoading) return <div className="w-32 h-32 bg-gray-200 animate-pulse rounded flex items-center justify-center"><Lock className="w-6 h-6 text-gray-400" /></div>;
                            if (hasError || !url) {
                              return (
                                <div className={`p-2 rounded text-xs flex flex-col items-center justify-center w-32 h-32 text-center ${unlockedPrivateKey ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'}`}>
                                  <Lock className="w-5 h-5 mb-1" />
                                  {unlockedPrivateKey ? t('encryption.decryptFailed') : 'Tệp mã hóa'}
                                </div>
                              );
                            }

                            return (
                              <div className="relative">
                                {message.isEncrypted && <Lock className="absolute top-1 right-1 w-4 h-4 text-green-500 bg-white rounded-full p-0.5" />}
                                <img
                                  src={url}
                                  alt={attachment.fileName}
                                  className="max-w-full h-auto rounded"
                                  loading="lazy"
                                  onError={(e) => {
                                    if (!message.isEncrypted && !url.startsWith('http') && !url.startsWith('blob:')) {
                                      e.currentTarget.src = `https://ungdungnhantinbaomatniel-production.up.railway.app${url}`;
                                    }
                                  }}
                                />
                              </div>
                            );
                          }}
                        />
                      ))}
                    </div>
                  )}

                  {message.messageType === 'file' && message.attachments && (
                    <div className="space-y-2">
                      <p className="text-sm">{message.content}</p>
                      {message.attachments.map((attachment, index) => (
                        <EncryptedFileContent
                          key={index}
                          message={message}
                          attachment={attachment}
                          decryptedFiles={decryptedFiles}
                          decryptFileContent={decryptFileContent}
                          decryptVersion={decryptVersion}
                          renderComponent={(url, isLoading, hasError) => {
                            if (isLoading) return <div className="flex items-center space-x-2 p-2 bg-gray-100 rounded text-xs"><Lock className="w-4 h-4 animate-pulse" /> Đang giải mã...</div>;

                            return (
                              <div className={`flex items-center space-x-2 p-2 ${message.isEncrypted ? 'bg-green-50' : 'bg-gray-100'} rounded`}>
                                <File className="w-4 h-4" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium truncate">
                                    {message.isEncrypted && <Lock className="w-3 h-3 inline-block mr-1 text-green-600" />}
                                    {attachment.fileName}
                                  </p>
                                  <p className="text-xs text-gray-500">{formatFileSize(attachment.fileSize)}</p>
                                </div>
                                {hasError || !url ? (
                                  unlockedPrivateKey ? (
                                    <span className="text-xs text-red-500">Lỗi giải mã</span>
                                  ) : (
                                    <span className="text-xs text-gray-500 flex items-center"><Lock className="w-3 h-3 mr-1" /> Bị khóa</span>
                                  )
                                ) : (
                                  <a
                                    href={url}
                                    download={attachment.fileName}
                                    className="p-1 hover:bg-gray-200 rounded"
                                  >
                                    <Download className="w-4 h-4" />
                                  </a>
                                )}
                              </div>
                            );
                          }}
                        />
                      ))}
                    </div>
                  )}

                  {message.messageType === 'audio' && message.attachments && (
                    <div className="space-y-2">
                      <p className="text-sm">{message.content}</p>
                      {message.attachments.map((attachment, index) => (
                        <div key={index} className="relative">
                          {message.isEncrypted && <Lock className="absolute -left-2 -top-2 w-4 h-4 text-green-500 z-10" />}
                          <EncryptedFileContent
                            message={message}
                            attachment={attachment}
                            decryptedFiles={decryptedFiles}
                            decryptFileContent={decryptFileContent}
                            decryptVersion={decryptVersion}
                            renderComponent={(url, isLoading, hasError) => {
                              if (isLoading) return <div className="p-3 bg-gray-100 rounded text-xs flex items-center"><Lock className="w-4 h-4 animate-pulse mr-2" /> Đang giải mã Audio...</div>;
                              if (hasError || !url) {
                                return (
                                  <div className={`p-2 rounded text-xs flex items-center ${unlockedPrivateKey ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'}`}>
                                    <Lock className="w-4 h-4 mr-2" />
                                    {unlockedPrivateKey ? t('encryption.decryptFailed') : 'Tệp mã hóa'}
                                  </div>
                                );
                              }

                              return (
                                <AudioPlayer
                                  fileUrl={url} // url here points to the blob: or plain normalized url
                                  fileName={attachment.fileName}
                                />
                              );
                            }}
                          />
                        </div>
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
                      src={normalizeFileUrlHelper(currentUser.avatar)}
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

      {/* Unlock E2EE Password Prompt (chỉ khi chưa mở khóa) */}
      {showPasswordPrompt && !unlockedPrivateKey && (
        <div className="p-4 bg-blue-50 dark:bg-gray-800 border-t border-blue-200 dark:border-blue-900">
          <div className="flex items-center mb-2">
            <Lock className="w-4 h-4 text-blue-600 dark:text-blue-400 mr-2" />
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
              Mở khóa tin nhắn mã hóa
            </span>
            <button
              onClick={() => setShowPasswordPrompt(false)}
              className="ml-auto text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
            Nhập mật khẩu tài khoản để giải mã khóa riêng tư và xem tin nhắn.
          </p>
          <div className="flex space-x-2">
            <input
              type="password"
              value={decryptPassword}
              onChange={(e) => {
                setDecryptPassword(e.target.value);
                setDecryptError('');
              }}
              placeholder="Nhập mật khẩu"
              className="flex-1 px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && decryptPassword) {
                  handleUnlockKeys();
                }
              }}
            />
            <button
              onClick={handleUnlockKeys}
              disabled={!decryptPassword}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
            >
              <Unlock className="w-4 h-4 mr-1" />
              Mở khóa
            </button>
          </div>
          {decryptError && <p className="text-xs text-red-500 mt-1">{decryptError}</p>}
        </div>
      )}

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
