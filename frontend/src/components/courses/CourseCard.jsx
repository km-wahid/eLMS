import { Link } from 'react-router-dom';

const levelColors = {
  beginner: 'bg-green-100 text-green-700',
  intermediate: 'bg-yellow-100 text-yellow-700',
  advanced: 'bg-red-100 text-red-700',
};

export default function CourseCard({ course }) {
  return (
    <Link
      to={`/courses/${course.slug}`}
      className="card hover:shadow-lg transition-shadow block"
    >
      {course.thumbnail_url ? (
        <img
          src={course.thumbnail_url}
          alt={course.title}
          className="w-full h-40 object-cover rounded-t-xl -mt-6 -mx-6 mb-4"
          style={{ width: 'calc(100% + 3rem)' }}
        />
      ) : (
        <div className="bg-indigo-100 h-40 rounded-t-xl -mt-6 -mx-6 mb-4 flex items-center justify-center">
          <span className="text-indigo-400 text-4xl">📚</span>
        </div>
      )}
      <h3 className="font-semibold text-gray-900 text-lg mb-1 line-clamp-2">
        {course.title}
      </h3>
      <p className="text-gray-500 text-sm mb-3 line-clamp-2">{course.description}</p>
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">by {course.teacher_name}</span>
        <span
          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
            levelColors[course.level] || ''
          }`}
        >
          {course.level}
        </span>
      </div>
      <div className="flex items-center justify-between mt-3 text-sm text-gray-500">
        <span>{course.module_count} modules</span>
        <span>{course.enrollment_count} students</span>
        <span className="font-semibold text-indigo-600">
          {Number(course.price) === 0 ? 'Free' : `$${course.price}`}
        </span>
      </div>
    </Link>
  );
}
