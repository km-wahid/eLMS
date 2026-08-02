import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import api from '../services/api'
import courseService from '../services/courseService'
import { BookOpen, LockKeyhole, X } from 'lucide-react'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const setAuth = useAuthStore(s => s.setAuth)
  const intent = location.state?.intent
  const pendingCourse = location.state?.courseSlug
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await api.post('/auth/login/', form)
      setAuth(data.user, data.access, data.refresh)
      if (intent === 'enroll' && pendingCourse) {
        if (data.user?.role !== 'student') {
          toast.error('Only student accounts can enroll in courses.')
          navigate(location.state?.returnTo || `/academic-courses/${pendingCourse}`, { replace: true })
          return
        }
        try {
          await courseService.enrollInCourse(pendingCourse)
          toast.success('Enrollment complete — welcome to the course!')
          navigate(`/learn/${pendingCourse}`, { replace: true })
        } catch (enrollError) {
          const message = enrollError.response?.data?.detail || enrollError.response?.data?.error || ''
          if (enrollError.response?.status === 400 && /already|enrolled/i.test(String(message))) {
            toast.success('You are already enrolled. Opening your course…')
            navigate(`/learn/${pendingCourse}`, { replace: true })
          } else {
            toast.error(message || 'Signed in, but enrollment could not be completed.')
            navigate(location.state?.returnTo || `/academic-courses/${pendingCourse}`, { replace: true })
          }
        }
      } else {
        navigate(location.state?.from || '/dashboard', { replace: true })
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-[calc(100vh-3.5rem)] flex items-center justify-center overflow-hidden bg-slate-950 px-4 py-10">
      <img src="/images/departments/cse.jpg" alt="" className="absolute inset-0 h-full w-full object-cover opacity-25" />
      <div className="absolute inset-0 bg-slate-950/65 backdrop-blur-sm" />
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-8">
        {location.state?.returnTo && <button type="button" onClick={() => navigate(location.state.returnTo)} className="absolute right-5 top-5 grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200" aria-label="Close login"><X size={17}/></button>}
        {intent === 'enroll' && <div className="mb-6 flex gap-3 rounded-2xl bg-indigo-50 p-4 text-indigo-800"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white"><BookOpen size={19}/></span><div><p className="text-sm font-bold">Sign in to enroll</p><p className="mt-1 text-xs leading-5 text-indigo-600">After login, we’ll enroll you in {location.state?.courseTitle || 'this course'} and open its content.</p></div></div>}
        <span className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-slate-950 text-white"><LockKeyhole size={20}/></span>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome back</h1>
        <p className="text-gray-500 mb-6 text-sm">Sign in to your eLMS account</p>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              className="input"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              className="input"
              placeholder="••••••••"
            />
          </div>
          <button type="submit" disabled={loading} className="btn btn-primary w-full">
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Don't have an account?{' '}
          <Link to="/register" state={location.state} className="text-indigo-600 hover:underline font-medium">
            Register
          </Link>
        </p>
      </div>
    </div>
  )
}
