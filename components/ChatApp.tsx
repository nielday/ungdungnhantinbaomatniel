'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';
import { useTranslations } from 'next-intl';
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
  User,
  Menu,
  ArrowLeft,
  X,
  Video
} from 'lucide-react';
import ChatList from './ChatList';
import ChatWindow from './ChatWindow';
import UserSearch from './UserSearch';
import ProfileModal from './ProfileModal';
import CreateGroupModal from './CreateGroupModal';
import GroupManagementModal from './GroupManagementModal';
import SettingsModal from './SettingsModal';

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

export default function ChatApp() {
  const { user, logout, updateUser } = useAuth();
  const { socket } = useSocket();
  const t = useTranslations();

  // Handle user update with error handling
  const handleUserUpdate = (updatedUser: any) => {
    try {
      console.log('ChatApp - Handling user update:', updatedUser);
      console.log('ChatApp - Current user before update:', user);
      updateUser(updatedUser);
      console.log('ChatApp - User update completed');
    } catch (error) {
      console.error('ChatApp - User update error:', error);
    }
  };

  // Add error boundary for rendering
  if (!user) {
    console.log('ChatApp - No user found, showing loading');
    return (
      <div className="h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showGroupManagement, setShowGroupManagement] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSidebar, setShowSidebar] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user]);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    const handleGroupInfoUpdated = (data: any) => {
      console.log('Received group-info-updated event:', data);
      if (data.group) {
        handleGroupUpdated(data.group);
      }
    };

    socket.on('group-info-updated', handleGroupInfoUpdated);

    return () => {
      socket.off('group-info-updated', handleGroupInfoUpdated);
    };
  }, [socket]);

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setShowSidebar(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Touch gestures for mobile
  useEffect(() => {
    if (!isMobile) return;

    let startX = 0;
    let startY = 0;
    let currentX = 0;
    let currentY = 0;
    let isDragging = false;

    const handleTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      isDragging = true;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging) return;

      currentX = e.touches[0].clientX;
      currentY = e.touches[0].clientY;

      const deltaX = currentX - startX;
      const deltaY = currentY - startY;

      // Swipe right to open sidebar
      if (deltaX > 50 && Math.abs(deltaY) < 100) {
        setShowSidebar(true);
      }
    };

    const handleTouchEnd = () => {
      isDragging = false;
    };

    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isMobile]);

  const fetchConversations = async () => {
    try {
      console.log('ChatApp - fetchConversations called, user:', user);
      const token = localStorage.getItem('token');
      console.log('Fetching conversations...');
      console.log('ChatApp - Token for conversations:', token ? 'Present' : 'Missing');
      console.log('ChatApp - Token value:', token);

      if (!token) {
        console.error('ChatApp - No token found, cannot fetch conversations');
        setLoading(false);
        return;
      }

      // Fetch both private conversations and groups
      const [conversationsResponse, groupsResponse] = await Promise.all([
        fetch(`https://ungdungnhantinbaomatniel-production.up.railway.app/api/conversations`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          cache: 'no-cache'
        }),
        fetch(`https://ungdungnhantinbaomatniel-production.up.railway.app/api/groups`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          cache: 'no-cache'
        })
      ]);

      console.log('Conversations response status:', conversationsResponse.status);
      console.log('Groups response status:', groupsResponse.status);

      let allConversations: Conversation[] = [];

      // Fetch private conversations
      if (conversationsResponse.ok) {
        const conversationsData = await conversationsResponse.json();
        console.log('Conversations data:', conversationsData);
        allConversations = [...allConversations, ...conversationsData];
      } else {
        console.error('Conversations error:', await conversationsResponse.json());
      }

      // Fetch groups
      if (groupsResponse.ok) {
        const groupsData = await groupsResponse.json();
        console.log('Groups data:', groupsData);
        // Transform groups to conversation format
        const transformedGroups = groupsData.map((group: any) => ({
          _id: group._id,
          type: 'group' as const,
          participants: group.members || [], // Now members already have full user info
          name: group.name,
          avatar: group.avatar, // Group avatar for display
          lastMessage: null,
          lastMessageAt: group.updatedAt,
          createdBy: group.createdBy
        }));
        allConversations = [...allConversations, ...transformedGroups];
      } else {
        console.error('Groups error:', await groupsResponse.json());
      }

      console.log('All conversations:', allConversations);
      setConversations(allConversations);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      // Don't crash the app, just show empty conversations
      setConversations([]);
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

  const handleGroupCreated = (group: Conversation) => {
    setConversations(prev => [group, ...prev]);
    setActiveConversation(group);
    setShowCreateGroup(false);
  };

  const handleGroupUpdated = (updatedGroup: any) => {
    console.log('ChatApp - handleGroupUpdated called with:', updatedGroup);

    // Transform the updated group to match Conversation format
    const transformedGroup: Conversation = {
      _id: updatedGroup._id,
      type: 'group' as const,
      participants: updatedGroup.members || [], // members already have full user info from API
      name: updatedGroup.name,
      avatar: updatedGroup.avatar,
      lastMessage: null,
      lastMessageAt: updatedGroup.updatedAt,
      createdBy: updatedGroup.createdBy
    };

    console.log('ChatApp - Members data in transformed group:', transformedGroup.participants);

    console.log('ChatApp - Transformed group:', transformedGroup);

    setConversations(prev => {
      const updated = prev.map(conv => {
        if (conv._id === transformedGroup._id) {
          console.log('ChatApp - Updating conversation:', conv._id, 'with:', transformedGroup);
          return transformedGroup;
        }
        return conv;
      });
      console.log('ChatApp - Updated conversations:', updated);
      return updated;
    });

    if (activeConversation?._id === transformedGroup._id) {
      console.log('ChatApp - Updating active conversation with:', transformedGroup);
      setActiveConversation(transformedGroup);
    }
  };

  const handleSelectConversation = (conversation: Conversation) => {
    setActiveConversation(conversation);
    // Hide sidebar on mobile when conversation is selected
    if (isMobile) {
      setShowSidebar(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-gray-100 dark:bg-neutral-900 overflow-hidden">
      {/* Mobile Overlay */}
      {isMobile && showSidebar && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 z-40"
          onClick={() => setShowSidebar(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        ${isMobile ? 'fixed' : 'relative'} 
        ${isMobile ? (showSidebar ? 'translate-x-0' : '-translate-x-full') : ''}
        w-80 bg-white dark:bg-neutral-900 border-r border-gray-200 dark:border-neutral-700 flex flex-col z-50
        transition-transform duration-300 ease-in-out
        ${isMobile ? 'h-full' : ''}
      `}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-neutral-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-800 dark:text-white">{t('chat.messages')}</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('chat.messagingApp')}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {isMobile && (
                <button
                  onClick={() => setShowSidebar(false)}
                  className="icon-btn"
                  title={t('sidebar.closeMenu')}
                >
                  <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
              )}
              <button
                onClick={() => setShowCreateGroup(true)}
                className="icon-btn"
                title={t('sidebar.createGroup')}
              >
                <Users className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
              <button
                onClick={() => setShowUserSearch(true)}
                className="icon-btn"
                title={t('sidebar.searchUsers')}
              >
                <Search className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
              <button
                onClick={() => setShowSettings(true)}
                className="icon-btn"
                title={t('sidebar.settings')}
              >
                <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
              <button
                onClick={handleLogout}
                className="icon-btn"
                title={t('sidebar.logout')}
              >
                <LogOut className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
          </div>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-gray-200 dark:border-neutral-700">
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
              <p className="text-sm font-medium text-gray-800 dark:text-white truncate">
                {user?.fullName}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
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
            currentUserId={user?.id || ''}
            onSelectConversation={handleSelectConversation}
            onNewConversation={handleNewConversation}
          />
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Mobile Header */}
        {isMobile && (
          <div className="bg-white dark:bg-neutral-900 border-b border-gray-200 dark:border-neutral-700 p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowSidebar(true)}
                className="icon-btn"
                title={t('sidebar.menu')}
              >
                <Menu className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
              {activeConversation && (
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-800 dark:text-white">
                      {activeConversation.type === 'private'
                        ? activeConversation.participants?.find(p => p._id !== user?.id)?.fullName
                        : activeConversation.name
                      }
                    </h3>
                  </div>
                </div>
              )}
            </div>
            {activeConversation && (
              <div className="flex items-center space-x-2">
                <button className="icon-btn">
                  <Phone className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </button>
                <button className="icon-btn">
                  <Video className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </button>
              </div>
            )}
          </div>
        )}

        {activeConversation ? (
          <ChatWindow
            conversation={activeConversation}
            currentUser={user}
            onUpdateConversations={fetchConversations}
            onShowGroupManagement={() => setShowGroupManagement(true)}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-neutral-900">
            <div className="text-center px-4">
              <MessageCircle className="w-16 h-16 text-gray-300 dark:text-neutral-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-600 dark:text-gray-400 mb-2">
                {t('chat.selectConversation')}
              </h3>
              <p className="text-gray-500 dark:text-gray-500">
                {isMobile
                  ? t('chat.selectConversationMobile')
                  : t('chat.selectConversationDesktop')
                }
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
          onUserUpdate={handleUserUpdate}
        />
      )}

      {/* Create Group Modal */}
      {showCreateGroup && (
        <CreateGroupModal
          onClose={() => setShowCreateGroup(false)}
          onGroupCreated={handleGroupCreated}
        />
      )}

      {/* Group Management Modal */}
      {showGroupManagement && activeConversation && activeConversation.type === 'group' && (
        <GroupManagementModal
          conversation={activeConversation as any}
          currentUser={user}
          onClose={() => setShowGroupManagement(false)}
          onGroupUpdated={handleGroupUpdated}
        />
      )}

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </div>
  );
}
