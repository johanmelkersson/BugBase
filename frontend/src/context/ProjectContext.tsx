import { createContext, useContext, useState, type Dispatch, type SetStateAction } from 'react';
import type { Project, ProjectMember } from '../types';
import { setCurrentProject as setCurrentProjectApi } from '../api/users';

interface ProjectContextType {
    projects: Project[];
    setProjects: (projects: Project[]) => void;
    selectedProject: Project | null;
    setSelectedProject: (project: Project | null) => void;
    resetProject: () => void;
    showCreateModal: boolean;
    setShowCreateModal: (v: boolean) => void;
    myProjectRole: string | null;
    setMyProjectRole: (role: string | null) => void;
    projectMembers: ProjectMember[];
    setProjectMembers: Dispatch<SetStateAction<ProjectMember[]>>;
}

const ProjectContext = createContext<ProjectContextType | null>(null);

export function ProjectProvider({ children }: { children: React.ReactNode }) {
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProject, setSelectedProjectState] = useState<Project | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [myProjectRole, setMyProjectRole] = useState<string | null>(null);
    const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([]);

    const setSelectedProject = (project: Project | null) => {
        setSelectedProjectState(project);
        setMyProjectRole(null);
        setProjectMembers([]);
        setCurrentProjectApi(project?.id ?? null).catch(() => {});
    };

    const resetProject = () => {
        setSelectedProjectState(null);
        setMyProjectRole(null);
        setProjectMembers([]);
        setProjects([]);
    };

    return (
        <ProjectContext.Provider value={{ projects, setProjects, selectedProject, setSelectedProject, resetProject, showCreateModal, setShowCreateModal, myProjectRole, setMyProjectRole, projectMembers, setProjectMembers }}>
            {children}
        </ProjectContext.Provider>
    );
}

export function useProject() {
    const ctx = useContext(ProjectContext);
    if (!ctx) throw new Error('useProject must be used within ProjectProvider');
    return ctx;
}
