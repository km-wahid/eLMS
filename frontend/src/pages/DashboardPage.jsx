import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, BarChart3, Bell, BookOpen, CheckCircle2, ClipboardList,
  FileText, GraduationCap, Layers3, Play, Plus, ShieldCheck, TrendingUp,
  Users, Video,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import { getAnalyticsDashboard } from '../services/adminService';
import { departmentCover } from '../utils/departmentCovers';

const studentTasks = [
  { title: 'Programming lab submission', course: 'Structured Programming', status: 'Due this week' },
  { title: 'Read module 3 notes', course: 'Introduction to Computing', status: 'In progress' },
  { title: 'Prepare for the live review', course: 'Discrete Mathematics', status: 'Tomorrow' },
];

const roleCopy = {
  student: ['Student workspace', 'Keep your degree moving forward.'],
  teacher: ['Teaching workspace', 'Plan, publish, and support every learner.'],
  admin: ['Administration workspace', 'Keep academics, people, and content in sync.'],
  superuser: ['System workspace', 'A complete view of platform operations.'],
};

function Metric({ icon: Icon, value, label, detail }) {
  return (
    <div className="surface p-5 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:border-indigo-300/80 group">
      <div className="flex items-start justify-between gap-4">
        <div><p className="text-3xl font-black tracking-tight text-slate-950">{value}</p><p className="mt-1 font-bold text-slate-700">{label}</p>{detail && <p className="mt-1 text-xs text-slate-500">{detail}</p>}</div>
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-indigo-50 text-indigo-600 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300"><Icon size={21} /></span>
      </div>
    </div>
  );
}

function Progress({ value = 0 }) {
  const safe = Math.max(0, Math.min(100, Number(value) || 0));
  return <div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-indigo-600" style={{ width: `${safe}%` }} /></div>;
}

function StudentDashboard({ enrollments, loading }) {
  const average = enrollments.length ? Math.round(enrollments.reduce((sum, item) => sum + (Number(item.progress) || 0), 0) / enrollments.length) : 0;
  return <>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 animate-fade-up delay-150">
      <Metric icon={BookOpen} value={enrollments.length} label="Enrolled courses" detail="Your active learning plan" />
      <Metric icon={TrendingUp} value={`${average}%`} label="Average progress" detail="Across current courses" />
      <Metric icon={CheckCircle2} value={enrollments.filter(item => Number(item.progress) >= 100).length} label="Completed" detail="Courses finished" />
      <Metric icon={ClipboardList} value={studentTasks.length} label="Upcoming tasks" detail="Representative schedule" />
    </div>
    <div className="grid gap-6 lg:grid-cols-[1.65fr_1fr] animate-fade-up delay-300">
      <section className="surface overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 p-6"><div><p className="eyebrow">Continue learning</p><h2 className="mt-2 text-2xl font-black text-slate-950">Your courses</h2></div><Link to="/my-learning" className="text-sm font-bold text-indigo-600 hover:text-indigo-700">View all</Link></div>
        {loading ? <p className="p-8 text-sm text-slate-500">Loading your courses…</p> : enrollments.length ? <div className="divide-y divide-slate-100">{enrollments.slice(0, 4).map(item => <div key={item.id} className="flex items-center gap-4 p-5 transition-all duration-200 hover:bg-slate-50/90"><img src={departmentCover(item.department_code || 'CSE')} alt="" className="h-16 w-24 rounded-xl object-cover" /><div className="min-w-0 flex-1"><div className="mb-2 flex items-center justify-between gap-3"><h3 className="truncate font-bold text-slate-900">{item.course_title}</h3><span className="text-xs font-bold text-indigo-600">{item.progress || 0}%</span></div><Progress value={item.progress} /></div><Link to={`/learn/${item.course_slug}`} className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-slate-950 text-white hover:bg-indigo-600 hover:scale-110 transition-all"><Play size={16} /></Link></div>)}</div> : <div className="p-10 text-center"><BookOpen className="mx-auto text-slate-300" size={38}/><p className="mt-3 text-slate-500">Your learning list is empty.</p><Link to="/departments" className="btn btn-primary mt-5">Find a course</Link></div>}
      </section>
      <section className="surface p-6"><p className="eyebrow">Next up</p><h2 className="mt-2 text-2xl font-black text-slate-950">Study plan</h2><div className="mt-5 space-y-3">{studentTasks.map((task, index) => <div key={task.title} className="rounded-2xl bg-slate-50 p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:bg-white hover:border hover:border-indigo-100"><div className="flex gap-3"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white text-xs font-black text-indigo-600 shadow-sm">{index + 1}</span><div><p className="text-sm font-bold text-slate-800">{task.title}</p><p className="mt-1 text-xs text-slate-500">{task.course} · {task.status}</p></div></div></div>)}</div></section>
    </div>
  </>;
}

function TeacherDashboard({ courses, loading }) {
  const enrollmentTotal = courses.reduce((sum, course) => sum + (course.enrollment_count || 0), 0);
  const moduleTotal = courses.reduce((sum, course) => sum + (course.module_count || 0), 0);
  return <>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 animate-fade-up delay-150"><Metric icon={BookOpen} value={courses.length} label="My courses" detail={`${courses.filter(c => c.is_published).length} published`} /><Metric icon={Users} value={enrollmentTotal} label="Learners" detail="Across your courses" /><Metric icon={Layers3} value={moduleTotal} label="Modules" detail="Structured learning units" /><Metric icon={FileText} value={courses.length * 3} label="Content queue" detail="Representative activities" /></div>
    <div className="grid gap-6 lg:grid-cols-[1.65fr_1fr] animate-fade-up delay-300">
      <section className="surface overflow-hidden"><div className="flex items-center justify-between border-b border-slate-100 p-6"><div><p className="eyebrow">Course studio</p><h2 className="mt-2 text-2xl font-black text-slate-950">Teaching now</h2></div><Link to="/courses/new" className="btn btn-primary"><Plus size={16}/>New course</Link></div>{loading ? <p className="p-8 text-slate-500">Loading courses…</p> : <div className="divide-y divide-slate-100">{courses.slice(0, 5).map(course => <div key={course.id} className="flex items-center gap-4 p-5"><img src={departmentCover(course.department_code)} alt="" className="h-16 w-24 rounded-xl object-cover"/><div className="min-w-0 flex-1"><p className="text-xs font-bold tracking-widest text-indigo-600">{course.course_code}</p><h3 className="truncate font-bold text-slate-900">{course.title}</h3><p className="mt-1 text-xs text-slate-500">{course.module_count || 0} modules · {course.enrollment_count || 0} learners</p></div><span className={`rounded-full px-3 py-1 text-xs font-bold ${course.is_published ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{course.is_published ? 'Published' : 'Draft'}</span><Link to={`/teacher/courses/${course.id}/edit`} className="text-sm font-bold text-indigo-600">Edit</Link></div>)}</div>}</section>
      <section className="space-y-5"><div className="surface p-6"><p className="eyebrow">Quick actions</p><div className="mt-4 grid gap-3">{[[Plus,'Create course','/courses/new'],[FileText,'Manage materials','/teacher/materials'],[BarChart3,'Course analytics','/my-courses'],[Video,'Live sessions','/my-courses']].map(([Icon,label,to]) => <Link key={label} to={to} className="flex items-center justify-between rounded-xl bg-slate-50 p-4 font-bold text-slate-700 hover:bg-indigo-50 hover:text-indigo-700"><span className="flex items-center gap-3"><Icon size={18}/>{label}</span><ArrowRight size={16}/></Link>)}</div></div></section>
    </div>
  </>;
}

function AdminDashboard({ analytics, role }) {
  const core = analytics?.core_metrics || {};
  const activity = analytics?.activity_metrics || {};
  const popular = analytics?.course_analytics?.popular_courses || [];
  const links = role === 'superuser' ? [[Users,'Manage every user','/cms/users'],[ShieldCheck,'System CMS','/cms'],[BarChart3,'Platform analytics','/admin'],[BookOpen,'Course catalog','/cms/courses']] : [[GraduationCap,'Departments','/cms/departments'],[Layers3,'Semesters','/cms/semesters'],[BookOpen,'Courses','/cms/courses'],[TrendingUp,'Learning progress','/admin']];
  return <>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 animate-fade-up delay-150"><Metric icon={Users} value={core.total_students || 0} label="Students" detail={`${activity.active_students || 0} active`} /><Metric icon={GraduationCap} value={core.total_teachers || 0} label="Teachers" detail={`${activity.active_teachers || 0} active`} /><Metric icon={BookOpen} value={core.total_courses || 0} label="Courses" detail={`${core.published_courses || 0} published`} /><Metric icon={TrendingUp} value={core.total_enrollments || 0} label="Enrollments" detail={`${Number(activity.avg_completion_percentage || 0).toFixed(1)}% completion`} /></div>
    <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr] animate-fade-up delay-300">
      <section className="surface p-6"><p className="eyebrow">Platform pulse</p><h2 className="mt-2 text-2xl font-black text-slate-950">Popular courses</h2><div className="mt-5 space-y-4">{popular.slice(0, 5).map((course, index) => <div key={course.id || index} className="flex items-center gap-4"><span className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-50 text-sm font-black text-indigo-700">{index + 1}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-slate-800">{course.title}</p><p className="text-xs text-slate-500">{course.code}</p></div><span className="text-sm font-black text-slate-900">{course.enrollment_count || 0}</span></div>)}{!popular.length && <p className="rounded-2xl bg-slate-50 p-6 text-sm text-slate-500">Analytics will appear as learners begin engaging.</p>}</div></section>
      <section className="surface p-6"><p className="eyebrow">Control center</p><h2 className="mt-2 text-2xl font-black text-slate-950">Manage platform</h2><div className="mt-5 grid gap-3">{links.map(([Icon,label,to]) => <Link key={label} to={to} className="flex items-center justify-between rounded-xl border border-slate-100 p-4 font-bold text-slate-700 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"><span className="flex items-center gap-3"><Icon size={18}/>{label}</span><ArrowRight size={16}/></Link>)}</div></section>
    </div>
  </>;
}

function TypewriterText({ text, speed = 40 }) {
  const [displayedText, setDisplayedText] = useState('');
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    let index = 0;
    setDisplayedText('');
    setIsFinished(false);
    const timer = setInterval(() => {
      if (index < text.length) {
        setDisplayedText(text.slice(0, index + 1));
        index++;
      } else {
        setIsFinished(true);
        clearInterval(timer);
      }
    }, speed);

    return () => clearInterval(timer);
  }, [text, speed]);

  return (
    <span>
      {displayedText}
      <span className={`inline-block w-1 h-8 sm:h-12 bg-indigo-400 ml-1.5 align-middle ${isFinished ? 'animate-pulse opacity-75' : 'opacity-100'}`} />
    </span>
  );
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const role = user?.role || 'student';
  const [enrollments, setEnrollments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const name = user?.name || user?.first_name || user?.email?.split('@')[0] || 'Learner';
  const departmentCode = useMemo(() => user?.department_code || (role === 'teacher' ? 'EEE' : 'CSE'), [user, role]);

  useEffect(() => {
    setLoading(true);
    const request = role === 'student' ? api.get('/courses/enrollments/mine/') : role === 'teacher' ? api.get('/courses/courses/mine/') : getAnalyticsDashboard();
    request.then(({ data }) => {
      if (role === 'student') setEnrollments(Array.isArray(data) ? data : data.results || []);
      else if (role === 'teacher') setCourses(Array.isArray(data) ? data : data.results || []);
      else setAnalytics(data);
    }).catch(() => { setEnrollments([]); setCourses([]); setAnalytics(null); }).finally(() => setLoading(false));
  }, [role, user?.id]);

  const [eyebrow, title] = roleCopy[role] || roleCopy.student;
  return <main className="min-h-[calc(100vh-3.5rem)] bg-[#f6f7fb] py-8 sm:py-12"><div className="page-shell space-y-6">
    <section className="relative overflow-hidden rounded-[2rem] bg-slate-950 text-white shadow-xl animate-fade-up"><img src={departmentCover(departmentCode)} alt="" className="absolute inset-0 h-full w-full object-cover opacity-35"/><div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 to-slate-950/30"/><div className="relative flex min-h-[280px] items-end justify-between gap-6 p-7 sm:p-11"><div><p className="eyebrow !text-indigo-300">{eyebrow}</p><h1 className="mt-3 max-w-3xl text-4xl font-black tracking-tight sm:text-6xl min-h-[3.5rem]"><TypewriterText text={`Welcome back, ${name}.`} speed={45} /></h1><p className="mt-4 text-lg text-slate-300">{title}</p></div><div className="hidden rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur sm:block"><Bell className="text-indigo-300"/><p className="mt-3 text-xs font-bold uppercase tracking-widest text-slate-300">Role</p><p className="mt-1 font-black capitalize">{role}</p></div></div></section>
    {role === 'student' && <StudentDashboard enrollments={enrollments} loading={loading}/>} {role === 'teacher' && <TeacherDashboard courses={courses} loading={loading}/>} {['admin','superuser'].includes(role) && <AdminDashboard analytics={analytics} role={role}/>} 
  </div></main>;
}
