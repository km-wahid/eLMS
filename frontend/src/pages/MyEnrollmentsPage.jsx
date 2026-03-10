import { Link } from 'react-router-dom';
import { PlayCircle, Clock, BookOpen, Award } from 'lucide-react';

const ENROLLED = [
  { slug:'python-for-beginners', title:'Python for Beginners', instructor:'Dr. Sarah Ahmed', progress:65, color:'from-indigo-500 to-purple-600', total:42, done:27 },
  { slug:'react-complete-guide', title:'React – The Complete Guide', instructor:'Prof. Ali Hassan', progress:30, color:'from-blue-500 to-cyan-600', total:55, done:16 },
  { slug:'data-science-bootcamp', title:'Data Science Bootcamp', instructor:'Dr. Ayesha Khan', progress:10, color:'from-green-500 to-teal-600', total:80, done:8 },
];

export default function MyEnrollmentsPage() {
  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">My Learning</h1>
        <p className="text-gray-500 text-sm mb-8">{ENROLLED.length} enrolled courses</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {ENROLLED.map(c => (
            <div key={c.slug} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              <div className={`h-28 bg-gradient-to-r ${c.color} relative`}>
                <div className="absolute inset-0 flex items-center justify-center">
                  <PlayCircle className="h-12 w-12 text-white/80" />
                </div>
                <div className="absolute top-3 right-3 bg-white/20 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {c.progress}%
                </div>
              </div>
              <div className="p-4">
                <h2 className="font-bold text-gray-900 text-sm leading-snug mb-1">{c.title}</h2>
                <p className="text-xs text-gray-400 mb-3">{c.instructor}</p>
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>{c.done} / {c.total} lectures</span>
                    <span>{c.progress}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${c.progress}%` }} />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link to={`/courses/${c.slug}/learn`}
                    className="flex-1 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl text-center hover:bg-indigo-700 transition-colors">
                    Continue →
                  </Link>
                  <Link to={`/courses/${c.slug}`}
                    className="px-3 py-2 border border-gray-200 text-gray-500 text-xs rounded-xl hover:bg-gray-50 transition-colors">
                    Info
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
