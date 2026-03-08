'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import {
  MessageCircle,
  Users,
  Plus,
  Search,
  Phone,
  Mail,
  FileText,
  X,
  Archive,
  Trash2,
  Ban
} from 'lucide-react';
import { normalizeFileUrlHelper } from '../lib/fileUtils';

interface Conversation {
  _id: string;
  type: 'private' | 'group';
  participants?: any[]; // Made optional to handle undefined cases
  name?: string; // Changed from groupName
  avatar?: string; // Changed from groupAvatar
  lastMessage?: any;
  lastMessageAt?: string;
  createdBy: any;
  isArchived?: boolean;
}

interface MessageSearchResult {
  _id: string;
  content: string;
  senderId: { _id: string; fullName: string; avatar?: string };
  conversationId: string;
  conversationInfo: {
    _id: string;
    type: 'private' | 'group';
    name?: string;
    avatar?: string;
    participants?: any[];
  };
  createdAt: string;
}

interface ChatListProps {
  conversations: Conversation[];
  activeConversation: Conversation | null;
  currentUserId: string;
  onSelectConversation: (conversation: Conversation) => void;
  onNewConversation: (conversation: Conversation) => void;
  onSelectMessage?: (conversationId: string, messageId: string) => void;
  onDeleteConversation?: (conversationId: string) => void;
  onArchiveConversation?: (conversationId: string) => void;
  onUnarchiveConversation?: (conversationId: string) => void;
  onBlockUser?: (userId: string, conversationId: string) => void;
}

// Sub-component cho từng hàng hội thoại có thể Swipe
const SwipeableConversationItem = ({
  conversation,
  activeConversation,
  currentUserId,
  onSelectConversation,
  getConversationAvatar,
  getConversationName,
  formatTime,
  getLastMessagePreview,
  onDelete,
  onArchive,
  onUnarchive,
  onBlock
}: any) => {
  const t = useTranslations();
  const [isSwiping, setIsSwiping] = useState(false);
  const [xOffset, setXOffset] = useState(0);

  const handleDragEnd = (event: any, info: any) => {
    setIsSwiping(false);
    // Nếu kéo sang trái một lực đủ lớn, và thả ra, chốt menu mở ra
    if (info.offset.x < -80) {
      setXOffset(-180); // Mở Menu ra (Đủ 3 nút x 60px)
    } else if (info.offset.x > 50) {
      setXOffset(0); // Đóng menu nếu kéo lại
    }
  };

  const handleDrag = (event: any, info: any) => {
    setIsSwiping(true);
  };

  const closeMenu = () => setXOffset(0);

  // Identify other participant for Blocking
  const otherParticipant = conversation.type === 'private'
    ? conversation.participants?.find((p: any) => p._id !== currentUserId)
    : null;

  return (
    <div className="relative overflow-hidden w-full group">
      {/* Background Actions Layer (nằm dưới thẻ trò chuyện) */}
      <div className="absolute right-0 top-0 bottom-0 flex h-full items-center justify-end bg-gray-100 dark:bg-neutral-900 border-b border-gray-100 dark:border-neutral-800">
        {/* Nút Chặn (Màu xám đen/cam) - Chỉ ở Private Chat */}
        {conversation.type === 'private' && (
          <button
            onClick={(e) => { e.stopPropagation(); closeMenu(); onBlock && onBlock(otherParticipant?._id, conversation._id); }}
            className="h-full w-[60px] flex flex-col items-center justify-center bg-gray-500 text-white"
          >
            <Ban className="w-5 h-5 mb-1" />
            <span className="text-[10px]">Chặn</span>
          </button>
        )}

        {/* Nút Phục hồi (Chỉ hiện khi đang ở Lưu trữ, thay cho Lưu) */}
        {conversation.isArchived ? (
          <button
            onClick={(e) => { e.stopPropagation(); closeMenu(); onUnarchive && onUnarchive(conversation._id); }}
            className="h-full w-[60px] flex flex-col items-center justify-center bg-blue-500 text-white"
          >
            <Archive className="w-5 h-5 mb-1" />
            <span className="text-[10px]">Hủy Lưu</span>
          </button>
        ) : (
          <button
            onClick={(e) => { e.stopPropagation(); closeMenu(); onArchive && onArchive(conversation._id); }}
            className="h-full w-[60px] flex flex-col items-center justify-center bg-indigo-500 text-white"
          >
            <Archive className="w-5 h-5 mb-1" />
            <span className="text-[10px]">Lưu</span>
          </button>
        )}

        {/* Nút Xóa (Màu Đỏ) */}
        <button
          onClick={(e) => { e.stopPropagation(); closeMenu(); onDelete && onDelete(conversation._id); }}
          className="h-full w-[60px] flex flex-col items-center justify-center bg-red-500 text-white"
        >
          <Trash2 className="w-5 h-5 mb-1" />
          <span className="text-[10px]">Xóa</span>
        </button>
      </div>

      {/* Foreground Chat Item Layer (Cái hiển thị lên trên) */}
      <motion.div
        drag="x"
        dragConstraints={{ left: conversation.type === 'private' ? -180 : -120, right: 0 }}
        dragElastic={0.1}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        animate={{ x: xOffset }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        onClick={() => {
          if (xOffset !== 0) closeMenu(); // Nếu đang mở hành động thì nhấn vào chỉ đóng lại
          else if (!isSwiping) onSelectConversation(conversation); // Nếu đang bình thường thì mở box chat
        }}
        className={`relative z-10 w-full p-4 cursor-pointer transition-colors bg-white hover:bg-gray-50 dark:bg-neutral-900 dark:hover:bg-neutral-800 border-b border-gray-100 dark:border-neutral-800 ${activeConversation?._id === conversation._id ? 'bg-blue-50 dark:bg-blue-900/30 border-r-2 border-blue-500' : ''
          }`}
      >
        <div className="flex items-center space-x-3 pointer-events-none">
          {/* Avatar */}
          <div className="relative">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center overflow-hidden">
              {getConversationAvatar(conversation) ? (
                <img
                  src={normalizeFileUrlHelper(getConversationAvatar(conversation))}
                  alt={getConversationName(conversation)}
                  className="w-12 h-12 rounded-full object-cover"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              ) : conversation.type === 'group' ? (
                <Users className="w-6 h-6 text-white" />
              ) : (
                <MessageCircle className="w-6 h-6 text-white" />
              )}
            </div>
            {conversation.type === 'group' && (
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-neutral-900"></div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-medium text-gray-800 dark:text-white truncate">
                {getConversationName(conversation)}
              </h3>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {formatTime(conversation.lastMessageAt)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                {getLastMessagePreview(conversation)}
              </p>
              {conversation.type === 'group' && (
                <span className="flex items-center text-xs text-gray-400 ml-2">
                  <Users className="w-3 h-3 mr-1" />
                  {conversation.participants?.length || 0}
                </span>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default function ChatList({
  conversations,
  activeConversation,
  currentUserId,
  onSelectConversation,
  onNewConversation,
  onSelectMessage,
  onDeleteConversation,
  onArchiveConversation,
  onUnarchiveConversation,
  onBlockUser
}: ChatListProps) {
  const t = useTranslations();
  const [activeTab, setActiveTab] = useState<'all' | 'archived'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [messageResults, setMessageResults] = useState<MessageSearchResult[]>([]);
  const [isSearchingMessages, setIsSearchingMessages] = useState(false);
  const [showMessageResults, setShowMessageResults] = useState(false);

  // Debounced message search
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setMessageResults([]);
      setShowMessageResults(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingMessages(true);
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'https://ungdungnhantinbaomatniel-production.up.railway.app/api'}/messages/search/all?q=${encodeURIComponent(searchQuery.trim())}&limit=10`,
          {
            credentials: 'include'
          }
        );

        if (response.ok) {
          const data = await response.json();
          setMessageResults(data);
          setShowMessageResults(true);
        }
      } catch (error) {
        console.error('Message search error:', error);
      } finally {
        setIsSearchingMessages(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const filteredConversations = conversations.filter(conversation => {
    // 1. Filter by Tab (Archived/All)
    if (activeTab === 'all' && conversation.isArchived) return false;
    if (activeTab === 'archived' && !conversation.isArchived) return false;

    // 2. Filter by Search Query
    if (!searchQuery) return true;

    const searchLower = searchQuery.toLowerCase();

    if (conversation.type === 'group') {
      return conversation.name?.toLowerCase().includes(searchLower);
    } else {
      const otherParticipant = conversation.participants?.find((p: any) => p._id !== currentUserId);
      return otherParticipant?.fullName?.toLowerCase().includes(searchLower) ||
        otherParticipant?.phoneNumber?.includes(searchQuery);
    }
  });

  const formatTime = (dateString?: string) => {
    if (!dateString) return '';

    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString('vi-VN', {
        weekday: 'short'
      });
    } else {
      return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit'
      });
    }
  };

  const getConversationName = (conversation: Conversation) => {
    if (conversation.type === 'group') {
      return conversation.name;
    } else {
      const otherParticipant = conversation.participants?.find(p => p._id !== currentUserId);
      return otherParticipant?.fullName || otherParticipant?.phoneNumber || t('common.unknownUser');
    }
  };

  const getConversationAvatar = (conversation: Conversation) => {
    let avatar: string | undefined;
    if (conversation.type === 'group') {
      avatar = conversation.avatar;
    } else {
      const otherParticipant = conversation.participants?.find(p => p._id !== currentUserId);
      avatar = otherParticipant?.avatar;
    }

    // Apply B2 proxy if needed
    if (avatar && (avatar.includes('backblazeb2.com') || avatar.includes('backblaze.com'))) {
      return `${process.env.NEXT_PUBLIC_API_URL || 'https://ungdungnhantinbaomatniel-production.up.railway.app/api'}/files/proxy?fileUrl=${encodeURIComponent(avatar)}`;
    }
    return avatar;
  };

  const getLastMessagePreview = (conversation: Conversation) => {
    if (!conversation.lastMessage) {
      return t('chatList.noMessages');
    }
    const message = conversation.lastMessage;
    if (message.isDeleted) {
      return t('chat.messageDeleted');
    }
    if (message.isEncrypted) {
      return '🔒 ' + t('encryption.encryptedMessage');
    }
    if (message.messageType === 'text') {
      return message.content;
    } else if (message.messageType === 'image') {
      return `📷 ${t('chatList.image')}`;
    } else if (message.messageType === 'file') {
      return `📎 ${t('chatList.file')}`;
    } else if (message.messageType === 'audio') {
      return `🎵 ${t('chatList.audio')}`;
    }
    return t('chatList.newMessage');
  };

  const getMessageConversationName = (result: MessageSearchResult) => {
    // For groups, use the name
    if (result.conversationInfo?.type === 'group') {
      return result.conversationInfo.name || t('common.group');
    }

    // For private chats, find the other participant
    const participants = result.conversationInfo?.participants;
    if (participants && participants.length > 0) {
      const otherParticipant = participants.find(
        (p: any) => p._id?.toString() !== currentUserId && p._id !== currentUserId
      );
      if (otherParticipant?.fullName) {
        return otherParticipant.fullName;
      }
    }

    // Fallback: try to get from sender info if it's not the current user
    if (result.senderId && result.senderId._id !== currentUserId) {
      return result.senderId.fullName || t('common.unknownUser');
    }

    return t('common.unknownUser');
  };

  const handleMessageClick = (result: MessageSearchResult) => {
    // Get conversation ID as string
    const conversationId = result.conversationInfo?._id?.toString() || result.conversationId?.toString();

    console.log('handleMessageClick:', { conversationId, result });

    // Find the conversation - compare as strings
    const conv = conversations.find(c =>
      c._id === conversationId || c._id?.toString() === conversationId
    );

    console.log('Found conversation:', conv);

    if (conv) {
      onSelectConversation(conv);
      // Optionally notify parent to scroll to message
      if (onSelectMessage) {
        onSelectMessage(conversationId, result._id);
      }
    } else {
      console.log('Conversation not found in list, available:', conversations.map(c => c._id));
    }

    setSearchQuery('');
    setShowMessageResults(false);
  };

  const highlightText = (text: string, query: string) => {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <span key={i} className="bg-yellow-200 dark:bg-yellow-600">{part}</span>
      ) : (
        part
      )
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Unified Search Bar */}
      <div className="p-3">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
          <input
            type="text"
            placeholder={t('chatList.searchAllPlaceholder') || 'Tìm cuộc trò chuyện, tin nhắn...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-10 py-3 bg-gray-100 dark:bg-neutral-800 rounded-full focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm text-gray-800 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setShowMessageResults(false);
              }}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Sub-tabs for All / Archived */}
        <div className="flex border-b border-gray-200 dark:border-neutral-700 mt-2">
          <button
            onClick={() => setActiveTab('all')}
            className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'all'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
          >
            Tất cả
          </button>
          <button
            onClick={() => setActiveTab('archived')}
            className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'archived'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
          >
            Đã lưu trữ
          </button>
        </div>
      </div>

      {/* Message Search Results */}
      {showMessageResults && searchQuery.trim().length >= 2 && (
        <div className="border-b border-gray-200 dark:border-neutral-700">
          <div className="px-4 py-2 bg-gray-50 dark:bg-neutral-800 flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center">
              <FileText className="w-3 h-3 mr-1" />
              {t('chatList.messageResults') || 'Kết quả tin nhắn'}
            </span>
            {isSearchingMessages && (
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-500"></div>
            )}
          </div>

          {messageResults.length > 0 ? (
            <div className="max-h-48 overflow-y-auto">
              {messageResults.map((result) => (
                <div
                  key={result._id}
                  onClick={() => handleMessageClick(result)}
                  className="px-4 py-2 hover:bg-gray-50 dark:hover:bg-neutral-800 cursor-pointer border-b border-gray-100 dark:border-neutral-700 last:border-b-0"
                >
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-blue-600 dark:text-blue-400 font-medium truncate">
                        {getMessageConversationName(result)}
                      </p>
                      <p className="text-sm text-gray-800 dark:text-gray-200 truncate">
                        {highlightText(result.content.substring(0, 60), searchQuery)}
                        {result.content.length > 60 && '...'}
                      </p>
                      <p className="text-xs text-gray-400">
                        {result.senderId?.fullName} • {formatTime(result.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : !isSearchingMessages ? (
            <div className="px-4 py-3 text-center text-sm text-gray-500 dark:text-gray-400">
              {t('chatList.noMessageResults') || 'Không tìm thấy tin nhắn'}
            </div>
          ) : null}
        </div>
      )}

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="p-4 text-center text-gray-500 dark:text-gray-400">
            {searchQuery ? t('chatList.noResults') : t('chatList.noConversations')}
          </div>
        ) : (
          <div className="space-y-1">
            {filteredConversations.map((conversation, index) => (
              <SwipeableConversationItem
                key={conversation._id}
                conversation={conversation}
                activeConversation={activeConversation}
                currentUserId={currentUserId}
                onSelectConversation={onSelectConversation}
                getConversationAvatar={getConversationAvatar}
                getConversationName={getConversationName}
                formatTime={formatTime}
                getLastMessagePreview={getLastMessagePreview}
                onDelete={onDeleteConversation}
                onArchive={onArchiveConversation}
                onUnarchive={onUnarchiveConversation}
                onBlock={onBlockUser}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
