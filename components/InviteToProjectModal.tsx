import React, { useState, useEffect, useMemo } from 'react';
import { Button } from './ui/Button';
import { X } from "lucide-react"
import { User, Initiative } from '../types';
import * as api from '../services/api';
import Modal from './ui/Modal';
import { useToasts } from './ui/ToastProvider';

interface InviteToProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  invitee: User;
  currentUser: User;
  allInitiatives: Initiative[];
  onDataChange: () => void;
}

const InviteToProjectModal: React.FC<InviteToProjectModalProps> = ({ isOpen, onClose, invitee, currentUser, allInitiatives, onDataChange }) => {
  const [selectedInitiative, setSelectedInitiative] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addToast } = useToasts();

  const eligibleInitiatives = useMemo(() => {
    return allInitiatives.filter(init => {
        const isCurrentUserMember = init.teamMembers.some(m => m.userId === currentUser.id);
        const isInviteeAlreadyMember = init.teamMembers.some(m => m.userId === invitee.id);
        const isActive = init.status === 'In Progress' || init.status === 'Searching Talent';
        return isCurrentUserMember && !isInviteeAlreadyMember && isActive;
    });
  }, [allInitiatives, currentUser, invitee]);
  
  useEffect(() => {
    if (isOpen) {
        setSelectedInitiative('');
        setIsSubmitting(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInitiative) {
        addToast("Please select an initiative.", "error");
        return;
    }
    
    setIsSubmitting(true);
    try {
        await api.inviteUserToInitiative(selectedInitiative, invitee.id, currentUser.id);
        addToast(`Invitation sent to ${invitee.name}.`, "success");
        onDataChange();
        onClose();
    } catch(error) {
        console.error("Failed to send invite", error);
        addToast(error instanceof Error ? error.message : "Failed to send invitation.", "error");
    } finally {
        setIsSubmitting(false);
    }
  };
  
  const inputClasses = `mt-1 block w-full rounded-md border-input bg-background shadow-sm focus:border-primary focus:ring-primary sm:text-sm px-3 py-2`;
  const labelClasses = "block text-sm font-medium text-foreground";

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="w-full max-w-lg">
      <form onSubmit={handleSubmit}>
        <div className="flex items-start justify-between border-b border-border p-6">
          <h2 id="modal-title" className="text-2xl font-bold text-foreground">Invite to Project</h2>
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
          <p className="text-base text-muted-foreground">You are inviting <span className="font-semibold text-foreground">{invitee.name}</span> to join an initiative.</p>
          <div>
            <label htmlFor="initiative" className={labelClasses}>Select Initiative</label>
            <select
                id="initiative"
                value={selectedInitiative}
                onChange={(e) => setSelectedInitiative(e.target.value)}
                className={inputClasses}
                disabled={eligibleInitiatives.length === 0}
            >
                <option value="">{eligibleInitiatives.length > 0 ? 'Choose a project...' : 'No eligible projects'}</option>
                {eligibleInitiatives.map(init => (
                    <option key={init.id} value={init.id}>{init.title}</option>
                ))}
            </select>
            <p className="text-xs text-muted-foreground mt-1">Only active projects you are a member of are shown.</p>
          </div>
        </div>
        
        <div className="flex justify-end gap-4 border-t border-border bg-muted/50 p-6">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
          <Button type="submit" disabled={isSubmitting || !selectedInitiative}>
            {isSubmitting ? 'Sending...' : 'Send Invitation'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default InviteToProjectModal;