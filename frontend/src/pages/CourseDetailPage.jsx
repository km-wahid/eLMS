import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import {
  BookOpen, Clock, Users, Star, PlayCircle, CheckCircle,
  ClipboardList, Video, Download, ChevronDown, ChevronRight,
  Award, Globe, Wifi
} from 'lucide-react';

// ─── Demo course data keyed by slug ───────────────────────
const DEMO_COURSES = {
  'python-for-beginners': {
    slug: 'python-for-beginners', title: 'Python for Beginners',
    instructor: 'Dr. Sarah Ahmed', instructor_bio: 'PhD in Computer Science, 10+ years teaching Python.',
    category: 'Programming', level: 'beginner', price: '0.00',
    rating: 4.8, total_enrolled: 1240, duration: '18h 30m', lectures_count: 42,
    color: 'from-indigo-600 to-purple-700',
    description: 'Master Python from zero to hero. This comprehensive course covers variables, data types, loops, functions, OOP, file I/O and real-world projects. Perfect for complete beginners.',
    what_you_learn: ['Python syntax & fundamentals','Functions & OOP','File handling & exceptions','Build 3 real projects','Automated scripts','Data structures'],
    modules: [
      { id: 'm1', title: 'Getting Started', lectures: [
        { id: 'l1', title: 'Welcome & Setup', duration: '5:20', free: true },
        { id: 'l2', title: 'Installing Python & VS Code', duration: '8:10', free: true },
        { id: 'l3', title: 'Your First Python Program', duration: '12:45', free: false },
      ]},
      { id: 'm2', title: 'Core Python', lectures: [
        { id: 'l4', title: 'Variables & Data Types', duration: '15:30', free: false },
        { id: 'l5', title: 'Lists, Tuples & Dictionaries', duration: '22:00', free: false },
        { id: 'l6', title: 'Loops & Conditionals', duration: '18:15', free: false },
      ]},
      { id: 'm3', title: 'Functions & OOP', lectures: [
        { id: 'l7', title: 'Defining Functions', duration: '14:00', free: false },
        { id: 'l8', title: 'Classes & Objects', duration: '25:30', free: false },
        { id: 'l9', title: 'Inheritance & Polymorphism', duration: '20:00', free: false },
      ]},
      { id: 'm4', title: 'Projects', lectures: [
        { id: 'l10', title: 'Project: Calculator App', duration: '30:00', free: false },
        { id: 'l11', title: 'Project: File Organizer', duration: '35:00', free: false },
      ]},
    ],
    assignments: [
      { title: 'Python OOP Exercise', due: '3 days', status: 'open' },
      { title: 'Build a REST Client', due: '7 days', status: 'open' },
    ],
    live_sessions: [
      { title: 'Python Q&A Session', time: 'Today, 3:00 PM', status: 'live', platform: 'Zoom' },
      { title: 'Code Review Workshop', time: 'Mar 15, 5:00 PM', status: 'scheduled', platform: 'Meet' },
    ],
  },
};

// Fallback for any unrecognised slug
const buildFallback = (slug) => ({
  slug, title: slug.replace(/-/g,' ').replace(/\b\w/g,c=>c.toUpperCase()),
  instructor: 'Staff Instructor', instructor_bio: 'Expert in this subject.',
  category: 'General', level: 'intermediate', price: '29.99',
  rating: 4.5, total_enrolled: 120, duration: '10h', lectures_count: 20,
  color: 'from-blue-600 to-cyan-700',
  description: 'A comprehensive course covering all the fundamentals and advanced topics.',
  what_you_learn: ['Core concepts','Best practices','Real projects','Industry tools'],
  modules: [
    { id: 'm1', title: 'Introduction', lectures: [
      { id: 'l1', title: 'Course Overview', duration: '5:00', free: true },
      { id: 'l2', title: 'Environment Setup', duration: '10:00', free: true },
    ]},
    { id: 'm2', title: 'Core Topics', lectures: [
      { id: 'l3', title: 'Lesson 1', duration: '15:00', free: false },
      { id: 'l4', title: 'Lesson 2', duration: '18:00', free: false },
    ]},
  ],
  assignments: [{ title: 'Module Assignment', due: '7 days', status: 'open' }],
  live_sessions: [{ title: 'Live Q&A', time: 'Next week', status: 'scheduled', platform: 'Zoom' }],
});

export default function CourseDetailPage() {
  const { slug } = useParams();
  const { user, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  const course = DEMO_COURSES[slug] || buildFallback(slug);

  const [enrolled, setEnrolled]       = useState(false);
  const [enrolling, setEnrolling]     = useState(false);
  const [openModules, setOpenModules] = useState({ m1: true });

  const handleEnroll = () => {
    if (!isAuthenticated) { navigate('/login'); return; }
    setEnrolling(true);
    setTimeout(() => { setEnrolled(true); setEnrolling(false); }, 900);
  };

  const toggleModule = (id) => setOpenModules(p => ({ ...p, [id]: !p[id] }));

  const isFree = parseFloat(course.price) === 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Hero ────────────────────────────────────────── */}
      <div className={`bg-gradient-to-r ${course.color} py-12 px-4`}>
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8 items-start">
          <div className="md:col-span-2 text-white">
            <div className="flex items-center gap-2 mb-3">
              <span className="bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full">{course.category}</span>
              <span className="bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full capitalize">{course.level}</span>
              {isFree && <span className="bg-green-400 text-white text-xs font-bold px-3 py-1 rounded-full">FREE</span>}
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold mb-3">{course.title}</h1>
            <p className="text-white/85 text-base mb-5">{course.description}</p>
            <div className="flex flex-wrap items-center gap-5 text-sm text-white/80">
              <span className="flex items-center gap-1.5"><Star className="h-4 w-4 fill-yellow-400 text-yellow-400" /><b className="text-white">{course.rating}</b> rating</span>
              <span className="flex items-center gap-1.5"><Users className="h-4 w-4" />{course.total_enrolled.toLocaleString()} students</span>
              <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" />{course.duration}</span>
              <span className="flex items-center gap-1.5"><PlayCircle className="h-4 w-4" />{course.lectures_count} lectures</span>
            </div>
            <p className="mt-4 text-white/70 text-sm">Created by <span className="text-white font-medium">{course.instructor}</span></p>
          </div>

          {/* Enroll card */}
          <div className="bg-white rounded-2xl shadow-2xl p-6 text-gray-800">
            <div className="aspect-video rounded-xl overflow-hidden bg-gray-900 flex items-center justify-center mb-4 relative group cursor-pointer"
              onClick={() => enrolled && navigate(`/courses/${slug}/learn`)}>
              <div className={`absolute inset-0 bg-gradient-to-br ${course.color} opacity-70`} />
              <PlayCircle className="h-16 w-16 text-white relative z-10 group-hover:scale-110 transition-transform" />
              {!enrolled && <p className="absolute bottom-3 text-white text-xs z-10">Preview available</p>}
            </div>

            {enrolled ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-green-600 font-semibold text-sm">
                  <CheckCircle className="h-5 w-5" /> You're enrolled!
                </div>
                <button onClick={() => navigate(`/courses/${slug}/learn`)}
                  className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all text-lg">
                  Continue Learning →
                </button>
                <Link to={`/courses/${slug}/assignments`}
                  className="flex items-center justify-center gap-2 w-full py-2.5 border border-indigo-200 text-indigo-700 font-medium rounded-xl hover:bg-indigo-50 text-sm">
                  <ClipboardList className="h-4 w-4" /> View Assignments
                </Link>
                <Link to={`/courses/${slug}/live`}
                  className="flex items-center justify-center gap-2 w-full py-2.5 border border-red-200 text-red-600 font-medium rounded-xl hover:bg-red-50 text-sm">
                  <Video className="h-4 w-4" /> Live Classes
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold">{isFree ? 'Free' : `$${course.price}`}</span>
                  {!isFree && <span className="text-gray-400 line-through text-sm">$99.99</span>}
                </div>
                <button onClick={handleEnroll} disabled={enrolling}
                  className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-60 transition-all text-lg">
                  {enrolling ? 'Enrolling…' : isFree ? 'Enroll for Free' : 'Buy Now'}
                </button>
                <p className="text-center text-xs text-gray-400">30-day money-back guarantee</p>
                <div className="text-xs text-gray-500 space-y-1.5 pt-2 border-t">
                  {[`${course.duration} of content`, `${course.lectures_count} lectures`, 'Full lifetime access', 'Certificate of completion'].map(f => (
                    <div key={f} className="flex items-center gap-2"><CheckCircle className="h-3.5 w-3.5 text-green-500" />{f}</div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Body ────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 py-10 grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">

          {/* What you'll learn */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-4">What you'll learn</h2>
            <div className="grid sm:grid-cols-2 gap-2">
              {course.what_you_learn.map(item => (
                <div key={item} className="flex items-start gap-2 text-sm text-gray-700">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />{item}
                </div>
              ))}
            </div>
          </div>

          {/* Course content (modules) */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Course Content</h2>
              <p className="text-sm text-gray-400 mt-0.5">{course.modules.length} modules · {course.lectures_count} lectures · {course.duration}</p>
            </div>
            {course.modules.map(mod => (
              <div key={mod.id} className="border-b border-gray-100 last:border-0">
                <button onClick={() => toggleModule(mod.id)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 text-left">
                  <div className="flex items-center gap-3">
                    {openModules[mod.id] ? <ChevronDown className="h-4 w-4 text-gray-400" /> : <ChevronRight className="h-4 w-4 text-gray-400" />}
                    <span className="font-semibold text-gray-800">{mod.title}</span>
                  </div>
                  <span className="text-xs text-gray-400">{mod.lectures.length} lectures</span>
                </button>
                {openModules[mod.id] && (
                  <ul className="bg-gray-50">
                    {mod.lectures.map(lec => (
                      <li key={lec.id} className="px-8 py-3 flex items-center justify-between border-t border-gray-100">
                        <div className="flex items-center gap-3 text-sm">
                          {lec.free ? (
                            <button onClick={() => navigate(`/courses/${slug}/learn`)}
                              className="flex items-center gap-2 text-indigo-600 hover:underline font-medium">
                              <PlayCircle className="h-4 w-4" />{lec.title}
                            </button>
                          ) : (
                            <span className="flex items-center gap-2 text-gray-700">
                              {enrolled
                                ? <button onClick={() => navigate(`/courses/${slug}/learn`)} className="flex items-center gap-2 text-indigo-600 hover:underline"><PlayCircle className="h-4 w-4" />{lec.title}</button>
                                : <><PlayCircle className="h-4 w-4 text-gray-300" />{lec.title}</>}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {lec.free && <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded-full">Preview</span>}
                          <span className="text-xs text-gray-400">{lec.duration}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>

          {/* Assignments */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-indigo-500" /> Assignments
            </h2>
            <ul className="space-y-3">
              {course.assignments.map(a => (
                <li key={a.title} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{a.title}</p>
                    <p className="text-xs text-gray-400">Due in {a.due}</p>
                  </div>
                  {enrolled
                    ? <Link to={`/courses/${slug}/assignments`} className="text-xs px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">View</Link>
                    : <span className="text-xs text-gray-400 px-3 py-1.5 bg-gray-200 rounded-lg">Enroll to access</span>}
                </li>
              ))}
            </ul>
          </div>

          {/* Live sessions */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Video className="h-5 w-5 text-red-500" /> Live Classes
            </h2>
            <ul className="space-y-3">
              {course.live_sessions.map(s => (
                <li key={s.title} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${s.status === 'live' ? 'bg-red-500 animate-pulse' : 'bg-blue-400'}`} />
                    <div>
                      <p className="text-sm font-medium text-gray-800">{s.title}</p>
                      <p className="text-xs text-gray-400">{s.time} · {s.platform}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {s.status === 'live' && <span className="text-xs bg-red-100 text-red-600 font-bold px-2 py-0.5 rounded-full">LIVE</span>}
                    {enrolled
                      ? <Link to={`/courses/${slug}/live`} className="text-xs px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600">Join</Link>
                      : <span className="text-xs text-gray-400 px-3 py-1.5 bg-gray-200 rounded-lg">Enroll to join</span>}
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Instructor */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Your Instructor</h2>
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-extrabold text-xl shrink-0">
                {course.instructor[0]}
              </div>
              <div>
                <p className="font-semibold text-gray-900">{course.instructor}</p>
                <p className="text-sm text-gray-500 mt-1">{course.instructor_bio}</p>
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                  <span className="flex items-center gap-1"><Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />{course.rating} rating</span>
                  <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{course.total_enrolled.toLocaleString()} students</span>
                  <span className="flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" />3 courses</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right sidebar (sticky) ───────────────────── */}
        <div className="space-y-4 hidden md:block">
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm sticky top-20">
            <h3 className="font-bold text-gray-800 mb-3">This course includes</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              {[
                [PlayCircle,    `${course.duration} on-demand video`],
                [Download,      'Downloadable resources'],
                [ClipboardList, `${course.assignments.length} assignments`],
                [Video,         `${course.live_sessions.length} live sessions`],
                [Wifi,          'Lifetime access'],
                [Globe,         'Access on all devices'],
                [Award,         'Certificate of completion'],
              ].map(([Icon, text]) => (
                <li key={text} className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-indigo-400 shrink-0" />{text}
                </li>
              ))}
            </ul>
            {!enrolled && (
              <button onClick={handleEnroll} disabled={enrolling}
                className="mt-5 w-full py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-60 transition-all">
                {enrolling ? 'Enrolling…' : isFree ? 'Enroll Free' : `Buy $${course.price}`}
              </button>
            )}
            {enrolled && (
              <button onClick={() => navigate(`/courses/${slug}/learn`)}
                className="mt-5 w-full py-2.5 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-all">
                Continue Learning →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
