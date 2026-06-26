import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProjectProvider, useProject } from './context/ProjectContext';
import { getMe } from './api/users';
import { getProjects } from './api/projects';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import WorkspacePage from './pages/WorkspacePage';
import PrivateRoute from './components/PrivateRoute';
import SettingsPage from './pages/SettingsPage';
import CreateProjectModal from './components/CreateProjectModal';

function AppInit() {
    const { auth } = useAuth();
    const { setProjects, setSelectedProject } = useProject();

    useEffect(() => {
        if (!auth) return;
        (async () => {
            try {
                const [me, projects] = await Promise.all([getMe(), getProjects()]);
                setProjects(projects);
                if (me.currentProjectId) {
                    const found = projects.find(p => p.id === me.currentProjectId);
                    if (found) setSelectedProject(found);
                }
            } catch {
                // token expired or invalid — PrivateRoute will redirect to login
            }
        })();
    }, []);

    return null;
}

function ModalHost() {
    const { showCreateModal } = useProject();
    return showCreateModal ? <CreateProjectModal /> : null;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ProjectProvider>
          <AppInit />
          <ModalHost />
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route element={<PrivateRoute />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/workspace" element={<WorkspacePage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/login" />} />
          </Routes>
        </ProjectProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;