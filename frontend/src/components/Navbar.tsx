import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useProject } from '../context/ProjectContext';
import ProjectDropdown from './ProjectDropdown';
import InvitePopout from './InvitePopout';

export default function Navbar() {
    const { auth, logout } = useAuth();
    const { selectedProject, resetProject, myProjectRole } = useProject();
    const navigate = useNavigate();
    const location = useLocation();

    function handleLogout() {
        resetProject();
        logout();
        navigate('/login');
    }

    const navLink = (to: string, label: string, disabled = false) => {
        const active = location.pathname === to;
        if (disabled) return <span className="text-gray-600 text-sm cursor-not-allowed">{label}</span>;
        return (
            <Link
                to={to}
                className={`text-sm transition-colors ${active ? 'text-white font-medium' : 'text-gray-400 hover:text-white'}`}
            >
                {label}
            </Link>
        );
    };

    return (
        <nav className="bg-[#1e1f27] border-b border-gray-700 px-6 h-[57px] flex items-center justify-between">
            {/* Left */}
            <div className="flex items-center gap-5">
                <span className="text-white font-semibold text-sm tracking-wide">BugBase</span>
                <div className="w-px h-4 bg-gray-700" />
                <ProjectDropdown />
                {selectedProject
                    ? navLink('/workspace', 'Workspace')
                    : navLink('/workspace', 'Workspace', true)}
                {navLink('/dashboard', 'Dashboard')}
            </div>

            {/* Right */}
            <div className="flex items-center gap-3">
                <InvitePopout />

                {myProjectRole === 'Owner' && selectedProject && (
                    <div className="w-px h-4 bg-gray-700" />
                )}

                <button
                    onClick={() => navigate('/settings?section=profile')}
                    className="flex items-center gap-2 hover:bg-white/5 rounded-lg px-2 py-1 transition-colors group"
                >
                    <div className="w-6 h-6 rounded-full bg-indigo-700 flex items-center justify-center text-[11px] text-white font-medium shrink-0">
                        {auth?.username?.[0].toUpperCase()}
                    </div>
                    <span className="text-gray-400 group-hover:text-white text-sm transition-colors">{auth?.username}</span>
                </button>
                <Link to="/settings" className="text-gray-500 hover:text-white transition-colors" title="Settings">
                    ⚙
                </Link>

                <button
                    onClick={handleLogout}
                    className="text-sm text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 rounded-lg px-3 py-1.5 transition-colors"
                >
                    Log out
                </button>
            </div>
        </nav>
    );
}
