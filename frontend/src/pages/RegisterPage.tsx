import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { register as registerApi } from '../api/auth';

export default function RegisterPage() {

    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const { login } = useAuth();
    const navigate = useNavigate();

    async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
        e.preventDefault();
        try {
            const response = await registerApi(username, email, password);
            login(response.token, response.username, response.role);
            navigate('/dashboard');
        } catch (error: any) {
            setError(error.response?.data?.message || 'Registration failed');
        }
    }

  return (
  <div className="min-h-screen bg-[#16171d] flex items-center justify-center px-4">
    <div className="w-full max-w-sm bg-[#1e1f27] border border-gray-700 rounded-xl p-8">
      <h1 className="text-2xl font-semibold text-white mb-1">Skapa konto</h1>
      <p className="text-gray-400 text-sm mb-6">BugBase</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          value={username}
          onChange={e => setUsername(e.target.value)}
          type="text"
          placeholder="Användarnamn"
          className="bg-[#13141a] border border-gray-700 text-gray-100 placeholder-gray-500 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500"
        />
        <input
          value={email}
          onChange={e => setEmail(e.target.value)}
          type="email"
          placeholder="E-post"
          className="bg-[#13141a] border border-gray-700 text-gray-100 placeholder-gray-500 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500"
        />
        <input
          value={password}
          onChange={e => setPassword(e.target.value)}
          type="password"
          placeholder="Lösenord"
          className="bg-[#13141a] border border-gray-700 text-gray-100 placeholder-gray-500 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500"
        />
        <button
          type="submit"
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg py-2.5 text-sm transition-colors"
        >
          Registrera
        </button>
        {error && <p className="text-red-400 text-sm">{error}</p>}
      </form>

      <p className="text-gray-500 text-sm mt-6 text-center">
        Har du redan ett konto?{' '}
        <a href="/login" className="text-indigo-400 hover:text-indigo-300">Logga in</a>
      </p>
    </div>
  </div>
);

}