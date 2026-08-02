import React from 'react';
import { Users, BookOpen, ArrowUpRight, Clock3 } from 'lucide-react';
import { departmentCover } from '../../utils/departmentCovers';

export default function CourseCard({ course, isEnrolled, onEnroll, onClick }) {
  const { id, title, course_code, teacher_name, description, module_count, enrollment_count } = course;
  const materialCount = module_count ? module_count * 4 : 0;
  const available = course.availability === 'available' || course.is_available;

  return (
    <div
      className="group overflow-hidden rounded-3xl border border-slate-200/70 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl flex flex-col"
    >
      {/* Header */}
      <div className="relative h-36 overflow-hidden">
        <img src={departmentCover(course.department_code)} alt="" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/30 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-4 text-white"><p className="text-xs font-bold tracking-widest text-white/70">{course_code}</p><h3 className="mt-1 font-bold line-clamp-1">{title}</h3></div>
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col">
        <div className="mb-3 flex items-center justify-between"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${available ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{available ? 'Open now' : 'Coming soon'}</span><span className="text-xs font-semibold capitalize text-slate-500">{course.level}</span></div>
        <p className="text-sm leading-6 text-slate-600 mb-4 line-clamp-2">{description}</p>
        
        {/* Teacher */}
        <p className="text-xs text-slate-700 font-semibold mb-4">
          Led by {teacher_name || 'Instructor'}
        </p>

        {/* Stats */}
        <div className="mb-5 mt-auto flex items-center gap-4 border-t border-slate-100 pt-4 text-xs font-medium text-slate-500">
          <span className="flex items-center gap-1.5"><BookOpen size={14} />{module_count || 0} modules</span>
          <span className="flex items-center gap-1.5"><Users size={14} />{enrollment_count || 0} learners</span>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={onClick}
            className="flex-1 px-3 py-2.5 bg-slate-950 text-white rounded-xl hover:bg-indigo-700 transition-colors font-semibold text-sm flex items-center justify-center gap-2"
          >
            View course <ArrowUpRight size={15} />
          </button>
          {!available && (
            <span className="px-3 py-2.5 rounded-xl bg-amber-50 text-amber-700 font-semibold text-sm"><Clock3 size={16} /></span>
          )}
          {available && !isEnrolled && (
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
