import React from 'react';
import { CheckCircle, Circle, Lock } from 'lucide-react';

export default function ModuleCompletionBadge({ isCompleted, isLocked = false, size = 'md' }) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };
  
  const iconSize = sizes[size] || sizes.md;
  
  if (isLocked) {
    return (
      <div className="flex items-center gap-1.5">
        <Lock className={`${iconSize} text-gray-400`} />
        <span className="text-xs text-gray-500">Locked</span>
      </div>
    );
  }
  
  if (isCompleted) {
    return (
      <div className="flex items-center gap-1.5">
        <CheckCircle className={`${iconSize} text-green-600 fill-green-100`} />
        <span className="text-xs font-medium text-green-700">Completed</span>
      </div>
    );
  }
  
  return (
    <div className="flex items-center gap-1.5">
      <Circle className={`${iconSize} text-gray-400`} />
      <span className="text-xs text-gray-500">In Progress</span>
    </div>
  );
}
