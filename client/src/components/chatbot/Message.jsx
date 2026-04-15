import React from 'react';
import { FiMessageCircle, FiUser } from 'react-icons/fi';

const ChatMessage = ({ message, isBot, user }) => {
  // Format message text with basic markdown-like rendering
  const formatMessage = (text) => {
    // Split by newlines and render
    return text.split('\n').map((line, index) => (
      <span key={index}>
        {line}
        {index < text.split('\n').length - 1 && <br />}
      </span>
    ));
  };

  return (
    <div className={`flex gap-3 animate-in fade-in slide-in-from-${isBot ? 'left' : 'right'}-4 duration-300 ${
      isBot ? '' : 'flex-row-reverse'
    }`}>
      <div className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center overflow-hidden 
                    shadow-md ${
        isBot 
          ? 'bg-gradient-to-br from-[#00523d] to-[#003d2d] text-white' 
          : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
      }`}>
        {isBot ? (
          <FiMessageCircle size={18} />
        ) : user?.avatar ? (
          <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#0a684e] to-[#00523d] 
                        flex items-center justify-center text-white font-bold text-sm">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
        )}
      </div>
      <div className={`flex-1 ${isBot ? 'text-left' : 'text-right'}`}>
        <div className={`inline-block max-w-[85%] px-4 py-3 rounded-2xl shadow-md 
                       transition-all hover:shadow-lg ${
          isBot
            ? 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 border border-gray-100 dark:border-gray-600'
            : 'bg-gradient-to-r from-[#00523d] to-[#003d2d] text-white'
        }`}>
          <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
            {formatMessage(message.text)}
          </p>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 px-2 flex items-center gap-1 ${
          isBot ? '' : 'justify-end'
        }">
          <span className="opacity-70">
            {new Date(message.timestamp).toLocaleTimeString('vi-VN', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </span>
        </p>
      </div>
    </div>
  );
};

export default ChatMessage;
