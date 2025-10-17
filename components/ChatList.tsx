'use client';

import React, { useState } from 'react';
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
  participants: any[];
  groupName?: string;
  groupAvatar?: string;
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
  const [searchQuery, setSearchQuery] = useState('');

  const filteredConversations = conversations.filter(conversation => {
    if (!searchQuery) return true;
    
    const searchLower = searchQuery.toLowerCase();
    
    if (conversation.type === 'group') {
      return conversation.groupName?.toLowerCase().includes(searchLower);
    } else {
      const otherParticipant = conversation.participants.find(p => p._id !== activeConversation?.participants?.[0]?._id);
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
      return conversation.groupName;
    } else {
      const otherParticipant = conversation.participants.find(p => p._id !== currentUserId);
      return otherParticipant?.fullName || otherParticipant?.phoneNumber;
    }
  };

  const getConversationAvatar = (conversation: Conversation) => {
    if (conversation.type === 'group') {
      return conversation.groupAvatar;
    } else {
      const otherParticipant = conversation.participants.find(p => p._id !== currentUserId);
      return otherParticipant?.avatar;
    }
  };

  const getLastMessagePreview = (conversation: Conversation) => {
    if (!conversation.lastMessage) return 'Chưa có tin nhắn';
    
    const message = conversation.lastMessage;
    if (message.messageType === 'text') {
      return message.content;
    } else if (message.messageType === 'image') {
      return '📷 Hình ảnh';
    } else if (message.messageType === 'file') {
      return '📎 File';
    } else if (message.messageType === 'audio') {
      return '🎵 Âm thanh';
    }
    return 'Tin nhắn mới';
  };

  return (
    <div className="flex flex-col h-full">
      {/* Search Bar */}
      <div className="p-4 border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Tìm kiếm cuộc trò chuyện..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            {searchQuery ? 'Không tìm thấy cuộc trò chuyện nào' : 'Chưa có cuộc trò chuyện nào'}
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
                className={`p-4 cursor-pointer transition-colors hover:bg-gray-50 ${
                  activeConversation?._id === conversation._id ? 'bg-blue-50 border-r-2 border-blue-500' : ''
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
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-sm font-medium text-gray-800 truncate">
                        {getConversationName(conversation)}
                      </h3>
                      <span className="text-xs text-gray-500">
                        {formatTime(conversation.lastMessageAt)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-500 truncate">
                        {getLastMessagePreview(conversation)}
                      </p>
                      {conversation.type === 'group' && (
                        <div className="flex items-center text-xs text-gray-400">
                          <Users className="w-3 h-3 mr-1" />
                          {conversation.participants.length}
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
      <div className="p-4 border-t border-gray-200">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-200 flex items-center justify-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Cuộc trò chuyện mới</span>
        </motion.button>
      </div>
    </div>
  );
}
