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
          className="border-t-2 border-[#d7e5de] dark:border-[#2b3c36] p-4 
                   bg-gradient-to-r from-white to-[#f0f7f3] dark:from-[#171b19] dark:to-[#1d2521]
                   rounded-b-2xl">
      <div className="flex gap-3">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          disabled={disabled}
          className="flex-1 px-4 py-3 rounded-xl border-2 border-[#c7d8cf] dark:border-[#355247] 
                   bg-white dark:bg-[#101714] text-gray-900 dark:text-white
                   placeholder:text-gray-400 dark:placeholder:text-gray-500
                   focus:outline-none focus:ring-2 focus:ring-[#2f8e6f] focus:border-[#2f8e6f]
                   disabled:opacity-50 disabled:cursor-not-allowed
                   transition-all duration-200 shadow-sm"
        />
        <button
          type="submit"
          disabled={!message.trim() || disabled}
          className="px-5 py-3 bg-gradient-to-r from-[#00523d] to-[#003d2d] text-white 
                   rounded-xl hover:from-[#0a684e] hover:to-[#00523d] 
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
