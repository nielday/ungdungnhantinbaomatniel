'use client';

import React, { useState, useEffect } from 'react';
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
  ShieldCheck
} from 'lucide-react';

interface User {
  _id: string;
  fullName: string;
  phoneNumber: string;
  avatar?: string;
}

interface GroupMember extends User {
  role?: 'admin' | 'member';
  joinedAt: string;
}

interface Conversation {
  _id: string;
  type: 'group';
  participants: GroupMember[];
  groupName: string;
  groupDescription?: string;
  groupAvatar?: string;
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
  const [activeTab, setActiveTab] = useState<'members' | 'settings'>('members');
  const [searchQuery, setSearchQuery] = useState('');
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [groupName, setGroupName] = useState(conversation.groupName);
  const [groupDescription, setGroupDescription] = useState(conversation.groupDescription || '');
  const [isEditing, setIsEditing] = useState(false);

  const isAdmin = conversation.createdBy._id === currentUser?.id;

  useEffect(() => {
    if (showAddMembers && searchQuery.trim()) {
      searchUsers();
    }
  }, [searchQuery, showAddMembers]);

  const searchUsers = async () => {
    try {
      setSearchLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(
        `https://ungdungnhantinbaomatniel-production.up.railway.app/api/users/search?q=${encodeURIComponent(searchQuery)}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        // Filter out users already in group
        const filteredUsers = data.filter((user: User) => 
          !conversation.participants.some(member => member._id === user._id)
        );
        setAvailableUsers(filteredUsers);
      }
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleAddMember = async (userId: string) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(
        `https://ungdungnhantinbaomatniel-production.up.railway.app/api/conversations/${conversation._id}/members`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ userId })
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
        alert(error.message || 'Không thể thêm thành viên');
      }
    } catch (error) {
      console.error('Error adding member:', error);
      alert('Có lỗi xảy ra khi thêm thành viên');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa thành viên này khỏi nhóm?')) {
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(
        `https://ungdungnhantinbaomatniel-production.up.railway.app/api/conversations/${conversation._id}/members/${userId}`,
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
        alert(error.message || 'Không thể xóa thành viên');
      }
    } catch (error) {
      console.error('Error removing member:', error);
      alert('Có lỗi xảy ra khi xóa thành viên');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateGroup = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(
        `https://ungdungnhantinbaomatniel-production.up.railway.app/api/conversations/${conversation._id}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            groupName: groupName.trim(),
            groupDescription: groupDescription.trim()
          })
        }
      );

      if (response.ok) {
        const updatedGroup = await response.json();
        onGroupUpdated(updatedGroup);
        setIsEditing(false);
      } else {
        const error = await response.json();
        alert(error.message || 'Không thể cập nhật nhóm');
      }
    } catch (error) {
      console.error('Error updating group:', error);
      alert('Có lỗi xảy ra khi cập nhật nhóm');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
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
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              {conversation.groupAvatar ? (
                <img 
                  src={conversation.groupAvatar} 
                  alt={conversation.groupName}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <Users className="w-6 h-6 text-white" />
              )}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800">
                {conversation.groupName}
              </h2>
              <p className="text-sm text-gray-500">
                {conversation.participants.length} thành viên
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
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'members'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <Users className="w-4 h-4" />
                <span>Thành viên</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'settings'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <Settings className="w-4 h-4" />
                <span>Cài đặt</span>
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
                    <span>Thêm thành viên</span>
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
                      placeholder="Tìm kiếm người dùng..."
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
                                Thêm
                              </button>
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
              )}

              {/* Members List */}
              <div className="space-y-2">
                {conversation.participants.map((member) => (
                  <div
                    key={member._id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                        {member.avatar ? (
                          <img 
                            src={member.avatar} 
                            alt={member.fullName}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-white text-sm font-medium">
                            {member.fullName.charAt(0).toUpperCase()}
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
                          {member.phoneNumber} • Tham gia {formatDate(member.joinedAt)}
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
                  {/* Group Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tên nhóm
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
                            {loading ? 'Đang lưu...' : 'Lưu'}
                          </button>
                          <button
                            onClick={() => {
                              setIsEditing(false);
                              setGroupName(conversation.groupName);
                              setGroupDescription(conversation.groupDescription || '');
                            }}
                            className="px-3 py-1 border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50 transition-colors"
                          >
                            Hủy
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-800">{conversation.groupName}</span>
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
                      Mô tả nhóm
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
                          {conversation.groupDescription || 'Chưa có mô tả'}
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
                    Chỉ quản trị viên mới có thể chỉnh sửa cài đặt nhóm
                  </p>
                </div>
              )}

              {/* Group Info */}
              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Thông tin nhóm</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Tạo bởi:</span>
                    <span>{conversation.createdBy.fullName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Số thành viên:</span>
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
            Đóng
          </button>
        </div>
      </motion.div>
    </div>
  );
}
