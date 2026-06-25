import { useRef, useState, useEffect } from 'react';
import type { ProjectMember } from '../types';

const STATUS_OPTIONS = ['Open', 'InProgress', 'Review', 'Closed'];
const PRIORITY_OPTIONS = ['Low', 'Medium', 'High', 'Critical'];

export interface IssueFilterState {
    searchTerm: string;
    statuses: string[];
    priorities: string[];
    assignees: string[];
}

interface Props {
    filters: IssueFilterState;
    onChange: (f: IssueFilterState) => void;
    members: ProjectMember[];
    className?: string;
}

export default function IssueFilters({ filters, onChange, members, className }: Props) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handler(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        }
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    function toggle(key: 'statuses' | 'priorities' | 'assignees', value: string) {
        const current = filters[key];
        const next = current.includes(value)
            ? current.filter(x => x !== value)
            : [...current, value];
        onChange({ ...filters, [key]: next });
    }

    const activeCount = filters.statuses.length + filters.priorities.length + filters.assignees.length;
    const buttonLabel = activeCount > 0 ? `Filters (${activeCount})` : 'Filters';

    const ASSIGNEE_OPTIONS = [
        { value: 'unassigned', label: 'Unassigned' },
        ...members.map(m => ({ value: m.username, label: m.username })),
    ];

    return (
        <div className={className ?? "flex gap-2 mb-3 flex-wrap"}>
            <input
                value={filters.searchTerm}
                onChange={e => onChange({ ...filters, searchTerm: e.target.value })}
                placeholder="Search issues..."
                className="bg-[#1e1f27] border border-gray-700 text-gray-100 placeholder-gray-500 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-indigo-500 flex-1 min-w-32"
            />

            <div ref={ref} className="relative">
                <button
                    onClick={() => setOpen(v => !v)}
                    className={`flex items-center gap-1.5 bg-[#1e1f27] border rounded-lg px-3 py-1.5 text-xs transition-colors ${open || activeCount > 0 ? 'border-indigo-500 text-white' : 'border-gray-700 text-gray-300 hover:border-gray-500'}`}
                >
                    {buttonLabel}
                    <span className="text-gray-500">{open ? '▲' : '▼'}</span>
                </button>

                {open && (
                    <div className="absolute top-full mt-1 right-0 sm:left-0 sm:right-auto bg-[#1e1f27] border border-gray-700 rounded-lg shadow-xl z-20 min-w-[180px]">

                        {/* Status */}
                        <div className="px-3 pt-2.5 pb-1">
                            <p className="text-gray-500 text-[10px] uppercase tracking-wider mb-1.5">Status</p>
                            {STATUS_OPTIONS.map(opt => (
                                <label key={opt} className="flex items-center gap-2.5 py-1.5 hover:bg-white/5 cursor-pointer rounded px-1">
                                    <input
                                        type="checkbox"
                                        checked={filters.statuses.includes(opt)}
                                        onChange={() => toggle('statuses', opt)}
                                        className="accent-indigo-500"
                                    />
                                    <span className="text-gray-300 text-xs">{opt === 'InProgress' ? 'In Progress' : opt}</span>
                                </label>
                            ))}
                        </div>

                        <div className="mx-3 h-px bg-gray-700" />

                        {/* Priority */}
                        <div className="px-3 pt-2 pb-1">
                            <p className="text-gray-500 text-[10px] uppercase tracking-wider mb-1.5">Priority</p>
                            {PRIORITY_OPTIONS.map(opt => (
                                <label key={opt} className="flex items-center gap-2.5 py-1.5 hover:bg-white/5 cursor-pointer rounded px-1">
                                    <input
                                        type="checkbox"
                                        checked={filters.priorities.includes(opt)}
                                        onChange={() => toggle('priorities', opt)}
                                        className="accent-indigo-500"
                                    />
                                    <span className="text-gray-300 text-xs">{opt}</span>
                                </label>
                            ))}
                        </div>

                        <div className="mx-3 h-px bg-gray-700" />

                        {/* Assignee */}
                        <div className="px-3 pt-2 pb-2.5">
                            <p className="text-gray-500 text-[10px] uppercase tracking-wider mb-1.5">Assignee</p>
                            {ASSIGNEE_OPTIONS.map(({ value, label }) => (
                                <label key={value} className="flex items-center gap-2.5 py-1.5 hover:bg-white/5 cursor-pointer rounded px-1">
                                    <input
                                        type="checkbox"
                                        checked={filters.assignees.includes(value)}
                                        onChange={() => toggle('assignees', value)}
                                        className="accent-indigo-500"
                                    />
                                    <span className="text-gray-300 text-xs">{label}</span>
                                </label>
                            ))}
                        </div>

                        {activeCount > 0 && (
                            <>
                                <div className="mx-3 h-px bg-gray-700" />
                                <div className="px-3 py-2">
                                    <button
                                        onClick={() => onChange({ ...filters, statuses: [], priorities: [], assignees: [] })}
                                        className="text-gray-500 hover:text-gray-300 text-xs transition-colors"
                                    >
                                        Clear all filters
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
