import React, { useState, useEffect } from 'react';
import { FiSend } from 'react-icons/fi';

const ChatInput = ({ onSendMessage, disabled }) => {
  const [message, setMessage] = useState('');
  const [placeholder, setPlaceholder] = useState('Nhập câu hỏi của bạn...');
  
  const placeholders = [
    'Hỏi tôi về chi tiêu của bạn...',
    'Cần tư vấn về ngân sách?',
    'Muốn biết tiến độ mục tiêu?',
    'Nhập câu hỏi của bạn...'
  ];

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      index = (index + 1) % placeholders.length;
      setPlaceholder(placeholders[index]);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} 
          className="border-t-2 border-gray-200 dark:border-gray-700 p-4 
                   bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-900
                   rounded-b-2xl">
      <div className="flex gap-3">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          disabled={disabled}
          className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 
                   bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                   placeholder:text-gray-400 dark:placeholder:text-gray-500
                   focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                   disabled:opacity-50 disabled:cursor-not-allowed
                   transition-all duration-200 shadow-sm"
        />
        <button
          type="submit"
          disabled={!message.trim() || disabled}
          className="px-5 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white 
                   rounded-xl hover:from-primary-600 hover:to-primary-700 
                   transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
                   flex items-center justify-center shadow-md hover:shadow-lg
                   hover:scale-105 active:scale-95"
        >
          <FiSend size={20} />
        </button>
      </div>
    </form>
  );
};

export default ChatInput;
