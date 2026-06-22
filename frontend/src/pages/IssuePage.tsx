import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getById } from '../api/issues';
import { create, getAll } from '../api/comments';
import { StatusBadge, PriorityBadge } from '../components/Badges';
import type { Issue, Comment } from '../types';

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
        <div className="max-w-3xl">
            {issue && (
                <div>
                    {/* Issue header */}
                    <div className="bg-[#1e1f27] border border-gray-700 rounded-xl p-6 mb-6">
                        <h1 className="text-xl font-semibold text-white mb-3">{issue.title}</h1>
                        <p className="text-gray-400 text-sm mb-5">{issue.description}</p>
                        <div className="grid grid-cols-2 gap-y-3 text-sm">
                            <span className="text-gray-500">Status</span>
                            <StatusBadge status={issue.status} />
                            <span className="text-gray-500">Prioritet</span>
                            <PriorityBadge priority={issue.priority} />
                            <span className="text-gray-500">Rapporterad av</span>
                            <span className="text-gray-300">{issue.reportedByName}</span>
                            <span className="text-gray-500">Tilldelad</span>
                            <span className="text-gray-300">{issue.assignedToName || 'Ej tilldelad'}</span>
                            <span className="text-gray-500">Skapad</span>
                            <span className="text-gray-300">{new Date(issue.createdAt).toLocaleDateString()}</span>
                            <span className="text-gray-500">Uppdaterad</span>
                            <span className="text-gray-300">{new Date(issue.updatedAt).toLocaleDateString()}</span>
                        </div>
                    </div>

                    {/* Comments */}
                    <h2 className="text-white font-medium text-base mb-3">Kommentarer</h2>
                    <div className="flex flex-col gap-3 mb-4">
                        {comments.map(comment => (
                            <div key={comment.id} className="bg-[#1e1f27] border border-gray-700 rounded-xl px-5 py-4">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-indigo-400 text-sm font-medium">{comment.authorName}</span>
                                    <span className="text-gray-600 text-xs">{new Date(comment.createdAt).toLocaleDateString()}</span>
                                </div>
                                <p className="text-gray-300 text-sm">{comment.content}</p>
                            </div>
                        ))}
                    </div>

                    {/* New comment form */}
                    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                        <textarea
                            value={newComment}
                            onChange={e => setNewComment(e.target.value)}
                            placeholder="Skriv en kommentar..."
                            rows={3}
                            className="bg-[#1e1f27] border border-gray-700 text-gray-100 placeholder-gray-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 resize-none"
                        />
                        <div className="flex justify-end">
                            <button
                                type="submit"
                                className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg px-4 py-2.5 text-sm transition-colors"
                            >
                                Skicka
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}