import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useProject } from '../context/ProjectContext';
import { login as loginApi } from '../api/auth';
import { getProjects } from '../api/projects';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const { login } = useAuth();
    const { setProjects, setSelectedProject } = useProject();
    const navigate = useNavigate();

    async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
        e.preventDefault();
        try {
            const response = await loginApi(email, password);
            const savedProjectId = login(response.token, response.username, response.role, response.email, response.currentProjectId, response.color);
            const projects = await getProjects();
            setProjects(projects);
            if (savedProjectId) {
                const found = projects.find(p => p.id === savedProjectId);
                if (found) setSelectedProject(found);
                else setSelectedProject(null);
            }
            navigate('/workspace');
        } catch (error: any) {
            setError(error.response?.data?.message || 'Login failed');
        }
    }

    return (
        <div className="min-h-screen bg-[#16171d] flex items-center justify-center px-4">
            <div className="w-full max-w-sm bg-[#1e1f27] border border-gray-700 rounded-xl p-8">
                <h1 className="text-2xl font-semibold text-white mb-1">Sign in</h1>
                <p className="text-gray-400 text-sm mb-6">BugBase</p>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <input
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        type="email"
                        placeholder="Email"
                        className="bg-[#13141a] border border-gray-700 text-gray-100 placeholder-gray-500 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500"
                    />
                    <input
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        type="password"
                        placeholder="Password"
                        className="bg-[#13141a] border border-gray-700 text-gray-100 placeholder-gray-500 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500"
                    />
                    <button
                        type="submit"
                        className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg py-2.5 text-sm transition-colors"
                    >
                        Sign in
                    </button>
                    {error && <p className="text-red-400 text-sm">{error}</p>}
                </form>

                <p className="text-gray-500 text-sm mt-6 text-center">
                    No account?{' '}
                    <a href="/register" className="text-indigo-400 hover:text-indigo-300">Register</a>
                </p>
            </div>
        </div>
    );
}