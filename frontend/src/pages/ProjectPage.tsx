import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { create, getAll } from '../api/issues';
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
            <form onSubmit={handleSubmit}>
                <input value={form.title} onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))} type="text" placeholder="Title" />
                <textarea value={form.description} onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))} placeholder="Description" />
                <select value={form.priority} onChange={e => setForm(prev => ({ ...prev, priority: e.target.value }))}>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                </select>
                <button type="submit">Create</button>
                {error && <p>{error}</p>}
            </form>

            <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} type="text" placeholder="Search..." />
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} >
                <option value="">All</option>
                <option value="Open">Open</option>
                <option value="InProgress">InProgress</option>
                <option value="Review">Review</option>
                <option value="Closed">Closed</option>
            </select>
            <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)} >
                <option value="">All</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
            </select>

            <h1>Issues</h1>
            {filteredIssues.map(issue => (
                <div key={issue.id}>
                    <Link to={`/issues/${issue.id}`}>
                        <h2>{issue.title}</h2>
                    </Link>
                    <p>{issue.description}</p>
                    <p>{issue.status}</p>
                    <p>{issue.priority}</p>
                    <p>Reported by: {issue.reportedByName}</p>
                    <p>Assigned to: {issue.assignedToName || 'Unassigned'}</p>
                    <p>Created at: {new Date(issue.createdAt).toLocaleDateString()}</p>
                    <p>Updated at: {new Date(issue.updatedAt).toLocaleDateString()}</p>
                </div>
            ))}
        </div>
    );
}