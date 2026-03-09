import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import api from '../services/api'

export default function ProfilePage() {
  const navigate = useNavigate()
  const { user, updateUser } = useAuthStore()
  const [form, setForm] = useState({ name: '', bio: '' })
  const [pwForm, setPwForm] = useState({ old_password: '', new_password: '' })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user) setForm({ name: user.name || '', bio: user.bio || '' })
  }, [user])

  const handleProfileUpdate = async e => {
    e.preventDefault()
    setMessage(''); setError('')
    setLoading(true)
    try {
      const { data } = await api.patch('/auth/profile/', form)
      updateUser(data)
      setMessage('Profile updated successfully.')
    } catch (err) {
      setError(err.response?.data?.detail || 'Update failed.')
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordChange = async e => {
    e.preventDefault()
    setMessage(''); setError('')
    setLoading(true)
    try {
      await api.put('/auth/change-password/', pwForm)
      setMessage('Password changed successfully.')
      setPwForm({ old_password: '', new_password: '' })
    } catch (err) {
      setError(err.response?.data?.old_password || err.response?.data?.detail || 'Failed to change password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-4">
        <button onClick={() => navigate('/dashboard')} className="text-indigo-600 hover:underline text-sm">
          ← Dashboard
        </button>
        <span className="font-bold text-lg text-gray-900">My Profile</span>
      </nav>

      <main className="max-w-2xl mx-auto px-6 py-10 space-y-8">
        {message && (
          <div className="rounded-lg bg-green-50 border border-green-200 text-green-700 px-4 py-3 text-sm">
            {message}
          </div>
        )}
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {/* Profile info */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile Information</h2>
          <div className="mb-4">
            <span className="text-sm text-gray-500">Email: </span>
            <span className="font-medium text-gray-900">{user?.email}</span>
          </div>
          <div className="mb-4">
            <span className="text-sm text-gray-500">Role: </span>
            <span className="capitalize font-medium text-indigo-600">{user?.role}</span>
          </div>
          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
              <textarea
                rows={3}
                value={form.bio}
                onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                className="input"
                placeholder="Tell us about yourself…"
              />
            </div>
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? 'Saving…' : 'Save Changes'}
            </button>
          </form>
        </div>

        {/* Change password */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Change Password</h2>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
              <input
                type="password"
                value={pwForm.old_password}
                onChange={e => setPwForm(f => ({ ...f, old_password: e.target.value }))}
                className="input"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <input
                type="password"
                value={pwForm.new_password}
                onChange={e => setPwForm(f => ({ ...f, new_password: e.target.value }))}
                className="input"
                required
              />
            </div>
            <button type="submit" disabled={loading} className="btn btn-secondary">
              {loading ? 'Updating…' : 'Update Password'}
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}
