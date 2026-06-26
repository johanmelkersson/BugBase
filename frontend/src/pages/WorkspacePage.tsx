import { useEffect, useState, useMemo, useRef } from 'react';
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors, useDroppable, useDraggable, type DragEndEvent, type DragStartEvent } from '@dnd-kit/core';
import { useProject } from '../context/ProjectContext';
import { useAuth } from '../context/AuthContext';
import { getAll as getIssues, getDetail, create as createIssue, update as updateIssue, deleteIssue } from '../api/issues';
import { create as createComment, update as updateComment, deleteComment } from '../api/comments';
import { getMembers } from '../api/projects';
import { StatusBadge, PriorityBadge } from '../components/Badges';
import IssueFilters, { type IssueFilterState } from '../components/IssueFilters';
import type { Issue, CreateIssue, Comment, UpdateIssue } from '../types';

export default function WorkspacePage() {
    const { auth } = useAuth();
    const { selectedProject, setShowCreateModal, setMyProjectRole, projectMembers, setProjectMembers } = useProject();
    const [issues, setIssues] = useState<Issue[]>([]);
    const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
    const [view, setView] = useState<'list' | 'kanban'>(() => (localStorage.getItem('workspace-view') as 'list' | 'kanban') ?? 'kanban');

    function handleViewChange(v: 'list' | 'kanban') { setView(v); localStorage.setItem('workspace-view', v); }

    const [form, setForm] = useState<CreateIssue>({ title: '', description: '', priority: 'Low', status: 'Open' });
    const [editMode, setEditMode] = useState(false);
    const [editForm, setEditForm] = useState<UpdateIssue>({});
    const [formError, setFormError] = useState('');
    const [createExpanded, setCreateExpanded] = useState(false);
    const createFormRef = useRef<HTMLDivElement>(null);
    const [page, setPage] = useState(0);
    const PAGE_SIZE = 10;

    const [filters, setFilters] = useState<IssueFilterState>({ searchTerm: '', statuses: [], priorities: [], assignees: [] });
    const [sortBy, setSortBy] = useState('createdDesc');

    function handleFiltersChange(f: IssueFilterState) { setFilters(f); setPage(0); }
    function handleSortChange(s: string) { setSortBy(s); setPage(0); }

    const [comments, setComments] = useState<Comment[]>([]);
    const [commentText, setCommentText] = useState('');
    const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
    const [editingCommentText, setEditingCommentText] = useState('');

    const roleOrder: Record<string, number> = { Owner: 0, Developer: 1, Reporter: 2 };
    const sortedMembers = useMemo(() => [...projectMembers].sort((a, b) => (roleOrder[a.role] ?? 9) - (roleOrder[b.role] ?? 9)), [projectMembers]);
    const myProjectRole = useMemo(() => projectMembers.find(m => m.id === auth?.userId)?.role ?? null, [projectMembers, auth]);
    const canEditIssueText = myProjectRole === 'Owner' || myProjectRole === 'Developer' || selectedIssue?.reportedById === auth?.userId;
    const canAssign = myProjectRole === 'Owner' || myProjectRole === 'Developer';

    const [assigneeOpen, setAssigneeOpen] = useState(false);
    const [detailAssigneeOpen, setDetailAssigneeOpen] = useState(false);

    useEffect(() => {
        if (!selectedProject) return;
        setSelectedIssue(null);
        getIssues(selectedProject.id).then(setIssues);
        getMembers(selectedProject.id).then(m => {
            setProjectMembers(m);
            setMyProjectRole(m.find(mem => mem.id === auth?.userId)?.role ?? null);
        });
    }, [selectedProject]);

    useEffect(() => {
        function handler(e: MouseEvent) {
            if (createFormRef.current && !createFormRef.current.contains(e.target as Node)) {
                setCreateExpanded(false);
                setAssigneeOpen(false);
            }
        }
        if (createExpanded) document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [createExpanded]);

    useEffect(() => {
        if (!selectedIssue) { setComments([]); return; }
        setEditMode(false);
        setDetailAssigneeOpen(false);
        setComments([]);
        getDetail(selectedIssue.id).then(d => setComments(d.comments));
    }, [selectedIssue]);

    const PRIORITY_ORDER: Record<string, number> = { Low: 0, Medium: 1, High: 2, Critical: 3 };

    const filteredIssues = issues
        .filter(issue =>
            (!filters.searchTerm || issue.title.toLowerCase().includes(filters.searchTerm.toLowerCase())) &&
            (filters.statuses.length === 0 || filters.statuses.includes(issue.status)) &&
            (filters.priorities.length === 0 || filters.priorities.includes(issue.priority)) &&
            (filters.assignees.length === 0 || filters.assignees.some(a => a === 'unassigned' ? !issue.assignedToName : issue.assignedToName === a))
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

    async function handleDeleteIssue() {
        if (!selectedIssue) return;
        await deleteIssue(selectedIssue.id);
        setIssues(prev => prev.filter(i => i.id !== selectedIssue.id));
        setSelectedIssue(null);
    }

    async function handleDeleteComment(id: number) {
        await deleteComment(id);
        setComments(prev => prev.filter(c => c.id !== id));
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

    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
    const [activeIssue, setActiveIssue] = useState<Issue | null>(null);

    function handleDragStart(event: DragStartEvent) {
        setActiveIssue(issues.find(i => i.id === event.active.id) ?? null);
    }

    async function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        const issueId = active.id as number;
        const newStatus = over.id as string;
        const issue = issues.find(i => i.id === issueId);
        if (!issue || issue.status === newStatus) return;
        setActiveIssue(null);
        setIssues(prev => prev.map(i => i.id === issueId ? { ...i, status: newStatus } : i));
        if (selectedIssue?.id === issueId) setSelectedIssue(prev => prev ? { ...prev, status: newStatus } : prev);
        await updateIssue(issueId, { status: newStatus });
    }

    function KanbanCard({ issue, dragging = false }: { issue: Issue; dragging?: boolean }) {
        return (
            <div className={`bg-[#13141a] border rounded-lg px-3 py-2.5 text-left w-full transition-colors ${dragging ? 'border-indigo-400 shadow-xl opacity-95' : selectedIssue?.id === issue.id ? 'border-indigo-500' : 'border-gray-700 hover:border-indigo-500'}`}>
                <p className="text-white text-xs font-medium mb-2 leading-snug">{issue.title}</p>
                <div className="flex items-center justify-between gap-2">
                    <PriorityBadge priority={issue.priority} />
                    {issue.assignedToName && (
                        <div title={issue.assignedToName} className="w-5 h-5 rounded-full bg-indigo-700 flex items-center justify-center text-[10px] text-white font-medium shrink-0">
                            {issue.assignedToName[0].toUpperCase()}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    function DraggableCard({ issue }: { issue: Issue }) {
        const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: issue.id });
        return (
            <div ref={setNodeRef} {...listeners} {...attributes}
                onClick={() => setSelectedIssue(issue)}
                className={`cursor-grab active:cursor-grabbing ${isDragging ? 'opacity-0' : ''}`}
            >
                <KanbanCard issue={issue} />
            </div>
        );
    }

    function DroppableColumn({ status, label, columnIssues }: { status: string; label: string; columnIssues: Issue[] }) {
        const { setNodeRef, isOver } = useDroppable({ id: status });
        return (
            <div className={`flex flex-col min-w-[200px] flex-1 border rounded-xl overflow-hidden transition-colors ${isOver ? 'border-indigo-500 bg-indigo-500/5' : 'border-gray-700 bg-[#1e1f27]'}`}>
                <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-700 shrink-0">
                    <span className="text-xs font-semibold text-gray-300">{label}</span>
                    <span className="text-xs text-gray-500 bg-[#13141a] rounded-full px-2 py-0.5">{columnIssues.length}</span>
                </div>
                <div ref={setNodeRef} className="flex flex-col gap-2 p-2 overflow-y-auto flex-1 min-h-[60px]">
                    {columnIssues.map(issue => <DraggableCard key={issue.id} issue={issue} />)}
                    {columnIssues.length === 0 && (
                        <p className="text-gray-700 text-xs text-center py-4">No issues</p>
                    )}
                </div>
            </div>
        );
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

            {/* Main area */}
            <div className="flex-1 flex flex-col min-w-0 py-4 px-4 overflow-hidden">

                {/* Persistent top bar — always visible regardless of view */}
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                    <div className="flex gap-1 bg-[#1e1f27] border border-gray-700 rounded-lg p-1 shrink-0">
                        <button
                            onClick={() => handleViewChange('list')}
                            className={`px-4 py-1 text-xs rounded-md transition-colors ${view === 'list' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`}
                        >
                            List
                        </button>
                        <button
                            onClick={() => handleViewChange('kanban')}
                            className={`px-4 py-1 text-xs rounded-md transition-colors ${view === 'kanban' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`}
                        >
                            Kanban
                        </button>
                    </div>

                    <IssueFilters filters={filters} onChange={handleFiltersChange} members={projectMembers} className="flex gap-2 min-w-0" />

                </div>

                {view === 'list' ? (
                    <>
                        {/* Sort row — list only */}
                        <div className="flex justify-end mb-1">
                            <select
                                value={sortBy}
                                onChange={e => handleSortChange(e.target.value)}
                                className="bg-[#1e1f27] border border-gray-700 text-gray-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-indigo-500 shrink-0"
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

                        {/* Pagination */}
                        {filteredIssues.length > PAGE_SIZE && (
                            <div className="pt-3 border-t border-gray-700 mt-3 flex items-center justify-between text-xs text-gray-500">
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
                    </>
                ) : (
                    /* Kanban view */
                    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                        <div className="flex gap-3 overflow-x-auto flex-1 pb-1">
                            {(['Open', 'InProgress', 'Review', 'Closed'] as const).map(status => {
                                const labels: Record<string, string> = { Open: 'Open', InProgress: 'In Progress', Review: 'Review', Closed: 'Closed' };
                                return <DroppableColumn key={status} status={status} label={labels[status]} columnIssues={filteredIssues.filter(i => i.status === status)} />;
                            })}
                        </div>
                        <DragOverlay>
                            {activeIssue ? <KanbanCard issue={activeIssue} dragging /> : null}
                        </DragOverlay>
                    </DndContext>
                )}

                {/* New issue — persistent footer, always visible regardless of view */}
                <div className="pt-3 border-t border-gray-700 mt-3" ref={createFormRef}>
                {createExpanded ? (
                    <div>
                        <form onSubmit={async e => { await handleCreateIssue(e); setAssigneeOpen(false); }} className="flex flex-col gap-2">
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
                                <div className="flex flex-col gap-1 flex-[1]">
                                    <span className="text-gray-500 text-[10px] uppercase tracking-wide pl-0.5">Assignee</span>
                                    <div className="relative flex items-center" style={{ height: '30px' }}>
                                        {form.assignedTo ? (
                                            <div className="flex items-center gap-1.5 bg-[#1e1f27] border border-gray-700 rounded-full pl-1 pr-2 py-0.5">
                                                <div className="w-5 h-5 rounded-full bg-indigo-700 flex items-center justify-center text-[9px] text-white font-medium shrink-0">
                                                    {projectMembers.find(m => m.id === form.assignedTo)?.username[0].toUpperCase()}
                                                </div>
                                                <span className="text-gray-200 text-xs truncate max-w-[60px]">{projectMembers.find(m => m.id === form.assignedTo)?.username}</span>
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
                    </div>
                ) : (
                    <button
                        onClick={() => setCreateExpanded(true)}
                        className="w-full text-left px-4 py-2 rounded-lg border border-dashed border-gray-700 hover:border-indigo-500 text-gray-500 hover:text-gray-300 text-xs transition-colors"
                    >
                        + New issue
                    </button>
                )}
                </div>
            </div>

            {/* Right panel — drawer on mobile, fixed column on desktop */}
            <div className={`bg-[#1e1f27] py-4 px-5 overflow-y-auto fixed inset-y-0 right-0 w-full z-50 transition-transform duration-200 sm:relative sm:inset-auto sm:z-auto sm:w-72 sm:shrink-0 sm:border-l sm:border-gray-700 sm:translate-x-0 sm:transition-none ${selectedIssue ? 'translate-x-0' : 'translate-x-full'}`}>
                {selectedIssue ? (
                    <>
                        {/* Mobile back button */}
                        <button
                            onClick={() => setSelectedIssue(null)}
                            className="sm:hidden flex items-center gap-1 text-gray-400 hover:text-white text-xs mb-4 transition-colors"
                        >
                            ← Back to issues
                        </button>

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
                                    {canEditIssueText && <button onClick={handleDeleteIssue} className="text-gray-500 hover:text-red-400 text-xs">Delete</button>}
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
                                        disabled={!canEditIssueText}
                                        onChange={async e => {
                                            const updated = await updateIssue(selectedIssue.id, { status: e.target.value });
                                            setIssues(prev => prev.map(i => i.id === updated.id ? updated : i));
                                            setSelectedIssue(updated);
                                        }}
                                        className="bg-[#13141a] border border-gray-700 text-gray-300 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
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
                                        disabled={!canEditIssueText}
                                        onChange={async e => {
                                            const updated = await updateIssue(selectedIssue.id, { priority: e.target.value });
                                            setIssues(prev => prev.map(i => i.id === updated.id ? updated : i));
                                            setSelectedIssue(updated);
                                        }}
                                        className="bg-[#13141a] border border-gray-700 text-gray-300 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <option value="Low">Low</option>
                                        <option value="Medium">Medium</option>
                                        <option value="High">High</option>
                                        <option value="Critical">Critical</option>
                                    </select>
                                </div>
                                <div className="flex items-center justify-between text-xs text-gray-500">
                                    <span>Assigned to</span>
                                    {!canAssign ? (
                                        <span className="text-gray-300 text-xs">{selectedIssue.assignedToName ?? '—'}</span>
                                    ) : <div className="relative">
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
                                    </div>}
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
                                                        {(isOwn || myProjectRole === 'Owner') && (
                                                            <div className="absolute -bottom-4 right-0 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                {isOwn && (
                                                                    <button
                                                                        onClick={() => { setEditingCommentId(c.id); setEditingCommentText(c.content); }}
                                                                        className="text-gray-600 hover:text-gray-400 text-[10px] whitespace-nowrap"
                                                                    >
                                                                        Edit
                                                                    </button>
                                                                )}
                                                                <button
                                                                    onClick={() => handleDeleteComment(c.id)}
                                                                    className="text-gray-600 hover:text-red-400 text-[10px] whitespace-nowrap"
                                                                >
                                                                    Delete
                                                                </button>
                                                            </div>
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