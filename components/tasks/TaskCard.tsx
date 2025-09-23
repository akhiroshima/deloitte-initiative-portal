import React from 'react';
import { cva } from 'class-variance-authority';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Task, User } from '../../types';
import * as api from '../../services/api';
import { useToasts } from '../ui/ToastProvider';
import { Card } from '../ui/Card';
import { Trash2 } from 'lucide-react';

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

interface TaskCardProps {
    task: Task;
    teamMembers: User[];
    isOwner: boolean;
    isTeamMember: boolean;
    isDragging: boolean;
    onDataChange: () => void;
    onDragStart: (e: React.DragEvent<HTMLDivElement>) => void;
    onDragEnd: (e: React.DragEvent<HTMLDivElement>) => void;
    style?: React.CSSProperties;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, teamMembers, isOwner, isTeamMember, isDragging, onDataChange, onDragStart, onDragEnd, style }) => {
    const assignee = teamMembers.find(m => m.id === task.assigneeId);
    const { addToast } = useToasts();
    
    const handleAssigneeChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newAssigneeId = e.target.value || undefined;
        try {
            await api.updateTask(task.id, { assigneeId: newAssigneeId });
            addToast('Task reassigned', 'success');
            onDataChange();
        } catch (error) {
            addToast('Failed to reassign task', 'error');
            console.error(error);
        }
    }

    const handleDeleteTask = async (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent card click/drag
        if (window.confirm('Are you sure you want to delete this task?')) {
            try {
                await api.deleteTask(task.id);
                addToast('Task deleted', 'success');
                onDataChange();
            } catch (error) {
                addToast('Failed to delete task', 'error');
                console.error(error);
            }
        }
    }

    return (
        <Card 
            className={cn(
                "p-4 cursor-grab relative group hover:shadow-md hover:border-primary dnd-item-transition",
                isDragging && "is-drag-source"
            )}
            draggable={isTeamMember}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            data-task-id={task.id}
            style={style}
        >
            {isOwner && (
                <button
                    onClick={handleDeleteTask}
                    className="absolute top-2 right-2 p-1 rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Delete task"
                >
                    <Trash2 className="h-4 w-4" />
                </button>
            )}
            <h4 className="font-semibold text-card-foreground pr-6">{task.title}</h4>
            <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
            <div className="mt-4 flex items-center justify-between">
                {isOwner ? (
                    <select
                        value={task.assigneeId || ''}
                        onChange={handleAssigneeChange}
                        className="text-sm border-none p-0 bg-transparent focus:ring-0 text-muted-foreground rounded"
                    >
                         <option value="">Unassigned</option>
                        {teamMembers.map(member => (
                            <option key={member.id} value={member.id}>{member.name}</option>
                        ))}
                    </select>
                ) : (
                    <span className="text-sm text-muted-foreground">{assignee?.name || 'Unassigned'}</span>
                )}
                {assignee ? (
                    <img
                        src={assignee.avatarUrl}
                        alt={assignee.name}
                        title={assignee.name}
                        className="h-8 w-8 rounded-full"
                    />
                ) : (
                    <div className="h-8 w-8 rounded-full bg-muted border-2 border-card ring-1 ring-border flex items-center justify-center text-xs text-muted-foreground">?</div>
                )}
            </div>
        </Card>
    );
};

export default TaskCard;