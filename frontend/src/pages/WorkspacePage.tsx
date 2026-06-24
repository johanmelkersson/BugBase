import { useEffect, useState, useMemo } from 'react';
import { useProject } from '../context/ProjectContext';
import { useAuth } from '../context/AuthContext';
import { updateProject } from '../api/projects';
import { getAll as getIssues, create as createIssue, update as updateIssue } from '../api/issues';
import { getAll as getComments, create as createComment, update as updateComment } from '../api/comments';
import { getMembers } from '../api/projects';
import { StatusBadge, PriorityBadge } from '../components/Badges';
import IssueFilters, { type IssueFilterState } from '../components/IssueFilters';
import type { Issue, CreateIssue, Comment, ProjectMember, UpdateIssue } from '../types';

export default function WorkspacePage() {
    const { auth } = useAuth();
    const { selectedProject, setSelectedProject, setProjects, setShowCreateModal, setMyProjectRole } = useProject();
    const [issues, setIssues] = useState<Issue[]>([]);
    const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
    const [view, setView] = useState<'list' | 'kanban'>('list');

    const [form, setForm] = useState<CreateIssue>({ title: '', description: '', priority: 'Low', status: 'Open' });
    const [editMode, setEditMode] = useState(false);
    const [editForm, setEditForm] = useState<UpdateIssue>({});
    const [formError, setFormError] = useState('');
    const [createExpanded, setCreateExpanded] = useState(false);
    const [page, setPage] = useState(0);
    const PAGE_SIZE = 10;

    const [filters, setFilters] = useState<IssueFilterState>({ searchTerm: '', statuses: [], priorities: [], assignee: '' });
    const [sortBy, setSortBy] = useState('createdDesc');

    function handleFiltersChange(f: IssueFilterState) { setFilters(f); setPage(0); }
    function handleSortChange(s: string) { setSortBy(s); setPage(0); }

    const [comments, setComments] = useState<Comment[]>([]);
    const [commentText, setCommentText] = useState('');
    const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
    const [editingCommentText, setEditingCommentText] = useState('');
    const [members, setMembers] = useState<ProjectMember[]>([]);

    const roleOrder: Record<string, number> = { Owner: 0, Developer: 1, Reporter: 2 };
    const sortedMembers = useMemo(() => [...members].sort((a, b) => (roleOrder[a.role] ?? 9) - (roleOrder[b.role] ?? 9)), [members]);
    const myProjectRole = useMemo(() => members.find(m => m.id === auth?.userId)?.role ?? null, [members, auth]);
    const canEditProject = myProjectRole === 'Owner';
    const canEditIssueText = myProjectRole === 'Owner' || myProjectRole === 'Developer' || selectedIssue?.reportedById === auth?.userId;

    const [editingProject, setEditingProject] = useState(false);
    const [projectForm, setProjectForm] = useState({ name: '', description: '' });
    const [assigneeOpen, setAssigneeOpen] = useState(false);
    const [detailAssigneeOpen, setDetailAssigneeOpen] = useState(false);

    useEffect(() => {
        if (!selectedProject) return;
        setSelectedIssue(null);
        setIssues([]);
        getIssues(selectedProject.id).then(setIssues);
        getMembers(selectedProject.id).then(m => {
            setMembers(m);
            setMyProjectRole(m.find(mem => mem.id === auth?.userId)?.role ?? null);
        });
    }, [selectedProject]);

    useEffect(() => {
        if (!selectedIssue) { setComments([]); return; }
        setEditMode(false);
        setDetailAssigneeOpen(false);
        getComments(selectedIssue.id).then(setComments);
    }, [selectedIssue]);

    const PRIORITY_ORDER: Record<string, number> = { Low: 0, Medium: 1, High: 2, Critical: 3 };

    const filteredIssues = issues
        .filter(issue =>
            (!filters.searchTerm || issue.title.toLowerCase().includes(filters.searchTerm.toLowerCase())) &&
            (filters.statuses.length === 0 || filters.statuses.includes(issue.status)) &&
            (filters.priorities.length === 0 || filters.priorities.includes(issue.priority)) &&
            (!filters.assignee || (filters.assignee === 'unassigned' ? !issue.assignedToName : issue.assignedToName === filters.assignee))
        )
        .sort((a, b) => {
            switch (sortBy) {
                case 'createdAsc':  return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                case 'updatedDesc': return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
                case 'updatedAsc':  return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
                case 'priorityDesc': return PRIORITY_ORDER[b.priority] - PRIORITY_ORDER[a.priority];
                case 'priorityAsc':  return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
                default:            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            }
        });

    async function handleCreateIssue(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (!selectedProject) return;
        try {
            const newIssue = await createIssue(selectedProject.id, form.title, form.description, form.priority, form.status, form.assignedTo);
            setIssues(prev => [...prev, newIssue]);
            setForm({ title: '', description: '', priority: 'Low', status: 'Open' });
            setFormError('');
        } catch {
            setFormError('Could not create issue.');
        }
    }

    function handleStartEdit() {
        if (!selectedIssue) return;
        setEditForm({ title: selectedIssue.title, description: selectedIssue.description });
        setEditMode(true);
    }

    async function handleSaveEdit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (!selectedIssue) return;
        const updated = await updateIssue(selectedIssue.id, editForm);
        setIssues(prev => prev.map(i => i.id === updated.id ? updated : i));
        setSelectedIssue(updated);
        setEditMode(false);
    }

    async function handleSaveComment(id: number) {
        const updated = await updateComment(id, { content: editingCommentText });
        setComments(prev => prev.map(c => c.id === updated.id ? updated : c));
        setEditingCommentId(null);
    }

    async function handleCreateComment(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (!selectedIssue || !commentText.trim()) return;
        const newComment = await createComment(selectedIssue.id, commentText);
        setComments(prev => [...prev, newComment]);
        setCommentText('');
    }

    if (!selectedProject) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
                <p className="text-gray-500 text-sm">No project selected.</p>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
                >
                    + Create project
                </button>
            </div>
        );
    }

    return (
        <div className="flex gap-4 h-[calc(100vh-57px)] overflow-hidden">

            {/* Left panel */}
            <div className="w-60 shrink-0 flex flex-col gap-3 overflow-y-auto border-r border-gray-700 py-4 px-4">

                {/* Project info */}
                <div className="bg-[#1e1f27] border border-gray-700 rounded-xl p-4">
                    {editingProject ? (
                        <div className="flex flex-col gap-2">
                            <input
                                value={projectForm.name}
                                onChange={e => setProjectForm(prev => ({ ...prev, name: e.target.value }))}
                                className="bg-[#13141a] border border-gray-700 text-gray-100 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-indigo-500"
                            />
                            <input
                                value={projectForm.description}
                                onChange={e => setProjectForm(prev => ({ ...prev, description: e.target.value }))}
                                className="bg-[#13141a] border border-gray-700 text-gray-100 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-indigo-500"
                            />
                            <div className="flex gap-1.5">
                                <button onClick={async () => {
                                    const updated = await updateProject(selectedProject.id, projectForm.name, projectForm.description);
                                    setSelectedProject(updated);
                                    setProjects(prev => prev.map(p => p.id === updated.id ? updated : p));
                                    setEditingProject(false);
                                }} className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs rounded-lg py-1.5 transition-colors">Save</button>
                                <button onClick={() => setEditingProject(false)} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded-lg py-1.5 transition-colors">Cancel</button>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <div className="flex items-start justify-between mb-1">
                                <h2 className="text-white font-semibold text-sm">{selectedProject.name}</h2>
                                {canEditProject && <button onClick={() => { setProjectForm({ name: selectedProject.name, description: selectedProject.description }); setEditingProject(true); }} className="text-gray-600 hover:text-gray-400 text-xs ml-2 shrink-0">Edit</button>}
                            </div>
                            <p className="text-gray-500 text-xs">{selectedProject.description}</p>
                        </div>
                    )}
                </div>

                {/* View toggle */}
                <div className="bg-[#1e1f27] border border-gray-700 rounded-xl p-3 flex gap-2">
                    <button
                        onClick={() => setView('list')}
                        className={`flex-1 py-1.5 text-xs rounded-lg transition-colors ${view === 'list' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`}
                    >
                        List
                    </button>
                    <button
                        onClick={() => setView('kanban')}
                        className={`flex-1 py-1.5 text-xs rounded-lg transition-colors ${view === 'kanban' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`}
                    >
                        Kanban
                    </button>
                </div>

                {/* Members */}
                <div className="bg-[#1e1f27] border border-gray-700 rounded-xl p-4">
                    <h3 className="text-white text-sm font-medium mb-3">Members</h3>
                    <div className="flex flex-col gap-2">
                        {sortedMembers.map(m => (
                            <div key={m.id} className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-indigo-700 flex items-center justify-center text-[10px] text-white font-medium shrink-0">
                                    {m.username[0].toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-gray-300 text-xs truncate">{m.username}</p>
                                    <p className="text-gray-600 text-[10px]">{m.role}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main area */}
            <div className="flex-1 flex flex-col min-w-0 py-4 overflow-hidden">
                {view === 'list' ? (
                    <>
                        {/* Filters + sort row */}
                        <div className="flex items-start justify-between gap-2 mb-1">
                            <div className="flex-1 min-w-0">
                                <IssueFilters filters={filters} onChange={handleFiltersChange} members={members} />
                            </div>
                            <select
                                value={sortBy}
                                onChange={e => handleSortChange(e.target.value)}
                                className="bg-[#1e1f27] border border-gray-700 text-gray-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-indigo-500 shrink-0 mt-0.5"
                            >
                                <option value="createdDesc">Created ↓</option>
                                <option value="createdAsc">Created ↑</option>
                                <option value="updatedDesc">Updated ↓</option>
                                <option value="updatedAsc">Updated ↑</option>
                                <option value="priorityDesc">Priority ↓</option>
                                <option value="priorityAsc">Priority ↑</option>
                            </select>
                        </div>

                        {/* Issue list — scrollable */}
                        <div className="flex flex-col gap-1.5 overflow-y-auto flex-1">
                            {filteredIssues.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE).map(issue => (
                                <button
                                    key={issue.id}
                                    onClick={() => setSelectedIssue(issue)}
                                    className={`bg-[#1e1f27] border rounded-lg px-4 py-2.5 transition-colors text-left flex items-center justify-between gap-4 ${selectedIssue?.id === issue.id ? 'border-indigo-500' : 'border-gray-700 hover:border-indigo-500'}`}
                                >
                                    <p className="text-white text-xs font-medium truncate flex-1">{issue.title}</p>
                                    <div className="flex items-center gap-2 shrink-0">
                                        {issue.assignedToName && (
                                            <div title={issue.assignedToName} className="w-5 h-5 rounded-full bg-indigo-700 flex items-center justify-center text-[10px] text-white font-medium">
                                                {issue.assignedToName[0].toUpperCase()}
                                            </div>
                                        )}
                                        <StatusBadge status={issue.status} />
                                        <PriorityBadge priority={issue.priority} />
                                    </div>
                                </button>
                            ))}
                        </div>

                        {/* Pagination + create */}
                        <div className="pt-3 border-t border-gray-700 mt-3 flex flex-col gap-2">
                            {/* Pagination */}
                            {filteredIssues.length > PAGE_SIZE && (
                                <div className="flex items-center justify-between text-xs text-gray-500">
                                    <button
                                        onClick={() => setPage(p => Math.max(0, p - 1))}
                                        disabled={page === 0}
                                        className="px-3 py-1 rounded-lg bg-[#1e1f27] border border-gray-700 hover:border-gray-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                    >
                                        ← Prev
                                    </button>
                                    <span>{page + 1} / {Math.ceil(filteredIssues.length / PAGE_SIZE)}</span>
                                    <button
                                        onClick={() => setPage(p => Math.min(Math.ceil(filteredIssues.length / PAGE_SIZE) - 1, p + 1))}
                                        disabled={page >= Math.ceil(filteredIssues.length / PAGE_SIZE) - 1}
                                        className="px-3 py-1 rounded-lg bg-[#1e1f27] border border-gray-700 hover:border-gray-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                    >
                                        Next →
                                    </button>
                                </div>
                            )}

                            {/* Quick create */}
                            {createExpanded ? (
                                <form onSubmit={async e => { await handleCreateIssue(e); setCreateExpanded(false); setAssigneeOpen(false); }} className="flex flex-col gap-2">
                                    <input
                                        value={form.title}
                                        onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
                                        placeholder="Title"
                                        required
                                        autoFocus
                                        className="bg-[#1e1f27] border border-gray-700 text-gray-100 placeholder-gray-500 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
                                    />
                                    <textarea
                                        value={form.description}
                                        onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                                        placeholder="Description"
                                        rows={2}
                                        className="bg-[#1e1f27] border border-gray-700 text-gray-100 placeholder-gray-500 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 resize-none"
                                    />
                                    <div className="flex gap-3 items-end">
                                        <div className="flex flex-col gap-1 flex-[2]">
                                            <span className="text-gray-500 text-[10px] uppercase tracking-wide pl-0.5">Priority</span>
                                            <select value={form.priority} onChange={e => setForm(prev => ({ ...prev, priority: e.target.value }))} className="bg-[#1e1f27] border border-gray-700 text-gray-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-indigo-500">
                                                <option value="Low">Low</option>
                                                <option value="Medium">Medium</option>
                                                <option value="High">High</option>
                                                <option value="Critical">Critical</option>
                                            </select>
                                        </div>
                                        <div className="flex flex-col gap-1 flex-[2]">
                                            <span className="text-gray-500 text-[10px] uppercase tracking-wide pl-0.5">Status</span>
                                            <select value={form.status} onChange={e => setForm(prev => ({ ...prev, status: e.target.value }))} className="bg-[#1e1f27] border border-gray-700 text-gray-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-indigo-500">
                                                <option value="Open">Open</option>
                                                <option value="InProgress">In Progress</option>
                                                <option value="Review">Review</option>
                                                <option value="Closed">Closed</option>
                                            </select>
                                        </div>
                                        {/* Assignee picker — chip style */}
                                        <div className="flex flex-col gap-1 flex-[1]">
                                            <span className="text-gray-500 text-[10px] uppercase tracking-wide pl-0.5">Assignee</span>
                                            <div className="relative flex items-center" style={{ height: '30px' }}>
                                                {form.assignedTo ? (
                                                    <div className="flex items-center gap-1.5 bg-[#1e1f27] border border-gray-700 rounded-full pl-1 pr-2 py-0.5">
                                                        <div className="w-5 h-5 rounded-full bg-indigo-700 flex items-center justify-center text-[9px] text-white font-medium shrink-0">
                                                            {members.find(m => m.id === form.assignedTo)?.username[0].toUpperCase()}
                                                        </div>
                                                        <span className="text-gray-200 text-xs truncate max-w-[60px]">{members.find(m => m.id === form.assignedTo)?.username}</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => { setForm(prev => ({ ...prev, assignedTo: undefined })); setAssigneeOpen(false); }}
                                                            className="text-gray-500 hover:text-gray-200 text-sm leading-none transition-colors ml-0.5"
                                                        >×</button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={() => setAssigneeOpen(v => !v)}
                                                        className="flex items-center gap-1 border border-dashed border-gray-600 hover:border-indigo-500 rounded-full px-3 py-0.5 text-xs text-gray-500 hover:text-gray-300 transition-colors whitespace-nowrap"
                                                    >
                                                        + Assign
                                                    </button>
                                                )}
                                                {assigneeOpen && (
                                                    <div className="absolute bottom-full mb-1 left-0 bg-[#13141a] border border-gray-700 rounded-lg shadow-xl z-30 py-1 min-w-[140px]">
                                                        {sortedMembers.map(m => (
                                                            <button
                                                                key={m.id}
                                                                type="button"
                                                                onClick={() => { setForm(prev => ({ ...prev, assignedTo: m.id })); setAssigneeOpen(false); }}
                                                                className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-white/5 transition-colors text-left"
                                                            >
                                                                <div className="w-5 h-5 rounded-full bg-indigo-700 flex items-center justify-center text-[10px] text-white font-medium shrink-0">
                                                                    {m.username[0].toUpperCase()}
                                                                </div>
                                                                <span className="text-gray-300 text-xs">{m.username}</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg py-2 transition-colors">Create</button>
                                        <button type="button" onClick={() => { setCreateExpanded(false); setAssigneeOpen(false); setForm({ title: '', description: '', priority: 'Low', status: 'Open' }); }} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white text-xs font-medium rounded-lg py-2 transition-colors">Cancel</button>
                                    </div>
                                    {formError && <p className="text-red-400 text-xs">{formError}</p>}
                                </form>
                            ) : (
                                <button
                                    onClick={() => setCreateExpanded(true)}
                                    className="w-full text-left px-4 py-2 rounded-lg border border-dashed border-gray-700 hover:border-indigo-500 text-gray-500 hover:text-gray-300 text-xs transition-colors"
                                >
                                    + New issue
                                </button>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="flex items-center justify-center h-full bg-[#1e1f27] border border-gray-700 rounded-xl">
                        <p className="text-gray-500 text-sm">Kanban — coming soon</p>
                    </div>
                )}
            </div>

            {/* Right panel — always visible */}
            <div className="w-72 shrink-0 bg-[#1e1f27] border-l border-gray-700 py-4 px-5 overflow-y-auto">
                {selectedIssue ? (
                    <>
                        {/* Header */}
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex-1 min-w-0">
                                {editMode ? (
                                    <form id="edit-text-form" onSubmit={handleSaveEdit} className="flex flex-col gap-2">
                                        <input
                                            value={editForm.title ?? ''}
                                            onChange={e => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                                            placeholder="Title"
                                            className="bg-[#13141a] border border-gray-700 text-gray-100 placeholder-gray-500 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 w-full"
                                        />
                                        <textarea
                                            value={editForm.description ?? ''}
                                            onChange={e => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                                            placeholder="Description"
                                            rows={3}
                                            className="bg-[#13141a] border border-gray-700 text-gray-100 placeholder-gray-500 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 resize-none w-full"
                                        />
                                        <div className="flex gap-2">
                                            <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg px-3 py-2 transition-colors">
                                                Save
                                            </button>
                                            <button type="button" onClick={() => setEditMode(false)} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white text-xs font-medium rounded-lg px-3 py-2 transition-colors">
                                                Cancel
                                            </button>
                                        </div>
                                    </form>
                                ) : (
                                    <>
                                        <h2 className="text-white font-semibold text-sm mb-1">{selectedIssue.title}</h2>
                                        <p className="text-gray-400 text-xs">{selectedIssue.description}</p>
                                    </>
                                )}
                            </div>
                            {!editMode && (
                                <div className="flex items-center gap-2 ml-2 shrink-0">
                                    {canEditIssueText && <button onClick={handleStartEdit} className="text-gray-500 hover:text-white text-xs">Edit</button>}
                                    <button onClick={() => setSelectedIssue(null)} className="text-gray-500 hover:text-white text-xs">✕</button>
                                </div>
                            )}
                        </div>

                        {/* Inline dropdowns — always visible */}
                        <div className="flex flex-col gap-2 mb-4">
                                <div className="flex items-center justify-between text-xs text-gray-500">
                                    <span>Status</span>
                                    <select
                                        value={selectedIssue.status}
                                        onChange={async e => {
                                            const updated = await updateIssue(selectedIssue.id, { status: e.target.value });
                                            setIssues(prev => prev.map(i => i.id === updated.id ? updated : i));
                                            setSelectedIssue(updated);
                                        }}
                                        className="bg-[#13141a] border border-gray-700 text-gray-300 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-indigo-500"
                                    >
                                        <option value="Open">Open</option>
                                        <option value="InProgress">In Progress</option>
                                        <option value="Review">Review</option>
                                        <option value="Closed">Closed</option>
                                    </select>
                                </div>
                                <div className="flex items-center justify-between text-xs text-gray-500">
                                    <span>Priority</span>
                                    <select
                                        value={selectedIssue.priority}
                                        onChange={async e => {
                                            const updated = await updateIssue(selectedIssue.id, { priority: e.target.value });
                                            setIssues(prev => prev.map(i => i.id === updated.id ? updated : i));
                                            setSelectedIssue(updated);
                                        }}
                                        className="bg-[#13141a] border border-gray-700 text-gray-300 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-indigo-500"
                                    >
                                        <option value="Low">Low</option>
                                        <option value="Medium">Medium</option>
                                        <option value="High">High</option>
                                        <option value="Critical">Critical</option>
                                    </select>
                                </div>
                                <div className="flex items-center justify-between text-xs text-gray-500">
                                    <span>Assigned to</span>
                                    <div className="relative">
                                        {selectedIssue.assignedToName ? (
                                            <div className="flex items-center gap-1.5 bg-[#13141a] border border-gray-700 rounded-full pl-1 pr-2 py-0.5">
                                                <div className="w-5 h-5 rounded-full bg-indigo-700 flex items-center justify-center text-[9px] text-white font-medium shrink-0">
                                                    {selectedIssue.assignedToName[0].toUpperCase()}
                                                </div>
                                                <button
                                                    onClick={() => setDetailAssigneeOpen(v => !v)}
                                                    className="text-gray-200 text-xs hover:text-white transition-colors"
                                                >
                                                    {selectedIssue.assignedToName}
                                                </button>
                                                <button
                                                    onClick={async () => {
                                                        const updated = await updateIssue(selectedIssue.id, { clearAssignee: true });
                                                        setIssues(prev => prev.map(i => i.id === updated.id ? updated : i));
                                                        setSelectedIssue(updated);
                                                        setDetailAssigneeOpen(false);
                                                    }}
                                                    className="text-gray-500 hover:text-gray-200 text-sm leading-none transition-colors"
                                                >×</button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => setDetailAssigneeOpen(v => !v)}
                                                className="flex items-center gap-1 border border-dashed border-gray-600 hover:border-indigo-500 rounded-full px-3 py-0.5 text-xs text-gray-500 hover:text-gray-300 transition-colors"
                                            >
                                                + Assign
                                            </button>
                                        )}
                                        {detailAssigneeOpen && (
                                            <div className="absolute top-full mt-1 right-0 bg-[#13141a] border border-gray-700 rounded-lg shadow-xl z-30 py-1 min-w-[140px]">
                                                {sortedMembers.map(m => (
                                                    <button
                                                        key={m.id}
                                                        onClick={async () => {
                                                            const updated = await updateIssue(selectedIssue.id, { assignedTo: m.id });
                                                            setIssues(prev => prev.map(i => i.id === updated.id ? updated : i));
                                                            setSelectedIssue(updated);
                                                            setDetailAssigneeOpen(false);
                                                        }}
                                                        className={`w-full flex items-center gap-2 px-3 py-1.5 hover:bg-white/5 transition-colors text-left ${selectedIssue.assignedToName === m.username ? 'bg-white/5' : ''}`}
                                                    >
                                                        <div className="w-5 h-5 rounded-full bg-indigo-700 flex items-center justify-center text-[10px] text-white font-medium shrink-0">
                                                            {m.username[0].toUpperCase()}
                                                        </div>
                                                        <span className="text-gray-300 text-xs">{m.username}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="text-xs text-gray-500 space-y-1.5 pt-1">
                                    <div className="flex items-center gap-1.5">
                                        <span>Created: <span className="text-gray-300">{new Date(selectedIssue.createdAt).toLocaleDateString()}</span></span>
                                        <div title={selectedIssue.reportedByName ?? 'Deleted user'} className="w-5 h-5 rounded-full bg-gray-600 flex items-center justify-center text-[9px] text-white font-medium shrink-0">
                                            {selectedIssue.reportedByName ? selectedIssue.reportedByName[0].toUpperCase() : '?'}
                                        </div>
                                    </div>
                                    {selectedIssue.updatedByName && (
                                        <div className="flex items-center gap-1.5">
                                            <span>Updated: <span className="text-gray-300">{new Date(selectedIssue.updatedAt).toLocaleDateString()}</span></span>
                                            <div title={selectedIssue.updatedByName} className="w-5 h-5 rounded-full bg-indigo-700 flex items-center justify-center text-[9px] text-white font-medium shrink-0">
                                                {selectedIssue.updatedByName[0].toUpperCase()}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                        <div className="mt-6 border-t border-gray-700 pt-4">
                            <h3 className="text-white text-xs font-medium mb-3">Comments</h3>
                            <div className="flex flex-col gap-3 mb-4">
                                {comments.length === 0 && (
                                    <p className="text-gray-600 text-xs">No comments yet.</p>
                                )}
                                {comments.map(c => {
                                    const isOwn = c.authorId === auth?.userId;
                                    return (
                                        <div key={c.id} className={`flex gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                                            <div title={c.authorName ?? 'Deleted user'} className={`w-6 h-6 rounded-full ${c.authorName ? 'bg-indigo-700' : 'bg-gray-600'} flex items-center justify-center text-[10px] text-white font-medium shrink-0 mt-0.5`}>
                                                {c.authorName ? c.authorName[0].toUpperCase() : '?'}
                                            </div>
                                            <div className={`flex flex-col gap-1 max-w-[80%] ${isOwn ? 'items-end' : 'items-start'}`}>
                                                <span className="text-gray-500 text-[10px]">{c.authorName ?? 'Deleted user'}</span>
                                                {editingCommentId === c.id ? (
                                                    <div className="flex flex-col gap-1.5 w-full">
                                                        <textarea
                                                            value={editingCommentText}
                                                            onChange={e => setEditingCommentText(e.target.value)}
                                                            rows={2}
                                                            className="bg-[#1e1f27] border border-gray-700 text-gray-100 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-indigo-500 resize-none w-full"
                                                        />
                                                        <div className="flex gap-1.5">
                                                            <button onClick={() => handleSaveComment(c.id)} className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs rounded-lg py-1 transition-colors">Save</button>
                                                            <button onClick={() => setEditingCommentId(null)} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded-lg py-1 transition-colors">Cancel</button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className={`group relative px-3 py-2 rounded-2xl text-xs text-gray-200 ${isOwn ? 'bg-indigo-700 rounded-tr-sm' : 'bg-[#13141a] rounded-tl-sm'}`}>
                                                        {c.content}
                                                        {isOwn && (
                                                            <button
                                                                onClick={() => { setEditingCommentId(c.id); setEditingCommentText(c.content); }}
                                                                className="absolute -bottom-4 right-0 text-gray-600 hover:text-gray-400 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap"
                                                            >
                                                                Edit
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            <form onSubmit={handleCreateComment} className="flex flex-col gap-2">
                                <textarea
                                    value={commentText}
                                    onChange={e => setCommentText(e.target.value)}
                                    placeholder="Write a comment..."
                                    rows={2}
                                    className="bg-[#13141a] border border-gray-700 text-gray-100 placeholder-gray-500 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 resize-none"
                                />
                                <button
                                    type="submit"
                                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg px-3 py-2 transition-colors"
                                >
                                    Send
                                </button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <p className="text-gray-600 text-xs text-center">Select an issue to view details</p>
                    </div>
                )}
            </div>
        </div>
    );
}