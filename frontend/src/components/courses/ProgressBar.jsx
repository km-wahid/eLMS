import React from 'react';

export default function ProgressBar({ percentage, showLabel = true, className = '' }) {
  const safePercentage = Math.min(Math.max(percentage || 0, 0), 100);
  
  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Progress</span>
          <span className="text-sm font-semibold text-indigo-600">{safePercentage.toFixed(0)}%</span>
        </div>
      )}
      <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
        <div
          className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300 ease-in-out"
          style={{ width: `${safePercentage}%` }}
        />
      </div>
    </div>
  );
}
