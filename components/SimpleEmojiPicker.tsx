'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Smile } from 'lucide-react';

interface SimpleEmojiPickerProps {
  onEmojiClick: (emoji: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

export default function SimpleEmojiPicker({ onEmojiClick, onClose, isOpen }: SimpleEmojiPickerProps) {
  const emojiCategories = {
    'Cảm xúc': ['😀', '😂', '😍', '🥰', '😘', '😊', '😉', '😎', '🤔', '😮', '😢', '😭', '😡', '🤬', '😱', '😨', '😴', '🤤', '😋', '🤗'],
    'Cử chỉ': ['👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '👏', '🙌', '👐', '🤝', '👋', '🤚', '🖐️', '✋', '🖖', '👈', '👉', '👆', '🖕'],
    'Trái tim': ['❤️', '💕', '💖', '💗', '💘', '💙', '💚', '💛', '🧡', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖'],
    'Lễ hội': ['🎉', '🎊', '🎈', '🎁', '🎂', '🍰', '🎭', '🎪', '🎨', '🎯', '🎲', '🎳', '🎮', '🕹️', '🎰', '🎸', '🎵', '🎶', '🎤', '🎧'],
    'Đồ ăn': ['🍕', '🍔', '🍟', '🌮', '🌯', '🥙', '🌭', '🍖', '🍗', '🥩', '🍝', '🍜', '🍲', '🍛', '🍣', '🍱', '🍙', '🍚', '🍘', '🍥'],
    'Thiên nhiên': ['🌺', '🌸', '🌼', '🌻', '🌹', '🌷', '🌱', '🌿', '🍀', '🌾', '🌵', '🌴', '🌳', '🌲', '🌰', '🌰', '🌰', '🌰', '🌰', '🌰'],
    'Biểu tượng': ['🔥', '💯', '⭐', '🌟', '✨', '💫', '🌈', '☀️', '🌙', '🌚', '🌝', '🌛', '🌜', '🌕', '🌖', '🌗', '🌘', '🌑', '🌒', '🌓']
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 20 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 max-h-[600px] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <Smile className="w-5 h-5 text-yellow-500" />
              <h3 className="text-lg font-semibold text-gray-800">Chọn emoji</h3>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Emoji Categories */}
          <div className="max-h-[500px] overflow-y-auto p-4">
            {Object.entries(emojiCategories).map(([category, emojis]) => (
              <div key={category} className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-3">{category}</h4>
                <div className="grid grid-cols-10 gap-2">
                  {emojis.map((emoji, index) => (
                    <button
                      key={index}
                      onClick={() => onEmojiClick(emoji)}
                      className="w-10 h-10 flex items-center justify-center text-xl hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
