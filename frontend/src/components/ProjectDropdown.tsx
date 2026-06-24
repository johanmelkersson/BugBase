import { useState, useRef, useEffect } from 'react';
import { useProject } from '../context/ProjectContext';

export default function ProjectDropdown() {
    const { projects, selectedProject, setSelectedProject, setShowCreateModal } = useProject();
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    function handleSelect(project: typeof projects[0]) {
        setSelectedProject(project);
        setOpen(false);
    }

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setOpen(prev => !prev)}
                className="flex items-center gap-2 px-3 py-1.5 bg-[#1e1f27] border border-gray-700 rounded-lg text-sm text-gray-200 hover:border-indigo-500 transition-colors min-w-40"
            >
                <span className="flex-1 text-left truncate">
                    {selectedProject ? selectedProject.name : 'Välj projekt'}
                </span>
                <span className="text-gray-500">▾</span>
            </button>

            {open && (
                <div className="absolute left-0 top-full mt-1 w-64 bg-[#1e1f27] border border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden">
                    {projects.map(p => (
                        <button
                            key={p.id}
                            onClick={() => handleSelect(p)}
                            className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-[#13141a] ${selectedProject?.id === p.id ? 'text-indigo-400' : 'text-gray-300'}`}
                        >
                            {p.name}
                        </button>
                    ))}
                    <div className="border-t border-gray-700">
                        <button
                            onClick={() => { setShowCreateModal(true); setOpen(false); }}
                            className="w-full text-left px-4 py-2.5 text-sm text-indigo-400 hover:bg-[#13141a] transition-colors"
                        >
                            + Nytt projekt
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}