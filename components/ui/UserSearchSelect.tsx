import React, { useState, useMemo } from 'react';
import { User } from '../../types';
import { X } from 'lucide-react';

interface UserSearchSelectProps {
  allUsers: User[];
  selectedUserIds: string[];
  onChange: (selectedIds: string[]) => void;
  creatorId?: string;
}

const UserSearchSelect: React.FC<UserSearchSelectProps> = ({ allUsers, selectedUserIds, onChange, creatorId }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const selectedUsers = useMemo(() => {
    return selectedUserIds.map(id => allUsers.find(u => u.id === id)).filter((u): u is User => !!u);
  }, [selectedUserIds, allUsers]);

  const availableUsers = useMemo(() => {
    return allUsers.filter(user => 
      !selectedUserIds.includes(user.id) &&
      user.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allUsers, selectedUserIds, searchTerm]);

  const handleSelectUser = (userId: string) => {
    onChange([...selectedUserIds, userId]);
    setSearchTerm('');
    setIsDropdownOpen(false);
  };

  const handleRemoveUser = (userId: string) => {
    if (userId === creatorId) return; // Prevent creator from being removed
    onChange(selectedUserIds.filter(id => id !== userId));
  };
  
  return (
    <div className="relative mt-1">
      <div className="flex flex-wrap gap-2 rounded-md border border-input bg-card p-2 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
        {selectedUsers.map(user => (
          <div key={user.id} className="flex items-center gap-1.5 rounded-full bg-muted py-1 pl-2 pr-1">
            <img src={user.avatarUrl} alt={user.name} className="h-5 w-5 rounded-full" />
            <span className="text-sm font-medium text-muted-foreground">{user.name}</span>
            {user.id !== creatorId && (
              <button
                type="button"
                onClick={() => handleRemoveUser(user.id)}
                className="rounded-full text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setIsDropdownOpen(true)}
          onBlur={() => setTimeout(() => setIsDropdownOpen(false), 150)} // Delay to allow click
          placeholder="Search to add members..."
          className="flex-grow bg-transparent p-1 text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>

      {isDropdownOpen && availableUsers.length > 0 && (
        <div className="absolute z-10 mt-1 w-full rounded-md border bg-popover text-popover-foreground shadow-lg">
          <ul className="max-h-48 overflow-y-auto">
            {availableUsers.map(user => (
              <li
                key={user.id}
                onClick={() => handleSelectUser(user.id)}
                className="flex cursor-pointer items-center gap-3 px-3 py-2 hover:bg-muted"
              >
                <img src={user.avatarUrl} alt={user.name} className="h-8 w-8 rounded-full" />
                <div>
                  <p className="text-sm font-medium text-popover-foreground">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.role}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default UserSearchSelect;