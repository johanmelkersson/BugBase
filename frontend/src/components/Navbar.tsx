import { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useProject } from '../context/ProjectContext';
import ProjectDropdown from './ProjectDropdown';
import InvitePopout from './InvitePopout';
import { getUnread, markRead, markAllRead } from '../api/notifications';
import { acceptInvitation, declineInvitation } from '../api/invitations';
import type { Notification } from '../types';

export default function Navbar() {
    const { auth, logout } = useAuth();
    const { selectedProject, resetProject, myProjectRole, projectMembers, projects, setSelectedProject } = useProject();
    const navigate = useNavigate();
    const location = useLocation();
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [notifOpen, setNotifOpen] = useState(false);
    const notifRef = useRef<HTMLDivElement>(null);
    const [respondingId, setRespondingId] = useState<number | null>(null);

    const fetchNotifications = useCallback(async () => {
        if (!auth) return;
        try {
            const data = await getUnread();
            setNotifications(data);
        } catch {
            // silently ignore
        }
    }, [auth]);

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30_000);
        return () => clearInterval(interval);
    }, [fetchNotifications]);

    useEffect(() => { fetchNotifications(); }, [location.pathname, fetchNotifications]);

    useEffect(() => {
        function handler(e: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setMenuOpen(false);
            }
            if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
                setNotifOpen(false);
            }
        }
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    useEffect(() => { setMenuOpen(false); }, [location.pathname]);

    async function handleMarkAllRead() {
        await markAllRead();
        setNotifications([]);
        setNotifOpen(false);
    }

    async function handleInviteRespond(n: Notification, accept: boolean) {
        if (!n.referenceId) return;
        setRespondingId(n.notificationId);
        try {
            if (accept) await acceptInvitation(n.referenceId);
            else await declineInvitation(n.referenceId);
            await markRead(n.notificationId);
            setNotifications(prev => prev.filter(x => x.notificationId !== n.notificationId));
            if (accept) navigate(0);
        } finally {
            setRespondingId(null);
        }
    }

    async function handleIssueNotifClick(n: Notification) {
        await markRead(n.notificationId);
        setNotifications(prev => prev.filter(x => x.notificationId !== n.notificationId));
        setNotifOpen(false);
        if (n.projectId) {
            const targetProject = projects.find(p => p.id === n.projectId);
            if (targetProject && targetProject.id !== selectedProject?.id) {
                setSelectedProject(targetProject);
            }
        }
        if (n.referenceId) navigate(`/workspace?issue=${n.referenceId}`);
    }

    function handleLogout() {
        resetProject();
        logout();
        navigate('/login');
    }

    const navLink = (to: string, label: string, disabled = false) => {
        const active = location.pathname === to;
        if (disabled) return <span className="text-gray-600 text-sm cursor-not-allowed">{label}</span>;
        return (
            <Link to={to} className={`text-sm transition-colors ${active ? 'text-white font-medium' : 'text-gray-400 hover:text-white'}`}>
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

                {/* Right */}
                <div className="flex items-center gap-3">
                    {/* Member avatars — desktop only */}
                    <div className="hidden sm:flex items-center gap-3">
                        {memberAvatarStack}
                        {myProjectRole === 'Owner' && selectedProject && (
                            <div className="w-px h-4 bg-gray-700" />
                        )}
                    </div>

                    {/* Bell — single instance, always visible */}
                    <div className="relative" ref={notifRef}>
                        <button
                            onClick={() => setNotifOpen(v => !v)}
                            className="relative text-gray-400 hover:text-white transition-colors p-1"
                            title="Notifications"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                            </svg>
                            {notifications.length > 0 && (
                                <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1 leading-none">
                                    {notifications.length > 9 ? '9+' : notifications.length}
                                </span>
                            )}
                        </button>

                        {notifOpen && (
                            <div className="absolute right-0 top-9 bg-[#1e1f27] border border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden" style={{ width: '340px' }}>
                                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
                                    <span className="text-sm font-semibold text-white">Notifications</span>
                                    {notifications.length > 0 && (
                                        <button
                                            onClick={handleMarkAllRead}
                                            className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                                        >
                                            Mark all read
                                        </button>
                                    )}
                                </div>
                                {notifications.length === 0 ? (
                                    <div className="px-4 py-6 text-center text-sm text-gray-500">No new notifications</div>
                                ) : (
                                    <div className="max-h-96 overflow-y-auto divide-y divide-gray-800">
                                        {notifications.map(n => (
                                            <div key={n.notificationId} className="px-4 py-3">
                                                {n.type === 'Invitation' ? (
                                                    <div className="flex gap-3 items-start">
                                                        <span className="mt-0.5 text-base shrink-0">✉️</span>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm text-gray-300 leading-snug mb-2">{n.message}</p>
                                                            <div className="flex gap-2">
                                                                <button
                                                                    onClick={() => handleInviteRespond(n, true)}
                                                                    disabled={respondingId === n.notificationId}
                                                                    className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors disabled:opacity-50"
                                                                >
                                                                    Accept
                                                                </button>
                                                                <button
                                                                    onClick={() => handleInviteRespond(n, false)}
                                                                    disabled={respondingId === n.notificationId}
                                                                    className="px-3 py-1 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs font-medium transition-colors disabled:opacity-50"
                                                                >
                                                                    Decline
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => handleIssueNotifClick(n)}
                                                        className="w-full text-left flex gap-3 items-start hover:bg-white/5 rounded transition-colors"
                                                    >
                                                        <span className="mt-0.5 text-base shrink-0">
                                                            {n.type === 'IssueAssigned' ? '📋' : '💬'}
                                                        </span>
                                                        <span className="text-sm text-gray-300 leading-snug">{n.message}</span>
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Username + settings + logout — desktop only */}
                    <div className="hidden sm:flex items-center gap-3">
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

                    {/* Avatar + hamburger — mobile only */}
                    <div className="flex sm:hidden items-center gap-3">
                        <button
                            onClick={() => navigate('/settings?section=profile')}
                            className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] text-white font-medium shrink-0"
                            style={{ backgroundColor: auth?.color ?? '#6366f1' }}
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
