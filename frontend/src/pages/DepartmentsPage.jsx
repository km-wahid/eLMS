import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDepartmentStore } from '../store/departmentStore';
import DepartmentCard from '../components/academics/DepartmentCard';
import Layout from '../components/layout/Layout';
import { Building2, Search, Sparkles } from 'lucide-react';

export default function DepartmentsPage() {
  const navigate = useNavigate();
  const { departments, loading, error, fetchDepartments } = useDepartmentStore();
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchDepartments({ search: searchTerm });
  }, [searchTerm]);

  const filteredDepartments = departments.filter((dept) =>
    dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dept.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout>
      <div className="min-h-[calc(100vh-3.5rem)] bg-[#f6f7fb] py-8 sm:py-12">
        <div className="page-shell">
          <div className="relative mb-8 overflow-hidden rounded-[2rem] bg-slate-950 p-7 text-white sm:p-10">
            <div className="absolute -right-20 -top-28 h-72 w-72 rounded-full bg-indigo-500/30 blur-3xl" />
            <div className="relative max-w-3xl">
              <p className="eyebrow !text-indigo-300"><Sparkles size={14} /> Explore your path</p>
              <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-6xl">Eight departments.<br /><span className="text-indigo-300">One learning home.</span></h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">Move from department to semester to course, then learn through structured videos, readings, notes, labs, and assignments.</p>
              <div className="mt-7 flex flex-wrap gap-3 text-sm font-semibold text-slate-200"><span className="rounded-full bg-white/10 px-4 py-2">8 departments</span><span className="rounded-full bg-white/10 px-4 py-2">64 semesters</span><span className="rounded-full bg-white/10 px-4 py-2">512 courses</span></div>
            </div>
          </div>

          <div className="relative mb-8 max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={19} />
            <input
              type="text"
              placeholder="Search departments by name or code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-12 pr-5 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-100"
            />
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-700">
              Failed to load departments: {error}
            </div>
          )}

          {/* Departments Grid */}
          {!loading && filteredDepartments.length > 0 && (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredDepartments.map((dept) => (
                <DepartmentCard
                  key={dept.id}
                  department={dept}
                  onClick={() => navigate(`/departments/${dept.slug}`)}
                />
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && filteredDepartments.length === 0 && (
            <div className="surface py-16 text-center">
              <Building2 className="mx-auto mb-4 text-slate-300" size={40} />
              <div className="text-gray-400 text-lg mb-4">
                {searchTerm ? 'No departments found matching your search' : 'No departments available'}
              </div>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="text-indigo-600 hover:text-indigo-700 font-semibold"
                >
                  Clear search
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
