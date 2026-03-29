import { NavLink, useNavigate } from 'react-router-dom'

export default function Navbar({ user, onLogout }) {
  const navigate = useNavigate()

  function handleLogout() {
    onLogout()
    navigate('/login')
  }

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <NavLink to="/" className="navbar-logo">
          🎬 Scene<span>Scribe</span>
        </NavLink>

        <div className="navbar-links">
          <NavLink to="/" end className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
            <span>🏠</span><span>Home</span>
          </NavLink>
          <NavLink to="/profile" className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
            <span>👤</span><span>Profile</span>
          </NavLink>
          {user.is_admin && (
            <NavLink to="/admin" className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
              <span>⚙️</span><span>Admin</span>
            </NavLink>
          )}
        </div>

        <div className="navbar-right">
          <div className="nav-stat streak">
            <span className="icon">🔥</span>
            <span>{user.streak ?? 0}</span>
          </div>
          <div className="nav-stat points">
            <span className="icon">⭐</span>
            <span>{user.total_points ?? 0}</span>
          </div>
          <button className="btn-logout" onClick={handleLogout}>
            Sign out
          </button>
        </div>
      </div>
    </nav>
  )
}
