import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useProject } from '../context/ProjectContext';
import ProjectDropdown from './ProjectDropdown';
import InvitePopout from './InvitePopout';

export default function Navbar() {
    const { auth, logout } = useAuth();
    const { selectedProject, resetProject, myProjectRole, projectMembers } = useProject();
    const navigate = useNavigate();
    const location = useLocation();
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handler(e: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setMenuOpen(false);
            }
        }
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    useEffect(() => { setMenuOpen(false); }, [location.pathname]);

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

    const memberAvatarStack = selectedProject && projectMembers.length > 0 && (
        <div className="flex items-center">
            {projectMembers.slice(0, 5).map((m, i) => (
                <div
                    key={m.id}
                    title={`${m.username} (${m.role})`}
                    style={{ zIndex: 5 - i, marginLeft: i === 0 ? 0 : '-6px', backgroundColor: m.color }}
                    className="w-6 h-6 rounded-full border border-[#1e1f27] flex items-center justify-center text-[10px] text-white font-medium shrink-0"
                >
                    {m.username[0].toUpperCase()}
                </div>
            ))}
            {projectMembers.length > 5 && (
                <div
                    title={`+${projectMembers.length - 5} more`}
                    style={{ zIndex: 0, marginLeft: '-6px' }}
                    className="w-6 h-6 rounded-full bg-gray-700 border border-[#1e1f27] flex items-center justify-center text-[10px] text-gray-300 shrink-0"
                >
                    +{projectMembers.length - 5}
                </div>
            )}
            <div style={{ marginLeft: '4px' }}>
                <InvitePopout />
            </div>
        </div>
    );

    return (
        <nav className="bg-[#1e1f27] border-b border-gray-700 px-4 sm:px-6 relative z-40" ref={menuRef}>
            <div className="h-[57px] flex items-center justify-between">

                {/* Left */}
                <div className="flex items-center gap-3 sm:gap-5">
                    <span className="text-white font-semibold text-sm tracking-wide">BugBase</span>
                    <div className="w-px h-4 bg-gray-700" />
                    <ProjectDropdown />
                    <div className="hidden sm:flex items-center gap-5">
                        {selectedProject ? navLink('/workspace', 'Workspace') : navLink('/workspace', 'Workspace', true)}
                        {navLink('/dashboard', 'Dashboard')}
                    </div>
                </div>

                {/* Right — desktop */}
                <div className="hidden sm:flex items-center gap-3">
                    {memberAvatarStack}
                    {myProjectRole === 'Owner' && selectedProject && (
                        <div className="w-px h-4 bg-gray-700" />
                    )}
                    <button
                        onClick={() => navigate('/settings?section=profile')}
                        className="flex items-center gap-2 hover:bg-white/5 rounded-lg px-2 py-1 transition-colors group"
                    >
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] text-white font-medium shrink-0" style={{ backgroundColor: auth?.color ?? '#6366f1' }}>
                            {auth?.username?.[0].toUpperCase()}
                        </div>
                        <span className="text-gray-400 group-hover:text-white text-sm transition-colors">{auth?.username}</span>
                    </button>
                    <Link to="/settings" className="text-gray-500 hover:text-white transition-colors" title="Settings">⚙</Link>
                    <button
                        onClick={handleLogout}
                        className="text-sm text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 rounded-lg px-3 py-1.5 transition-colors"
                    >
                        Log out
                    </button>
                </div>

                {/* Right — mobile: avatar + hamburger */}
                <div className="flex sm:hidden items-center gap-3">
                    <button
                        onClick={() => navigate('/settings?section=profile')}
                        className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] text-white font-medium shrink-0" style={{ backgroundColor: auth?.color ?? '#6366f1' }}
                    >
                        {auth?.username?.[0].toUpperCase()}
                    </button>
                    <button
                        onClick={() => setMenuOpen(v => !v)}
                        aria-label="Toggle menu"
                        className="text-gray-400 hover:text-white transition-colors p-1 text-lg leading-none"
                    >
                        {menuOpen ? '✕' : '☰'}
                    </button>
                </div>
            </div>

            {/* Mobile dropdown menu */}
            {menuOpen && (
                <div className="sm:hidden border-t border-gray-700 py-2 flex flex-col">
                    <div className="flex flex-col gap-0.5 px-2">
                        {selectedProject ? (
                            <Link
                                to="/workspace"
                                className={`px-3 py-2.5 rounded-lg text-sm transition-colors ${location.pathname === '/workspace' ? 'text-white bg-white/5' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                            >
                                Workspace
                            </Link>
                        ) : (
                            <span className="px-3 py-2.5 text-sm text-gray-600 cursor-not-allowed">Workspace</span>
                        )}
                        <Link
                            to="/dashboard"
                            className={`px-3 py-2.5 rounded-lg text-sm transition-colors ${location.pathname === '/dashboard' ? 'text-white bg-white/5' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                        >
                            Dashboard
                        </Link>
                    </div>

                    {memberAvatarStack && (
                        <>
                            <div className="mx-3 my-2 h-px bg-gray-700" />
                            <div className="px-5 py-1">
                                {memberAvatarStack}
                            </div>
                        </>
                    )}

                    <div className="mx-3 my-2 h-px bg-gray-700" />

                    <div className="flex flex-col gap-0.5 px-2">
                        <button
                            onClick={() => { navigate('/settings'); setMenuOpen(false); }}
                            className="px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors text-left"
                        >
                            Settings
                        </button>
                        <button
                            onClick={handleLogout}
                            className="px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors text-left"
                        >
                            Log out
                        </button>
                    </div>
                </div>
            )}
        </nav>
    );
}
