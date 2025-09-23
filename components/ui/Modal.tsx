import React, { ReactNode } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './dialog';
import { X } from 'lucide-react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: ReactNode;
    className?: string;
    title?: string;
    description?: string;
}

const Modal: React.FC<ModalProps> = ({ 
    isOpen, 
    onClose, 
    children, 
    className = '',
    title,
    description 
}) => {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className={`max-w-4xl max-h-[90vh] overflow-auto ${className}`}>
                {/* Custom close button using our icon */}
                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
                >
                        <X className="h-4 w-4" />
                    <span className="sr-only">Close</span>
                </button>
                
                {(title || description) && (
                    <DialogHeader>
                        {title && <DialogTitle>{title}</DialogTitle>}
                        {description && <DialogDescription>{description}</DialogDescription>}
                    </DialogHeader>
                )}
                
                <div className="mt-4">
                    {children}
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default Modal;