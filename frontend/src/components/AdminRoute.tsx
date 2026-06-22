import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AdminRoute() {
    const { auth } = useAuth();

    if (!auth) {
        return <Navigate to="/login" replace />;
    }
    if (auth.role !== "Admin")
        return <Navigate to="/dashboard" replace />;
    
    return <Outlet />;
}