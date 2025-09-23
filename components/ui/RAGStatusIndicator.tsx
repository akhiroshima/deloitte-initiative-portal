
import React from 'react';
import { RAGStatus } from '../../types';

interface RAGStatusIndicatorProps {
  status: RAGStatus;
}

const RAGStatusIndicator: React.FC<RAGStatusIndicatorProps> = ({ status }) => {
  const styles = {
    [RAGStatus.Green]: {
      bg: 'bg-status-green-bg',
      text: 'text-status-green-text',
      dot: 'bg-status-green-dot',
    },
    [RAGStatus.Amber]: {
      bg: 'bg-status-amber-bg',
      text: 'text-status-amber-text',
      dot: 'bg-status-amber-dot',
    },
    [RAGStatus.Red]: {
      bg: 'bg-status-red-bg',
      text: 'text-status-red-text',
      dot: 'bg-status-red-dot',
    },
  };

  const currentStyle = styles[status];

  if (!currentStyle) {
    return null; // or a default indicator
  }

  return (
    <div className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${currentStyle.bg} ${currentStyle.text}`}>
      <div className={`h-2 w-2 rounded-full ${currentStyle.dot}`} />
      {status}
    </div>
  );
};

export default RAGStatusIndicator;
