import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getById } from '../api/issues';
import type { Issue, Comment } from '../types';
import { create, getAll } from '../api/comments';

export default function IssuePage() {
    const { id } = useParams();
    const [issue, setIssue] = useState<Issue | null>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');

    useEffect(() => {
        async function fetchIssue() {
            const [issue, comments] = await Promise.all([
                getById(Number(id)),
                getAll(Number(id))
            ]);
            setIssue(issue);
            setComments(comments);
        }
        fetchIssue();
    }, [id]);


    async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
        e.preventDefault();
        const created = await create(issue!.id, newComment);
        setComments([...comments, created]);
        setNewComment('');
    }

    return (
        <div>
            <h1>Issue</h1>
            {issue && (
                <div>
                    <h2>{issue.title}</h2>
                    <p>{issue.description}</p>
                    <p>{issue.status}</p>
                    <p>{issue.priority}</p>
                    <p>Reported by: {issue.reportedByName}</p>
                    <p>Assigned to: {issue.assignedToName || 'Unassigned'}</p>
                    <p>Created at: {new Date(issue.createdAt).toLocaleDateString()}</p>
                    <p>Updated at: {new Date(issue.updatedAt).toLocaleDateString()}</p>
                    <h2>Kommentarer</h2>
                    {comments.map(comment => (
                        <div key={comment.id}>
                            <p>{comment.authorName}</p>
                            <p>{comment.content}</p>
                            <p>{new Date(comment.createdAt).toLocaleDateString()}</p>
                        </div>
                    ))}
                    <form onSubmit={handleSubmit}>
                        <textarea
                            value={newComment}
                            onChange={e => setNewComment(e.target.value)}
                        />
                        <button type="submit">Skicka</button>
                    </form>
                </div>
            )}
        </div>
    );
}