'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';
import { motion } from 'framer-motion';
import { 
  MessageCircle, 
  Users, 
  Search, 
  Plus, 
  Settings, 
  LogOut,
  Phone,
  Mail,
  User
} from 'lucide-react';
import ChatList from './ChatList';
import ChatWindow from './ChatWindow';
import UserSearch from './UserSearch';
import ProfileModal from './ProfileModal';

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

export default function ChatApp() {
  const { user, logout } = useAuth();
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user]);

  const fetchConversations = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('Fetching conversations...');
      console.log('ChatApp - Token for conversations:', token ? 'Present' : 'Missing');
      console.log('ChatApp - Token value:', token);
      
      const response = await fetch(`https://ungdungnhantinbaomatniel-production.up.railway.app/api/conversations`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        cache: 'no-cache'
      });
      
      console.log('Conversations response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Conversations data:', data);
        setConversations(data);
      } else {
        const errorData = await response.json();
        console.error('Conversations error:', errorData);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
  };

  const handleNewConversation = (conversation: Conversation) => {
    setConversations(prev => [conversation, ...prev]);
    setActiveConversation(conversation);
    setShowUserSearch(false);
  };

  const handleSelectConversation = (conversation: Conversation) => {
    setActiveConversation(conversation);
  };

  if (loading) {
    return (
      <div className="h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-800">Tin nhắn</h1>
                <p className="text-sm text-gray-500">Ứng dụng nhắn tin</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowUserSearch(true)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Tìm kiếm người dùng"
              >
                <Search className="w-5 h-5 text-gray-600" />
              </button>
              <button
                onClick={() => setShowProfile(true)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Cài đặt"
              >
                <Settings className="w-5 h-5 text-gray-600" />
              </button>
              <button
                onClick={handleLogout}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Đăng xuất"
              >
                <LogOut className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
              {user?.avatar ? (
                <img 
                  src={user.avatar} 
                  alt={user.fullName}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <User className="w-6 h-6 text-white" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">
                {user?.fullName}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {user?.phoneNumber}
              </p>
            </div>
          </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-hidden">
          <ChatList
            conversations={conversations}
            activeConversation={activeConversation}
            onSelectConversation={handleSelectConversation}
            onNewConversation={handleNewConversation}
          />
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {activeConversation ? (
          <ChatWindow
            conversation={activeConversation}
            currentUser={user}
            onUpdateConversations={fetchConversations}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">
                Chọn cuộc trò chuyện
              </h3>
              <p className="text-gray-500">
                Chọn một cuộc trò chuyện từ danh sách bên trái để bắt đầu nhắn tin
              </p>
            </div>
          </div>
        )}
      </div>

      {/* User Search Modal */}
      {showUserSearch && (
        <UserSearch
          onClose={() => setShowUserSearch(false)}
          onNewConversation={handleNewConversation}
        />
      )}

      {/* Profile Modal */}
      {showProfile && (
        <ProfileModal
          user={user}
          onClose={() => setShowProfile(false)}
          onUpdateProfile={fetchConversations}
        />
      )}
    </div>
  );
}
