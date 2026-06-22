import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
    const { auth, logout } = useAuth();
    const navigate = useNavigate();

    function handleLogout() {
        logout();
        navigate('/login');
    }

    return (
        <nav className="bg-[#1e1f27] border-b border-gray-700 px-6 py-3 flex items-center justify-between">
            <Link to="/dashboard" className="text-white font-semibold text-base tracking-tight hover:text-indigo-400 transition-colors">
                BugBase
            </Link>
            <div className="flex items-center gap-4">
                {auth?.role === 'Admin' && (
                    <Link to="/admin" className="text-gray-400 hover:text-white text-sm transition-colors">
                        Admin
                    </Link>
                )}
                <span className="text-gray-400 text-sm">{auth?.username}</span>
                <button
                    onClick={handleLogout}
                    className="text-sm text-gray-400 hover:text-white border border-gray-600 hover:border-gray-400 rounded-lg px-3 py-1.5 transition-colors"
                >
                    Logga ut
                </button>
            </div>
        </nav>
    );
}