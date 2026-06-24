import { useState } from 'react';
import { create } from '../api/projects';
import { useProject } from '../context/ProjectContext';

export default function CreateProjectModal() {
    const { projects, setProjects, setSelectedProject, setShowCreateModal } = useProject();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');

    async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const newProject = await create(name, description);
        setProjects([...projects, newProject]);
        setSelectedProject(newProject);
        setShowCreateModal(false);
        setName('');
        setDescription('');
    }

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="bg-[#1e1f27] border border-gray-700 rounded-xl p-6 w-full max-w-sm mx-4">
                <h3 className="text-white font-semibold mb-4">Create project</h3>
                <form onSubmit={handleCreate} className="flex flex-col gap-3">
                    <input
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="Project name"
                        required
                        autoFocus
                        className="bg-[#13141a] border border-gray-700 text-gray-100 placeholder-gray-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                    />
                    <textarea
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        placeholder="Description"
                        rows={2}
                        className="bg-[#13141a] border border-gray-700 text-gray-100 placeholder-gray-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 resize-none"
                    />
                    <div className="flex gap-2 mt-1">
                        <button type="submit"
                            className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg px-3 py-2 transition-colors">
                            Create
                        </button>
                        <button type="button" onClick={() => setShowCreateModal(false)}
                            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium rounded-lg px-3 py-2 transition-colors">
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}