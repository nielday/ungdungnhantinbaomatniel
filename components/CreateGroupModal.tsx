'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  X, 
  Users, 
  Search, 
  Check, 
  UserPlus,
  Image as ImageIcon,
  Camera
} from 'lucide-react';

interface User {
  _id: string;
  fullName: string;
  phoneNumber: string;
  avatar?: string;
}

interface CreateGroupModalProps {
  onClose: () => void;
  onGroupCreated: (group: any) => void;
}

export default function CreateGroupModal({ onClose, onGroupCreated }: CreateGroupModalProps) {
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [groupAvatar, setGroupAvatar] = useState<string | null>(null);

  // Remove this useEffect - we don't need to fetch users on mount
  // useEffect(() => {
  //   fetchUsers();
  // }, []);

  const fetchUsers = async () => {
    // Don't search if query is too short
    if (!searchQuery || searchQuery.trim().length < 2) {
      setAvailableUsers([]);
      return;
    }

    try {
      setSearchLoading(true);
      const token = localStorage.getItem('token');
      console.log('CreateGroupModal - Searching users with query:', searchQuery);
      console.log('CreateGroupModal - Token:', token ? 'Present' : 'Missing');
      
      const response = await fetch(
        `https://ungdungnhantinbaomatniel-production.up.railway.app/api/users/search?q=${encodeURIComponent(searchQuery)}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('CreateGroupModal - Search response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('CreateGroupModal - Found users:', data.length);
        // Filter out already selected users
        const filteredUsers = data.filter((user: User) => 
          !selectedUsers.some(selected => selected._id === user._id)
        );
        setAvailableUsers(filteredUsers);
      } else {
        const errorData = await response.json();
        console.error('CreateGroupModal - Search error:', errorData);
        setAvailableUsers([]);
      }
    } catch (error) {
      console.error('CreateGroupModal - Error fetching users:', error);
      setAvailableUsers([]);
    } finally {
      setSearchLoading(false);
    }
  };

  useEffect(() => {
    if (searchQuery.trim()) {
      const timeoutId = setTimeout(() => {
        fetchUsers();
      }, 300);
      return () => clearTimeout(timeoutId);
    } else {
      setAvailableUsers([]);
    }
  }, [searchQuery, selectedUsers]);

  const handleUserSelect = (user: User) => {
    if (!selectedUsers.some(u => u._id === user._id)) {
      setSelectedUsers([...selectedUsers, user]);
    }
  };

  const handleUserRemove = (userId: string) => {
    setSelectedUsers(selectedUsers.filter(u => u._id !== userId));
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedUsers.length === 0) {
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(
        'https://ungdungnhantinbaomatniel-production.up.railway.app/api/groups',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: groupName.trim(),
            description: groupDescription.trim(),
            memberIds: selectedUsers.map(u => u._id)
          })
        }
      );

      if (response.ok) {
        const group = await response.json();
        onGroupCreated(group);
        onClose();
      } else {
        const error = await response.json();
        alert(error.message || 'Không thể tạo nhóm');
      }
    } catch (error) {
      console.error('Error creating group:', error);
      alert('Có lỗi xảy ra khi tạo nhóm');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setGroupAvatar(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">Tạo nhóm mới</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Group Avatar */}
          <div className="p-4 border-b border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ảnh nhóm (tùy chọn)
            </label>
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center overflow-hidden">
                {groupAvatar ? (
                  <img 
                    src={groupAvatar} 
                    alt="Group avatar" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Users className="w-8 h-8 text-white" />
                )}
              </div>
              <div className="flex space-x-2">
                <label className="flex items-center space-x-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer transition-colors">
                  <Camera className="w-4 h-4" />
                  <span className="text-sm">Chụp ảnh</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                </label>
                <label className="flex items-center space-x-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer transition-colors">
                  <ImageIcon className="w-4 h-4" />
                  <span className="text-sm">Thư viện</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Group Info */}
          <div className="p-4 border-b border-gray-200 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tên nhóm *
              </label>
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Nhập tên nhóm..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                maxLength={50}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mô tả nhóm (tùy chọn)
              </label>
              <textarea
                value={groupDescription}
                onChange={(e) => setGroupDescription(e.target.value)}
                placeholder="Nhập mô tả nhóm..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={3}
                maxLength={200}
              />
            </div>
          </div>

          {/* Search Users */}
          <div className="p-4 border-b border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Thêm thành viên
            </label>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm người dùng..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Search Results */}
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
                        onClick={() => handleUserSelect(user)}
                        className="flex items-center space-x-3 p-2 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors"
                      >
                        <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                          {user.avatar ? (
                            <img 
                              src={user.avatar} 
                              alt={user.fullName}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <span className="text-white text-xs font-medium">
                              {user.fullName.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">
                            {user.fullName}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {user.phoneNumber}
                          </p>
                        </div>
                        <UserPlus className="w-4 h-4 text-gray-400" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500 text-sm">
                    Không tìm thấy người dùng nào
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Selected Users */}
          {selectedUsers.length > 0 && (
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-700">
                  Thành viên đã chọn ({selectedUsers.length})
                </span>
                <span className="text-xs text-gray-500">
                  Tối đa 100 thành viên
                </span>
              </div>
              <div className="space-y-2">
                {selectedUsers.map((user) => (
                  <div
                    key={user._id}
                    className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg"
                  >
                    <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                      {user.avatar ? (
                        <img 
                          src={user.avatar} 
                          alt={user.fullName}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-white text-xs font-medium">
                          {user.fullName.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {user.fullName}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {user.phoneNumber}
                      </p>
                    </div>
                    <button
                      onClick={() => handleUserRemove(user._id)}
                      className="p-1 hover:bg-gray-200 rounded transition-colors"
                    >
                      <X className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={handleCreateGroup}
            disabled={!groupName.trim() || selectedUsers.length === 0 || loading}
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Đang tạo...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Tạo nhóm</span>
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
