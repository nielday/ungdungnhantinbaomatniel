'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
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
  Pause
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
}

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

interface ChatWindowProps {
  conversation: Conversation;
  currentUser: any;
  onUpdateConversations: () => void;
}

export default function ChatWindow({ conversation, currentUser, onUpdateConversations }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showFilePicker, setShowFilePicker] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchMessages();
  }, [conversation._id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/messages/${conversation._id}`,
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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async (content: string, messageType: 'text' = 'text', attachments?: any[]) => {
    if (!content.trim() && !attachments?.length) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/messages/${conversation._id}/${messageType}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            content,
            replyTo: replyingTo?._id
          })
        }
      );

      if (response.ok) {
        const newMsg = await response.json();
        setMessages(prev => [...prev, newMsg]);
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

  const handleFileUpload = async (files: FileList) => {
    const formData = new FormData();
    Array.from(files).forEach(file => {
      formData.append('files', file);
    });

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/messages/${conversation._id}/file`,
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
        setMessages(prev => [...prev, newMsg]);
        onUpdateConversations();
      }
    } catch (error) {
      console.error('Error uploading file:', error);
    }
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
      return { fullName: conversation.groupName, avatar: conversation.groupAvatar };
    }
    return conversation.participants.find(p => p._id !== currentUser?.id);
  };

  const otherParticipant = getOtherParticipant();

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải tin nhắn...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
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
                    {otherParticipant?.fullName?.charAt(0)}
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
                  ? `${conversation.participants.length} thành viên`
                  : 'Đang hoạt động'
                }
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <Phone className="w-5 h-5 text-gray-600" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <Video className="w-5 h-5 text-gray-600" />
            </button>
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
            <p>Chưa có tin nhắn nào</p>
            <p className="text-sm">Hãy bắt đầu cuộc trò chuyện!</p>
          </div>
        ) : (
          messages.map((message) => (
            <motion.div
              key={message._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${message.senderId._id === currentUser?.id ? 'justify-end' : 'justify-start'}`}
            >
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
                
                <div className={`rounded-lg p-3 ${
                  message.senderId._id === currentUser?.id 
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
                    <p className="text-sm">{message.content}</p>
                  )}
                  
                  {message.messageType === 'image' && message.attachments && (
                    <div className="space-y-2">
                      <p className="text-sm">{message.content}</p>
                      {message.attachments.map((attachment, index) => (
                        <div key={index} className="relative">
                          <img 
                            src={attachment.fileUrl} 
                            alt={attachment.fileName}
                            className="max-w-full h-auto rounded"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {message.messageType === 'file' && message.attachments && (
                    <div className="space-y-2">
                      <p className="text-sm">{message.content}</p>
                      {message.attachments.map((attachment, index) => (
                        <div key={index} className="flex items-center space-x-2 p-2 bg-gray-100 rounded">
                          <File className="w-4 h-4" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">{attachment.fileName}</p>
                            <p className="text-xs text-gray-500">{formatFileSize(attachment.fileSize)}</p>
                          </div>
                          <button className="p-1 hover:bg-gray-200 rounded">
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {message.messageType === 'audio' && message.attachments && (
                    <div className="space-y-2">
                      <p className="text-sm">{message.content}</p>
                      {message.attachments.map((attachment, index) => (
                        <div key={index} className="flex items-center space-x-2 p-2 bg-gray-100 rounded">
                          <button className="p-2 bg-blue-500 text-white rounded-full">
                            <Play className="w-4 h-4" />
                          </button>
                          <div className="flex-1">
                            <p className="text-xs font-medium">{attachment.fileName}</p>
                            <p className="text-xs text-gray-500">{formatFileSize(attachment.fileSize)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {message.isEdited && (
                    <p className="text-xs opacity-70 mt-1">Đã chỉnh sửa</p>
                  )}
                </div>
                
                {message.senderId._id === currentUser?.id && (
                  <div className="flex justify-end mt-1">
                    <span className="text-xs text-gray-400">
                      {formatTime(message.createdAt)}
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          ))
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
      <div className="p-4 bg-white border-t border-gray-200">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setShowFilePicker(!showFilePicker)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Paperclip className="w-5 h-5 text-gray-600" />
          </button>
          
          <div className="flex-1 relative">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Nhập tin nhắn..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {showFilePicker && (
              <div className="absolute bottom-full left-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg p-2">
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center space-x-2 px-3 py-2 hover:bg-gray-100 rounded"
                  >
                    <Image className="w-4 h-4" />
                    <span className="text-sm">Hình ảnh</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center space-x-2 px-3 py-2 hover:bg-gray-100 rounded"
                  >
                    <File className="w-4 h-4" />
                    <span className="text-sm">File</span>
                  </button>
                  <button
                    type="button"
                    className="flex items-center space-x-2 px-3 py-2 hover:bg-gray-100 rounded"
                  >
                    <Mic className="w-4 h-4" />
                    <span className="text-sm">Ghi âm</span>
                  </button>
                </div>
              </div>
            )}
          </div>
          
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Smile className="w-5 h-5 text-gray-600" />
          </button>
          
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
        
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,audio/*,.pdf,.doc,.docx,.txt"
          onChange={(e) => {
            if (e.target.files) {
              handleFileUpload(e.target.files);
              setShowFilePicker(false);
            }
          }}
          className="hidden"
        />
      </div>
    </div>
  );
}
