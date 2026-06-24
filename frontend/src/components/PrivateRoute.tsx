import { Navigate, Outlet } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useProject } from '../context/ProjectContext';
import { getProjects } from '../api/projects';
import Navbar from './Navbar';

export default function PrivateRoute() {
    const { auth } = useAuth();
    const { setProjects } = useProject();

    useEffect(() => {
        if (auth) {
            getProjects().then(setProjects);
        }
    }, [auth]);

    if (!auth) {
        return <Navigate to="/login" replace />;
    }

    return (
        <div className="min-h-screen bg-[#16171d]">
            <Navbar />
            <Outlet />
        </div>
    );
}