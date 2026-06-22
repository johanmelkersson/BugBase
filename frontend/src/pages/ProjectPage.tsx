import { useParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { create, getAll } from '../api/issues';
import { StatusBadge, PriorityBadge } from '../components/Badges';
import type { CreateIssue, Issue } from '../types';


export default function ProjectPage() {

    const { id } = useParams();
    const [issues, setIssues] = useState<Issue[]>([]);
    const [form, setForm] = useState<CreateIssue>({ title: '', description: '', priority: 'Low' });
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [priorityFilter, setPriorityFilter] = useState('');
    const filteredIssues = issues.filter(issue => (!searchTerm || issue.title.toLowerCase().includes(searchTerm.toLocaleLowerCase())) &&
        (!statusFilter || statusFilter === issue.status) &&
        (!priorityFilter || priorityFilter === issue.priority));

    useEffect(() => {
        getAll(Number(id)).then(issues => setIssues(issues));
    }, [id]);

    async function handleSubmit(e: React.SubmitEvent) {
        e.preventDefault();
        try {
            const newIssue = await create(Number(id), form.title, form.description, form.priority);
            setIssues(prev => [...prev, newIssue]);
            setForm({ title: '', description: '', priority: 'Low' });
        } catch (error: any) {
            setError(error.response?.data?.message || 'Issue creation failed');
        }
    }

    return (!id) ? null : (
        <div>
            {/* Create issue form */}
            <div className="bg-[#1e1f27] border border-gray-700 rounded-xl p-5 mb-6">
                <h2 className="text-white font-medium text-base mb-4">Skapa issue</h2>
                <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                    <input
                        value={form.title}
                        onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
                        type="text"
                        placeholder="Titel"
                        className="bg-[#13141a] border border-gray-700 text-gray-100 placeholder-gray-500 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500"
                    />
                    <textarea
                        value={form.description}
                        onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Beskrivning"
                        rows={2}
                        className="bg-[#13141a] border border-gray-700 text-gray-100 placeholder-gray-500 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 resize-none"
                    />
                    <div className="flex gap-3 items-center">
                        <select
                            value={form.priority}
                            onChange={e => setForm(prev => ({ ...prev, priority: e.target.value }))}
                            className="bg-[#13141a] border border-gray-700 text-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500"
                        >
                            <option value="Low">Low</option>
                            <option value="Medium">Medium</option>
                            <option value="High">High</option>
                            <option value="Critical">Critical</option>
                        </select>
                        <button
                            type="submit"
                            className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg px-4 py-2.5 text-sm transition-colors"
                        >
                            Skapa
                        </button>
                        {error && <p className="text-red-400 text-sm">{error}</p>}
                    </div>
                </form>
            </div>

            {/* Filters */}
            <div className="flex gap-3 mb-4">
                <input
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    type="text"
                    placeholder="Sök..."
                    className="bg-[#1e1f27] border border-gray-700 text-gray-100 placeholder-gray-500 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-indigo-500 flex-1"
                />
                <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                    className="bg-[#1e1f27] border border-gray-700 text-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                >
                    <option value="">Alla statusar</option>
                    <option value="Open">Open</option>
                    <option value="InProgress">InProgress</option>
                    <option value="Review">Review</option>
                    <option value="Closed">Closed</option>
                </select>
                <select
                    value={priorityFilter}
                    onChange={e => setPriorityFilter(e.target.value)}
                    className="bg-[#1e1f27] border border-gray-700 text-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                >
                    <option value="">Alla prioriteter</option>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                </select>
            </div>

            {/* Issue list */}
            <h1 className="text-2xl font-semibold text-white mb-4">Issues</h1>
            <div className="flex flex-col gap-2">
                {filteredIssues.map(issue => (
                    <Link
                        key={issue.id}
                        to={`/issues/${issue.id}`}
                        className="bg-[#1e1f27] border border-gray-700 rounded-xl px-5 py-4 hover:border-indigo-500 transition-colors group flex items-start justify-between gap-4"
                    >
                        <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-medium group-hover:text-indigo-400 transition-colors truncate">
                                {issue.title}
                            </p>
                            <p className="text-gray-500 text-xs mt-1 truncate">{issue.description}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 text-xs">
                            <StatusBadge status={issue.status} />
                            <PriorityBadge priority={issue.priority} />
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}