
export function StatusBadge({ status }: { status: string }) {
    const styles: Record<string, string> = {
        Open: 'bg-blue-500/15 text-blue-400',
        InProgress: 'bg-yellow-500/15 text-yellow-400',
        Review: 'bg-purple-500/15 text-purple-400',
        Closed: 'bg-green-500/15 text-green-400',
    };
    return (
        <span className={`px-2 py-0.5 rounded-full font-medium ${styles[status] ?? 'bg-gray-700 text-gray-400'}`}>
            {status}
        </span>
    );
}

export function PriorityBadge({ priority }: { priority: string }) {
    const styles: Record<string, string> = {
        Low: 'bg-gray-700 text-gray-400',
        Medium: 'bg-orange-500/15 text-orange-400',
        High: 'bg-red-500/15 text-red-400',
        Critical: 'bg-red-600/30 text-red-300',
    };
    return (
        <span className={`px-2 py-0.5 rounded-full font-medium ${styles[priority] ?? 'bg-gray-700 text-gray-400'}`}>
            {priority}
        </span>
    );
}