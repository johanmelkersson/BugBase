import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function PrivateRoute() {
    const { auth } = useAuth();

    if (!auth) {
        return <Navigate to="/login" replace />;
    }
    return <Outlet />;
}