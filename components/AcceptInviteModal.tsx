import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { X } from "lucide-react"
import Modal from './ui/Modal';

interface AcceptInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (committedHours: number) => void;
  initiativeTitle: string;
}

const AcceptInviteModal: React.FC<AcceptInviteModalProps> = ({ isOpen, onClose, onSubmit, initiativeTitle }) => {
  const [committedHours, setCommittedHours] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const labelClasses = "block text-sm font-medium text-foreground";

  useEffect(() => {
    if (isOpen) {
      setCommittedHours(5);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(committedHours);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="w-full max-w-lg">
      <form onSubmit={handleSubmit}>
        <div className="flex items-start justify-between border-b border-border p-6">
          <h2 id="modal-title" className="text-2xl font-bold text-foreground">Accept Invitation</h2>
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
          <p className="text-base text-muted-foreground">You are accepting an invitation to join: <span className="font-semibold text-foreground">{initiativeTitle}</span></p>
          <div>
            <label htmlFor="hours" className={labelClasses}>Confirm Your Weekly Commitment</label>
            <p className="text-xs text-muted-foreground mb-2">Please set how many hours per week you plan to dedicate to this initiative.</p>
             <div className="flex items-center gap-4 mt-2">
                <input
                    id="hours"
                    type="range"
                    min="1"
                    max="40"
                    value={committedHours}
                    onChange={(e) => setCommittedHours(Number(e.target.value))}
                    className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
                />
                <span className="font-semibold text-foreground w-28 text-center">{committedHours} hours / week</span>
             </div>
          </div>
        </div>
        
        <div className="flex justify-end gap-4 border-t border-border bg-muted/50 p-6">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Joining...' : 'Accept & Join'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AcceptInviteModal;