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
          <span className="logo-scene">Scene</span><span className="logo-scribe">Scribe</span>
          {user?.is_admin && <span className="admin-badge">Admin</span>}
        </NavLink>

        <div className="navbar-links">
          <NavLink to="/" end className={({ isActive }) => `nav-pill${isActive ? ' nav-pill--active' : ''}`}>
            Today
          </NavLink>
          <NavLink to="/profile" className={({ isActive }) => `nav-pill${isActive ? ' nav-pill--active' : ''}`}>
            Profile
          </NavLink>
          {user?.is_admin && (
            <NavLink to="/admin" className={({ isActive }) => `nav-pill${isActive ? ' nav-pill--active' : ''}`}>
              Panel
            </NavLink>
          )}
        </div>

        <button className="btn-logout" onClick={handleLogout}>Sign out</button>
      </div>
    </nav>
  )
}
