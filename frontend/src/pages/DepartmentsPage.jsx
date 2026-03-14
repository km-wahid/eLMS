import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDepartmentStore } from '../store/departmentStore';
import DepartmentCard from '../components/academics/DepartmentCard';
import Layout from '../components/layout/Layout';

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
      <div className="min-h-[calc(100vh-3.5rem)] bg-gradient-to-br from-slate-50 to-slate-100 py-8">
        <div className="max-w-7xl mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Academic Departments</h1>
            <p className="text-gray-600">Browse departments, semesters, and courses</p>
          </div>

          {/* Search Bar */}
          <div className="mb-8">
            <input
              type="text"
              placeholder="Search departments by name or code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-6 py-3 rounded-lg border-2 border-gray-200 focus:border-indigo-500 focus:outline-none"
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
            <div className="text-center py-12">
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
