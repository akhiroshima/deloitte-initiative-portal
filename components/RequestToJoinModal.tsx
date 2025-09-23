import React, { useState, useEffect } from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Slider } from './ui/slider';
import { X } from "lucide-react"
import { User } from '../types';
import * as api from '../services/api';
import Modal from './ui/Modal';

interface RequestToJoinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitted: () => void;
  initiativeId: string;
  initiativeTitle: string;
  currentUser: User | null;
}

const RequestToJoinModal: React.FC<RequestToJoinModalProps> = ({ isOpen, onClose, onSubmitted, initiativeId, initiativeTitle, currentUser }) => {
  const [message, setMessage] = useState('');
  const [committedHours, setCommittedHours] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const labelClasses = "block text-sm font-medium text-foreground";

  useEffect(() => {
    if (isOpen) {
      // Reset form state when modal opens
      setMessage('');
      setCommittedHours(5);
      setError('');
      setIsSubmitting(false);
    }
  }, [isOpen]);

  if (!currentUser) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      setError('Please provide a message explaining your interest.');
      return;
    }
    setError('');
    setIsSubmitting(true);
    try {
      await api.createJoinRequest({
        initiativeId,
        userId: currentUser.id,
        message,
        committedHours,
      });
      onSubmitted();
      onClose();
    } catch (err) {
      console.error("Failed to submit request", err);
      setError('Failed to submit request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="w-full max-w-lg">
      <form onSubmit={handleSubmit}>
        <div className="flex items-start justify-between border-b border-border p-6">
          <h2 id="modal-title" className="text-2xl font-bold text-foreground">Request to Join Initiative</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <div className="space-y-6 p-6">
          <p className="text-base text-muted-foreground">You are requesting to join: <span className="font-semibold text-foreground">{initiativeTitle}</span></p>
          <div>
            <label htmlFor="message" className={labelClasses}>Your Message</label>
            <p className="text-xs text-muted-foreground mb-2">Why do you want to join this project? What skills can you bring?</p>
            <Textarea 
              id="message" 
              rows={5}
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="I'm excited about this initiative because..."
              aria-required="true"
            />
          </div>
           <div>
            <label htmlFor="hours" className={labelClasses}>Weekly Commitment</label>
             <div className="flex items-center gap-4 mt-2">
                <Slider
                    id="hours"
                    min={1}
                    max={40}
                    value={[committedHours]}
                    onValueChange={(value) => setCommittedHours(value[0])}
                    className="w-full"
                />
                <span className="font-semibold text-foreground w-28 text-center">{committedHours} hours / week</span>
             </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        
        <div className="flex justify-end gap-4 border-t border-border bg-muted/50 p-6">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Submit Request'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default RequestToJoinModal;