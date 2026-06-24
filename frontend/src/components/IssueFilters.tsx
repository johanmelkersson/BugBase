import { useRef, useState, useEffect } from 'react';
import type { ProjectMember } from '../types';

const STATUS_OPTIONS = ['Open', 'InProgress', 'Review', 'Closed'];
const PRIORITY_OPTIONS = ['Low', 'Medium', 'High', 'Critical'];

export interface IssueFilterState {
    searchTerm: string;
    statuses: string[];
    priorities: string[];
    assignee: string;
}

interface CheckboxDropdownProps {
    label: string;
    options: string[];
    selected: string[];
    onToggle: (value: string) => void;
    display?: (value: string) => string;
}

function CheckboxDropdown({ label, options, selected, onToggle, display }: CheckboxDropdownProps) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const activeLabel = selected.length === 0
        ? label
        : selected.length === 1
            ? (display ? display(selected[0]) : selected[0])
            : `${label} (${selected.length})`;

    return (
        <div ref={ref} className="relative">
            <button
                onClick={() => setOpen(v => !v)}
                className={`flex items-center gap-1.5 bg-[#1e1f27] border rounded-lg px-3 py-1.5 text-xs focus:outline-none transition-colors ${open || selected.length > 0 ? 'border-indigo-500 text-white' : 'border-gray-700 text-gray-300 hover:border-gray-500'}`}
            >
                {activeLabel}
                <span className="text-gray-500">{open ? '▲' : '▼'}</span>
            </button>
            {open && (
                <div className="absolute top-full mt-1 left-0 bg-[#1e1f27] border border-gray-700 rounded-lg shadow-xl z-20 min-w-[140px]">
                    {options.map(opt => (
                        <label key={opt} className="flex items-center gap-2.5 px-3 py-2 hover:bg-white/5 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={selected.includes(opt)}
                                onChange={() => onToggle(opt)}
                                className="accent-indigo-500"
                            />
                            <span className="text-gray-300 text-xs">{display ? display(opt) : opt}</span>
                        </label>
                    ))}
                </div>
            )}
        </div>
    );
}

interface Props {
    filters: IssueFilterState;
    onChange: (f: IssueFilterState) => void;
    members: ProjectMember[];
}

export default function IssueFilters({ filters, onChange, members }: Props) {
    function toggleStatus(s: string) {
        const next = filters.statuses.includes(s)
            ? filters.statuses.filter(x => x !== s)
            : [...filters.statuses, s];
        onChange({ ...filters, statuses: next });
    }

    function togglePriority(p: string) {
        const next = filters.priorities.includes(p)
            ? filters.priorities.filter(x => x !== p)
            : [...filters.priorities, p];
        onChange({ ...filters, priorities: next });
    }

    return (
        <div className="flex gap-2 mb-3 flex-wrap">
            <input
                value={filters.searchTerm}
                onChange={e => onChange({ ...filters, searchTerm: e.target.value })}
                placeholder="Search issues..."
                className="bg-[#1e1f27] border border-gray-700 text-gray-100 placeholder-gray-500 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-indigo-500 flex-1 min-w-32"
            />
            <CheckboxDropdown
                label="Status"
                options={STATUS_OPTIONS}
                selected={filters.statuses}
                onToggle={toggleStatus}
                display={v => v === 'InProgress' ? 'In Progress' : v}
            />
            <CheckboxDropdown
                label="Priority"
                options={PRIORITY_OPTIONS}
                selected={filters.priorities}
                onToggle={togglePriority}
            />
            <select
                value={filters.assignee}
                onChange={e => onChange({ ...filters, assignee: e.target.value })}
                className="bg-[#1e1f27] border border-gray-700 text-gray-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-indigo-500"
            >
                <option value="">All assignees</option>
                <option value="unassigned">Unassigned</option>
                {members.map(m => <option key={m.id} value={m.username}>{m.username}</option>)}
            </select>
        </div>
    );
}
