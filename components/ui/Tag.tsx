import React from 'react';
import { Badge } from './badge';

interface TagProps {
  children: React.ReactNode;
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
}

const Tag: React.FC<TagProps> = ({ children, variant = 'secondary' }) => {
  return (
    <Badge variant={variant}>
      {children}
    </Badge>
  );
};

export default Tag;