import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Mark() {
  return (
    <svg width="30" height="30" viewBox="0 0 30 30" fill="none" aria-hidden="true">
      <rect x="1" y="1" width="28" height="28" rx="4" stroke="currentColor" strokeWidth="1.5" />
      <path d="M6 22V13L15 7L24 13V22" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M12 22V16H18V22" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

const linkClass = ({ isActive }) =>
  `px-3 py-1.5 text-sm font-body font-medium rounded-sm transition-colors ${
    isActive ? "bg-brand text-paper" : "text-ink hover:bg-brand-light"
  }`;

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  return (
    <header className="border-b border-line bg-card/80 backdrop-blur-sm sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-brand-dark"><Mark /></span>
          <div className="leading-tight">
            <p className="font-display text-lg font-semibold text-ink">Greenview Society</p>
            <p className="text-[11px] font-mono uppercase tracking-widest text-inkfaint">
              Maintenance Register
            </p>
          </div>
        </div>

        <nav className="flex items-center gap-1.5">
          {user.role === "resident" && (
            <NavLink to="/complaints" className={linkClass}>My Complaints</NavLink>
          )}
          {user.role === "admin" && (
            <>
              <NavLink to="/admin" className={linkClass}>Register</NavLink>
              <NavLink to="/admin/dashboard" className={linkClass}>Dashboard</NavLink>
            </>
          )}
          <NavLink to="/notices" className={linkClass}>Notice Board</NavLink>

          <div className="ml-3 pl-3 border-l border-line flex items-center gap-3">
            <div className="text-right leading-tight hidden sm:block">
              <p className="text-sm font-body font-semibold text-ink">{user.name}</p>
              <p className="text-[11px] text-inkfaint uppercase tracking-wide">{user.role}{user.flatNumber ? ` · ${user.flatNumber}` : ""}</p>
            </div>
            <button
              onClick={() => { logout(); navigate("/login"); }}
              className="text-sm font-body font-medium text-brick hover:underline"
            >
              Sign out
            </button>
          </div>
        </nav>
      </div>
    </header>
  );
}
