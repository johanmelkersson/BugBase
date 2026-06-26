import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUsers, updateUserRole, deleteUser, searchUsers } from '../api/users';
import { getProjects, getAllProjectsAdmin, deleteProject, leaveProject, getMembers, updateProject, removeMember, updateMemberRole } from '../api/projects';
import { getPending, acceptInvitation, declineInvitation, sendInvitation, getPendingUserIds } from '../api/invitations';
import { useAuth } from '../context/AuthContext';
import { useProject } from '../context/ProjectContext';
import type { Project, Invitation, User, ProjectMember, UserSearchResult } from '../types';

export default function DashboardPage() {
    const { auth } = useAuth();
    const { setProjects, setSelectedProject, selectedProject, setMyProjectRole, setProjectMembers } = useProject();
    const navigate = useNavigate();
    const [projects, setLocalProjects] = useState<Project[]>([]);
    const [invitations, setInvitations] = useState<Invitation[]>([]);
    const [loading, setLoading] = useState(true);
    const [dashboardView, setDashboardView] = useState<'user' | 'admin'>('user');
    const [adminUsers, setAdminUsers] = useState<User[]>([]);
    const [adminProjects, setAdminProjects] = useState<Project[]>([]);
    const [memberMap, setMemberMap] = useState<Record<number, ProjectMember[]>>({});
    const [editingProjectId, setEditingProjectId] = useState<number | null>(null);
    const [editingProjectForm, setEditingProjectForm] = useState({ name: '', description: '' });
    const [inviteSearch, setInviteSearch] = useState('');
    const [inviteResults, setInviteResults] = useState<UserSearchResult[]>([]);
    const [inviteRole, setInviteRole] = useState('Developer');
    const [selectedInvitee, setSelectedInvitee] = useState<UserSearchResult | null>(null);
    const [pendingIds, setPendingIds] = useState<Set<number>>(new Set());
    const [inviteMessage, setInviteMessage] = useState('');
    const inviteRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        Promise.all([getProjects(), getPending()]).then(([p, i]) => {
            setLocalProjects(p);
            setInvitations(i);
            setLoading(false);
            p.forEach(proj => {
                getMembers(proj.id).then(members => {
                    setMemberMap(prev => ({ ...prev, [proj.id]: members }));
                });
            });
        });
    }, []);

    useEffect(() => {
        if (selectedProject) {
            if (!(selectedProject.id in memberMap)) {
                getMembers(selectedProject.id).then(members => {
                    setMemberMap(prev => ({ ...prev, [selectedProject.id]: members }));
                    const role = members.find(m => m.id === auth?.userId)?.role ?? null;
                    setMyProjectRole(role);
                });
            } else {
                const role = (memberMap[selectedProject.id] ?? []).find(m => m.id === auth?.userId)?.role ?? null;
                setMyProjectRole(role);
            }
        } else {
            setMyProjectRole(null);
        }
    }, [selectedProject]);

    useEffect(() => {
        if (dashboardView === 'admin' && auth?.role === 'Admin') {
            Promise.all([getUsers(), getAllProjectsAdmin()]).then(async ([u, p]) => {
                setAdminUsers(u);
                setAdminProjects(p);
                const entries = await Promise.all(p.map(async proj => [proj.id, await getMembers(proj.id)] as const));
                setMemberMap(prev => ({ ...prev, ...Object.fromEntries(entries) }));
            });
        }
    }, [dashboardView]);

    const handleAccept = async (id: number) => {
        await acceptInvitation(id);
        setInvitations(prev => prev.filter(i => i.id !== id));
        const updated = await getProjects();
        setLocalProjects(updated);
        setProjects(updated);
    };

    const handleDecline = async (id: number) => {
        await declineInvitation(id);
        setInvitations(prev => prev.filter(i => i.id !== id));
    };

    const handleDelete = async (project: Project) => {
        await deleteProject(project.id);
        const updated = projects.filter(p => p.id !== project.id);
        setLocalProjects(updated);
        setProjects(updated);
        setSelectedProject(null);
    };

    const handleLeave = async (project: Project) => {
        await leaveProject(project.id);
        const updated = projects.filter(p => p.id !== project.id);
        setLocalProjects(updated);
        setProjects(updated);
        setSelectedProject(null);
    };

    const handleOpen = (project: Project) => {
        setSelectedProject(project);
        navigate('/workspace');
    };

    const handleEditProject = (p: Project) => {
        setEditingProjectId(p.id);
        setEditingProjectForm({ name: p.name, description: p.description });
    };

    const handleSaveProject = async (id: number) => {
        const updated = await updateProject(id, editingProjectForm.name, editingProjectForm.description);
        const patch = (list: Project[]) => list.map(p => p.id === id ? updated : p);
        setLocalProjects(patch);
        setProjects(patch(projects));
        setEditingProjectId(null);
    };

    const handleAdminRoleChange = async (id: number, newRole: string) => {
        const updated = await updateUserRole(id, newRole);
        setAdminUsers(prev => prev.map(u => u.id === id ? updated : u));
    };

    const handleAdminDeleteUser = async (id: number) => {
        await deleteUser(id);
        setAdminUsers(prev => prev.filter(u => u.id !== id));
        setMemberMap(prev => {
            const updated: typeof prev = {};
            for (const [pid, members] of Object.entries(prev))
                updated[Number(pid)] = members.filter(m => m.id !== id);
            return updated;
        });
        setProjectMembers(prev => prev.filter(m => m.id !== id));
        const p = await getAllProjectsAdmin();
        setAdminProjects(p);
    };

    const roleOrder: Record<string, number> = { Owner: 0, Developer: 1, Reporter: 2 };
    const selectedMembers = selectedProject ? (memberMap[selectedProject.id] ?? []) : [];
    const sortedSelectedMembers = [...selectedMembers].sort((a, b) => (roleOrder[a.role] ?? 9) - (roleOrder[b.role] ?? 9));
    const myDashboardRole = selectedMembers.find(m => m.id === auth?.userId)?.role ?? null;
    const isProjectOwner = myDashboardRole === 'Owner';
    const canSeeProjectSection = selectedProject && myDashboardRole !== null;

    const handleRemoveMember = async (userId: number) => {
        if (!selectedProject) return;
        await removeMember(selectedProject.id, userId);
        setMemberMap(prev => ({
            ...prev,
            [selectedProject.id]: (prev[selectedProject.id] ?? []).filter(m => m.id !== userId)
        }));
        setProjectMembers(prev => prev.filter(m => m.id !== userId));
    };

    const handleUpdateMemberRole = async (userId: number, role: string) => {
        if (!selectedProject) return;
        await updateMemberRole(selectedProject.id, userId, role);
        setMemberMap(prev => ({
            ...prev,
            [selectedProject.id]: (prev[selectedProject.id] ?? []).map(m => m.id === userId ? { ...m, role } : m)
        }));
    };

    const handleInviteSearch = async (query: string) => {
        setInviteSearch(query);
        setSelectedInvitee(null);
        setInviteMessage('');
        if (query.trim().length < 1) { setInviteResults([]); return; }
        const results = await searchUsers(query);
        const existing = new Set((memberMap[selectedProject?.id ?? -1] ?? []).map(m => m.id));
        setInviteResults(results.filter(r => r.id !== auth?.userId && !existing.has(r.id)));
    };

    const handleSelectInvitee = (user: UserSearchResult) => {
        setSelectedInvitee(user);
        setInviteSearch(user.username);
        setInviteResults([]);
        setInviteMessage('');
    };

    const handleSendInvite = async () => {
        if (!selectedProject || !selectedInvitee) return;
        try {
            await sendInvitation(selectedProject.id, selectedInvitee.id, inviteRole);
            setPendingIds(prev => new Set(prev).add(selectedInvitee.id));
            setInviteMessage(`Invitation sent to ${selectedInvitee.username}`);
            setSelectedInvitee(null);
            setInviteSearch('');
        } catch {
            setInviteMessage('Could not send invitation.');
        }
    };

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (inviteRef.current && !inviteRef.current.contains(e.target as Node)) {
                setInviteResults([]);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    useEffect(() => {
        if (selectedProject) {
            getPendingUserIds(selectedProject.id).then(ids => setPendingIds(new Set(ids)));
            setSelectedInvitee(null);
            setInviteSearch('');
            setInviteMessage('');
        }
    }, [selectedProject]);

    const ownedProjects = projects.filter(p => p.createdBy === auth?.userId);
    const memberProjects = projects.filter(p => p.createdBy !== auth?.userId);

    function MemberAvatars({ projectId }: { projectId: number }) {
        const members = memberMap[projectId] ?? [];
        const visible = members.slice(0, 5);
        const rest = members.length - visible.length;
        return (
            <div className="flex items-center">
                {visible.map((m, i) => (
                    <div
                        key={m.id}
                        title={`${m.username} (${m.role})`}
                        style={{ zIndex: visible.length - i }}
                        className="-ml-2 first:ml-0 w-6 h-6 rounded-full bg-indigo-700 border border-[#1e1f27] flex items-center justify-center text-[10px] text-white font-medium"
                    >
                        {m.username[0].toUpperCase()}
                    </div>
                ))}
                {rest > 0 && (
                    <div className="-ml-2 w-6 h-6 rounded-full bg-gray-700 border border-[#1e1f27] flex items-center justify-center text-[10px] text-gray-300">
                        +{rest}
                    </div>
                )}
            </div>
        );
    }

    if (loading) return (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 flex items-center justify-center">
            <span className="text-gray-500 text-sm">Loading...</span>
        </div>
    );

    return (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-10">

            {auth?.role === 'Admin' && (
                <div className="flex gap-1 border-b border-gray-700 -mx-6 px-6 mb-2">
                    <button
                        onClick={() => setDashboardView('user')}
                        className={`px-4 py-2 text-sm transition-colors ${dashboardView === 'user' ? 'text-white border-b-2 border-indigo-500' : 'text-gray-400 hover:text-white'}`}
                    >
                        My Overview
                    </button>
                    <button
                        onClick={() => setDashboardView('admin')}
                        className={`px-4 py-2 text-sm transition-colors ${dashboardView === 'admin' ? 'text-white border-b-2 border-indigo-500' : 'text-gray-400 hover:text-white'}`}
                    >
                        Administration
                    </button>
                </div>
            )}

            {dashboardView === 'user' && (<>
                {/* Pending invitations */}
                {invitations.length > 0 && (
                    <section>
                        <h2 className="text-lg font-semibold text-white mb-3">Pending Invitations</h2>
                        <div className="flex flex-col gap-3">
                            {invitations.map(inv => (
                                <div key={inv.id} className="bg-[#1e1f27] border border-gray-700 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                    <div>
                                        <p className="text-white font-medium">{inv.projectName}</p>
                                        <p className="text-gray-400 text-sm">Invited by {inv.invitedByUsername} · Role: {inv.role}</p>
                                    </div>
                                    <div className="flex gap-2 shrink-0">
                                        <button onClick={() => handleAccept(inv.id)} className="flex-1 sm:flex-none px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg transition-colors">
                                            Accept
                                        </button>
                                        <button onClick={() => handleDecline(inv.id)} className="flex-1 sm:flex-none px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg transition-colors">
                                            Decline
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Member management */}
                {canSeeProjectSection && (
                    <section>
                        <h2 className="text-xl font-bold text-white mb-1">{selectedProject!.name}</h2>
                        <h3 className="text-sm font-semibold text-gray-400 mb-3">Members</h3>
                        <div className="flex flex-col gap-2">
                            {sortedSelectedMembers.map(m => {
                                const isSelf = m.id === auth?.userId;
                                const isOwner = m.role === 'Owner';
                                const ownerCount = selectedMembers.filter(x => x.role === 'Owner').length;
                                const canEdit = isProjectOwner && (!isOwner || (isSelf && ownerCount > 1));
                                return (
                                    <div key={m.id} className="bg-[#1e1f27] border border-gray-700 rounded-xl px-5 py-3 flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-7 h-7 rounded-full bg-indigo-700 flex items-center justify-center text-xs text-white font-medium shrink-0">
                                                {m.username[0].toUpperCase()}
                                            </div>
                                            <span className="text-white text-sm">{m.username}{isSelf && <span className="text-gray-500 text-xs ml-1">(you)</span>}</span>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            {canEdit ? (
                                                <select
                                                    value={m.role}
                                                    onChange={e => handleUpdateMemberRole(m.id, e.target.value)}
                                                    className="bg-[#13141a] border border-gray-700 text-gray-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                                                >
                                                    <option value="Owner">Owner</option>
                                                    <option value="Developer">Developer</option>
                                                    <option value="Reporter">Reporter</option>
                                                </select>
                                            ) : (
                                                <span className="text-xs text-gray-400 px-3 py-1.5 border border-gray-700 rounded-lg">{m.role}</span>
                                            )}
                                            {canEdit && !isSelf && (
                                                <button
                                                    onClick={() => handleRemoveMember(m.id)}
                                                    className="text-red-400 hover:text-red-300 border border-red-500/30 hover:border-red-400/50 rounded-lg px-3 py-1.5 text-xs transition-colors"
                                                >
                                                    Remove
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Invite row — Owner only */}
                            {isProjectOwner && (
                                <div ref={inviteRef} className="relative mt-1 flex flex-col gap-2">
                                    <div className="bg-[#1e1f27] border border-dashed border-gray-600 rounded-xl px-5 py-3 flex flex-col sm:flex-row sm:items-center gap-2">
                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                            {selectedInvitee && (
                                                <div className="w-6 h-6 rounded-full bg-indigo-700 flex items-center justify-center text-[10px] text-white font-medium shrink-0">
                                                    {selectedInvitee.username[0].toUpperCase()}
                                                </div>
                                            )}
                                            <input
                                                value={inviteSearch}
                                                onChange={e => handleInviteSearch(e.target.value)}
                                                placeholder="Invite by username…"
                                                className="flex-1 bg-transparent text-gray-300 placeholder-gray-600 text-sm focus:outline-none min-w-0"
                                            />
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <select
                                                value={inviteRole}
                                                onChange={e => setInviteRole(e.target.value)}
                                                className="flex-1 sm:flex-none bg-[#13141a] border border-gray-700 text-gray-300 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-indigo-500"
                                            >
                                                <option value="Owner">Owner</option>
                                                <option value="Developer">Developer</option>
                                                <option value="Reporter">Reporter</option>
                                            </select>
                                            <button
                                                onClick={handleSendInvite}
                                                disabled={!selectedInvitee}
                                                className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs rounded-lg transition-colors shrink-0"
                                            >
                                                Invite
                                            </button>
                                        </div>
                                    </div>
                                    {inviteResults.length > 0 && (
                                        <div className="absolute top-full left-0 right-0 mt-1 bg-[#1e1f27] border border-gray-700 rounded-xl shadow-xl z-10 overflow-hidden">
                                            {inviteResults.map(u => {
                                                const isPending = pendingIds.has(u.id);
                                                return (
                                                    <button
                                                        key={u.id}
                                                        onClick={() => !isPending && handleSelectInvitee(u)}
                                                        disabled={isPending}
                                                        className={`w-full px-4 py-2.5 flex items-center justify-between gap-3 transition-colors ${isPending ? 'opacity-50 cursor-default' : 'hover:bg-[#13141a]'}`}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-6 h-6 rounded-full bg-indigo-700 flex items-center justify-center text-[10px] text-white font-medium shrink-0">
                                                                {u.username[0].toUpperCase()}
                                                            </div>
                                                            <span className="text-gray-200 text-sm">{u.username}</span>
                                                        </div>
                                                        {isPending && <span className="text-xs text-gray-500">Pending</span>}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                    {inviteMessage && (
                                        <p className={`text-xs px-1 ${inviteMessage.startsWith('Could') ? 'text-red-400' : 'text-green-400'}`}>
                                            {inviteMessage}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </section>
                )}

                {/* Owned projects */}
                <section>
                    <h1 className="text-xl font-bold text-white mb-1">Projects</h1>
                    <h2 className="text-sm font-semibold text-gray-400 mb-3">Creator</h2>
                    {ownedProjects.length === 0 ? (
                        <p className="text-gray-500 text-sm">You have no projects.</p>
                    ) : (
                        <div className="flex flex-col gap-2">
                            {ownedProjects.map(p => (
                                <div key={p.id} className="bg-[#1e1f27] border border-gray-700 rounded-xl px-5 py-4">
                                    {editingProjectId === p.id ? (
                                        <div className="flex flex-col gap-2">
                                            <input
                                                value={editingProjectForm.name}
                                                onChange={e => setEditingProjectForm(prev => ({ ...prev, name: e.target.value }))}
                                                placeholder="Project name"
                                                className="bg-[#13141a] border border-gray-700 text-gray-100 placeholder-gray-500 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-indigo-500"
                                            />
                                            <textarea
                                                value={editingProjectForm.description}
                                                onChange={e => setEditingProjectForm(prev => ({ ...prev, description: e.target.value }))}
                                                placeholder="Description"
                                                rows={2}
                                                className="bg-[#13141a] border border-gray-700 text-gray-100 placeholder-gray-500 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-indigo-500 resize-none"
                                            />
                                            <div className="flex gap-2">
                                                <button onClick={() => handleSaveProject(p.id)} className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs rounded-lg py-1.5 transition-colors">Save</button>
                                                <button onClick={() => setEditingProjectId(null)} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded-lg py-1.5 transition-colors">Cancel</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col gap-3">
                                            <div className="flex items-center justify-between">
                                                <p className="text-white font-semibold text-sm">{p.name}</p>
                                                <div className="flex gap-3 shrink-0">
                                                    <button onClick={() => handleOpen(p)} className="text-indigo-400 hover:text-indigo-300 text-xs transition-colors">Open</button>
                                                    <button onClick={() => handleEditProject(p)} className="text-gray-500 hover:text-white text-xs transition-colors">Edit</button>
                                                    <button onClick={() => handleDelete(p)} className="text-red-400 hover:text-red-300 text-xs transition-colors">Delete</button>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <p className="text-gray-500 text-xs">{p.description}</p>
                                                <MemberAvatars projectId={p.id} />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* Member projects */}
                <section>
                    <h2 className="text-sm font-semibold text-gray-400 mb-3">Collaborator</h2>
                    {memberProjects.length === 0 ? (
                        <p className="text-gray-500 text-sm">You're not a member of any other projects.</p>
                    ) : (
                        <div className="flex flex-col gap-2">
                            {memberProjects.map(p => (
                                <div key={p.id} className="bg-[#1e1f27] border border-gray-700 rounded-xl px-5 py-4">
                                    <div className="flex flex-col gap-3">
                                        <div className="flex items-center justify-between">
                                            <p className="text-white font-semibold text-sm">{p.name}</p>
                                            <div className="flex gap-3 shrink-0">
                                                <button onClick={() => handleOpen(p)} className="text-indigo-400 hover:text-indigo-300 text-xs transition-colors">Open</button>
                                                <button onClick={() => handleLeave(p)} className="text-gray-500 hover:text-white text-xs transition-colors">Leave</button>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <p className="text-gray-500 text-xs">{p.description}</p>
                                            <MemberAvatars projectId={p.id} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </>)}

            {dashboardView === 'admin' && auth?.role === 'Admin' && (<>
                <div className="flex flex-col gap-8">
                    {/* Admin Users */}
                    <section>
                        <h2 className="text-lg font-semibold text-white mb-3">All Users</h2>
                        <div className="flex flex-col gap-2">
                            {adminUsers.filter(u => u.id !== auth?.userId).map(user => (
                                <div key={user.id} className="bg-[#1e1f27] border border-gray-700 rounded-xl px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                    <div>
                                        <p className="text-white text-sm font-medium">{user.username}</p>
                                        <p className="text-gray-500 text-xs mt-0.5">{user.email}</p>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <select value={user.role} onChange={e => handleAdminRoleChange(user.id, e.target.value)}
                                            className="bg-[#13141a] border border-gray-700 text-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500">
                                            <option value="Admin">Admin</option>
                                            <option value="User">User</option>
                                        </select>
                                        <button onClick={() => handleAdminDeleteUser(user.id)}
                                            className="text-red-400 hover:text-red-300 border border-red-500/30 hover:border-red-400/50 rounded-lg px-3 py-2 text-xs transition-colors">
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Admin Projects */}
                    <section>
                        <h2 className="text-lg font-semibold text-white mb-3">All projects</h2>
                        <div className="flex flex-col gap-2">
                            {adminProjects.map(project => (
                                <div key={project.id} className="bg-[#1e1f27] border border-gray-700 rounded-xl px-5 py-4 flex items-center justify-between gap-4">
                                    <div className="flex flex-col gap-1.5 min-w-0">
                                        <p className="text-white text-sm font-medium">{project.name}</p>
                                        <p className="text-gray-500 text-xs mt-0.5">{project.description}</p>
                                        <MemberAvatars projectId={project.id} />
                                    </div>
                                    <button onClick={async () => {
                                        await deleteProject(project.id);
                                        setAdminProjects(prev => prev.filter(p => p.id !== project.id));
                                        if (selectedProject?.id === project.id) setSelectedProject(null);
                                    }}
                                        className="text-red-400 hover:text-red-300 border border-red-500/30 hover:border-red-400/50 rounded-lg px-3 py-1.5 text-xs transition-colors">
                                        Delete
                                    </button>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </>)}
        </div>
    );
}