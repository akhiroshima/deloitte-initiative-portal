import React, { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import FeedbackModal from './FeedbackModal';

interface FeedbackButtonProps {
  className?: string;
}

const FeedbackButton: React.FC<FeedbackButtonProps> = ({ className = '' }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Only show in development environment
  const isDevelopment = process.env.NODE_ENV === 'development' || 
                        window.location.hostname.includes('localhost') ||
                        window.location.hostname.includes('127.0.0.1') ||
                        window.location.port === '5173' ||
                        window.location.hostname === 'localhost'; // Vite default dev port

  // Debug logging
  console.log('FeedbackButton Debug:', {
    NODE_ENV: process.env.NODE_ENV,
    hostname: window.location.hostname,
    port: window.location.port,
    isDevelopment,
    fullUrl: window.location.href
  });

  // For now, always show in development - we'll refine this later
  const shouldShow = true; // Temporarily always show for debugging

  if (!shouldShow) {
    return null;
  }

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className={`
          fixed bottom-6 right-6 z-50
          bg-blue-600 hover:bg-blue-700 text-white
          rounded-full p-3 shadow-lg hover:shadow-xl
          transition-all duration-200 ease-in-out
          hover:scale-105 active:scale-95
          border-2 border-white
          ${className}
        `}
        title="Report an issue or provide feedback"
        aria-label="Open feedback modal"
      >
        <MessageCircle className="h-6 w-6" />
      </button>

      <FeedbackModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};

export default FeedbackButton;
