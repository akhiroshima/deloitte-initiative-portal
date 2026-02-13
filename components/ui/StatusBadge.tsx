import React from 'react';
import { JoinRequestStatus } from '../../types';

interface StatusBadgeProps {
  status: JoinRequestStatus;
}

/** Shared badge for join request status (Pending, Approved, Rejected, Invited). */
export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  switch (status) {
    case JoinRequestStatus.Approved:
      return (
        <span className="text-xs font-medium inline-flex items-center px-2.5 py-0.5 rounded-full bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">
          Approved
        </span>
      );
    case JoinRequestStatus.Rejected:
      return (
        <span className="text-xs font-medium inline-flex items-center px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300">
          Rejected
        </span>
      );
    case JoinRequestStatus.Invited:
      return (
        <span className="text-xs font-medium inline-flex items-center px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">
          Invited
        </span>
      );
    default:
      return (
        <span className="text-xs font-medium inline-flex items-center px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground">
          Pending
        </span>
      );
  }
};
