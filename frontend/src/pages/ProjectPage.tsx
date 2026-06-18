import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getAll } from '../api/issues';
import type { Issue } from '../types';
import { Link } from 'react-router-dom';

export default function ProjectPage() {
    const { id } = useParams();
    const [issues, setIssues] = useState<Issue[]>([]);

    useEffect(() => {
        getAll(Number(id)).then(issues => setIssues(issues));
    }, [id]);

    return (
        <div>
            <h1>Issues</h1>
            {issues.map(issue => (
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