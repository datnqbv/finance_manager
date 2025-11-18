import React, { useState, useRef, useEffect } from 'react';
import { FiX, FiMessageCircle } from 'react-icons/fi';
import Message from './Message';
import Input from './Input';
import { sendChatMessage } from '../../services/chat.service';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';

const Chatbot = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: 'Xin chào! Tôi là trợ lý Finance Manager được hỗ trợ bởi AI. Tôi có thể giúp bạn quản lý chi tiêu, thu nhập và mục tiêu tài chính. Bạn cần hỗ trợ gì?',
      isBot: true,
      timestamp: new Date()
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (text) => {
    const userMessage = {
      id: Date.now(),
      text,
      isBot: false,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await sendChatMessage(text);
      
      const botMessage = {
        id: Date.now() + 1,
        text: response.message,
        isBot: true,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Không thể gửi tin nhắn. Vui lòng thử lại!');
      
      const errorMessage = {
        id: Date.now() + 1,
        text: 'Xin lỗi, tôi đang gặp sự cố. Vui lòng thử lại sau.',
        isBot: true,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-600 
                   text-white rounded-full shadow-2xl hover:scale-110 transition-all duration-300 
                   flex items-center justify-center z-50 animate-bounce"
          aria-label="Open chatbot"
        >
          <FiMessageCircle size={24} />
        </button>
      )}

      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white dark:bg-gray-900 
                      rounded-2xl shadow-2xl flex flex-col z-50 border border-gray-200 dark:border-gray-700
                      animate-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-primary-500 to-primary-600 
                        text-white rounded-t-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <FiMessageCircle size={20} />
              </div>
              <div>
                <h3 className="font-semibold">Finance Assistant</h3>
                <p className="text-xs opacity-90">Trợ lý AI tài chính</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              aria-label="Close chatbot"
            >
              <FiX size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-800">
            {messages.map((message) => (
              <Message key={message.id} message={message} isBot={message.isBot} user={user} />
            ))}
            {isLoading && (
              <div className="flex gap-3 mb-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 
                              flex items-center justify-center text-white">
                  <FiMessageCircle size={16} />
                </div>
                <div className="flex-1">
                  <div className="inline-block bg-gray-100 dark:bg-gray-700 px-4 py-2 rounded-2xl">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <Input onSendMessage={handleSendMessage} disabled={isLoading} />
        </div>
      )}
    </>
  );
};

export default Chatbot;
