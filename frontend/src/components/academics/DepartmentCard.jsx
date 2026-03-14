import React from 'react';

export default function DepartmentCard({ department, onClick }) {
  const { name, code, description, semester_count, course_count } = department;

  return (
    <div
      onClick={onClick}
      className="group cursor-pointer bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden hover:scale-105"
    >
      <div className="h-32 bg-gradient-to-br from-indigo-500 to-purple-600 relative overflow-hidden">
        <div className="absolute inset-0 opacity-0 group-hover:opacity-10 bg-white transition-opacity" />
        <div className="flex items-center justify-center h-full">
          <div className="text-4xl font-bold text-white opacity-80">{code.charAt(0)}</div>
        </div>
      </div>
      <div className="p-4">
        <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-indigo-600 transition-colors">
          {name}
        </h3>
        <p className="text-sm text-gray-600 mb-3">{code}</p>
        <p className="text-sm text-gray-600 line-clamp-2 mb-4">
          {description || 'No description available'}
        </p>
        <div className="flex gap-4 text-xs">
          <div className="flex flex-col items-center">
            <span className="text-lg font-bold text-indigo-600">{semester_count}</span>
            <span className="text-gray-600">Semesters</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-lg font-bold text-purple-600">{course_count}</span>
            <span className="text-gray-600">Courses</span>
          </div>
        </div>
      </div>
    </div>
  );
}
