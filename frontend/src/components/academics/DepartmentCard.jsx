import React from 'react';
import { ArrowUpRight, BookOpen, CalendarDays } from 'lucide-react';
import { departmentCover } from '../../utils/departmentCovers';

export default function DepartmentCard({ department, onClick }) {
  const { name, code, description, semester_count, course_count } = department;

  return (
    <div
      onClick={onClick}
      className="group cursor-pointer overflow-hidden rounded-3xl border border-slate-200/70 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
    >
      <div className="relative h-52 overflow-hidden">
        <img src={departmentCover(code)} alt="" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-5 text-white">
          <div>
            <span className="rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-xs font-bold tracking-widest backdrop-blur">{code}</span>
            <h3 className="mt-3 text-xl font-bold leading-tight">{name}</h3>
          </div>
          <span className="grid h-10 w-10 place-items-center rounded-full bg-white text-slate-950 transition-transform group-hover:rotate-45"><ArrowUpRight size={18} /></span>
        </div>
      </div>
      <div className="p-5">
        <p className="mb-5 min-h-10 text-sm leading-6 text-slate-600 line-clamp-2">
          {description || 'No description available'}
        </p>
        <div className="flex items-center gap-5 border-t border-slate-100 pt-4 text-sm font-medium text-slate-600">
          <span className="flex items-center gap-2"><CalendarDays size={16} className="text-indigo-600" />{semester_count} semesters</span>
          <span className="flex items-center gap-2"><BookOpen size={16} className="text-indigo-600" />{course_count} courses</span>
        </div>
      </div>
    </div>
  );
}
