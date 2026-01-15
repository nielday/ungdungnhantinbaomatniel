'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import {
  X,
  Users,
  Settings,
  UserPlus,
  UserMinus,
  Crown,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Shield,
  ShieldCheck,
  Camera,
  Image as ImageIcon,
  Upload
} from 'lucide-react';

interface User {
  _id: string;
  fullName: string;
  phoneNumber: string;
  avatar?: string;
}

interface GroupMember extends User {
  role?: 'admin' | 'member';
  joinedAt: Date | string;
}

interface Conversation {
  _id: string;
  type: 'group';
  participants: GroupMember[];
  name: string;
  description?: string;
  avatar?: string;
  createdBy: User;
}

interface GroupManagementModalProps {
  conversation: Conversation;
  currentUser: any;
  onClose: () => void;
  onGroupUpdated: (group: Conversation) => void;
}

export default function GroupManagementModal({
  conversation,
  currentUser,
  onClose,
  onGroupUpdated
}: GroupManagementModalProps) {
  const t = useTranslations();
  const [activeTab, setActiveTab] = useState<'members' | 'settings'>('members');
  const [searchQuery, setSearchQuery] = useState('');
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [groupName, setGroupName] = useState(conversation.name);
  const [groupDescription, setGroupDescription] = useState(conversation.description || '');
  const [isEditing, setIsEditing] = useState(false);
  const [groupAvatar, setGroupAvatar] = useState(conversation.avatar || null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const isAdmin = conversation.createdBy._id === currentUser?.id;

  // Helper function to get proxied avatar URL
  const getProxiedAvatar = (avatarUrl: string | undefined | null): string | undefined => {
    if (!avatarUrl) return undefined;
    if (avatarUrl.includes('backblazeb2.com') || avatarUrl.includes('backblaze.com')) {
      return `${process.env.NEXT_PUBLIC_API_URL || 'https://ungdungnhantinbaomatniel-production.up.railway.app/api'}/files/proxy?fileUrl=${encodeURIComponent(avatarUrl)}`;
    }
    return avatarUrl;
  };

  useEffect(() => {
    console.log('GroupManagementModal - Conversation avatar changed:', conversation.avatar);
    setGroupAvatar(conversation.avatar || null);
  }, [conversation.avatar]);

  // Sync groupName and groupDescription when conversation changes
  useEffect(() => {
    setGroupName(conversation.name);
    setGroupDescription(conversation.description || '');
  }, [conversation.name, conversation.description]);

  useEffect(() => {
    console.log('GroupManagementModal - Conversation data:', {
      id: conversation._id,
      name: conversation.name,
      avatar: conversation.avatar,
      participants: conversation.participants?.length,
      participantsData: conversation.participants
    });
  }, [conversation]);

  useEffect(() => {
    if (showAddMembers && searchQuery.trim()) {
      searchUsers();
    }
  }, [searchQuery, showAddMembers]);

  const searchUsers = async () => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setAvailableUsers([]);
      return;
    }

    try {
      setSearchLoading(true);
      const token = localStorage.getItem('token');
      console.log('GroupManagementModal - Searching users with query:', searchQuery);
      console.log('GroupManagementModal - Token:', token ? 'Present' : 'Missing');

      const response = await fetch(
        `https://ungdungnhantinbaomatniel-production.up.railway.app/api/users/search?q=${encodeURIComponent(searchQuery)}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('GroupManagementModal - Search response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('GroupManagementModal - Found users:', data.length);
        const filteredUsers = data.filter((user: User) =>
          !conversation.participants.some(member => member._id === user._id)
        );
        setAvailableUsers(filteredUsers);
      } else {
        const errorData = await response.json();
        console.error('GroupManagementModal - Search error:', errorData);
        setAvailableUsers([]);
      }
    } catch (error) {
      console.error('GroupManagementModal - Error searching users:', error);
      setAvailableUsers([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleAddMember = async (userId: string) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(
        `https://ungdungnhantinbaomatniel-production.up.railway.app/api/groups/${conversation._id}/members`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ memberId: userId })
        }
      );

      if (response.ok) {
        const updatedGroup = await response.json();
        onGroupUpdated(updatedGroup);
        setShowAddMembers(false);
        setSearchQuery('');
        setAvailableUsers([]);
      } else {
        const error = await response.json();
        alert(error.message || t('group.addMemberFailed'));
      }
    } catch (error) {
      console.error('Error adding member:', error);
      alert(t('group.addMemberError'));
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!confirm(t('group.removeMemberConfirm'))) {
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(
        `https://ungdungnhantinbaomatniel-production.up.railway.app/api/groups/${conversation._id}/members/${userId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        const updatedGroup = await response.json();
        onGroupUpdated(updatedGroup);
      } else {
        const error = await response.json();
        alert(error.message || t('group.removeMemberFailed'));
      }
    } catch (error) {
      console.error('Error removing member:', error);
      alert(t('group.removeMemberError'));
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateGroup = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(
        `https://ungdungnhantinbaomatniel-production.up.railway.app/api/groups/${conversation._id}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: groupName.trim(),
            description: groupDescription.trim()
          })
        }
      );

      if (response.ok) {
        const updatedGroup = await response.json();
        console.log('Group description update response:', updatedGroup);

        console.log('Passing raw group data to ChatApp for description update:', updatedGroup);
        onGroupUpdated(updatedGroup);
        setIsEditing(false);
      } else {
        const error = await response.json();
        alert(error.message || t('group.updateFailed'));
      }
    } catch (error) {
      console.error('Error updating group:', error);
      alert(t('group.updateError'));
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (file: File) => {
    try {
      setIsUploadingAvatar(true);
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await fetch(
        `https://ungdungnhantinbaomatniel-production.up.railway.app/api/groups/${conversation._id}/avatar`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        }
      );

      if (response.ok) {
        const updatedGroup = await response.json();
        console.log('Avatar upload response:', updatedGroup);

        setGroupAvatar(updatedGroup.avatar);

        console.log('Passing raw group data to ChatApp:', updatedGroup);
        onGroupUpdated(updatedGroup);
      } else {
        const error = await response.json();
        alert(error.message || t('group.updateAvatarFailed'));
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      alert(t('group.updateAvatarError'));
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleAvatarFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert(t('camera.selectImage'));
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        alert(t('camera.imageTooLarge'));
        return;
      }

      handleAvatarUpload(file);
    }
  };

  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center overflow-hidden">
              {(groupAvatar || conversation.avatar) ? (
                <img
                  src={getProxiedAvatar(groupAvatar || conversation.avatar)}
                  alt={conversation.name}
                  className="w-10 h-10 rounded-full object-cover"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              ) : (
                <Users className="w-6 h-6 text-white" />
              )}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800">
                {conversation.name}
              </h2>
              <p className="text-sm text-gray-500">
                {conversation.participants.length} {t('group.members').toLowerCase()}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab('members')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${activeTab === 'members'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <Users className="w-4 h-4" />
                <span>{t('group.members')}</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${activeTab === 'settings'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <Settings className="w-4 h-4" />
                <span>{t('settings.title')}</span>
              </div>
            </button>
          </div>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Members Tab */}
          {activeTab === 'members' && (
            <div className="p-4">
              {/* Add Members Button */}
              {isAdmin && (
                <div className="mb-4">
                  <button
                    onClick={() => setShowAddMembers(!showAddMembers)}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>{t('group.addMember')}</span>
                  </button>
                </div>
              )}

              {/* Add Members Search */}
              {showAddMembers && (
                <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                  <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={t('group.searchMember')}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {searchQuery && (
                    <div className="max-h-40 overflow-y-auto">
                      {searchLoading ? (
                        <div className="text-center py-4">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
                        </div>
                      ) : availableUsers.length > 0 ? (
                        <div className="space-y-2">
                          {availableUsers.map((user) => (
                            <div
                              key={user._id}
                              className="flex items-center justify-between p-2 hover:bg-gray-100 rounded-lg"
                            >
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center overflow-hidden">
                                  {user.avatar ? (
                                    <img
                                      src={getProxiedAvatar(user.avatar)}
                                      alt={user.fullName}
                                      className="w-8 h-8 rounded-full object-cover"
                                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                    />
                                  ) : (
                                    <span className="text-white text-xs font-medium">
                                      {user.fullName?.charAt(0)?.toUpperCase() || 'U'}
                                    </span>
                                  )}
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-gray-800">
                                    {user.fullName}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {user.phoneNumber}
                                  </p>
                                </div>
                              </div>
                              <button
                                onClick={() => handleAddMember(user._id)}
                                disabled={loading}
                                className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 disabled:opacity-50 transition-colors"
                              >
                                {t('common.add')}
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-4 text-gray-500 text-sm">
                          {t('group.noMembersFound')}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Members List */}
              <div className="space-y-2">
                {conversation.participants.map((member) => (
                  <div
                    key={member._id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center overflow-hidden">
                        {member.avatar ? (
                          <img
                            src={getProxiedAvatar(member.avatar)}
                            alt={member.fullName}
                            className="w-10 h-10 rounded-full object-cover"
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          />
                        ) : (
                          <span className="text-white text-sm font-medium">
                            {member.fullName?.charAt(0)?.toUpperCase() || 'U'}
                          </span>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-medium text-gray-800">
                            {member.fullName}
                          </p>
                          {member._id === conversation.createdBy._id && (
                            <Crown className="w-4 h-4 text-yellow-500" />
                          )}
                        </div>
                        <p className="text-xs text-gray-500">
                          {member.phoneNumber} • {t('group.joinedAt')} {formatDate(member.joinedAt)}
                        </p>
                      </div>
                    </div>
                    {isAdmin && member._id !== conversation.createdBy._id && (
                      <button
                        onClick={() => handleRemoveMember(member._id)}
                        disabled={loading}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      >
                        <UserMinus className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="p-4 space-y-6">
              {isAdmin ? (
                <>
                  {/* Group Avatar */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('group.groupAvatar')}
                    </label>
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center overflow-hidden">
                        {groupAvatar ? (
                          <img
                            src={getProxiedAvatar(groupAvatar)}
                            alt="Group avatar"
                            className="w-full h-full object-cover"
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          />
                        ) : (
                          <Users className="w-8 h-8 text-white" />
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <label className="flex items-center space-x-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer transition-colors">
                          <Camera className="w-4 h-4" />
                          <span className="text-sm">{t('camera.capture')}</span>
                          <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            onChange={handleAvatarFileSelect}
                            className="hidden"
                            disabled={isUploadingAvatar}
                          />
                        </label>
                        <label className="flex items-center space-x-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer transition-colors">
                          <ImageIcon className="w-4 h-4" />
                          <span className="text-sm">{t('camera.gallery')}</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarFileSelect}
                            className="hidden"
                            disabled={isUploadingAvatar}
                          />
                        </label>
                      </div>
                      {isUploadingAvatar && (
                        <div className="flex items-center space-x-2 text-blue-600">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                          <span className="text-sm">{t('common.uploading')}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Group Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('group.groupName')}
                    </label>
                    {isEditing ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={groupName}
                          onChange={(e) => setGroupName(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          maxLength={50}
                        />
                        <div className="flex space-x-2">
                          <button
                            onClick={handleUpdateGroup}
                            disabled={loading || !groupName.trim()}
                            className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 disabled:opacity-50 transition-colors"
                          >
                            {loading ? t('common.saving') : t('common.save')}
                          </button>
                          <button
                            onClick={() => {
                              setIsEditing(false);
                              setGroupName(conversation.name);
                              setGroupDescription(conversation.description || '');
                            }}
                            className="px-3 py-1 border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50 transition-colors"
                          >
                            {t('common.cancel')}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-800">{conversation.name}</span>
                        <button
                          onClick={() => setIsEditing(true)}
                          className="p-1 hover:bg-gray-200 rounded transition-colors"
                        >
                          <Edit className="w-4 h-4 text-gray-600" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Group Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('group.groupDescription')}
                    </label>
                    {isEditing ? (
                      <textarea
                        value={groupDescription}
                        onChange={(e) => setGroupDescription(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        rows={3}
                        maxLength={200}
                      />
                    ) : (
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-800">
                          {conversation.description || t('group.noDescription')}
                        </span>
                        <button
                          onClick={() => setIsEditing(true)}
                          className="p-1 hover:bg-gray-200 rounded transition-colors"
                        >
                          <Edit className="w-4 h-4 text-gray-600" />
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">
                    {t('group.onlyAdminCanEdit')}
                  </p>
                </div>
              )}

              {/* Group Info */}
              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3">{t('group.groupInfo')}</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>{t('group.createdBy')}:</span>
                    <span>{conversation.createdBy.fullName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('group.memberCount')}:</span>
                    <span>{conversation.participants.length}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            {t('common.close')}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
