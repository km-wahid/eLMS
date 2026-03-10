import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  PlayCircle, CheckCircle, Lock, ChevronLeft, ChevronRight,
  Menu, X, Download, MessageSquare, ClipboardList, Video
} from 'lucide-react';

// Public-domain Big Buck Bunny HLS stream for demo
const DEMO_VIDEO = 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8';
const DEMO_VIDEO_MP4 = 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';

const DEMO_MODULES = [
  { id: 'm1', title: 'Getting Started', lectures: [
    { id: 'l1', title: 'Welcome & Course Overview', duration: '5:20', completed: true },
    { id: 'l2', title: 'Setting Up Your Environment', duration: '8:10', completed: true },
    { id: 'l3', title: 'Your First Program', duration: '12:45', completed: false },
  ]},
  { id: 'm2', title: 'Core Concepts', lectures: [
    { id: 'l4', title: 'Variables & Data Types', duration: '15:30', completed: false },
    { id: 'l5', title: 'Collections & Loops', duration: '22:00', completed: false },
    { id: 'l6', title: 'Functions Deep Dive', duration: '18:15', completed: false },
  ]},
  { id: 'm3', title: 'Object-Oriented Programming', lectures: [
    { id: 'l7', title: 'Classes & Objects', duration: '25:30', completed: false },
    { id: 'l8', title: 'Inheritance', duration: '20:00', completed: false },
    { id: 'l9', title: 'Design Patterns', duration: '28:00', completed: false },
  ]},
  { id: 'm4', title: 'Final Projects', lectures: [
    { id: 'l10', title: 'Project Setup', duration: '10:00', completed: false },
    { id: 'l11', title: 'Building the App', duration: '35:00', completed: false },
    { id: 'l12', title: 'Deployment', duration: '20:00', completed: false },
  ]},
];

const ALL_LECTURES = DEMO_MODULES.flatMap(m => m.lectures);

export default function LecturePage() {
  const { slug, lectureId } = useParams();
  const navigate = useNavigate();

  const [currentId, setCurrentId]   = useState(lectureId || ALL_LECTURES[0].id);
  const [completed, setCompleted]   = useState(() => new Set(ALL_LECTURES.filter(l => l.completed).map(l => l.id)));
  const [sidebarOpen, setSidebar]   = useState(true);
  const [activeTab, setActiveTab]   = useState('overview');

  const lecture   = ALL_LECTURES.find(l => l.id === currentId) || ALL_LECTURES[0];
  const idx       = ALL_LECTURES.indexOf(lecture);
  const prevLec   = idx > 0 ? ALL_LECTURES[idx - 1] : null;
  const nextLec   = idx < ALL_LECTURES.length - 1 ? ALL_LECTURES[idx + 1] : null;
  const progress  = Math.round((completed.size / ALL_LECTURES.length) * 100);

  const markDone = () => {
    setCompleted(prev => new Set([...prev, currentId]));
    if (nextLec) setCurrentId(nextLec.id);
  };

  return (
    <div className="flex h-screen bg-gray-900 text-white overflow-hidden">
      {/* ── Sidebar ─────────────────────────────────── */}
      <aside className={`${sidebarOpen ? 'w-72' : 'w-0'} transition-all duration-200 overflow-hidden bg-gray-800 flex-shrink-0`}>
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-700">
            <Link to={`/courses/${slug}`} className="flex items-center gap-2 text-gray-300 hover:text-white text-sm mb-3">
              <ChevronLeft className="h-4 w-4" /> Back to Course
            </Link>
            <p className="font-semibold text-sm text-white truncate">
              {slug?.replace(/-/g,' ').replace(/\b\w/g,c=>c.toUpperCase())}
            </p>
            {/* Progress */}
            <div className="mt-2">
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>{completed.size}/{ALL_LECTURES.length} lectures</span>
                <span>{progress}%</span>
              </div>
              <div className="h-1.5 bg-gray-600 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>
          </div>

          {/* Module list */}
          <div className="overflow-y-auto flex-1">
            {DEMO_MODULES.map((mod, mi) => (
              <div key={mod.id}>
                <p className="px-4 py-2.5 text-xs font-bold text-gray-400 uppercase tracking-wider bg-gray-700/40">
                  Section {mi + 1}: {mod.title}
                </p>
                {mod.lectures.map(lec => (
                  <button key={lec.id} onClick={() => setCurrentId(lec.id)}
                    className={`w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-gray-700 transition-colors border-l-2
                      ${lec.id === currentId ? 'border-indigo-400 bg-gray-700' : 'border-transparent'}`}>
                    <div className="mt-0.5 shrink-0">
                      {completed.has(lec.id)
                        ? <CheckCircle className="h-4 w-4 text-green-400" />
                        : <PlayCircle className={`h-4 w-4 ${lec.id === currentId ? 'text-indigo-400' : 'text-gray-500'}`} />}
                    </div>
                    <div className="min-w-0">
                      <p className={`text-sm leading-snug truncate ${lec.id === currentId ? 'text-white font-semibold' : 'text-gray-300'}`}>
                        {lec.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">{lec.duration}</p>
                    </div>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* ── Main area ───────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-gray-800 border-b border-gray-700 shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebar(s => !s)} className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-gray-700">
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <p className="font-medium text-sm truncate max-w-xs">{lecture.title}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-xs text-gray-400 hidden sm:block">{progress}% complete</div>
            <Link to={`/courses/${slug}/live`}
              className="flex items-center gap-1.5 text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg">
              <Video className="h-3.5 w-3.5" /> Live Class
            </Link>
            <Link to={`/courses/${slug}/assignments`}
              className="flex items-center gap-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg">
              <ClipboardList className="h-3.5 w-3.5" /> Assignments
            </Link>
          </div>
        </div>

        {/* Video player */}
        <div className="bg-black shrink-0" style={{ maxHeight: '55vh' }}>
          <video
            key={currentId}
            className="w-full h-full"
            style={{ maxHeight: '55vh' }}
            controls
            autoPlay
            src={DEMO_VIDEO_MP4}
          >
            Your browser does not support the video tag.
          </video>
        </div>

        {/* Below video */}
        <div className="flex-1 overflow-y-auto bg-gray-900">
          {/* Nav row */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
            <button onClick={() => prevLec && setCurrentId(prevLec.id)} disabled={!prevLec}
              className="flex items-center gap-2 text-sm text-gray-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed">
              <ChevronLeft className="h-4 w-4" /> Previous
            </button>
            <button onClick={markDone}
              className={`flex items-center gap-2 text-sm font-semibold px-5 py-2 rounded-xl transition-colors
                ${completed.has(currentId) ? 'bg-green-700 text-green-100 cursor-default' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}>
              {completed.has(currentId) ? <><CheckCircle className="h-4 w-4" /> Completed</> : 'Mark Complete & Next'}
            </button>
            <button onClick={() => nextLec && setCurrentId(nextLec.id)} disabled={!nextLec}
              className="flex items-center gap-2 text-sm text-gray-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed">
              Next <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 px-6 pt-4 border-b border-gray-700">
            {['overview', 'resources', 'notes'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`pb-3 text-sm font-medium capitalize border-b-2 transition-colors
                  ${activeTab === tab ? 'border-indigo-400 text-indigo-300' : 'border-transparent text-gray-400 hover:text-gray-200'}`}>
                {tab}
              </button>
            ))}
          </div>

          <div className="px-6 py-6">
            {activeTab === 'overview' && (
              <div>
                <h2 className="text-xl font-bold text-white mb-2">{lecture.title}</h2>
                <p className="text-gray-400 text-sm leading-relaxed">
                  In this lecture, you will learn the key concepts of <strong className="text-gray-200">{lecture.title.toLowerCase()}</strong>.
                  Follow along with the video, pause when needed, and try the exercises on your own before moving on.
                </p>
                <div className="mt-4 p-4 bg-gray-800 rounded-xl border border-gray-700">
                  <h3 className="font-semibold text-white text-sm mb-2">Key Takeaways</h3>
                  <ul className="space-y-1.5 text-sm text-gray-400">
                    {['Understand the core concept clearly', 'Apply it in practice examples', 'Avoid common beginner mistakes', 'Know when and where to use it'].map(t => (
                      <li key={t} className="flex items-center gap-2"><CheckCircle className="h-3.5 w-3.5 text-green-400 shrink-0" />{t}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
            {activeTab === 'resources' && (
              <div className="space-y-3">
                <h2 className="text-lg font-bold text-white mb-3">Downloadable Resources</h2>
                {['Lecture Slides.pdf', 'Code Examples.zip', 'Exercise Sheet.pdf'].map(r => (
                  <div key={r} className="flex items-center justify-between p-3 bg-gray-800 rounded-xl border border-gray-700">
                    <span className="text-sm text-gray-300">{r}</span>
                    <button className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300">
                      <Download className="h-4 w-4" /> Download
                    </button>
                  </div>
                ))}
              </div>
            )}
            {activeTab === 'notes' && (
              <div>
                <h2 className="text-lg font-bold text-white mb-3">Your Notes</h2>
                <textarea
                  placeholder="Take notes for this lecture..."
                  className="w-full h-32 p-3 bg-gray-800 border border-gray-700 rounded-xl text-gray-300 text-sm resize-none focus:outline-none focus:border-indigo-500"
                />
                <button className="mt-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg">
                  Save Notes
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
