'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import {
  MessageCircle,
  Users,
  Plus,
  Search,
  Phone,
  Mail
} from 'lucide-react';

interface Conversation {
  _id: string;
  type: 'private' | 'group';
  participants?: any[]; // Made optional to handle undefined cases
  name?: string; // Changed from groupName
  avatar?: string; // Changed from groupAvatar
  lastMessage?: any;
  lastMessageAt?: string;
  createdBy: any;
}

interface ChatListProps {
  conversations: Conversation[];
  activeConversation: Conversation | null;
  currentUserId: string;
  onSelectConversation: (conversation: Conversation) => void;
  onNewConversation: (conversation: Conversation) => void;
}

export default function ChatList({
  conversations,
  activeConversation,
  currentUserId,
  onSelectConversation,
  onNewConversation
}: ChatListProps) {
  const t = useTranslations();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredConversations = conversations.filter(conversation => {
    if (!searchQuery) return true;

    const searchLower = searchQuery.toLowerCase();

    if (conversation.type === 'group') {
      return conversation.name?.toLowerCase().includes(searchLower);
    } else {
      const otherParticipant = conversation.participants?.find(p => p._id !== activeConversation?.participants?.[0]?._id);
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
    if (conversation.type === 'group') {
      return conversation.avatar;
    } else {
      const otherParticipant = conversation.participants?.find(p => p._id !== currentUserId);
      return otherParticipant?.avatar;
    }
  };

  const getLastMessagePreview = (conversation: Conversation) => {
    if (!conversation.lastMessage) return t('chatList.noMessage');

    const message = conversation.lastMessage;
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

  return (
    <div className="flex flex-col h-full">
      {/* Unified Search Bar */}
      <div className="p-3">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
          <input
            type="text"
            placeholder={t('chatList.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-gray-100 dark:bg-neutral-800 rounded-full focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm text-gray-800 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="p-4 text-center text-gray-500 dark:text-gray-400">
            {searchQuery ? t('chatList.noResults') : t('chatList.noConversations')}
          </div>
        ) : (
          <div className="space-y-1">
            {filteredConversations.map((conversation, index) => (
              <motion.div
                key={conversation._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => onSelectConversation(conversation)}
                className={`p-4 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-neutral-800 ${activeConversation?._id === conversation._id ? 'bg-blue-50 dark:bg-blue-900/30 border-r-2 border-blue-500' : ''
                  }`}
              >
                <div className="flex items-center space-x-3">
                  {/* Avatar */}
                  <div className="relative">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      {getConversationAvatar(conversation) ? (
                        <img
                          src={getConversationAvatar(conversation)}
                          alt={getConversationName(conversation)}
                          className="w-12 h-12 rounded-full object-cover"
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
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {getLastMessagePreview(conversation)}
                      </p>
                      {conversation.type === 'group' && (
                        <div className="flex items-center text-xs text-gray-400 dark:text-gray-500">
                          <Users className="w-3 h-3 mr-1" />
                          {conversation.participants?.length || 0}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* New Chat Button */}
      <div className="p-4 border-t border-gray-200 dark:border-neutral-700">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-200 flex items-center justify-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>{t('chatList.newConversation')}</span>
        </motion.button>
      </div>
    </div>
  );
}
