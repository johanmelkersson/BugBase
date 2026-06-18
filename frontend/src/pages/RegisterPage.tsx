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
    <form onSubmit={handleSubmit}>
      <input value={username} onChange={e => setUsername(e.target.value)} type="text" placeholder="Username" />
      <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="Email" />
      <input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="Password" />
      <button type="submit">Register</button>
      {error && <p>{error}</p>}
    </form>
  );
}