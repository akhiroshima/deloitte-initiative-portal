import React, { useState, useRef } from 'react';
import { X, Camera, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FeedbackData {
  id: string;
  timestamp: string;
  message: string;
  screenshot: string | null;
  url: string;
  userAgent: string;
  viewport: {
    width: number;
    height: number;
  };
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose }) => {
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [isCapturingScreenshot, setIsCapturingScreenshot] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  const captureScreenshot = async (): Promise<string | null> => {
    try {
      setIsCapturingScreenshot(true);
      
      // Use html2canvas for screenshot capture
      const html2canvas = (await import('html2canvas')).default;
      
      // Capture the entire viewport
      const canvas = await html2canvas(document.body, {
        height: window.innerHeight,
        width: window.innerWidth,
        useCORS: true,
        allowTaint: true,
        scale: 0.5, // Reduce size for better performance
        logging: false,
      });
      
      return canvas.toDataURL('image/png');
    } catch (error) {
      console.error('Failed to capture screenshot:', error);
      toast.error('Failed to capture screenshot');
      return null;
    } finally {
      setIsCapturingScreenshot(false);
    }
  };

  const handleScreenshotCapture = async () => {
    const capturedScreenshot = await captureScreenshot();
    if (capturedScreenshot) {
      setScreenshot(capturedScreenshot);
      toast.success('Screenshot captured successfully');
    }
  };

  const handleSubmit = async () => {
    if (!message.trim()) {
      toast.error('Please enter your feedback message');
      return;
    }

    setIsSubmitting(true);

    try {
      // Capture screenshot if not already captured
      let finalScreenshot = screenshot;
      if (!finalScreenshot) {
        finalScreenshot = await captureScreenshot();
      }

      const feedbackData: FeedbackData = {
        id: `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        message: message.trim(),
        screenshot: finalScreenshot,
        url: window.location.href,
        userAgent: navigator.userAgent,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight,
        },
      };

      // Send feedback to Netlify function
      const response = await fetch('/.netlify/functions/submit-feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(feedbackData),
      });

      if (!response.ok) {
        throw new Error('Failed to submit feedback');
      }

      toast.success('Feedback submitted successfully!');
      
      // Reset form
      setMessage('');
      setScreenshot(null);
      onClose();
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      toast.error('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div
        ref={modalRef}
        className="bg-background border border-border rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">
            Report Issue / Feedback
          </h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
            disabled={isSubmitting}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div>
            <label htmlFor="feedback-message" className="block text-sm font-medium text-foreground mb-2">
              Describe the issue or provide feedback *
            </label>
            <textarea
              id="feedback-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Please describe the issue you're experiencing or provide any feedback..."
              className="w-full h-32 px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
              disabled={isSubmitting}
            />
          </div>

          {/* Screenshot Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">
                Screenshot (automatically captured on submit)
              </label>
              <button
                onClick={handleScreenshotCapture}
                disabled={isCapturingScreenshot || isSubmitting}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCapturingScreenshot ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Camera className="h-4 w-4" />
                )}
                {isCapturingScreenshot ? 'Capturing...' : 'Capture Now'}
              </button>
            </div>

            {screenshot && (
              <div className="border border-border rounded-md p-2 bg-muted/20">
                <img
                  src={screenshot}
                  alt="Screenshot preview"
                  className="max-w-full h-auto max-h-48 rounded border border-border"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Screenshot captured - will be included with your feedback
                </p>
              </div>
            )}
          </div>

          {/* Additional Info */}
          <div className="text-xs text-muted-foreground space-y-1">
            <p>• URL: {window.location.href}</p>
            <p>• Viewport: {window.innerWidth} × {window.innerHeight}</p>
            <p>• Timestamp: {new Date().toLocaleString()}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-border bg-muted/20">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !message.trim()}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary hover:bg-primary/90 text-primary-foreground rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeedbackModal;
