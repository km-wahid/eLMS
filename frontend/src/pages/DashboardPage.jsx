import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import {
  BookOpen, PlayCircle, ClipboardList, Video,
  TrendingUp, Clock, CheckCircle, Star, Bell, Users, Award
} from 'lucide-react';

// ─── Demo data ────────────────────────────────────────────
const DEMO_ENROLLED = [
  { id: 1, slug: 'python-for-beginners',    title: 'Python for Beginners',       progress: 68, color: 'from-indigo-500 to-purple-600', lastLesson: 'Functions & Modules' },
  { id: 2, slug: 'web-dev-bootcamp',        title: 'Full-Stack Web Development', progress: 34, color: 'from-blue-500 to-cyan-600',    lastLesson: 'React Hooks Deep Dive' },
  { id: 3, slug: 'data-science-essentials', title: 'Data Science Essentials',    progress: 12, color: 'from-emerald-500 to-teal-600', lastLesson: 'NumPy Basics' },
];

const DEMO_ASSIGNMENTS = [
  { id: 1, title: 'Python OOP Exercise',         course: 'Python for Beginners',       due: '2026-03-12', status: 'pending',   score: null },
  { id: 2, title: 'Build a REST API',            course: 'Full-Stack Web Development', due: '2026-03-10', status: 'submitted', score: null },
  { id: 3, title: 'Pandas Data Analysis Report', course: 'Data Science Essentials',    due: '2026-03-08', status: 'graded',    score: 88 },
  { id: 4, title: 'Responsive Landing Page',     course: 'Full-Stack Web Development', due: '2026-03-15', status: 'pending',   score: null },
];

const DEMO_LIVE = [
  { id: 1, title: 'Python Q&A Session',          course: 'Python for Beginners',       time: 'Today, 3:00 PM',   platform: 'Zoom',   status: 'live' },
  { id: 2, title: 'React State Management',      course: 'Full-Stack Web Development', time: 'Tomorrow, 5:00 PM',platform: 'Meet',   status: 'scheduled' },
  { id: 3, title: 'Data Visualisation Workshop', course: 'Data Science Essentials',    time: 'Mar 12, 2:00 PM',  platform: 'Jitsi',  status: 'scheduled' },
];

const DEMO_NOTIFICATIONS = [
  { id: 1, type: 'assignment_graded', text: 'Your "Pandas Report" was graded: 88/100',       time: '2h ago', read: false },
  { id: 2, type: 'live_starting',     text: 'Python Q&A is starting in 15 minutes',          time: '3h ago', read: false },
  { id: 3, type: 'submission_new',    text: 'New material uploaded in Python for Beginners', time: '1d ago', read: true  },
];

// ─── helpers ──────────────────────────────────────────────
const assignmentStatusStyle = {
  pending:   'bg-yellow-100 text-yellow-700',
  submitted: 'bg-blue-100 text-blue-700',
  graded:    'bg-green-100 text-green-700',
  late:      'bg-red-100 text-red-700',
};

function isDueSoon(dateStr) {
  const diff = new Date(dateStr) - new Date();
  return diff > 0 && diff < 2 * 86400000;
}

// ─── sub-components ───────────────────────────────────────
function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="h-6 w-6 text-white" />
      </div>
      <div>
        <p className="text-2xl font-extrabold text-gray-900">{value}</p>
        <p className="text-xs text-gray-500">{label}</p>
      </div>
    </div>
  );
}

function ProgressBar({ pct }) {
  return (
    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
      <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
    </div>
  );
}

// ─── main component ───────────────────────────────────────
export default function DashboardPage() {
  const { user } = useAuthStore();
  const isTeacher = user?.role === 'teacher' || user?.role === 'admin';
  const name = user?.first_name || user?.name || user?.email?.split('@')[0] || 'there';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero greeting */}
      <div className="bg-gradient-to-r from-indigo-700 to-purple-700 px-6 py-10">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-extrabold text-white">
            Welcome back, {name}! 👋
          </h1>
          <p className="text-indigo-200 mt-1">
            {isTeacher ? 'Manage your courses and track student progress.' : 'Pick up where you left off.'}
          </p>

          {/* Quick stats */}
          {!isTeacher && (
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Enrolled',   value: '3',   icon: BookOpen,      color: 'bg-white/20' },
                { label: 'Completed',  value: '1',   icon: CheckCircle,   color: 'bg-white/20' },
                { label: 'Pending',    value: '2',   icon: ClipboardList, color: 'bg-white/20' },
                { label: 'Live Today', value: '1',   icon: Video,         color: 'bg-white/20' },
              ].map(s => (
                <div key={s.label} className="bg-white/10 backdrop-blur rounded-xl px-4 py-3 flex items-center gap-3">
                  <s.icon className="h-5 w-5 text-white/70" />
                  <div>
                    <p className="text-xl font-bold text-white">{s.value}</p>
                    <p className="text-xs text-indigo-200">{s.label}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">

        {/* ── My Courses ──────────────────────────────────── */}
        {!isTeacher && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">Continue Learning</h2>
              <Link to="/my-learning" className="text-sm text-indigo-600 hover:underline">View all →</Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {DEMO_ENROLLED.map(c => (
                <div key={c.id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                  <div className={`h-24 bg-gradient-to-br ${c.color} flex items-center justify-center`}>
                    <PlayCircle className="h-10 w-10 text-white/80" />
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-sm text-gray-800 dark:text-gray-100 line-clamp-1">{c.title}</h3>
                    <p className="text-xs text-gray-400 mt-0.5 mb-3 line-clamp-1">Next: {c.lastLesson}</p>
                    <ProgressBar pct={c.progress} />
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-400">{c.progress}% complete</span>
                      <Link to={`/courses/${c.slug}/learn`}
                        className="text-xs px-3 py-1 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                        Resume →
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Teacher: stats */}
        {isTeacher && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard icon={BookOpen}    label="Courses Published"  value="4"    color="bg-indigo-500" />
            <StatCard icon={Users}       label="Total Students"     value="312"  color="bg-emerald-500" />
            <StatCard icon={ClipboardList} label="Assignments"      value="18"   color="bg-purple-500" />
            <StatCard icon={TrendingUp}  label="Avg. Rating"        value="4.8"  color="bg-orange-500" />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Assignments ───────────────────────────────── */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
              <h2 className="font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-indigo-500" /> Assignments
              </h2>
              <Link to="/courses/python-for-beginners/assignments" className="text-sm text-indigo-600 hover:underline">View all</Link>
            </div>
            <ul className="divide-y divide-gray-100 dark:divide-gray-700">
              {DEMO_ASSIGNMENTS.map(a => (
                <li key={a.id} className="px-6 py-4 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{a.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{a.course}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {isDueSoon(a.due) && a.status === 'pending' && (
                      <span className="text-xs text-red-500 font-medium">Due soon!</span>
                    )}
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(a.due).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                    {a.status === 'graded' && a.score !== null ? (
                      <span className="flex items-center gap-1 text-xs font-semibold text-green-600">
                        <Award className="h-3.5 w-3.5" /> {a.score}/100
                      </span>
                    ) : (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${assignmentStatusStyle[a.status]}`}>
                        {a.status}
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Right column ──────────────────────────────── */}
          <div className="space-y-5">

            {/* Live Classes */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
                <h2 className="font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                  <Video className="h-4 w-4 text-red-500" /> Live Classes
                </h2>
              </div>
              <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                {DEMO_LIVE.map(s => (
                  <li key={s.id} className="px-5 py-3 flex items-start gap-3">
                    <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${s.status === 'live' ? 'bg-red-500 animate-pulse' : 'bg-blue-400'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{s.title}</p>
                      <p className="text-xs text-gray-400">{s.time} · {s.platform}</p>
                    </div>
                    {s.status === 'live' && (
                      <span className="text-xs bg-red-100 text-red-600 font-semibold px-2 py-0.5 rounded-full">LIVE</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            {/* Notifications */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
                <h2 className="font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                  <Bell className="h-4 w-4 text-indigo-500" /> Notifications
                </h2>
                <span className="text-xs bg-red-500 text-white font-bold px-1.5 py-0.5 rounded-full">2</span>
              </div>
              <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                {DEMO_NOTIFICATIONS.map(n => (
                  <li key={n.id} className={`px-5 py-3 ${!n.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                    <p className="text-xs text-gray-700 dark:text-gray-300">{n.text}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{n.time}</p>
                  </li>
                ))}
              </ul>
            </div>

          </div>
        </div>

        {/* ── Quick links ───────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { to: '/courses',       icon: BookOpen,      label: 'Browse Courses',  color: 'bg-indigo-50 text-indigo-600 border-indigo-100' },
            { to: '/my-learning',   icon: Star,          label: 'My Learning',     color: 'bg-purple-50 text-purple-600 border-purple-100' },
            { to: '/courses/python-for-beginners/assignments', icon: ClipboardList, label: 'Assignments', color: 'bg-yellow-50 text-yellow-600 border-yellow-100' },
            { to: '/profile',       icon: Users,         label: 'My Profile',      color: 'bg-green-50 text-green-600 border-green-100' },
          ].map(q => (
            <Link key={q.to} to={q.to}
              className={`flex flex-col items-center gap-2 p-5 rounded-2xl border font-medium text-sm hover:shadow-md transition-all ${q.color}`}>
              <q.icon className="h-6 w-6" />
              {q.label}
            </Link>
          ))}
        </div>

      </div>
    </div>
  );
}
