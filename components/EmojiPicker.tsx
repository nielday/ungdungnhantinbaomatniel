'use client';

import React, { useState } from 'react';
import EmojiPicker, { EmojiClickData, EmojiStyle, Theme } from 'emoji-picker-react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Smile } from 'lucide-react';

interface EmojiPickerProps {
  onEmojiClick: (emoji: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

export default function EmojiPickerComponent({ onEmojiClick, onClose, isOpen }: EmojiPickerProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    onEmojiClick(emojiData.emoji);
    onClose();
  };

  const popularEmojis = [
    '😀', '😂', '😍', '🥰', '😘', '😊', '😉', '😎', '🤔', '😮',
    '😢', '😭', '😡', '🤬', '😱', '😨', '😴', '🤤', '😋', '🤗',
    '👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '👏', '🙌', '👐',
    '❤️', '💕', '💖', '💗', '💘', '💙', '💚', '💛', '🧡', '💜',
    '🎉', '🎊', '🎈', '🎁', '🎂', '🍰', '🍕', '🍔', '🍟', '🌮',
    '🔥', '💯', '⭐', '🌟', '✨', '💫', '🌈', '☀️', '🌙', '🌺'
  ];

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
          className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 max-h-[500px] overflow-hidden"
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

          {/* Popular Emojis */}
          <div className="p-4 border-b border-gray-200">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Phổ biến</h4>
            <div className="grid grid-cols-10 gap-2">
              {popularEmojis.map((emoji, index) => (
                <button
                  key={index}
                  onClick={() => handleEmojiClick({ emoji } as EmojiClickData)}
                  className="w-8 h-8 flex items-center justify-center text-lg hover:bg-gray-100 rounded-lg transition-colors"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Full Emoji Picker */}
          <div className="max-h-[300px] overflow-y-auto">
            <EmojiPicker
              onEmojiClick={handleEmojiClick}
              emojiStyle={EmojiStyle.NATIVE}
              theme={Theme.LIGHT}
              searchDisabled={false}
              skinTonesDisabled={false}
              width="100%"
              height={300}
              previewConfig={{
                showPreview: false
              }}
              searchPlaceHolder="Tìm emoji..."
              categories={[
                {
                  name: "Smileys & Emotion",
                  category: "smileys_emotion" as any
                },
                {
                  name: "People & Body",
                  category: "people_body" as any
                },
                {
                  name: "Animals & Nature",
                  category: "animals_nature" as any
                },
                {
                  name: "Food & Drink",
                  category: "food_drink" as any
                },
                {
                  name: "Travel & Places",
                  category: "travel_places" as any
                },
                {
                  name: "Activities",
                  category: "activities" as any
                },
                {
                  name: "Objects",
                  category: "objects" as any
                },
                {
                  name: "Symbols",
                  category: "symbols" as any
                },
                {
                  name: "Flags",
                  category: "flags" as any
                }
              ]}
            />
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
