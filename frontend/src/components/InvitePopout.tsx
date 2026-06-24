import { useState, useRef, useEffect } from 'react';
import { useProject } from '../context/ProjectContext';
import { useAuth } from '../context/AuthContext';
import { sendInvitation, getPendingUserIds } from '../api/invitations';
import { searchUsers } from '../api/users';
import { getMembers } from '../api/projects';
import type { UserSearchResult } from '../types';

export default function InvitePopout() {
    const { selectedProject, myProjectRole } = useProject();
    const { auth } = useAuth();
    const [open, setOpen] = useState(false);
    const [userSearch, setUserSearch] = useState('');
    const [userResults, setUserResults] = useState<UserSearchResult[]>([]);
    const [memberIds, setMemberIds] = useState<Set<number>>(new Set());
    const [pendingIds, setPendingIds] = useState<Set<number>>(new Set());
    const [inviteRole, setInviteRole] = useState('Developer');
    const [message, setMessage] = useState('');
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (!selectedProject) return;
        Promise.all([
            getMembers(selectedProject.id),
            getPendingUserIds(selectedProject.id)
        ]).then(([members, pending]) => {
            setMemberIds(new Set(members.map(m => m.id)));
            setPendingIds(new Set(pending));
        });
    }, [selectedProject, open]);

    async function handleUserSearch(e: React.ChangeEvent<HTMLInputElement>) {
        setUserSearch(e.target.value);
        if (e.target.value.length < 2) { setUserResults([]); return; }
        const results = await searchUsers(e.target.value);
        setUserResults(results.filter(u => u.id !== auth?.userId && !memberIds.has(u.id)));
    }

    async function handleInvite(userId: number) {
        if (!selectedProject) return;
        try {
            await sendInvitation(selectedProject.id, userId, inviteRole);
            setPendingIds(prev => new Set(prev).add(userId));
            setMessage('Invitation sent!');
            setUserSearch('');
            setUserResults([]);
        } catch {
            setMessage('Could not send invitation.');
        }
    }

    if (!selectedProject) return null;
    if (myProjectRole !== 'Owner') return null;

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => { setOpen(prev => !prev); setMessage(''); }}
                className="flex items-center gap-1.5 border border-dashed border-gray-600 hover:border-indigo-500 text-gray-400 hover:text-gray-200 rounded-full px-3 py-1 text-xs transition-colors"
            >
                + Invite
            </button>

            {open && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-[#1e1f27] border border-gray-700 rounded-xl shadow-xl z-50 p-4 flex flex-col gap-3">
                    <p className="text-white text-sm font-medium">Invite to {selectedProject.name}</p>
                    <input
                        value={userSearch}
                        onChange={handleUserSearch}
                        placeholder="Search username..."
                        className="bg-[#13141a] border border-gray-700 text-gray-100 placeholder-gray-500 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
                    />
                    <select
                        value={inviteRole}
                        onChange={e => setInviteRole(e.target.value)}
                        className="bg-[#13141a] border border-gray-700 text-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
                    >
                        <option value="Owner">Owner</option>
                        <option value="Developer">Developer</option>
                        <option value="Reporter">Reporter</option>
                    </select>
                    {userResults.map(u => {
                        const isPending = pendingIds.has(u.id);
                        return (
                            <div key={u.id} className={`flex items-center justify-between gap-2 ${isPending ? 'opacity-50' : ''}`}>
                                <div className="flex items-center gap-2 min-w-0">
                                    <div className="w-6 h-6 rounded-full bg-indigo-700 flex items-center justify-center text-[10px] text-white font-medium shrink-0">
                                        {u.username[0].toUpperCase()}
                                    </div>
                                    <span className="text-gray-300 text-xs truncate">{u.username}</span>
                                </div>
                                {isPending ? (
                                    <span className="text-xs text-gray-500 shrink-0">Pending</span>
                                ) : (
                                    <button onClick={() => handleInvite(u.id)}
                                        className="text-indigo-400 hover:text-indigo-300 text-xs transition-colors shrink-0">
                                        Invite
                                    </button>
                                )}
                            </div>
                        );
                    })}
                    {message && <p className="text-xs text-green-400">{message}</p>}
                </div>
            )}
        </div>
    );
}
