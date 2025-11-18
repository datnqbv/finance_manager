import React from 'react';
import { FiUser, FiMessageCircle } from 'react-icons/fi';

const ChatMessage = ({ message, isBot, user }) => {
  return (
    <div className={`flex gap-3 mb-4 ${isBot ? '' : 'flex-row-reverse'}`}>
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center overflow-hidden ${
        isBot 
          ? 'bg-gradient-to-br from-primary-500 to-primary-600 text-white' 
          : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
      }`}>
        {isBot ? (
          <FiMessageCircle size={16} />
        ) : user?.avatar ? (
          <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-semibold text-xs">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
        )}
      </div>
      <div className={`flex-1 ${isBot ? 'text-left' : 'text-right'}`}>
        <div className={`inline-block max-w-[80%] px-4 py-2 rounded-2xl ${
          isBot
            ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
            : 'bg-primary-500 text-white'
        }`}>
          <p className="text-sm whitespace-pre-wrap break-words">{message.text}</p>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 px-2">
          {new Date(message.timestamp).toLocaleTimeString('vi-VN', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </p>
      </div>
    </div>
  );
};

export default ChatMessage;
