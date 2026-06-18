import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getById } from '../api/issues';
import type { Issue } from '../types';

export default function IssuePage() {
  const { id } = useParams();
  const [issue, setIssue] = useState<Issue | null>(null);

    useEffect(() => {
        async function fetchIssue() {
            const data = await getById(Number(id));
            setIssue(data);
        }
        fetchIssue();
    }, [id]);


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
        </div>
      )}
    </div>
  );

}