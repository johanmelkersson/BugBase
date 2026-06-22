import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from './Navbar';

export default function PrivateRoute() {
    const { auth } = useAuth();

    if (!auth) {
        return <Navigate to="/login" replace />;
    }

    return (
        <div className="min-h-screen bg-[#16171d]">
            <Navbar />
            <main className="max-w-5xl mx-auto px-6 py-8">
                <Outlet />
            </main>
        </div>
    );
}