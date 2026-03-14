import React from 'react';

export default function ProgressBar({ lecturesWatched, totalLectures, materialsDownloaded, totalMaterials }) {
  const lectureCompletion = totalLectures > 0 ? (lecturesWatched / totalLectures) * 100 : 0;
  const materialCompletion = totalMaterials > 0 ? (materialsDownloaded / totalMaterials) * 100 : 0;
  const overallCompletion = ((lectureCompletion + materialCompletion) / 2).toFixed(1);

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-semibold text-gray-900">Overall Progress</h3>
          <span className="text-2xl font-bold text-indigo-600">{overallCompletion}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-indigo-500 to-purple-600 h-3 rounded-full transition-all duration-300"
            style={{ width: `${overallCompletion}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm text-gray-600">Lectures Watched</span>
            <span className="text-sm font-semibold text-gray-900">
              {lecturesWatched} / {totalLectures}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${lectureCompletion}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm text-gray-600">Materials Downloaded</span>
            <span className="text-sm font-semibold text-gray-900">
              {materialsDownloaded} / {totalMaterials}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${materialCompletion}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
