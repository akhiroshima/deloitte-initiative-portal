import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import FeedbackButton from '../components/FeedbackButton';
import FeedbackModal from '../components/FeedbackModal';

// Mock html2canvas
jest.mock('html2canvas', () => ({
  __esModule: true,
  default: jest.fn(() => Promise.resolve({
    toDataURL: jest.fn(() => 'data:image/png;base64,test')
  }))
}));

// Mock fetch
global.fetch = jest.fn();

describe('Feedback System', () => {
  beforeEach(() => {
    // Mock development environment
    process.env.NODE_ENV = 'development';
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true })
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('FeedbackButton renders in development', () => {
    render(<FeedbackButton />);
    expect(screen.getByLabelText('Open feedback modal')).toBeInTheDocument();
  });

  test('FeedbackButton does not render in production', () => {
    process.env.NODE_ENV = 'production';
    const { container } = render(<FeedbackButton />);
    expect(container.firstChild).toBeNull();
  });

  test('FeedbackModal opens and closes correctly', async () => {
    const mockOnClose = jest.fn();
    render(<FeedbackModal isOpen={true} onClose={mockOnClose} />);
    
    expect(screen.getByText('Report Issue / Feedback')).toBeInTheDocument();
    
    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);
    
    expect(mockOnClose).toHaveBeenCalled();
  });

  test('FeedbackModal submits feedback correctly', async () => {
    const mockOnClose = jest.fn();
    render(<FeedbackModal isOpen={true} onClose={mockOnClose} />);
    
    const textarea = screen.getByPlaceholderText(/describe the issue/i);
    const submitButton = screen.getByRole('button', { name: /submit feedback/i });
    
    fireEvent.change(textarea, { target: { value: 'Test feedback message' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/.netlify/functions/submit-feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: expect.stringContaining('Test feedback message')
      });
    });
  });

  test('FeedbackModal validates required message', async () => {
    const mockOnClose = jest.fn();
    render(<FeedbackModal isOpen={true} onClose={mockOnClose} />);
    
    const submitButton = screen.getByRole('button', { name: /submit feedback/i });
    fireEvent.click(submitButton);
    
    // Should not submit without message
    expect(fetch).not.toHaveBeenCalled();
  });
});
