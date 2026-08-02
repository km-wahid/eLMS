import React from 'react';
import { Link } from 'react-router-dom';
import ProgressBar from './ProgressBar';

export default function CourseProgressCard({ course, progress, onClick }) {
  const { completed_modules = 0, total_modules = 0, percentage = 0 } = progress || {};
  
  return (
    <div 
      onClick={onClick}
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
    >
      {/* Course Thumbnail */}
      <div className="flex gap-4">
        <div className="w-20 h-16 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
          {course.thumbnail || course.thumbnail_url ? (
            <img 
              src={course.thumbnail || course.thumbnail_url} 
              alt={course.title}
              className="w-full h-full object-cover rounded-lg"
            />
          ) : (
            <span className="text-2xl">📚</span>
          )}
        </div>
        
        {/* Course Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate mb-1">{course.title}</h3>
          <p className="text-sm text-gray-500 truncate mb-2">{course.teacher_name}</p>
          
          {/* Progress */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-gray-600">
              <span>{completed_modules} / {total_modules} modules</span>
              <span className="font-semibold text-indigo-600">{percentage.toFixed(0)}%</span>
            </div>
            <ProgressBar percentage={percentage} showLabel={false} />
          </div>
        </div>
      </div>
      
      {/* Status Badge */}
      {percentage === 100 ? (
        <div className="mt-3 text-center">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            ✅ Completed
          </span>
        </div>
      ) : percentage > 0 ? (
        <div className="mt-3 text-center">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            📖 In Progress
          </span>
        </div>
      ) : (
        <div className="mt-3 text-center">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            🎯 Not Started
          </span>
        </div>
      )}
    </div>
  );
}
