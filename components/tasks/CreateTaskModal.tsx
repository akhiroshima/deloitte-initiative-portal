import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/input';
import { X } from 'lucide-react';
import { User } from '../../types';
import { CreateTaskData } from '../../services/api';
import Modal from '../ui/Modal';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: Omit<CreateTaskData, 'initiativeId'>) => void;
  teamMembers: User[];
}

const CreateTaskModal: React.FC<CreateTaskModalProps> = ({ isOpen, onClose, onCreate, teamMembers }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [error, setError] = useState('');
  
  const labelClasses = "block text-sm font-medium text-foreground";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title is required.');
      return;
    }
    setError('');
    onCreate({ 
        title, 
        description, 
        assigneeId: assigneeId || undefined 
    });
  };
  
  const handleClose = () => {
    setTitle('');
    setDescription('');
    setAssigneeId('');
    setError('');
    onClose();
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className="w-full max-w-lg">
      <form onSubmit={handleSubmit}>
        <div className="flex items-start justify-between border-b border-border p-6">
          <h2 className="text-2xl font-bold text-foreground">Create New Task</h2>
          <button type="button" onClick={handleClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <div className="space-y-6 p-6">
          <div>
            <label htmlFor="title" className={labelClasses}>Task Title</label>
            <Input 
              type="text" 
              id="title" 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              required
            />
          </div>
            <div>
            <label htmlFor="description" className={labelClasses}>Description</label>
            <textarea 
              id="description" 
              rows={4}
              value={description} 
              onChange={e => setDescription(e.target.value)} 
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <div>
            <label htmlFor="assigneeId" className={labelClasses}>Assign To</label>
            <select
              id="assigneeId"
              value={assigneeId}
              onChange={e => setAssigneeId(e.target.value)}
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">Unassigned</option>
              {teamMembers.map(member => (
                  <option key={member.id} value={member.id}>{member.name}</option>
              ))}
            </select>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        
        <div className="flex justify-end gap-4 border-t border-border bg-muted/50 p-6">
          <Button type="button" variant="secondary" onClick={handleClose}>Cancel</Button>
          <Button type="submit">Create Task</Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateTaskModal;