import React, { useState, useEffect } from 'react';
import { Button } from './ui/Button';
import { X } from "lucide-react"
import { HelpWanted } from '../types';
import Modal from './ui/Modal';

interface CreateHelpWantedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { skill: string; hoursPerWeek: number; status: 'Open' | 'Closed' }) => void;
  initialData?: HelpWanted | null;
}

const CreateHelpWantedModal: React.FC<CreateHelpWantedModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
  const [skill, setSkill] = useState('');
  const [hours, setHours] = useState('');
  const [status, setStatus] = useState<'Open' | 'Closed'>('Open');
  const [error, setError] = useState('');

  const inputClasses = `mt-1 block w-full rounded-md border-input bg-background shadow-sm focus:border-primary focus:ring-primary sm:text-sm px-3 py-2`;
  const labelClasses = "block text-sm font-medium text-foreground";

  useEffect(() => {
    if (isOpen) {
        setSkill(initialData?.skill || '');
        setHours(initialData?.hoursPerWeek?.toString() || '');
        setStatus(initialData?.status || 'Open');
        setError('');
    }
  }, [isOpen, initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const hoursNum = parseInt(hours, 10);
    if (!skill.trim() || !hours || isNaN(hoursNum) || hoursNum <= 0) {
      setError('Please provide a valid skill and a positive number for hours.');
      return;
    }
    setError('');
    onSave({ skill, hoursPerWeek: hoursNum, status });
  };
  
  const handleClose = () => {
    onClose();
  }

  const isEditing = !!initialData;

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="w-full max-w-lg">
      <form onSubmit={handleSubmit}>
        <div className="flex items-start justify-between border-b border-border p-6">
          <h2 className="text-2xl font-bold text-foreground">{isEditing ? 'Edit' : 'Create'} Help Wanted Post</h2>
          <button onClick={handleClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <div className="space-y-6 p-6">
          <div>
            <label htmlFor="skill" className={labelClasses}>Required Skill</label>
            <input 
              type="text" 
              id="skill" 
              value={skill} 
              onChange={e => setSkill(e.target.value)} 
              className={inputClasses}
              placeholder="e.g., D3.js, User Research"
            />
          </div>
          <div>
            <label htmlFor="hours" className={labelClasses}>Estimated Hours per Week</label>
            <input 
              type="number" 
              id="hours" 
              value={hours} 
              onChange={e => setHours(e.target.value)} 
              className={inputClasses}
              placeholder="e.g., 8"
            />
          </div>
            {isEditing && (
                <div>
                  <label htmlFor="status" className={labelClasses}>Status</label>
                  <select
                      id="status"
                      value={status}
                      onChange={e => setStatus(e.target.value as 'Open' | 'Closed')}
                      className={inputClasses}
                  >
                      <option value="Open">Open</option>
                      <option value="Closed">Closed</option>
                  </select>
              </div>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        
        <div className="flex justify-end gap-4 border-t border-border bg-muted/50 p-6">
          <Button type="button" variant="secondary" onClick={handleClose}>Cancel</Button>
          <Button type="submit">{isEditing ? 'Save Changes' : 'Create Post'}</Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateHelpWantedModal;