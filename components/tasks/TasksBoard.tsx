import React, { useState, useEffect, useRef } from 'react';
import { Task, TaskStatus, User } from '../../types';
import * as api from '../../services/api';
import TaskCard from './TaskCard';
import CreateTaskModal from './CreateTaskModal';
import { Button } from '../ui/Button';
import { Plus, FolderOpen } from 'lucide-react';
import { useToasts } from '../ui/ToastProvider';

interface TasksBoardProps {
    initiativeId: string;
    tasks: Task[];
    teamMembers: User[];
    isOwner: boolean;
    isTeamMember: boolean;
    onDataChange: () => void;
    className?: string;
}

const columns: TaskStatus[] = [TaskStatus.Todo, TaskStatus.InProgress, TaskStatus.Done];

const TasksBoard: React.FC<TasksBoardProps> = ({ initiativeId, tasks, teamMembers, isOwner, isTeamMember, onDataChange, className }) => {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [localTasks, setLocalTasks] = useState<Task[]>(tasks);
    const { addToast } = useToasts();
    
    const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
    const [placeholderProps, setPlaceholderProps] = useState<{ status: TaskStatus; index: number } | null>(null);
    const dropHappened = useRef(false);

    const columnRefs = useRef<(HTMLDivElement | null)[]>([]);

    useEffect(() => {
        setLocalTasks(tasks);
    }, [tasks]);

    const handleCreateTask = async (data: Omit<api.CreateTaskData, 'initiativeId'>) => {
        try {
            await api.createTask({ ...data, initiativeId });
            addToast('Task created successfully', 'success');
            onDataChange();
            setIsCreateModalOpen(false);
        } catch (error) {
            addToast('Failed to create task', 'error');
            console.error(error);
        }
    };

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, task: Task) => {
        dropHappened.current = false;
        e.dataTransfer.setData("taskId", task.id);
        e.dataTransfer.effectAllowed = 'move';
        // Add "lift" effect class
        e.currentTarget.classList.add('is-dragging');
        requestAnimationFrame(() => {
            setDraggedTaskId(task.id);
        });
    };

    const handleDragOverColumn = (e: React.DragEvent<HTMLDivElement>, status: TaskStatus) => {
        e.preventDefault();
        
        const columnEl = e.currentTarget;
        const tasksInColumn = localTasks.filter(t => t.status === status && t.id !== draggedTaskId);
        const dropY = e.clientY;

        let newIndex = tasksInColumn.length;
        
        for (let i = 0; i < tasksInColumn.length; i++) {
            const taskId = tasksInColumn[i].id;
            const cardEl = columnEl.querySelector(`[data-task-id="${taskId}"]`) as HTMLElement;
            if (cardEl) {
                const cardRect = cardEl.getBoundingClientRect();
                if (dropY < cardRect.top + cardRect.height / 2) {
                    newIndex = i;
                    break;
                }
            }
        }
            
        if (placeholderProps?.status !== status || placeholderProps?.index !== newIndex) {
            setPlaceholderProps({ status, index: newIndex });
        }
    };
    
    const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        dropHappened.current = true;
        const taskId = e.dataTransfer.getData("taskId");
        
        if (!placeholderProps || !taskId) {
            setDraggedTaskId(null);
            setPlaceholderProps(null);
            return;
        }
        
        const { status: newStatus, index: dropIndex } = placeholderProps;
        const originalTask = localTasks.find(t => t.id === taskId);
        
        setDraggedTaskId(null);
        setPlaceholderProps(null);

        if (!originalTask) return;

        const tasksWithoutOriginal = localTasks.filter(t => t.id !== taskId);
        const updatedTask = { ...originalTask, status: newStatus };
        
        const tasksByStatus: Record<TaskStatus, Task[]> = {
            [TaskStatus.Todo]: [],
            [TaskStatus.InProgress]: [],
            [TaskStatus.Done]: [],
        };
        
        tasksWithoutOriginal.forEach(t => {
            tasksByStatus[t.status].push(t);
        });

        tasksByStatus[newStatus].splice(dropIndex, 0, updatedTask);
        
        const finalTasks = [
            ...tasksByStatus[TaskStatus.Todo],
            ...tasksByStatus[TaskStatus.InProgress],
            ...tasksByStatus[TaskStatus.Done]
        ];

        if (finalTasks.length !== localTasks.length) {
            console.error("Task list mismatch after drop. Reverting.");
            addToast('An error occurred. Please try again.', 'error');
            setLocalTasks(tasks);
            return;
        }

        setLocalTasks(finalTasks); // Optimistic update

        try {
            await api.updateTasks(finalTasks);
            addToast('Task board updated', 'success');
            onDataChange();
        } catch (error) {
            addToast(error instanceof Error ? error.message : 'Failed to update tasks', 'error');
            console.error(error);
            setLocalTasks(tasks); // Revert on failure
        }
    };

    const handleDragEnd = () => {
        document.querySelector('.is-dragging')?.classList.remove('is-dragging');
        if (!dropHappened.current) {
            setDraggedTaskId(null);
            setPlaceholderProps(null);
        }
    };
    
    return (
        <>
            <CreateTaskModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onCreate={handleCreateTask}
                teamMembers={teamMembers}
            />
            <div className={`space-y-6 ${className || ''}`}>
                {isTeamMember && (
                    <div className="flex justify-end">
                        <Button onClick={() => setIsCreateModalOpen(true)}>
                            <Plus className="w-5 h-5 -ml-1 mr-2" />
                            Create Task
                        </Button>
                    </div>
                )}
                <div className="flex flex-col md:flex-row gap-6 h-[calc(100vh-380px)]">
                    {columns.map((status, colIndex) => {
                        const tasksInColumn = localTasks.filter(t => t.status === status);
                        
                        return (
                        <div key={status} className="bg-muted rounded-md flex flex-col w-full">
                            <h3 className="font-semibold text-sm text-foreground p-4 border-b border-border flex-shrink-0">{status} <span className="text-xs text-muted-foreground">({tasksInColumn.length})</span></h3>
                            <div 
                                ref={el => { columnRefs.current[colIndex] = el; }}
                                className="space-y-4 p-4 overflow-y-auto flex-grow"
                                onDrop={handleDrop}
                                onDragOver={(e) => handleDragOverColumn(e, status)}
                                onDragLeave={() => setPlaceholderProps(null)}
                            >
                                {tasksInColumn.map((task) => (
                                     <TaskCard 
                                        key={task.id} 
                                        task={task} 
                                        teamMembers={teamMembers} 
                                        onDataChange={onDataChange}
                                        isOwner={isOwner}
                                        isTeamMember={isTeamMember}
                                        isDragging={draggedTaskId === task.id}
                                        onDragStart={(e) => handleDragStart(e, task)}
                                        onDragEnd={handleDragEnd}
                                    />
                                ))}
                                {placeholderProps?.status === status && (
                                    <div className="task-placeholder" />
                                )}

                                {tasksInColumn.length === 0 && placeholderProps?.status !== status && (
                                    <div className="text-center pt-10">
                                        <FolderOpen className="mx-auto h-10 w-10 text-muted-foreground/50" />
                                        <p className="mt-2 text-sm text-muted-foreground">No tasks in this column.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )})}
                </div>
            </div>
        </>
    );
};

export default TasksBoard;