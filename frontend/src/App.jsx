import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import useAuthStore from './store/authStore'

// Placeholder pages — replaced per phase
const Home = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <h1 className="text-4xl font-bold text-primary-700 mb-2">eLMS</h1>
      <p className="text-gray-500">E-Learning Management System</p>
    </div>
  </div>
)

const Login = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="card w-full max-w-md">
      <h2 className="text-2xl font-bold mb-4">Login</h2>
      <p className="text-gray-500">Login page — Phase 2</p>
    </div>
  </div>
)

const Register = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="card w-full max-w-md">
      <h2 className="text-2xl font-bold mb-4">Register</h2>
      <p className="text-gray-500">Register page — Phase 2</p>
    </div>
  </div>
)

const Dashboard = () => (
  <div className="p-8">
    <h2 className="text-2xl font-bold">Dashboard</h2>
    <p className="text-gray-500 mt-2">Dashboard — Phase 2</p>
  </div>
)

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}

export default App
