import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState } from 'react'
import AuthPage from './pages/AuthPage.jsx'
import Home from './pages/Home.jsx'
import Feedback from './pages/Feedback.jsx'
import Profile from './pages/Profile.jsx'
import Admin from './pages/Admin.jsx'
import Navbar from './components/Navbar.jsx'

function PrivateRoute({ user, children }) {
  if (!user) return <Navigate to="/login" replace />
  return children
}

function AdminRoute({ user, children }) {
  if (!user) return <Navigate to="/login" replace />
  if (!user.is_admin) return <Navigate to="/" replace />
  return children
}

export default function App() {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('user')
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })

  function login(userData, token) {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)
  }

  function logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }

  return (
    <BrowserRouter>
      {user && <Navbar user={user} onLogout={logout} />}
      <div className={user ? 'main-content' : ''}>
        <Routes>
          <Route path="/login" element={user ? <Navigate to="/" /> : <AuthPage onLogin={login} initialTab="signin" />} />
          <Route path="/register" element={user ? <Navigate to="/" /> : <AuthPage onLogin={login} initialTab="register" />} />
          <Route path="/" element={
            <PrivateRoute user={user}>
              <Home user={user} />
            </PrivateRoute>
          } />
          <Route path="/feedback/:id" element={
            <PrivateRoute user={user}>
              <Feedback />
            </PrivateRoute>
          } />
          <Route path="/profile" element={
            <PrivateRoute user={user}>
              <Profile user={user} />
            </PrivateRoute>
          } />
          <Route path="/admin" element={
            <AdminRoute user={user}>
              <Admin />
            </AdminRoute>
          } />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}
