import React from 'react';
import { Users, BookOpen, FileText } from 'lucide-react';

export default function CourseCard({ course, isEnrolled, onEnroll, onClick }) {
  const { id, title, course_code, teacher_name, description, module_count, enrollment_count } = course;
  const materialCount = module_count ? module_count * 2 : 0; // Estimate

  return (
    <div
      className="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col"
    >
      {/* Header */}
      <div className="h-24 bg-gradient-to-br from-blue-500 to-cyan-600 relative overflow-hidden p-4 flex items-end justify-between">
        <div className="flex-1">
          <p className="text-white text-xs font-semibold opacity-90">{course_code}</p>
          <h3 className="text-white font-bold text-sm line-clamp-1">{title}</h3>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col">
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{description}</p>
        
        {/* Teacher */}
        <p className="text-xs text-gray-700 font-semibold mb-4">
          👨‍🏫 {teacher_name || 'Instructor'}
        </p>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-4 mt-auto text-xs">
          <div className="bg-blue-50 rounded-lg p-2 flex items-center gap-2">
            <BookOpen size={14} className="text-blue-600" />
            <span className="text-gray-700">{module_count || 0} modules</span>
          </div>
          <div className="bg-green-50 rounded-lg p-2 flex items-center gap-2">
            <Users size={14} className="text-green-600" />
            <span className="text-gray-700">{enrollment_count || 0} students</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={onClick}
            className="flex-1 px-3 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors font-semibold text-sm"
          >
            View Course
          </button>
          {!isEnrolled && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEnroll(id);
              }}
              className="flex-1 px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors font-semibold text-sm"
            >
              Enroll
            </button>
          )}
          {isEnrolled && (
            <div className="flex-1 px-3 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-semibold flex items-center justify-center">
              ✓ Enrolled
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
