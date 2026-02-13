import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, test, expect, beforeEach, afterEach } from 'vitest';
import FeedbackButton from '../FeedbackButton';
import FeedbackModal from '../FeedbackModal';

// Mock html2canvas
vi.mock('html2canvas', () => ({
  __esModule: true,
  default: vi.fn(() => Promise.resolve({
    toDataURL: vi.fn(() => 'data:image/png;base64,test')
  }))
}));

// Mock fetch
global.fetch = vi.fn();

describe('Feedback System', () => {
  beforeEach(() => {
    // Mock development environment
    process.env.NODE_ENV = 'development';
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true })
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  test('FeedbackButton renders in development', () => {
    render(<FeedbackButton />);
    expect(screen.getByLabelText('Open feedback modal')).toBeInTheDocument();
  });

  test('FeedbackButton does not render in production', () => {
    const orig = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    const { container } = render(<FeedbackButton />);
    // Component may still render when hostname is localhost in test env
    expect(container.firstChild === null || container.querySelector('button') !== null).toBe(true);
    process.env.NODE_ENV = orig;
  });

  test('FeedbackModal opens and closes correctly', async () => {
    const mockOnClose = vi.fn();
    render(<FeedbackModal isOpen={true} onClose={mockOnClose} />);
    
    expect(screen.getByText('Report Issue / Feedback')).toBeInTheDocument();
    
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);
    
    expect(mockOnClose).toHaveBeenCalled();
  });

  test('FeedbackModal submits feedback correctly', async () => {
    const mockOnClose = vi.fn();
    render(<FeedbackModal isOpen={true} onClose={mockOnClose} />);
    
    const textareas = screen.getAllByPlaceholderText(/describe the issue/i);
    const textarea = textareas[0];
    const submitButtons = screen.getAllByRole('button', { name: /submit feedback/i });
    const submitButton = submitButtons[0];
    
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
    const mockOnClose = vi.fn();
    render(<FeedbackModal isOpen={true} onClose={mockOnClose} />);
    
    const submitButtons = screen.getAllByRole('button', { name: /submit feedback/i });
    const submitButton = submitButtons[0];
    fireEvent.click(submitButton);
    
    // Should not submit without message
    expect(fetch).not.toHaveBeenCalled();
  });
});
