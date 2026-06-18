
export interface User {
  id: number;
  username: string;
  email: string;
  role: string;
}

export interface Project {
  id: number;
  title: string;
  description: string;
  createdAt: Date;
  createdBy: number;
}

export interface Issue {
  id: number;
  projectId: number;
  title: string;
  description: string;
  status: string;
  priority: string;
  reportedByName: string;
  assignedToName : string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateIssue {
  title?: string;
  description?: string;
  status?: string;
  priority?: string;
  assignedTo?: number | null;
}
